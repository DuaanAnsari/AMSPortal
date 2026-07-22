import jsPDF from 'jspdf';

/**
 * Comparison Defect Report — landscape A4 PDF.
 *
 * Layout (per legacy print):
 *   - Top-LEFT  : AMS logo + Print Date / Time + "COMPARISON DEFECT REPORT".
 *   - Top-RIGHT : two side-by-side scope panels (Supplier/Year/Customer/Style/PO# +
 *                 6-row summary list) for comparison Set A and Set B.
 *   - Table     : S.NO., DEFECT, CRITICAL, MAJOR, MINOR (×2 sets).
 *   - Footer row: TOTAL spanning S.NO.+DEFECT.
 *   - Page footer: Printed on (left), Powered by … (center), Page X of Y (right).
 *
 * Demo data is hardcoded; backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 842;
const PAGE_H = 595;
const V_MARGIN = 18;
const H_MARGIN = 18;

const SCOPE_META_H = 108;
const SCOPE_SUMMARY_H = 106;
const SCOPE_PANEL_H = SCOPE_META_H + SCOPE_SUMMARY_H;

// Header positions transcribed from legacy Comparison Defect Report PDF (792×612 → A4 landscape).
const HEADER_PRINT_X = 111;
const HEADER_PRINT_Y = 134;
const HEADER_TITLE_X = 86;
const HEADER_TITLE_Y = 194;
const HEADER_TABLE_Y = 265;
const TABLE_HEADER_H = 20;
const DATA_ROW_H = 16;
const TOTAL_ROW_H = 18;
const FOOTER_H = 28;

const HEADER_FILL = [255, 255, 255];
const HEADER_TEXT = [0, 0, 0];
const BORDER = [0, 0, 0];
const NAVY = [0, 51, 102];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

export const DEFECT_COMPARISON_DOCUMENT_TITLE = 'Comparison Defect Report';
export const DEFECT_COMPARISON_PDF_FILENAME = 'Comparison Defect Report.pdf';
export const DEFECT_COMPARISON_TAB_TITLE = 'Comparison Defect Report';

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} ComparisonCol */

/** @type {ComparisonCol[]} */
const COLS = [
  { key: 'sno', label: 'S.NO.', weight: 30, align: 'center' },
  { key: 'defect', label: 'DEFECT', weight: 210, align: 'left' },
  { key: 'criticalA', label: 'CRITICAL', weight: 58, align: 'center' },
  { key: 'majorA', label: 'MAJOR', weight: 58, align: 'center' },
  { key: 'minorA', label: 'MINOR', weight: 58, align: 'center' },
  { key: 'criticalB', label: 'CRITICAL', weight: 58, align: 'center' },
  { key: 'majorB', label: 'MAJOR', weight: 58, align: 'center' },
  { key: 'minorB', label: 'MINOR', weight: 58, align: 'center' },
];

const DEMO_SCOPE = {
  supplierLabel: 'All Supplier',
  yearLabel: '2026',
  customerLabel: 'All Customer',
  styleLabel: 'All Styles',
  poLabel: 'All PO',
  totals: {
    totalPos: 162,
    totalPoQty: 341381,
    totalInspections: 401,
    totalInspectionQty: 560916,
    totalOnTimeShipped: 0,
    totalDelayShipped: 162,
  },
};

/** @type {[number, string, number, number, number, number, number, number][]} */
const RAW_DEMO_ROWS = [
  [1, 'HOLE', 0, 0, 2, 0, 0, 0],
  [2, 'OFF CENTER LABLE', 0, 0, 1, 0, 0, 0],
  [3, 'ALTER DROW CORD', 0, 0, 1, 0, 0, 0],
  [4, 'ARMHOLE CENNTRE OFF', 0, 0, 1, 0, 0, 0],
  [5, 'ARMHOLE CENTRE OUT', 0, 0, 1, 0, 0, 0],
  [6, 'broken stitch', 0, 1, 0, 0, 0, 0],
  [7, 'Barrie', 0, 1, 0, 0, 0, 0],
  [8, 'Body to pocket shade variation', 0, 3, 0, 0, 0, 0],
  [9, 'Broke stitchh', 0, 1, 0, 0, 0, 0],
  [10, 'Broken stiches', 0, 45, 1, 0, 0, 0],
  [11, 'Broken stitch', 0, 211, 0, 0, 0, 0],
  [12, 'Bubble at zipp top', 0, 1, 0, 0, 0, 0],
  [13, 'Bundle sticker un remove', 0, 0, 1, 0, 0, 0],
  [14, 'Burn stitch', 0, 1, 0, 0, 0, 0],
  [15, 'Center out htl', 0, 4, 0, 0, 0, 0],
  [16, 'Center out label', 0, 7, 0, 0, 0, 0],
  [17, 'Center out label attached', 0, 1, 0, 0, 0, 0],
  [18, 'Center out print', 0, 3, 0, 0, 0, 0],
  [19, 'Centre out htl', 0, 1, 0, 0, 0, 0],
  [20, 'Centre out print', 0, 7, 0, 0, 0, 0],
  [21, 'Chake mark', 0, 6, 11, 0, 0, 0],
  [22, 'Chalk mark', 0, 0, 1, 0, 0, 0],
  [23, 'BOTTOM HI - LOW', 0, 0, 1, 0, 0, 0],
  [25, 'BOTTOM HIKING', 0, 18, 10, 0, 0, 0],
  [41, 'BROKEN STITCH', 0, 2, 295, 0, 1, 2],
  [53, 'CALENDAR MARK', 0, 1, 1, 0, 0, 0],
  [59, 'CARE LABEL MISSING', 1, 0, 0, 0, 0, 0],
  [61, 'CENTER OFF MAIN LABEL', 0, 0, 1, 0, 0, 0],
  [1154, 'Sleeve to body variation', 0, 0, 0, 0, 0, 2],
  [1155, 'Wrong po side label', 0, 0, 0, 0, 0, 22],
  [1156, 'Wrong size lable', 0, 0, 0, 0, 0, 4],
];

export const DEFECT_COMPARISON_REPORT_DEMO = {
  printDate: '16-Jul-2026',
  printTime: '11:42 am',
  scopeA: DEMO_SCOPE,
  scopeB: DEMO_SCOPE,
  grandTotal: {
    criticalA: 7,
    majorA: 2792,
    minorA: 4765,
    criticalB: 0,
    majorB: 13,
    minorB: 77,
  },
  rows: RAW_DEMO_ROWS.map(
    ([sno, defect, criticalA, majorA, minorA, criticalB, majorB, minorB]) => ({
      sno,
      defect,
      criticalA,
      majorA,
      minorA,
      criticalB,
      majorB,
      minorB,
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
  const ampm = h >= 12 ? 'am' : 'am';
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
// Scope panel + page header
// ----------------------------------------------------------------------

function scopePanelGeometry(x0, widths) {
  const xs = colXs(x0, widths);
  return {
    panelAX: xs[2],
    panelAW: widths[2] + widths[3] + widths[4],
    panelBX: xs[5],
    panelBW: widths[5] + widths[6] + widths[7],
  };
}

function drawScopeSummaryGrid(doc, x, y, w, totals) {
  const rowH = SCOPE_SUMMARY_H / 6;
  const labelW = w * 0.62;
  const valueW = w - labelW;
  const cells = [
    ['Total No. Of POs', formatInt(totals.totalPos)],
    ['Total PO Quantity', formatInt(totals.totalPoQty)],
    ['Total No. Of Inspection.', formatInt(totals.totalInspections)],
    ['Total Inspection Quantity', formatInt(totals.totalInspectionQty)],
    ['Total No. Of On Time Shipped.', formatInt(totals.totalOnTimeShipped)],
    ['Total No. Of Delay Shipped.', formatInt(totals.totalDelayShipped)],
  ];

  let cursorY = y;
  for (let r = 0; r < 6; r += 1) {
    const [label, value] = cells[r];
    strokeRect(doc, x, cursorY, labelW, rowH);
    textInRect(doc, x, cursorY, labelW, rowH, label, {
      align: 'left',
      bold: true,
      fontSize: 7,
      pad: 4,
      maxLines: 1,
    });
    strokeRect(doc, x + labelW, cursorY, valueW, rowH);
    textInRect(doc, x + labelW, cursorY, valueW, rowH, value, {
      align: 'right',
      bold: true,
      fontSize: 7.5,
      pad: 4,
      maxLines: 1,
    });
    cursorY += rowH;
  }
  return cursorY;
}

function drawScopePanel(doc, x, y, w, scope) {
  strokeRect(doc, x, y, w, SCOPE_PANEL_H);
  const metaLines = [
    `SUPPLIER : ${scope.supplierLabel || ''}`,
    `YEAR : ${scope.yearLabel || ''}`,
    `CUSTOMER : ${scope.customerLabel || ''}`,
    `STYLE : ${scope.styleLabel || ''}`,
    `PO# : ${scope.poLabel || ''}`,
  ];
  const lineH = SCOPE_META_H / metaLines.length;
  metaLines.forEach((line, i) => {
    textInRect(doc, x, y + i * lineH, w, lineH, line, {
      align: 'left',
      bold: true,
      fontSize: 7.5,
      pad: 5,
      maxLines: 1,
    });
  });
  drawScopeSummaryGrid(doc, x, y + SCOPE_META_H, w, scope.totals || {});
}

function drawFirstPageHeader(doc, logoDataUrl, meta, x0, widths) {
  const printLine = `Print Date:  ${meta.printDate}     ${meta.printTime}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const printDateW = doc.getTextWidth(printLine);
  const printDateX = HEADER_PRINT_X;
  const printDateY = HEADER_PRINT_Y;

  if (logoDataUrl) {
    try {
      const logoW = printDateW * 1.12;
      const logoH = logoW * (28 / 90);
      const logoX = printDateX - (logoW - printDateW) / 2;
      const logoY = printDateY - 8 - logoH;
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  doc.text(printLine, printDateX, printDateY, {
    align: 'left',
    baseline: 'alphabetic',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  const title = 'COMPARISON DEFECT REPORT';
  doc.text(title, HEADER_TITLE_X, HEADER_TITLE_Y, { align: 'left', baseline: 'alphabetic' });
  const titleW = doc.getTextWidth(title);
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(0.6);
  doc.line(HEADER_TITLE_X, HEADER_TITLE_Y + 2, HEADER_TITLE_X + titleW, HEADER_TITLE_Y + 2);

  const { panelAX, panelAW, panelBX, panelBW } = scopePanelGeometry(x0, widths);
  const scopePanelY = HEADER_TABLE_Y - SCOPE_PANEL_H;
  drawScopePanel(doc, panelAX, scopePanelY, panelAW, meta.scopeA || DEMO_SCOPE);
  drawScopePanel(doc, panelBX, scopePanelY, panelBW, meta.scopeB || DEMO_SCOPE);

  doc.setTextColor(0, 0, 0);
  return HEADER_TABLE_Y;
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
      maxLines: 1,
    });
  });
  return y + TABLE_HEADER_H;
}

function cellValue(row, key) {
  if (key === 'sno') return formatInt(row.sno);
  if (key.startsWith('critical') || key.startsWith('major') || key.startsWith('minor')) {
    return formatInt(row[key]);
  }
  return row[key];
}

function drawDataRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, DATA_ROW_H);
    const raw = cellValue(row, col.key);
    if (raw === undefined || raw === null || raw === '') return;
    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      fontSize: 7.5,
      pad: 3,
      maxLines: 1,
    });
  });
  return y + DATA_ROW_H;
}

function drawTotalRow(doc, y, x0, widths, grandTotal) {
  const xs = colXs(x0, widths);
  const mergedW = widths[0] + widths[1];
  strokeRect(doc, xs[0], y, mergedW, TOTAL_ROW_H);
  textInRect(doc, xs[0], y, mergedW, TOTAL_ROW_H, 'TOTAL', {
    align: 'center',
    bold: true,
    fontSize: 8.5,
    pad: 3,
    maxLines: 1,
  });

  const totalKeys = ['criticalA', 'majorA', 'minorA', 'criticalB', 'majorB', 'minorB'];
  totalKeys.forEach((key, idx) => {
    const colIdx = idx + 2;
    const x = xs[colIdx];
    const w = widths[colIdx];
    strokeRect(doc, x, y, w, TOTAL_ROW_H);
    textInRect(doc, x, y, w, TOTAL_ROW_H, formatInt(grandTotal[key]), {
      align: 'center',
      bold: true,
      fontSize: 8,
      pad: 3,
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
 *   scopeA?: object;
 *   scopeB?: object;
 *   grandTotal?: object;
 *   printDate?: string;
 *   printTime?: string;
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildDefectComparisonReportPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.rows) && data.rows.length > 0
      ? data
      : DEFECT_COMPARISON_REPORT_DEMO;

  const now = new Date();
  const meta = {
    printedOn: data.printedOn || formatPrintedOnLong(now),
    printDate: data.printDate || payload.printDate || formatPrintDate(now),
    printTime: data.printTime || payload.printTime || formatPrintTime(now),
    scopeA: data.scopeA || payload.scopeA || DEMO_SCOPE,
    scopeB: data.scopeB || payload.scopeB || DEMO_SCOPE,
  };

  const grandTotal = {
    ...DEFECT_COMPARISON_REPORT_DEMO.grandTotal,
    ...(payload.grandTotal || {}),
    ...(data.grandTotal || {}),
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(innerW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let y = 0;

  const startPage = (withFullHeader) => {
    if (withFullHeader) {
      y = drawFirstPageHeader(doc, logoDataUrl, meta, innerLeft, widths);
    } else {
      y = V_MARGIN;
    }
    y = drawTableHeader(doc, y, innerLeft, widths);
  };

  startPage(true);

  payload.rows.forEach((row) => {
    if (y + DATA_ROW_H > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'l');
      startPage(false);
    }
    y = drawDataRow(doc, y, innerLeft, widths, row);
  });

  if (y + TOTAL_ROW_H > pageBodyBottom) {
    doc.addPage([PAGE_W, PAGE_H], 'l');
    startPage(false);
  }
  y = drawTotalRow(doc, y, innerLeft, widths, grandTotal);

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, meta.printedOn);
  }

  try {
    doc.setProperties({
      title: DEFECT_COMPARISON_DOCUMENT_TITLE,
      subject: DEFECT_COMPARISON_DOCUMENT_TITLE,
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
export function openDefectComparisonReportPdf(mode, pdfBlob) {
  const namedFile =
    typeof File !== 'undefined'
      ? new File([pdfBlob], DEFECT_COMPARISON_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedFile);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = DEFECT_COMPARISON_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
