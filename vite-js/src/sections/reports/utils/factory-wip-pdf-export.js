import jsPDF from 'jspdf';

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
/** Body row height — milestone cells use spaced label/value rows (no repeat of column titles). */
const DATA_ROW_H = 96;
const FOOTER_H = 26;
const TITLE_BLUE = [0, 51, 153];
const RED = [200, 0, 0];
/** Table header row fill (light gray). */
const HEADER_FILL_GRAY = [244, 244, 244];

const PAGE_W = 842;
const PAGE_H = 595;

export const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/** Demo rows — replace with API rows when backend is ready. */
export const FACTORY_WIP_DEMO_ROWS = [
  {
    imageKind: 'none',
    poLines: ['38831-MCS-L AVE', 'LR3016', 'NA'],
    poQty: 1824,
    shipQty: 1512,
    balQty: 312,
    shipment: '03-15-2026',
    mos: 'Sea',
    fabricLines: ['Fleece', '80% cotton 10% polyester 10% recycled polyester', '280 gsm'],
    itemLines: ['Men', 'Crew sweat'],
    colorQty: '1-(LAVENDER_1824)',
    statusNums: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    statusCellLines: Array.from({ length: 12 }, () => ['Not Required']),
    productionStatusLines: ['N/A'],
    productionStatus: 'N/A',
  },
  {
    imageKind: 'swatch',
    swatch: { fill: [175, 220, 230] },
    poLines: ['38831-MPO-NAVY', 'LR3015', 'NA'],
    poQty: 3984,
    shipQty: 3768,
    balQty: 216,
    shipment: '03-15-2026',
    mos: 'N/A',
    fabricLines: ['Fleece', '80% cotton 10% polyester 10% recycled polyester', '280 gsm'],
    itemLines: ['Men', 'Mens pullover hoody'],
    colorQty: '1-(NAVY_3984)',
    statusNums: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    statusCellLines: Array.from({ length: 12 }, () => ['Not Required']),
    productionStatusLines: ['N/A'],
    productionStatus: 'N/A',
  },
  {
    imageKind: 'swatch',
    swatch: { fill: [35, 35, 38], stripe: [180, 30, 40] },
    poLines: ['202301-769', '769', 'NA'],
    poQty: 2880,
    shipQty: 2664,
    balQty: 216,
    shipment: '03-15-2026',
    mos: 'N/A',
    fabricLines: ['TRICOT', '100% POLYESTER', '220 GSM'],
    itemLines: ['boys', 'Tricot Jogger'],
    colorQty: '1-(BLACK_2880)',
    statusNums: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    statusCellLines: Array.from({ length: 12 }, () => ['Not Required']),
    productionStatusLines: ['N/A'],
    productionStatus: 'N/A',
  },
];

const HEADERS = [
  'Image',
  /** Three separate stacked labels — spacing handled in `drawHeaderCell` for col 1. */
  'PO No.\n/ Style /\nProd Code',
  'PO QTY /\nShip Qty /\nBal. Qty',
  'Shipment',
  'MOS',
  'Fabric /\nContent /\nGSM',
  'Item\nDescription',
  'Color /\nQTY',
  'Lab\nDip',
  'Proto /\nFIT',
  'Dye Lot /\nBlanket',
  'Print Emb /\nStrike off',
  'PP Sample\nto Buyer',
  'Knitting /\nFabric in house',
  'Dying',
  'Cutting\nPCS',
  'Print /\nEmb. PCS',
  'Stitching\nPCS',
  'Garment\nWash',
  'Packing\nPCS',
  'Production\nStatus',
];

/** Relative weights → scaled to inner table width (milestone cols widened; lead cols trimmed). */
const COL_WEIGHTS = [
  30, 46, 34, 28, 20, 50, 30, 32,
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

function drawHeaderCell(doc, x, y, w, h, headerText, colIndex = -1) {
  doc.setFillColor(HEADER_FILL_GRAY[0], HEADER_FILL_GRAY[1], HEADER_FILL_GRAY[2]);
  doc.rect(x, y, w, h, 'F');
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const parts = String(headerText || '—')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) parts.push('—');

  /** PO / Style / Prod column: three distinct lines with extra vertical gap (reference PDF). */
  const isPoTripleHeader = colIndex === 1;
  const padX = isPoTripleHeader ? 5 : 4;

  let fs = 5.4;
  doc.setFontSize(fs);
  let lines = [];
  parts.forEach((p) => {
    lines.push(...doc.splitTextToSize(p, Math.max(4, w - 2 * padX)));
  });
  if (lines.length > 5) {
    fs = 4.7;
    doc.setFontSize(fs);
    lines = [];
    parts.forEach((p) => {
      lines.push(...doc.splitTextToSize(p, Math.max(4, w - 2 * padX)));
    });
  }

  const lineH = fs * (isPoTripleHeader ? 1.42 : 1.15);
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  lines.slice(0, 7).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
      baseline: 'middle',
      maxWidth: w - 2 * padX,
    });
  });
}

function drawMultilineCell(doc, x, y, w, h, lines, align = 'left', fontSize = 5.6, textRgb = RED, opts = {}) {
  const { lineMult = 1.12, maxLines = 10, padX = 2, padTop = 2, vertical = 'middle', skipBorder = false } = opts;
  drawCellBorder(doc, x, y, w, h, skipBorder);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
  doc.setFontSize(fontSize);
  const maxW = Math.max(4, w - 2 * padX);
  const flat = [];
  (lines || []).forEach((ln) => {
    flat.push(...doc.splitTextToSize(String(ln), maxW));
  });
  const lineH = fontSize * lineMult;
  const xText = align === 'center' ? x + w / 2 : x + padX;
  const slice = flat.slice(0, maxLines);

  if (vertical === 'top') {
    let yy = y + padTop;
    const maxY = y + h - padTop;
    slice.forEach((ln) => {
      if (yy + lineH > maxY + 0.5) return;
      doc.text(ln, xText, yy, {
        align,
        baseline: 'top',
        maxWidth: maxW,
      });
      yy += lineH;
    });
  } else {
    const block = slice.length * lineH;
    const yMid = y + h / 2;
    const firstY = yMid - (block - lineH) / 2;
    slice.forEach((ln, i) => {
      doc.text(ln, xText, firstY + i * lineH, {
        align,
        baseline: 'middle',
        maxWidth: maxW,
      });
    });
  }
  doc.setTextColor(0, 0, 0);
}

/**
 * PO No. → Style → Prod Code: three stacked lines, top-aligned, fixed vertical gap (reference layout).
 */
function drawPoStackCell(doc, x, y, w, h, lines, textRgb, opts = {}) {
  const { skipBorder = false } = opts;
  drawCellBorder(doc, x, y, w, h, skipBorder);
  const padX = 5.5;
  const padY = 6.5;
  const fs = 6;
  /** Space between each printed line (PO / Style / Prod — uniform gaps). */
  const lineGap = 13.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fs);
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
  const maxW = Math.max(4, w - 2 * padX);
  const rawList = Array.isArray(lines) ? lines : [];
  const parts = [0, 1, 2].map((idx) => {
    const v = rawList[idx];
    if (v != null && String(v).trim() !== '') return String(v).trim();
    if (idx === 0) return '—';
    return 'NA';
  });
  const flatLines = [];
  parts.forEach((segment) => {
    doc.splitTextToSize(segment, maxW)
      .slice(0, 2)
      .forEach((ln) => flatLines.push(ln));
  });
  const blockH = Math.max(lineGap, flatLines.length * lineGap);
  let yLine = skipBorder && h > DATA_ROW_H * 1.15 ? y + (h - blockH) / 2 : y + padY;
  const maxY = y + h - padY;
  flatLines.forEach((ln) => {
    if (yLine > maxY - 2) return;
    doc.text(ln, x + w / 2, yLine, { align: 'center', baseline: 'top', maxWidth: maxW });
    yLine += lineGap;
  });
  doc.setTextColor(0, 0, 0);
}

const PDF_TEXT_BLACK = [0, 0, 0];

/**
 * Parse milestone cell line stack from `buildMilestoneCellLines` / PDF fallback arrays.
 * @param {string[]} lines
 * @returns {{ mode: 'empty'|'notRequired'|'detail'; pairs: { label: string; value: string }[]; status: string }}
 */
function parseMilestonePdfLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { mode: 'empty', pairs: [], status: '' };
  }
  if (lines.length === 1 && String(lines[0]).trim() === 'Not Required') {
    return { mode: 'notRequired', pairs: [], status: 'Not Required' };
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

/**
 * Milestone data cell: white body, thin border — column titles appear only in the table header row.
 * Label/value/status text use row color (red only when API row is delayed via `_pdfTextRgb`).
 */
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
    doc.setTextColor(0, 0, 0);
    return;
  }

  if (parsed.mode === 'empty') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.9);
    doc.setTextColor(120, 120, 120);
    doc.text('—', x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
    doc.setTextColor(0, 0, 0);
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
  doc.setTextColor(0, 0, 0);
}

function getRowPdfTextRgb(row) {
  const rgb = row?._pdfTextRgb;
  if (Array.isArray(rgb) && rgb.length === 3) return rgb;
  return PDF_TEXT_BLACK;
}

/** jsPDF `addImage` format string from a data URL mime segment. */
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

/** Fit natural image size inside cell padding; preserves aspect ratio (letterbox). */
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

function drawImageCellPlaceholder(doc, x, y, w, h, row) {
  doc.setFillColor(232, 232, 232);
  doc.rect(x + 1, y + 1, w - 2, h - 2, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(x + 1, y + 1, w - 2, h - 2, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.9);
  const phRgb = getRowPdfTextRgb(row);
  doc.setTextColor(phRgb[0], phRgb[1], phRgb[2]);
  const cy = y + h / 2;
  doc.text('NO IMAGE', x + w / 2, cy - 4.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.text('AVAILABLE', x + w / 2, cy + 4.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.setTextColor(0, 0, 0);
}

/**
 * Decode each row's `poImageDataUrl` once to get natural dimensions for PDF layout (aspect fit).
 * Mutates rows with `_poImageNaturalW` / `_poImageNaturalH` (0 on missing/invalid).
 * @param {object[]} rows
 */
export async function attachFactoryWipPoImageDimensions(rows) {
  const list = Array.isArray(rows) ? rows : [];
  await Promise.all(
    list.map(
      (row) =>
        new Promise((resolve) => {
          const url = row?.poImageDataUrl;
          if (typeof url !== 'string' || url.length < 24 || !/^data:image\//i.test(url)) {
            row._poImageNaturalW = 0;
            row._poImageNaturalH = 0;
            resolve();
            return;
          }
          const img = document.createElement('img');
          let settled = false;
          const done = (w, h) => {
            if (settled) return;
            settled = true;
            row._poImageNaturalW = w;
            row._poImageNaturalH = h;
            resolve();
          };
          img.onload = () => done(img.naturalWidth || 0, img.naturalHeight || 0);
          img.onerror = () => done(0, 0);
          try {
            img.src = url;
            if (img.complete) {
              done(img.naturalWidth || 0, img.naturalHeight || 0);
            }
          } catch {
            done(0, 0);
          }
        })
    )
  );
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
      drawImageCellPlaceholder(doc, x, y, w, h, row);
      return;
    }
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(x + 1, y + 1, w - 2, h - 2, 'S');
    return;
  }

  drawImageCellPlaceholder(doc, x, y, w, h, row);
}

function drawQtyStackCell(doc, x, y, w, h, row, opts = {}) {
  const { skipBorder = false } = opts;
  drawCellBorder(doc, x, y, w, h, skipBorder);
  const rgb = getRowPdfTextRgb(row);

  /** Upper band: PO Qty + Ship Qty; lower band: Bal Qty — divider matches reference PDF. */
  const splitY = y + h * 0.42;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(x, splitY, x + w, splitY);

  const cx = x + w / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  const topMid = (y + splitY) / 2;
  const yPo = topMid - 5;
  const yShip = topMid + 5;
  doc.text(String(row.poQty ?? ''), cx, yPo, { align: 'center', baseline: 'middle' });
  doc.text(String(row.shipQty ?? ''), cx, yShip, { align: 'center', baseline: 'middle' });

  const yBal = (splitY + y + h) / 2;
  doc.text(String(row.balQty ?? ''), cx, yBal, { align: 'center', baseline: 'middle' });

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

function drawTableHeaderRow(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  for (let i = 0; i < HEADERS.length; i += 1) {
    drawHeaderCell(doc, xs[i], y, widths[i], TABLE_HEADER_ROW_H, HEADERS[i], i);
  }
  return y + TABLE_HEADER_ROW_H;
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

function drawMergedLeadCellsFactory(doc, xs, y, widths, h, row) {
  const rgb = getRowPdfTextRgb(row);
  const skip = { skipBorder: true };
  let i = 0;
  drawImageCell(doc, xs[i], y, widths[i], h, row, skip);
  i += 1;
  drawPoStackCell(doc, xs[i], y, widths[i], h, row.poLines, rgb, skip);
  i += 1;
  drawQtyStackCell(doc, xs[i], y, widths[i], h, row, skip);
  i += 1;
  drawCenterTextCell(doc, xs[i], y, widths[i], h, row.shipment, 6, rgb, skip);
  i += 1;
  drawCenterTextCell(doc, xs[i], y, widths[i], h, row.mos ?? 'N/A', 5.75, rgb, skip);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], h, row.fabricLines, 'center', WIP_PDF_FONT_FABRIC_CONTENT_GSM, rgb, skip);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], h, row.itemLines, 'center', WIP_PDF_FONT_ITEM_DESCRIPTION, rgb, skip);
}

function drawColorTailRowFactory(doc, xs, yRow, widths, row, mergeCount, rowH) {
  const rgb = getRowPdfTextRgb(row);
  const colorLine = getWipColorQtyDisplayLines(row)[0] || '—';
  drawMultilineCell(doc, xs[mergeCount], yRow, widths[mergeCount], rowH, [colorLine], 'left', WIP_PDF_FONT_COLOR_QTY, rgb, {
    maxLines: 2,
    lineMult: 1.12,
    padX: 2,
    padTop: 3,
    vertical: 'top',
  });
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
    drawMergedLeadCells: drawMergedLeadCellsFactory,
    drawColorTailRow: drawColorTailRowFactory,
  });
}

function drawDataRow(doc, y, x0, widths, row) {
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
  y = drawBlueBoldUnderline(doc, 'Factory WIP Report', innerLeft, y, leftMaxW) + 2;
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
  doc.text('* These dates belongs to supplier ship date as per PO.', innerLeft, y);
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
 * @param {object[] | { displayRow: object; colorRows: object[] }[]} [rows] — flat mapped rows or grouped color rows
 * @param {{
 *   customerLabel?: string;
 *   supplierLabel?: string;
 *   merchantLabel?: string;
 *   fromDate?: string;
 *   toDate?: string;
 * }} [meta]
 */
export async function buildFactoryWipPdfBlobFromRows(rows, meta = {}) {
  const groups = normalizeWipPdfRowGroups(Array.isArray(rows) ? rows : []);
  const flatForImages = groups.flatMap((g) => [g.displayRow, ...g.colorRows]);
  await attachFactoryWipPoImageDimensions(flatForImages);
  // eslint-disable-next-line new-cap -- jsPDF default export constructor
  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });

  /**
   * PDF document title — Chrome/Edge's built-in PDF viewer uses this for the
   * browser tab title, so the preview tab reads "Factory Report" instead of
   * the raw `blob:` URL.
   */
  try {
    doc.setProperties({ title: 'Factory Report' });
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
export function openFactoryWipPdf(mode, pdfBlob, previewWindow = null) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    if (previewWindow && !previewWindow.closed) {
      try {
        previewWindow.location.replace(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`);
        previewWindow.focus?.();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 600_000);
        return;
      } catch {
        /* fall through to window.open */
      }
    }
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Factory_Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
