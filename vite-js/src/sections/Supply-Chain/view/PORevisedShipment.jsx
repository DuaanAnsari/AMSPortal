import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';

export default function PORevisedShipmentView() {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [buyerDate, setBuyerDate] = useState('');
  const [vendorDate, setVendorDate] = useState('');

  const poNo = location.state?.poNo || '';
  const customer = location.state?.customer || '';
  const supplier = location.state?.supplier || '';
  const shipmentDate = location.state?.shipmentDate || '';
  const placementDate = location.state?.placementDate || '';

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ py: 2 }}>
      <CustomBreadcrumbs
        heading="PO REVISED SHIPMENT"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Purchase Orders', href: '/dashboard/supply-chain' },
          { name: 'PO Revised Shipment' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Card sx={{ p: 3 }}>
        {/* Top PO title */}
        <Typography
          variant="h6"
          sx={{ mb: 3, fontWeight: 'bold' }}
        >
          PO No. {poNo || id}
        </Typography>

        <Grid container spacing={4}>
          {/* Left: Purchase Order Detail */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold', mb: 1 }}
            >
              Purchase Order Detail
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 1 }}>
              <Typography variant="body2">Season Name</Typography>
              <Typography variant="body2">-</Typography>

              <Typography variant="body2">Order Type</Typography>
              <Typography variant="body2">-</Typography>

              <Typography variant="body2">Order Placement Date</Typography>
              <Typography variant="body2">{placementDate || '-'}</Typography>

              <Typography variant="body2">Shipment Date</Typography>
              <Typography variant="body2">{shipmentDate || '-'}</Typography>

              <Typography variant="body2">Lead Time Margin</Typography>
              <Typography variant="body2">-</Typography>

              <Typography variant="body2">Transaction should be in</Typography>
              <Typography variant="body2">-</Typography>

              <Typography variant="body2">Tolerance</Typography>
              <Typography variant="body2">-</Typography>
            </Box>

            {/* Revised Shipment Dates */}
            <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: '200px auto', rowGap: 2, columnGap: 1, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                Revised Shipment Date [Buyer]
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  type="date"
                  size="small"
                  value={buyerDate}
                  onChange={(e) => setBuyerDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 200 }}
                />
                <Button variant="contained" size="small">
                  Update
                </Button>
              </Box>

              <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                Revised Shipment Date [Vendor]
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  type="date"
                  size="small"
                  value={vendorDate}
                  onChange={(e) => setVendorDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 200 }}
                />
                <Button variant="contained" size="small">
                  Update
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Right: Buyer / Supplier / Merchandiser info */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', mb: 1 }}
              >
                Buyer Information
              </Typography>
              <Typography variant="body2">{customer || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', mb: 1 }}
              >
                Supplier Information
              </Typography>
              <Typography variant="body2">{supplier || '-'}</Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', mb: 1 }}
              >
                Merchandiser Information
              </Typography>
              <Typography variant="body2">-</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Items to be sourced */}
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            Items to be sourced
          </Typography>

          <TableContainer
            sx={{
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Style</TableCell>
                  <TableCell>Article No</TableCell>
                  <TableCell>Item Description</TableCell>
                  <TableCell>Colourway</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>PO Quantity</TableCell>
                  <TableCell>Item Price</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No items to display
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Delivery Schedule */}
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            Delivery Schedule
          </Typography>
          <Typography variant="body2">No schedule data.</Typography>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Box>
      </Card>
    </Container>
  );
}





