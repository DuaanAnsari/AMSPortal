import { drawColorTailRowSeparator, drawLeadMergeSectionFrame } from './report-pdf-rowspan';
import { paginateGroupedColorRows } from './report-row-grouping';
import { WIP_PDF_MERGE_LEAD_COLUMN_COUNT } from './wip-pdf-color-row-groups';

export function wipPdfColXs(x0, widths) {
  const xs = [x0];
  for (let i = 0; i < widths.length; i += 1) xs.push(xs[i] + widths[i]);
  return xs;
}

/**
 * Milestone-style rowspan group: merged lead columns + one tail row per color.
 */
export function drawWipPdfDataRowGroup({
  doc,
  y,
  x0,
  widths,
  rowH,
  mergeCount = WIP_PDF_MERGE_LEAD_COLUMN_COUNT,
  chunkRows,
  displayRow,
  drawMergedLeadCells,
  drawColorTailRow,
}) {
  const xs = wipPdfColXs(x0, widths);
  const n = chunkRows.length;
  const hTot = n * rowH;

  drawLeadMergeSectionFrame(doc, xs, y, mergeCount, hTot, widths);
  drawMergedLeadCells(doc, xs, y, widths, hTot, displayRow, mergeCount);

  for (let r = 0; r < n; r += 1) {
    const yRow = y + r * rowH;
    if (r > 0) drawColorTailRowSeparator(doc, xs, mergeCount, yRow);
    drawColorTailRow(doc, xs, yRow, widths, chunkRows[r], mergeCount, rowH);
  }

  return y + hTot;
}

/**
 * Paginate grouped WIP rows across PDF pages (Milestone Summary pattern).
 */
export function paginateWipPdfGroupedRows({
  doc,
  groups,
  rowH,
  pageBodyBottom,
  getY,
  setY,
  startPage,
  flushSegmentFrame,
  pageSize,
  drawRowGroup,
}) {
  paginateGroupedColorRows(groups, {
    rowH,
    pageBottom: pageBodyBottom,
    getY,
    setY,
    newPage: () => {
      flushSegmentFrame();
      doc.addPage(pageSize, 'l');
      startPage();
    },
    drawGroup: (y, chunkRows, displayRow, chunkMeta) =>
      drawRowGroup(y, chunkRows, displayRow, chunkMeta),
  });
}
