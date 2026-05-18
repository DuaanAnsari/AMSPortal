import jsPDF from 'jspdf';

/**
 * "Production History" — portrait PDF matching the legacy AMS print mock-up.
 *
 *   - Header : logo top-left; "Production History" top-right (bold navy,
 *     underlined); address + new telephone (02134937216 & 02134946005).
 *   - Meta grid : PONO # / Customer / Supplier (left) — STYLE # / PO Qty /
 *     Shipment Date (B) (right).
 *   - Yellow status bar : "Last Update of Production : …"
 *   - Table : Activity Date | Process | Remarks — #CCCCCC header, #FFFF00
 *     status bar, full-width black grid; all cell/header text left-aligned
 *     with padding (narrow | medium | widest columns).
 *   - Footer : Printed on (left); Powered by / Developed by (center);
 *     Page n of m (right).
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 595;
const PAGE_H = 842;
const H_MARGIN = 36;
const V_MARGIN_TOP = 22;
const V_MARGIN_BOTTOM = 42;

const LOGO_W = 82;
const LOGO_H = 42;

const NAVY = [20, 45, 110];
const BLACK = [0, 0, 0];
const TABLE_BORDER = [0, 0, 0];
/** Table header — legacy grey #CCCCCC */
const HEADER_FILL = [204, 204, 204];
/** Status bar — legacy bright yellow #FFFF00 */
const YELLOW_BAR = [255, 255, 0];

const PDF_VIEW_ZOOM_HASH = '#zoom=100';

const DEMO_ROWS = [
  { activityDate: 'Mar 30, 2017', process: 'DOCUMENTS RECEIVED', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'VESSEL ARRIVAL AT DESTINATION', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'SHIPMENT SAMPLE', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'PACKING', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'STITCHING', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'CUTTING', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'KNITTING', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'YARN ARRIVAL', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'GREIGE FABRIC', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'DYING', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'FINISHING', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'FABRIC INSPECTION', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'PCS INSPECTION', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'FINAL INSPECTION', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'SHIPMENT DISPATCH', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'ETD CONFIRMATION', remarks: '' },
  { activityDate: 'Mar 30, 2017', process: 'ORDER CONFIRMATION', remarks: '' },
];

/** Relative column widths: date (narrow) — process — remarks (widest). */
const COL_WEIGHTS = { activityDate: 88, process: 168, remarks: 220 };

async function loadLogoDataUrl() {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) throw new Error(`logo ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatPrintedOnLong(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function setBorder(doc, lineW = 0.35) {
  doc.setDrawColor(TABLE_BORDER[0], TABLE_BORDER[1], TABLE_BORDER[2]);
  doc.setLineWidth(lineW);
}

function colWidths(tableW) {
  const sum = COL_WEIGHTS.activityDate + COL_WEIGHTS.process + COL_WEIGHTS.remarks;
  const w1 = (COL_WEIGHTS.activityDate / sum) * tableW;
  const w2 = (COL_WEIGHTS.process / sum) * tableW;
  const w3 = tableW - w1 - w2;
  return [w1, w2, w3];
}

function colXs(x0, widths) {
  return [x0, x0 + widths[0], x0 + widths[0] + widths[1]];
}

function drawPage1Header(doc, logoDataUrl) {
  const x = H_MARGIN;
  const y = V_MARGIN_TOP;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', x, y, LOGO_W, LOGO_H, undefined, 'FAST');
    } catch {
      /* skip */
    }
  }

  const titleText = 'Production History';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  const titleX = PAGE_W - H_MARGIN;
  const titleY = y + LOGO_H * 0.35;
  doc.text(titleText, titleX, titleY, { align: 'right', baseline: 'middle' });
  const tw = doc.getTextWidth(titleText);
  const lineY = titleY + 7;
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(0.6);
  doc.line(titleX - tw, lineY, titleX, lineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const ay = y + LOGO_H + 6;
  doc.text(
    'A M S House 84, Kokan Housing Society Alamgir Road - Postal Code: 74800 Karachi - Pakistan.',
    x,
    ay,
    { baseline: 'top', maxWidth: PAGE_W - 2 * H_MARGIN - 4 }
  );
  doc.text('Telephone # : 02134937216 & 02134946005', x, ay + 12, { baseline: 'top' });

  return ay + 28;
}

function drawMetaGrid(doc, y, x0, tableW, meta) {
  const half = tableW / 2;
  const rowH = 16;
  const rows = 3;
  const gridH = rows * rowH;

  setBorder(doc, 0.35);
  doc.rect(x0, y, tableW, gridH);

  doc.line(x0 + half, y, x0 + half, y + gridH);

  const leftPairs = [
    ['PONO #:', meta.poNo || ''],
    ['Customer :', meta.customer || ''],
    ['Supplier :', meta.supplier || ''],
  ];
  const rightPairs = [
    ['STYLE #:', meta.styleNo || ''],
    ['PO Qty :', meta.poQty || ''],
    ['Shipment Date (B) :', meta.shipmentDate || ''],
  ];

  const drawCell = (bx, by, bw, label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(label, bx + 4, by + rowH / 2, { baseline: 'middle' });
    const lw = doc.getTextWidth(label);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), bx + 4 + lw + 3, by + rowH / 2, { baseline: 'middle' });
  };

  for (let i = 0; i < 3; i += 1) {
    const rowY = y + i * rowH;
    if (i > 0) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);
      doc.line(x0, rowY, x0 + tableW, rowY);
    }
    drawCell(x0, rowY, half, leftPairs[i][0], leftPairs[i][1]);
    drawCell(x0 + half, rowY, half, rightPairs[i][0], rightPairs[i][1]);
  }

  return y + gridH + 10;
}

function drawYellowBar(doc, y, x0, tableW, text) {
  const h = 20;
  doc.setFillColor(YELLOW_BAR[0], YELLOW_BAR[1], YELLOW_BAR[2]);
  doc.rect(x0, y, tableW, h, 'F');
  setBorder(doc, 0.4);
  doc.rect(x0, y, tableW, h);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(text || 'Last Update of Production : N/A', x0 + 6, y + h / 2, {
    baseline: 'middle',
  });
  return y + h + 8;
}

const CELL_PAD = 5;

/** Left-aligned, vertically centred block (matches legacy print). */
function drawCellTextLeft(doc, x, y, w, h, text, opts = {}) {
  const { fontSize = 8, bold = false, uppercase = false } = opts;
  if (text == null || text === '') return;
  const display = uppercase ? String(text).toUpperCase() : String(text);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(0, 0, 0);
  const innerW = Math.max(8, w - CELL_PAD * 2);
  const lines = doc.splitTextToSize(display, innerW);
  const lh = fontSize * 1.18;
  const block = lines.length * lh;
  let cy = y + (h - block) / 2 + lh / 2;
  lines.forEach((ln) => {
    doc.text(ln, x + CELL_PAD, cy, { align: 'left', baseline: 'middle', maxWidth: innerW });
    cy += lh;
  });
}

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  const labels = ['Activity Date', 'Process', 'Remarks'];
  const h = 22;
  for (let i = 0; i < 3; i += 1) {
    doc.setFillColor(HEADER_FILL[0], HEADER_FILL[1], HEADER_FILL[2]);
    doc.rect(xs[i], y, widths[i], h, 'F');
    setBorder(doc, 0.35);
    doc.rect(xs[i], y, widths[i], h);
    drawCellTextLeft(doc, xs[i], y, widths[i], h, labels[i], { fontSize: 8.5, bold: true });
  }
  return y + h;
}

function measureDataRowHeight(doc, widths, row) {
  const lh = 8 * 1.18;
  const cells = [
    { text: row.activityDate, upper: false },
    { text: row.process, upper: true },
    { text: row.remarks, upper: false },
  ];
  let maxLines = 1;
  cells.forEach((cell, i) => {
    const raw = cell.text;
    if (raw == null || raw === '') return;
    const display = cell.upper ? String(raw).toUpperCase() : String(raw);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const innerW = Math.max(8, widths[i] - CELL_PAD * 2);
    const lines = doc.splitTextToSize(display, innerW);
    if (lines.length > maxLines) maxLines = lines.length;
  });
  const h = Math.max(18, maxLines * lh + 6);
  return h;
}

function drawDataRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  const h = measureDataRowHeight(doc, widths, row);
  for (let i = 0; i < 3; i += 1) {
    setBorder(doc, 0.35);
    doc.rect(xs[i], y, widths[i], h);
  }
  drawCellTextLeft(doc, xs[0], y, widths[0], h, row.activityDate, { fontSize: 8, bold: false });
  drawCellTextLeft(doc, xs[1], y, widths[1], h, row.process, { fontSize: 8, bold: false, uppercase: true });
  drawCellTextLeft(doc, xs[2], y, widths[2], h, row.remarks, { fontSize: 8, bold: false });
  return y + h;
}

function drawFooter(doc, pageIdx, totalPages, printedOn) {
  const cx = PAGE_W / 2;
  const yPowered = PAGE_H - V_MARGIN_BOTTOM + 2;
  const yDev = PAGE_H - V_MARGIN_BOTTOM + 12;
  const yBottom = PAGE_H - V_MARGIN_BOTTOM + 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Powered by : INTEGRA ERP SYSTEM', cx, yPowered, { align: 'center', baseline: 'bottom' });

  doc.setFontSize(7);
  doc.text(
    'Developed by: ITG (Pvt) Ltd. - Website: www.itg.net.pk',
    cx,
    yDev,
    { align: 'center', baseline: 'bottom' }
  );

  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Printed on: ${printedOn || formatPrintedOnLong()}`, H_MARGIN, yBottom, {
    baseline: 'bottom',
  });
  doc.text(`Page ${pageIdx} of ${totalPages}`, PAGE_W - H_MARGIN, yBottom, {
    align: 'right',
    baseline: 'bottom',
  });
  doc.setTextColor(0, 0, 0);
}

/**
 * @param {{
 *   poNo?: string;
 *   customer?: string;
 *   supplier?: string;
 *   styleNo?: string;
 *   poQty?: string;
 *   shipmentDate?: string;
 *   lastUpdateText?: string;
 *   rows?: Array<{ activityDate: string; process: string; remarks?: string }>;
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildProductionHistoryPdfBlob(data = {}) {
  const meta = {
    poNo: data.poNo ?? '',
    customer: data.customer ?? 'LONE ROCK',
    supplier: data.supplier ?? 'STARTEX INDUSTRIES',
    styleNo: data.styleNo ?? 'LR3003',
    poQty: data.poQty ?? '11,664',
    shipmentDate: data.shipmentDate ?? 'Jun 26, 2017',
  };
  const lastUpdateText = data.lastUpdateText ?? 'Last Update of Production : N/A';
  const rows = Array.isArray(data.rows) && data.rows.length > 0 ? data.rows : DEMO_ROWS;
  const printedOn = data.printedOn || formatPrintedOnLong();

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'p' });
  const logoDataUrl = await loadLogoDataUrl();

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(tableW);
  const bodyBottom = PAGE_H - V_MARGIN_BOTTOM - 4;

  let y = drawPage1Header(doc, logoDataUrl);
  y = drawMetaGrid(doc, y, tableX, tableW, meta);
  y = drawYellowBar(doc, y, tableX, tableW, lastUpdateText);

  const drawHeaderBand = (yy) => drawTableHeader(doc, yy, tableX, widths);

  y = drawHeaderBand(y);

  rows.forEach((row) => {
    const rh = measureDataRowHeight(doc, widths, row);
    if (y + rh > bodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'p');
      y = V_MARGIN_TOP + 8;
      y = drawHeaderBand(y);
    }
    y = drawDataRow(doc, y, tableX, widths, row);
  });

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, printedOn);
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openProductionHistoryPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Production-History.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
