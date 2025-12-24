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
  const [productPortfolios, setProductPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [loading, setLoading] = useState(false);
  const [allPoNumbers, setAllPoNumbers] = useState([]);
  const [selectedPoNumbers, setSelectedPoNumbers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  const containerStyle = useMemo(
    () => ({
      width: '100%',
      height: '400px',
    }),
    []
  );

  const [columnDefs, setColumnDefs] = useState([]);

  // Fetch product portfolios for filter
  useEffect(() => {
    const fetchProductPortfolios = async () => {
      try {
        const response = await apiClient.get('/MyOrders/GetProductPortfolio');
        const list = response.data || [];
        setProductPortfolios(list);
        // Default: first portfolio + auto load
        if (list.length && !selectedPortfolio) {
          const firstId = list[0].productPortfolioID;
          setSelectedPortfolio(firstId);
          handleSearch(firstId);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching product portfolios for TNA Chart:', error);
      }
    };

    fetchProductPortfolios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-filter data when selected PO numbers change (without re-fetching)
  useEffect(() => {
    if (fullData.length === 0) return;

    let filteredData = fullData;

    // First filter by customers if selected
    if (selectedCustomers.length > 0) {
      filteredData = filteredData.filter(row => selectedCustomers.includes(row.customer));
    }

    // Then filter by selected PO numbers if any
    if (selectedPoNumbers.length > 0) {
      filteredData = filteredData.filter(row => selectedPoNumbers.includes(row.poNo));
    }

    setTableData(filteredData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoNumbers]);

  // Re-filter when customers change
  useEffect(() => {
    if (!selectedPortfolio) return;
    handleSearch(selectedPortfolio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomers]);

  const handleSearch = async (portfolioId) => {
    const idToUse = portfolioId || selectedPortfolio;

    if (!idToUse) {
      setTableData([]);
      setFullData([]);
      setColumnDefs([]);
      setAllCustomers([]);
      setAllPoNumbers([]);
      return;
    }

    // Clear previous data immediately to prevent showing stale data
    setTableData([]);
    setFullData([]);
    setColumnDefs([]);
    setAllCustomers([]);
    setAllPoNumbers([]);

    setLoading(true);
    try {
      const [processRes, poRes] = await Promise.all([
        apiClient
          .get(`/Milestone/GetprocessByPortfolio?productPortfolioId=${idToUse}`)
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Process API Error', err);
            return { data: [] };
          }),
        apiClient
          .get(`/Milestone/GetTNAandPO?PortfolioID=${idToUse}`)
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('TNA API Error', err);
            return { data: [] };
          }),
      ]);

      const processList = (processRes.data || []).filter((p) => !!p);
      const poData = poRes.data || [];

      // 1. Construct Columns (group headers)
      const newColDefs = [
        { headerName: 'PO No', field: 'poNo', pinned: 'left', minWidth: 70 },
        { headerName: 'Customer', field: 'customer', pinned: 'left', minWidth: 110 },
        ...processList.map((proc) => ({
          headerName: proc,
          children: [
            { headerName: 'Ideal Date', field: `${proc}_idealDate`, minWidth: 75 },
            { headerName: 'Actual Date', field: `${proc}_actualDate`, minWidth: 75 },
            { headerName: 'Approval Date', field: `${proc}_approvalDatee`, minWidth: 75 },
            { headerName: 'Est. Date', field: `${proc}_estimatedDate`, minWidth: 75 },
            { headerName: 'Date Span', field: `${proc}_dateSpan`, minWidth: 60 },
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

      // 2. Pivot Data: one row per PO, processes as column groups
      const rowMap = new Map();

      poData.forEach((item) => {
        if (!item.poid) return;

        if (!rowMap.has(item.poid)) {
          rowMap.set(item.poid, {
            poid: item.poid,
            poNo: item.poNo,
            customer: item.customer || item.customerName || '',
            status: item.status,
            qtyCompleted: item.qtyCompleted,
            freezeCondPPSample: item.freezeCondPPSample,
          });
        }
        const row = rowMap.get(item.poid);
        if (item.process) {
          row[`${item.process}_idealDate`] = item.idealDate;
          row[`${item.process}_actualDate`] = item.actualDate;
          row[`${item.process}_approvalDatee`] = item.approvalDatee;
          row[`${item.process}_estimatedDate`] = item.estimatedDate;
          row[`${item.process}_dateSpan`] = item.dateSpan;
        }
      });

      const finalData = Array.from(rowMap.values()).sort((a, b) => b.poid - a.poid);
      // eslint-disable-next-line no-console
      console.log('Grid Data:', finalData);

      // Store full data
      setFullData(finalData);

      // Extract unique customers for dropdown
      const uniqueCustomers = [...new Set(finalData.map(row => row.customer))].filter(Boolean).sort();
      setAllCustomers(uniqueCustomers);

      // Extract unique PO numbers (filtered by customers if selected)
      const customerFilteredData = selectedCustomers.length > 0
        ? finalData.filter(row => selectedCustomers.includes(row.customer))
        : finalData;

      const uniquePoNumbers = [...new Set(customerFilteredData.map(row => row.poNo))].filter(Boolean).sort();
      setAllPoNumbers(uniquePoNumbers);

      // Filter data based on selected customers and PO numbers
      let filteredData = finalData;

      // First filter by customers if selected
      if (selectedCustomers.length > 0) {
        filteredData = filteredData.filter(row => selectedCustomers.includes(row.customer));
      }

      // Then filter by selected PO numbers if any
      if (selectedPoNumbers.length > 0) {
        filteredData = filteredData.filter(row => selectedPoNumbers.includes(row.poNo));
      }

      setTableData(filteredData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching TNA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioChange = (event) => {
    const value = event.target.value;
    setSelectedPortfolio(value);
    setSelectedCustomers([]); // Reset customers when portfolio changes
    setSelectedPoNumbers([]); // Reset PO selection when portfolio changes
    handleSearch(value);
  };

  const handleCustomerChange = (event, newValue) => {
    setSelectedCustomers(newValue);
    setSelectedPoNumbers([]); // Reset PO selection when customers change
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
            <Box sx={{ minWidth: 260, maxWidth: 320 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Product Portfolio"
                value={selectedPortfolio}
                onChange={handlePortfolioChange}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: { maxHeight: 300 },
                    },
                  },
                }}
              >
                <MenuItem value="">
                  Product Portfolio
                </MenuItem>
                {productPortfolios.map((p) => (
                  <MenuItem key={p.productPortfolioID} value={p.productPortfolioID}>
                    {p.productPortfolio}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ minWidth: 260, maxWidth: 320 }}>
              <Autocomplete
                multiple
                id="customer-autocomplete"
                options={['__SELECT_ALL__', ...allCustomers]}
                disableCloseOnSelect
                value={selectedCustomers}
                onChange={(event, newValue) => {
                  // Filter out the __SELECT_ALL__ option from the value
                  const filteredValue = newValue.filter(v => v !== '__SELECT_ALL__');
                  handleCustomerChange(event, filteredValue);
                }}
                getOptionLabel={(option) => {
                  if (option === '__SELECT_ALL__') return 'Select All';
                  return option;
                }}
                disabled={!selectedPortfolio}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Customer ${selectedCustomers.length > 0 ? `(${selectedCustomers.length})` : ''}`}
                    placeholder={selectedCustomers.length === 0 ? "Search or select customers..." : ""}
                    size="small"
                  />
                )}
                renderOption={(props, option, { selected }) => {
                  // Check if this is the "Select All" option
                  if (option === '__SELECT_ALL__') {
                    const allSelected = allCustomers.length > 0 && allCustomers.every(customer => selectedCustomers.includes(customer));
                    const someSelected = allCustomers.some(customer => selectedCustomers.includes(customer));

                    return (
                      <li
                        {...props}
                        key="select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (allSelected) {
                            setSelectedCustomers([]);
                            setSelectedPoNumbers([]);
                          } else {
                            setSelectedCustomers([...allCustomers]);
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

            <Box sx={{ minWidth: 260, maxWidth: 320 }}>
              <Autocomplete
                multiple
                id="po-number-autocomplete"
                options={['__SELECT_ALL__', ...allPoNumbers]}
                disableCloseOnSelect
                value={selectedPoNumbers}
                onChange={(event, newValue) => {
                  // Filter out the __SELECT_ALL__ option from the value
                  const filteredValue = newValue.filter(v => v !== '__SELECT_ALL__');
                  setSelectedPoNumbers(filteredValue);
                }}
                getOptionLabel={(option) => {
                  if (option === '__SELECT_ALL__') return 'Select All';
                  return option;
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`PO No ${selectedPoNumbers.length > 0 ? `(${selectedPoNumbers.length})` : ''}`}
                    placeholder={selectedPoNumbers.length === 0 ? "Search or select PO..." : ""}
                    size="small"
                  />
                )}
                renderOption={(props, option, { selected }) => {
                  // Check if this is the "Select All" option
                  if (option === '__SELECT_ALL__') {
                    const allSelected = allPoNumbers.length > 0 && allPoNumbers.every(poNo => selectedPoNumbers.includes(poNo));
                    const someSelected = allPoNumbers.some(poNo => selectedPoNumbers.includes(poNo));

                    return (
                      <li
                        {...props}
                        key="select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (allSelected) {
                            setSelectedPoNumbers([]);
                          } else {
                            setSelectedPoNumbers([...allPoNumbers]);
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
            />
          </div>
        </Box>
      </Card>
    </Container>
  );
}

