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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { paths } from 'src/routes/paths';
import axiosInstance from 'src/utils/axios';

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const topFieldSx = {
  '& .MuiInputBase-root': { borderRadius: 0, backgroundColor: '#fff' },
};

const cellSx = {
  minWidth: 64,
  p: 0.5,
  '& .MuiInputBase-root': { borderRadius: 0, backgroundColor: '#fff' },
  '& .MuiInputBase-input': { p: '4px 5px', fontSize: '0.76rem' },
};

const toNum = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safeDateValue = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return raw;
};

const CostingView = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const inquiryMstID = searchParams.get('id') || searchParams.get('InquiryMstID') || '';

  const [customerOptions, setCustomerOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [masterData, setMasterData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [customerValue, setCustomerValue] = useState('');
  const [supplierValue, setSupplierValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [costingStatusValue, setCostingStatusValue] = useState('');
  const [costingMode, setCostingMode] = useState(false);
  const [row, setRow] = useState({
    deliveryDate: '',
    sizes: '',
    totalOrderQty: '',
    pcsPerCtn: '',
    l: '',
    w: '',
    h: '',
    fob: '',
    amsCommPct: '',
    dutyPct: '',
    currentFreight: '',
    totalCbm40hc: '',
    inwardTrucking: '',
    clearingValue: '',
    ldp: '',
  });

  const columns = useMemo(
    () => [
      'DELIVERY DATE',
      'SIZES',
      'TOTAL ORDER QTY',
      '# OF PCS/CTN',
      '# OF CTNS',
      'L',
      'W',
      'H',
      'CBM PER CTN',
      'TOTAL CBM',
      'FOB',
      'AMS COMM %',
      'AMS COMM AMT',
      'DUTY %',
      'DUTY AMT',
      'FREIGHT',
      'TRUCKING',
      'CLEARING',
      'PALLETIZING COST(ctn*12/30)',
      'FRT/PC',
      'T.COST/PC',
      'LDP',
      'GP/PC',
      'GP %',
    ],
    []
  );

  const customerLabel = (option) => option?.customerName ?? option?.CustomerName ?? option?.name ?? '';
  const customerKey = (option) => option?.customerID ?? option?.customerId ?? option?.CustomerID ?? '';
  const supplierLabel = (option) => option?.venderName ?? option?.VenderName ?? option?.vendorName ?? '';
  const supplierKey = (option) => option?.venderLibraryID ?? option?.venderLibraryId ?? option?.VenderLibraryID ?? '';

  const handleCancel = () => {
    navigate(paths.dashboard.supplyChain.merchantInquiry);
  };

  const handleRowChange = (field) => (event) => {
    const value = event.target.value;
    setRow((prev) => ({ ...prev, [field]: value }));
  };

  const calculatedRow = useMemo(() => {
    const totalOrderQty = toNum(row.totalOrderQty);
    const pcsPerCtn = toNum(row.pcsPerCtn);
    const l = toNum(row.l);
    const w = toNum(row.w);
    const h = toNum(row.h);
    const fob = toNum(row.fob);
    const amsCommPct = toNum(row.amsCommPct);
    const dutyPct = toNum(row.dutyPct);
    const currentFreight = toNum(row.currentFreight);
    const totalCbm40hc = toNum(row.totalCbm40hc);
    const inwardTrucking = toNum(row.inwardTrucking);
    const clearingValue = toNum(row.clearingValue);
    const ldp = toNum(row.ldp);

    const ofCtns = pcsPerCtn > 0 ? Math.ceil(totalOrderQty / pcsPerCtn) : 0;
    const cbmPerCtn = (l * w * h) / 61024;
    const totalCbm = cbmPerCtn * ofCtns;
    const amsCommAmt = (fob / 100) * amsCommPct;
    const dutyAmt = (fob / 100) * dutyPct;
    const freight =
      totalOrderQty > 0 && totalCbm40hc > 0 ? ((currentFreight / totalCbm40hc) * totalCbm) / totalOrderQty : 0;
    const trucking =
      totalOrderQty > 0 && totalCbm40hc > 0 ? ((inwardTrucking / totalCbm40hc) * totalCbm) / totalOrderQty : 0;
    const palletizingCost = totalOrderQty > 0 ? ((ofCtns * 12) / 30) / totalOrderQty : 0;
    const clearing = totalOrderQty > 0 ? clearingValue / totalOrderQty : 0;
    const frtPc = freight + trucking + clearing + palletizingCost;
    const tCostPc = frtPc + amsCommAmt + dutyAmt + fob;
    const gpPc = ldp - tCostPc;
    const gpPct = ldp > 0 ? (gpPc / ldp) * 100 : 0;

    return {
      ofCtns,
      cbmPerCtn,
      totalCbm,
      amsCommAmt,
      dutyAmt,
      freight,
      trucking,
      palletizingCost,
      clearing,
      frtPc,
      tCostPc,
      gpPc,
      gpPct,
    };
  }, [row]);

  useEffect(() => {
    if (!API_BASE_URL || !inquiryMstID) return undefined;

    const controller = new AbortController();
    console.log('=== Costing URL id ===', inquiryMstID);

    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const loadData = async (costingstatus, inquiryId = inquiryMstID) => {
          const url = `${API_BASE_URL}/api/MerchantInquiry/CostingData/${encodeURIComponent(
            inquiryId
          )}?costingstatus=${String(costingstatus)}`;
          console.log('=== CostingData request URL ===', url);
          const response = await axiosInstance.get(url, {
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
          });
          console.log('=== CostingData API response ===', response?.data);
          return response?.data;
        };

        let data = await loadData(false);
        const firstMaster = Array.isArray(data?.masterData) ? data.masterData[0] : data?.masterData;
        const resolvedInquiryMstID =
          firstMaster?.InquiryMstID ?? firstMaster?.InquiryMstId ?? firstMaster?.inquiryMstID ?? firstMaster?.inquiryMstId ?? inquiryMstID;
        console.log('=== resolved InquiryMstID ===', resolvedInquiryMstID);
        const inferredMode =
          firstMaster && (firstMaster.CostingStatusID != null || firstMaster.CostingStatus != null);

        if (resolvedInquiryMstID && String(resolvedInquiryMstID) !== String(inquiryMstID)) {
          data = await loadData(false, resolvedInquiryMstID);
        }

        if (inferredMode) {
          data = await loadData(true, resolvedInquiryMstID || inquiryMstID);
        }

        if (controller.signal.aborted) return;

        const master = Array.isArray(data?.masterData) ? data.masterData[0] : data?.masterData || {};
        setMasterData(master);
        setCostingMode(Boolean(master?.CostingStatusID != null || inferredMode));
        setCustomerValue(master?.CustomerName || '');
        setSupplierValue(master?.SupplierName || '');
        setDescriptionValue(master?.Description || master?.ItemDesc || master?.Remarks || '');
        setCostingStatusValue(master?.CostingStatus || '');
        setRow((prev) => ({
          ...prev,
          currentFreight: master?.CurrentFreight ?? prev.currentFreight,
          totalCbm40hc: master?.TotalCBM40CH ?? prev.totalCbm40hc,
          inwardTrucking: master?.InwardTrucking ?? prev.inwardTrucking,
        }));

        if (!master?.CostingStatusID) {
          setCustomerOptions(
            Array.isArray(data?.customerOptions) ? data.customerOptions : Array.isArray(data?.customers) ? data.customers : []
          );
          setSupplierOptions(
            Array.isArray(data?.supplierOptions) ? data.supplierOptions : Array.isArray(data?.suppliers) ? data.suppliers : []
          );
        } else {
          setCustomerOptions(
            Array.isArray(data?.customerOptions) ? data.customerOptions : Array.isArray(data?.customers) ? data.customers : []
          );
          setSupplierOptions(
            Array.isArray(data?.supplierOptions) ? data.supplierOptions : Array.isArray(data?.suppliers) ? data.suppliers : []
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('[CostingView] CostingData load failed', error);
        console.error('=== CostingData Error Response ===', error?.response?.data || error);
        setLoadError(error?.message || 'Failed to load costing data');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [API_BASE_URL, inquiryMstID]);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 1 }}>
        {loadError ? (
          <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
            {loadError}
          </Typography>
        ) : null}

        {!costingMode ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: 700, color: '#5a5a5a', mb: 1 }}>COSTING</Typography>
              <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRight: 0, minHeight: 72, bgcolor: '#fff' }}>
                <Autocomplete
                  fullWidth
                  options={customerOptions}
                  value={
                    customerOptions.find(
                      (option) =>
                        String(customerKey(option)) === String(customerValue) ||
                        customerLabel(option) === customerValue
                    ) || null
                  }
                  onChange={(_e, value) =>
                    setCustomerValue(String(customerKey(value) || customerLabel(value) || ''))
                  }
                  getOptionLabel={(option) => customerLabel(option)}
                  isOptionEqualToValue={(option, value) =>
                    String(customerKey(option)) === String(customerKey(value)) ||
                    customerLabel(option) === customerLabel(value)
                  }
                  renderInput={(params) => <TextField {...params} fullWidth size="small" label="Customer" sx={topFieldSx} />}
                />
                <Box sx={{ height: 12 }} />
                <Autocomplete
                  fullWidth
                  options={supplierOptions}
                  value={
                    supplierOptions.find(
                      (option) =>
                        String(supplierKey(option)) === String(supplierValue) ||
                        supplierLabel(option) === supplierValue
                    ) || null
                  }
                  onChange={(_e, value) =>
                    setSupplierValue(String(supplierKey(value) || supplierLabel(value) || ''))
                  }
                  getOptionLabel={(option) => supplierLabel(option)}
                  isOptionEqualToValue={(option, value) =>
                    String(supplierKey(option)) === String(supplierKey(value)) ||
                    supplierLabel(option) === supplierLabel(value)
                  }
                  renderInput={(params) => <TextField {...params} fullWidth size="small" label="Supplier" sx={topFieldSx} />}
                />
                <Box sx={{ height: 12 }} />
                <Autocomplete
                  freeSolo
                  fullWidth
                  options={[descriptionValue]}
                  value={descriptionValue}
                  onChange={(_e, value) => setDescriptionValue(String(value || ''))}
                  onInputChange={(_e, value) => setDescriptionValue(String(value || ''))}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" label="Description" sx={topFieldSx} />}
                />
                <Box sx={{ height: 12 }} />
                <TextField fullWidth size="small" label="Current Freight" value={row.currentFreight} onChange={handleRowChange('currentFreight')} sx={topFieldSx} />
                <Box sx={{ height: 12 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={7}>
                    <TextField fullWidth size="small" label="Total CBM 40HC" value={row.totalCbm40hc} onChange={handleRowChange('totalCbm40hc')} sx={topFieldSx} />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField fullWidth size="small" placeholder="" sx={topFieldSx} />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: 700, color: '#5a5a5a', mb: 1 }}>STATUS</Typography>
              <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderLeft: 0, minHeight: 72, bgcolor: '#fff' }}>
                <Grid container spacing={2} sx={{ mb: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="GRI" value={row.gri ?? ''} onChange={handleRowChange('gri')} sx={topFieldSx} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" placeholder="" value={row.griBlank ?? ''} onChange={handleRowChange('griBlank')} sx={topFieldSx} />
                  </Grid>
                </Grid>
                <TextField fullWidth size="small" label="Inward Trucking" value={row.inwardTrucking} onChange={handleRowChange('inwardTrucking')} sx={topFieldSx} />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1760, tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.grey[300] }}>
                      {columns.map((column) => (
                        <TableCell
                          key={column}
                          sx={{
                            color: '#333',
                            fontWeight: 600,
                            fontSize: '0.72rem',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            minWidth:
                              column === 'DELIVERY DATE'
                                ? 132
                                : column === 'TOTAL ORDER QTY'
                                ? 56
                                : column === 'PALLETIZING COST(ctn*12/30)'
                                ? 130
                                : column === 'SIZES'
                                ? 88
                                : 62,
                            width:
                              column === 'DELIVERY DATE'
                                ? 132
                                : column === 'SIZES'
                                ? 88
                                : 'auto',
                            px: 0.35,
                            py: 0.55,
                            borderRight: '1px solid rgba(0,0,0,0.08)',
                            verticalAlign: 'middle',
                          }}
                        >
                          {column}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell sx={{ ...cellSx, minWidth: 132, width: 132 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={row.deliveryDate}
                          onChange={handleRowChange('deliveryDate')}
                          sx={{
                            width: '100%',
                            '& input': {
                              minWidth: 0,
                              width: '100%',
                              boxSizing: 'border-box',
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ ...cellSx, minWidth: 88, width: 88 }}>
                        <TextField fullWidth size="small" value={row.sizes} onChange={handleRowChange('sizes')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.totalOrderQty} onChange={handleRowChange('totalOrderQty')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.pcsPerCtn} onChange={handleRowChange('pcsPerCtn')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={calculatedRow.ofCtns.toString()} InputProps={{ readOnly: true }} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.l} onChange={handleRowChange('l')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.w} onChange={handleRowChange('w')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.h} onChange={handleRowChange('h')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={calculatedRow.cbmPerCtn.toFixed(4)} InputProps={{ readOnly: true }} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={calculatedRow.totalCbm.toFixed(4)} InputProps={{ readOnly: true }} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.fob} onChange={handleRowChange('fob')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.amsCommPct} onChange={handleRowChange('amsCommPct')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={calculatedRow.amsCommAmt.toFixed(4)} InputProps={{ readOnly: true }} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.dutyPct} onChange={handleRowChange('dutyPct')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={calculatedRow.dutyAmt.toFixed(4)} InputProps={{ readOnly: true }} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.currentFreight} onChange={handleRowChange('currentFreight')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.inwardTrucking} onChange={handleRowChange('inwardTrucking')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.clearingValue} onChange={handleRowChange('clearingValue')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={calculatedRow.palletizingCost.toFixed(4)} InputProps={{ readOnly: true }} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={calculatedRow.frtPc.toFixed(4)} InputProps={{ readOnly: true }} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={calculatedRow.tCostPc.toFixed(4)} InputProps={{ readOnly: true }} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={row.ldp} onChange={handleRowChange('ldp')} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={calculatedRow.gpPc.toFixed(4)} InputProps={{ readOnly: true }} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <TextField fullWidth size="small" value={calculatedRow.gpPct.toFixed(2)} InputProps={{ readOnly: true }} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="contained" sx={{ minWidth: 160, bgcolor: '#000000', '&:hover': { bgcolor: '#111111' } }}>
                  Save
                </Button>
                <Button
                  variant="contained"
                  sx={{ minWidth: 160, bgcolor: '#000000', '&:hover': { bgcolor: '#111111' } }}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: 700, color: '#5a5a5a', mb: 1 }}>COSTING</Typography>
              <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRight: 0, minHeight: 72, bgcolor: '#fff' }}>
                <Autocomplete
                  fullWidth
                  options={customerOptions}
                  value={
                    customerOptions.find(
                      (option) =>
                        String(customerKey(option)) === String(customerValue) ||
                        customerLabel(option) === customerValue
                    ) || null
                  }
                  onChange={(_e, value) =>
                    setCustomerValue(String(customerKey(value) || customerLabel(value) || ''))
                  }
                  getOptionLabel={(option) => customerLabel(option)}
                  isOptionEqualToValue={(option, value) =>
                    String(customerKey(option)) === String(customerKey(value)) ||
                    customerLabel(option) === customerLabel(value)
                  }
                  renderInput={(params) => <TextField {...params} fullWidth size="small" label="Customer" sx={topFieldSx} />}
                />
                <Box sx={{ height: 12 }} />
                <TextField fullWidth size="small" label="COSTING STATUS" value={costingStatusValue} />
                <Box sx={{ height: 12 }} />
                <Autocomplete
                  fullWidth
                  options={supplierOptions}
                  value={
                    supplierOptions.find(
                      (option) =>
                        String(supplierKey(option)) === String(supplierValue) ||
                        supplierLabel(option) === supplierValue
                    ) || null
                  }
                  onChange={(_e, value) =>
                    setSupplierValue(String(supplierKey(value) || supplierLabel(value) || ''))
                  }
                  getOptionLabel={(option) => supplierLabel(option)}
                  isOptionEqualToValue={(option, value) =>
                    String(supplierKey(option)) === String(supplierKey(value)) ||
                    supplierLabel(option) === supplierLabel(value)
                  }
                  renderInput={(params) => <TextField {...params} fullWidth size="small" label="Supplier" sx={topFieldSx} />}
                />
                <Box sx={{ height: 12 }} />
                <Autocomplete
                  freeSolo
                  fullWidth
                  options={[descriptionValue]}
                  value={descriptionValue}
                  onChange={(_e, value) => setDescriptionValue(String(value || ''))}
                  onInputChange={(_e, value) => setDescriptionValue(String(value || ''))}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" label="Description" sx={topFieldSx} />}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: 700, color: '#5a5a5a', mb: 1 }}>STATUS</Typography>
              <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderLeft: 0, minHeight: 72, bgcolor: '#fff' }}>
                <TextField fullWidth size="small" label="Current Freight" value={row.currentFreight} onChange={handleRowChange('currentFreight')} sx={topFieldSx} />
                <Box sx={{ height: 12 }} />
                <TextField fullWidth size="small" label="GRI" value={row.gri ?? ''} onChange={handleRowChange('gri')} sx={topFieldSx} />
                <Box sx={{ height: 12 }} />
                <TextField fullWidth size="small" placeholder="" value={row.griBlank ?? ''} onChange={handleRowChange('griBlank')} sx={topFieldSx} />
                <Box sx={{ height: 12 }} />
                <TextField fullWidth size="small" label="Total CBM 40HC" value={row.totalCbm40hc} onChange={handleRowChange('totalCbm40hc')} sx={topFieldSx} />
                <Box sx={{ height: 12 }} />
                <TextField fullWidth size="small" label="Inward Trucking" value={row.inwardTrucking} onChange={handleRowChange('inwardTrucking')} sx={topFieldSx} />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="contained" sx={{ minWidth: 160, bgcolor: '#000000', '&:hover': { bgcolor: '#111111' } }}>
                  Update
                </Button>
                <Button variant="contained" sx={{ minWidth: 160, bgcolor: '#000000', '&:hover': { bgcolor: '#111111' } }} onClick={handleCancel}>
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </Card>
    </Container>
  );
};

export default CostingView;
