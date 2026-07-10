/**
 * Shipped Order Report PDF — reuses the SHIPPED ORDER REPORT builder originally written for
 * the Status Wise Vendor panel. Same 14-column grouped layout (yellow Total bands) and footer;
 * only the download filename differs so saved files don't collide.
 */
import { buildStatusWiseVendorOrderReportPdfBlob } from './status-wise-vendor-order-report-pdf-export';

const SHIPPED_ORDER_TITLE = 'Shipped Order Report';
export const SHIPPED_ORDER_DOCUMENT_TITLE = 'Shipped Order Report';
export const SHIPPED_ORDER_PDF_FILENAME = 'Shipped Order Report.pdf';
const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/**
 * @param {{ fromDate?: string; toDate?: string; groups?: Array<{ rows: object[] }> }} [data]
 * @param {{ fromDate?: string; toDate?: string }} [meta]
 */
export async function buildShippedOrderReportPdfBlob(data, meta = {}) {
  if (!data || !Array.isArray(data.groups) || data.groups.length === 0) {
    throw new Error('No data found for the selected filters.');
  }

  return buildStatusWiseVendorOrderReportPdfBlob(data, {
    ...meta,
    title: SHIPPED_ORDER_TITLE,
    documentTitle: SHIPPED_ORDER_DOCUMENT_TITLE,
    shippedOrderGrandTotal: true,
  });
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openShippedOrderReportPdf(mode, pdfBlob) {
  const namedPdf =
    typeof File !== 'undefined'
      ? new File([pdfBlob], SHIPPED_ORDER_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedPdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = SHIPPED_ORDER_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
