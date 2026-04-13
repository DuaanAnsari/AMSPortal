import React, { useState } from 'react';
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

export default function QRViewPage() {
    const [poNo, setPoNo] = useState('');
    const [dense, setDense] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();

    // 🔹 Table Data (Mock data based on image)
    const rows = [
        { id: 1, customer: 'LONE ROCK', supplier: 'Continental apparels', poNo: '36746', shipmentDate: '03/25/2025', styleNo: 'CF2086ZTOD', color: 'GOLD', size: '4T-24', poQty: 780, totalQty: 24, totalCarton: 1 },
        { id: 2, customer: 'LONE ROCK', supplier: 'Continental apparels', poNo: '36746', shipmentDate: '03/25/2025', styleNo: 'CF2086ZTOD', color: 'GOLD', size: '2T-12,3T-24', poQty: 780, totalQty: 36, totalCarton: 1 },
        { id: 3, customer: 'LONE ROCK', supplier: 'Continental apparels', poNo: '36599', shipmentDate: '01/30/2025', styleNo: 'CF2086Y', color: 'GOLD', size: 'YM-24,YL-12,YXL-24', poQty: 1356, totalQty: 60, totalCarton: 1 },
        { id: 4, customer: 'LONE ROCK', supplier: 'Continental apparels', poNo: '36748', shipmentDate: '01/30/2025', styleNo: 'CF2086ZTOD', color: 'GOLD', size: '4T-36', poQty: 780, totalQty: 36, totalCarton: 1 },
        { id: 5, customer: 'LONE ROCK', supplier: 'Continental apparels', poNo: '36748', shipmentDate: '01/30/2025', styleNo: 'CF2086ZTOD', color: 'GOLD', size: '3T-36', poQty: 780, totalQty: 36, totalCarton: 1 },
        { id: 6, customer: 'LONE ROCK', supplier: 'Continental apparels', poNo: '36748', shipmentDate: '01/30/2025', styleNo: 'CF2086ZTOD', color: 'GOLD', size: '2T-36', poQty: 780, totalQty: 36, totalCarton: 1 },
        { id: 7, customer: 'LONE ROCK', supplier: 'Continental apparels', poNo: '36597', shipmentDate: '01/30/2025', styleNo: 'CF2086', color: 'GOLD', size: '3XL-25', poQty: 1475, totalQty: 35, totalCarton: 1 },
        { id: 8, customer: 'LONE ROCK', supplier: 'Continental apparels', poNo: '36597', shipmentDate: '01/30/2025', styleNo: 'CF2086', color: 'GOLD', size: '2XL-36', poQty: 1475, totalQty: 36, totalCarton: 1 },

    ];

    // 🔹 Columns
    const columns = [
        { field: 'customer', headerName: 'Customer', flex: 1 },
        { field: 'supplier', headerName: 'Supplier', flex: 1.2 },
        { field: 'poNo', headerName: 'PO No.', flex: 0.8 },
        { field: 'shipmentDate', headerName: 'Shipment Date', flex: 1 },
        { field: 'styleNo', headerName: 'Style No', flex: 1 },
        { field: 'color', headerName: 'Color', flex: 0.8 },
        { field: 'size', headerName: 'Size', flex: 1.5 },
        { field: 'poQty', headerName: 'PO Qty', flex: 0.8 },
        { field: 'totalQty', headerName: 'Total Qty', flex: 1 },
        { field: 'totalCarton', headerName: 'Total Carton', flex: 1.2 },
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
                <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="body2" sx={{ color: 'black', mb: 0.5, fontWeight: 600 }}>
                                PO No :
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                value={poNo}
                                onChange={(e) => setPoNo(e.target.value)}
                                placeholder="Enter PO Number"
                                sx={{
                                    backgroundColor: 'white',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={8} sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mt: 2.5 }}>
                            <Button
                                variant="contained"
                                sx={{
                                    bgcolor: '#3b2b63',
                                    color: 'white',
                                    textTransform: 'none',
                                    minWidth: 100,
                                    fontWeight: 600,
                                    '&:hover': {
                                        bgcolor: '#4c3d7a',
                                    },
                                }}
                            >
                                Search
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/dashboard/power-tool/mix-carton-entry')}
                                sx={{
                                    bgcolor: '#3b2b63',
                                    color: 'white',
                                    textTransform: 'none',
                                    minWidth: 150,
                                    fontWeight: 600,
                                    '&:hover': {
                                        bgcolor: '#4c3d7a',
                                    },
                                }}
                            >
                                Add Mix Carton
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 🔹 DataGrid Card */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                <CardContent>
                    <Paper sx={{ width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10, page: 0 } },
                            }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            disableRowSelectionOnClick
                            pagination
                            hideFooterSelectedRowCount
                            getRowHeight={() => (dense ? 35 : 52)}
                            sx={{
                                border: 'none',
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: '#fff',
                                    color: 'black',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    height: '55px !important',
                                    borderBottom: '2px solid #ddd',
                                },
                                '& .MuiDataGrid-cell': {
                                    fontSize: dense ? '0.75rem' : '0.85rem',
                                    py: dense ? '2px' : '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #f0f0f0',
                                },
                                '& .MuiDataGrid-footerContainer': {
                                    backgroundColor: '#fff',
                                    color: 'black',
                                },
                                '& .MuiTablePagination-root': {
                                    color: 'black',
                                },
                                '& .MuiTablePagination-actions button': {
                                    color: 'black',
                                },
                            }}
                        />
                        {/* 🔹 Dense Toggle */}
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: 16,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={dense}
                                        onChange={(e) => setDense(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={<Typography sx={{ fontWeight: 500, color: 'black' }}>Dense</Typography>}
                            />
                        </Box>
                    </Paper>
                </CardContent>
            </Card>
        </Box>
    );
}
