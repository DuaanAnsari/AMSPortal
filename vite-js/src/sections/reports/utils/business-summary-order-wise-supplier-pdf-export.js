import jsPDF from 'jspdf';

import {
  BUSINESS_SUMMARY_ORDER_WISE_DOCUMENT_TITLE,
  BUSINESS_SUMMARY_ORDER_WISE_PDF_FILENAME,
} from './business-summary-order-wise-pdf-export';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const V_MARGIN = 8;
const H_MARGIN = 6;
const HEADER_BLOCK_H = 92;
const TABLE_HEADER_ROW_H = 32;
const DATA_ROW_H = 22;
const TOTAL_ROW_H = 22;
const FOOTER_H = 26;
const TITLE_BLUE = [0, 51, 153];
const HEADER_FILL = [231, 233, 240];

const PAGE_W = 1000;
const PAGE_H = 595;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

function setPdfDocumentTitle(doc, title) {
  if (!title) return;
  try {
    doc.setProperties({ title, subject: title });
  } catch (e) {
    /* setProperties unavailable — non-fatal, preview still works */
  }
}

/**
 * 17 columns — supplier-wise ordering. Column 2 is Supplier, column 3 is Customer.
 * Numeric labels use the abbreviated `Comm. FOB` / `LDP Amnt.` form (per image spec).
 */
const HEADERS = [
  'S.No',
  'Supplier',
  'Customer',
  'Style',
  'PO NO.',
  'Booked\nQuantity',
  'Shipped\nQuantity',
  'Booked\nFOB',
  'Shipped\nFOB',
  'Booked\nComm. FOB',
  'Shipped\nComm. FOB',
  'Booked\nLDP Amnt.',
  'Shipped\nLDP Amnt.',
  'Vendor\nShip. Date',
  'Buyer Ship.\nDate',
  'Actual Ship.\nDate',
  'ETA Date',
];

const COL_WEIGHTS = [
  18, 60, 72, 36, 54, 38, 38, 40, 40, 40, 40, 44, 44, 44, 44, 42, 40,
];

const CURRENCY_USD = '$';

/** Demo rows — replace with API rows when backend is ready. */
export const BUSINESS_SUMMARY_ORDER_WISE_SUPPLIER_DEMO = {
  fromDate: '2026-01-01',
  toDate: '2026-12-31',
  groups: [
    {
      supplier: 'AYYOUB APPARELS',
      rows: [
        {
          customer: 'JEDCO BRANDS, INC',
          style: 'APX CAMO SS',
          poNo: 'Po0018870',
          bookedQty: 10890,
          shippedQty: 10033,
          bookedFob: 4138.2,
          shippedFob: 3812.54,
          bookedCommOn: 310.37,
          shippedCommOn: 285.94,
          bookedLdp: 27225,
          shippedLdp: 25082.5,
          vendorShipDate: '10-Feb-2026',
          buyerShipDate: '10-Feb-2026',
          actualShipDate: '',
          etaDate: '14-Mar-2026',
        },
        {
          customer: 'JEDCO BRANDS, INC',
          style: 'APX CAMO SS',
          poNo: 'PO0019438',
          bookedQty: 10196,
          shippedQty: 0,
          bookedFob: 38744.8,
          shippedFob: 0,
          bookedCommOn: 2905.86,
          shippedCommOn: 0,
          bookedLdp: 56078,
          shippedLdp: 0,
          vendorShipDate: '30-Apr-2026',
          buyerShipDate: '30-Apr-2026',
          actualShipDate: '',
          etaDate: '01-Jun-2026',
        },
        {
          customer: 'JEDCO BRANDS, INC',
          style: 'APX CAMO SS',
          poNo: 'PO0019439',
          bookedQty: 10196,
          shippedQty: 0,
          bookedFob: 38744.8,
          shippedFob: 0,
          bookedCommOn: 2905.86,
          shippedCommOn: 0,
          bookedLdp: 56078,
          shippedLdp: 0,
          vendorShipDate: '30-Apr-2026',
          buyerShipDate: '30-Apr-2026',
          actualShipDate: '',
          etaDate: '01-Jun-2026',
        },
        {
          customer: 'JEDCO BRANDS, INC',
          style: 'APX CAMO SS',
          poNo: 'PO0019539',
          bookedQty: 20396,
          shippedQty: 0,
          bookedFob: 77504.8,
          shippedFob: 0,
          bookedCommOn: 5812.86,
          shippedCommOn: 0,
          bookedLdp: 112178,
          shippedLdp: 0,
          vendorShipDate: '09-May-2026',
          buyerShipDate: '15-May-2026',
          actualShipDate: '',
          etaDate: '16-Jun-2026',
        },
        {
          customer: 'JEDCO BRANDS, INC',
          style: 'APX CAMO SS',
          poNo: 'PO0019629',
          bookedQty: 20395,
          shippedQty: 0,
          bookedFob: 77501.0,
          shippedFob: 0,
          bookedCommOn: 5812.58,
          shippedCommOn: 0,
          bookedLdp: 112172.5,
          shippedLdp: 0,
          vendorShipDate: '20-May-2026',
          buyerShipDate: '20-May-2026',
          actualShipDate: '',
          etaDate: '21-Jun-2026',
        },
        {
          customer: 'MV SPORTS',
          style: 'W27414',
          poNo: 'V 26 530191-00',
          bookedQty: 1152,
          shippedQty: 0,
          bookedFob: 2188.8,
          shippedFob: 0,
          bookedCommOn: 109.44,
          shippedCommOn: 0,
          bookedLdp: 3836.16,
          shippedLdp: 0,
          vendorShipDate: '20-May-2026',
          buyerShipDate: '20-May-2026',
          actualShipDate: '',
          etaDate: '21-Jun-2026',
        },
        {
          customer: 'MV SPORTS',
          style: 'W27414',
          poNo: 'V 26 530191-07',
          bookedQty: 1152,
          shippedQty: 0,
          bookedFob: 2188.8,
          shippedFob: 0,
          bookedCommOn: 109.44,
          shippedCommOn: 0,
          bookedLdp: 3836.16,
          shippedLdp: 0,
          vendorShipDate: '20-May-2026',
          buyerShipDate: '20-May-2026',
          actualShipDate: '',
          etaDate: '21-Jun-2026',
        },
        {
          customer: 'MV SPORTS',
          style: 'W27414',
          poNo: 'V 26 530191-08',
          bookedQty: 1152,
          shippedQty: 0,
          bookedFob: 2188.8,
          shippedFob: 0,
          bookedCommOn: 109.44,
          shippedCommOn: 0,
          bookedLdp: 3836.16,
          shippedLdp: 0,
          vendorShipDate: '20-May-2026',
          buyerShipDate: '20-May-2026',
          actualShipDate: '',
          etaDate: '21-Jun-2026',
        },
        {
          customer: 'MV SPORTS',
          style: 'W27414',
          poNo: 'V 26 530191-79',
          bookedQty: 1152,
          shippedQty: 0,
          bookedFob: 2188.8,
          shippedFob: 0,
          bookedCommOn: 109.44,
          shippedCommOn: 0,
          bookedLdp: 3836.16,
          shippedLdp: 0,
          vendorShipDate: '15-May-2026',
          buyerShipDate: '20-May-2026',
          actualShipDate: '',
          etaDate: '21-Jun-2026',
        },
        {
          customer: 'MV SPORTS',
          style: 'W27414',
          poNo: 'V 26 530191-PLI',
          bookedQty: 1152,
          shippedQty: 0,
          bookedFob: 2188.8,
          shippedFob: 0,
          bookedCommOn: 109.44,
          shippedCommOn: 0,
          bookedLdp: 3836.16,
          shippedLdp: 0,
          vendorShipDate: '20-May-2026',
          buyerShipDate: '20-May-2026',
          actualShipDate: '',
          etaDate: '21-Jun-2026',
        },
        {
          customer: 'MV SPORTS',
          style: 'W27414',
          poNo: 'V 26 530191-VY',
          bookedQty: 1152,
          shippedQty: 0,
          bookedFob: 2188.8,
          shippedFob: 0,
          bookedCommOn: 109.44,
          shippedCommOn: 0,
          bookedLdp: 3836.16,
          shippedLdp: 0,
          vendorShipDate: '20-May-2026',
          buyerShipDate: '20-May-2026',
          actualShipDate: '',
          etaDate: '21-Jun-2026',
        },
        {
          customer: 'MV SPORTS',
          style: '27147',
          poNo: 'V 26 530290',
          bookedQty: 1512,
          shippedQty: 0,
          bookedFob: 7106.4,
          shippedFob: 0,
          bookedCommOn: 497.45,
          shippedCommOn: 0,
          bookedLdp: 11113.2,
          shippedLdp: 0,
          vendorShipDate: '05-Jun-2026',
          buyerShipDate: '05-Jun-2026',
          actualShipDate: '',
          etaDate: '07-Jul-2026',
        },
        {
          customer: 'MV SPORTS',
          style: '27148',
          poNo: 'V 26 530291',
          bookedQty: 1512,
          shippedQty: 0,
          bookedFob: 7938.0,
          shippedFob: 0,
          bookedCommOn: 555.66,
          shippedCommOn: 0,
          bookedLdp: 12020.4,
          shippedLdp: 0,
          vendorShipDate: '20-May-2026',
          buyerShipDate: '20-May-2026',
          actualShipDate: '',
          etaDate: '21-Jun-2026',
        },
        {
          customer: 'MV SPORTS',
          style: '27149',
          poNo: 'V 26 530292',
          bookedQty: 1488,
          shippedQty: 0,
          bookedFob: 7589.0,
          shippedFob: 0,
          bookedCommOn: 531.22,
          shippedCommOn: 0,
          bookedLdp: 11457.6,
          shippedLdp: 0,
          vendorShipDate: '20-May-2026',
          buyerShipDate: '20-May-2026',
          actualShipDate: '',
          etaDate: '07-Jul-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0',
          bookedQty: 4008,
          shippedQty: 4008,
          bookedFob: 5931.84,
          shippedFob: 5931.84,
          bookedCommOn: 296.59,
          shippedCommOn: 296.59,
          bookedLdp: 10100.16,
          shippedLdp: 10100.16,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0',
          bookedQty: 3600,
          shippedQty: 3528,
          bookedFob: 5328.0,
          shippedFob: 5221.44,
          bookedCommOn: 266.4,
          shippedCommOn: 261.07,
          bookedLdp: 9072.0,
          shippedLdp: 8890.56,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0',
          bookedQty: 4008,
          shippedQty: 4008,
          bookedFob: 5931.84,
          shippedFob: 5931.84,
          bookedCommOn: 296.59,
          shippedCommOn: 296.59,
          bookedLdp: 10100.16,
          shippedLdp: 10100.16,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0',
          bookedQty: 2688,
          shippedQty: 2688,
          bookedFob: 3978.24,
          shippedFob: 3978.24,
          bookedCommOn: 198.91,
          shippedCommOn: 198.91,
          bookedLdp: 6773.76,
          shippedLdp: 6773.76,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0',
          bookedQty: 4008,
          shippedQty: 4008,
          bookedFob: 5931.84,
          shippedFob: 5931.84,
          bookedCommOn: 296.59,
          shippedCommOn: 296.59,
          bookedLdp: 10100.16,
          shippedLdp: 10100.16,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0',
          bookedQty: 4008,
          shippedQty: 4008,
          bookedFob: 5931.84,
          shippedFob: 5931.84,
          bookedCommOn: 296.59,
          shippedCommOn: 296.59,
          bookedLdp: 10100.16,
          shippedLdp: 10100.16,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0',
          bookedQty: 2640,
          shippedQty: 2640,
          bookedFob: 3907.2,
          shippedFob: 3907.2,
          bookedCommOn: 195.36,
          shippedCommOn: 195.36,
          bookedLdp: 6652.8,
          shippedLdp: 6652.8,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0',
          bookedQty: 4008,
          shippedQty: 4008,
          bookedFob: 5931.84,
          shippedFob: 5931.84,
          bookedCommOn: 296.59,
          shippedCommOn: 296.59,
          bookedLdp: 10100.16,
          shippedLdp: 10100.16,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-4',
          bookedQty: 3216,
          shippedQty: 3216,
          bookedFob: 4759.68,
          shippedFob: 4759.68,
          bookedCommOn: 237.98,
          shippedCommOn: 237.98,
          bookedLdp: 8104.32,
          shippedLdp: 8104.32,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-4',
          bookedQty: 4008,
          shippedQty: 4008,
          bookedFob: 5931.84,
          shippedFob: 5931.84,
          bookedCommOn: 296.59,
          shippedCommOn: 296.59,
          bookedLdp: 10100.16,
          shippedLdp: 10100.16,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-4',
          bookedQty: 3216,
          shippedQty: 3216,
          bookedFob: 4759.68,
          shippedFob: 4759.68,
          bookedCommOn: 237.98,
          shippedCommOn: 237.98,
          bookedLdp: 8104.32,
          shippedLdp: 8104.32,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-4',
          bookedQty: 4008,
          shippedQty: 4008,
          bookedFob: 5931.84,
          shippedFob: 5931.84,
          bookedCommOn: 296.59,
          shippedCommOn: 296.59,
          bookedLdp: 10100.16,
          shippedLdp: 10100.16,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-4',
          bookedQty: 4008,
          shippedQty: 4008,
          bookedFob: 5931.84,
          shippedFob: 5931.84,
          bookedCommOn: 296.59,
          shippedCommOn: 296.59,
          bookedLdp: 10100.16,
          shippedLdp: 10100.16,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          customer: 'C-LIFE GROUP LTD.',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-4',
          bookedQty: 2640,
          shippedQty: 2640,
          bookedFob: 3907.2,
          shippedFob: 3907.2,
          bookedCommOn: 195.36,
          shippedCommOn: 195.36,
          bookedLdp: 6652.8,
          shippedLdp: 6652.8,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
      ],
    },
    {
      supplier: 'COMFORT APPAREL',
      rows: [
        {
          customer: 'LONE ROCK',
          style: '1003 (PB0003)',
          poNo: '38551-1003-BER',
          bookedQty: 2784,
          shippedQty: 2784,
          bookedFob: 16147.2,
          shippedFob: 16147.2,
          bookedCommOn: 1130.3,
          shippedCommOn: 1130.3,
          bookedLdp: 26726.4,
          shippedLdp: 26726.4,
          vendorShipDate: '10-Feb-2026',
          buyerShipDate: '10-Feb-2026',
          actualShipDate: '',
          etaDate: '14-Mar-2026',
        },
        {
          customer: 'LONE ROCK',
          style: '1003 (PB0003)',
          poNo: '38551-1003-BLA',
          bookedQty: 2088,
          shippedQty: 2088,
          bookedFob: 12110.4,
          shippedFob: 12110.4,
          bookedCommOn: 847.73,
          shippedCommOn: 847.73,
          bookedLdp: 20044.8,
          shippedLdp: 20044.8,
          vendorShipDate: '10-Feb-2026',
          buyerShipDate: '10-Feb-2026',
          actualShipDate: '',
          etaDate: '14-Mar-2026',
        },
        {
          customer: 'LONE ROCK',
          style: '1003 (PB0003)',
          poNo: '38551-1003-EUC',
          bookedQty: 1464,
          shippedQty: 1464,
          bookedFob: 8491.2,
          shippedFob: 8491.2,
          bookedCommOn: 594.38,
          shippedCommOn: 594.38,
          bookedLdp: 14054.4,
          shippedLdp: 14054.4,
          vendorShipDate: '10-Feb-2026',
          buyerShipDate: '10-Feb-2026',
          actualShipDate: '',
          etaDate: '14-Mar-2026',
        },
        {
          customer: 'LONE ROCK',
          style: '6481 (PB0004)',
          poNo: '38551-6481-BLU',
          bookedQty: 1560,
          shippedQty: 1560,
          bookedFob: 6552.0,
          shippedFob: 6552.0,
          bookedCommOn: 458.64,
          shippedCommOn: 458.64,
          bookedLdp: 11310.0,
          shippedLdp: 11310.0,
          vendorShipDate: '10-Feb-2026',
          buyerShipDate: '10-Feb-2026',
          actualShipDate: '',
          etaDate: '14-Mar-2026',
        },
        {
          customer: 'LONE ROCK',
          style: '6481 (PB0004)',
          poNo: '38551-6481-Sec',
          bookedQty: 2232,
          shippedQty: 2232,
          bookedFob: 9374.4,
          shippedFob: 9374.4,
          bookedCommOn: 656.21,
          shippedCommOn: 656.21,
          bookedLdp: 16182.0,
          shippedLdp: 16182.0,
          vendorShipDate: '10-Feb-2026',
          buyerShipDate: '10-Feb-2026',
          actualShipDate: '',
          etaDate: '14-Mar-2026',
        },
        {
          customer: 'LONE ROCK',
          style: '1003 (PB0003)',
          poNo: '38562-1003-BER',
          bookedQty: 46,
          shippedQty: 48,
          bookedFob: 266.8,
          shippedFob: 278.4,
          bookedCommOn: 18.68,
          shippedCommOn: 19.49,
          bookedLdp: 441.6,
          shippedLdp: 460.8,
          vendorShipDate: '10-Feb-2026',
          buyerShipDate: '10-Feb-2026',
          actualShipDate: '',
          etaDate: '14-Mar-2026',
        },
        {
          customer: 'LONE ROCK',
          style: '1003 (PB0003)',
          poNo: '38562-1003-BLA',
          bookedQty: 46,
          shippedQty: 48,
          bookedFob: 266.8,
          shippedFob: 278.4,
          bookedCommOn: 18.68,
          shippedCommOn: 19.49,
          bookedLdp: 441.6,
          shippedLdp: 460.8,
          vendorShipDate: '10-Feb-2026',
          buyerShipDate: '10-Feb-2026',
          actualShipDate: '',
          etaDate: '14-Mar-2026',
        },
      ],
    },
  ],
};

// ---------- helpers ----------

function colWidths(innerW) {
  const sum = COL_WEIGHTS.reduce((a, b) => a + b, 0);
  const out = COL_WEIGHTS.map((w) => (w / sum) * innerW);
  const drift = innerW - out.reduce((a, b) => a + b, 0);
  out[out.length - 1] += drift;
  return out;
}

function colXs(x0, widths) {
  const xs = [x0];
  for (let i = 0; i < widths.length; i += 1) xs.push(xs[i] + widths[i]);
  return xs;
}

async function loadLogoDataUrl() {
  const res = await fetch(LOGO_PATH);
  if (!res.ok) throw new Error(`logo ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

function formatIsoToMdY(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || '');
  const [y, m, d] = String(iso).split('-');
  return `${m}-${d}-${y}`;
}

function formatPrintStamp() {
  const d = new Date();
  const dateRaw = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return dateRaw.replace(/ /g, '-');
}

function formatMoney(value, currency) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${currency}${formatted}`;
}

function formatQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US');
}

// ---------- drawing ----------

function drawCellBorder(doc, x, y, w, h) {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);
}

function drawBlueBoldUnderline(doc, text, x, y, maxW) {
  doc.setTextColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(String(text), maxW);
  let yy = y;
  lines.forEach((line) => {
    doc.text(line, x, yy);
    const tw = doc.getTextWidth(line);
    doc.setDrawColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
    doc.setLineWidth(0.4);
    doc.line(x, yy + 2, x + tw, yy + 2);
    yy += 12;
  });
  doc.setTextColor(0, 0, 0);
  return yy;
}

function drawHeaderCell(doc, x, y, w, h, headerText) {
  doc.setFillColor(HEADER_FILL[0], HEADER_FILL[1], HEADER_FILL[2]);
  doc.rect(x, y, w, h, 'F');
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const parts = String(headerText || '—')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) parts.push('—');

  let fs = 6.4;
  doc.setFontSize(fs);
  let lines = [];
  parts.forEach((p) => {
    lines.push(...doc.splitTextToSize(p, Math.max(3, w - 3)));
  });
  if (lines.length > 3) {
    fs = 5.6;
    doc.setFontSize(fs);
    lines = [];
    parts.forEach((p) => {
      lines.push(...doc.splitTextToSize(p, Math.max(3, w - 3)));
    });
  }

  const lineH = fs * 1.18;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  lines.slice(0, 4).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
      baseline: 'middle',
      maxWidth: w - 2,
    });
  });
}

function drawTextCell(doc, x, y, w, h, text, opts = {}) {
  const { align = 'left', bold = false, fontSize = 6.4, color = [0, 0, 0] } = opts;
  drawCellBorder(doc, x, y, w, h);
  if (text == null || text === '') return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  const maxW = Math.max(2, w - 4);
  const lines = doc.splitTextToSize(String(text), maxW);
  const lineH = fontSize * 1.18;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  let xText;
  if (align === 'center') xText = x + w / 2;
  else if (align === 'right') xText = x + w - 3;
  else xText = x + 3;
  lines.slice(0, 3).forEach((ln, i) => {
    doc.text(ln, xText, firstY + i * lineH, {
      align,
      baseline: 'middle',
      maxWidth: maxW,
    });
  });
  doc.setTextColor(0, 0, 0);
}

function drawTableHeaderRow(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  for (let i = 0; i < HEADERS.length; i += 1) {
    drawHeaderCell(doc, xs[i], y, widths[i], TABLE_HEADER_ROW_H, HEADERS[i]);
  }
  return y + TABLE_HEADER_ROW_H;
}

function drawDataRow(doc, y, x0, widths, sNo, row, supplierLabel) {
  const xs = colXs(x0, widths);
  let i = 0;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, sNo, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, supplierLabel, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.customer, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.style, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.poNo, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatQty(row.bookedQty), { align: 'right' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatQty(row.shippedQty), { align: 'right' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatMoney(row.bookedFob, CURRENCY_USD), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatMoney(row.shippedFob, CURRENCY_USD), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatMoney(row.bookedCommOn, CURRENCY_USD), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatMoney(row.shippedCommOn, CURRENCY_USD), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatMoney(row.bookedLdp, CURRENCY_USD), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatMoney(row.shippedLdp, CURRENCY_USD), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.vendorShipDate, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.buyerShipDate, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.actualShipDate, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.etaDate, { align: 'center' });
  return y + DATA_ROW_H;
}

function sumGroup(rows) {
  return rows.reduce(
    (acc, r) => {
      acc.bookedQty += Number(r.bookedQty) || 0;
      acc.shippedQty += Number(r.shippedQty) || 0;
      acc.bookedFob += Number(r.bookedFob) || 0;
      acc.shippedFob += Number(r.shippedFob) || 0;
      acc.bookedCommOn += Number(r.bookedCommOn) || 0;
      acc.shippedCommOn += Number(r.shippedCommOn) || 0;
      acc.bookedLdp += Number(r.bookedLdp) || 0;
      acc.shippedLdp += Number(r.shippedLdp) || 0;
      return acc;
    },
    {
      bookedQty: 0,
      shippedQty: 0,
      bookedFob: 0,
      shippedFob: 0,
      bookedCommOn: 0,
      shippedCommOn: 0,
      bookedLdp: 0,
      shippedLdp: 0,
    }
  );
}

function drawGroupTotalRow(doc, y, x0, widths, totals) {
  const xs = colXs(x0, widths);
  let i = 0;
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, '', {});
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, 'Supplier Total', {
    align: 'center',
    bold: true,
  });
  i += 1;
  for (let k = 0; k < 3; k += 1) {
    drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, '', {});
    i += 1;
  }
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, formatQty(totals.bookedQty), {
    align: 'right',
    bold: true,
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, formatQty(totals.shippedQty), {
    align: 'right',
    bold: true,
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, formatMoney(totals.bookedFob, CURRENCY_USD), {
    align: 'right',
    bold: true,
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, formatMoney(totals.shippedFob, CURRENCY_USD), {
    align: 'right',
    bold: true,
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, formatMoney(totals.bookedCommOn, CURRENCY_USD), {
    align: 'right',
    bold: true,
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, formatMoney(totals.shippedCommOn, CURRENCY_USD), {
    align: 'right',
    bold: true,
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, formatMoney(totals.bookedLdp, CURRENCY_USD), {
    align: 'right',
    bold: true,
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, formatMoney(totals.shippedLdp, CURRENCY_USD), {
    align: 'right',
    bold: true,
  });
  i += 1;
  for (let k = 0; k < 4; k += 1) {
    drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, '', {});
    i += 1;
  }
  return y + TOTAL_ROW_H;
}

function drawOuterTableFrame(doc, x, y, w, h) {
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.5);
  doc.rect(x, y, w, h);
}

function drawPageHeader(doc, logoDataUrl, meta) {
  const innerLeft = H_MARGIN;
  const innerRight = PAGE_W - H_MARGIN;
  const logoW = 110;
  const logoH = 36;
  const logoX = innerRight - logoW;
  const logoY = V_MARGIN + 4;
  const leftMaxW = Math.max(140, logoX - innerLeft - 12);

  let y = V_MARGIN + 12;
  y = drawBlueBoldUnderline(doc, 'Business Summary Order Wise', innerLeft, y, leftMaxW) + 2;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.6);
  const fromH = formatIsoToMdY(meta.fromDate);
  const toH = formatIsoToMdY(meta.toDate);
  doc.text(`For the period :  ${fromH} To ${toH}`, innerLeft, y);
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(70, 70, 70);
  doc.text('*Amounts are in US Dollar', innerLeft, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.4);
  doc.setTextColor(70, 70, 70);
  doc.text(
    'A.M.S House B4,Kakan Housing Society Alamgir Road - Postal Code: 74800',
    innerRight,
    logoY + logoH + 7,
    { align: 'right', baseline: 'top' }
  );
  doc.text(
    'Karachi - Pakistan.    Telephone # : 02134967216 & 02134946005',
    innerRight,
    logoY + logoH + 14,
    { align: 'right', baseline: 'top' }
  );
  doc.setTextColor(0, 0, 0);

  const tableTop = V_MARGIN + HEADER_BLOCK_H;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.text(`Printed on:    ${formatPrintStamp()}`, innerRight, tableTop - 6, {
    align: 'right',
    baseline: 'bottom',
  });

  return tableTop;
}

function drawFooter(doc, pageIndex, totalPages) {
  const baseY = PAGE_H - V_MARGIN - 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('Powered by : INTEGRA ERP SYSTEM', PAGE_W / 2, baseY, {
    align: 'center',
    baseline: 'middle',
  });
  doc.setFontSize(6.4);
  doc.setTextColor(70, 70, 70);
  doc.text(
    'Developed by : ITG (Pvt) Ltd. - Website: www.itg.net.pk',
    PAGE_W / 2,
    baseY + 9,
    { align: 'center', baseline: 'middle' }
  );
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(
    `Page ${pageIndex} of ${totalPages}`,
    PAGE_W - H_MARGIN,
    baseY + 9,
    { align: 'right', baseline: 'middle' }
  );
}

/**
 * @param {{ fromDate?: string; toDate?: string; groups?: Array<{ supplier: string; rows: object[] }> }} data
 * @param {{ fromDate?: string; toDate?: string }} [meta]
 */
export async function buildBusinessSummaryOrderWiseSupplierPdfBlob(data, meta = {}) {
  const payload =
    data && Array.isArray(data.groups) && data.groups.length > 0
      ? data
      : BUSINESS_SUMMARY_ORDER_WISE_SUPPLIER_DEMO;
  const headerMeta = {
    fromDate: meta.fromDate || payload.fromDate,
    toDate: meta.toDate || payload.toDate,
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(innerW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let tableSegTop = 0;
  let y = 0;

  const startPage = () => {
    const tableTop = drawPageHeader(doc, logoDataUrl, headerMeta);
    tableSegTop = tableTop;
    y = drawTableHeaderRow(doc, tableTop, innerLeft, widths);
  };

  const flushSegmentFrame = () => {
    const h = y - tableSegTop;
    if (h > 0) {
      drawOuterTableFrame(doc, innerLeft, tableSegTop, innerW, h);
    }
  };

  startPage();

  payload.groups.forEach((group) => {
    group.rows.forEach((row, idx) => {
      if (y + DATA_ROW_H > pageBodyBottom) {
        flushSegmentFrame();
        doc.addPage([PAGE_W, PAGE_H], 'l');
        startPage();
      }
      const supplierLabel = idx === 0 ? group.supplier : '';
      y = drawDataRow(doc, y, innerLeft, widths, idx + 1, row, supplierLabel);
    });

    if (y + TOTAL_ROW_H > pageBodyBottom) {
      flushSegmentFrame();
      doc.addPage([PAGE_W, PAGE_H], 'l');
      startPage();
    }
    const totals = sumGroup(group.rows);
    y = drawGroupTotalRow(doc, y, innerLeft, widths, totals);
  });

  flushSegmentFrame();

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  setPdfDocumentTitle(doc, BUSINESS_SUMMARY_ORDER_WISE_DOCUMENT_TITLE);

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openBusinessSummaryOrderWiseSupplierPdf(mode, pdfBlob) {
  const namedPdf =
    typeof File !== 'undefined'
      ? new File([pdfBlob], BUSINESS_SUMMARY_ORDER_WISE_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedPdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = BUSINESS_SUMMARY_ORDER_WISE_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
