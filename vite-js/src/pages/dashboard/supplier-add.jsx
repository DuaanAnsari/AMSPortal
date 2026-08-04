import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useSnackbar } from 'src/components/snackbar';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { buildSupplierCreatePayload, createSupplierWithUser } from './supplier-add.api';
import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

const supplierStatusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Potential', label: 'Potential' },
  { value: 'Not Active', label: 'Not Active' },
];

const yesNoOptions = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const turnoverUnitOptions = ['Dollar', 'Euro', 'INR'];
const capacityUnitOptions = ['PCs', 'Dozen'];

const defaultForm = {
  supplierStatus: 'Active',
  name: '',
  shortName: '',
  username: '',
  password: '',
  vendorCategoryId: 'Potential',
  vendorCode: '',
  address: '',
  street: '',
  town: '',
  cityId: 1,
  contactPerson: '',
  designation: '',
  phoneNumberPrincipal: '',
  phoneNumberOthers: '',
  faxNo: '',
  cellNumber: '',
  ceoEmail: '',
  merchandiserEmail: '',
  merchandiserEmail2: '',
  merchandiserEmail3: '',
  productGroupIds: [],
  verticalIntegrationIds: [38],
  managementApproval: '',
  socialCompliance: '',
  supplyChain: '',
  businessDevelopment: '',
  qd: '',
  aboutSupplier: '',
  annualTurnover: '',
  turnoverUnit: 'Dollar',
  capacity: '',
  capacityUnit: 'PCs',
  supplyChainEvaluation: '',
};

// ----------------------------------------------------------------------

export default function SupplierAddPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [productGroups, setProductGroups] = useState([]);

  const roleId = Number(localStorage.getItem('roleId') || 0);
  const canSave = roleId === 1 || roleId === 49;

  const vendorCategories = useMemo(() => [{ value: 'Potential', label: 'Potential' }], []);
  const cities = useMemo(() => [{ value: 1, label: 'Karachi' }], []);
  const verticalIntegrations = useMemo(() => [{ value: 38, label: 'Manufacturing' }], []);

  useEffect(() => {
    let active = true;

    const fetchProductGroups = async () => {
      try {
        const { data } = await axios.get('/api/MyOrders/GetProductGroupDD');
        if (!active) return;
        const rows = Array.isArray(data) ? data : data ? [data] : [];
        setProductGroups(
          rows.map((item) => ({
            value: item?.VVIID ?? '',
            label: item?.Name ?? '',
          }))
        );
      } catch {
        if (!active) return;
        setProductGroups([]);
      }
    };

    fetchProductGroups();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (field) => (event) => {
    const value = event?.target?.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateEmail = (value) => {
    if (!value) return true;
    return /^\w+([-.+']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value);
  };

  const getPasswordError = (value) => {
    const password = String(value || '');
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/.test(password);

    if (hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial) {
      return '';
    }

    return 'Password must contain:\n- Minimum 8 characters\n- One uppercase letter\n- One lowercase letter\n- One number\n- One special character';
  };

  const handleSave = async () => {
    const nextErrors = {};

    if (form.productGroupIds.length === 0) {
      nextErrors.productGroupIds = 'At least one Product Group must be selected.';
    }

    if (form.verticalIntegrationIds.length === 0) {
      nextErrors.verticalIntegrationIds = 'At least one Vertical Integration must be selected.';
    }

    const passwordError = getPasswordError(form.password);
    if (passwordError) nextErrors.password = passwordError;

    if (!validateEmail(form.ceoEmail)) nextErrors.ceoEmail = 'Invalid email address.';
    if (!validateEmail(form.merchandiserEmail)) nextErrors.merchandiserEmail = 'Invalid email address.';
    if (!validateEmail(form.merchandiserEmail2)) nextErrors.merchandiserEmail2 = 'Invalid email address.';
    if (!validateEmail(form.merchandiserEmail3)) nextErrors.merchandiserEmail3 = 'Invalid email address.';

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const payload = buildSupplierCreatePayload(form);

    try {
      setSaving(true);
      await createSupplierWithUser(payload);
      enqueueSnackbar('Supplier created successfully.', { variant: 'success' });
      setTimeout(() => {
        navigate('/dashboard/supplier');
      }, 3000);
    } catch (err) {
      const message =
        (typeof err === 'string' && err) ||
        err?.message ||
        err?.Message ||
        err?.title ||
        err?.error ||
        (typeof err?.response?.data === 'string' && err.response.data) ||
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        'Failed to create supplier.';
      enqueueSnackbar(message, { variant: 'error' });
      setSaving(false);
    }
  };

  const renderMultiSelectValue = (selectedValues, options) =>
    selectedValues.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        No options available
      </Typography>
    ) : (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {selectedValues.map((value) => {
          const label = options.find((item) => String(item.value) === String(value))?.label || value;
          return <Chip key={value} label={label} size="small" />;
        })}
      </Box>
    );

  const renderProductGroupValue = (selectedValues) => {
    if (!selectedValues?.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          Select Product Group
        </Typography>
      );
    }

    if (selectedValues.length > 5) {
      return `${selectedValues.length} items selected`;
    }

    return selectedValues
      .map((value) => productGroups.find((item) => String(item.value) === String(value))?.label || value)
      .join(', ');
  };

  return (
    <>
      <Helmet>
        <title> Dashboard: Add Supplier</title>
      </Helmet>

      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Add Supplier"
          links={[
            { name: 'Dashboard' },
            { name: 'Supplier', href: '/dashboard/supplier' },
            { name: 'Add Supplier' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {!canSave && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Old AMS role validation: Save is available only for RoleID 1 and 49.
          </Alert>
        )}

        <Stack spacing={3}>
          <SectionCard title="Basic Information">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel>Vendor Status</FormLabel>
                  <RadioGroup
                    row
                    value={form.supplierStatus}
                    onChange={handleChange('supplierStatus')}
                  >
                    {supplierStatusOptions.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio />}
                        label={option.label}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField label="Name" fullWidth value={form.name} onChange={handleChange('name')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Short Name"
                  fullWidth
                  value={form.shortName}
                  onChange={handleChange('shortName')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Username"
                  fullWidth
                  value={form.username}
                  onChange={handleChange('username')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Vendor Category</InputLabel>
                  <Select
                    value={form.vendorCategoryId}
                    label="Vendor Category"
                    onChange={handleChange('vendorCategoryId')}
                  >
                    {vendorCategories.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Password"
                  type="text"
                  fullWidth
                  value={form.password}
                  onChange={handleChange('password')}
                  error={!!errors.password}
                  helperText={
                    errors.password ? (
                      <Box component="span" sx={{ display: 'block', whiteSpace: 'pre-line' }}>
                        {errors.password}
                      </Box>
                    ) : (
                      ' '
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Vendor Code"
                  fullWidth
                  value={form.vendorCode}
                  onChange={handleChange('vendorCode')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Address"
                  fullWidth
                  value={form.address}
                  onChange={handleChange('address')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Street"
                  fullWidth
                  value={form.street}
                  onChange={handleChange('street')}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField label="Town" fullWidth value={form.town} onChange={handleChange('town')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>City</InputLabel>
                  <Select value={form.cityId} label="City" onChange={handleChange('cityId')}>
                    {cities.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Contact Person"
                  fullWidth
                  value={form.contactPerson}
                  onChange={handleChange('contactPerson')}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Designation"
                  fullWidth
                  value={form.designation}
                  onChange={handleChange('designation')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Phone Number (Principal)"
                  fullWidth
                  value={form.phoneNumberPrincipal}
                  onChange={handleChange('phoneNumberPrincipal')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Phone Number (Others)"
                  fullWidth
                  value={form.phoneNumberOthers}
                  onChange={handleChange('phoneNumberOthers')}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField label="Fax No" fullWidth value={form.faxNo} onChange={handleChange('faxNo')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Cell Number"
                  fullWidth
                  value={form.cellNumber}
                  onChange={handleChange('cellNumber')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="CEO Email"
                  fullWidth
                  value={form.ceoEmail}
                  onChange={handleChange('ceoEmail')}
                  error={!!errors.ceoEmail}
                  helperText={errors.ceoEmail || ' '}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Merchandiser Email"
                  fullWidth
                  value={form.merchandiserEmail}
                  onChange={handleChange('merchandiserEmail')}
                  error={!!errors.merchandiserEmail}
                  helperText={errors.merchandiserEmail || ' '}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Merchandiser Email 2"
                  fullWidth
                  value={form.merchandiserEmail2}
                  onChange={handleChange('merchandiserEmail2')}
                  error={!!errors.merchandiserEmail2}
                  helperText={errors.merchandiserEmail2 || ' '}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Merchandiser Email 3"
                  fullWidth
                  value={form.merchandiserEmail3}
                  onChange={handleChange('merchandiserEmail3')}
                  error={!!errors.merchandiserEmail3}
                  helperText={errors.merchandiserEmail3 || ' '}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Product Group & Vertical Integration">
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.productGroupIds}>
                  <InputLabel>Product Group</InputLabel>
                  <Select
                    multiple
                    displayEmpty
                    value={form.productGroupIds}
                    onChange={handleChange('productGroupIds')}
                    input={<OutlinedInput label="Product Group" />}
                    renderValue={renderProductGroupValue}
                  >
                    {productGroups.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Checkbox checked={form.productGroupIds.indexOf(option.value) > -1} />
                        <ListItemText primary={option.label} />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.productGroupIds || ' '}</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.verticalIntegrationIds}>
                  <InputLabel>Vertical Integration</InputLabel>
                  <Select
                    multiple
                    value={form.verticalIntegrationIds}
                    onChange={handleChange('verticalIntegrationIds')}
                    input={<OutlinedInput label="Vertical Integration" />}
                    renderValue={(selected) => renderMultiSelectValue(selected, verticalIntegrations)}
                  >
                    {verticalIntegrations.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.verticalIntegrationIds || ' '}</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Supplier Grading Scale (0-10)">
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Management Approval</InputLabel>
                  <Select
                    value={form.managementApproval}
                    label="Management Approval"
                    onChange={handleChange('managementApproval')}
                  >
                    {yesNoOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Social Compliance"
                  type="number"
                  fullWidth
                  value={form.socialCompliance}
                  onChange={handleChange('socialCompliance')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Supply Chain"
                  type="number"
                  fullWidth
                  value={form.supplyChain}
                  onChange={handleChange('supplyChain')}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Business Development"
                  type="number"
                  fullWidth
                  value={form.businessDevelopment}
                  onChange={handleChange('businessDevelopment')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="QD" type="number" fullWidth value={form.qd} onChange={handleChange('qd')} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="How Much You Know About Supplier"
                  multiline
                  minRows={4}
                  fullWidth
                  value={form.aboutSupplier}
                  onChange={handleChange('aboutSupplier')}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Business and Certification Data">
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <TextField
                      label="Turnover"
                      fullWidth
                      value={form.annualTurnover}
                      onChange={handleChange('annualTurnover')}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select value={form.turnoverUnit} label="Unit" onChange={handleChange('turnoverUnit')}>
                        {turnoverUnitOptions.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <TextField
                      label="Capacity"
                      fullWidth
                      value={form.capacity}
                      onChange={handleChange('capacity')}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select value={form.capacityUnit} label="Unit" onChange={handleChange('capacityUnit')}>
                        {capacityUnitOptions.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Supply Chain Evaluation</InputLabel>
                  <Select
                    value={form.supplyChainEvaluation}
                    label="Supply Chain Evaluation"
                    onChange={handleChange('supplyChainEvaluation')}
                  >
                    {yesNoOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

            </Grid>
          </SectionCard>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              pb: 4,
            }}
          >
            <Button variant="outlined" onClick={() => navigate('/dashboard/supplier')}>
              Cancel
            </Button>
            {canSave && (
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </Box>
        </Stack>
      </Container>
    </>
  );
}

function SectionCard({ title, children }) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}
