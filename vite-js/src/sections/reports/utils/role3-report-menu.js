/** Menu visibility for limited roles (routing / report logic unchanged). */
export const ROLE_IDS_LIMITED_MENU = [3, 43];

/** @deprecated use ROLE_IDS_LIMITED_MENU — kept for callers that import the old name */
export const ROLE_ID_LIMITED_MENU = 3;

export function isRole3LimitedMenu() {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem('roleId');
  if (raw == null || raw === '') return false;
  const roleId = Number(raw);
  return ROLE_IDS_LIMITED_MENU.includes(roleId);
}

/**
 * @param {Array<{ id: string; label: string }>} allOptions
 * @param {string[]} allowedIdsInOrder
 * @param {Record<string, string>} [labelOverrides] role-3 menu labels only
 */
export function filterReportOptionsForRole3(allOptions, allowedIdsInOrder, labelOverrides = {}) {
  if (!isRole3LimitedMenu()) return allOptions;
  const byId = new Map((allOptions || []).map((o) => [o.id, o]));
  return (allowedIdsInOrder || [])
    .map((id) => {
      const opt = byId.get(id);
      if (!opt) return null;
      const label = labelOverrides[id];
      return label ? { ...opt, label } : opt;
    })
    .filter(Boolean);
}

export const ROLE3_WIP_REPORT_IDS = [
  'factory-wip',
  'customer-wip',
  'ams-wip',
  'milestone-summary',
  'customised-customer-wip',
];

export const ROLE3_INQUIRY_REPORT_IDS = [
  'inquiry-report-for-customer',
  'merchant-inquiry-sheet',
  'sample-development-report',
  'sample-development-report-cs-wise',
  'sample-development-report-only-dispatch',
];

export const ROLE3_SHIPMENT_REPORT_IDS = ['shipment-delay-report', 'shipment-tracking-report'];

export const ROLE3_INSPECTION_REPORT_IDS = ['inspection-report'];

/** Inspection hub route id `inspection-report` → QA Inspection Records page. */
export const ROLE3_INSPECTION_LABEL_OVERRIDES = {
  'inspection-report': 'QA Inspection Records',
};

export const ROLE3_OTHER_REPORT_IDS = [
  'quick-orders-overview-report',
  'production-history-report',
  'order-detail-report',
];
