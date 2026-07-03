import axios from 'axios';

/**
 * GET `/api/Report/BussinessSummaryReport` relative to `VITE_API_BASE_URL`.
 */
export const BUSINESS_SUMMARY_REPORT_PATH =
  import.meta.env.VITE_REPORT_BUSINESS_SUMMARY_PATH || '/api/Report/BussinessSummaryReport';

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

function pickNumber(obj, ...keys) {
  const raw = pickField(obj, ...keys);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function orderKey(raw) {
  const poid = String(pickField(raw, 'POID', 'poid', 'PoId') ?? '').trim();
  if (poid) return poid;
  return String(pickField(raw, 'pono', 'PONo', 'poNo') ?? '').trim();
}

/**
 * Per-customer Target Achieved % — matches existing demo rows (Shipped Qty ÷ Booked Qty × 100).
 */
export function computeBusinessSummaryRowTargetAchieved(bookedQty, shippedQty) {
  const booked = Number(bookedQty) || 0;
  const shipped = Number(shippedQty) || 0;
  if (booked <= 0) return 0;
  return (shipped / booked) * 100;
}

/**
 * Aggregates line-level API rows into customer summary rows for the Business Summary PDF grid.
 * @param {object[]} rawRows
 */
export function buildBusinessSummaryPdfPayload(rawRows) {
  const byCustomer = new Map();

  (rawRows || []).forEach((raw) => {
    const customer = pickField(raw, 'CustomerName', 'customerName') || '—';
    const key = orderKey(raw);
    const lineShippedQty = pickNumber(raw, 'ShippedQty', 'shippedQty');

    if (!byCustomer.has(customer)) {
      byCustomer.set(customer, {
        customer,
        orderKeys: new Set(),
        shippedOrderKeys: new Set(),
        bookedQty: 0,
        shippedQty: 0,
        bookedFob: 0,
        shippedFob: 0,
        bookedCommFob: 0,
        shippedCommFob: 0,
        bookedLdp: 0,
        shippedLdp: 0,
      });
    }

    const agg = byCustomer.get(customer);
    if (key) {
      agg.orderKeys.add(key);
      if (lineShippedQty > 0) {
        agg.shippedOrderKeys.add(key);
      }
    }

    agg.bookedQty += pickNumber(raw, 'BookedQuantity', 'bookedQuantity');
    agg.shippedQty += lineShippedQty;
    agg.bookedFob += pickNumber(raw, 'BookedFOB', 'bookedFOB');
    agg.shippedFob += pickNumber(raw, 'ShippedFOB', 'shippedFOB');
    agg.bookedCommFob += pickNumber(raw, 'BookedComFOB', 'bookedComFOB');
    agg.shippedCommFob += pickNumber(raw, 'ShippedComm', 'shippedComm');
    agg.bookedLdp += pickNumber(raw, 'BookedLDPAmount', 'bookedLDPAmount');
    agg.shippedLdp += pickNumber(raw, 'ShippedLDP', 'shippedLDP');
  });

  const rows = [...byCustomer.values()].map((agg) => ({
    customer: agg.customer,
    noOfOrder: agg.orderKeys.size,
    bookedQty: agg.bookedQty,
    shippedQty: agg.shippedQty,
    noOfShipOrder: agg.shippedOrderKeys.size,
    bookedFob: agg.bookedFob,
    shippedFob: agg.shippedFob,
    bookedCommFob: agg.bookedCommFob,
    shippedCommFob: agg.shippedCommFob,
    bookedLdp: agg.bookedLdp,
    shippedLdp: agg.shippedLdp,
    targetAchieved: computeBusinessSummaryRowTargetAchieved(agg.bookedQty, agg.shippedQty),
  }));

  return { rows };
}

/**
 * @param {{ fromDate: string; toDate: string }} params
 * @param {Record<string, string>} [headers]
 * @returns {Promise<object[]>}
 */
export async function fetchBusinessSummaryReportRows(params, headers = {}) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams({
    fromDate: String(params.fromDate || ''),
    toDate: String(params.toDate || ''),
  });

  const rawPath = String(BUSINESS_SUMMARY_REPORT_PATH || '').trim();
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
