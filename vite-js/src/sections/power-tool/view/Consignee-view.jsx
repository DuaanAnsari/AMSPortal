import React, { useState } from 'react';
import { Box, Card, Paper, Grid, TextField, Button, IconButton, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';

export default function ConsigneeViewPage() {
  const navigate = useNavigate();

  // Filters state
  const [filters, setFilters] = useState({
    packageName: '',
    consigneeName: '',
  });

  // Table rows (hardcoded sample data for now)
  const [rows] = useState([
    {
      id: 1,
      packageName: 'MUHAMMAD ANEES',
      consigneeName: 'MUHAMMAD ANEES',
      address: '16204 WAYNITA WAY NE BOTHELL WA 98011 USA.',
      phone: '001-425-773-5670',
    },
    {
      id: 2,
      packageName: 'BUFFALO OUTDOORS.',
      consigneeName: 'ALLISON W.DEWALD DEWALD',
      address: '2300 HAMBURG TURNPIKE LACKAWANNA LACKAWANNA, NY 14218',
      phone: '+1-716-823-0030 ext. 219',
    },
    {
      id: 3,
      packageName: 'BEACH LUNCH LOUNGE',
      consigneeName: 'SUSHMITA PHOGAT',
      address: '525 7TH AVE #1202, NEW YORK, NY 10018',
      phone: '212-921-2790 x 213',
    },
    {
      id: 4,
      packageName: 'SHAOXING DENGFENG TRADING CO.,LTD',
      consigneeName: 'DAISY',
      address:
        'SUITE1202-1204,12F JUXING BUILDING,NO.669 JIEFANG ROAD,JINGHU CODE,SHAOXING,ZHEJIANG,CHINA.P.C.:312000',
      phone: '0086-575-85516777 & 013157535525',
    },
    {
      id: 5,
      packageName: 'ZUCCHINI INDUSTRIES FZC',
      consigneeName: 'AZHAR',
      address: 'PO. BOX # 1620, AHMED BIN RASHID PORT & FREEZONE, UMM-AL-QUAWAIN, UAE.',
      phone: '00971507290815',
    },
  ]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const columns = [
    {
      field: 'packageName',
      headerName: 'Package Name',
      flex: 1.2,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'consigneeName',
      headerName: 'Consignee Name',
      flex: 1.2,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 2,
      headerAlign: 'center',
      align: 'left',
    },
    {
      field: 'phone',
      headerName: 'Phon #',
      flex: 1,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'edit',
      headerName: 'Edit',
      flex: 0.6,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: () => (
        <Button size="small" color="primary" sx={{ textTransform: 'none', fontWeight: 500 }}>
          View
        </Button>
      ),
    },
    {
      field: 'delete',
      headerName: 'Delete',
      flex: 0.6,
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
  ];

  return (
    <Box sx={{ width: '100%', mt: 4, px: 2 }}>
      {/* Breadcrumbs + Heading */}
      <Box sx={{ mb: 3 }}>
        <CustomBreadcrumbs
          heading="Consignee View"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Power Tools', href: paths.dashboard.powerTool.root },
            { name: 'Consignee' },
          ]}
        />
        <Box sx={{ height: 1, bgcolor: 'divider', mt: 2 }} />
      </Box>

      <Box>
        {/* Filters and Actions */}
        <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}
            >
              Package Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              name="packageName"
              value={filters.packageName}
              onChange={handleFilterChange}
              placeholder="Package Name"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}
            >
              Consignee Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              name="consigneeName"
              value={filters.consigneeName}
              onChange={handleFilterChange}
              placeholder="Consignee Name"
            />
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              color="primary"
              sx={{
                textTransform: 'none',
                px: 4,
                py: 1,
              }}
            >
              Search
            </Button>
          </Grid>

          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={() => navigate(paths.dashboard.powerTool.addConsignee)}
              color="primary"
              sx={{
                textTransform: 'none',
                px: 4,
                py: 1,
              }}
            >
              Add Consignee
            </Button>
          </Grid>
        </Grid>

        {/* Table */}
        <Card sx={{ borderRadius: 0, boxShadow: 'none' }}>
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id || `${row.packageName}-${row.consigneeName}-${row.phone}`}
              autoHeight
              disableRowSelectionOnClick
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
              pageSizeOptions={[10, 25, 50]}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f3e5f5',
                  color: '#333',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #ddd',
                },
              }}
            />
          </Paper>
        </Card>
      </Box>
    </Box>
  );
}

















