import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { paths } from 'src/routes/paths';
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

// ── Legacy AMS2 constants ──
const SLOTS = 12;
const HDR_BG = '#f58f62';
const YELLOW = '#FFFF99';
const ORANGE = '#f58f62';
const UNIT_OPTS = [{ value: '0', label: 'CM' }, { value: '1', label: 'INCH' }];
const defaultH = () => Array.from({ length: SLOTS }, () => '');
const API = () => import.meta.env.VITE_API_BASE_URL;
const inp = { '& .MuiOutlinedInput-root': { height: 28 }, '& .MuiInputBase-input': { py: 0.5, px: 0.5, fontSize: 12, fontWeight: 600, textAlign: 'center' } };

export default function SizeSpecsEntryView() {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  const isEdit = location.pathname.includes('/size-specs/edit');
  const ns = location.state || {};
  const lPODetailID = ns.poDetailId || sp.get('lPODetailID') || '';
  const initialPOID = ns.poid || sp.get('lPOID') || '';
  const initMT = ns.measurementTypeId || sp.get('measurementTypeId') || '';
  const uid = ns.userId || localStorage.getItem('userId') || '';
  
  const [currentPOID, setCurrentPOID] = useState(initialPOID);
  const hasIds = currentPOID !== '' && Number(currentPOID) > 0;

  // ── State (matches legacy VB form fields) ──
  const [poNo, setPoNo] = useState('');
  const [styleNo, setStyleNo] = useState('');
  const [buyer, setBuyer] = useState('');
  const [specNo, setSpecNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [mUnit, setMUnit] = useState('0');
  const [mType, setMType] = useState(initMT);
  const [headers, setHeaders] = useState(defaultH);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mTypeOpts, setMTypeOpts] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [savedOnce, setSavedOnce] = useState(false);

  // ── 1. Page_Load: BindPoInfo + BindMeasurementPoints ──
  useEffect(() => {
    if (!currentPOID || currentPOID === '0') return;
    const init = async () => {
      setLoading(true);
      try {
        const B = API();
        // BindPoInfo: GetPODataForSpecsPO
        const r1 = await fetch(`${B}/api/SelfSizeSpecs/GetPODataForSpecsPO?poid=${currentPOID}`);
        if (r1.ok) {
          const d = await r1.json();
          if (d) { setPoNo(d.pono || d.poNo || ''); setStyleNo(d.styleNo || ''); setBuyer(d.customerName || ''); }
        }
        // GetAutoNoOnEdit + GetRemarksOnEdit
        if (lPODetailID && lPODetailID !== '0') {
          try {
            const r2 = await fetch(`${B}/api/SelfSizeSpecs/GetAutoNoOnEdit?poid=${currentPOID}&poDetailId=${lPODetailID}`);
            if (r2.ok) { const v = await r2.text(); setSpecNo(v.replace(/"/g, '')); }
          } catch (_) { /* optional endpoint */ }
          try {
            const r3 = await fetch(`${B}/api/SelfSizeSpecs/GetRemarksOnEdit?poid=${currentPOID}&poDetailId=${lPODetailID}`);
            if (r3.ok) { const v = await r3.text(); setRemarks(v.replace(/"/g, '')); }
          } catch (_) { /* optional endpoint */ }
        }
        // BindMeasurementPoints: GetMeasurementTypesByPO
        const r4 = await fetch(`${B}/api/SelfSizeSpecs/GetMeasurementTypesByPO?poid=${currentPOID}`);
        if (r4.ok) {
          const td = await r4.json();
          const opts = td.map(t => ({ value: String(t.measurementTypeID), label: t.measurementType }));
          setMTypeOpts(opts);
          // Auto-select first type (like legacy ddlMeasurementType.SelectedIndex = 1)
          const target = initMT || (opts.length > 0 ? opts[0].value : '');
          if (target) { setMType(target); loadGrid(target, currentPOID); }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPOID, lPODetailID]);

  // ── 2. BindKikIns_MeasurementPoints (GetEditData with fallback to GetLoadData) ──
  const loadGrid = useCallback(async (typeId, poidToLoad) => {
    const pID = poidToLoad || currentPOID;
    if (!pID || pID === '0') return;
    const tid = typeId || mType;
    if (!tid || tid === '0') return;
    setLoading(true);
    setSuccessMsg('');
    try {
      const B = API();
      const token = localStorage.getItem('accessToken');
      const p = new URLSearchParams({ poid: pID, measurementTypeId: tid, userId: uid || '26' });
      const ep = (lPODetailID && lPODetailID !== '0') ? 'GetEditData' : 'GetLoadData';
      if (ep === 'GetEditData') p.append('poDetailId', lPODetailID);
      const res = await fetch(`${B}/api/SelfSizeSpecs/${ep}?${p}`, {
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const f = data[0];
        if (f.pono || f.poNo) setPoNo(f.pono || f.poNo);
        if (f.styleNo) setStyleNo(f.styleNo);
        if (f.customerName) setBuyer(f.customerName);
        if (f.autoNo) setSpecNo(f.autoNo);
        if (f.remarks) setRemarks(f.remarks);
        if (f.measurements === 'INCH') setMUnit('1');
        else if (f.measurements === 'CM') setMUnit('0');
        // Headers from first row only (like legacy count=0)
        const hr = data.find(r => r.header1) || f;
        setHeaders(Array.from({ length: SLOTS }, (_, i) => hr[`header${i + 1}`] || ''));
        // Map rows
        setRows(data.map((r, idx) => ({
          id: String(r.sizeSpecsID || `row-${idx}`),
          sizeSpecsHeaderNewID: r.sizeSpecsHeaderNewID || 0,
          seqNo: idx + 1,
          mpId: r.measurementPointID || 0,
          mpName: r.measurementPoints || '',
          tolerance: r.tolerance || '',
          // Col1-12 = POSizeSpecs (LEFT orange read-only = txtQSpecSize in legacy)
          spec: Array.from({ length: SLOTS }, (_, i) => { const v = r[`col${i + 1}`]; return v != null ? String(v) : ''; }),
          // QCol1-12 = SelfSizeSpecs actuals (RIGHT yellow editable = txtSpecSize in legacy)
          actual: Array.from({ length: SLOTS }, (_, i) => { const v = r[`qCol${i + 1}`]; return v != null ? String(v) : ''; }),
        })));
      } else {
        setRows([]);
        enqueueSnackbar('No data found.', { variant: 'warning' });
      }
    } catch (e) { console.error(e); enqueueSnackbar('Failed to load', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [currentPOID, lPODetailID, mType, uid, enqueueSnackbar]);

  // ── Handlers ──
  const onH = useCallback((i, v) => setHeaders(p => { const n = [...p]; n[i] = v; return n; }), []);
  const onTol = useCallback((id, v) => setRows(p => p.map(r => r.id === id ? { ...r, tolerance: v } : r)), []);
  const onAct = useCallback((id, ci, v) => {
    setRows(p => p.map(r => { if (r.id !== id) return r; const a = [...r.actual]; a[ci] = v; return { ...r, actual: a }; }));
  }, []);
  // ddlMeasurementType_SelectedIndexChanged
  const onTypeChange = (e) => {
    const v = e.target.value;
    setMType(v);
    setSuccessMsg('');
    setSavedOnce(false);
    if (v && v !== '0') loadGrid(v);
    else setRows([]);
  };

  const handlePoSearch = async () => {
    if (!poNo) return;
    setLoading(true);
    try {
      const B = API();
      const r1 = await fetch(`${B}/api/SelfSizeSpecs/GetPOInfo?pono=${encodeURIComponent(poNo)}`);
      if (r1.ok) {
        const d = await r1.json();
        if (d && d.poid) {
          const newPoid = String(d.poid);
          setPoNo(d.pono || poNo);
          setStyleNo(d.styleNo || '');
          setBuyer(d.customerName || '');
          setSpecNo(d.autoNo || '');
          setCurrentPOID(newPoid);
          
          // Get Measurement Types
          const r4 = await fetch(`${B}/api/SelfSizeSpecs/GetMeasurementTypesByPO?poid=${newPoid}`);
          if (r4.ok) {
            const td = await r4.json();
            const opts = td.map(t => ({ value: String(t.measurementTypeID), label: t.measurementType }));
            setMTypeOpts(opts);
            if (opts.length === 0) {
              enqueueSnackbar('No measurement types found for this PO.', { variant: 'warning' });
              setMType('');
              setRows([]);
            } else {
              const target = opts[0].value;
              setMType(target);
              // grid load handles from useEffect / currentPOID
            }
          }
        } else {
          enqueueSnackbar('PO not found.', { variant: 'error' });
          setCurrentPOID('');
          setRows([]);
          setMTypeOpts([]);
        }
      } else {
        enqueueSnackbar('PO not found.', { variant: 'error' });
        setCurrentPOID('');
        setRows([]);
        setMTypeOpts([]);
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar('Error fetching PO Info', { variant: 'error' });
      setCurrentPOID('');
      setRows([]);
      setMTypeOpts([]);
    } finally {
      setLoading(false);
    }
  };

  // ── 3. btnSave_Click ──
  const doSave = async () => {
    setConfirmOpen(false);
    if (!mType || mType === '0') { enqueueSnackbar('Please select Type.', { variant: 'warning' }); return; }
    // Legacy validation: only save rows where at least one txtSpecSize (actual) is non-empty
    const validRows = rows.filter(r => r.actual.some(v => v !== '' && v !== '0'));
    if (validRows.length === 0) { enqueueSnackbar('No data to save.', { variant: 'warning' }); return; }
    setLoading(true);
    try {
      const B = API();
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId') || localStorage.getItem('roleId') || '0';
      const payload = {
        poid: Number(currentPOID), poDetailId: Number(lPODetailID || 0), userId: Number(userId),
        remarks, autoNo: specNo, measurements: mUnit === '1' ? 'INCH' : 'CM',
        header1: headers[0], header2: headers[1], header3: headers[2], header4: headers[3],
        header5: headers[4], header6: headers[5], header7: headers[6], header8: headers[7],
        header9: headers[8], header10: headers[9], header11: headers[10], header12: headers[11],
        details: validRows.map(r => ({
          sizeSpecsID: isNaN(Number(r.id)) ? 0 : Number(r.id),
          measurementPointID: Number(r.mpId || 0), measurementPoints: r.mpName, tolerance: r.tolerance,
          col1: r.actual[0] || '', col2: r.actual[1] || '', col3: r.actual[2] || '', col4: r.actual[3] || '',
          col5: r.actual[4] || '', col6: r.actual[5] || '', col7: r.actual[6] || '', col8: r.actual[7] || '',
          col9: r.actual[8] || '', col10: r.actual[9] || '', col11: r.actual[10] || '', col12: r.actual[11] || '',
        })),
      };
      const res = await fetch(`${B}/api/SelfSizeSpecs/Save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Legacy after-save: show green msg, hide Save, reset type to Select, hide grid
        setSuccessMsg('Record saved successfully');
        setSavedOnce(true);
        setRows([]);
        setMType('');
        enqueueSnackbar('Record saved successfully', { variant: 'success' });
      } else {
        const err = await res.json().catch(() => ({}));
        enqueueSnackbar(err.message || 'Error saving.', { variant: 'error' });
      }
    } catch (e) { console.error(e); enqueueSnackbar('Failed to save.', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  const showSave = mType && mType !== '0' && !savedOnce;
  const tblW = useMemo(() => 44 + 250 + 100 + SLOTS * 140, []);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ py: 2 }}>
      <CustomBreadcrumbs heading="SIZE SPECS" links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Size Specs View', href: paths.dashboard.supplyChain.sizeSpecsView },
        { name: 'Size Specs' },
      ]} sx={{ mb: 2 }} />

      <Card variant="outlined" sx={{ borderRadius: 1 }}>
        {/* Card header with green success message (like legacy) */}
        <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ width: '30%' }}>SIZE SPECS</Typography>
          <Typography sx={{ width: '40%', textAlign: 'center', fontWeight: 700, color: 'green' }}>{successMsg}</Typography>
          <Box sx={{ width: '30%' }} />
        </Box>

        <CardContent sx={{ position: 'relative' }}>
          {loading && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}

          {/* Row 1: PO#, Style#, Buyer */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>PO #</Typography>
              <TextField fullWidth size="small" value={poNo} disabled={isEdit && hasIds}
                onChange={(e) => setPoNo(e.target.value)}
                onBlur={handlePoSearch}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePoSearch(); } }}
                placeholder="Search for PO # ...." sx={{ '& .MuiOutlinedInput-root': { height: 31 }, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>Style #: </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, pt: 0.5 }}>{styleNo}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>Buyer : </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, pt: 0.5 }}>{buyer}</Typography>
            </Grid>
          </Grid>

          {/* Row 2: Spec#, Measurements, Type */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>Spec #</Typography>
              <TextField fullWidth size="small" value={specNo} InputProps={{ readOnly: true }}
                sx={{ '& .MuiOutlinedInput-root': { height: 31 }, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>Measurements</Typography>
              <FormControl fullWidth size="small">
                <Select value={mUnit} onChange={(e) => setMUnit(e.target.value)} sx={{ height: 31, fontSize: 12 }}>
                  {UNIT_OPTS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>Type</Typography>
              <FormControl fullWidth size="small">
                <Select value={mType} onChange={onTypeChange} displayEmpty sx={{ height: 31, fontSize: 12 }}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {mTypeOpts.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Row 3: Remarks */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>Remarks</Typography>
              <TextField fullWidth size="small" value={remarks} onChange={(e) => setRemarks(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { height: 31 }, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
            </Grid>
          </Grid>

          {/* Row 4: Save button (legacy: col-sm-10 empty + col-sm-2 button) */}
          {showSave && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={10} />
              <Grid item xs={2}>
                <Button variant="contained" fullWidth onClick={() => setConfirmOpen(true)}
                  sx={{ height: 40, fontWeight: 700, textTransform: 'none' }}>Save</Button>
              </Grid>
            </Grid>
          )}

          {/* Grid (visible only when rows exist and not just saved) */}
          {rows.length > 0 && (
            <Box sx={{ overflow: 'auto' }}>
              <Table size="small" sx={{ minWidth: tblW, borderCollapse: 'collapse', '& td, & th': { border: '1px solid #ddd' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ bgcolor: 'background.neutral', color: 'text.primary', fontWeight: 700, width: '2%', fontSize: 12, p: 0.5 }}>No.</TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'background.neutral', color: 'text.primary', fontWeight: 700, width: '10%', fontSize: 12, p: 0.5 }}>Measurement Points</TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'background.neutral', color: 'text.primary', fontWeight: 700, width: '5%', fontSize: 12, p: 0.5 }}>TOL +/-</TableCell>
                    {Array.from({ length: SLOTS }, (_, i) => (
                      <TableCell key={i} align="center" sx={{ bgcolor: 'background.neutral', color: 'text.primary', fontWeight: 700, width: '7%', p: 0.5 }}>
                        <TextField fullWidth size="small" value={headers[i]} onChange={(e) => onH(i, e.target.value)}
                          sx={{ ...inp, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', height: 28, '& fieldset': { borderColor: 'divider' } },
                            '& .MuiInputBase-input': { textAlign: 'center', fontWeight: 700, fontSize: 12 } }} />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell align="center" sx={{ fontSize: 12, fontWeight: 600, p: 0.5 }}>{row.seqNo}</TableCell>
                      <TableCell align="center" sx={{ p: 0.5 }}>
                        <TextField fullWidth size="small" value={row.mpName} InputProps={{ readOnly: true }}
                          sx={{ ...inp, '& .MuiOutlinedInput-root': { bgcolor: 'background.neutral', height: 28, '& fieldset': { borderColor: 'divider' } } }} />
                      </TableCell>
                      <TableCell align="center" sx={{ p: 0.5, bgcolor: 'background.paper' }}>
                        <TextField fullWidth size="small" value={row.tolerance} onChange={(e) => onTol(row.id, e.target.value)}
                          sx={{ ...inp, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', height: 28, '& fieldset': { borderColor: 'divider' } } }} />
                      </TableCell>
                      {Array.from({ length: SLOTS }, (_, ci) => (
                        <TableCell key={ci} sx={{ p: 0.5, bgcolor: 'background.paper' }}>
                          <Stack direction="row" spacing={0.5}>
                            {/* LEFT: txtQSpecSize = Col (POSizeSpecs, read-only) */}
                            <TextField size="small" value={row.spec[ci]} InputProps={{ readOnly: true }}
                              sx={{ flex: 1, ...inp, '& .MuiOutlinedInput-root': { bgcolor: 'background.neutral', height: 28, '& fieldset': { border: 'none' } },
                                '& .MuiInputBase-input': { color: 'text.primary', fontWeight: 700, textAlign: 'center', fontSize: 12, p: 0 } }} />
                            {/* RIGHT: txtSpecSize = QCol (SelfSizeSpecs actuals, editable) */}
                            <TextField size="small" value={row.actual[ci]} onChange={(e) => onAct(row.id, ci, e.target.value)}
                              sx={{ flex: 1, ...inp, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', height: 28, '& fieldset': { borderColor: 'divider' } },
                                '& .MuiInputBase-input': { textAlign: 'center', fontSize: 12, fontWeight: 600, p: 0 } }} />
                          </Stack>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Confirm: legacy OnClientClick="return confirm('Are you sure...')" */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Save</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to Save this record?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={doSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
