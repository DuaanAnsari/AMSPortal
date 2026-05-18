import jsPDF from 'jspdf';

/**
 * "User Foot Print Report" — portrait A4 PDF.
 *
 * Layout matches the legacy print mock-up exactly:
 *
 *   - Page 1 header :
 *       - AMS logo (top-left), followed by the company address strip.
 *       - "User Foot Print Report" title (right-aligned column, bold).
 *       - "From Date : <date>"  /  "To Date : <date>"  stacked below the
 *         address block on the left.
 *
 *   - Table columns (8): Sr No, User Name, PO NO, Process, Update Date,
 *     Page Name, Button Pressed, Remarks. Header cells are bold + black
 *     border, data cells follow the legacy color coding (PO NO / Page Name
 *     / Button Pressed in navy "link" blue, Remarks in red for the
 *     "Process Not Selected" warning and teal for "TNA Updated"-style
 *     success messages).
 *
 *   - Page 2+ : table header repeats at the top of every additional page,
 *     no logo / address block on continuation pages (mirrors the legacy
 *     print output).
 *
 * Demo data is hard-coded (50 rows transcribed from the legacy mock-up);
 * backend rows can be passed via the same shape later.
 */

const LOGO_PATH = `${import.meta.env.BASE_URL}logo/AMSlogo.png`;

/** Slightly larger than A4 portrait (595×842) so the 8-column grid breathes. */
const PAGE_W = 720;
const PAGE_H = 1020;
const H_MARGIN = 12;
const V_MARGIN_TOP = 22;
const V_MARGIN_BOTTOM = 28;

const LOGO_W = 110;
const LOGO_H = 56;

const HEADER_BLOCK_H = 138;
const CONT_HEADER_H = 14;

const TABLE_HEADER_H = 28;
const ROW_H = 26;

const TABLE_HEADER_FILL = [255, 255, 255];
const TABLE_BORDER = [0, 0, 0];

const BLACK = [0, 0, 0];

const PDF_VIEW_ZOOM_HASH = '#zoom=100';

/**
 * @typedef {{
 *   key: string;
 *   label: string;
 *   weight: number;
 *   align?: 'left'|'center'|'right';
 *   color?: 'black'|'navy'|'red'|'teal'|'auto';
 * }} UserFootPrintCol
 */

/** @type {UserFootPrintCol[]} */
const COLS = [
  { key: 'serial', label: 'Sr No', weight: 28, align: 'center', color: 'black' },
  { key: 'userName', label: 'User Name', weight: 100, align: 'center', color: 'black' },
  { key: 'poNo', label: 'PO NO', weight: 90, align: 'center', color: 'black' },
  { key: 'process', label: 'Process', weight: 55, align: 'center', color: 'black' },
  { key: 'updateDate', label: 'Update Date', weight: 80, align: 'center', color: 'black' },
  { key: 'pageName', label: 'Page Name', weight: 60, align: 'center', color: 'black' },
  { key: 'buttonPressed', label: 'Button Pressed', weight: 72, align: 'center', color: 'black' },
  { key: 'remarks', label: 'Remarks', weight: 92, align: 'center', color: 'black' },
];

// ----------------------------------------------------------------------
// Demo data — transcribed from the legacy User Foot Print Report print
// (16 rows visible on page 1 + rows 17..50 on page 2).
// ----------------------------------------------------------------------

const REMARK_PROCESS_MISSING = 'Save This PO Button Press\nBut Process Not Selected';
const REMARK_TNA_UPDATED = 'TNA Updated';

const USER_FOOT_PRINT_DEMO = {
  fromDate: 'Jan 01, 2026',
  toDate: 'Dec 31, 2026',
  printedOn: null,
  items: [
    /* eslint-disable max-len */
    { serial: '1', userName: 'MUHAMMAD SHAHZAIB', poNo: 'PO0018684',        process: 'Not Selected', updateDate: '1/5/2026   2:21:14PM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '2',  userName: 'SHAHNAWAZ ASHRAF', poNo: 'AMS-AV 022-Blue',  process: 'Not Selected', updateDate: '1/9/2026  12:16:39PM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '3',  userName: 'SHAHNAWAZ ASHRAF', poNo: 'AMS-AV 022-Salt',  process: 'Not Selected', updateDate: '1/9/2026  12:17:46PM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '4',  userName: 'SHAHNAWAZ ASHRAF', poNo: 'AMS-AV 022-Pink',  process: 'Not Selected', updateDate: '1/9/2026  12:17:57PM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '5',  userName: 'SHAHNAWAZ ASHRAF', poNo: 'AMS-AV 022-OAT B)', process: 'Not Selected', updateDate: '1/9/2026  12:18:10PM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '6',  userName: 'SHAHNAWAZ ASHRAF', poNo: 'AMS-AV 022-OAT',   process: 'Not Selected', updateDate: '1/9/2026  12:18:18PM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '7',  userName: 'SHAHNAWAZ ASHRAF', poNo: 'AMS-AV 022-LAV',   process: 'Not Selected', updateDate: '1/9/2026  12:18:31PM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '8',  userName: 'SHAHNAWAZ ASHRAF', poNo: '38475-PEACH',      process: 'Not Selected', updateDate: '1/12/2026  9:45:23AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '9',  userName: 'SHAHNAWAZ ASHRAF', poNo: '38475-OAT',        process: 'Not Selected', updateDate: '1/12/2026  9:45:51AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '10', userName: 'SHAHNAWAZ ASHRAF', poNo: '38475-NAVY',       process: 'Not Selected', updateDate: '1/12/2026  9:46:26AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '11', userName: 'SHAHNAWAZ ASHRAF', poNo: '38475-CHAR',       process: 'Not Selected', updateDate: '1/12/2026  9:46:46AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '12', userName: 'SHAHNAWAZ ASHRAF', poNo: '38475-BASIL',      process: 'Not Selected', updateDate: '1/12/2026  9:47:18AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '13', userName: 'SHAHNAWAZ ASHRAF', poNo: 'AMS-AV-023',       process: 'Not Selected', updateDate: '1/12/2026  9:48:37AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '14', userName: 'SHAHNAWAZ ASHRAF', poNo: '38423-MCS-CHAR',   process: 'Not Selected', updateDate: '1/12/2026  9:55:58AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '15', userName: 'SHAHNAWAZ ASHRAF', poNo: '38423-MCS-OAT',    process: 'Not Selected', updateDate: '1/12/2026  9:57:47AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '16', userName: 'SHAHNAWAZ ASHRAF', poNo: '38423-MCS-NAVY',   process: 'Not Selected', updateDate: '1/12/2026  9:57:57AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '17', userName: 'SHAHNAWAZ ASHRAF', poNo: '38423-MCS-LAVE',   process: 'Not Selected', updateDate: '1/12/2026  9:58:07AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_PROCESS_MISSING },
    { serial: '18', userName: 'SHAZIA REHMAN',    poNo: 'PO0018471',         process: 'FRI', updateDate: '1/6/2026  4:08:51PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '19', userName: 'SHAZIA REHMAN',    poNo: '38275-MCS-BASIL',   process: 'FRI', updateDate: '1/7/2026  2:20:40PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '20', userName: 'SHAZIA REHMAN',    poNo: '38275-MCS-BROWN',   process: 'FRI', updateDate: '1/7/2026  2:21:42PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '21', userName: 'SHAZIA REHMAN',    poNo: '38275-MCS-CHAR',    process: 'FRI', updateDate: '1/7/2026  2:22:13PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '22', userName: 'SHAZIA REHMAN',    poNo: '38275-MCS-DENIM',   process: 'FRI', updateDate: '1/7/2026  2:22:42PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '23', userName: 'SHAZIA REHMAN',    poNo: '38275-MCS-OAT',     process: 'FRI', updateDate: '1/7/2026  2:23:10PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '24', userName: 'SHAZIA REHMAN',    poNo: '38275-MCS-BASIL',   process: 'FRI', updateDate: '1/7/2026  2:23:30PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '25', userName: 'SHAZIA REHMAN',    poNo: '38104-MPO-NAVY',    process: 'FRI', updateDate: '1/7/2026  2:24:13PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '26', userName: 'SHAZIA REHMAN',    poNo: '38275-MZH-CHAR',    process: 'FRI', updateDate: '1/7/2026  2:25:16PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '27', userName: 'SHAZIA REHMAN',    poNo: '38275-MCS-DENIM',   process: 'FRI', updateDate: '1/7/2026  2:25:46PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '28', userName: 'SHAZIA REHMAN',    poNo: '38275-MZH-OAT',     process: 'FRI', updateDate: '1/7/2026  2:26:15PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '29', userName: 'SHAZIA REHMAN',    poNo: '38275-MPO-BROWN',   process: 'FRI', updateDate: '1/7/2026  2:27:28PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '30', userName: 'SHAZIA REHMAN',    poNo: 'PO0018684',         process: 'FRI', updateDate: '1/8/2026  3:56:47PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '31', userName: 'SHAZIA REHMAN',    poNo: 'AMS-AV 022-OAT',    process: 'FRI', updateDate: '1/9/2026  4:06:16PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '32', userName: 'SHAZIA REHMAN',    poNo: 'AMS-AV 022-Blue',   process: 'FRI', updateDate: '1/9/2026  4:07:28PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '33', userName: 'SHAZIA REHMAN',    poNo: 'AMS-AV 022-Pink',   process: 'FRI', updateDate: '1/9/2026  4:08:14PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '34', userName: 'SHAZIA REHMAN',    poNo: 'AMS-AV 022-LAV',    process: 'FRI', updateDate: '1/9/2026  4:08:51PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '35', userName: 'SHAZIA REHMAN',    poNo: 'AMS-AV 022-Salt',   process: 'FRI', updateDate: '1/9/2026  4:09:33PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '36', userName: 'SHAZIA REHMAN',    poNo: 'AMS-AV-023',        process: 'FRI', updateDate: '1/9/2026  4:11:56PM',   pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '37', userName: 'SHAZIA REHMAN',    poNo: '38422-LS-RED CLAY', process: 'FRI', updateDate: '1/10/2026 10:40:52AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '38', userName: 'SHAZIA REHMAN',    poNo: '38422-SS-BLUE JEAN', process: 'FRI', updateDate: '1/10/2026 10:41:31AM', pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '39', userName: 'SHAZIA REHMAN',    poNo: '38422-SS-CHARCOAL', process: 'FRI', updateDate: '1/10/2026 10:42:14AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '40', userName: 'SHAZIA REHMAN',    poNo: '38422-SS-LAVENDER', process: 'FRI', updateDate: '1/10/2026 10:42:43AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '41', userName: 'SHAZIA REHMAN',    poNo: '38422-SS-NAVY',     process: 'FRI', updateDate: '1/10/2026 10:43:56AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '42', userName: 'SHAZIA REHMAN',    poNo: '38422-SS-PEACH',    process: 'FRI', updateDate: '1/10/2026 10:44:27AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '43', userName: 'SHAZIA REHMAN',    poNo: '38422-SS-RED CLAY', process: 'FRI', updateDate: '1/10/2026 10:44:55AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '44', userName: 'SHAZIA REHMAN',    poNo: '38598-SS-CREAM',    process: 'FRI', updateDate: '1/10/2026 10:45:31AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '45', userName: 'SHAZIA REHMAN',    poNo: '38598-LS-RED CLAY', process: 'FRI', updateDate: '1/10/2026 10:46:08AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '46', userName: 'SHAZIA REHMAN',    poNo: '38423-MCS-BROWN',   process: 'FRI', updateDate: '1/10/2026 11:00:06AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '47', userName: 'SHAZIA REHMAN',    poNo: '38423-MCS-CHAR',    process: 'FRI', updateDate: '1/10/2026 11:00:44AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '48', userName: 'SHAZIA REHMAN',    poNo: '38275-MZH-BROWN',   process: 'FRI', updateDate: '1/10/2026 11:03:07AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '49', userName: 'SHAZIA REHMAN',    poNo: '202294-769',        process: 'FRI', updateDate: '1/10/2026 11:04:56AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    { serial: '50', userName: 'SHAZIA REHMAN',    poNo: '202294-969',        process: 'FRI', updateDate: '1/10/2026 11:05:30AM',  pageName: 'TNA Chart', buttonPressed: 'Save This PO', remarks: REMARK_TNA_UPDATED },
    /* eslint-enable max-len */
  ],
};

export { USER_FOOT_PRINT_DEMO };

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

function setBorder(doc, rgb = TABLE_BORDER, lineW = 0.5) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(lineW);
}

function fillRect(doc, x, y, w, h, fill) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.rect(x, y, w, h, 'F');
}

function strokeRect(doc, x, y, w, h, borderRgb, lineW = 0.5) {
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
// Page 1 header — logo, address block, title, date range.
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
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  const addressY1 = y + LOGO_H + 10;
  doc.text(
    'A M S House 84,Kokan Housing Society Alamgir Road - Postal Code: 74800',
    x,
    addressY1,
    { baseline: 'top' }
  );
  doc.text(
    'Karachi - Pakistan.            Telephone # : 02134937216 & 02134946005',
    x,
    addressY1 + 12,
    { baseline: 'top' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('User Foot Print Report', PAGE_W / 2 + 60, y + LOGO_H / 2 + 10, {
    align: 'center',
    baseline: 'middle',
  });

  const datesY = addressY1 + 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('From Date:', x, datesY, { baseline: 'top' });
  doc.setFont('helvetica', 'normal');
  doc.text(fromDate, x + 70, datesY, { baseline: 'top' });

  doc.setFont('helvetica', 'bold');
  doc.text('To Date:', x, datesY + 18, { baseline: 'top' });
  doc.setFont('helvetica', 'normal');
  doc.text(toDate, x + 70, datesY + 18, { baseline: 'top' });

  y = datesY + 18 + 22;
  return y;
}

// ----------------------------------------------------------------------
// Table header — bold black border, header label in the legacy navy.
// ----------------------------------------------------------------------

function drawTableHeader(doc, y, x0, widths) {
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    fillRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, TABLE_HEADER_FILL);
    strokeRect(doc, xs[i], y, widths[i], TABLE_HEADER_H, TABLE_BORDER, 0.6);
    const lines = wrapText(doc, col.label, widths[i], 8.8, true, 2);
    drawTextCentered(doc, xs[i], y, widths[i], TABLE_HEADER_H, lines, {
      bold: true,
      fontSize: 8.8,
      color: BLACK,
    });
  });
  return y + TABLE_HEADER_H;
}

// ----------------------------------------------------------------------
// Data row — multi-line for "Remarks" + color coding per column.
// ----------------------------------------------------------------------

function pickColor() {
  return BLACK;
}

function measureRowHeight(doc, widths, item) {
  let maxLines = 1;
  COLS.forEach((col, i) => {
    const raw = item[col.key];
    const lines = wrapText(doc, raw, widths[i], 7.8, false, 2);
    if (lines.length > maxLines) maxLines = lines.length;
  });
  const dynamic = maxLines * 12 + 8;
  return Math.max(ROW_H, dynamic);
}

function drawDataRow(doc, y, x0, widths, item) {
  const rowH = measureRowHeight(doc, widths, item);
  const xs = colXs(x0, widths);
  COLS.forEach((col, i) => {
    const x = xs[i];
    const w = widths[i];
    strokeRect(doc, x, y, w, rowH, TABLE_BORDER, 0.5);
    const raw = item[col.key];
    if (raw === undefined || raw === null || raw === '') return;
    const lines = wrapText(doc, raw, w, 7.8, false, 2);
    drawTextCentered(doc, x, y, w, rowH, lines, {
      fontSize: 7.8,
      color: pickColor(),
      align: col.align,
    });
  });
  return y + rowH;
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
 * Build the User Foot Print Report PDF blob.
 *
 * @param {{
 *   items?: object[];
 *   fromDate?: string;
 *   toDate?: string;
 *   printedOn?: string;
 * }} data
 * @returns {Promise<Blob>}
 */
export async function buildUserFootPrintPdfBlob(data = {}) {
  const payload =
    data && Array.isArray(data.items) && data.items.length > 0 ? data : USER_FOOT_PRINT_DEMO;

  const meta = {
    fromDate: payload.fromDate || data.fromDate || USER_FOOT_PRINT_DEMO.fromDate,
    toDate: payload.toDate || data.toDate || USER_FOOT_PRINT_DEMO.toDate,
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

  payload.items.forEach((item) => {
    const rowH = measureRowHeight(doc, widths, item);
    if (y + rowH > pageBodyBottom) {
      doc.addPage([PAGE_W, PAGE_H], 'p');
      const contY = V_MARGIN_TOP + CONT_HEADER_H;
      y = drawTableHeader(doc, contY, tableX, widths);
    }
    y = drawDataRow(doc, y, tableX, widths, item);
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
 */
export function openUserFootPrintPdf(mode, pdfBlob) {
  const pdf = new Blob([pdfBlob], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(pdf);

  if (mode === 'view') {
    window.open(`${blobUrl}${PDF_VIEW_ZOOM_HASH}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    return;
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'User-Foot-Print-Report.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

// Re-export for unused-import guards in some lint configs.
export { HEADER_BLOCK_H };
