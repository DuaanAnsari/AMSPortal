import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Unstable_Grid2';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { alpha, useTheme } from '@mui/material/styles';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

const getSectionHeaderSx = (theme) => ({
  px: 2,
  py: 1.5,
  bgcolor: alpha(theme.palette.primary.main, 0.12),
  color: theme.palette.text.primary,
  fontWeight: 700,
  fontSize: '1.1rem',
  borderBottom: `1px solid ${theme.palette.divider}`,
});

const OK_NOT_OK = ['OK', 'Not OK'];
const YES_NO = ['Yes', 'No'];
const CHECKED = ['Checked', 'Not Checked'];
const CONFORM = ['Conform', 'Not Conform'];
/** Legacy QualityDepartmentPopup: Side Seam / C/B */
const SIDE_SEAM_CB = ['Side Seam', 'C/B'];
/** Legacy Packing dropdowns */
const CARTON_MARKING_SIDES = ['1 Side', '2 Sides', '4 Sides'];
const CARTON_THICKNESS_PLY = ['03 ply', '05 ply', '07 ply'];
const FOLD_METHOD = ['B-Fold', 'Shirt Fold', 'Other Folds'];
const RELIABILITY = [
  { value: 'I', label: 'I' },
  { value: 'II', label: 'II' },
  { value: 'III', label: 'III' },
  { value: 'IV', label: 'IV' },
];
/**
 * Legacy cmbCriticalAQL / cmbMajorAQL / cmbMinorAQL — Value + display Text (QualityDepartmentPopup.aspx).
 */
const AQL_LEVEL_MENU_ITEMS = [
  { value: 'Select', label: 'Select' },
  { value: '0.0', label: '0' },
  { value: '1.5', label: '1.5' },
  { value: '2.5', label: '2.5' },
  { value: '4.0', label: '4.0' },
  { value: '6.5', label: '6.5' },
  { value: '10.0', label: '10' },
];

const AQL_VALUE_SET = new Set(AQL_LEVEL_MENU_ITEMS.map((x) => x.value));

/** Map DB / API number to legacy dropdown value (0.0, 10.0, …). */
function formatAqlMenuValue(v) {
  if (v == null || v === '') return 'Select';
  const n = Number(v);
  if (!Number.isFinite(n)) return 'Select';
  if (n === 0) return '0.0';
  if (Math.abs(n - 10) < 1e-9) return '10.0';
  const fixed = [1.5, 2.5, 4, 4.0, 6.5].find((x) => Math.abs(x - n) < 1e-9);
  if (fixed != null) {
    if (fixed === 4 || fixed === 4.0) return '4.0';
    return String(fixed);
  }
  return 'Select';
}

function normalizeAqlFieldValue(raw) {
  if (raw == null || raw === '') return 'Select';
  const s = String(raw);
  if (AQL_VALUE_SET.has(s)) return s;
  return formatAqlMenuValue(raw);
}
const SIZE_BREAK_COLS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', 'Total'];
const DISCREPANCY_ROWS = 18;
const FUNDAMENTAL_IMAGE_SLOTS = [
  'Carton Stacking',
  'Carton Marking',
  'Unpacked Images',
  'Main Label Front Images',
  'Main Label Back Images',
  'Content Label Images',
  'Care Label Images',
];
const COMPLIMENTARY_IMAGE_SLOTS = [
  'Barcode Scanning',
  'Carton Open View Images',
  'Addition Label Images',
  'HangTag Images',
  'Major Defect Images',
  'Minor Defect Images',
  'Inner Label Image',
];

function field(obj, ...keys) {
  if (!obj) return '';
  const match = keys.find((k) => obj[k] != null && obj[k] !== '');
  return match ? obj[match] : '';
}

function toDateInput(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function numOrEmpty(v) {
  if (v == null || v === '') return '';
  return String(v);
}

function parseOptionalDecimal(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseOptionalLong(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseAqlDecimal(v) {
  if (v == null || v === '' || v === 'Select') return null;
  return parseOptionalDecimal(v);
}

/**
 * Mirrors legacy Accessories Markings section order and per-field dropdown lists (QualityDepartmentPopup.aspx).
 * dropKey: accDrop field when it differs from checkbox key (e.g. Fold Method select).
 */
const ACCESSORY_UI_ROWS = [
  { accKey: 'dyeLot', label: 'Dye Lot', options: CHECKED },
  { accKey: 'zipper', label: 'Zipper', options: YES_NO },
  { accKey: 'pattern', label: 'Pattern', options: CHECKED },
  { accKey: 'drawingString', label: 'Drawing String', options: YES_NO },
  { accKey: 'generalAppearance', label: 'General Appearance', options: CONFORM },
  { accKey: 'hangTag', label: 'Hangtag', options: YES_NO },
  { accKey: 'mainLabel', label: 'Main Label', textMode: true, textKey: 'mainLabel' },
  { accKey: 'mainLabelPlacement', label: 'Main Label Placement', options: SIDE_SEAM_CB },
  { accKey: 'priceTicket', label: 'Price Ticket', options: YES_NO },
  { accKey: 'careLabelPlacement', label: 'Care Label Placement', options: SIDE_SEAM_CB },
  { accKey: 'careLabel', label: 'Care Label', textMode: true, textKey: 'careLabel' },
  { accKey: 'contentLabelPlacement', label: 'Content Label Placement', options: SIDE_SEAM_CB },
  { accKey: 'contentLabel', label: 'Content Label', textMode: true, textKey: 'contentLabel' },
  { accKey: 'hanger', label: 'Hanger', options: YES_NO },
  { accKey: 'foldMethod', label: 'Fold Method', options: FOLD_METHOD, dropKey: 'foldMethodDdl' },
  { accKey: 'button', label: 'Buttons', options: YES_NO },
  { accKey: 'interlining', label: 'Inner Lining', textMode: true, textKey: 'interlining' },
  { accKey: 'additionalLabel', label: 'Additional Label', options: YES_NO },
];

const DEFAULT_ACC_DROP = {
  dyeLot: 'Checked',
  zipper: 'Yes',
  pattern: 'Checked',
  drawingString: 'Yes',
  generalAppearance: 'Conform',
  hangTag: 'Yes',
  mainLabelPlacement: 'Side Seam',
  careLabelPlacement: 'Side Seam',
  contentLabelPlacement: 'Side Seam',
  hanger: 'Yes',
  foldMethodDdl: 'B-Fold',
  priceTicket: 'Yes',
  button: 'Yes',
  additionalLabel: 'Yes',
};

function buildQdSavePayload(form, discRows, mstId, isMainSave) {
  const acc = form.acc || {};
  const accDrop = form.accDrop || {};
  const accText = form.accText || {};
  const pack = form.pack || {};
  const packDrop = form.packDrop || {};
  const packText = form.packText || {};
  const idNum = mstId != null && mstId !== '' ? Number(mstId) : 0;
  return {
    qdInspectionMstId: idNum > 0 ? idNum : null,
    useLegacyDraftBits: true,
    isMainSave,
    mstInspectionDate: form.inspectionDate ? new Date(form.inspectionDate).toISOString() : null,
    inspNo: form.inspNo || null,
    aqlSysytemId: parseOptionalLong(form.aqlSystemId),
    aqlRangeId: parseOptionalLong(form.aqlRangeId),
    shipmentMode: form.shipmentMode ?? '0',
    shipmentQty: parseOptionalDecimal(form.offeredQty),
    cartonQty: parseOptionalDecimal(form.requiredCtnQty),
    cartonNo: form.selectedCartons || null,
    inspCartonQty: parseOptionalDecimal(form.offeredCtnQty),
    factoryName: form.factory || null,
    sampleSize: parseOptionalDecimal(form.sampleSize),
    critical: parseOptionalDecimal(form.criticalQty),
    minor: parseOptionalDecimal(form.minQty),
    major: parseOptionalDecimal(form.majQty),
    reliability: form.reliability || 'II',
    criticalAql: parseAqlDecimal(form.critAql),
    majorAql: parseAqlDecimal(form.majAql),
    minorAql: parseAqlDecimal(form.minAql),
    criticalAllowed: parseOptionalDecimal(form.allowCrit),
    minorAllowed: parseOptionalDecimal(form.allowMin),
    majorAllowed: parseOptionalDecimal(form.allowMaj),
    quantity_D: form.qtyD || null,
    conformity_D: form.confD || null,
    workmanship_D: form.workD || null,
    packing_D: form.packD || null,
    marking_D: form.markD || null,
    measurement_D: form.measD || null,
    quantity_D_Remarks: form.qtyDR || null,
    conformity_D_Remarks: form.confDR || null,
    workmanship_D_Remarks: form.workDR || null,
    packing_D_Remarks: form.packDR || null,
    marking_D_Remarks: form.markDR || null,
    measurement_D_Remarks: form.measDR || null,
    passFail: form.passFail === '1',
    colorway: form.color || null,
    ratio: form.ratio || null,
    qaRemarks: form.qaRemarks || null,
    dyeLot: !!acc.dyeLot,
    pattern: !!acc.pattern,
    generalAppearance: !!acc.generalAppearance,
    mainLabel: !!acc.mainLabel,
    mainLabelPlacement: !!acc.mainLabelPlacement,
    careLabel: !!acc.careLabel,
    careLabelPlacement: !!acc.careLabelPlacement,
    contentLabel: !!acc.contentLabel,
    contentLabelPlacement: !!acc.contentLabelPlacement,
    buttonAccessory: !!acc.button,
    interlining: !!acc.interlining,
    zipper: !!acc.zipper,
    drawingString: !!acc.drawingString,
    hangTag: !!acc.hangTag,
    priceTicket: !!acc.priceTicket,
    cartonDimen: !!pack.cartonDimen,
    cartonMarking: !!pack.cartonMarking,
    cartonThickness: !!pack.cartonThickness,
    netWT: !!pack.netWt,
    grossWT: !!pack.grossWt,
    hanger: !!acc.hanger,
    hangerSticker: false,
    noOfPcsInnerPack: false,
    noOfPcsCarton: false,
    foldMethod: !!acc.foldMethod,
    polyBag: false,
    cartonSticker: false,
    ups: false,
    otherBit: false,
    otherCom1: null,
    otherCom2: null,
    otherBitM: false,
    otherCom1M: null,
    otherCom2M: null,
    additionalLbl: !!acc.additionalLabel,
    additionalLblComm: accDrop.additionalLabel || null,
    dyeLotCom: accDrop.dyeLot || null,
    zipperCom: accDrop.zipper || null,
    cartonDimmCom: packText.cartonDimen || null,
    patternCom: accDrop.pattern || null,
    drawingStrCom: accDrop.drawingString || null,
    grossWTCom: packText.grossWt || null,
    generalAppCom: accDrop.generalAppearance || null,
    hangtagCom: accDrop.hangTag || null,
    netWTCom: packText.netWt || null,
    mainLblCom: accText.mainLabel || null,
    priceTicketCom: accDrop.priceTicket || null,
    crtnThicknessCom: packDrop.cartonThickness || null,
    mainLblPlacementCom: accDrop.mainLabelPlacement || null,
    hangerCom: accDrop.hanger || null,
    crtnStickerCom: null,
    careLblCom: accText.careLabel || null,
    hangerStickerSizerCom: null,
    uPCCom: null,
    careLblPlacementCom: accDrop.careLabelPlacement || null,
    noOfPcsInnerPackCom: null,
    contentLblCom: accText.contentLabel || null,
    noOfPcsCrtnCom: null,
    contentLblPlacementCom: accDrop.contentLabelPlacement || null,
    foldMethodCom: accDrop.foldMethodDdl || null,
    buttonsCom: accDrop.button || null,
    polyBagBlisterBagCom: null,
    interLiningCom: accText.interlining || null,
    cartonMarkingCom: packDrop.cartonMarking || null,
    discrepancies: discRows.map((r) => ({
      qdInsDiscrepanicesDtlId: null,
      discrepancy: r.discrepancy || '',
      remarks: r.remarks || '',
      critical: parseOptionalDecimal(r.critical),
      major: parseOptionalDecimal(r.major),
      minor: parseOptionalDecimal(r.minor),
    })),
  };
}

function SectionCard({ title, children, subtitle }) {
  const theme = useTheme();
  return (
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={getSectionHeaderSx(theme)}>{title}</Box>
      {subtitle ? (
        <Box sx={{ px: 2, pt: 1, pb: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      ) : null}
      <Box sx={{ p: 2 }}>{children}</Box>
    </Card>
  );
}

function ImageUploadBox({ title, images = [], onUpload, onDelete, getImageUrl }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Box
        sx={{
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          minHeight: 120,
          bgcolor: 'action.hover',
          mb: 1,
          p: 1,
        }}
      >
        {images.length === 0 ? (
          <Typography variant="caption" color="text.secondary" align="center">
            No images uploaded
          </Typography>
        ) : (
          <Stack spacing={0.5} sx={{ width: '100%' }}>
            {images.map((img) => {
              const id = img.digitalID ?? img.DigitalID;
              const name = img.photoName ?? img.PhotoName ?? `Image ${id}`;
              return (
                <Stack key={id} direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                  <Button size="small" onClick={() => window.open(getImageUrl(id), '_blank')}>
                    {name}
                  </Button>
                  <IconButton size="small" color="error" onClick={() => onDelete(id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button size="small" variant="contained" component="label">
          Upload
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
        </Button>
      </Stack>
    </Paper>
  );
}

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  subtitle: PropTypes.string,
};

SectionCard.defaultProps = {
  subtitle: null,
};

ImageUploadBox.propTypes = {
  title: PropTypes.string.isRequired,
  images: PropTypes.arrayOf(PropTypes.object),
  onUpload: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getImageUrl: PropTypes.func.isRequired,
};

ImageUploadBox.defaultProps = {
  images: [],
};

/**
 * Mirrors AMS2 BusinessProcess/QualityDepartmentPopup.aspx (IPC / MPC / Pre-Final / Final).
 * Master + discrepancy lines persist via POST; uploads / measurement specs grid remain pending.
 */
export default function QualityDepartmentInspectionView() {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const poid = searchParams.get('poid');
  const inspType = searchParams.get('inspType') ?? '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({});
  const [discRows, setDiscRows] = useState(() =>
    Array.from({ length: DISCREPANCY_ROWS }, (_, i) => ({
      id: i,
      discrepancy: '',
      remarks: '',
      critical: '',
      major: '',
      minor: '',
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [saveErr, setSaveErr] = useState(null);
  const [lineRows, setLineRows] = useState([]);
  const [measurementTypes, setMeasurementTypes] = useState([]);
  const [measurementTypeId, setMeasurementTypeId] = useState('');
  const [specRows, setSpecRows] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [imageMap, setImageMap] = useState({});

  useEffect(() => {
    if (!poid || !inspType) {
      setLoading(false);
      setError('Missing poid or inspType in URL.');
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res } = await qdApi.get(
          `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}`,
          { params: { inspType } }
        );
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) {
          setError(
            typeof e?.response?.data === 'string'
              ? e.response.data
              : e?.message || 'Failed to load inspection'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [poid, inspType]);

  const h = data?.header ?? data?.Header;
  const poLines = data?.poLines ?? data?.PoLines ?? [];
  const aqlSystems = data?.aqlSystems ?? data?.AqlSystems ?? [];
  const aqlRanges = useMemo(() => data?.aqlRanges ?? data?.AqlRanges ?? [], [data]);
  const bindDef = data?.bindGridDefaults ?? data?.BindGridDefaults;
  const mstId = data?.qdInspectionMstId ?? data?.QdInspectionMstId;
  const snap = data?.savedInspection ?? data?.SavedInspection;

  const firstSystemId = aqlSystems[0]?.aqlSysytemId ?? aqlSystems[0]?.AQLSysytemId;
  const rangesForFirstSystem = useMemo(() => {
    if (firstSystemId == null) return [];
    return aqlRanges.filter((r) => (r.aqlSysytemId ?? r.AQLSysytemId) === firstSystemId);
  }, [aqlRanges, firstSystemId]);

  const defaultRangeLabel = useMemo(() => {
    const idx = bindDef?.defaultRangeIndex ?? bindDef?.DefaultRangeIndex ?? 0;
    const row = rangesForFirstSystem[idx];
    return row?.aqlRange ?? row?.AQLRange ?? '';
  }, [bindDef, rangesForFirstSystem]);

  useEffect(() => {
    if (!data || !h) return;
    const orderQty = h.orderQty ?? h.OrderQty;
    const shipIdx = bindDef?.shipmentModeDropdownIndex ?? bindDef?.ShipmentModeDropdownIndex;
    const defSample = bindDef?.defaultSampleSize ?? bindDef?.DefaultSampleSize;
    const defRangeIdx = bindDef?.defaultRangeIndex ?? bindDef?.DefaultRangeIndex ?? 0;

    const passFailValue = snap == null || !(snap.passFail === false || snap.PassFail === false) ? '1' : '0';

    setForm({
      inspNo: field(snap, 'inspNo', 'InspNo'),
      shipmentDate: field(h, 'shipmentdatee', 'shipmentdatee'),
      poQtyLabel: `${field(h, 'poQty', 'pOQty', 'POQty')} / ${field(h, 'orderQty', 'OrderQty')}`,
      aqlSystemId: snap?.aqlSysytemId ?? snap?.AQLSysytemId ?? firstSystemId ?? '',
      inspectionDate: toDateInput(snap?.mstInspectionDate ?? snap?.MstInspectionDate),
      offeredQty: numOrEmpty(snap?.shipmentQty ?? snap?.ShipmentQty ?? orderQty),
      aqlRangeId:
        snap?.aqlRangeId ??
        snap?.AQLRangeId ??
        (rangesForFirstSystem[defRangeIdx]?.aqlRangeId ?? rangesForFirstSystem[defRangeIdx]?.AQLRangeId) ??
        '',
      customer: field(h, 'customerName', 'CustomerName'),
      supplier: field(h, 'venderName', 'VenderName'),
      factory: field(snap, 'factoryName', 'FactoryName'),
      requiredCtnQty: numOrEmpty(
        snap?.cartonQty ?? snap?.CartonQty ?? bindDef?.requiredCartonQty ?? bindDef?.RequiredCartonQty
      ),
      styleNo: field(h, 'styleNo', 'styleNo'),
      selectedCartons: field(snap, 'cartonNo', 'CartonNo'),
      season: field(h, 'season', 'Season'),
      ratio: field(snap, 'ratio', 'Ratio') || field(h, 'ration', 'Ration'),
      offeredCtnQty: numOrEmpty(snap?.inspCartonQty ?? snap?.InspCartonQty),
      gsm: field(h, 'gms', 'gMS', 'GMS'),
      color: field(snap, 'colorway', 'Colorway') || field(h, 'colorway', 'Colorway'),
      design: field(h, 'design', 'Design'),
      shipmentMode: shipIdx === 1 ? '1' : '0',
      qtyD: field(snap, 'quantity_D', 'Quantity_D') || OK_NOT_OK[0],
      confD: field(snap, 'conformity_D', 'Conformity_D') || OK_NOT_OK[0],
      workD: field(snap, 'workmanship_D', 'Workmanship_D') || OK_NOT_OK[0],
      packD: field(snap, 'packing_D', 'Packing_D') || OK_NOT_OK[0],
      markD: field(snap, 'marking_D', 'Marking_D') || OK_NOT_OK[0],
      measD: field(snap, 'measurement_D', 'Measurement_D') || OK_NOT_OK[0],
      qtyDR: field(snap, 'quantity_D_Remarks', 'Quantity_D_Remarks'),
      confDR: field(snap, 'conformity_D_Remarks', 'Conformity_D_Remarks'),
      workDR: field(snap, 'workmanship_D_Remarks', 'Workmanship_D_Remarks'),
      packDR: field(snap, 'packing_D_Remarks', 'Packing_D_Remarks'),
      markDR: field(snap, 'marking_D_Remarks', 'Marking_D_Remarks'),
      measDR: field(snap, 'measurement_D_Remarks', 'Measurement_D_Remarks'),
      qaRemarks: field(snap, 'qaRemarks', 'QARemarks'),
      passFail: passFailValue,
      calPerc: '',
      sampleSize: numOrEmpty(snap?.sampleSize ?? snap?.SampleSize ?? defSample),
      criticalQty: numOrEmpty(snap?.critical ?? snap?.Critical),
      majQty: numOrEmpty(snap?.major ?? snap?.Major),
      minQty: numOrEmpty(snap?.minor ?? snap?.Minor),
      reliability: field(snap, 'reliability', 'Reliability') || 'II',
      critAql: normalizeAqlFieldValue(snap?.criticalAQL ?? snap?.CriticalAQL ?? '0.0'),
      majAql: normalizeAqlFieldValue(snap?.majorAQL ?? snap?.MajorAQL ?? '2.5'),
      minAql: normalizeAqlFieldValue(snap?.minorAQL ?? snap?.MinorAQL ?? '4.0'),
      allowCrit: numOrEmpty(snap?.criticalAllowed ?? snap?.CriticalAllowed),
      allowMaj: numOrEmpty(snap?.majorAllowed ?? snap?.MajorAllowed),
      allowMin: numOrEmpty(snap?.minorAllowed ?? snap?.MinorAllowed),
      acc: {
        dyeLot: !!(snap?.dyeLot ?? snap?.DyeLot),
        pattern: !!(snap?.pattern ?? snap?.Pattern),
        generalAppearance: !!(snap?.generalAppearance ?? snap?.GeneralAppearance),
        mainLabel: !!(snap?.mainLabel ?? snap?.MainLabel),
        mainLabelPlacement: !!(snap?.mainLabelPlacement ?? snap?.MainLabelPlacement),
        careLabel: !!(snap?.careLabel ?? snap?.CareLabel),
        careLabelPlacement: !!(snap?.careLabelPlacement ?? snap?.CareLabelPlacement),
        contentLabel: !!(snap?.contentLabel ?? snap?.ContentLabel),
        contentLabelPlacement: !!(snap?.contentLabelPlacement ?? snap?.ContentLabelPlacement),
        zipper: !!(snap?.zipper ?? snap?.Zipper),
        drawingString: !!(snap?.drawingString ?? snap?.DrawingString),
        hangTag: !!(snap?.hangTag ?? snap?.HangTag),
        button: !!(snap?.buttonAccessory ?? snap?.ButtonAccessory),
        interlining: !!(snap?.interlining ?? snap?.Interlining),
        priceTicket: !!(snap?.priceTicket ?? snap?.PriceTicket),
        hanger: !!(snap?.hanger ?? snap?.Hanger),
        foldMethod: !!(snap?.foldMethod ?? snap?.FoldMethod),
        additionalLabel: !!(snap?.additionalLbl ?? snap?.AdditionalLbl),
      },
      accDrop: {
        ...DEFAULT_ACC_DROP,
        dyeLot: field(snap, 'dyeLotCom', 'DyeLotCom') || DEFAULT_ACC_DROP.dyeLot,
        zipper: field(snap, 'zipperCom', 'ZipperCom') || DEFAULT_ACC_DROP.zipper,
        pattern: field(snap, 'patternCom', 'PatternCom') || DEFAULT_ACC_DROP.pattern,
        drawingString: field(snap, 'drawingStrCom', 'DrawingStrCom') || DEFAULT_ACC_DROP.drawingString,
        generalAppearance: field(snap, 'generalAppCom', 'GeneralAppCom') || DEFAULT_ACC_DROP.generalAppearance,
        hangTag: field(snap, 'hangtagCom', 'HangtagCom') || DEFAULT_ACC_DROP.hangTag,
        mainLabelPlacement: field(snap, 'mainLblPlacementCom', 'MainLblPlacementCom') || DEFAULT_ACC_DROP.mainLabelPlacement,
        careLabelPlacement: field(snap, 'careLblPlacementCom', 'CareLblPlacementCom') || DEFAULT_ACC_DROP.careLabelPlacement,
        contentLabelPlacement:
          field(snap, 'contentLblPlacementCom', 'ContentLblPlacementCom') || DEFAULT_ACC_DROP.contentLabelPlacement,
        hanger: field(snap, 'hangerCom', 'HangerCom') || DEFAULT_ACC_DROP.hanger,
        foldMethodDdl: field(snap, 'foldMethodCom', 'FoldMethodCom') || DEFAULT_ACC_DROP.foldMethodDdl,
        priceTicket: field(snap, 'priceTicketCom', 'PriceTicketCom') || DEFAULT_ACC_DROP.priceTicket,
        button: field(snap, 'buttonsCom', 'ButtonsCom') || DEFAULT_ACC_DROP.button,
        additionalLabel: field(snap, 'additionalLblComm', 'AdditionalLblComm') || DEFAULT_ACC_DROP.additionalLabel,
      },
      accText: {
        mainLabel: field(snap, 'mainLblCom', 'MainLblCom'),
        careLabel: field(snap, 'careLblCom', 'CareLblCom'),
        contentLabel: field(snap, 'contentLblCom', 'ContentLblCom'),
        interlining: field(snap, 'interLiningCom', 'InterLiningCom'),
      },
      pack: {
        cartonDimen: !!(snap?.cartonDimen ?? snap?.CartonDimen),
        cartonMarking: !!(snap?.cartonMarking ?? snap?.CartonMarking),
        cartonThickness: !!(snap?.cartonThickness ?? snap?.CartonThickness),
        netWt: !!(snap?.netWT ?? snap?.NetWT),
        grossWt: !!(snap?.grossWT ?? snap?.GrossWT),
      },
      packDrop: {
        cartonMarking: field(snap, 'cartonMarkingCom', 'CartonMarkingCom') || '1 Side',
        cartonThickness: field(snap, 'crtnThicknessCom', 'CrtnThicknessCom') || '03 ply',
      },
      packText: {
        cartonDimen: field(snap, 'cartonDimmCom', 'CartonDimmCom'),
        netWt: field(snap, 'netWTCom', 'NetWTCom'),
        grossWt: field(snap, 'grossWTCom', 'GrossWTCom'),
      },
    });
  }, [data, h, snap, bindDef, firstSystemId, rangesForFirstSystem]);

  useEffect(() => {
    if (!data) return;
    const discApi = data.discrepancies ?? data.Discrepancies ?? [];
    setDiscRows(
      Array.from({ length: DISCREPANCY_ROWS }, (_, i) => {
        const row = discApi[i];
        return {
          id: i,
          discrepancy: field(row, 'discrepanices', 'Discrepanices'),
          remarks: field(row, 'remarks', 'Remarks'),
          critical: numOrEmpty(row?.critical ?? row?.Critical),
          major: numOrEmpty(row?.major ?? row?.Major),
          minor: numOrEmpty(row?.minor ?? row?.Minor),
        };
      })
    );
  }, [data]);

  useEffect(() => {
    if (!data) return;
    loadMeasurementTypes();
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data) return;
    if (mstId) {
      loadLines(mstId);
      [...FUNDAMENTAL_IMAGE_SLOTS, ...COMPLIMENTARY_IMAGE_SLOTS].forEach((s) => {
        loadSlotImages(s, mstId);
      });
    } else {
      setLineRows(
        (poLines || []).map((row) => ({
          podetailId: Number(row.podetailID ?? row.PodetailID),
          style: row.styleNo ?? row.StyleNo ?? '',
          orderQty: numOrEmpty(row.orderQty ?? row.OrderQty),
          inspectedQty: numOrEmpty(row.inspectedQty ?? row.InspectedQty),
          inspectionQty: '',
          qdUserId: '',
          inspType,
          inspStatus: '',
          remarks: '',
          qdName: '',
          inspectionDate: '',
        }))
      );
    }
  }, [data, mstId, poLines, inspType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mstId || !measurementTypeId) return;
    loadSpecs(mstId, measurementTypeId);
  }, [mstId, measurementTypeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setF = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setAcc = (key, value) =>
    setForm((prev) => ({ ...prev, acc: { ...(prev.acc || {}), [key]: value } }));
  const setPack = (key, value) =>
    setForm((prev) => ({ ...prev, pack: { ...(prev.pack || {}), [key]: value } }));
  const setAccDrop = (key, value) =>
    setForm((prev) => ({ ...prev, accDrop: { ...(prev.accDrop || {}), [key]: value } }));
  const setAccText = (key, value) =>
    setForm((prev) => ({ ...prev, accText: { ...(prev.accText || {}), [key]: value } }));
  const setPackDrop = (key, value) =>
    setForm((prev) => ({ ...prev, packDrop: { ...(prev.packDrop || {}), [key]: value } }));
  const setPackText = (key, value) =>
    setForm((prev) => ({ ...prev, packText: { ...(prev.packText || {}), [key]: value } }));

  const setDisc = (index, key, value) =>
    setDiscRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });

  const reloadInspection = async () => {
    const { data: res } = await qdApi.get(
      `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}`,
      { params: { inspType } }
    );
    setData(res);
  };

  const handleSave = async (isMainSave) => {
    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      const body = buildQdSavePayload(form, discRows, mstId, isMainSave);
      await qdApi.post(
        `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}`,
        body,
        { params: { inspType } }
      );
      await reloadInspection();
      setSaveMsg(isMainSave ? 'Saved.' : 'Saved as draft.');
    } catch (e) {
      setSaveErr(
        typeof e?.response?.data === 'string'
          ? e.response.data
          : e?.response?.data?.message || e?.message || 'Save failed'
      );
    } finally {
      setSaving(false);
    }
  };

  const setLine = (idx, key, value) =>
    setLineRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });

  const loadLines = async (currentMstId) => {
    if (!currentMstId) return;
    const { data: lineData } = await qdApi.get(
      `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}/lines`,
      { params: { qdInspectionMstId: currentMstId } }
    );
    const mapByDetail = new Map((lineData || []).map((x) => [String(x.podetailID ?? x.PODetailID), x]));
    setLineRows(
      (poLines || []).map((row) => {
        const key = String(row.podetailID ?? row.PodetailID);
        const m = mapByDetail.get(key);
        return {
          podetailId: Number(row.podetailID ?? row.PodetailID),
          style: row.styleNo ?? row.StyleNo ?? '',
          orderQty: numOrEmpty(row.orderQty ?? row.OrderQty),
          inspectedQty: numOrEmpty(row.inspectedQty ?? row.InspectedQty),
          inspectionQty: numOrEmpty(m?.inspectedQty ?? m?.InspectedQty),
          qdUserId: m?.qDUserID ?? m?.QDUserID ?? '',
          inspType: m?.inspectionStatus ?? m?.InspectionStatus ?? inspType,
          inspStatus: m?.inspStatus ?? m?.InspStatus ?? '',
          remarks: m?.remarks ?? m?.Remarks ?? '',
          qdName: m?.qDName ?? m?.QDName ?? '',
          inspectionDate: toDateInput(m?.inspectionDate ?? m?.InspectionDate),
        };
      })
    );
  };

  const saveLines = async () => {
    if (!mstId) {
      setSaveErr('Please save master inspection first.');
      return;
    }
    await qdApi.post(
      `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}/lines`,
      {
        lines: lineRows.map((r) => ({
          podetailId: r.podetailId,
          inspectedQty: parseOptionalDecimal(r.inspectionQty),
          qdUserId: parseOptionalLong(r.qdUserId),
          inspectionDate: r.inspectionDate ? new Date(r.inspectionDate).toISOString() : null,
          inspectionStatus: r.inspType || inspType,
          inspStatus: r.inspStatus || null,
          remarks: r.remarks || null,
          qdName: r.qdName || null,
        })),
      },
      { params: { qdInspectionMstId: mstId, inspType } }
    );
    setSaveMsg('Line inspections saved.');
    await loadLines(mstId);
  };

  const loadMeasurementTypes = async () => {
    const { data: mt } = await qdApi.get(
      `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}/measurement-types`
    );
    setMeasurementTypes(mt || []);
    if ((mt || []).length > 0 && !measurementTypeId) {
      setMeasurementTypeId(String(mt[0].measurementTypeID ?? mt[0].MeasurementTypeID));
    }
  };

  const loadSpecs = async (currentMstId, typeId) => {
    if (!currentMstId || !typeId) return;
    setLoadingSpecs(true);
    try {
      const { data: rows } = await qdApi.get(
        `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}/size-specs`,
        { params: { qdInspectionMstId: currentMstId, measurementTypeId: typeId } }
      );
      setSpecRows(
        (rows || []).map((r) => ({
          measurementPointId: r.measurementPointID ?? r.MeasurementPointID,
          measurementPoints: r.measurementPoints ?? r.MeasurementPoints ?? '',
          measurements: r.measurements ?? r.Measurements ?? '',
          tolerance: r.tolerance ?? r.Tolerance ?? '',
          header1: r.header1 ?? r.Header1 ?? '',
          header2: r.header2 ?? r.Header2 ?? '',
          header3: r.header3 ?? r.Header3 ?? '',
          header4: r.header4 ?? r.Header4 ?? '',
          q1: r.qCol1 ?? r.QCol1 ?? '',
          q2: r.qCol2 ?? r.QCol2 ?? '',
          q3: r.qCol3 ?? r.QCol3 ?? '',
          q4: r.qCol4 ?? r.QCol4 ?? '',
        }))
      );
    } finally {
      setLoadingSpecs(false);
    }
  };

  const setSpec = (idx, key, value) =>
    setSpecRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });

  const saveSpecs = async () => {
    if (!mstId || !measurementTypeId) {
      setSaveErr('Save master and select measurement type first.');
      return;
    }
    setSavingSpecs(true);
    try {
      await qdApi.post(
        `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}/size-specs`,
        {
          measurementTypeId: Number(measurementTypeId),
          rows: specRows.map((r) => ({
            measurementPointId: Number(r.measurementPointId),
            measurementPoints: r.measurementPoints || null,
            measurements: r.measurements || null,
            tolerance: r.tolerance || null,
            header1: r.header1 || null,
            header2: r.header2 || null,
            header3: r.header3 || null,
            header4: r.header4 || null,
            col1: r.q1 || null,
            col2: r.q2 || null,
            col3: r.q3 || null,
            col4: r.q4 || null,
          })),
        },
        { params: { qdInspectionMstId: mstId } }
      );
      setSaveMsg('Size specs saved.');
      await loadSpecs(mstId, measurementTypeId);
    } finally {
      setSavingSpecs(false);
    }
  };

  const slotQuery = (slot) => {
    if (slot.includes('Major Defect')) return { photoName: null, imgHeader: 'Major Defect' };
    if (slot.includes('Minor Defect')) return { photoName: null, imgHeader: 'Minor Defect' };
    if (slot.includes('Critical Defect')) return { photoName: null, imgHeader: 'Critical Defect' };
    return { photoName: slot.replace(' Images', ''), imgHeader: null };
  };

  const loadSlotImages = async (slot, currentMstId) => {
    if (!currentMstId) return;
    const q = slotQuery(slot);
    const { data: imgs } = await qdApi.get(
      `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}/images`,
      { params: { qdInspectionMstId: currentMstId, photoName: q.photoName, imgHeader: q.imgHeader } }
    );
    setImageMap((prev) => ({ ...prev, [slot]: imgs || [] }));
  };

  const uploadSlotImage = async (slot, file) => {
    if (!mstId) {
      setSaveErr('Save master first to upload images.');
      return;
    }
    const q = slotQuery(slot);
    const fd = new FormData();
    fd.append('file', file);
    await qdApi.post(
      `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}/images`,
      fd,
      {
        params: { qdInspectionMstId: mstId, photoName: q.photoName ?? file.name, imgHeader: q.imgHeader },
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    await loadSlotImages(slot, mstId);
    setSaveMsg(`${slot} image uploaded.`);
  };

  const deleteImage = async (slot, digitalId) => {
    await qdApi.delete(`/MasterOrderForQDSheet/quality-department-inspection/image/${digitalId}`);
    await loadSlotImages(slot, mstId);
  };

  if (!poid || !inspType) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">Missing poid or inspType.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <CustomBreadcrumbs
        heading="INSPECTION INFORMATION"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Master Order QD Sheet', href: paths.dashboard.masterOrderForQDSheet },
          { name: 'Inspection' },
        ]}
        sx={{ mb: 2 }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          INSPECTION INFORMATION — {field(h, 'pono', 'poNo', 'pONo', 'PONo') || '—'}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={inspType} color="primary" />
          <Chip label={`POID ${poid}`} size="small" variant="outlined" />
          {mstId != null ? (
            <Chip label={`Saved QDInspectionMst ${mstId}`} color="success" size="small" />
          ) : (
            <Chip label="New inspection (not saved)" size="small" variant="outlined" />
          )}
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveErr(null)}>
          {saveErr}
        </Alert>
      )}
      {saveMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveMsg(null)}>
          {saveMsg}
        </Alert>
      )}

      {!loading && !error && h && (
        <Stack spacing={2.5}>
          <SectionCard title="INSPECTION INFORMATION">
            <Grid container spacing={2}>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  label="Inspection No"
                  fullWidth
                  size="small"
                  value={form.inspNo ?? ''}
                  onChange={(e) => setF('inspNo', e.target.value)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField label="Shipment Date" fullWidth size="small" value={form.shipmentDate ?? ''} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField label="PO Qty / Actual Qty" fullWidth size="small" value={form.poQtyLabel ?? ''} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  select
                  label="System (AQL)"
                  fullWidth
                  size="small"
                  value={form.aqlSystemId ?? ''}
                  onChange={(e) => setF('aqlSystemId', e.target.value)}
                >
                  {aqlSystems.map((s) => (
                    <MenuItem key={s.aqlSysytemId ?? s.AQLSysytemId} value={s.aqlSysytemId ?? s.AQLSysytemId}>
                      {s.aqlSystem ?? s.AQLSystem}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid xs={12} sm={6} md={3}>
                <TextField label="Customer" fullWidth size="small" value={form.customer ?? ''} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  type="date"
                  label="Inspection Date"
                  fullWidth
                  size="small"
                  value={form.inspectionDate ?? ''}
                  onChange={(e) => setF('inspectionDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  label="Offered Qty"
                  fullWidth
                  size="small"
                  value={form.offeredQty ?? ''}
                  onChange={(e) => setF('offeredQty', e.target.value)}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  select
                  label="Range (AQL)"
                  fullWidth
                  size="small"
                  value={form.aqlRangeId ?? ''}
                  onChange={(e) => setF('aqlRangeId', e.target.value)}
                >
                  {aqlRanges
                    .filter((r) => {
                      const sid = form.aqlSystemId || firstSystemId;
                      if (sid == null) return true;
                      return (r.aqlSysytemId ?? r.AQLSysytemId) === sid;
                    })
                    .map((r) => (
                      <MenuItem key={r.aqlRangeId ?? r.AQLRangeId} value={r.aqlRangeId ?? r.AQLRangeId}>
                        {r.aqlRange ?? r.AQLRange}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              <Grid xs={12} sm={6} md={3}>
                <TextField label="Supplier" fullWidth size="small" value={form.supplier ?? ''} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField label="Factory" fullWidth size="small" value={form.factory ?? ''} onChange={(e) => setF('factory', e.target.value)} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  label="Required Ctn Qty"
                  fullWidth
                  size="small"
                  value={form.requiredCtnQty ?? ''}
                  onChange={(e) => setF('requiredCtnQty', e.target.value)}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField label="Style" fullWidth size="small" value={form.styleNo ?? ''} InputProps={{ readOnly: true }} />
              </Grid>

              <Grid xs={12}>
                <TextField
                  label="Selected Carton No"
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  value={form.selectedCartons ?? ''}
                  onChange={(e) => setF('selectedCartons', e.target.value)}
                />
              </Grid>

              <Grid xs={12} sm={6} md={3}>
                <TextField label="Season" fullWidth size="small" value={form.season ?? ''} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField label="Ratio" fullWidth size="small" value={form.ratio ?? ''} onChange={(e) => setF('ratio', e.target.value)} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  label="Offered Carton Qty"
                  fullWidth
                  size="small"
                  value={form.offeredCtnQty ?? ''}
                  onChange={(e) => setF('offeredCtnQty', e.target.value)}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField label="GSM" fullWidth size="small" value={form.gsm ?? ''} InputProps={{ readOnly: true }} />
              </Grid>

              <Grid xs={12} sm={6} md={4}>
                <TextField label="Color" fullWidth size="small" value={form.color ?? ''} onChange={(e) => setF('color', e.target.value)} />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <TextField label="Design" fullWidth size="small" value={form.design ?? ''} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Shipment mode"
                  fullWidth
                  size="small"
                  value={form.shipmentMode ?? '0'}
                  onChange={(e) => setF('shipmentMode', e.target.value)}
                >
                  <MenuItem value="0">By Sea</MenuItem>
                  <MenuItem value="1">By Air</MenuItem>
                </TextField>
              </Grid>

              <Grid xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Defects (Quantity / Conformity / Workmanship / Packing)
                </Typography>
              </Grid>
              {[
                ['qtyD', 'Quantity', OK_NOT_OK],
                ['confD', 'Conformity', OK_NOT_OK],
                ['workD', 'Workmanship', OK_NOT_OK],
                ['packD', 'Packing', OK_NOT_OK],
              ].map(([k, label, opts]) => (
                <Grid key={k} xs={12} sm={6} md={3}>
                  <TextField
                    select
                    label={label}
                    fullWidth
                    size="small"
                    value={form[k] ?? opts[0]}
                    onChange={(e) => setF(k, e.target.value)}
                  >
                    {opts.map((o) => (
                      <MenuItem key={o} value={o}>
                        {o}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              ))}

              {[
                ['qtyDR', 'Quantity remarks'],
                ['confDR', 'Conformity remarks'],
                ['workDR', 'Workmanship remarks'],
                ['packDR', 'Packing remarks'],
              ].map(([k, ph]) => (
                <Grid key={k} xs={12} sm={6} md={3}>
                  <TextField
                    placeholder={ph}
                    fullWidth
                    size="small"
                    value={form[k] ?? ''}
                    onChange={(e) => setF(k, e.target.value)}
                  />
                </Grid>
              ))}

              <Grid xs={12} sm={6} md={3}>
                <TextField
                  select
                  label="Marking"
                  fullWidth
                  size="small"
                  value={form.markD ?? OK_NOT_OK[0]}
                  onChange={(e) => setF('markD', e.target.value)}
                >
                  {OK_NOT_OK.map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  select
                  label="Measurement"
                  fullWidth
                  size="small"
                  value={form.measD ?? OK_NOT_OK[0]}
                  onChange={(e) => setF('measD', e.target.value)}
                >
                  {OK_NOT_OK.map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  placeholder="Marking remarks"
                  fullWidth
                  size="small"
                  value={form.markDR ?? ''}
                  onChange={(e) => setF('markDR', e.target.value)}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  placeholder="Measurement remarks"
                  fullWidth
                  size="small"
                  value={form.measDR ?? ''}
                  onChange={(e) => setF('measDR', e.target.value)}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard
            title="OVERALL CONCLUSION"
            subtitle="Line-level inspection grid (legacy dgPurchaseOrder). Line-level QDInspection rows are not in this API yet."
          >
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid xs={12} sm={4}>
                <TextField
                  select
                  label="PASS / FAIL"
                  fullWidth
                  size="small"
                  value={form.passFail ?? '1'}
                  onChange={(e) => setF('passFail', e.target.value)}
                >
                  <MenuItem value="1">PASS</MenuItem>
                  <MenuItem value="0">FAIL</MenuItem>
                </TextField>
              </Grid>
              <Grid xs={12} sm={4}>
                <TextField
                  label="%"
                  fullWidth
                  size="small"
                  placeholder="%"
                  value={form.calPerc ?? ''}
                  onChange={(e) => setF('calPerc', e.target.value)}
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  label="QA Remarks"
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  value={form.qaRemarks ?? ''}
                  onChange={(e) => setF('qaRemarks', e.target.value)}
                />
              </Grid>
            </Grid>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 440, mb: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>Style</TableCell>
                    <TableCell>Order Qty</TableCell>
                    <TableCell>Inspected Qty</TableCell>
                    <TableCell>Inspection Qty</TableCell>
                    <TableCell>QA Name</TableCell>
                    <TableCell>Insp. Type</TableCell>
                    <TableCell>Insp. Status</TableCell>
                    <TableCell>QA Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography variant="body2" color="text.secondary">
                          No lines.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lineRows.map((row, idx) => (
                      <TableRow key={row.podetailId}>
                        <TableCell>{row.style}</TableCell>
                        <TableCell align="right">{row.orderQty}</TableCell>
                        <TableCell align="right">{row.inspectedQty}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="0"
                            value={row.inspectionQty}
                            onChange={(e) => setLine(idx, 'inspectionQty', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={row.qdName}
                            onChange={(e) => setLine(idx, 'qdName', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={row.inspType}
                            onChange={(e) => setLine(idx, 'inspType', e.target.value)}
                          >
                            <MenuItem value="IPC">IPC</MenuItem>
                            <MenuItem value="MPC">MPC</MenuItem>
                            <MenuItem value="Pre-Final">Pre-Final</MenuItem>
                            <MenuItem value="Final">Final</MenuItem>
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={row.inspStatus}
                            onChange={(e) => setLine(idx, 'inspStatus', e.target.value)}
                          >
                            <MenuItem value="">—</MenuItem>
                            <MenuItem value="Pass">Pass</MenuItem>
                            <MenuItem value="Fail">Fail</MenuItem>
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={row.remarks}
                            onChange={(e) => setLine(idx, 'remarks', e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="outlined" size="small" onClick={saveLines} disabled={!mstId}>
                Save Line Inspections
              </Button>
            </Stack>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Size breakdown (legacy dgInspectionDtl — XS–8XL + Total)
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.14),
                      '& th': { color: 'text.primary', fontWeight: 700 },
                    }}
                  >
                    <TableCell>Size / Type</TableCell>
                    {SIZE_BREAK_COLS.map((c) => (
                      <TableCell key={c} align="center">
                        {c}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {['Order Qty', 'Inspected Qty'].map((label) => (
                    <TableRow key={label}>
                      <TableCell>{label}</TableCell>
                      {SIZE_BREAK_COLS.map((c) => (
                        <TableCell key={c}>
                          <TextField size="small" fullWidth disabled placeholder="—" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <SectionCard title="Accessories Markings">
            <Grid container spacing={2}>
              {ACCESSORY_UI_ROWS.map((row) => {
                const dropKey = row.dropKey ?? row.accKey;
                const opts = row.options || YES_NO;
                const dropVal = form.accDrop?.[dropKey] ?? opts[0];
                return (
                  <Grid key={row.accKey} xs={12} sm={6} md={4}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!form.acc?.[row.accKey]}
                            onChange={(e) => setAcc(row.accKey, e.target.checked)}
                          />
                        }
                        label={row.label}
                      />
                      {row.textMode ? (
                        <TextField
                          size="small"
                          fullWidth
                          label="Comment"
                          value={form.accText?.[row.textKey] ?? ''}
                          onChange={(e) => setAccText(row.textKey, e.target.value)}
                          placeholder="—"
                        />
                      ) : (
                        <TextField
                          select
                          size="small"
                          fullWidth
                          label="Comment"
                          value={dropVal}
                          onChange={(e) => setAccDrop(dropKey, e.target.value)}
                        >
                          {opts.map((o) => (
                            <MenuItem key={o} value={o}>
                              {o}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    </Stack>
                  </Grid>
                );
              })}
            </Grid>
          </SectionCard>

          <SectionCard title="Packing">
            <Grid container spacing={2}>
              <Grid xs={12} sm={6} md={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!form.pack?.cartonDimen}
                        onChange={(e) => setPack('cartonDimen', e.target.checked)}
                      />
                    }
                    label="Carton Dimension"
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Remarks"
                    value={form.packText?.cartonDimen ?? ''}
                    onChange={(e) => setPackText('cartonDimen', e.target.value)}
                    placeholder="—"
                  />
                </Stack>
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!form.pack?.cartonMarking}
                        onChange={(e) => setPack('cartonMarking', e.target.checked)}
                      />
                    }
                    label="Carton Marking"
                  />
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Remarks"
                    value={form.packDrop?.cartonMarking ?? CARTON_MARKING_SIDES[0]}
                    onChange={(e) => setPackDrop('cartonMarking', e.target.value)}
                  >
                    {CARTON_MARKING_SIDES.map((o) => (
                      <MenuItem key={o} value={o}>
                        {o}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!form.pack?.cartonThickness}
                        onChange={(e) => setPack('cartonThickness', e.target.checked)}
                      />
                    }
                    label="Carton Thickness"
                  />
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Remarks"
                    value={form.packDrop?.cartonThickness ?? CARTON_THICKNESS_PLY[0]}
                    onChange={(e) => setPackDrop('cartonThickness', e.target.value)}
                  >
                    {CARTON_THICKNESS_PLY.map((o) => (
                      <MenuItem key={o} value={o}>
                        {o}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox checked={!!form.pack?.netWt} onChange={(e) => setPack('netWt', e.target.checked)} />
                    }
                    label="Net WT"
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Remarks"
                    value={form.packText?.netWt ?? ''}
                    onChange={(e) => setPackText('netWt', e.target.value)}
                    placeholder="—"
                  />
                </Stack>
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!form.pack?.grossWt}
                        onChange={(e) => setPack('grossWt', e.target.checked)}
                      />
                    }
                    label="Gross WT"
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Remarks"
                    value={form.packText?.grossWt ?? ''}
                    onChange={(e) => setPackText('grossWt', e.target.value)}
                    placeholder="—"
                  />
                </Stack>
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard
            title="Size Specs"
            subtitle="Measurement points grid (legacy dgKikInspMeasurementPoint)"
          >
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  size="small"
                  label="Measurement type"
                  fullWidth
                  sx={{ maxWidth: 360 }}
                  value={measurementTypeId}
                  onChange={(e) => setMeasurementTypeId(e.target.value)}
                >
                  <MenuItem value="">Select type…</MenuItem>
                  {measurementTypes.map((t) => {
                    const id = t.measurementTypeID ?? t.MeasurementTypeID;
                    const label = t.measurementType ?? t.MeasurementType;
                    return (
                      <MenuItem key={id} value={String(id)}>
                        {label}
                      </MenuItem>
                    );
                  })}
                </TextField>
                <Button variant="outlined" onClick={saveSpecs} disabled={!mstId || !measurementTypeId || savingSpecs}>
                  Save Specs
                </Button>
                <Button
                  variant="text"
                  onClick={() =>
                    setSpecRows((prev) => [
                      ...prev,
                      {
                        measurementPointId: '',
                        measurementPoints: '',
                        measurements: '',
                        tolerance: '',
                        header1: '',
                        header2: '',
                        header3: '',
                        header4: '',
                        q1: '',
                        q2: '',
                        q3: '',
                        q4: '',
                      },
                    ])
                  }
                >
                  Add Row
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Measurement Point ID</TableCell>
                      <TableCell>Measurement Point</TableCell>
                      <TableCell>Measurement</TableCell>
                      <TableCell>Tolerance</TableCell>
                      <TableCell>H1</TableCell>
                      <TableCell>H2</TableCell>
                      <TableCell>H3</TableCell>
                      <TableCell>H4</TableCell>
                      <TableCell>Q1</TableCell>
                      <TableCell>Q2</TableCell>
                      <TableCell>Q3</TableCell>
                      <TableCell>Q4</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {specRows.map((r, idx) => (
                      <TableRow key={`${r.measurementPointId}-${idx}`}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={r.measurementPointId}
                            onChange={(e) => setSpec(idx, 'measurementPointId', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={r.measurementPoints}
                            onChange={(e) => setSpec(idx, 'measurementPoints', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={r.measurements} onChange={(e) => setSpec(idx, 'measurements', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={r.tolerance} onChange={(e) => setSpec(idx, 'tolerance', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={r.header1} onChange={(e) => setSpec(idx, 'header1', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={r.header2} onChange={(e) => setSpec(idx, 'header2', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={r.header3} onChange={(e) => setSpec(idx, 'header3', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={r.header4} onChange={(e) => setSpec(idx, 'header4', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={r.q1} onChange={(e) => setSpec(idx, 'q1', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={r.q2} onChange={(e) => setSpec(idx, 'q2', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={r.q3} onChange={(e) => setSpec(idx, 'q3', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={r.q4} onChange={(e) => setSpec(idx, 'q4', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => setSpecRows((prev) => prev.filter((_, i) => i !== idx))}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loadingSpecs && specRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={13} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No rows for selected measurement type.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider />

              <Typography variant="subtitle2">AQL — Sample size &amp; limits (legacy below discrepancies)</Typography>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid xs={6} sm={2}>
                  <Button variant="contained" color="success" disabled fullWidth sx={{ mb: 0.5 }}>
                    Calculate
                  </Button>
                </Grid>
                <Grid xs={6} sm={2}>
                  <Typography variant="caption" display="block" align="center">
                    Total
                  </Typography>
                </Grid>
                <Grid xs={6} sm={2}>
                  <TextField
                    label="Sample Size"
                    fullWidth
                    size="small"
                    value={form.sampleSize ?? ''}
                    onChange={(e) => setF('sampleSize', e.target.value)}
                    sx={{ '& .MuiInputBase-input': { fontWeight: 700, bgcolor: 'action.selected' } }}
                  />
                </Grid>
                <Grid xs={6} sm={2}>
                  <TextField
                    label="Critical"
                    fullWidth
                    size="small"
                    value={form.criticalQty ?? ''}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input': { fontWeight: 700, bgcolor: 'action.selected' } }}
                  />
                </Grid>
                <Grid xs={6} sm={2}>
                  <TextField
                    label="Major"
                    fullWidth
                    size="small"
                    value={form.majQty ?? ''}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input': { fontWeight: 700, bgcolor: 'action.selected' } }}
                  />
                </Grid>
                <Grid xs={6} sm={2}>
                  <TextField
                    label="Minor"
                    fullWidth
                    size="small"
                    value={form.minQty ?? ''}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input': { fontWeight: 700, bgcolor: 'action.selected' } }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} sm={2} offset={{ sm: 4 }}>
                  <TextField
                    select
                    label="Reliability"
                    fullWidth
                    size="small"
                    value={form.reliability ?? 'II'}
                    onChange={(e) => setF('reliability', e.target.value)}
                    sx={{ '& .MuiInputBase-root': { bgcolor: alpha(theme.palette.primary.main, 0.12) } }}
                  >
                    {RELIABILITY.map((r) => (
                      <MenuItem key={r.value} value={r.value}>
                        {r.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {[
                  ['critAql', 'Critical AQL', '0.0'],
                  ['majAql', 'Major AQL', '2.5'],
                  ['minAql', 'Minor AQL', '4.0'],
                ].map(([k, lbl, defVal]) => (
                  <Grid key={k} xs={12} sm={2}>
                    <TextField
                      select
                      label={lbl}
                      fullWidth
                      size="small"
                      value={normalizeAqlFieldValue(form[k] != null && form[k] !== '' ? form[k] : defVal)}
                      onChange={(e) => setF(k, e.target.value)}
                      sx={{ '& .MuiInputBase-root': { bgcolor: alpha(theme.palette.primary.main, 0.12) } }}
                    >
                      {AQL_LEVEL_MENU_ITEMS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} sm={2} offset={{ sm: 4 }}>
                  <Typography variant="caption" align="center" display="block">
                    Allowed
                  </Typography>
                </Grid>
                <Grid xs={12} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    value={form.allowCrit ?? ''}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input': { fontWeight: 700, bgcolor: 'action.selected' } }}
                  />
                </Grid>
                <Grid xs={12} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    value={form.allowMaj ?? ''}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input': { fontWeight: 700, bgcolor: 'action.selected' } }}
                  />
                </Grid>
                <Grid xs={12} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    value={form.allowMin ?? ''}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input': { fontWeight: 700, bgcolor: 'action.selected' } }}
                  />
                </Grid>
              </Grid>

              <Typography variant="caption" color="text.secondary">
                Default sample size band from PO qty: {bindDef?.defaultSampleSize ?? bindDef?.DefaultSampleSize ?? '—'} ·
                Range label (first system, index {bindDef?.defaultRangeIndex ?? bindDef?.DefaultRangeIndex ?? '—'}):{' '}
                {defaultRangeLabel || '—'}
              </Typography>
            </Stack>
          </SectionCard>

          <SectionCard title="DISCREPANCIES">
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>During inspection found following discrepancies</TableCell>
                    <TableCell>Remarks</TableCell>
                    <TableCell>Critical</TableCell>
                    <TableCell>Major</TableCell>
                    <TableCell>Minor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {discRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={r.discrepancy}
                          onChange={(e) => setDisc(r.id, 'discrepancy', e.target.value)}
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={r.remarks}
                          onChange={(e) => setDisc(r.id, 'remarks', e.target.value)}
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={r.critical}
                          onChange={(e) => setDisc(r.id, 'critical', e.target.value)}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={r.major}
                          onChange={(e) => setDisc(r.id, 'major', e.target.value)}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={r.minor}
                          onChange={(e) => setDisc(r.id, 'minor', e.target.value)}
                          placeholder="0"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Rows save with Save / Draft (legacy dgDiscrepanices).
            </Typography>
          </SectionCard>

          <SectionCard
            title="FUNDAMENTAL IMAGES"
            subtitle="Upload / view / delete"
          >
            <Grid container spacing={1.5}>
              {FUNDAMENTAL_IMAGE_SLOTS.map((slot) => (
                <Grid xs={12} sm={6} md={4} key={slot}>
                  <ImageUploadBox
                    title={slot}
                    images={imageMap[slot] || []}
                    onUpload={(file) => uploadSlotImage(slot, file)}
                    onDelete={(digitalId) => deleteImage(slot, digitalId)}
                    getImageUrl={(id) =>
                      `${qdApi.defaults.baseURL}/MasterOrderForQDSheet/quality-department-inspection/image/${id}/file`
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </SectionCard>

          <SectionCard
            title="COMPLIMENTARY IMAGES"
            subtitle="Matches old popup section with multiple image boxes."
          >
            <Grid container spacing={1.5}>
              {COMPLIMENTARY_IMAGE_SLOTS.map((slot) => (
                <Grid xs={12} sm={6} md={4} key={slot}>
                  <ImageUploadBox
                    title={slot}
                    images={imageMap[slot] || []}
                    onUpload={(file) => uploadSlotImage(slot, file)}
                    onDelete={(digitalId) => deleteImage(slot, digitalId)}
                    getImageUrl={(id) =>
                      `${qdApi.defaults.baseURL}/MasterOrderForQDSheet/quality-department-inspection/image/${id}/file`
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </SectionCard>

          <Alert severity="info" variant="outlined">
            Master, discrepancy, line inspections, size specs, and image APIs are wired to the new backend.
          </Alert>

          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button variant="contained" disabled={saving} onClick={() => handleSave(true)}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outlined" disabled={saving} onClick={() => handleSave(false)}>
              {saving ? 'Saving…' : 'Draft'}
            </Button>
            <Button component={RouterLink} to={paths.dashboard.masterOrderForQDSheet} variant="outlined">
              Back to Master Order For QD Sheet
            </Button>
          </Stack>
        </Stack>
      )}
    </Container>
  );
}
