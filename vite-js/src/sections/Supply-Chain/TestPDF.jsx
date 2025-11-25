// PurchaseOrderPDF.jsx
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },

  // Generic helpers
  row: {
    flexDirection: 'row',
  },
  col: {
    flexDirection: 'column',
  },
  bold: {
    fontWeight: 'bold',
  },
  center: {
    textAlign: 'center',
  },
  right: {
    textAlign: 'right',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  companyBlock: {
    width: '55%',
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  companyLine: {
    fontSize: 8,
  },
  logoAndTitle: {
    width: '40%',
    alignItems: 'flex-end',
  },
  logoPlaceholder: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 7,
  },
  purchaseOrderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // Top info table
  infoGrid: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  infoCellLabel: {
    width: '25%',
    padding: 3,
    borderRightWidth: 1,
    borderColor: '#000',
    fontWeight: 'bold',
  },
  infoCellValue: {
    width: '25%',
    padding: 3,
    borderRightWidth: 1,
    borderColor: '#000',
  },
  infoCellLabelWide: {
    width: '20%',
    padding: 3,
    borderRightWidth: 1,
    borderColor: '#000',
    fontWeight: 'bold',
  },
  infoCellValueWide: {
    width: '30%',
    padding: 3,
    borderRightWidth: 1,
    borderColor: '#000',
  },
  infoCellFull: {
    width: '50%',
    padding: 3,
    borderRightWidth: 1,
    borderColor: '#000',
  },

  // Section titles
  sectionTitle: {
    marginTop: 8,
    marginBottom: 3,
    fontWeight: 'bold',
    fontSize: 9,
    textTransform: 'uppercase',
  },

  // Fabrication / body & trims table
  fabricationTable: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 8,
  },
  fabricationHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#eaeaea',
  },
  fabricationHeaderCell: {
    flex: 1,
    padding: 3,
    fontWeight: 'bold',
  },
  fabricationRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  fabricationCell: {
    flex: 1,
    padding: 3,
  },

  // Ship / PO details mini table
  poMetaRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 4,
  },
  poMetaBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
  },
  poMetaLabel: {
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#000',
    padding: 3,
  },
  poMetaValue: {
    padding: 3,
  },

  // Address block
  addressBlockRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 8,
  },
  addressBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    padding: 4,
  },
  addressTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },

  // Size / ratio table
  sizeTable: {
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 6,
    marginBottom: 8,
  },
  sizeHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#eaeaea',
  },
  sizeHeaderCell: {
    padding: 3,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderColor: '#000',
    fontSize: 8,
  },
  sizeHeaderCellSmall: {
    width: 25,
    padding: 3,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderColor: '#000',
    fontSize: 8,
  },
  sizeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  sizeCell: {
    padding: 3,
    borderRightWidth: 1,
    borderColor: '#000',
    fontSize: 8,
  },
  sizeCellSmall: {
    width: 25,
    padding: 3,
    borderRightWidth: 1,
    borderColor: '#000',
    fontSize: 8,
  },

  // Totals section
  totalsBlock: {
    marginTop: 6,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalsLeft: {
    width: '50%',
  },
  totalsRight: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#000',
  },
  totalsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  totalsLabel: {
    flex: 1,
    padding: 3,
    fontWeight: 'bold',
  },
  totalsValue: {
    flex: 1,
    padding: 3,
    textAlign: 'right',
  },

  // Special instructions / notes
  textBlockTitle: {
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
    textDecoration: 'underline',
  },
  textBlockLine: {
    marginBottom: 2,
  },

  footerLine: {
    marginTop: 12,
    fontSize: 7,
    textAlign: 'right',
  },

  // Page number + ERP footer
  pageFooter: {
    position: 'absolute',
    bottom: 18,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
  },

  // Page 2 List
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletNumber: {
    width: 26,
  },
  bulletText: {
    flex: 1,
  },

  // Page 3 layout
  productPageHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productRow: {
    flexDirection: 'row',
  },
  productImageBlock: {
    width: '40%',
    alignItems: 'center',
    paddingTop: 10,
  },
  bigImagePlaceholder: {
    width: 160,
    height: 200,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigImagePlaceholderText: {
    fontSize: 10,
  },
  productInfoBlock: {
    width: '60%',
    paddingLeft: 12,
    paddingTop: 10,
  },
  productInfoLine: {
    marginBottom: 6,
  },
  productLabel: {
    fontWeight: 'bold',
  },
});

export const PurchaseOrderPDF = () => (
  <Document>
    {/* PAGE 1 */}
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companyBlock}>
          <Text style={styles.companyName}>A M S</Text>
          <Text style={styles.companyLine}>
            House 84, Kokan Housing Society, Alamgir Road - Postal Code: 74800
          </Text>
          <Text style={styles.companyLine}>Karachi - Pakistan.</Text>
          <Text style={styles.companyLine}>
            Telephone # : (+92213) 485-3935 &amp; 36
          </Text>
        </View>

        <View style={styles.logoAndTitle}>
          {/* Placeholder instead of real logo */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText}>LOGO</Text>
          </View>
          <Text style={styles.purchaseOrderTitle}>Purchase Order</Text>
        </View>
      </View>

      {/* Top Info Grid */}
      <View style={styles.infoGrid}>
        {/* Row 1 */}
        <View style={styles.infoRow}>
          <View style={styles.infoCellLabel}>
            <Text>Attn :</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>ALL SEASONS TEXTILE</Text>
          </View>
          <View style={styles.infoCellLabel}>
            <Text>Tracking Code:</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>130691</Text>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.infoRow}>
          <View style={styles.infoCellLabelWide}>
            <Text>Customer, Brand / Label Name &amp; Division:</Text>
          </View>
          <View style={styles.infoCellValueWide}>
            <Text>COMFORT APPAREL / Gentle Threads / Men</Text>
          </View>
          <View style={styles.infoCellLabel}>
            <Text>R.N #:</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>11265</Text>
          </View>
        </View>

        {/* Row 3 */}
        <View style={styles.infoRow}>
          <View style={styles.infoCellLabel}>
            <Text>Brand:</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>Gentle Threads</Text>
          </View>
          <View style={styles.infoCellLabel}>
            <Text>Division:</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>Men</Text>
          </View>
        </View>

        {/* Row 4 */}
        <View style={styles.infoRow}>
          <View style={styles.infoCellLabel}>
            <Text>Ship To:</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>
              ALL SEASONS TEXTILE, PLOT # E-99, SECTOR 31-D, KORANGI
              INDUSTRIAL AREA, KARACHI PAKISTAN
            </Text>
          </View>
          <View style={styles.infoCellLabel}>
            <Text>Destination :</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>NEW YORK, NY USA</Text>
          </View>
        </View>

        {/* Row 5 */}
        <View style={styles.infoRow}>
          <View style={styles.infoCellLabel}>
            <Text>AMS - Ref # :</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>AMS-2261</Text>
          </View>
          <View style={styles.infoCellLabel}>
            <Text>P.O Received Date</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>Monday, May 19, 2025</Text>
          </View>
        </View>

        {/* Row 6 */}
        <View style={styles.infoRow}>
          <View style={styles.infoCellLabel}>
            <Text>Item Description :</Text>
          </View>
          <View style={styles.infoCellFull}>
            <Text>100% Cotton Men Jersey Garment Dye LS Tee</Text>
          </View>
          <View style={styles.infoCellLabel}>
            <Text>Ex-Factory (Ship Date)</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>07-15-2025</Text>
          </View>
        </View>

        {/* Row 7 */}
        <View style={styles.infoRow}>
          <View style={styles.infoCellLabel}>
            <Text>Lead Time:</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>57 Days</Text>
          </View>
          <View style={styles.infoCellLabel}>
            <Text>Ship Mode:</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>Sea FOB DP</Text>
          </View>
        </View>

        {/* Row 8 */}
        <View style={styles.infoRow}>
          <View style={styles.infoCellLabel}>
            <Text>Shipment Terms :</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>FOB</Text>
          </View>
          <View style={styles.infoCellLabel}>
            <Text>Payment Terms :</Text>
          </View>
          <View style={styles.infoCellValue}>
            <Text>DP</Text>
          </View>
        </View>
      </View>

      {/* Fabrication Body & Trims */}
      <Text style={styles.sectionTitle}>
        Fabrication Body &amp; Trims
      </Text>

      <View style={styles.fabricationTable}>
        <View style={styles.fabricationHeaderRow}>
          <Text style={styles.fabricationHeaderCell}>Description</Text>
          <Text style={styles.fabricationHeaderCell}>Body</Text>
          <Text style={styles.fabricationHeaderCell}>Other</Text>
          <Text style={styles.fabricationHeaderCell}>Fabric Content</Text>
          <Text style={styles.fabricationHeaderCell}>Weight</Text>
          <Text style={styles.fabricationHeaderCell}>Packing Instructions</Text>
        </View>

        <View style={styles.fabricationRow}>
          <Text style={styles.fabricationCell}>
            100% Cotton Men Jersey Garment Dye LS Tee
          </Text>
          <Text style={styles.fabricationCell}>Jersey</Text>
          <Text style={styles.fabricationCell}>100% Cotton</Text>
          <Text style={styles.fabricationCell}>100% Cotton</Text>
          <Text style={styles.fabricationCell}>190 GSM</Text>
          <Text style={styles.fabricationCell}>
            12pcs poly bag and 48pcs Master Carton
          </Text>
        </View>
      </View>

      {/* PO meta small blocks */}
      <View style={styles.poMetaRow}>
        <View style={styles.poMetaBlock}>
          <Text style={styles.poMetaLabel}>AMS - Team :</Text>
          <Text style={styles.poMetaValue}>MUHAMMAD SHAHZAIB</Text>
        </View>
        <View style={styles.poMetaBlock}>
          <Text style={styles.poMetaLabel}>C.P.O # :</Text>
          <Text style={styles.poMetaValue}>130691</Text>
        </View>
        <View style={styles.poMetaBlock}>
          <Text style={styles.poMetaLabel}>Style # :</Text>
          <Text style={styles.poMetaValue}>37522-LS-RED / LR2096</Text>
        </View>
      </View>

      {/* Address Blocks */}
      <View style={styles.addressBlockRow}>
        <View style={styles.addressBlock}>
          <Text style={styles.addressTitle}>Buyer Address</Text>
          <Text>Gentle Threads / COMFORT APPAREL</Text>
          <Text>1441 BROADWAY, SUITE # 6162</Text>
          <Text>NEW YORK, NY 10018</Text>
          <Text>NY USA</Text>
        </View>
        <View style={styles.addressBlock}>
          <Text style={styles.addressTitle}>Factory Address</Text>
          <Text>ALL SEASONS TEXTILE</Text>
          <Text>PLOT # E-99, SECTOR 31-D</Text>
          <Text>KORANGI INDUSTRIAL AREA</Text>
          <Text>KARACHI PAKISTAN</Text>
        </View>
        <View style={styles.addressBlock}>
          <Text style={styles.addressTitle}>Carton Marking</Text>
          <Text>LR</Text>
          <Text>48 Pcs Per Carton</Text>
          <Text>Product Category: Knits</Text>
        </View>
      </View>

      {/* Size / Ratio Table */}
      <View style={styles.sizeTable}>
        {/* Header */}
        <View style={styles.sizeHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeHeaderCell}>Color (s)</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeHeaderCell}>Size Range</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeHeaderCell}>Color</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeHeaderCell}>Total Qty in PCS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeHeaderCell}>FOB Unit Price (s)</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeHeaderCell}>FOB Value</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeHeaderCell}>Sub Amount</Text>
          </View>
        </View>

        {/* Color row (Red clay) */}
        <View style={styles.sizeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>Red clay</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>S-XL</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>Red clay</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>2,256</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>$ 2.93</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>$ 6,610.08</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>$ 6,610.08</Text>
          </View>
        </View>

        {/* Breakdown by size */}
        {/* S-XL row */}
        <View style={styles.sizeRow}>
          <Text style={styles.sizeCellSmall}>Size</Text>
          <Text style={styles.sizeCellSmall}>S</Text>
          <Text style={styles.sizeCellSmall}>M</Text>
          <Text style={styles.sizeCellSmall}>L</Text>
          <Text style={styles.sizeCellSmall}>XL</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>FOB</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>Unit Price</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>FOB Value</Text>
          </View>
        </View>

        <View style={styles.sizeRow}>
          <Text style={styles.sizeCellSmall}>Qty</Text>
          <Text style={styles.sizeCellSmall}>672</Text>
          <Text style={styles.sizeCellSmall}>480</Text>
          <Text style={styles.sizeCellSmall}>672</Text>
          <Text style={styles.sizeCellSmall}>432</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>2,256.00</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>$ 2.93</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>$ 6,610.08</Text>
          </View>
        </View>

        {/* 2XL row */}
        <View style={styles.sizeRow}>
          <Text style={styles.sizeCellSmall}>Size</Text>
          <Text style={styles.sizeCellSmall}>2XL</Text>
          <Text style={styles.sizeCellSmall}> </Text>
          <Text style={styles.sizeCellSmall}> </Text>
          <Text style={styles.sizeCellSmall}> </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>0.00</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>$ 2.93</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>0.00</Text>
          </View>
        </View>

        {/* 3XL row */}
        <View style={styles.sizeRow}>
          <Text style={styles.sizeCellSmall}>Size</Text>
          <Text style={styles.sizeCellSmall}>3XL</Text>
          <Text style={styles.sizeCellSmall}> </Text>
          <Text style={styles.sizeCellSmall}> </Text>
          <Text style={styles.sizeCellSmall}> </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>0.00</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>$ 3.28</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sizeCell}>0.00</Text>
          </View>
        </View>
      </View>

      {/* Totals & special sections */}
      <View style={styles.totalsBlock}>
        <View style={styles.totalsLeft}>
          <Text style={styles.textBlockTitle}>Special Instructions :</Text>
          <Text style={styles.textBlockLine}>GARMENT DYE</Text>
          <Text style={styles.textBlockLine}>
            1- Fabric should be heat set and lock properly to avoid shrinkage
            problem.
          </Text>
          <Text style={styles.textBlockLine}>
            2- Before cutting fabric should be kept on table for atleast 24
            hours.
          </Text>
          <Text style={styles.textBlockLine}>
            3- All garments should be 100% checked for sizes before carton
            packing.
          </Text>

          <Text style={styles.textBlockTitle}>Washing - Care Label Instructions</Text>
          <Text style={styles.textBlockLine}>
            Machine Wash Cold With Like Colors, Gentle Cycle.
          </Text>
          <Text style={styles.textBlockLine}>
            Use Only Non Chlorine Bleach when needed, Line Dry, Cool Iron.
          </Text>

          <Text style={styles.textBlockTitle}>Sampling Req :</Text>
          <Text style={styles.textBlockLine}>N/A</Text>
        </View>

        <View style={styles.totalsRight}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total Qty (PCS):</Text>
            <Text style={styles.totalsValue}>2,256</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total Cartons:</Text>
            <Text style={styles.totalsValue}>47 Ctn</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>P.O Net FOB Value:</Text>
            <Text style={styles.totalsValue}>$ 6,610.08</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Ratio:</Text>
            <Text style={styles.totalsValue}>LR</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>P.O Total:</Text>
            <Text style={styles.totalsValue}>$ 6,610.08</Text>
          </View>
        </View>
      </View>

      <Text style={styles.textBlockTitle}>Source</Text>
      <Text style={styles.textBlockLine}>Fabric Trims &amp; Accessories : Local</Text>
      <Text style={styles.textBlockLine}>Special Operation Emb &amp; Embellishment : N/A</Text>
      <Text style={styles.textBlockLine}>More Info : GARMENT DYE</Text>

      <Text style={styles.textBlockTitle}>Beneficiary&apos;s Bank :</Text>
      <Text style={styles.textBlockLine}>Routing No. :</Text>
      <Text style={styles.textBlockLine}>Account No. :</Text>

      {/* Footer page 1 */}
      <View style={styles.pageFooter}>
        <Text>1 Page #:</Text>
        <Text>ERP Solution Provider : www.itg.net.pk</Text>
      </View>
    </Page>

    {/* PAGE 2 – Important Note & Acknowledgement */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>All Seaon Textile Inc.</Text>

      <View style={{ marginTop: 8, marginBottom: 6 }}>
        <Text style={[styles.textBlockTitle, { textDecoration: 'none' }]}>
          Prepared &amp; Checked By
        </Text>
        <Text>Mr. Mushtaq Ashraf</Text>
      </View>

      <View style={{ marginBottom: 6 }}>
        <Text style={[styles.textBlockTitle, { textDecoration: 'none' }]}>
          Factory Acknowledgement
        </Text>
      </View>

      <Text style={styles.textBlockTitle}>Important Note:</Text>

      {[
        '1. PO should be read carefully and confirm in 3 days from the date of issuance.',
        '2. Goods should be in good quality as per the buyer requirement, otherwise factory will be responsible for charge back.',
        '3. We should have Packing 24 hours before to our agreed delivery date.',
        '4. Packing should be as per Purchaser order and mix carton are not allowed.',
        '5. Factory will have to get approval of carton marking from merchandiser.',
        '6. SGS should be done on Monday (If Required)',
        '7. SGS will only applicable after our AMS passed.',
        '8. Tuesday goods should be on the port.',
        '9. If there is a space vacant in the container due to short quantity then factory will be responsible for dead space.',
        '10. Delay penalties will be charged as under:',
        '01 Week Delay                          5% of Invoice value',
        '02 Weeks Delay                        8% of Invoice Value',
        '03 Weeks Delay                        12 % of Invoice Value',
        'Onward                                        16 % of Invoice Value',
        '11. If any there will be any shortfall then 5% will be adjust from invoice value.',
        '12. After all delays if customer requires AIR shipment then factory have to bear all the expenses.',
      ].map((line, idx) => (
        <View style={styles.bulletRow} key={idx}>
          <Text style={styles.bulletText}>{line}</Text>
        </View>
      ))}

      <View style={{ marginTop: 20 }}>
        <Text style={styles.textBlockLine}>Factory Acknowledgement</Text>
        <Text style={styles.textBlockLine}>Prepared &amp; Checked By</Text>
        <Text style={styles.textBlockLine}>Mr. Mushtaq Ashraf</Text>
      </View>

      {/* Footer page 2 */}
      <View style={styles.pageFooter}>
        <Text>2 Page #:</Text>
        <Text>ERP Solution Provider : www.itg.net.pk</Text>
      </View>
    </Page>

    {/* PAGE 3 – Product + image placeholder */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.productPageHeader}>Product Information</Text>

      <View style={styles.productRow}>
        {/* Placeholder instead of product image */}
        <View style={styles.productImageBlock}>
          <View style={styles.bigImagePlaceholder}>
            <Text style={styles.bigImagePlaceholderText}>PRODUCT IMAGE</Text>
          </View>
        </View>

        <View style={styles.productInfoBlock}>
          <View style={styles.productInfoLine}>
            <Text>
              <Text style={styles.productLabel}>Color: </Text>Red clay
            </Text>
          </View>
          <View style={styles.productInfoLine}>
            <Text>
              <Text style={styles.productLabel}>Item Description: </Text>
              100% Cotton Men Jersey Garment Dye LS Tee
            </Text>
          </View>
          <View style={styles.productInfoLine}>
            <Text>
              <Text style={styles.productLabel}>Qty: </Text>2,256
            </Text>
          </View>
          <View style={styles.productInfoLine}>
            <Text>
              <Text style={styles.productLabel}>Fabric Content: </Text>100% Cotton
            </Text>
          </View>
          <View style={styles.productInfoLine}>
            <Text>
              <Text style={styles.productLabel}>Weight: </Text>190 GSM
            </Text>
          </View>
        </View>
      </View>

      {/* Footer page 3 */}
      <View style={styles.pageFooter}>
        <Text>3 Page #:</Text>
        <Text>ERP Solution Provider : www.itg.net.pk</Text>
      </View>
    </Page>
  </Document>
);