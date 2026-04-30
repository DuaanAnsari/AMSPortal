import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
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

import { paths } from 'src/routes/paths';
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const MEASUREMENT_UNIT_OPTIONS = [
  { value: '0', label: 'CM' },
  { value: '1', label: 'INCH' },
];

const MEASUREMENT_TYPE_OPTIONS = [
  { value: '', label: '\u00a0' },
  { value: '1', label: 'Grading' },
  { value: '2', label: 'Construction' },
  { value: '3', label: 'Pre-Production' },
];

// Changed to 12 as per API response (col1 - col12)
const SIZE_SLOT_COUNT = 12;

const LEGACY_HEADER_BG = '#f58f62';
const LEGACY_CELL_YELLOW = '#fff59d';
const LEGACY_Q_BG = '#f58f62';

const defaultSizeHeaders = () => Array.from({ length: SIZE_SLOT_COUNT }, () => '');

const cellTextFieldSx = {
  '& .MuiInputBase-input': { py: 0.75, px: 0.75, fontSize: 12, textAlign: 'center' },
};

export default function SizeSpecsEntryView() {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  const isAdd = location.pathname.endsWith('/size-specs/add');
  const isEdit = location.pathname.endsWith('/size-specs/edit');

  const navState = location.state || {};
  const lPODetailID = navState.poDetailId || searchParams.get('lPODetailID') || '';
  const lPOID = navState.poid || searchParams.get('lPOID') || '';
  const initMeasurementTypeId = navState.measurementTypeId || searchParams.get('measurementTypeId') || '';
  const initUserId = navState.userId || localStorage.getItem('userId') || '';

  const hasLegacyIds = lPOID !== '' && Number(lPOID) > 0;

  const heading = isAdd ? 'Add Size Specs' : 'Size Specs Edit';

  const [poNo, setPoNo] = useState('');
  const [styleNo, setStyleNo] = useState('');
  const [buyer, setBuyer] = useState('');
  const [specNo, setSpecNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState('0');
  const [measurementType, setMeasurementType] = useState(initMeasurementTypeId);
  const [sizeHeaders, setSizeHeaders] = useState(() => defaultSizeHeaders());
  const [gridRows, setGridRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use a ref for current measurementType to avoid dependency loops in useCallback
  const measurementTypeRef = useCallback(() => measurementType, [measurementType]);

  const fetchEditData = useCallback(async (typeIdOverride) => {
    if (!isEdit || !hasLegacyIds) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      
      const typeId = typeIdOverride !== undefined ? typeIdOverride : measurementTypeRef();
      const currentUserId = initUserId || localStorage.getItem('userId') || localStorage.getItem('roleId') || '';

      const urlParams = new URLSearchParams();
      if (lPOID && lPOID !== '0') urlParams.append('poid', lPOID);
      if (lPODetailID && lPODetailID !== '0') urlParams.append('poDetailId', lPODetailID);
      if (typeId && typeId !== '0') urlParams.append('measurementTypeId', typeId);
      if (currentUserId && currentUserId !== '0') urlParams.append('userId', currentUserId);

      console.log('Fetching GetEditData with params:', Object.fromEntries(urlParams.entries()));

      const url = `${API_BASE_URL}/api/SelfSizeSpecs/GetEditData?${urlParams.toString()}`;

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        
        setPoNo(first.pono || first.poNo || `PO-${lPOID}`);
        setStyleNo(first.styleNo || '');
        setBuyer(first.buyer || first.customerName || '');
        setSpecNo(first.autoNo || first.specNo || '');
        setRemarks(first.remarks || '');
        
        if (first.measurementUnit != null) setMeasurementUnit(String(first.measurementUnit));
        
        setMeasurementType((prev) => {
          if (first.measurementTypeId != null && prev === '') {
             return String(first.measurementTypeId);
          }
          return prev;
        });

        const newHeaders = Array.from({ length: SIZE_SLOT_COUNT }, (_, i) => first[`header${i + 1}`] || '');
        setSizeHeaders(newHeaders);

        const groupedMap = new Map();
        data.forEach((row) => {
           if (!row.measurementPoints) return;
           if (!groupedMap.has(row.measurementPoints)) {
               groupedMap.set(row.measurementPoints, row);
           }
        });
        
        const grouped = Array.from(groupedMap.values()).map((row, idx) => ({
            id: String(row.selfSizeSpecDetailId || row.id || `row-${idx}`),
            seqNo: idx + 1,
            measurementPoints: row.measurementPoints,
            tolerance: row.tolerance || '',
            qSizes: Array.from({ length: SIZE_SLOT_COUNT }, (_, i) => {
                const val = row[`qCol${i + 1}`];
                return val != null ? String(val) : '';
            }),
            specSizes: Array.from({ length: SIZE_SLOT_COUNT }, (_, i) => {
                const val = row[`col${i + 1}`];
                return val != null ? String(val) : '';
            }),
        }));
        
        setGridRows(grouped);
      } else {
        setGridRows([]);
        if (typeIdOverride === undefined) {
          enqueueSnackbar('No data found for this record.', { variant: 'warning' });
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      enqueueSnackbar('Failed to load edit data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isEdit, hasLegacyIds, lPOID, lPODetailID, measurementTypeRef, enqueueSnackbar]);

  useEffect(() => {
    if (isEdit && hasLegacyIds) {
      fetchEditData();
    }
  }, [fetchEditData, isEdit, hasLegacyIds]);

  useEffect(() => {
    if (isAdd) {
      const fromNav = location.state?.poNo;
      setPoNo(fromNav ? String(fromNav) : '');
      setStyleNo('');
      setBuyer('');
      setSpecNo('');
      setRemarks('');
      setMeasurementUnit('0');
      setMeasurementType('');
      setSizeHeaders(defaultSizeHeaders());
      setGridRows([]);
    }
  }, [isAdd, location.state?.poNo]);

  const poLocked = isEdit && hasLegacyIds;

  const tableMinWidth = useMemo(() => 44 + 200 + 72 + SIZE_SLOT_COUNT * 112, []);

  const handleHeaderChange = useCallback((idx, value) => {
    setSizeHeaders((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);

  const handleRowPoint = useCallback((rowId, value) => {
    setGridRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, measurementPoints: value } : r)));
  }, []);

  const handleRowTol = useCallback((rowId, value) => {
    setGridRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, tolerance: value } : r)));
  }, []);

  const handleRowQ = useCallback((rowId, colIdx, value) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const qSizes = [...r.qSizes];
        qSizes[colIdx] = value;
        return { ...r, qSizes };
      })
    );
  }, []);

  const handleRowSpec = useCallback((rowId, colIdx, value) => {
    setGridRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const specSizes = [...r.specSizes];
        specSizes[colIdx] = value;
        return { ...r, specSizes };
      })
    );
  }, []);

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setMeasurementType(val);
    // Optionally fetch new template/data based on type if needed
    // fetchEditData(val);
  };

  const querySummary = useMemo(() => {
    if (!isEdit) return null;
    const q = new URLSearchParams();
    if (lPODetailID !== '') q.set('lPODetailID', String(lPODetailID));
    if (lPOID !== '') q.set('lPOID', String(lPOID));
    return q.toString();
  }, [isEdit, lPODetailID, lPOID]);

  const handleSave = () => {
    if (!measurementType) {
      enqueueSnackbar('Please select Type.', { variant: 'warning' });
      return;
    }
    if (isEdit && !hasLegacyIds) {
      enqueueSnackbar('Missing lPOID (and optionally lPODetailID) in URL.', {
        variant: 'warning',
      });
      return;
    }
    enqueueSnackbar(
      isEdit
        ? `Save (demo) · lPODetailID=${lPODetailID || '—'} · lPOID=${lPOID} — API later.`
        : 'Save (demo) — API later.',
      { variant: 'info' }
    );
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ py: 2 }}>
      <CustomBreadcrumbs
        heading={heading}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Size Specs View', href: paths.dashboard.supplyChain.sizeSpecsView },
          { name: heading },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      {isEdit && !hasLegacyIds && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Missing Query Parameters:{' '}
          <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>
            ?lPODetailID=…&lPOID=…
          </Typography>{' '}
          (example: ?lPODetailID=1&amp;lPOID=166332).
        </Alert>
      )}

      {isEdit && hasLegacyIds && (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip size="small" label={`lPODetailID: ${lPODetailID || '—'}`} variant="outlined" />
          <Chip size="small" color="primary" label={`lPOID: ${lPOID}`} variant="outlined" />
          {querySummary ? (
            <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mt: 0.5 }}>
              Query: <span style={{ fontFamily: 'monospace' }}>{querySummary}</span>
            </Typography>
          ) : null}
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 1 }}>
        <CardContent sx={{ pt: 3, pb: 3, position: 'relative' }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(255,255,255,0.7)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CircularProgress />
            </Box>
          )}
          
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="PO #"
                value={poNo}
                onChange={(e) => setPoNo(e.target.value)}
                disabled={poLocked}
                placeholder="Search For PO # ...."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Style #"
                value={styleNo}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Buyer :"
                value={buyer}
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" label="Spec #" value={specNo} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Measurements</InputLabel>
                <Select
                  label="Measurements"
                  value={measurementUnit}
                  onChange={(e) => setMeasurementUnit(e.target.value)}
                >
                  {MEASUREMENT_UNIT_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={measurementType}
                  onChange={handleTypeChange}
                  displayEmpty
                >
                  {MEASUREMENT_TYPE_OPTIONS.map((o) => (
                    <MenuItem key={o.value || 'empty'} value={o.value}>
                      {o.label?.trim() ? o.label : '\u00a0'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2.5} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Grid>
          </Grid>

          {gridRows.length > 0 && (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ maxHeight: 520, overflow: 'auto', mb: 2, borderRadius: 1 }}
            >
              <Table size="small" stickyHeader sx={{ minWidth: tableMinWidth }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      align="center"
                      sx={{
                        bgcolor: LEGACY_HEADER_BG,
                        color: '#fff',
                        fontWeight: 700,
                        minWidth: 44,
                      }}
                    >
                      No.
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        bgcolor: LEGACY_HEADER_BG,
                        color: '#fff',
                        fontWeight: 700,
                        minWidth: 200,
                      }}
                    >
                      Measurement Points
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        bgcolor: LEGACY_HEADER_BG,
                        color: '#fff',
                        fontWeight: 700,
                        minWidth: 72,
                      }}
                    >
                      TOL +/-
                    </TableCell>
                    {Array.from({ length: SIZE_SLOT_COUNT }, (_, i) => (
                      <TableCell
                        key={i}
                        align="center"
                        sx={{
                          bgcolor: LEGACY_HEADER_BG,
                          color: '#fff',
                          fontWeight: 700,
                          minWidth: 112,
                          verticalAlign: 'bottom',
                          py: 0.5,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#fff', display: 'block', mb: 0.25 }}>
                          {i + 1}
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={sizeHeaders[i]}
                          onChange={(e) => handleHeaderChange(i, e.target.value)}
                          sx={{
                            ...cellTextFieldSx,
                            '& .MuiOutlinedInput-root': {
                              bgcolor: '#fff',
                              '& fieldset': { borderColor: 'rgba(0,0,0,0.2)' },
                            },
                          }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gridRows.map((row, rowIdx) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{ bgcolor: rowIdx % 2 === 1 ? 'action.hover' : 'background.paper' }}
                    >
                      <TableCell align="center" sx={{ fontWeight: 600, verticalAlign: 'middle' }}>
                        {row.seqNo}
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'middle', p: 0.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.measurementPoints}
                          onChange={(e) => handleRowPoint(row.id, e.target.value)}
                          sx={{
                            ...cellTextFieldSx,
                            '& .MuiOutlinedInput-root': {
                              bgcolor: LEGACY_CELL_YELLOW,
                              '& fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'middle', p: 0.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.tolerance}
                          onChange={(e) => handleRowTol(row.id, e.target.value)}
                          sx={{
                            ...cellTextFieldSx,
                            '& .MuiOutlinedInput-root': {
                              bgcolor: LEGACY_CELL_YELLOW,
                              '& fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                            },
                          }}
                        />
                      </TableCell>
                      {Array.from({ length: SIZE_SLOT_COUNT }, (_, colIdx) => (
                        <TableCell key={colIdx} sx={{ verticalAlign: 'middle', p: 0.5, minWidth: 112 }}>
                          <Stack direction="row" spacing={0.5}>
                            <TextField
                              size="small"
                              value={row.qSizes[colIdx]}
                              onChange={(e) => handleRowQ(row.id, colIdx, e.target.value)}
                              sx={{
                                ...cellTextFieldSx,
                                flex: 1,
                                minWidth: 0,
                                '& .MuiOutlinedInput-root': {
                                  bgcolor: LEGACY_Q_BG,
                                  '& fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                                },
                                '& .MuiInputBase-input': { color: '#fff', fontWeight: 600 },
                              }}
                            />
                            <TextField
                              size="small"
                              value={row.specSizes[colIdx]}
                              onChange={(e) => handleRowSpec(row.id, colIdx, e.target.value)}
                              sx={{
                                ...cellTextFieldSx,
                                flex: 1,
                                minWidth: 0,
                                '& .MuiOutlinedInput-root': {
                                  bgcolor: '#fff',
                                  '& fieldset': { borderColor: 'rgba(0,0,0,0.2)' },
                                },
                              }}
                            />
                          </Stack>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => navigate(paths.dashboard.supplyChain.sizeSpecsView)}>
              Back to list
            </Button>
            <Button variant="contained" onClick={handleSave} sx={{ minWidth: 120, fontWeight: 600 }}>
              Save
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
