import jsPDF from 'jspdf';

/**
 * Shipment History Report — portrait A4 PDF.
 *
 * Layout (per legacy print):
 *   - Top-left  : AMS logo + 2-line company address.
 *   - Center    : "SHIPMENT HISTORY REPORT" (bold, oversized).
 *   - Top-right : "From : <date>" and "To : <date>" (one per line, red text).
 *   - Table     : 8 cols (Shipment Date, Invoice No, Vendor Invoice No,
 *                 Container No, Shipment Mode, Shipped Qty, Cartons,
 *                 Exp. ETD Date) with a peach header band + red header text.
 *   - Grand-total band at the bottom: distinct-container count + shipped qty
 *                 + cartons totals.
 *   - "Summary :" mini-table at the end (final page) showing the per-mode
 *                 container count (By Sea / By Air / By Courier / Total).
 *   - Footer    : Printed on (left), Powered by … / Developed by … (center),
 *                 Page X of Y (right).
 *
 * Demo data is hardcoded; backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 595;
const PAGE_H = 842;
const V_MARGIN = 24;
const H_MARGIN = 22;

const HEADER_BLOCK_H = 130;
const TABLE_HEADER_H = 30;
const DATA_ROW_H = 18;
const TOTAL_ROW_H = 20;
const FOOTER_H = 32;

/** White table-header band with black bold text — matches the latest legacy print. */
const HEADER_FILL = [255, 255, 255];
const HEADER_TEXT = [0, 0, 0];
const BORDER = [150, 150, 150];
const NAVY = [0, 51, 102];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

export const SHIPMENT_HISTORY_DOCUMENT_TITLE = 'Shipment History Report';
export const SHIPMENT_HISTORY_PDF_FILENAME = 'Shipment History Report.pdf';

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} HistoryCol */

/** @type {HistoryCol[]} */
const COLS = [
  { key: 'shipmentDate', label: 'SHIPMENT\nDATE', weight: 56, align: 'center' },
  { key: 'invoiceNo', label: 'INVOICE NO', weight: 74, align: 'center' },
  { key: 'vendorInvoiceNo', label: 'VENDOR\nINVOICE NO', weight: 78, align: 'center' },
  { key: 'containerNo', label: 'CONTAINER NO', weight: 76, align: 'center' },
  { key: 'shipmentMode', label: 'SHIPMENT\nMODE', weight: 56, align: 'center' },
  { key: 'shippedQty', label: 'SHIPPED\nQTY', weight: 58, align: 'right' },
  { key: 'cartons', label: 'CARTONS', weight: 54, align: 'right' },
  { key: 'expEtdDate', label: 'EXP. ETD DATE', weight: 60, align: 'center' },
];

const SHIPPED_QTY_IDX = COLS.findIndex((c) => c.key === 'shippedQty');
const CARTONS_IDX = COLS.findIndex((c) => c.key === 'cartons');
const CONTAINER_IDX = COLS.findIndex((c) => c.key === 'containerNo');

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy print mock-up.
// ----------------------------------------------------------------------

const RAW_DEMO_ROWS = [
  ['Jan 03, 2026', 'AST-JB 4793', 'MS-136-HMB-2025', '',           'BY AIR', 9767, 136,  'Jan 05, 2026'],
  ['Jan 03, 2026', 'AST-LR 4794', 'MS-136-HMB-2025', 'ONEU0205563', 'BY SEA', 16104, 671, 'Jan 03, 2026'],
  ['Jan 08, 2026', 'AST-JB 4795', 'MS-138-HMB-2025', '',           'BY AIR', 8496, 118,  'Jan 09, 2026'],
  ['Jan 08, 2026', 'AST-LR 4796 / AST-UL 4796', 'CA/623/AM/2024', 'UACU5766300', 'BY SEA', 29304, 730, 'Jan 14, 2026'],
  ['Jan 08, 2026', 'AST-AV 4797 / AST-LR 4796', '',           'UACU5766300', 'BY SEA', 6405, 268,  'Jan 14, 2026'],
  ['Jan 21, 2026', 'AST-LR 4800', 'MS-141-HMB-2026', '',           'BY AIR', 9700, 135,  'Jan 28, 2026'],
  ['Jan 21, 2026', 'AST-LR 4800', 'MS-144-HMB-2026', '',           'BY AIR', 9402, 133,  'Jan 28, 2026'],
  ['Jan 21, 2026', 'AST-AV 4803 / AST-LR 4801', 'MS-144-HMB-2026', 'ONEU0820285', 'BY SEA', 16944, 706, 'Jan 23, 2026'],
  ['Jan 21, 2026', 'AST-LR 4802', 'MS-143-HMB-2026', 'MOTU1403807', 'BY SEA', 5544, 231,  'Jan 16, 2026'],
  ['Jan 21, 2026', 'AST-LR 4802', 'Inv no 5580',     'MOTU1403807', 'BY SEA', 12120, 505, 'Jan 16, 2026'],
  ['Jan 26, 2026', 'AST-LR 4804', 'MS-147-HMB-2026', '',           'BY AIR', 10020, 141, 'Jan 31, 2026'],
  ['Feb 04, 2026', 'AST-JB 4805', 'MS-147-HMB-2026', '',           'BY AIR', 9700, 135,  'Feb 05, 2026'],
  ['Feb 04, 2026', 'AST-LR 4806', 'MS-147-HMB-2026', 'GCXU5506758', 'BY SEA', 16056, 669, 'Feb 05, 2026'],
  ['Feb 17, 2026', 'AST-JB 4807', 'MS-148-HMB-2026', '',           'BY AIR', 10133, 143, 'Feb 18, 2026'],
  ['Feb 18, 2026', 'AST-LR 4808', 'MS-149-HMB-2026', 'ONEU5712529', 'BY SEA', 14928, 622, 'Feb 19, 2026'],
  ['Feb 18, 2026', 'AST-LR 4809', 'AMS/AA/2155/2026','',           'BY AIR', 10033, 139, 'Feb 18, 2026'],
  ['Mar 09, 2026', 'AST-LR 4810', 'CA/630/AM/2026', 'SUDU8951448', 'BY SEA', 10728, 447, 'Mar 10, 2026'],
  ['Mar 16, 2026', 'AST-LR 4811', 'MS-152-HMB-2026', 'SUDU8951448', 'BY SEA', 4128, 82,   'Mar 10, 2026'],
  ['Mar 16, 2026', 'AST-LR 4811', 'MS-152-HMB-2026', 'SUDU8951448', 'BY SEA', 5976, 249,  'Mar 10, 2026'],
  ['Mar 16, 2026', 'AST-AV 4813 / AST-LR 4812', 'MS-150-HMB-2026', 'MSKU0237575', 'BY SEA', 2448, 102, 'Mar 19, 2026'],
  ['Mar 16, 2026', 'AST-AV 4814 / AST-LR 4812', 'CA/633/AM/2026', 'MSKU0237575', 'BY SEA', 40944, 2737, 'Mar 19, 2026'],
  ['Mar 21, 2026', 'AST-LR 4815', 'MS-149-HMB-2026', 'HLBU1887240', 'BY SEA', 18000, 748, 'Mar 23, 2026'],
  ['Apr 07, 2026', 'AST-LR 4818', 'MS-155-HMB-2026', 'MRSU2529632', 'BY SEA', 14328, 597, 'Apr 12, 2026'],
  ['Apr 14, 2026', 'AST-LR 4818', 'MS-155-HMB-2026', 'SEGU4094460', 'BY SEA', 19646, 275, 'Apr 19, 2026'],
  ['Apr 13, 2026', 'AST-UL 4817', 'MS-152-HMB-2026', 'SEGU4094460', 'BY SEA', 79056, 549, 'Apr 19, 2026'],
  ['Apr 13, 2026', 'AST-UL 4817', 'CA-663',          'SEGU4094460', 'BY SEA', 2864, 111,  'Apr 19, 2026'],
  ['Apr 13, 2026', 'AST-UL 4817', 'MAFD-23-26-27',   'SEGU4094460', 'BY SEA', 6000, 250,  'Apr 19, 2026'],
  ['Apr 13, 2026', 'AST-LR 4819', 'AMS/AA/2176/2026','CAAU6465299', 'BY SEA', 50184, 2091, 'Apr 26, 2026'],
  ['Apr 27, 2026', 'AST-LR 4819', 'AMS/AA/2154/2026','CAAU6465299', 'BY SEA', 20580, 285, 'May 14, 2026'],
  ['Apr 27, 2026', 'AST-LR 4819', 'AMS/AA/2154/2026','CAAU7723119', 'BY SEA', 20580, 285, 'May 14, 2026'],
  ['May 09, 2026', 'AST-UL 4820', 'CA-663B',         'CAAU7723119', 'BY SEA', 3120, 130,  'May 14, 2026'],
  ['May 13, 2026', 'AST-UL 4820', 'CA-664',          'CAAU7723119', 'BY SEA', 3120, 130,  'May 14, 2026'],
];

export const SHIPMENT_HISTORY_REPORT_DEMO = {
  fromLabel: 'Jan-01-2026',
  toLabel: 'Dec-31-2026',
  printedOn: '',
  rows: RAW_DEMO_ROWS.map(
    ([shipmentDate, invoiceNo, vendorInvoiceNo, containerNo, shipmentMode, shippedQty, cartons, expEtdDate]) => ({
      shipmentDate,
      invoiceNo,
      vendorInvoiceNo,
      containerNo,
      shipmentMode,
      shippedQty,
      cartons,
      expEtdDate,
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

function formatPrintedOn(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US');
}

/** Distinct (non-empty) Container No count — drives the grand-total cell + Summary. */
function distinctContainerCount(rows) {
  const set = new Set();
  rows.forEach((r) => {
    const v = String(r.containerNo || '').trim();
    if (v) set.add(v);
  });
  return set.size;
}

/** Per-mode breakdown: how many distinct containers belong to each shipment mode. */
function summarizeByMode(rows) {
  const buckets = new Map();
  rows.forEach((r) => {
    const mode = String(r.shipmentMode || '').trim().toUpperCase();
    const container = String(r.containerNo || '').trim();
    if (!mode) return;
    if (!buckets.has(mode)) buckets.set(mode, new Set());
    if (container) buckets.get(mode).add(container);
  });
  const bySea = buckets.has('BY SEA') ? buckets.get('BY SEA').size : 0;
  const byAir = buckets.has('BY AIR') ? buckets.get('BY AIR').size : 0;
  const byCourier = buckets.has('BY COURIER') ? buckets.get('BY COURIER').size : 0;
  return { bySea, byAir, byCourier, total: bySea + byAir + byCourier };
}

function sumNumeric(rows, key) {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
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

  // Logo (top-left)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', innerLeft, V_MARGIN, 110, 34);
    } catch {
      /* ignore */
    }
  }

  // Address (left, under logo) — normal black, no red anywhere.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  const addrY = V_MARGIN + 44;
  doc.text(
    'A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800',
    innerLeft,
    addrY
  );
  doc.text(
    'Karachi - Pakistan.            Telephone # :  02134967216 & 02134946005',
    innerLeft,
    addrY + 10
  );

  // Title — bold, larger, placed BELOW the address block so it never overlaps
  // the address lines (image-2 feedback).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('SHIPMENT HISTORY REPORT', PAGE_W / 2, V_MARGIN + 82, {
    align: 'center',
    baseline: 'alphabetic',
  });

  // From / To — SINGLE line, right-aligned, BLACK bold (was red previously).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `From : ${meta.fromLabel || ''}        To : ${meta.toLabel || ''}`,
    innerRight,
    V_MARGIN + 104,
    { align: 'right' }
  );

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
      fontSize: 7.2,
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
    if (col.key === 'shippedQty') raw = formatInt(row.shippedQty);
    else if (col.key === 'cartons') raw = formatInt(row.cartons);
    else raw = row[col.key];

    if (raw === undefined || raw === null || raw === '') return;
    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      fontSize: 6.6,
      color: [0, 0, 0],
      pad: 2,
      maxLines: 2,
    });
  });
  return y + DATA_ROW_H;
}

/**
 * Grand-total band — distinct container count under "Container No", sum under
 * "Shipped Qty" + "Cartons"; other cells stay blank (bold rendering).
 */
function drawGrandTotalRow(doc, y, x0, widths, totals) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    strokeRect(doc, xs[i], y, widths[i], TOTAL_ROW_H);

    let raw = '';
    if (i === CONTAINER_IDX) raw = formatInt(totals.containerCount);
    else if (i === SHIPPED_QTY_IDX) raw = formatInt(totals.shippedQty);
    else if (i === CARTONS_IDX) raw = formatInt(totals.cartons);

    if (!raw) return;
    textInRect(doc, xs[i], y, widths[i], TOTAL_ROW_H, raw, {
      align: col.align,
      bold: true,
      fontSize: 7.2,
      color: [0, 0, 0],
      pad: 3,
      maxLines: 1,
    });
  });
  return y + TOTAL_ROW_H;
}

// ----------------------------------------------------------------------
// Summary mini-table
// ----------------------------------------------------------------------

const SUMMARY_LABEL_W = 100;
const SUMMARY_VALUE_W = 40;
const SUMMARY_ROW_H = 18;

/** Subtle gray band for the summary block — keeps visual hierarchy without red. */
const SUMMARY_BAND_FILL = [225, 228, 233];

function drawSummaryBlock(doc, y, x0, summary) {
  // Bold underlined "Summary :" label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary :', x0, y);
  const tw = doc.getTextWidth('Summary :');
  doc.setLineWidth(0.6);
  doc.setDrawColor(0, 0, 0);
  doc.line(x0, y + 2, x0 + tw, y + 2);

  let yy = y + 14;
  const totalW = SUMMARY_LABEL_W + SUMMARY_VALUE_W;

  // Header band — gray fill, BLACK bold text.
  fillRect(doc, x0, yy, totalW, SUMMARY_ROW_H, SUMMARY_BAND_FILL);
  strokeRect(doc, x0, yy, totalW, SUMMARY_ROW_H);
  textInRect(doc, x0, yy, totalW, SUMMARY_ROW_H, 'Total no of Container Shipped :', {
    align: 'left',
    bold: true,
    fontSize: 8,
    color: [0, 0, 0],
    pad: 4,
    maxLines: 1,
  });
  yy += SUMMARY_ROW_H;

  /** Render one summary row (label + value cell). All text in plain black. */
  const drawSummaryRow = (label, value, opts = {}) => {
    const { bold = false } = opts;
    strokeRect(doc, x0, yy, SUMMARY_LABEL_W, SUMMARY_ROW_H);
    strokeRect(doc, x0 + SUMMARY_LABEL_W, yy, SUMMARY_VALUE_W, SUMMARY_ROW_H);
    textInRect(doc, x0, yy, SUMMARY_LABEL_W, SUMMARY_ROW_H, label, {
      align: 'left',
      bold,
      fontSize: 8,
      color: [0, 0, 0],
      pad: 4,
      maxLines: 1,
    });
    textInRect(doc, x0 + SUMMARY_LABEL_W, yy, SUMMARY_VALUE_W, SUMMARY_ROW_H, String(value), {
      align: 'center',
      bold,
      fontSize: 8,
      color: [0, 0, 0],
      pad: 2,
      maxLines: 1,
    });
    yy += SUMMARY_ROW_H;
  };

  drawSummaryRow('By Sea', summary.bySea);
  drawSummaryRow('By Air', summary.byAir);
  drawSummaryRow('By Courier', summary.byCourier);
  drawSummaryRow('Total', summary.total, { bold: true });

  return yy;
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
  doc.text(`Printed on :  ${printedOn || formatPrintedOn()}`, H_MARGIN, fy - 2, {
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
 * @param {{ rows?: object[]; fromLabel?: string; toLabel?: string; printedOn?: string }} data
 * @returns {Promise<Blob>}
 */
export async function buildShipmentHistoryReportPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.rows)
      ? {
          fromLabel: data.fromLabel || SHIPMENT_HISTORY_REPORT_DEMO.fromLabel,
          toLabel: data.toLabel || SHIPMENT_HISTORY_REPORT_DEMO.toLabel,
          printedOn: data.printedOn || '',
          rows: data.rows,
        }
      : SHIPMENT_HISTORY_REPORT_DEMO;

  const meta = {
    fromLabel: payload.fromLabel || data.fromLabel || '',
    toLabel: payload.toLabel || data.toLabel || '',
    printedOn: payload.printedOn || data.printedOn || formatPrintedOn(),
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'p' });
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
      doc.addPage([PAGE_W, PAGE_H], 'p');
      startPage();
    }
    y = drawDataRow(doc, y, innerLeft, widths, row);
  });

  /** Grand-total band — make sure it has enough room or push to next page. */
  if (y + TOTAL_ROW_H > pageBodyBottom) {
    doc.addPage([PAGE_W, PAGE_H], 'p');
    startPage();
  }
  const totals = {
    containerCount: distinctContainerCount(payload.rows),
    shippedQty: sumNumeric(payload.rows, 'shippedQty'),
    cartons: sumNumeric(payload.rows, 'cartons'),
  };
  y = drawGrandTotalRow(doc, y, innerLeft, widths, totals);

  /** Summary mini-table — needs ~110pt vertical space. */
  const SUMMARY_NEEDED = 110;
  if (y + SUMMARY_NEEDED > pageBodyBottom) {
    doc.addPage([PAGE_W, PAGE_H], 'p');
    startPage();
    y = drawGrandTotalRow(doc, y, innerLeft, widths, totals);
  }
  y += 24;
  drawSummaryBlock(doc, y, innerLeft, summarizeByMode(payload.rows));

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, meta.printedOn);
  }

  try {
    doc.setProperties({
      title: SHIPMENT_HISTORY_DOCUMENT_TITLE,
      subject: SHIPMENT_HISTORY_DOCUMENT_TITLE,
    });
  } catch (e) {
    /* setProperties unavailable — non-fatal, preview still works */
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openShipmentHistoryReportPdf(mode, pdfBlob) {
  const namedPdf =
    typeof File !== 'undefined'
      ? new File([pdfBlob], SHIPMENT_HISTORY_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedPdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = SHIPMENT_HISTORY_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

/** Resolve "YYYY-MM-DD" → "Jan-01-2026" style for header display. */
export function shipmentHistoryHeaderDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || '');
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso || '');
  const m = d.toLocaleDateString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}-${day}-${d.getFullYear()}`;
}
