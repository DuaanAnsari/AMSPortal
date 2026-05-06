import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    IconButton,
    Paper,
    useTheme,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

function fmtQty(v) {
  if (v === '' || v == null) return '';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

function fmtMoney4(v) {
  if (v === '' || v == null) return '';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(4) : String(v);
}

/** Amount = quantity × price (4 dp). Returns `null` if either side missing/invalid. */
function computeLineAmount(quantity, price) {
  const q = quantity === '' || quantity == null ? NaN : Number(quantity);
  const p = price === '' || price == null ? NaN : Number(price);
  if (!Number.isFinite(q) || !Number.isFinite(p)) return null;
  return Math.round(q * p * 10000) / 10000;
}

function formatAmountForInput(amount) {
  if (amount === null || amount === undefined || amount === '') return '';
  const n = Number(amount);
  return Number.isFinite(n) ? String(n) : '';
}

function NoDetailRowsOverlay() {
  return (
    <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        No line items — detail fields fill karke <strong>ADD</strong> dabao.
      </Typography>
    </Box>
  );
}

function pick(r, ...keys) {
  for (const k of keys) {
    if (r == null) break;
    if (r[k] != null && r[k] !== '') return r[k];
  }
  return '';
}

/** Same key resolution as CourierPackagingView — URL + state stay in sync. */
function merchandisingIdFromRaw(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const keys = [
    'merchandisingId',
    'MerchandisingId',
    'MerchandisingID',
    'merchandisingID',
    'Merchandising_Id',
    'merchandising_Id',
    'merchandisingMasterId',
    'MerchandisingMasterId',
    'merchandisingMasId',
    'MerchandisingMasId',
    'id',
    'Id',
    'ID',
  ];
  for (const k of keys) {
    const v = raw[k];
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    return String(v).trim();
  }
  return '';
}

function getMerchandisingId(searchParams, state) {
  const q = searchParams.get('merchandisingId')?.trim();
  if (q) return q;
  if (state?.merchandisingId != null && String(state.merchandisingId).trim() !== '') {
    return String(state.merchandisingId).trim();
  }
  const raw = state?.merchandisingMaster;
  if (raw && typeof raw === 'object') {
    return merchandisingIdFromRaw(raw);
  }
  return '';
}

/** GET GetNewAMSRefNo — unwrap `newAMSRefNo` / `NewAMSRefNo` from common envelopes. */
function pickNewAmsRefNo(data) {
  const root = data?.data != null && typeof data.data === 'object' ? data.data : data;
  const v =
    root?.newAMSRefNo ??
    root?.NewAMSRefNo ??
    data?.newAMSRefNo ??
    data?.NewAMSRefNo;
  if (v == null || v === '') return '';
  return String(v).trim();
}

/** ASP.NET query ints: only all-digit storage values (never send alphanumeric `userCode` as userId — causes 400). */
function parseQueryIntOrNull(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

/** Query params for GET GetShippers — numeric `userId` / `roleId` from session. */
function getShipperListQueryParams() {
  if (typeof localStorage === 'undefined') return { userId: 1, roleId: 1 };
  const userId =
    parseQueryIntOrNull(localStorage.getItem('userId')) ??
    parseQueryIntOrNull(localStorage.getItem('userCode')) ??
    1; // Default to 1 if not found
  const roleId = parseQueryIntOrNull(localStorage.getItem('roleId')) ?? 1; // Default to 1 if not found
  return { userId, roleId };
}

/**
 * `userId` for SaveMerchandising: prefers numeric `userId`, then all-digit `userCode`;
 * otherwise non-empty `userId` string (e.g. GUID) if present.
 */
function getMerchandisingSaveUserId() {
  if (typeof localStorage === 'undefined') return undefined;
  const uidRaw = localStorage.getItem('userId');
  const codeRaw = localStorage.getItem('userCode');
  const n = parseQueryIntOrNull(uidRaw) ?? parseQueryIntOrNull(codeRaw);
  if (n != null) return n;
  const s = String(uidRaw ?? '').trim();
  if (s) return s;
  return undefined;
}

/** Picks list row id from common API shapes (GetShipments / GetServices / GetCouriers / shippers). */
function pickDropdownListId(row) {
  if (!row || typeof row !== 'object') return '';
  const v =
    row.id ??
    row.Id ??
    row.ID ??
    row.value ??
    row.Value ??
    row.shipperId ??
    row.ShipperId ??
    row.shipmentId ??
    row.ShipmentId ??
    row.shipmentTypeId ??
    row.ShipmentTypeId ??
    row.serviceId ??
    row.ServiceId ??
    row.courierId ??
    row.CourierId ??
    row.UserId ??
    row.userId;
  if (v === undefined || v === null) return '';
  const s = String(v).trim();
  return s;
}

function pickDropdownListText(row) {
  if (!row || typeof row !== 'object') return '';
  const v =
    row.text ??
    row.Text ??
    row.name ??
    row.Name ??
    row.userName ??
    row.UserName ??
    row.shipperName ??
    row.ShipperName ??
    row.description ??
    row.Description ??
    row.label ??
    row.Label;
  return String(v ?? '').trim();
}

/** Normalizes `{ id, text }` / `{ Id, Text }` / `ShipmentId`+`Description` style rows; unwraps common envelopes; dedupes by id. */
function normalizeShippersResponse(data) {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.Data)
        ? data.Data
        : Array.isArray(data?.result)
          ? data.result
          : Array.isArray(data?.Result)
            ? data.Result
            : [];
  const seen = new Set();
  return raw
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const id = pickDropdownListId(row);
      const textPick = pickDropdownListText(row);
      if (id === '' || id == null) return null;
      const text = textPick || id;
      return { id, text: String(text) };
    })
    .filter(Boolean)
    .filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
}

/** GET GetShipments — same `{ id, text }` row shape as shippers. */
function normalizeShipmentsResponse(data) {
  return normalizeShippersResponse(data);
}

/** GET GetServices — same `{ id, text }` row shape as shippers. */
function normalizeServicesResponse(data) {
  return normalizeShippersResponse(data);
}

/** GET GetCouriers — same `{ id, text }` row shape as shippers. */
function normalizeCouriersResponse(data) {
  return normalizeShippersResponse(data);
}

/** Menu for shipment/service/courier selects — avoid scroll-lock + z-index under modals/cards. */
const MERCH_DROPDOWN_MENU_PROPS = {
  disableScrollLock: true,
  PaperProps: { sx: { maxHeight: 360, zIndex: (theme) => theme.zIndex.modal + 1 } },
};

/** GetConsignees: `PACKAGENAME` = consignee (dropdown + save); `ConsigneeName` = attention default. */
function normalizeConsigneesResponse(data) {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.Data)
        ? data.Data
        : [];
  return raw
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const id = row.consigneeID ?? row.ConsigneeID ?? row.consigneeId ?? row.id ?? row.Id;
      if (id === undefined || id === null || String(id).trim() === '') return null;

      const packageName = String(
        pick(row, 'PACKAGENAME', 'packagename', 'PackageName', 'packageName') || ''
      ).trim();
      const attentionDefault = String(row.ConsigneeName ?? row.consigneeName ?? '').trim();
      const legacyCompany = String(pick(row, 'name', 'Name') || '').trim();
      const nameForDisplay = packageName || legacyCompany || attentionDefault || String(id);

      return {
        id: String(id),
        name: nameForDisplay,
        attentionDefault,
      };
    })
    .filter(Boolean);
}

function mapMasterToForm(master) {
  const m = master && typeof master === 'object' ? master : {};
  return {
    invoiceNo: String(pick(m, 'couriesNo', 'CouriesNo') || ''),
    shipper: String(pick(m, 'shipper', 'Shipper') || ''),
    consignee: String(pick(m, 'consignee', 'Consignee') || ''),
    address: String(pick(m, 'address', 'Address') || ''),
    attention: String(pick(m, 'attention', 'Attention') || ''),
    phone: String(pick(m, 'phone', 'Phone', 'phon', 'Phon') || ''),
    awb: String(pick(m, 'awb', 'Awb', 'awbl', 'Awbl', 'AWBL') || ''),
    shipmentType: String(
      pick(m, 'shipmentType', 'ShipmentType', 'shipment', 'Shipment') || ''
    ),
    serviceRequired: String(pick(m, 'serviceRequired', 'ServiceRequired', 'service', 'Service') || ''),
    amsCourierAwb: String(pick(m, 'amsCourierAwb', 'AmsCourierAwb', 'couries', 'Couries') || ''),
    account: String(pick(m, 'account', 'Account') || ''),
  };
}

function mapDetailRow(detail, index) {
  const r = detail && typeof detail === 'object' ? detail : {};
  const rowId = pick(r, 'id', 'Id', 'merchandisingDetailId', 'MerchandisingDetailId');
  const id = rowId !== '' && rowId != null ? rowId : `row-${Date.now()}-${index}`;
  const qty = pick(r, 'qty', 'Qty', 'quantity', 'Quantity');
  const price = pick(r, 'price', 'Price');
  const computed = computeLineAmount(qty === '' ? null : qty, price === '' ? null : price);
  const amountFromApi = pick(r, 'amount', 'Amount');
  let amount = '';
  if (computed != null) {
    amount = computed;
  } else if (amountFromApi !== '' && amountFromApi != null) {
    const n = Number(amountFromApi);
    amount = Number.isFinite(n) ? n : '';
  }
  return {
    id,
    poStyle: String(pick(r, 'postyle', 'poStyle', 'Postyle', 'POStyle') || ''),
    description: String(pick(r, 'description', 'Description') || ''),
    quantity: qty === '' ? '' : qty,
    price: price === '' ? '' : price,
    amount,
    remarks: String(pick(r, 'remarks', 'Remarks') || ''),
    _rawDetail: r,
  };
}

/** Strict finite number for SaveMerchandising detail lines (never NaN). */
function numForDetail(v, fallback = 0) {
  if (v === '' || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function merchandisingIdForPayload(mid) {
  if (mid == null || String(mid).trim() === '') return undefined;
  const s = String(mid).trim();
  const n = Number(s);
  if (Number.isFinite(n) && Number.isSafeInteger(n) && String(n) === s) return n;
  return s;
}

/** If `val` matches a dropdown row id, return id for API (number when all-digits). */
function coerceLookupId(val) {
  if (val == null || String(val).trim() === '') return undefined;
  const s = String(val).trim();
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return Number.isSafeInteger(n) ? n : s;
  }
  return s;
}

function buildMasterLookupIds(formData, { shippers, consignees, shipments, services, couriers }) {
  const ids = {};
  if (shippers.some((s) => String(s.id) === String(formData.shipper))) {
    const v = coerceLookupId(formData.shipper);
    if (v !== undefined) {
      ids.shipperId = v;
    }
  }
  if (consignees.some((c) => String(c.id) === String(formData.consignee))) {
    const v = coerceLookupId(formData.consignee);
    if (v !== undefined) {
      ids.consigneeId = v;
    }
  }
  if (shipments.some((t) => String(t.id) === String(formData.shipmentType))) {
    const v = coerceLookupId(formData.shipmentType);
    if (v !== undefined) {
      ids.shipmentTypeId = v;
      ids.shipmentId = v;
    }
  }
  if (services.some((s) => String(s.id) === String(formData.serviceRequired))) {
    const v = coerceLookupId(formData.serviceRequired);
    if (v !== undefined) {
      ids.serviceRequiredId = v;
      ids.serviceId = v;
    }
  }
  if (couriers.some((c) => String(c.id) === String(formData.amsCourierAwb))) {
    const v = coerceLookupId(formData.amsCourierAwb);
    if (v !== undefined) {
      ids.courierId = v;
    }
  }
  return ids;
}

/**
 * POST SaveMerchandising — env-based `qdApi` (`/Merchandising/SaveMerchandising`).
 * Master: `userId` from localStorage; text fields (`shipment`, `service`, `couries`, `awbl`, `phon`, …);
 * selected dropdown FKs: `shipperId`, `consigneeId`, `shipmentTypeId` + `shipmentId`, `serviceRequiredId` + `serviceId`, `courierId`.
 */
function buildMerchandisingSavePayload(formResolved, rows, merchandisingId, lookupIds = {}) {
  const mid = merchandisingIdForPayload(merchandisingId);
  const saveUserId = getMerchandisingSaveUserId();
  const master = {
    ...(mid !== undefined ? { merchandisingId: mid } : {}),
    ...(saveUserId !== undefined ? { userId: saveUserId } : {}),
    ...lookupIds,
    couriesNo: String(formResolved.invoiceNo ?? '').trim(),
    shipper: String(formResolved.shipper ?? '').trim(),
    consignee: String(formResolved.consignee ?? '').trim(),
    address: String(formResolved.address ?? '').trim(),
    attention: String(formResolved.attention ?? '').trim(),
    shipment: String(formResolved.shipmentType ?? '').trim(),
    service: String(formResolved.serviceRequired ?? '').trim(),
    couries: String(formResolved.amsCourierAwb ?? '').trim(),
    account: String(formResolved.account ?? '').trim(),
    awbl: String(formResolved.awb ?? '').trim(),
    phon: String(formResolved.phone ?? '').trim(),
  };
  const details = rows.map((row) => {
    const raw = row._rawDetail && typeof row._rawDetail === 'object' ? row._rawDetail : {};
    const detailPK = pick(raw, 'detailID', 'DetailID', 'detailId', 'id', 'Id', 'merchandisingDetailId', 'MerchandisingDetailId');
    const qty = numForDetail(row.quantity, 0);
    const price = numForDetail(row.price, 0);
    const computed = computeLineAmount(row.quantity, row.price);
    const amount =
      computed != null && Number.isFinite(computed)
        ? computed
        : numForDetail(row.amount, Math.round(qty * price * 10000) / 10000);
    return {
      ...(detailPK !== '' && detailPK != null ? { detailID: detailPK } : {}),
      postyle: String(row.poStyle ?? '').trim(),
      description: String(row.description ?? '').trim(),
      qty,
      price,
      amount,
      remarks: String(row.remarks ?? '').trim(),
    };
  });
  return { master, details };
}

function getEmptyFormData() {
  return {
    invoiceNo: '',
    shipper: '',
    consignee: '',
    attention: '',
    address: '',
    phone: '',
    awb: '',
    shipmentType: '',
    serviceRequired: '',
    amsCourierAwb: '',
    account: '',
  };
}

function getEmptyDetailData() {
  return {
    poStyle: '',
    description: '',
    quantity: '',
    price: '',
    amount: '',
    remarks: '',
  };
}

/** Returns list of missing master field labels (empty = valid). */
function validateMerchandisingMaster(formData) {
  const missing = [];
  const need = (label, v) => {
    if (v == null || String(v).trim() === '') missing.push(label);
  };
  need('Invoice #', formData.invoiceNo);
  need('Shipper', formData.shipper);
  need('Consignee', formData.consignee);
  need('Address', formData.address);
  need('Shipment type', formData.shipmentType);
  need('Service required', formData.serviceRequired);
  need('Courier / AWB', formData.amsCourierAwb);
  return missing;
}

/** Returns messages if any grid line is invalid (empty = valid). */
function validateMerchandisingDetailRows(rows) {
  const problems = [];
  rows.forEach((row, index) => {
    const line = index + 1;
    if (!String(row.poStyle ?? '').trim()) {
      problems.push(`Line ${line}: PO Style is required`);
    }
    const q = Number(row.quantity);
    if (!Number.isFinite(q) || q <= 0) {
      problems.push(`Line ${line}: Quantity must be a positive number`);
    }
  });
  return problems;
}

// ----------------------------------------------------------------------

export default function CourierPackagingEntryPage() {
    const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
    const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const mergedMerchKeyRef = useRef(null);
  const editFetchSeqRef = useRef(0);

    const [manualEntry, setManualEntry] = useState({
        shipmentType: false,
        serviceRequired: false,
        amsCourierAwb: false,
    });

    const toggleManual = (field) => {
        setManualEntry((prev) => ({ ...prev, [field]: !prev[field] }));
    };

  const [formData, setFormData] = useState(() => getEmptyFormData());

  const [detailData, setDetailData] = useState(() => getEmptyDetailData());

    const [rows, setRows] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [shippers, setShippers] = useState([]);
  const [shippersLoading, setShippersLoading] = useState(false);
  const [consignees, setConsignees] = useState([]);
  const [consigneesLoading, setConsigneesLoading] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const [couriersLoading, setCouriersLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
    if (name === 'consignee') {
      if (value === '' || value == null) {
        setFormData((prev) => ({ ...prev, consignee: '', attention: '' }));
        return;
      }
      const sel = consignees.find((c) => String(c.id) === String(value));
      const att = sel && String(sel.attentionDefault ?? '').trim() !== '' ? String(sel.attentionDefault).trim() : '';
      setFormData((prev) => ({
        ...prev,
        consignee: value,
        attention: att || prev.attention,
      }));
      return;
    }
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleDetailChange = (event) => {
        const { name, value } = event.target;
    setDetailData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'quantity' || name === 'price') {
        const q = name === 'quantity' ? value : next.quantity;
        const p = name === 'price' ? value : next.price;
        const amt = computeLineAmount(q, p);
        next.amount = amt == null ? '' : String(amt);
      }
      return next;
    });
    };

    const handleAddGrid = () => {
    if (!detailData.poStyle || detailData.quantity === '' || detailData.quantity == null) {
      enqueueSnackbar('Please fill at least PO Style and Quantity.', { variant: 'warning' });
            return;
        }
    const amt = computeLineAmount(detailData.quantity, detailData.price);
        const newRow = {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            ...detailData,
      amount: amt == null ? '' : amt,
        };
        setRows((prev) => [...prev, newRow]);
    setDetailData(getEmptyDetailData());
  };

  const handleDeleteRow = useCallback((id) => {
        setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const processRowUpdate = useCallback((newRow) => {
    const amt = computeLineAmount(newRow.quantity, newRow.price);
    const updated = { ...newRow, amount: amt == null ? '' : amt };
    setRows((prev) => prev.map((row) => (String(row.id) === String(updated.id) ? updated : row)));
    return updated;
  }, []);

  /** Keep ?merchandisingId= in sync when opening from grid state only. */
  useEffect(() => {
    const mid = getMerchandisingId(searchParams, location.state);
    const inUrl = searchParams.get('merchandisingId')?.trim();
    if (mid && inUrl !== mid) {
      setSearchParams({ merchandisingId: mid }, { replace: true });
    }
  }, [location.state, location.key, searchParams, setSearchParams]);

  /** Edit mode: load master + details from API. */
  useEffect(() => {
    const mid = getMerchandisingId(searchParams, location.state);
    if (!mid) {
      setEditLoading(false);
      setEditError(null);
      return undefined;
    }

    let cancelled = false;
    const seq = ++editFetchSeqRef.current;

    (async () => {
      setEditLoading(true);
      setEditError(null);
      try {
        const { data } = await qdApi.get('/Merchandising/GetMerchandisingEditData', {
          params: { merchandisingId: mid },
        });
        if (cancelled || seq !== editFetchSeqRef.current) return;

        const root = data?.data != null && typeof data.data === 'object' ? data.data : data;
        const master = root?.master ?? root?.Master ?? {};
        const rawDetails = root?.details ?? root?.Details;
        const detailList = Array.isArray(rawDetails) ? rawDetails : [];

        setFormData(mapMasterToForm(master));
        setRows(detailList.map((d, i) => mapDetailRow(d, i)));
        // Keep dropdown mode so selects work; orphan MenuItems cover values not in the list.
        setManualEntry({
          shipmentType: false,
          serviceRequired: false,
          amsCourierAwb: false,
        });
        mergedMerchKeyRef.current = JSON.stringify(location.state?.merchandisingMaster ?? {});
      } catch (e) {
        if (cancelled || seq !== editFetchSeqRef.current) return;
        const msg =
          (typeof e?.response?.data === 'string' && e.response.data) ||
          e?.response?.data?.message ||
          e?.response?.data?.Message ||
          e?.message ||
          'Failed to load merchandising entry';
        setEditError(typeof msg === 'string' ? msg : 'Failed to load merchandising entry');
      } finally {
        if (!cancelled && seq === editFetchSeqRef.current) {
          setEditLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, location.state, location.key]);

  /** New entry (no id, no list row): clear stale form after leaving edit. */
  useEffect(() => {
    const mid = getMerchandisingId(searchParams, location.state);
    if (mid) return;
    if (location.state?.merchandisingMaster) return;

    mergedMerchKeyRef.current = null;
    setFormData(getEmptyFormData());
    setRows([]);
    setDetailData(getEmptyDetailData());
    setManualEntry({
      shipmentType: false,
      serviceRequired: false,
      amsCourierAwb: false,
    });
    setEditError(null);
  }, [searchParams, location.state, location.key]);

  /** Prefill from list row when not loading full edit payload (no merchandising id). */
  useEffect(() => {
    const mid = getMerchandisingId(searchParams, location.state);
    if (mid) return;

    const rec = location.state?.merchandisingMaster;
    if (!rec || typeof rec !== 'object') return;
    const key = JSON.stringify(rec);
    if (mergedMerchKeyRef.current === key) return;
    mergedMerchKeyRef.current = key;

    const couriesNo = rec.couriesNo ?? rec.CouriesNo;
    const shipper = rec.shipper ?? rec.Shipper;
    const consignee = rec.consignee ?? rec.Consignee;
    const address = rec.address ?? rec.Address;
    const awb = rec.awbl ?? rec.Awbl ?? rec.AWBL;
    const shipment = rec.shipment ?? rec.Shipment;
    const service = rec.service ?? rec.Service;
    const couries = rec.couries ?? rec.Couries;
    const account = rec.account ?? rec.Account;
    const attention = rec.attention ?? rec.Attention;
    const phone = rec.phon ?? rec.Phon ?? rec.phone ?? rec.Phone;

    setFormData((prev) => ({
      ...prev,
      ...(couriesNo != null && couriesNo !== '' ? { invoiceNo: String(couriesNo) } : {}),
      ...(shipper != null && shipper !== '' ? { shipper: String(shipper) } : {}),
      ...(consignee != null && consignee !== '' ? { consignee: String(consignee) } : {}),
      ...(address != null && address !== '' ? { address: String(address) } : {}),
      ...(attention != null && attention !== '' ? { attention: String(attention) } : {}),
      ...(awb != null && awb !== '' ? { awb: String(awb) } : {}),
      ...(shipment != null && shipment !== '' ? { shipmentType: String(shipment) } : {}),
      ...(service != null && service !== '' ? { serviceRequired: String(service) } : {}),
      ...(couries != null && couries !== '' ? { amsCourierAwb: String(couries) } : {}),
      ...(account != null && account !== '' ? { account: String(account) } : {}),
      ...(phone != null && phone !== '' ? { phone: String(phone) } : {}),
    }));

    setManualEntry({
      shipmentType: false,
      serviceRequired: false,
      amsCourierAwb: false,
    });
  }, [location.state, searchParams]);

  /** New entry only: load next Invoice # from API (env-based `qdApi` root). */
  useEffect(() => {
    const mid = getMerchandisingId(searchParams, location.state);
    if (mid) return undefined;

    if (!qdApi.defaults.baseURL) {
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await qdApi.get('/Merchandising/GetNewAMSRefNo');
        if (cancelled) return;
        const ref = pickNewAmsRefNo(data);
        if (!ref) {
          enqueueSnackbar('Invoice number was not returned by the server.', { variant: 'warning' });
          return;
        }
        setFormData((prev) => ({ ...prev, invoiceNo: ref }));
      } catch (e) {
        if (cancelled) return;
        const msg =
          (typeof e?.response?.data === 'string' && e.response.data) ||
          e?.response?.data?.message ||
          e?.response?.data?.Message ||
          e?.message ||
          'Failed to load invoice number';
        enqueueSnackbar(typeof msg === 'string' ? msg : 'Failed to load invoice number', { variant: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, location.state, location.key, enqueueSnackbar]);

  /** Page load: shipper dropdown options (env-based `qdApi`, params object — no manual query string). */
  useEffect(() => {
    if (!qdApi.defaults.baseURL) {
      return undefined;
    }
    const { userId, roleId } = getShipperListQueryParams();
    if (userId == null || roleId == null) {
      enqueueSnackbar(
        'Numeric user id and role id are required for shippers. Sign in again after backend sends `userId` in login `userInfo`, or set `userId` / `roleId` in storage.',
        { variant: 'warning' }
      );
      return undefined;
    }

    let cancelled = false;
    setShippersLoading(true);
    (async () => {
      try {
        const { data } = await qdApi.get('/Merchandising/GetShippers', {
          params: { userId, roleId },
        });
        if (cancelled) return;
        setShippers(normalizeShippersResponse(data));
      } catch (e) {
        if (cancelled) return;
        // Debug: full error envelope (400 body often explains model binding).
        // eslint-disable-next-line no-console
        console.error('[GetShippers] request failed', {
          status: e?.response?.status,
          data: e?.response?.data,
          baseURL: e?.config?.baseURL,
          url: e?.config?.url,
          params: e?.config?.params,
          hasAuthHeader: Boolean(e?.config?.headers?.Authorization),
        });
        const msg =
          (typeof e?.response?.data === 'string' && e.response.data) ||
          e?.response?.data?.message ||
          e?.response?.data?.Message ||
          e?.message ||
          'Failed to load shippers';
        enqueueSnackbar(typeof msg === 'string' ? msg : 'Failed to load shippers', { variant: 'error' });
        setShippers([]);
      } finally {
        if (!cancelled) setShippersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.key, enqueueSnackbar]);

  /** After shippers load or master shipper changes, map legacy **name** to option **id** for the select. */
  useEffect(() => {
    if (shippers.length === 0) return;
    setFormData((prev) => {
      const v = prev.shipper;
      if (v == null || String(v).trim() === '') return prev;
      if (shippers.some((s) => String(s.id) === String(v))) return prev;
      const match = shippers.find((s) => String(s.text).trim() === String(v).trim());
      if (match) return { ...prev, shipper: String(match.id) };
      return prev;
    });
  }, [shippers, formData.shipper]);

  /** Page load: consignee dropdown (no query params; env-based `qdApi`). */
  useEffect(() => {
    if (!qdApi.defaults.baseURL) {
      return undefined;
    }

    let cancelled = false;
    setConsigneesLoading(true);
    (async () => {
      try {
        const { data } = await qdApi.get('/Merchandising/GetConsignees');
        if (cancelled) return;
        setConsignees(normalizeConsigneesResponse(data));
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('[GetConsignees] request failed', {
          status: e?.response?.status,
          data: e?.response?.data,
          baseURL: e?.config?.baseURL,
          url: e?.config?.url,
          hasAuthHeader: Boolean(e?.config?.headers?.Authorization),
        });
        const msg =
          (typeof e?.response?.data === 'string' && e.response.data) ||
          e?.response?.data?.message ||
          e?.response?.data?.Message ||
          e?.message ||
          'Failed to load consignees';
        enqueueSnackbar(typeof msg === 'string' ? msg : 'Failed to load consignees', { variant: 'error' });
        setConsignees([]);
      } finally {
        if (!cancelled) setConsigneesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.key, enqueueSnackbar]);

  /** Map legacy master/prefill consignee **name** to option **id** when list loads. */
  useEffect(() => {
    if (consignees.length === 0) return;
    setFormData((prev) => {
      const v = prev.consignee;
      if (v == null || String(v).trim() === '') return prev;
      if (consignees.some((c) => String(c.id) === String(v))) return prev;
      const match = consignees.find((c) => String(c.name).trim() === String(v).trim());
      if (match) {
        const att = String(match.attentionDefault ?? '').trim();
        return {
          ...prev,
          consignee: String(match.id),
          ...(att ? { attention: att } : {}),
        };
      }
      return prev;
    });
  }, [consignees, formData.consignee]);

  /** Page load: shipment type options (`{ id, text }`). */
  useEffect(() => {
    if (!qdApi.defaults.baseURL) {
      return undefined;
    }

    let cancelled = false;
    setShipmentsLoading(true);
    (async () => {
      try {
        const { data } = await qdApi.get('/Merchandising/GetShipments');
        if (cancelled) return;
        setShipments(normalizeShipmentsResponse(data));
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('[GetShipments] request failed', {
          status: e?.response?.status,
          data: e?.response?.data,
          baseURL: e?.config?.baseURL,
          url: e?.config?.url,
          hasAuthHeader: Boolean(e?.config?.headers?.Authorization),
        });
        const msg =
          (typeof e?.response?.data === 'string' && e.response.data) ||
          e?.response?.data?.message ||
          e?.response?.data?.Message ||
          e?.message ||
          'Failed to load shipment types';
        enqueueSnackbar(typeof msg === 'string' ? msg : 'Failed to load shipment types', { variant: 'error' });
        setShipments([]);
      } finally {
        if (!cancelled) setShipmentsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.key, enqueueSnackbar]);

  /** Map legacy master/prefill shipment **text** to option **id**. */
  useEffect(() => {
    if (shipments.length === 0) return;
    setFormData((prev) => {
      const v = prev.shipmentType;
      if (v == null || String(v).trim() === '') return prev;
      if (shipments.some((t) => String(t.id) === String(v))) return prev;
      const match = shipments.find((t) => String(t.text).trim() === String(v).trim());
      if (match) return { ...prev, shipmentType: String(match.id) };
      return prev;
    });
  }, [shipments, formData.shipmentType]);

  /** Page load: service required options (`{ id, text }`). */
  useEffect(() => {
    if (!qdApi.defaults.baseURL) {
      return undefined;
    }

    let cancelled = false;
    setServicesLoading(true);
    (async () => {
      try {
        const { data } = await qdApi.get('/Merchandising/GetServices');
        if (cancelled) return;
        setServices(normalizeServicesResponse(data));
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('[GetServices] request failed', {
          status: e?.response?.status,
          data: e?.response?.data,
          baseURL: e?.config?.baseURL,
          url: e?.config?.url,
          hasAuthHeader: Boolean(e?.config?.headers?.Authorization),
        });
        const msg =
          (typeof e?.response?.data === 'string' && e.response.data) ||
          e?.response?.data?.message ||
          e?.response?.data?.Message ||
          e?.message ||
          'Failed to load services';
        enqueueSnackbar(typeof msg === 'string' ? msg : 'Failed to load services', { variant: 'error' });
        setServices([]);
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.key, enqueueSnackbar]);

  /** Map legacy master/prefill service **text** to option **id**. */
  useEffect(() => {
    if (services.length === 0) return;
    setFormData((prev) => {
      const v = prev.serviceRequired;
      if (v == null || String(v).trim() === '') return prev;
      if (services.some((s) => String(s.id) === String(v))) return prev;
      const match = services.find((s) => String(s.text).trim() === String(v).trim());
      if (match) return { ...prev, serviceRequired: String(match.id) };
      return prev;
    });
  }, [services, formData.serviceRequired]);

  /** Page load: AMS Courier / couriers (`{ id, text }`). */
  useEffect(() => {
    if (!qdApi.defaults.baseURL) {
      return undefined;
    }

    let cancelled = false;
    setCouriersLoading(true);
    (async () => {
      try {
        const { data } = await qdApi.get('/Merchandising/GetCouriers');
        if (cancelled) return;
        setCouriers(normalizeCouriersResponse(data));
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('[GetCouriers] request failed', {
          status: e?.response?.status,
          data: e?.response?.data,
          baseURL: e?.config?.baseURL,
          url: e?.config?.url,
          hasAuthHeader: Boolean(e?.config?.headers?.Authorization),
        });
        const msg =
          (typeof e?.response?.data === 'string' && e.response.data) ||
          e?.response?.data?.message ||
          e?.response?.data?.Message ||
          e?.message ||
          'Failed to load couriers';
        enqueueSnackbar(typeof msg === 'string' ? msg : 'Failed to load couriers', { variant: 'error' });
        setCouriers([]);
      } finally {
        if (!cancelled) setCouriersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.key, enqueueSnackbar]);

  /** Map legacy master/prefill courier **text** to option **id**. */
  useEffect(() => {
    if (couriers.length === 0) return;
    setFormData((prev) => {
      const v = prev.amsCourierAwb;
      if (v == null || String(v).trim() === '') return prev;
      if (couriers.some((c) => String(c.id) === String(v))) return prev;
      const match = couriers.find((c) => String(c.text).trim() === String(v).trim());
      if (match) return { ...prev, amsCourierAwb: String(match.id) };
      return prev;
    });
  }, [couriers, formData.amsCourierAwb]);

  const columns = useMemo(
    () => [
      {
        field: 'poStyle',
        headerName: 'PO Style',
        flex: 0.6,
        minWidth: 90,
        align: 'center',
        headerAlign: 'center',
        editable: true,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 2,
        minWidth: 220,
        align: 'left',
        headerAlign: 'center',
        editable: true,
      },
      {
        field: 'quantity',
        headerName: 'QTY',
        flex: 0.45,
        minWidth: 80,
        align: 'right',
        headerAlign: 'center',
        editable: true,
        type: 'number',
        valueFormatter: (params) => fmtQty(params?.value),
      },
      {
        field: 'price',
        headerName: 'Price',
        flex: 0.45,
        minWidth: 90,
        align: 'right',
        headerAlign: 'center',
        editable: true,
        type: 'number',
        valueFormatter: (params) => fmtMoney4(params?.value),
      },
      {
        field: 'amount',
        headerName: 'Amount',
        flex: 0.45,
        minWidth: 90,
        align: 'right',
        headerAlign: 'center',
        editable: false,
        valueFormatter: (params) => fmtMoney4(params?.value),
      },
      {
        field: 'remarks',
        headerName: 'Remarks',
        flex: 0.9,
        minWidth: 120,
        align: 'center',
        headerAlign: 'center',
        editable: true,
      },
        {
            field: 'action',
            headerName: 'Action',
        width: 88,
        sortable: false,
        filterable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
          <IconButton
            size="small"
            aria-label="Delete row"
            onClick={() => handleDeleteRow(params.id)}
            sx={{
              bgcolor: 'error.main',
              color: 'error.contrastText',
              width: 28,
              height: 28,
              '&:hover': { bgcolor: 'error.dark', color: 'error.contrastText' },
            }}
          >
            <Iconify icon="eva:close-fill" width={16} />
                </IconButton>
            ),
        },
    ],
    [handleDeleteRow]
  );

  const gridSx = useMemo(
    () => ({
      border: 'none',
      bgcolor: 'background.paper',
      '& .MuiDataGrid-main': { bgcolor: 'background.paper' },
      '& .MuiDataGrid-columnHeaders': {
        bgcolor: theme.palette.grey[100],
        color: theme.palette.grey[700],
        borderBottom: `1px solid ${theme.palette.divider}`,
        minHeight: 44,
        maxHeight: 'none',
      },
      '& .MuiDataGrid-columnHeader': { outline: 'none' },
      '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 700,
        color: 'inherit',
      },
      '& .MuiDataGrid-columnSeparator': { color: theme.palette.divider },
      '& .MuiDataGrid-cell': {
        borderColor: 'divider',
        bgcolor: 'background.paper',
      },
      '& .MuiDataGrid-row': {
        bgcolor: 'background.paper',
        '&:hover': { bgcolor: 'action.hover' },
      },
      '& .MuiDataGrid-footerContainer': {
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        minHeight: 52,
      },
      '& .MuiTablePagination-root': { color: 'text.secondary' },
      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
        color: 'text.secondary',
      },
      '& .MuiTablePagination-actions .MuiIconButton-root': { color: 'text.secondary' },
      '& .MuiDataGrid-footerContainer .MuiSvgIcon-root': { color: 'text.secondary' },
      '& .MuiDataGrid-footerContainer .MuiSelect-select': { color: 'text.secondary' },
      '& .MuiDataGrid-footerContainer .MuiSelect-icon': { color: 'text.secondary' },
    }),
    [theme]
  );

  /** Edit/prefill value not in current shipper list — keep select valid. */
  const shipperOrphanOption = useMemo(() => {
    const v = formData.shipper;
    if (v == null || String(v).trim() === '') return null;
    if (shippers.some((s) => String(s.id) === String(v))) return null;
    return { value: String(v), label: String(v) };
  }, [formData.shipper, shippers]);

  const consigneeOrphanOption = useMemo(() => {
    const v = formData.consignee;
    if (v == null || String(v).trim() === '') return null;
    if (consignees.some((c) => String(c.id) === String(v))) return null;
    return { value: String(v), label: String(v) };
  }, [formData.consignee, consignees]);

  const shipmentOrphanOption = useMemo(() => {
    const v = formData.shipmentType;
    if (v == null || String(v).trim() === '') return null;
    if (shipments.some((t) => String(t.id) === String(v))) return null;
    return { value: String(v), label: String(v) };
  }, [formData.shipmentType, shipments]);

  const serviceOrphanOption = useMemo(() => {
    const v = formData.serviceRequired;
    if (v == null || String(v).trim() === '') return null;
    if (services.some((s) => String(s.id) === String(v))) return null;
    return { value: String(v), label: String(v) };
  }, [formData.serviceRequired, services]);

  const courierOrphanOption = useMemo(() => {
    const v = formData.amsCourierAwb;
    if (v == null || String(v).trim() === '') return null;
    if (couriers.some((c) => String(c.id) === String(v))) return null;
    return { value: String(v), label: String(v) };
  }, [formData.amsCourierAwb, couriers]);

  const handleSaveMerchandising = useCallback(async () => {
    const missing = validateMerchandisingMaster(formData);
    if (missing.length > 0) {
      enqueueSnackbar(`Please fill required fields: ${missing.join(', ')}`, { variant: 'warning' });
      return;
    }
    if (rows.length === 0) {
      enqueueSnackbar('Add at least one detail line before saving.', { variant: 'warning' });
      return;
    }
    const detailProblems = validateMerchandisingDetailRows(rows);
    if (detailProblems.length > 0) {
      enqueueSnackbar(detailProblems[0], { variant: 'warning' });
      return;
    }
    if (!qdApi.defaults.baseURL) {
      enqueueSnackbar('API URL is not configured. Set REACT_APP_API_URL (or VITE_API_BASE_URL) in .env.', {
        variant: 'error',
      });
      return;
    }
    if (!localStorage.getItem('accessToken')) {
      enqueueSnackbar('Please sign in again — access token is missing.', { variant: 'warning' });
      return;
    }

    const mid = getMerchandisingId(searchParams, location.state);
    const shipperForSave =
      shippers.find((s) => String(s.id) === String(formData.shipper))?.text ?? formData.shipper;
    const consigneeForSave =
      consignees.find((c) => String(c.id) === String(formData.consignee))?.name ?? formData.consignee;
    const shipmentTypeForSave =
      shipments.find((t) => String(t.id) === String(formData.shipmentType))?.text ?? formData.shipmentType;
    const serviceRequiredForSave =
      services.find((s) => String(s.id) === String(formData.serviceRequired))?.text ?? formData.serviceRequired;
    const amsCourierAwbForSave =
      couriers.find((c) => String(c.id) === String(formData.amsCourierAwb))?.text ?? formData.amsCourierAwb;
    const lookupIds = buildMasterLookupIds(formData, {
      shippers,
      consignees,
      shipments,
      services,
      couriers,
    });
    const payload = buildMerchandisingSavePayload(
      {
        ...formData,
        shipper: shipperForSave,
        consignee: consigneeForSave,
        shipmentType: shipmentTypeForSave,
        serviceRequired: serviceRequiredForSave,
        amsCourierAwb: amsCourierAwbForSave,
      },
      rows,
      mid,
      lookupIds
    );

    setSaveLoading(true);
    try {
      await qdApi.saveMerchandising(payload);
      enqueueSnackbar(mid ? 'Merchandising updated successfully.' : 'Merchandising saved successfully.', {
        variant: 'success',
      });
      setFormData(getEmptyFormData());
      setDetailData(getEmptyDetailData());
      setRows([]);
      setManualEntry({
        shipmentType: false,
        serviceRequired: false,
        amsCourierAwb: false,
      });
      mergedMerchKeyRef.current = null;
      navigate(
        { pathname: paths.dashboard.powerTool.courierPackagingEntry, search: '' },
        { replace: true, state: {} }
      );
    } catch (e) {
      const d = e?.response?.data;
      let msg =
        (typeof d === 'string' && d) ||
        d?.message ||
        d?.Message ||
        d?.title ||
        e?.message ||
        'Save failed';
      if (Array.isArray(d?.errors) && d.errors.length) {
        const first = d.errors[0];
        msg = typeof first === 'string' ? first : first?.message || msg;
      } else if (typeof d === 'object' && d && typeof d.errors === 'object' && d.errors !== null) {
        const errs = d.errors;
        const firstKey = Object.keys(errs)[0];
        const arr = firstKey ? errs[firstKey] : null;
        if (Array.isArray(arr) && arr.length && typeof arr[0] === 'string') {
          msg = arr[0];
        }
      }
      if (typeof msg !== 'string') {
        msg = 'Save failed';
      }
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  }, [enqueueSnackbar, formData, rows, searchParams, location.state, navigate, shippers, consignees, shipments, services, couriers]);

    return (
    <Box sx={{ width: '100%', mt: 4, px: { xs: 1, sm: 2 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h6"
                    fontWeight={700}
          color="text.primary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}
                >
                    Courier Packages Entry
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={() => navigate('/dashboard')}
                    >
                        Dashboard
                    </Typography>
          <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>•</Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        Power Tools
                    </Typography>
          <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>•</Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        Courier Packages Entry
                    </Typography>
                </Box>
            </Box>

      {editError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEditError(null)}>
          {editError}
        </Alert>
      ) : null}

      <Card sx={{ borderRadius: 2, boxShadow: (t) => t.shadows[4], mb: 3, position: 'relative' }}>
        {editLoading ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.72)',
              zIndex: 2,
              borderRadius: 2,
            }}
          >
            <CircularProgress />
          </Box>
        ) : null}
                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Invoice No.
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="invoiceNo"
                value={formData.invoiceNo}
                InputProps={{ readOnly: true }}
                inputProps={{ 'aria-readonly': true }}
                sx={{ maxWidth: { md: 400 }, '& .MuiInputBase-input': { color: 'text.secondary', cursor: 'default' } }}
              />
                        </Grid>

                        <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Shipper:
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                name="shipper"
                value={formData.shipper}
                onChange={handleChange}
                disabled={shippersLoading}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">
                  <em>—</em>
                </MenuItem>
                {shippers.map((s) => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.text}
                  </MenuItem>
                ))}
                {shipperOrphanOption ? (
                  <MenuItem value={shipperOrphanOption.value}>{shipperOrphanOption.label}</MenuItem>
                ) : null}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Consignee:
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                name="consignee"
                value={formData.consignee}
                onChange={handleChange}
                disabled={consigneesLoading}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">
                  <em>—</em>
                </MenuItem>
                {consignees.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </MenuItem>
                ))}
                {consigneeOrphanOption ? (
                  <MenuItem value={consigneeOrphanOption.value}>{consigneeOrphanOption.label}</MenuItem>
                ) : null}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Attention:
              </Typography>
                            <TextField fullWidth size="small" name="attention" value={formData.attention} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Address:
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
                        </Grid>

                        <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Phone #:
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
                        </Grid>
                        <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                AWB#:
              </Typography>
                            <TextField fullWidth size="small" name="awb" value={formData.awb} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Shipment Type:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {manualEntry.shipmentType ? (
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="shipmentType"
                                    value={formData.shipmentType}
                                    onChange={handleChange}
                    sx={{ flex: '1 1 auto', minWidth: 0 }}
                  />
                ) : (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="shipmentType"
                    value={formData.shipmentType ?? ''}
                    onChange={handleChange}
                    disabled={shipmentsLoading}
                    SelectProps={{
                      displayEmpty: true,
                      MenuProps: MERCH_DROPDOWN_MENU_PROPS,
                    }}
                    sx={{ flex: '1 1 auto', minWidth: 0 }}
                  >
                    {[
                      <MenuItem key="__shipment-empty" value="">
                        <em>—</em>
                      </MenuItem>,
                      ...shipments.map((t) => (
                        <MenuItem key={t.id} value={String(t.id)}>
                          {t.text}
                        </MenuItem>
                      )),
                      ...(shipmentOrphanOption
                        ? [
                            <MenuItem
                              key={`__shipment-orphan-${String(shipmentOrphanOption.value)}`}
                              value={shipmentOrphanOption.value}
                            >
                              {shipmentOrphanOption.label}
                            </MenuItem>,
                          ]
                        : []),
                    ]}
                                </TextField>
                )}
                <IconButton
                  type="button"
                  onClick={() => toggleManual('shipmentType')}
                  sx={{ flexShrink: 0, color: 'info.main', p: 0 }}
                  aria-label="Toggle manual shipment type"
                >
                                    <Iconify icon="eva:plus-fill" width={24} />
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Service Required:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {manualEntry.serviceRequired ? (
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="serviceRequired"
                                    value={formData.serviceRequired}
                                    onChange={handleChange}
                    sx={{ flex: '1 1 auto', minWidth: 0 }}
                  />
                ) : (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="serviceRequired"
                    value={formData.serviceRequired ?? ''}
                    onChange={handleChange}
                    disabled={servicesLoading}
                    SelectProps={{
                      displayEmpty: true,
                      MenuProps: MERCH_DROPDOWN_MENU_PROPS,
                    }}
                    sx={{ flex: '1 1 auto', minWidth: 0 }}
                  >
                    {[
                      <MenuItem key="__service-empty" value="">
                        <em>—</em>
                      </MenuItem>,
                      ...services.map((s) => (
                        <MenuItem key={s.id} value={String(s.id)}>
                          {s.text}
                        </MenuItem>
                      )),
                      ...(serviceOrphanOption
                        ? [
                            <MenuItem
                              key={`__service-orphan-${String(serviceOrphanOption.value)}`}
                              value={serviceOrphanOption.value}
                            >
                              {serviceOrphanOption.label}
                            </MenuItem>,
                          ]
                        : []),
                    ]}
                                </TextField>
                )}
                <IconButton
                  type="button"
                  onClick={() => toggleManual('serviceRequired')}
                  sx={{ flexShrink: 0, color: 'info.main', p: 0 }}
                  aria-label="Toggle manual service"
                >
                                    <Iconify icon="eva:plus-fill" width={24} />
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                AMS Courier & AWB#:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {manualEntry.amsCourierAwb ? (
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="amsCourierAwb"
                                    value={formData.amsCourierAwb}
                                    onChange={handleChange}
                    sx={{ flex: '1 1 auto', minWidth: 0 }}
                  />
                ) : (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="amsCourierAwb"
                    value={formData.amsCourierAwb ?? ''}
                    onChange={handleChange}
                    disabled={couriersLoading}
                    SelectProps={{
                      displayEmpty: true,
                      MenuProps: MERCH_DROPDOWN_MENU_PROPS,
                    }}
                    sx={{ flex: '1 1 auto', minWidth: 0 }}
                  >
                    {[
                      <MenuItem key="__courier-empty" value="">
                        <em>—</em>
                      </MenuItem>,
                      ...couriers.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                          {c.text}
                        </MenuItem>
                      )),
                      ...(courierOrphanOption
                        ? [
                            <MenuItem
                              key={`__courier-orphan-${String(courierOrphanOption.value)}`}
                              value={courierOrphanOption.value}
                            >
                              {courierOrphanOption.label}
                            </MenuItem>,
                          ]
                        : []),
                    ]}
                                </TextField>
                )}
                <IconButton
                  type="button"
                  onClick={() => toggleManual('amsCourierAwb')}
                  sx={{ flexShrink: 0, color: 'info.main', p: 0 }}
                  aria-label="Toggle manual courier"
                >
                                    <Iconify icon="eva:plus-fill" width={24} />
                                </IconButton>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Account:
              </Typography>
                            <TextField fullWidth size="small" name="account" value={formData.account} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1, mb: 1, fontWeight: 700 }}>
                                Detail
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Style / PO:
              </Typography>
                            <TextField fullWidth size="small" name="poStyle" value={detailData.poStyle} onChange={handleDetailChange} />
                        </Grid>
                        <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Description:
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="description"
                value={detailData.description}
                onChange={handleDetailChange}
              />
                        </Grid>

                        <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Quantity:
              </Typography>
                            <TextField fullWidth size="small" name="quantity" value={detailData.quantity} onChange={handleDetailChange} />
                        </Grid>
                        <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Price:
              </Typography>
                            <TextField fullWidth size="small" name="price" value={detailData.price} onChange={handleDetailChange} />
                        </Grid>

                        <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Amount:
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="amount"
                value={formatAmountForInput(detailData.amount)}
                InputProps={{ readOnly: true }}
                placeholder="Qty × Price"
                sx={{ '& .MuiInputBase-input': { color: 'text.secondary' } }}
              />
                        </Grid>
                        <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500, display: 'block' }}>
                Remarks:
              </Typography>
                            <TextField fullWidth size="small" name="remarks" value={detailData.remarks} onChange={handleDetailChange} />
            </Grid>
                        </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                                variant="contained"
              color="primary"
                                onClick={handleAddGrid}
                                sx={{
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: 0.5,
                px: 4,
                py: 1,
                minWidth: 120,
                                }}
                            >
                                ADD
                            </Button>
          </Box>

          {rows.length > 0 ? (
            <Paper
              variant="outlined"
              sx={{
                width: '100%',
                overflow: 'hidden',
                borderRadius: 1,
                bgcolor: 'background.paper',
                borderColor: 'divider',
              }}
            >
                            <DataGrid
                                rows={rows}
                                columns={columns}
                getRowId={(row) => row.id}
                processRowUpdate={processRowUpdate}
                                initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                                pageSizeOptions={[5, 10, 25]}
                                disableRowSelectionOnClick
                                autoHeight
                                hideFooterSelectedRowCount
                slots={{ noRowsOverlay: NoDetailRowsOverlay }}
                                sx={{
                  ...gridSx,
                  '& .MuiDataGrid-main': { minHeight: 'auto' },
                                }}
                            />
                        </Paper>
          ) : null}
                    </CardContent>
                </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 4 }}>
                <Button
                    variant="contained"
          color="primary"
          onClick={handleSaveMerchandising}
          disabled={editLoading || saveLoading}
          sx={{ fontWeight: 600, textTransform: 'none', minWidth: 120 }}
        >
          {getMerchandisingId(searchParams, location.state) ? 'Update' : 'Save'}
                </Button>
                <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate(-1)}
          sx={{ fontWeight: 600, textTransform: 'none', minWidth: 120 }}
                >
                    Cancel
                </Button>
            </Box>
        </Box>
    );
}
