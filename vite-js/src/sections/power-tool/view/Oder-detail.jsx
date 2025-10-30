import React, { useState } from 'react';
import { Box, Typography, FormControl, Select, MenuItem, TextField, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // 👈 for redirect

const PURPLE = '#3a2f55';

export default function ProductCategoriesEntryForm() {
  const [portfolio, setPortfolio] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();

  const handleSave = () => {
    // Save logic yahan likh sakte ho
    navigate('/dashboard/power-tool/product-categories'); // ✅ correct redirect path
  };

  const handleCancel = () => {
    setPortfolio('');
    setCategory('');
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
        mt: 3,
        p: 4,
        boxShadow: '0px 3px 10px rgba(0,0,0,0.05)',
      }}
    >
      {/* 🔹 Heading */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#444' }}>
        Product Categories Entry Form
      </Typography>

      {/* 🔹 Form Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 5,
          flexWrap: 'wrap',
        }}
      >
        {/* Product Portfolio Dropdown */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ mt: '20px', fontWeight: 500, color: '#555' }}>
            Product Portfolio:
          </Typography>
          <FormControl fullWidth>
            <Select
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              displayEmpty
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #ccc',
                height: '40px',
              }}
            >
              <MenuItem value="">Select Portfolio</MenuItem>
              <MenuItem value="Hard-line">Hard-line</MenuItem>
              <MenuItem value="Leather Goods">Leather Goods</MenuItem>
              <MenuItem value="Knitwear Apparel">Knitwear Apparel</MenuItem>
              <MenuItem value="Woven Apparel">Woven Apparel</MenuItem>
              <MenuItem value="Home Textile">Home Textile</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Product Categories Input */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ mt: '20px', fontWeight: 500, color: '#555' }}>
            Product Categories:
          </Typography>
          <TextField
            fullWidth
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            sx={{
              backgroundColor: '#fff',
              borderRadius: '4px',
              '& .MuiOutlinedInput-root': {
                height: '40px',
              },
            }}
          />
        </Box>
      </Box>

      {/* 🔹 Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 3,
          mt: 4,
        }}
      >
        <Button
          variant="contained"
          sx={{
            backgroundColor: PURPLE,
            color: '#fff',
            width: '180px',
            '&:hover': { backgroundColor: PURPLE },
          }}
          onClick={handleSave}
        >
          Save
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: PURPLE,
            color: '#fff',
            width: '180px',
            '&:hover': { backgroundColor: PURPLE },
          }}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
