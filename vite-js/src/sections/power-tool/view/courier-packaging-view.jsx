import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Container,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { pdf } from '@react-pdf/renderer';
import { useNavigate } from 'react-router-dom';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';
import CourierPackagingInvoicePdf, { COURIER_PACKAGES_PDF_TITLE } from './courier-packaging-invoice-pdf';

// ----------------------------------------------------------------------

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toInputDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthRangeDefaults() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { fromDate: toInputDate(start), toDate: toInputDate(end) };
}

/** Readable date for grid (API: ISO / .NET string) */
function formatMerchandisingDate(value) {
  if (value == null || value === '') return '—';
  const s = typeof value === 'string' ? value.trim() : String(value);
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  const d = m ? new Date(`${m[1]}T12:00:00`) : new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function pick(r, ...keys) {
  for (const k of keys) {
    if (r[k] != null && r[k] !== '') return r[k];
  }
  return '';
}

/** Master row id for edit URL — tries common API property names (incl. numeric 0). */
function merchandisingIdFromRaw(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const keys = [
    'merchandisingId',
    'MerchandisingId',
    'MerchandisingID',
    'merchandisingID',
    'Merchandising_Id',
    'merchandising_Id',
    'merchandisingMasterId',
    'MerchandisingMasterId',
    'merchandisingMasId',
    'MerchandisingMasId',
    'id',
    'Id',
    'ID',
  ];
  for (const k of keys) {
    const v = raw[k];
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    return String(v).trim();
  }
  return '';
}

/** Map API row → grid row (camel + Pascal) */
function mapMerchandisingRow(raw, index) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const couriesNo = pick(r, 'couriesNo', 'CouriesNo');
  const id =
    pick(r, 'id', 'Id') !== '' && pick(r, 'id', 'Id') != null
      ? String(pick(r, 'id', 'Id'))
      : couriesNo
        ? `cn-${couriesNo}-${index}`
        : `row-${index}`;

  return {
    id,
    _raw: r,
    invoiceNo: couriesNo !== '' ? String(couriesNo) : '—',
    creationDate: formatMerchandisingDate(pick(r, 'creationDate', 'CreationDate')),
    shipperName: String(pick(r, 'shipper', 'Shipper') || '—'),
    consigneeName: String(pick(r, 'consignee', 'Consignee') || '—'),
    address: String(pick(r, 'address', 'Address') || '—'),
    shipmentType: String(pick(r, 'shipment', 'Shipment') || '—'),
    service: String(pick(r, 'service', 'Service') || '—'),
    courierName: String(pick(r, 'couries', 'Couries') || '—'),
    account: String(pick(r, 'account', 'Account') || '—'),
    awbl: String(pick(r, 'awbl', 'Awbl', 'AWBL') || '—'),
  };
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.Data)) return data.Data;
  if (data && Array.isArray(data.result)) return data.result;
  if (data && Array.isArray(data.Result)) return data.Result;
  return [];
}

/** GetMerchandisingEditData / GetMerchandisingPdfData → `{ master, details }` (unwraps `data`, `pdfData`). */
function parseMerchandisingMasterDetailEnvelope(data) {
  let root = data?.data != null && typeof data.data === 'object' ? data.data : data;
  const pdfWrap = root?.pdfData ?? root?.PdfData;
  if (pdfWrap && typeof pdfWrap === 'object') {
    root = pdfWrap;
  }
  const m0 = root?.master ?? root?.Master ?? {};
  const master = typeof m0 === 'object' && m0 != null ? { ...m0 } : {};
  const raw = root?.details ?? root?.Details;
  const details = Array.isArray(raw) ? raw : [];

  // PDF maps import/courier tel from master; API sometimes sends `phon` on envelope root only
  if (!pick(master, 'phon', 'Phon', 'phone', 'Phone')) {
    const fromRoot = pick(root, 'phon', 'Phon', 'phone', 'Phone');
    if (fromRoot) master.phon = String(fromRoot).trim();
  }

  return { master, details };
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

export default function CourierPackagingViewPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const defaults = useMemo(() => monthRangeDefaults(), []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfRowId, setPdfRowId] = useState(null);

  const [draftFilters, setDraftFilters] = useState({
    orderNo: '',
    fromDate: defaults.fromDate,
    toDate: defaults.toDate,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    orderNo: '',
    fromDate: defaults.fromDate,
    toDate: defaults.toDate,
  });

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraftFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...draftFilters });
  }, [draftFilters]);

  const { orderNo, fromDate, toDate } = appliedFilters;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await qdApi.get('/Merchandising/GetMerchandisingMasterData', {
          params: {
            orderNo: orderNo.trim(),
            fromDate,
            toDate,
          },
        });
        if (cancelled) return;
        const list = normalizeListResponse(data);
        setRows(list.map((row, i) => mapMerchandisingRow(row, i)));
      } catch (e) {
        if (cancelled) return;
        const msg =
          (typeof e?.response?.data === 'string' && e.response.data) ||
          e?.response?.data?.message ||
          e?.response?.data?.Message ||
          e?.message ||
          'Failed to load merchandising data';
        setError(typeof msg === 'string' ? msg : 'Failed to load merchandising data');
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [orderNo, fromDate, toDate]);

  const handleEditNavigate = useCallback(
    (raw) => {
      const mid = merchandisingIdFromRaw(raw);
      if (!mid) {
        enqueueSnackbar('Cannot open entry: this row has no merchandising ID.', { variant: 'warning' });
        return;
      }
      const search = `?merchandisingId=${encodeURIComponent(mid)}`;
      navigate(
        {
          pathname: paths.dashboard.powerTool.courierPackagingEntry,
          search,
        },
        { state: { merchandisingMaster: raw, merchandisingId: mid } }
      );
    },
    [navigate, enqueueSnackbar]
  );

  const handlePdfView = useCallback(
    async (gridRow) => {
      const raw = gridRow?._raw;
      const mid = merchandisingIdFromRaw(raw);
      if (!mid) {
        enqueueSnackbar('Cannot generate PDF: missing merchandising ID for this row.', { variant: 'warning' });
        return;
      }
      // Open synchronously on user click so the browser does not treat this as a blocked pop-up
      // after async PDF generation (window.open after await is usually blocked).
      const previewWin = window.open('about:blank', '_blank');
      if (!previewWin) {
        enqueueSnackbar('Pop-up blocked. Allow pop-ups for this site to view the PDF.', { variant: 'warning' });
        return;
      }
      try {
        previewWin.opener = null;
      } catch {
        /* ignore */
      }

      setPdfRowId(gridRow.id);
      let pdfUrl;
      let htmlUrl;
      try {
        try {
          previewWin.document.open();
          previewWin.document.write(
            '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Loading…</title></head><body style="margin:0;font-family:system-ui,sans-serif;padding:24px">Generating PDF…</body></html>'
          );
          previewWin.document.close();
        } catch {
          /* about:blank may be restricted in rare cases; navigation below still works */
        }

        const data = await qdApi.getMerchandisingPdfData(mid);
        const { master, details } = parseMerchandisingMasterDetailEnvelope(data);
        const blob = await pdf(<CourierPackagingInvoicePdf master={master} details={details} />).toBlob();
        pdfUrl = URL.createObjectURL(blob);
        const title = COURIER_PACKAGES_PDF_TITLE;
        const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${title}</title><style>html,body{margin:0;height:100%;}iframe{border:0;width:100%;height:100%;vertical-align:top;}</style></head><body><iframe src="${pdfUrl}" title="${title}"></iframe></body></html>`;
        const htmlBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
        htmlUrl = URL.createObjectURL(htmlBlob);
        previewWin.location.href = htmlUrl;

        // Let the iframe finish loading the PDF before revoking its blob URL.
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 120_000);
        // Wrapper document stays on htmlUrl; revoking it can unload the tab.
        enqueueSnackbar('PDF opened in a new tab.', { variant: 'success' });
      } catch (e) {
        try {
          previewWin.close();
        } catch {
          /* ignore */
        }
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        if (htmlUrl) URL.revokeObjectURL(htmlUrl);
        const msg =
          (typeof e?.response?.data === 'string' && e.response.data) ||
          e?.response?.data?.message ||
          e?.response?.data?.Message ||
          e?.message ||
          'Failed to generate PDF';
        enqueueSnackbar(typeof msg === 'string' ? msg : 'Failed to generate PDF', { variant: 'error' });
      } finally {
        setPdfRowId(null);
      }
    },
    [enqueueSnackbar]
  );

  const columns = useMemo(
    () => [
      { field: 'invoiceNo', headerName: 'Invoice #', flex: 1, minWidth: 110 },
      { field: 'creationDate', headerName: 'Creation Date', flex: 1, minWidth: 130 },
      { field: 'shipperName', headerName: 'Shipper Name', flex: 1.2, minWidth: 130 },
      { field: 'consigneeName', headerName: 'Consignee Name', flex: 1.2, minWidth: 130 },
      { field: 'address', headerName: 'Address', flex: 2, minWidth: 180 },
      { field: 'shipmentType', headerName: 'Shipment Type', flex: 1, minWidth: 110 },
      { field: 'service', headerName: 'Service', flex: 0.8, minWidth: 90 },
      { field: 'courierName', headerName: 'Courier Name', flex: 1, minWidth: 110 },
      { field: 'account', headerName: 'Account', flex: 0.8, minWidth: 80 },
      { field: 'awbl', headerName: 'AWBL #', flex: 1, minWidth: 100 },
      {
        field: 'edit',
        headerName: 'Edit',
        width: 100,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Tooltip title="Open entry with this record" arrow>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 72 }}
              onClick={() => handleEditNavigate(params.row._raw)}
            >
              Edit
            </Button>
          </Tooltip>
        ),
      },
      {
        field: 'pdf',
        headerName: 'PDF',
        width: 80,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderHeader: () => (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
            <PictureAsPdfIcon sx={{ fontSize: 18, color: 'error.main' }} />
            <Typography variant="body2" fontWeight={700}>
              PDF
            </Typography>
          </Stack>
        ),
        renderCell: (params) => {
          const busy = pdfRowId === params.row.id;
          return (
            <Tooltip title="View invoice PDF (new tab)" arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={busy}
                  aria-label="View PDF"
                  onClick={() => handlePdfView(params.row)}
                  sx={{ color: 'error.main' }}
                >
                  {busy ? <CircularProgress color="inherit" size={18} /> : <PictureAsPdfIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [handleEditNavigate, handlePdfView, pdfRowId]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="Courier Packages View"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Power Tools', href: paths.dashboard.powerTool.root },
          { name: 'Courier Packages' },
        ]}
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Order No
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Order no…"
            name="orderNo"
            value={draftFilters.orderNo}
            onChange={handleDraftChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            From
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            name="fromDate"
            value={draftFilters.fromDate}
            onChange={handleDraftChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            To
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="date"
            name="toDate"
            value={draftFilters.toDate}
            onChange={handleDraftChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <Button variant="contained" color="primary" sx={{ textTransform: 'none', px: 3 }} onClick={handleSearch}>
            Search
          </Button>
        </Grid>

        <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              navigate({
                pathname: paths.dashboard.powerTool.courierPackagingEntry,
                search: '',
              })
            }
            sx={{ textTransform: 'none', px: 3 }}
          >
            Add Courier
          </Button>
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ borderRadius: 1, position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.72)',
              zIndex: 2,
              borderRadius: 1,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}
        <Paper
          variant="outlined"
          sx={{
            width: '100%',
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
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            slots={{ noRowsOverlay: NoRowsOverlay }}
            sx={{
              border: 'none',
              bgcolor: 'background.paper',
              '& .MuiDataGrid-main': { bgcolor: 'background.paper' },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: (t) => t.palette.grey[100],
                color: (t) => t.palette.grey[700],
                borderBottom: (t) => `1px solid ${t.palette.divider}`,
                borderRadius: 0,
              },
              '& .MuiDataGrid-columnHeader': {
                outline: 'none',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                color: 'inherit',
              },
              '& .MuiDataGrid-columnSeparator': {
                color: 'divider',
              },
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
      </Card>
    </Container>
  );
}
