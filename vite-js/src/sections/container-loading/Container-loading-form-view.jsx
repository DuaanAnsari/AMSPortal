import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Checkbox,
  ListItemText,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Stack,
  CircularProgress,
  Alert,
  Container,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import { paths } from 'src/routes/paths';
import axiosInstance from 'src/utils/axios';

// ----------------------------------------------------------------------

// Mock Dropdown Options according to legacy AMS system
const MOCK_MERCHANDISERS = [
  { id: '1', name: 'Owais Khan' },
  { id: '2', name: 'Kashif Ali' },
  { id: '3', name: 'Zeeshan Ahmed' },
  { id: '4', name: 'Farhan Siddiqui' },
  { id: '5', name: 'Muhammad Tariq' },
];

const MOCK_SUPPLIERS = [
  { id: '101', name: 'Artistic Milliners (Pvt) Ltd' },
  { id: '102', name: 'Crescent Bahuman Limited' },
  { id: '103', name: 'US Apparel & Textiles' },
  { id: '104', name: 'Interloop Limited' },
  { id: '105', name: 'Naveena Denim Mills' },
];

const MOCK_PO_LIST = [
  { id: '201', poNo: 'PO-2024-9871' },
  { id: '202', poNo: 'PO-2024-9872' },
  { id: '203', poNo: 'PO-2024-9760' },
  { id: '204', poNo: 'PO-2024-9655' },
  { id: '205', poNo: 'PO-2024-9658' },
  { id: '206', poNo: 'PO-2024-9540' },
  { id: '207', poNo: 'PO-2024-9430' },
];

const INITIAL_FORM = {
  containerNo: '',
  loadingDate: new Date().toISOString().split('T')[0],
  merchandiserIds: [],
  supplierIds: [],
  poIds: [],
  bookingNo: '',
  planQtyLoad: '',
  cbm: '',
  loadingDestination: '',
};

// ----------------------------------------------------------------------

// In-memory cache to prevent repeated API calls
let cachedPoOptions = null;
let poFetchPromise = null;
let cachedSupplierOptions = null;
let supplierFetchPromise = null;

const PO_PAGE_SIZE = 40;
const SUPPLIER_PAGE_SIZE = 40;

export default function ContainerLoadingFormView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  // Detect Edit Mode: from URL query param ?lContainerLoadingID=... or state
  const editId = useMemo(() => {
    const qId = searchParams.get('lContainerLoadingID') || searchParams.get('id');
    if (qId && String(qId).trim() !== '' && qId !== '0') return String(qId).trim();
    if (location.state?.editId) return String(location.state.editId).trim();
    return '';
  }, [searchParams, location.state]);

  const isEditMode = Boolean(editId);

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Dropdown options state
  const [merchandiserOptions, setMerchandiserOptions] = useState(MOCK_MERCHANDISERS);
  const [supplierOptions, setSupplierOptions] = useState(() => (Array.isArray(cachedSupplierOptions) && cachedSupplierOptions.length > 0 ? cachedSupplierOptions : MOCK_SUPPLIERS));
  const [poOptions, setPoOptions] = useState(() => (Array.isArray(cachedPoOptions) && cachedPoOptions.length > 0 ? cachedPoOptions : MOCK_PO_LIST));
  const [supplierDisplayLimit, setSupplierDisplayLimit] = useState(SUPPLIER_PAGE_SIZE);
  const [poDisplayLimit, setPoDisplayLimit] = useState(PO_PAGE_SIZE);

  // Fetch dropdown lookup options from existing APIs
  useEffect(() => {
    let active = true;

    const loadDropdownData = async () => {
      // 1. Merchandisers
      try {
        const res = await axiosInstance.get('/api/MyOrders/GetMerchants');
        const raw = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.Data || res.data?.result || res.data?.Result || [];
        if (Array.isArray(raw) && raw.length > 0 && active) {
          const mapped = raw
            .map((item) => ({
              id: String(item.userId ?? item.userID ?? item.UserId ?? item.id ?? item.ID ?? item.MarchandID ?? ''),
              name: String(item.userName ?? item.UserName ?? item.name ?? item.Marchand ?? ''),
            }))
            .filter((item) => item.id && item.name);
          if (mapped.length > 0) setMerchandiserOptions(mapped);
        }
      } catch (err) {
        console.error('Failed to load merchandisers lookup:', err);
      }

      // 2. Suppliers (Use cached options or single promise to avoid repeated API calls)
      if (Array.isArray(cachedSupplierOptions) && cachedSupplierOptions.length > 0) {
        if (active) setSupplierOptions(cachedSupplierOptions);
      } else {
        try {
          if (!supplierFetchPromise) {
            supplierFetchPromise = (async () => {
              const res = await axiosInstance.get('/api/MyOrders/GetSupplier');
              const raw = Array.isArray(res.data)
                ? res.data
                : res.data?.data || res.data?.Data || res.data?.result || res.data?.Result || [];

              const mapped = (Array.isArray(raw) ? raw : [])
                .map((item) => ({
                  id: String(item.venderLibraryID ?? item.venderLibraryId ?? item.VenderLibraryID ?? item.supplierId ?? item.id ?? ''),
                  name: String(item.venderName ?? item.VenderName ?? item.supplierName ?? item.name ?? ''),
                }))
                .filter((item) => item.id && item.name);

              cachedSupplierOptions = mapped;
              return mapped;
            })().catch((err) => {
              supplierFetchPromise = null;
              throw err;
            });
          }

          const options = await supplierFetchPromise;
          if (Array.isArray(options) && options.length > 0 && active) {
            setSupplierOptions(options);
          }
        } catch (err) {
          console.error('Failed to load suppliers lookup:', err);
        }
      }

      // 3. POs (Use cached options or single promise to avoid repeated API calls)
      if (Array.isArray(cachedPoOptions) && cachedPoOptions.length > 0) {
        if (active) setPoOptions(cachedPoOptions);
      } else {
        try {
          if (!poFetchPromise) {
            poFetchPromise = (async () => {
              let raw = [];
              try {
                const res = await axiosInstance.get('/api/Container/Getpono');
                raw = Array.isArray(res.data)
                  ? res.data
                  : res.data?.data || res.data?.Data || res.data?.result || res.data?.Result || [];
              } catch (cErr) {
                const resFallback = await axiosInstance.get('/api/MyOrders/Getpono');
                raw = Array.isArray(resFallback.data)
                  ? resFallback.data
                  : resFallback.data?.data || resFallback.data?.Data || resFallback.data?.result || resFallback.data?.Result || [];
              }

              const mapped = (Array.isArray(raw) ? raw : [])
                .map((item) => ({
                  id: String(item.POID ?? item.poid ?? item.poId ?? item.id ?? item.value ?? ''),
                  poNo: String(item.PONO ?? item.pono ?? item.poNo ?? item.label ?? ''),
                }))
                .filter((item) => item.id && item.poNo);

              cachedPoOptions = mapped;
              return mapped;
            })().catch((err) => {
              poFetchPromise = null;
              throw err;
            });
          }

          const options = await poFetchPromise;
          if (Array.isArray(options) && options.length > 0 && active) {
            setPoOptions(options);
          }
        } catch (err) {
          console.error('Failed to load POs lookup:', err);
        }
      }
    };

    loadDropdownData();

    return () => {
      active = false;
    };
  }, []);

  // Auto-generate or load form values
  useEffect(() => {
    let isCancelled = false;

    if (isEditMode) {
      setLoading(true);
      const fetchEditData = async () => {
        try {
          const res = await axiosInstance.get(`/api/Container/GetContainerLoadingById/0`, {
            params: { containerLoadingID: editId },
          });

          const data = res?.data ?? res;
          // Handle response variations (direct object, { data: {...} }, or array)
          const record = Array.isArray(data) ? data[0] : (data?.data || data?.Data || data?.result || data?.Result || data);

          if (record && !isCancelled) {
            // Helper to extract IDs array from various backend response formats (array, comma-separated string, or nested tables)
            const parseIds = (rawVal, fallbackKey1, fallbackKey2) => {
              const val = rawVal ?? record[fallbackKey1] ?? record[fallbackKey2];
              if (Array.isArray(val)) {
                return val.map((v) => {
                  if (v && typeof v === 'object') {
                    return String(v.id ?? v.ID ?? v.MarchandID ?? v.marchandID ?? v.SupplierID ?? v.supplierID ?? v.POID ?? v.poID ?? v.poId ?? Object.values(v)[0] ?? '');
                  }
                  return String(v);
                }).filter(Boolean);
              }
              if (typeof val === 'string' && val.trim()) {
                return val.split(',').map((s) => s.trim()).filter(Boolean);
              }
              if (typeof val === 'number') {
                return [String(val)];
              }
              return [];
            };

            const loadedMerchIds = parseIds(record.merchandiserIds, 'merchandisers', 'tblMarchandAssContainerLoading');
            const loadedSuppIds = parseIds(record.supplierIds, 'suppliers', 'tblSupplierAssContainerLoading');
            const loadedPoIds = parseIds(record.poIds, 'pos', 'tblPOAssContainerLoading');

            // Date format normalization YYYY-MM-DD
            let formattedDate = '';
            const rawDate = record.loadingDate || record.LoadingDate;
            if (rawDate) {
              formattedDate = String(rawDate).split('T')[0];
            } else {
              formattedDate = new Date().toISOString().split('T')[0];
            }

            setForm({
              containerNo: record.autoNo || record.AutoNo || record.containerNo || `CTN-${String(editId).padStart(4, '0')}`,
              loadingDate: formattedDate,
              merchandiserIds: loadedMerchIds.length > 0 ? loadedMerchIds : (record.marchandID ? [String(record.marchandID)] : []),
              supplierIds: loadedSuppIds.length > 0 ? loadedSuppIds : (record.supplierID ? [String(record.supplierID)] : []),
              poIds: loadedPoIds.length > 0 ? loadedPoIds : (record.poid || record.POID ? [String(record.poid || record.POID)] : []),
              bookingNo: record.bookingNo || record.BookingNo || '',
              planQtyLoad: record.planQtyLoad != null ? String(record.planQtyLoad) : (record.PlanQtyLoad != null ? String(record.PlanQtyLoad) : ''),
              cbm: record.cbm != null ? String(record.cbm) : (record.CBM != null ? String(record.CBM) : ''),
              loadingDestination: record.loadingDestination || record.LoadingDestination || '',
            });
            return;
          }
        } catch (apiErr) {
          console.warn('GetContainerLoadingById API failed, falling back to local/cached data:', apiErr);
        }

        if (isCancelled) return;

        // Fallback to localStorage or route state if offline or API returned empty
        const stored = localStorage.getItem('mock_container_loading_records');
        let records = [];
        if (stored) {
          try {
            records = JSON.parse(stored) || [];
          } catch (e) {
            console.error(e);
          }
        }

        const match =
          records.find((r) => String(r.containerLoadingId) === String(editId)) ||
          location.state?.rowData;

        if (match) {
          const foundMerch = merchandiserOptions.filter((m) =>
            String(match.merchandiser || match.UserName || '').includes(m.name)
          ).map((m) => m.id);

          const foundSuppliers = supplierOptions.filter((s) =>
            String(match.supplier || match.VenderName || '').includes(s.name)
          ).map((s) => s.id);

          const foundPOs = poOptions.filter((p) =>
            String(match.poNo || match.PONO || '').includes(p.poNo)
          ).map((p) => p.id);

          setForm({
            containerNo: match.containerNo || match.AutoNo || `CTN-${String(editId).padStart(4, '0')}`,
            loadingDate: match.loadingDate || match.LoadingDate || new Date().toISOString().split('T')[0],
            merchandiserIds: foundMerch.length > 0 ? foundMerch : ['1'],
            supplierIds: foundSuppliers.length > 0 ? foundSuppliers : ['101'],
            poIds: foundPOs.length > 0 ? foundPOs : ['201'],
            bookingNo: match.bookingNo || match.BookingNo || '',
            planQtyLoad: match.planQtyLoad || match.PlanQtyLoad || '',
            cbm: match.cbm || match.CBM || '',
            loadingDestination: match.loadingDestination || match.LoadingDestination || '',
          });
        } else {
          setForm({
            containerNo: `CTN-${String(editId).padStart(4, '0')}`,
            loadingDate: '2024-03-15',
            merchandiserIds: ['1'],
            supplierIds: ['101'],
            poIds: ['201', '202'],
            bookingNo: 'BKG-78601',
            planQtyLoad: '12500',
            cbm: '68.5',
            loadingDestination: 'Port of Hamburg, Germany',
          });
        }
      };

      fetchEditData().catch((err) => {
        setError('Failed to load container loading details for edit.');
      }).finally(() => {
        if (!isCancelled) setLoading(false);
      });
    } else {
      // New Mode: Fetch autoNo from GET /api/Container/GetNewContainerNo
      const fetchNewContainerNo = async () => {
        try {
          const res = await axiosInstance.get('/api/Container/GetNewContainerNo');
          const data = res?.data ?? res;
          const autoNo =
            (typeof data === 'string' && data) ||
            data?.autoNo ||
            data?.AutoNo ||
            data?.containerNo ||
            data?.ContainerNo ||
            data?.data?.autoNo ||
            data?.data?.AutoNo ||
            '';

          if (autoNo && !isCancelled) {
            setForm((prev) => ({
              ...prev,
              containerNo: autoNo,
              loadingDate: new Date().toISOString().split('T')[0],
            }));
            return;
          }
        } catch (apiErr) {
          console.warn('GetNewContainerNo API unavailable, falling back to local sequence:', apiErr);
        }

        // Fallback sequence if API unavailable
        if (!isCancelled) {
          const stored = localStorage.getItem('mock_container_loading_records');
          let nextId = 46;
          if (stored) {
            try {
              const list = JSON.parse(stored);
              if (Array.isArray(list) && list.length > 0) {
                const maxId = Math.max(...list.map((item) => Number(item.containerLoadingId) || 0));
                if (maxId >= nextId) nextId = maxId + 1;
              }
            } catch (e) {
              console.error(e);
            }
          }

          setForm((prev) => ({
            ...prev,
            containerNo: `CTN-${String(nextId).padStart(4, '0')}`,
            loadingDate: new Date().toISOString().split('T')[0],
          }));
        }
      };

      fetchNewContainerNo();
    }

    return () => {
      isCancelled = true;
    };
  }, [editId, isEditMode, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (name) => (event) => {
    const {
      target: { value },
    } = event;
    setForm((prev) => ({
      ...prev,
      [name]: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  // Infinite scroll handler for Supplier dropdown to prevent rendering all items at once
  const handleSupplierDropdownScroll = useCallback((event) => {
    const listboxNode = event.currentTarget;
    if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 50) {
      setSupplierDisplayLimit((prev) => Math.min(prev + SUPPLIER_PAGE_SIZE, supplierOptions.length));
    }
  }, [supplierOptions.length]);

  // Combine already selected Suppliers + sliced Supplier options so selected items always stay visible
  const visibleSupplierOptions = useMemo(() => {
    if (supplierOptions.length <= supplierDisplayLimit) return supplierOptions;

    const displayed = supplierOptions.slice(0, supplierDisplayLimit);
    const displayedIds = new Set(displayed.map((s) => s.id));

    // Ensure selected Suppliers are also included if they fall outside the current display slice
    const selectedExtra = supplierOptions.filter(
      (s) => form.supplierIds.includes(s.id) && !displayedIds.has(s.id)
    );

    return [...selectedExtra, ...displayed];
  }, [supplierOptions, supplierDisplayLimit, form.supplierIds]);

  // Infinite scroll handler for PO dropdown to prevent rendering thousands of items at once
  const handlePoDropdownScroll = useCallback((event) => {
    const listboxNode = event.currentTarget;
    if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 50) {
      setPoDisplayLimit((prev) => Math.min(prev + PO_PAGE_SIZE, poOptions.length));
    }
  }, [poOptions.length]);

  // Combine already selected POs + sliced PO options so selected items always stay visible
  const visiblePoOptions = useMemo(() => {
    if (poOptions.length <= poDisplayLimit) return poOptions;

    const displayed = poOptions.slice(0, poDisplayLimit);
    const displayedIds = new Set(displayed.map((p) => p.id));

    // Ensure selected POs are also included if they fall outside the current display slice
    const selectedExtra = poOptions.filter(
      (p) => form.poIds.includes(p.id) && !displayedIds.has(p.id)
    );

    return [...selectedExtra, ...displayed];
  }, [poOptions, poDisplayLimit, form.poIds]);

  const handleBack = () => {
    navigate(paths.dashboard.newContainerLoading);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validation matching legacy ASP.NET backend validation
    if (!form.containerNo) {
      enqueueSnackbar('Container Loading # cannot be empty', { variant: 'error' });
      return;
    }
    if (!form.loadingDate) {
      enqueueSnackbar('Loading Date cannot be empty', { variant: 'error' });
      return;
    }
    if (!form.merchandiserIds || form.merchandiserIds.length === 0) {
      enqueueSnackbar('Please select at least one Merchandiser', { variant: 'error' });
      return;
    }
    if (!form.supplierIds || form.supplierIds.length === 0) {
      enqueueSnackbar('Please select at least one Supplier', { variant: 'error' });
      return;
    }
    if (!form.poIds || form.poIds.length === 0) {
      enqueueSnackbar('PO # cannot be empty. Please select at least one PO', { variant: 'error' });
      return;
    }
    if (!form.bookingNo) {
      enqueueSnackbar('Booking No cannot be empty', { variant: 'error' });
      return;
    }
    if (!form.planQtyLoad) {
      enqueueSnackbar('Plan Quantity Load cannot be empty', { variant: 'error' });
      return;
    }
    if (!form.cbm) {
      enqueueSnackbar('CBM cannot be empty', { variant: 'error' });
      return;
    }
    if (!form.loadingDestination) {
      enqueueSnackbar('Load Destination cannot be empty', { variant: 'error' });
      return;
    }

    setSaving(true);

    try {
      // Build request payload according to requirements
      const storedUserId = localStorage.getItem('userId') || localStorage.getItem('UserId');
      const payload = {
        containerLoadingID: isEditMode ? Number(editId) || 0 : 0,
        autoNo: form.containerNo || '',
        loadingDate: form.loadingDate || '',
        bookingNo: form.bookingNo || '',
        planQtyLoad: Number(String(form.planQtyLoad || '').replace(/,/g, '')) || 0,
        cbm: Number(form.cbm) || 0,
        loadingDestination: form.loadingDestination || '',
        userID: Number(storedUserId) || 1,
        merchandiserIds: Array.isArray(form.merchandiserIds) ? form.merchandiserIds : [],
        supplierIds: Array.isArray(form.supplierIds) ? form.supplierIds : [],
        poIds: Array.isArray(form.poIds) ? form.poIds : [],
      };

      // Call API via configured axiosInstance
      await axiosInstance.post('/api/Container/SaveContainerLoading', payload);

      // Derive labels for local storage cache / offline fallback
      const selMerchNames = merchandiserOptions
        .filter((m) => form.merchandiserIds.includes(m.id))
        .map((m) => m.name)
        .join(', ');
      const selSuppNames = supplierOptions
        .filter((s) => form.supplierIds.includes(s.id))
        .map((s) => s.name)
        .join(', ');
      const selPoNumbers = poOptions
        .filter((p) => form.poIds.includes(p.id))
        .map((p) => p.poNo)
        .join(', ');

      const recordId = isEditMode ? editId : String(Date.now().toString().slice(-4));

      const newRecord = {
        containerLoadingId: recordId,
        containerNo: form.containerNo,
        loadingDate: form.loadingDate,
        merchandiser: selMerchNames,
        supplier: selSuppNames,
        poNo: selPoNumbers,
        bookingNo: form.bookingNo,
        planQtyLoad: form.planQtyLoad,
        cbm: form.cbm,
        loadingDestination: form.loadingDestination,
      };

      const stored = localStorage.getItem('mock_container_loading_records');
      let currentRecords = [];
      if (stored) {
        try {
          currentRecords = JSON.parse(stored) || [];
        } catch (err) {
          console.error(err);
        }
      }

      if (isEditMode) {
        const index = currentRecords.findIndex((r) => String(r.containerLoadingId) === String(editId));
        if (index >= 0) {
          currentRecords[index] = newRecord;
        } else {
          currentRecords.unshift(newRecord);
        }
      } else {
        currentRecords.unshift(newRecord);
      }

      localStorage.setItem('mock_container_loading_records', JSON.stringify(currentRecords));

      enqueueSnackbar(
        isEditMode ? 'Container loading updated successfully' : 'Container loading created successfully',
        { variant: 'success' }
      );

      navigate(paths.dashboard.newContainerLoading, { state: { refresh: true } });
    } catch (err) {
      console.error('Error saving container loading:', err);
      const errorMsg =
        (typeof err?.response?.data === 'string' && err.response.data) ||
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message ||
        'Failed to save container loading';

      enqueueSnackbar(typeof errorMsg === 'string' ? errorMsg : 'Failed to save container loading', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading={isEditMode ? `Edit Container Loading: ${form.containerNo || editId}` : 'Create Container Loading'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'New Container Loading', href: paths.dashboard.newContainerLoading },
          { name: isEditMode ? 'Edit' : 'Create' },
        ]}
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 1.5, position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              opacity: 0.8,
              zIndex: 2,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <CardHeader
          title={isEditMode ? 'Container Loading Details (Edit Mode)' : 'Container Loading Details'}
          sx={{ pb: 1 }}
        />
        <Divider />

        <CardContent sx={{ pt: 3 }}>
          <form onSubmit={handleSave}>
            <Grid container spacing={3}>
              {/* Row 1: Container Loading #, Loading Date, Merchandiser */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Container Loading #"
                  name="containerNo"
                  value={form.containerNo}
                  onChange={handleChange}
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Autogenerated reference number"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Loading Date"
                  name="loadingDate"
                  value={form.loadingDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth required>
                  <InputLabel id="merchandiser-multi-label">Merchandiser</InputLabel>
                  <Select
                    labelId="merchandiser-multi-label"
                    multiple
                    name="merchandiserIds"
                    value={form.merchandiserIds}
                    onChange={handleMultiSelectChange('merchandiserIds')}
                    input={<OutlinedInput label="Merchandiser" />}
                    renderValue={(selected) =>
                      merchandiserOptions
                        .filter((m) => selected.includes(m.id))
                        .map((m) => m.name)
                        .join(', ')
                    }
                  >
                    {merchandiserOptions.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        <Checkbox checked={form.merchandiserIds.indexOf(m.id) > -1} />
                        <ListItemText primary={m.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Row 2: Supplier, PO #, Booking No. */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth required>
                  <InputLabel id="supplier-multi-label">Supplier</InputLabel>
                  <Select
                    labelId="supplier-multi-label"
                    multiple
                    name="supplierIds"
                    value={form.supplierIds}
                    onChange={handleMultiSelectChange('supplierIds')}
                    input={<OutlinedInput label="Supplier" />}
                    renderValue={(selected) =>
                      supplierOptions
                        .filter((s) => selected.includes(s.id))
                        .map((s) => s.name)
                        .join(', ')
                    }
                    MenuProps={{
                      PaperProps: {
                        onScroll: handleSupplierDropdownScroll,
                        sx: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {visibleSupplierOptions.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        <Checkbox checked={form.supplierIds.indexOf(s.id) > -1} />
                        <ListItemText primary={s.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth required>
                  <InputLabel id="po-multi-label">PO #</InputLabel>
                  <Select
                    labelId="po-multi-label"
                    multiple
                    name="poIds"
                    value={form.poIds}
                    onChange={handleMultiSelectChange('poIds')}
                    input={<OutlinedInput label="PO #" />}
                    renderValue={(selected) => {
                      if (!selected || selected.length === 0) return 'Select PO(s)';
                      return `${selected.length} PO Selected`;
                    }}
                    MenuProps={{
                      PaperProps: {
                        onScroll: handlePoDropdownScroll,
                        sx: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {visiblePoOptions.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        <Checkbox checked={form.poIds.indexOf(p.id) > -1} />
                        <ListItemText primary={p.poNo} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Booking No."
                  name="bookingNo"
                  value={form.bookingNo}
                  onChange={handleChange}
                  placeholder="Enter Booking No."
                  required
                />
              </Grid>

              {/* Row 3: Plan Quantity Load, CBM */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Plan Quantity Load"
                  name="planQtyLoad"
                  value={form.planQtyLoad}
                  onChange={handleChange}
                  placeholder="e.g. 12500"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6} md={8}>
                <TextField
                  fullWidth
                  multiline
                  rows={1}
                  label="CBM"
                  name="cbm"
                  value={form.cbm}
                  onChange={handleChange}
                  placeholder="Enter CBM details"
                  required
                />
              </Grid>

              {/* Row 4: Load destination */}
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  fullWidth
                  label="Load Destination"
                  name="loadingDestination"
                  value={form.loadingDestination}
                  onChange={handleChange}
                  placeholder="Enter Destination (e.g. Port of Hamburg)"
                  required
                />
              </Grid>

              {/* Action Buttons Row matching AMS Save / Cancel */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1.5 }} />
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<CloseIcon />}
                    onClick={handleBack}
                    sx={{ textTransform: 'none', px: 3, minWidth: 110 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    disabled={saving}
                    sx={{ textTransform: 'none', px: 3.5, minWidth: 120 }}
                  >
                    {isEditMode ? 'Update' : 'Save'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
