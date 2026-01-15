import React, { useState } from 'react';
import {
  Box,
  Card,
  Paper,
  Grid,
  Button,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';

export default function ContainerHandlingViewPage() {
  const [dense, setDense] = useState(false);
  const navigate = useNavigate();
  const columns = [
    { field: 'containerNo', headerName: 'Container No', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'ctnsName', headerName: 'Ctns Name', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'clearing', headerName: 'Clearing', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'duty', headerName: 'Duty', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'trucking', headerName: 'Trucking', flex: 1, headerAlign: 'center', align: 'center' },
    {
      field: 'addTrucking',
      headerName: 'Add trucking',
      flex: 1,
      headerAlign: 'center',
      align: 'center',
    },
    { field: 'pallets', headerName: 'Pallets', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'wrap', headerName: 'Wrap', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'labor', headerName: 'Labor', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'reason1', headerName: 'Reason1', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'reason2', headerName: 'Reason2', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'reason3', headerName: 'Reason3', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'reason4', headerName: 'Reason4', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'reason5', headerName: 'Reason5', flex: 1, headerAlign: 'center', align: 'center' },
    { field: 'total', headerName: 'Total', flex: 1, headerAlign: 'center', align: 'center' },
    {
      field: 'edit',
      headerName: 'Edit',
      flex: 0.7,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: () => (
        <Button size="small" color="primary" sx={{ textTransform: 'none' }}>
          Edit
        </Button>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.7,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: () => (
        <IconButton size="small" sx={{ color: 'error.main' }}>
          <Iconify icon="mdi:close-circle" />
        </IconButton>
      ),
    },
    {
      field: 'pdf',
      headerName: 'PDF',
      flex: 0.7,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: () => (
        <IconButton size="small" sx={{ color: 'error.main' }}>
          <Iconify icon="fa6-solid:file-pdf" />
        </IconButton>
      ),
    },
  ];

  const rows = [
    {
      id: 1,
      containerNo: '12345',
      ctnsName: '100',
      clearing: '2.00',
      duty: '1.00',
      trucking: '2.00',
      addTrucking: '4.00',
      pallets: '4.00',
      wrap: '4.00',
      labor: '4.00',
      reason1: 'test1',
      reason2: 'test1',
      reason3: 'test2',
      reason4: 'test3',
      reason5: 'test4',
      total: '21.00',
    },
    {
      id: 2,
      containerNo: '12345',
      ctnsName: '10',
      clearing: '1.00',
      duty: '1.00',
      trucking: '1.00',
      addTrucking: '1.00',
      pallets: '1.00',
      wrap: '1.00',
      labor: '1.00',
      reason1: 'test1',
      reason2: 'test1',
      reason3: 'test2',
      reason4: 'test3',
      reason5: 'test4',
      total: '7.00',
    },
  ];

  return (
    <Box sx={{ width: '100%', mt: 4, px: 2 }}>
      <Box sx={{ mb: 3 }}>
        <CustomBreadcrumbs
          heading="Container handling View"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Power Tools', href: paths.dashboard.powerTool.root },
            { name: 'Container handling' },
          ]}
        />
        <Box sx={{ height: 1, bgcolor: 'divider', mt: 2 }} />
      </Box>

      {/* Top action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          sx={{ textTransform: 'none', px: 4 }}
          onClick={() => navigate(paths.dashboard.powerTool.containerHandlingReport)}
        >
          For Summary
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={{ textTransform: 'none', px: 4 }}
          onClick={() => navigate(paths.dashboard.powerTool.containerHandlingExpenses)}
        >
          Add container
        </Button>
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 0, boxShadow: 'none' }}>
        <Paper sx={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
            pageSizeOptions={[10, 25, 50]}
            density="compact"
            getRowHeight={() => (dense ? 35 : 52)}
            sx={(theme) => ({
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.primary.main,
                color: '#ffffff',
                borderBottom: 'none',
                alignItems: 'stretch',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                color: '#ffffff',
                fontWeight: 600,
                fontSize: {
                  xs: 10, // very small screens
                  sm: 11,
                  md: 12,
                  lg: 13,
                },
                whiteSpace: 'normal',
                lineHeight: 1.3,
                textOverflow: 'clip',
                overflow: 'visible',
              },
              '& .MuiDataGrid-columnHeaders .MuiDataGrid-columnSeparator, & .MuiDataGrid-columnHeaders .MuiSvgIcon-root':
                {
                  color: '#ffffff',
                },
              '& .MuiDataGrid-footerContainer .MuiSvgIcon-root': {
                color: theme.palette.text.primary,
              },
            })}
          />
          {/* Dense toggle */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 16,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={dense}
                  onChange={(e) => setDense(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography sx={{ fontWeight: 500, color: 'text.primary' }}>Dense</Typography>}
            />
          </Box>
        </Paper>
      </Card>
    </Box>
  );
}













