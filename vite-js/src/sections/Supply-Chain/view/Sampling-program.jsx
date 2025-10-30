import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom'; // ✅ add this

export default function SamplingProgramView() {
  const [dense, setDense] = useState(false);
  const navigate = useNavigate(); // ✅ hook for redirect

  const onPdfClick = (id, field) => {
    console.log('PDF clicked for row:', id, 'Field:', field);
  };

  const columns = [
    { field: 'merchandiser', headerName: 'Merchandiser', flex: 1 },
    { field: 'qa', headerName: 'QA', flex: 1 },
    { field: 'customer', headerName: 'Customer', flex: 1 },
    { field: 'factory', headerName: 'Factory', flex: 1 },
    { field: 'po', headerName: 'PO #', flex: 1 },
    { field: 'fabric', headerName: 'Fabric', flex: 1 },
    { field: 'deliveryDate', headerName: 'Delivery Date', flex: 1 },
    { field: 'edit', headerName: 'Edit', flex: 0.6 },
    {
      field: 'pdf',
      headerName: 'PDF',
      flex: 0.6,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => onPdfClick(params.row.id, params.field)}
          sx={{ p: 0.5 }}
        >
          <img src="/assets/icons/files/ic_pdf.svg" alt="PDF" width={16} height={16} />
        </IconButton>
      ),
    },
  ];

  const rows = [
    {
      id: 1,
      merchandiser: 'WALEED AHMED',
      qa: 'MINHAJ ALI',
      customer: 'AMS SAMPLE',
      factory: 'Aayoob Textile',
      po: 'TEST',
      fabric: '60% 40%',
      deliveryDate: 'Oct 28, 2023',
      edit: 'Edit',
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#fff',
      }}
    >
      {/* Header */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: '#444',
          mb: 2,
        }}
      >
        SAMPLING PROGRAM VIEW
      </Typography>

      {/* Search Bar + Add Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        {/* Search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontWeight: 500 }}>PO # :</Typography>
          <TextField placeholder="37508" size="small" sx={{ width: 250 }} />
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#3a2f55',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { backgroundColor: '#3a2f55' },
            }}
          >
            Search
          </Button>
        </Box>

        {/* ✅ Add Sampling Program Button */}
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard/supply-chain/add-sampling-program')} // ✅ Correct redirect path
          sx={{
            backgroundColor: '#3a2f55',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': { backgroundColor: '#3a2f55' },
          }}
        >
          Add Sampling Program
        </Button>
      </Box>

      {/* DataGrid */}
      <Box
        sx={{
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: '6px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
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
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#3a2f55',
              color: '#fff',
              fontWeight: 600,
              fontSize: '15px',
            },
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal !important',
              wordBreak: 'break-word',
              fontSize: dense ? '12px' : '14px',
              py: dense ? 0.5 : 1,
            },
          }}
          slots={{
            footer: () => (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  px: 2,
                  borderTop: '1px solid #eee',
                  backgroundColor: '#fff',
                  height: 45,
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
                    '& .MuiFormControlLabel-label': {
                      fontSize: '13px',
                    },
                  }}
                />
              </Box>
            ),
          }}
        />
      </Box>
    </Box>
  );
}
