import axios from 'axios';

/**
 * Shared PO# dropdown API for Reports pages.
 *
 * Endpoint:
 *   `GET /api/MyOrders/Getpono`              (default)
 * Override paths (`.env`):
 *   `VITE_REPORT_PONO_PATH`                  (primary — preferred)
 *   `VITE_REPORT_FOB_LDP_PONO_PATH`          (legacy — kept for backward compat with the
 *                                             LDP / FOB Report page's existing env setup)
 *
 * Response shape: `[{ pono: "00099791" }, { pono: "008039" }, ...]`
 *
 * Filter semantics:
 *   - No filters       → backend returns ALL PO numbers.
 *   - `customerId`     → POs scoped to that customer only.
 *   - `supplierId`     → POs scoped to that supplier only.
 *   - Both             → backend may return the intersection.
 *
 * Sentinel values (`''`, `'0'`, `'all'`) are dropped from the query so the backend
 * doesn't need to know about UI placeholders.
 */

export const PONO_PATH =
  import.meta.env.VITE_REPORT_PONO_PATH ||
  import.meta.env.VITE_REPORT_FOB_LDP_PONO_PATH ||
  '/api/MyOrders/Getpono';

const ALL_TOKENS = new Set(['', '0', 'all', 'ALL', 'All']);

function isRealFilterToken(v) {
  return !ALL_TOKENS.has(String(v ?? '').trim());
}

function getApiBase() {
  return String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
}

function joinPath(base, path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Reusable PO# fetcher — used by LDP / FOB Report + Milestone Summary.
 *
 * @param {{ customerId?: string|number; supplierId?: string|number; signal?: AbortSignal }} [params]
 * @param {Record<string, string>} [headers]
 * @returns {Promise<string[]>} deduped, trimmed PO numbers in API order
 */
export async function fetchPoNumbers(params = {}, headers = {}) {
  const base = getApiBase();
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams();
  if (isRealFilterToken(params.customerId)) q.set('customerId', String(params.customerId).trim());
  if (isRealFilterToken(params.supplierId)) q.set('supplierId', String(params.supplierId).trim());

  const qs = q.toString();
  const url = `${joinPath(base, PONO_PATH)}${qs ? `?${qs}` : ''}`;

  const res = await axios.get(url, {
    headers: { 'Content-Type': 'application/json', ...headers },
    signal: params.signal,
  });

  const data = res?.data;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.Data)
    ? data.Data
    : Array.isArray(data?.result)
    ? data.result
    : [];

  const seen = new Set();
  const out = [];
  list.forEach((r) => {
    const raw =
      r && typeof r === 'object' ? r.pono ?? r.PONO ?? r.poNo ?? r.PoNo ?? r.PONo : r;
    const v = String(raw ?? '').trim();
    if (!v) return;
    if (seen.has(v)) return;
    seen.add(v);
    out.push(v);
  });
  return out;
}
