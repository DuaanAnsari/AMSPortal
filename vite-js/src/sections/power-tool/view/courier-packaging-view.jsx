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
    IconButton,
    Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import Iconify from 'src/components/iconify';
import { paths } from 'src/routes/paths';

export default function CourierPackagingViewPage() {
    const navigate = useNavigate();

    // Mock Data
    const [rows, setRows] = useState([]);

    // Filters State
    const [filters, setFilters] = useState({
        invoiceNo: '',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
    });

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const columns = [
        { field: 'invoiceNo', headerName: 'Invoice #', flex: 1 },
        { field: 'creationDate', headerName: 'Creation Date', flex: 1 },
        { field: 'shipperName', headerName: 'Shipper Name', flex: 1.5 },
        { field: 'consigneeName', headerName: 'Consignee Name', flex: 1.5 },
        { field: 'address', headerName: 'Address', flex: 2 },
        { field: 'shipmentType', headerName: 'Shipment Type', flex: 1 },
        { field: 'service', headerName: 'Service', flex: 1 },
        { field: 'courierName', headerName: 'Courier Name', flex: 1 },
        { field: 'account', headerName: 'Account', flex: 1 },
        { field: 'awbl', headerName: 'AWBL #', flex: 1 },
        {
            field: 'edit',
            headerName: 'Edit',
            flex: 0.5,
            renderCell: (params) => (
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                    <Iconify icon="eva:edit-fill" />
                </IconButton>
            ),
        },
        {
            field: 'action',
            headerName: 'Action',
            flex: 0.5,
            renderCell: (params) => (
                <IconButton size="small" sx={{ color: 'error.main' }}>
                    <Iconify icon="mdi:close-circle" />
                </IconButton>
            ),
        },
        {
            field: 'pdf',
            headerName: 'PDF',
            flex: 0.5,
            renderCell: (params) => (
                <IconButton size="small" sx={{ color: 'error.main' }}>
                    <Iconify icon="fa6-solid:file-pdf" />
                </IconButton>
            ),
        },
    ];

    return (
        <Box sx={{ width: '100%', mt: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 3, pl: 2 }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: 'text.secondary' }}>
                    Courier Packages View
                </Typography>
                <Box sx={{ height: 1, bgcolor: 'divider', mt: 2 }} />
            </Box>


            <Box sx={{ px: 2 }}>
                {/* Filters and Action */}
                <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search For Invoice # ...."
                            name="invoiceNo"
                            value={filters.invoiceNo}
                            onChange={handleFilterChange}
                        />
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>From:</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>To:</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
                    </Grid>

                    <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={() => navigate(paths.dashboard.powerTool.courierPackagingEntry)}
                            sx={{
                                bgcolor: '#4a3b75', // Dark Purple
                                color: 'white',
                                textTransform: 'none',
                                px: 4,
                                py: 1,
                                '&:hover': { bgcolor: '#382c5a' },
                            }}
                        >
                            Add Courier
                        </Button>
                    </Grid>
                </Grid>

                {/* DataGrid */}
                <Card sx={{ borderRadius: 0, boxShadow: 'none' }}>
                    {/* Using borderRadius 0 to match screenshot style if needed, or keeping standard */}
                    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                            pageSizeOptions={[10, 25, 50]}
                            disableRowSelectionOnClick
                            autoHeight
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
                </Card>
            </Box>

        </Box>
    );
}
