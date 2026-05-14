import jsPDF from 'jspdf';

/**
 * Product Comparision Report — portrait A4 PDF.
 *
 * Layout (per legacy print):
 *   - Top-left  : AMS logo + 2-line company address (left-aligned).
 *   - Center    : "Comparision Report <Type Wise>" title (bold).
 *   - Table     : 5 cols — Product, Period A "<Month> - <Year> Month Sale",
 *                 Period B "<Month> - <Year> Month Sale", "More Sale of
 *                 Month With Percentage <Month>", "Month With Highest Sale".
 *                 Numeric columns render with 2-decimal thousands separators.
 *                 The last row is a bold "Total" row (Product totals only;
 *                 percentage + highest-month cells stay blank).
 *   - Footer    : Printed on (left), Powered by … / Developed by … (center),
 *                 Page X of Y (right).
 *
 * Demo data is hardcoded (Quantity Wise sample with the legacy product
 * taxonomy); backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 595;
const PAGE_H = 842;
const V_MARGIN = 22;
const H_MARGIN = 22;

const HEADER_BLOCK_H = 120;
const TABLE_HEADER_H = 40;
const DATA_ROW_H = 22;
const TOTAL_ROW_H = 24;
const FOOTER_H = 32;

const HEADER_FILL = [255, 255, 255];
const HEADER_TEXT = [0, 0, 0];
const BORDER = [150, 150, 150];
const NAVY = [0, 51, 102];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Maps the form-side Type code to the human-readable suffix used in the title. */
const TYPE_LABELS = {
  quantity: 'Quantity Wise',
  fob: 'FOB Amount Wise',
  ldp: 'LDP Amount Wise',
};

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} ProductCompareCol */

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy print mock-up.
// ----------------------------------------------------------------------

const RAW_DEMO_ROWS = [
  ['WOMENS',       0,        0,         0.0,   ''],
  ['Mens tall',    0,        0,         0.0,   ''],
  ['Little girls', 0,        0,         0.0,   ''],
  ['ladies',       0,        0,         0.0,   ''],
  ['Little Boys',  0,        0,         0.0,   ''],
  ['Junior Girls', 0,        0,         0.0,   ''],
  ['Kids',         0,        0,         0.0,   ''],
  ['Toddlers',     0,        0,         0.0,   ''],
  ['NA',           0,        0,         0.0,   ''],
  ['youth',        17328,    3096,     -142.32, ''],
  ['Adult',        0,        0,         0.0,   ''],
  ['Lamp',         0,        0,         0.0,   ''],
  ['Men',          63296,    125286,    619.90, ''],
  ['Big Mens',     0,        0,         0.0,   ''],
  ['Unisex',       0,        0,         0.0,   ''],
  ['girls',        0,        0,         0.0,   ''],
  ['Juniors',      0,        0,         0.0,   ''],
  ['boys',         0,        5424,      54.24,  ''],
];

export const PRODUCT_COMPARISION_REPORT_DEMO = {
  type: 'quantity',
  periodA: { month: 1, year: 2025 },
  periodB: { month: 1, year: 2026 },
  rows: RAW_DEMO_ROWS.map(([product, monthASale, monthBSale, percentChange, highestMonth]) => ({
    product,
    monthASale,
    monthBSale,
    percentChange,
    highestMonth,
  })),
};

// ----------------------------------------------------------------------
// Geometry helpers
// ----------------------------------------------------------------------

/** Builds the column metadata using the dynamic period / type labels. */
function buildCols(periodA, periodB) {
  const periodALabel = `${MONTH_NAMES[periodA.month - 1] || ''} - ${periodA.year}\nMonth Sale`;
  const periodBLabel = `${MONTH_NAMES[periodB.month - 1] || ''} - ${periodB.year}\nMonth Sale`;
  const percentLabel = `More Sale of Month With\nPercentage ${MONTH_NAMES[periodA.month - 1] || ''}`;

  /** @type {ProductCompareCol[]} */
  return [
    { key: 'product', label: 'Product', weight: 110, align: 'center' },
    { key: 'monthASale', label: periodALabel, weight: 105, align: 'center' },
    { key: 'monthBSale', label: periodBLabel, weight: 105, align: 'center' },
    { key: 'percentChange', label: percentLabel, weight: 135, align: 'center' },
    { key: 'highestMonth', label: 'Month With\nHighest Sale', weight: 96, align: 'center' },
  ];
}

function colWidths(cols, innerW) {
  const sum = cols.reduce((a, c) => a + c.weight, 0);
  const out = cols.map((c) => (c.weight / sum) * innerW);
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

function formatNumber2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return `${n.toFixed(2)}%`;
}

// ----------------------------------------------------------------------
// Drawing primitives
// ----------------------------------------------------------------------

function setBorder(doc) {
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.4);
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
    pad = 4,
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
  const lineH = fontSize * 1.2;
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

  // Logo (top-LEFT) — matches the legacy mock-up.
  if (logoDataUrl) {
    try {
      const logoW = 80;
      const logoH = 26;
      doc.addImage(logoDataUrl, 'PNG', innerLeft, V_MARGIN, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  // Address (under logo, left-aligned).
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const addrY = V_MARGIN + 38;
  doc.text(
    'A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800',
    innerLeft,
    addrY,
    { align: 'left' }
  );
  doc.text(
    'Karachi - Pakistan.        Telephone # :  02134967216 & 02134946005',
    innerLeft,
    addrY + 11,
    { align: 'left' }
  );

  // Centered title — bold, sized to fit.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(meta.title, PAGE_W / 2, V_MARGIN + 90, {
    align: 'center',
    baseline: 'alphabetic',
  });

  doc.setTextColor(0, 0, 0);
  return V_MARGIN + HEADER_BLOCK_H;
}

// ----------------------------------------------------------------------
// Table
// ----------------------------------------------------------------------

function drawTableHeader(doc, y, x0, cols, widths) {
  const xs = colXs(x0, widths);
  cols.forEach((col, i) => {
    fillRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, HEADER_FILL);
    strokeRect(doc, xs[i], y, widths[i], TABLE_HEADER_H);
    textInRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, col.label, {
      align: 'center',
      bold: true,
      fontSize: 8.5,
      color: HEADER_TEXT,
      pad: 4,
      maxLines: 3,
    });
  });
  return y + TABLE_HEADER_H;
}

function drawDataRow(doc, y, x0, cols, widths, row) {
  const xs = colXs(x0, widths);
  cols.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, DATA_ROW_H);

    let raw;
    let align = col.align;
    switch (col.key) {
      case 'product':
        raw = row.product;
        align = 'left';
        break;
      case 'monthASale':
        raw = formatNumber2(row.monthASale);
        align = 'right';
        break;
      case 'monthBSale':
        raw = formatNumber2(row.monthBSale);
        align = 'right';
        break;
      case 'percentChange':
        raw = formatPercent2(row.percentChange);
        align = 'right';
        break;
      case 'highestMonth':
        raw = row.highestMonth;
        align = 'center';
        break;
      default:
        raw = row[col.key];
    }

    if (raw === undefined || raw === null || raw === '') return;

    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align,
      fontSize: 8,
      color: [0, 0, 0],
      pad: 5,
      maxLines: 2,
    });
  });
  return y + DATA_ROW_H;
}

function drawTotalRow(doc, y, x0, cols, widths, totals) {
  const xs = colXs(x0, widths);
  cols.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, TOTAL_ROW_H);

    let raw = '';
    let align = 'center';
    switch (col.key) {
      case 'product':
        raw = 'Total';
        align = 'center';
        break;
      case 'monthASale':
        raw = formatNumber2(totals.monthASale);
        align = 'right';
        break;
      case 'monthBSale':
        raw = formatNumber2(totals.monthBSale);
        align = 'right';
        break;
      default:
        raw = '';
    }

    if (!raw) return;

    textInRect(doc, x, y, w, TOTAL_ROW_H, raw, {
      align,
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
 * @param {{
 *   rows?: object[];
 *   printedOn?: string;
 *   type?: 'quantity'|'fob'|'ldp';
 *   periodA?: { month: number; year: number };
 *   periodB?: { month: number; year: number };
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildProductComparisionReportPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.rows) && data.rows.length > 0
      ? data
      : PRODUCT_COMPARISION_REPORT_DEMO;

  const type = (data.type || payload.type || 'quantity').toLowerCase();
  const periodA = data.periodA || payload.periodA || { month: 1, year: new Date().getFullYear() - 1 };
  const periodB = data.periodB || payload.periodB || { month: 1, year: new Date().getFullYear() };

  const meta = {
    printedOn: payload.printedOn || data.printedOn || formatPrintedOn(),
    title: `Comparision Report ${TYPE_LABELS[type] || 'Quantity Wise'}`,
  };

  const cols = buildCols(periodA, periodB);

  const totals = payload.rows.reduce(
    (acc, r) => ({
      monthASale: acc.monthASale + (Number(r.monthASale) || 0),
      monthBSale: acc.monthBSale + (Number(r.monthBSale) || 0),
    }),
    { monthASale: 0, monthBSale: 0 }
  );

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'p' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(cols, innerW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let y = 0;

  const startPage = () => {
    y = drawPageHeader(doc, logoDataUrl, meta);
    y = drawTableHeader(doc, y, innerLeft, cols, widths);
  };

  startPage();

  payload.rows.forEach((row) => {
    if (y + DATA_ROW_H > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'p');
      startPage();
    }
    y = drawDataRow(doc, y, innerLeft, cols, widths, row);
  });

  /** Force the Total row to live on the final page (start a new page if needed). */
  if (y + TOTAL_ROW_H > pageBodyBottom) {
    doc.addPage([PAGE_W, PAGE_H], 'p');
    startPage();
  }
  y = drawTotalRow(doc, y, innerLeft, cols, widths, totals);

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, meta.printedOn);
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openProductComparisionReportPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Product-Comparision-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
