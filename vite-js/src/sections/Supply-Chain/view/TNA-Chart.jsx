import { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Card,
  Container,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';
import axios from 'axios';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------
// AG Grid setup (same as Edit Order)
// ----------------------------------------------------------------------

LicenseManager.setLicenseKey(
  "Using_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-077aborr}_{granted_to_AMS_Baig_&_Co}_{for_application_{AMS_Portal}_is_not_permitted_for_apps_not_developed_in_partnership_with_AMS_Baig_&_Co}_{This_key_has_not_been_granted_a_Deployment_License_Add-on}_{This_key_works_with_{AG_Charts_and_AG_Grid}_Enterprise_versions_released_before_{28_April_2026}}_{[v3]_[0102]_MTc0NTc5NDgwMDAwMA==69c9a0c4f82299b15b7fc24c8226fac3}"
);
ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------------------------------------

export default function TNAChartPage() {
  const theme = useTheme();

  const [tableData, setTableData] = useState([]);
  const [allTableData, setAllTableData] = useState([]);
  const [productPortfolios, setProductPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [loading, setLoading] = useState(false);
  const [poSearch, setPoSearch] = useState('');

  const containerStyle = useMemo(
    () => ({
      width: '100%',
      height: '400px',
    }),
    []
  );

  const [columnDefs, setColumnDefs] = useState([]);

  // Fetch product portfolios for filter
  useEffect(() => {
    const fetchProductPortfolios = async () => {
      try {
        const response = await apiClient.get('/MyOrders/GetProductPortfolio');
        const list = response.data || [];
        setProductPortfolios(list);
        // Default: first portfolio + auto load
        if (list.length && !selectedPortfolio) {
          const firstId = list[0].productPortfolioID;
          setSelectedPortfolio(firstId);
          handleSearch(firstId);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching product portfolios for TNA Chart:', error);
      }
    };

    fetchProductPortfolios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (portfolioId) => {
    const idToUse = portfolioId || selectedPortfolio;

    if (!idToUse) {
      setTableData([]);
      setAllTableData([]);
      setColumnDefs([]);
      return;
    }

    setLoading(true);
    try {
      const [processRes, poRes] = await Promise.all([
        apiClient
          .get(`/Milestone/GetprocessByPortfolio?productPortfolioId=${idToUse}`)
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Process API Error', err);
            return { data: [] };
          }),
        apiClient
          .get(`/Milestone/GetTNAandPO?PortfolioID=${idToUse}`)
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('TNA API Error', err);
            return { data: [] };
          }),
      ]);

      const processList = (processRes.data || []).filter((p) => !!p);
      const poData = poRes.data || [];

      // 1. Construct Columns (group headers)
      const newColDefs = [
        { headerName: 'PO No', field: 'poNo', pinned: 'left', minWidth: 110 },
        ...processList.map((proc) => ({
          headerName: proc,
          children: [
            { headerName: 'Ideal Date', field: `${proc}_idealDate`, minWidth: 95 },
            { headerName: 'Actual Date', field: `${proc}_actualDate`, minWidth: 95 },
            { headerName: 'Approval Date', field: `${proc}_approvalDatee`, minWidth: 110 },
            { headerName: 'Est. Date', field: `${proc}_estimatedDate`, minWidth: 110 },
            { headerName: 'Date Span', field: `${proc}_dateSpan`, minWidth: 80 },
          ],
        })),
        { headerName: 'Status', field: 'status', minWidth: 110 },
        { headerName: 'Qty Completed', field: 'qtyCompleted', minWidth: 120 },
        { headerName: 'Freeze Cond PP Sample', field: 'freezeCondPPSample', minWidth: 160 },
      ];
      setColumnDefs(newColDefs);

      // 2. Pivot Data: one row per PO, processes as column groups
      const rowMap = new Map();

      poData.forEach((item) => {
        if (!item.poid) return;

        if (!rowMap.has(item.poid)) {
          rowMap.set(item.poid, {
            poid: item.poid,
            poNo: item.poNo,
            status: item.status,
            qtyCompleted: item.qtyCompleted,
            freezeCondPPSample: item.freezeCondPPSample,
          });
        }
        const row = rowMap.get(item.poid);
        if (item.process) {
          row[`${item.process}_idealDate`] = item.idealDate;
          row[`${item.process}_actualDate`] = item.actualDate;
          row[`${item.process}_approvalDatee`] = item.approvalDatee;
          row[`${item.process}_estimatedDate`] = item.estimatedDate;
          row[`${item.process}_dateSpan`] = item.dateSpan;
        }
      });

      const finalData = Array.from(rowMap.values()).sort((a, b) => b.poid - a.poid);
      // eslint-disable-next-line no-console
      console.log('Grid Data:', finalData);
      setAllTableData(finalData);

      if (poSearch) {
        const lowered = poSearch.toLowerCase();
        setTableData(
          finalData.filter((row) => String(row.poNo || '').toLowerCase().includes(lowered))
        );
      } else {
        setTableData(finalData);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching TNA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioChange = (event) => {
    const value = event.target.value;
    setSelectedPortfolio(value);
    handleSearch(value);
  };

  // Apply PO search filter on existing data
  useEffect(() => {
    if (!poSearch) {
      setTableData(allTableData);
      return;
    }
    const lowered = poSearch.toLowerCase();
    setTableData(
      allTableData.filter((row) => String(row.poNo || '').toLowerCase().includes(lowered))
    );
  }, [poSearch, allTableData]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="TNA Chart"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Purchase Orders', href: paths.dashboard.supplyChain.root },
          { name: 'TNA Chart' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ minWidth: 260, maxWidth: 320 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Product Portfolio"
                value={selectedPortfolio}
                onChange={handlePortfolioChange}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: { maxHeight: 300 },
                    },
                  },
                }}
              >
                <MenuItem value="">
                  Product Portfolio
                </MenuItem>
                {productPortfolios.map((p) => (
                  <MenuItem key={p.productPortfolioID} value={p.productPortfolioID}>
                    {p.productPortfolio}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          <Box sx={{ maxWidth: 320 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}
            >
              Search by PO No
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter PO No"
              value={poSearch}
              onChange={(e) => setPoSearch(e.target.value)}
            />
          </Box>
        </Box>
      </Card>

      {/* Grid card */}
      <Card sx={{ p: 2 }}>
        <Box
          style={containerStyle}
          sx={{
            position: 'relative',
            '& .ag-header-cell, & .ag-header-group-cell': {
              paddingLeft: '4px !important',
              paddingRight: '4px !important',
            },
            '& .ag-header-cell-label, & .ag-header-group-cell-label': {
              justifyContent: 'center',
            },
            '& .ag-header-group-cell': {
              borderBottom: `1px solid ${theme.palette.divider} !important`,
            },
            '& .ag-cell': {
              paddingLeft: '4px !important',
              paddingRight: '4px !important',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            },
            '& .ag-header-cell-text': {
              fontSize: '12px',
              textAlign: 'center',
              lineHeight: '1.2',
              whiteSpace: 'normal',
            },
            '& .ag-root-wrapper, & .ag-root, & .ag-body-viewport, & .ag-header, & .ag-header-viewport, & .ag-center-cols-viewport':
            {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
            '& .ag-row, & .ag-cell': {
              backgroundColor: 'inherit',
              color: 'inherit',
            },
            '& .ag-paging-panel': {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              borderTop: `1px solid ${theme.palette.divider}`,
            },
            '& .ag-paging-panel .ag-input-field-input, & .ag-paging-panel .ag-picker-field-wrapper': {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
            },
          }}
        >
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(0,0,0,0.4)'
                    : 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <Box
                sx={{
                  px: 3.5,
                  py: 2.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: theme.shadows[6],
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <CircularProgress size={28} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Loading TNA data...
                </Typography>
              </Box>
            </Box>
          )}
          <div style={{ width: '100%', height: '100%' }}>
            <AgGridReact
              rowData={tableData}
              columnDefs={columnDefs}
              headerHeight={40}
              groupHeaderHeight={40}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                suppressHeaderMenuButton: true,
              }}
              rowDragManaged={false}
              animateRows
              pagination
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 30]}
            />
          </div>
        </Box>
      </Card>
    </Container>
  );
}

