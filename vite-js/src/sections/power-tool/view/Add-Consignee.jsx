import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { qdApi } from 'src/sections/Supply-Chain/utils/qd-api';

// ----------------------------------------------------------------------

function pick(rec, ...keys) {
  if (!rec || typeof rec !== 'object') return '';
  for (const k of keys) {
    const v = rec[k];
    if (v != null && v !== '') return v;
  }
  return '';
}

/** Unwrap typical API envelopes for edit payload. */
function unwrapConsigneeEditEnvelope(data) {
  let root = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  if (root && typeof root === 'object' && root.consignee != null) root = root.consignee;
  return root && typeof root === 'object' ? root : {};
}

function mapEditResponseToForm(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    packageName: String(pick(r, 'packageName', 'PackageName') || ''),
    consigneeName: String(pick(r, 'consigneeName', 'ConsigneeName') || ''),
    address: String(pick(r, 'address', 'Address') || ''),
    cityCountry: String(
      pick(
        r,
        'cityCountry',
        'CityCountry',
        'cityAndCountry',
        'CityAndCountry',
        'city',
        'City',
        'country',
        'Country'
      ) || ''
    ),
    phone: String(pick(r, 'phone', 'Phone') || ''),
    postZipCode: String(pick(r, 'postZipCode', 'PostZipCode', 'zip', 'Zip', 'postalCode', 'PostalCode') || ''),
  };
}

function apiErrorMessage(error, fallback) {
  if (error?.code === 'ECONNABORTED' || String(error?.message || '').toLowerCase().includes('timeout')) {
    return 'Request timed out. Check your API URL and network.';
  }
  const msg =
    (typeof error?.response?.data === 'string' && error.response.data) ||
    error?.response?.data?.message ||
    error?.response?.data?.Message ||
    error?.message ||
    fallback;
  return typeof msg === 'string' ? msg : fallback;
}

const EMPTY_FORM = {
  packageName: '',
  consigneeName: '',
  cityCountry: '',
  phone: '',
  postZipCode: '',
  address: '',
};

function buildSavePayload(form, existingConsigneeId) {
  const payload = {
    packageName: form.packageName ?? '',
    consigneeName: form.consigneeName ?? '',
    address: form.address ?? '',
    cityCountry: form.cityCountry ?? '',
    phone: form.phone ?? '',
    postZipCode: form.postZipCode ?? '',
  };
  const id = existingConsigneeId != null ? String(existingConsigneeId).trim() : '';
  if (!id || id === '0') {
    payload.consigneeID = 0;
  } else {
    const num = Number(id);
    payload.consigneeID = Number.isNaN(num) ? id : num;
  }
  return payload;
}

function successMessageFromSaveResponse(data) {
  const root = data && typeof data === 'object' ? data.data ?? data.Data ?? data : data;
  const r = root && typeof root === 'object' ? root : {};
  const msg =
    (typeof r.message === 'string' && r.message) ||
    (typeof r.Message === 'string' && r.Message) ||
    (typeof data?.message === 'string' && data.message);
  if (msg) return msg;
  return 'Consignee saved successfully.';
}

function savedIdFromResponse(data) {
  const root = data && typeof data === 'object' ? data.data ?? data.Data ?? data : data;
  const r = root && typeof root === 'object' ? root : {};
  const id = pick(r, 'consigneeID', 'ConsigneeID', 'consigneeId', 'id', 'Id');
  return id != null && String(id).trim() !== '' ? String(id).trim() : '';
}

// ----------------------------------------------------------------------

export default function AddConsigneePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const editConsigneeId = useMemo(() => {
    const fromState = location.state?.editConsigneeId;
    const raw =
      fromState != null && String(fromState).trim() !== ''
        ? String(fromState).trim()
        : new URLSearchParams(location.search).get('consigneeId') || '';
    if (!raw) return '';
    const n = Number(raw);
    if (!Number.isNaN(n) && n === 0) return '';
    return raw;
  }, [location.state, location.search]);

  const isEditMode = Boolean(editConsigneeId);

  const [form, setForm] = useState(() => ({ ...EMPTY_FORM }));

  const [loadError, setLoadError] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editConsigneeId) {
      setLoadError(null);
      setLoadingEdit(false);
      return;
    }

    let aborted = false;

    const run = async () => {
      setLoadingEdit(true);
      setLoadError(null);
      try {
        const data = await qdApi.getConsigneeForEdit(editConsigneeId);
        if (aborted) return;
        const raw = unwrapConsigneeEditEnvelope(data);
        setForm(mapEditResponseToForm(raw));
      } catch (e) {
        if (aborted) return;
        const msg = apiErrorMessage(e, 'Failed to load consignee for edit');
        setLoadError(msg);
        enqueueSnackbar(msg, { variant: 'error' });
      } finally {
        if (!aborted) setLoadingEdit(false);
      }
    };

    run();
    return () => {
      aborted = true;
    };
  }, [editConsigneeId, enqueueSnackbar]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveConsignee = useCallback(async () => {
    setSaving(true);
    try {
      const payload = buildSavePayload(form, editConsigneeId);
      const data = await qdApi.saveConsignee(payload);
      const msg = successMessageFromSaveResponse(data);
      enqueueSnackbar(msg, { variant: 'success' });
      const savedId = savedIdFromResponse(data);

      setForm({ ...EMPTY_FORM });
      setLoadError(null);

      navigate(paths.dashboard.powerTool.consigneeView, {
        state: {
          refreshConsigneeList: true,
          ...(savedId ? { savedConsigneeId: savedId } : {}),
        },
      });
    } catch (e) {
      const msg = apiErrorMessage(e, editConsigneeId ? 'Failed to update consignee' : 'Failed to save consignee');
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [form, editConsigneeId, enqueueSnackbar, navigate]);

  const handlePrimary = () => {
    handleSaveConsignee();
  };

  const handleCancel = () => {
    navigate(paths.dashboard.powerTool.consigneeView);
  };

  const formDisabled = loadingEdit || Boolean(loadError && isEditMode);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading={isEditMode ? 'Edit Consignee' : 'Add Consignee'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Power Tools', href: paths.dashboard.powerTool.root },
          { name: 'Consignee', href: paths.dashboard.powerTool.consigneeView },
          { name: isEditMode ? 'Edit' : 'Add' },
        ]}
        sx={{ mb: 3 }}
      />

      <Card
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 1000,
          mx: 'auto',
          borderRadius: 1,
          p: { xs: 2, sm: 3 },
          position: 'relative',
          boxShadow: 'none',
        }}
      >
        {loadingEdit && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (t) => alpha(t.palette.background.paper, 0.85),
              zIndex: 3,
              borderRadius: 1,
            }}
          >
            <CircularProgress size={44} />
          </Box>
        )}

        {loadError && isEditMode && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError(null)}>
            {loadError}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Package Name:
            </Typography>
            <TextField
              fullWidth
              name="packageName"
              value={form.packageName}
              onChange={handleChange}
              size="small"
              disabled={formDisabled}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Consignee Name:
            </Typography>
            <TextField
              fullWidth
              name="consigneeName"
              value={form.consigneeName}
              onChange={handleChange}
              size="small"
              disabled={formDisabled}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              City / Country:
            </Typography>
            <TextField
              fullWidth
              name="cityCountry"
              value={form.cityCountry}
              onChange={handleChange}
              size="small"
              disabled={formDisabled}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Phone #:
            </Typography>
            <TextField
              fullWidth
              name="phone"
              value={form.phone}
              onChange={handleChange}
              size="small"
              disabled={formDisabled}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Post / Zip Code:
            </Typography>
            <TextField
              fullWidth
              name="postZipCode"
              value={form.postZipCode}
              onChange={handleChange}
              size="small"
              disabled={formDisabled}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Address:
            </Typography>
            <TextField
              fullWidth
              name="address"
              value={form.address}
              onChange={handleChange}
              size="small"
              multiline
              minRows={2}
              disabled={formDisabled}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            gap: 2,
            mt: 4,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            sx={{ minWidth: 160, textTransform: 'none' }}
            onClick={handlePrimary}
            disabled={loadingEdit || saving || (isEditMode && Boolean(loadError))}
          >
            {saving ? (
              <CircularProgress size={22} color="inherit" />
            ) : isEditMode ? (
              'Update'
            ) : (
              'Save'
            )}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ minWidth: 160, textTransform: 'none' }}
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
        </Box>
      </Card>
    </Container>
  );
}
