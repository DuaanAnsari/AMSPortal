import jsPDF from 'jspdf';

/**
 * Inspection Daily Status Report — portrait A4 PDF.
 *
 * Layout (per legacy print):
 *   - Top-LEFT  : AMS logo.
 *   - Top-CTR   : "Inspecton Daily Status Report" title (bold, 13pt — legacy
 *                 typo kept intact for parity with the existing ERP print).
 *   - Below title (left-aligned, bold) : "From : <date>  To : <date>".
 *   - Table     : 11 cols — Inspection No, Type, PO No., Inspection Date,
 *                 Customer, Supplier, Factory, QA, Style No, Color, Status.
 *                 The Color cell renders the color name in its matching ink
 *                 (e.g. "TANGO RED" in red, "OLIVE GREEN" in green) — copies
 *                 the visual treatment used in the legacy print.
 *   - Footer    : Printed on (left), Powered by … / Developed by … (center),
 *                 Page X of Y (right).
 *
 * Rows are supplied by the Inspection Daily Status Report API via the hub form.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 595;
const PAGE_H = 842;
const V_MARGIN = 22;
const H_MARGIN = 22;

const HEADER_BLOCK_H = 110;
const TABLE_HEADER_H = 30;
const DATA_ROW_H = 30;
const FOOTER_H = 32;

const HEADER_FILL = [255, 255, 255];
const HEADER_TEXT = [0, 0, 0];
const BORDER = [150, 150, 150];
const NAVY = [0, 51, 102];

const PDF_VIEW_ZOOM_HASH = '#zoom=125';

export const INSPECTION_DAILY_STATUS_DOCUMENT_TITLE = 'Inspection Daily Status Report';
export const INSPECTION_DAILY_STATUS_PDF_FILENAME = 'Inspection Daily Status Report.pdf';
export const INSPECTION_DAILY_STATUS_TAB_TITLE = 'Inspection Daily Status Report';

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} InspectionDailyCol */

/** @type {InspectionDailyCol[]} */
const COLS = [
  { key: 'inspectionNo', label: 'Inspection\nNo', weight: 64, align: 'left' },
  { key: 'type', label: 'Type', weight: 26, align: 'left' },
  { key: 'poNo', label: 'PO No.', weight: 54, align: 'left' },
  { key: 'inspectionDate', label: 'Inspection\nDate', weight: 50, align: 'left' },
  { key: 'customer', label: 'Customer', weight: 55, align: 'left' },
  { key: 'supplier', label: 'Supplier', weight: 55, align: 'left' },
  { key: 'factory', label: 'Factory', weight: 55, align: 'left' },
  { key: 'qa', label: 'QA', weight: 65, align: 'left' },
  { key: 'styleNo', label: 'Style No', weight: 38, align: 'left' },
  { key: 'color', label: 'Color', weight: 56, align: 'left' },
  { key: 'status', label: 'Status', weight: 33, align: 'left' },
];

// ----------------------------------------------------------------------
// Color-name lookup — paints the Color cell in legacy ink.
// ----------------------------------------------------------------------

/** Strong, screen-friendly versions of the most common color names. */
const COLOR_NAME_PALETTE = [
  [/\bred\b/i, [200, 30, 30]],
  [/\borange\b/i, [220, 110, 30]],
  [/\bjaffa\b/i, [220, 110, 30]],
  [/\bgreen\b/i, [40, 130, 50]],
  [/\bolive\b/i, [110, 130, 30]],
  [/\bblue\b/i, [40, 60, 170]],
  [/\bnavy\b/i, [30, 40, 90]],
  [/\bturq/i, [30, 130, 130]],
  [/\bteal\b/i, [30, 130, 130]],
  [/\bpeacock\b/i, [30, 100, 130]],
  [/\byellow\b/i, [200, 160, 30]],
  [/\bgold\b/i, [180, 140, 30]],
  [/\bbrown\b/i, [130, 80, 40]],
  [/\btan\b/i, [180, 150, 100]],
  [/\bbeige\b/i, [180, 150, 100]],
  [/\bcream\b/i, [180, 150, 100]],
  [/\bpink\b/i, [220, 100, 150]],
  [/\bfuchsia\b/i, [200, 50, 130]],
  [/\bmagenta\b/i, [200, 50, 130]],
  [/\bpurple\b/i, [120, 50, 160]],
  [/\bviolet\b/i, [120, 50, 160]],
  [/\bgrey\b/i, [110, 110, 110]],
  [/\bgray\b/i, [110, 110, 110]],
  [/\bblack\b/i, [30, 30, 30]],
  [/\bwhite\b/i, [80, 80, 80]],
];

let colorProbeCtx = null;

function getColorProbeCtx() {
  if (typeof document === 'undefined') return null;
  if (!colorProbeCtx) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    colorProbeCtx = canvas.getContext('2d');
  }
  return colorProbeCtx;
}

function cssColorToRgb(name) {
  const ctx = getColorProbeCtx();
  const s = String(name ?? '').trim();
  if (!ctx || !s) return null;

  ctx.fillStyle = '#010101';
  ctx.fillStyle = s;
  const v = ctx.fillStyle;
  if (v === '#010101' && s.toLowerCase() !== '#010101') return null;

  const hex = /^#([0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const rgb = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(v);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

function inkForColorName(name) {
  if (!name) return [0, 0, 0];
  const text = String(name).trim();

  const full = cssColorToRgb(text);
  if (full) return full;

  const words = text.split(/\s+/).filter(Boolean);
  for (let i = words.length - 1; i >= 0; i -= 1) {
    const hit = cssColorToRgb(words[i]);
    if (hit) return hit;
  }

  for (const [re, rgb] of COLOR_NAME_PALETTE) {
    if (re.test(text)) return rgb;
  }
  return [0, 0, 0];
}

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

function formatPrintedOnLong(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Reformats an ISO date (YYYY-MM-DD) → "Mon DD, YYYY" used in the header. */
export function inspectionDailyHeaderDate(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(mo) - 1] || mo} ${d}, ${y}`;
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
    maxLines = 3,
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

  // Logo (top-LEFT)
  if (logoDataUrl) {
    try {
      const logoW = 90;
      const logoH = 30;
      doc.addImage(logoDataUrl, 'PNG', innerLeft, V_MARGIN, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  // Centered title (bold, 13pt) — legacy typo "Inspecton" kept intentionally.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('Inspecton Daily Status Report', PAGE_W / 2, V_MARGIN + 58, {
    align: 'center',
    baseline: 'alphabetic',
  });

  // Left-aligned "From : ...  To : ..." just under the logo block.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `From : ${meta.fromLabel}    To :  ${meta.toLabel}`,
    innerLeft,
    V_MARGIN + 84,
    { align: 'left', baseline: 'alphabetic' }
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
      fontSize: 7,
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

    const raw = row[col.key];
    if (raw === undefined || raw === null || raw === '') return;

    // Color column renders the name in its matching ink.
    const color = col.key === 'color' ? inkForColorName(raw) : [0, 0, 0];

    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      fontSize: 6.6,
      color,
      pad: 2.5,
      maxLines: 3,
    });
  });
  return y + DATA_ROW_H;
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
export async function buildInspectionDailyStatusReportPdfBlob(data = {}) {
  // Empty `rows` is valid — headers/table still render; only omit rows when not provided.
  const rows = Array.isArray(data.rows) ? data.rows : [];

  const meta = {
    printedOn: data.printedOn || formatPrintedOnLong(),
    fromLabel: data.fromLabel || '',
    toLabel: data.toLabel || '',
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

  rows.forEach((row) => {
    if (y + DATA_ROW_H > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'p');
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
      title: INSPECTION_DAILY_STATUS_DOCUMENT_TITLE,
      subject: INSPECTION_DAILY_STATUS_DOCUMENT_TITLE,
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
export function openInspectionDailyStatusReportPdf(mode, pdfBlob) {
  const namedFile =
    typeof File !== 'undefined'
      ? new File([pdfBlob], INSPECTION_DAILY_STATUS_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedFile);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = INSPECTION_DAILY_STATUS_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
