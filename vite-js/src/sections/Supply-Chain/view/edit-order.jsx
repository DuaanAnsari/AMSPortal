import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeBalham, colorSchemeDarkBlue } from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';
import axios from 'axios';

// AG Grid Enterprise License
LicenseManager.setLicenseKey("Using_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-077aborr}_{granted_to_AMS_Baig_&_Co}_{for_application_{AMS_Portal}_is_not_permitted_for_apps_not_developed_in_partnership_with_AMS_Baig_&_Co}_{This_key_has_not_been_granted_a_Deployment_License_Add-on}_{This_key_works_with_{AG_Charts_and_AG_Grid}_Enterprise_versions_released_before_{28_April_2026}}_{[v3]_[0102]_MTc0NTc5NDgwMDAwMA==69c9a0c4f82299b15b7fc24c8226fac3}");

// Register all modules (Community + Enterprise)
ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

import { useNavigate, useLocation } from "react-router-dom";
import { Alert, Box, Button, Card, CircularProgress, Container, Snackbar, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import SaveIcon from '@mui/icons-material/Save';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with authorization header
const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api`,
});

// Add request interceptor to include authorization token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Helper function to transform API data to grid format
const transformPODataToGridRow = (orderData) => {
    return {
        // Store original data for payload construction
        originalData: orderData,
        // Keep the original PO ID for update
        poid: orderData.poid || orderData.POID || orderData.id || orderData.purchaseOrderId || '',
        // Basic Order Info
        costingRef: orderData.costingMstID ? String(orderData.costingMstID) : '',
        masterPo: orderData.masterPO || '',
        amsRef: orderData.amsRefNo || '',
        customerPo: orderData.pono || '',
        internalPo: orderData.internalPONO || '',
        rnNo: orderData.rnNo || '',
        consignee: orderData.consignee || '',
        merchant: orderData.marchandID ? String(orderData.marchandID) : '',
        proceedings: orderData.proceedings || '',
        orderType: orderData.pOtype || '',
        version: orderData.version || '',

        // Important Dates
        placementDate: orderData.placementDate ? orderData.placementDate.split('T')[0] : '',
        etaNewJerseyDate: orderData.etanjDate ? orderData.etanjDate.split('T')[0] : '',
        etaWarehouseDate: orderData.etaWarehouseDate ? orderData.etaWarehouseDate.split('T')[0] : '',
        // Buyer Shipment Window
        buyerShipInitial: orderData.tolerance ? orderData.tolerance.split('T')[0] : '',
        buyerShipLast: orderData.buyerExIndiaTolerance ? orderData.buyerExIndiaTolerance.split('T')[0] : '',
        // Vendor Shipment Window
        vendorShipInitial: orderData.shipmentDate ? orderData.shipmentDate.split('T')[0] : '',
        vendorShipLast: orderData.vendorExIndiaShipmentDate ? orderData.vendorExIndiaShipmentDate.split('T')[0] : '',
        finalInspectionDate: orderData.finalInspDate ? orderData.finalInspDate.split('T')[0] : '',
        // Product Information
        productPortfolio: orderData.productPortfolioID ? String(orderData.productPortfolioID) : '',
        productCategory: orderData.productCategoriesID ? String(orderData.productCategoriesID) : '',
        productGroup: orderData.productGroupID ? String(orderData.productGroupID) : '',
        season: orderData.season || '',
        tolQuantity: orderData.toleranceindays || '',
        set: orderData.poQtyUnit || '',
        fabric: orderData.fabric || '',
        item: orderData.item || '',
        qualityComposition: orderData.quality || '',
        gsm: orderData.gms || '',
        design: orderData.design || '',
        otherFabric: orderData.otherFabric || '',
        gsmOF: '',
        construction: orderData.construction || '',
        poSpecialOperation: orderData.pO_Special_Operation || '',
        status: orderData.status || '',
        poSpecialTreatment: orderData.pO_Special_Treatement || '',
        styleSource: orderData.styleSource || '',
        brand: orderData.brand || '',
        assortment: orderData.assortment || '',
        ratio: orderData.ration || '',
        cartonMarking: orderData.cartonMarking || '',
        poSpecialInstructions: orderData.pO_Special_Instructions || '',
        washingCareLabel: orderData.washingCareLabelInstructions || '',
        importantNote: orderData.importantNote || '',
        moreInfo: orderData.moreInfo || '',
        samplingRequirements: orderData.samplingReq || '',
        pcsPerCarton: orderData.pcPerCarton ?? '',
        itemDescriptionShipping: orderData.itemDescriptionShippingInvoice || '',
        grossWeight: orderData.grossWeight ?? '',
        netWeight: orderData.netWeight ?? '',
        unit: orderData.grossAndNetWeight || '',
        packingList: orderData.packingList || '',
        embEmbellishment: orderData.embAndEmbellishment || '',
        inquiryNo: orderData.inquiryMstID ? `INQ${orderData.inquiryMstID}` : '',
        buyerCustomer: orderData.buyerCustomer || '',
        // Product Specific Information
        currency: orderData.currency || '',
        exchangeRate: orderData.exchangeRate ?? '',
        style: orderData.styleNo || orderData.design || '',
        // Shipping and Payment Terms
        paymentMode: orderData.paymentMode || '',
        shipmentTerm: orderData.shipmentMode || '',
        destination: orderData.destination || '',
        shipmentMode: orderData.deliveryType || '',
    };
};

// Helper to convert grid row back to API payload
const transformGridRowToAPIPayload = (row) => {
    const toIsoOrNull = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
    };

    // Start with original data to preserve unmapped fields
    const payload = row.originalData ? { ...row.originalData } : {};

    // Helper for safe parsing
    const safeParseInt = (val) => {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? 0 : parsed;
    };
    const safeParseFloat = (val) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    };

    // Overwrite with grid values
    Object.assign(payload, {
        pono: row.customerPo || '',
        internalPONO: row.internalPo || '',
        masterPO: row.masterPo || '',
        amsRefNo: row.amsRef || '',
        rnNo: row.rnNo || '',
        consignee: row.consignee || '',

        // Proceedings / types
        proceedings: row.proceedings || '',
        pOtype: row.orderType || '',
        transactions: 'Services',
        version: row.version || '',
        commission: safeParseFloat(row.commission),
        vendorCommission: safeParseFloat(row.vendorCommission),

        // Dates
        placementDate: toIsoOrNull(row.placementDate),
        etanjDate: toIsoOrNull(row.etaNewJerseyDate),
        etaWarehouseDate: toIsoOrNull(row.etaWarehouseDate),
        tolerance: toIsoOrNull(row.buyerShipInitial),
        buyerExIndiaTolerance: toIsoOrNull(row.buyerShipLast),
        shipmentDate: toIsoOrNull(row.vendorShipInitial),
        vendorExIndiaShipmentDate: toIsoOrNull(row.vendorShipLast),
        finalInspDate: toIsoOrNull(row.finalInspectionDate),

        // Product Information
        season: row.season || '',
        toleranceindays: row.tolQuantity || '',
        poQtyUnit: row.set || '',
        fabric: row.fabric || '',
        item: row.item || '',
        quality: row.qualityComposition || '',
        gms: row.gsm || '',
        design: row.design || '',
        otherFabric: row.otherFabric || '',
        construction: row.construction || '',
        pO_Special_Operation: row.poSpecialOperation || '',
        status: row.status || '',
        pO_Special_Treatement: row.poSpecialTreatment || '',
        styleSource: row.styleSource || '',
        brand: row.brand || '',
        assortment: row.assortment || '',
        ration: row.ratio || '',
        cartonMarking: row.cartonMarking || '',
        pO_Special_Instructions: row.poSpecialInstructions || '',
        washingCareLabelInstructions: row.washingCareLabel || '',
        importantNote: row.importantNote || '',
        moreInfo: row.moreInfo || '',
        samplingReq: row.samplingRequirements || '',
        pcPerCarton: safeParseInt(row.pcsPerCarton),
        itemDescriptionShippingInvoice: row.itemDescriptionShipping || '',
        grossWeight: safeParseFloat(row.grossWeight),
        netWeight: safeParseFloat(row.netWeight),
        grossAndNetWeight: row.unit || '',
        packingList: row.packingList || '',
        embAndEmbellishment: row.embEmbellishment || '',
        buyerCustomer: row.buyerCustomer || '',

        // Product Specific Information
        currency: row.currency || '',
        exchangeRate: safeParseFloat(row.exchangeRate),
        style: row.style || '',

        // Shipping and Payment Terms
        paymentMode: row.paymentMode || '',
        shipmentMode: row.shipmentTerm || '',
        destination: row.destination || '',
        deliveryType: row.shipmentMode || '',

        // IDs (parse as numbers if present)
        productPortfolioID: row.productPortfolio ? safeParseInt(row.productPortfolio) : (payload.productPortfolioID || 0),
        productCategoriesID: row.productCategory ? safeParseInt(row.productCategory) : (payload.productCategoriesID || 0),
        productGroupID: row.productGroup ? safeParseInt(row.productGroup) : (payload.productGroupID || 0),
        costingMstID: row.costingRef ? safeParseInt(row.costingRef) : (payload.costingMstID || 0),
        marchandID: row.merchant ? safeParseInt(row.merchant) : (payload.marchandID || 0),
        inquiryMstID: row.inquiryNo ? safeParseInt(row.inquiryNo.replace('INQ', '')) : (payload.inquiryMstID || 0),

        // Keep last update
        lastUpdate: new Date().toISOString(),
    });


    // AGGRESSIVE FIX: Remove ALL image/binary fields from payload
    // Database has these IMAGE type fields: poImage, pPimage, finalspecs, sizeset, qrImgPO
    // Also remove any file upload fields that may contain File objects
    // NOTE: We MUST keep 'productImage', 'specsimage', etc. if they are strings, as the backend requires them.
    const fieldsToDelete = [
        'image', 'Image', 'photo', 'Photo', 'attachment', 'file', 'picture', 'Picture', 'imagePath', 'photoPath',
        'poImage', 'pPimage', 'finalspecs', 'sizeset', 'qrImgPO',  // Exact database field names
        // 'productImage', 'specsimage', 'prodImgFileName', 'poImgFileName',  // KEEP THESE (Required by Backend)
        'originalPurchaseOrder', 'processOrderConfirmation', 'finalSpecs', 'ppComment', 'sizeSetComment',  // Form upload fields
    ];

    let deletedFields = [];
    fieldsToDelete.forEach(field => {
        if (payload[field] !== undefined) {
            console.log(`🔧 Deleting ${field}:`, payload[field]);
            deletedFields.push(field);
            delete payload[field];
        }
    });

    if (deletedFields.length > 0) {
        console.log('✅ Deleted fields:', deletedFields.join(', '));
    } else {
        console.log('ℹ️ No problematic fields found in payload');
    }

    if (deletedFields.length > 0) {
        console.log('✅ Deleted fields:', deletedFields.join(', '));
    } else {
        console.log('ℹ️ No problematic fields found in payload');
    }

    // FORCE INCLUDE REQUIRED IMAGE FIELDS (as empty strings if missing)
    // This fixes "Must declare the scalar variable @ProductImage" error
    const requiredImageFields = ['productImage', 'specsimage', 'prodImgFileName', 'poImgFileName'];
    requiredImageFields.forEach(field => {
        if (payload[field] === undefined || payload[field] === null) {
            payload[field] = '';
        }
    });

    return payload;
};

const EditOrderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const gridRef = useRef(null);

    // Get selected PO IDs from navigation state
    const selectedPOIds = location.state?.selectedPOIds || [];

    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Dynamic height based on row count (header + rows + pagination)
    const containerStyle = useMemo(() => {
        const rowHeight = 42; // Default AG Grid row height
        const headerHeight = 56; // Header height
        const paginationHeight = 56; // Pagination bar height
        const calculatedHeight = headerHeight + (tableData.length * rowHeight) + paginationHeight;

        // Min 300px, max 800px for good UX
        const finalHeight = Math.min(Math.max(calculatedHeight, 300), 800);

        return { width: "100%", height: `${finalHeight}px` };
    }, [tableData.length]);

    // Show snackbar helper
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Fetch PO data for selected IDs
    useEffect(() => {
        const fetchSelectedPOsData = async () => {
            if (selectedPOIds.length === 0) {
                setLoading(false);
                showSnackbar('No POs selected. Please go back and select POs to edit.', 'warning');
                return;
            }

            try {
                setLoading(true);
                const fetchPromises = selectedPOIds.map(id =>
                    apiClient.get(`/MyOrders/GetPurchaseOrder/${id}`)
                );

                const responses = await Promise.all(fetchPromises);
                const allPOData = [];

                responses.forEach((response, index) => {
                    if (response.data && response.data.length > 0) {
                        const orderData = response.data[0];
                        const gridRow = transformPODataToGridRow(orderData);

                        // Ensure poid is set using the ID we used to fetch
                        if (!gridRow.poid) {
                            gridRow.poid = selectedPOIds[index];
                        }

                        allPOData.push(gridRow);
                    } else {
                        console.warn(`No data found for PO ID: ${selectedPOIds[index]}`);
                    }
                });

                setTableData(allPOData);
                showSnackbar(`Loaded ${allPOData.length} Purchase Order(s)`, 'success');
            } catch (error) {
                console.error('Error fetching PO data:', error);
                showSnackbar('Error loading Purchase Order data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchSelectedPOsData();
    }, [selectedPOIds]);

    // Column definitions
    const [columnDefs] = useState([
        // PO ID (hidden but needed for update)
        { headerName: "PO ID", field: "poid", hide: true, editable: false },
        // Basic Order Info
        { headerName: "Customer PO No.", field: "customerPo", rowDrag: true },
        { headerName: "Internal PO No.", field: "internalPo" },
        { headerName: "Master PO No.", field: "masterPo" },
        { headerName: "AMS Ref No.", field: "amsRef" },
        { headerName: "RN No.", field: "rnNo" },
        { headerName: "Consignee", field: "consignee" },


        { headerName: "Merchant", field: "merchant" },
        { headerName: "Proceedings", field: "proceedings" },
        { headerName: "Order Type", field: "orderType" },
        { headerName: "Version", field: "version" },

        // Important Dates
        { headerName: "Placement Date", field: "placementDate" },
        { headerName: "ETA New Jersey Date", field: "etaNewJerseyDate" },
        { headerName: "ETA Warehouse Date", field: "etaWarehouseDate" },
        // Buyer Shipment Window
        { headerName: "Buyer Ship. Dt. (Initial)", field: "buyerShipInitial" },
        { headerName: "Buyer Ship. Dt. (Last)", field: "buyerShipLast" },
        // Vendor Shipment Window
        { headerName: "Vendor Ship. Dt. (Initial)", field: "vendorShipInitial" },
        { headerName: "Vendor Ship. Dt. (Last)", field: "vendorShipLast" },
        { headerName: "Final Inspection Date", field: "finalInspectionDate" },
        // Product Information
        { headerName: "Season", field: "season" },
        { headerName: "Tol. Quantity", field: "tolQuantity" },
        { headerName: "Set", field: "set" },
        { headerName: "Fabric", field: "fabric" },
        { headerName: "Item", field: "item" },
        { headerName: "Quality / Composition", field: "qualityComposition" },
        { headerName: "GSM", field: "gsm" },
        { headerName: "Design", field: "design" },
        { headerName: "Other Fabric", field: "otherFabric" },
        { headerName: "Construction", field: "construction" },
        { headerName: "PO Special Operation", field: "poSpecialOperation" },
        { headerName: "Status", field: "status" },
        { headerName: "PO Special Treatment", field: "poSpecialTreatment" },
        { headerName: "Style Source", field: "styleSource" },
        { headerName: "Brand", field: "brand" },
        { headerName: "Assortment", field: "assortment" },
        { headerName: "Ratio", field: "ratio" },
        { headerName: "Carton Marking", field: "cartonMarking" },
        { headerName: "PO Special Instructions", field: "poSpecialInstructions" },
        { headerName: "Washing Care Label", field: "washingCareLabel" },
        { headerName: "Important Note", field: "importantNote" },
        { headerName: "More Info", field: "moreInfo" },
        { headerName: "Sampling Requirements", field: "samplingRequirements" },
        { headerName: "Pcs Per Carton", field: "pcsPerCarton" },
        { headerName: "Item Description (Shipping)", field: "itemDescriptionShipping" },
        { headerName: "Gross Weight", field: "grossWeight" },
        { headerName: "Net Weight", field: "netWeight" },
        { headerName: "Unit", field: "unit" },
        { headerName: "Packing List", field: "packingList" },
        { headerName: "Emb & Embellishment", field: "embEmbellishment" },
        { headerName: "Inquiry No", field: "inquiryNo" },
        { headerName: "Buyer Customer", field: "buyerCustomer" },
        // Product Specific Information
        { headerName: "Currency", field: "currency" },
        { headerName: "Exchange Rate", field: "exchangeRate" },
        { headerName: "Style", field: "style" },
        // Shipping and Payment Terms
        { headerName: "Payment Mode", field: "paymentMode" },
        { headerName: "Shipment Term", field: "shipmentTerm" },
        { headerName: "Destination", field: "destination" },
        { headerName: "Shipment Mode", field: "shipmentMode" },
    ]);

    // Default column settings - all columns editable for drag-fill
    const defaultColDef = useMemo(() => ({
        editable: true,
        flex: 1,
        minWidth: 150,
        resizable: true,
        sortable: true,
        filter: true,
        wrapHeaderText: true,
        autoHeaderHeight: true,
    }), []);

    // Handle Save/Update all POs
    const handleSaveAll = async () => {
        console.log('=== SAVE ALL STARTED ===');
        console.log('gridRef.current:', gridRef.current);
        console.log('gridRef.current?.api:', gridRef.current?.api);

        // First, stop any active cell editing to ensure all changes are committed
        if (gridRef.current?.api) {
            gridRef.current.api.stopEditing();
        }

        // Get current grid data from AG Grid API
        const rowData = [];
        if (gridRef.current?.api) {
            gridRef.current.api.forEachNode(node => {
                console.log('Node data:', node.data);
                if (node.data) {
                    rowData.push(node.data);
                }
            });
        } else {
            console.error('Grid API not available!');
            showSnackbar('Grid not ready. Please wait and try again.', 'error');
            return;
        }

        console.log('Total rows to save:', rowData.length);
        console.log('Row data:', JSON.stringify(rowData, null, 2));

        if (rowData.length === 0) {
            showSnackbar('No data to save', 'warning');
            return;
        }

        try {
            setSaving(true);

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            // Update each PO one by one
            for (const row of rowData) {
                console.log('Processing row:', row);

                if (!row.poid) {
                    console.warn('Row missing poid, skipping row');
                    continue;
                }

                try {
                    const payload = transformGridRowToAPIPayload(row);
                    const apiUrl = `/MyOrders/UpdatePurchaseOrder?poid=${row.poid}`;
                    console.log(`API URL: ${apiUrl}`);
                    console.log(`Payload for PO ${row.poid}:`, JSON.stringify(payload, null, 2));

                    const response = await apiClient.post(apiUrl, payload);
                    console.log(`Response for PO ${row.poid}:`, response);
                    successCount++;
                } catch (err) {
                    console.error(`Error updating PO ${row.poid}:`, err);
                    console.error('Error response:', err.response?.data);
                    console.error('Error status:', err.response?.status);
                    errors.push(`PO ${row.poid}: ${err.response?.data?.message || err.message}`);
                    errorCount++;
                }
            }

            console.log('=== SAVE ALL COMPLETED ===');
            console.log(`Success: ${successCount}, Errors: ${errorCount}`);
            console.log('Errors:', errors);

            if (successCount > 0) {
                showSnackbar(`Successfully updated ${successCount} Purchase Order(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`, 'success');
            } else {
                showSnackbar(`Failed to update Purchase Orders. ${errors.join(', ')}`, 'error');
            }
        } catch (error) {
            console.error('Error updating POs:', error);
            showSnackbar('Error updating Purchase Orders. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 3 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                    <Typography variant="h6" sx={{ ml: 2 }}>
                        Loading Purchase Order data...
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header */}
            <Card sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowBackIosIcon
                            sx={{
                                cursor: 'pointer',
                                mr: 1,
                                fontSize: '1.2rem',
                                color: 'primary.main',
                                '&:hover': { color: 'primary.dark' },
                            }}
                            onClick={() => navigate('/dashboard/supply-chain')}
                        />
                        <Typography variant="h4">
                            EDIT PURCHASE ORDERS ({tableData.length} Selected)
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <LoadingButton
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            loading={saving}
                            onClick={handleSaveAll}
                            disabled={tableData.length === 0}
                        >
                            Save All Changes
                        </LoadingButton>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/dashboard/supply-chain')}
                        >
                            Cancel
                        </Button>
                    </Stack>
                </Box>

                {tableData.length === 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        No Purchase Orders selected. Please go back to the Purchase Order list and select POs to edit.
                    </Alert>
                )}

                {tableData.length > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>

                    </Typography>
                )}
            </Card>

            {/* AG Grid */}
            {tableData.length > 0 && (
                <Card sx={{ p: 2 }}>
                    <div style={containerStyle}>
                        <div style={{ width: '100%', height: '100%' }}>
                            <AgGridReact
                                ref={gridRef}
                                rowData={tableData}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                rowDragManaged={true}
                                animateRows={true}
                                enableRangeSelection={true}
                                enableFillHandle={true}
                                fillHandleDirection="y"
                                undoRedoCellEditing={true}
                                undoRedoCellEditingLimit={20}
                                rowSelection="multiple"
                                suppressRowClickSelection={true}
                                stopEditingWhenCellsLoseFocus={true}
                                pagination={true}
                                paginationPageSize={10}
                                paginationPageSizeSelector={[10, 20, 30,]}
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default EditOrderPage;
