import React, { useMemo } from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// ----------------------------------------------------------------------

/** Served from `public/logo/AMSlogo.png` → `/logo/AMSlogo.png` */
const AMS_LOGO_PATH = '/logo/AMSlogo.png';

/** PDF `/Title` metadata + browser tab (wrapper page). */
export const COURIER_PACKAGES_PDF_TITLE = 'Courier Packages pdf';

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
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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

/** Split API address string into lines for stacked plain text */
function addressLines(text) {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const ORANGE = '#E65100';
const BLACK = '#000000';
const TABLE_HEADER_GRAY = '#E0E0E0';
const BORDER_PT = 1;

const styles = StyleSheet.create({
  page: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    paddingTop: 30,
    paddingBottom: 38,
    paddingHorizontal: 48,
    color: BLACK,
  },
  valBold: { fontFamily: 'Helvetica', fontWeight: 700 },
  dateUnderline: { textDecoration: 'underline' },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 0.75,
    borderBottomColor: '#d0d0d0',
    paddingBottom: 10,
  },
  logoWrap: { width: '34%', justifyContent: 'flex-start' },
  logoImg: { width: 128, height: 48, objectFit: 'contain' },
  companyHead: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingLeft: 6,
    paddingTop: 4,
  },
  companyName: {
    fontSize: 11.5,
    fontFamily: 'Helvetica',
    fontWeight: 700,
    color: ORANGE,
    textAlign: 'center',
    marginBottom: 4,
  },
  companyAddr: {
    fontSize: 7.5,
    lineHeight: 1.45,
    textAlign: 'center',
    color: BLACK,
  },
  title: {
    textAlign: 'center',
    fontSize: 12.5,
    fontFamily: 'Helvetica',
    fontWeight: 700,
    color: BLACK,
    marginTop: 4,
    marginBottom: 14,
  },
  twoCol: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  colLeft: { width: '50%', paddingRight: 16 },
  colRight: { width: '50%', paddingLeft: 16 },
  bodyLine: { fontSize: 8, lineHeight: 1.5, marginBottom: 3, color: BLACK },
  plainSmall: { fontSize: 8, lineHeight: 1.45, marginBottom: 2, color: BLACK },
  originBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 4,
    textAlign: 'center',
    fontFamily: 'Helvetica',
    fontWeight: 700,
    fontSize: 8.5,
    color: BLACK,
    borderBottomWidth: 1.5,
    borderBottomColor: BLACK,
  },
  table: {
    borderWidth: BORDER_PT,
    borderColor: BLACK,
    marginTop: 0,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: TABLE_HEADER_GRAY,
    borderBottomWidth: BORDER_PT,
    borderBottomColor: BLACK,
  },
  trRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: BORDER_PT,
    borderBottomColor: BLACK,
    minHeight: 22,
  },
  thCell: {
    fontFamily: 'Helvetica',
    fontWeight: 700,
    fontSize: 7,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRightWidth: BORDER_PT,
    borderRightColor: BLACK,
    color: BLACK,
  },
  tdCell: {
    fontSize: 7,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRightWidth: BORDER_PT,
    borderRightColor: BLACK,
    color: BLACK,
  },
  colSr: { width: '5%', textAlign: 'center' },
  colPo: { width: '14%', textAlign: 'left' },
  colDesc: { width: '34%', textAlign: 'left' },
  colQty: { width: '8%', textAlign: 'center' },
  colPrice: { width: '12%', textAlign: 'center' },
  colAmt: { width: '12%', textAlign: 'center' },
  colRm: { width: '15%', textAlign: 'left' },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    alignItems: 'stretch',
  },
  totalMerged: {
    width: '53%',
    borderRightWidth: BORDER_PT,
    borderRightColor: BLACK,
    paddingVertical: 7,
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  totalQtyCell: {
    width: '8%',
    borderRightWidth: BORDER_PT,
    borderRightColor: BLACK,
    paddingVertical: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalPriceCell: {
    width: '12%',
    borderRightWidth: BORDER_PT,
    borderRightColor: BLACK,
    paddingVertical: 7,
  },
  totalAmtCell: {
    width: '12%',
    borderRightWidth: BORDER_PT,
    borderRightColor: BLACK,
    paddingVertical: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalRmCell: {
    width: '15%',
    paddingVertical: 7,
  },
  totalTextBold: {
    fontFamily: 'Helvetica',
    fontWeight: 700,
    fontSize: 8,
    color: BLACK,
    textAlign: 'center',
  },
  declaration: {
    textAlign: 'center',
    fontFamily: 'Helvetica',
    fontWeight: 700,
    fontSize: 8.5,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderTopWidth: BORDER_PT,
    borderTopColor: BLACK,
    backgroundColor: '#FFFFFF',
    color: BLACK,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: 7,
    color: BLACK,
    borderTopWidth: BORDER_PT,
    borderTopColor: BLACK,
    paddingTop: 8,
  },
  footerCenter: { textAlign: 'center', flexGrow: 1, paddingHorizontal: 8 },
  footerPowered: { fontFamily: 'Helvetica', fontWeight: 700, color: BLACK, fontSize: 7 },
  footerDev: { fontSize: 6, color: BLACK, marginTop: 2 },
});

function mapDetailLine(d, index) {
  const qty = num(pick(d, 'qty', 'Qty', 'quantity', 'Quantity'));
  const price = num(pick(d, 'price', 'Price'));
  let amount = num(pick(d, 'amount', 'Amount'));
  if (!amount && qty && price) amount = Math.round(qty * price * 100) / 100;
  return {
    sr: index + 1,
    postyle: String(pick(d, 'postyle', 'poStyle', 'Postyle', 'POStyle') || '—'),
    description: String(pick(d, 'description', 'Description') || '—'),
    qty,
    price,
    amount,
    remarks: String(pick(d, 'remarks', 'Remarks') || ''),
  };
}

// ----------------------------------------------------------------------

export default function CourierPackagingInvoicePdf({ master, details, logoSrc }) {
  const m = master && typeof master === 'object' ? master : {};
  const invoiceNo = String(pick(m, 'couriesNo', 'CouriesNo', 'invoiceNo', 'InvoiceNo', 'orderNo', 'OrderNo') || '—');
  const invDate = formatInvoiceDate(
    pick(m, 'creationDate', 'CreationDate', 'invoiceDate', 'InvoiceDate', 'merchandisingDate', 'MerchandisingDate')
  );

  const shipperName = String(pick(m, 'shipper', 'Shipper') || '—');
  const shipperAddr = String(pick(m, 'shipperAddress', 'ShipperAddress') || '');
  const shipperTel = String(
    pick(m, 'phon', 'Phon', 'phone', 'Phone', 'shipperTel', 'ShipperTel', 'shipperPhone', 'ShipperPhone') || '—'
  );
  const shipmentType = String(
    pick(m, 'shipment', 'Shipment', 'shipmentType', 'ShipmentType') || '—'
  );
  const service = String(pick(m, 'service', 'Service', 'serviceRequired', 'ServiceRequired') || '—');
  const courier = String(pick(m, 'couries', 'Couries', 'amsCourierAwb', 'AmsCourierAwb', 'courier', 'Courier') || '—');
  const awbl = String(pick(m, 'awbl', 'Awbl', 'AWBL', 'awb', 'Awb') || '');
  const account = String(pick(m, 'account', 'Account') || '');

  const consignee = String(pick(m, 'consignee', 'Consignee') || '—');
  const attention = String(pick(m, 'attention', 'Attention') || '');
  const consAddr = String(
    pick(m, 'consigneeAddress', 'ConsigneeAddress') || pick(m, 'address', 'Address') || ''
  );
  const consTel = String(
    pick(
      m,
      'consigneePhone',
      'ConsigneePhone',
      'importTel',
      'ImportTel',
      'consigneeTel',
      'ConsigneeTel',
      'courierImportTel',
      'CourierImportTel',
      'phon',
      'Phon',
      'phone',
      'Phone'
    ) || ''
  );

  const lines = useMemo(() => (Array.isArray(details) ? details.map(mapDetailLine) : []), [details]);
  const totals = useMemo(() => {
    const tQty = lines.reduce((s, r) => s + r.qty, 0);
    const tAmt = lines.reduce((s, r) => s + r.amount, 0);
    return { qty: tQty, amount: tAmt };
  }, [lines]);

  const printedOn = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }, []);

  const shipperAddrLines = useMemo(() => addressLines(shipperAddr), [shipperAddr]);
  const consAddrLines = useMemo(() => addressLines(consAddr), [consAddr]);

  const consigneeFirstBold = attention || consignee;
  const consigneeSecondPlain = attention ? consignee : '';

  const imageSrc = logoSrc || amsLogoPdfSrc();

  return (
    <Document title={COURIER_PACKAGES_PDF_TITLE}>
      <Page size="A4" style={styles.page}>
        {/* Header: logo left; company name + address centered to the right of logo */}
        <View style={styles.brandRow}>
          <View style={styles.logoWrap}>
            <Image src={imageSrc} style={styles.logoImg} />
          </View>
          <View style={styles.companyHead}>
            <Text style={styles.companyName}>Apparel Merchandising Services</Text>
            <Text style={styles.companyAddr}>A M S House 84, Kokan Housing Society Alamgir Road</Text>
            <Text style={styles.companyAddr}>Karachi 74800 - Pakistan.</Text>
            <Text style={[styles.companyAddr, { marginTop: 5 }]}>
              Tel : 02134937216 &
            </Text>
            <Text style={styles.companyAddr}>02134946005</Text>
          </View>
        </View>

        <Text style={styles.title}>Invoice Of No Commercial Value</Text>

        {/* Two columns: Invoice # / shipper (left); Date / consignee (right) — label normal, value bold; date underlined */}
        <View style={styles.twoCol}>
          <View style={styles.colLeft}>
            <Text style={styles.bodyLine}>
              <Text>Invoice #: </Text>
              <Text style={styles.valBold}>{invoiceNo}</Text>
            </Text>
            <Text style={styles.bodyLine}>
              <Text>Shipper : </Text>
              <Text style={styles.valBold}>{shipperName}</Text>
            </Text>
            {shipperAddrLines.map((line, i) => (
              <Text key={`s-${i}-${line}`} style={styles.plainSmall}>
                {line}
              </Text>
            ))}
            <Text style={styles.plainSmall}>Tel : {shipperTel}</Text>
            <Text style={[styles.bodyLine, { marginTop: 4 }]}>
              <Text>Shipment Type : </Text>
              <Text style={styles.valBold}>{shipmentType}</Text>
            </Text>
            <Text style={styles.bodyLine}>
              <Text>Service Required: </Text>
              <Text style={styles.valBold}>{service}</Text>
            </Text>
            <Text style={styles.bodyLine}>
              <Text>Courier & AWB# : </Text>
              <Text style={styles.valBold}>{courier}</Text>
            </Text>
            <Text style={styles.bodyLine}>
              <Text>AWBL# : </Text>
              <Text style={styles.valBold}>{awbl || ' '}</Text>
            </Text>
          </View>

          <View style={styles.colRight}>
            <Text style={styles.bodyLine}>
              <Text>Date : </Text>
              <Text style={[styles.valBold, styles.dateUnderline]}>{invDate}</Text>
            </Text>
            <Text style={styles.bodyLine}>
              <Text>Consignee : </Text>
              <Text style={styles.valBold}>{consigneeFirstBold}</Text>
            </Text>
            {consigneeSecondPlain ? (
              <Text style={styles.plainSmall}>{consigneeSecondPlain}</Text>
            ) : null}
            {consAddrLines.map((line, i) => (
              <Text key={`c-${i}-${line}`} style={styles.plainSmall}>
                {line}
              </Text>
            ))}
            <Text style={[styles.bodyLine, { marginTop: 4 }]}>
              <Text>Courier & Import Tel #: </Text>
              <Text style={styles.valBold}>{consTel || ' '}</Text>
            </Text>
            <Text style={styles.bodyLine}>
              <Text>Account #: </Text>
              <Text style={styles.valBold}>{account || ' '}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.originBar}>
            <Text style={{ textAlign: 'center' }}>Country Of Origin : PAKISTAN</Text>
          </View>
          <View style={styles.thRow}>
            <Text style={[styles.thCell, styles.colSr]}>Sr#</Text>
            <Text style={[styles.thCell, styles.colPo]}>Style / PO</Text>
            <Text style={[styles.thCell, styles.colDesc]}>
              Description Of Goods (Including Harmonized Tariff Number)
            </Text>
            <Text style={[styles.thCell, styles.colQty]}>Qty Pcs</Text>
            <Text style={[styles.thCell, styles.colPrice]}>Unit Price US $</Text>
            <Text style={[styles.thCell, styles.colAmt]}>Amount</Text>
            <Text style={[styles.thCell, styles.colRm, { borderRightWidth: 0 }]}>Remarks</Text>
          </View>
          {lines.map((row) => (
            <View key={row.sr} style={styles.trRow} wrap={false}>
              <Text style={[styles.tdCell, styles.colSr]}>{row.sr}</Text>
              <Text style={[styles.tdCell, styles.colPo]}>{String(row.postyle).toUpperCase()}</Text>
              <Text style={[styles.tdCell, styles.colDesc]}>{row.description}</Text>
              <Text style={[styles.tdCell, styles.colQty]}>{fmtQtyCell(row.qty)}</Text>
              <Text style={[styles.tdCell, styles.colPrice]}>{fmtMoney(row.price)}</Text>
              <Text style={[styles.tdCell, styles.colAmt]}>{fmtMoney(row.amount)}</Text>
              <Text style={[styles.tdCell, styles.colRm, { borderRightWidth: 0 }]}>{row.remarks}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <View style={styles.totalMerged}>
              <Text
                style={{
                  width: '100%',
                  fontFamily: 'Helvetica',
                  fontWeight: 700,
                  fontSize: 8,
                  color: BLACK,
                  textAlign: 'right',
                }}
              >
                Total Pcs & Value :
              </Text>
            </View>
            <View style={styles.totalQtyCell}>
              <Text style={[styles.totalTextBold, { width: '100%' }]}>{fmtQtyCell(totals.qty)}</Text>
            </View>
            <View style={styles.totalPriceCell} />
            <View style={styles.totalAmtCell}>
              <Text style={[styles.totalTextBold, { width: '100%' }]}>{fmtMoney(totals.amount)}</Text>
            </View>
            <View style={styles.totalRmCell} />
          </View>

          <View style={styles.declaration}>
            <Text>Declaration : All Samples are of NO COMMERCIAL VALUE.</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Printed on: {printedOn}</Text>
          <View style={styles.footerCenter}>
            <Text style={styles.footerPowered}>Powered by : INTEGRA ERP SYSTEM</Text>
            <Text style={styles.footerDev}>Developed by: ITG (Pvt) Ltd. - Website: www.itg.net.pk</Text>
          </View>
          <Text>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
