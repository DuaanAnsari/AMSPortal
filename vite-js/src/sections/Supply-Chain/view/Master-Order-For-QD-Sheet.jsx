import { useCallback, useEffect, useMemo, useState } from 'react';

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
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FactCheckIcon from '@mui/icons-material/FactCheck';

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
    // Pass isMPCCreated so the Inspection page can guard Final
    isMPCCreated,
  };
}

export default function MasterOrderForQDSheetView() {
  const navigate = useNavigate();
  const [filteringItem, setFilteringItem] = useState('no');
  const [poNo, setPoNo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const [inlineFilters, setInlineFilters] = useState({});

  const filteredRows = useMemo(() => {
    const list = rows.filter((r) => {
      for (const [field, val] of Object.entries(inlineFilters)) {
        if (!val) continue;
        const cellValue = String(r[field] || '').toLowerCase();
        if (!cellValue.includes(val.toLowerCase())) {
          return false;
        }
      }
      return true;
    });

    if (filteringItem === 'yes') {
      return [{ id: 'FILTER_ROW_STATIC', isFilterRow: true }, ...list];
    }
    return list;
  }, [rows, inlineFilters, filteringItem]);

  const handleFilterChange = (field, value) => {
    setInlineFilters((prev) => ({ ...prev, [field]: value }));
  };

  const RawColumns = useMemo(
    () => [
      { field: 'customer', headerName: 'Customer', minWidth: 170, flex: 0.6 },
      { field: 'supplier', headerName: 'Supplier', minWidth: 230, flex: 0.7 },
      { field: 'ams', headerName: 'AMS', minWidth: 70 },
      { field: 'merchant', headerName: 'Merchant', minWidth: 180, flex: 0.5 },
      { field: 'season', headerName: 'Season', minWidth: 95 },
      { field: 'productGroup', headerName: 'Product Group', minWidth: 130 },
      { field: 'composition', headerName: 'Composition', minWidth: 120 },
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
      // ── Single Inspection button (replaces IPC / MPC / Pre-Final / Final columns) ──
      {
        field: 'inspection',
        headerName: 'Inspection',
        minWidth: 130,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Open QD Inspection (IPC / MPC / Pre-Final / Final)" arrow>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<FactCheckIcon fontSize="small" />}
              onClick={() =>
                navigate(
                  `${paths.dashboard.qdInspection}?poid=${params.row.poid}&inspType=IPC&isMPCCreated=${params.row.isMPCCreated ?? 0}`
                )
              }
              sx={{ fontSize: 12, px: 1.5, py: 0.5, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Inspection
            </Button>
          </Tooltip>
        ),
      },
      // ── View PO ────────────────────────────────────────────────────────────────────
      {
        field: 'viewPO',
        headerName: 'View PO',
        minWidth: 95,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`${paths.dashboard.qdPoPreview}?poid=${params.row.poid}`)}
            sx={{ fontSize: 12, px: 1, py: 0.5, textTransform: 'none' }}
          >
            PO View
          </Button>
        ),
      },
      // ── Single Process Entry button (replaces PF / DL / SO / PPS / SS columns) ──
      {
        field: 'processEntry',
        headerName: 'Process Entry',
        minWidth: 145,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Open Process Entry (PF / DL / SO / PPS / SS)" arrow>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={() =>
                navigate(
                  `${paths.dashboard.qdProcessEntry}?poid=${params.row.poid}&inspType=${encodeURIComponent('Proto Fit')}`
                )
              }
              sx={{ fontSize: 12, px: 1.5, py: 0.5, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Process Entry
            </Button>
          </Tooltip>
        ),
      },
    ],
    [navigate]
  );

  const filterSortComparator = (v1, v2, cellParams1, cellParams2) => {
    // Keep filter row at the top by checking the row ID
    if (cellParams1.id === 'FILTER_ROW_STATIC') return -1;
    if (cellParams2.id === 'FILTER_ROW_STATIC') return 1;

    // Standard fallback comparison
    if (v1 === v2) return 0;
    if (v1 === null || v1 === undefined) return -1;
    if (v2 === null || v2 === undefined) return 1;
    if (typeof v1 === 'number' && typeof v2 === 'number') return v1 - v2;
    return String(v1).localeCompare(String(v2), undefined, { numeric: true });
  };

  const columns = useMemo(() => {
    return RawColumns.map((col) => {
      const isActionCol = ['inspection', 'viewPO', 'processEntry'].includes(col.field);

      return {
        ...col,
        sortComparator: filterSortComparator,
        renderCell: (params) => {
          if (params.row.isFilterRow) {
            if (isActionCol) return null;
            return (
              <Box onClick={(e) => e.stopPropagation()} sx={{ width: '100%', px: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Filter..."
                  value={inlineFilters[col.field] || ''}
                  onChange={(e) => handleFilterChange(col.field, e.target.value)}
                  sx={{
                    '& .MuiInputBase-root': { height: 30, fontSize: 13, bgcolor: '#fff' },
                  }}
                />
              </Box>
            );
          }

          // Return original renderCell if present (for normal rows on action cols)
          if (col.renderCell) {
            return col.renderCell(params);
          }
          return params.value;
        },
      };
    });
  }, [RawColumns, inlineFilters]);

  // Handle resetting inline filters if "No" is chosen
  useEffect(() => {
    if (filteringItem === 'no') {
      setInlineFilters({});
    }
  }, [filteringItem]);


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

          <Box sx={{ height: 500 }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              disableColumnFilter={filteringItem === 'no'}
              rowHeight={50}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#e0e0e0',
                  color: '#374151',
                  borderBottom: '1px solid #d9d9d9',
                  lineHeight: 'normal',
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
                '& .MuiDataGrid-row[data-id="FILTER_ROW_STATIC"]': {
                  bgcolor: '#f5f5f5 !important', // light grey background like header
                  borderBottom: '2px solid #ccc',
                  '&:hover': {
                    bgcolor: '#f5f5f5 !important',
                  },
                },
              }}
            />
          </Box>
        </Paper>
      </Card>
    </Container>
  );
}
