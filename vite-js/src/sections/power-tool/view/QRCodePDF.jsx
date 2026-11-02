import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PropTypes from 'prop-types';

import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
} from '@mui/material';
import {
  ArrowBack,
  ZoomIn,
  ZoomOut,
  Download,
  Print,
} from '@mui/icons-material';

// ----------------------------------------------------------------------

const QR_BOX_SIZE = 130; // Size in px of center QR image

function sniffBase64Mime(raw) {
  const s = String(raw || '').trim();
  if (s.startsWith('/9j/')) return 'image/jpeg';
  if (s.startsWith('iVBOR')) return 'image/png';
  if (s.startsWith('R0lGOD')) return 'image/gif';
  if (s.startsWith('UklGR')) return 'image/webp';
  if (s.startsWith('Qk')) return 'image/bmp';
  return 'image/png';
}

function normalizeQrDataUrl(raw) {
  if (raw == null || raw === '' || raw === '0x') return '';
  let s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  s = s.replace(/^"+|"+$/g, '').trim();
  if (!s) return '';
  if (/^data:image\//i.test(s)) return s;
  if (s.startsWith('blob:') || /^https?:\/\//i.test(s)) return s;

  const clean = s.replace(/\s+/g, '');
  const mime = sniffBase64Mime(clean);
  return `data:${mime};base64,${clean}`;
}

// ----------------------------------------------------------------------

function SingleQrLabel({ label }) {
  const {
    size = '',
    style = '',
    pono = '',
    colorName = '',
    qrDataUrl = '',
  } = label;

  // Exact 4 sides mapping:
  // TOP: size
  const topSize = size;
  // BOTTOM: style
  const bottomStyle = style;
  // LEFT: pono (rotated, partial/truncated)
  const leftPono = pono;
  // RIGHT: colorName (rotated)
  const rightColor = colorName;

  return (
    <Box className="qr-pdf-label-card">
      {/* 1. TOP: size */}
      <Box className="qr-pdf-top-size">
        <Typography component="span" className="qr-pdf-top-text">
          {topSize || '—'}
        </Typography>
      </Box>

      {/* 2. MIDDLE AREA: Left (pono), Center (QR Image), Right (colorName) */}
      <Box className="qr-pdf-middle-row">
        {/* LEFT: pono (Rotated, partial/truncated) */}
        <Box className="qr-pdf-side-left">
          <Box className="qr-pdf-rotated-pod" title={leftPono}>
            {leftPono}
          </Box>
        </Box>

        {/* CENTER: Actual QR Code Image */}
        <Box className="qr-pdf-center-qr">
          {qrDataUrl ? (
            <Box
              component="img"
              src={qrDataUrl}
              alt="Carton QR Code"
              className="qr-pdf-img"
            />
          ) : null}
        </Box>

        {/* RIGHT: colorName (Rotated) */}
        <Box className="qr-pdf-side-right">
          <Box className="qr-pdf-rotated-color" title={rightColor}>
            {rightColor}
          </Box>
        </Box>
      </Box>

      {/* 3. BOTTOM: style */}
      <Box className="qr-pdf-bottom-style">
        <Typography component="span" className="qr-pdf-bottom-text">
          {bottomStyle || '—'}
        </Typography>
      </Box>
    </Box>
  );
}

SingleQrLabel.propTypes = {
  label: PropTypes.shape({
    size: PropTypes.string,
    style: PropTypes.string,
    pono: PropTypes.string,
    colorName: PropTypes.string,
    qrDataUrl: PropTypes.string,
  }).isRequired,
};

// ----------------------------------------------------------------------

const LABELS_PER_PAGE = 24; // 4 columns x 6 rows on A4 Portrait

function chunkArray(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

// ----------------------------------------------------------------------

export default function QRCodePDF() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateData = location.state || {};
  const rawLabels = useMemo(() => {
    if (Array.isArray(stateData.labels)) return stateData.labels;
    return [];
  }, [stateData.labels]);

  const poNoTitle = stateData.poNo || 'QR Code';
  const customerName = stateData.customerName || '';

  // Ensure every label's qrDataUrl is properly formatted
  const labels = useMemo(
    () =>
      rawLabels.map((l) => ({
        ...l,
        qrDataUrl: normalizeQrDataUrl(l.qrDataUrl || l.qrImgBase64 || l.qrImageBase64),
      })),
    [rawLabels]
  );

  const pages = useMemo(() => chunkArray(labels, LABELS_PER_PAGE), [labels]);

  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const previewRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Track currently visible page
  useEffect(() => {
    const root = scrollContainerRef.current;
    const container = previewRef.current;
    if (!root || !container) return;

    const pageEls = Array.from(container.querySelectorAll('.qr-pdf-page-sheet'));
    if (!pageEls.length) return;

    pageEls.forEach((el, idx) => {
      el.dataset.pageIndex = String(idx + 1);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!visible?.target) return;
        const idx = Number(visible.target.dataset.pageIndex);
        if (Number.isFinite(idx) && idx >= 1) setCurrentPage(idx);
      },
      { root, threshold: [0.15, 0.4, 0.7] }
    );

    pageEls.forEach((p) => observer.observe(p));
    return () => observer.disconnect();
  }, [pages]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(Number((prev + 0.1).toFixed(1)), 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(Number((prev - 0.1).toFixed(1)), 0.5));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const container = previewRef.current;
    if (!container) return;

    const pageSheets = container.querySelectorAll('.qr-pdf-page-sheet');
    if (!pageSheets.length) return;

    const originalTransform = container.style.transform;
    const originalTransition = container.style.transition;

    try {
      container.style.transform = 'scale(1)';
      container.style.transition = 'none';

      // eslint-disable-next-line new-cap
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageSheets.length; i += 1) {
        const sheet = pageSheets[i];
        const canvas = await html2canvas(sheet, {
          backgroundColor: '#FFFFFF',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });

        if (i > 0) pdf.addPage();
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
      }

      const safeName = String(poNoTitle).replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`QRCode_${safeName}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      container.style.transform = originalTransform;
      container.style.transition = originalTransition;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <Helmet>
        <title>QR Code — {poNoTitle}</title>
      </Helmet>

      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#282828',
        }}
      >
        {/* PDF Viewer Header matching PurchaseOrderPDF */}
        <AppBar
          position="static"
          sx={{
            backgroundColor: '#3C3C3C',
            color: '#fff',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'none',
          }}
        >
          <Toolbar variant="dense" sx={{ minHeight: '48px !important', px: 2 }}>
            {/* Left: Back Button + Title + Page Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <IconButton
                size="small"
                onClick={handleBack}
                sx={{ color: '#fff', mr: 1 }}
                title="Back to QR Code Entry"
              >
                <ArrowBack fontSize="small" />
              </IconButton>
              <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                QR Code — {poNoTitle}
              </Typography>
              <Typography sx={{ fontSize: '12px', ml: 2, color: 'rgba(255, 255, 255, 0.85)' }}>
                {pages.length > 0 ? `${currentPage}/${pages.length}` : '0/0'}
              </Typography>
            </Box>

            {/* Center: Zoom Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#fff' }} title="Zoom Out">
                <ZoomOut fontSize="small" />
              </IconButton>
              <Typography sx={{ fontSize: '12px', color: '#fff', mx: 1, minWidth: '40px', textAlign: 'center' }}>
                {Math.round(zoomLevel * 100)}%
              </Typography>
              <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#fff' }} title="Zoom In">
                <ZoomIn fontSize="small" />
              </IconButton>
            </Box>

            {/* Right: Download + Print Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleDownload}
                disabled={!labels.length}
                sx={{ color: '#fff' }}
                title="Download PDF"
              >
                <Download fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handlePrint}
                disabled={!labels.length}
                sx={{ color: '#fff' }}
                title="Print"
              >
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
            p: 3,
            backgroundColor: '#282828',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <Box
            ref={previewRef}
            className="qr-pdf-preview-canvas"
            sx={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              '@media print': {
                transform: 'none !important',
                display: 'block',
              },
            }}
          >
            {labels.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 8, color: '#fff' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No QR Label Data Found
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
                  Please return to the QR Code Entry page and generate QR codes for a PO first.
                </Typography>
                <Button variant="contained" onClick={handleBack} sx={{ backgroundColor: '#1E293B' }}>
                  Back to QR Code Entry
                </Button>
              </Box>
            ) : (
              pages.map((pageLabels, pageIdx) => (
                <Box
                  key={pageIdx}
                  className="qr-pdf-page-sheet"
                  sx={{
                    width: '210mm',
                    minHeight: '297mm',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                    p: '10mm 10mm',
                    mb: 3,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    '@media print': {
                      boxShadow: 'none',
                      mb: 0,
                      width: '210mm !important',
                      minHeight: '297mm !important',
                      pageBreakAfter: 'always',
                    },
                  }}
                >
                  {/* Sheet Top Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      borderBottom: '1px solid #DFE3E8',
                      pb: 1,
                      mb: 2,
                    }}
                  >
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                      QR Code — {poNoTitle}
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#637381' }}>
                      {customerName ? `${customerName}  |  ` : ''}Page {pageIdx + 1} of {pages.length}
                    </Typography>
                  </Box>

                  {/* 4 columns x 6 rows Fixed Grid: Each cell is identically sized regardless of label count */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 44.5mm)',
                      gridTemplateRows: 'repeat(6, 42.5mm)',
                      gap: '4mm',
                      justifyContent: 'flex-start',
                      alignContent: 'flex-start',
                      flex: 1,
                    }}
                  >
                    {pageLabels.map((label, labelIdx) => (
                      <SingleQrLabel key={`${pageIdx}-${labelIdx}`} label={label} />
                    ))}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      {/* Embedded CSS for Exact QR 4-Sides Layout & Print Mode */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        .qr-pdf-label-card {
          width: 44.5mm !important;
          height: 42.5mm !important;
          max-width: 44.5mm !important;
          max-height: 42.5mm !important;
          border: 1px solid #000000;
          box-sizing: border-box;
          padding: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }

        .qr-pdf-top-size {
          width: 100%;
          text-align: center;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          line-height: 1.2;
          padding: 2px 0;
        }

        .qr-pdf-top-text {
          font-family: Arial, sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #000000;
          letter-spacing: 0.5px;
        }

        .qr-pdf-middle-row {
          width: 100%;
          flex: 1;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          margin: 2px 0;
        }

        .qr-pdf-side-left,
        .qr-pdf-side-right {
          width: 24px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
        }

        .qr-pdf-rotated-pod,
        .qr-pdf-rotated-color {
          transform: rotate(-90deg);
          white-space: nowrap;
          font-family: Arial, sans-serif;
          font-weight: 700;
          font-size: 10px;
          color: #000000;
          text-align: center;
        }

        .qr-pdf-center-qr {
          flex: 1;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          box-sizing: border-box;
        }

        .qr-pdf-img {
          width: ${QR_BOX_SIZE}px;
          height: ${QR_BOX_SIZE}px;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          display: block;
        }

        .qr-pdf-bottom-style {
          width: 100%;
          text-align: center;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          line-height: 1.2;
          padding: 2px 0;
        }

        .qr-pdf-bottom-text {
          font-family: Arial, sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #000000;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .qr-pdf-preview-canvas,
          .qr-pdf-preview-canvas * {
            visibility: visible;
          }
          .qr-pdf-preview-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            transform: none !important;
          }
          .qr-pdf-page-sheet {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm !important;
            page-break-after: always;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}
