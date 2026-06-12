import { WIP_MILESTONE_PDF_COLUMN_COUNT } from './factory-wip-report-map';

/**
 * Draw milestone columns + Production Status (Print / Emb. PCS uses same multiline milestone cell).
 * @param {{
 *   doc: import('jspdf').jsPDF;
 *   xs: number[];
 *   y: number;
 *   widths: number[];
 *   row: object;
 *   startIndex: number;
 *   rowH: number;
 *   rgb: number[];
 *   drawMilestoneDataCell: (doc: unknown, x: number, y: number, w: number, h: number, lines: string[], rgb: number[]) => void;
 *   drawMultilineCell: (doc: unknown, x: number, y: number, w: number, h: number, lines: string[], align?: string, fontSize?: number, rgb?: number[], opts?: object) => void;
 * }} ctx
 */
export function drawWipPdfMilestoneAndProdTail(ctx) {
  const { doc, xs, y, widths, row, startIndex, rowH, rgb, drawMilestoneDataCell, drawMultilineCell } = ctx;

  let i = startIndex;
  const nums = row.statusNums || [];
  const statusCellLines = row.statusCellLines || [];

  for (let k = 0; k < WIP_MILESTONE_PDF_COLUMN_COUNT; k += 1) {
    const mLines = statusCellLines[k];
    const fallback =
      (nums[k] ?? 0) !== 0
        ? ['Target Date', 'N/A', 'Submission', 'N/A', 'Approval', 'N/A', String(nums[k])]
        : ['Not Required'];
    const cellLines = Array.isArray(mLines) && mLines.length > 0 ? mLines : fallback;
    drawMilestoneDataCell(doc, xs[i], y, widths[i], rowH, cellLines, rgb);
    i += 1;
  }

  const prodLines =
    Array.isArray(row.productionStatusLines) && row.productionStatusLines.length > 0
      ? row.productionStatusLines
      : [
          row.productionStatus != null && String(row.productionStatus).trim() !== ''
            ? String(row.productionStatus).trim()
            : 'N/A',
        ];
  drawMultilineCell(doc, xs[i], y, widths[i], rowH, prodLines, 'center', 4.25, rgb, {
    lineMult: 1.08,
    maxLines: 10,
    padX: 3,
    padTop: 3,
    vertical: 'top',
  });
}
