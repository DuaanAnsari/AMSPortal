import axios from 'axios';
import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

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
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import { fetchLdpFobReportRows } from 'src/sections/reports/utils/ldp-fob-report-api';
import { fetchPoNumbers } from 'src/sections/reports/utils/pono-dropdown-api';
import { buildLdpFobPdfBlobFromRows, openLdpFobDemoDownload } from 'src/sections/reports/utils/ldp-fob-demo-export';
import { fetchMilestoneReportRows } from 'src/sections/reports/utils/milestone-summary-report-api';
import {
  buildMilestoneSummaryPdfBlobFromRows,
  openMilestoneSummaryPdf,
} from 'src/sections/reports/utils/milestone-summary-pdf-export';
import {
  buildMilestoneSummaryXlsxBlob,
  buildMilestoneSummaryXlsxFilename,
  downloadMilestoneSummaryXlsx,
} from 'src/sections/reports/utils/milestone-summary-excel-export';
import { buildFactoryWipPdfBlobFromRows, openFactoryWipPdf } from 'src/sections/reports/utils/factory-wip-pdf-export';
import {
  buildCustomerWipPdfBlobFromRows,
  openCustomerWipPdf,
} from 'src/sections/reports/utils/customer-wip-pdf-export';
import { buildAmsWipPdfBlobFromRows, openAmsWipPdf } from 'src/sections/reports/utils/ams-wip-pdf-export';
import { buildSaltWipPdfBlobFromRows, openSaltWipPdf } from 'src/sections/reports/utils/salt-wip-pdf-export';
import {
  buildCustomisedCustomerWipPdfBlobFromRows,
  openCustomisedCustomerWipPdf,
} from 'src/sections/reports/utils/customised-customer-wip-pdf-export';
import {
  fetchMilestoneSummaryDropdowns,
  getMilestoneSummaryDropdownApiBase,
  milestoneCustomerKey,
  milestoneCustomerLabel,
  milestoneMerchantKey,
  milestoneMerchantLabel,
  milestonePortfolioKey,
  milestonePortfolioLabel,
  milestoneSupplierKey,
  milestoneSupplierLabel,
} from 'src/sections/reports/utils/milestone-summary-dropdown-api';

// ----------------------------------------------------------------------

export const WIP_REPORT_OPTIONS = [
  { id: 'milestone-summary', label: 'Milestone Summary' },
  { id: 'factory-wip', label: 'Factory WIP Report' },
  { id: 'customer-wip', label: 'Customer WIP Report' },
  { id: 'ams-wip', label: 'AMS WIP Report' },
  { id: 'salt-wip', label: 'SALT WIP Report' },
  { id: 'customised-customer-wip', label: 'Customised Customer WIP' },
];

const DEFAULT_REPORT_ID = 'milestone-summary';
const REPORT_QUERY_KEY = 'report';

const ALL = 'all';

const WIP_LDP_FOB_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Set to `false` when Milestone Summary “Download Excel” / “Download Excel New” should work again. */
const DISABLE_MILESTONE_SUMMARY_EXCEL_DOWNLOAD = true;

function wipLdpFobAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * WIP hub report shells: GET LDPFOBReport, bind rows to FOB PDF, open in the browser PDF viewer.
 * Uses filter `fromDate` / `toDate` / `customer` / `supplier` when present; `pono` / `styleNo` are sent as `0` by the API client when unused.
 */
async function runWipHubLdpFobViewReportFromFilters(enqueueSnackbar, filters) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'error' });
    return;
  }
  const fromDate = filters.fromDate;
  const toDate = filters.toDate;
  if (!fromDate || !toDate) {
    enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
    return;
  }
  if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
    enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
    return;
  }
  const customerId =
    'customer' in filters && filters.customer !== ALL && filters.customer != null && filters.customer !== ''
      ? String(filters.customer)
      : '0';
  const supplierId =
    'supplier' in filters && filters.supplier !== ALL && filters.supplier != null && filters.supplier !== ''
      ? String(filters.supplier)
      : '0';

  try {
    const raw = await fetchLdpFobReportRows(
      {
        fromDate,
        toDate,
        customerId,
        supplierId,
        pono: '',
        styleNo: '',
      },
      wipLdpFobAuthHeaders()
    );
    const pdf = await buildLdpFobPdfBlobFromRows(raw);
    openLdpFobDemoDownload('view', pdf, null);
    enqueueSnackbar(raw.length ? 'PDF opened in new tab' : 'PDF opened (no data)', { variant: 'success' });
  } catch (err) {
    console.error('[WIP] LDPFOBReport', err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.Message ||
      (typeof err?.response?.data === 'string' ? err.response.data : null) ||
      err?.message ||
      'Report failed';
    enqueueSnackbar(msg, { variant: 'error' });
  }
}

function WipLdpFobViewReportButton({ filters }) {
  const { enqueueSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);
  const handleClick = useCallback(async () => {
    setBusy(true);
    try {
      await runWipHubLdpFobViewReportFromFilters(enqueueSnackbar, filters);
    } finally {
      setBusy(false);
    }
  }, [enqueueSnackbar, filters]);

  return (
    <Button
      variant="contained"
      color="primary"
      size="medium"
      disabled={busy}
      onClick={handleClick}
      sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
    >
      {busy ? <CircularProgress size={22} color="inherit" /> : 'View Report'}
    </Button>
  );
}

WipLdpFobViewReportButton.propTypes = {
  filters: PropTypes.object.isRequired,
};

function escapeHtmlMilestonePreview(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeMilestonePdfPreviewPlaceholder(previewWindow) {
  try {
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Loading PDF…</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fafafa;color:#333;"><p style="padding:24px;font-size:15px;">Loading PDF…</p></body></html>`;
    previewWindow.document.open();
    previewWindow.document.write(html);
    previewWindow.document.close();
  } catch (e) {
    console.warn('[Milestone Summary] preview placeholder', e);
  }
}

/** Client-built PDF must be non-empty and start with %PDF so the browser can render it. */
async function assertValidMilestonePdfBlob(blob) {
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

/**
 * Apply Customer / Supplier / Merchandiser filters to API rows on the client side.
 * Backend `/api/Report/GetMilestoneReport` does not accept those params, so we narrow here.
 * Selected IDs are resolved to display labels (from dropdown rows) and matched against
 * the API row's name fields, case-insensitive and whitespace-normalised.
 */
function filterMilestoneRowsByFilters(rows, filters, dropdowns = {}) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return list;

  const norm = (v) => String(v ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const pickRowField = (row, ...keys) => {
    if (!row || typeof row !== 'object') return '';
    for (const k of keys) {
      if (k in row && row[k] != null && row[k] !== '') return row[k];
    }
    const lower = {};
    for (const k of Object.keys(row)) lower[k.toLowerCase()] = row[k];
    for (const k of keys) {
      const v = lower[String(k).toLowerCase()];
      if (v != null && v !== '') return v;
    }
    return '';
  };

  const customers = dropdowns.customers || [];
  const suppliers = dropdowns.suppliers || [];
  const merchants = dropdowns.merchants || [];

  const customerLabel =
    filters?.customer && filters.customer !== ALL
      ? (() => {
          const row = customers.find((r) => milestoneCustomerKey(r) === filters.customer);
          return row ? milestoneCustomerLabel(row) : '';
        })()
      : '';
  const supplierLabel =
    filters?.supplier && filters.supplier !== ALL
      ? (() => {
          const row = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
          return row ? milestoneSupplierLabel(row) : '';
        })()
      : '';
  const merchandiserLabel =
    filters?.merchandiser && filters.merchandiser !== ALL
      ? (() => {
          const row = merchants.find((r) => milestoneMerchantKey(r) === filters.merchandiser);
          return row ? milestoneMerchantLabel(row) : '';
        })()
      : '';

  if (!customerLabel && !supplierLabel && !merchandiserLabel) return list;

  return list.filter((r) => {
    if (customerLabel) {
      const v = pickRowField(r, 'customername', 'CustomerName', 'customerName', 'BuyerName');
      if (norm(v) !== norm(customerLabel)) return false;
    }
    if (supplierLabel) {
      const v = pickRowField(
        r,
        'vendername',
        'VenderName',
        'venderName',
        'SupplierName',
        'supplierName',
        'VendorName',
        'vendorName',
        'Supplier',
        'Vendor'
      );
      if (norm(v) !== norm(supplierLabel)) return false;
    }
    if (merchandiserLabel) {
      const v = pickRowField(r, 'username', 'UserName', 'userName', 'MerchandiserName', 'merchandiserName');
      if (norm(v) !== norm(merchandiserLabel)) return false;
    }
    return true;
  });
}

/**
 * Milestone Summary PDF — loads rows from `/api/Report/GetMilestoneReport`, binds to PDF grid.
 * Query: `reportType`, `productPortfolio`, `reportSubType`, `fromDate`, `toDate` (yyyy-mm-dd).
 * For `mode === 'view'`, pass `opts.previewWindow` (tab opened synchronously on click) so the PDF opens reliably.
 */
async function runMilestoneSummaryPdfFromFilters(enqueueSnackbar, filters, mode, dropdowns = {}, opts = {}) {
  const fromDate = filters.fromDate;
  const toDate = filters.toDate;
  if (!fromDate || !toDate) {
    enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
    return;
  }
  if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
    enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
    return;
  }

  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'error' });
    return;
  }

  const merchants = dropdowns.merchants || [];
  const suppliers = dropdowns.suppliers || [];

  const resolveMerchandiserLabelForPdf = () => {
    if (filters.reportType === 'supplierWise') return undefined;
    if (filters.merchandiser === ALL) return 'MUHAMMAD SHAHZAIB';
    const row = merchants.find((r) => milestoneMerchantKey(r) === filters.merchandiser);
    return row ? milestoneMerchantLabel(row) : String(filters.merchandiser);
  };

  const resolveVendorLabelForPdf = () => {
    if (filters.reportType !== 'supplierWise') return undefined;
    if (filters.supplier === ALL) return 'All Vendor';
    const row = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
    return row ? milestoneSupplierLabel(row) : String(filters.supplier);
  };

  const meta = {
    fromDate,
    toDate,
    reportType: filters.reportType,
    merchandiserLabel: resolveMerchandiserLabelForPdf(),
    vendorLabel: resolveVendorLabelForPdf(),
  };

  try {
    const raw = await fetchMilestoneReportRows(
      {
        reportType: filters.reportType,
        productPortfolio: filters.productPortfolio,
        reportSubType: filters.reportVariant,
        fromDate,
        toDate,
        portfolios: dropdowns.portfolios || [],
      },
      wipLdpFobAuthHeaders()
    );

    /** Client-side narrowing — API returns the full set; empty match → empty grid (no rows). */
    const filtered = filterMilestoneRowsByFilters(raw, filters, dropdowns);

    const pdf = await buildMilestoneSummaryPdfBlobFromRows(filtered, {
      ...meta,
      /**
       * Forward the same Bearer token used for the data API so the PDF
       * builder can pull auth-protected image bytes from the backend.
       * `<img src>` cannot carry an Authorization header, so without this
       * hook every row image would render as the placeholder.
       */
      imageAuthHeaders: wipLdpFobAuthHeaders(),
    });
    await assertValidMilestonePdfBlob(pdf);

    if (mode === 'view') {
      const { previewWindow } = opts;
      if (!previewWindow) {
        enqueueSnackbar('Open the report using the View Report button.', { variant: 'warning' });
        return;
      }
      if (previewWindow.closed) {
        enqueueSnackbar('The preview tab was closed before the PDF finished loading.', {
          variant: 'warning',
        });
        return;
      }
      const blobUrl = URL.createObjectURL(pdf);
      try {
        previewWindow.location.replace(blobUrl);
      } catch (navErr) {
        URL.revokeObjectURL(blobUrl);
        throw navErr;
      }
      previewWindow.focus?.();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 600_000);
    } else {
      openMilestoneSummaryPdf(mode, pdf);
    }

    enqueueSnackbar(
      mode === 'view'
        ? filtered.length
          ? 'Milestone Summary PDF opened in a new tab'
          : 'Milestone Summary PDF opened (no rows)'
        : filtered.length
          ? 'Milestone Summary PDF downloaded'
          : 'Downloaded PDF (no rows)',
      { variant: 'success' }
    );
  } catch (err) {
    console.error('[WIP] Milestone Summary PDF', err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.Message ||
      (typeof err?.response?.data === 'string' ? err.response.data : null) ||
      err?.message ||
      'Milestone Summary report failed';
    enqueueSnackbar(msg, { variant: 'error' });

    if (mode === 'view' && opts.previewWindow && !opts.previewWindow.closed) {
      try {
        const doc = opts.previewWindow.document;
        doc.open();
        doc.write(
          `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>PDF could not load</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;"><strong>Could not open PDF</strong></p><p style="padding:0 24px 24px;">${escapeHtmlMilestonePreview(msg)}</p></body></html>`
        );
        doc.close();
      } catch (writeErr) {
        console.warn('[Milestone Summary] preview error page', writeErr);
      }
    }
  }
}

/** Milestone Summary Excel — same GET as PDF; columns match PDF grid. */
async function runMilestoneSummaryExcelFromFilters(enqueueSnackbar, filters, dropdowns = {}) {
  const fromDate = filters.fromDate;
  const toDate = filters.toDate;
  if (!fromDate || !toDate) {
    enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
    return;
  }
  if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
    enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
    return;
  }

  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'error' });
    return;
  }

  try {
    const raw = await fetchMilestoneReportRows(
      {
        reportType: filters.reportType,
        productPortfolio: filters.productPortfolio,
        reportSubType: filters.reportVariant,
        fromDate,
        toDate,
        portfolios: dropdowns.portfolios || [],
      },
      wipLdpFobAuthHeaders()
    );
    const filtered = filterMilestoneRowsByFilters(raw, filters, dropdowns);
    const blob = buildMilestoneSummaryXlsxBlob(filtered, filters.reportType);
    const filename = buildMilestoneSummaryXlsxFilename(filters.reportType, fromDate, toDate);
    downloadMilestoneSummaryXlsx(blob, filename);
    enqueueSnackbar(
      filtered.length ? 'Milestone Summary Excel downloaded' : 'Downloaded Excel (no rows)',
      { variant: 'success' }
    );
  } catch (err) {
    console.error('[WIP] Milestone Summary Excel', err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.Message ||
      (typeof err?.response?.data === 'string' ? err.response.data : null) ||
      err?.message ||
      'Milestone Summary report failed';
    enqueueSnackbar(msg, { variant: 'error' });
  }
}

function MilestoneSummaryExcelDownloadButton({ filters, dropdowns = {} }) {
  const { enqueueSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);

  const handleClick = useCallback(async () => {
    setBusy(true);
    try {
      await runMilestoneSummaryExcelFromFilters(enqueueSnackbar, filters, dropdowns);
    } finally {
      setBusy(false);
    }
  }, [enqueueSnackbar, filters, dropdowns]);

  return (
    <Button
      variant="contained"
      color="primary"
      size="medium"
      disabled={DISABLE_MILESTONE_SUMMARY_EXCEL_DOWNLOAD || busy}
      title={
        DISABLE_MILESTONE_SUMMARY_EXCEL_DOWNLOAD
          ? 'Excel download is disabled for now'
          : undefined
      }
      onClick={handleClick}
      sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
    >
      {busy ? <CircularProgress size={22} color="inherit" /> : 'Download Excel'}
    </Button>
  );
}

MilestoneSummaryExcelDownloadButton.propTypes = {
  filters: PropTypes.object.isRequired,
  dropdowns: PropTypes.shape({
    customers: PropTypes.array,
    suppliers: PropTypes.array,
    merchants: PropTypes.array,
    portfolios: PropTypes.array,
  }),
};

function MilestoneSummaryReportActions({ filters, dropdowns = {} }) {
  const { enqueueSnackbar } = useSnackbar();
  /** `null` = idle; only the matching button shows a spinner. */
  const [busyMode, setBusyMode] = useState(null);

  const runPdfDownload = useCallback(
    async (mode) => {
      setBusyMode(mode);
      try {
        await runMilestoneSummaryPdfFromFilters(enqueueSnackbar, filters, mode, dropdowns, {});
      } finally {
        setBusyMode(null);
      }
    },
    [enqueueSnackbar, filters, dropdowns]
  );

  const handleViewReport = useCallback(() => {
    const fromDate = filters.fromDate;
    const toDate = filters.toDate;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
      enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
      return;
    }
    const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'error' });
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

    writeMilestonePdfPreviewPlaceholder(previewWindow);
    setBusyMode('view');
    void (async () => {
      try {
        await runMilestoneSummaryPdfFromFilters(enqueueSnackbar, filters, 'view', dropdowns, {
          previewWindow,
        });
      } finally {
        setBusyMode(null);
      }
    })();
  }, [enqueueSnackbar, filters, dropdowns]);

  const busy = busyMode !== null;

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={handleViewReport}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'view' ? <CircularProgress size={22} color="inherit" /> : 'View Report'}
      </Button>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={() => runPdfDownload('pdf')}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'pdf' ? <CircularProgress size={22} color="inherit" /> : 'Download PDF'}
      </Button>
    </>
  );
}

MilestoneSummaryReportActions.propTypes = {
  filters: PropTypes.object.isRequired,
  dropdowns: PropTypes.shape({
    customers: PropTypes.array,
    suppliers: PropTypes.array,
    merchants: PropTypes.array,
    portfolios: PropTypes.array,
  }),
};

/** Factory WIP PDF — demo grid until API rows are wired (`buildFactoryWipPdfBlobFromRows(rows, meta)`). */
async function runFactoryWipPdfFromFilters(enqueueSnackbar, filters, mode) {
  const fromDate = filters.fromDate;
  const toDate = filters.toDate;
  if (!fromDate || !toDate) {
    enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
    return;
  }
  if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
    enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
    return;
  }

  const meta = {
    customerLabel: filters.customer === ALL ? 'All' : String(filters.customer),
    supplierLabel: filters.supplier === ALL ? 'All' : String(filters.supplier),
    merchantLabel: filters.merchandiser === ALL ? 'MUHAMMAD SHAHZAIB' : String(filters.merchandiser),
    fromDate,
    toDate,
  };

  try {
    const blob = await buildFactoryWipPdfBlobFromRows([], meta);
    openFactoryWipPdf(mode, blob);
    enqueueSnackbar(
      mode === 'view' ? 'Factory WIP PDF opened in a new tab' : 'Factory WIP PDF downloaded',
      { variant: 'success' }
    );
  } catch (err) {
    console.error('[WIP] Factory WIP PDF', err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.Message ||
      (typeof err?.response?.data === 'string' ? err.response.data : null) ||
      err?.message ||
      'Factory WIP PDF failed';
    enqueueSnackbar(msg, { variant: 'error' });
  }
}

/** Customer WIP PDF — demo grid until API rows are wired (`buildCustomerWipPdfBlobFromRows(rows, meta)`). */
async function runCustomerWipPdfFromFilters(enqueueSnackbar, filters, mode, dropdowns = {}, opts = {}) {
  const fromDate = filters.fromDate;
  const toDate = filters.toDate;
  if (!fromDate || !toDate) {
    enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
    return;
  }
  if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
    enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
    return;
  }

  if (mode === 'view' && !opts.previewWindow) {
    enqueueSnackbar('Open the report using the View Report button.', { variant: 'warning' });
    return;
  }

  const merchants = dropdowns.merchants || [];
  const customers = dropdowns.customers || [];
  const suppliers = dropdowns.suppliers || [];

  const resolveMerchantLabel = () => {
    if (filters.merchandiser === ALL) return 'MUHAMMAD SHAHZAIB';
    const row = merchants.find((r) => milestoneMerchantKey(r) === filters.merchandiser);
    return row ? milestoneMerchantLabel(row) : String(filters.merchandiser);
  };

  const resolveCustomerLabel = () => {
    if (filters.customer === ALL) return 'All';
    const row = customers.find((r) => milestoneCustomerKey(r) === filters.customer);
    return row ? milestoneCustomerLabel(row) : String(filters.customer);
  };

  const resolveSupplierLabel = () => {
    if (filters.supplier === ALL) return 'All';
    const row = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
    return row ? milestoneSupplierLabel(row) : String(filters.supplier);
  };

  const meta = {
    customerLabel: resolveCustomerLabel(),
    supplierLabel: resolveSupplierLabel(),
    merchantLabel: resolveMerchantLabel(),
    fromDate,
    toDate,
  };

  try {
    const blob = await buildCustomerWipPdfBlobFromRows([], meta);
    await assertValidMilestonePdfBlob(blob);

    if (mode === 'view') {
      const { previewWindow } = opts;
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
    } else {
      openCustomerWipPdf(mode, blob);
    }

    enqueueSnackbar(
      mode === 'view' ? 'Customer WIP PDF opened in a new tab' : 'Customer WIP PDF downloaded',
      { variant: 'success' }
    );
  } catch (err) {
    console.error('[WIP] Customer WIP PDF', err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.Message ||
      (typeof err?.response?.data === 'string' ? err.response.data : null) ||
      err?.message ||
      'Customer WIP PDF failed';
    enqueueSnackbar(msg, { variant: 'error' });

    if (mode === 'view' && opts.previewWindow && !opts.previewWindow.closed) {
      try {
        const doc = opts.previewWindow.document;
        doc.open();
        doc.write(
          `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>PDF could not load</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;"><strong>Could not open PDF</strong></p><p style="padding:0 24px 24px;">${escapeHtmlMilestonePreview(msg)}</p></body></html>`
        );
        doc.close();
      } catch (writeErr) {
        console.warn('[Customer WIP] preview error page', writeErr);
      }
    }
  }
}

/** AMS WIP PDF — demo grid until API rows are wired (`buildAmsWipPdfBlobFromRows(rows, meta)`). */
async function runAmsWipPdfFromFilters(enqueueSnackbar, filters, mode, dropdowns = {}, opts = {}) {
  const fromDate = filters.fromDate;
  const toDate = filters.toDate;
  if (!fromDate || !toDate) {
    enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
    return;
  }
  if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
    enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
    return;
  }

  if (mode === 'view' && !opts.previewWindow) {
    enqueueSnackbar('Open the report using the View Report button.', { variant: 'warning' });
    return;
  }

  const merchants = dropdowns.merchants || [];
  const customers = dropdowns.customers || [];
  const suppliers = dropdowns.suppliers || [];

  const resolveMerchantLabel = () => {
    if (filters.merchandiser === ALL) return 'MUHAMMAD SHAHZAIB';
    const row = merchants.find((r) => milestoneMerchantKey(r) === filters.merchandiser);
    return row ? milestoneMerchantLabel(row) : String(filters.merchandiser);
  };

  const resolveCustomerLabel = () => {
    if (filters.customer === ALL) return 'All';
    const row = customers.find((r) => milestoneCustomerKey(r) === filters.customer);
    return row ? milestoneCustomerLabel(row) : String(filters.customer);
  };

  const resolveSupplierLabel = () => {
    if (filters.supplier === ALL) return 'All';
    const row = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
    return row ? milestoneSupplierLabel(row) : String(filters.supplier);
  };

  const meta = {
    customerLabel: resolveCustomerLabel(),
    supplierLabel: resolveSupplierLabel(),
    merchantLabel: resolveMerchantLabel(),
    fromDate,
    toDate,
  };

  try {
    const blob = await buildAmsWipPdfBlobFromRows([], meta);
    await assertValidMilestonePdfBlob(blob);

    if (mode === 'view') {
      const { previewWindow } = opts;
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
    } else {
      openAmsWipPdf(mode, blob);
    }

    enqueueSnackbar(
      mode === 'view' ? 'AMS WIP PDF opened in a new tab' : 'AMS WIP PDF downloaded',
      { variant: 'success' }
    );
  } catch (err) {
    console.error('[WIP] AMS WIP PDF', err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.Message ||
      (typeof err?.response?.data === 'string' ? err.response.data : null) ||
      err?.message ||
      'AMS WIP PDF failed';
    enqueueSnackbar(msg, { variant: 'error' });

    if (mode === 'view' && opts.previewWindow && !opts.previewWindow.closed) {
      try {
        const doc = opts.previewWindow.document;
        doc.open();
        doc.write(
          `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>PDF could not load</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;"><strong>Could not open PDF</strong></p><p style="padding:0 24px 24px;">${escapeHtmlMilestonePreview(msg)}</p></body></html>`
        );
        doc.close();
      } catch (writeErr) {
        console.warn('[AMS WIP] preview error page', writeErr);
      }
    }
  }
}

/** Salt WIP PDF — demo grid until API rows are wired (`buildSaltWipPdfBlobFromRows(rows, meta)`). */
async function runSaltWipPdfFromFilters(enqueueSnackbar, filters, mode, dropdowns = {}, opts = {}) {
  const fromDate = filters.fromDate;
  const toDate = filters.toDate;
  if (!fromDate || !toDate) {
    enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
    return;
  }
  if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
    enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
    return;
  }

  if (mode === 'view' && !opts.previewWindow) {
    enqueueSnackbar('Open the report using the View Report button.', { variant: 'warning' });
    return;
  }

  const customers = dropdowns.customers || [];

  const resolveCustomerLabel = () => {
    if (filters.customer === ALL) return 'All';
    const row = customers.find((r) => milestoneCustomerKey(r) === filters.customer);
    return row ? milestoneCustomerLabel(row) : String(filters.customer);
  };

  const meta = {
    customerLabel: resolveCustomerLabel(),
    fromDate,
    toDate,
  };

  try {
    const blob = await buildSaltWipPdfBlobFromRows([], meta);
    await assertValidMilestonePdfBlob(blob);

    if (mode === 'view') {
      const { previewWindow } = opts;
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
    } else {
      openSaltWipPdf(mode, blob);
    }

    enqueueSnackbar(
      mode === 'view' ? 'Salt WIP PDF opened in a new tab' : 'Salt WIP PDF downloaded',
      { variant: 'success' }
    );
  } catch (err) {
    console.error('[WIP] Salt WIP PDF', err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.Message ||
      (typeof err?.response?.data === 'string' ? err.response.data : null) ||
      err?.message ||
      'Salt WIP PDF failed';
    enqueueSnackbar(msg, { variant: 'error' });

    if (mode === 'view' && opts.previewWindow && !opts.previewWindow.closed) {
      try {
        const doc = opts.previewWindow.document;
        doc.open();
        doc.write(
          `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>PDF could not load</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;"><strong>Could not open PDF</strong></p><p style="padding:0 24px 24px;">${escapeHtmlMilestonePreview(msg)}</p></body></html>`
        );
        doc.close();
      } catch (writeErr) {
        console.warn('[Salt WIP] preview error page', writeErr);
      }
    }
  }
}

/** Customised Customer WIP PDF — demo grid until API rows are wired (`buildCustomisedCustomerWipPdfBlobFromRows(rows, meta)`). */
async function runCustomisedCustomerWipPdfFromFilters(
  enqueueSnackbar,
  filters,
  mode,
  dropdowns = {},
  opts = {}
) {
  const fromDate = filters.fromDate;
  const toDate = filters.toDate;
  if (!fromDate || !toDate) {
    enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
    return;
  }
  if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
    enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
    return;
  }

  if (mode === 'view' && !opts.previewWindow) {
    enqueueSnackbar('Open the report using the View Report button.', { variant: 'warning' });
    return;
  }

  const customers = dropdowns.customers || [];
  const suppliers = dropdowns.suppliers || [];
  const merchants = dropdowns.merchants || [];

  const resolveCustomerLabel = () => {
    if (filters.customer === ALL) return 'All';
    const row = customers.find((r) => milestoneCustomerKey(r) === filters.customer);
    if (row) return milestoneCustomerLabel(row);
    /** Fallback for the hardcoded form value (`bailey-apparel`) until dropdowns are API-wired. */
    if (String(filters.customer) === 'bailey-apparel') return 'BAILEY APPAREL';
    return String(filters.customer);
  };

  const resolveSupplierLabel = () => {
    if (filters.supplier === ALL) return 'All';
    const row = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
    return row ? milestoneSupplierLabel(row) : String(filters.supplier);
  };

  const resolveMerchantLabel = () => {
    if (filters.merchandiser === ALL) return 'MUHAMMAD SHAHZAIB';
    const row = merchants.find((r) => milestoneMerchantKey(r) === filters.merchandiser);
    if (row) return milestoneMerchantLabel(row);
    if (String(filters.merchandiser) === 'muhammad-shahzaib') return 'MUHAMMAD SHAHZAIB';
    return String(filters.merchandiser);
  };

  const meta = {
    customerLabel: resolveCustomerLabel(),
    supplierLabel: resolveSupplierLabel(),
    merchantLabel: resolveMerchantLabel(),
    fromDate,
    toDate,
  };

  try {
    const blob = await buildCustomisedCustomerWipPdfBlobFromRows([], meta);
    await assertValidMilestonePdfBlob(blob);

    if (mode === 'view') {
      const { previewWindow } = opts;
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
    } else {
      openCustomisedCustomerWipPdf(mode, blob);
    }

    enqueueSnackbar(
      mode === 'view'
        ? 'Customised Customer WIP PDF opened in a new tab'
        : 'Customised Customer WIP PDF downloaded',
      { variant: 'success' }
    );
  } catch (err) {
    console.error('[WIP] Customised Customer WIP PDF', err);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.Message ||
      (typeof err?.response?.data === 'string' ? err.response.data : null) ||
      err?.message ||
      'Customised Customer WIP PDF failed';
    enqueueSnackbar(msg, { variant: 'error' });

    if (mode === 'view' && opts.previewWindow && !opts.previewWindow.closed) {
      try {
        const doc = opts.previewWindow.document;
        doc.open();
        doc.write(
          `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>PDF could not load</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fff;color:#333;"><p style="padding:24px;"><strong>Could not open PDF</strong></p><p style="padding:0 24px 24px;">${escapeHtmlMilestonePreview(msg)}</p></body></html>`
        );
        doc.close();
      } catch (writeErr) {
        console.warn('[Customised Customer WIP] preview error page', writeErr);
      }
    }
  }
}

function FactoryWipReportActions({ filters }) {
  const { enqueueSnackbar } = useSnackbar();
  const [busyMode, setBusyMode] = useState(null);

  const run = useCallback(
    async (m) => {
      setBusyMode(m);
      try {
        await runFactoryWipPdfFromFilters(enqueueSnackbar, filters, m);
      } finally {
        setBusyMode(null);
      }
    },
    [enqueueSnackbar, filters]
  );

  const busy = busyMode !== null;

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={() => run('view')}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'view' ? <CircularProgress size={22} color="inherit" /> : 'View Report'}
      </Button>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={() => run('pdf')}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'pdf' ? <CircularProgress size={22} color="inherit" /> : 'Download PDF'}
      </Button>
    </>
  );
}

FactoryWipReportActions.propTypes = {
  filters: PropTypes.object.isRequired,
};

function CustomerWipReportActions({ filters, dropdowns = {} }) {
  const { enqueueSnackbar } = useSnackbar();
  const [busyMode, setBusyMode] = useState(null);

  const runPdfDownload = useCallback(
    async (m) => {
      setBusyMode(m);
      try {
        await runCustomerWipPdfFromFilters(enqueueSnackbar, filters, m, dropdowns, {});
      } finally {
        setBusyMode(null);
      }
    },
    [enqueueSnackbar, filters, dropdowns]
  );

  const handleViewReport = useCallback(() => {
    const fromDate = filters.fromDate;
    const toDate = filters.toDate;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
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

    writeMilestonePdfPreviewPlaceholder(previewWindow);
    setBusyMode('view');
    void (async () => {
      try {
        await runCustomerWipPdfFromFilters(enqueueSnackbar, filters, 'view', dropdowns, {
          previewWindow,
        });
      } finally {
        setBusyMode(null);
      }
    })();
  }, [enqueueSnackbar, filters, dropdowns]);

  const busy = busyMode !== null;

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={handleViewReport}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'view' ? <CircularProgress size={22} color="inherit" /> : 'View Report'}
      </Button>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={() => runPdfDownload('pdf')}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'pdf' ? <CircularProgress size={22} color="inherit" /> : 'Download PDF'}
      </Button>
    </>
  );
}

CustomerWipReportActions.propTypes = {
  filters: PropTypes.object.isRequired,
  dropdowns: PropTypes.shape({
    customers: PropTypes.array,
    suppliers: PropTypes.array,
    merchants: PropTypes.array,
    portfolios: PropTypes.array,
  }),
};

function AmsWipReportActions({ filters, dropdowns = {} }) {
  const { enqueueSnackbar } = useSnackbar();
  const [busyMode, setBusyMode] = useState(null);

  const runPdfDownload = useCallback(
    async (m) => {
      setBusyMode(m);
      try {
        await runAmsWipPdfFromFilters(enqueueSnackbar, filters, m, dropdowns, {});
      } finally {
        setBusyMode(null);
      }
    },
    [enqueueSnackbar, filters, dropdowns]
  );

  const handleViewReport = useCallback(() => {
    const fromDate = filters.fromDate;
    const toDate = filters.toDate;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
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

    writeMilestonePdfPreviewPlaceholder(previewWindow);
    setBusyMode('view');
    void (async () => {
      try {
        await runAmsWipPdfFromFilters(enqueueSnackbar, filters, 'view', dropdowns, {
          previewWindow,
        });
      } finally {
        setBusyMode(null);
      }
    })();
  }, [enqueueSnackbar, filters, dropdowns]);

  const busy = busyMode !== null;

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={handleViewReport}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'view' ? <CircularProgress size={22} color="inherit" /> : 'View Report'}
      </Button>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={() => runPdfDownload('pdf')}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'pdf' ? <CircularProgress size={22} color="inherit" /> : 'Download PDF'}
      </Button>
    </>
  );
}

AmsWipReportActions.propTypes = {
  filters: PropTypes.object.isRequired,
  dropdowns: PropTypes.shape({
    customers: PropTypes.array,
    suppliers: PropTypes.array,
    merchants: PropTypes.array,
    portfolios: PropTypes.array,
  }),
};

function SaltWipReportActions({ filters, dropdowns = {} }) {
  const { enqueueSnackbar } = useSnackbar();
  const [busyMode, setBusyMode] = useState(null);

  const runPdfDownload = useCallback(
    async (m) => {
      setBusyMode(m);
      try {
        await runSaltWipPdfFromFilters(enqueueSnackbar, filters, m, dropdowns, {});
      } finally {
        setBusyMode(null);
      }
    },
    [enqueueSnackbar, filters, dropdowns]
  );

  const handleViewReport = useCallback(() => {
    const fromDate = filters.fromDate;
    const toDate = filters.toDate;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
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

    writeMilestonePdfPreviewPlaceholder(previewWindow);
    setBusyMode('view');
    void (async () => {
      try {
        await runSaltWipPdfFromFilters(enqueueSnackbar, filters, 'view', dropdowns, {
          previewWindow,
        });
      } finally {
        setBusyMode(null);
      }
    })();
  }, [enqueueSnackbar, filters, dropdowns]);

  const busy = busyMode !== null;

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={handleViewReport}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'view' ? <CircularProgress size={22} color="inherit" /> : 'View Report'}
      </Button>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={() => runPdfDownload('pdf')}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'pdf' ? <CircularProgress size={22} color="inherit" /> : 'Download PDF'}
      </Button>
    </>
  );
}

SaltWipReportActions.propTypes = {
  filters: PropTypes.object.isRequired,
  dropdowns: PropTypes.shape({
    customers: PropTypes.array,
    suppliers: PropTypes.array,
    merchants: PropTypes.array,
    portfolios: PropTypes.array,
  }),
};

function CustomisedCustomerWipReportActions({ filters, dropdowns = {} }) {
  const { enqueueSnackbar } = useSnackbar();
  const [busyMode, setBusyMode] = useState(null);

  const runPdfDownload = useCallback(
    async (m) => {
      setBusyMode(m);
      try {
        await runCustomisedCustomerWipPdfFromFilters(enqueueSnackbar, filters, m, dropdowns, {});
      } finally {
        setBusyMode(null);
      }
    },
    [enqueueSnackbar, filters, dropdowns]
  );

  const handleViewReport = useCallback(() => {
    const fromDate = filters.fromDate;
    const toDate = filters.toDate;
    if (!fromDate || !toDate) {
      enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
      return;
    }
    if (!WIP_LDP_FOB_ISO_DATE.test(fromDate) || !WIP_LDP_FOB_ISO_DATE.test(toDate)) {
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

    writeMilestonePdfPreviewPlaceholder(previewWindow);
    setBusyMode('view');
    void (async () => {
      try {
        await runCustomisedCustomerWipPdfFromFilters(enqueueSnackbar, filters, 'view', dropdowns, {
          previewWindow,
        });
      } finally {
        setBusyMode(null);
      }
    })();
  }, [enqueueSnackbar, filters, dropdowns]);

  const busy = busyMode !== null;

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={handleViewReport}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'view' ? <CircularProgress size={22} color="inherit" /> : 'View Report'}
      </Button>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        disabled={busy}
        onClick={() => runPdfDownload('pdf')}
        sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
      >
        {busyMode === 'pdf' ? <CircularProgress size={22} color="inherit" /> : 'Download PDF'}
      </Button>
    </>
  );
}

CustomisedCustomerWipReportActions.propTypes = {
  filters: PropTypes.object.isRequired,
  dropdowns: PropTypes.shape({
    customers: PropTypes.array,
    suppliers: PropTypes.array,
    merchants: PropTypes.array,
    portfolios: PropTypes.array,
  }),
};

const cardSx = {
  p: { xs: 2, sm: 3 },
  borderRadius: 1,
  boxShadow: (theme) =>
    theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
};

/** Factory WIP Report — filters per spec (Supplier shipment footnote). */
function FactoryWipReportForm({ pageTitle }) {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    productPortfolio: ALL,
    supplier: ALL,
    customer: ALL,
    poScope: ALL,
    style: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  /** Shared filter lists (Merchandiser / Product Portfolio / Supplier / Customer). */
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  /** PO# dropdown (env-driven `/api/MyOrders/Getpono`, scoped by Customer + Supplier). */
  const [poNumbers, setPoNumbers] = useState([]);
  const [loadingPoNumbers, setLoadingPoNumbers] = useState(false);

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

  const selectSx = { borderRadius: 1 };

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Factory WIP filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(wipLdpFobAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        setPortfolios(res.portfolios);

        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
        if (res.rejected.portfolios) enqueueSnackbar('Could not load product portfolios', { variant: 'error' });
      } catch (err) {
        console.error('[Factory WIP] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** If a selected key isn't in the latest API list (e.g. backend changed), reset it to "All". */
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
      if (prev.merchandiser !== ALL && !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)) {
        next.merchandiser = ALL;
        changed = true;
      }
      if (
        prev.productPortfolio !== ALL &&
        !portfolios.some((r) => milestonePortfolioKey(r) === prev.productPortfolio)
      ) {
        next.productPortfolio = ALL;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants, portfolios]);

  /**
   * Bind PO# dropdown.
   * - Initial load                  → all POs (no filter)
   * - Customer or Supplier changes  → POs scoped to active filters
   * - Both back to ALL              → all POs again
   *
   * An `AbortController` cancels any in-flight request when filters flip again,
   * so rapid changes don't pile up duplicate calls or settle out of order.
   */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoadingPoNumbers(true);
      try {
        const list = await fetchPoNumbers(
          {
            customerId: filters.customer,
            supplierId: filters.supplier,
            signal: controller.signal,
          },
          wipLdpFobAuthHeaders()
        );
        if (cancelled) return;
        setPoNumbers(list);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('[Factory WIP] PO# dropdown', err);
        if (!cancelled) {
          setPoNumbers([]);
          enqueueSnackbar('Could not load PO numbers', { variant: 'error' });
        }
      } finally {
        if (!cancelled) setLoadingPoNumbers(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters.customer, filters.supplier, enqueueSnackbar]);

  /** Reset PO selection back to "All" if the previously chosen PO is no longer in the refreshed list. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.poScope === ALL) return prev;
      if (poNumbers.includes(prev.poScope)) return prev;
      return { ...prev, poScope: ALL };
    });
  }, [poNumbers]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        {pageTitle}
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Merchandiser:
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.merchandiser}
              onChange={handleSelect('merchandiser')}
              displayEmpty
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Product Portfolio:
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.productPortfolio}
              onChange={handleSelect('productPortfolio')}
              sx={selectSx}
              disabled={loadingDropdowns && portfolios.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {portfolios
                .filter((row) => milestonePortfolioKey(row))
                .map((row) => {
                  const val = milestonePortfolioKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestonePortfolioLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Supplier:
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            PO # :
          </Typography>
          <Autocomplete
            fullWidth
            size="small"
            disableClearable
            clearOnEscape
            disabled={loadingPoNumbers}
            loading={loadingPoNumbers}
            options={[ALL, ...poNumbers]}
            value={filters.poScope}
            onChange={(_, val) => setFilters((prev) => ({ ...prev, poScope: val || ALL }))}
            getOptionLabel={(opt) => (opt === ALL ? 'All' : String(opt ?? ''))}
            isOptionEqualToValue={(opt, val) => String(opt) === String(val)}
            noOptionsText={loadingPoNumbers ? 'Loading…' : 'No PO Found'}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={selectSx}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingPoNumbers ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Style :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.style} onChange={handleSelect('style')} sx={selectSx}>
              <MenuItem value={ALL}>All</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            From:
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

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            To:
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
            <FactoryWipReportActions filters={filters} />
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel New: connect API when backend is ready.')}
              sx={{ minWidth: 170, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel New
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            * - This Date belong to Supplier Shipment Date.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

const CUSTOMER_WIP_PAGE_TITLE = 'Customer WIP Report / Summary of Production Status Report';

/** Customer WIP Report — Production Status layout (Customer shipment footnote). Dropdowns: same env-backed APIs as Milestone Summary (`VITE_API_BASE_URL`, `VITE_REPORT_MILESTONE_*` / FOB fallbacks). */
function CustomerWipReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    reportType: 'merchandiserWise',
    merchandiser: ALL,
    productPortfolio: ALL,
    customer: ALL,
    supplier: ALL,
    poScope: ALL,
    style: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  /** PO# dropdown (env-driven `/api/MyOrders/Getpono`, scoped by Customer + Supplier). */
  const [poNumbers, setPoNumbers] = useState([]);
  const [loadingPoNumbers, setLoadingPoNumbers] = useState(false);

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

  const selectSx = { borderRadius: 1 };

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Customer WIP filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(wipLdpFobAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        setPortfolios(res.portfolios);

        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
        if (res.rejected.portfolios) enqueueSnackbar('Could not load product portfolios', { variant: 'error' });
      } catch (err) {
        console.error('[Customer WIP] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /**
   * Bind PO# dropdown.
   * - Initial load                  → all POs (no filter)
   * - Customer or Supplier changes  → POs scoped to the active filters
   * - Both back to ALL              → all POs again
   *
   * An `AbortController` cancels any in-flight request when filters flip again,
   * so rapid changes don't pile up duplicate calls or settle out of order.
   */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoadingPoNumbers(true);
      try {
        const list = await fetchPoNumbers(
          {
            customerId: filters.customer,
            supplierId: filters.supplier,
            signal: controller.signal,
          },
          wipLdpFobAuthHeaders()
        );
        if (cancelled) return;
        setPoNumbers(list);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('[Customer WIP] PO# dropdown', err);
        if (!cancelled) {
          setPoNumbers([]);
          enqueueSnackbar('Could not load PO numbers', { variant: 'error' });
        }
      } finally {
        if (!cancelled) setLoadingPoNumbers(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters.customer, filters.supplier, enqueueSnackbar]);

  /** Reset PO selection back to "All" if the previously chosen PO is no longer in the refreshed list. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.poScope === ALL) return prev;
      if (poNumbers.includes(prev.poScope)) return prev;
      return { ...prev, poScope: ALL };
    });
  }, [poNumbers]);

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
      if (prev.merchandiser !== ALL && !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)) {
        next.merchandiser = ALL;
        changed = true;
      }
      if (
        prev.productPortfolio !== ALL &&
        !portfolios.some((r) => milestonePortfolioKey(r) === prev.productPortfolio)
      ) {
        next.productPortfolio = ALL;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants, portfolios]);

  const dropdowns = useMemo(
    () => ({ customers, suppliers, merchants, portfolios }),
    [customers, suppliers, merchants, portfolios]
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: 'text.primary', mb: 3, lineHeight: 1.35 }}
      >
        {CUSTOMER_WIP_PAGE_TITLE}
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Report Type :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.reportType}
              onChange={handleSelect('reportType')}
              sx={selectSx}
            >
              <MenuItem value="merchandiserWise">Merchandiser Wise</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Product Portfolio :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.productPortfolio}
              onChange={handleSelect('productPortfolio')}
              sx={selectSx}
              disabled={loadingDropdowns && portfolios.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {portfolios
                .filter((row) => milestonePortfolioKey(row))
                .map((row) => {
                  const val = milestonePortfolioKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestonePortfolioLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            PO # :
          </Typography>
          <Autocomplete
            fullWidth
            size="small"
            disableClearable
            clearOnEscape
            disabled={loadingPoNumbers}
            loading={loadingPoNumbers}
            options={[ALL, ...poNumbers]}
            value={filters.poScope}
            onChange={(_, val) => setFilters((prev) => ({ ...prev, poScope: val || ALL }))}
            getOptionLabel={(opt) => (opt === ALL ? 'All' : String(opt ?? ''))}
            isOptionEqualToValue={(opt, val) => String(opt) === String(val)}
            noOptionsText={loadingPoNumbers ? 'Loading…' : 'No PO Found'}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={selectSx}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingPoNumbers ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Style :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.style} onChange={handleSelect('style')} sx={selectSx}>
              <MenuItem value={ALL}>All</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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
            <CustomerWipReportActions filters={filters} dropdowns={dropdowns} />
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel New: connect API when backend is ready.')}
              sx={{ minWidth: 170, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel New
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            *- This Date belong to Customer Shipment Date.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

const AMS_WIP_PAGE_TITLE = 'AMS WIP Report / Summary of Production Status Report';

/** AMS WIP Report — Merchandiser + Portfolio / Customer / Supplier via env APIs; PDF (demo rows) matches AMS WIP layout. */
function AmsWipReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    productPortfolio: ALL,
    customer: ALL,
    supplier: ALL,
    poScope: ALL,
    style: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  /** PO# dropdown (env-driven `/api/MyOrders/Getpono`, scoped by Customer + Supplier). */
  const [poNumbers, setPoNumbers] = useState([]);
  const [loadingPoNumbers, setLoadingPoNumbers] = useState(false);

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

  const selectSx = { borderRadius: 1 };

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for AMS WIP filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(wipLdpFobAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        setPortfolios(res.portfolios);

        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
        if (res.rejected.portfolios) enqueueSnackbar('Could not load product portfolios', { variant: 'error' });
      } catch (err) {
        console.error('[AMS WIP] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /**
   * Bind PO# dropdown.
   * - Initial load                  → all POs (no filter)
   * - Customer or Supplier changes  → POs scoped to the active filters
   * - Both back to ALL              → all POs again
   *
   * An `AbortController` cancels any in-flight request when filters flip again,
   * so rapid changes don't pile up duplicate calls or settle out of order.
   */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoadingPoNumbers(true);
      try {
        const list = await fetchPoNumbers(
          {
            customerId: filters.customer,
            supplierId: filters.supplier,
            signal: controller.signal,
          },
          wipLdpFobAuthHeaders()
        );
        if (cancelled) return;
        setPoNumbers(list);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('[AMS WIP] PO# dropdown', err);
        if (!cancelled) {
          setPoNumbers([]);
          enqueueSnackbar('Could not load PO numbers', { variant: 'error' });
        }
      } finally {
        if (!cancelled) setLoadingPoNumbers(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters.customer, filters.supplier, enqueueSnackbar]);

  /** Reset PO selection back to "All" if the previously chosen PO is no longer in the refreshed list. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.poScope === ALL) return prev;
      if (poNumbers.includes(prev.poScope)) return prev;
      return { ...prev, poScope: ALL };
    });
  }, [poNumbers]);

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
        prev.productPortfolio !== ALL &&
        !portfolios.some((r) => milestonePortfolioKey(r) === prev.productPortfolio)
      ) {
        next.productPortfolio = ALL;
        changed = true;
      }
      if (prev.merchandiser !== ALL && !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)) {
        next.merchandiser = ALL;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [customers, suppliers, portfolios, merchants]);

  const dropdowns = useMemo(
    () => ({ customers, suppliers, merchants, portfolios }),
    [customers, suppliers, merchants, portfolios]
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: 'text.primary', mb: 3, lineHeight: 1.35 }}
      >
        {AMS_WIP_PAGE_TITLE}
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Product Portfolio :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.productPortfolio}
              onChange={handleSelect('productPortfolio')}
              sx={selectSx}
              disabled={loadingDropdowns && portfolios.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {portfolios
                .filter((row) => milestonePortfolioKey(row))
                .map((row) => {
                  const val = milestonePortfolioKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestonePortfolioLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            PO # :
          </Typography>
          <Autocomplete
            fullWidth
            size="small"
            disableClearable
            clearOnEscape
            disabled={loadingPoNumbers}
            loading={loadingPoNumbers}
            options={[ALL, ...poNumbers]}
            value={filters.poScope}
            onChange={(_, val) => setFilters((prev) => ({ ...prev, poScope: val || ALL }))}
            getOptionLabel={(opt) => (opt === ALL ? 'All' : String(opt ?? ''))}
            isOptionEqualToValue={(opt, val) => String(opt) === String(val)}
            noOptionsText={loadingPoNumbers ? 'Loading…' : 'No PO Found'}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={selectSx}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingPoNumbers ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Style :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.style} onChange={handleSelect('style')} sx={selectSx}>
              <MenuItem value={ALL}>All</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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

        <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }} />

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <AmsWipReportActions filters={filters} dropdowns={dropdowns} />
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel New: connect API when backend is ready.')}
              sx={{ minWidth: 170, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel New
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            *- This Date belong to Customer Shipment Date.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

const SALT_WIP_PAGE_TITLE = 'Salt WIP Report / Summary of Production Status Report';

/** Salt WIP Report — env-backed dropdowns + PDF (demo rows) per Salt WIP grid (20 cols, black data). */
function SaltWipReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    reportType: 'merchandiserWise',
    merchandiser: ALL,
    productPortfolio: ALL,
    customer: ALL,
    supplier: ALL,
    poScope: ALL,
    style: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  /** PO# dropdown (env-driven `/api/MyOrders/Getpono`, scoped by Customer + Supplier). */
  const [poNumbers, setPoNumbers] = useState([]);
  const [loadingPoNumbers, setLoadingPoNumbers] = useState(false);

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

  const selectSx = { borderRadius: 1 };

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Salt WIP filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(wipLdpFobAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        setPortfolios(res.portfolios);

        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
        if (res.rejected.portfolios) enqueueSnackbar('Could not load product portfolios', { variant: 'error' });
      } catch (err) {
        console.error('[Salt WIP] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /**
   * Bind PO# dropdown.
   * - Initial load                  → all POs (no filter)
   * - Customer or Supplier changes  → POs scoped to the active filters
   * - Both back to ALL              → all POs again
   *
   * An `AbortController` cancels any in-flight request when filters flip again,
   * so rapid changes don't pile up duplicate calls or settle out of order.
   */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoadingPoNumbers(true);
      try {
        const list = await fetchPoNumbers(
          {
            customerId: filters.customer,
            supplierId: filters.supplier,
            signal: controller.signal,
          },
          wipLdpFobAuthHeaders()
        );
        if (cancelled) return;
        setPoNumbers(list);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('[Salt WIP] PO# dropdown', err);
        if (!cancelled) {
          setPoNumbers([]);
          enqueueSnackbar('Could not load PO numbers', { variant: 'error' });
        }
      } finally {
        if (!cancelled) setLoadingPoNumbers(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters.customer, filters.supplier, enqueueSnackbar]);

  /** Reset PO selection back to "All" if the previously chosen PO is no longer in the refreshed list. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.poScope === ALL) return prev;
      if (poNumbers.includes(prev.poScope)) return prev;
      return { ...prev, poScope: ALL };
    });
  }, [poNumbers]);

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
      if (prev.merchandiser !== ALL && !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)) {
        next.merchandiser = ALL;
        changed = true;
      }
      if (
        prev.productPortfolio !== ALL &&
        !portfolios.some((r) => milestonePortfolioKey(r) === prev.productPortfolio)
      ) {
        next.productPortfolio = ALL;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants, portfolios]);

  const dropdowns = useMemo(
    () => ({ customers, suppliers, merchants, portfolios }),
    [customers, suppliers, merchants, portfolios]
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: 'text.primary', mb: 3, lineHeight: 1.35 }}
      >
        {SALT_WIP_PAGE_TITLE}
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Report Type :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.reportType} onChange={handleSelect('reportType')} sx={selectSx}>
              <MenuItem value="merchandiserWise">Merchandiser Wise</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Merchandiser:
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Product Portfolio:
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.productPortfolio}
              onChange={handleSelect('productPortfolio')}
              sx={selectSx}
              disabled={loadingDropdowns && portfolios.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {portfolios
                .filter((row) => milestonePortfolioKey(row))
                .map((row) => {
                  const val = milestonePortfolioKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestonePortfolioLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Supplier:
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            PO # :
          </Typography>
          <Autocomplete
            fullWidth
            size="small"
            disableClearable
            clearOnEscape
            disabled={loadingPoNumbers}
            loading={loadingPoNumbers}
            options={[ALL, ...poNumbers]}
            value={filters.poScope}
            onChange={(_, val) => setFilters((prev) => ({ ...prev, poScope: val || ALL }))}
            getOptionLabel={(opt) => (opt === ALL ? 'All' : String(opt ?? ''))}
            isOptionEqualToValue={(opt, val) => String(opt) === String(val)}
            noOptionsText={loadingPoNumbers ? 'Loading…' : 'No PO Found'}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={selectSx}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingPoNumbers ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Style :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.style} onChange={handleSelect('style')} sx={selectSx}>
              <MenuItem value={ALL}>All</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            From:
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

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            To:
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
            <SaltWipReportActions filters={filters} dropdowns={dropdowns} />
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

        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            * - This Date belong to Supplier Shipment Date.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

const CUSTOMISED_CUSTOMER_WIP_PAGE_TITLE =
  'Customised Customer WIP Report / Summary of Production Status Report';

/** Customised Customer WIP — full-width Merchandiser; Customer / Supplier / PO; Style / dates; four actions. */
function CustomisedCustomerWipReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    customer: ALL,
    supplier: ALL,
    poScope: ALL,
    style: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  /** Shared filter lists (Merchandiser / Customer / Supplier). Product Portfolio isn't rendered here. */
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  /** PO# dropdown (env-driven `/api/MyOrders/Getpono`, scoped by Customer + Supplier). */
  const [poNumbers, setPoNumbers] = useState([]);
  const [loadingPoNumbers, setLoadingPoNumbers] = useState(false);

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

  const selectSx = { borderRadius: 1 };

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Customised Customer WIP filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(wipLdpFobAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        setPortfolios(res.portfolios);

        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[Customised Customer WIP] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** If a selected key isn't in the latest API list, reset it to "All". */
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
      if (prev.merchandiser !== ALL && !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)) {
        next.merchandiser = ALL;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants]);

  /**
   * Bind PO# dropdown.
   * - Initial load                  → all POs (no filter)
   * - Customer or Supplier changes  → POs scoped to the active filters
   * - Both back to ALL              → all POs again
   *
   * An `AbortController` cancels any in-flight request when filters flip again,
   * so rapid changes don't pile up duplicate calls or settle out of order.
   */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoadingPoNumbers(true);
      try {
        const list = await fetchPoNumbers(
          {
            customerId: filters.customer,
            supplierId: filters.supplier,
            signal: controller.signal,
          },
          wipLdpFobAuthHeaders()
        );
        if (cancelled) return;
        setPoNumbers(list);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('[Customised Customer WIP] PO# dropdown', err);
        if (!cancelled) {
          setPoNumbers([]);
          enqueueSnackbar('Could not load PO numbers', { variant: 'error' });
        }
      } finally {
        if (!cancelled) setLoadingPoNumbers(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters.customer, filters.supplier, enqueueSnackbar]);

  /** Reset PO selection back to "All" if the previously chosen PO is no longer in the refreshed list. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.poScope === ALL) return prev;
      if (poNumbers.includes(prev.poScope)) return prev;
      return { ...prev, poScope: ALL };
    });
  }, [poNumbers]);

  const dropdowns = useMemo(
    () => ({ customers, suppliers, merchants, portfolios }),
    [customers, suppliers, merchants, portfolios]
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: 'text.primary', mb: 3, lineHeight: 1.35 }}
      >
        {CUSTOMISED_CUSTOMER_WIP_PAGE_TITLE}
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Merchandiser:
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Customer:
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Supplier:
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            PO #:
          </Typography>
          <Autocomplete
            fullWidth
            size="small"
            disableClearable
            clearOnEscape
            disabled={loadingPoNumbers}
            loading={loadingPoNumbers}
            options={[ALL, ...poNumbers]}
            value={filters.poScope}
            onChange={(_, val) => setFilters((prev) => ({ ...prev, poScope: val || ALL }))}
            getOptionLabel={(opt) => (opt === ALL ? 'All' : String(opt ?? ''))}
            isOptionEqualToValue={(opt, val) => String(opt) === String(val)}
            noOptionsText={loadingPoNumbers ? 'Loading…' : 'No PO Found'}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={selectSx}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingPoNumbers ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Style:
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.style} onChange={handleSelect('style')} sx={selectSx}>
              <MenuItem value={ALL}>All</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            From:
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

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            To:
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
            <CustomisedCustomerWipReportActions filters={filters} dropdowns={dropdowns} />
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel New: connect API when backend is ready.')}
              sx={{ minWidth: 170, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel New
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1, textAlign: 'center' }}
          >
            *- This Date belong to Customer Shipment Date.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

/** Milestone Summary Page — filters + PDF; Merchandiser / Customer / Supplier / Product Portfolio from APIs (env). */
function WipReportForm({ pageTitle }) {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    reportType: 'merchandiserWise',
    merchandiser: ALL,
    supplier: ALL,
    /** Default Product Portfolio is the hardcoded `Apparel` option (not an API row). */
    productPortfolio: 'apparel',
    customer: ALL,
    poScope: ALL,
    reportVariant: 'general',
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  /** PO# dropdown (driven by `/api/MyOrders/Getpono`, scoped by customer only). */
  const [poNumbers, setPoNumbers] = useState([]);
  const [loadingPoNumbers, setLoadingPoNumbers] = useState(false);

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

  const selectSx = { borderRadius: 1 };

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Milestone Summary filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(wipLdpFobAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        setPortfolios(res.portfolios);

        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
        if (res.rejected.portfolios) enqueueSnackbar('Could not load product portfolios', { variant: 'error' });
      } catch (err) {
        console.error('[Milestone Summary] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /**
   * Bind PO# dropdown.
   * - Initial load        → all POs (no filter)
   * - Customer changes    → POs scoped to that customer
   * - `customer === ALL`  → all POs again
   *
   * Supplier filter on this page is intentionally not part of the PO query (per spec).
   * Any in-flight request is aborted when `customer` flips again, so rapid changes
   * don't pile up duplicate calls or settle out of order.
   */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoadingPoNumbers(true);
      try {
        const list = await fetchPoNumbers(
          {
            customerId: filters.customer,
            signal: controller.signal,
          },
          wipLdpFobAuthHeaders()
        );
        if (cancelled) return;
        setPoNumbers(list);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('[Milestone Summary] PO# dropdown', err);
        if (!cancelled) {
          setPoNumbers([]);
          enqueueSnackbar('Could not load PO numbers', { variant: 'error' });
        }
      } finally {
        if (!cancelled) setLoadingPoNumbers(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters.customer, enqueueSnackbar]);

  /** Reset PO selection back to "All" if the previously chosen PO is no longer in the refreshed list. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.poScope === ALL) return prev;
      if (poNumbers.includes(prev.poScope)) return prev;
      return { ...prev, poScope: ALL };
    });
  }, [poNumbers]);

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
      if (prev.merchandiser !== ALL && !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)) {
        next.merchandiser = ALL;
        changed = true;
      }
      if (
        prev.productPortfolio !== ALL &&
        prev.productPortfolio !== 'apparel' &&
        !portfolios.some((r) => milestonePortfolioKey(r) === prev.productPortfolio)
      ) {
        next.productPortfolio = ALL;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants, portfolios]);

  const dropdowns = useMemo(
    () => ({ customers, suppliers, merchants, portfolios }),
    [customers, suppliers, merchants, portfolios]
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        {pageTitle}
      </Typography>

      <Grid container spacing={2.5}>
        {filters.reportType === 'supplierWise' ? (
          <>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                Report Type :
              </Typography>
              <FormControl fullWidth size="small">
                <Select value={filters.reportType} onChange={handleSelect('reportType')} sx={selectSx}>
                  <MenuItem value="merchandiserWise">Merchandiser Wise</MenuItem>
                  <MenuItem value="supplierWise">Supplier Wise</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                Supplier:
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
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                Product Portfolio:
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.productPortfolio}
                  onChange={handleSelect('productPortfolio')}
                  sx={selectSx}
                  disabled={loadingDropdowns && portfolios.length === 0}
                >
                  <MenuItem value={ALL}>All</MenuItem>
                  <MenuItem value="apparel">Apparel</MenuItem>
                  {portfolios
                    .filter((row) => milestonePortfolioKey(row))
                    .filter(
                      (row) =>
                        milestonePortfolioLabel(row).trim().toLowerCase() !== 'apparel'
                    )
                    .map((row) => {
                      const val = milestonePortfolioKey(row);
                      return (
                        <MenuItem key={val} value={val}>
                          {milestonePortfolioLabel(row)}
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                PO # :
              </Typography>
              <Autocomplete
                fullWidth
                size="small"
                disableClearable
                clearOnEscape
                disabled={loadingPoNumbers}
                loading={loadingPoNumbers}
                options={[ALL, ...poNumbers]}
                value={filters.poScope}
                onChange={(_, val) => setFilters((prev) => ({ ...prev, poScope: val || ALL }))}
                getOptionLabel={(opt) => (opt === ALL ? 'All' : String(opt ?? ''))}
                isOptionEqualToValue={(opt, val) => String(opt) === String(val)}
                noOptionsText={loadingPoNumbers ? 'Loading…' : 'No PO Found'}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={selectSx}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingPoNumbers ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                From:
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
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                To:
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
          </>
        ) : (
          <>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="wip-report-type-label">Report Type</InputLabel>
                <Select
                  labelId="wip-report-type-label"
                  label="Report Type"
                  value={filters.reportType}
                  onChange={handleSelect('reportType')}
                  sx={selectSx}
                >
                  <MenuItem value="merchandiserWise">Merchandiser Wise</MenuItem>
                  <MenuItem value="supplierWise">Supplier Wise</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="wip-merch-label">Merchandiser</InputLabel>
                <Select
                  labelId="wip-merch-label"
                  label="Merchandiser"
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
              <FormControl fullWidth size="small">
                <InputLabel id="wip-portfolio-label">Product Portfolio</InputLabel>
                <Select
                  labelId="wip-portfolio-label"
                  label="Product Portfolio"
                  value={filters.productPortfolio}
                  onChange={handleSelect('productPortfolio')}
                  sx={selectSx}
                  disabled={loadingDropdowns && portfolios.length === 0}
                >
                  <MenuItem value={ALL}>All</MenuItem>
                  <MenuItem value="apparel">Apparel</MenuItem>
                  {portfolios
                    .filter((row) => milestonePortfolioKey(row))
                    .filter(
                      (row) =>
                        milestonePortfolioLabel(row).trim().toLowerCase() !== 'apparel'
                    )
                    .map((row) => {
                      const val = milestonePortfolioKey(row);
                      return (
                        <MenuItem key={val} value={val}>
                          {milestonePortfolioLabel(row)}
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="wip-customer-label">Customer</InputLabel>
                <Select
                  labelId="wip-customer-label"
                  label="Customer"
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
              <Autocomplete
                fullWidth
                size="small"
                disableClearable
                clearOnEscape
                disabled={loadingPoNumbers}
                loading={loadingPoNumbers}
                options={[ALL, ...poNumbers]}
                value={filters.poScope}
                onChange={(_, val) => setFilters((prev) => ({ ...prev, poScope: val || ALL }))}
                getOptionLabel={(opt) => (opt === ALL ? 'All' : String(opt ?? ''))}
                isOptionEqualToValue={(opt, val) => String(opt) === String(val)}
                noOptionsText={loadingPoNumbers ? 'Loading…' : 'No PO Found'}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="PO #"
                    sx={selectSx}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingPoNumbers ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="wip-report-variant-label">Report</InputLabel>
                <Select
                  labelId="wip-report-variant-label"
                  label="Report"
                  value={filters.reportVariant}
                  onChange={handleSelect('reportVariant')}
                  sx={selectSx}
                >
                  <MenuItem value="general">General</MenuItem>
                </Select>
              </FormControl>
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
                onChange={handleDate('fromDate')}
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
                onChange={handleDate('toDate')}
                InputLabelProps={{ shrink: true }}
                sx={selectSx}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <MilestoneSummaryReportActions filters={filters} dropdowns={dropdowns} />
            <MilestoneSummaryExcelDownloadButton filters={filters} dropdowns={dropdowns} />
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={DISABLE_MILESTONE_SUMMARY_EXCEL_DOWNLOAD}
              title={
                DISABLE_MILESTONE_SUMMARY_EXCEL_DOWNLOAD
                  ? 'Excel download is disabled for now'
                  : undefined
              }
              onClick={() => toast('Download Excel New: connect API when backend is ready.')}
              sx={{ minWidth: 170, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel New
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            *- This Date belong to Customer Shipment Date.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

FactoryWipReportForm.propTypes = { pageTitle: PropTypes.string.isRequired };
WipReportForm.propTypes = { pageTitle: PropTypes.string.isRequired };

// ----------------------------------------------------------------------

function renderWipReportPanel(activeReportId, pageTitle) {
  switch (activeReportId) {
    case 'factory-wip':
      return <FactoryWipReportForm key={activeReportId} pageTitle="Factory WIP Report" />;
    case 'customer-wip':
      return <CustomerWipReportForm key={activeReportId} />;
    case 'ams-wip':
      return <AmsWipReportForm key={activeReportId} />;
    case 'salt-wip':
      return <SaltWipReportForm key={activeReportId} />;
    case 'customised-customer-wip':
      return <CustomisedCustomerWipReportForm key={activeReportId} />;
    default:
      return <WipReportForm key={activeReportId} pageTitle={pageTitle} />;
  }
}

export default function WipHubView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const reportFromUrl = searchParams.get(REPORT_QUERY_KEY);
  const activeReportId = useMemo(() => {
    const valid = WIP_REPORT_OPTIONS.some((o) => o.id === reportFromUrl);
    return valid ? reportFromUrl : DEFAULT_REPORT_ID;
  }, [reportFromUrl]);

  useEffect(() => {
    if (!reportFromUrl || !WIP_REPORT_OPTIONS.some((o) => o.id === reportFromUrl)) {
      setSearchParams({ [REPORT_QUERY_KEY]: DEFAULT_REPORT_ID }, { replace: true });
    }
  }, [reportFromUrl, setSearchParams]);

  const selectedOption = useMemo(
    () => WIP_REPORT_OPTIONS.find((o) => o.id === activeReportId) ?? WIP_REPORT_OPTIONS[0],
    [activeReportId]
  );

  const handleReportChange = (e) => {
    const next = e.target.value;
    setSearchParams({ [REPORT_QUERY_KEY]: next }, { replace: true });
  };

  const pageTitle =
    selectedOption.id === 'milestone-summary'
      ? 'Milestone Summary Page'
      : `${selectedOption.label}`;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="WIP"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Reports', href: paths.dashboard.reports.root },
          { name: 'WIP' },
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
            maxWidth: { xs: '100%', sm: 260, md: 280 },
          }}
        >
          <InputLabel id="wip-switch-label" sx={{ fontSize: '0.8125rem' }}>
            WIP report
          </InputLabel>
          <Select
            labelId="wip-switch-label"
            label="WIP report"
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
                sx: { maxHeight: 320, '& .MuiMenuItem-root': { fontSize: '0.8125rem', minHeight: 36, py: 0.5 } },
              },
            }}
          >
            {WIP_REPORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      {renderWipReportPanel(activeReportId, pageTitle)}
    </Container>
  );
}
