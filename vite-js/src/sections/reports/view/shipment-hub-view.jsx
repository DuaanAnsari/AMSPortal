import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Button,
  Select,
  MenuItem,
  Container,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import {
  fetchMilestoneSummaryDropdowns,
  getMilestoneSummaryDropdownApiBase,
  milestoneCustomerKey,
  milestoneCustomerLabel,
  milestoneMerchantKey,
  milestoneMerchantLabel,
  milestoneSupplierKey,
  milestoneSupplierLabel,
} from 'src/sections/reports/utils/milestone-summary-dropdown-api';
import { fetchPoNumbers } from 'src/sections/reports/utils/pono-dropdown-api';
import {
  buildShipmentTrackingReportPdfBlob,
  saveShipmentTrackingReportPdf,
  SHIPMENT_TRACKING_PDF_FILENAME,
  openShipmentTrackingReportPdf,
} from 'src/sections/reports/utils/shipment-tracking-report-pdf-export';
import {
  buildCommissionInvoiceReportPdfBlob,
  openCommissionInvoiceReportPdf,
  commissionInvoiceMonthLabel,
} from 'src/sections/reports/utils/commission-invoice-report-pdf-export';
import {
  buildShipmentHistoryReportPdfBlob,
  openShipmentHistoryReportPdf,
  shipmentHistoryHeaderDate,
  SHIPMENT_HISTORY_DOCUMENT_TITLE,
  SHIPMENT_HISTORY_PDF_FILENAME,
} from 'src/sections/reports/utils/shipment-history-report-pdf-export';
import {
  buildAfterShipmentReportPdfBlob,
  openAfterShipmentReportPdf,
  afterShipmentHeaderDate,
  AFTER_SHIPMENT_DOCUMENT_TITLE,
  AFTER_SHIPMENT_PDF_FILENAME,
} from 'src/sections/reports/utils/after-shipment-report-pdf-export';
import {
  buildShipmentDelayReportPdfBlob,
  openShipmentDelayReportPdf,
  SHIPMENT_DELAY_PDF_FILENAME,
} from 'src/sections/reports/utils/shipment-delay-report-pdf-export';
import {
  buildProductComparisionReportPdfBlob,
  openProductComparisionReportPdf,
  PRODUCT_COMPARISION_PDF_FILENAME,
} from 'src/sections/reports/utils/product-comparision-report-pdf-export';
import {
  buildShippedDelayOnTimeReportPdfBlob,
  openShippedDelayOnTimeReportPdf,
  shippedDelayHeaderDate,
  SHIPPED_DELAY_ONTIME_PDF_FILENAME,
} from 'src/sections/reports/utils/shipped-delay-ontime-report-pdf-export';
import {
  buildShippedNotCloseStatusReportPdfBlob,
  openShippedNotCloseStatusReportPdf,
  shippedNotCloseHeaderDate,
  SHIPPED_NOT_CLOSE_PDF_FILENAME,
} from 'src/sections/reports/utils/shipped-not-close-status-report-pdf-export';

// ----------------------------------------------------------------------

/**
 * Sidebar entries for the Shipment hub. Labels mirror the legacy report names exactly
 * (including spelling like "Commision" / "Comparision") so URL slugs stay stable when
 * backend wiring lands later.
 */
export const SHIPMENT_REPORT_OPTIONS = [
  { id: 'shipment-tracking-report', label: 'Shipment & Tracking Report' },
  { id: 'commision-invoice-report', label: 'Commision Invoice Report' },
  { id: 'shipment-history-report', label: 'SHIPMENT HISTORY REPORT' },
  { id: 'after-shipment-report', label: 'AFTER SHIPMENT REPORT' },
  { id: 'shipment-delay-report', label: 'SHIPMENT DELAY REPORT' },
  { id: 'product-comparision', label: 'Product Comparision' },
  { id: 'shipped-delay-or-ontime-report', label: 'Shipped Delay Or OnTime Report' },
  { id: 'shipped-not-close-status-report', label: 'Shipped Not Close Status Report' },
];

const DEFAULT_REPORT_ID = 'shipment-tracking-report';
const REPORT_QUERY_KEY = 'report';

const ALL = 'all';

function shipmentAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const cardSx = {
  p: { xs: 2, sm: 3 },
  borderRadius: 1,
  boxShadow: (theme) =>
    theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
};

const selectSx = { borderRadius: 1 };

const sectionLabelSx = {
  mb: 1,
  fontWeight: 600,
  color: 'text.secondary',
};

const SHIPMENT_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Browser tab title for this report page and its PDF preview only. */
const SHIPMENT_TRACKING_TAB_TITLE = 'Shipment Tracking Report';

/** Sentinel / empty dates must never appear on the report (e.g. 1900-01-01). */
const SHIPMENT_TRACKING_SENTINEL_DATES = new Set([
  '1900-01-01',
  '0001-01-01',
  '1970-01-01',
  '1899-12-30',
]);

function shipmentFilterIdOrZero(value) {
  const s = String(value ?? '').trim();
  if (!s || s.toLowerCase() === ALL) return '0';
  return s;
}

function unwrapShipmentTrackingList(data) {
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

function pickShipmentTrackingField(obj, ...keys) {
  if (!obj) return '';
  const match = keys.find((k) => obj[k] != null && obj[k] !== '');
  return match != null ? obj[match] : '';
}

/**
 * Format API dates for the Shipment Tracking PDF (`MM/DD/YY`).
 * null / empty / 1900-01-01 (and similar sentinels) â†’ blank.
 */
function formatShipmentTrackingReportDate(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';

  const iso = s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
  if (iso && SHIPMENT_TRACKING_SENTINEL_DATES.has(iso)) return '';

  const d = iso ? new Date(`${iso}T00:00:00`) : new Date(s);
  if (Number.isNaN(d.getTime())) return '';

  const yyyy = d.getFullYear();
  const mmPad = String(d.getMonth() + 1).padStart(2, '0');
  const ddPad = String(d.getDate()).padStart(2, '0');
  if (SHIPMENT_TRACKING_SENTINEL_DATES.has(`${yyyy}-${mmPad}-${ddPad}`)) return '';

  const yy = String(yyyy).slice(-2);
  return `${mmPad}/${ddPad}/${yy}`;
}

function mapShipmentTrackingApiRowToPdfRow(raw) {
  const remarkParts = [
    pickShipmentTrackingField(raw, 'UpdateSheetremarks', 'updateSheetremarks'),
    pickShipmentTrackingField(raw, 'ShipRemarks', 'shipRemarks'),
    (() => {
      const v = formatShipmentTrackingReportDate(
        pickShipmentTrackingField(raw, 'EntryFiledDate', 'entryFiledDate')
      );
      return v ? `Entry Filed: ${v}` : '';
    })(),
    (() => {
      const v = formatShipmentTrackingReportDate(
        pickShipmentTrackingField(raw, 'GoodsClearedDate', 'goodsClearedDate')
      );
      return v ? `Goods Cleared: ${v}` : '';
    })(),
    (() => {
      const v = formatShipmentTrackingReportDate(
        pickShipmentTrackingField(raw, 'DocstoBrokerDate', 'docstoBrokerDate')
      );
      return v ? `Docs to Broker: ${v}` : '';
    })(),
    (() => {
      const v = formatShipmentTrackingReportDate(
        pickShipmentTrackingField(raw, 'DocstoBankDate', 'docstoBankDate')
      );
      return v ? `Docs to Bank: ${v}` : '';
    })(),
    (() => {
      const v = formatShipmentTrackingReportDate(
        pickShipmentTrackingField(raw, 'ETDActualDate', 'etdActualDate')
      );
      return v ? `ETD Actual: ${v}` : '';
    })(),
    pickShipmentTrackingField(raw, 'PoCommission', 'poCommission') &&
      `Commission: ${pickShipmentTrackingField(raw, 'PoCommission', 'poCommission')}`,
    pickShipmentTrackingField(raw, 'NewCurrency', 'newCurrency') &&
      `Currency: ${pickShipmentTrackingField(raw, 'NewCurrency', 'newCurrency')}`,
    [
      pickShipmentTrackingField(raw, 'CusAddress', 'cusAddress'),
      pickShipmentTrackingField(raw, 'CusCity', 'cusCity'),
      pickShipmentTrackingField(raw, 'CusCountry', 'cusCountry'),
    ]
      .filter(Boolean)
      .join(', '),
    pickShipmentTrackingField(raw, 'venderCity', 'VenderCity', 'vendorCity') &&
      `Vendor City: ${pickShipmentTrackingField(raw, 'venderCity', 'VenderCity', 'vendorCity')}`,
  ].filter(Boolean);

  const shipCartons = pickShipmentTrackingField(raw, 'ShipCartons', 'shipCartons', 'Cartons', 'cartons');

  return {
    vendor: pickShipmentTrackingField(raw, 'CargoConsigneeName', 'cargoConsigneeName'),
    poNo: pickShipmentTrackingField(raw, 'PONO', 'pono', 'PONo', 'poNo'),
    vpoActualDate: formatShipmentTrackingReportDate(
      pickShipmentTrackingField(raw, 'VPOActualDate', 'vpoActualDate')
    ),
    styleNo: pickShipmentTrackingField(raw, 'Styles', 'styles'),
    ldpInvoiceNo: pickShipmentTrackingField(raw, 'LDPInvoiceNo', 'ldpInvoiceNo'),
    qtyUnits: Number(pickShipmentTrackingField(raw, 'ShipQty', 'shipQty')) || 0,
    shippedCtns: Number(shipCartons) || shipCartons || '',
    mblAwblNo: pickShipmentTrackingField(raw, 'BillNo', 'billNo'),
    containerNo: pickShipmentTrackingField(raw, 'ContainerNo', 'containerNo'),
    destination: pickShipmentTrackingField(raw, 'CarGoDestination', 'cargoDestination', 'CargoDestination'),
    shipmentEtd: formatShipmentTrackingReportDate(
      pickShipmentTrackingField(raw, 'ETDExpectedDate', 'etdExpectedDate')
    ),
    shipmentEta: formatShipmentTrackingReportDate(
      pickShipmentTrackingField(raw, 'ETAExpectedDate', 'etaExpectedDate')
    ),
    shipmentEtw: formatShipmentTrackingReportDate(pickShipmentTrackingField(raw, 'ETWDate', 'etwDate')),
    revisedEtd: formatShipmentTrackingReportDate(pickShipmentTrackingField(raw, 'RevisedETD', 'revisedETD')),
    revisedEta: formatShipmentTrackingReportDate(pickShipmentTrackingField(raw, 'RevisedETA', 'revisedETA')),
    revisedEtw: formatShipmentTrackingReportDate(
      pickShipmentTrackingField(raw, 'ReverseETWDate', 'reverseETWDate', 'ReverseEtwDate')
    ),
    actualEta: formatShipmentTrackingReportDate(
      pickShipmentTrackingField(raw, 'ETAActualDate', 'etaActualDate')
    ),
    actualEtw: formatShipmentTrackingReportDate(pickShipmentTrackingField(raw, 'ActualETW', 'actualETW')),
    containerRelease: formatShipmentTrackingReportDate(
      pickShipmentTrackingField(raw, 'ContainerReleaseDate', 'containerReleaseDate')
    ),
    containerDelivery: formatShipmentTrackingReportDate(
      pickShipmentTrackingField(raw, 'ContainerDeliveryDateASTWH', 'containerDeliveryDateASTWH')
    ),
    warehouseName: pickShipmentTrackingField(raw, 'WareHouseName', 'wareHouseName', 'WarehouseName'),
    truckerName: pickShipmentTrackingField(raw, 'TruckerName', 'truckerName'),
    remarks: remarkParts.join(' | '),
    voyageMode: pickShipmentTrackingField(raw, 'Mode', 'mode'),
    voyageName: pickShipmentTrackingField(raw, 'VoyageFlight', 'voyageFlight'),
    description: pickShipmentTrackingField(raw, 'ItemDescriptionShippingInvoice', 'itemDescriptionShippingInvoice'),
    _customer: pickShipmentTrackingField(raw, 'CustomerName', 'customerName'),
    _cargoId: pickShipmentTrackingField(raw, 'CargoID', 'cargoID', 'cargoId'),
    _poid: pickShipmentTrackingField(raw, 'POID', 'poid'),
  };
}

function buildShipmentTrackingReportPdfPayload(rawRows) {
  const customerMap = new Map();

  (rawRows || []).forEach((raw) => {
    const row = mapShipmentTrackingApiRowToPdfRow(raw);
    const customer = row._customer || 'â€”';
    if (!customerMap.has(customer)) customerMap.set(customer, new Map());

    const cargoKey = String(row._cargoId || row.mblAwblNo || row.containerNo || row._poid || 'default');
    const subMap = customerMap.get(customer);
    if (!subMap.has(cargoKey)) subMap.set(cargoKey, []);
    subMap.get(cargoKey).push(row);
  });

  const groups = [...customerMap.entries()].map(([customer, subMap]) => {
    const subGroups = [];
    let customerQty = 0;
    let customerCtns = 0;

    subMap.forEach((rows) => {
      const subQty = rows.reduce((sum, r) => sum + (Number(r.qtyUnits) || 0), 0);
      const subCtns = rows.reduce((sum, r) => sum + (Number(r.shippedCtns) || 0), 0);
      subGroups.push({
        rows: rows.map(({ _customer, _cargoId, _poid, ...rest }) => rest),
        subtotal: { qty: subQty, ctns: subCtns },
      });
      customerQty += subQty;
      customerCtns += subCtns;
    });

    return { customer, subGroups, total: { qty: customerQty, ctns: customerCtns } };
  });

  return { printedBy: '', groups };
}

function unwrapShipmentHistoryList(data) {
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

function pickShipmentHistoryField(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function formatShipmentHistoryReportDate(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function mapShipmentHistoryApiRowToPdfRow(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    shipmentDate: formatShipmentHistoryReportDate(
      pickShipmentHistoryField(r, 'ShipmentDate', 'shipmentDate')
    ),
    invoiceNo: String(pickShipmentHistoryField(r, 'InvoiceNo', 'invoiceNo') || ''),
    vendorInvoiceNo: String(
      pickShipmentHistoryField(r, 'VendorInvoiceNo', 'vendorInvoiceNo') || ''
    ),
    containerNo: String(pickShipmentHistoryField(r, 'ContainerNo', 'containerNo') || ''),
    shipmentMode: String(pickShipmentHistoryField(r, 'Mode', 'mode') || ''),
    shippedQty: Number(pickShipmentHistoryField(r, 'Quantity', 'quantity')) || 0,
    cartons: Number(pickShipmentHistoryField(r, 'Cartons', 'cartons')) || 0,
    expEtdDate: formatShipmentHistoryReportDate(
      pickShipmentHistoryField(r, 'ETDExpectedDate', 'etdExpectedDate')
    ),
  };
}

function shipmentHistoryModeParam(value) {
  const s = String(value ?? '').trim();
  if (!s || s.toLowerCase() === ALL) return 'All';
  return s;
}

async function fetchShipmentHistoryReportRows(params, headers = {}) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams({
    dateFrom: String(params.dateFrom || ''),
    dateTo: String(params.dateTo || ''),
    shipmentMode: shipmentHistoryModeParam(params.shipmentMode),
  });

  const url = `${base}/api/Report/ShipmentHistoryReport?${q.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`ShipmentHistoryReport API failed (${res.status})`);
  }

  const data = await res.json();
  return unwrapShipmentHistoryList(data);
}

function buildShipmentHistoryReportPdfPayload(rawRows, meta = {}) {
  return {
    fromLabel: meta.fromLabel || '',
    toLabel: meta.toLabel || '',
    rows: (rawRows || []).map(mapShipmentHistoryApiRowToPdfRow),
  };
}

function unwrapAfterShipmentList(data) {
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

function pickAfterShipmentField(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function pickAfterShipmentNumeric(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
  }
  return undefined;
}

function formatAfterShipmentReportDate(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function mapAfterShipmentApiRowToPdfRow(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    pono: String(pickAfterShipmentField(r, 'PONO', 'pono') || ''),
    customer: String(pickAfterShipmentField(r, 'CustomerName', 'customerName') || ''),
    vendor: String(pickAfterShipmentField(r, 'VenderName', 'venderName', 'VendorName', 'vendorName') || ''),
    orderQty: pickAfterShipmentNumeric(r, 'POQty', 'poQty'),
    shipmentDateB: formatAfterShipmentReportDate(
      pickAfterShipmentField(
        r,
        'Shipment Date (Buyer)',
        'ShipmentDateBuyer',
        'shipmentDateBuyer'
      )
    ),
    shipmentDateV: formatAfterShipmentReportDate(
      pickAfterShipmentField(
        r,
        'Shipment Date (Vendor)',
        'ShipmentDateVendor',
        'shipmentDateVendor'
      )
    ),
    cargoShipDate: formatAfterShipmentReportDate(
      pickAfterShipmentField(r, 'ShipmentDateCargo', 'shipmentDateCargo')
    ),
    shippedQty: pickAfterShipmentNumeric(r, 'ShipQuantity', 'shipQuantity'),
    shippedCarton: pickAfterShipmentNumeric(r, 'ShipCartons', 'shipCartons'),
    rShipmentDateB: formatAfterShipmentReportDate(
      pickAfterShipmentField(r, 'BuyerReviseShipment', 'buyerReviseShipment')
    ),
    rShipmentDateV: formatAfterShipmentReportDate(
      pickAfterShipmentField(r, 'VendorReviseShipment', 'vendorReviseShipment')
    ),
    reason: String(
      pickAfterShipmentField(r, 'ReasonforReviseShpmnt', 'reasonforReviseShpmnt', 'ReasonForReviseShpmnt') ||
        ''
    ),
  };
}

async function fetchAfterShipmentReportRows(params, headers = {}) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams({
    dateFrom: String(params.dateFrom || ''),
    dateTo: String(params.dateTo || ''),
  });

  const url = `${base}/api/Report/AfterShipmentReport?${q.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`AfterShipmentReport API failed (${res.status})`);
  }

  const data = await res.json();
  return unwrapAfterShipmentList(data);
}

function buildAfterShipmentReportPdfPayload(rawRows, meta = {}) {
  return {
    fromLabel: meta.fromLabel || '',
    toLabel: meta.toLabel || '',
    rows: (rawRows || []).map(mapAfterShipmentApiRowToPdfRow),
  };
}

async function fetchShipmentTrackingReportRows(params, headers = {}) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams({
    fromDate: String(params.fromDate || ''),
    toDate: String(params.toDate || ''),
    marchandiserId: shipmentFilterIdOrZero(params.marchandiserId),
  });

  const url = `${base}/api/Report/ShipmentTrackingReport?${q.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`ShipmentTrackingReport API failed (${res.status})`);
  }

  const data = await res.json();
  return unwrapShipmentTrackingList(data);
}

// ----------------------------------------------------------------------
// Shipment & Tracking Report (default landing form)
// ----------------------------------------------------------------------

/**
 * Default Shipment hub form â€” three filter rows + centered action buttons.
 * Customer / Supplier / Merchandiser come from the shared Milestone Summary
 * env-backed dropdown API. Container No. / PO No / Style No are free-text
 * inputs (per spec) and Shipment Mode is a placeholder select until the
 * backend list is confirmed.
 */
function ShipmentTrackingReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    merchandiser: ALL,
    containerNo: '',
    poNo: '',
    styleNo: '',
    shipmentMode: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = SHIPMENT_TRACKING_TAB_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  // Drop any leftover Service Worker from the reverted named-URL experiment.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          regs
            .filter((r) => {
              const script = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
              const scope = r.scope || '';
              return (
                script.includes('/__shipment_tracking_pdf__/') ||
                scope.includes('/__shipment_tracking_pdf__/')
              );
            })
            .map((r) => r.unregister())
        );
        if (!cancelled && 'caches' in window) {
          await caches.delete('shipment-tracking-pdf-v1');
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleText = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchShipmentTrackingPayload = useCallback(async () => {
    const { fromDate, toDate, merchandiser } = filters;
    const rawRows = await fetchShipmentTrackingReportRows(
      {
        fromDate,
        toDate,
        marchandiserId: merchandiser,
      },
      shipmentAuthHeaders()
    );

    if (!rawRows.length) return null;
    return buildShipmentTrackingReportPdfPayload(rawRows);
  }, [filters.merchandiser, filters.fromDate, filters.toDate]);

  /**
   * Fetch ShipmentTrackingReport (ENV base URL), map API fields onto the existing
   * PDF row shape, then preview or download. Layout / columns unchanged.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;

      const { fromDate, toDate } = filters;
      if (!fromDate || !toDate) {
        enqueueSnackbar('Fill From and To dates', { variant: 'warning' });
        return;
      }
      if (!SHIPMENT_ISO_DATE.test(fromDate) || !SHIPMENT_ISO_DATE.test(toDate)) {
        enqueueSnackbar('Dates must be yyyy-mm-dd', { variant: 'warning' });
        return;
      }

      setGeneratingPdf(true);
      try {
        const payload = await fetchShipmentTrackingPayload();
        if (!payload) {
          enqueueSnackbar('No data found for the selected filters.', { variant: 'warning' });
          return;
        }

        if (mode === 'view') {
          // Restore normal flow: blob File â†’ createObjectURL â†’ window.open (native viewer).
          // No about:blank, no Service Worker, no custom PDF route.
          // Filename assigned on File: "Shipment Tracking Report.pdf"
          const blob = await buildShipmentTrackingReportPdfBlob(payload);
          openShipmentTrackingReportPdf('view', blob);
          return;
        }

        // Page "Download PDF" â€” jsPDF doc.save with exact filename.
        await saveShipmentTrackingReportPdf(payload, SHIPMENT_TRACKING_PDF_FILENAME);
      } catch (err) {
        console.error('[ShipmentTracking] PDF build failed', err);
        enqueueSnackbar(
          err?.message?.includes('VITE_API_BASE_URL')
            ? 'API URL missing: set VITE_API_BASE_URL'
            : 'Could not build Shipment Tracking PDF',
          { variant: 'error' }
        );
      } finally {
        setGeneratingPdf(false);
      }
    },
    [filters.fromDate, filters.toDate, generatingPdf, enqueueSnackbar, fetchShipmentTrackingPayload]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Shipment filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(shipmentAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[Shipment] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** If a chosen key disappears from the latest API list, reset back to "All". */
  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (prev.customer !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev.customer)) {
        next.customer = ALL;
        changed = true;
      }
      if (prev.supplier !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) {
        next.supplier = ALL;
        changed = true;
      }
      if (
        prev.merchandiser !== ALL &&
        !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)
      ) {
        next.merchandiser = ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Shipment Tracking Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Customer :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.customer}
              onChange={handleSelect('customer')}
              sx={selectSx}
              disabled={loadingDropdowns && customers.length === 0}
            >
              <MenuItem value={ALL}>All Customer</MenuItem>
              {customers
                .filter((row) => milestoneCustomerKey(row))
                .map((row) => {
                  const val = milestoneCustomerKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneCustomerLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={loadingDropdowns && suppliers.length === 0}
            >
              <MenuItem value={ALL}>All Vendor</MenuItem>
              {suppliers
                .filter((row) => milestoneSupplierKey(row))
                .map((row) => {
                  const val = milestoneSupplierKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneSupplierLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Merchandiser :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.merchandiser}
              onChange={handleSelect('merchandiser')}
              sx={selectSx}
              disabled={loadingDropdowns && merchants.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {merchants
                .filter((row) => milestoneMerchantKey(row))
                .map((row) => {
                  const val = milestoneMerchantKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneMerchantLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Container No. :
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={filters.containerNo}
            onChange={handleText('containerNo')}
            placeholder=""
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            PO No :
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={filters.poNo}
            onChange={handleText('poNo')}
            placeholder=""
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Style No :
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={filters.styleNo}
            onChange={handleText('styleNo')}
            placeholder=""
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Shipment Mode :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.shipmentMode}
              onChange={handleSelect('shipmentMode')}
              sx={selectSx}
            >
              <MenuItem value={ALL}>All</MenuItem>
              <MenuItem value="BY AIR">BY AIR</MenuItem>
              <MenuItem value="BY SEA">BY SEA</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            From :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.fromDate}
            onChange={handleDate('fromDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            To :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.toDate}
            onChange={handleDate('toDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Commision Invoice Report â€” "Logistic Department Shipped Status Download"
// ----------------------------------------------------------------------

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

/** Year list: current year Â± 5 (newest first) â€” matches the typical legacy range. */
function buildYearOptions() {
  const now = new Date().getFullYear();
  const start = now - 5;
  const end = now + 5;
  const years = [];
  for (let y = end; y >= start; y -= 1) years.push(y);
  return years;
}

const COMMISSION_INVOICE_TAB_TITLE = 'Logistic Department Shipped';

function unwrapCommissionInvoiceList(data) {
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

function pickCommissionInvoiceField(obj, ...keys) {
  if (!obj) return '';
  const match = keys.find((k) => obj[k] != null && obj[k] !== '');
  return match != null ? obj[match] : '';
}

/** Match existing demo date cells (`08-Jan-2026`). */
function formatCommissionInvoiceShipmentDate(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';

  const iso = s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
  const d = iso ? new Date(`${iso}T00:00:00`) : new Date(s);
  if (Number.isNaN(d.getTime())) return '';

  const dd = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleDateString('en-US', { month: 'short' });
  return `${dd}-${mon}-${d.getFullYear()}`;
}

function mapCommissionInvoiceApiRowToPdfRow(raw) {
  const quantityRaw = pickCommissionInvoiceField(raw, 'Quantity', 'quantity');

  return {
    shipmentDate: formatCommissionInvoiceShipmentDate(
      pickCommissionInvoiceField(raw, 'ShipmentDate', 'shipmentDate')
    ),
    supplierName: pickCommissionInvoiceField(raw, 'VenderName', 'venderName', 'VendorName', 'vendorName'),
    orderNo: pickCommissionInvoiceField(raw, 'PONO', 'pono', 'PONo', 'poNo'),
    ldpInvoiceNo: pickCommissionInvoiceField(raw, 'LDPInvoiceNo', 'ldpInvoiceNo'),
    invoiceNo: pickCommissionInvoiceField(raw, 'InvoiceNo', 'invoiceNo'),
    quantity: quantityRaw === '' ? '' : Number(quantityRaw),
    unitPrice: pickCommissionInvoiceField(raw, 'ShippedRate', 'shippedRate'),
    totalValue: pickCommissionInvoiceField(raw, 'InvoiceValue', 'invoiceValue'),
    commissionPct: pickCommissionInvoiceField(raw, 'Commission', 'commission'),
    commissionValue: pickCommissionInvoiceField(raw, 'CommissionValue', 'commissionValue'),
  };
}

function buildCommissionInvoiceReportPdfPayload(rawRows, meta = {}) {
  return {
    monthLabel: meta.monthLabel || '',
    year: meta.year,
    rows: (rawRows || []).map(mapCommissionInvoiceApiRowToPdfRow),
  };
}

async function fetchShipmentCommissionReportRows(params, headers = {}) {
  const base = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const monthNum = Number(params.month);
  const month = Number.isFinite(monthNum)
    ? String(monthNum).padStart(2, '0')
    : String(params.month || '');

  const q = new URLSearchParams({
    year: String(params.year || ''),
    month,
    marchandiserId: shipmentFilterIdOrZero(params.marchandiserId),
  });

  const url = `${base}/api/Report/ShipmentCommissionReport?${q.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`ShipmentCommissionReport API failed (${res.status})`);
  }

  const data = await res.json();
  return unwrapCommissionInvoiceList(data);
}

/**
 * "Logistic Department Shipped Status Download" form.
 *
 * 2 Ã— 3 filter grid (Consignee, Month, Year / Supplier, Merchandiser, PO #) +
 * centered action row (View Report, Download PDF, Download Excel) + a small
 * italicized footnote â€” exactly per the legacy mock-up.
 *
 * Dropdowns are wired to the shared APIs:
 *   - Customer / Supplier / Merchandiser  â†’  fetchMilestoneSummaryDropdowns
 *   - PO #                                â†’  fetchPoNumbers (scoped by selected
 *                                            Customer + Supplier)
 *
 * Action buttons currently toast â€” they'll hook into the real backend endpoint
 * once it's confirmed, just like the rest of the Shipment hub.
 */
function CommisionInvoiceReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const now = new Date();
  const [filters, setFilters] = useState({
    consignee: ALL,
    month: 5, // May
    year: now.getFullYear(),
    supplier: ALL,
    merchandiser: ALL,
    po: ALL,
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const [poNumbers, setPoNumbers] = useState([]);
  const [loadingPoNumbers, setLoadingPoNumbers] = useState(false);

  const yearOptions = useMemo(buildYearOptions, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = COMMISSION_INVOICE_TAB_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchCommissionInvoicePayload = useCallback(async () => {
    const { year, month, merchandiser } = filters;
    const rawRows = await fetchShipmentCommissionReportRows(
      {
        year,
        month,
        marchandiserId: merchandiser,
      },
      shipmentAuthHeaders()
    );

    if (!rawRows.length) return null;
    return buildCommissionInvoiceReportPdfPayload(rawRows, {
      monthLabel: commissionInvoiceMonthLabel(month),
      year,
    });
  }, [filters.year, filters.month, filters.merchandiser]);

  /**
   * Fetch ShipmentCommissionReport via VITE_API_BASE_URL, map onto existing PDF
   * columns, then preview or download. Layout unchanged.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const payload = await fetchCommissionInvoicePayload();
        if (!payload) {
          if (previewWindow) {
            try {
              previewWindow.close();
            } catch {
              /* ignore */
            }
          }
          enqueueSnackbar('No data found for the selected filters.', { variant: 'warning' });
          return;
        }

        const blob = await buildCommissionInvoiceReportPdfBlob(payload);
        if (mode === 'view' && previewWindow) {
          const namedFile =
            typeof File !== 'undefined'
              ? new File([blob], 'Logistic Department Shipped.pdf', { type: 'application/pdf' })
              : new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(namedFile);
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openCommissionInvoiceReportPdf(mode, blob);
      } catch (err) {
        console.error('[CommissionInvoice] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar(
          err?.message?.includes('VITE_API_BASE_URL')
            ? 'API URL missing: set VITE_API_BASE_URL'
            : 'Could not build Commission Invoice PDF',
          { variant: 'error' }
        );
      } finally {
        setGeneratingPdf(false);
      }
    },
    [generatingPdf, enqueueSnackbar, fetchCommissionInvoicePayload]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  /** Customer / Supplier / Merchandiser lists. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Commision Invoice filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(shipmentAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[CommisionInvoice] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset selected dropdown values if they disappear after a refresh. */
  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (prev.consignee !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev.consignee)) {
        next.consignee = ALL;
        changed = true;
      }
      if (prev.supplier !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) {
        next.supplier = ALL;
        changed = true;
      }
      if (
        prev.merchandiser !== ALL &&
        !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)
      ) {
        next.merchandiser = ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants]);

  /**
   * PO# list â€” scoped by Consignee (customer) + Supplier.
   * Aborts in-flight requests on dependency change.
   */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoadingPoNumbers(true);
    (async () => {
      try {
        const list = await fetchPoNumbers(
          {
            customerId: filters.consignee !== ALL ? filters.consignee : undefined,
            supplierId: filters.supplier !== ALL ? filters.supplier : undefined,
            signal: controller.signal,
          },
          shipmentAuthHeaders()
        );
        if (!cancelled) setPoNumbers(list);
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        console.error('[CommisionInvoice] PO# list', err);
        if (!cancelled) {
          setPoNumbers([]);
          enqueueSnackbar('Could not load PO list', { variant: 'error' });
        }
      } finally {
        if (!cancelled) setLoadingPoNumbers(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters.consignee, filters.supplier, enqueueSnackbar]);

  /** Reset PO# selection if the chosen value disappeared after a refresh. */
  useEffect(() => {
    setFilters((prev) => {
      if (prev.po === ALL) return prev;
      if (poNumbers.includes(prev.po)) return prev;
      return { ...prev, po: ALL };
    });
  }, [poNumbers]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Logistic Department Shipped Status Download
      </Typography>

      <Grid container spacing={2.5}>
        {/* Row 1: Consignee | Month | Year */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Consignee :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.consignee}
              onChange={handleSelect('consignee')}
              sx={selectSx}
              disabled={loadingDropdowns && customers.length === 0}
            >
              <MenuItem value={ALL}>All Customer</MenuItem>
              {customers
                .filter((row) => milestoneCustomerKey(row))
                .map((row) => {
                  const val = milestoneCustomerKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneCustomerLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Month :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.month} onChange={handleSelect('month')} sx={selectSx}>
              {MONTH_OPTIONS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Year :
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={filters.year} onChange={handleSelect('year')} sx={selectSx}>
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Row 2: Supplier | Merchandiser | PO # */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={loadingDropdowns && suppliers.length === 0}
            >
              <MenuItem value={ALL}>All Supplier</MenuItem>
              {suppliers
                .filter((row) => milestoneSupplierKey(row))
                .map((row) => {
                  const val = milestoneSupplierKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneSupplierLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Merchandiser :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.merchandiser}
              onChange={handleSelect('merchandiser')}
              sx={selectSx}
              disabled={loadingDropdowns && merchants.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {merchants
                .filter((row) => milestoneMerchantKey(row))
                .map((row) => {
                  const val = milestoneMerchantKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneMerchantLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            PO # :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.po}
              onChange={handleSelect('po')}
              sx={selectSx}
              disabled={loadingPoNumbers}
              renderValue={(val) => {
                if (loadingPoNumbers && val === ALL) return 'Loadingâ€¦';
                return val === ALL ? 'All' : val;
              }}
              endAdornment={
                loadingPoNumbers ? (
                  <CircularProgress size={14} sx={{ mr: 3 }} />
                ) : null
              }
            >
              <MenuItem value={ALL}>All</MenuItem>
              {poNumbers.length === 0 && !loadingPoNumbers ? (
                <MenuItem value="" disabled>
                  No PO Found
                </MenuItem>
              ) : (
                poNumbers.map((pn) => (
                  <MenuItem key={pn} value={pn}>
                    {pn}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>

        {/* Centered action row */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 1,
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            * All selection must be belongs to logistic dept.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Shipment History Report
// ----------------------------------------------------------------------

/**
 * "Shipment History Report" form.
 *
 * Per the legacy mock-up this is a slim 3-column filter:
 *   Shipment Mode  |  From (date)  |  To (date)
 * followed by a centered action row (View Report, Download PDF, Download Excel).
 *
 * Action buttons toast for now â€” they'll hook into the real backend endpoint
 * once it's confirmed.
 */
function ShipmentHistoryReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    shipmentMode: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchShipmentHistoryPayload = useCallback(async () => {
    const rawRows = await fetchShipmentHistoryReportRows(
      {
        dateFrom: filters.fromDate,
        dateTo: filters.toDate,
        shipmentMode: filters.shipmentMode,
      },
      shipmentAuthHeaders()
    );

    return buildShipmentHistoryReportPdfPayload(rawRows, {
      fromLabel: shipmentHistoryHeaderDate(filters.fromDate),
      toLabel: shipmentHistoryHeaderDate(filters.toDate),
    });
  }, [filters.fromDate, filters.toDate, filters.shipmentMode]);

  /**
   * Fetch ShipmentHistoryReport (ENV base URL), map API fields onto the existing
   * PDF columns, then preview or download. Layout unchanged.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const payload = await fetchShipmentHistoryPayload();
        const blob = await buildShipmentHistoryReportPdfBlob(payload);
        if (mode === 'view' && previewWindow) {
          try {
            const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${SHIPMENT_HISTORY_DOCUMENT_TITLE}</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fafafa;color:#333;"><p style="padding:24px;font-size:15px;">Loading PDFâ€¦</p></body></html>`;
            previewWindow.document.open();
            previewWindow.document.write(html);
            previewWindow.document.close();
          } catch {
            /* ignore */
          }
          const namedPdf =
            typeof File !== 'undefined'
              ? new File([blob], SHIPMENT_HISTORY_PDF_FILENAME, { type: 'application/pdf' })
              : blob;
          const url = URL.createObjectURL(namedPdf);
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openShipmentHistoryReportPdf(mode, blob);
      } catch (err) {
        console.error('[ShipmentHistory] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build Shipment History PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [fetchShipmentHistoryPayload, generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Shipment History Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Shipment Mode :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.shipmentMode}
              onChange={handleSelect('shipmentMode')}
              sx={selectSx}
            >
              <MenuItem value={ALL}>All</MenuItem>
              <MenuItem value="BY AIR">BY AIR</MenuItem>
              <MenuItem value="BY SEA">BY SEA</MenuItem>
              <MenuItem value="BY COURIER">BY COURIER</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            From :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.fromDate}
            onChange={handleDate('fromDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            To :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.toDate}
            onChange={handleDate('toDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// After Shipment Report
// ----------------------------------------------------------------------

/**
 * "AFTER SHIPMENT REPORT" form.
 *
 * Minimal 2-column filter (From / To dates) followed by a centered action row.
 * Backend wiring lands later â€” buttons currently toast.
 */
function AfterShipmentReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchAfterShipmentPayload = useCallback(async () => {
    const rawRows = await fetchAfterShipmentReportRows(
      {
        dateFrom: filters.fromDate,
        dateTo: filters.toDate,
      },
      shipmentAuthHeaders()
    );

    return buildAfterShipmentReportPdfPayload(rawRows, {
      fromLabel: afterShipmentHeaderDate(filters.fromDate),
      toLabel: afterShipmentHeaderDate(filters.toDate),
    });
  }, [filters.fromDate, filters.toDate]);

  /**
   * Fetch AfterShipmentReport (ENV base URL), map API fields onto the existing
   * PDF columns, then preview or download. Layout unchanged.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const payload = await fetchAfterShipmentPayload();
        const blob = await buildAfterShipmentReportPdfBlob(payload);
        if (mode === 'view' && previewWindow) {
          try {
            const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${AFTER_SHIPMENT_DOCUMENT_TITLE}</title></head><body style="margin:0;font-family:system-ui,sans-serif;background:#fafafa;color:#333;"><p style="padding:24px;font-size:15px;">Loading PDFâ€¦</p></body></html>`;
            previewWindow.document.open();
            previewWindow.document.write(html);
            previewWindow.document.close();
          } catch {
            /* ignore */
          }
          const namedPdf =
            typeof File !== 'undefined'
              ? new File([blob], AFTER_SHIPMENT_PDF_FILENAME, { type: 'application/pdf' })
              : blob;
          const url = URL.createObjectURL(namedPdf);
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openAfterShipmentReportPdf(mode, blob);
      } catch (err) {
        console.error('[AfterShipment] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar('Could not build After Shipment PDF', { variant: 'error' });
      } finally {
        setGeneratingPdf(false);
      }
    },
    [fetchAfterShipmentPayload, generatingPdf, enqueueSnackbar]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 3,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        AFTER SHIPMENT REPORT
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            From :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.fromDate}
            onChange={handleDate('fromDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            To :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.toDate}
            onChange={handleDate('toDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Shipment Delay Report
// ----------------------------------------------------------------------

const SHIPMENT_DELAY_TAB_TITLE = 'Shipment Delay Report';

function unwrapShipmentDelayList(data) {
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

function pickShipmentDelayField(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function pickShipmentDelayNumeric(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
  }
  return undefined;
}

/** Match existing demo date cells (`Apr 07, 2026`). */
function formatShipmentDelayReportDate(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function mapShipmentDelayApiRowToPdfRow(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    poNo: String(pickShipmentDelayField(r, 'PONO', 'pono', 'PONo', 'PoNo') || ''),
    customer: String(pickShipmentDelayField(r, 'CustomerName', 'customerName') || ''),
    vendor: String(
      pickShipmentDelayField(r, 'VenderName', 'venderName', 'VendorName', 'vendorName') || ''
    ),
    orderQty: pickShipmentDelayNumeric(r, 'POQty', 'poQty'),
    shipDateV: formatShipmentDelayReportDate(
      pickShipmentDelayField(
        r,
        'Shipment Date (Vendor)',
        'ShipmentDateVendor',
        'shipmentDateVendor',
        'VendorShipmentDate',
        'vendorShipmentDate'
      )
    ),
    shipDateB: formatShipmentDelayReportDate(
      pickShipmentDelayField(
        r,
        'Shipment Date (Buyer)',
        'ShipmentDateBuyer',
        'shipmentDateBuyer',
        'BuyerShipmentDate',
        'buyerShipmentDate'
      )
    ),
    invoiceValue: pickShipmentDelayNumeric(r, 'InvoiceValue', 'invoiceValue'),
    week1Delay: pickShipmentDelayNumeric(
      r,
      'Week1Delay',
      'week1Delay',
      'Week1Delay3',
      'WEEK1DELAY'
    ),
    week2Delay: pickShipmentDelayNumeric(
      r,
      'Week2Delay',
      'week2Delay',
      'Week2Delay5',
      'WEEK2DELAY'
    ),
    week3Delay: pickShipmentDelayNumeric(
      r,
      'Week3Delay',
      'week3Delay',
      'Week3Delay8',
      'WEEK3DELAY'
    ),
    onward10: pickShipmentDelayNumeric(
      r,
      'Onward10',
      'onward10',
      'OnwardDelay',
      'onwardDelay',
      'ONWARD10'
    ),
    reasonB: String(
      pickShipmentDelayField(
        r,
        'ReasonforReviseShpmnt',
        'reasonforReviseShpmnt',
        'ReasonForReviseShpmnt'
      ) || ''
    ),
    reasonV: String(
      pickShipmentDelayField(
        r,
        'ReasonforReviseShpmntVendor',
        'reasonforReviseShpmntVendor',
        'ReasonForReviseShpmntVendor'
      ) || ''
    ),
  };
}

async function fetchShipmentDelayReportRows(params, headers = {}) {
  const base = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams({
    marchandiserId: shipmentFilterIdOrZero(params.marchandiserId),
    customerId: shipmentFilterIdOrZero(params.customerId),
    supplierId: shipmentFilterIdOrZero(params.supplierId),
  });

  const url = `${base}/api/Report/ShipmentDelayReport?${q.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`ShipmentDelayReport API failed (${res.status})`);
  }

  const data = await res.json();
  return unwrapShipmentDelayList(data);
}

function buildShipmentDelayReportPdfPayload(rawRows) {
  return {
    rows: (rawRows || []).map(mapShipmentDelayApiRowToPdfRow),
  };
}

/**
 * "Shipment Delay Report" form.
 *
 * 3-column filter (Merchandiser, Customer, Supplier â€” all API-driven via the
 * shared Milestone Summary dropdown endpoint) followed by a centered action
 * row (View Report, Download PDF, Download Excel).
 *
 * Report data: GET `/api/Report/ShipmentDelayReport` via `VITE_API_BASE_URL`.
 */
function ShipmentDelayReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    merchandiser: ALL,
    customer: ALL,
    supplier: ALL,
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = SHIPMENT_DELAY_TAB_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchShipmentDelayPayload = useCallback(async () => {
    const { merchandiser, customer, supplier } = filters;
    const rawRows = await fetchShipmentDelayReportRows(
      {
        marchandiserId: merchandiser,
        customerId: customer,
        supplierId: supplier,
      },
      shipmentAuthHeaders()
    );

    if (!rawRows.length) return null;
    return buildShipmentDelayReportPdfPayload(rawRows);
  }, [filters.merchandiser, filters.customer, filters.supplier]);

  /**
   * Fetch ShipmentDelayReport via VITE_API_BASE_URL, map onto existing PDF
   * columns, then preview or download. Layout unchanged.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const payload = await fetchShipmentDelayPayload();
        if (!payload) {
          if (previewWindow) {
            try {
              previewWindow.close();
            } catch {
              /* ignore */
            }
          }
          enqueueSnackbar('No data found for the selected filters.', { variant: 'warning' });
          return;
        }

        const blob = await buildShipmentDelayReportPdfBlob(payload);
        if (mode === 'view' && previewWindow) {
          const namedFile =
            typeof File !== 'undefined'
              ? new File([blob], SHIPMENT_DELAY_PDF_FILENAME, { type: 'application/pdf' })
              : new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(namedFile);
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openShipmentDelayReportPdf(mode, blob);
      } catch (err) {
        console.error('[ShipmentDelay] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar(
          err?.message?.includes('VITE_API_BASE_URL')
            ? 'API URL missing: set VITE_API_BASE_URL'
            : 'Could not build Shipment Delay PDF',
          { variant: 'error' }
        );
      } finally {
        setGeneratingPdf(false);
      }
    },
    [generatingPdf, enqueueSnackbar, fetchShipmentDelayPayload]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  /** Customer / Supplier / Merchandiser lists from the shared dropdown API. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar('API URL missing: set VITE_API_BASE_URL for Shipment Delay filters', {
        variant: 'warning',
      });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(shipmentAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        setMerchants(res.merchants);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
        if (res.rejected.merchants) enqueueSnackbar('Could not load merchandisers', { variant: 'error' });
      } catch (err) {
        console.error('[ShipmentDelay] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset selected values that disappear from the latest API list. */
  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (prev.customer !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev.customer)) {
        next.customer = ALL;
        changed = true;
      }
      if (prev.supplier !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) {
        next.supplier = ALL;
        changed = true;
      }
      if (
        prev.merchandiser !== ALL &&
        !merchants.some((r) => milestoneMerchantKey(r) === prev.merchandiser)
      ) {
        next.merchandiser = ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customers, suppliers, merchants]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Shipment Delay Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Merchandiser :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.merchandiser}
              onChange={handleSelect('merchandiser')}
              sx={selectSx}
              disabled={loadingDropdowns && merchants.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {merchants
                .filter((row) => milestoneMerchantKey(row))
                .map((row) => {
                  const val = milestoneMerchantKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneMerchantLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Customer :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.customer}
              onChange={handleSelect('customer')}
              sx={selectSx}
              disabled={loadingDropdowns && customers.length === 0}
            >
              <MenuItem value={ALL}>All Customer</MenuItem>
              {customers
                .filter((row) => milestoneCustomerKey(row))
                .map((row) => {
                  const val = milestoneCustomerKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneCustomerLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={loadingDropdowns && suppliers.length === 0}
            >
              <MenuItem value={ALL}>All Supplier</MenuItem>
              {suppliers
                .filter((row) => milestoneSupplierKey(row))
                .map((row) => {
                  const val = milestoneSupplierKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneSupplierLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Product Comparision Report
// ----------------------------------------------------------------------

const PRODUCT_COMPARISION_TAB_TITLE = 'Product Comparision Report';

const PRODUCT_COMPARISION_REPORT_TYPE = {
  quantity: 1,
  fob: 2,
  ldp: 3,
};

function unwrapProductComparisionList(data) {
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

function pickProductComparisionField(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function pickProductComparisionNumeric(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
  }
  return undefined;
}

function productComparisionGroupKey(row) {
  const id = row?.ProductGroupID ?? row?.productGroupID ?? row?.productGroupId ?? row?.ProductGroupId;
  return id != null && String(id).trim() !== '' ? String(id) : '';
}

function productComparisionGroupLabel(row) {
  return String(pickProductComparisionField(row, 'ProductGroup', 'productGroup') || '').trim();
}

/**
 * Existing demo-encoded formula: More Sale % = (monthB âˆ’ monthA) / 100.
 * @param {number} monthASale
 * @param {number} monthBSale
 */
function productComparisionPercentChange(monthASale, monthBSale) {
  const a = Number(monthASale);
  const b = Number(monthBSale);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return (b - a) / 100;
}

function resolveProductComparisionMonthSales(raw, type) {
  const t = String(type || 'quantity').toLowerCase();
  if (t === 'fob') {
    return {
      monthASale: pickProductComparisionNumeric(raw, 'ShippedFOB1', 'shippedFOB1', 'ShippedFob1') ?? 0,
      monthBSale: pickProductComparisionNumeric(raw, 'ShippedFOB2', 'shippedFOB2', 'ShippedFob2') ?? 0,
    };
  }
  if (t === 'ldp') {
    return {
      monthASale: pickProductComparisionNumeric(raw, 'ShippedLDP1', 'shippedLDP1', 'ShippedLdp1') ?? 0,
      monthBSale: pickProductComparisionNumeric(raw, 'ShippedLDP2', 'shippedLDP2', 'ShippedLdp2') ?? 0,
    };
  }
  return {
    monthASale:
      pickProductComparisionNumeric(raw, 'Quantity1', 'quantity1', 'Qty1', 'qty1', 'Quantity', 'quantity') ??
      0,
    monthBSale: pickProductComparisionNumeric(raw, 'Quantity2', 'quantity2', 'Qty2', 'qty2') ?? 0,
  };
}

function mapProductComparisionApiRowToPdfRow(raw, type) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const { monthASale, monthBSale } = resolveProductComparisionMonthSales(r, type);
  return {
    product: String(pickProductComparisionField(r, 'ProductGroup', 'productGroup') || ''),
    monthASale,
    monthBSale,
    percentChange: productComparisionPercentChange(monthASale, monthBSale),
    highestMonth: '',
  };
}

async function fetchProductComparisionReportRows(params, headers = {}) {
  const base = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const reportType =
    PRODUCT_COMPARISION_REPORT_TYPE[String(params.type || 'quantity').toLowerCase()] ?? 1;

  const q = new URLSearchParams({
    reportType: String(reportType),
    year1: String(params.year1 || ''),
    month1: String(params.month1 || ''),
    year2: String(params.year2 || ''),
    month2: String(params.month2 || ''),
  });

  const productGroupId = shipmentFilterIdOrZero(params.productGroupId);
  if (productGroupId !== '0') {
    q.set('productGroupId', productGroupId);
  }

  const url = `${base}/api/Report/ProductComparisonReport?${q.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`ProductComparisonReport API failed (${res.status})`);
  }

  const data = await res.json();
  return unwrapProductComparisionList(data);
}

async function fetchProductComparisionProductGroups(headers = {}) {
  const base = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const url = `${base}/api/Report/productgroups`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`productgroups API failed (${res.status})`);
  }

  const data = await res.json();
  return unwrapProductComparisionList(data);
}

function buildProductComparisionReportPdfPayload(rawRows, meta = {}) {
  const type = meta.type || 'quantity';
  const periodA = meta.periodA || { month: 1, year: new Date().getFullYear() - 1 };
  const periodB = meta.periodB || { month: 1, year: new Date().getFullYear() };
  return {
    type,
    periodA,
    periodB,
    rows: (rawRows || []).map((row) => mapProductComparisionApiRowToPdfRow(row, type)),
  };
}

/**
 * "Product Comparision Report" form.
 *
 * Two-side layout matching the legacy print:
 *   - Left  side : Year, Month, Product       (period A + product filter)
 *   - Right side : Year, Month, Type          (period B + quantity/value mode)
 *
 * Report + Product dropdown: `VITE_API_BASE_URL`.
 */
function ProductComparisionReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const now = new Date();
  const currentYear = now.getFullYear();

  const [filters, setFilters] = useState({
    yearA: currentYear - 1,
    monthA: 1,
    product: ALL,
    yearB: currentYear,
    monthB: 1,
    type: 'quantity',
  });

  const [productGroups, setProductGroups] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const yearOptions = useMemo(buildYearOptions, []);

  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = PRODUCT_COMPARISION_TAB_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProducts(true);
      try {
        const rows = await fetchProductComparisionProductGroups(shipmentAuthHeaders());
        if (cancelled) return;
        setProductGroups(rows);
      } catch (err) {
        console.error('[ProductComparision] product groups', err);
        if (!cancelled) {
          enqueueSnackbar(
            err?.message?.includes('VITE_API_BASE_URL')
              ? 'API URL missing: set VITE_API_BASE_URL'
              : 'Could not load product groups',
            { variant: 'error' }
          );
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  useEffect(() => {
    setFilters((prev) => {
      if (prev.product === ALL) return prev;
      if (productGroups.some((r) => productComparisionGroupKey(r) === prev.product)) return prev;
      return { ...prev, product: ALL };
    });
  }, [productGroups]);

  const fetchProductComparisionPayload = useCallback(async () => {
    const periodA = { month: Number(filters.monthA), year: Number(filters.yearA) };
    const periodB = { month: Number(filters.monthB), year: Number(filters.yearB) };
    const rawRows = await fetchProductComparisionReportRows(
      {
        type: filters.type,
        year1: periodA.year,
        month1: periodA.month,
        year2: periodB.year,
        month2: periodB.month,
        productGroupId: filters.product,
      },
      shipmentAuthHeaders()
    );

    let rows = rawRows;
    if (filters.product !== ALL) {
      const selected = productGroups.find((r) => productComparisionGroupKey(r) === filters.product);
      const label = selected ? productComparisionGroupLabel(selected) : '';
      if (label) {
        rows = rawRows.filter(
          (r) =>
            String(pickProductComparisionField(r, 'ProductGroup', 'productGroup') || '')
              .trim()
              .toLowerCase() === label.toLowerCase()
        );
      }
    }

    if (!rows.length) return null;
    return buildProductComparisionReportPdfPayload(rows, {
      type: filters.type,
      periodA,
      periodB,
    });
  }, [
    filters.type,
    filters.monthA,
    filters.yearA,
    filters.monthB,
    filters.yearB,
    filters.product,
    productGroups,
  ]);

  /**
   * Fetch ProductComparisonReport via VITE_API_BASE_URL, map onto existing PDF
   * columns, then preview or download. Layout unchanged.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const payload = await fetchProductComparisionPayload();
        if (!payload) {
          if (previewWindow) {
            try {
              previewWindow.close();
            } catch {
              /* ignore */
            }
          }
          enqueueSnackbar('No data found for the selected filters.', { variant: 'warning' });
          return;
        }

        const blob = await buildProductComparisionReportPdfBlob(payload);
        if (mode === 'view' && previewWindow) {
          const namedFile =
            typeof File !== 'undefined'
              ? new File([blob], PRODUCT_COMPARISION_PDF_FILENAME, { type: 'application/pdf' })
              : new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(namedFile);
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openProductComparisionReportPdf(mode, blob);
      } catch (err) {
        console.error('[ProductComparision] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar(
          err?.message?.includes('VITE_API_BASE_URL')
            ? 'API URL missing: set VITE_API_BASE_URL'
            : 'Could not build Product Comparision PDF',
          { variant: 'error' }
        );
      } finally {
        setGeneratingPdf(false);
      }
    },
    [generatingPdf, enqueueSnackbar, fetchProductComparisionPayload]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Product Comparision Report
      </Typography>

      <Grid container spacing={2.5}>
        {/* Left side â€” Year A */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Year :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.yearA}
              onChange={handleSelect('yearA')}
              sx={selectSx}
            >
              {yearOptions.map((y) => (
                <MenuItem key={`yearA-${y}`} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Right side â€” Year B */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Year :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.yearB}
              onChange={handleSelect('yearB')}
              sx={selectSx}
            >
              {yearOptions.map((y) => (
                <MenuItem key={`yearB-${y}`} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Left side â€” Month A */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Month :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.monthA}
              onChange={handleSelect('monthA')}
              sx={selectSx}
            >
              {MONTH_OPTIONS.map((m) => (
                <MenuItem key={`monthA-${m.value}`} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Right side â€” Month B */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Month :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.monthB}
              onChange={handleSelect('monthB')}
              sx={selectSx}
            >
              {MONTH_OPTIONS.map((m) => (
                <MenuItem key={`monthB-${m.value}`} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Left side â€” Product */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Product :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.product}
              onChange={handleSelect('product')}
              sx={selectSx}
              disabled={loadingProducts && productGroups.length === 0}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {productGroups
                .filter((row) => productComparisionGroupKey(row))
                .map((row) => {
                  const val = productComparisionGroupKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {productComparisionGroupLabel(row) || val}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        {/* Right side â€” Type */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Type :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.type}
              onChange={handleSelect('type')}
              sx={selectSx}
            >
              <MenuItem value="quantity">Quantity Wise</MenuItem>
              <MenuItem value="fob">FOB Amount Wise</MenuItem>
              <MenuItem value="ldp">LDP Amount Wise</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Shipped Delay / OnTime Report
// ----------------------------------------------------------------------

const SHIPPED_DELAY_ONTIME_TAB_TITLE = 'Shipped Delay / OnTime Report';

const SHIPPED_DELAY_ONTIME_SENTINEL_DATES = new Set([
  '1900-01-01',
  '0001-01-01',
  '1970-01-01',
  '1899-12-30',
]);

function unwrapShippedDelayOnTimeList(data) {
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

function pickShippedDelayOnTimeField(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function pickShippedDelayOnTimeNumeric(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
  }
  return undefined;
}

/** Parse API date to UTC midnight; sentinel / blank â†’ null. */
function parseShippedDelayOnTimeUtcDay(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  if (SHIPPED_DELAY_ONTIME_SENTINEL_DATES.has(iso)) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Existing demo Days formula: ShipmentDate âˆ’ (Revised Ship (B) if present, else Buyer Ship Date),
 * in whole calendar days.
 */
function calcShippedDelayOnTimeDays(buyerShipRaw, revisedShipRaw, shipmentRaw) {
  const ship = parseShippedDelayOnTimeUtcDay(shipmentRaw);
  const revised = parseShippedDelayOnTimeUtcDay(revisedShipRaw);
  const buyer = parseShippedDelayOnTimeUtcDay(buyerShipRaw);
  const ref = revised != null ? revised : buyer;
  if (ship == null || ref == null) return '';
  return Math.round((ship - ref) / 86400000);
}

function formatShippedDelayOnTimeCellDate(value) {
  const utc = parseShippedDelayOnTimeUtcDay(value);
  if (utc == null) return '';
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return shippedDelayHeaderDate(`${m[1]}-${m[2]}-${m[3]}`);
}

function mapShippedDelayOnTimeApiRowToPdfRow(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const buyerShipRaw = pickShippedDelayOnTimeField(
    r,
    'CustomerShipDate',
    'customerShipDate',
    'BuyerShipDate',
    'buyerShipDate'
  );
  const revisedShipRaw = pickShippedDelayOnTimeField(
    r,
    'CustomerRevisedDate',
    'customerRevisedDate',
    'RevisedShipB',
    'revisedShipB'
  );
  const shipmentRaw = pickShippedDelayOnTimeField(
    r,
    'ShipmentDate',
    'shipmentDate'
  );

  return {
    poNo: String(pickShippedDelayOnTimeField(r, 'PONO', 'pono', 'PONo', 'PoNo') || ''),
    styleNo: String(pickShippedDelayOnTimeField(r, 'StyleNo', 'styleNo', 'StyleNO') || ''),
    customer: String(pickShippedDelayOnTimeField(r, 'CustomerName', 'customerName') || ''),
    vendor: String(
      pickShippedDelayOnTimeField(r, 'VenderName', 'venderName', 'VendorName', 'vendorName') || ''
    ),
    merchandiser: String(
      pickShippedDelayOnTimeField(r, 'Merchandiser', 'merchandiser', 'Marchandiser', 'marchandiser') ||
        ''
    ),
    invoiceNo: String(pickShippedDelayOnTimeField(r, 'InvoiceNo', 'invoiceNo') || ''),
    poQty: pickShippedDelayOnTimeNumeric(r, 'POQty', 'poQty'),
    shipQty: pickShippedDelayOnTimeNumeric(r, 'ShipQty', 'shipQty'),
    buyerShipDate: formatShippedDelayOnTimeCellDate(buyerShipRaw),
    revisedShipB: formatShippedDelayOnTimeCellDate(revisedShipRaw),
    shipmentDate: formatShippedDelayOnTimeCellDate(shipmentRaw),
    days: calcShippedDelayOnTimeDays(buyerShipRaw, revisedShipRaw, shipmentRaw),
  };
}

async function fetchShippedDelayOnTimeReportRows(params, headers = {}) {
  const base = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const statusRaw = String(params.status || params.delayStatus || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  const delayStatus = statusRaw === 'ONTIME' ? 'ontime' : 'delay';

  const q = new URLSearchParams({
    fromDate: String(params.fromDate || ''),
    toDate: String(params.toDate || ''),
    delayStatus,
  });

  const url = `${base}/api/Report/ShipmentDelayOrOnTimeReport?${q.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    // No-data responses should not surface as PDF build errors.
    if (res.status === 204 || res.status === 404) return [];
    throw new Error(`ShipmentDelayOrOnTimeReport API failed (${res.status})`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return [];
  }
  return unwrapShippedDelayOnTimeList(data);
}

function buildShippedDelayOnTimeReportPdfPayload(rawRows, meta = {}) {
  return {
    status: meta.status || 'DELAY',
    fromLabel: meta.fromLabel || '',
    toLabel: meta.toLabel || '',
    customerLabel: meta.customerLabel || 'All Customer',
    supplierLabel: meta.supplierLabel || 'All Supplier',
    rows: (rawRows || []).map(mapShippedDelayOnTimeApiRowToPdfRow),
  };
}

/**
 * "Shipped Delay / OnTime Report" form.
 *
 * Layout (per legacy print):
 *   - Row 1 : Customer dropdown, Supplier dropdown, Status dropdown.
 *   - Row 2 : From + To date inputs.
 *   - Row 3 : View Report, Download PDF, Download Excel â€” right-aligned.
 *
 * Report data: GET `/api/Report/ShipmentDelayOrOnTimeReport` via `VITE_API_BASE_URL`.
 */
function ShippedDelayOrOnTimeReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    status: 'DELAY',
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = SHIPPED_DELAY_ONTIME_TAB_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  /** Resolve the user-friendly label for the currently selected Customer / Supplier. */
  const resolveCustomerLabel = useCallback(() => {
    if (filters.customer === ALL) return 'All Customer';
    const hit = customers.find((r) => milestoneCustomerKey(r) === filters.customer);
    return hit ? milestoneCustomerLabel(hit) : 'All Customer';
  }, [filters.customer, customers]);

  const resolveSupplierLabel = useCallback(() => {
    if (filters.supplier === ALL) return 'All Supplier';
    const hit = suppliers.find((r) => milestoneSupplierKey(r) === filters.supplier);
    return hit ? milestoneSupplierLabel(hit) : 'All Supplier';
  }, [filters.supplier, suppliers]);

  const fetchShippedDelayOnTimePayload = useCallback(async () => {
    const rawRows = await fetchShippedDelayOnTimeReportRows(
      {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        customerId: filters.customer,
        supplierId: filters.supplier,
        status: filters.status,
      },
      shipmentAuthHeaders()
    );

    if (!Array.isArray(rawRows) || rawRows.length === 0) return null;

    const payload = buildShippedDelayOnTimeReportPdfPayload(rawRows, {
      status: filters.status,
      fromLabel: shippedDelayHeaderDate(filters.fromDate),
      toLabel: shippedDelayHeaderDate(filters.toDate),
      customerLabel: resolveCustomerLabel(),
      supplierLabel: resolveSupplierLabel(),
    });

    if (!Array.isArray(payload.rows) || payload.rows.length === 0) return null;
    return payload;
  }, [
    filters.fromDate,
    filters.toDate,
    filters.customer,
    filters.supplier,
    filters.status,
    resolveCustomerLabel,
    resolveSupplierLabel,
  ]);

  /**
   * Fetch ShipmentDelayOrOnTimeReport via VITE_API_BASE_URL, map onto existing
   * PDF columns, then preview or download. Layout unchanged.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const payload = await fetchShippedDelayOnTimePayload();
        if (!payload || !Array.isArray(payload.rows) || payload.rows.length === 0) {
          if (previewWindow) {
            try {
              previewWindow.close();
            } catch {
              /* ignore */
            }
          }
          enqueueSnackbar('No record found', { variant: 'warning' });
          return;
        }

        const blob = await buildShippedDelayOnTimeReportPdfBlob(payload);
        if (mode === 'view' && previewWindow) {
          const namedFile =
            typeof File !== 'undefined'
              ? new File([blob], SHIPPED_DELAY_ONTIME_PDF_FILENAME, { type: 'application/pdf' })
              : new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(namedFile);
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openShippedDelayOnTimeReportPdf(mode, blob, filters.status);
      } catch (err) {
        console.error('[ShippedDelayOrOnTime] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar(
          err?.message?.includes('VITE_API_BASE_URL')
            ? 'API URL missing: set VITE_API_BASE_URL'
            : 'Could not build Shipped Delay / OnTime PDF',
          { variant: 'error' }
        );
      } finally {
        setGeneratingPdf(false);
      }
    },
    [filters.status, generatingPdf, enqueueSnackbar, fetchShippedDelayOnTimePayload]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  /** Customer / Supplier lists from the shared dropdown API. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Shipped Delay / OnTime filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(shipmentAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[ShippedDelayOrOnTime] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset selected values that disappear from the latest API list. */
  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (prev.customer !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev.customer)) {
        next.customer = ALL;
        changed = true;
      }
      if (prev.supplier !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) {
        next.supplier = ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customers, suppliers]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Shipped Delay / OnTime Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Customer :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.customer}
              onChange={handleSelect('customer')}
              sx={selectSx}
              disabled={loadingDropdowns && customers.length === 0}
            >
              <MenuItem value={ALL}>All Customer</MenuItem>
              {customers
                .filter((row) => milestoneCustomerKey(row))
                .map((row) => {
                  const val = milestoneCustomerKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneCustomerLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={loadingDropdowns && suppliers.length === 0}
            >
              <MenuItem value={ALL}>All Supplier</MenuItem>
              {suppliers
                .filter((row) => milestoneSupplierKey(row))
                .map((row) => {
                  const val = milestoneSupplierKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneSupplierLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Status :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.status}
              onChange={handleSelect('status')}
              sx={selectSx}
            >
              <MenuItem value="DELAY">DELAY</MenuItem>
              <MenuItem value="ONTIME">ON TIME</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            From :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.fromDate}
            onChange={handleDate('fromDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            To :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.toDate}
            onChange={handleDate('toDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={4} />

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Shipped But Status Not Closed Report
// ----------------------------------------------------------------------

const SHIPPED_NOT_CLOSE_TAB_TITLE = 'Shipped But Status Not Closed Report';

const SHIPPED_NOT_CLOSE_SENTINEL_YEARS = new Set([1899, 1900, 1]);

function unwrapShippedNotCloseList(data) {
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

function pickShippedNotCloseField(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function pickShippedNotCloseNumeric(obj, ...keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const v = obj?.[keys[i]];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
  }
  return undefined;
}

/**
 * Match existing demo cell dates (`15 Apr 2026`). Blank sentinel years (1899/1900).
 */
function formatShippedNotCloseCellDate(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const y = Number(iso[1]);
    if (SHIPPED_NOT_CLOSE_SENTINEL_YEARS.has(y)) return '';
    return `${iso[3]} ${months[Number(iso[2]) - 1] || iso[2]} ${iso[1]}`;
  }

  const spaced = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (spaced) {
    const y = Number(spaced[3]);
    if (SHIPPED_NOT_CLOSE_SENTINEL_YEARS.has(y)) return '';
    const dd = String(spaced[1]).padStart(2, '0');
    const mon = spaced[2].slice(0, 1).toUpperCase() + spaced[2].slice(1, 3).toLowerCase();
    return `${dd} ${mon} ${spaced[3]}`;
  }

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  if (SHIPPED_NOT_CLOSE_SENTINEL_YEARS.has(d.getFullYear())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  return `${dd} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function mapShippedNotCloseApiRowToPdfRow(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    poNo: String(pickShippedNotCloseField(r, 'PO #', 'PONO', 'pono', 'PONo') || ''),
    shipmentDateB: formatShippedNotCloseCellDate(
      pickShippedNotCloseField(r, 'Shipment Date (B)', 'ShipmentDateB', 'shipmentDateB')
    ),
    customer: String(pickShippedNotCloseField(r, 'Customer', 'CustomerName', 'customerName') || ''),
    supplier: String(
      pickShippedNotCloseField(r, 'Supplier', 'VenderName', 'VendorName', 'supplier') || ''
    ),
    merchandiser: String(
      pickShippedNotCloseField(r, 'Merchandiser', 'merchandiser', 'Marchandiser') || ''
    ),
    styleNo: String(pickShippedNotCloseField(r, 'Style No', 'StyleNo', 'styleNo') || ''),
    poQty: pickShippedNotCloseNumeric(r, 'PO Quantity', 'POQty', 'poQty', 'PO Qty'),
    shipQty: pickShippedNotCloseNumeric(r, 'Ship Quantity', 'ShipQty', 'shipQty', 'Ship Qty'),
    invoiceNo: String(pickShippedNotCloseField(r, 'Invoice No', 'InvoiceNo', 'invoiceNo') || ''),
    shipmentDate: formatShippedNotCloseCellDate(
      pickShippedNotCloseField(r, 'Shipment Date', 'ShipmentDate', 'shipmentDate')
    ),
    poStatus: String(pickShippedNotCloseField(r, 'PO Status', 'POStatus', 'poStatus', 'Status') || ''),
  };
}

async function fetchShippedNotCloseReportRows(params, headers = {}) {
  const base = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set');
  }

  const q = new URLSearchParams({
    fromDate: String(params.fromDate || ''),
    toDate: String(params.toDate || ''),
    customerId: shipmentFilterIdOrZero(params.customerId),
    supplierId: shipmentFilterIdOrZero(params.supplierId),
  });

  const url = `${base}/api/Report/ShippedButNotClosedStatus?${q.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`ShippedButNotClosedStatus API failed (${res.status})`);
  }

  const data = await res.json();
  return unwrapShippedNotCloseList(data);
}

function buildShippedNotCloseReportPdfPayload(rawRows, meta = {}) {
  return {
    fromLabel: meta.fromLabel || '',
    toLabel: meta.toLabel || '',
    rows: (rawRows || []).map(mapShippedNotCloseApiRowToPdfRow),
  };
}

/**
 * "Shipped But Status Not Closed Report" form.
 *
 * Layout (per legacy print):
 *   - Row 1 : Customer dropdown + Supplier dropdown (2 cols).
 *   - Row 2 : From + To date inputs (2 cols).
 *   - Row 3 : View Report, Download PDF, Download Excel â€” right-aligned.
 *
 * Report data: GET `/api/Report/ShippedButNotClosedStatus` via `VITE_API_BASE_URL`.
 */
function ShippedNotCloseStatusReportForm() {
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    customer: ALL,
    supplier: ALL,
    fromDate: '2026-01-01',
    toDate: '2026-12-31',
  });

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = SHIPPED_NOT_CLOSE_TAB_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const handleSelect = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleDate = (name) => (e) => {
    setFilters((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const toast = useCallback(
    (msg) => enqueueSnackbar(msg, { variant: 'info' }),
    [enqueueSnackbar]
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchShippedNotClosePayload = useCallback(async () => {
    const rawRows = await fetchShippedNotCloseReportRows(
      {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        customerId: filters.customer,
        supplierId: filters.supplier,
      },
      shipmentAuthHeaders()
    );

    if (!rawRows.length) return null;
    return buildShippedNotCloseReportPdfPayload(rawRows, {
      fromLabel: shippedNotCloseHeaderDate(filters.fromDate),
      toLabel: shippedNotCloseHeaderDate(filters.toDate),
    });
  }, [filters.fromDate, filters.toDate, filters.customer, filters.supplier]);

  /**
   * Fetch ShippedButNotClosedStatus via VITE_API_BASE_URL, map onto existing PDF
   * columns, then preview or download. Layout unchanged.
   *
   * @param {'view'|'pdf'} mode
   */
  const runPdfExport = useCallback(
    async (mode) => {
      if (generatingPdf) return;
      const previewWindow = mode === 'view' ? window.open('about:blank') : null;
      setGeneratingPdf(true);
      try {
        const payload = await fetchShippedNotClosePayload();
        if (!payload) {
          if (previewWindow) {
            try {
              previewWindow.close();
            } catch {
              /* ignore */
            }
          }
          enqueueSnackbar('No data found for the selected filters.', { variant: 'warning' });
          return;
        }

        const blob = await buildShippedNotCloseStatusReportPdfBlob(payload);
        if (mode === 'view' && previewWindow) {
          const namedFile =
            typeof File !== 'undefined'
              ? new File([blob], SHIPPED_NOT_CLOSE_PDF_FILENAME, { type: 'application/pdf' })
              : new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(namedFile);
          previewWindow.location.replace(url);
          setTimeout(() => URL.revokeObjectURL(url), 120_000);
          return;
        }
        openShippedNotCloseStatusReportPdf(mode, blob);
      } catch (err) {
        console.error('[ShippedNotClose] PDF build failed', err);
        if (previewWindow) {
          try {
            previewWindow.close();
          } catch {
            /* ignore */
          }
        }
        enqueueSnackbar(
          err?.message?.includes('VITE_API_BASE_URL')
            ? 'API URL missing: set VITE_API_BASE_URL'
            : 'Could not build Shipped Not Closed PDF',
          { variant: 'error' }
        );
      } finally {
        setGeneratingPdf(false);
      }
    },
    [generatingPdf, enqueueSnackbar, fetchShippedNotClosePayload]
  );

  const handleViewReport = useCallback(() => runPdfExport('view'), [runPdfExport]);
  const handleDownloadPdf = useCallback(() => runPdfExport('pdf'), [runPdfExport]);

  /** Customer / Supplier lists from the shared dropdown API. */
  useEffect(() => {
    const base = getMilestoneSummaryDropdownApiBase();
    if (!base) {
      enqueueSnackbar(
        'API URL missing: set VITE_API_BASE_URL for Shipped Not Closed filters',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoadingDropdowns(true);
      try {
        const res = await fetchMilestoneSummaryDropdowns(shipmentAuthHeaders());
        if (cancelled) return;
        setCustomers(res.customers);
        setSuppliers(res.suppliers);
        if (res.rejected.customers) enqueueSnackbar('Could not load customers', { variant: 'error' });
        if (res.rejected.suppliers) enqueueSnackbar('Could not load suppliers', { variant: 'error' });
      } catch (err) {
        console.error('[ShippedNotClose] dropdowns', err);
        if (!cancelled) enqueueSnackbar('Could not load filter lists', { variant: 'error' });
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  /** Reset selected values that disappear from the latest API list. */
  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      if (prev.customer !== ALL && !customers.some((r) => milestoneCustomerKey(r) === prev.customer)) {
        next.customer = ALL;
        changed = true;
      }
      if (prev.supplier !== ALL && !suppliers.some((r) => milestoneSupplierKey(r) === prev.supplier)) {
        next.supplier = ALL;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customers, suppliers]);

  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
        Shipped But Status Not Closed Report
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Customer :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.customer}
              onChange={handleSelect('customer')}
              sx={selectSx}
              disabled={loadingDropdowns && customers.length === 0}
            >
              <MenuItem value={ALL}>All Customer</MenuItem>
              {customers
                .filter((row) => milestoneCustomerKey(row))
                .map((row) => {
                  const val = milestoneCustomerKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneCustomerLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Supplier :
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={filters.supplier}
              onChange={handleSelect('supplier')}
              sx={selectSx}
              disabled={loadingDropdowns && suppliers.length === 0}
            >
              <MenuItem value={ALL}>All Supplier</MenuItem>
              {suppliers
                .filter((row) => milestoneSupplierKey(row))
                .map((row) => {
                  const val = milestoneSupplierKey(row);
                  return (
                    <MenuItem key={val} value={val}>
                      {milestoneSupplierLabel(row)}
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            From :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.fromDate}
            onChange={handleDate('fromDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            To :
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={filters.toDate}
            onChange={handleDate('toDate')}
            InputLabelProps={{ shrink: true }}
            sx={selectSx}
          />
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleViewReport}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'View Report'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              {generatingPdf ? 'Buildingâ€¦' : 'Download PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => toast('Download Excel: connect API when backend is ready.')}
              sx={{ minWidth: 140, textTransform: 'none', fontWeight: 600 }}
            >
              Download Excel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Placeholder forms for the rest of the Shipment hub menu
// ----------------------------------------------------------------------

/** Stub form used for the remaining "coming soon" Shipment reports â€” same shape, single column. */
function PlaceholderShipmentReportForm({ pageTitle }) {
  return (
    <Card variant="outlined" sx={cardSx}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        {pageTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Filters and report actions for <strong>{pageTitle}</strong> will be wired here when the backend
        contracts are confirmed.
      </Typography>
    </Card>
  );
}

PlaceholderShipmentReportForm.propTypes = {
  pageTitle: PropTypes.string.isRequired,
};

function renderShipmentReportPanel(activeReportId, pageTitle) {
  switch (activeReportId) {
    case 'shipment-tracking-report':
      return <ShipmentTrackingReportForm key={activeReportId} />;
    case 'commision-invoice-report':
      return <CommisionInvoiceReportForm key={activeReportId} />;
    case 'shipment-history-report':
      return <ShipmentHistoryReportForm key={activeReportId} />;
    case 'after-shipment-report':
      return <AfterShipmentReportForm key={activeReportId} />;
    case 'shipment-delay-report':
      return <ShipmentDelayReportForm key={activeReportId} />;
    case 'product-comparision':
      return <ProductComparisionReportForm key={activeReportId} />;
    case 'shipped-delay-or-ontime-report':
      return <ShippedDelayOrOnTimeReportForm key={activeReportId} />;
    case 'shipped-not-close-status-report':
      return <ShippedNotCloseStatusReportForm key={activeReportId} />;
    default:
      return <ShipmentTrackingReportForm key={activeReportId} />;
  }
}

// ----------------------------------------------------------------------

export default function ShipmentHubView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const reportFromUrl = searchParams.get(REPORT_QUERY_KEY);
  const activeReportId = useMemo(() => {
    const valid = SHIPMENT_REPORT_OPTIONS.some((o) => o.id === reportFromUrl);
    return valid ? reportFromUrl : DEFAULT_REPORT_ID;
  }, [reportFromUrl]);

  useEffect(() => {
    if (!reportFromUrl || !SHIPMENT_REPORT_OPTIONS.some((o) => o.id === reportFromUrl)) {
      setSearchParams({ [REPORT_QUERY_KEY]: DEFAULT_REPORT_ID }, { replace: true });
    }
  }, [reportFromUrl, setSearchParams]);

  const selectedOption = useMemo(
    () => SHIPMENT_REPORT_OPTIONS.find((o) => o.id === activeReportId) ?? SHIPMENT_REPORT_OPTIONS[0],
    [activeReportId]
  );

  const handleReportChange = (e) => {
    const next = e.target.value;
    setSearchParams({ [REPORT_QUERY_KEY]: next }, { replace: true });
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="Shipment"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Reports', href: paths.dashboard.reports.root },
          { name: 'Shipment' },
        ]}
        sx={{ mb: 2 }}
      />

      <Card
        variant="outlined"
        sx={{
          mb: 2,
          p: { xs: 1.25, sm: 1.5 },
          borderRadius: 1,
          position: 'sticky',
          top: { xs: 56, sm: 64 },
          zIndex: 10,
          bgcolor: 'background.paper',
          boxShadow: (theme) =>
            theme.palette.mode === 'light' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <FormControl
          size="small"
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: 340, md: 360 },
          }}
        >
          <InputLabel id="shipment-switch-label" sx={{ fontSize: '0.8125rem' }}>
            Shipment report
          </InputLabel>
          <Select
            labelId="shipment-switch-label"
            label="Shipment report"
            value={activeReportId}
            onChange={handleReportChange}
            sx={{
              borderRadius: 1,
              fontWeight: 600,
              fontSize: '0.8125rem',
              '& .MuiSelect-select': {
                py: 0.5,
                minHeight: '1.75rem',
                display: 'flex',
                alignItems: 'center',
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 360,
                  '& .MuiMenuItem-root': { fontSize: '0.8125rem', minHeight: 36, py: 0.5 },
                },
              },
            }}
          >
            {SHIPMENT_REPORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      {renderShipmentReportPanel(activeReportId, selectedOption.label)}
    </Container>
  );
}
