import jsPDF from 'jspdf';
import {
  ORDER_REPORT_GRID,
  drawOrderReportDataRow,
  drawOrderReportTableHeaderRow,
  drawOrderReportTotalRow,
  getOrderReportColWidths,
  sumOrderReportTotals,
} from './status-wise-order-report-pdf-export';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const V_MARGIN = 14;
const H_MARGIN = 16;
const HEADER_BLOCK_H = 96;
const TABLE_HEADER_ROW_H = 30;
const DATA_ROW_H = 20;
const TOTAL_ROW_H = 22;
const FOOTER_H = 20;

const TITLE_BLUE = [0, 51, 153];
const HEADER_FILL = [225, 228, 233];
const TOTAL_FILL = [255, 240, 190];

const PAGE_W = 1100;
const PAGE_H = 700;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/** 14 columns in display order — exact match with the spec image. */
const HEADERS = [
  'Invoice No',
  'PO No.',
  'LDP\nInvoice No',
  'Customer',
  'Supplier',
  'Bill No',
  'Shipment\nDate',
  'Buyer Ship.\nDate',
  'Vendor Ship.\nDate',
  'Style #',
  'Size Range',
  'Shipped\nQuantity',
  'Shipped\nRate',
  'Value',
];

/** Last 3 columns (qty / rate / value) keep their own borders even in the merged total row. */
const QTY_COL = 11;
const RATE_COL = 12;
const VALUE_COL = 13;

const COL_WEIGHTS = [56, 60, 46, 70, 70, 50, 46, 46, 46, 50, 50, 46, 36, 46];

/** Demo payload — replaced by real API rows once backend lands. */
export const STATUS_WISE_VENDOR_ORDER_REPORT_DEMO = {
  fromDate: '2026-01-01',
  toDate: '2026-12-31',
  groups: [
    {
      rows: [
        {
          invoiceNo: '006/Zi/26',
          poNo: '202299-BB2126',
          ldpInvoiceNo: 'AST-UL 4817',
          customer: 'ULTIMATE APPAREL, INC',
          supplier: 'ZAHID INTERNATIONAL',
          billNo: 'CNCKHI7622',
          shipmentDate: '13 Apr 2026',
          buyerShipDate: '15 Apr 2026',
          vendorShipDate: '31 Mar 2026',
          styleNo: 'BB2126',
          sizeRange: 'XS(4) - XL(18/20)',
          shippedQty: 65808,
          shippedRate: 0.8,
          value: 52646.4,
        },
        {
          invoiceNo: '006/Zi/26',
          poNo: '202299-MB2125',
          ldpInvoiceNo: 'AST-UL 4817',
          customer: 'ULTIMATE APPAREL, INC',
          supplier: 'ZAHID INTERNATIONAL',
          billNo: 'CNCKHI7622',
          shipmentDate: '13 Apr 2026',
          buyerShipDate: '15 Apr 2026',
          vendorShipDate: '31 Mar 2026',
          styleNo: 'MB2125',
          sizeRange: 'S(26/30)-XL(40/42)',
          shippedQty: 13248,
          shippedRate: 0.85,
          value: 11260.8,
        },
      ],
    },
    {
      rows: [
        {
          invoiceNo: 'AMS/AA/2155/2026',
          poNo: 'Pc0018870',
          ldpInvoiceNo: 'AST-JB 4809',
          customer: 'JEDCO BRANDS, INC',
          supplier: 'AYYOUB APPARELS',
          billNo: '235-8907 0855',
          shipmentDate: '18 Feb 2026',
          buyerShipDate: '10 Feb 2026',
          vendorShipDate: '10 Feb 2026',
          styleNo: 'APX CAMO SS',
          sizeRange: 'S-3XL',
          shippedQty: 10033,
          shippedRate: 0.38,
          value: 3812.54,
        },
      ],
    },
    {
      rows: [
        ['VPO-1149645-007', 4008, 5931.84],
        ['VPO-1149645-0155', 3528, 5221.44],
        ['VPO-1149645-0156', 4008, 5931.84],
        ['VPO-1149645-0160', 4008, 5931.84],
        ['VPO-1149645-0169', 4008, 5931.84],
        ['VPO-1149645-024', 2640, 3907.2],
        ['VPO-1149645-052', 4008, 5931.84],
        ['VPO-1149645-076', 3216, 4759.68],
        ['VPO-1149645-078', 4008, 5931.84],
        ['VPO-1149645-445', 3216, 4759.68],
        ['VPO-1149645-446', 4008, 5931.84],
        ['VPO-1149645-448', 4008, 5931.84],
        ['VPO-1149645-0159', 2784, 4120.32],
        ['VPO-1149645-449', 2736, 4049.28],
      ].map(([poNo, shippedQty, value]) => ({
        invoiceNo: 'AMS/AA/2176/2026',
        poNo,
        ldpInvoiceNo: 'AST-CL 4819',
        customer: 'C-LIFE GROUP LTD.',
        supplier: 'AYYOUB APPARELS',
        billNo: 'CNCKHI7648',
        shipmentDate: '27 Apr 2026',
        buyerShipDate: '17 Apr 2026',
        vendorShipDate: '16 Mar 2026',
        styleNo: 'SO-1592893',
        sizeRange: 'S-XL',
        shippedQty,
        shippedRate: 1.48,
        value,
      })),
    },
    {
      rows: [
        ['PO0019438', 10308, 39170.4],
        ['Pc0019439', 10272, 39033.6],
      ].map(([poNo, shippedQty, value]) => ({
        invoiceNo: 'AMS/AA/2184/2026',
        poNo,
        ldpInvoiceNo: 'AST-JB 4821',
        customer: 'JEDCO BRANDS, INC',
        supplier: 'AYYOUB APPARELS',
        billNo: '',
        shipmentDate: '09 May 2026',
        buyerShipDate: '30 Apr 2026',
        vendorShipDate: '30 Apr 2026',
        styleNo: 'APX CAMO SS',
        sizeRange: 'S-3XL',
        shippedQty,
        shippedRate: 3.8,
        value,
      })),
    },
    {
      rows: [
        ['38551-1003-BERRY', '1003 (PB0003)', 2784, 5.8, 16147.2],
        ['38551-1003-BLACK', '1003 (PB0003)', 2088, 5.8, 12110.4],
        ['38551-1003-EUCA', '1003 (PB0003)', 1464, 5.8, 8491.2],
        ['38551-6481-BLUSH', '6481 (PB0004)', 1560, 4.2, 6552.0],
        ['38551-6481-Seafoam', '6481 (PB0004)', 2232, 4.2, 9374.4],
        ['38602-1003-BERRY', '1003 (PB0003)', 72, 5.8, 417.6],
        ['38602-1003-BLACK', '1003 (PB0003)', 72, 5.8, 417.6],
      ].map(([poNo, styleNo, shippedQty, shippedRate, value]) => ({
        invoiceNo: 'CA/630/AM/2026',
        poNo,
        ldpInvoiceNo: 'AST-LR 4810',
        customer: 'LONE ROCK',
        supplier: 'COMFORT APPAREL',
        billNo: 'CNCKHI7556',
        shipmentDate: '09 Mar 2026',
        buyerShipDate: '10 Feb 2026',
        vendorShipDate: '10 Feb 2026',
        styleNo,
        sizeRange: 'S-2XL',
        shippedQty,
        shippedRate,
        value,
      })),
    },
  ],
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
  const dateRaw = d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  const timePart = d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return `${dateRaw} ${timePart}`;
}

function formatNumber2(value) {
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
  doc.setFontSize(13);
  const lines = doc.splitTextToSize(String(text), maxW);
  let yy = y;
  lines.forEach((line) => {
    const tw = doc.getTextWidth(line);
    const startX = centerX - tw / 2;
    doc.text(line, centerX, yy, { align: 'center' });
    doc.setDrawColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
    doc.setLineWidth(0.6);
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
  const { align = 'left', bold = false, fontSize = 6.6, color = [0, 0, 0] } = opts;
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

function drawDataRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  let i = 0;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.invoiceNo, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.poNo, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.ldpInvoiceNo, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.customer, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.supplier, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.billNo, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.shipmentDate, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.buyerShipDate, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.vendorShipDate, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.styleNo, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.sizeRange, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatNumber2(row.shippedQty), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatNumber2(row.shippedRate), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatNumber2(row.value), { align: 'right' });
  return y + DATA_ROW_H;
}

/**
 * Yellow merged-look band: cells 1..11 read as a single cell containing the centered "Total"
 * label; cells 12 (qty), 13 (rate), 14 (value) retain their own borders so totals line up
 * visually with the column above.
 */
function drawTotalRow(doc, y, x0, widths, totals) {
  const xs = colXs(x0, widths);
  const totalRowW = widths.reduce((a, b) => a + b, 0);

  doc.setFillColor(TOTAL_FILL[0], TOTAL_FILL[1], TOTAL_FILL[2]);
  doc.rect(x0, y, totalRowW, TOTAL_ROW_H, 'F');

  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.25);
  doc.rect(x0, y, totalRowW, TOTAL_ROW_H);
  doc.line(xs[QTY_COL], y, xs[QTY_COL], y + TOTAL_ROW_H);
  doc.line(xs[RATE_COL], y, xs[RATE_COL], y + TOTAL_ROW_H);
  doc.line(xs[VALUE_COL], y, xs[VALUE_COL], y + TOTAL_ROW_H);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const leftSpanCenter = xs[0] + (xs[QTY_COL] - xs[0]) / 2;
  doc.text('Total', leftSpanCenter, y + TOTAL_ROW_H / 2, {
    align: 'center',
    baseline: 'middle',
  });

  doc.setFontSize(7);
  doc.text(formatNumber2(totals.shippedQty), xs[QTY_COL] + widths[QTY_COL] - 3, y + TOTAL_ROW_H / 2, {
    align: 'right',
    baseline: 'middle',
  });
  doc.text(formatNumber2(totals.value), xs[VALUE_COL] + widths[VALUE_COL] - 3, y + TOTAL_ROW_H / 2, {
    align: 'right',
    baseline: 'middle',
  });

  return y + TOTAL_ROW_H;
}

function sumGroup(rows) {
  return rows.reduce(
    (acc, r) => {
      acc.shippedQty += Number(r.shippedQty) || 0;
      acc.value += Number(r.value) || 0;
      return acc;
    },
    { shippedQty: 0, value: 0 }
  );
}

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
  const titleY = V_MARGIN + 22;
  drawBlueBoldUnderlineCenter(doc, 'SHIPPED ORDER REPORT', centerX, titleY, innerRight - innerLeft - 240);

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

function ensureRowFits(doc, y, rowH, pageBodyBottom, flushSegmentFrame, startPage) {
  if (y + rowH > pageBodyBottom) {
    flushSegmentFrame();
    doc.addPage([PAGE_W, PAGE_H], 'l');
    startPage();
  }
}

/**
 * Status Wise Vendor panel — same 14-column order grid as the customer report,
 * grouped by supplier with PO Qty / Value / LDP Value subtotals and a grand total.
 */
async function buildStatusWiseVendorOrderGridPdfBlob(data, meta = {}) {
  if (!data || !Array.isArray(data.groups) || data.groups.length === 0) {
    throw new Error('No data found for the selected filters.');
  }

  const headerMeta = {
    fromDate: meta.fromDate || data.fromDate,
    toDate: meta.toDate || data.toDate,
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = getOrderReportColWidths(innerW);
  const { DATA_ROW_H, TOTAL_ROW_H } = ORDER_REPORT_GRID;

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let tableSegTop = 0;
  let y = 0;

  const startPage = () => {
    const tableTop = drawPageHeader(doc, logoDataUrl, headerMeta);
    tableSegTop = tableTop;
    y = drawOrderReportTableHeaderRow(doc, tableTop, innerLeft, widths);
  };

  const flushSegmentFrame = () => {
    const h = y - tableSegTop;
    if (h > 0) {
      drawOuterTableFrame(doc, innerLeft, tableSegTop, innerW, h);
    }
  };

  startPage();

  const grandTotals = { poQty: 0, value: 0, ldpValue: 0 };

  data.groups.forEach((group) => {
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

  flushSegmentFrame();

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  return doc.output('blob');
}

/**
 * @param {{ fromDate?: string; toDate?: string; groups?: Array<{ rows: object[] }> }} data
 * @param {{ fromDate?: string; toDate?: string; statusWiseOrderGrid?: boolean }} [meta]
 */
export async function buildStatusWiseVendorOrderReportPdfBlob(data, meta = {}) {
  if (meta.statusWiseOrderGrid) {
    return buildStatusWiseVendorOrderGridPdfBlob(data, meta);
  }

  const payload =
    data && Array.isArray(data.groups) && data.groups.length > 0
      ? data
      : STATUS_WISE_VENDOR_ORDER_REPORT_DEMO;
  const headerMeta = {
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

  payload.groups.forEach((group) => {
    group.rows.forEach((row) => {
      if (y + DATA_ROW_H > pageBodyBottom) {
        flushSegmentFrame();
        doc.addPage([PAGE_W, PAGE_H], 'l');
        startPage();
      }
      y = drawDataRow(doc, y, innerLeft, widths, row);
    });

    if (y + TOTAL_ROW_H > pageBodyBottom) {
      flushSegmentFrame();
      doc.addPage([PAGE_W, PAGE_H], 'l');
      startPage();
    }
    const totals = sumGroup(group.rows);
    y = drawTotalRow(doc, y, innerLeft, widths, totals);
  });

  flushSegmentFrame();

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openStatusWiseVendorOrderReportPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Shipped-Order-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
