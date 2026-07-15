import jsPDF from 'jspdf';

/**
 * Shipment Delay Report — landscape PDF.
 *
 * Layout (per legacy print):
 *   - Top-right : AMS logo + 2-line company address (right-aligned).
 *   - Center    : "SHIPMENT DELAY REPORT" (bold, oversized) below the
 *                 address block so it never overlaps the right-side header.
 *   - Table     : 13 cols — P.O. #, Customer Name, Vendor Name, Order Qty,
 *                 Ship.Date (V), Ship.Date (B), Invoice Value, Week 1 Delay
 *                 3 %, Week 2 Delay 5 %, Week 3 Delay 8 %, Onward 10 %,
 *                 Reason (B), Reason (V).
 *   - Customer Name + Vendor Name cells render in blue (legacy link styling);
 *     everything else is black.
 *   - Footer    : Printed on (left), Powered by … / Developed by … (center),
 *                 Page X of Y (right).
 *
 * Demo data is hardcoded; backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 842;
const PAGE_H = 595;
const V_MARGIN = 22;
const H_MARGIN = 22;

const HEADER_BLOCK_H = 110;
const TABLE_HEADER_H = 30;
const DATA_ROW_H = 22;
const FOOTER_H = 32;

const HEADER_FILL = [255, 255, 255];
const HEADER_TEXT = [0, 0, 0];
const BORDER = [150, 150, 150];
const NAVY = [0, 51, 102];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

export const SHIPMENT_DELAY_DOCUMENT_TITLE = 'Shipment Delay Report';
export const SHIPMENT_DELAY_PDF_FILENAME = 'Shipment Delay Report.pdf';

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} DelayCol */

/** @type {DelayCol[]} */
const COLS = [
  { key: 'poNo', label: 'P.O. #', weight: 50, align: 'left' },
  { key: 'customer', label: 'CUSTOMER NAME', weight: 72, align: 'left' },
  { key: 'vendor', label: 'VENDOR NAME', weight: 72, align: 'left' },
  { key: 'orderQty', label: 'ORDER\nQTY', weight: 40, align: 'right' },
  { key: 'shipDateV', label: 'SHIP. DATE\n(V)', weight: 56, align: 'center' },
  { key: 'shipDateB', label: 'SHIP. DATE\n(B)', weight: 56, align: 'center' },
  { key: 'invoiceValue', label: 'INVOICE\nVALUE', weight: 50, align: 'right' },
  { key: 'week1Delay', label: 'WEEK 1\nDELAY 3%', weight: 50, align: 'right' },
  { key: 'week2Delay', label: 'WEEK 2\nDELAY 5%', weight: 50, align: 'right' },
  { key: 'week3Delay', label: 'WEEK 3\nDELAY 8%', weight: 50, align: 'right' },
  { key: 'onward10', label: 'ONWARD\n10%', weight: 50, align: 'right' },
  { key: 'reasonB', label: 'REASON (B)', weight: 70, align: 'left' },
  { key: 'reasonV', label: 'REASON (V)', weight: 70, align: 'left' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy print mock-up (page 1 of 2).
// ----------------------------------------------------------------------

const RAW_DEMO_ROWS = [
  ['202300-310',     'Ultimate Apparel, Inc',  'Zakonin international',  3144, 'Apr 07, 2026', 'Apr 15, 2026', 4716,  '', '', '', 472, '', ''],
  ['202300-510',     'Ultimate Apparel, Inc',  'Zakonin international',  456,  'Apr 07, 2026', 'Apr 15, 2026', 606,   '', '', '', 61,  '', ''],
  ['202300-610',     'Ultimate Apparel, Inc',  'Zakonin international',  96,   'Apr 07, 2026', 'Apr 15, 2026', 180,   '', '', '', 18,  '', ''],
  ['202300-780',     'Ultimate Apparel, Inc',  'Zakonin international',  360,  'Apr 07, 2026', 'Apr 15, 2026', 504,   '', '', '', 50,  '', ''],
  ['202300-782',     'Ultimate Apparel, Inc',  'Zakonin international',  264,  'Apr 07, 2026', 'Apr 15, 2026', 370,   '', '', '', 37,  '', ''],
  ['202300-783',     'Ultimate Apparel, Inc',  'Zakonin international',  384,  'Apr 07, 2026', 'Apr 15, 2026', 538,   '', '', '', 54,  '', ''],
  ['202300-784',     'Ultimate Apparel, Inc',  'Zakonin international',  600,  'Apr 07, 2026', 'Apr 15, 2026', 900,   '', '', '', 90,  '', ''],
  ['202300-785',     'Ultimate Apparel, Inc',  'Zakonin international',  1056, 'Apr 07, 2026', 'Apr 15, 2026', 1584,  '', '', '', 158, '', ''],
  ['202300-786',     'Ultimate Apparel, Inc',  'Zakonin international',  480,  'Apr 07, 2026', 'Apr 15, 2026', 720,   '', '', '', 72,  '', ''],
  ['202300-787',     'Ultimate Apparel, Inc',  'Zakonin international',  1248, 'Apr 07, 2026', 'Apr 15, 2026', 1872,  '', '', '', 187, '', ''],
  ['202300-980',     'Ultimate Apparel, Inc',  'Zakonin international',  3312, 'Apr 07, 2026', 'Apr 15, 2026', 4802,  '', '', '', 480, '', ''],
  ['202300-981',     'Ultimate Apparel, Inc',  'Zakonin international',  2688, 'Apr 07, 2026', 'Apr 15, 2026', 3898,  '', '', '', 390, '', ''],
  ['202300-982',     'Ultimate Apparel, Inc',  'Zakonin international',  3288, 'Apr 07, 2026', 'Apr 15, 2026', 4768,  '', '', '', 477, '', ''],
  ['202300-984',     'Ultimate Apparel, Inc',  'Zakonin international',  1416, 'Apr 07, 2026', 'Apr 15, 2026', 2407,  '', '', '', 241, '', ''],
  ['202300-985',     'Ultimate Apparel, Inc',  'Zakonin international',  1176, 'Apr 07, 2026', 'Apr 15, 2026', 1999,  '', '', '', 200, '', ''],
  ['202300-986',     'Ultimate Apparel, Inc',  'Zakonin international',  1200, 'Apr 07, 2026', 'Apr 15, 2026', 2040,  '', '', '', 204, '', ''],
  ['202300-987',     'Ultimate Apparel, Inc',  'Zakonin international',  936,  'Apr 07, 2026', 'Apr 15, 2026', 1591,  '', '', '', 159, '', ''],
  ['202307',         'Ultimate Apparel, Inc',  'Zarkash international.', 5328, 'May 04, 2026', 'Jun 25, 2026', 19980, '', 999, '', '', '', ''],
  ['202310-910',     'Ultimate Apparel, Inc',  'Zakonin international',  2208, 'Apr 25, 2026', 'Apr 25, 2026', 3533,  '', '', 283, '', '', ''],
  ['202310-918',     'Ultimate Apparel, Inc',  'Zakonin international',  1104, 'Apr 25, 2026', 'Apr 25, 2026', 1325,  '', '', 106, '', '', ''],
  ['39021',          'LONE ROCK',              'Continental apparels',   5000, 'Apr 30, 2026', 'Apr 30, 2026', 3250,  163, '', '', '', '', ''],
  ['6822-A 2503A',   'Inter-gedi trading crop','K-TEX',                  432,  'Jun 10, 2025', 'Jun 10, 2025', 0,     '', '', '', 0,  '', ''],
  ['6822-A Denim',   'Inter-gedi trading crop','M.A Enterprises',        1200, 'Jun 10, 2025', 'Jun 10, 2025', 0,     '', '', '', 0,  '', ''],
  ['6822-B 2502-TH', 'Inter-gedi trading crop','M.A Enterprises',        1200, 'Jun 30, 2025', 'Jun 30, 2025', 0,     '', '', '', 0,  '', ''],
];

export const SHIPMENT_DELAY_REPORT_DEMO = {
  printedOn: '',
  rows: RAW_DEMO_ROWS.map(
    ([poNo, customer, vendor, orderQty, shipDateV, shipDateB, invoiceValue, week1Delay, week2Delay, week3Delay, onward10, reasonB, reasonV]) => ({
      poNo,
      customer,
      vendor,
      orderQty,
      shipDateV,
      shipDateB,
      invoiceValue,
      week1Delay,
      week2Delay,
      week3Delay,
      onward10,
      reasonB,
      reasonV,
    })
  ),
};

// ----------------------------------------------------------------------
// Geometry helpers
// ----------------------------------------------------------------------

function colWidths(innerW) {
  const sum = COLS.reduce((a, c) => a + c.weight, 0);
  const out = COLS.map((c) => (c.weight / sum) * innerW);
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

function formatPrintedOn(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US');
}

// ----------------------------------------------------------------------
// Drawing primitives
// ----------------------------------------------------------------------

function setBorder(doc) {
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.3);
}

function fillRect(doc, x, y, w, h, fill) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.rect(x, y, w, h, 'F');
}

function strokeRect(doc, x, y, w, h) {
  setBorder(doc);
  doc.rect(x, y, w, h);
}

function textInRect(doc, x, y, w, h, text, opts = {}) {
  const {
    align = 'left',
    bold = false,
    fontSize = 7,
    color = [0, 0, 0],
    pad = 3,
    maxLines = 2,
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
  const lineH = fontSize * 1.18;
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

function drawPageHeader(doc, logoDataUrl, meta) {
  const innerLeft = H_MARGIN;
  const innerRight = PAGE_W - H_MARGIN;

  // Logo (top-RIGHT — image layout flips logo to the right side)
  if (logoDataUrl) {
    try {
      const logoW = 110;
      const logoH = 34;
      doc.addImage(logoDataUrl, 'PNG', innerRight - logoW, V_MARGIN, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  // Address (right, under logo)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  const addrY = V_MARGIN + 44;
  doc.text(
    'A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800',
    innerRight,
    addrY,
    { align: 'right' }
  );
  doc.text(
    'Karachi - Pakistan.        Telephone # :  02134967216 & 02134946005',
    innerRight,
    addrY + 10,
    { align: 'right' }
  );

  // Title — bold, centered, placed below the address row.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('SHIPMENT DELAY REPORT', PAGE_W / 2, V_MARGIN + 76, {
    align: 'center',
    baseline: 'alphabetic',
  });

  // Reset for table.
  void innerLeft;
  doc.setTextColor(0, 0, 0);
  return V_MARGIN + HEADER_BLOCK_H;
}

// ----------------------------------------------------------------------
// Table
// ----------------------------------------------------------------------

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    fillRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, HEADER_FILL);
    strokeRect(doc, xs[i], y, widths[i], TABLE_HEADER_H);
    textInRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, col.label, {
      align: 'center',
      bold: true,
      fontSize: 7.4,
      color: HEADER_TEXT,
      pad: 2,
      maxLines: 2,
    });
  });
  return y + TABLE_HEADER_H;
}

function drawDataRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, DATA_ROW_H);

    let raw;
    switch (col.key) {
      case 'orderQty':
        raw = formatInt(row.orderQty);
        break;
      case 'invoiceValue':
        raw = formatInt(row.invoiceValue);
        break;
      case 'week1Delay':
        raw = formatInt(row.week1Delay);
        break;
      case 'week2Delay':
        raw = formatInt(row.week2Delay);
        break;
      case 'week3Delay':
        raw = formatInt(row.week3Delay);
        break;
      case 'onward10':
        raw = formatInt(row.onward10);
        break;
      default:
        raw = row[col.key];
    }

    if (raw === undefined || raw === null || raw === '') return;

    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      fontSize: 7,
      color: [0, 0, 0],
      pad: 3,
      maxLines: 2,
    });
  });
  return y + DATA_ROW_H;
}

// ----------------------------------------------------------------------
// Footer
// ----------------------------------------------------------------------

function drawFooter(doc, pageIdx, totalPages, printedOn) {
  const fy = PAGE_H - V_MARGIN - 2;

  // Printed on — left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Printed on :  ${printedOn || formatPrintedOn()}`, H_MARGIN, fy - 2, {
    baseline: 'bottom',
  });

  // Powered by / Developed by — centered
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

  // Page X of Y — right
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
 * @param {{ rows?: object[]; printedOn?: string }} data
 * @returns {Promise<Blob>}
 */
export async function buildShipmentDelayReportPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.rows) && data.rows.length > 0
      ? data
      : SHIPMENT_DELAY_REPORT_DEMO;

  const meta = {
    printedOn: payload.printedOn || data.printedOn || formatPrintedOn(),
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(innerW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let y = 0;

  const startPage = () => {
    y = drawPageHeader(doc, logoDataUrl, meta);
    y = drawTableHeader(doc, y, innerLeft, widths);
  };

  startPage();

  payload.rows.forEach((row) => {
    if (y + DATA_ROW_H > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'l');
      startPage();
    }
    y = drawDataRow(doc, y, innerLeft, widths, row);
  });

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, meta.printedOn);
  }

  try {
    doc.setProperties({
      title: SHIPMENT_DELAY_DOCUMENT_TITLE,
      subject: SHIPMENT_DELAY_DOCUMENT_TITLE,
    });
  } catch {
    /* setProperties unavailable — non-fatal, preview still works */
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openShipmentDelayReportPdf(mode, pdfBlob) {
  const namedFile =
    typeof File !== 'undefined'
      ? new File([pdfBlob], SHIPMENT_DELAY_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedFile);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = SHIPMENT_DELAY_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
