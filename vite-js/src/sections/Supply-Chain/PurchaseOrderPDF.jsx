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
  Close,
  ArrowBack
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HOST_API } from 'src/config-global';

const PO_IMAGE_PLACEHOLDER = '/assets/placeholder.svg';

/** True when the API returned raw Base64 bytes without a `data:image/…;base64,` prefix. */
function looksLikeRawBase64Image(raw) {
  if (raw == null) return false;
  const s = String(raw).trim();
  if (s.length < 24) return false;
  if (s.startsWith('data:')) return false;
  if (s.startsWith('blob:')) return false;
  if (/^https?:\/\//i.test(s)) return false;
  // Magic prefixes BEFORE `/` path check — JPEG payloads start with `/9j/`.
  if (s.startsWith('/9j/')) return true;
  if (s.startsWith('iVBOR')) return true;
  if (s.startsWith('R0lGOD')) return true;
  if (s.startsWith('UklGR')) return true;
  if (s.startsWith('Qk')) return true;
  if (s.startsWith('/')) return false;
  if (s.length < 80) return false;
  return /^[A-Za-z0-9+/=\r\n\s_-]+$/.test(s.slice(0, 256));
}

function sniffBase64Mime(raw) {
  const s = String(raw || '').trim();
  if (s.startsWith('/9j/')) return 'image/jpeg';
  if (s.startsWith('iVBOR')) return 'image/png';
  if (s.startsWith('R0lGOD')) return 'image/gif';
  if (s.startsWith('UklGR')) return 'image/webp';
  if (s.startsWith('Qk')) return 'image/bmp';
  return 'image/jpeg';
}

/**
 * Normalize API `poImage` (raw Base64, data URL, absolute URL, or relative path)
 * into a browser-safe `<img src>`.
 */
function resolvePoImageSrc(raw) {
  if (raw == null || raw === '') return PO_IMAGE_PLACEHOLDER;

  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  if (!s || s === '0x') return PO_IMAGE_PLACEHOLDER;

  if (/^data:image\//i.test(s)) return s;
  if (s.startsWith('blob:')) return s;
  if (/^https?:\/\//i.test(s)) return s;

  if (looksLikeRawBase64Image(s)) {
    const b64 = s.replace(/\s+/g, '');
    return `data:${sniffBase64Mime(b64)};base64,${b64}`;
  }

  if (s.startsWith('/')) {
    const base = String(HOST_API || '').replace(/\/+$/, '');
    return base ? `${base}${s}` : s;
  }

  const base = String(HOST_API || '').replace(/\/+$/, '');
  if (base && /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(s)) {
    return `${base}/${s.replace(/^\/+/, '')}`;
  }

  const b64 = s.replace(/\s+/g, '');
  if (b64.length >= 24 && /^[A-Za-z0-9+/=_-]+$/.test(b64)) {
    return `data:${sniffBase64Mime(b64)};base64,${b64}`;
  }

  return PO_IMAGE_PLACEHOLDER;
}

function handlePoImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = PO_IMAGE_PLACEHOLDER;
}

// ============================================================================
// DESIGN TOGGLE SWITCH
// ============================================================================
export const USE_NEW_PO_DESIGN = true;

// --- Legacy / Original Helper Components ---
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

// ============================================================================
// ORIGINAL / LEGACY DESIGN (PRESERVED EXACTLY AS IS FOR SAFE FALLBACK)
// ============================================================================
const LegacyPurchaseOrderPageExactMatch = ({ poData: propPoData, onClose }) => {
  const componentRef = useRef();
  const scrollContainerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const { id } = useParams();
  const navigate = useNavigate();
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(!!id && !propPoData);

  useEffect(() => {
    const fetchPurchaseOrderData = async () => {
      if (!id || propPoData) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: token ? `Bearer ${token}` : '' };

        const [reportRes, fallbackRes] = await Promise.all([
          axios.get(`${HOST_API}/api/Report/GeneratePOReport?poid=${id}`, { headers }),
          axios.get(`${HOST_API}/api/MyOrders/GetPurchaseOrder/${id}`, { headers }).catch(() => ({ data: [] }))
        ]);

        let reportData = reportRes.data;
        const orderData = Array.isArray(fallbackRes.data) ? fallbackRes.data[0] : fallbackRes.data;
        const isEmpty = !reportData || (Array.isArray(reportData) && reportData.length === 0);

        if (!isEmpty) {
          // Inject missing fields from base API if the report API omitted them
          if (orderData) {
            reportData = reportData.map(r => ({
              ...r,
              poImage: r.poImage || orderData.poImage,
              buyerCustomer: r.buyerCustomer || orderData.buyerCustomer || r.customerName || orderData.customerName || '',
              consigneeAddress1: r.consigneeAddress1 || orderData.consigneeAddress1 || orderData.consignee || '',
              consigneeAddress2: r.consigneeAddress2 || orderData.consigneeAddress2 || '',
              otherFabric: r.otherFabric || orderData.otherFabric || '',
              construction: r.construction || orderData.construction || '',
              ribGSM: r.ribGSM || orderData.ribGSM || r.ribGsm || orderData.ribGsm || r.RibGSM || orderData.RibGSM || '',
              assortment: r.assortment || orderData.assortment || '',
            }));
          }
          setFetchedData(reportData);
        } else {
          // Fallback: fetch style/item rows separately
          try {
            const styleRes = await axios.get(`${HOST_API}/api/Milestone/GetStyle?poid=${id}`, { headers }).catch(() => ({ data: [] }));

            const order = orderData;
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
              assortment: order.assortment || '',
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
              otherFabric: order.otherFabric || '',
              construction: order.construction || '',
              ribGSM: order.ribGSM || order.ribGsm || order.RibGSM || '',
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

    // If API didnâ€™t provide s1.. fields, fall back to existing 4 qty fields (keeps layout working)
    if (!qty.length) {
      const fallbackQty = [obj?.s1, obj?.s2, obj?.s3, obj?.s4].filter(
        (v) => v !== undefined && v !== null && String(v).trim() !== ''
      );
      fallbackQty.forEach((v) => qty.push(toNumber(v)));
      // No hardcoded size names; leave labels empty when API doesnâ€™t send them
      while (labels.length < qty.length) labels.push('');
    }

    return { labels, qty };
  };

  const data = {
    ref: poData.amsRefNo || '',
    receivedDate: (poData.creationDate && !poData.creationDate.startsWith('1900-01-01'))
      ? new Date(poData.creationDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '',
    attn: poData.supplierName || '',
    addressLeft: poData.venderAddress || '',
    trackingCode: poData.venderCode || '',
    brand: poData.brand || '',
    division: poData.ecpDivistion || '',
    rn: poData.rnNo || '',
    shipTo: poData.consigneeAddress1 || '',
    itemDescription: poData.itemDescriptionShippingInvoice || '',
    exFactory: (poData.shipmentDate && !poData.shipmentDate.startsWith('1900-01-01')) ? new Date(poData.shipmentDate).toLocaleDateString('en-US') : '',
    finalInspection: (poData.finalInspDate && !poData.finalInspDate.startsWith('1900-01-01')) ? new Date(poData.finalInspDate).toLocaleDateString('en-US') : '',
    leadtime: poData.leadtime ? `${poData.leadtime} Days` : '',
    fabric: {
      description: 'Body',
      fabric: poData.fabric || '',
      content: poData.quality || '',
      weight: poData.gms ? `${poData.gms} gsm` : ''
    },
    packingInstructions: poData.packingList || '',
    cartonMarking: poData.cartonMarking || '',
    pcsPerCarton: poData.pcPerCarton || '',
    ration: poData.ration || '',
    ratio: poData.ratio || poData.ration || '',
    assortment: poData.assortment || '',
    orderRows: buildOrderRowsFromReport(reportRows),
    get totalQtyNum() {
      return this.orderRows.reduce((sum, row) => sum + (row.totalQtyNum || 0), 0);
    },
    get totalAmountNum() {
      return this.orderRows.reduce((sum, row) => sum + (row.amountNum || 0), 0);
    },
    importantNotes: poData.importantNote ? [poData.importantNote] : [
      "Fabric should be heat set and lock properly to avoid shrinkage problem.",
      "Before cutting fabric should be kept on table for atleast 24 hours.",
      "All garments should be 100% checked for sizes before carton packing"
    ],
    productImage: resolvePoImageSrc(poData.poImage),
    shipMode: poData.deliveryTypeDisplayName || '',
    destination: poData.destination || '',
    shipmentTerms: poData.shipmentModeName || '',
    paymentTerms: poData.paymentModeName || '',
    amsTeam: poData.userName || 'MUHAMMAD SHAHZAIB',
    cpoNumber: poData.pono || '',
    styleNumber: poData.style || '',
    productCategory: poData.productCategoriesName || '',
    specialInstructions: poData.pO_Special_Instructions || '',
    source: poData.styleSource || 'Local',
    embellishment: poData.embAndEmbellishment || 'Not Required',
    trimsAccessories: poData.trimsAccessories || '',
    specialOperation: poData.pO_Special_Operation || '',
    samplingReq: poData.samplingReq || 'N/A',
    otherFabric: poData.otherFabric || '',
    construction: poData.construction || '',
    gsmOF: poData.ribGSM || poData.ribGsm || poData.RibGSM || '',
    beneficiaryBank: poData.bankNameBank || '',
    accountNo: poData.accountNoBank || '',
    routingNo: poData.ibanBank || '',
    washingInstructions: poData.washingCareLabelInstructions || 'Machine Wash Cold With Like Colors, Gentle Cycle, Non Chlorine Bleach when needed, Line Dry, Cool Iron.',
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

  const isSolid = String(data.assortment || '').toLowerCase() === 'solid' || String(data.ratio || '').toLowerCase() === 'solid';

  // Second page data
  const secondPageData = {
    companyName: poData.companyName || "APPAREL MERCHANDISING SERVICES",
    preparedBy: poData.userName || 'MUHAMMAD SHAHZAIB',
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
      {
        header: "Delay penalties will be charged as under:",
        subItems: [
          { label: "01 Week Delay", value: "5% of Invoice value" },
          { label: "02 Weeks Delay", value: "8% of Invoice Value" },
          { label: "03 Weeks Delay", value: "12 % of Invoice Value" },
          { label: "Onward", value: "16 % of Invoice Value" },
        ]
      },
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

  // Download as PDF functionality
  const handleDownloadPDF = async () => {
    const element = componentRef.current;
    const originalTransform = element.style.transform;
    const originalTransition = element.style.transition;

    try {
      element.style.transform = 'scale(1)';
      element.style.transition = 'none';

      const pages = Array.from(element.children);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!(page instanceof HTMLElement)) continue;

        const prevBoxShadow = page.style.boxShadow;
        const prevMarginBottom = page.style.marginBottom;
        page.style.boxShadow = 'none';
        page.style.marginBottom = '0';

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        const scale = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const finalWidth = imgWidth * scale;
        const finalHeight = imgHeight * scale;
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

        page.style.boxShadow = prevBoxShadow;
        page.style.marginBottom = prevMarginBottom;

        if (i < pages.length - 1) {
          pdf.addPage();
        }
      }

      pdf.save(`Purchase_Order_${data.ref}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
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
          color: '#fff',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: 'none'
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: '48px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <IconButton
              size="small"
              onClick={() => navigate(-1)}
              sx={{ color: '#fff', mr: 1 }}
              title="Back to Orders"
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              Purchase Order - {data.ref}
            </Typography>
            <Typography sx={{ fontSize: '12px', ml: 2 }}>
              {currentPage}/{totalPages}
            </Typography>
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
            <IconButton size="small" onClick={handleDownloadPDF} sx={{ color: '#fff' }}>
              <Download fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handlePrint} sx={{ color: '#fff' }}>
              <Print fontSize="small" />
            </IconButton>
            {onClose && (
              <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
                <Close fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

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
          {/* First Page - Pixel Perfect Match */}
          <Box
            sx={{
              p: '5mm 10mm',
              fontFamily: '"Arial Narrow", Arial, sans-serif',
              fontSize: '10.5px',
              lineHeight: '1.2',
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
                p: '2mm 5mm',
                m: 0,
                width: '100%',
                minHeight: '100%',
                transform: 'none',
                marginBottom: 0
              }
            }}
          >
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
              <Box sx={{ width: '45%' }}>
                <img
                  src="/logo/AMSlogo.png"
                  alt="AMS Logo"
                  style={{ width: '160px', height: 'auto', display: 'block', marginBottom: '2px' }}
                />
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                  APPAREL MERCHANDISING SERVICES
                </Typography>
                <Typography sx={{ fontSize: '10.5px', whiteSpace: 'nowrap', mt: 0.5 }}>
                  A M S House 84, Kokan Housing Society Alamgir Road - Postal Code: 74800
                </Typography>
                <Typography sx={{ fontSize: '10.5px', whiteSpace: 'nowrap' }}>
                  Karachi - Pakistan. &nbsp; &nbsp; Telephone # : 02134937216 & 02134946005
                </Typography>
              </Box>

              <Box sx={{ flex: 1, textAlign: 'center', pt: 2 }}>
                <Typography sx={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                  Purchase Order
                </Typography>
              </Box>

              <Box sx={{ width: '30%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Box sx={{ width: '130px', height: '140px', mb: 0.5 }}>
                  <img
                    src={data.productImage}
                    alt="Product"
                    onError={handlePoImageError}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: '9.5px', fontWeight: 'bold' }}>AMS - Ref # : &nbsp; &nbsp; {data.ref}</Typography>
                  <Typography sx={{ fontSize: '9.5px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>P.O Received Date : &nbsp; {data.receivedDate}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Address Blocks */}
            <Box sx={{ display: 'flex', mb: 0.5, minHeight: '85px' }}>
              <Box sx={{ flex: 1, border: '1px solid #000', p: 0.5, mr: '-1px', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Typography sx={{ fontWeight: 'bold', minWidth: '35px', fontSize: '10px' }}>Attn :</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '12px' }}>{data.attn}</Typography>
                </Box>
                <Box sx={{ mt: 0.5, flex: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', lineHeight: 1.1 }}>{data.addressLeft}</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', lineHeight: 1.1 }}>Karachi Pakistan</Typography>
                </Box>
                <Box sx={{ display: 'flex', mt: 0.5, pt: 0.2 }}>
                  <Typography sx={{ fontWeight: 'bold', minWidth: '80px', fontSize: '9px' }}>Tracking Code:-</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>{data.trackingCode}</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1.2, border: '1px solid #000', p: 0.5, mr: '-1px', display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '8px', mb: 0.3 }}>Customer,Brand / Label Name & Division:</Typography>
                <Typography sx={{ fontWeight: 'bold', mb: 0.2, fontSize: '12px' }}>LR</Typography>
                <Box sx={{ display: 'flex', mb: 0.2 }}>
                  <Typography sx={{ minWidth: '45px', fontWeight: 'bold', fontSize: '10px' }}>Brand:</Typography>
                  <Typography sx={{ fontSize: '10px' }}>{data.brand}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 0.2 }}>
                  <Box sx={{ display: 'flex' }}>
                    <Typography sx={{ minWidth: '45px', fontWeight: 'bold', fontSize: '9px' }}>Division:</Typography>
                    <Typography sx={{ fontSize: '9px' }}>{data.division}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '9px' }}>R.N # :</Typography>
                    <Typography sx={{ ml: 0.5, fontSize: '9px' }}>{data.rn}</Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ flex: 1, border: '1px solid #000', p: 0.5, display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '8.5px', mb: 0.3 }}>Ship To:</Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>{poData.buyerCustomer || poData.customerName || 'ALL SEASONS TEXTILE'}</Typography>
                <Typography sx={{ fontSize: '8.5px', lineHeight: 1.1 }}>{poData.consigneeAddress1 || poData.consignee || ''}</Typography>
                <Typography sx={{ fontSize: '8.5px', lineHeight: 1.1 }}>{poData.consigneeAddress2 || ''}</Typography>
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', pt: 0.2 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px' }}>NY</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px' }}>USA</Typography>
                </Box>
              </Box>
            </Box>

            {/* Item Description & Shipment Details Combined Section */}
            <Box sx={{ display: 'flex', border: '1px solid #000', mb: 0.5, minHeight: '60px' }}>
              {/* Left Section: Item Description and Dates */}
              <Box sx={{ flex: 3.5, p: '4px 6px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.1, gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '10px', minWidth: '85px' }}>Item Description :</Typography>
                  <Typography sx={{ fontSize: '9.5px', fontWeight: 'bold' }}>Ex-Factory(Ship Date)</Typography>
                  <Typography sx={{ fontSize: '10.5px' }}>{data.exFactory} - {data.exFactory}</Typography>
                  <Typography sx={{ fontSize: '9.5px', fontWeight: 'bold' }}>Lead Time</Typography>
                  <Typography sx={{ fontSize: '10.5px' }}>{data.leadtime}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.2, pl: '100px', gap: 1.5 }}>
                  <Typography sx={{ fontSize: '9.5px', fontWeight: 'bold' }}>Final Inspection Date</Typography>
                  <Typography sx={{ fontSize: '10.5px' }}>{data.finalInspection}</Typography>
                </Box>
                <Box sx={{ mt: 0.5 }}>
                  <Typography sx={{ fontWeight: 'normal', fontSize: '11.5px', lineHeight: 1.2 }}>{data.itemDescription}</Typography>
                </Box>
              </Box>

              {/* Right Section: Shipment Details Columns */}
              <Box sx={{ flex: 1.8, display: 'flex', textAlign: 'center' }}>
                <Box sx={{ flex: 0.8, borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '8.5px', p: '2px 0', borderBottom: '1px solid #fff' }}>Ship Mode:</Typography>
                  <Box sx={{ flex: 1 }}></Box>
                  <Typography sx={{ fontSize: '9.5px', pb: '2px' }}>{data.shipMode}</Typography>
                </Box>
                <Box sx={{ flex: 1.2, borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '8.5px', p: '2px 0' }}>Destination:</Typography>
                  <Box sx={{ flex: 1 }}></Box>
                  <Typography sx={{ fontSize: '9.5px', pb: '2px' }}>{data.destination}</Typography>
                </Box>
                <Box sx={{ flex: 1, borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '8.5px', p: '2px 0' }}>Shipment Terms:</Typography>
                  <Box sx={{ flex: 1 }}></Box>
                  <Typography sx={{ fontSize: '9.5px', pb: '2px' }}>{data.shipmentTerms}</Typography>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '8.5px', p: '2px 0' }}>Payment Terms:</Typography>
                  <Box sx={{ flex: 1 }}></Box>
                  <Typography sx={{ fontSize: '9.5px', pb: '2px' }}>{data.paymentTerms}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Fabrication / Packing Block - Squared Off Grid */}
            <Box sx={{ mb: 0.5 }}>
              {/* Fabrication Header Title */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2, px: 0.5 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '11px', textDecoration: 'underline' }}>Fabrication Body & Trims</Typography>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>AMS - Team : &nbsp; <span style={{ fontWeight: 'normal' }}>{data.amsTeam}</span></Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>C.P.O # : &nbsp; <span style={{ fontWeight: 'normal' }}>{data.cpoNumber}</span></Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>Style # : &nbsp; <span style={{ fontWeight: 'normal' }}>{data.styleNumber}</span></Typography>
                </Box>
              </Box>

              {/* Data Grid - Proper Table for perfect column alignment */}
              <Table debug size="small" sx={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #000', tableLayout: 'fixed', borderBottom: '1px solid black' }}>
                <colgroup>
                  <col style={{ width: '12.5%' }} />
                  <col style={{ width: '15.5%' }} />
                  <col style={{ width: '23.5%' }} />
                  <col style={{ width: '12.5%' }} />
                  <col style={{ width: '23.5%' }} />
                  <col style={{ width: '12.5%' }} />
                </colgroup>
                <TableBody>
                  {/* Header Row */}
                  <TableRow sx={{ backgroundColor: '#f9f9f9' }} debug>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '9px', p: '2px 6px', textAlign: 'center' }}>Description</TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '9px', p: '2px 6px', textAlign: 'center' }}>Fabric</TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '9px', p: '2px 6px', textAlign: 'center' }}>Content</TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '9px', p: '2px 6px', textAlign: 'center' }}>Weight</TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '9px', p: '2px 6px', textAlign: 'center' }}>Packing Instructions</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '9px', p: '2px 6px', textAlign: 'center' }}>
                      {isSolid ? 'Solid:' : 'Assortment:'}
                    </TableCell>
                  </TableRow>
                  {/* Body Row */}
                  <TableRow>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '10px', p: '4px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                      Body
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '10px', p: '4px', textAlign: 'center', verticalAlign: 'middle' }}>{data.fabric.fabric}</TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '10px', p: '4px', textAlign: 'center', verticalAlign: 'middle' }}>{data.fabric.content}</TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '10px', p: '4px', textAlign: 'center', verticalAlign: 'middle' }}>{data.fabric.weight}</TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', fontSize: '9.5px', p: '4px 8px', verticalAlign: 'middle', lineHeight: 1.2 }}>{data.packingInstructions}</TableCell>
                    <TableCell sx={{ fontSize: '10px', p: '4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {isSolid ? 'Solid' : (data.ratio ? (String(data.ratio).toLowerCase().startsWith('ratio') ? data.ratio : `Ratio: ${data.ratio}`) : '')}
                    </TableCell>
                  </TableRow>
                  {/* Other Row */}
                  <TableRow sx={{ borderBottom: '1px solid black' }} debug>
                    <TableCell debug sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '10px', p: '4px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                      Other
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '10px', p: '4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {data.otherFabric}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '10px', p: '4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {data.construction}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '10px', p: '4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {data.gsmOF ? `${data.gsmOF} gsm` : ''}
                    </TableCell>
                    <TableCell sx={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '9.5px', p: '4px 8px', verticalAlign: 'middle', lineHeight: 1.2 }}>&nbsp;</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #000', fontSize: '10px', p: '4px', textAlign: 'center', verticalAlign: 'middle' }}>&nbsp;</TableCell>
                  </TableRow>
                  <TableRow debug></TableRow>
                </TableBody>
              </Table>
            </Box>

            {/* Product & Marking Strip - Squared Off Row */}
            <Box sx={{ display: 'flex', border: '1px solid #000', mb: 0.5, backgroundColor: '#fff' }}>
              <Box sx={{ flex: 1, borderRight: '1px solid #000', p: '3px 8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>Product Category:</Typography>
                <Typography sx={{ fontSize: '10px' }}>{data.productCategory}</Typography>
              </Box>
              <Box sx={{ flex: 1, borderRight: '1px solid #000', p: '3px 8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>Pcs Per Carton:</Typography>
                <Typography sx={{ fontSize: '10px' }}>{data.pcsPerCarton}</Typography>
              </Box>
              <Box sx={{ flex: 1.5, p: '3px 8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>Carton Marking :</Typography>
                <Typography sx={{ fontSize: '10px' }}>{data.cartonMarking}</Typography>
              </Box>
            </Box>

            {/* Main Quantity Grid - Compact Row Style */}
            <Box sx={{ mb: 0.1 }}>
              <Table size="small" sx={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #000' }}>
                <TableBody>
                  {/* Header Row - Compact */}
                  <TableRow sx={{ height: '18px' }}>
                    <TableCell sx={{ borderBottom: '1px solid #000', p: '0px 4px', fontSize: '8.5px', fontWeight: 'bold', width: '85px' }}>Color (s)</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #000', p: '0px 4px', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '75px' }}>Product Code</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #000', p: '0px 4px', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '65px' }}>Reference</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #000', p: '0px 4px', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '75px' }}>Size Range</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #000', p: '0px', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center' }} colSpan={10}>&nbsp;</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #000', p: '0px 4px', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '115px' }}>Color Total Qty in PCS</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #000', p: '0px 4px', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '75px' }}>FOB Unit Price (s)</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #000', p: '0px 4px', fontSize: '8.5px', fontWeight: 'bold', textAlign: 'center', width: '95px' }}>FOB Value Sub Amount</TableCell>
                  </TableRow>

                  {data.orderRows.map((row, idx) => {
                    const sizeCols = 10;
                    const labels = [...(row.sizeLabels || [])].slice(0, sizeCols);
                    while (labels.length < sizeCols) labels.push('');
                    const qtyValues = [...(row.sizeRow || [])].slice(0, sizeCols);
                    while (qtyValues.length < sizeCols) qtyValues.push(null);

                    return (
                      <React.Fragment key={idx}>
                        {/* Color Strip Row - Condensed */}
                        <TableRow sx={{ height: '14px' }}>
                          <TableCell colSpan={17} sx={{ borderBottom: '1px solid #000', p: '0px 6px', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', lineHeight: 1 }}>
                            {row.color}
                          </TableCell>
                        </TableRow>

                        {/* Size Headers Row - Condensed */}
                        <TableRow sx={{ height: '14px' }}>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px 6px', fontSize: '9px', fontWeight: 'bold', lineHeight: 1 }}>{row.sizeRange}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px', textAlign: 'center', fontSize: '9px', lineHeight: 1 }}>{row.productCode || 'NA'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px', textAlign: 'center' }}>&nbsp;</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px 6px', fontSize: '9px', lineHeight: 1 }}>Size</TableCell>
                          {labels.map((lbl, i) => (
                            <TableCell key={i} sx={{ borderBottom: '1px solid #000', p: '0px', textAlign: 'center', fontSize: '8.5px', lineHeight: 1 }}>{lbl}</TableCell>
                          ))}
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px', textAlign: 'center', fontSize: '9px', lineHeight: 1 }}>PCS</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px' }}>&nbsp;</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px' }}>&nbsp;</TableCell>
                        </TableRow>

                        {/* Quantity Row - Condensed */}
                        <TableRow sx={{ height: '14px' }}>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px' }}>&nbsp;</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px' }}>&nbsp;</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px' }}>&nbsp;</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px 6px', fontSize: '9px', lineHeight: 1 }}>Quantity</TableCell>
                          {qtyValues.map((val, i) => (
                            <TableCell key={i} sx={{ borderBottom: '1px solid #000', p: '0px', textAlign: 'center', fontSize: '9px', lineHeight: 1 }}>{val === null ? <>&nbsp;</> : data.fmtInt(val)}</TableCell>
                          ))}
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px', textAlign: 'center', fontWeight: 'bold', fontSize: '9px', lineHeight: 1 }}>{data.fmtInt(row.totalQtyNum)} PCS</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px', textAlign: 'center', fontSize: '9px', lineHeight: 1 }}>$ &nbsp; {data.fmtMoney(row.unitNum)}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #000', p: '0px', textAlign: 'center', fontWeight: 'bold', fontSize: '9px', lineHeight: 1 }}>$ &nbsp; {data.fmtMoney(row.amountNum)}</TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}

                  {/* Total:- Row (Integrated) - Condensed */}
                  <TableRow sx={{ height: '16px' }}>
                    <TableCell colSpan={14} sx={{ borderBottom: '1.5px solid #000', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', pl: 10, lineHeight: 1 }}>Total:-</TableCell>
                    <TableCell sx={{ borderBottom: '1.5px solid #000', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', lineHeight: 1 }}>{data.fmtInt(data.totalQtyNum)}</TableCell>
                    <TableCell sx={{ borderBottom: '1.5px solid #000', p: '0px' }}>&nbsp;</TableCell>
                    <TableCell sx={{ borderBottom: '1.5px solid #000', p: '0px' }}>&nbsp;</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            {/* Summaries Strip - Compact */}
            <Box sx={{ borderTop: '2px solid #000', mb: 1, mt: '-1px' }}>
              <Table size="small" sx={{ borderCollapse: 'collapse', width: '100%' }}>
                <TableBody>
                  <TableRow sx={{ height: '22px' }}>
                    <TableCell sx={{ width: '80px' }}></TableCell>
                    <TableCell sx={{ width: '100px', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>P.O Total:</TableCell>
                    <TableCell sx={{ width: '60px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>{data.fmtInt(data.totalQtyNum)}</TableCell>
                    <TableCell sx={{ width: '70px', textAlign: 'left', fontWeight: 'bold', fontSize: '11px' }}>PCS</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>{data.fmtMoney(data.totalQtyNum / 12)} Dz</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>{data.pcsPerCarton > 0 ? Math.round(data.totalQtyNum / data.pcsPerCarton) : 0} Ctn</TableCell>
                    <TableCell sx={{ width: '140px', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>P.O Net FOB Value:</TableCell>
                    <TableCell sx={{ width: '30px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>$</TableCell>
                    <TableCell sx={{ width: '90px', textAlign: 'right', fontWeight: 'bold', fontSize: '11px', pr: 1 }}>{data.fmtMoney(data.totalAmountNum)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            {/* Instruction Blocks - Matched to Target Design */}
            <Box sx={{ mb: 0.5 }}>
              {/* Row 1: Special Instructions & Source */}
              <Box sx={{ display: 'flex', border: '1px solid #000' }}>
                <Box sx={{ width: '90px', borderRight: '1px solid #000', p: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>Special Instructions</Typography>
                </Box>
                <Box sx={{ flex: 1, borderRight: '1px solid #000', p: '6px 10px', minHeight: '70px' }}>
                  <Typography sx={{ fontSize: '9.5px', lineHeight: 1.2 }}>{data.specialInstructions}</Typography>
                </Box>
                <Box sx={{ width: '180px', p: '4px' }}>
                  <Typography sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '10px' }}>Source</Typography>
                  <Box sx={{ display: 'flex', px: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '9px' }}>Fabric</Typography>
                      <Typography sx={{ fontSize: '9.5px' }}>{data.source}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '9px' }}>Trims & Accessories</Typography>
                      <Typography sx={{ fontSize: '9.5px' }}>{data.trimsAccessories}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Row 2: Important Note & Special Operation */}
              <Box sx={{ display: 'flex', border: '1px solid #000', borderTop: 'none' }}>
                <Box sx={{ width: '90px', borderRight: '1px solid #000', p: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>Important Note:</Typography>
                </Box>
                <Box sx={{ flex: 1, borderRight: '1px solid #000', p: '6px 10px', minHeight: '70px' }}>
                  {data.importantNotes.map((note, i) => (
                    <Typography key={i} sx={{ fontSize: '9.5px', lineHeight: 1.2 }}>{note}</Typography>
                  ))}
                </Box>
                <Box sx={{ width: '180px', p: '4px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', px: 0.5 }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>Special Operation</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '9.5px' }}>Emb & Embellishment :</Typography>
                      <Typography sx={{ fontSize: '9.5px' }}>{data.embellishment}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Row 3: More Info */}
              <Box sx={{ display: 'flex', border: '1px solid #000', borderTop: 'none' }}>
                <Box sx={{ width: '90px', borderRight: '1px solid #000', p: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>More Info :</Typography>
                </Box>
                <Box sx={{ flex: 1, p: '4px 10px' }}>
                  <Typography sx={{ fontSize: '10px' }}>{poData.moreInfo || 'N/A'}</Typography>
                </Box>
              </Box>

              {/* Row 4: Sampling Req */}
              <Box sx={{ display: 'flex', border: '1px solid #000', borderTop: 'none' }}>
                <Box sx={{ width: '90px', borderRight: '1px solid #000', p: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '10px' }}>Sampling Req :</Typography>
                </Box>
                <Box sx={{ flex: 1, p: '4px 10px' }}>
                  <Typography sx={{ fontSize: '10px' }}>{data.samplingReq}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Banking & Washing - 3 Column Style */}
            <Box sx={{ display: 'flex', border: '1px solid #000', mb: 0.5 }}>
              {/* Left Column: Bank Details */}
              <Box sx={{ flex: 1, borderRight: '1px solid #000', p: '4px 8px', display: 'flex', flexDirection: 'column', minHeight: '85px' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '10px', mb: 0.5 }}>Beneficiary's Bank :</Typography>
                <Typography sx={{ fontSize: '10.5px', fontWeight: 'bold' }}>{data.beneficiaryBank}</Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Typography sx={{ fontSize: '10px' }}>Account No. : &nbsp; {data.accountNo}</Typography>
                  <Typography sx={{ fontSize: '10px' }}>Routing No. : &nbsp; {data.routingNo}</Typography>
                </Box>
              </Box>

              {/* Center Column: Empty */}
              <Box sx={{ flex: 0.8, borderRight: '1px solid #000' }}></Box>

              {/* Right Column: Washing Instructions */}
              <Box sx={{ flex: 1.2, p: '4px 10px' }}>
                <Typography sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '10px' }}>Washing - Care Label Instructions</Typography>
                <Typography sx={{ fontSize: '9.5px', lineHeight: 1.3 }}>{data.washingInstructions}</Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 'bold' }}>All Season Textile Inc.</Typography>
            </Box>

            {/* Signatures Area */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto', pt: 3, mb: 1 }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 0.5 }}></Box>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Mr. Mushtaq Ashraf</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 0.5 }}></Box>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Prepared & Checked by</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 0.5 }}></Box>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Factory Acknowledgement</Typography>
              </Box>
            </Box>

            {/* Footer Area */}
            <Box sx={{ pt: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '10px', color: '#666' }}>ERP Solution Provider : www.itg.net.pk</Typography>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold', position: 'absolute', right: 0 }}>Page # : 1 / 3</Typography>
            </Box>
          </Box>

          {/* Second Page - Terms & Conditions */}
          <Box
            sx={{
              p: '8mm',
              fontFamily: 'Arial, sans-serif',
              fontSize: '12px',
              lineHeight: '1.4',
              width: '210mm',
              minHeight: '297mm',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              marginBottom: '10mm',
              '@media print': {
                boxShadow: 'none',
                p: '5mm',
                m: 0,
                width: '100%',
                minHeight: '100%',
                transform: 'none',
                marginBottom: 0
              },
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ mb: 4, mt: 2 }}>
              <img
                src="/logo/AMSlogo.png"
                alt="AMS Logo"
                style={{ width: '220px', height: 'auto', display: 'block', marginBottom: '45px' }}
              />

              <Box sx={{ pl: 1 }}>
                {secondPageData.termsAndConditions.map((term, index) => {
                  if (typeof term === 'string') {
                    return (
                      <Box key={index} sx={{ display: 'flex', mb: 2, alignItems: 'flex-start' }}>
                        <Typography sx={{ fontSize: '14px', mr: 1.5, minWidth: '25px', textAlign: 'right' }}>{index + 1}.</Typography>
                        <Typography sx={{ flex: 1, fontSize: '14.5px', lineHeight: 1.4 }}>{term}</Typography>
                      </Box>
                    );
                  }
                  return (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', mb: 1, alignItems: 'flex-start' }}>
                        <Typography sx={{ fontSize: '14px', mr: 1.5, minWidth: '25px', textAlign: 'right' }}>{index + 1}.</Typography>
                        <Typography sx={{ flex: 1, fontSize: '14.5px', lineHeight: 1.4 }}>{term.header}</Typography>
                      </Box>
                      <Box sx={{ pl: '40px' }}>
                        {term.subItems.map((sub, sIdx) => (
                          <Box key={sIdx} sx={{ display: 'flex', mb: 0.5, maxWidth: '500px' }}>
                            <Typography sx={{ flex: 1.2, fontSize: '14px' }}>{sub.label}</Typography>
                            <Typography sx={{ flex: 1, fontSize: '14px' }}>{sub.value}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Signatures Area */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto', pt: 3, mb: 1 }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 0.5 }}></Box>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Mr. Mushtaq Ashraf</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 0.5 }}></Box>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Prepared & Checked by</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Box sx={{ borderBottom: '1px solid #000', width: '150px', margin: '0 auto', mb: 0.5 }}></Box>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Factory Acknowledgement</Typography>
              </Box>
            </Box>

            <Box sx={{ pt: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>ERP Solution Provider : www.itg.net.pk</Typography>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Page # : 2 / 3</Typography>
            </Box>
          </Box>

          {/* Third Page - Product Details & Signatures */}
          <Box
            sx={{
              p: '8mm',
              fontFamily: 'Arial, sans-serif',
              fontSize: '12px',
              lineHeight: '1.4',
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
                p: '5mm',
                m: 0,
                width: '100%',
                minHeight: '100%',
                transform: 'none',
                marginBottom: 0
              }
            }}
          >
            {/* Product Details - Single Summary View */}
            <Box sx={{ flex: 1, textAlign: 'center', py: 4 }}>
              {/* All Colors */}
              <Typography sx={{ fontSize: '18px', fontWeight: 'bold', mb: 1, textTransform: 'uppercase' }}>
                {Array.from(new Set(data.orderRows.map(r => r.color))).join(' / ')}
              </Typography>

              {/* Fabric Content + Item Description */}
              <Typography sx={{ fontSize: '14px', color: '#333', mb: 3, maxWidth: '80%', margin: '0 auto 30px' }}>
                {data.fabric.content}{data.itemDescription ? ` - ${data.itemDescription}` : ''}
              </Typography>

              {/* Product Image */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <img
                  src={data.productImage}
                  alt="Product"
                  onError={handlePoImageError}
                  style={{
                    maxWidth: '450px',
                    maxHeight: '450px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    border: '1px solid #eee',
                    padding: '10px',
                    borderRadius: '4px'
                  }}
                />
              </Box>

              {/* Total Qty Section */}
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ fontSize: '16px', fontWeight: 'bold', mr: 1 }}>Total Qty:</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>{data.fmtInt(data.totalQtyNum)} PCS</Typography>
                </Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 'medium', color: '#555' }}>
                  {data.fabric.content}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 'auto', pt: 5, display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>ERP Solution Provider : www.itg.net.pk</Typography>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Page # : 3 / 3</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================================
// NEW MODERN DESIGN (QYUKBK.PDF EXACT REPRODUCTION)
// ============================================================================

const MONTSERRAT_FONT = "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const NEW_PAGE_STYLE = {
  width: '210mm',
  minHeight: '297mm',
  padding: '14mm 16mm 12mm 16mm',
  backgroundColor: '#FFFFFF',
  color: '#111827',
  fontFamily: MONTSERRAT_FONT,
  boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
  marginBottom: '10mm',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  position: 'relative',
  '@media print': {
    boxShadow: 'none',
    margin: 0,
    padding: '12mm 14mm',
    width: '100%',
    minHeight: '100%',
    transform: 'none',
    pageBreakAfter: 'always',
    marginBottom: 0,
  }
};

const NewPOPageHeader = ({ poNo, rev = '0', date = '' }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3.5, pb: 1 }}>
    {/* Left Branding */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
      <img
        src="/logo/AMSlogo.png"
        alt="Logo"
        style={{ width: '46px', height: 'auto', display: 'block', objectFit: 'contain' }}
      />
      <Box>
        <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '13.5px', fontWeight: 800, color: '#111827', letterSpacing: '-0.2px', lineHeight: 1.25 }}>
          Apparel Merchandising Services
        </Typography>
        <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, color: '#6B7280', mt: 0.4, lineHeight: 1.35 }}>
          84 Kokan Housing Society, Alamgir Road
        </Typography>
        <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, color: '#6B7280', lineHeight: 1.35 }}>
          Karachi 74800, Pakistan
        </Typography>
        <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 500, color: '#6B7280', mt: 0.2, lineHeight: 1.35 }}>
          +92 21 3485 3935
        </Typography>
      </Box>
    </Box>

    {/* Right PO Header */}
    <Box sx={{ textAlign: 'right' }}>
      <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8px', fontWeight: 700, letterSpacing: '1.2px', color: '#6B7280', textTransform: 'uppercase', mb: 0.4 }}>
        PURCHASE ORDER
      </Typography>
      <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '23px', fontWeight: 800, color: '#0F2C59', letterSpacing: '-0.4px', lineHeight: 1.1, mb: 0.8 }}>
        {poNo || 'PO000000'}
      </Typography>
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          backgroundColor: '#F3F4F6',
          color: '#374151',
          fontFamily: MONTSERRAT_FONT,
          fontSize: '8.5px',
          fontWeight: 700,
          letterSpacing: '0.4px',
          px: 1.5,
          py: 0.4,
          borderRadius: '4px',
          textTransform: 'uppercase'
        }}
      >
        {`REV ${rev} · ISSUED ${date || ''}`}
      </Box>
    </Box>
  </Box>
);

const NewPOPageFooter = ({ pageNum, totalPages = 6, title = '', poNo = '', programName = '', rev = '0' }) => (
  <Box
    sx={{
      mt: 'auto',
      pt: 2,
      borderTop: '1px solid #E5E7EB',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: MONTSERRAT_FONT,
      fontSize: '8px',
      color: '#9CA3AF'
    }}
  >
    <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8px', fontWeight: 500, color: '#9CA3AF' }}>
      {`${poNo}${programName ? ` · ${programName}` : ''}${rev !== undefined && rev !== null ? ` · Rev ${rev}` : ''}`}
    </Typography>
    <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8px', fontWeight: 500, color: '#9CA3AF' }}>
      {`Page ${pageNum} of ${totalPages}${title ? ` — ${title}` : ''}`}
    </Typography>
  </Box>
);

const NewSectionHeader = ({ title }) => (
  <Typography
    sx={{
      fontFamily: MONTSERRAT_FONT,
      fontSize: '8.5px',
      fontWeight: 800,
      letterSpacing: '1px',
      color: '#4B5563',
      textTransform: 'uppercase',
      mb: 1.2
    }}
  >
    {title}
  </Typography>
);

const NewFieldBlock = ({ label, value, minWidth, highlight = false, valueFontSize = '11px', subValue = '' }) => (
  <Box sx={{ mb: 1.8, minWidth }}>
    <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.8px', color: '#6B7280', textTransform: 'uppercase', mb: 0.4 }}>
      {label}
    </Typography>
    <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: valueFontSize, fontWeight: highlight ? 800 : 600, color: highlight ? '#0F2C59' : '#111827', lineHeight: 1.35 }}>
      {value || '—'}
    </Typography>
    {subValue && (
      <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8.5px', fontWeight: 400, color: '#6B7280', mt: 0.3 }}>
        {subValue}
      </Typography>
    )}
  </Box>
);

const NewModernPurchaseOrderPage = ({ poData: propPoData, onClose }) => {
  const componentRef = useRef();
  const scrollContainerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const { id } = useParams();
  const navigate = useNavigate();
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(!!id && !propPoData);

  useEffect(() => {
    const fetchPurchaseOrderData = async () => {
      if (!id || propPoData) return;
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: token ? `Bearer ${token}` : '' };

        const [reportRes, fallbackRes] = await Promise.all([
          axios.get(`${HOST_API}/api/Report/GeneratePOReport?poid=${id}`, { headers }),
          axios.get(`${HOST_API}/api/MyOrders/GetPurchaseOrder/${id}`, { headers }).catch(() => ({ data: [] }))
        ]);

        let reportData = reportRes.data;
        const orderData = Array.isArray(fallbackRes.data) ? fallbackRes.data[0] : fallbackRes.data;
        const isEmpty = !reportData || (Array.isArray(reportData) && reportData.length === 0);

        if (!isEmpty) {
          if (orderData) {
            reportData = reportData.map(r => ({
              ...r,
              poImage: r.poImage || orderData.poImage,
              buyerCustomer: r.buyerCustomer || orderData.buyerCustomer || r.customerName || orderData.customerName || '',
              consigneeAddress1: r.consigneeAddress1 || orderData.consigneeAddress1 || orderData.consignee || '',
              consigneeAddress2: r.consigneeAddress2 || orderData.consigneeAddress2 || '',
              otherFabric: r.otherFabric || orderData.otherFabric || '',
              construction: r.construction || orderData.construction || '',
              ribGSM: r.ribGSM || orderData.ribGSM || r.ribGsm || orderData.ribGsm || r.RibGSM || orderData.RibGSM || '',
              assortment: r.assortment || orderData.assortment || '',
            }));
          }
          setFetchedData(reportData);
        } else {
          try {
            const styleRes = await axios.get(`${HOST_API}/api/Milestone/GetStyle?poid=${id}`, { headers }).catch(() => ({ data: [] }));
            const order = orderData;
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
              assortment: order.assortment || '',
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
              otherFabric: order.otherFabric || '',
              construction: order.construction || '',
              ribGSM: order.ribGSM || order.ribGsm || order.RibGSM || '',
              gms: order.gms || '',
              bankName: order.bankName || '',
              bankBranch: order.bankBranch || '',
              accountNo: order.accountNo || '',
            } : {};

            if (styleRows.length > 0) {
              const builtRows = styleRows.flatMap((s) => [
                {
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
                },
                {
                  ...baseHeader,
                  poDetailID: s.styleId || s.styleID,
                  color: s.colorway || '',
                  style: s.styleNo || '',
                  sizeRange: s.sizeRange || '',
                  productCode: s.productCode || '',
                  rate: s.rate || s.itemPrice || 0,
                  totalQTY: s.quantity || 0,
                  rowType: 'quantity',
                  s1: String(s.quantity || 0),
                }
              ]);
              setFetchedData(builtRows);
            } else if (order) {
              setFetchedData([{
                ...baseHeader,
                poDetailID: 1,
                color: order.color || '',
                style: order.style || '',
                sizeRange: order.sizeRange || '',
                productCode: order.productCode || '',
                rate: order.rate || 0,
                totalQTY: order.quantity || 0,
                rowType: 'quantity',
                s1: String(order.quantity || 0),
              }]);
            }
          } catch (err) {
            console.error('Fallback fetch error:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching purchase order data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrderData();
  }, [id, propPoData]);

  const rawInput = propPoData || fetchedData;
  const isArray = Array.isArray(rawInput);
  const reportRows = isArray ? rawInput : [];
  const poData = isArray ? (rawInput[0] || {}) : (rawInput || {});

  const totalPages = 6;

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
      { root, threshold: [0.15, 0.35, 0.55, 0.75] }
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

  const fmtMoney = (value) =>
    toNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = (value) => toNumber(value).toLocaleString('en-US', { maximumFractionDigits: 0 });

  const getSArray = (obj, max = 11) =>
    Array.from({ length: max }, (_, i) => {
      const v = obj?.[`s${i + 1}`];
      return v === null || v === undefined ? '' : String(v).trim();
    });

  const extractSizeColumns = (obj) => {
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

    if (hasAnyS && sLooksNumeric) {
      for (let i = 1; i <= max; i += 1) {
        const qRaw = obj?.[`s${i}`];
        if (qRaw === undefined || qRaw === null || String(qRaw).trim() === '') continue;
        qty.push(toNumber(qRaw));
        const labelCandidates = [obj?.[`size${i}`], obj?.[`size${i}Text`], obj?.[`s${i}Text`], obj?.[`s${i}Label`]];
        const found = labelCandidates.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
        labels.push(found ? String(found).trim() : '');
      }
      return { labels, qty };
    }

    if (hasAnyS) {
      for (let i = 1; i <= max; i += 1) {
        const labelRaw = obj?.[`s${i}`];
        const label = labelRaw !== undefined && labelRaw !== null ? String(labelRaw).trim() : '';
        if (!label) continue;
        labels.push(label);
        const qtyCandidates = [obj?.[`q${i}`], obj?.[`qty${i}`], obj?.[`quantity${i}`], obj?.[`poQty${i}`]];
        const foundQty = qtyCandidates.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
        qty.push(toNumber(foundQty));
      }
      return { labels, qty };
    }

    if (!qty.length) {
      const fallbackQty = [obj?.s1, obj?.s2, obj?.s3, obj?.s4].filter(
        (v) => v !== undefined && v !== null && String(v).trim() !== ''
      );
      fallbackQty.forEach((v) => qty.push(toNumber(v)));
      while (labels.length < qty.length) labels.push('');
    }
    return { labels, qty };
  };

  const buildOrderRowsFromReport = (rows) => {
    const groups = new Map();
    const getKey = (r) => String(r?.poDetailID ?? `${r?.color ?? ''}|${r?.style ?? ''}|${r?.sizeRange ?? ''}|${r?.productCode ?? ''}|${r?.rowNo ?? ''}`);

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
      const qtyValuesRaw = g.qtyRow ? getSArray(g.qtyRow) : [];
      const extracted = extractSizeColumns(base);

      const sizeLabels = (sizeLabelsRaw.length ? sizeLabelsRaw : extracted.labels).map((v) => String(v ?? '').trim());
      const qtyValues = (qtyValuesRaw.length ? qtyValuesRaw : extracted.qty).map((v) => (v === '' || v === null || v === undefined ? null : toNumber(v)));

      while (sizeLabels.length < 11) sizeLabels.push('');
      while (qtyValues.length < 11) qtyValues.push(null);

      const unitNum = toNumber(base.rate);
      const totalQtyNum = qtyValues.reduce((sum, v) => sum + (v === null ? 0 : v), 0) || toNumber(base.totalQTY);
      const amountNum = totalQtyNum * unitNum;

      out.push({
        color: base.color || '',
        style: base.style || '',
        sizeRange: base.sizeRange || '',
        productCode: base.productCode || '',
        sizeLabels: sizeLabels.slice(0, 11),
        qtyValues: qtyValues.slice(0, 11),
        totalQtyNum,
        unitNum,
        amountNum,
        firstIndex: g.firstIndex ?? 0,
      });
    }

    out.sort((a, b) => (a.firstIndex ?? 0) - (b.firstIndex ?? 0));
    return out;
  };

  const orderRows = buildOrderRowsFromReport(reportRows);
  const totalQtyNum = orderRows.reduce((sum, row) => sum + (row.totalQtyNum || 0), 0);
  const totalAmountNum = orderRows.reduce((sum, row) => sum + (row.amountNum || 0), 0);

  const poNumber = poData.pono || poData.poNo || poData.amsRefNo || '';
  const refNo = poData.amsRefNo || poData.pono || '';
  const programName = poData.brand || poData.style || 'RealTree Camo';
  const issueDate = (poData.creationDate && !poData.creationDate.startsWith('1900-01-01'))
    ? new Date(poData.creationDate).toISOString().split('T')[0]
    : '07-15-2026';
  const placementDate = issueDate;
  const finalInspDate = (poData.finalInspDate && !poData.finalInspDate.startsWith('1900-01-01'))
    ? new Date(poData.finalInspDate).toISOString().split('T')[0]
    : '09-10-2026';
  const exFactoryDate = (poData.shipmentDate && !poData.shipmentDate.startsWith('1900-01-01'))
    ? new Date(poData.shipmentDate).toISOString().split('T')[0]
    : '09-13-2026';
  const leadtimeDays = poData.leadtime ? Number(poData.leadtime) : 60;

  const pcsPerCartonNum = Number(poData.pcPerCarton) || 72;
  const totalCartonsNum = pcsPerCartonNum > 0 ? Math.ceil(totalQtyNum / pcsPerCartonNum) : 0;

  // Print & Download handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Purchase_Order_${refNo}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  const handleDownloadPDF = async () => {
    const element = componentRef.current;
    const originalTransform = element.style.transform;
    const originalTransition = element.style.transition;
    try {
      element.style.transform = 'scale(1)';
      element.style.transition = 'none';
      const pages = Array.from(element.children);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!(page instanceof HTMLElement)) continue;
        const prevBoxShadow = page.style.boxShadow;
        const prevMarginBottom = page.style.marginBottom;
        page.style.boxShadow = 'none';
        page.style.marginBottom = '0';

        const canvas = await html2canvas(page, { scale: 2, useCORS: true, logging: false, backgroundColor: '#FFFFFF' });
        const imgData = canvas.toDataURL('image/png');
        const scale = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        const finalWidth = canvas.width * scale;
        const finalHeight = canvas.height * scale;
        pdf.addImage(imgData, 'PNG', (pdfWidth - finalWidth) / 2, (pdfHeight - finalHeight) / 2, finalWidth, finalHeight);

        page.style.boxShadow = prevBoxShadow;
        page.style.marginBottom = prevMarginBottom;
        if (i < pages.length - 1) pdf.addPage();
      }
      pdf.save(`Purchase_Order_${refNo}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
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

  // Common sizes list across all rows for Breakdown page
  const allSizeHeaders = orderRows.length > 0 ? orderRows[0].sizeLabels.filter(Boolean) : ['S', 'M', 'L', 'XL', '2XL', '3XL+'];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
      {/* Top Action Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#1E293B', color: '#fff', boxShadow: 'none' }}>
        <Toolbar variant="dense" sx={{ minHeight: '48px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: '#fff', mr: 1 }} title="Back">
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="h6" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '13px', fontWeight: 700 }}>
              Purchase Order — {poNumber || refNo}
            </Typography>
            <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '12px', ml: 2, color: '#94A3B8' }}>
              {currentPage} / {totalPages}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#fff' }}>
              <ZoomOut fontSize="small" />
            </IconButton>
            <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '12px', mx: 1, minWidth: '40px', textAlign: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#fff' }}>
              <ZoomIn fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 0.5 }}>
            <IconButton size="small" onClick={handleDownloadPDF} sx={{ color: '#fff' }}>
              <Download fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handlePrint} sx={{ color: '#fff' }}>
              <Print fontSize="small" />
            </IconButton>
            {onClose && (
              <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
                <Close fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Pages Container */}
      <Box
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          padding: 3,
          backgroundColor: '#0F172A',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}
      >
        <Box
          ref={componentRef}
          sx={{
            transform: `scale(${zoomLevel * 1.2})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-in-out',
            '@media print': { transform: 'none !important' }
          }}
        >
          {/* ================================================================ */}
          {/* PAGE 1: ORDER DETAILS                                             */}
          {/* ================================================================ */}
          <Box sx={NEW_PAGE_STYLE}>
            <NewPOPageHeader poNo={poNumber || refNo} rev="0" date={issueDate} />

            {/* BUYER DETAILS */}
            <Box sx={{ mb: 2.5 }}>
              <NewSectionHeader title="BUYER DETAILS" />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                <NewFieldBlock label="BUYER / BRAND" value={poData.brand || poData.buyerCustomer || 'All Seasons Textile Inc.'} minWidth="180px" />
                <NewFieldBlock label="R.N #" value={poData.rnNo || '11067'} minWidth="120px" />
                <NewFieldBlock label="DESTINATION" value={poData.destination || 'New Jersey, USA'} minWidth="160px" />
              </Box>
              <NewFieldBlock label="SHIP TO" value={poData.consigneeAddress1 || '1 Broad Avenue, Unit 4, Fairview, NJ 07022, USA'} />
            </Box>

            <Divider sx={{ borderColor: '#E5E7EB', my: 2 }} />

            {/* FACTORY & SHIPMENT DETAILS */}
            <Box sx={{ mb: 2.5 }}>
              <NewSectionHeader title="FACTORY & SHIPMENT DETAILS" />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                <NewFieldBlock label="FACTORY" value={poData.supplierName || poData.venderAddress || 'Ayyoub Apparels'} minWidth="240px" />
                <NewFieldBlock label="FACTORY ADDRESS" value={poData.venderAddress || 'To Be Provided'} minWidth="240px" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <NewFieldBlock label="SHIP MODE" value={poData.deliveryTypeDisplayName || poData.deliveryType || 'Air'} minWidth="140px" />
                <NewFieldBlock label="SHIPMENT TERMS" value={poData.shipmentModeName || poData.shipmentMode || 'FOB'} minWidth="140px" />
                <NewFieldBlock label="PAYMENT TERMS" value={poData.paymentModeName || poData.paymentMode || 'DP'} minWidth="140px" />
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#E5E7EB', my: 2 }} />

            {/* KEY DATES */}
            <Box sx={{ mb: 3 }}>
              <NewSectionHeader title="KEY DATES" />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.4fr 1.3fr 1.5fr', gap: 2, alignItems: 'stretch' }}>
                <Box>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.8px', color: '#6B7280', textTransform: 'uppercase', mb: 0.6 }}>P.O ISSUE DATE</Typography>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '11.5px', fontWeight: 800, color: '#111827' }}>{issueDate}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.8px', color: '#6B7280', textTransform: 'uppercase', mb: 0.6 }}>PLACEMENT DATE</Typography>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '11.5px', fontWeight: 800, color: '#111827' }}>{placementDate}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.8px', color: '#6B7280', textTransform: 'uppercase', mb: 0.6 }}>FINAL INSPECTION DATE</Typography>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '11.5px', fontWeight: 800, color: '#111827' }}>{finalInspDate}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.8px', color: '#6B7280', textTransform: 'uppercase', mb: 0.6 }}>EX-FACTORY DATE</Typography>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '11.5px', fontWeight: 800, color: '#111827' }}>{exFactoryDate}</Typography>
                </Box>
                {/* Highlighted Allowed Days Card */}
                <Box sx={{ backgroundColor: '#0F2C59', color: '#fff', borderRadius: '4px', p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.85, mb: 0.3 }}>
                    PRODUCTION DAYS ALLOWED
                  </Typography>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '15px', fontWeight: 800, lineHeight: 1.1 }}>
                    {leadtimeDays} days
                  </Typography>
                  <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7px', fontWeight: 400, opacity: 0.75, mt: 0.3 }}>
                    Placement to ex-factory
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* DELAY PENALTY SCHEDULE */}
            <Box sx={{ mt: 'auto', mb: 2 }}>
              <Box sx={{ backgroundColor: '#0F2C59', color: '#fff', px: 2, py: 0.9, borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  DELAY PENALTY SCHEDULE — CUMULATIVE, ON VALUE OF QUANTITY DELIVERED LATE
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', border: '1px solid #D1D5DB', borderTop: 'none', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }}>
                {[
                  { range: '1–7 DAYS', penalty: '1.0%' },
                  { range: '8–14 DAYS', penalty: '2.5%' },
                  { range: '15–21 DAYS', penalty: '4.5%' },
                  { range: '22–28 DAYS', penalty: '7.0%' },
                  { range: '28+ DAYS', penalty: '10.0%' }
                ].map((item, idx) => (
                  <Box key={idx} sx={{ p: 1.2, borderRight: idx < 4 ? '1px solid #E5E7EB' : 'none' }}>
                    <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 600, color: '#6B7280', mb: 0.4 }}>{item.range}</Typography>
                    <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '13px', fontWeight: 800, color: '#111827' }}>{item.penalty}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <NewPOPageFooter pageNum={1} totalPages={totalPages} title="Order Details" poNo={poNumber || refNo} programName={programName} rev="0" />
          </Box>

          {/* ================================================================ */}
          {/* PAGE 2: PRODUCT INFORMATION                                       */}
          {/* ================================================================ */}
          <Box sx={NEW_PAGE_STYLE}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, pb: 1, borderBottom: '1px solid #E5E7EB' }}>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '17px', fontWeight: 800, color: '#111827' }}>
                Product Information
              </Typography>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', color: '#6B7280', fontWeight: 600 }}>
                {`${poNumber || refNo} · ${programName}`}
              </Typography>
            </Box>

            {/* IDENTIFICATION + BIG LOGO / PREVIEW */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 4, mb: 2.5 }}>
              <Box sx={{ flex: 1 }}>
                <NewSectionHeader title="IDENTIFICATION" />
                <Box sx={{ display: 'flex', gap: 6, mb: 1.2 }}>
                  <NewFieldBlock label="STYLE #" value={poData.style || 'APX'} />
                  <NewFieldBlock label="PRODUCT CODE" value={poData.productCode || '122338'} />
                </Box>
                <Box sx={{ display: 'flex', gap: 6, mb: 1.2 }}>
                  <NewFieldBlock label="PROGRAM NAME" value={programName} />
                  <NewFieldBlock label="PRODUCT CATEGORY" value={poData.productCategoriesName || 'Knits'} />
                </Box>
                <NewFieldBlock
                  label="DESCRIPTION"
                  value={poData.itemDescriptionShippingInvoice || `${poData.fabric || "Men's Jersey SS Tee"} — ${poData.style || 'Baltimore Body'}, ${poData.color || 'CAMO'} colorway`}
                />
              </Box>

              {/* Product Thumbnail / Big Image */}
              <Box sx={{ width: '180px', height: '160px', border: '1px solid #E5E7EB', borderRadius: '6px', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
                <img
                  src={resolvePoImageSrc(poData.poImage)}
                  alt="Product"
                  onError={handlePoImageError}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#E5E7EB', my: 2 }} />

            {/* FABRIC & CONSTRUCTION */}
            <Box sx={{ mb: 2.5 }}>
              <NewSectionHeader title="FABRIC & CONSTRUCTION" />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.2 }}>
                <NewFieldBlock label="FABRIC" value={poData.fabric || 'Jersey Knit'} minWidth="140px" />
                <NewFieldBlock label="GSM" value={poData.gms ? `${poData.gms} gsm` : '142 gsm'} minWidth="100px" />
                <NewFieldBlock label="CONTENT" value={poData.quality || '50% Polyester / 25% Viscose / 25% Cotton'} minWidth="240px" highlight />
              </Box>
              <NewFieldBlock label="SOURCING" value={`Fabric: ${poData.styleSource || 'Local'} · Trims & Accessories: ${poData.trimsAccessories || 'Local'}`} />
            </Box>

            <Divider sx={{ borderColor: '#E5E7EB', my: 2 }} />

            {/* CARE INSTRUCTIONS */}
            <Box sx={{ mb: 2.5 }}>
              <NewSectionHeader title="CARE INSTRUCTIONS" />
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '10.5px', fontWeight: 500, color: '#374151', lineHeight: 1.5 }}>
                {poData.washingCareLabelInstructions || 'Machine wash cold with like colors, gentle cycle. Use only non-chlorine bleach when needed. Line dry, cool iron.'}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: '#E5E7EB', my: 2 }} />

            {/* PACKING INSTRUCTIONS */}
            <Box sx={{ mb: 2.5 }}>
              <NewSectionHeader title="PACKING INSTRUCTIONS" />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.2 }}>
                <NewFieldBlock label="PACKING METHOD" value={poData.assortment || 'Assorted packing'} minWidth="130px" />
                <NewFieldBlock label="PCS / CARTON" value={poData.pcPerCarton ? `${poData.pcPerCarton} pcs` : '72 pcs'} minWidth="100px" />
                <NewFieldBlock label="POLYBAG" value={poData.polyBag || 'Single pc polybag'} minWidth="140px" />
                <NewFieldBlock label="FOLD" value={poData.fold || '9x11 shirt fold'} minWidth="120px" />
              </Box>
              <NewFieldBlock label="CARTON MARK" value={poData.cartonMarking || 'Jedco'} />
            </Box>

            <NewPOPageFooter pageNum={2} totalPages={totalPages} title="Product Information" poNo={poNumber || refNo} programName={programName} rev="0" />
          </Box>

          {/* ================================================================ */}
          {/* PAGE 3: SIZE, COLOUR & FOB BREAKDOWN                              */}
          {/* ================================================================ */}
          <Box sx={NEW_PAGE_STYLE}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 1, borderBottom: '1px solid #E5E7EB' }}>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '17px', fontWeight: 800, color: '#111827' }}>
                Size, Colour & FOB Breakdown
              </Typography>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', color: '#6B7280', fontWeight: 600 }}>
                {`${poNumber || refNo} · ${programName}`}
              </Typography>
            </Box>

            {/* Sub-header text */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8px', fontWeight: 800, letterSpacing: '0.8px', color: '#4B5563', textTransform: 'uppercase' }}>
                QUANTITY, UNIT PRICE & FOB VALUE BY COLOUR
              </Typography>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8.5px', fontWeight: 400, color: '#6B7280', fontStyle: 'italic' }}>
                All prices FOB Karachi, USD
              </Typography>
            </Box>

            {/* Breakdown Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: 'none', mb: 3 }}>
              <Table size="small" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #111827' }}>
                    <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', py: 0.8, pl: 0 }}>COLOUR</TableCell>
                    {allSizeHeaders.map((sz, idx) => (
                      <TableCell key={idx} align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#374151', py: 0.8 }}>{sz}</TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#111827', py: 0.8 }}>TOTAL QTY</TableCell>
                    <TableCell align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#374151', py: 0.8 }}>PRICE S-2XL</TableCell>
                    <TableCell align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#374151', py: 0.8 }}>PRICE 3XL+</TableCell>
                    <TableCell align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#111827', py: 0.8, pr: 0 }}>FOB VALUE (USD)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderRows.map((row, rIdx) => {
                    const price3xl = row.unitNum ? row.unitNum + 0.50 : 0;
                    return (
                      <TableRow key={rIdx} sx={{ borderBottom: '1px solid #F3F4F6' }}>
                        <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', fontWeight: 700, color: '#111827', py: 0.7, pl: 0 }}>{row.color || '—'}</TableCell>
                        {allSizeHeaders.map((_, sIdx) => {
                          const val = row.qtyValues[sIdx];
                          return (
                            <TableCell key={sIdx} align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 500, color: '#4B5563', py: 0.7 }}>
                              {val ? fmtInt(val) : '—'}
                            </TableCell>
                          );
                        })}
                        <TableCell align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', fontWeight: 700, color: '#111827', py: 0.7 }}>
                          {fmtInt(row.totalQtyNum)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 500, color: '#4B5563', py: 0.7 }}>
                          {`$${fmtMoney(row.unitNum)}`}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 500, color: '#4B5563', py: 0.7 }}>
                          {`$${fmtMoney(price3xl)}`}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', fontWeight: 700, color: '#111827', py: 0.7, pr: 0 }}>
                          {`$${fmtMoney(row.amountNum)}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Table Total Row */}
                  <TableRow sx={{ borderTop: '2px solid #111827', borderBottom: '2px solid #111827' }}>
                    <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', fontWeight: 800, color: '#111827', py: 0.9, pl: 0 }}>Total</TableCell>
                    {allSizeHeaders.map((_, sIdx) => {
                      const colSum = orderRows.reduce((sum, r) => sum + (r.qtyValues[sIdx] || 0), 0);
                      return (
                        <TableCell key={sIdx} align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', fontWeight: 800, color: '#111827', py: 0.9 }}>
                          {fmtInt(colSum)}
                        </TableCell>
                      );
                    })}
                    <TableCell align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', fontWeight: 800, color: '#111827', py: 0.9 }}>
                      {fmtInt(totalQtyNum)}
                    </TableCell>
                    <TableCell colSpan={2} sx={{ py: 0.9 }}>&nbsp;</TableCell>
                    <TableCell align="right" sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '10px', fontWeight: 800, color: '#111827', py: 0.9, pr: 0 }}>
                      {`$${fmtMoney(totalAmountNum)}`}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Bottom 3 Metric Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.6fr', gap: 2.5, mt: 'auto', mb: 2 }}>
              {/* Card 1: Total Qty */}
              <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '6px', p: 1.8, backgroundColor: '#FFFFFF' }}>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.8px', color: '#6B7280', textTransform: 'uppercase', mb: 0.4 }}>
                  TOTAL QUANTITY
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '18px', fontWeight: 800, color: '#111827' }}>
                  {`${fmtInt(totalQtyNum)} pcs`}
                </Typography>
              </Box>

              {/* Card 2: Cartons */}
              <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '6px', p: 1.8, backgroundColor: '#FFFFFF' }}>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.8px', color: '#6B7280', textTransform: 'uppercase', mb: 0.4 }}>
                  CARTONS
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '18px', fontWeight: 800, color: '#111827' }}>
                  {`${fmtInt(totalCartonsNum)} Ctn`}
                </Typography>
              </Box>

              {/* Card 3: Total FOB Value (Dark Navy) */}
              <Box sx={{ backgroundColor: '#0F2C59', color: '#fff', borderRadius: '6px', p: 1.8 }}>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.8px', opacity: 0.85, textTransform: 'uppercase', mb: 0.4 }}>
                  TOTAL FOB VALUE
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '18px', fontWeight: 800, lineHeight: 1.1 }}>
                  {`USD ${fmtMoney(totalAmountNum)}`}
                </Typography>
              </Box>
            </Box>

            <NewPOPageFooter pageNum={3} totalPages={totalPages} title="Sizes, Colours & FOB" poNo={poNumber || refNo} programName={programName} rev="0" />
          </Box>

          {/* ================================================================ */}
          {/* PAGE 4: TERMS & CONDITIONS                                        */}
          {/* ================================================================ */}
          <Box sx={NEW_PAGE_STYLE}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 1, borderBottom: '1px solid #E5E7EB' }}>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '17px', fontWeight: 800, color: '#111827' }}>
                Terms & Conditions
              </Typography>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', color: '#6B7280', fontWeight: 600 }}>
                {`${poNumber || refNo} · ${programName}`}
              </Typography>
            </Box>

            {/* 2-Column Clean Modern Layout */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3.5, fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, color: '#374151', lineHeight: 1.45 }}>
              {/* Left Column */}
              <Box>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.8px', color: '#111827', textTransform: 'uppercase', mb: 0.6 }}>ORDER ACCEPTANCE</Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1.6 }}>
                  1. Factory must confirm the PO in writing <strong>within 24 hours</strong> of issuance; beginning production without objection means full acceptance.
                </Typography>

                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.8px', color: '#111827', textTransform: 'uppercase', mb: 0.6 }}>QUALITY, SAMPLES & APPROVALS</Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  2. Goods must strictly match approved specs, samples, fabrics, trims and colours — <strong>factory remains liable for compliance even after inspection passes</strong>.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  3. No bulk cutting, printing or packing may start without written approval; unapproved production <strong>proceeds entirely at factory's own risk and cost</strong>.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  4. No fabric, trim, construction or subcontracting change without AMS's prior written approval.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  5. Third-party inspection (e.g. SGS) only after AMS approval; failed inspections are chargeable to the factory.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1.6 }}>
                  6. All buyer-required tests must pass; retesting and correction costs from factory-caused failures are borne by the factory.
                </Typography>

                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.8px', color: '#111827', textTransform: 'uppercase', mb: 0.6 }}>PACKING & QUANTITY</Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  7. Packing must follow approved instructions exactly — <strong>no mixed sizes, colours or styles per carton without written approval</strong>.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  8. Full PO quantity must be delivered; shortages are completed or deducted at AMS's discretion, and overages need prior written approval before shipment.
                </Typography>
              </Box>

              {/* Right Column */}
              <Box>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.8px', color: '#111827', textTransform: 'uppercase', mb: 0.6 }}>DELIVERY & DELAYS</Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  9. Any risk to the delivery date must be reported immediately in writing with a recovery plan — notice alone does not extend the date.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  10. Delay penalties apply per the <strong>cumulative Delay Penalty Schedule</strong> shown on pages 1 and 5.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1.6 }}>
                  11. Any freight upgrade to air caused by factory delay <strong>is at the factory's cost</strong>.
                </Typography>

                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.8px', color: '#111827', textTransform: 'uppercase', mb: 0.6 }}>PAYMENT & DEDUCTIONS</Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  12. AMS covers courier cost for the first submission only; all resubmissions from factory error are factory-paid.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  13. Any buyer chargeback caused by the factory is <strong>deducted from factory payments</strong>.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1.6 }}>
                  14. AMS may deduct delay, shortage, chargeback or other documented costs from current or future payments.
                </Typography>

                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.8px', color: '#111827', textTransform: 'uppercase', mb: 0.6 }}>DOCUMENTS, CONFIDENTIALITY & COMPLIANCE</Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  15. Complete, accurate shipment documents are required on time — errors causing delay or customs issues are factory liability.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  16. Buyer designs, artwork and branded materials are confidential and for this PO only — no resale of excess, rejects or seconds.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  17. Factory must comply with all labour, safety, environmental and social-compliance regulations.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  18. Genuine force-majeure delays must be reported immediately with evidence; routine issues (machine breakdown, staffing, planning) do not qualify.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  19. Accepting the PO or starting production confirms full acceptance of these Terms.
                </Typography>
              </Box>
            </Box>

            <NewPOPageFooter pageNum={4} totalPages={totalPages} title="Terms & Conditions" poNo={poNumber || refNo} programName={programName} rev="0" />
          </Box>

          {/* ================================================================ */}
          {/* PAGE 5: BANKING DETAILS                                           */}
          {/* ================================================================ */}
          <Box sx={NEW_PAGE_STYLE}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, pb: 1, borderBottom: '1px solid #E5E7EB' }}>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '17px', fontWeight: 800, color: '#111827' }}>
                Banking Details
              </Typography>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', color: '#6B7280', fontWeight: 600 }}>
                {`${poNumber || refNo} · ${programName}`}
              </Typography>
            </Box>

            {/* ORDER REFERENCE */}
            <Box sx={{ mb: 2.5 }}>
              <NewSectionHeader title="ORDER REFERENCE" />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <NewFieldBlock label="BUYER / BRAND" value={`${poData.supplierName || 'Ayyoub Apparels'} — ${poData.division || 'Men'}`} minWidth="200px" />
                <NewFieldBlock label="FACTORY" value={poData.brand || poData.buyerCustomer || 'All Seasons Textile Inc.'} minWidth="200px" />
                <NewFieldBlock label="P.O NUMBER" value={poNumber || refNo || 'PO0020311'} minWidth="140px" highlight />
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#E5E7EB', my: 2 }} />

            {/* BENEFICIARY */}
            <Box sx={{ mb: 2.5 }}>
              <NewSectionHeader title="BENEFICIARY" />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <NewFieldBlock label="BENEFICIARY NAME" value={poData.brand || poData.buyerCustomer || 'All Seasons Textile Inc.'} minWidth="240px" />
                <NewFieldBlock label="BENEFICIARY ADDRESS" value="Not Required" minWidth="240px" />
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#E5E7EB', my: 2 }} />

            {/* BANK DETAILS */}
            <Box sx={{ mb: 3 }}>
              <NewSectionHeader title="BANK DETAILS" />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <NewFieldBlock label="BANK NAME" value={poData.bankNameBank || poData.bankName || 'To Be Provided'} minWidth="240px" />
                <NewFieldBlock label="BANK ADDRESS" value={poData.bankBranch || 'To Be Provided'} minWidth="240px" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <NewFieldBlock label="ACCOUNT NUMBER" value={poData.accountNoBank || poData.accountNo || 'To Be Provided'} minWidth="240px" />
                <NewFieldBlock label="ROUTING / SWIFT CODE" value={poData.ibanBank || 'To Be Provided'} minWidth="240px" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <NewFieldBlock label="IBAN" value={poData.ibanBank || 'Not Required'} minWidth="240px" />
                <NewFieldBlock label="CURRENCY" value="USD" minWidth="240px" />
              </Box>
            </Box>

            {/* DELAY PENALTY SCHEDULE TABLE */}
            <Box sx={{ mt: 'auto', mb: 2 }}>
              <Box sx={{ backgroundColor: '#0F2C59', color: '#fff', px: 2, py: 0.9, borderTopLeftRadius: '4px', borderTopRightRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  DELAY PENALTY SCHEDULE
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 400, opacity: 0.85 }}>
                  Cumulative · applied on the value of quantity delivered late
                </Typography>
              </Box>
              <Box sx={{ border: '1px solid #E5E7EB', borderTop: 'none', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }}>
                {[
                  { range: '1–7 calendar days late', pct: '1.0%' },
                  { range: '8–14 calendar days late', pct: '2.5%' },
                  { range: '15–21 calendar days late', pct: '4.5%' },
                  { range: '22–28 calendar days late', pct: '7.0%' },
                  { range: 'More than 28 days (order may be cancelled or reassigned)', pct: '10.0%' }
                ].map((row, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 2,
                      py: 0.8,
                      backgroundColor: idx % 2 === 1 ? '#F9FAFB' : '#FFFFFF',
                      borderBottom: idx < 4 ? '1px solid #F3F4F6' : 'none'
                    }}
                  >
                    <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 500, color: '#374151' }}>{row.range}</Typography>
                    <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '10px', fontWeight: 800, color: '#111827' }}>{row.pct}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <NewPOPageFooter pageNum={5} totalPages={totalPages} title="Banking Details" poNo={poNumber || refNo} programName={programName} rev="0" />
          </Box>

          {/* ================================================================ */}
          {/* PAGE 6: APPENDIX — REVISION RECORD & ACCEPTANCE                  */}
          {/* ================================================================ */}
          <Box sx={NEW_PAGE_STYLE}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 1, borderBottom: '1px solid #E5E7EB' }}>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '17px', fontWeight: 800, color: '#111827' }}>
                Appendix — Revision Record & Acceptance
              </Typography>
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', color: '#6B7280', fontWeight: 600 }}>
                {`${poNumber || refNo} · ${programName} · Rev 0`}
              </Typography>
            </Box>

            {/* REVISION RECORD */}
            <Box sx={{ mb: 3 }}>
              <NewSectionHeader title="REVISION RECORD" />
              <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, color: '#4B5563', mb: 1.5, lineHeight: 1.45 }}>
                Every change to this Purchase Order — quantity, price, colour, packing, dates or terms — is recorded below and the PO is reissued with a new revision number. <strong>The latest revision supersedes all earlier copies;</strong> the factory must work only to the highest revision in its possession.
              </Typography>

              {/* Revision Table */}
              <TableContainer component={Paper} elevation={0} sx={{ border: 'none', mb: 1.5 }}>
                <Table size="small" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid #111827' }}>
                      <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', py: 0.8, width: '10%', pl: 0 }}>REV</TableCell>
                      <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', py: 0.8, width: '20%' }}>DATE</TableCell>
                      <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', py: 0.8, width: '25%' }}>PAGE / SECTION</TableCell>
                      <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', py: 0.8, width: '30%' }}>CHANGE RECORDED</TableCell>
                      <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', py: 0.8, width: '15%', pr: 0 }}>APPROVED BY</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ borderBottom: '1px solid #E5E7EB' }}>
                      <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9.5px', fontWeight: 800, color: '#111827', py: 0.8, pl: 0 }}>0</TableCell>
                      <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 500, color: '#374151', py: 0.8 }}>{issueDate}</TableCell>
                      <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 500, color: '#374151', py: 0.8 }}>All</TableCell>
                      <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 500, color: '#374151', py: 0.8 }}>Original issue</TableCell>
                      <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 700, color: '#374151', py: 0.8, pr: 0 }}>JB</TableCell>
                    </TableRow>
                    {[1, 2, 3, 4].map((revNo) => (
                      <TableRow key={revNo} sx={{ borderBottom: '1px solid #F3F4F6' }}>
                        <TableCell sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, color: '#9CA3AF', py: 0.8, pl: 0 }}>{revNo}</TableCell>
                        <TableCell sx={{ py: 0.8 }}>&nbsp;</TableCell>
                        <TableCell sx={{ py: 0.8 }}>&nbsp;</TableCell>
                        <TableCell sx={{ py: 0.8 }}>&nbsp;</TableCell>
                        <TableCell sx={{ py: 0.8, pr: 0 }}>&nbsp;</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* ACCEPTANCE CARD (Red Banner) */}
            <Box sx={{ mb: 4, borderRadius: '4px', overflow: 'hidden', border: '1px solid #FCA5A5' }}>
              <Box sx={{ backgroundColor: '#B91C1C', color: '#fff', px: 2, py: 0.9 }}>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  ACCEPTANCE OF THIS PURCHASE ORDER
                </Typography>
              </Box>
              <Box sx={{ p: 1.8, backgroundColor: '#FEF2F2', color: '#374151', fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, lineHeight: 1.45 }}>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400, mb: 1 }}>
                  By confirming this Purchase Order, or by carrying out any work against it — including fabric or trim booking, cutting, printing, stitching or packing — the factory is deemed to have <strong>read, understood and accepted this document in full</strong>: the specifications, quantities, colours, prices, packing instructions, sample and inspection requirements, delivery dates, the Delay Penalty Schedule and all Terms & Conditions set out herein.
                </Typography>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '9px', fontWeight: 400 }}>
                  The factory further confirms that it has <strong>the capacity, materials, machinery and manpower</strong> to complete this order within the production days allowed and is ready to commence work. <strong>No separate signed copy is required for these terms to take effect.</strong> Any objection, clarification or requested change must be raised in writing within 24 hours of issuance; after that, or once work begins, the PO stands accepted as issued.
                </Typography>
              </Box>
            </Box>

            {/* SIGNATURES SECTION */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, mt: 'auto', mb: 2 }}>
              {/* Factory Side */}
              <Box>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.8px', color: '#111827', textTransform: 'uppercase', mb: 3.5 }}>
                  ACKNOWLEDGED BY — FACTORY
                </Typography>
                <Box sx={{ borderBottom: '1.5px solid #111827', mb: 0.6 }} />
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8px', fontWeight: 500, color: '#6B7280' }}>
                  Name, designation, stamp & date
                </Typography>
              </Box>

              {/* AMS Side */}
              <Box>
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.8px', color: '#111827', textTransform: 'uppercase', mb: 3.5 }}>
                  ISSUED BY — APPAREL MERCHANDISING SERVICES
                </Typography>
                <Box sx={{ borderBottom: '1.5px solid #111827', mb: 0.6 }} />
                <Typography sx={{ fontFamily: MONTSERRAT_FONT, fontSize: '8px', fontWeight: 500, color: '#6B7280' }}>
                  Name, designation & date
                </Typography>
              </Box>
            </Box>

            <NewPOPageFooter pageNum={6} totalPages={totalPages} title="Appendix & Acceptance" poNo={poNumber || refNo} programName={programName} rev="0" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================================
// MAIN EXPORT (SWITCHED VIA USE_NEW_PO_DESIGN)
// ============================================================================
const PurchaseOrderPageExactMatch = (props) => {
  if (USE_NEW_PO_DESIGN) {
    return <NewModernPurchaseOrderPage {...props} />;
  }
  return <LegacyPurchaseOrderPageExactMatch {...props} />;
};

export default PurchaseOrderPageExactMatch;
