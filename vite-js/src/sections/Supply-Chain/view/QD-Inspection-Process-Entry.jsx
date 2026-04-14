import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

// ─── Constants (legacy InspectionProcessEntry.aspx InspType + short labels) ─

const INSP_TYPE_ORDER = ['Proto Fit', 'Dyelot', 'Strikeoff', 'PP Sample', 'Size Set'];

const INSP_TYPE_SHORT = {
  'Proto Fit': 'PF',
  Dyelot: 'DL',
  Strikeoff: 'SO',
  'PP Sample': 'PPS',
  'Size Set': 'SS',
};

const INSP_TYPE_COLORS = {
  'Proto Fit': 'primary',
  Dyelot: 'secondary',
  Strikeoff: 'warning',
  'PP Sample': 'info',
  'Size Set': 'success',
};

/** Legacy InspectionProcessEntry.aspx — three columns, top-to-bottom per column */
const TE_COLUMNS = [
  [
    { key: 'teMeasureToSpec', label: 'Measure to Spec' },
    { key: 'teGarmentFit', label: 'Garment Fit' },
    { key: 'teFabricQuality', label: 'Fabric Quality/Hand' },
    { key: 'teFabricWashTest', label: 'Fabric Wash Test' },
  ],
  [
    { key: 'teFabricWeight', label: 'Fabric Weight' },
    { key: 'teFabricColorMatch', label: 'Fabric Color Match' },
    { key: 'teConstruction', label: 'Construction' },
    { key: 'teSewingQuality', label: 'Sewing Quality' },
  ],
  [
    { key: 'teComponents', label: 'Components' },
    { key: 'teEmbellishment', label: 'Embellishment' },
    { key: 'teLabeling', label: 'Labeling' },
  ],
];

const FABRIC_GRID_ROW_COUNT = 8;

const MEASUREMENT_GRID_HEADER = '#f58f62';

const SIZE_COUNT = 12;

function emptyHeaderCells() {
  return Array.from({ length: SIZE_COUNT }, () => '');
}

/** API row → editable grid row (template Col* = quote, QCol* = actual / saved to INSP). */
function mapMeasRowFromApi(r) {
  const src = r || {};
  const g = (camel, pascal) => src[camel] ?? src[pascal] ?? '';
  const tpl = [];
  const spec = [];
  for (let i = 1; i <= SIZE_COUNT; i += 1) {
    tpl.push(String(g(`col${i}`, `Col${i}`) ?? ''));
    spec.push(String(g(`qCol${i}`, `QCol${i}`) ?? ''));
  }
  return {
    sizeSpecsNewId: Number(g('sizeSpecsNewId', 'SizeSpecsNewId')) || 0,
    sizeSpecsHeaderNewId: Number(g('sizeSpecsHeaderNewId', 'SizeSpecsHeaderNewId')) || 0,
    measurementPointId: Number(g('measurementPointId', 'MeasurementPointId')) || 0,
    measurementPoints: String(g('measurementPoints', 'MeasurementPoints') ?? ''),
    measurements: String(g('measurements', 'Measurements') ?? ''),
    tolerance: String(g('tolerance', 'Tolerance') ?? ''),
    tpl,
    spec,
  };
}

function headersFromFirstRow(rows) {
  const first = rows?.[0];
  if (!first) return emptyHeaderCells();
  const g = (i) =>
    first[`header${i}`] ??
    first[`Header${i}`] ??
    first[`h${i}`] ??
    '';
  return Array.from({ length: SIZE_COUNT }, (_, idx) => String(g(idx + 1) ?? ''));
}

function createEmptyFabricRows() {
  return Array.from({ length: FABRIC_GRID_ROW_COUNT }, () => ({
    fabricTest: '',
    verdict: '', // '' | 'A' | 'R' — maps to API isApprove 2 / 1 / 0
    comments: '',
  }));
}

/** API GET: FabricTestLines → grid rows (legacy isApprove 1/0/2). */
function mapFabricFromApi(lines) {
  const rows = createEmptyFabricRows();
  if (!lines?.length) return rows;
  const src = lines.slice(0, FABRIC_GRID_ROW_COUNT);
  src.forEach((line, idx) => {
    const ia = line.isApprove ?? line.IsApprove;
    let verdict = '';
    if (ia === 1 || ia === true) verdict = 'A';
    else if (ia === 0 || ia === false) verdict = 'R';
    rows[idx] = {
      fabricTest: line.fabricTests ?? line.FabricTests ?? '',
      verdict,
      comments: line.fabricComments ?? line.FabricComments ?? '',
    };
  });
  return rows;
}

function buildFabricTestLinesPayload(fabricRows) {
  return fabricRows
    .map((r) => {
      const fabricTests = String(r.fabricTest ?? '').trim();
      let isApprove = 2;
      if (r.verdict === 'A') isApprove = 1;
      else if (r.verdict === 'R') isApprove = 0;
      const fabricComments = r.comments != null ? String(r.comments) : '';
      return { fabricTests, isApprove, fabricComments };
    })
    .filter((x) => x.fabricTests !== '');
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDateInputValue(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function boolSaved(row, camel, pascal) {
  const v = row?.[camel] ?? row?.[pascal];
  return v === true || v === 1 || v === '1';
}

function buildEmptyForm(masterStyleNo = '') {
  return {
    inspAutoNo: '',
    receivedDate: '',
    supplierContact: '',
    styleNo: masterStyleNo,
    styleName: '',
    coo: '',
    savedInSeason: '',
    sampleType: '',
    reviewDate: '',
    teMeasureToSpec: false,
    teFabricWeight: false,
    teComponents: false,
    teGarmentFit: false,
    teFabricColorMatch: false,
    teEmbellishment: false,
    teFabricQuality: false,
    teConstruction: false,
    teLabeling: false,
    teFabricWashTest: false,
    teSewingQuality: false,
    teComments: '',
    fdmrComments: '',
    fabricStandardGsm: '',
    actualWeightGsm: '',
    fabricApproved: '2',
    constructionFitComments: '',
    embellishmentComments: '',
    generalComments: '',
    asiGarmentRejected: false,
    asiProceedToSales: false,
    asiProceedWithSales: false,
    asiProceedWithProd: false,
    asiGarmentApproved: false,
  };
}

function buildFormFromSaved(saved, masterStyleNo) {
  if (!saved) return buildEmptyForm(masterStyleNo);
  const fa = saved.fabricApproved ?? saved.FabricApproved;
  let fabricApproved = '2';
  if (fa === 0 || fa === '0') fabricApproved = '0';
  else if (fa === 1 || fa === '1') fabricApproved = '1';

  return {
    inspAutoNo: saved.inspAutoNo ?? saved.InspAutoNo ?? '',
    receivedDate: toDateInputValue(saved.receivedDate ?? saved.ReceivedDate),
    supplierContact: saved.supplierContact ?? saved.SupplierContact ?? '',
    styleNo: saved.styleNo ?? saved.StyleNo ?? masterStyleNo,
    styleName: saved.styleName ?? saved.StyleName ?? '',
    coo: saved.cOO ?? saved.COO ?? saved.coo ?? '',
    savedInSeason: saved.savedInSession ?? saved.SavedInSession ?? '',
    sampleType: saved.sampleType ?? saved.SampleType ?? '',
    reviewDate: toDateInputValue(saved.reviewDate ?? saved.ReviewDate),
    teMeasureToSpec: boolSaved(saved, 'teMeasureToSpec', 'TeMeasureToSpec'),
    teFabricWeight: boolSaved(saved, 'teFabricWeight', 'TeFabricWeight'),
    teComponents: boolSaved(saved, 'teComponents', 'TeComponents'),
    teGarmentFit: boolSaved(saved, 'teGarmentFit', 'TeGarmentFit'),
    teFabricColorMatch: boolSaved(saved, 'teFabricColorMatch', 'TeFabricColorMatch'),
    teEmbellishment: boolSaved(saved, 'teEmbellishment', 'TeEmbellishment'),
    teFabricQuality: boolSaved(saved, 'teFabricQuality', 'TeFabricQuality'),
    teConstruction: boolSaved(saved, 'teConstruction', 'TeConstruction'),
    teLabeling: boolSaved(saved, 'teLabeling', 'TeLabeling'),
    teFabricWashTest: boolSaved(saved, 'teFabricWashTest', 'TeFabricWashTest'),
    teSewingQuality: boolSaved(saved, 'teSewingQuality', 'TeSewingQuality'),
    teComments: saved.teComments ?? saved.TeComments ?? '',
    fdmrComments: saved.fdmrComments ?? saved.FdmrComments ?? '',
    fabricStandardGsm:
      (saved.fabricStandardGsm ?? saved.FabricStandardGsm) != null
        ? String(saved.fabricStandardGsm ?? saved.FabricStandardGsm)
        : '',
    actualWeightGsm:
      (saved.actualWeightGsm ?? saved.ActualWeightGsm) != null
        ? String(saved.actualWeightGsm ?? saved.ActualWeightGsm)
        : '',
    fabricApproved,
    constructionFitComments: saved.constructionFitComments ?? saved.ConstructionFitComments ?? '',
    embellishmentComments: saved.embellishmentComments ?? saved.EmbellishmentComments ?? '',
    generalComments: saved.generalComments ?? saved.GeneralComments ?? '',
    asiGarmentRejected: boolSaved(saved, 'asiGarmentRejected', 'AsiGarmentRejected'),
    asiProceedToSales: boolSaved(saved, 'asiProceedToSales', 'AsiProceedToSales'),
    asiProceedWithSales: boolSaved(saved, 'asiProceedWithSales', 'AsiProceedWithSales'),
    asiProceedWithProd: boolSaved(saved, 'asiProceedWithProd', 'AsiProceedWithProd'),
    asiGarmentApproved: boolSaved(saved, 'asiGarmentApproved', 'AsiGarmentApproved'),
  };
}

function parseDec(s) {
  if (s == null || String(s).trim() === '') return null;
  const n = Number(String(s).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Bootstrap `form-control-label` / legacy card header look */
function FieldLabel({ children }) {
  return (
    <Typography
      component="label"
      variant="caption"
      sx={{
        display: 'block',
        mb: 0.5,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: 'text.secondary',
      }}
    >
      {children}
    </Typography>
  );
}

function LegacySectionCard({ title, children, headerRight }) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1,
        overflow: 'hidden',
        borderColor: 'divider',
        boxShadow: (t) => t.shadows[1],
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: (t) => t.palette.grey[100],
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {typeof title === 'string' ? (
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '0.95rem', sm: '1.2rem' },
                fontWeight: 700,
                color: 'text.primary',
                m: 0,
                lineHeight: 1.35,
              }}
            >
              {title}
            </Typography>
          ) : (
            title
          )}
        </Box>
        {headerRight}
      </Box>
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>{children}</Box>
    </Card>
  );
}

FieldLabel.propTypes = { children: PropTypes.node };
LegacySectionCard.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  headerRight: PropTypes.node,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Legacy InspectionProcessEntry.aspx — Proto Fit, Dyelot, Strikeoff, PP Sample, Size Set
 */
export default function QDInspectionProcessEntryView() {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const poid = searchParams.get('poid');
  const inspType = searchParams.get('inspType') ?? 'Proto Fit';

  const handleInspTypeChange = (_e, newType) => {
    if (!newType) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('inspType', newType);
      return next;
    });
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(() => buildEmptyForm());
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  /** Index into measurementTypesList; -1 = Select (legacy ddl first item). */
  const [measTypeIdx, setMeasTypeIdx] = useState(-1);
  const [measRows, setMeasRows] = useState([]);
  const [measHeaders, setMeasHeaders] = useState(() => emptyHeaderCells());
  const [measLoading, setMeasLoading] = useState(false);
  const [measSaving, setMeasSaving] = useState(false);
  const [measErr, setMeasErr] = useState(null);
  const [fabricFeedbackOpts, setFabricFeedbackOpts] = useState([]);
  const fabricFbTimerRef = useRef(null);
  const [fabricRows, setFabricRows] = useState(() => createEmptyFabricRows());

  const master = data?.master ?? data?.Master;
  const existingId = data?.inspectionTNAProcMstId ?? data?.InspectionTNAProcMstId ?? null;

  const masterStyleNo = master?.styleNo ?? master?.StyleNo ?? '';
  const measurementTypesList = data?.measurementTypes ?? data?.MeasurementTypes ?? [];

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

  useEffect(() => {
    if (!data) return;
    const m = data?.master ?? data?.Master;
    const s = data?.savedRecord ?? data?.SavedRecord;
    const sn = m?.styleNo ?? m?.StyleNo ?? '';
    const next = buildFormFromSaved(s, sn);
    const suggested = data?.suggestedInspAutoNo ?? data?.SuggestedInspAutoNo;
    if (!s && suggested) next.inspAutoNo = suggested;
    setForm(next);
    const lines = data.fabricTestLines ?? data.FabricTestLines ?? [];
    setFabricRows(mapFabricFromApi(lines));
    const types = data.measurementTypes ?? data.MeasurementTypes ?? [];
    if (types.length > 0) setMeasTypeIdx((prev) => (prev < 0 ? 0 : prev));
  }, [data]);

  useEffect(() => {
    setMeasTypeIdx(-1);
    setMeasRows([]);
    setMeasHeaders(emptyHeaderCells());
    setMeasErr(null);
  }, [poid, inspType]);

  const loadMeasurementGrid = useCallback(async () => {
    if (!poid || measTypeIdx < 0) {
      setMeasRows([]);
      setMeasHeaders(emptyHeaderCells());
      return;
    }
    const list = data?.measurementTypes ?? data?.MeasurementTypes ?? [];
    const mt = list[measTypeIdx];
    const mtId = mt?.measurementTypeID ?? mt?.MeasurementTypeID;
    if (!mtId) {
      setMeasRows([]);
      return;
    }
    setMeasLoading(true);
    setMeasErr(null);
    try {
      const params = { measurementTypeId: mtId };
      const eid = data?.inspectionTNAProcMstId ?? data?.InspectionTNAProcMstId;
      if (eid) params.inspectionTNAProcMstId = eid;
      const { data: res } = await qdApi.get(
        `/MasterOrderForQDSheet/inspection-process-entry/${encodeURIComponent(poid)}/measurement-grid`,
        { params }
      );
      const apiRows = res?.rows ?? res?.Rows ?? [];
      setMeasHeaders(headersFromFirstRow(apiRows));
      setMeasRows(apiRows.map(mapMeasRowFromApi));
    } catch (e) {
      setMeasErr(
        typeof e?.response?.data === 'string'
          ? e.response.data
          : e?.message || 'Failed to load measurement grid'
      );
      setMeasRows([]);
      setMeasHeaders(emptyHeaderCells());
    } finally {
      setMeasLoading(false);
    }
  }, [poid, measTypeIdx, data]);

  useEffect(() => {
    if (!poid || !data) return;
    loadMeasurementGrid();
  }, [poid, measTypeIdx, data, loadMeasurementGrid]);

  const fetchFabricFeedback = useCallback(async (prefix) => {
    try {
      const { data: list } = await qdApi.get(
        '/MasterOrderForQDSheet/inspection-process-entry/fabric-feedback',
        { params: { prefix: prefix || '' } }
      );
      setFabricFeedbackOpts(Array.isArray(list) ? list : []);
    } catch {
      setFabricFeedbackOpts([]);
    }
  }, []);

  const handleSaveSpecs = async () => {
    if (measTypeIdx < 0 || !poid) return;
    const mt = measurementTypesList[measTypeIdx];
    const mtId = mt?.measurementTypeID ?? mt?.MeasurementTypeID;
    if (!mtId) return;
    setMeasSaving(true);
    setMeasErr(null);
    try {
      const headers = {};
      for (let i = 1; i <= SIZE_COUNT; i += 1) {
        headers[`header${i}`] = measHeaders[i - 1] ?? '';
      }
      const rows = measRows.map((r) => {
        const o = {
          sizeSpecsNewId: r.sizeSpecsNewId,
          sizeSpecsHeaderNewId: r.sizeSpecsHeaderNewId,
          measurementPointId: r.measurementPointId,
          measurementPoints: r.measurementPoints,
          measurements: r.measurements,
          tolerance: r.tolerance,
        };
        for (let i = 1; i <= SIZE_COUNT; i += 1) {
          o[`col${i}`] = r.spec[i - 1] ?? '';
        }
        return o;
      });
      await qdApi.post(
        `/MasterOrderForQDSheet/inspection-process-entry/${encodeURIComponent(poid)}/measurement-grid`,
        {
          measurementTypeId: mtId,
          inspectionTNAProcMstId: existingId ?? null,
          headers,
          rows,
        }
      );
      setSnackMsg('Size specs saved.');
      setSnackOpen(true);
      await loadData();
    } catch (e) {
      setMeasErr(
        typeof e?.response?.data === 'string'
          ? e.response.data
          : e?.response?.data?.message || e?.message || 'Save specs failed'
      );
    } finally {
      setMeasSaving(false);
    }
  };

  const setFabricCell = (idx, field, value) => {
    setFabricRows((rows) => {
      const next = [...rows];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const setMeasHeaderCell = (colIdx, value) => {
    setMeasHeaders((h) => {
      const next = [...h];
      next[colIdx] = value;
      return next;
    });
  };

  const setMeasRowField = (rowIdx, field, value) => {
    setMeasRows((rows) => {
      const next = [...rows];
      next[rowIdx] = { ...next[rowIdx], [field]: value };
      return next;
    });
  };

  const setMeasSpecCell = (rowIdx, colIdx, value) => {
    setMeasRows((rows) => {
      const next = [...rows];
      const r = { ...next[rowIdx] };
      const spec = [...r.spec];
      spec[colIdx] = value;
      r.spec = spec;
      next[rowIdx] = r;
      return next;
    });
  };

  const setF = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setB = (key) => (_e, checked) => setForm((prev) => ({ ...prev, [key]: checked }));

  const handleSave = async () => {
    setSaving(true);
    setSaveErr(null);
    try {
      const body = {
        inspectionTNAProcMstId: existingId ?? null,
        inspAutoNo: form.inspAutoNo || null,
        receivedDate: form.receivedDate ? new Date(form.receivedDate).toISOString() : null,
        supplierContact: form.supplierContact || null,
        styleNo: form.styleNo || null,
        styleName: form.styleName || null,
        coo: form.coo || null,
        savedInSession: form.savedInSeason || null,
        sampleType: form.sampleType || null,
        reviewDate: form.reviewDate ? new Date(form.reviewDate).toISOString() : null,
        generalComments: form.generalComments || null,
        teMeasureToSpec: form.teMeasureToSpec,
        teFabricWeight: form.teFabricWeight,
        teComponents: form.teComponents,
        teGarmentFit: form.teGarmentFit,
        teFabricColorMatch: form.teFabricColorMatch,
        teEmbellishment: form.teEmbellishment,
        teFabricQuality: form.teFabricQuality,
        teConstruction: form.teConstruction,
        teLabeling: form.teLabeling,
        teFabricWashTest: form.teFabricWashTest,
        teSewingQuality: form.teSewingQuality,
        teComments: form.teComments || null,
        fdmrComments: form.fdmrComments || null,
        fabricStandardGsm: parseDec(form.fabricStandardGsm),
        actualWeightGsm: parseDec(form.actualWeightGsm),
        fabricApproved: Number(form.fabricApproved),
        constructionFitComments: form.constructionFitComments || null,
        embellishmentComments: form.embellishmentComments || null,
        asiGarmentRejected: form.asiGarmentRejected,
        asiProceedToSales: form.asiProceedToSales,
        asiProceedWithSales: form.asiProceedWithSales,
        asiProceedWithProd: form.asiProceedWithProd,
        asiGarmentApproved: form.asiGarmentApproved,
        fabricTestLines: buildFabricTestLinesPayload(fabricRows),
      };

      await qdApi.post(
        `/MasterOrderForQDSheet/inspection-process-entry/${encodeURIComponent(poid)}`,
        body,
        { params: { inspType } }
      );

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

  const ponoDisplay = master?.pono ?? master?.PONO ?? '';
  const pageTitleLeft = `${inspType} -`;

  if (!poid) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">Missing poid in URL.</Alert>
      </Container>
    );
  }

  const inputSx = {
    '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3, bgcolor: (t) => t.palette.grey[50] }}>
      <CustomBreadcrumbs
        heading="INSPECTION PROCESS ENTRY"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Master Order QD Sheet', href: paths.dashboard.masterOrderForQDSheet },
          { name: INSP_TYPE_SHORT[inspType] || 'Process Entry' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button
            component={RouterLink}
            to={paths.dashboard.masterOrderForQDSheet}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
          >
            Back
          </Button>
          <Chip label={`POID: ${poid}`} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
        </Stack>

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
            {INSP_TYPE_ORDER.map((t) => (
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
                {INSP_TYPE_SHORT[t]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Record Status chips removed per request */}
        </Stack>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {saveErr && (
        <Alert severity="error" onClose={() => setSaveErr(null)} sx={{ mb: 2 }}>
          {saveErr}
        </Alert>
      )}

      {!loading && !error && master && (
        <Stack spacing={2.5}>
          <LegacySectionCard
            title={
              <Stack direction="row" alignItems="baseline" flexWrap="wrap" columnGap={1} rowGap={0.5}>
                <Typography
                  component="span"
                  sx={{ fontSize: { xs: '1.05rem', sm: '1.35rem' }, fontWeight: 800, color: 'text.primary' }}
                >
                  {pageTitleLeft}
                </Typography>
                <Typography
                  component="span"
                  sx={{ fontSize: { xs: '1.05rem', sm: '1.35rem' }, fontWeight: 800, color: 'text.primary' }}
                >
                  SAMPLE INSPECTION INFORMATION -
                </Typography>
                <Typography
                  component="span"
                  sx={{ fontSize: { xs: '1.05rem', sm: '1.35rem' }, fontWeight: 800, color: 'primary.main' }}
                >
                  {ponoDisplay || `POID ${poid}`}
                </Typography>
              </Stack>
            }
          >
            <Grid container spacing={2}>
              <Grid xs={12} md={3}>
                <FieldLabel>Insp. Sample #</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={form.inspAutoNo}
                  onChange={setF('inspAutoNo')}
                  InputProps={{ readOnly: Boolean(String(form.inspAutoNo || '').trim()) }}
                  placeholder="Assigned from server / first save"
                  sx={inputSx}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Received Date</FieldLabel>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={form.receivedDate}
                  onChange={setF('receivedDate')}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Supplier/Contact</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={form.supplierContact}
                  onChange={setF('supplierContact')}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Style Number</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={form.styleNo}
                  onChange={setF('styleNo')}
                  placeholder={masterStyleNo || ''}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>COO</FieldLabel>
                <TextField fullWidth size="small" value={form.coo} onChange={setF('coo')} sx={inputSx} />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Style Name</FieldLabel>
                <TextField fullWidth size="small" value={form.styleName} onChange={setF('styleName')} sx={inputSx} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Saved in Season</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={form.savedInSeason}
                  onChange={setF('savedInSeason')}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Sample Type</FieldLabel>
                <TextField fullWidth size="small" value={form.sampleType} onChange={setF('sampleType')} sx={inputSx} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Review Date</FieldLabel>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={form.reviewDate}
                  onChange={setF('reviewDate')}
                  sx={inputSx}
                />
              </Grid>
            </Grid>
          </LegacySectionCard>

          <LegacySectionCard title="TESTING AND EVALUATION to be PERFORMED (check all that apply)">
            <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
              {TE_COLUMNS.map((col, ci) => (
                <Grid xs={12} md={4} key={ci}>
                  <Stack spacing={1}>
                    {col.map(({ key, label }) => (
                      <FormControlLabel
                        key={key}
                        sx={{ alignItems: 'flex-start', ml: 0, mr: 0 }}
                        control={<Checkbox checked={!!form[key]} onChange={setB(key)} size="small" sx={{ pt: 0.3 }} />}
                        label={
                          <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.35 }}>
                            {label}
                          </Typography>
                        }
                      />
                    ))}
                  </Stack>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2 }}>
              <FieldLabel>Comments</FieldLabel>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                value={form.teComments}
                onChange={setF('teComments')}
                sx={inputSx}
              />
            </Box>
          </LegacySectionCard>

          <LegacySectionCard title="FINISHED DIMENSION MEASUREMENT RESULTS">
            <Box sx={{ mb: 2 }}>
              <FieldLabel>Measurements That Do Not Meet Required Spec</FieldLabel>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                value={form.fdmrComments}
                onChange={setF('fdmrComments')}
                sx={inputSx}
              />
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }} alignItems="flex-end">
              <Grid xs={12} sm={8} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="qd-measurement-type-label">Type</InputLabel>
                  <Select
                    labelId="qd-measurement-type-label"
                    label="Type"
                    value={measTypeIdx < 0 ? '' : String(measTypeIdx)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMeasTypeIdx(v === '' ? -1 : Number(v));
                    }}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    {measurementTypesList.map((mt, idx) => (
                      <MenuItem key={idx} value={String(idx)}>
                        {mt.measurementType ?? mt.MeasurementType ?? ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={4} md={3}>
                <Button
                  variant="contained"
                  size="medium"
                  disabled={measSaving || measTypeIdx < 0 || measRows.length === 0}
                  onClick={handleSaveSpecs}
                  sx={{ fontWeight: 700 }}
                >
                  {measSaving ? 'Saving…' : 'Save Specs'}
                </Button>
              </Grid>
            </Grid>

            {measErr && (
              <Alert severity="error" sx={{ mb: 1 }} onClose={() => setMeasErr(null)}>
                {measErr}
              </Alert>
            )}

            {measLoading && (
              <Box sx={{ py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="caption">Loading measurement grid…</Typography>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Spec = PO quote (read-only); Act = inspection measurement (saved to INSPSizeSpecs). Headers match legacy
              txtSpecSizeH1–H12.
            </Typography>

            <Box sx={{ overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 0.5, maxWidth: '100%' }}>
              <Table size="small" sx={{ minWidth: 1100, '& thead th': { color: '#fff', fontWeight: 700, fontSize: 10 } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: MEASUREMENT_GRID_HEADER }}>
                    <TableCell rowSpan={2} align="center" sx={{ verticalAlign: 'middle' }}>
                      #
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ minWidth: 120 }}>
                      Point
                    </TableCell>
                    <TableCell rowSpan={2} align="center" sx={{ minWidth: 48 }}>
                      Tol
                    </TableCell>
                    <TableCell rowSpan={2} align="center" sx={{ minWidth: 36 }}>
                      U
                    </TableCell>
                    {Array.from({ length: SIZE_COUNT }, (_, i) => (
                      <TableCell key={`hdr-${i}`} colSpan={2} align="center" sx={{ p: 0.5 }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={measHeaders[i] ?? ''}
                          onChange={(e) => setMeasHeaderCell(i, e.target.value)}
                          placeholder={`H${i + 1}`}
                          sx={{
                            ...inputSx,
                            '& .MuiInputBase-input': { py: 0.5, fontSize: 10, color: 'common.white' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                          }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow sx={{ bgcolor: MEASUREMENT_GRID_HEADER }}>
                    {Array.from({ length: SIZE_COUNT }, (_, i) => (
                      <Fragment key={`sub-${i}`}>
                        <TableCell align="center" sx={{ fontSize: 9, py: 0.35 }}>
                          Spec
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: 9, py: 0.35 }}>
                          Act
                        </TableCell>
                      </Fragment>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {measRows.map((row, ri) => (
                    <TableRow key={`${row.measurementPointId}-${ri}`}>
                      <TableCell align="center" sx={{ fontSize: 11, fontWeight: 700 }}>
                        {ri + 1}
                      </TableCell>
                      <TableCell sx={{ p: 0.25 }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={row.measurementPoints}
                          onChange={(e) => setMeasRowField(ri, 'measurementPoints', e.target.value)}
                          sx={inputSx}
                        />
                      </TableCell>
                      <TableCell sx={{ p: 0.25, maxWidth: 64 }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={row.tolerance}
                          onChange={(e) => setMeasRowField(ri, 'tolerance', e.target.value)}
                          sx={inputSx}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: 10, p: 0.25 }}>
                        {row.measurements}
                      </TableCell>
                      {Array.from({ length: SIZE_COUNT }, (_, ci) => (
                        <Fragment key={`c-${ri}-${ci}`}>
                          <TableCell sx={{ bgcolor: '#ffff99', p: 0.25, minWidth: 48 }}>
                            <TextField
                              size="small"
                              fullWidth
                              value={row.tpl[ci] ?? ''}
                              InputProps={{ readOnly: true }}
                              sx={{ ...inputSx, '& input': { py: 0.4, fontSize: 10 } }}
                            />
                          </TableCell>
                          <TableCell sx={{ p: 0.25, minWidth: 48 }}>
                            <TextField
                              size="small"
                              fullWidth
                              value={row.spec[ci] ?? ''}
                              onChange={(e) => setMeasSpecCell(ri, ci, e.target.value)}
                              sx={{ ...inputSx, '& input': { py: 0.4, fontSize: 10 } }}
                            />
                          </TableCell>
                        </Fragment>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </LegacySectionCard>

          <LegacySectionCard title="FABRIC TESTING AND GARMENT FEEDBACK">
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: 0.5 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.200' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Fabric Tests</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, width: 120 }}>
                      Approved
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, width: 120 }}>
                      Rejected
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fabricRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ py: 0.5, verticalAlign: 'middle' }}>
                        <Autocomplete
                          freeSolo
                          size="small"
                          options={fabricFeedbackOpts}
                          value={row.fabricTest}
                          onChange={(_e, v) => setFabricCell(idx, 'fabricTest', v ?? '')}
                          onInputChange={(e, v) => {
                            setFabricCell(idx, 'fabricTest', v);
                            if (fabricFbTimerRef.current) clearTimeout(fabricFbTimerRef.current);
                            fabricFbTimerRef.current = setTimeout(() => fetchFabricFeedback(v), 280);
                          }}
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Fabric test" sx={inputSx} />
                          )}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                        <Radio
                          size="small"
                          checked={row.verdict === 'A'}
                          onChange={() =>
                            setFabricCell(idx, 'verdict', row.verdict === 'A' ? '' : 'A')
                          }
                          inputProps={{ 'aria-label': 'Approved', name: `fabric-row-${idx}` }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                        <Radio
                          size="small"
                          checked={row.verdict === 'R'}
                          onChange={() =>
                            setFabricCell(idx, 'verdict', row.verdict === 'R' ? '' : 'R')
                          }
                          inputProps={{ 'aria-label': 'Rejected', name: `fabric-row-${idx}` }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.5, verticalAlign: 'middle' }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={row.comments}
                          onChange={(e) => setFabricCell(idx, 'comments', e.target.value)}
                          sx={inputSx}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box
                sx={{
                  px: 2,
                  py: 0.75,
                  bgcolor: 'primary.dark',
                  color: 'primary.contrastText',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Page 1
              </Box>
            </TableContainer>

            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <FieldLabel>Fabric Standard GSM</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={form.fabricStandardGsm}
                  onChange={setF('fabricStandardGsm')}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <FieldLabel>Actual Weight GSM</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={form.actualWeightGsm}
                  onChange={setF('actualWeightGsm')}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12}>
                <FieldLabel>Fabric Approved?</FieldLabel>
                <RadioGroup
                  row
                  value={form.fabricApproved}
                  onChange={(e) => setForm((p) => ({ ...p, fabricApproved: e.target.value }))}
                >
                  <FormControlLabel value="1" control={<Radio size="small" />} label="YES" />
                  <FormControlLabel value="0" control={<Radio size="small" />} label="NO" />
                  <FormControlLabel value="2" control={<Radio size="small" />} label="—" />
                </RadioGroup>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <FieldLabel>Construction / Fit</FieldLabel>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                value={form.constructionFitComments}
                onChange={setF('constructionFitComments')}
                sx={inputSx}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <FieldLabel>Embellishment</FieldLabel>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                value={form.embellishmentComments}
                onChange={setF('embellishmentComments')}
                sx={inputSx}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <FieldLabel>General Comments</FieldLabel>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={3}
                value={form.generalComments}
                onChange={setF('generalComments')}
                sx={inputSx}
              />
            </Box>
          </LegacySectionCard>

          <LegacySectionCard title="APPROVAL AND SUPPLIER INSTRUCTIONS: MUST BE COMPLETE BEFORE SUBMITTING TO FACTORY">
            <Grid container spacing={1}>
              <Grid xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.asiGarmentRejected}
                      onChange={setB('asiGarmentRejected')}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }}>
                      Garment Rejected - Submit a corrected Fit Sample
                    </Typography>
                  }
                />
              </Grid>
              <Grid xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox checked={form.asiProceedToSales} onChange={setB('asiProceedToSales')} size="small" />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }}>
                      Proceed to Sales Samples with changes/corrections
                    </Typography>
                  }
                />
              </Grid>
              <Grid xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox checked={form.asiProceedWithSales} onChange={setB('asiProceedWithSales')} size="small" />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }}>
                      Proceed with Sales Samples
                    </Typography>
                  }
                />
              </Grid>
              <Grid xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox checked={form.asiProceedWithProd} onChange={setB('asiProceedWithProd')} size="small" />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }}>
                      Proceed with Production Quantities
                    </Typography>
                  }
                />
              </Grid>
              <Grid xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox checked={form.asiGarmentApproved} onChange={setB('asiGarmentApproved')} size="small" />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600 }}>
                      Garment approved - waiting for customer selection
                    </Typography>
                  }
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={saving}
                onClick={handleSave}
                size="large"
                sx={{ minWidth: 140 }}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                component={RouterLink}
                to={paths.dashboard.masterOrderForQDSheet}
                variant="contained"
                color="inherit"
                size="large"
                sx={{
                  minWidth: 140,
                  bgcolor: 'grey.700',
                  color: 'common.white',
                  '&:hover': { bgcolor: 'grey.800' },
                }}
              >
                Cancel
              </Button>
            </Stack>
          </LegacySectionCard>
        </Stack>
      )}

      {!loading && !error && !master && (
        <Alert severity="info">No inspection data found for POID: {poid}, Type: {inspType}</Alert>
      )}

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
