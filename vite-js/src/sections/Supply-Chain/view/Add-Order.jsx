
import * as Yup from 'yup';
import { useRef, useState, useEffect } from 'react';
import { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Autocomplete, createFilterOptions } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

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
import { useTheme } from '@mui/material/styles';
import LoadingButton from '@mui/lab/LoadingButton';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import DeleteIcon from '@mui/icons-material/Delete';

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

// -------------------- File Upload Component with Preview --------------------
function FileUploadWithPreview({ name, label, accept = "image/*" }) {
  const { setValue, watch } = useFormContext();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const fileValue = watch(name);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue(name, file, { shouldValidate: true });
      
      // Create preview URL for all file types
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        // For all other files (PDF, Excel, Word, etc), create object URL
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      }
    }
  };

  const handleRemoveFile = () => {
    // Cleanup object URL if exists
    if (previewUrl && !previewUrl.startsWith('data:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setValue(name, null, { shouldValidate: true });
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreviewClick = () => {
    if (previewUrl && fileValue) {
      const fileType = fileValue.type;
      const fileName = fileValue.name;
      const fileExtension = fileName.split('.').pop().toLowerCase();
      
      // For images, show full screen preview
      if (fileType.startsWith('image/')) {
        setFullScreenOpen(true);
      } 
      // For Word files, download instead (can't preview locally)
      else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileType === 'application/msword' ||
               fileExtension === 'doc' || fileExtension === 'docx') {
        // Create download link for Word files
        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      // For PDF and Excel, open in new tab
      else {
        window.open(previewUrl, '_blank');
      }
    }
  };

  const handleCloseFullScreen = () => {
    setFullScreenOpen(false);
  };

  // Reset preview when form is reset
  useEffect(() => {
    if (!fileValue) {
      setPreviewUrl('');
    }
    // Cleanup on unmount
    return () => {
      if (previewUrl && !previewUrl.startsWith('data:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [fileValue, previewUrl]);

  const isImage = fileValue?.type?.startsWith('image/');
  const isPDF = fileValue?.type === 'application/pdf';
  const isExcel = fileValue?.type === 'application/vnd.ms-excel' || 
                  fileValue?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const isWord = fileValue?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 fileValue?.type === 'application/msword';
  const isOtherFile = fileValue && !isImage && !isPDF && !isExcel && !isWord;
  const canPreview = isImage || isPDF || isExcel || isWord || isOtherFile;

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
      
      {fileValue && (
        <Box sx={{ mt: 1, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="body2" noWrap>
                {fileValue.name}
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
                Open File Preview
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
 
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue(name, file, { shouldValidate: true });
      
      // Create preview URL
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
    if (previewUrl) {
      setFullScreenOpen(true);
    }
  };

  const handleCloseFullScreen = () => {
    setFullScreenOpen(false);
  };

  // Reset preview when form is reset
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
            value={imageValue?.name || ''}
            InputProps={{
              endAdornment: previewUrl && (
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
      
      {/* Image Preview */}
      {previewUrl && (
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

      {/* Full Screen Preview Dialog */}
      <FullScreenImagePreview
        open={fullScreenOpen}
        imageUrl={previewUrl}
        onClose={handleCloseFullScreen}
      />
    </Box>
  );
}

// -------------------- Validation Schema for Item Details --------------------
const ItemDetailsSchema = Yup.object().shape({
  styleNo: Yup.string().required('Style No is required'),
  colorway: Yup.string()
    .required('Colorway is required')
    .matches(/^[A-Za-z\s-]+$/, 'Only alphabets are allowed in Colorway'),
  productCode: Yup.string().required('Product Code is required'),
  itemPrice: Yup.number()
    .required('Item Price is required')
    .positive('Item Price must be positive')
    .typeError('Item Price must be a number'),
  ldpPrice: Yup.number()
    .required('LDP Price is required')
    .positive('LDP Price must be positive')
    .typeError('LDP Price must be a number'),
  sizeRange: Yup.string().required('Size Range is required'),
  sizeRangeDBID: Yup.number()
    .typeError('Size Range ID is required')
    .min(1, 'Size Range ID is required')
    .required('Size Range ID is required'),
});

// -------------------- Item Details Dialog Component --------------------
function ItemDetailsDialog({ open, onClose, onSaveData }) {
  const [totals, setTotals] = useState({
    totalQuantity: 0,
    totalValue: 0,
    totalLdpValue: 0,
  });
  const { handleSubmit, control, reset, setValue, formState: { errors, isValid } } = useForm({
    resolver: yupResolver(ItemDetailsSchema),
    defaultValues: {
      styleNo: '',
      colorway: '',
      productCode: '',
      itemPrice: '',
      ldpPrice: '',
      sizeRange: '',
      sizeRangeDBID: 0,
    },
    mode: 'onChange',
  });

  const [rows, setRows] = useState([]);
  const [sizeRangeData, setSizeRangeData] = useState([]);
  const [sizeRangeOptions, setSizeRangeOptions] = useState([]);
  const [loadingSizeRanges, setLoadingSizeRanges] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch size ranges from API
  useEffect(() => {
    const fetchSizeRanges = async () => {
      setLoadingSizeRanges(true);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetSizeRange`, { headers });
        
        if (Array.isArray(res.data)) {
          // Normalize to include DB ID so we can post it later (sizeRangeDBID key from API)
          const normalized = res.data
            .map((item) => ({
              id: Number(
                item.sizeRangeDBID ??
                item.sizeRangeDbId ??
                item.sizeRangeID ??
                item.sizeRangeId ??
                item.id ??
                0
              ),
              sizeRange: String(item.sizeRange ?? '').trim(),
              sizes: item.sizes,
            }))
            .filter((x) => x.sizeRange && x.sizeRange !== '');

          setSizeRangeData(normalized);

          // Remove duplicates based on sizeRange value
          const uniqueMap = new Map();
          normalized.forEach((x) => {
            if (!uniqueMap.has(x.sizeRange)) {
              uniqueMap.set(x.sizeRange, x);
            }
          });
          
          const uniqueOptions = Array.from(uniqueMap.values());
          console.log('Unique size range options loaded:', uniqueOptions.length);
          setSizeRangeOptions(uniqueOptions);
        }
      } catch (err) {
        console.error('Size range fetch error:', err);
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

  const onSubmit = (data) => {
    if (!isValid) {
      setFormError('Please fill all required fields correctly');
      return;
    }

    const sizes = generateSizes(data.sizeRange);
    
    const newRows = sizes.map((size) => ({
      styleNo: data.styleNo || '',
      colorway: data.colorway || '',
      productCode: data.productCode || '',
      sizeRange: data.sizeRange || '',
      sizeRangeDBID: Number(data.sizeRangeDBID || 0),
      size,
      // grid editable fields
      barcode: '',
      ratio: '',
      quantity: 0,
      itemPrice: parseFloat(data.itemPrice) || 0,
      value: 0,
      vendorPrice: 0,
      ldpPrice: parseFloat(data.ldpPrice) || 0,
      ldpValue: 0,
      cartonQty: 0,
      grossWeight: 0,
      netWeight: 0,
    }));
    
    setRows([...rows, ...newRows]);
    
    reset({
      styleNo: data.styleNo || '',
      colorway: data.colorway || '',
      productCode: data.productCode || '',
      itemPrice: data.itemPrice || '',
      ldpPrice: data.ldpPrice || '',
      sizeRange: '',
      sizeRangeDBID: 0,
    });
    setFormError('');
  };

  const generateSizes = (selectedSizeRange) => {
    if (!selectedSizeRange) return [''];
    
    const sizesForRange = sizeRangeData
      .filter(item => item.sizeRange === selectedSizeRange)
      .map(item => item.sizes);
    
    return sizesForRange.length > 0 ? sizesForRange : [selectedSizeRange];
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
              render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  label="Style No" 
                  fullWidth 
                  size="small" 
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  required
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Controller
              name="colorway"
              control={control}
              render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  label="Colorway" 
                  fullWidth 
                  size="small" 
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  required
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Controller
              name="productCode"
              control={control}
              render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  label="Product Code" 
                  fullWidth 
                  size="small" 
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  required
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Controller
              name="itemPrice"
              control={control}
              render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  label="Item Price" 
                  type="number" 
                  fullWidth 
                  size="small" 
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  required
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Controller
              name="ldpPrice"
              control={control}
              render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  label="LDP Price" 
                  type="number" 
                  fullWidth 
                  size="small" 
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  required
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Controller
              name="sizeRange"
              control={control}
              render={({ field, fieldState }) => (
                <Autocomplete
                  options={sizeRangeOptions}
                  loading={loadingSizeRanges}
                  getOptionLabel={(option) => String(option?.sizeRange || '')}
                  value={sizeRangeOptions.find((opt) => opt.sizeRange === field.value) || null}
                  onChange={(_, newValue) => {
                    const nextLabel = newValue?.sizeRange || '';
                    const nextId = Number(newValue?.id || 0);
                    field.onChange(nextLabel);
                    setValue('sizeRangeDBID', nextId, { shouldValidate: true });
                  }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    
                    const searchTerm = inputValue.toLowerCase();
                    const filtered = [];
                    
                    // First pass: collect matches
                    for (let i = 0; i < options.length && filtered.length < 100; i++) {
                      const label = String(options[i]?.sizeRange || '').toLowerCase();
                      if (label.includes(searchTerm)) {
                        filtered.push(options[i]);
                      }
                    }
                    
                    // Sort: starts-with first
                    filtered.sort((a, b) => {
                      const aLabel = String(a?.sizeRange || '').toLowerCase();
                      const bLabel = String(b?.sizeRange || '').toLowerCase();
                      
                      const aStarts = aLabel.startsWith(searchTerm);
                      const bStarts = bLabel.startsWith(searchTerm);
                      
                      if (aStarts && !bStarts) return -1;
                      if (!aStarts && bStarts) return 1;
                      return aLabel.localeCompare(bLabel);
                    });
                    
                    return filtered;
                  }}
                  ListboxProps={{
                    style: { maxHeight: 250 }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Size Range"
                      placeholder="Type to search..."
                      size="small"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      required
                    />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>

        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid}
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
                          onFocus={(e) => {
                            if (e.target.value === '0' || e.target.value === 0) {
                              e.target.select();
                            }
                          }}
                          onKeyDown={(e) => {
                            if ((e.target.value === '0' || e.target.value === 0) && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape' && e.key !== 'Backspace' && e.key !== 'Delete') {
                              e.target.value = '';
                            }
                          }}
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

// -------------------- Validation Schema --------------------
const Schema = Yup.object().shape({
  costingRef: Yup.string().nullable(),
  masterPo: Yup.string().nullable(),
  customer: Yup.string().required('Customer is required'),
  supplier: Yup.string().required('Supplier is required'),
  merchant: Yup.array().min(1, 'At least one merchant is required').required('Merchant is required'),
  proceedings: Yup.string().required('Proceedings is required'),
  orderType: Yup.string().required('Order Type is required'),
  transactions: Yup.string().required('Transactions is required'),
  version: Yup.string().required('Version is required'),
  amsRef: Yup.string(),
  customerPo: Yup.string(),
  commission: Yup.number()
    .transform((value) => (isNaN(value) ? undefined : parseFloat(value.toFixed(2))))
    .min(0, 'Commission cannot be negative')
    .max(100, 'Commission cannot exceed 100')
    .typeError('Commission must be a number'),
  vendorCommission: Yup.number().min(0).max(100),
  internalPo: Yup.string(),
  rnNo: Yup.string(),
  consignee: Yup.string(),
  image: Yup.mixed().nullable(),
  placementDate: Yup.date().required('Placement Date is required'),
  etaNewJerseyDate: Yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .notRequired(),
  etaWarehouseDate: Yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .notRequired(),
  buyerShipInitial: Yup.date().required('Buyer Ship. Dt. (Initial) is required'),
  buyerShipLast: Yup.date().required('Buyer Ship. Dt. (Last) is required'),
  vendorShipInitial: Yup.date().required('Vendor Ship. Dt. (Initial) is required'),
  vendorShipLast: Yup.date().required('Vendor Ship. Dt. (Last) is required'),
  finalInspectionDate: Yup.date().required('Final Inspection Date is required'),
  reasonReviseBuyer: Yup.string(),
  reasonReviseVendor: Yup.string(),

  productPortfolio: Yup.string(),
  productCategory: Yup.string(),
  productGroup: Yup.string(),
  season: Yup.string(),
  tolQuantity: Yup.string(),
  set: Yup.string(),
  fabric: Yup.string(),
  item: Yup.string(),
  qualityComposition: Yup.string(),
  gsm: Yup.string(),
  design: Yup.string(),
  otherFabric: Yup.string(),
  gsmOF: Yup.string(),
  construction: Yup.string(),
  poSpecialOperation: Yup.string(),
  status: Yup.string(),
  poSpecialTreatment: Yup.string(),
  styleSource: Yup.string(),
  brand: Yup.string(),
  assortment: Yup.string(),
  ratio: Yup.string(),
  cartonMarking: Yup.string(),
  poSpecialInstructions: Yup.string(),
  washingCareLabel: Yup.string(),
  importantNote: Yup.string(),
  moreInfo: Yup.string(),
  samplingRequirements: Yup.string(),
  pcsPerCarton: Yup.string(),
  grossWeight: Yup.string(),
  netWeight: Yup.string(),
  unit: Yup.string(),
  packingList: Yup.string(),
  embEmbellishment: Yup.string(),
  inquiryNo: Yup.string(),
  buyerCustomer: Yup.string(),
  itemDescriptionShippingInvoice: Yup.string(),

  currency: Yup.string(),
  exchangeRate: Yup.string(),
  style: Yup.string(),

  paymentMode: Yup.string(),
  shipmentTerm: Yup.string(),
  destination: Yup.string(),
  shipmentMode: Yup.string(),

  bankName: Yup.string(),
  routingNo: Yup.string(),
  bankBranch: Yup.string(),
  bankID: Yup.string(),
  titleOfAccount: Yup.string(),
  accountNo: Yup.string(),
});

// -------------------- Default Values --------------------
const defaultValues = {
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
  naField: '',

  bankName: '',
  routingNo: '',
  bankBranch: '',
  bankID: '',
  titleOfAccount: '',
  accountNo: '',
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Normalize dropdown data from various master APIs
const normalizePaymentModes = (list = []) =>
  list
    .map((p) => ({
      id: String(
        p.paymentModeID ??
        p.PaymentModeID ??
        p.id ??
        p.code ??
        p.value ??
        ''
      ),
      name:
        p.paymentMode ??
        p.PaymentMode ??
        p.name ??
        p.description ??
        '',
    }))
    .filter((p) => p.id && p.name);

const normalizeShipmentTerms = (list = []) =>
  list
    .map((s) => ({
      id: String(
        s.deliveryTypeID ??
        s.shipmentTermID ??
        s.id ??
        s.code ??
        s.value ??
        ''
      ),
      name:
        s.deliveryType ??
        s.shipmentTerm ??
        s.name ??
        s.description ??
        '',
    }))
    .filter((s) => s.id && s.name);

const normalizeShipmentModes = (list = []) =>
  list
    .map((d) => ({
      id: String(
        d.shipmentModeID ??
        d.DeliveryModeID ??
        d.id ??
        d.code ??
        d.value ??
        ''
      ),
      name:
        d.shipmentMode ??
        d.shipmentModeName ??
        d.name ??
        d.description ??
        '',
    }))
    .filter((d) => d.id && d.name);

// -------------------- Merchant Multiple Select Component --------------------
function MerchantMultipleSelect({ name, label, options, loading, error }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error}>
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            multiple
            input={<OutlinedInput label={label} />}
            renderValue={(selected) => {
              if (!selected || selected.length === 0) return '';
              if (selected.length === 1) return selected[0];
              return `${selected.length} Items Checked`;
            }}
          >
            {loading ? (
              <MenuItem disabled>
                <CircularProgress size={24} />
                Loading...
              </MenuItem>
            ) : error ? (
              <MenuItem disabled>
                <Typography color="error">{error}</Typography>
              </MenuItem>
            ) : (
              options.map((opt) => (
                <MenuItem key={opt.userId} value={opt.userName}>
                  <Checkbox checked={field.value.indexOf(opt.userName) > -1} />
                  <ListItemText primary={opt.userName} />
                </MenuItem>
              ))
            )}
          </Select>
          {fieldState.error && (
            <Typography variant="caption" color="error">
              {fieldState.error.message}
            </Typography>
          )}
        </FormControl>
      )}
    />
  );
}

// -------------------- Main Component --------------------
export default function CompletePurchaseOrderForm() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const copyFromPo = location.state?.copyFromPo || null;
  const copyFromPoId = location.state?.copyFromPoId || copyFromPo?.id || null;
  const methods = useForm({
    resolver: yupResolver(Schema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    control,
    setValue,
    watch,
    getValues,
    setError,
    clearErrors,
    trigger,
  } = methods;

  
  const [files, setFiles] = useState({});
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [savedItemData, setSavedItemData] = useState(null);
  const [showSelections, setShowSelections] = useState(false);
  const [showCalculationFields, setShowCalculationFields] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  const handleNextStep = async () => {
    // Validate current step fields before moving to next step
    const currentValues = getValues();
    let hasErrors = false;
    let errorMessages = [];

    // Step 0: PURCHASE ORDER ENTRY
    if (activeStep === 0) {
      if (customerPoExists) {
        setError('customerPo', { type: 'manual', message: 'This PO already exists.' });
        errorMessages.push('Customer PO already exists');
        hasErrors = true;
      }
      if (internalPoExists) {
        setError('internalPo', { type: 'manual', message: 'This PO already exists.' });
        errorMessages.push('Internal PO already exists');
        hasErrors = true;
      }
      if (!currentValues.customer) {
        setError('customer', { type: 'manual', message: 'Customer is required' });
        errorMessages.push('Customer');
        hasErrors = true;
      }
      if (!currentValues.supplier) {
        setError('supplier', { type: 'manual', message: 'Supplier is required' });
        errorMessages.push('Supplier');
        hasErrors = true;
      }
      if (!currentValues.merchant || currentValues.merchant.length === 0) {
        setError('merchant', { type: 'manual', message: 'At least one merchant is required' });
        errorMessages.push('Merchant');
        hasErrors = true;
      }
      if (!currentValues.proceedings) {
        setError('proceedings', { type: 'manual', message: 'Proceedings is required' });
        errorMessages.push('Proceedings');
        hasErrors = true;
      }
      if (!currentValues.orderType) {
        setError('orderType', { type: 'manual', message: 'Order Type is required' });
        errorMessages.push('Order Type');
        hasErrors = true;
      }
      if (!currentValues.transactions) {
        setError('transactions', { type: 'manual', message: 'Transactions is required' });
        errorMessages.push('Transactions');
        hasErrors = true;
      }
      if (!currentValues.version) {
        setError('version', { type: 'manual', message: 'Version is required' });
        errorMessages.push('Version');
        hasErrors = true;
      }
    }

    // Step 1: PURCHASE ORDER IMPORTANT DATES
    if (activeStep === 1) {
      if (!currentValues.placementDate) {
        setError('placementDate', { type: 'manual', message: 'Placement Date is required' });
        errorMessages.push('Placement Date');
        hasErrors = true;
      }
      const toLocal = (s) => { const [y,m,d] = s.split('-'); return new Date(y, m-1, d); };

      if (!currentValues.buyerShipInitial) {
        setError('buyerShipInitial', { type: 'manual', message: 'Buyer Ship. Dt. (Initial) is required' });
        errorMessages.push('Buyer Ship. Dt. (Initial)');
        hasErrors = true;
      }

      if (!currentValues.buyerShipLast) {
        setError('buyerShipLast', { type: 'manual', message: 'Buyer Ship. Dt. (Last) is required' });
        errorMessages.push('Buyer Ship. Dt. (Last)');
        hasErrors = true;
      } else if (
        currentValues.buyerShipInitial &&
        toLocal(currentValues.buyerShipLast) < toLocal(currentValues.buyerShipInitial)
      ) {
        setError('buyerShipLast', { type: 'manual', message: 'Buyer Ship. Dt. (Last) must be same or after Initial date' });
        errorMessages.push('Buyer Ship. Dt. (Last) must be after Initial');
        hasErrors = true;
      }

      if (!currentValues.vendorShipInitial) {
        setError('vendorShipInitial', { type: 'manual', message: 'Vendor Ship. Dt. (Initial) is required' });
        errorMessages.push('Vendor Ship. Dt. (Initial)');
        hasErrors = true;
      }

      if (!currentValues.vendorShipLast) {
        setError('vendorShipLast', { type: 'manual', message: 'Vendor Ship. Dt. (Last) is required' });
        errorMessages.push('Vendor Ship. Dt. (Last)');
        hasErrors = true;
      } else if (
        currentValues.vendorShipInitial &&
        toLocal(currentValues.vendorShipLast) < toLocal(currentValues.vendorShipInitial)
      ) {
        setError('vendorShipLast', { type: 'manual', message: 'Vendor Ship. Dt. (Last) must be same or after Initial date' });
        errorMessages.push('Vendor Ship. Dt. (Last) must be after Initial');
        hasErrors = true;
      }

      if (!currentValues.finalInspectionDate) {
        setError('finalInspectionDate', { type: 'manual', message: 'Final Inspection Date is required' });
        errorMessages.push('Final Inspection Date');
        hasErrors = true;
      } else if (
        currentValues.vendorShipInitial &&
        toLocal(currentValues.finalInspectionDate) < toLocal(currentValues.vendorShipInitial)
      ) {
        setError('finalInspectionDate', { type: 'manual', message: 'Final Inspection Date must be same or after Vendor Ship. Dt. (Initial)' });
        errorMessages.push('Final Inspection Date must be after Vendor Initial');
        hasErrors = true;
      }
    }

    // Show error message if validation fails
    if (hasErrors) {
      setSnackbar({
        open: true,
        message: `Please fill the following required fields: ${errorMessages.join(', ')}`,
        severity: 'error',
      });
      // Scroll to top to show errors
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // If validation passes, move to next step
    setActiveStep((prev) => {
      const next = Math.min(prev + 1, STEPS.length - 1);
      // Scroll to top on every Next click
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return next;
    });
  };

  const handlePrevStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  // API States
  const [costingOptions, setCostingOptions] = useState([]);
  const [costingLoading, setCostingLoading] = useState(false);
  const [costingError, setCostingError] = useState(null);
  
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState(null);
  
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState(null);

  // For mapping merchant ID from copied PO to merchant select options
  const [copiedMarchandId, setCopiedMarchandId] = useState(null);
  const [copiedCustomerId, setCopiedCustomerId] = useState(null);
  const [copiedSupplierId, setCopiedSupplierId] = useState(null);

  // If navigated from My-Order "Copy" icon, pre-fill fields from full Purchase Order API
  useEffect(() => {
    if (!copyFromPoId && !copyFromPo) return;

    // Preserve whatever AMS Ref No is currently set (usually from GetNextAMSRefNo)
    const currentAmsRef = getValues('amsRef');

    const toDateOnly = (value) => {
      if (!value || typeof value !== 'string') return '';
      if (value.includes('T')) return value.split('T')[0];
      return value.length >= 10 ? value.substring(0, 10) : value;
    };

    const prefillFromRowFallback = () => {
      if (!copyFromPo) return;
      const fallback = {
        ...defaultValues,
        customerPo: copyFromPo.poNo || '',
        customer: copyFromPo.customer || '',
        supplier: copyFromPo.supplier || '',
      };
      methods.reset(fallback);
      // Restore AMS Ref so it stays as newly generated value
      setValue('amsRef', currentAmsRef);
    };

    const fetchAndPrefill = async () => {
      if (!copyFromPoId) {
        prefillFromRowFallback();
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          `${API_BASE_URL}/api/MyOrders/GetPurchaseOrder/${copyFromPoId}`,
          { headers }
        );

        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!data) {
          prefillFromRowFallback();
          return;
        }

        const order = data;

        const prefilled = {
          ...defaultValues,

          // Basic Order Info
          masterPo: order.masterPO || order.masterPo || '',
          image: order.poImage || null,
          customerPo: order.pono || order.PONO || order.poNo || '',
          internalPo: order.internalPONO || order.internalPo || '',
          rnNo: order.rnNo || '',
          consignee: order.consignee || '',

          // Customer & Supplier - fall back to row data if API doesn't include names
          customer:
            order.customerName ||
            order.customer ||
            order.buyer ||
            (copyFromPo?.customer ?? ''),
          supplier:
            order.venderName ||
            order.vendorName ||
            order.supplier ||
            order.vendor ||
            (copyFromPo?.supplier ?? ''),

          proceedings: order.proceedings || '',
          orderType: order.pOtype || order.orderType || defaultValues.orderType,
          transactions: order.transactions || defaultValues.transactions,
          version: order.version || defaultValues.version,
          commission: order.commission ?? defaultValues.commission,
          vendorCommission: order.vendorCommission ?? defaultValues.vendorCommission,

          // Product Information
          productPortfolio: order.productPortfolioID ?? defaultValues.productPortfolio,
          productCategory: order.productCategoriesID ?? defaultValues.productCategory,
          productGroup: order.productGroupID ?? defaultValues.productGroup,
          season: order.season || '',
          fabric: order.fabric || '',
          item: order.item || '',
          design: order.design || '',
          otherFabric: order.otherFabric || '',
          construction: order.construction || '',
          status: order.status || defaultValues.status,
          styleSource: order.styleSource || '',
          brand: order.brand || '',
          assortment: order.assortment || '',
          ratio: order.ration || '',
          cartonMarking: order.cartonMarking || '',
          poSpecialInstructions: order.pO_Special_Instructions || '',
          washingCareLabel:
            order.washingCareLabelInstructions || defaultValues.washingCareLabel,
          importantNote: order.importantNote || '',
          moreInfo: order.moreInfo || '',
          samplingRequirements: order.samplingReq || '',
          pcsPerCarton: order.pcPerCarton ?? defaultValues.pcsPerCarton,
          grossWeight: order.grossWeight ?? defaultValues.grossWeight,
          netWeight: order.netWeight ?? defaultValues.netWeight,
          unit: order.grossAndNetWeight || defaultValues.unit,
          packingList: order.packingList || '',
          embEmbellishment:
            order.embAndEmbellishment || defaultValues.embEmbellishment,
          buyerCustomer: order.buyerCustomer || '',
          itemDescriptionShippingInvoice:
            order.itemDescriptionShippingInvoice || '',

          // Product Specific Information
          currency: order.currency || defaultValues.currency,
          exchangeRate: order.exchangeRate ?? defaultValues.exchangeRate,
          style: order.styleNo || order.design || defaultValues.style,

          // Shipping and Payment Terms
          // We save: shipmentMode <- shipmentMode (Air/Sea/etc)
          //          deliveryType <- shipmentTerm (CNF/FOB/etc)
          paymentMode: order.paymentMode || defaultValues.paymentMode,
          shipmentTerm: order.deliveryType || order.shipmentTerm || defaultValues.shipmentTerm,
          destination: order.destination || defaultValues.destination,
          shipmentMode: order.shipmentMode || defaultValues.shipmentMode,

          // Bank Details
          bankName: order.bankName || '',
          bankBranch: order.bankBranch || '',
          titleOfAccount: order.titleOfAccount || '',
          accountNo: order.accountNo || '',
          bankID:
            order.bankID !== undefined && order.bankID !== null
              ? String(order.bankID)
              : defaultValues.bankID,

          // Other numeric fields
          tolQuantity: order.toleranceindays ?? defaultValues.tolQuantity,
          set: order.poQtyUnit || defaultValues.set,
          qualityComposition: order.quality ?? defaultValues.qualityComposition,
          gsm: order.gms ?? defaultValues.gsm,
          gsmOF: order.costingMstID ?? defaultValues.gsmOF,
          poSpecialOperation: order.pO_Special_Operation || '',
          poSpecialTreatment: order.pO_Special_Treatement || '',
          inquiryNo: order.inquiryMstID
            ? `INQ${order.inquiryMstID}`
            : defaultValues.inquiryNo,
        };

        methods.reset(prefilled);
        // Restore AMS Ref so it continues to use the newly generated number
        setValue('amsRef', currentAmsRef);

        // Save IDs for later dropdown mapping
        if (order.marchandID) {
          setCopiedMarchandId(order.marchandID);
        }
        if (order.customerID) {
          setCopiedCustomerId(order.customerID);
        }
        if (order.supplierID) {
          setCopiedSupplierId(order.supplierID);
        }

        // Ensure dependent dropdown options are loaded for pre-selected IDs
        try {
          const token = localStorage.getItem('accessToken');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          // Load product categories for selected portfolio
          if (order.productPortfolioID) {
            setLoadingCategory(true);
            const catRes = await axios.get(
              `${API_BASE_URL}/api/MyOrders/GetProductCategories/${order.productPortfolioID}`,
              { headers }
            );
            setProductCategories(catRes.data || []);
          }

          // Load product groups for selected category
          if (order.productCategoriesID) {
            setLoadingGroup(true);
            const grpRes = await axios.get(
              `${API_BASE_URL}/api/MyOrders/GetProductGroups/${order.productCategoriesID}`,
              { headers }
            );
            setProductGroups(grpRes.data || []);
          }
        } catch (err) {
          console.error('Error pre-loading product category/group options:', err);
        } finally {
          setLoadingCategory(false);
          setLoadingGroup(false);
        }
      } catch (error) {
        console.error('Error pre-filling Add Order from existing PO:', error);
        prefillFromRowFallback();
      }
    };

    fetchAndPrefill();
  }, [copyFromPoId, copyFromPo, methods]);
  
  const [merchantOptions, setMerchantOptions] = useState([]);
  const [merchantLoading, setMerchantLoading] = useState(false);
  
  const [productPortfolios, setProductPortfolios] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);
  
  const [inquiryOptions, setInquiryOptions] = useState([]);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState(null);
  
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  
  const [shipmentOptions, setShipmentOptions] = useState([]);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [shipmentError, setShipmentError] = useState(null);
  
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState(null);
  
  const [bankOptions, setBankOptions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState(null);

  // Once merchants are loaded, map copied marchandID to merchant names for select
  useEffect(() => {
    if (!copiedMarchandId || !merchantOptions.length) return;
    const merchant = merchantOptions.find((m) => m.userId === copiedMarchandId);
    if (merchant) {
      setValue('merchant', [merchant.userName]);
    }
  }, [copiedMarchandId, merchantOptions, setValue]);

  // Once customers are loaded, map copied customerID to customer name for select
  useEffect(() => {
    if (!copiedCustomerId || !customerOptions.length) return;
    const customer = customerOptions.find(
      (c) => c.customerID === copiedCustomerId
    );
    if (customer) {
      setValue('customer', customer.customerName);
    }
  }, [copiedCustomerId, customerOptions, setValue]);

  // Once suppliers are loaded, map copied supplierID to supplier name for select
  useEffect(() => {
    if (!copiedSupplierId || !supplierOptions.length) return;
    const supplier = supplierOptions.find(
      (s) => s.venderLibraryID === copiedSupplierId
    );
    if (supplier) {
      setValue('supplier', supplier.venderName);
    }
  }, [copiedSupplierId, supplierOptions, setValue]);

  const selectedCustomer = watch('customer');
  const customerPoValue = watch('customerPo');

  // Customer PO uniqueness check
  const [checkingCustomerPo, setCheckingCustomerPo] = useState(false);
  const [customerPoExists, setCustomerPoExists] = useState(false);

  // Internal PO uniqueness check
  const internalPoValue = watch('internalPo');
  const [checkingInternalPo, setCheckingInternalPo] = useState(false);
  const [internalPoExists, setInternalPoExists] = useState(false);

  // Validate Customer PO against backend (AlreadyExistPONumber)
  useEffect(() => {
    // If field is empty, clear state and errors
    if (!customerPoValue) {
      setCustomerPoExists(false);
      clearErrors('customerPo');
      return;
    }

    let isActive = true;
    setCheckingCustomerPo(true);

    const handler = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Use base URL from env, do NOT hard-code IP
        const response = await axios.get(
          `${API_BASE_URL}/api/MyOrders/AlreadyExistPONumber`,
          {
            // Backend expects query param "PONO"
            params: { PONO: customerPoValue },
            headers,
          }
        );

        if (!isActive) return;

        const data = response.data;
        console.log('AlreadyExistPONumber response:', data);

        // API contract (from you):
        // { "message": "YES" }  -> PO already exists
        const exists = String(data?.message || '').toUpperCase() === 'YES';

        setCustomerPoExists(!!exists);

        if (exists) {
          setError('customerPo', {
            type: 'manual',
            message: 'This PO already exists.',
          });
        } else {
          clearErrors('customerPo');
        }
      } catch (error) {
        console.error('AlreadyExistPONumber check error:', error);
        // Network / server error pe user ko block nahi karte,
        // bas console me log karte hain; field error clear rehne dete.
      } finally {
        if (isActive) {
          setCheckingCustomerPo(false);
        }
      }
    }, 500); // debounce to avoid calling API on every single keystroke immediately

    return () => {
      isActive = false;
      clearTimeout(handler);
    };
  }, [customerPoValue, clearErrors, setError]);

  // Validate Internal PO against backend (AlreadyExistPONumber)
  useEffect(() => {
    if (!internalPoValue) {
      setInternalPoExists(false);
      clearErrors('internalPo');
      return;
    }

    let isActive = true;
    setCheckingInternalPo(true);

    const handler = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(
          `${API_BASE_URL}/api/MyOrders/AlreadyExistPONumber`,
          {
            params: { PONO: internalPoValue },
            headers,
          }
        );

        if (!isActive) return;

        const resData = response.data;
        const exists = String(resData?.message || '').toUpperCase() === 'YES';

        setInternalPoExists(!!exists);

        if (exists) {
          setError('internalPo', {
            type: 'manual',
            message: 'This PO already exists.',
          });
        } else {
          clearErrors('internalPo');
        }
      } catch (err) {
        console.error('InternalPO AlreadyExist check error:', err);
      } finally {
        if (isActive) setCheckingInternalPo(false);
      }
    }, 500);

    return () => {
      isActive = false;
      clearTimeout(handler);
    };
  }, [internalPoValue, clearErrors, setError]);

  // Handle file changes
  const handleFileChangeWithBase64 = async (field, file) => {
    if (file) {
      setFiles((prev) => ({
        ...prev,
        [field]: file,
      }));

      try {
        // Convert file to base64 for API
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            // Remove the data:image/...;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = error => reject(error);
        });
        
        console.log(`File "${file.name}" converted to base64 successfully! Length: ${base64.length} characters`);
        
      } catch (error) {
        console.error(`Error converting ${field} to base64:`, error);
        showSnackbar(`Error converting file to base64: ${error.message}`, 'error');
      }
    }
  };

  // Fetch APIs
  useEffect(() => {
    const fetchAPIs = async () => {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const apis = [
        { 
          name: 'costingRefs', 
          url: `${API_BASE_URL}/api/MyOrders/CostingRefNo`,
          setter: setCostingOptions,
          setLoading: setCostingLoading,
          setError: setCostingError
        },
        { 
          name: 'customers', 
          url: `${API_BASE_URL}/api/MyOrders/GetCustomer`,
          setter: setCustomerOptions,
          setLoading: setCustomerLoading,
          setError: setCustomerError
        },
        { 
          name: 'suppliers', 
          url: `${API_BASE_URL}/api/MyOrders/GetSupplier`,
          setter: setSupplierOptions,
          setLoading: setSupplierLoading,
          setError: setSupplierError
        },
        { 
          name: 'merchants', 
          url: `${API_BASE_URL}/api/MyOrders/GetMerchants`,
          setter: setMerchantOptions,
          setLoading: setMerchantLoading
        },
        { 
          name: 'portfolios', 
          url: `${API_BASE_URL}/api/MyOrders/GetProductPortfolio`,
          setter: setProductPortfolios,
          setLoading: setLoadingPortfolio
        },
        { 
          name: 'inquiries', 
          url: `${API_BASE_URL}/api/MyOrders/GetInquirySamples`,
          setter: setInquiryOptions,
          setLoading: setInquiryLoading,
          setError: setInquiryError
        },
        { 
          name: 'paymentModes', 
          url: `${API_BASE_URL}/api/MyOrders/GetPaymentModes`,
          setter: (data) => setPaymentOptions(normalizePaymentModes(data)),
          setLoading: setPaymentLoading,
          setError: setPaymentError,
        },
        { 
          name: 'shipmentModes', 
          url: `${API_BASE_URL}/api/MyOrders/GetDeliveryTypes`,
          setter: (data) => setShipmentOptions(normalizeShipmentTerms(data)),
          setLoading: setShipmentLoading,
          setError: setShipmentError,
        },
        { 
          name: 'deliveryTypes', 
          url: `${API_BASE_URL}/api/MyOrders/GetShipmentModes`,
          setter: (data) => setDeliveryOptions(normalizeShipmentModes(data)),
          setLoading: setDeliveryLoading,
          setError: setDeliveryError,
        },
        { 
          name: 'banks', 
          url: `${API_BASE_URL}/api/MyOrders/GetBanks`,
          setter: (data) => setBankOptions(data.map(b => ({ id: b.bankID, name: b.bankName }))),
          setLoading: setBankLoading,
          setError: setBankError
        }
      ];

      for (const api of apis) {
        try {
          api.setLoading(true);
          const res = await axios.get(api.url, { headers });
          const data = res.data;
          
          if (Array.isArray(data)) {
            api.setter(data);
          } else if (data) {
            api.setter([data]);
          } else {
            api.setter([]);
          }
        } catch (err) {
          console.error(`${api.name} fetch error:`, err);
          if (api.setError) {
            api.setError(err.response ? `Error ${err.response.status}: ${err.response.statusText}` : `Unable to load ${api.name}`);
          }
          api.setter([]);
        } finally {
          api.setLoading(false);
        }
      }

      // Fetch AMS Ref
      try {
        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetNextAMSRefNo`, { headers });
        if (res.data && res.data.amsRefNo) {
          setValue('amsRef', res.data.amsRefNo);
        }
      } catch (err) {
        console.error('AMS Ref fetch error:', err);
        setValue('amsRef', '');
      }
    };

    fetchAPIs();
  }, [setValue]);

  useEffect(() => {
    const fetchCommission = async () => {
      if (!selectedCustomer) {
        setValue('commission', 0);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const selectedCustomerObj = customerOptions.find(
          (customer) => customer.customerName === selectedCustomer
        );

        if (selectedCustomerObj && selectedCustomerObj.customerID) {
          const res = await axios.get(
            `${API_BASE_URL}/api/MyOrders/GetCommission/${selectedCustomerObj.customerID}`,
            { headers }
          );
          const commissionData = res.data;
          if (commissionData && commissionData.commission) {
            setValue('commission', parseFloat(commissionData.commission));
          } else {
            setValue('commission', 0);
          }
        }
      } catch (err) {
        console.error('Commission fetch error:', err);
        setValue('commission', 0);
      }
    };

    fetchCommission();
  }, [selectedCustomer, customerOptions, setValue]);

  const handlePortfolioChange = async (portfolioID) => {
    setValue('productPortfolio', portfolioID || '');
    setValue('productCategory', '');
    setValue('productGroup', '');
    setProductCategories([]);
    setProductGroups([]);

    if (!portfolioID) return;

    setLoadingCategory(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(
        `${API_BASE_URL}/api/MyOrders/GetProductCategories/${portfolioID}`,
        { headers }
      );
      setProductCategories(res.data || []);
    } catch (err) {
      console.error('Category fetch error:', err);
    } finally {
      setLoadingCategory(false);
    }
  };

  const handleCategoryChange = async (categoryID) => {
    setValue('productCategory', categoryID || '');
    setValue('productGroup', '');
    setProductGroups([]);

    if (!categoryID) return;

    setLoadingGroup(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(
        `${API_BASE_URL}/api/MyOrders/GetProductGroups/${categoryID}`,
        { headers }
      );
      setProductGroups(res.data || []);
    } catch (err) {
      console.error('Group fetch error:', err);
    } finally {
      setLoadingGroup(false);
    }
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileChangeWithBase64(field, file);
    }
  };

  const handleRemoveFile = (field) => {
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[field];
      return newFiles;
    });
  };

  const handleOpenItemDialog = () => {
    setOpenItemDialog(true);
  };

  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
  };

  const handleSaveItemData = (data) => {
    setSavedItemData(data);
  };

  // Prefill Item Details grid from existing PO items when copying
  // Uses same API as Purchase-order-edit.jsx: /Milestone/GetStyle?poid=
  useEffect(() => {
    if (!copyFromPoId) return;

    const prefillItemsFromExistingPO = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          `${API_BASE_URL}/api/Milestone/GetStyle?poid=${copyFromPoId}`,
          { headers }
        );

        const data = Array.isArray(res.data) ? res.data : [];
        if (data.length === 0) return;

        const rows = data.map((item) => {
          const quantity = Number(item.quantity || 0);
          const itemPrice = Number(item.itemPrice ?? item.rate ?? 0);
          const ldpPrice = Number(item.ldpRate ?? item.ldpPrice ?? 0);
          const value = quantity * itemPrice;
          const ldpValue = quantity * ldpPrice;

          return {
            styleId: item.styleID || item.styleId || 0,
            styleNo: item.styleNo || '',
            colorway: item.colorway || '',
            productCode: item.productCode || '',
            sizeRange: item.sizeRange || '',
            sizeRangeDBID: Number(item.sizeRangeDBID || item.sizeRangeId || 0),
            size: item.size || '',
            barcode: item.barCodeTF || item.barCodeTFPO || '',
            ratio: item.ratioPOD || item.ratio || 0,
            quantity,
            itemPrice,
            value,
            vendorPrice: Number(item.vendorRate ?? item.vendorPrice ?? 0),
            ldpPrice,
            ldpValue,
            cartonQty: Number(item.cartonPerPcs ?? item.cartonQty ?? 0),
            grossWeight: Number(item.grossWeightD ?? item.grossWeight ?? 0),
            netWeight: Number(item.netWeightD ?? item.netWeight ?? 0),
          };
        });

        const totals = {
          totalQuantity: rows.reduce((sum, r) => sum + (r.quantity || 0), 0),
          totalValue: rows.reduce((sum, r) => sum + (r.value || 0), 0),
          totalLdpValue: rows.reduce((sum, r) => sum + (r.ldpValue || 0), 0),
        };

        setSavedItemData({ rows, totals });
        setShowSelections(true);

        // Set Style field
        const styleNumbers = [...new Set(rows.map((r) => r.styleNo))].filter(Boolean).join(', ');
        if (styleNumbers) {
          setValue('style', styleNumbers);
        }
      } catch (err) {
        console.error('Error pre-filling item grid from existing PO:', err);
      }
    };

    prefillItemsFromExistingPO();
  }, [copyFromPoId, setValue]);

  const handleShowSelections = () => {
    if (!showSelections && savedItemData) {
      // Extract all unique style numbers from savedItemData.rows and join them with comma
      const styleNumbers = [...new Set(savedItemData.rows.map(row => row.styleNo))].join(', ');
      // Set the form value for 'style' field
      setValue('style', styleNumbers);
    }
    setShowSelections(!showSelections);
  };

  const recalculateItemTotals = (rows) => ({
    totalQuantity: rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
    totalValue: rows.reduce((sum, r) => sum + (Number(r.value) || 0), 0),
    totalLdpValue: rows.reduce((sum, r) => sum + (Number(r.ldpValue) || 0), 0),
  });

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

        return updated;
      });

      return {
        rows,
        totals: recalculateItemTotals(rows),
      };
    });
  };

  const handleSelectionRowRemove = (index) => {
    setSavedItemData((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.filter((_, i) => i !== index);
      return {
        rows,
        totals: recalculateItemTotals(rows),
      };
    });
  };

  const handleShowCalculationFields = () => {
    // Placeholder - previously used extra calculation fields, now removed
    setShowCalculationFields(false);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Helper functions for safe data conversion
  const safeParseInt = (value) => {
    if (!value && value !== 0) return 0;
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeParseFloat = (value) => {
    if (!value && value !== 0) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      // If it's a plain HTML date input value (YYYY-MM-DD), send it as-is with fixed time
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Send pure date string, let backend treat it as date-only (no timezone shift)
        return dateString;
      }

      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  };

  // Function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/...;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Map item grid rows to AddPurchaseOrderDetails API payload
  const mapItemRowsToDetailsPayload = (rows = []) =>
    rows.map((row) => ({
      quantity: Number(row.quantity || 0),
      rate: Number(row.itemPrice || 0),
      remarks: '', // can be wired later if a remarks field is added per row
      vendorRate: Number(row.vendorPrice || 0),
      ldpRate: Number(row.ldpPrice || 0),
      cartonPerPcs: Number(row.cartonQty || 0),
      qrCodePOD: '', // no QR field per row yet
      ratioPOD: Number(row.ratio || 0),
      grossWeightD: Number(row.grossWeight || 0),
      netWeightD: Number(row.netWeight || 0),
      barCodeTF: row.barcode || '',
      styleNo: row.styleNo || '',
      itemDescription: '', // can be mapped from form later
      article: '', // optional, not present in grid yet
      colorway: row.colorway || '',
      size: String(row.size ?? ''),
      itemPrice: Number(row.itemPrice || 0),
      sizeRangeDBID: Number(row.sizeRangeDBID || 0),
      productCode: row.productCode || '',
    }));

  // Safely extract newly created Purchase Order ID from API response
  const extractPurchaseOrderId = (responseData) => {
    if (!responseData) return null;

    // Numeric or numeric-string response
    if (typeof responseData === 'number') return responseData;
    if (typeof responseData === 'string' && !Number.isNaN(Number(responseData))) {
      return Number(responseData);
    }

    // Common property names from backend
    return (
      responseData.purchaseOrderID ??
      responseData.purchaseOrderId ??
      responseData.poid ??
      responseData.poId ??
      responseData.id ??
      null
    );
  };

  // Map form data to API format - COMPLETELY UPDATED FOR IMAGE HANDLING
  const mapFormDataToAPI = async (data) => {
    
    const selectedCustomerObj = customerOptions.find(c => c.customerName === data.customer);
    const selectedSupplierObj = supplierOptions.find(s => s.venderName === data.supplier);
    
    // Handle multiple merchants - take the first one for API compatibility
    const selectedMerchantNames = Array.isArray(data.merchant) ? data.merchant : [data.merchant];
    const selectedMerchantObj = merchantOptions.find(m => selectedMerchantNames.includes(m.userName));
    
    const selectedInquiryObj = inquiryOptions.find(i => i.sampleNo === data.inquiryNo);

    // Convert all files to base64
    const convertFileToBase64 = async (file) => {
      if (!file) return '';
      try {
        return await fileToBase64(file);
      } catch (error) {
        console.error('Error converting file to base64:', error);
        return '';
      }
    };

    // Convert all images to base64
    const poImageBase64 = await convertFileToBase64(files.image);
    const productImageBase64 = await convertFileToBase64(files.productImage);
    const finalSpecsBase64 = await convertFileToBase64(files.finalSpecs);
    const ppCommentBase64 = await convertFileToBase64(files.ppComment);
    const sizeSetCommentBase64 = await convertFileToBase64(files.sizeSetComment);

    console.log('🖼️ Image Conversion Results:', {
      poImage: poImageBase64 ? `✅ (${poImageBase64.length} chars)` : '❌ Missing',
      productImage: productImageBase64 ? `✅ (${productImageBase64.length} chars)` : '❌ Missing',
      finalSpecs: finalSpecsBase64 ? `✅ (${finalSpecsBase64.length} chars)` : '❌ Missing',
      ppComment: ppCommentBase64 ? `✅ (${ppCommentBase64.length} chars)` : '❌ Missing',
      sizeSetComment: sizeSetCommentBase64 ? `✅ (${sizeSetCommentBase64.length} chars)` : '❌ Missing'
    });

    const apiData = {
      pono: data.internalPo || '',
      internalPONO: data.internalPo || '',
      creationDate: new Date().toISOString(),
      status: data.status || '',
      pOtype: data.orderType || '',
      
      // Convert IDs to numbers
      customerID: selectedCustomerObj?.customerID ? safeParseInt(selectedCustomerObj.customerID) : 0,
      supplierID: selectedSupplierObj?.venderLibraryID ? safeParseInt(selectedSupplierObj.venderLibraryID) : 0,
      marchandID: selectedMerchantObj?.userId ? safeParseInt(selectedMerchantObj.userId) : 0,
      
      placementDate: formatDate(data.placementDate),
      shipmentDate: formatDate(data.buyerShipInitial),
      vendorExIndiaShipmentDate: formatDate(data.vendorShipInitial),
      
      commission: safeParseFloat(data.commission),
      toleranceindays: data.tolQuantity || '',
      tolerance: formatDate(data.buyerShipLast),
      buyerExIndiaTolerance: formatDate(data.buyerShipLast),
      
      timeSpame: 0,
      productGroup: data.productGroup || '',
      season: data.season || '',
      quality: data.qualityComposition || '',
      construction: data.construction || '',
      shipmentMode: data.shipmentMode || '',
      paymentMode: data.paymentMode || '',
      paymentType: data.paymentMode || '',
      ekNumber: '',
      deliveryType: data.shipmentTerm || '',
      currency: data.currency || '',
      poRefNo: data.costingRef || '',
      design: data.design || '',
      exchangeRate: safeParseFloat(data.exchangeRate),
      exchangeDate: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      
      xmlFileName: '',
      buyerName: data.customer || '',
      buyingDepartment: '',
      contactName: '',
      buyerStreet: '',
      buyerZip: '',
      buyerCity: '',
      buyerCountry: '',
      contactPhone: '',
      contactFax: '',
      contactEmail: '',
      deliveryName: '',
      deliveryStreet: '',
      deliveryZip: '',
      deliveryCity: '',
      airFreight: '',
      seaFreight: '',
      
      // Convert portfolio/category/group IDs to numbers
      productPortfolioID: safeParseInt(data.productPortfolio),
      productCategoriesID: safeParseInt(data.productCategory),
      productGroupID: safeParseInt(data.productGroup),
      
      proceedings: data.proceedings || '',
      transactions: data.transactions || '',
      destination: data.destination || '',
      vendorCommission: safeParseFloat(data.vendorCommission),
      productImage: productImageBase64, // Base64 string
      revisedShipmenttVendor: data.reasonReviseVendor || '',
      version: data.version || '',
      reasonCancellation: '',
      itemDescriptionShippingInvoice: data.itemDescriptionShippingInvoice || '',
      titleOfAccount: data.titleOfAccount || '',
      bankName: data.bankName || '',
      bankBranch: data.bankBranch || '',
      accountNo: data.accountNo || '',
      iban: data.routingNo || '',
      pO_Special_Instructions: data.poSpecialInstructions || '',
      gms: data.gsm || '',
      pO_Special_Operation: data.poSpecialOperation || '',
      pO_Special_Treatement: data.poSpecialTreatment || '',
      styleSource: data.styleSource || '',
      rnNo: data.rnNo || '',
      brand: data.brand || '',
      consignee: data.consignee || '',
      ration: data.ratio || '',
      otherFabric: data.otherFabric || '',
      packingList: data.packingList || '',
      ribGSM: data.gsmOF || '',
      fabric: data.fabric || '',
      item: data.item || '',
      cartonMarking: data.cartonMarking || '',
      washingCareLabelInstructions: data.washingCareLabel || '',
      importantNote: data.importantNote || '',
      moreInfo: data.moreInfo || '',
      pcPerCarton: safeParseInt(data.pcsPerCarton),
      amsRefNo: data.amsRef || '',
      embAndEmbellishment: data.embEmbellishment || '',
      poImage: poImageBase64, // Base64 string
      poImgFileName: files.image ? files.image.name : '',
      grossAndNetWeight: data.unit || '',
      shipmentModeText: data.shipmentMode || '',
      costingMstID: 0,
      userID: 0,
      reasonforReviseShpmnt: data.reasonReviseBuyer || '',
      reasonforReviseShpmntVendor: data.reasonReviseVendor || '',
      exchangeRate2: 0,
      masterPO: data.masterPo || '',
      samplingReq: data.samplingRequirements || '',
      qaid: 0,
      printQAID: 0,
      tdqaid: 0,
      prodPersonID: 0,
      shipPersonID: 0,
      assistantID: 0,
      finalInspDate: formatDate(data.finalInspectionDate),
      qrImgPO: '',
      qrCodePO: '',
      assortment: data.assortment || '',
      grossWeight: safeParseFloat(data.grossWeight),
      netWeight: safeParseFloat(data.netWeight),
      specsimage: finalSpecsBase64, // Base64 string
      pPimage: ppCommentBase64, // Base64 string
      finalspecs: finalSpecsBase64, // Base64 string
      sizeset: sizeSetCommentBase64, // Base64 string
      specstype: files.finalSpecs ? files.finalSpecs.type : '',
      pptype: files.ppComment ? files.ppComment.type : '',
      finaltype: files.finalSpecs ? files.finalSpecs.type : '',
      sizetype: files.sizeSetComment ? files.sizeSetComment.type : '',
      poQtyUnit: data.set || '',
      barCodeTFPO: '',
      etanjDate: formatDate(data.etaNewJerseyDate),
      etaWarehouseDate: formatDate(data.etaWarehouseDate),
      
      // Convert inquiry and bank IDs to numbers
      inquiryMstID: selectedInquiryObj?.inquiryMstID ? safeParseInt(selectedInquiryObj.inquiryMstID) : 0,
      bankID: safeParseInt(data.bankID),
      
      prodImgFileName: files.productImage ? files.productImage.name : '',
      originalPDFName: files.originalPurchaseOrder ? files.originalPurchaseOrder.name : '',
      buyerCustomer: data.buyerCustomer || '',
    };

    console.log('🚀 FINAL API DATA - Images:', {
      poImage: apiData.poImage ? `PRESENT (${apiData.poImage.length} chars)` : 'NULL',
      productImage: apiData.productImage ? `PRESENT (${apiData.productImage.length} chars)` : 'NULL',
      specsimage: apiData.specsimage ? `PRESENT (${apiData.specsimage.length} chars)` : 'NULL'
    });

    return apiData;
  };

  const onSubmit = async (data) => {
    console.log('🔍 DEBUG START ==================');
    
    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };
      
      const apiData = await mapFormDataToAPI(data);
      
      console.log('📤 Sending to API:', apiData);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/MyOrders/AddPurchaseOrder`,
        apiData,
        { 
          headers,
          timeout: 30000
        }
      );
      
      if (!(response.status === 200 || response.status === 201)) {
        throw new Error(`Failed to save purchase order. Status: ${response.status}`);
      }

      // Extract newly created Purchase Order ID for details API
      const createdPoId = extractPurchaseOrderId(response.data);
      console.log('🆕 Created Purchase Order ID:', createdPoId, 'Raw response:', response.data);

      // If we have item grid data, save it using AddPurchaseOrderDetails
      if (savedItemData?.rows?.length) {
        if (!createdPoId) {
          throw new Error('Purchase Order saved but POID was not returned by API.');
        }

        const baseDetails = mapItemRowsToDetailsPayload(savedItemData.rows);
        // Backend expects styleID + purchaseOrderID in each object
        const detailsPayload = baseDetails.map((item) => ({
          styleID: 0,
          purchaseOrderID: Number(createdPoId) || 0,
          ...item,
        }));

        console.log('📤 Sending PO Details to API:', detailsPayload);

        const detailsResponse = await axios.post(
          `${API_BASE_URL}/api/MyOrders/AddPurchaseOrderDetails?poId=${createdPoId}`,
          detailsPayload,
          {
            headers,
            timeout: 30000,
          }
        );

        if (!(detailsResponse.status === 200 || detailsResponse.status === 201)) {
          throw new Error(
            `Failed to save purchase order details. Status: ${detailsResponse.status}`
          );
        }
      }

      showSnackbar(
        savedItemData?.rows?.length
          ? 'Purchase Order and item details saved successfully!'
          : 'Purchase Order saved successfully!',
        'success'
      );

      console.log('✅ API Responses:', {
        purchaseOrder: response.data,
      });
        
        // Reset form after successful submission
        methods.reset(defaultValues);
        setSavedItemData(null);
        setFiles({});

        // Redirect to My Orders page
        navigate('/dashboard/supply-chain');
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      
      let errorMessage = 'Error saving purchase order. Please try again.';
      
      if (error.response) {
        console.error('📞 Server Error Details:', error.response.data);
        errorMessage = error.response.data.message || 
                      error.response.data.title || 
                      `Server Error: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message;
      }
      
      showSnackbar(errorMessage, 'error');
    }
    
    console.log('🔍 DEBUG END ==================');
  };

  const handleSaveAndEmail = async (data) => {
    try {
      await onSubmit(data);
      showSnackbar('Purchase Order saved and email sent!', 'success');
    } catch (error) {
      console.error('Error saving and emailing:', error);
    }
  };

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
            <Stepper activeStep={activeStep} alternativeLabel>
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
                onClick={() => navigate('/dashboard/supply-chain')}
              />
              <Typography variant="h6">PURCHASE ORDER ENTRY</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="costingRef"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Costing Ref No."
                      select
                      fullWidth
                      size="medium"
                      variant="outlined"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || (costingError ? 'Unable to load costing refs' : '')}
                      InputLabelProps={{ shrink: true }}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: { style: { maxHeight: 200, marginTop: 8 } },
                          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                          transformOrigin: { vertical: 'top', horizontal: 'left' },
                        },
                      }}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {costingLoading ? (
                        <MenuItem value="" disabled>Loading...</MenuItem>
                      ) : (
                        costingOptions.map((opt) => (
                          <MenuItem key={opt.costingMstID ?? opt.costingNo} value={opt.costingNo}>
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
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label={item.label}
                        fullWidth
                        disabled={item.name === 'amsRef'}
                        error={!!fieldState.error}
                        helperText={
                          fieldState.error?.message ||
                          (item.name === 'customerPo' && customerPoExists
                            ? 'This PO already exists'
                            : item.name === 'internalPo' && internalPoExists
                            ? 'This PO already exists'
                            : '')
                        }
                      />
                    )}
                  />
                </Grid>
              ))}

              <Grid item xs={12} sm={6}>
                <Controller
                  name="customer"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Customer"
                      fullWidth
                      select
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || (customerError ? 'Unable to load customers' : '')}
                      value={field.value || ''}
                    >
                      <MenuItem value="">Select Customer</MenuItem>
                      {customerLoading ? (
                        <MenuItem value="" disabled>Loading customers...</MenuItem>
                      ) : (
                        customerOptions.map((customer) => (
                          <MenuItem key={customer.customerID} value={customer.customerName}>
                            {customer.customerName}
                          </MenuItem>
                        ))
                      )}
                      {!customerLoading && customerOptions.length === 0 && !customerError && (
                        <MenuItem value="" disabled>No customers found</MenuItem>
                      )}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="supplier"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Supplier"
                      fullWidth
                      select
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || (supplierError ? 'Unable to load suppliers' : '')}
                      value={field.value || ''}
                    >
                      <MenuItem value="">Select Supplier</MenuItem>
                      {supplierLoading ? (
                        <MenuItem value="" disabled>Loading suppliers...</MenuItem>
                      ) : (
                        supplierOptions.map((supplier) => (
                          <MenuItem key={supplier.venderLibraryID} value={supplier.venderName}>
                            {supplier.venderName}
                          </MenuItem>
                        ))
                      )}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Updated Merchant Field with Multiple Selection */}
              <Grid item xs={12} sm={6}>
                <MerchantMultipleSelect
                  name="merchant"
                  label="Merchant"
                  options={merchantOptions}
                  loading={merchantLoading}
                />
              </Grid>

              {[
                {
                  name: 'proceedings',
                  label: 'Proceedings',
                  options: [
                    { label: 'Supply Chain', value: 'Supply Chain' },
                    { label: 'Inspection Only', value: 'Inspection Only' },
                  ],
                },
                {
                  name: 'orderType',
                  label: 'Order Type',
                  options: [
                    { label: 'New', value: 'New' },
                    { label: 'Repeat', value: 'Repeat' },
                  ],
                },
                {
                  name: 'transactions',
                  label: 'Transactions',
                  options: [
                    { label: 'Services', value: 'Services' },
                    { label: 'Trade', value: 'Trade' },
                  ],
                },
                {
                  name: 'version',
                  label: 'Version',
                  options: [
                    { label: 'Regular', value: 'Regular' },
                    { label: 'Promotion', value: 'Promotion' },
                    { label: 'Advertising', value: 'Advertising' },
                    { label: 'On-line', value: 'On-line' },
                  ],
                },
              ].map(({ name, label, options }) => (
                <Grid item xs={12} sm={6} key={name}>
                  <Controller
                    name={name}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label={label}
                        fullWidth
                        select
                        error={!!fieldState?.error}
                        helperText={fieldState?.error?.message}
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
                      InputProps={{ readOnly: true }}
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

          {/* ----------------- Section: Dates + Shipment Windows (all in one step) ----------------- */}
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
                        />
                      )}
                    />
                  </Grid>
                ))}
              </Grid>
            </Card>

            <Card sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                BUYER SHIPMENT WINDOW
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller name="buyerShipInitial" control={control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Buyer Ship. Dt. (Initial)" type="date" fullWidth InputLabelProps={{ shrink: true }}
                      error={!!fieldState.error} helperText={fieldState.error?.message}
                      onChange={(e) => {
                        field.onChange(e);
                        const val = e.target.value;
                        const toLocal = (s) => { const [y,m,d] = s.split('-'); return new Date(y, m-1, d); };
                        if (!val) { clearErrors('buyerShipInitial'); return; }
                        clearErrors('buyerShipInitial');
                        const lastVal = getValues('buyerShipLast');
                        if (lastVal && toLocal(lastVal) < toLocal(val))
                          setError('buyerShipLast', { type: 'manual', message: 'Buyer Ship. Dt. (Last) must be same or after Initial date' });
                        else if (lastVal) clearErrors('buyerShipLast');
                      }}
                    />
                  )} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller name="buyerShipLast" control={control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Buyer Ship. Dt. (Last)" type="date" fullWidth InputLabelProps={{ shrink: true }}
                      error={!!fieldState.error} helperText={fieldState.error?.message}
                      onChange={(e) => {
                        field.onChange(e);
                        const val = e.target.value;
                        const toLocal = (s) => { const [y,m,d] = s.split('-'); return new Date(y, m-1, d); };
                        if (!val) { clearErrors('buyerShipLast'); return; }
                        const initVal = getValues('buyerShipInitial');
                        if (initVal && toLocal(val) < toLocal(initVal))
                          setError('buyerShipLast', { type: 'manual', message: 'Buyer Ship. Dt. (Last) must be same or after Initial date' });
                        else clearErrors('buyerShipLast');
                      }}
                    />
                  )} />
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                VENDOR SHIPMENT WINDOW
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Controller name="vendorShipInitial" control={control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Vendor Ship. Dt. (Initial)" type="date" fullWidth InputLabelProps={{ shrink: true }}
                      error={!!fieldState.error} helperText={fieldState.error?.message}
                      onChange={(e) => {
                        field.onChange(e);
                        const val = e.target.value;
                        const toLocal = (s) => { const [y,m,d] = s.split('-'); return new Date(y, m-1, d); };
                        if (!val) { clearErrors('vendorShipInitial'); return; }
                        clearErrors('vendorShipInitial');
                        const lastVal = getValues('vendorShipLast');
                        if (lastVal && toLocal(lastVal) < toLocal(val))
                          setError('vendorShipLast', { type: 'manual', message: 'Vendor Ship. Dt. (Last) must be same or after Initial date' });
                        else if (lastVal) clearErrors('vendorShipLast');
                        const finalVal = getValues('finalInspectionDate');
                        if (finalVal && toLocal(finalVal) < toLocal(val))
                          setError('finalInspectionDate', { type: 'manual', message: 'Final Inspection Date must be same or after Vendor Ship. Dt. (Initial)' });
                        else if (finalVal) clearErrors('finalInspectionDate');
                      }}
                    />
                  )} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Controller name="vendorShipLast" control={control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Vendor Ship. Dt. (Last)" type="date" fullWidth InputLabelProps={{ shrink: true }}
                      error={!!fieldState.error} helperText={fieldState.error?.message}
                      onChange={(e) => {
                        field.onChange(e);
                        const val = e.target.value;
                        const toLocal = (s) => { const [y,m,d] = s.split('-'); return new Date(y, m-1, d); };
                        if (!val) { clearErrors('vendorShipLast'); return; }
                        const initVal = getValues('vendorShipInitial');
                        if (initVal && toLocal(val) < toLocal(initVal))
                          setError('vendorShipLast', { type: 'manual', message: 'Vendor Ship. Dt. (Last) must be same or after Initial date' });
                        else clearErrors('vendorShipLast');
                      }}
                    />
                  )} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Controller name="finalInspectionDate" control={control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Final Inspection Date" type="date" fullWidth InputLabelProps={{ shrink: true }}
                      error={!!fieldState.error} helperText={fieldState.error?.message}
                      onChange={(e) => {
                        field.onChange(e);
                        const val = e.target.value;
                        const toLocal = (s) => { const [y,m,d] = s.split('-'); return new Date(y, m-1, d); };
                        if (!val) { clearErrors('finalInspectionDate'); return; }
                        const vendorInit = getValues('vendorShipInitial');
                        if (vendorInit && toLocal(val) < toLocal(vendorInit))
                          setError('finalInspectionDate', { type: 'manual', message: 'Final Inspection Date must be same or after Vendor Ship. Dt. (Initial)' });
                        else clearErrors('finalInspectionDate');
                      }}
                    />
                  )} />
                </Grid>
                {[
                  { name: 'reasonReviseBuyer', label: 'Reason of Revise Shipment Dates(B)' },
                  { name: 'reasonReviseVendor', label: 'Reason of Revise Shipment Dates(V)' },
                ].map(({ name, label }) => (
                  <Grid item xs={12} key={name}>
                    <Controller
                      name={name}
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          label={label}
                          fullWidth
                          multiline
                          minRows={2}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </Grid>
                ))}
              </Grid>
            </Card>
          </>
          )}

           {/* ----------------- Section: Product Portfolio / PRODUCT INFORMATION ----------------- */}
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
                        onChange={(e) => handlePortfolioChange(e.target.value)}
                      >
                        <MenuItem value="">Select Portfolio</MenuItem>
                        {loadingPortfolio ? (
                          <MenuItem disabled>Loading...</MenuItem>
                        ) : (
                          productPortfolios.map((p) => (
                            <MenuItem key={p.productPortfolioID} value={p.productPortfolioID}>
                              {p.productPortfolio}
                            </MenuItem>
                          ))
                        )}
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
                        onChange={(e) => handleCategoryChange(e.target.value)}
                      >
                        <MenuItem value="">Select Category</MenuItem>
                        {loadingCategory ? (
                          <MenuItem disabled>Loading...</MenuItem>
                        ) : (
                          productCategories.map((c) => (
                            <MenuItem key={c.productCategoriesID} value={c.productCategoriesID}>
                              {c.productCategories}
                            </MenuItem>
                          ))
                        )}
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
                      <Select {...field} label="Product Group" value={field.value || ''}>
                        <MenuItem value="">Select Group</MenuItem>
                        {loadingGroup ? (
                          <MenuItem disabled>Loading...</MenuItem>
                        ) : (
                          productGroups.map((g) => (
                            <MenuItem key={g.productGroupID} value={g.productGroupID}>
                              {g.productGroup}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Rest of the product information fields */}
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
                        <MenuItem value="Confirm">Confirm</MenuItem>
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
                <Controller name="ratio" render={({ field }) => <TextField {...field} fullWidth label="Ratio" />} />
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
              
              {/* Item Description at Shipping Invoice Field */}
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
                      {inquiryLoading ? (
                        <CircularProgress size={24} />
                      ) : inquiryError ? (
                        <Typography color="error">{inquiryError}</Typography>
                      ) : (
                        <Select {...field} label="Inquiry No" value={field.value || ''}>
                          {inquiryOptions.map((inq) => (
                            <MenuItem key={`${inq.inquiryMstID}-${inq.sampleNo}`} value={inq.sampleNo}>
                              {inq.sampleNo}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
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
                  <TableContainer
                    component={Paper}
                    sx={{
                      width: '100%',
                      maxWidth: '100%',
                      overflowX: 'auto',
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            '& th': {
                              backgroundColor: theme.palette.primary.main,
                              color: theme.palette.primary.contrastText,
                              fontWeight: 'bold',
                              fontSize: 12,
                              whiteSpace: 'nowrap',
                            },
                          }}
                        >
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
                          <TableCell align="center">Remove</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {savedItemData.rows.map((row, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              '&:nth-of-type(odd)': {
                                backgroundColor: '#f7f3ff',
                              },
                            }}
                          >
                            <TableCell>{row.styleNo}</TableCell>
                            <TableCell>
                              <TextField
                                value={row.colorway || ''}
                                size="small"
                                onChange={(e) =>
                                  handleSelectionRowChange(index, 'colorway', e.target.value)
                                }
                                sx={{ width: 100 }}
                              />
                            </TableCell>
                            <TableCell>{row.productCode}</TableCell>
                            <TableCell>{row.sizeRange}</TableCell>
                            <TableCell>{row.size}</TableCell>
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
                                onFocus={(e) => {
                                  if (e.target.value === '0' || e.target.value === 0 || e.target.value === '') {
                                    e.target.select();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if ((e.target.value === '0' || e.target.value === 0) && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape') {
                                    e.target.value = '';
                                  }
                                }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={row.quantity ?? 0}
                                type="number"
                                size="small"
                                onChange={(e) =>
                                  handleSelectionRowChange(index, 'quantity', e.target.value)
                                }
                                onFocus={(e) => {
                                  if (e.target.value === '0' || e.target.value === 0) {
                                    e.target.select();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if ((e.target.value === '0' || e.target.value === 0) && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape' && e.key !== 'Backspace' && e.key !== 'Delete') {
                                    e.target.value = '';
                                  }
                                }}
                                sx={{ width: 70 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={row.itemPrice ?? 0}
                                type="number"
                                size="small"
                                onChange={(e) =>
                                  handleSelectionRowChange(index, 'itemPrice', e.target.value)
                                }
                                onFocus={(e) => {
                                  if (e.target.value === '0' || e.target.value === 0) {
                                    e.target.select();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if ((e.target.value === '0' || e.target.value === 0) && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape' && e.key !== 'Backspace' && e.key !== 'Delete') {
                                    e.target.value = '';
                                  }
                                }}
                                sx={{ width: 70 }}
                              />
                            </TableCell>
                            <TableCell>{(row.value ?? 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <TextField
                                value={row.vendorPrice ?? 0}
                                type="number"
                                size="small"
                                onChange={(e) =>
                                  handleSelectionRowChange(index, 'vendorPrice', e.target.value)
                                }
                                onFocus={(e) => {
                                  if (e.target.value === '0' || e.target.value === 0) {
                                    e.target.select();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if ((e.target.value === '0' || e.target.value === 0) && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape' && e.key !== 'Backspace' && e.key !== 'Delete') {
                                    e.target.value = '';
                                  }
                                }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={row.ldpPrice ?? 0}
                                type="number"
                                size="small"
                                onChange={(e) =>
                                  handleSelectionRowChange(index, 'ldpPrice', e.target.value)
                                }
                                onFocus={(e) => {
                                  if (e.target.value === '0' || e.target.value === 0) {
                                    e.target.select();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if ((e.target.value === '0' || e.target.value === 0) && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape' && e.key !== 'Backspace' && e.key !== 'Delete') {
                                    e.target.value = '';
                                  }
                                }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>{(row.ldpValue ?? 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <TextField
                                value={row.cartonQty ?? 0}
                                type="number"
                                size="small"
                                onChange={(e) =>
                                  handleSelectionRowChange(index, 'cartonQty', e.target.value)
                                }
                                onFocus={(e) => {
                                  if (e.target.value === '0' || e.target.value === 0) {
                                    e.target.select();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if ((e.target.value === '0' || e.target.value === 0) && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape' && e.key !== 'Backspace' && e.key !== 'Delete') {
                                    e.target.value = '';
                                  }
                                }}
                                sx={{ width: 70 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={row.grossWeight ?? 0}
                                type="number"
                                size="small"
                                onChange={(e) =>
                                  handleSelectionRowChange(index, 'grossWeight', e.target.value)
                                }
                                onFocus={(e) => {
                                  if (e.target.value === '0' || e.target.value === 0) {
                                    e.target.select();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if ((e.target.value === '0' || e.target.value === 0) && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape' && e.key !== 'Backspace' && e.key !== 'Delete') {
                                    e.target.value = '';
                                  }
                                }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={row.netWeight ?? 0}
                                type="number"
                                size="small"
                                onChange={(e) =>
                                  handleSelectionRowChange(index, 'netWeight', e.target.value)
                                }
                                onFocus={(e) => {
                                  if (e.target.value === '0' || e.target.value === 0) {
                                    e.target.select();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if ((e.target.value === '0' || e.target.value === 0) && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape' && e.key !== 'Backspace' && e.key !== 'Delete') {
                                    e.target.value = '';
                                  }
                                }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleSelectionRowRemove(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total Qty: {savedItemData.totals.totalQuantity}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total Value: {savedItemData.totals.totalValue.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      startIcon={<CalculateIcon />}
                      onClick={handleShowCalculationFields}
                    >
                      Calculate
                    </Button>
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
                        {paymentLoading ? (
                          <CircularProgress size={24} />
                        ) : paymentError ? (
                          <Typography color="error">{paymentError}</Typography>
                        ) : (
                          <Select {...field} label="Payment Mode" value={field.value || ''}>
                            {paymentOptions.length > 0 ? (
                              paymentOptions.map((p) => (
                              <MenuItem key={p.id} value={p.id}>
                                {p.name}
                              </MenuItem>
                              ))
                            ) : (
                              <>
                                <MenuItem value="2">DP</MenuItem>
                                <MenuItem value="3">Dp/ap</MenuItem>
                              </>
                            )}
                          </Select>
                        )}
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
                    render={({ field }) => <TextField {...field} fullWidth label="N/A" />}
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
                        {bankLoading ? (
                          <CircularProgress size={24} />
                        ) : bankError ? (
                          <Typography color="error">{bankError}</Typography>
                        ) : (
                          <Select {...field} label="Bank" value={field.value || ''}>
                            {bankOptions.map((b) => (
                              <MenuItem key={b.id} value={b.id}>
                                {b.name}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
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
                  onClick={() => navigate('/dashboard/supply-chain')}
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
                disabled={
                  (activeStep === 0 && (customerPoExists || internalPoExists)) ||
                  checkingCustomerPo ||
                  checkingInternalPo
                }
              >
                {checkingCustomerPo || checkingInternalPo ? 'Checking...' : 'Next'}
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