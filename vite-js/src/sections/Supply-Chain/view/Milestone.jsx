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
  Checkbox,
  LinearProgress,
  Button,
  Stack,
  OutlinedInput,
  ListItemText,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import TNAChart from './TNA-Chart';

export default function MilestoneView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    dropdown1: [],
    dropdown2: [],
  });

  const [merchAssistantOptions, setMerchAssistantOptions] = useState([]);
  const [qaList, setQaList] = useState([]);
  const [printQaList, setPrintQaList] = useState([]);
  const [shippingList, setShippingList] = useState([]);
  const [productionList, setProductionList] = useState([]);
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ✅ Fetch PO Data
  const getApiResponse = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/Milestone/GetPOData/${id}`, {
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
        dropdown1: [],
        dropdown2: [],
      }));
    } catch (error) {
      console.error('❌ Error fetching PO data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch CustomerID (needed by TNAChart grid)
  useEffect(() => {
    if (!id || customerId) return;
    const fetchCustomerId = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE_URL}/api/MyOrders/GetPurchaseOrder/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        const first = Array.isArray(data) ? data[0] : data;
        const cid = first?.customerID ?? first?.CustomerID ?? first?.customerid ?? first?.CustomerId ?? '';
        if (cid !== '' && cid !== null && cid !== undefined) {
          setCustomerId(String(cid));
        }
      } catch (err) {
        console.error('❌ Error fetching customerID:', err);
      }
    };
    fetchCustomerId();
  }, [id, customerId, API_BASE_URL]);

  // ✅ Other API Calls
  useEffect(() => {
    const fetchQAList = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE_URL}/api/Milestone/GetQA`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQaList(response.data || []);
      } catch (err) {
        console.error('❌ Error fetching QA list:', err);
      }
    };

    const fetchProductionList = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE_URL}/api/Milestone/GetProductionPerson`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProductionList(response.data || []);
      } catch (err) {
        console.error('❌ Error fetching Production list:', err);
      }
    };

    const fetchShippingList = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE_URL}/api/Milestone/GetShipPerson`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setShippingList(response.data || []);
      } catch (err) {
        console.error('❌ Error fetching Shipping list:', err);
      }
    };

    const fetchPrintQAList = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE_URL}/api/Milestone/GetPrintQA`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPrintQaList(response.data || []);
      } catch (err) {
        console.error('❌ Error fetching Print QA list:', err);
      }
    };

    const getMerchAssistantOptions = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/api/Milestone/GetMerchandiserAssistant`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setMerchAssistantOptions(data);
        } else if (data.userId && data.userName) {
          setMerchAssistantOptions([data]);
        }
      } catch (error) {
        console.error('❌ Error fetching merchandiser assistant:', error);
      }
    };

    fetchQAList();
    fetchProductionList();
    fetchShippingList();
    fetchPrintQAList();
    getMerchAssistantOptions();
  }, []);

  useEffect(() => {
    if (id) getApiResponse();
    else setLoading(false);
  }, [id]);

  const handleDropdownChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LinearProgress color="primary" />
      </Box>
    );
  }
  return (
    <Box sx={{ p: 3 }}>
      {/* 🔹 Page Heading */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <ArrowBackIosIcon
            sx={{
              cursor: 'pointer',
              mr: 1,
              fontSize: '1.2rem',
              color: 'primary.main',
              '&:hover': { color: 'primary.dark' },
            }}
            onClick={() => navigate(-1)}
          />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Milestone View
          </Typography>
        </Box>

        {/* 🔹 Breadcrumb Path */}
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            mb: 3,
          }}
        >
          Dashboard   .   Supply Chain
        </Typography>

        {/* 🔹 Excel Links Section */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3, p: 2 }}>
          <Stack direction="row" spacing={7} justifyContent="flex-start" alignItems="center">
            <Typography
              variant="body1"
              color="primary"
              sx={{
                cursor: 'pointer',

                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Print Milestone | Excel
            </Typography>
            <Typography
              variant="body1"
              color="primary"
              sx={{
                cursor: 'pointer',

                '&:hover': { textDecoration: 'underline' }
              }}
            >
              View Milestone | Excel
            </Typography>
            <Typography
              variant="body1"
              color="primary"
              sx={{
                cursor: 'pointer',

                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Print Milestone History | Excel
            </Typography>
            <Typography
              variant="body1"
              color="primary"
              sx={{
                cursor: 'pointer',

                '&:hover': { textDecoration: 'underline' }
              }}
            >
              PrintAnnexure | Excel
            </Typography>
          </Stack>
        </Card>

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
                    style: { color: 'green' },
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
                  InputProps={{ readOnly: true }}
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

              {/* ✅ Updated Dropdown 1 - Multiple Selection */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>

                  <Select
                    multiple
                    displayEmpty
                    value={form.dropdown1 || []}
                    onChange={(e) => handleDropdownChange('dropdown1', e.target.value)}
                    input={<OutlinedInput label="Select Options" />}
                    renderValue={(selected) =>
                      selected.length === 0 ? <em>37522-SS-RED</em> : selected.join(', ')
                    }
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 250,
                          width: 250,
                        },
                      },
                    }}
                  >
                    {['37522-SS-RED', '37522-SS-BLUSH', '37522-SS-CREAM', '37522-SS-NAVY', '37522-SS-SAGE', '37522-SS-RED'].map((option) => (
                      <MenuItem key={option} value={option}>
                        <Checkbox checked={form.dropdown1?.includes(option)} />
                        <ListItemText primary={option} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* ✅ Updated Dropdown 2 - Multiple Selection */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>

                  <Select
                    multiple
                    displayEmpty
                    value={form.dropdown2 || []}
                    onChange={(e) => handleDropdownChange('dropdown2', e.target.value)}
                    input={<OutlinedInput label="Select Options 2" />}
                    renderValue={(selected) =>
                      selected.length === 0 ? <em>37522-SS-RED</em> : selected.join(', ')
                    }
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 250,
                          width: 250,
                        },
                      },
                    }}
                  >
                    {['37522-SS-RED'].map((option) => (
                      <MenuItem key={option} value={option}>

                        <ListItemText primary={option} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Stack direction="row" spacing={2} alignItems="flex-start">
                {/* Annexure Button */}
                <Typography variant="h6" color="primary" onClick={() => window.open('#', '_blank')} sx={{ cursor: 'pointer', mt: 8, marginLeft: 4 }}>
                  Annexure
                </Typography>

                {/* Link text */}
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    cursor: 'pointer',
                    mt: 8.5 // Align with button
                  }}
                >
                  For detailed briefing on order's supply chain click here
                </Typography>
              </Stack>
            </Grid>
          </CardContent>
        </Card>

        {/* 🔹 Buttons Section - Updated Layout */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3, p: 2 }}>
          <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
            <Button variant="contained" color="primary" sx={{ minWidth: 220, py: 1, mt: 2 }}>
              Save This PO
            </Button>
            <Button variant="contained" color="primary" sx={{ minWidth: 220, py: 1, mt: 2 }}>
              Save All Child PO
            </Button>
            <Button variant="contained" color="primary" sx={{ minWidth: 220, py: 1, mt: 2 }}>
              Select All
            </Button>
          </Stack>
        </Card>

        {/* 🔹 TNA Chart Grid */}
        <TNAChart embedded initialCustomerId={customerId} initialPoid={id} />
      </Box>
  );
}