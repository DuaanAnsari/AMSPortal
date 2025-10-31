import { useState, useCallback, useEffect } from 'react';
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

// Compact table headers with smaller widths
const TABLE_HEAD = [
  { id: 'poNo', label: 'PO No.', width: 100 },
  { id: 'styleNo', label: 'Style No.', width: 100 },
  { id: 'customer', label: 'Customer', width: 140 },
  { id: 'supplier', label: 'Supplier', width: 150 },
  { id: 'placementDate', label: 'Placement Date', width: 110 },
  { id: 'shipmentDate', label: 'Shipment Date', width: 110 },
  { id: 'amount', label: 'Amount', width: 90, align: 'right' },
  { id: 'view', label: 'View', width: 70 },
  { id: 'milestone', label: 'Milestone', width: 80 },
  { id: 'pdf', label: 'PDF', width: 60 },
  { id: 'copy', label: 'Copy', width: 60 },
  { id: 'revised', label: 'Revised', width: 70 },
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

//duaan ne commnet ki hai
// const API_BASE_URL = 'https://amsapitesting.scmcloud.online/api';

// User variables
const USER_ID = 1;
const ROLE_ID = 1;
const MANAGER_BIT = 1;

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

  // Dynamic dropdown options
  const [statusOptions, setStatusOptions] = useState(STATUS_OPTIONS);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);

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
  }, [enqueueSnackbar, filters, USER_ID, ROLE_ID, MANAGER_BIT]);

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

  const handleAddOrder = useCallback(() => {
    navigate('/BusinessProcess/PurchaseOrderAdd');
    enqueueSnackbar('Navigating to Add Purchase Order page!');
  }, [enqueueSnackbar, navigate]);

  const handleViewOrder = useCallback(
    (id) => {
      navigate(`/BusinessProcess/PurchaseOrderDetail/${id}`);
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
    },
    [enqueueSnackbar]
  );

  const handleRetry = useCallback(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    setFilters((prev) => ({ ...prev, search: '' }));
  }, []);

  // New handlers for text links
  const handleMilestoneClick = useCallback(
    (id) => {
      enqueueSnackbar(`Opening Milestone for PO ID: ${id}`);
      navigate(`/dashboard/supply-chain/milestone/${id}`);
      // Yahan aap milestone page pe navigate kar sakte hain
    },
    [enqueueSnackbar]
  );

  const handleRevisedClick = useCallback(
    (id) => {
      enqueueSnackbar(`Opening Revised for PO ID: ${id}`);
      // Yahan aap revised page pe navigate kar sakte hain
    },
    [enqueueSnackbar]
  );

  const handleSizeSpecsClick = useCallback(
    (id) => {
      enqueueSnackbar(`Opening Size Specs for PO ID: ${id}`);
      // Yahan aap size Specs page pe navigate kar sakte hain
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
  }, [tableData, filters, statusOptions, supplierOptions, customerOptions]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ py: 2 }}>
      <CustomBreadcrumbs
        heading="PURCHASE ORDER VIEW"
        links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'Purchase Orders' }]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      {/* Style/Colorway/Product Code Heading */}
      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
        Style / Colorway / Product Code :
      </Typography>

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
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table
              size={table.dense ? 'small' : 'medium'}
              sx={{ minWidth: 1200, tableLayout: 'fixed' }}
              stickyHeader
            >
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                sx={{
                  '& .MuiTableRow-root': {
                    backgroundColor: 'blue',
                  },
                  '& .MuiTableCell-root': {
                    backgroundColor: '#87CEEB',
                    color: 'black', // Use contrasting color for text
                  },
                  '& .MuiTableSortLabel-root': {},
                }}
              />

              <TableBody>
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
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      )}
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
    <TableRow hover selected={selected} sx={{ '& td': { py: 1 } }}>
      <TableCell sx={{ fontWeight: 'medium', fontSize: '0.75rem' }}>{row.poNo}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{row.styleNo}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{row.customer}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{row.supplier}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{row.placementDate}</TableCell>
      <TableCell sx={{ fontSize: '0.75rem' }}>{row.shipmentDate}</TableCell>
      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
        ${row.amount ? row.amount.toLocaleString() : '0'}
      </TableCell>

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
            borderRadius: '16px',
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

      {/* Milestone - Capsule Tag */}
      <TableCell align="center">
        <span
          style={{
            backgroundColor: '#FFF4E5',
            color: '#FB8C00',
            border: '1px solid #FB8C00',
            fontWeight: 600,
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '16px',
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

      {/* PDF Icon */}
      <TableCell>{renderPdfIcon('pdf')}</TableCell>

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
            borderRadius: '16px',
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
            borderRadius: '16px',
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
            borderRadius: '16px',
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
        {row.ssPdf === 'Available' && (
          <img src="/assets/icons/files/pdf.png" alt="SS PDF" width={16} height={16} />
        )}
      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------

// Updated applyFilter with dropdown logic
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

  // Booked Month filter (Placement Date month check)
  if (bookedMonth && bookedMonth !== 'All') {
    filteredData = filteredData.filter((order) => {
      const pd = order.placementDate || order.PlacementDate;
      if (!pd) return false;
      const monthName = (() => {
        const d = new Date(pd);
        if (isNaN(d)) {
          // try parse yyyy-mm-dd or other string formats more robustly
          const parsed = Date.parse(pd);
          if (isNaN(parsed)) return '';
          return new Date(parsed).toLocaleString('default', { month: 'long' });
        }
        return d.toLocaleString('default', { month: 'long' });
      })();
      return monthName.toLowerCase() === bookedMonth.toLowerCase();
    });
  }

  // Shipment Month filter (Shipment Date month check)
  if (shipmentMonth && shipmentMonth !== 'All') {
    filteredData = filteredData.filter((order) => {
      const sd = order.shipmentDate || order.ShipmentDate;
      if (!sd) return false;
      const monthName = (() => {
        const d = new Date(sd);
        if (isNaN(d)) {
          const parsed = Date.parse(sd);
          if (isNaN(parsed)) return '';
          return new Date(parsed).toLocaleString('default', { month: 'long' });
        }
        return d.toLocaleString('default', { month: 'long' });
      })();
      return monthName.toLowerCase() === shipmentMonth.toLowerCase();
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
      id: item.poid || item.POID || index + 1,
      poNo: item.poNo || item.PONo || `PO-${index + 1}`,
      styleNo: item.styleNo || item.StyleNo || `STYLE-${index + 1}`,
      customer: item.customer || item.Customer || 'Unknown Customer',
      supplier: item.vendor || item.Vender || 'Unknown Supplier',
      placementDate: item.placementDate || item.PlacementDate || 'Not Set',
      shipmentDate: item.shipmentDate || item.ShipmentDate || 'Not Set',
      amount: parseFloat((item.amount || item.Amount || '0').replace('$', '').trim()) || 0,
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
