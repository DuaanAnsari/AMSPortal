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

export default function CostSheetEntryPage() {
    const navigate = useNavigate();
    const theme = useTheme();

    // Form State
    const [formData, setFormData] = useState({
        date: '12/16/2025',
        costSheetNo: 'CSN/0002',
        customerName: 'Select',
        factory: 'Select',
        description: '',
        fob: '',
        commRate: '',
        commValue: '',
        fob1: '',
        dutyRate: '',
        dutyValue: '',
        freightOfContainer: '',
        qtyPerContainer: '',
        freightPerPc: '',
        ticket: '',
        otherExpense: '',
        totalCost: '',
        ldpPrice: '',
        gpPerPc: '',
        gpPercent: '',
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

    const handleAddGrid = () => {
        // Basic validation or just add to grid
        const newRow = {
            id: Date.now(), // simple unique id
            ...formData,
        };
        setRows((prev) => [...prev, newRow]);
    };

    const handleDeleteRow = (id) => {
        setRows((prev) => prev.filter((row) => row.id !== id));
    };

    const columns = [
        { field: 'image', headerName: 'Image File Name', width: 150, renderCell: () => 'no-image.jpg' },
        { field: 'factory', headerName: 'VenderName', width: 150 },
        { field: 'description', headerName: 'Description', width: 120 },
        { field: 'fob', headerName: 'FOB', width: 80 },
        { field: 'commRate', headerName: 'Comm Rate per', width: 120 },
        { field: 'commValue', headerName: 'Comm Value', width: 100 },
        { field: 'fob1', headerName: 'FOB 1', width: 80 },
        { field: 'dutyRate', headerName: 'Duty Rate per', width: 120 },
        { field: 'dutyValue', headerName: 'Duty Value', width: 100 },
        { field: 'freightOfContainer', headerName: 'Freight Of Container', width: 150 },
        { field: 'qtyPerContainer', headerName: 'Qty Per Container', width: 150 },
        { field: 'freightPerPc', headerName: 'Freight Per Pc', width: 120 },
        { field: 'ticket', headerName: 'Ticket', width: 80 },
        { field: 'otherExpense', headerName: 'Other Expence', width: 120 },
        { field: 'totalCost', headerName: 'Totalcost', width: 100 },
        { field: 'ldpPrice', headerName: 'LDPPrice', width: 100 },
        { field: 'gpPerPc', headerName: 'GP / PC', width: 100 },
        { field: 'gpPercent', headerName: 'GP', width: 80 },
        {
            field: 'edit',
            headerName: 'EDIT',
            width: 80,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <IconButton size="small" onClick={() => console.log('Edit', params.id)}>
                    <Iconify icon="mdi:pencil" />
                </IconButton>
            ),
        },
        {
            field: 'remove',
            headerName: 'REMOVE',
            width: 80,
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
                    Cost Sheet Entry
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
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={() => navigate('/dashboard/power-tool/cost-sheet-view')}
                    >
                        Cost Sheet View
                    </Typography>
                    <Typography sx={{ mx: 1, color: theme.palette.text.secondary, fontWeight: 500 }}>
                        •
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        Cost Sheet Entry
                    </Typography>
                </Box>
            </Box>

            {/* 🔹 Form Card */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.15)', mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                        {/* Row 1 */}
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Date</Typography>
                            <TextField fullWidth size="small" name="date" value={formData.date} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Cost Sheet No</Typography>
                            <TextField fullWidth size="small" name="costSheetNo" value={formData.costSheetNo} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Customer Name</Typography>
                            <TextField select fullWidth size="small" name="customerName" value={formData.customerName} onChange={handleChange}>
                                <MenuItem value="Select">Select</MenuItem>
                                <MenuItem value="Customer A">Customer A</MenuItem>
                            </TextField>
                        </Grid>

                        {/* Row 2 */}
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Factory</Typography>
                            <TextField select fullWidth size="small" name="factory" value={formData.factory} onChange={handleChange}>
                                <MenuItem value="Select">Select</MenuItem>
                                <MenuItem value="Factory A">Factory A</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Image</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button variant="outlined" component="label" size="small">
                                    Choose File
                                    <input type="file" hidden />
                                </Button>
                                <Typography variant="body2" sx={{ alignSelf: 'center' }}>No file chosen</Typography>
                                <Button variant="contained" sx={{ bgcolor: '#4a3b75', color: 'white', ml: 'auto' }}>Upload</Button>
                            </Box>
                        </Grid>

                        {/* Description */}
                        <Grid item xs={12}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Description</Typography>
                            <TextField fullWidth size="small" name="description" value={formData.description} onChange={handleChange} />
                        </Grid>

                        {/* Detailed Numbers Rows */}
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>FOB</Typography>
                            <TextField fullWidth size="small" name="fob" value={formData.fob} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Comm Rate %</Typography>
                            <TextField fullWidth size="small" name="commRate" value={formData.commRate} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Comm Value</Typography>
                            <TextField fullWidth size="small" name="commValue" value={formData.commValue} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>FOB 1</Typography>
                            <TextField fullWidth size="small" name="fob1" value={formData.fob1} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Duty Rate %</Typography>
                            <TextField fullWidth size="small" name="dutyRate" value={formData.dutyRate} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Duty Value</Typography>
                            <TextField fullWidth size="small" name="dutyValue" value={formData.dutyValue} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Freight Of Container</Typography>
                            <TextField fullWidth size="small" name="freightOfContainer" value={formData.freightOfContainer} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Qty Per Container</Typography>
                            <TextField fullWidth size="small" name="qtyPerContainer" value={formData.qtyPerContainer} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Freight Per Pc</Typography>
                            <TextField fullWidth size="small" name="freightPerPc" value={formData.freightPerPc} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Ticket</Typography>
                            <TextField fullWidth size="small" name="ticket" value={formData.ticket} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Other Expence</Typography>
                            <TextField fullWidth size="small" name="otherExpense" value={formData.otherExpense} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>Total Cost</Typography>
                            <TextField fullWidth size="small" name="totalCost" value={formData.totalCost} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>LDP Price</Typography>
                            <TextField fullWidth size="small" name="ldpPrice" value={formData.ldpPrice} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>GP / PC</Typography>
                            <TextField fullWidth size="small" name="gpPerPc" value={formData.gpPerPc} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ color: 'gray', mb: 0.5, fontWeight: 500, display: 'block' }}>GP %</Typography>
                            <TextField fullWidth size="small" name="gpPercent" value={formData.gpPercent} onChange={handleChange} />
                        </Grid>

                        {/* Add Grid Button */}
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
                                Add Grid
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* 🔹 Table Card */}
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
