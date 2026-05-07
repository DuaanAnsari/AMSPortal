import React, { useMemo } from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// ----------------------------------------------------------------------

/** Served from `public/logo/AMSlogo.png` → `/logo/AMSlogo.png` */
const AMS_LOGO_PATH = '/logo/AMSlogo.png';

/** PDF `/Title` metadata + browser tab (wrapper page). */
export const COURIER_PACKAGES_PDF_TITLE = 'Courier Packages pdf';

// Register bold font for Helvetica if needed, though standard usually works.
// We'll use FontWeight for built-in Helvetica.

function pick(r, ...keys) {
  if (!r || typeof r !== 'object') return '';
  for (const k of keys) {
    if (r[k] != null && r[k] !== '') return r[k];
  }
  return '';
}

function formatInvoiceDate(value) {
  if (value == null || value === '') return '—';
  const s = typeof value === 'string' ? value.trim() : String(value);
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  const d = m ? new Date(`${m[1]}T12:00:00`) : new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  // Screenshot shows DD/MM/YYYY format
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(v) {
  const n = num(v);
  return n.toFixed(2);
}

function fmtQtyCell(v) {
  const n = num(v);
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

function amsLogoPdfSrc() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${AMS_LOGO_PATH}`;
  }
  return AMS_LOGO_PATH;
}

const BLACK = '#000000';
const BORDER_COLOR = '#000000';
const LIGHT_GRAY = '#F2F2F2';

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 25,
    paddingVertical: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: BLACK,
  },
  bold: { fontWeight: 'bold' },
  
  // Header section
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 0,
    alignItems: 'center',
    paddingTop: 10,
  },
  logoBox: {
    width: '30%',
  },
  logo: {
    width: 140,
    height: 55,
    objectFit: 'contain',
  },
  companyHeaderBox: {
    width: '70%',
    textAlign: 'center',
    marginRight: 35, // Increased from 15 to 35
  },
  companyNameTitle: {
    fontSize: 18,
    color: '#FF6600',
    fontWeight: 'bold',
    marginBottom: 2,
    textTransform: 'none',
    textAlign: 'center',
  },
  headerSubText: {
    fontSize: 8,
    marginBottom: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  mainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 10,
    textDecoration: 'none',
    marginRight: 35, // Increased from 15 to 35
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Detail boxes
  detailsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailBox: {
    width: '49.5%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 6,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
    lineHeight: 1.2,
  },
  detailLabel: {
    width: '35%',
    fontWeight: 'bold',
  },
  detailValue: {
    width: '65%',
    fontWeight: 'bold',
  },

  // Table section
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GRAY,
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'stretch',
    minHeight: 25,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'stretch',
    minHeight: 22,
  },
  headerCell: {
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 2,
    fontWeight: 'bold',
    fontSize: 7.5,
    textAlign: 'center',
    justifyContent: 'center',
    display: 'flex',
  },
  cell: {
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 2,
    fontSize: 8,
    textAlign: 'center',
    justifyContent: 'center',
    display: 'flex',
    fontWeight: 'bold',
  },
  lastCell: {
    borderRightWidth: 0,
  },

  // Specific column widths
  colSr: { width: '4%' },
  colStyle: { width: '10%' },
  colQty: { width: '5%' },
  colGender: { width: '7%' },
  colItem: { width: '16%' },
  colFabric: { width: '12%' },
  colUnitPrice: { width: '7%' },
  colAmount: { width: '8%' },
  colPurpose: { width: '12%' },
  colHs: { width: '10%' },
  colMfg: { width: '9%' },

  // Totals Row
  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR,
    minHeight: 18,
    alignItems: 'center',
  },
  totalLabelCell: {
    width: '14%', // colSr + colStyle
    paddingLeft: 4,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
  },
  totalQtyCell: {
    width: '5%',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
  },
  totalEmptyMid: {
    width: '42%', // colGender + colItem + colFabric + colUnitPrice
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    height: '100%',
  },
  totalAmountCell: {
    width: '8%',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    height: '100%',
    justifyContent: 'center',
  },
  totalEmptyEnd: {
    width: '31%', // colPurpose + colHs + colMfg
    height: '100%',
  },

  // Declaration Row
  declarationRow: {
    padding: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 9,
  },
});


function mapDetailLine(d, index) {
  const qty = num(pick(d, 'qty', 'Qty', 'quantity', 'Quantity'));
  const price = num(pick(d, 'price', 'Price'));
  let amount = num(pick(d, 'amount', 'Amount'));
  if (!amount && qty && price) amount = Math.round(qty * price * 100) / 100;
  return {
    sr: index + 1,
    postyle: String(pick(d, 'postyle', 'poStyle', 'Postyle', 'POStyle') || '—'),
    gender: String(pick(d, 'gender', 'Gender') || ''),
    item: String(pick(d, 'description', 'Description', 'item', 'Item') || '—'),
    fabric: String(pick(d, 'fabriccontent', 'Fabriccontent', 'fabricContent', 'FabricContent') || ''),
    purpose: String(pick(d, 'remarks', 'Remarks', 'sendingPurpose', 'SendingPurpose') || ''),
    hsCode: String(pick(d, 'tendigithscode', 'Tendigithscode', 'tenDigitHsCode', 'TenDigitHsCode') || ''),
    mfgCode: String(pick(d, 'manufacturecode', 'Manufacturecode', 'manufactureCode', 'ManufactureCode') || ''),
    qty,
    price,
    amount,
  };
}

// ----------------------------------------------------------------------

export default function CourierPackagingInvoicePdf({ master, details, logoSrc }) {
  const m = master && typeof master === 'object' ? master : {};
  
  const invoiceNo = String(pick(m, 'couriesNo', 'CouriesNo', 'invoiceNo', 'InvoiceNo') || '—');
  const invDate = formatInvoiceDate(
    pick(m, 'creationDate', 'CreationDate', 'invoiceDate', 'InvoiceDate')
  );

  const shipperName = String(pick(m, 'shipper', 'Shipper') || '—');
  const shipperAddr = String(pick(m, 'shipperAddress', 'ShipperAddress') || 'A M S House 84,Kokan Housing Society Alamgir Road, Karachi 74800 - Pakistan');
  const ntnNumber = String(pick(m, 'ntnNumber', 'NtnNumber', 'NTN') || '0265236-6');
  
  const companyName = String(pick(m, 'consignee', 'Consignee') || '—');
  const attention = String(pick(m, 'attention', 'Attention') || '');
  const address = String(pick(m, 'address', 'Address', 'consigneeAddress', 'ConsigneeAddress') || '');
  const phone = String(pick(m, 'phone', 'Phone', 'phon', 'Phon') || '');
  const taxId = String(pick(m, 'taxId', 'TaxId', 'TAX') || '');

  const lines = useMemo(() => (Array.isArray(details) ? details.map(mapDetailLine) : []), [details]);
  const totals = useMemo(() => {
    const tQty = lines.reduce((s, r) => s + r.qty, 0);
    const tAmt = lines.reduce((s, r) => s + r.amount, 0);
    return { qty: tQty, amount: tAmt };
  }, [lines]);

  const imageSrc = logoSrc || amsLogoPdfSrc();

  return (
    <Document title={COURIER_PACKAGES_PDF_TITLE}>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoBox}>
            <Image src={imageSrc} style={styles.logo} />
          </View>
          <View style={styles.companyHeaderBox}>
            <Text style={styles.companyNameTitle}>Apparel Merchandising Servies</Text>
            <Text style={styles.headerSubText}>A M S House 84,Kokan Housing Society Alamgir Road</Text>
            <Text style={styles.headerSubText}>Karachi 74800 -Pakistan.</Text>
            <Text style={styles.headerSubText}>Tel : 02134967216 & 02134946005 Fax# (92213) 493-1944</Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <View style={{ width: '30%' }} />
          <View style={{ width: '70%' }}>
            <Text style={styles.mainTitle}>Invoice Of No Commercial Value</Text>
          </View>
        </View>

        {/* Details Boxes */}
        <View style={styles.detailsWrapper}>
          {/* Left Box */}
          <View style={styles.detailBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice No</Text>
              <Text style={styles.detailValue}>{invoiceNo}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shipper</Text>
              <Text style={styles.detailValue}>{shipperName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Company Name</Text>
              <Text style={styles.detailValue}>Apparel Merchandising Services</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{shipperAddr}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>NTN Number</Text>
              <Text style={styles.detailValue}>{ntnNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{invDate}</Text>
            </View>
          </View>

          {/* Right Box */}
          <View style={styles.detailBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Company Name</Text>
              <Text style={styles.detailValue}>{companyName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Attention</Text>
              <Text style={styles.detailValue}>{attention}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone #</Text>
              <Text style={styles.detailValue}>{phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tax ID</Text>
              <Text style={styles.detailValue}>{taxId}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, styles.colSr]}><Text>Sr#</Text></View>
            <View style={[styles.headerCell, styles.colStyle]}><Text>Style / Po</Text></View>
            <View style={[styles.headerCell, styles.colQty]}><Text>Qty</Text></View>
            <View style={[styles.headerCell, styles.colGender]}><Text>Gender</Text></View>
            <View style={[styles.headerCell, styles.colItem]}><Text>Item</Text></View>
            <View style={[styles.headerCell, styles.colFabric]}><Text>Fabric Content</Text></View>
            <View style={[styles.headerCell, styles.colUnitPrice]}><Text>Unit Price</Text></View>
            <View style={[styles.headerCell, styles.colAmount]}><Text>Total Amount</Text></View>
            <View style={[styles.headerCell, styles.colPurpose]}><Text>Sending Purpose</Text></View>
            <View style={[styles.headerCell, styles.colHs]}><Text>10 Digit HS Code</Text></View>
            <View style={[styles.headerCell, styles.colMfg, styles.lastCell]}><Text>Manufacture Code</Text></View>
          </View>

          {/* Data Rows */}
          {lines.map((row) => (
            <View key={row.sr} style={styles.tableRow} wrap={false}>
              <View style={[styles.cell, styles.colSr]}><Text>{row.sr}</Text></View>
              <View style={[styles.cell, styles.colStyle]}><Text>{row.postyle}</Text></View>
              <View style={[styles.cell, styles.colQty]}><Text>{fmtQtyCell(row.qty)}</Text></View>
              <View style={[styles.cell, styles.colGender]}><Text>{row.gender}</Text></View>
              <View style={[styles.cell, styles.colItem]}><Text>{row.item}</Text></View>
              <View style={[styles.cell, styles.colFabric]}><Text>{row.fabric}</Text></View>
              <View style={[styles.cell, styles.colUnitPrice]}><Text>{fmtMoney(row.price)}</Text></View>
              <View style={[styles.cell, styles.colAmount]}><Text>{fmtMoney(row.amount)}</Text></View>
              <View style={[styles.cell, styles.colPurpose]}><Text>{row.purpose}</Text></View>
              <View style={[styles.cell, styles.colHs]}><Text>{row.hsCode}</Text></View>
              <View style={[styles.cell, styles.colMfg, styles.lastCell]}><Text>{row.mfgCode}</Text></View>
            </View>
          ))}

          {/* Totals Row */}
          <View style={styles.totalRow}>
            <View style={styles.totalLabelCell}><Text>Total Pcs & Value</Text></View>
            <View style={styles.totalQtyCell}><Text>{fmtQtyCell(totals.qty)}</Text></View>
            <View style={styles.totalEmptyMid} />
            <View style={styles.totalAmountCell}><Text>{fmtMoney(totals.amount)}</Text></View>
            <View style={styles.totalEmptyEnd} />
          </View>

          {/* Declaration Row */}
          <View style={styles.declarationRow}>
            <Text>Declaration : All Samples are of NO COMMERCIAL VALUE</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}

