/** @typedef {Record<string, unknown>} FactoryWipApiRow */

const ALL = 'all';

export function pickField(row, ...keys) {
  if (!row || typeof row !== 'object') return '';
  for (const k of keys) {
    if (k in row && row[k] != null && String(row[k]).trim() !== '') return row[k];
  }
  const lower = {};
  for (const kk of Object.keys(row)) lower[kk.toLowerCase()] = row[kk];
  for (const k of keys) {
    const v = lower[String(k).toLowerCase()];
    if (v != null && String(v).trim() !== '') return v;
  }
  return '';
}

function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase();
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/** API keys for delay flag (exact property reads; supports numeric 0). */
const DELAY_ORDER_CHK_KEYS = [
  'DelayOrderChk',
  'delayOrderChk',
  'DELAYORDERCHK',
  'DelayOrderCHK',
  'delay_order_chk',
  'DelayOrderCheck',
  'delayOrderCheck',
];

/**
 * Raw `DelayOrderChk` from row (first defined alias). `0` is kept; `null`/`undefined`/'' skipped.
 * @param {FactoryWipApiRow} row
 * @returns {unknown}
 */
function pickFieldRawDelayOrderChk(row) {
  if (!row || typeof row !== 'object') return undefined;
  for (const k of DELAY_ORDER_CHK_KEYS) {
    if (Object.prototype.hasOwnProperty.call(row, k)) {
      const val = row[k];
      if (val !== undefined && val !== null && val !== '') return val;
    }
  }
  const lower = {};
  for (const kk of Object.keys(row)) lower[kk.toLowerCase()] = row[kk];
  for (const k of DELAY_ORDER_CHK_KEYS) {
    const lk = String(k).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(lower, lk)) {
      const val = lower[lk];
      if (val !== undefined && val !== null && val !== '') return val;
    }
  }
  return undefined;
}

/**
 * Normalize delay flag: strict `0` | `1` | `2` only (number or string). Booleans / other → `null` (default black).
 * Does not use `Number(true)` coercion.
 * @param {FactoryWipApiRow} raw
 * @returns {0 | 1 | 2 | null}
 */
export function normalizeFactoryWipDelayOrderChk(raw) {
  const v = pickFieldRawDelayOrderChk(raw);
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  if (typeof v === 'boolean') return null;

  if (typeof v === 'number' && Number.isFinite(v)) {
    const t = Math.trunc(v);
    if (t === 0 || t === 1 || t === 2) return /** @type {0 | 1 | 2} */ (t);
    return null;
  }

  const s = String(v).trim();
  if (s === '0' || s === '1' || s === '2') return /** @type {0 | 1 | 2} */ (Number(s));

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  const t = Math.trunc(n);
  if (t === 0 || t === 1 || t === 2) return /** @type {0 | 1 | 2} */ (t);
  return null;
}

/**
 * PDF / grid: red row text only when `DelayOrderChk` is exactly `1` (number or string "1").
 * `0`, `"0"`, `2`, `"2"` → black. Missing / unknown → black (default).
 */
export function isFactoryWipPdfDelayedByDelayOrderChk(raw) {
  return normalizeFactoryWipDelayOrderChk(raw) === 1;
}

/** DEV: log delay flag + shipment fields for every mapped row. */
export function logFactoryWipDelayDebugRow(raw, rowIndex = 0) {
  if (!import.meta.env.DEV) return;
  const chkRaw = pickFieldRawDelayOrderChk(raw);
  const chkNorm = normalizeFactoryWipDelayOrderChk(raw);
  const shipment = pickField(
    raw,
    'ShipmentDate',
    'shipmentDate',
    'DisplayShipmentDate',
    'displayShipmentDate'
  );
  const revised = pickField(
    raw,
    'RevisedShipmentDate',
    'revisedShipmentDate',
    'RevShipmentDate',
    'revShipmentDate',
    'DisplayRevisedShipmentDate',
    'displayRevisedShipmentDate',
    'NewShipmentDate',
    'newShipmentDate'
  );
  // eslint-disable-next-line no-console
  console.log(`[Factory WIP row ${rowIndex + 1}]`, {
    DelayOrderChk: chkRaw,
    DelayOrderChk_normalized: chkNorm,
    ShipmentDate: shipment === '' ? '—' : shipment,
    RevisedShipmentDate: revised === '' ? '—' : revised,
    delayedRed: chkNorm === 1,
  });
}

/** Parse API date values (comparison). */
export function parseFactoryWipDate(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (us) {
    let y = Number(us[3]);
    if (y < 100) y += 2000;
    const mm = Number(us[1]);
    const dd = Number(us[2]);
    const d = new Date(Date.UTC(y, mm - 1, dd, 12, 0, 0));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Display-friendly date for grid / PDF. */
export function formatFactoryWipDisplayDate(value) {
  if (value == null || value === '') return '—';
  const d = parseFactoryWipDate(value);
  if (!d) return String(value);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTHS[d.getUTCMonth()] ?? '';
  const yyyy = d.getUTCFullYear();
  return `${dd}-${mon}-${yyyy}`;
}

/** Same order as factory-wip-pdf-export milestone quantity columns (12 cells). */
const STATUS_NUM_KEY_GROUPS = [
  ['LabDip', 'Lab Dip', 'Lab_DIP', 'Labdip'],
  ['ProtoFIT', 'ProtoFit', 'FIT', 'Proto', 'Proto_FIT'],
  ['DyeLotBlanket', 'Dye Lot/Blanket', 'DyeLot', 'Dye_Lot'],
  ['PrintEmbStrikeoff', 'PrintEmb', 'Print / Emb', 'PrintEmbStrikeOff', 'PrintStrikeOff'],
  ['PPSample', 'PP', 'PP Sample', 'PPSampletoBuyer'],
  ['Knitting', 'KnittingFabric', 'KnittingFabricInhouse', 'FabricInhouse'],
  ['Dying', 'Dyeing', 'dying', 'dyeing'],
  ['CuttingPCS', 'Cutting', 'Cutting_PCS', 'CuttingPcs'],
  ['PrintEmbPCS', 'PrintEmbPcs', 'PrintEmb_PCS'],
  ['StitchingPCS', 'Stitching', 'Stitching_PCS', 'StitchingPcs'],
  ['GarmentWash', 'Garment Wash', 'Washing', 'Garment_Wash'],
  ['PackingPCS', 'Packing', 'Packing_PCS', 'PackingPcs'],
];

/** MM/DD/YYYY for PDF milestone cells (reference layout). */
function formatPdfMilestoneDate(value) {
  if (value == null || value === '') return 'N/A';
  const d = parseFactoryWipDate(value);
  if (!d) return String(value).trim() || 'N/A';
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * API keys per milestone PDF column (order = Lab Dip … Packing PCS).
 * `pickField` resolves case-insensitive matches on the row.
 */
const MILESTONE_PDF_FIELD_SPECS = [
  {
    target: ['LabDipTargetDate', 'LabDipTarget', 'labDipTargetDate'],
    submission: ['LabDipSubmissionDate', 'LabDipSubmission', 'labDipSubmissionDate'],
    approval: ['LabDipApprovalDate', 'LabDipApproval', 'labDipApprovalDate'],
    status: ['LabDipStatus', 'LabDipDone', 'labDipStatus'],
    remarks: ['LabDipRemarks', 'LabDipRemark', 'labDipRemarks'],
    qty: ['LabDipQtyCompleted', 'LabDipQty', 'LabDipCompletedQty'],
  },
  {
    target: ['FitTargetDate', 'ProtoFITTargetDate', 'ProtoTargetDate', 'FITTargetDate'],
    submission: ['FitSubmissionDate', 'ProtoFITSubmissionDate', 'ProtoSubmissionDate', 'FITSubmissionDate'],
    approval: ['FitApprovalDate', 'ProtoFITApprovalDate', 'ProtoApprovalDate', 'FITApprovalDate'],
    status: ['FitStatus', 'ProtoFITStatus', 'FITStatus', 'ProtoStatus', 'ProtoFIT', 'Proto', 'FIT'],
    remarks: ['FitRemarks', 'ProtoFITRemarks'],
    qty: ['FitQtyCompleted', 'ProtoFITQtyCompleted', 'FITQty', 'ProtoFITQty'],
  },
  {
    target: ['DyeLotTargetDate', 'DyeLotBlanketTargetDate', 'DyeLot_TargetDate'],
    submission: ['DyeLotSubmissionDate', 'DyeLotBlanketSubmissionDate'],
    approval: ['DyeLotApprovalDate', 'DyeLotBlanketApprovalDate'],
    status: ['DyeLotStatus', 'DyeLotBlanketStatus', 'DyeLotBlanket', 'DyeLot'],
    remarks: ['DyeLotRemarks', 'DyeLotBlanketRemarks'],
    qty: ['DyeLotQtyCompleted', 'DyeLotBlanketQtyCompleted', 'DyeLotCompletedQty'],
  },
  {
    target: ['PrintEmbTargetDate', 'PrintStrikeOffTargetDate', 'PrintEmbStrikeoffTargetDate', 'PrintEmbStrikeOffTargetDate'],
    submission: ['PrintEmbSubmissionDate', 'PrintStrikeOffSubmissionDate', 'PrintEmbStrikeoffSubmissionDate'],
    approval: ['PrintEmbApprovalDate', 'PrintStrikeOffApprovalDate', 'PrintEmbStrikeoffApprovalDate'],
    status: ['PrintEmbStatus', 'PrintStrikeOffStatus', 'PrintEmbStrikeoffStatus', 'PrintEmbStrikeoff', 'PrintEmb'],
    remarks: ['PrintEmbRemarks', 'PrintStrikeOffRemarks', 'PrintEmbStrikeoffRemarks'],
    qty: ['PrintEmbQtyCompleted', 'PrintEmbStrikeoffQtyCompleted', 'PrintEmbCompletedQty'],
  },
  {
    target: ['PPTargetDate', 'PPSampleTargetDate', 'PP_TargetDate'],
    submission: ['PPSubmissionDate', 'PPSampleSubmissionDate', 'PP_SubmissionDate'],
    approval: ['PPApprovalDate', 'PPSampleApprovalDate', 'PP_ApprovalDate'],
    status: ['PPStatus', 'PPSampleStatus', 'PP', 'PPSample'],
    remarks: ['PPRemarks', 'PPSampleRemarks'],
    qty: ['PPQtyCompleted', 'PPSampleQtyCompleted', 'PPCompletedQty'],
  },
  {
    target: ['KnittingTargetDate', 'KnittingFabricTargetDate', 'KnittingFabricInhouseTargetDate'],
    submission: ['KnittingSubmissionDate', 'KnittingFabricSubmissionDate', 'FabricInhouseSubmissionDate'],
    approval: ['KnittingApprovalDate', 'KnittingFabricApprovalDate', 'FabricInhouseApprovalDate'],
    status: ['KnittingStatus', 'KnittingFabricStatus', 'FabricInhouseStatus', 'Knitting', 'KnittingFabric'],
    remarks: ['KnittingRemarks', 'KnittingFabricRemarks'],
    qty: ['KnittingQtyCompleted', 'KnittingFabricQtyCompleted', 'KnittingCompletedQty'],
  },
  {
    target: ['DyingTargetDate', 'DyeingTargetDate'],
    submission: ['DyingSubmissionDate', 'DyeingSubmissionDate'],
    approval: ['DyingApprovalDate', 'DyeingApprovalDate'],
    status: ['DyingStatus', 'DyeingStatus', 'Dying', 'Dyeing'],
    remarks: ['DyingRemarks', 'DyeingRemarks'],
    qty: ['DyingQtyCompleted', 'DyeingQtyCompleted', 'DyingCompletedQty'],
  },
  {
    target: ['CuttingTargetDate', 'CuttingPCSTargetDate', 'Cutting_TargetDate'],
    submission: ['CuttingSubmissionDate', 'CuttingPCSSubmissionDate'],
    approval: ['CuttingApprovalDate', 'CuttingPCSApprovalDate'],
    status: ['CuttingStatus', 'CuttingPCSStatus', 'Cutting', 'CuttingPCS'],
    remarks: ['CuttingRemarks', 'CuttingPCSRemarks'],
    qty: ['CuttingQtyCompleted', 'CuttingPCSQtyCompleted', 'CuttingCompletedQty'],
  },
  {
    target: ['PrintEmbPCSTargetDate', 'PrintEmbPcsTargetDate', 'PrintEmbPCS_TargetDate'],
    submission: ['PrintEmbPCSSubmissionDate', 'PrintEmbPcsSubmissionDate'],
    approval: ['PrintEmbPCSApprovalDate', 'PrintEmbPcsApprovalDate'],
    status: ['PrintEmbPCSStatus', 'PrintEmbPcsStatus', 'PrintEmbPCS', 'PrintEmbPcs'],
    remarks: ['PrintEmbPCSRemarks', 'PrintEmbPcsRemarks'],
    qty: ['PrintEmbPCSQtyCompleted', 'PrintEmbPcsQtyCompleted', 'PrintEmbPCSCompletedQty'],
  },
  {
    target: ['StitchingTargetDate', 'StitchingPCSTargetDate'],
    submission: ['StitchingSubmissionDate', 'StitchingPCSSubmissionDate'],
    approval: ['StitchingApprovalDate', 'StitchingPCSApprovalDate'],
    status: ['StitchingStatus', 'StitchingPCSStatus', 'Stitching', 'StitchingPCS'],
    remarks: ['StitchingRemarks', 'StitchingPCSRemarks'],
    qty: ['StitchingQtyCompleted', 'StitchingPCSQtyCompleted', 'StitchingCompletedQty'],
  },
  {
    target: ['GarmentWashTargetDate', 'GarmentWashPCSTargetDate', 'WashingTargetDate'],
    submission: ['GarmentWashSubmissionDate', 'GarmentWashPCSSubmissionDate', 'WashingSubmissionDate'],
    approval: ['GarmentWashApprovalDate', 'GarmentWashPCSApprovalDate', 'WashingApprovalDate'],
    status: ['GarmentWashStatus', 'GarmentWashPCSStatus', 'WashingStatus', 'GarmentWash', 'Washing'],
    remarks: ['GarmentWashRemarks', 'GarmentWashPCSRemarks', 'WashingRemarks'],
    qty: ['GarmentWashQtyCompleted', 'GarmentWashPCSQtyCompleted', 'GarmentWashCompletedQty'],
  },
  {
    target: ['PackingTargetDate', 'PackingPCSTargetDate'],
    submission: ['PackingSubmissionDate', 'PackingPCSSubmissionDate'],
    approval: ['PackingApprovalDate', 'PackingPCSApprovalDate'],
    status: ['PackingStatus', 'PackingPCSStatus', 'Packing', 'PackingPCS'],
    remarks: ['PackingRemarks', 'PackingPCSRemarks'],
    qty: ['PackingQtyCompleted', 'PackingPCSQtyCompleted', 'PackingCompletedQty'],
  },
];

/**
 * @param {FactoryWipApiRow} raw
 * @param {number} colIndex 0..11
 * @param {number} numFallback qty from legacy numeric column when no QtyCompleted text
 * @returns {string[]}
 */
function buildMilestoneCellLines(raw, colIndex, numFallback) {
  const spec = MILESTONE_PDF_FIELD_SPECS[colIndex];
  if (!spec) return ['Not Required'];
  const tgt = pickField(raw, ...spec.target);
  const sub = pickField(raw, ...spec.submission);
  const app = pickField(raw, ...spec.approval);
  const st = pickField(raw, ...spec.status);
  const rem = pickField(raw, ...spec.remarks);
  const qtyRaw = pickField(raw, ...spec.qty);

  const hasDetail = [tgt, sub, app, st, rem, qtyRaw].some((v) => v != null && String(v).trim() !== '');
  const hasNum = Number.isFinite(numFallback) && numFallback !== 0;
  if (!hasDetail && !hasNum) return ['Not Required'];

  const lines = [
    'Target Date',
    formatPdfMilestoneDate(tgt),
    'Submission',
    formatPdfMilestoneDate(sub),
    'Approval',
    formatPdfMilestoneDate(app),
  ];
  if (rem != null && String(rem).trim() !== '') {
    lines.push('Remarks');
    lines.push(String(rem).trim());
  }
  if (qtyRaw != null && String(qtyRaw).trim() !== '') {
    lines.push('Qty');
    lines.push(String(qtyRaw).trim());
  } else if (hasNum) {
    lines.push('Qty');
    lines.push(String(numFallback));
  }
  const stTrim = st != null ? String(st).trim() : '';
  lines.push(stTrim || 'Done');
  return lines;
}

/** Production status column: FRI + remarks + generic status (multi-line). */
function productionStatusLinesFromRow(raw) {
  const out = [];
  const fri = pickField(raw, 'FRIStatus', 'friStatus', 'FRI_STATUS');
  if (fri != null && String(fri).trim() !== '') out.push(String(fri).trim());
  const friRem = pickField(raw, 'FRIRemarks', 'friRemarks', 'FRI_Remarks');
  if (friRem != null && String(friRem).trim() !== '') {
    String(friRem)
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => out.push(l));
  }
  const prod = pickField(raw, 'ProductionStatus', 'productionStatus', 'ProdStatus', 'Status');
  if (prod != null && String(prod).trim() !== '' && !out.includes(String(prod).trim())) {
    String(prod)
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => out.push(l));
  }
  if (out.length === 0) return ['N/A'];
  return out;
}

function statusNumsFromRow(row) {
  return STATUS_NUM_KEY_GROUPS.map((keys) => {
    const v = toNum(pickField(row, ...keys));
    return Number.isFinite(v) ? v : 0;
  });
}

function linesPoStyleProd(row) {
  const po = pickField(row, 'PONo', 'PoNo', 'pono', 'PO', 'po', 'PoNum');
  const style = pickField(row, 'StyleNo', 'styleNo', 'Style', 'style', 'StyleCode', 'LRCode', 'lrCode');
  const prod = pickField(row, 'ProdCode', 'prodCode', 'ProductCode', 'productCode', 'NA', 'na');
  return [String(po || '—'), String(style || 'NA'), String(prod || 'NA')];
}

function linesFabricContentGsm(row) {
  const a = pickField(row, 'Fabric', 'fabric', 'FabricName');
  const b = pickField(row, 'Content', 'content', 'FabricContent', 'fabricContent');
  const c = pickField(row, 'GSM', 'gsm', 'Gsm');
  return [String(a || '—'), String(b || '—'), String(c || '—')];
}

function linesItemDesc(row) {
  const a = pickField(row, 'ItemCategory', 'itemCategory', 'Gender', 'gender');
  const b = pickField(row, 'ItemDescription', 'itemDescription', 'Description', 'description');
  return [String(a || '—'), String(b || '—')];
}

function colorQtyLine(row) {
  const c = pickField(row, 'Color', 'color', 'Colorway', 'colorway', 'ColorQty', 'Color_QTY');
  const q = pickField(row, 'ColorQTY', 'ColorQty', 'colorQty', 'Qty', 'qty');
  if (c && q) return `${c} (${q})`;
  if (c) return String(c);
  if (q) return String(q);
  return '—';
}

/**
 * Build a browser-safe data URL for jsPDF `addImage` from API `POImage` (raw base64 or full data URL).
 * @param {FactoryWipApiRow} raw
 * @returns {string | null}
 */
export function normalizeFactoryWipPoImageDataUrl(raw) {
  const v0 = pickField(raw, 'POImage', 'poImage', 'PoImage', 'PO_IMAGE', 'po_image');
  if (v0 == null || v0 === '') return null;
  const t = typeof v0 === 'string' ? v0.trim() : String(v0).trim();
  if (!t) return null;
  if (/^data:image\//i.test(t)) return t;
  const b64 = t.replace(/\s+/g, '');
  if (b64.length < 24) return null;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(b64)) return null;
  if (b64.startsWith('iVBOR')) return `data:image/png;base64,${b64}`;
  if (b64.startsWith('/9j')) return `data:image/jpeg;base64,${b64}`;
  if (b64.startsWith('R0lGOD')) return `data:image/gif;base64,${b64}`;
  if (b64.startsWith('UklGR')) return `data:image/webp;base64,${b64}`;
  return `data:image/jpeg;base64,${b64}`;
}

/**
 * Row shape expected by `buildFactoryWipPdfBlobFromRows`.
 * @param {FactoryWipApiRow} raw
 * @returns {object}
 */
export function mapApiRowToFactoryWipPdfRow(raw, rowIndex = 0) {
  const poImageDataUrl = normalizeFactoryWipPoImageDataUrl(raw);
  const delayed = isFactoryWipPdfDelayedByDelayOrderChk(raw);
  logFactoryWipDelayDebugRow(raw, rowIndex);
  const rgb = delayed ? [200, 0, 0] : [0, 0, 0];
  const poQty = toNum(pickField(raw, 'POQty', 'poQty', 'PoQty', 'BookedQuantity', 'bookedQuantity'));
  const shipQty = toNum(pickField(raw, 'ShipQty', 'shipQty', 'ShipmentQty', 'shipmentQty'));
  const balQty = toNum(pickField(raw, 'BalQty', 'balQty', 'BalanceQty', 'balanceQty'));

  const ship = pickField(
    raw,
    'ShipmentDate',
    'shipmentDate',
    'DisplayShipmentDate',
    'displayShipmentDate'
  );
  const mosRaw = pickField(
    raw,
    'MOS',
    'Mos',
    'mos',
    'MOSName',
    'mosName',
    'MOS_Desc',
    'MOSDesc',
    'mosDesc',
    'ModeOfShipment',
    'modeOfShipment',
    'MODEOFSHIPMENT',
    'Mode_Of_Shipment',
    'mode_of_shipment',
    'ShipmentMode',
    'shipmentMode',
    'SHIPMENTMODE',
    'Shipment_Mode',
    'ShipmentMOS',
    'shipmentMOS',
    'ShipMode',
    'shipMode',
    'SHIP_MODE',
    'Ship_Via',
    'ShipVia',
    'shipVia',
    'ShippingMode',
    'shippingMode',
    'TransportMode',
    'transportMode',
    'FreightMode',
    'freightMode',
    'Incoterms',
    'incoterms',
    'Carrier',
    'carrier',
    'Vessel',
    'vessel'
  );
  const mosStr = mosRaw != null && String(mosRaw).trim() !== '' ? String(mosRaw).trim() : '';
  const mos = mosStr !== '' ? mosStr : 'N/A';

  const statusNums = statusNumsFromRow(raw);
  const statusCellLines = statusNums.map((n, idx) => buildMilestoneCellLines(raw, idx, n));
  const productionStatusLines = productionStatusLinesFromRow(raw);

  return {
    imageKind: poImageDataUrl ? 'poImage' : 'none',
    poImageDataUrl,
    poLines: linesPoStyleProd(raw),
    poQty: Number.isFinite(poQty) ? poQty : '',
    shipQty: Number.isFinite(shipQty) ? shipQty : '',
    balQty: Number.isFinite(balQty) ? balQty : '',
    shipment: formatFactoryWipDisplayDate(ship),
    mos: mos || '—',
    fabricLines: linesFabricContentGsm(raw),
    itemLines: linesItemDesc(raw),
    colorQty: colorQtyLine(raw),
    statusNums,
    statusCellLines,
    productionStatusLines,
    productionStatus: productionStatusLines.join('\n'),
    _pdfTextRgb: rgb,
  };
}

/**
 * @param {FactoryWipApiRow[]} rows
 * @param {object} filters — expects `poScope`; labels passed via `resolved`
 * @param {{ customerLabel?: string; supplierLabel?: string; merchandiserLabel?: string }} [resolved] — display labels from milestone dropdown rows
 * @returns {FactoryWipApiRow[]}
 */
export function filterFactoryWipRowsByUiFilters(rows, filters, resolved = {}) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return list;

  const customerLabel = String(resolved.customerLabel || '').trim();
  const supplierLabel = String(resolved.supplierLabel || '').trim();
  const merchandiserLabel = String(resolved.merchandiserLabel || '').trim();

  if (!customerLabel && !supplierLabel && !merchandiserLabel && (filters?.poScope === ALL || !filters?.poScope)) {
    return list;
  }

  return list.filter((r) => {
    if (customerLabel) {
      const v = pickField(r, 'customername', 'CustomerName', 'customerName', 'BuyerName');
      if (norm(v) !== norm(customerLabel)) return false;
    }
    if (supplierLabel) {
      const v = pickField(
        r,
        'vendername',
        'VenderName',
        'SupplierName',
        'supplierName',
        'VendorName',
        'vendorName'
      );
      if (norm(v) !== norm(supplierLabel)) return false;
    }
    if (merchandiserLabel) {
      const v = pickField(r, 'username', 'UserName', 'userName', 'MerchandiserName', 'merchandiserName');
      if (norm(v) !== norm(merchandiserLabel)) return false;
    }
    if (filters?.poScope && filters.poScope !== ALL) {
      const po = String(pickField(r, 'PONo', 'PoNo', 'pono', 'PO', 'po') || '');
      if (norm(po) !== norm(String(filters.poScope))) return false;
    }
    return true;
  });
}
