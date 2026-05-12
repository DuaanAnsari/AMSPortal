import jsPDF from 'jspdf';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const V_MARGIN = 10;
const H_MARGIN = 14;
const HEADER_BLOCK_H = 102;
const TABLE_HEADER_ROW_H = 40;
const DATA_ROW_H = 62;
const FOOTER_H = 26;
const TITLE_BLUE = [0, 51, 153];
const RED = [200, 0, 0];

const PAGE_W = 842;
const PAGE_H = 595;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

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
    productionStatus: 'N/A',
  },
];

const HEADERS = [
  'Image',
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

/** Relative weights → scaled to inner table width. */
const COL_WEIGHTS = [
  38, 52, 40, 34, 26, 68, 36, 40, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 44,
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

function drawCellBorder(doc, x, y, w, h) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);
}

function drawHeaderCell(doc, x, y, w, h, headerText) {
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

function drawMultilineCell(doc, x, y, w, h, lines, align = 'left', fontSize = 5.6) {
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(RED[0], RED[1], RED[2]);
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

function drawImageCell(doc, x, y, w, h, row) {
  drawCellBorder(doc, x, y, w, h);
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

function drawQtyStackCell(doc, x, y, w, h, row) {
  drawCellBorder(doc, x, y, w, h);

  /** Upper band: PO Qty + Ship Qty; lower band: Bal Qty — divider matches reference PDF. */
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
  const yPo = topMid - 5;
  const yShip = topMid + 5;
  doc.text(String(row.poQty ?? ''), rx, yPo, { align: 'right', baseline: 'middle' });
  doc.text(String(row.shipQty ?? ''), rx, yShip, { align: 'right', baseline: 'middle' });

  const yBal = (splitY + y + h) / 2;
  doc.text(String(row.balQty ?? ''), rx, yBal, { align: 'right', baseline: 'middle' });

  doc.setTextColor(0, 0, 0);
}

function drawCenterTextCell(doc, x, y, w, h, text, fontSize = 6) {
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(RED[0], RED[1], RED[2]);
  doc.setFontSize(fontSize);
  doc.text(String(text ?? ''), x + w / 2, y + h / 2, {
    align: 'center',
    baseline: 'middle',
    maxWidth: w - 3,
  });
  doc.setTextColor(0, 0, 0);
}

function drawRedZeroCell(doc, x, y, w, h, val) {
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(RED[0], RED[1], RED[2]);
  doc.text(String(val ?? '0'), x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
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
  drawImageCell(doc, xs[i], y, widths[i], DATA_ROW_H, row);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.poLines, 'left', 5.5);
  i += 1;
  drawQtyStackCell(doc, xs[i], y, widths[i], DATA_ROW_H, row);
  i += 1;
  drawCenterTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.shipment, 6);
  i += 1;
  drawCenterTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.mos, 5.8);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.fabricLines, 'left', 5.2);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.itemLines, 'left', 5.6);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], DATA_ROW_H, [row.colorQty], 'left', 5.4);
  i += 1;
  const nums = row.statusNums || [];
  for (let k = 0; k < 12; k += 1) {
    drawRedZeroCell(doc, xs[i], y, widths[i], DATA_ROW_H, nums[k] ?? 0);
    i += 1;
  }
  drawCenterTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.productionStatus, 6);
  return y + DATA_ROW_H;
}

function drawOuterTableFrame(doc, x, y, w, h) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.45);
  doc.rect(x, y, w, h);
}

function drawPageHeader(doc, logoDataUrl, meta) {
  const innerLeft = H_MARGIN;
  const innerRight = PAGE_W - H_MARGIN;
  const innerW = innerRight - innerLeft;
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
 * @param {object[]} [rows] — when empty or omitted, uses {@link FACTORY_WIP_DEMO_ROWS}
 * @param {{
 *   customerLabel?: string;
 *   supplierLabel?: string;
 *   merchantLabel?: string;
 *   fromDate?: string;
 *   toDate?: string;
 * }} [meta]
 */
export async function buildFactoryWipPdfBlobFromRows(rows, meta = {}) {
  const data =
    Array.isArray(rows) && rows.length > 0 ? rows : FACTORY_WIP_DEMO_ROWS;
  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(innerW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let tableSegTop = 0;
  let y = 0;
  let segHeight = 0;

  const startPage = () => {
    const tableTop = drawPageHeader(doc, logoDataUrl, meta);
    tableSegTop = tableTop;
    y = drawTableHeaderRow(doc, tableTop, innerLeft, widths);
    segHeight = TABLE_HEADER_ROW_H;
  };

  const flushSegmentFrame = () => {
    const h = y - tableSegTop;
    if (h > 0) {
      drawOuterTableFrame(doc, innerLeft, tableSegTop, innerW, h);
    }
  };

  startPage();

  data.forEach((row) => {
    if (y + DATA_ROW_H > pageBodyBottom) {
      flushSegmentFrame();
      doc.addPage([PAGE_W, PAGE_H], 'l');
      startPage();
    }
    y = drawDataRow(doc, y, innerLeft, widths, row);
    segHeight += DATA_ROW_H;
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
export function openFactoryWipPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Factory-WIP-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
