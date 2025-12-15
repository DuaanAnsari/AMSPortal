import React, { useState, useEffect, useRef } from 'react';
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
import BarChartIcon from '@mui/icons-material/BarChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import PieChartIcon from '@mui/icons-material/PieChart';


// ✅ Compact card style
const cardStyle = {
  borderRadius: 2,
  boxShadow: '0px 3px 12px rgba(0,0,0,0.05)',
  bgcolor: 'background.paper',
  transition: '0.3s',
};

const cardHoverSx = {
  '&:hover': {
    boxShadow: '0px 5px 18px rgba(0,0,0,0.1)',
    transform: 'translateY(-3px)',
  },
};

const openOrdersCardSx = {
  borderRadius: 3,
  boxShadow: '0 20px 30px rgba(15, 76, 129, 0.08)',
  bgcolor: 'background.paper',
  border: '1px solid rgba(25, 118, 210, 0.2)',
  color: 'text.primary',
};

const premiumChart = {
  gradient: {
    enabled: true,
    shade: 'light',
    type: 'horizontal',
    gradientToColors: ['#90caf9', '#e3f2fd'],
    opacityFrom: 0.9,
    opacityTo: 0.4,
    stops: [0, 60, 100],
  },
  dropShadow: {
    enabled: false,
  },
};


const chartTypes = ['line', 'bar', 'donut'];

const lineBarOptions = {
  chart: { toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent' },
  stroke: { curve: 'smooth', width: 3 },
  grid: {
    show: true,
    borderColor: 'rgba(25,118,210,0.2)',
    strokeDashArray: 4,
  },
  colors: ['#1e88e5', '#64b5f6'],
  tooltip: {
    theme: 'dark',
    style: { color: '#fff', fontWeight: 600 },
  },
  xaxis: { labels: { show: false }, axisBorder: { show: false } },
  yaxis: { show: false },
  legend: { show: true, position: 'bottom', markers: { width: 10, height: 10 } },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'vertical',
      opacityFrom: 0.85,
      opacityTo: 0.25,
      stops: [0, 65, 100],
    },
  },
};

const circularOptions = {
  labels: ['Shipped On Time', 'Delayed', 'Other'],
  chart: { toolbar: { show: false }, background: 'transparent' },
  legend: { position: 'bottom', labels: { colors: ['text.primary'] } },
  plotOptions: {
    radialBar: {
      hollow: { size: '60%' },
      dataLabels: { name: { color: 'text.primary' }, value: { color: 'text.primary', fontWeight: 600 } },
    },
    pie: {
      donut: { size: '72%' },
    },
  },
  tooltip: { theme: 'dark', style: { color: '#fff', fontWeight: 600 } },
  fill: { colors: ['#1976d2', '#64b5f6', '#ffb74d'], type: 'gradient' },
};

// ----------------------------------------------------------------------

function AppChartCard({ title, icon, total, percent, defaultType, colors, chartSeries, labels, disableHover, chartOptions = {}, availableTypes = ['line', 'bar', 'donut'] }) {
  const theme = useTheme();
  const [chartType, setChartType] = useState(defaultType || availableTypes[0]);

  const handleToggleChart = () => {
    const currentIndex = availableTypes.indexOf(chartType);
    const nextIndex = (currentIndex + 1) % availableTypes.length;
    setChartType(availableTypes[nextIndex]);
  };

  const nextChartType = availableTypes[(availableTypes.indexOf(chartType) + 1) % availableTypes.length];

  return (
    <Card sx={{ ...cardStyle, borderRadius: 3, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)', border: '1px solid rgba(145, 158, 171, 0.24)', ...(!disableHover && cardHoverSx) }}>
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Box display="flex" alignItems="center" gap={1}>
            {icon}
            <Typography variant="subtitle2" fontWeight={600}>
              {title}
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: '#e3f2fd',
              color: '#0b1f33',
              borderColor: 'rgba(25,118,210,0.8)',
              '&:hover': {
                backgroundColor: '#e3f2fd',
                color: '#0b1f33',
                borderColor: 'rgba(25,118,210,0.8)',
              },
              '& .MuiSvgIcon-root': { transition: 'color 0.2s' },
              '&:hover .MuiSvgIcon-root': { color: '#0b1f33' },
            }}
            startIcon={
              nextChartType === 'line' ? (
                <ShowChartIcon />
              ) : nextChartType === 'bar' ? (
                <BarChartIcon />
              ) : nextChartType === 'donut' ? (
                <DonutLargeIcon />
              ) : (
                <PieChartIcon />
              )
            }
            onClick={handleToggleChart}
          >
            {nextChartType.charAt(0).toUpperCase() + nextChartType.slice(1)}
          </Button>
        </Box>
        <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary', letterSpacing: '0.4px' }}>
          {total}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {percent}
        </Typography>

        <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: disableHover ? 'none' : 'auto' }}>
          {chartType === 'donut' || chartType === 'pie' ? (
            <Chart
              key={chartType}
              type={chartType === 'pie' ? 'pie' : 'donut'}
              width="100%"
              height={200}
              series={chartSeries.donut || []} // Fallback or passed data
              options={{
                labels: labels || ['Series A', 'Series B'],
                chart: {
                  toolbar: { show: false },
                  background: 'transparent',
                  animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                    animateGradually: { enabled: true, delay: 150 },
                    dynamicAnimation: { enabled: true, speed: 350 },
                  },
                  selection: { enabled: false },
                  events: disableHover ? { click: (c, w, e) => e.preventDefault(), mouseMove: (c, w, e) => e.preventDefault() } : {},
                },
                legend: {
                  position: 'bottom',
                  labels: { colors: theme.palette.text.primary },
                  onItemClick: { toggleDataSeries: !disableHover },
                  onItemHover: { highlightDataSeries: !disableHover },
                },
                dataLabels: { enabled: false },
                tooltip: { theme: 'dark', fillSeriesColor: false, enabled: !disableHover },
                states: disableHover ? {
                  normal: { filter: { type: 'none' } },
                  hover: { filter: { type: 'none' } },
                  active: { allowMultipleDataPointsSelection: false, filter: { type: 'none' } }
                } : undefined,
                plotOptions: {
                  pie: {
                    expandOnClick: !disableHover,
                    donut: {
                      size: chartType === 'donut' ? '70%' : '0%',
                      labels: {
                        show: chartType === 'donut',
                        name: { color: theme.palette.text.primary, fontSize: '14px' },
                        value: { color: theme.palette.text.primary, fontWeight: 700, fontSize: '16px' },
                      },
                    },
                  },
                },
                colors: colors, // Apply passed colors
                fill: { opacity: 1, type: 'solid' },
              }}
            />
          ) : (
            <Chart
              key={chartType}
              type={chartType === 'line' ? 'area' : chartType}
              width="100%"
              height={170}
              series={chartSeries.lineBar || []}
              options={{
                chart: {
                  toolbar: { show: false },
                  zoom: { enabled: false },
                  background: 'transparent',
                  selection: { enabled: false },
                  events: disableHover ? { click: (c, w, e) => e.preventDefault(), mouseMove: (c, w, e) => e.preventDefault() } : {},
                },
                plotOptions: {
                  bar: { columnWidth: '100%', borderRadius: 3, distributed: true },
                },
                dataLabels: { enabled: false },
                colors: colors, // Apply passed colors
                stroke: { curve: 'smooth', width: 3 },
                grid: {
                  show: true,
                  borderColor: 'rgba(28,123,184,0.1)',
                  strokeDashArray: 4,
                  xaxis: { lines: { show: false } },
                  yaxis: { lines: { show: false } },
                },
                xaxis: { labels: { show: false }, axisBorder: { show: false } },
                yaxis: { show: false, ...chartOptions?.yaxis },
                legend: {
                  show: true,
                  fontSize: '12px',
                  markers: { width: 8, height: 8 },
                  labels: { colors: 'text.primary' },
                  onItemClick: { toggleDataSeries: !disableHover },
                  onItemHover: { highlightDataSeries: !disableHover },
                },
                tooltip: { theme: 'dark', enabled: !disableHover },
                states: disableHover ? {
                  normal: { filter: { type: 'none' } },
                  hover: { filter: { type: 'none' } },
                  active: { allowMultipleDataPointsSelection: false, filter: { type: 'none' } }
                } : undefined,
                fill: {
                  type: 'gradient',
                  gradient: {
                    shade: 'light',
                    type: 'vertical',
                    opacityFrom: 0.8,
                    opacityTo: 0.2,
                    stops: [0, 70, 100],
                  },
                },
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function OverviewAppView() {
  const { user } = useMockedUser();
  const theme = useTheme();
  const settings = useSettingsContext();

  const [cardData, setCardData] = useState({
    lblChart1V: 112,
    lblChart2V: 309210,
    lblChart3V: 0,
    lblChart4V: 0,
    lblChart5V: 0,
    lblChart6V: 0,
    lblChart7V: 0,
    lblChart8V: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://192.168.18.13/api/MyOrders/DashboardCardsCount', { headers });

        if (!response.ok) {
          if (response.status === 401) {
            console.error("Unauthorized");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Dashboard Card API Response:", data);

        let stats = data;
        if (Array.isArray(data) && data.length > 0) {
          stats = data[0];
        }

        // Safe update with null checks
        if (stats) {
          setCardData({
            lblChart1V: stats.lblChart1V ?? 0,
            lblChart2V: stats.lblChart2V ?? 0,
            lblChart3V: stats.lblChart3V ?? 0,
            lblChart4V: stats.lblChart4V ?? 0,
            lblChart5V: stats.lblChart5V ?? 0,
            lblChart6V: stats.lblChart6V ?? 0,
            lblChart7V: stats.lblChart7V ?? 0,
            lblChart8V: stats.lblChart8V ?? 0
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard card data:", error);
      }
    };

    fetchData();
  }, []);

  // Data for cards
  const openOrderData = {
    donut: [62, 28],
    lineBar: [
      { name: `Open Orders: ${cardData.lblChart1V}`, data: [70, 32, 22, 91, 99] },
      { name: `Qty Booked: ${cardData.lblChart2V?.toLocaleString() ?? "0"}`, data: [80, 42, 15, 55, 72] }
    ]
  };

  const qtyBookedData = {
    donut: [45, 55],
    lineBar: [{ name: 'Qty Booked', data: [20, 41, 63, 33, 28, 35, 50, 46, 11, 26] }]
  };

  // Generate linear trend data from 0 to 7 (8 points)
  const steps = 8;
  const trendData = Array.from({ length: steps }, (_, i) => {
    return cardData.lblChart4V ? Math.round((cardData.lblChart4V / 7) * i) : 0;
  });

  const value = Number(cardData.lblChart4V);
  const value2 = Number(cardData.lblChart3V);

  let stepsArray = [];
  let stepsArray2 = [];


  if (value2 === 0) {
    // 0 case → 7 zeros
    stepsArray2 = [0, 0, 0, 0, 0, 0, 0, 0];
  } else {
    const step2 = value2 / 8;
    for (let i = 1; i <= 8; i++) {
      stepsArray2.push(step2 * i);
    }
  }

  if (value === 0) {
    // 0 case → 7 zeros
    stepsArray = [0, 0, 0, 0, 0, 0, 0, 0];
  } else {
    const step = value / 8;
    for (let i = 1; i <= 8; i++) {
      stepsArray.push(step * i);
    }
  }

  console.log(stepsArray);

  const weeklyComparisonData = {
    donut: [cardData.lblChart4V, cardData.lblChart3V],
    // lineBar: [{ name: 'Booked', data: trendData }]
    lineBar: [
      { name: `Booked : ${cardData.lblChart4V?.toLocaleString() ?? "0"}`, data: stepsArray },
      { name: `Shipped: ${cardData.lblChart3V?.toLocaleString() ?? "0"}`, data: stepsArray2 }]
  };

  const value3 = Number(cardData.lblChart5V) || 0;
  const value4 = Number(cardData.lblChart6V) || 0;

  let stepsArray3 = [];
  let stepsArray4 = [];

  if (value4 === 0) {
    stepsArray4 = [0, 0, 0, 0, 0, 0, 0, 0];
  } else {
    const step4 = value4 / 8;
    for (let i = 1; i <= 8; i++) {
      stepsArray4.push(step4 * i);
    }
  }

  if (value3 === 0) {
    stepsArray3 = [0, 0, 0, 0, 0, 0, 0, 0];
  } else {
    const step3 = value3 / 8;
    for (let i = 1; i <= 8; i++) {
      stepsArray3.push(step3 * i);
    }
  }

  const qtyShipThisWeekData = {
    donut: [cardData.lblChart5V, cardData.lblChart6V],
    lineBar: [
      { name: `Booked : ${cardData.lblChart5V?.toLocaleString() ?? "0"}`, data: stepsArray3 },
      { name: `Shipped: ${cardData.lblChart6V?.toLocaleString() ?? "0"}`, data: stepsArray4 }]
  };


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

  const value5 = Number(cardData.lblChart7V) || 0;
  const value6 = Number(cardData.lblChart8V) || 0;

  let stepsArray5 = [];
  let stepsArray6 = [];

  if (value6 === 0) {
    stepsArray6 = [0, 0, 0, 0, 0, 0, 0, 0];
  } else {
    const step6 = value6 / 8;
    for (let i = 1; i <= 8; i++) {
      stepsArray6.push(step6 * i);
    }
  }

  if (value5 === 0) {
    stepsArray5 = [0, 0, 0, 0, 0, 0, 0, 0];
  } else {
    const step5 = value5 / 8;
    for (let i = 1; i <= 8; i++) {
      stepsArray5.push(step5 * i);
    }
  }

  // Renaming to match usage context or replacing existing if needed. 
  // User asked for "Qty Booked Last Week". 
  const qtyBookedLastWeekData = {
    donut: [cardData.lblChart7V, cardData.lblChart8V],
    lineBar: [
      { name: `This week : ${cardData.lblChart7V?.toLocaleString() ?? "0"}`, data: stepsArray5 },
      { name: `Last week: ${cardData.lblChart8V?.toLocaleString() ?? "0"}`, data: stepsArray6 }]
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

// Draggable horizontal scroll TableContainer (like My-Order.jsx)
function DraggableTableContainer({ children, sx, ...other }) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // same scroll speed as My-Order
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <TableContainer
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      sx={{
        cursor: isDragging ? 'grabbing' : 'grab',
        overflowX: 'auto',
        '&::-webkit-scrollbar': { height: 8 },
        '&::-webkit-scrollbar-thumb': (theme) => ({
          borderRadius: 2,
          backgroundColor: theme.palette.grey[600],
        }),
        '&::-webkit-scrollbar-track': (theme) => ({
          borderRadius: 2,
          backgroundColor: theme.palette.grey[500],
        }),
        ...sx,
      }}
      {...other}
    >
      {children}
    </TableContainer>
  );
}

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        {/* 🔹 REPLACED CARDS SECTION - 9 New Cards */}

        {/* 🔹 1. Open Orders */}
        <Grid item xs={12} md={4}>
          <AppChartCard
            title="Open Orders"
            icon={<AssessmentIcon color="primary" fontSize="small" />}
            total={cardData.lblChart1V}
            percent={`${cardData.lblChart2V?.toLocaleString() ?? 0} Quantity in these orders`}
            defaultType="line"
            colors={['#1ae8aaff', '#42a5f5']}
            chartSeries={openOrderData}
            labels={[`Open Orders: ${cardData.lblChart1V}`, `Qty Booked: ${cardData.lblChart2V?.toLocaleString() ?? "0"}`]}
            disableHover={true}
            availableTypes={['line', 'donut', 'pie']}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <AppChartCard
            title="Booked this week"
            icon={<AssessmentIcon color="primary" fontSize="small" />}
            total={cardData.lblChart4V}
            percent={`${cardData.lblChart3V?.toLocaleString() ?? 0} Quantity Shipped this week`}
            defaultType="donut"
            colors={['#1ae8aaff', '#42a5f5']}
            chartSeries={weeklyComparisonData}
            labels={[`Booked: ${cardData.lblChart4V}`, `Shipped: ${cardData.lblChart3V?.toLocaleString() ?? "0"}`]}
            disableHover={true}
            availableTypes={['line', 'donut', 'pie']}
          />
        </Grid>

        {/* 🔹 3. Weekly Status: Booked vs Shipped */}
        {/* <Grid item xs={12} md={4}>
          <AppChartCard
            title="Weekly Status"
            icon={<FactCheckIcon color="warning" fontSize="small" />}
            total={cardData.lblChart4V?.toLocaleString() ?? 0}
            percent={`Shipped: ${cardData.lblChart3V?.toLocaleString() ?? 0}`}
            defaultType="bar"
            colors={['#fbbf24', '#f59e0b', '#fcd34d', '#fde68a']}
            chartSeries={weeklyComparisonData}
            labels={['Start', 'Current']}
            chartOptions={{ yaxis: { min: 0 } }}
          />
        </Grid> */}

        {/* 🔹 4. Qty Ship This Week - Default Line */}
        <Grid item xs={12} md={4}>
          <AppChartCard
            title="Booked Last week"
            icon={<LocalShippingIcon color="success" fontSize="small" />}
            total={cardData.lblChart5V}
            percent={`${cardData.lblChart6V?.toLocaleString() ?? 0} Shipped Last week`}
            defaultType="line"
            colors={['#1ae8aaff', '#42a5f5']}
            chartSeries={qtyShipThisWeekData}
            labels={[`Booked: ${cardData.lblChart5V}`, `Shipped: ${cardData.lblChart6V?.toLocaleString() ?? "0"}`]}
            disableHover={true}
            availableTypes={['line', 'donut', 'pie']}
          />
        </Grid>
        {/* 🔹 5. Qty Booked Last Week */}
        <Grid item xs={12} md={4}>
          <AppChartCard
            title="Booked Ship this Week"
            icon={<ShowChartIcon color="info" fontSize="small" />}
            total={cardData.lblChart7V}
            percent={`${cardData.lblChart8V?.toLocaleString() ?? 0} Booked Shipped Last week`}
            defaultType="pie"
            colors={['#1ae8aaff', '#42a5f5']}
            chartSeries={qtyBookedLastWeekData}
            labels={[`This Week: ${cardData.lblChart7V}`, `Last Week: ${cardData.lblChart8V?.toLocaleString() ?? "0"}`]}
            disableHover={true}
            availableTypes={['line', 'donut', 'pie']}
          />
        </Grid>

        {/* 🔹 Vendor Capacity Utilization - Moved here to fill empty space */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              border: '1px solid rgba(145, 158, 171, 0.24)',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary' }}>
                Vendor Capacity Utilization
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 500 }}
              >
                Total Balance: {totalBalanceCapacity.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data}
                  margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                  barSize={52}
                  barCategoryGap={50} // increased gap between Comfort apparel / K-TEX / M.A Enterprises
                  barGap={10}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                  <XAxis
                    type="number"
                    stroke={theme.palette.text.secondary}
                    tick={{ fontSize: 13 }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 13, fill: theme.palette.text.primary, fontWeight: 600, textAnchor: 'end', verticalAnchor: 'middle' }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '4px',
                      color: theme.palette.text.primary,
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: theme.palette.text.secondary,
                      fontSize: '12px',
                      fontWeight: 500,
                      paddingTop: '3px',
                      display: 'flex',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                    verticalAlign="bottom"
                    align="center"
                    height={14}
                    iconSize={10}
                  />
                  <Bar dataKey="Capacity" fill="#4682B4" name="Capacity" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="Qty Booked" fill="#3CB371" name="Qty Booked" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="Balance Capacity" fill="#aad1d1ff" name="Balance Capacity" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
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
                bgcolor: 'background.paper',
                color: 'text.primary',
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
                  color: 'primary.main',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #e0e0e0',
                  pb: 1,
                }}
              >
                Next 21 Days Upcoming Shipment
              </Typography>
              <DraggableTableContainer
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
                            color: 'text.primary',
                            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f4efef',
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
              </DraggableTableContainer>
            </Paper>
          </Grid>

          {/* RIGHT TABLE */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'background.paper',
                color: 'text.primary',
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
                  color: 'primary.main',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #e0e0e0',
                  pb: 1,
                }}
              >
                Shipment Delay Status
              </Typography>
              <DraggableTableContainer
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
                            color: 'text.primary',
                            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f4efef',
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
              </DraggableTableContainer>
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
                bgcolor: 'background.paper',
                color: 'text.primary',
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
                  color: 'primary.main',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #e0e0e0',
                  pb: 1,
                }}
              >
                Next 7 Days Up Coming PP Samples to Buyer
              </Typography>
              <DraggableTableContainer
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
                            color: 'text.primary',
                            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f4efef',
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
              </DraggableTableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'background.paper',
                color: 'text.primary',
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
                  color: 'primary.main',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #e0e0e0',
                  pb: 1,
                }}
              >
                PP Samples to Buyer Delay Status
              </Typography>
              <DraggableTableContainer
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
                            color: 'text.primary',
                            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f4efef',
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
              </DraggableTableContainer>
            </Paper>
          </Grid>
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
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          formatter={(value) => (
                            <span style={{ fontSize: 13, color: theme.palette.text.secondary }}>{value}</span>
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
