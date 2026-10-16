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

// ----------------------------------------------------------------------

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

// Format helper for date fields
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

// Format helper for quantities/numbers
const formatNumber = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(String(val).replace(/,/g, ''));
  return Number.isNaN(num) ? String(val) : num.toLocaleString();
};

// Format helper for integer counts
const formatCount = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(String(val).replace(/,/g, ''));
  return Number.isNaN(num) ? val : num;
};

// Extract actual unique PO ID (numeric or GUID) strictly
const getRowPoid = (row) => {
  if (!row) return '';
  const val =
    row.poid ??
    row.POID ??
    row.poId ??
    row.poID ??
    row.lPOID ??
    row.lpoid ??
    row.purchaseOrderID ??
    row.PurchaseOrderID ??
    row.purchaseOrderId ??
    row.orderID ??
    row.OrderID ??
    row._raw?.poid ??
    row._raw?.POID ??
    row._raw?.poId ??
    row._raw?.poID ??
    row._raw?.lPOID ??
    row._raw?.lpoid ??
    row._raw?.purchaseOrderID ??
    row._raw?.PurchaseOrderID ??
    row._raw?.orderID ??
    row._raw?.OrderID;

  return val != null && String(val).trim() !== '' && String(val).trim() !== '0'
    ? String(val).trim().toLowerCase()
    : '';
};

// Extract PO Number strictly
const getRowPoNo = (row) => {
  if (!row) return '';
  const val =
    row.poNo ??
    row.PoNo ??
    row.PONO ??
    row.pono ??
    row.poNumber ??
    row.PONumber ??
    row._raw?.poNo ??
    row._raw?.PoNo ??
    row._raw?.PONO ??
    row._raw?.pono;

  return val != null && String(val).trim() !== '' ? String(val).trim().toLowerCase() : '';
};

// Map raw API item into the standard 16 response fields required for grid binding
const normalizeRow = (item, idx) => {
  if (!item || typeof item !== 'object') return null;

  const resolvedPoid = getRowPoid(item);
  const rawPoNo =
    item.poNo ??
    item.PoNo ??
    item.PONO ??
    item.pono ??
    item.poNumber ??
    item.PONumber ??
    item._raw?.poNo ??
    item._raw?.PoNo ??
    item._raw?.PONO ??
    '';

  const rowKey = resolvedPoid || rawPoNo.toLowerCase() || `scan-${Date.now()}-${idx}`;

  return {
    id: `po-${rowKey}`,
    poid: resolvedPoid,
    poID: resolvedPoid,
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
    shipmentDate: item.shipmentDate ?? item.ShipmentDate ?? '',
    inspectionDate: item.inspectionDate ?? item.InspectionDate ?? '',
    styleNo: item.styleNo ?? item.StyleNo ?? item.style ?? item.Style ?? '',
    color: item.color ?? item.Color ?? item.colorway ?? item.Colorway ?? '',
    size: item.size ?? item.Size ?? '',
    poQuantity:
      item.poQuantity ??
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

export default function PackingListCartonScanView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const containerLoadingId =
    searchParams.get('lContainerLoadingID') ||
    searchParams.get('containerLoadingID') ||
    searchParams.get('containerLoadingId') ||
    searchParams.get('id') ||
    location.state?.editId ||
    location.state?.containerLoadingID ||
    location.state?.id ||
    '45';

  const [barcode, setBarcode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [rows, setRows] = useState([]);

  const isScanningRef = useRef(false);
  const barcodeInputRef = useRef(null);

  // Reset scan state and refocus when containerLoadingId changes or page mounts/re-opens
  useEffect(() => {
    isScanningRef.current = false;
    setRows([]);
    setBarcode('');
    setErrorMsg('');
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  }, [containerLoadingId]);

  const handleBack = () => {
    navigate(paths.dashboard.containerLoading);
  };

  const handleFinish = async () => {
    if (isFinishing) return;

    setIsFinishing(true);

    try {
      const parsedId = Number(containerLoadingId);
      const resolvedContainerLoadingId =
        !Number.isNaN(parsedId) && parsedId > 0 ? parsedId : (containerLoadingId || 0);

      const payload = {
        containerLoadingID: resolvedContainerLoadingId,
      };

      const endpoint = '/api/Container/FinishCartonScanning';
      const requestUrl = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

      const response = await axiosInstance.post(requestUrl, payload);

      const isSuccess =
        response?.data?.success === true ||
        response?.data?.isSuccess === true ||
        (response?.status >= 200 && response?.status < 300 && response?.data?.success !== false && response?.data?.isSuccess !== false);

      if (isSuccess) {
        const successMsg =
          response?.data?.message ||
          response?.data?.Message ||
          'Carton Scanning Finished Successfully!';
        enqueueSnackbar(successMsg, { variant: 'success' });
        navigate(paths.dashboard.containerLoading);
      } else {
        const errorText =
          response?.data?.message ||
          response?.data?.Message ||
          'Failed to finish carton scanning.';
        enqueueSnackbar(errorText, { variant: 'error' });
      }
    } catch (err) {
      console.error('FinishCartonScanning API error:', err);
      const errorText =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.response?.data?.error ||
        err?.message ||
        (typeof err === 'string' ? err : 'Error finishing carton scanning.');
      enqueueSnackbar(errorText, { variant: 'error' });
    } finally {
      setIsFinishing(false);
    }
  };

  const handleBarcodeSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) {
      setErrorMsg('Barcode Not Empty');
      return;
    }

    // Prevent duplicate submissions on rapid Enter presses
    if (isScanningRef.current) {
      return;
    }

    isScanningRef.current = true;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const parsedId = Number(containerLoadingId);
      const resolvedContainerLoadingId =
        !Number.isNaN(parsedId) && parsedId > 0 ? parsedId : (containerLoadingId || 0);

      const payload = {
        containerLoadingID: resolvedContainerLoadingId,
        barcode: cleanBarcode,
      };

      const endpoint = '/api/Container/ScanCarton';
      const requestUrl = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

      const response = await axiosInstance.post(requestUrl, payload);

      // Check if API returned an explicit error response structure
      if (response?.data?.isSuccess === false || response?.data?.success === false) {
        const message =
          response?.data?.message ||
          response?.data?.Message ||
          'Carton scan failed. Please check the barcode.';
        setErrorMsg(message);
        enqueueSnackbar(message, { variant: 'error' });
        return;
      }

      // Extract raw data from response (handles { data: [...] }, { Data: [...] }, { result: [...] }, or direct array/object)
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

      if (normalizedNewRows.length > 0) {
        // Step 1: Deduplicate incoming items by poid so a single scan response never creates duplicates
        const uniqueIncomingMap = new Map();
        normalizedNewRows.forEach((row) => {
          const key = row.poid || row.poNo || row.id;
          if (!uniqueIncomingMap.has(key)) {
            uniqueIncomingMap.set(key, row);
          } else {
            // If the same scan response returned multiple items for the same PO, preserve the highest count
            const existing = uniqueIncomingMap.get(key);
            uniqueIncomingMap.set(key, {
              ...existing,
              totalCartonQRCounted: Math.max(
                Number(existing.totalCartonQRCounted || 0),
                Number(row.totalCartonQRCounted || 0)
              ),
              totalScanned: Math.max(
                Number(existing.totalScanned || 0),
                Number(row.totalScanned || 0)
              ),
              cartonBalance:
                row.cartonBalance != null ? Number(row.cartonBalance) : existing.cartonBalance,
            });
          }
        });
        const uniqueIncomingRows = Array.from(uniqueIncomingMap.values());

        // Step 2: Update ONLY the matching PO row at targetIndex; leave all other rows untouched; add new row if different PO
        setRows((prevRows) => {
          const nextRows = [...prevRows];

          uniqueIncomingRows.forEach((incoming) => {
            const incomingPoid = incoming.poid;
            const incomingPoNo = getRowPoNo(incoming);

            const targetIndex = nextRows.findIndex((r) => {
              // Priority 1: Match by unique PO ID if available on both
              if (incomingPoid && r.poid) {
                return r.poid === incomingPoid;
              }
              // Priority 2: Match by exact PO Number if available on both
              const existPoNo = getRowPoNo(r);
              if (incomingPoNo && existPoNo) {
                return incomingPoNo === existPoNo;
              }
              return false;
            });

            if (targetIndex !== -1) {
              // Same PO: update ONLY the matching row; leave all other rows untouched
              const existing = nextRows[targetIndex];

              const prevCount = Number(
                incoming.totalPrevCartonScanned ?? existing.totalPrevCartonScanned ?? 0
              );
              const proposed = Number(
                existing.proposedNoOfCarton ?? incoming.proposedNoOfCarton ?? 0
              );

              const existingToday = Number(existing.totalCartonQRCounted || 0);
              const incomingToday = Number(incoming.totalCartonQRCounted || 0);

              const updatedToday =
                incomingToday > existingToday ? incomingToday : existingToday + 1;
              const updatedTotal = Math.max(
                Number(incoming.totalScanned || 0),
                prevCount + updatedToday
              );
              const updatedBalance =
                incomingToday > existingToday && incoming.cartonBalance != null
                  ? Number(incoming.cartonBalance)
                  : Math.max(0, proposed - updatedTotal);

              nextRows[targetIndex] = {
                ...existing,
                totalPrevCartonScanned: prevCount,
                totalCartonQRCounted: updatedToday,
                totalScanned: updatedTotal,
                cartonBalance: updatedBalance,
                _raw: { ...existing._raw, ...incoming._raw },
              };
            } else {
              // Different PO: add new separate row
              nextRows.push(incoming);
            }
          });

          return nextRows;
        });

        const successMessage =
          response?.data?.message ||
          response?.data?.Message ||
          `Carton scanned successfully: ${cleanBarcode}`;
        enqueueSnackbar(successMessage, { variant: 'success' });
      } else {
        const fallbackMsg =
          response?.data?.message ||
          response?.data?.Message ||
          'Scan registered, but no carton details returned.';
        enqueueSnackbar(fallbackMsg, { variant: 'warning' });
      }

      setBarcode('');
    } catch (err) {
      console.error('ScanCarton API error:', err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.response?.data?.error ||
        err?.message ||
        (typeof err === 'string' ? err : 'Error scanning carton barcode.');
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
        heading="PACKING LIST CARTON SCAN"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Container Loading', href: paths.dashboard.containerLoading },
          { name: `Carton Scan (ID: ${containerLoadingId})` },
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
              sx={{ textTransform: 'none', fontWeight: 600, minWidth: 190 }}
            >
              {isFinishing ? 'Finishing...' : 'Finish Carton Scanning'}
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
        <TableContainer component={Paper} elevation={0}>
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
