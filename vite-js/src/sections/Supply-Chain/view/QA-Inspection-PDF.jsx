import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fld = (obj, ...keys) => {
  if (!obj) return '';
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return String(obj[k]);
  }
  return '';
};

const bool2 = (v) => (v === true || v === 1 || v === '1');

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
  black:  '#000000',
  red:    '#FF0000',
  green:  '#008000',
  gray:   '#E0E0E0', 
  darkGray: '#A0A0A0'
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
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
  logoText1: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: '#101859', letterSpacing: -1 },
  logoText2: { fontSize: 6, fontFamily: 'Helvetica-Bold', marginTop: -4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  companyTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  companySub: { fontSize: 6, marginBottom: 2 },
  reportTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  
  // ─── fields ───────────────────────────────────────────────────────────────
  flexRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  label: { fontFamily: 'Helvetica-Bold', fontSize: 7, marginRight: 6 },
  valueUnderline: { flex: 1, borderBottom: '1px solid black', paddingBottom: 1, fontSize: 7, minHeight: 10 },
  
  // ─── checkboxes ───────────────────────────────────────────────────────────
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkboxItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  box: { width: 8, height: 8, border: '1px solid black', justifyContent: 'center', alignItems: 'center' },
  checkMark: { fontSize: 6, marginTop: 1 },
  
  // ─── tables ───────────────────────────────────────────────────────────────
  table: { width: '100%', borderTop: '1px solid black', borderLeft: '1px solid black', marginBottom: 10 },
  tr: { flexDirection: 'row' },
  td: { borderRight: '1px solid black', borderBottom: '1px solid black', padding: '3 4', fontSize: 7, justifyContent: 'center' },
  tdBold: { borderRight: '1px solid black', borderBottom: '1px solid black', padding: '3 4', fontSize: 7, fontFamily: 'Helvetica-Bold', justifyContent: 'center' },
  
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
  signLine: { width: '100%', borderTop: '1px solid black', marginTop: 40, marginBottom: 4 },
  signLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7 },
  signImg: { position: 'absolute', bottom: 12, width: 100, height: 45, objectFit: 'contain' }
});

// ─── Sub-Components ────────────────────────────────────────────────────────
const CheckBoxLabel = ({ label, checked }) => (
  <View style={styles.checkboxItem}>
    <View style={styles.box}>
      {checked && <Text style={styles.checkMark}>✓</Text>}
    </View>
    <Text style={{ fontSize: 7 }}>{label}</Text>
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
      {qaSig && <Image src={qaSig} style={styles.signImg} />}
      <View style={styles.signLine} />
      <Text style={styles.signLabel}>QA SIGN</Text>
    </View>
    <View style={styles.signBlock}>
      {vendorSig && <Image src={vendorSig} style={styles.signImg} />}
      <View style={styles.signLine} />
      <Text style={styles.signLabel}>VENDOR SIGN</Text>
    </View>
    <View style={styles.signBlock}>
      {managerSig && <Image src={managerSig} style={styles.signImg} />}
      <View style={styles.signLine} />
      <Text style={styles.signLabel}>MANAGER QA</Text>
    </View>
  </View>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export default function QAInspectionPDF({ data }) {
  if (!data) return null;

  const mst  = data.savedInspection ?? {};
  const hdr  = data.header          ?? {};

  const customerName  = data.customerName  || fld(hdr, 'CustomerName',  'customerName');
  const venderName    = data.venderName    || fld(hdr, 'VenderName',     'venderName');
  const poNo          = data.poNo          || fld(hdr, 'PONo',           'poNo', 'PONO');
  const season        = data.season        || fld(hdr, 'Season',         'season');
  const shipmentDate  = data.shipmentDate  || fld(hdr, 'shipmentdatee',  'shipmentDate');
  const styleNo       = data.styleNo       || fld(hdr, 'styleNo',        'StyleNo');
  const orderQty      = data.orderQty      || hdr.orderQty || hdr.OrderQty;
  const aqlSystem     = data.aqlSystemName || '';
  const aqlRange      = data.aqlRange      || '';
  const qaName        = data.qaName        || '';

  const inspType   = mst.inspectionType ?? '';
  const inspDate   = fmtDate(mst.mstInspectionDate);
  const inspNo     = mst.inspNo ?? '';
  const passFail   = mst.passFail;
  const colorway   = mst.colorway   || fld(hdr, 'Colorway', 'colorway');
  const ratio      = mst.ratio      || '';
  const sampleSize = fmt(mst.sampleSize);

  // AQL stats
  const critFound = fmt(mst.critical); const majFound = fmt(mst.major); const minFound = fmt(mst.minor);
  const critAllowed = fmt(mst.criticalAllowed); const majAllowed = fmt(mst.majorAllowed); const minAllowed = fmt(mst.minorAllowed);

  // Signatures
  const sigs = data.signatures ?? [];
  const qaSig      = sigs.find(s => s.signType === 'QA')?.base64Data      ?? sigs.find(s => s.signType === 'QA')?.Base64Data;
  const vendorSig  = sigs.find(s => s.signType === 'VENDOR')?.base64Data  ?? sigs.find(s => s.signType === 'VENDOR')?.Base64Data;
  const managerSig = sigs.find(s => s.signType === 'CONTROL')?.base64Data ?? sigs.find(s => s.signType === 'CONTROL')?.Base64Data;

  const images = data.images ?? [];

  // Data helpers
  const CHECKLIST = [
    { label: 'QUANTITY',     v: mst.quantity_D },
    { label: 'CONFORMITY',   v: mst.conformity_D },
    { label: 'WORKMANSHIP',  v: mst.workmanship_D },
    { label: 'PACKING',      v: mst.packing_D },
    { label: 'MARKING',      v: mst.marking_D },
    { label: 'MEASUREMENT',  v: mst.measurement_D },
  ];

  const ROW_ORDER = [
    'SIZE', 'ORDER QTY', 'OFFER QTY', 'FABRIC IN HOUSE', 'CUT QTY',
    'IN-LINE', 'OFF-LINE', 'QTY PACKED PCS / SET',
    'QTY PACKED CARTON', 'QTY INSPECTED CARTON', 'QTY BALANCE/EXTRA',
  ];

  const dtlRows = data.inspectionDtlRows ?? [];
  const orderedRows = ROW_ORDER.map(rt => dtlRows.find(r => (r.sizeType ?? r.SizeType ?? '').toUpperCase() === rt.toUpperCase()) ?? { sizeType: rt });
  const sizeRow = orderedRows[0];
  const numCols = [1,2,3,4,5,6,7,8,9,10,11,12].filter(i => {
    const v = sizeRow?.[`size${i}`] ?? sizeRow?.[`Size${i}`] ?? '';
    return v && v !== '0' && v !== '0.0000';
  });
  // fill to at least 10 empty columns for visual parity if short
  const activeCols = numCols.length > 0 ? numCols : [1,2,3,4,5,6,7,8,9,10];
  while (activeCols.length < 10) activeCols.push(`empty-${activeCols.length}`);

  const discs = data.discrepancies ?? [];
  const filledDiscs = [...discs, ...Array(Math.max(0, 5 - discs.length)).fill({})]; // at least 5 empty rows
  const totalCrit = discs.reduce((s, d) => s + (Number(d.critical) || 0), 0);
  const totalMaj  = discs.reduce((s, d) => s + (Number(d.major)    || 0), 0);
  const totalMin  = discs.reduce((s, d) => s + (Number(d.minor)    || 0), 0);

  const accLeft = [
    { label: 'DYE LOTS', checked: mst.dyeLot, c: mst.dyeLotCom ? 'Conform' : 'Checked' },
    { label: 'PATTERN', checked: mst.pattern, c: mst.patternCom ? 'Conform' : 'Checked' },
    { label: 'GENERAL APPEARANCE', checked: mst.generalAppearance, c: mst.generalAppCom || 'Conform' },
    { label: 'MAIN LABEL', checked: mst.mainLabel, c: mst.mainLblCom },
    { label: 'MAIN LABEL PLACEMENT', checked: mst.mainLabelPlacement, c: mst.mainLblPlacementCom || 'Side Seam' },
    { label: 'CARE LABEL PLACEMENT', checked: mst.careLabelPlacement, c: mst.careLblPlacementCom || 'Side Seam' },
    { label: 'CONTENT LABEL PLACEMENT', checked: mst.contentLabelPlacement, c: mst.contentLblPlacementCom || 'Side Seam' },
    { label: 'BUTTONS', checked: mst.buttonAccessory, c: mst.buttonsCom || 'Yes' },
    { label: '', checked: false, c: '' }
  ];
  const accRight = [
    { label: 'ZIPPER', checked: mst.zipper, c: mst.zipperCom || 'Yes' },
    { label: 'DRAWSTRING', checked: mst.drawingString, c: mst.drawingStrCom || 'Yes' },
    { label: 'HANGTAG', checked: mst.hangTag, c: mst.hangtagCom || 'Yes' },
    { label: 'PRICE TICKET', checked: mst.priceTicket, c: mst.priceTicketCom || 'Yes' },
    { label: 'HANGER', checked: mst.hanger, c: mst.hangerCom || 'Yes' },
    { label: 'CONTENT LABEL', checked: mst.contentLabel, c: mst.contentLblCom },
    { label: 'FOLD METHOD', checked: mst.foldMethod, c: mst.foldMethodCom || 'B-Fold' },
    { label: 'INTERLINING', checked: mst.interlining, c: mst.interLiningCom },
    { label: 'ADDITIONAL LABEL', checked: mst.additionalLbl, c: mst.additionalLblComm || 'Yes' }
  ];

  const packLeft = [
    { label: 'CARTON DIMENSION', checked: mst.cartonDimen, c: mst.cartonDimmCom },
    { label: 'CARTON THICKNESS', checked: mst.cartonThickness, c: mst.crtnThicknessCom || '03 ply' },
    { label: 'GROSS WT', checked: mst.grossWT, c: mst.grossWTCom },
    { label: 'NO. OF PCS/INNER PACK', checked: mst.noOfPcsInnerPack, c: mst.noOfPcsInnerPackCom },
    { label: '', checked: false, c: '' }
  ];
  const packRight = [
    { label: 'CARTON MARKING', checked: mst.cartonMarking, c: mst.cartonMarkingCom || '1 Side' },
    { label: 'NET WT', checked: mst.netWT, c: mst.netWTCom },
    { label: 'NO. OF PCS/CARTON', checked: mst.noOfPcsCarton, c: mst.noOfPcsCrtnCom },
    { label: 'POLYBAG/BLISTER BAG', checked: mst.polyBag, c: mst.polyBagBlisterBagCom },
    { label: 'U.P.C.', checked: mst.uPS ?? mst.ups, c: mst.uPCCom }
  ];

  return (
    <Document title={`Inspection Report - ${inspNo}`}>
      {/* ════════════════ PAGE 1 ════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logoArea}>
            {/* Minimal SVG logic to mimic AMS logo shapes if image unavailable, using just styled Text for now */}
            <Text style={styles.logoText1}><Text style={{color:'#EC7225'}}>A</Text><Text style={{color:'#101859'}}>MS</Text></Text>
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
          <View style={[styles.checkboxRow, { flex: 1, justifyContent: 'space-between', marginRight: 10 }]}>
            <CheckBoxLabel label="IPC" checked={inspType === 'IPC'} />
            <CheckBoxLabel label="PRE-FINAL" checked={inspType === 'Pre-Final'} />
            <CheckBoxLabel label="FINAL" checked={inspType === 'Final'} />
            <CheckBoxLabel label="MPC" checked={inspType === 'MPC'} />
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
              <View style={[styles.td, { width: '30%' }]}><Text>{row.label}</Text></View>
              <View style={[styles.td, { width: '70%', alignItems: 'center' }]}>
                <Text>{row.v || ''}</Text>
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
          <View style={styles.tr}>
            <View style={[styles.tdBold, { flex: 1.5, alignItems: 'center' }]}><Text>Size</Text></View>
            {activeCols.map((c, i) => {
              const val = typeof c === 'number' ? (sizeRow?.[`size${c}`] ?? sizeRow?.[`Size${c}`] ?? '') : '';
              return (
                <View key={i} style={[styles.tdBold, { flex: 1, alignItems: 'center' }]}>
                  <Text>{val}</Text>
                </View>
              );
            })}
            <View style={[styles.tdBold, { flex: 1.2, alignItems: 'center' }]}><Text>TOTAL</Text></View>
          </View>
          
          {orderedRows.slice(1).map((row, ri) => {
            const label = row.sizeType ?? row.SizeType ?? '';
            const isBalance = label.toUpperCase().includes('BALANCE');
            return (
              <View key={ri} style={styles.tr}>
                <View style={[styles.td, { flex: 1.5 }]}>
                  <Text style={isBalance ? { color: C.red } : {}}>{label}</Text>
                </View>
                {activeCols.map((c, i) => {
                  const val = typeof c === 'number' ? (row[`size${c}`] ?? row[`Size${c}`] ?? '') : '';
                  return (
                    <View key={i} style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                      <Text>{fmt(val)}</Text>
                    </View>
                  );
                })}
                <View style={[styles.td, { flex: 1.2, alignItems: 'center' }]}>
                  <Text>{fmt(row.sizeTotal ?? row.SizeTotal)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Footer qaName={qaName} qaSig={qaSig} vendorSig={vendorSig} managerSig={managerSig} />
      </Page>

      {/* ════════════════ PAGE 2 ════════════════ */}
      <Page size="A4" style={styles.page}>
        
        {/* Accessories Box Title */}
        <View style={styles.sectionBox}><Text style={styles.sectionTitle}>ACCESSORIES MARKINGS</Text></View>
        <View style={styles.table}>
          {Array(9).fill(0).map((_, i) => {
            const L = accLeft[i] || {};
            const R = accRight[i] || {};
            return (
              <View key={i} style={styles.tr}>
                {/* Left Side */}
                <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                  {L.label && <CheckBoxLabel label={L.label} checked={bool2(L.checked)} />}
                </View>
                <View style={[styles.td, { flex: 1, paddingLeft: 6 }]}><Text>{L.c}</Text></View>
                
                {/* Right Side */}
                <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                  {R.label && <CheckBoxLabel label={R.label} checked={bool2(R.checked)} />}
                </View>
                <View style={[styles.td, { flex: 1, paddingLeft: 6 }]}><Text>{R.c}</Text></View>
              </View>
            );
          })}
        </View>

        {/* Packing Box Title */}
        <View style={styles.sectionBox}><Text style={styles.sectionTitle}>PACKING</Text></View>
        <View style={styles.table}>
          {Array(5).fill(0).map((_, i) => {
            const L = packLeft[i] || {};
            const R = packRight[i] || {};
            return (
              <View key={i} style={styles.tr}>
                {/* Left Side */}
                <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                  {L.label && <CheckBoxLabel label={L.label} checked={bool2(L.checked)} />}
                </View>
                <View style={[styles.td, { flex: 1, paddingLeft: 6 }]}><Text>{L.c}</Text></View>
                
                {/* Right Side */}
                <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                  {R.label && <CheckBoxLabel label={R.label} checked={bool2(R.checked)} />}
                </View>
                <View style={[styles.td, { flex: 1, paddingLeft: 6 }]}><Text>{R.c}</Text></View>
              </View>
            );
          })}
        </View>

        {/* Discrepancies Table */}
        <View style={styles.table}>
          <View style={styles.tr}>
            <View style={[styles.tdBold, { width: 35, alignItems: 'center' }]}><Text>S.NO.</Text></View>
            <View style={[styles.tdBold, { flex: 1, alignItems: 'center' }]}><Text>DURING INSPECTION FOUND FOLLOWING DISCREPANCIES</Text></View>
            <View style={[styles.tdBold, { width: 100, alignItems: 'center' }]}><Text>Remarks</Text></View>
            <View style={[styles.tdBold, { width: 50, alignItems: 'center' }]}><Text>CRITICAL</Text></View>
            <View style={[styles.tdBold, { width: 40, alignItems: 'center' }]}><Text>MAJOR</Text></View>
            <View style={[styles.tdBold, { width: 40, alignItems: 'center' }]}><Text>MINOR</Text></View>
          </View>
          
          {filledDiscs.map((d, i) => (
            <View key={i} style={styles.tr}>
              <View style={[styles.td, { width: 35, alignItems: 'center' }]}><Text>{d.discrepancy ? i + 1 : ''}</Text></View>
              <View style={[styles.td, { flex: 1 }]}><Text>{d.discrepancy ?? ''}</Text></View>
              <View style={[styles.td, { width: 100 }]}><Text>{d.remarks ?? ''}</Text></View>
              <View style={[styles.td, { width: 50, alignItems: 'center' }]}><Text>{d.critical ? fmt(d.critical) : ''}</Text></View>
              <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{d.major ? fmt(d.major) : ''}</Text></View>
              <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{d.minor ? fmt(d.minor) : ''}</Text></View>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.tr}>
            <View style={[styles.tdBold, { flex: 1, alignItems: 'center' }]}><Text>TOTAL</Text></View>
            <View style={[styles.td, { width: 50, alignItems: 'center' }]}><Text>{totalCrit || '0'}</Text></View>
            <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{totalMaj || '0'}</Text></View>
            <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{totalMin || '0'}</Text></View>
          </View>
          <View style={styles.tr}>
            <View style={[styles.tdBold, { flex: 1, alignItems: 'center' }]}><Text>ALLOWED</Text></View>
            <View style={[styles.td, { width: 50, alignItems: 'center' }]}><Text>{critAllowed || '0'}</Text></View>
            <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{majAllowed || '0'}</Text></View>
            <View style={[styles.td, { width: 40, alignItems: 'center' }]}><Text>{minAllowed || '0'}</Text></View>
          </View>
        </View>

        <Text style={{ fontSize: 7 }}>REMARKS:</Text>
        <Text style={styles.remarksText}>{mst.qaRemarks || ''}</Text>

        <Footer qaName={qaName} qaSig={qaSig} vendorSig={vendorSig} managerSig={managerSig} />
      </Page>

      {/* ════════════════ PAGE 3 — SPECS SHEET (conditional or always present for Pre-Final/Final) ════════════════ */}
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
            {/* Draw ~10 empty columns for sizes just like the screenshot */}
            {Array.from({ length: 11 }).map((_, i) => (
              <View key={i} style={[styles.td, { flex: 1 }]} />
            ))}
          </View>

          {/* Render actual size specs if they exist, otherwise render empty grid to match visual */}
          {(!data.sizeSpecs || data.sizeSpecs.length === 0) ? (
            Array.from({ length: 25 }).map((_, r) => (
              <View key={r} style={[styles.tr, { height: 12 }]}>
                <View style={[styles.td, { width: 30 }]} />
                <View style={[styles.td, { flex: 2 }]} />
                <View style={[styles.td, { width: 35 }]} />
                {Array.from({ length: 11 }).map((_, i) => (
                  <View key={i} style={[styles.td, { flex: 1 }]} />
                ))}
              </View>
            ))
          ) : (
            data.sizeSpecs.map((spec, r) => (
              <View key={r} style={styles.tr}>
                <View style={[styles.td, { width: 30, alignItems: 'center' }]}><Text>{r + 1}</Text></View>
                <View style={[styles.td, { flex: 2 }]}><Text>{spec.measurementPoint ?? ''}</Text></View>
                <View style={[styles.td, { width: 35, alignItems: 'center' }]}><Text>{spec.tolerance ?? ''}</Text></View>
                {Array.from({ length: 11 }).map((_, i) => {
                  const val = spec[`size${i + 1}`] ?? spec[`Size${i + 1}`] ?? '';
                  return <View key={i} style={[styles.td, { flex: 1, alignItems: 'center' }]}><Text>{val}</Text></View>;
                })}
              </View>
            ))
          )}
        </View>

        <Footer qaName={qaName} qaSig={qaSig} vendorSig={vendorSig} managerSig={managerSig} />
      </Page>

      {/* ════════════════ PAGE 4 ════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.sectionBox, { backgroundColor: C.gray, border: '1px solid black', width: '100%', padding: '4 6' }]}>
          <Text style={styles.sectionTitle}>Picture taken during inspection</Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
          {images.map((img, i) => (
            <View key={i} style={{ width: '45%', border: '1px solid black', height: 180, marginBottom: 10, padding: 2 }}>
              <Image 
                src={img.base64Content ?? img.Base64Content} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </View>
          ))}
          {/* If no images, draw an empty box like the sample */}
          {images.length === 0 && (
            <View style={{ width: '45%', border: '1px solid black', height: 180, marginBottom: 10 }} />
          )}
        </View>

        <Footer qaName={qaName} qaSig={qaSig} vendorSig={vendorSig} managerSig={managerSig} />
      </Page>

    </Document>
  );
}
