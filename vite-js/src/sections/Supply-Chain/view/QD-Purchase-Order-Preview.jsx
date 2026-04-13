import { useEffect, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
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
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import { alpha, useTheme } from '@mui/material/styles';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

// ----------------------------------------------------------------------

function LabeledValue({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, display: 'block' }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ mt: 0.25, fontWeight: 500, wordBreak: 'break-word' }}
      >
        {value != null && String(value).trim() !== '' ? String(value) : '—'}
      </Typography>
    </Box>
  );
}

function SectionHeader({ title, theme }) {
  return (
    <Box
      sx={{
        px: 3,
        py: 1.5,
        bgcolor: alpha(theme.palette.primary.main, 0.08),
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} color="primary.dark">
        {title}
      </Typography>
    </Box>
  );
}

/** Legacy: PurchaseOrderPreviewPopup.aspx?POID= */
export default function QDPurchaseOrderPreviewView() {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const poid = searchParams.get('poid');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!poid) {
      setLoading(false);
      setError('Missing poid in URL.');
      return undefined;
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
  const lines = data?.lines ?? data?.Lines ?? [];

  const totalQty = lines.reduce((s, r) => s + Number(r.quantity ?? r.Quantity ?? 0), 0);
  const totalAmt = lines.reduce((s, r) => {
    const qty = Number(r.quantity ?? r.Quantity ?? 0);
    const rate = Number(r.rate ?? r.Rate ?? 0);
    return s + qty * rate;
  }, 0);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="PURCHASE ORDER PREVIEW"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Master Order QD Sheet', href: paths.dashboard.masterOrderForQDSheet },
          { name: 'PO Preview' },
        ]}
        sx={{ mb: 3 }}
      />

      {/* Action bar */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }} flexWrap="wrap">
        <Button
          component={RouterLink}
          to={paths.dashboard.masterOrderForQDSheet}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          size="small"
        >
          Back
        </Button>
        {hdr && (
          <Button
            startIcon={<PrintIcon />}
            variant="contained"
            size="small"
            onClick={() => window.print()}
          >
            Print
          </Button>
        )}
      </Stack>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && hdr && (
        <>
          {/* ─── PO Header Card ─────────────────────────────── */}
          <Card
            variant="outlined"
            sx={{
              mb: 3,
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: theme.shadows[2],
            }}
          >
            {/* Card title bar */}
            <Box
              sx={{
                px: 3,
                py: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.8, fontSize: 11 }}>
                  Purchase Order
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  {hdr.pono ?? hdr.PONO ?? `POID: ${poid}`}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {hdr.pOtype ?? hdr.POtype ? (
                  <Chip
                    label={hdr.pOtype ?? hdr.POtype}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit', fontWeight: 700 }}
                  />
                ) : null}
                {hdr.pORefNo ?? hdr.PORefNo ? (
                  <Chip
                    label={`Ref: ${hdr.pORefNo ?? hdr.PORefNo}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'inherit' }}
                  />
                ) : null}
              </Stack>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Row 1: Parties */}
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: 'block', mb: 1.5, fontWeight: 700 }}
              >
                Parties
              </Typography>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {[
                  ['Customer', hdr.customerName ?? hdr.CustomerName],
                  ['Supplier', hdr.venderName ?? hdr.VenderName],
                  ['Merchant', hdr.merchantName ?? hdr.MerchantName],
                  ['AMS / ECP Division', hdr.eCPDivistion ?? hdr.ECPDivistion],
                ].map(([k, v]) => (
                  <Grid item xs={12} sm={6} md={3} key={k}>
                    <LabeledValue label={k} value={v} />
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ mb: 3 }} />

              {/* Row 2: Product Info */}
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: 'block', mb: 1.5, fontWeight: 700 }}
              >
                Product Info
              </Typography>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {[
                  ['Season', hdr.season ?? hdr.Season],
                  ['EK / Department', hdr.eknumber ?? hdr.Eknumber],
                  ['Product Group', hdr.productGroup ?? hdr.ProductGroup],
                  ['ECP Designation', hdr.ecpDesignation ?? hdr.ECPDesignation],
                ].map(([k, v]) => (
                  <Grid item xs={12} sm={6} md={3} key={k}>
                    <LabeledValue label={k} value={v} />
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ mb: 3 }} />

              {/* Row 3: Logistics */}
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: 'block', mb: 1.5, fontWeight: 700 }}
              >
                Logistics & Terms
              </Typography>
              <Grid container spacing={3}>
                {[
                  ['Placement Date', hdr.placementDatee ?? hdr.PlacementDatee],
                  ['Shipment Date', hdr.shipmentDatee ?? hdr.ShipmentDatee],
                  ['Lead Time', hdr.timeSpame ?? hdr.TimeSpame],
                  ['Currency', hdr.currency ?? hdr.Currency],
                  ['Tolerance (days)', hdr.toleranceindays ?? hdr.Toleranceindays],
                  ['Ship Mode', hdr.shipmentModeName ?? hdr.ShipmentModeName],
                  ['Delivery Type', hdr.deliveryTypeName ?? hdr.DeliveryTypeName],
                ].map(([k, v]) => (
                  <Grid item xs={12} sm={6} md={3} key={k}>
                    <LabeledValue label={k} value={v} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* ─── Order Lines ────────────────────────────────── */}
          <Card
            variant="outlined"
            sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: theme.shadows[2] }}
          >
            <SectionHeader title={`Order Lines (${lines.length})`} theme={theme} />

            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['#', 'Style No', 'Article', 'Size', 'Colorway', 'Qty', 'Rate', 'Amount', 'Item Description', 'Remarks'].map(
                      (col) => (
                        <TableCell
                          key={col}
                          sx={{
                            fontWeight: 700,
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            color: 'text.secondary',
                            bgcolor: 'grey.100',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {col}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        align="center"
                        sx={{ py: 5, color: 'text.secondary' }}
                      >
                        No order lines found for this PO.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((row, idx) => {
                      const qty = Number(row.quantity ?? row.Quantity ?? 0);
                      const rate = Number(row.rate ?? row.Rate ?? 0);
                      const amount = qty * rate;
                      return (
                        <TableRow
                          key={row.poDetailID ?? row.PODetailID ?? idx}
                          hover
                          sx={{
                            '&:nth-of-type(even)': {
                              bgcolor: alpha(theme.palette.primary.main, 0.03),
                            },
                          }}
                        >
                          <TableCell sx={{ color: 'text.disabled', fontWeight: 500 }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {row.styleNo ?? row.StyleNo ?? '—'}
                          </TableCell>
                          <TableCell>{row.article ?? row.Article ?? '—'}</TableCell>
                          <TableCell>{row.size ?? row.Size ?? '—'}</TableCell>
                          <TableCell>{row.colorway ?? row.Colorway ?? '—'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {qty.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {rate.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 700, color: 'primary.dark' }}
                          >
                            {amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 180 }}>
                            {row.itemDescription ?? row.ItemDescription ?? ''}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 140, color: 'text.secondary' }}>
                            {row.remarks ?? row.Remarks ?? ''}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals footer */}
            {lines.length > 0 && (
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  borderTop: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 4,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    TOTAL QTY
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.dark">
                    {totalQty.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    TOTAL AMOUNT
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.dark">
                    {totalAmt.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
              </Box>
            )}
          </Card>
        </>
      )}

      {/* No data state */}
      {!loading && !error && !hdr && (
        <Alert severity="info">No PO data found for POID: {poid}</Alert>
      )}
    </Container>
  );
}
