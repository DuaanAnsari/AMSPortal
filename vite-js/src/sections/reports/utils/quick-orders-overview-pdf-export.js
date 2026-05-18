import jsPDF from 'jspdf';

/**
 * "AMS - Quick Orders Overview" — landscape PDF.
 *
 * Mirrors the legacy print mock-up exactly:
 *
 *   - Page 1 header :
 *       - AMS logo (top-left) + company address strip + new telephone
 *         numbers (02134937216 & 02134946005).
 *       - Bold centered title "AMS - Quick Orders Overview".
 *
 *   - Table : 14 columns rendered in a 3-row header band.
 *       1.  PO.#
 *       2.  Sty #
 *       3.  Item Description
 *       4.  Ship Date           (line 2 "Original" in teal, line 3 "& Ex-Fty")
 *       5.  Ship Mode           (line 2 "Original",        line 3 "Revised" in orange)
 *       6.  Order Qty / Units
 *       7.  Sample Approval Status
 *       8-10. Cutting | Stitching | Packing — sit under a merged
 *              "Production Status - WIP" / "Offline Only" group header.
 *       11. Shipped Qty         (header text green)
 *       12. Order Qty
 *       13. Balance Qty         (header text orange, negative values red)
 *       14. Remarks
 *
 *   - Hierarchy rows :
 *       - Customer banner (light grey, e.g. "Ayyoub Apparels").
 *       - Supplier banner (lighter, e.g. "MV SPORTS").
 *       - Data rows — multi-line cells supported via "\n".
 *       - Supplier total : "MV SPORTS   Total:   11,424   Pcs." with the
 *         "Pcs." in bold teal, placed immediately after the quantity.
 *       - Customer total : "Ayyoub Apparels   Total:   72,795   Pcs"
 *         (same style).
 *
 *   - Page 2+ : table header repeats; the logo / address strip is page-1
 *     only.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

// Custom landscape format — slightly larger than A4 landscape (842x595)
// so the 14-column grid breathes without shrinking the font below 7pt.
const PAGE_W = 920;
const PAGE_H = 620;
const H_MARGIN = 16;
const V_MARGIN_TOP = 18;
const V_MARGIN_BOTTOM = 26;

const LOGO_W = 90;
const LOGO_H = 48;

const CONT_HEADER_H = 12;

/** 3-line header → ~12pt per line. */
const TABLE_HEADER_H = 38;
const TABLE_HEADER_LINE_H = TABLE_HEADER_H / 3;
const ROW_BASE_H = 24;
const GROUP_ROW_H = 18;
const TOTAL_ROW_H = 18;

const TABLE_HEADER_FILL = [255, 255, 255];
const CUSTOMER_BAND_FILL = [217, 217, 217];
const SUPPLIER_BAND_FILL = [240, 240, 240];
const TOTAL_ROW_FILL = [255, 255, 255];
const TABLE_BORDER = [170, 170, 170];

const BLACK = [0, 0, 0];
const TEAL = [25, 130, 110];
const WARM_ORANGE = [220, 90, 40];
/** Header-only green for "Shipped Qty" column title. */
const HEADER_GREEN = [34, 139, 34];

const PDF_VIEW_ZOOM_HASH = '#zoom=100';

/**
 * @typedef {{
 *   key: string;
 *   labels?: string[];
 *   label?: string;
 *   weight: number;
 *   align?: 'left'|'center'|'right';
 *   headerColors?: number[][];
 *   headerColor?: number[];
 *   dataAlign?: 'left'|'center'|'right';
 *   bold?: boolean;
 *   negativeRed?: boolean;
 *   groupHeader?: boolean;
 * }} QuickOrdersCol
 */

/** @type {QuickOrdersCol[]} */
const COLS = [
  { key: 'poNo', labels: ['PO.#'], weight: 50, align: 'left', dataAlign: 'left' },
  { key: 'styNo', labels: ['Sty #'], weight: 38, align: 'center', dataAlign: 'center' },
  { key: 'itemDesc', labels: ['Item Description'], weight: 100, align: 'left', dataAlign: 'left' },
  {
    key: 'shipDate',
    labels: ['Ship Date', 'Original', '& Ex-Fty'],
    headerColors: [BLACK, TEAL, BLACK],
    weight: 60,
    align: 'center',
    dataAlign: 'center',
  },
  {
    key: 'shipMode',
    labels: ['Ship Mode', 'Original', 'Revised'],
    headerColors: [BLACK, BLACK, WARM_ORANGE],
    weight: 58,
    align: 'center',
    dataAlign: 'center',
  },
  {
    key: 'orderQty',
    labels: ['Order Qty', 'Units'],
    weight: 50,
    align: 'center',
    dataAlign: 'center',
    bold: true,
  },
  {
    key: 'sampleApproval',
    labels: ['Sample', 'Approval Status'],
    weight: 72,
    align: 'center',
    dataAlign: 'center',
    bold: true,
  },
  { key: 'cutting', labels: ['Cutting'], weight: 42, align: 'center', dataAlign: 'center', groupHeader: true },
  { key: 'stitching', labels: ['Stitching'], weight: 46, align: 'center', dataAlign: 'center', groupHeader: true },
  { key: 'packing', labels: ['Packing'], weight: 42, align: 'center', dataAlign: 'center', groupHeader: true },
  {
    key: 'shippedQty',
    labels: ['Shipped Qty'],
    headerColor: HEADER_GREEN,
    weight: 52,
    align: 'center',
    dataAlign: 'center',
  },
  { key: 'orderQtyTotal', labels: ['Order Qty'], weight: 44, align: 'center', dataAlign: 'center' },
  {
    key: 'balanceQty',
    labels: ['Balance Qty'],
    headerColor: WARM_ORANGE,
    weight: 52,
    align: 'center',
    dataAlign: 'center',
    negativeRed: true,
  },
  { key: 'remarks', labels: ['Remarks'], weight: 56, align: 'center', dataAlign: 'center' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy "AMS - Quick Orders Overview"
// print mock-up (page 1 + page 2 in the image set).
// ----------------------------------------------------------------------

const SAMPLE_APPROVAL = 'Fit Date\nPP Date';
const NA = 'N/A';

function makeRow(o) {
  return {
    poNo: o.poNo || '',
    styNo: o.styNo || '',
    itemDesc: o.itemDesc || '',
    shipDate: o.shipDate || '',
    shipMode: o.shipMode || 'FOB',
    orderQty: o.orderQty || '',
    sampleApproval: o.sampleApproval || SAMPLE_APPROVAL,
    cutting: o.cutting || '0',
    stitching: o.stitching || '0',
    packing: o.packing || '0',
    shippedQty: o.shippedQty || '0',
    orderQtyTotal: o.orderQtyTotal || '0',
    balanceQty: o.balanceQty || '',
    remarks: o.remarks || NA,
  };
}

const QUICK_ORDERS_OVERVIEW_DEMO = {
  fromDate: 'Jan 01, 2026',
  toDate: 'Dec 31, 2026',
  printedOn: null,
  customers: [
    {
      name: 'Ayyoub Apparels',
      totalQty: 72_795,
      suppliers: [
        {
          name: 'MV SPORTS',
          totalQty: 11_424,
          items: [
            makeRow({ poNo: 'V 26\n530191-', styNo: 'W2741\n4', itemDesc: '100% PRE-SHRUNK\nCOTTON LADIES', shipDate: '05-20-2026', orderQty: '1,152', balanceQty: '-1,152' }),
            makeRow({ poNo: 'V 26\n530191-', styNo: 'W2741\n4', itemDesc: '100% PRE-SHRUNK\nCOTTON LADIES', shipDate: '05-20-2026', orderQty: '1,152', balanceQty: '-1,152' }),
            makeRow({ poNo: 'V 26\n530191-', styNo: 'W2741\n4', itemDesc: '58% COTTON/ 39%\nMODAL/ 3%',     shipDate: '05-20-2026', orderQty: '1,152', balanceQty: '-1,152' }),
            makeRow({ poNo: 'V 26\n530191-', styNo: 'W2741\n4', itemDesc: '58% COTTON/ 39%\nMODAL/ 3%',     shipDate: '05-15-2026', orderQty: '1,152', balanceQty: '-1,152' }),
            makeRow({ poNo: 'V 26\n530191-', styNo: 'W2741\n4', itemDesc: '58% COTTON/ 39%\nMODAL/ 3%',     shipDate: '05-20-2026', orderQty: '1,152', balanceQty: '-1,152' }),
            makeRow({ poNo: 'V 26\n530191-', styNo: 'W2741\n4', itemDesc: '58% COTTON/ 39%\nMODAL/ 3%',     shipDate: '05-20-2026', orderQty: '1,152', balanceQty: '-1,152' }),
            makeRow({ poNo: 'V 26\n530290',  styNo: '27147',     itemDesc: '60% POLYESTER\n40% COTTON MEN', shipDate: '05-20-2026', orderQty: '1,512', balanceQty: '-1,512' }),
            makeRow({ poNo: 'V 26\n530291',  styNo: '27148',     itemDesc: '60% POLYESTER\n40% COTTON MEN', shipDate: '05-20-2026', orderQty: '1,512', balanceQty: '-1,512' }),
            makeRow({ poNo: 'V 26\n530292',  styNo: '27149',     itemDesc: '60% POLYESTER\n40% COTTON MEN', shipDate: '05-20-2026', orderQty: '1,488', balanceQty: '-1,488' }),
          ],
        },
        {
          name: 'Jedco brands, inc',
          totalQty: 61_371,
          items: [
            makeRow({ poNo: 'PO0019\n539',   styNo: 'APX\nCAMO',  itemDesc: '50% POLYESTER\n25% VISCOSE 25%', shipDate: '05-20-2026', orderQty: '20,396', balanceQty: '-20,396' }),
            makeRow({ poNo: 'PO0019\n629',   styNo: 'APX\nCAMO',  itemDesc: '50% POLYESTER\n25% VISCOSE 25%', shipDate: '05-20-2026', orderQty: '20,395', balanceQty: '-20,395' }),
            makeRow({ poNo: 'PO0019\n438',   styNo: 'APX\nCAMO',  itemDesc: '50% POLYESTER\n25% VISCOSE 25%', shipDate: '04-30-2026', orderQty: '10,308', shippedQty: '10,308', balanceQty: '0' }),
            makeRow({ poNo: 'Po0019\n439',   styNo: 'APX\nCAMO',  itemDesc: '50% POLYESTER\n25% VISCOSE 25%', shipDate: '04-30-2026', orderQty: '10,272', shippedQty: '10,272', balanceQty: '0' }),
          ],
        },
      ],
    },
    {
      name: 'Comfort apparel',
      totalQty: 27_424,
      suppliers: [
        {
          name: 'LONE ROCK',
          totalQty: 25_920,
          items: [
            makeRow({ poNo: '38998-S\nS-NAVY', styNo: 'LR1096', itemDesc: '100% COTTON MEN\nJERSEY GARMENT', shipDate: '05-20-2026', orderQty: '3,624', balanceQty: '-3,624' }),
            makeRow({ poNo: '38998-S\nS-SAGE', styNo: 'LR1096', itemDesc: '100% COTTON MEN\nJERSEY GARMENT', shipDate: '05-20-2026', orderQty: '1,512', balanceQty: '-1,512' }),
            makeRow({ poNo: '38998-S\nS-BLUE', styNo: 'LR1096', itemDesc: '100% COTTON MEN\nJERSEY GARMENT', shipDate: '05-20-2026', orderQty: '1,536', balanceQty: '-1,536' }),
            makeRow({ poNo: '38998-S\nS-CARA', styNo: 'LR1096', itemDesc: '100% COTTON MEN\nJERSEY GARMENT', shipDate: '05-20-2026', orderQty: '1,680', balanceQty: '-1,680' }),
            makeRow({ poNo: '38998-S\nS-CREA', styNo: 'LR1096', itemDesc: '100% COTTON MEN\nJERSEY GARMENT', shipDate: '05-20-2026', orderQty: '3,168', balanceQty: '-3,168' }),
            makeRow({ poNo: '38998-L\nS-BLUS', styNo: 'LR2096', itemDesc: '100% COTTON MEN\nJERSEY GARMENT', shipDate: '05-20-2026', orderQty: '2,640', balanceQty: '-2,640', remarks: 'ON DYING' }),
            makeRow({ poNo: '38998-L\nS-NAVY', styNo: 'LR2096', itemDesc: '100% COTTON MEN\nJERSEY GARMENT', shipDate: '05-20-2026', orderQty: '408',   balanceQty: '-408',   remarks: 'ON DYING' }),
            makeRow({ poNo: '38998-L\nS-RED',  styNo: 'LR2096', itemDesc: '100% COTTON MEN\nJERSEY GARMENT', shipDate: '05-20-2026', orderQty: '1,800', balanceQty: '-1,800', remarks: 'ON DYING' }),
            makeRow({ poNo: '38998-L\nS-SAGE', styNo: 'LR2096', itemDesc: '100% COTTON MEN\nJERSEY GARMENT', shipDate: '05-20-2026', orderQty: '528',   balanceQty: '-528',   remarks: 'ON DYING' }),
            makeRow({ poNo: '39006-L\nS-RED',  styNo: 'LR2096', itemDesc: '100% COTTON MEN\nJERSEY GARMENT', shipDate: '05-20-2026', orderQty: '9,024', balanceQty: '-9,024' }),
          ],
        },
        {
          name: 'MV SPORTS',
          totalQty: 2_304,
          items: [
            makeRow({ poNo: 'V 26\n530199-', styNo: 'W2741\n8', itemDesc: '100% PRE-SHRUNK\nCOTTON LADIES', shipDate: '05-15-2026', orderQty: '2,304', balanceQty: '-2,304' }),
          ],
        },
      ],
    },
  ],
};

export { QUICK_ORDERS_OVERVIEW_DEMO };

// ----------------------------------------------------------------------
// Number helpers
// ----------------------------------------------------------------------

function formatThousands(n) {
  if (n == null || n === '') return '';
  const num = typeof n === 'number' ? n : Number(String(n).replace(/,/g, ''));
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('en-US');
}

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

function formatPrintedOnLong(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ----------------------------------------------------------------------
// Drawing primitives
// ----------------------------------------------------------------------

function setBorder(doc, rgb = TABLE_BORDER, lineW = 0.4) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(lineW);
}

function fillRect(doc, x, y, w, h, fill) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.rect(x, y, w, h, 'F');
}

function strokeRect(doc, x, y, w, h, borderRgb, lineW = 0.4) {
  setBorder(doc, borderRgb, lineW);
  doc.rect(x, y, w, h);
}

function drawTextInArea(doc, x, y, w, h, line, opts = {}) {
  const { bold = false, fontSize = 8, color = BLACK, pad = 2, align = 'center' } = opts;
  if (line == null || line === '') return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  let tx;
  if (align === 'left') tx = x + pad;
  else if (align === 'right') tx = x + w - pad;
  else tx = x + w / 2;
  doc.text(String(line), tx, y + h / 2, {
    align,
    baseline: 'middle',
    maxWidth: w - pad * 2,
  });
  doc.setTextColor(0, 0, 0);
}

function drawTextCentered(doc, x, y, w, h, lines, opts = {}) {
  const { bold = false, fontSize = 8, color = BLACK, pad = 2, align = 'center' } = opts;
  if (!lines || lines.length === 0) return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  const lh = fontSize * 1.18;
  const block = lines.length * lh;
  const firstY = y + (h - block) / 2 + lh / 2;
  let tx;
  if (align === 'left') tx = x + pad;
  else if (align === 'right') tx = x + w - pad;
  else tx = x + w / 2;
  lines.forEach((ln, i) => {
    if (!ln) return;
    doc.text(String(ln), tx, firstY + i * lh, {
      align,
      baseline: 'middle',
      maxWidth: w - pad * 2,
    });
  });
  doc.setTextColor(0, 0, 0);
}

function wrapText(doc, text, w, fontSize, bold, pad = 2) {
  if (text == null || text === '') return [];
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  const innerW = Math.max(2, w - pad * 2);
  const out = [];
  String(text)
    .split('\n')
    .forEach((p) => {
      if (p === '') {
        out.push('');
        return;
      }
      out.push(...doc.splitTextToSize(p, innerW));
    });
  return out;
}

// ----------------------------------------------------------------------
// Page 1 header — logo, address strip, title.
// ----------------------------------------------------------------------

function drawPage1Header(doc, logoDataUrl) {
  const x = H_MARGIN;
  const y = V_MARGIN_TOP;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', x, y, LOGO_W, LOGO_H, undefined, 'FAST');
    } catch {
      /* logo missing — skip silently */
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);

  const addressY1 = y + LOGO_H + 6;
  doc.text(
    'A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800',
    x,
    addressY1,
    { baseline: 'top' }
  );
  doc.text(
    'Karachi - Pakistan.            Telephone # : 02134937216 & 02134946005',
    x,
    addressY1 + 11,
    { baseline: 'top' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('AMS - Quick Orders Overview', PAGE_W / 2, addressY1 + 4, {
    align: 'center',
    baseline: 'middle',
  });

  return addressY1 + 28;
}

// ----------------------------------------------------------------------
// Table header — 3-line band with merged "Production Status" group.
// ----------------------------------------------------------------------

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);

  COLS.forEach((col, i) => {
    fillRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, TABLE_HEADER_FILL);
    strokeRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, TABLE_BORDER, 0.4);

    if (col.groupHeader) {
      drawTextInArea(doc, xs[i], y + 2 * TABLE_HEADER_LINE_H, widths[i], TABLE_HEADER_LINE_H, col.labels[0], {
        bold: true,
        fontSize: 7.6,
        color: BLACK,
      });
      return;
    }

    const labels = col.labels || [col.label || ''];
    const colors = col.headerColors || labels.map(() => col.headerColor || BLACK);
    labels.forEach((ln, li) => {
      const c = colors[li] || BLACK;
      drawTextInArea(doc, xs[i], y + li * TABLE_HEADER_LINE_H, widths[i], TABLE_HEADER_LINE_H, ln, {
        bold: true,
        fontSize: 7.6,
        color: c,
      });
    });
  });

  // Spanning header for Cutting / Stitching / Packing.
  const cuttingIdx = COLS.findIndex((c) => c.key === 'cutting');
  const packingIdx = COLS.findIndex((c) => c.key === 'packing');
  if (cuttingIdx >= 0 && packingIdx >= 0) {
    const groupX = xs[cuttingIdx];
    const groupW = xs[packingIdx] + widths[packingIdx] - xs[cuttingIdx];
    drawTextInArea(doc, groupX, y, groupW, TABLE_HEADER_LINE_H, 'Production Status - WIP', {
      bold: true,
      fontSize: 7.6,
      color: BLACK,
    });
    drawTextInArea(doc, groupX, y + TABLE_HEADER_LINE_H, groupW, TABLE_HEADER_LINE_H, 'Offline Only', {
      bold: true,
      fontSize: 7.6,
      color: BLACK,
    });
  }

  return y + TABLE_HEADER_H;
}

// ----------------------------------------------------------------------
// Group rows — Customer banner (darker grey) & Supplier banner (lighter).
// ----------------------------------------------------------------------

function drawCustomerBand(doc, y, x0, tableW, name) {
  fillRect(doc, x0, y, tableW, GROUP_ROW_H, CUSTOMER_BAND_FILL);
  strokeRect(doc, x0, y, tableW, GROUP_ROW_H, TABLE_BORDER, 0.4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(name || '', x0 + 6, y + GROUP_ROW_H / 2, {
    baseline: 'middle',
    maxWidth: tableW - 12,
  });
  return y + GROUP_ROW_H;
}

function drawSupplierBand(doc, y, x0, tableW, name) {
  fillRect(doc, x0, y, tableW, GROUP_ROW_H, SUPPLIER_BAND_FILL);
  strokeRect(doc, x0, y, tableW, GROUP_ROW_H, TABLE_BORDER, 0.4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(name || '', x0 + 6, y + GROUP_ROW_H / 2, {
    baseline: 'middle',
    maxWidth: tableW - 12,
  });
  return y + GROUP_ROW_H;
}

// ----------------------------------------------------------------------
// Data row — variable height for multi-line cells, optional red on
// negative Balance Qty.
// ----------------------------------------------------------------------

function isNegativeText(s) {
  if (s == null) return false;
  return String(s).trim().startsWith('-');
}

function measureRowHeight(doc, widths, item) {
  let maxLines = 1;
  COLS.forEach((col, i) => {
    const raw = item[col.key];
    const lines = wrapText(doc, raw, widths[i], 7.4, false, 3);
    if (lines.length > maxLines) maxLines = lines.length;
  });
  const dynamic = maxLines * 10 + 6;
  return Math.max(ROW_BASE_H, dynamic);
}

function drawDataRow(doc, y, x0, widths, item) {
  const rowH = measureRowHeight(doc, widths, item);
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, rowH, TABLE_BORDER, 0.3);
    const raw = item[col.key];
    if (raw === undefined || raw === null || raw === '') return;
    const isNegBal = col.negativeRed && isNegativeText(raw);
    const color = isNegBal ? WARM_ORANGE : BLACK;
    const lines = wrapText(doc, raw, w, 7.4, !!col.bold, 3);
    drawTextCentered(doc, x, y, w, rowH, lines, {
      bold: !!col.bold,
      fontSize: 7.4,
      color,
      align: col.dataAlign || 'center',
      pad: 3,
    });
  });
  return y + rowH;
}

// ----------------------------------------------------------------------
// Total row — supplier or customer total. Layout:
//   <label name> | Total: | <qty> | Pcs.  (Pcs. bold teal, immediately after qty)
// All positioned at fixed columns so the strip lines up vertically.
// ----------------------------------------------------------------------

function drawTotalRow(doc, y, x0, widths, label, qty) {
  const xs = colXs(x0, widths);
  const tableW = widths.reduce((a, b) => a + b, 0);

  fillRect(doc, x0, y, tableW, TOTAL_ROW_H, TOTAL_ROW_FILL);
  // Top + bottom hairlines only, no internal borders (matches mock-up).
  setBorder(doc, TABLE_BORDER, 0.4);
  doc.line(x0, y, x0 + tableW, y);
  doc.line(x0, y + TOTAL_ROW_H, x0 + tableW, y + TOTAL_ROW_H);

  // <label> — right aligned to end of "Item Description" column.
  const itemDescIdx = COLS.findIndex((c) => c.key === 'itemDesc');
  const labelRightX = xs[itemDescIdx] + widths[itemDescIdx] - 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(0, 0, 0);
  doc.text(String(label || ''), labelRightX, y + TOTAL_ROW_H / 2, {
    align: 'right',
    baseline: 'middle',
  });

  // "Total:" — centered in Ship Date column.
  const shipDateIdx = COLS.findIndex((c) => c.key === 'shipDate');
  drawTextInArea(doc, xs[shipDateIdx], y, widths[shipDateIdx], TOTAL_ROW_H, 'Total:', {
    bold: true,
    fontSize: 8.4,
    color: BLACK,
  });

  // <qty> — centered in Order Qty column.
  const orderQtyIdx = COLS.findIndex((c) => c.key === 'orderQty');
  const qtyStr = formatThousands(qty);
  drawTextInArea(doc, xs[orderQtyIdx], y, widths[orderQtyIdx], TOTAL_ROW_H, qtyStr, {
    bold: true,
    fontSize: 8.4,
    color: BLACK,
  });

  // "Pcs." — bold + teal, snug to the right of the qty column so it reads
  // as "11,424 Pcs." without drifting into the Sample Approval column.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(TEAL[0], TEAL[1], TEAL[2]);
  const gapAfterQty = 5;
  const pcsX = xs[orderQtyIdx] + widths[orderQtyIdx] / 2 + doc.getTextWidth(qtyStr) / 2 + gapAfterQty;
  doc.text('Pcs.', pcsX, y + TOTAL_ROW_H / 2, { baseline: 'middle' });
  doc.setTextColor(0, 0, 0);

  return y + TOTAL_ROW_H;
}

// ----------------------------------------------------------------------
// Page footer
// ----------------------------------------------------------------------

function drawFooter(doc, pageIdx, totalPages, printedOn) {
  const fy = PAGE_H - V_MARGIN_BOTTOM + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Printed on : ${printedOn || formatPrintedOnLong()}`, H_MARGIN, fy, {
    baseline: 'bottom',
  });
  doc.text(`Page ${pageIdx} of ${totalPages}`, PAGE_W - H_MARGIN, fy, {
    align: 'right',
    baseline: 'bottom',
  });
  doc.setTextColor(0, 0, 0);
}

// ----------------------------------------------------------------------
// Public builder
// ----------------------------------------------------------------------

/**
 * Build the Quick Orders Overview PDF blob.
 *
 * @param {{
 *   customers?: Array<{
 *     name: string;
 *     totalQty?: number;
 *     suppliers: Array<{ name: string; totalQty?: number; items: object[] }>;
 *   }>;
 *   fromDate?: string;
 *   toDate?: string;
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildQuickOrdersOverviewPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.customers) && data.customers.length > 0
      ? data
      : QUICK_ORDERS_OVERVIEW_DEMO;

  const meta = {
    printedOn: payload.printedOn || data.printedOn || formatPrintedOnLong(),
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl();

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = tableColWidths(tableW);
  const pageBodyBottom = PAGE_H - V_MARGIN_BOTTOM - 18;

  drawPage1Header(doc, logoDataUrl);
  let y = drawTableHeader(doc, V_MARGIN_TOP + LOGO_H + 32, tableX, widths);

  const ensureRoom = (need) => {
    if (y + need > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'l');
      y = drawTableHeader(doc, V_MARGIN_TOP + CONT_HEADER_H, tableX, widths);
    }
  };

  payload.customers.forEach((customer) => {
    ensureRoom(GROUP_ROW_H);
    y = drawCustomerBand(doc, y, tableX, tableW, customer.name);

    (customer.suppliers || []).forEach((supplier) => {
      ensureRoom(GROUP_ROW_H);
      y = drawSupplierBand(doc, y, tableX, tableW, supplier.name);

      (supplier.items || []).forEach((row) => {
        const rowH = measureRowHeight(doc, widths, row);
        ensureRoom(rowH);
        y = drawDataRow(doc, y, tableX, widths, row);
      });

      ensureRoom(TOTAL_ROW_H);
      y = drawTotalRow(doc, y, tableX, widths, supplier.name, supplier.totalQty);
    });

    ensureRoom(TOTAL_ROW_H);
    y = drawTotalRow(doc, y, tableX, widths, customer.name, customer.totalQty);
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
 * @param {string} [filename]
 */
export function openQuickOrdersOverviewPdf(mode, pdfBlob, filename = 'Quick-Orders-Overview.pdf') {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
