import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  MenuItem,
  Container,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { paths } from 'src/routes/paths';

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

// Old AMS InquiryAdd.aspx.vb — Page_Load UserId = 28
const getUserId = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('userId');
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
};

/** UserId = 28 → hide Delivery Date + Order Qty (Page_Load L33–43) */
const isUserId28 = () => getUserId() === 28;

const AddInquiry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purple = '#3b2a64';
  const editId = searchParams.get('id');
  const isEditMode = Boolean(editId);

  // InquiryAdd.aspx.vb Page_Load: UserId = 28 hides Delivery Date + Order Qty
  const hideDeliveryAndOrderQty = isUserId28();

  const [loadingInquiry, setLoadingInquiry] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [customer, setCustomer] = useState('');
  const [supplier, setSupplier] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [inquiryType, setInquiryType] = useState('');
  const [customerInquiryDate, setCustomerInquiryDate] = useState('');
  const [sampleNo, setSampleNo] = useState('');
  const [creationDate, setCreationDate] = useState('');
  const [factoryDelDate, setFactoryDelDate] = useState('');
  const [factoryHandoverDate, setFactoryHandoverDate] = useState('');
  const [customerDelDate, setCustomerDelDate] = useState('');
  const [status, setStatus] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [style, setStyle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [fabric, setFabric] = useState('');
  const [fabricOptions, setFabricOptions] = useState([]);
  const [fabricWash, setFabricWash] = useState('');
  const [color, setColor] = useState('');
  const [fobPrice, setFobPrice] = useState('');
  const [inquiryQty, setInquiryQty] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [gsm, setGsm] = useState('');
  const [orderQtys, setOrderQtys] = useState('');
  const [size, setSize] = useState('');
  const [ldbPrice, setLdbPrice] = useState('');
  const [details, setDetails] = useState([]);
  const [editingDetailIndex, setEditingDetailIndex] = useState(null);

  // 🔹 Each field supports multiple images
  const [images, setImages] = useState({
    front: [],
    back: [],
    img1: [],
    img2: [],
  });

  // 🔹 Handle multiple uploads
  const handleUpload = (key, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newFiles = files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      setImages((prev) => ({
        ...prev,
        [key]: [...prev[key], ...newFiles],
      }));
    }
  };

  // 🔹 Remove single image
  const handleRemove = (key, index) => {
    setImages((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!isEditMode) {
      alert('Form Saved (API later)');
      return;
    }

    if (loadingInquiry) {
      return;
    }

    (async () => {
      try {
        setLoadingInquiry(true);
        setLoadError('');

        const token = localStorage.getItem('accessToken');
        const payload = {
          inquiryMstID: Number(editId),
          sampleNo,
          supplierID: Number(supplier) || 0,
          customerID: Number(customer) || 0,
          inquiryTypeID: Number(inquiryType) || 0,
          style,
          itemDesc,
          content,
          status,
          comment: '',
          remarks: '',
          inquiryDate: toIsoDateTime(customerInquiryDate),
          createDate: toIsoDateTime(creationDate),
          dueDate: toIsoDateTime(factoryDelDate),
          dispatchDate: toIsoDateTime(customerDelDate),
          dispatchDate2: toIsoDateTime(dispatchDate),
          factoryHOD: toIsoDateTime(factoryHandoverDate),
          details: details.map((row) => ({
            fabricID: Number(row?.fabricID) || 0,
            gsm: row?.gsm ?? '',
            qty: row?.qty ?? '',
            color: row?.color ?? '',
            price: row?.price ?? '',
            fabricWash: row?.fabricWash ?? '',
            size: row?.size ?? '',
            orderQty: row?.orderQty ?? '',
            ldbPrice: row?.ldbPrice ?? '',
            deliveryDate: row?.deliveryDate ? toIsoDateTime(row?.deliveryDate) : null,
          })),
        };

        console.log('=== ACTUAL PUT BODY ===', JSON.stringify(payload, null, 2));
        console.log('=== DETAILS ===', payload.details);

        const response = await fetch(`${API_BASE_URL}/api/MerchantInquiry/UpdateInquiry`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let message = 'Failed to update inquiry.';
          try {
            const errorText = await response.text();
            console.error('=== UpdateInquiry API ERROR ===');
            console.error('Status:', response.status);
            console.error('Response:', errorText);
            if (errorText) {
              try {
                const errorData = JSON.parse(errorText);
                message =
                  errorData?.message ||
                  errorData?.Message ||
                  errorData?.error ||
                  errorData?.Error ||
                  errorData?.title ||
                  message;
              } catch (parseError) {
                message = errorText;
              }
            }
          } catch (error) {
            // ignore parse failures
          }
          throw new Error(message);
        }

        alert('Inquiry updated successfully.');
        navigate(paths.dashboard.supplyChain.merchantInquiry);
      } catch (error) {
        const message = error?.message || 'Failed to update inquiry.';
        setLoadError(message);
        alert(message);
      } finally {
        setLoadingInquiry(false);
      }
    })();
  };

  const resetDetailFields = () => {
    setFabric('');
    setFabricWash('');
    setColor('');
    setFobPrice('');
    setInquiryQty('');
    setDeliveryDate('');
    setGsm('');
    setOrderQtys('');
    setSize('');
  };

  const handleAddDetail = () => {
    const selectedFabric = activeFabricOptions.find(
      (option) =>
        String(option.FabricTypeID ?? option.fabricTypeID ?? '') === String(fabric)
    );

    const detailRow = {
      inquiryDtlID:
        editingDetailIndex != null ? details[editingDetailIndex]?.inquiryDtlID ?? '' : '',
      inquiryMstID:
        editingDetailIndex != null ? details[editingDetailIndex]?.inquiryMstID ?? '' : '',
      fabricID: editingDetailIndex != null ? details[editingDetailIndex]?.fabricID ?? '' : Number(fabric) || 0,
      fabricType:
        editingDetailIndex != null
          ? details[editingDetailIndex]?.fabricType ?? ''
          : selectedFabric?.FabricType ?? selectedFabric?.fabricType ?? '',
      color,
      gsm,
      qty: inquiryQty,
      orderQty: orderQtys,
      deliveryDate,
      price: fobPrice,
      fabricWash,
      size,
      ldbPrice,
    };

    if (editingDetailIndex != null) {
      setDetails((prev) =>
        prev.map((row, index) =>
          index === editingDetailIndex
            ? {
                ...row,
                ...detailRow,
              }
            : row
        )
      );
      setEditingDetailIndex(null);
    } else {
      setDetails((prev) => [...prev, detailRow]);
    }

    resetDetailFields();
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const inquiryTypeOptions = useMemo(
    () => [
      { id: 1, label: 'Order' },
      { id: 2, label: 'Inquiry' },
      { id: 3, label: 'Repeat' },
      { id: 4, label: 'New Development' },
    ],
    []
  );

  const activeFabricOptions = useMemo(
    () =>
      fabricOptions.filter(
        (option) => String(option?.IsActive ?? option?.isActive ?? '1') !== '0'
      ),
    [fabricOptions]
  );

  const formatDateToInput = (value) => {
    if (!value) return '';
    const raw = String(value).trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const dmyMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    return raw;
  };

  const toIsoDateTime = (value) => {
    const dateValue = formatDateToInput(value);
    return dateValue ? `${dateValue}T00:00:00` : null;
  };

  const imageButtonColors = {
    front: '#000000',
    back: '#000000',
    img1: '#000000',
    img2: '#000000',
  };

  const detailsRows = useMemo(
    () =>
      (Array.isArray(details) ? details : []).map((row, index) => ({
        ...row,
        id: row?.inquiryDtlID ?? row?.fabricID ?? index,
        fabricDisplay:
          row?.fabricType ||
          activeFabricOptions.find(
            (option) =>
              String(option?.FabricTypeID ?? option?.fabricTypeID ?? '') ===
              String(row?.fabricID ?? '')
          )?.FabricType ||
          activeFabricOptions.find(
            (option) =>
              String(option?.FabricTypeID ?? option?.fabricTypeID ?? '') ===
              String(row?.fabricID ?? '')
          )?.fabricType ||
          row?.fabricID ||
          '',
      })),
    [details, activeFabricOptions]
  );

  const handleEditDetail = useCallback((row) => {
    const index = details.findIndex(
      (detail) => String(detail?.id ?? detail?.inquiryDtlID ?? detail?.fabricID) === String(row?.id)
    );
    if (index < 0) return;

    const detail = details[index];
    setEditingDetailIndex(index);
    setFabric(detail.fabricType ?? '');
    setFabricWash(detail.fabricWash ?? '');
    setColor(detail.color ?? '');
    setFobPrice(detail.price ?? '');
    setInquiryQty(detail.qty ?? '');
    setDeliveryDate(detail.deliveryDate ?? '');
    setGsm(detail.gsm ?? '');
    setOrderQtys(detail.orderQty ?? '');
    setSize(detail.size ?? '');
  }, [details]);

  const handleLdbPriceChange = useCallback((rowId, value) => {
    setDetails((prev) =>
      prev.map((row, index) =>
        String(row?.id ?? row?.inquiryDtlID ?? row?.fabricID ?? index) === String(rowId)
          ? {
              ...row,
              ldbPrice: value,
            }
          : row
      )
    );
  }, []);

  useEffect(() => {
    if (!API_BASE_URL) return undefined;

    const controller = new AbortController();

    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/api/MerchantInquiry/FabricDD`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`FabricDD ${response.status}`);
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : data ? [data] : [];
        setFabricOptions(list);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('[AddInquiry] FabricDD load failed', error);
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!API_BASE_URL) return undefined;

    const controller = new AbortController();

    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const [customerRes, supplierRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/MyOrders/GetCustomer`, {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${API_BASE_URL}/api/MyOrders/GetSupplier`, {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
        ]);

        if (customerRes.ok) {
          const customerData = await customerRes.json();
          const list = Array.isArray(customerData) ? customerData : customerData ? [customerData] : [];
          setCustomerOptions(list);
        }

        if (supplierRes.ok) {
          const supplierData = await supplierRes.json();
          const list = Array.isArray(supplierData) ? supplierData : supplierData ? [supplierData] : [];
          setSupplierOptions(list);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('[AddInquiry] dropdown load failed', error);
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isEditMode || !API_BASE_URL || !editId) return undefined;

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingInquiry(true);
        setLoadError('');
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          `${API_BASE_URL}/api/MerchantInquiry/GetInquiryById/${encodeURIComponent(editId)}`,
          {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!response.ok) {
          throw new Error(`GetInquiryById ${response.status}`);
        }

        const data = await response.json();
        console.log('Edit Inquiry API response:', data);
        console.log('Edit Inquiry Details:', data?.Details);
        if (!data) return;

        setCustomer(data.CustomerID ?? '');
        setSupplier(data.SupplierID ?? '');
        setInquiryType(data.InquiryTypeID ?? '');
        setCustomerInquiryDate(formatDateToInput(data.InquiryDate));
        setSampleNo(data.SampleNo ?? '');
        setCreationDate(formatDateToInput(data.CreateDate));
        setFactoryDelDate(formatDateToInput(data.DueDate));
        setFactoryHandoverDate(formatDateToInput(data.FactoryHOD));
        setCustomerDelDate(formatDateToInput(data.DispatchDate));
        setStatus(data.Status ?? '');
        setDispatchDate(formatDateToInput(data.DispatchDate2));
        setItemDesc(data.ItemDesc ?? '');
        setStyle(data.Style ?? '');
        setContent(data.Content ?? '');
        setCategory(data.Category ?? '');
        setFabric(data.fabricID ?? data.FabricTypeID ?? data.Fabric ?? '');
        setFabricWash(data.FabricWash ?? '');
        setColor(data.Color ?? '');
        setFobPrice(data.FobPrice ?? '');
        setInquiryQty(data.InquiryQty ?? '');
        setDeliveryDate(formatDateToInput(data.DeliveryDate));
        setGsm(data.GSM ?? '');
        setOrderQtys(data.OrderQtys ?? '');
        setSize(data.Size ?? '');

        setDetails(
          Array.isArray(data.Details)
            ? data.Details.map((row, index) => ({
                id: row.inquiryDtlID ?? row.fabricID ?? index,
                inquiryDtlID: row.inquiryDtlID ?? '',
                inquiryMstID: row.inquiryMstID ?? '',
                fabricID: row.fabricID ?? '',
                fabricType: row.fabricType ?? '',
                gsm: row.gsm ?? '',
                qty: row.qty ?? '',
                color: row.color ?? '',
                price: row.price ?? '',
                fabricWash: row.fabricWash ?? '',
                size: row.size ?? '',
                orderQty: row.orderQty ?? '',
                ldbPrice: row.ldbPrice ?? '',
                deliveryDate: formatDateToInput(row.deliveryDate),
              }))
            : []
        );

        setImages({
          front: data.FileName ? [{ name: data.FileName, url: data.FileName }] : [],
          back: data.FileNameBack ? [{ name: data.FileNameBack, url: data.FileNameBack }] : [],
          img1: data.FileName1 ? [{ name: data.FileName1, url: data.FileName1 }] : [],
          img2: data.FileName2 ? [{ name: data.FileName2, url: data.FileName2 }] : [],
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(error?.message || 'Failed to load inquiry');
      } finally {
        if (!controller.signal.aborted) setLoadingInquiry(false);
      }
    })();

    return () => controller.abort();
  }, [API_BASE_URL, editId, isEditMode]);

  // 🔹 Reusable Image Upload Component
  const renderImageUpload = (label, key) => (
    <Grid item xs={12} md={6}>
      <Typography sx={{ fontWeight: 'bold', mb: 1 }}>{label}</Typography>
      <Button
        component="label"
        variant="contained"
        fullWidth
        sx={{
          mb: 2,
          backgroundColor: imageButtonColors[key],
          '&:hover': { backgroundColor: purple },
        }}
      >
        Upload Images
        <input
          type="file"
          multiple
          hidden
          accept="image/*"
          onChange={(e) => handleUpload(key, e)}
        />
      </Button>

      {/* Thumbnails */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {images[key].map((img, index) => (
          <Box
            key={index}
            sx={{
              position: 'relative',
              width: 90,
              height: 90,
              borderRadius: 2,
              overflow: 'hidden',
              border: '2px solid #ddd',
            }}
          >
            <img
              src={img.url}
              alt={img.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                '&:hover': { background: 'rgba(0,0,0,0.8)' },
              }}
              onClick={() => handleRemove(key, index)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: purple }}>
          INQUIRY
        </Typography>

        <Grid container spacing={2}>
          {/* Row 1 */}
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Customer Inquiry Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={customerInquiryDate}
          onChange={(e) => setCustomerInquiryDate(e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Inquiry Type"
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
            >
              {inquiryTypeOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
      </Grid>
      <Grid item xs={12} md={4}>
            <TextField fullWidth label="Sample No#" value={sampleNo} onChange={(e) => setSampleNo(e.target.value)} />
      </Grid>

          {/* Row 2 */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Creation Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={creationDate}
              onChange={(e) => setCreationDate(e.target.value)}
            />
          </Grid>

          {/* Customer dropdown */}
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            >
              {customerOptions.map((option) => (
                <MenuItem
                  key={option.customerID ?? option.customerId ?? option.CustomerID ?? option.id}
                  value={option.customerID ?? option.customerId ?? option.CustomerID ?? option.id ?? ''}
                >
                  {option.customerName ?? option.CustomerName ?? option.name ?? option.label ?? ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Factory Del. Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={factoryDelDate}
              onChange={(e) => setFactoryDelDate(e.target.value)}
            />
          </Grid>

          {/* Row 3 */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Factory Handover Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={factoryHandoverDate}
              onChange={(e) => setFactoryHandoverDate(e.target.value)}
            />
          </Grid>

          {/* Supplier dropdown */}
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            >
              {supplierOptions.map((option) => (
                <MenuItem
                  key={option.venderLibraryID ?? option.venderLibraryId ?? option.VenderLibraryID ?? option.id}
                  value={option.venderLibraryID ?? option.venderLibraryId ?? option.VenderLibraryID ?? option.id ?? ''}
                >
                  {option.venderName ?? option.VenderName ?? option.vendorName ?? option.label ?? ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Customer Del. Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={customerDelDate}
              onChange={(e) => setCustomerDelDate(e.target.value)}
            />
          </Grid>

          {/* Row 4 */}
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Status" value={status} onChange={(e) => setStatus(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Dispatch Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dispatchDate}
              onChange={(e) => setDispatchDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Item Desc." value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} />
          </Grid>

          {/* Row 5 */}
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Style" value={style} onChange={(e) => setStyle(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Content" value={content} onChange={(e) => setContent(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </Grid>

          {/* 🔹 Image Upload Rows (2 per row) */}
          {renderImageUpload('Front Image', 'front')}
          {renderImageUpload('Back Image', 'back')}
          {renderImageUpload('Image 1', 'img1')}
          {renderImageUpload('Image 2', 'img2')}

          {/* Fabric & Other Info */}
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Fabric"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              SelectProps={{
                MenuProps: {
                  disableAutoFocusItem: true,
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  PaperProps: {
  sx: {
    maxHeight: 220,
    width: '220px',
    maxWidth: 'none',
  },
                  },
                },
              }}
            >
              {activeFabricOptions.map((option) => {
                const value = option.FabricTypeID ?? option.fabricTypeID ?? '';
                const label = option.FabricType ?? option.fabricType ?? '';
                return (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Fabric Wash" value={fabricWash} onChange={(e) => setFabricWash(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Color" value={color} onChange={(e) => setColor(e.target.value)} />
          </Grid>

          {/* Row */}
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Fob Price" value={fobPrice} onChange={(e) => setFobPrice(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Inquiry Qty" value={inquiryQty} onChange={(e) => setInquiryQty(e.target.value)} />
          </Grid>
          {!hideDeliveryAndOrderQty && (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Delivery Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </Grid>
          )}

          <Grid item xs={12} md={4}>
            <TextField fullWidth label="GSM" value={gsm} onChange={(e) => setGsm(e.target.value)} />
          </Grid>
          {!hideDeliveryAndOrderQty && (
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Order Qtys" value={orderQtys} onChange={(e) => setOrderQtys(e.target.value)} />
            </Grid>
          )}
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Size" value={size} onChange={(e) => setSize(e.target.value)} />
          </Grid>

          {/* Add Button */}
          <Grid item xs={12} md={12} sx={{ textAlign: 'right', mt: 0 }}>
            <Button
              variant="contained"
              onClick={handleAddDetail}
              sx={{
                backgroundColor: '#000000',
                width: 120,
                '&:hover': { backgroundColor: '#111111' },
              }}
            >
              ADD
            </Button>
          </Grid>

          <Grid item xs={12} md={12}>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fabric</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell>GSM</TableCell>
                    <TableCell>Inquiry Qty</TableCell>
                    <TableCell>Order Qty</TableCell>
                    <TableCell>Delivery Date</TableCell>
                    <TableCell>FOB Price</TableCell>
                    <TableCell>Fabric Wash</TableCell>
                    <TableCell>Size</TableCell>
                      <TableCell>LDP.Price</TableCell>
                      <TableCell>Edit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                  {detailsRows.length ? (
                    detailsRows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.fabricDisplay}</TableCell>
                        <TableCell>{row.color}</TableCell>
                        <TableCell>{row.gsm}</TableCell>
                        <TableCell>{row.qty}</TableCell>
                        <TableCell>{row.orderQty}</TableCell>
                        <TableCell>{row.deliveryDate}</TableCell>
                        <TableCell>{row.price}</TableCell>
                        <TableCell>{row.fabricWash}</TableCell>
                        <TableCell>{row.size}</TableCell>
                        <TableCell>
                          <TextField
                            variant="standard"
                            value={row.ldbPrice ?? ''}
                            onChange={(e) => handleLdbPriceChange(row.id, e.target.value)}
                            InputProps={{
                              disableUnderline: true,
                            }}
                            sx={{
                              width: '100%',
                              '& .MuiInputBase-input': {
                                p: 0,
                                fontSize: 'inherit',
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="text" sx={{ color: purple }} onClick={() => handleEditDetail(row)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        No details found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Buttons */}
          <Grid item xs={12} md={12} sx={{ textAlign: 'right', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loadingInquiry}
              sx={{
                backgroundColor: '#000000',
                mr: 2,
                width: 120,
                '&:hover': { backgroundColor: '#111111' },
              }}
            >
              Save
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleCancel}
              sx={{
                backgroundColor: '#000000',
                width: 120,
                '&:hover': { backgroundColor: '#111111' },
              }}
            >
              Cancel
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AddInquiry;
