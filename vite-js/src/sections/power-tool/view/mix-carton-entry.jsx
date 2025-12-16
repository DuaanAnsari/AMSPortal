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
    MenuItem,
    useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

export default function MixCartonEntryPage() {
    const [poNo, setPoNo] = useState('00000183');
    const [dense, setDense] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();

    // 🔹 Table Data (Mock data based on requirement)
    const rows = [
        { id: 1, customer: 'Duke Clothing Co (UK)', poNo: '00000183', shipmentDate: '12/30/2020', assortment: 'Solid', styleNo: '610906', color: 'Black Pack A', size: '2XL', poQty: 64, mixQty: '' },
        { id: 2, customer: 'Duke Clothing Co (UK)', poNo: '00000183', shipmentDate: '12/30/2020', assortment: 'Solid', styleNo: '610906', color: 'Black Pack A', size: '3XL', poQty: 64, mixQty: '' },
        { id: 3, customer: 'Duke Clothing Co (UK)', poNo: '00000183', shipmentDate: '12/30/2020', assortment: 'Solid', styleNo: '610906', color: 'Black Pack A', size: '4XL', poQty: 48, mixQty: '' },
    ];

    // 🔹 Columns
    const columns = [
        { field: 'customer', headerName: 'Customer', flex: 1.5 },
        { field: 'poNo', headerName: 'PO No.', flex: 1 },
        { field: 'shipmentDate', headerName: 'Shipment Date', flex: 1 },
        { field: 'assortment', headerName: 'Assortment', flex: 1 },
        { field: 'styleNo', headerName: 'Style #', flex: 1 },
        { field: 'color', headerName: 'Color', flex: 1.5 },
        { field: 'size', headerName: 'Size', flex: 0.5 },
        { field: 'poQty', headerName: 'PO Quantity', flex: 1 },
        {
            field: 'mixQty',
            headerName: 'Mix Quantity',
            flex: 1,
            renderCell: (params) => (
                <TextField
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{
                        backgroundColor: 'white',
                        '& .MuiOutlinedInput-root': { borderRadius: 0 }
                    }}
                />
            )
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
                    Mix Carton QR Code Entry
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
                        Mix Carton QR Code Entry
                    </Typography>
                </Box>
            </Box>

            {/* 🔹 Filters & Actions Card */}
            <Card sx={{ borderRadius: 2, mb: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                <CardContent sx={{ p: 3 }}>

                    {/* Row 1: PO # and Show Data */}
                    <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                PO #
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                variant="outlined"
                                value={poNo}
                                onChange={(e) => setPoNo(e.target.value)}
                                sx={{
                                    backgroundColor: 'white',
                                    '& .MuiOutlinedInput-root': { borderRadius: 1 }
                                }}
                            >
                                <MenuItem value="00000183">00000183</MenuItem>
                                <MenuItem value="00000184">00000184</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Button
                                variant="contained"
                                fullWidth
                                sx={{
                                    bgcolor: '#4a3b75',
                                    color: 'white',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: '#382c5a' },
                                    height: 40
                                }}
                            >
                                Show Data
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Row 2: Weights and Unit */}
                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={6} sm={2}>
                            <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                Gross Weight :
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Gross Weight"
                                variant="outlined"
                                sx={{ backgroundColor: 'white' }}
                            />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                Net Weight :
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Net Weight"
                                variant="outlined"
                                sx={{ backgroundColor: 'white' }}
                            />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                Unit :
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                defaultValue="KG"
                                variant="outlined"
                                sx={{ backgroundColor: 'white' }}
                            >
                                <MenuItem value="KG">KG</MenuItem>
                                <MenuItem value="LBS">LBS</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={6} sm={2} sx={{ ml: 'auto' }}>
                            <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                                Total Carton :
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                sx={{ backgroundColor: 'white' }}
                            />
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
                                pagination: { paginationModel: { pageSize: 5, page: 0 } },
                            }}
                            pageSizeOptions={[5, 10, 25]}
                            disableRowSelectionOnClick
                            pagination
                            hideFooterSelectedRowCount
                            getRowHeight={() => (dense ? 35 : 80)} // Taller rows to accommodate multi-line text if needed
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
        </Box >
    );
}
