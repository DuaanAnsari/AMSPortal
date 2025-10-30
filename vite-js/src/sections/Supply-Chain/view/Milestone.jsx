import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Checkbox,
} from '@mui/material';
import { History } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';

export default function MilestoneView() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    poNumber: '',
    buyer: '',
    vendor: '',
    customer: '',
    placementDate: '',
    merchandiser: '',
    totalQty: '',
    merchandiserAssistant: '',
    shipmentDate: '',
    qa: '',
    leadTime: '',
    printQa: '',
    tnaFirstUpdate: '',
    lastTnaUpdate: '',
    poCreationDate: '',
    productionFollowup: '',
    shipping: '',
    productionStatus: '',
    masterPo: '',
    dropdown1: '',
    dropdown2: '',
  });

  // ✅ States
  const [merchAssistantOptions, setMerchAssistantOptions] = useState([]);
  const [qaList, setQaList] = useState([]);
  const [printQaList, setPrintQaList] = useState([]);
  const [shippingList, setShippingList] = useState([]);
  const [productionList, setProductionList] = useState([]);

  // ✅ Fetch QA List
  useEffect(() => {
    const fetchQAList = async () => {
      try {
        const token = localStorage.getItem('accessToken');

        const response = await axios.get('http://192.168.0.71/api/Milestone/GetQA', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ QA List:', response.data);
        setQaList(response.data || []);
      } catch (err) {
        console.error('❌ Error fetching QA list:', err);
      }
    };

    fetchQAList();
  }, []);

  useEffect(() => {
    const fetchProcessData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('❌ Token not found in localStorage!');
          return;
        }

        console.log('🔑 Using token:', token);

        const response = await axios.get(
          `http://192.168.0.71/api/Milestone/GetProcessByTNAChartIdChange1?POID=${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ API Response:', response.data);
        setRows(response.data);
      } catch (error) {
        console.error('❌ Error fetching process data:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
    };

    if (id) fetchProcessData();
  }, [id]);

  useEffect(() => {
    const fetchProductionList = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get('http://192.168.0.71/api/Milestone/GetProductionPerson', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Production Followup List:', response.data);
        setProductionList(response.data || []);
      } catch (err) {
        console.error('❌ Error fetching Production Followup list:', err);
      }
    };

    fetchProductionList();
  }, []);

  useEffect(() => {
    const fetchShippingList = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get('http://192.168.0.71/api/Milestone/GetShipPerson', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Shipping List:', response.data);
        setShippingList(response.data || []);
      } catch (err) {
        console.error('❌ Error fetching Shipping list:', err);
      }
    };

    fetchShippingList();
  }, []);

  useEffect(() => {
    const fetchPrintQAList = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get('http://192.168.0.71/api/Milestone/GetPrintQA', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Print QA List:', response.data);
        setPrintQaList(response.data || []);
      } catch (err) {
        console.error('❌ Error fetching Print QA list:', err);
      }
    };

    fetchPrintQAList();
  }, []);

  // ✅ Fetch PO Data API
  const getApiResponse = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://192.168.0.71/api/Milestone/GetPOData/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const result = await response.json();

      setForm((prev) => ({
        ...prev,
        poNumber: result.poNo || '',
        buyer: result.buyer || '',
        vendor: result.venderName || '',
        customer: result.customerName || '',
        placementDate: result.placemDate || '',
        merchandiser: result.merchant || '',
        totalQty: result.totalQty || '',
        merchandiserAssistant: '',
        shipmentDate: result.shipDate || '',
        qa: '',
        leadTime: result.leadTime?.toString() || '',
        printQa: '',
        tnaFirstUpdate: 'Not Update Yet',
        lastTnaUpdate: result.lastTNAUpdateDate || '',
        poCreationDate: result.poCreatedDate || '',
        productionFollowup: '',
        shipping: '',
        productionStatus: '',
        masterPo: result.masterPO || '',
      }));
    } catch (error) {
      console.error('❌ Error fetching PO data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Merchandiser Assistant options API
  const getMerchAssistantOptions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://192.168.0.71/api/Milestone/GetMerchandiserAssistant', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setMerchAssistantOptions(data);
      } else if (data.userId && data.userName) {
        setMerchAssistantOptions([data]);
      }
    } catch (error) {
      console.error('❌ Error fetching merchandiser assistant options:', error);
    }
  };

  useEffect(() => {
    if (id) getApiResponse();
    getMerchAssistantOptions();
  }, [id]);

  // ✅ Dropdown handler
  const handleDropdownChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Table demo data
  const [rows, setRows] = useState([
    {
      id: 1,
      route: 'TP/ART Sent To Factory',
      target: 'May 21, 2025',
      factoryCommit: dayjs('2025-05-21'),
      submission: null,
      approval: null,
      quantity: 0,
      unit: 'N/A',
      status: '',
      remarks: '',
    },
    {
      id: 2,
      route: 'Yarn Booking',
      target: 'May 24, 2025',
      factoryCommit: dayjs('2025-05-24'),
      submission: null,
      approval: null,
      quantity: 0,
      unit: '%',
      status: '',
      remarks: '',
    },
  ]);

  const handleDateChange = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleChange = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  if (loading) return <Typography sx={{ p: 3 }}>⏳ Loading data...</Typography>;

  // ✅ Rest of your return JSX below this line (unchanged)

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Milestone View
        </Typography>

        {/* 🔹 Form Section */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              {/* Row 1 */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="P.O Number"
                  value={form.poNumber}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buyer"
                  value={form.buyer}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Vendor"
                  value={form.vendor}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              {/* Row 2 */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Customer"
                  value={form.customer}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Placement Date"
                  value={form.placementDate}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Merchandiser"
                  value={form.merchandiser}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              {/* Row 3 */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Total Quantity"
                  value={form.totalQty}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Merchandiser Assistant</InputLabel>
                  <Select
                    label="Merchandiser Assistant"
                    value={form.merchandiserAssistant}
                    onChange={(e) => handleDropdownChange('merchandiserAssistant', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    {merchAssistantOptions.map((assistant) => (
                      <MenuItem key={assistant.userId} value={assistant.userName}>
                        {assistant.userName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Shipment Date"
                  value={form.shipmentDate}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              {/* Row 4 */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>QA</InputLabel>
                  <Select
                    label="QA"
                    value={form.qa}
                    onChange={(e) => handleDropdownChange('qa', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    {qaList.map((item) => (
                      <MenuItem key={item.userName} value={item.userName}>
                        {item.userName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Lead Time"
                  value={form.leadTime}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Print QA</InputLabel>
                  <Select
                    label="Print QA"
                    value={form.printQa}
                    onChange={(e) => handleDropdownChange('printQa', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    {printQaList.length > 0 ? (
                      printQaList.map((qa) => (
                        <MenuItem key={qa.userId} value={qa.userName}>
                          {qa.userName}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No data</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Row 5 */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="TNA First Update"
                  value={form.tnaFirstUpdate}
                  InputProps={{
                    readOnly: true,
                    style: { color: 'green' }, // text color
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Last TNA Update"
                  value={form.lastTnaUpdate}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="PO Creation Date"
                  value={form.poCreationDate}
                  InputProps={{ readOnly: true, style: { color: 'red' } }}
                />
              </Grid>

              {/* Row 6 */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Production Followup</InputLabel>
                  <Select
                    label="Production Followup"
                    value={form.productionFollowup}
                    onChange={(e) => handleDropdownChange('productionFollowup', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    {productionList.length > 0 ? (
                      productionList.map((person) => (
                        <MenuItem key={person.userId} value={person.userName}>
                          {person.userName}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No data</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Shipping</InputLabel>
                  <Select
                    label="Shipping"
                    value={form.shipping}
                    onChange={(e) => handleDropdownChange('shipping', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    {shippingList.length > 0 ? (
                      shippingList.map((person) => (
                        <MenuItem key={person.userId} value={person.userName}>
                          {person.userName}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No data</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Production Status"
                  value="N/A"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>

              {/* Row 7 */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Master PO"
                  value={form.masterPo}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <Select
                    displayEmpty
                    value={form.dropdown1}
                    onChange={(e) => handleDropdownChange('dropdown1', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    <MenuItem value="Option A">Option A</MenuItem>
                    <MenuItem value="Option B">Option B</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <Select
                    displayEmpty
                    value={form.dropdown2}
                    onChange={(e) => handleDropdownChange('dropdown2', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    <MenuItem value="Option X">Option X</MenuItem>
                    <MenuItem value="Option Y">Option Y</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 🔹 Table Section */}
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#56a2d4ff' }}>
                    {['Process Route', 'Target Date', 'Remarks'].map((head) => (
                      <TableCell key={head} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length > 0 ? (
                    rows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.process}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{row.idealDateee}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{row.remarks}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
}
