import React from 'react';
import PropTypes from 'prop-types';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const BLACK = '#000000';
const TABLE_HEADER_BG = '#8E9DAE'; // Slate grayish blue header matching reference image
const BORDER_COLOR = '#000000';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 28,
    color: BLACK,
  },
  headerContainer: {
    marginBottom: 8,
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  companyAddress: {
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    color: '#111111',
    lineHeight: 1.35,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#195B88',
    textDecoration: 'none',
  },
  dateText: {
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  metaContainer: {
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    width: 90,
  },
  metaColon: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    width: 14,
  },
  metaValue: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    textTransform: 'uppercase',
  },
  table: {
    borderWidth: 0.75,
    borderColor: BORDER_COLOR,
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: TABLE_HEADER_BG,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_COLOR,
    minHeight: 22,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_COLOR,
    minHeight: 18,
    alignItems: 'center',
  },
  tableTotalRow: {
    flexDirection: 'row',
    borderTopWidth: 0.75,
    borderTopColor: BORDER_COLOR,
    minHeight: 18,
    alignItems: 'center',
  },
  // Table Columns Widths (matching reference image)
  colPo: {
    width: '12%',
    borderRightWidth: 0.5,
    borderRightColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  colStyle: {
    width: '10%',
    borderRightWidth: 0.5,
    borderRightColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  colColor: {
    width: '18%',
    borderRightWidth: 0.5,
    borderRightColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  colSize: {
    width: '11%',
    borderRightWidth: 0.5,
    borderRightColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  colQty: {
    width: '9%',
    borderRightWidth: 0.5,
    borderRightColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  colPerCartonPcs: {
    width: '11%',
    borderRightWidth: 0.5,
    borderRightColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  colCartonSeries: {
    width: '11%',
    borderRightWidth: 0.5,
    borderRightColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  colTotalShipCarton: {
    width: '9%',
    borderRightWidth: 0.5,
    borderRightColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  colTotalReceivedCarton: {
    width: '9%',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  // Header texts
  thText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#000000',
    textTransform: 'uppercase',
  },
  // Cell texts
  tdText: {
    fontSize: 6.5,
    textAlign: 'center',
  },
  tdTextBold: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  seriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});

function formatNum(val) {
  if (val == null || val === '') return '0';
  const n = Number(String(val).replace(/,/g, ''));
  return Number.isNaN(n) ? String(val) : n.toLocaleString();
}

export default function ReceivedPackingListPDF({ data }) {
  const header = data?.header || {};
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const totals = data?.totals || {};

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Top Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.companyName}>ALL SEASONS TEXTILE</Text>
          <Text style={styles.companyAddress}>
            1441 BROADWAY, SUITE # 6162 NEW YORK , NY 10018
          </Text>
          <Text style={styles.companyAddress}>NEW YORK, USA</Text>
        </View>

        {/* Title and Date Row */}
        <View style={styles.titleRow}>
          <Text style={styles.reportTitle}>Received Packing List</Text>
          <Text style={styles.dateText}>
            Date: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{header.date || '—'}</Text>
          </Text>
        </View>

        {/* Meta Info */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Container No</Text>
            <Text style={styles.metaColon}>:</Text>
            <Text style={[styles.metaValue, { fontFamily: 'Helvetica-Bold' }]}>
              {header.containerNo || '—'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Customer</Text>
            <Text style={styles.metaColon}>:</Text>
            <Text style={styles.metaValue}>{header.customer || '—'}</Text>
          </View>
        </View>

        {/* Packing List Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeaderRow}>
            <View style={styles.colPo}>
              <Text style={styles.thText}>PO#</Text>
            </View>
            <View style={styles.colStyle}>
              <Text style={styles.thText}>STYLE#</Text>
            </View>
            <View style={styles.colColor}>
              <Text style={styles.thText}>COLOR</Text>
            </View>
            <View style={styles.colSize}>
              <Text style={styles.thText}>SIZE</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.thText}>QUANTITY</Text>
            </View>
            <View style={styles.colPerCartonPcs}>
              <Text style={styles.thText}>PER CARTON PCS</Text>
            </View>
            <View style={styles.colCartonSeries}>
              <Text style={styles.thText}>CARTON #</Text>
            </View>
            <View style={styles.colTotalShipCarton}>
              <Text style={styles.thText}>TOTAL SHIP CARTON</Text>
            </View>
            <View style={styles.colTotalReceivedCarton}>
              <Text style={styles.thText}>TOTAL RECEIVED CARTON</Text>
            </View>
          </View>

          {/* Data Rows */}
          {rows.length > 0 ? (
            rows.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.colPo}>
                  <Text style={styles.tdText}>{row.poNo || '—'}</Text>
                </View>
                <View style={styles.colStyle}>
                  <Text style={styles.tdText}>{row.styleNo || '—'}</Text>
                </View>
                <View style={styles.colColor}>
                  <Text style={styles.tdText}>{row.color || '—'}</Text>
                </View>
                <View style={styles.colSize}>
                  <Text style={styles.tdText}>{row.size || '—'}</Text>
                </View>
                <View style={styles.colQty}>
                  <Text style={styles.tdText}>{formatNum(row.quantity)}</Text>
                </View>
                <View style={styles.colPerCartonPcs}>
                  <Text style={styles.tdText}>{formatNum(row.perCartonPcs)}</Text>
                </View>
                <View style={styles.colCartonSeries}>
                  {row.cartonFrom != null && row.cartonTo != null ? (
                    <View style={styles.seriesContainer}>
                      <Text style={styles.tdText}>{row.cartonFrom}</Text>
                      <Text style={styles.tdText}>{row.cartonTo}</Text>
                    </View>
                  ) : (
                    <Text style={styles.tdText}>{row.cartonSeries || '—'}</Text>
                  )}
                </View>
                <View style={styles.colTotalShipCarton}>
                  <Text style={styles.tdText}>{formatNum(row.totalShipCarton)}</Text>
                </View>
                <View style={styles.colTotalReceivedCarton}>
                  <Text style={styles.tdText}>{formatNum(row.totalReceivedCarton)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <View style={{ width: '100%', padding: 8, justifyContent: 'center' }}>
                <Text style={{ textAlign: 'center', fontSize: 8, color: '#777777' }}>
                  No packing list data found
                </Text>
              </View>
            </View>
          )}

          {/* Total Row */}
          <View style={styles.tableTotalRow}>
            <View
              style={{
                width: '51%', // Combined width of PO, Style, Color, Size (12+10+18+11 = 51%)
                borderRightWidth: 0.5,
                borderRightColor: BORDER_COLOR,
                height: '100%',
                justifyContent: 'center',
                paddingRight: 6,
              }}
            >
              <Text style={[styles.tdTextBold, { textAlign: 'right' }]}>
                TOTAL -------------&gt;
              </Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.tdText} />
            </View>
            <View style={styles.colPerCartonPcs}>
              <Text style={styles.tdText} />
            </View>
            <View style={styles.colCartonSeries}>
              <Text style={styles.tdText} />
            </View>
            <View style={styles.colTotalShipCarton}>
              <Text style={styles.tdTextBold}>{formatNum(totals.totalShipCarton)}</Text>
            </View>
            <View style={styles.colTotalReceivedCarton}>
              <Text style={styles.tdTextBold}>{formatNum(totals.totalReceivedCarton)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

ReceivedPackingListPDF.propTypes = {
  data: PropTypes.shape({
    header: PropTypes.object,
    rows: PropTypes.array,
    totals: PropTypes.object,
  }),
};
