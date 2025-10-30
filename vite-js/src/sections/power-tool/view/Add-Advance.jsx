import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

export default function DepositInvoiceEntry() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    invoiceNo: 'AST-TFA-ADV-25-0001',
    date: new Date().toISOString().split('T')[0],
    poNo: '',
    customerName: '',
    itemName: '',
    bank: 'HAB BANK',
    totalQty: '',
    amount: '',
    percentage: '',
    totalValue: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('Saved Data:', formData);
    alert('Deposit Invoice Saved ✅');
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      {/* 🔹 Header Section with Breadcrumb */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          color="black"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}
        >
          Deposit Invoice Entry
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 500,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Typography>

          <Typography
            sx={{
              mx: 1,
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            •
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            Deposit Invoice
          </Typography>
        </Box>
      </Box>

      {/* 🔹 Card Form */}
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ px: 4, py: 4, backgroundColor: 'white' }}>
          <Grid container spacing={2}>
            {/* 🔹 Row 1 */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>
                Enter Invoice NO
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="invoiceNo"
                value={formData.invoiceNo}
                onChange={handleChange}
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>
                Date
              </Typography>
              <TextField
                fullWidth
                type="date"
                size="small"
                name="date"
                value={formData.date}
                onChange={handleChange}
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>
                PO NO
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="poNo"
                value={formData.poNo}
                onChange={handleChange}
                sx={{ mt: 0.5 }}
              />
            </Grid>

            {/* 🔹 Row 2 */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>
                Customer Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>
                Item Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>
                Bank
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                <Select name="bank" value={formData.bank} onChange={handleChange}>
                  <MenuItem value="HAB BANK">HAB BANK</MenuItem>
                  <MenuItem value="UBL BANK">UBL BANK</MenuItem>
                  <MenuItem value="MCB BANK">MCB BANK</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 🔹 Row 3 */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>
                Total Qty
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="totalQty"
                value={formData.totalQty}
                onChange={handleChange}
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>
                Amount
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>
                %
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="percentage"
                value={formData.percentage}
                onChange={handleChange}
                sx={{ mt: 0.5 }}
              />
            </Grid>

            {/* 🔹 Row 4 */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={600}>
                Total Value
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="totalValue"
                value={formData.totalValue}
                onChange={handleChange}
                sx={{ mt: 0.5 }}
              />
            </Grid>
          </Grid>

          {/* 🔹 Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              sx={{
                px: 6,
                py: 1,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 600,
              }}
              onClick={handleSubmit}
            >
              Save
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
