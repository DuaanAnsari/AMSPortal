import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';

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
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

/**
 * Legacy: InspectionProcessEntry.aspx?lPOID=&InspType=
 * (Proto Fit, Dyelot, Strikeoff, PP Sample, Size Set)
 */
export default function QDInspectionProcessEntryView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poid = searchParams.get('lPOID') ?? searchParams.get('poid');
  const inspType = searchParams.get('InspType') ?? searchParams.get('inspType') ?? '';
  const inspectionMstId = searchParams.get('lInspectionTNAProcMstID');

  const [data, setData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [formMaster, setFormMaster] = useState({});
  const [formFabric, setFormFabric] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const boolValue = (value) => {
    if (value === true || value === 1) return true;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      return ['true', '1', 'yes', 'y', 'x'].includes(v);
    }
    return false;
  };

  useEffect(() => {
    if (!poid || !inspType) {
      setLoading(false);
      setError('Missing lPOID/poid or InspType/inspType in URL.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: apiRes } = await qdApi.get('/InspectionProcessEntry', {
          params: {
            lPOID: poid,
            InspType: inspType,
            lInspectionTNAProcMstID: inspectionMstId || undefined,
          },
        });
        if (!cancelled) {
          setData(apiRes);
          setReportData({
            master: apiRes?.master,
            fabricTesting: apiRes?.fabricTesting,
            sizeSpecs: apiRes?.sizeSpecs,
          });
        }
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
  }, [poid, inspType, inspectionMstId]);

  const entryMaster = data?.masterSummary ?? data?.MasterSummary;
  const saved = data?.savedRecord ?? data?.SavedRecord;
  const master = reportData?.master ?? reportData?.Master ?? saved ?? {};
  const fabricRows = useMemo(
    () => reportData?.fabricTesting ?? reportData?.FabricTesting ?? [],
    [reportData]
  );
  const sizeRows = useMemo(
    () => reportData?.sizeSpecs ?? reportData?.SizeSpecs ?? [],
    [reportData]
  );

  const firstSize = sizeRows[0] ?? {};
  const viewMaster = formMaster && Object.keys(formMaster).length ? formMaster : master;
  const viewFabric = formFabric && formFabric.length ? formFabric : fabricRows;

  useEffect(() => {
    setFormMaster(master || {});
  }, [master]);

  useEffect(() => {
    setFormFabric(fabricRows || []);
  }, [fabricRows]);

  const updateMasterField = (field, value) => {
    setFormMaster((prev) => ({ ...prev, [field]: value }));
  };

  const updateFabricField = (idx, field, value) => {
    setFormFabric((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleCancel = () => {
    navigate(paths.dashboard.supplyChain.samplingProgram);
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      const toBool = (v) => boolValue(v);
      const toNum = (v, d = 0) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : d;
      };

      const payload = {
        lPOID: Number(poid),
        inspType,
        inspectionTNAProcMstID: Number(inspectionMstId || formMaster.inspectionTNAProcMstID || formMaster.InspectionTNAProcMstID || 0) || undefined,
        master: {
          inspAutoNo: formMaster.inspAutoNo ?? formMaster.InspAutoNo ?? '',
          receivedDate: formMaster.receivedDate ?? formMaster.ReceivedDate ?? null,
          supplierContact: formMaster.supplierContact ?? formMaster.SupplierContact ?? '',
          styleNo: formMaster.styleNo ?? formMaster.StyleNo ?? '',
          coo: formMaster.coo ?? formMaster.COO ?? '',
          styleName: formMaster.styleName ?? formMaster.StyleName ?? '',
          savedInSession: formMaster.savedInSession ?? formMaster.SavedInSession ?? '',
          sampleType: formMaster.sampleType ?? formMaster.SampleType ?? '',
          reviewDate: formMaster.reviewDate ?? formMaster.ReviewDate ?? null,
          te_MeasureToSpec: toBool(formMaster.tE_MeasureToSpec ?? formMaster.TE_MeasureToSpec),
          te_FabricWeight: toBool(formMaster.tE_FabricWeight ?? formMaster.TE_FabricWeight),
          te_Components: toBool(formMaster.tE_Components ?? formMaster.TE_Components),
          te_GarmentFit: toBool(formMaster.tE_GarmentFit ?? formMaster.TE_GarmentFit),
          te_FabricColorMatch: toBool(formMaster.tE_FabricColorMatch ?? formMaster.TE_FabricColorMatch),
          te_Embellishment: toBool(formMaster.tE_Embellishment ?? formMaster.TE_Embellishment),
          te_FabricQuality: toBool(formMaster.tE_FabricQuality ?? formMaster.TE_FabricQuality),
          te_Construction: toBool(formMaster.tE_Construction ?? formMaster.TE_Construction),
          te_Labeling: toBool(formMaster.tE_Labeling ?? formMaster.TE_Labeling),
          te_FabricWashTest: toBool(formMaster.tE_FabricWashTest ?? formMaster.TE_FabricWashTest),
          te_SewingQuality: toBool(formMaster.tE_SewingQuality ?? formMaster.TE_SewingQuality),
          te_Comments: formMaster.tE_Comments ?? formMaster.TE_Comments ?? '',
          fdmr_Comments: formMaster.fdmR_Comments ?? formMaster.FDMR_Comments ?? '',
          fabricStandardGSM: toNum(formMaster.fabricStandardGSM ?? formMaster.FabricStandardGSM, 0),
          actualWeightGSM: toNum(formMaster.actualWeightGSM ?? formMaster.ActualWeightGSM, 0),
          fabricApproved: toNum(formMaster.fabricApproved ?? formMaster.FabricApproved, 2),
          constructionFitComments: formMaster.constructionFitComments ?? formMaster.ConstructionFitComments ?? '',
          embellishmentComments: formMaster.embellishmentComments ?? formMaster.EmbellishmentComments ?? '',
          generalComments: formMaster.generalComments ?? formMaster.GeneralComments ?? '',
          asI_GarmentRejected: toBool(formMaster.asI_GarmentRejected ?? formMaster.ASI_GarmentRejected),
          asI_ProceedToSales: toBool(formMaster.asI_ProceedToSales ?? formMaster.ASI_ProceedToSales),
          asI_ProceedWithSales: toBool(formMaster.asI_ProceedWithSales ?? formMaster.ASI_ProceedWithSales),
          asI_ProceedWithProd: toBool(formMaster.asI_ProceedWithProd ?? formMaster.ASI_ProceedWithProd),
          asI_GarmentApproved: toBool(formMaster.asI_GarmentApproved ?? formMaster.ASI_GarmentApproved),
        },
        fabricTesting: (formFabric || []).map((r) => ({
          inspectionTNAProcDtlID: r.inspectionTNAProcDtlID ?? r.InspectionTNAProcDtlID ?? 0,
          fabricTests: r.fabricTests ?? r.FabricTests ?? '',
          isApprove: Number(r.isApprove ?? r.IsApprove ?? 2),
          fabricComments: r.fabricComments ?? r.FabricComments ?? '',
        })),
      };

      await qdApi.post('/InspectionProcessEntry', payload);
      navigate(paths.dashboard.supplyChain.samplingProgram);
    } catch (e) {
      setError(typeof e?.response?.data === 'string' ? e.response.data : e?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

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
          <Typography variant="h6" sx={{ mb: 2 }}>
            SAMPLE INSPECTION INFORMATION
          </Typography>
          <Grid container spacing={2}>
            {[
              ['Insp. Sample #', viewMaster.inspAutoNo ?? viewMaster.InspAutoNo ?? ''],
              ['PO #', entryMaster?.pono ?? entryMaster?.PONO ?? viewMaster.pono ?? viewMaster.PONO ?? ''],
              ['Received Date', viewMaster.receivedDate ?? viewMaster.ReceivedDate ?? ''],
              ['Supplier/Contact', viewMaster.supplierContact ?? viewMaster.SupplierContact ?? ''],
              ['Style Number', viewMaster.styleNo ?? viewMaster.StyleNo ?? entryMaster?.styleNo ?? entryMaster?.StyleNo ?? ''],
              ['COO', viewMaster.coo ?? viewMaster.COO ?? ''],
              ['Style Name', viewMaster.styleName ?? viewMaster.StyleName ?? ''],
              ['Saved in Season', viewMaster.savedInSession ?? viewMaster.SavedInSession ?? ''],
              ['Sample Type', viewMaster.sampleType ?? viewMaster.SampleType ?? ''],
              ['Review Date', viewMaster.reviewDate ?? viewMaster.ReviewDate ?? ''],
            ].map(([label, value]) => (
              <Grid item xs={12} sm={6} md={3} key={label}>
                <TextField
                  fullWidth
                  size="small"
                  label={label}
                  value={value ?? ''}
                  onChange={(ev) => {
                    const map = {
                      'Insp. Sample #': 'inspAutoNo',
                      'Received Date': 'receivedDate',
                      'Supplier/Contact': 'supplierContact',
                      'Style Number': 'styleNo',
                      COO: 'coo',
                      'Style Name': 'styleName',
                      'Saved in Season': 'savedInSession',
                      'Sample Type': 'sampleType',
                      'Review Date': 'reviewDate',
                    };
                    const field = map[label];
                    if (field) updateMasterField(field, ev.target.value);
                  }}
                  InputProps={{ readOnly: label === 'PO #' }}
                />
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            TESTING AND EVALUATION to be PERFORMED
          </Typography>
          <Grid container>
            {[
              ['Measure to Spec', boolValue(viewMaster.tE_MeasureToSpec ?? viewMaster.TE_MeasureToSpec)],
              ['Fabric Weight', boolValue(viewMaster.tE_FabricWeight ?? viewMaster.TE_FabricWeight)],
              ['Components', boolValue(viewMaster.tE_Components ?? viewMaster.TE_Components)],
              ['Garment Fit', boolValue(viewMaster.tE_GarmentFit ?? viewMaster.TE_GarmentFit)],
              ['Fabric Color Match', boolValue(viewMaster.tE_FabricColorMatch ?? viewMaster.TE_FabricColorMatch)],
              ['Embellishment', boolValue(viewMaster.tE_Embellishment ?? viewMaster.TE_Embellishment)],
              ['Fabric Quality/Hand', boolValue(viewMaster.tE_FabricQuality ?? viewMaster.TE_FabricQuality)],
              ['Construction', boolValue(viewMaster.tE_Construction ?? viewMaster.TE_Construction)],
              ['Labeling', boolValue(viewMaster.tE_Labeling ?? viewMaster.TE_Labeling)],
              ['Fabric Wash Test', boolValue(viewMaster.tE_FabricWashTest ?? viewMaster.TE_FabricWashTest)],
              ['Sewing Quality', boolValue(viewMaster.tE_SewingQuality ?? viewMaster.TE_SewingQuality)],
            ].map(([label, checked]) => (
              <Grid item xs={12} sm={6} md={4} key={label}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={(ev) => {
                        const fieldMap = {
                          'Measure to Spec': 'tE_MeasureToSpec',
                          'Fabric Weight': 'tE_FabricWeight',
                          Components: 'tE_Components',
                          'Garment Fit': 'tE_GarmentFit',
                          'Fabric Color Match': 'tE_FabricColorMatch',
                          Embellishment: 'tE_Embellishment',
                          'Fabric Quality/Hand': 'tE_FabricQuality',
                          Construction: 'tE_Construction',
                          Labeling: 'tE_Labeling',
                          'Fabric Wash Test': 'tE_FabricWashTest',
                          'Sewing Quality': 'tE_SewingQuality',
                        };
                        const field = fieldMap[label];
                        if (field) updateMasterField(field, ev.target.checked);
                      }}
                    />
                  }
                  label={label}
                />
              </Grid>
            ))}
          </Grid>
          <TextField
            fullWidth
            size="small"
            label="Comments"
            value={viewMaster.tE_Comments ?? viewMaster.TE_Comments ?? ''}
            onChange={(ev) => updateMasterField('tE_Comments', ev.target.value)}
            sx={{ mt: 1 }}
          />

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            FINISHED DIMENSION MEASUREMENT RESULTS
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Measurements That Do Not Meet Required Spec"
            value={viewMaster.fdmR_Comments ?? viewMaster.FDMR_Comments ?? ''}
            onChange={(ev) => updateMasterField('fdmR_Comments', ev.target.value)}
            sx={{ mb: 1 }}
          />
          <Paper variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Measurement Points</TableCell>
                  <TableCell>TOL+/-</TableCell>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <TableCell key={n} align="center">
                      {firstSize[`header${n}`] ?? firstSize[`Header${n}`] ?? ''}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sizeRows.length ? (
                  sizeRows.map((row, idx) => (
                    <TableRow key={row.sizeSpecsID ?? row.SizeSpecsID ?? idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{row.measurementPoints ?? row.MeasurementPoints}</TableCell>
                      <TableCell>{row.tolerance ?? row.Tolerance}</TableCell>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <TableCell key={n} align="center">
                          {(row[`qCol${n}`] ?? row[`QCol${n}`] ?? row[`col${n}`] ?? row[`Col${n}`] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11}>No measurement data available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            FABRIC TESTING AND GARMENT FEEDBACK
          </Typography>
          <Paper variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fabric Tests</TableCell>
                  <TableCell align="center">Approved</TableCell>
                  <TableCell align="center">Rejected</TableCell>
                  <TableCell>Comments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewFabric.length ? (
                  viewFabric.map((row, idx) => {
                    const approveValue = row.isApprove ?? row.IsApprove;
                    const approved = Number(approveValue) === 1;
                    const rejected = Number(approveValue) === 0;
                    return (
                      <TableRow key={row.inspectionTNAProcDtlID ?? row.InspectionTNAProcDtlID ?? idx}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.fabricTests ?? row.FabricTests ?? ''}
                            onChange={(ev) => updateFabricField(idx, 'fabricTests', ev.target.value)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox checked={approved} onChange={() => updateFabricField(idx, 'isApprove', 1)} />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox checked={rejected} onChange={() => updateFabricField(idx, 'isApprove', 0)} />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.fabricComments ?? row.FabricComments ?? ''}
                            onChange={(ev) => updateFabricField(idx, 'fabricComments', ev.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>No fabric testing rows.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Fabric Standard GSM"
                value={viewMaster.fabricStandardGSM ?? viewMaster.FabricStandardGSM ?? ''}
                onChange={(ev) => updateMasterField('fabricStandardGSM', ev.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Actual Weight GSM"
                value={viewMaster.actualWeightGSM ?? viewMaster.ActualWeightGSM ?? ''}
                onChange={(ev) => updateMasterField('actualWeightGSM', ev.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Fabric Approved"
                value={
                  Number(viewMaster.fabricApproved ?? viewMaster.FabricApproved) === 1
                    ? 'YES'
                    : Number(viewMaster.fabricApproved ?? viewMaster.FabricApproved) === 0
                      ? 'NO'
                      : 'N/A'
                }
                onChange={(ev) => {
                  const v = String(ev.target.value).toUpperCase();
                  updateMasterField('fabricApproved', v === 'YES' ? 1 : v === 'NO' ? 0 : 2);
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Construction / Fit"
                value={viewMaster.constructionFitComments ?? viewMaster.ConstructionFitComments ?? ''}
                onChange={(ev) => updateMasterField('constructionFitComments', ev.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Embellishment"
                value={viewMaster.embellishmentComments ?? viewMaster.EmbellishmentComments ?? ''}
                onChange={(ev) => updateMasterField('embellishmentComments', ev.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="General Comments"
                value={viewMaster.generalComments ?? viewMaster.GeneralComments ?? ''}
                onChange={(ev) => updateMasterField('generalComments', ev.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            APPROVAL AND SUPPLIER INSTRUCTIONS
          </Typography>
          <Grid container>
            {[
              ['Garment Rejected - Submit a corrected Fit Sample', boolValue(viewMaster.asI_GarmentRejected ?? viewMaster.ASI_GarmentRejected)],
              ['Proceed to Sales Samples with changes/corrections', boolValue(viewMaster.asI_ProceedToSales ?? viewMaster.ASI_ProceedToSales)],
              ['Proceed with Sales Samples', boolValue(viewMaster.asI_ProceedWithSales ?? viewMaster.ASI_ProceedWithSales)],
              ['Proceed with Production Quantities', boolValue(viewMaster.asI_ProceedWithProd ?? viewMaster.ASI_ProceedWithProd)],
              ['Garment approved - waiting for customer selection', boolValue(viewMaster.asI_GarmentApproved ?? viewMaster.ASI_GarmentApproved)],
            ].map(([label, checked]) => (
              <Grid item xs={12} md={6} key={label}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={(ev) => {
                        const fieldMap = {
                          'Garment Rejected - Submit a corrected Fit Sample': 'asI_GarmentRejected',
                          'Proceed to Sales Samples with changes/corrections': 'asI_ProceedToSales',
                          'Proceed with Sales Samples': 'asI_ProceedWithSales',
                          'Proceed with Production Quantities': 'asI_ProceedWithProd',
                          'Garment approved - waiting for customer selection': 'asI_GarmentApproved',
                        };
                        const field = fieldMap[label];
                        if (field) updateMasterField(field, ev.target.checked);
                      }}
                    />
                  }
                  label={label}
                />
              </Grid>
            ))}
          </Grid>

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleUpdate} disabled={saving}>
              {saving ? 'Updating...' : 'Update'}
            </Button>
          </Stack>
        </Card>
      )}

      <Button component={RouterLink} to={paths.dashboard.masterOrderForQDSheet} sx={{ mt: 2 }}>
        Back to Master Order For QD Sheet
      </Button>
    </Container>
  );
}
