import { useCallback, useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CircularProgress from '@mui/material/CircularProgress';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';
import { useSnackbar } from 'src/components/snackbar';
import { pdf } from '@react-pdf/renderer';

import QAInspectionPDF from './QA-Inspection-PDF';

// ----------------------------------------------------------------------

const INSP_TYPES = ['ALL', 'IPC', 'MPC', 'Pre-Final', 'Final'];

export default function QAInspectionView() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState({
    poNo: '',
    customerId: 0,
    supplierId: 0,
    inspType: 'ALL',
  });

  const [filterOptions, setFilterOptions] = useState({
    customers: [],
    suppliers: [],
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFilters = useCallback(async () => {
    try {
      const { data } = await qdApi.get('/QAInspection/filters');
      setFilterOptions({
        customers: data.customers || [],
        suppliers: data.suppliers || [],
      });
    } catch (e) {
      console.error('Failed to fetch filter options', e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await qdApi.get('/QAInspection', {
        params: {
          poNo: filters.poNo,
          customerId: filters.customerId,
          supplierId: filters.supplierId,
          inspType: filters.inspType,
        },
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilters();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFilters]);

  const handleApprove = async (id, currentVal) => {
    if (currentVal) return; // already approved
    try {
      await qdApi.post(`/QAInspection/approve/${id}`);
      enqueueSnackbar('Inspection approved successfully');
      fetchData(); // reload
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || 'Approval failed', { variant: 'error' });
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };



  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const handleViewPdf = async (mstId) => {
    setPdfLoadingId(mstId);
    try {
      const { data } = await qdApi.get(`/QAInspection/inspection-report-data`, {
        params: { qdMstId: mstId }
      });
      if (!data) {
        enqueueSnackbar('No data found for this report', { variant: 'warning' });
        return;
      }

      const blob = await pdf(<QAInspectionPDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error('PDF Generation failed', e);
      const msg = e?.response?.data?.message || 'Failed to generate PDF';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setPdfLoadingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: 'qaName',
        headerName: 'QA Name',
        flex: 1,
        minWidth: 120,
      },
      {
        field: 'mstInspectionDate',
        headerName: 'Inspection Date',
        flex: 0.9,
        minWidth: 100,
        valueFormatter: ({ value }) => {
          if (!value) return '';
          try {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return value;
            return date.toLocaleDateString('en-GB');
          } catch {
            return value;
          }
        },
      },
      {
        field: 'inspNo',
        headerName: 'Insp No.',
        flex: 1.4,
        minWidth: 150,
      },
      {
        field: 'aqlRange',
        headerName: 'AQL Range',
        flex: 1.2,
        minWidth: 130,
      },
      {
        field: 'pdf',
        headerName: 'PDF',
        width: 80,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Tooltip title="Download PDF">
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={pdfLoadingId === params.row.qdInspectionMstID}
                onClick={() => handleViewPdf(params.row.qdInspectionMstID)}
              >
                {pdfLoadingId === params.row.qdInspectionMstID ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <PictureAsPdfIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        ),
      },
      {
        field: 'edit',
        headerName: 'Edit',
        width: 80,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Tooltip title="Edit Inspection">
            <IconButton
              size="small"
              color="primary"
              onClick={() =>
                navigate(
                  `${paths.dashboard.qdInspection}?poid=${params.row.poid}&inspType=${params.row.inspectionType}&qdInspectionMstId=${params.row.qdInspectionMstID}`
                )
              }
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, pdfLoadingId]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="QUALITY DEPARTMENT INSPECTION VIEW"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'QA Inspection View' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Card variant="outlined" sx={{ p: 2, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          QA Inspection Records
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-end" sx={{ mb: 3 }}>
          <TextField
            label="PO No:"
            placeholder="Search For PO # ...."
            size="small"
            value={filters.poNo}
            onChange={(e) => handleFilterChange('poNo', e.target.value)}
            sx={{ flex: 1 }}
          />

          <TextField
             select
             label="Customer:"
             size="small"
             value={filters.customerId}
             onChange={(e) => handleFilterChange('customerId', e.target.value)}
             sx={{ flex: 1.5, minWidth: 200 }}
          >
            <MenuItem value={0}>All Customer</MenuItem>
            {filterOptions.customers.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </TextField>

          <TextField
             select
             label="Supplier:"
             size="small"
             value={filters.supplierId}
             onChange={(e) => handleFilterChange('supplierId', e.target.value)}
             sx={{ flex: 1.5, minWidth: 200 }}
          >
            <MenuItem value={0}>All Supplier</MenuItem>
            {filterOptions.suppliers.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </TextField>

          <TextField
             select
             label="Insp Type:"
             size="small"
             value={filters.inspType}
             onChange={(e) => handleFilterChange('inspType', e.target.value)}
             sx={{ width: 150 }}
          >
            {INSP_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={fetchData}
            sx={{ 
              height: 40, 
              px: 5, 
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Search
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ height: 600, overflow: 'hidden' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.qdInspectionMstID}
            loading={loading}
            disableRowSelectionOnClick
            rowHeight={50}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#e0e0e0',
                color: '#374151',
                borderBottom: '1px solid #d9d9d9',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                color: '#374151',
              },
              '& .MuiDataGrid-cell': {
                borderColor: '#d9d9d9',
              },
            }}
          />
        </Paper>
      </Card>
    </Container>
  );
}
