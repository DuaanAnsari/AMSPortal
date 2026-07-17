import jsPDF from 'jspdf';

/**
 * Commission Invoice Report — portrait A4 PDF.
 *
 * Layout (per legacy print):
 *   - Top-left  : "COMMISSION INVOICE" (uppercase, gray) + a "Month: <name>"
 *                 line in dark navy.
 *   - Top-right : AMS logo + company address block + "Printed on: <date>".
 *   - Table     : 10 cols (Shipment Date, Supplier Name, Order No,
 *                 LDP Invoice #, Invoice #, Quantity, Unit Price, Total Value,
 *                 Commission %, Commission Value) with a soft-cyan header band.
 *   - Footer    : centered "Powered by : INTEGRA ERP SYSTEM" / "Developed by :
 *                 ITG (Pvt) Ltd. — Website : www.itg.net.pk" + right-aligned
 *                 "Page X of Y".
 *
 * Highlight rule: rows whose `supplierName` starts with "ZARKASH" render in red
 * text — matches the legacy spreadsheet's visual distinction for that supplier.
 *
 * Demo data is hardcoded; backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 595;
const PAGE_H = 842;
const V_MARGIN = 24;
const H_MARGIN = 24;

const HEADER_BLOCK_H = 118;
const TABLE_HEADER_H = 26;
const DATA_ROW_H = 22;
const FOOTER_H = 36;

const HEADER_FILL = [183, 222, 235];
const HEADER_TEXT = [12, 70, 100];
const BORDER = [150, 150, 150];
const TITLE_GRAY = [110, 110, 110];
const NAVY = [12, 70, 100];
const RED = [200, 0, 0];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} InvoiceCol */

/** @type {InvoiceCol[]} */
const COLS = [
  { key: 'shipmentDate', label: 'Shipment Date', weight: 54, align: 'center' },
  { key: 'supplierName', label: 'Supplier Name', weight: 70, align: 'left' },
  { key: 'orderNo', label: 'Order No', weight: 56, align: 'left' },
  { key: 'ldpInvoiceNo', label: 'LDP Invoice #', weight: 56, align: 'left' },
  { key: 'invoiceNo', label: 'Invoice #', weight: 62, align: 'left' },
  { key: 'quantity', label: 'Quantity', weight: 46, align: 'right' },
  { key: 'unitPrice', label: 'Unit\nPrice', weight: 40, align: 'right' },
  { key: 'totalValue', label: 'Total Value', weight: 56, align: 'right' },
  { key: 'commissionPct', label: 'Commission %', weight: 52, align: 'right' },
  { key: 'commissionValue', label: 'Commission\nValue', weight: 52, align: 'right' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy print mock-up.
// ----------------------------------------------------------------------

export const COMMISSION_INVOICE_REPORT_DEMO = {
  monthLabel: '',
  printedOn: '',
  rows: [
    // COMFORT APPAREL block (08-Jan-2026)
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -NAVY', 'AST-LR 4796', 'CA/623/AM/2024', 96.00, 2.40, 230.40, 7.00, 16.13],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -RED CLAY', 'AST-LR 4796', 'CA/623/AM/2024', 240.00, 2.15, 516.00, 7.00, 36.12],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-LS -CHARCOAL', 'AST-LR 4796', 'CA/623/AM/2024', 240.00, 2.40, 576.00, 7.00, 40.32],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-LS -RED CLAY', 'AST-LR 4796', 'CA/623/AM/2024', 240.00, 3.24, 777.60, 7.00, 54.43],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -NAVY', 'AST-LR 4796', 'CA/623/AM/2024', 336.00, 2.15, 722.40, 7.00, 50.57],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -RED CLAY', 'AST-LR 4796', 'CA/623/AM/2024', 336.00, 2.40, 806.40, 7.00, 56.45],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -BLUE JEAN', 'AST-LR 4796', 'CA/623/AM/2024', 336.00, 2.15, 722.40, 7.00, 50.57],
    ['08-Jan-2026', 'COMFORT APPAREL', '38598-LS -RED CLAY', 'AST-LR 4796', 'CA/623/AM/2024', 336.00, 3.24, 1088.64, 7.00, 76.20],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-LS -LAVENDER', 'AST-LR 4796', 'CA/623/AM/2024', 384.00, 2.15, 825.60, 7.00, 57.79],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -CHARCOAL', 'AST-LR 4796', 'CA/623/AM/2024', 432.00, 2.15, 928.80, 7.00, 65.02],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-LS -PEACH', 'AST-LR 4796', 'CA/623/AM/2024', 432.00, 2.15, 928.80, 7.00, 65.02],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-LS -RED CLAY', 'AST-LR 4796', 'CA/623/AM/2024', 528.00, 2.90, 1531.20, 7.00, 107.18],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -BLUE JEAN', 'AST-LR 4796', 'CA/623/AM/2024', 672.00, 2.15, 1444.80, 7.00, 101.14],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -BLUE JEAN', 'AST-LR 4796', 'CA/623/AM/2024', 1296.00, 2.15, 2786.40, 7.00, 195.05],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -PEACH', 'AST-LR 4796', 'CA/623/AM/2024', 1728.00, 2.15, 3715.20, 7.00, 260.06],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -PEACH', 'AST-LR 4796', 'CA/623/AM/2024', 1728.00, 2.15, 3715.20, 7.00, 260.06],
    ['08-Jan-2026', 'COMFORT APPAREL', '38598-LS -RED CLAY', 'AST-LR 4796', 'CA/623/AM/2024', 1728.00, 2.90, 5011.20, 7.00, 350.78],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-LS -LAVENDER', 'AST-LR 4796', 'CA/623/AM/2024', 1776.00, 2.15, 3818.40, 7.00, 267.29],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-SS -CREAM', 'AST-LR 4796', 'CA/623/AM/2024', 2592.00, 2.15, 5572.80, 7.00, 390.10],
    ['08-Jan-2026', 'COMFORT APPAREL', '38598-SS -RED CLAY', 'AST-LR 4796', 'CA/623/AM/2024', 2592.00, 2.15, 5572.80, 7.00, 390.10],
    ['08-Jan-2026', 'COMFORT APPAREL', '38422-LS -RED CLAY', 'AST-LR 4796', 'CA/623/AM/2024', 5856.00, 2.15, 12590.40, 7.00, 881.33],
    // ZR APPAREL block
    ['08-Jan-2026', 'ZR APPAREL', '202294-9 89', 'AST-LR 4796', 'CA/623/AM/2024', 312.00, 0.00, 0.00, 0.00, 0.00],
    ['08-Jan-2026', 'ZR APPAREL', '202294-7', 'AST-LR 4796', 'CA/623/AM/2024', 5424.00, 0.00, 0.00, 0.00, 0.00],
    // ZARKASH INTERNATIONAL block (red text)
    ['21-Jan-2026', 'ZARKASH INTERNATIONAL', '38477-PEACH', 'AST-LR 4802', 'INV NO 5580', 576.00, 2.98, 1716.48, 7.00, 120.15],
    ['21-Jan-2026', 'ZARKASH INTERNATIONAL', '38477-BA NANA', 'AST-LR 4802', 'INV NO 5580', 600.00, 2.98, 1788.00, 7.00, 125.16],
    ['21-Jan-2026', 'ZARKASH INTERNATIONAL', '38477-CHARCOAL', 'AST-LR 4802', 'INV NO 5580', 624.00, 2.98, 1859.52, 7.00, 130.17],
    ['21-Jan-2026', 'ZARKASH INTERNATIONAL', '38477-NA VY', 'AST-LR 4802', 'INV NO 5580', 624.00, 2.98, 1859.52, 7.00, 130.17],
    ['21-Jan-2026', 'ZARKASH INTERNATIONAL', '38477-WHITE', 'AST-LR 4802', 'INV NO 5580', 624.00, 2.98, 1859.52, 7.00, 130.17],
    ['21-Jan-2026', 'ZARKASH INTERNATIONAL', '38475-BA SIL', 'AST-LR 4802', 'INV NO 5580', 624.00, 3.75, 2340.00, 7.00, 163.80],
    ['21-Jan-2026', 'ZARKASH INTERNATIONAL', '38475-NA VY', 'AST-LR 4802', 'INV NO 5580', 624.00, 3.75, 2340.00, 7.00, 163.80],
  ].map(([shipmentDate, supplierName, orderNo, ldpInvoiceNo, invoiceNo, quantity, unitPrice, totalValue, commissionPct, commissionValue]) => ({
    shipmentDate,
    supplierName,
    orderNo,
    ldpInvoiceNo,
    invoiceNo,
    quantity,
    unitPrice,
    totalValue,
    commissionPct,
    commissionValue,
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

function formatPrintedOn(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  // Title (top-left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(TITLE_GRAY[0], TITLE_GRAY[1], TITLE_GRAY[2]);
  doc.text('COMMISSION INVOICE', innerLeft, V_MARGIN + 8);

  // "Month:" sub-line in navy
  doc.setFontSize(9);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text(`Month:  ${meta.monthLabel || '-'}`, innerLeft, V_MARGIN + 24);

  // Logo (top-right)
  if (logoDataUrl) {
    try {
      const logoW = 90;
      const logoH = 28;
      doc.addImage(logoDataUrl, 'PNG', innerRight - logoW, V_MARGIN, logoW, logoH);
    } catch {
      /* logo fetch may fail in some test envs — skip silently */
    }
  }

  // Address lines (right-aligned, under the logo)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.6);
  doc.setTextColor(0, 0, 0);
  const addrY = V_MARGIN + 36;
  doc.text(
    'A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800',
    innerRight,
    addrY,
    { align: 'right' }
  );
  doc.text(
    'Karachi - Pakistan     Telephone # : 02134967216 & 02134946005',
    innerRight,
    addrY + 8,
    { align: 'right' }
  );

  // Printed on (right-aligned, under address)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`Printed on:  ${meta.printedOn || formatPrintedOn()}`, innerRight, addrY + 24, {
    align: 'right',
  });

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
  const isHighlighted = String(row.supplierName || '').toUpperCase().startsWith('ZARKASH');
  const textColor = isHighlighted ? RED : [0, 0, 0];

  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, DATA_ROW_H);

    let raw;
    switch (col.key) {
      case 'quantity':
        raw = formatNumber2(row.quantity);
        break;
      case 'unitPrice':
        raw = formatNumber2(row.unitPrice);
        break;
      case 'totalValue':
        raw = formatMoney(row.totalValue);
        break;
      case 'commissionPct':
        raw = formatNumber2(row.commissionPct);
        break;
      case 'commissionValue':
        raw = formatNumber2(row.commissionValue);
        break;
      default:
        raw = row[col.key];
    }

    if (raw === undefined || raw === null || raw === '') return;
    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      fontSize: 6.6,
      color: textColor,
      pad: 2,
      maxLines: 2,
    });
  });
  return y + DATA_ROW_H;
}

// ----------------------------------------------------------------------
// Footer
// ----------------------------------------------------------------------

function drawFooter(doc, pageIdx, totalPages) {
  const fy = PAGE_H - V_MARGIN - 2;

  // Powered by / Developed by — centered
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
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
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Page ${pageIdx} of ${totalPages}`, PAGE_W - H_MARGIN, fy - 2, {
    align: 'right',
    baseline: 'bottom',
  });
}

// ----------------------------------------------------------------------
// Public builder
// ----------------------------------------------------------------------

/**
 * @param {{ rows?: object[]; monthLabel?: string; year?: string|number; printedOn?: string }} data
 * @returns {Promise<Blob>}
 */
export async function buildCommissionInvoiceReportPdfBlob(data = {}) {
  // Empty `rows` is valid — headers/table still render; only fall back to demo when rows omitted.
  const payload =
    data && Array.isArray(data.rows) ? data : COMMISSION_INVOICE_REPORT_DEMO;

  const meta = {
    monthLabel: payload.monthLabel || data.monthLabel || '',
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

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  doc.setProperties({
    title: 'Logistic Department Shipped',
    subject: 'Logistic Department Shipped',
  });

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openCommissionInvoiceReportPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Logistic Department Shipped.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

/** Resolve "May" / "Jan" / etc. from a numeric month value (1-12). */
export function commissionInvoiceMonthLabel(monthValue) {
  const n = Number(monthValue);
  if (!Number.isFinite(n) || n < 1 || n > 12) return '';
  return MONTH_NAMES[n - 1];
}
