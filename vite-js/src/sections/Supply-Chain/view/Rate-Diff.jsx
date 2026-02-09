import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  AppBar,
  Alert,
  Box,
  CircularProgress,
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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fmtDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-US');
  };

  // Amount (USD) -> words, for footer "Amount Chargeable (In Words)"
  const amountToWordsUSD = (amount) => {
    const ones = [
      'ZERO',
      'ONE',
      'TWO',
      'THREE',
      'FOUR',
      'FIVE',
      'SIX',
      'SEVEN',
      'EIGHT',
      'NINE',
      'TEN',
      'ELEVEN',
      'TWELVE',
      'THIRTEEN',
      'FOURTEEN',
      'FIFTEEN',
      'SIXTEEN',
      'SEVENTEEN',
      'EIGHTEEN',
      'NINETEEN',
    ];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

    const twoDigits = (n) => {
      if (n < 20) return ones[n];
      const t = Math.floor(n / 10);
      const o = n % 10;
      return o ? `${tens[t]}-${ones[o]}` : tens[t];
    };

    const threeDigits = (n) => {
      const h = Math.floor(n / 100);
      const r = n % 100;
      if (!h) return r ? twoDigits(r) : '';
      return r ? `${ones[h]} HUNDRED ${twoDigits(r)}` : `${ones[h]} HUNDRED`;
    };

    const intToWords = (n) => {
      if (!n) return 'ZERO';
      const parts = [];
      const billion = Math.floor(n / 1_000_000_000);
      const million = Math.floor((n % 1_000_000_000) / 1_000_000);
      const thousand = Math.floor((n % 1_000_000) / 1000);
      const rest = n % 1000;

      if (billion) parts.push(`${threeDigits(billion)} BILLION`);
      if (million) parts.push(`${threeDigits(million)} MILLION`);
      if (thousand) parts.push(`${threeDigits(thousand)} THOUSAND`);
      if (rest) parts.push(threeDigits(rest));
      return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    };

    const num = Number(amount);
    if (!Number.isFinite(num)) return '';

    const rounded = Math.round(num * 100) / 100;
    const dollars = Math.floor(Math.abs(rounded));
    const cents = Math.round((Math.abs(rounded) - dollars) * 100);

    const dollarWords = intToWords(dollars);
    const centWords = cents ? twoDigits(cents) : '';

    const sign = rounded < 0 ? 'MINUS ' : '';
    const centPart = cents ? ` AND ${centWords} PAISA` : '';
    return `${sign}DOLLAR ${dollarWords}${centPart} ONLY`.replace(/\s+/g, ' ').trim();
  };

  useEffect(() => {
    const cargoId = id || shipment?.cargoid || shipment?.cargoID;
    if (!cargoId) {
      setError('Missing cargo ID.');
      setLoading(false);
      return;
    }
    if (!API_BASE_URL) {
      setError('Missing VITE_API_BASE_URL in env.');
      setLoading(false);
      return;
    }

    let isActive = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const base = String(API_BASE_URL).replace(/\/+$/, '');
        const url = `${base}/api/Report/RateDiffPDF/${encodeURIComponent(cargoId)}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const json = await res.json();
        const items = Array.isArray(json) ? json : json ? [json] : [];
        const first = items[0] || {};

        const normalizeOrders = (value) =>
          String(value || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        const rows = items.map((it, idx) => {
          const qty = Number(it.quantity || 0);
          const rate = Number(it.shippedRate || 0);
          const rawOrder = String(it.pooo || '').trim();
          const parts = normalizeOrders(rawOrder);
          // If API returns a combined list, distribute per row index (matches old print)
          const orderNo =
            parts.length > 1 ? (parts.length >= items.length ? parts[idx] || parts[0] : parts[0]) : rawOrder;
          return {
            styleNo: it.styles || '',
            orderNo: orderNo || '',
            description: it.itemDescription || '',
            quantity: qty,
            rate,
            amount: qty * rate,
          };
        });

        const totalAmountNum = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

        const pickStr = (...vals) => {
          for (const v of vals) {
            const s = String(v || '').trim();
            if (s) return s;
          }
          return '';
        };

        const bankName = pickStr(first.bankName, first.bank, first.bankname);
        const bankBranch = pickStr(first.bankBranch, first.branch, first.bankbranch);
        const bankAddressHardcoded = '150 EAST 45TH STREET NEW YORK NY 10016 USA.';
        const accountNo = pickStr(first.accountNo, first.account, first.accountno);
        const iban = pickStr(first.iban, first.ifsc, first.routingNo, first.routing, first.swift, first.swiftCode);

        const transformed = {
          invoiceNo: first.invoiceNo || '',
          invoiceDate: fmtDate(first.invoiceDate),
          buyersOrder: first.pooo || '',
          exporterInvoiceNo: first.exporterInvoiceNo || '',
          exporterInvoiceDate: fmtDate(first.exporterInvoiceDate),
          buyerOther: first.customerName || '',
          countryOrigin: first.countryName || '',
          countryFinal: first.customerCountry || '',
    beneficiary: {
      name: 'A M S House',
      address:
        '84,Kokan Housing Society Alamgir Road - Postal Code: 74800 Karachi - Pakistan.',
      tel: 'Tel : (+92213) 485-3935 & 36  Toll Free:',
    },
    consignee: {
            name: first.cargoConsigneeName || '',
            address: first.cargoConsigneeAddress1 || '',
            city: first.cargoConsigneeCity || '',
            country: first.cargoConsigneeCountry || '',
    },
    exporter: {
            name: first.venderName || '',
            country: first.countryName || '',
    },
          vesselFlight: first.voyageFlight || '',
    placeOfReceipt: 'N/A',
          portOfLoading: first.portOfLoading || '',
          terms: first.terms || '',
          portOfDischarge: first.portOfDischarge || '',
          finalDestination: first.destination || '',
          rows,
          amountInWords: amountToWordsUSD(totalAmountNum),
    remarks: '',
          bankNote: bankName
            ? `Please make deposit the invoiced amount in the favour "${bankName} ACCOUNT"`
            : '',
    bankDetails: [
            accountNo ? `No. "${accountNo}", ${bankAddressHardcoded}` : (bankBranch || bankAddressHardcoded),
            iban ? `IFSC / Routing No. "${iban}" and please intimate the same to us.` : '',
          ].filter(Boolean),
        };

        if (isActive) setInvoiceData(transformed);
      } catch (e) {
        if (!isActive) return;
        setInvoiceData(null);
        setError(e?.message || 'Failed to fetch Rate Diff data.');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isActive = false;
    };
  }, [API_BASE_URL, id, shipment?.cargoid, shipment?.cargoID]);

  const contentRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1.2);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Rate_Diff_${invoiceData?.invoiceNo || id}`,
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

  const rows = invoiceData?.rows || [];

  const totalQuantity = rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const totalAmount = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  // Match old printed alignment: tighter lines + safe wrapping inside boxes
  const labelStyle = { fontSize: 10, color: '#000', fontWeight: 600, lineHeight: 1.2 };
  const valueStyle = {
    fontSize: 10,
    color: '#000',
    lineHeight: 1.2,
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  };
  const cellStyle = {
    fontSize: 9,
    py: 0.4,
    px: 0.6,
    border: '1px solid #000',
    color: '#000',
  };
  const headerCellStyle = { ...cellStyle, fontWeight: 700, backgroundColor: '#EDEDED', color: '#000' };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!invoiceData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No data found.</Alert>
      </Box>
    );
  }

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

          .rate-diff-table thead { display: table-header-group; }
          .rate-diff-table tbody tr { break-inside: avoid; page-break-inside: avoid; }
          .rate-diff-footer { break-inside: avoid; page-break-inside: avoid; }
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

            {/* Header block (match 1st image): Beneficiary (rowspan) + Invoice No/Date + Buyers Order in separate box */}
            <Box sx={{ border: '1px solid #000', mb: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
                {/* Left: Beneficiary spans two rows */}
                <Box sx={{ gridColumn: '1 / 2', gridRow: '1 / 3', borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Beneficiary</Typography>
                  <Typography sx={valueStyle}>{invoiceData.beneficiary.name}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.beneficiary.address}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.beneficiary.tel}</Typography>
                </Box>

                {/* Row 1: Invoice No / Invoice Date */}
                <Box sx={{ gridColumn: '2 / 3', gridRow: '1 / 2', borderRight: '1px solid #000', borderBottom: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Invoice No</Typography>
                  <Typography sx={valueStyle}>{invoiceData.invoiceNo}</Typography>
                </Box>
                <Box sx={{ gridColumn: '3 / 4', gridRow: '1 / 2', borderBottom: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Invoice Date</Typography>
                  <Typography sx={valueStyle}>{invoiceData.invoiceDate}</Typography>
                </Box>

                {/* Row 2: Buyers Order (separate boxed row spanning the right side) */}
                <Box sx={{ gridColumn: '2 / 4', gridRow: '2 / 3', p: 0.6 }}>
                  <Typography sx={labelStyle}>Buyer&apos;s Order No. &amp; Date</Typography>
                  <Typography sx={valueStyle}>{invoiceData.buyersOrder}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Combined block (match 1st image): left Consignee + Exporter stacked; right invoice/buyer/countries */}
            <Box sx={{ border: '1px solid #000', mb: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
                {/* Left: Consignee + Exporter (stacked) */}
                <Box sx={{ gridColumn: '1 / 2', gridRow: '1 / 3', borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Consignee</Typography>
                  <Typography sx={valueStyle}>{invoiceData.consignee.name}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.consignee.address}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.consignee.city}</Typography>
                  <Typography sx={valueStyle}>{invoiceData.consignee.country}</Typography>

                  <Box sx={{ borderTop: '1px solid #000', mt: 0.6, pt: 0.6 }}>
                    <Typography sx={labelStyle}>Exporter</Typography>
                    <Typography sx={valueStyle}>{invoiceData.exporter.name}</Typography>
                    <Typography sx={valueStyle}>{invoiceData.exporter.country}</Typography>
                  </Box>
                </Box>

                {/* Right top: Exporter invoice no/date */}
                <Box sx={{ gridColumn: '2 / 3', gridRow: '1 / 2', borderRight: '1px solid #000', borderBottom: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Exporter Invoice No</Typography>
                  <Typography sx={valueStyle}>{invoiceData.exporterInvoiceNo || '-'}</Typography>
                </Box>
                <Box sx={{ gridColumn: '3 / 4', gridRow: '1 / 2', borderBottom: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Exp Inv Date</Typography>
                  <Typography sx={valueStyle}>{invoiceData.exporterInvoiceDate}</Typography>
                </Box>

                {/* Right bottom: Buyer + Countries */}
                <Box sx={{ gridColumn: '2 / 4', gridRow: '2 / 3' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <Box sx={{ borderRight: '1px solid #000', p: 0.6 }}>
                      <Typography sx={labelStyle}>Buyer (if other than consignee)</Typography>
                      <Typography sx={valueStyle}>{invoiceData.buyerOther || '-'}</Typography>
                    </Box>
                    <Box sx={{ p: 0 }}>
                      <Box sx={{ p: 0.6 }}>
                        <Typography sx={labelStyle}>Country of Origin of Goods</Typography>
                        <Typography sx={valueStyle}>{invoiceData.countryOrigin}</Typography>
                      </Box>
                      <Box sx={{ borderTop: '1px solid #000', p: 0.6 }}>
                        <Typography sx={labelStyle}>Country of Final Destination</Typography>
                        <Typography sx={valueStyle}>{invoiceData.countryFinal}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Vessel/Flight block (match 1st image): Terms spans 2 rows; no empty cells */}
            <Box sx={{ border: '1px solid #000', mb: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <Box sx={{ gridColumn: '1 / 2', gridRow: '1 / 2', borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Vessel / Flight No</Typography>
                  <Typography sx={valueStyle}>{invoiceData.vesselFlight}</Typography>
                </Box>
                <Box sx={{ gridColumn: '2 / 3', gridRow: '1 / 2', borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Place of Receipt</Typography>
                  <Typography sx={valueStyle}>{invoiceData.placeOfReceipt}</Typography>
                </Box>
                <Box sx={{ gridColumn: '3 / 4', gridRow: '1 / 2', borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Port of Loading</Typography>
                  <Typography sx={valueStyle}>{invoiceData.portOfLoading}</Typography>
                </Box>

                {/* Right: Terms spans both rows */}
                <Box sx={{ gridColumn: '4 / 5', gridRow: '1 / 3', p: 0.6 }}>
                  <Typography sx={labelStyle}>Terms of Delivery & Payment</Typography>
                  <Typography sx={valueStyle}>{invoiceData.terms}</Typography>
                </Box>

                {/* Bottom row (left side only) */}
                <Box sx={{ gridColumn: '1 / 2', gridRow: '2 / 3', borderTop: '1px solid #000', borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Port of Discharge</Typography>
                  <Typography sx={valueStyle}>{invoiceData.portOfDischarge}</Typography>
                </Box>
                <Box sx={{ gridColumn: '2 / 4', gridRow: '2 / 3', borderTop: '1px solid #000', borderRight: '1px solid #000', p: 0.6 }}>
                  <Typography sx={labelStyle}>Final Destination</Typography>
                  <Typography sx={valueStyle}>{invoiceData.finalDestination}</Typography>
                </Box>
              </Box>
            </Box>

            <Table size="small" className="rate-diff-table" sx={{ width: '100%', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '42%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
              </colgroup>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>STYLE NO.</TableCell>
                  <TableCell sx={{ ...headerCellStyle, whiteSpace: 'nowrap' }}>ORDER NO.</TableCell>
                  <TableCell sx={headerCellStyle}>DESCRIPTION OF GOODS</TableCell>
                  <TableCell sx={headerCellStyle} align="right">QUANTITY NOS</TableCell>
                  <TableCell sx={headerCellStyle} align="right">RATE FOB USD</TableCell>
                  <TableCell sx={headerCellStyle} align="right">AMOUNT FOB USD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.styleNo}-${row.orderNo}-${row.quantity}-${row.rate}`}>
                    <TableCell sx={cellStyle}>{row.styleNo}</TableCell>
                    <TableCell sx={{ ...cellStyle, whiteSpace: 'nowrap' }}>{row.orderNo}</TableCell>
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
                  <TableCell sx={cellStyle} align="right">$ {formatNumber(totalAmount.toFixed(2))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Footer boxed layout (match 1st image) */}
            <Box className="rate-diff-footer" sx={{ border: '1px solid #000', borderTop: 'none' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr' }}>
                <Box sx={{ borderRight: '1px solid #000', p: 0.8 }}>
                  <Typography sx={{ fontSize: 8, fontWeight: 700 }}>Amount Chargeable</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.2 }}>
                    <Typography sx={{ fontSize: 8, fontWeight: 700 }}>(In Words)</Typography>
                    <Typography sx={{ fontSize: 8, fontWeight: 700 }}>{invoiceData.amountInWords}</Typography>
                  </Box>

            <Box sx={{ mt: 1 }}>
                    <Typography sx={{ fontSize: 8, fontWeight: 700 }}>Remarks:</Typography>
                    <Typography sx={{ fontSize: 8 }}>{invoiceData.remarks}</Typography>
                  </Box>
                  <Box sx={{ mt: 0.4 }}>
                    <Typography sx={{ fontSize: 8, fontWeight: 700 }}>CIN NO.</Typography>
            </Box>
                  <Box sx={{ mt: 0.4 }}>
                    <Typography sx={{ fontSize: 8, fontWeight: 700 }}>SERVICE TAX NO. :</Typography>
            </Box>

                  <Box sx={{ mt: 0.8 }}>
                    {invoiceData.bankNote ? (
                      <Typography sx={{ fontSize: 8 }}>{invoiceData.bankNote}</Typography>
                    ) : null}
                    {(invoiceData.bankDetails || []).map((t, idx) => (
                      <Typography key={idx} sx={{ fontSize: 8 }}>
                        {t}
              </Typography>
                    ))}
            </Box>
            </Box>

                <Box sx={{ p: 0.8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box sx={{ pt: 2 }}>
                    <Typography sx={{ fontSize: 8, fontWeight: 700, textAlign: 'center' }}>
                      for Apparel Merchandising Services,,
              </Typography>
            </Box>
                  <Box>
                    <Box sx={{ borderTop: '1px solid #000', pt: 0.4 }}>
                      <Typography sx={{ fontSize: 8, fontWeight: 700, textAlign: 'center' }}>
                Authorized Signatory
              </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

