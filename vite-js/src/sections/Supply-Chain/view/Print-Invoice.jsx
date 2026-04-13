import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
    AppBar,
    Box,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Toolbar,
    Typography,
    CircularProgress,
} from '@mui/material';
import { ZoomIn, ZoomOut, Print, Download } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ----------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper: Convert number to words (simple version for USD)
function numberToWords(amount) {
    if (!amount) return '';
    const num = Math.floor(amount);
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const scales = ['', 'THOUSAND', 'MILLION', 'BILLION'];

    function convertGroup(n) {
        let res = '';
        if (n >= 100) {
            res += `${ones[Math.floor(n / 100)]} HUNDRED `;
            n %= 100;
        }
        if (n >= 20) {
            res += `${tens[Math.floor(n / 10)]} `;
            n %= 10;
        }
        if (n > 0) {
            res += `${ones[n]} `;
        }
        return res;
    }

    if (num === 0) return 'ZERO';

    let res = '';
    let scaleIndex = 0;
    let n = num;

    while (n > 0) {
        let group = n % 1000;
        if (group > 0) {
            res = convertGroup(group) + scales[scaleIndex] + (res ? ' ' : '') + res;
        }
        n = Math.floor(n / 1000);
        scaleIndex += 1;
    }

    return `${res.trim()} US$ ONLY`;
}

export default function PrintInvoicePage() {
    const { state } = useLocation();
    const { id } = useParams();

    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch invoice data from API
    useEffect(() => {
        const fetchInvoiceData = async () => {
            try {
                setLoading(true);
                // Get invoice number from shipment data in state
                // Note: user-list-view.jsx maps ldpInvoiceNo to 'ldp' in its shipment row
                const invoiceNo =
                    state?.shipment?.ldp ||
                    state?.shipment?.ldpInvoiceNo ||
                    state?.invoiceNo ||
                    id ||
                    'Ast-jb 4729';

                console.log('Fetching invoice data for:', invoiceNo);
                console.log('API URL:', `${API_BASE_URL}/api/Report/PrintInvoicePDF/${encodeURIComponent(invoiceNo)}`);

                // Get authentication token
                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await fetch(
                    `${API_BASE_URL}/api/Report/PrintInvoicePDF/${encodeURIComponent(invoiceNo)}`,
                    { headers }
                );

                console.log('API Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`Failed to fetch invoice data (${response.status}): Invoice "${invoiceNo}" not found or API endpoint incorrect`);
                }

                const responseData = await response.json();
                console.log('API Response data:', responseData);

                // Handle both array and object responses
                const data = Array.isArray(responseData) ? responseData[0] : responseData;

                if (!data) {
                    throw new Error('No data found in API response');
                }

                // Transform API data to match our invoice structure
                const products = Array.isArray(responseData) ? responseData : [data];

                // Recalculate Shipment Total based on products
                const shipmentPcsTotal = products.reduce((acc, curr) => acc + (curr.shipQty || 0), 0);
                const shipmentCartonsTotal = products.reduce((acc, curr) => acc + (curr.shipCartons || 0), 0);
                const shipmentAmountTotal = products.reduce((acc, curr) => acc + (curr.shipQty || 0) * (curr.ldpRate || 0), 0);

                // Charges from the first item (assuming global for the invoice)
                const truckingCharges = data.subTotalA1New || 0;
                const deductions = data.subTotalA2New || 0;
                const adjustments = data.subTotalA3New || 0;
                const netFinReceivable = shipmentAmountTotal + truckingCharges - deductions + adjustments;

                const transformedData = {
                    companyName: 'All Seasons textile',
                    companyAddress: '1441 BROADWAY, SUITE # 4142 NEW YORK, NY 10018',
                    country: 'USA',
                    invoiceNo: data.ldpInvoiceNo || invoiceNo,
                    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-US') : '02-03-2025',
                    dayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                    time: new Date().toLocaleTimeString('en-US'),
                    dateCode: (data.etwDate && !data.etwDate.startsWith('1900-01-01')) ? new Date(data.etwDate).toLocaleDateString('en-US') : '',

                    // Bill To (using customer data with fallbacks)
                    billTo: {
                        company: data.customerName || 'BAILEY APPAREL',
                        name: data.customerName || 'BAILEY APPAREL',
                        address: data.address || '242 West 38th Street, 5th Floor',
                        city: data.city || 'Baltimore',
                        country: data.country || 'USA',
                    },

                    // Ship To (using cargo consignee data with fallbacks)
                    shipTo: {
                        company: data.cargoConsigneeName || 'Bailey Apparel',
                        name: data.cargoConsigneeName || 'Bailey Apparel',
                        address: data.cargoConsigneeAddress1 || '242 West 38th Street, 5th Floor',
                        city: data.cargooConsigneeCity || 'New jersey',
                        country: data.cargoConsigneeCountry || 'USA',
                    },

                    // Shipping Information
                    shipping: {
                        paymentTerms: data.terms || 'Fob',
                        shipmentMode: data.mode || 'BY SEA',
                        blAwbl: data.billNo || 'Cnckhi7004',
                        containerNo: data.containerNo || 'Ciocu8250178',
                        etdKarachi: data.etdExpectedDate ? new Date(data.etdExpectedDate).toLocaleDateString('en-US') : '01-30-2025',
                        etaDestination: data.etaExpectedDate ? new Date(data.etaExpectedDate).toLocaleDateString('en-US') : '03-08-2025',
                        destination: data.destination || 'New york',
                        marksNos: '',
                        etw: (data.etwDate && !data.etwDate.startsWith('1900-01-01')) ? new Date(data.etwDate).toLocaleDateString('en-US') : '',
                    },

                    // Products (mapping all products from response)
                    products: products.map((item) => ({
                        poNo: item.pono || 'AS41-428',
                        styleNo: item.styles || 'GBL4382-A',
                        prodCode: '',
                        item: item.itemDescriptionInvoice || '100% POLYESTER girls MESH Baseball tee (cill trends)',
                        sizeRange: item.sizeRange || '7/8 - 14/16',
                        ldpUnit: item.ldpRate || 3.5500,
                        shippedQtyInPcs: item.shipQty || 0,
                        shpdOfCartons: item.shipCartons || 0,
                        ldpValue: (item.shipQty || 0) * (item.ldpRate || 0),
                        deductionAmount: '',
                        adjustedAmount: '',
                        invoiceAmount: (item.shipQty || 0) * (item.ldpRate || 0),
                    })),

                    // Totals
                    shipmentTotal: {
                        pcs: shipmentPcsTotal || 9600,
                        cartons: shipmentCartonsTotal || 300,
                        label: 'Ctns',
                        amount: shipmentAmountTotal || 33000.00,
                    },

                    truckingCharges: truckingCharges,
                    deductions: deductions,
                    adjustments: adjustments,

                    netReceivable: netFinReceivable || 33000,
                    remarks: data.remarks || 'Shipped',
                    amountInWords: numberToWords(Math.round(netFinReceivable || 33000)),

                    // Beneficiary
                    beneficiary: {
                        company: 'All Seasons textile',
                        address: '1441 BROADWAY, SUITE # 4142 NEW YORK,',
                        city: 'NY 10018',
                        country: 'USA',
                    },

                    // Bank
                    bank: {
                        name: data.bankName || 'HAB BANK',
                        address: data.bankBranch || '1300 EAST 45TH STREET NEW YORK NY 10016',
                        country: 'USA',
                        accountNo: data.accountNo || '101728713',
                        routingNo: data.iban || '026007542',
                    },
                };

                setInvoiceData(transformedData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching invoice data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchInvoiceData();
    }, [id, state]);

    const contentRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(1.2);
    const [downloading, setDownloading] = useState(false);

    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Invoice_${invoiceData?.invoiceNo || 'invoice'}`,
    });

    const handleDownloadPDF = async () => {
        const element = contentRef.current;
        if (!element || !invoiceData) return;

        const originalTransform = element.style.transform;
        const originalTransition = element.style.transition;

        try {
            setDownloading(true);

            // Ensure we capture at 100% (ignore zoom scale) for correct PDF sizing
            element.style.transform = 'scale(1)';
            element.style.transition = 'none';

            const pages = Array.from(element.children);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pages.length; i += 1) {
                const page = pages[i];
                if (!(page instanceof HTMLElement)) continue;

                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#FFFFFF',
                });

                const imgData = canvas.toDataURL('image/png');
                const ratio = pdfWidth / canvas.width;
                const finalHeight = canvas.height * ratio;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(finalHeight, pdfHeight));
                if (i < pages.length - 1) {
                    pdf.addPage();
                }
            }

            pdf.save(`Invoice_${invoiceData.invoiceNo || 'invoice'}.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
        } finally {
            element.style.transform = originalTransform;
            element.style.transition = originalTransition;
            setDownloading(false);
        }
    };

    // Common styles
    const labelStyle = { fontSize: 10, color: '#000', fontWeight: 600 };
    const valueStyle = { fontSize: 10, color: '#000' };
    const cellStyle = { fontSize: 9, py: 0.3, px: 0.5, border: '1px solid #ccc', color: '#000' };
    const headerCellStyle = { ...cellStyle, fontWeight: 700, backgroundColor: '#f5f5f5', color: '#000' };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f5f5f5',
            }}
        >
            {/* Toolbar */}
            <AppBar
                position="static"
                sx={{
                    backgroundColor: '#3C3C3C',
                    color: '#fff',
                    boxShadow: 'none',
                }}
            >
                <Toolbar variant="dense" sx={{ minHeight: '48px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Typography
                            variant="h6"
                            sx={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}
                        >
                            Print Invoice{invoiceData?.invoiceNo ? ` - ${invoiceData.invoiceNo}` : ''}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                        <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#fff' }}>
                            <ZoomOut fontSize="small" />
                        </IconButton>
                        <Typography sx={{ fontSize: '12px', color: '#fff', mx: 1, minWidth: '40px', textAlign: 'center' }}>
                            {Math.round(zoomLevel * 100)}%
                        </Typography>
                        <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#fff' }}>
                            <ZoomIn fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                        <IconButton
                            size="small"
                            onClick={handleDownloadPDF}
                            disabled={downloading || loading || !!error || !invoiceData}
                            sx={{ color: '#fff' }}
                            title="Download"
                        >
                            <Download fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handlePrint} sx={{ color: '#fff' }}>
                            <Print fontSize="small" />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Content */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    backgroundColor: '#282828',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                }}
            >
                {/* Loading State */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                        <CircularProgress sx={{ color: '#fff' }} />
                    </Box>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                        <Typography sx={{ color: '#fff', fontSize: 16 }}>
                            Error loading invoice: {error}
                        </Typography>
                    </Box>
                )}

                {/* Invoice Content */}
                {!loading && !error && invoiceData && (
                    <Box
                        ref={contentRef}
                        sx={{
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s ease-in-out',
                        }}
                    >
                        {/* ===================== PAGE 1 ===================== */}
                        <Paper
                            elevation={3}
                            sx={{
                                p: 3,
                                borderRadius: 0,
                                backgroundColor: '#ffffff',
                                width: '210mm',
                                minHeight: '297mm',
                                fontFamily: 'Arial, sans-serif',
                                mb: 3,
                                position: 'relative',
                                border: '1px solid #000',
                            }}
                        >
                            {/* Header */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Box>
                                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#000' }}>
                                        {invoiceData.companyName}
                                    </Typography>
                                    <Typography sx={{ fontSize: 10, color: '#000' }}>
                                        {invoiceData.companyAddress}
                                    </Typography>
                                    <Typography sx={{ fontSize: 10, color: '#000' }}>
                                        {invoiceData.country}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography sx={{ fontSize: 8, color: '#000' }}>
                                        {invoiceData.dateCode}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* INVOICE Heading */}
                            <Typography
                                align="center"
                                sx={{ fontSize: 20, fontWeight: 700, color: '#000', my: 2, letterSpacing: 2 }}
                            >
                                INVOICE
                            </Typography>

                            {/* Invoice # and Date row */}
                            {/* Invoice # and Date row - no border */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Typography sx={labelStyle}>Invoice # :</Typography>
                                    <Typography sx={valueStyle}>{invoiceData.invoiceNo}</Typography>
                                    <Typography sx={{ ...labelStyle, ml: 3 }}>Date :</Typography>
                                    <Typography sx={valueStyle}>{invoiceData.invoiceDate}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography sx={{ fontSize: 10 }}>{invoiceData.dayDate}</Typography>
                                    <Typography sx={{ fontSize: 10 }}>{invoiceData.time}</Typography>
                                </Box>
                            </Box>

                            {/* Bill To / Ship To */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                                {/* Bill To */}
                                <Box sx={{ border: '1px solid #000' }}>
                                    <Box sx={{ backgroundColor: '#f5f5f5', p: 0.5, borderBottom: '1px solid #000' }}>
                                        <Typography sx={{ fontSize: 9, fontWeight: 600 }}>Bill To :</Typography>
                                    </Box>
                                    <Box sx={{ p: 1 }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#000' }}>{invoiceData.billTo.company}</Typography>
                                        <Typography sx={{ fontSize: 10 }}>{invoiceData.billTo.name}</Typography>
                                        <Typography sx={{ fontSize: 10 }}>{invoiceData.billTo.address}</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, borderTop: '1px solid #ccc', pt: 0.5 }}>
                                            <Typography sx={{ fontSize: 10 }}>{invoiceData.billTo.city}</Typography>
                                            <Typography sx={{ fontSize: 10 }}>{invoiceData.billTo.country}</Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Ship To */}
                                <Box sx={{ border: '1px solid #000' }}>
                                    <Box sx={{ backgroundColor: '#f5f5f5', p: 0.5, borderBottom: '1px solid #000' }}>
                                        <Typography sx={{ fontSize: 9, fontWeight: 600 }}>Ship To :</Typography>
                                    </Box>
                                    <Box sx={{ p: 1 }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#000' }}>{invoiceData.shipTo.company}</Typography>
                                        <Typography sx={{ fontSize: 10 }}>{invoiceData.shipTo.name}</Typography>
                                        <Typography sx={{ fontSize: 10 }}>{invoiceData.shipTo.address}</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, borderTop: '1px solid #ccc', pt: 0.5 }}>
                                            <Typography sx={{ fontSize: 10 }}>{invoiceData.shipTo.city}</Typography>
                                            <Typography sx={{ fontSize: 10 }}>{invoiceData.shipTo.country}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Shipping Information - only header underline, no outer border */}
                            <Box sx={{ mb: 2 }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#000', borderBottom: '1px solid #000', pb: 0.5, mb: 1 }}>Shipping Information</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.5 }}>
                                    <MetaRow label="Payment Terms" value={invoiceData.shipping.paymentTerms} labelStyle={labelStyle} valueStyle={valueStyle} />
                                    <MetaRow label="BL - AWBL" value={invoiceData.shipping.blAwbl} labelStyle={labelStyle} valueStyle={valueStyle} />
                                    <Box />
                                    <MetaRow label="Shipment Mode" value={invoiceData.shipping.shipmentMode} labelStyle={labelStyle} valueStyle={valueStyle} />
                                    <MetaRow label="Container #" value={invoiceData.shipping.containerNo} labelStyle={labelStyle} valueStyle={valueStyle} />
                                    <MetaRow label="Marks & Nos" value={invoiceData.shipping.marksNos || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
                                    <MetaRow label="ETD - Karachi" value={invoiceData.shipping.etdKarachi} labelStyle={labelStyle} valueStyle={valueStyle} />
                                    <Box />
                                    <Box />
                                    <MetaRow label="ETA - Destination" value={invoiceData.shipping.etaDestination} labelStyle={labelStyle} valueStyle={valueStyle} />
                                    <MetaRow label="Destination" value={invoiceData.shipping.destination} labelStyle={labelStyle} valueStyle={valueStyle} />
                                    <Box />
                                    <MetaRow label="ETW" value={invoiceData.shipping.etw || ''} labelStyle={labelStyle} valueStyle={valueStyle} />
                                </Box>
                            </Box>

                            {/* Product & Quantity Information */}
                            <Box sx={{ border: '1px solid #000', mb: 2 }}>
                                <Box sx={{ backgroundColor: '#fffde7', p: 0.5, borderBottom: '1px solid #000' }}>
                                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#000' }}>Product & Quantity Information</Typography>
                                </Box>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={headerCellStyle}>P.O #</TableCell>
                                            <TableCell sx={headerCellStyle}>Style # / Prod Code</TableCell>
                                            <TableCell sx={headerCellStyle}>Item</TableCell>
                                            <TableCell sx={headerCellStyle}>Size Range</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">LDP Unit</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">Shipped Qty in Pcs</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">SHPD # of Cartons</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">LDP Value</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">Deduction Amount (if Any)</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">Adjusted Amount (if Any)</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">Invoice Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {invoiceData.products.map((product, index) => (
                                            <TableRow key={index}>
                                                <TableCell sx={cellStyle}>{product.poNo}</TableCell>
                                                <TableCell sx={cellStyle}>
                                                    {product.styleNo}
                                                    {product.prodCode && <Box sx={{ fontSize: 8, color: '#000' }}>{product.prodCode}</Box>}
                                                </TableCell>
                                                <TableCell sx={{ ...cellStyle, color: '#000' }}>{product.item}</TableCell>
                                                <TableCell sx={cellStyle}>{product.sizeRange}</TableCell>
                                                <TableCell sx={cellStyle} align="right">{product.ldpUnit?.toFixed(4)}</TableCell>
                                                <TableCell sx={cellStyle} align="right">{product.shippedQtyInPcs?.toFixed(2)}</TableCell>
                                                <TableCell sx={cellStyle} align="right">{product.shpdOfCartons?.toFixed(2)}</TableCell>
                                                <TableCell sx={cellStyle} align="right">{product.ldpValue?.toLocaleString()}</TableCell>
                                                <TableCell sx={cellStyle} align="right">{product.deductionAmount || ''}</TableCell>
                                                <TableCell sx={cellStyle} align="right">{product.adjustedAmount || ''}</TableCell>
                                                <TableCell sx={cellStyle} align="right">{product.invoiceAmount?.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>

                            {/* Footer Page 1 */}
                            <Box sx={{ position: 'absolute', bottom: 20, left: 0, right: 0, px: 3 }}>
                                <Box sx={{ borderTop: '2px solid #000', pt: 1, display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>President</Typography>
                                    <Typography sx={{ fontSize: 12 }}>Page # : 1</Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* ===================== PAGE 2 ===================== */}
                        <Paper
                            elevation={3}
                            sx={{
                                p: 3,
                                borderRadius: 0,
                                backgroundColor: '#ffffff',
                                width: '210mm',
                                minHeight: '297mm',
                                fontFamily: 'Arial, sans-serif',
                                position: 'relative',
                                border: '1px solid #000',
                            }}
                        >
                            {/* Product table header (continued) */}
                            <Box sx={{ border: '1px solid #000', mb: 2 }}>
                                <Box sx={{ backgroundColor: '#fffde7', p: 0.5, borderBottom: '1px solid #000' }}>
                                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#000' }}>Product & Quantity Information</Typography>
                                </Box>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={headerCellStyle}>P.O #</TableCell>
                                            <TableCell sx={headerCellStyle}>Style # / Prod Code</TableCell>
                                            <TableCell sx={headerCellStyle}>Item</TableCell>
                                            <TableCell sx={headerCellStyle}>Size Range</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">LDP Unit</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">Shipped Qty in Pcs</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">SHPD # of Cartons</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">LDP Value</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">Deduction Amount (if Any)</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">Adjusted Amount (if Any)</TableCell>
                                            <TableCell sx={headerCellStyle} align="right">Invoice Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {/* Shipment Total Row */}
                                        <TableRow>
                                            <TableCell sx={cellStyle} colSpan={4}>
                                                <Typography sx={{ fontWeight: 700, fontSize: 10 }}>Shipment Total :-</Typography>
                                            </TableCell>
                                            <TableCell sx={cellStyle} align="right">{invoiceData.shipmentTotal.pcs?.toLocaleString()}</TableCell>
                                            <TableCell sx={cellStyle} align="right">Pcs</TableCell>
                                            <TableCell sx={cellStyle} align="right">{invoiceData.shipmentTotal.cartons}</TableCell>
                                            <TableCell sx={cellStyle} align="right">{invoiceData.shipmentTotal.label}</TableCell>
                                            <TableCell sx={cellStyle} colSpan={2}></TableCell>
                                            <TableCell sx={cellStyle} align="right">
                                                <Typography sx={{ fontWeight: 700, fontSize: 10 }}>{invoiceData.shipmentTotal.amount?.toLocaleString()} US$</Typography>
                                            </TableCell>
                                        </TableRow>
                                        {/* Trucking Charges */}
                                        <TableRow>
                                            <TableCell sx={cellStyle} colSpan={10}>
                                                <Typography sx={{ textAlign: 'right', pr: 2, fontSize: 10 }}>Add trucking charges</Typography>
                                            </TableCell>
                                            <TableCell sx={cellStyle} align="right">{invoiceData.truckingCharges?.toLocaleString()} US$</TableCell>
                                        </TableRow>
                                        {/* Deductions */}
                                        <TableRow>
                                            <TableCell sx={cellStyle} colSpan={10}>
                                                <Typography sx={{ textAlign: 'right', pr: 2, fontSize: 10 }}>Deductions</Typography>
                                            </TableCell>
                                            <TableCell sx={cellStyle} align="right">{(invoiceData.deductions || 0)?.toLocaleString()} US$</TableCell>
                                        </TableRow>
                                        {/* Adjustments */}
                                        <TableRow>
                                            <TableCell sx={cellStyle} colSpan={10}>
                                                <Typography sx={{ textAlign: 'right', pr: 2, fontSize: 10 }}>Adjustments</Typography>
                                            </TableCell>
                                            <TableCell sx={cellStyle} align="right">{(invoiceData.adjustments || 0)?.toLocaleString()} US$</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Box>

                            {/* Net Receivable */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                                <Box sx={{ border: '2px solid #000', display: 'flex', alignItems: 'center', gap: 3, px: 2, py: 1 }}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#000' }}>Net Receivable :</Typography>
                                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{invoiceData.netReceivable?.toLocaleString()} US$</Typography>
                                </Box>
                            </Box>

                            {/* Remarks */}
                            <Box sx={{ border: '1px solid #000', mb: 2, p: 1 }}>
                                <Typography sx={{ fontSize: 11 }}>
                                    <b style={{ color: '#000' }}>Remarks :</b> <span style={{ color: '#000' }}>{invoiceData.remarks}</span>
                                </Typography>
                            </Box>

                            {/* Invoice Amount in Words */}
                            <Box sx={{ border: '1px solid #000', mb: 3, p: 1 }}>
                                <Typography sx={{ fontSize: 11 }}>
                                    <b style={{ color: '#000' }}>Invoice Amount in Words :</b> <span style={{ color: '#000' }}>{invoiceData.amountInWords}</span>
                                </Typography>
                            </Box>

                            {/* Beneficiary and Bank */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 4 }}>
                                {/* For Wire Transfer Beneficiary */}
                                <Box sx={{ border: '1px solid #000' }}>
                                    <Box sx={{ backgroundColor: '#fffde7', p: 0.5, borderBottom: '1px solid #000' }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#000' }}>For Wire Transfer Beneficiary :</Typography>
                                    </Box>
                                    <Box sx={{ p: 1 }}>
                                        <Typography sx={{ fontSize: 10, fontWeight: 600 }}>{invoiceData.beneficiary.company}</Typography>
                                        <Typography sx={{ fontSize: 10 }}>{invoiceData.beneficiary.address}</Typography>
                                        <Typography sx={{ fontSize: 10 }}>{invoiceData.beneficiary.city}</Typography>
                                        <Typography sx={{ fontSize: 10 }}>{invoiceData.beneficiary.country}</Typography>
                                    </Box>
                                </Box>

                                {/* Beneficiary's Bank */}
                                <Box sx={{ border: '1px solid #000' }}>
                                    <Box sx={{ backgroundColor: '#fffde7', p: 0.5, borderBottom: '1px solid #000' }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#000' }}>Beneficiary's Bank :</Typography>
                                    </Box>
                                    <Box sx={{ p: 1 }}>
                                        <Typography sx={{ fontSize: 10, fontWeight: 600 }}>{invoiceData.bank.name}</Typography>
                                        <Typography sx={{ fontSize: 10 }}>{invoiceData.bank.address}</Typography>
                                        <Typography sx={{ fontSize: 10 }}>{invoiceData.bank.country}</Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Typography sx={{ fontSize: 10 }}><b>Account No. :</b> {invoiceData.bank.accountNo}</Typography>
                                            <Typography sx={{ fontSize: 10 }}><b>Routing No. :</b> {invoiceData.bank.routingNo}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Footer Page 2 */}
                            <Box sx={{ position: 'absolute', bottom: 20, left: 0, right: 0, px: 3 }}>
                                <Box sx={{ borderTop: '2px solid #000', pt: 1, display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>President</Typography>
                                    <Typography sx={{ fontSize: 12 }}>Page # : 2</Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

function MetaRow({ label, value, labelStyle, valueStyle }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.3 }}>
            <Typography sx={{ ...labelStyle, minWidth: 80 }}>{label} :</Typography>
            <Typography sx={{ ...valueStyle, ml: 1 }}>{value}</Typography>
        </Box>
    );
}