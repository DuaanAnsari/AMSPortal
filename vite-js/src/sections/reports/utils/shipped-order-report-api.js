import axios from 'axios';

import { formatOpenOrderReportDate } from './status-wise-order-report-api';

/**
 * GET `/api/Report/ShippedOrderReport` relative to `VITE_API_BASE_URL`.
 */
export const SHIPPED_ORDER_REPORT_PATH =
  import.meta.env.VITE_REPORT_SHIPPED_ORDER_PATH || '/api/Report/ShippedOrderReport';

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

function mapApiRowToShippedPdfFields(raw) {
  return {
    invoiceNo: pickField(raw, 'InvoiceNo', 'invoiceNo'),
    poNo: pickField(raw, 'pono', 'PONO', 'PONo', 'poNo'),
    ldpInvoiceNo: pickField(raw, 'LDPInvoiceNo', 'ldpInvoiceNo'),
    customer: pickField(raw, 'CustomerName', 'customerName'),
    supplier: pickField(raw, 'VenderName', 'venderName', 'VendorName', 'vendorName'),
    billNo: pickField(raw, 'BillNo', 'billNo'),
    shipmentDate: formatOpenOrderReportDate(pickField(raw, 'CargoShipmentDate', 'cargoShipmentDate')),
    buyerShipDate: formatOpenOrderReportDate(pickField(raw, 'BuyerShipDate', 'buyerShipDate')),
    vendorShipDate: formatOpenOrderReportDate(pickField(raw, 'VendorShipDate', 'vendorShipDate')),
    styleNo: pickField(raw, 'StyleNo', 'styleNo'),
    sizeRange: pickField(raw, 'SizeRange', 'sizeRange'),
    shippedQty: pickField(raw, 'ShippedQty', 'shippedQty'),
    shippedRate: pickField(raw, 'ShippedRate', 'shippedRate'),
    value: pickField(raw, 'ShippedFOB', 'shippedFOB', 'shippedFob'),
  };
}

/**
 * @param {object[]} rawRows
 * @param {{ fromDate?: string; toDate?: string }} meta
 */
export function buildShippedOrderReportPdfPayload(rawRows, meta = {}) {
  const groupsMap = new Map();

  (rawRows || []).forEach((raw) => {
    const row = mapApiRowToShippedPdfFields(raw);
    const customer = row.customer || '—';
    if (!groupsMap.has(customer)) groupsMap.set(customer, []);
    groupsMap.get(customer).push(row);
  });

  return {
    fromDate: meta.fromDate,
    toDate: meta.toDate,
    groups: [...groupsMap.entries()].map(([, rows]) => ({ rows })),
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
export async function fetchShippedOrderReportRows(params, headers = {}) {
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

  const rawPath = String(SHIPPED_ORDER_REPORT_PATH || '').trim();
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
