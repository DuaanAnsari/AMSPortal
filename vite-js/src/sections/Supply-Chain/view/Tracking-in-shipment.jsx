import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBackIosNew } from '@mui/icons-material';

// ----------------------------------------------------------------------

export default function TrackingInShipmentPage() {
  const navigate = useNavigate();
  const [poNumber, setPoNumber] = useState('');
  const [showResults, setShowResults] = useState(false);

  const mockRows = [
    {
      invoiceNo: 'SM AST SADSTK-BS-CR-004-22-23',
      value: '10094.72',
      invoiceDate: '10 Nov 2022',
      shipmentDate: '08 Nov 2022',
      billNo: 'CNCKHI5068',
      voyage: 'CMA CGM ORFEO 2145',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card sx={{ p: 4, borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton size="small" onClick={() => navigate(-1)}>
            <ArrowBackIosNew fontSize="small" />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#6b6f76' }}>
            PO TRACKING IN SHIPMENT
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="flex-end">
          <Grid item xs={12} md={4}>
            <Typography sx={{ mb: 1, fontWeight: 600 }}>PO Number:</Typography>
            <TextField
              fullWidth
              size="small"
              value={poNumber}
              onChange={(event) => setPoNumber(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              variant="contained"
              size="small"
              sx={{
                minWidth: 120,
                height: 36,
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: '#3f336d',
                '&:hover': { bgcolor: '#302857' },
              }}
              onClick={() => setShowResults(true)}
            >
              Search
            </Button>
          </Grid>
        </Grid>

        {showResults && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, color: '#6b6f76' }}>
              This Order Exist in Following Invoices
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f28f5a' }}>
                  {[
                    'Invoice No',
                    'Value',
                    'Invoice Date',
                    'Shipment Date',
                    'Bill No',
                    'Voyage',
                    'View',
                  ].map((head) => (
                    <TableCell
                      key={head}
                      sx={{ color: '#fff', fontWeight: 600, border: '1px solid #f28f5a' }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mockRows.map((row) => (
                  <TableRow key={row.invoiceNo}>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.invoiceNo}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.value}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.invoiceDate}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.shipmentDate}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.billNo}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.voyage}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                      <Button size="small" sx={{ textTransform: 'none', color: '#3f336d' }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: '#3f336d' }}>
                  <TableCell colSpan={7} sx={{ color: '#fff', fontWeight: 600 }}>
                    Page 1
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
    </Container>
  );
}

