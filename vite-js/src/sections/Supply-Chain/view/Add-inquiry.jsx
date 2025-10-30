import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  MenuItem,
  Container,
  Paper,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const AddInquiry = () => {
  const purple = '#3b2a64';

  const [customer, setCustomer] = useState('');
  const [supplier, setSupplier] = useState('');

  // 🔹 Each field supports multiple images
  const [images, setImages] = useState({
    front: [],
    back: [],
    img1: [],
    img2: [],
  });

  // 🔹 Handle multiple uploads
  const handleUpload = (key, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newFiles = files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      setImages((prev) => ({
        ...prev,
        [key]: [...prev[key], ...newFiles],
      }));
    }
  };

  // 🔹 Remove single image
  const handleRemove = (key, index) => {
    setImages((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    alert('Form Saved (API later)');
  };

  const handleCancel = () => {
    alert('Cancelled');
  };

  // 🔹 Reusable Image Upload Component
  const renderImageUpload = (label, key) => (
    <Grid item xs={12} md={6}>
      <Typography sx={{ fontWeight: 'bold', mb: 1 }}>{label}</Typography>
      <Button
        component="label"
        variant="contained"
        fullWidth
        sx={{
          mb: 2,
          backgroundColor: purple,
          '&:hover': { backgroundColor: '#2c1f4d' },
        }}
      >
        Upload Images
        <input
          type="file"
          multiple
          hidden
          accept="image/*"
          onChange={(e) => handleUpload(key, e)}
        />
      </Button>

      {/* Thumbnails */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {images[key].map((img, index) => (
          <Box
            key={index}
            sx={{
              position: 'relative',
              width: 90,
              height: 90,
              borderRadius: 2,
              overflow: 'hidden',
              border: '2px solid #ddd',
            }}
          >
            <img
              src={img.url}
              alt={img.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                '&:hover': { background: 'rgba(0,0,0,0.8)' },
              }}
              onClick={() => handleRemove(key, index)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: purple }}>
          INQUIRY
        </Typography>

        <Grid container spacing={2}>
          {/* Row 1 */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Customer Inquiry Date"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Inquiry Type" defaultValue="">
              <MenuItem value="Order">Order</MenuItem>
              <MenuItem value="Sample">Sample</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Sample No#" />
          </Grid>

          {/* Row 2 */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Creation Date"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Customer dropdown */}
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            >
              <MenuItem value="5 POINTZ CLOTHING">5 POINTZ CLOTHING INC</MenuItem>
              <MenuItem value="URBAN THREADS">URBAN THREADS</MenuItem>
              <MenuItem value="STYLE HOUSE">STYLE HOUSE</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Factory Del. Date"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Row 3 */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Factory Handover Date"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Supplier dropdown */}
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            >
              <MenuItem value="3A FASHION APPAREL">3A FASHION APPAREL</MenuItem>
              <MenuItem value="FABRIC PLANET">FABRIC PLANET</MenuItem>
              <MenuItem value="THREAD & CO">THREAD & CO</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Customer Del. Date"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Row 4 */}
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Status" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Dispatch Date"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Item Desc." />
          </Grid>

          {/* Row 5 */}
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Style" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Content" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Category" />
          </Grid>

          {/* 🔹 Image Upload Rows (2 per row) */}
          {renderImageUpload('Front Image', 'front')}
          {renderImageUpload('Back Image', 'back')}
          {renderImageUpload('Image 1', 'img1')}
          {renderImageUpload('Image 2', 'img2')}

          {/* Fabric & Other Info */}
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Fabric" defaultValue="">
              <MenuItem value="FLANNEL">FLANNEL</MenuItem>
              <MenuItem value="COTTON">COTTON</MenuItem>
              <MenuItem value="DENIM">DENIM</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Fabric Wash" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Color" />
          </Grid>

          {/* Row */}
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Fob Price" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Inquiry Qty" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Delivery Date"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField fullWidth label="GSM" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Order Qtys" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Size" />
          </Grid>

          {/* Buttons */}
          <Grid item xs={12} md={12} sx={{ textAlign: 'right', mt: 2 }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: purple,
                mr: 2,
                width: 120,
                '&:hover': { backgroundColor: '#2c1f4d' },
              }}
            >
              ADD
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                backgroundColor: purple,
                mr: 2,
                width: 120,
                '&:hover': { backgroundColor: '#2c1f4d' },
              }}
            >
              Save
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleCancel}
              sx={{
                backgroundColor: purple,
                width: 120,
                '&:hover': { backgroundColor: '#2c1f4d' },
              }}
            >
              Cancel
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AddInquiry;
