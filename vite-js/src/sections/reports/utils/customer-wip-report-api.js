import axios from 'axios';

import {
  normalizeProductPortfolioForMilestoneApi,
  normalizeReportSubTypeForMilestoneApi,
  normalizeReportTypeForMilestoneApi,
} from './milestone-summary-report-api';

/**
 * GET `/api/Report/GetCustomerWIPReport` relative to `VITE_API_BASE_URL`.
 * Override path with `VITE_REPORT_CUSTOMER_WIP_PATH` if needed.
 */
export const CUSTOMER_WIP_REPORT_DATA_PATH =
  import.meta.env.VITE_REPORT_CUSTOMER_WIP_PATH || '/api/Report/GetCustomerWIPReport';

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
 * @param {{
 *   reportType: string;
 *   productPortfolio: string | number;
 *   reportSubType?: string;
 *   fromDate: string;
 *   toDate: string;
 *   portfolios?: object[];
 * }} params — dates must be `yyyy-mm-dd`
 * @param {Record<string, string>} [headers]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<object[]>}
 */
export async function fetchCustomerWipReportRows(params, headers = {}, options = {}) {
  const base = String(import.meta.env.VITE_API_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const portfolios = Array.isArray(params.portfolios) ? params.portfolios : [];
  const reportType = normalizeReportTypeForMilestoneApi(params.reportType);
  const productPortfolio = normalizeProductPortfolioForMilestoneApi(
    params.productPortfolio,
    portfolios
  );
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

  const rawPath = String(CUSTOMER_WIP_REPORT_DATA_PATH || '').trim();
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
