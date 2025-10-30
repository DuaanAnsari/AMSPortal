import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import AddInquiry from 'src/sections/Supply-Chain/view/Add-inquiry'; // ✅ Import your Add Inquiry page

export default function InquiryPage() {
  const [showFilters, setShowFilters] = useState(true);
  const [sampleNo, setSampleNo] = useState('');
  const [style, setStyle] = useState('');
  const [fabric, setFabric] = useState('');
  const [gsm, setGsm] = useState('');

  const navigate = useNavigate();

  // Sample static data
  const rows = [
    {
      id: 1,
      merchant: 'SADIA JAWAD',
      inquiryType: 'Order',
      creationDate: '05/19/2025',
      sampleNo: 'AMS/2716',
      supplier: '3A FASHION APPAREL',
      customer: '5 POINTZ CLOTHING INC DBA RS1NE',
      style: 'AMS/2716',
      itemDesc: 'Pending',
    },
    {
      id: 2,
      merchant: 'SADIA JAWAD',
      inquiryType: 'Order',
      creationDate: '11/20/2024',
      sampleNo: 'AMS/2605',
      supplier: '3A FASHION APPAREL',
      customer: '5 POINTZ CLOTHING INC DBA RS1NE',
      style: 'AMS/2605',
      itemDesc: 'Pending',
    },
  ];

  // Columns for DataGrid
  const columns = [
    { field: 'merchant', headerName: 'Merchant', flex: 1 },
    { field: 'inquiryType', headerName: 'Inquiry Type', flex: 1 },
    { field: 'creationDate', headerName: 'Creation Date', flex: 1 },
    { field: 'sampleNo', headerName: 'Sample No', flex: 1 },
    { field: 'supplier', headerName: 'Supplier', flex: 1.5 },
    { field: 'customer', headerName: 'Customer', flex: 1.5 },
    { field: 'style', headerName: 'Style', flex: 1 },
    { field: 'itemDesc', headerName: 'Item Desc.', flex: 1 },
  ];

  // 🔹 Handle Redirect on Button Click
  const handleAddInquiry = () => {
    navigate('/dashboard/supply-chain/add-inquiry'); // 👈 Redirect to Add Inquiry page
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Main Inquiry Card */}
      <Card
        sx={{
          p: 2,
          borderRadius: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: '#4a148c',
              mb: 2,
            }}
          >
            INQUIRY
          </Typography>

          {/* Filter Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Show Filtering Item
            </Typography>
            <RadioGroup
              row
              value={showFilters ? 'Yes' : 'No'}
              onChange={(e) => setShowFilters(e.target.value === 'Yes')}
            >
              <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="No" control={<Radio />} label="No" />
            </RadioGroup>
          </Box>

          {showFilters && (
            <>
              {/* Input Fields + Search Button */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3} md={2.4}>
                  <TextField
                    label="Sample No"
                    fullWidth
                    size="small"
                    value={sampleNo}
                    onChange={(e) => setSampleNo(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3} md={2.4}>
                  <TextField
                    label="Style"
                    fullWidth
                    size="small"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3} md={2.4}>
                  <TextField
                    label="Fabric"
                    fullWidth
                    size="small"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3} md={2.4}>
                  <TextField
                    label="GSM"
                    fullWidth
                    size="small"
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                  />
                </Grid>
                {/* Search Button */}
                <Grid item xs={12} sm={3} md={2.4}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: '#3b2b63',
                      fontWeight: 'bold',
                      height: '40px',
                      mt: { xs: 1, sm: 0 },
                      '&:hover': { backgroundColor: '#2a1d49' },
                    }}
                  >
                    Search
                  </Button>
                </Grid>
              </Grid>

              {/* Buttons Below */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: '#3b2b63',
                      fontWeight: 'bold',
                      '&:hover': { backgroundColor: '#2a1d49' },
                    }}
                  >
                    All
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: '#3b2b63',
                      fontWeight: 'bold',
                      '&:hover': { backgroundColor: '#2a1d49' },
                    }}
                  >
                    Only Dispatch
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddInquiry}
                    sx={{
                      backgroundColor: '#3b2b63',
                      fontWeight: 'bold',
                      '&:hover': { backgroundColor: '#2a1d49' },
                    }}
                  >
                    Add Inquiry
                  </Button>
                </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      >
        <CardContent>
          <Paper sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f57c00',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: '0.85rem',
                },
              }}
            />
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
}
