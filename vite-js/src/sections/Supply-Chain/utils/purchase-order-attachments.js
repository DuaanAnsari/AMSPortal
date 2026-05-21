/**
 * Purchase Order attachment helpers — exact API field mapping for images/PDF.
 * GET fields: poImage, productImage, specsimage, finalspecs, pPimage, sizeset, originalPDFName
 */

const PDF_BASE64_MAGIC = 'JVBERi0';
const IMAGE_MAGIC = [
  { prefix: '/9j/', mime: 'image/jpeg' },
  { prefix: 'iVBOR', mime: 'image/png' },
  { prefix: 'R0lGOD', mime: 'image/gif' },
  { prefix: 'UklGR', mime: 'image/webp' },
  { prefix: 'Qk', mime: 'image/bmp' },
];

/** Read first non-empty value from API row using alternate key names. */
export function pickApiField(row, ...keys) {
  if (!row) return null;
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return val;
    }
  }
  return null;
}

function sniffImageMime(raw) {
  const s = String(raw || '').trim();
  const hit = IMAGE_MAGIC.find((m) => s.startsWith(m.prefix));
  return hit ? hit.mime : 'image/jpeg';
}

function looksLikeRawBase64Pdf(raw) {
  const s = String(raw || '').trim();
  return s.length >= 16 && s.startsWith(PDF_BASE64_MAGIC);
}

function looksLikeRawBase64Image(raw) {
  if (raw == null) return false;
  const s = String(raw).trim();
  if (s.length < 24) return false;
  if (s.startsWith('data:') || s.startsWith('blob:') || /^https?:\/\//i.test(s)) return false;
  if (IMAGE_MAGIC.some((m) => s.startsWith(m.prefix))) return true;
  if (s.startsWith('/')) return false;
  if (s.length < 80) return false;
  return /^[A-Za-z0-9+/=\r\n]+$/.test(s.slice(0, 256));
}

/**
 * Normalize API/base64/path value into display metadata.
 * @returns {{ raw: *, previewUrl: string|null, fileName: string|null, mimeType: string|null, isPdf: boolean, missingBinary: boolean }}
 */
export function normalizeAttachmentValue(raw, { defaultFileName = '', defaultMime = 'image/jpeg' } = {}) {
  if (raw == null || raw === '') {
    return {
      raw: null,
      previewUrl: null,
      fileName: null,
      mimeType: null,
      isPdf: false,
      missingBinary: false,
    };
  }

  if (typeof raw === 'object' && !(raw instanceof File) && raw.name) {
    return {
      raw,
      previewUrl: null,
      fileName: raw.name,
      mimeType: raw.type || null,
      isPdf: raw.type === 'application/pdf',
      missingBinary: false,
    };
  }

  const s = String(raw).trim();

  if (s.startsWith('data:')) {
    const isPdf = s.includes('application/pdf');
    return {
      raw: s,
      previewUrl: s,
      fileName: defaultFileName || (isPdf ? 'document.pdf' : 'image'),
      mimeType: isPdf ? 'application/pdf' : defaultMime,
      isPdf,
      missingBinary: false,
    };
  }

  if (/^https?:\/\//i.test(s) || (s.startsWith('/') && !looksLikeRawBase64Image(s) && !looksLikeRawBase64Pdf(s))) {
    const isPdf = /\.pdf($|\?)/i.test(s);
    return {
      raw: s,
      previewUrl: s,
      fileName: defaultFileName || s.split('/').pop() || 'file',
      mimeType: isPdf ? 'application/pdf' : defaultMime,
      isPdf,
      missingBinary: false,
    };
  }

  if (looksLikeRawBase64Pdf(s)) {
    return {
      raw: s,
      previewUrl: `data:application/pdf;base64,${s}`,
      fileName: defaultFileName || 'document.pdf',
      mimeType: 'application/pdf',
      isPdf: true,
      missingBinary: false,
    };
  }

  if (looksLikeRawBase64Image(s)) {
    const mime = sniffImageMime(s);
    return {
      raw: s,
      previewUrl: `data:${mime};base64,${s}`,
      fileName: defaultFileName || 'image',
      mimeType: mime,
      isPdf: false,
      missingBinary: false,
    };
  }

  // Filename only (no binary) — common for original PDF when API omits bytes
  if (s.length < 200 && !s.includes('base64') && /\.(pdf|png|jpe?g|gif|webp)$/i.test(s)) {
    const isPdf = /\.pdf$/i.test(s);
    return {
      raw: s,
      previewUrl: null,
      fileName: s,
      mimeType: isPdf ? 'application/pdf' : defaultMime,
      isPdf,
      missingBinary: true,
    };
  }

  return {
    raw: s,
    previewUrl: `data:${defaultMime};base64,${s}`,
    fileName: defaultFileName || 'file',
    mimeType: defaultMime,
    isPdf: false,
    missingBinary: false,
  };
}

/** Empty attachment bucket per API image field. */
export function createEmptyAttachmentAssets() {
  return {
    poImage: normalizeAttachmentValue(null),
    productImage: normalizeAttachmentValue(null),
    specsimage: normalizeAttachmentValue(null),
    finalspecs: normalizeAttachmentValue(null),
    pPimage: normalizeAttachmentValue(null),
    sizeset: normalizeAttachmentValue(null),
    originalPdf: normalizeAttachmentValue(null),
  };
}

/**
 * Map GET purchase order row → separate attachment state + form file fields.
 * Form field names differ from API column names (see FORM_TO_API_ATTACHMENT).
 */
export function mapAttachmentsFromApi(orderData) {
  const assets = createEmptyAttachmentAssets();

  assets.poImage = normalizeAttachmentValue(
    pickApiField(orderData, 'poImage', 'POImage', 'poimage'),
    { defaultFileName: orderData.poImgFileName || 'po-image.jpg' }
  );
  assets.productImage = normalizeAttachmentValue(
    pickApiField(orderData, 'productImage', 'ProductImage', 'productimage'),
    { defaultFileName: orderData.prodImgFileName || 'product-image.jpg' }
  );
  assets.specsimage = normalizeAttachmentValue(
    pickApiField(orderData, 'specsimage', 'SpecsImage', 'specsImage'),
    { defaultFileName: 'process-order-confirmation' }
  );
  assets.finalspecs = normalizeAttachmentValue(
    pickApiField(orderData, 'finalspecs', 'finalSpecs', 'FinalSpecs'),
    { defaultFileName: 'final-specs' }
  );
  assets.pPimage = normalizeAttachmentValue(
    pickApiField(orderData, 'pPimage', 'PPimage', 'ppImage'),
    { defaultFileName: 'pp-comment' }
  );
  assets.sizeset = normalizeAttachmentValue(
    pickApiField(orderData, 'sizeset', 'sizeSet', 'SizeSet'),
    { defaultFileName: 'size-set' }
  );

  const pdfBinary = pickApiField(
    orderData,
    'originalPDF',
    'originalPdf',
    'OriginalPDF',
    'originalPurchaseOrder',
    'originalPurchaseOrderPDF',
    'poPDF',
    'PoPDF',
    'pdfDocument',
    'pdfFile',
    'pdfBase64',
    'PDFBase64'
  );
  const pdfName =
    pickApiField(orderData, 'originalPDFName', 'OriginalPDFName', 'originalPdfName') || 'original-po.pdf';

  assets.originalPdf = pdfBinary
    ? normalizeAttachmentValue(pdfBinary, { defaultFileName: pdfName, defaultMime: 'application/pdf' })
    : normalizeAttachmentValue(pdfName, { defaultFileName: pdfName, defaultMime: 'application/pdf' });

  const formFiles = {
    image: assets.poImage.raw,
    productImage: assets.productImage.raw,
    processOrderConfirmation: assets.specsimage.raw,
    finalSpecs: assets.finalspecs.raw,
    ppComment: assets.pPimage.raw,
    sizeSetComment: assets.sizeset.raw,
    originalPurchaseOrder: assets.originalPdf.raw,
  };

  return { assets, formFiles };
}

/** Form RHF field name → API payload property */
export const FORM_TO_API_ATTACHMENT = {
  image: 'poImage',
  productImage: 'productImage',
  processOrderConfirmation: 'specsimage',
  finalSpecs: 'finalspecs',
  ppComment: 'pPimage',
  sizeSetComment: 'sizeset',
  originalPurchaseOrder: 'originalPDF',
};

/** Form field → attachmentAssets state key */
export const FORM_TO_ASSET_KEY = {
  image: 'poImage',
  productImage: 'productImage',
  processOrderConfirmation: 'specsimage',
  finalSpecs: 'finalspecs',
  ppComment: 'pPimage',
  sizeSetComment: 'sizeset',
  originalPurchaseOrder: 'originalPdf',
};

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result || '';
      const base64 = String(result).includes('base64,') ? String(result).split('base64,')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

export async function convertAttachmentToBase64(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    if (value.includes('base64,')) return value.split('base64,')[1];
    return value;
  }
  if (value instanceof File) {
    try {
      return await fileToBase64(value);
    } catch {
      return '';
    }
  }
  return '';
}

/**
 * Apply form attachments to UpdatePurchaseOrder payload (exact API keys).
 */
export async function applyAttachmentsToPayload(payload, form, apiData) {
  const next = { ...payload };

  const poImage = await convertAttachmentToBase64(form.image);
  const productImage = await convertAttachmentToBase64(form.productImage);
  const specsimage = await convertAttachmentToBase64(form.processOrderConfirmation);
  const finalspecs = await convertAttachmentToBase64(form.finalSpecs);
  const pPimage = await convertAttachmentToBase64(form.ppComment);
  const sizeset = await convertAttachmentToBase64(form.sizeSetComment);
  const originalPdf = await convertAttachmentToBase64(form.originalPurchaseOrder);

  next.poImage = poImage || apiData.poImage || '';
  next.productImage = productImage || apiData.productImage || '';
  next.specsimage = specsimage || apiData.specsimage || '';
  next.finalspecs = finalspecs || apiData.finalspecs || '';
  next.pPimage = pPimage || apiData.pPimage || '';
  next.sizeset = sizeset || apiData.sizeset || '';

  if (originalPdf) {
    next.originalPDF = originalPdf;
  } else if (apiData.originalPDF) {
    next.originalPDF = apiData.originalPDF;
  }

  const poImgFile =
    form.image instanceof File ? form.image.name : apiData.poImgFileName || '';
  const prodImgFile =
    form.productImage instanceof File
      ? form.productImage.name
      : apiData.prodImgFileName || '';
  const pdfName =
    form.originalPurchaseOrder instanceof File
      ? form.originalPurchaseOrder.name
      : apiData.originalPDFName || '';

  next.poImgFileName = poImgFile;
  next.prodImgFileName = prodImgFile;
  next.originalPDFName = pdfName;

  next.specstype =
    form.finalSpecs instanceof File ? form.finalSpecs.type : apiData.specstype || '';
  next.pptype = form.ppComment instanceof File ? form.ppComment.type : apiData.pptype || '';
  next.finaltype =
    form.finalSpecs instanceof File ? form.finalSpecs.type : apiData.finaltype || '';
  next.sizetype =
    form.sizeSetComment instanceof File ? form.sizeSetComment.type : apiData.sizetype || '';

  const formOnlyKeys = [
    'image',
    'originalPurchaseOrder',
    'processOrderConfirmation',
    'finalSpecs',
    'ppComment',
    'sizeSetComment',
  ];
  formOnlyKeys.forEach((k) => {
    delete next[k];
  });

  return next;
}
