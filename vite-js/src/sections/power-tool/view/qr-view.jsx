import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    FormControlLabel,
    Switch,
    useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import axios from 'src/utils/axios';
import { paths } from 'src/routes/paths';

export default function QRViewPage() {
    const [poNo, setPoNo] = useState('');
    const [dense, setDense] = useState(false);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();

    const fetchData = useCallback(async (searchPoNo = poNo) => {
        setLoading(true);
        try {
            const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
            const url = `${baseUrl}/api/Container/view`;
            const res = await axios.get(url, {
                params: {
                    poNo: (searchPoNo || '').trim(),
                },
            });

            const rawList = Array.isArray(res.data)
                ? res.data
                : res.data?.data || res.data?.Data || res.data?.result || res.data?.Result || [];

            const mappedRows = (Array.isArray(rawList) ? rawList : []).map((item, index) => ({
                id: item.poMixID || item.pomixid || item.id || item.poDetailID || index + 1,
                customer: item.customerName ?? item.CustomerName ?? '',
                supplier: item.venderName ?? item.VenderName ?? item.supplier ?? '',
                poNo: item.pono ?? item.PONO ?? item.poNo ?? item.PoNo ?? '',
                shipmentDate: item.tolerance ?? item.Tolerance ?? item.shipmentDate ?? '',
                styleNo: item.styleNo ?? item.StyleNo ?? '',
                color: item.colorway ?? item.Colorway ?? item.color ?? '',
                size: item.sizeName ?? item.SizeName ?? item.size ?? '',
                poQty: item.poQty ?? item.POQty ?? item.poQuantity ?? '',
                totalQty: item.mixQty ?? item.MixQty ?? item.totalQty ?? '',
                totalCarton: item.mixCtn ?? item.MixCtn ?? item.totalCarton ?? '',
            }));

            setRows(mappedRows);
        } catch (error) {
            console.error('Error fetching container view:', error);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [poNo]);

    useEffect(() => {
        fetchData('');
    }, []);

    // 🔹 Columns
    const columns = [
        { field: 'customer', headerName: 'Customer', flex: 1.5, headerAlign: 'left', align: 'left' },
        { field: 'supplier', headerName: 'Supplier', flex: 1.2, headerAlign: 'left', align: 'left' },
        { field: 'poNo', headerName: 'PO No.', flex: 1, headerAlign: 'center', align: 'center' },
        { field: 'shipmentDate', headerName: 'Shipment Date', flex: 1.2, headerAlign: 'center', align: 'center' },
        { field: 'styleNo', headerName: 'StyleNo', flex: 1, headerAlign: 'center', align: 'center' },
        { field: 'color', headerName: 'Color', flex: 1.2, headerAlign: 'center', align: 'center' },
        { field: 'size', headerName: 'Size', flex: 0.8, headerAlign: 'center', align: 'center' },
        { field: 'poQty', headerName: 'PO Qty', flex: 0.8, headerAlign: 'center', align: 'center' },
        { field: 'totalQty', headerName: 'Total Qty', flex: 0.8, headerAlign: 'center', align: 'center' },
        { field: 'totalCarton', headerName: 'Total Carton', flex: 1, headerAlign: 'center', align: 'center' },
    ];

    return (
        <Box sx={{ width: '100%', mt: 4 }}>
            {/* 🔹 Header Section */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    color="black"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}
                >
                    Mix Carton QR View
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
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
                        Mix Carton QR View
                    </Typography>
                </Box>
            </Box>

            {/* 🔹 Filters & Actions Card */}
            <Card sx={{ borderRadius: 2, mb: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                PO #
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Enter PO No"
                                variant="outlined"
                                value={poNo}
                                onChange={(e) => setPoNo(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        fetchData(poNo);
                                    }
                                }}
                                sx={{
                                    backgroundColor: 'white',
                                    '& .MuiOutlinedInput-root': { borderRadius: 0 },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4} />

                        <Grid item xs={12} sm={2}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => fetchData(poNo)}
                                sx={{
                                    height: '40px',
                                    borderRadius: 0,
                                    backgroundColor: 'black',
                                    color: 'white',
                                    fontWeight: 600,
                                    '&:hover': { backgroundColor: '#212B36' },
                                }}
                            >
                                Search
                            </Button>
                        </Grid>

                        <Grid item xs={12} sm={2}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => navigate(paths?.dashboard?.powerTool?.mixCartonEntry || '/dashboard/power-tool/mix-carton-entry')}
                                sx={{
                                    height: '40px',
                                    borderRadius: 0,
                                    backgroundColor: 'black',
                                    color: 'white',
                                    fontWeight: 600,
                                    '&:hover': { backgroundColor: '#212B36' },
                                }}
                            >
                                Add Mix Carton
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 🔹 Data Table */}
            <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    density={dense ? 'compact' : 'standard'}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[5, 10, 25, 50]}
                    disableRowSelectionOnClick
                    autoHeight
                    sx={{
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f5f5f5',
                            fontWeight: 700,
                        },
                    }}
                />
            </Paper>

            {/* 🔹 Dense Switch */}
            <FormControlLabel
                control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} />}
                label="Dense padding"
                sx={{ ml: 1 }}
            />
        </Box>
    );
}
