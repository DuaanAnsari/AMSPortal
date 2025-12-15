import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import {
  Box,
  Grid,
  Typography,
  Button,
  MenuItem,
  TextField,
  CircularProgress,
  Card,
  TableContainer,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TablePagination,
  IconButton,
  Container,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import BuildIcon from '@mui/icons-material/Build';
import { format } from 'date-fns';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs'; // ✅ make sure this import path matches your project

export default function POSearchEngine({ settings, isDialog, onClose }) {
  const [buyer, setBuyer] = useState('');
  const [vendor, setVendor] = useState('');
  const [searchBy, setSearchBy] = useState('PO No');
  const [poNo, setPoNo] = useState('');
  const [styleNo, setStyleNo] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [customerOptions, setCustomerOptions] = useState([]);
  const [vendorOptions, setVendorOptions] = useState([]);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('poNo');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Drag scrolling state
  const tableContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // ✅ Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetCustomer`, { headers });
        setCustomerOptions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load customers');
      }
    };
    fetchCustomers();
  }, []);

  // ✅ Fetch vendors based on buyer
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          buyer
            ? `${API_BASE_URL}/api/QuickSearch/GetSuppliersByCustomer/${buyer}`
            : `${API_BASE_URL}/api/QuickSearch/GetSuppliersByCustomer/All`,
          { headers }
        );
        setVendorOptions(res.data || []);
      } catch (err) {
        console.error(err);
        setVendorOptions([]);
      }
    };
    fetchVendors();
  }, [buyer]);

  // ✅ Sorting helpers
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const stableSort = (array, comparator) => {
    const stabilized = array.map((el, index) => [el, index]);
    stabilized.sort((a, b) => {
      const orderResult = comparator(a[0], b[0]);
      if (orderResult !== 0) return orderResult;
      return a[1] - b[1];
    });
    return stabilized.map((el) => el[0]);
  };

  const getComparator = (order, orderBy) =>
    order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);

  const descendingComparator = (a, b, orderBy) => {
    if (!a[orderBy]) return 1;
    if (!b[orderBy]) return -1;
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  };

  // ✅ Pagination
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ✅ Search Function
  const handleSearch = async () => {
    setSearchTriggered(true);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let url = `${API_BASE_URL}/api/QuickSearch/LoadData?customerId=${buyer || 0}&vendorId=${vendor || 0
        }`;

      if (searchBy === 'PO No') {
        url += `&type=pono`;
        if (poNo.trim() !== '') url += `&pono=${poNo.trim()}`;
      } else if (searchBy === 'Style') {
        if (!styleNo.trim()) {
          setResults([]);
          setLoading(false);
          return;
        }
        url += `&type=style&style=${encodeURIComponent(styleNo.trim())}`;
      } else if (searchBy === 'Date') {
        if (!fromDate && !toDate) {
          setResults([]);
          setLoading(false);
          return;
        }

        url += `&type=date`;

        const dateFrom = fromDate
          ? encodeURIComponent(format(new Date(fromDate), 'MMM dd, yyyy'))
          : '';
        const dateTo = toDate ? encodeURIComponent(format(new Date(toDate), 'MMM dd, yyyy')) : '';

        if (dateFrom) url += `&dateFrom=${dateFrom}`;
        if (dateTo) url += `&dateTo=${dateTo}`;
      }

      const res = await axios.get(url, { headers });
      const data = Array.isArray(res.data) ? res.data : [];
      setResults(data);
      setError(null); // Clear any previous errors on successful fetch
      setPage(0);
    } catch (err) {
      console.error(err);
      // Check if it's a 404 - this means no data found, not an error
      if (err.response && err.response.status === 404) {
        // 404 means no data found - this is expected, not an error
        setResults([]);
        setError(null); // Don't show error for no data
      } else if (err.response) {
        // Other API errors (500, 403, etc.)
        setError(`Error: ${err.response.status} - ${err.response.statusText}`);
        setResults([]);
      } else if (err.request) {
        // Request made but no response received
        setError('Failed to connect to server');
        setResults([]);
      } else {
        // Something else happened
        setError('Failed to fetch data');
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = stableSort(results, getComparator(order, orderBy));
  const paginatedResults = isDialog
    ? sortedResults
    : sortedResults.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const notFound = !loading && !error && results.length === 0;

  // Icon handlers
  const handleCopyClick = (row) => alert('Copy clicked for ' + row.poNo);
  const handleStatusClick = (row) => alert('Status clicked for ' + row.poNo);
  const handleWipClick = (row) => alert('WIP clicked for ' + row.poNo);

  // --- NEW: Handlers for Milestone, View, PDF (minimal safe stubs) ---
  const handleMilestoneClick = useCallback(
    (id) => {
      enqueueSnackbar(`Opening Milestone for PO ID: ${id}`, { variant: 'info' });
      if (onClose) onClose();
      navigate(`/dashboard/supply-chain/milestone/${id}`);
    },
    [enqueueSnackbar, navigate, onClose]
  );

  const handleViewOrder = useCallback(
    (id) => {
      enqueueSnackbar(`Viewing details for PO ID: ${id}`, { variant: 'success' });
      if (onClose) onClose();
      navigate(`/dashboard/supply-chain/view/${id}`);
    },
    [enqueueSnackbar, navigate, onClose]
  );

  // PDF click handler - navigates to PDF page
  const handlePdfClick = useCallback((id, type = 'pdf') => {
    if (type === 'pdf') {
      enqueueSnackbar(`Opening PDF document for PO ID: ${id}`, { variant: 'info' });
    } else if (type === 'ssPdf') {
      enqueueSnackbar(`Opening SS PDF document for PO ID: ${id}`, { variant: 'info' });
    }

    // Close dialog if open
    if (onClose) onClose();

    // Navigate to PDF page with ID in URL
    const pdfPath = type === 'ssPdf'
      ? `/dashboard/supply-chain/purchase-order-sspdf/${id}`
      : `/dashboard/supply-chain/purchase-order-pdf/${id}`;
    navigate(pdfPath, {
      state: { type } // optional type parameter
    });
  }, [enqueueSnackbar, navigate, onClose]);

  // Drag scrolling handlers
  const handleMouseDown = useCallback((e) => {
    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeft(tableContainerRef.current.scrollLeft);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <Container maxWidth={settings?.themeStretch ? false : 'xl'} sx={{ py: isDialog ? 0 : 2 }} disableGutters={isDialog}>
      {!isDialog && (
        <CustomBreadcrumbs
          heading="PO SEARCH ENGINE"
          links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'PO SEARCH ' }]}
          sx={{ mb: { xs: 2, md: 3 } }}
        />
      )}

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box
          sx={{
            p: isDialog ? 2 : 3,
            border: '1px solid #ddd',
            borderRadius: 1,
            background: '#fff',
            boxShadow: 1,
          }}
        >
          {/* <Typography
            variant="subtitle1"
            fontWeight="bold"
            gutterBottom
            sx={{ color: 'text.primary' }}
          >
            PO SEARCH ENGINE
          </Typography> */}

          {/* Filters Section */}
          {/* Filters Section */}
          <Box sx={{ mb: isDialog ? 1.5 : 3 }}>
            <Grid container spacing={isDialog ? 1 : 2} alignItems="center">
              {/* Field 1: Customer */}
              <Grid item xs={12} md={isDialog ? 6 : 6}>
                <TextField
                  select
                  label="All Customer"
                  fullWidth
                  size={isDialog ? "medium" : "medium"}
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  SelectProps={{
                    MenuProps: {
                      disablePortal: isDialog,
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Customers</MenuItem>
                  {customerOptions.map((c) => (
                    <MenuItem key={c.customerID} value={c.customerID}>
                      {c.customerName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Field 2: Vendor */}
              <Grid item xs={12} md={isDialog ? 6 : 6}>
                <TextField
                  select
                  label="All Vendor"
                  fullWidth
                  size={isDialog ? "medium" : "medium"}
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  SelectProps={{
                    MenuProps: {
                      disablePortal: isDialog,
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Vendor</MenuItem>
                  {vendorOptions.map((v) => (
                    <MenuItem key={v.supplierID} value={v.supplierID}>
                      {v.venderName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Field 3: Search By */}
              <Grid item xs={12} md={isDialog ? 6 : 6}>
                <TextField
                  select
                  label="Search By"
                  fullWidth
                  size={isDialog ? "medium" : "medium"}
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                >
                  <MenuItem value="PO No">PO No</MenuItem>
                  <MenuItem value="Date">Date</MenuItem>
                  <MenuItem value="Style">Style</MenuItem>
                </TextField>
              </Grid>

              {/* Field 4: Search term (PO, Style, or Date Range) */}
              {searchBy === 'PO No' && (
                <Grid item xs={12} md={isDialog ? 6 : 6}>
                  <TextField
                    label="PO No"
                    fullWidth
                    size={isDialog ? "medium" : "medium"}
                    value={poNo}
                    onChange={(e) => setPoNo(e.target.value)}
                  />
                </Grid>
              )}

              {searchBy === 'Style' && (
                <Grid item xs={12} md={isDialog ? 6 : 6}>
                  <TextField
                    label="Style No"
                    fullWidth
                    size={isDialog ? "small" : "medium"}
                    value={styleNo}
                    onChange={(e) => setStyleNo(e.target.value)}
                  />
                </Grid>
              )}

              {searchBy === 'Date' && (
                <Grid item xs={12} md={isDialog ? 6 : 6} display="flex" gap={1}>
                  <DatePicker
                    label="From"
                    value={fromDate}
                    onChange={(newValue) => setFromDate(newValue)}
                    slotProps={{ textField: { fullWidth: true, size: isDialog ? "small" : "medium" } }}
                  />
                  <DatePicker
                    label="To"
                    value={toDate}
                    onChange={(newValue) => setToDate(newValue)}
                    slotProps={{ textField: { fullWidth: true, size: isDialog ? "small" : "medium" } }}
                  />
                </Grid>
              )}

              <Grid item xs={12} display="flex" justifyContent={isDialog ? "stretch" : "flex-end"}>
                <Button
                  variant="contained"
                  fullWidth={isDialog}
                  sx={{ backgroundColor: '#5098d3ff', '&:hover': { backgroundColor: '#3283c5ff' } }}
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Table Section */}
          {searchTriggered &&
            (loading ? (
              <Box display="flex" justifyContent="center" mt={2}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error" align="center" mt={2}>
                {error}
              </Typography>
            ) : (
              <Card sx={{ mt: isDialog ? 1 : 3 }}>
                <TableContainer
                  ref={tableContainerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  sx={{
                    maxHeight: isDialog ? 'none' : 500,
                    overflowX: 'auto',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                  }}
                >
                  <Table stickyHeader size="small" sx={{ minWidth: 1800 }}>
                    <TableHead>
                      <TableRow>
                        {[
                          { id: 'poNo', label: 'PO No' },
                          { id: 'style', label: 'Style' },
                          { id: 'customer', label: 'Customer' },
                          { id: 'vendor', label: 'Supplier' },
                          { id: 'placementDate', label: 'Placement' },
                          { id: 'customershipdate', label: 'Cust Ship Date' },
                          { id: 'shipmentDate', label: 'Shipment' },
                          { id: 'etanjDate', label: 'ETA NJ' },
                          { id: 'etaWarehouseDate', label: 'ETA WH' },
                          { id: 'pdf', label: 'PDF' },
                          { id: 'milestone', label: 'Milestone' },
                          { id: 'view', label: 'View' },
                          { id: 'copy', label: 'Copy' },
                          { id: 'status', label: 'Status' },
                          { id: 'wip', label: 'WIP' },
                          { id: 'inspection', label: 'Inspection' },
                          { id: 'sizeSpecs', label: 'Size Specs' },
                        ].map((head) => (
                          <TableCell
                            key={head.id}
                            align="center"
                            sx={{ fontWeight: 'bold', fontSize: '0.75rem', px: 1 }}
                          >
                            <TableSortLabel
                              active={orderBy === head.id}
                              direction={orderBy === head.id ? order : 'asc'}
                              onClick={() => handleSort(head.id)}
                            >
                              {head.label}
                            </TableSortLabel>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {paginatedResults.length > 0 ? (
                        paginatedResults.map((row, index) => (
                          <TableRow key={index} hover>
                            <TableCell align="center">{row.poNo}</TableCell>
                            <TableCell align="center">{row.style}</TableCell>
                            <TableCell align="center">{row.customer}</TableCell>
                            <TableCell align="center">{row.vendor}</TableCell>
                            <TableCell align="center">{row.placementDate}</TableCell>
                            <TableCell align="center">{row.buyerExIndiaTolerance || '-'}</TableCell>
                            <TableCell align="center">{row.shipmentDate}</TableCell>
                            <TableCell align="center">{row.etanjDate}</TableCell>
                            <TableCell align="center">{row.etaWarehouseDate}</TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => handlePdfClick(row.poid, null)} sx={{ p: 0.5 }}>
                                <img src="/assets/icons/files/pdf.png" alt="PDF" width={16} height={16} />
                              </IconButton>
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
                                onClick={() => handleMilestoneClick(row.poid)}
                              >
                                Milestone
                              </span>
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
                                onClick={() => handleViewOrder(row.poid)}
                              >
                                View
                              </span>
                            </TableCell>

                            <TableCell align="center">
                              <IconButton size="small" onClick={() => handleCopyClick(row)}>
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => handleStatusClick(row)}>
                                <AssignmentTurnedInIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => handleWipClick(row)}>
                                <BuildIcon fontSize="small" />
                              </IconButton>
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
                              >
                                Inspection
                              </span>
                            </TableCell>

                            {/* Size Specs - Capsule Tag */}
                            <TableCell align="center">
                              <span
                                style={{
                                  backgroundColor: '#FDECEA', // Light red background
                                  color: '#D32F2F', // Red text
                                  border: '1px solid #D32F2F', // Red border
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
                                  e.target.style.backgroundColor = '#F9D6D5'; // Slightly darker on hover
                                  e.target.style.boxShadow = '0 0 6px rgba(211,47,47,0.4)'; // Red glow
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#FDECEA';
                                  e.target.style.boxShadow = 'none';
                                }}
                                onClick={() => handleViewOrder(row.id)}
                              >
                                Size Specs
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={17} align="left" sx={{ py: 3 }}>
                            {notFound ? 'No records found' : null}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {!isDialog && (
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={results.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                )}
              </Card>
            ))}
        </Box>
      </LocalizationProvider>
    </Container>
  );
}
