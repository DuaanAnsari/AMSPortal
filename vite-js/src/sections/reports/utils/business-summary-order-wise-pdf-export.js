import jsPDF from 'jspdf';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const V_MARGIN = 8;
const H_MARGIN = 6;
const HEADER_BLOCK_H = 92;
const TABLE_HEADER_ROW_H = 32;
const DATA_ROW_H = 22;
const TOTAL_ROW_H = 22;
const FOOTER_H = 18;
const TITLE_BLUE = [0, 51, 153];
const HEADER_FILL = [231, 233, 240];

const PAGE_W = 1000;
const PAGE_H = 595;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

export const BUSINESS_SUMMARY_ORDER_WISE_DOCUMENT_TITLE = 'Business Summary Order wise';
export const BUSINESS_SUMMARY_ORDER_WISE_PDF_FILENAME = 'Business Summary Order wise.pdf';

function setPdfDocumentTitle(doc, title) {
  if (!title) return;
  try {
    doc.setProperties({ title, subject: title });
  } catch (e) {
    /* setProperties unavailable — non-fatal, preview still works */
  }
}

/** 17 columns in display order. */
const HEADERS = [
  'S.No',
  'Customer',
  'Supplier',
  'Style',
  'PO NO.',
  'Booked\nQuantity',
  'Shipped\nQuantity',
  'Booked\nFOB',
  'Shipped\nFOB',
  'Booked\nComm. on',
  'Shipped\nComm. on',
  'Booked LDP\nAmount',
  'Shipped LDP\nAmount',
  'Vendor Ship.\nDate',
  'Buyer Ship.\nDate',
  'Actual Ship.\nDate',
  'ETA Date',
];

const COL_WEIGHTS = [
  18, 72, 60, 36, 54, 38, 38, 40, 40, 40, 40, 44, 44, 44, 44, 42, 40,
];

const CURRENCY_USD = '$';

/** Demo rows — replace with API rows when backend is ready. */
export const BUSINESS_SUMMARY_ORDER_WISE_DEMO = {
  fromDate: '2026-01-01',
  toDate: '2026-12-31',
  groups: [
    {
      customer: 'AVALON APPAREL',
      rows: [
        {
          supplier: 'MS GARMENTS',
          style: '1010',
          poNo: 'Ams-av-024',
          bookedQty: 1600,
          shippedQty: 1488,
          bookedFob: 8400,
          shippedFob: 7812,
          bookedCommOn: 420,
          shippedCommOn: 390.6,
          bookedLdp: 13600,
          shippedLdp: 12648,
          vendorShipDate: '15-Mar-2026',
          buyerShipDate: '15-Mar-2026',
          actualShipDate: '',
          etaDate: '16-Apr-2026',
        },
        {
          supplier: 'MS GARMENTS',
          style: '73N',
          poNo: 'AMS-AV-025-OAT',
          bookedQty: 432,
          shippedQty: 0,
          bookedFob: 2073.6,
          shippedFob: 0,
          bookedCommOn: 103.68,
          shippedCommOn: 0,
          bookedLdp: 3313.44,
          shippedLdp: 0,
          vendorShipDate: '30-Apr-2026',
          buyerShipDate: '15-May-2026',
          actualShipDate: '',
          etaDate: '16-Jun-2026',
        },
        {
          supplier: 'MS GARMENTS',
          style: '73N',
          poNo: 'AMS-AV-025-SALT',
          bookedQty: 480,
          shippedQty: 0,
          bookedFob: 2304,
          shippedFob: 0,
          bookedCommOn: 115.2,
          shippedCommOn: 0,
          bookedLdp: 3681.6,
          shippedLdp: 0,
          vendorShipDate: '30-Apr-2026',
          buyerShipDate: '15-May-2026',
          actualShipDate: '',
          etaDate: '16-Jun-2026',
        },
        {
          supplier: 'MS GARMENTS',
          style: '27',
          poNo: 'AMS-AV-026-LAV',
          bookedQty: 72,
          shippedQty: 0,
          bookedFob: 277.2,
          shippedFob: 0,
          bookedCommOn: 13.86,
          shippedCommOn: 0,
          bookedLdp: 552.24,
          shippedLdp: 0,
          vendorShipDate: '30-Apr-2026',
          buyerShipDate: '15-May-2026',
          actualShipDate: '',
          etaDate: '16-Jun-2026',
        },
        {
          supplier: 'MS GARMENTS',
          style: '27',
          poNo: 'AMS-AV-026-SALT',
          bookedQty: 672,
          shippedQty: 0,
          bookedFob: 2587.2,
          shippedFob: 0,
          bookedCommOn: 129.36,
          shippedCommOn: 0,
          bookedLdp: 5154.24,
          shippedLdp: 0,
          vendorShipDate: '30-Apr-2026',
          buyerShipDate: '15-May-2026',
          actualShipDate: '',
          etaDate: '16-Jun-2026',
        },
      ],
    },
    {
      customer: 'C-LIFE GROUP LTD.',
      rows: [
        {
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-007',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-152',
          bookedQty: 3600,
          shippedQty: 3528,
          bookedFob: 5328,
          shippedFob: 5221.44,
          bookedCommOn: 266.4,
          shippedCommOn: 261.07,
          bookedLdp: 9072,
          shippedLdp: 8890.56,
          vendorShipDate: '16-Apr-2026',
          buyerShipDate: '17-Apr-2026',
          actualShipDate: '',
          etaDate: '19-May-2026',
        },
        {
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0156',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0159',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0160',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-0169',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-024',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-052',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-076',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-078',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-445',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-446',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-448',
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
          supplier: 'AYYOUB APPARELS',
          style: 'SO-1592893',
          poNo: 'VPO-1149645-449',
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
          supplier: 'COMFORT APPAREL',
          style: 'SO-1593980',
          poNo: 'VPO-1150064',
          bookedQty: 30000,
          shippedQty: 30000,
          bookedFob: 31500,
          shippedFob: 31500,
          bookedCommOn: 1575,
          shippedCommOn: 1575,
          bookedLdp: 45000,
          shippedLdp: 45000,
          vendorShipDate: '03-Mar-2026',
          buyerShipDate: '03-Mar-2026',
          actualShipDate: '',
          etaDate: '04-Apr-2026',
        },
        {
          supplier: 'COMFORT APPAREL',
          style: 'SO-1594517',
          poNo: 'VPO-1150418',
          bookedQty: 144,
          shippedQty: 144,
          bookedFob: 151.2,
          shippedFob: 151.2,
          bookedCommOn: 7.56,
          shippedCommOn: 7.56,
          bookedLdp: 216,
          shippedLdp: 216,
          vendorShipDate: '03-Mar-2026',
          buyerShipDate: '03-Mar-2026',
          actualShipDate: '',
          etaDate: '04-Apr-2026',
        },
      ],
    },
    {
      customer: 'JEDCO BRANDS, INC',
      rows: [
        {
          supplier: 'MS GARMENTS',
          style: 'APX CAMOSS',
          poNo: 'PO0018471',
          bookedQty: 9767,
          shippedQty: 9767,
          bookedFob: 5371.85,
          shippedFob: 5371.85,
          bookedCommOn: 402.89,
          shippedCommOn: 402.89,
          bookedLdp: 24417.5,
          shippedLdp: 24417.5,
          vendorShipDate: '05-Jan-2026',
          buyerShipDate: '05-Jan-2026',
          actualShipDate: '',
          etaDate: '06-Feb-2026',
        },
        {
          supplier: 'MS GARMENTS',
          style: 'APX CAMOSS',
          poNo: 'PO0018682',
          bookedQty: 9700,
          shippedQty: 9700,
          bookedFob: 5335,
          shippedFob: 5335,
          bookedCommOn: 400.13,
          shippedCommOn: 400.13,
          bookedLdp: 24250,
          shippedLdp: 24250,
          vendorShipDate: '15-Jan-2026',
          buyerShipDate: '15-Jan-2026',
          actualShipDate: '',
          etaDate: '16-Feb-2026',
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

function drawDataRow(doc, y, x0, widths, sNo, row, customerLabel) {
  const xs = colXs(x0, widths);
  let i = 0;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, sNo, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, customerLabel, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.supplier, { align: 'left' });
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
  drawTextCell(doc, xs[i], y, widths[i], TOTAL_ROW_H, 'Customer Total', {
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

function drawFooter(doc) {
  const fy = PAGE_H - V_MARGIN - 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('Powered by : INTEGRA ERP SYSTEM', PAGE_W / 2, fy, {
    align: 'center',
    baseline: 'bottom',
  });
}

/**
 * @param {{ fromDate?: string; toDate?: string; groups?: Array<{ customer: string; rows: object[] }> }} data
 * @param {{ fromDate?: string; toDate?: string }} [meta]
 */
export async function buildBusinessSummaryOrderWisePdfBlob(data, meta = {}) {
  // Empty `groups` is valid — title/header/table render; only fall back to demo when groups omitted.
  const payload =
    data && Array.isArray(data.groups)
      ? data
      : { groups: [], fromDate: meta.fromDate, toDate: meta.toDate };
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
      const customerLabel = idx === 0 ? group.customer : '';
      y = drawDataRow(doc, y, innerLeft, widths, idx + 1, row, customerLabel);
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
    drawFooter(doc);
  }

  setPdfDocumentTitle(doc, BUSINESS_SUMMARY_ORDER_WISE_DOCUMENT_TITLE);

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openBusinessSummaryOrderWisePdf(mode, pdfBlob) {
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
