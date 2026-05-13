import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font
} from '@react-pdf/renderer';

// ─── fonts ──────────────────────────────────────────────────────────────────
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
});

// ─── helpers ─────────────────────────────────────────────────────────────────
const fld = (obj, ...keys) => {
  if (!obj) return '';
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return String(obj[k]);
  }
  return '';
};

const bool2 = (v) => {
  if (v == null || v === false || v === 0 || v === '0' || v === 'false') return false;
  if (v === true || v === 1 || v === '1' || v === 'true') return true;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    if (s === '' || s === 'no' || s === 'not checked' || s === 'not conform' || s === 'not ok' || s === '-' || s === 'none' || s === 'unchecked') return false;
    // Any other text like "Checked", "Conform", "Yes" counts as checked
    return true;
  }
  return !!v;
};

const getVal = (obj, key) => {
  if (!obj) return null;
  if (obj[key] !== undefined) return obj[key];
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  return obj[pascal];
};

const getAnyVal = (obj, keys = []) => {
  if (!obj) return '';
  for (const key of keys) {
    const v = getVal(obj, key);
    if (v != null && v !== '') return v;
  }
  return '';
};

const isCheckedByKeys = (obj, bitKeys = [], comKeys = []) => {
  for (const k of bitKeys) {
    if (bool2(getVal(obj, k))) return true;
  }
  // PDF checkbox state should follow only saved boolean bits.
  return false;
};

const fmt = (v) => {
  if (v == null || v === '' || v === '0' || v === '0.0000') return '';
  const n = parseFloat(String(v));
  if (!Number.isFinite(n) || n === 0) return '';
  return String(Math.round(n));
};

const fmtDate = (v) => {
  if (!v) return '';
  if (typeof v === 'string' && v.length <= 12) return v;
  try { return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(v); }
};

const dec2 = (v) => {
  if (v == null || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '';
};

// ─── styles ──────────────────────────────────────────────────────────────────
const C = {
  black: '#000000',
  red: '#FF0000',
  green: '#008000',
  gray: '#E0E0E0',
  darkGray: '#A0A0A0'
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 7.5,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 70, // leave space for absolute footer
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  // ─── header ───────────────────────────────────────────────────────────────
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logoArea: { width: 120, alignItems: 'center' },
  logoImg: { width: 110, height: 40, objectFit: 'contain', marginBottom: 4 },
  logoText2: { fontSize: 6, fontFamily: 'Helvetica-Bold' },
  headerCenter: { flex: 1, alignItems: 'center' },
  companyTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  companySub: { fontSize: 6, marginBottom: 2 },
  reportTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 4 },

  // ─── fields ───────────────────────────────────────────────────────────────
  flexRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  label: { fontFamily: 'Helvetica-Bold', fontSize: 7, marginRight: 6 },
  valueUnderline: { flex: 1, borderBottom: '1px solid black', paddingBottom: 1, fontSize: 7, minHeight: 10 },

  // ─── checkboxes ───────────────────────────────────────────────────────────
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inspTypeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  inspTypeItem: { width: '25%', flexDirection: 'row', alignItems: 'center' },
  checkboxItem: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', gap: 3, width: '100%' },
  checkboxLabel: { fontSize: 7, lineHeight: 1.1, flexShrink: 1, textAlign: 'left' },
  box: { width: 8, height: 8, border: '1px solid black', justifyContent: 'center', alignItems: 'center' },
  checkFill: { width: 5, height: 5, backgroundColor: '#000000' },
  inspectLabelCell: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', minHeight: 16, padding: '2 5' },
  inspectValueCell: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', minHeight: 16, padding: '2 6' },
  singleLineText: { fontSize: 7, lineHeight: 1.1, textAlign: 'left' },

  // ─── tables ───────────────────────────────────────────────────────────────
  table: { width: '100%', borderTop: '1px solid black', borderLeft: '1px solid black', marginBottom: 10 },
  tr: { flexDirection: 'row' },
  td: { borderRight: '1px solid black', borderBottom: '1px solid black', padding: '3 4', fontSize: 7, justifyContent: 'center' },
  tdBold: { borderRight: '1px solid black', borderBottom: '1px solid black', padding: '3 4', fontSize: 7, fontFamily: 'Helvetica-Bold', justifyContent: 'center' },
  sizeMatrixCell: { height: 22, paddingTop: 2, paddingBottom: 2, justifyContent: 'center' },
  sizeMatrixRow: { height: 22 },
  sizeLabelText: { fontSize: 6.8, lineHeight: 1.1 },

  // ─── conclusion ───────────────────────────────────────────────────────────
  conclusionWrap: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 25 },
  overallText: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  passText: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.green },
  failText: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.red },

  // ─── sections ─────────────────────────────────────────────────────────────
  sectionBox: { border: '1px solid black', padding: '2 6', alignSelf: 'flex-start', marginBottom: 4 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  remarksText: { fontSize: 7, marginTop: 4, minHeight: 40 },

  // ─── footer ───────────────────────────────────────────────────────────────
  footer: { position: 'absolute', bottom: 20, left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  signBlock: { width: 120, alignItems: 'center' },
  signLine: { width: '100%', borderTop: '1.3px solid black', marginTop: 40, marginBottom: 4 },
  signLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7 },
  signImg: { position: 'absolute', bottom: 10, width: 112, height: 52, objectFit: 'contain', opacity: 1 },
  signImgBoost: { position: 'absolute', bottom: 10, width: 112, height: 52, objectFit: 'contain', opacity: 0.95 }
});

// ─── Sub-Components ────────────────────────────────────────────────────────
const CheckBoxLabel = ({ label, checked }) => (
  <View style={styles.checkboxItem}>
    <View style={styles.box}>
      {checked ? <View style={styles.checkFill} /> : null}
    </View>
    <Text style={styles.checkboxLabel} wrap={false}>{label}</Text>
  </View>
);

const Field = ({ label, value, width, flex }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'flex-end', marginRight: 10 }, width ? { width } : flex ? { flex } : { flex: 1 }]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueUnderline}>
      <Text>{value ?? ''}</Text>
    </View>
  </View>
);

const Footer = ({ qaName, qaSig, vendorSig, managerSig }) => (
  <View style={styles.footer} fixed>
    <View style={styles.signBlock}>
      {qaSig ? <Image src={qaSig} style={styles.signImg} /> : null}
      {qaSig ? <Image src={qaSig} style={styles.signImgBoost} /> : null}
      <View style={styles.signLine} />
      <Text style={styles.signLabel}>QA INSPECTOR SIGNATURE</Text>
      <Text style={{ fontSize: 6, marginTop: 2 }}>{qaName}</Text>
    </View>
    <View style={styles.signBlock}>
      {vendorSig ? <Image src={vendorSig} style={styles.signImg} /> : null}
      {vendorSig ? <Image src={vendorSig} style={styles.signImgBoost} /> : null}
      <View style={styles.signLine} />
      <Text style={styles.signLabel}>VENDOR SIGN</Text>
    </View>
    <View style={styles.signBlock}>
      {managerSig ? <Image src={managerSig} style={styles.signImg} /> : null}
      {managerSig ? <Image src={managerSig} style={styles.signImgBoost} /> : null}
      <View style={styles.signLine} />
      <Text style={styles.signLabel}>QA MANAGER SIGNATURE</Text>
    </View>
  </View>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export default function QAInspectionPDF({ data }) {
  if (!data) return null;

  const mst = data.savedInspection || data.SavedInspection || data.mst || data.Mst || data.inspectionMst || data.InspectionMst || data || {};
  const hdr = data.header || data.Header || {};

  const customerName = data.customerName || fld(hdr, 'CustomerName', 'customerName');
  const venderName = data.venderName || fld(hdr, 'VenderName', 'venderName');
  const poNo = data.poNo || fld(hdr, 'PONo', 'poNo', 'PONO');
  const season = data.season || fld(hdr, 'Season', 'season');
  const shipmentDate = data.shipmentDate || fld(hdr, 'shipmentdatee', 'shipmentDate');
  const styleNo = data.styleNo || fld(hdr, 'styleNo', 'StyleNo');
  const orderQty = data.orderQty || hdr.orderQty || hdr.OrderQty;
  const aqlSystem = data.aqlSystemName || '';
  const aqlRange = data.aqlRange || '';
  const qaName = data.qaName || '';

  const inspType = mst.inspectionType ?? '';
  // Always stamp DATE as report-generation date.
  const inspDate = fmtDate(new Date());
  const inspNo = getVal(mst, 'inspNo') ?? '';
  const passFail = getVal(mst, 'passFail');
  const draftBit = getVal(mst, 'draftBit');
  const colorway = mst.colorway || fld(hdr, 'Colorway', 'colorway');
  const ratio = mst.ratio || '';
  const sampleSize = fmt(mst.sampleSize);

  // AQL stats
  const critFound = fmt(mst.critical); const majFound = fmt(mst.major); const minFound = fmt(mst.minor);
  const critAllowed = fmt(mst.criticalAllowed); const majAllowed = fmt(mst.majorAllowed); const minAllowed = fmt(mst.minorAllowed);

  // Signatures
  const sigs = data.signatures ?? data.Signatures ?? [];
  const getSig = (type) => {
    const s = sigs.find(x => {
      const st = x.signType ?? x.SignType ?? '';
      return st.toUpperCase() === type.toUpperCase();
    });
    return s?.base64Data ?? s?.Base64Data;
  };

  const qaSig = getSig('QA');
  const vendorSig = getSig('VENDOR');
  const managerSig = getSig('CONTROL');

  const images = data.images ?? [];

  // Data helpers
  const checklistVal = (keys) => {
    const raw = getAnyVal(mst, keys);
    return raw == null || String(raw).trim() === '' ? 'OK' : String(raw);
  };
  const checklistRemarks = (keys) => {
    const raw = getAnyVal(mst, keys);
    return raw == null ? '' : String(raw);
  };
  const CHECKLIST = [
    {
      label: 'QUANTITY',
      v: checklistVal(['quantity_D', 'quantityD', 'Quantity_D', 'QuantityD']),
      r: checklistRemarks(['quantity_D_Remarks', 'quantityDRemarks', 'Quantity_D_Remarks', 'QuantityDRemarks']),
    },
    {
      label: 'CONFORMITY',
      v: checklistVal(['conformity_D', 'conformityD', 'Conformity_D', 'ConformityD']),
      r: checklistRemarks(['conformity_D_Remarks', 'conformityDRemarks', 'Conformity_D_Remarks', 'ConformityDRemarks']),
    },
    {
      label: 'WORKMANSHIP',
      v: checklistVal(['workmanship_D', 'workmanshipD', 'Workmanship_D', 'WorkmanshipD']),
      r: checklistRemarks(['workmanship_D_Remarks', 'workmanshipDRemarks', 'Workmanship_D_Remarks', 'WorkmanshipDRemarks']),
    },
    {
      label: 'PACKING',
      v: checklistVal(['packing_D', 'packingD', 'Packing_D', 'PackingD']),
      r: checklistRemarks(['packing_D_Remarks', 'packingDRemarks', 'Packing_D_Remarks', 'PackingDRemarks']),
    },
    {
      label: 'MARKING',
      v: checklistVal(['marking_D', 'markingD', 'Marking_D', 'MarkingD']),
      r: checklistRemarks(['marking_D_Remarks', 'markingDRemarks', 'Marking_D_Remarks', 'MarkingDRemarks']),
    },
    {
      label: 'MEASUREMENT',
      v: checklistVal(['measurement_D', 'measurementD', 'Measurement_D', 'MeasurementD']),
      r: checklistRemarks(['measurement_D_Remarks', 'measurementDRemarks', 'Measurement_D_Remarks', 'MeasurementDRemarks']),
    },
  ];

  const ROW_ORDER = [
    'SIZE', 'ORDER QTY', 'OFFER QTY', 'FABRIC IN HOUSE', 'CUT QTY',
    'IN-LINE', 'OFF-LINE', 'QTY PACKED PCS / SET',
    'QTY PACKED CARTON', 'QTY INSPECTED CARTON', 'QTY BALANCE/EXTRA',
  ];

  const dtlRows = data.inspectionDtlRows ?? [];
  const orderedRows = ROW_ORDER.map(rt => dtlRows.find(r => (r.sizeType ?? r.SizeType ?? '').toUpperCase() === rt.toUpperCase()) ?? { sizeType: rt });
  const sizeRow = orderedRows[0];
  const numCols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(i => {
    const v = sizeRow?.[`size${i}`] ?? sizeRow?.[`Size${i}`] ?? '';
    return v && v !== '0' && v !== '0.0000';
  });
  // Keep fixed 12 size slots so grid always matches printed format.
  const activeCols = numCols.length > 0 ? [...numCols] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  while (activeCols.length < 12) activeCols.push(`empty-${activeCols.length + 1}`);

  const discs = data.discrepancies ?? [];
  // Force exactly 12 rows for Discrepancies as per user request
  const filledDiscs = Array.from({ length: 12 }, (_, i) => discs[i] || {});
  const totalCrit = discs.reduce((s, d) => s + (Number(d.critical) || 0), 0);
  const totalMaj = discs.reduce((s, d) => s + (Number(d.major) || 0), 0);
  const totalMin = discs.reduce((s, d) => s + (Number(d.minor) || 0), 0);

  const accLeft = [
    { label: 'CARE LABEL', checked: isCheckedByKeys(mst, ['careLabel', 'CareLabel'], ['careLblCom', 'CareLblCom']), c: getAnyVal(mst, ['careLblCom', 'CareLblCom']) },
    { label: 'CONTENT LABEL', checked: isCheckedByKeys(mst, ['contentLabel', 'ContentLabel'], ['contentLblCom', 'ContentLblCom']), c: getAnyVal(mst, ['contentLblCom', 'ContentLblCom']) },
    { label: 'MAIN LABEL', checked: isCheckedByKeys(mst, ['mainLabel', 'MainLabel'], ['mainLblCom', 'MainLblCom']), c: getAnyVal(mst, ['mainLblCom', 'MainLblCom']) },
    { label: 'DYE LOTS', checked: isCheckedByKeys(mst, ['dyeLot', 'DyeLot'], ['dyeLotCom', 'DyeLotCom']), c: getAnyVal(mst, ['dyeLotCom', 'DyeLotCom']) },
    { label: 'PATTERN', checked: isCheckedByKeys(mst, ['pattern', 'Pattern'], ['patternCom', 'PatternCom']), c: getAnyVal(mst, ['patternCom', 'PatternCom']) },
    { label: 'GENERAL APPEARANCE', checked: isCheckedByKeys(mst, ['generalAppearance', 'GeneralAppearance'], ['generalAppCom', 'GeneralAppCom']), c: getAnyVal(mst, ['generalAppCom', 'GeneralAppCom']) },
    { label: 'BUTTONS', checked: isCheckedByKeys(mst, ['buttonAccessory', 'ButtonAccessory', 'button', 'Button'], ['buttonsCom', 'ButtonsCom']), c: getAnyVal(mst, ['buttonsCom', 'ButtonsCom']) },
    { label: 'ZIPPER', checked: isCheckedByKeys(mst, ['zipper', 'Zipper'], ['zipperCom', 'ZipperCom']), c: getAnyVal(mst, ['zipperCom', 'ZipperCom']) },
    { label: 'DRAWSTRING', checked: isCheckedByKeys(mst, ['drawingString', 'DrawingString'], ['drawingStrCom', 'DrawingStrCom']), c: getAnyVal(mst, ['drawingStrCom', 'DrawingStrCom']) },
  ];
  const accRight = [
    { label: 'CARE LABEL PLACEMENT', checked: isCheckedByKeys(mst, ['careLabelPlacement', 'CareLabelPlacement'], ['careLblPlacementCom', 'CareLblPlacementCom']), c: getAnyVal(mst, ['careLblPlacementCom', 'CareLblPlacementCom']) },
    { label: 'CONTENT LABEL PLACEMENT', checked: isCheckedByKeys(mst, ['contentLabelPlacement', 'ContentLabelPlacement'], ['contentLblPlacementCom', 'ContentLblPlacementCom']), c: getAnyVal(mst, ['contentLblPlacementCom', 'ContentLblPlacementCom']) },
    { label: 'MAIN LABEL PLACEMENT', checked: isCheckedByKeys(mst, ['mainLabelPlacement', 'MainLabelPlacement'], ['mainLblPlacementCom', 'MainLblPlacementCom']), c: getAnyVal(mst, ['mainLblPlacementCom', 'MainLblPlacementCom']) },
    { label: 'HANGTAG', checked: isCheckedByKeys(mst, ['hangTag', 'HangTag'], ['hangtagCom', 'HangtagCom']), c: getAnyVal(mst, ['hangtagCom', 'HangtagCom']) },
    { label: 'PRICE TICKET', checked: isCheckedByKeys(mst, ['priceTicket', 'PriceTicket'], ['priceTicketCom', 'PriceTicketCom']), c: getAnyVal(mst, ['priceTicketCom', 'PriceTicketCom']) },
    { label: 'HANGER', checked: isCheckedByKeys(mst, ['hanger', 'Hanger'], ['hangerCom', 'HangerCom']), c: getAnyVal(mst, ['hangerCom', 'HangerCom']) },
    { label: 'FOLD METHOD', checked: isCheckedByKeys(mst, ['foldMethod', 'FoldMethod'], ['foldMethodCom', 'FoldMethodCom']), c: getAnyVal(mst, ['foldMethodCom', 'FoldMethodCom']) },
    { label: 'INTERLINING', checked: isCheckedByKeys(mst, ['interlining', 'Interlining'], ['interLiningCom', 'InterLiningCom']), c: getAnyVal(mst, ['interLiningCom', 'InterLiningCom']) },
    { label: 'ADDITIONAL LABEL', checked: isCheckedByKeys(mst, ['additionalLbl', 'AdditionalLbl'], ['additionalLblComm', 'AdditionalLblComm']), c: getAnyVal(mst, ['additionalLblComm', 'AdditionalLblComm']) }
  ];

  const packLeft = [
    { label: 'CARTON DIMENSION', checked: isCheckedByKeys(mst, ['cartonDimen', 'CartonDimen'], ['cartonDimmCom', 'CartonDimmCom']), c: getAnyVal(mst, ['cartonDimmCom', 'CartonDimmCom']) },
    { label: 'CARTON THICKNESS', checked: isCheckedByKeys(mst, ['cartonThickness', 'CartonThickness'], ['crtnThicknessCom', 'CrtnThicknessCom']), c: getAnyVal(mst, ['crtnThicknessCom', 'CrtnThicknessCom']) },
    { label: 'GROSS WT', checked: isCheckedByKeys(mst, ['grossWT', 'GrossWT'], ['grossWTCom', 'GrossWTCom']), c: getAnyVal(mst, ['grossWTCom', 'GrossWTCom']) },
    { label: 'NO. OF PCS/INNER PACK', checked: isCheckedByKeys(mst, ['noOfPcsInnerPack', 'NoOfPcsInnerPack'], ['noOfPcsInnerPackCom', 'NoOfPcsInnerPackCom']), c: getAnyVal(mst, ['noOfPcsInnerPackCom', 'NoOfPcsInnerPackCom']) },
    { label: '', checked: false, c: '' }
  ];
  const packRight = [
    { label: 'CARTON MARKING', checked: isCheckedByKeys(mst, ['cartonMarking', 'CartonMarking'], ['cartonMarkingCom', 'CartonMarkingCom']), c: getAnyVal(mst, ['cartonMarkingCom', 'CartonMarkingCom']) },
    { label: 'NET WT', checked: isCheckedByKeys(mst, ['netWT', 'NetWT'], ['netWTCom', 'NetWTCom']), c: getAnyVal(mst, ['netWTCom', 'NetWTCom']) },
    { label: 'NO. OF PCS/CARTON', checked: isCheckedByKeys(mst, ['noOfPcsCarton', 'NoOfPcsCarton'], ['noOfPcsCrtnCom', 'NoOfPcsCrtnCom']), c: getAnyVal(mst, ['noOfPcsCrtnCom', 'NoOfPcsCrtnCom']) },
    { label: 'POLYBAG/BLISTER BAG', checked: isCheckedByKeys(mst, ['polyBag', 'PolyBag'], ['polyBagBlisterBagCom', 'PolyBagBlisterBagCom']), c: getAnyVal(mst, ['polyBagBlisterBagCom', 'PolyBagBlisterBagCom']) },
    { label: 'U.P.C.', checked: isCheckedByKeys(mst, ['ups', 'UPS'], ['uPCCom', 'UPCCom', 'upcCom']), c: getAnyVal(mst, ['uPCCom', 'UPCCom', 'upcCom']) }
  ];

  return (
    <Document title={`Inspection Report - ${inspNo}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logoArea}>
            <Image src="/logo/AMSlogo.png" style={styles.logoImg} />
            <Text style={[styles.logoText2, { color: '#404040' }]}>APPAREL MERCHANDISING SERVICES</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.companyTitle}>Apparel Merchandising Services</Text>
            <Text style={styles.companySub}>A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800</Text>
            <Text style={styles.companySub}>Telephone # : [+92213] 485-3935 & 36   Karachi - Pakistan.</Text>
            <Text style={styles.reportTitle}>INSPECTION REPORT</Text>
          </View>
        </View>

        {/* Info Rows */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, marginTop: 4 }}>
          <Field label="Q.A. NAME" value={qaName} width={180} />
          <View style={styles.inspTypeRow}>
            <View style={styles.inspTypeItem}>
              <CheckBoxLabel label="IPC" checked={inspType === 'IPC'} />
            </View>
            <View style={styles.inspTypeItem}>
              <CheckBoxLabel label="MPC" checked={inspType === 'MPC'} />
            </View>
            <View style={styles.inspTypeItem}>
              <CheckBoxLabel label="PRE-FINAL" checked={inspType === 'Pre-Final'} />
            </View>
            <View style={styles.inspTypeItem}>
              <CheckBoxLabel label="FINAL" checked={inspType === 'Final'} />
            </View>
          </View>
          <Field label="DATE :" value={inspDate} width={100} />
        </View>

        <View style={styles.flexRow}>
          <Field label="Report #" value={inspNo} />
          <Field label="ORDER QTY" value={orderQty ? fmt(orderQty) : ''} />
          <Field label="RATIO" value={ratio} />
        </View>
        <View style={styles.flexRow}>
          <Field label="P.O. #:" value={poNo} />
          <Field label="STYLE NO" value={styleNo} />
          <Field label="VENDOR" value={venderName} />
        </View>
        <View style={styles.flexRow}>
          <Field label="Color" value={colorway} />
          <Field label="System" value={aqlSystem} />
          <Field label="Sample Size" value={sampleSize} />
        </View>
        <View style={styles.flexRow}>
          <Field label="DESCRIPTION" value={styleNo} />
        </View>

        {/* Checklist Table */}
        <View style={styles.table}>
          {CHECKLIST.map((row, i) => (
            <View key={i} style={styles.tr}>
              <View style={[styles.td, { width: '24%' }]}><Text>{row.label}</Text></View>
              <View style={[styles.td, { width: '17%', alignItems: 'center' }]}>
                <Text>{row.v || ''}</Text>
              </View>
              <View style={[styles.td, { width: '59%' }]}>
                <Text>{row.r || ''}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Conclusion */}
        <View style={styles.conclusionWrap}>
          <Text style={styles.overallText}>OVERALL CONCLUSION</Text>
          <Text style={passFail === true ? styles.passText : (passFail === false ? styles.failText : styles.overallText)}>
            {passFail === true ? 'PASS' : passFail === false ? 'FAIL' : 'PENDING'}
          </Text>
        </View>

        {/* Size Matrix */}
        <View style={styles.table}>
          <View style={[styles.tr, styles.sizeMatrixRow]}>
            <View style={[styles.tdBold, styles.sizeMatrixCell, { flex: 1.9, alignItems: 'center' }]}><Text>Size</Text></View>
            {activeCols.map((c, i) => {
              const val = typeof c === 'number' ? (sizeRow?.[`size${c}`] ?? sizeRow?.[`Size${c}`] ?? '') : '';
              return (
                <View key={i} style={[styles.tdBold, styles.sizeMatrixCell, { flex: 1, alignItems: 'center' }]}>
                  <Text>{val}</Text>
                </View>
              );
            })}
            <View style={[styles.tdBold, styles.sizeMatrixCell, { flex: 1.2, alignItems: 'center' }]}><Text>TOTAL</Text></View>
          </View>

          {orderedRows.slice(1).map((row, ri) => {
            const label = row.sizeType ?? row.SizeType ?? '';
            const isBalance = label.toUpperCase().includes('BALANCE');
            return (
              <View key={ri} style={[styles.tr, styles.sizeMatrixRow]}>
                <View style={[styles.td, styles.sizeMatrixCell, { flex: 1.9 }]}>
                  {isBalance ? (
                    <Text style={styles.sizeLabelText} wrap={false}>
                      <Text style={{ color: C.black }}>QTY </Text>
                      <Text style={{ color: C.red }}>BALANCE</Text>
                      <Text style={{ color: C.black }}>/</Text>
                      <Text style={{ color: C.green }}>EXTRA</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.sizeLabelText, { color: C.black }]} wrap={false}>{label}</Text>
                  )}
                </View>
                {activeCols.map((c, i) => {
                  const val = typeof c === 'number' ? (row[`size${c}`] ?? row[`Size${c}`] ?? '') : '';
                  return (
                    <View key={i} style={[styles.td, styles.sizeMatrixCell, { flex: 1, alignItems: 'center' }]}>
                      <Text>{fmt(val)}</Text>
                    </View>
                  );
                })}
                <View style={[styles.td, styles.sizeMatrixCell, { flex: 1.2, alignItems: 'center' }]}>
                  <Text>{fmt(row.sizeTotal ?? row.SizeTotal)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Footer qaName={qaName} qaSig={qaSig} vendorSig={vendorSig} managerSig={managerSig} />
      </Page>


      <Page size="A4" style={styles.page}>


        <View style={styles.sectionBox}><Text style={styles.sectionTitle}>ACCESSORIES MARKINGS</Text></View>
        <View style={styles.table}>
          {Array(9).fill(0).map((_, i) => {
            const L = accLeft[i] || {};
            const R = accRight[i] || {};
            return (
              <View key={i} style={styles.tr}>

                <View style={[styles.td, styles.inspectLabelCell]}>
                  {L.label ? <CheckBoxLabel label={L.label} checked={L.checked} /> : null}
                </View>
                <View style={[styles.td, styles.inspectValueCell]}><Text style={styles.singleLineText} wrap={false}>{L.c || ''}</Text></View>


                <View style={[styles.td, styles.inspectLabelCell]}>
                  {R.label ? <CheckBoxLabel label={R.label} checked={R.checked} /> : null}
                </View>
                <View style={[styles.td, styles.inspectValueCell]}><Text style={styles.singleLineText} wrap={false}>{R.c || ''}</Text></View>
              </View>
            );
          })}
        </View>


        <View style={styles.sectionBox}><Text style={styles.sectionTitle}>PACKING</Text></View>
        <View style={styles.table}>
          {Array(5).fill(0).map((_, i) => {
            const L = packLeft[i] || {};
            const R = packRight[i] || {};
            return (
              <View key={i} style={styles.tr}>

                <View style={[styles.td, styles.inspectLabelCell]}>
                  {L.label ? <CheckBoxLabel label={L.label} checked={L.checked} /> : null}
                </View>
                <View style={[styles.td, styles.inspectValueCell]}><Text style={styles.singleLineText} wrap={false}>{L.c || ''}</Text></View>


                <View style={[styles.td, styles.inspectLabelCell]}>
                  {R.label ? <CheckBoxLabel label={R.label} checked={R.checked} /> : null}
                </View>
                <View style={[styles.td, styles.inspectValueCell]}><Text style={styles.singleLineText} wrap={false}>{R.c || ''}</Text></View>
              </View>
            );
          })}
        </View>


        <View style={styles.table}>
          <View style={styles.tr}>
            <View style={[styles.tdBold, { width: 35, alignItems: 'center' }]}><Text>S.NO.</Text></View>
            <View style={[styles.tdBold, { flex: 1, alignItems: 'center' }]}><Text>DURING INSPECTION FOUND FOLLOWING DISCREPANCIES</Text></View>
            <View style={[styles.tdBold, { width: 100, alignItems: 'center' }]}><Text>Remarks</Text></View>
            <View style={[styles.tdBold, { width: 50, alignItems: 'center' }]}><Text>CRITICAL</Text></View>
            <View style={[styles.tdBold, { width: 40, alignItems: 'center' }]}><Text>MAJOR</Text></View>
            <View style={[styles.tdBold, { width: 40, alignItems: 'center' }]}><Text>MINOR</Text></View>
          </View>

          {filledDiscs.map((d, i) => {
            const discText = d.discrepanices ?? d.Discrepanices ?? d.discrepancy ?? '';
            return (
              <View key={i} style={styles.tr}>
                <View style={[styles.td, { width: 35, alignItems: 'center' }]}><Text>{i + 1}</Text></View>
                <View style={[styles.td, { flex: 1 }]}><Text>{discText}</Text></View>
                <View style={[styles.td, { width: 100 }]}><Text>{d.remarks ?? d.Remarks ?? ''}</Text></View>
                <View style={[styles.td, { width: 50, alignItems: 'center' }]}><Text>{d.critical ? fmt(d.critical) : ''}</Text></View>
                <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{d.major ? fmt(d.major) : ''}</Text></View>
                <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{d.minor ? fmt(d.minor) : ''}</Text></View>
              </View>
            );
          })}


          <View style={styles.tr}>
            <View style={[styles.tdBold, { width: 35 + 100, flex: 1, alignItems: 'center' }]}><Text>TOTAL</Text></View>
            <View style={[styles.td, { width: 50, alignItems: 'center' }]}><Text>{totalCrit || '0'}</Text></View>
            <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{totalMaj || '0'}</Text></View>
            <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{totalMin || '0'}</Text></View>
          </View>
          <View style={styles.tr}>
            <View style={[styles.tdBold, { width: 35 + 100, flex: 1, alignItems: 'center' }]}><Text>ALLOWED</Text></View>
            <View style={[styles.td, { width: 50, alignItems: 'center' }]}><Text>{critAllowed || '0'}</Text></View>
            <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{majAllowed || '0'}</Text></View>
            <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{minAllowed || '0'}</Text></View>
          </View>
        </View>

        <Text style={{ fontSize: 7 }}>REMARKS:</Text>
        <Text style={styles.remarksText}>{mst.qaRemarks ?? mst.QARemarks ?? mst.qARemarks ?? ''}</Text>

        <Footer qaName={qaName} qaSig={qaSig} vendorSig={vendorSig} managerSig={managerSig} />
      </Page>


      {data.sizeSpecs && data.sizeSpecs.length > 0 && data.sizeSpecs.some(s => s.measurementPoint || s.MeasurementPoint) ? (
        <Page size="A4" style={styles.page}>
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>Specs Sheet</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tr}>
              <View style={[styles.tdBold, { flex: 1, padding: '2 0', textAlign: 'center' }]}>
                <Text>- ()</Text>
              </View>
            </View>
            <View style={styles.tr}>
              <View style={[styles.tdBold, { width: 30, alignItems: 'center' }]}><Text>No.</Text></View>
              <View style={[styles.tdBold, { flex: 2 }]}><Text>Measurement Points</Text></View>
              <View style={[styles.tdBold, { width: 35, alignItems: 'center' }]}><Text>TOL+/-</Text></View>
              {Array.from({ length: 11 }).map((_, i) => (
                <View key={i} style={[styles.td, { flex: 1 }]} />
              ))}
            </View>

            {data.sizeSpecs.map((spec, r) => (
              <View key={r} style={styles.tr}>
                <View style={[styles.td, { width: 30, alignItems: 'center' }]}><Text>{r + 1}</Text></View>
                <View style={[styles.td, { flex: 2 }]}><Text>{spec.measurementPoint ?? spec.MeasurementPoint ?? ''}</Text></View>
                <View style={[styles.td, { width: 35, alignItems: 'center' }]}><Text>{spec.tolerance ?? spec.Tolerance ?? ''}</Text></View>
                {Array.from({ length: 11 }).map((_, i) => {
                  const val = spec[`size${i + 1}`] ?? spec[`Size${i + 1}`] ?? '';
                  return <View key={i} style={[styles.td, { flex: 1, alignItems: 'center' }]}><Text>{String(val)}</Text></View>;
                })}
              </View>
            ))}
          </View>

          <Footer qaName={qaName} qaSig={qaSig} vendorSig={vendorSig} managerSig={managerSig} />
        </Page>
      ) : null}


      <Page size="A4" style={styles.page}>
        <View style={[styles.sectionBox, { backgroundColor: C.gray, border: '1px solid black', width: '100%', padding: '4 6' }]}>
          <Text style={styles.sectionTitle}>Picture taken during inspection</Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
          {images.map((img, i) => (
            <View key={i} style={{ width: '45%', border: '1px solid black', height: 195, marginBottom: 10, padding: 2 }}>
              <Image
                src={img.base64Content ?? img.Base64Content}
                style={{ width: '100%', height: 168, objectFit: 'contain' }}
              />
              <View style={{ borderTop: '1px solid black', marginTop: 2, minHeight: 20, justifyContent: 'center', alignItems: 'center', padding: '2 4' }}>
                <Text style={{ fontSize: 7 }}>
                  {(() => {
                    const hText = img.imgHeader ?? img.ImgHeader ?? '';
                    const pName = img.photoName ?? img.PhotoName ?? '';
                    const isDefect = /major defect|minor defect|critical defect/i.test(hText);
                    if (isDefect && pName && pName !== hText) {
                      return `${hText} (${pName})`;
                    }
                    return hText || pName || '';
                  })()}
                </Text>
              </View>
            </View>
          ))}
          {/* If no images, draw an empty box like the sample */}
          {images.length === 0 ? (
            <View style={{ width: '45%', border: '1px solid black', height: 180, marginBottom: 10 }} />
          ) : null}
        </View>

        <Footer qaName={qaName} qaSig={qaSig} vendorSig={vendorSig} managerSig={managerSig} />
      </Page>

    </Document>
  );
}
