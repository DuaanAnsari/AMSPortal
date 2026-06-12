import { pickField } from './factory-wip-report-map';
import { getWipColorQtyDisplayLines, parseUniqueWipColorQtyValues } from './wip-color-qty-normalize';
import { groupConsecutiveRowsByLeadKey } from './report-row-grouping';

/** Merge columns 0..6; Color / Qty starts at index 7. */
export const WIP_PDF_MERGE_LEAD_COLUMN_COUNT = 7;

function normalizeLeadKeyPart(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** PO + Style + Prod — one WIP line item. */
export function wipPoLeadKeyFromRaw(raw) {
  const po = pickField(raw, 'PONo', 'PoNo', 'pono', 'PO', 'po', 'PoNum');
  const style = pickField(raw, 'StyleNo', 'styleNo', 'Style', 'style', 'StyleCode', 'LRCode', 'lrCode');
  const prod = pickField(raw, 'ProdCode', 'prodCode', 'ProductCode', 'productCode', 'NA', 'na');
  return [po, style, prod].map(normalizeLeadKeyPart).join('\u001f');
}

export function wipPoLeadKeyFromMapped(row) {
  const lines = Array.isArray(row?.poLines) ? row.poLines : [];
  return lines.map(normalizeLeadKeyPart).join('\u001f');
}

function colorKeyFromLine(line) {
  const n = String(line ?? '').trim();
  if (!n || n === '—') return '';
  const m = n.match(/\(([^)]+)\)/);
  return normalizeLeadKeyPart(m ? m[1] : n);
}

export function wipColorKeyFromMapped(row) {
  return colorKeyFromLine(getWipColorQtyDisplayLines(row)[0]);
}

function dedupeColorMappedRows(rows) {
  const seen = new Set();
  const out = [];
  rows.forEach((row, idx) => {
    const ck = wipColorKeyFromMapped(row);
    const key = ck || `__row_${idx}`;
    if (ck && seen.has(ck)) return;
    if (ck) seen.add(ck);
    out.push(row);
  });
  return out.length ? out : rows.slice(0, 1);
}

/** Split one mapped row into one PDF color sub-row per unique Color/Qty value. */
export function expandMappedRowToColorRows(mappedRow) {
  const lines = getWipColorQtyDisplayLines(mappedRow);
  if (lines.length <= 1) {
    const line = lines[0] || '—';
    return [{ ...mappedRow, colorQtyLines: [line], colorQty: line }];
  }
  return lines.map((line) => ({
    ...mappedRow,
    colorQtyLines: [line],
    colorQty: line,
  }));
}

function dedupeColorRawRows(rows) {
  const seen = new Set();
  const out = [];
  rows.forEach((raw, idx) => {
    const combined = pickField(raw, 'ColorQTY', 'ColorQty', 'colorQty', 'Color_QTY');
    const first = parseUniqueWipColorQtyValues(combined)[0];
    const ck = colorKeyFromLine(first);
    const key = ck || `__row_${idx}`;
    if (ck && seen.has(ck)) return;
    if (ck) seen.add(ck);
    out.push(raw);
  });
  return out.length ? out : rows.slice(0, 1);
}

/**
 * Group API rows by PO / Style / Prod (sorted so colors stay together).
 * @param {object[]} rawRows
 */
export function groupWipReportRowsByPoLead(rawRows) {
  const rows = [...(Array.isArray(rawRows) ? rawRows : [])].sort((a, b) =>
    wipPoLeadKeyFromRaw(a).localeCompare(wipPoLeadKeyFromRaw(b))
  );
  return groupConsecutiveRowsByLeadKey(rows, (raw) => {
    const parts = wipPoLeadKeyFromRaw(raw).split('\u001f');
    return parts;
  }).map(({ displayRaw, rows: r }) => ({
    displayRaw,
    rows: dedupeColorRawRows(r),
  }));
}

export function groupWipMappedRowsByPoLead(mappedRows) {
  const rows = [...(Array.isArray(mappedRows) ? mappedRows : [])].sort((a, b) =>
    wipPoLeadKeyFromMapped(a).localeCompare(wipPoLeadKeyFromMapped(b))
  );
  const out = [];
  rows.forEach((row) => {
    const k = wipPoLeadKeyFromMapped(row);
    const prev = out[out.length - 1];
    if (prev && prev._key === k) {
      prev.colorRows.push(row);
    } else {
      out.push({ _key: k, displayRow: row, colorRows: [row] });
    }
  });
  return out.map(({ displayRow, colorRows }) => ({
    displayRow,
    colorRows: dedupeColorMappedRows(colorRows.flatMap((row) => expandMappedRowToColorRows(row))),
  }));
}

/**
 * Group raw API rows, map each, expand multi-color values into separate sub-rows.
 * @param {object[]} rawRows
 * @param {(raw: object, idx: number) => object} mapFn
 */
export function mapWipPdfRowGroupsFromRaw(rawRows, mapFn) {
  return groupWipReportRowsByPoLead(rawRows).map((g) => {
    const displayRow = mapFn(g.displayRaw, 0);
    const colorRows = dedupeColorMappedRows(
      g.rows.flatMap((raw, idx) => expandMappedRowToColorRows(mapFn(raw, idx)))
    );
    return { displayRow, colorRows };
  });
}

/**
 * @param {object[] | { displayRow: object; colorRows: object[] }[]} input
 */
export function normalizeWipPdfRowGroups(input) {
  if (!Array.isArray(input) || input.length === 0) return [];
  if (input[0]?.colorRows) {
    return input.map((g) => ({
      displayRow: g.displayRow,
      colorRows: dedupeColorMappedRows(
        (g.colorRows || []).flatMap((row) => expandMappedRowToColorRows(row))
      ),
    }));
  }
  return groupWipMappedRowsByPoLead(input);
}
