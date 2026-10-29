import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Alert,
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

// ----------------------------------------------------------------------

export default function ICREditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const icrDetailID = Number(id) || 0;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [poList, setPoList] = useState([]);
  const [styleList, setStyleList] = useState([]);
  const [poLoading, setPoLoading] = useState(false);

  const isSupplier = useMemo(() => {
    const raw =
      localStorage.getItem('employeeId') ||
      localStorage.getItem('supplierId') ||
      localStorage.getItem('SupplierId') ||
      localStorage.getItem('supplierID');
    return raw ? Number(raw) > 0 : false;
  }, []);

  const unwrap = (data) => data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;

  // Load everything: edit record first, then dependent dropdown options.
  const loadEdit = useCallback(async () => {
    if (!icrDetailID) {
      enqueueSnackbar('Invalid ICR record ID.', { variant: 'error' });
      navigate(paths.dashboard.powerTool.icrForm, { replace: true });
      return;
    }

    setLoading(true);
    try {
      // 1. GET /api/ICRSupplier/GetICREdit/{icrDetailID}
      const res = await axios.get(`/api/ICRSupplier/GetICREdit/${encodeURIComponent(icrDetailID)}`);
      const resData = unwrap(res.data);
      const editData = Array.isArray(resData) ? resData[0] : resData;

      if (!editData) {
        enqueueSnackbar('ICR record not found.', { variant: 'error' });
        navigate(paths.dashboard.powerTool.icrForm, { replace: true });
        return;
      }

      const supplierId = pick(
        editData.venderLibraryID,
        editData.VenderLibraryID,
        editData.supplierID,
        editData.SupplierID
      );
      const supplierName = pick(
        editData.venderName,
        editData.VenderName,
        editData.supplierName,
        editData.SupplierName
      );
      const customerId = pick(editData.customerID, editData.CustomerID);
      const customerName = pick(editData.customerName, editData.CustomerName);
      const poId = pick(editData.poid, editData.POID, editData.poId);
      const poNo = String(pick(editData.pono, editData.PONO, editData.poNo) || '');
      const styleNo = String(pick(editData.styleNo, editData.StyleNo) || '');
      const orderQty = pick(editData.orderQty, editData.OrderQty);
      const offerQty = pick(editData.offerQty, editData.OfferQty);
      const color = String(
        pick(editData.color, editData.Color, editData.articleNo, editData.ArticleNo) || ''
      );
      const taskNature = String(
        pick(editData.taskNature, editData.TaskNature, editData.remarks, editData.Remarks) || 'Final'
      );
      const qamRemarks = String(pick(editData.qamRemarks, editData.QAMRemarks) || '');
      const remarks = String(pick(editData.remarks, editData.Remarks, qamRemarks) || '');

      const offerDate = toDateInput(pick(editData.actualDate, editData.ActualDate, editData.offerDate));
      const planDate = toDateInput(pick(editData.planDate, editData.PlanDate));
      const shipDate = toDateInput(pick(editData.shipmentDate, editData.ShipmentDate));

      // 2. Suppliers: GET /api/ICRSupplier/GetSuppliers?supplierID=0
      let supplierOptions = [];
      try {
        const supRes = await axios.get('/api/ICRSupplier/GetSuppliers', {
          params: { supplierID: 0 },
        });
        const supRaw = unwrap(supRes.data);
        supplierOptions = (Array.isArray(supRaw) ? supRaw : []).map((s) => ({
          id: pick(s.venderLibraryID, s.VenderLibraryID, s.supplierID, s.SupplierID, s.id),
          name: pick(s.venderName, s.VenderName, s.supplierName, s.SupplierName, s.name),
        }));
      } catch (err) {
        console.warn('Error fetching suppliers:', err);
      }
      if (supplierId && !supplierOptions.some((s) => String(s.id) === String(supplierId))) {
        supplierOptions.push({ id: supplierId, name: supplierName || `Supplier #${supplierId}` });
      }

      // 3. Customers: GET /api/ICRSupplier/GetCustomers?supplierID={supplierId}
      let customerOptions = [];
      if (supplierId) {
        try {
          const custRes = await axios.get('/api/ICRSupplier/GetCustomers', {
            params: { supplierID: Number(supplierId) || 0 },
          });
          const custRaw = unwrap(custRes.data);
          customerOptions = (Array.isArray(custRaw) ? custRaw : []).map((c) => ({
            id: pick(c.customerID, c.CustomerID, c.id),
            name: pick(c.customerName, c.CustomerName, c.name),
          }));
        } catch (err) {
          console.warn('Error fetching customers:', err);
        }
      }
      if (customerId && !customerOptions.some((c) => String(c.id) === String(customerId))) {
        customerOptions.push({ id: customerId, name: customerName || `Customer #${customerId}` });
      }

      // 4. POs: GET /api/ICRSupplier/GetPOs?customerID={customerId}&supplierID={supplierId}
      let poOptions = [];
      if (supplierId && customerId) {
        try {
          const poRes = await axios.get('/api/ICRSupplier/GetPOs', {
            params: {
              customerID: Number(customerId) || 0,
              supplierID: Number(supplierId) || 0,
            },
          });
          const poRaw = unwrap(poRes.data);
          poOptions = (Array.isArray(poRaw) ? poRaw : []).map((p) => ({
            id: pick(p.poid, p.POID, p.id),
            poNo: String(pick(p.pono, p.PONO, p.poNo, p.label) || ''),
            raw: p,
          }));
        } catch (err) {
          console.warn('Error fetching POs:', err);
        }
      }
      if (poId && !poOptions.some((p) => String(p.id) === String(poId))) {
        poOptions.unshift({ id: poId, poNo: poNo || String(poId) });
      }

      // 5. Styles for the selected PO: GET /api/Milestone/GetStyle?poid={poId}
      let styleOptions = [];
      if (poId) {
        try {
          const styleRes = await axios.get('/api/Milestone/GetStyle', {
            params: { poid: poId },
          });
          const styleRaw = unwrap(styleRes.data);
          styleOptions = (Array.isArray(styleRaw) ? styleRaw : []).map((st) => ({
            styleNo: pick(st.styleNo, st.StyleNo),
            color: pick(st.colorway, st.Colorway, st.color, st.Color),
            poQty: pick(st.quantity, st.poQty, st.POQty),
            shipmentDate: pick(st.shipmentDate, st.ShipmentDate),
          }));
        } catch (err) {
          console.warn('Error fetching styles:', err);
        }
      }
      if (styleNo && !styleOptions.some((st) => String(st.styleNo) === String(styleNo))) {
        styleOptions.push({
          styleNo,
          color,
          poQty: orderQty || 0,
          shipmentDate: shipDate,
        });
      }

      setSuppliers(supplierOptions);
      setCustomers(customerOptions);
      setPoList(poOptions);
      setStyleList(styleOptions);

      setFormData({
        icrDetailID,
        supplierId,
        supplierName,
        customerId,
        customerName,
        poId,
        poNo,
        styleNo,
        orderQty: orderQty != null && orderQty !== '' ? String(orderQty) : '',
        offerQty: offerQty != null && offerQty !== '' ? String(offerQty) : '',
        color,
        actualShipDate: shipDate,
        offerDate,
        planDate,
        taskNature,
        remarks,
        qamRemarks,
      });
    } catch (err) {
      console.error('Error loading ICR edit data:', err);
      enqueueSnackbar('Failed to load ICR record. Please try again.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [icrDetailID, enqueueSnackbar, navigate]);

  useEffect(() => {
    if (isSupplier) {
      enqueueSnackbar('You do not have permission to edit ICR records.', { variant: 'error' });
      navigate(paths.dashboard.powerTool.icrForm, { replace: true });
      return;
    }
    loadEdit();
  }, [isSupplier, loadEdit, enqueueSnackbar, navigate]);

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

  const handleUpdate = async (e) => {
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

      // Backend UpdateICRDto expects planDate as "date-time" (nullable) — send null when empty,
      // never an empty string (empty string fails date-time format validation -> 400 $.planDate).
      let planDateVal = null;
      if (formData.planDate) {
        try {
          const parsed = new Date(formData.planDate);
          planDateVal = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
        } catch {
          planDateVal = null;
        }
      }

      const updatePayload = {
        icrDetailID: Number(formData.icrDetailID),
        styleNo: String(formData.styleNo || '').trim(),
        color: String(formData.color || '').trim(),
        taskNature: String(formData.taskNature || 'Final').trim(),
        orderQty: Number(formData.orderQty) || 0,
        offerQty: Number(formData.offerQty) || 0,
        actualDate: actualDateIso,
        planDate: planDateVal,
        remarks: String(formData.remarks || formData.qamRemarks || '').trim(),
        qamRemarks: String(formData.qamRemarks || '').trim(),
      };

      await axios.put('/api/ICRSupplier/UpdateICR', updatePayload);

      enqueueSnackbar('Inspection Certificate Request updated successfully!', {
        variant: 'success',
      });
      navigate(paths.dashboard.powerTool.icrForm);
    } catch (err) {
      console.error('Error updating ICR:', err);
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.response?.data?.message ||
            err?.response?.data?.Message ||
            err?.message ||
            'Failed to update ICR request. Please check inputs and retry.';
      enqueueSnackbar(errMsg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="Edit ICR Request"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Power Tools', href: paths.dashboard.powerTool.root },
          { name: 'ICR Form', href: paths.dashboard.powerTool.icrForm },
          { name: 'Edit ICR Request' },
        ]}
      />

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 1.5, fontWeight: 500 }}>
            Inspection requests must be submitted a minimum of 3 days before the requested inspection
            date.
          </Alert>

          <Box component="form" onSubmit={handleUpdate} noValidate>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Iconify icon="solar:pen-bold" width={22} />
              Edit ICR Request Form
            </Typography>

            <Grid container spacing={3}>
              {/* Supplier Dropdown */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Supplier *"
                  value={formData.supplierId != null ? String(formData.supplierId) : ''}
                  onChange={(e) => handleSupplierChange(e?.target?.value ?? e)}
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
                      <MenuItem key={String(s.id)} value={String(s.id)}>
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
                  onChange={(e) => handleCustomerChange(e?.target?.value ?? e)}
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
                      <MenuItem key={String(c.id)} value={String(c.id)}>
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
                  loading={poLoading}
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
                    <TextField {...params} label="PO No. *" placeholder="Search & Select PO..." />
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
                    onChange={(e) => handleStyleChange(e?.target?.value ?? e)}
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
                        <MenuItem key={`${st.styleNo}-${i}`} value={String(st.styleNo)}>
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, styleNo: e.target.value }))
                    }
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, orderQty: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, offerQty: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, offerDate: e.target.value }))}
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, taskNature: e?.target?.value ?? e }))
                  }
                >
                  {TASK_NATURE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Plan Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Plan Date"
                  value={formData.planDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, planDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
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
                    <Iconify icon="solar:check-read-bold" />
                  )
                }
              >
                Update
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
