import jsPDF from 'jspdf';

/**
 * "User Login Detail" — Expand Version PDF (portrait).
 *
 * Mirrors the legacy print mock-up exactly:
 *
 *   - Page 1 header :
 *       - AMS logo (top-left) + company address strip + new telephone
 *         numbers (02134937216 & 02134946005).
 *       - Bold centered title "USER LOGIN DETAIL".
 *       - "From Date : <date>"  /  "To Date : <date>" stacked below the
 *         address block on the left.
 *
 *   - Table columns (7):
 *       Sr No | User Name | Login Date | Login Time |
 *       Logout Date | Logout Time | Time Dif.
 *
 *   - Group rows : full-width strip rendered above each user's serialized
 *     sessions. The strip shows the user's name in bold (matching the
 *     mock-up's "HIBA CHHIPA" / "IRFAN KHAN" banners). The serial column
 *     restarts at 1 for every group.
 *
 *   - Status colors :
 *       - User Name      → warm orange
 *       - Login Date     → warm orange
 *       - "Session Expired" message → red
 *       - Completed time difference (e.g. "00:02") → teal
 *       - Everything else → black
 *
 *   - Page 2+ : table header repeats at the top of every page. The logo /
 *     address strip is page-1 only.
 *
 * Demo data is provided so the PDF can be viewed without a wired API. The
 * builder accepts a parallel payload `{ groups: [{ user, items: [...] }] }`
 * for when the backend contract lands.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

const PAGE_W = 595;
const PAGE_H = 842;
const H_MARGIN = 18;
const V_MARGIN_TOP = 22;
const V_MARGIN_BOTTOM = 28;

const LOGO_W = 95;
const LOGO_H = 50;

const CONT_HEADER_H = 14;

const TABLE_HEADER_H = 22;
const ROW_H = 18;
const GROUP_ROW_H = 20;

const TABLE_HEADER_FILL = [217, 217, 217];
const GROUP_ROW_FILL = [255, 255, 255];
const TABLE_BORDER = [180, 180, 180];

const BLACK = [0, 0, 0];
const WARM_ORANGE = [220, 90, 40];
const STATUS_RED = [200, 40, 35];
const STATUS_TEAL = [25, 130, 110];

const PDF_VIEW_ZOOM_HASH = '#zoom=100';

/**
 * @typedef {{
 *   key: string;
 *   label: string;
 *   weight: number;
 *   align?: 'left'|'center'|'right';
 * }} UserLoginCol
 */

/** @type {UserLoginCol[]} */
const COLS = [
  { key: 'serial', label: 'Sr No', weight: 28, align: 'center' },
  { key: 'userName', label: 'User Name', weight: 110, align: 'center' },
  { key: 'loginDate', label: 'Login Date', weight: 78, align: 'center' },
  { key: 'loginTime', label: 'Login Time', weight: 66, align: 'center' },
  { key: 'logoutDate', label: 'Logout Date', weight: 78, align: 'center' },
  { key: 'logoutTime', label: 'Logout Time', weight: 70, align: 'center' },
  { key: 'timeDif', label: 'Time Dif.', weight: 96, align: 'center' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy User Login Detail print
// ----------------------------------------------------------------------

const SESSION_EXPIRED = 'Session Expired';

const USER_LOGIN_DETAIL_DEMO = {
  fromDate: 'Jan 01, 2026',
  toDate: 'Dec 31, 2026',
  printedOn: null,
  groups: [
    {
      user: 'HIBA CHHIPA',
      items: [
        { loginDate: 'Apr 16, 2026', loginTime: '15:13', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 30, 2026', loginTime: '09:39', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
      ],
    },
    {
      user: 'IRFAN KHAN',
      items: [
        { loginDate: 'Jan 01, 2026', loginTime: '08:41', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 02, 2026', loginTime: '15:07', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 03, 2026', loginTime: '09:33', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 05, 2026', loginTime: '09:01', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 05, 2026', loginTime: '12:39', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 06, 2026', loginTime: '10:16', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 06, 2026', loginTime: '12:52', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 08, 2026', loginTime: '15:05', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 10, 2026', loginTime: '14:21', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 12, 2026', loginTime: '12:26', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 13, 2026', loginTime: '09:58', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 14, 2026', loginTime: '09:45', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 14, 2026', loginTime: '23:16', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 15, 2026', loginTime: '09:16', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 16, 2026', loginTime: '15:20', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 17, 2026', loginTime: '17:43', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 19, 2026', loginTime: '09:07', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 20, 2026', loginTime: '09:07', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 21, 2026', loginTime: '11:44', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 22, 2026', loginTime: '09:05', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 23, 2026', loginTime: '12:26', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 30, 2026', loginTime: '15:57', logoutDate: 'Jan 30, 2026', logoutTime: '15:59', timeDif: '00:02' },
        { loginDate: 'Jan 30, 2026', loginTime: '19:23', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Feb 02, 2026', loginTime: '21:10', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Feb 16, 2026', loginTime: '12:32', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Mar 16, 2026', loginTime: '10:40', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 10, 2026', loginTime: '13:04', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 30, 2026', loginTime: '09:23', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
      ],
    },
    {
      user: 'MINHAJ ALI',
      items: [
        { loginDate: 'Feb 09, 2026', loginTime: '17:37', logoutDate: 'Feb 09, 2026', logoutTime: '18:06', timeDif: '00:29' },
        { loginDate: 'Feb 13, 2026', loginTime: '14:54', logoutDate: 'Feb 13, 2026', logoutTime: '15:23', timeDif: '00:29' },
        { loginDate: 'Feb 16, 2026', loginTime: '18:06', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Mar 11, 2026', loginTime: '15:00', logoutDate: 'Mar 11, 2026', logoutTime: '15:23', timeDif: '00:23' },
        { loginDate: 'Apr 03, 2026', loginTime: '11:31', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 06, 2026', loginTime: '16:27', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 07, 2026', loginTime: '15:36', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 08, 2026', loginTime: '17:12', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 09, 2026', loginTime: '12:05', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 10, 2026', loginTime: '09:47', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 13, 2026', loginTime: '09:08', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 14, 2026', loginTime: '10:16', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 16, 2026', loginTime: '10:15', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 17, 2026', loginTime: '13:07', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 20, 2026', loginTime: '18:13', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 21, 2026', loginTime: '16:12', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 23, 2026', loginTime: '10:06', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 24, 2026', loginTime: '17:29', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 26, 2026', loginTime: '01:52', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 27, 2026', loginTime: '16:05', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 28, 2026', loginTime: '14:37', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Apr 30, 2026', loginTime: '17:23', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'May 05, 2026', loginTime: '13:59', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'May 06, 2026', loginTime: '15:03', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'May 12, 2026', loginTime: '12:45', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
      ],
    },
    {
      user: 'MUHAMMAD ARSHAD ULLAH',
      items: [
        { loginDate: 'Jan 01, 2026', loginTime: '14:51', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 02, 2026', loginTime: '10:46', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 05, 2026', loginTime: '15:17', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 08, 2026', loginTime: '10:36', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 12, 2026', loginTime: '11:02', logoutDate: 'Jan 12, 2026', logoutTime: '11:06', timeDif: '00:04' },
        { loginDate: 'Jan 13, 2026', loginTime: '15:03', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 15, 2026', loginTime: '12:17', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
        { loginDate: 'Jan 16, 2026', loginTime: '15:16', logoutDate: '', logoutTime: '', timeDif: SESSION_EXPIRED },
      ],
    },
  ],
};

export { USER_LOGIN_DETAIL_DEMO };

// ----------------------------------------------------------------------
// Geometry helpers
// ----------------------------------------------------------------------

function tableColWidths(tableW) {
  const sum = COLS.reduce((a, c) => a + c.weight, 0);
  const out = COLS.map((c) => (c.weight / sum) * tableW);
  const drift = tableW - out.reduce((a, b) => a + b, 0);
  out[out.length - 1] += drift;
  return out;
}

function colXs(x0, widths) {
  const xs = [x0];
  for (let i = 0; i < widths.length; i += 1) xs.push(xs[i] + widths[i]);
  return xs;
}

async function loadLogoDataUrl() {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) throw new Error(`logo ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatPrintedOnLong(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ----------------------------------------------------------------------
// Drawing primitives
// ----------------------------------------------------------------------

function setBorder(doc, rgb = TABLE_BORDER, lineW = 0.4) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(lineW);
}

function fillRect(doc, x, y, w, h, fill) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.rect(x, y, w, h, 'F');
}

function strokeRect(doc, x, y, w, h, borderRgb, lineW = 0.4) {
  setBorder(doc, borderRgb, lineW);
  doc.rect(x, y, w, h);
}

function drawTextCentered(doc, x, y, w, h, lines, opts = {}) {
  const { bold = false, fontSize = 8, color = BLACK, pad = 2, align = 'center' } = opts;
  if (!lines || lines.length === 0) return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  const lh = fontSize * 1.18;
  const block = lines.length * lh;
  const firstY = y + (h - block) / 2 + lh / 2;
  let tx;
  if (align === 'left') tx = x + pad;
  else if (align === 'right') tx = x + w - pad;
  else tx = x + w / 2;
  lines.forEach((ln, i) => {
    if (!ln) return;
    doc.text(ln, tx, firstY + i * lh, { align, baseline: 'middle', maxWidth: w - pad * 2 });
  });
  doc.setTextColor(0, 0, 0);
}

function wrapText(doc, text, w, fontSize, bold, pad = 2) {
  if (text == null || text === '') return [];
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  const innerW = Math.max(2, w - pad * 2);
  const out = [];
  String(text)
    .split('\n')
    .forEach((p) => {
      if (p === '') {
        out.push('');
        return;
      }
      out.push(...doc.splitTextToSize(p, innerW));
    });
  return out;
}

// ----------------------------------------------------------------------
// Page 1 header — logo, address strip, title, date range.
// ----------------------------------------------------------------------

function drawPage1Header(doc, logoDataUrl, fromDate, toDate) {
  const x = H_MARGIN;
  let y = V_MARGIN_TOP;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', x, y, LOGO_W, LOGO_H, undefined, 'FAST');
    } catch {
      /* logo missing — skip silently */
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);

  const addressY1 = y + LOGO_H + 6;
  doc.text(
    'A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800',
    x,
    addressY1,
    { baseline: 'top' }
  );
  doc.text(
    'Karachi - Pakistan.            Telephone # : 02134937216 & 02134946005',
    x,
    addressY1 + 11,
    { baseline: 'top' }
  );

  // Title sits in the upper-right area, vertically aligned with the
  // first address line — same composition as the legacy print mock-up
  // (no overlap with the address strip on the left).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('USER LOGIN DETAIL', PAGE_W * 0.63, addressY1 + 4, {
    align: 'center',
    baseline: 'middle',
  });

  const datesY = addressY1 + 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text('From Date:', x, datesY, { baseline: 'top' });
  doc.setFont('helvetica', 'normal');
  doc.text(fromDate, x + 62, datesY, { baseline: 'top' });

  doc.setFont('helvetica', 'bold');
  doc.text('To Date:', x, datesY + 14, { baseline: 'top' });
  doc.setFont('helvetica', 'normal');
  doc.text(toDate, x + 62, datesY + 14, { baseline: 'top' });

  y = datesY + 14 + 16;
  return y;
}

// ----------------------------------------------------------------------
// Table header
// ----------------------------------------------------------------------

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    fillRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, TABLE_HEADER_FILL);
    strokeRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, TABLE_BORDER, 0.4);
    const lines = wrapText(doc, col.label, widths[i], 8.2, true, 2);
    drawTextCentered(doc, xs[i], y, widths[i], TABLE_HEADER_H, lines, {
      bold: true,
      fontSize: 8.2,
      color: BLACK,
    });
  });
  return y + TABLE_HEADER_H;
}

// ----------------------------------------------------------------------
// Group row — full-width banner with the user's name in bold.
// ----------------------------------------------------------------------

function drawGroupRow(doc, y, x0, tableW, userName) {
  fillRect(doc, x0, y, tableW, GROUP_ROW_H, GROUP_ROW_FILL);
  strokeRect(doc, x0, y, tableW, GROUP_ROW_H, TABLE_BORDER, 0.4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(userName || '', x0 + 6, y + GROUP_ROW_H / 2, {
    baseline: 'middle',
    maxWidth: tableW - 12,
  });
  return y + GROUP_ROW_H;
}

// ----------------------------------------------------------------------
// Data row — color-coded cells (matches the legacy print).
// ----------------------------------------------------------------------

function pickCellColor() {
  return BLACK;
}

function drawDataRow(doc, y, x0, widths, item) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, ROW_H, TABLE_BORDER, 0.3);
    const raw = item[col.key];
    if (raw === undefined || raw === null || raw === '') return;
    const lines = wrapText(doc, raw, w, 7.6, false, 2);
    drawTextCentered(doc, x, y, w, ROW_H, lines, {
      fontSize: 7.6,
      color: pickCellColor(),
      align: col.align,
    });
  });
  return y + ROW_H;
}

// ----------------------------------------------------------------------
// Page footer
// ----------------------------------------------------------------------

function drawFooter(doc, pageIdx, totalPages, printedOn) {
  const fy = PAGE_H - V_MARGIN_BOTTOM + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Printed on : ${printedOn || formatPrintedOnLong()}`, H_MARGIN, fy, {
    baseline: 'bottom',
  });
  doc.text(`Page ${pageIdx} of ${totalPages}`, PAGE_W - H_MARGIN, fy, {
    align: 'right',
    baseline: 'bottom',
  });
  doc.setTextColor(0, 0, 0);
}

// ----------------------------------------------------------------------
// Public builder
// ----------------------------------------------------------------------

/**
 * Build the User Login Detail (Expand Version) PDF blob.
 *
 * @param {{
 *   groups?: Array<{ user: string; items: object[] }>;
 *   fromDate?: string;
 *   toDate?: string;
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildUserLoginDetailPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.groups) && data.groups.length > 0 ? data : USER_LOGIN_DETAIL_DEMO;

  const meta = {
    fromDate: payload.fromDate || data.fromDate || USER_LOGIN_DETAIL_DEMO.fromDate,
    toDate: payload.toDate || data.toDate || USER_LOGIN_DETAIL_DEMO.toDate,
    printedOn: payload.printedOn || data.printedOn || formatPrintedOnLong(),
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'p' });
  const logoDataUrl = await loadLogoDataUrl();

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = tableColWidths(tableW);

  const pageBodyBottom = PAGE_H - V_MARGIN_BOTTOM - 18;

  let y = drawPage1Header(doc, logoDataUrl, meta.fromDate, meta.toDate);
  y = drawTableHeader(doc, y, tableX, widths);

  payload.groups.forEach((group) => {
    if (y + GROUP_ROW_H > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'p');
      y = drawTableHeader(doc, V_MARGIN_TOP + CONT_HEADER_H, tableX, widths);
    }
    y = drawGroupRow(doc, y, tableX, tableW, group.user);

    (group.items || []).forEach((row, idx) => {
      const item = { ...row, serial: String(idx + 1) };

      if (y + ROW_H > pageBodyBottom) {
        doc.addPage([PAGE_W, PAGE_H], 'p');
        y = drawTableHeader(doc, V_MARGIN_TOP + CONT_HEADER_H, tableX, widths);
        y = drawGroupRow(doc, y, tableX, tableW, group.user);
      }
      y = drawDataRow(doc, y, tableX, widths, item);
    });
  });

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, meta.printedOn);
  }

  return doc.output('blob');
}

/**
 * @param {'view'|'pdf'} mode
 * @param {Blob} pdfBlob
 * @param {string} [filename]
 */
export function openUserLoginDetailPdf(mode, pdfBlob, filename = 'User-Login-Detail.pdf') {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

// ----------------------------------------------------------------------
// Summarised Version — 2-column "User Name / Number of Times Logged"
// ----------------------------------------------------------------------

/** @type {UserLoginCol[]} */
const SUMMARY_COLS = [
  { key: 'userName', label: 'User Name', weight: 320, align: 'left' },
  { key: 'count', label: 'Number of Times Logged', weight: 240, align: 'center' },
];

const SUMMARY_ROW_H = 22;

const USER_LOGIN_DETAIL_SUMMARY_DEMO = {
  fromDate: 'Jan 01, 2026',
  toDate: 'Dec 31, 2026',
  printedOn: null,
  items: [
    { userName: 'HIBA CHHIPA', count: 2 },
    { userName: 'IRFAN KHAN', count: 28 },
    { userName: 'MINHAJ ALI', count: 25 },
    { userName: 'MUHAMMAD ARSHAD ULLAH', count: 36 },
    { userName: 'MUHAMMAD ASHRAF ALI KHAN', count: 52 },
    { userName: 'MUHAMMAD NAEEM UD DIN', count: 28 },
    { userName: 'MUHAMMAD SHAHZAIB', count: 51 },
    { userName: 'MUNEEB', count: 15 },
    { userName: 'MURSALEEN', count: 3 },
    { userName: 'PERVAIZ ALAM', count: 65 },
    { userName: 'QD1', count: 17 },
    { userName: 'SHAHNAWAZ ASHRAF', count: 93 },
    { userName: 'SHAZIA REHMAN', count: 177 },
    { userName: 'SYED SALMAN ANWAR', count: 150 },
  ],
};

export { USER_LOGIN_DETAIL_SUMMARY_DEMO };

function summaryColWidths(tableW) {
  const sum = SUMMARY_COLS.reduce((a, c) => a + c.weight, 0);
  const out = SUMMARY_COLS.map((c) => (c.weight / sum) * tableW);
  const drift = tableW - out.reduce((a, b) => a + b, 0);
  out[out.length - 1] += drift;
  return out;
}

function drawSummaryHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  SUMMARY_COLS.forEach((col, i) => {
    fillRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, TABLE_HEADER_FILL);
    strokeRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, TABLE_BORDER, 0.4);
    const lines = wrapText(doc, col.label, widths[i], 9, true, 4);
    drawTextCentered(doc, xs[i], y, widths[i], TABLE_HEADER_H, lines, {
      bold: true,
      fontSize: 9,
      color: BLACK,
    });
  });
  return y + TABLE_HEADER_H;
}

function drawSummaryRow(doc, y, x0, widths, item) {
  const xs = colXs(x0, widths);
  SUMMARY_COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, SUMMARY_ROW_H, TABLE_BORDER, 0.3);
    const raw = item[col.key];
    if (raw === undefined || raw === null || raw === '') return;
    const text = String(raw);
    const lines = wrapText(doc, text, w, 8.5, col.key === 'userName', col.key === 'userName' ? 8 : 4);
    drawTextCentered(doc, x, y, w, SUMMARY_ROW_H, lines, {
      bold: col.key === 'userName',
      fontSize: 8.5,
      color: BLACK,
      align: col.align,
      pad: col.key === 'userName' ? 8 : 4,
    });
  });
  return y + SUMMARY_ROW_H;
}

/**
 * Build the User Login Detail (Summarised Version) PDF blob.
 *
 * @param {{
 *   items?: Array<{ userName: string; count: number }>;
 *   fromDate?: string;
 *   toDate?: string;
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildUserLoginDetailSummaryPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.items) && data.items.length > 0
      ? data
      : USER_LOGIN_DETAIL_SUMMARY_DEMO;

  const meta = {
    fromDate: payload.fromDate || data.fromDate || USER_LOGIN_DETAIL_SUMMARY_DEMO.fromDate,
    toDate: payload.toDate || data.toDate || USER_LOGIN_DETAIL_SUMMARY_DEMO.toDate,
    printedOn: payload.printedOn || data.printedOn || formatPrintedOnLong(),
  };

  const doc = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H], orientation: 'p' });
  const logoDataUrl = await loadLogoDataUrl();

  const tableX = H_MARGIN;
  const tableW = PAGE_W - 2 * H_MARGIN;
  const widths = summaryColWidths(tableW);

  const pageBodyBottom = PAGE_H - V_MARGIN_BOTTOM - 18;

  let y = drawPage1Header(doc, logoDataUrl, meta.fromDate, meta.toDate);
  y = drawSummaryHeader(doc, y, tableX, widths);

  payload.items.forEach((row) => {
    if (y + SUMMARY_ROW_H > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'p');
      y = drawSummaryHeader(doc, V_MARGIN_TOP + CONT_HEADER_H, tableX, widths);
    }
    y = drawSummaryRow(doc, y, tableX, widths, row);
  });

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, p, total, meta.printedOn);
  }

  return doc.output('blob');
}
