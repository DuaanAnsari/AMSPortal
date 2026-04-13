import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

// ─── Constants ────────────────────────────────────────────────────────────────

const INSP_TYPE_LABELS = {
  'Proto Fit': 'Proto Fit',
  Dyelot: 'Dyelot',
  Strikeoff: 'Strikeoff',
  'PP Sample': 'PP Sample',
  'Size Set': 'Size Set',
};

const INSP_TYPE_COLORS = {
  'Proto Fit': 'primary',
  Dyelot: 'secondary',
  Strikeoff: 'warning',
  'PP Sample': 'info',
  'Size Set': 'success',
};

const SAMPLE_TYPE_OPTIONS = ['Original', 'Duplicate', 'Counter Sample', 'Photo Sample', 'Sales Sample'];

// ─── Helper ───────────────────────────────────────────────────────────────────

function toDateInputValue(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function buildEmptyForm() {
  return {
    inspAutoNo: '',
    receivedDate: '',
    supplierContact: '',
    styleName: '',
    coo: '',
    sampleType: '',
    reviewDate: '',
    generalComments: '',
  };
}

function buildFormFromSaved(saved) {
  if (!saved) return buildEmptyForm();
  return {
    inspAutoNo: saved.inspAutoNo ?? saved.InspAutoNo ?? '',
    receivedDate: toDateInputValue(saved.receivedDate ?? saved.ReceivedDate),
    supplierContact: saved.supplierContact ?? saved.SupplierContact ?? '',
    styleName: saved.styleName ?? saved.StyleName ?? '',
    coo: saved.cOO ?? saved.COO ?? saved.coo ?? '',
    sampleType: saved.sampleType ?? saved.SampleType ?? '',
    reviewDate: toDateInputValue(saved.reviewDate ?? saved.ReviewDate),
    generalComments: saved.generalComments ?? saved.GeneralComments ?? '',
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, theme: t }) {
  return (
    <Box
      sx={{
        px: 3,
        py: 1.5,
        bgcolor: alpha(t.palette.primary.main, 0.08),
        borderBottom: `1px solid ${t.palette.divider}`,
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} color="primary.dark">
        {title}
      </Typography>
    </Box>
  );
}

function InfoRow({ label, value }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, display: 'block' }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25 }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Mirrors legacy InspectionProcessEntry.aspx?lPOID=&InspType=
 * Valid inspTypes: Proto Fit | Dyelot | Strikeoff | PP Sample | Size Set
 */
export default function QDInspectionProcessEntryView() {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const poid = searchParams.get('poid');
  const inspType = searchParams.get('inspType') ?? 'Proto Fit';

  const handleInspTypeChange = (_e, newType) => {
    if (!newType) return; // prevent deselect
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('inspType', newType);
      return next;
    });
  };

  // ── Load state ───────────────────────────────────────────

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Form state ───────────────────────────────────────────

  const [form, setForm] = useState(buildEmptyForm());
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  // ── Derived ──────────────────────────────────────────────

  const master = data?.master ?? data?.Master;
  const saved = data?.savedRecord ?? data?.SavedRecord;
  const existingId =
    data?.inspectionTNAProcMstId ?? data?.InspectionTNAProcMstId ?? null;

  // ── Load ─────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!poid || !inspType) {
      setLoading(false);
      setError('Missing poid or inspType in URL.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await qdApi.get(
        `/MasterOrderForQDSheet/inspection-process-entry/${encodeURIComponent(poid)}`,
        { params: { inspType } }
      );
      setData(res);
    } catch (e) {
      setError(
        typeof e?.response?.data === 'string'
          ? e.response.data
          : e?.message || 'Failed to load inspection process entry'
      );
    } finally {
      setLoading(false);
    }
  }, [poid, inspType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Populate form when saved record loads
  useEffect(() => {
    setForm(buildFormFromSaved(saved));
  }, [saved]);

  const setF = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Save ─────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSaveErr(null);
    try {
      const body = {
        inspectionTNAProcMstId: existingId ?? null,
        inspAutoNo: form.inspAutoNo || null,
        receivedDate: form.receivedDate ? new Date(form.receivedDate).toISOString() : null,
        supplierContact: form.supplierContact || null,
        styleName: form.styleName || null,
        coo: form.coo || null,
        sampleType: form.sampleType || null,
        reviewDate: form.reviewDate ? new Date(form.reviewDate).toISOString() : null,
        generalComments: form.generalComments || null,
      };

      await qdApi.post(
        `/MasterOrderForQDSheet/inspection-process-entry/${encodeURIComponent(poid)}`,
        body,
        { params: { inspType } }
      );

      // Reload to get new ID / refresh
      await loadData();

      setSnackMsg(existingId ? 'Record updated successfully.' : 'Record saved successfully.');
      setSnackOpen(true);
    } catch (e) {
      const msg =
        typeof e?.response?.data === 'string'
          ? e.response.data
          : e?.response?.data?.message || e?.message || 'Save failed';
      setSaveErr(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Colors ───────────────────────────────────────────────

  const chipColor = INSP_TYPE_COLORS[inspType] || 'default';
  const inspLabel = INSP_TYPE_LABELS[inspType] || inspType;

  // ── Render ───────────────────────────────────────────────

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="INSPECTION PROCESS ENTRY"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Master Order QD Sheet', href: paths.dashboard.masterOrderForQDSheet },
          { name: inspLabel || 'Process Entry' },
        ]}
        sx={{ mb: 3 }}
      />

      {/* ── Toolbar ─── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            component={RouterLink}
            to={paths.dashboard.masterOrderForQDSheet}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
          >
            Back
          </Button>

          {poid && (
            <Chip
              label={`POID: ${poid}`}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>

        {/* Right: PF / DL / SO / PPS / SS Toggle */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mr: 0.5 }}>
            Process Type:
          </Typography>
          <ToggleButtonGroup
            value={inspType}
            exclusive
            onChange={handleInspTypeChange}
            size="small"
            sx={{ flexWrap: 'wrap' }}
          >
            {Object.keys(INSP_TYPE_LABELS).map((t) => (
              <ToggleButton
                key={t}
                value={t}
                sx={{
                  px: 1.5,
                  fontWeight: 700,
                  fontSize: 12,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette[INSP_TYPE_COLORS[t] || 'primary'].main, 0.12),
                    color: `${INSP_TYPE_COLORS[t] || 'primary'}.dark`,
                    borderColor: `${INSP_TYPE_COLORS[t] || 'primary'}.main`,
                  },
                }}
              >
                {t === 'Proto Fit' ? 'PF' : t === 'Dyelot' ? 'DL' : t === 'Strikeoff' ? 'SO' : t === 'PP Sample' ? 'PPS' : 'SS'}
                <Typography component="span" sx={{ display: 'none' }}>{t}</Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {existingId ? (
            <Chip
              icon={<CheckCircleIcon fontSize="small" />}
              label={`Record #${existingId}`}
              color="success"
              variant="outlined"
              size="small"
              sx={{ ml: 1 }}
            />
          ) : (
            <Chip label="New" size="small" variant="outlined" sx={{ ml: 1 }} />
          )}
        </Stack>
      </Stack>

      {/* ── Loading ─── */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ── Error ─── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Save error ─── */}
      {saveErr && (
        <Alert severity="error" onClose={() => setSaveErr(null)} sx={{ mb: 2 }}>
          {saveErr}
        </Alert>
      )}

      {!loading && !error && master && (
        <Stack spacing={3}>
          {/* ─── PO / Vendor Info ──────────────────────────── */}
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: theme.shadows[1] }}>
            <Box
              sx={{
                px: 3,
                py: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                color: 'primary.contrastText',
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.8, fontSize: 11 }}>
                Purchase Order Info
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {master.pono ?? master.PONO ?? `POID: ${poid}`}
              </Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <InfoRow label="PO No" value={master.pono ?? master.PONO} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <InfoRow label="Supplier" value={master.venderName ?? master.VenderName} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <InfoRow label="Style No" value={master.styleNo ?? master.StyleNo} />
                </Grid>
              </Grid>
            </Box>
          </Card>

          {/* ─── Inspection Entry Form ─────────────────────── */}
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: theme.shadows[1] }}>
            <SectionHeader
              title={`${inspLabel} — Inspection Details`}
              theme={theme}
            />

            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Inspection Auto No (read-only if set) */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Inspection Auto No"
                    fullWidth
                    size="small"
                    value={form.inspAutoNo}
                    onChange={setF('inspAutoNo')}
                    placeholder="Auto-generated if left empty"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Sample Type */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Sample Type"
                    fullWidth
                    size="small"
                    select
                    value={form.sampleType}
                    onChange={setF('sampleType')}
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="">
                      <em>— Select —</em>
                    </MenuItem>
                    {SAMPLE_TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Received Date */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Received Date"
                    type="date"
                    fullWidth
                    size="small"
                    value={form.receivedDate}
                    onChange={setF('receivedDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Review Date */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Review Date"
                    type="date"
                    fullWidth
                    size="small"
                    value={form.reviewDate}
                    onChange={setF('reviewDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Supplier Contact */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Supplier Contact"
                    fullWidth
                    size="small"
                    value={form.supplierContact}
                    onChange={setF('supplierContact')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Style Name */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Style Name"
                    fullWidth
                    size="small"
                    value={form.styleName}
                    onChange={setF('styleName')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Country of Origin */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Country of Origin (COO)"
                    fullWidth
                    size="small"
                    value={form.coo}
                    onChange={setF('coo')}
                    InputLabelProps={{ shrink: true }}
                    placeholder="e.g. Bangladesh"
                  />
                </Grid>

                {/* General Comments */}
                <Grid item xs={12}>
                  <TextField
                    label="General Comments"
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                    value={form.generalComments}
                    onChange={setF('generalComments')}
                    InputLabelProps={{ shrink: true }}
                    placeholder="Enter any general comments about this inspection..."
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Save button */}
              <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  disabled={saving}
                  onClick={handleSave}
                  size="large"
                  sx={{ minWidth: 140 }}
                >
                  {saving ? 'Saving…' : existingId ? 'Update Record' : 'Save Record'}
                </Button>
              </Stack>
            </Box>
          </Card>

          {/* ─── Saved Record Summary (if already exists) ────── */}
          {saved && (
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: theme.shadows[1],
                border: `1px solid ${theme.palette.success.light}`,
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 1.5,
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CheckCircleIcon fontSize="small" color="success" />
                <Typography variant="subtitle1" fontWeight={700} color="success.dark">
                  Existing Saved Record
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {[
                    ['Record ID', saved.inspectionTNAProcMstID ?? saved.InspectionTNAProcMstID],
                    ['Auto No', saved.inspAutoNo ?? saved.InspAutoNo],
                    ['Inspection Type', saved.insp_Type ?? saved.Insp_Type],
                    ['Sample Type', saved.sampleType ?? saved.SampleType],
                    ['Received Date', toDateInputValue(saved.receivedDate ?? saved.ReceivedDate)],
                    ['Review Date', toDateInputValue(saved.reviewDate ?? saved.ReviewDate)],
                    ['Supplier Contact', saved.supplierContact ?? saved.SupplierContact],
                    ['Style Name', saved.styleName ?? saved.StyleName],
                    ['COO', saved.cOO ?? saved.COO ?? saved.coo],
                  ].map(([k, v]) => (
                    <Grid item xs={12} sm={6} md={4} key={k}>
                      <InfoRow label={k} value={v != null ? String(v) : undefined} />
                    </Grid>
                  ))}
                  {(saved.generalComments ?? saved.GeneralComments) && (
                    <Grid item xs={12}>
                      <InfoRow
                        label="General Comments"
                        value={saved.generalComments ?? saved.GeneralComments}
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Card>
          )}

          {/* ─── Inspection Type Info Box ───────────────────── */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.04),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Typography variant="subtitle2" color="info.dark" gutterBottom fontWeight={700}>
              About {inspLabel} Inspection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {
                {
                  'Proto Fit': 'Proto Fit (PF) inspection verifies the initial prototype garment fit and construction before bulk production approval.',
                  Dyelot: 'Dyelot (DL) inspection checks colour consistency, dye lot matching, and fabric quality before cutting.',
                  Strikeoff: 'Strikeoff (SO) inspection verifies print artwork, colour accuracy, and fabric handle on strike-off samples.',
                  'PP Sample': 'Pre-Production (PPS) inspection evaluates a production-representative sample for conformity before bulk cutting begins.',
                  'Size Set': 'Size Set (SS) inspection confirms fit, grading accuracy, and measurements across the full size range.',
                }[inspType] ||
                  `${inspType} inspection entry for POID ${poid}.`
              }
            </Typography>
          </Paper>
        </Stack>
      )}

      {/* ─── No data state ─── */}
      {!loading && !error && !master && (
        <Alert severity="info">No inspection data found for POID: {poid}, Type: {inspType}</Alert>
      )}

      {/* ─── Success Snackbar ─── */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
