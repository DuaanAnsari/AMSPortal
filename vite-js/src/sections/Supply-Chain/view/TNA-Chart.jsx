import { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Card,
  Container,
  Typography,
  TextField,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
  themeBalham,
  colorSchemeDarkBlue,
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
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------------------------------------
// Static demo data for TNA Chart (Process Routes)
// ----------------------------------------------------------------------

const STATIC_TNA_ROWS = [
  {
    id: 1,
    processRoute: 'Driling of Holes',
    targetDate: 'Dec 13, 2025',
    factoryCommitmentDate: '12/13/2025',
    submissionDate: '',
    approvalDate: '',
    quantityCompleted: '',
    unit: '',
    status: '',
    remarks: '',
    details: [
      { step: 'Machine Allocation', owner: 'Factory', note: 'Assign drilling machines' },
      { step: 'Tool Changeover', owner: 'Maintenance', note: 'Set correct drill bits' },
      { step: 'Pilot Holes', owner: 'Factory', note: 'Drill pilot holes on all pieces' },
      { step: 'Final Drilling', owner: 'Factory', note: 'Drill to final diameter' },
      { step: 'Final QC Check', owner: 'QA', note: 'Sign-off for next process' },
    ],
  },
  {
    id: 2,
    processRoute: 'Equal Shaping',
    targetDate: 'Dec 13, 2025',
    factoryCommitmentDate: '12/13/2025',
    submissionDate: '',
    approvalDate: '',
    quantityCompleted: '',
    unit: '',
    status: '',
    remarks: '',
    details: [
      { step: 'Pre-Cutting', owner: 'Factory', note: 'Rough cut to near size' },
      { step: 'Trimming', owner: 'Factory', note: 'Trim edges for equal shape' },
      { step: 'Edge Rounding', owner: 'Factory', note: 'Smooth all sharp corners' },
      { step: 'Template Check', owner: 'QA', note: 'Match with approved template' },
      { step: 'Final Measurement', owner: 'QA', note: 'Confirm final dimensions' },
    ],
  },
  {
    id: 3,
    processRoute: 'Washing',
    targetDate: 'Dec 13, 2025',
    factoryCommitmentDate: '12/13/2025',
    submissionDate: '',
    approvalDate: '',
    quantityCompleted: '',
    unit: '',
    status: '',
    remarks: '',
    details: [
      { step: 'Pre-Wash', owner: 'Factory', note: 'Remove dust before main wash' },
      { step: 'Detergent Prep', owner: 'Factory', note: 'Prepare chemical mix' },
      { step: 'Main Wash', owner: 'Factory', note: 'Run programmed wash cycle' },
      { step: 'Rinse', owner: 'Factory', note: 'Rinse to remove chemicals' },
      { step: 'Shade Approval', owner: 'QA', note: 'Confirm shade and appearance' },
    ],
  },
  {
    id: 4,
    processRoute: 'Both end drilling for screws',
    targetDate: 'Dec 13, 2025',
    factoryCommitmentDate: '12/13/2025',
    submissionDate: '',
    approvalDate: '',
    quantityCompleted: '',
    unit: '',
    status: '',
    remarks: '',
    details: [
      { step: 'Fixture Setup', owner: 'Factory', note: 'Set jig for both ends' },
      { step: 'Left End Drilling', owner: 'Factory', note: 'Drill left side holes' },
      { step: 'Right End Drilling', owner: 'Factory', note: 'Drill right side holes' },
      { step: 'Hole Alignment Check', owner: 'QA', note: 'Check alignment across ends' },
      { step: 'QC Sign-off', owner: 'QA', note: 'Approve for next operation' },
    ],
  },
  {
    id: 5,
    processRoute: 'Skrn Warp',
    targetDate: 'Dec 13, 2025',
    factoryCommitmentDate: '12/13/2025',
    submissionDate: '',
    approvalDate: '',
    quantityCompleted: '',
    unit: '',
    status: '',
    remarks: '',
    details: [
      { step: 'Warp Planning', owner: 'Planning', note: 'Issue warp plan to production' },
      { step: 'Warp Preparation', owner: 'Factory', note: 'Prepare warp threads' },
      { step: 'Beam Loading', owner: 'Factory', note: 'Load warp beams on machine' },
      { step: 'Tension Setting', owner: 'Factory', note: 'Set correct tension' },
      { step: 'Quality Check', owner: 'QA', note: 'Inspect trial sample' },
    ],
  },
  {
    id: 6,
    processRoute: 'Base Sitting',
    targetDate: 'Dec 13, 2025',
    factoryCommitmentDate: '12/13/2025',
    submissionDate: '',
    approvalDate: '',
    quantityCompleted: '',
    unit: '',
    status: '',
    remarks: '',
    details: [
      { step: 'Material Check', owner: 'QA', note: 'Verify base material quality' },
      { step: 'Base Cutting', owner: 'Factory', note: 'Cut base to size' },
      { step: 'Edge Finishing', owner: 'Factory', note: 'Smooth base edges' },
      { step: 'Pre-Assembly', owner: 'Factory', note: 'Dry fit base with structure' },
      { step: 'Final Inspection', owner: 'QA', note: 'Approve base assembly' },
    ],
  },
  {
    id: 7,
    processRoute: 'Bubble Warp',
    targetDate: 'Dec 13, 2025',
    factoryCommitmentDate: '12/13/2025',
    submissionDate: '',
    approvalDate: '',
    quantityCompleted: '',
    unit: '',
    status: '',
    remarks: '',
    details: [
      { step: 'Wrap Material Check', owner: 'QA', note: 'Verify wrap thickness' },
      { step: 'Wrap Preparation', owner: 'Factory', note: 'Prepare bubble wrap' },
      { step: 'Primary Wrapping', owner: 'Factory', note: 'Wrap corners and edges' },
      { step: 'Secondary Wrapping', owner: 'Factory', note: 'Cover full product' },
      { step: 'Dispatch Ready', owner: 'Store', note: 'Move to dispatch area' },
    ],
  },
  {
    id: 8,
    processRoute: 'Electrical Components',
    targetDate: 'Dec 13, 2025',
    factoryCommitmentDate: '12/13/2025',
    submissionDate: '',
    approvalDate: '',
    quantityCompleted: '',
    unit: '',
    status: '',
    remarks: '',
    details: [
      { step: 'Components Check', owner: 'Factory', note: 'Verify all components available' },
      { step: 'Soldering', owner: 'Factory', note: 'Solder joints where required' },
      { step: 'Harness Fixing', owner: 'Factory', note: 'Fix wiring harness' },
      { step: 'Functional Test', owner: 'QA', note: 'Power on and test functions' },
      { step: 'Packing Approval', owner: 'QA', note: 'Approve for packing' },
    ],
  },
];

// ----------------------------------------------------------------------
// Detail renderer: transpose rows ↔ columns
// ----------------------------------------------------------------------

function TnaDetailTransposeRenderer(props) {
  const theme = useTheme();
  const details = props.data?.details || [];

  if (!details.length) {
    return (
      <Box sx={{ p: 2, fontSize: 12, color: 'text.secondary' }}>
        No detail data available.
      </Box>
    );
  }

  const rows = [
    {
      label: 'Step',
      values: details.map((d) => d.step || ''),
    },
    {
      label: 'Owner',
      values: details.map((d) => d.owner || ''),
    },
    {
      label: 'Planned Date',
      values: details.map(() => 'Dec 10, 2025'),
    },
    {
      label: 'Actual Date',
      values: details.map(() => 'Dec 12, 2025'),
    },
    {
      label: 'Qty %',
      values: details.map(() => '75%'),
    },
    {
      label: 'Status',
      values: details.map(() => 'In Progress'),
    },
    {
      label: 'Note',
      values: details.map((d) => d.note || ''),
    },
  ];

  return (
    <Box sx={{ p: 1, overflowX: 'auto' }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          '& th, & td': {
            border: `1px solid ${theme.palette.divider}`,
            padding: '4px 8px',
            fontSize: 12,
            whiteSpace: 'nowrap',
          },
          '& thead th': {
            backgroundColor:
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            fontWeight: 600,
          },
          '& tbody th': {
            backgroundColor:
              theme.palette.mode === 'light'
                ? theme.palette.grey[50]
                : theme.palette.grey[800],
            fontWeight: 600,
            textAlign: 'left',
          },
        }}
      >
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              {row.values.map((val, idx) => (
                <td key={idx}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function TNAChartPage() {
  const [tableData, setTableData] = useState(STATIC_TNA_ROWS);
  const [productPortfolios, setProductPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [productCategories, setProductCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productGroups, setProductGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [quickFilterText, setQuickFilterText] = useState('');

  const containerStyle = useMemo(
    () => ({
      width: '100%',
      height: '400px',
    }),
    []
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Process Route',
        field: 'processRoute',
        cellRenderer: 'agGroupCellRenderer',
      },
      { headerName: 'Target Date', field: 'targetDate' },
      { headerName: 'Factory Commitment Date', field: 'factoryCommitmentDate' },
      { headerName: 'Submission Date', field: 'submissionDate' },
      { headerName: 'Approval Date', field: 'approvalDate' },
      { headerName: 'Quantity Completed', field: 'quantityCompleted' },
      { headerName: 'Unit', field: 'unit' },
      { headerName: 'Status', field: 'status' },
      { headerName: 'Remarks', field: 'remarks' },
    ],
    []
  );

  // Fetch product portfolios for filter
  useEffect(() => {
    const fetchProductPortfolios = async () => {
      try {
        const response = await apiClient.get('/MyOrders/GetProductPortfolio');
        if (response.data) {
          setProductPortfolios(response.data);
        }
      } catch (error) {
        console.error('Error fetching product portfolios for TNA Chart:', error);
      }
    };

    fetchProductPortfolios();
  }, []);

  const handlePortfolioChange = (event) => {
    const value = event.target.value;
    setSelectedPortfolio(value);
    // Reset dependent dropdowns when portfolio changes
    setSelectedCategory('');
    setProductCategories([]);
    setSelectedGroup('');
    setProductGroups([]);

    if (!value) {
      setTableData(STATIC_TNA_ROWS);
    } else {
      setTableData(
        STATIC_TNA_ROWS.filter((row) => String(row.productPortfolio) === String(value))
      );
    }
  };

  // Load product categories when portfolio changes
  useEffect(() => {
    const loadCategories = async () => {
      if (!selectedPortfolio) {
        setProductCategories([]);
        return;
      }

      try {
        const response = await apiClient.get(
          `/MyOrders/GetProductCategories/${selectedPortfolio}`
        );
        setProductCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching product categories for TNA Chart:', error);
        setProductCategories([]);
      }
    };

    loadCategories();
  }, [selectedPortfolio]);

  // Load product groups when category changes
  useEffect(() => {
    const loadGroups = async () => {
      if (!selectedCategory) {
        setProductGroups([]);
        return;
      }

      try {
        const response = await apiClient.get(
          `/MyOrders/GetProductGroups/${selectedCategory}`
        );
        setProductGroups(response.data || []);
      } catch (error) {
        console.error('Error fetching product groups for TNA Chart:', error);
        setProductGroups([]);
      }
    };

    loadGroups();
  }, [selectedCategory]);

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

      {/* Filter card */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* Product Portfolio */}
          <Box sx={{ minWidth: 260 }}>
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

          {/* Product Category → All Customer */}
          <Box sx={{ minWidth: 260 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="All Customer"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedGroup('');
                setProductGroups([]);
              }}
              disabled={!selectedPortfolio}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: { maxHeight: 300 },
                  },
                },
              }}
            >
              <MenuItem value="">
                All Customers
              </MenuItem>
              {productCategories.map((c) => (
                <MenuItem key={c.productCategoriesID} value={c.productCategoriesID}>
                  {c.productCategories}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Product Group → All Vendor */}
          <Box sx={{ minWidth: 260 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="All Vendor"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={!selectedCategory}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: { maxHeight: 300 },
                  },
                },
              }}
            >
              <MenuItem value="">
                All Vendor
              </MenuItem>
              {productGroups.map((g) => (
                <MenuItem key={g.productGroupID} value={g.productGroupID}>
                  {g.productGroup}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Global search - full width, 2nd row */}
          <Box sx={{ minWidth: 260, flexBasis: '100%', maxWidth: 480 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}
            >
              Search (all columns)
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
            />
          </Box>
        </Box>
      </Card>

      {/* Grid card */}
      <Card sx={{ p: 2 }}>
        <Box
          style={containerStyle}
          sx={(theme) => ({
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
            '& .ag-paging-panel .ag-input-field-input, & .ag-paging-panel .ag-picker-field-wrapper':
              {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderColor: theme.palette.divider,
              },
          })}
        >
          <div style={{ width: '100%', height: '100%' }}>
            <AgGridReact
              rowData={tableData}
              columnDefs={columnDefs}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
              }}
              rowDragManaged={false}
              animateRows
              masterDetail
              isRowMaster={(data) => !!(data && data.details && data.details.length)}
              detailCellRenderer={TnaDetailTransposeRenderer}
              pagination
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 30]}
              quickFilterText={quickFilterText}
            />
          </div>
        </Box>
      </Card>
    </Container>
  );
}


