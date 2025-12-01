import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { AgGridReact } from "ag-grid-react";
import 'ag-grid-enterprise';
import {
    ModuleRegistry,
    AllCommunityModule,
    themeBalham,
    colorSchemeDarkBlue
} from 'ag-grid-community';
import { useNavigate } from "react-router";
import { Autocomplete, Button, Card, Grid, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography,Dialog } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { LoadingScreen } from "src/components/loading-screen";
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings'
import { paths } from "src/routes/paths";
import DocumentsDetailDialog from "./document-detail-dialog";

// Register AG Grid community modules (required for v30+)
ModuleRegistry.registerModules([AllCommunityModule]);

const LogisticGrid = ({ superSearch = false, zoomLevel = 1 }) => {
    const settings = useSettingsContext();

    const themeDark = themeBalham.withPart(colorSchemeDarkBlue);

    const navigate = useNavigate();

    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    const containerStyle = useMemo(() => ({ width: "100%", height: "500px" }), []);
    const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

    const userData = useMemo(() => JSON.parse(localStorage.getItem('UserData') || '[]'), []);

    // Date In SQL format
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const [tableData, setTableData] = useState([]);
    const [customersList, setCustomersList] = useState([]);
    const [suppliersList, setSuppliersList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [firstSearch, setFirstSearch] = useState(false);

    const [searchValue, setSearchValue] = useState({});

    // Super Search

    // Super Search stub (no API calls)
    const FetchSuperSearchData = async () => {
        // API hata di gayi hai – yahan sirf local state handle karna hai
        setSearching(true);
        // Filter local tableData yahan add kar sakte ho agar zarurat ho
        setSearching(false);
        setFirstSearch(true);
    };

    // Customers / Suppliers stub (no API calls)
    const GetCustomersData = useCallback(async () => {
        setCustomersList([]);
    }, []);

    const GetSuppliersData = useCallback(async () => {
        setSuppliersList([]);
    }, []);

    // Initial load – filhal dummy data se grid show karwa rahe hain (API baad me add hogi)
    useEffect(() => {
        const now = new Date();
        const dummyData = [
            {
                CargoID: 1,
                VendorInvoiceNo: 'INV-1001',
                InvoiceDate: now.toISOString(),
                TotalQty: 1200,
                TotalValue: 50000,
                ETD: now.toISOString(),
                CutomerName: 'ABC Customer',
                VenderName: 'XYZ Supplier',
                CurrencySign: '$',
            },
            {
                CargoID: 2,
                VendorInvoiceNo: 'INV-1002',
                InvoiceDate: now.toISOString(),
                TotalQty: 800,
                TotalValue: 32000,
                ETD: now.toISOString(),
                CutomerName: 'DEF Customer',
                VenderName: 'LMN Supplier',
                CurrencySign: '$',
            },
        ];

        setTableData(dummyData);
        setCustomersList([]);
        setSuppliersList([]);
        setFirstSearch(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderLoading = (
        <LoadingScreen
            sx={{
                borderRadius: 1.5,
                bgcolor: 'background.default',
                paddingY: '80px'
            }}
        />
    );

    // Document Dialog
    const [activeDocumentData, setActiveDocumentData] = useState({});
    const [documentsDetailDialogOpen, setDocumentsDetailDialogOpen] = useState(false);

    const handleDocumentsDetailDialogOpen = () => {
        setDocumentsDetailDialogOpen(true);
    };

    const handleDocumentOpen = (MasterData) => {
        setActiveDocumentData(MasterData);
        handleDocumentsDetailDialogOpen();
    };

    const handleDocumentsDetailDialogClose = () => {
        setDocumentsDetailDialogOpen(false);
        setActiveDocumentData({});
    };

    // -----------------------------------------------------------

    // On View Navigation Function
    const NavigateToEdit = (clickedItem) => {
        // Encryption API hata di gayi hai – yahan sirf plain ID ke sath navigate kar rahe hain
        navigate(paths.dashboard.supplyChain.editOrder);
    }
    // ************************Master Grid**************************

    // ------------------------Master Grid----------------------------

    const [columnDefs] = useState([
        { headerName: "Vendor Invoice No.", field: "VendorInvoiceNo" },
        { headerName: "Invoice Date", field: "InvoiceDate" },
        { headerName: "Invoice Quantity", field: "TotalQty" },
        { headerName: "Invoice Amount", field: "TotalValue" },
        { headerName: "Shipment Date", field: "ETD" },
        { headerName: "Customer", field: "CutomerName" },
        { headerName: "Vendor", field: "VenderName" },
    ]);

    // *****************************************************************
    return (
        <Card sx={{ p: 2 }}>
            {
                superSearch ?
                    <div
                        style={{
                            overflow: 'hidden',
                            transition: 'all 2s ease',
                            opacity: superSearch ? 1 : 0,
                            height: superSearch ? 'auto' : 0,
                        }}
                    >

                        <Stack
                            spacing={2}
                            alignItems={{ lg: 'flex-end', xl: 'center' }}
                            direction={{
                                lg: 'column',
                                xl: 'row',
                            }}
                            sx={{
                                pb: 2.5,
                                pt: 1,
                                px: 0,
                            }}
                        >
                            <>
                                <Grid container spacing={2}>
                                    {/* Search PO Field */}
                                    <Grid item xs={6} sm={6} md={6} lg={3} xl={1.5}>
                                        <TextField
                                            fullWidth
                                            value={searchValue?.PONO || ''}
                                            onChange={(e) => setSearchValue({ ...searchValue, PONO: e.target.value })}
                                            placeholder="Search PO..."
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    {/* Search Invoice Field */}
                                    <Grid item xs={6} sm={6} md={6} lg={3} xl={1.5}>
                                        <TextField
                                            fullWidth
                                            value={searchValue?.VendorInvoiceNo || ''}
                                            onChange={(e) => setSearchValue({ ...searchValue, VendorInvoiceNo: e.target.value })}
                                            placeholder="Search Invoice..."
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    {/* Customer Autocomplete */}
                                    <Grid item xs={6} sm={6} md={6} lg={3} xl={1.5}>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            id="customer-autocomplete"
                                            options={customersList}
                                            getOptionLabel={(option) => option?.CustomerName || ""}
                                            value={customersList?.find(customer => customer.CustomerID === searchValue?.CustomerID) || null}
                                            onChange={(e, newValue) => setSearchValue({ ...searchValue, CustomerID: newValue?.CustomerID || '0' })}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Customer"
                                                    variant="outlined"
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        autoComplete: 'off',
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={6} sm={6} md={6} lg={3} xl={1.5}>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            id="supplier-autocomplete"
                                            options={suppliersList}
                                            getOptionLabel={(option) => option?.VenderName || ""}
                                            value={suppliersList?.find(supp => supp.VenderLibraryID === searchValue?.SupplierID) || null}
                                            onChange={(e, newValue) => setSearchValue({ ...searchValue, SupplierID: newValue?.VenderLibraryID || '0' })}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Vendor"
                                                    variant="outlined"
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        autoComplete: 'off',
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    {/* Invoice Year Autocomplete */}
                                    <Grid item xs={6} sm={6} md={6} lg={3} xl={1.5}>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            id="year-autocomplete"
                                            options={["2030", "2029", "2028", "2027", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"]}
                                            getOptionLabel={(option) => option}
                                            value={searchValue?.InvoiceYear || null}
                                            onChange={(e, newValue) => setSearchValue({ ...searchValue, InvoiceYear: newValue || null })}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Invoice Year"
                                                    variant="outlined"
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        autoComplete: 'off',
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    {/* Invoice Month Autocomplete */}
                                    <Grid item xs={6} sm={6} md={6} lg={3} xl={1.5}>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            id="shipment-autocomplete"
                                            options={months}
                                            getOptionLabel={(option) => option?.label || ""}
                                            value={months?.find(mon => mon.value === searchValue?.InvoiceMonth) || null}
                                            onChange={(e, newValue) => setSearchValue({ ...searchValue, InvoiceMonth: newValue?.value || '0' })}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Invoice Month"
                                                    variant="outlined"
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        autoComplete: 'off',
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    {/* Shipment Year Autocomplete */}
                                    <Grid item xs={6} sm={6} md={6} lg={3} xl={1.5}>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            id="-placementYear-autocomplete"
                                            options={["2030", "2029", "2028", "2027", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"]}
                                            getOptionLabel={(option) => option}
                                            value={searchValue?.ETDYear || null}
                                            onChange={(e, newValue) => setSearchValue({ ...searchValue, ETDYear: newValue || null })}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Shipment Year"
                                                    variant="outlined"
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        autoComplete: 'off',
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    {/* Shipment Month Autocomplete */}
                                    <Grid item xs={6} sm={6} md={6} lg={3} xl={1.5}>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            id="booked-autocomplete"
                                            options={months}
                                            getOptionLabel={(option) => option?.label || ""}
                                            value={months?.find(mon => mon.value === searchValue?.ETDMonth) || null}
                                            onChange={(e, newValue) => setSearchValue({ ...searchValue, ETDMonth: newValue?.value || '0' })}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Shipment Month"
                                                    variant="outlined"
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        autoComplete: 'off',
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                {/* Search Button */}
                                <Stack direction="row" justifyContent="flex-end" alignItems="center"
                                    sx={{
                                        mt: { xs: 2, sm: 2, md: 2, lg: 0 },
                                    }}>
                                    <LoadingButton sx={{ height: 37 }} variant="contained" color="primary" loading={searching} onClick={() => FetchSuperSearchData()}>
                                        Search
                                    </LoadingButton>
                                </Stack>
                            </>
                        </Stack>
                    </div> : null
            }
            {
                loading ? renderLoading :
                    <div style={containerStyle}>
                        <DocumentsDetailDialog MasterData={activeDocumentData} openDialog={documentsDetailDialogOpen} closeDialog={handleDocumentsDetailDialogClose} />
                        <div style={{ width: '100%', height: '100%' }}>
                            <AgGridReact
                                rowData={tableData}
                                columnDefs={columnDefs}
                            />
                        </div>
                    </div >
            }
        </Card>
    );
};

export default LogisticGrid

LogisticGrid.propTypes = {
    superSearch: PropTypes.bool,
    zoomLevel: PropTypes.number,
};
