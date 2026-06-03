import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Typography,
  Container,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate, useLocation } from 'react-router-dom';
import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import ConfirmDialog from 'src/components/custom-dialog/confirm-dialog';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

// ----------------------------------------------------------------------

function pick(r, ...keys) {
  for (const k of keys) {
    if (r[k] != null && r[k] !== '') return r[k];
  }
  return '';
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.Data)) return data.Data;
  if (data && Array.isArray(data.result)) return data.result;
  if (data && Array.isArray(data.Result)) return data.Result;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.Items)) return data.Items;
  return [];
}

function mapConsigneeRow(raw, index) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const idVal = pick(r, 'id', 'Id', 'consigneeId', 'ConsigneeID', 'consigneeID');
  const id = idVal !== '' && idVal != null ? String(idVal) : `row-${index}`;
  return {
    id,
    _raw: r,
    packageName: String(pick(r, 'consigneeName', 'ConsigneeName') || '—'),
    consigneeName: String(pick(r, 'packageName', 'PackageName') || '—'),
    address: String(pick(r, 'address', 'Address') || '—'),
    phone: String(pick(r, 'phone', 'Phone', 'phon', 'Phon') || '—'),
  };
}

function apiErrorMessage(error, fallback) {
  if (error?.code === 'ECONNABORTED' || String(error?.message || '').toLowerCase().includes('timeout')) {
    return 'Request timed out. Check your API URL (e.g. VITE_API_BASE_URL) and network.';
  }
  const msg =
    (typeof error?.response?.data === 'string' && error.response.data) ||
    error?.response?.data?.message ||
    error?.response?.data?.Message ||
    error?.message ||
    fallback;
  return typeof msg === 'string' ? msg : fallback;
}

function NoRowsOverlay() {
  return (
    <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        No data found
      </Typography>
    </Box>
  );
}

// ----------------------------------------------------------------------

function consigneeIdFromRow(row) {
  const raw = row?._raw ?? row;
  if (!raw || typeof raw !== 'object') return '';
  const v = pick(raw, 'consigneeID', 'ConsigneeID', 'consigneeId', 'ConsigneeId', 'id', 'Id');
  return v !== '' && v != null ? String(v).trim() : '';
}

export default function ConsigneeViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const [draftFilters, setDraftFilters] = useState({
    packageName: '',
    consigneeName: '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    packageName: '',
    consigneeName: '',
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  /** Ensures loading clears when the latest request settles (avoids Strict Mode / overlapping fetch bugs). */
  const fetchGenRef = useRef(0);

  const filterPackage = appliedFilters.packageName;
  const filterConsignee = appliedFilters.consigneeName;

  useEffect(() => {
    const gen = ++fetchGenRef.current;
    let aborted = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await qdApi.getConsigneeView({
          packageName: filterConsignee,
          consigneeName: filterPackage,
        });
        if (aborted || gen !== fetchGenRef.current) return;
        const list = normalizeListResponse(data);
        setRows(list.map((row, i) => mapConsigneeRow(row, i)));
      } catch (e) {
        if (aborted || gen !== fetchGenRef.current) return;
        const msg = apiErrorMessage(e, 'Failed to load consignees');
        setError(msg);
        setRows([]);
      } finally {
        if (!aborted && gen === fetchGenRef.current) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      aborted = true;
    };
  }, [filterPackage, filterConsignee, refreshToken]);

  const refreshList = useCallback(() => {
    setRefreshToken((t) => t + 1);
  }, []);

  const refreshFromSave = Boolean(location.state?.refreshConsigneeList);

  useEffect(() => {
    if (!refreshFromSave) return;
    refreshList();
    navigate('.', { replace: true, state: {} });
  }, [refreshFromSave, navigate, refreshList]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setDraftFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...draftFilters });
  }, [draftFilters]);

  const handleEdit = useCallback(
    (row) => {
      const cid = consigneeIdFromRow(row);
      if (!cid) {
        enqueueSnackbar('Cannot edit: consignee ID is missing for this row.', { variant: 'warning' });
        return;
      }
      navigate(
        {
          pathname: paths.dashboard.powerTool.addConsignee,
          search: `?consigneeId=${encodeURIComponent(cid)}`,
        },
        { state: { editConsigneeId: cid } }
      );
    },
    [navigate, enqueueSnackbar]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeletingId(targetId);
    try {
      await qdApi.deleteConsignee(targetId);
      enqueueSnackbar('Consignee deleted.', { variant: 'success' });
      setDeleteTarget(null);
      setError(null);
      refreshList();
    } catch (e) {
      const msg = apiErrorMessage(e, 'Failed to delete consignee');
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setDeletingId(null);
    }
  }, [deleteTarget, enqueueSnackbar, refreshList]);

  const columns = useMemo(
    () => [
      {
        field: 'packageName',
        headerName: 'Package Name',
        flex: 1.2,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'consigneeName',
        headerName: 'Consignee Name',
        flex: 1.2,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'address',
        headerName: 'Address',
        flex: 2,
        minWidth: 180,
        headerAlign: 'center',
        align: 'left',
      },
      {
        field: 'phone',
        headerName: 'Phone #',
        flex: 1,
        minWidth: 110,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'edit',
        headerName: 'Edit',
        width: 104,
        minWidth: 104,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Edit consignee" arrow>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<EditOutlinedIcon sx={{ fontSize: 18 }} />}
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 88 }}
              onClick={() => handleEdit(params.row)}
            >
              Edit
            </Button>
          </Tooltip>
        ),
      },
      {
        field: 'delete',
        headerName: 'Delete',
        width: 88,
        minWidth: 88,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const busy = deletingId === params.row.id;
          return (
            <Tooltip title="Delete" arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={busy}
                  aria-label="Delete consignee"
                  onClick={() => setDeleteTarget(params.row)}
                  sx={{
                    bgcolor: 'error.main',
                    color: 'error.contrastText',
                    width: 28,
                    height: 28,
                    '&:hover': { bgcolor: 'error.dark', color: 'error.contrastText' },
                    '&.Mui-disabled': { opacity: 0.85 },
                  }}
                >
                  {busy ? (
                    <CircularProgress color="inherit" size={16} />
                  ) : (
                    <Iconify icon="eva:close-fill" width={16} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [handleEdit, deletingId]
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="Consignee View"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Power Tools', href: paths.dashboard.powerTool.root },
          { name: 'Consignee' },
        ]}
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Package Name
          </Typography>
          <TextField
            fullWidth
            size="small"
            name="packageName"
            value={draftFilters.packageName}
            onChange={handleFilterChange}
            placeholder="Package name…"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Consignee Name
          </Typography>
          <TextField
            fullWidth
            size="small"
            name="consigneeName"
            value={draftFilters.consigneeName}
            onChange={handleFilterChange}
            placeholder="Consignee name…"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: 'none', px: 3 }}
            onClick={handleSearch}
            disabled={loading}
          >
            Search
          </Button>
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={3}
          sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(paths.dashboard.powerTool.addConsignee)}
            sx={{ textTransform: 'none', px: 3 }}
          >
            Add Consignee
          </Button>
        </Grid>
      </Grid>

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
              minWidth: { xs: 720, sm: '100%' },
              overflow: 'hidden',
              borderRadius: 1,
              bgcolor: 'background.paper',
              borderColor: 'divider',
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              autoHeight
              disableRowSelectionOnClick
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
              pageSizeOptions={[10, 25, 50]}
              slots={{ noRowsOverlay: NoRowsOverlay }}
              sx={{
                border: 'none',
                bgcolor: 'background.paper',
                '& .MuiDataGrid-main': { bgcolor: 'background.paper' },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: (t) => t.palette.grey[100],
                  color: (t) => t.palette.grey[700],
                  borderBottom: (t) => `1px solid ${t.palette.divider}`,
                },
                '& .MuiDataGrid-columnHeader': { outline: 'none' },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  color: 'inherit',
                },
                '& .MuiDataGrid-columnSeparator': { color: 'divider' },
                '& .MuiDataGrid-cell': {
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                },
                '& .MuiDataGrid-row': {
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: (t) => `1px solid ${t.palette.divider}`,
                  bgcolor: 'background.paper',
                  minHeight: 52,
                },
                '& .MuiTablePagination-root': { color: 'text.secondary' },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  color: 'text.secondary',
                },
                '& .MuiTablePagination-actions .MuiIconButton-root': { color: 'text.secondary' },
                '& .MuiDataGrid-footerContainer .MuiSvgIcon-root': { color: 'text.secondary' },
                '& .MuiDataGrid-footerContainer .MuiSelect-select': { color: 'text.secondary' },
                '& .MuiDataGrid-footerContainer .MuiSelect-icon': { color: 'text.secondary' },
              }}
            />
          </Paper>
        </Box>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        title="Delete consignee?"
        content={
          deleteTarget
            ? `This will remove «${deleteTarget.consigneeName}» (${deleteTarget.packageName}).`
            : null
        }
        action={
          <Button
            variant="contained"
            color="error"
            disabled={Boolean(deletingId)}
            onClick={handleDeleteConfirm}
            sx={{ mr: 1 }}
          >
            {deletingId ? <CircularProgress size={22} color="inherit" /> : 'Delete'}
          </Button>
        }
      />
    </Container>
  );
}
