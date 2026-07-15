import jsPDF from 'jspdf';

/**
 * Shipped Delay / OnTime Report — landscape PDF.
 *
 * Layout (per legacy print):
 *   - Top-LEFT  : AMS logo.
 *   - Top-CTR   : "SHIPPED <DELAY|ON TIME> REPORT" title (bold, 16pt) plus a
 *                 3-line filter summary below it (From/To, Customer, Supplier).
 *   - Top-RIGHT : "Print Date :" and "Print Time :" stacked, right-aligned.
 *   - Table     : 12 cols — PO #, Style NO, Customer, Vendor, Merchandiser,
 *                 Invoice No, PO Qty, Ship Qty, Buyer Ship Date, Revised
 *                 Ship (B), Shipment Date, Days.
 *   - Footer    : Printed on (left), Powered by … / Developed by … (center),
 *                 Page X of Y (right).
 *
 * Demo data is hardcoded; backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 842;
const PAGE_H = 595;
const V_MARGIN = 22;
const H_MARGIN = 22;

const HEADER_BLOCK_H = 110;
const TABLE_HEADER_H = 28;
const DATA_ROW_H = 22;
const FOOTER_H = 32;

const HEADER_FILL = [255, 255, 255];
const HEADER_TEXT = [0, 0, 0];
const BORDER = [150, 150, 150];
const NAVY = [0, 51, 102];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

export const SHIPPED_DELAY_ONTIME_DOCUMENT_TITLE = 'Shipped Delay / OnTime Report';
export const SHIPPED_DELAY_ONTIME_PDF_FILENAME = 'Shipped Delay / OnTime Report.pdf';

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} ShippedDelayCol */

/** @type {ShippedDelayCol[]} */
const COLS = [
  { key: 'poNo', label: 'PO #', weight: 78, align: 'left' },
  { key: 'styleNo', label: 'Style NO', weight: 55, align: 'left' },
  { key: 'customer', label: 'Customer', weight: 82, align: 'left' },
  { key: 'vendor', label: 'Vendor', weight: 80, align: 'left' },
  { key: 'merchandiser', label: 'Merchandiser', weight: 80, align: 'left' },
  { key: 'invoiceNo', label: 'Invoice No', weight: 78, align: 'left' },
  { key: 'poQty', label: 'PO Qty', weight: 46, align: 'right' },
  { key: 'shipQty', label: 'Ship Qty', weight: 46, align: 'right' },
  { key: 'buyerShipDate', label: 'Buyer\nShip Date', weight: 60, align: 'center' },
  { key: 'revisedShipB', label: 'Revised\nShip (B)', weight: 60, align: 'center' },
  { key: 'shipmentDate', label: 'Shipment\nDate', weight: 60, align: 'center' },
  { key: 'days', label: 'Days', weight: 35, align: 'right' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy print mock-up (page 1).
// ----------------------------------------------------------------------

const RAW_DEMO_ROWS = [
  ['202294-769',      '769',    'Ultimate Apparel, Inc', 'ZR APPAREL',           'MUHAMMAD SHAHZAIB', 'CA/623/AM/2024',  5424,  5424,  '30-Dec-2025', '', '08-Jan-2026',  9],
  ['202294-969',      '969',    'Ultimate Apparel, Inc', 'ZR APPAREL',           'MUHAMMAD SHAHZAIB', 'CA/623/AM/2024',  312,   312,   '30-Dec-2025', '', '08-Jan-2026',  9],
  ['202299-BB2126',   'BB2126', 'Ultimate Apparel, Inc', 'Zahid international',  'MUHAMMAD SHAHZAIB', '006/ZI/26',       63936, 65808, '15-Apr-2026', '', '13-Apr-2026', -2],
  ['202299-MB2125',   'MB2125', 'Ultimate Apparel, Inc', 'Zahid international',  'MUHAMMAD SHAHZAIB', '006/ZI/26',       13248, 13248, '15-Apr-2026', '', '13-Apr-2026', -2],
  ['202301-562',      '562',    'Ultimate Apparel, Inc', 'ZR APPAREL',           'MUHAMMAD SHAHZAIB', 'MAFD-03-26-27',   2352,  2376,  '15-Apr-2026', '', '13-Apr-2026', -2],
  ['202301-763',      '763',    'Ultimate Apparel, Inc', 'ZR APPAREL',           'MUHAMMAD SHAHZAIB', 'MAFD-03-26-27',   3120,  3120,  '15-Apr-2026', '', '13-Apr-2026', -2],
  ['202301-764',      '764',    'Ultimate Apparel, Inc', 'ZR APPAREL',           'MUHAMMAD SHAHZAIB', 'MAFD-03-26-27',   504,   504,   '15-Apr-2026', '', '13-Apr-2026', -2],
  ['202301-769',      '769',    'Ultimate Apparel, Inc', 'Continental apparels', 'MUHAMMAD SHAHZAIB', 'CA-663B',         2880,  192,   '15-Apr-2026', '', '09-May-2026', 24],
  ['202301-769',      '769',    'Ultimate Apparel, Inc', 'Continental apparels', 'MUHAMMAD SHAHZAIB', 'CA-663',          2880,  2664,  '15-Apr-2026', '', '13-Apr-2026', -2],
  ['202301-770',      '770',    'Ultimate Apparel, Inc', 'Continental apparels', 'MUHAMMAD SHAHZAIB', 'CA-663B',         3144,  2928,  '15-Apr-2026', '', '09-May-2026', 24],
  ['37855-MPO-PEACH', 'LR3015', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-137-HMB-2025', 1344,  144,   '02-Sep-2025', '', '08-Jan-2026', 128],
  ['38104-MPO-NAVY',  'LR3015', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-136-HMB-2025', 2160,  1032,  '01-Dec-2025', '', '03-Jan-2026', 33],
  ['38106',           'LRB',    'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-151-HMB-2026', 5000,  2592,  '15-Jan-2026', '', '09-Mar-2026', 53],
  ['38275-MCS-BASIL', 'LR3016', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-136-HMB-2025', 3672,  3672,  '02-Dec-2025', '', '03-Jan-2026', 32],
  ['38275-MCS-BROWN', 'LR3016', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-136-HMB-2025', 504,   528,   '02-Dec-2025', '', '03-Jan-2026', 32],
  ['38275-MCS-CHAR',  'LR3016', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-136-HMB-2025', 288,   288,   '02-Dec-2025', '', '03-Jan-2026', 32],
  ['38275-MCS-DENIM', 'LR3016', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-136-HMB-2025', 1032,  1008,  '02-Dec-2025', '', '03-Jan-2026', 32],
  ['38275-MCS-OAT',   'LR3016', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-136-HMB-2025', 2352,  2352,  '02-Dec-2025', '', '03-Jan-2026', 32],
  ['38275-MPO-BASIL', 'LR3015', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-140-HMB-2026', 3408,  264,   '02-Dec-2025', '', '21-Jan-2026', 50],
  ['38275-MPO-BROWN', 'LR3015', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-153-HMB-2026', 1296,  96,    '02-Dec-2025', '', '21-Mar-2026', 109],
  ['38275-MPO-BROWN', 'LR3015', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-136-HMB-2025', 1296,  1200,  '02-Dec-2025', '', '03-Jan-2026', 32],
  ['38275-MZH-BROWN', 'LR3017', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'MS-137-HMB-2025', 216,   216,   '02-Dec-2025', '', '08-Jan-2026', 37],
];

export const SHIPPED_DELAY_ONTIME_REPORT_DEMO = {
  status: 'DELAY',
  fromLabel: '01-Jan-2026',
  toLabel: '31-Dec-2026',
  customerLabel: 'All Customer',
  supplierLabel: 'All Supplier',
  rows: RAW_DEMO_ROWS.map(
    ([
      poNo,
      styleNo,
      customer,
      vendor,
      merchandiser,
      invoiceNo,
      poQty,
      shipQty,
      buyerShipDate,
      revisedShipB,
      shipmentDate,
      days,
    ]) => ({
      poNo,
      styleNo,
      customer,
      vendor,
      merchandiser,
      invoiceNo,
      poQty,
      shipQty,
      buyerShipDate,
      revisedShipB,
      shipmentDate,
      days,
    })
  ),
};

// ----------------------------------------------------------------------
// Geometry helpers
// ----------------------------------------------------------------------

function colWidths(innerW) {
  const sum = COLS.reduce((a, c) => a + c.weight, 0);
  const out = COLS.map((c) => (c.weight / sum) * innerW);
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

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatPrintedOnLong(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Print-date in "DD-MMM-YYYY" (matches the right-side header). */
function formatPrintDate(d = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${pad2(d.getDate())}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

/** Print-time in "h:mm am/pm" (matches the right-side header). */
function formatPrintTime(d = new Date()) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  h %= 12;
  if (h === 0) h = 12;
  return `${h}:${pad2(m)} ${ampm}`;
}

function formatInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US');
}

// ----------------------------------------------------------------------
// Drawing primitives
// ----------------------------------------------------------------------

function setBorder(doc) {
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.3);
}

function fillRect(doc, x, y, w, h, fill) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.rect(x, y, w, h, 'F');
}

function strokeRect(doc, x, y, w, h) {
  setBorder(doc);
  doc.rect(x, y, w, h);
}

function textInRect(doc, x, y, w, h, text, opts = {}) {
  const {
    align = 'left',
    bold = false,
    fontSize = 7,
    color = [0, 0, 0],
    pad = 3,
    maxLines = 2,
  } = opts;
  if (text == null || text === '') return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  const innerW = Math.max(2, w - pad * 2);
  const parts = String(text).split('\n');
  const lines = [];
  parts.forEach((p) => {
    lines.push(...doc.splitTextToSize(p, innerW));
  });
  const shown = lines.slice(0, maxLines);
  const lineH = fontSize * 1.18;
  const block = shown.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  let tx;
  if (align === 'center') tx = x + w / 2;
  else if (align === 'right') tx = x + w - pad;
  else tx = x + pad;
  shown.forEach((ln, i) => {
    doc.text(ln, tx, firstY + i * lineH, {
      align,
      baseline: 'middle',
      maxWidth: innerW,
    });
  });
  doc.setTextColor(0, 0, 0);
}

// ----------------------------------------------------------------------
// Page header
// ----------------------------------------------------------------------

function drawPageHeader(doc, logoDataUrl, meta) {
  const innerLeft = H_MARGIN;
  const innerRight = PAGE_W - H_MARGIN;

  // Logo (top-LEFT)
  if (logoDataUrl) {
    try {
      const logoW = 110;
      const logoH = 34;
      doc.addImage(logoDataUrl, 'PNG', innerLeft, V_MARGIN, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  // Centered title (bold, 14pt).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(meta.title, PAGE_W / 2, V_MARGIN + 18, {
    align: 'center',
    baseline: 'alphabetic',
  });

  // Filter summary stacked under the title (centered).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `From : ${meta.fromLabel}    To : ${meta.toLabel}`,
    PAGE_W / 2,
    V_MARGIN + 38,
    { align: 'center', baseline: 'alphabetic' }
  );
  doc.text(`Customer : ${meta.customerLabel}`, PAGE_W / 2, V_MARGIN + 52, {
    align: 'center',
    baseline: 'alphabetic',
  });
  doc.text(`Supplier : ${meta.supplierLabel}`, PAGE_W / 2, V_MARGIN + 66, {
    align: 'center',
    baseline: 'alphabetic',
  });

  // Right block — Print Date / Time stacked. Labels right-align in one column,
  // values right-align in another. Keeping ~6pt of gap between the two so the
  // bold label and the longest value (e.g. "13-May-2026") never overlap.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const rightValueX = innerRight;
  const rightLabelX = innerRight - 60;
  doc.text('Print Date:', rightLabelX, V_MARGIN + 52, { align: 'right' });
  doc.text('Print Time:', rightLabelX, V_MARGIN + 66, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(meta.printDate, rightValueX, V_MARGIN + 52, { align: 'right' });
  doc.text(meta.printTime, rightValueX, V_MARGIN + 66, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  return V_MARGIN + HEADER_BLOCK_H;
}

// ----------------------------------------------------------------------
// Table
// ----------------------------------------------------------------------

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    fillRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, HEADER_FILL);
    strokeRect(doc, xs[i], y, widths[i], TABLE_HEADER_H);
    textInRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, col.label, {
      align: 'center',
      bold: true,
      fontSize: 7.6,
      color: HEADER_TEXT,
      pad: 2,
      maxLines: 2,
    });
  });
  return y + TABLE_HEADER_H;
}

function drawDataRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, DATA_ROW_H);

    let raw;
    switch (col.key) {
      case 'poQty':
        raw = formatInt(row.poQty);
        break;
      case 'shipQty':
        raw = formatInt(row.shipQty);
        break;
      case 'days':
        raw = row.days === '' || row.days === null || row.days === undefined ? '' : `${row.days}`;
        break;
      default:
        raw = row[col.key];
    }

    if (raw === undefined || raw === null || raw === '') return;

    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      fontSize: 7,
      color: [0, 0, 0],
      pad: 3,
      maxLines: 2,
    });
  });
  return y + DATA_ROW_H;
}

// ----------------------------------------------------------------------
// Footer
// ----------------------------------------------------------------------

function drawFooter(doc, pageIdx, totalPages, printedOn) {
  const fy = PAGE_H - V_MARGIN - 2;

  // Printed on — left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Printed on :  ${printedOn || formatPrintedOnLong()}`, H_MARGIN, fy - 2, {
    baseline: 'bottom',
  });

  // Powered by / Developed by — centered
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text('Powered by : INTEGRA ERP SYSTEM', PAGE_W / 2, fy - 12, {
    align: 'center',
    baseline: 'bottom',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    'Developed by : ITG (Pvt) Ltd. - Website : www.itg.net.pk',
    PAGE_W / 2,
    fy - 2,
    { align: 'center', baseline: 'bottom' }
  );

  // Page X of Y — right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Page ${pageIdx} of ${totalPages}`, PAGE_W - H_MARGIN, fy - 2, {
    align: 'right',
    baseline: 'bottom',
  });
}

// ----------------------------------------------------------------------
// Public builder
// ----------------------------------------------------------------------

/**
 * @param {{
 *   rows?: object[];
 *   status?: 'DELAY'|'ONTIME';
 *   fromLabel?: string;
 *   toLabel?: string;
 *   customerLabel?: string;
 *   supplierLabel?: string;
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildShippedDelayOnTimeReportPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.rows) && data.rows.length > 0
      ? data
      : SHIPPED_DELAY_ONTIME_REPORT_DEMO;

  const status = String(data.status || payload.status || 'DELAY').toUpperCase();
  const titleSuffix = status === 'ONTIME' || status === 'ON TIME' ? 'ON TIME' : 'DELAY';

  const now = new Date();
  const meta = {
    printedOn: payload.printedOn || data.printedOn || formatPrintedOnLong(now),
    printDate: formatPrintDate(now),
    printTime: formatPrintTime(now),
    title: `SHIPPED ${titleSuffix} REPORT`,
    fromLabel: data.fromLabel || payload.fromLabel || '',
    toLabel: data.toLabel || payload.toLabel || '',
    customerLabel: data.customerLabel || payload.customerLabel || 'All Customer',
    supplierLabel: data.supplierLabel || payload.supplierLabel || 'All Supplier',
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(innerW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let y = 0;

  const startPage = () => {
    y = drawPageHeader(doc, logoDataUrl, meta);
    y = drawTableHeader(doc, y, innerLeft, widths);
  };

  startPage();

  payload.rows.forEach((row) => {
    if (y + DATA_ROW_H > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'l');
      startPage();
    }
    y = drawDataRow(doc, y, innerLeft, widths, row);
  });

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, meta.printedOn);
  }

  try {
    doc.setProperties({
      title: SHIPPED_DELAY_ONTIME_DOCUMENT_TITLE,
      subject: SHIPPED_DELAY_ONTIME_DOCUMENT_TITLE,
    });
  } catch {
    /* setProperties unavailable — non-fatal, preview still works */
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 * @param {string} [status]
 */
export function openShippedDelayOnTimeReportPdf(mode, pdfBlob, _status = 'DELAY') {
  const namedFile =
    typeof File !== 'undefined'
      ? new File([pdfBlob], SHIPPED_DELAY_ONTIME_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedFile);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = SHIPPED_DELAY_ONTIME_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

/** Reformats an ISO date (YYYY-MM-DD) to "DD-MMM-YYYY" used in the header. */
export function shippedDelayHeaderDate(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d}-${months[Number(mo) - 1] || mo}-${y}`;
}
