import jsPDF from 'jspdf';

/**
 * Photo Shoot Sample (Customer) — landscape PDF.
 *
 * Layout (per legacy print mock-up):
 *   - Top-LEFT       : AMS logo.
 *   - Title bar      : Bordered strip across the full table width with the
 *                      customer name + " SAMPLE" centered (bold serif look).
 *   - Table header   : S#, STYLE, DESCRIPTION, SIZE, PICTURE (4 picture
 *                      sub-cells), COLORS, FABRIC, GSM, F.WASH, QTY, STATUS.
 *                      Header strip is a light gray with bold black text.
 *   - Item row       : All cell values are vertically centered. The 4 image
 *                      cells render either an embedded image or the legacy
 *                      "NO IMAGE AVAILABLE" placeholder.
 *   - Footer strip   : Each item is followed by a 1-line bar split into
 *                      "REMARKS : ..." (left half) and "COMMENTS : ..."
 *                      (right half), bordered so it visually closes the row.
 *   - Page footer    : Printed on (left), Powered by / Developed by
 *                      (center), Page X of Y (right).
 *
 * Demo data is hardcoded to mirror the C-LIFE GROUP LTD. mock-up; backend
 * rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 842;
const PAGE_H = 595;
const V_MARGIN = 22;
const H_MARGIN = 22;

const LOGO_BLOCK_H = 42;
const TITLE_BAR_H = 24;
const TABLE_HEADER_H = 26;
const DATA_ROW_H = 78;
const FOOTER_STRIP_H = 18;
const ITEM_GAP = 4;
const FOOTER_H = 32;

const HEADER_FILL = [245, 245, 245];
const HEADER_TEXT = [0, 0, 0];
const ROW_BORDER = [120, 120, 120];
const IMAGE_PLACEHOLDER_FILL = [240, 240, 240];
const IMAGE_PLACEHOLDER_BORDER = [200, 200, 200];
const IMAGE_PLACEHOLDER_TEXT = [195, 195, 195];
const NAVY = [0, 51, 102];

const PICTURE_SLOTS = 4;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/**
 * @typedef {{
 *   key: string;
 *   label: string;
 *   weight: number;
 *   align?: 'left'|'center'|'right';
 *   isPicture?: boolean;
 * }} PhotoShootCol
 */

/**
 * Column model. The PICTURE block is one logical column with weight equal to
 * all four image sub-cells combined, so the table header label spans the
 * entire picture area while the data row splits it into 4 image cells.
 *
 * @type {PhotoShootCol[]}
 */
const COLS = [
  { key: 'serial', label: 'S#', weight: 22, align: 'center' },
  { key: 'styleNo', label: 'STYLE', weight: 50, align: 'center' },
  { key: 'description', label: 'DESCRIPTION', weight: 70, align: 'center' },
  { key: 'size', label: 'SIZE', weight: 30, align: 'center' },
  { key: 'pictures', label: 'PICTURE', weight: 280, align: 'center', isPicture: true },
  { key: 'colors', label: 'COLORS', weight: 55, align: 'center' },
  { key: 'fabric', label: 'FABRIC', weight: 75, align: 'center' },
  { key: 'gsm', label: 'GSM', weight: 32, align: 'center' },
  { key: 'fWash', label: 'F.WASH', weight: 38, align: 'center' },
  { key: 'qty', label: 'QTY', weight: 32, align: 'center' },
  { key: 'status', label: 'STATUS', weight: 60, align: 'center' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy C-LIFE GROUP LTD. SAMPLE mock-up.
// ----------------------------------------------------------------------

const PHOTO_SHOOT_SAMPLE_DEMO = {
  customerName: 'C-LIFE GROUP LTD.',
  printedOn: null,
  items: [
    {
      serial: '1',
      styleNo: 'AMS/2939',
      description: 'MEN,S SWEATSHIRT',
      size: 'L',
      pictures: [],
      colors: 'BLACK',
      fabric: 'PIQUE\n\n100%POLYESTER',
      gsm: '223',
      fWash: 'N/A',
      qty: '3.00',
      status: 'DISPATCHED',
      remarks: 'N/A',
      comments: 'MEN,S',
    },
    {
      serial: '2',
      styleNo: 'AMS/2940',
      description: 'MEN,S PULLOVER HOODIE',
      size: 'L',
      pictures: [],
      colors: 'BLACK',
      fabric: 'FLEECE\n\n100%POLYESTER',
      gsm: '287',
      fWash: 'N/A',
      qty: '3.00',
      status: 'DISPATCHED',
      remarks: 'N/A',
      comments: 'MEN,S',
    },
    {
      serial: '3',
      styleNo: 'AMS/2941',
      description: 'LADIES QUARTER ZIPPER',
      size: 'L',
      pictures: [],
      colors: 'OLIVE\nGREEN',
      fabric: 'JACQUARD\n\n70% COTTON\n30% POLYESTER',
      gsm: '330',
      fWash: 'N/A',
      qty: '3.00',
      status: 'DISPATCHED',
      remarks: 'N/A',
      comments: 'WOMEN,S',
    },
    {
      serial: '4',
      styleNo: 'AMS/2942',
      description: 'LADIES CARDIGAN CREWNECK',
      size: 'L',
      pictures: [],
      colors: 'CHARCOAL',
      fabric: 'NANTUCKET\n\n60% COTTON\n40% POLYESTER',
      gsm: '280',
      fWash: 'N/A',
      qty: '3.00',
      status: 'DISPATCHED',
      remarks: 'N/A',
      comments: 'MEN,S',
    },
  ],
};

export { PHOTO_SHOOT_SAMPLE_DEMO };

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

function textInRect(doc, x, y, w, h, text, opts = {}) {
  const {
    align = 'left',
    bold = false,
    fontSize = 7.6,
    color = [0, 0, 0],
    pad = 3,
    maxLines = 5,
  } = opts;
  if (text == null || text === '') return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  const innerW = Math.max(2, w - pad * 2);
  const parts = String(text).split('\n');
  const lines = [];
  parts.forEach((p) => {
    if (p === '') {
      lines.push('');
      return;
    }
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
    if (ln === '') return;
    doc.text(ln, tx, firstY + i * lineH, {
      align,
      baseline: 'middle',
      maxWidth: innerW,
    });
  });
  doc.setTextColor(0, 0, 0);
}

// ----------------------------------------------------------------------
// Header band — logo + customer title bar
// ----------------------------------------------------------------------

function drawHeaderBand(doc, logoDataUrl, customerName, tableX, tableW) {
  // Logo (top-LEFT, outside the table strip).
  if (logoDataUrl) {
    try {
      const logoW = 100;
      const logoH = 32;
      doc.addImage(logoDataUrl, 'PNG', H_MARGIN, V_MARGIN, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  // Customer SAMPLE title bar — bordered strip spanning the table width.
  const titleY = V_MARGIN + LOGO_BLOCK_H + 4;
  strokeRect(doc, tableX, titleY, tableW, TITLE_BAR_H, [0, 0, 0], 0.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const titleText = `${(customerName || '').toUpperCase()} SAMPLE`.trim();
  doc.text(titleText, tableX + tableW / 2, titleY + TITLE_BAR_H / 2, {
    align: 'center',
    baseline: 'middle',
  });

  return titleY + TITLE_BAR_H;
}

// ----------------------------------------------------------------------
// Table header row
// ----------------------------------------------------------------------

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    fillRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, HEADER_FILL);
    strokeRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, [0, 0, 0], 0.5);
    textInRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, col.label, {
      align: 'center',
      bold: true,
      fontSize: 8.2,
      color: HEADER_TEXT,
      pad: 2,
      maxLines: 1,
    });
  });
  return y + TABLE_HEADER_H;
}

// ----------------------------------------------------------------------
// Picture cell — 4 sub-cells, each either an image or "NO IMAGE AVAILABLE"
// ----------------------------------------------------------------------

function drawPlaceholderImage(doc, x, y, w, h) {
  fillRect(doc, x, y, w, h, IMAGE_PLACEHOLDER_FILL);
  strokeRect(doc, x, y, w, h, IMAGE_PLACEHOLDER_BORDER, 0.4);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(IMAGE_PLACEHOLDER_TEXT[0], IMAGE_PLACEHOLDER_TEXT[1], IMAGE_PLACEHOLDER_TEXT[2]);
  const cy = y + h / 2;
  doc.setFontSize(16);
  doc.text('NO', x + w / 2, cy - 14, { align: 'center', baseline: 'middle' });
  doc.setFontSize(11);
  doc.text('IMAGE', x + w / 2, cy + 2, { align: 'center', baseline: 'middle' });
  doc.setFontSize(8.5);
  doc.text('AVAILABLE', x + w / 2, cy + 14, { align: 'center', baseline: 'middle' });
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

    // Sub-cell border so the 4 slots stay visually separated, matching the
    // legacy print where each picture frame has a thin gray rule.
    strokeRect(doc, sx, y, slotW, h, ROW_BORDER, 0.3);
  }
}

// ----------------------------------------------------------------------
// Data row
// ----------------------------------------------------------------------

function drawDataRow(doc, y, x0, widths, item) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];

    if (col.isPicture) {
      drawPictureSlots(doc, x, y, w, DATA_ROW_H, item.pictures);
      strokeRect(doc, x, y, w, DATA_ROW_H, [0, 0, 0], 0.5);
      return;
    }

    strokeRect(doc, x, y, w, DATA_ROW_H, [0, 0, 0], 0.5);

    const raw = item[col.key];
    if (raw === undefined || raw === null || raw === '') return;

    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      bold: false,
      fontSize: 8,
      color: [0, 0, 0],
      pad: 3,
      maxLines: 5,
    });
  });
  return y + DATA_ROW_H;
}

// ----------------------------------------------------------------------
// Remarks / Comments strip — sits flush below the item row
// ----------------------------------------------------------------------

function drawRemarksStrip(doc, y, x0, tableW, item) {
  const half = tableW / 2;
  // Two side-by-side bordered cells (REMARKS | COMMENTS).
  strokeRect(doc, x0, y, half, FOOTER_STRIP_H, [0, 0, 0], 0.5);
  strokeRect(doc, x0 + half, y, half, FOOTER_STRIP_H, [0, 0, 0], 0.5);

  const padX = 10;
  const midY = y + FOOTER_STRIP_H / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('REMARKS :', x0 + padX, midY, { baseline: 'middle' });
  doc.setFont('helvetica', 'normal');
  doc.text(String(item.remarks || ''), x0 + padX + 60, midY, { baseline: 'middle' });

  doc.setFont('helvetica', 'bold');
  doc.text('COMMENTS :', x0 + half + padX, midY, { baseline: 'middle' });
  doc.setFont('helvetica', 'normal');
  doc.text(String(item.comments || ''), x0 + half + padX + 66, midY, { baseline: 'middle' });

  return y + FOOTER_STRIP_H;
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
 * Build the Photo Shoot Sample PDF blob.
 *
 * @param {{ items?: object[]; customerName?: string; printedOn?: string }} data
 * @returns {Promise<Blob>}
 */
export async function buildPhotoShootSamplePdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.items) && data.items.length > 0 ? data : PHOTO_SHOOT_SAMPLE_DEMO;

  const meta = {
    customerName: payload.customerName || data.customerName || PHOTO_SHOOT_SAMPLE_DEMO.customerName,
    printedOn: payload.printedOn || data.printedOn || formatPrintedOnLong(),
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = tableColWidths(tableW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;

  /**
   * Start a fresh page: header band (logo + customer title) + table header.
   * @returns {number} the y position where item rows can begin.
   */
  const startPage = () => {
    const afterHeader = drawHeaderBand(doc, logoDataUrl, meta.customerName, tableX, tableW);
    return drawTableHeader(doc, afterHeader, tableX, widths);
  };

  let y = startPage();

  const itemBlockH = DATA_ROW_H + FOOTER_STRIP_H + ITEM_GAP;

  payload.items.forEach((item) => {
    if (y + itemBlockH > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'l');
      y = startPage();
    }
    y = drawDataRow(doc, y, tableX, widths, item);
    y = drawRemarksStrip(doc, y, tableX, tableW, item);
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
export function openPhotoShootSamplePdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Photo-Shoot-Sample.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
