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

const TABLE_HEADERS = [
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
const COL_W = [66, 52, 44, 156, 38, 44, 50, 50, 36];

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
 * @returns {number} row height (pt)
 */
function getCustomerBannerRowHeight(doc, name) {
  const fontSize = 6.2;
  const pad = 3;
  const maxW = Math.max(8, COL_W[0] - pad * 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(String(name || ''), maxW);
  const lineH = fontSize * 1.15;
  return Math.min(36, Math.max(15, lines.length * lineH + pad * 2 + 4));
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {number} y
 * @param {string} customerName
 * @returns {number} y below row
 */
function drawCustomerGroupBannerRow(doc, y, customerName) {
  const xs = colStarts();
  const fontSize = 6.2;
  const pad = 3;
  const maxW = Math.max(8, COL_W[0] - pad * 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(String(customerName || ''), maxW);
  const lineH = fontSize * 1.15;
  const rowH = Math.min(36, Math.max(15, lines.length * lineH + pad * 2 + 4));

  for (let i = 0; i < COL_W.length; i += 1) {
    drawCellBorder(doc, xs[i], y, COL_W[i], rowH);
  }
  drawCellText(doc, customerName, xs[0], y, COL_W[0], rowH, 'left', true, fontSize);
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
 */
function ldpFobRowMergeKey(raw) {
  const cust = normLdpFobKeyPart(getLdpFobCustomerGroupLabel(raw));
  const r = mapLdpFobApiRowToPdfRow(raw);
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

/**
 * Merge rows that are identical on all PDF columns except QTY; quantities are summed.
 * Preserves customer sort order and first-seen row order within each customer.
 * @param {object[]} sortedRaw output of {@link sortLdpFobRawRowsByCustomer}
 * @returns {object[]} shallow-cloned API rows with merged `Quantity` / `quantity`
 */
export function mergeLdpFobRawRowsByLineKey(sortedRaw) {
  const list = sortedRaw || [];
  if (!list.length) return [];

  const order = [];
  /** @type {Map<string, { firstRaw: object; totalQty: number }>} */
  const groups = new Map();

  for (const raw of list) {
    const key = ldpFobRowMergeKey(raw);
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
    return base;
  });
}

function colStarts() {
  const xs = [];
  let x = MARGIN;
  for (let i = 0; i < COL_W.length; i += 1) {
    xs.push(x);
    x += COL_W[i];
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
 */
function drawCellText(doc, text, x, yTop, w, h, align, bold, fontSize) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  const pad = 3;
  const maxW = Math.max(8, w - pad * 2);
  const lines = doc.splitTextToSize(String(text || ''), maxW);
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
function drawTableHeaderRow(doc, y) {
  const xs = colStarts();
  const rowH = 26;
  doc.setDrawColor(0);
  doc.setLineWidth(0.45);
  for (let i = 0; i < COL_W.length; i += 1) {
    drawCellBorder(doc, xs[i], y, COL_W[i], rowH);
    const align = i <= 3 ? 'left' : 'center';
    drawCellText(doc, TABLE_HEADERS[i], xs[i], y, COL_W[i], rowH, align, true, 7);
  }
  return y + rowH;
}

function getPdfDataCells(row) {
  return [
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
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {object} row
 */
function measureDataRowHeight(doc, row) {
  const cells = getPdfDataCells(row);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const innerH = [];
  for (let i = 0; i < cells.length; i += 1) {
    const maxW = Math.max(6, COL_W[i] - 6);
    const lines = doc.splitTextToSize(String(cells[i] || ''), maxW);
    const lh = 7.5 * 1.2;
    innerH.push(Math.max(22, lines.length * lh + 10));
  }
  return Math.min(120, Math.max(...innerH));
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {number} y
 * @param {object} row
 */
function drawDataRow(doc, y, row) {
  const xs = colStarts();
  const cells = getPdfDataCells(row);
  const rowH = measureDataRowHeight(doc, row);

  for (let i = 0; i < COL_W.length; i += 1) {
    drawCellBorder(doc, xs[i], y, COL_W[i], rowH);
    const align = i <= 3 ? 'left' : 'center';
    drawCellText(doc, cells[i], xs[i], y, COL_W[i], rowH, align, false, 7.5);
  }
  return y + rowH;
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {string | null} logoDataUrl
 * @returns {Promise<number>} y position below header (before table)
 */
async function drawPageHeader(doc, logoDataUrl) {
  const titleY = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text('FOB PRICE LIST', MARGIN, titleY);

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

function drawContinuedPageHeader(doc) {
  let y = MARGIN + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FOB PRICE LIST (continued)', MARGIN, y);
  y += 22;
  return drawTableHeaderRow(doc, y);
}

/**
 * @param {object[]} rawRows API rows (mapped via {@link mapLdpFobApiRowToPdfRow})
 * @returns {Promise<Blob>}
 */
export async function buildLdpFobPdfBlobFromRows(rawRows) {
  // eslint-disable-next-line new-cap -- library default export
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  let logoDataUrl = null;
  try {
    logoDataUrl = await loadLogoDataUrl();
  } catch (e) {
    console.warn('[FOB PDF] Logo load failed — check public/logo/AMSlogo.png', e);
  }

  let y = await drawPageHeader(doc, logoDataUrl);
  y = drawTableHeaderRow(doc, y);

  const bottomLimit = PAGE_H - 36;
  const sortedRaw = sortLdpFobRawRowsByCustomer(rawRows);
  const mergedRaw = mergeLdpFobRawRowsByLineKey(sortedRaw);

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
    };
    drawDataRow(doc, y, emptyRow);
  } else {
    let prevCustomerKey = null;
    for (let i = 0; i < mergedRaw.length; i += 1) {
      const raw = mergedRaw[i];
      const customerLabel = getLdpFobCustomerGroupLabel(raw);
      const row = mapLdpFobApiRowToPdfRow(raw);

      if (customerLabel !== prevCustomerKey) {
        const bannerH = getCustomerBannerRowHeight(doc, customerLabel);
        const dataH = measureDataRowHeight(doc, row);
        if (y + bannerH + dataH > bottomLimit) {
          doc.addPage();
          y = drawContinuedPageHeader(doc);
        } else if (y + bannerH > bottomLimit) {
          doc.addPage();
          y = drawContinuedPageHeader(doc);
        }
        y = drawCustomerGroupBannerRow(doc, y, customerLabel);
        prevCustomerKey = customerLabel;
      }

      const h = measureDataRowHeight(doc, row);
      if (y + h > bottomLimit) {
        doc.addPage();
        y = drawContinuedPageHeader(doc);
      }
      y = drawDataRow(doc, y, row);
    }
  }

  return doc.output('blob');
}

/** CSV — same columns as PDF table. */
export function buildLdpFobCsvFromRows(rawRows) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [TABLE_HEADERS];
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
 */
export function openLdpFobDemoDownload(mode, pdfBlob, csvBlob) {
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

  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'FOB PRICE LIST.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
