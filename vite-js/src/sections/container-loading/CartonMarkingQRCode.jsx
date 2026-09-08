import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';

import { useSnackbar } from 'src/components/snackbar';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import axios from 'src/utils/axios';

// Cache object to store API response
const cache = new Map();
let isDataFetched = false; // Flag to prevent multiple API calls

// ============================================================
// HARD-CODED SAMPLE DATA FOR PDF
// ============================================================
const SAMPLE_CARTON = {
  country: 'PK',
  itemDescription: 'Garment Wash S/S\nT-Shirt',
  poNo: '00816-Raisin',
  style: 'GW2200',
  colorCode: 'Raisin',
  size: 'S',
  solid: 'Solid',
  quantity: '72',
  gw: '0.00',
  nw: '0.00',
  vendorCode: 'CMF (11245)',
  customerName: 'All Seasons Textile',
};

// ============================================================
// PDF GENERATION HELPERS
// ============================================================

// Legacy ERP output is a compact carton label, so keep a fixed label-sized
// page instead of an A4 sheet. The two-panel structure stays unchanged.
const PDF_PAGE = {
  width: 228.6,
  height: 101.6,
  margin: 4,
};

function fitFontSize(doc, text, maxWidth, initialSize, minimumSize = 4) {
  let size = initialSize;
  doc.setFontSize(size);
  while (size > minimumSize && doc.getTextWidth(String(text || '')) > maxWidth) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
}

function drawSideStrip(doc, x, y, w, h, data) {
  const midY = y + h / 2;
  doc.line(x, midY, x + w, midY);

  // Top cell (VENDOR CODE)
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'normal');
  doc.text('VENDOR CODE', x + 2.2, midY - 4.5, { angle: 90 });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(data.vendorCode, x + w - 2.2, midY - 4.5, { angle: 90 });

  // Bottom cell (CUSTOMER NAME)
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'normal');
  doc.text('CUSTOMER NAME', x + 2.2, y + h - 4.5, { angle: 90 });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(data.customerName, x + w - 2.2, y + h - 4.5, { angle: 90 });
}

function drawQrArea(doc, x, y, w, h, data, qrDataUrl) {
  const qrSize = Math.min(36, Math.max(30, Math.min(w, h) * 0.44));
  const qrX = x + (w - qrSize) / 2;
  const qrY = y + (h - qrSize) / 2;
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  doc.setFont('helvetica', 'bold');
  fitFontSize(doc, data.size, w - 8, 10.5);
  doc.text(data.size, x + w / 2, qrY - 6, { align: 'center' });
  fitFontSize(doc, data.style, w - 8, 10.5);
  doc.text(data.style, x + w / 2, qrY + qrSize + 6, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  fitFontSize(doc, data.poNo, h - 8, 8.5);
  doc.setFontSize(8.5);
  const colorCode = String(data.colorCode || '').split(' (')[0].trim();
  doc.text(data.poNo, x + 27, y + h / 1.5, { angle: 90, align: 'center' });
  doc.text(colorCode, x + w - 10, y + h / 1.8, { angle: 90, align: 'center' });
}

function drawInfoCells(doc, x, y, w, h, data) {
  const h1 = h * 0.24;
  const h2 = h * 0.17;
  const h3 = h * 0.17;
  const h4 = h * 0.17;
  const h5 = h - h1 - h2 - h3 - h4;

  const rows = [h1, h2, h3, h4, h5];
  let cy = y;

  rows.forEach((rh, i) => {
    if (i > 0) doc.line(x, cy, x + w, cy);

    if (i === 0) {
      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'normal');
      doc.text('COLOR CODE', x + 1.8, cy + 3.6);
      doc.setFontSize(11.5);
      doc.setFont('helvetica', 'bold');
      const colorCode = String(data.colorCode || '').split(' (')[0].trim();
      doc.text(colorCode, x + 1.8, cy + 11);
    } else if (i === 1) {
      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'normal');
      doc.text('SIZE', x + 1.8, cy + 3.6);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(data.size, x + 1.8, cy + 10);
    } else if (i === 2) {
      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'normal');
      doc.text('SOLID', x + 1.8, cy + 3.6);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(data.solid, x + 1.8, cy + 9);
    } else if (i === 3) {
      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'normal');
      doc.text('QUANTITY', x + 1.8, cy + 3.6);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${data.quantity} PCS`, x + 1.8, cy + 9);
    } else if (i === 4) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`GW : ${data.gw} KG`, x + 1.8, cy + 7);
      doc.text(`NW : ${data.nw} KG`, x + 1.8, cy + 14);
    }
    
    cy += rh;
  });
}

function drawCartonPanel(doc, ox, oy, pw, ph, data, qrDataUrl) {
  const lw = 0.4;
  doc.setLineWidth(lw);
  doc.line(ox, oy, ox + pw, oy);
  doc.line(ox, oy, ox, oy + ph);
  doc.line(ox + pw, oy, ox + pw, oy + ph);

  const headerH = 16;
  doc.line(ox, oy + headerH, ox + pw, oy + headerH);

  const W = pw;
  const H = ph;
  const H_half = W / 2;
  const center_x = ox + H_half;
  doc.line(center_x, oy, center_x, oy + H);

  // Widths (percentages of half width)
  const w1 = H_half * 0.1; // COUNTRY / Side Strip
  const w4 = H_half * 0.22; // STYLE / Info Cells
  const w3 = H_half * 0.27; // PO NO
  const w2 = H_half - w1 - w4 - w3; // ITEM DESCRIPTION

  const leftCols = [
    { label: 'COUNTRY', value: data.country, w: w1 },
    { label: 'ITEM DESCRIPTION', value: data.itemDescription, w: w2 },
    { label: 'PO NO', value: data.poNo, w: w3 },
    { label: 'STYLE', value: data.style, w: w4 },
  ];

  const rightCols = [
    { label: 'STYLE', value: data.style, w: w4 },
    { label: 'PO NO', value: data.poNo, w: w3 },
    { label: 'ITEM DESCRIPTION', value: data.itemDescription, w: w2 },
    { label: 'COUNTRY', value: data.country, w: w1 },
  ];

  const drawHeaderCell = (x, y, w, h, label, value) => {
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 1.5, y + 3.2);
    
    doc.setFont('helvetica', 'bold');
    const lines = value.split('\n');
    const longestLine = lines.reduce(
      (longest, line) => (line.length > longest.length ? line : longest),
      ''
    );
    fitFontSize(
      doc,
      longestLine,
      w - 3,
      label === 'PO NO' || label === 'STYLE' ? 9.5 : 7.5
    );
    lines.forEach((line, li) => {
      doc.text(line, x + 1.5, y + 9.5 + li * 4.2);
    });
  };

  // Draw Header
  let cx = ox;
  leftCols.forEach((col, i) => {
    if (i > 0) doc.line(cx, oy, cx, oy + headerH);
    drawHeaderCell(cx, oy, col.w, headerH, col.label, col.value);
    cx += col.w;
  });

  cx = center_x;
  rightCols.forEach((col, i) => {
    if (i > 0) doc.line(cx, oy, cx, oy + headerH);
    drawHeaderCell(cx, oy, col.w, headerH, col.label, col.value);
    cx += col.w;
  });

  // BODY
  const bodyY = oy + headerH;
  const bodyH = ph - headerH;

  // X Coordinates Left
  const leftSideX = ox;
  const leftQrX = ox + w1;
  const leftQrW = w2 + w3;
  const leftInfoX = ox + w1 + w2 + w3;

  // X Coordinates Right
  const rightInfoX = center_x;
  const rightQrX = center_x + w4;
  const rightQrW = w3 + w2;
  const rightSideX = center_x + w4 + w3 + w2;

  // The legacy report leaves the QR sections open at the bottom.
  doc.line(leftSideX, bodyY + bodyH, leftQrX, bodyY + bodyH);
  doc.line(leftInfoX, bodyY + bodyH, center_x, bodyY + bodyH);
  doc.line(rightInfoX, bodyY + bodyH, rightQrX, bodyY + bodyH);
  doc.line(rightSideX, bodyY + bodyH, ox + pw, bodyY + bodyH);

  // Vertical lines in body
  doc.line(leftQrX, bodyY, leftQrX, bodyY + bodyH);
  doc.line(leftInfoX, bodyY, leftInfoX, bodyY + bodyH);
  doc.line(rightQrX, bodyY, rightQrX, bodyY + bodyH);
  doc.line(rightSideX, bodyY, rightSideX, bodyY + bodyH);

  // Draw components
  drawSideStrip(doc, leftSideX, bodyY, w1, bodyH, data);
  drawSideStrip(doc, rightSideX, bodyY, w1, bodyH, data);

  drawQrArea(doc, leftQrX, bodyY, leftQrW, bodyH, data, qrDataUrl);
  drawQrArea(doc, rightQrX, bodyY, rightQrW, bodyH, data, qrDataUrl);

  drawInfoCells(doc, leftInfoX, bodyY, w4, bodyH, data);
  drawInfoCells(doc, rightInfoX, bodyY, w4, bodyH, data);
}

export default function CartonMarkingQRCode() {
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const [poOptions, setPoOptions] = useState([]);
  const [displayOptions, setDisplayOptions] = useState([]); // For lazy loading
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const observerRef = useRef(null);
  const ITEMS_PER_PAGE = 20; // Load 20 items at a time

  // ============================================================
  // FETCH PO LIST - ONLY ONCE
  // ============================================================
  useEffect(() => {
    // If data already fetched, skip API call
    if (isDataFetched && cache.has('poData')) {
      const cachedData = cache.get('poData');
      setPoOptions(cachedData);
      loadMoreItems(cachedData, 1);
      setIsInitialLoad(false);
      return;
    }

    const fetchPOs = async () => {
      // Prevent multiple calls
      if (loading || isDataFetched) return;

      setLoading(true);
      setError('');

      try {
        const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
        const { data } = await axios.post(`${base}/api/Container/Getpono`, {});

        // Extract PO list
        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (Array.isArray(data?.data)) {
          list = data.data;
        } else if (Array.isArray(data?.Data)) {
          list = data.Data;
        } else if (Array.isArray(data?.result)) {
          list = data.result;
        } else if (Array.isArray(data?.Result)) {
          list = data.Result;
        }

        // Keep the PO number visible while preserving its PO ID as the value.
        const optionsMap = new Map();
        list.forEach((item) => {
          if (!item || typeof item !== 'object') return;

          const label = String(item.PONO ?? '').trim();
          const value = String(item.POID ?? '').trim();
          if (label && value && !optionsMap.has(value)) {
            optionsMap.set(value, { label, value });
          }
        });

        const options = Array.from(optionsMap.values());

        // Store in cache
        cache.set('poData', options);
        isDataFetched = true;

        setPoOptions(options);
        loadMoreItems(options, 1);
        setIsInitialLoad(false);

      } catch (err) {
        const message = err?.response?.data?.Message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load PO list';

        setError(message);
        enqueueSnackbar(message, { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchPOs();

    // Cleanup observer
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enqueueSnackbar]);

  // ============================================================
  // LAZY LOAD MORE ITEMS
  // ============================================================
  const loadMoreItems = useCallback((options, currentPage) => {
    const start = 0;
    const end = currentPage * ITEMS_PER_PAGE;
    const newItems = options.slice(start, end);

    setDisplayOptions(newItems);
    setHasMore(end < options.length);
    setPage(currentPage);
  }, []);

  // ============================================================
  // INFINITE SCROLL OBSERVER
  // ============================================================
  const lastItemRef = useCallback((node) => {
    if (loading) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        // Load next page
        const nextPage = page + 1;
        const end = nextPage * ITEMS_PER_PAGE;
        const newItems = poOptions.slice(0, end);

        setDisplayOptions(newItems);
        setHasMore(end < poOptions.length);
        setPage(nextPage);
      }
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    });

    if (node) {
      observerRef.current.observe(node);
    }
  }, [loading, hasMore, page, poOptions]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = useCallback((event) => {
    const value = event.target.value;
    setSelected(typeof value === 'string' ? value.split(',') : value);
  }, []);

  const handlePrint = useCallback(async () => {
    if (!selected.length) {
      enqueueSnackbar('Please select at least one PO', { variant: 'warning' });
      return;
    }

    try {
      const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
      const poIds = selected.map((poId) => Number(poId));
      const { data } = await axios.post(`${base}/api/Container/CartonMarkingQRCode`, poIds);

      const responseRows = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.Data)
        ? data.Data
        : Array.isArray(data?.result)
        ? data.result
        : Array.isArray(data?.Result)
        ? data.Result
        : data && typeof data === 'object'
        ? [data]
        : [];

      if (!responseRows.length) {
        throw new Error('No carton data found for the selected PO');
      }

      // Create a fixed carton-label PDF matching the legacy ERP footprint
      // eslint-disable-next-line new-cap
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [PDF_PAGE.width, PDF_PAGE.height],
      });

      // Set PDF metadata title
      doc.setProperties({ title: 'CartonMarkingQRCode' });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // Panel dimensions with margin
      const margin = PDF_PAGE.margin;
      // The ERP report keeps an 8.5 x 3.5 inch carton box inside its 9 x 4 inch page.
      const panelW = Math.min(pageW - margin * 2, 215.9);
      const panelH = Math.min(pageH - margin * 2, 88.9);

      for (let index = 0; index < responseRows.length; index += 1) {
        const row = responseRows[index];
        const carton = {
          ...SAMPLE_CARTON,
          poNo: String(row.PONO ?? '').trim(),
          style: String(row.Style ?? '').trim(),
          size: String(row.Size ?? '').trim(),
          colorCode: String(row.ColorName ?? '').trim(),
          quantity: String(row.CartonQty ?? '').trim(),
          solid: String(row.Assortment ?? row.POAssortType ?? '').trim(),
          customerName: String(row.CustomerName ?? '').trim(),
          itemDescription: String(row.Item ?? '').trim(),
          gw: String(row.GrossW ?? '').trim(),
          nw: String(row.NetW ?? '').trim(),
          vendorCode: String(row.VenderCode ?? '').trim(),
          poDetailID: row.PODetailID,
          poAssortType: row.POAssortType,
        };

        const qrContent = JSON.stringify({
          PODetailID: carton.poDetailID,
          POAssortType: carton.poAssortType,
        });

        const qrDataUrl = await QRCode.toDataURL(qrContent, {
          width: 200,
          margin: 1,
          errorCorrectionLevel: 'M',
        });

        if (index > 0) doc.addPage();
        drawCartonPanel(doc, margin, margin, panelW, panelH, carton, qrDataUrl);
      }

      // Open PDF in new tab with title "CartonMarkingQRCode"
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const newTab = window.open(blobUrl, '_blank');

      // Set the document title in the new tab
      if (newTab) {
        newTab.addEventListener('load', () => {
          try {
            newTab.document.title = 'CartonMarkingQRCode';
          } catch (_) {
            // cross-origin: title can't be set, no-op
          }
        });
        // Also try immediately for some browsers
        setTimeout(() => {
          try {
            newTab.document.title = 'CartonMarkingQRCode';
          } catch (_) {
            // no-op
          }
        }, 500);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      enqueueSnackbar('Failed to generate PDF', { variant: 'error' });
    }
  }, [selected, enqueueSnackbar]);

  const handleCancel = useCallback(() => {
    setSelected([]);
  }, []);

  const renderValue = useCallback((selectedList) => {
    if (!selectedList || selectedList.length === 0) {
      return 'Select PO(s)';
    }
    return `${selectedList.length} item${selectedList.length > 1 ? 's' : ''} checked`;
  }, []);

  // ============================================================
  // SEARCH FUNCTIONALITY (Optional but recommended)
  // ============================================================
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useCallback((term) => {
    if (!term) return displayOptions;
    return displayOptions.filter(po =>
      po.label.toLowerCase().includes(term.toLowerCase())
    );
  }, [displayOptions]);

  // ============================================================
  // UI
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Dashboard: Carton Marking QR Code</title>
      </Helmet>

      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Carton Marking QR Code"
          links={[
            { name: 'Dashboard' },
            { name: 'New Container Loading' },
            { name: 'Carton Marking QR Code' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {isInitialLoad && loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>Loading PO list...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl size="small" sx={{ width: 320, mb: 3 }}>
          <InputLabel id="po-multi-select-label">PO #</InputLabel>
          <Select
            labelId="po-multi-select-label"
            id="po-multi-select"
            multiple
            value={selected}
            onChange={handleChange}
            renderValue={renderValue}
            label="PO #"
            disabled={loading || isInitialLoad}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 400,
                  overflow: 'auto',
                },
              },
              // Keep menu mounted to avoid re-renders
              keepMounted: true,
              disableScrollLock: true,
            }}
          >
            {displayOptions.length === 0 && !loading && !isInitialLoad && (
              <MenuItem disabled>No POs found</MenuItem>
            )}

            {displayOptions.map((po, index) => {
              // Attach ref to last item for infinite scroll
              const isLastItem = index === displayOptions.length - 1;
              const itemRef = isLastItem ? lastItemRef : null;

              return (
                <MenuItem
                  key={po.value}
                  value={po.value}
                  sx={{ minHeight: 48 }}
                  ref={itemRef}
                >
                  <Checkbox
                    checked={selected.includes(po.value)}
                    sx={{ p: 0.5, mr: 1 }}
                  />
                  {po.label}
                </MenuItem>
              );
            })}

            {/* Loading indicator at bottom */}
            {loading && hasMore && (
              <MenuItem disabled sx={{ justifyContent: 'center' }}>
                <CircularProgress size={20} />
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePrint}
            disabled={selected.length === 0 || loading}
          >
            Print
          </Button>

          <Button
            variant="contained"
            color="inherit"
            onClick={handleCancel}
            disabled={selected.length === 0}
          >
            Cancel
          </Button>
        </Box>
      </Container>
    </>
  );
}