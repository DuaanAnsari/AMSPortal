import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CalculateIcon from '@mui/icons-material/Calculate';
import StraightenIcon from '@mui/icons-material/Straighten';
import { DataGrid } from '@mui/x-data-grid';

import { paths } from 'src/routes/paths';

import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const buildApiUrl = (isDispatchOnly) =>
  `${API_BASE_URL}/api/MerchantInquiry/InquiryGridView?isDispatchOnly=${String(isDispatchOnly)}`;

const cardSx = {
  p: { xs: 2, sm: 3 },
  borderRadius: 1,
  boxShadow: (theme) =>
    theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
};

const gridSx = {
  border: 0,
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#eeeeee',
    borderBottom: '1px solid',
    borderBottomColor: 'divider',
  },
  '& .MuiDataGrid-cell': {
    borderBottomColor: 'divider',
    color: 'text.primary',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 700,
    color: 'text.primary',
  },
  '& .MuiDataGrid-row': {
    backgroundColor: 'background.paper',
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: 'background.paper',
  },
};

function normalizeRows(data) {
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  return rows.map((row, index) => ({
    id: row?.InquiryMstID ?? row?.InquiryMstId ?? row?.inquiryMstID ?? row?.inquiryMstId ?? index,
    UserName: row?.UserName ?? '',
    InquiryType: row?.InquiryType ?? '',
    Createdatee: row?.Createdatee ?? '',
    datee: row?.datee ?? '',
    SupplierName: row?.SupplierName ?? '',
    CustomerName: row?.CustomerName ?? '',
    InquiryMstID: row?.InquiryMstID ?? row?.InquiryMstId ?? row?.inquiryMstID ?? '',
    SampleNo: row?.SampleNo ?? '',
    SupplierID: row?.SupplierID ?? '',
    Status: row?.Status ?? '',
    Style: row?.Style ?? '',
    ItemDesc: row?.ItemDesc ?? '',
    Content: row?.Content ?? '',
    Remarks: row?.Remarks ?? '',
  }));
}

function extractUniqueOptions(rows, key) {
  const set = new Set();
  rows.forEach((row) => {
    const value = String(row?.[key] ?? '').trim();
    if (value) set.add(value);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function matchesPartial(value, input) {
  const target = String(value ?? '').toLowerCase();
  const inputText = String(input ?? '').trim().toLowerCase();
  if (inputText && !target.includes(inputText)) return false;
  return true;
}

function InquiryActionButton({ title, color = 'primary', icon, onClick }) {
  return (
    <Tooltip title={title} arrow>
      <span>
        <IconButton color={color} size="small" onClick={onClick}>
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function TruncatedGridCell({ value }) {
  const text = String(value ?? '');
  const displayText = text.length > 9 ? `${text.slice(0, 9)}...` : text;

  return (
    <Tooltip title={text} arrow>
      <Box component="span" sx={{ display: 'inline-block', maxWidth: '100%' }}>
        {displayText}
      </Box>
    </Tooltip>
  );
}

export default function MerchantInquiryPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const gridDragRef = useRef(null);
  const dragStateRef = useRef({
    dragging: false,
    startX: 0,
    startScrollLeft: 0,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dispatchOnly, setDispatchOnly] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState(null);

  useEffect(() => {
    if (!API_BASE_URL) {
      setError('VITE_API_BASE_URL is not set');
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(buildApiUrl(dispatchOnly), {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          throw new Error(`InquiryGridView ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        setRows(normalizeRows(data));
      } catch (err) {
        if (controller.signal.aborted || cancelled) return;
        console.error('[MerchantInquiry] load', err);
        setRows([]);
        setError(err?.message || 'Failed to load inquiry grid');
        enqueueSnackbar(err?.message || 'Failed to load inquiry grid', { variant: 'error' });
      } finally {
        if (!controller.signal.aborted && !cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [dispatchOnly, enqueueSnackbar]);

  const searchOptions = useMemo(
    () =>
      Array.from(
        new Set([...extractUniqueOptions(rows, 'SampleNo'), ...extractUniqueOptions(rows, 'Style')])
      ).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter(
      (row) =>
        matchesPartial(row.SampleNo, searchInput) ||
        matchesPartial(row.Style, searchInput)
    );
  }, [rows, searchInput]);

  const handleEdit = useCallback(
    (row) => {
      const id = row?.InquiryMstID ?? row?.InquiryMstId ?? row?.id;
      if (!id) {
        enqueueSnackbar('Missing InquiryMstID', { variant: 'warning' });
        return;
      }
      navigate(`${paths.dashboard.supplyChain.addInquiry}?id=${encodeURIComponent(String(id))}`);
    },
    [enqueueSnackbar, navigate]
  );

  const handleCosting = useCallback(
    (row) => {
      enqueueSnackbar(`Costing: ${row?.InquiryMstID ?? ''}`, { variant: 'info' });
    },
    [enqueueSnackbar]
  );

  const handleSizeSpecs = useCallback(
    (row) => {
      enqueueSnackbar(`Size Specs: ${row?.InquiryMstID ?? ''}`, { variant: 'info' });
    },
    [enqueueSnackbar]
  );

  const handleDelete = useCallback(
    (row) => {
      enqueueSnackbar(`Delete action kept unchanged for ${row?.InquiryMstID ?? ''}`, {
        variant: 'info',
      });
    },
    [enqueueSnackbar]
  );

  const columns = useMemo(
    () => [
      {
        field: 'UserName',
        headerName: 'Merchand',
        flex: 1,
        minWidth: 140,
        renderCell: (params) => <TruncatedGridCell value={params.value} />,
      },
      {
        field: 'InquiryType',
        headerName: 'Inquiry Type',
        flex: 1,
        minWidth: 130,
        renderCell: (params) => <TruncatedGridCell value={params.value} />,
      },
      {
        field: 'Createdatee',
        headerName: 'Creation Date',
        flex: 1,
        minWidth: 140,
        renderCell: (params) => <TruncatedGridCell value={params.value} />,
      },
      {
        field: 'SampleNo',
        headerName: 'Sample No',
        flex: 1,
        minWidth: 140,
        renderCell: (params) => <TruncatedGridCell value={params.value} />,
      },
      {
        field: 'SupplierName',
        headerName: 'Supplier',
        flex: 1,
        minWidth: 160,
        renderCell: (params) => <TruncatedGridCell value={params.value} />,
      },
      {
        field: 'CustomerName',
        headerName: 'Customer',
        flex: 1,
        minWidth: 160,
        renderCell: (params) => <TruncatedGridCell value={params.value} />,
      },
      {
        field: 'Style',
        headerName: 'Style',
        flex: 1,
        minWidth: 120,
        renderCell: (params) => <TruncatedGridCell value={params.value} />,
      },
      {
        field: 'ItemDesc',
        headerName: 'Item Desc.',
        flex: 1,
        minWidth: 160,
        renderCell: (params) => <TruncatedGridCell value={params.value} />,
      },
      {
        field: 'Edit',
        headerName: 'Edit',
        sortable: false,
        filterable: false,
        width: 60,
        align: 'center',
        renderCell: (params) => (
          <InquiryActionButton
            title="Edit"
            icon={<EditIcon fontSize="small" />}
            onClick={() => handleEdit(params.row)}
          />
        ),
      },
      {
        field: 'Costing',
        headerName: 'Costing',
        sortable: false,
        filterable: false,
        width: 85,
        align: 'center',
        renderCell: (params) => (
          <InquiryActionButton
            title="Costing"
            icon={<CalculateIcon fontSize="small" />}
            onClick={() => handleCosting(params.row)}
          />
        ),
      },
      {
        field: 'SizeSpecs',
        headerName: 'Size Specs',
        sortable: false,
        filterable: false,
        width: 95,
        align: 'center',
        renderCell: (params) => (
          <InquiryActionButton
            title="Size Specs"
            icon={<StraightenIcon fontSize="small" />}
            onClick={() => handleSizeSpecs(params.row)}
          />
        ),
      },
      {
        field: 'Delete',
        headerName: 'Delete',
        sortable: false,
        filterable: false,
        width: 80,
        align: 'center',
        renderCell: (params) => (
          <InquiryActionButton
            title="Delete"
            color="error"
            icon={<DeleteIcon fontSize="small" />}
            onClick={() => handleDelete(params.row)}
          />
        ),
      },
    ],
    [handleCosting, handleDelete, handleEdit, handleSizeSpecs]
  );

  const handleGridMouseDown = useCallback((event) => {
    const target = gridDragRef.current?.querySelector('.MuiDataGrid-virtualScroller');
    if (!target || event.button !== 0) return;

    dragStateRef.current = {
      dragging: true,
      startX: event.clientX,
      startScrollLeft: target.scrollLeft,
    };

    target.style.cursor = 'grabbing';
    target.style.userSelect = 'none';
  }, []);

  const handleGridMouseMove = useCallback((event) => {
    const target = gridDragRef.current?.querySelector('.MuiDataGrid-virtualScroller');
    const state = dragStateRef.current;
    if (!target || !state.dragging) return;

    const deltaX = event.clientX - state.startX;
    target.scrollLeft = state.startScrollLeft - deltaX;
    event.preventDefault();
  }, []);

  const stopGridDragging = useCallback(() => {
    const target = gridDragRef.current?.querySelector('.MuiDataGrid-virtualScroller');
    if (target) {
      target.style.cursor = '';
      target.style.userSelect = '';
    }
    dragStateRef.current.dragging = false;
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <CustomBreadcrumbs
        heading="Merchant Inquiry"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Supply Chain', href: paths.dashboard.supplyChain.root },
          { name: 'Merchant Inquiry' },
        ]}
        sx={{ mb: 2 }}
      />

      <Card variant="outlined" sx={cardSx}>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Merchant Inquiry
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <Autocomplete
              freeSolo
              options={searchOptions}
              value={searchValue}
              inputValue={searchInput}
              onInputChange={(_, value, reason) => {
                setSearchInput(value);
                if (reason === 'clear') setSearchValue(null);
              }}
              onChange={(_, value) => {
                setSearchValue(value || null);
                setSearchInput(value || '');
              }}
              filterOptions={(options, state) =>
                options.filter((option) =>
                  String(option).toLowerCase().includes(String(state.inputValue || '').toLowerCase())
                )
              }
              renderInput={(params) => (
                <TextField {...params} label="Search Sample No / Style" size="small" fullWidth />
              )}
              sx={{ flex: 1, maxWidth: { xs: '100%', md: 320 } }}
            />

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', flex: 1 }}>
              <Button
                variant={dispatchOnly ? 'contained' : 'outlined'}
                onClick={() => setDispatchOnly(false)}
                sx={{ minWidth: 110 }}
              >
                All
              </Button>
              <Button
                variant={dispatchOnly ? 'outlined' : 'contained'}
                onClick={() => setDispatchOnly(true)}
                sx={{ minWidth: 140 }}
              >
                Only Dispatch
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate(paths.dashboard.supplyChain.addInquiry)}
                sx={{ minWidth: 130 }}
              >
                Add Inquiry
              </Button>
            </Stack>
          </Stack>
        </Stack>

        <Box
          ref={gridDragRef}
          onMouseDown={handleGridMouseDown}
          onMouseMove={handleGridMouseMove}
          onMouseUp={stopGridDragging}
          onMouseLeave={stopGridDragging}
          sx={{ width: '100%', cursor: 'grab' }}
        >
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            disableColumnMenu
            disableColumnFilter
            disableColumnSelector
            rowHeight={52}
            columnHeaderHeight={44}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
              sorting: { sortModel: [{ field: 'Createdatee', sort: 'desc' }] },
            }}
            slotProps={{
              loadingOverlay: { variant: 'circular-progress', noRowsVariant: 'skeleton' },
            }}
            sx={gridSx}
            autoHeight
            getRowHeight={() => 'auto'}
            density="standard"
            hideFooterSelectedRowCount
          />
        </Box>

        {error ? (
          <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
            {error}
          </Typography>
        ) : null}
      </Card>
    </Container>
  );
}
