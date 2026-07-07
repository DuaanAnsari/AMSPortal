import axios from 'axios';

/**
 * GET `/Report/CustomisedCustomerWipReport` relative to `VITE_API_BASE_URL`.
 * Example: `http://192.168.18.87/api/Report/CustomisedCustomerWipReport`
 */
export const CUSTOMISED_CUSTOMER_WIP_REPORT_PATH =
  import.meta.env.VITE_REPORT_CUSTOMISED_CUSTOMER_WIP_PATH ||
  '/Report/CustomisedCustomerWipReport';

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

function filterIdOrZero(value) {
  const s = String(value ?? '').trim();
  if (!s || s.toLowerCase() === ALL) return '0';
  return s;
}

/**
 * Convert `yyyy-mm-dd` (HTML date input) to `yyyy-m-d` for this report API.
 * @param {string} iso
 * @returns {string}
 */
export function formatCustomisedCustomerWipApiDateFromIso(iso) {
  const s = String(iso ?? '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const [, y, mo, d] = m;
  return `${y}-${parseInt(mo, 10)}-${parseInt(d, 10)}`;
}

/**
 * @param {{
 *   startDate: string;
 *   endDate: string;
 *   customerId?: string|number;
 *   vendorId?: string|number;
 *   marchandId?: string|number;
 *   poid?: string|number;
 * }} params — `startDate` / `endDate` as `yyyy-mm-dd` from the form
 * @param {Record<string, string>} [headers]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<object[]>}
 */
export async function fetchCustomisedCustomerWipReportRows(params, headers = {}, options = {}) {
  const base = String(import.meta.env.VITE_API_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams({
    startDate: formatCustomisedCustomerWipApiDateFromIso(params.startDate),
    endDate: formatCustomisedCustomerWipApiDateFromIso(params.endDate),
    customerId: filterIdOrZero(params.customerId),
    vendorId: filterIdOrZero(params.vendorId),
    marchandId: filterIdOrZero(params.marchandId),
    poid: filterIdOrZero(params.poid),
  });

  const rawPath = String(CUSTOMISED_CUSTOMER_WIP_REPORT_PATH || '').trim();
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const url = `${base}${path}?${q.toString()}`;

  const res = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal: options.signal,
  });

  return unwrapListPayload(res.data);
}
