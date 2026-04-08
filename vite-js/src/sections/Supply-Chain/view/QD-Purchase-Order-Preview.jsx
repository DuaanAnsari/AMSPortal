import { useEffect, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

/** Legacy: PurchaseOrderPreviewPopup.aspx?POID= */
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
  const lines = data?.lines ?? data?.Lines ?? [];

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
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            PO: {hdr.pono ?? hdr.PONO}
          </Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {[
              ['Merchant', hdr.merchantName ?? hdr.MerchantName],
              ['Season', hdr.season ?? hdr.Season],
              ['ECP', hdr.ecpDesignation ?? hdr.ECPDesignation],
              ['Product group', hdr.productGroup ?? hdr.ProductGroup],
              ['Order type', `${hdr.pOtype ?? hdr.POtype ?? ''} (${hdr.pORefNo ?? hdr.PORefNo ?? ''})`],
              ['Placement', hdr.placementDatee ?? hdr.PlacementDatee],
              ['Shipment', hdr.shipmentDatee ?? hdr.ShipmentDatee],
              ['Lead time', hdr.timeSpame ?? hdr.TimeSpame],
              ['Currency', hdr.currency ?? hdr.Currency],
              ['Tolerance', hdr.toleranceindays ?? hdr.Toleranceindays],
              ['Ship mode', hdr.shipmentModeName ?? hdr.ShipmentModeName],
              ['Delivery', hdr.deliveryTypeName ?? hdr.DeliveryTypeName],
              ['Supplier', hdr.venderName ?? hdr.VenderName],
              ['AMS', hdr.eCPDivistion ?? hdr.ECPDivistion],
              ['Customer', hdr.customerName ?? hdr.CustomerName],
              ['EK / Dept', hdr.eknumber ?? hdr.Eknumber],
            ].map(([k, v]) => (
              <Grid item xs={12} sm={6} md={4} key={k}>
                <Typography variant="caption" color="text.secondary">
                  {k}
                </Typography>
                <Typography variant="body2">{v != null ? String(v) : '—'}</Typography>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Lines (GetPurchaseOrderForPrivew)
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Article', 'Size', 'Color', 'Qty', 'Rate', 'Style', 'Item desc', 'Remarks'].map(
                    (c) => (
                      <TableCell key={c}>{c}</TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((row) => {
                  const r = row;
                  return (
                    <TableRow key={r.poDetailID ?? r.PODetailID}>
                      <TableCell>{r.article ?? r.Article}</TableCell>
                      <TableCell>{r.size ?? r.Size}</TableCell>
                      <TableCell>{r.colorway ?? r.Colorway}</TableCell>
                      <TableCell>{r.quantity ?? r.Quantity}</TableCell>
                      <TableCell>{r.rate ?? r.Rate}</TableCell>
                      <TableCell>{r.styleNo ?? r.StyleNo}</TableCell>
                      <TableCell>{r.itemDescription ?? r.ItemDescription}</TableCell>
                      <TableCell>{r.remarks ?? r.Remarks}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Button component={RouterLink} to={paths.dashboard.masterOrderForQDSheet} sx={{ mt: 2 }}>
        Back to Master Order For QD Sheet
      </Button>
    </Container>
  );
}
