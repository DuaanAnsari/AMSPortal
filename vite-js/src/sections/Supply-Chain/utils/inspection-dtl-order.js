import {
  sortGarmentSizeMatrixColumns,
  sortItemsByGarmentSizeLabel,
} from './garment-size-order';

/** Legacy grid always has 12 size slots (Size1…Size12) + Total — must match API QDInspectionDtl. */
export const INSPECTION_DTL_SIZE_SLOTS = 12;

/**
 * Same order as API `QdQualityDeptInspectionDtlSchema.RowTypeOrder` — used when API omits row-type order.
 */
export const QD_INSPECTION_DTL_ROW_TYPES_FALLBACK = [
  'SIZE',
  'ORDER QTY',
  'OFFER QTY',
  'FABRIC IN HOUSE',
  'CUT QTY',
  'IN-LINE',
  'OFF-LINE',
  'QTY PACKED PCS / SET',
  'QTY PACKED CARTON',
  'QTY INSPECTED CARTON',
  'QTY BALANCE/EXTRA',
];

const SEQUENCE_FIELD_KEYS = [
  'sequenceNo',
  'SequenceNo',
  'srNo',
  'SrNo',
  'sNo',
  'SNo',
  'sortOrder',
  'SortOrder',
  'rowOrder',
  'RowOrder',
  'displayOrder',
  'DisplayOrder',
];

function getInspectionDtlCellValue(row, slot1To12) {
  if (!row || !slot1To12) return '';
  const k = `size${slot1To12}`;
  const pascal = `Size${slot1To12}`;
  for (const key of [k, pascal]) {
    const v = row[key];
    if (v === 0 || v === '0') return '0';
    if (v != null && String(v).trim() !== '') return String(v);
  }
  return '';
}

function isEmptySizeLabel(label) {
  const s = String(label ?? '').trim();
  return !s || s === '0' || s === '0.0000';
}

/**
 * Stable sequence key: SequenceNo / SrNo / SortOrder / CreatedDate / row id / original index.
 * @param {object} record
 * @param {number} index
 * @returns {number}
 */
export function getInspectionRecordSequenceKey(record, index = 0) {
  if (!record || typeof record !== 'object') return index;

  for (const key of SEQUENCE_FIELD_KEYS) {
    if (!(key in record)) continue;
    const raw = record[key];
    if (raw == null || raw === '') continue;
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }

  const id =
    record.qdInspectionDtlId ??
    record.QDInspectionDtlID ??
    record.qdInspectionDtlID ??
    record.qdInsDiscrepanicesDtlId ??
    record.QDInsDiscrepanicesDtlID;
  if (id != null && id !== '') {
    const n = Number(id);
    if (Number.isFinite(n)) return n;
  }

  const created = record.createdDate ?? record.CreatedDate;
  if (created) {
    const t = new Date(created).getTime();
    if (Number.isFinite(t)) return t;
  }

  return index;
}

/** Preserve DB / entry order; never shuffle equal keys. */
export function sortRecordsBySequence(records) {
  if (!Array.isArray(records) || records.length <= 1) return records ? [...records] : [];
  return records
    .map((record, index) => ({ record, index }))
    .sort((a, b) => {
      const diff = getInspectionRecordSequenceKey(a.record, a.index) - getInspectionRecordSequenceKey(b.record, b.index);
      if (diff !== 0) return diff;
      return a.index - b.index;
    })
    .map(({ record }) => record);
}

/** Row-type order from API metadata, else from sequenced inspection rows, else legacy fallback. */
export function resolveInspectionDtlRowTypeOrder(data, fallback = QD_INSPECTION_DTL_ROW_TYPES_FALLBACK) {
  const fromApi =
    data?.inspectionDtlRowTypes ??
    data?.InspectionDtlRowTypes ??
    data?.rowTypeOrder ??
    data?.RowTypeOrder;

  if (Array.isArray(fromApi) && fromApi.length > 0) {
    const order = fromApi.map((t) => String(t ?? '').trim()).filter(Boolean);
    if (order.length > 0) return appendMissingRowTypes(order, fallback);
  }

  const apiRows = data?.inspectionDtlRows ?? data?.InspectionDtlRows ?? [];
  if (Array.isArray(apiRows) && apiRows.length > 0) {
    const order = [];
    sortRecordsBySequence(apiRows).forEach((row) => {
      const type = String(row.sizeType ?? row.SizeType ?? '').trim();
      if (!type) return;
      if (!order.some((t) => t.toUpperCase() === type.toUpperCase())) order.push(type);
    });
    if (order.length > 0) return appendMissingRowTypes(order, fallback);
  }

  return [...fallback];
}

function appendMissingRowTypes(order, fallback) {
  const out = [...order];
  fallback.forEach((typeName) => {
    if (!out.some((t) => t.toUpperCase() === typeName.toUpperCase())) out.push(typeName);
  });
  return out;
}

/**
 * Matrix rows in the same order as edit screen / database sequence (no duplicate types).
 * @param {object[]} apiRows
 * @param {string[]} rowTypeOrder
 */
export function orderInspectionDtlRowsForDisplay(apiRows, rowTypeOrder) {
  const sorted = sortRecordsBySequence(Array.isArray(apiRows) ? apiRows : []);
  const byType = new Map();
  sorted.forEach((row) => {
    const type = String(row.sizeType ?? row.SizeType ?? '').trim();
    if (!type) return;
    byType.set(type.toUpperCase(), row);
  });

  return (rowTypeOrder || []).map((typeName) => {
    const hit = byType.get(String(typeName).trim().toUpperCase());
    return hit ?? { sizeType: typeName };
  });
}

/** Size columns in standard garment sequence (YS→YL, XXS→5XL), not alphabetical / DB slot order. */
export function buildInspectionDtlMatrixColumns(sizeRow, sizeQtyBreakdown = [], slotCount = INSPECTION_DTL_SIZE_SLOTS) {
  const rawBreakdown = Array.isArray(sizeQtyBreakdown) ? sizeQtyBreakdown : [];
  const cols = [];

  for (let slot = 1; slot <= slotCount; slot += 1) {
    let label = sizeRow ? getInspectionDtlCellValue(sizeRow, slot) : '';
    if (isEmptySizeLabel(label) && rawBreakdown[slot - 1]) {
      const b = rawBreakdown[slot - 1];
      label = String(b?.size ?? b?.Size ?? '').trim();
    }
    if (!isEmptySizeLabel(label)) {
      cols.push({ slot, label: String(label).trim() });
    }
  }

  return sortGarmentSizeMatrixColumns(cols);
}

/** Size breakdown rows sorted by garment size label (same order as matrix columns). */
export function sortSizeQtyBreakdown(breakdown) {
  return sortItemsByGarmentSizeLabel(Array.isArray(breakdown) ? breakdown : [], (row) =>
    String(row?.size ?? row?.Size ?? '').trim()
  );
}

export { compareGarmentSizeLabels, sortGarmentSizeLabels, sortItemsByGarmentSizeLabel } from './garment-size-order';
