import React, { useState } from 'react';
import { Box, Typography, Button, FormControlLabel, Switch } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom'; // 👈 ye line add karni hai

export default function POSizeWiseView() {
  const [dense, setDense] = useState(false);
  const navigate = useNavigate(); // 👈 initialize navigation

  const handleAddOrderDetail = () => {
    navigate('/dashboard/user/add-oder-detail'); // 👈 redirect here
  };

  const columns = [
    { field: 'description', headerName: 'Description', flex: 1.2 },
    { field: 'color', headerName: 'Color', flex: 2.2 },
    { field: 'mainCareLabel', headerName: 'MainCareLabel', flex: 1 },
    { field: 'hangtag', headerName: 'Hangtag', flex: 1 },
    { field: 'licenserSample', headerName: 'LicenserSample', flex: 1 },
  ];

  const rows = [
    {
      id: 1,
      description: 'SHORT',
      color: '1- (DENIM_300) 2- (DENIM_600)',
      mainCareLabel: '',
      hangtag: '',
      licenserSample: '',
    },
    {
      id: 2,
      description: 'POLAROID RUGBY SHIRT',
      color: '1- (BLACK (Product Code 4POL51450M)_200) 2- (BLACK (Product Code 4POL51450M)_400)',
      mainCareLabel: '',
      hangtag: '',
      licenserSample: '',
    },
    {
      id: 3,
      description: 'S/s shirt',
      color: '1- (BLACK_240) 2- (BLACK_288)',
      mainCareLabel: '',
      hangtag: '',
      licenserSample: '',
    },
    {
      id: 4,
      description: 'LS CREW TOP',
      color:
        '1- (ARMY_24) 2- (ARMY_48) 3-(ARMY_72) 4-(ARMY_164) 5-(ARMY_204) 6-(ARMY_240) 7-(ARMY_276)',
      mainCareLabel: '03/08/2022',
      hangtag: '03/22/2022',
      licenserSample: '03/24/2022',
    },
    {
      id: 5,
      description: 'S/s shirt',
      color: '1- (BLACK_24) 2-(BLACK_168) 3-(BLACK_216) 4-(BLACK_240) 5-(BLACK_264)',
      mainCareLabel: '',
      hangtag: '',
      licenserSample: '',
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#fff',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          PO Size Wise View
        </Typography>
        <Button
          variant="contained"
          // onClick={handleAddOrderDetail} // 👈 redirect action
          onClick={() => navigate('/dashboard/supply-chain/Add-Order-Detail')}
          sx={{
            backgroundColor: '#3a2f55',
            color: '#fff',
            fontWeight: 500,
            textTransform: 'none',
            px: 3,
            '&:hover': { backgroundColor: '#3a2f55' },
          }}
        >
          Add Order Detail
        </Button>
      </Box>

      {/* DataGrid */}
      <Box
        sx={{
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: '4px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          hideFooterPagination
          hideFooterSelectedRowCount
          disableRowSelectionOnClick
          getRowHeight={() => (dense ? 40 : 'auto')}
          autoHeight
          sortingOrder={['asc', 'desc']}
          filterMode="client"
          slots={{
            footer: () => (
              <Box
                sx={{
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  px: 2,
                  borderTop: '1px solid #eee',
                  backgroundColor: '#fff',
                  mt: 1,
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
                  label="Dense"
                  sx={{
                    color: '#333',
                    ml: 0,
                    '& .MuiFormControlLabel-label': {
                      fontSize: '13px',
                    },
                  }}
                />
              </Box>
            ),
          }}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#ef8655',
              color: '#fff',
              fontWeight: 600,
              fontSize: '15px',
            },
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal !important',
              wordBreak: 'break-word',
              display: 'block !important',
              alignItems: 'flex-start',
              fontSize: dense ? '12px' : '14px',
              paddingTop: dense ? '4px' : '8px',
              paddingBottom: dense ? '4px' : '8px',
              lineHeight: dense ? '1.2 !important' : '1.4 !important',
            },
            '& .MuiDataGrid-virtualScroller': {
              overflowX: 'hidden !important',
            },
            '& .MuiDataGrid-footerContainer': {
              minHeight: '30px',
            },
          }}
        />
      </Box>
    </Box>
  );
}
