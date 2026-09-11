import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import PropTypes from 'prop-types';

import { Box, Typography, AppBar, Toolbar, IconButton } from '@mui/material';
import {
  ArrowBack,
  ZoomIn,
  ZoomOut,
  Download,
  Print,
} from '@mui/icons-material';

const QR_SIZE = 162;

const cartonPropType = PropTypes.shape({
  colorCode: PropTypes.string,
  country: PropTypes.string,
  customerName: PropTypes.string,
  gw: PropTypes.string,
  itemDescription: PropTypes.string,
  nw: PropTypes.string,
  poNo: PropTypes.string,
  quantity: PropTypes.string,
  size: PropTypes.string,
  solid: PropTypes.string,
  style: PropTypes.string,
  vendorCode: PropTypes.string,
});

function HeaderCell({ label, value }) {
  return (
    <Box className="carton-pdf-header-cell">
      <Box component="span" className="carton-pdf-header-label">{label}</Box>
      <Box component="strong" className="carton-pdf-header-value">{value}</Box>
    </Box>
  );
}

HeaderCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

function QrArea({ carton, qrDataUrl }) {
  const colorText = carton.colorCode || '';
  const isLongColor = colorText.length > 20;
  const isLongSize = String(carton.size || '').length > 8;

  return (
    <Box className="carton-pdf-qr-area">
      <Box className="carton-pdf-side-zone carton-pdf-side-zone-left">
        <Box className="carton-pdf-rotated-text">{carton.poNo}</Box>
      </Box>
      <Box className="carton-pdf-side-zone carton-pdf-side-zone-right">
        <Box
          className="carton-pdf-rotated-text"
          sx={{
            fontSize: isLongColor ? '11px !important' : '16px !important',
            fontWeight: 700,
          }}
        >
          {colorText}
        </Box>
      </Box>
      <Box
        className="carton-pdf-size"
        sx={{
          fontSize: isLongSize ? '11px !important' : '13px !important',
          top: carton.ration ? `calc(50% - ${QR_SIZE / 2 + 34}px) !important` : `calc(50% - ${QR_SIZE / 2 + 22}px) !important`,
          lineHeight: 1.15,
        }}
      >
        <Box component="div">{carton.size}</Box>
        {carton.ration && (
          <Box component="div" sx={{ fontSize: '11px !important', fontWeight: 600 }}>
            {carton.ration}
          </Box>
        )}
      </Box>
      {qrDataUrl && <Box component="img" src={qrDataUrl} alt="Carton QR code" className="carton-pdf-qr" />}
      <Box className="carton-pdf-style" sx={{ fontSize: '13px !important' }}>{carton.style}</Box>
    </Box>
  );
}

QrArea.propTypes = {
  carton: cartonPropType.isRequired,
  qrDataUrl: PropTypes.string,
};

function getDynamicFontSize(text, defaultSize = 16, minSize = 11) {
  const len = String(text || '').length;
  if (len > 25) return `${minSize}px`;
  if (len > 14) return `${minSize + 1.5}px`;
  if (len > 8) return `${minSize + 3}px`;
  return `${defaultSize}px`;
}

function InfoCells({ carton }) {
  const colorCode = carton.colorCode || '';
  const qty = carton.quantity || '';
  const qtyDisplay = /pcs|set|pk/i.test(qty) ? qty : `${qty} PCS`.trim();

  const colorFontSize = getDynamicFontSize(colorCode, 15, 11);
  const sizeFontSize = getDynamicFontSize(carton.size, 16, 11);

  return (
    <Box className="carton-pdf-info-cells">
      <Box className="carton-pdf-cell-color">
        <small>COLOR CODE</small>
        <strong style={{ fontSize: colorFontSize, lineHeight: 1.15 }}>{colorCode}</strong>
      </Box>
      <Box className="carton-pdf-cell-size">
        <small>SIZE</small>
        <strong style={{ fontSize: sizeFontSize, lineHeight: 1.15 }}>{carton.size}</strong>
      </Box>
      <Box className="carton-pdf-cell-solid">
        <small>{carton.solid || 'Solid'}</small>
        <strong>{carton.ration || carton.solid}</strong>
      </Box>
      <Box className="carton-pdf-cell-qty">
        <small>QUANTITY</small>
        <strong>{qtyDisplay}</strong>
      </Box>
      <Box className="carton-pdf-weights">
        <strong>GW : {carton.gw} KG</strong>
        <strong>NW : {carton.nw} KG</strong>
      </Box>
    </Box>
  );
}

InfoCells.propTypes = { carton: cartonPropType.isRequired };

function SideStrip({ carton }) {
  return (
    <Box className="carton-pdf-side-strip">
      <Box className="carton-pdf-side-cell">
        <Box component="small" className="carton-pdf-side-label">VENDOR CODE</Box>
        <Box component="strong" className="carton-pdf-side-value">{carton.vendorCode}</Box>
      </Box>
      <Box className="carton-pdf-side-cell">
        <Box component="small" className="carton-pdf-side-label">CUSTOMER NAME</Box>
        <Box component="strong" className="carton-pdf-side-value">{carton.customerName}</Box>
      </Box>
    </Box>
  );
}

SideStrip.propTypes = { carton: cartonPropType.isRequired };

function CartonPanel({ carton, qrDataUrl, mirrored = false }) {
  const header = mirrored
    ? [['STYLE', carton.style], ['PO NO', carton.poNo], ['ITEM DESCRIPTION', carton.itemDescription], ['COUNTRY', carton.country]]
    : [['COUNTRY', carton.country], ['ITEM DESCRIPTION', carton.itemDescription], ['PO NO', carton.poNo], ['STYLE', carton.style]];

  return (
    <Box className={`carton-pdf-panel ${mirrored ? 'carton-pdf-panel-mirrored' : ''}`}>
      <Box className="carton-pdf-header">
        {header.map(([label, value]) => <HeaderCell key={label} label={label} value={value} />)}
      </Box>
      <Box className="carton-pdf-body">
        {mirrored ? <><InfoCells carton={carton} /><QrArea carton={carton} qrDataUrl={qrDataUrl} /><SideStrip carton={carton} /></> : <><SideStrip carton={carton} /><QrArea carton={carton} qrDataUrl={qrDataUrl} /><InfoCells carton={carton} /></>}
      </Box>
    </Box>
  );
}

CartonPanel.propTypes = {
  carton: cartonPropType.isRequired,
  mirrored: PropTypes.bool,
  qrDataUrl: PropTypes.string,
};

export default function CartonMarkingQRCodePdf() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const cartons = useMemo(
    () => (Array.isArray(state?.cartons) ? state.cartons : []),
    [state]
  );
  const [qrImages, setQrImages] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const previewRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    let isCurrent = true;
    Promise.all(cartons.map((carton) => QRCode.toDataURL(`${carton.poDetailID},${carton.solid}`, {
      width: 200,
      margin: 1,
      version: 4,
      errorCorrectionLevel: 'M',
    }).catch(() => ''))).then((images) => {
      if (isCurrent) setQrImages(images);
    });
    return () => { isCurrent = false; };
  }, [cartons]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const container = previewRef.current;
    if (!root || !container) return;

    const pages = Array.from(container.querySelectorAll('.carton-pdf-page'));
    if (!pages.length) return;

    pages.forEach((pageEl, idx) => {
      pageEl.dataset.pageIndex = String(idx + 1);
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
      {
        root,
        threshold: [0.15, 0.35, 0.55, 0.75],
      }
    );

    pages.forEach((p) => observer.observe(p));
    return () => observer.disconnect();
  }, [cartons]);

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
    const element = previewRef.current;
    if (!element) return;
    const labels = element.querySelectorAll('.carton-pdf-label') || [];
    if (!labels.length) return;

    const originalTransform = element.style.transform;
    const originalTransition = element.style.transition;

    try {
      element.style.transform = 'scale(1)';
      element.style.transition = 'none';

      // eslint-disable-next-line new-cap
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [228.6, 101.6],
      });

      const canvases = await Promise.all(
        Array.from(labels).map((label) => html2canvas(label, {
          backgroundColor: '#ffffff',
          scale: 3,
          useCORS: true,
          allowTaint: true,
          onclone: (_doc, clonedEl) => {
            // html2canvas cannot handle writing-mode + rotate(180deg) properly.
            // Convert side strip text to pure CSS transform rotation in the clone.
            clonedEl.querySelectorAll('.carton-pdf-side-cell').forEach((cell) => {
              cell.style.overflow = 'visible';
            });
            clonedEl.querySelectorAll('.carton-pdf-side-label').forEach((el) => {
              el.style.writingMode = 'initial';
              el.style.whiteSpace = 'nowrap';
              el.style.transform = 'rotate(-90deg)';
              el.style.transformOrigin = 'bottom left';
              el.style.left = '10px';
              el.style.bottom = '4px';
            });
            clonedEl.querySelectorAll('.carton-pdf-side-value').forEach((el) => {
              el.style.writingMode = 'initial';
              el.style.whiteSpace = 'nowrap';
              el.style.transform = 'rotate(-90deg)';
              el.style.transformOrigin = 'bottom left';
              el.style.left = '40px';
              el.style.bottom = '4px';
            });
          },
        }))
      );

      canvases.forEach((canvas, index) => {
        if (index > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 4, 4, 215.9, 88.9, undefined, 'FAST');
      });

      pdf.save('CartonMarkingQRCode.pdf');
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      element.style.transform = originalTransform;
      element.style.transition = originalTransition;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <Helmet><title>Carton Marking QR Code pdf</title></Helmet>

      <Box
        sx={{
          height: { xs: 'calc(100vh - 80px)', md: 'calc(100vh - 90px)' },
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#282828',
        }}
      >
        {/* PDF Viewer Header */}
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
            {/* Left Section: Back Button + Document Title + Page Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <IconButton
                size="small"
                onClick={handleBack}
                sx={{ color: '#fff', mr: 1 }}
                title="Back"
              >
                <ArrowBack fontSize="small" />
              </IconButton>
              <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                Carton Marking QR Code pdf
              </Typography>
              <Typography sx={{ fontSize: '12px', ml: 2, color: 'rgba(255, 255, 255, 0.85)' }}>
                {cartons.length > 0 ? `${currentPage}/${cartons.length}` : '0/0'}
              </Typography>
            </Box>

            {/* Center Section: Zoom Controls */}
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

            {/* Right Section: Download and Print Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleDownload}
                disabled={!cartons.length}
                sx={{ color: '#fff' }}
                title="Download PDF"
              >
                <Download fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handlePrint}
                disabled={!cartons.length}
                sx={{ color: '#fff' }}
                title="Print"
              >
                <Print fontSize="small" />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* PDF Scrollable Canvas Area */}
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
            className="carton-pdf-preview-canvas"
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
            {cartons.length === 0 ? (
              <Typography sx={{ color: '#fff', mt: 4 }}>No carton label data is available.</Typography>
            ) : (
              cartons.map((carton, index) => (
                <Box
                  key={`${carton.poDetailID}-${index}`}
                  className="carton-pdf-page"
                  sx={{
                    width: '1144px',
                    height: '508px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 3,
                    flexShrink: 0,
                    '@media print': {
                      boxShadow: 'none',
                      mb: 0,
                      width: '228.6mm !important',
                      height: '101.6mm !important',
                    },
                  }}
                >
                  <Box className="carton-pdf-label">
                    <CartonPanel carton={carton} qrDataUrl={qrImages[index]} />
                    <CartonPanel carton={carton} qrDataUrl={qrImages[index]} mirrored />
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      <style>{`
        @page {
          size: 228.6mm 101.6mm landscape;
          margin: 0;
        }
        .carton-pdf-page {
          width: 1144px;
          height: 508px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-sizing: border-box;
        }
        .carton-pdf-label {
          width: 1080px;
          height: 445px;
          display: flex;
          background: #ffffff;
          border-top: 2px solid #000000;
          border-left: 2px solid #000000;
          border-right: 2px solid #000000;
          border-bottom: 0;
          color: #000000;
          font-family: Helvetica, Arial, sans-serif;
          box-sizing: border-box;
        }
        .carton-pdf-panel { width: 50%; height: 100%; display: flex; flex-direction: column; box-sizing: border-box; }
        .carton-pdf-panel + .carton-pdf-panel { border-left: 2px solid #000000; }
        .carton-pdf-header { height: 80px; flex-shrink: 0; display: grid; grid-template-columns: 10% 41% 27% 22%; border-bottom: 2px solid #000000; box-sizing: border-box; }
        .carton-pdf-panel-mirrored .carton-pdf-header { grid-template-columns: 22% 27% 41% 10%; }
        .carton-pdf-header-cell { border-right: 1px solid #000000; padding: 6px 7px; overflow: hidden; display: flex; flex-direction: column; gap: 3px; box-sizing: border-box; }
        .carton-pdf-header-cell:last-child { border-right: 0; }
        .carton-pdf-header-label, .carton-pdf-info-cells small { font-size: 7px; font-weight: 400; line-height: 1.1; overflow-wrap: normal; word-break: normal; white-space: nowrap; }
        .carton-pdf-header-value { font-size: 15px; line-height: 1.05; white-space: pre-line; overflow-wrap: anywhere; }
        .carton-pdf-body { height: 365px; display: grid; grid-template-columns: 10% 68% 22%; box-sizing: border-box; }
        .carton-pdf-panel-mirrored .carton-pdf-body { grid-template-columns: 22% 68% 10%; }
        .carton-pdf-body > * { border-right: 1px solid #000000; box-sizing: border-box; }
        .carton-pdf-body > *:last-child { border-right: 0; }
        .carton-pdf-side-strip { display: grid; grid-template-rows: 1fr 1fr; border-bottom: 2px solid #000000; box-sizing: border-box; }
        .carton-pdf-side-cell { border-bottom: 1px solid #000000; position: relative; overflow: hidden; height: 100%; box-sizing: border-box; }
        .carton-pdf-side-cell:last-child { border-bottom: 0; }
        .carton-pdf-side-label, .carton-pdf-side-value { position: absolute; writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; }
        .carton-pdf-side-label { left: 4px; bottom: 4px; font-size: 7.5px; font-weight: 500; color: #333333; letter-spacing: 0.4px; }
        .carton-pdf-side-value { right: 4px; bottom: 4px; font-size: 13px; font-weight: 700; color: #000000; }
        .carton-pdf-qr-area { position: relative; overflow: hidden; border-bottom: 0 !important; box-sizing: border-box; }
        .carton-pdf-qr { position: absolute; width: ${QR_SIZE}px; height: ${QR_SIZE}px; left: 50%; top: 50%; transform: translate(-50%, -50%); }
        .carton-pdf-size, .carton-pdf-style { position: absolute; left: 0; width: 100%; text-align: center; font-size: 13px; font-weight: 700; }
        .carton-pdf-size { top: calc(50% - ${QR_SIZE / 2 + 22}px); }
        .carton-pdf-style { top: calc(50% + ${QR_SIZE / 2 + 6}px); }
        .carton-pdf-side-zone { position: absolute; top: 0; bottom: 0; width: 30px; display: flex; align-items: center; justify-content: center; }
        .carton-pdf-side-zone-left { left: calc((100% - ${QR_SIZE}px) / 2 - 30px); }
        .carton-pdf-side-zone-right { right: calc((100% - ${QR_SIZE}px) / 2 - 30px); }
        .carton-pdf-rotated-text { transform: rotate(-90deg); white-space: nowrap; font-size: 13px; font-weight: 700; }
        .carton-pdf-info-cells { display: grid; grid-template-rows: 29% 20% 19% 20% 12%; height: 100%; border-bottom: 2px solid #000000; box-sizing: border-box; }
        .carton-pdf-info-cells > div { border-bottom: 1px solid #000000; padding: 4px 6px; display: flex; flex-direction: column; justify-content: flex-start; gap: 2px; overflow: hidden; box-sizing: border-box; }
        .carton-pdf-info-cells > div:last-child { border-bottom: 0; padding: 2px 6px; justify-content: center; gap: 2px !important; }
        .carton-pdf-info-cells strong { font-size: 15px; line-height: 1.15; overflow-wrap: anywhere; }
        .carton-pdf-weights strong { font-size: 10.5px !important; line-height: 1.2; }
        @media print {
          body * { visibility: hidden; }
          .carton-pdf-preview-canvas, .carton-pdf-preview-canvas * { visibility: visible; }
          .carton-pdf-preview-canvas { position: absolute; top: 0; left: 0; transform: none !important; width: 100%; }
          .carton-pdf-page {
            width: 228.6mm !important;
            height: 101.6mm !important;
            margin: 0 !important;
            page-break-after: always;
            box-shadow: none !important;
          }
          .carton-pdf-label {
            width: 215.9mm !important;
            height: 88.9mm !important;
          }
        }
      `}</style>
    </>
  );
}
