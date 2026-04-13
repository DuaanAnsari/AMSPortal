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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom'; // ✅ import navigation hook

export default function InquiryPage() {
  const [dense, setDense] = useState(false);
  const [sizeRange, setSizeRange] = useState('ALL');
  const navigate = useNavigate(); // ✅ initialize navigation

  const rows = [
    { id: 1, sizeRange: '0-17', size: '0' },
    { id: 2, sizeRange: '0-17', size: '1' },
    { id: 3, sizeRange: '0-17', size: '11' },
    { id: 4, sizeRange: '0-17', size: '13' },
    { id: 5, sizeRange: '0-17', size: '15' },
    { id: 6, sizeRange: '0-17', size: '17' },
    { id: 7, sizeRange: '0-17', size: '3' },
    { id: 8, sizeRange: '0-17', size: '5' },
    { id: 9, sizeRange: '0-17', size: '7' },
    { id: 10, sizeRange: '0-17', size: '9' },
    { id: 11, sizeRange: '04-06X', size: '04' },
    { id: 12, sizeRange: '04-06X', size: '05-6' },
    { id: 13, sizeRange: '04-06X', size: '06X' },
    { id: 14, sizeRange: '04-07', size: '04' },
    { id: 15, sizeRange: '04-07', size: '05-6' },
    { id: 16, sizeRange: '04-07', size: '07' },
  ];

  const columns = [
    { field: 'sizeRange', headerName: 'Size Range', flex: 1 },
    { field: 'size', headerName: 'Size', flex: 0.8 },
    {
      field: 'sizeRangeView',
      headerName: 'Size Range View',
      flex: 1,
      renderCell: () => (
        <Typography sx={{ color: '#1976d2', fontWeight: 600, cursor: 'pointer' }}>
          Size Edit
        </Typography>
      ),
    },
    {
      field: 'sizeView',
      headerName: 'Size View',
      flex: 1,
      renderCell: () => (
        <Typography sx={{ color: '#1976d2', fontWeight: 600, cursor: 'pointer' }}>
          Size Edit
        </Typography>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.5,
      renderCell: () => (
        <IconButton size="small" sx={{ color: 'red' }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  // ✅ redirect handlers
  const handleAddSizeRange = () => {
    navigate('/dashboard/power-tool/add-size-range');
  };

  const handleAddSize = () => {
    navigate('/dashboard/power-tool/add-size'); // ✅ redirect to Add-Size.jsx page
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* 🔹 Top Header */}
      <Card sx={{ borderRadius: 2, mb: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'black' }}>
            Shipped Exchange Rate Module
          </Typography>
        </CardContent>
      </Card>

      {/* 🔹 Action Buttons - RIGHT ALIGNED */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 1 }}>
        <Button
          variant="contained"
          onClick={handleAddSizeRange} // ✅ redirect to Add Size Range
          sx={{
            backgroundColor: '#3b2b63',
            color: '#fff',
            '&:hover': { backgroundColor: '#2d1f4b' },
            px: 3,
          }}
        >
          Add Size Range
        </Button>

        <Button
          variant="contained"
          onClick={handleAddSize} // ✅ redirect to Add Size
          sx={{
            backgroundColor: '#3b2b63',
            color: '#fff',
            '&:hover': { backgroundColor: '#2d1f4b' },
            px: 3,
          }}
        >
          Add Size
        </Button>
      </Box>

      {/* 🔹 Size Range Section */}
      <Card
        sx={{ borderRadius: 2, mb: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)', overflow: 'hidden' }}
      >
        <Box sx={{ backgroundColor: '#faf8f89c', color: 'black', py: 1.5, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Size Range
          </Typography>
        </Box>
        <CardContent sx={{ backgroundColor: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel>Size Range</InputLabel>
              <Select
                value={sizeRange}
                onChange={(e) => setSizeRange(e.target.value)}
                label="Size Range"
                size="small"
              >
                <MenuItem value="ALL">ALL</MenuItem>
                <MenuItem value="0-17">0-17</MenuItem>
                <MenuItem value="04-06X">04-06X</MenuItem>
                <MenuItem value="04-07">04-07</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* 🔹 Table Section */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Paper sx={{ width: '100%', borderRadius: 0 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              pagination
              density={dense ? 'compact' : 'standard'}
              disableRowSelectionOnClick
              hideFooterSelectedRowCount
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5 !important',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  height: '60px !important',
                  borderBottom: '1px solid #ddd',
                },
                '& .MuiDataGrid-cell': { fontSize: '0.85rem' },
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
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
