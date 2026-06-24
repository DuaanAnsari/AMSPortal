import jsPDF from 'jspdf';

import { formatLdpFobDisplayDate } from './ldp-fob-demo-export';

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

/** Vertical padding (top/bottom). Kept tight so the table fills almost the full page. */
const V_MARGIN = 6;
/** Small left/right inset so the table frame does not clip at page edges when printing or zooming. */
const H_MARGIN = 4;
const HEADER_BLOCK_H = 96;
const TABLE_HEADER_ROW_H = 46;
const DATA_ROW_H = 70;

/** Fixed max inner image box inside merged Image column (rowspan-aware; centered in cell). */
const MERGED_LEAD_IMAGE_BOX_MAX_PT = { w: 40, h: 48 };
const TITLE_BLUE = [0, 51, 153];

/**
 * Page width / height (pt) — fixed size for paging + browser PDF viewer.
 * Width widened beyond A4 landscape (842) so all columns — especially the 16
 * milestone date columns — get enough room for the status value + full date
 * (e.g. `31 May 2026`) on a single line at the normal font. Height kept at A4
 * landscape so rows-per-page (pagination) is unchanged.
 */
const PAGE_WIDTH_PT = 1000;
const PAGE_HEIGHT_PT = 595;

/** Default zoom when opening PDF in browser (Chrome/Edge) */
const PDF_VIEW_ZOOM_HASH = '#zoom=110';

/**
 * Width weight for every milestone date column. Bumped from 36 → 46 so the
 * status value + full date (e.g. `31 Jan 2026`) sit comfortably inside the
 * cell instead of looking cramped / clipping at the border. Only the milestone
 * columns use this; all other columns keep their original weights.
 */
const MILESTONE_COL_WEIGHT = 46;

/**
 * Milestone columns — API field names per `/api/Report/GetMilestoneReport` mapping (with common casing fallbacks).
 * @type {Array<{ weight: number; header: string; kind: string; keys?: string[]; statusKeys?: string[]; k1?: string[]; k2?: string[]; align?: string }>}
 */
const MILESTONE_API_TAIL = [
  { weight: MILESTONE_COL_WEIGHT, header: 'Lab Dip', kind: 'milestone', keys: ['Lab Dip', 'LabDip', 'labDip'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Proto /\nFIT', kind: 'milestone', keys: ['FIT', 'ProtoFIT', 'ProtoFit', 'Proto'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Dye Lot /\nBlanket', kind: 'milestone', keys: ['Dye Lot/Blanket', 'DyeLotBlanket', 'dyeLotBlanket'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Size Set\nto TD', kind: 'milestone', keys: ['Size set', 'SizeSetTD', 'SizesetTD', 'SizeSetToTD'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Size set\nto Buyer', kind: 'milestone', keys: ['Size set to Buyer', 'SizesettoBuyer', 'SizeSetBuyer', 'sizesettoBuyer'] },
  {
    weight: MILESTONE_COL_WEIGHT,
    header: 'Print Mockup /\nStrike off',
    kind: 'milestone',
    keys: ['Print / Emb/ Strike off', 'PrintMockupStrikeoff', 'PrintEmbStrikeoff', 'printEmbStrikeoff'],
  },
  { weight: MILESTONE_COL_WEIGHT, header: 'PP Sample\nto Buyer', kind: 'milestone', keys: ['PP', 'PPSample', 'pp'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Testing\nLocal', kind: 'milestone', keys: ['Testing', 'TestingLocal', 'testing'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Testing\nnominated', kind: 'milestone', keys: ['Testing Nominated', 'TestingNominated', 'testingNominated'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Knitting /\nFabric in house', kind: 'milestone', keys: ['Knitting', 'knitting'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Dying', kind: 'milestone', keys: ['Dying', 'dying', 'Dyeing'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Cutting', kind: 'milestone', keys: ['Cutting', 'cutting'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Print /\nEmb.', kind: 'milestone', keys: ['Print / Emb.', 'PrintEmb', 'printEmb', 'PrintEmbroidery'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Stitching', kind: 'milestone', keys: ['Stitching', 'Stiching', 'stitching'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Washing', kind: 'milestone', keys: ['Washing', 'washing'] },
  { weight: MILESTONE_COL_WEIGHT, header: 'Packing', kind: 'milestone', keys: ['Packing', 'packing'] },
  {
    weight: 46,
    header: 'FRI',
    kind: 'friCombined',
    /**
     * API returns FRI as a single combined string e.g. `"0% ES: 31 Jan 2026"`.
     * Parsed into top = `0%`, bottom = `31-Jan-2026`.
     * `k1`/`k2` kept for backward compatibility if the backend ever splits them.
     */
    keys: ['FRI', 'fri', 'FRI1', 'fri1'],
    k1: ['FRI', 'FRI1', 'fri'],
    k2: ['FRI', 'FRI2', 'FRIEstemated', 'fri2'],
  },
];

const SHIPMENT_SPEC_API = {
  weight: 52,
  header: 'Shipment\nDate',
  kind: 'stack2',
  /** Bind dates as returned by API (`yyyy-mm-dd`); do not reformat to locale strings. */
  stackDateMode: 'iso',
  k1: [
    'ShipmentDate1',
    'shipmentDate1',
    'ShipmentDate',
    'shipmentDate',
    'shipmentdate',
    'CustomerShipmentDate',
    'customerShipmentDate',
  ],
  k2: [
    'ShipmentDate2',
    'shipmentDate2',
    'ShipmentDateE',
    'shipmentDateE',
    'shipmentdatee',
    'ShipmentDateEE',
  ],
};

const QTY_SPEC_API = {
  // Slightly wider so "<qty> <unit>" (e.g. "15 PCS") fits on one line.
  weight: 48,
  header: 'QTY',
  kind: 'qty',
  keys: ['BookedQuantity', 'bookedQuantity', 'Quantity', 'quantity', 'QTY', 'qty'],
};

/** Color column — driven by the API's `Colorway` field (with casing fallbacks). */
const COLOR_SPEC_API = {
  weight: 54,
  header: 'Color',
  kind: 'left',
  align: 'center',
  keys: ['Colorway', 'colorway', 'ColorWay', 'colorWay', 'Color', 'color', 'Colour', 'colour'],
};

/** Merchandiser-wise: Image first, then PO → Supplier → Customer → Color → … (API rows). */
const COL_TEMPLATE_MERCHANDISER_WISE = [
  { weight: 42, header: 'Image', kind: 'image' },
  { weight: 64, header: 'PO No.', kind: 'left', keys: ['pono', 'PONO', 'PoNo', 'poNo'] },
  {
    weight: 78,
    header: 'Supplier',
    kind: 'left',
    keys: [
      'vendername',
      'VenderName',
      'venderName',
      'SupplierName',
      'supplierName',
      'suppliername',
      'VendorName',
      'vendorName',
      'vendorname',
      'Supplier',
      'supplier',
      'Vendor',
      'vendor',
      'Vender',
      'vender',
    ],
  },
  { weight: 78, header: 'Customer', kind: 'left', keys: ['customername', 'CustomerName', 'customerName', 'BuyerName'] },
  { ...COLOR_SPEC_API },
  { ...SHIPMENT_SPEC_API },
  { ...QTY_SPEC_API },
  ...MILESTONE_API_TAIL.map((c) => ({ ...c })),
];

/** Supplier-wise: Merchandiser (`username`) then PO → Customer → Color → … */
const COL_TEMPLATE_SUPPLIER_WISE = [
  {
    weight: 134,
    header: 'Merchandiser',
    kind: 'left',
    align: 'center',
    keys: ['username', 'Username', 'userName', 'MerchandiserName', 'merchandiserName', 'MerchName'],
  },
  { weight: 64, header: 'PO No.', kind: 'left', align: 'center', keys: ['pono', 'PONO', 'PoNo', 'poNo'] },
  { weight: 92, header: 'Customer', kind: 'left', align: 'center', keys: ['customername', 'CustomerName', 'customerName', 'BuyerName'] },
  { ...COLOR_SPEC_API },
  { ...SHIPMENT_SPEC_API },
  { ...QTY_SPEC_API },
  ...MILESTONE_API_TAIL.map((c) => ({ ...c })),
];

function pickColTemplate(reportType) {
  return reportType === 'supplierWise' ? COL_TEMPLATE_SUPPLIER_WISE : COL_TEMPLATE_MERCHANDISER_WISE;
}

/** How many leading columns merge when PO + Supplier + Customer (or supplier-wise lead) repeat. */
function mergeLeadColumnCount(reportType) {
  return reportType === 'supplierWise' ? 3 : 4;
}

function normalizeLeadKeyPart(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Group consecutive API rows that share the same PO / Supplier / Customer (merchandiser-wise)
 * or Merchandiser / PO / Customer (supplier-wise) so the PDF can rowspan-merge those columns.
 *
 * @param {object[]} rows
 * @param {'supplierWise'|'merchandiserWise'} reportType
 * @returns {{ displayRaw: object; rows: object[] }[]}
 */
export function groupMilestoneRowsByLeadKey(rows, reportType = 'merchandiserWise') {
  const template = pickColTemplate(reportType);
  const keyPartsFor = (raw) => {
    if (reportType === 'supplierWise') {
      return [
        pickField(raw, ...(template[0].keys || [])),
        pickField(raw, ...(template[1].keys || [])),
        pickField(raw, ...(template[2].keys || [])),
      ];
    }
    return [
      pickField(raw, ...(template[1].keys || [])),
      pickField(raw, ...(template[2].keys || [])),
      pickField(raw, ...(template[3].keys || [])),
    ];
  };
  const keyOf = (raw) => keyPartsFor(raw).map(normalizeLeadKeyPart).join('\u001f');

  const out = [];
  rows.forEach((raw) => {
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
 * Column specs for Excel — same headers & field mapping as the PDF grid (`\n` → space in header text).
 * @param {'supplierWise'|'merchandiserWise'} reportType
 */
export function getMilestoneGridColumnSpecs(reportType) {
  const template = pickColTemplate(reportType);
  return template.map(({ header, keys, kind, k1, k2, statusKeys, stackDateMode }) => ({
    header: String(header || '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    keys: keys || [],
    kind,
    k1: k1 || [],
    k2: k2 || [],
    statusKeys: statusKeys || [],
    stackDateMode: stackDateMode || null,
  }));
}

/** @type {{ pageW: number; colDef: Array<{ w: number } & Record<string, unknown>>; gridLeft: number; reportType: string } | null} */
let layoutSnapshot = null;

function createLayout(pageW, hMargin, reportType = 'merchandiserWise') {
  const gridLeft = hMargin;
  const contentW = pageW - 2 * hMargin;
  const template = pickColTemplate(reportType);
  const sumW = template.reduce((s, c) => s + c.weight, 0);
  const colDef = template.map((c) => ({ ...c, w: 0 }));
  let used = 0;
  for (let i = 0; i < colDef.length - 1; i += 1) {
    colDef[i].w = Math.floor((colDef[i].weight / sumW) * contentW);
    used += colDef[i].w;
  }
  colDef[colDef.length - 1].w = contentW - used;
  return { pageW, colDef, gridLeft, reportType };
}

function tableWidth() {
  if (!layoutSnapshot) return Math.max(1, PAGE_WIDTH_PT - 2 * H_MARGIN);
  return layoutSnapshot.colDef.reduce((s, c) => s + c.w, 0);
}

function colXs() {
  if (!layoutSnapshot) return [];
  const xs = [];
  let x = layoutSnapshot.gridLeft;
  for (let i = 0; i < layoutSnapshot.colDef.length; i += 1) {
    xs.push(x);
    x += layoutSnapshot.colDef[i].w;
  }
  return xs;
}

export function pickField(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    if (k in obj) {
      const v = obj[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  const map = {};
  for (const k of Object.keys(obj)) {
    map[k.toLowerCase()] = obj[k];
  }
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    const v = map[String(k).toLowerCase()];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function formatIsoToHeader(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso || '');
  const d = new Date(`${iso}T12:00:00`);
  return d
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, '-');
}

function formatShipmentFriDate(raw) {
  if (raw == null || raw === '' || raw === '0' || raw === 0) return '';
  let d;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw).trim());
  if (iso) d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`);
  else d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}-${mon}-${d.getFullYear()}`;
}

/** Supplier-wise Crystal style: MM-DD-YYYY (e.g. 03-15-2026). */
function formatShipmentUsMdY(raw) {
  if (raw == null || raw === '' || raw === '0' || raw === 0) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw).trim());
  if (!iso) {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}-${d.getFullYear()}`;
  }
  return `${iso[2]}-${iso[3]}-${iso[1]}`;
}

/**
 * Shipment column: show API date as `yyyy-mm-dd` when the value starts with ISO date (or `yyyy/mm/dd`);
 * otherwise return trimmed string unchanged (no locale reformat).
 * @param {unknown} raw
 */
function displayMilestoneShipmentDateIso(raw) {
  if (raw == null || raw === '' || raw === '0' || raw === 0) return '';
  const s = String(raw).trim();
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (iso) return iso[1];
  const ymdSlash = /^(\d{4})\/(\d{2})\/(\d{2})/.exec(s);
  if (ymdSlash) return `${ymdSlash[1]}-${ymdSlash[2]}-${ymdSlash[3]}`;
  return s;
}

function formatMilestoneDate(raw) {
  if (raw == null || raw === '' || raw === '0' || raw === 0) return '';
  const s = formatLdpFobDisplayDate(raw);
  if (s === '—') return '';
  const m = /^(\d{1,2}) (\w+) (\d{4})$/.exec(s);
  if (m) return `${m[1].padStart(2, '0')} ${m[2]} ${m[3]}`;
  return s;
}

function formatPrintStamp() {
  const d = new Date();
  const dateRaw = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const date = dateRaw.replace(/ /g, '-');
  const time = d
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
  return `Print Date: ${date} ${time}`;
}

function statementTitle(reportType) {
  if (reportType === 'supplierWise') return 'Supplier Wise Statement of Milestone Summary';
  return 'Merchandiser Wise Statement of Milestone Summary';
}

async function loadLogoDataUrl() {
  const res = await fetch(LOGO_PATH);
  if (!res.ok) throw new Error(`logo ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

// ----------------------------------------------------------------------
// Row-image fetch + cache pipeline.
//
// The PDF can be triggered with rows containing remote `ImageUrl`s
// (S3 / CDN), API-origin image endpoints (auth-protected), relative
// `/Files/...` paths, inline `data:` blobs, or no image at all. To
// guarantee that every image is fully decoded *before* the PDF page is
// drawn (and to keep embedded images sharp + aspect-correct), we pre-
// fetch every row image in parallel, deduped by URL, with per-image
// timeouts.
//
// Attempt order per URL:
//   1. If the resolved URL hits the API origin (matches
//      `VITE_API_BASE_URL` or is relative `/…`), `fetch` with the
//      caller-provided `Authorization` header — same token the report
//      API itself uses. This is the only way to read auth-protected
//      image endpoints from the browser, since `<img src>` cannot carry
//      a Bearer header.
//   2. Public `fetch(url, { mode: 'cors', credentials: 'omit' })`.
//   3. `<img crossOrigin="anonymous">` + `<canvas>` re-encode — covers
//      cross-origin servers that honor CORS for images but not for
//      fetch.
//   4. Last resort: anonymous `<img>` (no crossOrigin) + `<canvas>` —
//      may still produce a tainted canvas (placeholder will render in
//      that case).
// All paths share an `AbortController` / `setTimeout` watchdog so a
// hung image never blocks the report.
//
// Every step logs to `console.debug` / `console.warn` under the
// `[MilestoneSummary][Image]` namespace so failures are diagnosable from
// the browser console without touching the UI.
//
// A failure on any single image silently falls back to the existing
// `NO IMAGE AVAILABLE` placeholder — the rest of the table, and the
// PDF as a whole, never breaks.
// ----------------------------------------------------------------------

/**
 * Field names that may carry an image on a milestone row. Two flavors are
 * supported:
 *   - URL-like values (`http(s)://…`, `/Files/…`, relative path) — fetched.
 *   - Raw Base64 payloads (the API's `POImage` field returns these with NO
 *     `data:image/…;base64,` prefix). We sniff the magic prefix to pick the
 *     right MIME (`/9j/` → JPEG, `iVBOR` → PNG, …) and wrap as a data URI
 *     before measuring / embedding.
 */
const IMAGE_FIELD_KEYS = [
  'POImage',
  'poImage',
  'POIMAGE',
  'PoImage',
  'StyleImage',
  'styleImage',
  'Image',
  'image',
  'ImageBase64',
  'imageBase64',
  'ImageUrl',
  'imageUrl',
  'imageurl',
  'ImageURL',
  'StyleImageUrl',
  'styleImageUrl',
  'ThumbnailUrl',
  'thumbnailUrl',
  'ImagePath',
  'imagePath',
];

const IMAGE_FETCH_TIMEOUT_MS = 12000;
const IMAGE_FETCH_CONCURRENCY = 6;
const IMAGE_LOG_TAG = '[MilestoneSummary][Image]';

function imgDebug(...args) {
  try {
    // eslint-disable-next-line no-console -- diagnostics
    console.debug(IMAGE_LOG_TAG, ...args);
  } catch {
    /* no-op */
  }
}

function imgInfo(...args) {
  try {
    // eslint-disable-next-line no-console -- diagnostics
    console.info(IMAGE_LOG_TAG, ...args);
  } catch {
    /* no-op */
  }
}

function imgWarn(...args) {
  try {
    // eslint-disable-next-line no-console -- diagnostics
    console.warn(IMAGE_LOG_TAG, ...args);
  } catch {
    /* no-op */
  }
}

/** Read the API base URL the same way `milestone-summary-report-api.js` does. */
function getApiBaseUrl() {
  try {
    const base = String(import.meta.env?.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
    return base;
  } catch {
    return '';
  }
}

/** Resolve any image string (relative path, absolute URL, data URL) into a fetchable URL. */
function resolveImageUrl(raw) {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (s.startsWith('data:')) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^blob:/i.test(s)) return s;
  /**
   * Defensive guard: if a raw Base64 image string slips through this far
   * (e.g. caller forgot to short-circuit it), NEVER append it to the API
   * base — that produces nonsense URLs like `http://api/9j/4AAQ…`. Return
   * empty so the caller can fall back to the placeholder instead.
   */
  if (looksLikeRawBase64Image(s)) {
    imgWarn(
      'resolveImageUrl received raw Base64 image data; refusing to build a URL out of it.',
      { preview: `${s.slice(0, 24)}…` }
    );
    return '';
  }
  const base = getApiBaseUrl();
  if (!base) return s;
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

/** True if the URL targets the same origin as `VITE_API_BASE_URL` (or is relative to it). */
function isApiOriginUrl(originalRaw, resolved) {
  try {
    const raw = String(originalRaw || '').trim();
    if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return false;
    if (raw.startsWith('/')) return true;
    if (!/^https?:\/\//i.test(raw)) return true;
    const base = getApiBaseUrl();
    if (!base) return false;
    const baseOrigin = new URL(base).origin;
    const urlOrigin = new URL(resolved).origin;
    return baseOrigin === urlOrigin;
  } catch {
    return false;
  }
}

/**
 * Detect whether a string is a raw Base64-encoded image (i.e. backend returned
 * the bytes WITHOUT a `data:image/…;base64,` prefix). The CRITICAL ordering:
 * Base64 magic prefixes are matched FIRST, before any URL heuristic, because
 * JPEG payloads literally start with `/9j/` — if the leading `/` were treated
 * as a path separator we would mistakenly prepend `VITE_API_BASE_URL` and end
 * up requesting `http://<api>/9j/4AAQ…`, which is exactly the bug we are
 * fixing here.
 */
function looksLikeRawBase64Image(raw) {
  if (raw == null) return false;
  const s = String(raw).trim();
  if (s.length < 24) return false;

  /**
   * Step 1 — exclude things that are already URL-shaped on their own.
   * (`data:` / `blob:` / `http(s)://` cannot also be Base64 image data.)
   */
  if (s.startsWith('data:')) return false;
  if (s.startsWith('blob:')) return false;
  if (/^https?:\/\//i.test(s)) return false;

  /**
   * Step 2 — known Base64 magic prefixes. These run BEFORE the
   * `startsWith('/')` URL check, otherwise `/9j/…` (JPEG) would be
   * misclassified as a relative path.
   */
  if (s.startsWith('/9j/')) return true; // JPEG
  if (s.startsWith('iVBOR')) return true; // PNG
  if (s.startsWith('R0lGOD')) return true; // GIF
  if (s.startsWith('UklGR')) return true; // WEBP
  if (s.startsWith('Qk')) return true; // BMP

  /**
   * Step 3 — bail out for things that look like relative or absolute paths
   * (e.g. `/Files/POImage/abc.jpg`) so they go through the fetch path.
   */
  if (s.startsWith('/')) return false;

  /** Step 4 — generic Base64 fallback (long string, only Base64-safe chars). */
  if (s.length < 80) return false;
  return /^[A-Za-z0-9+/=\r\n]+$/.test(s.slice(0, 256));
}

/** Best-effort MIME type for a raw Base64 image payload (magic prefix sniff). */
function sniffBase64Mime(raw) {
  const s = String(raw || '').trim();
  if (s.startsWith('/9j/')) return 'image/jpeg';
  if (s.startsWith('iVBOR')) return 'image/png';
  if (s.startsWith('R0lGOD')) return 'image/gif';
  if (s.startsWith('UklGR')) return 'image/webp';
  if (s.startsWith('Qk')) return 'image/bmp';
  return 'image/jpeg';
}

/** Pull a Bearer token from local storage as a defensive default. */
function getDefaultAuthHeader() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    /* ignore */
  }
  return {};
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = () => reject(new Error('FileReader failed'));
    fr.readAsDataURL(blob);
  });
}

/** Decide the jsPDF image format string from a MIME type / URL extension. */
function detectImageFormat(mimeType, url) {
  const t = String(mimeType || '').toLowerCase();
  if (t.includes('png')) return 'PNG';
  if (t.includes('jpeg') || t.includes('jpg')) return 'JPEG';
  if (t.includes('webp')) return 'WEBP';
  if (t.includes('gif')) return 'GIF';
  const lower = String(url || '').toLowerCase().split('?')[0];
  if (lower.endsWith('.png')) return 'PNG';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'JPEG';
  if (lower.endsWith('.webp')) return 'WEBP';
  if (lower.endsWith('.gif')) return 'GIF';
  return 'PNG';
}

function detectImageFormatFromDataUrl(dataUrl) {
  const m = /^data:([^;]+);/i.exec(String(dataUrl || ''));
  return detectImageFormat(m ? m[1] : '', '');
}

/** Read an image's pixel dimensions from any (data | http) URL. */
function loadImageDimensions(src, timeoutMs) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      try {
        img.src = '';
      } catch {
        /* ignore */
      }
      reject(new Error('image dimensions timeout'));
    }, timeoutMs);
    img.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      resolve({ w: img.naturalWidth || 0, h: img.naturalHeight || 0 });
    };
    img.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      reject(new Error('image dimensions load failed'));
    };
    img.src = src;
  });
}

/** Try `<img crossOrigin="anonymous">` + canvas re-encode. */
function loadImageViaElement(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      try {
        img.src = '';
      } catch {
        /* ignore */
      }
      reject(new Error('image element timeout'));
    }, timeoutMs);
    img.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1;
        canvas.height = img.naturalHeight || 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no 2d context');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          dataUrl,
          format: 'PNG',
          naturalW: img.naturalWidth || 0,
          naturalH: img.naturalHeight || 0,
        });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      reject(new Error('image element load failed'));
    };
    img.src = url;
  });
}

/**
 * Run a fetch against `url` with the given headers and convert the response
 * blob into a `{ dataUrl, format, naturalW, naturalH }` payload.
 *
 * @param {string} url
 * @param {{ Authorization?: string } & Record<string, string>} [headers]
 * @param {number} timeoutMs
 * @returns {Promise<{ dataUrl: string; format: string; naturalW: number; naturalH: number; status: number } | null>}
 */
async function fetchImageToInfo(url, headers, timeoutMs, { label }) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort('timeout'), timeoutMs);
  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache',
      signal: controller.signal,
      headers: headers && Object.keys(headers).length > 0 ? headers : undefined,
    });
  } catch (err) {
    clearTimeout(t);
    imgWarn(`[${label}] fetch threw — likely blocked by CORS or network`, {
      url,
      error: err?.message || err,
      hint:
        'Server probably did not return Access-Control-Allow-Origin for this origin (CORS), the request was aborted, or the host is unreachable.',
    });
    return null;
  }
  clearTimeout(t);

  if (!res.ok) {
    imgWarn(`[${label}] HTTP ${res.status} ${res.statusText}`, { url });
    return { status: res.status, dataUrl: '', format: '', naturalW: 0, naturalH: 0 };
  }

  const blob = await res.blob();
  if (!blob || blob.size === 0) {
    imgWarn(`[${label}] empty response body`, { url });
    return null;
  }

  let dataUrl;
  try {
    dataUrl = await blobToDataUrl(blob);
  } catch (err) {
    imgWarn(`[${label}] blob → base64 conversion failed`, { url, error: err?.message || err });
    return null;
  }
  if (!dataUrl) {
    imgWarn(`[${label}] empty base64 payload`, { url });
    return null;
  }

  const format = detectImageFormat(blob.type, url);
  let size = { w: 0, h: 0 };
  try {
    size = await loadImageDimensions(dataUrl, timeoutMs);
  } catch (err) {
    imgWarn(`[${label}] dimension probe failed (will fit-as-square)`, {
      url,
      error: err?.message || err,
    });
  }

  imgInfo(`[${label}] ok`, {
    url,
    type: blob.type,
    bytes: blob.size,
    format,
    naturalW: size.w,
    naturalH: size.h,
  });

  return { dataUrl, format, naturalW: size.w, naturalH: size.h, status: res.status };
}

/**
 * Resolve a single image URL into a `{ dataUrl, format, naturalW, naturalH }`
 * payload. Tries auth fetch → public fetch → `<img>` CORS → tainted `<img>`,
 * logging each step.
 *
 * @param {string} originalUrl — the raw value from the row (may be relative)
 * @param {{
 *   timeoutMs?: number;
 *   authHeaders?: Record<string, string>;
 * }} [opts]
 * @returns {Promise<{ dataUrl: string; format: string; naturalW: number; naturalH: number } | null>}
 */
async function loadImageDataUrl(originalUrl, opts = {}) {
  const { timeoutMs = IMAGE_FETCH_TIMEOUT_MS, authHeaders = null } = opts;
  if (!originalUrl || typeof originalUrl !== 'string') return null;
  const original = originalUrl.trim();
  if (!original) return null;

  /** Path 0 — already a data URL. Skip network entirely. */
  if (original.startsWith('data:')) {
    imgDebug('data:URL — skipping network', { url: `${original.slice(0, 40)}…` });
    let size = { w: 0, h: 0 };
    try {
      size = await loadImageDimensions(original, timeoutMs);
    } catch {
      /* keep zeros */
    }
    return {
      dataUrl: original,
      format: detectImageFormatFromDataUrl(original),
      naturalW: size.w,
      naturalH: size.h,
    };
  }

  /**
   * Path 0b — raw Base64 from the API (e.g. `POImage`). Backend ships the
   * bytes without the `data:image/…;base64,` prefix, so we sniff the magic
   * prefix, wrap as a proper data URI, then measure — no network call.
   */
  if (looksLikeRawBase64Image(original)) {
    const mime = sniffBase64Mime(original);
    const dataUrl = `data:${mime};base64,${original}`;
    imgInfo('[raw-base64] wrapped as data URI', {
      mimeSniffed: mime,
      base64Bytes: original.length,
      preview: `${original.slice(0, 24)}…`,
    });
    let size = { w: 0, h: 0 };
    try {
      size = await loadImageDimensions(dataUrl, timeoutMs);
    } catch (err) {
      imgWarn('[raw-base64] dimension probe failed (will fit-as-square)', {
        error: err?.message || err,
      });
    }
    return {
      dataUrl,
      format: detectImageFormat(mime, ''),
      naturalW: size.w,
      naturalH: size.h,
    };
  }

  const resolved = resolveImageUrl(original);
  const sameAsApi = isApiOriginUrl(original, resolved);
  imgDebug('resolved', { originalUrl: original, resolvedUrl: resolved, sameOriginAsApi: sameAsApi });

  /** Path 1 — authenticated fetch when the image lives on the API origin. */
  if (sameAsApi) {
    const authHdr = {
      ...(authHeaders && Object.keys(authHeaders).length > 0
        ? authHeaders
        : getDefaultAuthHeader()),
    };
    if (authHdr.Authorization) {
      const info = await fetchImageToInfo(resolved, authHdr, timeoutMs, {
        label: 'auth-fetch',
      });
      if (info && info.dataUrl) return info;
    } else {
      imgDebug('no Bearer token available — skipping auth-fetch path', { url: resolved });
    }
  }

  /** Path 2 — public (anonymous) fetch with CORS. */
  const anonInfo = await fetchImageToInfo(resolved, undefined, timeoutMs, {
    label: 'anon-fetch',
  });
  if (anonInfo && anonInfo.dataUrl) return anonInfo;

  /** Path 3 — `<img crossOrigin="anonymous">` + canvas re-encode. */
  try {
    const info = await loadImageViaElement(resolved, timeoutMs);
    imgInfo('[img-cors] ok', {
      url: resolved,
      naturalW: info.naturalW,
      naturalH: info.naturalH,
    });
    return info;
  } catch (err) {
    imgWarn('[img-cors] failed', { url: resolved, error: err?.message || err });
  }

  /** Path 4 — tainted `<img>` fallback (no crossOrigin). Last resort; canvas may be tainted. */
  try {
    const info = await loadImageViaElementTainted(resolved, timeoutMs);
    imgInfo('[img-tainted] ok (server did not allow CORS, image extracted via tainted canvas)', {
      url: resolved,
      naturalW: info.naturalW,
      naturalH: info.naturalH,
    });
    return info;
  } catch (err) {
    imgWarn(
      '[img-tainted] failed — image is unreachable, blocked by CORS, or not authorized. PDF will show the NO IMAGE AVAILABLE placeholder for this row.',
      { url: resolved, error: err?.message || err }
    );
    return null;
  }
}

/** Identical to `loadImageViaElement` but without `crossOrigin` — canvas may end up tainted. */
function loadImageViaElementTainted(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      try {
        img.src = '';
      } catch {
        /* ignore */
      }
      reject(new Error('image tainted timeout'));
    }, timeoutMs);
    img.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1;
        canvas.height = img.naturalHeight || 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no 2d context');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          dataUrl,
          format: 'PNG',
          naturalW: img.naturalWidth || 0,
          naturalH: img.naturalHeight || 0,
        });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      reject(new Error('image tainted load failed'));
    };
    img.src = url;
  });
}

/** Compute the largest `(w, h)` box that fits `(naturalW, naturalH)` inside `(boxW, boxH)`. */
function fitInBox(naturalW, naturalH, boxW, boxH) {
  if (!Number.isFinite(naturalW) || !Number.isFinite(naturalH) || naturalW <= 0 || naturalH <= 0) {
    const side = Math.min(boxW, boxH);
    return { x: (boxW - side) / 2, y: (boxH - side) / 2, w: side, h: side };
  }
  const scale = Math.min(boxW / naturalW, boxH / naturalH);
  const w = naturalW * scale;
  const h = naturalH * scale;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
}

/**
 * Pre-fetch all unique image URLs found in `rows`. Returns a `Map<url, info>`
 * keyed by the *original* URL string from the row (failures are silently
 * skipped — those cells just draw the placeholder).
 *
 * @param {object[]} rows
 * @param {{
 *   timeoutMs?: number;
 *   concurrency?: number;
 *   authHeaders?: Record<string, string>;
 *   onProgress?: (done: number, total: number) => void;
 * }} [opts]
 * @returns {Promise<Map<string, { dataUrl: string; format: string; naturalW: number; naturalH: number }>>}
 */
async function prefetchRowImages(rows, opts = {}) {
  const {
    timeoutMs = IMAGE_FETCH_TIMEOUT_MS,
    concurrency = IMAGE_FETCH_CONCURRENCY,
    authHeaders = null,
    onProgress,
  } = opts;
  const cache = new Map();
  if (!Array.isArray(rows) || rows.length === 0) {
    imgInfo('prefetch: nothing to fetch (0 rows)');
    return cache;
  }

  const urls = new Set();
  rows.forEach((row) => {
    const raw = pickField(row, ...IMAGE_FIELD_KEYS);
    const s = raw ? String(raw).trim() : '';
    if (s) urls.add(s);
  });
  if (urls.size === 0) {
    imgInfo('prefetch: rows contained no image URL fields');
    return cache;
  }

  imgInfo(`prefetch start — ${urls.size} unique image URL(s), ${rows.length} row(s)`);
  // eslint-disable-next-line no-console -- diagnostic group
  try { console.groupCollapsed(`${IMAGE_LOG_TAG} URL list`); } catch { /* */ }
  Array.from(urls).forEach((u, idx) => imgDebug(`${idx + 1}.`, u));
  // eslint-disable-next-line no-console
  try { console.groupEnd(); } catch { /* */ }

  const queue = Array.from(urls);
  const total = queue.length;
  let done = 0;
  let ok = 0;

  async function worker() {
    while (queue.length > 0) {
      const u = queue.shift();
      if (!u) continue;
      try {
        const info = await loadImageDataUrl(u, { timeoutMs, authHeaders });
        if (info && info.dataUrl) {
          cache.set(u, info);
          ok += 1;
        }
      } catch (e) {
        imgWarn('worker swallowed an unexpected error', { url: u, error: e?.message || e });
      } finally {
        done += 1;
        try {
          onProgress?.(done, total);
        } catch {
          /* no-op */
        }
      }
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, urls.size));
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  imgInfo(`prefetch done — ${ok}/${total} image(s) embedded, ${total - ok} placeholder(s)`);
  return cache;
}

function drawBlueBoldUnderline(doc, text, x, y, maxW) {
  doc.setTextColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const lines = doc.splitTextToSize(String(text), maxW);
  let yy = y;
  lines.forEach((line) => {
    doc.text(line, x, yy);
    const tw = doc.getTextWidth(line);
    doc.setDrawColor(TITLE_BLUE[0], TITLE_BLUE[1], TITLE_BLUE[2]);
    doc.setLineWidth(0.35);
    doc.line(x, yy + 2, x + tw, yy + 2);
    yy += 12;
  });
  doc.setTextColor(0, 0, 0);
  return yy;
}

function drawBlackBoldUnderline(doc, text, x, y, maxW) {
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const lines = doc.splitTextToSize(String(text), maxW);
  let yy = y;
  lines.forEach((line) => {
    doc.text(line, x, yy);
    const tw = doc.getTextWidth(line);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.line(x, yy + 2, x + tw, yy + 2);
    yy += 12;
  });
  doc.setTextColor(0, 0, 0);
  return yy;
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {string|null} logoDataUrl
 * @param {{ fromDate?: string; toDate?: string; reportType?: string; merchandiserLabel?: string; vendorLabel?: string }} meta
 */
function drawReportHeader(doc, logoDataUrl, meta) {
  const pageW = layoutSnapshot.pageW;
  const inset = layoutSnapshot.gridLeft;
  const tableRight = pageW - inset;
  const leftX = inset;
  const merch = String(meta?.merchandiserLabel || '—').trim();
  const vendor = String(meta?.vendorLabel || '—').trim();
  const fromH = formatIsoToHeader(meta?.fromDate);
  const toH = formatIsoToHeader(meta?.toDate);

  const logoW = 80;
  const logoH = 34;
  const logoX = tableRight - logoW;
  const logoY = V_MARGIN + 2;
  const leftMaxW = Math.max(140, logoX - leftX - 10);

  let y = V_MARGIN + 8;
  y = drawBlueBoldUnderline(doc, statementTitle(meta?.reportType), leftX, y, leftMaxW) + 4;
  if (meta?.reportType === 'supplierWise') {
    y = drawBlueBoldUnderline(doc, `Vendor : ${vendor}`, leftX, y, leftMaxW) + 4;
  } else {
    y = drawBlueBoldUnderline(doc, `Merchandiser : ${merch}`, leftX, y, leftMaxW) + 4;
  }
  y = drawBlackBoldUnderline(doc, `Date From: ${fromH} Date To: ${toH}`, leftX, y, leftMaxW);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
  }

  const tableGridTopY = V_MARGIN + HEADER_BLOCK_H;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  doc.text(formatPrintStamp(), tableRight, tableGridTopY - 6, { align: 'right', baseline: 'bottom' });
}

function drawCellBorder(doc, x, y, w, h) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);
}

function drawHeaderCell(doc, x, y, w, h, headerText) {
  drawCellBorder(doc, x, y, w, h);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const parts = String(headerText || '—')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) parts.push('—');

  const buildLines = (fontSize) => {
    doc.setFontSize(fontSize);
    const out = [];
    parts.forEach((p) => {
      out.push(...doc.splitTextToSize(p, Math.max(4, w - 4)));
    });
    return out;
  };

  let fs = 5.75;
  let lines = buildLines(fs);
  if (lines.length > 4) {
    fs = 4.95;
    lines = buildLines(fs);
  }
  if (lines.length > 5) {
    fs = 4.55;
    lines = buildLines(fs);
  }

  const lineH = fs * 1.2;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  lines.slice(0, 6).forEach((ln, i) => {
    doc.text(ln, x + w / 2, firstY + i * lineH, {
      align: 'center',
      baseline: 'middle',
      maxWidth: w - 3,
    });
  });
}

function drawImagePlaceholder(doc, x, y, w, h) {
  doc.setFillColor(232, 232, 232);
  doc.rect(x + 1, y + 1, w - 2, h - 2, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(x + 1, y + 1, w - 2, h - 2, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.9);
  doc.setTextColor(90, 90, 90);
  const cy = y + h / 2;
  doc.text('NO IMAGE', x + w / 2, cy - 4.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.text('AVAILABLE', x + w / 2, cy + 4.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.setTextColor(0, 0, 0);
}

function drawImageCell(doc, x, y, w, h, raw) {
  drawCellBorder(doc, x, y, w, h);
  embedRowImageInBox(doc, x, y, w, h, raw);
}

/** Image only (no cell border) — used inside merged rowspan blocks. */
function embedRowImageInBox(doc, x, y, w, h, raw) {
  const url = pickField(raw, ...IMAGE_FIELD_KEYS);
  const trimmed = url ? String(url).trim() : '';
  const info = trimmed ? layoutSnapshot?.imageCache?.get(trimmed) || null : null;

  if (info && info.dataUrl) {
    try {
      const pad = 2;
      const boxX = x + pad;
      const boxY = y + pad;
      const boxW = Math.max(1, w - pad * 2);
      const boxH = Math.max(1, h - pad * 2);
      const fit = fitInBox(info.naturalW, info.naturalH, boxW, boxH);
      doc.addImage(
        info.dataUrl,
        info.format || 'PNG',
        boxX + fit.x,
        boxY + fit.y,
        fit.w,
        fit.h,
        undefined,
        'FAST'
      );
      return;
    } catch (e) {
      console.warn('[MilestoneSummary] addImage failed', e?.message || e);
      /* fall through to placeholder */
    }
  }

  drawImagePlaceholder(doc, x, y, w, h);
}

/** Milestone status line in PDF — show digit only (strip `%`). */
function displayMilestoneStatusValue(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '0';
  const withoutPct = s.replace(/%/g, '').trim();
  return withoutPct || '0';
}

/**
 * Parse combined milestone values e.g. `"0% ES: 31 Jan 2026"` → status + date only.
 * Strips `0% ES:` / `90% ES` prefix so PDF shows clean dates.
 * @returns {{ status: string; date: string }}
 */
function parseMilestoneCombinedDateString(raw) {
  if (raw == null || raw === '' || raw === 0 || raw === '0') return { status: '', date: '' };
  const s = String(raw).trim();
  if (!s) return { status: '', date: '' };

  const m = /^(\d+\s*%)\s*(?:ES\s*[:\-]?\s*)?(.*)$/i.exec(s);
  if (m) {
    const status = m[1].replace(/\s+/g, '').replace(/%/g, '');
    let datePart = (m[2] || '').trim().replace(/^ES\s*[:\-]?\s*/i, '').trim();
    if (datePart) {
      const dm = /^(\d{1,2})[\s\-/]+([A-Za-z]+)[\s\-/]+(\d{2,4})$/.exec(datePart);
      if (dm) {
        const yyyy = dm[3].length === 2 ? `20${dm[3]}` : dm[3];
        datePart = `${dm[1].padStart(2, '0')} ${dm[2].slice(0, 3)} ${yyyy}`;
      } else {
        const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(datePart);
        if (iso) datePart = formatMilestoneDate(`${iso[1]}-${iso[2]}-${iso[3]}`) || datePart;
        else datePart = formatMilestoneDate(datePart) || datePart;
      }
    }
    return { status, date: datePart };
  }

  const formatted = formatMilestoneDate(s);
  if (formatted) return { status: '', date: formatted };
  if (/^\d+\s*%/i.test(s)) {
    return {
      status: s.replace(/\s*(?:ES\s*[:\-]?\s*)?.*$/i, '').replace(/\s+/g, '').replace(/%/g, ''),
      date: '',
    };
  }
  return { status: '', date: s };
}

/**
 * Parse FRI combined string e.g. `"0% ES: 31 Jan 2026"` → `{ top: '0%', bottom: '31 Jan 2026' }`.
 * Tolerates variants like `"100% 15-Jan-2026"`, `"0%"` (no date), or empty.
 */
function parseFriCombined(raw) {
  const { status, date } = parseMilestoneCombinedDateString(raw);
  return { top: status || '0', bottom: date };
}

/** Same two lines as PDF `drawFriCombinedCell` — used by Excel exporter. */
export function milestoneSummaryFriCombinedExcelText(raw, spec) {
  const v = pickField(raw, ...(spec.keys || []));
  const { top, bottom } = parseFriCombined(v);
  return `${top}\n${bottom || '—'}`;
}

function milestoneTopStatus(raw, spec) {
  const s = pickField(raw, ...(spec.statusKeys || []));
  if (s !== '' && s != null) return displayMilestoneStatusValue(s);
  const v = pickField(raw, ...(spec.keys || []));
  const { status } = parseMilestoneCombinedDateString(v);
  if (status) return displayMilestoneStatusValue(status);
  return '0';
}

function milestoneBottomDate(raw, spec) {
  const v = pickField(raw, ...(spec.keys || []));
  const { date } = parseMilestoneCombinedDateString(v);
  if (date) return date;
  return '—';
}

/** Same two lines as PDF `drawStackedTwoDates` (shipment / FRI). */
export function milestoneSummaryStack2ExcelText(raw, spec, reportType) {
  const v1 = pickField(raw, ...(spec.k1 || []));
  const v2 = pickField(raw, ...(spec.k2 || []));
  const useUs = reportType === 'supplierWise';
  const fmt =
    spec.stackDateMode === 'iso'
      ? displayMilestoneShipmentDateIso
      : useUs
        ? formatShipmentUsMdY
        : formatShipmentFriDate;
  const d1 = fmt(v1) || fmt(v2) || '—';
  const d2 = fmt(v2) || d1;
  const line1 = d1 || '—';
  const line2 = d2 || line1;
  return `${line1}\n${line2}`;
}

/** Same two lines as PDF milestone cell (status + date). */
export function milestoneSummaryMilestoneExcelText(raw, spec) {
  return `${milestoneTopStatus(raw, spec)}\n${milestoneBottomDate(raw, spec)}`;
}

function drawMilestoneCell(doc, x, y, w, h, raw, spec) {
  drawCellBorder(doc, x, y, w, h);
  const top = milestoneTopStatus(raw, spec);
  const bottom = milestoneBottomDate(raw, spec);
  const cx = x + w / 2;
  const cy = y + h / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text(displayMilestoneStatusValue(top), cx, cy - 6.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.setFontSize(5.85);
  // Display-only: bottom line placeholder "—" renders as "N/A".
  const dateShown = String(bottom) === '—' ? 'N/A' : String(bottom);
  doc.text(dateShown, cx, cy + 6.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
}

function drawFriCombinedCell(doc, x, y, w, h, raw, spec) {
  drawCellBorder(doc, x, y, w, h);
  const v = pickField(raw, ...(spec.keys || []));
  const { top, bottom } = parseFriCombined(v);
  const cx = x + w / 2;
  const cy = y + h / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text(displayMilestoneStatusValue(top || '0'), cx, cy - 6.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.setFontSize(5.85);
  doc.text(String(bottom || '—'), cx, cy + 6.5, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
}

function drawStackedTwoDates(doc, x, y, w, h, raw, spec) {
  drawCellBorder(doc, x, y, w, h);
  const v1 = pickField(raw, ...(spec.k1 || []));
  const v2 = pickField(raw, ...(spec.k2 || []));
  const useUs = layoutSnapshot?.reportType === 'supplierWise';
  const fmt =
    spec.stackDateMode === 'iso'
      ? displayMilestoneShipmentDateIso
      : useUs
        ? formatShipmentUsMdY
        : formatShipmentFriDate;
  const d1 = fmt(v1) || fmt(v2) || '—';
  const d2 = fmt(v2) || d1;
  const line1 = d1 || '—';
  const line2 = d2 || line1;
  const cx = x + w / 2;
  const cy = y + h / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.65);
  doc.text(line1, cx, cy - 6.2, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
  doc.text(line2, cx, cy + 6.2, { align: 'center', baseline: 'middle', maxWidth: w - 2 });
}

function drawLeftText(doc, x, y, w, h, text, textAlign = 'left', opts = {}) {
  const skipBorder = opts.skipBorder === true;
  const maxLines = Number.isFinite(opts.maxLines) ? opts.maxLines : 8;
  if (!skipBorder) drawCellBorder(doc, x, y, w, h);
  const pad = 2;
  const center = textAlign === 'center';
  const maxW = Math.max(4, center ? w - 4 : w - pad * 2);
  doc.setFont('helvetica', 'normal');
  let fs = 6.6;
  doc.setFontSize(fs);
  let lines = doc.splitTextToSize(String(text || '—'), maxW);
  if (lines.length > 4) {
    fs = 5.9;
    doc.setFontSize(fs);
    lines = doc.splitTextToSize(String(text || '—'), maxW);
  }
  if (lines.length > 6 && h > DATA_ROW_H * 1.45) {
    fs = 5.65;
    doc.setFontSize(fs);
    lines = doc.splitTextToSize(String(text || '—'), maxW);
  }
  const lineH = fs * 1.16;
  const block = lines.length * lineH;
  const yMid = y + h / 2;
  const firstY = yMid - (block - lineH) / 2;
  const xText = center ? x + w / 2 : x + pad;
  lines.slice(0, maxLines).forEach((ln, i) => {
    doc.text(ln, xText, firstY + i * lineH, {
      align: center ? 'center' : 'left',
      baseline: 'middle',
      maxWidth: maxW,
    });
  });
}

function drawQty(doc, x, y, w, h, raw, spec) {
  drawCellBorder(doc, x, y, w, h);
  const q = pickField(raw, ...(spec.keys || []));
  let t = '—';
  if (q !== '' && q != null) {
    const n = Number(q);
    const qtyText = Number.isFinite(n) ? n.toLocaleString('en-US') : String(q);
    // Append API Units on the SAME line; when Units is empty / null / undefined
    // show "N/A" instead. (No hardcoded unit — only the API value or N/A.)
    const unitsRaw = pickField(raw, 'Units', 'units', 'Unit', 'unit');
    const unitStr = unitsRaw != null && String(unitsRaw).trim() !== '' ? String(unitsRaw).trim() : 'N/A';
    t = `${qtyText} ${unitStr}`;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.25);
  // Keep qty + unit on a single line (no wrapping to the next line).
  doc.text(t, x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
}

/** Outer frame + vertical dividers for rowspan lead block (no per-cell rects — avoids double strokes). */
function drawLeadMergeSectionFrame(doc, xs, y, cols, mergeCount, h) {
  const x0 = xs[0];
  const xEnd = xs[mergeCount - 1] + cols[mergeCount - 1].w;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.28);
  doc.rect(x0, y, xEnd - x0, h);
  for (let i = 1; i < mergeCount; i += 1) {
    const xv = xs[i];
    doc.line(xv, y, xv, y + h);
  }
}

function drawMergedRowspanImageCell(doc, x, y, w, h, displayRaw) {
  const pad = 3;
  const boxW = Math.min(MERGED_LEAD_IMAGE_BOX_MAX_PT.w, Math.max(18, w - pad * 2));
  const boxH = Math.min(MERGED_LEAD_IMAGE_BOX_MAX_PT.h, Math.max(22, h - pad * 2));
  const bx = x + (w - boxW) / 2;
  const by = y + (h - boxH) / 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.22);
  doc.rect(bx, by, boxW, boxH);
  embedRowImageInBox(doc, bx + 1.5, by + 1.5, boxW - 3, boxH - 3, displayRaw);
}

function drawMergedLeadColumns(doc, y, h, displayRaw, reportType) {
  const xs = colXs();
  const cols = layoutSnapshot.colDef;
  const mergeCount = mergeLeadColumnCount(reportType);
  drawLeadMergeSectionFrame(doc, xs, y, cols, mergeCount, h);

  const textMaxLines = h > DATA_ROW_H * 1.51 ? 16 : 8;
  for (let i = 0; i < mergeCount; i += 1) {
    const c = cols[i];
    const xi = xs[i];
    const wi = cols[i].w;
    if (c.kind === 'image') {
      drawMergedRowspanImageCell(doc, xi, y, wi, h, displayRaw);
    } else if (c.kind === 'left') {
      const txt = pickField(displayRaw, ...(c.keys || []));
      drawLeftText(doc, xi, y, wi, h, txt, c.align || 'center', {
        skipBorder: true,
        maxLines: textMaxLines,
      });
    }
  }
}

function drawDataCell(doc, x, y, w, h, raw, c) {
  if (c.kind === 'image') drawImageCell(doc, x, y, w, h, raw);
  else if (c.kind === 'left')
    drawLeftText(doc, x, y, w, h, pickField(raw, ...(c.keys || [])), c.align || 'left');
  else if (c.kind === 'qty') drawQty(doc, x, y, w, h, raw, c);
  else if (c.kind === 'stack2') drawStackedTwoDates(doc, x, y, w, h, raw, c);
  else if (c.kind === 'friCombined') drawFriCombinedCell(doc, x, y, w, h, raw, c);
  else if (c.kind === 'milestone') drawMilestoneCell(doc, x, y, w, h, raw, c);
}

function drawDataRowGroup(doc, y, chunkRows, displayRaw, reportType) {
  const xs = colXs();
  const cols = layoutSnapshot.colDef;
  const mergeCount = mergeLeadColumnCount(reportType);
  const n = chunkRows.length;
  const hTot = n * DATA_ROW_H;

  drawMergedLeadColumns(doc, y, hTot, displayRaw, reportType);

  for (let r = 0; r < n; r += 1) {
    const yRow = y + r * DATA_ROW_H;
    if (r > 0) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.32);
      const xSep = xs[mergeCount];
      const xEnd = xs[cols.length - 1] + cols[cols.length - 1].w;
      doc.line(xSep, yRow, xEnd, yRow);
    }
    for (let j = mergeCount; j < cols.length; j += 1) {
      drawDataCell(doc, xs[j], yRow, cols[j].w, DATA_ROW_H, chunkRows[r], cols[j]);
    }
  }
  return y + hTot;
}

function drawTableHeaderRow(doc, y) {
  const xs = colXs();
  const cols = layoutSnapshot.colDef;
  for (let i = 0; i < cols.length; i += 1) {
    const c = cols[i];
    drawHeaderCell(doc, xs[i], y, c.w, TABLE_HEADER_ROW_H, c.header);
  }
  return y + TABLE_HEADER_ROW_H;
}

function drawDataRow(doc, y, raw) {
  const xs = colXs();
  const cols = layoutSnapshot.colDef;
  for (let i = 0; i < cols.length; i += 1) {
    drawDataCell(doc, xs[i], y, cols[i].w, DATA_ROW_H, raw, cols[i]);
  }
  return y + DATA_ROW_H;
}

function drawOuterTableFrame(doc, x, y, w, h) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.1);
  doc.rect(x, y, w, h);
}

function drawPageHeaderAndTableTop(doc, logoDataUrl, meta) {
  drawReportHeader(doc, logoDataUrl, meta);
  return drawTableHeaderRow(doc, V_MARGIN + HEADER_BLOCK_H);
}

/**
 * @param {object[]} rawRows
 * @param {{
 *   fromDate?: string;
 *   toDate?: string;
 *   reportType?: string;
 *   merchandiserLabel?: string;
 *   vendorLabel?: string;
 *   imageTimeoutMs?: number;
 *   imageConcurrency?: number;
 *   imageAuthHeaders?: Record<string, string>;
 *   onImageProgress?: (done: number, total: number) => void;
 * }} [meta]
 */
export async function buildMilestoneSummaryPdfBlobFromRows(rawRows, meta = {}) {
  layoutSnapshot = createLayout(PAGE_WIDTH_PT, H_MARGIN, meta.reportType || 'merchandiserWise');

  const rows = Array.isArray(rawRows) ? rawRows : [];
  const tw = tableWidth();
  const tableX = layoutSnapshot.gridLeft;

  const PAGE_W = PAGE_WIDTH_PT;
  const PAGE_H = PAGE_HEIGHT_PT;

  const doc = new jsPDF({
    unit: 'pt',
    format: [PAGE_W, PAGE_H],
    orientation: 'l',
  });

  /**
   * PDF document title — Chrome/Edge's built-in PDF viewer uses this for the
   * browser tab title, so the preview tab reads "Milestone Summary" instead of
   * the raw `blob:` URL.
   */
  try {
    doc.setProperties({ title: 'Milestone Summary' });
  } catch {
    /* setProperties unavailable — non-fatal, preview still works */
  }

  /**
   * Resolve logo + row images in parallel BEFORE we start drawing. This
   * guarantees that every cell's image is already decoded by the time
   * `drawImageCell` runs, so we never embed blank/missing images even on
   * the very first draw cycle.
   *
   * Auth headers (default = `Authorization: Bearer <accessToken>` from
   * localStorage) are forwarded to the image fetcher so API-origin image
   * endpoints — which cannot be loaded via plain `<img src>` — return
   * actual bytes instead of a 401.
   */
  const [logoDataUrl, imageCache] = await Promise.all([
    loadLogoDataUrl().catch(() => null),
    prefetchRowImages(rows, {
      timeoutMs: Number.isFinite(meta.imageTimeoutMs) ? meta.imageTimeoutMs : IMAGE_FETCH_TIMEOUT_MS,
      concurrency: Number.isFinite(meta.imageConcurrency)
        ? meta.imageConcurrency
        : IMAGE_FETCH_CONCURRENCY,
      authHeaders: meta.imageAuthHeaders || getDefaultAuthHeader(),
      onProgress: meta.onImageProgress,
    }).catch((e) => {
      imgWarn('prefetch top-level error; placeholders will render for every row.', {
        error: e?.message || e,
      });
      return new Map();
    }),
  ]);
  layoutSnapshot.imageCache = imageCache;

  const pageH = () => doc.internal.pageSize.getHeight();

  let segTableTop = 0;
  let y = 0;

  const startSheet = () => {
    y = drawPageHeaderAndTableTop(doc, logoDataUrl, meta);
    segTableTop = V_MARGIN + HEADER_BLOCK_H;
  };

  const closeSegment = () => {
    const h = y - segTableTop;
    if (h > 0) {
      drawOuterTableFrame(doc, tableX, segTableTop, tw, h);
    }
  };

  startSheet();

  if (!rows.length) {
    /** Empty result — show just the table header (no placeholder text), per UX expectation. */
    closeSegment();
    layoutSnapshot = null;
    return doc.output('blob');
  }

  const rt = meta.reportType || 'merchandiserWise';
  const grouped = groupMilestoneRowsByLeadKey(rows, rt);

  grouped.forEach((g) => {
    let rest = g.rows;
    while (rest.length) {
      const maxRowsThisPage = Math.floor((pageH() - V_MARGIN - y) / DATA_ROW_H);
      if (maxRowsThisPage < 1) {
        closeSegment();
        doc.addPage([PAGE_W, PAGE_H], 'l');
        startSheet();
        continue;
      }
      const take = Math.min(maxRowsThisPage, rest.length);
      const chunk = rest.slice(0, take);
      rest = rest.slice(take);
      y = drawDataRowGroup(doc, y, chunk, g.displayRaw, rt);
    }
  });

  closeSegment();

  layoutSnapshot = null;
  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode view = new tab (prefer assigning `location` on a tab opened synchronously); pdf = download
 * @param {Blob} pdfBlob
 */
export function openMilestoneSummaryPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    /** Opening here after async work is unreliable (pop-up block). Prefer `location.replace(blobUrl)` on a pre-opened tab from the UI layer. */
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Milestone_Summary.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
