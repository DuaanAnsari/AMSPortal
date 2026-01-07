import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { paths } from 'src/routes/paths';

export default function AddConsigneePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    packageName: '',
    consigneeName: '',
    cityCountry: '',
    phone: '',
    postZipCode: '',
    address: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // TODO: API integration for saving consignee
    navigate(paths.dashboard.powerTool.consigneeView);
  };

  const handleCancel = () => {
    navigate(paths.dashboard.powerTool.consigneeView);
  };

  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        borderRadius: 2,
        mt: 3,
        p: 4,
        boxShadow: theme.palette.mode === 'light' ? '0px 3px 10px rgba(0,0,0,0.05)' : 'none',
        bgcolor: theme.palette.background.paper,
      })}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#444' }}>
        Consignee Entry
      </Typography>

      <Grid container spacing={3}>
        {/* Package & Consignee Name */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ mt: '20px', fontWeight: 500, color: '#555' }}>
            Package Name:
          </Typography>
          <TextField
            fullWidth
            name="packageName"
            value={form.packageName}
            onChange={handleChange}
            size="small"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" sx={{ mt: '20px', fontWeight: 500, color: '#555' }}>
            Consignee Name:
          </Typography>
          <TextField
            fullWidth
            name="consigneeName"
            value={form.consigneeName}
            onChange={handleChange}
            size="small"
          />
        </Grid>

        {/* City / Country, Phone, Post / Zip */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" sx={{ mt: '20px', fontWeight: 500, color: '#555' }}>
            City / Country:
          </Typography>
          <TextField
            fullWidth
            name="cityCountry"
            value={form.cityCountry}
            onChange={handleChange}
            size="small"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" sx={{ mt: '20px', fontWeight: 500, color: '#555' }}>
            PHONE #:
          </Typography>
          <TextField
            fullWidth
            name="phone"
            value={form.phone}
            onChange={handleChange}
            size="small"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" sx={{ mt: '20px', fontWeight: 500, color: '#555' }}>
            POST / ZIP CODE:
          </Typography>
          <TextField
            fullWidth
            name="postZipCode"
            value={form.postZipCode}
            onChange={handleChange}
            size="small"
          />
        </Grid>

        {/* Address full width */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mt: '20px', fontWeight: 500, color: '#555' }}>
            Address:
          </Typography>
          <TextField
            fullWidth
            name="address"
            value={form.address}
            onChange={handleChange}
            size="small"
            multiline
            minRows={2}
          />
        </Grid>
      </Grid>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          gap: 3,
          mt: 4,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          sx={{
            width: '180px',
            textTransform: 'none',
          }}
          onClick={handleSave}
        >
          Save
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={{
            width: '180px',
            textTransform: 'none',
          }}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}











