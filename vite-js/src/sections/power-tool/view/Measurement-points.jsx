import React, { useState } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import { paths } from 'src/routes/paths';

const TSHIRT_MEASUREMENT_ROWS = [
  { sequence: 1, point: 'Zipper', type: 'T-Shirt' },
  { sequence: 2, point: 'Hip', type: 'T-Shirt' },
  { sequence: 3, point: 'Hem', type: 'T-Shirt' },
  { sequence: 4, point: '', type: 'T-Shirt' },
  { sequence: 5, point: '', type: 'T-Shirt' },
  { sequence: 6, point: '', type: 'T-Shirt' },
  { sequence: 7, point: '', type: 'T-Shirt' },
  { sequence: 8, point: '', type: 'T-Shirt' },
  { sequence: 9, point: '', type: 'T-Shirt' },
];

export default function MeasurementPointsPage() {
  const [measurementType, setMeasurementType] = useState('');
  const [error, setError] = useState(false);
  const [manualType, setManualType] = useState(false);

  const handleAddClick = () => {
    // Toggle between dropdown and manual text entry
    setManualType((prev) => !prev);
  };

  return (
    <Box sx={{ width: '100%', mt: 4, px: 2 }}>
      <Box sx={{ mb: 3 }}>
        <CustomBreadcrumbs
          heading="Measurement Points"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Power Tools', href: paths.dashboard.powerTool.root },
            { name: 'Measurement Points' },
          ]}
        />
      </Box>

      <Card sx={(theme) => ({ p: 4, bgcolor: theme.palette.background.paper })}>
        {/* Error text */}
        {error && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 600 }}>
              Measurement Type Not Empty
            </Typography>
          </Box>
        )}

        {/* Top controls row */}
        <Grid container spacing={4} alignItems="center" sx={{ mb: 4 }}>
          {/* Measurement Type with plus icon */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              Measurement Type
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {manualType ? (
                <TextField
                  fullWidth
                  size="small"
                  value={measurementType}
                  placeholder="Type measurement"
                  onChange={(e) => {
                    setMeasurementType(e.target.value);
                    setError(false);
                  }}
                />
              ) : (
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={measurementType}
                  onChange={(e) => {
                    setMeasurementType(e.target.value);
                    setError(false);
                  }}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  <MenuItem value="T-Shirt">T-Shirt</MenuItem>
                </TextField>
              )}
              <IconButton onClick={handleAddClick} sx={{ color: '#00B8D9', p: 0 }}>
                <Iconify icon="eva:plus-fill" width={24} />
              </IconButton>
            </Box>
          </Grid>

          {/* Measurement Points */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              Measurement Points
            </Typography>
            <TextField fullWidth size="small" />
          </Grid>

          {/* Sequence */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              Sequence
            </Typography>
            <TextField fullWidth size="small" />
          </Grid>
        </Grid>

        {/* T-Shirt measurement table */}
        {measurementType === 'T-Shirt' && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button variant="contained" color="primary" sx={{ textTransform: 'none', px: 4 }}>
                Add &amp; Save
              </Button>
            </Box>

            <Box sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={(theme) => ({
                        bgcolor: theme.palette.primary.main,
                        color: '#fff',
                        fontWeight: 600,
                      })}
                    >
                      Sequence
                    </TableCell>
                    <TableCell
                      sx={(theme) => ({
                        bgcolor: theme.palette.primary.main,
                        color: '#fff',
                        fontWeight: 600,
                      })}
                    >
                      Measurement Points
                    </TableCell>
                    <TableCell
                      sx={(theme) => ({
                        bgcolor: theme.palette.primary.main,
                        color: '#fff',
                        fontWeight: 600,
                      })}
                      align="left"
                    >
                      Type
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TSHIRT_MEASUREMENT_ROWS.map((row, index) => (
                    <TableRow
                      key={row.sequence}
                      sx={
                        index === 0
                          ? (theme) => ({
                              bgcolor: theme.palette.primary.dark,
                              '& td': { color: '#fff' },
                            })
                          : undefined
                      }
                    >
                      <TableCell>{row.sequence}</TableCell>
                      <TableCell>{row.point}</TableCell>
                      <TableCell>{row.type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" color="primary" sx={{ textTransform: 'none', px: 4 }}>
                Save
              </Button>
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}


