import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  ZoomIn,
  ZoomOut,
  Download,
  Print,
  ArrowBack,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from 'src/utils/axios';

function pick(r, ...keys) {
  for (const k of keys) {
    if (r[k] != null && r[k] !== '') return r[k];
  }
  return '';
}

function formatNum(val) {
  if (val == null || val === '') return '0';
  const n = Number(String(val).replace(/,/g, ''));
  return Number.isNaN(n) ? String(val) : n.toLocaleString();
}

export default function ReceivedPackingListPDFPage() {
  const { containerNo: paramContainerNo } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const containerNo = paramContainerNo || location.state?.containerNo || '';

  const componentRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchReport = async () => {
      if (!containerNo) {
        if (active) {
          setError('Container No is missing');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/api/Container/GetReceivedPackingListReport', {
          params: { containerNo },
        });

        if (!active) return;

        const resData = response?.data ?? response;

        let rawHeader = {};
        let rawRows = [];
        let rawTotals = {};

        if (Array.isArray(resData)) {
          rawRows = resData;
        } else if (resData && typeof resData === 'object') {
          rawHeader = resData.header || resData.Header || resData.master || resData.Master || resData;
          rawRows =
            (Array.isArray(resData.data) && resData.data) ||
            (Array.isArray(resData.Data) && resData.Data) ||
            (Array.isArray(resData.rows) && resData.rows) ||
            (Array.isArray(resData.Rows) && resData.Rows) ||
            (Array.isArray(resData.details) && resData.details) ||
            (Array.isArray(resData.Details) && resData.Details) ||
            (Array.isArray(resData.items) && resData.items) ||
            (Array.isArray(resData.Items) && resData.Items) ||
            [];
          rawTotals = resData.totals || resData.Totals || resData.summary || resData.Summary || {};
        }

        if (rawRows.length === 0 && Array.isArray(rawHeader)) {
          rawRows = rawHeader;
        }

        const firstItem = rawRows[0] || {};

        const headerData = {
          containerNo:
            pick(rawHeader, 'containerNo', 'ContainerNo', 'autoNo', 'AutoNo') ||
            pick(firstItem, 'containerNo', 'ContainerNo', 'autoNo', 'AutoNo') ||
            containerNo,
          customer:
            pick(rawHeader, 'customer', 'Customer', 'customerName', 'CustomerName') ||
            pick(firstItem, 'customer', 'Customer', 'customerName', 'CustomerName') ||
            location.state?.customer ||
            '—',
          date:
            pick(rawHeader, 'date', 'Date', 'loadingDate', 'LoadingDate', 'reportDate', 'ReportDate') ||
            pick(firstItem, 'date', 'Date', 'loadingDate', 'LoadingDate') ||
            location.state?.loadingDate ||
            new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        };

        const mappedRows = rawRows.map((item) => {
          const it = item && typeof item === 'object' ? item : {};
          const cartonFrom = pick(it, 'cartonFrom', 'CartonFrom', 'cartonStart', 'CartonStart', 'startCarton', 'StartCarton', 'fromCarton', 'FromCarton');
          const cartonTo = pick(it, 'cartonTo', 'CartonTo', 'cartonEnd', 'CartonEnd', 'endCarton', 'EndCarton', 'toCarton', 'ToCarton');

          return {
            poNo: String(pick(it, 'poNo', 'PoNo', 'PONO', 'pono', 'poNumber', 'PONumber') || '—'),
            styleNo: String(pick(it, 'styleNo', 'StyleNo', 'style', 'Style', 'style#', 'Style#') || '—'),
            color: String(pick(it, 'color', 'Color', 'colorway', 'Colorway') || '—'),
            size: String(pick(it, 'size', 'Size') || '—'),
            quantity: Number(pick(it, 'quantity', 'Quantity', 'qty', 'Qty', 'poQuantity', 'POQuantity') || 0),
            perCartonPcs: Number(pick(it, 'perCartonPcs', 'PerCartonPcs', 'cartonPerPcs', 'CartonPerPcs', 'pcsPerCarton', 'PcsPerCarton') || 0),
            cartonFrom: cartonFrom !== '' ? cartonFrom : null,
            cartonTo: cartonTo !== '' ? cartonTo : null,
            cartonSeries: String(pick(it, 'cartonSeries', 'CartonSeries', 'cartonNo', 'CartonNo', 'carton#', 'Carton#') || (cartonFrom && cartonTo ? `${cartonFrom} - ${cartonTo}` : '—')),
            totalShipCarton: Number(pick(it, 'totalShipCarton', 'TotalShipCarton', 'shipCarton', 'ShipCarton', 'totalLoadedCartons', 'TotalLoadedCartons') || 0),
            totalReceivedCarton: Number(pick(it, 'totalReceivedCarton', 'TotalReceivedCarton', 'receivedCarton', 'ReceivedCarton', 'totalReceivedCartons', 'TotalReceivedCartons') || 0),
          };
        });

        const computedTotalQuantity =
          pick(rawTotals, 'totalQuantity', 'TotalQuantity') !== ''
            ? Number(pick(rawTotals, 'totalQuantity', 'TotalQuantity'))
            : mappedRows.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

        const computedTotalShipCarton =
          pick(rawTotals, 'totalShipCarton', 'TotalShipCarton') !== ''
            ? Number(pick(rawTotals, 'totalShipCarton', 'TotalShipCarton'))
            : mappedRows.reduce((acc, curr) => acc + (Number(curr.totalShipCarton) || 0), 0);

        const computedTotalReceivedCarton =
          pick(rawTotals, 'totalReceivedCarton', 'TotalReceivedCarton') !== ''
            ? Number(pick(rawTotals, 'totalReceivedCarton', 'TotalReceivedCarton'))
            : mappedRows.reduce((acc, curr) => acc + (Number(curr.totalReceivedCarton) || 0), 0);

        setReportData({
          header: headerData,
          rows: mappedRows,
          totals: {
            totalQuantity: computedTotalQuantity,
            totalShipCarton: computedTotalShipCarton,
            totalReceivedCarton: computedTotalReceivedCarton,
          },
        });
      } catch (err) {
        if (!active) return;
        console.error('Error fetching received packing list report:', err);
        const msg =
          (typeof err?.response?.data === 'string' && err.response.data) ||
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          'Failed to load received packing list report';
        setError(typeof msg === 'string' ? msg : 'Failed to load received packing list report');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReport();

    return () => {
      active = false;
    };
  }, [containerNo, location.state]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 5mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  const handleDownloadPDF = async () => {
    const element = componentRef.current;
    if (!element) return;
    const originalTransform = element.style.transform;
    const originalTransition = element.style.transition;

    try {
      element.style.transform = 'scale(1)';
      element.style.transition = 'none';

      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const scale = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const finalWidth = canvas.width * scale;
      const finalHeight = canvas.height * scale;
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`Received_Packing_List_${containerNo || 'Report'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      element.style.transform = originalTransform;
      element.style.transition = originalTransition;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, height: '100vh', backgroundColor: '#f5f5f5' }}>
        <IconButton size="small" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          <ArrowBack />
        </IconButton>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const { header = {}, rows = [], totals = {} } = reportData || {};

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
      {/* Top Application Viewer Header matching PurchaseOrderPDF */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: '#3C3C3C',
          color: '#fff',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: 'none',
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: '48px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <IconButton
              size="small"
              onClick={() => navigate(-1)}
              sx={{ color: '#fff', mr: 1 }}
              title="Back"
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              Received Packing List — {header.containerNo || containerNo}
            </Typography>
            <Typography sx={{ fontSize: '12px', ml: 2 }}>1 / 1</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#fff' }}>
              <ZoomOut fontSize="small" />
            </IconButton>
            <Typography sx={{ fontSize: '12px', mx: 1, minWidth: '40px', textAlign: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#fff' }}>
              <ZoomIn fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 0.5 }}>
            <IconButton size="small" onClick={handleDownloadPDF} sx={{ color: '#fff' }} title="Download PDF">
              <Download fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handlePrint} sx={{ color: '#fff' }} title="Print">
              <Print fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Scrollable Canvas Area matching PurchaseOrderPDF */}
      <Box
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          padding: 3,
          backgroundColor: '#282828',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <Box
          ref={componentRef}
          sx={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-in-out',
            width: '297mm', // A4 Landscape width
            minHeight: '210mm', // A4 Landscape height
            backgroundColor: '#FFFFFF',
            color: '#000000',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            p: '8mm 12mm',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Arial, sans-serif',
            '@media print': {
              transform: 'none !important',
              boxShadow: 'none',
              p: '5mm',
              m: 0,
              width: '100%',
              minHeight: '100%',
            },
          }}
        >
          {/* Header Section */}
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.3px', mb: 0.5 }}>
              ALL SEASONS TEXTILE
            </Typography>
            <Typography sx={{ fontSize: '10px', color: '#111', lineHeight: 1.35 }}>
              1441 BROADWAY, SUITE # 6162 NEW YORK , NY 10018
            </Typography>
            <Typography sx={{ fontSize: '10px', color: '#111', lineHeight: 1.35 }}>
              NEW YORK, USA
            </Typography>
          </Box>

          {/* Title and Date Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', my: 1.5 }}>
            <Typography sx={{ fontSize: '15px', fontWeight: 'bold', color: '#195B88' }}>
              Received Packing List
            </Typography>
            <Typography sx={{ fontSize: '11px' }}>
              Date:&nbsp;&nbsp;<strong>{header.date || '—'}</strong>
            </Typography>
          </Box>

          {/* Container & Customer Info */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography sx={{ width: '120px', fontSize: '11px', fontWeight: 'bold' }}>
                Container No :
              </Typography>
              <Typography sx={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {header.containerNo || '—'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ width: '120px', fontSize: '11px', fontWeight: 'bold' }}>
                Customer :
              </Typography>
              <Typography sx={{ fontSize: '11px', textTransform: 'uppercase' }}>
                {header.customer || '—'}
              </Typography>
            </Box>
          </Box>

          {/* Packing List Table */}
          <Box
            component="table"
            sx={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #000',
              mt: 1,
              '& th, & td': {
                border: '1px solid #000',
                padding: '4px 6px',
                fontSize: '9px',
                textAlign: 'center',
              },
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#8E9DAE', color: '#000', height: '28px' }}>
                <th style={{ width: '12%', fontWeight: 'bold' }}>PO#</th>
                <th style={{ width: '10%', fontWeight: 'bold' }}>STYLE#</th>
                <th style={{ width: '18%', fontWeight: 'bold' }}>COLOR</th>
                <th style={{ width: '10%', fontWeight: 'bold' }}>SIZE</th>
                <th style={{ width: '9%', fontWeight: 'bold' }}>QUANTITY</th>
                <th style={{ width: '11%', fontWeight: 'bold' }}>PER CARTON PCS</th>
                <th style={{ width: '12%', fontWeight: 'bold' }}>CARTON #</th>
                <th style={{ width: '9%', fontWeight: 'bold' }}>TOTAL SHIP CARTON</th>
                <th style={{ width: '9%', fontWeight: 'bold' }}>TOTAL RECEIVED CARTON</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, idx) => (
                  <tr key={idx} style={{ height: '22px' }}>
                    <td>{row.poNo || '—'}</td>
                    <td>{row.styleNo || '—'}</td>
                    <td>{row.color || '—'}</td>
                    <td>{row.size || '—'}</td>
                    <td>{formatNum(row.quantity)}</td>
                    <td>{formatNum(row.perCartonPcs)}</td>
                    <td>
                      {row.cartonFrom != null && row.cartonTo != null ? (
                        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                          <span>{row.cartonFrom}</span>
                          <span>{row.cartonTo}</span>
                        </div>
                      ) : (
                        row.cartonSeries || '—'
                      )}
                    </td>
                    <td>{formatNum(row.totalShipCarton)}</td>
                    <td>{formatNum(row.totalReceivedCarton)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: '16px', color: '#777' }}>
                    No packing list data found
                  </td>
                </tr>
              )}
              {/* Total Row */}
              <tr style={{ height: '24px', fontWeight: 'bold' }}>
                <td colSpan={4} style={{ textAlign: 'right', paddingRight: '12px' }}>
                  TOTAL ------------&gt;
                </td>
                <td />
                <td />
                <td />
                <td>{formatNum(totals.totalShipCarton)}</td>
                <td>{formatNum(totals.totalReceivedCarton)}</td>
              </tr>
            </tbody>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
