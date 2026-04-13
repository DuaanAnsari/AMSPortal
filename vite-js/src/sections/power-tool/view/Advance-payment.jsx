import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

export default function DepositInvoiceView() {
  const [dense, setDense] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const rows = [
    {
      id: 1,
      pono: '25962-LR3007',
      itemName: 'EPIC SHERPA CONTRAST',
      quantity: 3744.0,
      rate: 22464.0,
      totalAmount: 6739.2,
    },
    {
      id: 2,
      pono: 'VPO-1000850',
      itemName: 'Unisex Triblend Zip Hoodie',
      quantity: 3024.0,
      rate: 15876.0,
      totalAmount: 317.52,
    },
  ];

  const onPdfClick = (id) => {
    console.log('PDF clicked for row ID:', id);
  };

  const columns = [
    { field: 'pono', headerName: 'PONO', flex: 1 },
    { field: 'itemName', headerName: 'Item Name', flex: 1.5 },
    { field: 'quantity', headerName: 'Quantity', flex: 1 },
    { field: 'rate', headerName: 'Rate', flex: 1 },
    { field: 'totalAmount', headerName: 'Total Amount', flex: 1 },
    {
      field: 'pdf',
      headerName: 'PDF',
      flex: 0.6,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <IconButton size="small" onClick={() => onPdfClick(params.row.id)} sx={{ p: 0.5 }}>
            <img src="/assets/icons/files/ic_pdf.svg" alt="PDF" width={16} height={16} />
          </IconButton>
        </Box>
      ),
    },
    {
      field: 'edit',
      headerName: 'Edit',
      flex: 0.6,
      align: 'center',
      headerAlign: 'center',
      renderCell: () => (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
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
            Edit
          </Button>
        </Box>
      ),
    },
  ];

  const handleAddAdvance = () => {
    navigate('/dashboard/power-tool/add-advance');
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      {/* 🔹 Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          color="black"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}
        >
          Deposit Invoice Entry
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 500,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Typography>

          <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>
            •
          </Typography>

          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            Deposit Invoice
          </Typography>
        </Box>
      </Box>

      {/* 🔹 Add Button */}
      <Card sx={{ borderRadius: 2, mb: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
        <CardContent
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: '8px !important',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'black', mb: 1 }}></Typography>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#3b2b63',
              '&:hover': { backgroundColor: '#4c3d7a' },
              textTransform: 'none',
              fontWeight: 600,
              mb: 1,
            }}
            onClick={handleAddAdvance}
          >
            Add Advance Payment
          </Button>
        </CardContent>
      </Card>

      {/* 🔹 DataGrid */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
        <CardContent>
          <Paper sx={{ width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSizeOptions={[5, 10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5, page: 0 } },
              }}
              pagination
              disableRowSelectionOnClick
              hideFooterSelectedRowCount
              getRowHeight={() => (dense ? 35 : 52)} // ✅ Compact row height toggle
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#fff',
                  color: 'black',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  height: '55px !important',
                  borderBottom: '2px solid #ddd',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: dense ? '0.75rem' : '0.85rem', // ✅ smaller text in dense mode
                  py: dense ? '2px' : '6px', // ✅ reduce vertical padding
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiDataGrid-footerContainer': {
                  backgroundColor: '#fff',
                  color: 'black',
                },
                '& .MuiTablePagination-root': {
                  color: 'black',
                },
                '& .MuiTablePagination-actions button': {
                  color: 'black',
                },
              }}
            />

            {/* 🔹 Dense Toggle */}
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
                label={<Typography sx={{ fontWeight: 500, color: 'black' }}>Dense</Typography>}
              />
            </Box>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
}
