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
                const invoiceNo =
                    state?.shipment?.ldp ||
                    state?.shipment?.ldpInvoiceNo ||
                    state?.invoiceNo ||
                    id ||
                    'Ast-jb 4729';

                const token = localStorage.getItem('accessToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await fetch(
                    `${API_BASE_URL}/api/Report/PrintInvoicePDF/${encodeURIComponent(invoiceNo)}`,
                    { headers }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch invoice data (${response.status})`);
                }

                const responseData = await response.json();
                const data = Array.isArray(responseData) ? responseData[0] : responseData;

                if (!data) {
                    throw new Error('No data found in API response');
                }

                const allDetails = Array.isArray(responseData)
                    ? responseData.flatMap(item => item.details || [item])
                    : (data.details || [data]);

                const currentLdpForFilter = (invoiceNo || data.ldpInvoiceNo || '').toLowerCase().trim();
                const products = allDetails.filter(p => {
                    const pLdp = (p.ldpInvoiceNo || '').toLowerCase().trim();
                    // If we have a specific invoiceNo we're looking for, filter by it.
                    // If pLdp is empty, it might be a non-split item, so we might want to include it?
                    // But usually in split shipments, every row has an ldpInvoiceNo.
                    if (currentLdpForFilter) {
                        return pLdp === currentLdpForFilter;
                    }
                    return true;
                });

                const shipmentPcsTotal = products.reduce((acc, curr) => acc + (Number(curr.quantity || curr.shipQty || 0)), 0);
                const shipmentCartonsTotal = products.reduce((acc, curr) => acc + (Number(curr.cartons || curr.shipCartons || 0)), 0);
                const shipmentAmountTotal = products.reduce((acc, curr) => acc + (Number(curr.quantity || curr.shipQty || 0) * Number(curr.shippedRate || curr.ldpRate || 0)), 0);

                const getAnyCase = (obj, key) => {
                    if (!obj || typeof obj !== 'object') return null;
                    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
                    return foundKey ? obj[foundKey] : null;
                };

                const getValue = (key) => {
                    const currentLdp = (invoiceNo || data.ldpInvoiceNo || '').toLowerCase().trim();

                    // 1. First, search for a specific match in ALL subTotalDetails across ALL shipment items
                    if (Array.isArray(responseData)) {
                        for (const shipment of responseData) {
                            if (shipment.subTotalDetails && Array.isArray(shipment.subTotalDetails)) {
                                const match = shipment.subTotalDetails.find(s => (s.ldpInvoiceNo || s.invoiceno || '').toLowerCase().trim() === currentLdp);
                                if (match) {
                                    const val = getAnyCase(match, key);
                                    if (val !== null && val !== undefined && val !== "" && (typeof val !== 'number' || val !== 0)) return val;
                                }
                            }
                        }
                    }

                    // 2. Search in the root of the CURRENT shipment item
                    let val = getAnyCase(data, key);
                    if (val !== null && val !== undefined && val !== "" && (typeof val !== 'number' || val !== 0)) return val;

                    // 3. Search in the root of ALL other shipment items
                    if (Array.isArray(responseData)) {
                        for (const item of responseData) {
                            val = getAnyCase(item, key);
                            if (val !== null && val !== undefined && val !== "" && (typeof val !== 'number' || val !== 0)) return val;
                        }
                    }

                    // 4. Fallback: Search any subTotalDetail at all (ONLY if no split invoice is specified)
                    if (!invoiceNo && Array.isArray(responseData)) {
                        for (const shipment of responseData) {
                            if (shipment.subTotalDetails && Array.isArray(shipment.subTotalDetails) && shipment.subTotalDetails.length > 0) {
                                val = getAnyCase(shipment.subTotalDetails[0], key);
                                if (val !== null && val !== undefined && val !== "" && (typeof val !== 'number' || val !== 0)) return val;
                            }
                        }
                    }

                    return 0;
                };

                const getNonEmptyLabel = (keys) => {
                    for (const key of keys) {
                        const val = getValue(key);
                        if (val && typeof val === 'string' && val !== "") return val;
                    }
                    return "";
                };

                const getNonZeroValue = (keys) => {
                    for (const key of keys) {
                        const val = getValue(key);
                        if (val !== null && val !== undefined && val !== "" && Number(val) !== 0) return Number(val);
                    }
                    return 0;
                };

                const truckingChargesLabel = getNonEmptyLabel(['subTotalH1New', 'subTotalH1', 'top1']);
                const truckingCharges = getNonZeroValue(['subTotalA1New', 'subTotalA1', 'amt1']);

                const deductionsLabel = getNonEmptyLabel(['subTotalH2New', 'subTotalH2', 'top2']);
                const deductions = getNonZeroValue(['subTotalA2New', 'subTotalA2', 'amt2']);

                const adjustmentsLabel = getNonEmptyLabel(['subTotalH3New', 'subTotalH3', 'top3']);
                const adjustments = getNonZeroValue(['subTotalA3New', 'subTotalA3', 'amt3']);

                const netFinReceivable = shipmentAmountTotal + truckingCharges + deductions + adjustments;

                const transformedData = {
                    companyName: 'All Seasons Textile',
                    companyAddress: '1441 BROADWAY, SUITE # 6162 NEW YORK , NY 10018',
                    country: 'NY USA',
                    invoiceNo: invoiceNo || data.ldpInvoiceNo || '',
                    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '09-30-2025',
                    dayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                    dateCode: (data.etwDate && !data.etwDate.startsWith('1900-01-01')) ? new Date(data.etwDate).toLocaleDateString('en-US') : '',
                    companyAddress: '1441 BROADWAY, SUITE # 6162 NEW YORK , NY 10018',
                    country: 'NY USA',
                    invoiceNo: invoiceNo || data.ldpInvoiceNo || '',
                    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '09-30-2025',
                    dayDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                    dateCode: (data.etwDate && !data.etwDate.startsWith('1900-01-01')) ? new Date(data.etwDate).toLocaleDateString('en-US') : '',

                    billTo: {
                        company: data.customerName || 'LONE ROCK',
                        name: data.customerName || 'LONE ROCK',
                        address: data.address || '4080 West Farm Road West Jordan Utah',
                        zip: '84088',
                        city: data.city || 'New York',
                        country: data.country || 'USA',
                    },

                    shipTo: {
                        company: data.cargoConsigneeName || 'LONE ROCK',
                        name: data.cargoConsigneeName || 'LONE ROCK',
                        address: data.cargoConsigneeAddress1 || '4080 West Farm Road West Jordan Utah',
                        zip: '84088',
                        city: data.cargooConsigneeCity || 'New York',
                        country: data.cargoConsigneeCountry || 'USA',
                    },

                    shipping: {
                        paymentTerms: data.terms || 'FOB',
                        shipmentMode: data.mode || 'BY SEA',
                        blAwbl: data.billNo || 'CNCKHI7316,CNCKHI7318',
                        containerNo: data.containerNo || 'MRKU2864280',
                        etdKarachi: data.etdExpectedDate ? new Date(data.etdExpectedDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '09-25-2025',
                        etaDestination: data.etaExpectedDate ? new Date(data.etaExpectedDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '10-28-2025',
                        destination: data.destination || 'NEW YORK',
                        marksNos: '',
                        etw: (data.etwDate && !data.etwDate.startsWith('1900-01-01')) ? new Date(data.etwDate).toLocaleDateString('en-US') : '',
                    },

                    products: products.map((item) => {
                        const qty = Number(item.quantity || item.shipQty || 0);
                        const rate = Number(item.shippedRate || item.ldpRate || 0);
                        const cartons = Number(item.cartons || item.shipCartons || 0);
                        return {
                            poNo: item.pono || '',
                            styleNo: item.styles || '',
                            prodCode: 'NA',
                            item: item.itemDescriptionInvoice || item.itemDescription || '',
                            sizeRange: item.sizeRange || '',
                            ldpUnit: rate,
                            shippedQtyInPcs: qty,
                            shpdOfCartons: cartons,
                            ldpValue: qty * rate,
                            deductionAmount: '',
                            adjustedAmount: '',
                            invoiceAmount: qty * rate,
                        };
                    }),

                    shipmentTotal: {
                        pcs: shipmentPcsTotal,
                        cartons: shipmentCartonsTotal,
                        label: 'Ctns',
                        amount: shipmentAmountTotal,
                    },

                    truckingChargesLabel,
                    truckingCharges,
                    deductionsLabel,
                    deductions,
                    adjustmentsLabel,
                    adjustments,
                    netReceivable: netFinReceivable,
                    remarks: data.remarks || 'Shipped',
                    amountInWords: numberToWords(Math.round(netFinReceivable)),

                    beneficiary: {
                        company: 'All Seasons Textile',
                        address: '1441 BROADWAY, SUITE # 6162 NEW YORK,',
                        city: 'NY 10018',
                        country: 'USA',
                    },

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
                setError(err.message);
                setLoading(false);
            }
        };

        fetchInvoiceData();
    }, [id, state]);

    const contentRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(1.1);
    const [downloading, setDownloading] = useState(false);

    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Invoice_${invoiceData?.invoiceNo || 'invoice'}`,
        pageStyle: `
            @page {
                size: A4;
                margin: 0;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                }
            }
        `
    });

    const handleDownloadPDF = async () => {
        const element = contentRef.current;
        if (!element || !invoiceData) return;

        try {
            setDownloading(true);
            const originalTransform = element.style.transform;
            element.style.transform = 'scale(1)';

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
                    backgroundColor: '#FFFFFF',
                });

                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                if (i < pages.length - 1) {
                    pdf.addPage();
                }
            }

            pdf.save(`Invoice_${invoiceData.invoiceNo || 'invoice'}.pdf`);
            element.style.transform = originalTransform;
        } catch (err) {
            console.error('Error generating PDF:', err);
        } finally {
            setDownloading(false);
        }
    };

    // Styles
    const labelStyle = { fontSize: '10px', color: '#000', fontWeight: 500, fontFamily: 'Arial Narrow, Arial' };
    const valueStyle = { fontSize: '10px', color: '#000', fontFamily: 'Arial Narrow, Arial' };
    const cellStyle = { fontSize: '9px', p: '2px 4px', border: '1px solid #000', color: '#000', fontFamily: 'Arial Narrow, Arial', lineHeight: 1.1 };
    const headerCellStyle = {
        ...cellStyle,
        fontWeight: 600,
        backgroundColor: '#f5f5f5',
        textAlign: 'center',
        verticalAlign: 'bottom'
    };

    // Pagination Logic
    // If we have many products, we split them. 
    // Otherwise we keep them on Page 1.
    const MAX_ROWS_PAGE_1 = 12; // Adjusted based on available space with header
    const productsPage1 = invoiceData?.products.slice(0, MAX_ROWS_PAGE_1) || [];
    const productsPage2 = invoiceData?.products.slice(MAX_ROWS_PAGE_1) || [];
    const hasMorePages = productsPage2.length > 0;

    // Helper to render the table
    const renderTable = (products, showTotals = false) => (
        <Table size="small" sx={{ borderCollapse: 'collapse', '& td, & th': { border: '1px solid #000' } }}>
            <TableHead>
                <TableRow sx={{ height: '35px' }}>
                    <TableCell sx={{ ...headerCellStyle, width: '60px' }}>P.O #</TableCell>
                    <TableCell sx={{ ...headerCellStyle, width: '80px' }}>Style # / Prod Code</TableCell>
                    <TableCell sx={{ ...headerCellStyle }}>Item</TableCell>
                    <TableCell sx={{ ...headerCellStyle, width: '50px' }}>Size Range</TableCell>
                    <TableCell sx={{ ...headerCellStyle, width: '50px' }}>LDP Unit</TableCell>
                    <TableCell sx={{ ...headerCellStyle, width: '50px' }}>Shipped Qty in Pcs</TableCell>
                    <TableCell sx={{ ...headerCellStyle, width: '50px' }}>SHPD # of Cartons</TableCell>
                    <TableCell sx={{ ...headerCellStyle, width: '60px' }}>LDP Value</TableCell>
                    <TableCell sx={{ ...headerCellStyle, width: '60px' }}>Deduction Amount (if Any)</TableCell>
                    <TableCell sx={{ ...headerCellStyle, width: '60px' }}>Adjusted Amount (if Any)</TableCell>
                    <TableCell sx={{ ...headerCellStyle, width: '70px' }}>Invoice Amount Due</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {products.map((product, index) => (
                    <TableRow key={index} sx={{ minHeight: '25px' }}>
                        <TableCell sx={cellStyle}>{product.poNo}</TableCell>
                        <TableCell sx={cellStyle}>
                            <Box sx={{ fontWeight: 'bold' }}>{product.styleNo}</Box>
                            <Box sx={{ fontSize: '8px' }}>{product.prodCode}</Box>
                        </TableCell>
                        <TableCell sx={cellStyle}>{product.item}</TableCell>
                        <TableCell sx={{ ...cellStyle, textAlign: 'center' }}>{product.sizeRange}</TableCell>
                        <TableCell sx={{ ...cellStyle, textAlign: 'right' }}>{product.ldpUnit?.toFixed(4)}</TableCell>
                        <TableCell sx={{ ...cellStyle, textAlign: 'right' }}>{product.shippedQtyInPcs?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell sx={{ ...cellStyle, textAlign: 'right' }}>{product.shpdOfCartons?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell sx={{ ...cellStyle, textAlign: 'right' }}>{product.ldpValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell sx={cellStyle} align="right">{product.deductionAmount}</TableCell>
                        <TableCell sx={cellStyle} align="right">{product.adjustedAmount}</TableCell>
                        <TableCell sx={{ ...cellStyle, textAlign: 'right', fontWeight: index === products.length - 1 && showTotals ? 'bold' : 'normal' }}>
                            {product.invoiceAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                    </TableRow>
                ))}

                {showTotals && (
                    <>
                        {/* Shipment Total Row */}
                        <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                            <TableCell sx={{ ...cellStyle, fontWeight: 'bold' }} colSpan={4}>Shipment Total :-</TableCell>
                            <TableCell sx={cellStyle}></TableCell>
                            <TableCell sx={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold' }}>{invoiceData.shipmentTotal.pcs?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell sx={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold' }}>{invoiceData.shipmentTotal.cartons?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell sx={cellStyle} colSpan={3}></TableCell>
                            <TableCell sx={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold' }}>{invoiceData.shipmentTotal.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        {/* Add trucking charges - Always show as requested */}
                        <TableRow>
                            <TableCell sx={{ ...cellStyle, textAlign: 'right' }} colSpan={10}>{invoiceData.truckingChargesLabel || ''}</TableCell>
                            <TableCell sx={{ ...cellStyle, textAlign: 'right' }}>
                                {(invoiceData.truckingCharges || 0).toLocaleString(undefined, {
                                    minimumFractionDigits: (invoiceData.truckingCharges % 1 === 0) ? 0 : 2
                                })} US$
                            </TableCell>
                        </TableRow>
                        {/* Deductions - Always show as requested */}
                        <TableRow>
                            <TableCell sx={{ ...cellStyle, textAlign: 'right' }} colSpan={10}>{invoiceData.deductionsLabel || ''}</TableCell>
                            <TableCell sx={{ ...cellStyle, textAlign: 'right' }}>
                                {(invoiceData.deductions || 0).toLocaleString(undefined, {
                                    minimumFractionDigits: (invoiceData.deductions % 1 === 0) ? 0 : 2
                                })} US$
                            </TableCell>
                        </TableRow>
                        {/* Adjustments - Always show as requested */}
                        <TableRow>
                            <TableCell sx={{ ...cellStyle, textAlign: 'right' }} colSpan={10}>{invoiceData.adjustmentsLabel || ''}</TableCell>
                            <TableCell sx={{ ...cellStyle, textAlign: 'right' }}>
                                {(invoiceData.adjustments || 0).toLocaleString(undefined, {
                                    minimumFractionDigits: (invoiceData.adjustments % 1 === 0) ? 0 : 2
                                })} US$
                            </TableCell>
                        </TableRow>
                        {/* Net Receivable */}
                        <TableRow sx={{ height: '35px' }}>
                            <TableCell sx={{ border: 'none' }} colSpan={7}></TableCell>
                            <TableCell sx={{ ...cellStyle, border: '2px solid #000', fontWeight: 'bold', fontSize: '11px' }} colSpan={3}>Net Receivable :</TableCell>
                            <TableCell sx={{ ...cellStyle, border: '2px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>
                                {invoiceData.netReceivable?.toLocaleString(undefined, { minimumFractionDigits: 2 })} US$
                            </TableCell>
                        </TableRow>
                    </>
                )}
            </TableBody>
        </Table>
    );

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );

    // If no invoice data after loading (e.g., error), show a friendly message
    if (!invoiceData) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
            <Typography color="error" variant="h6">No invoice data found.</Typography>
        </Box>
    );

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
            {/* Toolbar */}
            <AppBar position="static" sx={{ backgroundColor: '#3C3C3C', color: '#fff', boxShadow: 'none' }}>
                <Toolbar variant="dense" sx={{ minHeight: '48px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold' }}>
                            Print Invoice {invoiceData?.invoiceNo ? `- ${invoiceData.invoiceNo}` : ''}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                        <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#fff' }}><ZoomOut fontSize="small" /></IconButton>
                        <Typography sx={{ fontSize: '12px', mx: 1, minWidth: '40px', textAlign: 'center' }}>{Math.round(zoomLevel * 100)}%</Typography>
                        <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#fff' }}><ZoomIn fontSize="small" /></IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 1 }}>
                        <IconButton size="small" onClick={handleDownloadPDF} sx={{ color: '#fff' }}><Download fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={handlePrint} sx={{ color: '#fff' }}><Print fontSize="small" /></IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Content Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 4, backgroundColor: '#282828', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box ref={contentRef} sx={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>

                    {/* PAGE 1 */}
                    <Paper elevation={0} sx={{
                        width: '210mm', height: '297mm', p: '10mm', backgroundColor: '#fff', color: '#000',
                        fontFamily: 'Arial, sans-serif', border: '1px solid #000', position: 'relative',
                        boxSizing: 'border-box', mb: 4
                    }}>
                        {/* Header Box */}
                        <Box sx={{ border: '1px solid #000', p: '10px', mb: '5px' }}>
                            <Typography sx={{ fontSize: '24px', fontWeight: 'bold', lineHeight: 1 }}>{invoiceData?.companyName || ''}</Typography>
                            <Typography sx={{ fontSize: '12px', mt: '4px' }}>{invoiceData?.companyAddress || ''}</Typography>
                            <Typography sx={{ fontSize: '12px' }}>{invoiceData?.country || ''}</Typography>
                        </Box>

                        <Typography align="center" sx={{ fontSize: '22px', fontWeight: 'bold', mb: '5px', letterSpacing: '2px' }}>INVOICE</Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '10px' }}>
                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Box sx={{ display: 'flex' }}>
                                    <Typography sx={{ ...labelStyle, fontWeight: 'bold' }}>Invoice # :</Typography>
                                    <Typography sx={{ ...valueStyle, ml: 1 }}>{invoiceData?.invoiceNo || ''}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex' }}>
                                    <Typography sx={{ ...labelStyle, fontWeight: 'bold' }}>Date :</Typography>
                                    <Typography sx={{ ...valueStyle, ml: 1 }}>{invoiceData?.invoiceDate || ''}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography sx={{ fontSize: '11px' }}>{invoiceData?.dayDate || ''}</Typography>
                                <Typography sx={{ fontSize: '11px' }}>{invoiceData?.time || ''}</Typography>
                            </Box>
                        </Box>

                        {/* Bill To / Ship To */}
                        <Box sx={{ display: 'flex', gap: '20mm', mb: '10px' }}>
                            {['Bill To :', 'Ship To :'].map((title, i) => (
                                <Box key={i} sx={{ flex: 1, border: '1px solid #000', minHeight: '100px', p: '5px' }}>
                                    <Typography sx={{ fontSize: '11px', mb: '10px' }}>{title}</Typography>
                                    <Box sx={{ pl: '20px' }}>
                                        <Typography sx={{ fontSize: '13px', fontWeight: 'bold' }}>{i === 0 ? invoiceData?.billTo?.company || '' : invoiceData?.shipTo?.company || ''}</Typography>
                                        <Typography sx={{ fontSize: '11px' }}>{i === 0 ? invoiceData?.billTo?.name || '' : invoiceData?.shipTo?.name || ''}</Typography>
                                        <Typography sx={{ fontSize: '11px', mt: '5px' }}>{i === 0 ? invoiceData?.billTo?.address || '' : invoiceData?.shipTo?.address || ''}</Typography>
                                        <Typography sx={{ fontSize: '11px' }}>{i === 0 ? invoiceData?.billTo?.zip || '' : invoiceData?.shipTo?.zip || ''}</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '80%', mt: '2px' }}>
                                            <Typography sx={{ fontSize: '11px' }}>{i === 0 ? invoiceData?.billTo?.city || '' : invoiceData?.shipTo?.city || ''}</Typography>
                                            <Typography sx={{ fontSize: '11px' }}>{i === 0 ? invoiceData?.billTo?.country || '' : invoiceData?.shipTo?.country || ''}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        {/* Shipping Info */}
                        <Box sx={{ mb: '10px' }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #000', mb: '5px' }}>Shipping Information</Typography>
                            <Box sx={{ display: 'flex', gap: '5%' }}>
                                <Box sx={{ flex: 1 }}>
                                    <ShippingRow label="Payment Terms" value={invoiceData?.shipping?.paymentTerms || ''} />
                                    <ShippingRow label="Shipment Mode" value={invoiceData?.shipping?.shipmentMode || ''} />
                                    <ShippingRow label="ETD - Karachi :" value={invoiceData?.shipping?.etdKarachi || ''} />
                                    <ShippingRow label="ETA - Destination :" value={invoiceData?.shipping?.etaDestination || ''} />
                                    <ShippingRow label="ETW :" value={invoiceData?.shipping?.etw || ''} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <ShippingRow label="BL - AWBL:" value={invoiceData?.shipping?.blAwbl || ''} />
                                    <ShippingRow label="Container #:" value={invoiceData?.shipping?.containerNo || ''} />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: '40px', mt: '2px' }}>
                                        <Typography sx={{ fontSize: '11px', fontWeight: 'bold' }}>Marks & Nos</Typography>
                                    </Box>
                                    <ShippingRow label="Destination :" value={invoiceData?.shipping?.destination || ''} />
                                </Box>
                            </Box>
                        </Box>

                        {/* Product Table */}
                        <Box sx={{ border: '1px solid #000' }}>
                            <Box sx={{ backgroundColor: '#fdfdfd', p: '2px 5px', borderBottom: '1px solid #000' }}>
                                <Typography sx={{ fontSize: '11px', fontWeight: 'bold' }}>Product & Quantity Information</Typography>
                            </Box>
                            {renderTable(productsPage1, !hasMorePages)}
                        </Box>

                        {/* Summary and Bank Info for Page 1 if no more pages */}
                        {!hasMorePages && (
                            <>
                                <Box sx={{ mt: '10px' }}>
                                    <Box sx={{ border: '1px solid #000', p: '5px', mb: '5px' }}>
                                        <Typography sx={{ fontSize: '10px' }}><span style={{ fontWeight: 'bold' }}>Remarks :</span> {invoiceData.remarks}</Typography>
                                    </Box>
                                    <Box sx={{ border: '1px solid #000', p: '5px', mb: '10px' }}>
                                        <Typography sx={{ fontSize: '10px' }}><span style={{ fontWeight: 'bold' }}>Invoice Amount in Words :</span> {invoiceData.amountInWords}</Typography>
                                    </Box>
                                </Box>

                                {/* Bank & Beneficiary Info */}
                                <Box sx={{ display: 'flex', gap: '20mm', mb: '20px' }}>
                                    <Box sx={{ flex: 1, border: '1px solid #000', p: '5px', minHeight: '100px' }}>
                                        <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mb: '5px' }}>For Wire Transfer Beneficiary :</Typography>
                                        <Box sx={{ pl: '2px' }}>
                                            <Typography sx={{ fontSize: '11px' }}>{invoiceData?.beneficiary?.company || ''}</Typography>
                                            <Typography sx={{ fontSize: '11px' }}>{invoiceData?.beneficiary?.address || ''}</Typography>
                                            <Typography sx={{ fontSize: '11px' }}>{invoiceData?.beneficiary?.city || ''}</Typography>
                                            <Typography sx={{ fontSize: '11px' }}>{invoiceData?.beneficiary?.country || ''}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ flex: 1, border: '1px solid #000', p: '5px', minHeight: '100px' }}>
                                        <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mb: '5px' }}>Beneficiary's Bank :</Typography>
                                        <Box sx={{ pl: '2px' }}>
                                            <Typography sx={{ fontSize: '11px' }}>{invoiceData?.bank?.name || ''}</Typography>
                                            <Typography sx={{ fontSize: '11px' }}>{invoiceData?.bank?.address || ''}</Typography>
                                            <Typography sx={{ fontSize: '11px' }}>{invoiceData?.bank?.country || ''}</Typography>
                                            <Box sx={{ mt: '5px' }}>
                                                <Box sx={{ display: 'flex' }}>
                                                    <Typography sx={{ fontSize: '11px', minWidth: '85px' }}>Account No. :</Typography>
                                                    <Typography sx={{ fontSize: '11px' }}>{invoiceData?.bank?.accountNo || ''}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex' }}>
                                                    <Typography sx={{ fontSize: '11px', minWidth: '85px' }}>Routing No. :</Typography>
                                                    <Typography sx={{ fontSize: '11px' }}>{invoiceData?.bank?.routingNo || ''}</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </>
                        )}

                        {/* Page Footer */}
                        <Box sx={{ position: 'absolute', bottom: '10mm', left: '10mm', right: '10mm', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Box sx={{ borderTop: '1px solid #000', width: '180px', pt: '5px' }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 'bold' }}>President</Typography>
                            </Box>
                            <Typography sx={{ fontSize: '11px' }}>Page # : 1</Typography>
                        </Box>
                    </Paper>

                    {/* PAGE 2 (Optional) */}
                    {hasMorePages && (
                        <Paper elevation={0} sx={{
                            width: '210mm', height: '297mm', p: '10mm', backgroundColor: '#fff', color: '#000',
                            fontFamily: 'Arial, sans-serif', border: '1px solid #000', position: 'relative',
                            boxSizing: 'border-box'
                        }}>
                            <Box sx={{ border: '1px solid #000', mb: '10px' }}>
                                <Box sx={{ backgroundColor: '#fdfdfd', p: '2px 5px', borderBottom: '1px solid #000' }}>
                                    <Typography sx={{ fontSize: '11px', fontWeight: 'bold' }}>Product & Quantity Information (Continued)</Typography>
                                </Box>
                                {renderTable(productsPage2, true)}
                            </Box>

                            <Box sx={{ mt: '10px' }}>
                                <Box sx={{ border: '1px solid #000', p: '5px', mb: '5px' }}>
                                    <Typography sx={{ fontSize: '10px' }}><span style={{ fontWeight: 'bold' }}>Remarks :</span> {invoiceData.remarks}</Typography>
                                </Box>
                                <Box sx={{ border: '1px solid #000', p: '5px', mb: '10px' }}>
                                    <Typography sx={{ fontSize: '10px' }}><span style={{ fontWeight: 'bold' }}>Invoice Amount in Words :</span> {invoiceData.amountInWords}</Typography>
                                </Box>
                            </Box>

                            {/* Bank & Beneficiary Info */}
                            <Box sx={{ display: 'flex', gap: '20mm', mb: '20px' }}>
                                <Box sx={{ flex: 1, border: '1px solid #000', p: '5px', minHeight: '100px' }}>
                                    <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mb: '5px' }}>For Wire Transfer Beneficiary :</Typography>
                                    <Box sx={{ pl: '2px' }}>
                                        <Typography sx={{ fontSize: '11px' }}>{invoiceData?.beneficiary?.company || ''}</Typography>
                                        <Typography sx={{ fontSize: '11px' }}>{invoiceData?.beneficiary?.address || ''}</Typography>
                                        <Typography sx={{ fontSize: '11px' }}>{invoiceData?.beneficiary?.city || ''}</Typography>
                                        <Typography sx={{ fontSize: '11px' }}>{invoiceData?.beneficiary?.country || ''}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1, border: '1px solid #000', p: '5px', minHeight: '100px' }}>
                                    <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mb: '5px' }}>Beneficiary's Bank :</Typography>
                                    <Box sx={{ pl: '2px' }}>
                                        <Typography sx={{ fontSize: '11px' }}>{invoiceData?.bank?.name || ''}</Typography>
                                        <Typography sx={{ fontSize: '11px' }}>{invoiceData?.bank?.address || ''}</Typography>
                                        <Typography sx={{ fontSize: '11px' }}>{invoiceData?.bank?.country || ''}</Typography>
                                        <Box sx={{ mt: '5px' }}>
                                            <Box sx={{ display: 'flex' }}>
                                                <Typography sx={{ fontSize: '11px', minWidth: '85px' }}>Account No. :</Typography>
                                                <Typography sx={{ fontSize: '11px' }}>{invoiceData?.bank?.accountNo || ''}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex' }}>
                                                <Typography sx={{ fontSize: '11px', minWidth: '85px' }}>Routing No. :</Typography>
                                                <Typography sx={{ fontSize: '11px' }}>{invoiceData?.bank?.routingNo || ''}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            <Box sx={{ position: 'absolute', bottom: '10mm', left: '10mm', right: '10mm', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <Box sx={{ borderTop: '1px solid #000', width: '180px', pt: '5px' }}>
                                    <Typography sx={{ fontSize: '12px', fontWeight: 'bold' }}>President</Typography>
                                </Box>
                                <Typography sx={{ fontSize: '11px' }}>Page # : 2</Typography>
                            </Box>
                        </Paper>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

function ShippingRow({ label, value }) {
    return (
        <Box sx={{ display: 'flex', mb: '2px' }}>
            <Typography sx={{ fontSize: '11px', minWidth: '100px' }}>{label}</Typography>
            <Typography sx={{ fontSize: '11px', fontWeight: 'bold' }}>{value}</Typography>
        </Box>
    );
}

