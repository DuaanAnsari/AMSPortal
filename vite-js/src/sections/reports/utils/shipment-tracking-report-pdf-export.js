import jsPDF from 'jspdf';

/**
 * Shipment & Documents Tracking Report — wide landscape PDF.
 *
 * Layout (per legacy print):
 *   - Page header: AMS logo + address (left), bold centered title, live print
 *     date / time (right).
 *   - Cyan customer band at the start of every customer group.
 *   - 23-leaf-column table:
 *       10 single columns (Vendor … Destination)
 *     + 3 grouped sub-columns under "Shipment Dates" (ETD, ETA, ETW)
 *     + 3 grouped sub-columns under "Revised PO Dates (If applicable)"
 *     + 2 grouped sub-columns under "Actual Dates" (ETA, ETW)
 *     + 5 trailing single columns (Container Release Dates … Remarks).
 *   - Every shipment is rendered as TWO physical rows:
 *       1) data row (single-line cells)
 *       2) "Voyage" band — small label, mode chip (BY SEA / BY AIR), voyage name
 *          chip and a "Description : <text>" tail spanning the remainder.
 *   - Light-gray "Shipment Total :" subtotal after every sub-group;
 *     "<CUSTOMER> Total :" before the next customer banner.
 *   - Footer (every page): "Printed By :" — "AMS Confidential" — "Page # N".
 *
 * Demo data hardcoded for now; backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 1280;
const PAGE_H = 780;
const V_MARGIN = 12;
const H_MARGIN = 14;

/** Header block (logo + title + print stamp). */
const HEADER_BLOCK_H = 84;

/** Customer banner (cyan band with customer name). */
const CUSTOMER_BAND_H = 22;

/** Two-row table header (top: group labels merged; bottom: sub-labels). */
const HEADER_TOP_H = 22;
const HEADER_BOT_H = 16;
const TABLE_HEADER_H = HEADER_TOP_H + HEADER_BOT_H;

/** Per shipment we draw two rows — data line + Voyage description line. */
const DATA_ROW_H = 20;
const VOYAGE_ROW_H = 18;
const SHIPMENT_BLOCK_H = DATA_ROW_H + VOYAGE_ROW_H;

const SUBTOTAL_ROW_H = 18;
const CUSTOMER_TOTAL_H = 20;
const FOOTER_H = 18;

const HEADER_FILL = [225, 228, 233];
const CUSTOMER_FILL = [196, 228, 239];
const SUBTOTAL_FILL = [220, 220, 220];
const VOYAGE_FILL = [240, 240, 240];
const BORDER = [150, 150, 150];

const PDF_VIEW_ZOOM_HASH = '#zoom=110';

// ----------------------------------------------------------------------
// Column definition — 23 leaf cells. `group` keys collapse into one wide
// top-header cell; leaf labels stay in the bottom row.
// ----------------------------------------------------------------------

/** @typedef {{ key: string; label: string; weight: number; align?: 'left'|'center'|'right'; group?: string }} ShipmentCol */

/** @type {ShipmentCol[]} */
const COLS = [
  { key: 'vendor', label: 'Vendor', weight: 44, align: 'left' },
  { key: 'poNo', label: 'P.O #', weight: 50, align: 'left' },
  { key: 'vpoActualDate', label: 'VPO Actual\nDate', weight: 42, align: 'center' },
  { key: 'styleNo', label: 'Style #', weight: 30, align: 'left' },
  { key: 'ldpInvoiceNo', label: 'LDP\nInvoice #', weight: 42, align: 'left' },
  { key: 'qtyUnits', label: 'Qty\nUnits', weight: 38, align: 'right' },
  { key: 'shippedCtns', label: 'Shipped\nCtns', weight: 38, align: 'right' },
  { key: 'mblAwblNo', label: 'M-BL / AWBL #', weight: 52, align: 'left' },
  { key: 'containerNo', label: 'Container #', weight: 56, align: 'left' },
  { key: 'destination', label: 'Destination', weight: 48, align: 'left' },

  { group: 'Shipment Dates', key: 'shipmentEtd', label: 'ETD', weight: 32, align: 'center' },
  { group: 'Shipment Dates', key: 'shipmentEta', label: 'ETA', weight: 32, align: 'center' },
  { group: 'Shipment Dates', key: 'shipmentEtw', label: 'ETW', weight: 32, align: 'center' },

  { group: 'Revised PO Dates (If applicable)', key: 'revisedEtd', label: 'ETD', weight: 32, align: 'center' },
  { group: 'Revised PO Dates (If applicable)', key: 'revisedEta', label: 'ETA', weight: 32, align: 'center' },
  { group: 'Revised PO Dates (If applicable)', key: 'revisedEtw', label: 'ETW', weight: 32, align: 'center' },

  { group: 'Actual Dates', key: 'actualEta', label: 'ETA', weight: 32, align: 'center' },
  { group: 'Actual Dates', key: 'actualEtw', label: 'ETW', weight: 32, align: 'center' },

  { key: 'containerRelease', label: 'Container\nRelease Dates', weight: 56, align: 'center' },
  { key: 'containerDelivery', label: 'Container Delivery\nDate to AST Warehouse', weight: 84, align: 'center' },
  { key: 'warehouseName', label: 'Warehouse\nName', weight: 50, align: 'left' },
  { key: 'truckerName', label: 'Trucker\nName', weight: 50, align: 'left' },
  { key: 'remarks', label: 'Remarks', weight: 56, align: 'left' },
];

/** Which leaf index corresponds to the qty / ctns columns (used for total alignment). */
const QTY_COL_IDX = COLS.findIndex((c) => c.key === 'qtyUnits');
const CTNS_COL_IDX = COLS.findIndex((c) => c.key === 'shippedCtns');

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy report screenshots.
// Each `subGroup` ends with a "Shipment Total" band; every customer ends with a
// "<CUSTOMER> Total" band before the next customer banner is drawn.
// ----------------------------------------------------------------------

const AVALON_BASE = {
  vendor: 'ALL SEASONS',
  vpoActualDate: '',
  styleNo: '27',
  ldpInvoiceNo: 'AST-AV 4797',
  mblAwblNo: 'CNCKHI7486',
  containerNo: 'UACU5766300',
  destination: 'NEW YORK',
  shipmentEtd: '01/14/26',
  shipmentEta: '02/21/26',
  shipmentEtw: '',
  revisedEtd: '',
  revisedEta: '02/15/26',
  revisedEtw: '',
  actualEta: '',
  actualEtw: '',
  containerRelease: '',
  containerDelivery: '',
  warehouseName: '',
  truckerName: '',
  remarks: '',
  voyageMode: 'BY SEA',
  voyageName: 'ELENI T 602S',
};

const AVALON_BASE_DESC_60 =
  '60% COTTON 40% POLYESTER Men NANTUCKET Men nantucket crew neck';

export const SHIPMENT_TRACKING_REPORT_DEMO = {
  printedBy: '',
  groups: [
    {
      customer: 'AVALON APPAREL',
      subGroups: [
        {
          rows: [
            { ...AVALON_BASE, poNo: 'AMS-AV 022-Blue', qtyUnits: 1224, shippedCtns: 51, description: AVALON_BASE_DESC_60 },
            { ...AVALON_BASE, poNo: 'AMS-AV 022-LAV', qtyUnits: 768, shippedCtns: 32, description: AVALON_BASE_DESC_60 },
            { ...AVALON_BASE, poNo: 'AMS-AV 022-OAT', qtyUnits: 24, shippedCtns: 1, description: AVALON_BASE_DESC_60 },
            { ...AVALON_BASE, poNo: 'AMS-AV 022-Pink', qtyUnits: 840, shippedCtns: 35, description: AVALON_BASE_DESC_60 },
            { ...AVALON_BASE, poNo: 'AMS-AV 022-Salt', qtyUnits: 840, shippedCtns: 35, description: AVALON_BASE_DESC_60 },
            {
              ...AVALON_BASE,
              poNo: 'AMS-AV -023',
              styleNo: '73N',
              qtyUnits: 195,
              shippedCtns: 9,
              description: '60% COTTON 40% POLYESTER Men NANTUCKET Men nantucket 1/4 ZIPPER',
            },
          ],
          subtotal: { qty: 3891, ctns: 163 },
        },
        {
          rows: [
            {
              ...AVALON_BASE,
              poNo: 'AMS-AV 022-OAT',
              mblAwblNo: 'CNCKHI7496',
              containerNo: 'ONEU0820285',
              shipmentEtd: '01/23/26',
              shipmentEta: '02/26/26',
              revisedEta: '03/02/26',
              qtyUnits: 1392,
              shippedCtns: 58,
              voyageName: 'CARL SCHULTE 0008E',
              description: '60% cotton 40% polyester men nantucket crew neck',
            },
          ],
          subtotal: { qty: 1392, ctns: 58 },
        },
        {
          rows: [
            {
              ...AVALON_BASE,
              vendor: 'Ams-av-024',
              poNo: '1010',
              styleNo: '',
              ldpInvoiceNo: 'AST-AV 4813',
              mblAwblNo: 'CNCKHI7573',
              containerNo: 'MSKU0237575',
              shipmentEtd: '03/19/26',
              shipmentEta: '04/19/26',
              revisedEta: '05/04/26',
              qtyUnits: 1488,
              shippedCtns: 62,
              voyageName: 'HANSA EUROPE 612S',
              description: '60% COTTON 40% POLYESTER Men NANTUCKET Qtr zipper hoody',
            },
          ],
          subtotal: { qty: 1488, ctns: 62 },
        },
      ],
      total: { qty: 6765, ctns: 283 },
    },
    {
      customer: 'C-LIFE GROUP LTD.',
      subGroups: [
        {
          rows: [
            {
              vendor: 'ALL SEASONS',
              poNo: 'VPO-1150064',
              vpoActualDate: '',
              styleNo: 'SO-1593980',
              ldpInvoiceNo: 'AST-CL 4814',
              qtyUnits: 30000,
              shippedCtns: 2500,
              mblAwblNo: 'CNCKHI7574',
              containerNo: 'MSKU0237575',
              destination: 'NEW YORK',
              shipmentEtd: '03/19/26',
              shipmentEta: '04/19/26',
              shipmentEtw: '',
              revisedEtd: '',
              revisedEta: '05/04/26',
              revisedEtw: '',
              actualEta: '',
              actualEtw: '',
              containerRelease: '',
              containerDelivery: '',
              warehouseName: '',
              truckerName: '',
              remarks: '',
              voyageMode: 'BY SEA',
              voyageName: 'HANSA EUROPE 612S',
              description: '60% cotton 40% polyester  Men Cvc jersey Good charlotte s/s crew tee',
            },
            {
              vendor: 'ALL SEASONS',
              poNo: 'VPO-1150418',
              vpoActualDate: '',
              styleNo: 'SO-1594517',
              ldpInvoiceNo: 'AST-CL 4814',
              qtyUnits: 144,
              shippedCtns: 12,
              mblAwblNo: 'CNCKHI7574',
              containerNo: 'MSKU0237575',
              destination: 'NEW YORK',
              shipmentEtd: '03/19/26',
              shipmentEta: '04/19/26',
              shipmentEtw: '',
              revisedEtd: '',
              revisedEta: '05/04/26',
              revisedEtw: '',
              actualEta: '',
              actualEtw: '',
              containerRelease: '',
              containerDelivery: '',
              warehouseName: '',
              truckerName: '',
              remarks: '',
              voyageMode: 'BY SEA',
              voyageName: 'HANSA EUROPE 612S',
              description: '60% cotton 40% polyester  Men Cvc jersey Good charlotte s/s crew tee',
            },
          ],
          subtotal: { qty: 30144, ctns: 2512 },
        },
        {
          rows: [
            ['VPO-1149645-007', 4008, 167, 'Spongebob s/s mesh boxy football jersey'],
            ['VPO-1149645-0155', 3528, 147, 'Mesh S/s tee'],
            ['VPO-1149645-0156', 4008, 167, 'Chevrolet chevy van s/s ringer mesh'],
            ['VPO-1149645-0159', 2688, 112, 'Chevrolet chevelle s/s ringer mesh'],
            ['VPO-1149645-0160', 4008, 167, 'Silverado s/s ringer mesh'],
            ['VPO-1149645-0169', 4008, 167, 'Corvette s/s ringer mesh'],
            ['VPO-1149645-024', 2640, 110, 'Fast & furious s/s ringer mesh'],
            ['VPO-1149645-052', 4008, 167, 'Snoopy s/s mesh boxy football jersey'],
            ['VPO-1149645-076', 3216, 134, 'The rolling stones s/s ringer mesh'],
            ['VPO-1149645-078', 4008, 167, 'The rolling stones s/s ringer mesh'],
            ['VPO-1149645-445', 3216, 134, 'Snoopy s/s ringer mesh'],
            ['VPO-1149645-446', 4008, 167, 'Peanuts s/s ringer mesh'],
            ['VPO-1149645-448', 4008, 167, 'Peanuts s/s ringer mesh'],
            ['VPO-1149645-449', 2640, 110, 'Snoopy s/s ringer mesh'],
          ].map(([poNo, qtyUnits, shippedCtns, descTail]) => ({
            vendor: 'ALL SEASONS',
            poNo,
            vpoActualDate: '',
            styleNo: 'SO-1592893',
            ldpInvoiceNo: 'AST-CL 4819',
            qtyUnits,
            shippedCtns,
            mblAwblNo: 'CNCKHI7648',
            containerNo: 'CAAU6465299',
            destination: 'NEW YORK',
            shipmentEtd: '04/29/26',
            shipmentEta: '06/09/26',
            shipmentEtw: '06/15/26',
            revisedEtd: '',
            revisedEta: '',
            revisedEtw: '',
            actualEta: '',
            actualEtw: '',
            containerRelease: '',
            containerDelivery: '',
            warehouseName: '',
            truckerName: '',
            remarks: '',
            voyageMode: 'BY SEA',
            voyageName: 'ALBERT P 617S',
            description: `100% polyester Men Open hole mesh ${descTail}`,
          })),
          subtotal: { qty: 49992, ctns: 2083 },
        },
      ],
      total: { qty: 80136, ctns: 4595 },
    },
    {
      customer: 'JEDCO BRANDS, INC',
      subGroups: [
        {
          rows: [
            {
              vendor: 'HOME EXCELLENCE INC',
              poNo: 'PO0018471',
              vpoActualDate: '',
              styleNo: 'APX CAMO SS',
              ldpInvoiceNo: 'AST-JB 4793',
              qtyUnits: 9767,
              shippedCtns: 136,
              mblAwblNo: '217-0560 4362',
              containerNo: '',
              destination: 'BALTIMORE WASHINGTON',
              shipmentEtd: '01/05/26',
              shipmentEta: '01/12/26',
              shipmentEtw: '',
              revisedEtd: '',
              revisedEta: '',
              revisedEtw: '',
              actualEta: '',
              actualEtw: '',
              containerRelease: '',
              containerDelivery: '',
              warehouseName: '',
              truckerName: '',
              remarks: '',
              voyageMode: 'BY AIR',
              voyageName: 'TG342',
              description: '50% polyester 25% viscose 25% cotton Men Jersey Ss tee',
            },
          ],
          subtotal: { qty: 9767, ctns: 136 },
        },
        {
          rows: [
            {
              vendor: 'HOME EXCELLENCE INC',
              poNo: 'PO0018684',
              vpoActualDate: '',
              styleNo: 'RT ORI CAMO SS',
              ldpInvoiceNo: 'AST-JB 4795',
              qtyUnits: 8496,
              shippedCtns: 118,
              mblAwblNo: '125-1508 8581',
              containerNo: '',
              destination: 'BALTIMORE WASHINGTON',
              shipmentEtd: '01/09/26',
              shipmentEta: '01/18/26',
              shipmentEtw: '',
              revisedEtd: '',
              revisedEta: '',
              revisedEtw: '',
              actualEta: '',
              actualEtw: '',
              containerRelease: '',
              containerDelivery: '',
              warehouseName: '',
              truckerName: '',
              remarks: '',
              voyageMode: 'BY AIR',
              voyageName: 'EK 601',
              description: '50% polyester 25% viscose 25% cotton Men Jersey Ss tee',
            },
          ],
          subtotal: { qty: 8496, ctns: 118 },
        },
      ],
      total: { qty: 18263, ctns: 254 },
    },
  ],
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

/** Sequential header-cell layout — collapses contiguous columns sharing a `group` into one wide top-header cell. */
function headerSegments() {
  const segs = [];
  let i = 0;
  while (i < COLS.length) {
    const col = COLS[i];
    if (!col.group) {
      segs.push({ kind: 'single', from: i, to: i, label: col.label });
      i += 1;
    } else {
      const start = i;
      const groupLabel = col.group;
      let j = i + 1;
      while (j < COLS.length && COLS[j].group === groupLabel) j += 1;
      segs.push({ kind: 'group', from: start, to: j - 1, label: groupLabel });
      i = j;
    }
  }
  return segs;
}

// ----------------------------------------------------------------------
// Drawing helpers
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
  const lineH = fontSize * 1.2;
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

function formatHeaderDate(d = new Date()) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatHeaderTime(d = new Date()) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US');
}

// ----------------------------------------------------------------------
// Page header (logo + title + print stamp)
// ----------------------------------------------------------------------

function drawPageHeader(doc, logoDataUrl) {
  const innerLeft = H_MARGIN;
  const innerRight = PAGE_W - H_MARGIN;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', innerLeft, V_MARGIN, 110, 36);
    } catch {
      /* logo fetch may fail in some test envs — skip silently */
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  const addrY = V_MARGIN + 44;
  doc.text(
    'A.M.S. House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800',
    innerLeft,
    addrY
  );
  doc.text(
    'Karachi - Pakistan.            Telephone # : 02134967216 & 02134946005',
    innerLeft,
    addrY + 9
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    'SHIPMENT & DOCUMENTS TRACKING REPORT -',
    (innerLeft + innerRight) / 2,
    V_MARGIN + 32,
    { align: 'center', baseline: 'alphabetic' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(formatHeaderDate(), innerRight, V_MARGIN + 30, {
    align: 'right',
    baseline: 'alphabetic',
  });
  doc.text(formatHeaderTime(), innerRight, V_MARGIN + 42, {
    align: 'right',
    baseline: 'alphabetic',
  });

  return V_MARGIN + HEADER_BLOCK_H;
}

// ----------------------------------------------------------------------
// Customer banner (cyan stripe with customer name)
// ----------------------------------------------------------------------

function drawCustomerBand(doc, x, y, customer) {
  const w = 160;
  fillRect(doc, x, y, w, CUSTOMER_BAND_H, CUSTOMER_FILL);
  strokeRect(doc, x, y, w, CUSTOMER_BAND_H);
  textInRect(doc, x, y, w, CUSTOMER_BAND_H, customer, {
    bold: true,
    fontSize: 9,
    pad: 6,
  });
  return y + CUSTOMER_BAND_H + 2;
}

// ----------------------------------------------------------------------
// Table header (2 rows — group labels on top, sub-labels below)
// ----------------------------------------------------------------------

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  const segs = headerSegments();

  segs.forEach((seg) => {
    const sx = xs[seg.from];
    const sw = xs[seg.to + 1] - xs[seg.from];

    if (seg.kind === 'single') {
      fillRect(doc, sx, y, sw, TABLE_HEADER_H, HEADER_FILL);
      strokeRect(doc, sx, y, sw, TABLE_HEADER_H);
      textInRect(doc, sx, y, sw, TABLE_HEADER_H, seg.label, {
        align: 'center',
        bold: true,
        fontSize: 7,
        pad: 2,
        maxLines: 3,
      });
    } else {
      fillRect(doc, sx, y, sw, HEADER_TOP_H, HEADER_FILL);
      strokeRect(doc, sx, y, sw, HEADER_TOP_H);
      textInRect(doc, sx, y, sw, HEADER_TOP_H, seg.label, {
        align: 'center',
        bold: true,
        fontSize: 7.5,
        pad: 2,
        maxLines: 2,
      });
      for (let k = seg.from; k <= seg.to; k += 1) {
        const cx = xs[k];
        const cw = widths[k];
        fillRect(doc, cx, y + HEADER_TOP_H, cw, HEADER_BOT_H, HEADER_FILL);
        strokeRect(doc, cx, y + HEADER_TOP_H, cw, HEADER_BOT_H);
        textInRect(doc, cx, y + HEADER_TOP_H, cw, HEADER_BOT_H, COLS[k].label, {
          align: 'center',
          bold: true,
          fontSize: 7,
          pad: 2,
          maxLines: 1,
        });
      }
    }
  });

  return y + TABLE_HEADER_H;
}

// ----------------------------------------------------------------------
// One shipment = main data row + voyage / description band
// ----------------------------------------------------------------------

function drawDataRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, DATA_ROW_H);
    let raw;
    if (col.key === 'qtyUnits') raw = formatInt(row.qtyUnits);
    else if (col.key === 'shippedCtns') raw = formatInt(row.shippedCtns);
    else raw = row[col.key];
    if (raw === undefined || raw === null) return;
    textInRect(doc, x, y, w, DATA_ROW_H, raw, {
      align: col.align,
      fontSize: 6.6,
      pad: 2,
      maxLines: 2,
    });
  });
  return y + DATA_ROW_H;
}

/**
 * Voyage band: light gray strip spanning the full table width with four chunks —
 * "Voyage" label, mode chip, voyage-name chip, and "Description : <text>" tail.
 *
 * Geometry follows the legacy print: the first chunks live above the qty / ctns
 * columns and the description fans out to the right of the M-BL column edge.
 */
function drawVoyageRow(doc, y, x0, widths, row) {
  const xs = colXs(x0, widths);
  const totalW = widths.reduce((a, b) => a + b, 0);

  fillRect(doc, x0, y, totalW, VOYAGE_ROW_H, VOYAGE_FILL);
  strokeRect(doc, x0, y, totalW, VOYAGE_ROW_H);

  /** Left split: "Voyage" label spans columns 0..(QTY_COL_IDX - 1). */
  const labelEndX = xs[QTY_COL_IDX];
  const voyageLabelX = xs[Math.max(0, QTY_COL_IDX - 2)];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('Voyage :', voyageLabelX + 3, y + VOYAGE_ROW_H / 2, {
    baseline: 'middle',
  });

  /** Mode chip (BY SEA / BY AIR) — outlined box for visual cue. */
  const modeX = labelEndX;
  const modeW = widths[QTY_COL_IDX] + widths[CTNS_COL_IDX];
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.4);
  doc.rect(modeX + 1, y + 2, modeW - 2, VOYAGE_ROW_H - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(row.voyageMode || '', modeX + modeW / 2, y + VOYAGE_ROW_H / 2, {
    align: 'center',
    baseline: 'middle',
  });

  /** Voyage-name chip — wider, aligned over the M-BL column. */
  const nameX = xs[CTNS_COL_IDX + 1];
  const nameW = widths[CTNS_COL_IDX + 1] + widths[CTNS_COL_IDX + 2];
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.4);
  doc.rect(nameX + 1, y + 2, nameW - 2, VOYAGE_ROW_H - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  textInRect(doc, nameX, y, nameW, VOYAGE_ROW_H, row.voyageName || '', {
    align: 'center',
    bold: true,
    fontSize: 7.5,
    pad: 3,
    maxLines: 1,
  });

  /** "Description : <text>" tail — fills the rest of the band. */
  const descLabelX = nameX + nameW + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 153);
  doc.text('Description :', descLabelX, y + VOYAGE_ROW_H / 2, {
    baseline: 'middle',
  });
  const descLabelW = doc.getTextWidth('Description :');
  const descX = descLabelX + descLabelW + 6;
  const descW = Math.max(50, x0 + totalW - descX - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  const descLines = doc.splitTextToSize(String(row.description || ''), descW);
  doc.text(descLines[0] || '', descX, y + VOYAGE_ROW_H / 2, {
    baseline: 'middle',
  });

  return y + VOYAGE_ROW_H;
}

// ----------------------------------------------------------------------
// Subtotal / customer-total bands
// ----------------------------------------------------------------------

function drawSubtotal(doc, y, x0, widths, subtotal) {
  const xs = colXs(x0, widths);
  const totalW = widths.reduce((a, b) => a + b, 0);

  /** Single-cell label area on the left, qty + ctns under their own columns. */
  const labelW = xs[QTY_COL_IDX] - x0;
  fillRect(doc, x0, y, labelW, SUBTOTAL_ROW_H, SUBTOTAL_FILL);
  strokeRect(doc, x0, y, labelW, SUBTOTAL_ROW_H);
  textInRect(doc, x0, y, labelW, SUBTOTAL_ROW_H, 'Shipment Total :', {
    align: 'right',
    bold: true,
    fontSize: 7.5,
    pad: 8,
  });

  const qtyW = widths[QTY_COL_IDX];
  const ctnsW = widths[CTNS_COL_IDX];
  fillRect(doc, xs[QTY_COL_IDX], y, qtyW, SUBTOTAL_ROW_H, SUBTOTAL_FILL);
  strokeRect(doc, xs[QTY_COL_IDX], y, qtyW, SUBTOTAL_ROW_H);
  textInRect(doc, xs[QTY_COL_IDX], y, qtyW, SUBTOTAL_ROW_H, formatInt(subtotal.qty), {
    align: 'right',
    bold: true,
    fontSize: 7.5,
    pad: 3,
  });
  fillRect(doc, xs[CTNS_COL_IDX], y, ctnsW, SUBTOTAL_ROW_H, SUBTOTAL_FILL);
  strokeRect(doc, xs[CTNS_COL_IDX], y, ctnsW, SUBTOTAL_ROW_H);
  textInRect(doc, xs[CTNS_COL_IDX], y, ctnsW, SUBTOTAL_ROW_H, formatInt(subtotal.ctns), {
    align: 'right',
    bold: true,
    fontSize: 7.5,
    pad: 3,
  });

  /** Right tail (after ctns column): blank gray strip. */
  const tailX = xs[CTNS_COL_IDX + 1];
  const tailW = x0 + totalW - tailX;
  fillRect(doc, tailX, y, tailW, SUBTOTAL_ROW_H, [255, 255, 255]);

  return y + SUBTOTAL_ROW_H + 1;
}

function drawCustomerTotal(doc, y, x0, widths, customer, total) {
  const xs = colXs(x0, widths);
  const totalW = widths.reduce((a, b) => a + b, 0);

  const labelW = xs[QTY_COL_IDX] - x0;
  fillRect(doc, x0, y, labelW, CUSTOMER_TOTAL_H, SUBTOTAL_FILL);
  strokeRect(doc, x0, y, labelW, CUSTOMER_TOTAL_H);
  textInRect(doc, x0, y, labelW, CUSTOMER_TOTAL_H, `${customer}   Total :`, {
    align: 'right',
    bold: true,
    fontSize: 8.5,
    pad: 8,
  });

  const qtyW = widths[QTY_COL_IDX];
  const ctnsW = widths[CTNS_COL_IDX];
  fillRect(doc, xs[QTY_COL_IDX], y, qtyW, CUSTOMER_TOTAL_H, SUBTOTAL_FILL);
  strokeRect(doc, xs[QTY_COL_IDX], y, qtyW, CUSTOMER_TOTAL_H);
  textInRect(doc, xs[QTY_COL_IDX], y, qtyW, CUSTOMER_TOTAL_H, formatInt(total.qty), {
    align: 'right',
    bold: true,
    fontSize: 8.5,
    pad: 3,
  });
  fillRect(doc, xs[CTNS_COL_IDX], y, ctnsW, CUSTOMER_TOTAL_H, SUBTOTAL_FILL);
  strokeRect(doc, xs[CTNS_COL_IDX], y, ctnsW, CUSTOMER_TOTAL_H);
  textInRect(doc, xs[CTNS_COL_IDX], y, ctnsW, CUSTOMER_TOTAL_H, formatInt(total.ctns), {
    align: 'right',
    bold: true,
    fontSize: 8.5,
    pad: 3,
  });

  const tailX = xs[CTNS_COL_IDX + 1];
  const tailW = x0 + totalW - tailX;
  fillRect(doc, tailX, y, tailW, CUSTOMER_TOTAL_H, [255, 255, 255]);

  return y + CUSTOMER_TOTAL_H + 4;
}

// ----------------------------------------------------------------------
// Footer
// ----------------------------------------------------------------------

function drawFooter(doc, pageIdx, totalPages, printedBy) {
  const fy = PAGE_H - V_MARGIN - 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Printed By :  ${printedBy || ''}`, H_MARGIN, fy, { baseline: 'bottom' });
  doc.text('AMS Confidential', PAGE_W / 2, fy, { align: 'center', baseline: 'bottom' });
  doc.text(`Page #  ${pageIdx}`, PAGE_W - H_MARGIN, fy, {
    align: 'right',
    baseline: 'bottom',
  });
}

// ----------------------------------------------------------------------
// Public builder
// ----------------------------------------------------------------------

/**
 * @param {{ printedBy?: string; groups?: Array<{ customer: string; subGroups: Array<{ rows: object[]; subtotal: { qty: number; ctns: number } }>; total: { qty: number; ctns: number } }> }} data
 * @returns {Promise<Blob>}
 */
export async function buildShipmentTrackingReportPdfBlob(data) {
  const payload =
    data && Array.isArray(data.groups) && data.groups.length > 0
      ? data
      : SHIPMENT_TRACKING_REPORT_DEMO;

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const innerLeft = H_MARGIN;
  const innerW = PAGE_W - 2 * H_MARGIN;
  const widths = colWidths(innerW);

  const pageBodyBottom = PAGE_H - V_MARGIN - FOOTER_H;
  let y = 0;

  const startPage = () => {
    y = drawPageHeader(doc, logoDataUrl);
  };

  const ensureSpace = (need) => {
    if (y + need <= pageBodyBottom) return;
    doc.addPage([PAGE_W, PAGE_H], 'l');
    startPage();
  };

  /** Re-draw the table header (and customer banner if mid-customer split). */
  const continueCustomerOnNewPage = (customer) => {
    doc.addPage([PAGE_W, PAGE_H], 'l');
    startPage();
    y = drawCustomerBand(doc, innerLeft, y, `${customer}  (continued)`);
    y = drawTableHeader(doc, y, innerLeft, widths);
  };

  startPage();

  payload.groups.forEach((group, gi) => {
    ensureSpace(CUSTOMER_BAND_H + TABLE_HEADER_H + SHIPMENT_BLOCK_H);
    y = drawCustomerBand(doc, innerLeft, y, group.customer);
    y = drawTableHeader(doc, y, innerLeft, widths);

    group.subGroups.forEach((sub) => {
      sub.rows.forEach((row) => {
        if (y + SHIPMENT_BLOCK_H > pageBodyBottom) {
          continueCustomerOnNewPage(group.customer);
        }
        y = drawDataRow(doc, y, innerLeft, widths, row);
        y = drawVoyageRow(doc, y, innerLeft, widths, row);
      });

      if (y + SUBTOTAL_ROW_H + 2 > pageBodyBottom) {
        continueCustomerOnNewPage(group.customer);
      }
      y = drawSubtotal(doc, y, innerLeft, widths, sub.subtotal);
    });

    if (y + CUSTOMER_TOTAL_H + 4 > pageBodyBottom) {
      continueCustomerOnNewPage(group.customer);
    }
    y = drawCustomerTotal(doc, y, innerLeft, widths, group.customer, group.total);

    if (gi < payload.groups.length - 1) y += 4;
  });

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, payload.printedBy);
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openShipmentTrackingReportPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Shipment-Tracking-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
