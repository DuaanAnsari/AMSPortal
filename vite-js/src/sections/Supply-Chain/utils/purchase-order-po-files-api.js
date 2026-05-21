/**
 * GET {VITE_API_BASE_URL}/api/MyOrders/GetPOFiles/{poid}
 * Response: [{ fileName, fileUrl }] — fileUrl used as-is from backend.
 */

import axios from 'axios';

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export const PO_FILE_SECTIONS = [
  { key: 'originalPurchaseOrder', label: 'Original Purchase Order' },
  { key: 'processOrderConfirmation', label: 'Process at the time Order Confirmation' },
  { key: 'finalSpecs', label: 'Final Specs' },
  { key: 'productImage', label: 'Product Image' },
  { key: 'ppComment', label: 'PP Comment Received' },
  { key: 'sizeSetComment', label: 'Size Set Comment' },
];

const emptyGrouped = () =>
  Object.fromEntries(PO_FILE_SECTIONS.map((s) => [s.key, []]));

/** Module cache — same PO id par dubara API call nahi */
const poFilesCache = new Map();

export function getPoFilesFromCache(poid) {
  return poFilesCache.get(String(poid)) ?? null;
}

export function setPoFilesCache(poid, entry) {
  poFilesCache.set(String(poid), entry);
}

export function removePoFileFromCache(poid, fileId) {
  const entry = poFilesCache.get(String(poid));
  if (!entry?.grouped) return null;

  const grouped = emptyGrouped();
  PO_FILE_SECTIONS.forEach(({ key }) => {
    grouped[key] = (entry.grouped[key] || []).filter((f) => f.id !== fileId);
  });

  const next = {
    ...entry,
    grouped,
    files: PO_FILE_SECTIONS.flatMap(({ key }) => grouped[key]),
  };
  poFilesCache.set(String(poid), next);
  return next;
}

export function clearPoFilesCache(poid) {
  if (poid != null) poFilesCache.delete(String(poid));
  else poFilesCache.clear();
}

/**
 * Detect section from fileName (per business rules).
 */
export function detectPoFileSectionKey(fileName) {
  const name = String(fileName || '');
  const stem = name.replace(/\.[^.]+$/i, '').toLowerCase().replace(/[\s_-]+/g, '');

  if (/\.(png|jpe?g)$/i.test(name)) return 'productImage';
  if (stem.includes('finalspecs')) return 'finalSpecs';
  if (stem.includes('processorderconfirmation')) return 'processOrderConfirmation';
  if (stem.includes('sizesetcomment')) return 'sizeSetComment';
  if (stem.includes('ppcomment')) return 'ppComment';
  if (/\.pdf$/i.test(name)) return 'originalPurchaseOrder';

  return 'originalPurchaseOrder';
}

export function classifyPoFileKind(fileName) {
  const name = String(fileName || '');
  if (/\.(png|jpe?g|gif|webp|bmp)$/i.test(name)) return 'image';
  if (/\.pdf$/i.test(name)) return 'pdf';
  return 'other';
}

export function normalizePoFileRow(item, index = 0) {
  const fileName = String(item?.fileName ?? item?.FileName ?? '').trim();
  const fileUrl = String(item?.fileUrl ?? item?.FileUrl ?? '').trim();
  const sectionKey = detectPoFileSectionKey(fileName);

  return {
    id: `pofile-${sectionKey}-${index}-${fileName}`,
    fileName,
    fileUrl,
    sectionKey,
    kind: classifyPoFileKind(fileName),
  };
}

export function normalizePoFilesList(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  return list
    .map((row, index) => normalizePoFileRow(row, index))
    .filter((row) => row.fileName && row.fileUrl);
}

export function groupPoFilesBySection(files) {
  const grouped = emptyGrouped();
  files.forEach((file) => {
    const key = file.sectionKey || detectPoFileSectionKey(file.fileName);
    if (grouped[key]) grouped[key].push(file);
    else grouped.originalPurchaseOrder.push(file);
  });
  return grouped;
}

function buildFetchUrl(poid) {
  const id = encodeURIComponent(String(poid));
  if (!API_BASE_URL) return `/api/MyOrders/GetPOFiles/${id}`;
  return `${API_BASE_URL}/api/MyOrders/GetPOFiles/${id}`;
}

/**
 * Fetch PO files once; returns cached entry on subsequent calls for same poid.
 */
export async function fetchPoFilesOnce(poid) {
  const cacheKey = String(poid);
  const cached = getPoFilesFromCache(cacheKey);
  if (cached) return cached;

  const token = localStorage.getItem('accessToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await axios.get(buildFetchUrl(poid), { headers });
  const files = normalizePoFilesList(response.data);
  const grouped = groupPoFilesBySection(files);

  const entry = { files, grouped, error: null, fetchedAt: Date.now() };
  setPoFilesCache(cacheKey, entry);
  return entry;
}
