import jsPDF from 'jspdf';

import { attachFactoryWipPoImageDimensions } from './factory-wip-pdf-export';
import { getWipColorQtyDisplayLines } from './wip-color-qty-normalize';
import { drawWipPdfMilestoneAndProdTail } from './wip-pdf-milestone-tail';
import { normalizeWipPdfRowGroups } from './wip-pdf-color-row-groups';
import { drawWipPdfDataRowGroup, paginateWipPdfGroupedRows } from './wip-pdf-data-row-group';
import {
  WIP_PDF_FONT_COLOR_QTY,
  WIP_PDF_FONT_FABRIC_CONTENT_GSM,
  WIP_PDF_FONT_ITEM_DESCRIPTION,
} from './wip-pdf-readable-columns';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const V_MARGIN = 10;
const H_MARGIN = 14;
const HEADER_BLOCK_H = 102;
const TABLE_HEADER_ROW_H = 52;
/** Match Factory WIP milestone cell height (Target / Submission / Approval stack). */
const DATA_ROW_H = 96;
const FOOTER_H = 26;
const TITLE_BLUE = [0, 51, 153];
const RED = [200, 0, 0];
const PDF_TEXT_BLACK = [0, 0, 0];

const PAGE_W = 842;
const PAGE_H = 595;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/** Demo rows — replace with API rows when backend is ready. */
export const AMS_WIP_DEMO_ROWS = [
  {
    imageKind: 'swatch',
    swatch: { fill: [175, 220, 230] },
    poLines: ['38831-MP O-NAVY', 'LR3015', 'NA'],
    poQty: 3984,
    shipQty: 3768,
    balQty: 216,
    shipmentLines: ['03/15/2026', 'Factory Date', '03/15/2026'],
    mos: 'SEA',
    itemLines: ['MEN', 'MENS PULLOVER HOODY'],
    fabricLines: ['FLEECE', '80% COTTON 10% POLYESTER 10% RECYCLED', '280 GSM'],
    colorQty: '1- (NAVY_3984)',
    statusCells: ['0', '0', '0', '0', '0', '0', '0', '', '', '', '', ''],
    productionStatus: 'N/A',
  },
  {
    imageKind: 'none',
    poLines: ['38831-MC S-LAVE', 'LR3016', 'NA'],
    poQty: 1824,
    shipQty: 1512,
    balQty: 312,
    shipmentLines: ['03/15/2026', 'Factory Date', '03/15/2026'],
    mos: 'SEA',
    itemLines: ['MEN', 'CREW SWEAT'],
    fabricLines: ['FLEECE', '80% COTTON 10% POLYESTER 10% RECYCLED', '280 GSM'],
    colorQty: '1- (LAVENDER_1824)',
    statusCells: ['0', '0', '0', '0', '0', '0', '0', '', '', '', '', ''],
    productionStatus: 'N/A',
  },
];

const HEADERS = [
  'Image',
  'PO No.\n/ Style /\nProd Code',
  'PO QTY /\nShip Qty /\nBal. Qty',
  'Shipment',
  'MOS',
  'Item\nDescription',
  'Fabric /\nContent /\nGSM',
  'Color /\nQTY',
  'Lab\nDip',
  'Proto /\nFIT',
  'Dye Lot /\nBlanket',
  'Print Emb /\nStrike off',
  'PP Sample\nto',
  'Knitting /\nFabric in house',
  'Dying',
  'Cutting\nPCS',
  'Print /\nEmb. PCS',
  'Stitching',
  'Garment\nWash',
  'Packing\nPCS',
  'Production\nStatus',
];

const COL_WEIGHTS = [
  30, 46, 34, 28, 20, 30, 50, 32,
  34, 34, 34, 34, 34, 36, 32, 34, 36, 34, 34, 34,
  36,
];

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

function formatIsoToDdMonYyyy(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || '');
  const d = new Date(`${iso}T12:00:00`);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  return `${dd}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function formatPrintStamp() {
  const d = new Date();
  const dateRaw = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const date = dateRaw.replace(/ /g, '-');
  const time = d
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
  return `Print Date: ${date} ${time}`;
}

function drawBlueBoldUnderline(doc, text, x, y, maxW) {
  doc.setTextColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(String(text), maxW);
  let yy = y;
  lines.forEach((line) => {
    doc.text(line, x, yy);
    const tw = doc.getTextWidth(line);
    doc.setDrawColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
    doc.setLineWidth(0.35);
    doc.line(x, yy + 2, x + tw, yy + 2);
    yy += 12;
  });
  doc.setTextColor(0, 0, 0);
  return yy;
}

function drawCellBorder(doc, x, y, w, h, skipBorder = false) {
  if (skipBorder) return;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);
}

function drawHeaderCell(doc, x, y, w, h, headerText) {
  doc.setFillColor(220, 220, 222);
  doc.rect(x, y, w, h, 'F');
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const parts = String(headerText || '—')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) parts.push('—');

  let fs = 5.4;
  doc.setFontSize(fs);
  let lines = [];
  parts.forEach((p) => {
    lines.push(...doc.splitTextToSize(p, Math.max(4, w - 4)));
  });
  if (lines.length > 5) {
    fs = 4.7;
    doc.setFontSize(fs);
    lines = [];
    parts.forEach((p) => {
      lines.push(...doc.splitTextToSize(p, Math.max(4, w - 4)));
    });
  }

  const lineH = fs * 1.15;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  lines.slice(0, 7).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
      baseline: 'middle',
      maxWidth: w - 3,
    });
  });
}

function drawMultilineCell(doc, x, y, w, h, lines, align = 'left', fontSize = 5.6, textRgb = RED, opts = {}) {
  const { skipBorder = false } = opts;
  drawCellBorder(doc, x, y, w, h, skipBorder);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
  doc.setFontSize(fontSize);
  const maxW = Math.max(4, w - 4);
  const flat = [];
  (lines || []).forEach((ln) => {
    flat.push(...doc.splitTextToSize(String(ln), maxW));
  });
  const lineH = fontSize * 1.12;
  const block = flat.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  const xText = align === 'center' ? x + w / 2 : x + 2;
  flat.slice(0, 10).forEach((ln, i) => {
    doc.text(ln, xText, firstY + i * lineH, {
      align,
      baseline: 'middle',
      maxWidth: maxW,
    });
  });
  doc.setTextColor(0, 0, 0);
}

function inferPdfImageFormat(dataUrl) {
  const m = /^data:image\/([a-z0-9+.-]+);base64,/i.exec(String(dataUrl || ''));
  if (!m) return 'JPEG';
  const sub = m[1].toLowerCase();
  if (sub === 'jpeg' || sub === 'jpg' || sub === 'pjpeg') return 'JPEG';
  if (sub === 'png' || sub === 'x-png') return 'PNG';
  if (sub === 'gif') return 'GIF';
  if (sub === 'webp') return 'WEBP';
  return 'JPEG';
}

function fitImageInCell(x, y, w, h, naturalW, naturalH, pad = 2) {
  const innerW = Math.max(1, w - 2 * pad);
  const innerH = Math.max(1, h - 2 * pad);
  const nw = naturalW > 0 ? naturalW : 1;
  const nh = naturalH > 0 ? naturalH : 1;
  const scale = Math.min(innerW / nw, innerH / nh);
  const iw = nw * scale;
  const ih = nh * scale;
  const ix = x + pad + (innerW - iw) / 2;
  const iy = y + pad + (innerH - ih) / 2;
  return { ix, iy, iw, ih };
}

function drawImageCell(doc, x, y, w, h, row, opts = {}) {
  const { skipBorder = false } = opts;
  drawCellBorder(doc, x, y, w, h, skipBorder);
  if (row.imageKind === 'swatch' && row.swatch?.fill) {
    const [r, g, b] = row.swatch.fill;
    doc.setFillColor(r, g, b);
    doc.rect(x + 2, y + 2, w - 4, h - 4, 'F');
    if (row.swatch.stripe) {
      const [sr, sg, sb] = row.swatch.stripe;
      doc.setFillColor(sr, sg, sb);
      doc.rect(x + w * 0.55, y + 2, 4, h - 4, 'F');
    }
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(x + 2, y + 2, w - 4, h - 4, 'S');
    return;
  }

  const url = row.poImageDataUrl;
  const nw = Number(row._poImageNaturalW) || 0;
  const nh = Number(row._poImageNaturalH) || 0;
  if (typeof url === 'string' && url.length > 22 && nw > 0 && nh > 0) {
    const fmt = inferPdfImageFormat(url);
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 1, y + 1, w - 2, h - 2, 'F');
    const { ix, iy, iw, ih } = fitImageInCell(x, y, w, h, nw, nh, 2);
    try {
      doc.addImage(url, fmt, ix, iy, iw, ih, undefined, 'FAST');
    } catch {
      /* fall through to placeholder */
    }
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(x + 1, y + 1, w - 2, h - 2, 'S');
    return;
  }

  doc.setFillColor(232, 232, 232);
  doc.rect(x + 1, y + 1, w - 2, h - 2, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(x + 1, y + 1, w - 2, h - 2, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.9);
  doc.setTextColor(RED[0], RED[1], RED[2]);
  const cy = y + h / 2;
  doc.text('NO IMAGE', x + w / 2, cy - 4.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.text('AVAILABLE', x + w / 2, cy + 4.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.setTextColor(0, 0, 0);
}

function drawQtyStackCell(doc, x, y, w, h, row, opts = {}) {
  const { skipBorder = false } = opts;
  drawCellBorder(doc, x, y, w, h, skipBorder);
  const splitY = y + h * 0.42;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(x, splitY, x + w, splitY);

  const pad = 3;
  const rx = x + w - pad;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(RED[0], RED[1], RED[2]);

  const topMid = (y + splitY) / 2;
  doc.text(String(row.poQty ?? ''), rx, topMid - 5, { align: 'right', baseline: 'middle' });
  doc.text(String(row.shipQty ?? ''), rx, topMid + 5, { align: 'right', baseline: 'middle' });

  const yBal = (splitY + y + h) / 2;
  doc.text(String(row.balQty ?? ''), rx, yBal, { align: 'right', baseline: 'middle' });

  doc.setTextColor(0, 0, 0);
}

/** Three horizontal bands: customer ship date / label / factory date (reference PDF). */
function drawShipmentTripleCell(doc, x, y, w, h, lines, opts = {}) {
  const { skipBorder = false } = opts;
  drawCellBorder(doc, x, y, w, h, skipBorder);
  const a = Array.isArray(lines) && lines.length >= 3 ? lines : ['', '', ''];
  const y1 = y + h / 3;
  const y2 = y + (2 * h) / 3;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(x, y1, x + w, y1);
  doc.line(x, y2, x + w, y2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(RED[0], RED[1], RED[2]);
  doc.setFontSize(5.3);
  const centers = [(y + y1) / 2, (y1 + y2) / 2, (y2 + y + h) / 2];
  [0, 1, 2].forEach((idx) => {
    doc.text(String(a[idx] ?? ''), x + w / 2, centers[idx], {
      align: 'center',
      baseline: 'middle',
      maxWidth: w - 3,
    });
  });
  doc.setTextColor(0, 0, 0);
}

function drawCenterTextCell(doc, x, y, w, h, text, fontSize = 6, textRgb = RED, opts = {}) {
  const { skipBorder = false } = opts;
  drawCellBorder(doc, x, y, w, h, skipBorder);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
  doc.setFontSize(fontSize);
  doc.text(String(text ?? ''), x + w / 2, y + h / 2, {
    align: 'center',
    baseline: 'middle',
    maxWidth: w - 3,
  });
  doc.setTextColor(0, 0, 0);
}

function getRowPdfTextRgb(row) {
  const rgb = row?._pdfTextRgb;
  if (Array.isArray(rgb) && rgb.length === 3) return rgb;
  return RED;
}

function parseMilestonePdfLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { mode: 'empty', pairs: [], status: '' };
  }
  if (lines.length === 1 && String(lines[0]).trim() === 'Not Required') {
    return { mode: 'notRequired', pairs: [], status: 'Not Required' };
  }
  if (lines.length === 1 && String(lines[0]).trim() === '0') {
    return { mode: 'notRequired', pairs: [], status: '0' };
  }
  const copy = lines.map((x) => String(x ?? ''));
  const status = copy.length ? String(copy.pop()).trim() : '';
  const pairs = [];
  for (let i = 0; i < copy.length; ) {
    const label = copy[i]?.trim();
    if (
      label === 'Target Date' ||
      label === 'Submission' ||
      label === 'Approval' ||
      label === 'Remarks' ||
      label === 'Qty'
    ) {
      pairs.push({ label, value: String(copy[i + 1] ?? '') });
      i += 2;
    } else {
      i += 1;
    }
  }
  return { mode: 'detail', pairs, status };
}

/** Same milestone body renderer as Factory WIP PDF — labels only in header row. */
function drawMilestoneDataCell(doc, x, y, w, h, lines, rowRgb) {
  const textRgb = rowRgb;
  const padX = 2;
  const maxW = Math.max(4, w - 2 * padX);

  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h, 'S');

  const parsed = parseMilestonePdfLines(lines ?? []);
  const padTopBody = 5;
  const LABEL_FS = 4.5;
  const VALUE_FS = 5.55;
  const STATUS_FS = 5.55;
  const labelLead = LABEL_FS * 1.22;
  const valueLead = VALUE_FS * 1.22;
  const pairGap = 3.15;
  const statusReserve = Math.min(18, Math.max(13, STATUS_FS * 1.28 + 3));

  if (parsed.mode === 'notRequired') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.05);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.text(parsed.status, x + w / 2, y + h / 2, { align: 'center', baseline: 'middle', maxWidth: maxW });
    doc.setTextColor(PDF_TEXT_BLACK[0], PDF_TEXT_BLACK[1], PDF_TEXT_BLACK[2]);
    return;
  }

  if (parsed.mode === 'empty') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.9);
    doc.setTextColor(120, 120, 120);
    doc.text('—', x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
    doc.setTextColor(PDF_TEXT_BLACK[0], PDF_TEXT_BLACK[1], PDF_TEXT_BLACK[2]);
    return;
  }

  let cy = y + padTopBody;
  const contentBottom = y + h - statusReserve - 2;

  doc.setFont('helvetica', 'bold');
  parsed.pairs.forEach(({ label, value }) => {
    if (cy > contentBottom - labelLead - valueLead - 1) return;
    doc.setFontSize(LABEL_FS);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    const lw = doc.splitTextToSize(label, maxW);
    lw.slice(0, 2).forEach((ln) => {
      if (cy > contentBottom) return;
      doc.text(ln, x + w / 2, cy, { align: 'center', baseline: 'top', maxWidth: maxW });
      cy += labelLead;
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(VALUE_FS);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    const vw = doc.splitTextToSize(String(value || ''), maxW);
    vw.slice(0, 2).forEach((ln) => {
      if (cy > contentBottom) return;
      doc.text(ln, x + w / 2, cy, { align: 'center', baseline: 'top', maxWidth: maxW });
      cy += valueLead;
    });
    cy += pairGap;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(STATUS_FS);
  doc.setTextColor(rowRgb[0], rowRgb[1], rowRgb[2]);
  doc.text(String(parsed.status || ''), x + w / 2, y + h - 4, { align: 'center', baseline: 'bottom', maxWidth: maxW });
  doc.setTextColor(PDF_TEXT_BLACK[0], PDF_TEXT_BLACK[1], PDF_TEXT_BLACK[2]);
}

function drawTableHeaderRow(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  for (let i = 0; i < HEADERS.length; i += 1) {
    drawHeaderCell(doc, xs[i], y, widths[i], TABLE_HEADER_ROW_H, HEADERS[i]);
  }
  return y + TABLE_HEADER_ROW_H;
}

function normalizeRow(row) {
  const shipmentLines =
    Array.isArray(row.shipmentLines) && row.shipmentLines.length >= 3
      ? row.shipmentLines
      : [row.customerShipDate || row.shipment || '', 'Factory Date', row.factoryShipDate || row.shipment || ''];

  return { ...row, shipmentLines };
}

function drawMilestoneAndProdTail(doc, xs, y, widths, row, startIndex, rowH) {
  const rgb = getRowPdfTextRgb(row);
  drawWipPdfMilestoneAndProdTail({
    doc,
    xs,
    y,
    widths,
    row,
    startIndex,
    rowH,
    rgb,
    drawMilestoneDataCell,
    drawMultilineCell,
  });
}

function drawMergedLeadCellsAms(doc, xs, y, widths, h, rowRaw) {
  const row = normalizeRow(rowRaw);
  const rgb = getRowPdfTextRgb(row);
  const skip = { skipBorder: true };
  let i = 0;
  drawImageCell(doc, xs[i], y, widths[i], h, row, skip);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], h, row.poLines, 'left', 5.5, rgb, skip);
  i += 1;
  drawQtyStackCell(doc, xs[i], y, widths[i], h, row, skip);
  i += 1;
  drawShipmentTripleCell(doc, xs[i], y, widths[i], h, row.shipmentLines, skip);
  i += 1;
  drawCenterTextCell(doc, xs[i], y, widths[i], h, row.mos, 5.8, rgb, skip);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], h, row.itemLines, 'left', WIP_PDF_FONT_ITEM_DESCRIPTION, rgb, skip);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], h, row.fabricLines, 'left', WIP_PDF_FONT_FABRIC_CONTENT_GSM, rgb, skip);
}

function drawColorTailRowAms(doc, xs, yRow, widths, rowRaw, mergeCount, rowH) {
  const row = normalizeRow(rowRaw);
  const colorLine = getWipColorQtyDisplayLines(row)[0] || '—';
  drawMultilineCell(doc, xs[mergeCount], yRow, widths[mergeCount], rowH, [colorLine], 'left', WIP_PDF_FONT_COLOR_QTY);
  drawMilestoneAndProdTail(doc, xs, yRow, widths, row, mergeCount + 1, rowH);
}

function drawDataRowGroup(doc, y, x0, widths, chunkRows, displayRow) {
  return drawWipPdfDataRowGroup({
    doc,
    y,
    x0,
    widths,
    rowH: DATA_ROW_H,
    chunkRows,
    displayRow,
    drawMergedLeadCells: drawMergedLeadCellsAms,
    drawColorTailRow: drawColorTailRowAms,
  });
}

function drawDataRow(doc, y, x0, widths, rowRaw) {
  const row = normalizeRow(rowRaw);
  return drawDataRowGroup(doc, y, x0, widths, [row], row);
}

function drawOuterTableFrame(doc, x, y, w, h) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.45);
  doc.rect(x, y, w, h);
}

function drawPageHeader(doc, logoDataUrl, meta) {
  const innerLeft = H_MARGIN;
  const innerRight = PAGE_W - H_MARGIN;
  const logoW = 78;
  const logoH = 32;
  const logoX = innerRight - logoW;
  const logoY = V_MARGIN + 4;
  const leftMaxW = Math.max(120, logoX - innerLeft - 8);

  let y = V_MARGIN + 10;
  y =
    drawBlueBoldUnderline(doc, 'AMS WIP Report / Summary of Production Status', innerLeft, y, leftMaxW) + 2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8.2);
  doc.text(`Customer: ${meta.customerLabel ?? 'All'}`, innerLeft, y);
  y += 11;
  doc.text(`Supplier: ${meta.supplierLabel ?? 'All'}`, innerLeft, y);
  y += 11;
  doc.text(`Merchant: ${meta.merchantLabel ?? '—'}`, innerLeft, y);
  y += 11;
  const fromH = formatIsoToDdMonYyyy(meta.fromDate);
  const toH = formatIsoToDdMonYyyy(meta.toDate);
  doc.text(`Date From: ${fromH}    Date To: ${toH}`, innerLeft, y);
  y += 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(60, 60, 60);
  doc.text('* These dates belongs to customer ship date as per PO.', innerLeft, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  const tableTop = V_MARGIN + HEADER_BLOCK_H;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.text(formatPrintStamp(), innerRight, tableTop - 4, { align: 'right', baseline: 'bottom' });

  return tableTop;
}

function drawFooter(doc, pageIndex, totalPages) {
  const fy = PAGE_H - V_MARGIN - 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text(`Page ${pageIndex} of ${totalPages}`, H_MARGIN + 2, fy, { baseline: 'bottom' });
  doc.text('Powered by : INTERACTIVE TECHNOLOGIES GATEWAY', PAGE_W / 2, fy, {
    align: 'center',
    baseline: 'bottom',
  });
  const sigW = 72;
  const sigX = PAGE_W - H_MARGIN - sigW;
  doc.setLineWidth(0.35);
  doc.line(sigX, fy - 10, sigX + sigW, fy - 10);
  doc.setFontSize(6.8);
  doc.text('Head of Dept.', sigX + sigW / 2, fy - 2, { align: 'center', baseline: 'bottom' });
}

/**
 * @param {object[] | { displayRow: object; colorRows: object[] }[]} [rows]
 * @param {{
 *   customerLabel?: string;
 *   supplierLabel?: string;
 *   merchantLabel?: string;
 *   fromDate?: string;
 *   toDate?: string;
 * }} [meta]
 */
export async function buildAmsWipPdfBlobFromRows(rows, meta = {}) {
  const groups = normalizeWipPdfRowGroups(Array.isArray(rows) ? rows : []);
  const flatForImages = groups.flatMap((g) => [g.displayRow, ...g.colorRows]);
  await attachFactoryWipPoImageDimensions(flatForImages);
  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });

  /**
   * PDF document title — Chrome/Edge's built-in PDF viewer uses this for the
   * browser tab title, so the preview tab reads "AMS Report" instead of the
   * raw `blob:` URL.
   */
  try {
    doc.setProperties({ title: 'AMS Report' });
  } catch {
    /* setProperties unavailable — non-fatal, preview still works */
  }
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(innerW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let tableSegTop = 0;
  let y = 0;

  const startPage = () => {
    const tableTop = drawPageHeader(doc, logoDataUrl, meta);
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

  paginateWipPdfGroupedRows({
    doc,
    groups,
    rowH: DATA_ROW_H,
    pageBodyBottom,
    getY: () => y,
    setY: (ny) => {
      y = ny;
    },
    startPage,
    flushSegmentFrame,
    pageSize: [PAGE_W, PAGE_H],
    drawRowGroup: (cy, chunkRows, displayRow) =>
      drawDataRowGroup(doc, cy, innerLeft, widths, chunkRows, displayRow),
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
export function openAmsWipPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'AMS_Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
