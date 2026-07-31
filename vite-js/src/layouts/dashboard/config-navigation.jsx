import { useMemo, useState, useEffect } from 'react';

import SettingsIcon from '@mui/icons-material/Settings';

import { paths } from 'src/routes/paths';

import axios from 'src/utils/axios';

import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const ICONS = {
  user: icon('ic_user'),
  file: icon('ic_file'),
  order: icon('ic_order'),
  folder: icon('ic_folder'),
  banking: icon('ic_banking'),
  booking: icon('ic_booking'),
  product: icon('ic_product'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
  menuItem: icon('ic_menu_item'),
};

const MENU_ENDPOINT = '/api/MyOrders/GetUserMenus';
const NOT_FOUND_PATH = paths.underConstruction;

const cleanMenuName = (name) =>
  String(name ?? '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const normalizeName = (name) => cleanMenuName(name).toLowerCase();

const createNameMap = (entries) =>
  Object.fromEntries(entries.map(([name, value]) => [normalizeName(name), value]));

const ROUTE_BY_NAME = createNameMap([
  ['Home', paths.dashboard.root],
  ['Dashboard', paths.dashboard.root],
  ['App', paths.dashboard.root],
  ['My Customers', paths.dashboard.general.customers],
  ['Customers', paths.dashboard.general.customers],
  ['My Suppliers', paths.dashboard.general.supplier],
  ['Supplier', paths.dashboard.general.supplier],
  ['QA BI', paths.dashboard.general.banking],
  ['Booking', paths.dashboard.general.booking],
  ['SOPs', paths.dashboard.general.file],
  ['File', paths.dashboard.general.file],
  ['New Container Loading', paths.dashboard.containerLoading],
  ['Container Loading', paths.dashboard.containerLoading],
  ['Inspection', paths.dashboard.masterOrderForQDSheet],
  ['Inspection Report', paths.dashboard.qaInspectionView],
  ['Sample Inspection Report', paths.dashboard.supplyChain.sampleInspectionReport],
  ['Size Specs', paths.dashboard.supplyChain.sizeSpecsView],

  ['Supply Chain', paths.dashboard.supplyChain.root],
  ['My Orders', paths.dashboard.supplyChain.root],
  ['TNA Chart', paths.dashboard.supplyChain.tnaChart],
  ['Quick Search', paths.dashboard.supplyChain.cards],
  ['My Shipments', paths.dashboard.supplyChain.list],
  ['Merchandisers Backlog', paths.dashboard.supplyChain.merchandiserBacklog],
  ['Cancellations', paths.dashboard.supplyChain.cancellations],
  ['Order Tracking', paths.dashboard.supplyChain.orderTracking],
  ['Merchant Inquiry', paths.dashboard.supplyChain.merchantInquiry],
  ['Order Detail', paths.dashboard.supplyChain.orderDetail],
  ['Sampling Program', paths.dashboard.supplyChain.samplingProgram],

  ['Power Tools', paths.dashboard.powerTool.root],
  ['Process Board', paths.dashboard.powerTool.processBoard],
  ['Product Categories', paths.dashboard.powerTool.productCategories],
  ['Product Group', paths.dashboard.powerTool.productGroup],
  ['Booked Exchange Rate', paths.dashboard.powerTool.bookedExchangeRate],
  ['Shipped Exchange Rate', paths.dashboard.powerTool.shippedExchangeRate],
  ['Size Range Database', paths.dashboard.powerTool.sizeRangeDatabase],
  ['Advance Payment', paths.dashboard.powerTool.advancePayment],
  ['ICR Form', paths.dashboard.powerTool.icrForm],
  ['Po Mix Qty', paths.dashboard.powerTool.qrView],
  ['View Users', paths.dashboard.powerTool.viewUsers],
  ['Cost Sheet View', paths.dashboard.powerTool.costSheetView],
  ['Courier Packaging', paths.dashboard.powerTool.courierPackagingView],
  ['Courier Packages', paths.dashboard.powerTool.courierPackagingView],
  ['Packaging View', paths.dashboard.powerTool.courierPackagingView],
  ['Consignee', paths.dashboard.powerTool.consigneeView],
  ['Container handling', paths.dashboard.powerTool.containerHandling],
  ['Measurement Points', paths.dashboard.powerTool.measurementPoints],

  ['Profile Setting', paths.dashboard.profileSetting.root],
  ['Create User', paths.dashboard.profileSetting.createUser],

  ['Reports', paths.dashboard.reports.root],
  ['FOB LDP PRICE LIST', paths.dashboard.reports.fobLdpPriceList],
]);

const REPORT_CATEGORY_PATHS = createNameMap([
  ['WIP', paths.dashboard.reports.wip],
  ['Inquiry', paths.dashboard.reports.inquiry],
  ['MGT', paths.dashboard.reports.mgt],
  ['Shipment', paths.dashboard.reports.shipment],
  ['Other', paths.dashboard.reports.other],
  ['Inspection', paths.dashboard.reports.inspection],
]);

const REPORT_ITEM_IDS = {
  [normalizeName('WIP')]: createNameMap([
    ['Milestone Summary', 'milestone-summary'],
    ['Factory WIP Report', 'factory-wip'],
    ['Customer WIP Report', 'customer-wip'],
    ['AMS WIP Report', 'ams-wip'],
    ['SALT WIP Report', 'salt-wip'],
    ['Customised Customer WIP', 'customised-customer-wip'],
  ]),
  [normalizeName('Inquiry')]: createNameMap([
    ['Inquiry Report For Customer', 'inquiry-report-for-customer'],
    ['Photo Shoot Sample For Customer', 'photo-shoot-sample-for-customer'],
    ['Inquiry Report For Factory', 'inquiry-report-for-factory'],
    ['Photo Shoot Sample For Factory', 'photo-shoot-sample-for-factory'],
    ['Sample Development Report', 'sample-development-report'],
    ['Merchant Inquiry Sheet', 'merchant-inquiry-sheet'],
    ['Sample Development Report only Dispatch', 'sample-development-report-only-dispatch'],
    ['Sample Development Report CS Wise', 'sample-development-report-cs-wise'],
  ]),
  [normalizeName('MGT')]: createNameMap([
    ['Business Summary Order wise', 'business-summary-order-wise'],
    ['Business Summary', 'business-summary'],
    ['Status Wise Order Report', 'status-wise-order-report'],
    ['Open Order Report', 'open-order-report'],
    ['Shipped Order Report', 'shipped-order-report'],
  ]),
  [normalizeName('Shipment')]: createNameMap([
    ['Shipment & Tracking Report', 'shipment-tracking-report'],
    ['Commision Invoice Report', 'commision-invoice-report'],
    ['Commission Invoice Report', 'commision-invoice-report'],
    ['SHIPMENT HISTORY REPORT', 'shipment-history-report'],
    ['AFTER SHIPMENT REPORT', 'after-shipment-report'],
    ['SHIPMENT DELAY REPORT', 'shipment-delay-report'],
    ['Product Comparision', 'product-comparision'],
    ['Product Comparison', 'product-comparision'],
    ['Shipped Delay Or OnTime Report', 'shipped-delay-or-ontime-report'],
    ['Shipped Not Close Status Report', 'shipped-not-close-status-report'],
  ]),
  [normalizeName('Other')]: createNameMap([
    ['User Foot Print', 'user-foot-print'],
    ['User Login Detail', 'user-login-detail'],
    ['Quick Orders Overview Report', 'quick-orders-overview-report'],
    ['DPG Report', 'dpg-report'],
    ['Production History Report', 'production-history-report'],
    ['Supplier Marchand Report', 'supplier-marchand-report'],
    ['Order Detail Report', 'order-detail-report'],
    ['Merchandiser Progress Report', 'merchandiser-progress-report'],
  ]),
  [normalizeName('Inspection')]: createNameMap([
    ['Inspection Status Report', 'inspection-status-report'],
    ['Inspection Daily Status Report', 'inspection-status-report'],
    ['Inspection Report', 'inspection-report'],
    ['Sample Inspection Report', 'sample-inspection-report'],
    ['Defect Report', 'defect-report'],
    ['Defect Comparison Report', 'defect-comparison-report'],
  ]),
};

const REPORT_ITEM_PATHS = Object.fromEntries(
  Object.entries(REPORT_ITEM_IDS).flatMap(([category, items]) =>
    Object.entries(items).map(([name, reportId]) => [
      name,
      category === normalizeName('Inspection')
        ? paths.dashboard.reports.inspectionReport(reportId)
        : `${REPORT_CATEGORY_PATHS[category]}?report=${encodeURIComponent(reportId)}`,
    ])
  )
);

const ICON_BY_NAME = createNameMap([
  ['Home', ICONS.dashboard],
  ['Dashboard', ICONS.dashboard],
  ['My Customers', ICONS.user],
  ['Customers', ICONS.user],
  ['My Suppliers', ICONS.order],
  ['Supplier', ICONS.order],
  ['QA BI', ICONS.banking],
  ['SOPs', ICONS.folder],
  ['Supply Chain', ICONS.booking],
  ['Power Tools', <SettingsIcon />],
  ['Profile Setting', ICONS.user],
  ['New Container Loading', ICONS.order],
  ['Container Loading', ICONS.order],
  ['Courier Packages', ICONS.folder],
  ['Evaluation Form', ICONS.file],
  ['Reports', ICONS.analytics],
  ['Costing', ICONS.product],
]);

function findReportCategory(ancestors) {
  if (!ancestors.some((name) => normalizeName(name) === normalizeName('Reports'))) {
    return null;
  }

  return [...ancestors]
    .reverse()
    .map(normalizeName)
    .find((name) => REPORT_CATEGORY_PATHS[name]);
}

function resolvePath(name, ancestors) {
  const normalizedName = normalizeName(name);
  const reportCategory = findReportCategory(ancestors);

  if (reportCategory) {
    const reportId = REPORT_ITEM_IDS[reportCategory]?.[normalizedName];
    if (reportId) {
      if (reportCategory === normalizeName('Inspection')) {
        return paths.dashboard.reports.inspectionReport(reportId);
      }
      return `${REPORT_CATEGORY_PATHS[reportCategory]}?report=${encodeURIComponent(reportId)}`;
    }
  }

  const isInsideReports = ancestors.some(
    (ancestor) => normalizeName(ancestor) === normalizeName('Reports')
  );
  if (isInsideReports && REPORT_CATEGORY_PATHS[normalizedName]) {
    return REPORT_CATEGORY_PATHS[normalizedName];
  }

  return ROUTE_BY_NAME[normalizedName] ?? REPORT_ITEM_PATHS[normalizedName] ?? NOT_FOUND_PATH;
}

function getMenuChildren(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string') return [[item, {}]];
      if (item && typeof item === 'object' && !Array.isArray(item)) return Object.entries(item);
      return [];
    });
  }

  return value && typeof value === 'object' ? Object.entries(value) : [];
}

function buildMenuItem([title, value], ancestors = [], depth = 0) {
  const cleanedTitle = cleanMenuName(title);
  const isReportCategory =
    ancestors.some((ancestor) => normalizeName(ancestor) === normalizeName('Reports')) &&
    Boolean(REPORT_CATEGORY_PATHS[normalizeName(cleanedTitle)]);
  const entries = isReportCategory ? [] : getMenuChildren(value);
  const item = {
    title: cleanedTitle,
    path: resolvePath(cleanedTitle, ancestors),
  };

  if (depth === 0) {
    item.icon = ICON_BY_NAME[normalizeName(cleanedTitle)] ?? ICONS.menuItem;
  }
  if (entries.length) {
    item.children = entries.map((entry) =>
      buildMenuItem(entry, [...ancestors, cleanedTitle], depth + 1)
    );
  }

  return item;
}

// ----------------------------------------------------------------------

export function useNavData() {
  const [menu, setMenu] = useState({});

  useEffect(() => {
    let active = true;

    const loadMenu = async () => {
      try {
        const response = await axios.get(MENU_ENDPOINT);
        if (active) {
          setMenu(
            response.data && typeof response.data === 'object' && !Array.isArray(response.data)
              ? response.data
              : {}
          );
        }
      } catch (error) {
        console.error('Unable to load sidebar menu:', error);
        if (active) setMenu({});
      }
    };

    loadMenu();

    return () => {
      active = false;
    };
  }, []);

  return useMemo(
    () => [
      {
        subheader: '',
        items: Object.entries(menu).map((entry) => buildMenuItem(entry)),
      },
    ],
    [menu]
  );
}
