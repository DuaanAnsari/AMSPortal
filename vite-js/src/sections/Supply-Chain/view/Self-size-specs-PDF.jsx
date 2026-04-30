import PropTypes from 'prop-types';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const BLACK = '#000000';
const GRAY = '#F4F6F8';
const ORANGE = '#F4F6F8';
const ORANGE_DEEP = '#DFE3E8';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: 22,
    paddingBottom: 28,
    paddingHorizontal: 26,
    color: BLACK,
  },
  logoRow: { flexDirection: 'row', marginBottom: 6 },
  logoBlock: { width: '32%' },
  amsLogoImage: { width: 130, height: 44, objectFit: 'contain' },
  companyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  address: { fontSize: 7, textAlign: 'center', lineHeight: 1.35, marginBottom: 2 },
  reportTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  metaRow: { flexDirection: 'row', marginBottom: 5, alignItems: 'center' },
  metaLab: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginRight: 4 },
  metaVal: { fontSize: 8, flexGrow: 0 },
  metaSpacer: { flex: 1 },
  remarksRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  remarksLine: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: BLACK,
    borderBottomStyle: 'solid',
    marginLeft: 4,
    minHeight: 10,
  },
  specsSheetTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  tableOuter: { borderWidth: 0.75, borderColor: BLACK, borderStyle: 'solid' },
  bannerRow: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: BLACK, minHeight: 18 },
  bannerLeft: { width: '29%', borderRightWidth: 0.75, borderRightColor: BLACK },
  bannerRight: {
    width: '71%',
    backgroundColor: ORANGE_DEEP,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bannerText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BLACK },
  headRow: { flexDirection: 'row', backgroundColor: GRAY, borderBottomWidth: 0.75, borderBottomColor: BLACK },
  headCell: {
    borderRightWidth: 0.75,
    borderRightColor: BLACK,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 22,
  },
  headText: { fontSize: 7, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  subHeadRow: { flexDirection: 'row', backgroundColor: GRAY, borderBottomWidth: 0.75, borderBottomColor: BLACK },
  subHeadCell: {
    borderRightWidth: 0.75,
    borderRightColor: BLACK,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 14,
  },
  dataRow: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: BLACK },
  cell: {
    borderRightWidth: 0.75,
    borderRightColor: BLACK,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 20,
  },
  cellText: { fontSize: 7, textAlign: 'center' },
});

function amsLogoPdfSrc() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/logo/AMSlogo.png`;
  }
  return '/logo/AMSlogo.png';
}

function AmsLogo({ logoDataUrl }) {
  return (
    <View style={styles.logoBlock}>
      <Image src={logoDataUrl || amsLogoPdfSrc()} style={styles.amsLogoImage} />
    </View>
  );
}

AmsLogo.propTypes = { logoDataUrl: PropTypes.string };

/** Default sheet rows — same values as legacy / your screenshot (Zipper, Hip, Hem). */
export const DEFAULT_MEASUREMENT_SHEET_ROWS = [
  { no: '1', point: 'Zipper', tol: '0.5', sQ: '10', sS: '1', mQ: '12', mS: '2', l: '14', xl: '16', extra: ['', '', '', '', '', ''] },
  { no: '2', point: 'Hip', tol: '0.5', sQ: '15', sS: '2', mQ: '16', mS: '3', l: '17', xl: '18', extra: ['', '', '', '', '', ''] },
  { no: '3', point: 'Hem', tol: '0.5', sQ: '10', sS: '1', mQ: '11', mS: '22', l: '12', xl: '14', extra: ['', '', '', '', '', ''] },
];

/**
 * Merge list-row + logo for @react-pdf (call from Size Specs View before `pdf()`).
 * @param {object} raw — row from `MOCK_SIZE_SPECS_ROWS` / API
 * @param {string} [logoDataUrl]
 */
export function mergeSizeSpecsPdfData(raw, logoDataUrl) {
  const r = raw || {};
  const unitLabel = r.measurementUnit === '1' ? 'INCH' : 'CM';
  const banner =
    r.sheetBanner || (r.sheetTitle ? String(r.sheetTitle) : `T-shirt - (${unitLabel})`);
    
  const vendor = r.venderName || r.vendorName || '—';
  
  return {
    logoDataUrl: logoDataUrl ?? r.logoDataUrl,
    qaName: r.qaName ?? r.QAName ?? 'QD1',
    reportDate:
      r.creationDate ?? r.CreationDate ?? r.reportDate ??
      new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    reportNo: r.autoNo ?? r.AutoNo ?? r.reportNo ?? '—',
    orderQty: r.orderQty ?? r.OrderQty ?? '24.00',
    customerName: r.customerName ?? r.CustomerName ?? '—',
    pono: r.pono ?? r.PONO ?? '—',
    styleNo: r.styleNo ?? r.StyleNo ?? '—',
    vendorName: vendor,
    color: r.color ?? r.Color ?? 'REDWOOD',
    remarks: r.remarks ?? r.Remarks ?? '',
    sheetBanner: banner,
    headers: r.headers,
    measurementSheet: Array.isArray(r.measurementSheet) ? r.measurementSheet : DEFAULT_MEASUREMENT_SHEET_ROWS,
  };
}

function Cell({ w, children, bg, last }) {
  return (
    <View
      style={[
        styles.cell,
        { width: w, backgroundColor: bg || '#fff' },
        last ? { borderRightWidth: 0 } : null,
      ]}
    >
      <Text style={styles.cellText}>{children}</Text>
    </View>
  );
}

Cell.propTypes = {
  w: PropTypes.string.isRequired,
  children: PropTypes.node,
  bg: PropTypes.string,
  last: PropTypes.bool,
};

/** SIZE SPECS REPORT — layout aligned to legacy Crystal report / your reference PDF. */
export default function SelfSizeSpecsPDF({ data }) {
  const d = mergeSizeSpecsPdfData(data, data?.logoDataUrl);
  const rows = d.measurementSheet;

  const wNo = '5%';
  const wMp = '18%';
  const wTol = '6%';
  const wPair = '7%';
  const wS2 = '14%';
  const wM2 = '14%';
  const wSingle = '6%';
  const wEx = '5.17%';

  return (
    <Document title={`Size Specs Report — ${d.reportNo}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.logoRow}>
          <AmsLogo logoDataUrl={d.logoDataUrl} />
        </View>

        <Text style={styles.companyName}>Apparel Merchandising Services</Text>
        <Text style={styles.address}>
          A M S House 84, Kokan Housing Society Alamgir Road - Postal Code: 74800
        </Text>
        <Text style={styles.address}>
          Telephone # : (+92213) 485-3935 & 36 Karachi - Pakistan.
        </Text>

        <Text style={styles.reportTitle}>SIZE SPECS REPORT</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLab}>Q.A. NAME:</Text>
          <Text style={styles.metaVal}>{d.qaName}</Text>
          <View style={styles.metaSpacer} />
          <Text style={styles.metaLab}>DATE:</Text>
          <Text style={styles.metaVal}>{d.reportDate}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLab}>REPORT #:</Text>
          <Text style={styles.metaVal}>{d.reportNo}</Text>
          <Text style={{ width: 24 }} />
          <Text style={styles.metaLab}>ORDER QTY:</Text>
          <Text style={styles.metaVal}>{d.orderQty}</Text>
          <Text style={{ width: 24 }} />
          <Text style={styles.metaLab}>CUSTOMER:</Text>
          <Text style={styles.metaVal}>{d.customerName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLab}>P.O. #:</Text>
          <Text style={styles.metaVal}>{d.pono}</Text>
          <Text style={{ width: 24 }} />
          <Text style={styles.metaLab}>STYLE NO:</Text>
          <Text style={styles.metaVal}>{d.styleNo}</Text>
          <Text style={{ width: 24 }} />
          <Text style={styles.metaLab}>VENDOR:</Text>
          <Text style={styles.metaVal}>{d.vendorName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLab}>Color:</Text>
          <Text style={styles.metaVal}>{d.color}</Text>
        </View>
        <View style={styles.remarksRow}>
          <Text style={styles.metaLab}>Remarks:</Text>
          <View style={styles.remarksLine}>
            <Text style={{ fontSize: 8 }}>{d.remarks || ' '}</Text>
          </View>
        </View>

        <Text style={styles.specsSheetTitle}>Specs Sheet</Text>

        <View style={styles.tableOuter}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerLeft} />
            <View style={styles.bannerRight}>
              <Text style={styles.bannerText}>{d.sheetBanner}</Text>
            </View>
          </View>

          <View style={styles.headRow}>
            <View style={[styles.headCell, { width: wNo }]}>
              <Text style={styles.headText}>No.</Text>
            </View>
            <View style={[styles.headCell, { width: wMp }]}>
              <Text style={styles.headText}>Measurement Points</Text>
            </View>
            <View style={[styles.headCell, { width: wTol }]}>
              <Text style={styles.headText}>TOL+/-</Text>
            </View>
            <View style={[styles.headCell, { width: wS2, flexDirection: 'row', padding: 0 }]}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.headText}>{d.headers ? d.headers[0] : 'S'}</Text>
              </View>
              <View style={{ flex: 1 }} />
            </View>
            <View style={[styles.headCell, { width: wM2, flexDirection: 'row', padding: 0 }]}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.headText}>{d.headers ? d.headers[1] : 'M'}</Text>
              </View>
              <View style={{ flex: 1 }} />
            </View>
            <View style={[styles.headCell, { width: wSingle }]}>
              <Text style={styles.headText}>{d.headers ? d.headers[2] : 'L'}</Text>
            </View>
            <View style={[styles.headCell, { width: wSingle }]}>
              <Text style={styles.headText}>{d.headers ? d.headers[3] : 'XL'}</Text>
            </View>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[styles.headCell, { width: wEx }, i === 5 ? { borderRightWidth: 0 } : null]}
              >
                <Text style={styles.headText}>{d.headers ? d.headers[i + 4] : ''}</Text>
              </View>
            ))}
          </View>

          <View style={styles.subHeadRow}>
            <View style={[styles.subHeadCell, { width: wNo }]} />
            <View style={[styles.subHeadCell, { width: wMp }]} />
            <View style={[styles.subHeadCell, { width: wTol }]} />
            <View style={[styles.subHeadCell, { width: wPair, backgroundColor: ORANGE }]} />
            <View style={[styles.subHeadCell, { width: wPair, backgroundColor: '#fff' }]} />
            <View style={[styles.subHeadCell, { width: wPair, backgroundColor: ORANGE }]} />
            <View style={[styles.subHeadCell, { width: wPair, backgroundColor: '#fff' }]} />
            <View style={[styles.subHeadCell, { width: wSingle, backgroundColor: ORANGE }]} />
            <View style={[styles.subHeadCell, { width: wSingle, backgroundColor: ORANGE }]} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[styles.subHeadCell, { width: wEx }, i === 5 ? { borderRightWidth: 0 } : null]}
              />
            ))}
          </View>

          {rows.map((r, idx) => (
            <View key={idx} style={styles.dataRow}>
              <Cell w={wNo}>{r.no}</Cell>
              <Cell w={wMp}>{r.point}</Cell>
              <Cell w={wTol}>{r.tol}</Cell>
              <Cell w={wPair} bg={ORANGE}>
                {r.sQ}
              </Cell>
              <Cell w={wPair}>{r.sS}</Cell>
              <Cell w={wPair} bg={ORANGE}>
                {r.mQ}
              </Cell>
              <Cell w={wPair}>{r.mS}</Cell>
              <Cell w={wSingle} bg={ORANGE}>
                {r.l}
              </Cell>
              <Cell w={wSingle} bg={ORANGE}>
                {r.xl}
              </Cell>
              {(r.extra || ['', '', '', '', '', '']).map((ex, j) => (
                <Cell key={j} w={wEx} last={j === 5}>
                  {ex}
                </Cell>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

SelfSizeSpecsPDF.propTypes = { data: PropTypes.object };
