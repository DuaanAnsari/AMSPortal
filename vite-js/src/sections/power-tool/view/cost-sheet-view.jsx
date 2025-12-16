import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Paper,
    FormControlLabel,
    Switch,
    TextField,
    IconButton,
    Link,
    useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import Iconify from 'src/components/iconify';

export default function CostSheetViewPage() {
    const [dense, setDense] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();

    // 🔹 Mock Data based on screenshot
    const rows = [
        { id: 1, date: '06/05/2024', autoNo: 'CSN/0004', supplier: 'Aim textile', customerName: 'Five Brothers' },
        { id: 2, date: '06/05/2024', autoNo: 'CSN/0003', supplier: 'Aim textile', customerName: 'Five Brothers' },
        { id: 3, date: '22/06/2023', autoNo: 'CSN/0002', supplier: 'MS Garments, Test ga', customerName: 'C-LIFE GROUP LTD.' },
        { id: 4, date: '04/05/2024', autoNo: 'CSN/0001', supplier: 'M.r apparel', customerName: 'Ultimate Apparel, Inc' },
        { id: 5, date: '16/12/2025', autoNo: 'CSN/0001', supplier: 'S M ENTERPRISES', customerName: 'm/s proxima srl' },
        { id: 6, date: '21/06/2023', autoNo: 'CSN/0001', supplier: 'A S C O INTERNATIONAL PVT LTD., S M ENTERPRISES', customerName: 'C-LIFE GROUP LTD.' },
    ];

    // 🔹 Columns
    const columns = [
        { field: 'date', headerName: 'Dates', flex: 1, align: 'center', headerAlign: 'center' },
        { field: 'autoNo', headerName: 'AutoNo', flex: 1, align: 'center', headerAlign: 'center' },
        { field: 'supplier', headerName: 'Supplier', flex: 2, align: 'center', headerAlign: 'center' },
        { field: 'customerName', headerName: 'Customer Name', flex: 2, align: 'center', headerAlign: 'center' },
        {
            field: 'edit',
            headerName: 'Edit',
            flex: 0.5,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Link
                    component="button"
                    variant="body2"
                    onClick={() => console.log('Edit', params.id)}
                    sx={{ color: '#4a3b75', fontWeight: 'bold', textDecoration: 'none' }}
                >
                    Edit
                </Link>
            ),
        },
        {
            field: 'remove',
            headerName: 'REMOVE',
            flex: 0.5,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <IconButton color="error" size="small">
                    <Iconify icon="mdi:close-circle" />
                </IconButton>
            ),
        },
        {
            field: 'pdf',
            headerName: 'PDF',
            flex: 0.5,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <IconButton color="error" size="small">
                    <Iconify icon="mdi:file-pdf-box" />
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
                    Cost Sheet View
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
                        Cost Sheet View
                    </Typography>
                </Box>
            </Box>

            {/* 🔹 Search and Add Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <TextField
                    placeholder="Customer , Supplier , Auto No"
                    variant="outlined"
                    size="small"
                    sx={{ width: 400, bgcolor: 'white' }}
                />
                <Button
                    variant="contained"
                    onClick={() => navigate('/dashboard/power-tool/cost-sheet-entry')}
                    sx={{
                        bgcolor: '#4a3b75',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#382c5a' },
                        minWidth: 150
                    }}
                >
                    Add Cost Sheet
                </Button>
            </Box>

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
                            pageSizeOptions={[5, 10, 25]}
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
