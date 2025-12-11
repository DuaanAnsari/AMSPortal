import { useState, useCallback, useEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';
import { useNavigate } from 'react-router-dom';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useSnackbar } from 'src/components/snackbar';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

// Initial Options - API data aane ke baad update honge
const STATUS_OPTIONS = [{ value: 'All', label: 'ALL' }];

const SUPPLIER_OPTIONS = [{ value: 'All', label: 'ALL' }];

const CUSTOMER_OPTIONS = [{ value: 'All', label: 'ALL' }];

const BOOKED_MONTH_OPTIONS = [
  { value: 'All', label: 'ALL' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const SHIPMENT_MONTH_OPTIONS = [
  { value: 'All', label: 'ALL' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

// Base table headers - sabke liye common
const BASE_TABLE_HEAD = [
  { id: 'select', label: '', width: 50 }, // Checkbox column
  { id: 'poNo', label: 'PO No.', width: 100 },
  { id: 'styleNo', label: 'Style No.', width: 100 },
  { id: 'customer', label: 'Customer', width: 140 },
  { id: 'supplier', label: 'Supplier', width: 150 },
  { id: 'placementDate', label: 'Placement Date', width: 110 },
  { id: 'shipmentDate', label: 'Shipment Date', width: 110 },
  { id: 'amount', label: 'Amount', width: 90, align: 'right' },
];

// Restricted columns - jo hide hone hain (milestone ko hata diya)
const RESTRICTED_COLUMNS = [
  { id: 'view', label: 'View', width: 70 },
  { id: 'pdf', label: 'PDF', width: 60 },
  { id: 'copy', label: 'Copy', width: 60 },
  { id: 'revised', label: 'Revised', width: 70 },
];

// Common columns - jo sabko dikhne hain (milestone add kiya)
const COMMON_COLUMNS = [
  { id: 'milestone', label: 'Milestone', width: 80 },
  { id: 'inspection', label: 'Inspection', width: 100 },
  { id: 'sizeSpecs', label: 'Size Specs', width: 90 },
  { id: 'ssPdf', label: 'SS PDF', width: 70 },
];

const defaultFilters = {
  status: 'All',
  supplier: 'All',
  customer: 'All',
  bookedMonth: 'All',
  shipmentMonth: 'All',
  search: '',
};
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// User variables - localStorage se lekar
const getUserRoleId = () => {
  if (typeof window !== 'undefined') {
    const roleId = localStorage.getItem('roleId');
    if (roleId) {
      try {
        return parseInt(roleId, 10);
      } catch (error) {
        console.error('Error parsing roleId from localStorage:', error);
      }
    }
  }
  return null;
};

// Check if user has restricted access based on role IDs
const hasRestrictedAccess = () => {
  const userRoleId = getUserRoleId();

  if (!userRoleId) return false;

  const restrictedRoles = [21, 44, 45, 30];

  return restrictedRoles.includes(userRoleId);
};

// Dynamic TABLE_HEAD based on user role
const getTableHead = (isRestricted) => {
  if (isRestricted) {
    // Restricted users ke liye sirf base + common columns
    return [...BASE_TABLE_HEAD, ...COMMON_COLUMNS];
  }
  // Normal users ke liye sab columns
  return [...BASE_TABLE_HEAD, ...RESTRICTED_COLUMNS, ...COMMON_COLUMNS];
};

// Helper function to get month from date string
const getMonthFromDate = (dateString) => {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    return (date.getMonth() + 1).toString(); // JavaScript months are 0-indexed, so +1
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
};

export default function PurchaseOrderView() {
  const { enqueueSnackbar } = useSnackbar();
  const table = useTable({ defaultRowsPerPage: 10 });
  const settings = useSettingsContext();
  const navigate = useNavigate();

  const [tableData, setTableData] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Drag to scroll state
  const tableContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeft(tableContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Dynamic dropdown options
  const [statusOptions, setStatusOptions] = useState(STATUS_OPTIONS);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);

  // Inspection dialog state
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionRows, setInspectionRows] = useState([]);
  const [inspectionPoNo, setInspectionPoNo] = useState('');

  // Check restricted access
  const isRestrictedUser = hasRestrictedAccess();

  // Dynamic table head based on user role
  const TABLE_HEAD = getTableHead(isRestrictedUser);

  // ✅ Supplier fetch function (sirf Supplier API se aayega)
  const fetchSuppliers = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE_URL}/api/MyOrders/GetSupplier`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Supplier API Response:', data);

      const supplierList = [
        { value: 'All', label: 'ALL' },
        ...data.map((s) => ({
          value: s.venderName, // value me name bhejna
          label: s.venderName,
        })),
      ];

      setSupplierOptions(supplierList);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      enqueueSnackbar('Failed to fetch suppliers', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // ✅ Customer fetch function
  const fetchCustomers = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE_URL}/api/MyOrders/GetCustomer`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Customer API Response:', data);

      const customerOptions = [
        { value: 'All', label: 'ALL' },
        ...data.map((customer) => ({
          value: customer.customerName,
          label: customer.customerName,
        })),
      ];

      setCustomerOptions(customerOptions);
    } catch (err) {
      console.error('Error fetching customers:', err);
      enqueueSnackbar('Failed to fetch customers', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // ✅ PurchaseOrders fetch function
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No token found, please login again.');
      }

      const apiParams = {
        Status: filters.status || 'All',
        Vender: filters.supplier || 'All',
        Buyer: filters.customer || 'All',
        Shipment: filters.shipmentMonth || 'All',
        Booked: filters.bookedMonth || 'All',
      };

      const params = new URLSearchParams(apiParams);
      const apiUrl = `${API_BASE_URL}/api/MyOrders/GetPurchaseOrders?${params}`;

      console.log('API Calling:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);

      const transformedData = transformApiData(data);
      setTableData(transformedData);

      // ✅ sirf status aur customer ko API response se update karna
      updateDropdownOptions(data);

      enqueueSnackbar(`Loaded ${transformedData.length} purchase orders`, {
        variant: 'success',
      });
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err.message);
      enqueueSnackbar('Failed to fetch purchase orders', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, filters]);

  // ✅ Update dropdown options (supplier ko override nahi karna)
  const updateDropdownOptions = useCallback((apiData) => {
    if (!apiData || !Array.isArray(apiData)) return;

    const uniqueStatuses = [
      'All',
      ...new Set(apiData.map((item) => item.status || item.Status).filter(Boolean)),
    ];
    const statusOptions = uniqueStatuses.map((status) => ({
      value: status,
      label: status,
    }));
    setStatusOptions(statusOptions);
  }, []);

  // Initial data load
  useEffect(() => {
    fetchSuppliers();
    fetchCustomers();
    fetchPurchaseOrders();
  }, [fetchSuppliers, fetchCustomers, fetchPurchaseOrders]);

  // Table filters
  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const dataInPage = dataFiltered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 52 : 72;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const totalPOs = dataFiltered.length;

  // Filter handlers
  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleSearch = useCallback((event) => {
    setSearchText(event.target.value);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchText.trim()) {
      setFilters((prev) => ({ ...prev, search: searchText.trim() }));
    } else {
      setFilters((prev) => ({ ...prev, search: '' }));
    }
  }, [searchText]);

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        handleSearchSubmit();
      }
    },
    [handleSearchSubmit]
  );

  // Clear search text and reset search filter
  const handleClearSearch = useCallback(() => {
    setSearchText('');
    setFilters((prev) => ({ ...prev, search: '' }));
    table.onResetPage();
  }, [table]);

  // Retry button for error state – re-fetch all data
  const handleRetry = useCallback(() => {
    fetchSuppliers();
    fetchCustomers();
    fetchPurchaseOrders();
  }, [fetchSuppliers, fetchCustomers, fetchPurchaseOrders]);

  // Open Inspection popup for selected PO
  const handleInspectionClick = useCallback(
    (row) => {
      setInspectionPoNo(row.poNo || '');
      setInspectionOpen(true);

      // Placeholder: when backend API is available, fetch inspection data here.
      // For now, we simply clear and show "No records to display".
      setInspectionLoading(true);
      setInspectionRows([]);
      setTimeout(() => {
        setInspectionLoading(false);
      }, 300);
    },
    []
  );

  const handleAddOrder = useCallback(() => {
    navigate('/BusinessProcess/PurchaseOrderAdd');
    enqueueSnackbar('Navigating to Add Purchase Order page!');
  }, [enqueueSnackbar, navigate]);

  const handleViewOrder = useCallback(
    (id) => {
      navigate(`/dashboard/supply-chain/purchase-order-edit/${id}`);
      enqueueSnackbar(`Viewing details for PO ID: ${id}`);
    },
    [enqueueSnackbar, navigate]
  );


  const handleToggleCheckbox = useCallback(
    (id, field) => {
      setTableData((prevData) =>
        prevData.map((row) => (row.id === id ? { ...row, [field]: !row[field] } : row))
      );
      enqueueSnackbar(`${field} updated for PO ${id}`);
    },
    [enqueueSnackbar]
  );

  const handlePdfClick = useCallback(
    (id, type = 'pdf') => {
      if (type === 'pdf') {
        enqueueSnackbar(`Opening PDF document for PO ID: ${id}`);
      } else if (type === 'ssPdf') {
        enqueueSnackbar(`Opening SS PDF document for PO ID: ${id}`);
      }

      // ID ko URL me bhej rahe hain — recommended
      const pdfPath = type === 'ssPdf' ? `/dashboard/supply-chain/purchase-order-sspdf/${id}` : `/dashboard/supply-chain/purchase-order-pdf/${id}`;
      navigate(pdfPath, {
        state: { type } // type optional, agar page ko chahiye ho
      });
    },
    [enqueueSnackbar, navigate]
  );


  // New handlers for text links
  const handleMilestoneClick = useCallback(
    (id) => {
      enqueueSnackbar(`Opening Milestone for PO ID: ${id}`);
      navigate(`/dashboard/supply-chain/milestone/${id}`);
    },
    [enqueueSnackbar]
  );

  const handleRevisedClick = useCallback(
    (id) => {
      enqueueSnackbar(`Opening Revised for PO ID: ${id}`);
    },
    [enqueueSnackbar]
  );

  const handleSizeSpecsClick = useCallback(
    (id) => {
      enqueueSnackbar(`Opening Size Specs for PO ID: ${id}`);
    },
    [enqueueSnackbar]
  );

  useEffect(() => {
    console.log('Current table data count:', tableData.length);
    console.log('Current filters:', filters);
    console.log('Dropdown options:', {
      statusOptions,
      supplierOptions,
      customerOptions,
    });
    console.log('Is Restricted User:', isRestrictedUser);
    console.log('Table Head:', TABLE_HEAD);
  }, [tableData, filters, statusOptions, supplierOptions, customerOptions, isRestrictedUser, TABLE_HEAD]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ py: 2 }}>
      <CustomBreadcrumbs
        heading="PURCHASE ORDER VIEW"
        links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'Purchase Orders' }]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      {/* Top Search and Action Bar - 2 Rows Layout */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2.5 }}>
          {/* First Row - Search Bar and Total POs */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {/* Total PO Count Display */}
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 'bold', color: 'primary.main' }}
                  >
                    Total POs: {totalPOs}
                  </Typography>
                </Box>

                <TextField
                  size="small"
                  placeholder="Search PO No, Style No, Supplier, Customer..."
                  value={searchText}
                  onChange={handleSearch}
                  onKeyPress={handleKeyPress}
                  sx={{ minWidth: 300, flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" width={20} />
                      </InputAdornment>
                    ),
                    endAdornment: searchText && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={handleClearSearch}>
                          <Iconify icon="eva:close-fill" width={16} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSearchSubmit}
                  disabled={!searchText.trim()}
                >
                  Search
                </Button>

                {canReset && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleResetFilters}
                    startIcon={<Iconify icon="eva:refresh-fill" width={16} />}
                  >
                    Reset
                  </Button>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                {error && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={handleRetry}
                    startIcon={<Iconify icon="eva:refresh-fill" width={16} />}
                  >
                    Retry
                  </Button>
                )}

                {/* Edit Selected Button */}
                {table.selected.length > 0 && (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Iconify icon="eva:edit-fill" width={20} />}
                    onClick={() => {
                      // Navigate to edit-order with selected PO IDs
                      navigate('/dashboard/supply-chain/edit-order', {
                        state: { selectedPOIds: table.selected }
                      });
                      enqueueSnackbar(`Editing ${table.selected.length} selected PO(s)`);
                    }}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Edit ({table.selected.length})
                  </Button>
                )}

                <Button
                  variant="contained"
                  startIcon={<Iconify icon="eva:plus-fill" width={20} />}
                  onClick={() => navigate('/dashboard/supply-chain/add-order')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Add Order
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Second Row - 5 Dropdowns - Compact layout */}
          <Grid container spacing={1}>
            <Grid item xs={6} sm={4} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilters('status', e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                  <MenuItem value="Close">Close</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={filters.supplier}
                  label="Supplier"
                  onChange={(e) => handleFilters('supplier', e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 250,
                        width: 'auto',
                        minWidth: '100%',
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    getContentAnchorEl: null,
                  }}
                >
                  {supplierOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={4} md={2.4}>
              <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={filters.customer}
                  label="Customer"
                  onChange={(e) => handleFilters('customer', e.target.value)}
                  sx={{
                    bgcolor: 'background.paper',
                    '& .MuiSelect-select': {
                      py: 1.2,
                      px: 1.5,
                    },
                  }}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        mt: 0.5,
                        boxShadow: 3,
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {customerOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      sx={{
                        fontSize: '0.875rem',
                        '&.Mui-selected': {
                          bgcolor: 'primary.lighter',
                          fontWeight: 600,
                        },
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={4} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Booked Month</InputLabel>
                <Select
                  value={filters.bookedMonth}
                  label="Booked Month"
                  onChange={(e) => handleFilters('bookedMonth', e.target.value)}
                >
                  {BOOKED_MONTH_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={4} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Shipment Month</InputLabel>
                <Select
                  value={filters.shipmentMonth}
                  label="Shipment Month"
                  onChange={(e) => handleFilters('shipmentMonth', e.target.value)}
                >
                  {SHIPMENT_MONTH_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading purchase orders from API...</Typography>
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card sx={{ p: 3, mb: 2, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>
            Error Loading Data: {error}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please check if the API server is running at {API_BASE_URL}
          </Typography>
          <Button variant="contained" onClick={handleRetry}>
            Retry Loading Data
          </Button>
        </Card>
      )}

      {/* Main Table Card */}
      {!loading && !error && (
        <Card>
          <TableContainer
            ref={tableContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            sx={{
              maxHeight: 600,
              cursor: isDragging ? 'grabbing' : 'grab',
              overflowX: 'auto', // Ensure horizontal scroll is enabled
              '&::-webkit-scrollbar': {
                height: 8,
              },
              '&::-webkit-scrollbar-thumb': {
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.grey[600], 0.24),
              },
              '&::-webkit-scrollbar-track': {
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16),
              },
            }}
          >
            <Table
              stickyHeader
              sx={{
                minWidth: isRestrictedUser ? 980 : 1200,
                tableLayout: 'fixed'
              }}
            >
              {/* Dynamic Header based on user role */}
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                sx={{
                  '& .MuiTableRow-root': {
                    backgroundColor: (theme) => theme.palette.primary.main,
                  },
                  '& .MuiTableCell-root': {
                    backgroundColor: (theme) => theme.palette.primary.main,
                    color: (theme) => theme.palette.primary.contrastText,
                  },
                  '& .MuiTableSortLabel-root': {
                    color: (theme) => theme.palette.primary.contrastText,
                  },
                }}
              />

              {/* Table Body */}
              <TableBody
                sx={{
                  '& .MuiTableRow-root': {
                    backgroundColor: (theme) => theme.palette.background.paper,
                  },
                  '& .MuiTableCell-root': {
                    color: (theme) => theme.palette.text.primary,
                    padding: table.dense ? '6px 8px' : '12px 16px',
                  },
                }}
              >
                {dataInPage.map((row) => (
                  <PurchaseOrderTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    onToggleCheckbox={handleToggleCheckbox}
                    onPdfClick={handlePdfClick}
                    onViewOrder={handleViewOrder}
                    onMilestoneClick={handleMilestoneClick}
                    onRevisedClick={handleRevisedClick}
                    onSizeSpecsClick={handleSizeSpecsClick}
                    onInspectionClick={handleInspectionClick}
                    isRestrictedUser={isRestrictedUser}
                  />
                ))}

                <TableEmptyRows
                  height={denseHeight}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </TableContainer>

          {/* Fixed Pagination */}
          <TablePaginationCustom
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 60]}
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      )}

      {/* Inspection Popup */}
      <Dialog
        open={inspectionOpen}
        onClose={() => setInspectionOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Inspection</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          {inspectionPoNo && (
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              PO No: {inspectionPoNo}
            </Typography>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>PDF</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Inspection Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Insp No.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>AQL System</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>AQL Range</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inspectionLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : inspectionRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No records to display
                    </TableCell>
                  </TableRow>
                ) : (
                  inspectionRows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.pdf || ''}</TableCell>
                      <TableCell>{row.inspectionDate || ''}</TableCell>
                      <TableCell>{row.inspectionNo || ''}</TableCell>
                      <TableCell>{row.aqlSystem || ''}</TableCell>
                      <TableCell>{row.aqlRange || ''}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInspectionOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// ----------------------------------------------------------------------

function PurchaseOrderTableRow({
  row,
  selected,
  onSelectRow,
  onToggleCheckbox,
  onPdfClick,
  onViewOrder,
  onMilestoneClick,
  onRevisedClick,
  onSizeSpecsClick,
  onInspectionClick,
  isRestrictedUser,
}) {
  const renderPdfIcon = (field) => {
    if (row[field] === 'Available') {
      return (
        <IconButton size="small" onClick={() => onPdfClick(row.id, field)} sx={{ p: 0.5 }}>
          <img src="/assets/icons/files/pdf.png" alt="PDF" width={16} height={16} />
        </IconButton>
      );
    }
    return <Box sx={{ width: 16, height: 16, display: 'inline-block' }} />;
  };

  return (
    <TableRow
      hover
      selected={selected}
      sx={{
        '& td': { py: 1 },
        cursor: 'grab',
        '&:hover': { cursor: 'grab' },
        '&:active': { cursor: 'grabbing' },
      }}
    >
      {/* Checkbox Column */}
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onClick={onSelectRow}
          sx={{ p: 0.5 }}
        />
      </TableCell>
      {/* Base Columns - Sabko dikhne wale */}
      <TableCell sx={{ fontWeight: 'medium', fontSize: '0.75rem' }}>{row.poNo}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{row.styleNo}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{row.customer}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{row.supplier}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{row.placementDate}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{row.shipmentDate}</TableCell>
      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
        ${row.amount ? row.amount.toLocaleString() : '0'}
      </TableCell>

      {/* Restricted Columns - Sirf normal users ke liye */}
      {!isRestrictedUser && (
        <>
          {/* View - Capsule Tag */}
          <TableCell align="center">
            <span
              style={{
                backgroundColor: '#E8F0FE',
                color: '#1A73E8',
                border: '1px solid #1A73E8',
                fontWeight: 600,
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '10px',
                display: 'inline-block',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#D2E3FC';
                e.target.style.boxShadow = '0 0 6px rgba(26,115,232,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#E8F0FE';
                e.target.style.boxShadow = 'none';
              }}
              onClick={() => onViewOrder(row.id)}
            >
              View
            </span>
          </TableCell>

          {/* PDF Icon */}
          <TableCell>
            {renderPdfIcon('pdf')}
          </TableCell>

          {/* Copy */}
          <TableCell>
            {row.ssPdf === 'Available' && (
              <img src="/assets/icons/files/copy.jpg" alt="copy" width={16} height={16} />
            )}
          </TableCell>

          {/* Revised - White Capsule Tag */}
          <TableCell align="center">
            <span
              style={{
                backgroundColor: '#FFFFFF',
                color: '#000000',
                border: '1px solid #BDBDBD',
                fontWeight: 600,
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '10px',
                display: 'inline-block',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#F5F5F5';
                e.target.style.boxShadow = '0 0 6px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#FFFFFF';
                e.target.style.boxShadow = 'none';
              }}
              onClick={() => onRevisedClick(row.id)}
            >
              Revised
            </span>
          </TableCell>
        </>
      )}

      {/* Common Columns - Sabko dikhne wale (Milestone ab sabko dikhega) */}

      {/* Milestone - Capsule Tag - Ab sabko dikhega */}
      <TableCell align="center">
        <span
          style={{
            backgroundColor: '#FFF4E5',
            color: '#FB8C00',
            border: '1px solid #FB8C00',
            fontWeight: 600,
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '10px',
            display: 'inline-block',
            cursor: 'pointer',
            textTransform: 'capitalize',
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#FFE0B2';
            e.target.style.boxShadow = '0 0 6px rgba(251,140,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FFF4E5';
            e.target.style.boxShadow = 'none';
          }}
          onClick={() => onMilestoneClick(row.id)}
        >
          Milestone
        </span>
      </TableCell>

      {/* Inspection - Green Capsule Tag */}
      <TableCell align="center">
        <span
          style={{
            backgroundColor: '#E8F5E9',
            color: '#43A047',
            border: '1px solid #43A047',
            fontWeight: 600,
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '10px',
            display: 'inline-block',
            cursor: 'pointer',
            textTransform: 'capitalize',
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#C8E6C9';
            e.target.style.boxShadow = '0 0 6px rgba(67,160,71,0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#E8F5E9';
            e.target.style.boxShadow = 'none';
          }}
          onClick={() => onInspectionClick?.(row)}
        >
          Inspection
        </span>
      </TableCell>

      {/* Size Specs - White Capsule Tag */}
      <TableCell align="center">
        <span
          style={{
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: '1px solid #BDBDBD',
            fontWeight: 600,
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '10px',
            display: 'inline-block',
            cursor: 'pointer',
            textTransform: 'capitalize',
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#F5F5F5';
            e.target.style.boxShadow = '0 0 6px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FFFFFF';
            e.target.style.boxShadow = 'none';
          }}
          onClick={() => onSizeSpecsClick(row.id)}
        >
          Size Specs
        </span>
      </TableCell>

      {/* Size Specs PDF */}
      <TableCell>
        <IconButton size="small" onClick={() => onPdfClick(row.id, 'ssPdf')} sx={{ p: 0.5 }}><img src="/assets/icons/files/pdf.png" alt="SS PDF" width={16} height={16} /></IconButton>


      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------

// Updated applyFilter with dropdown logic - Now with proper month filtering
function applyFilter({ inputData, comparator, filters }) {
  const { status, supplier, customer, bookedMonth, shipmentMonth, search } = filters;

  let filteredData = [...inputData];

  // Search filter
  if (search) {
    filteredData = filteredData.filter(
      (order) =>
        (order.poNo && order.poNo.toLowerCase().includes(search.toLowerCase())) ||
        (order.styleNo && order.styleNo.toLowerCase().includes(search.toLowerCase())) ||
        (order.supplier && order.supplier.toLowerCase().includes(search.toLowerCase())) ||
        (order.customer && order.customer.toLowerCase().includes(search.toLowerCase()))
    );
  }

  // Status filter
  if (status && status !== 'All') {
    filteredData = filteredData.filter(
      (order) =>
        (order.status &&
          order.status.toString().toLowerCase() === status.toString().toLowerCase()) ||
        (order.Status && order.Status.toString().toLowerCase() === status.toString().toLowerCase())
    );
  }

  // Supplier filter
  if (supplier && supplier !== 'All') {
    filteredData = filteredData.filter(
      (order) =>
        (order.supplier &&
          order.supplier.toString().toLowerCase() === supplier.toString().toLowerCase()) ||
        (order.vendor &&
          order.vendor.toString().toLowerCase() === supplier.toString().toLowerCase()) ||
        (order.Vender &&
          order.Vender.toString().toLowerCase() === supplier.toString().toLowerCase())
    );
  }

  // Customer filter
  if (customer && customer !== 'All') {
    filteredData = filteredData.filter(
      (order) =>
        (order.customer &&
          order.customer.toString().toLowerCase() === customer.toString().toLowerCase()) ||
        (order.Customer &&
          order.Customer.toString().toLowerCase() === customer.toString().toLowerCase())
    );
  }

  // Booked Month filter (Placement Date month check) - UPDATED
  if (bookedMonth && bookedMonth !== 'All') {
    filteredData = filteredData.filter((order) => {
      const placementDate = order.placementDate || order.PlacementDate;
      if (!placementDate) return false;

      const placementMonth = getMonthFromDate(placementDate);
      return placementMonth === bookedMonth;
    });
  }

  // Shipment Month filter (Shipment Date month check) - UPDATED
  if (shipmentMonth && shipmentMonth !== 'All') {
    filteredData = filteredData.filter((order) => {
      const shipmentDate = order.shipmentDate || order.ShipmentDate;
      if (!shipmentDate) return false;

      const shipmentMonthValue = getMonthFromDate(shipmentDate);
      return shipmentMonthValue === shipmentMonth;
    });
  }

  // Sorting (unchanged)
  const stabilizedThis = filteredData.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  return stabilizedThis.map((el) => el[0]);
}

// ----------------------------------------------------------------------

// Function to transform API data to match our table structure
function transformApiData(apiData) {
  if (!apiData || !Array.isArray(apiData)) {
    console.log('API returned invalid data or empty array');
    return [];
  }

  console.log('Transforming API data, count:', apiData.length);

  return apiData.map((item, index) => {
    // Debug log for each item
    console.log(`Item ${index}:`, item);

    // API response ke exact field names use karo
    return {
      // Prefer explicit PO ID from API, fallback to index
      id: item.poid || item.POID || item.POId || index + 1,

      // PO number: cover multiple possible API field names
      poNo:
        item.pono || // common in your other APIs
        item.PONO ||
        item.poNo ||
        item.PONo ||
        item.PO_No ||
        `PO-${index + 1}`,

      // Style number
      styleNo: item.styleNo || item.StyleNo || item.Style || `STYLE-${index + 1}`,

      // Customer / Buyer
      customer:
        item.customer ||
        item.Customer ||
        item.buyer ||
        item.Buyer ||
        item.customerName ||
        'Unknown Customer',

      // Supplier / Vendor
      supplier:
        item.supplier ||
        item.Supplier ||
        item.vendor ||
        item.Vender ||
        item.vendorName ||
        item.venderName ||
        'Unknown Supplier',

      // Dates
      placementDate: item.placementDate || item.PlacementDate || item.placementDt || 'Not Set',
      shipmentDate: item.shipmentDate || item.ShipmentDate || item.shipmentDt || 'Not Set',

      // Amount
      amount:
        parseFloat((item.amount || item.Amount || '0').toString().replace('$', '').trim()) || 0,
      milestone: 'Milestone', // Default value
      pdf: 'Available', // Default value
      copy: false, // Default value
      revised: 'Revised Ship', // Default value
      inspection: false, // Default value
      size: 'Size Space', // Default value
      ssPdf: 'Available', // Default value
      status: item.status || item.Status || 'active',
    };
  });
}