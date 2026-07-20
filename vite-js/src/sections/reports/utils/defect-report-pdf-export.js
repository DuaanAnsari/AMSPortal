import jsPDF from 'jspdf';

/**
 * Defect Report — portrait A4 PDF.
 *
 * Layout (per legacy print):
 *   - Header (3 stacked rows, centered-left of the page):
 *     * "DEFECT REPORT" (bold, 16pt, underlined).
 *     * "SUPPLIER : <name>" (bold, 12pt).
 *     * "FROM : <date>  TO : <date>" (bold, 10.5pt).
 *   - Top-RIGHT : AMS logo + Print Date / Time on a single line below it.
 *   - Summary band : a 3 × 2 grid (label / value cells) showing PO + Inspection
 *     totals and the on-time / delay split.
 *   - Table : 5 cols — S.NO., DEFECT, CRITICAL, MAJOR, MINOR. Numeric values
 *     render in legacy "link blue" ink (matches the existing print).
 *   - Footer : Printed on (left), Powered by … / Developed by … (center),
 *     Page X of Y (right).
 *
 * Rows are supplied by the Defect Report API via the inspection hub form.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 595;
const PAGE_H = 842;
const V_MARGIN = 22;
const H_MARGIN = 22;

const HEADER_BLOCK_H = 100;
const SUMMARY_CELL_H = 22;
const SUMMARY_ROWS = 3;
const SUMMARY_BAND_H = SUMMARY_CELL_H * SUMMARY_ROWS;
const TABLE_HEADER_H = 22;
const DATA_ROW_H = 18;
const FOOTER_H = 32;

const HEADER_FILL = [255, 255, 255];
const HEADER_TEXT = [0, 0, 0];
const BORDER = [150, 150, 150];
const NAVY = [0, 51, 102];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

export const DEFECT_REPORT_DOCUMENT_TITLE = 'Defect Report';
export const DEFECT_REPORT_PDF_FILENAME = 'Defect Report.pdf';
export const DEFECT_REPORT_TAB_TITLE = 'Defect Report';

const EMPTY_DEFECT_REPORT_TOTALS = {
  totalPos: 0,
  totalPoQty: 0,
  totalInspections: 0,
  totalInspectionQty: 0,
  totalOnTimeShipped: 0,
  totalDelayShipped: 0,
};

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} DefectCol */

/** @type {DefectCol[]} */
const COLS = [
  { key: 'sno', label: 'S.NO.', weight: 32, align: 'center' },
  { key: 'defect', label: 'DEFECT', weight: 296, align: 'left' },
  { key: 'critical', label: 'CRITICAL', weight: 74, align: 'center' },
  { key: 'major', label: 'MAJOR', weight: 74, align: 'center' },
  { key: 'minor', label: 'MINOR', weight: 74, align: 'center' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy print mock-up (page 1).
// ----------------------------------------------------------------------

const RAW_DEMO_ROWS = [
  ['broken stitch', 0, 1, 0],
  ['Barrie', 0, 1, 0],
  ['Body to pocket shade variation', 0, 3, 0],
  ['Broke stitchh', 0, 1, 0],
  ['Broken stiches', 0, 45, 1],
  ['Broken stitch', 0, 211, 0],
  ['Bubble at zipp top', 0, 1, 0],
  ['Bundle sticker un remove', 0, 0, 1],
  ['Burn stitch', 0, 1, 0],
  ['Center out htl', 0, 4, 0],
  ['Center out label', 0, 7, 0],
  ['Center out label attached', 0, 1, 0],
  ['Center out print', 0, 3, 0],
  ['Centre out htl', 0, 1, 0],
  ['Centre out print', 0, 7, 0],
  ['Chake mark', 0, 6, 11],
  ['Chalk mark', 0, 0, 1],
  ['Chock mark', 0, 0, 4],
  ['Cliper cut', 0, 1, 0],
  ['Clipercut', 0, 1, 0],
  ['Clipper cut', 0, 20, 0],
  ['Clipper cut at pocket', 0, 1, 0],
  ['Clipper cutt', 0, 2, 0],
  ['Color mark', 0, 6, 0],
  ['Color spot', 0, 5, 0],
  ['Color stain', 0, 42, 12],
  ['Compaction mark', 0, 0, 1],
  ['Compaction mark at front panel', 0, 1, 0],
  ['Compaction mark at sleeve front panel', 0, 1, 0],
  ['Compection mark', 0, 2, 1],
  ['Compaction mark at back panel', 0, 2, 5],
  ['Compaction mark at front panel', 0, 1, 0],
  ['Compaction mark at front sleeve', 0, 1, 0],
  ['Compaction mark at sleeve', 0, 0, 1],
  ['Contrast thread', 0, 1, 0],
  ['Cracking', 0, 1, 0],
  ['Crease mark', 0, 3, 0],
  ['Crecking mark', 0, 1, 0],
];

export const DEFECT_REPORT_DEMO = {
  supplierLabel: 'All Supplier',
  fromLabel: 'Jan 01, 2026',
  toLabel: 'Dec 31, 2026',
  totals: {
    totalPos: 172,
    totalPoQty: 371867,
    totalInspections: 442,
    totalInspectionQty: 587628,
    totalOnTimeShipped: 0,
    totalDelayShipped: 172,
  },
  rows: RAW_DEMO_ROWS.map(([defect, critical, major, minor], i) => ({
    sno: i + 1,
    defect,
    critical,
    major,
    minor,
  })),
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

/** Reformats an ISO date (YYYY-MM-DD) → "Mon DD, YYYY" used in the header. */
export function defectReportHeaderDate(iso) {
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

  // Logo (top-RIGHT)
  if (logoDataUrl) {
    try {
      const logoW = 95;
      const logoH = 30;
      doc.addImage(logoDataUrl, 'PNG', innerRight - logoW, V_MARGIN, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  // "Print Date :  DD-MMM-YYYY  h:mm am/pm" on a single line under the logo.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const printLine = `Print Date:  ${meta.printDate}     ${meta.printTime}`;
  doc.text(printLine, innerRight, V_MARGIN + 58, { align: 'right' });

  // Title (bold 16pt) — left-of-center, sitting roughly under the page's
  // first third (mirrors the legacy mock-up). Underlining drawn manually so
  // it spans only the title width.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  const titleX = innerLeft + 130;
  const titleY = V_MARGIN + 18;
  const titleText = 'DEFECT REPORT';
  doc.text(titleText, titleX, titleY, { align: 'left', baseline: 'alphabetic' });
  const titleWidth = doc.getTextWidth(titleText);
  doc.setLineWidth(0.6);
  doc.setDrawColor(0, 0, 0);
  doc.line(titleX, titleY + 2, titleX + titleWidth, titleY + 2);

  // Supplier line (centered between left margin and the logo block).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`SUPPLIER : ${meta.supplierLabel}`, titleX + titleWidth / 2, titleY + 18, {
    align: 'center',
    baseline: 'alphabetic',
  });

  // From/To line.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `FROM : ${meta.fromLabel}  TO : ${meta.toLabel}`,
    titleX + titleWidth / 2,
    titleY + 36,
    { align: 'center', baseline: 'alphabetic' }
  );

  doc.setTextColor(0, 0, 0);
  return V_MARGIN + HEADER_BLOCK_H;
}

// ----------------------------------------------------------------------
// Summary band — 3 rows × 2 cells (label / value) each.
// ----------------------------------------------------------------------

function drawSummaryBand(doc, y, x0, innerW, totals) {
  const halfW = innerW / 2;
  const labelW = halfW * 0.6;
  const valueW = halfW - labelW;

  const cells = [
    ['Total No. Of POs', formatInt(totals.totalPos)],
    ['Total PO Quantity', formatInt(totals.totalPoQty)],
    ['Total No. Of Inspection.', formatInt(totals.totalInspections)],
    ['Total Inspection Quantity', formatInt(totals.totalInspectionQty)],
    ['Total No. Of On Time Shipped.', formatInt(totals.totalOnTimeShipped)],
    ['Total No. Of Delay Shipped.', formatInt(totals.totalDelayShipped)],
  ];

  let cursorY = y;
  for (let r = 0; r < SUMMARY_ROWS; r += 1) {
    for (let c = 0; c < 2; c += 1) {
      const leftX = x0 + c * halfW;
      const valueX = leftX + labelW;
      const [label, value] = cells[r * 2 + c];

      strokeRect(doc, leftX, cursorY, labelW, SUMMARY_CELL_H);
      textInRect(doc, leftX, cursorY, labelW, SUMMARY_CELL_H, label, {
        align: 'left',
        bold: true,
        fontSize: 8.5,
        color: [0, 0, 0],
        pad: 6,
        maxLines: 1,
      });

      strokeRect(doc, valueX, cursorY, valueW, SUMMARY_CELL_H);
      textInRect(doc, valueX, cursorY, valueW, SUMMARY_CELL_H, value, {
        align: 'right',
        bold: true,
        fontSize: 9,
        color: [0, 0, 0],
        pad: 8,
        maxLines: 1,
      });
    }
    cursorY += SUMMARY_CELL_H;
  }

  return cursorY;
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
      fontSize: 9,
      color: HEADER_TEXT,
      pad: 3,
      maxLines: 1,
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
      case 'sno':
        raw = `${row.sno}`;
        break;
      case 'critical':
        raw = formatInt(row.critical);
        break;
      case 'major':
        raw = formatInt(row.major);
        break;
      case 'minor':
        raw = formatInt(row.minor);
        break;
      default:
        raw = row[col.key];
    }

    if (raw === undefined || raw === null || raw === '') return;

    const isCountColumn = col.key === 'critical' || col.key === 'major' || col.key === 'minor';

    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      bold: isCountColumn,
      fontSize: 8,
      color: [0, 0, 0],
      pad: 4,
      maxLines: 1,
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
 *   supplierLabel?: string;
 *   fromLabel?: string;
 *   toLabel?: string;
 *   totals?: {
 *     totalPos?: number;
 *     totalPoQty?: number;
 *     totalInspections?: number;
 *     totalInspectionQty?: number;
 *     totalOnTimeShipped?: number;
 *     totalDelayShipped?: number;
 *   };
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildDefectReportPdfBlob(data = {}) {
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const totals = {
    ...EMPTY_DEFECT_REPORT_TOTALS,
    ...(data.totals || {}),
  };

  const now = new Date();
  const meta = {
    printedOn: data.printedOn || formatPrintedOnLong(now),
    printDate: formatPrintDate(now),
    printTime: formatPrintTime(now),
    supplierLabel: data.supplierLabel || 'All Supplier',
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
  let firstPage = true;

  /** Restart the table on a fresh page. The summary band only appears on the first page. */
  const startPage = () => {
    y = drawPageHeader(doc, logoDataUrl, meta);
    if (firstPage) {
      y = drawSummaryBand(doc, y, innerLeft, innerW, totals);
      firstPage = false;
    }
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
      title: DEFECT_REPORT_DOCUMENT_TITLE,
      subject: DEFECT_REPORT_DOCUMENT_TITLE,
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
export function openDefectReportPdf(mode, pdfBlob) {
  const namedFile =
    typeof File !== 'undefined'
      ? new File([pdfBlob], DEFECT_REPORT_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedFile);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = DEFECT_REPORT_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

// Silence unused vars when band height isn't needed by callers.
void SUMMARY_BAND_H;
