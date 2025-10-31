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
  const [rows, setRows] = useState([]);

  // ✅ Pagination States
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
          `http://192.168.0.71/api/Milestone/GetProcessByTNAChartIdChange1?POID=${id}`,
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

          // Transform API data to include all required fields
          const formattedData = response.data.map((item, index) => ({
            id: item.id || index + 1,
            processRoute: item.processRoute || item.process || item.route || '',
            targetDate: item.idealDateee || '', // ✅ idealDateee used for Target Date
            factoryCommitmentDate: item.idealDateee ? dayjs(item.idealDateee) : null, // ✅ idealDateee used for Factory Commitment Date
            submissionDate: item.submissionDate ? dayjs(item.submissionDate) : null,
            approvalDate: null, // ✅ Default data removed from Approval Date
            quantityCompleted: item.quantityCompleted || item.quantity || '',
            unit: item.unit || '',
            status: item.status || '',
            remarks: item.remarks || '',
          }));

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
    }
  };

  // ✅ Other API calls (QA, Production, Shipping, PrintQA)
  useEffect(() => {
    const fetchQAList = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get('http://192.168.0.71/api/Milestone/GetQA', {
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
        const response = await axios.get('http://192.168.0.71/api/Milestone/GetProductionPerson', {
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
        const response = await axios.get('http://192.168.0.71/api/Milestone/GetShipPerson', {
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
        const response = await axios.get('http://192.168.0.71/api/Milestone/GetPrintQA', {
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
        const response = await fetch('http://192.168.0.71/api/Milestone/GetMerchandiserAssistant', {
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

    // Run all API calls
    fetchQAList();
    fetchProductionList();
    fetchShippingList();
    fetchPrintQAList();
    getMerchAssistantOptions();
  }, []);

  useEffect(() => {
    if (id) getApiResponse();
  }, [id]);

  // ✅ Dropdown handler
  const handleDropdownChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleChange = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ✅ Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ✅ Paginated data
  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}></Typography>
        <LinearProgress color="primary" />
      </Box>
    );
  }

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