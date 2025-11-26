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
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import DeleteIcon from '@mui/icons-material/Delete';
import CalculateIcon from '@mui/icons-material/Calculate';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
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

  const handlePreviewClick = () => {
    if (previewUrl) {
      setFullScreenOpen(true);
    }
  };

  const handleCloseFullScreen = () => {
    setFullScreenOpen(false);
  };

  useEffect(() => {
    if (!fileValue) {
      setPreviewUrl('');
    }
  }, [fileValue]);

  const isImage = fileValue?.type?.startsWith('image/');

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
        </Box>
      )}

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

      <FullScreenImagePreview
        open={fullScreenOpen}
        imageUrl={previewUrl}
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
  const [sizeRangeOptions, setSizeRangeOptions] = useState([]);
  const [loadingSizeRanges, setLoadingSizeRanges] = useState(false);
  const [formError, setFormError] = useState('');

  const onSubmit = (data) => {
    const sizes = ['S', 'M', 'L', 'XL'];
    
    const newRows = sizes.map(size => ({
      styleNo: data.styleNo || '',
      colorway: data.colorway || '',
      productCode: data.productCode || '',
      sizeRange: data.sizeRange || '',
      size: size,
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
                  <TextField
                    {...field}
                    label="Size Range"
                    placeholder="Enter Size Range"
                    size="small"
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

// -------------------- Merchant Multiple Select Component --------------------
function MerchantMultipleSelect({ name, label }) {
  const { control } = useFormContext();

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
          >
            <MenuItem value="Merchant 1">
              <Checkbox checked={field.value.indexOf('Merchant 1') > -1} />
              <ListItemText primary="Merchant 1" />
            </MenuItem>
            <MenuItem value="Merchant 2">
              <Checkbox checked={field.value.indexOf('Merchant 2') > -1} />
              <ListItemText primary="Merchant 2" />
            </MenuItem>
            <MenuItem value="Merchant 3">
              <Checkbox checked={field.value.indexOf('Merchant 3') > -1} />
              <ListItemText primary="Merchant 3" />
            </MenuItem>
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
      calculationField1: '',
      calculationField2: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    setValue,
    watch,
    reset,
  } = methods;

  const [files, setFiles] = useState({});
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [savedItemData, setSavedItemData] = useState(null);
  const [showSelections, setShowSelections] = useState(true);
  const [showCalculationFields, setShowCalculationFields] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);

  const customerPoValue = watch('customerPo');
  const calculationField1 = watch('calculationField1');
  const calculationField2 = watch('calculationField2');

  // Fetch data from API when component mounts or ID changes
  useEffect(() => {
    const fetchPurchaseOrderData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get(`/MyOrders/GetPurchaseOrder/${id}`);
        
        if (response.data && response.data.length > 0) {
          const orderData = response.data[0];
          console.log("API Order Data:", orderData);
          setApiData(orderData);
          
          // Map API data to form fields with date mappings
          reset({
            // Basic Order Info
            masterPo: orderData.masterPO || '',
            customerPo: orderData.pono || '',
            internalPo: orderData.internalPONO || '',
            amsRef: orderData.amsRefNo || '',
            rnNo: orderData.rnNo || '',
            consignee: orderData.consignee || '',
            customer: orderData.buyerName || '',
            proceedings: orderData.proceedings || '',
            orderType: orderData.pOtype || 'New',
            transactions: orderData.transactions || 'Services',
            version: orderData.version || 'Regular',
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
            productGroup: orderData.productGroup || '',
            season: orderData.season || '',
            fabric: orderData.fabric || '',
            item: orderData.item || '',
            design: orderData.design || '',
            otherFabric: orderData.otherFabric || '',
            construction: orderData.construction || '',
            status: orderData.status || '',
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
            pcsPerCarton: orderData.pcPerCarton || '',
            grossWeight: orderData.grossWeight || '',
            netWeight: orderData.netWeight || '',
            unit: orderData.poQtyUnit || '',
            packingList: orderData.packingList || '',
            embEmbellishment: orderData.embAndEmbellishment || 'Not Required',
            buyerCustomer: orderData.buyerCustomer || '',
            itemDescriptionShippingInvoice: orderData.itemDescriptionShippingInvoice || '',
            
            // Product Specific Information
            currency: orderData.currency || 'Dollar',
            exchangeRate: orderData.exchangeRate || '',
            style: orderData.design || '',
            
            // Shipping and Payment Terms
            paymentMode: orderData.paymentMode || '',
            shipmentTerm: orderData.deliveryType || 'CNF',
            destination: orderData.destination || 'New York',
            shipmentMode: orderData.shipmentMode || '',
            
            // Bank Details
            bankName: orderData.bankName || '',
            bankBranch: orderData.bankBranch || '',
            titleOfAccount: orderData.titleOfAccount || '',
            accountNo: orderData.accountNo || '',
            
            // Keep existing values for fields not in API
            costingRef: '',
            supplier: '',
            merchant: [],
            RevisedShipmentDate: '',
            reasonReviseBuyer: '',
            reasonReviseVendor: '',
            productPortfolio: '',
            productCategory: '',
            tolQuantity: orderData.toleranceindays || 0,
            set: '',
            qualityComposition: orderData.quality || 0,
            gsm: orderData.gms || 0,
            gsmOF: '',
            poSpecialOperation: orderData.pO_Special_Operation || '',
            poSpecialTreatment: orderData.pO_Special_Treatement || '',
            inquiryNo: orderData.inquiryMstID ? `INQ${orderData.inquiryMstID}` : '',
            routingNo: '',
            bankID: orderData.bankID || '',
            calculationField1: '',
            calculationField2: '',
          });
        }
        
      } catch (error) {
        console.error('Error fetching purchase order data:', error);
        showSnackbar('Error loading purchase order data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrderData();
  }, [id, reset]);

  useEffect(() => {
    if (customerPoValue) {
      setValue('internalPo', customerPoValue);
    }
  }, [customerPoValue, setValue]);

  const handleOpenItemDialog = () => {
    setOpenItemDialog(true);
  };

  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
  };

  const handleSaveItemData = (data) => {
    setSavedItemData(data);
  };

  const handleShowSelections = () => {
    if (!showSelections && savedItemData) {
      const styleNumbers = [...new Set(savedItemData.rows.map(row => row.styleNo))].join(', ');
      setValue('style', styleNumbers);
    }
    setShowSelections(!showSelections);
  };

  const handleShowCalculationFields = () => {
    setShowCalculationFields(!showCalculationFields);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const onSubmit = async (data) => {
    try {
      console.log('Form submitted:', data);
      showSnackbar('Purchase Order saved successfully!', 'success');
      
      setTimeout(() => {
        methods.reset();
        setSavedItemData(null);
        setFiles({});
      }, 1000);
    } catch (error) {
      console.error('Error submitting form:', error);
      showSnackbar('Error saving purchase order. Please try again.', 'error');
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
      <Container maxWidth="xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          
          {/* ----------------- Section: Basic Order Info ----------------- */}
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
                      <MenuItem value="REF001">REF001</MenuItem>
                      <MenuItem value="REF002">REF002</MenuItem>
                      <MenuItem value="REF003">REF003</MenuItem>
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
                      <MenuItem value="Customer 1">Customer 1</MenuItem>
                      <MenuItem value="Customer 2">Customer 2</MenuItem>
                      <MenuItem value="Customer 3">Customer 3</MenuItem>
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
                      <MenuItem value="Supplier 1">Supplier 1</MenuItem>
                      <MenuItem value="Supplier 2">Supplier 2</MenuItem>
                      <MenuItem value="Supplier 3">Supplier 3</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <MerchantMultipleSelect
                  name="merchant"
                  label="Merchant"
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
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={label}
                        fullWidth
                        select
                        disabled
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

          {/* ----------------- Section: Important Dates ----------------- */}
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
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={label}
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
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
              {[
                { name: 'buyerShipInitial', label: 'Buyer Ship. Dt. (Initial)' },
                { name: 'buyerShipLast', label: 'Buyer Ship. Dt. (Last)' },
                { name: 'RevisedShipmentDate', label: 'Revised Shipment Date (B):' }
              ].map(({ name, label }) => (
                <Grid item xs={12} sm={4} key={name}>
                  <Controller
                    name={name}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={label}
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              ))}
            </Grid>
          </Card>

          {/* ----------------- Section: Vendor Shipment ----------------- */}
          <Card sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              VENDOR SHIPMENT WINDOW
            </Typography>
            <Grid container spacing={2}>
              {[
                { name: 'vendorShipInitial', label: 'Vendor Ship. Dt. (Initial)' },
                { name: 'vendorShipLast', label: 'Vendor Ship. Dt. (Last)' },
                { name: 'RevisedShipmentDate', label: 'Revised Shipment Date (V):' },
                { name: 'finalInspectionDate', label: 'Final Inspection Date' },

              ].map(({ name, label }) => (
                <Grid item xs={12} sm={4} key={name}>
                  <Controller
                    name={name}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={label}
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              ))}
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

          {/* ----------------- Section: Product Portfolio ----------------- */}
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
                      >
                        <MenuItem value="">Select Portfolio</MenuItem>
                        <MenuItem value="Portfolio 1">Portfolio 1</MenuItem>
                        <MenuItem value="Portfolio 2">Portfolio 2</MenuItem>
                        <MenuItem value="Portfolio 3">Portfolio 3</MenuItem>
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
                      >
                        <MenuItem value="">Select Category</MenuItem>
                        <MenuItem value="Category 1">Category 1</MenuItem>
                        <MenuItem value="Category 2">Category 2</MenuItem>
                        <MenuItem value="Category 3">Category 3</MenuItem>
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
                        <MenuItem value="Group 1">Group 1</MenuItem>
                        <MenuItem value="Group 2">Group 2</MenuItem>
                        <MenuItem value="Group 3">Group 3</MenuItem>
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

          {/* ----------------- Product Specific Information ----------------- */}
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
                        {savedItemData.rows.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.styleNo}</TableCell>
                            <TableCell>{row.colorway}</TableCell>
                            <TableCell>{row.productCode}</TableCell>
                            <TableCell>{row.sizeRange}</TableCell>
                            <TableCell>{row.size}</TableCell>
                            <TableCell>{row.quantity}</TableCell>
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

                  {showCalculationFields && (
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="calculationField1"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Enter value for calculation"
                              type="number"
                              placeholder="0"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="calculationField2"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Enter value for calculation"
                              type="number"
                              placeholder="0"
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* ----------------- Shipping and Payment Terms ----------------- */}
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
                          <MenuItem value="DP">DP</MenuItem>
                          <MenuItem value="LC">LC</MenuItem>
                          <MenuItem value="TT">TT</MenuItem>
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
                          <MenuItem value="CNF">CNF</MenuItem>
                          <MenuItem value="FOB">FOB</MenuItem>
                          <MenuItem value="CIF">CIF</MenuItem>
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
                          <MenuItem value="Air">Air</MenuItem>
                          <MenuItem value="Sea">Sea</MenuItem>
                          <MenuItem value="Land">Land</MenuItem>
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

          {/* ----------------- Reference & Attachment Form ----------------- */}
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

          {/* ----------------- Bank Detail Form ----------------- */}
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
                          <MenuItem value="1">Bank 1</MenuItem>
                          <MenuItem value="2">Bank 2</MenuItem>
                          <MenuItem value="3">Bank 3</MenuItem>
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
                  onClick={() => navigate('/dashboard/supply-chain')}
                >
                  Cancel
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </form>
      </Container>

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