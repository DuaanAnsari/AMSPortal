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
  LinearProgress,
  TablePagination,
  Button,
  Stack,
  OutlinedInput,
  ListItemText,
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
    dropdown1: [],
    dropdown2: [],
  });

  const [merchAssistantOptions, setMerchAssistantOptions] = useState([]);
  const [qaList, setQaList] = useState([]);
  const [printQaList, setPrintQaList] = useState([]);
  const [shippingList, setShippingList] = useState([]);
  const [productionList, setProductionList] = useState([]);
  const [rows, setRows] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ✅ Fetch Process Data
  useEffect(() => {
    const fetchProcessData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('❌ Token not found in localStorage!');
          setLoading(false);
          return;
        }

        console.log('🔑 Fetching process data for POID:', id);

        const response = await axios.get(
          `${API_BASE_URL}/api/Milestone/GetProcessByTNAChartIdChange1?POID=${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ API Response DATA:', response.data);

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log('✅ First item keys:', Object.keys(response.data[0]));

          // ✅ Fix: Use correct field name 'idealDate' instead of 'idealDateee'
          const formattedData = response.data.map((item, index) => {
            const targetDateValue = item.idealDate || ''; // ✅ Correct key
            return {
              id: item.id || index + 1,
              processRoute: item.processRoute || item.process || item.route || '',
              targetDate: targetDateValue,
              factoryCommitmentDate: targetDateValue ? dayjs(targetDateValue) : null, // ✅ Copy from Target Date
              submissionDate: item.submissionDate ? dayjs(item.submissionDate) : null,
              approvalDate: null,
              quantityCompleted: item.quantityCompleted || item.quantity || '',
              unit: item.units || '',
              status: item.status || '',
              remarks: item.remarks || '',
            };
          });

          setRows(formattedData);
          console.log('✅ Rows set successfully, length:', formattedData.length);
        } else {
          console.log('❌ No data or empty array received');
          setRows([]);
        }
      } catch (error) {
        console.error('❌ Error fetching process data:', error);
        console.error('❌ Error details:', error.response?.data);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProcessData();
    } else {
      setLoading(false);
    }
  }, [id]);

  // ✅ Fetch PO Data
  const getApiResponse = async () => {
    try {
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
    }
  };

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
  }, [id]);

  const handleDropdownChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleChange = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LinearProgress color="primary" />
      </Box>
    );
  }
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* 🔹 Page Heading */}
        <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 'bold' }}>
          Milestone View
        </Typography>

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
          <Stack direction="column" spacing={2}>
            {/* 🔹 Bottom Row: 4 buttons on left, Show Not Applicable Process on right */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              rowGap={2}
            >
              <Button
                variant="outlined"
                color="primary"
                sx={{
                  minWidth: 250,
                  py: 1,
                  fontWeight: 600,
                  borderWidth: 2,
                  textAlign: 'right',
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                Show Not Applicable Process
              </Button>
              {/* Left: 4 Buttons */}
              <Stack
                direction="row"
                spacing={2.5}
                flexWrap="wrap"
                useFlexGap
              >
                <Button variant="contained" color="primary" sx={{ minWidth: 220, py: 1, mt: 2 }}>
                  Not Applicable
                </Button>
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
            </Stack>
          </Stack>
        </Card>

        {/* 🔹 Table Section with Pagination */}
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    {[
                      'Process Route',
                      'Target Date',
                      'Factory Commitment Date',
                      'Submission Date',
                      'Approval Date',
                      'Quantity Completed',
                      'Unit',
                      'Status',
                      'Remarks',
                      'Select',
                      'History',
                    ].map((head, i) => (
                      <TableCell
                        key={i}
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '14px',
                          textAlign: 'center',
                          color: 'white',
                        }}
                      >
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.processRoute}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{row.targetDate}</TableCell>

                        {/* ✅ Factory Commitment Date - Shows idealDateee from API */}
                        <TableCell sx={{ textAlign: 'center', minWidth: '180px' }}>
                          <DatePicker
                            value={row.factoryCommitmentDate}
                            onChange={(val) =>
                              handleDateChange(row.id, 'factoryCommitmentDate', val)
                            }
                            slotProps={{
                              textField: {
                                size: 'small',
                                sx: { width: '160px' },
                              },
                            }}
                          />
                        </TableCell>

                        {/* ✅ Submission Date - Larger Field */}
                        <TableCell sx={{ textAlign: 'center', minWidth: '180px' }}>
                          <DatePicker
                            value={row.submissionDate}
                            onChange={(val) => handleDateChange(row.id, 'submissionDate', val)}
                            slotProps={{
                              textField: {
                                size: 'small',
                                sx: { width: '160px' },
                              },
                            }}
                          />
                        </TableCell>

                        {/* ✅ Approval Date - Larger Field & Default Data Removed */}
                        <TableCell sx={{ textAlign: 'center', minWidth: '180px' }}>
                          <DatePicker
                            value={row.approvalDate}
                            onChange={(val) => handleDateChange(row.id, 'approvalDate', val)}
                            slotProps={{
                              textField: {
                                size: 'small',
                                sx: { width: '160px' },
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <TextField
                            value={row.quantityCompleted}
                            size="small"
                            onChange={(e) =>
                              handleChange(row.id, 'quantityCompleted', e.target.value)
                            }
                            sx={{ width: '80px' }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{row.unit}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <FormControl fullWidth size="small">
                            <Select
                              value={row.status}
                              onChange={(e) => handleChange(row.id, 'status', e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>Select</em>
                              </MenuItem>
                              <MenuItem value="Pending">Pending</MenuItem>
                              <MenuItem value="In Progress">In Progress</MenuItem>
                              <MenuItem value="Completed">Completed</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={row.remarks}
                            size="small"
                            onChange={(e) => handleChange(row.id, 'remarks', e.target.value)}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Checkbox color="secondary" />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <IconButton color="primary">
                            <History fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                        <Typography variant="h6" color="textSecondary">
                          📭 No data found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* ✅ Pagination Component */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: '1px solid #e0e0e0',
              }}
            />
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
}