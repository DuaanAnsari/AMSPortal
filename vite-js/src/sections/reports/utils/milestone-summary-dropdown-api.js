import axios from 'axios';

/**
 * Milestone Summary Page — dropdown sources (Merchandiser, Customer, Supplier, Product Portfolio).
 * Uses `VITE_API_BASE_URL` plus optional path overrides. Falls back to FOB/LDP report env paths where set.
 */

function trimBase(url) {
  return String(url || '').replace(/\/+$/, '');
}

export function getMilestoneSummaryDropdownApiBase() {
  return trimBase(import.meta.env.VITE_API_BASE_URL || '');
}

const PATH_CUSTOMERS =
  import.meta.env.VITE_REPORT_MILESTONE_CUSTOMERS_PATH ||
  import.meta.env.VITE_REPORT_FOB_LDP_CUSTOMERS_PATH ||
  '/api/MyOrders/GetCustomer';

const PATH_SUPPLIERS =
  import.meta.env.VITE_REPORT_MILESTONE_SUPPLIERS_PATH ||
  import.meta.env.VITE_REPORT_FOB_LDP_SUPPLIERS_PATH ||
  '/api/MyOrders/GetSupplier';

const PATH_MERCHANTS =
  import.meta.env.VITE_REPORT_MILESTONE_MERCHANTS_PATH ||
  import.meta.env.VITE_REPORT_FOB_LDP_MERCHANTS_PATH ||
  '/api/MyOrders/GetMerchants';

const PATH_PRODUCT_PORTFOLIO =
  import.meta.env.VITE_REPORT_MILESTONE_PRODUCT_PORTFOLIO_PATH || '/api/MyOrders/GetProductPortfolio';

function joinApiUrl(base, path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function normalizeArrayPayload(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
}

export function milestoneCustomerKey(row) {
  const id = row?.customerID ?? row?.customerId ?? row?.CustomerID;
  return id != null && id !== '' ? String(id) : '';
}

export function milestoneSupplierKey(row) {
  const id = row?.venderLibraryID ?? row?.venderLibraryId ?? row?.VenderLibraryID;
  return id != null && id !== '' ? String(id) : '';
}

export function milestoneMerchantKey(row) {
  const id = row?.userId ?? row?.userID ?? row?.UserId ?? row?.id ?? row?.ID;
  return id != null && id !== '' ? String(id) : '';
}

export function milestonePortfolioKey(row) {
  const id =
    row?.productPortfolioID ?? row?.ProductPortfolioID ?? row?.portfolioID ?? row?.PortfolioID ?? row?.id ?? row?.ID;
  return id != null && id !== '' ? String(id) : '';
}

export function milestoneCustomerLabel(row) {
  return String(row?.customerName ?? row?.CustomerName ?? row?.name ?? '').trim() || '—';
}

export function milestoneSupplierLabel(row) {
  return String(row?.venderName ?? row?.VenderName ?? row?.vendorName ?? '').trim() || '—';
}

export function milestoneMerchantLabel(row) {
  return String(row?.userName ?? row?.UserName ?? row?.name ?? '').trim() || '—';
}

export function milestonePortfolioLabel(row) {
  return (
    String(row?.productPortfolio ?? row?.ProductPortfolioName ?? row?.portfolioName ?? row?.name ?? '').trim() || '—'
  );
}

/**
 * @param {Record<string, string>} [headers] e.g. Authorization from `wipLdpFobAuthHeaders()`
 * @returns {Promise<{
 *   customers: object[];
 *   suppliers: object[];
 *   merchants: object[];
 *   portfolios: object[];
 *   rejected: { customers: unknown; suppliers: unknown; merchants: unknown; portfolios: unknown };
 * }>}
 */
export async function fetchMilestoneSummaryDropdowns(headers = {}) {
  const base = getMilestoneSummaryDropdownApiBase();
  if (!base) {
    return {
      customers: [],
      suppliers: [],
      merchants: [],
      portfolios: [],
      rejected: { customers: null, suppliers: null, merchants: null, portfolios: null },
    };
  }

  const urls = [
    joinApiUrl(base, PATH_CUSTOMERS),
    joinApiUrl(base, PATH_SUPPLIERS),
    joinApiUrl(base, PATH_MERCHANTS),
    joinApiUrl(base, PATH_PRODUCT_PORTFOLIO),
  ];

  const settled = await Promise.allSettled([
    axios.get(urls[0], { headers }),
    axios.get(urls[1], { headers }),
    axios.get(urls[2], { headers }),
    axios.get(urls[3], { headers }),
  ]);

  const [cRes, sRes, mRes, pRes] = settled;

  const customers = cRes.status === 'fulfilled' ? normalizeArrayPayload(cRes.value?.data) : [];
  const suppliers = sRes.status === 'fulfilled' ? normalizeArrayPayload(sRes.value?.data) : [];
  const merchants = mRes.status === 'fulfilled' ? normalizeArrayPayload(mRes.value?.data) : [];
  const portfolios = pRes.status === 'fulfilled' ? normalizeArrayPayload(pRes.value?.data) : [];

  if (cRes.status === 'rejected') console.error('[Milestone Summary] customers dropdown', cRes.reason);
  if (sRes.status === 'rejected') console.error('[Milestone Summary] suppliers dropdown', sRes.reason);
  if (mRes.status === 'rejected') console.error('[Milestone Summary] merchants dropdown', mRes.reason);
  if (pRes.status === 'rejected') console.error('[Milestone Summary] product portfolios dropdown', pRes.reason);

  return {
    customers,
    suppliers,
    merchants,
    portfolios,
    rejected: {
      customers: cRes.status === 'rejected' ? cRes.reason : null,
      suppliers: sRes.status === 'rejected' ? sRes.reason : null,
      merchants: mRes.status === 'rejected' ? mRes.reason : null,
      portfolios: pRes.status === 'rejected' ? pRes.reason : null,
    },
  };
}
