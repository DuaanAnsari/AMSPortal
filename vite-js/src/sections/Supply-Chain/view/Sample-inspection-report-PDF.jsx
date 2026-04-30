import PropTypes from 'prop-types';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer';

// Legacy Crystal `InspectionProcessReport.rpt` layout (2 pages) — demo data merged with `data` from grid.

const GRAY = '#d3d3d3';
const BLACK = '#000000';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 7.5,
    paddingTop: 22,
    paddingBottom: 28,
    paddingHorizontal: 22,
    color: BLACK,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logoBlock: { width: '40%', alignSelf: 'flex-start' },
  /** Match app header logo (`src/components/logo/logo.jsx` → `/logo/AMSlogo.png`). */
  amsLogoImage: { width: 150, height: 50, objectFit: 'contain' },
  printed: { fontSize: 7, textAlign: 'right' },
  reportTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  tableBorder: { borderWidth: 0.75, borderColor: BLACK, borderStyle: 'solid' },
  metaRow: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: BLACK, borderBottomStyle: 'solid' },
  metaLab: {
    width: '14%',
    backgroundColor: GRAY,
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    borderRightWidth: 0.75,
    borderRightColor: BLACK,
    borderRightStyle: 'solid',
  },
  metaVal: {
    width: '36%',
    padding: 4,
    fontSize: 7,
    borderRightWidth: 0.75,
    borderRightColor: BLACK,
    borderRightStyle: 'solid',
  },
  sectionBar: {
    backgroundColor: GRAY,
    borderWidth: 0.75,
    borderColor: BLACK,
    borderStyle: 'solid',
    padding: 5,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
  },
  teGrid: {
    flexDirection: 'row',
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: BLACK,
    borderStyle: 'solid',
  },
  teCol: { flex: 1, padding: 5, borderRightWidth: 0.75, borderRightColor: BLACK, borderRightStyle: 'solid' },
  teItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  labGray: {
    backgroundColor: GRAY,
    padding: 3,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    borderWidth: 0.75,
    borderColor: BLACK,
    borderStyle: 'solid',
    marginTop: 6,
    width: '18%',
  },
  boxWhite: {
    borderWidth: 0.75,
    borderColor: BLACK,
    borderStyle: 'solid',
    padding: 5,
    minHeight: 36,
    marginTop: 2,
    fontSize: 7,
  },
  subBar: {
    backgroundColor: GRAY,
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: BLACK,
    borderStyle: 'solid',
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
  },
  fdmrCountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: BLACK,
    borderStyle: 'solid',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tblHead: {
    flexDirection: 'row',
    backgroundColor: GRAY,
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: BLACK,
    borderStyle: 'solid',
  },
  tblCell: {
    borderRightWidth: 0.75,
    borderRightColor: BLACK,
    borderRightStyle: 'solid',
    padding: 3,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    textAlign: 'center',
  },
  tblRow: {
    flexDirection: 'row',
    borderLeftWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: BLACK,
    borderStyle: 'solid',
  },
  tblCellN: {
    borderRightWidth: 0.75,
    borderRightColor: BLACK,
    borderRightStyle: 'solid',
    padding: 3,
    fontSize: 6.5,
  },
  gsmRow: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  gsmItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  gsmLab: { fontFamily: 'Helvetica-Bold', fontSize: 7, marginRight: 4 },
  fabAprRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  page2Box: { borderWidth: 0.75, borderColor: BLACK, borderStyle: 'solid', marginTop: 8 },
  page2Head: {
    backgroundColor: GRAY,
    padding: 6,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    borderBottomWidth: 0.75,
    borderBottomColor: BLACK,
    borderBottomStyle: 'solid',
  },
  page2Body: { flexDirection: 'row', padding: 8, minHeight: 120 },
  supLab: { width: '22%', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  chkList: { flex: 1, paddingLeft: 6 },
  chkLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  signArea: { marginTop: 16, alignItems: 'flex-end', paddingRight: 12 },
  signLine: { width: 120, borderTopWidth: 0.75, borderTopColor: BLACK, borderTopStyle: 'solid', marginBottom: 2 },
  signCap: { fontSize: 6.5, textAlign: 'center', width: 120 },
});

const TE_LABELS = [
  ['MEASURE TO SPEC', 'FABRIC WEIGHT', 'COMPONENTS'],
  ['GARMENT FIT', 'FABRIC COLOR MATCH', 'EMBELLISHMENT'],
  ['FABRIC QUALITY/HAND', 'CONSTRUCTION', 'LABELING'],
  ['FABRIC WASH TEST', 'SEWING QUALITY', ''],
];

/** API field per cell [row][col] — aligned with `TE_LABELS` (same order as legacy report). */
const TE_GRID_API_KEYS = [
  ['tE_MeasureToSpec', 'tE_FabricWeight', 'tE_Components'],
  ['tE_GarmentFit', 'tE_FabricColorMatch', 'tE_Embellishment'],
  ['tE_FabricQuality', 'tE_Construction', 'tE_Labeling'],
  ['tE_FabricWashTest', 'tE_SewingQuality', null],
];

/**
 * Safe “checked” for inspection TE flags (.NET may send bool, 1/0, "true"/"false", null).
 * `undefined` / `null` / other → false (no tick).
 */
export function isChecked(val) {
  if (val === true || val === 1 || val === '1') return true;
  if (val === 'true') return true;
  if (typeof val === 'string' && val.trim().toLowerCase() === 'true') return true;
  return false;
}

/**
 * Always read master from `apiResponse.master` / `Master`, merge root `tE_*`, parse JSON string if needed.
 */
export function resolveInspectionPdfMaster(apiResponse) {
  const raw = apiResponse && typeof apiResponse === 'object' ? apiResponse : {};
  let inner = raw.master ?? raw.Master;
  if (typeof inner === 'string') {
    try {
      inner = JSON.parse(inner);
    } catch {
      inner = {};
    }
  }
  if (inner == null || typeof inner !== 'object' || Array.isArray(inner)) inner = {};
  const out = { ...inner };
  Object.keys(raw).forEach((key) => {
    if (key === 'details' || key === 'Details' || key === 'specs' || key === 'Specs' || key === 'logoDataUrl')
      return;
    if (key.startsWith('tE_')) out[key] = raw[key];
  });
  return out;
}

/** Backend often wraps body as `{ data: { master, tE_* } }` — flatten for PDF + TE flags. */
function normalizeGetPdfPayload(body) {
  if (!body || typeof body !== 'object') return {};
  const wrapKeys = ['data', 'Data', 'result', 'Result', 'payload', 'Payload'];
  for (let i = 0; i < wrapKeys.length; i += 1) {
    const inner = body[wrapKeys[i]];
    if (!inner || typeof inner !== 'object' || Array.isArray(inner)) continue;
    const looksInspection =
      inner.master != null ||
      inner.Master != null ||
      inner.details != null ||
      inner.Details != null ||
      inner.specs != null ||
      inner.Specs != null ||
      Object.keys(inner).some((k) => k.startsWith('tE_'));
    if (looksInspection) return { ...body, ...inner };
  }
  return body;
}

/** True if resolved master actually carries any TE key (so we paint ticks from API, not demo grid). */
function pdfMasterHasAnyTeKey(m) {
  if (!m || typeof m !== 'object') return false;
  for (let ri = 0; ri < TE_GRID_API_KEYS.length; ri += 1) {
    for (let ci = 0; ci < 3; ci += 1) {
      const k = TE_GRID_API_KEYS[ri][ci];
      if (k != null && Object.prototype.hasOwnProperty.call(m, k)) return true;
    }
  }
  return false;
}

/** Fallback if `logoDataUrl` was not embedded (e.g. server render). */
function amsLogoPdfSrc() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/logo/AMSlogo.png`;
  }
  return '/logo/AMSlogo.png';
}

/** Prefer `logoDataUrl` (base64) — @react-pdf reliably renders embedded PNGs; plain URLs often fail in the worker. */
function AmsLogoMark({ logoDataUrl }) {
  const src = logoDataUrl || amsLogoPdfSrc();
  return (
    <View style={styles.logoBlock}>
      <Image src={src} style={styles.amsLogoImage} />
    </View>
  );
}

AmsLogoMark.propTypes = { logoDataUrl: PropTypes.string };

function CheckBox({ checked }) {
  return (
    <View
      style={{
        width: 9,
        height: 9,
        borderWidth: 0.75,
        borderColor: BLACK,
        borderStyle: 'solid',
        marginRight: 4,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {checked ? (
        <Svg viewBox="0 0 24 24" width={7} height={7}>
          <Path
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
            fill={BLACK}
          />
        </Svg>
      ) : null}
    </View>
  );
}

CheckBox.propTypes = { checked: PropTypes.bool };

function RadioPair({ approved, rejected }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
        <CheckBox checked={approved} />
        <Text style={{ fontSize: 6, marginLeft: 2 }}>YES</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CheckBox checked={rejected} />
        <Text style={{ fontSize: 6, marginLeft: 2 }}>NO</Text>
      </View>
    </View>
  );
}

RadioPair.propTypes = { approved: PropTypes.bool, rejected: PropTypes.bool };

/** Read first non-empty candidate from object (API camel / Pascal). */
function pickField(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (const k of keys) {
    if (k == null) continue;
    const v = obj[k];
    if (v != null && v !== '') return v;
  }
  return '';
}

function formatPdfDate(value) {
  if (value == null || value === '') return '';
  try {
    const t = new Date(value).getTime();
    if (Number.isNaN(t)) return String(value);
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

/** TE grid keys [col][row] aligned with `TE_LABELS` in this file. */
const TE_MASTER_KEY_GRID = [
  [
    ['tE_MeasureToSpec', 'teMeasureToSpec', 'TeMeasureToSpec'],
    ['tE_FabricWeight', 'teFabricWeight', 'TeFabricWeight'],
    ['tE_Components', 'teComponents', 'TeComponents'],
  ],
  [
    ['tE_GarmentFit', 'teGarmentFit', 'TeGarmentFit'],
    ['tE_FabricColorMatch', 'teFabricColorMatch', 'TeFabricColorMatch'],
    ['tE_Embellishment', 'teEmbellishment', 'TeEmbellishment'],
  ],
  [
    ['tE_FabricQuality', 'teFabricQuality', 'TeFabricQuality'],
    ['tE_Construction', 'teConstruction', 'TeConstruction'],
    ['tE_Labeling', 'teLabeling', 'TeLabeling'],
  ],
  [
    ['tE_FabricWashTest', 'teFabricWashTest', 'TeFabricWashTest'],
    ['tE_SewingQuality', 'teSewingQuality', 'TeSewingQuality'],
    [],
  ],
];

function buildTeChecksFromMaster(master) {
  const m = master || {};
  const te = { col0: [], col1: [], col2: [] };
  TE_MASTER_KEY_GRID.forEach((row, ri) => {
    for (let ci = 0; ci < 3; ci += 1) {
      const keys = row[ci];
      const checked =
        Array.isArray(keys) && keys.length > 0 ? keys.some((k) => isChecked(m[k])) : false;
      te[`col${ci}`][ri] = checked;
    }
  });
  return te;
}

function extractSpecSizeCells(s) {
  const src = s || {};
  const cells = [];
  for (let i = 1; i <= 10; i += 1) {
    cells.push(
      String(
        src[`col${i}`] ??
          src[`Col${i}`] ??
          src[`spec${i}`] ??
          src[`Spec${i}`] ??
          src[`qCol${i}`] ??
          src[`QCol${i}`] ??
          ''
      )
    );
  }
  return cells;
}

/**
 * Map `GET /api/InspectionProcess/GetPdfData/{id}` body → props for this document.
 * @param {object} pdfResponse — `{ master?, Master?, details?, Details?, specs?, Specs? }`
 * @param {object} [extra] — e.g. `{ logoDataUrl }`
 */
export function buildPdfDataFromGetPdfResponse(pdfResponse, extra = {}) {
  const master = resolveInspectionPdfMaster(pdfResponse);
  const details = pdfResponse?.details ?? pdfResponse?.Details ?? [];
  const specs = pdfResponse?.specs ?? pdfResponse?.Specs ?? [];
  const list = Array.isArray(details) ? details : [];
  const fabricRows = list.map((item, i) => {
    const ia = item?.isApprove ?? item?.IsApprove;
    const approved = ia === true || ia === 1 || ia === '1';
    const rejected = ia === false || ia === 0 || ia === '0';
    return {
      sno: i + 1,
      test: pickField(item, 'fabricTests', 'FabricTests', 'fabricTest', 'FabricTest'),
      approved,
      rejected,
      comments: pickField(item, 'fabricComments', 'FabricComments', 'comments', 'Comments'),
    };
  });

  const specsArr = Array.isArray(specs) ? specs : [];
  let measurementRows = specsArr.map((s, idx) => ({
    no: String(idx + 1),
    point: pickField(s, 'measurementPoints', 'MeasurementPoints', 'point', 'Point'),
    tol: pickField(s, 'tolerance', 'Tolerance', 'tol', 'Tol'),
    sizes: extractSpecSizeCells(s),
  }));

  const fdmrNoteStr = String(
    pickField(master, 'fdmR_Comments', 'fdmrComments', 'FdmrComments', 'FdmR_Comments') || ''
  ).trim();

  if (measurementRows.length === 0 && fdmrNoteStr) {
    measurementRows = [{ no: '1', point: fdmrNoteStr, tol: '', sizes: Array.from({ length: 10 }, () => '') }];
  } else if (measurementRows.length === 0) {
    measurementRows = [{ no: '', point: '', tol: '', sizes: Array.from({ length: 10 }, () => '') }];
  }

  const fdmrCountVal = master.fdmrCount ?? master.FdmrCount;
  const fdmrCount =
    fdmrCountVal != null && fdmrCountVal !== '' && !Number.isNaN(Number(fdmrCountVal))
      ? Number(fdmrCountVal)
      : fdmrNoteStr
        ? String(fdmrNoteStr).split(/\r?\n/).filter((l) => l.trim()).length || 1
        : 0;

  const tableUsesFdmrNoteAsRow = specsArr.length === 0 && Boolean(fdmrNoteStr);

  const fa = master.fabricApproved ?? master.FabricApproved;
  const fabricApprovedYes = fa === true || fa === 1 || fa === '1';

  return {
    printedOn: new Date().toLocaleDateString(),
    receivedDateFull: formatPdfDate(pickField(master, 'receivedDate', 'ReceivedDate')),
    reviewDateFull: formatPdfDate(pickField(master, 'reviewDate', 'ReviewDate')),
    inspType:
      pickField(master, 'insp_Type', 'inspType', 'Insp_Type', 'InspType', 'INSPECTION_TYPE') || 'PP Sample',
    inspAutoNo: pickField(master, 'inspAutoNo', 'InspAutoNo'),
    pono: pickField(master, 'pono', 'PONO', 'poNo', 'PoNo'),
    venderName: pickField(master, 'venderName', 'vendorName', 'VenderName', 'VendorName', 'supplierName', 'SupplierName'),
    supplierContact: pickField(master, 'supplierContact', 'SupplierContact'),
    styleNo: pickField(master, 'styleNo', 'StyleNo'),
    styleName: pickField(master, 'styleName', 'StyleName'),
    coo: pickField(master, 'coo', 'COO', 'cOO'),
    savedInSeason: pickField(master, 'savedInSession', 'SavedInSession', 'savedInSeason', 'SavedInSeason'),
    sampleType: pickField(master, 'sampleType', 'SampleType'),
    teChecks: buildTeChecksFromMaster(master),
    teComments: pickField(master, 'tE_Comments', 'teComments', 'TeComments'),
    fdmrCount,
    fdmrNote: tableUsesFdmrNoteAsRow ? '' : fdmrNoteStr,
    showMeasurementSpecs: true,
    measurementRows,
    fabricRows,
    fabricStandardGsm: pickField(master, 'fabricStandardGsm', 'FabricStandardGsm', 'fabricStandardGSM'),
    actualWeightGsm: pickField(master, 'actualWeightGsm', 'ActualWeightGsm', 'actualWeightGSM'),
    fabricApprovedYes,
    constructionFit: pickField(master, 'constructionFitComments', 'ConstructionFitComments'),
    embellishment: pickField(master, 'embellishmentComments', 'EmbellishmentComments'),
    generalComments: pickField(master, 'generalComments', 'GeneralComments'),
    asiChecks: {
      garmentRejected:
        isChecked(master?.asI_GarmentRejected) || isChecked(master?.asiGarmentRejected),
      proceedSalesChanges:
        isChecked(master?.asI_ProceedToSales) || isChecked(master?.asiProceedToSales),
      proceedSales:
        isChecked(master?.asI_ProceedWithSales) || isChecked(master?.asiProceedWithSales),
      proceedProduction:
        isChecked(master?.asI_ProceedWithProd) || isChecked(master?.asiProceedWithProd),
      garmentApprovedWait:
        isChecked(master?.asI_GarmentApproved) || isChecked(master?.asiGarmentApproved),
    },
    logoDataUrl: extra?.logoDataUrl ?? pdfResponse?.logoDataUrl,
    __fromApi: true,
  };
}

const PDF_DEMO_DEFAULTS = {
  printedOn: new Date().toLocaleDateString('en-US'),
  receivedDateFull: '05/12/2023 00:00:00',
  supplierContact: 'COMFORT Apparel',
  styleNo: 'LR2096',
  coo: 'Test coo',
  styleName: 'Test style name',
  savedInSeason: 'Test saved in season',
  sampleType: 'Test sample',
  reviewDateFull: '29/12/2023 00:00:00',
  teChecks: {
    col0: [true, true, false, false],
    col1: [false, false, false, true],
    col2: [false, false, false, false],
  },
  teComments: 'test Comments',
  fdmrCount: 0,
  fdmrNote: 'Test finished dim',
  measurementRows: [{ no: '1', point: '', tol: '', sizes: Array.from({ length: 10 }, () => '') }],
  fabricRows: [
    { sno: 1, test: 'Fabric Finish / Hand', approved: true, rejected: false, comments: 'Test comment' },
    { sno: 2, test: 'Wash Test - Shrink', approved: false, rejected: true, comments: 'Test comment 2' },
    { sno: 3, test: 'Wash Test - Pilling', approved: true, rejected: false, comments: 'Test 3' },
  ],
  fabricStandardGsm: '100',
  actualWeightGsm: '200',
  fabricApprovedYes: true,
  constructionFit: 'test Construction Fit',
  embellishment: 'test Embellishment',
  generalComments: 'test General Comments',
  asiChecks: {
    garmentRejected: true,
    proceedSalesChanges: true,
    proceedSales: false,
    proceedProduction: true,
    garmentApprovedWait: false,
  },
};

/** Demo merge — `...d` last used to wipe defaults; use defaults first then selective overrides. */
function mergeDemo(data) {
  const d = data || {};
  return {
    ...PDF_DEMO_DEFAULTS,
    ...d,
    printedOn: d.printedOn || PDF_DEMO_DEFAULTS.printedOn,
    receivedDateFull: d.receivedDateFull || PDF_DEMO_DEFAULTS.receivedDateFull,
    supplierContact: d.supplierContact || PDF_DEMO_DEFAULTS.supplierContact,
    styleNo: d.styleNo || PDF_DEMO_DEFAULTS.styleNo,
    coo: d.coo || PDF_DEMO_DEFAULTS.coo,
    styleName: d.styleName || PDF_DEMO_DEFAULTS.styleName,
    savedInSeason: d.savedInSeason || PDF_DEMO_DEFAULTS.savedInSeason,
    sampleType: d.sampleType || PDF_DEMO_DEFAULTS.sampleType,
    reviewDateFull: d.reviewDateFull || PDF_DEMO_DEFAULTS.reviewDateFull,
    teComments: d.teComments || PDF_DEMO_DEFAULTS.teComments,
    fdmrNote: d.fdmrNote || PDF_DEMO_DEFAULTS.fdmrNote,
    teChecks: d.teChecks ?? PDF_DEMO_DEFAULTS.teChecks,
    fabricRows:
      Array.isArray(d.fabricRows) && d.fabricRows.length > 0 ? d.fabricRows : PDF_DEMO_DEFAULTS.fabricRows,
    measurementRows:
      Array.isArray(d.measurementRows) && d.measurementRows.length > 0
        ? d.measurementRows
        : PDF_DEMO_DEFAULTS.measurementRows,
    asiChecks: d.asiChecks ?? PDF_DEMO_DEFAULTS.asiChecks,
    fabricApprovedYes: d.fabricApprovedYes ?? PDF_DEMO_DEFAULTS.fabricApprovedYes,
    constructionFit: d.constructionFit || PDF_DEMO_DEFAULTS.constructionFit,
    embellishment: d.embellishment || PDF_DEMO_DEFAULTS.embellishment,
    generalComments: d.generalComments || PDF_DEMO_DEFAULTS.generalComments,
    showMeasurementSpecs: d.showMeasurementSpecs ?? true,
  };
}

/**
 * @param {object} props.data — grid row + optional overrides; merged with demo defaults.
 */
function shouldUseApiPdfPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.__fromApi === true) return true;
  if (payload.master != null || payload.Master != null) return true;
  return Object.keys(payload).some((k) => k.startsWith('tE_'));
}

export default function SampleInspectionReportPDF({ data }) {
  const raw = normalizeGetPdfPayload(data ?? {});
  const pdfMaster = resolveInspectionPdfMaster(raw);
  const useApiPdf = shouldUseApiPdfPayload(raw);
  const tePaintFromMaster = useApiPdf || pdfMasterHasAnyTeKey(pdfMaster);
  const d = useApiPdf
    ? buildPdfDataFromGetPdfResponse(raw, { logoDataUrl: raw?.logoDataUrl })
    : mergeDemo(raw);
  const inspType = d.inspType || 'PP Sample';
  const title = `${inspType} Sample Inspection Report`;

  const te = d.teChecks;

  return (
    <Document title={title}>
      {/* —— Page 1 —— */}
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <AmsLogoMark logoDataUrl={d.logoDataUrl} />
          <Text style={styles.printed}>Printed on {d.printedOn}</Text>
        </View>

        <Text style={styles.reportTitle}>{title}</Text>

        <View style={styles.tableBorder}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLab}>Received Date:</Text>
            <Text style={styles.metaVal}>{d.receivedDateFull}</Text>
            <Text style={styles.metaLab}>Supplier/Contact:</Text>
            <Text style={styles.metaVal}>{d.supplierContact}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLab}>Style Number:</Text>
            <Text style={styles.metaVal}>{d.styleNo}</Text>
            <Text style={styles.metaLab}>COO:</Text>
            <Text style={styles.metaVal}>{d.coo}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLab}>Style Name:</Text>
            <Text style={styles.metaVal}>{d.styleName}</Text>
            <Text style={styles.metaLab}>Saved in Season:</Text>
            <Text style={styles.metaVal}>{d.savedInSeason}</Text>
          </View>
          <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.metaLab}>Sample Type:</Text>
            <Text style={styles.metaVal}>{d.sampleType}</Text>
            <Text style={styles.metaLab}>Review Date:</Text>
            <Text style={styles.metaVal}>{d.reviewDateFull}</Text>
          </View>
        </View>

        <Text style={styles.sectionBar}>
          TESTING AND EVALUATION to be PERFORMED (check all that apply)
        </Text>
        <View style={styles.teGrid}>
          {[0, 1, 2].map((ci) => (
            <View key={ci} style={[styles.teCol, ci === 2 ? { borderRightWidth: 0 } : {}]}>
              {TE_LABELS.map((rowLabs, ri) => {
                const lab = rowLabs[ci];
                if (!lab) return <View key={ri} style={{ height: 10 }} />;
                const apiKey = TE_GRID_API_KEYS[ri][ci];
                const checked =
                  tePaintFromMaster && apiKey
                    ? isChecked(pdfMaster?.[apiKey])
                    : Boolean(te[`col${ci}`]?.[ri]);
                return (
                  <View key={ri} style={styles.teItem}>
                    <CheckBox checked={checked} />
                    <Text style={{ fontSize: 7, marginLeft: 2 }}>{lab}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <Text style={styles.labGray}>Comments:</Text>
        <View style={styles.boxWhite}>
          <Text>{d.teComments}</Text>
        </View>

        <Text style={styles.sectionBar}>FINISHED DIMENSION MEASUREMENT RESULTS</Text>
        <Text style={styles.subBar}>MEASUREMENT THAT DO NOT MEET REQUIRED SPEC:</Text>
        <View style={styles.fdmrCountRow}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', textAlign: 'center', width: '100%' }}>
            {`- (${d.fdmrCount ?? 0})`}
          </Text>
        </View>
        {d.showMeasurementSpecs !== false ? (
          <>
            <View style={styles.tblHead}>
              <Text style={[styles.tblCell, { width: '6%' }]}>No.</Text>
              <Text style={[styles.tblCell, { width: '22%' }]}>Measurement Points</Text>
              <Text style={[styles.tblCell, { width: '8%' }]}>TOL+/-</Text>
              {Array.from({ length: 10 }, (_, i) => (
                <Text key={i} style={[styles.tblCell, { width: '6.4%', borderRightWidth: i === 9 ? 0 : 0.75 }]}>
                  {' '}
                </Text>
              ))}
            </View>
            {(d.measurementRows || []).map((m, i) => (
              <View key={i} style={styles.tblRow}>
                <Text style={[styles.tblCellN, { width: '6%', textAlign: 'center' }]}>{m.no}</Text>
                <Text style={[styles.tblCellN, { width: '22%' }]}>{m.point}</Text>
                <Text style={[styles.tblCellN, { width: '8%', textAlign: 'center' }]}>{m.tol}</Text>
                {(m.sizes || Array(10).fill('')).slice(0, 10).map((cell, j) => (
                  <Text
                    key={j}
                    style={[
                      styles.tblCellN,
                      { width: '6.4%', textAlign: 'center', borderRightWidth: j === 9 ? 0 : 0.75 },
                    ]}
                  >
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
          </>
        ) : null}
        {String(d.fdmrNote || '').trim() ? (
          <View style={styles.boxWhite}>
            <Text>{d.fdmrNote}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionBar}>FABRIC TESTING AND GARMENT FEEDBACK</Text>
        <View style={styles.tblHead}>
          <Text style={[styles.tblCell, { width: '6%' }]}>S.NO.</Text>
          <Text style={[styles.tblCell, { width: '34%', textAlign: 'left', paddingLeft: 4 }]}>FABRIC TESTS</Text>
          <Text style={[styles.tblCell, { width: '12%' }]}>APPROVED</Text>
          <Text style={[styles.tblCell, { width: '12%' }]}>REJECTED</Text>
          <Text style={[styles.tblCell, { width: '36%', borderRightWidth: 0, textAlign: 'left', paddingLeft: 4 }]}>
            COMMENTS
          </Text>
        </View>
        {d.fabricRows.map((fr) => (
          <View key={fr.sno} style={styles.tblRow}>
            <Text style={[styles.tblCellN, { width: '6%', textAlign: 'center' }]}>{fr.sno}</Text>
            <Text style={[styles.tblCellN, { width: '34%' }]}>{fr.test}</Text>
            <View style={[styles.tblCellN, { width: '12%', justifyContent: 'center' }]}>
              <CheckBox checked={fr.approved} />
            </View>
            <View style={[styles.tblCellN, { width: '12%', justifyContent: 'center' }]}>
              <CheckBox checked={fr.rejected} />
            </View>
            <Text style={[styles.tblCellN, { width: '36%', borderRightWidth: 0 }]}>{fr.comments}</Text>
          </View>
        ))}

        <View style={styles.gsmRow}>
          <View style={styles.gsmItem}>
            <Text style={styles.gsmLab}>FABRIC STANDARD GSM:</Text>
            <Text style={{ fontSize: 7 }}>{d.fabricStandardGsm}</Text>
          </View>
          <View style={styles.gsmItem}>
            <Text style={styles.gsmLab}>ACTUAL WEIGHT GSM:</Text>
            <Text style={{ fontSize: 7 }}>{d.actualWeightGsm}</Text>
          </View>
          <View style={[styles.fabAprRow, { marginTop: 0 }]}>
            <Text style={styles.gsmLab}>FABRIC APPROVED?</Text>
            <RadioPair approved={d.fabricApprovedYes} rejected={!d.fabricApprovedYes} />
          </View>
        </View>

        <Text style={styles.labGray}>CONSTRUCTION / FIT:</Text>
        <View style={styles.boxWhite}>
          <Text>{d.constructionFit}</Text>
        </View>
        <Text style={styles.labGray}>EMBELLISHMENT:</Text>
        <View style={styles.boxWhite}>
          <Text>{d.embellishment}</Text>
        </View>
        <Text style={styles.labGray}>GENERAL COMMENTS:</Text>
        <View style={styles.boxWhite}>
          <Text>{d.generalComments}</Text>
        </View>
      </Page>

      {/* —— Page 2 —— */}
      <Page size="A4" style={styles.page}>
        <View style={styles.page2Box}>
          <Text style={styles.page2Head}>
            APPROVAL AND SUPPLIER INSTRUCTIONS: MUST BE COMPLETE BEFORE SUBMITTING TO FACTORY
          </Text>
          <View style={styles.page2Body}>
            <Text style={styles.supLab}>Supplier Instructions:</Text>
            <View style={styles.chkList}>
              {[
                ['Garment Rejected - Submit a corrected Fit Sample', d.asiChecks.garmentRejected],
                ['Proceed to Sales Samples with changes/corrections', d.asiChecks.proceedSalesChanges],
                ['Proceed with Sales Samples', d.asiChecks.proceedSales],
                ['Proceed with Production Quantities', d.asiChecks.proceedProduction],
                ['Garment approved - waiting for customer selection', d.asiChecks.garmentApprovedWait],
              ].map(([label, on]) => (
                <View key={label} style={styles.chkLine}>
                  <CheckBox checked={on} />
                  <Text style={{ fontSize: 8, flex: 1 }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.signArea}>
          <View style={styles.signLine} />
          <Text style={styles.signCap}>Initial and Date</Text>
        </View>
      </Page>
    </Document>
  );
}

SampleInspectionReportPDF.propTypes = {
  data: PropTypes.object,
};
