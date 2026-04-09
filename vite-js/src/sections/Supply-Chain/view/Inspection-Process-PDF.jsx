import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Page, View, Text, Font, Document, StyleSheet } from '@react-pdf/renderer';

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
        // Common
        col4: { width: '25%' },
        col8: { width: '75%' },
        col6: { width: '50%' },
        mb4: { marginBottom: 4 },
        mb8: { marginBottom: 8 },
        mb12: { marginBottom: 12 },
        h3: { fontSize: 16, fontWeight: 700 },
        h2: { fontSize: 18, fontWeight: 700 },
        h4: { fontSize: 13, fontWeight: 700 },
        body1: { fontSize: 10 },
        body2: { fontSize: 9 },
        bodySmall: { fontSize: 8 },
        subtitle1: { fontSize: 10, fontWeight: 700 },
        subtitle2: { fontSize: 9, fontWeight: 700 },
        alignRight: { textAlign: 'right' },
        center: { textAlign: 'center' },
        bold: { fontWeight: 700 },
        page: {
          fontSize: 9,
          lineHeight: 1.6,
          fontFamily: 'Roboto',
          backgroundColor: '#FFFFFF',
          padding: '40px 24px 60px 24px',
        },
        // Layout
        gridContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        headerSection: {
            borderBottomWidth: 1,
            borderColor: '#000',
            paddingBottom: 10,
            marginBottom: 10,
        },
        sectionHeading: {
            backgroundColor: '#f4f6f8',
            padding: '4px 8px',
            fontSize: 10,
            fontWeight: 700,
            marginBottom: 8,
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#DFE3E8',
        },
        miniHeading: {
          backgroundColor: '#f4f6f8',
          padding: '3px 6px',
          fontSize: 9,
          fontWeight: 700,
          borderWidth: 1,
          borderColor: '#DFE3E8',
          marginTop: 8,
        },
        // Tables
        table: {
          display: 'flex',
          width: 'auto',
          borderWidth: 1,
          borderColor: '#DFE3E8',
        },
        tableRow: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderColor: '#DFE3E8',
          minHeight: 20,
          alignItems: 'center',
        },
        tableHeader: {
            backgroundColor: '#F4F6F8',
            fontWeight: 700,
        },
        tableCell: {
          padding: 4,
          borderRightWidth: 1,
          borderColor: '#DFE3E8',
        },
        noBorderRight: {
            borderRightWidth: 0,
        },
        // Checkboxes
        checkboxContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        checkboxItem: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '30%',
            marginBottom: 4,
        },
        checkbox: {
            width: 10,
            height: 10,
            borderWidth: 1,
            borderColor: '#000',
            marginRight: 4,
            justifyContent: 'center',
            alignItems: 'center',
        },
        checked: {
            fontSize: 8,
            fontWeight: 700,
        },
        checkedFill: {
          width: 6,
          height: 6,
          backgroundColor: '#000',
        },
        tinyCheckedFill: {
          width: 5,
          height: 5,
          backgroundColor: '#000',
        },
        tinyCheckbox: {
          width: 9,
          height: 9,
          borderWidth: 1,
          borderColor: '#000',
          marginRight: 4,
          justifyContent: 'center',
          alignItems: 'center',
        },
        labelCell: {
          width: '22%',
          padding: 3,
          borderRightWidth: 1,
          borderColor: '#DFE3E8',
        },
        valueCell: {
          width: '28%',
          padding: 3,
          borderRightWidth: 1,
          borderColor: '#DFE3E8',
        }
      }),
    []
  );

// ----------------------------------------------------------------------

const shouldCheck = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === 'true' || v === '1' || v === 'yes' || v === 'x';
  }
  return false;
};

const Checkbox = ({ label, checked, styles }) => (
  <View style={styles.checkboxItem}>
    <View style={styles.checkbox}>
      {shouldCheck(checked) ? <View style={styles.checkedFill} /> : null}
    </View>
    <Text style={styles.body2}>{label}</Text>
  </View>
);

Checkbox.propTypes = {
    label: PropTypes.string,
    checked: PropTypes.bool,
    styles: PropTypes.object,
};

// ----------------------------------------------------------------------

export default function InspectionProcessPDF({ data }) {
  const src = data || {};
  const masterSource = src.master || src.Master || {};
  const fabricTesting = src.fabricTesting || src.FabricTesting || [];
  const sizeSpecs = src.sizeSpecs || src.SizeSpecs || [];
  const styles = useStyles();
  const normalizeKey = (k) => String(k || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const keyMap = Object.keys(masterSource || {}).reduce((acc, k) => {
    const nk = normalizeKey(k);
    if (!acc[nk]) acc[nk] = k;
    return acc;
  }, {});
  const gv = (obj, keys, fallback = '') => {
    for (let i = 0; i < keys.length; i += 1) {
      const rawKey = keys[i];
      const normalized = normalizeKey(rawKey);
      const matchedKey = keyMap[normalized] || rawKey;
      const v = obj?.[matchedKey];
      if (v !== undefined && v !== null) return v;
    }
    return fallback;
  };
  const toBool = (value) => {
    if (value === true || value === false) return value;
    if (value === 1 || value === 0) return value === 1;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'y', 'checked', 'x'].includes(v)) return true;
      if (['0', 'false', 'no', 'n', 'unchecked', ''].includes(v)) return false;
    }
    return false;
  };
  const isChecked = (obj, keys) => toBool(gv(obj, keys, null));

  const m = {
    inspType: gv(masterSource, ['insp_Type', 'inspType', 'Insp_Type']),
    inspAutoNo: gv(masterSource, ['inspAutoNo', 'InspAutoNo']),
    receivedDate: gv(masterSource, ['receivedDate', 'ReceivedDate']),
    pono: gv(masterSource, ['pono', 'PONO']),
    venderName: gv(masterSource, ['venderName', 'VenderName']),
    supplierContact: gv(masterSource, ['supplierContact', 'SupplierContact']),
    styleNo: gv(masterSource, ['styleNo', 'StyleNo']),
    styleName: gv(masterSource, ['styleName', 'StyleName']),
    coo: gv(masterSource, ['coo', 'COO']),
    savedInSession: gv(masterSource, ['savedInSession', 'SavedInSession']),
    sampleType: gv(masterSource, ['sampleType', 'SampleType']),
    reviewDate: gv(masterSource, ['reviewDate', 'ReviewDate']),
    teComments: gv(masterSource, ['tE_Comments', 'te_Comments', 'TE_Comments']),
    fdmrComments: gv(masterSource, ['fdmR_Comments', 'FDMR_Comments', 'fdmrComments']),
    fabricStandardGSM: gv(masterSource, ['fabricStandardGSM', 'FabricStandardGSM']),
    actualWeightGSM: gv(masterSource, ['actualWeightGSM', 'ActualWeightGSM']),
    fabricApproved: gv(masterSource, ['fabricApproved', 'FabricApproved']),
    constructionFitComments: gv(masterSource, ['constructionFitComments', 'ConstructionFitComments']),
    embellishmentComments: gv(masterSource, ['embellishmentComments', 'EmbellishmentComments']),
    generalComments: gv(masterSource, ['generalComments', 'GeneralComments']),
    teMeasureToSpec: isChecked(masterSource, ['tE_MeasureToSpec', 'TE_MeasureToSpec', 'teMeasureToSpec', 'measureToSpec']),
    teFabricWeight: isChecked(masterSource, ['tE_FabricWeight', 'TE_FabricWeight', 'teFabricWeight', 'fabricWeight']),
    teComponents: isChecked(masterSource, ['tE_Components', 'TE_Components', 'teComponents', 'components']),
    teGarmentFit: isChecked(masterSource, ['tE_GarmentFit', 'TE_GarmentFit', 'teGarmentFit', 'garmentFit']),
    teColorMatch: isChecked(masterSource, ['tE_FabricColorMatch', 'TE_FabricColorMatch', 'teFabricColorMatch', 'fabricColorMatch']),
    teEmbellishment: isChecked(masterSource, ['tE_Embellishment', 'TE_Embellishment', 'teEmbellishment', 'embellishment']),
    teFabricQuality: isChecked(masterSource, ['tE_FabricQuality', 'TE_FabricQuality', 'teFabricQuality', 'fabricQuality']),
    teConstruction: isChecked(masterSource, ['tE_Construction', 'TE_Construction', 'teConstruction', 'construction']),
    teLabeling: isChecked(masterSource, ['tE_Labeling', 'TE_Labeling', 'teLabeling', 'labeling']),
    teFabricWash: isChecked(masterSource, ['tE_FabricWashTest', 'TE_FabricWashTest', 'teFabricWashTest', 'fabricWashTest']),
    teSewingQuality: isChecked(masterSource, ['tE_SewingQuality', 'TE_SewingQuality', 'teSewingQuality', 'sewingQuality']),
    decisionApproved: isChecked(masterSource, ['asI_GarmentApproved', 'ASI_GarmentApproved', 'asiGarmentApproved', 'garmentApproved']),
    decisionRejected: isChecked(masterSource, ['asI_GarmentRejected', 'ASI_GarmentRejected', 'asiGarmentRejected', 'garmentRejected']),
    decisionProceedSales: isChecked(masterSource, ['asI_ProceedToSales', 'ASI_ProceedToSales', 'asiProceedToSales', 'proceedToSales']),
    decisionProceedWithSales: isChecked(masterSource, ['asI_ProceedWithSales', 'ASI_ProceedWithSales', 'asiProceedWithSales', 'proceedWithSales']),
    decisionProceedProd: isChecked(masterSource, ['asI_ProceedWithProd', 'ASI_ProceedWithProd', 'asiProceedWithProd', 'proceedWithProd']),
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header close to legacy */}
        <View style={styles.headerSection}>
          <Text style={styles.h2}>SAMPLE INSPECTION REPORT</Text>
          <View style={[styles.gridContainer, { marginTop: 2 }]}>
            <Text style={styles.body2}>PP Sample Inspection Report</Text>
            <Text style={styles.body2}>Printed on: {fDate(new Date())}</Text>
          </View>
        </View>

        {/* Basic info table style like legacy */}
        <View style={[styles.table, styles.mb8]}>
          <View style={styles.tableRow}>
            <View style={styles.labelCell}><Text style={styles.bodySmall}>Received Date</Text></View>
            <View style={styles.valueCell}><Text style={styles.bodySmall}>{fDate(m.receivedDate)}</Text></View>
            <View style={styles.labelCell}><Text style={styles.bodySmall}>Supplier/Contact</Text></View>
            <View style={[styles.valueCell, styles.noBorderRight]}><Text style={styles.bodySmall}>{m.venderName || m.supplierContact}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.labelCell}><Text style={styles.bodySmall}>Style No</Text></View>
            <View style={styles.valueCell}><Text style={styles.bodySmall}>{m.styleNo}</Text></View>
            <View style={styles.labelCell}><Text style={styles.bodySmall}>COO</Text></View>
            <View style={[styles.valueCell, styles.noBorderRight]}><Text style={styles.bodySmall}>{m.coo}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.labelCell}><Text style={styles.bodySmall}>Style Name</Text></View>
            <View style={styles.valueCell}><Text style={styles.bodySmall}>{m.styleName}</Text></View>
            <View style={styles.labelCell}><Text style={styles.bodySmall}>Saved in Session</Text></View>
            <View style={[styles.valueCell, styles.noBorderRight]}><Text style={styles.bodySmall}>{m.savedInSession}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.labelCell}><Text style={styles.bodySmall}>Sample Type</Text></View>
            <View style={styles.valueCell}><Text style={styles.bodySmall}>{m.sampleType}</Text></View>
            <View style={styles.labelCell}><Text style={styles.bodySmall}>Review Date</Text></View>
            <View style={[styles.valueCell, styles.noBorderRight]}><Text style={styles.bodySmall}>{fDate(m.reviewDate)}</Text></View>
          </View>
        </View>

        <View style={[styles.gridContainer, styles.mb8]}>
          <Text style={styles.body2}><Text style={styles.bold}>PO No: </Text>{m.pono}</Text>
          <Text style={styles.body2}><Text style={styles.bold}>Insp. No: </Text>{m.inspAutoNo}</Text>
          <Text style={styles.body2}><Text style={styles.bold}>Type: </Text>{m.inspType}</Text>
        </View>

        {/* Technical Evaluation */}
        <View style={styles.sectionHeading}>
            <Text>TESTING AND EVALUATION to be PERFORMED (check of that apply)</Text>
        </View>
        <View style={[styles.checkboxContainer, styles.mb12]}>
            <Checkbox label="Measure To Spec" checked={m.teMeasureToSpec} styles={styles} />
            <Checkbox label="Fabric Color Match" checked={m.teColorMatch} styles={styles} />
            <Checkbox label="Components" checked={m.teComponents} styles={styles} />
            <Checkbox label="Garment Fit" checked={m.teGarmentFit} styles={styles} />
            <Checkbox label="Fabric Weight" checked={m.teFabricWeight} styles={styles} />
            <Checkbox label="Embellishment" checked={m.teEmbellishment} styles={styles} />
            <Checkbox label="Fabric Quality" checked={m.teFabricQuality} styles={styles} />
            <Checkbox label="Construction" checked={m.teConstruction} styles={styles} />
            <Checkbox label="Labeling" checked={m.teLabeling} styles={styles} />
            <Checkbox label="Fabric Wash Test" checked={m.teFabricWash} styles={styles} />
            <Checkbox label="Sewing Quality" checked={m.teSewingQuality} styles={styles} />
        </View>
        <View style={[styles.table, styles.mb8]}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, { width: '22%' }]}><Text style={styles.body2}>Comments</Text></View>
            <View style={[styles.tableCell, { width: '78%', borderRightWidth: 0 }]}><Text style={styles.body2}>{m.teComments}</Text></View>
          </View>
        </View>

        {/* Legacy title before size specs */}
        <View style={styles.miniHeading}>
          <Text>FINISHED DIMENSION MEASUREMENT RESULTS</Text>
        </View>

        {/* Size Specifications */}
        <View style={styles.sectionHeading}>
            <Text>MEASUREMENT THAT DO NOT MEET REQUIRED SPEC.</Text>
        </View>
        {sizeSpecs && sizeSpecs.length > 0 ? (
            <View style={styles.table}>
                {/* Headers Row */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={[styles.tableCell, { width: '25%' }]}><Text style={styles.subtitle2}>Points of Measurement</Text></View>
                    <View style={[styles.tableCell, { width: '5%' }]}><Text style={styles.subtitle2}>Tol.</Text></View>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <View key={i} style={[styles.tableCell, { width: '8.75%', borderRightWidth: i === 8 ? 0 : 1 }]}>
                            <Text style={[styles.subtitle2, styles.center]}>{sizeSpecs[0][`header${i}`] || '-'}</Text>
                        </View>
                    ))}
                </View>
                {sizeSpecs.map((row, index) => (
                    <View key={index} style={{ borderBottomWidth: 1, borderColor: '#DFE3E8' }}>
                        <View style={[styles.tableRow, { borderBottomWidth: 0, minHeight: 15 }]}>
                            <View style={[styles.tableCell, { width: '25%', height: '100%' }]}><Text style={styles.body2}>{row.measurementPoints}</Text></View>
                            <View style={[styles.tableCell, { width: '5%', height: '100%' }]}><Text style={[styles.body2, styles.center]}>{row.tolerance}</Text></View>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <View key={i} style={[styles.tableCell, { width: '8.75%', borderRightWidth: i === 8 ? 0 : 1 }]}>
                                    <Text style={[styles.body2, styles.center]}>{row[`col${i}`]}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={[styles.tableRow, { borderBottomWidth: 0, minHeight: 15, backgroundColor: '#f9fafb' }]}>
                            <View style={[styles.tableCell, { width: '25%' }]}><Text style={[styles.body2, { color: '#637381' }]}>Test found d/n</Text></View>
                            <View style={[styles.tableCell, { width: '5%' }]} />
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <View key={i} style={[styles.tableCell, { width: '8.75%', borderRightWidth: i === 8 ? 0 : 1 }]}>
                                    <Text style={[styles.body2, styles.center, styles.bold]}>{row[`qCol${i}`]}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        ) : m.fdmrComments ? (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, { width: '8%' }]}><Text style={styles.subtitle2}>No.</Text></View>
                <View style={[styles.tableCell, { width: '35%' }]}><Text style={styles.subtitle2}>Measurement Points</Text></View>
                <View style={[styles.tableCell, { width: '10%' }]}><Text style={styles.subtitle2}>TOL+/-</Text></View>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <View key={i} style={[styles.tableCell, { width: '5.875%', borderRightWidth: i === 8 ? 0 : 1 }]}>
                    <Text style={[styles.subtitle2, styles.center]} />
                  </View>
                ))}
              </View>
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '8%' }]}><Text style={styles.body2}>1</Text></View>
                <View style={[styles.tableCell, { width: '35%' }]}><Text style={styles.body2}>{m.fdmrComments}</Text></View>
                <View style={[styles.tableCell, { width: '10%' }]}><Text style={styles.body2} /></View>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <View key={i} style={[styles.tableCell, { width: '5.875%', borderRightWidth: i === 8 ? 0 : 1 }]}>
                    <Text style={[styles.body2, styles.center]} />
                  </View>
                ))}
              </View>
            </View>
        ) : (
            <Text style={styles.body2}>No measurement points defined.</Text>
        )}

        {/* Fabric Testing Grid */}
        <View style={styles.sectionHeading}>
            <Text>FABRIC TESTING AND GARMENT FEEDBACK</Text>
        </View>
        <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, { width: '8%' }]}><Text style={styles.subtitle2}>S.No</Text></View>
                <View style={[styles.tableCell, { width: '38%' }]}><Text style={styles.subtitle2}>FABRIC TESTS</Text></View>
                <View style={[styles.tableCell, { width: '14%' }]}><Text style={styles.subtitle2}>APPROVED</Text></View>
                <View style={[styles.tableCell, { width: '14%' }]}><Text style={styles.subtitle2}>REJECTED</Text></View>
                <View style={[styles.tableCell, { width: '26%', borderRightWidth: 0 }]}><Text style={styles.subtitle2}>COMMENTS</Text></View>
            </View>
            {fabricTesting?.map((row, index) => (
                <View key={index} style={styles.tableRow}>
                    <View style={[styles.tableCell, { width: '8%' }]}><Text style={styles.body2}>{index + 1}</Text></View>
                    <View style={[styles.tableCell, { width: '38%' }]}><Text style={styles.body2}>{row.fabricTests}</Text></View>
                    <View style={[styles.tableCell, { width: '14%', alignItems: 'center', justifyContent: 'center' }]}>
                      <View style={styles.tinyCheckbox}>
                        {row.isApprove === 1 ? <View style={styles.tinyCheckedFill} /> : null}
                      </View>
                    </View>
                    <View style={[styles.tableCell, { width: '14%', alignItems: 'center', justifyContent: 'center' }]}>
                      <View style={styles.tinyCheckbox}>
                        {row.isApprove === 0 ? <View style={styles.tinyCheckedFill} /> : null}
                      </View>
                    </View>
                    <View style={[styles.tableCell, { width: '26%', borderRightWidth: 0 }]}><Text style={styles.body2}>{row.fabricComments}</Text></View>
                </View>
            ))}
            {(!fabricTesting || fabricTesting.length === 0) && (
                <View style={styles.tableRow}><View style={[styles.tableCell, { width: '100%', borderRightWidth: 0 }]}><Text style={styles.center}>No record</Text></View></View>
            )}
            <View style={[styles.tableRow, { backgroundColor: '#f4f6f8' }]}>
                <View style={[styles.tableCell, { width: '34%' }]}>
                    <Text style={styles.body2}><Text style={styles.bold}>FABRIC STANDARD GSM</Text> {m.fabricStandardGSM ?? ''}</Text>
                </View>
                <View style={[styles.tableCell, { width: '33%' }]}>
                    <Text style={styles.body2}><Text style={styles.bold}>ACTUAL WEIGHT GSM</Text> {m.actualWeightGSM ?? ''}</Text>
                </View>
                <View style={[styles.tableCell, { width: '33%', borderRightWidth: 0 }]}>
                    <Text style={styles.body2}>
                      <Text style={styles.bold}>FABRIC APPROVED?</Text>{' '}
                      {m.fabricApproved === 1 ? 'YES' : m.fabricApproved === 0 ? 'NO' : 'N/A'}
                    </Text>
                </View>
            </View>
        </View>

        {/* Feedback blocks (present in legacy report) */}
        <View style={styles.sectionHeading}>
          <Text>CONSTRUCTION / FIT</Text>
        </View>
        <View style={[styles.table, styles.mb8]}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, { width: '100%', borderRightWidth: 0 }]}>
              <Text style={styles.body2}>{m.constructionFitComments || ''}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text>EMBELLISHMENT</Text>
        </View>
        <View style={[styles.table, styles.mb8]}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, { width: '100%', borderRightWidth: 0 }]}>
              <Text style={styles.body2}>{m.embellishmentComments || ''}</Text>
            </View>
          </View>
        </View>
        <View style={styles.mb4}>
                <Text><Text style={styles.bold}>General Comments: </Text>{m.generalComments}</Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text>APPROVAL AND BUYER INSTRUCTION MUST BE COMPLETE BEFORE SUBMITTING TO FACTORY</Text>
        </View>
        <View style={[styles.table, styles.mb8]}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, { width: '25%' }]}><Text style={styles.body2}>Supplier Instruction:</Text></View>
            <View style={[styles.tableCell, { width: '75%', borderRightWidth: 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <View style={styles.tinyCheckbox}>{m.decisionRejected ? <View style={styles.tinyCheckedFill} /> : null}</View>
                <Text style={styles.bodySmall}>Garment Rejected - Submit a corrected fit sample</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <View style={styles.tinyCheckbox}>{m.decisionProceedSales ? <View style={styles.tinyCheckedFill} /> : null}</View>
                <Text style={styles.bodySmall}>Proceed to Sales Sample with changes/corrections</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <View style={styles.tinyCheckbox}>{m.decisionProceedWithSales ? <View style={styles.tinyCheckedFill} /> : null}</View>
                <Text style={styles.bodySmall}>Proceed with Sales Samples</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <View style={styles.tinyCheckbox}>{m.decisionProceedProd ? <View style={styles.tinyCheckedFill} /> : null}</View>
                <Text style={styles.bodySmall}>Proceed with Production Quantities</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.tinyCheckbox}>{m.decisionApproved ? <View style={styles.tinyCheckedFill} /> : null}</View>
                <Text style={styles.bodySmall}>Garment approved - waiting for customer selection</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 8, borderTopWidth: 1, paddingTop: 8 }}>
          <Text style={[styles.bodySmall, styles.alignRight]}>Initial and Date</Text>
        </View>

      </Page>
    </Document>
  );
}

InspectionProcessPDF.propTypes = {
  data: PropTypes.object,
};
