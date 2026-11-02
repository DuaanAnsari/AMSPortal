import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Container,
  CircularProgress,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Autocomplete,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { paths } from 'src/routes/paths';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import axios from 'src/utils/axios';
import { pdf, Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';

// ----------------------------------------------------------------------

const PO_OPTION_LIMIT = 200;

function filterPoOptions(options, state) {
  const input = String(state?.inputValue || '').trim().toLowerCase();
  const matched = input
    ? options.filter((o) => String(o.label || '').toLowerCase().includes(input))
    : options;
  return matched.slice(0, PO_OPTION_LIMIT);
}

function normalizeKeys(item) {
  const out = {};
  if (item && typeof item === 'object') {
    Object.keys(item).forEach((key) => {
      out[key.toLowerCase()] = item[key];
    });
  }
  return out;
}

function sniffBase64Mime(raw) {
  const s = String(raw || '').trim();
  if (s.startsWith('/9j/')) return 'image/jpeg';
  if (s.startsWith('iVBOR')) return 'image/png';
  if (s.startsWith('R0lGOD')) return 'image/gif';
  if (s.startsWith('UklGR')) return 'image/webp';
  if (s.startsWith('Qk')) return 'image/bmp';
  return 'image/png';
}

function toDataUrl(raw) {
  if (raw == null || raw === '' || raw === '0x') return '';
  let s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  // Strip surrounding quotes or stray JSON stringification
  s = s.replace(/^"+|"+$/g, '').trim();
  if (!s) return '';
  if (/^data:image\//i.test(s)) return s;
  if (s.startsWith('blob:') || /^https?:\/\//i.test(s)) return s;

  // Clean whitespace / line breaks
  const clean = s.replace(/\s+/g, '');
  const mime = sniffBase64Mime(clean);
  return `data:${mime};base64,${clean}`;
}

const LABELS_PER_PAGE = 24;

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 18,
    paddingRight: 18,
    fontFamily: 'Roboto',
    fontSize: 8,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#DFE3E8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 11, fontWeight: 700, color: '#1E293B' },
  headerSub: { fontSize: 8, color: '#637381' },
  labelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  labelBox: {
    width: '25%', // 4 columns x 6 rows = 24 per page
    height: 122,
    padding: 3,
    borderWidth: 0.75,
    borderStyle: 'solid',
    borderColor: '#000000',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  topText: {
    fontSize: 7.5,
    fontWeight: 700,
    textAlign: 'center',
    maxLines: 1,
    overflow: 'hidden',
    paddingHorizontal: 1,
  },
  middleRow: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  sideZoneLeft: {
    width: 24,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sideZoneRight: {
    width: 24,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sideRotatedText: {
    fontSize: 6,
    fontWeight: 700,
    textAlign: 'center',
    width: 65,
    transform: 'rotate(-90deg)',
    maxLines: 1,
    overflow: 'hidden',
  },
  qrCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  qrImage: {
    width: 58,
    height: 58,
    objectFit: 'contain',
  },
  qrFallbackBox: {
    width: 58,
    height: 58,
    borderWidth: 0.5,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFallbackText: {
    fontSize: 6,
    color: '#94A3B8',
    textAlign: 'center',
  },
  bottomText: {
    fontSize: 7,
    fontWeight: 700,
    textAlign: 'center',
    maxLines: 1,
    overflow: 'hidden',
    paddingHorizontal: 1,
  },
  cartonFooter: {
    fontSize: 6,
    color: '#637381',
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 1,
  },
});

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

function truncateText(str, max = 22) {
  const s = String(str || '').trim();
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function QRLabelPDF({ poNo, customerName, labels }) {
  const pages = chunk(labels, LABELS_PER_PAGE);
  return (
    <Document title={poNo ? `QR Code — ${poNo}` : 'QR Code Labels'}>
      {pages.map((pageLabels, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>QR Code — {poNo}</Text>
            <Text style={styles.headerSub}>
              {customerName ? `${customerName}  |  ` : ''}Page {pageIdx + 1} of {pages.length}
            </Text>
          </View>
          <View style={styles.labelGrid}>
            {pageLabels.map((label, i) => (
              <View key={i} style={styles.labelBox}>
                {/* TOP: Size */}
                <Text style={styles.topText}>{label.size || '-'}</Text>

                {/* MIDDLE ROW: Left = QRCodePOD, Center = QR Image, Right = Colorway */}
                <View style={styles.middleRow}>
                  {/* LEFT: QRCodePOD (Rotated, partial/truncated) */}
                  <View style={styles.sideZoneLeft}>
                    <Text style={styles.sideRotatedText}>
                      {truncateText(label.qrCodePOD || label.poNo, 20)}
                    </Text>
                  </View>

                  {/* CENTER: QR Image */}
                  <View style={styles.qrCenter}>
                    {label.qrDataUrl ? (
                      <Image src={label.qrDataUrl} style={styles.qrImage} />
                    ) : (
                      <View style={styles.qrFallbackBox}>
                        <Text style={styles.qrFallbackText}>NO QR</Text>
                      </View>
                    )}
                  </View>

                  {/* RIGHT: Colorway (Rotated) */}
                  <View style={styles.sideZoneRight}>
                    <Text style={styles.sideRotatedText}>
                      {truncateText(label.colorway, 16)}
                    </Text>
                  </View>
                </View>

                {/* BOTTOM: StyleNo */}
                <Text style={styles.bottomText}>{label.styleNo || '-'}</Text>

                {/* Carton Index Indicator */}
                <Text style={styles.cartonFooter}>
                  Ctn {label.cartonIndex}/{label.totalCartons}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
}

QRLabelPDF.propTypes = {
  poNo: PropTypes.string,
  customerName: PropTypes.string,
  labels: PropTypes.array,
};

// ----------------------------------------------------------------------

export default function QRCodeEntryPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

  const [poOptions, setPoOptions] = useState([]);
  const [poLoaded, setPoLoaded] = useState(false);
  const [poLoading, setPoLoading] = useState(false);
  const [selectedPoIds, setSelectedPoIds] = useState([]);
  const [rows, setRows] = useState([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [printing, setPrinting] = useState(false);
  const tableContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const selectedPoIdsSet = useMemo(() => new Set(selectedPoIds), [selectedPoIds]);

  const selectedPoValues = useMemo(
    () => poOptions.filter((o) => selectedPoIdsSet.has(o.value)),
    [poOptions, selectedPoIdsSet]
  );

  const selectedPoLabels = useMemo(
    () => selectedPoValues.map((o) => o.label),
    [selectedPoValues]
  );

  const loadPoNos = useCallback(async () => {
    if (poLoaded || poLoading) return;
    setPoLoading(true);
    setFetchError('');
    try {
      const res = await axios.get(`${baseUrl}/api/QRCodeGenerate/GetPONO`);
      const raw = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.Data || res.data?.result || res.data?.Result || [];
      setPoOptions(
        raw.map((item) => ({
          label: String(item.PONO ?? item.pono ?? item.poNo ?? item.label ?? ''),
          value: String(item.POID ?? item.poid ?? item.poId ?? item.id ?? item.value ?? ''),
        }))
      );
      setPoLoaded(true);
    } catch (err) {
      console.error('GetPONO failed:', err);
      setFetchError('Failed to load PO list');
    } finally {
      setPoLoading(false);
    }
  }, [baseUrl, poLoaded, poLoading]);

  useEffect(() => {
    if (selectedPoIds.length === 0) {
      setRows([]);
      return () => {};
    }

    let active = true;
    const loadGrid = async () => {
      setGridLoading(true);
      setFetchError('');
      try {
        const res = await axios.get(`${baseUrl}/api/QRCodeGenerate/GetQRCodeData`, {
          params: { poIds: selectedPoIds.join(',') },
        });
        const raw = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.Data || res.data?.result || res.data?.Result || [];
        if (!active) return;
        setRows(
          raw.map((item, idx) => {
            const d = normalizeKeys(item);
            return {
              id: idx + 1,
              poId: d.poid ?? d.po_id ?? '',
              poDetailId: d.podetailid ?? d.po_detail_id ?? '',
              customerName: d.customername ?? '',
              venderName: d.vendername ?? '',
              poNo: d.pono ?? d.po_no ?? '',
              shipmentDate: d.tolerance ?? d.shipmentdate ?? '',
              assortment: d.assortment ?? '',
              styleNo: d.styleno ?? d.style_no ?? '',
              colorway: d.colorway ?? '',
              size: d.size ?? '',
              quantity: d.quantity ?? '',
              cartonPerPcs: d.cartonperpcs ?? d.carton_per_pcs ?? '',
              orderType: d.ordertype ?? d.order_type ?? '',
              cartonQty: '',
            };
          })
        );
      } catch (err) {
        if (!active) return;
        console.error('GetQRCodeData failed:', err);
        setFetchError('Failed to load QR Code data');
      } finally {
        if (active) setGridLoading(false);
      }
    };
    loadGrid();
    return () => {
      active = false;
    };
  }, [selectedPoIds, baseUrl]);

  const handleGridMouseDown = (e) => {
    if (e.button !== 0) return;
    const interactive = e.target.closest('button, a, input, [role="button"], .MuiButtonBase-root');
    if (interactive) return;
    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeftState(tableContainerRef.current.scrollLeft);
  };
  const handleGridMouseLeave = () => setIsDragging(false);
  const handleGridMouseUp = () => setIsDragging(false);
  const handleGridMouseMove = (e) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleCartonQtyChange = (rowId, value) => {
    const sanitized = String(value).replace(/[^0-9]/g, '');
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, cartonQty: sanitized } : r)));
  };

  const handlePrint = async () => {
    if (selectedPoIds.length === 0) {
      enqueueSnackbar('Please select a PO # first', { variant: 'warning' });
      return;
    }

    const validRows = rows.filter((r) => Number(r.cartonQty) > 0);
    if (validRows.length === 0) {
      enqueueSnackbar('Please enter Carton Qty for at least one row', { variant: 'warning' });
      return;
    }

    setPrinting(true);
    try {
      const printRows = validRows.map((r) => ({
        poDetailID: Number(r.poDetailId) || 0,
        poid: Number(r.poId) || 0,
        orderType: r.orderType || '',
        cartonQty: Number(r.cartonQty),
      }));

      const res = await axios.post(`${baseUrl}/api/QRCodeGenerate/PrintQRCode`, { rows: printRows });

      let raw = res.data;
      if (typeof raw === 'string') {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
          throw new Error(raw || 'Failed to generate QR Code PDF');
        }
      }
      if (raw && !Array.isArray(raw)) {
        raw = raw.data || raw.Data || raw.result || raw.Result || raw.rows || raw.Rows;
      }
      if (!Array.isArray(raw)) raw = raw ? [raw] : [];

      if (raw.length === 0) {
        throw new Error('No QR code records found');
      }

      const labels = [];
      raw.forEach((item) => {
        const d = normalizeKeys(item);
        // Correctly read qrImgBase64 or fallback aliases
        const rawQr =
          d.qrimgbase64 ??
          d.qrimagebase64 ??
          d.qrimgpod ??
          d.qrimgpo ??
          d.qrimgpomix ??
          d.qrimage ??
          d.qrcode ??
          d.qr ??
          d.qrimg ??
          '';
        const qrDataUrl = toDataUrl(rawQr);

        const match = validRows.find(
          (r) =>
            Number(r.poDetailId) === Number(d.podetailid ?? d.po_detail_id) &&
            Number(r.poId) === Number(d.poid ?? d.po_id)
        );

        // Exact 4-side mapping — read ONLY from the API response, never grid fields.
        const size = String(d.size ?? d.sizename ?? '');
        const style = String(d.style ?? d.styleno ?? d.style_no ?? '');
        const pono = String(d.pono ?? d.customerorder ?? d.po_no ?? d.po ?? '');
        const colorName = String(d.colorname ?? d.colorway ?? '');

        const indexVal = Number(d.index ?? d.numbers ?? d.cartonindex ?? d.cartonn ?? d.cartonserial);
        const hasIndex = Number.isFinite(indexVal) && indexVal > 0;

        if (hasIndex) {
          labels.push({
            qrDataUrl,
            size,
            style,
            pono,
            colorName,
            cartonIndex: indexVal,
            totalCartons: Number(d.cartonqty ?? d.carton_qty) || 1,
          });
          return;
        }

        let total = Number(d.cartonqty ?? d.carton_qty);
        if (!Number.isFinite(total) || total <= 0) {
          total = Number(match?.cartonQty) || 1;
        }
        for (let i = 1; i <= total; i += 1) {
          labels.push({
            qrDataUrl,
            size,
            style,
            pono,
            colorName,
            cartonIndex: i,
            totalCartons: total,
          });
        }
      });

      if (labels.length === 0) {
        throw new Error('No QR labels generated');
      }

      navigate(paths.dashboard.powerTool.qrCodePdf, {
        state: {
          poNo: selectedPoLabels.join(', '),
          customerName: validRows[0]?.customerName || '',
          labels,
        },
      });

      enqueueSnackbar('QR Code PDF generated successfully!', { variant: 'success' });
    } catch (err) {
      let message = 'Failed to generate QR Code PDF';
      if (typeof err === 'string' && err) {
        message = err;
      } else if (err && typeof err === 'object') {
        message = err.message || err.Message || err.error || err.title || err.detail || message;
      }
      console.error('PrintQRCode failed:', err);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setPrinting(false);
    }
  };

  const renderGridBody = () => {
    if (gridLoading) {
      return (
        <TableRow>
          <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
            <CircularProgress size={24} />
          </TableCell>
        </TableRow>
      );
    }

    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
            {selectedPoIds.length === 0 ? 'Select a PO # to load data' : 'No data found'}
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((row) => (
      <TableRow key={row.id}>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.customerName}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.poNo}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.shipmentDate}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.assortment}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.styleNo}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.colorway}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.size}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center' }}>{row.quantity}</TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <TextField
            size="small"
            value={row.cartonQty}
            onChange={(e) => handleCartonQtyChange(row.id, e.target.value)}
            placeholder="0"
            inputProps={{ style: { textAlign: 'center' } }}
            sx={{ backgroundColor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
          />
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading="QR Code Entry"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Power Tools', href: paths.dashboard.powerTool.root },
          { name: 'QR Code Entry' },
        ]}
      />

      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" sx={{ color: 'gray', mb: 0.5, fontWeight: 500 }}>
                PO #
              </Typography>
              <Autocomplete
                multiple
                fullWidth
                size="small"
                loading={poLoading}
                onOpen={loadPoNos}
                options={poOptions}
                value={selectedPoValues}
                onChange={(e, newValue) => setSelectedPoIds(newValue.map((o) => o.value))}
                filterOptions={filterPoOptions}
                filterSelectedOptions
                disableCloseOnSelect
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                      checkedIcon={<CheckBoxIcon fontSize="small" />}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.label}
                  </li>
                )}
                renderTags={() => (
                  <Typography
                    variant="body2"
                    sx={{ pl: 1, color: 'text.secondary', whiteSpace: 'nowrap' }}
                  >
                    {selectedPoIds.length === 0
                      ? ''
                      : `${selectedPoIds.length} ${selectedPoIds.length === 1 ? 'item' : 'items'} selected`}
                  </Typography>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={selectedPoIds.length === 0 ? 'Select PO #' : ''}
                    sx={{ backgroundColor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4} />

            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={printing ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:printer-minimalistic-bold" />}
                disabled={printing}
                onClick={handlePrint}
                sx={{
                  height: '40px',
                  borderRadius: 0,
                  backgroundColor: 'black',
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#212B36' },
                }}
              >
                Print
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            {fetchError && (
              <Box
                sx={{
                  mb: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  border: '0.5px solid #e0e6f0',
                  backgroundColor: '#f5fefb',
                }}
              >
                <Typography variant="body2" color="error">
                  {fetchError}
                </Typography>
              </Box>
            )}
            <TableContainer
              ref={tableContainerRef}
              component={Paper}
              variant="outlined"
              onMouseDown={handleGridMouseDown}
              onMouseLeave={handleGridMouseLeave}
              onMouseUp={handleGridMouseUp}
              onMouseMove={handleGridMouseMove}
              sx={{
                maxHeight: 540,
                borderRadius: 1.5,
                overflowX: 'auto',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: isDragging ? 'none' : 'auto',
              }}
            >
              <Table size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    {[
                      'Customer',
                      'PO No.',
                      'Shipment Date',
                      'Assortment',
                      'Style #',
                      'Color',
                      'Size',
                      'PO Quantity',
                      'Carton Qty',
                    ].map((header) => (
                      <TableCell
                        key={header}
                        sx={{
                          fontWeight: 700,
                          backgroundColor: '#f5f5f5',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>{renderGridBody()}</TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
