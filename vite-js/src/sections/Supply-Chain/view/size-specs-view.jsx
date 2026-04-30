import { pdf } from '@react-pdf/renderer';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useState, useCallback, useEffect } from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid } from '@mui/x-data-grid';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import SvgColor from 'src/components/svg-color';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import SelfSizeSpecsPDF, { mergeSizeSpecsPdfData } from './Self-size-specs-PDF';

// ----------------------------------------------------------------------

function normalizeRow(raw) {
  return {
    ...raw,
    id: `${raw.poid}-${raw.poDetailID}-${raw.autoNo || ''}-${raw.creationDate || Math.random()}`,
    vendorName: raw.venderName || raw.vendorName,
  };
}

function buildPoOptions(rows) {
  const s = new Set();
  rows.forEach((r) => {
    if (r.pono) s.add(String(r.pono));
    if (r.autoNo) s.add(String(r.autoNo));
  });
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

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

export default function SizeSpecsViewList() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  const [searchInput, setSearchInput] = useState(() => searchParams.get('poNo') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(() => (searchParams.get('poNo') || '').trim());
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput.trim()), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!searchInput.trim()) setSuggestionsOpen(false);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const roleId = 26;
      const userId = 26;
      const pono = debouncedQuery || '';

      const url = `/api/SelfSizeSpecs/GetViewData?roleId=${roleId}&userId=${userId}&pono=${encodeURIComponent(pono)}`;
      console.log('Fetching Size Specs from:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setTableData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching Size Specs:', err);
      enqueueSnackbar('Failed to load size specs data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, enqueueSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const searchOptions = useMemo(() => buildPoOptions(tableData), [tableData]);

  const rows = useMemo(() => {
    return tableData.map(normalizeRow);
  }, [tableData]);

  const handleViewPdf = useCallback(
    async (poDetailId) => {
      setPdfLoadingId(poDetailId);
      try {
        const raw = tableData.find((r) => r.PODetailID === poDetailId || r.poDetailID === poDetailId || r.poDetailId === poDetailId);
        if (!raw) {
          enqueueSnackbar('No row for PDF', { variant: 'warning' });
          return;
        }

        // Fetch actual PDF data
        const token = localStorage.getItem('accessToken');
        const poid = raw.POID || raw.poid;
        const pdfResponse = await fetch(`/api/SelfSizeSpecs/GetPDFData?poid=${poid}&poDetailId=${poDetailId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        
        let measurementSheet;
        let sheetBanner = '';
        let headers = [];
        
        if (pdfResponse.ok) {
           const pdfData = await pdfResponse.json();
           if (pdfData && pdfData.length > 0) {
              const firstRow = pdfData[0];
              const measurementType = firstRow.measurementType || '';
              const measurementsUnit = firstRow.measurements || '';
              sheetBanner = `${measurementType} ${measurementType && measurementsUnit ? '-' : ''} ${measurementsUnit ? `(${measurementsUnit})` : ''}`;
              
              // Extract best headers
              let bestHeaderRow = firstRow;
              let maxHeaders = 0;
              pdfData.forEach(row => {
                  let count = 0;
                  for (let i = 1; i <= 12; i++) if (row[`header${i}`]) count++;
                  if (count > maxHeaders) {
                      maxHeaders = count;
                      bestHeaderRow = row;
                  }
              });
              for (let i = 1; i <= 12; i++) headers.push(bestHeaderRow[`header${i}`] || '');
              
              measurementSheet = pdfData.map((row, idx) => ({
                 no: String(idx + 1),
                 point: row.measurementPoints || '',
                 tol: row.tolerance || '',
                 sQ: row.col1 || '',
                 sS: row.qCol1 || '',
                 mQ: row.col2 || '',
                 mS: row.qCol2 || '',
                 l: row.col3 || '',
                 xl: row.col4 || '',
                 extra: [row.col5 || '', row.col6 || '', row.col7 || '', row.col8 || '', row.col9 || '', row.col10 || '']
              }));
           }
        }

        let logoDataUrl;
        try {
          logoDataUrl = await fetchAmsLogoDataUrl();
        } catch (e) {
          console.warn(e);
        }

        const merged = mergeSizeSpecsPdfData({
            ...raw,
            measurementSheet: measurementSheet || undefined,
            sheetBanner: sheetBanner || undefined,
            headers: headers.length > 0 ? headers : undefined
        }, logoDataUrl);
        
        const blob = await pdf(<SelfSizeSpecsPDF data={merged} />).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 90_000);
      } catch (e) {
        console.error(e);
        enqueueSnackbar(e?.message || 'Could not generate PDF', { variant: 'error' });
      } finally {
        setPdfLoadingId(null);
      }
    },
    [tableData, enqueueSnackbar]
  );

  const columns = useMemo(
    () => [
      {
        field: 'creationDate',
        headerName: 'Creation Date',
        flex: 1,
        minWidth: 110,
      },
      { field: 'autoNo', headerName: 'Spec #', flex: 1, minWidth: 130 },
      { field: 'customerName', headerName: 'Customer', flex: 1, minWidth: 120 },
      { field: 'venderName', headerName: 'Vendor', flex: 1, minWidth: 120 },
      { field: 'userName', headerName: 'Entered By', flex: 0.8, minWidth: 100 },
      {
        field: 'pdf',
        headerName: 'PDF',
        width: 58,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const currentRowId = params.row.PODetailID || params.row.poDetailID;
          const busy = pdfLoadingId === currentRowId;
          return (
            <Tooltip title="Open size specs PDF (preview)">
              <span>
                <IconButton
                  size="small"
                  disabled={busy}
                  onClick={() => handleViewPdf(currentRowId)}
                  sx={{
                    p: 0.45,
                    minWidth: 0,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.35)}`,
                    color: 'error.main',
                  }}
                >
                  {busy ? (
                    <CircularProgress size={14} thickness={5} color="inherit" />
                  ) : (
                    <SvgColor src="/assets/icons/files/ic_pdf.svg" sx={{ width: 16, height: 16, color: 'error.main' }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: 'edit',
        headerName: 'Edit',
        width: 68,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Tooltip title="Size Specs Edit">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                const currentUserId = localStorage.getItem('userId') || localStorage.getItem('roleId') || '';
                navigate(
                  paths.dashboard.supplyChain.sizeSpecsEditWithQuery(
                    params.row.PODetailID || params.row.poDetailID || '',
                    params.row.POID || params.row.poid || '',
                    params.row.measurementTypeID || params.row.measurementType || ''
                  ),
                  {
                    state: {
                      poDetailId: params.row.PODetailID || params.row.poDetailID || '',
                      poid: params.row.POID || params.row.poid || '',
                      measurementTypeId: params.row.measurementTypeID || params.row.measurementType || '',
                      userId: currentUserId
                    }
                  }
                );
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [handleViewPdf, navigate, pdfLoadingId, theme]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="Size Specs View"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Size Specs View' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Card variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
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
            sx={{ flex: 1, maxWidth: { sm: 420 } }}
            filterOptions={(opts, state) => {
              const q = state.inputValue.trim().toLowerCase();
              if (!q) return [];
              return opts.filter((o) => o.toLowerCase().includes(q)).slice(0, 20);
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
            onClick={() => {
              setSearchInput('');
              setSearchParams({});
            }}
            disabled={!searchInput}
            sx={{ height: 40, textTransform: 'none', fontWeight: 600 }}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate(paths.dashboard.supplyChain.sizeSpecsAdd)}
            sx={{ height: 40, textTransform: 'none', fontWeight: 600 }}
          >
            Add Size Specs
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Showing {rows.length} records
        </Typography>

        <Paper variant="outlined" sx={{ height: 560, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            getRowId={(r) => r.id}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 60]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: (t) => t.palette.grey[200],
                fontWeight: 700,
              },
            }}
          />
        </Paper>
      </Card>
    </Container>
  );
}
