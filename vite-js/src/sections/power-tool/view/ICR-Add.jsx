import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Container,
  Autocomplete,
  Stack,
  CircularProgress,
} from '@mui/material';
import axios from 'src/utils/axios';
import { paths } from 'src/routes/paths';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------
// Constants (Exact match with Old AMS ICRSupplierEntryBySupplier.aspx)
// ----------------------------------------------------------------------
const TASK_NATURE_OPTIONS = [
  { label: 'IPC', value: 'IPC' },
  { label: 'MPC', value: 'MPC' },
  { label: 'Pre-Final', value: 'Pre-Final' },
  { label: 'Final', value: 'Final' },
];

const INITIAL_FORM_STATE = {
  icrDetailID: 0,
  supplierId: '',
  supplierName: '',
  customerId: '',
  customerName: '',
  poId: '',
  poNo: '',
  styleNo: '',
  orderQty: '',
  offerQty: '',
  color: '',
  actualShipDate: '',
  offerDate: '',
  planDate: '',
  taskNature: 'Final',
  remarks: '',
  qamRemarks: '',
};

const toDateInput = (value) => {
  if (value == null || value === '') return '';
  const s = String(value);
  if (s.startsWith('1990-01-01')) return '';
  return s.split('T')[0];
};

const pick = (...values) => {
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] !== undefined && values[i] !== null) return values[i];
  }
  return '';
};

// Backend list responses may be wrapped as data / Data / result / Result or a raw array.
const unwrap = (data) => data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;

// ----------------------------------------------------------------------

export default function ICRAddPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Old AMS stores Session("SupplierId") = UMUser.EmployeeId at login; > 0 means supplier.
  const currentSupplierId = useMemo(() => {
    const raw =
      localStorage.getItem('employeeId') ||
      localStorage.getItem('supplierId') ||
      localStorage.getItem('SupplierId') ||
      localStorage.getItem('supplierID');
    return raw ? Number(raw) : 0;
  }, []);

  const isSupplier = currentSupplierId > 0;

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [poList, setPoList] = useState([]);
  const [styleList, setStyleList] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [poLoading, setPoLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add is a supplier-only flow (Old AMS: btnAddICR visible only when VenderIDd > 0).
  useEffect(() => {
    if (!isSupplier) {
      enqueueSnackbar('You do not have permission to add ICR records.', { variant: 'error' });
      navigate(paths.dashboard.powerTool.icrForm, { replace: true });
    }
  }, [isSupplier, enqueueSnackbar, navigate]);

  // ----------------------------------------------------------------------
  // 1. Suppliers: GET /api/ICRSupplier/GetSuppliers?supplierID=0
  //    For supplier login, lock dropdown to the logged-in supplier (EmployeeId == VenderLibraryID).
  // ----------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const fetchSuppliers = async () => {
      setDropdownLoading(true);
      try {
        const res = await axios.get('/api/ICRSupplier/GetSuppliers', {
          params: { supplierID: 0 },
        });
        const raw = unwrap(res.data);
        const list = (Array.isArray(raw) ? raw : []).map((s) => ({
          id: pick(s.venderLibraryID, s.VenderLibraryID, s.supplierID, s.SupplierID, s.id),
          name: pick(s.venderName, s.VenderName, s.supplierName, s.SupplierName, s.name, ''),
        }));

        if (mounted) {
          if (isSupplier) {
            const own = list.find((s) => Number(s.id) === currentSupplierId);
            if (own) {
              setSuppliers([own]);
              setFormData((prev) => ({ ...prev, supplierId: own.id, supplierName: own.name }));
            } else {
              setSuppliers([{ id: currentSupplierId, name: `Supplier #${currentSupplierId}` }]);
              setFormData((prev) => ({
                ...prev,
                supplierId: currentSupplierId,
                supplierName: `Supplier #${currentSupplierId}`,
              }));
            }
          } else {
            setSuppliers(list);
          }
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        if (mounted && isSupplier) {
          setSuppliers([{ id: currentSupplierId, name: `Supplier #${currentSupplierId}` }]);
          setFormData((prev) => ({
            ...prev,
            supplierId: currentSupplierId,
            supplierName: `Supplier #${currentSupplierId}`,
          }));
        }
      } finally {
        if (mounted) setDropdownLoading(false);
      }
    };

    fetchSuppliers();
    return () => {
      mounted = false;
    };
  }, [isSupplier, currentSupplierId]);

  // ----------------------------------------------------------------------
  // 2. Customers: GET /api/ICRSupplier/GetCustomers?supplierID={supplierID}
  // ----------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const fetchCustomers = async () => {
      const selectedSupplierId = Number(formData.supplierId) || 0;
      if (!selectedSupplierId) {
        if (mounted) setCustomers([]);
        return;
      }

      setDropdownLoading(true);
      try {
        const res = await axios.get('/api/ICRSupplier/GetCustomers', {
          params: { supplierID: selectedSupplierId },
        });
        const raw = unwrap(res.data);
        const list = (Array.isArray(raw) ? raw : []).map((c) => ({
          id: pick(c.customerID, c.CustomerID, c.id),
          name: pick(c.customerName, c.CustomerName, c.name, ''),
        }));
        if (mounted) setCustomers(list);
      } catch (err) {
        console.error('Error fetching customers:', err);
        if (mounted) setCustomers([]);
      } finally {
        if (mounted) setDropdownLoading(false);
      }
    };

    fetchCustomers();
    return () => {
      mounted = false;
    };
  }, [formData.supplierId]);

  // ----------------------------------------------------------------------
  // 3. POs: GET /api/ICRSupplier/GetPOs?customerID={customerID}&supplierID={supplierID}
  // ----------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const fetchPOs = async () => {
      const selectedCustId = Number(formData.customerId) || 0;
      const selectedSupId = Number(formData.supplierId) || 0;

      if (!selectedCustId || !selectedSupId) {
        if (mounted) setPoList([]);
        return;
      }

      setDropdownLoading(true);
      try {
        const res = await axios.get('/api/ICRSupplier/GetPOs', {
          params: {
            customerID: selectedCustId,
            supplierID: selectedSupId,
          },
        });
        const raw = unwrap(res.data);
        const list = (Array.isArray(raw) ? raw : []).map((p) => ({
          id: pick(p.poid, p.POID, p.id),
          poNo: String(pick(p.pono, p.PONO, p.poNo, p.label, '') || ''),
          raw: p,
        }));
        if (mounted) setPoList(list);
      } catch (err) {
        console.error('Error fetching POs:', err);
        if (mounted) setPoList([]);
      } finally {
        if (mounted) setDropdownLoading(false);
      }
    };

    fetchPOs();
    return () => {
      mounted = false;
    };
  }, [formData.customerId, formData.supplierId]);

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------
  const handleSupplierChange = (id) => {
    const matched = suppliers.find((s) => String(s.id) === String(id));
    setFormData((prev) => ({
      ...prev,
      supplierId: id,
      supplierName: matched ? matched.name : '',
      customerId: '',
      customerName: '',
      poId: '',
      poNo: '',
      styleNo: '',
      orderQty: '',
      actualShipDate: '',
    }));
    setCustomers([]);
    setPoList([]);
    setStyleList([]);
  };

  const handleCustomerChange = (id) => {
    const matched = customers.find((c) => String(c.id) === String(id));
    setFormData((prev) => ({
      ...prev,
      customerId: id,
      customerName: matched ? matched.name : '',
      poId: '',
      poNo: '',
      styleNo: '',
      orderQty: '',
      actualShipDate: '',
    }));
    setPoList([]);
    setStyleList([]);
  };

  const handlePOChange = async (selectedPOObj) => {
    if (!selectedPOObj) {
      setFormData((prev) => ({
        ...prev,
        poId: '',
        poNo: '',
        styleNo: '',
        orderQty: '',
        actualShipDate: '',
      }));
      setStyleList([]);
      return;
    }

    const poid = selectedPOObj.id;
    setFormData((prev) => ({ ...prev, poId: poid, poNo: selectedPOObj.poNo }));

    setPoLoading(true);
    try {
      const res = await axios.get('/api/Milestone/GetStyle', { params: { poid } });
      const raw = unwrap(res.data);
      const styles = (Array.isArray(raw) ? raw : []).map((s) => ({
        styleNo: pick(s.styleNo, s.StyleNo),
        color: pick(s.colorway, s.Colorway, s.color, s.Color),
        poQty: pick(s.quantity, s.poQty, s.POQty),
        shipmentDate: pick(s.shipmentDate, s.ShipmentDate),
      }));
      setStyleList(styles);

      if (styles.length > 0) {
        const first = styles[0];
        setFormData((prev) => ({
          ...prev,
          styleNo: first.styleNo,
          color: first.color || prev.color,
          orderQty: first.poQty ? String(first.poQty) : prev.orderQty,
          actualShipDate: first.shipmentDate ? toDateInput(first.shipmentDate) : prev.actualShipDate,
        }));
      }
    } catch (err) {
      console.warn('Error loading styles for PO:', err);
      setStyleList([]);
    } finally {
      setPoLoading(false);
    }
  };

  const handleStyleChange = (styleNo) => {
    const matched = styleList.find((s) => s.styleNo === styleNo);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        styleNo,
        color: matched.color || prev.color,
        orderQty: matched.poQty ? String(matched.poQty) : prev.orderQty,
        actualShipDate: matched.shipmentDate ? toDateInput(matched.shipmentDate) : prev.actualShipDate,
      }));
    } else {
      setFormData((prev) => ({ ...prev, styleNo }));
    }
  };

  // ----------------------------------------------------------------------
  // Submit: POST /api/ICRSupplier/AddICR
  // ----------------------------------------------------------------------
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.poNo || !formData.poId) {
      enqueueSnackbar('Please select a valid PO #', { variant: 'warning' });
      return;
    }
    if (!formData.styleNo) {
      enqueueSnackbar('Style Number is required', { variant: 'warning' });
      return;
    }
    if (!formData.offerQty || Number(formData.offerQty) <= 0) {
      enqueueSnackbar('Please enter a valid Offer Quantity', { variant: 'warning' });
      return;
    }
    if (!formData.offerDate) {
      enqueueSnackbar('Offer Date is required', { variant: 'warning' });
      return;
    }

    // Old AMS Validation: "Inspection requests must be submitted minimum 3 days before."
    const selectedDate = new Date(formData.offerDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minAllowedDate = new Date(today);
    minAllowedDate.setDate(minAllowedDate.getDate() - 3);

    if (selectedDate < minAllowedDate) {
      enqueueSnackbar(
        `Offer date must be greater than or equal to ${minAllowedDate.toLocaleDateString()}. Minimum 3 days advance notice required.`,
        { variant: 'error' }
      );
      return;
    }

    setSaving(true);
    try {
      let actualDateIso;
      try {
        actualDateIso = new Date(formData.offerDate).toISOString();
      } catch {
        actualDateIso = new Date().toISOString();
      }

      const addPayload = {
        poid: Number(formData.poId) || 0,
        styleNo: String(formData.styleNo || '').trim(),
        color: String(formData.color || '').trim(),
        taskNature: String(formData.taskNature || 'Final').trim(),
        offerQty: Number(formData.offerQty) || 0,
        orderQty: Number(formData.orderQty) || 0,
        actualDate: actualDateIso,
        qamRemarks: String(formData.qamRemarks || '').trim(),
      };

      await axios.post('/api/ICRSupplier/AddICR', addPayload);

      enqueueSnackbar('Inspection Certificate Request submitted successfully!', {
        variant: 'success',
      });
      navigate(paths.dashboard.powerTool.icrForm);
    } catch (err) {
      console.error('Error saving ICR:', err);
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.response?.data?.message ||
            err?.response?.data?.Message ||
            err?.message ||
            'Failed to save ICR request. Please check inputs and retry.';
      enqueueSnackbar(errMsg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="Add ICR Request"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Power Tools', href: paths.dashboard.powerTool.root },
          { name: 'ICR Form', href: paths.dashboard.powerTool.icrForm },
          { name: 'Add ICR Request' },
        ]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={() => navigate(paths.dashboard.powerTool.icrForm)}
            sx={{ fontWeight: 600 }}
          >
            Back to List
          </Button>
        }
        sx={{ mb: 3 }}
      />

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Box component="form" onSubmit={handleSave} noValidate>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Iconify icon="solar:document-add-bold-duotone" width={22} />
              Online ICR Request Form
            </Typography>

            <Grid container spacing={3}>
              {/* Supplier Dropdown (locked for supplier login) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Supplier *"
                  value={formData.supplierId != null ? String(formData.supplierId) : ''}
                  onChange={(e) => {
                    const val = e?.target?.value ?? e;
                    handleSupplierChange(val);
                  }}
                  disabled={isSupplier}
                >
                  <MenuItem value="">
                    <em>-- Select Supplier --</em>
                  </MenuItem>
                  {formData.supplierId &&
                    !suppliers.some((s) => String(s?.id) === String(formData.supplierId)) && (
                      <MenuItem value={String(formData.supplierId)}>
                        {formData.supplierName || `Supplier #${formData.supplierId}`}
                      </MenuItem>
                    )}
                  {suppliers
                    .filter((s) => s && s.id != null)
                    .map((s) => (
                      <MenuItem key={s.id} value={String(s.id)}>
                        {s.name || `Supplier #${s.id}`}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              {/* Customer Dropdown */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Customer *"
                  value={formData.customerId != null ? String(formData.customerId) : ''}
                  onChange={(e) => {
                    const val = e?.target?.value ?? e;
                    handleCustomerChange(val);
                  }}
                  disabled={!formData.supplierId}
                >
                  <MenuItem value="">
                    <em>-- Select Customer --</em>
                  </MenuItem>
                  {formData.customerId &&
                    !customers.some((c) => String(c?.id) === String(formData.customerId)) && (
                      <MenuItem value={String(formData.customerId)}>
                        {formData.customerName || `Customer #${formData.customerId}`}
                      </MenuItem>
                    )}
                  {customers
                    .filter((c) => c && c.id != null)
                    .map((c) => (
                      <MenuItem key={c.id} value={String(c.id)}>
                        {c.name || `Customer #${c.id}`}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              {/* PO Number (Autocomplete) */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  size="small"
                  options={poList || []}
                  loading={dropdownLoading || poLoading}
                  value={
                    (poList || []).find((p) => String(p?.id) === String(formData.poId)) ||
                    (formData.poId || formData.poNo
                      ? { id: formData.poId, poNo: formData.poNo }
                      : null)
                  }
                  onChange={(e, val) => handlePOChange(val)}
                  getOptionLabel={(opt) => {
                    if (!opt) return '';
                    if (typeof opt === 'string') return opt;
                    return opt.poNo || String(opt.id || '');
                  }}
                  isOptionEqualToValue={(opt, val) => {
                    if (!opt || !val) return false;
                    return String(opt.id) === String(val.id);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="PO No. *"
                      placeholder="Search & Select PO..."
                    />
                  )}
                />
              </Grid>

              {/* Style No */}
              <Grid item xs={12} sm={6}>
                {styleList && styleList.length > 0 ? (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Style No. *"
                    value={formData.styleNo != null ? String(formData.styleNo) : ''}
                    onChange={(e) => {
                      const val = e?.target?.value ?? e;
                      handleStyleChange(val);
                    }}
                  >
                    <MenuItem value="">
                      <em>-- Select Style --</em>
                    </MenuItem>
                    {formData.styleNo &&
                      !styleList.some((st) => String(st?.styleNo) === String(formData.styleNo)) && (
                        <MenuItem value={String(formData.styleNo)}>{formData.styleNo}</MenuItem>
                      )}
                    {styleList
                      .filter((st) => st && st.styleNo != null)
                      .map((st, i) => (
                        <MenuItem key={i} value={String(st.styleNo)}>
                          {st.styleNo} {st.color ? `(${st.color})` : ''}
                        </MenuItem>
                      ))}
                  </TextField>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label="Style No. *"
                    value={formData.styleNo != null ? String(formData.styleNo) : ''}
                    onChange={(e) => {
                      const val = e?.target?.value ?? e;
                      setFormData((prev) => ({ ...prev, styleNo: val }));
                    }}
                    placeholder="e.g. ST-4011"
                  />
                )}
              </Grid>

              {/* Order Quantity */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Order Quantity *"
                  value={formData.orderQty}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, orderQty: e.target.value }))
                  }
                  placeholder="Total order quantity"
                />
              </Grid>

              {/* Offer Quantity */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Offer Quantity *"
                  value={formData.offerQty}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, offerQty: e.target.value }))
                  }
                  placeholder="Offered quantity for inspection"
                />
              </Grid>

              {/* Color / Article */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Color / Article *"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="Color or Article Name"
                />
              </Grid>

              {/* Actual Ship Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Actual Ship Date *"
                  value={formData.actualShipDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, actualShipDate: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Inspection Offer Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Inspection Offer Date *"
                  value={formData.offerDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, offerDate: e.target.value }))
                  }
                  helperText="Notice: Submit at least 3 days prior"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Inspection Type (Task Nature) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Inspection Type *"
                  value={formData.taskNature != null ? String(formData.taskNature) : 'Final'}
                  onChange={(e) => {
                    const val = e?.target?.value ?? e;
                    setFormData((prev) => ({ ...prev, taskNature: val }));
                  }}
                >
                  {TASK_NATURE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Remarks / Special Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Remarks"
                  value={formData.remarks || formData.qamRemarks}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                      qamRemarks: e.target.value,
                    }))
                  }
                  placeholder="Enter any specific notes, instructions or fabric test references..."
                />
              </Grid>
            </Grid>

            {/* Form Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate(paths.dashboard.powerTool.icrForm)}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
                startIcon={
                  saving ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Iconify icon="solar:plain-bold" />
                  )
                }
                sx={{ px: 3, fontWeight: 600 }}
              >
                {saving ? 'Sending Request...' : 'Send Request'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
