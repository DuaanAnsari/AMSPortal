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
  IconButton,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate, useLocation } from 'react-router-dom';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import { paths } from 'src/routes/paths';
import axiosInstance from 'src/utils/axios';
import { useDragScroll } from 'src/hooks/use-drag-scroll';

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
    containerNo: String(pick(r, 'containerNo', 'ContainerNo', 'autoNo', 'AutoNo') || '—'),
    userName: String(pick(r, 'userName', 'UserName', 'merchandiser', 'Merchandiser') || '—'),
    venderName: String(pick(r, 'venderName', 'VenderName', 'vendorName', 'VendorName', 'supplier', 'Supplier') || '—'),
    bookingNo: String(pick(r, 'bookingNo', 'BookingNo') || '—'),
    pono: String(pick(r, 'pono', 'PONO', 'poNo', 'PoNo', 'poNumber', 'PONumber') || '—'),
    planQtyLoad: r.planQtyLoad != null && r.planQtyLoad !== '' ? String(r.planQtyLoad) : '0',
    loadingDate: String(pick(r, 'loadingDate', 'LoadingDate') || '—'),
    cbm: r.cbm != null && r.cbm !== '' ? String(r.cbm) : '0',
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

// ----------------------------------------------------------------------

export default function ContainerLoadingListView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const [poSearch, setPoSearch] = useState('');
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const gridContainerRef = useDragScroll({ scrollableSelector: '.MuiDataGrid-virtualScroller' });

  // Fetch data from API (/api/Container/GetContainerLoadingGrid) with optional poNo parameter
  const fetchData = useCallback(async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      if (trimmedQuery) {
        params.poNo = trimmedQuery;
      }

      const response = await axiosInstance.get('/api/Container/GetContainerLoadingGrid', { params });
      const list = normalizeApiResponse(response?.data ?? response);
      const mapped = list.map((item, idx) => mapContainerLoadingRow(item, idx));
      setAllRows(mapped);
    } catch (err) {
      console.error('Error loading container loading grid from API:', err);
      const msg =
        (typeof err?.response?.data === 'string' && err.response.data) ||
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message ||
        'Failed to load container loading records';
      setError(typeof msg === 'string' ? msg : 'Failed to load container loading records');
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, location.state]);

  const handleSearch = () => {
    fetchData(poSearch);
  };

  const handleClear = () => {
    setPoSearch('');
    fetchData('');
  };

  const handleCartonScan = (row) => {
    const id = row.containerLoadingID || row.id;
    navigate(`${paths.dashboard.containerLoadingCartonScan}?lContainerLoadingID=${id}`, {
      state: { editId: id, rowData: row._raw || row },
    });
  };

  const columns = useMemo(
    () => [
      {
        field: 'containerNo',
        headerName: 'Container No.',
        width: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            {params.value}
          </Box>
        ),
      },
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
        field: 'cartonScan',
        headerName: 'Carton Scan',
        width: 110,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Scan Carton (Packing List)" arrow>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleCartonScan(params.row)}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                },
              }}
            >
              <QrCodeScannerIcon fontSize="small" />
            </IconButton>
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
        heading="Container Loading View"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Container Loading', href: paths.dashboard.containerLoading },
          { name: 'List' },
        ]}
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
              label="PO #"
              value={poSearch}
              onChange={(e) => setPoSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="Search by PO #..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Stack direction="row" spacing={1.5} alignItems="center">
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
                  disabled={loading}
                  sx={{ textTransform: 'none' }}
                >
                  Clear
                </Button>
              )}
              <Tooltip title="Refresh Grid">
                <IconButton onClick={() => fetchData(poSearch)} disabled={loading} color="inherit">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
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
        <Box ref={gridContainerRef} sx={{ width: '100%', overflow: 'auto' }}>
          <Paper
            variant="outlined"
            sx={{
              border: 'none',
              borderRadius: 0,
              width: '100%',
            }}
          >
            <DataGrid
              rows={allRows}
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
