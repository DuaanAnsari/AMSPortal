import React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from '@mui/material';
import Chart from 'react-apexcharts';
import { useMockedUser } from 'src/hooks/use-mocked-user';
import { SeoIllustration } from 'src/assets/illustrations';
import { _appAuthors, _appRelated, _appFeatured, _appInvoices, _appInstalled } from 'src/_mock';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSettingsContext } from 'src/components/settings';

// Icons for new cards
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScienceIcon from '@mui/icons-material/Science';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import InventoryIcon from '@mui/icons-material/Inventory';
import AnalyticsIcon from '@mui/icons-material/Analytics';

// ✅ Compact card style
const cardStyle = {
  borderRadius: 2,
  boxShadow: '0px 3px 12px rgba(0,0,0,0.05)',
  background: '#fff',
  transition: '0.3s',
  '&:hover': {
    boxShadow: '0px 5px 18px rgba(0,0,0,0.1)',
    transform: 'translateY(-3px)',
  },
};

// ----------------------------------------------------------------------

export default function OverviewAppView() {
  const { user } = useMockedUser();
  const theme = useTheme();
  const settings = useSettingsContext();

  const chartOptions = {
    chart: {
      id: 'weekly-shipment',
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#e53935', '#1e88e5'],
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['29-Mar-2023', '05-Apr-2023', '12-Apr-2023', '19-Apr-2023', '26-Apr-2023'],
      labels: { style: { fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { fontSize: '12px' } },
      title: { text: 'Quantity (Pcs)', style: { fontWeight: 600 } },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      markers: { radius: 12 },
    },
    grid: { strokeDashArray: 4 },
  };

  const chartSeries = [
    {
      name: 'Pcs Booked',
      data: [15000, 5000, 20000, 9000, 35000],
    },
    {
      name: 'Pcs Shipped',
      data: [4000, 70000, 10000, 3000, 28000],
    },
  ];

  const upcomingShipments = [
    {
      po: '202248',
      merchandiser: 'MUHAMMAD',
      customer: 'Ultimate',
      vendor: 'K-TEX',
      qty: 8352,
      buyerShipDate: '05 Jun 2025',
      days: 21,
    },
    {
      po: '202520',
      merchandiser: 'SHAHZAIB',
      customer: 'Apparel, Inc',
      vendor: 'K-TEX',
      qty: 2208,
      buyerShipDate: '05 Jun 2025',
      days: 18,
    },
    {
      po: '42924-Denim',
      merchandiser: 'MUHAMMAD',
      customer: 'NORTH',
      vendor: 'M.A',
      qty: 900,
      buyerShipDate: '10 Jun 2025',
      days: 14,
    },
  ];

  const shipmentDelayStatus = [
    {
      po: '202248',
      merchandiser: 'MUHAMMAD',
      customer: 'Ultimate',
      vendor: 'K-TEX',
      qty: 8352,
      invoiceValue: 0,
      vendorShipDate: '24 Mar 2025',
      days: -45,
      email: 'Email',
      revisedShipB: '—',
      revisedShipV: '—',
    },
    {
      po: '202520',
      merchandiser: 'SHAHZAIB',
      customer: 'Apparel, Inc',
      vendor: 'K-TEX',
      qty: 2208,
      invoiceValue: 0,
      vendorShipDate: '24 Mar 2025',
      days: -45,
      email: 'Email',
      revisedShipB: '—',
      revisedShipV: '—',
    },
  ];

  const Complete = [
    {
      po: 'PO-2301',
      merchandiser: 'Ahmed Khan',
      customer: "Levi's",
      vender: 'Alpha Textiles',
      qty: 1200,
      factoryCommitDate: '2025-10-20',
      days: 5,
      status: 'Pending',
      remarks: 'Awaiting final inspection',
    },
    {
      po: 'PO-2302',
      merchandiser: 'Fatima Noor',
      customer: 'Uniqlo',
      vender: 'Modern Weaves',
      qty: 950,
      factoryCommitDate: '2025-10-22',
      days: 7,
      status: 'Processing',
      remarks: 'Fabric in production',
    },
  ];

  const completedShipments = [
    {
      po: 'PO-2401',
      merchandiser: 'Ayesha Malik',
      customer: 'H&M',
      vender: 'StylePro Ltd',
      qtyCompletedDate: '2025-09-20',
      buyerShipDate: '2025-09-25',
      venderShipDate: '2025-09-24',
      status: 'Completed',
      remarks: 'Delivered successfully',
      days: 3,
      email: 'ayesha@hm.com',
    },
    {
      po: 'PO-2402',
      merchandiser: 'Usman Tariq',
      customer: 'Zara',
      vender: 'Elite Apparels',
      qtyCompletedDate: '2025-09-22',
      buyerShipDate: '2025-09-27',
      venderShipDate: '2025-09-26',
      status: 'Completed',
      remarks: 'Shipment cleared',
      days: 4,
      email: 'usman@zara.com',
    },
  ];

  const data = [
    { name: 'Comfort apparel', Capacity: 300000, 'Qty Booked': 280000, 'Balance Capacity': 20000 },
    { name: 'K-TEX', Capacity: 80000, 'Qty Booked': 50000, 'Balance Capacity': 30000 },
    { name: 'M.A Enterprises', Capacity: 180000, 'Qty Booked': 130000, 'Balance Capacity': 50000 },
  ];

  const totalBalanceCapacity = 1460374;

  const dataSets = [
    {
      title: 'TNA Delay Orders',
      data: [
        { name: 'MUHAMMAD SHAHZAIB', value: 60 },
        { name: 'SAAD AHMED KHAN', value: 40 },
      ],
      label: 'Merchandisers',
    },
    {
      title: 'Shipping TNA Delay Orders',
      data: [
        { name: 'MEHWISH RIAZ', value: 95 },
        { name: 'SHAZIA REHMAN', value: 5 },
      ],
      label: 'Shipping Person',
    },
    {
      title: 'Merchandiser Not Assigned Our Team Members',
      data: [{ name: 'MUHAMMAD SHAHZAIB', value: 100 }],
      label: 'Merchandisers',
    },
  ];

  const COLORS = ['#1976d2', '#ff7300'];

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        {/* 🔹 REPLACED CARDS SECTION - 9 New Cards */}

        {/* 🔹 1. Open Orders */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <AssessmentIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Open Orders
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={700}>
                112
              </Typography>
              <Typography variant="caption" color="text.secondary">
                +2.6% from last week
              </Typography>
              <Chart
                type="line"
                height={100}
                series={[{ name: 'Orders', data: [5, 18, 12, 51, 68, 11, 39, 37] }]}
                options={{
                  chart: { toolbar: { show: false }, zoom: { enabled: false } },
                  stroke: { curve: 'smooth', width: 2 },
                  grid: { show: false },
                  xaxis: { labels: { show: false }, axisBorder: { show: false } },
                  yaxis: { show: false },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 🔹 2. Qty Booked */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <ScienceIcon color="info" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Qty Booked
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={700}>
                309,210
              </Typography>
              <Typography variant="caption" color="text.secondary">
                +0.2% this week
              </Typography>
              <Chart
                type="bar"
                height={100}
                series={[{ data: [20, 41, 63, 33, 28, 35, 50, 46, 11, 26] }]}
                options={{
                  chart: { toolbar: { show: false } },
                  plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
                  xaxis: { show: false },
                  yaxis: { show: false },
                  grid: { show: false },
                  colors: ['#2196f3'],
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 🔹 3. Qty Booked This Week */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <FactCheckIcon color="warning" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Qty Booked This Week
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={700}>
                12,450
              </Typography>
              <Typography variant="caption" color="text.secondary">
                -0.1% vs last week
              </Typography>
              <Chart
                type="donut"
                height={120}
                series={[44, 55, 13, 33]}
                options={{
                  chart: { toolbar: { show: false } },
                  legend: { show: false },
                  dataLabels: { enabled: false },
                  colors: ['#fbbf24', '#f59e0b', '#fcd34d', '#fde68a'],
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 🔹 4. Qty Ship This Week */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <LocalShippingIcon color="success" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Qty Ship This Week
                </Typography>
              </Box>

              <Chart
                type="radialBar"
                height={160}
                series={[76]}
                options={{
                  plotOptions: {
                    radialBar: {
                      hollow: { size: '55%' },
                      dataLabels: {
                        name: { show: false },
                        value: {
                          show: true,
                          fontSize: '20px',
                          fontWeight: 600,
                          color: '#4caf50',
                          offsetY: 10, // 👈 Center vertically
                          formatter: (val) => `${val}%`, // 👈 Show with %
                        },
                      },
                    },
                  },
                  colors: ['#4caf50'],
                }}
              />

              <Typography align="center" variant="caption" color="text.secondary">
                +2.6% this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* 🔹 5. Qty Booked Last Week */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <ShowChartIcon color="info" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Qty Booked Last Week
                </Typography>
              </Box>
              <Typography variant="h6">28,380</Typography>
              <Chart
                type="area"
                height={100}
                series={[{ data: [10, 41, 35, 51, 49, 62, 69, 91] }]}
                options={{
                  chart: { toolbar: { show: false } },
                  dataLabels: { enabled: false },
                  stroke: { curve: 'smooth' },
                  grid: { show: false },
                  xaxis: { show: false },
                  yaxis: { show: false },
                  colors: ['#0288d1'],
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 🔹 6. Qty Ship Last Week */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <TrendingUpIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Qty Ship Last Week
                </Typography>
              </Box>
              <Typography variant="h6">38,484</Typography>
              <Chart
                type="pie"
                height={120}
                series={[44, 55, 13, 43, 22]}
                options={{
                  chart: { toolbar: { show: false } },
                  legend: { show: false },
                  dataLabels: { enabled: false },
                  colors: ['#42a5f5', '#26c6da', '#66bb6a', '#ffa726', '#ab47bc'],
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 🔹 7. Pending Deliveries */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <InventoryIcon color="error" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Pending Deliveries
                </Typography>
              </Box>
              <Typography variant="h6">92</Typography>
              <Chart
                type="bar"
                height={100}
                series={[{ data: [10, 15, 20, 30, 50, 60, 45] }]}
                options={{
                  chart: { toolbar: { show: false } },
                  plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
                  xaxis: { show: false },
                  yaxis: { show: false },
                  grid: { show: false },
                  colors: ['#ef5350'],
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 🔹 8. Monthly Performance */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <QueryStatsIcon color="info" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Monthly Performance
                </Typography>
              </Box>

              <Chart
                type="radialBar"
                height={180}
                series={[87]}
                options={{
                  plotOptions: {
                    radialBar: {
                      hollow: { size: '60%' },
                      dataLabels: {
                        name: { show: false },
                        value: {
                          show: true,
                          fontSize: '20px',
                          fontWeight: 600,
                          color: '#0288d1',
                          offsetY: 10, // 👈 Center vertically
                          formatter: (val) => `${val}%`, // 👈 Add percentage symbol
                        },
                      },
                    },
                  },
                  colors: ['#0288d1'],
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 🔹 9. Total Revenue */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <AnalyticsIcon color="success" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Total Revenue
                </Typography>
              </Box>
              <Typography variant="h6">$120,890</Typography>
              <Chart
                type="area"
                height={100}
                series={[{ data: [20, 40, 35, 60, 70, 90, 110] }]}
                options={{
                  chart: { toolbar: { show: false } },
                  dataLabels: { enabled: false },
                  stroke: { curve: 'smooth' },
                  grid: { show: false },
                  xaxis: { show: false },
                  yaxis: { show: false },
                  colors: ['#4caf50'],
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* REST OF THE ORIGINAL CODE REMAINS SAME */}
        {/* Quick Search & Weekly Shipment */}
        <Grid container spacing={3} alignItems="stretch">
          <Grid xs={12} md={5} lg={4.8} display="flex">
            <Card
              sx={{
                boxShadow: 3,
                borderRadius: 2,
                height: '100%',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  p: 3.5,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 8,
                    fontWeight: 700,
                    color: '#1a1a1a',
                    textAlign: 'left',
                    letterSpacing: '0.3px',
                  }}
                >
                  Quick Search
                </Typography>
                <Grid container spacing={2.5} sx={{ flexGrow: 1, alignContent: 'flex-start' }}>
                  <Grid xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Customer"
                      defaultValue="All Customer"
                      size="small"
                    >
                      <MenuItem value="All Customer">All Customer</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Supplier"
                      defaultValue="All Vendor"
                      size="small"
                    >
                      <MenuItem value="All Vendor">All Vendor</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField fullWidth label="PO No" size="small" />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField fullWidth label="Style No" size="small" />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="From Date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="To Date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: '#1976d2',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    marginBottom: '30px',
                    py: 1.4,
                    borderRadius: 1.5,
                    fontSize: '1rem',
                  }}
                >
                  Search
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} md={7} lg={7.2} display="flex">
            <Card sx={{ boxShadow: 2, borderRadius: 2, height: '100%', flex: 1 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                  Weekly Shipment
                </Typography>
                <Chart options={chartOptions} series={chartSeries} type="line" height={320} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tables and other components remain exactly the same */}
        <Grid container spacing={3}>
          {/* LEFT TABLE */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                height: '520px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: '#4682B4',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #e0e0e0',
                  pb: 1,
                }}
              >
                Next 21 Days Upcoming Shipment
              </Typography>
              <TableContainer
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  borderRadius: 2,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#bbb', borderRadius: 3 },
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {[
                        'PO#',
                        'Merchandiser',
                        'Customer',
                        'Vendor',
                        'Qty',
                        'Buyer Ship Date',
                        'Days',
                      ].map((col) => (
                        <TableCell
                          key={col}
                          sx={{
                            fontWeight: 'bold',
                            color: 'black',
                            background: '#f4efef',
                            fontSize: '0.9rem',
                            py: 1,
                          }}
                        >
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingShipments.map((row, i) => (
                      <TableRow
                        key={i}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(13, 192, 220, 0.08)' },
                          transition: '0.2s',
                        }}
                      >
                        <TableCell sx={{ py: 1 }}>{row.po}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.merchandiser}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.customer}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.vendor}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.qty}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.buyerShipDate}</TableCell>
                        <TableCell sx={{ py: 1, fontWeight: 'bold', color: '#4682B4' }}>
                          {row.days}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* RIGHT TABLE */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                height: '520px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: '#4682B4',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #e0e0e0',
                  pb: 1,
                }}
              >
                Shipment Delay Status
              </Typography>
              <TableContainer
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  borderRadius: 2,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#bbb', borderRadius: 3 },
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {[
                        'PO#',
                        'Merchandiser',
                        'Customer',
                        'Vendor',
                        'Qty',
                        'Invoice Value',
                        'Vendor Ship Date',
                        'Days',
                        'Email',
                        'Revised Ship (B)',
                        'Revised Ship (V)',
                      ].map((col) => (
                        <TableCell
                          key={col}
                          sx={{
                            fontWeight: 'bold',
                            color: 'black',
                            background: '#f4efef',
                            fontSize: '0.9rem',
                            py: 1,
                          }}
                        >
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shipmentDelayStatus.map((row, i) => (
                      <TableRow
                        key={i}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(13, 192, 220, 0.08)' },
                          transition: '0.2s',
                        }}
                      >
                        <TableCell sx={{ py: 1 }}>{row.po}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.merchandiser}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.customer}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.vendor}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.qty}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.invoiceValue}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.vendorShipDate}</TableCell>
                        <TableCell sx={{ py: 1, fontWeight: 'bold', color: '#4682B4' }}>
                          {row.days}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>{row.email}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.revisedShipB}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.revisedShipV}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Additional tables and charts remain the same */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                height: '520px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography
                variant="h7"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: '#4682B4',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #e0e0e0',
                  pb: 1,
                }}
              >
                Next 7 Days Up Coming PP Samples to Buyer
              </Typography>
              <TableContainer
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  borderRadius: 2,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#bbb', borderRadius: 3 },
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {[
                        'PO#',
                        'Merchandiser',
                        'Customer',
                        'Vender',
                        'Qty',
                        'Factory Commitment Date',
                        'Days',
                        'Status',
                        'Remarks',
                      ].map((col) => (
                        <TableCell
                          key={col}
                          sx={{
                            fontWeight: 'bold',
                            color: 'black',
                            background: '#f4efef',
                            fontSize: '0.9rem',
                            py: 1,
                          }}
                        >
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Complete.map((row, i) => (
                      <TableRow
                        key={i}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(13, 192, 220, 0.08)' },
                          transition: '0.2s',
                        }}
                      >
                        <TableCell sx={{ py: 1 }}>{row.po}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.merchandiser}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.customer}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.vender}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.qty}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.factoryCommitDate}</TableCell>
                        <TableCell sx={{ py: 1, fontWeight: 'bold', color: '#4682B4' }}>
                          {row.days}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>{row.status}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                height: '520px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: '#4682B4',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #e0e0e0',
                  pb: 1,
                }}
              >
                PP Samples to Buyer Delay Status
              </Typography>
              <TableContainer
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  borderRadius: 2,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: '#bbb', borderRadius: 3 },
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {[
                        'PO#',
                        'Merchandiser',
                        'Customer',
                        'Vender',
                        'Qty Completed Date',
                        'Buyer Ship Date',
                        'Vender Ship Date',
                        'Status',
                        'Remarks',
                        'Days',
                        'Email',
                      ].map((col) => (
                        <TableCell
                          key={col}
                          sx={{
                            fontWeight: 'bold',
                            color: 'black',
                            background: '#f4efef',
                            fontSize: '0.9rem',
                            py: 1,
                          }}
                        >
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {completedShipments.map((row, i) => (
                      <TableRow
                        key={i}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(13, 192, 220, 0.08)' },
                          transition: '0.2s',
                        }}
                      >
                        <TableCell sx={{ py: 1 }}>{row.po}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.merchandiser}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.customer}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.vender}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.qtyCompletedDate}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.buyerShipDate}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.venderShipDate}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.status}</TableCell>
                        <TableCell sx={{ py: 1 }}>{row.remarks}</TableCell>
                        <TableCell sx={{ py: 1, fontWeight: 'bold', color: '#4682B4' }}>
                          {row.days}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>{row.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              background: '#fff',
              color: '#333',
              border: '1px solid #eee',
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h5" fontWeight={400} sx={{ color: '#555' }}>
                Vendor Capacity Utilization
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ color: '#555', fontWeight: 500, fontSize: '1.0rem' }}
              >
                Total Balance Capacity: {totalBalanceCapacity.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data}
                  margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis
                    type="number"
                    stroke="#666"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: '#333' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      color: '#333',
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: '#555',
                      fontSize: '0.8rem',
                      paddingTop: '10px',
                      display: 'flex',
                      justifyContent: 'center',
                      paddingBottom: '10px',
                    }}
                    verticalAlign="top"
                    align="center"
                    height={36}
                  />
                  <Bar dataKey="Capacity" fill="#4682B4" name="Capacity" />
                  <Bar dataKey="Qty Booked" fill="#3CB371" name="Qty Booked" />
                  <Bar dataKey="Balance Capacity" fill="#aad1d1ff" name="Balance Capacity" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Box sx={{ mt: 5, width: '100%' }}>
          <Grid container spacing={3}>
            {dataSets.map((chart, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    textAlign: 'center',
                    height: '100%',
                    minHeight: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {chart.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {chart.label}
                  </Typography>
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chart.data}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          labelLine={false}
                        >
                          {chart.data.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value}%`, name]}
                          contentStyle={{
                            fontSize: 13,
                            borderRadius: '8px',
                            background: '#fff',
                            border: '1px solid #ddd',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          formatter={(value) => (
                            <span style={{ fontSize: 13, color: '#555' }}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Grid>
    </Container>
  );
}
