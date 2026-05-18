import jsPDF from 'jspdf';

/**
 * "DPG REPORT" — landscape PDF matching the legacy print mock-up.
 *
 *   - Page 1 : AMS logo + address + new telephone (02134937216 &
 *     02134946005), centered title "DPG REPORT", top-right date strip
 *     "From : … To : …".
 *
 *   - Table : 22 columns, thin black borders, header text centered.
 *     Legacy typo "FACOTRY" preserved. "$ FOB COST" header is stacked
 *     vertically. First body row shows "%" only in C %, DUTY %, and GP %
 *     columns; remaining rows are blank placeholders until API wiring.
 *
 *   - Continuation pages : header row repeats; logo/address only on page 1.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 1260;
const PAGE_H = 640;
const H_MARGIN = 14;
const V_MARGIN_TOP = 16;
const V_MARGIN_BOTTOM = 24;

const LOGO_W = 88;
const LOGO_H = 46;

const CONT_HEADER_Y = V_MARGIN_TOP + 6;

const TABLE_HEADER_H = 34;
const DATA_ROW_H = 22;
const EMPTY_BODY_ROWS = 14;

const TABLE_BORDER = [0, 0, 0];
const BLACK = [0, 0, 0];

const PDF_VIEW_ZOOM_HASH = '#zoom=100';

/** @type {{ key: string; label: string; weight: number; headerLines?: string[] }[]} */
const COLS = [
  { key: 'factory', label: 'FACOTRY', weight: 52 },
  { key: 'poNo', label: 'PO#', weight: 44 },
  { key: 'styling', label: 'STYLING', weight: 44 },
  { key: 'content', label: 'CONTENT', weight: 44 },
  { key: 'styNo', label: 'STY#', weight: 38 },
  { key: 'descGoods', label: 'DESCRIPTION OF GOODS', weight: 118 },
  { key: 'gsm', label: 'GSM', weight: 28 },
  { key: 'sizes', label: 'SIZES', weight: 36 },
  { key: 'ordQty', label: 'ORD/QTY', weight: 46 },
  { key: 'dlvr', label: 'DLVRY', weight: 38 },
  { key: 'fobCost', label: '$ FOB COST', weight: 34, headerLines: ['$', 'FOB', 'COST'] },
  { key: 'comPct', label: 'Com %', weight: 34 },
  { key: 'cPct', label: 'C %', weight: 28 },
  { key: 'frt', label: '$ FRT', weight: 32 },
  { key: 'duty', label: 'DUTY', weight: 32 },
  { key: 'dutyPct', label: 'DUTY %', weight: 34 },
  { key: 'totalCost', label: 'TOTAL COST', weight: 48 },
  { key: 'ldp', label: 'LDP', weight: 34 },
  { key: 'tLdp', label: 'T.LDP', weight: 38 },
  { key: 'gp', label: 'GP', weight: 32 },
  { key: 'tGp', label: 'T.GP', weight: 38 },
  { key: 'gpPct', label: 'GP %', weight: 32 },
];

function tableColWidths(tableW) {
  const sum = COLS.reduce((a, c) => a + c.weight, 0);
  const out = COLS.map((c) => (c.weight / sum) * tableW);
  const drift = tableW - out.reduce((a, b) => a + b, 0);
  out[out.length - 1] += drift;
  return out;
}

function colXs(x0, widths) {
  const xs = [x0];
  for (let i = 0; i < widths.length; i += 1) xs.push(xs[i] + widths[i]);
  return xs;
}

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

function setBorder(doc, rgb = TABLE_BORDER, lineW = 0.35) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(lineW);
}

function strokeRect(doc, x, y, w, h) {
  setBorder(doc, TABLE_BORDER, 0.35);
  doc.rect(x, y, w, h);
}

function drawTextCell(doc, x, y, w, h, text, opts = {}) {
  const { fontSize = 6.5, bold = false, color = BLACK, align = 'center' } = opts;
  if (text == null || text === '') return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  const pad = 2;
  let tx;
  if (align === 'left') tx = x + pad;
  else if (align === 'right') tx = x + w - pad;
  else tx = x + w / 2;
  doc.text(String(text), tx, y + h / 2, {
    align,
    baseline: 'middle',
    maxWidth: w - pad * 2,
  });
  doc.setTextColor(0, 0, 0);
}

function drawHeaderCell(doc, x, y, w, h, col) {
  strokeRect(doc, x, y, w, h);
  if (col.headerLines && col.headerLines.length > 0) {
    const lh = 7.2;
    const block = col.headerLines.length * lh;
    let cy = y + (h - block) / 2 + lh / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(0, 0, 0);
    col.headerLines.forEach((ln) => {
      doc.text(ln, x + w / 2, cy, { align: 'center', baseline: 'middle' });
      cy += lh;
    });
    doc.setTextColor(0, 0, 0);
    return;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(0, 0, 0);
  const lines = doc.splitTextToSize(col.label, Math.max(4, w - 4));
  const lh = 6.8;
  const block = lines.length * lh;
  let cy = y + (h - block) / 2 + lh / 2;
  lines.forEach((ln) => {
    doc.text(ln, x + w / 2, cy, { align: 'center', baseline: 'middle' });
    cy += lh;
  });
  doc.setTextColor(0, 0, 0);
}

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    drawHeaderCell(doc, xs[i], y, widths[i], TABLE_HEADER_H, col);
  });
  return y + TABLE_HEADER_H;
}

function drawDataRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    strokeRect(doc, xs[i], y, widths[i], DATA_ROW_H);
    const v = row[col.key];
    if (v != null && v !== '') {
      drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, v, {
        fontSize: 6.8,
        bold: false,
        align: 'center',
      });
    }
  });
  return y + DATA_ROW_H;
}

function drawPage1Header(doc, logoDataUrl, fromStr, toStr) {
  const x = H_MARGIN;
  const y = V_MARGIN_TOP;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', x, y, LOGO_W, LOGO_H, undefined, 'FAST');
    } catch {
      /* skip */
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(0, 0, 0);
  const ay = y + LOGO_H + 5;
  doc.text(
    'A M S House 84, Kokan Housing Society Alamgir Road - Postal Code: 74800',
    x,
    ay,
    { baseline: 'top' }
  );
  doc.text('Karachi - Pakistan.', x, ay + 10, { baseline: 'top' });
  doc.text(
    'Telephone # : 02134937216 & 02134946005',
    x,
    ay + 20,
    { baseline: 'top' }
  );

  const titleBandY = ay + 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DPG REPORT', PAGE_W / 2, titleBandY, { align: 'center', baseline: 'middle' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const dateLine = `From : ${fromStr}    To : ${toStr}`;
  doc.text(dateLine, PAGE_W - H_MARGIN, titleBandY, { align: 'right', baseline: 'middle' });

  return titleBandY + 18;
}

function drawFooter(doc, pageIdx, totalPages, printedOn) {
  const fy = PAGE_H - V_MARGIN_BOTTOM + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(110, 110, 110);
  doc.text(`Printed on : ${printedOn || formatPrintedOnLong()}`, H_MARGIN, fy, {
    baseline: 'bottom',
  });
  doc.text(`Page ${pageIdx} of ${totalPages}`, PAGE_W - H_MARGIN, fy, {
    align: 'right',
    baseline: 'bottom',
  });
  doc.setTextColor(0, 0, 0);
}

function emptyRow() {
  const r = {};
  COLS.forEach((c) => {
    r[c.key] = '';
  });
  return r;
}

function firstPercentRow() {
  const r = emptyRow();
  r.cPct = '%';
  r.dutyPct = '%';
  r.gpPct = '%';
  return r;
}

/**
 * @param {{ fromDate?: string; toDate?: string; printedOn?: string; rows?: object[] }} data
 * @returns {Promise<Blob>}
 */
export async function buildDpgReportPdfBlob(data = {}) {
  const fromStr =
    data.fromDate ||
    new Date('2026-01-01').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const toStr =
    data.toDate ||
    new Date('2026-12-31').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const printedOn = data.printedOn || formatPrintedOnLong();

  const bodyRows =
    Array.isArray(data.rows) && data.rows.length > 0
      ? data.rows
      : [firstPercentRow(), ...Array.from({ length: EMPTY_BODY_ROWS }, () => emptyRow())];

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl();

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = tableColWidths(tableW);
  const pageBodyBottom = PAGE_H - V_MARGIN_BOTTOM - 16;

  let y = drawPage1Header(doc, logoDataUrl, fromStr, toStr);
  y = drawTableHeader(doc, y, tableX, widths);

  bodyRows.forEach((row) => {
    if (y + DATA_ROW_H > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'l');
      y = drawTableHeader(doc, CONT_HEADER_Y, tableX, widths);
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
export function openDpgReportPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'DPG-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
