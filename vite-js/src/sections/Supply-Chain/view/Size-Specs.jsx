import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';

export default function SizeSpecsView() {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [type, setType] = useState('');

  const poNo = location.state?.poNo || '';
  const styleNo = location.state?.styleNo || '';
  const buyer = location.state?.buyer || '';

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ py: 2 }}>
      <CustomBreadcrumbs
        heading="PO SIZE SPECS"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Purchase Orders', href: '/dashboard/supply-chain' },
          { name: 'Size Specs' },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Card
        sx={{
          p: 3,
          minHeight: 400,
          bgcolor: '#f5f8fc',
        }}
      >
        {/* Top Bar mimicking legacy layout */}
        <Box
          sx={{
            border: '1px solid #dcdcdc',
            bgcolor: '#ffffff',
            p: 3,
          }}
        >
          {/* PO / Style / Buyer row */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Typography
                variant="subtitle2"
                sx={{ color: 'text.secondary', mb: 0.5 }}
              >
                PO #:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {poNo || '-'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography
                variant="subtitle2"
                sx={{ color: 'text.secondary', mb: 0.5 }}
              >
                Style #:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {styleNo || '-'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography
                variant="subtitle2"
                sx={{ color: 'text.secondary', mb: 0.5 }}
              >
                Buyer :
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {buyer || '-'}
              </Typography>
            </Grid>
          </Grid>

          {/* Type dropdown row */}
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={4}>
              <Typography
                variant="subtitle2"
                sx={{ color: 'text.secondary', mb: 1 }}
              >
                Type
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Select</InputLabel>
                <Select
                  label="Select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  {/* Future: real type options from API */}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Placeholder content area to visually match blank body in screenshot */}
        <Box
          sx={{
            mt: 3,
            flexGrow: 1,
            minHeight: 200,
            border: '1px solid #e0e0e0',
            bgcolor: '#ffffff',
          }}
        />

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Box>
      </Card>
    </Container>
  );
}


