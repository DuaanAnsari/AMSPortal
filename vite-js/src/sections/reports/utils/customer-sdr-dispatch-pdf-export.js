import jsPDF from 'jspdf';

/**
 * Customer Development Report (Dispatch Inquiry) — landscape PDF.
 *
 * Variant of the regular Customer Development Report for the legacy
 * "Sample Development Report for Dispatch Inquiry" print. Compared to the
 * regular customer-side PDF:
 *   - Drops the separate FOB PRICE column (only one PRICE column remains).
 *   - Inserts a CATEGORY column between FABRIC / CONTENT / GSM and SIZE.
 *
 *   - Top      : "CUSTOMER DEVELOPMENT REPORT" centered.
 *   - Sub-bar  : "FROM : DD/MM/YYYY   TO : DD/MM/YYYY" centered.
 *   - Table    : 12 cols — S#, PICTURE (2 sub-cells), CUSTOMER,
 *                STYLE / DESCRIPTION, FABRIC / CONTENT / GSM, CATEGORY,
 *                SIZE, COLORS, PRICE, QTY, DELIVERY DATE, STATUS.
 *
 * Demo data is hardcoded (5 dispatched rows transcribed from the legacy
 * mock-up); backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 842;
const PAGE_H = 595;
const V_MARGIN = 22;
const H_MARGIN = 22;

const TITLE_BAR_H = 26;
const SUBTITLE_BAR_H = 20;
const TABLE_HEADER_H = 30;
const DATA_ROW_H = 90;
const FOOTER_H = 32;
const ITEM_GAP = 0;

const HEADER_FILL = [255, 255, 255];
const HEADER_TEXT = [0, 0, 0];
const ROW_BORDER = [120, 120, 120];
const IMAGE_PLACEHOLDER_FILL = [240, 240, 240];
const IMAGE_PLACEHOLDER_BORDER = [200, 200, 200];
const IMAGE_PLACEHOLDER_TEXT = [195, 195, 195];
const NAVY = [0, 51, 102];

const PICTURE_SLOTS = 2;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/**
 * @typedef {{
 *   key: string;
 *   label: string;
 *   weight: number;
 *   align?: 'left'|'center'|'right';
 *   render?: 'picture'|'styleStack'|'fabricStack'|'plain';
 * }} CustomerDispatchCol
 */

/** @type {CustomerDispatchCol[]} */
const COLS = [
  { key: 'serial', label: 'S#', weight: 22, align: 'center' },
  { key: 'pictures', label: 'PICTURE', weight: 130, align: 'center', render: 'picture' },
  { key: 'customer', label: 'CUSTOMER', weight: 80, align: 'left' },
  { key: 'styleBlock', label: 'STYLE /\nDESCRIPTION', weight: 110, align: 'center', render: 'styleStack' },
  { key: 'fabricBlock', label: 'FABRIC / CONTENT /\nGSM', weight: 100, align: 'left', render: 'fabricStack' },
  { key: 'category', label: 'CATEGORY', weight: 55, align: 'left' },
  { key: 'size', label: 'SIZE', weight: 28, align: 'center' },
  { key: 'colors', label: 'COLORS', weight: 60, align: 'center' },
  { key: 'price', label: 'PRICE', weight: 36, align: 'center' },
  { key: 'qty', label: 'QTY', weight: 30, align: 'center' },
  { key: 'deliveryDate', label: 'DELIVERY\nDATE', weight: 58, align: 'center' },
  { key: 'status', label: 'STATUS', weight: 50, align: 'left' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy "for Dispatch Inquiry" mock-up.
// ----------------------------------------------------------------------

const CUSTOMER_SDR_DISPATCH_DEMO = {
  title: 'CUSTOMER DEVELOPMENT REPORT',
  fromDate: '01/01/2026',
  toDate: '12/31/2026',
  printedOn: null,
  items: [
    {
      serial: '1',
      pictures: [],
      customer: 'C-LIFE GROUP LTD.',
      styleNo: 'AMS/2939',
      description: 'Men,s sweatshirt',
      fabric: 'Pique,100%polyester',
      content: '',
      gsm: '223 GSM',
      category: 'MEN,S',
      size: 'L',
      colors: 'Black',
      price: '0',
      qty: '3',
      deliveryDate: '01/12/2026',
      status: 'dispatched',
    },
    {
      serial: '2',
      pictures: [],
      customer: 'C-LIFE GROUP LTD.',
      styleNo: 'AMS/2940',
      description: 'Men,s pullover hoodie',
      fabric: 'Fleece,100%polyester',
      content: '',
      gsm: '287 GSM',
      category: 'MEN,S',
      size: 'L',
      colors: 'Black',
      price: '0',
      qty: '3',
      deliveryDate: '01/12/2026',
      status: 'dispatched',
    },
    {
      serial: '3',
      pictures: [],
      customer: 'AMS SAMPLE',
      styleNo: 'AMS/2941',
      description: 'Ladies quarter zipper',
      fabric: 'jacquard,70%',
      content: 'cotton 30%\npolyester',
      gsm: '330 GSM',
      category: 'WOMEN,S',
      size: 'L',
      colors: 'Olive green',
      price: '0',
      qty: '3',
      deliveryDate: '01/12/2026',
      status: 'dispatched',
    },
    {
      serial: '4',
      pictures: [],
      customer: 'All Seasons Textile Inc',
      styleNo: 'AMS/2942',
      description: 'Ladies cardigan crewneck',
      fabric: 'nantucket,60%',
      content: 'cotton 40%\npolyester',
      gsm: '280 GSM',
      category: 'MEN,S',
      size: 'L',
      colors: 'Charcoal',
      price: '0',
      qty: '3',
      deliveryDate: '01/12/2026',
      status: 'dispatched',
    },
    {
      serial: '5',
      pictures: [],
      customer: 'MV SPORTS',
      styleNo: 'AMS/2945',
      description: 'Color block sublimated\nprinted crew',
      fabric: 'Fleece,50% cotton',
      content: '50% polyester',
      gsm: '260 GSM',
      category: 'MEN,S',
      size: 'L',
      colors: 'Blue/vintage',
      price: '0',
      qty: '3',
      deliveryDate: '01/06/2026',
      status: 'dispatched',
    },
  ],
};

export { CUSTOMER_SDR_DISPATCH_DEMO };

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

function setBorder(doc, rgb = ROW_BORDER, lineW = 0.5) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(lineW);
}

function fillRect(doc, x, y, w, h, fill) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.rect(x, y, w, h, 'F');
}

function strokeRect(doc, x, y, w, h, borderRgb, lineW = 0.5) {
  setBorder(doc, borderRgb, lineW);
  doc.rect(x, y, w, h);
}

function drawTextLines(doc, x, y, w, h, lines, opts = {}) {
  const {
    align = 'left',
    bold = false,
    fontSize = 7.4,
    color = [0, 0, 0],
    pad = 3,
    lineH,
    vAlign = 'middle',
  } = opts;
  if (!lines || lines.length === 0) return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  const lh = lineH || fontSize * 1.25;
  const block = lines.length * lh;
  let firstY;
  if (vAlign === 'top') firstY = y + pad + lh / 2;
  else if (vAlign === 'bottom') firstY = y + h - pad - block + lh / 2;
  else firstY = y + (h - block) / 2 + lh / 2;
  let tx;
  if (align === 'center') tx = x + w / 2;
  else if (align === 'right') tx = x + w - pad;
  else tx = x + pad;
  lines.forEach((ln, i) => {
    if (!ln) return;
    doc.text(ln, tx, firstY + i * lh, { align, baseline: 'middle', maxWidth: w - pad * 2 });
  });
  doc.setTextColor(0, 0, 0);
}

function wrapText(doc, text, w, fontSize, bold, pad = 3) {
  if (text == null || text === '') return [];
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  const innerW = Math.max(2, w - pad * 2);
  const out = [];
  String(text)
    .split('\n')
    .forEach((p) => {
      if (p === '') {
        out.push('');
        return;
      }
      out.push(...doc.splitTextToSize(p, innerW));
    });
  return out;
}

// ----------------------------------------------------------------------
// Title strip + sub-title (date range)
// ----------------------------------------------------------------------

function drawTitleBand(doc, tableX, tableW, title, fromDate, toDate) {
  const titleY = V_MARGIN;
  strokeRect(doc, tableX, titleY, tableW, TITLE_BAR_H, [0, 0, 0], 0.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(title, tableX + tableW / 2, titleY + TITLE_BAR_H / 2, {
    align: 'center',
    baseline: 'middle',
  });

  const subY = titleY + TITLE_BAR_H;
  strokeRect(doc, tableX, subY, tableW, SUBTITLE_BAR_H, [0, 0, 0], 0.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    `FROM : ${fromDate}   TO : ${toDate}`,
    tableX + tableW / 2,
    subY + SUBTITLE_BAR_H / 2,
    { align: 'center', baseline: 'middle' }
  );

  return subY + SUBTITLE_BAR_H;
}

// ----------------------------------------------------------------------
// Table header — labels are bold + underlined per the legacy print.
// ----------------------------------------------------------------------

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    fillRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, HEADER_FILL);
    strokeRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, [0, 0, 0], 0.5);

    const lines = String(col.label).split('\n');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(HEADER_TEXT[0], HEADER_TEXT[1], HEADER_TEXT[2]);
    const lineH = 9.4;
    const block = lines.length * lineH;
    const startY = y + (TABLE_HEADER_H - block) / 2 + lineH / 2;
    lines.forEach((ln, idx) => {
      const cx = xs[i] + widths[i] / 2;
      const ty = startY + idx * lineH;
      doc.text(ln, cx, ty, { align: 'center', baseline: 'middle' });
      const textW = doc.getTextWidth(ln);
      setBorder(doc, [0, 0, 0], 0.5);
      doc.line(cx - textW / 2, ty + 4, cx + textW / 2, ty + 4);
    });
  });
  doc.setTextColor(0, 0, 0);
  return y + TABLE_HEADER_H;
}

// ----------------------------------------------------------------------
// Picture cell — 2 sub-cells, each image or "NO IMAGE AVAILABLE"
// ----------------------------------------------------------------------

function drawPlaceholderImage(doc, x, y, w, h) {
  fillRect(doc, x, y, w, h, IMAGE_PLACEHOLDER_FILL);
  strokeRect(doc, x, y, w, h, IMAGE_PLACEHOLDER_BORDER, 0.4);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(IMAGE_PLACEHOLDER_TEXT[0], IMAGE_PLACEHOLDER_TEXT[1], IMAGE_PLACEHOLDER_TEXT[2]);
  const cy = y + h / 2;
  doc.setFontSize(15);
  doc.text('NO', x + w / 2, cy - 14, { align: 'center', baseline: 'middle' });
  doc.setFontSize(10);
  doc.text('IMAGE', x + w / 2, cy + 1, { align: 'center', baseline: 'middle' });
  doc.setFontSize(8);
  doc.text('AVAILABLE', x + w / 2, cy + 13, { align: 'center', baseline: 'middle' });
  doc.setTextColor(0, 0, 0);
}

function drawPictureSlots(doc, x0, y, w, h, pictures) {
  const slotW = w / PICTURE_SLOTS;
  for (let i = 0; i < PICTURE_SLOTS; i += 1) {
    const sx = x0 + i * slotW;
    const padding = 3;
    const ix = sx + padding;
    const iy = y + padding;
    const iw = slotW - padding * 2;
    const ih = h - padding * 2;

    const url = Array.isArray(pictures) ? pictures[i] : null;
    if (url) {
      try {
        doc.addImage(url, 'PNG', ix, iy, iw, ih, undefined, 'FAST');
      } catch {
        drawPlaceholderImage(doc, ix, iy, iw, ih);
      }
    } else {
      drawPlaceholderImage(doc, ix, iy, iw, ih);
    }
    strokeRect(doc, sx, y, slotW, h, ROW_BORDER, 0.3);
  }
}

// ----------------------------------------------------------------------
// Data row — handles the multi-line cell layouts.
// ----------------------------------------------------------------------

function drawStyleStack(doc, x, y, w, h, styleNo, description) {
  const styleLines = wrapText(doc, styleNo, w, 7.8, false);
  drawTextLines(doc, x, y, w, h / 2, styleLines, {
    align: 'center',
    fontSize: 7.8,
    vAlign: 'middle',
    pad: 4,
  });
  const descLines = wrapText(doc, description, w, 7.4, false);
  drawTextLines(doc, x, y + h / 2 - 4, w, h / 2, descLines, {
    align: 'center',
    fontSize: 7.4,
    vAlign: 'middle',
    pad: 4,
  });
}

function drawFabricStack(doc, x, y, w, h, fabric, content, gsm) {
  const all = [];
  [fabric, content, gsm].forEach((chunk) => {
    if (chunk == null || chunk === '') return;
    all.push(...wrapText(doc, String(chunk), w, 7.4, false));
  });
  drawTextLines(doc, x, y, w, h, all, {
    align: 'left',
    fontSize: 7.4,
    vAlign: 'top',
    pad: 4,
  });
}

function drawDataRow(doc, y, x0, widths, item) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];

    if (col.render === 'picture') {
      drawPictureSlots(doc, x, y, w, DATA_ROW_H, item.pictures);
      strokeRect(doc, x, y, w, DATA_ROW_H, [0, 0, 0], 0.5);
      return;
    }

    strokeRect(doc, x, y, w, DATA_ROW_H, [0, 0, 0], 0.5);

    if (col.render === 'styleStack') {
      drawStyleStack(doc, x, y, w, DATA_ROW_H, item.styleNo, item.description);
      return;
    }

    if (col.render === 'fabricStack') {
      drawFabricStack(doc, x, y, w, DATA_ROW_H, item.fabric, item.content, item.gsm);
      return;
    }

    const raw = item[col.key];
    if (raw === undefined || raw === null || raw === '') return;
    const lines = wrapText(doc, raw, w, 7.6, false);
    drawTextLines(doc, x, y, w, DATA_ROW_H, lines, {
      align: col.align,
      fontSize: 7.6,
      vAlign: 'middle',
      pad: 3,
    });
  });
  return y + DATA_ROW_H;
}

// ----------------------------------------------------------------------
// Page footer
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
 * Build the Customer Development Report (Dispatch) PDF blob.
 *
 * @param {{
 *   items?: object[];
 *   title?: string;
 *   fromDate?: string;
 *   toDate?: string;
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildCustomerSdrDispatchPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.items) && data.items.length > 0
      ? data
      : CUSTOMER_SDR_DISPATCH_DEMO;

  const meta = {
    title: payload.title || data.title || CUSTOMER_SDR_DISPATCH_DEMO.title,
    fromDate: payload.fromDate || data.fromDate || CUSTOMER_SDR_DISPATCH_DEMO.fromDate,
    toDate: payload.toDate || data.toDate || CUSTOMER_SDR_DISPATCH_DEMO.toDate,
    printedOn: payload.printedOn || data.printedOn || formatPrintedOnLong(),
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  await loadLogoDataUrl().catch(() => null);

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = tableColWidths(tableW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;

  const startPage = () => {
    const afterTitle = drawTitleBand(doc, tableX, tableW, meta.title, meta.fromDate, meta.toDate);
    return drawTableHeader(doc, afterTitle, tableX, widths);
  };

  let y = startPage();

  payload.items.forEach((item) => {
    if (y + DATA_ROW_H > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'l');
      y = startPage();
    }
    y = drawDataRow(doc, y, tableX, widths, item);
    y += ITEM_GAP;
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
export function openCustomerSdrDispatchPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Customer-Development-Report-Dispatch.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
