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
  milestoneSupplierKey,
  milestoneSupplierLabel,
} from 'src/sections/reports/utils/milestone-summary-dropdown-api';
import { fetchPoNumbers } from 'src/sections/reports/utils/pono-dropdown-api';
import {
  buildInspectionDailyStatusReportPdfBlob,
  openInspectionDailyStatusReportPdf,
  inspectionDailyHeaderDate,
} from 'src/sections/reports/utils/inspection-daily-status-report-pdf-export';
import {
  buildDefectReportPdfBlob,
  openDefectReportPdf,
  defectReportHeaderDate,
} from 'src/sections/reports/utils/defect-report-pdf-export';

// ----------------------------------------------------------------------
// Shared inspection auth headers — mirrors the WIP / Shipment hubs.
// ----------------------------------------------------------------------

function inspectionAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ----------------------------------------------------------------------

/**
 * Sidebar dropdown entries for the Inspection hub. Labels mirror the legacy
 * report names exactly so URL slugs stay stable once backend wiring lands.
 *
 * The first option ("inspection-status-report") opens the form titled
 * "Inspection Daily Status Report" — that's the legacy default landing view.
 */
export const INSPECTION_REPORT_OPTIONS = [
  { id: 'inspection-status-report', label: 'Inspection Status Report' },
  { id: 'inspection-report', label: 'Inspection Report' },
  { id: 'sample-inspection-report', label: 'Sample Inspection Report' },
  { id: 'defect-report', label: 'Defect Report' },
  { id: 'defect-comparison-report', label: 'Defect Comparison Report' },
];

const DEFAULT_REPORT_ID = 'inspection-status-report';
const REPORT_QUERY_KEY = 'report';

const ALL = 'all';

// ----------------------------------------------------------------------
// Shared form styling (mirrors the Shipment / MGT hub look-and-feel).
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
// Inspection Daily Status Report (default landing form)
// ----------------------------------------------------------------------

/**
 * "Inspection Daily Status Report" form — the default landing view for the
 * Inspection hub.
 *
 * Layout (per legacy print):
 *   - Row 1 : QA dropdown, From date, To date.
 *   - Row 2 : View Report, Download PDF, Download Excel — buttons sit
 *             directly under the date inputs.
 *
 * QA list is a placeholder static select for now (just "All QA") until the
 * backend endpoint is confirmed. Buttons toast for now — they'll hook into
 * the real backend export endpoints once available, same pattern as the
 * other report hubs in the project.
 */
function InspectionDailyStatusReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    qa: ALL,
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
   * Build the Inspection Daily Status PDF (demo data for now) and either
   * preview-tab it or trigger a direct file download. The selected From/To
   * dates feed into the "From : ... To : ..." subtitle.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildInspectionDailyStatusReportPdfBlob({
          fromLabel: inspectionDailyHeaderDate(filters.fromDate),
          toLabel: inspectionDailyHeaderDate(filters.toDate),
        });
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openInspectionDailyStatusReportPdf(mode, blob);
      } catch (err) {
        console.error('[InspectionDaily] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Inspection Daily Status PDF', { variant: 'error' });
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
        Inspection Daily Status Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            QA :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.qa}
              onChange={handleSelect('qa')}
              sx={selectSx}
            >
              <MenuItem value={ALL}>All QA</MenuItem>
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
// Defect Report
// ----------------------------------------------------------------------

/**
 * "Defect Report" form.
 *
 * Layout (per legacy print):
 *   - Row 1 : Supplier dropdown, From date, To date.
 *   - Row 2 : Order By dropdown (left).
 *   - Row 3 : View Report, Download PDF, Download Excel — right-aligned.
 *
 * Supplier comes from the shared Milestone Summary dropdown API. Order By is
 * a static select (DEFECT / SUPPLIER / DATE). Buttons toast for now — they'll
 * hook into the real backend endpoint once confirmed, same pattern as the
 * other inspection hub reports.
 */
function DefectReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    supplier: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
    orderBy: 'DEFECT',
  });

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

  /** Resolve the user-friendly label for the currently selected Supplier. */
  const resolveSupplierLabel = useCallback(() => {
    if (filters.supplier === ALL) return 'All Supplier';
    const hit = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
    return hit ? milestoneSupplierLabel(hit) : 'All Supplier';
  }, [filters.supplier, suppliers]);

  /**
   * Build the Defect PDF (demo data for now) and either preview-tab it or
   * trigger a direct file download. Selected Supplier / From / To values
   * drive the header strings.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const blob = await buildDefectReportPdfBlob({
          supplierLabel: resolveSupplierLabel(),
          fromLabel: defectReportHeaderDate(filters.fromDate),
          toLabel: defectReportHeaderDate(filters.toDate),
        });
        if (mode === 'view' && previewWindow) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openDefectReportPdf(mode, blob);
      } catch (err) {
        console.error('[DefectReport] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Defect Report PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [filters.fromDate, filters.toDate, resolveSupplierLabel, generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  /** Supplier list from the shared dropdown API. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Defect Report filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(inspectionAuthHeaders());
        if (cancelled) return;
        setSuppliers(res.suppliers);
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[DefectReport] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load supplier list', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset supplier if it disappears from the latest API list. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.supplier === ALL) return prev;
      if (suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) return prev;
      return { ...prev, supplier: ALL };
    });
  }, [suppliers]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Defect Report
      </Typography>

      <Grid container spacing={2.5}>
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

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Order By :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.orderBy}
              onChange={handleSelect('orderBy')}
              sx={selectSx}
            >
              <MenuItem value="DEFECT">DEFECT</MenuItem>
              <MenuItem value="CRITICAL">CRITICAL</MenuItem>
              <MenuItem value="MAJOR">MAJOR</MenuItem>
              <MenuItem value="MINOR">MINOR</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={8} />

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
// Defect Comparison Report
// ----------------------------------------------------------------------

/** Year list: current year ± 5 (newest first) — shared with the Comparison form. */
function buildYearOptions() {
  const now = new Date().getFullYear();
  const start = now - 5;
  const end = now + 5;
  const years = [];
  for (let y = end; y >= start; y -= 1) years.push(y);
  return years;
}

const YEAR_PLACEHOLDER = '__select__';
const STYLE_ALL = 'all';
const PO_ALL = 'all';

/**
 * "Comparison Defect Report" form.
 *
 * Side-by-side filter layout (per legacy print):
 *   - 5 rows × 2 columns of dropdowns. Each side holds an independent set of
 *     filters (Supplier, Year, Customer, Style, PO #) so the user can compare
 *     two scopes in a single export.
 *   - Bottom row : View Report, Download PDF, Download Excel — right-aligned.
 *
 * Supplier + Customer lists come from the shared Milestone Summary dropdown
 * API; PO # lists per side are fetched independently via `fetchPoNumbers`
 * scoped by that side's selected customer / supplier. Style is a static
 * "All Styles" placeholder until the backend list is confirmed.
 *
 * Buttons toast for now — they'll hook into the real backend endpoint once
 * confirmed, same pattern as the other Inspection hub reports.
 */
function DefectComparisonReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    // Left side ("A")
    supplierA: ALL,
    yearA: YEAR_PLACEHOLDER,
    customerA: ALL,
    styleA: STYLE_ALL,
    poA: PO_ALL,
    // Right side ("B")
    supplierB: ALL,
    yearB: YEAR_PLACEHOLDER,
    customerB: ALL,
    styleB: STYLE_ALL,
    poB: PO_ALL,
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const [poNumbersA, setPoNumbersA] = useState([]);
  const [loadingPoNumbersA, setLoadingPoNumbersA] = useState(false);
  const [poNumbersB, setPoNumbersB] = useState([]);
  const [loadingPoNumbersB, setLoadingPoNumbersB] = useState(false);

  const yearOptions = useMemo(buildYearOptions, []);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  /** Customer + Supplier lists — fetched once and shared by both sides. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Defect Comparison filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(inspectionAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[DefectComparison] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset stale selections when the source lists change. */
  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev };
      let changed = false;
      ['customerA', 'customerB'].forEach((k) => {
        if (prev[k] !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev[k])) {
          next[k] = ALL;
          changed = true;
        }
      });
      ['supplierA', 'supplierB'].forEach((k) => {
        if (prev[k] !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev[k])) {
          next[k] = ALL;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [customers, suppliers]);

  /**
   * Build the per-side PO# fetcher used by both effects below. Returns a
   * cleanup that aborts the in-flight request when the deps change.
   */
  const subscribePoFetch = useCallback(
    (customerVal, supplierVal, setNumbers, setLoading, sideLabel) => {
      const controller = new AbortController();
      (async () => {
        setLoading(true);
        try {
          const list = await fetchPoNumbers(
            {
              customerId: customerVal === ALL ? undefined : customerVal,
              supplierId: supplierVal === ALL ? undefined : supplierVal,
              signal: controller.signal,
            },
            inspectionAuthHeaders()
          );
          setNumbers(Array.isArray(list) ? list : []);
        } catch (err) {
          if (controller.signal.aborted) return;
          console.error(`[DefectComparison] PO numbers (${sideLabel})`, err);
          setNumbers([]);
          enqueueSnackbar(`Could not load PO numbers (${sideLabel})`, { variant: 'error' });
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
      return () => controller.abort();
    },
    [enqueueSnackbar]
  );

  useEffect(
    () =>
      subscribePoFetch(filters.customerA, filters.supplierA, setPoNumbersA, setLoadingPoNumbersA, 'A'),
    [filters.customerA, filters.supplierA, subscribePoFetch]
  );

  useEffect(
    () =>
      subscribePoFetch(filters.customerB, filters.supplierB, setPoNumbersB, setLoadingPoNumbersB, 'B'),
    [filters.customerB, filters.supplierB, subscribePoFetch]
  );

  /** Reset PO selection if it disappears from the latest list (per side). */
  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev };
      let changed = false;
      if (prev.poA !== PO_ALL && !poNumbersA.includes(prev.poA)) {
        next.poA = PO_ALL;
        changed = true;
      }
      if (prev.poB !== PO_ALL && !poNumbersB.includes(prev.poB)) {
        next.poB = PO_ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [poNumbersA, poNumbersB]);

  /**
   * Render a single side's stack of dropdowns. Pulling this into a sub-render
   * keeps the JSX symmetrical and prevents drift between the two columns.
   */
  const renderSide = (sideLabel) => {
    const isA = sideLabel === 'A';
    const supplierKey = isA ? 'supplierA' : 'supplierB';
    const yearKey = isA ? 'yearA' : 'yearB';
    const customerKey = isA ? 'customerA' : 'customerB';
    const styleKey = isA ? 'styleA' : 'styleB';
    const poKey = isA ? 'poA' : 'poB';
    const poNumbers = isA ? poNumbersA : poNumbersB;
    const loadingPo = isA ? loadingPoNumbersA : loadingPoNumbersB;

    return (
      <>
        <Typography variant="subtitle2" sx={sectionLabelSx}>
          Supplier :
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <Select
            value={filters[supplierKey]}
            onChange={handleSelect(supplierKey)}
            sx={selectSx}
            disabled={loadingDropdowns && suppliers.length === 0}
          >
            <MenuItem value={ALL}>All Supplier</MenuItem>
            {suppliers
              .filter((row) => milestoneSupplierKey(row))
              .map((row) => {
                const val = milestoneSupplierKey(row);
                return (
                  <MenuItem key={`${supplierKey}-${val}`} value={val}>
                    {milestoneSupplierLabel(row)}
                  </MenuItem>
                );
              })}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={sectionLabelSx}>
          Year :
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <Select
            value={filters[yearKey]}
            onChange={handleSelect(yearKey)}
            sx={selectSx}
            displayEmpty
          >
            <MenuItem value={YEAR_PLACEHOLDER}>Select</MenuItem>
            {yearOptions.map((y) => (
              <MenuItem key={`${yearKey}-${y}`} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={sectionLabelSx}>
          Customer :
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <Select
            value={filters[customerKey]}
            onChange={handleSelect(customerKey)}
            sx={selectSx}
            disabled={loadingDropdowns && customers.length === 0}
          >
            <MenuItem value={ALL}>All Customer</MenuItem>
            {customers
              .filter((row) => milestoneCustomerKey(row))
              .map((row) => {
                const val = milestoneCustomerKey(row);
                return (
                  <MenuItem key={`${customerKey}-${val}`} value={val}>
                    {milestoneCustomerLabel(row)}
                  </MenuItem>
                );
              })}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={sectionLabelSx}>
          Style :
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <Select value={filters[styleKey]} onChange={handleSelect(styleKey)} sx={selectSx}>
            <MenuItem value={STYLE_ALL}>All Styles</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={sectionLabelSx}>
          PO # :
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={filters[poKey]}
            onChange={handleSelect(poKey)}
            sx={selectSx}
            disabled={loadingPo && poNumbers.length === 0}
            renderValue={(val) => (val === PO_ALL ? 'All PO' : val)}
          >
            <MenuItem value={PO_ALL}>All PO</MenuItem>
            {poNumbers.length === 0 && !loadingPo && (
              <MenuItem disabled value="">
                <em>No PO Found</em>
              </MenuItem>
            )}
            {poNumbers.map((po) => (
              <MenuItem key={`${poKey}-${po}`} value={po}>
                {po}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </>
    );
  };

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Comparison Defect Report
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderSide('A')}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderSide('B')}
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
              onClick={() => toast('View Report: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              View Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download PDF: connect API when backend is ready.')}
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
// Placeholder forms for the rest of the Inspection hub menu
// ----------------------------------------------------------------------

/** Stub form used for the remaining "coming soon" Inspection reports. */
function PlaceholderInspectionReportForm({ pageTitle }) {
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

PlaceholderInspectionReportForm.propTypes = {
  pageTitle: PropTypes.string.isRequired,
};

function renderInspectionReportPanel(activeReportId, pageTitle) {
  switch (activeReportId) {
    case 'inspection-status-report':
      return <InspectionDailyStatusReportForm key={activeReportId} />;
    case 'defect-report':
      return <DefectReportForm key={activeReportId} />;
    case 'defect-comparison-report':
      return <DefectComparisonReportForm key={activeReportId} />;
    case 'inspection-report':
    case 'sample-inspection-report':
      return <PlaceholderInspectionReportForm key={activeReportId} pageTitle={pageTitle} />;
    default:
      return <InspectionDailyStatusReportForm key={activeReportId} />;
  }
}

// ----------------------------------------------------------------------

export default function InspectionHubView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const reportFromUrl = searchParams.get(REPORT_QUERY_KEY);
  const activeReportId = useMemo(() => {
    const valid = INSPECTION_REPORT_OPTIONS.some((o) => o.id === reportFromUrl);
    return valid ? reportFromUrl : DEFAULT_REPORT_ID;
  }, [reportFromUrl]);

  useEffect(() => {
    if (!reportFromUrl || !INSPECTION_REPORT_OPTIONS.some((o) => o.id === reportFromUrl)) {
      setSearchParams({ [REPORT_QUERY_KEY]: DEFAULT_REPORT_ID }, { replace: true });
    }
  }, [reportFromUrl, setSearchParams]);

  const selectedOption = useMemo(
    () =>
      INSPECTION_REPORT_OPTIONS.find((o) => o.id === activeReportId) ?? INSPECTION_REPORT_OPTIONS[0],
    [activeReportId]
  );

  const handleReportChange = (e) => {
    const next = e.target.value;
    setSearchParams({ [REPORT_QUERY_KEY]: next }, { replace: true });
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="Inspection"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Reports', href: paths.dashboard.reports.root },
          { name: 'Inspection' },
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
          <InputLabel id="inspection-switch-label" sx={{ fontSize: '0.8125rem' }}>
            Inspection report
          </InputLabel>
          <Select
            labelId="inspection-switch-label"
            label="Inspection report"
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
            {INSPECTION_REPORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      {renderInspectionReportPanel(activeReportId, selectedOption.label)}
    </Container>
  );
}
