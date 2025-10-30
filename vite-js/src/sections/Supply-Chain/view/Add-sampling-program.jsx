import React from 'react';
import { Box, Button, Grid, TextField, Typography, MenuItem, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function SamplingProgramForm() {
  return (
    <Box sx={{ p: 4, background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <Typography variant="h6" fontWeight={700} mb={3}>
        SAMPLING PROGRAM
      </Typography>

      {/* Image Upload */}
      {/* Image Upload (Bigger Size Applied) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 4,
          gap: 3,
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: '18px',
            whiteSpace: 'nowrap',
            minWidth: '80px',
          }}
        >
          Image:
        </Typography>

        <input
          type="file"
          style={{
            fontSize: '16px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
          }}
        />

        <Button
          variant="contained"
          sx={{
            backgroundColor: '#3a2f55',
            textTransform: 'none',
            px: 4,
            py: 1.2,
            fontSize: '16px',
            '&:hover': { backgroundColor: '#3a2f55' },
          }}
        >
          Upload
        </Button>
      </Box>

      {/* Form Fields */}
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography>Sampling Program No</Typography>
            <TextField fullWidth size="medium" value="SPN-0002" />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>Merchant</Typography>
            <TextField fullWidth size="medium" select defaultValue="">
              <MenuItem value="">Select Merchant</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>QA</Typography>
            <TextField fullWidth size="medium" select defaultValue="">
              <MenuItem value="">Select QA</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>Customer</Typography>
            <TextField fullWidth size="medium" select defaultValue="">
              <MenuItem value="">Select Customer</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>Factory</Typography>
            <TextField fullWidth size="medium" select defaultValue="">
              <MenuItem value="">Select Factory</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>Sample PO No.</Typography>
            <TextField fullWidth size="medium" placeholder="Sample PO No." />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Box width="100%">
              <Typography>Fabric</Typography>
              <TextField fullWidth size="medium" select defaultValue="">
                <MenuItem value="">Select Fabric</MenuItem>
              </TextField>
            </Box>
            <IconButton sx={{ ml: 1 }}>
              <AddIcon />
            </IconButton>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>Description</Typography>
            <TextField fullWidth size="medium" placeholder="Description" />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>GSM</Typography>
            <TextField fullWidth size="medium" placeholder="GSM" />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>Sample Size</Typography>
            <TextField fullWidth size="medium" placeholder="Sample Size" />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>Sample Quantity</Typography>
            <TextField fullWidth size="medium" placeholder="Sample Quantity" />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>Delivery Date</Typography>
            <TextField fullWidth size="medium" placeholder="Delivery Date" />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography>Special Instructions</Typography>
            <TextField fullWidth size="medium" placeholder="Special Instructions" />
          </Grid>
        </Grid>
      </Box>

      {/* Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 4,
        }}
      >
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#3a2f55',
            textTransform: 'none',
            px: 4,
            py: 1.2,
            fontSize: '16px',
            '&:hover': { backgroundColor: '#3a2f55' },
          }}
        >
          Save
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#3a2f55',
            textTransform: 'none',
            px: 4,
            py: 1.2,
            fontSize: '16px',
            '&:hover': { backgroundColor: '#3a2f55' },
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
