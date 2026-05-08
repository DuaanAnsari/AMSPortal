import * as XLSX from 'xlsx';

import {
  getMilestoneGridColumnSpecs,
  milestoneSummaryMilestoneExcelText,
  milestoneSummaryStack2ExcelText,
  pickField,
} from './milestone-summary-pdf-export';

function formatQtyCell(v) {
  if (v === '' || v == null) return '—';
  const n = Number(v);
  if (Number.isFinite(n)) return n.toLocaleString('en-US');
  return String(v);
}

function rowToExcelValues(row, specs, reportType) {
  return specs.map((spec) => {
    if (spec.kind === 'image') {
      const u = pickField(
        row,
        'ImageUrl',
        'imageUrl',
        'imageurl',
        'StyleImageUrl',
        'styleImageUrl',
        'ThumbnailUrl',
        'thumbnailUrl'
      );
      return u === '' || u == null ? '—' : String(u);
    }
    if (spec.kind === 'left') {
      const t = pickField(row, ...spec.keys);
      return t === '' || t == null ? '—' : String(t);
    }
    if (spec.kind === 'qty') return formatQtyCell(pickField(row, ...spec.keys));
    if (spec.kind === 'stack2') return milestoneSummaryStack2ExcelText(row, spec, reportType);
    if (spec.kind === 'milestone') return milestoneSummaryMilestoneExcelText(row, spec);
    return '';
  });
}

/**
 * @param {object[]} rows
 * @param {'supplierWise'|'merchandiserWise'} reportType
 * @returns {Blob}
 */
export function buildMilestoneSummaryXlsxBlob(rows, reportType) {
  const specs = getMilestoneGridColumnSpecs(reportType);
  const headers = specs.map((s) => s.header);
  const list = Array.isArray(rows) ? rows : [];
  const dataRows = list.map((r) => rowToExcelValues(r, specs, reportType));
  const aoa = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Milestone Summary');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadMilestoneSummaryXlsx(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * @param {'supplierWise'|'merchandiserWise'} reportType
 */
export function buildMilestoneSummaryXlsxFilename(reportType, fromDate, toDate) {
  const typePart = reportType === 'supplierWise' ? 'Supplier-Wise' : 'Merchandiser-Wise';
  const fd = String(fromDate || '').replace(/[^\d-]+/g, '');
  const td = String(toDate || '').replace(/[^\d-]+/g, '');
  return `Milestone-Summary_${typePart}_${fd}_to_${td}.xlsx`;
}
