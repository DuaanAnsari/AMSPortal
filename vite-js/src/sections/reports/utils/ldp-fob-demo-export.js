import jsPDF from 'jspdf';

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 28;

/** Vite public folder — same file as `public/logo/AMSlogo.png` */
const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

/** In-tab PDF viewer default zoom (Chrome/Edge often honour #zoom on blob PDF URLs). */
const PDF_VIEW_ZOOM_HASH = '#zoom=110';

const COMPANY_LINES = [
  'A M S House 84, Kokan Housing Society Alamgir Road - Postal Code: 74800',
  'Karachi - Pakistan.',
  'Telephone #: 02134937216 & 02134946005',
];

const DEFAULT_TABLE_HEADERS = [
  'SUPPLIER',
  'PO.NO #',
  'STYLE NO #',
  'DESCRIPTION OF GOODS',
  'SIZES',
  'QTY',
  'DELIVERY DATE',
  'FACTORY SHIP DATE',
  'FOB',
];

/** Column widths (pt) — sum ≈ PAGE_W - 2*MARGIN */
const DEFAULT_COL_W = [66, 52, 44, 156, 38, 44, 50, 50, 36];

/** LDP and FOB Report page — title + LDP column after FOB (wip-hub keeps defaults). */
export const LDP_FOB_PRICE_LIST_REPORT_OPTIONS = {
  reportTitle: 'LDP / FOB PRICE LIST',
  includeLdpColumn: true,
  documentTitle: 'LDP / FOB PRICE LIST',
};

/** Default Save As / download filename for the LDP and FOB Report page only. */
export const LDP_FOB_PRICE_LIST_PDF_FILENAME = 'LDP / FOB PRICE LIST.pdf';

const LDP_FOB_PAGE_TABLE_HEADERS = [
  ...DEFAULT_TABLE_HEADERS,
  'LDP',
];

/** 10 columns incl. LDP — full page width with tighter side margins (567pt). */
const LDP_FOB_PAGE_TABLE_MARGIN = 14;
const LDP_FOB_PAGE_COL_W = [61, 51, 52, 165, 36, 40, 51, 51, 30, 30];

function resolveLdpFobReportLayout(options = {}) {
  const includeLdpColumn = Boolean(options.includeLdpColumn);
  const reportTitle = options.reportTitle || 'FOB PRICE LIST';
  return {
    reportTitle,
    continuedTitle: options.continuedTitle || `${reportTitle} (continued)`,
    headers: includeLdpColumn ? LDP_FOB_PAGE_TABLE_HEADERS : DEFAULT_TABLE_HEADERS,
    colWidths: includeLdpColumn ? LDP_FOB_PAGE_COL_W : DEFAULT_COL_W,
    tableMargin: includeLdpColumn ? LDP_FOB_PAGE_TABLE_MARGIN : MARGIN,
    headerAlign: includeLdpColumn ? 'center' : 'mixed',
    headerFontSize: includeLdpColumn ? 6.8 : 7,
    headerRowH: includeLdpColumn ? 28 : 26,
    dataFontSize: includeLdpColumn ? 8 : 7.5,
    includeLdpColumn,
  };
}

function pickField(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

/** Label for PDF/CSV customer band (matches API `CustomerName` with fallbacks). */
export function getLdpFobCustomerGroupLabel(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const s = pickField(
    r,
    'CustomerName',
    'customerName',
    'BuyerName',
    'buyerName',
    'AliasName',
    'aliasName'
  );
  return String(s || '').trim() || '—';
}

function sortLdpFobRawRowsByCustomer(rawRows) {
  const list = [...(rawRows || [])];
  list.sort((a, b) =>
    getLdpFobCustomerGroupLabel(a).localeCompare(getLdpFobCustomerGroupLabel(b), undefined, {
      sensitivity: 'base',
    })
  );
  return list;
}

/**
 * Full-width band row: customer name in first column (same grid as sample — e.g. AVALON APPAREL).
 * @returns {{ rowH: number; lines: string[]; fontSize: number; pad: number }}
 */
function getCustomerBannerMetrics(doc, name, colWidths) {
  const fontSize = 6.2;
  const pad = 3;
  const maxW = Math.max(8, colWidths[0] - pad * 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(String(name || ''), maxW);
  const lineH = fontSize * 1.15;
  const rowH = Math.min(36, Math.max(15, lines.length * lineH + pad * 2 + 4));
  return { rowH, lines, fontSize, pad };
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {number} y
 * @param {string} customerName
 * @param {number[]} colWidths
 * @param {number} [tableMargin]
 * @param {{ rowH: number; lines: string[]; fontSize: number; pad: number }} [metrics]
 * @returns {number} y below row
 */
function drawCustomerGroupBannerRow(doc, y, customerName, colWidths, tableMargin = MARGIN, metrics) {
  const xs = colStarts(colWidths, tableMargin);
  const m = metrics ?? getCustomerBannerMetrics(doc, customerName, colWidths);
  const { rowH, lines, fontSize } = m;

  for (let i = 0; i < colWidths.length; i += 1) {
    drawCellBorder(doc, xs[i], y, colWidths[i], rowH);
  }
  drawCellText(doc, customerName, xs[0], y, colWidths[0], rowH, 'left', true, fontSize, lines);
  return y + rowH;
}

/** API / ISO / partial date → short readable (e.g. 15 Mar 2026). */
export function formatLdpFobDisplayDate(raw) {
  if (raw == null || raw === '') return '—';
  const s = String(raw).trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (ymd) {
    const d = new Date(`${ymd[1]}-${ymd[2]}-${ymd[3]}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  const d2 = new Date(s);
  if (!Number.isNaN(d2.getTime())) {
    return d2.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return s;
}

/** Map API row → PDF grid row (field names per backend contract). */
export function mapLdpFobApiRowToPdfRow(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const qtyRaw = pickField(r, 'Quantity', 'quantity');
  let qtyDisplay = '—';
  if (qtyRaw !== '' && qtyRaw != null) {
    const n = Number(qtyRaw);
    qtyDisplay = Number.isFinite(n) ? n.toLocaleString('en-US') : String(qtyRaw);
  }
  const rateRaw = pickField(r, 'Rate', 'rate');
  let fob = '—';
  if (rateRaw !== '' && rateRaw != null) {
    const n = Number(rateRaw);
    fob = Number.isFinite(n) ? n.toFixed(2) : String(rateRaw);
  }
  const ldpRateRaw = pickField(r, 'LDPRate', 'ldpRate');
  let ldp = '—';
  if (ldpRateRaw !== '' && ldpRateRaw != null) {
    const n = Number(ldpRateRaw);
    ldp = Number.isFinite(n) ? n.toFixed(2) : String(ldpRateRaw);
  }
  return {
    supplier: String(pickField(r, 'VenderName', 'venderName', 'VendorName', 'vendorName') || '—'),
    po: String(pickField(r, 'PONO', 'PONo', 'pono', 'PoNo') || '—'),
    style: String(pickField(r, 'StyleNo', 'styleNo', 'StyleNO') || '—'),
    description: String(
      pickField(r, 'DescriptionofGoods', 'descriptionofGoods', 'DescriptionOfGoods', 'descriptionOfGoods') || '—'
    ),
    sizes: String(pickField(r, 'SizeRange', 'sizeRange', 'Sizes', 'sizes') || '—'),
    qty: qtyDisplay,
    deliveryDate: formatLdpFobDisplayDate(pickField(r, 'ShipmentDate', 'shipmentDate')),
    factoryShipDate: formatLdpFobDisplayDate(
      pickField(r, 'VendorExIndiaShipmentDate', 'vendorExIndiaShipmentDate')
    ),
    fob,
    ldp,
  };
}

function normLdpFobKeyPart(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function getLdpFobQtyNumeric(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const qtyRaw = pickField(r, 'Quantity', 'quantity');
  if (qtyRaw === '' || qtyRaw == null) return 0;
  const n = Number(qtyRaw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Identity for merge: same customer band + same grid columns except QTY (sizes/dates/FOB must match).
 * @param {object} raw
 * @param {object} [pdfRowOpt] pre-mapped PDF row (avoids duplicate mapping during merge)
 */
function ldpFobRowMergeKey(raw, pdfRowOpt) {
  const cust = normLdpFobKeyPart(getLdpFobCustomerGroupLabel(raw));
  const r = pdfRowOpt ?? mapLdpFobApiRowToPdfRow(raw);
  const fobKey = r.fob === '—' || r.fob === '' ? '' : normLdpFobKeyPart(String(r.fob));
  return [
    cust,
    normLdpFobKeyPart(r.supplier),
    normLdpFobKeyPart(r.po),
    normLdpFobKeyPart(r.style),
    normLdpFobKeyPart(r.description),
    normLdpFobKeyPart(r.sizes),
    normLdpFobKeyPart(r.deliveryDate),
    normLdpFobKeyPart(r.factoryShipDate),
    fobKey,
  ].join('\x1e');
}

/** Update only merged quantity on a cached PDF row (all other columns unchanged). */
function applyMergedQtyToPdfRow(pdfRow, mergedRaw) {
  const qtyRaw = pickField(mergedRaw, 'Quantity', 'quantity');
  let qtyDisplay = '—';
  if (qtyRaw !== '' && qtyRaw != null) {
    const n = Number(qtyRaw);
    qtyDisplay = Number.isFinite(n) ? n.toLocaleString('en-US') : String(qtyRaw);
  }
  if (pdfRow.qty === qtyDisplay) return pdfRow;
  return { ...pdfRow, qty: qtyDisplay };
}

/**
 * Merge rows that are identical on all PDF columns except QTY; quantities are summed.
 * Preserves customer sort order and first-seen row order within each customer.
 * @param {object[]} sortedRaw output of {@link sortLdpFobRawRowsByCustomer}
 * @param {{ pdfRowByRaw?: WeakMap<object, object>; mergedPdfRowByMergedRaw?: WeakMap<object, object> }} [mergeOpts]
 * @returns {object[]} shallow-cloned API rows with merged `Quantity` / `quantity`
 */
export function mergeLdpFobRawRowsByLineKey(sortedRaw, mergeOpts) {
  const list = sortedRaw || [];
  if (!list.length) return [];

  const pdfRowByRaw = mergeOpts?.pdfRowByRaw;
  const mergedPdfRowByMergedRaw = mergeOpts?.mergedPdfRowByMergedRaw;

  const order = [];
  /** @type {Map<string, { firstRaw: object; totalQty: number }>} */
  const groups = new Map();

  for (const raw of list) {
    const pdfRow = pdfRowByRaw?.get(raw);
    const key = ldpFobRowMergeKey(raw, pdfRow);
    const q = getLdpFobQtyNumeric(raw);
    if (!groups.has(key)) {
      groups.set(key, { firstRaw: raw, totalQty: q });
      order.push(key);
    } else {
      groups.get(key).totalQty += q;
    }
  }

  return order.map((key) => {
    const g = groups.get(key);
    const base = g.firstRaw && typeof g.firstRaw === 'object' ? { ...g.firstRaw } : {};
    const t = g.totalQty;
    base.Quantity = t;
    base.quantity = t;
    if (mergedPdfRowByMergedRaw && pdfRowByRaw) {
      const basePdf = pdfRowByRaw.get(g.firstRaw);
      if (basePdf) {
        mergedPdfRowByMergedRaw.set(base, applyMergedQtyToPdfRow(basePdf, base));
      }
    }
    return base;
  });
}

function colStarts(colWidths, tableMargin = MARGIN) {
  const xs = [];
  let x = tableMargin;
  for (let i = 0; i < colWidths.length; i += 1) {
    xs.push(x);
    x += colWidths[i];
  }
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

function drawCellBorder(doc, x, y, w, h) {
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
  doc.rect(x, y, w, h);
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {string} text
 * @param {number} x
 * @param {number} yTop
 * @param {number} w
 * @param {number} h
 * @param {'left'|'center'} align
 * @param {boolean} bold
 * @param {number} fontSize
 * @param {string[]} [linesOpt] precomputed wrapped lines
 */
function drawCellText(doc, text, x, yTop, w, h, align, bold, fontSize, linesOpt) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  const pad = 3;
  const maxW = Math.max(8, w - pad * 2);
  const lines = linesOpt ?? doc.splitTextToSize(String(text || ''), maxW);
  const lineH = fontSize * 1.15;
  const blockH = lines.length * lineH;
  let startY = yTop + pad + lineH * 0.85;
  if (blockH < h - pad * 2) {
    startY = yTop + (h - blockH) / 2 + lineH * 0.72;
  }
  lines.forEach((line, i) => {
    const cy = startY + i * lineH;
    if (cy > yTop + h - pad) return;
    if (align === 'center') {
      doc.text(line, x + w / 2, cy, { align: 'center' });
    } else {
      doc.text(line, x + pad, cy, { align: 'left' });
    }
  });
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {number} y
 * @returns {number} new y below header row
 */
function drawTableHeaderRow(doc, y, layout) {
  const { headers, colWidths, headerAlign, headerFontSize, headerRowH, tableMargin } = layout;
  const xs = colStarts(colWidths, tableMargin);
  doc.setDrawColor(0);
  doc.setLineWidth(0.45);
  for (let i = 0; i < colWidths.length; i += 1) {
    drawCellBorder(doc, xs[i], y, colWidths[i], headerRowH);
    const align = headerAlign === 'center' ? 'center' : i <= 3 ? 'left' : 'center';
    drawCellText(doc, headers[i], xs[i], y, colWidths[i], headerRowH, align, true, headerFontSize);
  }
  return y + headerRowH;
}

function getPdfDataCells(row, layout) {
  const cells = [
    row.supplier,
    row.po,
    row.style,
    row.description,
    row.sizes,
    row.qty,
    row.deliveryDate,
    row.factoryShipDate,
    row.fob,
  ];
  if (layout.includeLdpColumn) {
    cells.push(row.ldp);
  }
  return cells;
}

/**
 * Measure row height and cache wrapped lines for draw (single splitTextToSize per cell).
 * @returns {{ cells: string[]; cellLines: string[][]; rowH: number }}
 */
function buildDataRowPrep(doc, row, layout) {
  const cells = getPdfDataCells(row, layout);
  const { colWidths, dataFontSize } = layout;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(dataFontSize);
  const cellLines = [];
  const innerH = [];
  for (let i = 0; i < cells.length; i += 1) {
    const maxW = Math.max(6, colWidths[i] - 6);
    const lines = doc.splitTextToSize(String(cells[i] || ''), maxW);
    cellLines.push(lines);
    const lh = dataFontSize * 1.2;
    innerH.push(Math.max(22, lines.length * lh + 10));
  }
  const rowH = Math.min(120, Math.max(...innerH));
  return { cells, cellLines, rowH };
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {number} y
 * @param {object} row
 * @param {{ cells: string[]; cellLines: string[][]; rowH: number }} [prep]
 */
function drawDataRow(doc, y, row, layout, prep) {
  const { colWidths, dataFontSize, tableMargin } = layout;
  const xs = layout._tableXs ?? colStarts(colWidths, tableMargin);
  const rowPrep = prep ?? buildDataRowPrep(doc, row, layout);
  const { cells, cellLines, rowH } = rowPrep;

  for (let i = 0; i < colWidths.length; i += 1) {
    drawCellBorder(doc, xs[i], y, colWidths[i], rowH);
    const align = i <= 3 ? 'left' : 'center';
    drawCellText(doc, cells[i], xs[i], y, colWidths[i], rowH, align, false, dataFontSize, cellLines[i]);
  }
  return y + rowH;
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {string | null} logoDataUrl
 * @returns {Promise<number>} y position below header (before table)
 */
async function drawPageHeader(doc, logoDataUrl, layout) {
  const titleY = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text(layout.reportTitle, MARGIN, titleY);

  let logoBottomY = 32;
  if (logoDataUrl) {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = logoDataUrl;
    });
    const targetH = 38;
    const targetW = (img.naturalWidth / img.naturalHeight) * targetH;
    const logoX = PAGE_W - MARGIN - targetW;
    doc.addImage(logoDataUrl, 'PNG', logoX, 32, targetW, targetH);
    logoBottomY = 32 + targetH;
  }

  const cyStart = logoBottomY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(55);
  doc.text('APPAREL MERCHANDISING SERVICES', PAGE_W - MARGIN, cyStart, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(40);
  let cy = cyStart + 12;
  COMPANY_LINES.forEach((line) => {
    doc.text(line, PAGE_W - MARGIN, cy, { align: 'right' });
    cy += 10;
  });

  doc.setTextColor(0);
  return cy + 18;
}

function drawContinuedPageHeader(doc, layout) {
  let y = MARGIN + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(layout.continuedTitle, MARGIN, y);
  y += 22;
  return drawTableHeaderRow(doc, y, layout);
}

/**
 * Pre-map sorted raw rows once; merge reuses cached PDF rows for keys and merged output.
 */
function prepareLdpFobMergedRows(rawRows) {
  const sortedRaw = sortLdpFobRawRowsByCustomer(rawRows);
  const pdfRowByRaw = new WeakMap();
  for (let i = 0; i < sortedRaw.length; i += 1) {
    const raw = sortedRaw[i];
    pdfRowByRaw.set(raw, mapLdpFobApiRowToPdfRow(raw));
  }
  const mergedPdfRowByMergedRaw = new WeakMap();
  const mergedRaw = mergeLdpFobRawRowsByLineKey(sortedRaw, {
    pdfRowByRaw,
    mergedPdfRowByMergedRaw,
  });
  return { sortedRaw, mergedRaw, mergedPdfRowByMergedRaw };
}

/**
 * Build draw-ready items: one map + one height/line-wrap pass per merged row.
 * @returns {Array<{ customerLabel: string; pdfRow: object; prep: { cells: string[]; cellLines: string[][]; rowH: number } }>}
 */
function buildLdpFobPdfDrawItems(doc, mergedRaw, mergedPdfRowByMergedRaw, layout) {
  const items = [];
  for (let i = 0; i < mergedRaw.length; i += 1) {
    const merged = mergedRaw[i];
    const pdfRow =
      mergedPdfRowByMergedRaw.get(merged) ?? mapLdpFobApiRowToPdfRow(merged);
    items.push({
      customerLabel: getLdpFobCustomerGroupLabel(merged),
      pdfRow,
      prep: buildDataRowPrep(doc, pdfRow, layout),
    });
  }
  return items;
}

/**
 * @param {object[]} rawRows API rows (mapped via {@link mapLdpFobApiRowToPdfRow})
 * @param {object} [options] {@link LDP_FOB_PRICE_LIST_REPORT_OPTIONS} for LDP and FOB Report page
 * @returns {Promise<Blob>}
 */
export async function buildLdpFobPdfBlobFromRows(rawRows, options = {}, debug = {}) {
  const { onTiming } = debug;
  const layout = resolveLdpFobReportLayout(options);
  layout._tableXs = colStarts(layout.colWidths, layout.tableMargin);

  const dataProcStart = performance.now();
  const { mergedRaw, mergedPdfRowByMergedRaw } = prepareLdpFobMergedRows(rawRows);
  onTiming?.('dataProcessing', Math.round(performance.now() - dataProcStart));

  // eslint-disable-next-line new-cap -- library default export
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pdfGenStart = performance.now();

  const logoPromise = loadLogoDataUrl().catch((e) => {
    console.warn('[FOB PDF] Logo load failed — check public/logo/AMSlogo.png', e);
    return null;
  });
  const drawItems =
    mergedRaw.length > 0
      ? buildLdpFobPdfDrawItems(doc, mergedRaw, mergedPdfRowByMergedRaw, layout)
      : null;
  const logoDataUrl = await logoPromise;

  let y = await drawPageHeader(doc, logoDataUrl, layout);
  y = drawTableHeaderRow(doc, y, layout);

  const bottomLimit = PAGE_H - 36;
  const bannerMetricsCache = new Map();

  if (!mergedRaw.length) {
    const emptyRow = {
      supplier: '—',
      po: '—',
      style: '—',
      description: 'No data for selected filters.',
      sizes: '—',
      qty: '—',
      deliveryDate: '—',
      factoryShipDate: '—',
      fob: '—',
      ldp: '—',
    };
    drawDataRow(doc, y, emptyRow, layout, buildDataRowPrep(doc, emptyRow, layout));
  } else {
    let prevCustomerKey = null;

    for (let i = 0; i < drawItems.length; i += 1) {
      const { customerLabel, pdfRow, prep } = drawItems[i];

      if (customerLabel !== prevCustomerKey) {
        let bannerMetrics = bannerMetricsCache.get(customerLabel);
        if (!bannerMetrics) {
          bannerMetrics = getCustomerBannerMetrics(doc, customerLabel, layout.colWidths);
          bannerMetricsCache.set(customerLabel, bannerMetrics);
        }
        const { rowH: bannerH } = bannerMetrics;
        const dataH = prep.rowH;
        if (y + bannerH + dataH > bottomLimit) {
          doc.addPage();
          y = drawContinuedPageHeader(doc, layout);
        } else if (y + bannerH > bottomLimit) {
          doc.addPage();
          y = drawContinuedPageHeader(doc, layout);
        }
        y = drawCustomerGroupBannerRow(
          doc,
          y,
          customerLabel,
          layout.colWidths,
          layout.tableMargin,
          bannerMetrics
        );
        prevCustomerKey = customerLabel;
      }

      const h = prep.rowH;
      if (y + h > bottomLimit) {
        doc.addPage();
        y = drawContinuedPageHeader(doc, layout);
      }
      y = drawDataRow(doc, y, pdfRow, layout, prep);
    }
  }

  const documentTitle = options.documentTitle;
  if (documentTitle) {
    try {
      doc.setProperties({ title: documentTitle, subject: documentTitle });
    } catch (e) {
      /* setProperties unavailable — non-fatal, preview still works */
    }
  }

  const blob = doc.output('blob');
  onTiming?.('pdfGeneration', Math.round(performance.now() - pdfGenStart));
  return blob;
}

/** CSV — same columns as PDF table. */
export function buildLdpFobCsvFromRows(rawRows) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [DEFAULT_TABLE_HEADERS];
  const sortedRaw = sortLdpFobRawRowsByCustomer(rawRows);
  const mergedRaw = mergeLdpFobRawRowsByLineKey(sortedRaw);
  let prevCustomerKey = null;
  mergedRaw.forEach((raw) => {
    const customerLabel = getLdpFobCustomerGroupLabel(raw);
    if (customerLabel !== prevCustomerKey) {
      lines.push([customerLabel, '', '', '', '', '', '', '', '']);
      prevCustomerKey = customerLabel;
    }
    const r = mapLdpFobApiRowToPdfRow(raw);
    lines.push([
      r.supplier,
      r.po,
      r.style,
      r.description,
      r.sizes,
      r.qty,
      r.deliveryDate,
      r.factoryShipDate,
      r.fob,
    ]);
  });
  if (!mergedRaw.length) {
    lines.push(['—', '—', '—', 'No data for selected filters.', '—', '—', '—', '—', '—']);
  }
  const csv = lines.map((row) => row.map(esc).join(',')).join('\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

/**
 * @param {'view'|'pdf'|'excel'} mode
 * @param {Blob} pdfBlob
 * @param {Blob} [csvBlob]
 * @param {{ pdfFilename?: string }} [options]
 */
export function openLdpFobDemoDownload(mode, pdfBlob, csvBlob, options = {}) {
  if (mode === 'excel' && csvBlob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(csvBlob);
    a.download = 'FOB PRICE LIST.csv';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
    return;
  }

  const pdfFilename = options.pdfFilename || 'FOB PRICE LIST.pdf';
  const namedPdf =
    typeof File !== 'undefined'
      ? new File([pdfBlob], pdfFilename, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedPdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = pdfFilename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
