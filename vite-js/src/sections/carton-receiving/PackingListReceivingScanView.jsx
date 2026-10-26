import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  TextField,
  Button,
  Typography,
  Container,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import { paths } from 'src/routes/paths';
import axiosInstance from 'src/utils/axios';
import { fDate } from 'src/utils/format-time';
import { useDragScroll } from 'src/hooks/use-drag-scroll';

// ----------------------------------------------------------------------

const formatDisplayDate = (val) => {
  if (!val) return '-';
  if (typeof val === 'string' && val.includes('T')) {
    try {
      return fDate(val, 'dd-MMM-yyyy');
    } catch (e) {
      return val.split('T')[0];
    }
  }
  return String(val);
};

const formatNumber = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(String(val).replace(/,/g, ''));
  return Number.isNaN(num) ? String(val) : num.toLocaleString();
};

const formatCount = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(String(val).replace(/,/g, ''));
  return Number.isNaN(num) ? val : num;
};

// Normalize raw API item into the standard 16 response fields required for grid binding
const normalizeRow = (item, idx) => {
  if (!item || typeof item !== 'object') return null;

  const resolvedPoid = String(
    item.poid ??
    item.POID ??
    item.poId ??
    item.poID ??
    item.lPOID ??
    item.lpoid ??
    item._raw?.poid ??
    item._raw?.POID ??
    ''
  ).trim();

  const resolvedPoDetailId = String(
    item.podetailid ??
    item.poDetailID ??
    item.PODetailID ??
    item.poDetailId ??
    item.PODetailId ??
    item._raw?.PODetailID ??
    item._raw?.poDetailID ??
    item._raw?.podetailid ??
    0
  ).trim();

  const rawPoNo = String(
    item.poNo ??
    item.PoNo ??
    item.PONO ??
    item.pono ??
    item.poNumber ??
    item.PONumber ??
    item._raw?.poNo ??
    item._raw?.PoNo ??
    item._raw?.PONO ??
    ''
  ).trim();

  const styleNo = String(item.styleNo ?? item.StyleNo ?? item.style ?? item.Style ?? '').trim();
  const color = String(item.color ?? item.Color ?? item.colorway ?? item.Colorway ?? '').trim();
  const size = String(item.size ?? item.Size ?? '').trim();

  const rowKey =
    Number(resolvedPoDetailId) > 0
      ? `pod-${resolvedPoDetailId}`
      : `po-${resolvedPoid || rawPoNo}-${styleNo}-${color}-${size}`.replace(/\s+/g, '_');

  return {
    id: rowKey || `rcv-scan-${Date.now()}-${idx}`,
    poid: resolvedPoid,
    poID: resolvedPoid,
    poDetailId: resolvedPoDetailId,
    PODetailID: resolvedPoDetailId,
    poNo: rawPoNo,
    customer: item.customer ?? item.Customer ?? item.customerName ?? item.CustomerName ?? '',
    supplier:
      item.supplier ??
      item.Supplier ??
      item.venderName ??
      item.VenderName ??
      item.vendorName ??
      item.VendorName ??
      '',
    shipmentDate: item.shipmentDate ?? item.ShipmentDate ?? item.tolerance ?? item.Tolerance ?? '',
    inspectionDate: item.inspectionDate ?? item.InspectionDate ?? '',
    styleNo,
    color,
    size,
    poQuantity:
      item.poQuantity ??
      item.POQuantity ??
      item.PoQuantity ??
      item.quantity ??
      item.Quantity ??
      item.poQty ??
      item.PoQty ??
      0,
    cartonPerPcs:
      item.cartonPerPcs ??
      item.CartonPerPcs ??
      item.noOfCarton ??
      item.NoOfCarton ??
      0,
    inspectionQuantity:
      item.inspectionQuantity ??
      item.InspectionQuantity ??
      item.inspectedQty ??
      item.InspectedQty ??
      0,
    proposedNoOfCarton:
      item.proposedNoOfCarton ??
      item.ProposedNoOfCarton ??
      item.inspectedCarton ??
      item.InspectedCarton ??
      0,
    totalPrevCartonScanned:
      item.totalPrevCartonScanned ??
      item.TotalPrevCartonScanned ??
      item.lastCount ??
      item.LastCount ??
      0,
    totalCartonQRCounted:
      item.totalCartonQRCounted ??
      item.TotalCartonQRCounted ??
      item.todayCount ??
      item.TodayCount ??
      0,
    totalScanned:
      item.totalScanned ??
      item.TotalScanned ??
      item.cartonCount ??
      item.CartonCount ??
      0,
    cartonBalance: item.cartonBalance ?? item.CartonBalance ?? 0,
    _raw: item,
  };
};

export default function PackingListReceivingScanView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const receivingId =
    searchParams.get('lReceivingID') ||
    searchParams.get('receivingID') ||
    searchParams.get('receivingId') ||
    searchParams.get('id') ||
    location.state?.editId ||
    location.state?.receivingID ||
    location.state?.receivingId ||
    location.state?.id ||
    '0';

  const rawContainerLoadingId =
    searchParams.get('lContainerLoadingID') ||
    searchParams.get('containerLoadingID') ||
    searchParams.get('containerLoadingId') ||
    location.state?.containerLoadingID ||
    location.state?.containerLoadingId ||
    location.state?.rowData?.containerLoadingID ||
    location.state?.rowData?.ContainerLoadingID ||
    location.state?.rowData?._raw?.containerLoadingID ||
    location.state?.rowData?._raw?.ContainerLoadingID ||
    '';

  const containerLoadingId =
    rawContainerLoadingId && !rawContainerLoadingId.startsWith('cr-')
      ? rawContainerLoadingId
      : (receivingId && !receivingId.startsWith('cr-') ? receivingId : '');

  const containerNo =
    searchParams.get('containerNo') ||
    location.state?.containerNo ||
    location.state?.rowData?.containerNo ||
    location.state?.rowData?.ContainerNo ||
    location.state?.rowData?._raw?.containerNo ||
    location.state?.rowData?._raw?.ContainerNo ||
    '';

  const [barcode, setBarcode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [rows, setRows] = useState([]);

  const tableContainerRef = useDragScroll();

  const isScanningRef = useRef(false);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    isScanningRef.current = false;
    setBarcode('');
    setErrorMsg('');
    setRows([]);
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  }, [receivingId]);

  const handleBack = () => {
    navigate(paths.dashboard.cartonReceiving);
  };

  // 2. Finish Carton Receiving API (/api/Container/FinishCartonReceiving)
  const handleFinish = async () => {
    if (isFinishing) return;

    setIsFinishing(true);

    try {
      const parsedReceivingId = Number(receivingId);
      const resolvedReceivingId =
        !Number.isNaN(parsedReceivingId) && parsedReceivingId > 0 ? parsedReceivingId : (receivingId || 0);

      const parsedLoadingId = Number(containerLoadingId);
      const resolvedContainerLoadingId =
        !Number.isNaN(parsedLoadingId) && parsedLoadingId > 0 ? parsedLoadingId : resolvedReceivingId;

      const payload = {
        containerLoadingID: resolvedContainerLoadingId,
        receivingID: resolvedReceivingId,
        containerReceivingID: resolvedReceivingId,
      };

      const response = await axiosInstance.post('/api/Container/FinishCartonReceiving', payload);

      const isSuccess =
        response?.data?.success === true ||
        response?.data?.isSuccess === true ||
        (response?.status >= 200 &&
          response?.status < 300 &&
          response?.data?.success !== false &&
          response?.data?.isSuccess !== false);

      if (isSuccess) {
        const successMsg =
          response?.data?.message ||
          response?.data?.Message ||
          'Carton Receiving Finished Successfully!';
        enqueueSnackbar(successMsg, { variant: 'success' });
        navigate(paths.dashboard.cartonReceiving);
      } else {
        const errorText =
          response?.data?.message ||
          response?.data?.Message ||
          'Failed to finish carton receiving.';
        enqueueSnackbar(errorText, { variant: 'error' });
      }
    } catch (err) {
      console.error('FinishCartonReceiving API error:', err);
      const errorText =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.response?.data?.error ||
        err?.message ||
        (typeof err === 'string' ? err : 'Error finishing carton receiving.');
      enqueueSnackbar(errorText, { variant: 'error' });
    } finally {
      setIsFinishing(false);
    }
  };

  // 1. Scan Receiving Carton API (/api/Container/ScanReceivingCarton)
  const handleBarcodeSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) {
      setErrorMsg('Barcode Not Empty');
      return;
    }

    // Prevent duplicate requests on rapid Enter presses
    if (isScanningRef.current) {
      return;
    }

    isScanningRef.current = true;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const resolvedContainerNo =
        containerNo ||
        containerLoadingId ||
        receivingId ||
        '';

      const payload = {
        containerNo: String(resolvedContainerNo),
        barcode: String(cleanBarcode),
      };

      const response = await axiosInstance.post('/api/Container/ScanReceivingCarton', payload);

      if (response?.data?.isSuccess === false || response?.data?.success === false) {
        const message =
          response?.data?.message ||
          response?.data?.Message ||
          'Carton scan failed. Please check the barcode.';
        setErrorMsg(message);
        enqueueSnackbar(message, { variant: 'error' });
        return;
      }

      // Extract raw data from response
      const rawData =
        response?.data?.data ??
        response?.data?.Data ??
        response?.data?.result ??
        response?.data?.Result ??
        response?.data;

      let items = [];
      if (Array.isArray(rawData)) {
        items = rawData;
      } else if (rawData && typeof rawData === 'object') {
        items = [rawData];
      }

      const normalizedNewRows = items
        .map((item, idx) => normalizeRow(item, idx))
        .filter(Boolean);

      setRows(normalizedNewRows);

      const successMessage =
        response?.data?.message ||
        response?.data?.Message ||
        `Carton scanned successfully: ${cleanBarcode}`;
      enqueueSnackbar(successMessage, { variant: 'success' });

      setBarcode('');
    } catch (err) {
      console.error('ScanReceivingCarton API error:', err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.response?.data?.error ||
        err?.message ||
        (typeof err === 'string' ? err : 'Error scanning receiving carton barcode.');
      setErrorMsg(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      isScanningRef.current = false;
      setIsSubmitting(false);
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="PACKING LIST RECEIVING SCAN"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Carton Receiving', href: paths.dashboard.cartonReceiving },
          {
            name: `Receiving Scan (${
              containerNo
                ? `Container: ${containerNo}`
                : containerLoadingId
                ? `ID: ${containerLoadingId}`
                : receivingId && receivingId !== '0'
                ? `ID: ${receivingId}`
                : 'Carton Scan'
            })`,
          },
        ]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Back View Page
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={isFinishing}
              startIcon={
                isFinishing ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <CheckCircleOutlineIcon />
                )
              }
              onClick={handleFinish}
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 200 }}
            >
              {isFinishing ? 'Finishing...' : 'Finish Receiving Scan'}
            </Button>
          </Stack>
        }
        sx={{ mb: 3 }}
      />

      {/* Barcode Input Card */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <form onSubmit={handleBarcodeSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8} md={6}>
              <TextField
                fullWidth
                autoFocus
                inputRef={barcodeInputRef}
                size="medium"
                label="Scan Barcode / QR Code"
                placeholder="Scan or enter carton barcode..."
                value={barcode}
                disabled={isSubmitting}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeSubmit(e);
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={isSubmitting || !barcode.trim()}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <QrCodeScannerIcon />
                  )
                }
                sx={{ textTransform: 'none', px: 3, minWidth: 140 }}
              >
                {isSubmitting ? 'Scanning...' : 'Enter Scan'}
              </Button>
            </Grid>
          </Grid>
        </form>

        {errorMsg && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMsg}
          </Alert>
        )}
      </Card>

      {/* Scanned Table */}
      <Card variant="outlined">
        <TableContainer ref={tableContainerRef} component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Supplier</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>PO No.</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Shipment Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Inspection Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Style #</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Color</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Size</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>PO Qty</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'info.lighter' }}>
                  No. of Carton
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Inspection Qty</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'info.lighter' }}>
                  Proposed Carton
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'warning.lighter' }}>
                  Prev Scanned
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'success.lighter' }}>
                  Today Scanned
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'primary.lighter' }}>
                  Total Scanned
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'error.lighter' }}>
                  Balance
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      No cartons scanned yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
                      Scan or enter a carton barcode above and press Enter to populate the grid.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.id || index} hover>
                    <TableCell align="center">{row.customer || '-'}</TableCell>
                    <TableCell align="center">{row.supplier || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{row.poNo || '-'}</TableCell>
                    <TableCell align="center">{formatDisplayDate(row.shipmentDate)}</TableCell>
                    <TableCell align="center">{formatDisplayDate(row.inspectionDate)}</TableCell>
                    <TableCell align="center">{row.styleNo || '-'}</TableCell>
                    <TableCell align="center">{row.color || '-'}</TableCell>
                    <TableCell align="center">{row.size || '-'}</TableCell>
                    <TableCell align="center">{formatNumber(row.poQuantity)}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'info.lighter' }}>
                      {formatCount(row.cartonPerPcs)}
                    </TableCell>
                    <TableCell align="center">{formatNumber(row.inspectionQuantity)}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'info.lighter' }}>
                      {formatCount(row.proposedNoOfCarton)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'warning.lighter' }}>
                      {formatCount(row.totalPrevCartonScanned)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'success.lighter' }}>
                      {formatCount(row.totalCartonQRCounted)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'primary.lighter' }}>
                      {formatCount(row.totalScanned)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'error.lighter' }}>
                      {formatCount(row.cartonBalance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
}
