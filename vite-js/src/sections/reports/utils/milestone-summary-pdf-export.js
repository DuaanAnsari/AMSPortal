import jsPDF from 'jspdf';

import { formatLdpFobDisplayDate } from './ldp-fob-demo-export';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

/** Vertical padding (top/bottom). */
const V_MARGIN = 10;
/** Small left/right inset so the table frame does not clip at page edges when printing or zooming. */
const H_MARGIN = 14;
const HEADER_BLOCK_H = 108;
const TABLE_HEADER_ROW_H = 42;
const DATA_ROW_H = 62;
const TITLE_BLUE = [0, 51, 153];

/** A4 landscape width / height (pt) — fixed size for paging + browser PDF viewer. */
const PAGE_WIDTH_PT = 842;
const PAGE_HEIGHT_PT = 595;

/** Default zoom when opening PDF in browser (Chrome/Edge) */
const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/**
 * Milestone columns — API field names per `/api/Report/GetMilestoneReport` mapping (with common casing fallbacks).
 * @type {Array<{ weight: number; header: string; kind: string; keys?: string[]; statusKeys?: string[]; k1?: string[]; k2?: string[]; align?: string }>}
 */
const MILESTONE_API_TAIL = [
  { weight: 36, header: 'Lab Dip', kind: 'milestone', keys: ['Lab Dip', 'LabDip', 'labDip'] },
  { weight: 36, header: 'Proto /\nFIT', kind: 'milestone', keys: ['FIT', 'ProtoFIT', 'ProtoFit', 'Proto'] },
  { weight: 36, header: 'Dye Lot /\nBlanket', kind: 'milestone', keys: ['Dye Lot/Blanket', 'DyeLotBlanket', 'dyeLotBlanket'] },
  { weight: 36, header: 'Size Set\nto TD', kind: 'milestone', keys: ['Size set', 'SizeSetTD', 'SizesetTD', 'SizeSetToTD'] },
  { weight: 36, header: 'Size set\nto Buyer', kind: 'milestone', keys: ['Size set to Buyer', 'SizesettoBuyer', 'SizeSetBuyer', 'sizesettoBuyer'] },
  {
    weight: 36,
    header: 'Print Mockup /\nStrike off',
    kind: 'milestone',
    keys: ['Print / Emb/ Strike off', 'PrintMockupStrikeoff', 'PrintEmbStrikeoff', 'printEmbStrikeoff'],
  },
  { weight: 36, header: 'PP Sample\nto Buyer', kind: 'milestone', keys: ['PP', 'PPSample', 'pp'] },
  { weight: 36, header: 'Testing\nLocal', kind: 'milestone', keys: ['Testing', 'TestingLocal', 'testing'] },
  { weight: 36, header: 'Testing\nnominated', kind: 'milestone', keys: ['Testing Nominated', 'TestingNominated', 'testingNominated'] },
  { weight: 36, header: 'Knitting /\nFabric in house', kind: 'milestone', keys: ['Knitting', 'knitting'] },
  { weight: 36, header: 'Dying', kind: 'milestone', keys: ['Dying', 'dying', 'Dyeing'] },
  { weight: 36, header: 'Cutting', kind: 'milestone', keys: ['Cutting', 'cutting'] },
  { weight: 36, header: 'Print /\nEmb.', kind: 'milestone', keys: ['Print / Emb.', 'PrintEmb', 'printEmb', 'PrintEmbroidery'] },
  { weight: 36, header: 'Stitching', kind: 'milestone', keys: ['Stitching', 'Stiching', 'stitching'] },
  { weight: 36, header: 'Washing', kind: 'milestone', keys: ['Washing', 'washing'] },
  { weight: 36, header: 'Packing', kind: 'milestone', keys: ['Packing', 'packing'] },
  { weight: 46, header: 'FRI', kind: 'stack2', k1: ['FRI', 'FRI1', 'fri'], k2: ['FRI', 'FRI2', 'FRIEstemated', 'fri2'] },
];

const SHIPMENT_SPEC_API = {
  weight: 52,
  header: 'Shipment\nDate',
  kind: 'stack2',
  k1: ['shipmentdate', 'ShipmentDate', 'shipmentDate', 'ShipmentDate1'],
  k2: ['shipmentdate', 'ShipmentDate', 'shipmentDate', 'ShipmentDate2'],
};

const QTY_SPEC_API = {
  weight: 36,
  header: 'QTY',
  kind: 'qty',
  keys: ['BookedQuantity', 'bookedQuantity', 'Quantity', 'quantity', 'QTY', 'qty'],
};

/** Merchandiser-wise: Image first, then PO → … (API rows). */
const COL_TEMPLATE_MERCHANDISER_WISE = [
  { weight: 42, header: 'Image', kind: 'image' },
  { weight: 64, header: 'PO No.', kind: 'left', keys: ['pono', 'PONO', 'PoNo', 'poNo'] },
  { weight: 92, header: 'Customer', kind: 'left', keys: ['customername', 'CustomerName', 'customerName', 'BuyerName'] },
  { ...SHIPMENT_SPEC_API },
  { ...QTY_SPEC_API },
  ...MILESTONE_API_TAIL.map((c) => ({ ...c })),
];

/** Supplier-wise: Merchandiser (`username`) then PO → … */
const COL_TEMPLATE_SUPPLIER_WISE = [
  {
    weight: 134,
    header: 'Merchandiser',
    kind: 'left',
    align: 'center',
    keys: ['username', 'Username', 'userName', 'MerchandiserName', 'merchandiserName', 'MerchName'],
  },
  { weight: 64, header: 'PO No.', kind: 'left', align: 'center', keys: ['pono', 'PONO', 'PoNo', 'poNo'] },
  { weight: 92, header: 'Customer', kind: 'left', align: 'center', keys: ['customername', 'CustomerName', 'customerName', 'BuyerName'] },
  { ...SHIPMENT_SPEC_API },
  { ...QTY_SPEC_API },
  ...MILESTONE_API_TAIL.map((c) => ({ ...c })),
];

function pickColTemplate(reportType) {
  return reportType === 'supplierWise' ? COL_TEMPLATE_SUPPLIER_WISE : COL_TEMPLATE_MERCHANDISER_WISE;
}

/**
 * Column specs for Excel — same headers & field mapping as the PDF grid (`\n` → space in header text).
 * @param {'supplierWise'|'merchandiserWise'} reportType
 */
export function getMilestoneGridColumnSpecs(reportType) {
  const template = pickColTemplate(reportType);
  return template.map(({ header, keys, kind, k1, k2, statusKeys }) => ({
    header: String(header || '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    keys: keys || [],
    kind,
    k1: k1 || [],
    k2: k2 || [],
    statusKeys: statusKeys || [],
  }));
}

/** @type {{ pageW: number; colDef: Array<{ w: number } & Record<string, unknown>>; gridLeft: number; reportType: string } | null} */
let layoutSnapshot = null;

function createLayout(pageW, hMargin, reportType = 'merchandiserWise') {
  const gridLeft = hMargin;
  const contentW = pageW - 2 * hMargin;
  const template = pickColTemplate(reportType);
  const sumW = template.reduce((s, c) => s + c.weight, 0);
  const colDef = template.map((c) => ({ ...c, w: 0 }));
  let used = 0;
  for (let i = 0; i < colDef.length - 1; i += 1) {
    colDef[i].w = Math.floor((colDef[i].weight / sumW) * contentW);
    used += colDef[i].w;
  }
  colDef[colDef.length - 1].w = contentW - used;
  return { pageW, colDef, gridLeft, reportType };
}

function tableWidth() {
  if (!layoutSnapshot) return Math.max(1, PAGE_WIDTH_PT - 2 * H_MARGIN);
  return layoutSnapshot.colDef.reduce((s, c) => s + c.w, 0);
}

function colXs() {
  if (!layoutSnapshot) return [];
  const xs = [];
  let x = layoutSnapshot.gridLeft;
  for (let i = 0; i < layoutSnapshot.colDef.length; i += 1) {
    xs.push(x);
    x += layoutSnapshot.colDef[i].w;
  }
  return xs;
}

export function pickField(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    if (k in obj) {
      const v = obj[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  const map = {};
  for (const k of Object.keys(obj)) {
    map[k.toLowerCase()] = obj[k];
  }
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    const v = map[String(k).toLowerCase()];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function formatIsoToHeader(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || '');
  const d = new Date(`${iso}T12:00:00`);
  return d
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, '-');
}

function formatShipmentFriDate(raw) {
  if (raw == null || raw === '' || raw === '0' || raw === 0) return '';
  let d;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw).trim());
  if (iso) d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`);
  else d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}-${mon}-${d.getFullYear()}`;
}

/** Supplier-wise Crystal style: MM-DD-YYYY (e.g. 03-15-2026). */
function formatShipmentUsMdY(raw) {
  if (raw == null || raw === '' || raw === '0' || raw === 0) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw).trim());
  if (!iso) {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}-${d.getFullYear()}`;
  }
  return `${iso[2]}-${iso[3]}-${iso[1]}`;
}

function formatMilestoneDate(raw) {
  if (raw == null || raw === '' || raw === '0' || raw === 0) return '';
  const s = formatLdpFobDisplayDate(raw);
  if (s === '—') return '';
  const m = /^(\d{1,2}) (\w+) (\d{4})$/.exec(s);
  if (m) return `${m[1].padStart(2, '0')} ${m[2]} ${m[3]}`;
  return s;
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

function statementTitle(reportType) {
  if (reportType === 'supplierWise') return 'Supplier Wise Statement of Milestone Summary';
  return 'Merchandiser Wise Statement of Milestone Summary';
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

function drawBlueBoldUnderline(doc, text, x, y, maxW) {
  doc.setTextColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
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

function drawBlackBoldUnderline(doc, text, x, y, maxW) {
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const lines = doc.splitTextToSize(String(text), maxW);
  let yy = y;
  lines.forEach((line) => {
    doc.text(line, x, yy);
    const tw = doc.getTextWidth(line);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.line(x, yy + 2, x + tw, yy + 2);
    yy += 12;
  });
  doc.setTextColor(0, 0, 0);
  return yy;
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {string|null} logoDataUrl
 * @param {{ fromDate?: string; toDate?: string; reportType?: string; merchandiserLabel?: string; vendorLabel?: string }} meta
 */
function drawReportHeader(doc, logoDataUrl, meta) {
  const pageW = layoutSnapshot.pageW;
  const inset = layoutSnapshot.gridLeft;
  const tableRight = pageW - inset;
  const leftX = inset;
  const merch = String(meta?.merchandiserLabel || '—').trim();
  const vendor = String(meta?.vendorLabel || '—').trim();
  const fromH = formatIsoToHeader(meta?.fromDate);
  const toH = formatIsoToHeader(meta?.toDate);

  const logoW = 80;
  const logoH = 34;
  const logoX = tableRight - logoW;
  const logoY = V_MARGIN + 2;
  const leftMaxW = Math.max(140, logoX - leftX - 10);

  let y = V_MARGIN + 8;
  y = drawBlueBoldUnderline(doc, statementTitle(meta?.reportType), leftX, y, leftMaxW) + 4;
  if (meta?.reportType === 'supplierWise') {
    y = drawBlueBoldUnderline(doc, `Vendor : ${vendor}`, leftX, y, leftMaxW) + 4;
  } else {
    y = drawBlueBoldUnderline(doc, `Merchandiser : ${merch}`, leftX, y, leftMaxW) + 4;
  }
  y = drawBlackBoldUnderline(doc, `Date From: ${fromH} Date To: ${toH}`, leftX, y, leftMaxW);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
  }

  const tableGridTopY = V_MARGIN + HEADER_BLOCK_H;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  doc.text(formatPrintStamp(), tableRight, tableGridTopY - 6, { align: 'right', baseline: 'bottom' });
}

function drawCellBorder(doc, x, y, w, h) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);
}

function drawHeaderCell(doc, x, y, w, h, headerText) {
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const parts = String(headerText || '—')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) parts.push('—');

  const buildLines = (fontSize) => {
    doc.setFontSize(fontSize);
    const out = [];
    parts.forEach((p) => {
      out.push(...doc.splitTextToSize(p, Math.max(4, w - 4)));
    });
    return out;
  };

  let fs = 5.75;
  let lines = buildLines(fs);
  if (lines.length > 4) {
    fs = 4.95;
    lines = buildLines(fs);
  }
  if (lines.length > 5) {
    fs = 4.55;
    lines = buildLines(fs);
  }

  const lineH = fs * 1.2;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  lines.slice(0, 6).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
      baseline: 'middle',
      maxWidth: w - 3,
    });
  });
}

function drawImageCell(doc, x, y, w, h, raw) {
  drawCellBorder(doc, x, y, w, h);
  const url = pickField(
    raw,
    'ImageUrl',
    'imageUrl',
    'imageurl',
    'StyleImageUrl',
    'styleImageUrl',
    'ThumbnailUrl',
    'thumbnailUrl'
  );
  if (url && String(url).startsWith('data:')) {
    try {
      const fmt = String(url).includes('png') ? 'PNG' : 'JPEG';
      const imgH = Math.min(h - 4, w - 4);
      doc.addImage(url, fmt, x + 2, y + 2, w - 4, imgH);
      return;
    } catch {
      /* fall through */
    }
  }
  doc.setFillColor(232, 232, 232);
  doc.rect(x + 1, y + 1, w - 2, h - 2, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(x + 1, y + 1, w - 2, h - 2, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.9);
  doc.setTextColor(90, 90, 90);
  const cy = y + h / 2;
  doc.text('NO IMAGE', x + w / 2, cy - 4.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.text('AVAILABLE', x + w / 2, cy + 4.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.setTextColor(0, 0, 0);
}

function milestoneTopStatus(raw, spec) {
  const s = pickField(raw, ...(spec.statusKeys || []));
  if (s !== '' && s != null) return String(s);
  return '0';
}

function milestoneBottomDate(raw, spec) {
  const v = pickField(raw, ...(spec.keys || []));
  const d = formatMilestoneDate(v);
  if (d) return d;
  if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  return '—';
}

/** Same two lines as PDF `drawStackedTwoDates` (shipment / FRI). */
export function milestoneSummaryStack2ExcelText(raw, spec, reportType) {
  const v1 = pickField(raw, ...(spec.k1 || []));
  const v2 = pickField(raw, ...(spec.k2 || []));
  const useUs = reportType === 'supplierWise';
  const fmt = useUs ? formatShipmentUsMdY : formatShipmentFriDate;
  const d1 = fmt(v1) || fmt(v2) || '—';
  const d2 = fmt(v2) || d1;
  const line1 = d1 || '—';
  const line2 = d2 || line1;
  return `${line1}\n${line2}`;
}

/** Same two lines as PDF milestone cell (status + date). */
export function milestoneSummaryMilestoneExcelText(raw, spec) {
  return `${milestoneTopStatus(raw, spec)}\n${milestoneBottomDate(raw, spec)}`;
}

function drawMilestoneCell(doc, x, y, w, h, raw, spec) {
  drawCellBorder(doc, x, y, w, h);
  const top = milestoneTopStatus(raw, spec);
  const bottom = milestoneBottomDate(raw, spec);
  const cx = x + w / 2;
  const cy = y + h / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text(String(top), cx, cy - 6.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.setFontSize(5.85);
  doc.text(String(bottom), cx, cy + 6.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
}

function drawStackedTwoDates(doc, x, y, w, h, raw, spec) {
  drawCellBorder(doc, x, y, w, h);
  const v1 = pickField(raw, ...(spec.k1 || []));
  const v2 = pickField(raw, ...(spec.k2 || []));
  const useUs = layoutSnapshot?.reportType === 'supplierWise';
  const fmt = useUs ? formatShipmentUsMdY : formatShipmentFriDate;
  const d1 = fmt(v1) || fmt(v2) || '—';
  const d2 = fmt(v2) || d1;
  const line1 = d1 || '—';
  const line2 = d2 || line1;
  const cx = x + w / 2;
  const cy = y + h / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.65);
  doc.text(line1, cx, cy - 6.2, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.text(line2, cx, cy + 6.2, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
}

function drawLeftText(doc, x, y, w, h, text, textAlign = 'left') {
  drawCellBorder(doc, x, y, w, h);
  const pad = 2;
  const center = textAlign === 'center';
  const maxW = Math.max(4, center ? w - 4 : w - pad * 2);
  doc.setFont('helvetica', 'normal');
  let fs = 6.6;
  doc.setFontSize(fs);
  let lines = doc.splitTextToSize(String(text || '—'), maxW);
  if (lines.length > 4) {
    fs = 5.9;
    doc.setFontSize(fs);
    lines = doc.splitTextToSize(String(text || '—'), maxW);
  }
  const lineH = fs * 1.16;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  const xText = center ? x + w / 2 : x + pad;
  lines.slice(0, 8).forEach((ln, i) => {
    doc.text(ln, xText, firstY + i * lineH, {
      align: center ? 'center' : 'left',
      baseline: 'middle',
      maxWidth: maxW,
    });
  });
}

function drawQty(doc, x, y, w, h, raw, spec) {
  drawCellBorder(doc, x, y, w, h);
  const q = pickField(raw, ...(spec.keys || []));
  let t = '—';
  if (q !== '' && q != null) {
    const n = Number(q);
    t = Number.isFinite(n) ? n.toLocaleString('en-US') : String(q);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.25);
  doc.text(t, x + w / 2, y + h / 2, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
}

function drawTableHeaderRow(doc, y) {
  const xs = colXs();
  const cols = layoutSnapshot.colDef;
  for (let i = 0; i < cols.length; i += 1) {
    const c = cols[i];
    drawHeaderCell(doc, xs[i], y, c.w, TABLE_HEADER_ROW_H, c.header);
  }
  return y + TABLE_HEADER_ROW_H;
}

function drawDataRow(doc, y, raw) {
  const xs = colXs();
  const cols = layoutSnapshot.colDef;
  for (let i = 0; i < cols.length; i += 1) {
    const c = cols[i];
    const x = xs[i];
    if (c.kind === 'image') drawImageCell(doc, x, y, c.w, DATA_ROW_H, raw);
    else if (c.kind === 'left')
      drawLeftText(doc, x, y, c.w, DATA_ROW_H, pickField(raw, ...(c.keys || [])), c.align || 'left');
    else if (c.kind === 'qty') drawQty(doc, x, y, c.w, DATA_ROW_H, raw, c);
    else if (c.kind === 'stack2') drawStackedTwoDates(doc, x, y, c.w, DATA_ROW_H, raw, c);
    else if (c.kind === 'milestone') drawMilestoneCell(doc, x, y, c.w, DATA_ROW_H, raw, c);
  }
  return y + DATA_ROW_H;
}

function drawOuterTableFrame(doc, x, y, w, h) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.1);
  doc.rect(x, y, w, h);
}

function drawPageHeaderAndTableTop(doc, logoDataUrl, meta) {
  drawReportHeader(doc, logoDataUrl, meta);
  return drawTableHeaderRow(doc, V_MARGIN + HEADER_BLOCK_H);
}

/**
 * @param {object[]} rawRows
 * @param {{
 *   fromDate?: string;
 *   toDate?: string;
 *   reportType?: string;
 *   merchandiserLabel?: string;
 *   vendorLabel?: string;
 * }} [meta]
 */
export async function buildMilestoneSummaryPdfBlobFromRows(rawRows, meta = {}) {
  layoutSnapshot = createLayout(PAGE_WIDTH_PT, H_MARGIN, meta.reportType || 'merchandiserWise');

  const rows = Array.isArray(rawRows) ? rawRows : [];
  const tw = tableWidth();
  const tableX = layoutSnapshot.gridLeft;

  const PAGE_W = PAGE_WIDTH_PT;
  const PAGE_H = PAGE_HEIGHT_PT;

  const doc = new jsPDF({
    unit: 'pt',
    format: [PAGE_W, PAGE_H],
    orientation: 'l',
  });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const pageH = () => doc.internal.pageSize.getHeight();

  let segTableTop = 0;
  let y = 0;

  const startSheet = () => {
    y = drawPageHeaderAndTableTop(doc, logoDataUrl, meta);
    segTableTop = V_MARGIN + HEADER_BLOCK_H;
  };

  const closeSegment = () => {
    const h = y - segTableTop;
    if (h > 0) {
      drawOuterTableFrame(doc, tableX, segTableTop, tw, h);
    }
  };

  startSheet();

  if (!rows.length) {
    drawCellBorder(doc, tableX, y, tw, DATA_ROW_H);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('No data rows for this report.', tableX + tw / 2, y + DATA_ROW_H / 2, {
      align: 'center',
      baseline: 'middle',
    });
    y += DATA_ROW_H;
    closeSegment();
    layoutSnapshot = null;
    return doc.output('blob');
  }

  rows.forEach((raw) => {
    if (y + DATA_ROW_H > pageH() - V_MARGIN) {
      closeSegment();
      doc.addPage([PAGE_W, PAGE_H], 'l');
      startSheet();
    }
    y = drawDataRow(doc, y, raw);
  });

  closeSegment();

  layoutSnapshot = null;
  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode view = new tab; pdf = download
 * @param {Blob} pdfBlob
 */
export function openMilestoneSummaryPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Milestone-Summary.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
