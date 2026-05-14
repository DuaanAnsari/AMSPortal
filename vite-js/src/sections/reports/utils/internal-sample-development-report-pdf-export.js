import jsPDF from 'jspdf';

/**
 * Internal Sample Development Report — landscape PDF.
 *
 * Visual layout matches the legacy print mock-up:
 *   - Top      : "INTERNAL SAMPLE DEVELOPMENT REPORT" centered in a
 *                bordered title strip.
 *   - Sub-bar  : "FROM : … TO : …" centered, same border as the title.
 *   - Table    : 14 cols — S#, PICTURE (2 sub-cells), CUSTOMER /
 *                INQUIRY DATE, FTY NAME / HOD DATE, STYLE WITH
 *                DESCRIPTION, FABRIC / CONTENT / GSM, SIZE, COLORS, QTY,
 *                FOB PRICE, FACTORY DEL. DATE, CUSTOMER DEL. DATE,
 *                DISPATCH DATE, STATUS. Header cells render labels in
 *                bold + underline (to mirror the legacy ASP.NET print).
 *   - Item row : All cell values are vertically positioned to match the
 *                two- or three-line legacy layout (customer at top of
 *                cell, inquiry date pinned to the bottom, etc.). Both
 *                PICTURE sub-cells render either an embedded image or a
 *                "NO IMAGE AVAILABLE" placeholder.
 *   - Footer   : Printed on (left), Powered by / Developed by (center),
 *                Page X of Y (right).
 *
 * Demo data is hardcoded (one C-LIFE GROUP LTD. row); backend rows can be
 * passed via the same shape later.
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
 *   render?: 'picture'|'stack2'|'stack3'|'plain';
 * }} InternalSdrCol
 */

/** @type {InternalSdrCol[]} */
const COLS = [
  { key: 'serial', label: 'S#', weight: 22, align: 'center' },
  { key: 'pictures', label: 'PICTURE', weight: 140, align: 'center', render: 'picture' },
  { key: 'customerBlock', label: 'CUSTOMER /\nINQUIRY DATE', weight: 80, align: 'left', render: 'stack2' },
  { key: 'factoryBlock', label: 'FTY NAME /\nHOD DATE', weight: 75, align: 'left', render: 'stack2' },
  { key: 'styleBlock', label: 'STYLE WITH\nDESCRIPTION', weight: 80, align: 'left', render: 'stack2' },
  { key: 'fabricBlock', label: 'FABRIC /\nCONTENT / GSM', weight: 90, align: 'left', render: 'stack3' },
  { key: 'size', label: 'SIZE', weight: 28, align: 'center' },
  { key: 'colors', label: 'COLORS', weight: 60, align: 'center' },
  { key: 'qty', label: 'QTY', weight: 30, align: 'center' },
  { key: 'fobPrice', label: 'FOB\nPRICE', weight: 36, align: 'center' },
  { key: 'factoryDelDate', label: 'FACTORY\nDEL. DATE', weight: 60, align: 'center' },
  { key: 'customerDelDate', label: 'CUSTOMER\nDEL. DATE', weight: 60, align: 'center' },
  { key: 'dispatchDate', label: 'DISPATCH\nDATE', weight: 58, align: 'center' },
  { key: 'status', label: 'STATUS', weight: 70, align: 'left' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy print mock-up.
// ----------------------------------------------------------------------

const INTERNAL_SDR_DEMO = {
  title: 'INTERNAL SAMPLE DEVELOPMENT REPORT',
  fromDate: '01/01/2026',
  toDate: '12/31/2026',
  printedOn: null,
  items: [
    {
      serial: '1',
      pictures: [],
      customer: 'C-LIFE GROUP LTD.',
      inquiryDate: '14-Jan-2026',
      factoryName: 'MS GARMENTS',
      hodDate: '15-Jan-2026',
      styleNo: 'AMS/2968',
      description: 'MEN,S SWEATSHIRT',
      fabric: 'FLEECE,60% COTTON',
      content: '40% POLYESTER',
      gsm: '260 GSM',
      size: 'L',
      colors: 'OLIVE GREEN',
      qty: '3.00',
      fobPrice: '0.00',
      factoryDelDate: 'Jan 26, 2026',
      customerDelDate: 'Jan 01, 1900',
      dispatchDate: '',
      status: 'COMPLETE',
    },
  ],
};

export { INTERNAL_SDR_DEMO };

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
      // Underline the header label, mirroring the legacy ASP.NET print.
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
// Data row — handles the various legacy multi-line cell layouts.
// ----------------------------------------------------------------------

function drawStack2(doc, x, y, w, h, topText, bottomText) {
  // Top line pinned near the top, bottom line pinned near the bottom — gives
  // the legacy look where Customer sits at the top of the cell and Inquiry
  // Date drops to the bottom.
  const topLines = wrapText(doc, topText, w, 7.6, false);
  drawTextLines(doc, x, y, w, h, topLines, {
    align: 'left',
    fontSize: 7.6,
    vAlign: 'top',
    pad: 4,
  });
  const bottomLines = wrapText(doc, bottomText, w, 7.4, false);
  drawTextLines(doc, x, y, w, h, bottomLines, {
    align: 'left',
    fontSize: 7.4,
    vAlign: 'bottom',
    pad: 4,
  });
}

function drawStyleStack(doc, x, y, w, h, styleNo, description) {
  // Style number anchored to the top, description sits below it but does
  // not stretch to the bottom of the cell.
  const styleLines = wrapText(doc, styleNo, w, 7.6, false);
  drawTextLines(doc, x, y, w, h, styleLines, {
    align: 'left',
    fontSize: 7.6,
    vAlign: 'top',
    pad: 4,
  });
  const descLines = wrapText(doc, description, w, 7.4, false);
  if (descLines.length > 0) {
    const startY = y + 24;
    drawTextLines(doc, x, startY, w, h - 24, descLines, {
      align: 'left',
      fontSize: 7.4,
      vAlign: 'top',
      pad: 4,
    });
  }
}

function drawStack3(doc, x, y, w, h, line1, line2, line3) {
  // Three stacked lines for FABRIC / CONTENT / GSM. Each chunk wraps
  // inside the available width and renders top-down.
  const all = [];
  [line1, line2, line3].forEach((chunk) => {
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

    if (col.render === 'stack2') {
      if (col.key === 'customerBlock') {
        drawStack2(doc, x, y, w, DATA_ROW_H, item.customer, item.inquiryDate);
      } else if (col.key === 'factoryBlock') {
        drawStack2(doc, x, y, w, DATA_ROW_H, item.factoryName, item.hodDate);
      } else if (col.key === 'styleBlock') {
        drawStyleStack(doc, x, y, w, DATA_ROW_H, item.styleNo, item.description);
      }
      return;
    }

    if (col.render === 'stack3') {
      drawStack3(doc, x, y, w, DATA_ROW_H, item.fabric, item.content, item.gsm);
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
 * Build the Internal Sample Development Report PDF blob.
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
export async function buildInternalSdrPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.items) && data.items.length > 0 ? data : INTERNAL_SDR_DEMO;

  const meta = {
    title: payload.title || data.title || INTERNAL_SDR_DEMO.title,
    fromDate: payload.fromDate || data.fromDate || INTERNAL_SDR_DEMO.fromDate,
    toDate: payload.toDate || data.toDate || INTERNAL_SDR_DEMO.toDate,
    printedOn: payload.printedOn || data.printedOn || formatPrintedOnLong(),
  };

  // We still load the logo for parity with the other Inquiry hub PDFs even
  // though the legacy mock-up does not render it in the title strip.
  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  await loadLogoDataUrl().catch(() => null);

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = tableColWidths(tableW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;

  /**
   * Start a fresh page: title band + table header.
   * @returns {number} the y position where item rows can begin.
   */
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
export function openInternalSdrPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Internal-Sample-Development-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
