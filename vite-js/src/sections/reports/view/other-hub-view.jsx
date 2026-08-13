import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Button,
  Autocomplete,
  CircularProgress,
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
  milestoneMerchantKey,
  milestoneMerchantLabel,
  milestoneCustomerKey,
  milestoneCustomerLabel,
  milestoneSupplierKey,
  milestoneSupplierLabel,
  milestonePortfolioKey,
  milestonePortfolioLabel,
} from 'src/sections/reports/utils/milestone-summary-dropdown-api';
import { fetchPoNumbers } from 'src/sections/reports/utils/pono-dropdown-api';
import {
  buildUserFootPrintPdfBlob,
  openUserFootPrintPdf,
} from 'src/sections/reports/utils/user-foot-print-pdf-export';
import {
  buildUserLoginDetailPdfBlob,
  openUserLoginDetailPdf,
  buildUserLoginDetailSummaryPdfBlob,
} from 'src/sections/reports/utils/user-login-detail-pdf-export';
import {
  buildQuickOrdersOverviewPdfBlob,
  openQuickOrdersOverviewPdf,
} from 'src/sections/reports/utils/quick-orders-overview-pdf-export';
import { buildDpgReportPdfBlob, openDpgReportPdf } from 'src/sections/reports/utils/dpg-report-pdf-export';
import {
  buildProductionHistoryPdfBlob,
  openProductionHistoryPdf,
} from 'src/sections/reports/utils/production-history-pdf-export';
import {
  buildSupplierMarchandReportPdfBlob,
  openSupplierMarchandReportPdf,
} from 'src/sections/reports/utils/supplier-marchand-report-pdf-export';
import {
  buildOrderDetailReportPdfBlob,
  openOrderDetailReportPdf,
} from 'src/sections/reports/utils/order-detail-report-pdf-export';
import {
  buildMerchandiserProgressReportPdfBlob,
  openMerchandiserProgressReportPdf,
} from 'src/sections/reports/utils/merchandiser-progress-report-pdf-export';
import { useUserReportOptions } from 'src/sections/reports/utils/use-user-report-options';

// ----------------------------------------------------------------------

/**
 * Sidebar dropdown entries for the Other hub. Labels mirror the legacy
 * report names exactly so URL slugs stay stable once backend wiring lands.
 *
 * Default landing view is "User Foot Print" (matches the legacy print
 * mock-up).
 */
export const OTHER_REPORT_OPTIONS = [
  { id: 'user-foot-print', label: 'User Foot Print' },
  { id: 'user-login-detail', label: 'User Login Detail' },
  { id: 'quick-orders-overview-report', label: 'Quick Orders Overview Report' },
  { id: 'dpg-report', label: 'DPG Report' },
  { id: 'production-history-report', label: 'Production History Report' },
  { id: 'supplier-marchand-report', label: 'Supplier Marchand Report' },
  { id: 'order-detail-report', label: 'Order Detail Report' },
  { id: 'merchandiser-progress-report', label: 'Merchandiser Progress Report' },
];

const REPORT_QUERY_KEY = 'report';

const ALL = 'all';

// ----------------------------------------------------------------------
// Shared auth headers — mirrors the WIP / Shipment / Inspection / Inquiry hubs.
// ----------------------------------------------------------------------

function otherAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ----------------------------------------------------------------------
// Shared form styling (mirrors the Shipment / MGT / Inspection / Inquiry hub look).
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
// "Pages" dropdown source for the User Foot Print form.
//
// The legacy ASP.NET screen drives this list off the application page
// catalog. Until the backend endpoint is finalized we ship the same
// curated set of trackable pages used by the print mock-up.
// ----------------------------------------------------------------------

const USER_FOOT_PRINT_PAGES = ['TNA Chart', 'Inspection'];

// ----------------------------------------------------------------------
// User Foot Print (default landing form)
// ----------------------------------------------------------------------

/**
 * "User Foot Print Report" — the default landing view for the Other hub.
 *
 * Layout (per legacy print mock-up):
 *   - Row 1 : Pages dropdown (defaults to "TNA Chart"), User dropdown
 *             (defaults to "All Merchandiser").
 *   - Row 2 : From + To date inputs.
 *   - Row 3 : View Report, Download PDF, Download Excel — sit directly
 *             under the date inputs.
 *
 * Users dropdown is populated from the shared Milestone Summary
 * dropdown API (the "Merchandiser" list — same source the Inquiry /
 * Shipment / MGT hubs use). Buttons toast for now and will hook into
 * the legacy `/Report/UserFootPrint` endpoint once confirmed.
 */
function UserFootPrintForm() {
  const { enqueueSnackbar } = useSnackbar();
  const pageTitle = 'User Foot Print Report';

  const [filters, setFilters] = useState({
    page: USER_FOOT_PRINT_PAGES[0],
    user: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [merchants, setMerchants] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  const getApiBase = useCallback(
    () => String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
    []
  );

  const formatApiDate = useCallback((value) => {
    if (!value) return '';
    const [year, month, day] = String(value).split('-');
    if (!year || !month || !day) return String(value);
    return `${Number(year)}-${Number(month)}-${Number(day)}`;
  }, []);

  const normalizeFootPrintRows = useCallback((data) => {
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return rows.map((row, index) => ({
      FootPrintAllID: row?.FootPrintAllID ?? row?.footPrintAllID ?? row?.footprintAllID ?? index + 1,
      CreationDate: row?.CreationDate ?? row?.creationDate ?? '',
      UserID: row?.UserID ?? row?.userID ?? row?.userId ?? '',
      PageName: row?.PageName ?? row?.pageName ?? '',
      PONO: row?.PONO ?? row?.pono ?? '',
      ButtonType: row?.ButtonType ?? row?.buttonType ?? '',
      ProcessType: row?.ProcessType ?? row?.processType ?? '',
      Remarks: row?.Remarks ?? row?.remarks ?? '',
      UserName: row?.UserName ?? row?.userName ?? '',
    }));
  }, []);

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

  /** Convert <input type="date"> value (YYYY-MM-DD) to "Mon DD, YYYY" for the PDF. */
  const toPdfDate = useCallback((isoLike) => {
    if (!isoLike) return '';
    const [y, m, d] = isoLike.split('-').map((p) => Number(p));
    if (!y || !m || !d) return isoLike;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }, []);

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /**
   * Build the User Foot Print PDF (demo data for now) and either preview or
   * download it. Filter values flow into the PDF header so the date range
   * matches what the user picked.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const base = getApiBase();
      if (!base) {
        enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'error' });
        return;
      }
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const params = new URLSearchParams();
        params.set('fromDate', formatApiDate(filters.fromDate));
        params.set('toDate', formatApiDate(filters.toDate));
        params.set('pageName', filters.page);

        setLoadingReport(true);
        const res = await fetch(`${base}/api/Report/FootPrintReport?${params.toString()}`, {
          headers: otherAuthHeaders(),
        });
        if (!res.ok) {
          throw new Error(`FootPrintReport ${res.status}`);
        }
        const data = await res.json();
        const items = normalizeFootPrintRows(data);
        const blob = await buildUserFootPrintPdfBlob({
          fromDate: toPdfDate(filters.fromDate),
          toDate: toPdfDate(filters.toDate),
          items,
        });
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openUserFootPrintPdf(mode, blob);
      } catch (err) {
        console.error('[UserFootPrint] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar(
          err?.message || err?.response?.data?.message || 'Could not build User Foot Print PDF',
          { variant: 'error' }
        );
      } finally {
        setLoadingReport(false);
        setGeneratingPdf(false);
      }
    },
    [
      filters.fromDate,
      filters.toDate,
      filters.page,
      formatApiDate,
      getApiBase,
      generatingPdf,
      normalizeFootPrintRows,
      toPdfDate,
      enqueueSnackbar,
    ]
  );

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for User Foot Print filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(otherAuthHeaders());
        if (cancelled) return;
        setMerchants(res.merchants);
        if (res.rejected.merchants) {
          enqueueSnackbar('Could not load users', { variant: 'error' });
        }
      } catch (err) {
        console.error('[UserFootPrint] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset the User selection if it disappears from the latest API list. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.user === ALL) return prev;
      const stillThere = merchants.some((r) => milestoneMerchantKey(r) === prev.user);
      return stillThere ? prev : { ...prev, user: ALL };
    });
  }, [merchants]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        {pageTitle}
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Pages :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.page} onChange={handleSelect('page')} sx={selectSx}>
              {USER_FOOT_PRINT_PAGES.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            User :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.user}
              onChange={handleSelect('user')}
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
              disabled={generatingPdf}
              onClick={() => runPdfExport('view')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              View Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf}
              onClick={() => runPdfExport('pdf')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download PDF
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
// User Login Detail Report
// ----------------------------------------------------------------------

const USER_LOGIN_REPORT_TYPES = [
  { id: 'summarised', label: 'Summarised Version' },
  { id: 'expand', label: 'Expand Version' },
];

const USER_LOGIN_REPORT_TYPE_API_MAP = {
  summarised: 'Summarised Version',
  expand: 'Expand Version',
};

/**
 * "User Login Detail Report" form — second entry in the OTHER hub.
 *
 * Layout (per legacy print mock-up):
 *   - Row 1 : User dropdown (defaults to "All Merchandiser"),
 *             Report Type dropdown (defaults to "Summarised Version").
 *   - Row 2 : From + To date inputs.
 *   - Row 3 : View Report, Download PDF, Download Excel — centered.
 *
 * Users dropdown is populated from the shared Milestone Summary
 * dropdown API (the "Merchandiser" list — same source the Inquiry /
 * Shipment / MGT hubs use). Buttons toast for now and will hook into
 * the legacy `/Report/UserLoginDetail` endpoint once confirmed.
 */
function UserLoginDetailForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    user: ALL,
    reportType: 'summarised',
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [merchants, setMerchants] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const getApiBase = useCallback(
    () => String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
    []
  );

  const formatApiDate = useCallback((value) => {
    if (!value) return '';
    const [year, month, day] = String(value).split('-');
    if (!year || !month || !day) return String(value);
    return `${Number(year)}-${Number(month)}-${Number(day)}`;
  }, []);

  const normalizeSummaryRows = useCallback((data) => {
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return rows.map((row, index) => ({
      userName: row?.userName ?? row?.UserName ?? '',
      count:
        row?.numberOfTimesLogged ??
        row?.NumberOfTimesLogged ??
        row?.count ??
        row?.Count ??
        index + 1,
    }));
  }, []);

  const normalizeExpandGroups = useCallback((data) => {
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    const grouped = rows.reduce((acc, row) => {
      const userName = row?.userName ?? row?.UserName ?? '';
      const key = userName || `row-${acc.length}`;
      const group = acc.find((entry) => entry.user === key);
      const item = {
        userName,
        loginDate: row?.loginDate ?? row?.LoginDate ?? '',
        loginTime: row?.loginTime ?? row?.LoginTime ?? '',
        logoutDate: row?.logoutDate ?? row?.LogoutDate ?? '',
        logoutTime: row?.logoutTime ?? row?.LogoutTime ?? '',
        timeDif: row?.timeDif ?? row?.TimeDif ?? row?.timeDiff ?? row?.TimeDiff ?? '',
      };

      if (group) {
        group.items.push(item);
      } else {
        acc.push({ user: key, items: [item] });
      }
      return acc;
    }, []);

    return grouped;
  }, []);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  /** Convert ISO yyyy-mm-dd to the legacy "Mon DD, YYYY" display format. */
  const toPdfDate = useCallback((iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }, []);

  const runPdfExport = useCallback(
    async (mode) => {
      const base = getApiBase();
      if (!base) {
        enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'error' });
        return;
      }

      try {
        setLoadingReport(true);
        setGeneratingPdf(true);
        const params = new URLSearchParams();
        params.set('fromDate', formatApiDate(filters.fromDate));
        params.set('toDate', formatApiDate(filters.toDate));
        const reportTypeApiValue = USER_LOGIN_REPORT_TYPE_API_MAP[filters.reportType] || 'Summarised Version';
        params.set('reportType', reportTypeApiValue);

        const res = await fetch(`${base}/api/Report/UserLoginDetailReport?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('accessToken')
              ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
              : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`UserLoginDetailReport ${res.status}`);
        }

        const data = await res.json();
        const meta = {
          fromDate: toPdfDate(filters.fromDate),
          toDate: toPdfDate(filters.toDate),
        };
        if (filters.reportType === 'expand') {
          const groups = normalizeExpandGroups(data);
          const blob = await buildUserLoginDetailPdfBlob({
            ...meta,
            groups,
          });
          openUserLoginDetailPdf(mode === 'pdf' ? 'pdf' : 'view', blob, 'User-Login-Detail-Expand.pdf');
        } else {
          const items = normalizeSummaryRows(data);
          const blob = await buildUserLoginDetailSummaryPdfBlob({
            ...meta,
            items,
          });
          openUserLoginDetailPdf(mode === 'pdf' ? 'pdf' : 'view', blob, 'User-Login-Detail-Summarised.pdf');
        }
      } catch (err) {
        console.error('[UserLoginDetail] pdf', err);
        enqueueSnackbar(
          err?.message || err?.response?.data?.message || 'Could not generate User Login Detail PDF',
          { variant: 'error' }
        );
      } finally {
        setLoadingReport(false);
        setGeneratingPdf(false);
      }
    },
    [
      enqueueSnackbar,
      formatApiDate,
      getApiBase,
      normalizeExpandGroups,
      normalizeSummaryRows,
      filters.fromDate,
      filters.toDate,
      filters.reportType,
      toPdfDate,
    ]
  );

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for User Login Detail filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(otherAuthHeaders());
        if (cancelled) return;
        setMerchants(res.merchants);
        if (res.rejected.merchants) {
          enqueueSnackbar('Could not load users', { variant: 'error' });
        }
      } catch (err) {
        console.error('[UserLoginDetail] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset the User selection if it disappears from the latest API list. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.user === ALL) return prev;
      const stillThere = merchants.some((r) => milestoneMerchantKey(r) === prev.user);
      return stillThere ? prev : { ...prev, user: ALL };
    });
  }, [merchants]);

  useEffect(() => {
    const nextTitle = 'User Login Detail Report';
    const raf = window.requestAnimationFrame(() => {
      document.title = nextTitle;
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        User Login Detail Report
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            User :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.user}
              onChange={handleSelect('user')}
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

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Report Type :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.reportType} onChange={handleSelect('reportType')} sx={selectSx}>
              {USER_LOGIN_REPORT_TYPES.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
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
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf || loadingReport}
              onClick={() => runPdfExport('view')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf || loadingReport ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf || loadingReport}
              onClick={() => runPdfExport('pdf')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf || loadingReport ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() =>
                enqueueSnackbar(
                  'Download Excel: connect API when backend is ready.',
                  { variant: 'info' }
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

// ----------------------------------------------------------------------
// Quick Orders Overview Report
// ----------------------------------------------------------------------

/**
 * "Quick Orders Overview Report" — third entry in the OTHER hub.
 *
 * Layout (per legacy print mock-up):
 *   - Row 1 : Supplier (default "All Supplier"),
 *             Merchandiser (default "All Merchandiser"),
 *             Customer (default "All Customer").
 *   - Row 2 : PO # (default "All"), From + To date inputs.
 *   - Row 3 : View Report, Download PDF, Download Excel — centered
 *             beneath the date inputs.
 *
 * All three identity dropdowns are populated from the shared Milestone
 * Summary dropdown API (same source the Inquiry / Shipment / MGT hubs
 * use). The PO# list is fetched from the shared PO# endpoint and is
 * scoped to the currently-selected Customer / Supplier so the operator
 * sees only matching POs.
 *
 * Buttons toast for now and will hook into the legacy
 * `/Report/QuickOrdersOverview` endpoint once confirmed.
 */
function QuickOrdersOverviewForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    supplier: ALL,
    merchandiser: ALL,
    customer: ALL,
    poNo: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [merchants, setMerchants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [poList, setPoList] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loadingPoList, setLoadingPoList] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const getApiBase = useCallback(
    () => String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
    []
  );

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  /** Convert ISO yyyy-mm-dd to the legacy "Mon DD, YYYY" display format. */
  const toPdfDate = useCallback((iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }, []);

  const formatApiDate = useCallback((value) => {
    if (!value) return '';
    const [year, month, day] = String(value).split('-');
    if (!year || !month || !day) return String(value);
    return `${Number(year)}-${Number(month)}-${Number(day)}`;
  }, []);

  const normalizeQuickOrdersRows = useCallback((data) => {
    const rows = Array.isArray(data) ? data : data ? [data] : [];

    return rows.map((row) => ({
      CustomerID: row?.CustomerID ?? row?.customerId ?? row?.customerID ?? '',
      CustomerName: row?.CustomerName ?? row?.customerName ?? '',
      PrincipalName: row?.PrincipalName ?? row?.principalName ?? '',
      VenderLibraryID: row?.VenderLibraryID ?? row?.venderLibraryID ?? row?.vendorLibraryID ?? '',
      VenderName: row?.VenderName ?? row?.venderName ?? row?.vendorName ?? '',
      PONO: row?.PONO ?? row?.poNo ?? '',
      ItemDescriptionShippingInvoice:
        row?.ItemDescriptionShippingInvoice ?? row?.itemDescriptionShippingInvoice ?? '',
      ShipmentDate: row?.ShipmentDate ?? row?.shipmentDate ?? '',
      ShipMode: row?.ShipMode ?? row?.shipMode ?? '',
      OrderQtyUnits: row?.OrderQtyUnits ?? row?.orderQtyUnits ?? '',
      Style: row?.Style ?? row?.style ?? '',
      FitSample: row?.FitSample ?? row?.fitSample ?? '',
      PPSample: row?.PPSample ?? row?.ppSample ?? '',
      Cutting: row?.Cutting ?? row?.cutting ?? '',
      Stitching: row?.Stitching ?? row?.stitching ?? '',
      Packing: row?.Packing ?? row?.packing ?? '',
      Remarks: row?.Remarks ?? row?.remarks ?? '',
      ShippedQty: row?.ShippedQty ?? row?.shippedQty ?? '',
    }));
  }, []);

  const buildGroupedQuickOrdersData = useCallback(
    (rows) => {
      const customerMap = new Map();

      rows.forEach((row) => {
        const customerName = row.CustomerName || 'Unknown Customer';
        const vendorName = row.VenderName || 'Unknown Supplier';
        const customerKey = `${row.CustomerID ?? customerName}`;
        const supplierKey = `${row.VenderLibraryID ?? vendorName}`;

        if (!customerMap.has(customerKey)) {
          customerMap.set(customerKey, {
            name: customerName,
            totalQty: 0,
            suppliers: [],
          });
        }

        const customer = customerMap.get(customerKey);
        customer.totalQty += Number(row.OrderQtyUnits || 0);

        let supplier = customer.suppliers.find((item) => item.key === supplierKey);
        if (!supplier) {
          supplier = { key: supplierKey, name: vendorName, totalQty: 0, items: [] };
          customer.suppliers.push(supplier);
        }

        supplier.totalQty += Number(row.OrderQtyUnits || 0);
        const orderQty = row.OrderQtyUnits ?? '';
        const shippedQty = row.ShippedQty ?? '';
        const balanceQty =
          orderQty === '' && shippedQty === ''
            ? ''
            : Number(orderQty || 0) - Number(shippedQty || 0);
        const sampleApproval = [row.FitSample, row.PPSample].filter((value) => value !== '' && value != null).join('\n');
        supplier.items.push({
          poNo: row.PONO,
          styNo: row.Style,
          itemDesc: row.ItemDescriptionShippingInvoice,
          shipmentDate: row.ShipmentDate ? toPdfDate(row.ShipmentDate) : '',
          shipDate: row.ShipmentDate ? toPdfDate(row.ShipmentDate) : '',
          shipMode: row.ShipMode,
          orderQty,
          sampleApproval,
          cutting: row.Cutting,
          stitching: row.Stitching,
          packing: row.Packing,
          shippedQty,
          orderQtyTotal: orderQty,
          balanceQty,
          remarks: row.Remarks,
        });
      });

      return Array.from(customerMap.values()).map((customer) => ({
        ...customer,
        suppliers: customer.suppliers.map(({ key, ...supplier }) => supplier),
      }));
    },
    [toPdfDate]
  );

  const runPdfExport = useCallback(
    async (mode) => {
      const base = getApiBase();
      if (!base) {
        enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'error' });
        return;
      }

      try {
        setGeneratingPdf(true);
        const params = new URLSearchParams();
        params.set('fromDate', formatApiDate(filters.fromDate));
        params.set('toDate', formatApiDate(filters.toDate));

        const res = await fetch(`${base}/api/Report/AMSQuickOrdersOverview?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('accessToken')
              ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
              : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`AMSQuickOrdersOverview ${res.status}`);
        }

        const data = await res.json();
        const rows = normalizeQuickOrdersRows(data);
        const blob = await buildQuickOrdersOverviewPdfBlob({
          fromDate: toPdfDate(filters.fromDate),
          toDate: toPdfDate(filters.toDate),
          customers: buildGroupedQuickOrdersData(rows),
        });
        openQuickOrdersOverviewPdf(mode === 'pdf' ? 'pdf' : 'view', blob);
      } catch (err) {
        console.error('[QuickOrdersOverview] pdf', err);
        enqueueSnackbar(err?.message || 'Could not generate Quick Orders Overview PDF', {
          variant: 'error',
        });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [
      buildGroupedQuickOrdersData,
      enqueueSnackbar,
      filters.fromDate,
      filters.toDate,
      formatApiDate,
      getApiBase,
      normalizeQuickOrdersRows,
      toPdfDate,
    ]
  );

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Quick Orders Overview filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(otherAuthHeaders());
        if (cancelled) return;
        setMerchants(res.merchants);
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
      } catch (err) {
        console.error('[QuickOrdersOverview] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Fetch the PO# list scoped to the active Customer / Supplier. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) return undefined;

    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      setLoadingPoList(true);
      try {
        const list = await fetchPoNumbers(
          {
            customerId: filters.customer !== ALL ? filters.customer : undefined,
            supplierId: filters.supplier !== ALL ? filters.supplier : undefined,
            signal: controller.signal,
          },
          otherAuthHeaders()
        );
        if (cancelled) return;
        setPoList(list);
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        console.error('[QuickOrdersOverview] PO list', err);
        if (!cancelled) setPoList([]);
      } finally {
        if (!cancelled) setLoadingPoList(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters.customer, filters.supplier]);

  /** Auto-reset selections that no longer exist in the latest API lists. */
  useEffect(() => {
    setFilters((prev) => {
      let next = prev;
      if (prev.merchandiser !== ALL) {
        const still = merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser);
        if (!still) next = { ...next, merchandiser: ALL };
      }
      if (prev.customer !== ALL) {
        const still = customers.some((r) => milestoneCustomerKey(r) === prev.customer);
        if (!still) next = { ...next, customer: ALL };
      }
      if (prev.supplier !== ALL) {
        const still = suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier);
        if (!still) next = { ...next, supplier: ALL };
      }
      return next;
    });
  }, [merchants, customers, suppliers]);

  useEffect(() => {
    setFilters((prev) => {
      if (prev.poNo === ALL) return prev;
      return poList.includes(prev.poNo) ? prev : { ...prev, poNo: ALL };
    });
  }, [poList]);

  useEffect(() => {
    const nextTitle = 'Quick Orders Overview';
    const raf = window.requestAnimationFrame(() => {
      document.title = nextTitle;
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const dropdownDisabled = loadingDropdowns && merchants.length === 0;

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Quick Orders Overview
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={dropdownDisabled}
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
              disabled={dropdownDisabled}
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
              disabled={dropdownDisabled}
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
            PO # :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.poNo}
              onChange={handleSelect('poNo')}
              sx={selectSx}
              disabled={loadingPoList && poList.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {poList.map((po) => (
                <MenuItem key={po} value={po}>
                  {po}
                </MenuItem>
              ))}
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
              disabled={generatingPdf}
              onClick={() => runPdfExport('view')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              View Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf}
              onClick={() => runPdfExport('pdf')}
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
                  'Download Excel: connect API when backend is ready.',
                  { variant: 'info' }
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

// ----------------------------------------------------------------------
// DPG Report
// ----------------------------------------------------------------------

/**
 * "DPG REPORT" — filters match the legacy screen mock-up:
 *   Row 1 : Merchandiser (default All), Customer (default All).
 *   Row 2 : From / To dates.
 *   Row 3 : View Report, Download PDF, Download Excel (centered).
 *
 * Dropdowns load from the shared Milestone Summary API. View / Download PDF
 * generate the legacy-layout DPG PDF; Excel export will wire when the
 * backend contract is confirmed.
 */
function DpgReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    customer: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [merchants, setMerchants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const getApiBase = useCallback(
    () => String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
    []
  );

  const formatApiDate = useCallback((value) => {
    if (!value) return '';
    const [year, month, day] = String(value).split('-');
    if (!year || !month || !day) return String(value);
    return `${Number(year)}-${Number(month)}-${Number(day)}`;
  }, []);

  const normalizeDpgRows = useCallback((data) => {
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return rows.map((row) => ({
      factory: row?.CustomerName ?? '',
      poNo: row?.PONO ?? '',
      styling: row?.Currency ?? '',
      content: row?.Country ?? '',
      styNo: row?.POID ?? '',
      descGoods: row?.InvoiceNo ?? row?.BillNo ?? '',
      gsm: row?.VenderLibraryID ?? '',
      sizes: row?.Username ?? row?.userid ?? '',
      ordQty: row?.BookedQTY ?? row?.ReleaseQty ?? '',
      dlvr: row?.ShipmentDate ?? '',
      fobCost: row?.ShipValue ?? '',
      comPct: row?.Exchangerate ?? '',
      cPct: row?.ReleaseQty1 ?? '',
      frt: row?.InvoiceValue ?? '',
      duty: row?.InvoiceDate ?? '',
      dutyPct: row?.Tolerance ?? '',
      totalCost: row?.ReleaseQty ?? '',
      ldp: row?.Mode ?? '',
      tLdp: row?.CarrierName ?? '',
      gp: row?.VoyageFlight ?? '',
      tGp: row?.VenderName ?? '',
      gpPct: row?.VenderName ?? '',
    }));
  }, []);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toPdfDate = useCallback((iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }, []);

  const runPdfExport = useCallback(
    async (mode) => {
      const base = getApiBase();
      if (!base) {
        enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'error' });
        return;
      }

      try {
        setGeneratingPdf(true);
        const params = new URLSearchParams();
        params.set('fromDate', formatApiDate(filters.fromDate));
        params.set('toDate', formatApiDate(filters.toDate));

        const res = await fetch(`${base}/api/Report/CostingReport?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('accessToken')
              ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
              : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`CostingReport ${res.status}`);
        }

        const data = await res.json();
        const rows = normalizeDpgRows(data);
        const blob = await buildDpgReportPdfBlob({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          rows,
        });
        openDpgReportPdf(mode === 'pdf' ? 'pdf' : 'view', blob);
      } catch (err) {
        console.error('[DpgReport] pdf', err);
        enqueueSnackbar('Could not generate DPG Report PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [enqueueSnackbar, filters.fromDate, filters.toDate, formatApiDate, getApiBase, normalizeDpgRows, toPdfDate]
  );

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for DPG Report filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(otherAuthHeaders());
        if (cancelled) return;
        setMerchants(res.merchants);
        setCustomers(res.customers);
      } catch (err) {
        console.error('[DpgReport] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  useEffect(() => {
    setFilters((prev) => {
      let next = prev;
      if (prev.merchandiser !== ALL) {
        const ok = merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser);
        if (!ok) next = { ...next, merchandiser: ALL };
      }
      if (prev.customer !== ALL) {
        const ok = customers.some((r) => milestoneCustomerKey(r) === prev.customer);
        if (!ok) next = { ...next, customer: ALL };
      }
      return next;
    });
  }, [merchants, customers]);

  const dropdownDisabled = loadingDropdowns && merchants.length === 0 && customers.length === 0;

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 2,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        DPG REPORT
      </Typography>
      <Box
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          mb: 3,
        }}
      />

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Merchandiser :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.merchandiser}
              onChange={handleSelect('merchandiser')}
              sx={selectSx}
              disabled={dropdownDisabled}
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

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Customer :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.customer}
              onChange={handleSelect('customer')}
              sx={selectSx}
              disabled={dropdownDisabled}
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
              disabled={generatingPdf}
              onClick={() => runPdfExport('view')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              View Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf}
              onClick={() => runPdfExport('pdf')}
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
                  'Download Excel: connect API when backend is ready.',
                  { variant: 'info' }
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

// ----------------------------------------------------------------------
// Production History Report
// ----------------------------------------------------------------------

/**
 * Legacy "Production History Report" screen — PO text field, then
 * View / PDF / Excel. View & Download PDF open the print mock-up PDF; Excel
 * wires when the backend is ready.
 */
function ProductionHistoryReportForm() {
  const { enqueueSnackbar } = useSnackbar();
  const [poNo, setPoNo] = useState('');
  const [poOptions, setPoOptions] = useState([]);
  const [loadingPoOptions, setLoadingPoOptions] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const getApiBase = useCallback(
    () => String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
    []
  );

  const formatApiDate = useCallback((value) => {
    if (!value) return '';
    const [year, month, day] = String(value).split('-');
    if (!year || !month || !day) return String(value);
    return `${Number(year)}-${Number(month)}-${Number(day)}`;
  }, []);

  const toPdfDate = useCallback((isoLike) => {
    if (!isoLike) return '';
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return isoLike;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }, []);

  const normalizeProductionHistoryRows = useCallback(
    (data) => {
      const rows = Array.isArray(data) ? data : data ? [data] : [];
      return rows.map((row) => ({
        activityDate: row?.CreationDate ? toPdfDate(row.CreationDate) : '',
        process: row?.Process ?? '',
        remarks: row?.Remarks ?? '',
      }));
    },
    [toPdfDate]
  );

  const runPdfExport = useCallback(
    async (mode) => {
      const base = getApiBase();
      if (!base) {
        enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'error' });
        return;
      }

      try {
        setGeneratingPdf(true);
        const selectedPono = poNo.trim();
        const params = new URLSearchParams();
        if (selectedPono) {
          params.set('Pono', selectedPono);
        }

        const res = await fetch(`${base}/api/Report/ProductionHistoryReport?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('accessToken')
              ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
              : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`ProductionHistoryReport ${res.status}`);
        }

        const data = await res.json();
        const apiRows = Array.isArray(data) ? data : data ? [data] : [];
        const rows = normalizeProductionHistoryRows(apiRows);

        const first = apiRows[0] || {};
        const blob = await buildProductionHistoryPdfBlob({
          poNo: selectedPono,
          customer: first?.CustomerName ?? '',
          supplier: first?.VenderName ?? '',
          styleNo: first?.StyleNO ?? first?.Style ?? '',
          poQty: first?.POQty ?? first?.OrderQtyUnits ?? '',
          shipmentDate: first?.ShipDateBuyer ? toPdfDate(first.ShipDateBuyer) : '',
          lastUpdateText: first?.Remarks ? `Last Update of Production : ${first.Remarks}` : undefined,
          rows,
        });
        openProductionHistoryPdf(mode === 'pdf' ? 'pdf' : 'view', blob);
      } catch (err) {
        console.error('[ProductionHistory] pdf', err);
        enqueueSnackbar('Could not generate Production History PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [enqueueSnackbar, getApiBase, normalizeProductionHistoryRows, poNo, toPdfDate]
  );

  useEffect(() => {
    const base = getApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'warning' });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingPoOptions(true);
      try {
        const res = await fetch(`${base}/api/MyOrders/Getpono`, {
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('accessToken')
              ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
              : {}),
          },
        });
        if (!res.ok) throw new Error(`Getpono ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data ? [data] : [];
        setPoOptions(
          list
            .map((row) => String(row?.pono ?? row?.PONO ?? '').trim())
            .filter(Boolean)
        );
      } catch (err) {
        console.error('[ProductionHistory] PO list', err);
        if (!cancelled) enqueueSnackbar('Could not load PO numbers', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingPoOptions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar, getApiBase]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: 'text.secondary',
          mb: 2,
        }}
      >
        Production History Report
      </Typography>
      <Box
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          mb: 3,
        }}
      />

      <Box sx={{ maxWidth: 480 }}>
        <Typography variant="subtitle2" sx={sectionLabelSx}>
          PO No :
        </Typography>
        <Autocomplete
          freeSolo
          options={poOptions}
          inputValue={poNo}
          onInputChange={(_, value) => setPoNo(value)}
          onChange={(_, value) => setPoNo(String(value ?? ''))}
          loading={loadingPoOptions}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              size="small"
              placeholder=""
              sx={selectSx}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingPoOptions ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mt: 2.5,
            justifyContent: { xs: 'center', sm: 'flex-start' },
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="medium"
            disabled={generatingPdf}
            onClick={() => runPdfExport('view')}
            sx={{
              minWidth: 140,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: (theme) =>
                `0 0 0 2px ${theme.palette.mode === 'light' ? '#d1c4e9' : '#7e57c2'}`,
            }}
          >
            View Report
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="medium"
            disabled={generatingPdf}
            onClick={() => runPdfExport('pdf')}
            sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="medium"
            onClick={() =>
              enqueueSnackbar('Download Excel: connect API when backend is ready.', {
                variant: 'info',
              })
            }
            sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
          >
            Download Excel
          </Button>
        </Box>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Supplier – Merchandiser Report (sidebar: "Supplier Marchand Report")
// ----------------------------------------------------------------------

/**
 * Legacy screen layout:
 *   Row 1 : Merchandiser | Supplier
 *   Row 2 : From | To
 *   Row 3 : View / PDF / Excel — on md+ aligned under the right (To) column;
 *           on xs, buttons full width centred. View & Download PDF open the
 *           legacy SUPPLIER MERCHAND REPORT PDF.
 */
function SupplierMarchandReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    supplier: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [merchants, setMerchants] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const getApiBase = useCallback(
    () => String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
    []
  );

  const formatApiDate = useCallback((value) => {
    if (!value) return '';
    const [year, month, day] = String(value).split('-');
    if (!year || !month || !day) return String(value);
    return `${Number(year)}-${Number(month)}-${Number(day)}`;
  }, []);

  const normalizeSupplierMarchandRows = useCallback((data) => {
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return rows.map((row) => ({
      supplier: row?.VenderName ?? row?.venderName ?? '',
      merchand: row?.Marchand ?? row?.marchand ?? '',
      orders: row?.PONO ?? row?.pono ?? '',
    }));
  }, []);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const runPdfExport = useCallback(
    async (mode) => {
      const base = getApiBase();
      if (!base) {
        enqueueSnackbar('API URL missing: set VITE_API_BASE_URL', { variant: 'error' });
        return;
      }

      try {
        setGeneratingPdf(true);
        const params = new URLSearchParams();
        params.set('fromDate', formatApiDate(filters.fromDate));
        params.set('toDate', formatApiDate(filters.toDate));

        const res = await fetch(`${base}/api/Report/SupplierMarchandReport?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('accessToken')
              ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
              : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`SupplierMarchandReport ${res.status}`);
        }

        const data = await res.json();
        const rows = normalizeSupplierMarchandRows(data);
        const blob = await buildSupplierMarchandReportPdfBlob({
          rows,
          printedOn: undefined,
        });
        openSupplierMarchandReportPdf(mode === 'pdf' ? 'pdf' : 'view', blob);
      } catch (err) {
        console.error('[SupplierMarchand] pdf', err);
        enqueueSnackbar('Could not generate Supplier Merchand report PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [enqueueSnackbar, filters.fromDate, filters.toDate, formatApiDate, getApiBase, normalizeSupplierMarchandRows]
  );

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Supplier – Merchandiser filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(otherAuthHeaders());
        if (cancelled) return;
        setMerchants(res.merchants);
        setSuppliers(res.suppliers);
      } catch (err) {
        console.error('[SupplierMarchand] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  useEffect(() => {
    setFilters((prev) => {
      let next = prev;
      if (prev.merchandiser !== ALL) {
        const ok = merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser);
        if (!ok) next = { ...next, merchandiser: ALL };
      }
      if (prev.supplier !== ALL) {
        const ok = suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier);
        if (!ok) next = { ...next, supplier: ALL };
      }
      return next;
    });
  }, [merchants, suppliers]);

  const dropdownDisabled = loadingDropdowns && merchants.length === 0 && suppliers.length === 0;

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        Supplier - Merchandiser Report
      </Typography>
      <Box
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          mb: 3,
        }}
      />

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Merchandiser :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.merchandiser}
              onChange={handleSelect('merchandiser')}
              sx={selectSx}
              disabled={dropdownDisabled}
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

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={dropdownDisabled}
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

        <Grid item md={6} sx={{ display: { xs: 'none', md: 'block' } }} />
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf}
              onClick={() => runPdfExport('view')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              View Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf}
              onClick={() => runPdfExport('pdf')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() =>
                enqueueSnackbar('Download Excel: connect API when backend is ready.', {
                  variant: 'info',
                })
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

// ----------------------------------------------------------------------
// Order Detail Report (layout matches legacy PO Color Wise Report screen)
// ----------------------------------------------------------------------

/**
 * Legacy-style filter strip: title top-left, Style + From/To on one row,
 * action row aligned under the date fields on md+ (buttons use theme primary).
 */
function OrderDetailReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    style: '',
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [portfolios, setPortfolios] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const runPdfExport = useCallback(
    async (mode) => {
      try {
        setGeneratingPdf(true);
        const blob = await buildOrderDetailReportPdfBlob({});
        openOrderDetailReportPdf(mode === 'pdf' ? 'pdf' : 'view', blob);
      } catch (err) {
        console.error('[OrderDetailReport] pdf', err);
        enqueueSnackbar('Could not generate Order Detail Report PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [enqueueSnackbar]
  );

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Style list', { variant: 'warning' });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(otherAuthHeaders());
        if (cancelled) return;
        setPortfolios(res.portfolios);
      } catch (err) {
        console.error('[OrderDetailReport] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load style list', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (filters.style === '' || filters.style === ALL) return;
    const ok = portfolios.some((row) => milestonePortfolioKey(row) === filters.style);
    if (!ok) setFilters((prev) => ({ ...prev, style: '' }));
  }, [portfolios, filters.style]);

  const dropdownDisabled = loadingDropdowns && portfolios.length === 0;

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'grey.800', mb: 3 }}>
        Order Detail Report
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 2.5 }} columnSpacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Style :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              displayEmpty
              value={filters.style}
              onChange={handleSelect('style')}
              sx={selectSx}
              disabled={dropdownDisabled}
              renderValue={(selected) => {
                if (selected === '' || selected == null) {
                  return (
                    <Typography variant="body2" color="text.secondary">
                      Select Style
                    </Typography>
                  );
                }
                if (selected === ALL) {
                  return 'All styles';
                }
                const row = portfolios.find((p) => milestonePortfolioKey(p) === selected);
                return row ? milestonePortfolioLabel(row) : String(selected);
              }}
            >
              <MenuItem value="" disabled>
                <em>Select Style</em>
              </MenuItem>
              <MenuItem value={ALL}>All styles</MenuItem>
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

        <Grid item xs={6} md={4}>
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

        <Grid item xs={6} md={4}>
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

        <Grid item md={4} sx={{ display: { xs: 'none', md: 'block' } }} />
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf || loadingReport}
              onClick={() => runPdfExport('view')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf || loadingReport ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf || loadingReport}
              onClick={() => runPdfExport('pdf')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf || loadingReport ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() =>
                enqueueSnackbar('Download Excel: connect API when backend is ready.', {
                  variant: 'info',
                })
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

// ----------------------------------------------------------------------
// Merchandiser Progress Report
// ----------------------------------------------------------------------

const MERCH_PROGRESS_TYPE_CUSTOMER = 'customer-wise';
const MERCH_PROGRESS_TYPE_SUPPLIER = 'supplier-wise';
const MERCH_PROGRESS_TYPE_OPTIONS = [
  { value: MERCH_PROGRESS_TYPE_CUSTOMER, label: 'Customer Wise' },
  { value: MERCH_PROGRESS_TYPE_SUPPLIER, label: 'Supplier Wise' },
];

function MerchandiserProgressReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    reportType: MERCH_PROGRESS_TYPE_CUSTOMER,
    customer: ALL,
    supplier: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [merchants, setMerchants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleSelect = (name) => (e) => {
    const v = e.target.value;
    if (name === 'reportType') {
      setFilters((prev) => ({
        ...prev,
        reportType: v,
        customer: ALL,
        supplier: ALL,
      }));
      return;
    }
    setFilters((prev) => ({ ...prev, [name]: v }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Merchandiser Progress filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(otherAuthHeaders());
        if (cancelled) return;
        setMerchants(res.merchants);
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
      } catch (err) {
        console.error('[MerchandiserProgress] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  useEffect(() => {
    setFilters((prev) => {
      let next = prev;
      if (prev.merchandiser !== ALL) {
        const ok = merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser);
        if (!ok) next = { ...next, merchandiser: ALL };
      }
      if (prev.customer !== ALL) {
        const ok = customers.some((r) => milestoneCustomerKey(r) === prev.customer);
        if (!ok) next = { ...next, customer: ALL };
      }
      if (prev.supplier !== ALL) {
        const ok = suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier);
        if (!ok) next = { ...next, supplier: ALL };
      }
      return next;
    });
  }, [merchants, customers, suppliers]);

  const mercSelectDisabled = loadingDropdowns && merchants.length === 0;
  const thirdSelectDisabled =
    loadingDropdowns &&
    (filters.reportType === MERCH_PROGRESS_TYPE_CUSTOMER
      ? customers.length === 0
      : suppliers.length === 0);

  const runPdfExport = useCallback(
    async (mode) => {
      try {
        setGeneratingPdf(true);
        const blob = await buildMerchandiserProgressReportPdfBlob({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          reportType: filters.reportType,
        });
        openMerchandiserProgressReportPdf(mode === 'pdf' ? 'pdf' : 'view', blob);
      } catch (err) {
        console.error('[MerchandiserProgress] pdf', err);
        enqueueSnackbar('Could not generate Merchandiser Progress Report PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [enqueueSnackbar, filters.fromDate, filters.toDate, filters.reportType]
  );

  const toastSoon = (label) =>
    enqueueSnackbar(`${label}: connect API when backend is ready.`, { variant: 'info' });

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'grey.800', mb: 2 }}>
        Merchandiser Progress Report
      </Typography>
      <Box
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          mb: 3,
        }}
      />

      <Grid container spacing={{ xs: 2, sm: 2.5 }} columnSpacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Merchandiser :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.merchandiser}
              onChange={handleSelect('merchandiser')}
              sx={selectSx}
              disabled={mercSelectDisabled}
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
            Type :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.reportType} onChange={handleSelect('reportType')} sx={selectSx}>
              {MERCH_PROGRESS_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          {filters.reportType === MERCH_PROGRESS_TYPE_SUPPLIER ? (
            <>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                Supplier :
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.supplier}
                  onChange={handleSelect('supplier')}
                  sx={selectSx}
                  disabled={thirdSelectDisabled}
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
            </>
          ) : (
            <>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                Customer :
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.customer}
                  onChange={handleSelect('customer')}
                  sx={selectSx}
                  disabled={thirdSelectDisabled}
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
            </>
          )}
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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

        <Grid item xs={12} sm={6} md={4}>
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
              mt: { xs: 0.5, sm: 1 },
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf}
              onClick={() => runPdfExport('view')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={generatingPdf}
              onClick={() => runPdfExport('pdf')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Building…' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toastSoon('Download Excel')}
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
// Placeholder forms for the remaining "Other" hub menu entries
// ----------------------------------------------------------------------

/** Stub form used for the remaining "coming soon" Other reports. */
function PlaceholderOtherReportForm({ pageTitle }) {
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

PlaceholderOtherReportForm.propTypes = {
  pageTitle: PropTypes.string.isRequired,
};

function renderOtherReportPanel(activeReportId, pageTitle) {
  switch (activeReportId) {
    case 'user-foot-print':
      return <UserFootPrintForm key={activeReportId} />;
    case 'user-login-detail':
      return <UserLoginDetailForm key={activeReportId} />;
    case 'quick-orders-overview-report':
      return <QuickOrdersOverviewForm key={activeReportId} />;
    case 'dpg-report':
      return <DpgReportForm key={activeReportId} />;
    case 'production-history-report':
      return <ProductionHistoryReportForm key={activeReportId} />;
    case 'supplier-marchand-report':
      return <SupplierMarchandReportForm key={activeReportId} />;
    case 'order-detail-report':
      return <OrderDetailReportForm key={activeReportId} />;
    case 'merchandiser-progress-report':
      return <MerchandiserProgressReportForm key={activeReportId} />;
    default:
      return <PlaceholderOtherReportForm key={activeReportId} pageTitle={pageTitle} />;
  }
}

// ----------------------------------------------------------------------

export default function OtherHubView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const reportMenuOptions = useUserReportOptions('Other', OTHER_REPORT_OPTIONS);
  const menuDefaultReportId = reportMenuOptions[0]?.id ?? '';

  const reportFromUrl = searchParams.get(REPORT_QUERY_KEY);
  const activeReportId = useMemo(() => {
    const valid = reportMenuOptions.some((o) => o.id === reportFromUrl);
    return valid ? reportFromUrl : menuDefaultReportId;
  }, [reportFromUrl, reportMenuOptions, menuDefaultReportId]);

  useEffect(() => {
    if (!menuDefaultReportId) return;
    if (!reportFromUrl || !reportMenuOptions.some((o) => o.id === reportFromUrl)) {
      setSearchParams({ [REPORT_QUERY_KEY]: menuDefaultReportId }, { replace: true });
    }
  }, [reportFromUrl, setSearchParams, reportMenuOptions, menuDefaultReportId]);

  const selectedOption = useMemo(
    () => reportMenuOptions.find((o) => o.id === activeReportId) ?? reportMenuOptions[0],
    [activeReportId, reportMenuOptions]
  );

  const handleReportChange = (e) => {
    const next = e.target.value;
    setSearchParams({ [REPORT_QUERY_KEY]: next }, { replace: true });
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="Other"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Reports', href: paths.dashboard.reports.root },
          { name: 'Other' },
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
          <InputLabel id="other-switch-label" sx={{ fontSize: '0.8125rem' }}>
            Other report
          </InputLabel>
          <Select
            labelId="other-switch-label"
            label="Other report"
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
            {reportMenuOptions.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      {activeReportId ? renderOtherReportPanel(activeReportId, selectedOption?.label ?? '') : null}
    </Container>
  );
}
