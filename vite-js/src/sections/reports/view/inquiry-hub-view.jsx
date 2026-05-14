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
  buildInquiryReportPdfBlob,
  openInquiryReportPdf,
} from 'src/sections/reports/utils/inquiry-report-pdf-export';
import {
  buildPhotoShootSamplePdfBlob,
  openPhotoShootSamplePdf,
} from 'src/sections/reports/utils/photo-shoot-sample-pdf-export';
import {
  buildInquiryReportFactoryPdfBlob,
  openInquiryReportFactoryPdf,
} from 'src/sections/reports/utils/inquiry-report-factory-pdf-export';
import {
  buildPhotoShootSampleFactoryPdfBlob,
  openPhotoShootSampleFactoryPdf,
} from 'src/sections/reports/utils/photo-shoot-sample-factory-pdf-export';
import {
  buildInternalSdrPdfBlob,
  openInternalSdrPdf,
} from 'src/sections/reports/utils/internal-sample-development-report-pdf-export';
import {
  buildCustomerSdrPdfBlob,
  openCustomerSdrPdf,
} from 'src/sections/reports/utils/customer-development-report-pdf-export';
import {
  buildSupplierSdrPdfBlob,
  openSupplierSdrPdf,
} from 'src/sections/reports/utils/supplier-development-report-pdf-export';
import {
  buildInternalSdrDispatchPdfBlob,
  openInternalSdrDispatchPdf,
} from 'src/sections/reports/utils/internal-sdr-dispatch-pdf-export';
import {
  buildCustomerSdrDispatchPdfBlob,
  openCustomerSdrDispatchPdf,
} from 'src/sections/reports/utils/customer-sdr-dispatch-pdf-export';
import {
  buildSupplierSdrDispatchPdfBlob,
  openSupplierSdrDispatchPdf,
} from 'src/sections/reports/utils/supplier-sdr-dispatch-pdf-export';
import {
  buildCsWiseSdrPdfBlob,
  openCsWiseSdrPdf,
} from 'src/sections/reports/utils/cs-wise-sdr-pdf-export';

// ----------------------------------------------------------------------

/**
 * Sidebar dropdown entries for the Inquiry hub. Labels mirror the legacy
 * report names exactly so URL slugs stay stable once backend wiring lands.
 *
 * The first option ("inquiry-report-for-customer") is the default landing
 * view — its form is laid out per the legacy "Inquiry Report" print mock-up.
 */
export const INQUIRY_REPORT_OPTIONS = [
  { id: 'inquiry-report-for-customer', label: 'Inquiry Report For Customer' },
  { id: 'photo-shoot-sample-for-customer', label: 'Photo Shoot Sample For Customer' },
  { id: 'inquiry-report-for-factory', label: 'Inquiry Report For Factory' },
  { id: 'photo-shoot-sample-for-factory', label: 'Photo Shoot Sample For Factory' },
  { id: 'sample-development-report', label: 'Sample Development Report' },
  { id: 'merchant-inquiry-sheet', label: 'Merchant Inquiry Sheet' },
  { id: 'sample-development-report-only-dispatch', label: 'Sample Development Report only Dispatch' },
  { id: 'sample-development-report-cs-wise', label: 'Sample Development Report CS Wise' },
];

const DEFAULT_REPORT_ID = 'inquiry-report-for-customer';
const REPORT_QUERY_KEY = 'report';

const ALL = 'all';

// ----------------------------------------------------------------------
// Shared inquiry auth headers — mirrors the WIP / Shipment / Inspection hubs.
// ----------------------------------------------------------------------

function inquiryAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ----------------------------------------------------------------------
// Shared form styling (mirrors the Shipment / MGT / Inspection hub look).
// ----------------------------------------------------------------------

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
// Inquiry Report For Customer (default landing form)
// ----------------------------------------------------------------------

/**
 * "Inquiry Report" form — the default landing view for the Inquiry hub.
 *
 * Layout (per legacy print):
 *   - Row 1 : Customer dropdown, Supplier dropdown, Merchandiser dropdown.
 *   - Row 2 : From + To date inputs.
 *   - Row 3 : View Report, Download PDF, Download Excel — buttons sit
 *             directly under the date inputs.
 *
 * Customer / Supplier / Merchandiser come from the shared Milestone Summary
 * dropdown API. Buttons toast for now — they'll hook into the real backend
 * endpoint once confirmed, same pattern as the other report hubs.
 */
function InquiryReportForCustomerForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    merchandiser: ALL,
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

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the Inquiry Report PDF (demo data for now) and either preview-tab
   * it or trigger a direct file download. Real backend rows can be passed
   * later; for now the filter values are not embedded in the header.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildInquiryReportPdfBlob({});
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openInquiryReportPdf(mode, blob);
      } catch (err) {
        console.error('[InquiryReport] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Inquiry Report PDF', { variant: 'error' });
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
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Inquiry Report filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(inquiryAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[InquiryReport] dropdowns', err);
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
        Inquiry Report
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

        <Grid item xs={12} md={4} />
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'flex-start',
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
// Photo Shoot Sample For Customer
// ----------------------------------------------------------------------

/**
 * "Photo Shoot Samples" form — matches the legacy print layout.
 *
 * Layout (per legacy mock-up):
 *   - Row 1 : Merchandiser, Customer, Supplier dropdowns. Supplier shows
 *             "All Vendor" as the default option (legacy wording).
 *   - Row 2 : From + To date inputs.
 *   - Row 3 : View Report, Download PDF, Download Excel buttons — pinned
 *             directly under the To date column.
 *
 * Dropdown data comes from the shared Milestone Summary dropdown API.
 * Buttons toast for now and will hook into the real backend endpoint once
 * the contract is finalised, same pattern as the Inquiry Report form.
 */
function PhotoShootSampleForCustomerForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    customer: ALL,
    supplier: ALL,
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

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the Photo Shoot Sample PDF (demo data for now) and either preview
   * it in a new tab or trigger a direct file download. Real backend rows
   * can be passed later via the same shape.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildPhotoShootSamplePdfBlob({});
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openPhotoShootSamplePdf(mode, blob);
      } catch (err) {
        console.error('[PhotoShootSample] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Photo Shoot Sample PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Photo Shoot Sample filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(inquiryAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[PhotoShootSample] dropdowns', err);
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
        Photo Shoot Samples
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
              <MenuItem value={ALL}>All Merchandiser</MenuItem>
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

        <Grid item xs={12} md={4} />
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'flex-start',
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
// Photo Shoot Sample For Factory
// ----------------------------------------------------------------------

/**
 * "Photo Shoot Samples" form — Factory variant. Visually identical to the
 * customer-side Photo Shoot Sample form (per legacy print) but bound to the
 * Factory report endpoint when the backend is wired up. Layout:
 *
 *   - Row 1 : Merchandiser, Customer, Supplier dropdowns. Supplier shows
 *             "All Vendor" as the default option (legacy wording).
 *   - Row 2 : From + To date inputs.
 *   - Row 3 : View Report, Download PDF, Download Excel buttons — pinned
 *             directly under the To date column.
 */
function PhotoShootSampleForFactoryForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    customer: ALL,
    supplier: ALL,
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

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the Factory Photo Shoot Sample PDF (demo data for now) and either
   * preview it in a new tab or trigger a direct file download. Real backend
   * rows can be passed later via the same shape.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildPhotoShootSampleFactoryPdfBlob({});
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openPhotoShootSampleFactoryPdf(mode, blob);
      } catch (err) {
        console.error('[PhotoShootSampleFactory] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Photo Shoot Sample (Factory) PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Photo Shoot Sample (Factory) filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(inquiryAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[PhotoShootSampleFactory] dropdowns', err);
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
        Photo Shoot Samples
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
              <MenuItem value={ALL}>All Merchandiser</MenuItem>
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

        <Grid item xs={12} md={4} />
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'flex-start',
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
// Inquiry Report For Factory
// ----------------------------------------------------------------------

/**
 * "Inquiry Report For factory" form — matches the legacy print layout.
 *
 * Layout (per legacy mock-up):
 *   - Row 1 : Merchandiser dropdown, From date, To date — three columns
 *             that span the card width.
 *   - Row 2 : View Report, Download PDF, Download Excel buttons. Buttons
 *             sit directly under the From / To date columns (i.e. the
 *             left column under Merchandiser is intentionally empty).
 *
 * Merchandiser comes from the shared Milestone Summary dropdown API.
 * Buttons toast for now — they'll hook into the real backend endpoint
 * once confirmed, same pattern as the other report forms.
 */
function InquiryReportForFactoryForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [merchants, setMerchants] = useState([]);
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
   * Build the Inquiry Report For Factory PDF (demo data for now) and either
   * preview it in a new tab or trigger a direct file download. Real backend
   * rows can be passed later via the same shape.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildInquiryReportFactoryPdfBlob({});
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openInquiryReportFactoryPdf(mode, blob);
      } catch (err) {
        console.error('[InquiryReportFactory] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Inquiry Report For Factory PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Inquiry Report For Factory filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(inquiryAuthHeaders());
        if (cancelled) return;
        setMerchants(res.merchants);
        if (res.rejected.merchants) {
          enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
        }
      } catch (err) {
        console.error('[InquiryReportFactory] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset the merchandiser selection if it disappears from the latest API list. */
  useEffect(() => {
    setFilters((prev) => {
      if (
        prev.merchandiser !== ALL &&
        !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)
      ) {
        return { ...prev, merchandiser: ALL };
      }
      return prev;
    });
  }, [merchants]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Inquiry Report For factory
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
              <MenuItem value={ALL}>All Merchandiser</MenuItem>
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
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'flex-start',
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
// Sample Development Report
// ----------------------------------------------------------------------

/**
 * Sample Development Report variants offered in the legacy "Select" dropdown.
 * The list mirrors the ASP.NET print mock-up exactly (including the casing /
 * "ALL" vs "Select" prefix). The default landing option is the first entry.
 */
const SAMPLE_DEVELOPMENT_REPORT_VARIANTS = [
  { id: 'internal', label: 'INTERNAL SAMPLE DEVELOPMENT REPORT' },
  { id: 'all-customer', label: 'ALL Customer' },
  { id: 'all-supplier', label: 'ALL Supplier' },
  { id: 'select-customer', label: 'Select Customer' },
  { id: 'select-supplier', label: 'Select Supplier' },
];

/**
 * "Sample development report" form — matches the legacy print layout.
 *
 * Layout (per legacy mock-up):
 *   - Row 1 : Select dropdown (variant: INTERNAL / ALL Customer / ALL
 *             Supplier / Select Customer / Select Supplier). When the user
 *             picks "Select Customer" a Customer dropdown appears in the
 *             column to the right; "Select Supplier" reveals a Supplier
 *             dropdown in the same slot. The other variants leave that
 *             column empty.
 *   - Row 2 : From + To date inputs in the first two columns.
 *   - Row 3 : View Report, Download PDF, Download Excel buttons — pinned
 *             directly under the From / To date columns (left column under
 *             "Select" is intentionally empty).
 *
 * Buttons toast for now — they will hook into the real backend endpoint
 * once confirmed, same pattern as the other Inquiry hub forms.
 */
function SampleDevelopmentReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    variant: SAMPLE_DEVELOPMENT_REPORT_VARIANTS[0].id,
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
   * Build the right Sample Development Report PDF for the currently-selected
   * variant (demo data for now) and either preview it in a new tab or
   * trigger a direct file download. Variants that do not yet have a PDF
   * exporter fall through to the "coming soon" toast.
   *
   * - `internal`        → INTERNAL SAMPLE DEVELOPMENT REPORT (dd/MM/yyyy).
   * - `all-customer`    → CUSTOMER DEVELOPMENT REPORT (yyyy-MM-dd).
   * - `all-supplier`    → SUPPLIER DEVELOPMENT REPORT (dd/MM/yyyy).
   * - `select-customer` → "<CUSTOMER> SAMPLE DEVELOPMENT REPORT" — uses the
   *                       Customer Development Report layout but the title
   *                       is prefixed with the selected customer name.
   * - `select-supplier` → "<SUPPLIER> SAMPLE DEVELOPMENT REPORT" — uses the
   *                       Supplier Development Report layout but the title
   *                       is prefixed with the selected supplier name.
   *
   * When the user picks "Select Customer" / "Select Supplier" without
   * choosing an actual customer / supplier, a warning toast asks them to
   * pick one and the PDF build is aborted.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;

      let exporter = null;
      if (filters.variant === 'internal') {
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        exporter = {
          label: 'Internal Sample Development Report',
          build: () =>
            buildInternalSdrPdfBlob({
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
            }),
          open: openInternalSdrPdf,
        };
      } else if (filters.variant === 'all-customer') {
        exporter = {
          label: 'Customer Development Report',
          build: () =>
            buildCustomerSdrPdfBlob({
              ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
              ...(filters.toDate ? { toDate: filters.toDate } : {}),
            }),
          open: openCustomerSdrPdf,
        };
      } else if (filters.variant === 'all-supplier') {
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        exporter = {
          label: 'Supplier Development Report',
          build: () =>
            buildSupplierSdrPdfBlob({
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
            }),
          open: openSupplierSdrPdf,
        };
      } else if (filters.variant === 'select-customer') {
        if (filters.customer === ALL) {
          enqueueSnackbar('Please Select Customer', { variant: 'warning' });
          return;
        }
        const row = customers.find((r) => milestoneCustomerKey(r) === filters.customer);
        const name = (row ? milestoneCustomerLabel(row) : '').toString().trim();
        const title = `${(name || 'CUSTOMER').toUpperCase()} SAMPLE DEVELOPMENT REPORT`;
        exporter = {
          label: title,
          build: () =>
            buildCustomerSdrPdfBlob({
              title,
              ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
              ...(filters.toDate ? { toDate: filters.toDate } : {}),
              // Empty rows for now — backend rows wire in via the same shape
              // once the per-customer endpoint is confirmed.
              items: [{ serial: '1', pictures: [], customer: name }],
            }),
          open: openCustomerSdrPdf,
        };
      } else if (filters.variant === 'select-supplier') {
        if (filters.supplier === ALL) {
          enqueueSnackbar('Please Select Supplier', { variant: 'warning' });
          return;
        }
        const row = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
        const name = (row ? milestoneSupplierLabel(row) : '').toString().trim();
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        const title = `${(name || 'SUPPLIER').toUpperCase()} SAMPLE DEVELOPMENT REPORT`;
        exporter = {
          label: title,
          build: () =>
            buildSupplierSdrPdfBlob({
              title,
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
              items: [{ serial: '1', pictures: [], factoryName: name }],
            }),
          open: openSupplierSdrPdf,
        };
      }

      if (!exporter) return; // handled by toast callers below

      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await exporter.build();
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        exporter.open(mode, blob);
      } catch (err) {
        console.error(`[SampleDevelopmentReport:${filters.variant}] PDF build failed`, err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar(`Could not build ${exporter.label} PDF`, { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [
      generatingPdf,
      enqueueSnackbar,
      filters.variant,
      filters.fromDate,
      filters.toDate,
      filters.customer,
      filters.supplier,
      customers,
      suppliers,
    ]
  );

  const hasPdfExporter =
    filters.variant === 'internal' ||
    filters.variant === 'all-customer' ||
    filters.variant === 'all-supplier' ||
    filters.variant === 'select-customer' ||
    filters.variant === 'select-supplier';

  const handleViewReport = useCallback(() => {
    if (hasPdfExporter) {
      runPdfExport('view');
      return;
    }
    toast('View Report: connect API when backend is ready.');
  }, [hasPdfExporter, runPdfExport, toast]);

  const handleDownloadPdf = useCallback(() => {
    if (hasPdfExporter) {
      runPdfExport('pdf');
      return;
    }
    toast('Download PDF: connect API when backend is ready.');
  }, [hasPdfExporter, runPdfExport, toast]);

  /**
   * Customer / Supplier lists for the conditional second-column dropdown.
   * Lazily fetched the first time the user picks a "Select …" variant so
   * the API call doesn't fire when the form lands on INTERNAL.
   */
  const needsCustomerList = filters.variant === 'select-customer';
  const needsSupplierList = filters.variant === 'select-supplier';
  const needsAnyList = needsCustomerList || needsSupplierList;

  useEffect(() => {
    if (!needsAnyList) return undefined;
    if (customers.length > 0 || suppliers.length > 0) return undefined;

    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Sample Development Report filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(inquiryAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[SampleDevelopmentReport] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsAnyList, customers.length, suppliers.length, enqueueSnackbar]);

  /** Reset the selected customer / supplier when its list refreshes. */
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
        Sample development report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Select :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.variant}
              onChange={handleSelect('variant')}
              sx={selectSx}
            >
              {SAMPLE_DEVELOPMENT_REPORT_VARIANTS.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {needsCustomerList && (
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
        )}

        {needsSupplierList && (
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
        )}

        {!needsAnyList && <Grid item xs={12} md={4} />}
        <Grid item xs={12} md={4} />

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

        <Grid item xs={12} md={4} />
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'flex-start',
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
              {generatingPdf && hasPdfExporter ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf && hasPdfExporter ? 'Building…' : 'Download PDF'}
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
// Merchant Inquiry Sheet
// ----------------------------------------------------------------------

/**
 * "Merchant Inquiry" form — the Merchant Inquiry Sheet variant of the
 * Sample Development Report. Visually identical to that form (per legacy
 * print): same Select dropdown options, same conditional Customer /
 * Supplier secondary dropdown, same date inputs and action buttons. Only
 * the card heading and the eventual backend endpoint differ.
 *
 * Layout (per legacy mock-up):
 *   - Row 1 : Select dropdown (INTERNAL / ALL Customer / ALL Supplier /
 *             Select Customer / Select Supplier). Picking "Select
 *             Customer" or "Select Supplier" reveals a Customer /
 *             Supplier dropdown in the column to the right.
 *   - Row 2 : From + To date inputs.
 *   - Row 3 : View Report, Download PDF, Download Excel buttons — pinned
 *             under the From / To columns.
 */
function MerchantInquirySheetForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    variant: SAMPLE_DEVELOPMENT_REPORT_VARIANTS[0].id,
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
   * Build the right Merchant Inquiry PDF for the currently-selected variant
   * (demo data for now) and either preview it in a new tab or trigger a
   * direct file download. Variants that do not yet have a PDF exporter
   * fall through to the "coming soon" toast.
   *
   * Same dispatch matrix as Sample Development Report — the three legacy
   * PDFs are reused unchanged:
   *   - `internal`        → INTERNAL SAMPLE DEVELOPMENT REPORT.
   *   - `all-customer`    → CUSTOMER DEVELOPMENT REPORT.
   *   - `all-supplier`    → SUPPLIER DEVELOPMENT REPORT.
   *   - `select-customer` → "<CUSTOMER> SAMPLE DEVELOPMENT REPORT" (warns
   *                          if no customer was picked).
   *   - `select-supplier` → "<SUPPLIER> SAMPLE DEVELOPMENT REPORT" (warns
   *                          if no supplier was picked).
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;

      let exporter = null;
      if (filters.variant === 'internal') {
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        exporter = {
          label: 'Internal Sample Development Report',
          build: () =>
            buildInternalSdrPdfBlob({
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
            }),
          open: openInternalSdrPdf,
        };
      } else if (filters.variant === 'all-customer') {
        exporter = {
          label: 'Customer Development Report',
          build: () =>
            buildCustomerSdrPdfBlob({
              ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
              ...(filters.toDate ? { toDate: filters.toDate } : {}),
            }),
          open: openCustomerSdrPdf,
        };
      } else if (filters.variant === 'all-supplier') {
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        exporter = {
          label: 'Supplier Development Report',
          build: () =>
            buildSupplierSdrPdfBlob({
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
            }),
          open: openSupplierSdrPdf,
        };
      } else if (filters.variant === 'select-customer') {
        if (filters.customer === ALL) {
          enqueueSnackbar('Please Select Customer', { variant: 'warning' });
          return;
        }
        const row = customers.find((r) => milestoneCustomerKey(r) === filters.customer);
        const name = (row ? milestoneCustomerLabel(row) : '').toString().trim();
        const title = `${(name || 'CUSTOMER').toUpperCase()} SAMPLE DEVELOPMENT REPORT`;
        exporter = {
          label: title,
          build: () =>
            buildCustomerSdrPdfBlob({
              title,
              ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
              ...(filters.toDate ? { toDate: filters.toDate } : {}),
              items: [{ serial: '1', pictures: [], customer: name }],
            }),
          open: openCustomerSdrPdf,
        };
      } else if (filters.variant === 'select-supplier') {
        if (filters.supplier === ALL) {
          enqueueSnackbar('Please Select Supplier', { variant: 'warning' });
          return;
        }
        const row = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
        const name = (row ? milestoneSupplierLabel(row) : '').toString().trim();
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        const title = `${(name || 'SUPPLIER').toUpperCase()} SAMPLE DEVELOPMENT REPORT`;
        exporter = {
          label: title,
          build: () =>
            buildSupplierSdrPdfBlob({
              title,
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
              items: [{ serial: '1', pictures: [], factoryName: name }],
            }),
          open: openSupplierSdrPdf,
        };
      }

      if (!exporter) return;

      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await exporter.build();
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        exporter.open(mode, blob);
      } catch (err) {
        console.error(`[MerchantInquiry:${filters.variant}] PDF build failed`, err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar(`Could not build ${exporter.label} PDF`, { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [
      generatingPdf,
      enqueueSnackbar,
      filters.variant,
      filters.fromDate,
      filters.toDate,
      filters.customer,
      filters.supplier,
      customers,
      suppliers,
    ]
  );

  const hasPdfExporter =
    filters.variant === 'internal' ||
    filters.variant === 'all-customer' ||
    filters.variant === 'all-supplier' ||
    filters.variant === 'select-customer' ||
    filters.variant === 'select-supplier';

  const handleViewReport = useCallback(() => {
    if (hasPdfExporter) {
      runPdfExport('view');
      return;
    }
    toast('View Report: connect API when backend is ready.');
  }, [hasPdfExporter, runPdfExport, toast]);

  const handleDownloadPdf = useCallback(() => {
    if (hasPdfExporter) {
      runPdfExport('pdf');
      return;
    }
    toast('Download PDF: connect API when backend is ready.');
  }, [hasPdfExporter, runPdfExport, toast]);

  /**
   * Customer / Supplier lists for the conditional second-column dropdown.
   * Lazily fetched the first time the user picks a "Select …" variant so
   * the API call doesn't fire when the form lands on INTERNAL.
   */
  const needsCustomerList = filters.variant === 'select-customer';
  const needsSupplierList = filters.variant === 'select-supplier';
  const needsAnyList = needsCustomerList || needsSupplierList;

  useEffect(() => {
    if (!needsAnyList) return undefined;
    if (customers.length > 0 || suppliers.length > 0) return undefined;

    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Merchant Inquiry filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(inquiryAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[MerchantInquiry] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsAnyList, customers.length, suppliers.length, enqueueSnackbar]);

  /** Reset the selected customer / supplier when its list refreshes. */
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
        Merchant Inquiry
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Select :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.variant}
              onChange={handleSelect('variant')}
              sx={selectSx}
            >
              {SAMPLE_DEVELOPMENT_REPORT_VARIANTS.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {needsCustomerList && (
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
        )}

        {needsSupplierList && (
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
        )}

        {!needsAnyList && <Grid item xs={12} md={4} />}
        <Grid item xs={12} md={4} />

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

        <Grid item xs={12} md={4} />
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'flex-start',
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
              {generatingPdf && hasPdfExporter ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf && hasPdfExporter ? 'Building…' : 'Download PDF'}
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
// Sample Development Report only Dispatch
// ----------------------------------------------------------------------

/**
 * "Sample Development Report for Dispatch Inquiry" form — the "only
 * Dispatch" variant of the Sample Development Report (per the legacy
 * Inquiry hub menu). Visually identical to the regular Sample Development
 * Report form: same Select dropdown options, same conditional Customer /
 * Supplier secondary dropdown, same date inputs and action buttons. Only
 * the card heading and the eventual backend endpoint differ.
 */
function SampleDevelopmentReportOnlyDispatchForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    variant: SAMPLE_DEVELOPMENT_REPORT_VARIANTS[0].id,
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
   * Build the right Sample Development Report (Dispatch) PDF for the
   * currently-selected variant. Dedicated Dispatch-flavored exporters are
   * used (they add a CATEGORY column and ship dispatched demo rows per
   * the legacy "Sample Development Report for Dispatch Inquiry" mock-up):
   *   - `internal`        → INTERNAL SAMPLE DEVELOPMENT REPORT (Dispatch).
   *   - `all-customer`    → CUSTOMER DEVELOPMENT REPORT (Dispatch).
   *   - `all-supplier`    → SUPPLIER DEVELOPMENT REPORT (Dispatch).
   *   - `select-customer` → "<CUSTOMER> SAMPLE DEVELOPMENT REPORT" (Dispatch
   *                          customer layout; warns if no customer picked).
   *   - `select-supplier` → "<SUPPLIER> SAMPLE DEVELOPMENT REPORT" (Dispatch
   *                          supplier layout; warns if no supplier picked).
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;

      let exporter = null;
      if (filters.variant === 'internal') {
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        exporter = {
          label: 'Internal Sample Development Report (Dispatch)',
          build: () =>
            buildInternalSdrDispatchPdfBlob({
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
            }),
          open: openInternalSdrDispatchPdf,
        };
      } else if (filters.variant === 'all-customer') {
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        exporter = {
          label: 'Customer Development Report (Dispatch)',
          build: () =>
            buildCustomerSdrDispatchPdfBlob({
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
            }),
          open: openCustomerSdrDispatchPdf,
        };
      } else if (filters.variant === 'all-supplier') {
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        exporter = {
          label: 'Supplier Development Report (Dispatch)',
          build: () =>
            buildSupplierSdrDispatchPdfBlob({
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
            }),
          open: openSupplierSdrDispatchPdf,
        };
      } else if (filters.variant === 'select-customer') {
        if (filters.customer === ALL) {
          enqueueSnackbar('Please Select Customer', { variant: 'warning' });
          return;
        }
        const row = customers.find((r) => milestoneCustomerKey(r) === filters.customer);
        const name = (row ? milestoneCustomerLabel(row) : '').toString().trim();
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        const title = `${(name || 'CUSTOMER').toUpperCase()} SAMPLE DEVELOPMENT REPORT`;
        exporter = {
          label: title,
          build: () =>
            buildCustomerSdrDispatchPdfBlob({
              title,
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
              items: [{ serial: '1', pictures: [], customer: name }],
            }),
          open: openCustomerSdrDispatchPdf,
        };
      } else if (filters.variant === 'select-supplier') {
        if (filters.supplier === ALL) {
          enqueueSnackbar('Please Select Supplier', { variant: 'warning' });
          return;
        }
        const row = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
        const name = (row ? milestoneSupplierLabel(row) : '').toString().trim();
        const fromLabel = filters.fromDate
          ? new Date(filters.fromDate).toLocaleDateString('en-GB')
          : null;
        const toLabel = filters.toDate
          ? new Date(filters.toDate).toLocaleDateString('en-GB')
          : null;
        const title = `${(name || 'SUPPLIER').toUpperCase()} SAMPLE DEVELOPMENT REPORT`;
        exporter = {
          label: title,
          build: () =>
            buildSupplierSdrDispatchPdfBlob({
              title,
              ...(fromLabel ? { fromDate: fromLabel } : {}),
              ...(toLabel ? { toDate: toLabel } : {}),
              items: [{ serial: '1', pictures: [], factoryName: name }],
            }),
          open: openSupplierSdrDispatchPdf,
        };
      }

      if (!exporter) return;

      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await exporter.build();
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        exporter.open(mode, blob);
      } catch (err) {
        console.error(`[SDROnlyDispatch:${filters.variant}] PDF build failed`, err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar(`Could not build ${exporter.label} PDF`, { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [
      generatingPdf,
      enqueueSnackbar,
      filters.variant,
      filters.fromDate,
      filters.toDate,
      filters.customer,
      filters.supplier,
      customers,
      suppliers,
    ]
  );

  const hasPdfExporter =
    filters.variant === 'internal' ||
    filters.variant === 'all-customer' ||
    filters.variant === 'all-supplier' ||
    filters.variant === 'select-customer' ||
    filters.variant === 'select-supplier';

  const handleViewReport = useCallback(() => {
    if (hasPdfExporter) {
      runPdfExport('view');
      return;
    }
    toast('View Report: connect API when backend is ready.');
  }, [hasPdfExporter, runPdfExport, toast]);

  const handleDownloadPdf = useCallback(() => {
    if (hasPdfExporter) {
      runPdfExport('pdf');
      return;
    }
    toast('Download PDF: connect API when backend is ready.');
  }, [hasPdfExporter, runPdfExport, toast]);

  /**
   * Customer / Supplier lists for the conditional second-column dropdown.
   * Lazily fetched the first time the user picks a "Select …" variant so
   * the API call doesn't fire when the form lands on INTERNAL.
   */
  const needsCustomerList = filters.variant === 'select-customer';
  const needsSupplierList = filters.variant === 'select-supplier';
  const needsAnyList = needsCustomerList || needsSupplierList;

  useEffect(() => {
    if (!needsAnyList) return undefined;
    if (customers.length > 0 || suppliers.length > 0) return undefined;

    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Dispatch Inquiry filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(inquiryAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[SDROnlyDispatch] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsAnyList, customers.length, suppliers.length, enqueueSnackbar]);

  /** Reset the selected customer / supplier when its list refreshes. */
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
        Sample Development Report for Dispatch Inquiry
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Select :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.variant}
              onChange={handleSelect('variant')}
              sx={selectSx}
            >
              {SAMPLE_DEVELOPMENT_REPORT_VARIANTS.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {needsCustomerList && (
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
        )}

        {needsSupplierList && (
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
        )}

        {!needsAnyList && <Grid item xs={12} md={4} />}
        <Grid item xs={12} md={4} />

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

        <Grid item xs={12} md={4} />
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'flex-start',
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
              {generatingPdf && hasPdfExporter ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf && hasPdfExporter ? 'Building…' : 'Download PDF'}
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
// Sample Development Report CS Wise
// ----------------------------------------------------------------------

/**
 * "Sample Development Report" — CS Wise variant. The legacy print form is
 * split into two stacked sections that share the card heading:
 *
 *   - Left half  : Customer-first filter — Customer dropdown, Supplier
 *                  dropdown, From, To, then View/Download buttons.
 *   - Right half : Supplier-first filter — Supplier dropdown, Customer
 *                  dropdown, From, To, then View/Download buttons.
 *
 * Both halves share the Milestone Summary dropdown lists (single API
 * fetch). Buttons toast for now and will hook into the per-side backend
 * endpoint once confirmed.
 */
function SampleDevelopmentReportCsWiseForm() {
  const { enqueueSnackbar } = useSnackbar();

  /** Left half (Customer is the primary filter). */
  const [leftFilters, setLeftFilters] = useState({
    customer: ALL,
    supplier: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  /** Right half (Supplier is the primary filter). */
  const [rightFilters, setRightFilters] = useState({
    supplier: ALL,
    customer: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const handleLeft = (name) => (e) => {
    setLeftFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleRight = (name) => (e) => {
    setRightFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  /** Convert <input type="date"> value (YYYY-MM-DD) to MM/DD/YYYY for the PDF. */
  const toPdfDate = useCallback((isoLike) => {
    if (!isoLike) return '';
    const [y, m, d] = isoLike.split('-');
    if (!y || !m || !d) return isoLike;
    return `${m}/${d}/${y}`;
  }, []);

  const runPdfExport = useCallback(
    async (mode, side) => {
      const f = side === 'customer' ? leftFilters : rightFilters;
      try {
        const blob = await buildCsWiseSdrPdfBlob({
          fromDate: toPdfDate(f.fromDate),
          toDate: toPdfDate(f.toDate),
        });
        openCsWiseSdrPdf(mode, blob);
      } catch (err) {
        console.error('[SDRCsWise] pdf', err);
        enqueueSnackbar('Could not generate PDF', { variant: 'error' });
      }
    },
    [leftFilters, rightFilters, toPdfDate, enqueueSnackbar]
  );

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for CS Wise Sample Development filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(inquiryAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[SDRCsWise] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset any selected value that disappears from the latest API list. */
  useEffect(() => {
    setLeftFilters((prev) => {
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
    setRightFilters((prev) => {
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

  const renderCustomerSelect = (value, onChange) => (
    <FormControl fullWidth size="small">
      <Select
        value={value}
        onChange={onChange}
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
  );

  const renderSupplierSelect = (value, onChange) => (
    <FormControl fullWidth size="small">
      <Select
        value={value}
        onChange={onChange}
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
  );

  const renderDateInput = (value, onChange) => (
    <TextField
      fullWidth
      size="small"
      type="date"
      value={value}
      onChange={onChange}
      InputLabelProps={{ shrink: true }}
      sx={selectSx}
    />
  );

  const renderActionButtons = (side) => (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mt: 2,
        justifyContent: 'flex-start',
      }}
    >
      <Button
        variant="contained"
        color="primary"
        size="medium"
        onClick={() => runPdfExport('view', side)}
        sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600 }}
      >
        View Report
      </Button>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        onClick={() => runPdfExport('pdf', side)}
        sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600 }}
      >
        Download PDF
      </Button>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        onClick={() => toast(`Download Excel (${side}): connect API when backend is ready.`)}
        sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600 }}
      >
        Download Excel
      </Button>
    </Box>
  );

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Sample Development Report
      </Typography>

      <Grid container spacing={{ xs: 3, md: 6 }}>
        {/* Left half — Customer-first filter */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                Customer :
              </Typography>
              {renderCustomerSelect(leftFilters.customer, handleLeft('customer'))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                Supplier :
              </Typography>
              {renderSupplierSelect(leftFilters.supplier, handleLeft('supplier'))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                From :
              </Typography>
              {renderDateInput(leftFilters.fromDate, handleLeft('fromDate'))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                To :
              </Typography>
              {renderDateInput(leftFilters.toDate, handleLeft('toDate'))}
            </Grid>

            <Grid item xs={12}>{renderActionButtons('customer')}</Grid>
          </Grid>
        </Grid>

        {/* Right half — Supplier-first filter */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                Supplier :
              </Typography>
              {renderSupplierSelect(rightFilters.supplier, handleRight('supplier'))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                Customer :
              </Typography>
              {renderCustomerSelect(rightFilters.customer, handleRight('customer'))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                From :
              </Typography>
              {renderDateInput(rightFilters.fromDate, handleRight('fromDate'))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                To :
              </Typography>
              {renderDateInput(rightFilters.toDate, handleRight('toDate'))}
            </Grid>

            <Grid item xs={12}>{renderActionButtons('supplier')}</Grid>
          </Grid>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Placeholder forms for the rest of the Inquiry hub menu
// ----------------------------------------------------------------------

/** Stub form used for the remaining "coming soon" Inquiry reports. */
function PlaceholderInquiryReportForm({ pageTitle }) {
  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        {pageTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Filters and report actions for <strong>{pageTitle}</strong> will be wired here when the
        backend contracts are confirmed.
      </Typography>
    </Card>
  );
}

PlaceholderInquiryReportForm.propTypes = {
  pageTitle: PropTypes.string.isRequired,
};

function renderInquiryReportPanel(activeReportId, pageTitle) {
  switch (activeReportId) {
    case 'inquiry-report-for-customer':
      return <InquiryReportForCustomerForm key={activeReportId} />;
    case 'photo-shoot-sample-for-customer':
      return <PhotoShootSampleForCustomerForm key={activeReportId} />;
    case 'inquiry-report-for-factory':
      return <InquiryReportForFactoryForm key={activeReportId} />;
    case 'photo-shoot-sample-for-factory':
      return <PhotoShootSampleForFactoryForm key={activeReportId} />;
    case 'sample-development-report':
      return <SampleDevelopmentReportForm key={activeReportId} />;
    case 'merchant-inquiry-sheet':
      return <MerchantInquirySheetForm key={activeReportId} />;
    case 'sample-development-report-only-dispatch':
      return <SampleDevelopmentReportOnlyDispatchForm key={activeReportId} />;
    case 'sample-development-report-cs-wise':
      return <SampleDevelopmentReportCsWiseForm key={activeReportId} />;
    default:
      return <InquiryReportForCustomerForm key={activeReportId} />;
  }
}

// ----------------------------------------------------------------------

export default function InquiryHubView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const reportFromUrl = searchParams.get(REPORT_QUERY_KEY);
  const activeReportId = useMemo(() => {
    const valid = INQUIRY_REPORT_OPTIONS.some((o) => o.id === reportFromUrl);
    return valid ? reportFromUrl : DEFAULT_REPORT_ID;
  }, [reportFromUrl]);

  useEffect(() => {
    if (!reportFromUrl || !INQUIRY_REPORT_OPTIONS.some((o) => o.id === reportFromUrl)) {
      setSearchParams({ [REPORT_QUERY_KEY]: DEFAULT_REPORT_ID }, { replace: true });
    }
  }, [reportFromUrl, setSearchParams]);

  const selectedOption = useMemo(
    () =>
      INQUIRY_REPORT_OPTIONS.find((o) => o.id === activeReportId) ?? INQUIRY_REPORT_OPTIONS[0],
    [activeReportId]
  );

  const handleReportChange = (e) => {
    const next = e.target.value;
    setSearchParams({ [REPORT_QUERY_KEY]: next }, { replace: true });
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="Inquiry"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Reports', href: paths.dashboard.reports.root },
          { name: 'Inquiry' },
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
            maxWidth: { xs: '100%', sm: 360, md: 400 },
          }}
        >
          <InputLabel id="inquiry-switch-label" sx={{ fontSize: '0.8125rem' }}>
            Inquiry report
          </InputLabel>
          <Select
            labelId="inquiry-switch-label"
            label="Inquiry report"
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
            {INQUIRY_REPORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      {renderInquiryReportPanel(activeReportId, selectedOption.label)}
    </Container>
  );
}
