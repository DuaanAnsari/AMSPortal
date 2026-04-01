import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Box,
  Card,
  Container,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
  Checkbox,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Autocomplete,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { History } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';
import axios from 'axios';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------
// AG Grid setup (same as Edit Order)
// ----------------------------------------------------------------------

LicenseManager.setLicenseKey(
  "Using_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-077aborr}_{granted_to_AMS_Baig_&_Co}_{for_application_{AMS_Portal}_is_not_permitted_for_apps_not_developed_in_partnership_with_AMS_Baig_&_Co}_{This_key_has_not_been_granted_a_Deployment_License_Add-on}_{This_key_works_with_{AG_Charts_and_AG_Grid}_Enterprise_versions_released_before_{28_April_2026}}_{[v3]_[0102]_MTc0NTc5NDgwMDAwMA==69c9a0c4f82299b15b7fc24c8226fac3}"
);
ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Shared helper: check if a formatted date string (dd/MM/yyyy) is a real date
// (not a sentinel/default value)
const SENTINEL_DATES = new Set([
  '01/01/2000', '01/01/0001', '01/01/1900', '30/12/1899', '01/01/1970',
  '', null, undefined,
]);
const isRealDate = (v) => !!v && !SENTINEL_DATES.has(v);

// Helper: Normalize process name to a safe JavaScript key
const getSafeKey = (proc, suffix) => {
  if (!proc) return '';
  const safeProc = proc.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return suffix ? `${safeProc}_${suffix.toLowerCase()}` : safeProc;
};

// Helper: Check if a column has any actual "activity" or progress data
const hasActivity = (proc, data) =>
  data.some((row) => {
    if (!row[`_processExists_${getSafeKey(proc)}`]) return false;

    const hasActual = isRealDate(row[getSafeKey(proc, 'actualDate')]);
    const qty = row[getSafeKey(proc, 'qtyCompleted')];
    const hasQty = qty != null && qty !== 0 && qty !== '' && String(qty) !== '0';
    
    const status = row[getSafeKey(proc, 'status')];
    const hasStatusProgress =
      status && !['Created', 'Pending', 'No Activity', ''].includes(status);

    return hasActual || hasQty || hasStatusProgress;
  });

// Unified helper to filter column definitions based on data presence
const getFilteredColumnDefs = (allColDefs, data, pList) => {
  try {
    const fixedCols = allColDefs.slice(0, 5);
    const processCols = allColDefs.slice(5).filter((colDef) => {
      const proc = colDef.headerName;
      if (!proc) return false;

      const safeBase = getSafeKey(proc);
      const existsKey = `_processExists_${safeBase}`;
      const idealKey = getSafeKey(proc, 'idealDate');

      // Show if process exists AND (has a real ideal date OR has any actual activity)
      const exists = data.some((row) => row[existsKey]);
      const hasIdeal = data.some(
        (row) => row[existsKey] && isRealDate(row[idealKey])
      );
      const active = hasActivity(proc, data);

      return exists && (hasIdeal || active);
    });
    return [...fixedCols, ...processCols];
  } catch (err) {
    console.error('[TNA Chart] getFilteredColumnDefs error:', err);
    return allColDefs;
  }
};
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Checkbox that blocks AG Grid's native range-selection mousedown via capture phase
const SelectCheckbox = React.memo(({ isChecked, onToggle }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stopIt = (e) => e.stopImmediatePropagation();
    el.addEventListener('mousedown', stopIt, true); // capture: fires before AG Grid
    return () => el.removeEventListener('mousedown', stopIt, true);
  }, []);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={isChecked}
      onChange={onToggle}
      style={{ cursor: 'pointer', margin: 0, width: 16, height: 16, accentColor: '#1976d2' }}
    />
  );
});

// Process group header — checkbox to select all rows for this process
const ProcessGroupHeader = (params) => {
  const { displayName, onSelectAll } = params;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', height: '100%', overflow: 'visible' }}>
      <input
        type="checkbox"
        style={{ margin: 0, cursor: 'pointer', flexShrink: 0, width: 16, height: 16, accentColor: '#1976d2' }}
        title={`Select all rows for: ${displayName}`}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => { if (onSelectAll) onSelectAll(displayName, e.target.checked); }}
      />
      <span style={{
        fontWeight: 600,
        fontSize: '12px',
        whiteSpace: 'nowrap',
        position: 'sticky',
        left: 6,
        zIndex: 1,
      }}>
        {displayName}
      </span>
    </Box>
  );
};

// ----------------------------------------------------------------------

export default function TNAChartPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const gridRef = useRef(null);
  const dragScrollRef = useRef({ active: false, wasDragged: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
  const fullColDefsRef = useRef([]); // stores unfiltered column defs for dynamic visibility
  const processKeyToNameRef = useRef(new Map()); // safeKey(proc) -> original process name

  const onGridReady = useCallback((params) => {
    const gridDiv = params.api.getGridBody?.()?.eGridBody
      || gridRef.current?.eGridDiv
      || document.querySelector('.ag-root-wrapper');
    if (!gridDiv) return;

    const hScroll = gridDiv.querySelector('.ag-center-cols-viewport')
      || gridDiv.querySelector('.ag-body-horizontal-scroll-viewport');
    const vScroll = gridDiv.querySelector('.ag-body-viewport');

    if (!hScroll && !vScroll) return;

    const target = hScroll || vScroll;
    target.style.cursor = 'grab';

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      const ds = dragScrollRef.current;
      ds.active = true;
      ds.wasDragged = false;
      ds.startX = e.clientX;
      ds.startY = e.clientY;
      ds.scrollLeftH = hScroll ? hScroll.scrollLeft : 0;
      ds.scrollTopV = vScroll ? vScroll.scrollTop : 0;
      target.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    const onMouseMove = (e) => {
      const ds = dragScrollRef.current;
      if (!ds.active) return;
      const dx = Math.abs(e.clientX - ds.startX);
      const dy = Math.abs(e.clientY - ds.startY);
      if (dx > 5 || dy > 5) ds.wasDragged = true;
      e.preventDefault();
      if (hScroll) hScroll.scrollLeft = ds.scrollLeftH - (e.clientX - ds.startX);
      if (vScroll) vScroll.scrollTop = ds.scrollTopV - (e.clientY - ds.startY);
    };

    const onMouseUp = () => {
      const ds = dragScrollRef.current;
      ds.active = false;
      target.style.cursor = 'grab';
      document.body.style.userSelect = '';
      setTimeout(() => { ds.wasDragged = false; }, 100);
    };

    target.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const [tableData, setTableData] = useState([]);
  const [fullData, setFullData] = useState([]); // Store complete unfiltered data
  const [customers, setCustomers] = useState([]); // All customers from API
  const [selectedCustomer, setSelectedCustomer] = useState(''); // Selected customer ID
  const [productPortfolios, setProductPortfolios] = useState([]); // Portfolio names
  const [loading, setLoading] = useState(false);
  const [allPoOptions, setAllPoOptions] = useState([]); // PO options with portfolio grouping
  const [selectedPoNumbers, setSelectedPoNumbers] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null); // Track selected portfolio
  const [availablePortfolios, setAvailablePortfolios] = useState([]); // Portfolio options for dropdown
  const [portfolioGroupsRef, setPortfolioGroupsRef] = useState([]); // Raw API portfolio groups
  const [allColors, setAllColors] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [modifiedRows, setModifiedRows] = useState(new Map());
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // ----------------------------------------------------------------------
  // Assign Team (popup) state
  // ----------------------------------------------------------------------
  const [assignTeamModalOpen, setAssignTeamModalOpen] = useState(false);
  const [assignOptionsLoading, setAssignOptionsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [setDataLoading, setSetDataLoading] = useState(false);
  const assignOptionsFetchedRef = useRef(false);
  /** Last successful dropdown lists — avoids stale React closure on early-return path */
  const assignTeamListsRef = useRef({
    merch: [],
    qa: [],
    printQa: [],
    production: [],
    shipping: [],
  });
  const setDataRequestIdRef = useRef(0);

  const [assignPoIds, setAssignPoIds] = useState([]); // PO IDs to update via SetDataUpdate
  const [assignForm, setAssignForm] = useState({
    merchandiserAssistant: [],
    qa: [],
    printQa: 'N/A',
    productionFollowup: '',
    prodPersonID: null,
    shippingPerson: 'MEHWISH RIAZ',
    productionStatus: 'N/A',
  });

  const [merchAssistantOptions, setMerchAssistantOptions] = useState([]);
  const [qaList, setQaList] = useState([]);
  const [printQaList, setPrintQaList] = useState([]);
  const [productionList, setProductionList] = useState([]);
  const [shippingList, setShippingList] = useState([]);

  const merchAssistantOptionsWithNA = useMemo(() => {
    const names = merchAssistantOptions
      .map((x) => x?.userName)
      .filter(Boolean);
    const uniqueNames = [...new Set(names)];
    return ['N/A', ...uniqueNames];
  }, [merchAssistantOptions]);

  const qaOptions = useMemo(() => {
    const names = qaList
      .map((x) => x?.userName)
      .filter(Boolean);
    const uniqueNames = [...new Set(names)];
    return ['N/A', ...uniqueNames];
  }, [qaList]);

  const printQaOptionsWithNA = useMemo(() => {
    const names = printQaList
      .map((x) => x?.userName)
      .filter(Boolean);
    const uniqueNames = [...new Set(names)];
    return ['N/A', ...uniqueNames];
  }, [printQaList]);

  const normalizeText = (v) => String(v ?? '').trim().toLowerCase();

  const extractNumericId = (item) => {
    if (!item) return null;
    const rawId =
      item.userId ??
      item.userID ??
      item.id ??
      item.employeeId ??
      item.employeeID ??
      item.empId ??
      item.empID ??
      item.qaid ??
      item.printQAID ??
      item.prodPersonID ??
      item.shipPersonID ??
      item.marchandID;
    const n = Number(rawId);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const getUserIdByName = (list, name) => {
    if (!name || name === 'N/A' || name === 'Please select' || name === 'Please Select') return null;
    const target = normalizeText(name);
    const hit = (list || []).find((x) => normalizeText(x?.userName ?? x?.name) === target);
    return extractNumericId(hit);
  };

  const getVisiblePoIds = useCallback(() => {
    const ids = [...new Set((tableData || []).map((r) => Number(r?.poid)).filter((v) => Number.isFinite(v) && v > 0))];
    return ids;
  }, [tableData]);

  const containerStyle = useMemo(
    () => ({
      width: '100%',
      height: '400px',
    }),
    []
  );

  // Total modified process count (for Save button label)
  const modifiedProcessCount = useMemo(() => {
    if (modifiedRows.size === 0) return 0;

    let count = 0;

    modifiedRows.forEach((row) => {
      const processesInRow = new Set();
      const changedFields = new Set(row.__changedFields || []);

      const editableSuffixes = new Set([
        'status',
        'qtycompleted',
        'actualdate',
        'idealdate',
        'estimateddate',
        'approvaldatee',
        'units',
        'prefilledremarks',
        'tnachartid',
        'date',
      ]);

      changedFields.forEach((key) => {
        const lastUnderscore = key.lastIndexOf('_');
        if (lastUnderscore === -1) return;
        const proc = key.slice(0, lastUnderscore);
        const suffix = key.slice(lastUnderscore + 1);

        if (editableSuffixes.has(suffix)) {
          processesInRow.add(proc);
        }
      });

      count += processesInRow.size;
    });

    return count;
  }, [modifiedRows]);

  const [columnDefs, setColumnDefs] = useState([]);
  const restoredFromCacheRef = useRef(false);

  const fetchProcessListByPortfolio = useCallback(async (portfolioId) => {
    if (!portfolioId) return [];
    try {
      const resp = await apiClient.get(`/Milestone/GetprocessByPortfolio?ProductPortfolioID=${portfolioId}`);
      const raw = resp.data || [];

      // API may return: ["Yarn Booking", ...] OR [{processName:"Yarn Booking"}, ...] etc.
      const names = (Array.isArray(raw) ? raw : [])
        .map((x) => {
          if (!x) return null;
          if (typeof x === 'string') return x;
          return x.processName || x.process || x.name || x.ProcessName || x.Process || x.Name || null;
        })
        .filter(Boolean);

      // rebuild mapping for save/not-applicable flows
      const m = new Map();
      names.forEach((n) => {
        const safe = getSafeKey(n);
        if (!m.has(safe)) m.set(safe, n);
      });
      processKeyToNameRef.current = m;

      return names;
    } catch (err) {
      console.error('[TNA Chart] Error fetching processes by portfolio:', err);
      return [];
    }
  }, []);

  // Parse date coming from API (string) into JS Date for grid/editor
  const parseApiDateToDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
      // 1. Handle dd/MM/yyyy
      const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      let match = value.match(ddmmyyyy);
      if (match) {
        const [, dd, mm, yyyy] = match;
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      }

      // 2. Handle pure yyyy-MM-dd (date-only from API)
      // Parse manually only for pure date strings (no time/timezone part).
      const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
      match = value.match(yyyymmdd);
      if (match) {
        const [, yyyy, mm, dd] = match;
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      }

      // 3. Handle ISO date-time strings (with time/timezone) using native Date
      // so local calendar day stays correct after timezone conversion.
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return d;
      }
    }

    return null;
  };

  // Format date value for grid display (dd/MM/yyyy)
  const formatGridDate = (value) => {
    if (!value) return '';

    const d = parseApiDateToDate(value);
    if (!d) return '';

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await apiClient.get('/MyOrders/GetCustomer');
        const list = response.data || [];
        setCustomers(list);
      } catch (error) {
        console.error('Error fetching customers for TNA Chart:', error);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch product portfolios for name mapping
  useEffect(() => {
    const fetchProductPortfolios = async () => {
      try {
        const response = await apiClient.get('/MyOrders/GetProductPortfolio');
        const list = response.data || [];
        setProductPortfolios(list);
      } catch (error) {
        console.error('Error fetching product portfolios for TNA Chart:', error);
      }
    };

    fetchProductPortfolios();
  }, []);

  // Auto-refetch when returning from TNA View (Applicable action)
  useEffect(() => {
    if (location.state?.refreshFromTNAView) {
      // Prefer customerID from state, fall back to sessionStorage
      const customerToLoad = location.state?.customerID || sessionStorage.getItem('tna_last_customer');
      if (customerToLoad) {
        setSelectedCustomer(customerToLoad);
        handleSearch(customerToLoad);
      }
      // Clear the state so it doesn't trigger again on re-render
      navigate(location.pathname, { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // When returning from History/TNA-View via back, state is restored from session cache
  // in the dedicated "Restore cached state" effect below. No extra refetch here.

  // Restore cached state ONLY when returning via back button from TNA-View
  useEffect(() => {
    if (restoredFromCacheRef.current) return;
    if (location.state?.refreshFromTNAView) return;

    // Only restore if user specifically came back from TNA-View
    const backFromView = sessionStorage.getItem('tna_back_from_view');
    if (!backFromView) return;

    const raw = sessionStorage.getItem('tna_chart_cache');
    if (!raw) return;

    try {
      const cache = JSON.parse(raw);
      // Clear the flag so next fresh visit doesn't use cache
      sessionStorage.removeItem('tna_back_from_view');
      restoredFromCacheRef.current = true;
      setSelectedCustomer(cache.customer);
      setPortfolioGroupsRef(cache.portfolioGroups);
      setSelectedPortfolioId(cache.portfolioId);
      setAvailablePortfolios(cache.portfolioOptions || []);
      setAllPoOptions(cache.poOptions || []);
      buildGridForPortfolio(cache.portfolioId, cache.portfolioGroups);

      const cachedPoNumbers = cache.selectedPoNumbers || [];
      const cachedColors = cache.selectedColors || [];

      if (cachedPoNumbers.length > 0 || cachedColors.length > 0) {
        // Delay setting filters so grid data/columns are ready
        setTimeout(() => {
          if (cachedPoNumbers.length > 0) {
            setSelectedPoNumbers(cachedPoNumbers);
          }
          if (cachedColors.length > 0) {
            setSelectedColors(cachedColors);
          }
        }, 0);
      }
    } catch (_) {
      sessionStorage.removeItem('tna_back_from_view');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute dropdown options and visible rows whenever selections or data change
  useEffect(() => {
    if (fullData.length === 0) return;

    // Rebuild color dropdown based on selected POs
    let colorBase = fullData;
    if (selectedPoNumbers.length > 0) {
      colorBase = colorBase.filter((row) => selectedPoNumbers.includes(row.poNo));
    }

    const uniqueColors = [...new Set(colorBase.map((row) => row.color))]
      .filter(Boolean)
      .sort();
    setAllColors(uniqueColors);

    // Compute filtered grid data
    let filteredData = fullData;

    if (selectedPoNumbers.length > 0) {
      filteredData = filteredData.filter((row) =>
        selectedPoNumbers.includes(row.poNo)
      );
    }

    if (selectedColors.length > 0) {
      filteredData = filteredData.filter((row) =>
        selectedColors.includes(row.color)
      );
    }

    setTableData(filteredData);

    // Remove process column groups that have no activity in filtered rows
    if (fullColDefsRef.current.length > 0) {
      const pList = fullColDefsRef.current.slice(5).map((c) => c.headerName);
      const filteredCols = getFilteredColumnDefs(
        fullColDefsRef.current,
        filteredData,
        pList
      );
      setColumnDefs(filteredCols);
    }
  }, [fullData, selectedColors, selectedPoNumbers]);

  // Persist PO / Color filters in sessionStorage so they survive navigation
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('tna_chart_cache');
      if (!raw) return;
      const cache = JSON.parse(raw);
      const updated = {
        ...cache,
        selectedPoNumbers,
        selectedColors,
      };
      sessionStorage.setItem('tna_chart_cache', JSON.stringify(updated));
    } catch {
      // ignore JSON / storage errors
    }
  }, [selectedPoNumbers, selectedColors]);

  const handleSearch = async (customerId) => {
    const idToUse = customerId || selectedCustomer;

    if (!idToUse) {
      setTableData([]);
      setFullData([]);
      setColumnDefs([]);
      setAllPoOptions([]);
      return;
    }

    // Clear previous data immediately
    setTableData([]);
    setFullData([]);
    setColumnDefs([]);
    setAllPoOptions([]);
    setAvailablePortfolios([]);
    setPortfolioGroupsRef([]);

    setLoading(true);
    try {
      // Fetch TNA data grouped by portfolio
      const response = await apiClient.get(`/Milestone/GetTNAandPO?CustomerID=${idToUse}&Selected=true`);
      // eslint-disable-next-line no-console
      console.log('[TNA Chart] API Response:', response.data);
      const rawGroups = response.data || [];

      // eslint-disable-next-line no-console
      console.log('[TNA Chart] rawGroups count:', rawGroups.length, '| portfolioIDs:', rawGroups.map(g => g.portfolioID));
      // eslint-disable-next-line no-console
      console.log('[TNA Chart] rawGroups with portfolioID 0:', rawGroups.filter(g => !g.portfolioID || g.portfolioID === 0).map(g => ({ portfolioID: g.portfolioID, tnaDataCount: g.tnaData?.length, poNos: [...new Set((g.tnaData || []).map(i => i.poNo))] })));

      // Filter out portfolioID 0 (unassigned POs)
      const portfolioGroups = rawGroups.filter(g => g.portfolioID && g.portfolioID !== 0);

      // Store raw groups for portfolio switching
      setPortfolioGroupsRef(portfolioGroups);

      // Build portfolio dropdown options
      const portfolioOptions = portfolioGroups.map(group => {
        const portfolio = productPortfolios.find(p => p.productPortfolioID === group.portfolioID);
        const portfolioName = portfolio ? portfolio.productPortfolio : 'Other';
        return { id: group.portfolioID, name: portfolioName };
      });
      setAvailablePortfolios(portfolioOptions);

      // Auto-select first portfolio
      const firstPortfolioId = portfolioGroups[0]?.portfolioID ?? null;
      setSelectedPortfolioId(firstPortfolioId);

      // Save cache so we can restore without API call when user presses back
      try {
        sessionStorage.setItem('tna_chart_cache', JSON.stringify({
          customer: idToUse,
          portfolioGroups,
          portfolioId: firstPortfolioId,
          portfolioOptions,
        }));
      } catch (_) { /* ignore quota errors */ }

      // Use only the first portfolio's data for initial grid
      const selectedGroup = portfolioGroups.find(g => g.portfolioID === firstPortfolioId);
      let allTnaData = [];
      if (selectedGroup?.tnaData && Array.isArray(selectedGroup.tnaData)) {
        allTnaData = selectedGroup.tnaData.map(item => ({
          ...item,
          portfolioID: selectedGroup.portfolioID,
          pcPerCarton: item.pcPerCarton ?? selectedGroup.pcPerCarton,
        }));
      }

      // eslint-disable-next-line no-console
      console.log('[TNA Chart] STEP 1 - allTnaData count:', allTnaData.length, '| unique POs:', [...new Set(allTnaData.map(i => i.poNo))]);
      // eslint-disable-next-line no-console
      console.log('[TNA Chart] STEP 1 - all processes in data:', [...new Set(allTnaData.map(i => i.process))].filter(Boolean));

      // Process headers should come from API by selected portfolio
      let processList = await fetchProcessListByPortfolio(firstPortfolioId);
      if (!processList || processList.length === 0) {
        // fallback: derive from data (old behavior) if process API returns nothing
        const processSeqMap = new Map();
        allTnaData.forEach(item => {
          if (item.process) {
            const seq = item.sequence ?? 9999;
            if (!processSeqMap.has(item.process) || seq < processSeqMap.get(item.process)) {
              processSeqMap.set(item.process, seq);
            }
          }
        });
        processList = Array.from(processSeqMap.keys()).sort(
          (a, b) => processSeqMap.get(a) - processSeqMap.get(b)
        );
        const m = new Map();
        processList.forEach((n) => {
          const safe = getSafeKey(n);
          if (!m.has(safe)) m.set(safe, n);
        });
        processKeyToNameRef.current = m;
      }
      // eslint-disable-next-line no-console
      console.log('[TNA Chart] STEP 2 - processList (sorted):', processList);

      // Build PO options from ALL portfolios (grouped by portfolio name)
      const poOptionsWithPortfolio = [];
      portfolioGroups.forEach(group => {
        if (group.tnaData && Array.isArray(group.tnaData)) {
          const uniquePos = [...new Set(group.tnaData.map(item => item.poNo))].filter(Boolean);
          const portfolio = productPortfolios.find(p => p.productPortfolioID === group.portfolioID);
          const portfolioName = portfolio ? portfolio.productPortfolio : 'Other';
          uniquePos.forEach(poNo => {
            poOptionsWithPortfolio.push({
              poNo,
              portfolioID: group.portfolioID,
              portfolioName,
              label: `${poNo}`,
            });
          });
        }
      });
      setAllPoOptions(poOptionsWithPortfolio);

      // Update cache with poOptions too
      try {
        sessionStorage.setItem('tna_chart_cache', JSON.stringify({
          customer: idToUse,
          portfolioGroups,
          portfolioId: firstPortfolioId,
          portfolioOptions,
          poOptions: poOptionsWithPortfolio,
        }));
      } catch (_) { /* ignore quota errors */ }

      const poData = allTnaData;

      // 1. Construct Columns (group headers) - fixed sub‑columns per process
      const newColDefs = [
        {
          headerName: '',
          field: '__assignDot',
          pinned: 'left',
          maxWidth: 48,
          minWidth: 48,
          sortable: false,
          filter: false,
          suppressHeaderMenuButton: true,
          cellRenderer: (params) => (
            <IconButton
              size="small"
              sx={{ p: 0 }}
              title="Assign Team"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAssignTeamForPo(params.data?.poid);
              }}
            >
              <Box component="span" sx={{ fontSize: 20, lineHeight: 1, color: '#1976d2' }}>
                •
              </Box>
            </IconButton>
          ),
        },
        { headerName: 'PO No', field: 'poNo', pinned: 'left', maxWidth: 100, suppressHeaderMenuButton: true },
        { headerName: 'Customer', field: 'customer', pinned: 'left', maxWidth: 100, suppressHeaderMenuButton: true },
        {
          headerName: 'PCS',
          field: 'pcPerCarton',
          pinned: 'left',
          maxWidth: 100,
          editable: true,
          suppressHeaderMenuButton: true,
          valueFormatter: (params) => {
            const v = params.value;
            if (v === null || v === undefined || v === '') return '';
            return String(v);
          },
        },
        { headerName: 'Color', field: 'color', pinned: 'left', maxWidth: 100, suppressHeaderMenuButton: true, cellStyle: { borderRight: '2px solid #999' } },
        ...processList.map((proc) => {
          const safeKey = (suffix) => getSafeKey(proc, suffix);
          const existsKey = `_processExists_${getSafeKey(proc)}`;

          const noProcessRenderer = (params) => {
            if (!params.data?.[existsKey]) return '';
            return params.value ?? '';
          };
          const emptyIfNoProcess = (params) => {
            if (!params.data?.[existsKey]) return '';
            return params.value ?? '';
          };
          const notEditableIfNoProcess = (params) => !!params.data?.[existsKey];
          const noProcessCellStyle = (params) => {
            const base = {};
            if (!params.data?.[existsKey]) {
              return { ...base, backgroundColor: '#f5f5f5', color: '#bbb' };
            }
            return base;
          };
          const dateFilterParams = {
            comparator: (filterDate, cellValue) => {
              if (!cellValue) return -1;
              const cellDate = parseApiDateToDate(cellValue);
              if (!cellDate) return -1;
              if (cellDate < filterDate) return -1;
              if (cellDate > filterDate) return 1;
              return 0;
            },
          };
          return {
            headerName: proc,
            headerGroupComponent: ProcessGroupHeader,
            headerGroupComponentParams: { onSelectAll: handleSelectAllForProcess },
            children: [
              {
                headerName: 'Target Date',
                field: safeKey('idealDate'),
                minWidth: 110,
                editable: false,
                filter: false,
                sortable: false,
                suppressHeaderMenuButton: true,
                cellRenderer: noProcessRenderer,
                cellStyle: noProcessCellStyle,
              },
              {
                headerName: 'Factory Commitment Date',
                field: safeKey('actualDate'),
                minWidth: 130,
                editable: notEditableIfNoProcess,
                filter: 'agDateColumnFilter',
                filterParams: dateFilterParams,
                cellRenderer: emptyIfNoProcess,
                cellStyle: noProcessCellStyle,
              },
              {
                headerName: 'Submission Date',
                field: safeKey('approvalDatee'),
                minWidth: 110,
                editable: notEditableIfNoProcess,
                filter: 'agDateColumnFilter',
                filterParams: dateFilterParams,
                cellRenderer: emptyIfNoProcess,
                cellStyle: noProcessCellStyle,
              },
              {
                headerName: 'Approval Date',
                field: safeKey('estimatedDate'),
                minWidth: 110,
                editable: notEditableIfNoProcess,
                filter: 'agDateColumnFilter',
                filterParams: dateFilterParams,
                cellRenderer: emptyIfNoProcess,
                cellStyle: noProcessCellStyle,
              },
              {
                headerName: 'Quantity Completed',
                field: safeKey('qtyCompleted'),
                minWidth: 120,
                editable: notEditableIfNoProcess,
                cellRenderer: emptyIfNoProcess,
                cellStyle: noProcessCellStyle,
              },
              { headerName: 'Unit', field: safeKey('units'), minWidth: 70, editable: notEditableIfNoProcess, cellRenderer: emptyIfNoProcess, cellStyle: noProcessCellStyle },
              { headerName: 'Status', field: safeKey('status'), minWidth: 110, editable: notEditableIfNoProcess, cellEditor: 'agSelectCellEditor', cellEditorParams: (p) => { const base = ['Pending', 'Completed', 'No Activity']; const cur = p.value; return { values: cur && !base.includes(cur) ? [cur, ...base] : base }; }, cellRenderer: emptyIfNoProcess, cellStyle: noProcessCellStyle },
              {
                headerName: 'Remarks',
                field: safeKey('preFilledRemarks'),
                minWidth: 140,
                editable: notEditableIfNoProcess,
                cellRenderer: emptyIfNoProcess,
                cellStyle: noProcessCellStyle,
              },
              {
                headerName: 'History',
                field: safeKey('history'),
                minWidth: 70,
                maxWidth: 70,
                editable: false,
                sortable: false,
                filter: false,
                cellRenderer: (params) => {
                  if (!params.data?.[existsKey]) return '';
                  const tnaChartID = params.data[safeKey('tnaChartID')];
                  return (
                    <IconButton
                      size="small"
                      color="primary"
                      sx={{ p: 0 }}
                      onClick={() => navigate('/dashboard/supply-chain/tna-history', {
                        state: { tnaChartID, processName: proc, portfolioName: params.data.customer || '' },
                      })}
                    >
                      <History fontSize="small" />
                    </IconButton>
                  );
                },
                cellStyle: (params) => {
                  const base = { borderRight: '2px solid #999' };
                  if (!params.data?.[existsKey]) {
                    return { ...base, backgroundColor: '#f5f5f5', color: '#bbb' };
                  }
                  return base;
                },
                headerClass: 'ag-group-last-header',
              },
            ],
          };
        }),
      ];

      // NOTE: setColumnDefs will be called below after filtering active processes only

      // 2. Pivot Data: one row per PO + Color, processes as column groups
      const rowMap = new Map();

      poData.forEach((item) => {
        if (!item.poid) return;

        const colorValue =
          item.colourway ||
          item.Colourway ||
          item.colorway ||
          item.Colorway ||
          item.color ||
          item.Color ||
          '';

        const key = `${item.poid}_${colorValue || ''}`;

        // pcPerCarton - support multiple API casing (camelCase, PascalCase)
        const pcPerCarton =
          item.pcPerCarton ??
          item.PcPerCarton ??
          item.PCPerCarton ??
          item.pcsPerCarton ??
          item.PcsPerCarton ??
          '';

        if (!rowMap.has(key)) {
          rowMap.set(key, {
            poid: item.poid,
            poNo: item.poNo,
            customer: item.customer || item.customerName || '',
            pcPerCarton,
            color: colorValue,
            status: item.status,
            qtyCompleted: item.qtyCompleted,
            freezeCondPPSample: item.freezeCondPPSample,
          });
        }
        const row = rowMap.get(key);
        // Update pcPerCarton if we get it from any item (first may not have it)
        if (pcPerCarton !== '' && pcPerCarton != null) {
          row.pcPerCarton = pcPerCarton;
        }
        if (item.process) {
          const proc = item.process;
          const safe = (suffix) => getSafeKey(proc, suffix);

          const formattedIdealDate = formatGridDate(parseApiDateToDate(item.idealDate)) || null;
          const formattedActualDate = formatGridDate(parseApiDateToDate(item.actualDate)) || null;
          const formattedApprovalDatee = formatGridDate(parseApiDateToDate(item.approvalDatee)) || null;
          const formattedEstimatedDate = formatGridDate(parseApiDateToDate(item.estimatedDate)) || null;
          const missingOrInvalidDateFields = [
            ['idealDate', formattedIdealDate],
            ['actualDate', formattedActualDate],
            ['approvalDatee', formattedApprovalDatee],
            ['estimatedDate', formattedEstimatedDate],
          ]
            .filter(([, value]) => !value)
            .map(([field]) => field);

          // Per‑process fields mapped to safe, standardized keys
          row[safe('date')] = formatGridDate(parseApiDateToDate(item.date)) || null;
          row[safe('idealDate')] = formattedIdealDate;
          row[safe('actualDate')] = formattedActualDate;
          row[safe('approvalDatee')] = formattedApprovalDatee;
          row[safe('estimatedDate')] = formattedEstimatedDate;
          row[safe('dateSpan')] = item.dateSpan;

          row[safe('units')] = item.units || item.Units || '';
          row[safe('status')] = item.status || '';
          row[safe('preFilledRemarks')] =
            item.preFilledRemarks ||
            item.PreFilledRemarks ||
            item.prefilledRemarks ||
            '';
          row[safe('qtyCompleted')] =
            item.qtyCompleted ?? item.QtyCompleted ?? '';
          row[safe('freezeCondPPSample')] = formatGridDate(parseApiDateToDate(item.freezeCondPPSample)) || null;
          // IDs / sequence per process for UpdateTNA
          row[safe('tnaChartID')] = item.tnaChartID ?? item.tnaChartId ?? 0;
          row[safe('sequence')] = item.sequence ?? 0;
        }
      });

      const rawFinalData = Array.from(rowMap.values()).sort((a, b) => b.poid - a.poid);

      const finalData = rawFinalData.map(row => {
        processList.forEach(proc => {
          const safeProc = getSafeKey(proc);
          const tnaID = row[`${safeProc}_tnachartid`]; 
          row[`_processExists_${safeProc}`] = !!tnaID;
        });
        return row;
      });

      // Apply unified filtering
      const filteredColDefs = getFilteredColumnDefs(newColDefs, finalData, processList);
      fullColDefsRef.current = filteredColDefs;
      setColumnDefs(filteredColDefs);

      setFullData(finalData);
      
      // eslint-disable-next-line no-console
      if (finalData.length > 0) {
        console.log('[TNA Chart] VERIFY KEYS FOR FIRST ROW:', Object.keys(finalData[0]).filter(k => k.includes('Washing') || k.includes('Specs Approval')));
      }
    } catch (error) {
      console.error('Error fetching TNA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (event) => {
    const value = event.target.value;
    setSelectedCustomer(value);
    setSelectedPoNumbers([]);
    setSelectedColors([]);
    setSelectedPortfolioId(null);
    setAvailablePortfolios([]);
    setPortfolioGroupsRef([]);
    assignOptionsFetchedRef.current = false;
    assignTeamListsRef.current = {
      merch: [],
      qa: [],
      printQa: [],
      production: [],
      shipping: [],
    };
    // Clear cache so old customer data doesn't restore on next mount
    sessionStorage.removeItem('tna_chart_cache');
    restoredFromCacheRef.current = false;
    // Remember last selected customer so we can auto-refetch on return from TNA View
    sessionStorage.setItem('tna_last_customer', value);
    handleSearch(value);
  };

  const buildGridForPortfolio = useCallback((portfolioId, groups) => {
    const run = async () => {
      const selectedGroup = groups.find(g => g.portfolioID === portfolioId);
      if (!selectedGroup?.tnaData) {
        setTableData([]);
        setFullData([]);
        setColumnDefs([]);
        setAllPoOptions([]);
        return;
      }

      const allTnaData = selectedGroup.tnaData.map(item => ({
        ...item,
        portfolioID: selectedGroup.portfolioID,
        pcPerCarton: item.pcPerCarton ?? selectedGroup.pcPerCarton,
      }));

      let processList = await fetchProcessListByPortfolio(portfolioId);
      if (!processList || processList.length === 0) {
        const processSeqMap = new Map();
        allTnaData.forEach(item => {
          if (item.process) {
            const seq = item.sequence ?? 9999;
            if (!processSeqMap.has(item.process) || seq < processSeqMap.get(item.process)) {
              processSeqMap.set(item.process, seq);
            }
          }
        });
        processList = Array.from(processSeqMap.keys()).sort(
          (a, b) => processSeqMap.get(a) - processSeqMap.get(b)
        );
        const m = new Map();
        processList.forEach((n) => {
          const safe = getSafeKey(n);
          if (!m.has(safe)) m.set(safe, n);
        });
        processKeyToNameRef.current = m;
      }

    // Column defs
    const newColDefs = [
      {
        headerName: '',
        field: '__assignDot',
        pinned: 'left',
        maxWidth: 48,
        minWidth: 48,
        sortable: false,
        filter: false,
        suppressHeaderMenuButton: true,
        cellRenderer: (params) => (
          <IconButton
            size="small"
            sx={{ p: 0 }}
            title="Assign Team"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAssignTeamForPo(params.data?.poid);
            }}
          >
            <Box component="span" sx={{ fontSize: 20, lineHeight: 1, color: '#1976d2' }}>
              •
            </Box>
          </IconButton>
        ),
      },
      { headerName: 'PO No', field: 'poNo', pinned: 'left', maxWidth: 100, suppressHeaderMenuButton: true },
      { headerName: 'Customer', field: 'customer', pinned: 'left', maxWidth: 100, suppressHeaderMenuButton: true },
      {
        headerName: 'PCS',
        field: 'pcPerCarton',
        pinned: 'left',
        maxWidth: 100,
        editable: true,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          const v = params.value;
          if (v === null || v === undefined || v === '') return '';
          return String(v);
        },
      },
      { headerName: 'Color', field: 'color', pinned: 'left', maxWidth: 100, suppressHeaderMenuButton: true, cellStyle: { borderRight: '2px solid #999' } },
      ...processList.map((proc) => {
        const safeKey = (suffix) => getSafeKey(proc, suffix);
        const existsKey = `_processExists_${getSafeKey(proc)}`;
        const noProcessRenderer = (params) => {
          if (!params.data?.[existsKey]) return '';
          return params.value ?? '';
        };
        const emptyIfNoProcess = (params) => {
          if (!params.data?.[existsKey]) return '';
          return params.value ?? '';
        };
        const notEditableIfNoProcess = (params) => !!params.data?.[existsKey];
        const noProcessCellStyle = (params) => {
          const base = {};
          if (!params.data?.[existsKey]) {
            return { ...base, backgroundColor: '#f5f5f5', color: '#bbb' };
          }
          return base;
        };
        const dateFilterParams = {
          comparator: (filterDate, cellValue) => {
            if (!cellValue) return -1;
            const cellDate = parseApiDateToDate(cellValue);
            if (!cellDate) return -1;
            if (cellDate < filterDate) return -1;
            if (cellDate > filterDate) return 1;
            return 0;
          },
        };
        return {
          headerName: proc,
          headerGroupComponent: ProcessGroupHeader,
          headerGroupComponentParams: { onSelectAll: handleSelectAllForProcess },
          children: [
            {
              headerName: 'Target Date',
              field: safeKey('idealDate'),
              minWidth: 110,
              editable: false,
              filter: false,
              sortable: false,
              suppressHeaderMenuButton: true,
              cellRenderer: noProcessRenderer,
              cellStyle: noProcessCellStyle,
            },
            {
              headerName: 'Factory Commitment Date',
              field: safeKey('actualDate'),
              minWidth: 130,
              editable: notEditableIfNoProcess,
              filter: 'agDateColumnFilter',
              filterParams: dateFilterParams,
              cellRenderer: emptyIfNoProcess,
              cellStyle: noProcessCellStyle,
            },
            {
              headerName: 'Submission Date',
              field: safeKey('approvalDatee'),
              minWidth: 110,
              editable: notEditableIfNoProcess,
              filter: 'agDateColumnFilter',
              filterParams: dateFilterParams,
              cellRenderer: emptyIfNoProcess,
              cellStyle: noProcessCellStyle,
            },
            {
              headerName: 'Approval Date',
              field: safeKey('estimatedDate'),
              minWidth: 110,
              editable: notEditableIfNoProcess,
              filter: 'agDateColumnFilter',
              filterParams: dateFilterParams,
              cellRenderer: emptyIfNoProcess,
              cellStyle: noProcessCellStyle,
            },
            {
              headerName: 'Quantity Completed',
              field: safeKey('qtyCompleted'),
              minWidth: 120,
              editable: notEditableIfNoProcess,
              cellRenderer: emptyIfNoProcess,
              cellStyle: noProcessCellStyle,
            },
            { headerName: 'Unit', field: safeKey('units'), minWidth: 70, editable: notEditableIfNoProcess, cellRenderer: emptyIfNoProcess, cellStyle: noProcessCellStyle },
            { headerName: 'Status', field: safeKey('status'), minWidth: 110, editable: notEditableIfNoProcess, cellEditor: 'agSelectCellEditor', cellEditorParams: (p) => { const base = ['Pending', 'Completed', 'No Activity']; const cur = p.value; return { values: cur && !base.includes(cur) ? [cur, ...base] : base }; }, cellRenderer: emptyIfNoProcess, cellStyle: noProcessCellStyle },
            { headerName: 'Remarks', field: safeKey('preFilledRemarks'), minWidth: 140, editable: notEditableIfNoProcess, cellRenderer: emptyIfNoProcess, cellStyle: noProcessCellStyle },
            {
              headerName: 'History',
              field: safeKey('history'),
              minWidth: 70,
              maxWidth: 70,
              editable: false,
              sortable: false,
              filter: false,
              cellRenderer: (params) => {
                if (!params.data?.[existsKey]) return '';
                const tnaChartID = params.data[safeKey('tnaChartID')];
                return (
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{ p: 0 }}
                    onClick={() => navigate('/dashboard/supply-chain/tna-history', {
                      state: { tnaChartID, processName: proc, portfolioName: params.data.customer || '' },
                    })}
                  >
                    <History fontSize="small" />
                  </IconButton>
                );
              },
              cellStyle: (params) => {
                const base = { borderRight: '2px solid #999' };
                if (!params.data?.[existsKey]) {
                  return { ...base, backgroundColor: '#f5f5f5', color: '#bbb' };
                }
                return base;
              },
              headerClass: 'ag-group-last-header',
            },
          ],
        };
      }),
    ];

    // NOTE: setColumnDefs will be called below after filtering active processes only

    // Pivot rows
    const rowMap = new Map();
    allTnaData.forEach((item) => {
      if (!item.poid) return;
      const colorValue = item.colourway || item.Colourway || item.colorway || item.Colorway || item.color || item.Color || '';
      const key = `${item.poid}_${colorValue || ''}`;
      const pcVal = item.pcPerCarton ?? item.PcPerCarton ?? item.PCPerCarton ?? item.pcsPerCarton ?? item.PcsPerCarton ?? '';
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          poid: item.poid,
          poNo: item.poNo,
          customer: item.customer || item.customerName || '',
          pcPerCarton: pcVal,
          color: colorValue,
          status: item.status,
          qtyCompleted: item.qtyCompleted,
          freezeCondPPSample: item.freezeCondPPSample,
        });
      }
      const row = rowMap.get(key);
      if (pcVal !== '' && pcVal != null) row.pcPerCarton = pcVal;
      if (item.process) {
        const proc = item.process;
        const safe = (suffix) => getSafeKey(proc, suffix);
        const formattedIdealDate = formatGridDate(parseApiDateToDate(item.idealDate)) || null;
        const formattedActualDate = formatGridDate(parseApiDateToDate(item.actualDate)) || null;
        const formattedApprovalDatee = formatGridDate(parseApiDateToDate(item.approvalDatee)) || null;
        const formattedEstimatedDate = formatGridDate(parseApiDateToDate(item.estimatedDate)) || null;
        const missingOrInvalidDateFields = [
          ['idealDate', formattedIdealDate],
          ['actualDate', formattedActualDate],
          ['approvalDatee', formattedApprovalDatee],
          ['estimatedDate', formattedEstimatedDate],
        ]
          .filter(([, value]) => !value)
          .map(([field]) => field);

        row[safe('date')] = formatGridDate(parseApiDateToDate(item.date)) || null;
        row[safe('idealDate')] = formattedIdealDate;
        row[safe('actualDate')] = formattedActualDate;
        row[safe('approvalDatee')] = formattedApprovalDatee;
        row[safe('estimatedDate')] = formattedEstimatedDate;
        row[safe('dateSpan')] = item.dateSpan;
        row[safe('units')] = item.units || item.Units || '';
        row[safe('status')] = item.status || '';
        row[safe('preFilledRemarks')] = item.preFilledRemarks || item.PreFilledRemarks || item.prefilledRemarks || '';
        row[safe('qtyCompleted')] = item.qtyCompleted ?? item.QtyCompleted ?? '';
        row[safe('freezeCondPPSample')] = formatGridDate(parseApiDateToDate(item.freezeCondPPSample)) || null;
        row[safe('tnaChartID')] = item.tnaChartID ?? item.tnaChartId ?? 0;
        row[safe('sequence')] = item.sequence ?? 0;
      }
    });

    const rawFinalData = Array.from(rowMap.values()).sort((a, b) => b.poid - a.poid);

    const finalData = rawFinalData.map(row => {
      processList.forEach(proc => {
        const safeProc = getSafeKey(proc);
        row[`_processExists_${safeProc}`] = !!row[`${safeProc}_tnachartid`];
      });
      return row;
    });

    // Apply unified filtering
    const filteredColDefs = getFilteredColumnDefs(newColDefs, finalData, processList);
    fullColDefsRef.current = filteredColDefs;
    setColumnDefs(filteredColDefs);

    setFullData(finalData);
    setModifiedRows(new Map());
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productPortfolios, fetchProcessListByPortfolio, navigate]);

  const handlePortfolioChange = (event) => {
    const newPortfolioId = Number(event.target.value);
    setSelectedPortfolioId(newPortfolioId);
    buildGridForPortfolio(newPortfolioId, portfolioGroupsRef);
  };

  const handlePoChange = (event, newValue) => {
    if (newValue.length === 0) {
      setSelectedPoNumbers([]);
      // Restore first portfolio grid when PO selection is cleared
      const firstPortfolioId = portfolioGroupsRef[0]?.portfolioID ?? null;
      if (firstPortfolioId && firstPortfolioId !== selectedPortfolioId) {
        setSelectedPortfolioId(firstPortfolioId);
        buildGridForPortfolio(firstPortfolioId, portfolioGroupsRef);
      }
      return;
    }

    // Get the portfolio IDs of all selected POs
    const selectedPortfolioData = newValue.map(poNo => {
      const poOption = allPoOptions.find(opt => opt.poNo === poNo);
      return { 
        portfolioID: poOption?.portfolioID,
        portfolioName: poOption?.portfolioName 
      };
    });

    // Check if all selected POs belong to the same portfolio
    const uniquePortfolios = [...new Set(selectedPortfolioData.map(p => p.portfolioID))];
    
    if (uniquePortfolios.length > 1) {
      const portfolioNames = [...new Set(selectedPortfolioData.map(p => p.portfolioName))];
      setSnackbar({
        open: true,
        message: `You can only select POs from one Portfolio at a time! (Attempted: ${portfolioNames.join(', ')})`,
        severity: 'error',
      });
      return;
    }

    const newPortfolioId = uniquePortfolios[0];

    // eslint-disable-next-line no-console
    console.log('[TNA Chart] Selected PO:', newValue, '| portfolioID:', newPortfolioId);
    // eslint-disable-next-line no-console
    console.log('[TNA Chart] Portfolio data:', portfolioGroupsRef.find(g => g.portfolioID === newPortfolioId));

    // If selected PO belongs to a different portfolio, rebuild grid
    if (newPortfolioId !== selectedPortfolioId && portfolioGroupsRef.length > 0) {
      setSelectedPortfolioId(newPortfolioId);
      buildGridForPortfolio(newPortfolioId, portfolioGroupsRef);
      // After grid rebuild, set the PO filter (setTimeout so state settles)
      setTimeout(() => setSelectedPoNumbers(newValue), 0);
    } else {
      setSelectedPoNumbers(newValue);
      setSelectedPortfolioId(newPortfolioId);
    }
  };

  const handleColorChange = (event, newValue) => {
    setSelectedColors(newValue);
  };

  // Handle cell value change
  // onFillOperation — copy source value directly (dates stored as strings, copy as-is)
  const onFillOperation = (params) => {
    const val = params.initialValues[0];
    // If a Date object slips in (edge case), convert to display string
    if (val instanceof Date) return formatGridDate(val) || null;
    return val;
  };

  const onCellValueChanged = (params) => {
    const { data, colDef, newValue, oldValue } = params;
    if (newValue === oldValue) return;

    const rowKey = `${data.poid}_${data.color || ''}`;
    const fieldKey = colDef.field;

    // _select is UI-only state — never send to API
    if (fieldKey?.endsWith('_select')) return;

    // --- Quantity Completed validation (only when unit contains %) ---
    if (fieldKey?.endsWith('_qtycompleted')) {
      const procName = fieldKey.slice(0, -'_qtycompleted'.length);
      const unitVal = String(data[`${procName}_units`] || '').trim();

      if (unitVal.includes('%')) {
        const numericMatch = unitVal.match(/(\d+(\.\d+)?)/);
        const numericPart = numericMatch ? parseFloat(numericMatch[1]) : 0;
        const numNew = parseFloat(newValue);
        const numOld = parseFloat(oldValue) || 0;

        // If unit is "5%" → max = oldValue + 5; if unit is just "%" → max = 100
        const maxAllowed = numericPart > 0 ? numOld + numericPart : 100;

        if (!isNaN(numNew) && numNew > maxAllowed) {
          params.node.setDataValue(fieldKey, oldValue);
          setSnackbar({
            open: true,
            message: `Quantity Completed cannot exceed ${maxAllowed} when unit is "${unitVal}"`,
            severity: 'error',
          });
          return;
        }
      }
    }
    // ---------------------------------------------------------------

    // Build updated row merging new value into current data
    const updatedRowData = { ...data, [fieldKey]: newValue };

    // Directly update AG Grid row node — most reliable for immediate visual refresh
    // (especially when destination cell field was previously absent/undefined)
    gridRef.current?.api?.applyTransaction({ update: [updatedRowData] });

    const updateRow = (row) => {
      const currentRowKey = `${row.poid}_${row.color || ''}`;
      return currentRowKey === rowKey ? { ...row, [fieldKey]: newValue } : row;
    };

    // Keep fullData and tableData in sync for filtering and save operations
    setFullData((prev) => prev.map(updateRow));
    setTableData((prev) => prev.map(updateRow));

    setModifiedRows((prev) => {
      const newMap = new Map(prev);

      if (newMap.has(rowKey)) {
        const existing = newMap.get(rowKey);
        const changed = new Set(existing.__changedFields || []);
        changed.add(fieldKey);

        const updated = {
          ...existing,
          [fieldKey]: newValue,
          __changedFields: Array.from(changed),
        };
        newMap.set(rowKey, updated);
      } else {
        newMap.set(rowKey, {
          ...data,
          [fieldKey]: newValue,
          __changedFields: [fieldKey],
        });
      }
      return newMap;
    });
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (modifiedRows.size === 0) return;

    // Helper to convert grid date (Date or string) back to API string:
    // "yyyy-MM-ddT09:46:42.397Z"
    const toApiDateTime = (value) => {
      if (!value) return value;

      let d = value;
      if (!(value instanceof Date)) {
        d = parseApiDateToDate(value);
      }
      if (!d) return value;

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      return `${yyyy}-${mm}-${dd}T00:00:00`;
    };

    setSaving(true);
    try {
      const updates = [];

      // Har modified grid row ko per‑process TNA objects me convert karo
      modifiedRows.forEach((row) => {
        const processesInRow = new Set();

        const changedFields = new Set(row.__changedFields || []);

        // Find all processes for which any editable field was actually changed
        changedFields.forEach((key) => {
          const lastUnderscore = key.lastIndexOf('_');
          if (lastUnderscore === -1) return;
          const proc = key.slice(0, lastUnderscore);
          const suffix = key.slice(lastUnderscore + 1);

          const editableSuffixes = new Set([
            'status',
            'qtycompleted',
            'actualdate',
            'idealdate',
            'estimateddate',
            'approvaldatee',
            'units',
            'prefilledremarks',
            'tnachartid',
            'date',
          ]);

          if (editableSuffixes.has(suffix)) {
            processesInRow.add(proc);
          }
        });

        processesInRow.forEach((proc) => {
          const originalProcName = processKeyToNameRef.current.get(proc) || proc;
          const tnaChartID = row[`${proc}_tnachartid`] ?? row[`${proc}_tnaChartID`] ?? 0;
          if (!tnaChartID) return;

          const payload = {
            tnaChartID,
            poid: row.poid ?? 0,
            poNo: row.poNo ?? '',
            color: row.color ?? '',
            customerName: row.customer ?? '',
            process: originalProcName,
            sequence: row[`${proc}_sequence`] ?? 0,

            // Status & quantities
            status: row[`${proc}_status`] ?? row.status ?? '',
            qtyCompleted: Number(row[`${proc}_qtycompleted`] ?? row[`${proc}_qtyCompleted`] ?? 0),
            dateSpan: Number(row[`${proc}_datespan`] ?? row[`${proc}_dateSpan`] ?? 0),

            // Text fields
            units: row[`${proc}_units`] ?? '',
            preFilledRemarks: row[`${proc}_prefilledremarks`] ?? row[`${proc}_preFilledRemarks`] ?? '',

            // Dates – always send in API string format
            date: toApiDateTime(row[`${proc}_date`] ?? row.date),
            idealDate: toApiDateTime(row[`${proc}_idealdate`] ?? row[`${proc}_idealDate`]),
            actualDate: toApiDateTime(row[`${proc}_actualdate`] ?? row[`${proc}_actualDate`]),
            approvalDatee: toApiDateTime(row[`${proc}_approvaldatee`] ?? row[`${proc}_approvalDatee`]),
            estimatedDate: toApiDateTime(row[`${proc}_estimateddate`] ?? row[`${proc}_estimatedDate`]),
            freezeCondPPSample: toApiDateTime(
              row[`${proc}_freezecondppsample`] ?? row[`${proc}_freezeCondPPSample`] ?? row.freezeCondPPSample
            ),
          };

          updates.push(payload);
        });
      });

      for (const payload of updates) {
        await apiClient.post('/Milestone/UpdateTNA', payload);
      }

      setModifiedRows(new Map());
      setSnackbar({
        open: true,
        message: 'Successfully changes',
        severity: 'success',
      });
    } catch (error) {
      // Log detailed server error (if available)
      // eslint-disable-next-line no-console
      console.error('Error saving TNA data:', error?.response?.data || error);
      setSnackbar({
        open: true,
        message: 'Error saving TNA data',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Header checkbox: mark all rows of a process as selected in data (no column, no visual highlight)
  const handleSelectAllForProcess = useCallback((procName, selected) => {
    const api = gridRef.current?.api;
    if (!api) return;
    const safeProc = getSafeKey(procName);
    api.forEachNode((node) => {
      const row = node.data;
      if (!row || !row[`_processExists_${safeProc}`]) return;
      // Directly mutate data — no column needed, grid stays visually unchanged
      // eslint-disable-next-line no-param-reassign
      row[`${safeProc}_select`] = selected;
    });
  }, []);

  // Not Applicable button: call API → navigate to TNA View
  const handleNotApplicable = async () => {
    const api = gridRef.current?.api;
    if (!api) return;

    const selectedProcesses = [];

    api.forEachNode((node) => {
      const row = node.data;
      if (!row) return;
      // Scan all _select keys directly — no dependency on columnDefs
      Object.keys(row).forEach((key) => {
        if (key.endsWith('_select') && row[key]) {
          const procKey = key.slice(0, -'_select'.length);
          const proc = processKeyToNameRef.current.get(procKey) || procKey;
          selectedProcesses.push({
            poid: row.poid,
            poNo: row.poNo,
            customer: row.customer,
            color: row.color,
            process: proc,
            tnaChartID: row[`${procKey}_tnachartid`] || 0,
            targetDate: row[`${procKey}_idealdate`] || '',
            factoryCommitmentDate: row[`${procKey}_actualdate`] || '',
            submissionDate: row[`${procKey}_approvaldatee`] || '',
            approvalDate: row[`${procKey}_estimateddate`] || '',
            quantityCompleted: row[`${procKey}_qtycompleted`] || '',
            unit: row[`${procKey}_units`] || '',
            status: row[`${procKey}_status`] || '',
            remarks: row[`${procKey}_prefilledremarks`] || '',
            markedAt: new Date().toISOString(),
          });
          // eslint-disable-next-line no-param-reassign
          row[key] = false;
        }
      });
    });

    if (selectedProcesses.length === 0) {
      setSnackbar({ open: true, message: 'Please select at least one checkbox first.', severity: 'warning' });
      return;
    }

    setSaving(true);
    try {
      // Call API for each selected process: mark selected = 0 (Not Applicable)
      for (const proc of selectedProcesses) {
        if (proc.tnaChartID) {
          // eslint-disable-next-line no-await-in-loop
          await apiClient.post('/Milestone/UpdateProcessStatus', {
            tnaChartID: proc.tnaChartID,
            selected: 0,
          });
        }
      }

      // Immediately hide selected processes from the grid (set _processExists = false)
      const gridApi = gridRef.current?.api;
      if (gridApi) {
        selectedProcesses.forEach(({ poNo, color, process: proc }) => {
          const safeProc = getSafeKey(proc);
          gridApi.forEachNode((node) => {
            if (node.data?.poNo === poNo && node.data?.color === color) {
              // eslint-disable-next-line no-param-reassign
              node.data[`_processExists_${safeProc}`] = false;
            }
          });
        });
        gridApi.refreshCells({ force: true });
      }

      setSnackbar({ open: true, message: "Selected Process update with 'Not Applicable' Successfully.", severity: 'success' });
      setTimeout(() => {
        sessionStorage.setItem('tna_back_from_view', '1');
        navigate('/dashboard/supply-chain/tna-view', { state: { customerID: selectedCustomer } });
      }, 1200);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('UpdateProcessStatus error:', error?.response?.data || error);
      setSnackbar({ open: true, message: 'Error updating process status. Please try again.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleShowNotApplicable = () => {
    sessionStorage.setItem('tna_back_from_view', '1');
    navigate('/dashboard/supply-chain/tna-view', { state: { customerID: selectedCustomer } });
  };

  const fetchAssignTeamOptions = useCallback(async () => {
    if (assignOptionsFetchedRef.current) {
      return { ...assignTeamListsRef.current };
    }

    setAssignOptionsLoading(true);

    try {
      const [merchRes, qaRes, printQaRes, productionRes, shippingRes] = await Promise.all([
        apiClient.get('/Milestone/GetMerchandiserAssistant'),
        apiClient.get('/Milestone/GetQA'),
        apiClient.get('/Milestone/GetPrintQA'),
        apiClient.get('/Milestone/GetProductionPerson'),
        apiClient.get('/Milestone/GetShipPerson'),
      ]);

      const normalizeList = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) {
          return data
            .map((x) => {
              if (!x) return null;
              if (typeof x === 'string') return { userId: '', userName: x };
              return {
                userId:
                  x.userId ??
                  x.userID ??
                  x.id ??
                  x.employeeId ??
                  x.employeeID ??
                  x.empId ??
                  x.empID ??
                  x.qaid ??
                  x.printQAID ??
                  x.prodPersonID ??
                  x.shipPersonID ??
                  x.marchandID ??
                  '',
                userName: x.userName ?? x.name ?? x.employeeName ?? x.fullName ?? '',
              };
            })
            .filter((x) => x && x.userName);
        }
        if (typeof data === 'object' && (data.userName || data.name)) {
          return [{
            userId:
              data.userId ??
              data.userID ??
              data.id ??
              data.employeeId ??
              data.employeeID ??
              data.empId ??
              data.empID ??
              data.qaid ??
              data.printQAID ??
              data.prodPersonID ??
              data.shipPersonID ??
              data.marchandID ??
              '',
            userName: data.userName ?? data.name ?? data.employeeName ?? data.fullName ?? '',
          }];
        }
        return [];
      };

      const merch = normalizeList(merchRes.data);
      const qa = normalizeList(qaRes.data);
      const printQa = normalizeList(printQaRes.data);
      const production = normalizeList(productionRes.data);
      const shipping = normalizeList(shippingRes.data);

      assignTeamListsRef.current = { merch, qa, printQa, production, shipping };
      assignOptionsFetchedRef.current = true;

      setMerchAssistantOptions(merch);
      setQaList(qa);
      setPrintQaList(printQa);
      setProductionList(production);
      setShippingList(shipping);

      return { ...assignTeamListsRef.current };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TNA Chart] fetchAssignTeamOptions error:', error?.response?.data || error);
      setSnackbar({
        open: true,
        message: 'Error loading team dropdown data',
        severity: 'error',
      });
    } finally {
      setAssignOptionsLoading(false);
    }
    return null;
  }, []);

  const applySetDataResponseToForm = useCallback((respData, optionLists) => {
    // eslint-disable-next-line no-console
    console.log('[TNA Chart] applySetDataResponseToForm raw respData:', respData);
    const merchList = optionLists?.merch || merchAssistantOptions;
    const qaOptionsList = optionLists?.qa || qaList;
    const printQaOptionsList = optionLists?.printQa || printQaList;
    const productionOptionsList = optionLists?.production || productionList;
    const shippingOptionsList = optionLists?.shipping || shippingList;

    const qaid = Number(respData?.qaid);
    const printQAID = Number(respData?.printQAID);
    const prodPersonID = Number(respData?.prodPersonID);
    const shipPersonID = Number(respData?.shipPersonID);
    const marchandID = Number(respData?.marchandID);

    // eslint-disable-next-line no-console
    console.log('[TNA Chart] Mapped IDs from SetData:', {
      qaid,
      printQAID,
      prodPersonID,
      shipPersonID,
      marchandID,
    });

    const findNameById = (list, id) => {
      if (!Number.isFinite(id) || id <= 0) return '';
      const hit = (list || []).find((x) => extractNumericId(x) === id);
      return hit?.userName || hit?.name || '';
    };

    const qaName = findNameById(qaOptionsList, qaid);
    const printQaName = findNameById(printQaOptionsList, printQAID) || 'N/A';
    const prodName = findNameById(productionOptionsList, prodPersonID) || '';
    const shipName = findNameById(shippingOptionsList, shipPersonID) || 'MEHWISH RIAZ';
    const merchName = findNameById(merchList, marchandID);

    // eslint-disable-next-line no-console
    console.log('[TNA Chart] Names resolved from SetData IDs:', {
      qaName,
      printQaName,
      prodName,
      shipName,
      merchName,
    });

    const resolvedProdId =
      Number.isFinite(prodPersonID) && prodPersonID > 0 ? prodPersonID : null;

    setAssignForm((prev) => ({
      ...prev,
      merchandiserAssistant: merchName ? [merchName] : [],
      qa: qaName ? [qaName] : [],
      printQa: printQaName,
      productionFollowup: prodName,
      prodPersonID: resolvedProdId,
      shippingPerson: shipName,
      productionStatus: 'N/A',
    }));
  }, [merchAssistantOptions, qaList, printQaList, productionList, shippingList]);

  const handleOpenAsignTeam = async () => {
    const poIDs = getVisiblePoIds();
    if (poIDs.length === 0) {
      setSnackbar({ open: true, message: 'No PO found in current grid data.', severity: 'warning' });
      return;
    }

    setAssignPoIds(poIDs);
    setAssignForm({
      merchandiserAssistant: [],
      qa: [],
      printQa: 'N/A',
      productionFollowup: '',
      prodPersonID: null,
      shippingPerson: 'MEHWISH RIAZ',
      productionStatus: 'N/A',
    });
    setAssignTeamModalOpen(true);
    await fetchAssignTeamOptions();
  };

  const handleOpenAssignTeamForPo = async (poid) => {
    const poidNum = Number(poid);
    if (!Number.isFinite(poidNum) || poidNum <= 0) return;

    const requestId = Date.now();
    setDataRequestIdRef.current = requestId;
    setSetDataLoading(true);

    setAssignPoIds([poidNum]);
    setAssignForm({
      merchandiserAssistant: [],
      qa: [],
      printQa: 'N/A',
      productionFollowup: '',
      prodPersonID: null,
      shippingPerson: 'MEHWISH RIAZ',
      productionStatus: 'N/A',
    });
    setAssignTeamModalOpen(true);

    try {
      // eslint-disable-next-line no-console
      console.log(`[TNA Chart] Calling SetData for POID ${poidNum}...`);
      const [optionLists, resp] = await Promise.all([
        fetchAssignTeamOptions(),
        apiClient.get(`/Milestone/SetData/${poidNum}`),
      ]);

      // Ignore stale response if user clicked another PO dot quickly
      if (setDataRequestIdRef.current !== requestId) return;

      // eslint-disable-next-line no-console
      console.log(`[TNA Chart] SetData GET response for POID ${poidNum}:`, resp.data);
      applySetDataResponseToForm(resp.data || {}, optionLists);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TNA Chart] SetData fetch error:', error?.response?.data || error);
      setSnackbar({
        open: true,
        message: 'Could not load existing team data for this PO.',
        severity: 'warning',
      });
    } finally {
      if (setDataRequestIdRef.current === requestId) {
        setSetDataLoading(false);
      }
    }
  };

  const handleConfirmAsignTeam = async () => {
    const poIDs = assignPoIds.length > 0 ? assignPoIds : getVisiblePoIds();
    if (poIDs.length === 0) {
      setSnackbar({ open: true, message: 'No PO selected for update.', severity: 'warning' });
      return;
    }

    const payload = {
      poIDs,
      qaid: getUserIdByName(qaList, assignForm.qa?.[0]) || 0,
      printQAID: getUserIdByName(printQaList, assignForm.printQa) || 0,
      prodPersonID:
        (assignForm.prodPersonID != null && Number(assignForm.prodPersonID) > 0
          ? Number(assignForm.prodPersonID)
          : getUserIdByName(productionList, assignForm.productionFollowup)) || 0,
      shipPersonID: getUserIdByName(shippingList, assignForm.shippingPerson) || 0,
      marchandID: getUserIdByName(merchAssistantOptions, assignForm.merchandiserAssistant?.[0]) || 0,
    };

    setAssigning(true);
    try {
      // eslint-disable-next-line no-console
      console.log('[TNA Chart] Assign form values:', assignForm);
      // eslint-disable-next-line no-console
      console.log('[TNA Chart] SetDataUpdate payload:', payload);
      await apiClient.post('/Milestone/SetDataUpdate', payload);

      setAssignTeamModalOpen(false);
      setAssignPoIds([]);
      setSnackbar({
        open: true,
        message: `Team assigned successfully (${poIDs.length} PO${poIDs.length > 1 ? 's' : ''})`,
        severity: 'success',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TNA Chart] SetDataUpdate error:', error?.response?.data || error);
      setSnackbar({
        open: true,
        message: 'Error assigning team. Please try again.',
        severity: 'error',
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="TNA Chart"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Purchase Orders', href: paths.dashboard.supplyChain.root },
          { name: 'TNA Chart' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Customer"
                value={selectedCustomer}
                onChange={handleCustomerChange}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: { maxHeight: 300 },
                    },
                  },
                }}
              >
                <MenuItem value="">
                  Select Customer
                </MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.customerID} value={customer.customerID}>
                    {customer.customerName}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ flex: '1 1 30%', minWidth: 200 }}>
              <Autocomplete
                multiple
                id="po-number-autocomplete"
                options={allPoOptions.map(opt => opt.poNo)}
                groupBy={(option) => {
                  const poOption = allPoOptions.find(opt => opt.poNo === option);
                  return poOption?.portfolioName || 'Unknown Portfolio';
                }}
                disableCloseOnSelect
                value={selectedPoNumbers}
                onChange={handlePoChange}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`PO No ${selectedPoNumbers.length > 0 ? `(${selectedPoNumbers.length})` : ''}`}
                    placeholder={selectedPoNumbers.length === 0 ? 'Search or select PO...' : ''}
                    size="small"
                    helperText={
                      selectedPortfolioId 
                        ? `${allPoOptions.find(opt => opt.portfolioID === selectedPortfolioId)?.portfolioName || 'Other'} selected`
                        : ''
                    }
                  />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props} key={option}>
                    <Checkbox
                      checked={selected}
                      style={{ marginRight: 8 }}
                    />
                    {option}
                  </li>
                )}
                renderTags={(value) => {
                  if (value.length === 0) return null;
                  if (value.length === 1) {
                    return (
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          color: 'text.primary',
                        }}
                      >
                        {value[0]}
                      </Typography>
                    );
                  }
                  return (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        color: 'text.primary',
                        fontWeight: 500,
                      }}
                    >
                      {value.length} selected
                    </Typography>
                  );
                }}
                ListboxProps={{
                  style: { maxHeight: 300 },
                }}
              />
            </Box>

            <Box sx={{ flex: '1 1 22%', minWidth: 200 }}>
              <Autocomplete
                multiple
                id="color-autocomplete"
                options={['__SELECT_ALL__', ...allColors]}
                disableCloseOnSelect
                value={selectedColors}
                onChange={(event, newValue) => {
                  // Filter out the __SELECT_ALL__ option from the value
                  const filteredValue = newValue.filter((v) => v !== '__SELECT_ALL__');
                  handleColorChange(event, filteredValue);
                }}
                getOptionLabel={(option) => {
                  if (option === '__SELECT_ALL__') return 'Select All';
                  return option;
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Color ${selectedColors.length > 0 ? `(${selectedColors.length})` : ''}`}
                    placeholder={
                      selectedColors.length === 0
                        ? 'Search or select colors...'
                        : ''
                    }
                    size="small"
                  />
                )}
                renderOption={(props, option, { selected }) => {
                  // Check if this is the "Select All" option
                  if (option === '__SELECT_ALL__') {
                    const allSelected =
                      allColors.length > 0 &&
                      allColors.every((color) => selectedColors.includes(color));
                    const someSelected = allColors.some((color) =>
                      selectedColors.includes(color)
                    );

                    return (
                      <li
                        {...props}
                        key="select-all-color"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (allSelected) {
                            setSelectedColors([]);
                          } else {
                            setSelectedColors([...allColors]);
                          }
                        }}
                        style={{
                          ...props.style,
                          backgroundColor: '#f5f5f5',
                          borderBottom: '1px solid #e0e0e0',
                          fontWeight: 500,
                        }}
                      >
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected && !allSelected}
                          style={{ marginRight: 8 }}
                        />
                        Select All
                      </li>
                    );
                  }

                  return (
                    <li {...props} key={option}>
                      <Checkbox
                        checked={selected}
                        style={{ marginRight: 8 }}
                      />
                      {option}
                    </li>
                  );
                }}
                renderTags={(value) => {
                  if (value.length === 0) return null;
                  if (value.length === 1) {
                    return (
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          color: 'text.primary',
                        }}
                      >
                        {value[0]}
                      </Typography>
                    );
                  }
                  return (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        color: 'text.primary',
                        fontWeight: 500,
                      }}
                    >
                      {value.length} selected
                    </Typography>
                  );
                }}
                ListboxProps={{
                  style: { maxHeight: 300 },
                }}
              />
            </Box>
          </Box>

        </Box>
      </Card>

      {/* Grid card */}
      <Card sx={{ p: 2 }}>
        <Box
          style={containerStyle}
          sx={{
            position: 'relative',
            '& .ag-header, & .ag-header-viewport, & .ag-header-row': {
              backgroundColor: '#eeeeee',
              color: '#000000',
            },
            '& .ag-header-cell, & .ag-header-group-cell': {
              backgroundColor: 'transparent',
              color: 'inherit',
              paddingLeft: '2px !important',
              paddingRight: '2px !important',
            },
            '& .ag-header-cell-label, & .ag-header-group-cell-label': {
              justifyContent: 'center',
            },
            '& .ag-header-group-cell': {
              borderBottom: `1px solid ${theme.palette.divider} !important`,
            },
            '& .ag-group-last-header': {
              borderRight: '2px solid #999 !important',
            },
            '& .ag-cell': {
              paddingLeft: '2px !important',
              paddingRight: '2px !important',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
            },
            '& .ag-header-cell-text': {
              fontSize: '10.5px',
              textAlign: 'center',
              lineHeight: '1.1',
              whiteSpace: 'normal',
            },
            '& .ag-root-wrapper, & .ag-root, & .ag-body-viewport, & .ag-header, & .ag-header-viewport, & .ag-center-cols-viewport':
            {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
            '& .ag-row, & .ag-cell': {
              backgroundColor: 'inherit',
              color: 'inherit',
            },
            '& .ag-paging-panel': {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              borderTop: `1px solid ${theme.palette.divider}`,
            },
            '& .ag-paging-panel .ag-input-field-input, & .ag-paging-panel .ag-picker-field-wrapper': {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
            },
          }}
        >
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(0,0,0,0.4)'
                    : 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <Box
                sx={{
                  px: 3.5,
                  py: 2.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: theme.shadows[6],
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <CircularProgress size={28} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Loading TNA data...
                </Typography>
              </Box>
            </Box>
          )}
          <div style={{ width: '100%', height: '100%' }}>
            <AgGridReact
              ref={gridRef}
              onGridReady={onGridReady}
              rowData={tableData}
              columnDefs={columnDefs}
              suppressFieldDotNotation
              getRowId={(params) => `${params.data.poid}_${params.data.color || ''}`}
              headerHeight={32}
              groupHeaderHeight={32}
              rowHeight={32}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                wrapHeaderText: true,
                autoHeaderHeight: true,
                // Bypass AG Grid's internal field resolver — use direct bracket notation
                // so field names with spaces, dots, slashes etc. always resolve correctly
                valueGetter: (params) => {
                  const f = params.colDef.field;
                  if (!f || !params.data) return undefined;
                  const res = params.data[f];
                  
                  // Targeted Debug for identified problematic processes
                  const debugProcesses = ['Specs Approval', 'Testing Samples to LAB', 'Bulk Accessories Submission', 'Washing', 'Factories Internal Audit Date'];
                  if (debugProcesses.some(proc => f.startsWith(proc))) {
                     // eslint-disable-next-line no-console
                     console.log(`[GRID RENDER ATTEMPT] PO=${params.data.poNo} | Field="${f}" | ValueFound="${res}"`);
                  }
                  
                  return res;
                },
                editable: (params) => {
                  const field = params.colDef.field || '';
                  const editableSuffixes = [
                    '_prefilledremarks',
                    '_units',
                    '_status',
                    '_qtycompleted',
                    '_idealdate',
                    '_actualdate',
                    '_approvaldatee',
                    '_estimateddate',
                  ];
                  return editableSuffixes.some((suffix) => field.endsWith(suffix));
                },
              }}
              enableRangeSelection
              enableFillHandle
              fillHandleDirection="y"
              undoRedoCellEditing
              undoRedoCellEditingLimit={20}
              rowSelection="multiple"
              suppressRowClickSelection
              stopEditingWhenCellsLoseFocus
              rowDragManaged={false}
              animateRows
              pagination
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 30]}
              suppressNoRowsOverlay={loading}
              noRowsOverlayComponent={() => (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  No data available
                </div>
              )}
              onCellValueChanged={onCellValueChanged}
              onFillOperation={onFillOperation}
              onColumnHeaderClicked={(e) => {
                if (e.column?.getColId()?.endsWith('_idealdate')) {
                  e.api.ensureColumnVisible(e.column.getColId(), 'start');
                }
              }}
              onCellClicked={(params) => {
                if (dragScrollRef.current.wasDragged) return;
                const field = params.colDef?.field || '';
                if (!field.endsWith('_idealdate')) return;
                setTimeout(() => {
                  params.api.ensureColumnVisible(params.column, 'start');
                }, 0);
              }}
            />
          </div>
        </Box>
      </Card>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" color="primary" sx={{ minWidth: 160 }} onClick={handleOpenAsignTeam}>
          Assign Team
        </Button>
        <Button variant="contained" color="primary" sx={{ minWidth: 160 }} onClick={handleNotApplicable}>
          Not Applicable
        </Button>
        {modifiedRows.size > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveChanges}
            disabled={saving}
            sx={{ minWidth: 150 }}
          >
            {saving ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                Saving...
              </>
            ) : (
              `Save Changes (${modifiedProcessCount})`
            )}
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          sx={{ minWidth: 220 }}
          onClick={handleShowNotApplicable}
        >
          Show Not Applicable Process
        </Button>
      </Box>

      <Dialog
        open={assignTeamModalOpen}
        onClose={() => {
          if (assigning) return;
          setAssignTeamModalOpen(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Assign Team</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={merchAssistantOptionsWithNA}
              value={assignForm.merchandiserAssistant}
              loading={assignOptionsLoading}
              onChange={(event, newValue) => {
                // If user selects N/A, keep only N/A; otherwise remove N/A.
                let next = Array.isArray(newValue) ? newValue : [];
                next = next.filter(Boolean);
                if (next.includes('N/A')) next = ['N/A'];
                else next = next.filter((v) => v !== 'N/A');
                setAssignForm((prev) => ({ ...prev, merchandiserAssistant: next }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Merchandiser Assistant"
                  placeholder="Please select"
                  size="small"
                />
              )}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox
                    checked={selected}
                    style={{ marginRight: 8 }}
                  />
                  {option}
                </li>
              )}
              renderTags={(value) => {
                if (value.length === 0) return null;
                if (value.length === 1) {
                  return (
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {value[0]}
                    </Typography>
                  );
                }
                return (
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {value.length} selected
                  </Typography>
                );
              }}
            />

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={qaOptions}
              value={assignForm.qa}
              loading={assignOptionsLoading}
              onChange={(event, newValue) => {
                // Keep `N/A` exclusive (if selected, remove others)
                let next = Array.isArray(newValue) ? newValue.filter(Boolean) : [];
                if (next.includes('N/A')) next = ['N/A'];
                else next = next.filter((v) => v !== 'N/A');
                setAssignForm((prev) => ({ ...prev, qa: next }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="QA"
                  placeholder="Please select"
                  size="small"
                />
              )}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox
                    checked={selected}
                    style={{ marginRight: 8 }}
                  />
                  {option}
                </li>
              )}
              renderTags={(value) => {
                if (value.length === 0) return null;
                if (value.length === 1) {
                  return (
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {value[0]}
                    </Typography>
                  );
                }
                return (
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {value.length} selected
                  </Typography>
                );
              }}
            />

            <TextField
              select
              fullWidth
              label="Print QA"
              size="small"
              value={assignForm.printQa || 'N/A'}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, printQa: e.target.value }))}
            >
              {printQaOptionsWithNA.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>

            <Autocomplete
              options={productionList}
              getOptionLabel={(option) => option?.userName || ''}
              value={
                productionList.find(
                  (x) => extractNumericId(x) === Number(assignForm.prodPersonID)
                ) ||
                productionList.find(
                  (x) => normalizeText(x?.userName) === normalizeText(assignForm.productionFollowup)
                ) ||
                null
              }
              loading={assignOptionsLoading}
              onChange={(event, newValue) => {
                setAssignForm((prev) => ({
                  ...prev,
                  productionFollowup: newValue?.userName || '',
                  prodPersonID: extractNumericId(newValue),
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Production Followup" size="small" />
              )}
              isOptionEqualToValue={(a, b) => extractNumericId(a) === extractNumericId(b)}
              clearOnEscape
            />

            <Autocomplete
              options={shippingList.map((x) => x.userName)}
              value={assignForm.shippingPerson || null}
              loading={assignOptionsLoading}
              onChange={(event, newValue) => {
                setAssignForm((prev) => ({ ...prev, shippingPerson: newValue || '' }));
              }}
              renderInput={(params) => <TextField {...params} label="Shipping Person" size="small" />}
              isOptionEqualToValue={(option, value) => option === value}
              clearOnEscape
            />

            <TextField
              fullWidth
              label="Production Status"
              value={assignForm.productionStatus}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, productionStatus: e.target.value }))}
              size="small"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              if (assigning) return;
              setAssignTeamModalOpen(false);
            }}
            disabled={assigning}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmAsignTeam}
            disabled={assigning || assignOptionsLoading || setDataLoading}
          >
            {assigning || setDataLoading ? (
              <CircularProgress size={20} sx={{ color: 'inherit' }} />
            ) : (
              'Assign'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

