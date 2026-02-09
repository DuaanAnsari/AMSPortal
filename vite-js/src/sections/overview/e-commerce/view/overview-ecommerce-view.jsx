import { useEffect, useState, useCallback } from 'react';
import isEqual from 'lodash/isEqual';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { alpha } from '@mui/material/styles';

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
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import Scrollbar from 'src/components/scrollbar';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import UserTableRow from 'src/sections/Supply-Chain/user-table-row';
import UserTableToolbar from 'src/sections/Supply-Chain/user-table-toolbar';
import UserTableFiltersResult from 'src/sections/Supply-Chain/user-table-filters-result';

// ----------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }];

const TABLE_HEAD = [
  { id: 'name', label: 'Name' },
  { id: 'phoneNumber', label: 'Phone Number', width: 180 },
  { id: 'company', label: 'Company', width: 220 },
  { id: 'role', label: 'Role', width: 180 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 88 },
];

const defaultFilters = {
  name: '',
  status: 'all',
  role: [],
};

// ----------------------------------------------------------------------

export default function OverviewEcommerceView() {
  const { enqueueSnackbar } = useSnackbar();
  const table = useTable({ defaultRowsPerPage: 10 });
  const settings = useSettingsContext();

  const [tableData, setTableData] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const fetchCustomers = useCallback(async () => {
    if (!API_BASE_URL) {
      setFetchError('Missing API base url (VITE_API_BASE_URL).');
      return;
    }
    setLoading(true);
    setFetchError('');
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Missing access token; login required.');
      }

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
      const arr = Array.isArray(data) ? data : data ? [data] : [];
      const mapped = arr.map((item, index) => ({
        id: item?.customerID ?? item?.customerId ?? item?.id ?? `${index}`,
        name: item?.customerName ?? item?.customer ?? item?.name ?? '',
        email: item?.email ?? '',
        phoneNumber: item?.phoneNumber ?? item?.phone ?? item?.mobile ?? item?.contactNo ?? '',
        company:
          item?.company ??
          item?.companyName ??
          item?.customerCompany ??
          item?.customerName ??
          item?.customer ??
          '',
        role: item?.role ?? item?.userRole ?? 'Customer',
        status: (item?.status ?? item?.customerStatus ?? 'active') || 'active',
        avatarUrl: item?.avatarUrl ?? '',
      }));

      setTableData(mapped);
    } catch (err) {
      console.error('❌ Error fetching customers:', err);
      setFetchError(err?.message || 'Failed to fetch customers.');
      setTableData([]);
      enqueueSnackbar('Failed to fetch customers', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  // ----------------------------------------------------------------------

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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

  // ----------------------------------------------------------------------

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Customers List"
          links={[{ name: 'Dashboard' }, { name: 'Customers' }]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {fetchError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {fetchError}
          </Alert>
        )}

        <Card>
          {/* Tabs */}
          <Tabs
            value={filters.status}
            onChange={(event, newValue) => handleFilters('status', newValue)}
            sx={{
              px: 2.5,
              boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
            }}
          >
            {STATUS_OPTIONS.map((tabItem) => (
              <Tab
                key={tabItem.value}
                value={tabItem.value}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>{tabItem.label}</span>
                    <Label
                      variant={
                        tabItem.value === 'all' || tabItem.value === filters.status ? 'filled' : 'soft'
                      }
                      color="default"
                    >
                      {tableData.length}
                    </Label>
                  </Stack>
                }
              />
            ))}
          </Tabs>

          <UserTableToolbar filters={filters} onFilters={handleFilters} />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              onResetFilters={handleResetFilters}
              results={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          {/* Table */}
          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary">
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={TABLE_HEAD.length} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={22} sx={{ mr: 1 }} />
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : (
                    dataFiltered
                      .slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row) => (
                        <UserTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onEditRow={() => {}}
                          onDeleteRow={() => {}}
                        />
                      ))
                  )}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
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
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  const { name, status } = filters;
  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    const searchTerm = name.toLowerCase();
    inputData = inputData.filter((row) =>
      String(row.name ?? '')
        .toLowerCase()
        .includes(searchTerm)
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((row) => String(row.status ?? '').toLowerCase() === status);
  }

  return inputData;
}
