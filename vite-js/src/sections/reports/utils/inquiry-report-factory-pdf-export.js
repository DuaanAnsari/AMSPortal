import jsPDF from 'jspdf';

/**
 * Inquiry Report For Factory — landscape PDF.
 *
 * Visual layout matches the legacy "INQUIRY" print mock-up for factories:
 *   - Top-LEFT  : AMS logo.
 *   - Top-CTR   : "INQUIRY" title (bold, 16pt).
 *   - Table     : 14 cols — SERIAL #, REQUEST DATE, DUE DATE, DISPATCH DATE,
 *                 STYLE #, ITEM, CONTENT, FABRIC, COLOUR, PRICE, QTY, SIZE,
 *                 GSM, FACTORY NAME. The header strip is dark gray with
 *                 white text. DISPATCH DATE and FACTORY NAME render bold.
 *   - Item card : Same card structure as the customer Inquiry PDF — left
 *                 zone holds the data row + COMMENT box (COMMENT STATUS,
 *                 PROGRESS COMMENTS, REMARKS); right zone holds the product
 *                 image (placeholder when no URL).
 *   - Footer    : Printed on (left), Powered by / Developed by (center),
 *                 Page X of Y (right).
 *
 * Demo data is hardcoded to mirror the legacy AYYOUB / HASAN factory mock-up.
 * Backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 842;
const PAGE_H = 595;
const V_MARGIN = 22;
const H_MARGIN = 22;

const HEADER_BLOCK_H = 70;
const TABLE_HEADER_H = 22;
const DATA_ROW_H = 36;
const ROW_TO_COMMENT_GAP = 40;
const COMMENT_BOX_H = 46;
const ITEM_GAP = 12;
const FOOTER_H = 32;

const ROW_DIVIDER_COLOR = [80, 80, 80];

/** Item card visual columns split (left = data + comments, right = image). */
const IMAGE_COL_FRACTION = 0.16;

const HEADER_FILL = [120, 120, 120];
const HEADER_TEXT = [255, 255, 255];
const ROW_BORDER = [180, 180, 180];
const COMMENT_BORDER = [180, 180, 180];
const IMAGE_PLACEHOLDER_FILL = [235, 235, 235];
const IMAGE_PLACEHOLDER_BORDER = [200, 200, 200];
const NAVY = [0, 51, 102];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} InquiryFactoryCol */

/**
 * Column model for the factory variant. Compared to the customer Inquiry
 * Report this:
 *   - Drops `CUSTOMER NAME`.
 *   - Inserts `PRICE` after `COLOUR`.
 *   - Appends `FACTORY NAME` at the right edge.
 *
 * @type {InquiryFactoryCol[]}
 */
const COLS = [
  { key: 'serial', label: 'SERIAL #', weight: 46, align: 'left' },
  { key: 'requestDate', label: 'REQUEST DATE', weight: 58, align: 'center' },
  { key: 'dueDate', label: 'DUE DATE', weight: 50, align: 'center' },
  { key: 'dispatchDate', label: 'DISPATCH DATE', weight: 60, align: 'center' },
  { key: 'styleNo', label: 'STYLE #', weight: 50, align: 'left' },
  { key: 'item', label: 'ITEM', weight: 95, align: 'center' },
  { key: 'content', label: 'CONTENT', weight: 70, align: 'center' },
  { key: 'fabric', label: 'FABRIC', weight: 50, align: 'center' },
  { key: 'colour', label: 'COLOUR', weight: 55, align: 'center' },
  { key: 'price', label: 'PRICE', weight: 30, align: 'center' },
  { key: 'qty', label: 'QTY', weight: 25, align: 'center' },
  { key: 'size', label: 'SIZE', weight: 25, align: 'center' },
  { key: 'gsm', label: 'GSM', weight: 32, align: 'center' },
  { key: 'factoryName', label: 'FACTORY NAME', weight: 88, align: 'left' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy factory print mock-up.
// ----------------------------------------------------------------------

const RAW_DEMO_ITEMS = [
  {
    serial: 'AMS/2939',
    requestDate: '01/02/2026',
    dueDate: '12/19/2025',
    dispatchDate: '01/12/2026',
    styleNo: 'AMS/2939',
    item: 'MEN,S SWEATSHIRT',
    content: '100%POLYESTER',
    fabric: 'PIQUE',
    colour: 'BLACK',
    price: '0.00',
    qty: '3',
    size: 'L',
    gsm: '223',
    factoryName: 'AYYOUB APPARELS',
    commentStatus: 'DISPATCHED',
    progressComments: 'MEN,S',
    remarks: 'N/A',
    imageUrl: null,
  },
  {
    serial: 'AMS/2940',
    requestDate: '01/02/2026',
    dueDate: '12/19/2025',
    dispatchDate: '01/12/2026',
    styleNo: 'AMS/2940',
    item: 'MEN,S PULLOVER HOODIE',
    content: '100%POLYESTER',
    fabric: 'FLEECE',
    colour: 'BLACK',
    price: '0.00',
    qty: '3',
    size: 'L',
    gsm: '287',
    factoryName: 'AYYOUB APPARELS',
    commentStatus: 'DISPATCHED',
    progressComments: 'MEN,S',
    remarks: 'N/A',
    imageUrl: null,
  },
  {
    serial: 'AMS/2941',
    requestDate: '01/02/2026',
    dueDate: '12/19/2025',
    dispatchDate: '01/12/2026',
    styleNo: 'AMS/2941',
    item: 'LADIES QUARTER ZIPPER',
    content: '70% COTTON\n30% POLYESTER',
    fabric: 'JACQUARD',
    colour: 'OLIVE GREEN',
    price: '0.00',
    qty: '3',
    size: 'L',
    gsm: '330',
    factoryName: 'HASAN TEXTILE',
    commentStatus: 'DISPATCHED',
    progressComments: 'WOMEN,S',
    remarks: 'N/A',
    imageUrl: null,
  },
  {
    serial: 'AMS/2942',
    requestDate: '01/02/2026',
    dueDate: '12/19/2025',
    dispatchDate: '01/12/2026',
    styleNo: 'AMS/2942',
    item: 'LADIES CARDIGAN CREWNECK',
    content: '60% COTTON\n40% POLYESTER',
    fabric: 'NANTUCKET',
    colour: 'CHARCOAL',
    price: '0.00',
    qty: '3',
    size: 'L',
    gsm: '280',
    factoryName: 'HASAN TEXTILE',
    commentStatus: 'DISPATCHED',
    progressComments: 'MEN,S',
    remarks: 'N/A',
    imageUrl: null,
  },
  {
    serial: 'AMS/2945',
    requestDate: '01/05/2026',
    dueDate: '12/22/2025',
    dispatchDate: '01/06/2026',
    styleNo: 'AMS/2945',
    item: 'COLOR BLOCK SUBLIMATED PRINTED CREW',
    content: '50% COTTON\n50% POLYESTER',
    fabric: 'FLEECE',
    colour: 'BLUE/VINTAGE',
    price: '0.00',
    qty: '3',
    size: 'L',
    gsm: '260',
    factoryName: 'AYYOUB APPARELS',
    commentStatus: 'DISPATCHED',
    progressComments: 'MEN,S',
    remarks: 'N/A',
    imageUrl: null,
  },
];

export const INQUIRY_REPORT_FACTORY_DEMO = {
  items: RAW_DEMO_ITEMS,
};

// ----------------------------------------------------------------------
// Geometry helpers
// ----------------------------------------------------------------------

function tableColWidths(tableW) {
  const sum = COLS.reduce((a, c) => a + c.weight, 0);
  const out = COLS.map((c) => (c.weight / sum) * tableW);
  const drift = tableW - out.reduce((a, b) => a + b, 0);
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

function formatPrintedOnLong(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ----------------------------------------------------------------------
// Drawing primitives
// ----------------------------------------------------------------------

function setBorder(doc, rgb = ROW_BORDER) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(0.4);
}

function fillRect(doc, x, y, w, h, fill) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.rect(x, y, w, h, 'F');
}

function strokeRect(doc, x, y, w, h, borderRgb) {
  setBorder(doc, borderRgb);
  doc.rect(x, y, w, h);
}

function textInRect(doc, x, y, w, h, text, opts = {}) {
  const {
    align = 'left',
    bold = false,
    fontSize = 7,
    color = [0, 0, 0],
    pad = 3,
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

function drawPageHeader(doc, logoDataUrl) {
  const innerLeft = H_MARGIN;

  if (logoDataUrl) {
    try {
      const logoW = 100;
      const logoH = 32;
      doc.addImage(logoDataUrl, 'PNG', innerLeft, V_MARGIN, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('INQUIRY', PAGE_W / 2, V_MARGIN + 26, {
    align: 'center',
    baseline: 'alphabetic',
  });

  doc.setTextColor(0, 0, 0);
  return V_MARGIN + HEADER_BLOCK_H;
}

// ----------------------------------------------------------------------
// Table header
// ----------------------------------------------------------------------

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    fillRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, HEADER_FILL);
    setBorder(doc, HEADER_FILL);
    doc.rect(xs[i], y, widths[i], TABLE_HEADER_H);
    textInRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, col.label, {
      align: 'center',
      bold: true,
      fontSize: 7.6,
      color: HEADER_TEXT,
      pad: 2,
      maxLines: 1,
    });
  });
  return y + TABLE_HEADER_H;
}

// ----------------------------------------------------------------------
// Item card — data row + comment block on the left, image on the right.
// ----------------------------------------------------------------------

function drawDataRow(doc, y, x0, widths, item) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    setBorder(doc, [220, 220, 220]);
    doc.line(x, y + DATA_ROW_H, x + w, y + DATA_ROW_H);

    const raw = item[col.key];
    if (raw === undefined || raw === null || raw === '') return;

    /** Dispatch Date and Factory Name render in bold to match the legacy print. */
    const isBoldColumn = col.key === 'dispatchDate' || col.key === 'factoryName';

    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      bold: isBoldColumn,
      fontSize: 7.4,
      color: [0, 0, 0],
      pad: 3,
      maxLines: 2,
    });
  });
  return y + DATA_ROW_H;
}

function drawCommentBox(doc, y, x0, w, item) {
  strokeRect(doc, x0, y, w, COMMENT_BOX_H, COMMENT_BORDER);
  const padX = 10;
  const half = w / 2;
  const lineH = COMMENT_BOX_H / 2;

  const row1Y = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(0, 0, 0);
  doc.text('COMMENT STATUS :', x0 + padX, row1Y + lineH / 2, { baseline: 'middle' });
  doc.setFont('helvetica', 'normal');
  doc.text(String(item.commentStatus || ''), x0 + padX + 96, row1Y + lineH / 2, {
    baseline: 'middle',
  });

  doc.setFont('helvetica', 'bold');
  doc.text('PROGRESS COMMENTS :', x0 + half + padX, row1Y + lineH / 2, { baseline: 'middle' });
  doc.setFont('helvetica', 'normal');
  doc.text(String(item.progressComments || ''), x0 + half + padX + 116, row1Y + lineH / 2, {
    baseline: 'middle',
  });

  const row2Y = y + lineH;
  doc.setFont('helvetica', 'bold');
  doc.text('REMARKS :', x0 + padX, row2Y + lineH / 2, { baseline: 'middle' });
  doc.setFont('helvetica', 'normal');
  doc.text(String(item.remarks || ''), x0 + padX + 60, row2Y + lineH / 2, { baseline: 'middle' });
}

function drawImageCell(doc, x, y, w, h, item) {
  const padding = 6;
  const boxX = x + padding;
  const boxY = y + padding;
  const boxW = w - padding * 2;
  const boxH = h - padding * 2;

  if (item.imageUrl) {
    try {
      doc.addImage(item.imageUrl, 'PNG', boxX, boxY, boxW, boxH, undefined, 'FAST');
      return;
    } catch {
      /* fall through to placeholder */
    }
  }

  fillRect(doc, boxX, boxY, boxW, boxH, IMAGE_PLACEHOLDER_FILL);
  strokeRect(doc, boxX, boxY, boxW, boxH, IMAGE_PLACEHOLDER_BORDER);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Product Image', boxX + boxW / 2, boxY + boxH / 2, {
    align: 'center',
    baseline: 'middle',
  });
  doc.setTextColor(0, 0, 0);
}

function drawItemCard(doc, y, x0, innerW, item) {
  const imageW = innerW * IMAGE_COL_FRACTION;
  const tableW = innerW - imageW;

  const widths = tableColWidths(tableW);

  const cardH = DATA_ROW_H + ROW_TO_COMMENT_GAP + COMMENT_BOX_H;
  const imageX = x0 + tableW;

  drawImageCell(doc, imageX, y, imageW, cardH, item);

  drawDataRow(doc, y, x0, widths, item);
  const commentY = y + DATA_ROW_H + ROW_TO_COMMENT_GAP;
  drawCommentBox(doc, commentY, x0 + 10, tableW - 20, item);

  const dividerY = y + cardH + ITEM_GAP / 2;
  doc.setDrawColor(ROW_DIVIDER_COLOR[0], ROW_DIVIDER_COLOR[1], ROW_DIVIDER_COLOR[2]);
  doc.setLineWidth(0.5);
  doc.line(x0, dividerY, x0 + innerW, dividerY);

  return y + cardH + ITEM_GAP;
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
 * @param {{ items?: object[]; printedOn?: string }} data
 * @returns {Promise<Blob>}
 */
export async function buildInquiryReportFactoryPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.items) && data.items.length > 0
      ? data
      : INQUIRY_REPORT_FACTORY_DEMO;

  const meta = {
    printedOn: payload.printedOn || data.printedOn || formatPrintedOnLong(),
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const tableW = innerW - innerW * IMAGE_COL_FRACTION;
  const tableHeaderWidths = tableColWidths(tableW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let y = 0;

  const startPage = () => {
    y = drawPageHeader(doc, logoDataUrl);
    y = drawTableHeader(doc, y, innerLeft, tableHeaderWidths);
    y += 6;
  };

  startPage();

  const cardH = DATA_ROW_H + ROW_TO_COMMENT_GAP + COMMENT_BOX_H + ITEM_GAP;
  payload.items.forEach((item) => {
    if (y + cardH > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'l');
      startPage();
    }
    y = drawItemCard(doc, y, innerLeft, innerW, item);
  });

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
export function openInquiryReportFactoryPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Inquiry-Report-Factory.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
