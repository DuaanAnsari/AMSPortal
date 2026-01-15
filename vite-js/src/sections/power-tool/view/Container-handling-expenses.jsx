import React from 'react';
import { Box, Card, Grid, TextField, Button, Typography, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';

export default function ContainerHandlingExpensesPage() {
  const navigate = useNavigate();

  const handleSave = () => {
    // TODO: hook this up to API when backend is ready
    navigate(paths.dashboard.powerTool.containerHandling);
  };

  const handleCancel = () => {
    navigate(paths.dashboard.powerTool.containerHandling);
  };

  const renderNumberField = (label) => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 500 }}>
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        type="number"
        defaultValue={0}
        inputProps={{ min: 0 }}
      />
    </>
  );

  const renderTextField = (label) => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 500 }}>
        {label}
      </Typography>
      <TextField fullWidth size="small" />
    </>
  );

  return (
    <Box sx={{ width: '100%', mt: 4, px: 2 }}>
      <Box sx={{ mb: 3 }}>
        <CustomBreadcrumbs
          heading="Container Handling Expenses"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Power Tools', href: paths.dashboard.powerTool.root },
            { name: 'Container Handling Expenses' },
          ]}
        />
      </Box>

      <Card
        sx={(theme) => ({
          p: 4,
          bgcolor: theme.palette.background.paper,
        })}
      >
        {/* Top row: Container, # of CTNS, Clearing */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {renderTextField('Container:')}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderNumberField('# of CTNS:')}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderNumberField('Clearing:')}
          </Grid>

          {/* Duty / Trucking / Additional trucking */}
          <Grid item xs={12} md={4}>
            {renderNumberField('Duty:')}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderNumberField('Trucking:')}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderNumberField('Additional trucking:')}
          </Grid>

          {/* Cost of pallets / Shrink wrap / Labor */}
          <Grid item xs={12} md={4}>
            {renderNumberField('Cost of Pallets:')}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderNumberField('Shrink wrap:')}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderNumberField('Labor:')}
          </Grid>
        </Grid>

        {/* Additional Charges section */}
        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Additional Charges
          </Typography>
          <Divider sx={{ mt: 1 }} />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {renderTextField('Reason 1:')}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderTextField('Reason 2:')}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderTextField('Reason 3:')}
          </Grid>

          <Grid item xs={12} md={4}>
            {renderTextField('Reason 4:')}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderTextField('Reason 5:')}
          </Grid>
          <Grid item xs={12} md={4}>
            {renderNumberField('Total Exchange:')}
          </Grid>
        </Grid>

        {/* Buttons */}
        <Box
          sx={{
            mt: 4,
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: 'none', minWidth: 160 }}
            onClick={handleSave}
          >
            Save
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: 'none', minWidth: 160 }}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </Box>
      </Card>
    </Box>
  );
}













