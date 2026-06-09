/**
 * Standard garment size display order (small → large).
 * Used by inspection OVERALL CONCLUSION, PDF, and any size lists — not alphabetical.
 *
 * Youth:  YS < YM < YL < YXL
 * Adult:  XXS < XS < S < M < L < XL < XXL < XXXL < 4XL < 5XL …
 */

/** Rank increases left → right (smaller → larger). Aliases share the same rank. */
const GARMENT_SIZE_RANK = new Map([
  // Youth
  ['YXXS', 10],
  ['YXS', 20],
  ['YS', 30],
  ['YM', 40],
  ['YL', 50],
  ['YXL', 60],
  ['YXXL', 70],
  // Adult
  ['XXS', 100],
  ['XS', 110],
  ['S', 120],
  ['M', 130],
  ['L', 140],
  ['XL', 150],
  ['XXL', 160],
  ['2XL', 170],
  ['XXXL', 180],
  ['3XL', 180],
  ['4XL', 190],
  ['XXXXL', 190],
  ['5XL', 200],
  ['XXXXXL', 200],
  ['6XL', 210],
]);

/**
 * @param {string} label
 * @returns {string}
 */
export function normalizeGarmentSizeToken(label) {
  let s = String(label ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!s) return '';

  if (s === 'XXXXL') return '4XL';
  if (s === 'XXXXXL') return '5XL';
  if (s === 'XXXL') return '3XL';
  if (/^\d+X$/.test(s)) return `${s.slice(0, -1)}XL`;

  return s;
}

/**
 * @param {string} label
 * @returns {{ rank: number; numericPrimary?: number; numericSecondary?: number; raw: string }}
 */
export function getGarmentSizeSortMeta(label) {
  const raw = String(label ?? '').trim();
  const token = normalizeGarmentSizeToken(raw);

  if (!token) {
    return { rank: Number.POSITIVE_INFINITY, raw };
  }

  if (GARMENT_SIZE_RANK.has(token)) {
    return { rank: GARMENT_SIZE_RANK.get(token), raw };
  }

  // Numeric garment sizes: 04, 4, 05-6, 12-14 …
  const numeric = /^(\d+)(?:[-/](\d+))?$/.exec(token);
  if (numeric) {
    const primary = parseInt(numeric[1], 10);
    const secondary = numeric[2] != null ? parseInt(numeric[2], 10) : primary;
    return {
      rank: 500,
      numericPrimary: Number.isFinite(primary) ? primary : 0,
      numericSecondary: Number.isFinite(secondary) ? secondary : 0,
      raw,
    };
  }

  // Unknown token — after known sizes; stable tie-break via raw label
  return { rank: 9000, raw };
}

/**
 * Compare two size labels for display sort (negative = a before b).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareGarmentSizeLabels(a, b) {
  const ma = getGarmentSizeSortMeta(a);
  const mb = getGarmentSizeSortMeta(b);

  if (ma.rank !== mb.rank) return ma.rank - mb.rank;

  if (ma.rank === 500 && mb.rank === 500) {
    if (ma.numericPrimary !== mb.numericPrimary) {
      return ma.numericPrimary - mb.numericPrimary;
    }
    if (ma.numericSecondary !== mb.numericSecondary) {
      return ma.numericSecondary - mb.numericSecondary;
    }
  }

  return ma.raw.localeCompare(mb.raw, undefined, { numeric: true, sensitivity: 'base' });
}

/** @param {string[]} labels */
export function sortGarmentSizeLabels(labels) {
  return [...labels].sort(compareGarmentSizeLabels);
}

/**
 * Stable sort items by garment size label.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} getLabel
 * @returns {T[]}
 */
export function sortItemsByGarmentSizeLabel(items, getLabel) {
  if (!Array.isArray(items) || items.length <= 1) return items ? [...items] : [];
  return items
    .map((item, index) => ({ item, index, label: getLabel(item) }))
    .sort((a, b) => {
      const diff = compareGarmentSizeLabels(a.label, b.label);
      if (diff !== 0) return diff;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

/** @param {{ slot: number; label: string }[]} columns */
export function sortGarmentSizeMatrixColumns(columns) {
  if (!Array.isArray(columns) || columns.length <= 1) return columns ? [...columns] : [];
  return columns
    .map((col, index) => ({ col, index }))
    .sort((a, b) => {
      const diff = compareGarmentSizeLabels(a.col.label, b.col.label);
      if (diff !== 0) return diff;
      return a.col.slot - b.col.slot || a.index - b.index;
    })
    .map(({ col }) => col);
}
