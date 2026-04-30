import { pdf } from '@react-pdf/renderer';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useCallback, useEffect } from 'react';

import axios from 'axios';
import Autocomplete from '@mui/material/Autocomplete';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid } from '@mui/x-data-grid';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

import SvgColor from 'src/components/svg-color';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import SampleInspectionReportPDF from './Sample-inspection-report-PDF';

// ----------------------------------------------------------------------

/** Vite: `VITE_API_BASE_URL`. CRA-style `REACT_APP_API_BASE_URL` only works if defined in vite.config `envPrefix` / `define`. */
const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.REACT_APP_API_BASE_URL || ''
).replace(/\/+$/, '');

function normalizeRow(raw, idx) {
  if (!raw || typeof raw !== 'object') return null;
  const inspectionTNAProcMstId =
    raw.inspectionTNAProcMstId ?? raw.InspectionTNAProcMstID ?? raw.inspectionTNAProcMstID ?? idx;
  const id = String(inspectionTNAProcMstId ?? raw.id ?? `row-${idx}`);
  return {
    ...raw,
    id,
    inspectionTNAProcMstId,
    poid: raw.poid ?? raw.POID,
    inspType: raw.insp_Type ?? raw.inspType ?? raw.Insp_Type ?? '',
    inspAutoNo: raw.inspAutoNo ?? raw.InspAutoNo ?? '',
    receivedDate: raw.receivedDate ?? raw.ReceivedDate ?? '',
    pono: raw.pono ?? raw.PONO ?? '',
    reviewDate: raw.reviewDate ?? raw.ReviewDate ?? '',
  };
}

function axiosErrorMessage(err) {
  const d = err?.response?.data;
  if (typeof d === 'string') return d;
  if (d?.message) return String(d.message);
  if (Array.isArray(d?.errors)) return d.errors.map(String).join(', ');
  if (d && typeof d === 'object' && typeof d.title === 'string') return d.title;
  return err?.message || 'Failed to load data';
}

/** Supports common API envelopes: raw array, or `{ data | result | items }`. */
function parseInspectionListResponse(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.result)) return body.result;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

function rowSearchHaystack(r) {
  const parts = [
    r.pono,
    r.PONO,
    r.inspAutoNo,
    r.inspType,
    r.insp_Type,
    r.poid != null ? String(r.poid) : '',
    r.receivedDate,
    r.reviewDate,
    r.inspectionTNAProcMstId != null ? String(r.inspectionTNAProcMstId) : '',
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function buildSmartSearchOptions(rows) {
  const set = new Set();
  rows.forEach((r) => {
    if (r.pono) set.add(String(r.pono));
    if (r.inspAutoNo) set.add(String(r.inspAutoNo));
    if (r.inspType) set.add(String(r.inspType));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Same file as dashboard Logo — read as data URL so @react-pdf embeds it (URL fetch often breaks in PDF worker). */
async function fetchAmsLogoDataUrl() {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const res = await fetch(`${base}/logo/AMSlogo.png`);
  if (!res.ok) throw new Error(`AMS logo (${res.status})`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('AMS logo read failed'));
    reader.readAsDataURL(blob);
  });
}

function readHideEditForRole() {
  if (typeof window === 'undefined') return false;
  const r = localStorage.getItem('roleId');
  if (r == null || r === '') return false;
  const n = parseInt(r, 10);
  return n === 1;
}

function InspectionNoRowsOverlay() {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', py: 4 }}>
      <Typography variant="body2" color="text.secondary">
        No Data Found
      </Typography>
    </Stack>
  );
}

export default function SampleInspectionReportView() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [inspectionList, setInspectionList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  /** Suggestions panel only after user types (not on empty focus). */
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput.trim()), 280);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!searchInput.trim()) setSuggestionsOpen(false);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError('');
      try {
        if (!API_BASE_URL) {
          throw new Error(
            'Missing API base URL. Set VITE_API_BASE_URL (or expose REACT_APP_API_BASE_URL in Vite) in .env.'
          );
        }
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE_URL}/api/InspectionProcess/GetViewData`, {
          params: { pono: debouncedQuery },
          headers,
        });
        if (cancelled) return;
        setInspectionList(parseInspectionListResponse(res.data));
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setInspectionList([]);
          setFetchError(axiosErrorMessage(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const hideEdit = useMemo(() => readHideEditForRole(), []);

  const rows = useMemo(
    () => inspectionList.map((r, i) => normalizeRow(r, i)).filter(Boolean),
    [inspectionList]
  );

  const searchOptions = useMemo(() => buildSmartSearchOptions(rows), [rows]);

  const handleEdit = useCallback(
    (row) => {
      if (!row) return;
      const q = new URLSearchParams();
      if (row.poid != null && row.poid !== '') q.set('poid', String(row.poid));
      q.set('inspType', row.inspType || 'Proto Fit');
      const procId =
        row.inspectionTNAProcMstId ?? row.InspectionTNAProcMstID ?? row.InspectionTNAProcMstId;
      if (procId != null && procId !== '') q.set('id', String(procId));
      navigate(`${paths.dashboard.qdProcessEntry}?${q.toString()}`);
    },
    [navigate]
  );

  const handleViewPdf = useCallback(
    async (row) => {
      if (!row) {
        enqueueSnackbar('No row data for PDF', { variant: 'warning' });
        return;
      }
      const procId =
        row.inspectionTNAProcMstId ?? row.InspectionTNAProcMstID ?? row.InspectionTNAProcMstId;
      if (procId == null || String(procId).trim() === '') {
        enqueueSnackbar('Missing inspection id for PDF.', { variant: 'warning' });
        return;
      }
      setPdfLoadingId(row.id);
      try {
        const { data: pdfData } = await qdApi.get(
          `/InspectionProcess/GetPdfData/${encodeURIComponent(String(procId))}`
        );
        const hasMasterBlock = pdfData?.master != null || pdfData?.Master != null;
        const hasRootTe =
          pdfData &&
          typeof pdfData === 'object' &&
          Object.keys(pdfData).some((k) => k.startsWith('tE_'));
        if (!hasMasterBlock && !hasRootTe) {
          enqueueSnackbar('No Data Found', { variant: 'warning' });
          return;
        }
        let logoDataUrl;
        try {
          logoDataUrl = await fetchAmsLogoDataUrl();
        } catch (logoErr) {
          console.warn(logoErr);
          enqueueSnackbar('AMS logo could not be embedded; PDF header may be blank.', { variant: 'warning' });
        }
        const blob = await pdf(
          <SampleInspectionReportPDF data={{ ...pdfData, ...(logoDataUrl ? { logoDataUrl } : {}) }} />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 90_000);
      } catch (e) {
        console.error(e);
        enqueueSnackbar(axiosErrorMessage(e) || e?.message || 'Could not generate PDF', { variant: 'error' });
      } finally {
        setPdfLoadingId(null);
      }
    },
    [enqueueSnackbar]
  );

  const columns = useMemo(() => {
    const base = [
      {
        field: 'inspType',
        headerName: 'Inspection Type',
        flex: 1,
        minWidth: 120,
      },
      {
        field: 'inspAutoNo',
        headerName: 'Insp. Sample #',
        flex: 1,
        minWidth: 130,
      },
      {
        field: 'receivedDate',
        headerName: 'Received Date',
        flex: 0.9,
        minWidth: 120,
      },
      {
        field: 'pono',
        headerName: 'PO #',
        flex: 0.9,
        minWidth: 100,
      },
      {
        field: 'reviewDate',
        headerName: 'Review Date',
        flex: 0.9,
        minWidth: 120,
      },
      {
        field: 'pdf',
        headerName: 'PDF',
        width: 60,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const busy = pdfLoadingId === params.row.id;
          return (
            <Tooltip title="Open sample inspection PDF (preview)">
              <span>
                <IconButton
                  size="small"
                  disabled={busy}
                  onClick={() => handleViewPdf(params.row)}
                  sx={{
                    p: 0.45,
                    minWidth: 0,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.35)}`,
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                      borderColor: 'error.main',
                    },
                    '&.Mui-disabled': {
                      bgcolor: alpha(theme.palette.action.disabledBackground, 0.5),
                      borderColor: 'divider',
                    },
                  }}
                >
                  {busy ? (
                    <CircularProgress size={14} thickness={5} color="inherit" />
                  ) : (
                    <SvgColor
                      src="/assets/icons/files/ic_pdf.svg"
                      sx={{ width: 16, height: 16, color: 'error.main' }}
                    />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      },
    ];

    if (hideEdit) return base;

    return [
      ...base,
      {
        field: 'edit',
        headerName: 'Edit',
        width: 72,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const { row } = params;
          if (row.poid == null) return null;
          return (
            <Tooltip title="Edit (legacy InspectionProcessEntry)">
              <IconButton size="small" color="primary" onClick={() => handleEdit(row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        },
      },
    ];
  }, [hideEdit, handleEdit, handleViewPdf, pdfLoadingId, theme]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="Sample Inspection Report"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Sample Inspection Report' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Card
        variant="outlined"
        sx={{ p: 2, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}
      >
        {fetchError ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFetchError('')}>
            {fetchError}
          </Alert>
        ) : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 1 }}>
          <Autocomplete
            freeSolo
            size="small"
            options={searchOptions}
            inputValue={searchInput}
            open={suggestionsOpen && Boolean(searchInput.trim())}
            onOpen={() => {
              if (searchInput.trim()) setSuggestionsOpen(true);
            }}
            onClose={() => setSuggestionsOpen(false)}
            openOnFocus={false}
            onInputChange={(_e, v, reason) => {
              const next = v ?? '';
              setSearchInput(next);
              if (reason === 'reset' || reason === 'clear') {
                setSuggestionsOpen(false);
                return;
              }
              if (!next.trim()) {
                setSuggestionsOpen(false);
                return;
              }
              if (reason === 'input') setSuggestionsOpen(true);
            }}
            onChange={(_e, v) => {
              if (v == null || v === '') setSearchInput('');
              else setSearchInput(typeof v === 'string' ? v : String(v));
              setSuggestionsOpen(false);
            }}
            sx={{ flex: 1, maxWidth: { sm: 480 } }}
            filterOptions={(opts, state) => {
              const q = state.inputValue.trim().toLowerCase();
              if (!q) return [];
              return opts.filter((o) => o.toLowerCase().includes(q)).slice(0, 25);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="PO No."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start" sx={{ ml: 0.5 }}>
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          <Button
            variant="outlined"
            onClick={() => setSearchInput('')}
            disabled={!searchInput}
            sx={{ height: 40, px: 3, fontWeight: 600, textTransform: 'none', alignSelf: { xs: 'stretch', sm: 'center' } }}
          >
            Clear
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Showing {rows.length} row{rows.length === 1 ? '' : 's'}
          {debouncedQuery ? ` · PO filter: “${debouncedQuery}”` : ''}
        </Typography>

        <Paper variant="outlined" sx={{ height: 640, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            getRowId={(r) => r.id}
            components={{ NoRowsOverlay: InspectionNoRowsOverlay }}
            pageSizeOptions={[10, 25, 50, 60]}
            initialState={{
              pagination: { paginationModel: { pageSize: 60, page: 0 } },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: (t) => t.palette.grey[200],
                color: 'text.primary',
                borderBottom: 1,
                borderColor: 'divider',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
              },
              '& .MuiDataGrid-cell': {
                borderColor: 'divider',
              },
            }}
          />
        </Paper>
      </Card>
    </Container>
  );
}
