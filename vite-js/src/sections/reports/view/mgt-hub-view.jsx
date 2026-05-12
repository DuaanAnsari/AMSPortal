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
import {
  buildBusinessSummaryOrderWisePdfBlob,
  openBusinessSummaryOrderWisePdf,
} from 'src/sections/reports/utils/business-summary-order-wise-pdf-export';
import {
  buildBusinessSummaryOrderWiseSupplierPdfBlob,
  openBusinessSummaryOrderWiseSupplierPdf,
} from 'src/sections/reports/utils/business-summary-order-wise-supplier-pdf-export';
import {
  buildBusinessSummaryPdfBlob,
  openBusinessSummaryPdf,
} from 'src/sections/reports/utils/business-summary-pdf-export';
import {
  buildStatusWiseOrderReportPdfBlob,
  openStatusWiseOrderReportPdf,
} from 'src/sections/reports/utils/status-wise-order-report-pdf-export';
import {
  buildStatusWiseVendorOrderReportPdfBlob,
  openStatusWiseVendorOrderReportPdf,
} from 'src/sections/reports/utils/status-wise-vendor-order-report-pdf-export';
import {
  buildOpenOrderReportPdfBlob,
  openOpenOrderReportPdf,
} from 'src/sections/reports/utils/open-order-report-pdf-export';

// ----------------------------------------------------------------------

export const MGT_REPORT_OPTIONS = [
  { id: 'business-summary-order-wise', label: 'Business Summary Order wise' },
  { id: 'business-summary', label: 'Business Summary' },
  { id: 'status-wise-order-report', label: 'Status Wise Order Report' },
  { id: 'open-order-report', label: 'Open Order Report' },
  { id: 'shipped-order-report', label: 'Shipped Order Report' },
];

const DEFAULT_REPORT_ID = 'business-summary-order-wise';
const REPORT_QUERY_KEY = 'report';

const ALL = 'all';
const MGT_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function mgtAuthHeaders() {
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

/**
 * Generic Customer/Supplier + Date Range panel used by the Business Summary Order wise page.
 * `order` controls which dropdown appears first (`customer-first` for Customer-wise, `supplier-first` for Supplier-wise).
 */
function BusinessSummaryOrderPanel({ order, customers, suppliers, loadingDropdowns }) {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  /**
   * Reset the selected ID if dropdown items change and the ID is no longer present.
   * Prevents "All" placeholder from being replaced by an empty value.
   */
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

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  /**
   * Each panel opens its own variant of the Business Summary Order Wise PDF:
   * - `customer-first` (LEFT): grouped by Customer (`Customer Total` rows).
   * - `supplier-first` (RIGHT): grouped by Supplier (`Supplier Total` rows + extra `Developed by …` footer).
   */
  const buildBlob = useCallback(
    (m) => {
      if (order === 'supplier-first') {
        return buildBusinessSummaryOrderWiseSupplierPdfBlob(null, m);
      }
      return buildBusinessSummaryOrderWisePdfBlob(null, m);
    },
    [order]
  );

  const downloadPdf = useCallback(
    (mode, blob) => {
      if (order === 'supplier-first') {
        openBusinessSummaryOrderWiseSupplierPdf(mode, blob);
      } else {
        openBusinessSummaryOrderWisePdf(mode, blob);
      }
    },
    [order]
  );

  const reportLabel =
    order === 'supplier-first'
      ? 'Business Summary Order Wise (Supplier wise) PDF'
      : 'Business Summary Order Wise (Customer wise) PDF';

  const handleViewReport = useCallback(async () => {
    const fromDate = filters.fromDate;
    const toDate = filters.toDate;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    if (!MGT_ISO_DATE.test(fromDate) || !MGT_ISO_DATE.test(toDate)) {
      enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
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

    try {
      previewWindow.document.open();
      previewWindow.document.write(
        '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Loading report...</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;">Generating PDF...</p></body></html>'
      );
      previewWindow.document.close();
    } catch (e) {
      console.warn('[MGT] preview placeholder', e);
    }

    try {
      const blob = await buildBlob({ fromDate, toDate });
      if (previewWindow.closed) {
        enqueueSnackbar('The preview tab was closed before the PDF finished loading.', {
          variant: 'warning',
        });
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      try {
        previewWindow.location.replace(blobUrl);
      } catch (navErr) {
        URL.revokeObjectURL(blobUrl);
        throw navErr;
      }
      previewWindow.focus?.();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 600_000);
      enqueueSnackbar(`${reportLabel} opened in a new tab`, { variant: 'success' });
    } catch (err) {
      console.error('[MGT] Business Summary Order Wise PDF', err);
      enqueueSnackbar(err?.message || `${reportLabel} failed`, { variant: 'error' });
      if (!previewWindow.closed) {
        try {
          const doc = previewWindow.document;
          doc.open();
          doc.write(
            `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>PDF could not load</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;"><strong>Could not open PDF</strong></p><p style="padding:0 24px 24px;">${String(err?.message || '')}</p></body></html>`
          );
          doc.close();
        } catch (writeErr) {
          console.warn('[MGT] preview error page', writeErr);
        }
      }
    }
  }, [filters.fromDate, filters.toDate, enqueueSnackbar, buildBlob, reportLabel]);

  const handleDownloadPdf = useCallback(async () => {
    const fromDate = filters.fromDate;
    const toDate = filters.toDate;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    try {
      const blob = await buildBlob({ fromDate, toDate });
      downloadPdf('pdf', blob);
      enqueueSnackbar(`${reportLabel} downloaded`, { variant: 'success' });
    } catch (err) {
      console.error('[MGT] Business Summary Order Wise PDF (download)', err);
      enqueueSnackbar(err?.message || `${reportLabel} failed`, { variant: 'error' });
    }
  }, [filters.fromDate, filters.toDate, enqueueSnackbar, buildBlob, downloadPdf, reportLabel]);

  const customerField = (
    <Grid item xs={12}>
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
  );

  const supplierField = (
    <Grid item xs={12}>
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
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Grid container spacing={2.5}>
        {order === 'supplier-first' ? supplierField : customerField}
        {order === 'supplier-first' ? customerField : supplierField}

        <Grid item xs={12}>
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

        <Grid item xs={12}>
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600 }}
            >
              View Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() =>
                toast(
                  `Download Excel (${order === 'supplier-first' ? 'Supplier' : 'Customer'} wise): connect API when backend is ready.`
                )
              }
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

BusinessSummaryOrderPanel.propTypes = {
  order: PropTypes.oneOf(['customer-first', 'supplier-first']).isRequired,
  customers: PropTypes.array.isRequired,
  suppliers: PropTypes.array.isRequired,
  loadingDropdowns: PropTypes.bool,
};

/**
 * Business Summary Order wise page — two side-by-side panels (Customer-wise / Supplier-wise).
 * Dropdowns: same env-backed APIs as Milestone Summary (`VITE_API_BASE_URL`).
 */
function BusinessSummaryOrderWiseForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for MGT filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(mgtAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[MGT] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  return (
    <Card variant="outlined" sx={{ ...cardSx, p: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        Business Summary Order wise
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <BusinessSummaryOrderPanel
            order="customer-first"
            customers={customers}
            suppliers={suppliers}
            loadingDropdowns={loadingDropdowns}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <BusinessSummaryOrderPanel
            order="supplier-first"
            customers={customers}
            suppliers={suppliers}
            loadingDropdowns={loadingDropdowns}
          />
        </Grid>
      </Grid>
    </Card>
  );
}

/**
 * Business Summary page — single-column date range (From / To) with three centered actions and a
 * Supplier-shipment-date footnote. View / Download PDF run against the hardcoded demo payload until
 * the backend ships; Excel is still placeholder.
 */
function BusinessSummaryForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });
  const [busy, setBusy] = useState(false);

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const runPdf = useCallback(
    async (mode) => {
      if (busy) return;
      setBusy(true);
      try {
        const blob = await buildBusinessSummaryPdfBlob(undefined, {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
        });
        openBusinessSummaryPdf(mode, blob);
        enqueueSnackbar(
          mode === 'view' ? 'Business Summary PDF opened.' : 'Business Summary PDF downloaded.',
          { variant: 'success' }
        );
      } catch (err) {
        console.error('[BusinessSummary] pdf', err);
        enqueueSnackbar('Could not generate the Business Summary PDF.', { variant: 'error' });
      } finally {
        setBusy(false);
      }
    },
    [busy, filters.fromDate, filters.toDate, enqueueSnackbar]
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Business Summary
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
              disabled={busy}
              onClick={() => runPdf('view')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              View Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={busy}
              onClick={() => runPdf('pdf')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() =>
                enqueueSnackbar(
                  'Download Excel (Business Summary): connect API when backend is ready.',
                  { variant: 'info' }
                )
              }
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1, textAlign: 'center', fontStyle: 'italic' }}
          >
            *- This Date belong to Supplier Shipment Date.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Status Wise Order Report

/** Status choices for the Status dropdown — fixed business set: Confirmed / Close / Cancel. */
const STATUS_WISE_STATUS_OPTIONS = ['Confirmed', 'Close', 'Cancel'];

/**
 * Generic single-column filter panel used by the Status Wise Order Report page.
 * `order` flips which dropdown appears first (Customer for the Customer panel, Supplier for the Vendor panel).
 * Merchandiser / PO # are stubbed to "All" until backend lists are wired; Status is a static option list.
 * PDF / Excel actions are placeholder toasts until the backend contract lands.
 */
function StatusWiseOrderPanel({
  order,
  panelTitle,
  customers,
  suppliers,
  merchants,
  loadingDropdowns,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    merchandiser: ALL,
    po: ALL,
    status: 'Confirmed',
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

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

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const variant = order === 'supplier-first' ? 'Vendor' : 'Customer';

  /**
   * Each panel maps to its own PDF variant:
   * - `customer-first` (LEFT, Customer) → `STATUS WISE ORDER REPORT - (<status>)` flat grid.
   * - `supplier-first` (RIGHT, Vendor) → `SHIPPED ORDER REPORT` grouped grid with yellow total bands.
   */
  const buildVariantBlob = useCallback(
    (m) => {
      if (order === 'supplier-first') {
        return buildStatusWiseVendorOrderReportPdfBlob(undefined, {
          fromDate: m.fromDate,
          toDate: m.toDate,
        });
      }
      return buildStatusWiseOrderReportPdfBlob(undefined, m);
    },
    [order]
  );

  const openVariantPdf = useCallback(
    (mode, blob) => {
      if (order === 'supplier-first') {
        openStatusWiseVendorOrderReportPdf(mode, blob);
      } else {
        openStatusWiseOrderReportPdf(mode, blob);
      }
    },
    [order]
  );

  const reportLabel =
    order === 'supplier-first' ? 'Shipped Order Report' : 'Status Wise Order Report';

  const handleViewReport = useCallback(async () => {
    const { fromDate, toDate, status } = filters;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    if (!MGT_ISO_DATE.test(fromDate) || !MGT_ISO_DATE.test(toDate)) {
      enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
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

    try {
      previewWindow.document.open();
      previewWindow.document.write(
        '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Loading report...</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;">Generating PDF...</p></body></html>'
      );
      previewWindow.document.close();
    } catch (e) {
      console.warn('[MGT] preview placeholder', e);
    }

    try {
      const blob = await buildVariantBlob({ fromDate, toDate, status });
      if (previewWindow.closed) {
        enqueueSnackbar('The preview tab was closed before the PDF finished loading.', {
          variant: 'warning',
        });
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      try {
        previewWindow.location.replace(blobUrl);
      } catch (navErr) {
        URL.revokeObjectURL(blobUrl);
        throw navErr;
      }
      previewWindow.focus?.();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 600_000);
      enqueueSnackbar(`${reportLabel} opened in a new tab`, { variant: 'success' });
    } catch (err) {
      console.error(`[MGT] ${reportLabel} PDF`, err);
      enqueueSnackbar(err?.message || `${reportLabel} PDF failed`, { variant: 'error' });
      if (!previewWindow.closed) {
        try {
          const doc = previewWindow.document;
          doc.open();
          doc.write(
            `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>PDF could not load</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;"><strong>Could not open PDF</strong></p><p style="padding:0 24px 24px;">${String(err?.message || '')}</p></body></html>`
          );
          doc.close();
        } catch (writeErr) {
          console.warn('[MGT] preview error page', writeErr);
        }
      }
    }
  }, [filters, enqueueSnackbar, buildVariantBlob, reportLabel]);

  const handleDownloadPdf = useCallback(async () => {
    const { fromDate, toDate, status } = filters;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    try {
      const blob = await buildVariantBlob({ fromDate, toDate, status });
      openVariantPdf('pdf', blob);
      enqueueSnackbar(`${reportLabel} downloaded`, { variant: 'success' });
    } catch (err) {
      console.error(`[MGT] ${reportLabel} PDF (download)`, err);
      enqueueSnackbar(err?.message || `${reportLabel} PDF failed`, { variant: 'error' });
    }
  }, [filters, enqueueSnackbar, buildVariantBlob, openVariantPdf, reportLabel]);

  const customerField = (
    <Grid item xs={12}>
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
  );

  const supplierField = (
    <Grid item xs={12}>
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
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        {panelTitle}
      </Typography>

      <Grid container spacing={2.5}>
        {order === 'supplier-first' ? supplierField : customerField}
        {order === 'supplier-first' ? customerField : supplierField}

        <Grid item xs={12}>
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

        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            PO # :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.po} onChange={handleSelect('po')} sx={selectSx}>
              <MenuItem value={ALL}>All</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Status :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.status} onChange={handleSelect('status')} sx={selectSx}>
              {STATUS_WISE_STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
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

        <Grid item xs={12}>
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600 }}
            >
              View Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() =>
                toast(`Download Excel (Order Report ${variant}): connect API when backend is ready.`)
              }
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

StatusWiseOrderPanel.propTypes = {
  order: PropTypes.oneOf(['customer-first', 'supplier-first']).isRequired,
  panelTitle: PropTypes.string.isRequired,
  customers: PropTypes.array.isRequired,
  suppliers: PropTypes.array.isRequired,
  merchants: PropTypes.array.isRequired,
  loadingDropdowns: PropTypes.bool,
};

/**
 * Status Wise Order Report — Customer panel (left) and Vendor panel (right) side-by-side.
 * Customer / Supplier dropdowns share the Milestone Summary env API; the rest are stubbed for now.
 */
function StatusWiseOrderReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for MGT filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(mgtAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[MGT] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  return (
    <Card variant="outlined" sx={{ ...cardSx, p: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        Status Wise Order Report
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <StatusWiseOrderPanel
            order="customer-first"
            panelTitle="Order Report (Customer)"
            customers={customers}
            suppliers={suppliers}
            merchants={merchants}
            loadingDropdowns={loadingDropdowns}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatusWiseOrderPanel
            order="supplier-first"
            panelTitle="Order Report (Vendor)"
            customers={customers}
            suppliers={suppliers}
            merchants={merchants}
            loadingDropdowns={loadingDropdowns}
          />
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Open Order Report

/**
 * Open Order Report filter panel — identical shape to the Status Wise panel minus the Status
 * dropdown. `order` flips Customer / Supplier first for the LEFT (Customer) vs RIGHT (Vendor) layout.
 * PDF / Excel actions stay as placeholder toasts until the backend spec lands.
 */
function OpenOrderReportPanel({ order, panelTitle, customers, suppliers, merchants, loadingDropdowns }) {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    merchandiser: ALL,
    po: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

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

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const variant = order === 'supplier-first' ? 'Vendor' : 'Customer';

  /**
   * Both Customer (LEFT) and Vendor (RIGHT) panels open the same `OPEN ORDER REPORT` PDF
   * (demo grid for now). Backend will scope rows to the selected customer / supplier filter once wired.
   */
  const handleViewReport = useCallback(async () => {
    const { fromDate, toDate } = filters;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    if (!MGT_ISO_DATE.test(fromDate) || !MGT_ISO_DATE.test(toDate)) {
      enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
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

    try {
      previewWindow.document.open();
      previewWindow.document.write(
        '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Loading report...</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;">Generating PDF...</p></body></html>'
      );
      previewWindow.document.close();
    } catch (e) {
      console.warn('[MGT] preview placeholder', e);
    }

    try {
      const blob = await buildOpenOrderReportPdfBlob(undefined, { fromDate, toDate });
      if (previewWindow.closed) {
        enqueueSnackbar('The preview tab was closed before the PDF finished loading.', {
          variant: 'warning',
        });
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      try {
        previewWindow.location.replace(blobUrl);
      } catch (navErr) {
        URL.revokeObjectURL(blobUrl);
        throw navErr;
      }
      previewWindow.focus?.();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 600_000);
      enqueueSnackbar(`Open Order Report (${variant}) opened in a new tab`, { variant: 'success' });
    } catch (err) {
      console.error('[MGT] Open Order Report PDF', err);
      enqueueSnackbar(err?.message || 'Open Order Report PDF failed', { variant: 'error' });
      if (!previewWindow.closed) {
        try {
          const doc = previewWindow.document;
          doc.open();
          doc.write(
            `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>PDF could not load</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;"><strong>Could not open PDF</strong></p><p style="padding:0 24px 24px;">${String(err?.message || '')}</p></body></html>`
          );
          doc.close();
        } catch (writeErr) {
          console.warn('[MGT] preview error page', writeErr);
        }
      }
    }
  }, [filters, variant, enqueueSnackbar]);

  const handleDownloadPdf = useCallback(async () => {
    const { fromDate, toDate } = filters;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    try {
      const blob = await buildOpenOrderReportPdfBlob(undefined, { fromDate, toDate });
      openOpenOrderReportPdf('pdf', blob);
      enqueueSnackbar(`Open Order Report (${variant}) downloaded`, { variant: 'success' });
    } catch (err) {
      console.error('[MGT] Open Order Report PDF (download)', err);
      enqueueSnackbar(err?.message || 'Open Order Report PDF failed', { variant: 'error' });
    }
  }, [filters, variant, enqueueSnackbar]);

  const customerField = (
    <Grid item xs={12}>
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
  );

  const supplierField = (
    <Grid item xs={12}>
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
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        {panelTitle}
      </Typography>

      <Grid container spacing={2.5}>
        {order === 'supplier-first' ? supplierField : customerField}
        {order === 'supplier-first' ? customerField : supplierField}

        <Grid item xs={12}>
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

        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            PO # :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.po} onChange={handleSelect('po')} sx={selectSx}>
              <MenuItem value={ALL}>All</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
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

        <Grid item xs={12}>
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600 }}
            >
              View Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() =>
                toast(`Download Excel (Open Order Report ${variant}): connect API when backend is ready.`)
              }
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

OpenOrderReportPanel.propTypes = {
  order: PropTypes.oneOf(['customer-first', 'supplier-first']).isRequired,
  panelTitle: PropTypes.string.isRequired,
  customers: PropTypes.array.isRequired,
  suppliers: PropTypes.array.isRequired,
  merchants: PropTypes.array.isRequired,
  loadingDropdowns: PropTypes.bool,
};

/**
 * Open Order Report — Customer panel (left) and Vendor panel (right) side-by-side.
 * Dropdowns share the Milestone Summary env API (`/api/MyOrders/...`).
 */
function OpenOrderReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for MGT filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(mgtAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[MGT] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  return (
    <Card variant="outlined" sx={{ ...cardSx, p: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        Open Order Report
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <OpenOrderReportPanel
            order="customer-first"
            panelTitle="Open Order Report (Customer)"
            customers={customers}
            suppliers={suppliers}
            merchants={merchants}
            loadingDropdowns={loadingDropdowns}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <OpenOrderReportPanel
            order="supplier-first"
            panelTitle="Open Order Report (Vendor)"
            customers={customers}
            suppliers={suppliers}
            merchants={merchants}
            loadingDropdowns={loadingDropdowns}
          />
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Shipped Order Report

/**
 * Shipped Order Report filter panel — slim variant with just Customer / Supplier + date range.
 * `order` controls which dropdown comes first (Customer panel vs Vendor panel).
 * PDF / Excel actions stay as placeholder toasts until the backend spec lands.
 */
function ShippedOrderReportPanel({ order, panelTitle, customers, suppliers, loadingDropdowns }) {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

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

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const variant = order === 'supplier-first' ? 'Vendor' : 'Customer';

  const customerField = (
    <Grid item xs={12}>
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
  );

  const supplierField = (
    <Grid item xs={12}>
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
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        {panelTitle}
      </Typography>

      <Grid container spacing={2.5}>
        {order === 'supplier-first' ? supplierField : customerField}
        {order === 'supplier-first' ? customerField : supplierField}

        <Grid item xs={12}>
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

        <Grid item xs={12}>
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() =>
                toast(`View Report (Shipped Order Report ${variant}): connect API when backend is ready.`)
              }
              sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600 }}
            >
              View Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() =>
                toast(`Download PDF (Shipped Order Report ${variant}): connect API when backend is ready.`)
              }
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() =>
                toast(`Download Excel (Shipped Order Report ${variant}): connect API when backend is ready.`)
              }
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

ShippedOrderReportPanel.propTypes = {
  order: PropTypes.oneOf(['customer-first', 'supplier-first']).isRequired,
  panelTitle: PropTypes.string.isRequired,
  customers: PropTypes.array.isRequired,
  suppliers: PropTypes.array.isRequired,
  loadingDropdowns: PropTypes.bool,
};

/**
 * Shipped Order Report — Customer panel (left) and Vendor panel (right) side-by-side.
 * Dropdowns share the Milestone Summary env API.
 */
function ShippedOrderReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for MGT filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(mgtAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[MGT] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  return (
    <Card variant="outlined" sx={{ ...cardSx, p: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        Shipped Order Report
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <ShippedOrderReportPanel
            order="customer-first"
            panelTitle="Shipped Order Report (Customer)"
            customers={customers}
            suppliers={suppliers}
            loadingDropdowns={loadingDropdowns}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ShippedOrderReportPanel
            order="supplier-first"
            panelTitle="Shipped Order Report (Vendor)"
            customers={customers}
            suppliers={suppliers}
            loadingDropdowns={loadingDropdowns}
          />
        </Grid>
      </Grid>
    </Card>
  );
}

/** Stub form used for the remaining "coming soon" MGT reports — same shape, single column. */
function PlaceholderMgtReportForm({ pageTitle }) {
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

PlaceholderMgtReportForm.propTypes = {
  pageTitle: PropTypes.string.isRequired,
};

function renderMgtReportPanel(activeReportId, pageTitle) {
  switch (activeReportId) {
    case 'business-summary-order-wise':
      return <BusinessSummaryOrderWiseForm key={activeReportId} />;
    case 'business-summary':
      return <BusinessSummaryForm key={activeReportId} />;
    case 'status-wise-order-report':
      return <StatusWiseOrderReportForm key={activeReportId} />;
    case 'open-order-report':
      return <OpenOrderReportForm key={activeReportId} />;
    case 'shipped-order-report':
      return <ShippedOrderReportForm key={activeReportId} />;
    default:
      return <BusinessSummaryOrderWiseForm key={activeReportId} />;
  }
}

export default function MgtHubView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const reportFromUrl = searchParams.get(REPORT_QUERY_KEY);
  const activeReportId = useMemo(() => {
    const valid = MGT_REPORT_OPTIONS.some((o) => o.id === reportFromUrl);
    return valid ? reportFromUrl : DEFAULT_REPORT_ID;
  }, [reportFromUrl]);

  useEffect(() => {
    if (!reportFromUrl || !MGT_REPORT_OPTIONS.some((o) => o.id === reportFromUrl)) {
      setSearchParams({ [REPORT_QUERY_KEY]: DEFAULT_REPORT_ID }, { replace: true });
    }
  }, [reportFromUrl, setSearchParams]);

  const selectedOption = useMemo(
    () => MGT_REPORT_OPTIONS.find((o) => o.id === activeReportId) ?? MGT_REPORT_OPTIONS[0],
    [activeReportId]
  );

  const handleReportChange = (e) => {
    const next = e.target.value;
    setSearchParams({ [REPORT_QUERY_KEY]: next }, { replace: true });
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="MGT"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Reports', href: paths.dashboard.reports.root },
          { name: 'MGT' },
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
            maxWidth: { xs: '100%', sm: 300, md: 320 },
          }}
        >
          <InputLabel id="mgt-switch-label" sx={{ fontSize: '0.8125rem' }}>
            MGT report
          </InputLabel>
          <Select
            labelId="mgt-switch-label"
            label="MGT report"
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
                  maxHeight: 320,
                  '& .MuiMenuItem-root': { fontSize: '0.8125rem', minHeight: 36, py: 0.5 },
                },
              },
            }}
          >
            {MGT_REPORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      {renderMgtReportPanel(activeReportId, selectedOption.label)}
    </Container>
  );
}
