import { useEffect, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

/**
 * Legacy: InspectionProcessEntry.aspx?lPOID=&InspType=
 * (Proto Fit, Dyelot, Strikeoff, PP Sample, Size Set)
 */
export default function QDInspectionProcessEntryView() {
  const [searchParams] = useSearchParams();
  const poid = searchParams.get('poid');
  const inspType = searchParams.get('inspType') ?? '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!poid || !inspType) {
      setLoading(false);
      setError('Missing poid or inspType in URL.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res } = await qdApi.get(
          `/MasterOrderForQDSheet/inspection-process-entry/${encodeURIComponent(poid)}`,
          { params: { inspType } }
        );
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) {
          setError(
            typeof e?.response?.data === 'string'
              ? e.response.data
              : e?.message || 'Failed to load process entry'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [poid, inspType]);

  const master = data?.master ?? data?.Master;
  const saved = data?.savedRecord ?? data?.SavedRecord;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="INSPECTION PROCESS ENTRY"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Master Order QD Sheet', href: paths.dashboard.masterOrderForQDSheet },
          { name: 'Process entry' },
        ]}
        sx={{ mb: 2 }}
      />

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          {inspType || 'Process'}
        </Typography>
        <Chip size="small" label={`POID ${poid ?? '—'}`} />
      </Stack>

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

      {!loading && !error && master && (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            From PO / vendor (GetDataFromMaster)
          </Typography>
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {[
                    ['PO No', master.pono ?? master.PONO],
                    ['Supplier', master.venderName ?? master.VenderName],
                    ['Style', master.styleNo ?? master.StyleNo],
                  ].map(([k, v]) => (
                    <TableRow key={k}>
                      <TableCell sx={{ fontWeight: 600, width: 140 }}>{k}</TableCell>
                      <TableCell>{v != null ? String(v) : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {saved && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2 }} color="text.secondary">
                Saved InspectionTNAProcessMst (if any)
              </Typography>
              <Paper variant="outlined" sx={{ mt: 1 }}>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {[
                        ['ID', saved.inspectionTNAProcMstID ?? saved.InspectionTNAProcMstID],
                        ['Auto No', saved.inspAutoNo ?? saved.InspAutoNo],
                        ['Received', saved.receivedDate ?? saved.ReceivedDate],
                        ['Supplier contact', saved.supplierContact ?? saved.SupplierContact],
                        ['Style name', saved.styleName ?? saved.StyleName],
                        ['COO', saved.cOO ?? saved.coo ?? saved.COO],
                        ['Review', saved.reviewDate ?? saved.ReviewDate],
                        ['Comments', saved.generalComments ?? saved.GeneralComments],
                      ].map(([k, v]) => (
                        <TableRow key={k}>
                          <TableCell sx={{ fontWeight: 600, width: 160 }}>{k}</TableCell>
                          <TableCell>{v != null ? String(v) : ''}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}

          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
            Legacy page includes fabric tests grid, measurement points, file uploads, and save — add
            endpoints when those features are migrated.
          </Typography>
        </Card>
      )}

      <Button component={RouterLink} to={paths.dashboard.masterOrderForQDSheet} sx={{ mt: 2 }}>
        Back to Master Order For QD Sheet
      </Button>
    </Container>
  );
}
