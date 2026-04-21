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
        reportTitle: { fontSize: 11, fontWeight: 700, textAlign: 'center', marginTop: 5, textDecoration: 'underline', color: '#f58f62' },

        // Metadata Grid (Top)
        metaGrid: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 12,
          padding: 5,
          borderWidth: 1,
          borderColor: '#CCC',
          borderRadius: 4,
        },
        metaCol: { width: '48%' },
        metaRow: {
          flexDirection: 'row',
          marginBottom: 4,
          paddingBottom: 1,
        },
        metaLabel: { width: 80, fontWeight: 700, color: '#666' },
        metaValue: { flex: 1, fontWeight: 400 },

        // Section Title
        sectionTitle: {
          fontSize: 9,
          fontWeight: 700,
          backgroundColor: '#F4F6F8',
          padding: 4,
          marginTop: 10,
          marginBottom: 5,
          borderLeftWidth: 3,
          borderColor: '#f58f62',
          textTransform: 'uppercase',
        },

        // TE Checklist
        teGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: 10,
        },
        teItem: {
          width: '33.33%',
          flexDirection: 'row',
          alignItems: 'center',
          padding: 3,
        },
        box: { 
          width: 10, 
          height: 10, 
          borderWidth: 1, 
          borderColor: '#000', 
          marginRight: 6, 
          alignItems: 'center', 
          justifyContent: 'center' 
        },
        boxCheck: { fontSize: 7, fontWeight: 700, color: '#f58f62' },

        // Fabric Table
        table: { borderWidth: 1, borderColor: '#000', width: '100%' },
        tableHeader: { 
          flexDirection: 'row', 
          backgroundColor: '#EEEEEE', 
          borderBottomWidth: 1, 
          borderColor: '#000',
          fontWeight: 700,
        },
        tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
        tableCell: { padding: 4, borderRightWidth: 1, borderColor: '#000', justifyContent: 'center' },
        
        // Measurement Matrix
        matrixHeader: { 
          flexDirection: 'row', 
          backgroundColor: '#f58f62', 
          color: '#FFF',
          borderBottomWidth: 1, 
          borderColor: '#000',
          fontWeight: 700,
          fontSize: 7,
        },
        matrixRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
        matrixCell: { width: 34, textAlign: 'center', padding: 2, fontSize: 6.5, borderRightWidth: 1, borderColor: '#000' },
        matrixLabelCell: { flex: 1, padding: 2, fontSize: 7, fontWeight: 700, borderRightWidth: 1, borderColor: '#000' },

        // Footer
        footer: {
          position: 'absolute',
          bottom: 20,
          left: 30,
          right: 30,
          borderTopWidth: 1,
          borderColor: '#EEE',
          paddingTop: 5,
          flexDirection: 'row',
          justifyContent: 'space-between',
          color: '#919EAB',
          fontSize: 7,
        }
      })
  );

// ----------------------------------------------------------------------

export default function QAProcessEntryPDF({ data }) {
  const styles = useStyles();

  if (!data) return null;

  const { header, savedRecord, fabricTestLines = [], sizeSpecs = [], qaName } = data;

  const teChecks = [
    { key: 'teMeasureToSpec', label: 'Measure to Spec' },
    { key: 'teGarmentFit', label: 'Garment Fit' },
    { key: 'teFabricQuality', label: 'Fabric Quality/Hand' },
    { key: 'teFabricWashTest', label: 'Fabric Wash Test' },
    { key: 'teFabricWeight', label: 'Fabric Weight' },
    { key: 'teFabricColorMatch', label: 'Fabric Color Match' },
    { key: 'teConstruction', label: 'Construction' },
    { key: 'teSewingQuality', label: 'Sewing Quality' },
    { key: 'teComponents', label: 'Components' },
    { key: 'teEmbellishment', label: 'Embellishment' },
    { key: 'teLabeling', label: 'Labeling' },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image source="/logo/logo_full.png" style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>Avance Sourcing (AMS)</Text>
            <Text style={styles.address}>
              Quality Department - Process Inspection Report
            </Text>
          </View>
        </View>

        <Text style={styles.reportTitle}>
          {savedRecord?.insp_Type || 'SAMPLE'} REPORT: {savedRecord?.inspAutoNo || 'N/A'}
        </Text>

        {/* Metadata */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>PO Number:</Text>
              <Text style={styles.metaValue}>{header?.poNo || 'N/A'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Vendor:</Text>
              <Text style={styles.metaValue}>{header?.venderName || 'N/A'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Style No:</Text>
              <Text style={styles.metaValue}>{savedRecord?.styleNo || header?.styleNo || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Received Date:</Text>
              <Text style={styles.metaValue}>{fDate(savedRecord?.receivedDate)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Review Date:</Text>
              <Text style={styles.metaValue}>{fDate(savedRecord?.reviewDate)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>QA Inspector:</Text>
              <Text style={styles.metaValue}>{qaName || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Technical Evaluation */}
        <Text style={styles.sectionTitle}>Technical Evaluation</Text>
        <View style={styles.teGrid}>
          {teChecks.map((check) => (
            <View key={check.key} style={styles.teItem}>
              <View style={styles.box}>
                {savedRecord?.[check.key] && <Text style={styles.boxCheck}>✓</Text>}
              </View>
              <Text>{check.label}</Text>
            </View>
          ))}
        </View>

        {/* Fabric Testing Grid */}
        <Text style={styles.sectionTitle}>Fabric / Trims Testing</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, { width: '40%' }]}><Text>Fabric Tests</Text></View>
            <View style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}><Text>Status</Text></View>
            <View style={[styles.tableCell, { width: '45%', borderRightWidth: 0 }]}><Text>Comments</Text></View>
          </View>
          {fabricTestLines.map((line, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: '40%' }]}><Text>{line.fabricTests || ''}</Text></View>
              <View style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>
                <Text>
                  {line.isApprove === 1 ? 'Approved' : line.isApprove === 0 ? 'Rejected' : '-'}
                </Text>
              </View>
              <View style={[styles.tableCell, { width: '45%', borderRightWidth: 0 }]}><Text>{line.fabricComments || ''}</Text></View>
            </View>
          ))}
        </View>

        {/* Approval Conclusion */}
        <Text style={styles.sectionTitle}>Conclusion & Comments</Text>
        <View style={{ padding: 5, borderWidth: 1, borderColor: '#EEE' }}>
          <Text style={{ fontWeight: 700, marginBottom: 4 }}>General Comments:</Text>
          <Text style={{ marginBottom: 10 }}>{savedRecord?.generalComments || 'None'}</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '45%' }}>
              <Text style={{ fontWeight: 700 }}>TE Comments:</Text>
              <Text>{savedRecord?.teComments || '-'}</Text>
            </View>
            <View style={{ width: '45%' }}>
              <Text style={{ fontWeight: 700 }}>Decision:</Text>
              <Text>
                {savedRecord?.asiGarmentApproved ? 'Proceed to Sales' : 
                 savedRecord?.asiGarmentRejected ? 'Garment Rejected' : 'Under Review'}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by AMS Portal</Text>
          <Text>Page 1 of 2</Text>
        </View>
      </Page>

      {/* Page 2: Measurement Specs */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Measurement Specifications Matrix</Text>
        <View style={styles.table}>
          {/* Matrix Header */}
          <View style={styles.matrixHeader}>
            <View style={styles.matrixLabelCell}><Text>Measurement Points</Text></View>
            <View style={{ width: 40, textAlign: 'center', padding: 2, borderRightWidth: 1, borderColor: '#000' }}><Text>Spec</Text></View>
            <View style={{ width: 40, textAlign: 'center', padding: 2, borderRightWidth: 1, borderColor: '#000' }}><Text>Tol (+/-)</Text></View>
            {[...Array(12)].map((_, idx) => (
              <View key={idx} style={styles.matrixCell}>
                <Text>{sizeSpecs[0]?.[`header${idx + 1}`] || '-'}</Text>
              </View>
            ))}
          </View>
          
          {/* Matrix Data Rows */}
          {sizeSpecs.map((row, idx) => (
            <View key={idx} style={styles.matrixRow}>
              <View style={styles.matrixLabelCell}><Text>{row.measurementPoints}</Text></View>
              <View style={{ width: 40, textAlign: 'center', padding: 2, borderRightWidth: 1, borderColor: '#000' }}><Text>{row.measurements}</Text></View>
              <View style={{ width: 40, textAlign: 'center', padding: 2, borderRightWidth: 1, borderColor: '#000' }}><Text>{row.tolerance}</Text></View>
              {[...Array(12)].map((_, sIdx) => (
                <View key={sIdx} style={styles.matrixCell}>
                  <Text>{row[`qCol${sIdx + 1}`] || row[`col${sIdx + 1}`] || '-'}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Generated by AMS Portal</Text>
          <Text>Page 2 of 2</Text>
        </View>
      </Page>
    </Document>
  );
}

QAProcessEntryPDF.propTypes = {
  data: PropTypes.object,
};
