// src/sections/Supply-Chain/PurchaseOrderPDF.jsx
import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

// --- Helper Components (Unchanged and Correct) ---
const POCell = ({ children, header = false, sx = {} }) => (
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
      ...sx 
    }}
  >
    {children}
  </TableCell>
);

const BorderedPOCell = ({ children, header = false, sx = {} }) => (
    <POCell header={header} sx={{ border: '1px solid black', ...sx }}>
      {children}
    </POCell>
);

// --- Full Purchase Order Component ---
const PurchaseOrderPageExactMatch = ({ poData = {} }) => {
  // fallback values if poData missing
  const data = {
    ref: poData.ref || 'AMS-2261',
    receivedDate: poData.receivedDate || 'Monday, May 19, 2025',
    attn: poData.attn || 'COMFORT APPAREL',
    addressLeft: poData.addressLeft || 'PLOT # E-99, SECTOR 31-D KORANGI INDUSTRIAL\nKARACHI\nPAKISTAN',
    trackingCode: poData.trackingCode || '11265',
    brand: poData.brand || 'Gentle Threads',
    division: poData.division || 'Men',
    rn: poData.rn || '130691',
    shipTo: poData.shipTo || 'ALL SEASONS TEXTILE\n1441 BROADWAY, SUITE # 6162\nNEW YORK, NY 10018\nUSA',
    itemDescription: poData.itemDescription || '100% Cotton Men Jersey Garment Dye LS Tee',
    exFactory: poData.exFactory || '07-15-2025',
    finalInspection: poData.finalInspection || '07/10/2025',
    leadTime: poData.leadTime || '57 Days',
    fabric: poData.fabric || { description: 'Body', fabric: 'Jersey', content: '100% Cotton', weight: '190 GSM' },
    packingInstructions: poData.packingInstructions || '12pcs poly bag and 48pcs Master Carton',
    cartonMarking: poData.cartonMarking || 'LR',
    pcsPerCarton: poData.pcsPerCarton || '48',
    orderRows: poData.orderRows || [{ color: 'Red clay', sizeRow: [672,480,672,432], total: '2,256.00 PCS', unit: '2.93', amount: '6,610.08' }],
    totalQty: poData.totalQty || '2,256',
    totalAmount: poData.totalAmount || '6,610.08',
    importantNotes: poData.importantNotes || [
      'Fabric should be heat set and lock properly to avoid shrinkage problem.',
      'Before cutting fabric should be kept on table for atleast 24 hours.',
      'All garments should be 100% checked for sizes before carton packing'
    ],
    productImage: poData.productImage || '', // absolute URL or empty
    
    // --- Added / Completed Fields ---
    shipMode: poData.shipMode || 'Sea',
    destination: poData.destination || 'NEW YORK',
    shipmentTerms: poData.shipmentTerms || 'FOB',
    paymentTerms: poData.paymentTerms || 'DP',
    amsTeam: poData.amsTeam || 'MUHAMMAD SHAHZAIB',
    cpoNumber: poData.cpoNumber || '37522-LS-RED',
    styleNumber: poData.styleNumber || 'LR2096',
    productCategory: poData.productCategory || 'Knits',
    cartonMarking: poData.cartonMarking || 'LR',
    specialInstructions: poData.specialInstructions || 'N/A',
    source: poData.source || 'Local',
    embellishment: poData.embellishment || 'N/A', // Assuming this is for Embroidery/Embellishment details
    trimsAccessories: poData.trimsAccessories || 'Local',
    specialOperation: poData.specialOperation || 'GARMENT DYE',
    samplingReq: poData.samplingReq || 'N/A',
    beneficiaryBank: poData.beneficiaryBank || 'HABIB METROPOLITAN BANK LTD',
    accountNo: poData.accountNo || '601-55-112233',
    routingNo: poData.routingNo || '125010999',
    washingInstructions: poData.washingInstructions || 'Machine Wash Cold With Like Colors, Gentle Cycle. Use Only Non Chlorine Bleach when needed, Line Dry, Cool Iron.',
    // Assume PO total breakdown: 2256 PCS / 12 = 188 Dozens. 2256 / 48 Pcs/Ctn = 47 Cartons.
    poTotalDetails: poData.poTotalDetails || '2,256 PCS 188.00 Dz 47 Ctn', 
  };

  return (
    <Box sx={{ 
      p: 1.5, 
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      lineHeight: '1.3',
      maxWidth: '850px', 
      margin: '0 auto',

      //  BACKGROUND COLOR
      backgroundColor: '#FAFAF8',

      boxShadow: '0 0 5px rgba(0,0,0,0.1)', 
    }}>
      
      {/* 1. Header Section (Unchanged and Correct) */}
     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
    
    {/* Left Side: AMS Logo and Address (Adjusted width and structure) */}
    <Box sx={{ width: '50%' }}>
      
      {/* Logo and APPAREL MERCHANDISING SERVICES */}
      <Box sx={{ mb: 0.2, display: 'block' }}> 
          {/* Logo container */}
          <Box sx={{ width: '150px', height: 'auto', mb: 0.2 }}> 
              {/* Note: Assuming /logo/AMSlogo.png is the path to the combined logo and text image */}
              <img 
                  src="/logo/AMSlogo.png" 
                  alt="AMS Logo" 
                  style={{ width: '150px', height: 'auto', display: 'block' }}
              />
          </Box>
          {/* If logo and text are separate, use this for text: */}
          <Typography sx={{ fontSize: '9px', mt: 0, fontWeight: 'bold', color: '#581845' }}>
             APPAREL MERCHANDISING SERVICES 
          </Typography>
      </Box>

      {/* Address and Phone Number - Left Aligned */}
      <Typography sx={{ fontSize: '9px', mt: 0.5 }}>
        A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800
      </Typography>
      <Typography sx={{ fontSize: '9px' }}>
        Karachi - Pakistan. &nbsp; &nbsp; &nbsp; &nbsp; Telephone # : **(+92213) 485-3935 & 36**
      </Typography>
    </Box>

    {/* Right Side: PO Title, Ref, Date, and Product Image */}
    <Box sx={{ width: '50%', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
        
        {/* PO Details - Ref and Date */}
        <Box sx={{ mr: 2, textAlign: 'right', pt: 0.5, pr: 1 }}>
            {/* Purchase Order Title - Using a generic cursive style property for effect */}
            <Typography variant="h5" sx={{ 
                fontSize: '18px', 
                fontWeight: 'normal', 
                color: '#333', 
                mb: 1.5,
                // Using a fallback font family for cursive effect (exact font requires font import)
                fontFamily: 'cursive', 
                textAlign: 'right' 
            }}>
                Purchase Order
            </Typography>
            
            {/* AMS Ref # */}
            <Typography sx={{ fontSize: '9px', lineHeight: 1.5 }}>
                AMS - Ref # : **{data.ref || 'AMS-2261'}**
            </Typography>
            
            {/* P.O Received Date */}
            <Typography sx={{ fontSize: '9px', lineHeight: 1.5 }}>
                P.O Received Date : **{data.receivedDate || 'Monday, May 19, 2025'}**
            </Typography>
        </Box>
        
        {/* Product Image */}
        <Box sx={{ width: '60px', height: '80px', overflow: 'hidden' }}>
            {/* Assuming a placeholder image for the product */}
            <img 
                src={data.productImage || 'product_image_url_or_placeholder'} 
                alt="Product" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} // objectFit: 'contain' for the whole garment to be visible
            />
        </Box>
    </Box>
</Box>

      {/* 2. Addresses and Key Dates Section */}
    <TableContainer component={Paper} sx={{ mb: 1, border: '1px solid black', backgroundColor: '#FAFAF8' }}>
  <Table size="small" sx={{ borderCollapse: 'collapse' }}>
    <TableBody>
      {/* Row 1: Addresses */}
      <TableRow>
        
        {/* Column 1 - Attn / Tracking Code */}
        <TableCell sx={{ 
          width: '33.3%', 
          borderRight: '1px solid black !important',
          padding: '8px',
          border: 'none', // Retaining original border style
          verticalAlign: 'top' // Added vertical alignment
        }}>
          {/* Attn Header */}
          <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>Attn : COMFORT APPAREL</Typography>
          
          {/* Address Block */}
          <Box sx={{ mt: 0.2 }}>
            <Typography sx={{ fontSize: '9px', fontWeight: 'normal' }}>PLOT # E-99, SECTOR 31-D KORANGI INDUSTRIAL /</Typography>
            {/* KARACHI and PAKISTAN on one line, spaced out */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>KARACHI</Typography>
                <Typography sx={{ fontSize: '9px', fontWeight: 'normal' }}>PAKISTAN</Typography>
            </Box>
          </Box>

          {/* Tracking Code (WITH INNER HORIZONTAL LINE) */}
          <Typography 
            sx={{ 
              fontSize: '9px', 
              fontWeight: 'bold', 
              mt: 0.5, 
              pt: 0.5, // Padding top for border separation
              borderTop: '1px solid black' // <-- Inner Horizontal Line (Alignment ka hissa)
            }}
          >
            Tracking Code: <span style={{fontWeight: 'normal'}}>11265</span>
          </Typography>
        </TableCell>
        
        {/* Column 2 - Customer/Brand/Division */}
        <TableCell sx={{ 
          width: '33.3%', 
          borderRight: '1px solid black !important',
          padding: '8px',
          border: 'none', // Retaining original border style
          verticalAlign: 'top' // Added vertical alignment
        }}>
          {/* Customer/Brand Header */}
          <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>Customer,Brand / Label Name & Division: LR</Typography>
          
          {/* Brand & R.N # (WITH INNER HORIZONTAL LINE) */}
          <Box 
            sx={{ 
              mt: 0.5, 
              pt: 0.5, 
              display: 'flex', 
              borderTop: '1px solid black', // <-- Inner Horizontal Line (Alignment ka hissa)
              flexWrap: 'wrap'
            }}
          >
            <Typography sx={{ fontSize: '9px', fontWeight: 'bold', mr: 0.5 }}>Brand:</Typography>
            <Typography sx={{ fontSize: '9px', fontWeight: 'normal', mr: 2 }}>Gentle Threads</Typography>
            <Typography sx={{ fontSize: '9px', fontWeight: 'bold', mr: 0.5 }}>R.N #:</Typography>
            <Typography sx={{ fontSize: '9px', fontWeight: 'normal' }}>130691</Typography>
          </Box>
          
          {/* Division */}
          <Box sx={{ mt: 0.5 }}>
            <Typography sx={{ fontSize: '9px', fontWeight: 'bold', display: 'inline', mr: 0.5 }}>Division:</Typography>
            <Typography sx={{ fontSize: '9px', fontWeight: 'normal', display: 'inline' }}>Men</Typography>
          </Box>
        </TableCell>
        
        {/* Column 3 - Ship To */}
        <TableCell sx={{ 
          width: '33.3%',
          padding: '8px',
          border: 'none', // Retaining original border style
          verticalAlign: 'top' // Added vertical alignment
        }}>
          <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>Ship To:</Typography>
          <Typography sx={{ fontSize: '9px', fontWeight: 'normal' }}>ALL SEASONS TEXTILE</Typography>
          {/* Address line 2 & 3 combined and fixed */}
          <Typography sx={{ fontSize: '9px', fontWeight: 'normal' }}>1441 BROADWAY, SUITE # 6162 NEW YORK, NY 10018</Typography> 
          
          {/* NY and USA split (as per image) */}
          <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between', pr: 2 }}> 
            <Typography sx={{ fontSize: '9px', fontWeight: 'normal' }}>NY</Typography>
            <Typography sx={{ fontSize: '9px', fontWeight: 'normal' }}>USA</Typography> 
          </Box>
        </TableCell>
        
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>
      {/* Item Description, Dates and Ship Details in one row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        {/* Left Side - Item Description and Dates */}
        <Box sx={{ width: '40%' }}>
          <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>Item Description :</Typography>
          <Typography sx={{ fontSize: '9px', fontWeight: 'bold', mt: 0.5 }}>
            {data.itemDescription}
          </Typography>
          
          <Box sx={{ display: 'flex', mt: 1 }}>
            <Box sx={{ width: '45%' }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>Ex-Factory (Ship Date)</Typography>
              <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>Final Inspection Date</Typography>
            </Box>
            <Box sx={{ width: '55%', textAlign: 'right' }}>
              <Typography sx={{ fontSize: '9px' }}>{data.exFactory} - {data.exFactory}</Typography>
              <Typography sx={{ fontSize: '9px' }}>{data.finalInspection}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Side - Ship Details Table */}
        <Box sx={{ width: '60%' }}>
          <TableContainer component={Paper} sx={{ backgroundColor: '#FAFAF8' }}>
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

      {/* 3. Fabrication and Packing Table */}
<Box
  sx={{
    display: 'flex',
    mb: 1,
    borderTop: '1px solid black',
    backgroundColor: '#FAFAF8',
    flexDirection: 'column'
  }}
>
  {/* -------- TOP HEADER CONTAINER -------- */}
  <Box sx={{ display: 'flex', padding: '10px', gap: '90px' }}>
    <POCell header sx={{ padding: '0' }}>
      Fabrication Body & Trims
    </POCell>

    <POCell header sx={{ padding: '0' }}>
      AMS - Team: {data.amsTeam}
    </POCell>

    <POCell header sx={{ padding: '0' }}>
      C.P.O #: {data.cpoNumber}
    </POCell>

    <POCell header sx={{ padding: '0' }}>
      Style #: {data.styleNumber}
    </POCell>
  </Box>
  {/* -------- MAIN TABLE CONTAINER -------- */}
<TableContainer
  component={Paper}
  sx={{ flex: '1', backgroundColor: '#FAFAF8' }}
>
  <Table size="small" sx={{ borderCollapse: 'collapse', width: '100%' }}>
    <TableHead>
      {/* -------- HEADER ROW -------- */}
      <TableRow sx={{ borderBottom: '1px solid black' }}>
        <POCell header sx={{ width: '12%', textAlign: 'left', paddingLeft: '8px' }}>Description</POCell>
        <POCell header sx={{ width: '12%', textAlign: 'left', paddingLeft: '8px' }}>Fabric</POCell>
        <POCell header sx={{ width: '15%', textAlign: 'left', paddingLeft: '8px' }}>Content</POCell>
        <POCell header sx={{ width: '10%', textAlign: 'left', paddingLeft: '8px' }}>Weight</POCell>

        <POCell
          header
          sx={{
            width: '36%',
            borderLeft: '1px solid black',
            fontWeight: 'bold',
            textAlign: 'left',
            paddingLeft: '8px',
          }}
        >
          Packing Instructions
        </POCell>

        <POCell
          header
          sx={{
            width: '15%',
            borderLeft: '1px solid black',
            fontWeight: 'bold',
            textAlign: 'left',
            paddingLeft: '8px',
          }}
        >
          Ratio
        </POCell>
      </TableRow>
    </TableHead>

    {/* -------- BODY ROW -------- */}
    <TableBody>
      {/* ROW 1: Fabric Details & Packing Details */}
      <TableRow sx={{ borderLeft: '1px solid black', borderRight: '1px solid black' }}>
        
        {/* Description */}
        <POCell sx={{ 
          borderRight: '1px solid black', 
          verticalAlign: 'top', 
          height: '60px',
          borderBottom: '1px solid black',
          width: '12%',
          paddingLeft: '8px'
        }}>
          <Typography sx={{ fontSize: '11px', fontWeight: 'bold' }}>Body</Typography>
        </POCell>

        {/* Fabric */}
        <POCell sx={{ 
          borderRight: '1px solid black', 
          verticalAlign: 'top', 
          height: '60px',
          borderBottom: '1px solid black',
          width: '12%',
          paddingLeft: '8px'
        }}>
          <Typography sx={{ fontSize: '11px' }}>Jersey</Typography>
        </POCell>

        {/* Content */}
        <POCell sx={{ 
          borderRight: '1px solid black', 
          verticalAlign: 'top', 
          height: '60px',
          borderBottom: '1px solid black',
          width: '15%',
          paddingLeft: '8px'
        }}>
          <Typography sx={{ fontSize: '11px' }}>100% Cotton</Typography>
        </POCell>

        {/* Weight */}
        <POCell sx={{ 
          borderRight: '1px solid black', 
          verticalAlign: 'top', 
          height: '60px',
          borderBottom: '1px solid black',
          width: '10%',
          paddingLeft: '8px'
        }}>
          <Typography sx={{ fontSize: '11px' }}>190 GSM</Typography>
        </POCell>

        {/* Packing Instructions */}
        <POCell sx={{ 
          verticalAlign: 'top', 
          height: '60px',
          borderBottom: '1px solid black',
          width: '36%',
          paddingLeft: '8px'
        }}>
          <Typography sx={{ fontSize: '11px' }}>12pcs poly bag and 48pcs Master Carton</Typography>
        </POCell>

        {/* Ratio */}
        <POCell sx={{ 
          verticalAlign: 'top', 
          height: '60px',
          borderBottom: '1px solid black',
          width: '15%',
          paddingLeft: '8px',
          borderLeft: '1px solid black'
        }}>
          {/* Ratio data */}
        </POCell>
      </TableRow>

      {/* ROW 2: OTHER */}
      <TableRow sx={{ 
        borderLeft: '1px solid black', 
        borderRight: '1px solid black',
        borderBottom: '1px solid black' 
      }}>
        
        {/* OTHER LABEL */}
        <POCell sx={{ 
          verticalAlign: 'top',
          borderRight: '1px solid black',
          width: '12%',
          paddingLeft: '8px'
        }}>
          <Typography sx={{ fontSize: '11px', fontWeight: 'bold' }}>Other</Typography>
        </POCell>
        
        {/* OTHER VALUE (ColSpan 3) */}
        <POCell colSpan={3} sx={{ 
          borderRight: '1px solid black'
        }}>
          {/* {data.otherDetails} */}
        </POCell>

        {/* PACKING NOTES/RATIO (ColSpan 2) */}
        <POCell colSpan={2} sx={{ 
          height: '35px',
          borderLeft: '1px solid black'
        }}>
          {/* {data.ratioDetails} */}
        </POCell>
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>
</Box>


      {/* 4. Product Details, Team, and Carton Marking */}
      <Box sx={{ display: 'flex', mb: 1, backgroundColor: '#FAFAF8' }}>
  
  {/* Left Side (Product Category, Pcs Per Carton) - 55% */}
  <Box sx={{ flex: 55, mr: 0.5 }}>
    <TableContainer component={Paper} sx={{ backgroundColor: '#FAFAF8' }}>
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

  {/* Right Side (Carton Marking) - 45% */}
  <Box sx={{ flex: 45, ml: 0.5 }}>
    <TableContainer component={Paper} sx={{ backgroundColor: '#FAFAF8' }}>
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


      {/* 5. Main Quantity and Pricing Table */}
<TableContainer component={Paper} sx={{ mb: 0, border: '1px solid black', backgroundColor: '#FAFAF8' }}>
  <Table sx={{ minWidth: 450, fontSize: '0.70rem', borderCollapse: 'collapse' }} size="small">

    <TableHead>
      <TableRow sx={{ borderBottom: "1px solid black" }}>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>Color (s)</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>Product Code</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>Reference</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }} colSpan={4}>Size Range</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>Color Total Qty in PCS</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>FOB Unit Price ($)</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>FOB Value Sub Amount ($)</TableCell>
      </TableRow>
    </TableHead>

    <TableBody>

      {/* ------- Color main title row ------- */}
      <TableRow sx={{ borderBottom: "1px solid black" }}>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[0]?.color ?? "Red clay"}</TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
        <TableCell colSpan={4} sx={{ padding: '2px 4px' }}></TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
      </TableRow>

      {/* ------- S-XL SIZE HEADER ------- */}
      <TableRow sx={{ borderBottom: "1px solid black" }}>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>S-XL</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[0]?.productCode ?? "NA"}</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>Size</TableCell>

        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>S</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>M</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>L</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>XL</TableCell>

        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>PCS</TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
      </TableRow>

      {/* ------- S-XL QUANTITY ROW ------- */}
      <TableRow sx={{ borderBottom: "1px solid black" }}>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[0]?.productCode ?? "NA"}</TableCell>

        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>Quantity</TableCell>

        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[0]?.sizeRow?.[0] ?? 672}</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[0]?.sizeRow?.[1] ?? 480}</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[0]?.sizeRow?.[2] ?? 672}</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[0]?.sizeRow?.[3] ?? 432}</TableCell>

        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[0]?.totalQty ?? '2,256.00 PCS'}</TableCell>

        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>${data.orderRows?.[0]?.unitPrice ?? "2.93"}</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>${data.orderRows?.[0]?.subAmount ?? "6,610.08"}</TableCell>
      </TableRow>

      {/* ------- 2XL HEADER ------- */}
      <TableRow sx={{ borderBottom: "1px solid black" }}>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>2XL</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[1]?.productCode ?? "NA"}</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>Size</TableCell>

        <TableCell colSpan={4} sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>2XL</TableCell>

        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>PCS</TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
      </TableRow>

      {/* ------- 2XL QUANTITY ------- */}
      <TableRow sx={{ borderBottom: "1px solid black" }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>2XL</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[1]?.productCode ?? "NA"}</TableCell>

        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>Quantity</TableCell>
        <TableCell colSpan={4} sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[1]?.sizeRow?.[0] ?? 0}</TableCell>

        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[1]?.totalQty ?? '0 PCS'}</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>${data.orderRows?.[1]?.unitPrice ?? "3.15"}</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>${data.orderRows?.[1]?.subAmount ?? "0.00"}</TableCell>
      </TableRow>

      {/* ------- 3XL HEADER ------- */}
      <TableRow sx={{ borderBottom: "1px solid black" }}>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>3XL</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[2]?.productCode ?? "NA"}</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>Size</TableCell>

        <TableCell colSpan={4} sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>3XL</TableCell>

        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>PCS</TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
      </TableRow>

      {/* ------- 3XL QUANTITY ------- */}
      <TableRow sx={{ borderBottom: "1px solid black" }}>
       <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>3XL</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[2]?.productCode ?? "NA"}</TableCell>

        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px' }}>Quantity</TableCell>
        <TableCell colSpan={4} sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[2]?.sizeRow?.[0] ?? 0}</TableCell>

        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>{data.orderRows?.[2]?.totalQty ?? '0 PCS'}</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>${data.orderRows?.[2]?.unitPrice ?? "3.30"}</TableCell>
        <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px' }}>${data.orderRows?.[2]?.subAmount ?? "0.00"}</TableCell>
      </TableRow>

      {/* ------- TOTAL ROW ------- */}
      <TableRow sx={{ borderBottom: "1px solid black" }}>
        <TableCell colSpan={7} sx={{ textAlign: "right", fontWeight: "bold", fontSize: '0.70rem', padding: '2px 4px' }}>Total:-</TableCell>
        <TableCell sx={{ fontWeight: "bold", fontSize: '0.70rem', padding: '2px 8px' }}>{data.grandTotalQty ?? "2256"}</TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
        <TableCell sx={{ padding: '2px 4px' }}></TableCell>
      </TableRow>

    </TableBody>
  </Table>
</TableContainer>

{/* 🌟 P.O. Total Section - Outside the Table (Left Aligned) 🌟 */}
<Box
    sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1px 0', 
        fontSize: '0.70rem', 
    }}
>
    <Box sx={{ 
        fontWeight: 'bold', 
        display: 'flex', 
        gap: '3px' 
    }}>
        P.O Total: <span style={{ paddingRight: '10px' }}>{data.poTotalQty ?? '2,256'}</span> PCS {data.poTotalDetails ?? '188.00 Dz 47 Ctn'}
    </Box>
    <Box sx={{ 
        display: 'flex', 
        fontWeight: 'bold',
    }}>
        <Box sx={{ 
            textAlign: 'left', 
            pr: 0.5, 
            pl: 0.5,
            backgroundColor: '#f0f0f0',
        }}>
            P.O Net FOB Value $
        </Box>
        <Box sx={{ 
            textAlign: 'left', 
            pr: 0.5, 
            pl: 0.5,
            backgroundColor: '#f0f0f0',
            minWidth: '60px'
        }}>
            {data.grandTotalAmount ?? '6,610.08'}
        </Box>
    </Box>
</Box>

      {/* 6. Instructions, More Info, Banking, and Washing Instructions Section */}
<TableContainer component={Paper} sx={{ border: '1px solid black', borderRadius: 0, boxShadow: 'none' }}>
  <Table size="small" sx={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
    
    {/* Columns Width setting */}
    <colgroup>
      <col style={{ width: '15%' }} />
      <col style={{ width: '45%' }} />
      <col style={{ width: '20%' }} />
      <col style={{ width: '20%' }} />
    </colgroup>

    <TableBody>

      {/* ===================== ROW 1: Special Inst & Source ===================== */}
      <TableRow>
        <TableCell sx={{ border: '1px solid black', verticalAlign: 'top', fontWeight: 'bold', fontSize: '11px', p: 1 }}>
          Special 
          Instructions :
        </TableCell>

        <TableCell sx={{ border: '1px solid black', verticalAlign: 'top', p: 1 }}>
          {/* Empty */}
        </TableCell>

        <TableCell colSpan={2} sx={{ border: '1px solid black', verticalAlign: 'top', p: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ width: '100%', textAlign: 'right', mb: 1 }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 'bold' }}>Source</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <Box>
                 <Typography sx={{ fontSize: '11px', fontWeight: 'bold' }}>Fabric</Typography>
                 <Typography sx={{ fontSize: '11px' }}>Local</Typography>
               </Box>
               <Box sx={{ textAlign: 'right' }}>
                 <Typography sx={{ fontSize: '11px' }}>Trims & Accessories</Typography>
                 <Typography sx={{ fontSize: '11px' }}>{data.trimsAccessories || ""}</Typography>
               </Box>
            </Box>
          </Box>
        </TableCell>
      </TableRow>


      {/* ===================== ROW 2: Important Note & Special Op (BORDER REMOVED HERE) ===================== */}
      <TableRow>
        {/* Note Label */}
        <TableCell sx={{ border: '1px solid black', verticalAlign: 'top', fontWeight: 'bold', fontSize: '11px', p: 1 }}>
          Important Note:
        </TableCell>

        {/* Note Content */}
        <TableCell sx={{ border: '1px solid black', verticalAlign: 'top', p: 1 }}>
          <Typography sx={{ fontSize: '10px', lineHeight: 1.5 }}>
            1- {data.importantNotes?.[0] || "Fabric should be heat set and lock properly to avoid shrinkage problem."}<br/>
            2- {data.importantNotes?.[1] || "Before cutting fabric should be kept on table for atleast 24 hours."}<br/>
            3- {data.importantNotes?.[2] || "All garments should be 100% checked for sizes before carton packing"}
          </Typography>
        </TableCell>

        {/* Special Op Label - RIGHT BORDER REMOVED */}
        <TableCell sx={{ 
            border: '1px solid black', 
            borderRight: 'none',   // <--- Yahan se border hataya
            verticalAlign: 'top', 
            fontWeight: 'bold', 
            fontSize: '11px', 
            p: 1 
          }}>
          Special Operation
        </TableCell>

        {/* Special Op Content - LEFT BORDER REMOVED */}
        <TableCell sx={{ 
            border: '1px solid black', 
            borderLeft: 'none',    // <--- Yahan se border hataya
            verticalAlign: 'top', 
            textAlign: 'right', 
            p: 1 
          }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Emb & Embellishment :</Typography>
          <Typography sx={{ fontSize: '10px', mt: 0.5 }}>{data.embellishment || "GARMENT DYE"}</Typography>
        </TableCell>
      </TableRow>

      {/* ===================== ROW 3: More Info ===================== */}
      <TableRow>
        <TableCell sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: '11px', p: 1 }}>More Info :</TableCell>
        <TableCell colSpan={3} sx={{ border: '1px solid black', p: 1 }}>
             <Typography sx={{ fontSize: '11px' }}>N/A</Typography>
        </TableCell>
      </TableRow>

      {/* ===================== ROW 4: Sampling Req ===================== */}
      <TableRow>
        <TableCell sx={{ border: '1px solid black', fontWeight: 'bold', fontSize: '11px', p: 1 }}>Sampling Req :</TableCell>
        <TableCell colSpan={3} sx={{ border: '1px solid black', p: 1 }}>
             <Typography sx={{ fontSize: '11px' }}>{data.samplingReq || "N/A"}</Typography>
        </TableCell>
      </TableRow>

      {/* ===================== ROW 5: Bank & Washing ===================== */}
     {/* ===================== ROW 5: Bank & Washing (Alignment Changed) ===================== */}
      <TableRow>
        
        {/* BANK DETAILS - Left Side (No Change) */}
       

      </TableRow>

    </TableBody>
  </Table>
</TableContainer>
{/* Main Container for the two Boxes */}
<Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    mb: 1, 
    // Assuming the container fills a certain width, e.g., 100%
    width: '100%' 
}}>
    
    {/* LEFT BOX: Beneficiary's Bank Details */}
    <Box 
        sx={{ 
            width: '38%', // <--- Maximum Gap setting (38% + 38% = 76% width used, 24% for gap)
            border: '1px solid black', 
            p: 1, 
            minHeight: '120px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between'
        }}
    >
        {/* Top: Heading */}
        <Box>
            <Typography sx={{ fontSize: '11px', fontWeight: 'bold' }}>Beneficiary's Bank :</Typography>
            <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mt: 0.5, lineHeight: 1.6 }}>{data.beneficiaryBank || ""}</Typography> 
        </Box>
        
        {/* Bottom: Details */}
        <Box sx={{ mt: 3, lineHeight: 1.6 }}>
           <Typography sx={{ fontSize: '11px' }}>Account No.: {data.accountNo || ""}</Typography>
           <Typography sx={{ fontSize: '11px' }}>Routing No.: {data.routingNo || ""}</Typography>
        </Box>
    </Box>

    {/* RIGHT BOX: Washing Instructions */}
    <Box 
        sx={{ 
            width: '38%', // <--- Maximum Gap setting
            border: '1px solid black', 
            p: 1, 
            minHeight: '120px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start'
        }}
    >
        
        {/* Header: Centered Alignment (for the header text only) */}
        <Typography sx={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'center', mb: 1, width: '100%' }}>
            Washing - Care Label Instructions
        </Typography>
        
        {/* Text: Increased Line Height (line-brhra) */}
        <Typography sx={{ fontSize: '10px', lineHeight: 1.8, textAlign: 'left' }}> 
            {data.washingInstructions || "Machine Wash Cold With Like Colors, Gentle Cycle. Use Only Non Chlorine Bleach when needed , Line Dry, Cool Iron."}
        </Typography>
    </Box>
</Box>
      {/* 7. Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, pr: 0.5, pl: 0.5 }}>
        <Typography sx={{ fontSize: '9px', color: 'gray' }}>
          ERP Solution Provider : www.itg.net.pk
        </Typography>
        <Typography sx={{ fontSize: '9px', color: 'gray' }}>
          Page # : 1
        </Typography>
      </Box>
    </Box>
  );
};

export default PurchaseOrderPageExactMatch;