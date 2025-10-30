import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function InquiryPage() {
  const theme = useTheme();
  const [poNumber, setPoNumber] = useState('');
  const [showTable, setShowTable] = useState(false);

  // sample data (will show after search)
  const inquiryData = [
    {
      poNo: '37510',
      customer: 'LONE ROCK',
      supplier: 'Continental Apparels',
      shipment: '30 Jun 2025',
      bookedQty: 864,
      shippedQty: 0,
      cancelQty: 0,
      difference: 864,
    },
  ];

  const handleSearch = () => {
    if (poNumber.trim() !== '') {
      setShowTable(true);
    } else {
      alert('Please enter PO Number!');
      setShowTable(false);
    }
  };

  return (
    <Card
      sx={{
        mt: 3,
        p: 3,
        boxShadow: 3,
        borderRadius: 3,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.text.primary,
            mb: 3,
          }}
        >
          Inquiry
        </Typography>

        {/* Search Section */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="PO Number"
              fullWidth
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              size="small"
            />
          </Grid>

          <Grid item>
            <IconButton
              onClick={handleSearch}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': { backgroundColor: theme.palette.primary.dark },
              }}
            >
              <SearchIcon />
            </IconButton>
          </Grid>
        </Grid>

        {/* Alert message */}
        {showTable && (
          <Typography variant="body2" sx={{ color: 'red', mt: 2, fontWeight: 500 }}>
            This Order Exists with Following Details
          </Typography>
        )}

        {/* Table Section */}
        {showTable && (
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
                    'PO No.',
                    'Customer',
                    'Supplier',
                    'Shipment',
                    'Booked Qty',
                    'Shipped Qty',
                    'Cancel Qty',
                    'Difference',
                    'Action',
                  ].map((head) => (
                    <TableCell
                      key={head}
                      sx={{
                        fontWeight: 'bold',
                        color: theme.palette.text.primary,
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {inquiryData.map((row, i) => (
                  <TableRow
                    key={i}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      transition: '0.2s',
                    }}
                  >
                    <TableCell>{row.poNo}</TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>{row.supplier}</TableCell>
                    <TableCell>{row.shipment}</TableCell>
                    <TableCell>{row.bookedQty}</TableCell>
                    <TableCell>{row.shippedQty}</TableCell>
                    <TableCell>{row.cancelQty}</TableCell>
                    <TableCell>{row.difference}</TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          color: theme.palette.error.main,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                        onClick={() => alert(`Cancel Qty for ${row.poNo}`)}
                      >
                        Delete Cancel Qty
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
