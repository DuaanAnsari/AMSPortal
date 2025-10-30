import { useState } from 'react';
import {
  Grid,
  Card,
  Button,
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
  { id: 'shipDate', label: 'Ship.Date', width: 90 },
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

// Updated data to match the image exactly
const SAMPLE_DATA = [
  {
    id: 1,
    shipDate: 'May 19, 2025',
    invoiceNo: 'MAFD-002-25-26',
    value: '5758.68 US$',
    billNo: 'SNSL5362',
    customer: 'THREADFAST APPAREL',
    ldp: 'AST-TFA 4740',
    supplier: 'MS Garments',
    inspectionCertificate: 'Inspection Certificate',
    invoice: 'Print Invoice',
    invoiceExcel: 'Excel Invoice',
    rateDiff: 'Rate Diff',
    action: 'Action Diff',
    view: '☐',
    status: '',
  },
  {
    id: 2,
    shipDate: 'May 19, 2025',
    invoiceNo: 'CA/545/AM/2025',
    value: '37116.00 US$',
    billNo: 'SNSL5363',
    customer: 'LONE ROCK',
    ldp: 'AST-LR 4739',
    supplier: 'Comfort apparel',
    inspectionCertificate: 'Inspection Certificate',
    invoice: 'Print Invoice',
    invoiceExcel: 'Excel Invoice',
    rateDiff: 'Rate Diff',
    action: 'Action Diff',
    view: '☐',
    status: '',
  },
  {
    id: 3,
    shipDate: 'May 19, 2025',
    invoiceNo: 'MS-097-HMB-2025',
    value: '33209.04 US$',
    billNo: 'SNSL5361',
    customer: 'LONE ROCK',
    ldp: 'AST-LR 4739',
    supplier: 'MS Garments',
    inspectionCertificate: 'Inspection Certificate',
    invoice: 'Print Invoice',
    invoiceExcel: 'Excel Invoice',
    rateDiff: 'Rate Diff',
    action: 'Action Diff',
    view: '☐',
    status: '',
  },
  {
    id: 4,
    shipDate: 'May 19, 2025',
    invoiceNo: 'MS-096-HMB-2025',
    value: '67045.92 US$',
    billNo: 'SNSL5360',
    customer: 'LONE ROCK',
    ldp: 'AST-LR 4738',
    supplier: 'MS Garments',
    inspectionCertificate: 'Inspection Certificate',
    invoice: 'Print Invoice',
    invoiceExcel: 'Excel Invoice',
    rateDiff: 'Rate Diff',
    action: 'Action Diff',
    view: '☐',
    status: '',
  },
  {
    id: 5,
    shipDate: 'May 08, 2025',
    invoiceNo: 'CA-653',
    value: '19645.20 US$',
    billNo: 'CNCKH17160',
    customer: 'ULTIMATE APPAREL, INC',
    ldp: 'AST-UL 4737',
    supplier: 'Continental apparels',
    inspectionCertificate: 'Inspection Certificate',
    invoice: 'Print Invoice',
    invoiceExcel: 'Excel Invoice',
    rateDiff: 'Rate Diff',
    action: 'Action Diff',
    view: '☐',
    status: '',
  },
];

// ----------------------------------------------------------------------

export default function ShipmentReleaseFilters() {
  const [filters, setFilters] = useState({
    invoice: '',
    container: '',
    bill: '',
    customer: '',
    ldpInvoice: '',
  });

  const handleChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // table logic
  const table = useTable();
  const [tableData] = useState(SAMPLE_DATA);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
  });

  const denseHeight = 30;

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', fontSize: '14px' }}>
        SHIPMENT RELEASE
      </Typography>

      {/* FILTER FORM - Compact */}
      <Card sx={{ p: 1.5, mb: 1.5, borderRadius: 1 }}>
        <Grid container spacing={1}>
          {/* Invoice No + Show All */}
          <Grid item xs={12}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  label="Invoice No"
                  fullWidth
                  size="small"
                  value={filters.invoice}
                  onChange={(e) => handleChange('invoice', e.target.value)}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ bgcolor: '#3a245d', px: 2, minWidth: 80, height: 40 }}
                >
                  Search
                </Button>
              </Grid>
              <Grid item sx={{ flexGrow: 1 }} />
              <Grid item>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ bgcolor: '#3a245d', px: 2, minWidth: 80, height: 40 }}
                >
                  Show All
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {/* Container No + Bill No */}
          <Grid item xs={12}>
            <Grid container spacing={1}>
              <Grid item xs={12} md={6}>
                <Grid container spacing={1}>
                  <Grid item xs>
                    <TextField
                      label="Container No"
                      fullWidth
                      size="small"
                      value={filters.container}
                      onChange={(e) => handleChange('container', e.target.value)}
                    />
                  </Grid>
                  <Grid item>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ bgcolor: '#3a245d', px: 2, minWidth: 80, height: 40 }}
                    >
                      Search
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Grid container spacing={1}>
                  <Grid item xs>
                    <TextField
                      label="Bill No"
                      fullWidth
                      size="small"
                      value={filters.bill}
                      onChange={(e) => handleChange('bill', e.target.value)}
                    />
                  </Grid>
                  <Grid item>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ bgcolor: '#3a245d', px: 2, minWidth: 80, height: 40 }}
                    >
                      Search
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Customer + LDP Invoice */}
          <Grid item xs={12}>
            <Grid container spacing={1}>
              <Grid item xs={12} md={6}>
                <Grid container spacing={1}>
                  <Grid item xs>
                    <TextField
                      label="Customer"
                      fullWidth
                      size="small"
                      value={filters.customer}
                      onChange={(e) => handleChange('customer', e.target.value)}
                    />
                  </Grid>
                  <Grid item>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ bgcolor: '#3a245d', px: 2, minWidth: 80, height: 40 }}
                    >
                      Search
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Grid container spacing={1}>
                  <Grid item xs>
                    <TextField
                      label="LDP Invoice No"
                      fullWidth
                      size="small"
                      value={filters.ldpInvoice}
                      onChange={(e) => handleChange('ldpInvoice', e.target.value)}
                    />
                  </Grid>
                  <Grid item>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ bgcolor: '#3a245d', px: 2, minWidth: 80, height: 40 }}
                    >
                      Search
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Add Shipment */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="contained"
                size="small"
                sx={{ bgcolor: '#3a245d', px: 3, minWidth: 120, height: 40 }}
              >
                Add Shipment
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* DATA TABLE - No Scrolling */}
      <Card sx={{ borderRadius: 1 }}>
        <TableContainer>
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
                py: 1,
              },
              '& th': {
                fontWeight: 'bold',
                backgroundColor: '#f8f8f8',
                fontSize: '0.75rem',
                position: 'sticky',
                top: 0,
                zIndex: 1,
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
              {dataFiltered.map((row) => (
                <TableRow
                  hover
                  key={row.id}
                  sx={{
                    '& td': { py: 1 },
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.shipDate}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.invoiceNo}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.value}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.billNo}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.customer}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.ldp}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.supplier}</TableCell>
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
                      Action Diff
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
                      View
                    </Button>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.status}</TableCell>
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
        />
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
