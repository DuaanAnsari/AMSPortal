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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
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
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UploadIcon from '@mui/icons-material/CloudUpload';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { alpha, useTheme } from '@mui/material/styles';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';
import { useSnackbar } from 'src/components/snackbar';
import SignaturePopup from './SignaturePopup';

const LEGACY_WEB_BASE = (import.meta.env.VITE_LEGACY_WEB_BASE || '').trim();

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

/** Table column header row — aligned with QD-Inspection-Process-Entry / theme primary */
function tableHeadRowSx(theme) {
  return {
    bgcolor: alpha(theme.palette.primary.main, 0.12),
    '& th': {
      color: 'primary.dark',
      fontWeight: 700,
      fontSize: 12,
      borderColor: 'divider',
    },
  };
}

const DISCREPANCY_ROWS = 18;
/** Legacy grid always has 12 size slots (Size1…Size12) + Total — must match API QDInspectionDtl. */
const INSPECTION_DTL_SIZE_SLOTS = 12;

/**
 * Same order as API `QdQualityDeptInspectionDtlSchema.RowTypeOrder` — only used when API omits `inspectionDtlRowTypes`.
 */
const QD_INSPECTION_DTL_ROW_TYPES_FALLBACK = [
  'SIZE',
  'ORDER QTY',
  'OFFER QTY',
  'FABRIC IN HOUSE',
  'CUT QTY',
  'IN-LINE',
  'OFF-LINE',
  'QTY PACKED PCS / SET',
  'QTY PACKED CARTON',
  'QTY INSPECTED CARTON',
  'QTY BALANCE/EXTRA',
];

function emptyInspectionDtlRow(sizeType) {
  const row = { sizeType };
  for (let i = 1; i <= INSPECTION_DTL_SIZE_SLOTS; i++) {
    row[`size${i}`] = '';
  }
  row.sizeTotal = '';
  return row;
}

/** When GET returns no `inspectionDtlRows` (old API) or [], build legacy-shaped rows from GetSizeQty breakdown. */
function buildDefaultInspectionDtlRows(breakdown, rowTypes) {
  const types =
    Array.isArray(rowTypes) && rowTypes.length > 0 ? rowTypes : QD_INSPECTION_DTL_ROW_TYPES_FALLBACK;
  return types.map((sizeType) => {
    if (sizeType === 'SIZE') {
      const row = emptyInspectionDtlRow('SIZE');
      for (let i = 0; i < INSPECTION_DTL_SIZE_SLOTS; i++) {
        const b = breakdown[i];
        row[`size${i + 1}`] = b ? String(b.size ?? b.Size ?? '').trim() : '';
      }
      return row;
    }
    if (sizeType === 'ORDER QTY') {
      const row = emptyInspectionDtlRow('ORDER QTY');
      for (let i = 0; i < INSPECTION_DTL_SIZE_SLOTS; i++) {
        const b = breakdown[i];
        const q = b?.quantity ?? b?.Quantity;
        row[`size${i + 1}`] = q == null || q === '' ? '' : String(Math.round(Number(q)));
      }
      row.sizeTotal = sumDtlRowSlots(row, INSPECTION_DTL_SIZE_SLOTS);
      return row;
    }
    return emptyInspectionDtlRow(sizeType);
  });
}

function padInspectionDtlRowToSlots(row) {
  const out = { ...row };
  const st = String(out.sizeType ?? out.SizeType ?? '').trim().toUpperCase();

  for (let i = 1; i <= INSPECTION_DTL_SIZE_SLOTS; i += 1) {
    const k = `size${i}`;
    const p = `Size${i}`;
    let v = out[k];
    if (v == null || v === '') v = out[p];

    if (v != null && v !== '' && st !== 'SIZE') {
      const n = Number(String(v).replace(',', '.'));
      out[k] = Number.isFinite(n) ? String(Math.round(n)) : String(v);
    } else {
      out[k] = v == null ? '' : String(v);
    }
  }

  if (st !== 'SIZE') {
    const t = out.sizeTotal ?? out.SizeTotal;
    if (t != null && t !== '') {
      const n = Number(String(t).replace(',', '.'));
      out.sizeTotal = Number.isFinite(n) ? String(Math.round(n)) : String(t);
    }
  }

  if (out.sizeType == null && out.SizeType != null) out.sizeType = out.SizeType;
  return out;
}

function getDtlCell(row, col1To12) {
  const k = `size${col1To12}`;
  const pascal = `Size${col1To12}`;
  if (row[k] != null && row[k] !== '') return String(row[k]);
  if (row[pascal] != null && row[pascal] !== '') return String(row[pascal]);
  return '';
}

function sumDtlRowSlots(row, numSlots) {
  let s = 0;
  let any = false;
  for (let i = 1; i <= numSlots; i++) {
    const v = getDtlCell(row, i);
    if (v === '') continue;
    const n = Number(String(v).replace(',', '.'));
    if (Number.isFinite(n)) {
      s += n;
      any = true;
    }
  }
  return any ? String(Math.round(s)) : '';
}

function buildInspectionDtlPayload(rows) {
  const parse = (v) => (v == null || String(v).trim() === '' ? null : String(v));
  return (rows || []).map((r) => ({
    sizeType: r.sizeType ?? r.SizeType ?? '',
    size1: parse(r.size1 ?? r.Size1),
    size2: parse(r.size2 ?? r.Size2),
    size3: parse(r.size3 ?? r.Size3),
    size4: parse(r.size4 ?? r.Size4),
    size5: parse(r.size5 ?? r.Size5),
    size6: parse(r.size6 ?? r.Size6),
    size7: parse(r.size7 ?? r.Size7),
    size8: parse(r.size8 ?? r.Size8),
    size9: parse(r.size9 ?? r.Size9),
    size10: parse(r.size10 ?? r.Size10),
    size11: parse(r.size11 ?? r.Size11),
    size12: parse(r.size12 ?? r.Size12),
    sizeTotal: parse(r.sizeTotal ?? r.SizeTotal),
  }));
}
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

function calcSampleSize(offeredQty, reliability) {
  const qty = Number(offeredQty) || 0;
  const rel = String(reliability || '').trim().toUpperCase();
  const aOrI = rel === 'A' || rel === 'I';
  if (aOrI) {
    if (qty > 0 && qty <= 150) return 8;
    if (qty >= 151 && qty <= 280) return 13;
    if (qty >= 281 && qty <= 500) return 20;
    if (qty >= 501 && qty <= 1200) return 32;
    if (qty >= 1201 && qty <= 3200) return 50;
    if (qty >= 3201 && qty <= 10000) return 80;
    if (qty >= 10001 && qty <= 35000) return 125;
    if (qty > 35000) return 200;
    return 0;
  }
  if (qty > 0 && qty <= 150) return 20;
  if (qty >= 151 && qty <= 280) return 32;
  if (qty >= 281 && qty <= 500) return 50;
  if (qty >= 501 && qty <= 1200) return 80;
  if (qty >= 1201 && qty <= 3200) return 125;
  if (qty >= 3201 && qty <= 10000) return 200;
  if (qty >= 10001 && qty <= 35000) return 315;
  if (qty >= 35001 && qty <= 150000) return 500;
  if (qty >= 150001 && qty <= 500000) return 800;
  if (qty >= 500001) return 1250;
  return 0;
}

function calcAllowedByAql(sampleSize, aqlValue) {
  const aql = String(aqlValue || '').trim();
  const table = {
    '1.5': { 8: 0, 13: 0, 20: 0, 32: 1, 50: 2, 80: 3, 125: 5, 200: 7, 315: 10 },
    '2.5': { 8: 0, 13: 0, 20: 1, 32: 2, 50: 3, 80: 5, 125: 7, 200: 10, 315: 14 },
    '4.0': { 8: 0, 13: 1, 20: 2, 32: 3, 50: 5, 80: 7, 125: 10, 200: 14, 315: 21 },
    '6.5': { 8: 1, 13: 2, 20: 3, 32: 5, 50: 7, 80: 10, 125: 14, 200: 21, 315: 21 },
    '10': { 8: 2, 13: 3, 20: 5, 32: 7, 50: 10, 80: 14, 125: 21, 200: 21, 315: 21 },
    '10.0': { 8: 2, 13: 3, 20: 5, 32: 7, 50: 10, 80: 14, 125: 21, 200: 21, 315: 21 },
  };
  if (!table[aql]) return 0;
  return table[aql][sampleSize] ?? 0;
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

function buildQdSavePayload(form, discRows, mstId, isMainSave, inspectionDtlRows) {
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
    colorway: Array.isArray(form.color) ? form.color.join(',') : (form.color || null),
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
    inspectionDtl: buildInspectionDtlPayload(inspectionDtlRows),
  };
}

function SectionCard({ title, children, subtitle, headerRight }) {
  const theme = useTheme();
  return (
    <Card variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2, boxShadow: theme.shadows[1] }}>
      <Box
        sx={{
          px: 3,
          py: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ m: 0 }}>
          {title}
        </Typography>
        {headerRight && <Box>{headerRight}</Box>}
      </Box>
      {subtitle ? (
        <Box sx={{ px: 3, pt: 1, pb: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      ) : null}
      <Box sx={{ p: 3 }}>{children}</Box>
    </Card>
  );
}

function ImageUploadBox({ title, images = [], onUpload, onDelete, getImageUrl }) {
  const theme = useTheme();
  const [previewInfo, setPreviewInfo] = useState(null);

  const handlePreview = async (id, name) => {
    try {
      const url = getImageUrl(id).replace(qdApi.defaults.baseURL || '', '');
      const res = await qdApi.get(url, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(res.data);
      setPreviewInfo({ name, url: objectUrl });
    } catch (e) {
      console.error('Failed to load image blob', e);
      setPreviewInfo({ name, url: getImageUrl(id) });
    }
  };

  const closePreview = () => {
    if (previewInfo?.url && previewInfo.url.startsWith('blob:')) {
      URL.revokeObjectURL(previewInfo.url);
    }
    setPreviewInfo(null);
  };

  return (
    <>
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2, 
          height: '100%', 
          borderRadius: 1.5,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'all 0.2s',
          '&:hover': { boxShadow: (theme) => theme.customShadows.z8 }
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
          {title}
        </Typography>
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            minHeight: 140,
            bgcolor: alpha(theme.palette.action.hover, 0.4),
            mb: 2,
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {images.length === 0 ? (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                No images uploaded
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1} sx={{ width: '100%' }}>
              {images.map((img) => {
                const id = img.digitalID ?? img.DigitalID;
                const name = img.photoName ?? img.PhotoName ?? `Image ${id}`;
                return (
                  <Stack 
                    key={id} 
                    direction="row" 
                    spacing={1} 
                    justifyContent="space-between" 
                    alignItems="center"
                    sx={{
                      p: 0.5,
                      px: 1,
                      borderRadius: 0.75,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Button 
                      size="small" 
                      onClick={() => handlePreview(id, name)}
                      sx={{ 
                        textTransform: 'none', 
                        fontSize: 12,
                        color: 'primary.main',
                        justifyContent: 'flex-start',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {name}
                    </Button>
                    <IconButton size="small" color="error" onClick={() => onDelete(id)} sx={{ '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
        <Stack direction="row" justifyContent="flex-end">
          <Button 
            size="small" 
            variant="soft" 
            component="label" 
            startIcon={<UploadIcon />}
            sx={{ borderRadius: 1 }}
          >
            Upload
            <input
              hidden
              multiple
              type="file"
              accept="image/*"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  onUpload(Array.from(files));
                }
                e.target.value = '';
              }}
            />
          </Button>
        </Stack>
      </Paper>

      <Dialog open={!!previewInfo} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {previewInfo?.name || 'Preview'}
          <Button onClick={closePreview} color="inherit" size="small">Close</Button>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, textAlign: 'center', bgcolor: 'background.neutral' }}>
          {previewInfo?.url && (
            <img
              src={previewInfo.url}
              alt={previewInfo.name}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const poid = searchParams.get('poid');
  // Default to IPC if not specified
  const inspType = searchParams.get('inspType') ?? 'IPC';
  // isMPCCreated passed from the grid row so Final can be guarded
  const isMPCCreated = Number(searchParams.get('isMPCCreated') ?? 0);

  /** Switches inspection type — updates URL; useEffect re-fires automatically */
  const handleInspTypeChange = (_e, newType) => {
    if (!newType) return; // prevent deselect
    if (newType === 'Final' && isMPCCreated === 0) return; // guard
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('inspType', newType);
      return next;
    });
  };

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
  const { enqueueSnackbar } = useSnackbar();
  const [measurementTypes, setMeasurementTypes] = useState([]);
  const [measurementTypeId, setMeasurementTypeId] = useState('');
  const [specRows, setSpecRows] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [imageMap, setImageMap] = useState({});
  /** QDInspectionDtl matrix (OVERALL CONCLUSION) — synced from API, posted on save. */
  const [dtlRows, setDtlRows] = useState([]);

  // Signature States
  const [sigPopup, setSigPopup] = useState({ open: false, type: '', title: '' });
  const [loadingSign, setLoadingSign] = useState(false);
  const [existingSignUrl, setExistingSignUrl] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState({ QA: false, Vendor: false, Control: false });

  const sizeQtyBreakdown = useMemo(
    () => data?.sizeQtyBreakdown ?? data?.SizeQtyBreakdown ?? [],
    [data]
  );

  /** Legacy: always 12 intermediate columns (+ TOTAL), like dgInspectionDtl. */
  const numMatrixSlots = INSPECTION_DTL_SIZE_SLOTS;

  const matrixColumnTitles = useMemo(() => {
    const sizeRow = dtlRows.find((r) => String(r.sizeType ?? r.SizeType ?? '').trim() === 'SIZE');
    return Array.from({ length: INSPECTION_DTL_SIZE_SLOTS }, (_, i) => {
      if (sizeRow) return getDtlCell(sizeRow, i + 1) || '';
      const b = sizeQtyBreakdown[i];
      return (b?.size ?? b?.Size ?? '').trim() || '';
    });
  }, [dtlRows, sizeQtyBreakdown]);

  useEffect(() => {
    if (!data) return;
    const bd = data.sizeQtyBreakdown ?? data.SizeQtyBreakdown ?? [];
    let rows = (data.inspectionDtlRows ?? data.InspectionDtlRows ?? []).map((r) =>
      padInspectionDtlRowToSlots({ ...r })
    );

    // Normalize existing rows to ensure they have sizeType
    rows = rows.map(r => ({ ...r, sizeType: (r.sizeType ?? r.SizeType ?? '').trim() }));

    // masterList: the set of types we MUST have, in this order.
    const masterList = QD_INSPECTION_DTL_ROW_TYPES_FALLBACK;
    const finalRows = [];

    // For each mandatory type, find if it exists in API rows (case-insensitive)
    masterList.forEach((typeName) => {
      const existing = rows.find(r => r.sizeType.toUpperCase() === typeName.toUpperCase());
      if (existing) {
        finalRows.push(existing);
      } else if (typeName === 'SIZE') {
        const row = emptyInspectionDtlRow('SIZE');
        for (let i = 0; i < INSPECTION_DTL_SIZE_SLOTS; i += 1) {
          const b = bd[i];
          row[`size${i + 1}`] = b ? String(b.size ?? b.Size ?? '').trim() : '';
        }
        finalRows.push(row);
      } else if (typeName === 'ORDER QTY') {
        const row = emptyInspectionDtlRow('ORDER QTY');
        for (let i = 0; i < INSPECTION_DTL_SIZE_SLOTS; i += 1) {
          const b = bd[i];
          const q = b?.quantity ?? b?.Quantity;
          row[`size${i + 1}`] = q == null || q === '' ? '' : String(q);
        }
        row.sizeTotal = sumDtlRowSlots(row, INSPECTION_DTL_SIZE_SLOTS);
        finalRows.push(row);
      } else {
        finalRows.push(emptyInspectionDtlRow(typeName));
      }
    });

    setDtlRows(finalRows);

    // Conditional initial calculation: ONLY if Offer Qty has data
    const orderR = finalRows.find((r) => r.sizeType.trim().toUpperCase() === 'ORDER QTY');
    const offerR = finalRows.find((r) => r.sizeType.trim().toUpperCase() === 'OFFER QTY');
    const balanceR = finalRows.find((r) => r.sizeType.trim().toUpperCase() === 'QTY BALANCE/EXTRA');

    if (orderR && offerR && balanceR) {
      let hasOffer = false;
      for (let i = 1; i <= INSPECTION_DTL_SIZE_SLOTS; i += 1) {
        if (offerR[`size${i}`] !== '') {
          hasOffer = true;
          break;
        }
      }

      if (hasOffer) {
        for (let i = 1; i <= INSPECTION_DTL_SIZE_SLOTS; i += 1) {
          const k = `size${i}`;
          const ord = parseFloat(orderR[k] || 0);
          const off = parseFloat(offerR[k] || 0);
          balanceR[k] = Math.round(ord - off).toString();
        }
        balanceR.sizeTotal = sumDtlRowSlots(balanceR, INSPECTION_DTL_SIZE_SLOTS);
      }
    }
  }, [data]);

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
  const aqlSystems = data?.aqlSystems ?? data?.AqlSystems ?? [];
  const aqlRanges = useMemo(() => data?.aqlRanges ?? data?.AqlRanges ?? [], [data]);
  const bindDef = data?.bindGridDefaults ?? data?.BindGridDefaults;
  const mstId = data?.qdInspectionMstId ?? data?.QdInspectionMstId;
  const snap = data?.savedInspection ?? data?.SavedInspection;
  const colorOptions = useMemo(() => {
    const poLines = data?.poLines ?? data?.PoLines ?? [];
    const raw = [];

    const addColors = (c) => {
      if (!c) return;
      if (Array.isArray(c)) {
        c.forEach(addColors);
      } else {
        String(c)
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
          .forEach((x) => raw.push(x));
      }
    };

    poLines.forEach((r) => addColors(field(r, 'colorway', 'Colorway')));
    addColors(field(h, 'colorway', 'Colorway'));
    addColors(field(snap, 'colorway', 'Colorway'));
    addColors(form?.color);

    return Array.from(new Set(raw));
  }, [data, h, snap, form?.color]);

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

    const suggestedInspNo = String(data?.suggestedInspNo ?? data?.SuggestedInspNo ?? '').trim();
    const headerPono = field(h, 'pONo', 'PONo', 'pono', 'poNo');
    const inspNoDisplay =
      field(snap, 'inspNo', 'InspNo') ||
      suggestedInspNo ||
      (headerPono && inspType ? `${headerPono}-${inspType}-pending` : '');

    setForm({
      inspNo: inspNoDisplay,
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
      color: (field(snap, 'colorway', 'Colorway') || field(h, 'colorway', 'Colorway') || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
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
  }, [data, h, snap, bindDef, firstSystemId, rangesForFirstSystem, inspType]);

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
    
    // 1. Use embedded measurement types if available
    if (data.measurementTypes || data.MeasurementTypes) {
      setMeasurementTypes(data.measurementTypes ?? data.MeasurementTypes ?? []);
    }

    // 2. Load Slot Images in parallel
    if (mstId) {
      const allSlots = [...FUNDAMENTAL_IMAGE_SLOTS, ...COMPLIMENTARY_IMAGE_SLOTS];
      Promise.all(allSlots.map(s => loadSlotImages(s, mstId)))
        .catch(err => console.error("Parallel image slot load error:", err));
    }
    // 3. Load signature statuses
    if (mstId) {
      checkSignatureStatus();
    }
  }, [data, mstId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mstId || !measurementTypeId) {
      if (!measurementTypeId) setSpecRows([]);
      return;
    }
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

  const updateDtlCell = (rowIdx, slot1To12, value) => {
    setDtlRows((prev) => {
      if (!prev[rowIdx]) return prev;
      const next = prev.map((r) => ({ ...r }));
      const label = String(next[rowIdx].sizeType ?? next[rowIdx].SizeType ?? '').trim();
      if (label === 'SIZE') return prev;

      const key = `size${slot1To12}`;
      next[rowIdx][key] = value;
      next[rowIdx].sizeTotal = sumDtlRowSlots(next[rowIdx], INSPECTION_DTL_SIZE_SLOTS);

      // Cascade logic: Order Qty or Offer Qty changes update the Balance row
      const stUpper = label.toUpperCase();
      if (stUpper === 'ORDER QTY' || stUpper === 'OFFER QTY') {
        const orderRow = next.find((r) => (r.sizeType ?? r.SizeType ?? '').trim().toUpperCase() === 'ORDER QTY');
        const offerRow = next.find((r) => (r.sizeType ?? r.SizeType ?? '').trim().toUpperCase() === 'OFFER QTY');
        const balanceRow = next.find((r) => (r.sizeType ?? r.SizeType ?? '').trim().toUpperCase() === 'QTY BALANCE/EXTRA');

        if (orderRow && offerRow && balanceRow) {
          const orderVal = parseFloat(orderRow[key] || 0);
          const offerVal = parseFloat(offerRow[key] || 0);
          balanceRow[key] = Math.round(orderVal - offerVal).toString();
          balanceRow.sizeTotal = sumDtlRowSlots(balanceRow, INSPECTION_DTL_SIZE_SLOTS);
        }
      }

      return next;
    });
  };

  const handlePercChange = (percStr) => {
    setF('calPerc', percStr);
    const perc = parseFloat(percStr);
    if (isNaN(perc)) return;

    setDtlRows((prev) => {
      const next = prev.map((r) => ({ ...r }));
      const orderRow = next.find((r) => (r.sizeType ?? r.SizeType ?? '').trim().toUpperCase() === 'ORDER QTY');
      if (!orderRow) return prev;

      const targetLabels = ['FABRIC IN HOUSE', 'CUT QTY', 'IN-LINE', 'OFF-LINE'];

      next.forEach((row) => {
        const label = (row.sizeType ?? row.SizeType ?? '').trim().toUpperCase();
        if (targetLabels.includes(label)) {
          for (let slot = 1; slot <= INSPECTION_DTL_SIZE_SLOTS; slot += 1) {
            const key = `size${slot}`;
            const orderVal = parseFloat(orderRow[key] || 0);
            row[key] = Math.round(orderVal + (orderVal * perc) / 100).toString();
          }
          row.sizeTotal = sumDtlRowSlots(row, INSPECTION_DTL_SIZE_SLOTS);
        }
      });

      // Recalculate Balance for all columns after percentage update
      const offerRow = next.find((r) => (r.sizeType ?? r.SizeType ?? '').trim().toUpperCase() === 'OFFER QTY');
      const balanceRow = next.find((r) => (r.sizeType ?? r.SizeType ?? '').trim().toUpperCase() === 'QTY BALANCE/EXTRA');
      if (offerRow && balanceRow) {
        for (let slot = 1; slot <= INSPECTION_DTL_SIZE_SLOTS; slot += 1) {
          const key = `size${slot}`;
          const orderVal = parseFloat(orderRow[key] || 0);
          const offerVal = parseFloat(offerRow[key] || 0);
          balanceRow[key] = Math.round(orderVal - offerVal).toString();
        }
        balanceRow.sizeTotal = sumDtlRowSlots(balanceRow, INSPECTION_DTL_SIZE_SLOTS);
      }

      return next;
    });
  };

  const reloadInspection = async () => {
    const { data: res } = await qdApi.get(
      `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}`,
      { params: { inspType } }
    );
    setData(res);
  };

  const handleSave = async (isMainSave) => {
    // Validation: Prevent save if any defect dropdown is "Not OK"
    const defectFields = {
      qtyD: 'Quantity',
      confD: 'Conformity',
      workD: 'Workmanship',
      packD: 'Packing',
    };

    const invalidFieldKey = Object.keys(defectFields).find((k) => form[k] === 'Not OK');
    if (invalidFieldKey) {
      enqueueSnackbar(`Cannot save because "${defectFields[invalidFieldKey]}" is set to "Not OK".`, { variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      const body = buildQdSavePayload(form, discRows, mstId, isMainSave, dtlRows);
      await qdApi.post(
        `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}`,
        body,
        { params: { inspType } }
      );
      await reloadInspection();
      enqueueSnackbar(isMainSave ? 'Saved.' : 'Saved as draft.', { variant: 'success' });
    } catch (e) {
      console.error('Save error response:', e?.response?.data);
      const data = e?.response?.data;
      let msg = e?.message || 'Save failed';
      if (typeof data === 'string') {
        msg = data;
      } else if (data?.errors) {
        msg = Object.entries(data.errors).map(([k, v]) => `${k}: ${v.join(', ')}`).join(' | ');
      } else if (data?.message) {
        msg = data.message;
      } else if (data?.title) {
        msg = data.title;
      }
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = () => {
    const totals = discRows.reduce(
      (acc, r) => ({
        critical: acc.critical + (parseOptionalDecimal(r.critical) || 0),
        major: acc.major + (parseOptionalDecimal(r.major) || 0),
        minor: acc.minor + (parseOptionalDecimal(r.minor) || 0),
      }),
      { critical: 0, major: 0, minor: 0 }
    );
    const sampleSize = calcSampleSize(form.offeredQty, form.reliability);
    const allowCrit = calcAllowedByAql(sampleSize, form.critAql);
    const allowMaj = calcAllowedByAql(sampleSize, form.majAql);
    const allowMin = calcAllowedByAql(sampleSize, form.minAql);
    setForm((prev) => ({
      ...prev,
      criticalQty: String(totals.critical),
      majQty: String(totals.major),
      minQty: String(totals.minor),
      sampleSize: String(sampleSize),
      allowCrit: String(allowCrit),
      allowMaj: String(allowMaj),
      allowMin: String(allowMin),
    }));
  };

  const checkSignatureStatus = async () => {
    const currentMstId = mstId || form.qdInspectionMstId || 0;
    if (!currentMstId) return;
    try {
      const types = ['QA', 'Vendor', 'Control'];
      const results = {};
      await Promise.all(
        types.map(async (type) => {
          try {
            const hasSign = await qdApi.getSignature(poid, currentMstId, type);
            results[type] = !!(hasSign && hasSign.base64Data);
          } catch (e) {
            results[type] = false;
          }
        })
      );
      setSignatureStatus(prev => ({ ...prev, ...results }));
    } catch (err) {
      console.error('Failed to check signature statuses:', err);
    }
  };

  const handleOpenSignature = async (signType, label) => {
    const currentMstId = mstId || 0;
    setSigPopup({ open: true, type: signType, title: label });
    setLoadingSign(true);
    setExistingSignUrl(null);

    try {
      const res = await qdApi.getSignature(poid, currentMstId, signType);
      if (res && res.base64Data) {
        setExistingSignUrl(res.base64Data);
      }
    } catch (err) {
      console.error('Failed to fetch signature:', err);
    } finally {
      setLoadingSign(false);
    }
  };

  const handleSaveSignature = async (base64) => {
    if (!base64) {
      enqueueSnackbar('Please draw a signature before saving.', { variant: 'warning' });
      return;
    }

    try {
      setLoadingSign(true);
      const currentMstId = mstId || 0;

      const payload = {
        base64Data: base64,
        poid,
        qdInspectionMstId: currentMstId,
        signType: sigPopup.type,
        inspType: form.inspectionType || inspType || 'Final'
      };

      await qdApi.saveSignature(poid, payload);
      enqueueSnackbar(`Signature for ${sigPopup.title} saved successfully.`, { variant: 'success' });
      setSignatureStatus(prev => ({ ...prev, [sigPopup.type]: true }));
      setSigPopup({ ...sigPopup, open: false });
    } catch (err) {
      console.error('Failed to save signature:', err);
      enqueueSnackbar(`Failed to save signature: ${err.message || 'Unknown error'}`, { variant: 'error' });
    } finally {
      setLoadingSign(false);
    }
  };

  const openLegacySignPage = (pageName) => {
    if (!LEGACY_WEB_BASE) {
      enqueueSnackbar('Configure VITE_LEGACY_WEB_BASE in .env to open signature pages.', { variant: 'error' });
      return;
    }
    if (!mstId || Number(mstId) <= 0) {
      enqueueSnackbar('Save inspection first, then open signature pages.', { variant: 'error' });
      return;
    }
    const base = LEGACY_WEB_BASE.replace(/\/+$/, '');
    const url =
      `${base}/BusinessProcess/${pageName}?` +
      `lPOID=${encodeURIComponent(poid)}` +
      `&InspType=${encodeURIComponent(inspType)}` +
      `&GeneralID=1` +
      `&lQDInspectionMstID=${encodeURIComponent(mstId)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const loadMeasurementTypes = async () => {
    const { data: mt } = await qdApi.get(
      `/MasterOrderForQDSheet/quality-department-inspection/${encodeURIComponent(poid)}/measurement-types`
    );
    setMeasurementTypes(mt || []);
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
      enqueueSnackbar('Save master and select measurement type first.', { variant: 'error' });
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
      enqueueSnackbar('Size specs saved.', { variant: 'success' });
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

  const uploadSlotImage = async (slot, files) => {
    if (!mstId) {
      enqueueSnackbar('Save master first to upload images.', { variant: 'error' });
      return;
    }
    const q = slotQuery(slot);
    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
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
    }

    await loadSlotImages(slot, mstId);
    enqueueSnackbar(`${slot} images uploaded.`, { variant: 'success' });
  };

  const deleteImage = async (slot, digitalId) => {
    await qdApi.delete(`/MasterOrderForQDSheet/quality-department-inspection/image/${digitalId}`);
    await loadSlotImages(slot, mstId);
  };

  if (!poid) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">Missing poid in URL.</Alert>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <CustomBreadcrumbs
          heading="INSPECTION INFORMATION"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Master Order QD Sheet', href: paths.dashboard.masterOrderForQDSheet },
            { name: 'Inspection' },
          ]}
          sx={{ mb: { xs: 2, md: 3 } }}
        />

        {/* ── InspType Switcher ─────────────────────────────────────────────── */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          flexWrap="wrap"
          gap={2}
          sx={{ mb: 3 }}
        >
          {/* Left: back + title */}
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
            <Typography variant="h6" fontWeight={800} color="text.primary" noWrap>
              {field(h, 'pono', 'poNo', 'pONo', 'PONo') || `POID ${poid}`}
            </Typography>
          </Stack>

          {/* Right: IPC / MPC / Pre-Final / Final toggle */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mr: 0.5 }}>
              Inspection Type:
            </Typography>
            <ToggleButtonGroup
              value={inspType}
              exclusive
              onChange={handleInspTypeChange}
              size="small"
              sx={{ flexWrap: 'wrap' }}
            >
              {['IPC', 'MPC', 'Pre-Final'].map((t) => (
                <ToggleButton
                  key={t}
                  value={t}
                  sx={{
                    px: 2,
                    fontWeight: 700,
                    fontSize: 12,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: 'primary.dark',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  {t}
                </ToggleButton>
              ))}

              {/* Final — disabled if MPC not yet created */}
              <Tooltip
                title={
                  isMPCCreated === 0
                    ? 'Final inspection is locked until MPC is created.'
                    : 'Final Inspection'
                }
                arrow
              >
                <span>
                  <ToggleButton
                    value="Final"
                    disabled={isMPCCreated === 0}
                    sx={{
                      px: 2,
                      fontWeight: 700,
                      fontSize: 12,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.success.main, 0.12),
                        color: 'success.dark',
                        borderColor: 'success.main',
                      },
                      '&.Mui-disabled': { opacity: 0.45 },
                    }}
                  >
                    Final {isMPCCreated === 0 ? '🔒' : ''}
                  </ToggleButton>
                </span>
              </Tooltip>
            </ToggleButtonGroup>

            {/* Status chips removed per request */}
          </Stack>
        </Stack>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof error === 'string' ? error : 'Failed to load inspection data.'}
          </Alert>
        )}

        {!loading && !error && data && !h && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            PO header data not found for POID: <strong>{poid}</strong>. The PO may not exist or may be missing required data.
          </Alert>
        )}

        {!loading && !error && data && h && (
          <Stack spacing={3}>
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
                  <TextField
                    select
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) => selected.join(', '),
                    }}
                    label="Color"
                    fullWidth
                    size="small"
                    value={Array.isArray(form.color) ? form.color : []}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.includes('all')) {
                        const isAllSelected = form.color?.length === colorOptions.length && colorOptions.length > 0;
                        setF('color', isAllSelected ? [] : [...colorOptions]);
                      } else {
                        setF('color', typeof val === 'string' ? val.split(',') : val);
                      }
                    }}
                    helperText={colorOptions.length > 1 ? 'Select PO color(s)' : undefined}
                  >
                    <MenuItem value="all">
                      <Checkbox
                        size="small"
                        checked={form.color?.length === colorOptions.length && colorOptions.length > 0}
                        indeterminate={form.color?.length > 0 && form.color?.length < colorOptions.length}
                      />
                      <Typography variant="body2" fontWeight={600}>Select All</Typography>
                    </MenuItem>
                    {colorOptions.map((c) => (
                      <MenuItem key={c} value={c}>
                        <Checkbox size="small" checked={form.color?.includes(c)} />
                        {c}
                      </MenuItem>
                    ))}
                  </TextField>
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
            // subtitle="Size × quantity matrix (QDInspectionDtl + GetSizeQty): 12 size columns + TOTAL like legacy. If the API sends no matrix rows, they are built from sizeQtyBreakdown. Saves with the main Save button."
            >
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid xs={12} sm={4}>
                  <TextField
                    label="%"
                    fullWidth
                    size="small"
                    placeholder="%"
                    value={form.calPerc ?? ''}
                    onChange={(e) => handlePercChange(e.target.value)}
                  />
                </Grid>
              </Grid>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                Size matrix (legacy dgInspectionDtl)
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', mb: 3 }}>
                <Table size="small" sx={{ minWidth: 895, tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow sx={tableHeadRowSx(theme)}>
                      <TableCell sx={{ width: 160, fontSize: 11, py: 1, px: 1.5, borderRight: 1, borderColor: 'divider' }}>SIZE</TableCell>
                      {Array.from({ length: numMatrixSlots }, (_, i) => (
                        <TableCell key={`h-${i}`} align="center" sx={{ width: 55, fontSize: 11, py: 1, px: 0.5, borderRight: 1, borderColor: 'divider' }}>
                          {matrixColumnTitles[i] || ''}
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ width: 75, fontSize: 11, py: 1, px: 1 }}>
                        TOTAL
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dtlRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={numMatrixSlots + 2}>
                          <Typography variant="body2" color="text.secondary">
                            {loading ? 'Loading matrix…' : 'No matrix data.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dtlRows.map((row, rowIdx) => {
                        const st = String(row.sizeType ?? row.SizeType ?? '').trim();
                        if (st.toUpperCase() === 'SIZE') return null;

                        const isStaticRow = ['ORDER QTY', 'QTY BALANCE/EXTRA'].includes(st.toUpperCase());

                        return (
                          <TableRow
                            key={`${st}-${rowIdx}`}
                            sx={{
                              '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                              ...(isStaticRow && { bgcolor: alpha(theme.palette.primary.main, 0.04) }),
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, fontSize: 11.5, whiteSpace: 'nowrap', py: 0.5, px: 1.5, borderRight: 1, borderColor: 'divider' }}>
                              {st}
                            </TableCell>
                            {Array.from({ length: numMatrixSlots }, (_, si) => {
                              const slot = si + 1;
                              const isReadOnly = ['SIZE', 'ORDER QTY', 'QTY BALANCE/EXTRA'].includes(st.toUpperCase());

                              return (
                                <TableCell key={slot} align="center" sx={{ py: 0.5, px: 0, borderRight: 1, borderColor: 'divider' }}>
                                  <TextField
                                    size="small"
                                    fullWidth
                                    value={getDtlCell(row, slot)}
                                    onChange={(e) => updateDtlCell(rowIdx, slot, e.target.value)}
                                    inputProps={{ readOnly: isReadOnly }}
                                    InputProps={{
                                      sx: {
                                        fontSize: 11.5,
                                        '& .MuiInputBase-input': {
                                          py: 0.5,
                                          px: 0.5,
                                          textAlign: 'center',
                                          ...(isReadOnly && { fontWeight: 700, color: 'text.primary' }),
                                        },
                                      },
                                    }}
                                  />
                                </TableCell>
                              );
                            })}
                            <TableCell align="right" sx={{ py: 0.25, px: 0.25 }}>
                              <TextField
                                size="small"
                                fullWidth
                                value={row.sizeTotal ?? row.SizeTotal ?? ''}
                                disabled
                                InputProps={{
                                  sx: {
                                    fontSize: 11.5,
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    '& .MuiInputBase-input': { py: 0.5, px: 0.5, textAlign: 'center', fontWeight: 800 },
                                  },
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </SectionCard>

            <SectionCard
              title="Accessories Markings"
              headerRight={
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={ACCESSORY_UI_ROWS.every((row) => !!form.acc?.[row.accKey])}
                      indeterminate={
                        ACCESSORY_UI_ROWS.some((row) => !!form.acc?.[row.accKey]) &&
                        !ACCESSORY_UI_ROWS.every((row) => !!form.acc?.[row.accKey])
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => {
                          const newAcc = { ...prev.acc };
                          ACCESSORY_UI_ROWS.forEach((row) => {
                            newAcc[row.accKey] = checked;
                          });
                          return { ...prev, acc: newAcc };
                        });
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                      Select All
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              }
            >
              <Grid container spacing={2}>
                {ACCESSORY_UI_ROWS.map((row) => {
                  const dropKey = row.dropKey ?? row.accKey;
                  const opts = row.options || YES_NO;
                  const dropVal = form.accDrop?.[dropKey] ?? opts[0];
                  return (
                    <Grid key={row.accKey} xs={12} sm={6} md={4}>
                      <Stack direction="column" spacing={0.5} alignItems="flex-start">
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={!!form.acc?.[row.accKey]}
                              onChange={(e) => setAcc(row.accKey, e.target.checked)}
                            />
                          }
                          label={row.label}
                          sx={{
                            m: 0,
                            '& .MuiFormControlLabel-label': {
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'text.primary',
                              lineHeight: 1.2,
                            },
                          }}
                        />
                        {row.textMode ? (
                          <TextField
                            size="small"
                            fullWidth
                            label="Comment"
                            value={form.accText?.[row.textKey] ?? ''}
                            onChange={(e) => setAccText(row.textKey, e.target.value)}
                            placeholder="—"
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiInputBase-root': { height: 40 } }}
                          />
                        ) : (
                          <TextField
                            select
                            size="small"
                            fullWidth
                            label="Comment"
                            value={dropVal}
                            onChange={(e) => setAccDrop(dropKey, e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiInputBase-root': { height: 40 } }}
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

            <SectionCard
              title="Packing"
              headerRight={
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={['cartonDimen', 'cartonMarking', 'cartonThickness', 'netWt', 'grossWt'].every((key) => !!form.pack?.[key])}
                      indeterminate={
                        ['cartonDimen', 'cartonMarking', 'cartonThickness', 'netWt', 'grossWt'].some((key) => !!form.pack?.[key]) &&
                        !['cartonDimen', 'cartonMarking', 'cartonThickness', 'netWt', 'grossWt'].every((key) => !!form.pack?.[key])
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => {
                          const newPack = { ...prev.pack };
                          ['cartonDimen', 'cartonMarking', 'cartonThickness', 'netWt', 'grossWt'].forEach((key) => {
                            newPack[key] = checked;
                          });
                          return { ...prev, pack: newPack };
                        });
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                      Select All
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              }
            >
              <Grid container spacing={2}>
                <Grid xs={12} sm={6} md={4}>
                  <Stack direction="column" spacing={0.5} alignItems="flex-start">
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={!!form.pack?.cartonDimen}
                          onChange={(e) => setPack('cartonDimen', e.target.checked)}
                        />
                      }
                      label="Carton Dimension"
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'text.primary',
                          lineHeight: 1.2,
                        },
                      }}
                    />
                    <TextField
                      size="small"
                      fullWidth
                      label="Remarks"
                      value={form.packText?.cartonDimen ?? ''}
                      onChange={(e) => setPackText('cartonDimen', e.target.value)}
                      placeholder="—"
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                    />
                  </Stack>
                </Grid>
                <Grid xs={12} sm={6} md={4}>
                  <Stack direction="column" spacing={0.5} alignItems="flex-start">
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={!!form.pack?.cartonMarking}
                          onChange={(e) => setPack('cartonMarking', e.target.checked)}
                        />
                      }
                      label="Carton Marking"
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'text.primary',
                          lineHeight: 1.2,
                        },
                      }}
                    />
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Remarks"
                      value={form.packDrop?.cartonMarking ?? CARTON_MARKING_SIDES[0]}
                      onChange={(e) => setPackDrop('cartonMarking', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
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
                  <Stack direction="column" spacing={0.5} alignItems="flex-start">
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={!!form.pack?.cartonThickness}
                          onChange={(e) => setPack('cartonThickness', e.target.checked)}
                        />
                      }
                      label="Carton Thickness"
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'text.primary',
                          lineHeight: 1.2,
                        },
                      }}
                    />
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Remarks"
                      value={form.packDrop?.cartonThickness ?? CARTON_THICKNESS_PLY[0]}
                      onChange={(e) => setPackDrop('cartonThickness', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
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
                  <Stack direction="column" spacing={0.5} alignItems="flex-start">
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={!!form.pack?.netWt}
                          onChange={(e) => setPack('netWt', e.target.checked)}
                        />
                      }
                      label="Net WT"
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'text.primary',
                          lineHeight: 1.2,
                        },
                      }}
                    />
                    <TextField
                      size="small"
                      fullWidth
                      label="Remarks"
                      value={form.packText?.netWt ?? ''}
                      onChange={(e) => setPackText('netWt', e.target.value)}
                      placeholder="—"
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                    />
                  </Stack>
                </Grid>
                <Grid xs={12} sm={6} md={4}>
                  <Stack direction="column" spacing={0.5} alignItems="flex-start">
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={!!form.pack?.grossWt}
                          onChange={(e) => setPack('grossWt', e.target.checked)}
                        />
                      }
                      label="Gross WT"
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'text.primary',
                          lineHeight: 1.2,
                        },
                      }}
                    />
                    <TextField
                      size="small"
                      fullWidth
                      label="Remarks"
                      value={form.packText?.grossWt ?? ''}
                      onChange={(e) => setPackText('grossWt', e.target.value)}
                      placeholder="—"
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard title="Size Specs">
              <Stack spacing={2}>
                <TextField
                  select
                  size="small"
                  label="Type"
                  sx={{ maxWidth: 400 }}
                  value={measurementTypeId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMeasurementTypeId(v);
                    if (!v) setSpecRows([]);
                  }}
                >
                  <MenuItem value="">Select</MenuItem>
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

                {measurementTypeId ? (
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                      <Button variant="outlined" onClick={saveSpecs} disabled={!mstId || savingSpecs}>
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
                    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
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
                                <TextField
                                  size="small"
                                  value={r.measurements}
                                  onChange={(e) => setSpec(idx, 'measurements', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={r.tolerance}
                                  onChange={(e) => setSpec(idx, 'tolerance', e.target.value)}
                                />
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
                  </Stack>
                ) : null}
              </Stack>
            </SectionCard>

            <SectionCard title="DISCREPANCIES">
              <Stack spacing={2}>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={tableHeadRowSx(theme)}>
                        <TableCell sx={{ width: '33.3%' }}>During inspection found following discrepancies</TableCell>
                        <TableCell sx={{ width: '25%' }}>Remarks</TableCell>
                        <TableCell sx={{ width: '13.9%' }} align="center">Critical</TableCell>
                        <TableCell sx={{ width: '13.9%' }} align="center">Major</TableCell>
                        <TableCell sx={{ width: '13.9%' }} align="center">Minor</TableCell>
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

                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 3 }}>
                  <Grid container spacing={2}>
                    {/* Left: Calculate + Total Labels - Roughly 33.3% (sm=4) */}
                    <Grid xs={12} sm={2.5}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleCalculate}
                        fullWidth
                        sx={{ height: 48, fontSize: 16, fontWeight: 700 }}
                      >
                        Calculate
                      </Button>
                    </Grid>

                    <Grid xs={12} sm={1.5} sx={{ textAlign: 'center', pt: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                        Total
                      </Typography>
                    </Grid>

                    {/* Matrix Columns: Sample Size, Critical, Major, Minor */}
                    {[
                      {
                        key: 'sampleSize',
                        label: 'Sample Size',
                        value: form.sampleSize,
                        subValueKey: 'reliability',
                        subItems: RELIABILITY,
                        isBlue: true,
                        isAllowedLabel: true,
                        sm: 3, // Roughly 25% (Matches Remarks)
                      },
                      {
                        key: 'criticalQty',
                        label: 'Critical',
                        value: form.criticalQty,
                        subValueKey: 'critAql',
                        subItems: AQL_LEVEL_MENU_ITEMS,
                        allowedKey: 'allowCrit',
                        defVal: '0.0',
                        sm: 1.66, // Roughly 13.9%
                      },
                      {
                        key: 'majQty',
                        label: 'Major',
                        value: form.majQty,
                        subValueKey: 'majAql',
                        subItems: AQL_LEVEL_MENU_ITEMS,
                        allowedKey: 'allowMaj',
                        defVal: '2.5',
                        sm: 1.66, // Roughly 13.9%
                      },
                      {
                        key: 'minQty',
                        label: 'Minor',
                        value: form.minQty,
                        subValueKey: 'minAql',
                        subItems: AQL_LEVEL_MENU_ITEMS,
                        allowedKey: 'allowMin',
                        defVal: '4.0',
                        sm: 1.66, // Roughly 13.9%
                      },
                    ].map((col) => (
                      <Grid key={col.key} xs={6} sm={col.sm} sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>
                          {col.label}
                        </Typography>

                        {/* Value Box */}
                        <Box
                          sx={{
                            mb: 2,
                            p: 1.5,
                            borderRadius: 1,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 16,
                            bgcolor: col.isBlue ? alpha(theme.palette.primary.main, 0.45) : 'action.hover',
                            color: col.isBlue ? 'primary.contrastText' : 'text.primary',
                            border: col.isBlue ? 'none' : 1,
                            borderColor: 'divider',
                          }}
                        >
                          {col.value || '0'}
                        </Box>

                        {/* Dropdown / Sub-info */}
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={
                            col.subValueKey === 'reliability'
                              ? form.reliability ?? 'II'
                              : normalizeAqlFieldValue(form[col.subValueKey] != null && form[col.subValueKey] !== '' ? form[col.subValueKey] : col.defVal)
                          }
                          onChange={(e) => setF(col.subValueKey, e.target.value)}
                          sx={{
                            mb: col.isAllowedLabel || col.allowedKey ? 2 : 0,
                            '& .MuiInputBase-root': {
                              height: 48,
                              bgcolor: 'action.selected',
                              fontWeight: 700,
                              fontSize: 16,
                            },
                            '& .MuiSelect-select': { py: 0 },
                          }}
                        >
                          {(col.subItems || []).map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.label}
                            </MenuItem>
                          ))}
                        </TextField>

                        {/* Allowed Row Label / Value */}
                        {col.isAllowedLabel && (
                          <Typography variant="subtitle2" sx={{ mt: 1.5, fontWeight: 700, color: 'text.secondary' }}>
                            Allowed
                          </Typography>
                        )}

                        {col.allowedKey && (
                          <Box
                            sx={{
                              height: 48,
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 16,
                              bgcolor: 'background.paper',
                              border: 1,
                              borderColor: 'divider',
                            }}
                          >
                            {form[col.allowedKey] || '0'}
                          </Box>
                        )}
                      </Grid>
                    ))}
                  </Grid>

                  <Grid container spacing={2} sx={{ mt: 3 }} alignItems="flex-end">
                    <Grid xs={12} md={7.5}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>
                        Remarks
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        size="small"
                        value={form.qaRemarks ?? ''}
                        onChange={(e) => setF('qaRemarks', e.target.value)}
                        placeholder="Write remarks here..."
                      />
                    </Grid>

                    <Grid xs={12} md={4.5}>
                      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                        {[
                          { type: 'QA', label: 'QA Sign', key: 'QA' },
                          { type: 'Vendor', label: 'V Sign', key: 'Vendor' },
                          { type: 'Control', label: 'M QA Sign', key: 'Control' },
                        ].map((btn) => {
                          const isSigned = signatureStatus[btn.key];
                          return (
                            <Button
                              key={btn.type}
                              variant="contained"
                              sx={{
                                bgcolor: isSigned ? '#211f4d' : alpha('#403d6d', 0.15),
                                color: isSigned ? 'white' : '#403d6d',
                                '&:hover': {
                                  bgcolor: isSigned ? '#1a1840' : alpha('#403d6d', 0.25),
                                },
                                fontWeight: 700,
                                minWidth: 100,
                                border: isSigned ? 'none' : '1px solid',
                                borderColor: alpha('#403d6d', 0.3),
                              }}
                              onClick={() => handleOpenSignature(btn.type, btn.label)}
                            >
                              {btn.label}
                            </Button>
                          );
                        })}
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Default sample size band from PO qty: {bindDef?.defaultSampleSize ?? bindDef?.DefaultSampleSize ?? '—'} · Range label
                    (first system, index {bindDef?.defaultRangeIndex ?? bindDef?.DefaultRangeIndex ?? '—'}): {defaultRangeLabel || '—'}
                  </Typography> */}
                </Box>


              </Stack>
            </SectionCard>

            <SectionCard
              title="FUNDAMENTAL IMAGES"

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
      <SignaturePopup
        open={sigPopup.open}
        title={sigPopup.title}
        existingSign={existingSignUrl}
        onClose={() => setSigPopup({ ...sigPopup, open: false })}
        onSave={handleSaveSignature}
      />
    </>
  );
}
