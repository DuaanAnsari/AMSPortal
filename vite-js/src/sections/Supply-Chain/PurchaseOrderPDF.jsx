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
  const componentRef = useRef();
  const scrollContainerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const { id } = useParams();
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(!!id && !propPoData);

  useEffect(() => {
    const fetchPurchaseOrderData = async () => {
      if (!id || propPoData) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: token ? `Bearer ${token}` : '' };

        const response = await axios.get(`${HOST_API}/api/Report/GeneratePOReport?poid=${id}`, { headers });

        const reportData = response.data;
        const isEmpty = !reportData || (Array.isArray(reportData) && reportData.length === 0);

        if (!isEmpty) {
          setFetchedData(reportData);
        } else {
          // Fallback: fetch PO header + style/item rows separately
          try {
            const [fallback, styleRes] = await Promise.all([
              axios.get(`${HOST_API}/api/MyOrders/GetPurchaseOrder/${id}`, { headers }),
              axios.get(`${HOST_API}/api/Milestone/GetStyle?poid=${id}`, { headers }).catch(() => ({ data: [] })),
            ]);

            const order = Array.isArray(fallback.data) ? fallback.data[0] : fallback.data;
            const styleRows = Array.isArray(styleRes.data) ? styleRes.data : [];

            const baseHeader = order ? {
              amsRefNo: order.amsRefNo || order.amsRef || '',
              pono: order.pono || order.poNo || order.PONO || '',
              venderAddress: order.venderAddress || order.vendorAddress || '',
              venderCode: order.venderCode || order.vendorCode || '',
              contactPersonVendor: order.contactPersonVendor || '',
              brand: order.brand || '',
              fabric: order.fabric || '',
              quality: order.quality || '',
              shipmentDate: order.shipmentDate || order.tolerance || '',
              finalInspDate: order.finalInspDate || '',
              packingList: order.packingList || '',
              cartonMarking: order.cartonMarking || '',
              pcPerCarton: order.pcPerCarton || '',
              ration: order.ration || '',
              destination: order.destination || '',
              paymentModeName: order.paymentModeName || order.paymentMode || '',
              deliveryTypeDisplayName: order.deliveryTypeDisplayName || order.deliveryType || '',
              shipmentModeName: order.shipmentModeName || order.shipmentMode || '',
              importantNote: order.importantNote || '',
              itemDescriptionShippingInvoice: order.itemDescriptionShippingInvoice || '',
              poImage: order.poImage || '',
              userName: order.userName || '',
              consigneeAddress1: order.consigneeAddress1 || order.consignee || '',
              rnNo: order.rnNo || '',
              moreInfo: order.moreInfo || '',
              gms: order.gms || '',
              bankName: order.bankName || '',
              bankBranch: order.bankBranch || '',
              accountNo: order.accountNo || '',
            } : {};

            if (styleRows.length > 0) {
              // Build report rows from GetStyle data (same format as GeneratePOReport)
              // Each style row becomes a size+quantity pair
              const builtRows = styleRows.flatMap((s) => {
                const sizeRow = {
                  ...baseHeader,
                  poDetailID: s.styleId || s.styleID,
                  color: s.colorway || '',
                  style: s.styleNo || '',
                  sizeRange: s.sizeRange || '',
                  productCode: s.productCode || '',
                  rate: s.rate || s.itemPrice || 0,
                  totalQTY: s.quantity || 0,
                  rowType: 'size',
                  s1: s.size || '',
                };
                const qtyRow = {
                  ...baseHeader,
                  poDetailID: s.styleId || s.styleID,
                  color: s.colorway || '',
                  style: s.styleNo || '',
                  sizeRange: s.sizeRange || '',
                  productCode: s.productCode || '',
                  rate: s.rate || s.itemPrice || 0,
                  totalQTY: s.quantity || 0,
                  rowType: 'quantity',
                  s1: s.quantity || 0,
                };
                return [sizeRow, qtyRow];
              });
              setFetchedData(builtRows);
            } else if (order) {
              setFetchedData([baseHeader]);
            }
          } catch (fallbackErr) {
            console.error('Fallback fetch failed:', fallbackErr);
          }
        }
      } catch (error) {
        console.error('Failed to fetch purchase order data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrderData();
  }, [id, propPoData]);

  const rawReport = propPoData ?? fetchedData;
  const reportRows = Array.isArray(rawReport) ? rawReport : rawReport ? [rawReport] : [];
  // Use first row as header/source for the non-grid fields
  const poData = reportRows[0] || {};
  const totalPages = 3;

  // Track which page is currently visible inside the scroll container (for header indicator)
  useEffect(() => {
    const root = scrollContainerRef.current;
    const container = componentRef.current;
    if (!root || !container) return;

    const pages = Array.from(container.children).filter((el) => el instanceof HTMLElement);
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
  }, [loading, id, propPoData, fetchedData]);

  const toNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  };

  const fmtQty = (value) =>
    toNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtMoney = (value) =>
    toNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtInt = (value) => toNumber(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const fmtDz = (value) =>
    toNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtSmart = (value) => {
    const n = toNumber(value);
    const isInt = Math.abs(n - Math.round(n)) < 1e-9;
    return n.toLocaleString('en-US', {
      minimumFractionDigits: isInt ? 0 : 2,
      maximumFractionDigits: isInt ? 0 : 2,
    });
  };

  const getSArray = (obj, max = 11) =>
    Array.from({ length: max }, (_, i) => {
      const v = obj?.[`s${i + 1}`];
      return v === null || v === undefined ? '' : String(v).trim();
    });

  const buildOrderRowsFromReport = (rows) => {
    const groups = new Map();
    const getKey = (r) =>
      String(
        r?.poDetailID ??
          `${r?.color ?? ''}|${r?.style ?? ''}|${r?.sizeRange ?? ''}|${r?.productCode ?? ''}|${r?.rowNo ?? ''}`
      );

    (rows || []).forEach((r, idx) => {
      const key = getKey(r);
      const curr = groups.get(key) || { sizeRow: null, qtyRow: null, firstIndex: idx };
      if (String(r?.rowType || '').toLowerCase() === 'size') curr.sizeRow = r;
      if (String(r?.rowType || '').toLowerCase() === 'quantity') curr.qtyRow = r;
      groups.set(key, curr);
    });

    const out = [];
    for (const [, g] of groups) {
      const base = g.qtyRow || g.sizeRow || {};
      const sizeLabelsRaw = g.sizeRow ? getSArray(g.sizeRow) : [];
      const sizeLabels = sizeLabelsRaw.filter((s) => s);

      const qtyRaw = g.qtyRow ? getSArray(g.qtyRow) : [];
      // Quantities align to the number of size labels (if present); otherwise take numeric-like from qty row.
      const qtyVals = [];
      if (sizeLabels.length) {
        for (let i = 0; i < sizeLabels.length; i += 1) qtyVals.push(toNumber(qtyRaw[i]));
      } else {
        for (const v of qtyRaw) {
          if (v) qtyVals.push(toNumber(v));
        }
      }

      const computedQty = qtyVals.reduce((sum, n) => sum + toNumber(n), 0);
      const totalQtyNum = toNumber(base.totalQTY) || computedQty;
      const unitNum = toNumber(base.rate);
      const amountNum = totalQtyNum * unitNum;

      out.push({
        color: base.color || '',
        style: base.style || '',
        sizeRange: base.sizeRange || '',
        productCode: base.productCode || 'NA',
        refLabel: 'Size',
        sizeLabels,
        sizeRow: qtyVals,
        totalQtyNum,
        unitNum,
        amountNum,
        firstIndex: g.firstIndex ?? 0,
      });
    }

    // Preserve API order within the same PO as much as possible
    out.sort((a, b) => {
      return (a.firstIndex ?? 0) - (b.firstIndex ?? 0);
    });

    return out;
  };

  const extractSizeColumns = (obj) => {
    // Tries to read sizes + qty columns from API response using common naming patterns.
    // NOTE: Your API may send:
    // - s1..sN as quantities (old)
    // - OR s1..sN as size labels (new: "M", "L", "XL", "2XL")
    const max = 20;
    const labels = [];
    const qty = [];

    const isNumericLike = (v) => {
      if (v === null || v === undefined) return false;
      const s = String(v).trim();
      if (!s) return false;
      return /^-?\d+(\.\d+)?$/.test(s.replace(/,/g, ''));
    };

    const hasAnyS = Array.from({ length: max }, (_, i) => obj?.[`s${i + 1}`]).some(
      (v) => v !== undefined && v !== null && String(v).trim() !== ''
    );

    const s1 = obj?.s1;
    const sLooksNumeric = isNumericLike(s1);

    // Mode A: s1..sN are quantities
    if (hasAnyS && sLooksNumeric) {
      for (let i = 1; i <= max; i += 1) {
        const qRaw = obj?.[`s${i}`];
        const hasQty = qRaw !== undefined && qRaw !== null && String(qRaw).trim() !== '';
        if (!hasQty) continue;

        qty.push(toNumber(qRaw));

        const labelCandidates = [
          obj?.[`size${i}`],
          obj?.[`size${i}Text`],
          obj?.[`s${i}Text`],
          obj?.[`s${i}Label`],
          obj?.[`s${i}Size`],
          obj?.[`sz${i}`],
        ];
        const found = labelCandidates.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
        labels.push(found ? String(found).trim() : '');
      }
      return { labels, qty };
    }

    // Mode B: s1..sN are size labels (your case)
    if (hasAnyS) {
      for (let i = 1; i <= max; i += 1) {
        const labelRaw = obj?.[`s${i}`];
        const label = labelRaw !== undefined && labelRaw !== null ? String(labelRaw).trim() : '';
        if (!label) continue;

        labels.push(label);

        const qtyCandidates = [
          obj?.[`q${i}`],
          obj?.[`qty${i}`],
          obj?.[`quantity${i}`],
          obj?.[`poQty${i}`],
          obj?.[`qtyS${i}`],
          obj?.[`s${i}Qty`],
          obj?.[`s${i}Quantity`],
          obj?.[`qty_${i}`],
          obj?.[`quantity_${i}`],
        ];
        const foundQty = qtyCandidates.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
        qty.push(toNumber(foundQty));
      }
      return { labels, qty };
    }

    // If API didn’t provide s1.. fields, fall back to existing 4 qty fields (keeps layout working)
    if (!qty.length) {
      const fallbackQty = [obj?.s1, obj?.s2, obj?.s3, obj?.s4].filter(
        (v) => v !== undefined && v !== null && String(v).trim() !== ''
      );
      fallbackQty.forEach((v) => qty.push(toNumber(v)));
      // No hardcoded size names; leave labels empty when API doesn’t send them
      while (labels.length < qty.length) labels.push('');
    }

    return { labels, qty };
  };

  const data = {
    ref: poData.amsRefNo || '',
    receivedDate: (poData.creationDate && !poData.creationDate.startsWith('1900-01-01'))
      ? new Date(poData.creationDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '',
    attn: poData.contactPersonVendor || '',
    addressLeft: poData.venderAddress || '',
    trackingCode: poData.venderCode || '',
    brand: poData.brand || '',
    division: poData.ecpDivistion || '',
    rn: poData.rnNo || '',
    shipTo: poData.consigneeAddress1 || '',
    itemDescription: poData.itemDescriptionShippingInvoice || '',
    exFactory: (poData.shipmentDate && !poData.shipmentDate.startsWith('1900-01-01')) ? new Date(poData.shipmentDate).toLocaleDateString('en-US') : '',
    finalInspection: (poData.finalInspDate && !poData.finalInspDate.startsWith('1900-01-01')) ? new Date(poData.finalInspDate).toLocaleDateString('en-US') : '',
    leadTime: poData.timeSpame ? `${poData.timeSpame} Days` : '',
    fabric: {
      description: '',
      fabric: poData.fabric || '',
      content: poData.quality || '',
      weight: poData.gms ? `${poData.gms} GSM` : ''
    },
    packingInstructions: poData.packingList || '',
    cartonMarking: poData.cartonMarking || '',
    pcsPerCarton: poData.pcPerCarton || '',
    ration: poData.ration || '',
    orderRows: buildOrderRowsFromReport(reportRows),
    totalQtyNum: toNumber(poData.totalQTY) || 0,
    totalAmountNum: (toNumber(poData.totalQTY) || 0) * toNumber(poData.rate),
    importantNotes: poData.importantNote ? [poData.importantNote] : [],
    productImage: poData.poImage || '',
    shipMode: poData.deliveryTypeDisplayName || '',
    destination: poData.destination || '',
    shipmentTerms: poData.shipmentModeName || '',
    paymentTerms: poData.paymentModeName || '',
    amsTeam: poData.userName || '',
    cpoNumber: poData.pono || '',
    styleNumber: poData.style || '',
    productCategory: poData.productCategoriesName || '',
    specialInstructions: poData.pO_Special_Instructions || '',
    source: poData.styleSource || '',
    embellishment: poData.embAndEmbellishment || '',
    trimsAccessories: poData.trimsAccessories || '',
    specialOperation: poData.pO_Special_Operation || '',
    samplingReq: poData.samplingReq || '',
    beneficiaryBank: poData.bankNameBank || '',
    accountNo: poData.accountNoBank || '',
    routingNo: poData.ibanBank || '',
    washingInstructions: poData.washingCareLabelInstructions || '',
    poTotalDetails:
      poData.poTotalDetails ||
      poData.poTotalDetail ||
      poData.poTotalDetailText ||
      poData.poTotalDetailsText ||
      '',
    fmtQty,
    fmtMoney,
    fmtInt,
    fmtDz,
    fmtSmart,
  };

  // Second page data
  const secondPageData = {
    companyName: poData.companyName || "",
    preparedBy: poData.userName || "",
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
    contentRef: componentRef,
    documentTitle: `Purchase_Order_${data.ref}`,
    onAfterPrint: () => console.log('Printed PDF successfully!'),
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
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

        // Avoid capturing shadows/margins that can cause page overflow/cropping
        const prevBoxShadow = page.style.boxShadow;
        const prevMarginBottom = page.style.marginBottom;
        page.style.boxShadow = 'none';
        page.style.marginBottom = '0';

        const canvas = await html2canvas(page, {
          scale: 2, // High resolution
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Fit to A4 page (avoid cropping by fitting to both width and height)
        const scale = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const finalWidth = imgWidth * scale;
        const finalHeight = imgHeight * scale;
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

        // Restore per-page overrides
        page.style.boxShadow = prevBoxShadow;
        page.style.marginBottom = prevMarginBottom;

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
              {currentPage}/{totalPages}
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
        ref={scrollContainerRef}
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
            '@media print': {
              transform: 'none !important',
            }
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
                  {/*
                    Make the size-range columns dynamic so the grid matches API sizes (no hardcoding).
                    Total columns = 3 fixed + N sizes + 3 fixed (PCS total, unit, amount)
                  */}
                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>Color (s)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>Product Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>Reference</TableCell>
                    <TableCell
                      sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}
                      colSpan={Math.max(...data.orderRows.map((r) => (r.sizeLabels?.length || 0)), 1)}
                    >
                      Size Range
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>Color Total Qty in PCS</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>FOB Unit Price ($)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF', border: '1px solid #000' }}>FOB Value Sub Amount ($)</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(() => {
                    const maxSizeCols = Math.max(...data.orderRows.map((r) => (r.sizeLabels?.length || 0)), 0);
                    const sizeCols = Math.max(maxSizeCols, 1);
                    const pad = (arr, len, fill = '') => {
                      const out = Array.isArray(arr) ? [...arr] : [];
                      while (out.length < len) out.push(fill);
                      return out.slice(0, len);
                    };
                    const groupByColor = (rows) => {
                      const m = new Map();
                      (rows || []).forEach((r) => {
                        const key = String(r.color || '');
                        if (!m.has(key)) m.set(key, []);
                        m.get(key).push(r);
                      });
                      return Array.from(m.entries());
                    };
                    return (
                      <>
                        {groupByColor(data.orderRows).map(([color, rows]) => (
                          <React.Fragment key={color || 'NO_COLOR'}>
                            {/* Color row ONCE per color (matches old app) */}
                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                {color || ""}
                              </TableCell>
                              <TableCell colSpan={sizeCols + 5} sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }} />
                  </TableRow>

                            {rows.map((row, idx) => (
                              <React.Fragment key={`${row.sizeRange}-${idx}`}>
                                {/* Size header row */}
                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                    {row.sizeRange || ""}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                    {row.productCode || ""}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                    {row.refLabel || "Size"}
                                  </TableCell>
                                  {pad(row.sizeLabels || [], sizeCols, '').map((lbl, i) => (
                                    <TableCell key={i} sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                      {lbl}
                                    </TableCell>
                                  ))}
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                    PCS
                                  </TableCell>
                                  <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }} />
                                  <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }} />
                  </TableRow>

                                {/* Quantity row (pad blanks as blanks, not 0.00) */}
                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                    {row.sizeRange || ""}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                    {row.productCode || ""}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                    Quantity
                                  </TableCell>
                                  {pad(row.sizeRow || [], sizeCols, null).map((val, i) => (
                                    <TableCell key={i} sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                      {val === null || val === undefined ? '' : data.fmtSmart(val)}
                                    </TableCell>
                                  ))}
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                    {toNumber(row.totalQtyNum) > 0 ? `${data.fmtQty(row.totalQtyNum)} PCS` : 'PCS'}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                    {idx === 0 ? `$${data.fmtMoney(row.unitNum)}` : ''}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                                    {idx === 0 ? `$${data.fmtMoney(row.amountNum)}` : ''}
                                  </TableCell>
                  </TableRow>
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        ))}

                  <TableRow sx={{ borderBottom: "1px solid black" }}>
                    <TableCell colSpan={sizeCols + 3} sx={{ textAlign: "right", fontWeight: "bold", fontSize: '0.70rem', padding: '2px 4px', color: '#000000', backgroundColor: '#FFFFFF' }}>Total:-</TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: '0.70rem', padding: '2px 8px', color: '#000000', backgroundColor: '#FFFFFF' }}>
                      {data.fmtInt(data.orderRows.reduce((sum, r) => sum + (r.totalQtyNum || 0), 0))}
                    </TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                    <TableCell sx={{ padding: '2px 4px', backgroundColor: '#FFFFFF' }}></TableCell>
                  </TableRow>
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </TableContainer>

            {/* PO Total Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1px 0', fontSize: '0.70rem', color: '#000000', backgroundColor: '#FFFFFF' }}>
              <Box sx={{ fontWeight: 'bold', display: 'flex', minWidth: 0 }}>
                {(() => {
                  const totalPcs = data.orderRows.reduce((sum, r) => sum + (r.totalQtyNum || 0), 0);
                  const pcsPerCartonNum = toNumber(data.pcsPerCarton);
                  const dz = totalPcs ? totalPcs / 12 : 0;
                  const ctn = pcsPerCartonNum > 0 ? totalPcs / pcsPerCartonNum : 0;
                  const computedDetailsParts = [
                    totalPcs ? `${data.fmtDz(dz)} Dz` : '',
                    ctn ? `${data.fmtInt(Math.round(ctn))} Ctn` : '',
                  ].filter(Boolean);

                  const detailsText = data.poTotalDetails || '';

                  return (
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'baseline',
                        gap: 2,
                        flexWrap: 'wrap',
                        minWidth: 0,
                      }}
                    >
                      <Box component="span">P.O Total:</Box>
                      <Box component="span" sx={{ minWidth: 0 }}>
                        {data.fmtInt(totalPcs)}
                      </Box>
                      <Box component="span">PCS</Box>
                      {detailsText ? (
                        <Box component="span" sx={{ ml: 1 }}>
                          {detailsText}
                        </Box>
                      ) : computedDetailsParts.length ? (
                        <Box component="span" sx={{ display: 'inline-flex', gap: 3, ml: 1, flexWrap: 'wrap' }}>
                          {computedDetailsParts.map((t) => (
                            <Box component="span" key={t}>
                              {t}
                            </Box>
                          ))}
                        </Box>
                      ) : null}
                    </Box>
                  );
                })()}
              </Box>
              <Box sx={{ display: 'flex', fontWeight: 'bold' }}>
                <Box sx={{ textAlign: 'left', pr: 0.5, pl: 0.5, backgroundColor: '#f0f0f0', color: '#000000' }}>
                  P.O Net FOB Value $
                </Box>
                <Box sx={{ textAlign: 'left', pr: 0.5, pl: 0.5, backgroundColor: '#f0f0f0', minWidth: '60px', color: '#000000' }}>
                  {data.fmtMoney(data.orderRows.reduce((sum, r) => sum + (r.amountNum || 0), 0))}
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
                      <Typography sx={{ fontSize: '11px', color: '#000000' }}>{poData.moreInfo || 'N/A'}</Typography>
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
                  {data.amsTeam}
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
                  {secondPageData.preparedBy}
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

              {/* Main Title */}
              <Box sx={{ width: '100%', textAlign: 'center', mb: 3 }}>
                <Typography sx={{ fontSize: '24px', fontWeight: 'bold', color: '#000000', letterSpacing: 1 }}>
                  {data.orderRows?.[0]?.color || ""}
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
                  Qty: {data.totalQty || ""}
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