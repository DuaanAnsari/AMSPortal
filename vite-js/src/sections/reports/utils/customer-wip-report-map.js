import {
  formatFactoryWipDisplayDate,
  normalizeFactoryWipPoImageDataUrl,
  pickField,
} from './factory-wip-report-map';

const ALL = 'all';

function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase();
}

/** Display value for a table cell — dates formatted when parseable. */
function cellText(raw, ...keys) {
  const v = pickField(raw, ...keys);
  if (v == null || v === '') return '';
  if (typeof v === 'object') return JSON.stringify(v);
  const s = String(v).trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
    const formatted = formatFactoryWipDisplayDate(s);
    if (formatted && formatted !== '—') return formatted;
  }
  return s;
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {object}
 */
export function mapApiRowToCustomerWipPdfRow(raw) {
  return {
    poNo: cellText(raw, 'PONo', 'PoNo', 'pono', 'PONO', 'PO', 'po'),
    poImageDataUrl: normalizeFactoryWipPoImageDataUrl(raw),
    colorway: cellText(raw, 'Colorway', 'colorway', 'ColorWay', 'Color', 'color'),
    vendor: cellText(
      raw,
      'vendername',
      'VenderName',
      'venderName',
      'VendorName',
      'vendorName',
      'SupplierName',
      'supplierName',
      'Supplier',
      'Vendor'
    ),
    customer: cellText(
      raw,
      'customername',
      'CustomerName',
      'customerName',
      'BuyerName',
      'buyerName',
      'Customer',
      'customer'
    ),
    merchandiser: cellText(
      raw,
      'username',
      'UserName',
      'userName',
      'MerchandiserName',
      'merchandiserName',
      'Merchandiser',
      'merchandiser'
    ),
    shipmentDate: cellText(
      raw,
      'ShipmentDate',
      'shipmentDate',
      'CustomerShipmentDate',
      'customerShipmentDate',
      'DisplayShipmentDate',
      'displayShipmentDate'
    ),
    bookedQuantity: cellText(
      raw,
      'BookedQuantity',
      'bookedQuantity',
      'POQty',
      'poQty',
      'PoQty',
      'Quantity',
      'quantity',
      'QTY',
      'qty'
    ),
    labDip: cellText(raw, 'Lab Dip', 'LabDip', 'labDip', 'Lab_DIP'),
    fit: cellText(raw, 'FIT', 'ProtoFIT', 'ProtoFit', 'Proto', 'Fit'),
    sizeSet: cellText(raw, 'Size set', 'SizeSet', 'SizeSetTD', 'SizesetTD', 'Size Set'),
    printEmbStrikeOff: cellText(
      raw,
      'Print / Emb/ Strike off',
      'PrintEmbStrikeoff',
      'PrintEmbStrikeOff',
      'PrintMockupStrikeoff',
      'Print / Emb',
      'PrintEmb'
    ),
    pp: cellText(raw, 'PP', 'PPSample', 'pp', 'PP Sample'),
    testing: cellText(raw, 'Testing', 'TestingLocal', 'testing', 'Testing Nominated', 'TestingNominated'),
    knitting: cellText(raw, 'Knitting', 'knitting', 'KnittingFabric', 'FabricInhouse'),
    dying: cellText(raw, 'Dying', 'dying', 'Dyeing', 'dyeing'),
    cutting: cellText(raw, 'Cutting', 'cutting', 'CuttingPCS', 'CuttingPcs'),
    stitching: cellText(raw, 'Stitching', 'Stiching', 'stitching', 'StitchingPCS'),
    washing: cellText(raw, 'Washing', 'washing', 'GarmentWash', 'Garment Wash'),
    packing: cellText(raw, 'Packing', 'packing', 'PackingPCS', 'PackingPcs'),
    fri: cellText(raw, 'FRI', 'fri', 'FRI1', 'fri1'),
    dyeLotBlanket: cellText(raw, 'Dye Lot/Blanket', 'DyeLotBlanket', 'DyeLot', 'Dye Lot', 'dyeLotBlanket'),
    sizeSetToBuyer: cellText(
      raw,
      'Size set to Buyer',
      'SizesettoBuyer',
      'SizeSetBuyer',
      'SizeSetToBuyer',
      'sizesettoBuyer'
    ),
    _poImageNaturalW: 0,
    _poImageNaturalH: 0,
  };
}

/**
 * @param {object[]} rows
 * @param {object} filters
 * @param {object} [dropdowns]
 * @param {{
 *   customerLabel?: string;
 *   supplierLabel?: string;
 *   merchandiserLabel?: string;
 * }} [resolved]
 * @returns {object[]}
 */
export function filterCustomerWipRowsByUiFilters(rows, filters, _dropdowns = {}, resolved = {}) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return list;

  const customerLabel = String(resolved.customerLabel || '').trim();
  const supplierLabel = String(resolved.supplierLabel || '').trim();
  const merchandiserLabel = String(resolved.merchandiserLabel || '').trim();
  const poScope = filters?.poScope;

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
        'venderName',
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
    if (poScope && poScope !== ALL) {
      const po = pickField(r, 'PONo', 'PoNo', 'pono', 'PONO', 'PO', 'po');
      if (norm(po) !== norm(poScope)) return false;
    }
    return true;
  });
}

/**
 * @param {object[]} mappedRows — rows from {@link mapApiRowToCustomerWipPdfRow}
 * @returns {Promise<object[]>}
 */
export async function preloadCustomerWipPoImageDimensions(mappedRows) {
  const rows = Array.isArray(mappedRows) ? mappedRows : [];
  await Promise.all(
    rows.map(
      (row) =>
        new Promise((resolve) => {
          const url = row?.poImageDataUrl;
          if (!url) {
            row._poImageNaturalW = 0;
            row._poImageNaturalH = 0;
            resolve();
            return;
          }
          const img = new Image();
          img.onload = () => {
            row._poImageNaturalW = img.naturalWidth || img.width || 0;
            row._poImageNaturalH = img.naturalHeight || img.height || 0;
            resolve();
          };
          img.onerror = () => {
            row._poImageNaturalW = 0;
            row._poImageNaturalH = 0;
            row.poImageDataUrl = null;
            resolve();
          };
          img.src = url;
        })
    )
  );
  return rows;
}

/** @returns {string[]} autotable header labels */
export const CUSTOMER_WIP_TABLE_HEADERS = [
  'PO No',
  'Image',
  'Colorway',
  'Vendor',
  'Customer',
  'Merchandiser',
  'Shipment Date',
  'Booked Quantity',
  'Lab Dip',
  'FIT',
  'Size Set',
  'Print / Emb / Strike Off',
  'PP',
  'Testing',
  'Knitting',
  'Dying',
  'Cutting',
  'Stitching',
  'Washing',
  'Packing',
  'FRI',
  'Dye Lot / Blanket',
  'Size Set to Buyer',
];

/** Map a PDF row object to autotable body cells (image column left blank for didDrawCell). */
export function customerWipPdfRowToTableCells(row) {
  return [
    row.poNo || '—',
    '',
    row.colorway || '—',
    row.vendor || '—',
    row.customer || '—',
    row.merchandiser || '—',
    row.shipmentDate || '—',
    row.bookedQuantity || '—',
    row.labDip || '—',
    row.fit || '—',
    row.sizeSet || '—',
    row.printEmbStrikeOff || '—',
    row.pp || '—',
    row.testing || '—',
    row.knitting || '—',
    row.dying || '—',
    row.cutting || '—',
    row.stitching || '—',
    row.washing || '—',
    row.packing || '—',
    row.fri || '—',
    row.dyeLotBlanket || '—',
    row.sizeSetToBuyer || '—',
  ];
}
