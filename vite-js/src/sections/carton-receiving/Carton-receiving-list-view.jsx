import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  TextField,
  Button,
  Typography,
  Container,
  Tooltip,
  Alert,
  Stack,
  IconButton,
  Chip,
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

function mapCartonReceivingRow(raw, index) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const receivingIdVal = pick(
    r,
    'receivingID',
    'ReceivingID',
    'cartonReceivingID',
    'CartonReceivingID',
    'lReceivingID',
    'id',
    'Id'
  );

  const containerLoadingIDVal = pick(
    r,
    'containerLoadingID',
    'ContainerLoadingID',
    'containerLoadingId',
    'lContainerLoadingID'
  );

  const id = receivingIdVal !== '' && receivingIdVal != null 
    ? String(receivingIdVal) 
    : (containerLoadingIDVal !== '' && containerLoadingIDVal != null ? String(containerLoadingIDVal) : `cr-${index}`);

  const receivingID = receivingIdVal !== '' && receivingIdVal != null ? String(receivingIdVal) : (containerLoadingIDVal !== '' && containerLoadingIDVal != null ? String(containerLoadingIDVal) : '');
  const containerLoadingID = containerLoadingIDVal !== '' && containerLoadingIDVal != null ? String(containerLoadingIDVal) : (receivingIdVal !== '' && receivingIdVal != null ? String(receivingIdVal) : '');

  return {
    id,
    _raw: r,
    receivingID,
    containerLoadingID,
    containerNo: String(pick(r, 'containerNo', 'ContainerNo', 'autoNo', 'AutoNo') || '—'),
    poNo: String(pick(r, 'poNo', 'PoNo', 'PONO', 'pono', 'poNumber', 'PONumber') || '—'),
    customer: String(pick(r, 'customer', 'Customer', 'customerName', 'CustomerName') || '—'),
    supplier: String(
      pick(r, 'supplier', 'Supplier', 'venderName', 'VenderName', 'vendorName', 'VendorName') || '—'
    ),
    bookingNo: String(pick(r, 'bookingNo', 'BookingNo') || '—'),
    loadingDate: String(pick(r, 'loadingDate', 'LoadingDate', 'date', 'Date') || '—'),
    totalLoadedCartons:
      r.totalLoadedCartons != null && r.totalLoadedCartons !== ''
        ? String(r.totalLoadedCartons)
        : r.TotalLoadedCartons != null && r.TotalLoadedCartons !== ''
        ? String(r.TotalLoadedCartons)
        : '0',
    totalReceivedCartons:
      r.totalReceivedCartons != null && r.totalReceivedCartons !== ''
        ? String(r.totalReceivedCartons)
        : r.TotalReceivedCartons != null && r.TotalReceivedCartons !== ''
        ? String(r.TotalReceivedCartons)
        : '0',
    status: String(pick(r, 'status', 'Status') || 'Pending'),
  };
}

function NoRowsOverlay() {
  return (
    <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        No carton receiving records found
      </Typography>
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function CartonReceivingListView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const [poSearch, setPoSearch] = useState('');
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const gridContainerRef = useDragScroll({ scrollableSelector: '.MuiDataGrid-virtualScroller' });

  // Fetch data from GET /api/Container/GetCartonReceivingGrid
  const fetchData = useCallback(async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = {};

      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      if (trimmedQuery) {
        params.poNo = trimmedQuery;
      }

      const response = await axiosInstance.get('/api/Container/GetCartonReceivingGrid', {
        ...(Object.keys(params).length > 0 ? { params } : {}),
      });
      const list = normalizeApiResponse(response?.data ?? response);
      const mapped = list.map((item, idx) => mapCartonReceivingRow(item, idx));
      setAllRows(mapped);
    } catch (err) {
      console.error('Error loading carton receiving grid from API:', err);
      const msg =
        (typeof err?.response?.data === 'string' && err.response.data) ||
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message ||
        'Failed to load carton receiving records';
      setError(typeof msg === 'string' ? msg : 'Failed to load carton receiving records');
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
    const raw = row._raw || row || {};
    const receivingID = row.receivingID || pick(raw, 'receivingID', 'ReceivingID', 'cartonReceivingID', 'CartonReceivingID', 'lReceivingID');
    const containerLoadingID = row.containerLoadingID || pick(raw, 'containerLoadingID', 'ContainerLoadingID', 'containerLoadingId', 'lContainerLoadingID');
    const containerNo = row.containerNo !== '—' ? row.containerNo : pick(raw, 'containerNo', 'ContainerNo', 'autoNo', 'AutoNo');

    const searchParams = new URLSearchParams();
    if (receivingID && !receivingID.startsWith('cr-')) {
      searchParams.set('lReceivingID', receivingID);
    }
    if (containerLoadingID && !containerLoadingID.startsWith('cr-')) {
      searchParams.set('lContainerLoadingID', containerLoadingID);
    }
    if (containerNo && containerNo !== '—') {
      searchParams.set('containerNo', containerNo);
    }

    const queryString = searchParams.toString();
    const targetUrl = queryString ? `${paths.dashboard.cartonReceivingScan}?${queryString}` : paths.dashboard.cartonReceivingScan;

    navigate(targetUrl, {
      state: {
        editId: receivingID || containerLoadingID,
        receivingID,
        containerLoadingID,
        containerNo,
        rowData: raw,
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        field: 'containerNo',
        headerName: 'Container No.',
        width: 140,
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
        field: 'poNo',
        headerName: 'PO #',
        flex: 2,
        minWidth: 260,
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
        field: 'customer',
        headerName: 'Customer',
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
        field: 'supplier',
        headerName: 'Supplier',
        width: 170,
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
        field: 'loadingDate',
        headerName: 'Loading Date',
        width: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box sx={{ width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>
            {params.value}
          </Box>
        ),
      },
      {
        field: 'totalLoadedCartons',
        headerName: 'Total Loaded Cartons',
        width: 160,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {params.value}
          </Box>
        ),
      },
      {
        field: 'totalReceivedCartons',
        headerName: 'Total Received Cartons',
        width: 170,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'primary.main',
            }}
          >
            {params.value}
          </Box>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
          const val = String(params.value || 'Pending');
          const isCompleted = val.toLowerCase().includes('complete') || val.toLowerCase().includes('received');
          return (
            <Chip
              size="small"
              label={val}
              color={isCompleted ? 'success' : 'default'}
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          );
        },
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
          <Tooltip title="Scan Carton (Packing List Receiving)" arrow>
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
        heading="Carton Receiving"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Carton Receiving', href: paths.dashboard.cartonReceiving },
          { name: 'List' },
        ]}
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter / Search Bar */}
      <Card
        sx={{
          p: 2,
          mb: 3,
          boxShadow: (theme) => theme.customShadows?.z1 || 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search by PO No."
              placeholder="e.g. PO-99201"
              value={poSearch}
              onChange={(e) => setPoSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{ textTransform: 'none', px: 2.5 }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<RefreshIcon />}
                onClick={handleClear}
                sx={{ textTransform: 'none', px: 2 }}
              >
                Reset
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* DataGrid View */}
      <Card
        sx={{
          boxShadow: (theme) => theme.customShadows?.z4 || 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        <Box ref={gridContainerRef} sx={{ width: '100%', height: 600 }}>
          <DataGrid
            rows={allRows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25, page: 0 },
              },
            }}
            disableRowSelectionOnClick
            rowHeight={48}
            slots={{
              noRowsOverlay: NoRowsOverlay,
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                fontWeight: 700,
                fontSize: '0.85rem',
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                py: 0.5,
              },
            }}
          />
        </Box>
      </Card>
    </Container>
  );
}
