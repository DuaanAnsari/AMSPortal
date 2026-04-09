import { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { PDFViewer } from '@react-pdf/renderer';

import { useBoolean } from 'src/hooks/use-boolean';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';
import { Link as RouterLink } from 'react-router-dom';

import InspectionProcessPDF from './Inspection-Process-PDF';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeRow(r) {
  return {
    id: Number(r.inspectionTNAProcMstID ?? r.InspectionTNAProcMstID ?? 0),
    inspectionTNAProcMstID: Number(r.inspectionTNAProcMstID ?? r.InspectionTNAProcMstID ?? 0),
    poid: Number(r.poid ?? r.POID ?? 0),
    inspAutoNo: r.inspAutoNo ?? r.InspAutoNo ?? '',
    insp_Type: r.insp_Type ?? r.Insp_Type ?? '',
    receivedDate: r.receivedDate ?? r.ReceivedDate ?? '',
    pono: r.pono ?? r.PONO ?? '',
    supplierContact: r.supplierContact ?? r.SupplierContact ?? '',
    styleNo: r.styleNo ?? r.StyleNo ?? '',
    styleName: r.styleName ?? r.StyleName ?? '',
    coo: r.coo ?? r.COO ?? '',
    savedInSession: r.savedInSession ?? r.SavedInSession ?? '',
    reviewDate: r.reviewDate ?? r.ReviewDate ?? '',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InspectionProcessView() {
  const [poNo, setPoNo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const pdfView = useBoolean();

  // ─── Fetch data ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async (opts) => {
    setLoading(true);
    setError(null);
    try {
      const q = opts?.poNo?.trim?.() ?? '';
      // By default load all records; search only when PO query is provided.
      const { data } = q
        ? await qdApi.get(`/InspectionProcessView/search/${q}`)
        : await qdApi.get('/InspectionProcessView');
      const list = Array.isArray(data) ? data : [];
      setRows(list.map(normalizeRow).filter((x) => x.id > 0));
    } catch (e) {
      console.error('Fetch Data Error:', e);
      const msg = e?.response?.data?.message || e?.message || 'Failed to load data';
      setError(typeof msg === 'string' ? msg : 'Failed to load data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load shows all records; typing search filters by PO.
  useEffect(() => {
    fetchData({ poNo });
  }, [fetchData, poNo]);

  const handleSearch = useCallback(() => {
    fetchData({ poNo });
  }, [fetchData, poNo]);

  const handleViewPdf = useCallback(async (id) => {
    setReportLoading(true);
    setReportData(null);
    pdfView.onTrue();
    try {
        const response = await qdApi.get(`/InspectionProcessView/${id}/report-data`);
        setReportData(response.data);
    } catch (err) {
        console.error('Failed to load report data:', err);
        pdfView.onFalse();
        window.alert('Failed to load report data. Please check API connection.');
    } finally {
        setReportLoading(false);
    }
  }, [pdfView]);

  // ─── Columns ─────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        field: 'insp_Type',
        headerName: 'Inspection Type',
        minWidth: 140,
        flex: 0.5,
      },
      {
        field: 'inspAutoNo',
        headerName: 'Insp. Sample #',
        minWidth: 140,
        flex: 0.5,
      },
      {
        field: 'receivedDate',
        headerName: 'Received Date',
        minWidth: 130,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'pono',
        headerName: 'PO #',
        minWidth: 120,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'reviewDate',
        headerName: 'Review Date',
        minWidth: 130,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'pdf',
        headerName: 'PDF',
        minWidth: 70,
        width: 70,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="View PDF">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleViewPdf(params.row.id)}
            >
              <PictureAsPdfIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
      {
        field: 'edit',
        headerName: 'Edit',
        minWidth: 80,
        width: 80,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const to = `${paths.dashboard.qdProcessEntry}?lPOID=${params.row.poid}&InspType=${encodeURIComponent(
            params.row.insp_Type
          )}&lInspectionTNAProcMstID=${encodeURIComponent(params.row.inspectionTNAProcMstID)}`;
          return (
            <Tooltip title="Edit inspection">
              <Link
                component={RouterLink}
                to={to}
                underline="hover"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'primary.main',
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                <EditIcon fontSize="small" />
                Edit
              </Link>
            </Tooltip>
          );
        },
      },
    ],
    [handleViewPdf]
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="Sample Inspection View"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Supply Chain', href: paths.dashboard.root },
          { name: 'Sample Inspection View' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Card
        variant="outlined"
        sx={{
          p: 2,
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
      >
        {/* Title */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Sample Inspection View
        </Typography>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search bar */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'flex-end' }}
          sx={{ mb: 2 }}
        >
          <TextField
            label="Search for PO # ..."
            size="small"
            value={poNo}
            onChange={(e) => setPoNo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            sx={{ minWidth: { xs: '100%', sm: 280 } }}
            placeholder="Search for PO # ...."
          />

          <Button
            variant="contained"
            color="primary"
            sx={{ minWidth: 140, height: 40 }}
            disabled={loading}
            onClick={handleSearch}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Stack>

        {/* Grid */}
        <Paper variant="outlined" sx={{ borderRadius: 0, overflow: 'hidden' }}>
          <Box sx={{ height: 500 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              rowHeight={46}
              pageSizeOptions={[25, 60, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f4f6f8',
                  color: '#374151',
                  borderBottom: '1px solid #DFE3E8',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                },
                '& .MuiDataGrid-cell': {
                    borderColor: '#DFE3E8',
                }
              }}
            />
          </Box>
        </Paper>
      </Card>

      <Dialog fullScreen open={pdfView.value}>
        <Box sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <DialogActions sx={{ p: 1.5 }}>
            <Button color="inherit" variant="contained" onClick={pdfView.onFalse}>
              Close
            </Button>
          </DialogActions>

          <Box sx={{ flexGrow: 1, height: 1, overflow: 'hidden' }}>
            {reportLoading ? (
                <Stack sx={{ height: 1 }} alignItems="center" justifyContent="center">
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading Report Data...</Typography>
                </Stack>
            ) : reportData ? (
                <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                    <InspectionProcessPDF data={reportData} />
                </PDFViewer>
            ) : (
                <Stack sx={{ height: 1 }} alignItems="center" justifyContent="center">
                    <Typography>No data available for this report.</Typography>
                </Stack>
            )}
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
}
