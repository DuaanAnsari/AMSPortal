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
    MenuItem,
    Autocomplete,
    useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import axios from 'src/utils/axios';
import { paths } from 'src/routes/paths';
import { useSnackbar } from 'src/components/snackbar';

export default function MixCartonEntryPage() {
    const [poList, setPoList] = useState([]);
    const [selectedPO, setSelectedPO] = useState(null);
    const [poLoading, setPoLoading] = useState(false);
    const [gridLoading, setGridLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dense, setDense] = useState(false);
    const [rows, setRows] = useState([]);

    const [grossWeight, setGrossWeight] = useState('');
    const [netWeight, setNetWeight] = useState('');
    const [grossAndNetWeight, setGrossAndNetWeight] = useState('KG');
    const [mixCtn, setMixCtn] = useState('');

    const navigate = useNavigate();
    const theme = useTheme();
    const { enqueueSnackbar } = useSnackbar();

    // 🔹 Fetch PO List on Mount
    useEffect(() => {
        const fetchPOs = async () => {
            setPoLoading(true);
            try {
                const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
                const res = await axios.get(`${baseUrl}/api/Container/Getpono`);
                const raw = Array.isArray(res.data)
                    ? res.data
                    : res.data?.data || res.data?.Data || res.data?.result || res.data?.Result || [];

                const options = (Array.isArray(raw) ? raw : [])
                    .map((item) => ({
                        label: String(item.PONO ?? item.pono ?? item.poNo ?? item.label ?? ''),
                        value: item.POID ?? item.poid ?? item.poId ?? item.id ?? item.value,
                        raw: item,
                    }))
                    .filter((opt) => Boolean(opt.label));

                setPoList(options);
            } catch (err) {
                console.error('Error fetching POs:', err);
                setPoList([]);
            } finally {
                setPoLoading(false);
            }
        };

        fetchPOs();
    }, []);

    // 🔹 Show Data Handler
    const handleShowData = useCallback(async () => {
        if (!selectedPO?.value) return;
        setGridLoading(true);
        try {
            const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
            const poId = selectedPO.value;
            const res = await axios.get(`${baseUrl}/api/Container/GetMixCartonQREntryData`, {
                params: {
                    poIds: poId,
                },
            });

            const raw = Array.isArray(res.data)
                ? res.data
                : res.data?.data || res.data?.Data || res.data?.result || res.data?.Result || [];

            const mapped = (Array.isArray(raw) ? raw : []).map((item, index) => ({
                id: item.poDetailID || item.podetailid || item.poMixID || item.id || index + 1,
                customer: item.customerName ?? item.CustomerName ?? item.customer ?? item.Customer ?? '',
                poNo: item.pono ?? item.PONO ?? item.poNo ?? selectedPO.label ?? '',
                shipmentDate: item.shipmentDate ?? item.ShipmentDate ?? item.tolerance ?? item.Tolerance ?? '',
                assortment: item.assortment ?? item.Assortment ?? item.assortmentName ?? item.AssortmentName ?? 'Solid',
                styleNo: item.styleNo ?? item.StyleNo ?? item.style ?? item.Style ?? '',
                color: item.colorway ?? item.Colorway ?? item.color ?? item.Color ?? '',
                size: item.sizeName ?? item.SizeName ?? item.size ?? item.Size ?? '',
                poQty: item.poQty ?? item.POQty ?? item.quantity ?? item.Quantity ?? '',
                mixQty: item.mixQty ?? item.MixQty ?? '',
                raw: item,
            }));

            setRows(mapped);
        } catch (err) {
            console.error('Error fetching mix carton QR entry data:', err);
            setRows([]);
        } finally {
            setGridLoading(false);
        }
    }, [selectedPO]);

    // 🔹 Save Handler
    const handleSave = async () => {
        if (!selectedPO?.value) {
            enqueueSnackbar('Please select a PO # first', { variant: 'warning' });
            return;
        }
        if (rows.length === 0) {
            enqueueSnackbar('At least one detail row is required', { variant: 'warning' });
            return;
        }

        setSaving(true);
        try {
            const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
            const details = rows.map((row) => ({
                assortment: row.assortment || 'Solid',
                styleNo: row.styleNo || '',
                colorway: row.color || row.colorway || '',
                sizeName: row.size || row.sizeName || '',
                poQty: Number(row.poQty) || 0,
                mixQty: Number(row.mixQty) || 0,
            }));

            const payload = {
                poMixID: 0,
                poid: Number(selectedPO.value) || 0,
                userID: Number(localStorage.getItem('userId') || localStorage.getItem('userID') || 0),
                pono: selectedPO.label || '',
                mixCtn: Number(mixCtn) || 0,
                grossWeight: Number(grossWeight) || 0,
                netWeight: Number(netWeight) || 0,
                grossAndNetWeight: grossAndNetWeight || 'KG',
                assortment: rows[0]?.assortment || 'Solid',
                details,
            };

            await axios.post(`${baseUrl}/api/Container/SaveMixCartonQR`, payload);

            enqueueSnackbar('Mix Carton QR saved successfully!', { variant: 'success' });
            navigate(paths?.dashboard?.powerTool?.qrView || '/dashboard/power-tool/qr-view');
        } catch (err) {
            console.error('Error saving Mix Carton QR:', err);
            const errorMsg =
                (typeof err?.response?.data === 'string' && err.response.data) ||
                err?.response?.data?.message ||
                err?.response?.data?.Message ||
                err?.message ||
                'Failed to save Mix Carton QR';
            enqueueSnackbar(errorMsg, { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

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
                    value={params.row.mixQty ?? ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        setRows((prev) =>
                            prev.map((r) => (r.id === params.row.id ? { ...r, mixQty: val } : r))
                        );
                    }}
                    sx={{
                        backgroundColor: 'white',
                        '& .MuiOutlinedInput-root': { borderRadius: 0 },
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
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={poList}
                                loading={poLoading}
                                value={selectedPO}
                                onChange={(event, newValue) => setSelectedPO(newValue)}
                                getOptionLabel={(option) => (typeof option === 'string' ? option : option.label || '')}
                                isOptionEqualToValue={(option, val) => option.value === val?.value}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search / Select PO #"
                                        variant="outlined"
                                        sx={{
                                            backgroundColor: 'white',
                                            '& .MuiOutlinedInput-root': { borderRadius: 1 },
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleShowData}
                                disabled={!selectedPO || gridLoading}
                                sx={{
                                    backgroundColor: 'black',
                                    color: 'white',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': { backgroundColor: '#212B36' },
                                    height: 40,
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
                                value={grossWeight}
                                onChange={(e) => setGrossWeight(e.target.value)}
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
                                value={netWeight}
                                onChange={(e) => setNetWeight(e.target.value)}
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
                                value={grossAndNetWeight}
                                onChange={(e) => setGrossAndNetWeight(e.target.value)}
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
                                placeholder="Total Carton"
                                variant="outlined"
                                value={mixCtn}
                                onChange={(e) => setMixCtn(e.target.value)}
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
                            loading={gridLoading}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 5, page: 0 } },
                            }}
                            pageSizeOptions={[5, 10, 25]}
                            disableRowSelectionOnClick
                            pagination
                            hideFooterSelectedRowCount
                            getRowHeight={() => (dense ? 35 : 80)}
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

                    {/* 🔹 Action Buttons (Save & Cancel) */}
                    <Grid container spacing={2} justifyContent="flex-end" sx={{ mt: 3, mb: 1 }}>
                        <Grid item xs={6} sm={2}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleSave}
                                disabled={saving}
                                sx={{
                                    backgroundColor: 'black',
                                    color: 'white',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': { backgroundColor: '#212B36' },
                                    height: 42,
                                }}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => navigate(paths?.dashboard?.powerTool?.qrView || '/dashboard/power-tool/qr-view')}
                                sx={{
                                    backgroundColor: 'black',
                                    color: 'white',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': { backgroundColor: '#212B36' },
                                    height: 42,
                                }}
                            >
                                Cancel
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
