import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    IconButton,
    Paper,
    useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import Iconify from 'src/components/iconify';

export default function CourierPackagingEntryPage() {
    const navigate = useNavigate();
    const theme = useTheme();

    // Manual Entry State
    const [manualEntry, setManualEntry] = useState({
        shipmentType: false,
        serviceRequired: false,
        amsCourierAwb: false,
    });

    const toggleManual = (field) => {
        setManualEntry((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    // Form State
    const [formData, setFormData] = useState({
        invoiceNo: 'INV/001',
        shipper: 'MUHAMMAD SHAHZAD',
        consignee: 'AMERICA WHOLESALE BLANKS',
        attention: 'MR JUNAID',
        address: 'test address',
        phone: '0321-1234567',
        awb: 'PK',
        shipmentType: 'AMS ACCOUNT',
        serviceRequired: 'REGULAR',
        amsCourierAwb: 'TCS via UK',
        account: '123',
    });

    // Detail Section State (for adding to grid)
    const [detailData, setDetailData] = useState({
        poStyle: '',
        description: '',
        quantity: '',
        price: '',
        amount: '',
        remarks: '',
    });

    // Grid Data State
    const [rows, setRows] = useState([]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleDetailChange = (event) => {
        const { name, value } = event.target;
        setDetailData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAddGrid = () => {
        if (!detailData.poStyle || !detailData.quantity) {
            // Basic check, could be more robust
            alert('Please fill at least PO Style and Quantity');
            return;
        }
        const newRow = {
            id: Date.now(),
            ...detailData,
        };
        setRows((prev) => [...prev, newRow]);
        // Clear detail fields
        setDetailData({
            poStyle: '',
            description: '',
            quantity: '',
            price: '',
            amount: '',
            remarks: '',
        });
    };

    const handleDeleteRow = (id) => {
        setRows((prev) => prev.filter((row) => row.id !== id));
    };

    const columns = [
        { field: 'poStyle', headerName: 'PO Style', flex: 1 },
        { field: 'description', headerName: 'Description', flex: 1 },
        { field: 'quantity', headerName: 'QTY', flex: 0.5 },
        { field: 'price', headerName: 'Price', flex: 0.5 },
        { field: 'amount', headerName: 'Amount', flex: 0.5 },
        { field: 'remarks', headerName: 'Remarks', flex: 1 },
        {
            field: 'action',
            headerName: 'Action',
            flex: 0.5,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <IconButton color="error" size="small" onClick={() => handleDeleteRow(params.id)}>
                    <Iconify icon="mdi:close-circle" />
                </IconButton>
            ),
        },
    ];

    return (
        <Box sx={{ width: '100%', mt: 4 }}>
            {/* 🔹 Header Section */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    color="black"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}
                >
                    Courier Packages Entry
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={() => navigate('/dashboard')}
                    >
                        Dashboard
                    </Typography>
                    <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>
                        •
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        Power Tools
                    </Typography>
                    <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>
                        •
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        Courier Packages Entry
                    </Typography>
                </Box>
            </Box>

            {/* 🔹 Form Card */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)', mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                        {/* Top Section */}
                        <Grid item xs={12}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Invoice No.</Typography>
                            <TextField fullWidth size="small" name="invoiceNo" value={formData.invoiceNo} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Shipper:</Typography>
                            <TextField select fullWidth size="small" name="shipper" value={formData.shipper} onChange={handleChange}>
                                <MenuItem value="MUHAMMAD SHAHZAD">MUHAMMAD SHAHZAD</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Consignee:</Typography>
                            <TextField select fullWidth size="small" name="consignee" value={formData.consignee} onChange={handleChange}>
                                <MenuItem value="AMERICA WHOLESALE BLANKS">AMERICA WHOLESALE BLANKS</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Attention:</Typography>
                            <TextField fullWidth size="small" name="attention" value={formData.attention} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Address:</Typography>
                            <TextField fullWidth size="small" name="address" value={formData.address} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Phone #:</Typography>
                            <TextField fullWidth size="small" name="phone" value={formData.phone} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>AWB#:</Typography>
                            <TextField fullWidth size="small" name="awb" value={formData.awb} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Shipment Type:</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                    select={!manualEntry.shipmentType}
                                    fullWidth
                                    size="small"
                                    name="shipmentType"
                                    value={formData.shipmentType}
                                    onChange={handleChange}
                                >
                                    {!manualEntry.shipmentType && <MenuItem value="AMS ACCOUNT">AMS ACCOUNT</MenuItem>}
                                </TextField>
                                <IconButton onClick={() => toggleManual('shipmentType')} sx={{ color: '#00B8D9', p: 0 }}>
                                    <Iconify icon="eva:plus-fill" width={24} />
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Service Required:</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                    select={!manualEntry.serviceRequired}
                                    fullWidth
                                    size="small"
                                    name="serviceRequired"
                                    value={formData.serviceRequired}
                                    onChange={handleChange}
                                >
                                    {!manualEntry.serviceRequired && <MenuItem value="REGULAR">REGULAR</MenuItem>}
                                </TextField>
                                <IconButton onClick={() => toggleManual('serviceRequired')} sx={{ color: '#00B8D9', p: 0 }}>
                                    <Iconify icon="eva:plus-fill" width={24} />
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>AMS Courier & AWB#:</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                    select={!manualEntry.amsCourierAwb}
                                    fullWidth
                                    size="small"
                                    name="amsCourierAwb"
                                    value={formData.amsCourierAwb}
                                    onChange={handleChange}
                                >
                                    {!manualEntry.amsCourierAwb && <MenuItem value="TCS via UK">TCS via UK</MenuItem>}
                                </TextField>
                                <IconButton onClick={() => toggleManual('amsCourierAwb')} sx={{ color: '#00B8D9', p: 0 }}>
                                    <Iconify icon="eva:plus-fill" width={24} />
                                </IconButton>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Account:</Typography>
                            <TextField fullWidth size="small" name="account" value={formData.account} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ color: '#919EAB', mt: 2, mb: 1, fontWeight: 700 }}>
                                Detail
                            </Typography>
                        </Grid>

                        {/* Detail Inputs */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Style / PO:</Typography>
                            <TextField fullWidth size="small" name="poStyle" value={detailData.poStyle} onChange={handleDetailChange} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Description:</Typography>
                            <TextField fullWidth size="small" name="description" value={detailData.description} onChange={handleDetailChange} />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Quantity:</Typography>
                            <TextField fullWidth size="small" name="quantity" value={detailData.quantity} onChange={handleDetailChange} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Price:</Typography>
                            <TextField fullWidth size="small" name="price" value={detailData.price} onChange={handleDetailChange} />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Amount:</Typography>
                            <TextField fullWidth size="small" name="amount" value={detailData.amount} onChange={handleDetailChange} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Remarks:</Typography>
                            <TextField fullWidth size="small" name="remarks" value={detailData.remarks} onChange={handleDetailChange} />
                        </Grid>


                        {/* Add Detail Button */}
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleAddGrid}
                                sx={{
                                    bgcolor: '#4a3b75',
                                    color: 'white',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: '#382c5a' },
                                    minWidth: 150
                                }}
                            >
                                ADD
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 🔹 Table Card (Conditional) */}
            {rows.length > 0 && (
                <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)', mb: 3 }}>
                    <CardContent>
                        <Paper sx={{ width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
                            <DataGrid
                                rows={rows}
                                columns={columns}
                                initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                                pageSizeOptions={[5, 10, 25]}
                                disableRowSelectionOnClick
                                autoHeight
                                hideFooterSelectedRowCount
                                sx={{
                                    border: 'none',
                                    '& .MuiDataGrid-columnHeaders': {
                                        backgroundColor: '#fff',
                                        color: 'black',
                                        fontWeight: 'bold',
                                        borderBottom: '2px solid #ddd',
                                    },
                                }}
                            />
                        </Paper>
                    </CardContent>
                </Card>
            )}

            {/* 🔹 Bottom Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 4 }}>
                <Button
                    variant="contained"
                    sx={{
                        bgcolor: '#4a3b75',
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#382c5a' },
                        minWidth: 120
                    }}
                >
                    Save
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        bgcolor: '#4a3b75',
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#382c5a' },
                        minWidth: 120
                    }}
                >
                    Cancel
                </Button>
            </Box>

        </Box>
    );
}
