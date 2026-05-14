import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
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

import {
  fetchMilestoneSummaryDropdowns,
  getMilestoneSummaryDropdownApiBase,
  milestoneCustomerKey,
  milestoneCustomerLabel,
  milestoneMerchantKey,
  milestoneMerchantLabel,
  milestoneSupplierKey,
  milestoneSupplierLabel,
} from 'src/sections/reports/utils/milestone-summary-dropdown-api';
import { fetchPoNumbers } from 'src/sections/reports/utils/pono-dropdown-api';
import {
  buildShipmentTrackingReportPdfBlob,
  openShipmentTrackingReportPdf,
} from 'src/sections/reports/utils/shipment-tracking-report-pdf-export';
import {
  buildCommissionInvoiceReportPdfBlob,
  openCommissionInvoiceReportPdf,
  commissionInvoiceMonthLabel,
} from 'src/sections/reports/utils/commission-invoice-report-pdf-export';
import {
  buildShipmentHistoryReportPdfBlob,
  openShipmentHistoryReportPdf,
  shipmentHistoryHeaderDate,
} from 'src/sections/reports/utils/shipment-history-report-pdf-export';
import {
  buildAfterShipmentReportPdfBlob,
  openAfterShipmentReportPdf,
  afterShipmentHeaderDate,
} from 'src/sections/reports/utils/after-shipment-report-pdf-export';
import {
  buildShipmentDelayReportPdfBlob,
  openShipmentDelayReportPdf,
} from 'src/sections/reports/utils/shipment-delay-report-pdf-export';
import {
  buildProductComparisionReportPdfBlob,
  openProductComparisionReportPdf,
} from 'src/sections/reports/utils/product-comparision-report-pdf-export';
import {
  buildShippedDelayOnTimeReportPdfBlob,
  openShippedDelayOnTimeReportPdf,
  shippedDelayHeaderDate,
} from 'src/sections/reports/utils/shipped-delay-ontime-report-pdf-export';
import {
  buildShippedNotCloseStatusReportPdfBlob,
  openShippedNotCloseStatusReportPdf,
  shippedNotCloseHeaderDate,
} from 'src/sections/reports/utils/shipped-not-close-status-report-pdf-export';

// ----------------------------------------------------------------------

/**
 * Sidebar entries for the Shipment hub. Labels mirror the legacy report names exactly
 * (including spelling like "Commision" / "Comparision") so URL slugs stay stable when
 * backend wiring lands later.
 */
export const SHIPMENT_REPORT_OPTIONS = [
  { id: 'shipment-tracking-report', label: 'Shipment & Tracking Report' },
  { id: 'commision-invoice-report', label: 'Commision Invoice Report' },
  { id: 'shipment-history-report', label: 'SHIPMENT HISTORY REPORT' },
  { id: 'after-shipment-report', label: 'AFTER SHIPMENT REPORT' },
  { id: 'shipment-delay-report', label: 'SHIPMENT DELAY REPORT' },
  { id: 'product-comparision', label: 'Product Comparision' },
  { id: 'shipped-delay-or-ontime-report', label: 'Shipped Delay Or OnTime Report' },
  { id: 'shipped-not-close-status-report', label: 'Shipped Not Close Status Report' },
];

const DEFAULT_REPORT_ID = 'shipment-tracking-report';
const REPORT_QUERY_KEY = 'report';

const ALL = 'all';

function shipmentAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const cardSx = {
  p: { xs: 2, sm: 3 },
  borderRadius: 1,
  boxShadow: (theme) =>
    theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
};

const selectSx = { borderRadius: 1 };

const sectionLabelSx = {
  mb: 1,
  fontWeight: 600,
  color: 'text.secondary',
};

// ----------------------------------------------------------------------
// Shipment & Tracking Report (default landing form)
// ----------------------------------------------------------------------

/**
 * Default Shipment hub form — three filter rows + centered action buttons.
 * Customer / Supplier / Merchandiser come from the shared Milestone Summary
 * env-backed dropdown API. Container No. / PO No / Style No are free-text
 * inputs (per spec) and Shipment Mode is a placeholder select until the
 * backend list is confirmed.
 */
function ShipmentTrackingReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    merchandiser: ALL,
    containerNo: '',
    poNo: '',
    styleNo: '',
    shipmentMode: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleText = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the Shipment & Documents Tracking PDF blob (demo data for now — the
   * backend payload will share the same shape) and either preview-tab it or
   * trigger a direct file download.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildShipmentTrackingReportPdfBlob({
          printedBy: '',
          fromDate: filters.fromDate,
          toDate: filters.toDate,
        });
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openShipmentTrackingReportPdf(mode, blob);
      } catch (err) {
        console.error('[ShipmentTracking] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Shipment Tracking PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [filters.fromDate, filters.toDate, generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Shipment filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(shipmentAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[Shipment] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** If a chosen key disappears from the latest API list, reset back to "All". */
  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (prev.customer !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev.customer)) {
        next.customer = ALL;
        changed = true;
      }
      if (prev.supplier !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) {
        next.supplier = ALL;
        changed = true;
      }
      if (
        prev.merchandiser !== ALL &&
        !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)
      ) {
        next.merchandiser = ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Shipment Tracking Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Customer :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.customer}
              onChange={handleSelect('customer')}
              sx={selectSx}
              disabled={loadingDropdowns && customers.length === 0}
            >
              <MenuItem value={ALL}>All Customer</MenuItem>
              {customers
                .filter((row) => milestoneCustomerKey(row))
                .map((row) => {
                  const val = milestoneCustomerKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneCustomerLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={loadingDropdowns && suppliers.length === 0}
            >
              <MenuItem value={ALL}>All Vendor</MenuItem>
              {suppliers
                .filter((row) => milestoneSupplierKey(row))
                .map((row) => {
                  const val = milestoneSupplierKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneSupplierLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Merchandiser :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.merchandiser}
              onChange={handleSelect('merchandiser')}
              sx={selectSx}
              disabled={loadingDropdowns && merchants.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {merchants
                .filter((row) => milestoneMerchantKey(row))
                .map((row) => {
                  const val = milestoneMerchantKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneMerchantLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Container No. :
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={filters.containerNo}
            onChange={handleText('containerNo')}
            placeholder=""
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            PO No :
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

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Style No :
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={filters.styleNo}
            onChange={handleText('styleNo')}
            placeholder=""
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Shipment Mode :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.shipmentMode}
              onChange={handleSelect('shipmentMode')}
              sx={selectSx}
            >
              <MenuItem value={ALL}>All</MenuItem>
              <MenuItem value="BY AIR">BY AIR</MenuItem>
              <MenuItem value="BY SEA">BY SEA</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            From :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.fromDate}
            onChange={handleDate('fromDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            To :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.toDate}
            onChange={handleDate('toDate')}
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
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Commision Invoice Report — "Logistic Department Shipped Status Download"
// ----------------------------------------------------------------------

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

/** Year list: current year ± 5 (newest first) — matches the typical legacy range. */
function buildYearOptions() {
  const now = new Date().getFullYear();
  const start = now - 5;
  const end = now + 5;
  const years = [];
  for (let y = end; y >= start; y -= 1) years.push(y);
  return years;
}

/**
 * "Logistic Department Shipped Status Download" form.
 *
 * 2 × 3 filter grid (Consignee, Month, Year / Supplier, Merchandiser, PO #) +
 * centered action row (View Report, Download PDF, Download Excel) + a small
 * italicized footnote — exactly per the legacy mock-up.
 *
 * Dropdowns are wired to the shared APIs:
 *   - Customer / Supplier / Merchandiser  →  fetchMilestoneSummaryDropdowns
 *   - PO #                                →  fetchPoNumbers (scoped by selected
 *                                            Customer + Supplier)
 *
 * Action buttons currently toast — they'll hook into the real backend endpoint
 * once it's confirmed, just like the rest of the Shipment hub.
 */
function CommisionInvoiceReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const now = new Date();
  const [filters, setFilters] = useState({
    consignee: ALL,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    supplier: ALL,
    merchandiser: ALL,
    po: ALL,
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const [poNumbers, setPoNumbers] = useState([]);
  const [loadingPoNumbers, setLoadingPoNumbers] = useState(false);

  const yearOptions = useMemo(buildYearOptions, []);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the Commission Invoice PDF (demo data for now) and either preview-tab
   * it or trigger a direct file download.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildCommissionInvoiceReportPdfBlob({
          monthLabel: commissionInvoiceMonthLabel(filters.month),
          year: filters.year,
        });
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openCommissionInvoiceReportPdf(mode, blob);
      } catch (err) {
        console.error('[CommissionInvoice] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Commission Invoice PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [filters.month, filters.year, generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  /** Customer / Supplier / Merchandiser lists. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Commision Invoice filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(shipmentAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[CommisionInvoice] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset selected dropdown values if they disappear after a refresh. */
  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (prev.consignee !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev.consignee)) {
        next.consignee = ALL;
        changed = true;
      }
      if (prev.supplier !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) {
        next.supplier = ALL;
        changed = true;
      }
      if (
        prev.merchandiser !== ALL &&
        !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)
      ) {
        next.merchandiser = ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants]);

  /**
   * PO# list — scoped by Consignee (customer) + Supplier.
   * Aborts in-flight requests on dependency change.
   */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoadingPoNumbers(true);
    (async () => {
      try {
        const list = await fetchPoNumbers(
          {
            customerId: filters.consignee !== ALL ? filters.consignee : undefined,
            supplierId: filters.supplier !== ALL ? filters.supplier : undefined,
            signal: controller.signal,
          },
          shipmentAuthHeaders()
        );
        if (!cancelled) setPoNumbers(list);
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        console.error('[CommisionInvoice] PO# list', err);
        if (!cancelled) {
          setPoNumbers([]);
          enqueueSnackbar('Could not load PO list', { variant: 'error' });
        }
      } finally {
        if (!cancelled) setLoadingPoNumbers(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters.consignee, filters.supplier, enqueueSnackbar]);

  /** Reset PO# selection if the chosen value disappeared after a refresh. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.po === ALL) return prev;
      if (poNumbers.includes(prev.po)) return prev;
      return { ...prev, po: ALL };
    });
  }, [poNumbers]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Logistic Department Shipped Status Download
      </Typography>

      <Grid container spacing={2.5}>
        {/* Row 1: Consignee | Month | Year */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Consignee :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.consignee}
              onChange={handleSelect('consignee')}
              sx={selectSx}
              disabled={loadingDropdowns && customers.length === 0}
            >
              <MenuItem value={ALL}>All Customer</MenuItem>
              {customers
                .filter((row) => milestoneCustomerKey(row))
                .map((row) => {
                  const val = milestoneCustomerKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneCustomerLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Month :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.month} onChange={handleSelect('month')} sx={selectSx}>
              {MONTH_OPTIONS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Year :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.year} onChange={handleSelect('year')} sx={selectSx}>
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Row 2: Supplier | Merchandiser | PO # */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={loadingDropdowns && suppliers.length === 0}
            >
              <MenuItem value={ALL}>All Supplier</MenuItem>
              {suppliers
                .filter((row) => milestoneSupplierKey(row))
                .map((row) => {
                  const val = milestoneSupplierKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneSupplierLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Merchandiser :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.merchandiser}
              onChange={handleSelect('merchandiser')}
              sx={selectSx}
              disabled={loadingDropdowns && merchants.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {merchants
                .filter((row) => milestoneMerchantKey(row))
                .map((row) => {
                  const val = milestoneMerchantKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneMerchantLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            PO # :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.po}
              onChange={handleSelect('po')}
              sx={selectSx}
              disabled={loadingPoNumbers}
              renderValue={(val) => {
                if (loadingPoNumbers && val === ALL) return 'Loading…';
                return val === ALL ? 'All' : val;
              }}
              endAdornment={
                loadingPoNumbers ? (
                  <CircularProgress size={14} sx={{ mr: 3 }} />
                ) : null
              }
            >
              <MenuItem value={ALL}>All</MenuItem>
              {poNumbers.length === 0 && !loadingPoNumbers ? (
                <MenuItem value="" disabled>
                  No PO Found
                </MenuItem>
              ) : (
                poNumbers.map((pn) => (
                  <MenuItem key={pn} value={pn}>
                    {pn}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>

        {/* Centered action row */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 1,
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            * All selection must be belongs to logistic dept.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Shipment History Report
// ----------------------------------------------------------------------

/**
 * "Shipment History Report" form.
 *
 * Per the legacy mock-up this is a slim 3-column filter:
 *   Shipment Mode  |  From (date)  |  To (date)
 * followed by a centered action row (View Report, Download PDF, Download Excel).
 *
 * Action buttons toast for now — they'll hook into the real backend endpoint
 * once it's confirmed.
 */
function ShipmentHistoryReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    shipmentMode: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the Shipment History PDF (demo data for now) and either preview-tab
   * it or trigger a direct file download.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildShipmentHistoryReportPdfBlob({
          fromLabel: shipmentHistoryHeaderDate(filters.fromDate),
          toLabel: shipmentHistoryHeaderDate(filters.toDate),
        });
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openShipmentHistoryReportPdf(mode, blob);
      } catch (err) {
        console.error('[ShipmentHistory] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Shipment History PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [filters.fromDate, filters.toDate, generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Shipment History Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Shipment Mode :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.shipmentMode}
              onChange={handleSelect('shipmentMode')}
              sx={selectSx}
            >
              <MenuItem value={ALL}>All</MenuItem>
              <MenuItem value="BY AIR">BY AIR</MenuItem>
              <MenuItem value="BY SEA">BY SEA</MenuItem>
              <MenuItem value="BY COURIER">BY COURIER</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            From :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.fromDate}
            onChange={handleDate('fromDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            To :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.toDate}
            onChange={handleDate('toDate')}
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
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// After Shipment Report
// ----------------------------------------------------------------------

/**
 * "AFTER SHIPMENT REPORT" form.
 *
 * Minimal 2-column filter (From / To dates) followed by a centered action row.
 * Backend wiring lands later — buttons currently toast.
 */
function AfterShipmentReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the After Shipment PDF (demo data for now) and either preview-tab it
   * or trigger a direct file download.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildAfterShipmentReportPdfBlob({
          fromLabel: afterShipmentHeaderDate(filters.fromDate),
          toLabel: afterShipmentHeaderDate(filters.toDate),
        });
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openAfterShipmentReportPdf(mode, blob);
      } catch (err) {
        console.error('[AfterShipment] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build After Shipment PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [filters.fromDate, filters.toDate, generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 3,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        AFTER SHIPMENT REPORT
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            From :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.fromDate}
            onChange={handleDate('fromDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            To :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.toDate}
            onChange={handleDate('toDate')}
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
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Shipment Delay Report
// ----------------------------------------------------------------------

/**
 * "Shipment Delay Report" form.
 *
 * 3-column filter (Merchandiser, Customer, Supplier — all API-driven via the
 * shared Milestone Summary dropdown endpoint) followed by a centered action
 * row (View Report, Download PDF, Download Excel).
 *
 * Buttons toast for now — they'll hook into the real backend endpoint once
 * confirmed, same pattern as the other Shipment hub reports.
 */
function ShipmentDelayReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    customer: ALL,
    supplier: ALL,
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the Shipment Delay PDF (demo data for now) and either preview-tab it
   * or trigger a direct file download.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildShipmentDelayReportPdfBlob({});
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openShipmentDelayReportPdf(mode, blob);
      } catch (err) {
        console.error('[ShipmentDelay] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Shipment Delay PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  /** Customer / Supplier / Merchandiser lists from the shared dropdown API. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Shipment Delay filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(shipmentAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[ShipmentDelay] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset selected values that disappear from the latest API list. */
  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (prev.customer !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev.customer)) {
        next.customer = ALL;
        changed = true;
      }
      if (prev.supplier !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) {
        next.supplier = ALL;
        changed = true;
      }
      if (
        prev.merchandiser !== ALL &&
        !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)
      ) {
        next.merchandiser = ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Shipment Delay Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Merchandiser :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.merchandiser}
              onChange={handleSelect('merchandiser')}
              sx={selectSx}
              disabled={loadingDropdowns && merchants.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {merchants
                .filter((row) => milestoneMerchantKey(row))
                .map((row) => {
                  const val = milestoneMerchantKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneMerchantLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Customer :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.customer}
              onChange={handleSelect('customer')}
              sx={selectSx}
              disabled={loadingDropdowns && customers.length === 0}
            >
              <MenuItem value={ALL}>All Customer</MenuItem>
              {customers
                .filter((row) => milestoneCustomerKey(row))
                .map((row) => {
                  const val = milestoneCustomerKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneCustomerLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={loadingDropdowns && suppliers.length === 0}
            >
              <MenuItem value={ALL}>All Supplier</MenuItem>
              {suppliers
                .filter((row) => milestoneSupplierKey(row))
                .map((row) => {
                  const val = milestoneSupplierKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneSupplierLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Product Comparision Report
// ----------------------------------------------------------------------

/**
 * "Product Comparision Report" form.
 *
 * Two-side layout matching the legacy print:
 *   - Left  side : Year, Month, Product       (period A + product filter)
 *   - Right side : Year, Month, Type          (period B + quantity/value mode)
 *
 * Year list is current-year ± 5 (shared with the Commission Invoice form).
 * Month list is the shared {@link MONTH_OPTIONS}. Product / Type are simple
 * static selects for now — they'll hook into the real backend endpoints once
 * the API contracts are confirmed (same pattern as the other Shipment hub
 * "coming-soon" reports).
 */
function ProductComparisionReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const now = new Date();
  const currentYear = now.getFullYear();

  const [filters, setFilters] = useState({
    yearA: currentYear - 1,
    monthA: 1,
    product: ALL,
    yearB: currentYear,
    monthB: 1,
    type: 'quantity',
  });

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const yearOptions = useMemo(buildYearOptions, []);

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the Product Comparision PDF (demo data for now) and either
   * preview-tab it or trigger a direct file download. The currently selected
   * Type / Year / Month values drive the dynamic header and column titles.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildProductComparisionReportPdfBlob({
          type: filters.type,
          periodA: { month: Number(filters.monthA), year: Number(filters.yearA) },
          periodB: { month: Number(filters.monthB), year: Number(filters.yearB) },
        });
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openProductComparisionReportPdf(mode, blob);
      } catch (err) {
        console.error('[ProductComparision] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Product Comparision PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [
      filters.type,
      filters.monthA,
      filters.yearA,
      filters.monthB,
      filters.yearB,
      generatingPdf,
      enqueueSnackbar,
    ]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Product Comparision Report
      </Typography>

      <Grid container spacing={2.5}>
        {/* Left side — Year A */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Year :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.yearA}
              onChange={handleSelect('yearA')}
              sx={selectSx}
            >
              {yearOptions.map((y) => (
                <MenuItem key={`yearA-${y}`} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Right side — Year B */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Year :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.yearB}
              onChange={handleSelect('yearB')}
              sx={selectSx}
            >
              {yearOptions.map((y) => (
                <MenuItem key={`yearB-${y}`} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Left side — Month A */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Month :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.monthA}
              onChange={handleSelect('monthA')}
              sx={selectSx}
            >
              {MONTH_OPTIONS.map((m) => (
                <MenuItem key={`monthA-${m.value}`} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Right side — Month B */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Month :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.monthB}
              onChange={handleSelect('monthB')}
              sx={selectSx}
            >
              {MONTH_OPTIONS.map((m) => (
                <MenuItem key={`monthB-${m.value}`} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Left side — Product */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Product :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.product}
              onChange={handleSelect('product')}
              sx={selectSx}
            >
              <MenuItem value={ALL}>All</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Right side — Type */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Type :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.type}
              onChange={handleSelect('type')}
              sx={selectSx}
            >
              <MenuItem value="quantity">Quantity Wise</MenuItem>
              <MenuItem value="fob">FOB Amount Wise</MenuItem>
              <MenuItem value="ldp">LDP Amount Wise</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Shipped Delay / OnTime Report
// ----------------------------------------------------------------------

/**
 * "Shipped Delay / OnTime Report" form.
 *
 * Layout (per legacy print):
 *   - Row 1 : Customer dropdown, Supplier dropdown, Status dropdown.
 *   - Row 2 : From + To date inputs.
 *   - Row 3 : View Report, Download PDF, Download Excel — right-aligned.
 *
 * Customer / Supplier come from the shared Milestone Summary dropdown API;
 * Status is a static "ALL / DELAY / ONTIME" list. Buttons toast for now —
 * they'll hook into the real backend endpoint once confirmed.
 */
function ShippedDelayOrOnTimeReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    status: 'DELAY',
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /** Resolve the user-friendly label for the currently selected Customer / Supplier. */
  const resolveCustomerLabel = useCallback(() => {
    if (filters.customer === ALL) return 'All Customer';
    const hit = customers.find((r) => milestoneCustomerKey(r) === filters.customer);
    return hit ? milestoneCustomerLabel(hit) : 'All Customer';
  }, [filters.customer, customers]);

  const resolveSupplierLabel = useCallback(() => {
    if (filters.supplier === ALL) return 'All Supplier';
    const hit = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
    return hit ? milestoneSupplierLabel(hit) : 'All Supplier';
  }, [filters.supplier, suppliers]);

  /**
   * Build the Shipped Delay / OnTime PDF (demo data for now) and either
   * preview-tab it or trigger a direct file download. Title is driven by the
   * Status dropdown ("DELAY" → "SHIPPED DELAY REPORT" / "ONTIME" →
   * "SHIPPED ON TIME REPORT").
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildShippedDelayOnTimeReportPdfBlob({
          status: filters.status,
          fromLabel: shippedDelayHeaderDate(filters.fromDate),
          toLabel: shippedDelayHeaderDate(filters.toDate),
          customerLabel: resolveCustomerLabel(),
          supplierLabel: resolveSupplierLabel(),
        });
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openShippedDelayOnTimeReportPdf(mode, blob, filters.status);
      } catch (err) {
        console.error('[ShippedDelayOrOnTime] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Shipped Delay / OnTime PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [
      filters.status,
      filters.fromDate,
      filters.toDate,
      resolveCustomerLabel,
      resolveSupplierLabel,
      generatingPdf,
      enqueueSnackbar,
    ]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  /** Customer / Supplier lists from the shared dropdown API. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Shipped Delay / OnTime filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(shipmentAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[ShippedDelayOrOnTime] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset selected values that disappear from the latest API list. */
  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (prev.customer !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev.customer)) {
        next.customer = ALL;
        changed = true;
      }
      if (prev.supplier !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) {
        next.supplier = ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customers, suppliers]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Shipped Delay / OnTime Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Customer :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.customer}
              onChange={handleSelect('customer')}
              sx={selectSx}
              disabled={loadingDropdowns && customers.length === 0}
            >
              <MenuItem value={ALL}>All Customer</MenuItem>
              {customers
                .filter((row) => milestoneCustomerKey(row))
                .map((row) => {
                  const val = milestoneCustomerKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneCustomerLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={loadingDropdowns && suppliers.length === 0}
            >
              <MenuItem value={ALL}>All Supplier</MenuItem>
              {suppliers
                .filter((row) => milestoneSupplierKey(row))
                .map((row) => {
                  const val = milestoneSupplierKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneSupplierLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Status :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.status}
              onChange={handleSelect('status')}
              sx={selectSx}
            >
              <MenuItem value="DELAY">DELAY</MenuItem>
              <MenuItem value="ONTIME">ON TIME</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            From :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.fromDate}
            onChange={handleDate('fromDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            To :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.toDate}
            onChange={handleDate('toDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4} />

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Shipped But Status Not Closed Report
// ----------------------------------------------------------------------

/**
 * "Shipped But Status Not Closed Report" form.
 *
 * Layout (per legacy print):
 *   - Row 1 : Customer dropdown + Supplier dropdown (2 cols).
 *   - Row 2 : From + To date inputs (2 cols).
 *   - Row 3 : View Report, Download PDF, Download Excel — right-aligned.
 *
 * Customer / Supplier come from the shared Milestone Summary dropdown API.
 * Buttons toast for now — they'll hook into the real backend endpoint once
 * confirmed, same pattern as the other Shipment hub reports.
 */
function ShippedNotCloseStatusReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the Shipped Not Closed Status PDF (demo data for now) and either
   * preview-tab it or trigger a direct file download. The selected From/To
   * dates feed into the centered "From : ... To : ..." subtitle.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildShippedNotCloseStatusReportPdfBlob({
          fromLabel: shippedNotCloseHeaderDate(filters.fromDate),
          toLabel: shippedNotCloseHeaderDate(filters.toDate),
        });
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openShippedNotCloseStatusReportPdf(mode, blob);
      } catch (err) {
        console.error('[ShippedNotClose] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Shipped Not Closed PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [filters.fromDate, filters.toDate, generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  /** Customer / Supplier lists from the shared dropdown API. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Shipped Not Closed filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(shipmentAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[ShippedNotClose] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset selected values that disappear from the latest API list. */
  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (prev.customer !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev.customer)) {
        next.customer = ALL;
        changed = true;
      }
      if (prev.supplier !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) {
        next.supplier = ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customers, suppliers]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Shipped But Status Not Closed Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Customer :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.customer}
              onChange={handleSelect('customer')}
              sx={selectSx}
              disabled={loadingDropdowns && customers.length === 0}
            >
              <MenuItem value={ALL}>All Customer</MenuItem>
              {customers
                .filter((row) => milestoneCustomerKey(row))
                .map((row) => {
                  const val = milestoneCustomerKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneCustomerLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={loadingDropdowns && suppliers.length === 0}
            >
              <MenuItem value={ALL}>All Supplier</MenuItem>
              {suppliers
                .filter((row) => milestoneSupplierKey(row))
                .map((row) => {
                  const val = milestoneSupplierKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneSupplierLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            From :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.fromDate}
            onChange={handleDate('fromDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            To :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.toDate}
            onChange={handleDate('toDate')}
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
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Placeholder forms for the rest of the Shipment hub menu
// ----------------------------------------------------------------------

/** Stub form used for the remaining "coming soon" Shipment reports — same shape, single column. */
function PlaceholderShipmentReportForm({ pageTitle }) {
  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        {pageTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Filters and report actions for <strong>{pageTitle}</strong> will be wired here when the backend
        contracts are confirmed.
      </Typography>
    </Card>
  );
}

PlaceholderShipmentReportForm.propTypes = {
  pageTitle: PropTypes.string.isRequired,
};

function renderShipmentReportPanel(activeReportId, pageTitle) {
  switch (activeReportId) {
    case 'shipment-tracking-report':
      return <ShipmentTrackingReportForm key={activeReportId} />;
    case 'commision-invoice-report':
      return <CommisionInvoiceReportForm key={activeReportId} />;
    case 'shipment-history-report':
      return <ShipmentHistoryReportForm key={activeReportId} />;
    case 'after-shipment-report':
      return <AfterShipmentReportForm key={activeReportId} />;
    case 'shipment-delay-report':
      return <ShipmentDelayReportForm key={activeReportId} />;
    case 'product-comparision':
      return <ProductComparisionReportForm key={activeReportId} />;
    case 'shipped-delay-or-ontime-report':
      return <ShippedDelayOrOnTimeReportForm key={activeReportId} />;
    case 'shipped-not-close-status-report':
      return <ShippedNotCloseStatusReportForm key={activeReportId} />;
    default:
      return <ShipmentTrackingReportForm key={activeReportId} />;
  }
}

// ----------------------------------------------------------------------

export default function ShipmentHubView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const reportFromUrl = searchParams.get(REPORT_QUERY_KEY);
  const activeReportId = useMemo(() => {
    const valid = SHIPMENT_REPORT_OPTIONS.some((o) => o.id === reportFromUrl);
    return valid ? reportFromUrl : DEFAULT_REPORT_ID;
  }, [reportFromUrl]);

  useEffect(() => {
    if (!reportFromUrl || !SHIPMENT_REPORT_OPTIONS.some((o) => o.id === reportFromUrl)) {
      setSearchParams({ [REPORT_QUERY_KEY]: DEFAULT_REPORT_ID }, { replace: true });
    }
  }, [reportFromUrl, setSearchParams]);

  const selectedOption = useMemo(
    () => SHIPMENT_REPORT_OPTIONS.find((o) => o.id === activeReportId) ?? SHIPMENT_REPORT_OPTIONS[0],
    [activeReportId]
  );

  const handleReportChange = (e) => {
    const next = e.target.value;
    setSearchParams({ [REPORT_QUERY_KEY]: next }, { replace: true });
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="Shipment"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Reports', href: paths.dashboard.reports.root },
          { name: 'Shipment' },
        ]}
        sx={{ mb: 2 }}
      />

      <Card
        variant="outlined"
        sx={{
          mb: 2,
          p: { xs: 1.25, sm: 1.5 },
          borderRadius: 1,
          position: 'sticky',
          top: { xs: 56, sm: 64 },
          zIndex: 10,
          bgcolor: 'background.paper',
          boxShadow: (theme) =>
            theme.palette.mode === 'light' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <FormControl
          size="small"
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: 340, md: 360 },
          }}
        >
          <InputLabel id="shipment-switch-label" sx={{ fontSize: '0.8125rem' }}>
            Shipment report
          </InputLabel>
          <Select
            labelId="shipment-switch-label"
            label="Shipment report"
            value={activeReportId}
            onChange={handleReportChange}
            sx={{
              borderRadius: 1,
              fontWeight: 600,
              fontSize: '0.8125rem',
              '& .MuiSelect-select': {
                py: 0.5,
                minHeight: '1.75rem',
                display: 'flex',
                alignItems: 'center',
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 360,
                  '& .MuiMenuItem-root': { fontSize: '0.8125rem', minHeight: 36, py: 0.5 },
                },
              },
            }}
          >
            {SHIPMENT_REPORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      {renderShipmentReportPanel(activeReportId, selectedOption.label)}
    </Container>
  );
}
