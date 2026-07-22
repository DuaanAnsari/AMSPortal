import { useRef, useState, useEffect } from 'react';
import { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  Button,
  Container,
  CardContent,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  TableHead,
  Paper,
  Alert,
  Snackbar,
  IconButton,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import LoadingButton from '@mui/lab/LoadingButton';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// -------------------- Constants / Helpers --------------------
const STATUS_OPTIONS = ['Confirm', 'Cancel', 'Close'];

function mapApiStatusToOption(status) {
  if (status === undefined || status === null) return '';
  const s = String(status).trim().toLowerCase();
  if (!s) return '';

  // Must match Select MenuItem values: Confirmed | Cancel | Close
  if (s === 'confirm' || s === 'confirmed') return 'Confirmed';
  if (s === 'cancel' || s === 'cancelled' || s === 'canceled') return 'Cancel';
  if (s === 'close' || s === 'closed') return 'Close';

  // Fallback: show whatever API returned
  return String(status);
}

// Helper functions for safe data conversion (similar to Add-Order.jsx)
const safeParseInt = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const safeParseFloat = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Create axios instance with authorization header
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Add request interceptor to include authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// -------------------- Full Screen Image Preview Dialog --------------------
function FullScreenImagePreview({ open, imageUrl, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          margin: 0,
          borderRadius: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        },
      }}
    >
      <DialogContent
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: 0,
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
            zIndex: 1000,
          }}
        >
          <CloseIcon />
        </IconButton>

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Full screen preview"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
            onClick={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// -------------------- Reference & Attachment helpers (GetPOFiles URLs only) --------------------
function isValidPoAttachmentUrl(url) {
  const value = String(url ?? '').trim();
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}

const ATTACHMENT_IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;

function attachmentUrlPath(url) {
  try {
    return new URL(String(url)).pathname;
  } catch {
    return String(url).split('?')[0].split('#')[0];
  }
}

function isAttachmentImageValue(fileValue, isExistingAttachmentUrl) {
  if (fileValue instanceof File) {
    return (
      Boolean(fileValue.type?.startsWith('image/')) ||
      ATTACHMENT_IMAGE_EXT_RE.test(fileValue.name || '')
    );
  }
  if (isExistingAttachmentUrl) {
    const path = attachmentUrlPath(fileValue);
    return ATTACHMENT_IMAGE_EXT_RE.test(path);
  }
  return false;
}

function pickPoAttachmentUrl(url) {
  return isValidPoAttachmentUrl(url) ? String(url).trim() : null;
}

// -------------------- File Upload Component with Preview --------------------
function FileUploadWithPreview({ name, label, accept = "*/*" }) {
  const { setValue, watch } = useFormContext();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const fileValue = watch(name);

  const isExistingAttachmentUrl =
    typeof fileValue === 'string' && isValidPoAttachmentUrl(fileValue);
  const hasDisplayableFile = fileValue instanceof File || isExistingAttachmentUrl;

  /** null = probing, true = image, false = not an image */
  const [existingUrlImageResolved, setExistingUrlImageResolved] = useState(null);

  useEffect(() => {
    if (!isExistingAttachmentUrl) {
      setExistingUrlImageResolved(null);
      return undefined;
    }

    if (isAttachmentImageValue(fileValue, true)) {
      setExistingUrlImageResolved(true);
      return undefined;
    }

    let cancelled = false;
    setExistingUrlImageResolved(null);

    const img = new Image();
    img.onload = () => {
      if (!cancelled) setExistingUrlImageResolved(true);
    };
    img.onerror = () => {
      if (!cancelled) setExistingUrlImageResolved(false);
    };
    img.src = fileValue;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [fileValue, isExistingAttachmentUrl]);

  useEffect(() => {
    if (typeof fileValue === 'string' && !isValidPoAttachmentUrl(fileValue)) {
      setValue(name, null);
      return;
    }
    if (isExistingAttachmentUrl) {
      setPreviewUrl(fileValue);
    } else if (!fileValue || typeof fileValue === 'string') {
      setPreviewUrl('');
    }
  }, [fileValue, isExistingAttachmentUrl, name, setValue]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue(name, file, { shouldValidate: true });

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl('');
      }
    }
  };

  const handleRemoveFile = () => {
    setValue(name, null, { shouldValidate: true });
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseFullScreen = () => {
    setFullScreenOpen(false);
  };

  useEffect(() => {
    if (!hasDisplayableFile) {
      setPreviewUrl('');
    }
  }, [hasDisplayableFile]);

  const isString = isExistingAttachmentUrl;
  const fileNameStr = isString
    ? attachmentUrlPath(fileValue).toLowerCase()
    : (fileValue?.name || '').toLowerCase();

  const isImage =
    isAttachmentImageValue(fileValue, isExistingAttachmentUrl) ||
    (isExistingAttachmentUrl && existingUrlImageResolved === true);
  const isPDF = fileNameStr.endsWith('.pdf') || fileValue?.type === 'application/pdf';
  const isExcel = fileNameStr.match(/\.(xls|xlsx)$/) != null || fileValue?.type === 'application/vnd.ms-excel' || fileValue?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const isWord = fileNameStr.match(/\.(doc|docx)$/) != null || fileValue?.type === 'application/msword' || fileValue?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isProbingExistingImage = isExistingAttachmentUrl && existingUrlImageResolved === null;
  const isOtherFile =
    hasDisplayableFile && !isProbingExistingImage && !isImage && !isPDF && !isExcel && !isWord;

  const handlePreviewClick = () => {
    if (isImage) {
      setFullScreenOpen(true);
    } else {
      if (isExistingAttachmentUrl) {
        window.open(fileValue, '_blank');
      } else if (fileValue instanceof File) {
        const url = URL.createObjectURL(fileValue);
        window.open(url, '_blank');
      } else if (previewUrl && isValidPoAttachmentUrl(previewUrl)) {
        window.open(previewUrl, '_blank');
      }
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        component="label"
        fullWidth
        startIcon={<UploadFileIcon />}
      >
        {label}
        <input
          type="file"
          accept={accept}
          hidden
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </Button>

      {hasDisplayableFile && (
        <Box sx={{ mt: 1, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                {typeof fileValue === 'object' ? fileValue.name : 'Existing file'}
              </Typography>
              <Typography variant="caption" color="success.main">
                ✓ File selected
              </Typography>
            </Grid>
            <Grid item>
              <IconButton
                size="small"
                onClick={handleRemoveFile}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>

          {/* Image Preview */}
          {isImage && previewUrl && (
            <Box sx={{ mt: 2, textAlign: 'center', position: 'relative' }}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-block',
                  cursor: 'pointer',
                  '&:hover .preview-overlay': {
                    opacity: 1,
                  },
                }}
                onClick={handlePreviewClick}
              >
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                  onError={(e) => {
                    // fallback if image breaks
                    e.target.style.display = 'none';
                  }}
                />
                <Box
                  className="preview-overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    borderRadius: '4px',
                  }}
                >
                  <ZoomInIcon sx={{ color: 'white', fontSize: 40 }} />
                </Box>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                Click on image to view full screen
              </Typography>
            </Box>
          )}

          {/* PDF Preview Button */}
          {isPDF && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<ZoomInIcon />}
                onClick={handlePreviewClick}
                sx={{ textTransform: 'none' }}
              >
                Open PDF Preview
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                Click to view PDF in new tab
              </Typography>
            </Box>
          )}

          {/* Excel Preview Button */}
          {isExcel && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<ZoomInIcon />}
                onClick={handlePreviewClick}
                sx={{ textTransform: 'none' }}
              >
                Open Excel Preview
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                Click to view Excel in new tab
              </Typography>
            </Box>
          )}

          {/* Word Preview Button */}
          {isWord && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="info"
                size="small"
                startIcon={<UploadFileIcon />}
                onClick={handlePreviewClick}
                sx={{ textTransform: 'none' }}
              >
                Download Word File
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                Click to download and open Word document
              </Typography>
            </Box>
          )}

          {/* Other Files Preview Button */}
          {isOtherFile && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<ZoomInIcon />}
                onClick={handlePreviewClick}
                sx={{ textTransform: 'none' }}
              >
                Open File
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                Click to view file in new tab
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Full Screen Preview Dialog */}
      <FullScreenImagePreview
        open={fullScreenOpen}
        imageUrl={previewUrl}
        onClose={handleCloseFullScreen}
      />
    </Box>
  );
}

// -------------------- Simple Image Upload Component --------------------
function SimpleImageUploadField({ name, label = "Image" }) {
  const { setValue, watch } = useFormContext();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const imageValue = watch(name);

  // Derive display source dynamically
  let displaySrc = '';
  if (imageValue && typeof imageValue === 'object') {
    // New file selected
    displaySrc = previewUrl;
  } else if (typeof imageValue === 'string' && imageValue) {
    // Existing image string
    if (imageValue.startsWith('http') || imageValue.startsWith('data:')) {
      displaySrc = imageValue;
    } else {
      // Assume base64 and prepend data URI
      displaySrc = `data:image/png;base64,${imageValue}`;
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue(name, file, { shouldValidate: true });

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveImage = () => {
    setValue(name, null, { shouldValidate: true });
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreviewClick = () => {
    if (displaySrc) {
      setFullScreenOpen(true);
    }
  };

  const handleCloseFullScreen = () => {
    setFullScreenOpen(false);
  };

  // Reset local preview if value is cleared externally
  useEffect(() => {
    if (!imageValue) {
      setPreviewUrl('');
    }
  }, [imageValue]);

  return (
    <Box>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs>
          <TextField
            fullWidth
            disabled
            label={label}
            value={typeof imageValue === 'string' ? (imageValue ? 'Current Image' : '') : (imageValue?.name || '')}
            InputProps={{
              endAdornment: displaySrc && (
                <IconButton
                  size="small"
                  onClick={handleRemoveImage}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              ),
            }}
            helperText={imageValue ? 'File selected' : 'No image selected'}
          />
        </Grid>
        <Grid item>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            variant="contained"
            onClick={() => fileInputRef.current?.click()}
          >
            Select
          </Button>
        </Grid>
      </Grid>

      {displaySrc && (
        <Box sx={{ mt: 2, textAlign: 'center', position: 'relative' }}>
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              cursor: 'pointer',
              '&:hover .preview-overlay': {
                opacity: 1,
              },
            }}
            onClick={handlePreviewClick}
          >
            <img
              src={displaySrc}
              alt="Preview"
              style={{
                maxWidth: '200px',
                maxHeight: '200px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            <Box
              className="preview-overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                borderRadius: '4px',
              }}
            >
              <ZoomInIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Click on image to view full screen
          </Typography>
        </Box>
      )}

      <FullScreenImagePreview
        open={fullScreenOpen}
        imageUrl={displaySrc}
        onClose={handleCloseFullScreen}
      />
    </Box>
  );
}

// -------------------- Item Details Dialog Component --------------------
function ItemDetailsDialog({ open, onClose, onSaveData }) {
  const [totals, setTotals] = useState({
    totalQuantity: 0,
    totalValue: 0,
    totalLdpValue: 0,
  });
  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      styleNo: '',
      colorway: '',
      productCode: '',
      itemPrice: '',
      ldpPrice: '',
      sizeRange: '',
    },
  });

  const [rows, setRows] = useState([]);
  const [sizeRangeData, setSizeRangeData] = useState([]);
  const [sizeRangeOptions, setSizeRangeOptions] = useState([]);
  const [loadingSizeRanges, setLoadingSizeRanges] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch size ranges from API when dialog opens (same as Add-Order)
  useEffect(() => {
    const fetchSizeRanges = async () => {
      setLoadingSizeRanges(true);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetSizeRange`, { headers });

        if (Array.isArray(res.data)) {
          setSizeRangeData(res.data);
          const uniqueSizeRanges = [...new Set(res.data.map(item => item.sizeRange))];
          setSizeRangeOptions(uniqueSizeRanges);
        } else {
          setSizeRangeData([]);
          setSizeRangeOptions([]);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Size range fetch error (edit):', err);
        setSizeRangeData([]);
        setSizeRangeOptions([]);
      } finally {
        setLoadingSizeRanges(false);
      }
    };

    if (open) {
      fetchSizeRanges();
      setFormError('');
    }
  }, [open]);

  const generateSizes = (selectedSizeRange) => {
    if (!selectedSizeRange) return [''];

    const sizesForRange = sizeRangeData
      .filter(item => item.sizeRange === selectedSizeRange)
      .map(item => item.sizes);

    return sizesForRange.length > 0 ? sizesForRange : [selectedSizeRange];
  };

  const onSubmit = (data) => {
    const sizes = generateSizes(data.sizeRange);

    const newRows = sizes.map((size) => ({
      styleNo: data.styleNo || '',
      colorway: data.colorway || '',
      productCode: data.productCode || '',
      sizeRange: data.sizeRange || '',
      size,
      quantity: 0,
      itemPrice: parseFloat(data.itemPrice) || 0,
      value: 0,
      ldpPrice: parseFloat(data.ldpPrice) || 0,
      ldpValue: 0,
    }));

    setRows([...rows, ...newRows]);

    reset({
      styleNo: data.styleNo || '',
      colorway: data.colorway || '',
      productCode: data.productCode || '',
      itemPrice: data.itemPrice || '',
      ldpPrice: data.ldpPrice || '',
      sizeRange: '',
    });
    setFormError('');
  };

  const handleQuantityChange = (index, value) => {
    const newRows = [...rows];
    newRows[index].quantity = parseInt(value) || 0;
    newRows[index].value = newRows[index].quantity * newRows[index].itemPrice;
    newRows[index].ldpValue = newRows[index].quantity * newRows[index].ldpPrice;
    setRows(newRows);
  };

  const handleSave = () => {
    if (rows.length === 0) {
      setFormError('Please add at least one item before saving');
      return;
    }

    const totalQuantity = rows.reduce((sum, row) => sum + (row.quantity || 0), 0);
    const totalValue = rows.reduce((sum, row) => sum + (row.value || 0), 0);
    const totalLdpValue = rows.reduce((sum, row) => sum + (row.ldpValue || 0), 0);

    const savedData = {
      rows: [...rows],
      totals: {
        totalQuantity,
        totalValue,
        totalLdpValue
      }
    };

    onSaveData(savedData);
    setFormError('');
  };

  const handleSaveAndClose = () => {
    if (rows.length === 0) {
      setFormError('Please add at least one item before saving');
      return;
    }

    const totalQuantity = rows.reduce((sum, row) => sum + (row.quantity || 0), 0);
    const totalValue = rows.reduce((sum, row) => sum + (row.value || 0), 0);
    const totalLdpValue = rows.reduce((sum, row) => sum + (row.ldpValue || 0), 0);

    const savedData = {
      rows: [...rows],
      totals: {
        totalQuantity,
        totalValue,
        totalLdpValue
      }
    };

    onSaveData(savedData);
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
    setRows([]);
    setFormError('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>ITEM DETAILS</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={4}>
            <Controller
              name="styleNo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Style No"
                  fullWidth
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Controller
              name="colorway"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Colorway"
                  fullWidth
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Controller
              name="productCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Product Code"
                  fullWidth
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Controller
              name="itemPrice"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Item Price"
                  type="number"
                  fullWidth
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Controller
              name="ldpPrice"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="LDP Price"
                  type="number"
                  fullWidth
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Controller
              name="sizeRange"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <Autocomplete
                    options={sizeRangeOptions}
                    loading={loadingSizeRanges}
                    value={field.value || ''}
                    onChange={(_, newValue) => field.onChange(newValue || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Size Range"
                        placeholder="Select Size Range"
                        size="small"
                      />
                    )}
                  />
                </FormControl>
              )}
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleSubmit(onSubmit)}
        >
          Add
        </Button>

        {rows.length > 0 && (
          <>
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Style No</TableCell>
                    <TableCell>Colorway</TableCell>
                    <TableCell>Product Code</TableCell>
                    <TableCell>Size Range</TableCell>
                    <TableCell>Sizes</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Item Price</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>LDP Price</TableCell>
                    <TableCell>LDP Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.styleNo}</TableCell>
                      <TableCell>{row.colorway}</TableCell>
                      <TableCell>{row.productCode}</TableCell>
                      <TableCell>{row.sizeRange}</TableCell>
                      <TableCell>{row.size}</TableCell>
                      <TableCell>
                        <TextField
                          value={row.quantity}
                          type="number"
                          size="small"
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                      <TableCell>{row.itemPrice}</TableCell>
                      <TableCell>{row.value.toFixed(2)}</TableCell>
                      <TableCell>{row.ldpPrice}</TableCell>
                      <TableCell>{row.ldpValue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total Qty: {rows.reduce((sum, row) => sum + (row.quantity || 0), 0)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total Value: {rows.reduce((sum, row) => sum + (row.value || 0), 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total LDP Value: {rows.reduce((sum, row) => sum + (row.ldpValue || 0), 0).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={rows.length === 0}
        >
          Save
        </Button>
        <Button
          onClick={handleSaveAndClose}
          variant="contained"
          color="success"
          disabled={rows.length === 0}
        >
          Save & Close
        </Button>
        <Button onClick={handleClose} color="error">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// -------------------- Updated Merchant Multiple Select Component --------------------
function MerchantMultipleSelect({ name, label, merchants, selectedMerchantNames }) {
  const { control, setValue } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl fullWidth>
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            multiple
            input={<OutlinedInput label={label} />}
            renderValue={(selected) => selected.join(', ')}
            value={selectedMerchantNames || []}
          >
            {merchants.map((merchant) => (
              <MenuItem key={merchant.userId} value={merchant.userName}>
                <Checkbox checked={field.value ? field.value.indexOf(merchant.userName) > -1 : false} />
                <ListItemText primary={merchant.userName} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    />
  );
}

// -------------------- Main Component --------------------
export default function CompletePurchaseOrderFormEdit() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get the ID from URL parameters
  const methods = useForm({
    defaultValues: {
      costingRef: '',
      masterPo: '',
      customer: '',
      supplier: '',
      merchant: [],
      proceedings: '',
      orderType: 'New',
      transactions: 'Services',
      version: 'Regular',
      amsRef: '',
      customerPo: '',
      commission: 0,
      vendorCommission: 0,
      internalPo: '',
      rnNo: '',
      consignee: '',
      image: null,
      placementDate: '',
      etaNewJerseyDate: '',
      etaWarehouseDate: '',
      buyerShipInitial: '',
      buyerShipLast: '',
      RevisedShipmentDate: '',
      RevisedShipmentDateVendor: '',
      vendorShipInitial: '',
      vendorShipLast: '',
      finalInspectionDate: '',
      reasonReviseBuyer: '',
      reasonReviseVendor: '',
      productPortfolio: '',
      productCategory: '',
      productGroup: '',
      season: '',
      tolQuantity: '',
      set: '',
      fabric: '',
      item: '',
      qualityComposition: '',
      gsm: '',
      design: '',
      otherFabric: '',
      gsmOF: '',
      construction: '',
      poSpecialOperation: '',
      status: '',
      poSpecialTreatment: '',
      styleSource: '',
      brand: '',
      assortment: '',
      ratio: '',
      cartonMarking: '',
      poSpecialInstructions: '',
      washingCareLabel: 'Machine Wash Cold With Like Colors, Tumble Dry Low, Use Only Non Chlorine Bleach, Do Not Iron Embalishment',
      importantNote: '',
      moreInfo: '',
      samplingRequirements: '',
      pcsPerCarton: '',
      grossWeight: '',
      netWeight: '',
      unit: '',
      packingList: '',
      embEmbellishment: 'Not Required',
      inquiryNo: '',
      buyerCustomer: '',
      itemDescriptionShippingInvoice: '',
      currency: 'Dollar',
      exchangeRate: '',
      style: '',
      paymentMode: 'DP',
      shipmentTerm: 'CNF',
      destination: 'New York',
      shipmentMode: '',
      bankName: '',
      routingNo: '',
      bankBranch: '',
      bankID: '',
      titleOfAccount: '',
      accountNo: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    getValues,
  } = methods;

  const [files, setFiles] = useState({});
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [savedItemData, setSavedItemData] = useState(null);
  const [showSelections, setShowSelections] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [productPortfolios, setProductPortfolios] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [filteredProductCategories, setFilteredProductCategories] = useState([]);
  const [filteredProductGroups, setFilteredProductGroups] = useState([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [selectedMerchantNames, setSelectedMerchantNames] = useState([]);
  const [selectedProductPortfolioName, setSelectedProductPortfolioName] = useState('');
  const [bankOptions, setBankOptions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState(null);
  // Costing Ref options (CostingRefNo API)
  const [costingOptions, setCostingOptions] = useState([]);
  const [costingLoading, setCostingLoading] = useState(false);

  const STEPS = [
    'PURCHASE ORDER ENTRY',
    'PURCHASE ORDER IMPORTANT DATES',
    'PRODUCT INFORMATION',
    'PRODUCT SPECIFIC INFORMATION',
    'SHIPPING AND PAYMENT TERMS',
    'REFERENCE & ATTACHMENT',
    'BANK DETAILS',
  ];

  const [activeStep, setActiveStep] = useState(0);
  const isLastStep = activeStep === STEPS.length - 1;

  const handleNextStep = () => {
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrevStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  // Helpers for Product Specific Information grid
  const recalculateItemTotals = (rows) => ({
    totalQuantity: rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
    totalValue: rows.reduce((sum, r) => sum + (Number(r.value) || 0), 0),
    totalLdpValue: rows.reduce((sum, r) => sum + (Number(r.ldpValue) || 0), 0),
  });

  // Map item grid rows to AddPurchaseOrderDetails API payload (same structure as Add-Order)
  const mapItemRowsToDetailsPayload = (rows = []) =>
    rows.map((row) => ({
      quantity: Number(row.quantity || 0),
      rate: Number(row.itemPrice || 0),
      remarks: row.remarks || '',
      vendorRate: Number(row.vendorPrice || 0),
      ldpRate: Number(row.ldpPrice || 0),
      cartonPerPcs: Number(row.cartonQty || 0),
      qrCodePOD: row.qrCodePOD || '',
      ratioPOD: Number(row.ratio || 0),
      grossWeightD: Number(row.grossWeight || 0),
      netWeightD: Number(row.netWeight || 0),
      barCodeTF: row.barcode || '',
      styleNo: row.styleNo || '',
      itemDescription: row.itemDescription || '',
      article: row.article || '',
      colorway: row.colorway || '',
      size: String(row.size ?? ''),
      itemPrice: Number(row.itemPrice || 0),
      sizeRangeDBID: Number(row.sizeRangeDBID ?? 0),
      productCode: row.productCode || '',
    }));

  const customerPoValue = watch('customerPo');
  const selectedProductPortfolio = watch('productPortfolio');
  const selectedProductCategory = watch('productCategory');
  const pcsPerCartonWatched = watch('pcsPerCarton');
  const assortmentValue = watch('assortment');

  // Recalculate cartonQty for all rows whenever pcsPerCarton changes
  useEffect(() => {
    const ppcVal = Number(pcsPerCartonWatched) || 0;
    setSavedItemData((prev) => {
      if (!prev || !prev.rows || prev.rows.length === 0) return prev;
      const rows = prev.rows.map((row) => ({
        ...row,
        cartonQty: ppcVal > 0 ? Math.ceil((Number(row.quantity) || 0) / ppcVal) : 0,
      }));
      return { ...prev, rows };
    });
  }, [pcsPerCartonWatched]);

  // Clear ratio field when assortment is set to Solid
  useEffect(() => {
    if (assortmentValue === 'Solid') {
      setValue('ratio', '');
    }
  }, [assortmentValue, setValue]);

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await apiClient.get('/MyOrders/GetCustomer');
        if (response.data) {
          // Remove duplicates based on customerID
          const uniqueCustomers = response.data.filter((customer, index, self) =>
            index === self.findIndex(c => c.customerID === customer.customerID)
          );
          setCustomers(uniqueCustomers);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        showSnackbar('Error loading customers data', 'error');
      }
    };

    fetchCustomers();
  }, []);

  // Fetch suppliers from API
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await apiClient.get('/MyOrders/GetSupplier');
        if (response.data) {
          // Remove duplicates based on venderLibraryID
          const uniqueSuppliers = response.data.filter((supplier, index, self) =>
            index === self.findIndex(s => s.venderLibraryID === supplier.venderLibraryID)
          );
          setSuppliers(uniqueSuppliers);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        showSnackbar('Error loading suppliers data', 'error');
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch banks from API for Bank dropdown
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setBankLoading(true);
        setBankError(null);
        const response = await apiClient.get('/MyOrders/GetBanks');
        const data = response.data;

        if (Array.isArray(data)) {
          setBankOptions(data);
        } else if (data) {
          setBankOptions([data]);
        } else {
          setBankOptions([]);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
        setBankError('Unable to load banks');
        showSnackbar('Error loading banks data', 'error');
        setBankOptions([]);
      } finally {
        setBankLoading(false);
      }
    };

    fetchBanks();
  }, []);

  // Fetch costing references from API for Costing Ref dropdown
  useEffect(() => {
    const fetchCostingRefs = async () => {
      try {
        setCostingLoading(true);
        const response = await apiClient.get('/MyOrders/CostingRefNo');
        const data = response.data;

        if (Array.isArray(data)) {
          setCostingOptions(data);
        } else if (data) {
          setCostingOptions([data]);
        } else {
          setCostingOptions([]);
        }
      } catch (error) {
        console.error('Error fetching costing refs:', error);
        showSnackbar('Error loading costing references', 'error');
        setCostingOptions([]);
      } finally {
        setCostingLoading(false);
      }
    };

    fetchCostingRefs();
  }, []);

  // Fetch merchants from API
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await apiClient.get('/MyOrders/GetMerchants');
        if (response.data) {
          setMerchants(response.data);
        }
      } catch (error) {
        console.error('Error fetching merchants:', error);
        showSnackbar('Error loading merchants data', 'error');
      }
    };

    fetchMerchants();
  }, []);

  // Fetch product portfolios from API
  useEffect(() => {
    const fetchProductPortfolios = async () => {
      try {
        const response = await apiClient.get('/MyOrders/GetProductPortfolio');
        if (response.data) {
          setProductPortfolios(response.data);
        }
      } catch (error) {
        console.error('Error fetching product portfolios:', error);
        showSnackbar('Error loading product portfolios data', 'error');
      }
    };

    fetchProductPortfolios();
  }, []);

  // Load product categories from API based on selected or API portfolio
  useEffect(() => {
    const loadCategories = async () => {
      let portfolioID = null;

      // Try from selected portfolio name
      if (selectedProductPortfolio && productPortfolios.length > 0) {
        const selectedPortfolio = productPortfolios.find(
          (p) => p.productPortfolio === selectedProductPortfolio
        );
        if (selectedPortfolio) {
          portfolioID = selectedPortfolio.productPortfolioID;
        }
      }

      // Fallback to API data (when editing existing PO and field is pre-set)
      if (!portfolioID && apiData?.productPortfolioID) {
        portfolioID = apiData.productPortfolioID;
      }

      if (!portfolioID) {
        setProductCategories([]);
        setFilteredProductCategories([]);
        return;
      }

      try {
        const response = await apiClient.get(
          `/MyOrders/GetProductCategories/${portfolioID}`
        );
        const categories = response.data || [];
        setProductCategories(categories);
        setFilteredProductCategories(categories);

        // When loading from API for first time, set form field from IDs
        if (apiData?.productCategoriesID) {
          const categoryFromAPI = categories.find(
            (c) =>
              Number(c.productCategoriesID) ===
              Number(apiData.productCategoriesID)
          );
          if (categoryFromAPI) {
            setValue('productCategory', categoryFromAPI.productCategories);
          }
        }
      } catch (error) {
        console.error('Error fetching product categories:', error);
        showSnackbar('Error loading product categories data', 'error');
        setProductCategories([]);
        setFilteredProductCategories([]);
      }
    };

    // Run once dependent data is available
    if (productPortfolios.length > 0) {
      loadCategories();
    }
  }, [selectedProductPortfolio, productPortfolios, apiData, setValue]);

  // Load product groups from API based on selected or API category
  useEffect(() => {
    const loadGroups = async () => {
      let categoryID = null;

      // Try from selected category name
      if (selectedProductCategory && productCategories.length > 0) {
        const selectedCategory = productCategories.find(
          (c) => c.productCategories === selectedProductCategory
        );
        if (selectedCategory) {
          categoryID = selectedCategory.productCategoriesID;
        }
      }

      // Fallback to API data (when editing existing PO and field is pre-set)
      if (!categoryID && apiData?.productCategoriesID) {
        categoryID = apiData.productCategoriesID;
      }

      if (!categoryID) {
        setProductGroups([]);
        setFilteredProductGroups([]);
        return;
      }

      try {
        const response = await apiClient.get(
          `/MyOrders/GetProductGroups/${categoryID}`
        );
        const groups = response.data || [];
        setProductGroups(groups);
        setFilteredProductGroups(groups);

        if (apiData?.productGroupID) {
          const groupFromAPI = groups.find(
            (g) => Number(g.productGroupID) === Number(apiData.productGroupID)
          );
          if (groupFromAPI) {
            setValue('productGroup', groupFromAPI.productGroup);
          }
        }
      } catch (error) {
        console.error('Error fetching product groups:', error);
        showSnackbar('Error loading product groups data', 'error');
        setProductGroups([]);
        setFilteredProductGroups([]);
      }
    };

    if (productCategories.length > 0) {
      loadGroups();
    }
  }, [selectedProductCategory, productCategories, apiData, setValue]);

  // Fetch data from API when component mounts or ID changes
  useEffect(() => {
    const fetchPurchaseOrderData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      // Wait for costing options to be loaded first
      if (costingLoading) {
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get(`/MyOrders/GetPurchaseOrder/${id}`);

        if (response.data && response.data.length > 0) {
          const orderData = response.data[0];
          console.log("=== PURCHASE ORDER GET DATA PAYLOAD ===", orderData);
          setApiData(orderData);

          let poFiles = {};
          try {
            const filesResponse = await apiClient.get(`/MyOrders/GetPOFiles/${id}`);
            if (Array.isArray(filesResponse.data)) {
              filesResponse.data.forEach((file) => {
                const name = (file.fileName || '').toLowerCase();
                const fileUrl = pickPoAttachmentUrl(file.fileUrl);
                if (!fileUrl) return;
                if (name.includes('originalpurchaseorder') || name.includes('orginalpurchaseorder')) {
                  poFiles.orginalpurchaseorder = fileUrl;
                } else if (name.includes('processorderconfirmation') || name.includes('process')) {
                  poFiles.process = fileUrl;
                } else if (name.includes('finalspecs')) {
                  poFiles.finalSpecs = fileUrl;
                } else if (name.includes('productimage')) {
                  poFiles.productImage = fileUrl;
                } else if (name.includes('sizesetcomment') || name.includes('sizeset')) {
                  poFiles.sizeSet = fileUrl;
                } else if (name.includes('ppcomment') || name.includes('pplimage') || name.includes('pp comment')) {
                  poFiles.pplImage = fileUrl;
                }
              });
            }
            console.log("=== MAPPED PO FILES DATA ===", poFiles);
          } catch (filesErr) {
            console.error("Error fetching PO Files:", filesErr);
          }

          // Find customer name based on customerID from purchase order
          const customerFromAPI = customers.find(customer => customer.customerID === orderData.customerID);
          const customerName = customerFromAPI ? customerFromAPI.customerName : '';
          setSelectedCustomerName(customerName);

          // Find supplier name based on supplierID from purchase order
          const supplierFromAPI = suppliers.find(supplier => supplier.venderLibraryID === orderData.supplierID);
          const supplierName = supplierFromAPI ? supplierFromAPI.venderName : '';
          setSelectedSupplierName(supplierName);

          // Find merchant names based on marchandID from purchase order
          const merchantFromAPI = merchants.find(merchant => merchant.userId === orderData.marchandID);
          const merchantNames = merchantFromAPI ? [merchantFromAPI.userName] : [];
          setSelectedMerchantNames(merchantNames);

          // Find product portfolio name based on productPortfolioID from purchase order
          const portfolioFromAPI = productPortfolios.find(portfolio => portfolio.productPortfolioID === orderData.productPortfolioID);
          const portfolioName = portfolioFromAPI ? portfolioFromAPI.productPortfolio : '';
          setSelectedProductPortfolioName(portfolioName);

          // Find product category name based on productCategoriesID from purchase order
          const categoryFromAPI = productCategories.find(
            category => category.productCategoriesID === orderData.productCategoriesID
          );
          const categoryName = categoryFromAPI ? categoryFromAPI.productCategories : '';

          // Find product group name based on productGroupID from purchase order
          const groupFromAPI = productGroups.find(
            group => group.productGroupID === orderData.productGroupID
          );
          const groupName = groupFromAPI ? groupFromAPI.productGroup : '';

          // Map API data to form fields with date mappings
          reset({
            // Basic Order Info
            masterPo: orderData.masterPO || '',
            image: orderData.poImage || null,
            customerPo: orderData.pono || '',
            internalPo: orderData.internalPONO || '',
            amsRef: orderData.amsRefNo || '',
            rnNo: orderData.rnNo || '',
            consignee: orderData.consignee || '',
            customer: customerName || '', // Set customer name from API
            supplier: supplierName || '', // Set supplier name from API
            merchant: merchantNames || [], // Set merchant names from API
            productPortfolio: portfolioName || '', // Set product portfolio name from API
            productCategory: categoryName || '', // Set product category name from API (matched by ID)
            productGroup: groupName || '', // Set product group name from API (matched by ID)
            proceedings: orderData.proceedings || '',
            orderType: orderData.pOtype || '',
            transactions: orderData.transactions || '',
            version: orderData.version || '',
            commission: orderData.commission || 0,
            vendorCommission: orderData.vendorCommission || 0,

            // Dates - Using the mappings you provided
            placementDate: orderData.placementDate ? orderData.placementDate.split('T')[0] : '',
            etaNewJerseyDate: orderData.etanjDate ? orderData.etanjDate.split('T')[0] : '',
            etaWarehouseDate: orderData.etaWarehouseDate ? orderData.etaWarehouseDate.split('T')[0] : '',
            finalInspectionDate: orderData.finalInspDate ? orderData.finalInspDate.split('T')[0] : '',

            // Buyer Shipment Dates
            buyerShipInitial: orderData.tolerance ? orderData.tolerance.split('T')[0] : '',
            buyerShipLast: orderData.buyerExIndiaTolerance ? orderData.buyerExIndiaTolerance.split('T')[0] : '',

            // Vendor Shipment Dates
            vendorShipInitial: orderData.shipmentDate ? orderData.shipmentDate.split('T')[0] : '',
            vendorShipLast: orderData.vendorExIndiaShipmentDate ? orderData.vendorExIndiaShipmentDate.split('T')[0] : '',

            // Product Information
            season: orderData.season || '',
            fabric: orderData.fabric || '',
            item: orderData.item || '',
            design: orderData.design || '',
            otherFabric: orderData.otherFabric || '',
            construction: orderData.construction || '',
            status: mapApiStatusToOption(orderData.status) || '',
            styleSource: orderData.styleSource || '',
            brand: orderData.brand || '',
            assortment: orderData.assortment || '',
            ratio: orderData.ration || '',
            cartonMarking: orderData.cartonMarking || '',
            poSpecialInstructions: orderData.pO_Special_Instructions || '',
            washingCareLabel: orderData.washingCareLabelInstructions || 'Machine Wash Cold With Like Colors, Tumble Dry Low, Use Only Non Chlorine Bleach, Do Not Iron Embalishment',
            importantNote: orderData.importantNote || '',
            moreInfo: orderData.moreInfo || '',
            samplingRequirements: orderData.samplingReq || '',
            // Use nullish coalescing so 0 is preserved (0 should show as 0, not empty)
            pcsPerCarton: orderData.pcPerCarton ?? '',
            grossWeight: orderData.grossWeight ?? '',
            netWeight: orderData.netWeight ?? '',
            unit: orderData.grossAndNetWeight || '',
            packingList: orderData.packingList || '',
            embEmbellishment: orderData.embAndEmbellishment || 'Not Required',
            buyerCustomer: orderData.buyerCustomer || '',
            itemDescriptionShippingInvoice: orderData.itemDescriptionShippingInvoice || '',

            // Product Specific Information
            currency: orderData.currency || '',
            // Preserve 0 exchange rate as "0", only empty when null/undefined
            exchangeRate: orderData.exchangeRate ?? '',
            // Prefer styleNo (as shown in My-Order list), fallback to design
            style: orderData.styleNo || orderData.design || '',

            // Shipping and Payment Terms
            // "paymentMode":  "2"  -> Payment Mode select (values: "2", "3", ...)
            // "shipmentMode": "5"  -> Shipment Term select (values: "4", "5", ...)
            // "deliveryType": "7"  -> Shipment Mode select (values: "1", "7", "8", ...)
            paymentMode: orderData.paymentMode || '',
            shipmentTerm: orderData.shipmentMode || '',
            destination: orderData.destination || 'New York',
            shipmentMode: orderData.deliveryType || '',


            // Reference & Attachment — GetPOFiles URLs only (no legacy poImage/specsimage fallbacks)
            originalPurchaseOrder: pickPoAttachmentUrl(poFiles.orginalpurchaseorder),
            processOrderConfirmation: pickPoAttachmentUrl(poFiles.process),
            finalSpecs: pickPoAttachmentUrl(poFiles.finalSpecs),
            productImage: pickPoAttachmentUrl(poFiles.productImage),
            ppComment: pickPoAttachmentUrl(poFiles.pplImage),
            sizeSetComment: pickPoAttachmentUrl(poFiles.sizeSet),

            bankBranch: orderData.bankBranch || '',
            titleOfAccount: orderData.titleOfAccount || '',
            accountNo: orderData.accountNo || '',

            // Keep existing values for fields not in API
            // Costing Ref: API sends costingMstID; our select uses IDs as string values.
            // Treat 0 as empty (no costing ref selected)
            costingRef:
              orderData.costingMstID !== undefined &&
                orderData.costingMstID !== null &&
                orderData.costingMstID !== 0
                ? String(orderData.costingMstID)
                : '',
            RevisedShipmentDate: (orderData.xmlFileName ?? orderData.XMLFileName)
              ? String(orderData.xmlFileName ?? orderData.XMLFileName).split('T')[0]
              : '',
            RevisedShipmentDateVendor: (() => {
              const raw =
                orderData.vendorRevisedShipmentDate ??
                orderData.VendorRevisedShipmentDate ??
                orderData.revisedShipmentDateVendor ??
                orderData.RevisedShipmentDateVendor;
              return raw ? String(raw).split('T')[0] : '';
            })(),
            reasonReviseBuyer: '',
            reasonReviseVendor: '',
            tolQuantity: orderData.toleranceindays || 0,
            set: orderData.poQtyUnit || '',
            qualityComposition: orderData.quality || 0,
            gsm: orderData.gms || 0,
            gsmOF: orderData.ribGSM || orderData.ribGsm || orderData.RibGSM || '',
            poSpecialOperation: orderData.pO_Special_Operation || '',
            poSpecialTreatment: orderData.pO_Special_Treatement || '',
            inquiryNo: orderData.inquiryMstID ? `INQ${orderData.inquiryMstID}` : '',
            routingNo: '',
            // Bank ID is saved as numeric/string ID; our select uses string values
            bankID:
              orderData.bankID !== undefined && orderData.bankID !== null
                ? String(orderData.bankID)
                : '',
          });
        }

      } catch (error) {
        console.error('Error fetching purchase order data:', error);
        showSnackbar('Error loading purchase order data', 'error');
      } finally {
        setLoading(false);
      }
    };

    // Fetch purchase order data only when main dependent data is loaded
    // AND costing options are loaded
    if (customers.length > 0 && suppliers.length > 0 && merchants.length > 0 &&
      productPortfolios.length > 0 && !costingLoading) {
      fetchPurchaseOrderData();
    }
  }, [id, reset, customers, suppliers, merchants, productPortfolios, costingLoading]);

  // Load Product Specific Information grid data for view (styles / sizes per PO)
  const fetchStyleGrid = async () => {
    if (!id) return;

    try {
      const response = await apiClient.get(`/Milestone/GetStyle?poid=${id}`);
      const data = Array.isArray(response.data) ? response.data : [];
      if (data.length === 0) {
        setSavedItemData(null);
        return;
      }

      const rows = data.map((item) => {
        const quantity = Number(item.quantity || 0);
        const itemPrice = Number(
          item.itemPrice ?? item.rate ?? 0
        );
        const ldpPrice = Number(
          item.ldpRate ?? item.ldpPrice ?? 0
        );

        const value = quantity * itemPrice;
        const ldpValue = quantity * ldpPrice;

        const currentPcsPerCarton = Number(getValues('pcsPerCarton')) || Number(apiData?.pcPerCarton) || 0;
        const cartonQty = currentPcsPerCarton > 0 ? Math.ceil(quantity / currentPcsPerCarton) : Number(item.cartonPerPcs ?? 0);

        return {
          styleId: item.styleID || item.styleId || 0, // Map styleId for updates
          styleNo: item.styleNo || '',
          colorway: item.colorway || '',
          productCode: item.productCode || '',
          // API me size range ka naam nahi aa raha, isliye abhi blank rakha hai
          sizeRange: item.sizeRange || '',
          sizeRangeDBID: item.sizeRangeDBID || 0,
          size: item.size || '',
          quantity,
          itemPrice,
          value,
          ldpPrice,
          ldpValue,

          // Extra fields (future editable grid ke liye useful)
          barcode: item.barCodeTF || '',
          ratio: item.ratioPOD || 0,
          vendorPrice: Number(item.vendorRate ?? 0),
          cartonQty,
          grossWeight: Number(item.grossWeightD ?? 0),
          netWeight: Number(item.netWeightD ?? 0),
          remarks: item.remarks || '',
          qrCodePOD: item.qrCodePOD || '',
          itemDescription: item.itemDescription || '',
          article: item.article || '',
        };
      });

      const totals = {
        totalQuantity: rows.reduce((sum, r) => sum + (r.quantity || 0), 0),
        totalValue: rows.reduce((sum, r) => sum + (r.value || 0), 0),
        totalLdpValue: rows.reduce((sum, r) => sum + (r.ldpValue || 0), 0),
      };

      setSavedItemData({ rows, totals });

      // Style field ko bhi auto-fill kar dein, jaise Add Order me hai
      const styleNumbers = [...new Set(rows.map((r) => r.styleNo))].join(', ');
      if (styleNumbers) {
        setValue('style', styleNumbers);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching style grid for PO:', error);
    }
  };

  useEffect(() => {
    fetchStyleGrid();
  }, [id]);

  // NOTE:
  // Previously, whenever the Customer PO changed, we were auto-copying it
  // into Internal PO via a useEffect. That caused both fields to always
  // stay the same, even when the user wanted different values.
  // To keep them independent, we intentionally removed that auto-fill logic.

  const handleOpenItemDialog = () => {
    setOpenItemDialog(true);
  };

  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
  };

  // Build a simple uniqueness key for an item row (to avoid double-add)
  const buildItemRowKey = (row) =>
    [
      row.styleNo || '',
      row.colorway || '',
      row.productCode || '',
      row.sizeRange || '',
      row.size || '',
    ].join('|');

  // When user saves from Item Details dialog, append new rows to grid
  // and send them to AddPurchaseOrderDetails?poId={id}
  const handleSaveItemData = async (data) => {
    const newRows = data?.rows || [];
    if (!newRows.length) return;

    // Deduplicate: don't add rows that are already in the grid
    const existingRows = savedItemData?.rows || [];
    const existingKeys = new Set(existingRows.map((r) => buildItemRowKey(r)));

    const rowsToAdd = newRows.filter((row) => {
      const key = buildItemRowKey(row);
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });

    const ppcVal = Number(getValues('pcsPerCarton')) || 0;
    const rowsToAddCalculated = rowsToAdd.map((row) => ({
      ...row,
      cartonQty: ppcVal > 0 ? Math.ceil((Number(row.quantity) || 0) / ppcVal) : 0,
    }));

    if (!rowsToAddCalculated.length) {
      // All rows already present (e.g. user clicked Save then Save & Close)
      return;
    }

    const mergedRows = [...existingRows, ...rowsToAddCalculated];
    setSavedItemData({
      rows: mergedRows,
      totals: recalculateItemTotals(mergedRows),
    });

    // Call AddPurchaseOrderDetails API only for truly new rows
    try {
      const basePayload = mapItemRowsToDetailsPayload(rowsToAddCalculated);
      // Backend sample expects styleID in each object; we also send purchaseOrderID
      const payload = basePayload.map((item) => ({
        styleID: 0,
        purchaseOrderID: Number(id) || 0,
        ...item,
      }));

      // Include poId in query for explicit linkage with this Purchase Order
      await apiClient.post(`/MyOrders/AddPurchaseOrderDetails?poId=${id}`, payload);

      setSnackbar({
        open: true,
        message: 'Item details added successfully!',
        severity: 'success',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adding item details via AddPurchaseOrderDetails:', error);
      setSnackbar({
        open: true,
        message: 'Error adding item details. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleShowSelections = () => {
    if (!showSelections && savedItemData) {
      const styleNumbers = [...new Set(savedItemData.rows.map(row => row.styleNo))].join(', ');
      setValue('style', styleNumbers);
    }
    setShowSelections(!showSelections);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSelectionRowChange = (index, field, rawValue) => {
    setSavedItemData((prev) => {
      if (!prev) return prev;

      const numericFields = new Set([
        'quantity',
        'itemPrice',
        'vendorPrice',
        'ldpPrice',
        'cartonQty',
        'grossWeight',
        'netWeight',
      ]);

      const rows = prev.rows.map((row, i) => {
        if (i !== index) return row;

        const updated = { ...row };
        if (numericFields.has(field)) {
          const num = Number(rawValue);
          updated[field] = Number.isNaN(num) ? 0 : num;
        } else {
          updated[field] = rawValue;
        }

        // Recalculate value & LDP value whenever quantity / prices change
        const qty = Number(updated.quantity) || 0;
        const itemPrice = Number(updated.itemPrice) || 0;
        const ldpPrice = Number(updated.ldpPrice) || 0;
        updated.value = qty * itemPrice;
        updated.ldpValue = qty * ldpPrice;

        // Auto-calculate cartonQty = quantity / pcsPerCarton
        if (field === 'quantity') {
          const pcsPerCartonVal = Number(getValues('pcsPerCarton')) || 0;
          updated.cartonQty = pcsPerCartonVal > 0 ? Math.ceil(qty / pcsPerCartonVal) : 0;
        }

        return updated;
      });

      return {
        rows,
        totals: recalculateItemTotals(rows),
      };
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Update a single style row immediately when changed (onBlur)
  const handleUpdateStyleRow = async (row) => {
    if (!row || !row.styleId) return;

    try {
      // Build payload for single row - sending single object as body
      const payload = {
        styleID: row.styleId,
        purchaseOrderID: Number(id),
        quantity: Number(row.quantity ?? 0),
        rate: Number(row.itemPrice ?? 0),
        remarks: row.remarks || '',
        vendorRate: Number(row.vendorPrice ?? 0),
        ldpRate: Number(row.ldpPrice ?? 0),
        cartonPerPcs: Number(row.cartonQty ?? 0),
        qrCodePOD: row.qrCodePOD || '',
        ratioPOD: Number(row.ratio ?? 0),
        grossWeightD: Number(row.grossWeight ?? 0),
        netWeightD: Number(row.netWeight ?? 0),
        barCodeTF: row.barcode || '',
        styleNo: row.styleNo || '',
        itemDescription: row.itemDescription || '',
        article: row.article || '',
        colorway: row.colorway || '',
        size: row.size || '',
        itemPrice: Number(row.itemPrice ?? 0),
        sizeRangeDBID: Number(row.sizeRangeDBID ?? 0),
        productCode: row.productCode || '',
      };

      console.log(`Updating style row ${row.styleId} for PO ${id}`, payload);
      await apiClient.post(`/Milestone/UpdateStyle?poid=${id}&styleId=${row.styleId}`, payload);

    } catch (error) {
      // console.error('Error updating style row:', error);
      // // showSnackbar('Error updating item details', 'error');
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof File)) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let base64String = reader.result;
        if (base64String.includes(',')) {
          base64String = base64String.split(',')[1];
        }
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Build payload for UpdatePurchaseOrder API from form data + existing apiData
  const buildUpdatePayload = async (form, customers, suppliers, merchants, productPortfolios, productCategories, productGroups) => {
    if (!apiData) return null;

    const toIsoOrExisting = (dateStr, existing) => {
      if (dateStr) {
        const d = new Date(dateStr);
        return Number.isNaN(d.getTime()) ? existing : d.toISOString();
      }
      return existing || null;
    };

    const payload = { ...apiData };

    // Basic Order Info
    payload.masterPO = form.masterPo || apiData.masterPO || '';
    payload.pono = form.customerPo || apiData.pono || '';
    payload.internalPONO = form.internalPo || apiData.internalPONO || '';
    payload.amsRefNo = form.amsRef || apiData.amsRefNo || '';
    payload.rnNo = form.rnNo || apiData.rnNo || '';
    payload.consignee = form.consignee || apiData.consignee || '';


    // Customer, Supplier, Merchant IDs (map from form selections)
    // Find customerID based on selected customer name
    const selectedCustomer = customers.find(c => c.customerName === form.customer);
    payload.customerID = selectedCustomer ? selectedCustomer.customerID : apiData.customerID;

    // Find supplierID based on selected supplier name
    const selectedSupplier = suppliers.find(s => s.venderName === form.supplier);
    payload.supplierID = selectedSupplier ? selectedSupplier.venderLibraryID : apiData.supplierID;

    // Find merchantID based on selected merchant name (taking first one if multiple selected)
    const selectedMerchant = merchants.find(m => form.merchant?.[0] && m.userName === form.merchant[0]);
    payload.marchandID = selectedMerchant ? selectedMerchant.userId : apiData.marchandID;

    // Proceedings / types
    payload.proceedings = form.proceedings || apiData.proceedings || '';
    payload.pOtype = form.orderType || apiData.pOtype || '';
    payload.transactions = form.transactions || apiData.transactions || '';
    payload.version = form.version || apiData.version || '';

    // Dates
    payload.placementDate = toIsoOrExisting(form.placementDate, apiData.placementDate);
    payload.etanjDate = toIsoOrExisting(form.etaNewJerseyDate, apiData.etanjDate);
    payload.etaWarehouseDate = toIsoOrExisting(form.etaWarehouseDate, apiData.etaWarehouseDate);
    payload.finalInspDate = toIsoOrExisting(form.finalInspectionDate, apiData.finalInspDate);

    // Buyer / Vendor shipment windows
    payload.tolerance = toIsoOrExisting(form.buyerShipInitial, apiData.tolerance);
    payload.buyerExIndiaTolerance = toIsoOrExisting(
      form.buyerShipLast,
      apiData.buyerExIndiaTolerance
    );
    payload.shipmentDate = toIsoOrExisting(form.vendorShipInitial, apiData.shipmentDate);
    payload.vendorExIndiaShipmentDate = toIsoOrExisting(
      form.vendorShipLast,
      apiData.vendorExIndiaShipmentDate
    );

    const toYyyyMmDdOrEmpty = (dateStr) => {
      if (!dateStr || !String(dateStr).trim()) return '';
      const s = String(dateStr).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    payload.xmlFileName = toYyyyMmDdOrEmpty(form.RevisedShipmentDate);

    const vendorRevisedApiKeys = [
      'vendorRevisedShipmentDate',
      'VendorRevisedShipmentDate',
      'revisedShipmentDateVendor',
      'RevisedShipmentDateVendor',
    ];
    const vendorRevisedExisting = vendorRevisedApiKeys
      .map((key) => apiData[key])
      .find((value) => value != null && value !== '');
    const vendorRevisedIso = toIsoOrExisting(
      form.RevisedShipmentDateVendor,
      vendorRevisedExisting
    );
    const vendorRevisedKey =
      vendorRevisedApiKeys.find((key) => key in apiData) || 'vendorRevisedShipmentDate';
    payload[vendorRevisedKey] = vendorRevisedIso;

    // Product Information
    payload.season = form.season || apiData.season || '';
    payload.fabric = form.fabric || apiData.fabric || '';
    payload.item = form.item || apiData.item || '';
    payload.design = form.design || apiData.design || '';
    payload.otherFabric = form.otherFabric || apiData.otherFabric || '';
    payload.construction = form.construction || apiData.construction || '';
    payload.status = form.status || apiData.status || '';
    payload.styleSource = form.styleSource || apiData.styleSource || '';
    payload.brand = form.brand || apiData.brand || '';
    payload.assortment = form.assortment || apiData.assortment || '';
    payload.ration = form.ratio || apiData.ration || '';
    payload.cartonMarking = form.cartonMarking || apiData.cartonMarking || '';
    payload.pO_Special_Instructions =
      form.poSpecialInstructions || apiData.pO_Special_Instructions || '';
    payload.washingCareLabelInstructions =
      form.washingCareLabel || apiData.washingCareLabelInstructions || '';
    payload.importantNote = form.importantNote || apiData.importantNote || '';
    payload.moreInfo = form.moreInfo || apiData.moreInfo || '';
    payload.samplingReq = form.samplingRequirements || apiData.samplingReq || '';
    payload.pcPerCarton = safeParseInt(form.pcsPerCarton ?? apiData.pcPerCarton);
    payload.grossWeight = safeParseFloat(form.grossWeight ?? apiData.grossWeight);
    payload.netWeight = safeParseFloat(form.netWeight ?? apiData.netWeight);
    payload.grossAndNetWeight = form.unit || apiData.grossAndNetWeight || '';
    payload.packingList = form.packingList || apiData.packingList || '';
    payload.embAndEmbellishment = form.embEmbellishment || apiData.embAndEmbellishment || '';

    // Product Specific Information
    payload.currency = form.currency || apiData.currency || '';
    payload.exchangeRate = safeParseFloat(form.exchangeRate ?? apiData.exchangeRate);

    // Shipping & Payment Terms
    // "paymentMode":  "2"  -> Payment Mode select (values: "2", "3", ...)
    // "shipmentMode": "5"  -> Shipment Term select (values: "4", "5", ...)
    // "deliveryType": "7"  -> Shipment Mode select (values: "1", "7", "8", ...)
    payload.paymentMode = form.paymentMode || apiData.paymentMode || '';
    payload.shipmentMode = form.shipmentTerm || apiData.shipmentMode || '';
    payload.deliveryType = form.shipmentMode || apiData.deliveryType || '';
    payload.destination = form.destination || apiData.destination || '';

    // Bank Details
    payload.titleOfAccount = form.titleOfAccount || apiData.titleOfAccount || '';
    payload.bankName = form.bankName || apiData.bankName || '';
    payload.bankBranch = form.bankBranch || apiData.bankBranch || '';
    payload.accountNo = form.accountNo || apiData.accountNo || '';
    payload.iban = form.routingNo || apiData.iban || '';
    payload.bankID =
      form.bankID !== undefined && form.bankID !== null && form.bankID !== ''
        ? safeParseInt(form.bankID)
        : apiData.bankID || 0;

    // Reasons / notes
    payload.reasonforReviseShpmnt =
      form.reasonReviseBuyer || apiData.reasonforReviseShpmnt || '';
    payload.reasonforReviseShpmntVendor =
      form.reasonReviseVendor || apiData.reasonforReviseShpmntVendor || '';

    // Master references
    payload.masterPO = form.masterPo || apiData.masterPO || '';
    payload.amsRefNo = form.amsRef || apiData.amsRefNo || '';
    payload.samplingReq = form.samplingRequirements || apiData.samplingReq || '';
    payload.buyerCustomer = form.buyerCustomer || apiData.buyerCustomer || '';

    // Costing / product hierarchy IDs (keep existing IDs)
    const selectedPortfolio = productPortfolios.find(p => p.productPortfolio === form.productPortfolio);
    payload.productPortfolioID = selectedPortfolio ? selectedPortfolio.productPortfolioID : apiData.productPortfolioID;
    const selectedCategory = productCategories.find(c => c.productCategories === form.productCategory);
    payload.productCategoriesID = selectedCategory ? selectedCategory.productCategoriesID : apiData.productCategoriesID;
    const selectedGroup = productGroups.find(g => g.productGroup === form.productGroup);
    payload.productGroupID = selectedGroup ? selectedGroup.productGroupID : apiData.productGroupID;
    payload.costingMstID = form.costingRef ? safeParseInt(form.costingRef) : apiData.costingMstID;

    // Keep creation & last update timestamps
    payload.creationDate = apiData.creationDate || new Date().toISOString();
    payload.lastUpdate = new Date().toISOString();

    // Remove image/file fields ONLY if they are File objects (to prevent SQL type clash)
    // But KEEP them if they are strings (filenames), as the backend requires them ("Must declare scalar variable")
    const imageFieldsToCheck = [
      'originalPurchaseOrder',
      'processOrderConfirmation',
      'finalSpecs',
      'productImage',
      'ppComment',
      'sizeSetComment',
      'specsimage',
      'prodImgFileName',
      'poImgFileName',
    ];

    imageFieldsToCheck.forEach(field => {
      // If it's a File object (from new upload), revert to original string or empty string
      // We cannot send File objects to this endpoint
      if (payload[field] && typeof payload[field] === 'object' && payload[field].name) {
        // It's likely a File object
        payload[field] = apiData[field] || '';
      }
      // If it's undefined/null, ensure it's at least an empty string if required (though null might be valid for some)
      // But for "Must declare", the key must exist.
      if (payload[field] === undefined) {
        payload[field] = apiData[field] || '';
      }
    });

    // Special handling for PO Image (poImage) which requires base64
    if (form.image instanceof File) {
      payload.poImage = await convertFileToBase64(form.image);
      payload.poImgFileName = form.image.name;
    } else if (form.image === null) {
      // User explicitly deleted the image, pass empty string to clear it in DB
      payload.poImage = '';
      payload.poImgFileName = '';
    } else {
      // User didn't change it, keep existing. Pass null so COALESCE keeps the DB value
      payload.poImage = null;
      payload.poImgFileName = null;
    }

    return payload;
  };

  // Build payload for Milestone/UpdateStyle from editable grid rows
  const buildStyleUpdatePayload = (rows) => {
    if (!rows || rows.length === 0) return null;

    return rows.map((row) => ({
      styleID: row.styleId || 0,
      purchaseOrderID: Number(id) || 0,
      quantity: Number(row.quantity ?? 0),
      rate: Number(row.itemPrice ?? 0),
      remarks: row.remarks || '',
      vendorRate: Number(row.vendorPrice ?? 0),
      ldpRate: Number(row.ldpPrice ?? 0),
      cartonPerPcs: Number(row.cartonQty ?? 0),
      qrCodePOD: row.qrCodePOD || '',
      ratioPOD: row.ratio || '',
      grossWeightD: Number(row.grossWeight ?? 0),
      netWeightD: Number(row.netWeight ?? 0),
      barCodeTF: row.barcode || '',
      styleNo: row.styleNo || '',
      itemDescription: row.itemDescription || '',
      article: row.article || '',
      colorway: row.colorway || '',
      size: row.size || '',
      itemPrice: Number(row.itemPrice ?? 0),
      sizeRangeDBID: Number(row.sizeRangeDBID ?? 0),
      productCode: row.productCode || '',
    }));
  };

  const onSubmit = async (data) => {
    // Validate: at least one item/style must be added
    if (!savedItemData || !savedItemData.rows || savedItemData.rows.length === 0) {
      showSnackbar('Please add at least one Item Detail (style) before saving.', 'error');
      return;
    }

    try {
      const payload = await buildUpdatePayload(data, customers, suppliers, merchants, productPortfolios, productCategories, productGroups);
      if (!payload) {
        showSnackbar('Unable to build update payload. Please reload the page.', 'error');
        return;
      }

      await apiClient.post(`/MyOrders/UpdatePurchaseOrder?poid=${id}`, payload);

      // Also persist Product Specific Information grid rows (styles) via UpdateStyle API
      // We reuse the same single-row payload shape that works in handleUpdateStyleRow
      const allRows = savedItemData?.rows || [];

      // 1) Update existing styles (those having valid styleId)
      const existingRows = allRows.filter((row) => row.styleId);
      if (existingRows.length) {
        // eslint-disable-next-line no-restricted-syntax
        for (const row of existingRows) {
          const stylePayload = {
            styleID: row.styleId,
            quantity: Number(row.quantity ?? 0),
            rate: Number(row.itemPrice ?? 0),
            remarks: row.remarks || '',
            vendorRate: Number(row.vendorPrice ?? 0),
            ldpRate: Number(row.ldpPrice ?? 0),
            cartonPerPcs: Number(row.cartonQty ?? 0),
            qrCodePOD: row.qrCodePOD || '',
            ratioPOD: Number(row.ratio ?? 0),
            grossWeightD: Number(row.grossWeight ?? 0),
            netWeightD: Number(row.netWeight ?? 0),
            barCodeTF: row.barcode || '',
            styleNo: row.styleNo || '',
            itemDescription: row.itemDescription || '',
            article: row.article || '',
            colorway: row.colorway || '',
            size: row.size || '',
            itemPrice: Number(row.itemPrice ?? 0),
            sizeRangeDBID: Number(row.sizeRangeDBID ?? 0),
            productCode: row.productCode || '',
          };

          try {
            await apiClient.post(
              `/Milestone/UpdateStyle?poid=${id}&styleId=${row.styleId}`,
              stylePayload
            );
          } catch (styleError) {
            console.error(
              `Error updating style row styleID=${row.styleId} for PO=${id}`,
              styleError?.response?.data || styleError
            );
          }
        }
      }

      // 2) New styles are already inserted via AddPurchaseOrderDetails
      // from the Item Details dialog (handleSaveItemData). Here we only
      // need to refresh grid so latest data is shown after main Save.
      await fetchStyleGrid();

      // ---------------- FILE UPLOAD LOGIC ----------------
      // Backend now handles per-file overwrite (only deletes the specific slot being replaced).
      // So we only need to send fields that have a NEW File object selected by the user.
      try {
        if (id) {
          const formData = new FormData();
          let hasFiles = false;

          const appendIfNewOrRemoved = (fieldName, value, removeFlagName) => {
            if (value instanceof File) {
              formData.append(fieldName, value);
              hasFiles = true;
              console.log(`📎 Queuing new file for [${fieldName}]:`, value.name);
            } else if (value === null) {
              formData.append(removeFlagName, 'true');
              hasFiles = true;
              console.log(`🗑️ Queuing deletion for [${fieldName}]`);
            }
          };

          // NOTE: API parameter names must match exactly
          appendIfNewOrRemoved('orginalpurchaseorder', data.originalPurchaseOrder, 'removeOriginalPurchaseOrder');
          appendIfNewOrRemoved('productImage', data.productImage, 'removeProductImage');
          appendIfNewOrRemoved('process', data.processOrderConfirmation, 'removeProcess');
          appendIfNewOrRemoved('ppImage', data.ppComment, 'removePpImage');
          appendIfNewOrRemoved('finalSpecs', data.finalSpecs, 'removeFinalSpecs');
          appendIfNewOrRemoved('sizeSet', data.sizeSetComment, 'removeSizeSet');

          if (hasFiles) {
            console.log('📤 Uploading changed files for PO:', id);
            await apiClient.post(`/MyOrders/UploadPOFiles/${id}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 60000,
            });
            console.log('✅ Files uploaded successfully');
          } else {
            console.log('ℹ️ No new files selected, skipping upload.');
          }
        }
      } catch (uploadError) {
        console.error('❌ Error uploading files:', uploadError);
        showSnackbar('Purchase Order updated, but file upload failed.', 'warning');
      }
      // ---------------------------------------------------

      showSnackbar('Purchase Order and item details updated successfully!', 'success');
      setTimeout(() => navigate(-1), 1000);
    } catch (error) {
      console.error('Error submitting form:', error);
      showSnackbar('Error updating purchase order. Please try again.', 'error');
    }
  };

  const handleSaveAndEmail = async (data) => {
    try {
      await onSubmit(data);
      showSnackbar('Purchase Order saved and email sent!', 'success');
    } catch (error) {
      console.error('Error saving and emailing:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading purchase order data...
        </Typography>
      </Box>
    );
  }

  return (
    <FormProvider {...methods}>
      <Box
        sx={(theme) => ({
          bgcolor: theme.palette.grey[50],
          minHeight: '100vh',
          py: 4,
        })}
      >
        <Container maxWidth="xl">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Top Stepper */}
            <Box sx={{ py: 3 }}>
              <Stepper
                activeStep={activeStep}
                alternativeLabel
                sx={{
                  '& .MuiStepIcon-root.Mui-completed': {
                    color: 'primary.main',
                  },
                  '& .MuiStepLabel-label': {
                    fontWeight: 600,
                  },
                }}
              >
                {STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* ----------------- Section: Basic Order Info ----------------- */}
            {activeStep === 0 && (
              <Card sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ArrowBackIosIcon
                    sx={{
                      cursor: 'pointer',
                      mr: 1,
                      fontSize: '1.2rem',
                      color: 'primary.main',
                      '&:hover': { color: 'primary.dark' },
                    }}
                    onClick={() => navigate(-1)}
                  />
                  <Typography variant="h4">PURCHASE ORDER ENTRY </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="costingRef"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Costing Ref No."
                          select
                          fullWidth
                          size="medium"
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {costingLoading ? (
                            <MenuItem value="" disabled>
                              Loading...
                            </MenuItem>
                          ) : (
                            costingOptions.map((opt) => (
                              <MenuItem
                                key={opt.costingMstID ?? opt.costingNo}
                                value={String(opt.costingMstID)}
                              >
                                {opt.costingNo}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <SimpleImageUploadField name="image" label="PO Image" />
                  </Grid>

                  {[
                    { name: 'masterPo', label: 'Master PO. No.' },
                    { name: 'amsRef', label: 'AMS Ref No.' },
                    { name: 'customerPo', label: 'Customer PO. No.' },
                    { name: 'internalPo', label: 'Internal PO. No.' },
                    { name: 'rnNo', label: 'RN No.' },
                    { name: 'consignee', label: 'Consignee' },
                  ].map((item) => (
                    <Grid item xs={12} sm={6} key={item.name}>
                      <Controller
                        name={item.name}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label={item.label}
                            fullWidth
                            disabled={item.name === 'amsRef'}
                          />
                        )}
                      />
                    </Grid>
                  ))}

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="customer"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Customer"
                          fullWidth
                          select
                          disabled
                          value={field.value || ''}
                        >
                          <MenuItem value="">Select Customer</MenuItem>
                          {customers.map((customer) => (
                            <MenuItem key={customer.customerID} value={customer.customerName}>
                              {customer.customerName}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="supplier"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Supplier"
                          fullWidth
                          select
                          disabled
                          value={field.value || ''}
                        >
                          <MenuItem value="">Select Supplier</MenuItem>
                          {suppliers.map((supplier) => (
                            <MenuItem key={supplier.venderLibraryID} value={supplier.venderName}>
                              {supplier.venderName}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <MerchantMultipleSelect
                      name="merchant"
                      label="Merchant"
                      merchants={merchants}
                      selectedMerchantNames={selectedMerchantNames}
                    />
                  </Grid>

                  {[
                    {
                      name: 'proceedings',
                      label: 'Proceedings',
                      disabled: false,
                      options: [
                        { label: 'Supply Chain', value: 'Supply Chain' },
                        { label: 'Inspection Only', value: 'Inspection Only' },
                      ],
                    },
                    {
                      name: 'orderType',
                      label: 'Order Type',
                      disabled: false,
                      options: [
                        { label: 'New', value: 'New' },
                        { label: 'Repeat', value: 'Repeat' },
                      ],
                    },
                    {
                      name: 'transactions',
                      label: 'Transactions',
                      disabled: true,
                      options: [
                        { label: 'Services', value: 'Services' },
                        { label: 'Trade', value: 'Trade' },
                      ],
                    },
                    {
                      name: 'version',
                      label: 'Version',
                      disabled: false,
                      options: [
                        { label: 'Regular', value: 'Regular' },
                        { label: 'Promotion', value: 'Promotion' },
                        { label: 'Advertising', value: 'Advertising' },
                        { label: 'On-line', value: 'On-line' },
                      ],
                    },
                  ].map(({ name, label, options, disabled }) => (
                    <Grid item xs={12} sm={6} key={name}>
                      <Controller
                        name={name}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label={label}
                            fullWidth
                            select
                            disabled={disabled}
                            value={field.value || ''}
                          >
                            <MenuItem value="">Select</MenuItem>
                            {options.map((opt, idx) => (
                              <MenuItem key={idx} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>
                  ))}

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="commission"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Commission (%)"
                          type="number"
                          fullWidth
                          helperText="Auto-filled from selected customer"
                          value={
                            field.value !== undefined && field.value !== ''
                              ? Number(field.value).toFixed(2)
                              : ''
                          }
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="vendorCommission"
                      render={({ field }) => (
                        <TextField {...field} label="Vendor Commission (%)" type="number" fullWidth />
                      )}
                    />
                  </Grid>
                </Grid>
              </Card>
            )}

            {/* ----------------- Section: Important Dates + Shipment Windows ----------------- */}
            {activeStep === 1 && (
              <>
                <Card sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    PURCHASE ORDER IMPORTANT DATES
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { name: 'placementDate', label: 'Placement Date' },
                      { name: 'etaNewJerseyDate', label: 'ETA New Jersey Date' },
                      { name: 'etaWarehouseDate', label: 'ETA Warehouse Date' },
                    ].map(({ name, label }) => (
                      <Grid item xs={12} sm={4} key={name}>
                        <Controller
                          name={name}
                          control={control}
                          render={({ field, fieldState }) => (
                            <TextField
                              {...field}
                              label={label}
                              type="date"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              error={!!fieldState.error}
                              helperText={fieldState.error?.message}
                              onChange={(e) => {
                                field.onChange(e);
                                if (name === 'placementDate') {
                                  const val = e.target.value;
                                  const toLocal = (s) => { const [y, m, d] = s.split('-'); return new Date(y, m - 1, d); };
                                  clearErrors('placementDate');
                                  const vendorInit = getValues('vendorShipInitial');
                                  if (val && vendorInit && toLocal(vendorInit) <= toLocal(val))
                                    setError('vendorShipInitial', { type: 'manual', message: 'Vendor Ship. Dt. (Initial) must be after Placement Date' });
                                  else if (vendorInit) clearErrors('vendorShipInitial');
                                  const buyerInit = getValues('buyerShipInitial');
                                  if (val && buyerInit && toLocal(buyerInit) <= toLocal(val))
                                    setError('buyerShipInitial', { type: 'manual', message: 'Buyer Ship. Dt. (Initial) must be after Placement Date' });
                                  else if (buyerInit) clearErrors('buyerShipInitial');
                                }
                              }}
                            />
                          )}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Card>

                {/* ----------------- Section: Buyer Shipment ----------------- */}
                <Card sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    BUYER SHIPMENT WINDOW
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Buyer Ship. Dt. (Initial) */}
                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="buyerShipInitial"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Buyer Ship. Dt. (Initial)"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            onChange={(e) => {
                              field.onChange(e);
                              const val = e.target.value;
                              const toLocal = (s) => { const [y, m, d] = s.split('-'); return new Date(y, m - 1, d); };
                              if (!val) { clearErrors('buyerShipInitial'); return; }
                              // Validate vs vendorShipInitial
                              const vendorInit = getValues('vendorShipInitial');
                              // Validate vs placementDate
                              const placement = getValues('placementDate');
                              if (placement && toLocal(val) <= toLocal(placement)) {
                                setError('buyerShipInitial', { type: 'manual', message: 'Buyer Ship. Dt. (Initial) must be after Placement Date' });
                              } else {
                                clearErrors('buyerShipInitial');
                                const lastVal = getValues('buyerShipLast');
                                if (lastVal && toLocal(lastVal) < toLocal(val))
                                  setError('buyerShipLast', { type: 'manual', message: 'Buyer Ship. Dt. (Last) must be same or after Initial date' });
                                else if (lastVal) clearErrors('buyerShipLast');
                              }
                            }}
                          />
                        )}
                      />
                    </Grid>
                    {/* Buyer Ship. Dt. (Last) */}
                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="buyerShipLast"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Buyer Ship. Dt. (Last)"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            onChange={(e) => {
                              field.onChange(e);
                              const val = e.target.value;
                              const toLocal = (s) => { const [y, m, d] = s.split('-'); return new Date(y, m - 1, d); };
                              if (!val) { clearErrors('buyerShipLast'); return; }
                              const initVal = getValues('buyerShipInitial');
                              if (initVal && toLocal(val) < toLocal(initVal))
                                setError('buyerShipLast', { type: 'manual', message: 'Buyer Ship. Dt. (Last) must be same or after Initial date' });
                              else clearErrors('buyerShipLast');
                            }}
                          />
                        )}
                      />
                    </Grid>
                    {/* Revised Shipment Date (B) */}
                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="RevisedShipmentDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Revised Shipment Date (B):"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Card>

                {/* ----------------- Section: Vendor Shipment ----------------- */}
                <Card sx={{ p: 3, mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    VENDOR SHIPMENT WINDOW
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Vendor Ship. Dt. (Initial) */}
                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="vendorShipInitial"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Vendor Ship. Dt. (Initial)"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            onChange={(e) => {
                              field.onChange(e);
                              const val = e.target.value;
                              const toLocal = (s) => { const [y, m, d] = s.split('-'); return new Date(y, m - 1, d); };
                              if (!val) { clearErrors('vendorShipInitial'); return; }
                              // Validate vs placementDate
                              const placement = getValues('placementDate');
                              if (placement && toLocal(val) <= toLocal(placement)) {
                                setError('vendorShipInitial', { type: 'manual', message: 'Vendor Ship. Dt. (Initial) must be after Placement Date' });
                              } else {
                                clearErrors('vendorShipInitial');
                                const lastVal = getValues('vendorShipLast');
                                if (lastVal && toLocal(lastVal) < toLocal(val))
                                  setError('vendorShipLast', { type: 'manual', message: 'Vendor Ship. Dt. (Last) must be same or after Initial date' });
                                else if (lastVal) clearErrors('vendorShipLast');
                              }
                            }}
                          />
                        )}
                      />
                    </Grid>
                    {/* Vendor Ship. Dt. (Last) */}
                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="vendorShipLast"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Vendor Ship. Dt. (Last)"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            onChange={(e) => {
                              field.onChange(e);
                              const val = e.target.value;
                              const toLocal = (s) => { const [y, m, d] = s.split('-'); return new Date(y, m - 1, d); };
                              if (!val) { clearErrors('vendorShipLast'); return; }
                              const initVal = getValues('vendorShipInitial');
                              if (initVal && toLocal(val) < toLocal(initVal))
                                setError('vendorShipLast', { type: 'manual', message: 'Vendor Ship. Dt. (Last) must be same or after Initial date' });
                              else clearErrors('vendorShipLast');
                            }}
                          />
                        )}
                      />
                    </Grid>
                    {/* Revised Shipment Date (V) */}
                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="RevisedShipmentDateVendor"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Revised Shipment Date (V):"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                    {/* Final Inspection Date */}
                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="finalInspectionDate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Final Inspection Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            onChange={(e) => {
                              field.onChange(e);
                              clearErrors('finalInspectionDate');
                            }}
                          />
                        )}
                      />
                    </Grid>
                    {[
                      { name: 'reasonReviseBuyer', label: 'Reason of Revise Shipment Dates(B)' },
                      { name: 'reasonReviseVendor', label: 'Reason of Revise Shipment Dates(V)' },
                    ].map(({ name, label }) => (
                      <Grid item xs={12} key={name}>
                        <Controller
                          name={name}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label={label}
                              fullWidth
                              multiline
                              minRows={2}
                            />
                          )}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              </>
            )}

            {/* ----------------- Section: Product Portfolio ----------------- */}
            {activeStep === 2 && (
              <Box
                sx={(theme) => ({
                  backgroundColor: theme.palette.background.paper,
                  p: 3,
                  borderRadius: 2,
                  mb: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                })}
              >
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  PRODUCT INFORMATION
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="productPortfolio"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Product Portfolio</InputLabel>
                          <Select
                            {...field}
                            label="Product Portfolio"
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e);
                              // Reset dependent fields when portfolio changes
                              setValue('productCategory', '');
                              setValue('productGroup', '');
                            }}
                          >
                            <MenuItem value="">Select Portfolio</MenuItem>
                            {productPortfolios.map((portfolio) => (
                              <MenuItem key={portfolio.productPortfolioID} value={portfolio.productPortfolio}>
                                {portfolio.productPortfolio}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="productCategory"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Product Category</InputLabel>
                          <Select
                            {...field}
                            label="Product Category"
                            value={field.value || ''}
                            disabled={!selectedProductPortfolio}
                            onChange={(e) => {
                              field.onChange(e);
                              // Reset product group when category changes
                              setValue('productGroup', '');
                            }}
                          >
                            <MenuItem value="">Select Category</MenuItem>
                            {filteredProductCategories.map((category) => (
                              <MenuItem key={category.productCategoriesID} value={category.productCategories}>
                                {category.productCategories}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="productGroup"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Product Group</InputLabel>
                          <Select
                            {...field}
                            label="Product Group"
                            value={field.value || ''}
                            disabled={!selectedProductCategory}
                          >
                            <MenuItem value="">Select Group</MenuItem>
                            {filteredProductGroups.map((group) => (
                              <MenuItem key={group.productGroupID} value={group.productGroup}>
                                {group.productGroup}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller name="season" render={({ field }) => <TextField {...field} fullWidth label="Season" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="tolQuantity" render={({ field }) => <TextField {...field} fullWidth label="Tol. Quantity" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="set"
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Set</InputLabel>
                          <Select {...field} label="Set" value={field.value || ''}>
                            <MenuItem value="Set">Set</MenuItem>
                            <MenuItem value="PCS">PCS</MenuItem>
                            <MenuItem value="KG">KG</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller name="fabric" render={({ field }) => <TextField {...field} fullWidth label="Fabric" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="item" render={({ field }) => <TextField {...field} fullWidth label="Item" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="qualityComposition" render={({ field }) => <TextField {...field} fullWidth label="Quality / Composition" />} />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller name="gsm" render={({ field }) => <TextField {...field} fullWidth label="GSM" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="design" render={({ field }) => <TextField {...field} fullWidth label="Design" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="otherFabric" render={({ field }) => <TextField {...field} fullWidth label="Other Fabric" />} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller name="gsmOF" render={({ field }) => <TextField {...field} fullWidth label="GSM (O.F)" />} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller name="construction" render={({ field }) => <TextField {...field} fullWidth label="Construction" />} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller name="poSpecialOperation" render={({ field }) => <TextField {...field} fullWidth label="PO Special Operation" />} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="status"
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Status</InputLabel>
                          <Select {...field} label="Status" value={field.value || ''}>
                            <MenuItem value="Confirmed">Confirmed</MenuItem>
                            <MenuItem value="Cancel">Cancel</MenuItem>
                            <MenuItem value="Close">Close</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller name="poSpecialTreatment" render={({ field }) => <TextField {...field} fullWidth label="PO Special Treatment" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="styleSource" render={({ field }) => <TextField {...field} fullWidth label="Style Source" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="brand" render={({ field }) => <TextField {...field} fullWidth label="Brand" />} />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="assortment"
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Assortment</InputLabel>
                          <Select {...field} label="Assortment" value={field.value || ''}>
                            <MenuItem value="Solid">Solid</MenuItem>
                            <MenuItem value="Ratio">Ratio</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="ratio" render={({ field }) => <TextField {...field} fullWidth label="Ratio" disabled={assortmentValue === 'Solid'} />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="cartonMarking" render={({ field }) => <TextField {...field} fullWidth label="Carton Marking" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="poSpecialInstructions" render={({ field }) => <TextField {...field} fullWidth label="PO Special Instructions" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="washingCareLabel"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Washing Care Label Instructions"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Controller name="importantNote" render={({ field }) => <TextField {...field} fullWidth label="Important Note" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="moreInfo" render={({ field }) => <TextField {...field} fullWidth label="More Info" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="samplingRequirements" render={({ field }) => <TextField {...field} fullWidth label="Sampling Requirements" />} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="pcsPerCarton" render={({ field }) => <TextField {...field} fullWidth label="Pcs Per Carton" />} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="itemDescriptionShippingInvoice"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Item Description at shipping invoice"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <Controller name="grossWeight" render={({ field }) => <TextField {...field} fullWidth label="Gross Weight" />} />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Controller name="netWeight" render={({ field }) => <TextField {...field} fullWidth label="Net Weight" />} />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Controller
                      name="unit"
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Unit</InputLabel>
                          <Select {...field} label="Unit" value={field.value || ''}>
                            <MenuItem value="KG">KG</MenuItem>
                            <MenuItem value="DZN">DZN</MenuItem>
                            <MenuItem value="LBS">LBS</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="packingList"
                      control={control}
                      render={({ field }) => <TextField {...field} fullWidth label="Packing List" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="embEmbellishment"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Emb & Embellishment"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="inquiryNo"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Inquiry No</InputLabel>
                          <Select {...field} label="Inquiry No" value={field.value || ''}>
                            <MenuItem value="INQ001">INQ001</MenuItem>
                            <MenuItem value="INQ002">INQ002</MenuItem>
                            <MenuItem value="INQ003">INQ003</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="buyerCustomer"
                      control={control}
                      render={({ field }) => <TextField {...field} fullWidth label="Buyer Customer" />}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* ----------------- Product Specific Information ----------------- */}
            {activeStep === 3 && (
              <Card sx={{ p: 3, mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                    PRODUCT SPECIFIC INFORMATION
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="currency"
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Currency</InputLabel>
                            <Select {...field} label="Currency" value={field.value || ''}>
                              <MenuItem value="Dollar">Dollar</MenuItem>
                              <MenuItem value="PKR">PKR</MenuItem>
                              <MenuItem value="Euro">Euro</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="exchangeRate"
                        render={({ field }) => (
                          <TextField {...field} fullWidth label="Exchange Rate (to USD)" type="number" />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="style"
                        render={({ field }) => <TextField {...field} fullWidth label="Style" />}
                      />
                    </Grid>
                  </Grid>

                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                    <Button variant="contained" color="primary" onClick={handleOpenItemDialog}>
                      Add Item Details
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleShowSelections}>
                      {showSelections ? 'Hide Selections' : 'Show Selections'}
                    </Button>
                  </Stack>

                  {showSelections && savedItemData && (
                    <Box sx={{ mt: 3 }}>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Style #</TableCell>
                              <TableCell>Colorway</TableCell>
                              <TableCell>ProductCode</TableCell>
                              <TableCell>Size Range</TableCell>
                              <TableCell>Size</TableCell>
                              <TableCell>Barcode</TableCell>
                              <TableCell>Ratio</TableCell>
                              <TableCell>PO Quantity</TableCell>
                              <TableCell>Item Price</TableCell>
                              <TableCell>Value</TableCell>
                              <TableCell>Vendor Price</TableCell>
                              <TableCell>LDP Price</TableCell>
                              <TableCell>LDP Value</TableCell>
                              <TableCell>Carton Qty</TableCell>
                              <TableCell>Gross Weight</TableCell>
                              <TableCell>Net Weight</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {savedItemData.rows.map((row, index) => (
                              <TableRow key={index}>
                                <TableCell>{row.styleNo === 'string' ? '' : row.styleNo}</TableCell>
                                <TableCell>
                                  <TextField
                                    value={row.colorway === 'string' ? '' : (row.colorway || '')}
                                    size="small"
                                    onChange={(e) =>
                                      handleSelectionRowChange(index, 'colorway', e.target.value)
                                    }
                                    sx={{ width: 100 }}
                                  />
                                </TableCell>
                                <TableCell>{row.productCode === 'string' ? '' : row.productCode}</TableCell>
                                <TableCell>{row.sizeRange === 'string' ? '' : row.sizeRange}</TableCell>
                                <TableCell>{row.size === 'string' ? '' : row.size}</TableCell>
                                <TableCell>
                                  <TextField
                                    value={row.barcode || ''}
                                    size="small"
                                    onChange={(e) =>
                                      handleSelectionRowChange(index, 'barcode', e.target.value)
                                    }
                                    sx={{ width: 90 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    value={row.ratio || ''}
                                    size="small"
                                    onChange={(e) =>
                                      handleSelectionRowChange(index, 'ratio', e.target.value)
                                    }
                                    sx={{ width: 80 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    value={row.quantity === 0 ? '' : row.quantity ?? ''}
                                    type="number"
                                    size="small"
                                    onChange={(e) =>
                                      handleSelectionRowChange(index, 'quantity', e.target.value)
                                    }
                                    sx={{ width: 70 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    value={row.itemPrice === 0 ? '' : row.itemPrice ?? ''}
                                    type="number"
                                    size="small"
                                    onChange={(e) =>
                                      handleSelectionRowChange(index, 'itemPrice', e.target.value)
                                    }
                                    sx={{ width: 70 }}
                                  />
                                </TableCell>
                                <TableCell>{(row.value ?? 0).toFixed(2)}</TableCell>
                                <TableCell>
                                  <TextField
                                    value={row.vendorPrice === 0 ? '' : row.vendorPrice ?? ''}
                                    type="number"
                                    size="small"
                                    onChange={(e) =>
                                      handleSelectionRowChange(index, 'vendorPrice', e.target.value)
                                    }
                                    sx={{ width: 80 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    value={row.ldpPrice === 0 ? '' : row.ldpPrice ?? ''}
                                    type="number"
                                    size="small"
                                    onChange={(e) =>
                                      handleSelectionRowChange(index, 'ldpPrice', e.target.value)
                                    }
                                    sx={{ width: 80 }}
                                  />
                                </TableCell>
                                <TableCell>{(row.ldpValue ?? 0).toFixed(2)}</TableCell>
                                <TableCell>
                                  <TextField
                                    value={row.cartonQty === 0 ? '' : row.cartonQty ?? ''}
                                    type="number"
                                    size="small"
                                    onChange={(e) =>
                                      handleSelectionRowChange(index, 'cartonQty', e.target.value)
                                    }
                                    sx={{ width: 70 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    value={row.grossWeight === 0 ? '' : row.grossWeight ?? ''}
                                    type="number"
                                    size="small"
                                    onChange={(e) =>
                                      handleSelectionRowChange(index, 'grossWeight', e.target.value)
                                    }
                                    sx={{ width: 80 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    value={row.netWeight === 0 ? '' : row.netWeight ?? ''}
                                    type="number"
                                    size="small"
                                    onChange={(e) =>
                                      handleSelectionRowChange(index, 'netWeight', e.target.value)
                                    }
                                    sx={{ width: 80 }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={4}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Total Qty: {savedItemData.totals.totalQuantity}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Total Value: {savedItemData.totals.totalValue.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Total LDP Value: {savedItemData.totals.totalLdpValue.toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ----------------- Shipping and Payment Terms ----------------- */}
            {activeStep === 4 && (
              <Card sx={{ p: 3, mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    SHIPPING AND PAYMENT TERMS
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name="paymentMode"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Payment Mode</InputLabel>
                            <Select {...field} label="Payment Mode" value={field.value || ''}>
                              <MenuItem value="2">DP</MenuItem>
                              <MenuItem value="3">Dp/ap</MenuItem>

                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <Controller
                        name="shipmentTerm"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Shipment Term</InputLabel>
                            <Select {...field} label="Shipment Term" value={field.value || ''}>
                              <MenuItem value="4">CNF</MenuItem>
                              <MenuItem value="5">FOB</MenuItem>

                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <Controller
                        name="destination"
                        render={({ field }) => <TextField {...field} fullWidth label="Destination" />}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <Controller
                        name="shipmentMode"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Shipment Mode</InputLabel>
                            <Select {...field} label="Shipment Mode" value={field.value || ''}>
                              <MenuItem value="1">Air</MenuItem>
                              <MenuItem value="7">Sea</MenuItem>
                              <MenuItem value="8">courier</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name="naField"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="N/A"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* ----------------- Reference & Attachment Form ----------------- */}
            {activeStep === 5 && (
              <Card sx={{ p: 3, mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    REFERENCE & ATTACHMENT
                  </Typography>

                  <Grid container spacing={3}>
                    {[
                      { name: "originalPurchaseOrder", label: "Original Purchase Order" },
                      { name: "processOrderConfirmation", label: "Process at the time Order Confirmation" },
                      { name: "finalSpecs", label: "Final Specs" },
                      { name: "productImage", label: "Product Image" },
                      { name: "ppComment", label: "PP Comment Received" },
                      { name: "sizeSetComment", label: "Size Set Comment" },
                    ].map(({ name, label }) => (
                      <Grid item xs={12} sm={6} key={name}>
                        <FileUploadWithPreview
                          name={name}
                          label={label}
                          accept="image/*,.pdf,.doc,.docx"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* ----------------- Bank Detail Form ----------------- */}
            {activeStep === 6 && (
              <Card sx={{ p: 3, mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    BANK DETAILS
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="bankID"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Bank</InputLabel>
                            <Select {...field} label="Bank" value={field.value || ''}>
                              {bankLoading ? (
                                <MenuItem disabled>Loading...</MenuItem>
                              ) : bankError ? (
                                <MenuItem disabled>{bankError}</MenuItem>
                              ) : bankOptions.length > 0 ? (
                                bankOptions.map((bank) => (
                                  <MenuItem
                                    key={bank.bankID}
                                    value={String(bank.bankID)}
                                  >
                                    {bank.bankName}
                                  </MenuItem>
                                ))
                              ) : (
                                <MenuItem disabled>No banks found</MenuItem>
                              )}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="titleOfAccount"
                        render={({ field }) => (
                          <TextField {...field} label="Title Of Account" fullWidth />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="bankName"
                        render={({ field }) => <TextField {...field} label="Bank Name" fullWidth />}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="bankBranch"
                        render={({ field }) => <TextField {...field} label="Bank Branch" fullWidth />}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="accountNo"
                        render={({ field }) => <TextField {...field} label="Account No." fullWidth />}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Controller
                        name="routingNo"
                        render={({ field }) => <TextField {...field} label="Routing No." fullWidth />}
                      />
                    </Grid>
                  </Grid>

                  <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
                    <LoadingButton
                      type="submit"
                      variant="contained"
                      color="primary"
                      loading={isSubmitting}
                    >
                      Save
                    </LoadingButton>
                    <LoadingButton
                      type="button"
                      variant="contained"
                      color="primary"
                      loading={isSubmitting}
                      onClick={handleSubmit(handleSaveAndEmail)}
                    >
                      Save & Email
                    </LoadingButton>
                    <Button
                      type="button"
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Step navigation buttons */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 2,
                mb: 4,
              }}
            >
              <Button
                type="button"
                variant="outlined"
                color="primary"
                disabled={activeStep === 0}
                onClick={handlePrevStep}
              >
                Back
              </Button>

              {!isLastStep && (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  onClick={handleNextStep}
                >
                  Next
                </Button>
              )}
            </Box>
          </form>
        </Container>
      </Box>

      {/* Item Details Dialog */}
      <ItemDetailsDialog
        open={openItemDialog}
        onClose={handleCloseItemDialog}
        onSaveData={handleSaveItemData}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </FormProvider>
  );
}