import jsPDF from 'jspdf';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const V_MARGIN = 6;
const H_MARGIN = 4;
const HEADER_BLOCK_H = 76;
const TABLE_HEADER_ROW_H = 60;
const DATA_ROW_H = 80;
const FOOTER_H = 26;
const TITLE_BLUE = [0, 51, 153];

const PAGE_W = 842;
const PAGE_H = 595;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/** Demo rows — replace with API rows when backend is ready. Reference: black body text, 20 columns. */
export const SALT_WIP_DEMO_ROWS = [
  {
    poNo: 'AMS-AV-025-SALT',
    styleLines: ['73N', '60% COTTON 40% POLYESTER', '280-300'],
    totalQty: 480,
    shipmentDate: '05/15/2026',
    mos: 'SEA',
    itemLines: ['MEN', '1/4 ZIPPER'],
    fabric: 'NANTUCKET',
    colorQty: '1- (SALT N PEPPER_480)',
    processStatuses: Array(11).fill('Not\nRequired'),
    productionStatus: 'N/A',
  },
  {
    poNo: 'AMS-AV-026-SALT',
    styleLines: ['74P', '100% POLYESTER', '220 GSM'],
    totalQty: 1200,
    shipmentDate: '06/01/2026',
    mos: 'AIR',
    itemLines: ['MENS', 'HOODY'],
    fabric: 'FLEECE',
    colorQty: '2- (NAVY_600)',
    processStatuses: Array(11).fill('Not\nRequired'),
    productionStatus: 'N/A',
  },
];

const HEADERS = [
  'PO No.',
  'Style',
  'Total\nQTY',
  'Shipment\nDate',
  'MOS',
  'Item\nDescription',
  'Fabric',
  'Color /\nQty',
  'Drilling of\nHoles',
  'Equal\nShaping',
  'Washing',
  'Both end Drilling\nfor screws',
  'Skrn Warp',
  'Base\nSitting',
  'Bubble Warp',
  'Electrical Comp.\nChecking',
  'Printing to\ninner carton',
  'Finishing',
  'Packing',
  'Production\nStatus',
];

/** 20 columns — Shipment Date / Fabric wide enough for full words; "Not Required" fits across the 11 process columns. */
const COL_WEIGHTS = [
  46, 70, 24, 42, 22, 38, 48, 46, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 38,
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

  let fs = 5.6;
  doc.setFontSize(fs);
  let lines = [];
  parts.forEach((p) => {
    lines.push(...doc.splitTextToSize(p, Math.max(3, w - 3)));
  });
  if (lines.length > 7) {
    fs = 4.9;
    doc.setFontSize(fs);
    lines = [];
    parts.forEach((p) => {
      lines.push(...doc.splitTextToSize(p, Math.max(3, w - 3)));
    });
  }

  const lineH = fs * 1.14;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  lines.slice(0, 8).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
      baseline: 'middle',
      maxWidth: w - 2,
    });
  });
}

function drawMultilineBlackCell(doc, x, y, w, h, lines, align = 'left', fontSize = 6.1) {
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(fontSize);
  const maxW = Math.max(3, w - 3);

  /**
   * Wrap each input line into its own group so wrapped pieces stay tight
   * but distinct entries (PO / Style / GSM etc.) keep a visible gap.
   */
  const groups = (lines || [])
    .map((ln) => doc.splitTextToSize(String(ln), maxW))
    .filter((g) => g.length > 0);
  if (groups.length === 0) return;

  const innerLineH = fontSize * 1.12;
  const interGroupGap = fontSize * 1.1;
  const groupHeights = groups.map((g) => g.length * innerLineH);
  const total =
    groupHeights.reduce((a, b) => a + b, 0) + interGroupGap * (groups.length - 1);

  const xText = align === 'center' ? x + w / 2 : x + 2;
  let yCursor = y + h / 2 - total / 2 + innerLineH / 2;

  groups.forEach((sub, gi) => {
    sub.forEach((ln, li) => {
      doc.text(ln, xText, yCursor + li * innerLineH, {
        align,
        baseline: 'middle',
        maxWidth: maxW,
      });
    });
    yCursor += sub.length * innerLineH + interGroupGap;
    if (gi >= 12) {
      /* hard cap to avoid runaway rendering */
    }
  });
}

function drawCenterBlackCell(doc, x, y, w, h, text, fontSize = 6.4) {
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(fontSize);
  const maxW = Math.max(2, w - 2);
  const raw = String(text ?? '');
  /** Honor explicit `\n` first, then soft-wrap each piece — keeps "Not / Required" stacked. */
  const flat = [];
  raw.split('\n').forEach((seg) => {
    flat.push(...doc.splitTextToSize(seg, maxW));
  });
  if (flat.length === 0) return;
  const lineH = fontSize * 1.15;
  const block = flat.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  flat.slice(0, 8).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
      baseline: 'middle',
      maxWidth: maxW,
    });
  });
}

function drawRightQtyCell(doc, x, y, w, h, qty) {
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text(String(qty ?? ''), x + w - 2, y + h / 2, { align: 'right', baseline: 'middle' });
}

function drawTableHeaderRow(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  for (let i = 0; i < HEADERS.length; i += 1) {
    drawHeaderCell(doc, xs[i], y, widths[i], TABLE_HEADER_ROW_H, HEADERS[i]);
  }
  return y + TABLE_HEADER_ROW_H;
}

function normalizeRow(row) {
  const processStatuses =
    Array.isArray(row.processStatuses) && row.processStatuses.length >= 11
      ? row.processStatuses.slice(0, 11)
      : Array(11).fill('Not\nRequired');
  return { ...row, processStatuses };
}

function drawDataRow(doc, y, x0, widths, rowRaw) {
  const row = normalizeRow(rowRaw);
  const xs = colXs(x0, widths);
  let i = 0;
  drawMultilineBlackCell(doc, xs[i], y, widths[i], DATA_ROW_H, [row.poNo], 'left', 6.4);
  i += 1;
  drawMultilineBlackCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.styleLines, 'left', 5.9);
  i += 1;
  drawRightQtyCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.totalQty);
  i += 1;
  drawCenterBlackCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.shipmentDate, 6.5);
  i += 1;
  drawCenterBlackCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.mos, 6.2);
  i += 1;
  drawMultilineBlackCell(
    doc,
    xs[i],
    y,
    widths[i],
    DATA_ROW_H,
    Array.isArray(row.itemLines) ? row.itemLines : [row.itemDescription || ''],
    'left',
    6
  );
  i += 1;
  drawMultilineBlackCell(doc, xs[i], y, widths[i], DATA_ROW_H, [row.fabric], 'left', 6);
  i += 1;
  drawMultilineBlackCell(doc, xs[i], y, widths[i], DATA_ROW_H, [row.colorQty], 'left', 5.8);
  i += 1;
  row.processStatuses.forEach((txt) => {
    drawCenterBlackCell(doc, xs[i], y, widths[i], DATA_ROW_H, txt, 5.7);
    i += 1;
  });
  drawCenterBlackCell(doc, xs[i], y, widths[i], DATA_ROW_H, row.productionStatus, 6.3);
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
  y =
    drawBlueBoldUnderline(doc, 'SALT WIP Report / Summary of Production Status', innerLeft, y, leftMaxW) + 8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8.2);
  doc.text(`Customer: ${meta.customerLabel ?? 'All'}`, innerLeft, y);
  y += 11;
  const fromH = formatIsoToDdMonYyyy(meta.fromDate);
  const toH = formatIsoToDdMonYyyy(meta.toDate);
  doc.text(`Date From: ${fromH}    Date To: ${toH}`, innerLeft, y);
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
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
  doc.setFontSize(7.4);
  doc.text(formatPrintStamp(), innerRight, tableTop - 4, { align: 'right', baseline: 'bottom' });

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
 * @param {object[]} [rows] — when empty or omitted, uses {@link SALT_WIP_DEMO_ROWS}
 * @param {{ customerLabel?: string; fromDate?: string; toDate?: string }} [meta]
 */
export async function buildSaltWipPdfBlobFromRows(rows, meta = {}) {
  const data = Array.isArray(rows) && rows.length > 0 ? rows : SALT_WIP_DEMO_ROWS;
  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });

  /**
   * PDF document title — Chrome/Edge's built-in PDF viewer uses this for the
   * browser tab title, so the preview tab reads "Salt WIP Report" instead of
   * the raw `blob:` URL.
   */
  try {
    doc.setProperties({ title: 'Salt WIP Report' });
  } catch {
    /* setProperties unavailable — non-fatal, preview still works */
  }
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
export function openSaltWipPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Salt_WIP_Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
