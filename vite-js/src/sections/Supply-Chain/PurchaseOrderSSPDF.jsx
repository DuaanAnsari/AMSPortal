import React, { useRef, useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    useTheme,
    IconButton,
    AppBar,
    Toolbar,
    CircularProgress
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
    ZoomIn,
    ZoomOut,
    Download,
    Print,
    Close
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { HOST_API } from 'src/config-global';

// --- Main Component ---
const PurchaseOrderSSPDF = ({ poData: propPoData, onClose }) => {
    const theme = useTheme();
    const componentRef = useRef();
    const [zoomLevel, setZoomLevel] = useState(1.2);
    const { id } = useParams();
    const [fetchedData, setFetchedData] = useState(null);
    const [loading, setLoading] = useState(!!id && !propPoData);

    useEffect(() => {
        const fetchPurchaseOrderData = async () => {
            if (!id || propPoData) return;

            try {
                setLoading(true);
                const token = localStorage.getItem('accessToken');
                console.log('Fetching PO Size Specs Data for ID:', id);

                const response = await axios.get(`${HOST_API}/api/Report/GeneratePOReport?poid=${id}`, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                });

                if (response.data) {
                    const dataToSet = Array.isArray(response.data) ? response.data[0] : response.data;
                    console.log('Setting fetched data:', dataToSet);
                    setFetchedData(dataToSet);
                }
            } catch (error) {
                console.error('Failed to fetch purchase order data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPurchaseOrderData();
    }, [id, propPoData]);

    const poData = propPoData || fetchedData || {};

    const data = {
        poNumber: poData.pono || '',
        orderQty: poData.totalQTY || '',
        customer: poData.customerName || poData.cartonMarking || '',
        color: poData.color || '',
        styleNo: poData.style || '',
        vendor: poData.contactPersonVendor || '',
        date: poData.creationDate ? new Date(poData.creationDate).toLocaleDateString('en-US') : '',
        ref: poData.amsRefNo || '',
    };

    // Zoom functionality
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.1, 2));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
    };

    // Print functionality
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `PO_Size_Specs_${data.poNumber}`,
        onAfterPrint: () => console.log('Printed PDF successfully!'),
        pageStyle: `
            @page {
                size: A4;
                margin: 10mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `
    });

    // Download as PDF functionality
    const handleDownloadPDF = async () => {
        const element = componentRef.current;
        const originalTransform = element.style.transform;
        const originalTransition = element.style.transition;

        try {
            element.style.transform = 'scale(1)';
            element.style.transition = 'none';

            const pages = Array.from(element.children);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];

                if (!(page instanceof HTMLElement)) continue;

                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#FFFFFF'
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;

                const ratio = pdfWidth / imgWidth;
                const finalHeight = imgHeight * ratio;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);

                if (i < pages.length - 1) {
                    pdf.addPage();
                }
            }

            pdf.save(`PO_Size_Specs_${data.poNumber}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            element.style.transform = originalTransform;
            element.style.transition = originalTransition;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f5f5f5'
        }}>
            {/* PDF Viewer Header */}
            <AppBar
                position="static"
                sx={{
                    backgroundColor: '#3C3C3C',
                    borderBottom: '1px solid #e0e0e0',
                    boxShadow: 'none'
                }}
            >
                <Toolbar variant="dense" sx={{ minHeight: '48px !important' }}>
                    {/* Left Section - Document Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#fff'
                            }}
                        >
                            PO Size Specs Report - {data.poNumber}
                        </Typography>
                    </Box>

                    {/* Center Section - Zoom Controls */}
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

                    {/* Right Section - Action Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 0.5 }}>
                        <IconButton size="small" onClick={handleDownloadPDF} sx={{ color: '#fff' }}>
                            <Download fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handlePrint} sx={{ color: '#fff' }}>
                            <Print fontSize="small" />
                        </IconButton>
                        {onClose && (
                            <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
                                <Close fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* PDF Content Area */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 2,
                    backgroundColor: '#282828',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start'
                }}
            >
                <Box
                    ref={componentRef}
                    sx={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease-in-out',
                    }}
                >
                    {/* Page 1 - Size Specs Report */}
                    <Box
                        sx={{
                            p: 4,
                            fontFamily: 'Arial, sans-serif',
                            fontSize: '11px',
                            lineHeight: '1.4',
                            width: '210mm',
                            minHeight: '297mm',
                            backgroundColor: '#FFFFFF',
                            color: '#000000',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            '@media print': {
                                boxShadow: 'none',
                                p: 3,
                                width: '100%',
                                minHeight: '100%',
                                transform: 'none'
                            }
                        }}
                    >
                        {/* Header Section - Logo on left, Content centered */}
                        <Box sx={{ mb: 1 }}>
                            {/* Logo on left */}
                            <Box sx={{ width: '150px', mb: 1 }}>
                                <img
                                    src="/logo/AMSlogo.png"
                                    alt="AMS Logo"
                                    style={{ width: '140px', height: 'auto', display: 'block' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </Box>

                            {/* Centered Title and Address */}
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '24px', fontWeight: 'bold', color: '#000', mb: 0.5, fontFamily: 'Georgia, serif' }}>
                                    Apparel Merchandising Services
                                </Typography>
                                <Typography sx={{ fontSize: '10px', color: '#000', mb: 0.3 }}>
                                    A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800
                                </Typography>
                                <Typography sx={{ fontSize: '10px', color: '#1976d2', mb: 1 }}>
                                    Telephone # : (+92213) 485-3935 & 36 &nbsp;&nbsp;&nbsp;&nbsp; Karachi - Pakistan.
                                </Typography>
                                <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#E65100' }}>
                                    PO SIZE SPECS REPORT
                                </Typography>
                            </Box>
                        </Box>

                        {/* DATE Row - Right aligned */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 2 }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 'bold', color: '#000' }}>
                                DATE : <span style={{ borderBottom: '1px solid #000', paddingLeft: '50px', paddingRight: '10px' }}>{data.date}</span>
                            </Typography>
                        </Box>

                        {/* Info Fields Row 1: P.O. # | ORDER QTY | CUSTOMER */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2, gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 'bold', mr: 1, whiteSpace: 'nowrap' }}>P.O. #</Typography>
                                <Box sx={{ borderBottom: '1px solid #000', flex: 1, minWidth: '120px', pb: 0.3 }}>
                                    <Typography sx={{ fontSize: '11px' }}>{data.poNumber}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 'bold', mr: 1, whiteSpace: 'nowrap' }}>ORDER QTY</Typography>
                                <Box sx={{ borderBottom: '1px solid #000', flex: 1, minWidth: '120px', pb: 0.3 }}>
                                    <Typography sx={{ fontSize: '11px' }}>{data.orderQty}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 'bold', mr: 1, whiteSpace: 'nowrap' }}>CUSTOMER</Typography>
                                <Box sx={{ borderBottom: '1px solid #000', flex: 1, minWidth: '120px', pb: 0.3 }}>
                                    <Typography sx={{ fontSize: '11px' }}>{data.customer}</Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Info Fields Row 2: Color | STYLE NO | VENDOR */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 4, gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 'bold', mr: 1, whiteSpace: 'nowrap' }}>Color</Typography>
                                <Box sx={{ borderBottom: '1px solid #000', flex: 1, minWidth: '120px', pb: 0.3 }}>
                                    <Typography sx={{ fontSize: '11px' }}>{data.color}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 'bold', mr: 1, whiteSpace: 'nowrap' }}>STYLE NO</Typography>
                                <Box sx={{ borderBottom: '1px solid #000', flex: 1, minWidth: '120px', pb: 0.3 }}>
                                    <Typography sx={{ fontSize: '11px' }}>{data.styleNo}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 'bold', mr: 1, whiteSpace: 'nowrap' }}>VENDOR</Typography>
                                <Box sx={{ borderBottom: '1px solid #000', flex: 1, minWidth: '120px', pb: 0.3 }}>
                                    <Typography sx={{ fontSize: '11px' }}>{data.vendor}</Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Specs Sheet Title */}
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>
                                Specs Sheet
                            </Typography>
                        </Box>

                        {/* Specs Table - Using Box for proper grid lines */}
                        <Box sx={{ border: '2px solid #000', width: '100%' }}>
                            {/* First header row with - () */}
                            <Box sx={{ display: 'flex', borderBottom: '1px solid #000' }}>
                                <Box sx={{
                                    width: '34%',
                                    borderRight: '1px solid #000',
                                    p: 0.8,
                                    minHeight: '24px'
                                }} />
                                <Box sx={{
                                    width: '66%',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '11px',
                                    p: 0.8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    - ()
                                </Box>
                            </Box>

                            {/* Second header row with column names */}
                            <Box sx={{ display: 'flex', borderBottom: '1px solid #000' }}>
                                <Box sx={{
                                    width: '6%',
                                    borderRight: '1px solid #000',
                                    p: 0.5,
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    No.
                                </Box>
                                <Box sx={{
                                    width: '18%',
                                    borderRight: '1px solid #000',
                                    p: 0.5,
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    Measurement Points
                                </Box>
                                <Box sx={{
                                    width: '10%',
                                    borderRight: '1px solid #000',
                                    p: 0.5,
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    TOL+/-
                                </Box>
                                {/* Size columns */}
                                {[1, 2, 3, 4, 5, 6, 7].map((num, idx) => (
                                    <Box
                                        key={num}
                                        sx={{
                                            width: '9.43%',
                                            borderRight: idx < 6 ? '1px solid #000' : 'none',
                                            p: 0.5,
                                            fontSize: '9px',
                                            textAlign: 'center'
                                        }}
                                    />
                                ))}
                            </Box>

                            {/* Data rows */}
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((rowNum, rowIdx) => (
                                <Box
                                    key={rowNum}
                                    sx={{
                                        display: 'flex',
                                        borderBottom: rowIdx < 14 ? '1px solid #000' : 'none'
                                    }}
                                >
                                    <Box sx={{
                                        width: '6%',
                                        borderRight: '1px solid #000',
                                        p: 0.5,
                                        fontSize: '9px',
                                        textAlign: 'center',
                                        minHeight: '18px'
                                    }} />
                                    <Box sx={{
                                        width: '18%',
                                        borderRight: '1px solid #000',
                                        p: 0.5,
                                        fontSize: '9px'
                                    }} />
                                    <Box sx={{
                                        width: '10%',
                                        borderRight: '1px solid #000',
                                        p: 0.5,
                                        fontSize: '9px',
                                        textAlign: 'center'
                                    }} />
                                    {[1, 2, 3, 4, 5, 6, 7].map((num, idx) => (
                                        <Box
                                            key={num}
                                            sx={{
                                                width: '9.43%',
                                                borderRight: idx < 6 ? '1px solid #000' : 'none',
                                                p: 0.5,
                                                fontSize: '9px',
                                                textAlign: 'center'
                                            }}
                                        />
                                    ))}
                                </Box>
                            ))}
                        </Box>

                        {/* Footer */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto', pt: 4 }}>
                            <Typography sx={{ fontSize: '9px', color: 'black' }}>
                                ERP Solution Provider : www.itg.net.pk
                            </Typography>
                            <Typography sx={{ fontSize: '9px', color: 'black' }}>
                                Page # : 1
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default PurchaseOrderSSPDF;
