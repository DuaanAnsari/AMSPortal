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
 *   centerProductionStatusNa?: boolean;
 *   printEmbStrikeOffAlign?: 'left'|'center'|'right';
 * }} ctx
 */
function isProductionStatusNaOnly(prodLines) {
  if (!Array.isArray(prodLines) || prodLines.length !== 1) return false;
  return String(prodLines[0]).trim().toUpperCase() === 'N/A';
}

const PROD_STATUS_FONT = 4.25;
/** Slightly larger than Production Status body — PrintEmbStrikeOffremarksmaster only. */
const PRINT_EMB_STRIKE_OFF_FONT = 5.55;
const PROD_STATUS_LINE_MULT = 1.08;
const PROD_STATUS_PAD_X = 3;
const PROD_STATUS_PAD_TOP = 3;

/**
 * Production Status cell — content centered horizontally + vertically
 * (remarksmaster + PrintEmbStrikeOff). Split first, then center each line
 * (avoids jsPDF maxWidth+center mis-alignment).
 */
function drawProductionStatusCentered(doc, x, y, w, h, mainLines, printEmbLines, rgb) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h, 'S');

  const padX = PROD_STATUS_PAD_X;
  const maxW = Math.max(4, w - 2 * padX);
  const xCenter = x + w / 2;

  /** @type {{ text: string; fontSize: number; lineH: number }[]} */
  const items = [];
  const collect = (lines, fontSize) => {
    if (!lines?.length) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    const lineH = fontSize * PROD_STATUS_LINE_MULT;
    lines.forEach((ln) => {
      doc.splitTextToSize(String(ln), maxW).forEach((part) => {
        items.push({ text: part, fontSize, lineH });
      });
    });
  };
  collect(mainLines, PROD_STATUS_FONT);
  collect(printEmbLines, PRINT_EMB_STRIKE_OFF_FONT);

  const slice = items.slice(0, 10);
  if (!slice.length) {
    doc.setTextColor(0, 0, 0);
    return;
  }

  const blockH = slice.reduce((sum, it) => sum + it.lineH, 0);
  let yy = y + Math.max(PROD_STATUS_PAD_TOP, (h - blockH) / 2);
  const maxY = y + h - PROD_STATUS_PAD_TOP;

  slice.forEach((it) => {
    if (yy + it.lineH > maxY + 0.5) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(it.fontSize);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text(it.text, xCenter, yy + it.lineH / 2, { align: 'center', baseline: 'middle' });
    yy += it.lineH;
  });
  doc.setTextColor(0, 0, 0);
}

export function drawWipPdfMilestoneAndProdTail(ctx) {
  const {
    doc,
    xs,
    y,
    widths,
    row,
    startIndex,
    rowH,
    rgb,
    drawMilestoneDataCell,
    drawMultilineCell,
    centerProductionStatusNa = false,
  } = ctx;

  let i = startIndex;
  const nums = row.statusNums || [];
  const statusCellLines = row.statusCellLines || [];

  for (let k = 0; k < WIP_MILESTONE_PDF_COLUMN_COUNT; k += 1) {
    const mLines = statusCellLines[k];
    // No hardcoded/placeholder dates: when only a legacy numeric qty exists,
    // show just that qty (status empty); otherwise mark the cell not required.
    const fallback =
      (nums[k] ?? 0) !== 0 ? ['Qty', String(nums[k]), ''] : ['Not Required'];
    const cellLines = Array.isArray(mLines) && mLines.length > 0 ? mLines : fallback;
    drawMilestoneDataCell(doc, xs[i], y, widths[i], rowH, cellLines, rgb);
    i += 1;
  }

  const printEmbLines = Array.isArray(row.printEmbStrikeOffRemarksLines)
    ? row.printEmbStrikeOffRemarksLines.filter((l) => l != null && String(l).trim() !== '')
    : [];

  const prodLines =
    Array.isArray(row.productionStatusLines) && row.productionStatusLines.length > 0
      ? row.productionStatusLines
      : printEmbLines.length > 0
        ? []
        : [
            row.productionStatus != null && String(row.productionStatus).trim() !== ''
              ? String(row.productionStatus).trim()
              : 'N/A',
          ];

  // If productionStatus is a joined string that still includes print-emb text (legacy),
  // avoid duplicating when printEmbLines are present.
  const mainLines =
    printEmbLines.length > 0 && prodLines.length === 1 && String(prodLines[0]).includes('\n')
      ? prodLines[0]
          .split(/\r\n|\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .filter((l) => !printEmbLines.includes(l))
      : prodLines;

  if (centerProductionStatusNa && isProductionStatusNaOnly(mainLines) && printEmbLines.length === 0) {
    // Factory / Customer WIP: match milestone "0" — centered horizontally + vertically.
    drawMultilineCell(doc, xs[i], y, widths[i], rowH, mainLines, 'center', 5.05, rgb, {
      lineMult: 1.08,
      maxLines: 1,
      padX: 2,
      vertical: 'middle',
    });
    return;
  }

  const mainForDraw = isProductionStatusNaOnly(mainLines) && printEmbLines.length > 0 ? [] : mainLines;
  drawProductionStatusCentered(
    doc,
    xs[i],
    y,
    widths[i],
    rowH,
    mainForDraw,
    printEmbLines,
    rgb
  );
}
