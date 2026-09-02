import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
import Iconify from 'src/components/iconify';

export default function CustomerNewView() {
  const settings = useSettingsContext();
  const navigate = useNavigate();

  const [contactPersons, setContactPersons] = useState([]);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', departmentNo: '' });

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
        heading="Create a new customer"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Customers', href: '/dashboard/customers' },
          { name: 'New customer' },
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
          <TextField name="commission" label="Commission" />
          <TextField name="name" label="Name" />
          <TextField name="principalCustomerName" label="Principal Customer Name" />

          <TextField name="brandName" label="Brand Name" />
          <TextField name="address" label="Address" />
          <TextField name="city" label="City" />

          <TextField name="state" label="State" />
          <TextField name="country" label="Country" />
          <TextField name="contactNo" label="Contact No." />

          <TextField name="faxNo" label="Fax No." />
          <TextField name="email" label="Email" />
          <TextField name="webSite" label="WebSite" />

          <FormControlLabel
            control={<Checkbox defaultChecked name="isActive" />}
            label="Is Active"
            sx={{ m: 0 }}
          />
          <TextField name="rnNo" label="RN No." />
          <TextField name="tolQuantity" label="Tol.%(Quantity)" />
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
          <TextField name="consigneeName" label="Consignee Name" />
          <TextField name="consigneeCity" label="City" />
          <TextField name="consigneeCountry" label="Country" />
          <TextField name="addressLine1" label="Address Line 1" />
          <TextField name="addressLine2" label="Address Line 2" />
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
          <TextField name="titleOfAccount" label="Title Of Account" />
          <TextField name="bankName" label="Bank Name" />
          <TextField name="bankBranch" label="Bank Branch" />
          <TextField name="accountNo" label="Account No." />
          <TextField name="ibanNo" label="IBAN No." />
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
          onClick={() => navigate('/dashboard/customers')}
        >
          Save
        </Button>
      </Stack>
    </Container>
  );
}
