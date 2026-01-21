import React, { useRef, useState } from 'react';
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
} from '@mui/material';
import { ZoomIn, ZoomOut, Print } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';

// ----------------------------------------------------------------------

export default function PrintInvoicePage() {
    const { state } = useLocation();
    const { id } = useParams();

    const shipment = state?.shipment || {};

    // Hardcoded invoice data (baad me dynamic hoga)
    const invoiceData = {
        companyName: 'All Seasons textile',
        companyAddress: '1441 BROADWAY, SUITE # 4142 NEW YORK, NY 10018',
        country: 'USA',
        invoiceNo: 'Ash-ba 4722',
        invoiceDate: '02-03-2025',
        dayDate: 'Monday, January 19, 2026',
        time: '16:27:27',
        dateCode: '01/01/1900 00:00:00',

        // Bill To
        billTo: {
            company: 'BAILEY APPAREL',
            name: 'BAILEY APPAREL',
            address: '242 West 38th Street, 5th Floor',
            city: 'New York',
            country: 'USA',
        },

        // Ship To
        shipTo: {
            company: 'Bailey Apparel',
            name: 'Bailey Apparel',
            address: '242 West 38th Street, 5th Floor',
            city: 'New York',
            country: 'USA',
        },

        // Shipping Information
        shipping: {
            paymentTerms: 'Fob',
            shipmentMode: 'BY SEA',
            blAwbl: 'Cnckhi7004',
            containerNo: 'Ciocu8250178',
            etdKarachi: '01-30-2025',
            etaDestination: '03-08-2025',
            destination: 'New york',
            marksNos: '',
        },

        // Products
        products: [
            {
                poNo: 'AS41-428',
                styleNo: 'GBL4382-A',
                prodCode: '2',
                item: '100% POLYESTER girls MESH Baseball tee (cill trends)',
                sizeRange: '7/8 - 14/16',
                ldpUnit: 3.5500,
                shippedQtyInPcs: 1200.00,
                shpdOfCartons: 20.00,
                ldpValue: 4260,
                deductionAmount: '',
                adjustedAmount: '',
                invoiceAmount: 4260.00,
            },
            {
                poNo: 'AS41-429',
                styleNo: 'GBL4290',
                prodCode: '',
                item: '100% POLYESTER girls MESH Baseball tee (cill trends)',
                sizeRange: '7/8 - 14/16',
                shippedQtyInPcs: 1200.00,
                ldpUnit: 3.5500,
                shpdOfCartons: 20.00,
                ldpValue: 4260,
                deductionAmount: '',
                adjustedAmount: '',
                invoiceAmount: 4260.00,
            },
            {
                poNo: 'AS41-431',
                styleNo: 'GBL4312-2',
                prodCode: 'NA',
                item: '100% POLYESTER girls MESH Baseball tee (cill trends)',
                sizeRange: '7/8 -',
                ldpUnit: 3.5500,
                shippedQtyInPcs: 1200.00,
                shpdOfCartons: 20.00,
                ldpValue: 4260,
                deductionAmount: '',
                adjustedAmount: '',
                invoiceAmount: 4260.00,
            },
            {
                poNo: 'AS41-431',
                styleNo: 'GBL4314-4',
                prodCode: 'NA',
                item: '100% POLYESTER girls MESH Baseball tee (cill trends)',
                sizeRange: '7/8 -',
                ldpUnit: 3.5500,
                shippedQtyInPcs: 1200.00,
                shpdOfCartons: 20.00,
                ldpValue: 4260,
                deductionAmount: '',
                adjustedAmount: '',
                invoiceAmount: 4260.00,
            },
            {
                poNo: 'AS41-444',
                styleNo: 'GBL4441-1',
                prodCode: 'A',
                item: '100% POLYESTER girls MESH Baseball tee (cill trends)',
                sizeRange: '7/8 -',
                ldpUnit: 3.5500,
                shippedQtyInPcs: 1200.00,
                shpdOfCartons: 20.00,
                ldpValue: 4260,
                deductionAmount: '',
                adjustedAmount: '',
                invoiceAmount: 4260.00,
            },
            {
                poNo: 'A542 A',
                styleNo: '4314 4441',
                prodCode: 'NA',
                item: '100% POLYESTER girls MESH Baseball tee (cill trends)',
                sizeRange: '4-6X',
                ldpUnit: 3.2500,
                shippedQtyInPcs: 3600.00,
                shpdOfCartons: 200.00,
                ldpValue: 11700,
                deductionAmount: '',
                adjustedAmount: '',
                invoiceAmount: 11700.00,
            },
        ],

        // Totals
        shipmentTotal: {
            pcs: 9600,
            cartons: 300,
            label: 'Ctns',
            amount: 33000.00,
        },

        netReceivable: 33000,
        remarks: 'Shipped',
        amountInWords: 'THIRTY-THREE THOUSAND US$ ONLY',

        // Beneficiary
        beneficiary: {
            company: 'All Seasons textile',
            address: '1441 BROADWAY, SUITE # 4142 NEW YORK,',
            city: 'NY 10018',
            country: 'USA',
        },

        // Bank
        bank: {
            name: 'HAB BANK',
            address: '1300 EAST 45TH STREET NEW YORK NY 10016',
            country: 'USA',
            accountNo: '101728713',
            routingNo: '026007542',
        },
    };

    const contentRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Invoice_${invoiceData.invoiceNo}`,
    });

    // Common styles
    const labelStyle = { fontSize: 8, color: '#1565c0', fontWeight: 600 };
    const valueStyle = { fontSize: 8, color: '#000' };
    const cellStyle = { fontSize: 7, py: 0.3, px: 0.5, border: '1px solid #ccc' };
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
                            Print Invoice - {invoiceData.invoiceNo}
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
                                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1565c0' }}>
                                    {invoiceData.companyName}
                                </Typography>
                                <Typography sx={{ fontSize: 8, color: '#555' }}>
                                    {invoiceData.companyAddress}
                                </Typography>
                                <Typography sx={{ fontSize: 8, color: '#555' }}>
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
                                <Typography sx={{ fontSize: 8 }}>{invoiceData.dayDate}</Typography>
                                <Typography sx={{ fontSize: 8 }}>{invoiceData.time}</Typography>
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
                                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#1565c0' }}>{invoiceData.billTo.company}</Typography>
                                    <Typography sx={{ fontSize: 8 }}>{invoiceData.billTo.name}</Typography>
                                    <Typography sx={{ fontSize: 8 }}>{invoiceData.billTo.address}</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, borderTop: '1px solid #ccc', pt: 0.5 }}>
                                        <Typography sx={{ fontSize: 8 }}>{invoiceData.billTo.city}</Typography>
                                        <Typography sx={{ fontSize: 8 }}>{invoiceData.billTo.country}</Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Ship To */}
                            <Box sx={{ border: '1px solid #000' }}>
                                <Box sx={{ backgroundColor: '#f5f5f5', p: 0.5, borderBottom: '1px solid #000' }}>
                                    <Typography sx={{ fontSize: 9, fontWeight: 600 }}>Ship To :</Typography>
                                </Box>
                                <Box sx={{ p: 1 }}>
                                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#1565c0' }}>{invoiceData.shipTo.company}</Typography>
                                    <Typography sx={{ fontSize: 8 }}>{invoiceData.shipTo.name}</Typography>
                                    <Typography sx={{ fontSize: 8 }}>{invoiceData.shipTo.address}</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, borderTop: '1px solid #ccc', pt: 0.5 }}>
                                        <Typography sx={{ fontSize: 8 }}>{invoiceData.shipTo.city}</Typography>
                                        <Typography sx={{ fontSize: 8 }}>{invoiceData.shipTo.country}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Shipping Information - only header underline, no outer border */}
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#d84315', borderBottom: '1px solid #000', pb: 0.5, mb: 1 }}>Shipping Information</Typography>
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
                                                {product.prodCode && <Box sx={{ fontSize: 6, color: '#666' }}>{product.prodCode}</Box>}
                                            </TableCell>
                                            <TableCell sx={{ ...cellStyle, color: '#1565c0' }}>{product.item}</TableCell>
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
                                <Typography sx={{ fontSize: 10, fontWeight: 700 }}>President</Typography>
                                <Typography sx={{ fontSize: 10 }}>Page # : 1</Typography>
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
                                            <Typography sx={{ fontWeight: 700, fontSize: 8 }}>Shipment Total :</Typography>
                                        </TableCell>
                                        <TableCell sx={cellStyle} align="right">{invoiceData.shipmentTotal.pcs?.toLocaleString()}</TableCell>
                                        <TableCell sx={cellStyle} align="right">Pcs</TableCell>
                                        <TableCell sx={cellStyle} align="right">{invoiceData.shipmentTotal.cartons}</TableCell>
                                        <TableCell sx={cellStyle} align="right">{invoiceData.shipmentTotal.label}</TableCell>
                                        <TableCell sx={cellStyle} colSpan={2}></TableCell>
                                        <TableCell sx={cellStyle} align="right">
                                            <Typography sx={{ fontWeight: 700, fontSize: 8 }}>{invoiceData.shipmentTotal.amount?.toLocaleString()} US$</Typography>
                                        </TableCell>
                                    </TableRow>
                                    {/* Empty rows for US$ */}
                                    <TableRow>
                                        <TableCell sx={cellStyle} colSpan={10}></TableCell>
                                        <TableCell sx={cellStyle} align="right">0 US$</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={cellStyle} colSpan={10}></TableCell>
                                        <TableCell sx={cellStyle} align="right">0 US$</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={cellStyle} colSpan={10}></TableCell>
                                        <TableCell sx={cellStyle} align="right">0 US$</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>

                        {/* Net Receivable */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                            <Box sx={{ border: '2px solid #2e7d32', display: 'flex', alignItems: 'center', gap: 3, px: 2, py: 1 }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#000' }}>Net Receivable :</Typography>
                                <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{invoiceData.netReceivable?.toLocaleString()} US$</Typography>
                            </Box>
                        </Box>

                        {/* Remarks */}
                        <Box sx={{ border: '1px solid #000', mb: 2, p: 1 }}>
                            <Typography sx={{ fontSize: 9 }}>
                                <b style={{ color: '#000' }}>Remarks :</b> <span style={{ color: '#1565c0' }}>{invoiceData.remarks}</span>
                            </Typography>
                        </Box>

                        {/* Invoice Amount in Words */}
                        <Box sx={{ border: '1px solid #000', mb: 3, p: 1 }}>
                            <Typography sx={{ fontSize: 9 }}>
                                <b style={{ color: '#000' }}>Invoice Amount in Words :</b> <span style={{ color: '#1565c0' }}>{invoiceData.amountInWords}</span>
                            </Typography>
                        </Box>

                        {/* Beneficiary and Bank */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 4 }}>
                            {/* For Wire Transfer Beneficiary */}
                            <Box sx={{ border: '1px solid #000' }}>
                                <Box sx={{ backgroundColor: '#fffde7', p: 0.5, borderBottom: '1px solid #000' }}>
                                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#000' }}>For Wire Transfer Beneficiary :</Typography>
                                </Box>
                                <Box sx={{ p: 1 }}>
                                    <Typography sx={{ fontSize: 8, fontWeight: 600 }}>{invoiceData.beneficiary.company}</Typography>
                                    <Typography sx={{ fontSize: 8 }}>{invoiceData.beneficiary.address}</Typography>
                                    <Typography sx={{ fontSize: 8 }}>{invoiceData.beneficiary.city}</Typography>
                                    <Typography sx={{ fontSize: 8 }}>{invoiceData.beneficiary.country}</Typography>
                                </Box>
                            </Box>

                            {/* Beneficiary's Bank */}
                            <Box sx={{ border: '1px solid #000' }}>
                                <Box sx={{ backgroundColor: '#fffde7', p: 0.5, borderBottom: '1px solid #000' }}>
                                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#000' }}>Beneficiary's Bank :</Typography>
                                </Box>
                                <Box sx={{ p: 1 }}>
                                    <Typography sx={{ fontSize: 8, fontWeight: 600 }}>{invoiceData.bank.name}</Typography>
                                    <Typography sx={{ fontSize: 8 }}>{invoiceData.bank.address}</Typography>
                                    <Typography sx={{ fontSize: 8 }}>{invoiceData.bank.country}</Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography sx={{ fontSize: 8 }}><b>Account No. :</b> {invoiceData.bank.accountNo}</Typography>
                                        <Typography sx={{ fontSize: 8 }}><b>Routing No. :</b> {invoiceData.bank.routingNo}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Footer Page 2 */}
                        <Box sx={{ position: 'absolute', bottom: 20, left: 0, right: 0, px: 3 }}>
                            <Box sx={{ borderTop: '2px solid #000', pt: 1, display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 700 }}>President</Typography>
                                <Typography sx={{ fontSize: 10 }}>Page # : 2</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
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
