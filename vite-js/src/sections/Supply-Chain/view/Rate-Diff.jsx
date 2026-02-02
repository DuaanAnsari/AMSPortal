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
import { ZoomIn, ZoomOut, Print, Download } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ----------------------------------------------------------------------

export default function RateDiffPage() {
  const { state } = useLocation();
  const { id } = useParams();
  const shipment = state?.shipment || {};
  const invoiceData = {
    invoiceNo: 'MAFD-002-25-26',
    invoiceDate: '05-29-2025',
    buyersOrder: 'VPO-1137963-WHITE,VPO-1137963-WHITE',
    exporterInvoiceNo: '',
    exporterInvoiceDate: '05-29-2025',
    buyerOther: 'Threadfast Apparel',
    countryOrigin: 'PAKISTAN',
    countryFinal: 'USA',
    beneficiary: {
      name: 'A M S House',
      address:
        '84,Kokan Housing Society Alamgir Road - Postal Code: 74800 Karachi - Pakistan.',
      tel: 'Tel : (+92213) 485-3935 & 36  Toll Free:',
    },
    consignee: {
      name: 'All Seasons textile',
      address: '1441 BROADWAY, SUITE # 6162 NEW YORK , NY 10018',
      city: 'New York',
      country: 'USA',
    },
    exporter: {
      name: 'MS Garments',
      country: 'Pakistan',
    },
    vesselFlight: 'APL PHOENIX ( OJNIXW1MA)',
    placeOfReceipt: 'N/A',
    portOfLoading: 'KARACHI PAKISTAN',
    terms: 'FOB',
    portOfDischarge: 'NEW YORK,USA',
    finalDestination: 'Lewisberry',
    rows: [
      {
        styleNo: '32QQ',
        orderNo: 'VPO-1137963',
        description:
          '70% COTTON 30% POLYESTER Men TIGHT KNIT FLEECE 1/4 ZIP HOODIE',
        quantity: 180,
        rate: 5.55,
        amount: 999.0,
      },
      {
        styleNo: '32QQ',
        orderNo: 'VPO-1137963',
        description:
          '70% COTTON 30% POLYESTER Men TIGHT KNIT FLEECE 1/4 ZIP HOODIE',
        quantity: 1032,
        rate: 4.77,
        amount: 4922.64,
      },
    ],
    amountInWords:
      'DOLLAR FIVE THOUSAND NINE HUNDRED TWENTY-ONE AND SIXTY-FOUR PAISA ONLY',
    remarks: '',
    bankNote:
      'Please make deposit the invoiced amount in the favour "HAB BANK ACCOUNT"',
    bankDetails: [
      'No. "1012207151", 99 MADISON AVENUE NEW YORK ZIP 10016 USA.',
      'IFSC CODE NO. "026007362" and please intimate the same to us.',
    ],
  };

  const contentRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1.2);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Rate_Diff_${invoiceData.invoiceNo || id}`,
  });

  const handleDownloadPDF = async () => {
    const element = contentRef.current;
    if (!element) return;
    const originalTransform = element.style.transform;
    const originalTransition = element.style.transition;

    try {
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
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = pdfWidth / imgWidth;
        const finalHeight = imgHeight * ratio;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(finalHeight, pdfHeight));
        if (i < pages.length - 1) {
          pdf.addPage();
        }
      }

      pdf.save(`Rate_Diff_${invoiceData.invoiceNo || id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      element.style.transform = originalTransform;
      element.style.transition = originalTransition;
    }
  };

  const formatNumber = (val) => {
    const num = Number(val);
    if (Number.isNaN(num)) return val || '';
    return num.toLocaleString();
  };

  const rows = invoiceData.rows;

  const totalQuantity = rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const totalAmount = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const labelStyle = { fontSize: 10, color: '#000', fontWeight: 600 };
  const valueStyle = { fontSize: 10, color: '#000' };
  const cellStyle = {
    fontSize: 9,
    py: 0.4,
    px: 0.6,
    border: '1px solid #000',
    color: '#000',
  };
  const headerCellStyle = { ...cellStyle, fontWeight: 700, backgroundColor: '#fff', color: '#000' };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
      }}
    >
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          html, body { background: #ffffff !important; }
          .print-shell { background: #ffffff !important; padding: 0 !important; }
          .print-scale { transform: none !important; }
          .print-page { box-shadow: none !important; page-break-after: always; }
          .print-page:last-child { page-break-after: auto; }
        }
      `}</style>

      <AppBar
        position="static"
        sx={{ backgroundColor: '#3C3C3C', color: '#fff', boxShadow: 'none' }}
      >
        <Toolbar variant="dense" sx={{ minHeight: '48px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
              Rate Diff - {invoiceData.invoiceNo || id}
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
            <IconButton size="small" onClick={handleDownloadPDF} sx={{ color: '#fff' }}>
              <Download fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handlePrint} sx={{ color: '#fff' }}>
              <Print fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        className="print-shell"
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
          className="print-scale"
          sx={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          <Paper
            elevation={3}
            className="print-page"
            sx={{
              p: 2,
              borderRadius: 0,
              backgroundColor: '#ffffff',
              color: '#000000',
              width: '210mm',
              minHeight: '297mm',
              fontFamily: 'Arial, sans-serif',
              border: '1px solid #000',
            }}
          >
            <Typography align="center" sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
              INVOICE
            </Typography>

            <Box sx={{ border: '1px solid #000', mb: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Beneficiary</Typography>
                  <Typography sx={valueStyle}>{invoiceData.beneficiary.name}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.beneficiary.address}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.beneficiary.tel}</Typography>
                </Box>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Invoice No</Typography>
                  <Typography sx={valueStyle}>{invoiceData.invoiceNo}</Typography>
                </Box>
                <Box sx={{ p: 0.6 }}>
                  <Typography sx={labelStyle}>Invoice Date</Typography>
                  <Typography sx={valueStyle}>{invoiceData.invoiceDate}</Typography>
                  <Typography sx={{ ...labelStyle, mt: 0.6 }}>Buyer&apos;s Order No. &amp; Date</Typography>
                  <Typography sx={valueStyle}>{invoiceData.buyersOrder}</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ border: '1px solid #000', mb: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Exporter</Typography>
                  <Typography sx={valueStyle}>{invoiceData.exporter.name}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.exporter.country}</Typography>
                </Box>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Buyer (if other than consignee)</Typography>
                  <Typography sx={valueStyle}>{invoiceData.buyerOther || '-'}</Typography>
                </Box>
                <Box sx={{ p: 0.6 }}>
                  <Typography sx={labelStyle}>Country of Origin of Goods</Typography>
                  <Typography sx={valueStyle}>{invoiceData.countryOrigin}</Typography>
                  <Typography sx={{ ...labelStyle, mt: 0.6 }}>
                    Country of Final Destination
                  </Typography>
                  <Typography sx={valueStyle}>{invoiceData.countryFinal}</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ border: '1px solid #000', mb: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Consignee</Typography>
                  <Typography sx={valueStyle}>{invoiceData.consignee.name}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.consignee.address}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.consignee.city}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.consignee.country}</Typography>
                </Box>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Exporter Invoice No</Typography>
                  <Typography sx={valueStyle}>{invoiceData.exporterInvoiceNo || '-'}</Typography>
                </Box>
                <Box sx={{ p: 0.6 }}>
                  <Typography sx={labelStyle}>Exp Inv Date</Typography>
                  <Typography sx={valueStyle}>{invoiceData.exporterInvoiceDate}</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ border: '1px solid #000', mb: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Vessel / Flight No</Typography>
                  <Typography sx={valueStyle}>{invoiceData.vesselFlight}</Typography>
                </Box>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Place of Receipt</Typography>
                  <Typography sx={valueStyle}>{invoiceData.placeOfReceipt}</Typography>
                </Box>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Port of Loading</Typography>
                  <Typography sx={valueStyle}>{invoiceData.portOfLoading}</Typography>
                </Box>
                <Box sx={{ p: 0.6 }}>
                  <Typography sx={labelStyle}>Terms of Delivery & Payment</Typography>
                  <Typography sx={valueStyle}>{invoiceData.terms}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderTop: '1px solid #000' }}>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Port of Discharge</Typography>
                  <Typography sx={valueStyle}>{invoiceData.portOfDischarge}</Typography>
                </Box>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Final Destination</Typography>
                  <Typography sx={valueStyle}>{invoiceData.finalDestination}</Typography>
                </Box>
                <Box sx={{ borderRight: '1px solid #000', p: 0.6 }} />
                <Box sx={{ p: 0.6 }} />
              </Box>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>STYLE NO.</TableCell>
                  <TableCell sx={headerCellStyle}>ORDER NO.</TableCell>
                  <TableCell sx={headerCellStyle}>DESCRIPTION OF GOODS</TableCell>
                  <TableCell sx={headerCellStyle} align="right">QUANTITY NOS</TableCell>
                  <TableCell sx={headerCellStyle} align="right">RATE FOB USD</TableCell>
                  <TableCell sx={headerCellStyle} align="right">AMOUNT FOB</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell sx={cellStyle}>{row.styleNo}</TableCell>
                    <TableCell sx={cellStyle}>{row.orderNo}</TableCell>
                    <TableCell sx={cellStyle}>{row.description}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatNumber(row.quantity)}</TableCell>
                    <TableCell sx={cellStyle} align="right">{row.rate.toFixed(4)}</TableCell>
                    <TableCell sx={cellStyle} align="right">{formatNumber(row.amount.toFixed(2))}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={cellStyle} colSpan={3} align="center">
                    <Typography sx={{ fontWeight: 700, fontSize: 8 }}>NET TOTAL</Typography>
                  </TableCell>
                  <TableCell sx={cellStyle} align="right">{formatNumber(totalQuantity)}</TableCell>
                  <TableCell sx={cellStyle} align="right" />
                  <TableCell sx={cellStyle} align="right">{formatNumber(totalAmount.toFixed(2))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: 8 }}>
                <b>Amount Chargeable (In Words):</b> {invoiceData.amountInWords}
              </Typography>
            </Box>
            <Box sx={{ mt: 0.5 }}>
              <Typography sx={{ fontSize: 8 }}>
                <b>Remarks:</b> {invoiceData.remarks}
              </Typography>
            </Box>
            <Box sx={{ mt: 0.5 }}>
              <Typography sx={{ fontSize: 8 }}>
                <b>C/N No:</b>
              </Typography>
            </Box>
            <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 8 }}>
                <b>SERVICE TAX NO:</b>
              </Typography>
              <Typography sx={{ fontSize: 8 }}>for Apparel Merchandising Services</Typography>
            </Box>
            <Box sx={{ mt: 0.5 }}>
              <Typography sx={{ fontSize: 8 }}>
                {invoiceData.bankNote}
              </Typography>
              <Typography sx={{ fontSize: 8 }}>
                {invoiceData.bankDetails[0]}
              </Typography>
              <Typography sx={{ fontSize: 8 }}>
                {invoiceData.bankDetails[1]}
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 8, borderTop: '1px solid #000', minWidth: 120, textAlign: 'center' }}>
                President
              </Typography>
              <Typography sx={{ fontSize: 8, borderTop: '1px solid #000', minWidth: 160, textAlign: 'center' }}>
                Authorized Signatory
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

