import { useState } from 'react';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const defaultFormValues = {
  icNo: 'AMS-1829-26',
  invoice: '',
  date: '',
  invoiceValue: '',
  currency: 'US$',
  exchangeRate: '',
  vendorInvoiceNo: '',
  terms: '',
  mode: '',
  carrierName: '',
  titleOfAccount: '',
  voyageFlight: '',
  bankName: '',
  blAwbNo: '',
  bankBranch: '',
  shipmentDate: '',
  ibanNo: '',
  destination: '',
  portOfLoading: '',
  portOfDischarge: '',
  remarks: '',
  bank: '',
  discount: '',
  expectedEtd: '',
  actualEtd: '',
  revisedEtd: '',
  expectedEta: '',
  actualEta: '',
  revisedEtw: '',
  actualEtw: '',
  containerReleaseDate: '',
  goodsClearedDate: '',
  docsToBroker: '',
  containerDeliveryDate: '',
  goodsDeliveredDate: '',
  docsToBank: '',
  entryFiledDate: '',
  vpoActualDate: '',
  warehouseName: '',
  truckerName: '',
  updateSheetRemarks: '',
  articleNo: '',
  extraField1: '',
  extraField2: '',
  extraField3: '',
  extraField4: '',
  extraField5: '',
  extraField6: '',
};

export default function ShipmentReleaseAddPage() {
  const [form, setForm] = useState(defaultFormValues);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poSearch, setPoSearch] = useState('');

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = () => {
    // TODO: integrate with API
    // console.log('Save Shipment Release', form);
  };

  const handleCancel = () => {
    // TODO: navigate back or reset form
    setForm(defaultFormValues);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <CustomBreadcrumbs
        heading="SHIPMENT RELEASE"
        links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'Shipment Release' }]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Card sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Row 1: IC # / Invoice / Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="IC #"
              value={form.icNo}
              onChange={handleChange('icNo')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Invoice"
              value={form.invoice}
              onChange={handleChange('invoice')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={form.date}
              onChange={handleChange('date')}
              size={ 'small' }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Row 2: Invoice Value + Currency / Exchange Rate / Vendor Invoice No */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Invoice Value"
                value={form.invoiceValue}
                onChange={handleChange('invoiceValue')}
                size="small"
              />
              <TextField
                select
                label="Currency"
                value={form.currency}
                onChange={handleChange('currency')}
                size="small"
                sx={{ minWidth: 80 }}
              >
                <MenuItem value="US$">US$</MenuItem>
                <MenuItem value="PKR">PKR</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </TextField>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Exchange Rate"
              value={form.exchangeRate}
              onChange={handleChange('exchangeRate')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vendor Invoice No"
              value={form.vendorInvoiceNo}
              onChange={handleChange('vendorInvoiceNo')}
              size="small"
            />
          </Grid>

          {/* Row: Terms / Mode */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Terms"
              value={form.terms}
              onChange={handleChange('terms')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Mode"
              value={form.mode}
              onChange={handleChange('mode')}
              size="small"
            >
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="Sea">Sea</MenuItem>
              <MenuItem value="Air">Air</MenuItem>
              <MenuItem value="Road">Road</MenuItem>
            </TextField>
          </Grid>

          {/* Row: Carrier / Title Of Account / Voyage Flight */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Carrier Name"
              value={form.carrierName}
              onChange={handleChange('carrierName')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Title Of Account"
              value={form.titleOfAccount}
              onChange={handleChange('titleOfAccount')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Voyage Flight"
              value={form.voyageFlight}
              onChange={handleChange('voyageFlight')}
              size="small"
            />
          </Grid>

          {/* Row: Bank Name / BL-AWB / Bank Branch */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Bank Name"
              value={form.bankName}
              onChange={handleChange('bankName')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="BL / AWB No"
              value={form.blAwbNo}
              onChange={handleChange('blAwbNo')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Bank Branch"
              value={form.bankBranch}
              onChange={handleChange('bankBranch')}
              size="small"
            />
          </Grid>

          {/* Row: Shipment Date / Account No / Container No */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Shipment Date"
              value={form.shipmentDate}
              onChange={handleChange('shipmentDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Account No."
              value={form.accountNo}
              onChange={handleChange('accountNo')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Container No."
              value={form.containerNo}
              onChange={handleChange('containerNo')}
              size="small"
            />
          </Grid>

          {/* Row: IBAN / Destination / Port Of Loading */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="IBAN No"
              value={form.ibanNo}
              onChange={handleChange('ibanNo')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Destination"
              value={form.destination}
              onChange={handleChange('destination')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Port Of Loading"
              value={form.portOfLoading}
              onChange={handleChange('portOfLoading')}
              size="small"
            />
          </Grid>

          {/* Row: Port Of Discharge / Remarks */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Port Of Discharge"
              value={form.portOfDischarge}
              onChange={handleChange('portOfDischarge')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Remarks"
              value={form.remarks}
              onChange={handleChange('remarks')}
              size="small"
            />
          </Grid>

          {/* Row: Bank / Expected ETD */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Bank"
              value={form.bank}
              onChange={handleChange('bank')}
              size="small"
            >
              <MenuItem value="HAB BANK">HAB BANK</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Expected ETD"
              value={form.expectedEtd}
              onChange={handleChange('expectedEtd')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Row: Actual/Revised ETD & ETA */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Actual ETD"
              value={form.actualEtd}
              onChange={handleChange('actualEtd')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Revised ETD"
              value={form.revisedEtd}
              onChange={handleChange('revisedEtd')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Expected ETA"
              value={form.expectedEta}
              onChange={handleChange('expectedEta')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Row: Actual/ Revised ETW / Container Release Date */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Actual ETW"
              value={form.actualEtw}
              onChange={handleChange('actualEtw')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Revised ETW"
              value={form.revisedEtw}
              onChange={handleChange('revisedEtw')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Container Release Date"
              value={form.containerReleaseDate}
              onChange={handleChange('containerReleaseDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Row: Goods Cleared / Docs to Broker / Container Delivery Date */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Goods Cleared Date"
              value={form.goodsClearedDate}
              onChange={handleChange('goodsClearedDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Docs to Broker"
              value={form.docsToBroker}
              onChange={handleChange('docsToBroker')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Container Delivery Date to AST Warehouse"
              value={form.containerDeliveryDate}
              onChange={handleChange('containerDeliveryDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Row: Goods Delivered / Docs to Bank / Entry Filed Date */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Goods Delivered Date"
              value={form.goodsDeliveredDate}
              onChange={handleChange('goodsDeliveredDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Docs to Bank"
              value={form.docsToBank}
              onChange={handleChange('docsToBank')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Entry Filed Date"
              value={form.entryFiledDate}
              onChange={handleChange('entryFiledDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Row: VPO Actual Date / Warehouse Name / Trucker Name */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="VPO Actual Date"
              value={form.vpoActualDate}
              onChange={handleChange('vpoActualDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Warehouse Name"
              value={form.warehouseName}
              onChange={handleChange('warehouseName')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Trucker Name"
              value={form.truckerName}
              onChange={handleChange('truckerName')}
              size="small"
            />
          </Grid>

          {/* Row: Update Sheet Remarks */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Update Sheet Remarks"
              multiline
              minRows={3}
              value={form.updateSheetRemarks}
              onChange={handleChange('updateSheetRemarks')}
            />
          </Grid>

          {/* Row: Article No heading + Select POs link + Get Data button */}
          <Grid item xs={12}>
            <Grid container alignItems="center">
              {/* Left: heading + link */}
              <Grid item xs={12} sm={4} md={3}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Article No:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'primary.main', cursor: 'pointer' }}
                  onClick={() => setPoDialogOpen(true)}
                >
                  Select POs
                </Typography>
              </Grid>

              {/* Right: Get Data button */}
              <Grid
                item
                xs={12}
                sm={8}
                md={9}
                sx={{ display: 'flex', justifyContent: 'flex-start', mt: { xs: 1, sm: 0 } }}
              >
                <Button variant="contained" size="small" sx={{ minWidth: 220 }}>
                  Get Data
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {/* Extra fields block (3 rows: 3 fields, then 2 fields, then 1 centered field) */}
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              {/* Row 1: 3 fields */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  value={form.extraField1}
                  onChange={handleChange('extraField1')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  value={form.extraField2}
                  onChange={handleChange('extraField2')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  value={form.extraField3}
                  onChange={handleChange('extraField3')}
                />
              </Grid>

              {/* Row 2: 2 fields (same width as row below, right aligned) */}
              <Grid item xs={12} sm={4} />
              <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <TextField
                  label="Discount"
                  size="small"
                  value={form.discount}
                  onChange={handleChange('discount')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <TextField
                  size="small"
                  value={form.extraField4}
                  onChange={handleChange('extraField4')}
                  fullWidth
                />
              </Grid>
            

              {/* Row 3: single right-aligned field */}
              <Grid item xs={12} sm={8} />
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  value={form.extraField6}
                  onChange={handleChange('extraField6')}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
          <Button variant="outlined" color="inherit" onClick={handleCancel}>
            Cancel
          </Button>
        </Box>
      </Card>

      {/* Select POs popup dialog */}
      <Dialog
        open={poDialogOpen}
        onClose={() => setPoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select POs</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                PO. No:
              </Typography>
            </Grid>
            <Grid item xs>
              <TextField
                size="small"
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                sx={{ minWidth: 220 }}
              />
            </Grid>
            <Grid item>
              <Button variant="contained" size="small">
                Get Data
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', pr: 3, pb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setPoDialogOpen(false)}
          >
            Select &amp; Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

