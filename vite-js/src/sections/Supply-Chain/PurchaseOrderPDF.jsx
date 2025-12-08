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
  Divider,
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

// --- Helper Components ---
const POCell = ({ children, header = false, sx = {} }) => {
  const theme = useTheme();
  return (
    <TableCell
      sx={{
        verticalAlign: 'top',
        border: 'none',
        fontSize: '9px',
        fontWeight: header ? 'bold' : 'normal',
        padding: '3px 5px',
        lineHeight: '1.2',
        borderColor: '#000',
        whiteSpace: 'normal',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        ...sx
      }}
    >
      {children}
    </TableCell>
  );
};

const BorderedPOCell = ({ children, header = false, sx = {} }) => (
  <POCell
    header={header}
    sx={{
      border: '1px solid black',
      color: '#000000',
      backgroundColor: '#FFFFFF',
      ...sx
    }}
  >
    {children}
  </POCell>
);

// --- Main Component ---
const PurchaseOrderPageExactMatch = ({ poData: propPoData, onClose }) => {
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
        console.log('Fetching PO Data for ID:', id);
        console.log('API URL:', `${HOST_API}/api/Report/GeneratePOReport?poid=${id}`);

        const response = await axios.get(`${HOST_API}/api/Report/GeneratePOReport?poid=${id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });

        console.log('API Response:', response);

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
    ref: poData.amsRefNo || '',
    receivedDate: poData.creationDate ? new Date(poData.creationDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Monday, May 19, 2025',
    attn: poData.contactPersonVendor || 'COMFORT APPAREL',
    addressLeft: poData.venderAddress || 'PLOT # E-99, SECTOR 31-D KORANGI INDUSTRIAL\nKARACHI\nPAKISTAN',
    trackingCode: poData.venderCode || '11265',
    brand: poData.brand || 'Gentle Threads',
    division: poData.ecpDivistion || 'Men',
    rn: poData.rnNo || '130691',
    shipTo: poData.consigneeAddress1 || 'ALL SEASONS TEXTILE\n1441 BROADWAY, SUITE # 6162\nNEW YORK, NY 10018\nUSA',
    itemDescription: poData.itemDescriptionShippingInvoice || '100% Cotton Men Jersey Garment Dye LS Tee',
    exFactory: poData.shipmentDate ? new Date(poData.shipmentDate).toLocaleDateString('en-US') : '07-15-2025',
    finalInspection: poData.finalInspDate ? new Date(poData.finalInspDate).toLocaleDateString('en-US') : '07/10/2025',
    leadTime: poData.timeSpame ? `${poData.timeSpame} Days` : '57 Days',
    fabric: {
      description: 'Body',
      fabric: poData.fabric || 'Jersey',
      content: poData.otherFabric || '100% Cotton',
      weight: poData.gms ? `${poData.gms} GSM` : '190 GSM'
    },
    packingInstructions: poData.packingList || '12pcs poly bag and 48pcs Master Carton',
    cartonMarking: poData.cartonMarking || 'LR',
    pcsPerCarton: poData.pcPerCarton || '48',
    ration: poData.ration || '',
    orderRows: [{
      color: poData.color || 'Red clay',
      sizeRow: [
        parseInt(poData.s1) || 672,
        parseInt(poData.s2) || 480,
        parseInt(poData.s3) || 672,
        parseInt(poData.s4) || 432
      ],
      total: poData.totalQTY ? `${poData.totalQTY} PCS` : '2,256.00 PCS',
      unit: poData.rate || '2.93',
      amount: (parseFloat(poData.totalQTY || 0) * parseFloat(poData.rate || 0)).toFixed(2) || '6,610.08',
      productCode: poData.productCode || 'NA'
    }],
    totalQty: poData.totalQTY || '2,256',
    totalAmount: (parseFloat(poData.totalQTY || 0) * parseFloat(poData.rate || 0)).toFixed(2) || '6,610.08',
    importantNotes: poData.importantNote ? [poData.importantNote] : [
      'Fabric should be heat set and lock properly to avoid shrinkage problem.',
      'Before cutting fabric should be kept on table for atleast 24 hours.',
      'All garments should be 100% checked for sizes before carton packing'
    ],
    productImage: poData.poImage || '',
    shipMode: poData.shipmentModeText || 'Sea',
    destination: poData.destination || 'NEW YORK',
    shipmentTerms: poData.paymentTypeName || 'FOB',
    paymentTerms: poData.paymentModeName || 'DP',
    amsTeam: poData.userName || 'MUHAMMAD SHAHZAIB',
    cpoNumber: poData.pono || '37522-LS-RED',
    styleNumber: poData.style || 'LR2096',
    productCategory: poData.productCategoriesName || 'Knits',
    specialInstructions: poData.pO_Special_Instructions || 'N/A',
    source: poData.styleSource || 'Local',
    embellishment: poData.embAndEmbellishment || 'N/A',
    trimsAccessories: poData.trimsAccessories || 'Local',
    specialOperation: poData.pO_Special_Operation || 'GARMENT DYE',
    samplingReq: poData.samplingReq || 'N/A',
    beneficiaryBank: poData.bankNameBank || 'HABIB METROPOLITAN BANK LTD',
    accountNo: poData.accountNoBank || '601-55-112233',
    routingNo: poData.ibanBank || '125010999',
    washingInstructions: poData.washingCareLabelInstructions || 'Machine Wash Cold With Like Colors, Gentle Cycle. Use Only Non Chlorine Bleach when needed, Line Dry, Cool Iron.',
    poTotalDetails: poData.poTotalDetails || '',
  };

  // Second page data
  const secondPageData = {
    companyName: "All Seaon Textile Inc",
    preparedBy: "Mr. Munkhoq Ashraf",
    termsAndConditions: [
      "PO should be read carefully and confirm in 3 days from the date of issuance.",
      "Goods should be in good quality as per the buyer requirement, otherwise factory will be responsible for charge back.",
      "We should have Packing 24 hours before to our agreed delivery date.",
      "Packing should be as per Purchaser order and mix carton are not allowed.",
      "Factory will have to get approval of carton marking from merchandiser.",
      "SGS should be done on Monday (If Required)",
      "SGS will only applicable after our AMS passed.",
      "Tuesday goods should be on the port.",
      "If there is a space vacant in the container due to short quantity then factory will be responsible for dead space.",
      "Delay penalties will be charged as under:",
      "01 Week Delay - 5% of Invoice value",
      "02 Weeks Delay - 8% of Invoice Value",
      "03 Weeks Delay - 12 % of Invoice Value",
      "Onward - 16 % of Invoice Value",
      "If any there will be any shortfall then 5% will be adjust from invoice value.",
      "After all delays if customer requires AIR shipment then factory have to bear all the expenses."
    ]
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
    content: () => componentRef.current,
    documentTitle: `Purchase_Order_${data.ref}`,
    onAfterPrint: () => console.log('Printed PDF successfully!'),
  });

  // Download as PDF functionality
  const handleDownloadPDF = async () => {
    const element = componentRef.current;
    // Store original transform to restore later
    const originalTransform = element.style.transform;
    const originalTransition = element.style.transition;

    try {
      // Temporarily reset transform for clean capture
      element.style.transform = 'scale(1)';
      element.style.transition = 'none';

      // Get all page elements (children of the container)
      const pages = Array.from(element.children);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Skip if not an HTML element
        if (!(page instanceof HTMLElement)) continue;

        const canvas = await html2canvas(page, {
          scale: 2, // High resolution
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Calculate ratio to fit A4 page width (maintaining aspect ratio)
        const ratio = pdfWidth / imgWidth;
        const finalHeight = imgHeight * ratio;

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);

        // Add new page if not the last page
        if (i < pages.length - 1) {
          pdf.addPage();
        }
      }

      pdf.save(`Purchase_Order_${data.ref}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // Restore original styles
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
          color: '#3C3C3C',
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
              Departmental Request - {data.ref}
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                color: '#fff',
                ml: 2
              }}
            >
              1/3
            </Typography>
          </Box>

          {/* Center Section - Zoom Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={handleZoomOut}
              sx={{ color: '#fff' }}
            >
              <ZoomOut fontSize="small" />
            </IconButton>

            <Typography
              sx={{
                fontSize: '12px',
                color: '#fff',
                mx: 1,
                minWidth: '40px',
                textAlign: 'center'
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </Typography>

            <IconButton
              size="small"
              onClick={handleZoomIn}
              sx={{ color: '#fff' }}
            >
              <ZoomIn fontSize="small" />
            </IconButton>
          </Box>

          {/* Right Section - Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleDownloadPDF}
              sx={{ color: '#fff' }}
            >
              <Download fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={handlePrint}
              sx={{ color: '#fff' }}
            >
              <Print fontSize="small" />
            </IconButton>

            {onClose && (
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: '#fff' }}
              >
                <Close fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* PDF Content Area with Scroll and Zoom */}
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
          {/* First Page - Your Original Content */}
          <Box
            sx={{
              p: 1.5,
              fontFamily: 'Arial, sans-serif',
              fontSize: '10px',
              lineHeight: '1.3',
              width: '210mm',
              minHeight: '297mm',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              marginBottom: '10mm',
              '@media print': {
                boxShadow: 'none',
                p: 0,
                m: 0,
                width: '100%',
                minHeight: '100%',
                transform: 'none',
                marginBottom: 0
              }
            }}
          >
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ width: '50%' }}>
                <Box sx={{ mb: 0.2, display: 'block' }}>
                  <Box sx={{ width: '150px', height: 'auto', mb: 0.2 }}>
                    <img
                      src="/logo/AMSlogo.png"
                      alt="AMS Logo"
                      style={{ width: '150px', height: 'auto', display: 'block' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: '9px', mt: 0, fontWeight: 'bold', color: '#581845' }}>
                    APPAREL MERCHANDISING SERVICES
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '9px', mt: 0.5, color: '#000000' }}>
                  A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800
                </Typography>
                <Typography sx={{ fontSize: '9px', color: '#000000' }}>
                  Karachi - Pakistan. &nbsp; &nbsp; &nbsp; &nbsp; Telephone # : **(+92213) 485-3935 & 36**
                </Typography>
              </Box>

              <Box sx={{ width: '50%', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                <Box sx={{ mr: 2, textAlign: 'right', pt: 0.5, pr: 1 }}>
                  <Typography variant="h5" sx={{
                    fontSize: '18px',
                    fontWeight: 'normal',
                    color: '#000000',
                    mb: 1.5,
                    fontFamily: 'cursive',
                    textAlign: 'right'
                  }}>
                    Purchase Order
                  </Typography>
                  <Typography sx={{ fontSize: '9px', lineHeight: 1.5, color: '#000000' }}>
                    AMS - Ref # : {data.ref}
                  </Typography>
                  <Typography sx={{ fontSize: '9px', lineHeight: 1.5, color: '#000000' }}>
                    P.O Received Date : {data.receivedDate}
                  </Typography>
                </Box>
                <Box sx={{ width: '60px', height: '80px', overflow: 'hidden', border: '1px solid #ddd' }}>
                  <img
                    src={data.productImage || '/placeholder-product.png'}
                    alt="Product"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      backgroundColor: '#f5f5f5'
                    }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA2MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFpNMzAgMzBDMzEuNjU2OSAzMCAzMyAyOC42NTY5IDMzIDI3QzMzIDI1LjM0MzEgMzEuNjU2OSAyNCAzMCAyNEMyOC4zNDMxIDI0IDI3IDI1LjM0MzEgMjcgMjdDMjcgMjguNjU2OSAyOC4zNDMxIDMwIDMwIDMwWk0zNiA1MEgyNFY1MkgzNlY1MFpNMzYgNTZIMjRWNThIMzZWNTZaIiBmaWxsPSIjQ0RDRENEIi8+Cjwvc3ZnPgo=';
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Addresses Section */}
            <TableContainer component={Paper} sx={{ mb: 1, border: '1px solid black', backgroundColor: '#FFFFFF' }}>
              <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ width: '33.3%', borderRight: '1px solid black', padding: '8px', backgroundColor: '#FFFFFF' }}>
                      <Typography sx={{ fontSize: '9px', fontWeight: 'bold', color: '#000000' }}>Attn : {data.attn}</Typography>
                      <Box sx={{ mt: 0.2 }}>
                        <Typography sx={{ fontSize: '9px', fontWeight: 'normal', color: '#000000', whiteSpace: 'pre-line' }}>
                          {data.addressLeft}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '9px', fontWeight: 'bold', mt: 0.5, pt: 0.5, borderTop: '1px solid black', color: '#000000' }}>
                        Tracking Code: <span style={{ fontWeight: 'normal' }}>{data.trackingCode}</span>
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ width: '33.3%', borderRight: '1px solid black', padding: '8px', backgroundColor: '#FFFFFF' }}>
                      <Typography sx={{ fontSize: '9px', fontWeight: 'bold', color: '#000000' }}>Customer,Brand / Label Name & Division: {data.cartonMarking}</Typography>
                      <Box sx={{ mt: 0.5, pt: 0.5, display: 'flex', borderTop: '1px solid black', flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: '9px', fontWeight: 'bold', mr: 0.5, color: '#000000' }}>Brand:</Typography>
                        <Typography sx={{ fontSize: '9px', fontWeight: 'normal', mr: 2, color: '#000000' }}>{data.brand}</Typography>
                        <Typography sx={{ fontSize: '9px', fontWeight: 'bold', mr: 0.5, color: '#000000' }}>R.N #:</Typography>
                        <Typography sx={{ fontSize: '9px', fontWeight: 'normal', color: '#000000' }}>{data.rn}</Typography>
                      </Box>
                      <Box sx={{ mt: 0.5 }}>
                        <Typography sx={{ fontSize: '9px', fontWeight: 'bold', display: 'inline', mr: 0.5, color: '#000000' }}>Division:</Typography>
                        <Typography sx={{ fontSize: '9px', fontWeight: 'normal', display: 'inline', color: '#000000' }}>{data.division}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ width: '33.3%', padding: '8px', backgroundColor: '#FFFFFF' }}>
                      <Typography sx={{ fontSize: '9px', fontWeight: 'bold', color: '#000000' }}>Ship To:</Typography>
                      <Typography sx={{ fontSize: '9px', fontWeight: 'normal', color: '#000000', whiteSpace: 'pre-line' }}>
                        {data.shipTo}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Item Description & Ship Details */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ width: '40%' }}>
                <Typography sx={{ fontSize: '9px', fontWeight: 'bold', color: '#000000' }}>Item Description :</Typography>
                <Typography sx={{ fontSize: '9px', fontWeight: 'bold', mt: 0.5, color: '#000000' }}>
                  {data.itemDescription}
                </Typography>
                <Box sx={{ display: 'flex', mt: 1 }}>
                  <Box sx={{ width: '45%' }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 'bold', color: '#000000' }}>Ex-Factory (Ship Date)</Typography>
                    <Typography sx={{ fontSize: '9px', fontWeight: 'bold', color: '#000000' }}>Final Inspection Date</Typography>
                  </Box>
                  <Box sx={{ width: '55%', textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '9px', color: '#000000' }}>{data.exFactory}</Typography>
                    <Typography sx={{ fontSize: '9px', color: '#000000' }}>{data.finalInspection}</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ width: '60%' }}>
                <TableContainer component={Paper} sx={{ backgroundColor: '#FFFFFF' }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <POCell header sx={{ width: '15%' }}>Lead Time:</POCell>
                        <POCell header sx={{ width: '15%' }}>{data.leadTime}</POCell>
                        <POCell header sx={{ width: '15%' }}>Ship Mode:</POCell>
                        <POCell header sx={{ width: '25%' }}>Destination:</POCell>
                        <POCell header sx={{ width: '15%' }}>Shipment Terms:</POCell>
                        <POCell header sx={{ width: '15%' }}>Payment Terms:</POCell>
                      </TableRow>
                      <TableRow>
                        <POCell></POCell>
                        <POCell></POCell>
                        <POCell>{data.shipMode}</POCell>
                        <POCell>{data.destination}</POCell>
                        <POCell>{data.shipmentTerms}</POCell>
                        <POCell>{data.paymentTerms}</POCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>

            {/* Fabrication Table */}
            <Box sx={{ display: 'flex', mb: 1, borderTop: '1px solid black', backgroundColor: '#FFFFFF', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', padding: '10px', gap: '90px' }}>
                <POCell header sx={{ padding: '0' }}>Fabrication Body & Trims</POCell>
                <POCell header sx={{ padding: '0' }}>AMS - Team: {data.amsTeam}</POCell>
                <POCell header sx={{ padding: '0' }}>C.P.O #: {data.cpoNumber}</POCell>
                <POCell header sx={{ padding: '0' }}>Style #: {data.styleNumber}</POCell>
              </Box>

              <TableContainer component={Paper} sx={{ flex: '1', backgroundColor: '#FFFFFF' }}>
                <Table size="small" sx={{ borderCollapse: 'collapse', width: '100%' }}>
                  <TableHead>
                    <TableRow sx={{ borderBottom: '1px solid black' }}>
                      <POCell header sx={{ width: '12%', textAlign: 'left', paddingLeft: '8px' }}>Description</POCell>
                      <POCell header sx={{ width: '12%', textAlign: 'left', paddingLeft: '8px' }}>Fabric</POCell>
                      <POCell header sx={{ width: '15%', textAlign: 'left', paddingLeft: '8px' }}>Content</POCell>
                      <POCell header sx={{ width: '10%', textAlign: 'left', paddingLeft: '8px' }}>Weight</POCell>
                      <POCell header sx={{ width: '36%', borderLeft: '1px solid black', paddingLeft: '8px' }}>Packing Instructions</POCell>
                      <POCell header sx={{ width: '15%', borderLeft: '1px solid black', paddingLeft: '8px' }}>Ratio</POCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow sx={{ borderLeft: '1px solid black', borderRight: '1px solid black' }}>
                      <POCell sx={{ borderRight: '1px solid black', height: '60px', borderBottom: '1px solid black', width: '12%', paddingLeft: '8px' }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#000000' }}>{data.fabric.description}</Typography>
                      </POCell>
                      <POCell sx={{ borderRight: '1px solid black', height: '60px', borderBottom: '1px solid black', width: '12%', paddingLeft: '8px' }}>
                        <Typography sx={{ fontSize: '11px', color: '#000000' }}>{data.fabric.fabric}</Typography>
                      </POCell>
                      <POCell sx={{ borderRight: '1px solid black', height: '60px', borderBottom: '1px solid black', width: '15%', paddingLeft: '8px' }}>
                        <Typography sx={{ fontSize: '11px', color: '#000000' }}>{data.fabric.content}</Typography>
                      </POCell>
                      <POCell sx={{ borderRight: '1px solid black', height: '60px', borderBottom: '1px solid black', width: '10%', paddingLeft: '8px' }}>
                        <Typography sx={{ fontSize: '11px', color: '#000000' }}>{data.fabric.weight}</Typography>
                      </POCell>
                      <POCell sx={{ height: '60px', borderBottom: '1px solid black', width: '36%', paddingLeft: '8px' }}>
                        <Typography sx={{ fontSize: '11px', color: '#000000' }}>{data.packingInstructions}</Typography>
                      </POCell>
                      <POCell sx={{ height: '60px', borderBottom: '1px solid black', width: '15%', paddingLeft: '8px', borderLeft: '1px solid black' }}>
                        <Typography sx={{ fontSize: '11px', color: '#000000' }}>{data.ration}</Typography>
                        {/* Ratio data */}
                      </POCell>
                    </TableRow>

                    <TableRow sx={{ borderLeft: '1px solid black', borderRight: '1px solid black', borderBottom: '1px solid black' }}>
                      <POCell sx={{ verticalAlign: 'top', borderRight: '1px solid black', width: '12%', paddingLeft: '8px' }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#000000' }}>Other</Typography>
                      </POCell>
                      <POCell colSpan={3} sx={{ borderRight: '1px solid black' }}></POCell>
                      <POCell colSpan={2} sx={{ height: '35px', borderLeft: '1px solid black' }}></POCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Product Details */}
            <Box sx={{ display: 'flex', mb: 1, backgroundColor: '#FFFFFF' }}>
              <Box sx={{ flex: 55, mr: 0.5 }}>
                <TableContainer component={Paper} sx={{ backgroundColor: '#FFFFFF' }}>
                  <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                    <TableBody>
                      <TableRow>
                        <BorderedPOCell header sx={{ width: '30%' }}>Product Category:</BorderedPOCell>
                        <BorderedPOCell sx={{ width: '20%' }}>{data.productCategory}</BorderedPOCell>
                        <BorderedPOCell header sx={{ width: '30%' }}>Pcs Per Carton:</BorderedPOCell>
                        <BorderedPOCell sx={{ width: '20%' }}>{data.pcsPerCarton}</BorderedPOCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box sx={{ flex: 45, ml: 0.5 }}>
                <TableContainer component={Paper} sx={{ backgroundColor: '#FFFFFF' }}>
                  <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                    <TableHead>
                      <TableRow>
                        <BorderedPOCell header>Carton Marking:</BorderedPOCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <BorderedPOCell sx={{ height: '10px' }}>{data.cartonMarking}</BorderedPOCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>

            {/* Main Quantity Table */}
            <TableContainer component={Paper} sx={{ mb: 0, border: '1px solid black', backgroundColor: '#FFFFFF' }}>
              <Table sx={{ minWidth: 450, fontSize: '0.70rem', borderCollapse: 'collapse', '& td, & th': { border: '1px solid #000' } }} size="small">
                <TableHead>
                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>Color (s)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>Product Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>Reference</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }} colSpan={4}>Size Range</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>Color Total Qty in PCS</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>FOB Unit Price ($)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>FOB Value Sub Amount ($)</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>{data.orderRows?.[0]?.color ?? "Red clay"}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                    <TableCell colSpan={4} sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                  </TableRow>

                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>S-XL</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>{data.orderRows?.[0]?.productCode ?? "NA"}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>Size</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>S</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>M</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>L</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>XL</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>PCS</TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                  </TableRow>
                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>S-XL</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>{data.orderRows?.[0]?.productCode ?? "NA"}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>Size</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>S</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>M</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>L</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>XL</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>PCS</TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                  </TableRow>


                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>{data.orderRows?.[0]?.productCode ?? "NA"}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>Quantity</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>{data.orderRows?.[0]?.sizeRow?.[0] ?? 672}</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>{data.orderRows?.[0]?.sizeRow?.[1] ?? 480}</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>{data.orderRows?.[0]?.sizeRow?.[2] ?? 672}</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>{data.orderRows?.[0]?.sizeRow?.[3] ?? 432}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>{data.orderRows?.[0]?.total ?? '2,256.00 PCS'}</TableCell>
                    <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>${data.orderRows?.[0]?.unit ?? "2.93"}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>${data.orderRows?.[0]?.amount ?? "6,610.08"}</TableCell>
                  </TableRow>

                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                    <TableCell colSpan={7} sx={{ textAlign: "right", fontWeight: "bold", fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>Total:-</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: '0.70rem', padding: '2px 8px', color: '#000000', backgroundColor: '#FFFFFF' }}>{data.totalQty ?? "2256"}</TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* PO Total Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1px 0', fontSize: '0.70rem', color: '#000000', backgroundColor: '#FFFFFF' }}>
              <Box sx={{ fontWeight: 'bold', display: 'flex', gap: '3px' }}>
                P.O Total: <span style={{ paddingRight: '10px' }}>{data.totalQty ?? '2,256'}</span> PCS {data.poTotalDetails ?? '188.00 Dz 47 Ctn'}
              </Box>
              <Box sx={{ display: 'flex', fontWeight: 'bold' }}>
                <Box sx={{ textAlign: 'left', pr: 0.5, pl: 0.5, backgroundColor: '#f0f0f0', color: '#000000' }}>
                  P.O Net FOB Value $
                </Box>
                <Box sx={{ textAlign: 'left', pr: 0.5, pl: 0.5, backgroundColor: '#f0f0f0', minWidth: '60px', color: '#000000' }}>
                  {data.totalAmount ?? '6,610.08'}
                </Box>
              </Box>
            </Box>

            {/* Instructions Section */}
            <TableContainer component={Paper} sx={{ border: '1px solid black', borderRadius: 0, boxShadow: 'none', backgroundColor: '#FFFFFF' }}>
              <Table size="small" sx={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '45%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>

                <TableBody>
                  <TableRow>
                    <TableCell sx={{ border: '1px solid black', verticalAlign: 'top', fontWeight: 'bold', fontSize: '11px', p: 1, color: '#000000', backgroundColor: '#FFFFFF' }}>
                      Special Instructions :
                    </TableCell>
                    <TableCell sx={{ border: '1px solid black', verticalAlign: 'top', p: 1, backgroundColor: '#FFFFFF' }}>
                      {data.specialInstructions}
                    </TableCell>
                    <TableCell colSpan={2} sx={{ border: '1px solid black', verticalAlign: 'top', p: 1, backgroundColor: '#FFFFFF' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ width: '100%', textAlign: 'right', mb: 1 }}>
                          <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#000000' }}>Source</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#000000' }}>Fabric</Typography>
                            <Typography sx={{ fontSize: '11px', color: '#000000' }}>{data.source}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '11px', color: '#000000' }}>Trims & Accessories</Typography>
                            <Typography sx={{ fontSize: '11px', color: '#000000' }}>{data.trimsAccessories}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ border: '1px solid black', verticalAlign: 'top', fontWeight: 'bold', fontSize: '11px', p: 1, color: '#000000', backgroundColor: '#FFFFFF' }}>
                      Important Note:
                    </TableCell>
                    <TableCell sx={{ border: '1px solid black', verticalAlign: 'top', p: 1, backgroundColor: '#FFFFFF' }}>
                      <Typography sx={{ fontSize: '10px', lineHeight: 1.5, color: '#000000' }}>
                        {data.importantNotes.map((note, index) => (
                          <span key={index}>
                            {index + 1}- {note}<br />
                          </span>
                        ))}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ border: '1px solid black', borderRight: 'none', verticalAlign: 'top', fontWeight: 'bold', fontSize: '11px', p: 1, color: '#000000', backgroundColor: '#FFFFFF' }}>
                      Special Operation
                    </TableCell>
                    <TableCell sx={{ border: '1px solid black', borderLeft: 'none', verticalAlign: 'top', textAlign: 'right', p: 1, backgroundColor: '#FFFFFF' }}>
                      <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: '#000000' }}>Emb & Embellishment :</Typography>
                      <Typography sx={{ fontSize: '10px', mt: 0.5, color: '#000000' }}>{data.embellishment}</Typography>
                      <Typography sx={{ fontSize: '10px', fontWeight: 'bold', mt: 1, color: '#000000' }}>Special Operation:</Typography>
                      <Typography sx={{ fontSize: '10px', color: '#000000' }}>{data.specialOperation}</Typography>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: '11px', p: 1, color: '#000000', backgroundColor: '#FFFFFF' }}>More Info :</TableCell>
                    <TableCell colSpan={3} sx={{ border: '1px solid black', p: 1, backgroundColor: '#FFFFFF' }}>
                      <Typography sx={{ fontSize: '11px', color: '#000000' }}>N/A</Typography>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: '11px', p: 1, color: '#000000', backgroundColor: '#FFFFFF' }}>Sampling Req :</TableCell>
                    <TableCell colSpan={3} sx={{ border: '1px solid black', p: 1, backgroundColor: '#FFFFFF' }}>
                      <Typography sx={{ fontSize: '11px', color: '#000000' }}>{data.samplingReq}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Bank & Washing */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, width: '100%', backgroundColor: '#FFFFFF' }}>
              <Box sx={{ width: '38%', border: '1px solid black', p: 1, minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF' }}>
                <Box>
                  <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#000000' }}>Beneficiary's Bank :</Typography>
                  <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mt: 0.5, lineHeight: 1.6, color: '#000000' }}>{data.beneficiaryBank}</Typography>
                </Box>
                <Box sx={{ mt: 3, lineHeight: 1.6 }}>
                  <Typography sx={{ fontSize: '11px', color: '#000000' }}>Account No.: {data.accountNo}</Typography>
                  <Typography sx={{ fontSize: '11px', color: '#000000' }}>Routing No.: {data.routingNo}</Typography>
                </Box>
              </Box>

              <Box sx={{ width: '38%', border: '1px solid black', p: 1, minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#FFFFFF' }}>
                <Typography sx={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'center', mb: 1, width: '100%', color: '#000000' }}>
                  Washing - Care Label Instructions
                </Typography>
                <Typography sx={{ fontSize: '10px', lineHeight: 1.8, textAlign: 'left', color: '#000000' }}>
                  {data.washingInstructions}
                </Typography>
              </Box>
            </Box>

            {/* Signatures Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 8, mb: 4 }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 1 }}></Box>
                <Typography sx={{ fontSize: '10px' }}>
                  Mr. Munkhoq Ashraf
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 1 }}></Box>
                <Typography sx={{ fontSize: '10px' }}>
                  Prepared & Checked by
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 1 }}></Box>
                <Typography sx={{ fontSize: '10px' }}>
                  Factory Acknowledgement
                </Typography>
              </Box>
            </Box>


            {/* Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 13.5, pr: 0.5, pl: 0.5 }}>
              <Typography sx={{ fontSize: '9px', color: 'black' }}>
                ERP Solution Provider : www.itg.net.pk
              </Typography>
              <Typography sx={{ fontSize: '9px', color: 'black' }}>
                Page # : 1
              </Typography>
            </Box>
          </Box>

          {/* Second Page - New Content */}
          <Box
            sx={{
              p: 1.5,
              fontFamily: 'Arial, sans-serif',
              fontSize: '10px',
              lineHeight: '1.3',
              width: '210mm',
              minHeight: '297mm',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              marginBottom: '10mm',
              '@media print': {
                boxShadow: 'none',
                p: 0,
                m: 0,
                width: '100%',
                minHeight: '100%',
                transform: 'none',
                marginBottom: 0
              }
            }}
          >
            {/* Second Page Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#000000',
                  mb: 1
                }}
              >
                {secondPageData.companyName}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3, borderColor: '#000' }} />

            {/* AMS Logo and Title */}
            <Box sx={{ width: '150px', height: 'auto', mb: 2.7 }}>
              <img
                src="/logo/AMSlogo.png"
                alt="AMS Logo"
                style={{ width: '200px', height: 'auto', display: 'block' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Box>

            {/* Terms and Conditions */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ pl: 1 }}>
                {secondPageData.termsAndConditions.map((term, index) => (
                  <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                    <Typography sx={{ fontSize: '15px', mr: 1, minWidth: '20px' }}>
                      {index + 1}.
                    </Typography>
                    <Typography sx={{ fontSize: '15px', lineHeight: 1.4, flex: 1 }}>
                      {term}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Bottom Signatures */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 1 }}></Box>
                <Typography sx={{ fontSize: '10px' }}>
                  Mr. Munkhoq Ashrafy
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 1 }}></Box>
                <Typography sx={{ fontSize: '10px' }}>
                  Prepared & Checked by
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 1 }}></Box>
                <Typography sx={{ fontSize: '10px' }}>
                  Factory Acknowledgement
                </Typography>
              </Box>
            </Box>

            {/* Second Page Footer */}
            <Box sx={{
              position: 'relative',
              height: '300px', /* A4 height in pixels for PDF */
              minHeight: '300px'
            }}>
              {/* Content */}

              {/* Footer */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  position: 'absolute',
                  bottom: 20,
                  left: 0,
                  right: 0,
                  px: 2
                }}
              >
                <Typography sx={{ fontSize: '9px', color: 'black' }}>
                  ERP Solution Provider: www.itg.net.pk
                </Typography>
                <Typography sx={{ fontSize: '9px', color: 'black' }}>
                  Page #: 2
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Third Page - Exact Match from Image */}
          <Box
            sx={{
              p: 1.5,
              fontFamily: 'Arial, sans-serif',
              fontSize: '10px',
              lineHeight: '1.3',
              width: '210mm',
              minHeight: '297mm',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              marginBottom: '10mm',
              display: 'flex',
              flexDirection: 'column',
              '@media print': {
                boxShadow: 'none',
                p: 0,
                m: 0,
                width: '100%',
                minHeight: '100%',
                transform: 'none',
                marginBottom: 0
              }
            }}
          >
            {/* Top Content - Exact same positioning */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

              {/* Main Title - Red clay */}
              <Box sx={{ width: '100%', textAlign: 'center', mb: 3 }}>
                <Typography sx={{ fontSize: '24px', fontWeight: 'bold', color: '#000000', letterSpacing: 1 }}>
                  {data.orderRows?.[0]?.color || "Red clay"}
                </Typography>
              </Box>

              {/* Product Description */}
              <Box sx={{ width: '100%', textAlign: 'center', mb: 4 }}>
                <Typography sx={{ fontSize: '16px', color: '#000000', lineHeight: 1.4 }}>
                  {data.itemDescription}
                </Typography>
              </Box>
              {/* No Image Box */}
              <Box sx={{
                width: '200px',
                height: '200px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px solid #ccc',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                margin: '0 auto'
              }}>
                <img
                  src={data.productImage || '/placeholder-product.png'}
                  alt="Product"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#f5f5f5'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {!data.productImage && (
                  <Typography sx={{ fontSize: '12px', color: '#666', position: 'absolute' }}>
                    No Image
                  </Typography>
                )}
              </Box>
              {/* Quantity */}
              <Box sx={{ width: '100%', textAlign: 'center', mb: 2, mt: 2 }}>
                <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>
                  Qty: {data.totalQty}
                </Typography>
              </Box>

              {/* Material */}
              <Box sx={{ width: '100%', textAlign: 'center', mb: 2 }}>
                <Typography sx={{ fontSize: '14px', color: '#000000' }}>
                  {data.fabric.content}
                </Typography>
              </Box>

            </Box>

            {/* Footer - Exact same styling */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 1,
              pb: 1
            }}>
              <Typography sx={{ fontSize: '10px', color: 'black' }}>
                ERP Solution Provider - www.itg.net.pk
              </Typography>
              <Typography sx={{ fontSize: '10px', color: 'black' }}>
                Page #: 3
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PurchaseOrderPageExactMatch;