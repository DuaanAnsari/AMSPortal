import {
  filterFactoryWipRowsByUiFilters,
  mapApiRowToFactoryWipPdfRow,
  pickField,
} from './factory-wip-report-map';

/** Reuse Factory WIP filter logic — same API rows & UI filters. */
export { filterFactoryWipRowsByUiFilters as filterCustomerWipRowsByUiFilters };

/**
 * Qty column presets for WIP PDF grids.
 * Factory: PO / Ship / Bal stacked — Customer: single Total Qty (`cTotalQty`).
 */
export const WIP_PDF_QTY_COLUMN_MODE = {
  factory: 'factory',
  customer: 'customer',
};

/** Customer WIP PDF — 21-column header labels (reference layout). */
export const CUSTOMER_WIP_PDF_HEADERS = [
  'Image',
  'PO No.\n/ Style /\nProd Code',
  'Total\nQTY',
  'Shipment\nDate',
  'MOS',
  'Item\nDescription',
  'Fabric /\nContent /\nGSM',
  'Color /\nQty',
  'Lab\nDip',
  'Proto /\nFIT',
  'Dye Lot /\nBlanket',
  'Print Emb /\nStrike off',
  'PP Sample\nto',
  'Knitting /\nFabric in house',
  'Dying',
  'Cutting\nPCS',
  'Print /\nEmb. PCS',
  'Stitching',
  'Garment\nWash',
  'Packing\nPCS',
  'Production\nStatus',
];

/** Relative column weights for Customer WIP landscape PDF. */
export const CUSTOMER_WIP_PDF_COL_WEIGHTS = [
  38, 52, 32, 36, 26, 42, 64, 38, 20, 20, 20, 20, 20, 22, 20, 22, 22, 22, 22, 22, 44,
];

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Customer view: one Total Qty column — API `cTotalQty` / `TotalQty`, else PO Qty fallback.
 * @param {Record<string, unknown>} raw
 * @param {{ poQty?: number | string }} factoryRow
 */
export function resolveCustomerWipTotalQty(raw, factoryRow = {}) {
  const fromApi = pickField(
    raw,
    'cTotalQty',
    'CTotalQty',
    'cTotalQTY',
    'TotalQty',
    'totalQty',
    'Total Qty',
    'TOTALQTY',
    'TotalQTY',
    'BookedQuantity',
    'bookedQuantity'
  );
  const n = toNum(fromApi);
  if (Number.isFinite(n)) return n;

  const poFallback = toNum(factoryRow.poQty);
  if (Number.isFinite(poFallback)) return poFallback;

  const poRaw = pickField(raw, 'POQty', 'poQty', 'PoQty');
  const poN = toNum(poRaw);
  if (Number.isFinite(poN)) return poN;

  return '';
}

/**
 * Map Factory WIP API row → Customer WIP PDF row (same milestones; qty column = Total Qty).
 * @param {Record<string, unknown>} raw
 * @param {number} [rowIndex]
 */
export function mapApiRowToCustomerWipPdfRow(raw, rowIndex = 0) {
  const base = mapApiRowToFactoryWipPdfRow(raw, rowIndex);
  return {
    ...base,
    totalQty: resolveCustomerWipTotalQty(raw, base),
    qtyColumnMode: WIP_PDF_QTY_COLUMN_MODE.customer,
  };
}
