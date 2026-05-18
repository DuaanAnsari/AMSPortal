import jsPDF from 'jspdf';

/**
 * Order Detail Report — portrait PDF (legacy print layout).
 *
 *   - Header : "ORDER DETAIL REPORT" (blue, bold, underlined, top-left); AMS logo
 *     top-right; "Print Date: …" under logo, right-aligned.
 *   - Group bands : order line + supplier line (#D3D3D3, bold, centred, full width).
 *   - Table : 12 columns, black grid, grey thead; tall data rows (legacy print);
 *     QNTY right-aligned with thousands + 2dp.
 *   - Footer : full-width rule; centred "Powered by :" + bold "INTERACTIVE TECHNOLOGIES GATEWAY";
 *     "Page n of m" left-aligned on the next line.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 680;
const PAGE_H = 980;
const H_MARGIN = 22;
const V_MARGIN_TOP = 22;
/** Space reserved at bottom: separator + two footer text lines */
const FOOTER_RESERVE = 52;
const CONTENT_BOTTOM_PAD = 8;

const LOGO_W = 88;
const LOGO_H = 46;

const TITLE_BLUE = [0, 51, 153];
const TABLE_BORDER = [0, 0, 0];
const HEADER_FILL = [211, 211, 211];

const PDF_VIEW_ZOOM_HASH = '#zoom=100';

/** Minimum body row height (~4× typical thead) — matches legacy tall grid rows. */
const DATA_ROW_MIN_H = 132;
const DATA_ROW_PAD_V = 16;

/** Column weights — Picture narrow … QNTY narrow numeric. */
const COL_WEIGHTS = [26, 34, 72, 64, 30, 36, 28, 36, 28, 28, 36, 42];

const HEADERS = [
  'PICTURE',
  'PRODUCT CODE',
  'DESCRIPTION',
  'COLOR',
  'LAB DIP',
  'MAIN-CARE LABEL',
  'HANGTAG',
  'STRIKE OFF',
  'PP SAMPLE',
  'TOP SAMPLE',
  'LICENSER SAMPLE',
  'QNTY',
];

const DEMO_ORDER = {
  orderLabel: '006058 NEON',
  supplierLabel: 'PROXIMA SRL',
  rows: [
    {
      productCode: '006058',
      description: '006058 NEON CARGO',
      color:
        '1- (DARK MILITARY GREEN_664)\n2- (DARK MILITARY GREEN_664)\n3- (DARK MILITARY GREEN_664)\n4- (DARK MILITARY GREEN_664)',
      labDip: '',
      mainCare: '',
      hangtag: '',
      strikeOff: '',
      ppSample: '',
      topSample: '',
      licenserSample: '',
      qty: 7968,
      swatch: [88, 118, 78],
    },
    {
      productCode: '006058',
      description: '006058 NEON CARGO',
      color:
        '5- (DARK MILITARY GREEN_664)\n6- (DARK MILITARY GREEN_664)\n7- (DARK MILITARY GREEN_664)\n8- (DARK MILITARY GREEN_664)',
      labDip: '',
      mainCare: '',
      hangtag: '',
      strikeOff: '',
      ppSample: '',
      topSample: '',
      licenserSample: '',
      qty: 8580,
      swatch: [92, 110, 85],
    },
  ],
  grandTotal: 16548,
};

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

/** e.g. 15-May-2026 12:55 pm */
function formatPrintDateTime(d = new Date()) {
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
  const dd = d.getDate();
  const mon = months[d.getMonth()];
  const yyyy = d.getFullYear();
  const time = d
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
  return `${dd}-${mon}-${yyyy} ${time}`;
}

function formatQty(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n ?? '');
  return x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setBorder(doc, lineW = 0.3) {
  doc.setDrawColor(TABLE_BORDER[0], TABLE_BORDER[1], TABLE_BORDER[2]);
  doc.setLineWidth(lineW);
}

function colWidths(tableW) {
  const sum = COL_WEIGHTS.reduce((a, b) => a + b, 0);
  const widths = COL_WEIGHTS.map((w) => (w / sum) * tableW);
  const drift = tableW - widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += drift;
  return widths;
}

function colXs(x0, widths) {
  const xs = [x0];
  for (let i = 0; i < widths.length; i += 1) xs.push(xs[i] + widths[i]);
  return xs;
}

/** Blue bold title + underline (left-aligned). */
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
    doc.setLineWidth(0.35);
    doc.line(x, yy + 2, x + tw, yy + 2);
    yy += 13;
  });
  doc.setTextColor(0, 0, 0);
  return yy;
}

function drawPageHeader(doc, logoDataUrl, printDateStr) {
  const innerL = H_MARGIN;
  const innerR = PAGE_W - H_MARGIN;
  const logoX = innerR - LOGO_W;
  const logoY = V_MARGIN_TOP;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, LOGO_W, LOGO_H, undefined, 'FAST');
    } catch {
      /* skip */
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Print Date: ${printDateStr}`, innerR, logoY + LOGO_H + 14, {
    align: 'right',
    baseline: 'alphabetic',
  });

  const titleMaxW = Math.max(120, logoX - innerL - 12);
  const titleBottom = drawBlueBoldUnderline(doc, 'ORDER DETAIL REPORT', innerL, logoY + 10, titleMaxW);

  return Math.max(titleBottom, logoY + LOGO_H + 22) + 6;
}

function drawFullWidthBand(doc, x, w, y, h, text) {
  doc.setFillColor(HEADER_FILL[0], HEADER_FILL[1], HEADER_FILL[2]);
  setBorder(doc, 0.3);
  doc.rect(x, y, w, h, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(String(text || ''), x + w / 2, y + h / 2, {
    align: 'center',
    baseline: 'middle',
    maxWidth: w - 8,
  });
  return y + h;
}

function headerCellHeight(doc, label, w) {
  const parts = String(label || '')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) parts.push('—');
  let fs = 6.2;
  doc.setFont('helvetica', 'bold');
  let lines = [];
  parts.forEach((p) => {
    doc.setFontSize(fs);
    lines.push(...doc.splitTextToSize(p, Math.max(4, w - 4)));
  });
  if (lines.length > 4) {
    fs = 5.4;
    doc.setFontSize(fs);
    lines = [];
    parts.forEach((p) => {
      lines.push(...doc.splitTextToSize(p, Math.max(4, w - 4)));
    });
  }
  const lineH = fs * 1.15;
  return Math.max(22, 6 + lines.length * lineH);
}

function drawTableHeaderRow(doc, y0, x0, widths) {
  const xs = colXs(x0, widths);
  let maxH = 22;
  for (let i = 0; i < widths.length; i += 1) {
    maxH = Math.max(maxH, headerCellHeight(doc, HEADERS[i], widths[i]));
  }

  let y = y0;
  for (let i = 0; i < widths.length; i += 1) {
    const w = widths[i];
    const x = xs[i];
    doc.setFillColor(HEADER_FILL[0], HEADER_FILL[1], HEADER_FILL[2]);
    setBorder(doc, 0.3);
    doc.rect(x, y, w, maxH, 'FD');

    const parts = String(HEADERS[i] || '')
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    let fs = 6.2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fs);
    let lines = [];
    parts.forEach((p) => {
      lines.push(...doc.splitTextToSize(p, Math.max(4, w - 4)));
    });
    if (lines.length > 4) {
      fs = 5.4;
      doc.setFontSize(fs);
      lines = [];
      parts.forEach((p) => {
        lines.push(...doc.splitTextToSize(p, Math.max(4, w - 4)));
      });
    }
    const lineH = fs * 1.12;
    let ty = y + (maxH - lines.length * lineH) / 2 + lineH * 0.72;
    doc.setTextColor(0, 0, 0);
    lines.forEach((ln) => {
      doc.text(ln, x + w / 2, ty, { align: 'center', baseline: 'alphabetic', maxWidth: w - 4 });
      ty += lineH;
    });
  }

  return y + maxH;
}

function bodyLines(doc, text, w, fontSize = 7) {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(String(text ?? ''), Math.max(4, w - 6));
}

function measureDataRowHeight(doc, row, widths) {
  const descLines = bodyLines(doc, row.description, widths[2], 7.5);
  const colorLines = bodyLines(doc, row.color, widths[3], 7.2);
  const lhD = 8;
  const lhC = 7.6;
  const textBlock = Math.max(descLines.length * lhD, colorLines.length * lhC) + DATA_ROW_PAD_V * 2;
  return Math.max(DATA_ROW_MIN_H, textBlock);
}

function vTextStart(y, h, lineCount, lineHeight) {
  return y + (h - lineCount * lineHeight) / 2 + lineHeight * 0.72;
}

function drawDataRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  const h = measureDataRowHeight(doc, row, widths);

  for (let i = 0; i < widths.length; i += 1) {
    setBorder(doc, 0.3);
    doc.rect(xs[i], y, widths[i], h);
  }

  // Picture — thumbnail area (scales with tall row)
  const picPad = 8;
  const picSize = Math.min(widths[0] - picPad * 2, h - picPad * 2, 56);
  const px = xs[0] + (widths[0] - picSize) / 2;
  const py = y + (h - picSize) / 2;
  const rgb = row.swatch && row.swatch.length === 3 ? row.swatch : [200, 200, 200];
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.rect(px, py, picSize, picSize, 'F');
  setBorder(doc, 0.25);
  doc.rect(px, py, picSize, picSize);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const lhMain = 8;
  const lhSmall = 7.6;

  const pcLines = bodyLines(doc, row.productCode, widths[1], 7.5);
  let ty = vTextStart(y, h, pcLines.length, lhMain);
  pcLines.forEach((ln) => {
    doc.text(ln, xs[1] + 3, ty, { align: 'left', baseline: 'alphabetic', maxWidth: widths[1] - 6 });
    ty += lhMain;
  });

  const dLines = bodyLines(doc, row.description, widths[2], 7.5);
  ty = vTextStart(y, h, dLines.length, lhMain);
  dLines.forEach((ln) => {
    doc.text(ln, xs[2] + 3, ty, { align: 'left', baseline: 'alphabetic', maxWidth: widths[2] - 6 });
    ty += lhMain;
  });

  const cLines = bodyLines(doc, row.color, widths[3], 7.2);
  ty = vTextStart(y, h, cLines.length, lhSmall);
  cLines.forEach((ln) => {
    doc.text(ln, xs[3] + 3, ty, { align: 'left', baseline: 'alphabetic', maxWidth: widths[3] - 6 });
    ty += lhSmall;
  });

  const sampleCols = [
    { idx: 4, key: 'labDip' },
    { idx: 5, key: 'mainCare' },
    { idx: 6, key: 'hangtag' },
    { idx: 7, key: 'strikeOff' },
    { idx: 8, key: 'ppSample' },
    { idx: 9, key: 'topSample' },
    { idx: 10, key: 'licenserSample' },
  ];
  sampleCols.forEach(({ idx, key }) => {
    const txt = String(row[key] ?? '');
    if (!txt) return;
    const lines = bodyLines(doc, txt, widths[idx], 6.5);
    let yy = vTextStart(y, h, lines.length, lhSmall);
    lines.forEach((ln) => {
      doc.text(ln, xs[idx] + widths[idx] / 2, yy, {
        align: 'center',
        baseline: 'alphabetic',
        maxWidth: widths[idx] - 4,
      });
      yy += lhSmall;
    });
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(formatQty(row.qty), xs[11] + widths[11] - 4, y + h / 2, {
    align: 'right',
    baseline: 'middle',
  });

  return y + h;
}

function drawGrandTotalRow(doc, y, x0, widths, grandTotal) {
  const tableW = widths.reduce((a, b) => a + b, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.85);
  doc.line(x0, y, x0 + tableW, y);
  y += 2;

  const h = 22;
  // One full-width cell: outer border only (no vertical dividers inside this row).
  setBorder(doc, 0.35);
  doc.rect(x0, y, tableW, h);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Grand Total:', x0 + 4, y + h / 2, { align: 'left', baseline: 'middle' });
  doc.text(formatQty(grandTotal), x0 + tableW - 4, y + h / 2, {
    align: 'right',
    baseline: 'middle',
  });
  return y + h;
}

function drawFooter(doc, pageIdx, totalPages) {
  const lineY = PAGE_H - FOOTER_RESERVE;
  const yBrand = lineY + 14;
  const yPage = lineY + 28;

  setBorder(doc, 0.45);
  doc.line(H_MARGIN, lineY, PAGE_W - H_MARGIN, lineY);

  const cx = PAGE_W / 2;
  const prefix = 'Powered by : ';
  const brand = 'INTERACTIVE TECHNOLOGIES GATEWAY';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const w1 = doc.getTextWidth(prefix);
  doc.setFont('helvetica', 'bold');
  const w2 = doc.getTextWidth(brand.toUpperCase());
  const startX = cx - (w1 + w2) / 2;
  doc.setFont('helvetica', 'normal');
  doc.text(prefix, startX, yBrand, { baseline: 'bottom' });
  doc.setFont('helvetica', 'bold');
  doc.text(brand.toUpperCase(), startX + w1, yBrand, { baseline: 'bottom' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Page ${pageIdx} of ${totalPages}`, H_MARGIN, yPage, { baseline: 'bottom' });
}

function payloadFromInput(data) {
  if (data && data.orderLabel && data.supplierLabel && Array.isArray(data.rows) && data.rows.length > 0) {
    return {
      orderLabel: data.orderLabel,
      supplierLabel: data.supplierLabel,
      rows: data.rows,
      grandTotal: data.grandTotal ?? data.rows.reduce((s, r) => s + (Number(r.qty) || 0), 0),
    };
  }
  return { ...DEMO_ORDER };
}

/**
 * @param {{
 *   orderLabel?: string;
 *   supplierLabel?: string;
 *   rows?: object[];
 *   grandTotal?: number;
 * }} [data]
 * @returns {Promise<Blob>}
 */
export async function buildOrderDetailReportPdfBlob(data = {}) {
  const payload = payloadFromInput(data);
  const printDateStr = formatPrintDateTime();

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'p' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(tableW);
  const bodyBottom = PAGE_H - FOOTER_RESERVE - CONTENT_BOTTOM_PAD;

  const startBlock = () => {
    let y = drawPageHeader(doc, logoDataUrl, printDateStr);
    y = drawFullWidthBand(doc, tableX, tableW, y, 18, payload.orderLabel);
    y = drawFullWidthBand(doc, tableX, tableW, y, 18, payload.supplierLabel);
    const yAfterHeader = drawTableHeaderRow(doc, y, tableX, widths);
    return yAfterHeader;
  };

  let y = startBlock();

  payload.rows.forEach((row) => {
    const rh = measureDataRowHeight(doc, row, widths);
    if (y + rh > bodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'p');
      y = startBlock();
    }
    y = drawDataRow(doc, y, tableX, widths, row);
  });

  const totalH = 26;
  if (y + totalH > bodyBottom) {
    doc.addPage([PAGE_W, PAGE_H], 'p');
    y = startBlock();
  }
  drawGrandTotalRow(doc, y, tableX, widths, payload.grandTotal);

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
export function openOrderDetailReportPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Order-Detail-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
