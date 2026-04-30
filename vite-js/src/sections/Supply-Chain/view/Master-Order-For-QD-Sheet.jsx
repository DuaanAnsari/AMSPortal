import { useCallback, useEffect, useMemo, useState, useRef } from 'react';

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
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';

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
  
  // --- Drag to Scroll Logic ---
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e) => {
    // Avoid dragging when clicking on inputs or buttons
    if (e.target.closest('button') || e.target.closest('.MuiInputBase-root')) return;

    const scroller = scrollRef.current?.querySelector('.MuiDataGrid-virtualScroller');
    if (!scroller) return;

    setIsDragging(true);
    setStartX(e.pageX - scroller.offsetLeft);
    setScrollLeftState(scroller.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const scroller = scrollRef.current?.querySelector('.MuiDataGrid-virtualScroller');
    if (!scroller) return;

    const x = e.pageX - scroller.offsetLeft;
    const walk = (x - startX) * 1.5; // scrolling speed
    scroller.scrollLeft = scrollLeftState - walk;
  };

  const stopDragging = () => setIsDragging(false);
  // -----------------------------

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
    () => {
      const renderTruncatedCell = (params) => {
        const value = params.value ? String(params.value) : '';
        if (value.length <= 12) return value;
        return (
          <Tooltip title={value} arrow placement="top">
            <span>{`${value.substring(0, 12)}...`}</span>
          </Tooltip>
        );
      };

      return [
        { field: 'customer', headerName: 'Customer', minWidth: 120, flex: 0.4, renderCell: renderTruncatedCell },
        { field: 'supplier', headerName: 'Supplier', minWidth: 120, flex: 0.4, renderCell: renderTruncatedCell },
        { field: 'ams', headerName: 'AMS', minWidth: 70 },
        { field: 'merchant', headerName: 'Merchant', minWidth: 120, flex: 0.4, renderCell: renderTruncatedCell },
        { field: 'season', headerName: 'Season', minWidth: 95 },
        { field: 'productGroup', headerName: 'Product Group', minWidth: 110, renderCell: renderTruncatedCell },
        { field: 'composition', headerName: 'Composition', minWidth: 110, renderCell: renderTruncatedCell },
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
            <IconButton
              size="small"
              onClick={() =>
                navigate(
                  `${paths.dashboard.qdInspection}?poid=${params.row.poid}&inspType=IPC&isMPCCreated=${params.row.isMPCCreated ?? 0}`
                )
              }
              sx={{ color: '#22c55e' }}
            >
              <AssignmentTurnedInIcon />
            </IconButton>
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
          <Tooltip title="PO View" arrow>
            <IconButton
              size="small"
              onClick={() => navigate(`${paths.dashboard.qdPoPreview}?poid=${params.row.poid}`)}
              sx={{ color: 'text.primary' }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        ),
      },
      // ── Single Process Entry button (replaces PF / DL / SO / PPS / SS columns) ──
      {
        field: 'processEntry',
        headerName: 'Sample',
        minWidth: 145,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Open Process Entry (PF / DL / SO / PPS / SS)" arrow>
            <IconButton
              size="small"
              onClick={() =>
                navigate(
                  `${paths.dashboard.qdProcessEntry}?poid=${params.row.poid}&inspType=${encodeURIComponent('Proto Fit')}`
                )
              }
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: '#212b36',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                }}
              >
                <AssignmentIcon sx={{ fontSize: 16, color: '#fff' }} />
              </Avatar>
            </IconButton>
          </Tooltip>
        ),
        },
      ];
    },
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

          <Box 
            ref={scrollRef}
            sx={{ 
              height: 500,
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: isDragging ? 'none' : 'auto'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
          >
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
