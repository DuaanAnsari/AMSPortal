import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // ✅ navigation hook import

export default function SizeRangeAdd() {
  const [sizeRange, setSizeRange] = useState('');
  const navigate = useNavigate(); // ✅ initialize navigation

  // ✅ handle Save button click
  const handleSave = () => {
    // optional: you can also validate or save data via API here
    navigate('/dashboard/power-tool/size-range-database'); // ✅ redirect target page
  };

  // ✅ handle Cancel button click
  const handleCancel = () => {
    navigate(-1); // 👈 go back to previous page
  };

  return (
    <Box sx={{ width: '100%', mt: '40px' }}>
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* 🔹 Header */}
        <Box
          sx={{
            backgroundColor: '#faf8f89c',
            py: 1.5,
            px: 3,
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#444' }}>
            Size Range Add
          </Typography>
        </Box>

        {/* 🔹 Form Content */}
        <CardContent
          sx={{
            backgroundColor: '#fff',
            py: 4,
            px: 5,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* Label and Input */}
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#444', mb: 1 }}>
                Size Range
              </Typography>
              <TextField
                fullWidth
                value={sizeRange}
                onChange={(e) => setSizeRange(e.target.value)}
                size="small"
                variant="outlined"
                sx={{
                  backgroundColor: '#fff',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    '& fieldset': {
                      borderColor: '#cfcdfb',
                    },
                    '&:hover fieldset': {
                      borderColor: '#3b2b63',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b2b63',
                      boxShadow: '0 0 0 1px #3b2b63',
                    },
                  },
                }}
              />
            </Grid>

            {/* Spacer */}
            <Grid item xs={12} sm={6} md={4}></Grid>

            {/* Buttons */}
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                mt: { xs: 3, sm: 0 },
              }}
            >
              <Button
                variant="contained"
                onClick={handleSave} // ✅ redirect on Save
                sx={{
                  backgroundColor: '#3b2b63',
                  color: '#fff',
                  px: 4,
                  '&:hover': {
                    backgroundColor: '#2d1f4b',
                  },
                }}
              >
                Save
              </Button>
              <Button
                variant="contained"
                onClick={handleCancel} // ✅ go back on Cancel
                sx={{
                  backgroundColor: '#3b2b63',
                  color: '#fff',
                  px: 4,
                  '&:hover': {
                    backgroundColor: '#2d1f4b',
                  },
                }}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
