import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Divider,
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
  Paper,
  TableContainer,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

// Sidebar Styling
const Sidebar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  height: '100%',
  overflowY: 'auto',
}));

// Styled TableCell
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5),
  fontSize: '0.95rem',
  whiteSpace: 'normal',
  wordWrap: 'break-word',
}));

export default function DashboardBI() {
  const theme = useTheme();
  const [openYears, setOpenYears] = useState({});

  const toggleYear = (year) => {
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const handleQuarterClick = (year, quarter) => {
    console.log(`Clicked: Year ${year}, Quarter ${quarter}`);
    // 👉 Yahan tum API call ya navigate kar sakte ho
    // fetch(`/api/data/${year}/${quarter}`)
  };

  const years = [2025, 2024, 2023];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      {/* Header */}
      <Box
        sx={{
          backgroundColor: '#eeeeee',
          color: '#000000',
          p: 2,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Typography variant="h5">QA KPI Dashboard</Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Sidebar */}
        <Grid item xs={12} md={2}>
          <Sidebar>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
              Parameters
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Parameter Checkboxes */}
            {['Inspection Type', 'P.O. #', 'VENDOR', 'FACTORY', 'QA', 'SAMPLE SIZE', 'COLOR'].map(
              (param) => (
                <FormControlLabel
                  key={param}
                  control={<Checkbox />}
                  label={param}
                  sx={{ display: 'block' }}
                />
              )
            )}

            {/* Year + Quarter Tree */}
            <Typography
              variant="subtitle1"
              sx={{ mt: 2, color: theme.palette.primary.main, fontWeight: 'bold' }}
            >
              📅 YEAR / QUARTERS
            </Typography>
            <List dense>
              {years.map((year) => (
                <Box key={year} sx={{ mb: 1 }}>
                  {/* Year */}
                  <ListItemButton
                    onClick={() => toggleYear(year)}
                    sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 'bold', color: 'text.primary' }}
                        >
                          {year}
                        </Typography>
                      }
                    />
                  </ListItemButton>

                  {/* Quarters */}
                  <Collapse in={openYears[year]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {quarters.map((q) => (
                        <ListItemButton
                          key={q}
                          sx={{ pl: 6, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                          onClick={() => handleQuarterClick(year, q)}
                        >
                          <ListItemText primary={<Typography variant="body2">{q}</Typography>} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              ))}
            </List>
          </Sidebar>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={10}>
          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              { title: 'Total Q.A.', value: 15, color: 'success.main' },
              { title: 'DHU %', value: '9%', color: 'error.main' },
              { title: 'Inspections', value: 2163, color: 'info.main' },
              { title: 'POs', value: 937, color: 'warning.main' },
              { title: 'AQL Major', value: '13k', color: 'error.main' },
              { title: 'AQL Minor', value: '19k', color: 'success.main' },
              { title: 'AQL Defects', value: '32k', color: 'success.main' },
              { title: 'Major', value: '16k%', color: 'success.main' },
              { title: 'Minor', value: '7.796', color: 'success.main' },
              { title: 'Total Defect', value: '23k', color: 'success.main' },
            ].map((kpi, i) => (
              <Grid item xs={6} sm={4} md={2.4} key={i}>
                <Card
                  sx={{
                    borderLeft: `6px solid ${theme.palette[kpi.color.split('.')[0]].main}`,
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1">{kpi.title}</Typography>
                    <Typography variant="h6" sx={{ color: kpi.color }}>
                      {kpi.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Table 1 */}
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    '% Critical',
                    '% Major',
                    '% Minor',
                    '% Total Defect',
                    'Pass %',
                    'Failed %',
                    '% Conformity',
                    '% Marking',
                    '% Measurement',
                    '% Packing',
                    '%  Quantity',
                    'Workmanship',
                  ].map((head, i) => (
                    <TableCell
                      key={i}
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        backgroundColor: '#eeeeee',
                        color: '#000000',
                        whiteSpace: 'normal',
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <StyledTableCell align="center" sx={{ color: 'error.main' }}>
                    0.23%
                  </StyledTableCell>
                  <StyledTableCell align="center">113.00%</StyledTableCell>
                  <StyledTableCell align="center">41.86%</StyledTableCell>
                  <StyledTableCell align="center">71.33%</StyledTableCell>
                  <StyledTableCell align="center">63.01%</StyledTableCell>
                  <StyledTableCell align="center" sx={{ color: 'error.main' }}>
                    36.99%
                  </StyledTableCell>
                  <StyledTableCell align="center">96.95%</StyledTableCell>
                  <StyledTableCell align="center">99.03%</StyledTableCell>
                  <StyledTableCell align="center">94.73%</StyledTableCell>
                  <StyledTableCell align="center">97.04%</StyledTableCell>
                  <StyledTableCell align="center">98.84%</StyledTableCell>
                  <StyledTableCell align="center">82.06%</StyledTableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table 2 */}
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    'Inspection Type',
                    'Total Insp.',
                    'Critical',
                    'Major',
                    'Minor',
                    'Defects',
                    'Pass',
                    'Failed',
                    'Sample Size',
                    'DHU %',
                    'Offered Qty',
                    'Ratio',
                  ].map((head, i) => (
                    <TableCell
                      key={i}
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        backgroundColor: '#eeeeee',
                        color: '#000000',
                        whiteSpace: 'normal',
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  {
                    type: 'FRI',
                    total: 20,
                    critical: 1,
                    major: 2,
                    minor: 5,
                    defects: 8,
                    pass: 15,
                    failed: 5,
                    sample: 200,
                    dhu: '4%',
                    qty: 1500,
                    ratio: '95%',
                  },
                  {
                    type: 'DUPRO',
                    total: 15,
                    critical: 0,
                    major: 1,
                    minor: 3,
                    defects: 4,
                    pass: 14,
                    failed: 1,
                    sample: 150,
                    dhu: '2%',
                    qty: 1200,
                    ratio: '97%',
                  },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <StyledTableCell>{row.type}</StyledTableCell>
                    <StyledTableCell>{row.total}</StyledTableCell>
                    <StyledTableCell>{row.critical}</StyledTableCell>
                    <StyledTableCell>{row.major}</StyledTableCell>
                    <StyledTableCell>{row.minor}</StyledTableCell>
                    <StyledTableCell>{row.defects}</StyledTableCell>
                    <StyledTableCell>{row.pass}</StyledTableCell>
                    <StyledTableCell>{row.failed}</StyledTableCell>
                    <StyledTableCell>{row.sample}</StyledTableCell>
                    <StyledTableCell
                      sx={{ color: row.dhu === '4%' ? 'error.main' : 'success.main' }}
                    >
                      {row.dhu}
                    </StyledTableCell>
                    <StyledTableCell>{row.qty}</StyledTableCell>
                    <StyledTableCell>{row.ratio}</StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table 3 */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {['PO #', 'Inspection No', 'Remarks'].map((head, i) => (
                    <TableCell
                      key={i}
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        backgroundColor: '#eeeeee',
                        color: '#000000',
                        whiteSpace: 'normal',
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { po: 'PO123', insp: 'INSP001', remarks: 'Stitches not aligned properly' },
                  { po: 'PO124', insp: 'INSP002', remarks: 'Fabric shade variation found' },
                  { po: 'PO125', insp: 'INSP003', remarks: 'Packaging issue: wrong labels' },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <StyledTableCell>{row.po}</StyledTableCell>
                    <StyledTableCell>{row.insp}</StyledTableCell>
                    <StyledTableCell>{row.remarks}</StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
