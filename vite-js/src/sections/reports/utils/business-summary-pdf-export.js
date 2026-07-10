import jsPDF from 'jspdf';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const V_MARGIN = 8;
const H_MARGIN = 6;
const HEADER_BLOCK_H = 92;
const TABLE_HEADER_ROW_H = 32;
const DATA_ROW_H = 22;
const TOTAL_ROW_H = 22;
const FOOTER_H = 18;

const TITLE_BLUE = [0, 51, 153];
const TABLE_BLUE = [97, 116, 159];

const PAGE_W = 842;
const PAGE_H = 595;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

export const BUSINESS_SUMMARY_DOCUMENT_TITLE = 'Business Summary';
export const BUSINESS_SUMMARY_PDF_FILENAME = 'Business Summary.pdf';

function setPdfDocumentTitle(doc, title) {
  if (!title) return;
  try {
    doc.setProperties({ title, subject: title });
  } catch (e) {
    /* setProperties unavailable — non-fatal, preview still works */
  }
}

const HEADERS = [
  'S.No',
  'Customer',
  'No. of Order',
  'Booked\nQuantity',
  'Shipped\nQuantity',
  'No. of Ship\nOrder',
  'Booked FOB',
  'Shipped FOB',
  'Booked Comm.\non FOB',
  'Shipped Comm.\non FOB',
  'Booked LDP\nAmount',
  'Shipped LDP\nAmount',
  'Target Achieved',
];

/**
 * Column weights tuned for A4 landscape width — trims excess Customer/qty spacing
 * while keeping money columns wide enough for values like `$1,046,498.10`.
 */
const COL_WEIGHTS = [18, 88, 48, 50, 50, 48, 66, 66, 62, 62, 72, 72, 58];

const CURRENCY_USD = '$';

/** Demo rows that mirror the spec image; replaced with API rows once backend lands. */
export const BUSINESS_SUMMARY_DEMO = {
  fromDate: '2026-01-01',
  toDate: '2026-12-31',
  rows: [
    {
      customer: 'AVALON APPAREL',
      noOfOrder: 5,
      bookedQty: 3256,
      shippedQty: 1488,
      noOfShipOrder: 1,
      bookedFob: 15642.0,
      shippedFob: 7812.0,
      bookedCommFob: 782.1,
      shippedCommFob: 390.6,
      bookedLdp: 26301.52,
      shippedLdp: 12648.0,
      targetAchieved: 45.7,
    },
    {
      customer: 'C-LIFE GROUP LTD.',
      noOfOrder: 16,
      bookedQty: 80208,
      shippedQty: 80136,
      noOfShipOrder: 16,
      bookedFob: 105745.92,
      shippedFob: 105639.36,
      bookedCommFob: 5287.3,
      shippedCommFob: 5281.97,
      bookedLdp: 171377.28,
      shippedLdp: 171195.84,
      targetAchieved: 99.91,
    },
    {
      customer: 'JEDCO BRANDS, INC',
      noOfOrder: 14,
      bookedQty: 159938,
      shippedQty: 97401,
      noOfShipOrder: 10,
      bookedFob: 283953.35,
      shippedFob: 50882.64,
      bookedCommFob: 21296.5,
      shippedCommFob: 3816.2,
      bookedLdp: 583394.0,
      shippedLdp: 243502.5,
      targetAchieved: 60.9,
    },
    {
      customer: 'LONE ROCK',
      noOfOrder: 111,
      bookedQty: 184648,
      shippedQty: 104736,
      noOfShipOrder: 67,
      bookedFob: 653532.98,
      shippedFob: 399761.28,
      bookedCommFob: 45747.31,
      shippedCommFob: 27948.56,
      bookedLdp: 1046498.1,
      shippedLdp: 642528.0,
      targetAchieved: 56.72,
    },
    {
      customer: 'MV SPORTS',
      noOfOrder: 26,
      bookedQty: 64872,
      shippedQty: 0,
      noOfShipOrder: 0,
      bookedFob: 165415.68,
      shippedFob: 0,
      bookedCommFob: 8270.78,
      shippedCommFob: 0,
      bookedLdp: 274317.36,
      shippedLdp: 0,
      targetAchieved: 0,
    },
    {
      customer: 'ULTIMATE APPAREL, INC',
      noOfOrder: 31,
      bookedQty: 122352,
      shippedQty: 87720,
      noOfShipOrder: 6,
      bookedFob: 166543.92,
      shippedFob: 100646.88,
      bookedCommFob: 8327.2,
      shippedCommFob: 5032.34,
      bookedLdp: 254631.12,
      shippedLdp: 130034.4,
      targetAchieved: 71.69,
    },
  ],
};

// ---------- helpers ----------

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

function formatIsoToMdY(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || '');
  const [y, m, d] = String(iso).split('-');
  return `${m}-${d}-${y}`;
}

function formatPrintStamp() {
  const d = new Date();
  const dateRaw = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return dateRaw.replace(/ /g, '-');
}

function formatMoney(value, currency) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${currency}${formatted}`;
}

function formatPlainAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US');
}

function formatPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return `${n.toFixed(2)} %`;
}

// ---------- drawing ----------

function drawCellBorder(doc, x, y, w, h) {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);
}

function drawBlueBoldUnderline(doc, text, x, y, maxW) {
  doc.setTextColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(String(text), maxW);
  let yy = y;
  lines.forEach((line) => {
    doc.text(line, x, yy);
    const tw = doc.getTextWidth(line);
    doc.setDrawColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
    doc.setLineWidth(0.4);
    doc.line(x, yy + 2, x + tw, yy + 2);
    yy += 12;
  });
  doc.setTextColor(0, 0, 0);
  return yy;
}

/** Blue background, white bold text — used by table header row and the total row. */
function drawBlueHeaderCell(doc, x, y, w, h, headerText) {
  doc.setFillColor(TABLE_BLUE[0], TABLE_BLUE[1], TABLE_BLUE[2]);
  doc.rect(x, y, w, h, 'F');
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const parts = String(headerText || '')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) parts.push('');

  let fs = 7;
  doc.setFontSize(fs);
  let lines = [];
  parts.forEach((p) => {
    lines.push(...doc.splitTextToSize(p, Math.max(3, w - 3)));
  });
  if (lines.length > 2) {
    fs = 6.2;
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
  lines.slice(0, 3).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
      baseline: 'middle',
      maxWidth: w - 2,
    });
  });
  doc.setTextColor(0, 0, 0);
}

function drawTextCell(doc, x, y, w, h, text, opts = {}) {
  const { align = 'left', bold = false, fontSize = 7, color = [0, 0, 0], fill } = opts;
  if (fill) {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.rect(x, y, w, h, 'F');
  }
  drawCellBorder(doc, x, y, w, h);
  if (text == null || text === '') return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  const maxW = Math.max(2, w - 4);
  const lines = doc.splitTextToSize(String(text), maxW);
  const lineH = fontSize * 1.18;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  let xText;
  if (align === 'center') xText = x + w / 2;
  else if (align === 'right') xText = x + w - 3;
  else xText = x + 3;
  lines.slice(0, 2).forEach((ln, i) => {
    doc.text(ln, xText, firstY + i * lineH, {
      align,
      baseline: 'middle',
      maxWidth: maxW,
    });
  });
  doc.setTextColor(0, 0, 0);
}

function drawTableHeaderRow(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  for (let i = 0; i < HEADERS.length; i += 1) {
    drawBlueHeaderCell(doc, xs[i], y, widths[i], TABLE_HEADER_ROW_H, HEADERS[i]);
  }
  return y + TABLE_HEADER_ROW_H;
}

function drawDataRow(doc, y, x0, widths, sNo, row) {
  const xs = colXs(x0, widths);
  let i = 0;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, sNo, { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.customer, { align: 'left' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatQty(row.noOfOrder), { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatQty(row.bookedQty), { align: 'right' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatQty(row.shippedQty), { align: 'right' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatQty(row.noOfShipOrder), { align: 'center' });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatMoney(row.bookedFob, CURRENCY_USD), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatPlainAmount(row.shippedFob), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatMoney(row.bookedCommFob, CURRENCY_USD), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatPlainAmount(row.shippedCommFob), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatMoney(row.bookedLdp, CURRENCY_USD), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatPlainAmount(row.shippedLdp), {
    align: 'right',
  });
  i += 1;
  drawTextCell(doc, xs[i], y, widths[i], DATA_ROW_H, formatPercent(row.targetAchieved), {
    align: 'center',
  });
  return y + DATA_ROW_H;
}

function sumRows(rows) {
  return rows.reduce(
    (acc, r) => {
      acc.noOfOrder += Number(r.noOfOrder) || 0;
      acc.bookedQty += Number(r.bookedQty) || 0;
      acc.shippedQty += Number(r.shippedQty) || 0;
      acc.noOfShipOrder += Number(r.noOfShipOrder) || 0;
      acc.bookedFob += Number(r.bookedFob) || 0;
      acc.shippedFob += Number(r.shippedFob) || 0;
      acc.bookedCommFob += Number(r.bookedCommFob) || 0;
      acc.shippedCommFob += Number(r.shippedCommFob) || 0;
      acc.bookedLdp += Number(r.bookedLdp) || 0;
      acc.shippedLdp += Number(r.shippedLdp) || 0;
      return acc;
    },
    {
      noOfOrder: 0,
      bookedQty: 0,
      shippedQty: 0,
      noOfShipOrder: 0,
      bookedFob: 0,
      shippedFob: 0,
      bookedCommFob: 0,
      shippedCommFob: 0,
      bookedLdp: 0,
      shippedLdp: 0,
    }
  );
}

/**
 * Computes the weighted Target Achieved % so the grand total mirrors the spec image
 * (Shipped FOB ÷ Booked FOB * 100). Falls back to 0 when there is no booked value.
 */
function computeTargetAchievedPercent(totals) {
  const booked = Number(totals.bookedFob) || 0;
  const shipped = Number(totals.shippedFob) || 0;
  if (booked <= 0) return 0;
  return (shipped / booked) * 100;
}

/** Total row uses the blue header style — white bold text on the blue band. */
function drawTotalRow(doc, y, x0, widths, totals) {
  const xs = colXs(x0, widths);
  const fill = TABLE_BLUE;
  const white = [255, 255, 255];

  const cell = (idx, text, align = 'right') => {
    drawTextCell(doc, xs[idx], y, widths[idx], TOTAL_ROW_H, text, {
      align,
      bold: true,
      color: white,
      fontSize: 7,
      fill,
    });
  };

  cell(0, '', 'left');
  cell(1, 'Total', 'center');
  cell(2, formatQty(totals.noOfOrder), 'center');
  cell(3, formatQty(totals.bookedQty), 'right');
  cell(4, formatQty(totals.shippedQty), 'right');
  cell(5, formatQty(totals.noOfShipOrder), 'center');
  cell(6, formatMoney(totals.bookedFob, CURRENCY_USD), 'right');
  cell(7, formatMoney(totals.shippedFob, CURRENCY_USD), 'right');
  cell(8, formatMoney(totals.bookedCommFob, CURRENCY_USD), 'right');
  cell(9, formatMoney(totals.shippedCommFob, CURRENCY_USD), 'right');
  cell(10, formatMoney(totals.bookedLdp, CURRENCY_USD), 'right');
  cell(11, formatMoney(totals.shippedLdp, CURRENCY_USD), 'right');
  cell(12, formatPercent(computeTargetAchievedPercent(totals)), 'center');

  return y + TOTAL_ROW_H;
}

function drawOuterTableFrame(doc, x, y, w, h) {
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.5);
  doc.rect(x, y, w, h);
}

function drawPageHeader(doc, logoDataUrl, meta) {
  const innerLeft = H_MARGIN;
  const innerRight = PAGE_W - H_MARGIN;
  const logoW = 110;
  const logoH = 36;
  const logoX = innerRight - logoW;
  const logoY = V_MARGIN + 4;
  const leftMaxW = Math.max(140, logoX - innerLeft - 12);

  let y = V_MARGIN + 12;
  y = drawBlueBoldUnderline(doc, 'Business Summary', innerLeft, y, leftMaxW) + 2;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.6);
  const fromH = formatIsoToMdY(meta.fromDate);
  const toH = formatIsoToMdY(meta.toDate);
  doc.text(`For the period :  ${fromH} To ${toH}`, innerLeft, y);
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(70, 70, 70);
  doc.text('*Amounts are in US Dollar', innerLeft, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.4);
  doc.setTextColor(70, 70, 70);
  doc.text(
    'A.M.S House B4,Kakan Housing Society Alamgir Road - Postal Code: 74800',
    innerRight,
    logoY + logoH + 7,
    { align: 'right', baseline: 'top' }
  );
  doc.text(
    'Karachi - Pakistan.    Telephone # : 02134967216 & 02134946005',
    innerRight,
    logoY + logoH + 14,
    { align: 'right', baseline: 'top' }
  );
  doc.setTextColor(0, 0, 0);

  const tableTop = V_MARGIN + HEADER_BLOCK_H;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.text(`Printed on:    ${formatPrintStamp()}`, innerRight, tableTop - 6, {
    align: 'right',
    baseline: 'bottom',
  });

  return tableTop;
}

function drawFooter(doc) {
  const fy = PAGE_H - V_MARGIN - 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('Powered by : INTEGRA ERP SYSTEM', PAGE_W / 2, fy, {
    align: 'center',
    baseline: 'bottom',
  });
}

/**
 * @param {{ fromDate?: string; toDate?: string; rows?: object[] }} data
 * @param {{ fromDate?: string; toDate?: string }} [meta]
 */
export async function buildBusinessSummaryPdfBlob(data, meta = {}) {
  const payload =
    data && Array.isArray(data.rows) ? data : { rows: [] };
  const headerMeta = {
    fromDate: meta.fromDate || data?.fromDate || '',
    toDate: meta.toDate || data?.toDate || '',
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(innerW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let tableSegTop = 0;
  let y = 0;

  const startPage = () => {
    const tableTop = drawPageHeader(doc, logoDataUrl, headerMeta);
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

  payload.rows.forEach((row, idx) => {
    if (y + DATA_ROW_H > pageBodyBottom) {
      flushSegmentFrame();
      doc.addPage([PAGE_W, PAGE_H], 'l');
      startPage();
    }
    y = drawDataRow(doc, y, innerLeft, widths, idx + 1, row);
  });

  if (y + TOTAL_ROW_H > pageBodyBottom) {
    flushSegmentFrame();
    doc.addPage([PAGE_W, PAGE_H], 'l');
    startPage();
  }
  const totals = sumRows(payload.rows);
  y = drawTotalRow(doc, y, innerLeft, widths, totals);

  flushSegmentFrame();

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc);
  }

  setPdfDocumentTitle(doc, BUSINESS_SUMMARY_DOCUMENT_TITLE);

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openBusinessSummaryPdf(mode, pdfBlob) {
  const namedPdf =
    typeof File !== 'undefined'
      ? new File([pdfBlob], BUSINESS_SUMMARY_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedPdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = BUSINESS_SUMMARY_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
