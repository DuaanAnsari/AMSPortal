import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  Paper,
  Grid,
  TextField,
  Button,
  Typography,
  Container,
  Tooltip,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate, useLocation } from 'react-router-dom';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import { paths } from 'src/routes/paths';
import axiosInstance from 'src/utils/axios';

// ----------------------------------------------------------------------

function pick(r, ...keys) {
  for (const k of keys) {
    if (r[k] != null && r[k] !== '') return r[k];
  }
  return '';
}

function normalizeApiResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.Data)) return data.Data;
  if (data && Array.isArray(data.result)) return data.result;
  if (data && Array.isArray(data.Result)) return data.Result;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.Items)) return data.Items;
  return [];
}

function mapContainerLoadingRow(raw, index) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const idVal = pick(r, 'containerLoadingID', 'ContainerLoadingID', 'containerLoadingId', 'id', 'Id');
  const id = idVal !== '' && idVal != null ? String(idVal) : `cl-${index}`;

  return {
    id,
    _raw: r,
    containerLoadingID: id,
    userName: String(pick(r, 'userName', 'UserName', 'merchandiser', 'Merchandiser') || '—'),
    venderName: String(pick(r, 'venderName', 'VenderName', 'vendorName', 'VendorName', 'supplier', 'Supplier') || '—'),
    bookingNo: String(pick(r, 'bookingNo', 'BookingNo') || '—'),
    pono: String(pick(r, 'pono', 'PONO', 'poNo', 'PoNo', 'poNumber', 'PONumber') || '—'),
    planQtyLoad: String(pick(r, 'planQtyLoad', 'PlanQtyLoad') || '0'),
    loadingDate: String(pick(r, 'loadingDate', 'LoadingDate') || '—'),
    cbm: String(pick(r, 'cbm', 'CBM') || '0'),
    loadingDestination: String(pick(r, 'loadingDestination', 'LoadingDestination', 'destination', 'Destination') || '—'),
  };
}

function NoRowsOverlay() {
  return (
    <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        No container loading records found
      </Typography>
    </Box>
  );
}

// Default records for New Container Loading list view
const DEFAULT_MOCK_ROWS = [
  {
    id: '45',
    containerLoadingID: '45',
    userName: 'Owais Khan',
    venderName: 'Artistic Milliners (Pvt) Ltd',
    bookingNo: 'BK-99201',
    pono: 'PO-2024-9871, PO-2024-9872',
    planQtyLoad: '12,500',
    loadingDate: '2024-03-15',
    cbm: '68.5',
    loadingDestination: 'New York (JFK / NY)',
  },
  {
    id: '44',
    containerLoadingID: '44',
    userName: 'Kashif Ali',
    venderName: 'Crescent Bahuman Limited',
    bookingNo: 'BK-99180',
    pono: 'PO-2024-9760',
    planQtyLoad: '8,400',
    loadingDate: '2024-03-12',
    cbm: '45.0',
    loadingDestination: 'Los Angeles (LAX)',
  },
  {
    id: '43',
    containerLoadingID: '43',
    userName: 'Zeeshan Ahmed',
    venderName: 'US Apparel & Textiles',
    bookingNo: 'BK-98920',
    pono: 'PO-2024-9655, PO-2024-9658',
    planQtyLoad: '15,200',
    loadingDate: '2024-03-10',
    cbm: '72.0',
    loadingDestination: 'Hamburg Port',
  },
  {
    id: '42',
    containerLoadingID: '42',
    userName: 'Muhammad Tariq',
    venderName: 'Interloop Limited',
    bookingNo: 'BK-98845',
    pono: 'PO-2024-9540',
    planQtyLoad: '9,800',
    loadingDate: '2024-03-05',
    cbm: '52.4',
    loadingDestination: 'Rotterdam Port',
  },
  {
    id: '41',
    containerLoadingID: '41',
    userName: 'Farhan Siddiqui',
    venderName: 'Naveena Denim Mills',
    bookingNo: 'BK-98710',
    pono: 'PO-2024-9430',
    planQtyLoad: '11,100',
    loadingDate: '2024-02-28',
    cbm: '60.2',
    loadingDestination: 'Savannah Port',
  },
  {
    id: '40',
    containerLoadingID: '40',
    userName: 'Owais Khan',
    venderName: 'Artistic Milliners (Pvt) Ltd',
    bookingNo: 'BK-98650',
    pono: 'PO-2024-9310',
    planQtyLoad: '7,500',
    loadingDate: '2024-02-22',
    cbm: '38.0',
    loadingDestination: 'Southampton Port',
  },
];

function getStoredOrMockRows() {
  try {
    const stored = localStorage.getItem('mock_container_loading_records');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => mapContainerLoadingRow(item, idx));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_MOCK_ROWS;
}

export default function NewContainerLoadingListView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const [poSearch, setPoSearch] = useState('');
  const [allRows, setAllRows] = useState(() => getStoredOrMockRows());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim() !== '') {
        params.poNo = searchQuery.trim();
      }
      const response = await axiosInstance.get('/api/Container/GetContainerLoadingGrid', { params });
      const list = normalizeApiResponse(response?.data ?? response);
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((item, idx) => mapContainerLoadingRow(item, idx));
        setAllRows(mapped);
      } else {
        // If API returns empty array, check if search was performed or fallback to stored/mock
        setAllRows(list.map((item, idx) => mapContainerLoadingRow(item, idx)));
      }
    } catch (err) {
      console.error('Error loading container loading grid from API:', err);
      const msg =
        (typeof err?.response?.data === 'string' && err.response.data) ||
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message;
      if (msg) setError(typeof msg === 'string' ? msg : 'Failed to load container loading records');
      const rows = getStoredOrMockRows();
      setAllRows(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(poSearch);
  }, [fetchData, location.state]);

  const handleSearch = () => {
    fetchData(poSearch);
  };

  const handleClear = () => {
    setPoSearch('');
    fetchData('');
  };

  const handleAdd = () => {
    navigate(paths.dashboard.containerLoadingAdd);
  };

  const handleEdit = (row) => {
    const id = row.containerLoadingID || row.id;
    navigate(`${paths.dashboard.containerLoadingEdit}?lContainerLoadingID=${id}`, {
      state: { editId: id, rowData: row._raw || row },
    });
  };

  const displayedRows = useMemo(() => {
    if (!poSearch.trim()) return allRows;
    const q = poSearch.trim().toLowerCase();
    return allRows.filter(
      (r) =>
        String(r.pono || '').toLowerCase().includes(q) ||
        String(r.bookingNo || '').toLowerCase().includes(q) ||
        String(r.venderName || '').toLowerCase().includes(q) ||
        String(r.userName || '').toLowerCase().includes(q)
    );
  }, [allRows, poSearch]);

  const columns = useMemo(
    () => [
      {
        field: 'userName',
        headerName: 'Merchandiser',
        width: 140,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.3,
              fontSize: '0.85rem',
            }}
          >
            {params.value}
          </Box>
        ),
      },
      {
        field: 'venderName',
        headerName: 'Supplier',
        width: 180,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.3,
              fontSize: '0.85rem',
            }}
          >
            {params.value}
          </Box>
        ),
      },
      {
        field: 'bookingNo',
        headerName: 'Booking No.',
        width: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.3,
              fontSize: '0.85rem',
            }}
          >
            {params.value}
          </Box>
        ),
      },
      {
        field: 'pono',
        headerName: 'PO #',
        flex: 3,
        minWidth: 450,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
          const val = String(params.value || '');
          if (!val || val === '—') {
            return (
              <Box sx={{ width: '100%', textAlign: 'center', color: 'text.secondary', fontSize: '0.75rem' }}>
                —
              </Box>
            );
          }
          return (
            <Box
              sx={{
                width: '100%',
                px: 1,
                py: 0.35,
                textAlign: 'center',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: 1.25,
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              {val}
            </Box>
          );
        },
      },
      {
        field: 'planQtyLoad',
        headerName: 'Plan Quantity Load',
        width: 150,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            {params.value}
          </Box>
        ),
      },
      {
        field: 'loadingDate',
        headerName: 'Loading Date',
        width: 120,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box sx={{ width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>
            {params.value}
          </Box>
        ),
      },
      {
        field: 'cbm',
        headerName: 'CBM',
        width: 100,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box sx={{ width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>
            {params.value}
          </Box>
        ),
      },
      {
        field: 'loadingDestination',
        headerName: 'Load Destination',
        width: 160,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.3,
              fontSize: '0.85rem',
            }}
          >
            {params.value}
          </Box>
        ),
      },
      {
        field: 'edit',
        headerName: 'Edit',
        width: 90,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Edit Container Loading" arrow>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 68, px: 1 }}
              onClick={() => handleEdit(params.row)}
            >
              Edit
            </Button>
          </Tooltip>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="New Container Loading"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'New Container Loading', href: paths.dashboard.newContainerLoading },
          { name: 'List' },
        ]}
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ textTransform: 'none', fontWeight: 600, px: 2.5 }}
          >
            Add Container Loading
          </Button>
        }
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter Toolbar matching legacy AMS PO search */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="PO # / Booking / Supplier"
              value={poSearch}
              onChange={(e) => setPoSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="Search by PO #, booking or supplier..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
                sx={{ textTransform: 'none', px: 2.5 }}
              >
                Search
              </Button>
              {poSearch && (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleClear}
                  sx={{ textTransform: 'none' }}
                >
                  Clear
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* DataGrid */}
      <Card variant="outlined" sx={{ borderRadius: 1, boxShadow: 'none', position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (t) => alpha(t.palette.background.paper, 0.72),
              zIndex: 2,
              borderRadius: 1,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}
        <Box sx={{ width: '100%', overflow: 'auto' }}>
          <Paper
            variant="outlined"
            sx={{
              border: 'none',
              borderRadius: 0,
              width: '100%',
            }}
          >
            <DataGrid
              rows={displayedRows}
              columns={columns}
              autoHeight
              getRowHeight={() => 'auto'}
              headerHeight={48}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
              slots={{
                noRowsOverlay: NoRowsOverlay,
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                  borderRadius: 0,
                  fontWeight: 700,
                },
                '& .MuiDataGrid-cell': {
                  borderColor: (t) => alpha(t.palette.grey[500], 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 1,
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                },
              }}
            />
          </Paper>
        </Box>
      </Card>
    </Container>
  );
}
