import {
  filterFactoryWipRowsByUiFilters,
  mapApiRowToFactoryWipPdfRow,
  parseFactoryWipDate,
  pickField,
} from './factory-wip-report-map';

/** Same Factory WIP API rows + UI filter logic. */
export { filterFactoryWipRowsByUiFilters as filterAmsWipRowsByUiFilters };

/** AMS PDF milestone columns (order matches {@link mapApiRowToAmsWipPdfRow} / Factory `statusCellLines`). */
export const AMS_WIP_MILESTONE_COLUMN_LABELS = [
  'Lab Dip',
  'Proto / FIT',
  'Dye Lot / Blanket',
  'Print Emb / Strike off',
  'PP Sample to',
  'Knitting / Fabric in house',
  'Dying',
  'Cutting PCS',
  'Print / Emb. PCS',
  'Stitching',
  'Garment Wash',
  'Packing PCS',
];

/** MM/DD/YYYY — AMS PDF shipment triple-cell format. */
function formatAmsPdfDate(value) {
  if (value == null || value === '') return '';
  const d = parseFactoryWipDate(value);
  if (!d) {
    const s = String(value).trim();
    return s || '';
  }
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * AMS Shipment column: customer date / "Factory Date" / factory (or supplier) date.
 * @param {Record<string, unknown>} raw
 * @param {string} [fallbackShipmentDisplay]
 * @returns {[string, string, string]}
 */
function amsShipmentLinesFromRaw(raw, fallbackShipmentDisplay = '') {
  const customerShip = pickField(
    raw,
    'CustomerShipmentDate',
    'customerShipmentDate',
    'ShipmentDate',
    'shipmentDate',
    'DisplayShipmentDate',
    'displayShipmentDate'
  );
  const factoryShip = pickField(
    raw,
    'FactoryShipmentDate',
    'factoryShipmentDate',
    'SupplierShipmentDate',
    'supplierShipmentDate',
    'RevisedShipmentDate',
    'revisedShipmentDate',
    'FactoryDate',
    'factoryDate',
    'DisplayRevisedShipmentDate',
    'displayRevisedShipmentDate'
  );

  const top = formatAmsPdfDate(customerShip) || String(fallbackShipmentDisplay || '').trim();
  const bottom = formatAmsPdfDate(factoryShip) || top;

  return [top, 'Factory Date', bottom];
}

/**
 * DEV: log milestone column bind — same `statusCellLines` as Factory WIP PDF.
 * @param {Record<string, unknown>} raw
 * @param {object} mapped
 * @param {number} [rowIndex]
 */
export function logAmsWipMilestoneBindDebug(raw, mapped, rowIndex = 0) {
  if (!import.meta.env.DEV) return;

  const po = pickField(raw, 'PONo', 'PoNo', 'pono', 'PO', 'po');
  // eslint-disable-next-line no-console
  console.group(`[AMS WIP milestone bind] row ${rowIndex + 1} PO=${po || '—'}`);

  if (rowIndex === 0) {
    const keys = Object.keys(raw || {}).sort();
    // eslint-disable-next-line no-console
    console.log('[AMS WIP] API row keys:', keys);
    const milestoneLike = keys.filter((k) =>
      /lab|dip|fit|proto|dye|print|emb|pp|knit|dye|cut|stitch|wash|pack|milestone|target|submission|approval|status|qty/i.test(
        k
      )
    );
    // eslint-disable-next-line no-console
    console.log('[AMS WIP] API milestone-like keys:', milestoneLike);
  }

  AMS_WIP_MILESTONE_COLUMN_LABELS.forEach((label, idx) => {
    // eslint-disable-next-line no-console
    console.log(`  ${label}:`, {
      statusNum: mapped.statusNums?.[idx],
      statusCellLines: mapped.statusCellLines?.[idx],
    });
  });

  // eslint-disable-next-line no-console
  console.groupEnd();
}

/**
 * Factory WIP API row → AMS WIP PDF row.
 * Milestone columns reuse Factory `statusCellLines` / `statusNums` (no hardcoded qty cells).
 * @param {Record<string, unknown>} raw
 * @param {number} [rowIndex]
 */
export function mapApiRowToAmsWipPdfRow(raw, rowIndex = 0) {
  const base = mapApiRowToFactoryWipPdfRow(raw, rowIndex);

  const mapped = {
    imageKind: base.poImageDataUrl ? 'poImage' : base.imageKind,
    poImageDataUrl: base.poImageDataUrl,
    swatch: base.swatch,
    poLines: base.poLines,
    poQty: base.poQty,
    shipQty: base.shipQty,
    balQty: base.balQty,
    shipmentLines: amsShipmentLinesFromRaw(raw, base.shipment),
    mos: base.mos,
    itemLines: base.itemLines,
    fabricLines: base.fabricLines,
    colorQty: base.colorQty,
    statusNums: base.statusNums,
    statusCellLines: base.statusCellLines,
    productionStatusLines: base.productionStatusLines,
    productionStatus: base.productionStatus,
    _pdfTextRgb: base._pdfTextRgb,
    _poImageNaturalW: 0,
    _poImageNaturalH: 0,
  };

  if (rowIndex < 3) {
    logAmsWipMilestoneBindDebug(raw, mapped, rowIndex);
  }

  return mapped;
}
