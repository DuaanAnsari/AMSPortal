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
  milestoneMerchantKey,
  milestoneMerchantLabel,
} from 'src/sections/reports/utils/milestone-summary-dropdown-api';
import {
  buildUserFootPrintPdfBlob,
  openUserFootPrintPdf,
} from 'src/sections/reports/utils/user-foot-print-pdf-export';

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

const DEFAULT_REPORT_ID = 'user-foot-print';
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

const USER_FOOT_PRINT_PAGES = [
  'TNA Chart',
  'Inquiry Report',
  'Order Detail',
  'Sample Development Report',
  'Milestone',
  'Sampling Program',
  'Shipment Release',
  'Purchase Order',
  'Container Loading',
  'Quality Department Inspection',
];

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

  const [filters, setFilters] = useState({
    page: USER_FOOT_PRINT_PAGES[0],
    user: ALL,
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
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildUserFootPrintPdfBlob({
          fromDate: toPdfDate(filters.fromDate),
          toDate: toPdfDate(filters.toDate),
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
        enqueueSnackbar('Could not build User Foot Print PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [filters.fromDate, filters.toDate, generatingPdf, toPdfDate, enqueueSnackbar]
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
        User Foot Print Report
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
    default:
      return <PlaceholderOtherReportForm key={activeReportId} pageTitle={pageTitle} />;
  }
}

// ----------------------------------------------------------------------

export default function OtherHubView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const reportFromUrl = searchParams.get(REPORT_QUERY_KEY);
  const activeReportId = useMemo(() => {
    const valid = OTHER_REPORT_OPTIONS.some((o) => o.id === reportFromUrl);
    return valid ? reportFromUrl : DEFAULT_REPORT_ID;
  }, [reportFromUrl]);

  useEffect(() => {
    if (!reportFromUrl || !OTHER_REPORT_OPTIONS.some((o) => o.id === reportFromUrl)) {
      setSearchParams({ [REPORT_QUERY_KEY]: DEFAULT_REPORT_ID }, { replace: true });
    }
  }, [reportFromUrl, setSearchParams]);

  const selectedOption = useMemo(
    () =>
      OTHER_REPORT_OPTIONS.find((o) => o.id === activeReportId) ?? OTHER_REPORT_OPTIONS[0],
    [activeReportId]
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
            {OTHER_REPORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      {renderOtherReportPanel(activeReportId, selectedOption.label)}
    </Container>
  );
}
