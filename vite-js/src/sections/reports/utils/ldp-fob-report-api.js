import axios from 'axios';

/**
 * GET path relative to `VITE_API_BASE_URL` (leading slash recommended).
 * Expected shape: `/api/Report/LDPFOBReport?...`
 * Override with `VITE_REPORT_LDP_FOB_DATA_PATH` if the host differs.
 */
export const LDP_FOB_REPORT_DATA_PATH =
  import.meta.env.VITE_REPORT_LDP_FOB_DATA_PATH || '/api/Report/LDPFOBReport';

/** Backend expects `0` when PO / style filter is not used (not empty string). */
function queryTokenOrZero(v) {
  const s = String(v ?? '').trim();
  return s === '' ? '0' : s;
}

/**
 * @param {string} base
 * @param {string} pathOrUrl path starting with `/` or full `http(s)://...` URL
 */
export function buildLdpFobReportUrl(base, pathOrUrl, searchParams) {
  const qs = searchParams instanceof URLSearchParams ? searchParams.toString() : String(searchParams);
  const raw = String(pathOrUrl || '').trim();
  if (!raw) {
    throw new Error('LDP FOB report path is empty');
  }
  if (/^https?:\/\//i.test(raw)) {
    const u = new URL(raw);
    u.search = qs;
    return u.toString();
  }
  const b = String(base || '').replace(/\/+$/, '');
  let p = raw.startsWith('/') ? raw : `/${raw}`;
  p = p.replace(/([^:])\/{2,}/g, '$1/');
  return `${b}${p}?${qs}`;
}

/**
 * Query: `fromDate`, `toDate` (yyyy-mm-dd), `customerId`, `supplierId`, `pono`, `styleNo`.
 * Empty `pono` / `styleNo` are sent as `0` to match `/api/Report/LDPFOBReport?...&pono=0&styleNo=0`.
 * @param {object} params
 * @param {Record<string, string>} [headers]
 * @returns {Promise<object[]>}
 */
export async function fetchLdpFobReportRows(params, headers = {}) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams({
    fromDate: String(params.fromDate || ''),
    toDate: String(params.toDate || ''),
    customerId: String(params.customerId ?? '0'),
    supplierId: String(params.supplierId ?? '0'),
    pono: queryTokenOrZero(params.pono),
    styleNo: queryTokenOrZero(params.styleNo),
  });

  const url = buildLdpFobReportUrl(base, LDP_FOB_REPORT_DATA_PATH, q);

  const res = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  return unwrapListPayload(res.data);
}

function unwrapListPayload(data) {
  if (Array.isArray(data)) return data;
  if (data == null) return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.Data)) return data.Data;
  if (Array.isArray(data.result)) return data.result;
  if (Array.isArray(data.Result)) return data.Result;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.Rows)) return data.Rows;
  if (data.data && typeof data.data === 'object') return [data.data];
  return [];
}
