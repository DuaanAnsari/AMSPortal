import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import isEqual from 'lodash/isEqual';
import { useNavigate } from 'react-router-dom';

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
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import axios from 'src/utils/axios';
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
import { useSnackbar } from 'src/components/snackbar';

import UserTableFiltersResult from 'src/sections/Supply-Chain/user-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }];

const TABLE_HEAD = [
  { id: 'vendorCode', label: 'Vendor Code' },
  { id: 'shortName', label: 'Short Name', width: 180 },
  { id: 'name', label: 'Name', width: 260 },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'city', label: 'City', width: 160 },
  { id: 'certification', label: 'Certification', width: 180 },
  { id: 'edit', label: 'Edit', width: 88 },
  { id: 'select', label: 'Select', width: 88 },
];

const defaultFilters = {
  name: '',
  status: 'all',
  role: [],
};

// ----------------------------------------------------------------------

export default function OverviewAnalyticsPage() {
  const table = useTable({ defaultRowsPerPage: 10 });
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [tableData, setTableData] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Modal state for Update Capacity / Update Turnover
  const [actionModal, setActionModal] = useState({ open: false, type: '' });
  const [actionValue, setActionValue] = useState('');

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setFetchError('');

    try {
      const { data } = await axios.get('/api/MyOrders/GetVendors');
      const arr = Array.isArray(data) ? data : data ? [data] : [];

      const mapped = arr.map((item, index) => ({
        id: item?.venderCode ?? `${index}`,
        supplierId:
          item?.venderLibraryID ??
          item?.VenderLibraryID ??
          item?.vendorId ??
          item?.VendorId ??
          item?.venderCode ??
          `${index}`,
        vendorCode: item?.venderCode ?? '',
        shortName: item?.shortName ?? '',
        name: item?.venderName ?? '',
        status: item?.status ?? '',
        city: item?.city ?? '',
        certification: '',
      }));

      setTableData(mapped);
    } catch (err) {
      setFetchError(err?.message || 'Failed to fetch suppliers.');
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const denseHeight = table.dense ? 56 : 76;
  const canReset = !isEqual(defaultFilters, filters);
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

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

  // Handle dropdown action selection
  const handleActionSelect = useCallback(
    (actionType) => {
      if (!table.selected.length) {
        return; // No suppliers selected
      }
      setActionValue('');
      setActionModal({ open: true, type: actionType });
    },
    [table.selected]
  );

  const handleModalClose = useCallback(() => {
    setActionModal({ open: false, type: '' });
    setActionValue('');
  }, []);

  const handleModalUpdate = useCallback(async () => {
    const selectedRows = tableData.filter((row) => table.selected.includes(row.id));
    const venderIDs = selectedRows.map((row) => Number(row.supplierId));
    const typeStr = actionModal.type === 'Update Capacity' ? 'Capacity' : 'Turnover';

    try {
        // Build query string with repeated venderIDs and other parameters
        const params = new URLSearchParams();
        venderIDs.forEach((id) => params.append('venderIDs', id));
        params.append('type', typeStr);
        params.append('value', Number(actionValue));
        await axios.post(`/api/Vendor/update-grading?${params.toString()}`, null);


      enqueueSnackbar(`${actionModal.type} updated successfully!`, { variant: 'success' });
      handleModalClose();
      table.onSelectAllRows(false, []); // clear selection
      fetchSuppliers(); // refresh grid
    } catch (error) {
      console.error('Update grading error:', error);
      const errorMessage = error?.response?.data?.Message || error?.message || 'Failed to update grading.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  }, [
    tableData,
    table,
    actionModal.type,
    actionValue,
    handleModalClose,
    fetchSuppliers,
    enqueueSnackbar,
  ]);

  return (
    <>
      <Helmet>
        <title> Dashboard: Supplier</title>
      </Helmet>

      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Supplier List"
          links={[{ name: 'Dashboard' }, { name: 'Supplier' }]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {fetchError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {fetchError}
          </Alert>
        )}

        <Card>
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

          <SupplierTableToolbar
            filters={filters}
            onFilters={handleFilters}
            onAddSupplier={() => navigate('/dashboard/supplier/add')}
            onActionSelect={handleActionSelect}
            hasSelection={table.selected.length > 0}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              onResetFilters={handleResetFilters}
              results={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

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
                        <SupplierTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onEditRow={() =>
                            navigate(`/dashboard/supplier/${encodeURIComponent(row.supplierId)}/edit`, {
                              state: { supplier: row },
                            })
                          }
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

        {/* Update Capacity / Turnover Modal */}
        <Dialog
          open={actionModal.open}
          onClose={handleModalClose}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{actionModal.type}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
              {table.selected.length} supplier(s) selected
            </Typography>
            <TextField
              autoFocus
              fullWidth
              type="number"
              label={actionModal.type === 'Update Capacity' ? 'Capacity' : 'Turnover'}
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              placeholder="Enter value"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleModalUpdate}
              disabled={!actionValue}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

function SupplierTableToolbar({ filters, onFilters, onAddSupplier, onActionSelect, hasSelection }) {
  const [selectAction, setSelectAction] = useState('');

  const handleFilterName = useCallback(
    (event) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleActionChange = useCallback(
    (event) => {
      const val = event.target.value;
      setSelectAction(val);
      if (val) {
        onActionSelect(val);
        // Reset dropdown back to placeholder after triggering action
        setTimeout(() => setSelectAction(''), 0);
      }
    },
    [onActionSelect]
  );

  return (
    <Stack
      spacing={2}
      alignItems="center"
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5 }}
    >
      <TextField
        fullWidth
        value={filters.name}
        onChange={handleFilterName}
        placeholder="Search..."
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        select
        value={selectAction}
        onChange={handleActionChange}
        sx={{ minWidth: 180, flexShrink: 0 }}
        size="small"
        SelectProps={{
          displayEmpty: true,
          renderValue: (selected) => {
            if (!selected) {
              return <span style={{ color: '#9e9e9e' }}>Select Action</span>;
            }
            return selected;
          },
        }}
      >
        <MenuItem value="Update Capacity">Update Capacity</MenuItem>
        <MenuItem value="Update Turnover">Update Turnover</MenuItem>
      </TextField>

      <Button
        variant="contained"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={onAddSupplier}
        sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        Add Supplier
      </Button>
    </Stack>
  );
}

function SupplierTableRow({ row, selected, onEditRow, onSelectRow }) {
  return (
    <TableRow hover selected={selected}>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.vendorCode}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.shortName}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.name}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.status}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.city}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <TextField size="small" />
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Button variant="text" size="small" onClick={onEditRow}>
          Edit
        </Button>
      </TableCell>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>
    </TableRow>
  );
}

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
    inputData = inputData.filter(
      (row) =>
        String(row.name ?? '')
          .toLowerCase()
          .includes(searchTerm) ||
        String(row.vendorCode ?? '')
          .toLowerCase()
          .includes(searchTerm)
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((row) => String(row.status ?? '').toLowerCase() === status);
  }

  return inputData;
}
