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

export default function InspectionCertificatePage() {
  const { state } = useLocation();
  const { id } = useParams();

  const shipment = state?.shipment || {};

  // Sample items array - ye API se aayega actual data (abhi hardcoded hai)
  const items = shipment.items || [
    {
      poNo: '202239-765',
      styleNo: '765',
      itemDescription: '100% POLYESTER boys TRICOT Tricot Jogger',
      qtyPcs: 4224,
      qtyCtns: 176,
    },
    {
      poNo: '202239-766',
      styleNo: '766',
      itemDescription: '100% POLYESTER boys TRICOT Tricot Jogger',
      qtyPcs: 3624,
      qtyCtns: 151,
    },
  ];

  // Calculate totals
  const totalPcs = items.reduce((sum, item) => sum + (Number(item.qtyPcs) || 0), 0);
  const totalCtns = items.reduce((sum, item) => sum + (Number(item.qtyCtns) || 0), 0);

  const contentRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Inspection_Certificate_${id}`,
  });

  // Common text styles
  const labelStyle = { fontSize: 10, color: '#1565c0', fontWeight: 600 };
  const valueStyle = { fontSize: 10, color: '#000' };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
      }}
    >
      {/* Viewer header (similar to PDF toolbar) */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: '#3C3C3C',
          color: '#fff',
          boxShadow: 'none',
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: '48px !important' }}>
          {/* Left: title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#fff',
              }}
            >
              Inspection Certificate - {shipment.invoiceNo || id}
            </Typography>
          </Box>

          {/* Center: zoom */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#fff' }}>
              <ZoomOut fontSize="small" />
            </IconButton>
            <Typography
              sx={{
                fontSize: '12px',
                color: '#fff',
                mx: 1,
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#fff' }}>
              <ZoomIn fontSize="small" />
            </IconButton>
          </Box>

          {/* Right: print */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            <IconButton size="small" onClick={handlePrint} sx={{ color: '#fff' }}>
              <Print fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Content area with zoom & scroll */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          backgroundColor: '#282828',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
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
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 0,
              backgroundColor: '#ffffff',
              width: '210mm',
              minHeight: '297mm',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {/* Top header with logo and address */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
              <Box>
                <Box
                  component="img"
                  src="/logo/AMSlogo.png"
                  alt="AMS Logo"
                  sx={{ height: 50 }}
                />
                <Typography sx={{ fontSize: 8, color: '#555', mt: 0.5 }}>
                  A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800
                </Typography>
                <Typography sx={{ fontSize: 8, color: '#555' }}>
                  Karachi - Pakistan. &nbsp;&nbsp;&nbsp;&nbsp; Telephone # : (+92213) 485-3935 & 36
                </Typography>
              </Box>
            </Box>

            {/* Center heading */}
            <Typography
              align="center"
              sx={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1565c0',
                mt: 2,
                mb: 2,
                letterSpacing: 1
              }}
            >
              INSPECTION CERTIFICATE
            </Typography>

            {/* I.C # row */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography sx={labelStyle}>I.C # :</Typography>
              <Typography sx={{ ...valueStyle, ml: 1, color: '#d84315', fontWeight: 600 }}>
                {shipment.icNo || '-'}
              </Typography>
            </Box>

            {/* Intro text */}
            <Typography sx={{ fontSize: 9, mb: 2, lineHeight: 1.5 }}>
              This is to certify that the <b>GOODS</b> have been <b style={{ color: '#d84315' }}>INSPECTED</b> randomly following AQL level defined as per the product by <b style={{ color: '#1565c0' }}>AMS</b> and <b style={{ color: '#2e7d32' }}>FOUND SATISFACTORY</b> under the terms of the <b style={{ color: '#d84315' }}>ORDER</b> as detailed below.
            </Typography>

            {/* Two column layout for metadata */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {/* Left column */}
              <Box>
                <MetaRow label="I.C Issue Date" value={shipment.icIssueDate || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
                <MetaRow label="Buyer" value={shipment.customer || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
                <MetaRow label="Vendor" value={shipment.supplier || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
                <MetaRow label="Invoice #" value={shipment.invoiceNo || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
              </Box>
              {/* Right column */}
              <Box>
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for I.C Issue Date */}
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for Buyer */}
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for Vendor */}
                <MetaRow label="Invoice Date" value={shipment.invoiceDate || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
                <MetaRow label="Terms" value={shipment.terms || 'FOB'} labelStyle={labelStyle} valueStyle={valueStyle} />
              </Box>
            </Box>

            {/* Mode / carrier / voyage / BL / ship date / container - Two columns */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {/* Left column */}
              <Box>
                <MetaRow label="Mode" value={shipment.mode || 'BY SEA'} labelStyle={labelStyle} valueStyle={valueStyle} />
                <MetaRow label="Carrier Name" value={shipment.carrierName || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
                <MetaRow label="Voyage / Flight" value={shipment.voyage || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
                <MetaRow label="BL / AWBL" value={shipment.blAwb || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
                <MetaRow label="Ship Date" value={shipment.shipDate || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
              </Box>
              {/* Right column */}
              <Box>
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for Mode */}
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for Carrier Name */}
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for Voyage / Flight */}
                <MetaRow label="Container #" value={shipment.containerNo || '-'} labelStyle={labelStyle} valueStyle={valueStyle} />
              </Box>
            </Box>

            {/* Items table */}
            <Table
              size="small"
              sx={{
                mb: 2,
                '& th, & td': {
                  border: '1px solid #ccc',
                  fontSize: 10,
                  py: 0.75,
                  px: 1,
                },
              }}
            >
              <TableHead>
                <TableRow sx={{ backgroundColor: '#fff' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1565c0', width: 100 }}>PO #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1565c0', width: 80 }}>Style #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1565c0' }}>Item Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1565c0', width: 80 }} align="right">
                    QTY (Pcs)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1565c0', width: 80 }} align="right">
                    QTY (Ctns)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.poNo}</TableCell>
                    <TableCell>{item.styleNo}</TableCell>
                    <TableCell sx={{ color: '#1565c0' }}>{item.itemDescription}</TableCell>
                    <TableCell align="right">{item.qtyPcs}</TableCell>
                    <TableCell align="right">{item.qtyCtns}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                mb: 4,
              }}
            >
              <Box
                sx={{
                  border: '1px solid #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  px: 2,
                  py: 0.75,
                }}
              >
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#1565c0' }}>Total :</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
                  {totalPcs.toLocaleString()}
                </Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
                  {totalCtns.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Horizontal line before footer */}
            <Box sx={{ borderTop: '1px solid #000', mb: 2, mt: 4 }} />

            {/* Footer note */}
            <Typography sx={{ fontSize: 9, mb: 6, lineHeight: 1.6 }}>
              We have inspected the <b style={{ color: '#d84315' }}>GOODS RANDOMLY</b> and <b style={{ color: '#d84315' }}>ALLOWED</b> to <b style={{ color: '#d84315' }}>SHIP</b> while holding <b style={{ color: '#1565c0', textDecoration: 'underline' }}>SHIPPER FULLY RESPONSIBLE</b> for <b style={{ color: '#d84315' }}>ANY CLAIM</b> that may <b style={{ color: '#d84315' }}>ARISE</b> from <b style={{ color: '#d84315' }}>EVENTUAL BUYERS</b>, the shipper keeps the <b style={{ color: '#d84315' }}>AGENCY</b> fully indemnified, against any losses or claim.
            </Typography>

            {/* Signature */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1565c0', mb: 6 }}>
                Apparel Merchandising Services
              </Typography>
              <Box sx={{ borderTop: '1px solid #000', display: 'inline-block', minWidth: 200, pt: 1 }}>
                <Typography sx={{ fontSize: 10 }}>Authorized Signature</Typography>
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
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
      <Typography sx={{ ...labelStyle, minWidth: 100 }}>{label} :</Typography>
      <Typography sx={{ ...valueStyle, ml: 1 }}>{value}</Typography>
    </Box>
  );
}

