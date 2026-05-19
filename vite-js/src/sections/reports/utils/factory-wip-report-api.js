import axios from 'axios';

/**
 * GET path relative to `VITE_API_BASE_URL`.
 * Default matches backend spelling `GetFactoryWibReport`.
 */
export const FACTORY_WIP_REPORT_DATA_PATH =
  import.meta.env.VITE_REPORT_FACTORY_WIP_PATH || '/api/Report/GetFactoryWibReport';

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

/**
 * Convert `yyyy-mm-dd` (HTML date input) to `MM/dd/yyyy` for this report API.
 * @param {string} iso
 * @returns {string}
 */
export function formatFactoryWipApiDateFromIso(iso) {
  const s = String(iso ?? '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const [, y, mo, d] = m;
  return `${mo}/${d}/${y}`;
}

function buildFactoryWipReportUrl(fromDateIso, toDateIso) {
  const base = String(import.meta.env.VITE_API_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }
  const rawPath = String(FACTORY_WIP_REPORT_DATA_PATH || '').trim();
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const q = new URLSearchParams({
    fromDate: formatFactoryWipApiDateFromIso(fromDateIso),
    toDate: formatFactoryWipApiDateFromIso(toDateIso),
  });
  return `${base}${path}?${q.toString()}`;
}

/**
 * @param {{ fromDate: string; toDate: string }} params — `yyyy-mm-dd`
 * @param {Record<string, string>} [headers]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<object[]>}
 */
export async function fetchFactoryWipReportRows(params, headers = {}, options = {}) {
  const fromDate = String(params.fromDate ?? '').trim();
  const toDate = String(params.toDate ?? '').trim();
  const url = buildFactoryWipReportUrl(fromDate, toDate);

  const res = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal: options.signal,
  });

  return unwrapListPayload(res.data);
}

/**
 * Some deployments return a PDF for the same URL when `Accept: application/pdf` is sent.
 * If the body is not a PDF, returns `null` so the client can fall back to jsPDF.
 *
 * @param {{ fromDate: string; toDate: string }} params
 * @param {Record<string, string>} [headers]
 * @returns {Promise<Blob | null>}
 */
export async function tryFetchFactoryWipServerPdfBlob(params, headers = {}) {
  const fromDate = String(params.fromDate ?? '').trim();
  const toDate = String(params.toDate ?? '').trim();
  let url;
  try {
    url = buildFactoryWipReportUrl(fromDate, toDate);
  } catch {
    return null;
  }

  try {
    const res = await axios.get(url, {
      responseType: 'blob',
      headers: {
        ...headers,
        Accept: 'application/pdf',
      },
    });
    const blob = res.data;
    if (!(blob instanceof Blob) || blob.size < 32) return null;
    const head = new TextDecoder('latin1').decode(await blob.slice(0, 5).arrayBuffer());
    return head.startsWith('%PDF') ? blob : null;
  } catch {
    return null;
  }
}
