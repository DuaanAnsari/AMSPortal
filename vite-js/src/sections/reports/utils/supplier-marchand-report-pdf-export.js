import jsPDF from 'jspdf';

/**
 * "SUPPLIER MERCHAND REPORT" — portrait PDF (legacy print mock-up).
 *
 *   - Header : AMS logo + address + telephone 02134937216 & 02134946005.
 *   - Title : centred, bold, uppercase navy, underlined.
 *   - Table spans ~full content width; column mix ≈45% Supplier (left) /
 *     38% Merchand (centre) / 17% Order's (centre); #D3D3D3 header; black grid.
 *   - Portrait page 680×980 pt (roomier than A4).
 *   - Footer : Printed on (dd-Mon-yyyy); INTEGRA / ITG centre; page count.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 680;
const PAGE_H = 980;
/** Narrow side margins so the grid uses ~95% of page width */
const H_MARGIN = 22;
const V_MARGIN_TOP = 24;
const V_MARGIN_BOTTOM = 44;

const LOGO_W = 92;
const LOGO_H = 48;

const NAVY = [0, 51, 102];
const TABLE_BORDER = [0, 0, 0];
/** Legacy header grey #D3D3D3 */
const HEADER_FILL = [211, 211, 211];

const PDF_VIEW_ZOOM_HASH = '#zoom=100';

/**
 * Column weight mix ≈ 46% / 38% / 16% — Supplier widest, Order's narrowest
 * (legacy print mock-up).
 */
const COL_WEIGHTS = { supplier: 230, merchand: 190, orders: 80 };

const TABLE_HEADER_H = 22;
const DATA_ROW_H = 21;

const DEMO_ROWS = [
  { supplier: 'Ayyoub Apparels', merchand: 'MUHAMMAD SHAHZAIB', orders: '28' },
  { supplier: 'Comfort apparel', merchand: 'MUHAMMAD SHAHZAIB', orders: '49' },
  { supplier: 'ZR APPAREL', merchand: 'MUHAMMAD SHAHZAIB', orders: '79' },
  { supplier: 'Jedco brands, inc', merchand: 'MUHAMMAD SHAHZAIB', orders: '52' },
  { supplier: 'MV SPORTS', merchand: 'MUHAMMAD SHAHZAIB', orders: '36' },
  { supplier: 'STARTEX INDUSTRIES', merchand: 'MUHAMMAD SHAHZAIB', orders: '41' },
  { supplier: 'LONE ROCK', merchand: 'MUHAMMAD SHAHZAIB', orders: '63' },
  { supplier: 'Ayyoub Apparels', merchand: 'MUHAMMAD SHAHZAIB', orders: '22' },
  { supplier: 'Comfort apparel', merchand: 'MUHAMMAD SHAHZAIB', orders: '91' },
];

async function loadLogoDataUrl() {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) throw new Error(`logo ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** e.g. 15-May-2026 */
function formatPrintedDash(d = new Date()) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function setBorder(doc, lineW = 0.35) {
  doc.setDrawColor(TABLE_BORDER[0], TABLE_BORDER[1], TABLE_BORDER[2]);
  doc.setLineWidth(lineW);
}

function colWidths(tableW) {
  const sum = COL_WEIGHTS.supplier + COL_WEIGHTS.merchand + COL_WEIGHTS.orders;
  const w1 = (COL_WEIGHTS.supplier / sum) * tableW;
  const w2 = (COL_WEIGHTS.merchand / sum) * tableW;
  const w3 = tableW - w1 - w2;
  return [w1, w2, w3];
}

function colXs(x0, widths) {
  return [x0, x0 + widths[0], x0 + widths[0] + widths[1]];
}

function drawPageHeader(doc, logoDataUrl) {
  const x = H_MARGIN;
  const y = V_MARGIN_TOP;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', x, y, LOGO_W, LOGO_H, undefined, 'FAST');
    } catch {
      /* skip */
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const ay = y + LOGO_H + 6;
  doc.text(
    'A M S House 84, Kokan Housing Society Alamgir Road - Postal Code: 74800 Karachi - Pakistan.',
    x,
    ay,
    { baseline: 'top', maxWidth: PAGE_W - 2 * H_MARGIN - 4 }
  );
  doc.text('Telephone # : 02134937216 & 02134946005', x, ay + 12, { baseline: 'top' });

  const titleText = 'SUPPLIER MERCHAND REPORT';
  const titleY = ay + 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text(titleText, PAGE_W / 2, titleY, { align: 'center', baseline: 'middle' });
  const tw = doc.getTextWidth(titleText);
  const lineY = titleY + 7;
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(0.55);
  doc.line(PAGE_W / 2 - tw / 2, lineY, PAGE_W / 2 + tw / 2, lineY);
  doc.setTextColor(0, 0, 0);

  return lineY + 16;
}

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  const labels = ['Supplier', 'Merchand', "Order's"];
  const h = TABLE_HEADER_H;
  for (let i = 0; i < 3; i += 1) {
    doc.setFillColor(HEADER_FILL[0], HEADER_FILL[1], HEADER_FILL[2]);
    doc.rect(xs[i], y, widths[i], h, 'F');
    setBorder(doc, 0.35);
    doc.rect(xs[i], y, widths[i], h);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text(labels[i], xs[i] + widths[i] / 2, y + h / 2, { align: 'center', baseline: 'middle' });
  }
  return y + h;
}

function drawDataRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  const h = DATA_ROW_H;
  for (let i = 0; i < 3; i += 1) {
    setBorder(doc, 0.3);
    doc.rect(xs[i], y, widths[i], h);
  }

  const pad = 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(row.supplier || '', xs[0] + pad, y + h / 2, {
    align: 'left',
    baseline: 'middle',
    maxWidth: widths[0] - pad * 2,
  });

  doc.text((row.merchand || '').toUpperCase(), xs[1] + widths[1] / 2, y + h / 2, {
    align: 'center',
    baseline: 'middle',
    maxWidth: widths[1] - 4,
  });

  doc.text(String(row.orders ?? ''), xs[2] + widths[2] / 2, y + h / 2, {
    align: 'center',
    baseline: 'middle',
  });

  return y + h;
}

function drawFooter(doc, pageIdx, totalPages, printedOn) {
  const cx = PAGE_W / 2;
  const yPowered = PAGE_H - V_MARGIN_BOTTOM + 2;
  const yDev = PAGE_H - V_MARGIN_BOTTOM + 12;
  const yBottom = PAGE_H - V_MARGIN_BOTTOM + 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Powered by : INTEGRA ERP SYSTEM', cx, yPowered, { align: 'center', baseline: 'bottom' });

  doc.setFontSize(7);
  doc.text(
    'Developed by: ITG (Pvt) Ltd. - Website: www.itg.net.pk',
    cx,
    yDev,
    { align: 'center', baseline: 'bottom' }
  );

  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Printed on: ${printedOn || formatPrintedDash()}`, H_MARGIN, yBottom, {
    baseline: 'bottom',
  });
  doc.text(`Page ${pageIdx} of ${totalPages}`, PAGE_W - H_MARGIN, yBottom, {
    align: 'right',
    baseline: 'bottom',
  });
  doc.setTextColor(0, 0, 0);
}

/**
 * @param {{
 *   rows?: Array<{ supplier: string; merchand: string; orders: string|number }>;
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildSupplierMarchandReportPdfBlob(data = {}) {
  const rows = Array.isArray(data.rows) && data.rows.length > 0 ? data.rows : DEMO_ROWS;
  const printedOn = data.printedOn || formatPrintedDash();

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'p' });
  const logoDataUrl = await loadLogoDataUrl();

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(tableW);
  const bodyBottom = PAGE_H - V_MARGIN_BOTTOM - 4;

  let y = drawPageHeader(doc, logoDataUrl);
  y = drawTableHeader(doc, y, tableX, widths);

  rows.forEach((row) => {
    if (y + DATA_ROW_H > bodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'p');
      y = V_MARGIN_TOP + 8;
      y = drawTableHeader(doc, y, tableX, widths);
    }
    y = drawDataRow(doc, y, tableX, widths, row);
  });

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, printedOn);
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openSupplierMarchandReportPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Supplier-Merchand-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
