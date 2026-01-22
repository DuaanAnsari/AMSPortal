import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  Button,
  Checkbox,
  IconButton,
  Tooltip,
  TextField,
  Container,
  Typography,
  Table,
  TableBody,
  TableContainer,
  TableRow,
  TableCell,
  Box,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'shipDate', label: 'Ship.Date', width: 150 },
  { id: 'invoiceNo', label: 'Invoice No', width: 120 },
  { id: 'value', label: 'Value', width: 100 },
  { id: 'billNo', label: 'Bill No', width: 90 },
  { id: 'customer', label: 'Customer', width: 130 },
  { id: 'ldp', label: 'LDP', width: 100 },
  { id: 'supplier', label: 'Supplier', width: 110 },
  { id: 'inspectionCertificate', label: 'Inspection Certificate', width: 130 },
  { id: 'invoice', label: 'Invoice', width: 70 },
  { id: 'invoiceExcel', label: 'Invoice Excel', width: 100 },
  { id: 'rateDiff', label: 'Rate Diff', width: 80 },
  { id: 'action', label: 'Action', width: 80 },
  { id: 'view', label: 'View', width: 60 },
  { id: 'status', label: 'Status', width: 70 },
];

const DEFAULT_FILTERS = {
  invoice: '',
  container: '',
  bill: '',
  customer: '',
  ldpInvoice: '',
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SHIPMENT_RELEASE_API = `${API_BASE_URL}/api/ShipmentRelease/ShipmentRelease`;
const CUSTOMER_API = `${API_BASE_URL}/api/MyOrders/GetCustomer`;

const FILTER_CARD_SX = {
  p: { xs: 2, md: 3 },
  mb: 3,
  borderRadius: 2,
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
  border: '1px solid',
  borderColor: '#e4ecf5',
  boxShadow: (theme) => `0 12px 30px rgba(15, 32, 99, 0.08)`,
};

const FILTER_HEADER_SX = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 2,
};

const SEARCH_FIELD_SX = {
  backgroundColor: '#fff',
  borderRadius: 1,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#d3dde8',
  },
};

const TABLE_CARD_SX = {
  borderRadius: 2,
  border: 'none',
  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.1)',
};

const TABLE_ROW_SX = {
  background: '#ffffff',
  '&:nth-of-type(odd)': {
    background: '#ffffff',
  },
  '&:hover': {
    background: '#ffffff',
  },
};

// ----------------------------------------------------------------------

export default function ShipmentReleaseFilters() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerFetchError, setCustomerFetchError] = useState('');
  const [customerLookupMessage, setCustomerLookupMessage] = useState('');
  const abortControllerRef = useRef(null);
  const customerControllerRef = useRef(null);
  const tableContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleMouseDown = (event) => {
    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setStartX(event.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeft(tableContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (event) => {
    if (!isDragging || !tableContainerRef.current) return;
    event.preventDefault();
    const x = event.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const normalizeParam = (value, fallback) => {
    if (typeof value !== 'string') {
      return fallback;
    }
    const trimmed = value.trim();
    return trimmed === '' ? fallback : trimmed;
  };

  const findCustomerId = (customerNameInput) => {
    if (!customerNameInput || customers.length === 0) {
      return '0';
    }
    const normalizedValue = customerNameInput.trim().toLowerCase();
    const exactMatch = customers.find(
      (item) => item.customerName?.toLowerCase() === normalizedValue
    );
    if (exactMatch) {
      return String(exactMatch.customerID);
    }
    const containsMatch = customers.find((item) =>
      item.customerName?.toLowerCase().includes(normalizedValue)
    );
    return containsMatch ? String(containsMatch.customerID) : '0';
  };

  const buildQueryParams = (values) => {
    const params = new URLSearchParams();
    params.set('invoiceNo', normalizeParam(values.invoice, 'ALL'));
    params.set('ContainerNo', normalizeParam(values.container, 'ALL'));
    params.set('BillNo', normalizeParam(values.bill, 'ALL'));
    params.set('LDPInvoiceNo', normalizeParam(values.ldpInvoice, 'ALL'));

    const customerNameInput = normalizeParam(values.customer, '');
    let lookupMessage = '';
    let resolvedCustomerId = '0';
    if (customerNameInput && customers.length > 0) {
      resolvedCustomerId = findCustomerId(customerNameInput);
      if (resolvedCustomerId === '0') {
        lookupMessage = 'Customer name not found; showing all records.';
      }
    }

    params.set('CustomerID', resolvedCustomerId);
    return { queryString: params.toString(), lookupMessage };
  };

  const mapShipmentRow = (item, index) => ({
    id: item.cargoID ?? `${item.invoiceNo ?? 'shipment'}-${index}`,
    shipDate: item.cargoDatee ?? '-',
    invoiceNo: item.invoiceNo ?? '-',
    value: item.valueNew ?? '-',
    billNo: item.billNo ?? '-',
    customer: item.customerName ?? item.customer ?? '-',
    ldp: item.ldpInvoiceNo ?? '-',
    supplier: item.supplier ?? '-',
    inspectionCertificate: 'Inspection Certificate',
    invoice: 'Print Invoice',
    invoiceExcel: 'Excel Invoice',
    rateDiff: 'Rate Diff',
    action: 'Action Diff',
    view: '☐',
    status: item.shipmentStatus ? 'Released' : 'Pending',
  });

  const fetchShipments = async (searchValues) => {
    setLoading(true);
    setFetchError('');
    const controller = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    try {
      const { queryString, lookupMessage } = buildQueryParams(searchValues);
      setCustomerLookupMessage(lookupMessage);
      const authHeaders = getAuthHeaders();
      if (!authHeaders) {
        throw new Error('Missing access token; login required.');
      }
      const response = await fetch(`${SHIPMENT_RELEASE_API}?${queryString}`, {
        signal: controller.signal,
        headers: {
          ...authHeaders,
        },
      });

      if (!response.ok) {
        throw new Error(`Shipment API returned ${response.status}`);
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : data ? [data] : [];
      const customerSearchTerm = normalizeParam(searchValues.customer, '');
      const filteredItems =
        customerSearchTerm && customerSearchTerm !== 'ALL'
          ? items.filter((item) => {
            const customerValue = (item.customerName ?? item.customer ?? '').toLowerCase();
            return customerValue.includes(customerSearchTerm.toLowerCase());
          })
          : items;
      setTableData(filteredItems.map((item, index) => mapShipmentRow(item, index)));
    } catch (error) {
      if (error.name !== 'AbortError') {
        setTableData([]);
        setFetchError(error.message || 'Unable to load shipment release data');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments(filters);
    return () => {
      abortControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = async () => {
    setCustomerLoading(true);
    setCustomerFetchError('');
    const controller = new AbortController();
    customerControllerRef.current?.abort();
    customerControllerRef.current = controller;

    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders) {
        throw new Error('Missing access token; login required.');
      }
      const response = await fetch(CUSTOMER_API, {
        signal: controller.signal,
        headers: {
          ...authHeaders,
        },
      });
      if (!response.ok) {
        throw new Error(`Customer API returned ${response.status}`);
      }

      const data = await response.json();
      const payload = Array.isArray(data) ? data : data ? [data] : [];
      setCustomers(payload);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setCustomerFetchError(error.message || 'Unable to load customers');
      }
    } finally {
      if (customerControllerRef.current === controller) {
        customerControllerRef.current = null;
      }
      setCustomerLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    return () => {
      customerControllerRef.current?.abort();
    };
  }, []);

  const handleSearch = async () => {
    if (filters.customer && customers.length === 0 && !customerLoading) {
      await fetchCustomers();
    }
    fetchShipments(filters);
  };

  const handleShowAll = () => {
    const defaults = { ...DEFAULT_FILTERS };
    setFilters(defaults);
    setCustomerLookupMessage('');
    fetchShipments(defaults);
  };

  const table = useTable();

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
  });

  const denseHeight = 30;

  const headerPaddingY = table.dense ? 1.5 : 2.75;
  const tableCellPadding = table.dense ? 0.5 : 1;
  const tableRowSx = {
    ...TABLE_ROW_SX,
    '& td': {
      py: tableCellPadding,
    },
  };

  const renderTruncatedCell = (value, maxWidth = 120) => (
    <Tooltip title={value || ''} placement="top">
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          maxWidth,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          verticalAlign: 'bottom',
        }}
      >
        {value || '-'}
      </Box>
    </Tooltip>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700, letterSpacing: 0.5 }}>
          SHIPMENT RELEASE
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dashboard
        </Typography>
      </Box>

      {/* FILTER FORM - Compact */}
      <Card sx={FILTER_CARD_SX}>
        <Box sx={FILTER_HEADER_SX}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Filter shipments
            </Typography>

          </Box>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              sx={SEARCH_FIELD_SX}
              label="Invoice No"
              fullWidth
              size="small"
              value={filters.invoice}
              onChange={(e) => handleChange('invoice', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              sx={SEARCH_FIELD_SX}
              label="Customer"
              fullWidth
              size="small"
              value={filters.customer}
              onChange={(e) => handleChange('customer', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              sx={SEARCH_FIELD_SX}
              label="Container No"
              fullWidth
              size="small"
              value={filters.container}
              onChange={(e) => handleChange('container', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              sx={SEARCH_FIELD_SX}
              label="Bill No"
              fullWidth
              size="small"
              value={filters.bill}
              onChange={(e) => handleChange('bill', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              sx={SEARCH_FIELD_SX}
              label="LDP Invoice No"
              fullWidth
              size="small"
              value={filters.ldpInvoice}
              onChange={(e) => handleChange('ldpInvoice', e.target.value)}
            />
          </Grid>

          {(customerLoading || customerFetchError || customerLookupMessage) && (
            <Grid item xs={12}>
              {customerLoading && (
                <Typography variant="body2" color="text.secondary">
                  Loading customer master data…
                </Typography>
              )}
              {customerFetchError && (
                <Typography variant="body2" color="error">
                  {customerFetchError}
                </Typography>
              )}
              {customerLookupMessage && (
                <Typography variant="body2" color="text.secondary">
                  {customerLookupMessage}
                </Typography>
              )}
            </Grid>
          )}

          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1.5,
                mt: { xs: 2, md: 1 },
              }}
            >
              <Button
                variant="contained"
                color="primary"
                size="small"
                sx={{
                  px: 3,
                  minWidth: 110,
                  height: 40,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 999,
                  boxShadow: '0 4px 10px rgba(15, 23, 42, 0.3)',
                  backgroundColor: '#171616',
                  '&:hover': {
                    backgroundColor: '#000000',
                  },
                }}
                onClick={handleSearch}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={handleShowAll}
                sx={{
                  px: 3,
                  minWidth: 100,
                  height: 40,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 999,
                  borderColor: '#171616',
                  color: '#171616',
                  backgroundColor: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: '#F3F4F6',
                    borderColor: '#000000',
                  },
                }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="small"
                sx={{
                  px: 3,
                  minWidth: 140,
                  height: 40,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 999,
                  boxShadow: '0 4px 10px rgba(15, 23, 42, 0.3)',
                  backgroundColor: '#171616',
                  '&:hover': {
                    backgroundColor: '#000000',
                  },
                }}
                onClick={() => navigate('/dashboard/supply-chain/shipment-release/add')}
              >
                Add Shipment
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* DATA TABLE */}
      <Card sx={TABLE_CARD_SX}>
        {loading ? (
          <Box
            sx={{
              minHeight: 320,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Loading shipment release data…
            </Typography>
          </Box>
        ) : (
          <>
            {fetchError && (
              <Box
                sx={{
                  px: 3,
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: '#e0e6f0',
                  backgroundColor: '#f5fefb',
                }}
              >
                <Typography variant="body2" color="error">
                  {fetchError}
                </Typography>
              </Box>
            )}
            <TableContainer
              ref={tableContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              sx={{
                maxHeight: 540,
                backgroundColor: '#ffffff',
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 1400,
                  '& td, & th': {
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    padding: '4px 6px',
                    border: '0.5px solid #e0e0e0',
                    lineHeight: 1.2,
                    py: tableCellPadding,
                    textAlign: 'center',
                  },
                  '& th': {
                    fontWeight: 600,
                    backgroundColor: '#eeeeee',
                    color: '#000000',
                    fontSize: '0.75rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    borderBottom: 'none',
                    textTransform: 'uppercase',
                    py: headerPaddingY,
                    textAlign: 'center',
                  },
                }}
              >
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <TableRow hover key={row.id} sx={tableRowSx}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{row.shipDate}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {renderTruncatedCell(row.invoiceNo, 130)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{row.value}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{row.billNo}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {renderTruncatedCell(row.customer, 140)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {renderTruncatedCell(row.ldp, 110)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {renderTruncatedCell(row.supplier, 120)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              minWidth: 50,
                              fontSize: '0.7rem',
                              py: 0.3,
                              px: 1,
                            }}
                            onClick={() =>
                              navigate(
                                `/dashboard/supply-chain/inspection-certificate/${row.id}`,
                                { state: { shipment: row } }
                              )
                            }
                          >
                            Inspection Certificate
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              minWidth: 50,
                              fontSize: '0.7rem',
                              py: 0.3,
                              px: 1,
                            }}
                            onClick={() =>
                              navigate(
                                `/dashboard/supply-chain/print-invoice/${row.id}`,
                                { state: { shipment: row } }
                              )
                            }
                          >
                            Print Invoice
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              minWidth: 50,
                              fontSize: '0.7rem',
                              py: 0.3,
                              px: 1,
                            }}
                          >
                            Excel Invoice
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              minWidth: 50,
                              fontSize: '0.7rem',
                              py: 0.3,
                              px: 1,
                            }}
                          >
                            Rate Diff
                          </Button>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            sx={{ p: 0.5 }}
                            aria-label="Delete"
                          >
                            <Iconify icon="mdi:delete-outline" color="#000000" width={20} height={20} />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              minWidth: 50,
                              fontSize: '0.7rem',
                              py: 0.3,
                              px: 1,
                            }}
                            onClick={() => navigate(`/dashboard/supply-chain/shipment/${row.id}/edit`)}
                          >
                            View
                          </Button>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          <Checkbox size="small" checked={row.status === 'Released'} />
                        </TableCell>
                      </TableRow>
                    ))}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  {!dataFiltered.length && <TableNoData notFound={!dataFiltered.length} />}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePaginationCustom
              count={dataFiltered.length}
              page={table.page}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              onRowsPerPageChange={table.onChangeRowsPerPage}
              dense={table.dense}
              onChangeDense={table.onChangeDense}
              rowsPerPageOptions={[5, 10, 25, 60]}
            />
          </>
        )}
      </Card>
    </Container>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator }) {
  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  return stabilizedThis.map((el) => el[0]);
}
