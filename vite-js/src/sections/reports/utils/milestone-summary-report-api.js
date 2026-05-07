import axios from 'axios';

import { milestonePortfolioKey, milestonePortfolioLabel } from './milestone-summary-dropdown-api';

/**
 * GET `/api/Report/GetMilestoneReport` relative to `VITE_API_BASE_URL`.
 * Override path with `VITE_REPORT_MILESTONE_DATA_PATH` if needed.
 */
export const MILESTONE_REPORT_DATA_PATH =
  import.meta.env.VITE_REPORT_MILESTONE_DATA_PATH || '/api/Report/GetMilestoneReport';

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
  if (data.data && typeof data.data === 'object') return [data.data];
  return [];
}

/**
 * Backend expects exact strings: `Supplier wise` | `Merchandiser wise` (space + casing).
 * @param {string} [value] — e.g. `supplierWise` from UI
 * @returns {'Supplier wise' | 'Merchandiser wise'}
 */
export function normalizeReportTypeForMilestoneApi(value) {
  const compact = String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase();
  if (compact === 'supplierwise') return 'Supplier wise';
  if (compact === 'merchandiserwise') return 'Merchandiser wise';
  return 'Merchandiser wise';
}

/**
 * Backend expects portfolio name e.g. `Apparel` (not numeric id, not `0`).
 * `portfolios` = rows from GetProductPortfolio (optional) to map id → label.
 * @param {string} [value]
 * @param {object[]} [portfolios]
 */
export function normalizeProductPortfolioForMilestoneApi(value, portfolios = []) {
  const v = String(value ?? '').trim();
  if (!v || v.toLowerCase() === ALL || v === '0') {
    return 'Apparel';
  }
  const row = portfolios.find((r) => String(milestonePortfolioKey(r)) === v);
  if (row) {
    const label = String(milestonePortfolioLabel(row) || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!label || label === '—') return 'Apparel';
    if (/^apparel$/i.test(label)) return 'Apparel';
    return label;
  }
  if (/^apparel$/i.test(v)) return 'Apparel';
  return v.replace(/\s+/g, ' ').trim();
}

/** Backend expects `reportSubType` e.g. `general` (lowercase, no extra spaces). */
export function normalizeReportSubTypeForMilestoneApi(value) {
  const v = String(value ?? 'general')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return v || 'general';
}

/**
 * @param {{
 *   reportType: string;
 *   productPortfolio: string | number;
 *   reportSubType: string;
 *   fromDate: string;
 *   toDate: string;
 *   portfolios?: object[];
 * }} params — dates must be `yyyy-mm-dd`. `portfolios` is not sent as a query param.
 * @param {Record<string, string>} [headers]
 * @returns {Promise<object[]>}
 */
export async function fetchMilestoneReportRows(params, headers = {}) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const portfolios = Array.isArray(params.portfolios) ? params.portfolios : [];

  const reportType = normalizeReportTypeForMilestoneApi(params.reportType);
  const productPortfolio = normalizeProductPortfolioForMilestoneApi(params.productPortfolio, portfolios);
  const reportSubType = normalizeReportSubTypeForMilestoneApi(params.reportSubType);
  const fromDate = String(params.fromDate ?? '').trim();
  const toDate = String(params.toDate ?? '').trim();

  const q = new URLSearchParams({
    reportType,
    productPortfolio,
    reportSubType,
    fromDate,
    toDate,
  });

  const rawPath = String(MILESTONE_REPORT_DATA_PATH || '').trim();
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const url = `${base}${path}?${q.toString()}`;

  // eslint-disable-next-line no-console -- intentional for debugging unsupported combinations
  console.log('[Milestone Report] GET', url);

  const res = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  return unwrapListPayload(res.data);
}
