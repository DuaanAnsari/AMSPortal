import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function InquiryPage() {
  const [dense, setDense] = useState(false);

  // 🔹 Table Data
  const rows = [
    { id: 1, rateMonth: '< Jan 01, 2014 > To < Jan 31, 2014 >', exchangeRate: '1.3300' },
    { id: 2, rateMonth: '< Feb 01, 2014 > To < Feb 28, 2014 >', exchangeRate: '1.3300' },
    { id: 3, rateMonth: '< Mar 01, 2014 > To < Mar 31, 2014 >', exchangeRate: '1.3300' },
    { id: 4, rateMonth: '< Apr 01, 2014 > To < Apr 30, 2014 >', exchangeRate: '1.3300' },
    { id: 5, rateMonth: '< May 01, 2014 > To < May 31, 2014 >', exchangeRate: '1.3300' },
    { id: 6, rateMonth: '< Jun 01, 2014 > To < Jun 30, 2014 >', exchangeRate: '1.3300' },
    { id: 7, rateMonth: '< Jul 01, 2014 > To < Jul 31, 2014 >', exchangeRate: '1.3300' },
    { id: 8, rateMonth: '< Aug 01, 2014 > To < Aug 31, 2014 >', exchangeRate: '1.3300' },
    { id: 9, rateMonth: '< Sep 01, 2014 > To < Sep 30, 2014 >', exchangeRate: '1.3300' },
    { id: 10, rateMonth: '< Oct 01, 2014 > To < Oct 31, 2014 >', exchangeRate: '1.3300' },
    { id: 11, rateMonth: '< Nov 01, 2014 > To < Nov 30, 2014 >', exchangeRate: '1.3300' },
    { id: 12, rateMonth: '< Dec 01, 2014 > To < Dec 31, 2014 >', exchangeRate: '1.3300' },
    { id: 13, rateMonth: '< Jan 01, 2015 > To < Jan 31, 2015 >', exchangeRate: '1.3300' },
    { id: 14, rateMonth: '< Feb 01, 2015 > To < Feb 28, 2015 >', exchangeRate: '1.3300' },
    { id: 15, rateMonth: '< Mar 01, 2015 > To < Mar 31, 2015 >', exchangeRate: '1.3300' },
  ];

  // 🔹 Columns
  const columns = [
    { field: 'rateMonth', headerName: 'Rate Month', flex: 1.5 },
    { field: 'exchangeRate', headerName: 'Exchange Rate', flex: 1 },
    {
      field: 'view',
      headerName: 'View',
      flex: 0.7,
      renderCell: () => (
        <Button
          size="small"
          variant="outlined"
          sx={{
            minWidth: 50,
            fontSize: '0.7rem',
            py: 0.3,
            px: 1,
            textTransform: 'none',
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      {/* 🔹 Header Card */}
      <Card
        sx={{
          borderRadius: 2,
          mb: 3,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'black' }}>
            Booked Exchange Rate View
          </Typography>
        </CardContent>
      </Card>

      {/* 🔹 Table Card */}
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      >
        <CardContent>
          <Paper sx={{ width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
              pagination
              density={dense ? 'compact' : 'standard'}
              disableRowSelectionOnClick
              hideFooterSelectedRowCount
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  height: '60px !important',
                  lineHeight: '60px !important',
                  borderBottom: '2px solid #ddd',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  overflow: 'hidden',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiDataGrid-columnHeader': {
                  padding: '0 10px',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: '0.85rem',
                },
                '& .MuiDataGrid-footerContainer': {
                  backgroundColor: '#fff',
                },
                '& .MuiTablePagination-root': {
                  color: 'black',
                },
                '& .MuiTablePagination-actions button': {
                  color: 'black',
                },
                '& .MuiDataGrid-virtualScroller': {
                  overflowY: 'auto !important',
                  overflowX: 'hidden !important',
                },
              }}
            />

            {/* 🔹 Footer Dense Toggle */}
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
                  />
                }
                label={<Typography sx={{ fontWeight: 500, color: '#3b2b63' }}>Dense</Typography>}
              />
            </Box>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
}
