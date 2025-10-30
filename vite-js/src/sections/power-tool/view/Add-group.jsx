import React, { useState } from 'react';
import { Box, Typography, FormControl, Select, MenuItem, TextField, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // ✅ Import navigation hook

const PURPLE = '#3a2f55';

export default function ProductGroupEntryForm() {
  const [portfolio, setPortfolio] = useState('');
  const [category, setCategory] = useState('');
  const [group, setGroup] = useState('');
  const navigate = useNavigate(); // ✅ Initialize navigation

  const handleSave = () => {
    console.log('Saved:', { portfolio, category, group });
    // ✅ Redirect after saving
    navigate('/dashboard/power-tool/product-group');
  };

  const handleCancel = () => {
    setPortfolio('');
    setCategory('');
    setGroup('');
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '6px',
        mt: 4,
        boxShadow: '0px 3px 10px rgba(0,0,0,0.05)',
      }}
    >
      {/* 🔹 Heading */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: '#444',
          borderBottom: '1px solid #e0e0e0',
          p: 2,
        }}
      >
        Product Group Entry Form
      </Typography>

      {/* 🔹 Form Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          alignItems: 'center',
          columnGap: 4,
          rowGap: 2,
          px: 3,
          py: 4,
        }}
      >
        {/* Product Portfolio */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#555', mb: 1 }}>
            Product Portfolio:
          </Typography>
          <FormControl fullWidth>
            <Select
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              displayEmpty
              sx={{
                height: '40px',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <MenuItem value="">
                <em>Hard-Line</em>
              </MenuItem>
              {/* <MenuItem value="Hard-Line">Hard-Line</MenuItem> */}
              <MenuItem value="Leather Goods">Leather Goods</MenuItem>
              <MenuItem value="Knitwear Apparel">Knitwear Apparel</MenuItem>
              <MenuItem value="Woven Apparel">Woven Apparel</MenuItem>
              <MenuItem value="Home Textile">Home Textile</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Product Categories */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#555', mb: 1 }}>
            Product Categories:
          </Typography>
          <FormControl fullWidth>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              displayEmpty
              sx={{
                height: '40px',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <MenuItem value="">
                <em>Salt</em>
              </MenuItem>
              {/* <MenuItem value="Salt">Salt</MenuItem> */}
              <MenuItem value="Knits">Knits</MenuItem>
              <MenuItem value="Woven">Woven</MenuItem>
              <MenuItem value="Leather">Leather</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Product Group */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#555', mb: 1 }}>
            Product Group:
          </Typography>
          <TextField
            fullWidth
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '40px',
              },
            }}
          />
        </Box>
      </Box>

      {/* 🔹 Buttons Row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 3,
          px: 3,
          pb: 3,
        }}
      >
        <Button
          variant="contained"
          sx={{
            backgroundColor: PURPLE,
            color: '#fff',
            width: '150px',
            textTransform: 'none',
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
            width: '150px',
            textTransform: 'none',
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
