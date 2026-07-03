import axios from 'axios';

/**
 * GET `/api/Report/OpenOrderReport` relative to `VITE_API_BASE_URL`.
 */
export const OPEN_ORDER_REPORT_PATH =
  import.meta.env.VITE_REPORT_OPEN_ORDER_PATH || '/api/Report/OpenOrderReport';

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

/** Display dates like existing Status Wise PDF rows (`Apr 15, 2026`). */
export function formatOpenOrderReportDate(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';

  const iso = s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${month} ${day}, ${d.getFullYear()}`;
}

function mapApiRowToPdfFields(raw) {
  const buyerShipDate = formatOpenOrderReportDate(pickField(raw, 'BuyerShipDate', 'buyerShipDate'));
  const vendorShipDate = formatOpenOrderReportDate(pickField(raw, 'VendorShipDate', 'vendorShipDate'));

  return {
    poNo: pickField(raw, 'PONO', 'pono', 'PONo', 'poNo'),
    customer: pickField(raw, 'CustomerName', 'customerName'),
    supplier: pickField(raw, 'VenderName', 'venderName', 'VendorName', 'vendorName'),
    buyerShipDate,
    vendorShipDate,
    styleNo: pickField(raw, 'StyleNo', 'styleNo'),
    colorway: pickField(raw, 'Colorway', 'colorway'),
    sizeRange: pickField(raw, 'SizeRange', 'sizeRange'),
    size: pickField(raw, 'Size', 'size'),
    poQty: pickField(raw, 'Quantity', 'quantity'),
    itemPrice: pickField(raw, 'Rate', 'rate'),
    value: pickField(raw, 'Value', 'value'),
    ldpPrice: pickField(raw, 'LDPRate', 'ldpRate'),
    ldpValue: pickField(raw, 'LDPValue', 'ldpValue'),
  };
}

/**
 * @param {object[]} rawRows
 * @param {{ status?: string; fromDate?: string; toDate?: string }} meta
 */
export function buildStatusWiseCustomerOrderPdfPayload(rawRows, meta = {}) {
  const groupsMap = new Map();

  (rawRows || []).forEach((raw) => {
    const row = mapApiRowToPdfFields(raw);
    const customer = row.customer || '—';
    if (!groupsMap.has(customer)) groupsMap.set(customer, []);
    groupsMap.get(customer).push(row);
  });

  return {
    status: meta.status,
    fromDate: meta.fromDate,
    toDate: meta.toDate,
    groups: [...groupsMap.entries()].map(([, rows]) => ({ rows })),
  };
}

/**
 * Maps the same API rows into vendor PDF groups (grouped by supplier for yellow total bands).
 * @param {object[]} rawRows
 * @param {{ fromDate?: string; toDate?: string }} meta
 */
export function buildStatusWiseVendorOrderPdfPayload(rawRows, meta = {}) {
  const groupsMap = new Map();

  (rawRows || []).forEach((raw) => {
    const row = mapApiRowToPdfFields(raw);
    const supplier = row.supplier || '—';
    if (!groupsMap.has(supplier)) groupsMap.set(supplier, []);
    groupsMap.get(supplier).push(row);
  });

  return {
    fromDate: meta.fromDate,
    toDate: meta.toDate,
    groups: [...groupsMap.entries()].map(([, rows]) => ({ rows })),
  };
}

/**
 * @param {{
 *   status: string;
 *   fromDate: string;
 *   toDate: string;
 *   customerId?: string|number;
 *   supplierId?: string|number;
 *   marchandiserId?: string|number;
 *   refPOID?: string|number;
 * }} params
 * @param {Record<string, string>} [headers]
 * @returns {Promise<object[]>}
 */
export async function fetchOpenOrderReportRows(params, headers = {}) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams({
    status: String(params.status || ''),
    fromDate: String(params.fromDate || ''),
    toDate: String(params.toDate || ''),
    customerId: filterIdOrZero(params.customerId),
    supplierId: filterIdOrZero(params.supplierId),
    marchandiserId: filterIdOrZero(params.marchandiserId),
    refPOID: filterIdOrZero(params.refPOID),
  });

  const rawPath = String(OPEN_ORDER_REPORT_PATH || '').trim();
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
