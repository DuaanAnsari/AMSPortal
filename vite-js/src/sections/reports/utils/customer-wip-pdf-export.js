import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  CUSTOMER_WIP_TABLE_HEADERS,
  customerWipPdfRowToTableCells,
  preloadCustomerWipPoImageDimensions,
} from './customer-wip-report-map';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const V_MARGIN = 10;
const H_MARGIN = 12;
const HEADER_BLOCK_H = 98;
const FOOTER_H = 24;
const TITLE_BLUE = [0, 51, 153];
const IMAGE_COL_INDEX = 1;
const IMAGE_BOX_PT = { w: 34, h: 40 };
const MIN_DATA_ROW_H = 44;

const PAGE_W = 842;
const PAGE_H = 595;

const PDF_VIEW_ZOOM_HASH = '#zoom=110';
const PDF_FILENAME = 'Customer_WIP_Report.pdf';

async function loadLogoDataUrl() {
  const res = await fetch(LOGO_PATH);
  if (!res.ok) throw new Error(`logo ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

function formatIsoToDdMonYyyy(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || '');
  const d = new Date(`${iso}T12:00:00`);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  return `${dd}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function formatPrintStamp() {
  const d = new Date();
  const dateRaw = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const date = dateRaw.replace(/ /g, '-');
  const time = d
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
  return `Print Date: ${date} ${time}`;
}

function jsPdfImageFormatFromDataUrl(dataUrl) {
  const m = /^data:image\/(\w+);/i.exec(String(dataUrl || ''));
  if (!m) return 'JPEG';
  const t = m[1].toLowerCase();
  if (t === 'png') return 'PNG';
  if (t === 'webp') return 'WEBP';
  if (t === 'gif') return 'GIF';
  return 'JPEG';
}

function drawPageHeader(doc, logoDataUrl, meta, startY) {
  const innerLeft = H_MARGIN;
  const innerRight = PAGE_W - H_MARGIN;
  const logoW = 78;
  const logoH = 32;
  const logoX = innerRight - logoW;
  const logoY = V_MARGIN + 4;
  const leftMaxW = Math.max(120, logoX - innerLeft - 8);

  let y = startY ?? V_MARGIN + 10;
  doc.setTextColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const title = 'Customer WIP Report / Summary of Production Status Report';
  const titleLines = doc.splitTextToSize(title, leftMaxW);
  titleLines.forEach((line) => {
    doc.text(line, innerLeft, y);
    const tw = doc.getTextWidth(line);
    doc.setDrawColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
    doc.setLineWidth(0.35);
    doc.line(innerLeft, y + 2, innerLeft + tw, y + 2);
    y += 12;
  });

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.text(`Customer: ${meta.customerLabel ?? 'All'}`, innerLeft, y);
  y += 11;
  doc.text(`Supplier: ${meta.supplierLabel ?? 'All'}`, innerLeft, y);
  y += 11;
  doc.text(`Merchant: ${meta.merchantLabel ?? '—'}`, innerLeft, y);
  y += 11;
  const fromH = formatIsoToDdMonYyyy(meta.fromDate);
  const toH = formatIsoToDdMonYyyy(meta.toDate);
  doc.text(`Date From: ${fromH}    Date To: ${toH}`, innerLeft, y);
  y += 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(60, 60, 60);
  doc.text('* These dates belongs to customer ship date as per PO.', innerLeft, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      /* ignore */
    }
  }

  const tableTop = V_MARGIN + HEADER_BLOCK_H;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.text(formatPrintStamp(), innerRight, tableTop - 4, { align: 'right', baseline: 'bottom' });

  return tableTop;
}

function drawFooter(doc, pageIndex, totalPages) {
  const fy = PAGE_H - V_MARGIN - 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text(`Page ${pageIndex} of ${totalPages}`, H_MARGIN + 2, fy, { baseline: 'bottom' });
  doc.text('Powered by : INTERACTIVE TECHNOLOGIES GATEWAY', PAGE_W / 2, fy, {
    align: 'center',
    baseline: 'bottom',
  });
}

function drawImagePlaceholder(doc, x, y, w, h) {
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, w, h, 'F');
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(120, 120, 120);
  doc.text('No Image', x + w / 2, y + h / 2 - 3, { align: 'center', baseline: 'middle' });
  doc.text('Available', x + w / 2, y + h / 2 + 5, { align: 'center', baseline: 'middle' });
  doc.setTextColor(0, 0, 0);
}

function drawPoImageInCell(doc, row, cell) {
  const pad = 2;
  const boxW = Math.min(IMAGE_BOX_PT.w, cell.width - pad * 2);
  const boxH = Math.min(IMAGE_BOX_PT.h, cell.height - pad * 2);
  const cx = cell.x + (cell.width - boxW) / 2;
  const cy = cell.y + (cell.height - boxH) / 2;

  const url = row?.poImageDataUrl;
  const nw = Number(row?._poImageNaturalW) || 0;
  const nh = Number(row?._poImageNaturalH) || 0;

  if (!url || nw <= 0 || nh <= 0) {
    drawImagePlaceholder(doc, cx, cy, boxW, boxH);
    return;
  }

  const scale = Math.min(boxW / nw, boxH / nh);
  const iw = nw * scale;
  const ih = nh * scale;
  const ix = cx + (boxW - iw) / 2;
  const iy = cy + (boxH - ih) / 2;

  try {
    doc.addImage(url, jsPdfImageFormatFromDataUrl(url), ix, iy, iw, ih, undefined, 'FAST');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(cx, cy, boxW, boxH, 'S');
  } catch {
    drawImagePlaceholder(doc, cx, cy, boxW, boxH);
  }
}

function drawNoDataFound(doc, tableTop) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('No Data Found', PAGE_W / 2, tableTop + 40, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

/**
 * @param {object[]} mappedRows — rows from {@link mapApiRowToCustomerWipPdfRow}
 * @param {{
 *   customerLabel?: string;
 *   supplierLabel?: string;
 *   merchantLabel?: string;
 *   fromDate?: string;
 *   toDate?: string;
 * }} [meta]
 */
export async function buildCustomerWipPdfBlobFromRows(mappedRows, meta = {}) {
  const rows = Array.isArray(mappedRows) ? mappedRows : [];

  await preloadCustomerWipPoImageDimensions(rows);

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'l' });
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);
  const tableTop = drawPageHeader(doc, logoDataUrl, meta);

  if (!rows.length) {
    drawNoDataFound(doc, tableTop);
    const total = doc.internal.getNumberOfPages();
    for (let p = 1; p <= total; p += 1) {
      doc.setPage(p);
      drawFooter(doc, p, total);
    }
    return doc.output('blob');
  }

  const body = rows.map((row) => customerWipPdfRowToTableCells(row));

  autoTable(doc, {
    startY: tableTop,
    head: [CUSTOMER_WIP_TABLE_HEADERS],
    body,
    theme: 'grid',
    margin: { left: H_MARGIN, right: H_MARGIN, top: tableTop, bottom: V_MARGIN + FOOTER_H },
    tableWidth: PAGE_W - 2 * H_MARGIN,
    styles: {
      font: 'helvetica',
      fontSize: 5.2,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [220, 220, 222],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 4.8,
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      minCellHeight: MIN_DATA_ROW_H,
    },
    columnStyles: {
      0: { cellWidth: 36, halign: 'left' },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 38 },
      3: { cellWidth: 42 },
      4: { cellWidth: 42 },
      5: { cellWidth: 40 },
      6: { cellWidth: 38, halign: 'center' },
      7: { cellWidth: 32, halign: 'right' },
    },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== IMAGE_COL_INDEX) return;
      const row = rows[data.row.index];
      if (!row) return;
      drawPoImageInCell(doc, row, data.cell);
    },
  });

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openCustomerWipPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}

export { PDF_VIEW_ZOOM_HASH };
