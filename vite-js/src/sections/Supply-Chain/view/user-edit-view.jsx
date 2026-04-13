import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  InputAdornment,
  FormControl,
  InputLabel,
} from '@mui/material';

export default function PurchaseOrderEntry() {
  const [formData, setFormData] = useState({
    costingRefNo: '',
    image: null,
    masterPoNo: '',
    amsRefNo: 'AMS-2261',
    customerPoNo: '',
    internalPoNo: '',
    rnNo: '',
    customer: '',
    commission: '',
    supplier: '',
    vendorCommission: '',
    merchant: '',
    proceedings: 'Supply Chain',
    orderType: 'New',
    consignee: '',
    transactions: 'Services',
    version: 'Regular',
  });

  const handleChange = (field) => (event) => {
    const value = field === 'image' ? event.target.files[0] : event.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleUpload = () => {
    console.log('Uploading image:', formData.image);
    // actual upload logic yahan likhna hoga
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    // yahan form submit ka logic likhein
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        PURCHASE ORDER ENTRY
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Costing Ref No */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Costing Ref No.</InputLabel>
              <Select
                value={formData.costingRefNo}
                onChange={handleChange('costingRefNo')}
                label="Costing Ref No."
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Ref1">Ref1</MenuItem>
                <MenuItem value="Ref2">Ref2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Image Upload */}
          <Grid item xs={8} md={4}>
            <TextField
              fullWidth
              type="file"
              onChange={handleChange('image')}
              inputProps={{ accept: 'image/*' }}
            />
          </Grid>
          <Grid item xs={4} md={1}>
            <Button variant="contained" onClick={handleUpload}>
              Upload
            </Button>
          </Grid>

          {/* Master PO No */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Master PO No."
              value={formData.masterPoNo}
              onChange={handleChange('masterPoNo')}
            />
          </Grid>

          {/* AMS Ref No */}
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="AMS Ref No." value={formData.amsRefNo} disabled />
          </Grid>

          {/* Customer PO No */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Customer PO No."
              value={formData.customerPoNo}
              onChange={handleChange('customerPoNo')}
            />
          </Grid>

          {/* Internal PO No */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Internal PO No."
              value={formData.internalPoNo}
              onChange={handleChange('internalPoNo')}
            />
          </Grid>

          {/* RN No */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="RN No."
              value={formData.rnNo}
              onChange={handleChange('rnNo')}
            />
          </Grid>

          {/* Customer */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select
                value={formData.customer}
                onChange={handleChange('customer')}
                label="Customer"
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Customer1">Customer 1</MenuItem>
                <MenuItem value="Customer2">Customer 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Commission */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Commission"
              type="number"
              value={formData.commission}
              onChange={handleChange('commission')}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Grid>

          {/* Supplier */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={formData.supplier}
                onChange={handleChange('supplier')}
                label="Supplier"
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Supplier1">Supplier 1</MenuItem>
                <MenuItem value="Supplier2">Supplier 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Vendor Commission */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Vendor Commission"
              type="number"
              value={formData.vendorCommission}
              onChange={handleChange('vendorCommission')}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Grid>

          {/* Merchant */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Merchant</InputLabel>
              <Select
                value={formData.merchant}
                onChange={handleChange('merchant')}
                label="Merchant"
              >
                <MenuItem value="">Please Select</MenuItem>
                <MenuItem value="Merchant1">Merchant 1</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Proceedings */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Proceedings</InputLabel>
              <Select
                value={formData.proceedings}
                onChange={handleChange('proceedings')}
                label="Proceedings"
              >
                <MenuItem value="Supply Chain">Supply Chain</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Order Type */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Order Type</InputLabel>
              <Select
                value={formData.orderType}
                onChange={handleChange('orderType')}
                label="Order Type"
              >
                <MenuItem value="New">New</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Consignee */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Consignee"
              value={formData.consignee}
              onChange={handleChange('consignee')}
            />
          </Grid>

          {/* Transactions */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Transactions</InputLabel>
              <Select
                value={formData.transactions}
                onChange={handleChange('transactions')}
                label="Transactions"
              >
                <MenuItem value="Services">Services</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Version */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Version</InputLabel>
              <Select value={formData.version} onChange={handleChange('version')} label="Version">
                <MenuItem value="Regular">Regular</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit">
              Submit
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}
