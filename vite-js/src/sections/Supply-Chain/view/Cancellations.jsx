import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  useTheme, // ✅ for theme colors
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search'; // ✅ search icon import

export default function CancelQuantityControlPanel() {
  const theme = useTheme(); // ✅ access Material UI theme
  const [poNumber, setPoNumber] = useState('');
  const [vendor, setVendor] = useState('ALL');

  const rows = [
    {
      poNo: '37080-YPO-DENIM',
      customer: 'LONE ROCK',
      vendor: 'MS Garments',
      placement: 'Feb 26, 2025',
      shipment: 'May 05, 2025',
      bookedQty: 3336,
      shippedQty: 1824,
    },
    {
      poNo: '37003-OAT',
      customer: 'LONE ROCK',
      vendor: 'MS Garments',
      placement: 'Feb 25, 2025',
      shipment: 'Apr 28, 2025',
      bookedQty: 504,
      shippedQty: 168,
    },
    {
      poNo: '36864-SS-CREAM',
      customer: 'LONE ROCK',
      vendor: 'Comfort Apparel',
      placement: 'Jan 16, 2025',
      shipment: 'Mar 10, 2025',
      bookedQty: 15600,
      shippedQty: 15504,
    },
  ];

  const handleSearch = () => {
    alert(`Searching for PO#: ${poNumber} and Vendor: ${vendor}`);
  };

  return (
    <Card sx={{ mt: 3, p: 3, boxShadow: 2, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 3 }}>
          Cancel Quantity Control Panel
        </Typography>

        {/* 🔍 Search + Vendor in one row */}
        <Grid
          container
          spacing={2}
          alignItems="center"
          justifyContent="flex-start"
          sx={{ mt: 2, mb: 2 }}
        >
          {/* PO Input */}
          <Grid item xs={12} sm={3}>
            <TextField
              label="PO #"
              fullWidth
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              size="small"
            />
          </Grid>

          {/* Search Icon Button (uses theme color) */}
          <Grid item>
            <IconButton
              onClick={handleSearch}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              <SearchIcon />
            </IconButton>
          </Grid>

          {/* Vendor Dropdown */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Vendor</InputLabel>
              <Select
                value={vendor}
                label="Vendor"
                onChange={(e) => setVendor(e.target.value)}
                sx={{
                  backgroundColor: 'background.paper',
                  borderRadius: '8px',
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '& .MuiSelect-select': {
                    color:
                      vendor === 'ALL' ? theme.palette.text.secondary : theme.palette.primary.main,
                    fontWeight: vendor === 'ALL' ? 400 : 600,
                  },
                }}
              >
                <MenuItem value="ALL">ALL</MenuItem>
                <MenuItem value="MS Garments">MS Garments</MenuItem>
                <MenuItem value="Comfort Apparel">Comfort Apparel</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Table Section */}
        <TableContainer
          component={Paper}
          sx={{
            mt: 3,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                {[
                  'PO. No.',
                  'Customer',
                  'Vendor',
                  'Placement',
                  'Shipment',
                  'Booked Qty',
                  'Shipped Qty',
                  'Cancel Qty',
                ].map((head) => (
                  <TableCell
                    key={head}
                    sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow
                  key={i}
                  sx={{
                    '&:hover': { backgroundColor: theme.palette.action.hover },
                    transition: '0.2s',
                  }}
                >
                  <TableCell>{row.poNo}</TableCell>
                  <TableCell>{row.customer}</TableCell>
                  <TableCell>{row.vendor}</TableCell>
                  <TableCell>{row.placement}</TableCell>
                  <TableCell>{row.shipment}</TableCell>
                  <TableCell>{row.bookedQty}</TableCell>
                  <TableCell>{row.shippedQty}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color: theme.palette.primary.main,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                      onClick={() => alert(`Cancel Qty clicked for ${row.poNo}`)}
                    >
                      Cancel QTY
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
