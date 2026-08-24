import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { paths } from 'src/routes/paths';
import axiosInstance from 'src/utils/axios';

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const topFieldSx = {
  '& .MuiInputBase-root': {
    borderRadius: 0,
    backgroundColor: '#fff',
    fontSize: '0.85rem',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#e0e0e0',
  },
};

const labelSx = {
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#666',
  mb: 0.5,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const cellSx = {
  minWidth: 54,
  p: 0.3,
  '& .MuiInputBase-root': {
    borderRadius: 0,
    backgroundColor: '#fff',
    fontSize: '0.78rem',
  },
  '& .MuiInputBase-input': {
    p: '4px 4px',
    fontSize: '0.78rem',
    textAlign: 'center',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#d6d6d6',
  },
};

const readOnlyCellSx = {
  ...cellSx,
  '& .MuiInputBase-root': {
    borderRadius: 0,
    backgroundColor: '#fafafa',
    fontSize: '0.78rem',
  },
  '& .MuiInputBase-input': {
    p: '4px 4px',
    fontSize: '0.78rem',
    textAlign: 'center',
    color: '#333',
  },
};

const toNum = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDateDisplay = (raw) => {
  if (!raw) return '';
  const str = String(raw).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  return str;
};

const TABLE_COLUMNS = [
  { label: 'DELIVERY DATE', width: 95 },
  { label: 'SIZES', width: 75 },
  { label: 'TOTAL ORDER QTY', width: 75 },
  { label: '# OF PCS/CTN', width: 65 },
  { label: '# OF CTNS', width: 60 },
  { label: 'L', width: 45 },
  { label: 'W', width: 45 },
  { label: 'H', width: 45 },
  { label: 'CBM PER CTN', width: 65 },
  { label: 'TOTAL CBM', width: 65 },
  { label: 'FOB', width: 55 },
  { label: 'AMS COMM %', width: 60 },
  { label: 'AMS COMM AMT', width: 65 },
  { label: 'DUTY %', width: 55 },
  { label: 'DUTY AMT', width: 60 },
  { label: 'FREIGHT', width: 65 },
  { label: 'TRUCKING', width: 65 },
  { label: 'CLEARING', width: 65 },
  { label: 'PALLETIZING COST(ctn*12/30)', width: 90 },
  { label: 'FRT/PC', width: 60 },
  { label: 'T.COST/PC', width: 65 },
  { label: 'LDP', width: 55 },
  { label: 'GP/PC', width: 60 },
  { label: 'GP %', width: 55 },
];

const CostingView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inquiryMstID = searchParams.get('id') || searchParams.get('InquiryMstID') || '';
  const costingStatusParam = searchParams.get('costingstatus') === 'true';

  const [customerOptions, setCustomerOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Top header fields
  const [customerValue, setCustomerValue] = useState('');
  const [supplierValue, setSupplierValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [costingStatusValue, setCostingStatusValue] = useState('');
  const [currentFreight, setCurrentFreight] = useState('');
  const [totalCbm40hc, setTotalCbm40hc] = useState('');
  const [gri, setGri] = useState('');
  const [gri2, setGri2] = useState('');
  const [inwardTrucking, setInwardTrucking] = useState('');

  // Multi-row detail rows for the table
  const [detailRows, setDetailRows] = useState([]);

  const customerLabel = (option) => option?.customerName ?? option?.CustomerName ?? option?.name ?? String(option ?? '');
  const customerKey = (option) => option?.customerID ?? option?.customerId ?? option?.CustomerID ?? String(option ?? '');
  const supplierLabel = (option) => option?.venderName ?? option?.VenderName ?? option?.vendorName ?? option?.SupplierName ?? String(option ?? '');
  const supplierKey = (option) => option?.venderLibraryID ?? option?.venderLibraryId ?? option?.VenderLibraryID ?? option?.SupplierID ?? String(option ?? '');

  const handleCancel = () => {
    navigate(paths.dashboard.supplyChain.merchantInquiry);
  };

  const handleDetailRowChange = (index, field) => (event) => {
    const value = event.target.value;
    setDetailRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Fetch CostingData
  useEffect(() => {
    if (!API_BASE_URL || !inquiryMstID) return undefined;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const url = `${API_BASE_URL}/api/MerchantInquiry/CostingData/${encodeURIComponent(
          inquiryMstID
        )}?costingstatus=${String(costingStatusParam)}`;
        console.log('[CostingView] request URL:', url);

        const response = await axiosInstance.get(url, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        });

        if (controller.signal.aborted) return;

        const data = response?.data;
        console.log('[CostingView] API response:', data);

        const masterList = Array.isArray(data?.masterData) ? data.masterData : data?.masterData ? [data.masterData] : [];
        const master = masterList[0] || {};
        const details = Array.isArray(data?.detailData) && data.detailData.length > 0
          ? data.detailData
          : (masterList.length > 0 ? masterList : [master]);

        setCustomerValue(master?.CustomerName || '');
        setSupplierValue(master?.SupplierName || '');
        setDescriptionValue(master?.ItemDesc || master?.Description || master?.Remarks || '');
        setCostingStatusValue(master?.CostingStatus || '');
        setCurrentFreight(master?.CurrentFreight != null && master?.CurrentFreight !== 0 ? String(master.CurrentFreight) : '');
        setTotalCbm40hc(master?.TotalCBM40CH != null && master?.TotalCBM40CH !== 0 ? String(master.TotalCBM40CH) : '');
        setGri(master?.GRI != null && master?.GRI !== 0 ? String(master.GRI) : '');
        setGri2(master?.CurrentFr8GRI != null && master?.CurrentFr8GRI !== 0 ? String(master.CurrentFr8GRI) : '');
        setInwardTrucking(master?.InwardTrucking != null && master?.InwardTrucking !== 0 ? String(master.InwardTrucking) : '');

        // Map detailData items to table rows
        const mappedRows = details.map((d, idx) => {
          const rawDate = d?.DeliveryDatee || d?.DeliveryDate || d?.datee || d?.DueDate || master?.DeliveryDate || '';
          const deliveryDate = formatDateDisplay(rawDate);
          const orderQty = d?.OrderQty ?? d?.orderQty ?? master?.OrderQty ?? master?.orderQty ?? d?.Qty ?? d?.qty ?? '';
          const sizeVal = d?.Size ?? d?.size ?? master?.Size ?? master?.size ?? '';
          const price = d?.Price ?? d?.price ?? master?.Price ?? master?.price ?? '';
          const ldbPrice = d?.LDBPrice ?? d?.ldbPrice ?? master?.LDBPrice ?? master?.ldbPrice ?? '';

          return {
            id: d?.InquiryDtlID ?? d?.CostingDtlID ?? idx,
            inquiryDtlID: d?.InquiryDtlID ?? 0,
            deliveryDate,
            sizes: sizeVal,
            totalOrderQty: orderQty !== '' && orderQty != null ? String(orderQty) : '',
            pcsPerCtn: d?.PcsPerCtn ?? d?.pcsPerCtn ?? '',
            l: d?.L ?? d?.l ?? '',
            w: d?.W ?? d?.w ?? '',
            h: d?.H ?? d?.h ?? '',
            fob: price !== '' && price != null ? String(price) : '',
            amsCommPct: d?.AmsCommPct ?? d?.amsCommPct ?? '',
            dutyPct: d?.DutyPct ?? d?.dutyPct ?? '',
            clearingValue: d?.ClearingValue ?? d?.clearingValue ?? '',
            ldp: ldbPrice !== '' && ldbPrice != null ? String(ldbPrice) : '',
          };
        });

        setDetailRows(mappedRows);

        setCustomerOptions(
          Array.isArray(data?.customerOptions)
            ? data.customerOptions
            : Array.isArray(data?.customers)
            ? data.customers
            : master?.CustomerName
            ? [{ customerName: master.CustomerName, customerID: master.CustomerID || 1 }]
            : []
        );
        setSupplierOptions(
          Array.isArray(data?.supplierOptions)
            ? data.supplierOptions
            : Array.isArray(data?.suppliers)
            ? data.suppliers
            : master?.SupplierName
            ? [{ venderName: master.SupplierName, venderLibraryID: master.SupplierID || 1 }]
            : []
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('[CostingView] CostingData load failed', error);
        setLoadError(error?.message || 'Failed to load costing data');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [inquiryMstID, costingStatusParam]);

  // Calculate row values
  const calculatedRows = useMemo(() => {
    const cFreight = toNum(currentFreight);
    const tCbm40hc = toNum(totalCbm40hc);
    const inTrucking = toNum(inwardTrucking);

    return detailRows.map((r) => {
      const totalOrderQty = toNum(r.totalOrderQty);
      const pcsPerCtn = toNum(r.pcsPerCtn);
      const l = toNum(r.l);
      const w = toNum(r.w);
      const h = toNum(r.h);
      const fob = toNum(r.fob);
      const amsCommPct = toNum(r.amsCommPct);
      const dutyPct = toNum(r.dutyPct);
      const clearingValue = toNum(r.clearingValue);
      const ldp = toNum(r.ldp);

      const ofCtns = pcsPerCtn > 0 ? Math.ceil(totalOrderQty / pcsPerCtn) : 0;
      const cbmPerCtn = (l > 0 && w > 0 && h > 0) ? (l * w * h) / 61024 : 0;
      const totalCbm = cbmPerCtn * ofCtns;
      const amsCommAmt = (fob / 100) * amsCommPct;
      const dutyAmt = (fob / 100) * dutyPct;
      const freight =
        totalOrderQty > 0 && tCbm40hc > 0 ? ((cFreight / tCbm40hc) * totalCbm) / totalOrderQty : 0;
      const trucking =
        totalOrderQty > 0 && tCbm40hc > 0 ? ((inTrucking / tCbm40hc) * totalCbm) / totalOrderQty : 0;
      const palletizingCost = totalOrderQty > 0 ? ((ofCtns * 12) / 30) / totalOrderQty : 0;
      const clearing = totalOrderQty > 0 ? clearingValue / totalOrderQty : 0;
      const frtPc = freight + trucking + clearing + palletizingCost;
      const tCostPc = frtPc + amsCommAmt + dutyAmt + fob;
      const gpPc = ldp > 0 ? ldp - tCostPc : 0;
      const gpPct = ldp > 0 ? (gpPc / ldp) * 100 : 0;

      return {
        ...r,
        ofCtns: ofCtns > 0 ? String(ofCtns) : '',
        cbmPerCtn: cbmPerCtn > 0 ? cbmPerCtn.toFixed(4) : '',
        totalCbm: totalCbm > 0 ? totalCbm.toFixed(4) : '',
        amsCommAmt: amsCommAmt > 0 ? amsCommAmt.toFixed(4) : '',
        dutyAmt: dutyAmt > 0 ? dutyAmt.toFixed(4) : '',
        freight: freight > 0 ? freight.toFixed(4) : '',
        trucking: trucking > 0 ? trucking.toFixed(4) : '',
        palletizingCost: palletizingCost > 0 ? palletizingCost.toFixed(4) : '',
        clearing: clearing > 0 ? clearing.toFixed(4) : '',
        frtPc: frtPc > 0 ? frtPc.toFixed(4) : '',
        tCostPc: tCostPc > 0 ? tCostPc.toFixed(4) : '',
        gpPc: gpPc !== 0 ? gpPc.toFixed(4) : '',
        gpPct: gpPct !== 0 ? gpPct.toFixed(2) : '',
      };
    });
  }, [detailRows, currentFreight, totalCbm40hc, inwardTrucking]);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 1 }}>
        {loadError ? (
          <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
            {loadError}
          </Typography>
        ) : null}

        {/* Top Header Section: COSTING & STATUS */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* COSTING Left Column */}
          <Grid item xs={12} md={6}>
            <Box sx={{ borderBottom: '2px solid #ddd', pb: 0.5, mb: 2 }}>
              <Typography sx={{ fontWeight: 800, color: '#444', fontSize: '0.95rem', letterSpacing: 0.5 }}>
                COSTING
              </Typography>
            </Box>

            <Stack spacing={2}>
              {/* Customer */}
              <Box>
                <Typography sx={labelSx}>CUSTOMER :</Typography>
                {costingStatusParam ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={customerValue}
                    InputProps={{ readOnly: true }}
                    sx={topFieldSx}
                  />
                ) : (
                  <Autocomplete
                    fullWidth
                    options={customerOptions}
                    value={
                      customerOptions.find(
                        (option) =>
                          String(customerKey(option)) === String(customerValue) ||
                          customerLabel(option) === customerValue
                      ) || (customerValue ? { customerName: customerValue, customerID: 1 } : null)
                    }
                    onChange={(_e, value) =>
                      setCustomerValue(customerLabel(value))
                    }
                    getOptionLabel={(option) => customerLabel(option)}
                    isOptionEqualToValue={(option, value) =>
                      customerLabel(option) === customerLabel(value)
                    }
                    renderInput={(params) => <TextField {...params} fullWidth size="small" sx={topFieldSx} />}
                  />
                )}
              </Box>

              {/* Costing Status (Only in true mode) */}
              {costingStatusParam && (
                <Box>
                  <Typography sx={labelSx}>COSTING STATUS :</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={costingStatusValue}
                    InputProps={{ readOnly: true }}
                    sx={topFieldSx}
                  />
                </Box>
              )}

              {/* Supplier */}
              <Box>
                <Typography sx={labelSx}>SUPPLIER :</Typography>
                {costingStatusParam ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={supplierValue}
                    InputProps={{ readOnly: true }}
                    sx={topFieldSx}
                  />
                ) : (
                  <Autocomplete
                    fullWidth
                    options={supplierOptions}
                    value={
                      supplierOptions.find(
                        (option) =>
                          String(supplierKey(option)) === String(supplierValue) ||
                          supplierLabel(option) === supplierValue
                      ) || (supplierValue ? { venderName: supplierValue, venderLibraryID: 1 } : null)
                    }
                    onChange={(_e, value) =>
                      setSupplierValue(supplierLabel(value))
                    }
                    getOptionLabel={(option) => supplierLabel(option)}
                    isOptionEqualToValue={(option, value) =>
                      supplierLabel(option) === supplierLabel(value)
                    }
                    renderInput={(params) => <TextField {...params} fullWidth size="small" sx={topFieldSx} />}
                  />
                )}
              </Box>

              {/* Description */}
              <Box>
                <Typography sx={labelSx}>DESCRIPTION :</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  InputProps={{ readOnly: costingStatusParam }}
                  sx={topFieldSx}
                />
              </Box>

              {/* Current Freight */}
              <Box>
                <Typography sx={labelSx}>CURRENT FREIGHT :</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={currentFreight}
                  onChange={(e) => setCurrentFreight(e.target.value)}
                  sx={topFieldSx}
                />
              </Box>

              {/* Total CBM 40HC */}
              <Box>
                <Typography sx={labelSx}>TOTAL CBM 40HC :</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={totalCbm40hc}
                  onChange={(e) => setTotalCbm40hc(e.target.value)}
                  sx={topFieldSx}
                />
              </Box>
            </Stack>
          </Grid>

          {/* STATUS Right Column */}
          <Grid item xs={12} md={6}>
            <Box sx={{ borderBottom: '2px solid #ddd', pb: 0.5, mb: 2 }}>
              <Typography sx={{ fontWeight: 800, color: '#444', fontSize: '0.95rem', letterSpacing: 0.5 }}>
                STATUS
              </Typography>
            </Box>

            {/* Spacer to align with Customer, Supplier, Description on the left */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, height: costingStatusParam ? 275 : 210 }} />

            <Stack spacing={2}>
              {/* GRI */}
              <Box>
                <Typography sx={labelSx}>GRI :</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      value={gri}
                      onChange={(e) => setGri(e.target.value)}
                      sx={topFieldSx}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      value={gri2}
                      onChange={(e) => setGri2(e.target.value)}
                      sx={topFieldSx}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Inward Trucking */}
              <Box>
                <Typography sx={labelSx}>INWARD TRUCKING :</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={inwardTrucking}
                  onChange={(e) => setInwardTrucking(e.target.value)}
                  sx={topFieldSx}
                />
              </Box>
            </Stack>
          </Grid>
        </Grid>

        {/* Bottom Costing Calculation Grid with Orange Header (Only for New Costing: costingstatus=false) */}
        {!costingStatusParam && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', border: '1px solid #ddd' }}>
                <Table size="small" sx={{ minWidth: 1780, tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#e26b47' }}>
                      {TABLE_COLUMNS.map((col) => (
                        <TableCell
                          key={col.label}
                          sx={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            textAlign: 'center',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            lineHeight: 1.15,
                            width: col.width,
                            minWidth: col.width,
                            px: 0.4,
                            py: 0.8,
                            borderRight: '1px solid rgba(255,255,255,0.3)',
                            verticalAlign: 'middle',
                            bgcolor: '#e26b47',
                          }}
                        >
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculatedRows.map((r, index) => (
                      <TableRow key={r.id || index} hover>
                        {/* DELIVERY DATE */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.deliveryDate}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* SIZES */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.sizes}
                            onChange={handleDetailRowChange(index, 'sizes')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* TOTAL ORDER QTY */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.totalOrderQty}
                            onChange={handleDetailRowChange(index, 'totalOrderQty')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* # OF PCS/CTN */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.pcsPerCtn}
                            onChange={handleDetailRowChange(index, 'pcsPerCtn')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* # OF CTNS */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.ofCtns}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* L */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.l}
                            onChange={handleDetailRowChange(index, 'l')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* W */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.w}
                            onChange={handleDetailRowChange(index, 'w')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* H */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.h}
                            onChange={handleDetailRowChange(index, 'h')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* CBM PER CTN */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.cbmPerCtn}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* TOTAL CBM */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.totalCbm}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* FOB */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.fob}
                            onChange={handleDetailRowChange(index, 'fob')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* AMS COMM % */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.amsCommPct}
                            onChange={handleDetailRowChange(index, 'amsCommPct')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* AMS COMM AMT */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.amsCommAmt}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* DUTY % */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.dutyPct}
                            onChange={handleDetailRowChange(index, 'dutyPct')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* DUTY AMT */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.dutyAmt}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* FREIGHT */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.freight}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* TRUCKING */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.trucking}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* CLEARING */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.clearingValue}
                            onChange={handleDetailRowChange(index, 'clearingValue')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* PALLETIZING COST(ctn*12/30) */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.palletizingCost}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* FRT/PC */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.frtPc}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* T.COST/PC */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.tCostPc}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* LDP */}
                        <TableCell sx={cellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.ldp}
                            onChange={handleDetailRowChange(index, 'ldp')}
                            sx={cellSx}
                          />
                        </TableCell>

                        {/* GP/PC */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.gpPc}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>

                        {/* GP % */}
                        <TableCell sx={readOnlyCellSx}>
                          <TextField
                            fullWidth
                            size="small"
                            value={r.gpPct}
                            InputProps={{ readOnly: true }}
                            sx={readOnlyCellSx}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            sx={{ minWidth: 150, bgcolor: '#000000', color: '#fff', '&:hover': { bgcolor: '#222' } }}
          >
            {costingStatusParam ? 'Update' : 'Save'}
          </Button>
          <Button
            variant="contained"
            sx={{ minWidth: 150, bgcolor: '#000000', color: '#fff', '&:hover': { bgcolor: '#222' } }}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </Box>
      </Card>
    </Container>
  );
};

export default CostingView;
