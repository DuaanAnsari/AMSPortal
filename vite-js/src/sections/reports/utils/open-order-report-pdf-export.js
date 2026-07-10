/**
 * Open Order Report PDF — thin wrapper around the Status Wise Order Report builder.
 * Same layout / columns / demo dataset; only the page title and download filename differ.
 */
import { buildStatusWiseOrderReportPdfBlob } from './status-wise-order-report-pdf-export';

const OPEN_ORDER_TITLE = 'OPEN ORDER REPORT';
export const OPEN_ORDER_DOCUMENT_TITLE = 'Open Order Report';
export const OPEN_ORDER_PDF_FILENAME = 'Open Order Report.pdf';
const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/**
 * @param {{ fromDate?: string; toDate?: string; rows?: object[] }} [data]
 * @param {{ fromDate?: string; toDate?: string }} [meta]
 */
export async function buildOpenOrderReportPdfBlob(data, meta = {}) {
  return buildStatusWiseOrderReportPdfBlob(data, {
    ...meta,
    title: OPEN_ORDER_TITLE,
    documentTitle: OPEN_ORDER_DOCUMENT_TITLE,
  });
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 */
export function openOpenOrderReportPdf(mode, pdfBlob) {
  const namedPdf =
    typeof File !== 'undefined'
      ? new File([pdfBlob], OPEN_ORDER_PDF_FILENAME, { type: 'application/pdf' })
      : new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(namedPdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = OPEN_ORDER_PDF_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
