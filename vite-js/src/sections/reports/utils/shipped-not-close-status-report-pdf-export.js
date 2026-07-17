import jsPDF from 'jspdf';

/**
 * Shipped But Status Not Closed Report — landscape PDF.
 *
 * Layout (per legacy print):
 *   - Top-LEFT  : AMS logo.
 *   - Top-CTR   : "SHIPPED BUT STATUS NOT CLOSED REPORT" title (bold, 14pt)
 *                 plus a one-line "From : ... To : ..." summary below it.
 *   - Top-RIGHT : "Print Date :" and "Print Time :" stacked, right-aligned.
 *   - Table     : 11 cols — PO #, Shipment Date (B), Customer, Supplier,
 *                 Merchandiser, Style No, PO Qty, Ship Qty, Invoice No,
 *                 Shipment Date, PO Status.
 *                 Numeric columns render with thousands separators.
 *                 A bold "Total" row at the end sums PO Qty + Ship Qty.
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

const HEADER_BLOCK_H = 100;
const TABLE_HEADER_H = 32;
const DATA_ROW_H = 24;
const TOTAL_ROW_H = 26;
const FOOTER_H = 32;

const HEADER_FILL = [255, 255, 255];
const HEADER_TEXT = [0, 0, 0];
const BORDER = [150, 150, 150];
const NAVY = [0, 51, 102];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

export const SHIPPED_NOT_CLOSE_DOCUMENT_TITLE = 'Shipped But Status Not Closed Report';
export const SHIPPED_NOT_CLOSE_PDF_FILENAME = 'Shipped But Status Not Closed Report.pdf';

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} ShippedNotCloseCol */

/** @type {ShippedNotCloseCol[]} */
const COLS = [
  { key: 'poNo', label: 'PO #', weight: 78, align: 'left' },
  { key: 'shipmentDateB', label: 'Shipment Date (B)', weight: 72, align: 'center' },
  { key: 'customer', label: 'Customer', weight: 82, align: 'left' },
  { key: 'supplier', label: 'Supplier', weight: 80, align: 'left' },
  { key: 'merchandiser', label: 'Merchandiser', weight: 80, align: 'left' },
  { key: 'styleNo', label: 'Style No', weight: 65, align: 'left' },
  { key: 'poQty', label: 'PO Qty', weight: 48, align: 'right' },
  { key: 'shipQty', label: 'Ship Qty', weight: 48, align: 'right' },
  { key: 'invoiceNo', label: 'Invoice No', weight: 88, align: 'left' },
  { key: 'shipmentDate', label: 'Shipment\nDate', weight: 70, align: 'center' },
  { key: 'poStatus', label: 'PO Status', weight: 70, align: 'center' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy print mock-up.
// ----------------------------------------------------------------------

const RAW_DEMO_ROWS = [
  ['202301-769',     '15 Apr 2026', 'Ultimate Apparel, Inc', 'Continental apparels', 'MUHAMMAD SHAHZAIB', '769',          2880,  192,   'CA-663B',           '09 May 2026', 'Confirmed'],
  ['202301-769',     '15 Apr 2026', 'Ultimate Apparel, Inc', 'Continental apparels', 'MUHAMMAD SHAHZAIB', '769',          2880,  2664,  'CA-663',            '13 Apr 2026', 'Confirmed'],
  ['202301-770',     '15 Apr 2026', 'Ultimate Apparel, Inc', 'Continental apparels', 'MUHAMMAD SHAHZAIB', '770',          3144,  2928,  'CA-663B',           '09 May 2026', 'Confirmed'],
  ['38831-MCS-LAVE', '15 Mar 2026', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'LR3016',       1824,  1512,  'MS-155-HMB-2026',   '07 Apr 2026', 'Confirmed'],
  ['38831-MPO-NAVY', '15 Mar 2026', 'LONE ROCK',             'MS Garments',          'MUHAMMAD SHAHZAIB', 'LR3015',       3984,  3768,  'MS-155-HMB-2026',   '07 Apr 2026', 'Confirmed'],
  ['PO0019438',      '30 Apr 2026', 'Jedco brands, inc',     'Ayyoub Apparels',      'MUHAMMAD SHAHZAIB', 'APX CAMO SS',  10308, 10308, 'AMS/AA/2184/2026',  '09 May 2026', 'Confirmed'],
  ['Po0019439',      '30 Apr 2026', 'Jedco brands, inc',     'Ayyoub Apparels',      'MUHAMMAD SHAHZAIB', 'APX CAMO SS',  10272, 10272, 'AMS/AA/2184/2026',  '09 May 2026', 'Confirmed'],
];

export const SHIPPED_NOT_CLOSE_STATUS_REPORT_DEMO = {
  fromLabel: '01-Jan-2026',
  toLabel: '31-Dec-2026',
  rows: RAW_DEMO_ROWS.map(
    ([
      poNo,
      shipmentDateB,
      customer,
      supplier,
      merchandiser,
      styleNo,
      poQty,
      shipQty,
      invoiceNo,
      shipmentDate,
      poStatus,
    ]) => ({
      poNo,
      shipmentDateB,
      customer,
      supplier,
      merchandiser,
      styleNo,
      poQty,
      shipQty,
      invoiceNo,
      shipmentDate,
      poStatus,
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

function formatPrintDate(d = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${pad2(d.getDate())}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

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
    fontSize = 8,
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
  doc.text('SHIPPED BUT STATUS NOT CLOSED REPORT', PAGE_W / 2, V_MARGIN + 22, {
    align: 'center',
    baseline: 'alphabetic',
  });

  // Single-line From/To summary under the title (centered).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `From : ${meta.fromLabel}    To : ${meta.toLabel}`,
    PAGE_W / 2,
    V_MARGIN + 48,
    { align: 'center', baseline: 'alphabetic' }
  );

  // Right block — Print Date / Time stacked (right-aligned, two columns).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const rightValueX = innerRight;
  const rightLabelX = innerRight - 60;
  doc.text('Print Date:', rightLabelX, V_MARGIN + 70, { align: 'right' });
  doc.text('Print Time:', rightLabelX, V_MARGIN + 84, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(meta.printDate, rightValueX, V_MARGIN + 70, { align: 'right' });
  doc.text(meta.printTime, rightValueX, V_MARGIN + 84, { align: 'right' });

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
      fontSize: 8,
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
      default:
        raw = row[col.key];
    }

    if (raw === undefined || raw === null || raw === '') return;

    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      fontSize: 7.6,
      color: [0, 0, 0],
      pad: 3,
      maxLines: 2,
    });
  });
  return y + DATA_ROW_H;
}

/**
 * "Total" row — the label spans cols 0..5 (PO # through Style No), then
 * PO Qty + Ship Qty totals fill cols 6 and 7. The remaining cells stay empty
 * but keep their borders so the row visually closes off the table.
 */
function drawTotalRow(doc, y, x0, widths, totals) {
  const xs = colXs(x0, widths);

  const labelSpanEnd = 6; // exclusive — label spans cols [0..5]
  const labelStartX = xs[0];
  const labelEndX = xs[labelSpanEnd];
  const labelW = labelEndX - labelStartX;

  // Draw one merged-looking rectangle for the label region.
  strokeRect(doc, labelStartX, y, labelW, TOTAL_ROW_H);
  textInRect(doc, labelStartX, y, labelW, TOTAL_ROW_H, 'Total', {
    align: 'center',
    bold: true,
    fontSize: 9,
    color: [0, 0, 0],
    pad: 5,
    maxLines: 1,
  });

  // PO Qty + Ship Qty totals.
  COLS.forEach((col, i) => {
    if (i < labelSpanEnd) return;
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, TOTAL_ROW_H);
    let raw = '';
    if (col.key === 'poQty') raw = formatInt(totals.poQty);
    else if (col.key === 'shipQty') raw = formatInt(totals.shipQty);
    if (!raw) return;
    textInRect(doc, x, y, w, TOTAL_ROW_H, raw, {
      align: 'right',
      bold: true,
      fontSize: 9,
      color: [0, 0, 0],
      pad: 5,
      maxLines: 1,
    });
  });

  return y + TOTAL_ROW_H;
}

// ----------------------------------------------------------------------
// Footer
// ----------------------------------------------------------------------

function drawFooter(doc, pageIdx, totalPages, printedOn) {
  const fy = PAGE_H - V_MARGIN - 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Printed on :  ${printedOn || formatPrintedOnLong()}`, H_MARGIN, fy - 2, {
    baseline: 'bottom',
  });

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
 *   fromLabel?: string;
 *   toLabel?: string;
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildShippedNotCloseStatusReportPdfBlob(data = {}) {
  // Empty `rows` is valid — headers/table/total still render; only fall back to demo when rows omitted.
  const payload =
    data && Array.isArray(data.rows) ? data : SHIPPED_NOT_CLOSE_STATUS_REPORT_DEMO;

  const now = new Date();
  const meta = {
    printedOn: payload.printedOn || data.printedOn || formatPrintedOnLong(now),
    printDate: formatPrintDate(now),
    printTime: formatPrintTime(now),
    fromLabel: data.fromLabel || payload.fromLabel || '',
    toLabel: data.toLabel || payload.toLabel || '',
  };

  const totals = payload.rows.reduce(
    (acc, r) => ({
      poQty: acc.poQty + (Number(r.poQty) || 0),
      shipQty: acc.shipQty + (Number(r.shipQty) || 0),
    }),
    { poQty: 0, shipQty: 0 }
  );

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

  /** Force the Total row to live on the final page. */
  if (y + TOTAL_ROW_H > pageBodyBottom) {
    doc.addPage([PAGE_W, PAGE_H], 'l');
    startPage();
  }
  y = drawTotalRow(doc, y, innerLeft, widths, totals);

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, meta.printedOn);
  }

  try {
    doc.setProperties({
      title: SHIPPED_NOT_CLOSE_DOCUMENT_TITLE,
      subject: SHIPPED_NOT_CLOSE_DOCUMENT_TITLE,
    });
  } catch {
    /* setProperties unavailable — non-fatal, preview still works */
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openShippedNotCloseStatusReportPdf(mode, pdfBlob) {
  const namedFile =
    typeof File !== 'undefined'
      ? new File([pdfBlob], SHIPPED_NOT_CLOSE_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedFile);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = SHIPPED_NOT_CLOSE_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

/** Reformats an ISO date (YYYY-MM-DD) to "DD-MMM-YYYY" used in the header. */
export function shippedNotCloseHeaderDate(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d}-${months[Number(mo) - 1] || mo}-${y}`;
}
