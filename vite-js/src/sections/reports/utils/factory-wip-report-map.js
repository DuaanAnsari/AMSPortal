import { buildWipColorQtyLines } from './wip-color-qty-normalize';

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

/** True when milestone PDF date input should render blank (null / empty / status-only). */
function isBlankWipMilestonePdfDateInput(value) {
  if (value == null || value === undefined) return true;
  if (typeof value === 'number' && value === 0) return true;
  const s = String(value).trim();
  if (!s) return true;
  const lower = s.toLowerCase();
  if (
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === '-' ||
    lower === '—' ||
    lower === '0' ||
    lower === 'not required'
  ) {
    return true;
  }
  if (/^\d+\s*%\s*(?:ES\s*)?[:\-]?\s*$/i.test(s)) return true;
  return false;
}

/**
 * Strip combined milestone status prefix (`0% ES: 12/06/2026`) — date token only.
 * @returns {string | null} date token or null when status-only / blank
 */
function extractWipMilestoneDateToken(value) {
  if (isBlankWipMilestonePdfDateInput(value)) return null;
  const s = String(value).trim();
  const combined = /^(\d+\s*%)\s*(?:ES\s*[:\-]?\s*)?(.*)$/i.exec(s);
  if (combined) {
    const datePart = (combined[2] || '').trim().replace(/^ES\s*[:\-]?\s*/i, '').trim();
    if (!datePart || isBlankWipMilestonePdfDateInput(datePart)) return null;
    return datePart;
  }
  return s;
}

/**
 * Strict milestone PDF date parse — no loose `new Date(string)` (avoids partial dates → today).
 * @returns {Date | null}
 */
function parseWipMilestonePdfDate(value) {
  const token = extractWipMilestoneDateToken(value);
  if (token == null) return null;

  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 1901) return null;
    return d;
  }

  const s = String(token).trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/.exec(s);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 1901) return null;
    return d;
  }

  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (us) {
    let y = Number(us[3]);
    if (y < 100) y += 2000;
    if (y < 1901) return null;
    const mm = Number(us[1]);
    const dd = Number(us[2]);
    const d = new Date(Date.UTC(y, mm - 1, dd, 12, 0, 0));
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  const dmy = /^(\d{1,2})[\s\-/]+([A-Za-z]{3,9})[\s\-/]+(\d{2,4})$/.exec(s);
  if (dmy) {
    const monIdx = MONTHS.findIndex((m) => m.toLowerCase() === dmy[2].slice(0, 3).toLowerCase());
    if (monIdx < 0) return null;
    let y = Number(dmy[3]);
    if (y < 100) y += 2000;
    if (y < 1901) return null;
    const dd = Number(dmy[1]);
    const d = new Date(Date.UTC(y, monIdx, dd, 12, 0, 0));
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  return null;
}

/** MM/DD/YYYY for PDF milestone cells — blank when API date is null / empty / unparseable. */
function formatPdfMilestoneDate(value) {
  if (isBlankWipMilestonePdfDateInput(value)) return '';
  const d = parseWipMilestonePdfDate(value);
  if (!d) return '';
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
    remarks: ['ProtoFitRemarks', 'FitRemarks', 'ProtoFITRemarks'],
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
    remarks: ['PPSampleRemarks', 'PPRemarks'],
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
    target: [
      'PrintEmbPCSTargetDate',
      'PrintEmbPcsTargetDate',
      'PrintEmbPCS_TargetDate',
      'PrintEmbStrikeOffTargetDate',
      'PrintEmbStrikeoffTargetDate',
    ],
    submission: [
      'PrintEmbPCSSubmissionDate',
      'PrintEmbPcsSubmissionDate',
      'PrintEmbStrikeOffSubmissionDate',
      'PrintEmbStrikeoffSubmissionDate',
    ],
    approval: [
      'PrintEmbPCSApprovalDate',
      'PrintEmbPcsApprovalDate',
      'PrintEmbStrikeOffApprovalDate',
      'PrintEmbStrikeoffApprovalDate',
    ],
    status: [
      'PrintEmbPCSStatus',
      'PrintEmbPcsStatus',
      'PrintEmbPCS',
      'PrintEmbPcs',
      'PrintEmbStrikeOffStatus',
      'PrintEmbStrikeoffStatus',
    ],
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
    remarks: ['PackingPCSRemarks', 'PackingRemarks'],
    qty: ['PackingQtyCompleted', 'PackingPCSQtyCompleted', 'PackingCompletedQty'],
  },
];

/**
 * Units field aliases per milestone PDF column (same order / prefix convention as
 * `MILESTONE_PDF_FIELD_SPECS`). Resolved case-insensitively by `pickField`.
 */
const MILESTONE_PDF_UNIT_FIELD_GROUPS = [
  ['LabDipUnits', 'LabDipUnit', 'LabDipQtyUnit', 'LabDipUOM'],
  ['FitUnits', 'ProtoFITUnits', 'FITUnits', 'ProtoFITUnit', 'FitUnit'],
  ['DyeLotUnits', 'DyeLotBlanketUnits', 'DyeLotUnit'],
  ['PrintEmbUnits', 'PrintEmbStrikeoffUnits', 'PrintStrikeOffUnits', 'PrintEmbUnit'],
  ['PPUnits', 'PPSampleUnits', 'PPUnit'],
  ['KnittingUnits', 'KnittingFabricUnits', 'FabricInhouseUnits', 'KnittingUnit'],
  ['DyingUnits', 'DyeingUnits', 'DyingUnit'],
  ['CuttingUnits', 'CuttingPCSUnits', 'CuttingUnit'],
  ['PrintEmbPCSUnits', 'PrintEmbPcsUnits', 'PrintEmbPCSUnit'],
  ['StitchingUnits', 'StitchingPCSUnits', 'StitchingUnit'],
  ['GarmentWashUnits', 'GarmentWashPCSUnits', 'WashingUnits', 'GarmentWashUnit'],
  ['PackingUnits', 'PackingPCSUnits', 'PackingUnit'],
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

  const sub = pickField(raw, ...spec.submission);
  if (isBlankWipMilestonePdfDateInput(sub)) {
    return ['0'];
  }

  const tgt = pickField(raw, ...spec.target);
  const app = pickField(raw, ...spec.approval);
  const rem = pickField(raw, ...spec.remarks);
  const qtyRaw = pickField(raw, ...spec.qty);
  const unitsRaw = pickField(raw, ...(MILESTONE_PDF_UNIT_FIELD_GROUPS[colIndex] || []));
  const unitStr = unitsRaw != null && String(unitsRaw).trim() !== '' ? String(unitsRaw).trim() : '';
  const hasNum = Number.isFinite(numFallback) && numFallback !== 0;

  // Only emit a date line (with its label) when the API actually returned that
  // date. No hardcoded/placeholder labels or repeated default dates.
  const lines = [];
  const tDate = formatPdfMilestoneDate(tgt);
  if (tDate) {
    lines.push('Target Date');
    lines.push(tDate);
  }
  const sDate = formatPdfMilestoneDate(sub);
  if (sDate) {
    lines.push('Submission');
    lines.push(sDate);
  }
  // Qty: actual API value when present, otherwise 0.
  lines.push('Qty');
  if (qtyRaw != null && String(qtyRaw).trim() !== '') {
    const qtyVal = String(qtyRaw).trim();
    lines.push(unitStr ? `${qtyVal} ${unitStr}` : qtyVal);
  } else if (hasNum) {
    lines.push(unitStr ? `${numFallback} ${unitStr}` : String(numFallback));
  } else {
    lines.push('0');
  }
  // Any milestone's Approval Date may arrive from the API as the literal string
  // "N/A" — show that "N/A" as-is. A valid date keeps the existing formatting.
  // (Applies only to the Approval line; target/submission are unaffected.)
  const appIsNa = app != null && String(app).trim().toLowerCase() === 'n/a';
  const aDate = appIsNa ? 'N/A' : formatPdfMilestoneDate(app);
  if (aDate) {
    lines.push('Approval');
    lines.push(aDate);
  }
  // Footer slot (was Status): show XXXRemarks only — blank when empty; never show XXXStatus.
  const remTrim = rem != null ? String(rem).trim() : '';
  lines.push(remTrim);
  return lines;
}

/** Combined milestone PDF columns (Lab Dip … Packing PCS). */
export const WIP_MILESTONE_PDF_COLUMN_COUNT = 12;

/** Production status: `remarksmaster` + optional `PrintEmbStrikeOffremarksmaster` (never Status). */
function productionStatusPartsFromRow(raw) {
  const main = [];
  const rm = pickField(raw, 'remarksmaster', 'RemarksMaster', 'remarksMaster', 'remarks_master');
  if (rm != null && String(rm).trim() !== '') {
    main.push(
      ...String(rm)
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    );
  }

  const printEmb = [];
  const printEmbRm = pickField(
    raw,
    'PrintEmbStrikeOffremarksmaster',
    'PrintEmbStrikeoffremarksmaster',
    'printEmbStrikeOffremarksmaster'
  );
  if (printEmbRm != null && String(printEmbRm).trim() !== '') {
    printEmb.push(
      ...String(printEmbRm)
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    );
  }

  if (!main.length && !printEmb.length) {
    return { productionStatusLines: ['N/A'], printEmbStrikeOffRemarksLines: [] };
  }
  return { productionStatusLines: main, printEmbStrikeOffRemarksLines: printEmb };
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

/** Fabric / Content / GSM — API: `Fabric`, `OtherFabric`, `RibGSM` (legacy aliases as fallbacks). */
function fabricContentGsmLine(raw, ...keys) {
  const v = pickField(raw, ...keys);
  if (v == null || v === '') return '—';
  const s = String(v).trim();
  return s || '—';
}

function linesFabricContentGsm(row) {
  return [
    fabricContentGsmLine(row, 'Fabric', 'fabric', 'FabricName', 'fabricName'),
    fabricContentGsmLine(row, 'OtherFabric', 'otherFabric', 'Content', 'content', 'FabricContent', 'fabricContent'),
    fabricContentGsmLine(row, 'RibGSM', 'ribGSM', 'ribGsm', 'RibGsm', 'GSM', 'gsm', 'Gsm'),
  ];
}

function itemDescriptionLine(raw, ...keys) {
  const v = pickField(raw, ...keys);
  if (v == null || v === '') return null;
  const s = String(v).trim();
  return s || null;
}

/** Item Description cell — API: `ItemDescription`, `ItemDescriptionShippingInvoice` (stacked lines). */
function linesItemDesc(row) {
  const lines = [];
  const desc = itemDescriptionLine(
    row,
    'ItemDescription',
    'itemDescription',
    'Description',
    'description'
  );
  const shippingInvoice = itemDescriptionLine(
    row,
    'ItemDescriptionShippingInvoice',
    'itemDescriptionShippingInvoice',
    'ItemDescription_ShippingInvoice',
    'ShippingInvoiceItemDescription',
    'shippingInvoiceItemDescription'
  );
  if (desc) lines.push(desc);
  if (shippingInvoice) lines.push(shippingInvoice);
  if (lines.length === 0) return ['—'];
  return lines;
}

function colorQtyLine(row) {
  return buildWipColorQtyLines(row, pickField);
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
  const shipQty = toNum(
    pickField(raw, 'ShipQty', 'shipQty', 'ShippedQty', 'shippedQty', 'ShipmentQty', 'shipmentQty')
  );
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
    'ShipmentModeName',
    'shipmentModeName',
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
  const { productionStatusLines, printEmbStrikeOffRemarksLines } = productionStatusPartsFromRow(raw);
  const productionStatusJoined = [...productionStatusLines, ...printEmbStrikeOffRemarksLines]
    .filter((l) => l != null && String(l).trim() !== '')
    .join('\n');

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
    colorQtyLines: colorQtyLine(raw),
    colorQty: colorQtyLine(raw).join('\n'),
    statusNums,
    statusCellLines,
    productionStatusLines,
    printEmbStrikeOffRemarksLines,
    productionStatus: productionStatusJoined || 'N/A',
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
