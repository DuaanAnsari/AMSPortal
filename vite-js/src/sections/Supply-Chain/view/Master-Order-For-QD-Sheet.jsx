import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { DataGrid } from '@mui/x-data-grid';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

// ----------------------------------------------------------------------

/** Map API row (camelCase or PascalCase) to grid row */
function mapApiRow(r) {
  const poid = r.poid ?? r.POID;
  const isMPCCreated = r.isMPCCreated ?? r.IsMPCCreated ?? 0;
  return {
    id: poid,
    poid,
    customer: r.customerName ?? r.CustomerName ?? '',
    supplier: r.venderName ?? r.VenderName ?? '',
    ams: String(r.ecpdivistion ?? r.ECPDivistion ?? ''),
    merchant: String(r.userName ?? r.UserName ?? ''),
    season: r.season ?? r.Season ?? '',
    productGroup: r.productGroup ?? r.ProductGroup ?? '',
    composition: r.composition ?? r.Composition ?? '',
    poNumber: r.pono ?? r.PONO ?? '',
    itemQty: r.itemQty ?? r.ItemQty ?? null,
    claimQty: r.claimQty ?? r.ClaimQty ?? null,
    shipmentDate: r.shipmentDate ?? r.ShipmentDate ?? '',
    wipStatus: r.actualWp ?? r.ActualWp ?? '',
    finalPassQty: r.inspectedQty ?? r.InspectedQty ?? null,
    isMPCCreated,
  };
}

export default function MasterOrderForQDSheetView() {
  const navigate = useNavigate();
  const [filteringItem, setFilteringItem] = useState('yes');
  const [poNo, setPoNo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Drag-to-scroll (same as My-Order) ─────────────────────────────
  const tableContainerRef = useRef(null);
  const [isDragging,  setIsDragging]  = useState(false);
  const [startX,      setStartX]      = useState(0);
  const [scrollLeft,  setScrollLeft]  = useState(0);

  const getScroller = () =>
    tableContainerRef.current?.querySelector('.MuiDataGrid-virtualScroller') ??
    tableContainerRef.current;

  const handleMouseDown = (e) => {
    if (e.target.closest('button, a, input, [role="columnheader"]')) return;
    const scroller = getScroller();
    if (!scroller) return;
    setIsDragging(true);
    setStartX(e.pageX - scroller.offsetLeft);
    setScrollLeft(scroller.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp    = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const scroller = getScroller();
    if (!scroller) return;
    const x    = e.pageX - scroller.offsetLeft;
    const walk = (x - startX) * 2;
    scroller.scrollLeft = scrollLeft - walk;
  };

  const fetchData = useCallback(async (searchPoNo) => {
    setLoading(true);
    setError(null);
    try {
      const q = searchPoNo?.trim() ?? '';
      const { data } = await qdApi.get('/MasterOrderForQDSheet', {
        params: q ? { poNo: q } : {},
      });
      const list = Array.isArray(data) ? data : [];
      setRows(list.map(mapApiRow));
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data ||
        e?.message ||
        'Failed to load data';
      setError(typeof msg === 'string' ? msg : 'Failed to load data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData('');
  }, [fetchData]);

  const columns = useMemo(
    () => [
      {
        field: 'customer', headerName: 'Customer', minWidth: 120,
        renderCell: (params) => (
          <Tooltip title={params.value || ''}>
            <Box component="span">
              {params.value?.length > 12 ? `${params.value.slice(0, 12)}...` : params.value}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: 'supplier', headerName: 'Supplier', minWidth: 120,
        renderCell: (params) => (
          <Tooltip title={params.value || ''}>
            <Box component="span">
              {params.value?.length > 12 ? `${params.value.slice(0, 12)}...` : params.value}
            </Box>
          </Tooltip>
        ),
      },
      { field: 'ams', headerName: 'AMS', minWidth: 70 },
      {
        field: 'merchant', headerName: 'Merchant', minWidth: 120,
        renderCell: (params) => (
          <Tooltip title={params.value || ''}>
            <Box component="span">
              {params.value?.length > 12 ? `${params.value.slice(0, 12)}...` : params.value}
            </Box>
          </Tooltip>
        ),
      },
      { field: 'season', headerName: 'Season', minWidth: 95 },
      {
        field: 'productGroup', headerName: 'Product Group', minWidth: 110,
        renderCell: (params) => (
          <Tooltip title={params.value || ''}>
            <Box component="span">
              {params.value?.length > 12 ? `${params.value.slice(0, 12)}...` : params.value}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: 'composition', headerName: 'Composition', minWidth: 110,
        renderCell: (params) => (
          <Tooltip title={params.value || ''}>
            <Box component="span">
              {params.value?.length > 12 ? `${params.value.slice(0, 12)}...` : params.value}
            </Box>
          </Tooltip>
        ),
      },
      { field: 'poNumber', headerName: 'PO NO.', minWidth: 105 },
      {
        field: 'itemQty',
        headerName: 'Item Qty',
        minWidth: 85,
        align: 'center',
        headerAlign: 'center',
        type: 'number',
      },
      {
        field: 'claimQty',
        headerName: 'Claim Qty',
        minWidth: 90,
        align: 'center',
        headerAlign: 'center',
        type: 'number',
      },
      { field: 'shipmentDate', headerName: 'Shipment Date', minWidth: 120 },
      { field: 'wipStatus', headerName: 'WIP Status', minWidth: 90, align: 'center', headerAlign: 'center' },
      {
        field: 'finalPassQty',
        headerName: 'Final Pass Qty',
        minWidth: 120,
        align: 'center',
        headerAlign: 'center',
        type: 'number',
      },
      {
        field: 'inspection',
        headerName: 'Inspection',
        minWidth: 90,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Open Inspection">
            <IconButton
              size="small"
              onClick={() =>
                navigate(
                  `${paths.dashboard.qdInspection}?poid=${params.row.poid}&inspType=IPC`
                )
              }
              sx={{ color: 'success.main' }}
            >
              <AssignmentTurnedInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
      {
        field: 'viewPO',
        headerName: 'View PO',
        minWidth: 80,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="View PO">
            <IconButton
              size="small"
              color="primary"
              onClick={() =>
                navigate(`${paths.dashboard.qdPoPreview}?poid=${params.row.poid}`)
              }
            >
              <RemoveRedEyeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
      {
        field: 'protoFit',
        headerName: 'Sample',
        minWidth: 80,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Proto Fit">
            <IconButton
              size="small"
              onClick={() =>
                navigate(
                  `${paths.dashboard.qdProcessEntry}?poid=${params.row.poid}&inspType=${encodeURIComponent('Proto Fit')}`
                )
              }
              sx={{
                bgcolor: '#222',
                color: '#fff',
                borderRadius: 1,
                p: '3px',
                '&:hover': { bgcolor: '#444' },
              }}
            >
              <NoteAltIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="MASTER ORDER FOR QD SHEET"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'MASTER ORDER FOR QD SHEET' },
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
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Master Order For QDSheet
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }} sx={{ mb: 2 }}>
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Show filtering item
            </Typography>
            <RadioGroup
              row
              value={filteringItem}
              onChange={(e) => setFilteringItem(e.target.value)}
            >
              <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
              <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
            </RadioGroup>
          </Box>

          <TextField
            label="PO No:"
            size="small"
            value={poNo}
            onChange={(e) => setPoNo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchData(poNo);
            }}
            sx={{ minWidth: { xs: '100%', md: 320 } }}
          />

          <Button
            variant="contained"
            color="primary"
            sx={{ minWidth: 140, height: 40 }}
            disabled={loading}
            onClick={() => fetchData(poNo)}
          >
            Search
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 0, overflow: 'hidden' }}>
          <Box
            sx={{
              px: 2,
              py: 1,
              fontSize: 14,
              color: 'text.secondary',
              textAlign: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: '#f5f5f5',
            }}
          >
            Drag a column header and drop it here to group by that column
          </Box>

          <Box
            ref={tableContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            sx={{
              height: 430,
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: isDragging ? 'none' : 'auto',
              overflowX: 'auto',
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.400', borderRadius: 3 },
              '&::-webkit-scrollbar-track': { bgcolor: 'grey.100' },
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              disableColumnFilter={filteringItem === 'no'}
              rowHeight={46}
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
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                },
                '& .MuiDataGrid-columnSeparator': {
                  color: 'rgba(55,65,81,0.35)',
                },
                '& .MuiDataGrid-cell': {
                  borderColor: '#d9d9d9',
                  fontSize: 14,
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                  outline: 'none',
                },
                '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                  outline: 'none',
                },
              }}
            />
          </Box>
        </Paper>
      </Card>
    </Container>
  );
}
