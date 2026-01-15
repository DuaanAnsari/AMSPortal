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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import InputAdornment from '@mui/material/InputAdornment';
import Iconify from 'src/components/iconify';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import { LoadingButton } from '@mui/lab';

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
  accountNo: '',
  containerNo: '',
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
  docsToBrokerDate: '',
  docsToBankDate: '',
  containerDeliveryDate: '',
  goodsDeliveredDate: '',
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

const ARTICLE_API = 'http://192.168.18.13/api/ShipmentRelease/GetArticleNo';
const SAVE_SHIPMENT_API = 'http://192.168.18.13/api/ShipmentRelease/AddShipment';

export default function ShipmentReleaseAddPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(defaultFormValues);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poSearch, setPoSearch] = useState('');
  const [articleRows, setArticleRows] = useState([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [articleError, setArticleError] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [ldpInvoice, setLdpInvoice] = useState('');
  const [showMainGrid, setShowMainGrid] = useState(false);
  const [gridSearch, setGridSearch] = useState('');

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const fetchArticleRows = async () => {
    if (!poSearch.trim()) {
      setArticleError('Please enter a PO number.');
      setArticleRows([]);
      return;
    }

    setArticleLoading(true);
    setArticleError('');
    try {
      const response = await fetch(`${ARTICLE_API}/${encodeURIComponent(poSearch.trim())}`);
      if (!response.ok) {
        throw new Error('Unable to load article data');
      }
      const data = await response.json();
      const rows = Array.isArray(data) ? data : data ? [data] : [];
      setArticleRows(rows);
      setSelectedArticle(rows[0] ?? null);
    } catch (error) {
      setArticleError(error.message || 'Failed to fetch articles');
      setArticleRows([]);
    } finally {
      setArticleLoading(false);
    }
  };

  const handleSelectClose = () => {
    if (ldpInvoice.trim() && articleRows.length > 0) {
      setArticleRows((prev) =>
        prev.map((row) => ({
          ...row,
          ldpInvoiceNo: ldpInvoice.trim(),
        }))
      );
    }
    setPoDialogOpen(false);
  };

  const handleClearArticle = () => {
    setPoSearch('');
    setArticleRows([]);
    setArticleError('');
    setSelectedArticle(null);
  };

  const totalRemainQty = articleRows.reduce((sum, row) => sum + (Number(row.remainQTY) || 0), 0);
  const totalCartons = articleRows.reduce((sum, row) => sum + (Number(row.cartons) || 0), 0);
  const totalReleaseRateAmount = articleRows.reduce(
    (sum, row) => sum + (Number(row.remainQTY) || 0) * (Number(row.rate) || 0),
    0
  );

  const handleGridChange = (index, field, value) => {
    const updatedRows = [...articleRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setArticleRows(updatedRows);
  };

  const filteredRows = articleRows.filter((row) =>
    Object.values(row).some(
      (val) => val && val.toString().toLowerCase().includes(gridSearch.toLowerCase())
    )
  );

  const handleSave = async () => {
    if (articleRows.length === 0) {
      enqueueSnackbar('No items to save. Please add items to the grid.', { variant: 'warning' });
      return;
    }

    const safeIsoDate = (dateVal) => {
      if (!dateVal) return new Date().toISOString();
      const d = new Date(dateVal);
      // If invalid, return current date as fallback to avoid 400
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    };

    setSaveLoading(true);
    try {
      // Use for...of to handle promises sequentially or loop through all
      for (const row of articleRows) {
        const payload = {
          creationDate: new Date().toISOString(),
          invoiceNo: form.invoice || '',
          vendorInvoiceNo: form.vendorInvoiceNo || '',
          invoiceDate: safeIsoDate(form.date),
          invoiceValue: Number(form.invoiceValue) || 0,
          terms: form.terms || '',
          itemDescription: row.itemDescriptionShippingInvoice || '',
          mode: form.mode || '',
          carrierName: form.carrierName || '',
          voyageFlight: form.voyageFlight || '',
          billNo: form.blAwbNo || '',
          shipmentDate: safeIsoDate(form.shipmentDate),
          containerNo: form.containerNo || '',
          remarks: form.remarks || '',
          isActive: true,
          glEnterd: '',
          currency: form.currency || 'US$',
          userID: 0,
          exchangeRate: Number(form.exchangeRate) || 0,
          exporterInvoiceNo: '',
          exporterInvoiceDate: new Date().toISOString(),
          countryOfOrigin: '',
          destination: form.destination || '',
          portOfLoading: form.portOfLoading || '',
          portOfDischarge: form.portOfDischarge || '',
          shippedExchangeRate: 0,
          bankID: form.bank === 'HAB BANK' ? 1 : 0,
          cargoConsigneeName: '',
          cargoConsigneeAddress1: '',
          cargoConsigneeCity: '',
          cargoConsigneeCountry: '',
          discount: Number(form.discount) || 0,
          heading1: '',
          heading2: '',
          heading3: '',
          heading1Value: totalRemainQty,
          heading2Value: totalCartons,
          heading3Value: totalReleaseRateAmount,
          amsicNo: form.icNo || '',
          etdExpectedDate: safeIsoDate(form.expectedEtd),
          etdActualDate: safeIsoDate(form.actualEtd),
          etaExpectedDate: safeIsoDate(form.expectedEta),
          etaActualDate: safeIsoDate(form.actualEta),
          entryFiledDate: safeIsoDate(form.entryFiledDate),
          goodsClearedDate: safeIsoDate(form.goodsClearedDate),
          docstoBrokerDate: safeIsoDate(form.docsToBrokerDate),
          docstoBankDate: safeIsoDate(form.docsToBankDate),
          goodsDeliveredDate: safeIsoDate(form.goodsDeliveredDate),
          updateSheetremarks: form.updateSheetRemarks || '',
          shipmentStatus: true,
          revisedETA: safeIsoDate(form.revisedEtw),
          etwDate: new Date().toISOString(),
          reverseETWDate: new Date().toISOString(),
          revisedETD: safeIsoDate(form.revisedEtd),
          vpoActualDate: safeIsoDate(form.vpoActualDate),
          containerReleaseDate: safeIsoDate(form.containerReleaseDate),
          containerDeliveryDateASTWH: safeIsoDate(form.containerDeliveryDate),
          wareHouseName: form.warehouseName || '',
          truckerName: form.truckerName || '',
          actualETW: safeIsoDate(form.actualEtw),
          discountValue: 0,
          totalValueWD: totalReleaseRateAmount,
          discountTitle: '',
          poid: Number(row.poid) || 0,
          quantity: Number(row.remainQTY) || 0,
          styles: row.styleNo || '',
          cartons: Number(row.cartons) || 0,
          customerID: Number(row.customerID) || 0,
          supplierID: Number(row.supplierID) || 0,
          popoid: Number(row.poid) || 0,
          shippedRate: Number(row.rate) || 0,
          cartonNo: row.cartonNo || '',
          ldpInvoiceNo: row.ldpInvoiceNo || '',
          itemDescriptionInvoice: row.itemDescriptionShippingInvoice || '',
          colorway: row.colorway || '',
          sizeRange: row.size || '',
          subTotalH1: '',
          subTotalH2: '',
          subTotalH3: '',
          subTotalA1: totalRemainQty,
          subTotalA2: totalCartons,
          subTotalA3: totalReleaseRateAmount
        };

        const response = await fetch(SAVE_SHIPMENT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save row for PO ${row.pono}: ${errorText}`);
        }
        // Safely ignore response text if it's just a success message
        await response.text();
      }

      enqueueSnackbar('Shipment saved successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error saving shipment:', error);
      enqueueSnackbar(error.message || 'Error saving shipment. Please try again.', { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
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
              value={form.icNo || ''}
              onChange={handleChange('icNo')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Invoice"
              value={form.invoice || ''}
              onChange={handleChange('invoice')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={form.date || ''}
              onChange={handleChange('date')}
              size={'small'}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Row 2: Invoice Value + Currency / Exchange Rate / Vendor Invoice No */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Invoice Value"
                value={form.invoiceValue || ''}
                onChange={handleChange('invoiceValue')}
                size="small"
              />
              <TextField
                select
                label="Currency"
                value={form.currency || 'US$'}
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
              value={form.exchangeRate || ''}
              onChange={handleChange('exchangeRate')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vendor Invoice No"
              value={form.vendorInvoiceNo || ''}
              onChange={handleChange('vendorInvoiceNo')}
              size="small"
            />
          </Grid>

          {/* Row: Terms / Mode */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Terms"
              value={form.terms || ''}
              onChange={handleChange('terms')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Mode"
              value={form.mode || ''}
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
              value={form.carrierName || ''}
              onChange={handleChange('carrierName')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Title Of Account"
              value={form.titleOfAccount || ''}
              onChange={handleChange('titleOfAccount')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Voyage Flight"
              value={form.voyageFlight || ''}
              onChange={handleChange('voyageFlight')}
              size="small"
            />
          </Grid>

          {/* Row: Bank Name / BL-AWB / Bank Branch */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Bank Name"
              value={form.bankName || ''}
              onChange={handleChange('bankName')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="BL / AWB No"
              value={form.blAwbNo || ''}
              onChange={handleChange('blAwbNo')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Bank Branch"
              value={form.bankBranch || ''}
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
              value={form.shipmentDate || ''}
              onChange={handleChange('shipmentDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Account No."
              value={form.accountNo || ''}
              onChange={handleChange('accountNo')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Container No."
              value={form.containerNo || ''}
              onChange={handleChange('containerNo')}
              size="small"
            />
          </Grid>

          {/* Row: IBAN / Destination / Port Of Loading */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="IBAN No"
              value={form.ibanNo || ''}
              onChange={handleChange('ibanNo')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Destination"
              value={form.destination || ''}
              onChange={handleChange('destination')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Port Of Loading"
              value={form.portOfLoading || ''}
              onChange={handleChange('portOfLoading')}
              size="small"
            />
          </Grid>

          {/* Row: Port Of Discharge / Remarks */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Port Of Discharge"
              value={form.portOfDischarge || ''}
              onChange={handleChange('portOfDischarge')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Remarks"
              value={form.remarks || ''}
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
              value={form.bank || ''}
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
              value={form.expectedEtd || ''}
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
              value={form.actualEtd || ''}
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
              value={form.revisedEtd || ''}
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
              value={form.expectedEta || ''}
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
              value={form.actualEtw || ''}
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
              value={form.revisedEtw || ''}
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
              value={form.containerReleaseDate || ''}
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
              value={form.goodsClearedDate || ''}
              onChange={handleChange('goodsClearedDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Docs to Broker"
              value={form.docsToBrokerDate || ''}
              onChange={handleChange('docsToBrokerDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Container Delivery Date to AST Warehouse"
              value={form.containerDeliveryDate || ''}
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
              value={form.goodsDeliveredDate || ''}
              onChange={handleChange('goodsDeliveredDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Docs to Bank"
              value={form.docsToBankDate || ''}
              onChange={handleChange('docsToBankDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Entry Filed Date"
              value={form.entryFiledDate || ''}
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
              value={form.vpoActualDate || ''}
              onChange={handleChange('vpoActualDate')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Warehouse Name"
              value={form.warehouseName || ''}
              onChange={handleChange('warehouseName')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Trucker Name"
              value={form.truckerName || ''}
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
              value={form.updateSheetRemarks || ''}
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
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    minWidth: 220,
                    bgcolor: '#453e6b',
                    color: 'white',
                    '&:hover': { bgcolor: '#352f52' },
                  }}
                  onClick={() => setShowMainGrid(true)}
                >
                  Get Data
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {/* Master Page Grid Section */}
          {showMainGrid && articleRows.length > 0 && (
            <Grid item xs={12}>
              <Card sx={{ mt: 3, p: 2, border: '1px solid #ddd' }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <TextField
                    size="small"
                    placeholder="Search Grid..."
                    value={gridSearch}
                    onChange={(e) => setGridSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 300 }}
                  />
                </Box>
                <TableContainer sx={{ border: '1px solid #eee' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#ff9166' }}>
                        {[
                          'PO. No.',
                          'LDP Invoice No.',
                          'Customer',
                          'Item Des.',
                          'Style No',
                          'Size',
                          'PO Quantity',
                          'Shipped Quantity',
                          'Release Quantity',
                          'Cartons',
                          'Carton#',
                          'Shipped Rate',
                          'Delivery Mode',
                        ].map((head) => (
                          <TableCell
                            key={head}
                            sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              borderRight: '1px solid rgba(255,255,255,0.3)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {head}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRows.map((row) => {
                        const actualIndex = articleRows.indexOf(row);
                        return (
                          <TableRow key={actualIndex} hover>
                            <TableCell sx={{ borderRight: '1px solid #eee' }}>{row.pono}</TableCell>
                            <TableCell sx={{ borderRight: '1px solid #eee', p: 0.5 }}>
                              <TextField
                                fullWidth
                                size="small"
                                value={row.ldpInvoiceNo || ''}
                                onChange={(e) => handleGridChange(actualIndex, 'ldpInvoiceNo', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderRight: '1px solid #eee' }}>
                              {row.customerName}
                            </TableCell>
                            <TableCell sx={{ borderRight: '1px solid #eee', p: 0.5 }}>
                              <TextField
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
                                value={row.itemDescriptionShippingInvoice || ''}
                                onChange={(e) =>
                                  handleGridChange(actualIndex, 'itemDescriptionShippingInvoice', e.target.value)
                                }
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderRight: '1px solid #eee' }}>{row.styleNo}</TableCell>
                            <TableCell sx={{ borderRight: '1px solid #eee' }}>{row.size}</TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                              {row.quantity}
                            </TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                              {row.releaseQty || 0}
                            </TableCell>
                            <TableCell sx={{ borderRight: '1px solid #eee', p: 0.5 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={row.remainQTY || ''}
                                onChange={(e) => handleGridChange(actualIndex, 'remainQTY', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderRight: '1px solid #eee', p: 0.5 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={row.cartons || ''}
                                onChange={(e) => handleGridChange(actualIndex, 'cartons', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderRight: '1px solid #eee' }}>{row.cartonNo || ''}</TableCell>
                            <TableCell sx={{ borderRight: '1px solid #eee', p: 0.5 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={row.rate || ''}
                                onChange={(e) => handleGridChange(actualIndex, 'rate', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                              />
                            </TableCell>
                            <TableCell>{row.deliveryTypeName}</TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={13} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            No matching records found
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell colSpan={13} align="right" sx={{ fontWeight: 'bold', bgcolor: 'background.neutral' }}>
                          Records 1 - {filteredRows.length} of {articleRows.length}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          )}

          {/* Extra fields block (3 rows: 3 fields, then 2 fields, then 1 centered field) */}
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              {/* Row 1: 3 fields */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Release Qty Sum"
                  value={totalRemainQty || ''}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  sx={{ bgcolor: 'background.neutral' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Cartons Sum"
                  value={totalCartons || ''}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  sx={{ bgcolor: 'background.neutral' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Release × Rate Amount"
                  value={totalReleaseRateAmount.toFixed(2) || ''}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  sx={{ bgcolor: 'background.neutral' }}
                />
              </Grid>

              {/* Row 2: 2 fields (same width as row below, right aligned) */}
              <Grid item xs={12} sm={4} />
              <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Discount"
                  value={form.discount || ''}
                  onChange={handleChange('discount')}
                />
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <TextField
                  size="small"
                  fullWidth
                  value={form.extraField4 || ''}
                  onChange={handleChange('extraField4')}
                />
              </Grid>

              {/* Row 3: single right-aligned field */}
              <Grid item xs={12} sm={8} />
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  value={form.extraField6 || ''}
                  onChange={handleChange('extraField6')}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <LoadingButton
            variant="contained"
            onClick={handleSave}
            loading={saveLoading}
            disabled={saveLoading}
          >
            Save
          </LoadingButton>
          <Button variant="outlined" color="inherit" onClick={handleCancel} disabled={saveLoading}>
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
                value={poSearch || ''}
                onChange={(e) => setPoSearch(e.target.value)}
                sx={{ minWidth: 220 }}
              />
            </Grid>
            <Grid item>
              <Button variant="contained" size="small" onClick={fetchArticleRows}>
                Get Data
              </Button>
            </Grid>
          </Grid>
          {articleLoading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Loading article data…
              </Typography>
            </Box>
          )}
          {articleError && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="error">
                {articleError}
              </Typography>
            </Box>
          )}
          {articleRows.length > 0 && (
            <>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Item Description"
                    value={articleRows[0]?.itemDescriptionShippingInvoice || ''}
                    multiline
                    minRows={2}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="LDP Invoice No"
                    size="small"
                    value={ldpInvoice || ''}
                    onChange={(event) => setLdpInvoice(event.target.value)}
                  />
                </Grid>
              </Grid>
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#ff9166' }}>
                      {[
                        'PO No.',
                        'Customer',
                        'Style',
                        'Size Range',
                        'PO Quantity',
                        'Shipped Qty',
                        'Release Qty',
                        'Cartons',
                        'Carton#',
                        'Max Allow Qty',
                        'Cancel Qty',
                        'Rate',
                        'ID',
                        'Delivery Mode',
                        'Internal PO No.',
                      ].map((head) => (
                        <TableCell
                          key={head}
                          sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            borderRight: '1px solid rgba(255,255,255,0.3)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {head}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {articleRows.map((row, index) => (
                      <TableRow
                        key={`${row.pono}-${row.styleNo}`}
                        hover
                        onClick={() => setSelectedArticle(row)}
                        selected={selectedArticle?.pono === row.pono && selectedArticle?.styleNo === row.styleNo}
                      >
                        <TableCell>{row.pono}</TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{row.styleNo}</TableCell>
                        <TableCell>{row.size}</TableCell>
                        <TableCell>{row.quantity ?? '-'}</TableCell>
                        <TableCell>{row.releaseQty ?? '-'}</TableCell>
                        <TableCell>{row.remainQTY ?? '-'}</TableCell>
                        <TableCell>{row.cartons ?? '-'}</TableCell>
                        <TableCell>{row.cartons ?? '-'}</TableCell>
                        <TableCell>{row.qtYwithTolerance ?? '-'}</TableCell>
                        <TableCell>{row.cancelQty ?? '-'}</TableCell>
                        <TableCell>{row.rate ?? '-'}</TableCell>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.deliveryTypeName}</TableCell>
                        <TableCell>{row.internalPONO}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Release Qty Sum"
                    value={totalRemainQty.toString()}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Cartons Sum"
                    value={totalCartons.toString()}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Release × Rate"
                    value={totalReleaseRateAmount.toFixed(2)}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', pr: 3, pb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleSelectClose}
          >
            Select &amp; Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

