import React from 'react';
import { Box, Card, Grid, TextField, Button, Typography } from '@mui/material';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';

export default function ContainerHandlingReportPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Box sx={{ width: '100%', mt: 4, px: 2 }}>
      {/* Breadcrumbs + Heading */}
      <Box sx={{ mb: 3 }}>
        <CustomBreadcrumbs
          heading="Container Handling Report"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Power Tools', href: paths.dashboard.powerTool.root },
            { name: 'Container Handling Report' },
          ]}
        />
      </Box>

      <Card
        sx={(theme) => ({
          p: 4,
          maxWidth: 900,
          bgcolor: theme.palette.background.paper,
        })}
      >
        {/* Date range */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              From :
            </Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              defaultValue={today}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              To :
            </Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              defaultValue={today}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {/* Action buttons */}
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              sx={{ textTransform: 'none', px: 5 }}
            >
              Download Excel
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              sx={{ textTransform: 'none', px: 5 }}
            >
              Download PDF
            </Button>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}






