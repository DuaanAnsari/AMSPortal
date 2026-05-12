import jsPDF from 'jspdf';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const V_MARGIN = 6;
const H_MARGIN = 4;
const HEADER_BLOCK_H = 118;
const TABLE_HEADER_ROW_H = 56;
const DATA_ROW_H = 78;
const FOOTER_H = 26;
const TITLE_BLUE = [0, 51, 153];
/** Grid body text — switched from red to black per latest design. */
const DATA_TEXT = [0, 0, 0];

/** Wide landscape — extra horizontal room so 10-char dates (e.g. `01/29/2026`) fit inside the 16 narrow status cells without clipping into the next column. */
const PAGE_W = 1100;
const PAGE_H = 595;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/**
 * Process columns (after Ex Factory). 16 status cells; demo values are `'0'` until API rows are bound.
 */
const STATUS_HEADERS = [
  'PO SENT\nTO\nFACTORY',
  'TP / ART\nSENT TO\nFACTORY',
  'FIT\nSAMPLES',
  '1ST\nSUBMISSION\nOF LD',
  '1ST SCREEN\n/AOP / TRIM',
  '1ST PP\nSAMPLES',
  '2ND PP\nSAMPLES',
  'TOP\nSAMPLES',
  'TEST\nREPORT BY\nEMAIL',
  'YARN IN\nHOUSE',
  'KNITTING',
  'DYEING',
  'CUTTING',
  'STITCHIN\nG (INLINE)',
  'FINISHING',
  'PACKED /\nSHIPPED',
];

const HEADERS = [
  'IMAGE',
  'PRODUCT\nNUMBER',
  'DESCRIPTION',
  'PO #',
  'GENDER',
  'CUSTOMER',
  'Brand',
  'BODY\nCOLOR',
  'PRICE\nTICKET',
  'DELIVER\nTO',
  'TTL\nQTY',
  'CUST.\nCANCEL',
  'EX\nFACTORY',
  ...STATUS_HEADERS,
];

/**
 * 29 columns. Status cells weight bumped (22 → 28) so a full date such as `01/29/2026`
 * fits each cell without being clipped by the next column boundary on the wide landscape page.
 */
const COL_WEIGHTS = [
  36, 32, 46, 36, 22, 30, 36, 50, 24, 26, 22, 24, 32,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 30,
];

/** Demo rows — replace with API rows when backend is ready. */
export const CUSTOMISED_CUSTOMER_WIP_DEMO_ROWS = [
  {
    imageKind: 'swatch',
    swatch: { fill: [175, 220, 230] },
    productNumber: 'LR3015',
    description: 'MENS\nPULLOVER\nHOODY',
    poNo: '38851-MPO\n-NAVY',
    gender: 'Men',
    customer: '',
    brand: 'Gentle\nThreads',
    bodyColor: ['1-', '(NAVY_3984', ')'],
    priceTicket: '0',
    deliverTo: 'NEW\nYORK',
    ttlQty: 3984,
    custCancel: '-',
    exFactory: ['01/29/2026', '03/15/2026'],
    statusCells: ['01/29/2026', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
  },
  {
    imageKind: 'none',
    productNumber: 'LR3316',
    description: 'CREW SWEAT',
    poNo: '38851-MCS\n-LAVE',
    gender: 'Men',
    customer: '',
    brand: 'Gentle\nThreads',
    bodyColor: ['1-', '(LAVENDER', '_1824 )'],
    priceTicket: '0',
    deliverTo: 'NEW\nYORK',
    ttlQty: 1824,
    custCancel: '-',
    exFactory: ['01/29/2026', '03/15/2026'],
    statusCells: ['01/29/2026', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
  },
  {
    imageKind: 'swatch',
    swatch: { fill: [80, 90, 100] },
    productNumber: '988',
    description: 'LIS SHIRT',
    poNo: '2023/00-98\n8',
    gender: 'boys',
    customer: '',
    brand: 'ULTIMATE\nAPPARELS',
    bodyColor: [
      '1- (BLACK_300 )',
      '2- (MEDIUM',
      'GREY',
      'HEATHER_3',
      '00 )',
      '3-',
      '(PEACOAT_3',
      '00 )',
      '4- (TANGO',
      'RED_300 )',
    ],
    priceTicket: '0',
    deliverTo: 'New York',
    ttlQty: 1200,
    custCancel: '-',
    exFactory: ['01/19/2026', '04/15/2026'],
    statusCells: ['01/19/2026', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
  },
  {
    imageKind: 'none',
    productNumber: '318',
    description: 'LIS SHIRT',
    poNo: '2023/00-31\n8',
    gender: 'boys',
    customer: '',
    brand: 'ULTIMATE\nAPPARELS',
    bodyColor: [
      '1-',
      '(HEATHER',
      'GREY_768 )',
      '2-',
      '(PEACOAT_7',
      '68 )',
      '3- (RED_768',
      ')',
      '4- (STONE',
      'GREEN_768',
      ')',
    ],
    priceTicket: '0',
    deliverTo: 'New York',
    ttlQty: 3144,
    custCancel: '-',
    exFactory: ['01/19/2026', '04/15/2026'],
    statusCells: ['01/19/2026', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
  },
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

  let fs = 5;
  doc.setFontSize(fs);
  let lines = [];
  parts.forEach((p) => {
    lines.push(...doc.splitTextToSize(p, Math.max(3, w - 3)));
  });
  if (lines.length > 4) {
    fs = 4.4;
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
  lines.slice(0, 6).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
      baseline: 'middle',
      maxWidth: w - 2,
    });
  });
}

function drawMultilineCell(doc, x, y, w, h, lines, align = 'left', fontSize = 5.4) {
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DATA_TEXT[0], DATA_TEXT[1], DATA_TEXT[2]);
  doc.setFontSize(fontSize);
  const maxW = Math.max(3, w - 3);
  const flat = [];
  (lines || []).forEach((ln) => {
    flat.push(...doc.splitTextToSize(String(ln), maxW));
  });
  const lineH = fontSize * 1.12;
  const block = flat.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  const xText = align === 'center' ? x + w / 2 : x + 2;
  flat.slice(0, 12).forEach((ln, i) => {
    doc.text(ln, xText, firstY + i * lineH, {
      align,
      baseline: 'middle',
      maxWidth: maxW,
    });
  });
  doc.setTextColor(0, 0, 0);
}

function drawCenterTextCell(doc, x, y, w, h, text, fontSize = 5.8) {
  drawCellBorder(doc, x, y, w, h);
  if (text == null || text === '') return;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DATA_TEXT[0], DATA_TEXT[1], DATA_TEXT[2]);
  doc.setFontSize(fontSize);
  const maxW = Math.max(2, w - 2);
  const parts = String(text).split('\n');
  const flat = [];
  parts.forEach((p) => flat.push(...doc.splitTextToSize(p, maxW)));
  if (flat.length === 0) {
    doc.setTextColor(0, 0, 0);
    return;
  }
  const lineH = fontSize * 1.18;
  const block = flat.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  flat.slice(0, 6).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
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
  doc.setFontSize(4.5);
  doc.setTextColor(DATA_TEXT[0], DATA_TEXT[1], DATA_TEXT[2]);
  const cy = y + h / 2;
  doc.text('NO', x + w / 2, cy - 8, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.text('IMAGE', x + w / 2, cy - 2, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.text('AVAILABLE', x + w / 2, cy + 4, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.setTextColor(0, 0, 0);
}

function drawQtyCell(doc, x, y, w, h, qty) {
  drawCellBorder(doc, x, y, w, h);
  if (qty == null || qty === '') return;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(DATA_TEXT[0], DATA_TEXT[1], DATA_TEXT[2]);
  doc.text(String(qty), x + w / 2, y + h / 2, {
    align: 'center',
    baseline: 'middle',
    maxWidth: w - 2,
  });
  doc.setTextColor(0, 0, 0);
}

function drawStatusValueCell(doc, x, y, w, h, val) {
  drawCellBorder(doc, x, y, w, h);
  const s = val == null ? '' : String(val);
  if (s === '') return;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DATA_TEXT[0], DATA_TEXT[1], DATA_TEXT[2]);
  /**
   * Pick a font size that lets the value fit within the cell width; fall back to
   * splitting into multiple lines (max 2) if even the smallest size cannot fit.
   */
  const maxW = Math.max(2, w - 2);
  let fs = 5.6;
  doc.setFontSize(fs);
  let textW = doc.getTextWidth(s);
  if (textW > maxW) {
    fs = 5;
    doc.setFontSize(fs);
    textW = doc.getTextWidth(s);
  }
  if (textW > maxW) {
    const lines = doc.splitTextToSize(s, maxW).slice(0, 2);
    const lineH = fs * 1.18;
    const block = lines.length * lineH;
    const firstY = y + h / 2 - (block - lineH) / 2;
    lines.forEach((ln, i) => {
      doc.text(ln, x + w / 2, firstY + i * lineH, {
        align: 'center',
        baseline: 'middle',
        maxWidth: maxW,
      });
    });
  } else {
    doc.text(s, x + w / 2, y + h / 2, {
      align: 'center',
      baseline: 'middle',
      maxWidth: maxW,
    });
  }
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
  drawCenterTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.productNumber, 5.6);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], DATA_ROW_H, [row.description], 'left', 5.2);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], DATA_ROW_H, [row.poNo], 'left', 5.1);
  i += 1;
  drawCenterTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.gender, 5.4);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], DATA_ROW_H, [row.customer || ''], 'left', 5.2);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], DATA_ROW_H, [row.brand || ''], 'left', 5.2);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.bodyColor || [], 'left', 4.9);
  i += 1;
  drawCenterTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.priceTicket, 5.6);
  i += 1;
  drawCenterTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.deliverTo, 5.4);
  i += 1;
  drawQtyCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.ttlQty);
  i += 1;
  drawCenterTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.custCancel, 5.6);
  i += 1;
  drawMultilineCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.exFactory || [], 'center', 5.2);
  i += 1;
  const cells = row.statusCells || [];
  for (let k = 0; k < 16; k += 1) {
    drawStatusValueCell(doc, xs[i], y, widths[i], DATA_ROW_H, cells[k]);
    i += 1;
  }
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
  const logoW = 78;
  const logoH = 32;
  const logoX = innerRight - logoW;
  const logoY = V_MARGIN + 4;
  const leftMaxW = Math.max(120, logoX - innerLeft - 8);

  let y = V_MARGIN + 10;
  y = drawBlueBoldUnderline(doc, 'Customer WIP Report', innerLeft, y, leftMaxW) + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8.2);
  doc.text(`Customer: ${meta.customerLabel ?? 'All'}`, innerLeft, y);
  y += 14;
  doc.text(`Supplier: ${meta.supplierLabel ?? 'All'}`, innerLeft, y);
  y += 14;
  doc.text(`Merchant: ${meta.merchantLabel ?? '—'}`, innerLeft, y);
  y += 16;
  const fromH = formatIsoToDdMonYyyy(meta.fromDate);
  const toH = formatIsoToDdMonYyyy(meta.toDate);
  doc.text(`Date From: ${fromH}    Date To: ${toH}`, innerLeft, y);
  y += 14;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.4);
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
  doc.setFontSize(7.2);
  doc.text(formatPrintStamp(), innerRight, tableTop - 6, { align: 'right', baseline: 'bottom' });

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
 * @param {object[]} [rows] — when empty or omitted, uses {@link CUSTOMISED_CUSTOMER_WIP_DEMO_ROWS}
 * @param {{
 *   customerLabel?: string;
 *   supplierLabel?: string;
 *   merchantLabel?: string;
 *   fromDate?: string;
 *   toDate?: string;
 * }} [meta]
 */
export async function buildCustomisedCustomerWipPdfBlobFromRows(rows, meta = {}) {
  const data = Array.isArray(rows) && rows.length > 0 ? rows : CUSTOMISED_CUSTOMER_WIP_DEMO_ROWS;
  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
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

  data.forEach((row) => {
    if (y + DATA_ROW_H > pageBodyBottom) {
      flushSegmentFrame();
      doc.addPage([PAGE_W, PAGE_H], 'l');
      startPage();
    }
    y = drawDataRow(doc, y, innerLeft, widths, row);
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
export function openCustomisedCustomerWipPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Customised-Customer-WIP-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
