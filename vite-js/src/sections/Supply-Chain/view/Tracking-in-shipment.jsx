import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import { ArrowBackIosNew } from '@mui/icons-material';

// ----------------------------------------------------------------------

const SESSION_KEY = 'trackingInShipment_state';

export default function TrackingInShipmentPage() {
  const navigate = useNavigate();
  const [poNumber, setPoNumber] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Restore state only if user came back via View button
  useEffect(() => {
    try {
      const fromView = sessionStorage.getItem(`${SESSION_KEY}_fromView`);
      if (fromView === 'true') {
        sessionStorage.removeItem(`${SESSION_KEY}_fromView`);
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          const { poNumber: savedPo, rows: savedRows, showResults: savedShow } = JSON.parse(saved);
          if (savedPo) setPoNumber(savedPo);
          if (savedRows) setRows(savedRows);
          if (savedShow) setShowResults(savedShow);
        }
      } else {
        // Fresh navigation — clear saved state
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const buildUrl = (baseUrl, po) => {
    const base = String(baseUrl || '').replace(/\/+$/, '');
    // base should be like: http://192.168.18.13  (NOT including /api)
    return `${base}/api/ShipmentRelease/PoSearch/${encodeURIComponent(po)}`;
  };

  const handleSearch = async () => {
    const po = poNumber.trim();
    if (!po) {
      setError('PO Number is required.');
      setShowResults(false);
      return;
    }
    if (!API_BASE_URL) {
      setError('Missing VITE_API_BASE_URL in env.');
      setShowResults(false);
      return;
    }

    setError('');
    setLoading(true);
    setShowResults(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const url = buildUrl(API_BASE_URL, po);

      const res = await fetch(url, { headers });
      if (!res.ok) {
        setRows([]);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ poNumber: po, rows: [], showResults: true }));
        return;
      }
      const data = await res.json();
      const fetched = Array.isArray(data) ? data : data ? [data] : [];
      setRows(fetched);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ poNumber: po, rows: fetched, showResults: true }));
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card sx={{ p: 4, borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton size="small" onClick={() => navigate(-1)}>
            <ArrowBackIosNew fontSize="small" />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#6b6f76' }}>
            PO TRACKING IN SHIPMENT
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="flex-end">
          <Grid item xs={12} md={4}>
            <Typography sx={{ mb: 1, fontWeight: 600 }}>PO Number:</Typography>
            <TextField
              fullWidth
              size="small"
              value={poNumber}
              onChange={(event) => setPoNumber(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              variant="contained"
              size="small"
              sx={{
                minWidth: 120,
                height: 36,
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: '#3f336d',
                '&:hover': { bgcolor: '#302857' },
              }}
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Search'}
            </Button>
          </Grid>
        </Grid>

        {showResults && (
          <Box sx={{ mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 1, color: rows.length === 0 && !loading ? '#d32f2f' : '#6b6f76', fontWeight: rows.length === 0 && !loading ? 600 : 400 }}>
              {rows.length === 0 && !loading
                ? 'This Order Not Exist in Any Following Invoices'
                : 'This Order Exist in Following Invoices'}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                  {[
                    'Invoice No',
                    'Value',
                    'Invoice Date',
                    'Shipment Date',
                    'Bill No',
                    'Voyage',
                    'View',
                  ].map((head) => (
                    <TableCell
                      key={head}
                      sx={{
                        color: '#000',
                        fontWeight: 700,
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ border: '1px solid #e0e0e0', color: '#6b6f76', textAlign: 'center', py: 2 }}>
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={`${row.cargoid}-${row.invoiceno}`}>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Tooltip title={`Cargo ID: ${row.cargoid || '-'}`} placement="top">
                          <span>{row.invoiceno}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Tooltip title={`Cargo ID: ${row.cargoid || '-'}`} placement="top">
                          <span>{row.invoicevalue}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Tooltip title={`Cargo ID: ${row.cargoid || '-'}`} placement="top">
                          <span>{row.invoicedate}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Tooltip title={`Cargo ID: ${row.cargoid || '-'}`} placement="top">
                          <span>{row.shipmentdate}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Tooltip title={`Cargo ID: ${row.cargoid || '-'}`} placement="top">
                          <span>{row.billno}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                        <Tooltip title={`Cargo ID: ${row.cargoid || '-'}`} placement="top">
                          <span>{row.voyageFlight}</span>
                        </Tooltip>
                      </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: 50,
                          fontSize: '0.7rem',
                          py: 0.3,
                          px: 1,
                          textTransform: 'none',
                        }}
                        onClick={() => {
                          sessionStorage.setItem(`${SESSION_KEY}_fromView`, 'true');
                          navigate(`/dashboard/supply-chain/shipment/${row.cargoid}/edit`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  ))
                )}
                <TableRow>
                  <TableCell colSpan={7} sx={{ color: '#6b6f76', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                    Page 1
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
    </Container>
  );
}

