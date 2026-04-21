import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Page, View, Text, Font, Image, Document, StyleSheet } from '@react-pdf/renderer';

import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

Font.register({
  family: 'Roboto',
  fonts: [{ src: '/fonts/Roboto-Regular.ttf' }, { src: '/fonts/Roboto-Bold.ttf' }],
});

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        page: {
          padding: '20px 30px',
          fontFamily: 'Roboto',
          fontSize: 8,
          backgroundColor: '#FFFFFF',
        },
        // Header
        header: {
          flexDirection: 'row',
          marginBottom: 10,
        },
        logo: { width: 140, height: 60 },
        companyInfo: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: 70, // offset logo width to center
        },
        companyName: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
        address: { fontSize: 7, textAlign: 'center', color: '#444' },
        reportTitle: { fontSize: 10, fontWeight: 700, textAlign: 'center', marginTop: 5, textDecoration: 'underline' },

        // Metadata Grid (Top)
        metaGrid: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        metaCol: { width: '48%' },
        metaRow: {
          flexDirection: 'row',
          borderBottomWidth: 0.5,
          borderColor: '#000',
          marginBottom: 4,
          paddingBottom: 1,
        },
        metaLabel: { width: 60, fontWeight: 700 },
        metaValue: { flex: 1 },

        // Checkboxes Section
        checkboxes: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 15,
          marginBottom: 10,
        },
        checkboxItem: { flexDirection: 'row', alignItems: 'center' },
        box: { width: 8, height: 8, borderWidth: 1, borderColor: '#000', marginRight: 4, alignItems: 'center', justifyContent: 'center' },
        boxCheck: { fontSize: 6, fontWeight: 700 },

        // Standard Table
        table: { borderWidth: 1, borderColor: '#000', width: '100%' },
        tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
        tableCell: { padding: 4, borderRightWidth: 1, borderColor: '#000', justifyContent: 'center' },
        noBorder: { borderRightWidth: 0, borderBottomWidth: 0 },

        // Conclusion
        conclusionSection: {
          flexDirection: 'row',
          marginTop: 15,
          marginBottom: 15,
          fontSize: 12,
          fontWeight: 700,
        },

        // Grid matrix
        matrixCell: { width: 34, textAlign: 'center', padding: 2, fontSize: 7, borderRightWidth: 1, borderColor: '#000' },
        matrixLabel: { width: 100, padding: 2, fontSize: 7, fontWeight: 700, borderRightWidth: 1, borderColor: '#000' },

        // Checklist Section (Page 2)
        checklistSection: { marginTop: 10, borderWidth: 1, borderColor: '#000' },
        checklistTitle: { 
          backgroundColor: '#EEE', 
          textAlign: 'center', 
          fontWeight: 700, 
          padding: 3, 
          borderBottomWidth: 1, 
          borderColor: '#000',
          fontSize: 8,
          textTransform: 'uppercase'
        },
        checklistGrid: { flexDirection: 'row', flexWrap: 'wrap' },
        checklistItem: { width: '50%', flexDirection: 'row', padding: 3, borderBottomWidth: 0.5, borderColor: '#EEE', alignItems: 'center' },

        // Signatures
        sigContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
        sigBlock: { width: 150, alignItems: 'center' },
        sigLine: { borderTopWidth: 1, borderColor: '#000', width: '100%', marginBottom: 3 },
        sigTitle: { fontWeight: 700, textTransform: 'uppercase', fontSize: 7 },
        sigImg: { width: 80, height: 35, marginBottom: 2 }
      }),
    []
  );

// ----------------------------------------------------------------------

const CHECKLIST_SECTIONS = [
  { label: 'QUANTITY', key: 'quantity_D', rem: 'quantity_D_Remarks' },
  { label: 'CONFORMITY', key: 'conformity_D', rem: 'conformity_D_Remarks' },
  { label: 'WORKMANSHIP', key: 'workmanship_D', rem: 'workmanship_D_Remarks' },
  { label: 'PACKING', key: 'packing_D', rem: 'packing_D_Remarks' },
  { label: 'MARKING', key: 'marking_D', rem: 'marking_D_Remarks' },
  { label: 'MEASUREMENT', key: 'measurement_D', rem: 'measurement_D_Remarks' },
];

const ACCESSORIES_MARKINGS = [
  { label: 'DYE LOTS', key: 'dyeLot', com: 'dyeLotCom' },
  { label: 'PATTERN', key: 'pattern', com: 'patternCom' },
  { label: 'GENERAL APPEARANCE', key: 'generalAppearance', com: 'generalAppCom' },
  { label: 'MAIN LABEL', key: 'mainLabel', com: 'mainLblCom' },
  { label: 'MAIN LABEL PLACEMENT', key: 'mainLabelPlacement', com: 'mainLblPlacementCom' },
  { label: 'CARE LABEL', key: 'careLabel', com: 'careLblCom' },
  { label: 'CARE LABEL PLACEMENT', key: 'careLabelPlacement', com: 'careLblPlacementCom' },
  { label: 'BUTTONS', key: 'buttonAccessory', com: 'buttonsCom' },
  { label: 'ZIPPER', key: 'zipper', com: 'zipperCom' },
  { label: 'DRAWSTRING', key: 'drawingString', com: 'drawingStrCom' },
  { label: 'HANGTAG', key: 'hangTag', com: 'hangtagCom' },
  { label: 'PRICE TICKET', key: 'priceTicket', com: 'priceTicketCom' },
  { label: 'HANGER', key: 'hanger', com: 'hangerCom' },
  { label: 'CONTENT LABEL', key: 'contentLabel', com: 'contentLblCom' },
  { label: 'FOLD METHOD', key: 'foldMethod', com: 'foldMethodCom' },
  { label: 'INTERLINING', key: 'interlining', com: 'interLiningCom' },
  { label: 'ADDITIONAL LABEL', key: 'additionalLbl', com: 'additionalLblComm' },
];

const PACKING_CHECKLIST = [
  { label: 'CARTON DIMENSION', key: 'cartonDimen', com: 'cartonDimmCom' },
  { label: 'CARTON THICKNESS', key: 'cartonThickness', com: 'crtnThicknessCom' },
  { label: 'GROSS WT', key: 'grossWT', com: 'grossWTCom' },
  { label: 'NO. OF PCS/INNER PACK', key: 'noOfPcsInnerPack', com: 'noOfPcsInnerPackCom' },
  { label: 'CARTON MARKING', key: 'cartonMarking', com: 'cartonMarkingCom' },
  { label: 'NET WT', key: 'netWT', com: 'netWTCom' },
  { label: 'NO. OF PCS/CARTON', key: 'noOfPcsCarton', com: 'noOfPcsCrtnCom' },
  { label: 'POLYBAG/BLISTER BAG', key: 'polyBag', com: 'polyBagBlisterBagCom' },
  { label: 'U.P.C', key: 'ups', com: 'upcCom' },
];

export default function QAInspectionPDF({ data }) {
  const styles = useStyles();

  if (!data) return null;

  const {
    header,
    savedInspection,
    discrepancies,
    inspectionDtlRows,
    signatures,
    images,
    qaName,
    aqlSystemName
  } = data || {};

  const inspType = String(savedInspection?.inspectionType || '').trim().toUpperCase();

  const renderCheckbox = (label, active) => (
    <View style={styles.checkboxItem}>
      <View style={styles.box}>{active && <Text style={styles.boxCheck}>x</Text>}</View>
      <Text>{label}</Text>
    </View>
  );

  const renderSignatures = () => (
    <View style={styles.sigContainer}>
      {['QA', 'VENDOR', 'MANAGER QA'].map((type) => {
        const sigType = type.split(' ')[0].toUpperCase();
        const sig = signatures?.find(s => s.signType === sigType);
        return (
          <View key={type} style={styles.sigBlock}>
            {sig?.base64Data && <Image source={sig.base64Data} style={styles.sigImg} />}
            <View style={styles.sigLine} />
            <Text style={styles.sigTitle}>{type} SIGN</Text>
          </View>
        );
      })}
    </View>
  );

  const rowTypes = [
    "SIZE", "ORDER QTY", "OFFER QTY", "FABRIC IN HOUSE", "CUT QTY", 
    "IN-LINE", "OFF-LINE", "QTY PACKED PCS / SET", "QTY PACKED CARTON", 
    "QTY INSPECTED CARTON", "QTY BALANCE/EXTRA"
  ];

  return (
    <Document title={`Inspection_Report_${savedInspection?.InspNo}`}>
      {/* PAGE 1 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image source="/logo/AMSlogo.png" style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>Apparel Merchandising Services</Text>
            <Text style={styles.address}>A M S House 84, Kokan Housing Society Alamgir Road - Postal Code: 74800</Text>
            <Text style={styles.address}>Telephone # : (+92213) 485-3935 & 36   Karachi - Pakistan.</Text>
            <Text style={styles.reportTitle}>INSPECTION REPORT</Text>
          </View>
        </View>

        <View style={styles.checkboxes}>
          {renderCheckbox('IPC', inspType === 'IPC')}
          {renderCheckbox('PRE-FINAL', inspType === 'PRE-FINAL')}
          {renderCheckbox('FINAL', inspType === 'FINAL')}
          {renderCheckbox('MPC', inspType === 'MPC')}
          <Text style={{ marginLeft: 20 }}>DATE :  {fDate(savedInspection?.mstInspectionDate)}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Q.A. NAME</Text><Text style={styles.metaValue}>{qaName || 'N/A'}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Report #</Text><Text style={styles.metaValue}>{savedInspection?.inspNo || 'N/A'}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>P.O. #:</Text><Text style={styles.metaValue}>{header?.poNo || 'N/A'}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Color</Text><Text style={styles.metaValue}>{savedInspection?.colorway || header?.colorway || 'N/A'}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>DESCRIPTION</Text><Text style={styles.metaValue}>{header?.article || 'N/A'}</Text></View>
          </View>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>ORDER QTY</Text><Text style={styles.metaValue}>{header?.orderQty || 0}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>STYLE NO</Text><Text style={styles.metaValue}>{header?.styleNo || 'N/A'}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>System</Text><Text style={styles.metaValue}>{aqlSystemName || 'N/A'}</Text></View>
            <View style={{...styles.metaRow, borderBottomWidth: 0}} />
            <View style={styles.metaRow}><Text style={styles.metaLabel}>RATIO</Text><Text style={styles.metaValue}>{savedInspection?.ratio || header?.ration || 'N/A'}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>VENDOR</Text><Text style={styles.metaValue}>{header?.venderName || 'N/A'}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Sample Size</Text><Text style={styles.metaValue}>{savedInspection?.sampleSize || '0.00'}</Text></View>
          </View>
        </View>

        <View style={styles.table}>
          {CHECKLIST_SECTIONS.map((sec, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: 140 }]}><Text>{sec.label}</Text></View>
              <View style={[styles.tableCell, { width: 60, alignItems: 'center' }]}><Text>{savedInspection?.[sec.key] || '-'}</Text></View>
              <View style={[styles.tableCell, { flex: 1, borderRightWidth: 0 }]}><Text>{savedInspection?.[sec.rem] || ''}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.conclusionSection}>
          <Text style={{ width: 200 }}>OVERALL CONCLUSION</Text>
          <Text style={{ color: savedInspection?.passFail ? '#00A76F' : '#FF5630', marginLeft: 50 }}>
            {savedInspection?.passFail ? 'PASS' : 'FAIL'}
          </Text>
        </View>

        {/* Matrix on Page 1 Bottom (as per screenshot) */}
        <View style={styles.table}>
          {rowTypes.map((type, i) => {
            const rowData = inspectionDtlRows?.find(r => r.sizeType === type);
            const isRedRow = type === "QTY BALANCE/EXTRA";
            return (
              <View key={i} style={styles.tableRow}>
                <View style={styles.matrixLabel}><Text style={isRedRow ? {color: 'red'} : {}}>{type}</Text></View>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                  <View key={n} style={styles.matrixCell}><Text>{rowData?.[`size${n}`] || ''}</Text></View>
                ))}
                <View style={{...styles.matrixCell, borderRightWidth: 0}}><Text>{rowData?.sizeTotal || ''}</Text></View>
              </View>
            );
          })}
        </View>
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>ACCESSORIES MARKINGS</Text>
          <View style={styles.checklistGrid}>
            {ACCESSORIES_MARKINGS.map((item, i) => (
              <View key={i} style={styles.checklistItem}>
                <View style={styles.box}>{savedInspection?.[item.key] && <Text style={styles.boxCheck}>x</Text>}</View>
                <Text style={{ width: 100, fontSize: 7 }}>{item.label}</Text>
                <Text style={{ flex: 1, color: '#444' }}>{savedInspection?.[item.com] || ''}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>Packing</Text>
          <View style={styles.checklistGrid}>
            {PACKING_CHECKLIST.map((item, i) => (
              <View key={i} style={styles.checklistItem}>
                <View style={styles.box}>{savedInspection?.[item.key] && <Text style={styles.boxCheck}>x</Text>}</View>
                <Text style={{ width: 100, fontSize: 7 }}>{item.label}</Text>
                <Text style={{ flex: 1, color: '#444' }}>{savedInspection?.[item.com] || ''}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 10, borderWidth: 1, borderColor: '#000' }}>
          <View style={{...styles.tableRow, backgroundColor: '#EEE', padding: 2}}>
            <View style={{ width: 30, borderRightWidth: 1, alignItems: 'center' }}><Text style={styles.sigTitle}>S.NO</Text></View>
            <View style={{ flex: 1, borderRightWidth: 1, paddingLeft: 5 }}><Text style={styles.sigTitle}>DURING INSPECTION FOUND FOLLOWING DISCREPANCIES</Text></View>
            <View style={{ width: 100, borderRightWidth: 1, paddingLeft: 5 }}><Text style={styles.sigTitle}>Remarks</Text></View>
            <View style={{ width: 45, borderRightWidth: 1, alignItems: 'center' }}><Text style={styles.sigTitle}>CRITICAL</Text></View>
            <View style={{ width: 45, borderRightWidth: 1, alignItems: 'center' }}><Text style={styles.sigTitle}>MAJOR</Text></View>
            <View style={{ width: 45, alignItems: 'center' }}><Text style={styles.sigTitle}>MINOR</Text></View>
          </View>
          {discrepancies?.map((d, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={{ width: 30, borderRightWidth: 1, alignItems: 'center' }}><Text>{i + 1}</Text></View>
              <View style={{ flex: 1, borderRightWidth: 1, paddingLeft: 5 }}><Text>{d.discrepancy}</Text></View>
              <View style={{ width: 100, borderRightWidth: 1, paddingLeft: 5 }}><Text>{d.remarks || '-'}</Text></View>
              <View style={{ width: 45, borderRightWidth: 1, alignItems: 'center' }}><Text>{d.critical || '0'}</Text></View>
              <View style={{ width: 45, borderRightWidth: 1, alignItems: 'center' }}><Text>{d.major || '0'}</Text></View>
              <View style={{ width: 45, alignItems: 'center' }}><Text>{d.minor || '0'}</Text></View>
            </View>
          ))}
          <View style={styles.tableRow}>
            <View style={{ flex: 1, borderRightWidth: 1, alignItems: 'flex-end', paddingRight: 10 }}><Text style={styles.sigTitle}>TOTAL</Text></View>
            <View style={{ width: 45, borderRightWidth: 1, alignItems: 'center' }}><Text>{savedInspection?.critical || 0}</Text></View>
            <View style={{ width: 45, borderRightWidth: 1, alignItems: 'center' }}><Text>{savedInspection?.major || 0}</Text></View>
            <View style={{ width: 45, alignItems: 'center' }}><Text>{savedInspection?.minor || 0}</Text></View>
          </View>
          <View style={{...styles.tableRow, borderBottomWidth: 0}}>
             <View style={{ flex: 1, borderRightWidth: 1, alignItems: 'flex-end', paddingRight: 10 }}><Text style={styles.sigTitle}>ALLOWED</Text></View>
             <View style={{ width: 45, borderRightWidth: 1, alignItems: 'center' }}><Text>{savedInspection?.criticalAllowed || 0}</Text></View>
             <View style={{ width: 45, borderRightWidth: 1, alignItems: 'center' }}><Text>{savedInspection?.majorAllowed || 0}</Text></View>
             <View style={{ width: 45, alignItems: 'center' }}><Text>{savedInspection?.minorAllowed || 0}</Text></View>
          </View>
        </View>

        <Text style={{ marginTop: 5 }}>REMARKS: {savedInspection?.qaRemarks}</Text>

        <View style={{ flex: 1 }} />
        {renderSignatures()}
      </Page>

      {/* PAGE 3 */}
      {images?.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={{ backgroundColor: '#EEE', padding: 3, borderWidth: 1, borderColor: '#000', marginBottom: 5 }}>
            <Text style={styles.sigTitle}>Picture taken during inspection</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {images.map((img, idx) => (
              <View key={idx} style={{ width: '48%', borderBottomWidth: 1, paddingBottom: 5, borderColor: '#EEE' }}>
                <Image source={img.base64Content} style={{ width: '100%', height: 200, objectFit: 'contain' }} />
                <Text style={{ textAlign: 'center', fontSize: 7, marginTop: 3 }}>{img.imgHeader || img.photoName}</Text>
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          {renderSignatures()}
        </Page>
      )}
    </Document>
  );
}

QAInspectionPDF.propTypes = {
  data: PropTypes.object,
};
