import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  CircularProgress,
  useTheme,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';

import axios from 'src/utils/axios';
import { getLoginErrorMessage } from 'src/utils/get-login-error-message';

import { paths } from 'src/routes/paths';

import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

const INITIAL_FORM = {
  name: '',
  username: '',
  email: '',
  phoneNumber: '',
  password: '',
  role: '',
  roleId: 0,
  designation: '',
  managerId: '',
};

const FIELD_LABEL_SX = {
  color: 'text.secondary',
  mb: 0.75,
  fontWeight: 600,
  fontSize: '0.8125rem',
};

const FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'background.paper',
  },
  '& .MuiOutlinedInput-input': {
    py: 1.25,
  },
};

const PRIMARY_BUTTON_SX = {
  bgcolor: '#4a3b75',
  color: 'white',
  textTransform: 'none',
  fontWeight: 600,
  minWidth: 120,
  height: 40,
  '&:hover': { bgcolor: '#382c5a' },
  '&.Mui-disabled': {
    bgcolor: 'action.disabledBackground',
    color: 'action.disabled',
  },
};

function FormField({ label, children }) {
  return (
    <Grid item xs={12} md={6}>
      <Typography variant="body2" sx={FIELD_LABEL_SX}>
        {label}
      </Typography>
      {children}
    </Grid>
  );
}

const REGISTER_ENDPOINT = '/api/Auth/register';
const ROLES_ENDPOINT = '/api/Auth/roles';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    let cancelled = false;

    const fetchRoles = async () => {
      setRolesLoading(true);

      try {
        const response = await axios.get(ROLES_ENDPOINT);
        const data = Array.isArray(response.data) ? response.data : [];

        if (!cancelled) {
          setRoles(data);
        }
      } catch (error) {
        if (!cancelled) {
          enqueueSnackbar(getLoginErrorMessage(error), { variant: 'error' });
        }
      } finally {
        if (!cancelled) {
          setRolesLoading(false);
        }
      }
    };

    fetchRoles();

    return () => {
      cancelled = true;
    };
  }, [enqueueSnackbar]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    navigate(paths.dashboard.profileSetting.root);
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        role: formData.role,
        designation: formData.designation,
        roleId: Number(formData.roleId) || 0,
        managerId: Number(formData.managerId) || 0,
      };

      await axios.post(REGISTER_ENDPOINT, payload);

      enqueueSnackbar('User created successfully', { variant: 'success' });
      setFormData(INITIAL_FORM);
      setShowPassword(false);
    } catch (error) {
      enqueueSnackbar(getLoginErrorMessage(error), { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 4, mb: 4, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3, maxWidth: 960, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 500,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={() => navigate(paths.dashboard.root)}
          >
            Dashboard
          </Typography>
          <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>
            •
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            Profile Setting
          </Typography>
          <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>
            •
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            Create User
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Card
          sx={{
            width: '100%',
            maxWidth: 960,
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          <CardContent sx={{ px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h6"
              fontWeight={700}
              color="text.primary"
              sx={{ mb: 3, letterSpacing: 0.2 }}
            >
              Create User
            </Typography>

            <Grid container spacing={3}>
              <FormField label="Name">
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  sx={FIELD_SX}
                />
              </FormField>

              <FormField label="Username">
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  sx={FIELD_SX}
                />
              </FormField>

              <FormField label="Email">
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  sx={FIELD_SX}
                />
              </FormField>

              <FormField label="Phone Number">
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  sx={FIELD_SX}
                />
              </FormField>

              <FormField label="Password">
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  sx={FIELD_SX}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((prev) => !prev)}
                          onMouseDown={(event) => event.preventDefault()}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </FormField>

              <FormField label="Designation">
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  sx={FIELD_SX}
                />
              </FormField>

              <FormField label="Role">
                <Autocomplete
                  fullWidth
                  size="small"
                  options={roles}
                  value={roles.find((role) => role.roleID === formData.roleId) || null}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      role: newValue?.name ?? '',
                      roleId: newValue?.roleID ?? 0,
                    }));
                  }}
                  loading={rolesLoading}
                  disabled={rolesLoading && roles.length === 0}
                  getOptionLabel={(option) => option.name || ''}
                  isOptionEqualToValue={(option, value) => option.roleID === value.roleID}
                  noOptionsText={rolesLoading ? 'Loading...' : 'No roles found'}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      sx={FIELD_SX}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {rolesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </FormField>

              <FormField label="Manager">
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  name="managerId"
                  type="number"
                  value={formData.managerId}
                  onChange={handleChange}
                  sx={FIELD_SX}
                />
              </FormField>

              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    mt: 2,
                    pt: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleCancel}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      minWidth: 120,
                      height: 40,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    disabled={isSubmitting}
                    onClick={handleSave}
                    sx={PRIMARY_BUTTON_SX}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
