import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import BuildIcon from '@mui/icons-material/Build';
import { format } from 'date-fns';

export default function POSearchEngine() {
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

  // ✅ Fixed Search Function (final version)
  const handleSearch = async () => {
    setSearchTriggered(true);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let url = `${API_BASE_URL}/api/QuickSearch/LoadData?customerId=${buyer || 0}&vendorId=${
        vendor || 0
      }`;

      if (searchBy === 'PO No') {
        url += `&type=pono`;
        if (poNo.trim() !== '') url += `&pono=${poNo.trim()}`;
      }

      // ✅ Fixed STYLE filter
      else if (searchBy === 'Style') {
        if (!styleNo.trim()) {
          setResults([]);
          setLoading(false);
          return;
        }
        url += `&type=style&style=${encodeURIComponent(styleNo.trim())}`;
      }

      // ✅ Fixed DATE filter
      else if (searchBy === 'Date') {
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

      console.log('API URL:', url); // 👀 Debugging ke liye

      const res = await axios.get(url, { headers });
      setResults(Array.isArray(res.data) ? res.data : []);
      setPage(0);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = stableSort(results, getComparator(order, orderBy));
  const paginatedResults = sortedResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const notFound = !loading && !error && results.length === 0;

  // Icon handlers
  const handleCopyClick = (row) => alert('Copy clicked for ' + row.poNo);
  const handleStatusClick = (row) => alert('Status clicked for ' + row.poNo);
  const handleWipClick = (row) => alert('WIP clicked for ' + row.poNo);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 1, background: '#fff' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          PO SEARCH ENGINE
        </Typography>

        {/* Filters Section */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="All Customer"
                fullWidth
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
              >
                <MenuItem value="">All Customers</MenuItem>
                {customerOptions.map((c) => (
                  <MenuItem key={c.customerID} value={c.customerID}>
                    {c.customerName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="All Vendor"
                fullWidth
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              >
                <MenuItem value="">All Vendor</MenuItem>
                {vendorOptions.map((v) => (
                  <MenuItem key={v.supplierID} value={v.supplierID}>
                    {v.venderName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Search By"
                fullWidth
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <MenuItem value="PO No">PO No</MenuItem>
                <MenuItem value="Date">Date</MenuItem>
                <MenuItem value="Style">Style</MenuItem>
              </TextField>
            </Grid>

            {searchBy === 'PO No' && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="PO No"
                  fullWidth
                  value={poNo}
                  onChange={(e) => setPoNo(e.target.value)}
                />
              </Grid>
            )}

            {searchBy === 'Style' && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="Style No"
                  fullWidth
                  value={styleNo}
                  onChange={(e) => setStyleNo(e.target.value)}
                />
              </Grid>
            )}

            {searchBy === 'Date' && (
              <>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="From Date"
                    value={fromDate}
                    onChange={(newValue) => setFromDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="To Date"
                    value={toDate}
                    onChange={(newValue) => setToDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                sx={{ backgroundColor: '#3b2c6d', '&:hover': { backgroundColor: '#2c2152' } }}
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
            <Card sx={{ mt: 3 }}>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
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
                        { id: 'etaNewJerseyDate', label: 'ETA NJ' },
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
                          <TableCell align="center">{row.etaNewJerseyDate}</TableCell>
                          <TableCell align="center">{row.etaWarehouseDate}</TableCell>
                          <TableCell align="center">
                            <IconButton size="small">
                              <img
                                src="/assets/icons/files/ic_pdf.svg"
                                alt="PDF"
                                width={16}
                                height={16}
                              />
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ minWidth: 50, fontSize: '0.7rem', py: 0.3, px: 1 }}
                            >
                              Milestone
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ minWidth: 50, fontSize: '0.7rem', py: 0.3, px: 1 }}
                            >
                              View
                            </Button>
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
                          <TableCell>
                            <img
                              src="/assets/icons/files/inspection1.png"
                              alt="Inspection"
                              width={17}
                              height={17}
                              style={{ display: 'block', margin: '13px auto 0' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="medium"
                              variant="outlined"
                              sx={{ minWidth: 70, fontSize: '0.7rem', py: 0.3, px: 1 }}
                            >
                              Size Specs
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={17} align="center" sx={{ py: 3 }}>
                          {notFound ? 'No records found' : null}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={results.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Card>
          ))}
      </Box>
    </LocalizationProvider>
  );
}
