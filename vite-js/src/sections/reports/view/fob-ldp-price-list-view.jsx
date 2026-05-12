import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Select,
  MenuItem,
  Container,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import { fetchLdpFobReportRows } from 'src/sections/reports/utils/ldp-fob-report-api';
import {
  buildLdpFobCsvFromRows,
  buildLdpFobPdfBlobFromRows,
  openLdpFobDemoDownload,
} from 'src/sections/reports/utils/ldp-fob-demo-export';

// ----------------------------------------------------------------------

const ALL = 'all';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const REPORT_CUSTOMERS_PATH =
  import.meta.env.VITE_REPORT_FOB_LDP_CUSTOMERS_PATH || '/api/MyOrders/GetCustomer';
const REPORT_SUPPLIERS_PATH =
  import.meta.env.VITE_REPORT_FOB_LDP_SUPPLIERS_PATH || '/api/MyOrders/GetSupplier';
const REPORT_MERCHANTS_PATH =
  import.meta.env.VITE_REPORT_FOB_LDP_MERCHANTS_PATH || '/api/MyOrders/GetMerchants';

/** Set to `false` when Excel (CSV) download should work again on this page. */
const DISABLE_LDP_FOB_EXCEL_DOWNLOAD = true;

/** Show immediate feedback in the tab opened synchronously on click (avoids blank tab before blob is ready). */
function writePdfPreviewPlaceholder(previewWindow) {
  try {
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Loading PDF…</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fafafa;color:#333;"><p style="padding:24px;font-size:15px;">Loading PDF…</p></body></html>`;
    previewWindow.document.open();
    previewWindow.document.write(html);
    previewWindow.document.close();
  } catch (e) {
    console.warn('[FOB/LDP] preview placeholder', e);
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Ensures client-built PDF blob is non-empty and starts with %PDF (browser can render it). */
async function assertValidPdfBlob(blob) {
  if (!(blob instanceof Blob)) {
    throw new Error('Report could not be generated: invalid file data.');
  }
  if (blob.size < 32) {
    throw new Error('Report could not be generated: PDF output is empty or too small.');
  }
  const sample = await blob.slice(0, 5).arrayBuffer();
  const head = new TextDecoder('latin1').decode(sample);
  if (!head.startsWith('%PDF')) {
    throw new Error('Report could not be generated: output is not a valid PDF document.');
  }
}

function joinApiUrl(base, path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function normalizeArrayPayload(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
}

function customerKey(row) {
  const id = row?.customerID ?? row?.customerId ?? row?.CustomerID;
  return id != null && id !== '' ? String(id) : '';
}

function supplierKey(row) {
  const id = row?.venderLibraryID ?? row?.venderLibraryId ?? row?.VenderLibraryID;
  return id != null && id !== '' ? String(id) : '';
}

function merchantKey(row) {
  const id = row?.userId ?? row?.userID ?? row?.UserId ?? row?.id ?? row?.ID;
  return id != null && id !== '' ? String(id) : '';
}

function customerLabel(row) {
  return String(row?.customerName ?? row?.CustomerName ?? row?.name ?? '').trim() || '—';
}

function supplierLabel(row) {
  return String(row?.venderName ?? row?.VenderName ?? row?.vendorName ?? '').trim() || '—';
}

function merchantLabel(row) {
  return String(row?.userName ?? row?.UserName ?? row?.name ?? '').trim() || '—';
}

export default function FobLdpPriceListView() {
  const { enqueueSnackbar } = useSnackbar();
  const year = new Date().getFullYear();

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingMerchants, setLoadingMerchants] = useState(false);
  const [exporting, setExporting] = useState(null);

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    merchandiser: ALL,
    poScope: ALL,
    searchBy: 'poNo',
    poNo: '',
    style: '',
    fromDate: `${year}-01-01`,
    toDate: `${year}-12-31`,
  });

  const handleSelect =
    (name) =>
    (e) => {
      setFilters((prev) => ({ ...prev, [name]: e.target.value }));
    };

  const handleText =
    (name) =>
    (e) => {
      setFilters((prev) => ({ ...prev, [name]: e.target.value }));
    };

  const runExport = useCallback(
    async (mode, opts = {}) => {
      if (!filters.fromDate || !filters.toDate) {
        enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
        return;
      }
      if (!ISO_DATE_RE.test(filters.fromDate) || !ISO_DATE_RE.test(filters.toDate)) {
        enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
        return;
      }
      if (!API_BASE_URL) {
        enqueueSnackbar('API URL missing: set VITE_API_BASE_URL in .env', { variant: 'error' });
        return;
      }

      if (mode === 'view' && !opts.previewWindow) {
        enqueueSnackbar('Open the report using the View Report button.', { variant: 'warning' });
        return;
      }

      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      setExporting(mode);
      try {
        const raw = await fetchLdpFobReportRows(
          {
            fromDate: filters.fromDate,
            toDate: filters.toDate,
            customerId: filters.customer === ALL ? '0' : filters.customer,
            supplierId: filters.supplier === ALL ? '0' : filters.supplier,
            pono: String(filters.poNo ?? '').trim(),
            styleNo: String(filters.style ?? '').trim(),
          },
          headers
        );

        if (mode === 'excel') {
          const csv = buildLdpFobCsvFromRows(raw);
          openLdpFobDemoDownload('excel', null, csv);
          enqueueSnackbar(raw.length ? 'CSV download started' : 'No data — empty CSV', {
            variant: 'success',
          });
          return;
        }

        const pdfBlob = await buildLdpFobPdfBlobFromRows(raw);
        await assertValidPdfBlob(pdfBlob);

        if (mode === 'view') {
          const { previewWindow } = opts;
          if (previewWindow.closed) {
            enqueueSnackbar('The preview tab was closed before the PDF finished loading.', {
              variant: 'warning',
            });
            return;
          }
          const blobUrl = URL.createObjectURL(pdfBlob);
          try {
            previewWindow.location.replace(blobUrl);
          } catch (navErr) {
            URL.revokeObjectURL(blobUrl);
            throw navErr;
          }
          previewWindow.focus?.();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 600_000);
          enqueueSnackbar(
            raw.length ? 'PDF opened in new tab' : 'PDF opened (no row data for selected filters)',
            { variant: 'success' }
          );
        } else {
          openLdpFobDemoDownload(mode, pdfBlob, null);
          enqueueSnackbar('PDF download started', { variant: 'success' });
        }
      } catch (err) {
        console.error('[FOB/LDP] export', err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          (typeof err?.response?.data === 'string' ? err.response.data : null) ||
          err?.message ||
          'Report failed';
        enqueueSnackbar(msg, { variant: 'error' });

        if (mode === 'view' && opts.previewWindow && !opts.previewWindow.closed) {
          try {
            const doc = opts.previewWindow.document;
            doc.open();
            doc.write(
              `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>PDF could not load</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;"><strong>Could not open PDF</strong></p><p style="padding:0 24px 24px;">${escapeHtml(msg)}</p></body></html>`
            );
            doc.close();
          } catch (writeErr) {
            console.warn('[FOB/LDP] preview error page', writeErr);
          }
        }
      } finally {
        setExporting(null);
      }
    },
    [enqueueSnackbar, filters]
  );

  const handleViewReport = useCallback(() => {
    if (!filters.fromDate || !filters.toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    if (!ISO_DATE_RE.test(filters.fromDate) || !ISO_DATE_RE.test(filters.toDate)) {
      enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
      return;
    }
    if (!API_BASE_URL) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL in .env', { variant: 'error' });
      return;
    }

    const previewWindow = window.open('about:blank', '_blank');
    if (!previewWindow) {
      enqueueSnackbar(
        'Unable to open a new tab — your browser may have blocked the pop-up. Allow pop-ups for this site and try again.',
        { variant: 'error' }
      );
      return;
    }

    writePdfPreviewPlaceholder(previewWindow);
    void runExport('view', { previewWindow });
  }, [enqueueSnackbar, filters, runExport]);

  const handleDownloadPdf = useCallback(() => runExport('pdf'), [runExport]);

  const handleDownloadExcel = useCallback(() => runExport('excel'), [runExport]);

  useEffect(() => {
    if (!API_BASE_URL) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL in .env', { variant: 'warning' });
      return undefined;
    }

    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let cancelled = false;

    (async () => {
      setLoadingCustomers(true);
      setLoadingSuppliers(true);
      setLoadingMerchants(true);

      const urls = [
        joinApiUrl(API_BASE_URL, REPORT_CUSTOMERS_PATH),
        joinApiUrl(API_BASE_URL, REPORT_SUPPLIERS_PATH),
        joinApiUrl(API_BASE_URL, REPORT_MERCHANTS_PATH),
      ];

      const settled = await Promise.allSettled([
        axios.get(urls[0], { headers }),
        axios.get(urls[1], { headers }),
        axios.get(urls[2], { headers }),
      ]);

      if (cancelled) return;

      const [cRes, sRes, mRes] = settled;

      if (cRes.status === 'fulfilled') {
        setCustomers(normalizeArrayPayload(cRes.value?.data));
      } else {
        console.error('[FOB/LDP] customers', cRes.reason);
        setCustomers([]);
        enqueueSnackbar('Could not load customers', { variant: 'error' });
      }

      if (sRes.status === 'fulfilled') {
        setSuppliers(normalizeArrayPayload(sRes.value?.data));
      } else {
        console.error('[FOB/LDP] suppliers', sRes.reason);
        setSuppliers([]);
        enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      }

      if (mRes.status === 'fulfilled') {
        setMerchants(normalizeArrayPayload(mRes.value?.data));
      } else {
        console.error('[FOB/LDP] merchants', mRes.reason);
        setMerchants([]);
        enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      }

      setLoadingCustomers(false);
      setLoadingSuppliers(false);
      setLoadingMerchants(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };

      if (
        prev.customer !== ALL &&
        !customers.some((r) => customerKey(r) === prev.customer)
      ) {
        next.customer = ALL;
        changed = true;
      }
      if (
        prev.supplier !== ALL &&
        !suppliers.some((r) => supplierKey(r) === prev.supplier)
      ) {
        next.supplier = ALL;
        changed = true;
      }
      if (
        prev.merchandiser !== ALL &&
        !merchants.some((r) => merchantKey(r) === prev.merchandiser)
      ) {
        next.merchandiser = ALL;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants]);

  const selectSx = { borderRadius: 1 };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="LDP and FOB Report"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Reports', href: paths.dashboard.reports.root },
          { name: 'FOB LDP PRICE LIST' },
        ]}
        sx={{ mb: 3 }}
      />

      <Card
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 1,
          boxShadow: (theme) =>
            theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
          LDP and FOB Report
        </Typography>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl
                fullWidth
                size="small"
                sx={{ flex: 1, minWidth: 0 }}
                disabled={loadingCustomers && customers.length === 0}
              >
                <InputLabel id="fob-customer-label">Customer</InputLabel>
                <Select
                  labelId="fob-customer-label"
                  label="Customer"
                  value={filters.customer}
                  onChange={handleSelect('customer')}
                  sx={selectSx}
                >
                  <MenuItem value={ALL}>All Customer</MenuItem>
                  {customers.map((row) => {
                    const val = customerKey(row);
                    if (!val) return null;
                    return (
                      <MenuItem key={val} value={val}>
                        {customerLabel(row)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              {loadingCustomers ? <CircularProgress size={22} /> : null}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl
                fullWidth
                size="small"
                sx={{ flex: 1, minWidth: 0 }}
                disabled={loadingSuppliers && suppliers.length === 0}
              >
                <InputLabel id="fob-supplier-label">Supplier</InputLabel>
                <Select
                  labelId="fob-supplier-label"
                  label="Supplier"
                  value={filters.supplier}
                  onChange={handleSelect('supplier')}
                  sx={selectSx}
                >
                  <MenuItem value={ALL}>All Supplier</MenuItem>
                  {suppliers.map((row) => {
                    const val = supplierKey(row);
                    if (!val) return null;
                    return (
                      <MenuItem key={val} value={val}>
                        {supplierLabel(row)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              {loadingSuppliers ? <CircularProgress size={22} /> : null}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl
                fullWidth
                size="small"
                sx={{ flex: 1, minWidth: 0 }}
                disabled={loadingMerchants && merchants.length === 0}
              >
                <InputLabel id="fob-merch-label">Merchandiser</InputLabel>
                <Select
                  labelId="fob-merch-label"
                  label="Merchandiser"
                  value={filters.merchandiser}
                  onChange={handleSelect('merchandiser')}
                  sx={selectSx}
                >
                  <MenuItem value={ALL}>All Merchandiser</MenuItem>
                  {merchants.map((row) => {
                    const val = merchantKey(row);
                    if (!val) return null;
                    return (
                      <MenuItem key={val} value={val}>
                        {merchantLabel(row)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              {loadingMerchants ? <CircularProgress size={22} /> : null}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="fob-po-scope-label">PO #</InputLabel>
              <Select
                labelId="fob-po-scope-label"
                label="PO #"
                value={filters.poScope}
                onChange={handleSelect('poScope')}
                sx={selectSx}
              >
                <MenuItem value={ALL}>All</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="fob-search-by-label">Search By</InputLabel>
              <Select
                labelId="fob-search-by-label"
                label="Search By"
                value={filters.searchBy}
                onChange={handleSelect('searchBy')}
                sx={selectSx}
              >
                <MenuItem value="poNo">PO NO</MenuItem>
                <MenuItem value="style">Style</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              PO NO
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={filters.poNo}
              onChange={handleText('poNo')}
              placeholder=""
              sx={selectSx}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Style
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={filters.style}
              onChange={handleText('style')}
              placeholder=""
              sx={selectSx}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              From
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={filters.fromDate}
              onChange={handleText('fromDate')}
              InputLabelProps={{ shrink: true }}
              sx={selectSx}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              To
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={filters.toDate}
              onChange={handleText('toDate')}
              InputLabelProps={{ shrink: true }}
              sx={selectSx}
            />
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                mt: 1,
                justifyContent: { xs: 'flex-start', sm: 'flex-start' },
              }}
            >
              <Button
                variant="contained"
                color="primary"
                size="medium"
                disabled={!!exporting}
                onClick={handleViewReport}
                sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
              >
                {exporting === 'view' ? <CircularProgress size={22} color="inherit" /> : 'View Report'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="medium"
                disabled={!!exporting}
                onClick={handleDownloadPdf}
                sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
              >
                {exporting === 'pdf' ? <CircularProgress size={22} color="inherit" /> : 'Download PDF'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="medium"
                disabled={DISABLE_LDP_FOB_EXCEL_DOWNLOAD || !!exporting}
                title={
                  DISABLE_LDP_FOB_EXCEL_DOWNLOAD
                    ? 'Excel download is disabled for now'
                    : undefined
                }
                onClick={handleDownloadExcel}
                sx={{ minWidth: 160, textTransform: 'none', fontWeight: 600 }}
              >
                {exporting === 'excel' ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  'Download Excel'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Container>
  );
}
