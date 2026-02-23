import { useEffect, useMemo, useState } from 'react';

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
} from '@mui/material';
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

// ----------------------------------------------------------------------

export default function TNAChartPage() {
  const theme = useTheme();

  const [tableData, setTableData] = useState([]);
  const [fullData, setFullData] = useState([]); // Store complete unfiltered data
  const [customers, setCustomers] = useState([]); // All customers from API
  const [selectedCustomer, setSelectedCustomer] = useState(''); // Selected customer ID
  const [productPortfolios, setProductPortfolios] = useState([]); // Portfolio names
  const [loading, setLoading] = useState(false);
  const [allPoOptions, setAllPoOptions] = useState([]); // PO options with portfolio grouping
  const [selectedPoNumbers, setSelectedPoNumbers] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null); // Track selected portfolio
  const [allColors, setAllColors] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [modifiedRows, setModifiedRows] = useState(new Map());
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

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
        'qtyCompleted',
        'actualDate',
        'idealDate',
        'estimatedDate',
        'approvalDatee',
        'units',
        'preFilledRemarks',
        'tnaChartID',
        'dateSpan',
        'date',
        'freezeCondPPSample',
      ]);

      changedFields.forEach((key) => {
        const underscoreIndex = key.indexOf('_');
        if (underscoreIndex === -1) return;
        const proc = key.slice(0, underscoreIndex);
        const suffix = key.slice(underscoreIndex + 1);

        if (editableSuffixes.has(suffix)) {
          processesInRow.add(proc);
        }
      });

      count += processesInRow.size;
    });

    return count;
  }, [modifiedRows]);

  const [columnDefs, setColumnDefs] = useState([]);

  // Parse date coming from API (string) into JS Date for grid/editor
  const parseApiDateToDate = (value) => {
    if (!value) return null;

    // Already a Date instance
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
      // dd/MM/yyyy (e.g. 31/12/1999)
      const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      let match = value.match(ddmmyyyy);
      if (match) {
        const [, dd, mm, yyyy] = match;
        const d = Number(dd);
        const m = Number(mm);
        const y = Number(yyyy);
        if (
          !Number.isNaN(d) &&
          !Number.isNaN(m) &&
          !Number.isNaN(y) &&
          d >= 1 &&
          d <= 31 &&
          m >= 1 &&
          m <= 12
        ) {
          return new Date(y, m - 1, d);
        }
      }

      // ISO-like string handled by Date constructor
      if (value.includes('T') || value.includes('-')) {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) return d;
      }

      // Fallback: let JS try to parse, e.g. "Nov 10, 2025"
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
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
  }, [fullData, selectedColors, selectedPoNumbers]);

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

    setLoading(true);
    try {
      // Fetch TNA data grouped by portfolio
      const response = await apiClient.get(`/Milestone/GetTNAandPO?CustomerID=${idToUse}`);
      const portfolioGroups = response.data || [];
      // eslint-disable-next-line no-console
      console.log('[TNA] API Response (portfolioGroups):', portfolioGroups);
      const firstGroup = portfolioGroups[0];
      const firstItem = firstGroup?.tnaData?.[0];
      // eslint-disable-next-line no-console
      console.log('[TNA] First group keys:', firstGroup ? Object.keys(firstGroup) : []);
      // eslint-disable-next-line no-console
      console.log('[TNA] First tnaData item keys & pcPerCarton:', firstItem ? { keys: Object.keys(firstItem), pcPerCarton: firstItem.pcPerCarton, PcPerCarton: firstItem.PcPerCarton } : null);

      // Flatten all tnaData from all portfolios
      let allTnaData = [];
      portfolioGroups.forEach(group => {
        if (group.tnaData && Array.isArray(group.tnaData)) {
          // Add portfolioID to each item
          const dataWithPortfolio = group.tnaData.map(item => ({
            ...item,
            portfolioID: group.portfolioID,
            pcPerCarton: item.pcPerCarton ?? group.pcPerCarton,
          }));
          allTnaData = [...allTnaData, ...dataWithPortfolio];
        }
      });

      // Extract all unique processes
      const allProcesses = new Set();
      allTnaData.forEach(item => {
        if (item.process) {
          allProcesses.add(item.process);
        }
      });
      const processList = Array.from(allProcesses);

      // Build PO options with portfolio grouping
      const poOptionsWithPortfolio = [];
      portfolioGroups.forEach(group => {
        if (group.tnaData && Array.isArray(group.tnaData)) {
          const uniquePos = [...new Set(group.tnaData.map(item => item.poNo))].filter(Boolean);
          
          // Find portfolio name from productPortfolios
          const portfolio = productPortfolios.find(p => p.productPortfolioID === group.portfolioID);
          const portfolioName = portfolio ? portfolio.productPortfolio : `Portfolio ${group.portfolioID}`;
          
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

      const poData = allTnaData;
      // eslint-disable-next-line no-console
      console.log('[TNA] poData (first 3 items pcPerCarton):', poData.slice(0, 3).map((i) => ({ poid: i.poid, color: i.color, pcPerCarton: i.pcPerCarton })));

      // 1. Construct Columns (group headers) - fixed sub‑columns per process
      const newColDefs = [
        { headerName: 'PO No', field: 'poNo', pinned: 'left', maxWidth: 100 },
        { headerName: 'Customer', field: 'customer', pinned: 'left', maxWidth: 100 },
        {
          headerName: 'PCS',
          field: 'pcPerCarton',
          pinned: 'left',
          maxWidth: 100,
          editable: true,
          valueFormatter: (params) => {
            const v = params.value;
            if (v === null || v === undefined || v === '') return '';
            return String(v);
          },
        },
        { headerName: 'Color', field: 'color', pinned: 'left', maxWidth: 100 },
        ...processList.map((proc) => ({
          headerName: proc,
          children: [
            {
              headerName: 'Ideal Date',
              field: `${proc}_idealDate`,
              minWidth: 110,
              editable: true,
              cellEditor: 'agDateCellEditor',
              valueFormatter: (params) => formatGridDate(params.value),
            },
            {
              headerName: 'Actual Date',
              field: `${proc}_actualDate`,
              minWidth: 110,
              editable: true,
              cellEditor: 'agDateCellEditor',
              valueFormatter: (params) => formatGridDate(params.value),
            },
            {
              headerName: 'Approval Date',
              field: `${proc}_approvalDatee`,
              minWidth: 110,
              editable: true,
              cellEditor: 'agDateCellEditor',
              valueFormatter: (params) => formatGridDate(params.value),
            },
            {
              headerName: 'Est. Date',
              field: `${proc}_estimatedDate`,
              minWidth: 110,
              editable: true,
              cellEditor: 'agDateCellEditor',
              valueFormatter: (params) => formatGridDate(params.value),
            },
            {
              headerName: 'Date Span',
              field: `${proc}_dateSpan`,
              minWidth: 60,
              editable: true,
            },
            {
              headerName: 'Freeze Cond PP Sample',
              field: `${proc}_freezeCondPPSample`,
              minWidth: 150,
              editable: true,
              cellEditor: 'agDateCellEditor',
              valueFormatter: (params) => formatGridDate(params.value),
            },
            { headerName: 'Units', field: `${proc}_units`, minWidth: 70, editable: true },
            { headerName: 'Status', field: `${proc}_status`, minWidth: 80, editable: true },
            {
              headerName: 'Remarks',
              field: `${proc}_preFilledRemarks`,
              minWidth: 140,
              editable: true,
            },
            {
              headerName: 'Qty Completed',
              field: `${proc}_qtyCompleted`,
              minWidth: 100,
              editable: true,
            },
          ],
        })),
      ];

      // Check if any data has these fields before adding columns
      const hasStatus = poData.some(item => item.status);
      const hasQtyCompleted = poData.some(item => item.qtyCompleted);
      const hasFreezeCondPPSample = poData.some(item => item.freezeCondPPSample);

      if (hasStatus) {
        newColDefs.push({ headerName: 'Status', field: 'status', minWidth: 85 });
      }
      if (hasQtyCompleted) {
        newColDefs.push({ headerName: 'Qty Completed', field: 'qtyCompleted', minWidth: 90 });
      }
      if (hasFreezeCondPPSample) {
        newColDefs.push({ headerName: 'Freeze Cond PP Sample', field: 'freezeCondPPSample', minWidth: 120 });
      }

      setColumnDefs(newColDefs);

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
          // Per‑process fields mapped to fixed sub‑columns
          // NOTE: `_date` is kept for API payload only (no visible column)
          row[`${proc}_date`] = parseApiDateToDate(item.date);
          row[`${proc}_idealDate`] = parseApiDateToDate(item.idealDate);
          row[`${proc}_actualDate`] = parseApiDateToDate(item.actualDate);
          row[`${proc}_approvalDatee`] = parseApiDateToDate(item.approvalDatee);
          row[`${proc}_estimatedDate`] = parseApiDateToDate(item.estimatedDate);
          row[`${proc}_dateSpan`] = item.dateSpan;

          row[`${proc}_units`] = item.units || item.Units || '';
          row[`${proc}_status`] = item.status || '';
          row[`${proc}_preFilledRemarks`] =
            item.preFilledRemarks ||
            item.PreFilledRemarks ||
            item.prefilledRemarks ||
            '';
          row[`${proc}_qtyCompleted`] =
            item.qtyCompleted || item.QtyCompleted || '';
          row[`${proc}_freezeCondPPSample`] = parseApiDateToDate(
            item.freezeCondPPSample
          );
          // IDs / sequence per process for UpdateTNA
          row[`${proc}_tnaChartID`] = item.tnaChartID ?? item.tnaChartId ?? 0;
          row[`${proc}_sequence`] = item.sequence ?? 0;
        }
      });

      const finalData = Array.from(rowMap.values()).sort((a, b) => b.poid - a.poid);
      // eslint-disable-next-line no-console
      console.log('[TNA] finalData rows (poNo, color, pcPerCarton):', finalData.map((r) => ({ poNo: r.poNo, color: r.color, pcPerCarton: r.pcPerCarton })));

      // Store full data (filters & dropdown options are handled in useEffect)
      setFullData(finalData);
    } catch (error) {
      console.error('Error fetching TNA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (event) => {
    const value = event.target.value;
    setSelectedCustomer(value);
    setSelectedPoNumbers([]); // Reset PO selection when customer changes
    setSelectedColors([]); // Reset color selection when customer changes
    setSelectedPortfolioId(null); // Reset portfolio tracking
    handleSearch(value);
  };

  const handlePoChange = (event, newValue) => {
    if (newValue.length === 0) {
      // Clear all selections
      setSelectedPoNumbers([]);
      setSelectedPortfolioId(null);
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
      // Show error - can't select POs from different portfolios
      const portfolioNames = [...new Set(selectedPortfolioData.map(p => p.portfolioName))];
      setSnackbar({
        open: true,
        message: `You can only select POs from one Portfolio at a time! (Attempted: ${portfolioNames.join(', ')})`,
        severity: 'error',
      });
      return;
    }

    // Update selections
    setSelectedPoNumbers(newValue);
    setSelectedPortfolioId(uniquePortfolios[0]);
  };

  const handleColorChange = (event, newValue) => {
    setSelectedColors(newValue);
  };

  // Handle cell value change
  const onCellValueChanged = (params) => {
    const { data, colDef, newValue, oldValue } = params;
    if (newValue === oldValue) return;

    const rowKey = `${data.poid}_${data.color || ''}`;
    const fieldKey = colDef.field;

    // Update fullData to keep state in sync
    setFullData((prev) =>
      prev.map((row) => {
        const currentRowKey = `${row.poid}_${row.color || ''}`;
        if (currentRowKey === rowKey) {
          return { ...row, [fieldKey]: newValue };
        }
        return row;
      })
    );

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

      return `${yyyy}-${mm}-${dd}T09:46:42.397Z`;
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
          const underscoreIndex = key.indexOf('_');
          if (underscoreIndex === -1) return;
          const proc = key.slice(0, underscoreIndex);
          const suffix = key.slice(underscoreIndex + 1);

          const editableSuffixes = new Set([
            'status',
            'qtyCompleted',
            'actualDate',
            'idealDate',
            'estimatedDate',
            'approvalDatee',
            'units',
            'preFilledRemarks',
            'tnaChartID',
          ]);

          if (editableSuffixes.has(suffix)) {
            processesInRow.add(proc);
          }
        });

        processesInRow.forEach((proc) => {
          const tnaChartID = row[`${proc}_tnaChartID`] ?? 0;
          if (!tnaChartID) return; // without ID we can't update

          const payload = {
            // Identity / linkage fields expected by backend
            tnaChartID,
            poid: row.poid ?? 0,
            poNo: row.poNo ?? '',
            color: row.color ?? '',
            customerName: row.customer ?? '',
            process: proc,
            sequence: row[`${proc}_sequence`] ?? 0,

            // Status & quantities
            status: row[`${proc}_status`] ?? row.status ?? '',
            qtyCompleted: Number(row[`${proc}_qtyCompleted`] ?? 0),
            dateSpan: Number(row[`${proc}_dateSpan`] ?? 0),

            // Text fields
            units: row[`${proc}_units`] ?? '',
            preFilledRemarks: row[`${proc}_preFilledRemarks`] ?? '',

            // Dates – always send in API string format
            date: toApiDateTime(row[`${proc}_date`] ?? row.date),
            idealDate: toApiDateTime(row[`${proc}_idealDate`]),
            actualDate: toApiDateTime(row[`${proc}_actualDate`]),
            approvalDatee: toApiDateTime(row[`${proc}_approvalDatee`]),
            estimatedDate: toApiDateTime(row[`${proc}_estimatedDate`]),
            freezeCondPPSample: toApiDateTime(
              row[`${proc}_freezeCondPPSample`] ?? row.freezeCondPPSample
            ),
          };

          updates.push(payload);
        });
      });

      // eslint-disable-next-line no-console
      console.log('Saving TNA rows JSON:', JSON.stringify(updates, null, 2));

      // API ab single object model expect kar raha hai; ek ek karke bhej dete hain
      for (const payload of updates) {
        // eslint-disable-next-line no-console
        console.log('TNA Update payload JSON:', JSON.stringify(payload, null, 2));
        await apiClient.post('/Milestone/UpdateTNA', payload);
      }

      // Clear modified rows after successful save
      setModifiedRows(new Map());
      // eslint-disable-next-line no-console
      console.log('TNA data saved successfully!');
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
                        ? `${allPoOptions.find(opt => opt.portfolioID === selectedPortfolioId)?.portfolioName || `Portfolio ${selectedPortfolioId}`} selected`
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
            },
            '& .ag-header-cell, & .ag-header-group-cell': {
              paddingLeft: '2px !important',
              paddingRight: '2px !important',
            },
            '& .ag-header-cell-label, & .ag-header-group-cell-label': {
              justifyContent: 'center',
            },
            '& .ag-header-group-cell': {
              borderBottom: `1px solid ${theme.palette.divider} !important`,
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
              rowData={tableData}
              columnDefs={columnDefs}
              headerHeight={32}
              groupHeaderHeight={32}
              rowHeight={32}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                suppressHeaderMenuButton: true,
                editable: (params) => {
                  const field = params.colDef.field || '';
                  const editableSuffixes = [
                    '_preFilledRemarks',
                    '_units',
                    '_status',
                    '_qtyCompleted',
                    '_idealDate',
                    '_actualDate',
                    '_approvalDatee',
                    '_estimatedDate',
                    '_dateSpan',
                    '_freezeCondPPSample',
                  ];
                  return editableSuffixes.some((suffix) => field.endsWith(suffix));
                },
              }}
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
            />
          </div>
        </Box>
      </Card>

      {/* Save Button - shows when there are modified rows */}
      {modifiedRows.size > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
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
        </Box>
      )}
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

