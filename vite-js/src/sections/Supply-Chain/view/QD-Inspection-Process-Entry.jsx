import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

// ----------------------------------------------------------------------

function fld(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && v !== '') return v;
  }
  return null;
}

/** Section card matching QD Inspection style */
function SectionCard({ title, children }) {
  return (
    <Card
      variant="outlined"
      sx={{ mb: 2, borderRadius: 1, overflow: 'hidden' }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.2,
          bgcolor: 'grey.100',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} fontSize={15}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

const TESTING_CHECKS = [
  { key: 'measureToSpec',       label: 'Measure to Spec' },
  { key: 'fabricWeight',        label: 'Fabric Weight' },
  { key: 'components',          label: 'Components' },
  { key: 'garmentFit',          label: 'Garment Fit' },
  { key: 'fabricColorMatch',    label: 'Fabric Color Match' },
  { key: 'embellishment',       label: 'Embellishment' },
  { key: 'fabricQualityHand',   label: 'Fabric Quality/Hand' },
  { key: 'construction',        label: 'Construction' },
  { key: 'labeling',            label: 'Labeling' },
  { key: 'fabricWashTest',      label: 'Fabric Wash Test' },
  { key: 'sewingQuality',       label: 'Sewing Quality' },
];

const initForm = () => ({
  inspSampleNo:    '',
  receivedDate:    '',
  supplierContact: '',
  styleNumber:     '',
  coo:             '',
  styleName:       '',
  savedInSeason:   '',
  sampleType:      '',
  reviewDate:      '',
  // Testing & Evaluation checkboxes
  measureToSpec:     false,
  fabricWeight:      false,
  components:        false,
  garmentFit:        false,
  fabricColorMatch:  false,
  embellishment:     false,
  fabricQualityHand: false,
  construction:      false,
  labeling:          false,
  fabricWashTest:    false,
  sewingQuality:     false,
  testingComments:      '',
  // Finished Dimension Measurement Results
  measurementsNotMeet:  '',
  measurementType:      '',
  // Fabric Testing and Garment Feedback
  fabricRows: Array.from({ length: 8 }, () => ({ test: '', status: 'rejected', comments: '' })),
  fabricStandardGSM:  '',
  actualWeightGSM:    '',
  fabricApproved:     '',
  constructionFit:    '',
  embellishment2:     '',
  generalComments:    '',
  // Approval and Supplier Instructions
  garmentRejectedFitSample:        false,
  proceedSalesSamplesWithChanges:  false,
  proceedWithSalesSamples:         false,
  proceedWithProductionQuantities:  false,
  garmentApprovedWaiting:          false,
});

// ----------------------------------------------------------------------

export default function QDInspectionProcessEntryView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poid     = searchParams.get('poid');
  const inspType = searchParams.get('inspType') ?? '';

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [form,    setForm]    = useState(initForm);

  const setF = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const setFabricRow = (idx, field, val) =>
    setForm((p) => {
      const rows = p.fabricRows.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
      return { ...p, fabricRows: rows };
    });

  // ── Load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!poid || !inspType) {
      setLoading(false);
      setError('Missing poid or inspType in URL.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res } = await qdApi.get(
          `/MasterOrderForQDSheet/inspection-process-entry/${encodeURIComponent(poid)}`,
          { params: { inspType } }
        );
        if (cancelled) return;
        setData(res);

        const master = res?.master ?? res?.Master;
        const saved  = res?.savedRecord ?? res?.SavedRecord;

        setForm({
          inspSampleNo:    fld(saved, 'inspAutoNo',       'InspAutoNo')       ?? '',
          receivedDate:    fld(saved, 'receivedDate',     'ReceivedDate')     ?? '',
          supplierContact: fld(saved, 'supplierContact',  'SupplierContact')
                           ?? fld(master, 'venderName',   'VenderName')       ?? '',
          styleNumber:     fld(saved, 'styleNo',          'StyleNo')
                           ?? fld(master, 'styleNo',      'StyleNo')          ?? '',
          coo:             fld(saved, 'cOO', 'coo',       'COO')              ?? '',
          styleName:       fld(saved, 'styleName',        'StyleName')        ?? '',
          savedInSeason:   fld(saved, 'season',           'Season')
                           ?? fld(master, 'season',       'Season')           ?? '',
          sampleType:      fld(saved, 'sampleType',       'SampleType')       ?? '',
          reviewDate:      fld(saved, 'reviewDate',       'ReviewDate')       ?? '',
          // Testing checkboxes
          measureToSpec:     !!(fld(saved, 'measureToSpec',     'MeasureToSpec')),
          fabricWeight:      !!(fld(saved, 'fabricWeight',      'FabricWeight')),
          components:        !!(fld(saved, 'components',        'Components')),
          garmentFit:        !!(fld(saved, 'garmentFit',        'GarmentFit')),
          fabricColorMatch:  !!(fld(saved, 'fabricColorMatch',  'FabricColorMatch')),
          embellishment:     !!(fld(saved, 'embellishment',     'Embellishment')),
          fabricQualityHand: !!(fld(saved, 'fabricQualityHand', 'FabricQualityHand')),
          construction:      !!(fld(saved, 'construction',      'Construction')),
          labeling:          !!(fld(saved, 'labeling',          'Labeling')),
          fabricWashTest:    !!(fld(saved, 'fabricWashTest',    'FabricWashTest')),
          sewingQuality:     !!(fld(saved, 'sewingQuality',     'SewingQuality')),
          testingComments:     fld(saved, 'testingComments',    'TestingComments')    ?? '',
          measurementsNotMeet: fld(saved, 'measurementsNotMeet','MeasurementsNotMeet') ?? '',
          measurementType:     fld(saved, 'measurementType',    'MeasurementType')    ?? '',
          fabricRows: (() => {
            const rows = fld(saved, 'fabricRows', 'FabricRows');
            if (Array.isArray(rows) && rows.length > 0) return rows;
            return Array.from({ length: 8 }, () => ({ test: '', status: 'rejected', comments: '' }));
          })(),
          fabricStandardGSM: fld(saved, 'fabricStandardGSM', 'FabricStandardGSM') ?? '',
          actualWeightGSM:   fld(saved, 'actualWeightGSM',   'ActualWeightGSM')   ?? '',
          fabricApproved:    fld(saved, 'fabricApproved',    'FabricApproved')    ?? '',
          constructionFit:   fld(saved, 'constructionFit',   'ConstructionFit')   ?? '',
          embellishment2:    fld(saved, 'embellishment2',    'Embellishment2')    ?? '',
          generalComments:   fld(saved, 'generalComments',   'GeneralComments')   ?? '',
          garmentRejectedFitSample:       !!(fld(saved, 'garmentRejectedFitSample',      'GarmentRejectedFitSample')),
          proceedSalesSamplesWithChanges: !!(fld(saved, 'proceedSalesSamplesWithChanges','ProceedSalesSamplesWithChanges')),
          proceedWithSalesSamples:        !!(fld(saved, 'proceedWithSalesSamples',       'ProceedWithSalesSamples')),
          proceedWithProductionQuantities:!!(fld(saved, 'proceedWithProductionQuantities','ProceedWithProductionQuantities')),
          garmentApprovedWaiting:         !!(fld(saved, 'garmentApprovedWaiting',        'GarmentApprovedWaiting')),
        });
      } catch (e) {
        if (!cancelled) {
          setError(
            typeof e?.response?.data === 'string'
              ? e.response.data
              : e?.message || 'Failed to load process entry'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [poid, inspType]);

  // ── Save ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    setError(null);
    try {
      await qdApi.post(
        `/MasterOrderForQDSheet/inspection-process-entry/${encodeURIComponent(poid)}`,
        {
          inspType,
          inspAutoNo:       form.inspSampleNo    || null,
          receivedDate:     form.receivedDate     || null,
          supplierContact:  form.supplierContact  || null,
          styleNo:          form.styleNumber      || null,
          cOO:              form.coo              || null,
          styleName:        form.styleName        || null,
          season:           form.savedInSeason    || null,
          sampleType:       form.sampleType       || null,
          reviewDate:       form.reviewDate       || null,
          measureToSpec:    form.measureToSpec,
          fabricWeight:     form.fabricWeight,
          components:       form.components,
          garmentFit:       form.garmentFit,
          fabricColorMatch: form.fabricColorMatch,
          embellishment:    form.embellishment,
          fabricQualityHand:form.fabricQualityHand,
          construction:     form.construction,
          labeling:         form.labeling,
          fabricWashTest:   form.fabricWashTest,
          sewingQuality:    form.sewingQuality,
          testingComments:      form.testingComments      || null,
          measurementsNotMeet:  form.measurementsNotMeet   || null,
          measurementType:      form.measurementType       || null,
          fabricRows:           form.fabricRows,
          fabricStandardGSM:    form.fabricStandardGSM     || null,
          actualWeightGSM:      form.actualWeightGSM       || null,
          fabricApproved:       form.fabricApproved        || null,
          constructionFit:      form.constructionFit       || null,
          embellishment2:       form.embellishment2        || null,
          generalComments:                form.generalComments                || null,
          garmentRejectedFitSample:       form.garmentRejectedFitSample,
          proceedSalesSamplesWithChanges: form.proceedSalesSamplesWithChanges,
          proceedWithSalesSamples:        form.proceedWithSalesSamples,
          proceedWithProductionQuantities:form.proceedWithProductionQuantities,
          garmentApprovedWaiting:         form.garmentApprovedWaiting,
        }
      );
      setSaveMsg('Saved successfully.');
    } catch (e) {
      setError(
        typeof e?.response?.data === 'string'
          ? e.response.data
          : e?.message || 'Save failed'
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────
  const master = data?.master ?? data?.Master;
  const poNo   = fld(master, 'pono', 'PONO', 'poNo') ?? '';

  const sectionHeading = `${inspType} - SAMPLE INSPECTION INFORMATION${poNo ? ` - ${poNo}` : ''}`;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="INSPECTION PROCESS ENTRY"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Master Order QD Sheet', href: paths.dashboard.masterOrderForQDSheet },
          { name: 'Process entry' },
        ]}
        sx={{ mb: 2 }}
      />

      {/* ── Inspection type navigation buttons ── */}
      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" justifyContent="flex-end" sx={{ mb: 2 }}>
        {[
          { label: 'Proto Fit',  type: 'Proto Fit'  },
          { label: 'Dyelot',     type: 'Dyelot'     },
          { label: 'Strikeoff',  type: 'Strikeoff'  },
          { label: 'PP Sample',  type: 'PP Sample'  },
          { label: 'Size Set',   type: 'Size Set'   },
        ].map(({ label, type }) => {
          const isActive = inspType === type;
          return (
            <Button
              key={type}
              size="small"
              variant={isActive ? 'contained' : 'outlined'}
              color="primary"
              onClick={() =>
                navigate(
                  `${paths.dashboard.qdProcessEntry}?poid=${poid}&inspType=${encodeURIComponent(type)}`
                )
              }
              sx={{ minWidth: 90, fontWeight: isActive ? 700 : 400 }}
            >
              {label}
            </Button>
          );
        })}
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {saveMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveMsg(null)}>
          {saveMsg}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {/* ── SAMPLE INSPECTION INFORMATION ── */}
          <SectionCard title={sectionHeading}>
            <Grid container spacing={2}>

              {/* Row 1 — Insp. Sample # */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Insp. Sample #
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.inspSampleNo}
                  onChange={(e) => setF('inspSampleNo', e.target.value)}
                  placeholder="—"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={9} />

              {/* Row 2 — Received Date | Supplier/Contact | Style Number | COO */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Received Date
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="date"
                  value={form.receivedDate}
                  onChange={(e) => setF('receivedDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Supplier/Contact
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.supplierContact}
                  onChange={(e) => setF('supplierContact', e.target.value)}
                  placeholder="—"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Style Number
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.styleNumber}
                  onChange={(e) => setF('styleNumber', e.target.value)}
                  placeholder="—"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  COO
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.coo}
                  onChange={(e) => setF('coo', e.target.value)}
                  placeholder="—"
                />
              </Grid>

              {/* Row 3 — Style Name | Saved in Season | Sample Type | Review Date */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Style Name
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.styleName}
                  onChange={(e) => setF('styleName', e.target.value)}
                  placeholder="—"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Saved in Season
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.savedInSeason}
                  onChange={(e) => setF('savedInSeason', e.target.value)}
                  placeholder="—"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Sample Type
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.sampleType}
                  onChange={(e) => setF('sampleType', e.target.value)}
                  placeholder="—"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Review Date
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="date"
                  value={form.reviewDate}
                  onChange={(e) => setF('reviewDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

            </Grid>
          </SectionCard>

          {/* ── TESTING AND EVALUATION ── */}
          <SectionCard title="TESTING AND EVALUATION to be PERFORMED (check all that apply)">
            <Grid container spacing={0}>
              {TESTING_CHECKS.map(({ key, label }) => (
                <Grid item xs={12} sm={4} key={key}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={!!form[key]}
                        onChange={(e) => setF(key, e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                    }
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Comments
              </Typography>
              <TextField
                size="small"
                fullWidth
                value={form.testingComments}
                onChange={(e) => setF('testingComments', e.target.value)}
                placeholder="—"
              />
            </Box>
          </SectionCard>

          {/* ── FINISHED DIMENSION MEASUREMENT RESULTS ── */}
          <SectionCard title="FINISHED DIMENSION MEASUREMENT RESULTS">
            <Grid container spacing={2}>
              {/* Measurements That Do Not Meet Required Spec */}
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Measurements That Do Not Meet Required Spec
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.measurementsNotMeet}
                  onChange={(e) => setF('measurementsNotMeet', e.target.value)}
                  placeholder="—"
                />
              </Grid>

              {/* Type dropdown */}
              <Grid item xs={12} sm={4} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Type
                </Typography>
                <TextField
                  select
                  size="small"
                  fullWidth
                  value={form.measurementType}
                  onChange={(e) => setF('measurementType', e.target.value)}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Spec">Spec</MenuItem>
                  <MenuItem value="Grading">Grading</MenuItem>
                  <MenuItem value="Tolerance">Tolerance</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </SectionCard>

          {/* ── FABRIC TESTING AND GARMENT FEEDBACK ── */}
          <SectionCard title="FABRIC TESTING AND GARMENT FEEDBACK">
            {/* Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Fabric Tests', 'Approved', 'Rejected', 'Comments'].map((col) => (
                      <TableCell
                        key={col}
                        align="center"
                        sx={{
                          bgcolor: col === 'Fabric Tests' || col === 'Comments' ? 'grey.700' : 'grey.500',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 13,
                          py: 1,
                        }}
                      >
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.fabricRows.map((row, idx) => (
                    <TableRow key={idx} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : 'grey.50' }}>
                      {/* Fabric Test name */}
                      <TableCell sx={{ width: '35%' }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={row.test}
                          onChange={(e) => setFabricRow(idx, 'test', e.target.value)}
                          variant="standard"
                          placeholder="—"
                        />
                      </TableCell>
                      {/* Approved / Rejected radio */}
                      <TableCell align="center" sx={{ width: '15%' }}>
                        <RadioGroup
                          row
                          value={row.status}
                          onChange={(e) => setFabricRow(idx, 'status', e.target.value)}
                          sx={{ justifyContent: 'center' }}
                        >
                          <Radio value="approved" size="small" />
                        </RadioGroup>
                      </TableCell>
                      <TableCell align="center" sx={{ width: '15%' }}>
                        <RadioGroup
                          row
                          value={row.status}
                          onChange={(e) => setFabricRow(idx, 'status', e.target.value)}
                          sx={{ justifyContent: 'center' }}
                        >
                          <Radio value="rejected" size="small" />
                        </RadioGroup>
                      </TableCell>
                      {/* Comments */}
                      <TableCell sx={{ width: '35%' }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={row.comments}
                          onChange={(e) => setFabricRow(idx, 'comments', e.target.value)}
                          variant="standard"
                          placeholder="—"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Footer row */}
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="right"
                      sx={{ bgcolor: 'grey.700', color: '#fff', fontWeight: 600, py: 0.8, fontSize: 13 }}
                    >
                      Page 1
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* GSM + Fabric Approved */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Fabric Standard GSM
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.fabricStandardGSM}
                  onChange={(e) => setF('fabricStandardGSM', e.target.value)}
                  placeholder="—"
                />
              </Grid>

              <Grid item xs={12} sm={4} md={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Actual Weight GSM
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.actualWeightGSM}
                  onChange={(e) => setF('actualWeightGSM', e.target.value)}
                  placeholder="—"
                />
              </Grid>

              <Grid item xs={12} sm={4} md={4}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Fabric Approved?
                </Typography>
                <RadioGroup
                  row
                  value={form.fabricApproved}
                  onChange={(e) => setF('fabricApproved', e.target.value)}
                >
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="YES" />
                  <FormControlLabel value="no"  control={<Radio size="small" />} label="NO" />
                </RadioGroup>
              </Grid>
            </Grid>

            {/* Construction / Fit */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Construction / Fit
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={form.constructionFit}
                onChange={(e) => setF('constructionFit', e.target.value)}
                placeholder="—"
              />
            </Box>

            {/* Embellishment */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Embellishment
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={form.embellishment2}
                onChange={(e) => setF('embellishment2', e.target.value)}
                placeholder="—"
              />
            </Box>

            {/* General Comments */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                General Comments
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={form.generalComments}
                onChange={(e) => setF('generalComments', e.target.value)}
                placeholder="—"
              />
            </Box>
          </SectionCard>

          {/* ── APPROVAL AND SUPPLIER INSTRUCTIONS ── */}
          <SectionCard title="APPROVAL AND SUPPLIER INSTRUCTIONS: MUST BE COMPLETE BEFORE SUBMITTING TO FACTORY">
            <Grid container spacing={0}>
              {/* Left column */}
              <Grid item xs={12} md={6}>
                {[
                  { key: 'garmentRejectedFitSample',  label: 'Garment Rejected - Submit a corrected Fit Sample' },
                  { key: 'proceedWithSalesSamples',   label: 'Proceed with Sales Samples' },
                  { key: 'garmentApprovedWaiting',    label: 'Garment approved - waiting for customer selection' },
                ].map(({ key, label }) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        size="small"
                        checked={!!form[key]}
                        onChange={(e) => setF(key, e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2" color="text.secondary">{label}</Typography>}
                    sx={{ display: 'flex', mb: 0.5 }}
                  />
                ))}
              </Grid>

              {/* Right column */}
              <Grid item xs={12} md={6}>
                {[
                  { key: 'proceedSalesSamplesWithChanges',  label: 'Proceed to Sales Samples with changes/corrections' },
                  { key: 'proceedWithProductionQuantities', label: 'Proceed with Production Quantities' },
                ].map(({ key, label }) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        size="small"
                        checked={!!form[key]}
                        onChange={(e) => setF(key, e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2" color="text.secondary">{label}</Typography>}
                    sx={{ display: 'flex', mb: 0.5 }}
                  />
                ))}
              </Grid>
            </Grid>

            {/* Save / Cancel buttons — bottom right */}
            <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={saving}
                onClick={handleSave}
                sx={{ minWidth: 120 }}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                variant="contained"
                component={RouterLink}
                to={paths.dashboard.masterOrderForQDSheet}
                sx={{ minWidth: 120, bgcolor: 'grey.700', '&:hover': { bgcolor: 'grey.800' } }}
              >
                Cancel
              </Button>
            </Stack>
          </SectionCard>
        </>
      )}
    </Container>
  );
}
