/**
 * Demo rows for “Merchandiser Wise Statement of Milestone Summary” PDF (Crystal-style layout).
 * Field names match `milestone-summary-pdf-export.js` column mapping.
 * TODO: replace with API rows when backend is ready.
 */

const MILESTONE_SUMMARY_DEMO_ROWS = [
  {
    MerchandiserName: 'MUHAMMAD SHAHZAIB',
    PONO: '38831-MPO-NAVY',
    VenderName: 'MS GARMENTS',
    CustomerName: 'LONE ROCK',
    ShipmentDate1: '2026-03-15',
    ShipmentDate2: '2026-03-15',
    Quantity: 3984,
    LabDip: '2026-02-04',
    ProtoFIT: '2026-02-04',
    DyeLotBlanket: '2026-02-04',
    SizeSetTD: '2026-02-04',
    SizesettoBuyer: '2026-02-04',
    PrintMockupStrikeoff: '2026-02-04',
    PPSample: '2026-02-04',
    TestingLocal: '2026-02-04',
    TestingNominated: '2026-02-04',
    Knitting: '2026-02-04',
    Dying: '2026-02-04',
    Cutting: '2026-02-04',
    PrintEmb: '2026-02-04',
    Stiching: '2026-02-04',
    Washing: '2026-02-04',
    Packing: '2026-02-04',
    FRI1: '2026-02-04',
    FRI2: '2026-02-04',
  },
  {
    MerchandiserName: 'MUHAMMAD SHAHZAIB',
    PONO: '38832-MPO-BLACK',
    VenderName: 'PREMIER TEXTILES',
    CustomerName: 'SUMMIT APPAREL',
    ShipmentDate1: '2026-04-10',
    ShipmentDate2: '2026-04-12',
    Quantity: 2150,
    LabDip: '2026-01-18',
    ProtoFIT: '2026-02-01',
    DyeLotBlanket: '2026-02-08',
    SizeSetTD: '2026-02-14',
    SizesettoBuyer: '2026-02-20',
    PrintMockupStrikeoff: '2026-02-25',
    PPSample: '2026-03-02',
    TestingLocal: '2026-03-06',
    TestingNominated: '2026-03-09',
    Knitting: '2026-03-14',
    Dying: '2026-03-18',
    Cutting: '2026-03-22',
    PrintEmb: '2026-03-28',
    Stiching: '2026-04-02',
    Washing: '2026-04-06',
    Packing: '2026-04-08',
    FRI1: '2026-04-09',
    FRI2: '2026-04-11',
  },
];

/** @returns {object[]} */
export function getMilestoneSummaryDemoRows() {
  return MILESTONE_SUMMARY_DEMO_ROWS.map((r) => ({ ...r }));
}
