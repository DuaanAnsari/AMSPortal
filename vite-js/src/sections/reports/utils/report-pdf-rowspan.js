/** Rowspan frame helpers (Milestone Summary PDF pattern). */

export function drawLeadMergeSectionFrame(doc, xs, y, mergeCount, h, columnWidths) {
  const x0 = xs[0];
  const xEnd = xs[mergeCount - 1] + columnWidths[mergeCount - 1];
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.28);
  doc.rect(x0, y, xEnd - x0, h);
  for (let i = 1; i < mergeCount; i += 1) {
    doc.line(xs[i], y, xs[i], y + h);
  }
}

export function drawColorTailRowSeparator(doc, xs, mergeCount, yRow) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.32);
  doc.line(xs[mergeCount], yRow, xs[xs.length - 1], yRow);
}
