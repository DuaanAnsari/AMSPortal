import React, { useEffect, useRef, useState } from 'react';
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

export default function InspectionCertificatePage() {
  const { state } = useLocation();
  const { id } = useParams();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SHIPMENT_DETAIL_API = `${API_BASE_URL}/api/ShipmentRelease/GetShipment`;

  const [shipment, setShipment] = useState(state?.shipment || null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supplierMap, setSupplierMap] = useState({});

  const normalizeSupplierId = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    return Number.isNaN(num) ? String(value).trim() : String(num);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchShipment = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${SHIPMENT_DETAIL_API}/${id}`, { headers });
        if (!res.ok) {
          throw new Error('Failed to fetch inspection data');
        }
        const responseData = await res.json();
        // console.log('GetShipment response', responseData);
        const primaryData = Array.isArray(responseData) ? responseData[0] : responseData;
        if (!isMounted) return;
        setShipment(primaryData || {});

        const details = Array.isArray(primaryData?.details) ? primaryData.details : [];
        if (details.length) {
          const mappedItems = details.map((row) => ({
            poNo: row.pono || row.poNo || '',
            styleNo: row.styles || row.styleNo || '',
            itemDescription:
              row.itemDescriptionInvoice ||
              row.itemDescriptionShippingInvoice ||
              row.itemDescription ||
              '',
            qtyPcs: row.quantity ?? '',
            qtyCtns: row.cartons ?? '',
          }));
          setItems(aggregateItemsByPo(mappedItems));
        } else if (Array.isArray(primaryData?.items)) {
          setItems(aggregateItemsByPo(primaryData.items));
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load inspection data');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchShipment();
    return () => {
      isMounted = false;
    };
  }, [SHIPMENT_DETAIL_API, id, state?.shipment]);

  useEffect(() => {
    let isMounted = true;
    const fetchSuppliers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE_URL}/api/MyOrders/GetSupplier`, { headers });
        if (!res.ok) {
          throw new Error('Failed to fetch suppliers');
        }
        const data = await res.json();
        // console.log('GetSupplier response', data);
        const rowsRaw = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.result)
              ? data.result
              : Array.isArray(data?.items)
                ? data.items
                : data
                  ? [data]
                  : [];
        const rows = Array.isArray(rowsRaw) ? rowsRaw : [];
        const nextMap = rows.reduce((acc, row) => {
          const key = row?.venderLibraryID ?? row?.supplierID ?? row?.id;
          const normalizedKey = normalizeSupplierId(key);
          if (normalizedKey) {
            acc[normalizedKey] = row?.venderName || '';
          }
          return acc;
        }, {});
        if (isMounted) {
          setSupplierMap(nextMap);
        }
      } catch (err) {
        console.warn('Supplier fetch failed', err);
      }
    };

    fetchSuppliers();
    return () => {
      isMounted = false;
    };
  }, [API_BASE_URL]);

  const safeDate = (val) => {
    if (!val) return '-';
    if (typeof val === 'string' && val.includes('T')) {
      return val.split('T')[0];
    }
    return val;
  };

  const displayShipment = shipment || {};

  const resolveSupplierId = (data) => {
    const directId =
      data?.vendorID ??
      data?.vendorId ??
      data?.supplierID ??
      data?.supplierId;
    if (directId !== undefined && directId !== null && directId !== '') {
      return directId;
    }
    const details = Array.isArray(data?.details) ? data.details : [];
    const detailRow = details.find(
      (row) => row?.supplierID !== undefined && row?.supplierID !== null && row?.supplierID !== ''
    );
    if (detailRow) return detailRow.supplierID;
    const detailRowAlt = details.find(
      (row) => row?.supplierId !== undefined && row?.supplierId !== null && row?.supplierId !== ''
    );
    return detailRowAlt?.supplierId ?? '';
  };

  const aggregateItemsByPo = (rows = []) => {
    const map = new Map();
    rows.forEach((row) => {
      const key = (row.poNo ?? '').toString().trim();
      if (!key) return;
      const existing = map.get(key);
      const qtyPcs = Number(row.qtyPcs) || 0;
      const qtyCtns = Number(row.qtyCtns) || 0;
      if (existing) {
        existing.qtyPcs = (Number(existing.qtyPcs) || 0) + qtyPcs;
        existing.qtyCtns = (Number(existing.qtyCtns) || 0) + qtyCtns;
      } else {
        map.set(key, { ...row, qtyPcs, qtyCtns });
      }
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    if (!state?.shipment) return;
    setShipment(state.shipment);
    const details = Array.isArray(state.shipment?.details) ? state.shipment.details : [];
    if (details.length) {
      const mappedItems = details.map((row) => ({
        poNo: row.pono || row.poNo || '',
        styleNo: row.styles || row.styleNo || '',
        itemDescription:
          row.itemDescriptionInvoice ||
          row.itemDescriptionShippingInvoice ||
          row.itemDescription ||
          '',
        qtyPcs: row.quantity ?? '',
        qtyCtns: row.cartons ?? '',
      }));
      setItems(aggregateItemsByPo(mappedItems));
    } else if (Array.isArray(state.shipment?.items)) {
      setItems(aggregateItemsByPo(state.shipment.items));
    }
  }, [state?.shipment]);

  // Calculate totals
  const totalPcs = items.reduce((sum, item) => sum + (Number(item.qtyPcs) || 0), 0);
  const totalCtns = items.reduce((sum, item) => sum + (Number(item.qtyCtns) || 0), 0);
  const formatQty = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value ?? '';
    return num.toLocaleString();
  };

  const contentRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1.2);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Inspection_Certificate_${id}`,
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

      pdf.save(`Inspection_Certificate_${id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      element.style.transform = originalTransform;
      element.style.transition = originalTransition;
    }
  };

  // Common text styles
  const labelStyle = { fontSize: 12, color: '#000', fontWeight: 600 };
  const valueStyle = { fontSize: 12, color: '#000' };

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
              Inspection Certificate - {displayShipment.invoiceNo || id}
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

          {/* Right: download + print */}
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
          {loading ? (
            <Typography sx={{ color: '#fff', fontSize: 14 }}>Loading...</Typography>
          ) : error ? (
            <Typography sx={{ color: '#ff6b6b', fontSize: 14 }}>{error}</Typography>
          ) : (
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
                <Typography sx={{ fontSize: 10, color: '#000', mt: 0.5 }}>
                  A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800
                </Typography>
                <Typography sx={{ fontSize: 10, color: '#000' }}>
                  Karachi - Pakistan. &nbsp;&nbsp;&nbsp;&nbsp; Telephone # : (+92213) 485-3935 & 36
                </Typography>
              </Box>
            </Box>

            {/* Center heading */}
            <Typography
              align="center"
              sx={{
                fontSize: 22,
                fontWeight: 700,
                color: '#000',
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
              <Typography sx={{ ...valueStyle, ml: 1, color: '#000', fontWeight: 600 }}>
                {displayShipment.icNo ||
                  displayShipment.amsicNo ||
                  displayShipment.amsicno ||
                  displayShipment.amsICNo ||
                  displayShipment.AMSICNo ||
                  '-'}
              </Typography>
            </Box>

            {/* Intro text */}
            <Typography sx={{ fontSize: 11, mb: 2, lineHeight: 1.5, color: '#000' }}>
              This is to certify that the <b>GOODS</b> have been <b style={{ color: '#000' }}>INSPECTED</b> randomly following AQL level defined as per the product by <b style={{ color: '#000' }}>AMS</b> and <b style={{ color: '#000' }}>FOUND SATISFACTORY</b> under the terms of the <b style={{ color: '#000' }}>ORDER</b> as detailed below.
            </Typography>

            {/* Two column layout for metadata */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {/* Left column */}
              <Box>
                <MetaRow
                  label="I.C Issue Date"
                  value={safeDate(displayShipment.creationDate || displayShipment.icIssueDate)}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
                <MetaRow
                  label="Buyer"
                  value={
                    displayShipment.cargoConsigneeName ||
                    displayShipment.cargoConsigneeNAME ||
                    displayShipment.cargoConsignee ||
                    displayShipment.customer ||
                    displayShipment.customerName ||
                    '-'
                  }
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
                <MetaRow
                  label="Vendor"
                  value={
                    supplierMap[normalizeSupplierId(resolveSupplierId(displayShipment))] || '-'
                  }
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
                <MetaRow
                  label="Invoice #"
                  value={displayShipment.invoiceNo || '-'}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
              </Box>
              {/* Right column */}
              <Box>
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for I.C Issue Date */}
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for Buyer */}
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for Vendor */}
                <MetaRow
                  label="Invoice Date"
                  value={safeDate(displayShipment.invoiceDate)}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
                <MetaRow
                  label="Terms"
                  value={displayShipment.terms || 'FOB'}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
              </Box>
            </Box>

            {/* Mode / carrier / voyage / BL / ship date / container - Two columns */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {/* Left column */}
              <Box>
                <MetaRow
                  label="Mode"
                  value={displayShipment.mode || displayShipment.deliveryTypeName || 'BY SEA'}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
                <MetaRow
                  label="Carrier Name"
                  value={displayShipment.carrierName || '-'}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
                <MetaRow
                  label="Voyage / Flight"
                  value={displayShipment.voyageFlight || displayShipment.voyage || '-'}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
                <MetaRow
                  label="BL / AWBL"
                  value={displayShipment.billNo || displayShipment.blAwb || '-'}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
                <MetaRow
                  label="Ship Date"
                  value={safeDate(displayShipment.shipmentDate || displayShipment.shipDate)}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
              </Box>
              {/* Right column */}
              <Box>
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for Mode */}
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for Carrier Name */}
                <Box sx={{ height: '1.5em' }} /> {/* Empty space for Voyage / Flight */}
                <MetaRow
                  label="Container #"
                  value={displayShipment.containerNo || '-'}
                  labelStyle={labelStyle}
                  valueStyle={valueStyle}
                />
              </Box>
            </Box>

            {/* Items table */}
            <Table
              size="small"
              sx={{
                mb: 2,
                '& th, & td': {
                  border: '1px solid #ccc',
                  fontSize: 12,
                  py: 0.75,
                  px: 1,
                },
              }}
            >
              <TableHead>
                <TableRow sx={{ backgroundColor: '#fff' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#000', width: 100 }}>PO #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#000', width: 80 }}>Style #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#000' }}>Item Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#000', width: 80 }} align="right">
                    QTY (Pcs)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#000', width: 80 }} align="right">
                    QTY (Ctns)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.poNo}</TableCell>
                    <TableCell>{item.styleNo}</TableCell>
                    <TableCell sx={{ color: '#000' }}>{item.itemDescription}</TableCell>
                    <TableCell align="right">{formatQty(item.qtyPcs)}</TableCell>
                    <TableCell align="right">{formatQty(item.qtyCtns)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell />
                  <TableCell />
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatQty(totalPcs)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatQty(totalCtns)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Horizontal line before footer */}
            <Box sx={{ borderTop: '1px solid #000', mb: 2, mt: 4 }} />

            {/* Footer note */}
            <Typography sx={{ fontSize: 11, mb: 6, lineHeight: 1.6, color: '#000' }}>
              We have inspected the <b style={{ color: '#000' }}>GOODS RANDOMLY</b> and <b style={{ color: '#000' }}>ALLOWED</b> to <b style={{ color: '#000' }}>SHIP</b> while holding <b style={{ color: '#000', textDecoration: 'underline' }}>SHIPPER FULLY RESPONSIBLE</b> for <b style={{ color: '#000' }}>ANY CLAIM</b> that may <b style={{ color: '#000' }}>ARISE</b> from <b style={{ color: '#000' }}>EVENTUAL BUYERS</b>, the shipper keeps the <b style={{ color: '#000' }}>AGENCY</b> fully indemnified, against any losses or claim.
            </Typography>

            {/* Signature */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#000', mb: 6 }}>
                Apparel Merchandising Services
              </Typography>
              <Box sx={{ borderTop: '1px solid #000', display: 'inline-block', minWidth: 200, pt: 1 }}>
                <Typography sx={{ fontSize: 12 }}>Authorized Signature</Typography>
              </Box>
            </Box>
          </Paper>
          )}
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

