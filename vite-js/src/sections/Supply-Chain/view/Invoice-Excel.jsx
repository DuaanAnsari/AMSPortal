import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const fmtDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-US');
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

// Helper: Convert number to words (simple version for USD, matches Print Invoice)
function numberToWords(amount) {
  const num = Math.floor(Number(amount || 0));
  const ones = [
    '',
    'ONE',
    'TWO',
    'THREE',
    'FOUR',
    'FIVE',
    'SIX',
    'SEVEN',
    'EIGHT',
    'NINE',
    'TEN',
    'ELEVEN',
    'TWELVE',
    'THIRTEEN',
    'FOURTEEN',
    'FIFTEEN',
    'SIXTEEN',
    'SEVENTEEN',
    'EIGHTEEN',
    'NINETEEN',
  ];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const scales = ['', 'THOUSAND', 'MILLION', 'BILLION'];

  function convertGroup(n) {
    let res = '';
    if (n >= 100) {
      res += `${ones[Math.floor(n / 100)]} HUNDRED `;
      n %= 100;
    }
    if (n >= 20) {
      res += `${tens[Math.floor(n / 10)]} `;
      n %= 10;
    }
    if (n > 0) res += `${ones[n]} `;
    return res;
  }

  if (num === 0) return 'ZERO';
  let res = '';
  let scaleIndex = 0;
  let n = num;
  while (n > 0) {
    const group = n % 1000;
    if (group > 0) res = `${convertGroup(group)}${scales[scaleIndex]}${res ? ' ' : ''}${res}`;
    n = Math.floor(n / 1000);
    scaleIndex += 1;
  }

  return `${res.trim()} US$ ONLY`;
}

export default function InvoiceExcelPage() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const invoiceNo =
          state?.shipment?.ldp ||
          state?.shipment?.ldpInvoiceNo ||
          state?.invoiceNo ||
          id;

        if (!invoiceNo) throw new Error('Missing invoice number.');
        if (!API_BASE_URL) throw new Error('Missing VITE_API_BASE_URL in env.');

        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const base = String(API_BASE_URL).replace(/\/+$/, '');
        const url = `${base}/api/Report/PrintInvoicePDF/${encodeURIComponent(invoiceNo)}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const json = await res.json();
        const items = Array.isArray(json) ? json : json ? [json] : [];
        const first = items[0] || {};
        if (!items.length) throw new Error('No data found.');

        const products = items.map((it) => {
          const qty = Number(it.shipQty || 0);
          const rate = Number(it.ldpRate || 0);
          const amount = qty * rate;
          return {
            poNo: it.pono || '',
            styleNo: it.styles || '',
            item: it.itemDescriptionInvoice || it.itemDescription || '',
            sizeRange: it.sizeRange || '',
            ldpRate: rate,
            shipQty: qty,
            shipCartons: Number(it.shipCartons || 0),
            amount,
          };
        });

        const shipmentPcsTotal = products.reduce((acc, p) => acc + (Number(p.shipQty) || 0), 0);
        const shipmentCartonsTotal = products.reduce((acc, p) => acc + (Number(p.shipCartons) || 0), 0);
        const shipmentAmountTotal = products.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

        const truckingCharges = Number(first.subTotalA1New || 0);
        const deductions = Number(first.subTotalA2New || 0);
        const adjustments = Number(first.subTotalA3New || 0);
        const netFinReceivable = shipmentAmountTotal + truckingCharges - deductions + adjustments;

        // Transform similar to Print-Invoice.jsx (for full structure)
        const transformed = {
          companyName: 'All Seasons textile',
          companyAddress: '1441 BROADWAY, SUITE # 4142 NEW YORK, NY 10018',
          country: 'USA',
          invoiceNo: first.ldpInvoiceNo || invoiceNo,
          invoiceDate: fmtDate(first.invoiceDate),
          // Bill To
          billTo: {
            company: first.customerName || '',
            name: first.customerName || '',
            address: first.address || '',
            city: first.city || '',
            country: first.country || '',
          },
          // Ship To
          shipTo: {
            company: first.cargoConsigneeName || '',
            name: first.cargoConsigneeName || '',
            address: first.cargoConsigneeAddress1 || '',
            city: first.cargooConsigneeCity || first.cargoConsigneeCity || '',
            country: first.cargoConsigneeCountry || '',
          },
          shipping: {
            paymentTerms: first.terms || '',
            shipmentMode: first.mode || '',
            blAwbl: first.billNo || '',
            containerNo: first.containerNo || '',
            etdKarachi: fmtDate(first.etdExpectedDate),
            etaDestination: fmtDate(first.etaExpectedDate),
            destination: first.destination || '',
            marksNos: '',
            etw: first.etwDate && !String(first.etwDate).startsWith('1900-01-01') ? fmtDate(first.etwDate) : '',
          },
          products: products.map((p) => ({
            poNo: p.poNo,
            styleNo: p.styleNo,
            prodCode: '',
            item: p.item,
            sizeRange: p.sizeRange,
            ldpUnit: Number(p.ldpRate || 0),
            shippedQtyInPcs: Number(p.shipQty || 0),
            shpdOfCartons: Number(p.shipCartons || 0),
            ldpValue: Number(p.amount || 0),
            deductionAmount: '',
            adjustedAmount: '',
            invoiceAmount: Number(p.amount || 0),
          })),
          shipmentTotal: {
            pcs: shipmentPcsTotal,
            cartons: shipmentCartonsTotal,
            label: 'Ctns',
            amount: shipmentAmountTotal,
          },
          truckingCharges,
          deductions,
          adjustments,
          netReceivable: netFinReceivable,
          remarks: first.remarks || '',
          amountInWords: numberToWords(Math.round(netFinReceivable || 0)),
          beneficiary: {
            company: 'All Seasons textile',
            address: '1441 BROADWAY, SUITE # 4142 NEW YORK,',
            city: 'NY 10018',
            country: 'USA',
          },
          bank: {
            name: first.bankName || '',
            address: first.bankBranch || '',
            country: 'USA',
            accountNo: first.accountNo || '',
            routingNo: first.iban || '',
          },
        };

        // Build Excel with "Print Invoice" structure (content-complete)
        const C = 11; // A..K
        const row = (...vals) => {
          const out = new Array(C).fill('');
          vals.forEach((v, i) => {
            out[i] = v ?? '';
          });
          return out;
        };

        const aoa = [];
        aoa.push(row(transformed.companyName));
        aoa.push(row(transformed.companyAddress));
        aoa.push(row(transformed.country));
        aoa.push(row());
        aoa.push(row('INVOICE'));
        aoa.push(row());
        aoa.push(row('Invoice # :', transformed.invoiceNo, '', 'Date :', transformed.invoiceDate));
        aoa.push(row());

        // Bill To / Ship To blocks (text in cells; merges applied below)
        aoa.push(row('Bill To :', '', '', '', '', 'Ship To :'));
        aoa.push(row(transformed.billTo.company, '', '', '', '', transformed.shipTo.company));
        aoa.push(row(transformed.billTo.name, '', '', '', '', transformed.shipTo.name));
        aoa.push(row(transformed.billTo.address, '', '', '', '', transformed.shipTo.address));
        aoa.push(row(`${transformed.billTo.city}  ${transformed.billTo.country}`.trim(), '', '', '', '', `${transformed.shipTo.city}  ${transformed.shipTo.country}`.trim()));
        aoa.push(row());

        // Shipping Information (key/value)
        aoa.push(row('Shipping Information'));
        aoa.push(row('Payment Terms', transformed.shipping.paymentTerms, 'BL - AWBL', transformed.shipping.blAwbl, 'Shipment Mode', transformed.shipping.shipmentMode));
        aoa.push(row('Container #', transformed.shipping.containerNo, 'Marks & Nos', transformed.shipping.marksNos || '-', 'ETD - Karachi', transformed.shipping.etdKarachi));
        aoa.push(row('ETA - Destination', transformed.shipping.etaDestination, 'Destination', transformed.shipping.destination, 'ETW', transformed.shipping.etw));
        aoa.push(row());

        // Product & Quantity Information (same columns as Print Invoice)
        aoa.push(row('Product & Quantity Information'));
        aoa.push(row(
          'P.O #',
          'Style # / Prod Code',
          'Item',
          'Size Range',
          'LDP Unit',
          'Shipped Qty in Pcs',
          'SHPD # of Cartons',
          'LDP Value',
          'Deduction Amount (if Any)',
          'Adjusted Amount (if Any)',
          'Invoice Amount'
        ));

        transformed.products.forEach((p) => {
          aoa.push(row(
            p.poNo,
            `${p.styleNo}${p.prodCode ? `\n${p.prodCode}` : ''}`,
            p.item,
            p.sizeRange,
            p.ldpUnit,
            p.shippedQtyInPcs,
            p.shpdOfCartons,
            p.ldpValue,
            p.deductionAmount,
            p.adjustedAmount,
            p.invoiceAmount
          ));
        });

        aoa.push(row());
        aoa.push(row('Shipment Total', '', '', '', '', transformed.shipmentTotal.pcs, transformed.shipmentTotal.cartons, '', '', '', transformed.shipmentTotal.amount));
        aoa.push(row('Trucking Charges', transformed.truckingCharges));
        aoa.push(row('Deductions', transformed.deductions));
        aoa.push(row('Adjustments', transformed.adjustments));
        aoa.push(row('NET RECEIVABLE', transformed.netReceivable));
        aoa.push(row());
        aoa.push(row('Amount in Words', transformed.amountInWords));
        aoa.push(row('Remarks', transformed.remarks));
        aoa.push(row());
        aoa.push(row('Beneficiary', transformed.beneficiary.company));
        aoa.push(row('', transformed.beneficiary.address));
        aoa.push(row('', transformed.beneficiary.city));
        aoa.push(row('', transformed.beneficiary.country));
        aoa.push(row());
        aoa.push(row('Bank', transformed.bank.name));
        aoa.push(row('Account No', transformed.bank.accountNo));
        aoa.push(row('Routing / IFSC', transformed.bank.routingNo));
        aoa.push(row('Branch', transformed.bank.address));

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        // Column widths (A..K) aligned to Print Invoice table
        ws['!cols'] = [
          { wch: 14 }, // PO
          { wch: 20 }, // Style / Prod
          { wch: 60 }, // Item
          { wch: 18 }, // Size
          { wch: 12 }, // LDP Unit
          { wch: 18 }, // Qty
          { wch: 16 }, // Cartons
          { wch: 14 }, // LDP Value
          { wch: 18 }, // Deduction
          { wch: 18 }, // Adjusted
          { wch: 16 }, // Invoice Amount
        ];

        // Basic merges for nicer "structure" (no styles needed)
        ws['!merges'] = [
          // companyName, address, country
          { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
          // INVOICE title
          { s: { r: 4, c: 0 }, e: { r: 4, c: 10 } },
          // Bill To / Ship To headers and lines
          { s: { r: 8, c: 0 }, e: { r: 8, c: 3 } },
          { s: { r: 8, c: 5 }, e: { r: 8, c: 10 } },
          { s: { r: 9, c: 0 }, e: { r: 9, c: 3 } },
          { s: { r: 9, c: 5 }, e: { r: 9, c: 10 } },
          { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } },
          { s: { r: 10, c: 5 }, e: { r: 10, c: 10 } },
          { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } },
          { s: { r: 11, c: 5 }, e: { r: 11, c: 10 } },
          { s: { r: 12, c: 0 }, e: { r: 12, c: 3 } },
          { s: { r: 12, c: 5 }, e: { r: 12, c: 10 } },
          // Shipping Information title
          { s: { r: 14, c: 0 }, e: { r: 14, c: 10 } },
          // Product & Quantity title
          { s: { r: 19, c: 0 }, e: { r: 19, c: 10 } },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Invoice');

        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([out], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        downloadBlob(blob, `Invoice_${String(first.ldpInvoiceNo || invoiceNo).replace(/[^\w-]+/g, '_')}.xlsx`);

        // Immediately go back (no "view" page experience)
        if (isActive) {
          setLoading(false);
          setTimeout(() => navigate(-1), 150);
        }
      } catch (e) {
        if (!isActive) return;
        setError(e?.message || 'Failed to download excel invoice.');
        setLoading(false);
      }
    };

    run();
    return () => {
      isActive = false;
    };
  }, [id, navigate, state?.invoiceNo, state?.shipment?.ldp, state?.shipment?.ldpInvoiceNo]);

  return (
    <Box sx={{ p: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={22} />
          <Typography>Generating Excel…</Typography>
        </Box>
      ) : null}
      {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
    </Box>
  );
}

