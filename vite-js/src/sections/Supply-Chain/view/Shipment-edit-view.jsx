import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const defaultFormValues = {
  icNo: '',
  invoice: '',
  date: '',
  invoiceValue: '',
  currency: 'US$',
  exchangeRate: '',
  vendorInvoiceNo: '',
  consigneeName: '',
  terms: '',
  addressLine: '',
  city: '',
  mode: '',
  country: '',
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
  revisedEta: '',
  expectedEtw: '',
  revisedEtw: '',
  actualEtw: '',
  containerReleaseDate: '',
  goodsClearedDate: '',
  docsToBrokerDate: '',
  containerDeliveryDate: '',
  goodsDeliveredDate: '',
  docsToBankDate: '',
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
  // Footer top row values
  heading1Value: '',
  heading2Value: '',
  heading3Value: '',
  totalValueWD: '',
  // Second summary grid manual fields
  extraSub1Top: '',
  extraSub2Top: '',
  extraSub3Top: '',
  extraSub1Bottom: '0',
  extraSub2Bottom: '0',
  extraSub3Bottom: '0',
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SHIPMENT_DETAIL_API = `${API_BASE_URL}/api/ShipmentRelease/GetShipment`;
const SHIPMENT_RELEASE_API = `${API_BASE_URL}/api/ShipmentRelease/ShipmentRelease`;
const SHIPMENT_UPDATE_API = `${API_BASE_URL}/api/ShipmentRelease/UpdateShipment`;

export default function ShipmentEditView() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState(defaultFormValues);
  const [cargoId, setCargoId] = useState(0);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poSearch, setPoSearch] = useState('');
  const [articleRows, setArticleRows] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [subTotalsByLdp, setSubTotalsByLdp] = useState({});
  const ldpInvoiceNumbers = articleRows
    .map((row) => row.ldpInvoiceNo)
    .filter((value) => value && String(value).trim().length > 0);
  const uniqueLdpInvoiceNumbers = Array.from(new Set(ldpInvoiceNumbers));

  const ldpRows = useMemo(() => {
    const seen = new Set();
    const rows = [];
    articleRows.forEach((row) => {
      const value = row?.ldpInvoiceNo ? String(row.ldpInvoiceNo).trim() : '';
      if (!value || seen.has(value)) {
        return;
      }
      seen.add(value);
      rows.push({ key: value, label: value });
    });
    if (rows.length === 0) {
      rows.push({ key: '__EMPTY__', label: '' });
    }
    return rows;
  }, [articleRows]);

  useEffect(() => {
    const emptyRow = {
      top1: '',
      top2: '',
      top3: '',
      bottom1: '0',
      bottom2: '0',
      bottom3: '0',
    };
    setSubTotalsByLdp((prev) => {
      const next = {};
      ldpRows.forEach((row, index) => {
        if (prev[row.key]) {
          next[row.key] = prev[row.key];
        } else if (index === 0) {
          next[row.key] = {
            top1: form.extraSub1Top || '',
            top2: form.extraSub2Top || '',
            top3: form.extraSub3Top || '',
            bottom1: String(form.extraSub1Bottom ?? '0'),
            bottom2: String(form.extraSub2Bottom ?? '0'),
            bottom3: String(form.extraSub3Bottom ?? '0'),
          };
        } else {
          next[row.key] = { ...emptyRow };
        }
      });
      return next;
    });
  }, [
    ldpRows,
    form.extraSub1Top,
    form.extraSub2Top,
    form.extraSub3Top,
    form.extraSub1Bottom,
    form.extraSub2Bottom,
    form.extraSub3Bottom,
  ]);

  useEffect(() => {
    const releaseQtySum = articleRows.reduce(
      (sum, row) => sum + (Number(row.remainQTY ?? row.releaseQty) || 0),
      0
    );
    const cartonsSum = articleRows.reduce((sum, row) => sum + (Number(row.cartons) || 0), 0);
    const releaseRateAmount = articleRows.reduce(
      (sum, row) =>
        sum + (Number(row.remainQTY ?? row.releaseQty) || 0) * (Number(row.rate) || 0),
      0
    );
    setForm((prev) => ({
      ...prev,
      heading1Value: releaseQtySum,
      heading2Value: cartonsSum,
      heading3Value: releaseRateAmount,
    }));
  }, [articleRows]);

  const handleGridChange = (index, field, value) => {
    const updatedRows = [...articleRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setArticleRows(updatedRows);
  };

  const handleSubTotalChange = (rowKey, field) => (event) => {
    const value = event.target.value;
    setSubTotalsByLdp((prev) => ({
      ...prev,
      [rowKey]: {
        ...(prev[rowKey] || {}),
        [field]: value,
      },
    }));
  };

  // API Integration
  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${SHIPMENT_DETAIL_API}/${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch shipment details');
        }
        const responseData = await res.json();
        const primaryData = Array.isArray(responseData) ? responseData[0] : responseData;

        if (!isMounted) return;

        // Fetch sibling rows by Invoice No
        let siblingRows = Array.isArray(responseData) ? responseData : [responseData];
        if (primaryData.invoiceNo) {
          try {
            // Fetch all shipments with this Invoice No to see siblings
            const listRes = await fetch(
              `${SHIPMENT_RELEASE_API}?invoiceNo=${encodeURIComponent(primaryData.invoiceNo)}`
            );
            if (listRes.ok) {
              const listData = await listRes.json();
              if (Array.isArray(listData) && listData.length > 0) {
                siblingRows = listData.filter(item =>
                  // Only include items with same invoice and same PO
                  // Actually, user wants different POs for same invoice?
                  // User said "2 row ari hai po id alg hai" (2 rows coming, PO ID is different).
                  // So we just want ALL rows for this invoice.
                  item.invoiceNo === primaryData.invoiceNo
                );
              }
            }
          } catch (ignore) {
            console.warn('Failed to fetch siblings', ignore);
          }
        }

        const data = primaryData;

        // Helper to format date for input type="date" (YYYY-MM-DD)

        if (!isMounted) return;

        // Helper to format date for input type="date" (YYYY-MM-DD)
        const fmtDate = (val) => {
          if (!val || val.startsWith('1900')) return '';
          return val.split('T')[0];
        };

        setForm((prev) => ({
          ...prev,
          icNo:
            data.amsicNo ||
            data.amsicno ||
            data.amsICNo ||
            data.AMSICNo ||
            '', // Note: Payload maps amsicNo <-> icNo
          invoice: data.invoiceNo || '',
          date: fmtDate(data.invoiceDate),
          invoiceValue: data.invoiceValue || '',
          currency: data.currency || 'US$',
          exchangeRate: data.exchangeRate || '',
          vendorInvoiceNo: data.vendorInvoiceNo || '',
          consigneeName: data.cargoConsigneeName || data.consigneeName || '',
          terms: data.terms || '',
          addressLine: data.cargoConsigneeAddress1 || data.addressLine || '',
          city: data.cargoConsigneeCity || data.city || '',
          mode: data.deliveryTypeName || data.mode || '', // API seems to return deliveryTypeName
          country: data.cargoConsigneeCountry || data.country || '',
          carrierName: data.carrierName || '',
          titleOfAccount: data.titleOfAccount || '',
          voyageFlight: data.voyageFlight || '',
          bankName: data.bankName || '',
          blAwbNo: data.billNo || '', // billNo <-> blAwbNo
          bankBranch: data.bankBranch || '',
          shipmentDate: fmtDate(data.shipmentDate),
          accountNo: data.accountNo || '',
          containerNo: data.containerNo || '',
          ibanNo: data.iban || '', // iban <-> ibanNo
          destination: data.destination || '',
          portOfLoading: data.portOfLoading || '',
          portOfDischarge: data.portOfDischarge || '',
          remarks: data.remarks || '',
          bank: data.bankID ? String(data.bankID) : '', // bankID <-> bank
          discount: data.discount || 0,
          expectedEtd: fmtDate(data.etdExpectedDatee || data.etdExpectedDate),
          actualEtd: fmtDate(data.etdActualDatee || data.etdActualDate),
          revisedEtd: fmtDate(data.revisedETDd || data.revisedETD),
          expectedEta: fmtDate(data.etaExpectedDatee || data.etaExpectedDate),
          actualEta: fmtDate(data.etaActualDatee || data.etaActualDate),
          revisedEta: fmtDate(data.revisedETADate || data.revisedETA),
          expectedEtw: fmtDate(data.etwDatee || data.etwDate),
          actualEtw: fmtDate(data.actualETWw || data.actualETW), // API has actualETWw in example
          revisedEtw: fmtDate(data.reverseETWDatee || data.reverseETWDate),
          containerReleaseDate: fmtDate(data.containerReleaseDatee || data.containerReleaseDate),
          goodsClearedDate: fmtDate(data.goodsClearedDatee || data.goodsClearedDate),
          docsToBrokerDate: fmtDate(data.docstoBrokerDatee || data.docstoBrokerDate),
          containerDeliveryDate: fmtDate(data.containerDeliveryDateASTWHh || data.containerDeliveryDateASTWH),
          goodsDeliveredDate: fmtDate(data.goodsDeliveredDatee || data.goodsDeliveredDate),
          docsToBankDate: fmtDate(data.docstoBankDatee || data.docstoBankDate),
          entryFiledDate: fmtDate(data.entryFiledDatee || data.entryFiledDate),
          vpoActualDate: fmtDate(data.vpoActualDatee || data.vpoActualDate),
          warehouseName: data.wareHouseName || '',
          truckerName: data.truckerName || '',
          updateSheetRemarks: data.updateSheetremarks || '',
          // Footer fields mapping
          extraField1: '', // Not in payload/response explicitly as extraField1 usually
          extraField2: '',
          extraField3: '',
          extraField4: data.discountValue || '', // discountValue <-> extraField4 (bottom discount)
          extraField5:
            data.discountTitle !== null && typeof data.discountTitle !== 'undefined'
              ? String(data.discountTitle)
              : '', // discountTitle <-> extraField5
          extraField6: '',

          heading1Value: data.heading1Value || 0,
          heading2Value: data.heading2Value || 0,
          heading3Value: data.heading3Value || 0,
          totalValueWD: data.totalValueWD || '',

          extraSub1Top: data.subTotalH1 || '',
          extraSub2Top: data.subTotalH2 || '',
          extraSub3Top: data.subTotalH3 || '',

          extraSub1Bottom: data.subTotalA1 || 0,
          extraSub2Bottom: data.subTotalA2 || 0,
          extraSub3Bottom: data.subTotalA3 || 0,
        }));
        setCargoId(Number(data.cargoID ?? data.cargoId ?? 0) || 0);

        const sourceDetails = data.details ?? siblingRows[0]?.details ?? [];

        const mappedRows = (sourceDetails.length ? sourceDetails : siblingRows).map((item, idx) => ({
          pono: item.pono || item.poNo || data.poNo || '',
          customerName: item.customerName || data.customerName || '',
          styleNo: item.styles,
          size: item.sizeRange || item.size, // 'size' in payload is sizeRange
          quantity: item.poqty, // Total PO Qty
          releaseQty: item.quantity, // This seems to be the 'Release Qty' column
          remainQTY: item.quantity, // Editable field 'Release Qty'
          cartons: item.cartons,
          cartonNo: item.cartonNo,
          rate: item.shippedRate,
          deliveryTypeName: item.deliveryTypeName,
          ldpInvoiceNo: item.ldpInvoiceNo,
          itemDescriptionShippingInvoice: item.itemDescription,
          itemDescriptionInvoice: item.itemDescriptionInvoice || item.itemDescription,
          // Other fields
          poid: item.poid,
          customerID: item.customerID,
          supplierID: item.supplierID,
          colorway: item.colorway,
          // Preserve any existing fields if needed or mapped from API
        }));
        setArticleRows(mappedRows);

      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load shipment details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    const primarySubTotalKey = ldpRows[0]?.key;
    const primarySubTotals = subTotalsByLdp[primarySubTotalKey] || {
      top1: '',
      top2: '',
      top3: '',
      bottom1: '0',
      bottom2: '0',
      bottom3: '0',
    };

    const payload = {
      cargoID: Number(cargoId) || 0,
      creationDate: new Date().toISOString(),
      invoiceNo: form.invoice,
      vendorInvoiceNo: form.vendorInvoiceNo,
      invoiceDate: form.date ? `${form.date}T00:00:00.000Z` : new Date().toISOString(),
      invoiceValue: Number(form.invoiceValue) || 0,
      terms: form.terms,
      itemDescription: articleRows[0]?.itemDescriptionShippingInvoice || '',
      mode: form.mode,
      carrierName: form.carrierName,
      voyageFlight: form.voyageFlight,
      billNo: form.blAwbNo,
      shipmentDate: form.shipmentDate ? `${form.shipmentDate}T00:00:00.000Z` : new Date().toISOString(),
      containerNo: form.containerNo,
      remarks: form.remarks,
      isActive: true,
      currency: form.currency,
      userID: 0,
      exchangeRate: Number(form.exchangeRate) || 0,
      exporterInvoiceNo: form.exporterInvoiceNo || '',
      exporterInvoiceDate: form.exporterInvoiceDate ? `${form.exporterInvoiceDate}T00:00:00.000Z` : new Date().toISOString(),
      countryOfOrigin: form.country,
      destination: form.destination,
      portOfLoading: form.portOfLoading,
      portOfDischarge: form.portOfDischarge,
      shippedExchangeRate: Number(form.shippedExchangeRate) || 0,
      bankID: Number(form.bank) || 0,
      discount: Number(form.discount) || 0,
      heading1: '',
      heading2: '',
      heading3: '',
      heading1Value: Number(form.heading1Value) || 0,
      heading2Value: Number(form.heading2Value) || 0,
      heading3Value: Number(form.heading3Value) || 0,
      amsicNo: form.icNo,
      etdExpectedDate: form.expectedEtd ? `${form.expectedEtd}T00:00:00.000Z` : '',
      etdActualDate: form.actualEtd ? `${form.actualEtd}T00:00:00.000Z` : '',
      etaExpectedDate: form.expectedEta ? `${form.expectedEta}T00:00:00.000Z` : '',
      etaActualDate: form.actualEta ? `${form.actualEta}T00:00:00.000Z` : '',
      entryFiledDate: form.entryFiledDate ? `${form.entryFiledDate}T00:00:00.000Z` : '',
      goodsClearedDate: form.goodsClearedDate ? `${form.goodsClearedDate}T00:00:00.000Z` : '',
      docstoBrokerDate: form.docsToBrokerDate ? `${form.docsToBrokerDate}T00:00:00.000Z` : '',
      docstoBankDate: form.docsToBankDate ? `${form.docsToBankDate}T00:00:00.000Z` : '',
      goodsDeliveredDate: form.goodsDeliveredDate ? `${form.goodsDeliveredDate}T00:00:00.000Z` : '',
      updateSheetremarks: form.updateSheetRemarks,
      shipmentStatus: true,
      revisedETA: form.revisedEtw ? `${form.revisedEtw}T00:00:00.000Z` : new Date().toISOString(),
      etwDate: form.actualEtw ? `${form.actualEtw}T00:00:00.000Z` : '',
      reverseETWDate: form.revisedEtw ? `${form.revisedEtw}T00:00:00.000Z` : '',
      revisedETD: form.revisedEtd ? `${form.revisedEtd}T00:00:00.000Z` : '',
      vpoActualDate: form.vpoActualDate ? `${form.vpoActualDate}T00:00:00.000Z` : '',
      containerReleaseDate: form.containerReleaseDate ? `${form.containerReleaseDate}T00:00:00.000Z` : '',
      containerDeliveryDateASTWH: form.containerDeliveryDate ? `${form.containerDeliveryDate}T00:00:00.000Z` : '',
      wareHouseName: form.warehouseName,
      truckerName: form.truckerName,
      actualETW: form.actualEtw ? `${form.actualEtw}T00:00:00.000Z` : '',
      discountValue: Number(form.discount) || 0,
      totalValueWD: Number(form.totalValueWD) || 0,
      discountTitle: form.extraField5,
      styles: articleRows.map((row) => row.styleNo).join(', '),
      cargoConsigneeName: form.consigneeName,
      cargoConsigneeAddress1: form.addressLine,
      cargoConsigneeCity: form.city,
      cargoConsigneeCountry: form.country,
      subTotalH1: primarySubTotals.top1 || '',
      subTotalH2: primarySubTotals.top2 || '',
      subTotalH3: primarySubTotals.top3 || '',
      subTotalA1: Number(primarySubTotals.bottom1) || 0,
      subTotalA2: Number(primarySubTotals.bottom2) || 0,
      subTotalA3: Number(primarySubTotals.bottom3) || 0,
      cargoDetailID: selectedArticle?.cargoDetailID || 0,
      details: articleRows.map((row) => ({
        poid: row.poid || 0,
        quantity: Number(row.remainQTY ?? row.releaseQty) || 0,
        styles: row.styleNo,
        cartons: Number(row.cartons) || 0,
        customerID: row.customerID || 0,
        supplierID: row.supplierID || 0,
        popoid: row.popoid || 0,
        shippedRate: Number(row.rate) || 0,
        cartonNo: row.cartonNo || '',
        ldpInvoiceNo: row.ldpInvoiceNo || '',
        itemDescriptionInvoice: row.itemDescriptionShippingInvoice || '',
        colorway: row.colorway || '',
        sizeRange: row.size || row.sizeRange || '',
      })),
    };

    try {
      const response = await fetch(`${SHIPMENT_UPDATE_API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to update shipment');
      }
      setSuccessMessage('Shipment updated successfully.');
      setError('');
    } catch (err) {
      setSuccessMessage('');
      setError(err.message || 'Unable to update shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(defaultFormValues);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <CustomBreadcrumbs
        heading="SHIPMENT EDIT VIEW"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Shipment Release', href: '/dashboard/supply-chain/list' },
          { name: 'Shipment Edit View' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Shipment Details {id ? `(ID: ${id})` : ''}
          </Typography>

          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{
              borderColor: '#171616',
              color: '#171616',
              '&:hover': { borderColor: '#000000', backgroundColor: '#F3F4F6' },
            }}
          >
            Back
          </Button>
        </Box>

        {loading && (
          <Box
            sx={{
              minHeight: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Loading shipment details…
            </Typography>
          </Box>
        )}

        {!loading && (
          <>
            {error && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            {!error && successMessage && (
              <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                {successMessage}
              </Typography>
            )}

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
                  size="small"
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Consignee Name"
                  value={form.consigneeName}
                  onChange={handleChange('consigneeName')}
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
                  fullWidth
                  label="Address Line"
                  value={form.addressLine}
                  onChange={handleChange('addressLine')}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={form.city}
                  onChange={handleChange('city')}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={form.country}
                  onChange={handleChange('country')}
                  size="small"
                />
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Remarks"
                  value={form.remarks}
                  onChange={handleChange('remarks')}
                  size="small"
                />
              </Grid>

              {/* Row: Bank / Discount / Expected ETD */}
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Bank"
                  value={form.bank}
                  onChange={handleChange('bank')}
                  size="small"
                >
                  <MenuItem value="6">HAB BANK</MenuItem>
                  <MenuItem value="7">HAB BANK 2</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Discount:"
                  value={form.discount}
                  onChange={handleChange('discount')}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
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

              {/* Row: Actual/Revised ETA & Expected ETW */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Actual ETA"
                  value={form.actualEta}
                  onChange={handleChange('actualEta')}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Revised ETA"
                  value={form.revisedEta}
                  onChange={handleChange('revisedEta')}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Expected ETW"
                  value={form.expectedEtw}
                  onChange={handleChange('expectedEtw')}
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
                  value={form.docsToBrokerDate}
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
                  value={form.docsToBankDate}
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
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        minWidth: 220,
                        bgcolor: '#171616',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#000000' },
                      }}
                    >
                      Get Data
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} sx={{ mt: 3 }}>
                {uniqueLdpInvoiceNumbers.length > 0 && (
                  <Grid container sx={{ mb: 1 }}>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        LDP Invoice Nos: {uniqueLdpInvoiceNumbers.join(', ')}
                      </Typography>
                    </Grid>
                  </Grid>
                )}
                {/* Main Article Grid */}
                <TableContainer sx={{ border: '1px solid #eee' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#eeeeee' }}>
                        {[
                          { label: 'PO. No.', width: 120 },
                          { label: 'LDP Invoice No.', width: 120 },
                          { label: 'Customer', width: 150 },
                          { label: 'Item Des.', width: 250 }, // Increased width
                          { label: 'Style No', width: 100 },
                          { label: 'Size', width: 100 },
                          { label: 'PO Quantity', width: 100 },
                          { label: 'Shipped Quantity', width: 120 },
                          { label: 'Release Quantity', width: 120 },
                          { label: 'Cartons', width: 80 },
                          { label: 'Carton#', width: 100 },
                          { label: 'Shipped Rate', width: 100 },
                          { label: 'Delivery Mode', width: 120 },
                        ].map((col) => (
                          <TableCell
                            key={col.label}
                            sx={{
                              color: '#000000',
                              fontWeight: 'bold',
                              borderRight: '1px solid rgba(0,0,0,0.12)',
                              whiteSpace: 'nowrap',
                              minWidth: col.width,
                            }}
                          >
                            {col.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {articleRows.map((row, index) => (
                        <TableRow
                          key={index}
                          hover
                          onClick={() => setSelectedArticle(row)}
                          selected={selectedArticle === row}
                        >
                          <TableCell>{row.pono}</TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <TextField
                              size="small"
                              fullWidth
                              value={row.ldpInvoiceNo || ''}
                              onChange={(e) => handleGridChange(index, 'ldpInvoiceNo', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>{row.customerName}</TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <TextField
                              size="small"
                              fullWidth
                              multiline
                              value={row.itemDescriptionInvoice || row.itemDescriptionShippingInvoice || ''}
                              onChange={(e) =>
                                handleGridChange(index, 'itemDescriptionInvoice', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>{row.styleNo}</TableCell>
                          <TableCell>{row.size}</TableCell>
                          <TableCell>{row.quantity ?? '-'}</TableCell>
                          <TableCell>{row.releaseQty ?? '-'}</TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <TextField
                              size="small"
                              fullWidth
                              type="number"
                              value={row.remainQTY ?? ''}
                              onChange={(e) => handleGridChange(index, 'remainQTY', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>{row.cartons ?? '-'}</TableCell>
                          <TableCell>{row.cartonNo ?? ''}</TableCell>
                          <TableCell sx={{ p: 0.5 }}>
                            <TextField
                              size="small"
                              fullWidth
                              type="number"
                              value={row.rate ?? ''}
                              onChange={(e) => handleGridChange(index, 'rate', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>{row.deliveryTypeName}</TableCell>
                        </TableRow>
                      ))}
                      {articleRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={13} align="center">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Extra fields block (3 rows: 3 fields, then 2 fields, then 1 right-aligned field) */}
              <Grid item xs={12} sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                  {/* Row 1: 3 fields (ReadOnly Totals) */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Release Qty Sum"
                      value={form.heading1Value}
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
                      value={form.heading2Value}
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
                      value={typeof form.heading3Value === 'number' ? form.heading3Value.toFixed(2) : form.heading3Value}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      sx={{ bgcolor: 'background.neutral' }}
                    />
                  </Grid>

                  {/* Row 2: Discount + extra field (Right Aligned) */}
                  <Grid item xs={12} sm={4} />
                  <Grid
                    item
                    xs={12}
                    sm={4}
                    sx={{ display: 'flex', justifyContent: 'flex-end' }}
                  >
                    <TextField
                      label="Discount"
                      size="small"
                      value={form.extraField4}
                      onChange={handleChange('extraField4')}
                      fullWidth
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={4}
                    sx={{ display: 'flex', justifyContent: 'flex-end' }}
                  >
                    <TextField
                      size="small"
                      value={form.extraField5}
                      onChange={handleChange('extraField5')}
                      fullWidth
                    />
                  </Grid>

                  {/* Row 3: single right-aligned field (Total Value) */}
                  <Grid item xs={12} sm={8} />
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      value={
                        Number.isFinite(Number(form.totalValueWD))
                          ? Number(form.totalValueWD).toFixed(2)
                          : form.totalValueWD
                      }
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      sx={{ bgcolor: 'background.neutral' }}
                    />
                  </Grid>
                </Grid>

                {/* Subtotal Grid (LDP Invoice No. + Sub Totals) */}
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <TableContainer sx={{ border: '1px solid #eee' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#eeeeee' }}>
                          {['LDP Invoice No.', 'Sub Total', 'Sub Total', 'Sub Total'].map((head) => (
                            <TableCell
                              key={head}
                              sx={{
                                color: '#000000',
                                fontWeight: 'bold',
                                borderRight: '1px solid rgba(0,0,0,0.12)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {head}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ldpRows.flatMap((rowInfo) => {
                          const rowKey = rowInfo.key;
                          const subtotal = subTotalsByLdp[rowKey] || {
                            top1: '',
                            top2: '',
                            top3: '',
                            bottom1: '0',
                            bottom2: '0',
                            bottom3: '0',
                          };
                          const label = rowInfo.label || '-';
                          return [
                            <TableRow key={`${rowKey}-top`}>
                              <TableCell rowSpan={2}>{label}</TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={subtotal.top1}
                                  onChange={handleSubTotalChange(rowKey, 'top1')}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={subtotal.top2}
                                  onChange={handleSubTotalChange(rowKey, 'top2')}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={subtotal.top3}
                                  onChange={handleSubTotalChange(rowKey, 'top3')}
                                />
                              </TableCell>
                            </TableRow>,
                            <TableRow key={`${rowKey}-bottom`}>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={subtotal.bottom1}
                                  onChange={handleSubTotalChange(rowKey, 'bottom1')}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={subtotal.bottom2}
                                  onChange={handleSubTotalChange(rowKey, 'bottom2')}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={subtotal.bottom3}
                                  onChange={handleSubTotalChange(rowKey, 'bottom3')}
                                />
                              </TableCell>
                            </TableRow>,
                          ];
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Grid>

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  bgcolor: '#171616',
                  color: '#ffffff',
                  '&:hover': { bgcolor: '#000000' },
                }}
              >
                Update
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleCancel}
                sx={{
                  borderColor: '#171616',
                  color: '#171616',
                  '&:hover': { borderColor: '#000000', backgroundColor: '#F3F4F6' },
                }}
              >
                Cancel
              </Button>
            </Box>

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
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: '#171616',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#000000' },
                      }}
                    >
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
                  sx={{
                    borderColor: '#171616',
                    color: '#171616',
                    '&:hover': { borderColor: '#000000', backgroundColor: '#F3F4F6' },
                  }}
                >
                  Select &amp; Close
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Card>
    </Container>
  );
}



