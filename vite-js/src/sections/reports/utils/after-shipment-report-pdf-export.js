import jsPDF from 'jspdf';

/**
 * After Shipment Report — landscape PDF.
 *
 * Layout (per legacy print):
 *   - Top-left  : AMS logo + 2-line company address.
 *   - Center    : "AFTER SHIPMENT REPORT" (bold, oversized) placed below
 *                 the address block so it never overlaps any text.
 *   - Top-right : "From : <date>     To : <date>"  (single line, bold black).
 *   - Table     : 12 cols (PONO, Customer, Vendor, Order Qty,
 *                 Shipment Date (B), Shipment Date (V), Cargo Ship.Date,
 *                 Shipped Qty, Shipped Carton, R.Shipment Date (B),
 *                 R.Shipment Date (V), Reason) — white header band with
 *                 black bold labels.
 *   - Footer    : Printed on (left), Powered by … / Developed by … (center),
 *                 Page X of Y (right).
 *
 * Demo data is hardcoded; backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

/** Landscape — 12 columns need horizontal breathing room. */
const PAGE_W = 842;
const PAGE_H = 595;
const V_MARGIN = 22;
const H_MARGIN = 22;

const HEADER_BLOCK_H = 130;
const TABLE_HEADER_H = 30;
const DATA_ROW_H = 22;
const FOOTER_H = 32;

/** White table-header band with black bold text — matches the legacy print. */
const HEADER_FILL = [255, 255, 255];
const HEADER_TEXT = [0, 0, 0];
const BORDER = [150, 150, 150];
const NAVY = [0, 51, 102];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

export const AFTER_SHIPMENT_DOCUMENT_TITLE = 'AFTER SHIPMENT REPORT';
export const AFTER_SHIPMENT_PDF_FILENAME = 'AFTER SHIPMENT REPORT.pdf';

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right' }} AfterShipmentCol */

/** @type {AfterShipmentCol[]} */
const COLS = [
  { key: 'pono', label: 'PONO', weight: 64, align: 'left' },
  { key: 'customer', label: 'CUSTOMER', weight: 60, align: 'center' },
  { key: 'vendor', label: 'VENDOR', weight: 60, align: 'center' },
  { key: 'orderQty', label: 'ORDER\nQTY', weight: 40, align: 'right' },
  { key: 'shipmentDateB', label: 'SHIPMENT\nDATE (B)', weight: 56, align: 'center' },
  { key: 'shipmentDateV', label: 'SHIPMENT\nDATE (V)', weight: 56, align: 'center' },
  { key: 'cargoShipDate', label: 'CARGO\nSHIP.DATE', weight: 56, align: 'center' },
  { key: 'shippedQty', label: 'SHIPPE\nD QTY', weight: 48, align: 'right' },
  { key: 'shippedCarton', label: 'SHIPPED\nCARTON', weight: 50, align: 'right' },
  { key: 'rShipmentDateB', label: 'R.SHIPMENT\nDATE (B)', weight: 64, align: 'center' },
  { key: 'rShipmentDateV', label: 'R.SHIPMENT\nDATE (V)', weight: 64, align: 'center' },
  { key: 'reason', label: 'REASON', weight: 96, align: 'left' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy print mock-up (page 1 of 10).
// ----------------------------------------------------------------------

const RAW_DEMO_ROWS = [
  ['37855-MPO-PEACH',  'LONE ROCK', 'MS GARMENTS', 1344, 'Sep 02, 2025', 'Sep 02, 2025', 'Jan 08, 2026', 6405,  268, '', '', ''],
  ['38104-MPO-NAVY',   'LONE ROCK', 'MS GARMENTS', 2160, 'Dec 01, 2025', 'Oct 30, 2025', 'Jan 03, 2026', 16104, 671, '', '', ''],
  ['38275-MPO-BASIL',  'LONE ROCK', 'MS GARMENTS', 3408, 'Dec 02, 2025', 'Dec 02, 2025', 'Jan 21, 2026', 16944, 706, '', '', ''],
  ['38275-MPO-BROWN',  'LONE ROCK', 'MS GARMENTS', 1296, 'Dec 02, 2025', 'Dec 02, 2025', 'Jan 03, 2026', 16104, 671, '', '', ''],
  ['38275-MPO-BROWN',  'LONE ROCK', 'MS GARMENTS', 1296, 'Dec 02, 2025', 'Dec 02, 2025', 'Mar 21, 2026', 18000, 748, '', '', ''],
  ['38275-MCS-BASIL',  'LONE ROCK', 'MS GARMENTS', 3672, 'Dec 02, 2025', 'Dec 02, 2025', 'Jan 03, 2026', 16104, 671, '', '', ''],
  ['38275-MCS-BROWN',  'LONE ROCK', 'MS GARMENTS', 504,  'Dec 02, 2025', 'Dec 02, 2025', 'Jan 03, 2026', 16104, 671, '', '', ''],
  ['38275-MCS-CHAR',   'LONE ROCK', 'MS GARMENTS', 288,  'Dec 02, 2025', 'Dec 02, 2025', 'Jan 03, 2026', 16104, 671, '', '', ''],
  ['38275-MCS-DENIM',  'LONE ROCK', 'MS GARMENTS', 1032, 'Dec 02, 2025', 'Dec 02, 2025', 'Jan 03, 2026', 16104, 671, '', '', ''],
  ['38275-MCS-OAT',    'LONE ROCK', 'MS GARMENTS', 2352, 'Dec 02, 2025', 'Dec 02, 2025', 'Jan 03, 2026', 16104, 671, '', '', ''],
  ['38275-MZH-BROWN',  'LONE ROCK', 'MS GARMENTS', 216,  'Dec 02, 2025', 'Dec 02, 2025', 'Jan 08, 2026', 6405,  268, '', '', ''],
  ['38275-MZH-CHAR',   'LONE ROCK', 'MS GARMENTS', 5160, 'Dec 02, 2025', 'Dec 02, 2025', 'Jan 03, 2026', 16104, 671, '', '', ''],
  ['38275-MZH-DENIM',  'LONE ROCK', 'MS GARMENTS', 504,  'Dec 02, 2025', 'Dec 02, 2025', 'Jan 03, 2026', 16104, 671, '', '', ''],
];

export const AFTER_SHIPMENT_REPORT_DEMO = {
  fromLabel: 'Jan 01, 2026',
  toLabel: 'Dec 31, 2026',
  printedOn: '',
  rows: RAW_DEMO_ROWS.map(
    ([pono, customer, vendor, orderQty, shipmentDateB, shipmentDateV, cargoShipDate, shippedQty, shippedCarton, rShipmentDateB, rShipmentDateV, reason]) => ({
      pono,
      customer,
      vendor,
      orderQty,
      shipmentDateB,
      shipmentDateV,
      cargoShipDate,
      shippedQty,
      shippedCarton,
      rShipmentDateB,
      rShipmentDateV,
      reason,
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

  // Logo (top-left)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', innerLeft, V_MARGIN, 110, 34);
    } catch {
      /* ignore */
    }
  }

  // Address (left, under logo)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  const addrY = V_MARGIN + 44;
  doc.text(
    'A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800',
    innerLeft,
    addrY
  );
  doc.text(
    'Karachi - Pakistan.            Telephone # :  02134967216 & 02134946005',
    innerLeft,
    addrY + 10
  );

  // Title — bold, larger, placed BELOW the address block so it never overlaps.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('AFTER SHIPMENT REPORT', PAGE_W / 2, V_MARGIN + 82, {
    align: 'center',
    baseline: 'alphabetic',
  });

  // From / To — SINGLE line, right-aligned, BLACK bold.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `From : ${meta.fromLabel || ''}        To : ${meta.toLabel || ''}`,
    innerRight,
    V_MARGIN + 104,
    { align: 'right' }
  );

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
    if (col.key === 'orderQty') raw = formatInt(row.orderQty);
    else if (col.key === 'shippedQty') raw = formatInt(row.shippedQty);
    else if (col.key === 'shippedCarton') raw = formatInt(row.shippedCarton);
    else raw = row[col.key];

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
 * @param {{ rows?: object[]; fromLabel?: string; toLabel?: string; printedOn?: string }} data
 * @returns {Promise<Blob>}
 */
export async function buildAfterShipmentReportPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.rows)
      ? {
          fromLabel: data.fromLabel || AFTER_SHIPMENT_REPORT_DEMO.fromLabel,
          toLabel: data.toLabel || AFTER_SHIPMENT_REPORT_DEMO.toLabel,
          printedOn: data.printedOn || '',
          rows: data.rows,
        }
      : AFTER_SHIPMENT_REPORT_DEMO;

  const meta = {
    fromLabel: payload.fromLabel || data.fromLabel || '',
    toLabel: payload.toLabel || data.toLabel || '',
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
      title: AFTER_SHIPMENT_DOCUMENT_TITLE,
      subject: AFTER_SHIPMENT_DOCUMENT_TITLE,
    });
  } catch (e) {
    /* setProperties unavailable — non-fatal, preview still works */
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openAfterShipmentReportPdf(mode, pdfBlob) {
  const namedPdf =
    typeof File !== 'undefined'
      ? new File([pdfBlob], AFTER_SHIPMENT_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedPdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = AFTER_SHIPMENT_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

/** Resolve "YYYY-MM-DD" → "Jan 01, 2026" style for header display. */
export function afterShipmentHeaderDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || '');
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso || '');
  const m = d.toLocaleDateString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${m} ${day}, ${d.getFullYear()}`;
}
