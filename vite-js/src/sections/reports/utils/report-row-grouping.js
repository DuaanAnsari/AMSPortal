/** Shared row grouping + pagination for Milestone-style color rowspan PDF grids. */

export function normalizeLeadKeyPart(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * @param {object[]} rows
 * @param {(raw: object) => unknown[]} keyPartsFor
 * @returns {{ displayRaw: object; rows: object[] }[]}
 */
export function groupConsecutiveRowsByLeadKey(rows, keyPartsFor) {
  const list = Array.isArray(rows) ? rows : [];
  const keyOf = (raw) => keyPartsFor(raw).map(normalizeLeadKeyPart).join('\u001f');
  const out = [];

  list.forEach((raw) => {
    const k = keyOf(raw);
    const prev = out[out.length - 1];
    if (prev && prev._key === k) {
      prev.rows.push(raw);
    } else {
      out.push({ _key: k, displayRaw: raw, rows: [raw] });
    }
  });

  return out.map(({ displayRaw, rows: r }) => ({ displayRaw, rows: r }));
}

/**
 * @param {{ displayRaw?: object; displayRow?: object; rows?: object[]; colorRows?: object[] }[]} grouped
 * @param {{
 *   rowH: number;
 *   pageBottom: number;
 *   getY: () => number;
 *   setY: (y: number) => void;
 *   newPage: () => void;
 *   drawGroup: (y: number, chunkRows: object[], displayRow: object) => number;
 * }} ctx
 */
export function paginateGroupedColorRows(grouped, ctx) {
  const { rowH, pageBottom, getY, setY, newPage, drawGroup } = ctx;
  const list = Array.isArray(grouped) ? grouped : [];

  list.forEach((g) => {
    let rest = g.colorRows ?? g.rows ?? [];
    const display = g.displayRow ?? g.displayRaw;
    while (rest.length) {
      const y = getY();
      const maxRowsThisPage = Math.floor((pageBottom - y) / rowH);
      if (maxRowsThisPage < 1) {
        newPage();
        continue;
      }
      const take = Math.min(maxRowsThisPage, rest.length);
      const chunk = rest.slice(0, take);
      rest = rest.slice(take);
      setY(drawGroup(getY(), chunk, display));
    }
  });
}
