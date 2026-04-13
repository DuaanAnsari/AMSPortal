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
    Checkbox,
    useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

export default function ViewUsersPage() {
    const [dense, setDense] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();

    // 🔹 Mock Data based on screenshot
    const [rows, setRows] = useState([
        { id: 1, userName: 'MEHWISH RIAZ', designation: 'Shipment', active: true },
        { id: 2, userName: 'MAHWISH', designation: 'Shipment', active: true },
        { id: 3, userName: 'Fashion villaz', designation: 'Supplier', active: true },
        { id: 4, userName: 'Mode textile', designation: 'Supplier', active: true },
        { id: 5, userName: 'CONTINENTAL APPARELS', designation: 'Supplier', active: true },
        { id: 6, userName: 'KNF INDUSTRY', designation: 'Supplier', active: true },
        { id: 7, userName: 'HASSAN ALI TIRMIZI', designation: 'Shipment', active: true },
        { id: 8, userName: 'MUHAMMAD NADEEM', designation: 'QA', active: false },
    ]);

    const handleToggleActive = (id) => {
        setRows((prevRows) =>
            prevRows.map((row) =>
                row.id === id ? { ...row, active: !row.active } : row
            )
        );
    };

    // 🔹 Columns
    const columns = [
        { field: 'userName', headerName: 'User Name', flex: 1, align: 'center', headerAlign: 'center' },
        { field: 'designation', headerName: 'Designation', flex: 1, align: 'center', headerAlign: 'center' },
        {
            field: 'active',
            headerName: 'Active',
            flex: 0.5,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Checkbox
                    checked={params.row.active}
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent row selection if needed
                        handleToggleActive(params.id);
                    }}
                />
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
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}
                >
                    User Create View
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
                        User Create View
                    </Typography>
                </Box>
            </Box>

            {/* 🔹 Action Buttons (Right Aligned) */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
                <Button
                    variant="contained"
                    sx={{
                        bgcolor: '#4a3b75',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#382c5a' },
                        minWidth: 120
                    }}
                >
                    Update User
                </Button>
                <Button 
                    variant="contained"
                    onClick={() => navigate('/dashboard/power-tool/add-user')}
                    sx={{
                        bgcolor: '#4a3b75',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#382c5a' },
                        minWidth: 120
                    }}
                >
                    Add User
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
                            getRowClassName={(params) => `row-${params.row.active ? 'active' : 'inactive'}`}
                            sx={{
                                border: 'none',
                                '& .row-active': {
                                    backgroundColor: '#d32f2f', // Dark red background
                                    color: 'white', // White text for contrast
                                    '&:hover': { backgroundColor: '#b71c1c' }, // Darker red on hover
                                    '& .MuiCheckbox-root': { color: 'white' } // Ensure checkbox is visible
                                },
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
