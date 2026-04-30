/** Demo data — replace with `SelfSizeSpecs` / view-list API. */

export const MOCK_SIZE_SPECS_ROWS = [
  {
    poDetailId: 88011,
    poid: 88011,
    creationDate: '11 Dec 2023',
    autoNo: 'TEST11-001',
    reportDate: '11-Dec-2023',
    reportNo: 'TEST11-001',
    qaName: 'QD1',
    orderQty: '24.00',
    customerName: 'PERRIN, INC',
    vendorName: 'AHMED ENTERPRISES',
    pono: 'TEST11',
    styleNo: '2418RDWOOD',
    color: 'REDWOOD',
    remarks: '',
    measurementUnit: '0',
    measurementType: '1',
    sheetTitle: 'T-shirt - (CM)',
    userName: 'qd1',
  },
  {
    poDetailId: 1,
    poid: 166332,
    creationDate: '28 Apr 2026',
    autoNo: 'SS-AMS-166332-001',
    customerName: 'Demo Customer (legacy PO)',
    vendorName: 'Demo Vendor',
    userName: 'jdoe',
    pono: 'PO-166332',
    styleNo: 'ST-LEGACY-166332',
    remarks: 'Loaded for lPODetailID=1 & lPOID=166332 (demo).',
    measurementUnit: '0',
    measurementType: '1',
  },
  {
    poDetailId: 50101,
    poid: 88001,
    creationDate: '12 Jan 2024',
    autoNo: 'SS-AMS-2024-0001',
    customerName: 'Acme Retail',
    vendorName: 'Euro Stitch Ltd',
    userName: 'jdoe',
    pono: '37508',
    styleNo: 'LR-2096',
    remarks: '',
    measurementUnit: '0',
    measurementType: '2',
  },
  {
    poDetailId: 50102,
    poid: 88002,
    creationDate: '03 Feb 2024',
    autoNo: 'SS-AMS-2024-0002',
    customerName: 'Acme Retail',
    vendorName: 'Prime Garments',
    userName: 'asmith',
    pono: '37508',
    styleNo: 'LR-2097',
    remarks: '',
    measurementUnit: '0',
    measurementType: '1',
  },
  {
    poDetailId: 50103,
    poid: 88003,
    creationDate: '20 Mar 2024',
    autoNo: 'SS-AMS-2024-0003',
    customerName: 'Global Buyer Inc',
    vendorName: 'Mill One',
    userName: 'jdoe',
    pono: 'PO-99221',
    styleNo: 'GB-STYLE-01',
    remarks: '',
    measurementUnit: '1',
    measurementType: '3',
  },
];

/**
 * Match legacy `SelfSizeSpecsEntry.aspx?lPODetailID=&lPOID=` — prefer exact pair, then POID only.
 */
export function findMockSizeSpecRow(lPODetailID, lPOID) {
  const pd = Number(lPODetailID);
  const pid = Number(lPOID);
  if (!Number.isFinite(pid) || pid <= 0) return null;
  const byBoth = MOCK_SIZE_SPECS_ROWS.find((r) => r.poDetailId === pd && r.poid === pid);
  if (byBoth) return byBoth;
  return MOCK_SIZE_SPECS_ROWS.find((r) => r.poid === pid) ?? null;
}

export function buildFallbackEditForm(lPODetailID, lPOID) {
  const pd = lPODetailID != null && lPODetailID !== '' ? String(lPODetailID) : '—';
  const pid = String(lPOID);
  return {
    poNo: `PO-${pid}`,
    styleNo: `STYLE-${pd}`,
    buyer: '—',
    specNo: `SS-${pid}-${pd}`,
    remarks: '',
    measurementUnit: '0',
    measurementType: '',
  };
}
