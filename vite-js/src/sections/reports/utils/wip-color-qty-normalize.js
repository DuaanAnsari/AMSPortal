/**
 * Color / QTY display helpers for WIP PDF grids (Factory, Customer, AMS).
 * Parses multi-value API strings, removes duplicates, normalizes formatting.
 */

const CANONICAL_TOKEN = /\d+\s*-\s*\([^)]+\)/g;

/** @param {unknown} input */
export function normalizeWipColorQtyText(input) {
  if (input == null || input === '') return '—';
  let s = String(input).replace(/\s+/g, ' ').trim();
  if (!s || s === '—') return '—';

  const canonical = s.match(/\d+\s*-\s*\([^)]+\)/);
  if (canonical) {
    s = canonical[0];
  }

  let prev = '';
  while (prev !== s) {
    prev = s;
    const wrapped = s.match(/^\(+(\d+\s*-\s*\([^)]+\))\)+$/);
    if (wrapped) {
      s = wrapped[1].trim();
      continue;
    }
    const leadWrap = s.match(/^\((\d+\s*-\s*\([^)]+\)?)$/);
    if (leadWrap) {
      s = leadWrap[1].trim();
      if (!s.endsWith(')')) s = `${s})`;
    }
  }

  s = s.replace(/^(\d+)\s*-\s*\(/, '$1- (');
  s = s.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');

  return s.trim() || '—';
}

/** @param {unknown} input */
function extractColorQtyTokens(input) {
  const s = String(input ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return [];

  const matches = s.match(CANONICAL_TOKEN);
  if (matches?.length) return matches;

  if (/[,;\n|]/.test(s)) {
    return s
      .split(/[,;\n|]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [s];
}

/** @param {unknown} input @returns {string[]} */
export function parseUniqueWipColorQtyValues(input) {
  const tokens = extractColorQtyTokens(input);
  const seen = new Set();
  const out = [];

  tokens.forEach((token) => {
    const normalized = normalizeWipColorQtyText(token);
    if (!normalized || normalized === '—') return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(normalized);
  });

  return out.length ? out : ['—'];
}

/** True when value already uses WIP canonical color/qty token(s), e.g. `1- (NAVY_3984)`. */
function hasCanonicalWipColorQtyToken(input) {
  const s = String(input ?? '').trim();
  if (!s) return false;
  if (CANONICAL_TOKEN.test(s)) return true;
  return parseUniqueWipColorQtyValues(s).some((line) => CANONICAL_TOKEN.test(line));
}

/**
 * @param {Record<string, unknown>} row
 * @param {(row: Record<string, unknown>, ...keys: string[]) => unknown} pickFieldFn
 * @returns {string[]}
 */
export function buildWipColorQtyLines(row, pickFieldFn) {
  const combined = pickFieldFn(
    row,
    'ColorQTY',
    'ColorQty',
    'colorQty',
    'Color_QTY',
    'Color_Qty',
    'ColorQtyDisplay'
  );
  const colorWay = pickFieldFn(
    row,
    'ColorWay',
    'colorWay',
    'Colorway',
    'colorway',
    'Color',
    'color',
    'Colour',
    'colour'
  );

  if (combined !== '' && combined != null) {
    const combinedStr = String(combined).trim();
    if (hasCanonicalWipColorQtyToken(combinedStr)) {
      return parseUniqueWipColorQtyValues(combined);
    }

    const colorStr = colorWay != null ? String(colorWay).trim() : '';
    if (colorStr) {
      if (/^\d+\s*-\s*\(/.test(colorStr)) {
        return parseUniqueWipColorQtyValues(colorStr);
      }
      const stacked = `${colorStr}\n${combinedStr}`;
      return stacked.trim() ? [stacked] : ['—'];
    }

    return parseUniqueWipColorQtyValues(combined);
  }

  const color = pickFieldFn(
    row,
    'ColorWay',
    'colorWay',
    'Colorway',
    'colorway',
    'Color',
    'color',
    'Colour',
    'colour'
  );
  const qty = pickFieldFn(row, 'Qty', 'qty', 'ColorQuantity', 'colorQuantity');

  if (color && qty) {
    const c = String(color).trim();
    const q = String(qty).trim();
    const qLines = parseUniqueWipColorQtyValues(q);
    if (qLines.length > 1) return qLines;
    if (/^\d+\s*-\s*\(/.test(c)) return parseUniqueWipColorQtyValues(c);
    if (parseUniqueWipColorQtyValues(c).length > 1) return parseUniqueWipColorQtyValues(c);
    const single = normalizeWipColorQtyText(/^\([^)]+\)$/.test(q) ? `${c} ${q}` : `${c} (${q})`);
    return single === '—' ? ['—'] : [single];
  }

  if (color) return parseUniqueWipColorQtyValues(color);
  if (qty) return parseUniqueWipColorQtyValues(qty);
  return ['—'];
}

/** @param {{ colorQtyLines?: string[]; colorQty?: unknown }} row */
export function getWipColorQtyDisplayLines(row) {
  if (Array.isArray(row?.colorQtyLines) && row.colorQtyLines.length) {
    return row.colorQtyLines;
  }
  return parseUniqueWipColorQtyValues(row?.colorQty);
}

/** Lines for one Color / QTY PDF cell (splits stacked ColorWay + Qty). */
export function getWipColorQtyCellRenderLines(row) {
  const lines = getWipColorQtyDisplayLines(row);
  const first = lines[0];
  if (!first || first === '—') return ['—'];
  const parts = String(first)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : ['—'];
}
