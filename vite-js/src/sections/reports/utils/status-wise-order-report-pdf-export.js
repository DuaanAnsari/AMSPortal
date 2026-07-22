import jsPDF from 'jspdf';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const V_MARGIN = 14;
const H_MARGIN = 16;
const HEADER_BLOCK_H = 96;
const TABLE_HEADER_ROW_H = 30;
const DATA_ROW_H = 22;
const TOTAL_ROW_H = 22;
const FOOTER_H = 20;

const TITLE_BLUE = [0, 51, 153];
const HEADER_FILL = [225, 228, 233];
const TOTAL_FILL = [255, 240, 190];

const PO_QTY_COL = 9;
const VALUE_COL = 11;
const LDP_VALUE_COL = 13;

const PAGE_W = 1100;
const PAGE_H = 700;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

export const STATUS_WISE_ORDER_DOCUMENT_TITLE = 'Status Wise Order Report';
export const STATUS_WISE_ORDER_PDF_FILENAME = 'Status Wise Order Report.pdf';

function setPdfDocumentTitle(doc, title) {
  if (!title) return;
  try {
    doc.setProperties({ title, subject: title });
  } catch (e) {
    /* setProperties unavailable — non-fatal, preview still works */
  }
}

/** 14 columns in display order — exact match with the spec image. */
const HEADERS = [
  'PO No.',
  'Customer',
  'Supplier',
  'Buyer Ship.\nDate',
  'Vendor Ship.\nDate',
  'Style #',
  'Colorway',
  'Size Range',
  'Size',
  'PO Quantity',
  'Item Price',
  'Value',
  'LDP Price',
  'LDP Value',
];

const COL_WEIGHTS = [48, 88, 82, 50, 50, 38, 70, 56, 38, 56, 50, 50, 50, 50];

const STD_ITEM_PRICE = 1.5;
const STD_LDP_PRICE = 2.78;

/**
 * Build a flat list of size rows from a colorway / size-range plan. Each entry yields
 * one PDF row with computed `value` (qty × item price) and `ldpValue` (qty × LDP price).
 */
function buildOrderLineRows(plan, base) {
  const rows = [];
  plan.forEach((color) => {
    color.ranges.forEach((range) => {
      range.sizes.forEach(({ size, qty }) => {
        rows.push({
          ...base,
          colorway: color.name,
          sizeRange: range.label,
          size,
          poQty: qty,
          itemPrice: STD_ITEM_PRICE,
          value: qty * STD_ITEM_PRICE,
          ldpPrice: STD_LDP_PRICE,
          ldpValue: qty * STD_LDP_PRICE,
        });
      });
    });
  });
  return rows;
}

const ULTIMATE_BASE = {
  poNo: '202300-310',
  customer: 'ULTIMATE APPAREL, INC',
  supplier: 'ZAKONIN INTERNATIONAL',
  buyerShipDate: 'Apr 15, 2026',
  vendorShipDate: 'Apr 07, 2026',
  styleNo: '310',
};

const ULTIMATE_PLAN = [
  {
    name: 'RED',
    ranges: [
      {
        label: '4-7 YRS',
        sizes: [
          { size: '4', qty: 12 },
          { size: '5/6', qty: 102 },
          { size: '7', qty: 102 },
        ],
      },
      {
        label: '8-18/20',
        sizes: [
          { size: '8', qty: 162 },
          { size: '10/12', qty: 228 },
          { size: '14/16', qty: 120 },
          { size: '18/20', qty: 60 },
        ],
      },
    ],
  },
  {
    name: 'PEACOAT',
    ranges: [
      {
        label: '4-7 YRS',
        sizes: [
          { size: '4', qty: 12 },
          { size: '5/6', qty: 102 },
          { size: '7', qty: 102 },
        ],
      },
      {
        label: '8-18/20',
        sizes: [
          { size: '8', qty: 162 },
          { size: '10/12', qty: 228 },
          { size: '14/16', qty: 120 },
          { size: '18/20', qty: 60 },
        ],
      },
    ],
  },
  {
    name: 'STONE GREEN',
    ranges: [
      {
        label: '4-7 YRS',
        sizes: [
          { size: '4', qty: 12 },
          { size: '5/6', qty: 102 },
          { size: '7', qty: 102 },
        ],
      },
      {
        label: '8-18/20',
        sizes: [{ size: '8', qty: 162 }],
      },
    ],
  },
];

/** Demo payload — replaced by real API rows once backend lands. */
export const STATUS_WISE_ORDER_REPORT_DEMO = {
  status: 'Confirmed',
  fromDate: '2026-01-01',
  toDate: '2026-12-31',
  rows: buildOrderLineRows(ULTIMATE_PLAN, ULTIMATE_BASE),
};

// ---------- helpers ----------

function colWidths(innerW) {
  const sum = COL_WEIGHTS.reduce((a, b) => a + b, 0);
  const out = COL_WEIGHTS.map((w) => (w / sum) * innerW);
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

function formatIsoToHeader(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || '');
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso || '');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${month} ${day}, ${d.getFullYear()}`;
}

function formatPrintStamp() {
  const d = new Date();
  const dateRaw = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const datePart = dateRaw.replace(/ /g, '-');
  const timePart = d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return `${datePart} ${timePart}`;
}

function formatNumber2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- drawing ----------

function drawCellBorder(doc, x, y, w, h) {
  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);
}

function drawBlueBoldUnderlineCenter(doc, text, centerX, y, maxW) {
  doc.setTextColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const lines = doc.splitTextToSize(String(text), maxW);
  let yy = y;
  lines.forEach((line) => {
    const tw = doc.getTextWidth(line);
    const startX = centerX - tw / 2;
    doc.text(line, centerX, yy, { align: 'center' });
    doc.setDrawColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
    doc.setLineWidth(0.5);
    doc.line(startX, yy + 2, startX + tw, yy + 2);
    yy += 14;
  });
  doc.setTextColor(0, 0, 0);
  return yy;
}

function drawBlackBoldUnderline(doc, text, x, y) {
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(String(text), x, y);
  const tw = doc.getTextWidth(String(text));
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(x, y + 2, x + tw, y + 2);
}

function drawHeaderCell(doc, x, y, w, h, headerText) {
  doc.setFillColor(HEADER_FILL[0], HEADER_FILL[1], HEADER_FILL[2]);
  doc.rect(x, y, w, h, 'F');
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const parts = String(headerText || '')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) parts.push('');

  let fs = 7;
  doc.setFontSize(fs);
  let lines = [];
  parts.forEach((p) => {
    lines.push(...doc.splitTextToSize(p, Math.max(3, w - 3)));
  });
  if (lines.length > 2) {
    fs = 6.2;
    doc.setFontSize(fs);
    lines = [];
    parts.forEach((p) => {
      lines.push(...doc.splitTextToSize(p, Math.max(3, w - 3)));
    });
  }

  const lineH = fs * 1.18;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  lines.slice(0, 3).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
      baseline: 'middle',
      maxWidth: w - 2,
    });
  });
}

function drawTextCell(doc, x, y, w, h, text, opts = {}) {
  const { align = 'left', bold = false, fontSize = 7, color = [0, 0, 0] } = opts;
  drawCellBorder(doc, x, y, w, h);
  if (text == null || text === '') return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  const maxW = Math.max(2, w - 4);
  const lines = doc.splitTextToSize(String(text), maxW);
  const lineH = fontSize * 1.18;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  let xText;
  if (align === 'center') xText = x + w / 2;
  else if (align === 'right') xText = x + w - 3;
  else xText = x + 3;
  lines.slice(0, 2).forEach((ln, i) => {
    doc.text(ln, xText, firstY + i * lineH, {
      align,
      baseline: 'middle',
      maxWidth: maxW,
    });
  });
  doc.setTextColor(0, 0, 0);
}

function drawTableHeaderRow(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  for (let i = 0; i < HEADERS.length; i += 1) {
    drawHeaderCell(doc, xs[i], y, widths[i], TABLE_HEADER_ROW_H, HEADERS[i]);
  }
  return y + TABLE_HEADER_ROW_H;
}

export function sumOrderReportTotals(rows) {
  return rows.reduce(
    (acc, r) => {
      acc.poQty += Number(r.poQty) || 0;
      acc.value += Number(r.value) || 0;
      acc.ldpValue += Number(r.ldpValue) || 0;
      return acc;
    },
    { poQty: 0, value: 0, ldpValue: 0 }
  );
}

export function drawOrderReportDataRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  let i = 0;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.poNo, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.customer, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.supplier, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.buyerShipDate, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.vendorShipDate, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.styleNo, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.colorway, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.sizeRange, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.size, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatQty(row.poQty), { align: 'right' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatNumber2(row.itemPrice), { align: 'right' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatNumber2(row.value), { align: 'right' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatNumber2(row.ldpPrice), { align: 'right' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatNumber2(row.ldpValue), { align: 'right' });
  return y + DATA_ROW_H;
}

/** Yellow total band — only PO Quantity, Value, and LDP Value are summed. */
export function drawOrderReportTotalRow(doc, y, x0, widths, totals, label = 'Total') {
  const xs = colXs(x0, widths);
  const totalRowW = widths.reduce((a, b) => a + b, 0);

  doc.setFillColor(TOTAL_FILL[0], TOTAL_FILL[1], TOTAL_FILL[2]);
  doc.rect(x0, y, totalRowW, TOTAL_ROW_H, 'F');

  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.25);
  doc.rect(x0, y, totalRowW, TOTAL_ROW_H);
  doc.line(xs[PO_QTY_COL], y, xs[PO_QTY_COL], y + TOTAL_ROW_H);
  doc.line(xs[PO_QTY_COL + 1], y, xs[PO_QTY_COL + 1], y + TOTAL_ROW_H);
  doc.line(xs[VALUE_COL], y, xs[VALUE_COL], y + TOTAL_ROW_H);
  doc.line(xs[VALUE_COL + 1], y, xs[VALUE_COL + 1], y + TOTAL_ROW_H);
  doc.line(xs[LDP_VALUE_COL], y, xs[LDP_VALUE_COL], y + TOTAL_ROW_H);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const leftSpanCenter = xs[0] + (xs[PO_QTY_COL] - xs[0]) / 2;
  doc.text(String(label), leftSpanCenter, y + TOTAL_ROW_H / 2, {
    align: 'center',
    baseline: 'middle',
  });

  doc.setFontSize(7);
  doc.text(formatQty(totals.poQty), xs[PO_QTY_COL] + widths[PO_QTY_COL] - 3, y + TOTAL_ROW_H / 2, {
    align: 'right',
    baseline: 'middle',
  });
  doc.text(`$${formatNumber2(totals.value)}`, xs[VALUE_COL] + widths[VALUE_COL] - 3, y + TOTAL_ROW_H / 2, {
    align: 'right',
    baseline: 'middle',
  });
  doc.text(
    `$${formatNumber2(totals.ldpValue)}`,
    xs[LDP_VALUE_COL] + widths[LDP_VALUE_COL] - 3,
    y + TOTAL_ROW_H / 2,
    { align: 'right', baseline: 'middle' }
  );

  return y + TOTAL_ROW_H;
}

export function drawOrderReportTableHeaderRow(doc, y, x0, widths) {
  return drawTableHeaderRow(doc, y, x0, widths);
}

export function getOrderReportColWidths(innerW) {
  return colWidths(innerW);
}

export const ORDER_REPORT_GRID = {
  HEADERS,
  COL_WEIGHTS,
  DATA_ROW_H,
  TOTAL_ROW_H,
  TABLE_HEADER_ROW_H,
};

function drawOuterTableFrame(doc, x, y, w, h) {
  doc.setDrawColor(110, 110, 110);
  doc.setLineWidth(0.5);
  doc.rect(x, y, w, h);
}

function drawPageHeader(doc, logoDataUrl, meta) {
  const innerLeft = H_MARGIN;
  const innerRight = PAGE_W - H_MARGIN;
  const logoW = 110;
  const logoH = 36;
  const logoX = innerRight - logoW;
  const logoY = V_MARGIN + 2;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  const centerX = (innerLeft + innerRight) / 2;
  const titleY = V_MARGIN + 18;
  const titleText =
    meta.title || `STATUS WISE ORDER REPORT - (${meta.status || 'Confirmed'})`;
  drawBlueBoldUnderlineCenter(doc, titleText, centerX, titleY, innerRight - innerLeft - 240);

  const fromH = formatIsoToHeader(meta.fromDate);
  const toH = formatIsoToHeader(meta.toDate);
  const datesY = V_MARGIN + HEADER_BLOCK_H - 12;
  drawBlackBoldUnderline(doc, `Date From: ${fromH}  Date To: ${toH}`, innerLeft, datesY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text(`Print Date:    ${formatPrintStamp()}`, innerRight, datesY, {
    align: 'right',
    baseline: 'alphabetic',
  });

  return V_MARGIN + HEADER_BLOCK_H;
}

function drawFooter(doc, pageIdx, totalPages) {
  const fy = PAGE_H - V_MARGIN - 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Powered by : INTERACTIVE TECHNOLOGIES GATEWAY', PAGE_W / 2, fy, {
    align: 'center',
    baseline: 'bottom',
  });
  doc.text(`Page ${pageIdx} of ${totalPages}`, PAGE_W - H_MARGIN, fy, {
    align: 'right',
    baseline: 'bottom',
  });
}

function resolveOrderReportPayload(data) {
  if (data && Array.isArray(data.groups)) {
    return { payload: data, mode: 'grouped' };
  }
  if (data && Array.isArray(data.rows)) {
    return { payload: data, mode: 'flat' };
  }
  return { payload: { groups: [], rows: [] }, mode: 'flat' };
}

function ensureRowFits(doc, y, rowH, pageBodyBottom, flushSegmentFrame, startPage) {
  if (y + rowH > pageBodyBottom) {
    flushSegmentFrame();
    doc.addPage([PAGE_W, PAGE_H], 'l');
    startPage();
  }
}

/**
 * @param {{ status?: string; fromDate?: string; toDate?: string; rows?: object[]; groups?: Array<{ rows: object[] }> }} data
 * @param {{ status?: string; fromDate?: string; toDate?: string; title?: string }} [meta]
 *   `title` (optional) replaces the default `STATUS WISE ORDER REPORT - (<status>)` heading.
 */
export async function buildStatusWiseOrderReportPdfBlob(data, meta = {}) {
  const { payload, mode } = resolveOrderReportPayload(data);
  const headerMeta = {
    title: meta.title,
    status: meta.status || payload.status || 'Confirmed',
    fromDate: meta.fromDate || payload.fromDate,
    toDate: meta.toDate || payload.toDate,
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(innerW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let tableSegTop = 0;
  let y = 0;

  const startPage = () => {
    const tableTop = drawPageHeader(doc, logoDataUrl, headerMeta);
    tableSegTop = tableTop;
    y = drawTableHeaderRow(doc, tableTop, innerLeft, widths);
  };

  const flushSegmentFrame = () => {
    const h = y - tableSegTop;
    if (h > 0) {
      drawOuterTableFrame(doc, innerLeft, tableSegTop, innerW, h);
    }
  };

  startPage();

  if (mode === 'grouped') {
    const grandTotals = { poQty: 0, value: 0, ldpValue: 0 };

    payload.groups.forEach((group) => {
      group.rows.forEach((row) => {
        ensureRowFits(doc, y, DATA_ROW_H, pageBodyBottom, flushSegmentFrame, startPage);
        y = drawOrderReportDataRow(doc, y, innerLeft, widths, row);
      });

      ensureRowFits(doc, y, TOTAL_ROW_H, pageBodyBottom, flushSegmentFrame, startPage);
      const totals = sumOrderReportTotals(group.rows);
      grandTotals.poQty += totals.poQty;
      grandTotals.value += totals.value;
      grandTotals.ldpValue += totals.ldpValue;
      y = drawOrderReportTotalRow(doc, y, innerLeft, widths, totals, 'Total');
    });

    ensureRowFits(doc, y, TOTAL_ROW_H, pageBodyBottom, flushSegmentFrame, startPage);
    y = drawOrderReportTotalRow(doc, y, innerLeft, widths, grandTotals, 'Grand Total');
  } else {
    payload.rows.forEach((row) => {
      ensureRowFits(doc, y, DATA_ROW_H, pageBodyBottom, flushSegmentFrame, startPage);
      y = drawOrderReportDataRow(doc, y, innerLeft, widths, row);
    });
  }

  flushSegmentFrame();

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  setPdfDocumentTitle(doc, meta.documentTitle || STATUS_WISE_ORDER_DOCUMENT_TITLE);

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openStatusWiseOrderReportPdf(mode, pdfBlob) {
  const namedPdf =
    typeof File !== 'undefined'
      ? new File([pdfBlob], STATUS_WISE_ORDER_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedPdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = STATUS_WISE_ORDER_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
