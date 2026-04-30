import { useEffect, useState, useCallback, useMemo } from 'react';
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
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

// ─── Constants (legacy InspectionProcessEntry.aspx InspType + short labels) ─

const INSP_TYPE_SHORT = {
  'Proto Fit': 'PF',
  Dyelot: 'DL',
  Strikeoff: 'SO',
  'PP Sample': 'PPS',
  'Size Set': 'SS',
};

/** Legacy InspectionProcessEntry.aspx — three columns, top-to-bottom per column.
 *  UI state: `teMeasureToSpec` … — bind with `checked={toBoolean(formData[key])}`.
 *  API / .NET: `tE_MeasureToSpec` … — mapped in `boolSaved` / `mergeApiRowForFormMapping`. */
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

function createEmptyDetailRow() {
  return { fabricTests: '', isApprove: null, fabricComments: '' };
}

/**
 * API / legacy fabric lines → detail rows.
 * `isApprove`: `true` = approved, `false` = rejected, `null` = pending / not set (API 2).
 */
function normalizeDetailsFromApi(rawList) {
  const lines = Array.isArray(rawList) ? rawList : [];
  if (lines.length === 0) return [createEmptyDetailRow()];
  return lines.map((line) => {
    const ia = line.isApprove ?? line.IsApprove;
    let isApprove = null;
    if (ia === true || ia === 1 || ia === '1') isApprove = true;
    else if (ia === false || ia === 0 || ia === '0') isApprove = false;
    else isApprove = null;
    return {
      ...line,
      fabricTests: line.fabricTests ?? line.FabricTests ?? line.fabricTest ?? '',
      fabricComments: line.fabricComments ?? line.FabricComments ?? line.comments ?? '',
      isApprove,
    };
  });
}

/** Calendar `yyyy-MM-dd` for `<TextField type="date" />` — avoids UTC shift from `toISOString()`. */
function calendarDateToInputString(v) {
  if (v == null || v === '') return '';
  const s = typeof v === 'string' ? v.trim() : String(v);
  const prefix = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (prefix) return prefix[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

/** For `<TextField type="date" />` — supports `yyyy-MM-dd` and ISO / .NET date strings. */
function dateFieldValue(v) {
  return calendarDateToInputString(v);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDateInputValue(v) {
  return calendarDateToInputString(v);
}

/** .NET / legacy JSON: `tE_MeasureToSpec` from UI key `teMeasureToSpec`. */
function teApiPropertyName(uiKey) {
  if (typeof uiKey !== 'string' || !uiKey.startsWith('te') || uiKey.length <= 2) return null;
  return `tE_${uiKey.slice(2)}`;
}

/** .NET JSON: `asI_GarmentRejected` from UI key `asiGarmentRejected`. */
function asiApiPropertyName(uiKey) {
  if (typeof uiKey !== 'string' || !uiKey.startsWith('asi') || uiKey.length <= 3) return null;
  return `asI_${uiKey.slice(3)}`;
}

/** MUI `checked`: strict boolean; null/undefined → false. */
function toBoolean(value) {
  if (value === true || value === 1 || value === '1') return true;
  if (value === false || value === 0 || value === '0') return false;
  if (value == null || value === '') return false;
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase();
    if (t === 'true' || t === 'yes' || t === 'y' || t === 'on') return true;
    if (t === 'false' || t === 'no' || t === 'n' || t === 'off') return false;
  }
  return false;
}

/**
 * Map API / saved row → checkbox boolean. Prefer `tE_*` / `asI_*` first so .NET defaults
 * on `te*` / `asi*` never hide the real flags from the backend.
 */
function boolSaved(row, camel, pascal) {
  if (!row || typeof row !== 'object') return false;
  const teKey = teApiPropertyName(camel);
  const asiKey = asiApiPropertyName(camel);
  const raw =
    (teKey ? row[teKey] : undefined) ??
    (asiKey ? row[asiKey] : undefined) ??
    row[camel] ??
    row[pascal];
  return toBoolean(raw);
}

/** Merge root-level `tE_*` / `asI_*` (flat JSON) onto master for form hydration. */
function mergeApiRowForFormMapping(outerResponse, innerMaster) {
  const base = innerMaster && typeof innerMaster === 'object' ? { ...innerMaster } : {};
  const root = outerResponse && typeof outerResponse === 'object' ? outerResponse : {};
  Object.keys(root).forEach((k) => {
    if (k.startsWith('tE_') || k.startsWith('asI_')) base[k] = root[k];
  });
  return base;
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
    teComments:
      saved.teComments ??
      saved.TeComments ??
      saved.tE_Comments ??
      saved.TE_Comments ??
      '',
    fdmrComments:
      saved.fdmrComments ??
      saved.FdmrComments ??
      saved.fdmR_Comments ??
      saved.FdmR_Comments ??
      '',
    fabricStandardGsm:
      (saved.fabricStandardGsm ??
        saved.FabricStandardGsm ??
        saved.fabricStandardGSM ??
        saved.FabricStandardGSM) != null
        ? String(
            saved.fabricStandardGsm ??
              saved.FabricStandardGsm ??
              saved.fabricStandardGSM ??
              saved.FabricStandardGSM
          )
        : '',
    actualWeightGsm:
      (saved.actualWeightGsm ??
        saved.ActualWeightGsm ??
        saved.actualWeightGSM ??
        saved.ActualWeightGSM) != null
        ? String(
            saved.actualWeightGsm ??
              saved.ActualWeightGsm ??
              saved.actualWeightGSM ??
              saved.ActualWeightGSM
          )
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

/** Strict booleans for Save: tick → true, blank → false; plus `tE_*` / `asI_*` for .NET model. */
function applyTeAsiBooleansForSave(fd) {
  const out = { ...(fd && typeof fd === 'object' ? fd : {}) };
  TE_COLUMNS.flat().forEach(({ key }) => {
    const v = toBoolean(out[key]);
    out[key] = v;
    const apiK = teApiPropertyName(key);
    if (apiK) out[apiK] = v;
  });
  const asiKeys = [
    'asiGarmentRejected',
    'asiProceedToSales',
    'asiProceedWithSales',
    'asiProceedWithProd',
    'asiGarmentApproved',
  ];
  asiKeys.forEach((key) => {
    const v = toBoolean(out[key]);
    out[key] = v;
    const apiK = asiApiPropertyName(key);
    if (apiK) out[apiK] = v;
  });
  out.tE_Comments = String(out.teComments ?? out.tE_Comments ?? '');
  out.fdmR_Comments = String(out.fdmrComments ?? out.fdmR_Comments ?? '');
  return out;
}

/** POST `/api/InspectionProcess/Save` — master spread + ISO dates + fabric detail rows. */
function buildInspectionProcessSavePayload(formData, detailsList, mstIdFallback) {
  const fd = applyTeAsiBooleansForSave(formData);
  const mstRaw =
    fd.inspectionTNAProcMstID ??
    fd.inspectionTNAProcMstId ??
    fd.InspectionTNAProcMstID ??
    mstIdFallback ??
    0;
  const mstNum = Number(mstRaw);
  const inspectionTNAProcMstID = Number.isFinite(mstNum) ? mstNum : 0;
  const list = Array.isArray(detailsList) ? detailsList : [];
  const details = list.map((item) => ({
    inspectionTNAProcDtlID:
      item?.inspectionTNAProcDtlID ??
      item?.inspectionTNAProcDtlId ??
      item?.InspectionTNAProcDtlID ??
      0,
    inspectionTNAProcMstID,
    fabricTests: item?.fabricTests ?? '',
    isApprove: item?.isApprove === true,
    fabricComments: item?.fabricComments ?? '',
  }));
  return {
    ...fd,
    receivedDate: fd.receivedDate ? new Date(fd.receivedDate).toISOString() : null,
    reviewDate: fd.reviewDate ? new Date(fd.reviewDate).toISOString() : null,
    details,
  };
}

// ─── Mock entry (no API) — set false when backend is wired ───────────────────

/** Set true only for local UI demo without backend. */
const USE_INSPECTION_PROCESS_ENTRY_MOCK = false;

function buildMockInspectionProcessEntry(poid, inspType) {
  const short = INSP_TYPE_SHORT[inspType] || 'PF';
  return {
    inspectionTNAProcMstId: 99901,
    master: {
      poid: Number(poid),
      POID: Number(poid),
      pono: `DEMO-${poid}`,
      PONO: `DEMO-${poid}`,
      styleNo: 'STYLE-DEMO-01',
      StyleNo: 'STYLE-DEMO-01',
    },
    savedRecord: {
      inspAutoNo: `${short}-DEMO-2024-0001`,
      receivedDate: '2024-09-15',
      supplierContact: 'Demo supplier contact',
      styleName: 'Demo garment',
      COO: 'Pakistan',
      savedInSession: 'SS25',
      sampleType: 'SMS',
      reviewDate: '2024-09-20',
      generalComments: 'Structure-only demo (API disabled).',
      fabricStandardGsm: '180',
      actualWeightGsm: '182',
      fabricApproved: 2,
      teMeasureToSpec: true,
      teGarmentFit: false,
    },
    suggestedInspAutoNo: `${short}-DEMO-2024-NEW`,
    measurementTypes: [
      {
        measurementTypeID: 101,
        MeasurementTypeID: 101,
        measurementType: 'Measurement set A (demo)',
        MeasurementType: 'Measurement set A (demo)',
      },
      {
        measurementTypeID: 102,
        MeasurementTypeID: 102,
        measurementType: 'Measurement set B (demo)',
        MeasurementType: 'Measurement set B (demo)',
      },
    ],
    fabricTestLines: [
      { fabricTests: 'Colour fastness to washing', isApprove: 2, fabricComments: '' },
      { fabricTests: 'Dimensional stability', isApprove: 2, fabricComments: 'Mock row' },
    ],
  };
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
 * Legacy AMS InspectionProcessEntry.aspx (sample inspection entry).
 * `inspType` comes from URL query (?inspType=Proto Fit). `USE_INSPECTION_PROCESS_ENTRY_MOCK` skips API (demo only).
 */
export default function QDInspectionProcessEntryView() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const poid = searchParams.get('poid');
  const inspType = searchParams.get('inspType') ?? 'Proto Fit';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(() => buildEmptyForm());
  const [detailsList, setDetailsList] = useState(() => [createEmptyDetailRow()]);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  /** Index into measurementTypesList; -1 = Select (legacy ddl first item). */
  const [measTypeIdx, setMeasTypeIdx] = useState(-1);

  const master = data?.master ?? data?.Master;
  const existingId = data?.inspectionTNAProcMstId ?? data?.InspectionTNAProcMstId ?? null;

  const masterStyleNo = master?.styleNo ?? master?.StyleNo ?? '';
  const measurementTypesList = data?.measurementTypes ?? data?.MeasurementTypes ?? [];

  const poidForGrid = useMemo(() => {
    const m = data?.master ?? data?.Master ?? {};
    return (
      poid ||
      (m?.poid != null ? String(m.poid) : '') ||
      (m?.POID != null ? String(m.POID) : '') ||
      (formData?.poid != null ? String(formData.poid) : '') ||
      (formData?.POID != null ? String(formData.POID) : '') ||
      ''
    );
  }, [poid, data, formData?.poid, formData?.POID]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (editId) {
        const { data: res } = await qdApi.get(`/InspectionProcess/GetEditData/${encodeURIComponent(editId)}`);
        const masterRes = res?.master ?? res?.Master ?? {};
        const rowForForm = mergeApiRowForFormMapping(res, masterRes);
        const details = res?.details ?? res?.Details ?? [];
        const mstId =
          masterRes.inspectionTNAProcMstId ??
          masterRes.InspectionTNAProcMstID ??
          masterRes.InspectionTNAProcMstId ??
          Number(editId);
        setData({
          master: masterRes,
          Master: masterRes,
          measurementTypes:
            res?.measurementTypes ??
            res?.MeasurementTypes ??
            masterRes.measurementTypes ??
            masterRes.MeasurementTypes ??
            [],
          inspectionTNAProcMstId: mstId,
          InspectionTNAProcMstId: mstId,
          savedRecord: null,
          suggestedInspAutoNo: res?.suggestedInspAutoNo ?? res?.SuggestedInspAutoNo,
        });
        const sn = rowForForm.styleNo ?? rowForForm.StyleNo ?? masterRes.styleNo ?? masterRes.StyleNo ?? '';
        const mergedMaster = { ...masterRes, ...buildFormFromSaved(rowForForm, sn) };
        setFormData(mergedMaster);
        setDetailsList(normalizeDetailsFromApi(details));
        return;
      }

      if (!poid || !inspType) {
        setError('Missing id or (poid and inspType) in URL.');
        setData(null);
        return;
      }

      if (USE_INSPECTION_PROCESS_ENTRY_MOCK) {
        setData(buildMockInspectionProcessEntry(poid, inspType));
        return;
      }
      const { data: res } = await qdApi.get(
        `/MasterOrderForQDSheet/inspection-process-entry/${encodeURIComponent(poid)}`,
        { params: { inspType } }
      );
      setData(res);
    } catch (e) {
      setData(null);
      setError(
        typeof e?.response?.data === 'string'
          ? e.response.data
          : e?.response?.data?.message ||
              e?.response?.data?.title ||
              e?.message ||
              'Failed to load inspection process entry'
      );
    } finally {
      setLoading(false);
    }
  }, [editId, poid, inspType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!data) return;
    if (editId) return;
    const m = data?.master ?? data?.Master;
    const s = data?.savedRecord ?? data?.SavedRecord;
    const record = mergeApiRowForFormMapping(data, s || m);
    const sn = record?.styleNo ?? record?.StyleNo ?? '';
    const next = buildFormFromSaved(record, sn);
    const suggested = data?.suggestedInspAutoNo ?? data?.SuggestedInspAutoNo;
    if (!s && suggested) next.inspAutoNo = suggested;
    setFormData(next);
    const lines = data.fabricTestLines ?? data.FabricTestLines ?? [];
    setDetailsList(normalizeDetailsFromApi(lines));
  }, [data, editId]);

  useEffect(() => {
    setMeasTypeIdx(-1);
  }, [poid, inspType, editId]);

  /** Inspection entry payload often omits `measurementTypes`; same list as QD inspection sheet. */
  useEffect(() => {
    let cancelled = false;
    if (USE_INSPECTION_PROCESS_ENTRY_MOCK) {
      return () => {};
    }
    if (!data || !poidForGrid) {
      return () => {};
    }
    const existing = data.measurementTypes ?? data.MeasurementTypes ?? [];
    if (existing.length > 0) {
      return () => {};
    }
    (async () => {
      try {
        const { data: mt } = await qdApi.get(
          `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poidForGrid)}/measurement-types`
        );
        const list = Array.isArray(mt) ? mt : [];
        if (cancelled || list.length === 0) return;
        setData((prev) =>
          prev ? { ...prev, measurementTypes: list, MeasurementTypes: list } : prev
        );
      } catch {
        /* leave empty if endpoint fails */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, poidForGrid]);

  const updateDetailRow = useCallback((index, patch) => {
    setDetailsList((list) => {
      const next = [...list];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const handleAddFabricRow = () => {
    setDetailsList((rows) => [...rows, createEmptyDetailRow()]);
  };

  const setF = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));
  const setB = (key) => (_e, checked) =>
    setFormData((prev) => ({ ...prev, [key]: Boolean(checked) }));

  const handleSave = async () => {
    setSaving(true);
    setSaveErr(null);
    try {
      if (USE_INSPECTION_PROCESS_ENTRY_MOCK) {
        setSnackMsg('Save (demo — API off). Form values not sent to server.');
        setSnackOpen(true);
        return;
      }

      const mstFallback =
        existingId ??
        data?.inspectionTNAProcMstId ??
        data?.InspectionTNAProcMstId ??
        data?.InspectionTNAProcMstID ??
        null;
      const payload = buildInspectionProcessSavePayload(formData, detailsList, mstFallback);
      // eslint-disable-next-line no-console -- debug: full Save body
      console.log('[InspectionProcess/Save] payload', payload);

      await qdApi.post('/InspectionProcess/Save', payload);

      await loadData();
      setSnackMsg('Record saved successfully.');
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

  if (!editId && !poid) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">Missing id or poid in URL. Open this page from Sample Inspection Report (with id) or Master Order.</Alert>
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

      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 3 }}>
        <Button
          component={RouterLink}
          to={paths.dashboard.masterOrderForQDSheet}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          size="small"
        >
          Back
        </Button>
        <Chip
          label={`POID: ${poidForGrid || '—'}`}
          variant="outlined"
          size="small"
          sx={{ fontWeight: 600 }}
        />
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

      {!loading && !error && data && (
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
                  {ponoDisplay || `POID ${poidForGrid || poid || '—'}`}
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
                  value={formData.inspAutoNo}
                  onChange={setF('inspAutoNo')}
                  InputProps={{ readOnly: Boolean(String(formData.inspAutoNo || '').trim()) }}
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
                  value={dateFieldValue(formData?.receivedDate)}
                  onChange={setF('receivedDate')}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Supplier/Contact</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.supplierContact}
                  onChange={setF('supplierContact')}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Style Number</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.styleNo}
                  onChange={setF('styleNo')}
                  placeholder={masterStyleNo || ''}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>COO</FieldLabel>
                <TextField fullWidth size="small" value={formData.coo} onChange={setF('coo')} sx={inputSx} />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Style Name</FieldLabel>
                <TextField fullWidth size="small" value={formData.styleName} onChange={setF('styleName')} sx={inputSx} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Saved in Season</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.savedInSeason}
                  onChange={setF('savedInSeason')}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Sample Type</FieldLabel>
                <TextField fullWidth size="small" value={formData.sampleType} onChange={setF('sampleType')} sx={inputSx} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FieldLabel>Review Date</FieldLabel>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={dateFieldValue(formData?.reviewDate)}
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
                        control={
                          <Checkbox
                            name={key}
                            checked={toBoolean(formData?.[key])}
                            onChange={setB(key)}
                            size="small"
                            sx={{ pt: 0.3 }}
                          />
                        }
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
                value={formData?.teComments ?? ''}
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
                value={formData?.fdmrComments ?? ''}
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
                      <MenuItem
                        key={mt.measurementTypeID ?? mt.MeasurementTypeID ?? idx}
                        value={String(idx)}
                      >
                        {mt.measurementType ?? mt.MeasurementType ?? ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </LegacySectionCard>

          <LegacySectionCard title="FABRIC TESTING AND GARMENT FEEDBACK">
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddFabricRow}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Add row
              </Button>
            </Stack>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: 0.5 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.200' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Fabric Tests</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, width: 100 }}>
                      Approved
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, width: 100 }}>
                      Rejected
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detailsList ?? []).map((item, index) => (
                    <TableRow key={item?.fabricTestLineId ?? item?.FabricTestLineId ?? item?.id ?? index}>
                      <TableCell sx={{ py: 0.5, verticalAlign: 'middle' }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={item?.fabricTests ?? ''}
                          onChange={(e) => updateDetailRow(index, { fabricTests: e.target.value })}
                          placeholder="Fabric test"
                          sx={inputSx}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                        <Checkbox
                          size="small"
                          checked={item?.isApprove === true}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setDetailsList((list) => {
                              const updated = [...list];
                              updated[index] = {
                                ...updated[index],
                                isApprove: on ? true : null,
                              };
                              return updated;
                            });
                          }}
                          inputProps={{ 'aria-label': 'Approved', name: `fabric-approve-${index}` }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                        <Checkbox
                          size="small"
                          checked={item?.isApprove === false}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setDetailsList((list) => {
                              const updated = [...list];
                              updated[index] = {
                                ...updated[index],
                                isApprove: on ? false : null,
                              };
                              return updated;
                            });
                          }}
                          inputProps={{ 'aria-label': 'Rejected', name: `fabric-reject-${index}` }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.5, verticalAlign: 'middle' }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={item?.fabricComments ?? ''}
                          onChange={(e) => updateDetailRow(index, { fabricComments: e.target.value })}
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
                  value={formData?.fabricStandardGsm ?? ''}
                  onChange={setF('fabricStandardGsm')}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <FieldLabel>Actual Weight GSM</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={formData?.actualWeightGsm ?? ''}
                  onChange={setF('actualWeightGsm')}
                  sx={inputSx}
                />
              </Grid>
              <Grid xs={12}>
                <FieldLabel>Fabric Approved?</FieldLabel>
                <RadioGroup
                  row
                  value={String(formData?.fabricApproved ?? '2')}
                  onChange={(e) => setFormData((p) => ({ ...p, fabricApproved: e.target.value }))}
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
                value={formData.constructionFitComments}
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
                value={formData.embellishmentComments}
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
                value={formData.generalComments}
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
                      checked={toBoolean(formData?.asiGarmentRejected)}
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
                    <Checkbox
                      checked={toBoolean(formData?.asiProceedToSales)}
                      onChange={setB('asiProceedToSales')}
                      size="small"
                    />
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
                    <Checkbox
                      checked={toBoolean(formData?.asiProceedWithSales)}
                      onChange={setB('asiProceedWithSales')}
                      size="small"
                    />
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
                    <Checkbox
                      checked={toBoolean(formData?.asiProceedWithProd)}
                      onChange={setB('asiProceedWithProd')}
                      size="small"
                    />
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
                    <Checkbox
                      checked={toBoolean(formData?.asiGarmentApproved)}
                      onChange={setB('asiGarmentApproved')}
                      size="small"
                    />
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

      {!loading && !error && !data && (
        <Alert severity="info">No inspection data found for POID: {poidForGrid || poid || '—'}, Type: {inspType}</Alert>
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
