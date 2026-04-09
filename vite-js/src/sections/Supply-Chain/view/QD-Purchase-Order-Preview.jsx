import { useEffect, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

// ----------------------------------------------------------------------

function fld(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && v !== '') return v;
  }
  return null;
}

function fmt(val) {
  return val != null ? String(val) : '—';
}

/** Labelled row for the PO detail table */
function DetailRow({ label, value }) {
  return (
    <Box
      component="tr"
      sx={{
        '& td': { py: '3px', fontSize: 13, lineHeight: 1.5 },
      }}
    >
      <Box
        component="td"
        sx={{
          textAlign: 'right',
          pr: 1.5,
          color: 'text.secondary',
          width: '55%',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Box>
      <Box component="td" sx={{ fontWeight: 500, color: 'text.primary' }}>
        {value}
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function QDPurchaseOrderPreviewView() {
  const [searchParams] = useSearchParams();
  const poid = searchParams.get('poid');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!poid) {
      setLoading(false);
      setError('Missing poid in URL.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res } = await qdApi.get(
          `/MasterOrderForQDSheet/purchase-order-preview/${encodeURIComponent(poid)}`
        );
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) {
          setError(
            typeof e?.response?.data === 'string'
              ? e.response.data
              : e?.message || 'Failed to load PO preview'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [poid]);

  const hdr = data?.header ?? data?.Header;
  const lines = Array.isArray(data?.lines ?? data?.Lines) ? (data?.lines ?? data?.Lines) : [];
  const deliveries = Array.isArray(data?.deliveries ?? data?.Deliveries)
    ? (data?.deliveries ?? data?.Deliveries)
    : [];

  const poNo = fld(hdr, 'pono', 'PONO', 'poNo', 'PoNo');

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="VIEW PO"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Master Order QD Sheet', href: paths.dashboard.masterOrderForQDSheet },
          { name: 'PO Preview' },
        ]}
        sx={{ mb: 2 }}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && hdr && (
        <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          {/* ── PO Title ── */}
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: 'primary.main', mb: 2 }}
          >
            PO No. {fmt(poNo)}{lines.length > 0 ? ` / ${lines.length}` : ''}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* ── Purchase Order Detail (full row) ── */}
          <Grid container spacing={4} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: 14 }}>
                Purchase Order Detail
              </Typography>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <DetailRow label="Season Name" value={fmt(fld(hdr, 'season', 'Season'))} />
                  <DetailRow
                    label="Order Type"
                    value={`${fmt(fld(hdr, 'pOtype', 'POtype', 'poType', 'PoType'))}(${fmt(fld(hdr, 'pORefNo', 'PORefNo', 'poRefNo'))})`}
                  />
                  <DetailRow
                    label="Order Placement Date"
                    value={fmt(fld(hdr, 'placementDatee', 'PlacementDatee', 'placementDate', 'PlacementDate'))}
                  />
                  <DetailRow
                    label="Shipment Date"
                    value={fmt(fld(hdr, 'shipmentDatee', 'ShipmentDatee', 'shipmentDate', 'ShipmentDate'))}
                  />
                  <DetailRow
                    label="Lead Time Margin"
                    value={`${fmt(fld(hdr, 'timeSpame', 'TimeSpame', 'leadTime', 'LeadTime'))}Days`}
                  />
                  <DetailRow
                    label="Transaction should be in"
                    value={fmt(fld(hdr, 'currency', 'Currency'))}
                  />
                  <DetailRow
                    label="Tolerance"
                    value={(() => {
                      const raw = fld(
                        hdr,
                        'toleranceindays', 'Toleranceindays',
                        'tolerance',       'Tolerance',
                        'toleranceValue',  'ToleranceValue',
                        'tolerancePct',    'TolerancePct',
                        'tolarance',       'Tolarance',
                      );
                      if (!raw && raw !== 0) return '—';
                      const s = String(raw);
                      // If already has +/- or % just show as-is
                      if (s.includes('+/-') || s.includes('%')) return s;
                      return `+/-${s}%`;
                    })()}
                  />
                </tbody>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* ── Buyer Information | Supplier Information (center) | Merchandiser Information ── */}
          <Grid container spacing={4} sx={{ mb: 2 }}>
            {/* Buyer */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: 14 }}>
                Buyer information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                ({fmt(fld(hdr, 'eknumber', 'Eknumber', 'ekNumber', 'EKNumber', 'buyingDeptNo', 'BuyingDeptNo'))})
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {fmt(fld(hdr, 'customerName', 'CustomerName'))}
              </Typography>
            </Grid>

            {/* Supplier — CENTER */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: 14 }}>
                Supplier information
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {fmt(fld(hdr, 'venderName', 'VenderName', 'supplierName', 'SupplierName'))}
              </Typography>
            </Grid>

            {/* Merchandiser */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: 14 }}>
                Merchandiser information
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {fmt(fld(hdr, 'merchantName', 'MerchantName'))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {fmt(fld(hdr, 'ecpDesignation', 'ECPDesignation', 'designation', 'Designation'))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {fmt(fld(hdr, 'eCPDivistion', 'ECPDivistion', 'ecpDivision', 'ECPDivision'))}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* ── Items to be sourced ── */}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: 14 }}>
            Items to be sourced
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: 'grey.700',
                    '& th': { color: '#fff', fontWeight: 700, fontSize: 13, py: 1 },
                  }}
                >
                  {[
                    'Style',
                    'Article No',
                    'Item Description',
                    'Colorway',
                    'Size',
                    'PO Quantity',
                    'Item Price',
                    'Value',
                  ].map((col) => (
                    <TableCell key={col}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                      No lines found.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((row, idx) => {
                    const qty = Number(fld(row, 'quantity', 'Quantity') ?? 0);
                    const rate = Number(fld(row, 'rate', 'Rate') ?? 0);
                    const value = qty * rate;
                    return (
                      <TableRow
                        key={fld(row, 'poDetailID', 'PODetailID') ?? idx}
                        sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}
                      >
                        <TableCell>{fmt(fld(row, 'styleNo', 'StyleNo'))}</TableCell>
                        <TableCell>{fmt(fld(row, 'article', 'Article'))}</TableCell>
                        <TableCell>{fmt(fld(row, 'itemDescription', 'ItemDescription'))}</TableCell>
                        <TableCell>{fmt(fld(row, 'colorway', 'Colorway'))}</TableCell>
                        <TableCell>{fmt(fld(row, 'size', 'Size'))}</TableCell>
                        <TableCell align="center">{qty || 0}</TableCell>
                        <TableCell align="center">{rate ? rate.toFixed(4) : '0.0000'}</TableCell>
                        <TableCell align="center">{value.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Delivery Schedule ── */}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: 14 }}>
            Delivery Schedule
          </Typography>

          {(() => {
            const totalQty   = lines.reduce((s, r) => s + Number(fld(r, 'quantity', 'Quantity') ?? 0), 0);
            const totalValue = lines.reduce((s, r) => s + Number(fld(r, 'quantity', 'Quantity') ?? 0) * Number(fld(r, 'rate', 'Rate') ?? 0), 0);
            const currency   = fmt(fld(hdr, 'currency', 'Currency'));
            const delivType  = fmt(fld(hdr, 'deliveryTypeName', 'DeliveryTypeName', 'deliveryType', 'DeliveryType', 'shipmentModeName', 'ShipmentModeName'));

            const delivList = deliveries.length > 0
              ? deliveries
              : [{ _fallback: true }];

            return delivList.map((d, i) => {
              const date = d._fallback
                ? fmt(fld(hdr, 'shipmentDatee', 'ShipmentDatee', 'shipmentDate', 'ShipmentDate'))
                : fmt(fld(d, 'deliveryDate', 'DeliveryDate', 'date', 'Date', 'shipmentDate', 'ShipmentDate'));
              const dQty = d._fallback
                ? totalQty
                : Number(fld(d, 'quantity', 'Quantity', 'qty', 'Qty') ?? totalQty);
              const dVal = d._fallback
                ? totalValue
                : Number(fld(d, 'value', 'Value', 'amount', 'Amount') ?? totalValue);
              const dCur = d._fallback
                ? currency
                : fmt(fld(d, 'currency', 'Currency') ?? currency);
              const dMode = d._fallback
                ? delivType
                : fmt(fld(d, 'deliveryTypeName', 'DeliveryTypeName', 'deliveryType', 'DeliveryType', 'shipmentMode', 'ShipmentMode', 'mode', 'Mode'));

              return (
                <Box key={i} sx={{ mb: 0.5 }}>
                  {/* Line 1: Delivery1   30 Mar 2026 */}
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'baseline' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>
                      Delivery{i + 1}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {date}
                    </Typography>
                  </Box>
                  {/* Line 2:     Total Scheduled   26   1170 PKR   FOB */}
                  <Box sx={{ display: 'flex', gap: 4, alignItems: 'baseline', pl: 11 }}>
                    <Typography variant="body2" fontWeight={700}>
                      Total Scheduled
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {dQty}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {dVal > 0 ? `${dVal.toFixed(0)} ${dCur}` : dCur}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {dMode}
                    </Typography>
                  </Box>
                </Box>
              );
            });
          })()}
        </Card>
      )}

      <Button
        component={RouterLink}
        to={paths.dashboard.masterOrderForQDSheet}
        variant="outlined"
        sx={{ mt: 2 }}
      >
        Back to Master Order For QD Sheet
      </Button>
    </Container>
  );
}
