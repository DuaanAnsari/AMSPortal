import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';

export default function CustomerNewView() {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('id');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { enqueueSnackbar } = useSnackbar();

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const payload = {
        customerID: customerId ? Number(customerId) : 0,
        customerName: formData.name,
        principalName: formData.principalCustomerName,
        brandName: formData.brandName,
        address: formData.address,
        contactNo: formData.contactNo,
        faxNo: formData.faxNo,
        email: formData.email,
        website: formData.webSite,
        city: formData.city,
        country: formData.country,
        state: formData.state,
        commission: formData.commission ? Number(formData.commission) : 0,
        baseCustomerName: '',
        baseCountry: '',
        consigneeName: formData.consigneeName,
        consigneeAddress1: formData.addressLine1,
        consigneeAddress2: formData.addressLine2,
        consigneeCity: formData.consigneeCity,
        consigneeCountry: formData.consigneeCountry,
        titleOfAccount: formData.titleOfAccount,
        bankName: formData.bankName,
        bankBranch: formData.bankBranch,
        accountNo: formData.accountNo,
        iban: formData.ibanNo,
        rNnumber: formData.rnNo,
        tolQuantity: formData.tolQuantity ? Number(formData.tolQuantity) : 0,
        customerDetails: contactPersons.map((person) => ({
          customerDetailID: (!customerId || typeof person.id === 'string' || person.id > 1000000000000) ? 0 : Number(person.id),
          customerID: customerId ? Number(customerId) : 0,
          name: person.name,
          email: person.email,
          phoneNo: person.phone,
          departmentNo: person.departmentNo,
        })),
      };

      const endpoint = customerId 
        ? `${API_BASE_URL}/api/Customer/UpdateCustomer` 
        : `${API_BASE_URL}/api/Customer/AddCustomer`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errMsg = customerId ? 'Failed to update customer' : 'Failed to add customer';
        try {
          const errData = await response.json();
          errMsg = errData.message || errData.title || errMsg;
        } catch (e) {
          try {
            const errText = await response.text();
            errMsg = errText || errMsg;
          } catch (e2) {}
        }
        throw new Error(errMsg);
      }

      enqueueSnackbar(customerId ? 'Customer updated successfully!' : 'Customer added successfully', { variant: 'success' });
      navigate('/dashboard/customers');
    } catch (error) {
      console.error(customerId ? 'Update failed:' : 'Add failed:', error);
      enqueueSnackbar(error.message || 'An error occurred while saving.', { variant: 'error' });
    }
  };

  const [formData, setFormData] = useState({
    commission: '',
    name: '',
    principalCustomerName: '',
    brandName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    contactNo: '',
    faxNo: '',
    email: '',
    webSite: '',
    isActive: true,
    rnNo: '',
    tolQuantity: '',
    consigneeName: '',
    consigneeCity: '',
    consigneeCountry: '',
    addressLine1: '',
    addressLine2: '',
    titleOfAccount: '',
    bankName: '',
    bankBranch: '',
    accountNo: '',
    ibanNo: '',
  });

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const [contactPersons, setContactPersons] = useState([]);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', departmentNo: '' });

  useEffect(() => {
    if (customerId) {
      const fetchCustomer = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${API_BASE_URL}/api/Customer/EditCustomer/${customerId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
          if (response.ok) {
            const data = await response.json();
            setFormData({
              commission: data.commission ?? '',
              name: data.customerName ?? data.name ?? '',
              principalCustomerName: data.principalCustomerName ?? '',
              brandName: data.brandName ?? '',
              address: data.address ?? '',
              city: data.city ?? '',
              state: data.state ?? '',
              country: data.country ?? '',
              contactNo: data.phoneNo ?? data.contactNo ?? '',
              faxNo: data.faxNo ?? '',
              email: data.email ?? '',
              webSite: data.website ?? data.webSite ?? '',
              isActive: data.isActive ?? data.active ?? true,
              rnNo: data.rnNo ?? '',
              tolQuantity: data.tolQuantity ?? '',
              consigneeName: data.consigneeName ?? '',
              consigneeCity: data.consigneeCity ?? '',
              consigneeCountry: data.consigneeCountry ?? '',
              addressLine1: data.consigneeAddress1 ?? data.addressLine1 ?? '',
              addressLine2: data.addressLine2 ?? '',
              titleOfAccount: data.titleOfAccount ?? '',
              bankName: data.bankName ?? '',
              bankBranch: data.bankBranch ?? '',
              accountNo: data.accountNo ?? '',
              ibanNo: data.ibanNo ?? '',
            });
            if (data.customerDetails && Array.isArray(data.customerDetails)) {
              setContactPersons(
                data.customerDetails.map((d, idx) => ({
                  id: d.id ?? d.customerDetailId ?? Date.now() + idx,
                  name: d.name ?? d.contactPersonName ?? d.contactPerson ?? '',
                  email: d.email ?? d.contactPersonEmail ?? '',
                  phone: d.phoneNo ?? d.phone ?? d.contactPersonPhone ?? d.contactNo ?? '',
                  departmentNo: d.departmentNo ?? d.department ?? '',
                }))
              );
            }
          }
        } catch (error) {
          console.error('Failed to fetch customer', error);
        }
      };
      fetchCustomer();
    }
  }, [customerId, API_BASE_URL]);

  const handleContactFormChange = (field) => (event) => {
    setContactForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAddContactPerson = () => {
    if (!contactForm.name.trim()) return;
    setContactPersons((prev) => [
      ...prev,
      { id: Date.now(), ...contactForm },
    ]);
    setContactForm({ name: '', email: '', phone: '', departmentNo: '' });
  };

  const handleRemoveContactPerson = (id) => {
    setContactPersons((prev) => prev.filter((person) => person.id !== id));
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={customerId ? "Edit Customer" : "Create a new customer"}
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Customers', href: '/dashboard/customers' },
          { name: customerId ? 'Edit customer' : 'New customer' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
          CUSTOMER INFORMATION
        </Typography>
        
        <Box
          rowGap={3}
          columnGap={2}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(3, 1fr)',
          }}
        >
          <TextField name="commission" label="Commission" value={formData.commission} onChange={handleFormChange} />
          <TextField name="name" label="Name" value={formData.name} onChange={handleFormChange} />
          <TextField name="principalCustomerName" label="Principal Customer Name" value={formData.principalCustomerName} onChange={handleFormChange} />

          <TextField name="brandName" label="Brand Name" value={formData.brandName} onChange={handleFormChange} />
          <TextField name="address" label="Address" value={formData.address} onChange={handleFormChange} />
          <TextField name="city" label="City" value={formData.city} onChange={handleFormChange} />

          <TextField name="state" label="State" value={formData.state} onChange={handleFormChange} />
          <TextField name="country" label="Country" value={formData.country} onChange={handleFormChange} />
          <TextField name="contactNo" label="Contact No." value={formData.contactNo} onChange={handleFormChange} />

          <TextField name="faxNo" label="Fax No." value={formData.faxNo} onChange={handleFormChange} />
          <TextField name="email" label="Email" value={formData.email} onChange={handleFormChange} />
          <TextField name="webSite" label="WebSite" value={formData.webSite} onChange={handleFormChange} />

          <FormControlLabel
            control={<Checkbox name="isActive" checked={formData.isActive} onChange={handleFormChange} />}
            label="Is Active"
            sx={{ m: 0 }}
          />
          <TextField name="rnNo" label="RN No." value={formData.rnNo} onChange={handleFormChange} />
          <TextField name="tolQuantity" label="Tol.%(Quantity)" value={formData.tolQuantity} onChange={handleFormChange} />
        </Box>
      </Card>

      <Card sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
          CUSTOMER&apos;S CONTACT PERSON DETAIL
        </Typography>

        {/* Input fields row */}
        <Box
          rowGap={3}
          columnGap={2}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(3, 1fr)',
          }}
        >
          <TextField
            label="Name"
            value={contactForm.name}
            onChange={handleContactFormChange('name')}
          />
          <TextField
            label="Email"
            value={contactForm.email}
            onChange={handleContactFormChange('email')}
          />
          <TextField
            label="Phone"
            value={contactForm.phone}
            onChange={handleContactFormChange('phone')}
          />
        </Box>

        <Stack direction="row" alignItems="flex-end" spacing={2} sx={{ mt: 3 }}>
          <TextField
            label="Department No."
            value={contactForm.departmentNo}
            onChange={handleContactFormChange('departmentNo')}
            sx={{ width: { xs: '100%', sm: '33%' } }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            onClick={handleAddContactPerson}
            sx={{ minWidth: 120, flexShrink: 0 }}
          >
            Add Detail
          </Button>
        </Stack>

        {/* Contact persons table */}
        {contactPersons.length > 0 && (
          <TableContainer sx={{ mt: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                    },
                  }}
                >
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Department No</TableCell>
                  <TableCell align="center" sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {contactPersons.map((person) => (
                  <TableRow key={person.id} hover>
                    <TableCell>{person.name}</TableCell>
                    <TableCell>{person.email}</TableCell>
                    <TableCell>{person.phone}</TableCell>
                    <TableCell>{person.departmentNo}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveContactPerson(person.id)}
                      >
                        <Iconify icon="mingcute:close-fill" width={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Card sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
          CONSIGNEE DETAIL
        </Typography>

        <Box
          rowGap={3}
          columnGap={2}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(3, 1fr)',
          }}
        >
          <TextField name="consigneeName" label="Consignee Name" value={formData.consigneeName} onChange={handleFormChange} />
          <TextField name="consigneeCity" label="City" value={formData.consigneeCity} onChange={handleFormChange} />
          <TextField name="consigneeCountry" label="Country" value={formData.consigneeCountry} onChange={handleFormChange} />
          <TextField name="addressLine1" label="Address Line 1" value={formData.addressLine1} onChange={handleFormChange} />
          <TextField name="addressLine2" label="Address Line 2" value={formData.addressLine2} onChange={handleFormChange} />
        </Box>
      </Card>

      <Card sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
          BANK DETAIL
        </Typography>

        <Box
          rowGap={3}
          columnGap={2}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(3, 1fr)',
          }}
        >
          <TextField name="titleOfAccount" label="Title Of Account" value={formData.titleOfAccount} onChange={handleFormChange} />
          <TextField name="bankName" label="Bank Name" value={formData.bankName} onChange={handleFormChange} />
          <TextField name="bankBranch" label="Bank Branch" value={formData.bankBranch} onChange={handleFormChange} />
          <TextField name="accountNo" label="Account No." value={formData.accountNo} onChange={handleFormChange} />
          <TextField name="ibanNo" label="IBAN No." value={formData.ibanNo} onChange={handleFormChange} />
        </Box>
      </Card>

      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3, mb: 5 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/dashboard/customers')}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
        >
          Save
        </Button>
      </Stack>
    </Container>
  );
}
