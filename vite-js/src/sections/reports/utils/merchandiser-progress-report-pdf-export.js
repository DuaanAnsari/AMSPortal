import jsPDF from 'jspdf';

/**
 * Merchandiser Progress Report — portrait PDF (legacy print mock-up).
 *
 *   - Header : AMS logo (top-left); centred blue underlined title; From/To under logo;
 *     Print Date + Print Time top-right.
 *   - Table : 5 columns; first two are **Customer | Supplier** when `reportType` is customer-wise,
 *     or **Supplier | Customer** when supplier-wise; then Merchand, Order's, PO Quantity.
 *   - Total row : horizontal rule; merged Customer–Supplier–Merchand band (no internal
 *     verticals); "Total" right-aligned in merchand area; Order's & PO Quantity totals.
 *   - Footer : INTEGRA / ITG (centre, grey); Printed on (left); Page n of m (right).
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 680;
const PAGE_H = 980;
const H_MARGIN = 22;
const V_MARGIN_TOP = 22;
const V_MARGIN_BOTTOM = 46;

const LOGO_W = 92;
const LOGO_H = 48;

const TITLE_BLUE = [0, 51, 153];
const TABLE_BORDER = [0, 0, 0];
const HEADER_FILL = [211, 211, 211];

const PDF_VIEW_ZOOM_HASH = '#zoom=100';

/** Matches Other hub form values (`MerchandiserProgressReportForm`). */
const REPORT_TYPE_SUPPLIER_WISE = 'supplier-wise';

function isSupplierWiseReport(data) {
  return String(data?.reportType || '') === REPORT_TYPE_SUPPLIER_WISE;
}

/** Column weights — Customer & Supplier wide, Merchand medium, Order's narrow, PO Qty numeric. */
const COL_WEIGHTS = [32, 32, 22, 12, 22];

const TABLE_HEADER_H = 24;
const DATA_ROW_H = 26;

const DEMO_ROWS = [
  {
    customer: 'ULTIMATE APPAREL, INC',
    supplier: 'ZAKONIN INTERNATIONAL',
    merchand: 'MUHAMMAD SHAHZAIB',
    orders: 50,
    poQuantity: 153915,
  },
  {
    customer: 'ULTIMATE APPAREL, INC',
    supplier: 'PROXIMA SRL',
    merchand: 'MUHAMMAD SHAHZAIB',
    orders: 51,
    poQuantity: 153915,
  },
  {
    customer: 'ULTIMATE APPAREL, INC',
    supplier: 'Ayyoub Apparels',
    merchand: 'MUHAMMAD SHAHZAIB',
    orders: 52,
    poQuantity: 153916,
  },
  {
    customer: 'ULTIMATE APPAREL, INC',
    supplier: 'Comfort apparel',
    merchand: 'MUHAMMAD SHAHZAIB',
    orders: 50,
    poQuantity: 153916,
  },
];

const DEMO_TOTALS = { orders: 203, poQuantity: 615662 };

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

function formatIsoToDdMonYyyy(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || '');
  const d = new Date(`${iso}T12:00:00`);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  return `${dd}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

/** e.g. 15-May-2026 */
function formatPrintDate(d = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function formatPrintTime(d = new Date()) {
  return d
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
}

/** e.g. 15-May-2026 (footer + print date line) */
function formatPrintedDash(d = new Date()) {
  return formatPrintDate(d);
}

function setBorder(doc, lineW = 0.35) {
  doc.setDrawColor(TABLE_BORDER[0], TABLE_BORDER[1], TABLE_BORDER[2]);
  doc.setLineWidth(lineW);
}

function colWidths(tableW) {
  const sum = COL_WEIGHTS.reduce((a, b) => a + b, 0);
  const widths = COL_WEIGHTS.map((w) => (w / sum) * tableW);
  const drift = tableW - widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += drift;
  return widths;
}

function colXs(x0, widths) {
  const xs = [x0];
  for (let i = 0; i < widths.length; i += 1) xs.push(xs[i] + widths[i]);
  return xs;
}

function formatPoQty(n) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return String(n ?? '');
  return x.toLocaleString('en-US');
}

function drawCenterTitleUnderline(doc, text, centerX, yMid) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
  doc.text(text, centerX, yMid, { align: 'center', baseline: 'middle' });
  const tw = doc.getTextWidth(text);
  doc.setDrawColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
  doc.setLineWidth(0.5);
  doc.line(centerX - tw / 2, yMid + 7, centerX + tw / 2, yMid + 7);
  doc.setTextColor(0, 0, 0);
  return yMid + 12;
}

/**
 * @returns {number} y after header block (start of table)
 */
function drawPageHeader(doc, logoDataUrl, meta) {
  const innerL = H_MARGIN;
  const innerR = PAGE_W - H_MARGIN;
  const logoY = V_MARGIN_TOP;
  const logoBottom = logoY + LOGO_H;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', innerL, logoY, LOGO_W, LOGO_H, undefined, 'FAST');
    } catch {
      /* skip */
    }
  }

  /** Title vertically centred on logo band (does not use space under logo for title). */
  const titleYMid = logoY + LOGO_H / 2;
  const yAfterTitle = drawCenterTitleUnderline(doc, 'MERCHANDISER PROGRESS REPORT', PAGE_W / 2, titleYMid);

  /** Print metadata — below heading / underline, and below logo bottom on the right. */
  const printTop = Math.max(yAfterTitle + 8, logoBottom + 6);
  const now = new Date();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Print Date: ${formatPrintDate(now)}`, innerR, printTop, {
    align: 'right',
    baseline: 'top',
  });
  doc.text(`Print Time: ${formatPrintTime(now)}`, innerR, printTop + 13, {
    align: 'right',
    baseline: 'top',
  });

  /** From / To — own band clearly below logo (never inside logo box). */
  const fromLineY = logoBottom + 14;
  const fromStr = formatIsoToDdMonYyyy(meta.fromDate || '2026-01-01');
  const toStr = formatIsoToDdMonYyyy(meta.toDate || '2026-12-31');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`From : ${fromStr} To: ${toStr}`, innerL, fromLineY, { baseline: 'top' });

  const printBottom = printTop + 28;
  const fromBottom = fromLineY + 12;
  return Math.max(printBottom, fromBottom) + 12;
}

function drawTableHeader(doc, y, x0, widths, supplierWise) {
  const xs = colXs(x0, widths);
  const labels = supplierWise
    ? ['Supplier', 'Customer', 'Merchand', "Order's", 'PO Quantity']
    : ['Customer', 'Supplier', 'Merchand', "Order's", 'PO Quantity'];
  const h = TABLE_HEADER_H;
  for (let i = 0; i < 5; i += 1) {
    doc.setFillColor(HEADER_FILL[0], HEADER_FILL[1], HEADER_FILL[2]);
    setBorder(doc, 0.35);
    doc.rect(xs[i], y, widths[i], h, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(labels[i], xs[i] + widths[i] / 2, y + h / 2, { align: 'center', baseline: 'middle' });
  }
  return y + h;
}

function drawDataRow(doc, y, x0, widths, row, supplierWise) {
  const xs = colXs(x0, widths);
  const h = DATA_ROW_H;
  for (let i = 0; i < 5; i += 1) {
    setBorder(doc, 0.3);
    doc.rect(xs[i], y, widths[i], h);
  }

  const pad = 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  const firstCol = supplierWise ? row.supplier : row.customer;
  const secondCol = supplierWise ? row.customer : row.supplier;

  doc.text(String(firstCol ?? ''), xs[0] + pad, y + h / 2, {
    align: 'left',
    baseline: 'middle',
    maxWidth: widths[0] - pad * 2,
  });
  doc.text(String(secondCol ?? ''), xs[1] + pad, y + h / 2, {
    align: 'left',
    baseline: 'middle',
    maxWidth: widths[1] - pad * 2,
  });
  doc.text(String(row.merchand ?? '').toUpperCase(), xs[2] + widths[2] / 2, y + h / 2, {
    align: 'center',
    baseline: 'middle',
    maxWidth: widths[2] - 4,
  });
  doc.text(String(row.orders ?? ''), xs[3] + widths[3] / 2, y + h / 2, {
    align: 'center',
    baseline: 'middle',
  });
  doc.text(formatPoQty(row.poQuantity), xs[4] + widths[4] - pad, y + h / 2, {
    align: 'right',
    baseline: 'middle',
  });

  return y + h;
}

function drawTotalRow(doc, y, x0, widths, totals) {
  const xs = colXs(x0, widths);
  const mergedW = widths[0] + widths[1] + widths[2];
  const w3 = widths[3];
  const w4 = widths[4];
  const tableW = mergedW + w3 + w4;
  const h = 24;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.65);
  doc.line(x0, y, x0 + tableW, y);
  y += 1.5;

  setBorder(doc, 0.35);
  doc.rect(x0, y, mergedW, h);
  doc.rect(x0 + mergedW, y, w3, h);
  doc.rect(x0 + mergedW + w3, y, w4, h);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Total', x0 + mergedW - 5, y + h / 2, { align: 'right', baseline: 'middle' });
  doc.text(String(totals.orders), x0 + mergedW + w3 / 2, y + h / 2, {
    align: 'center',
    baseline: 'middle',
  });
  doc.text(formatPoQty(totals.poQuantity), x0 + mergedW + w3 + w4 - 5, y + h / 2, {
    align: 'right',
    baseline: 'middle',
  });

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
  doc.text('Developed by: ITG (Pvt) Ltd. - Website: www.itg.net.pk', cx, yDev, {
    align: 'center',
    baseline: 'bottom',
  });

  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Printed on: ${printedOn || formatPrintedDash()}`, H_MARGIN, yBottom, {
    baseline: 'bottom',
  });
  doc.text(`Page ${pageIdx} of ${totalPages}`, PAGE_W - H_MARGIN, yBottom, {
    align: 'right',
    baseline: 'bottom',
  });
  doc.setTextColor(0, 0, 0);
}

function payloadFromInput(data) {
  if (data && Array.isArray(data.rows) && data.rows.length > 0) {
    const rows = data.rows;
    const totals = data.totals || {
      orders: rows.reduce((s, r) => s + (Number(r.orders) || 0), 0),
      poQuantity: rows.reduce((s, r) => s + (Number(r.poQuantity) || 0), 0),
    };
    return { rows, totals };
  }
  return { rows: DEMO_ROWS, totals: DEMO_TOTALS };
}

/**
 * @param {{
 *   fromDate?: string;
 *   toDate?: string;
 *   reportType?: 'customer-wise'|'supplier-wise';
 *   rows?: Array<{ customer: string; supplier: string; merchand: string; orders: number|string; poQuantity: number|string }>;
 *   totals?: { orders: number; poQuantity: number };
 * }} [data]
 * @returns {Promise<Blob>}
 */
export async function buildMerchandiserProgressReportPdfBlob(data = {}) {
  const { rows, totals } = payloadFromInput(data);
  const printedOn = formatPrintedDash();
  const supplierWise = isSupplierWiseReport(data);
  const meta = {
    fromDate: data.fromDate,
    toDate: data.toDate,
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'p' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(tableW);
  const bodyBottom = PAGE_H - V_MARGIN_BOTTOM - 6;

  const startPage = () => {
    const y0 = drawPageHeader(doc, logoDataUrl, meta);
    return drawTableHeader(doc, y0, tableX, widths, supplierWise);
  };

  let y = startPage();

  rows.forEach((row) => {
    if (y + DATA_ROW_H > bodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'p');
      y = startPage();
    }
    y = drawDataRow(doc, y, tableX, widths, row, supplierWise);
  });

  const totalBlock = 28;
  if (y + totalBlock > bodyBottom) {
    doc.addPage([PAGE_W, PAGE_H], 'p');
    y = startPage();
  }
  y = drawTotalRow(doc, y, tableX, widths, totals);

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages, printedOn);
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openMerchandiserProgressReportPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Merchandiser-Progress-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
