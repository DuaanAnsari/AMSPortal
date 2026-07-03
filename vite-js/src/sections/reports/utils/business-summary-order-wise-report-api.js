import axios from 'axios';

/**
 * GET `/api/Report/BussinessSummaryOrderWiseReport` relative to `VITE_API_BASE_URL`.
 */
export const BUSINESS_SUMMARY_ORDER_WISE_REPORT_PATH =
  import.meta.env.VITE_REPORT_BUSINESS_SUMMARY_ORDER_WISE_PATH ||
  '/api/Report/BussinessSummaryOrderWiseReport';

const ALL = 'all';

function unwrapListPayload(data) {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.Data)) return data.Data;
  if (Array.isArray(data.result)) return data.result;
  if (Array.isArray(data.Result)) return data.Result;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.Rows)) return data.Rows;
  return [];
}

function pickField(obj, ...keys) {
  if (!obj) return '';
  const match = keys.find((k) => obj[k] != null && obj[k] !== '');
  return match != null ? obj[match] : '';
}

function filterIdOrZero(value) {
  const s = String(value ?? '').trim();
  if (!s || s.toLowerCase() === ALL) return '0';
  return s;
}

/** Display dates like existing Business Summary PDF rows (`15-Mar-2026`). */
export function formatBusinessSummaryOrderWiseDate(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';

  const iso = s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  return d
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, '-');
}

function mapApiRowToPdfFields(raw) {
  return {
    customerName: pickField(raw, 'CustomerName', 'customerName'),
    supplier: pickField(raw, 'Supplier', 'supplier'),
    style: pickField(raw, 'StyleNo', 'styleNo', 'style'),
    poNo: pickField(raw, 'pono', 'PONo', 'poNo'),
    bookedQty: pickField(raw, 'BookedQuantity', 'bookedQuantity'),
    shippedQty: pickField(raw, 'ShippedQty', 'shippedQty'),
    bookedFob: pickField(raw, 'BookedFOB', 'bookedFOB'),
    shippedFob: pickField(raw, 'ShippedFOB', 'shippedFOB'),
    bookedCommOn: pickField(raw, 'BookedComFOB', 'bookedComFOB'),
    shippedCommOn: pickField(raw, 'ShippedComm', 'shippedComm'),
    bookedLdp: pickField(raw, 'BookedLDPAmount', 'bookedLDPAmount'),
    shippedLdp: pickField(raw, 'ShippedLDP', 'shippedLDP'),
    vendorShipDate: formatBusinessSummaryOrderWiseDate(
      pickField(raw, 'VendorShipmentDate', 'vendorShipmentDate')
    ),
    buyerShipDate: formatBusinessSummaryOrderWiseDate(pickField(raw, 'BuyerShipment', 'buyerShipment')),
    actualShipDate: formatBusinessSummaryOrderWiseDate(pickField(raw, 'ETDActualDate', 'etdActualDate')),
    etaDate: formatBusinessSummaryOrderWiseDate(pickField(raw, 'ETA_Date', 'eta_Date', 'etaDate')),
  };
}

/**
 * @param {object[]} rows
 * @param {{ fromDate?: string; toDate?: string }} meta
 */
export function buildBusinessSummaryCustomerWisePdfPayload(rows, meta = {}) {
  const groupsMap = new Map();

  (rows || []).forEach((raw) => {
    const row = mapApiRowToPdfFields(raw);
    const customer = row.customerName || '—';
    if (!groupsMap.has(customer)) groupsMap.set(customer, []);
    groupsMap.get(customer).push({
      supplier: row.supplier,
      style: row.style,
      poNo: row.poNo,
      bookedQty: row.bookedQty,
      shippedQty: row.shippedQty,
      bookedFob: row.bookedFob,
      shippedFob: row.shippedFob,
      bookedCommOn: row.bookedCommOn,
      shippedCommOn: row.shippedCommOn,
      bookedLdp: row.bookedLdp,
      shippedLdp: row.shippedLdp,
      vendorShipDate: row.vendorShipDate,
      buyerShipDate: row.buyerShipDate,
      actualShipDate: row.actualShipDate,
      etaDate: row.etaDate,
    });
  });

  return {
    fromDate: meta.fromDate,
    toDate: meta.toDate,
    groups: [...groupsMap.entries()].map(([customer, groupRows]) => ({
      customer,
      rows: groupRows,
    })),
  };
}

/**
 * @param {object[]} rows
 * @param {{ fromDate?: string; toDate?: string }} meta
 */
export function buildBusinessSummarySupplierWisePdfPayload(rows, meta = {}) {
  const groupsMap = new Map();

  (rows || []).forEach((raw) => {
    const row = mapApiRowToPdfFields(raw);
    const supplier = row.supplier || '—';
    if (!groupsMap.has(supplier)) groupsMap.set(supplier, []);
    groupsMap.get(supplier).push({
      customer: row.customerName,
      style: row.style,
      poNo: row.poNo,
      bookedQty: row.bookedQty,
      shippedQty: row.shippedQty,
      bookedFob: row.bookedFob,
      shippedFob: row.shippedFob,
      bookedCommOn: row.bookedCommOn,
      shippedCommOn: row.shippedCommOn,
      bookedLdp: row.bookedLdp,
      shippedLdp: row.shippedLdp,
      vendorShipDate: row.vendorShipDate,
      buyerShipDate: row.buyerShipDate,
      actualShipDate: row.actualShipDate,
      etaDate: row.etaDate,
    });
  });

  return {
    fromDate: meta.fromDate,
    toDate: meta.toDate,
    groups: [...groupsMap.entries()].map(([supplier, groupRows]) => ({
      supplier,
      rows: groupRows,
    })),
  };
}

/**
 * @param {{
 *   fromDate: string;
 *   toDate: string;
 *   customerId?: string|number;
 *   supplierId?: string|number;
 * }} params
 * @param {Record<string, string>} [headers]
 * @returns {Promise<object[]>}
 */
export async function fetchBusinessSummaryOrderWiseRows(params, headers = {}) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams({
    fromDate: String(params.fromDate || ''),
    toDate: String(params.toDate || ''),
    customerId: filterIdOrZero(params.customerId),
    supplierId: filterIdOrZero(params.supplierId),
  });

  const rawPath = String(BUSINESS_SUMMARY_ORDER_WISE_REPORT_PATH || '').trim();
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const url = `${base}${path}?${q.toString()}`;

  const res = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  return unwrapListPayload(res.data);
}
