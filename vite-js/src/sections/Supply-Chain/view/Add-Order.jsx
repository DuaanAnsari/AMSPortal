import * as Yup from 'yup';
import { useRef, useState, useEffect } from 'react';
import { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import CircularProgress from '@mui/material/CircularProgress';

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
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

// -------------------- Image Upload Component --------------------
function SimpleImageUploadField({ name }) {
  const fileInputRef = useRef(null);
  const { setValue } = useFormContext();

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue(name, file, { shouldValidate: true });
    }
  };

  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <Grid container spacing={1} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              disabled
              label="Image"
              value={field.value?.name || ''}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
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
            <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
              Select
            </Button>
          </Grid>
        </Grid>
      )}
    />
  );
}

// -------------------- Validation Schema --------------------
const Schema = Yup.object().shape({
  // Basic Order Info
  costingRef: Yup.string().required('Costing Ref No. is required'),
  masterPo: Yup.string(),
  customer: Yup.string().required('Customer is required'),
  supplier: Yup.string().required('Supplier is required'),
  merchant: Yup.string().required('Merchant is required'),
  proceedings: Yup.string().required('Proceedings is required'),
  orderType: Yup.string().required('Order Type is required'),
  transactions: Yup.string().required('Transactions is required'),
  version: Yup.string().required('Version is required'),
  amsRef: Yup.string(),
  customerPo: Yup.string(),
  commission: Yup.string().min(0).max(100),
  vendorCommission: Yup.number().min(0).max(100),
  internalPo: Yup.string(),
  rnNo: Yup.string(),
  consignee: Yup.string(),
  image: Yup.mixed().required('Image is required'),
  placementDate: Yup.date().required('Placement Date is required'),
  etaNewJerseyDate: Yup.date().required('ETA New Jersey Date is required'),
  etaWarehouseDate: Yup.date().required('ETA Warehouse Date is required'),
  buyerShipInitial: Yup.date().required('Buyer Ship. Dt. (Initial) is required'),
  buyerShipLast: Yup.date().required('Buyer Ship. Dt. (Last) is required'),
  vendorShipInitial: Yup.date().required('Vendor Ship. Dt. (Initial) is required'),
  vendorShipLast: Yup.date().required('Vendor Ship. Dt. (Last) is required'),
  finalInspectionDate: Yup.date().required('Final Inspection Date is required'),
  reasonReviseBuyer: Yup.string().required('Reason of Revise Shipment Dates(B) is required'),
  reasonReviseVendor: Yup.string().required('Reason of Revise Shipment Dates(V) is required'),

  // Product Portfolio Fields
  productPortfolio1: Yup.string(),
  productPortfolio2: Yup.string(),
  productPortfolio3: Yup.string(),
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

  // Product Specific Information
  currency: Yup.string(),
  exchangeRate: Yup.string(),
  style: Yup.string(),

  // Shipping and Payment
  paymentMode: Yup.string(),
  shipmentTerm: Yup.string(),
  destination: Yup.string(),
  shipmentMode: Yup.string(),

  // Bank Details
  bankName: Yup.string(),
  routingNo: Yup.string(),
  bankBranch: Yup.string(),
});

// -------------------- Default Values --------------------
const defaultValues = {
  // Basic Order Info
  costingRef: '',
  masterPo: '',
  customer: '',
  supplier: '',
  merchant: '',
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

  // Product Portfolio Defaults
  productPortfolio1: '',
  productPortfolio2: '',
  productPortfolio3: '',
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
  washingCareLabel: '',
  importantNote: '',
  moreInfo: '',
  samplingRequirements: '',
  pcsPerCarton: '',
  grossWeight: '',
  netWeight: '',
  unit: '',
  packingList: '',
  embEmbellishment: '',
  inquiryNo: '',
  buyerCustomer: '',

  // Product Specific
  currency: 'Dollar',
  exchangeRate: '',
  style: '',

  // Shipping and Payment
  paymentMode: 'DP',
  shipmentTerm: 'CNF',
  destination: 'New York',
  shipmentMode: '',

  // Bank Details
  bankName: '',
  routingNo: '',
  bankBranch: '',
};
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// -------------------- Main Component --------------------
export default function CompletePurchaseOrderForm() {
  const navigate = useNavigate();
  const methods = useForm({
    resolver: yupResolver(Schema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    setValue,
    watch,
  } = methods;
  const [files, setFiles] = useState({});

  // ====== Item Details Dialog State ======
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [rows, setRows] = useState([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  // Dialog handlers
  const handleOpenItemDialog = () => {
    setOpenItemDialog(true);
  };

  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
  };

  // ====== CostingRef Options ======
  const [costingOptions, setCostingOptions] = useState([]);
  const [costingLoading, setCostingLoading] = useState(false);
  const [costingError, setCostingError] = useState(null);

  // ====== Customer Options ======
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState(null);

  // Watch customer field for changes
  const selectedCustomer = watch('customer');

  // Fetch Costing References
  useEffect(() => {
    const fetchCostingRefs = async () => {
      setCostingLoading(true);
      setCostingError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/CostingRefNo`, {
          headers,
        });

        const data = res.data;
        if (Array.isArray(data)) {
          setCostingOptions(data);
        } else if (data) {
          setCostingOptions([data]);
        } else {
          setCostingOptions([]);
        }
      } catch (err) {
        console.error('CostingRefNo fetch error:', err);
        setCostingOptions([]);
        if (err.response) {
          setCostingError(`Error ${err.response.status}: ${err.response.statusText}`);
        } else {
          setCostingError('Unable to load costing refs');
        }
      } finally {
        setCostingLoading(false);
      }
    };

    fetchCostingRefs();
  }, []);

  // ====== Fetch Customers ======
  useEffect(() => {
    const fetchCustomers = async () => {
      setCustomerLoading(true);
      setCustomerError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetCustomer`, {
          headers,
        });

        const data = res.data;
        if (Array.isArray(data)) {
          setCustomerOptions(data);
        } else {
          setCustomerOptions([]);
        }
      } catch (err) {
        console.error('Customer fetch error:', err);
        setCustomerOptions([]);
        if (err.response) {
          setCustomerError(`Error ${err.response.status}: ${err.response.statusText}`);
        } else {
          setCustomerError('Unable to load customers');
        }
      } finally {
        setCustomerLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // ====== Fetch Commission when customer changes ======
  useEffect(() => {
    const fetchCommission = async () => {
      if (!selectedCustomer) {
        setValue('commission', '0.00');
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Find customer ID from selected customer name
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
            // Set commission value in the form
            setValue('commission', parseFloat(commissionData.commission).toFixed(2));
          } else {
            setValue('commission', '0.00');
          }
        }
      } catch (err) {
        console.error('Commission fetch error:', err);
        setValue('commission', '0.00');
      }
    };

    fetchCommission();
  }, [selectedCustomer, customerOptions, setValue]);

  const handleFileChange = (field, e) => {
    setFiles((prev) => ({
      ...prev,
      [field]: e.target.files[0],
    }));
  };

  const onSubmit = (data) => {
    console.log('Submitted Data:', data);
    console.log('Uploaded Files:', files);
    alert('Form Submitted! Check console.');
  };
  // state for AMS Ref
  const [amsRefLoading, setAmsRefLoading] = useState(false);

  useEffect(() => {
    const fetchAMSRef = async () => {
      try {
        setAmsRefLoading(true);
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetNextAMSRefNo`, {
          headers,
        });

        if (res.data && res.data.amsRefNo) {
          // Set value in the form
          setValue('amsRef', res.data.amsRefNo);
        }
      } catch (err) {
        console.error('AMS Ref fetch error:', err);
        setValue('amsRef', ''); // fallback
      } finally {
        setAmsRefLoading(false);
      }
    };

    fetchAMSRef();
  }, [setValue]);

  // ----------------- Supplier Options -----------------
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState(null);

  // Fetch Supplier API
  useEffect(() => {
    const fetchSuppliers = async () => {
      setSupplierLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetSupplier`, { headers });
        if (Array.isArray(res.data)) {
          setSupplierOptions(res.data);
        } else if (res.data) {
          setSupplierOptions([res.data]); // object ko array me wrap
        } else {
          setSupplierOptions([]);
        }
      } catch (err) {
        console.error('Supplier fetch error:', err);
        setSupplierError(err);
        setSupplierOptions([]);
      } finally {
        setSupplierLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const [merchantOptions, setMerchantOptions] = useState([]);
  const [merchantLoading, setMerchantLoading] = useState(false);

  useEffect(() => {
    const fetchMerchants = async () => {
      setMerchantLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetMerchants`, { headers });
        setMerchantOptions(res.data || []);
      } catch (err) {
        console.error('Merchant fetch error:', err);
      } finally {
        setMerchantLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  const [productPortfolios, setProductPortfolios] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [productGroups, setProductGroups] = useState([]);

  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);

  useEffect(() => {
    const fetchPortfolios = async () => {
      setLoadingPortfolio(true);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetProductPortfolio`, {
          headers,
        });
        setProductPortfolios(res.data || []);
      } catch (err) {
        console.error('Portfolio fetch error:', err);
      } finally {
        setLoadingPortfolio(false);
      }
    };
    fetchPortfolios();
  }, []);

  const handlePortfolioChange = async (fieldName, portfolioID) => {
    setValue(fieldName, portfolioID); // set value in form
    setValue('productCategory', ''); // reset category
    setValue('productGroup', ''); // reset group
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

  const handleCategoryChange = async (fieldName, categoryID) => {
    setValue(fieldName, categoryID); // set value in form
    setValue('productGroup', ''); // reset group
    setProductGroups([]);

    if (!categoryID) return;

    setLoadingGroup(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetProductGroups/${categoryID}`, {
        headers,
      });
      setProductGroups(res.data || []);
    } catch (err) {
      console.error('Group fetch error:', err);
    } finally {
      setLoadingGroup(false);
    }
  };

  // ----------------- Inquiry Options -----------------
  // ----------------- Inquiry Options -----------------
  const [inquiryOptions, setInquiryOptions] = useState([]);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      setInquiryLoading(true);
      setInquiryError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetInquirySamples`, {
          headers,
        });

        if (Array.isArray(res.data)) {
          setInquiryOptions(res.data); // array of objects
        } else {
          setInquiryOptions([]);
        }
      } catch (err) {
        console.error('Inquiry fetch error:', err.response || err.message);
        setInquiryError('Unable to load inquiries');
        setInquiryOptions([]);
      } finally {
        setInquiryLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  const [paymentOptions, setPaymentOptions] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    const fetchPaymentModes = async () => {
      setPaymentLoading(true);
      setPaymentError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetPaymentModes`, {
          headers,
        });

        if (Array.isArray(res.data)) {
          setPaymentOptions(res.data);
        } else if (res.data) {
          setPaymentOptions([res.data]);
        } else {
          setPaymentOptions([]);
        }
      } catch (err) {
        console.error('Payment fetch error:', err);
        setPaymentError('Unable to load payment modes');
        setPaymentOptions([]);
      } finally {
        setPaymentLoading(false);
      }
    };

    fetchPaymentModes();
  }, []);

  const [shipmentOptions, setShipmentOptions] = useState([]);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [shipmentError, setShipmentError] = useState(null);

  useEffect(() => {
    const fetchShipmentModes = async () => {
      setShipmentLoading(true);
      setShipmentError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetShipmentModes`, {
          headers,
        });

        if (Array.isArray(res.data)) {
          setShipmentOptions(res.data);
        } else if (res.data) {
          setShipmentOptions([res.data]);
        } else {
          setShipmentOptions([]);
        }
      } catch (err) {
        console.error('Shipment fetch error:', err);
        setShipmentError('Unable to load shipment modes');
        setShipmentOptions([]);
      } finally {
        setShipmentLoading(false);
      }
    };

    fetchShipmentModes();
  }, []);

  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState(null);
  useEffect(() => {
    const fetchDeliveryTypes = async () => {
      setDeliveryLoading(true);
      setDeliveryError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetDeliveryTypes`, {
          headers,
        });

        if (Array.isArray(res.data)) {
          setDeliveryOptions(res.data);
        } else if (res.data) {
          setDeliveryOptions([res.data]);
        } else {
          setDeliveryOptions([]);
        }
      } catch (err) {
        console.error('Delivery fetch error:', err);
        setDeliveryError('Unable to load delivery types');
        setDeliveryOptions([]);
      } finally {
        setDeliveryLoading(false);
      }
    };

    fetchDeliveryTypes();
  }, []);

  // ---- Bank States ----
  const [bankOptions, setBankOptions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState(null);

  useEffect(() => {
    const fetchBanks = async () => {
      setBankLoading(true);
      setBankError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${API_BASE_URL}/api/MyOrders/GetBanks`, {
          headers,
        });

        if (Array.isArray(res.data)) {
          // agar response array hai to directly map kar do
          setBankOptions(
            res.data.map((b) => ({
              id: b.bankID,
              name: b.bankName,
            }))
          );
        } else if (res.data) {
          // agar ek single object mila
          setBankOptions([
            {
              id: res.data.bankID,
              name: res.data.bankName,
            },
          ]);
        } else {
          setBankOptions([]);
        }
      } catch (err) {
        console.error('Bank fetch error:', err);
        setBankError('Unable to load banks');
        setBankOptions([]);
      } finally {
        setBankLoading(false);
      }
    };

    fetchBanks();
  }, []);

  // ====== Item Details Dialog Functions ======
  const handleItemSubmit = (data) => {
    // Handle form submission for adding items
    console.log('Item form data:', data);
    const newRow = {
      colorway: data.colorway || '',
      productCode: data.productCode || '',
      sizeRange: data.sizeRange || '',
      size: data.size || '',
      quantity: 0,
      itemPrice: parseFloat(data.itemPrice) || 0,
      value: 0,
      ldpPrice: parseFloat(data.ldpPrice) || 0,
      ldpValue: 0,
    };
    setRows([...rows, newRow]);
  };

  const handleQuantityChange = (index, value) => {
    // Handle quantity changes
    const newRows = [...rows];
    newRows[index].quantity = parseInt(value) || 0;
    newRows[index].value = newRows[index].quantity * newRows[index].itemPrice;
    newRows[index].ldpValue = newRows[index].quantity * newRows[index].ldpPrice;
    setRows(newRows);
    
    // Update totals
    updateTotals(newRows);
  };

  const handleSave = () => {
    // Handle save logic
    console.log('Saving items:', rows);
  };

  const handleSaveAndClose = () => {
    // Handle save and close logic
    console.log('Saving and closing');
    handleCloseItemDialog();
  };

  const updateTotals = (rowsData) => {
    const totalQty = rowsData.reduce((sum, row) => sum + (row.quantity || 0), 0);
    const totalVal = rowsData.reduce((sum, row) => sum + (row.value || 0), 0);
    setTotalQuantity(totalQty);
    setTotalValue(totalVal);
  };

  // Sample size range options
  const sizeRangeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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
                  '&:hover': {
                    color: 'primary.dark',
                  },
                }}
                onClick={() => navigate('/dashboard/user/profile')}
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
                      helperText={
                        fieldState.error?.message ||
                        (costingError ? 'Unable to load costing refs' : '')
                      }
                      InputLabelProps={{
                        shrink: true,
                      }}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            style: {
                              maxHeight: 200,
                              marginTop: 8,
                            },
                          },
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                        },
                      }}
                    >
                      <MenuItem value="">Select</MenuItem>

                      {costingLoading ? (
                        <MenuItem value="" disabled>
                          Loading...
                        </MenuItem>
                      ) : (
                        costingOptions.map((opt) => (
                          <MenuItem key={opt.costingMstID ?? opt.costingNo} value={opt.costingNo}>
                            {opt.costingNo}
                          </MenuItem>
                        ))
                      )}

                      {!costingLoading && costingOptions.length === 0 && !costingError && <></>}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <SimpleImageUploadField name="image" />
              </Grid>

              {/* Text Fields */}
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

              {/* Customer Dropdown with API Data */}
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
                      helperText={
                        fieldState.error?.message ||
                        (customerError ? 'Unable to load customers' : '')
                      }
                    >
                      <MenuItem value="">Select Customer</MenuItem>

                      {customerLoading ? (
                        <MenuItem value="" disabled>
                          Loading customers...
                        </MenuItem>
                      ) : (
                        customerOptions.map((customer) => (
                          <MenuItem key={customer.customerID} value={customer.customerName}>
                            {customer.customerName}
                          </MenuItem>
                        ))
                      )}

                      {!customerLoading && customerOptions.length === 0 && !customerError && (
                        <MenuItem value="" disabled>
                          No customers found
                        </MenuItem>
                      )}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Other Dropdown Fields */}
              {[
                { name: 'supplier', label: 'Supplier', options: supplierOptions },
                { name: 'merchant', label: 'Merchant', options: merchantOptions },
                {
                  name: 'proceedings',
                  label: 'Proceedings',
                  options: [
                    { label: 'Supply Chain', value: 0 },
                    { label: 'Inspection Only', value: 1 },
                  ],
                },
                {
                  name: 'orderType',
                  label: 'Order Type',
                  options: [
                    { label: 'New', value: 0 },
                    { label: 'Repeat', value: 1 },
                  ],
                },

                {
                  name: 'transactions',
                  label: 'Transactions',
                  options: [
                    { label: 'Services', value: 0 },
                    { label: 'Trade', value: 1 },
                  ],
                },
                {
                  name: 'version',
                  label: 'Version',
                  options: [
                    { label: 'Regular', value: 0 },
                    { label: 'Promotion', value: 1 },
                    { label: 'Advertising', value: 2 },
                    { label: 'On-line', value: 3 },
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
                      >
                        <MenuItem value="">Select</MenuItem>
                        {name === 'supplier' ? (
                          supplierLoading ? (
                            <MenuItem disabled>Loading...</MenuItem>
                          ) : (
                            supplierOptions.map((opt) => (
                              <MenuItem key={opt.venderLibraryID} value={opt.venderName}>
                                {opt.venderName}
                              </MenuItem>
                            ))
                          )
                        ) : name === 'merchant' ? (
                          merchantLoading ? (
                            <MenuItem disabled>Loading...</MenuItem>
                          ) : (
                            merchantOptions.map((opt) => (
                              <MenuItem key={opt.userId} value={opt.userName}>
                                {opt.userName}
                              </MenuItem>
                            ))
                          )
                        ) : (
                          options.map((opt, idx) =>
                            typeof opt === 'object' ? (
                              <MenuItem key={idx} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ) : (
                              <MenuItem key={idx} value={opt}>
                                {opt}
                              </MenuItem>
                            )
                          )
                        )}
                      </TextField>
                    )}
                  />
                </Grid>
              ))}

              {/* Commission Fields */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="commission"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Commission (%)"
                      type="text"
                      fullWidth
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Auto-filled from selected customer"
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

          {/* ----------------- Section: Buyer Shipment ----------------- */}
          <Card sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              BUYER SHIPMENT WINDOW
            </Typography>
            <Grid container spacing={2}>
              {[
                { name: 'buyerShipInitial', label: 'Buyer Ship. Dt. (Initial)' },
                { name: 'buyerShipLast', label: 'Buyer Ship. Dt. (Last)' },
              ].map(({ name, label }) => (
                <Grid item xs={12} sm={6} key={name}>
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

          {/* ----------------- Section: Vendor Shipment ----------------- */}
          <Card sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              VENDOR SHIPMENT WINDOW
            </Typography>
            <Grid container spacing={2}>
              {[
                { name: 'vendorShipInitial', label: 'Vendor Ship. Dt. (Initial)' },
                { name: 'vendorShipLast', label: 'Vendor Ship. Dt. (Last)' },
                { name: 'finalInspectionDate', label: 'Final Inspection Date' },
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

          {/* ----------------- Section: Product Portfolio ----------------- */}
        <Box
  sx={{
    backgroundColor: '#ffffff', // white background
    p: 3, // padding
    borderRadius: 2, // rounded corners
    mb: 4, // page ko thoda neeche extend karega
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', // soft shadow
  }}
>
  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
    PRODUCT INFORMATION
  </Typography>

  <Grid container spacing={2}>
    {/* Product Portfolio */}
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
              onChange={(e) => handlePortfolioChange('productPortfolio', e.target.value)}
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

    {/* Product Category */}
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
              onChange={(e) => handleCategoryChange('productCategory', e.target.value)}
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

    {/* Product Group */}
    <Grid item xs={12} sm={4}>
      <Controller
        name="productGroup"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Product Group</InputLabel>
            <Select {...field} label="Product Group">
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

    {/* Line 2 */}
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
            <Select {...field} label="Set">
              <MenuItem value="Set">Set</MenuItem>
              <MenuItem value="PCS">PCS</MenuItem>
              <MenuItem value="KG">KG</MenuItem>
            </Select>
          </FormControl>
        )}
      />
    </Grid>

    {/* Line 3 */}
    <Grid item xs={12} sm={4}>
      <Controller name="fabric" render={({ field }) => <TextField {...field} fullWidth label="Fabric" />} />
    </Grid>
    <Grid item xs={12} sm={4}>
      <Controller name="item" render={({ field }) => <TextField {...field} fullWidth label="Item" />} />
    </Grid>
    <Grid item xs={12} sm={4}>
      <Controller name="qualityComposition" render={({ field }) => <TextField {...field} fullWidth label="Quality / Composition" />} />
    </Grid>

    {/* Line 4 */}
    <Grid item xs={12} sm={4}>
      <Controller name="gsm" render={({ field }) => <TextField {...field} fullWidth label="GSM" />} />
    </Grid>
    <Grid item xs={12} sm={4}>
      <Controller name="design" render={({ field }) => <TextField {...field} fullWidth label="Design" />} />
    </Grid>
    <Grid item xs={12} sm={4}>
      <Controller name="otherFabric" render={({ field }) => <TextField {...field} fullWidth label="Other Fabric" />} />
    </Grid>

    {/* Line 5 */}
    <Grid item xs={12} sm={6}>
      <Controller name="gsmOF" render={({ field }) => <TextField {...field} fullWidth label="GSM (O.F)" />} />
    </Grid>
    <Grid item xs={12} sm={6}>
      <Controller name="construction" render={({ field }) => <TextField {...field} fullWidth label="Construction" />} />
    </Grid>

    {/* Line 6 */}
    <Grid item xs={12} sm={6}>
      <Controller name="poSpecialOperation" render={({ field }) => <TextField {...field} fullWidth label="PO Special Operation" />} />
    </Grid>
    <Grid item xs={12} sm={6}>
      <Controller
        name="status"
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select {...field} label="Status">
              <MenuItem value="Inspection">Inspection</MenuItem>
              <MenuItem value="Cancel">Cancel</MenuItem>
              <MenuItem value="Close">Close</MenuItem>
            </Select>
          </FormControl>
        )}
      />
    </Grid>

    {/* Line 7 */}
    <Grid item xs={12} sm={4}>
      <Controller name="poSpecialTreatment" render={({ field }) => <TextField {...field} fullWidth label="PO Special Treatment" />} />
    </Grid>
    <Grid item xs={12} sm={4}>
      <Controller name="styleSource" render={({ field }) => <TextField {...field} fullWidth label="Style Source" />} />
    </Grid>
    <Grid item xs={12} sm={4}>
      <Controller name="brand" render={({ field }) => <TextField {...field} fullWidth label="Brand" />} />
    </Grid>

    {/* Line 8 */}
    <Grid item xs={12} sm={4}>
      <Controller
        name="assortment"
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Assortment</InputLabel>
            <Select {...field} label="Assortment">
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

    {/* Inquiry No (Left) and Buyer Customer (Right) */}
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
              <Select {...field} label="Inquiry No">
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



          {/* ----------------- Product Specific Information ----------------- */}
          <Card sx={{ p: 3, mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                PRODUCT SPECIFIC INFORMATION
              </Typography>

              <Grid container spacing={2}>
                {/* Currency */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="currency"
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Currency</InputLabel>
                        <Select {...field} label="Currency">
                          <MenuItem value="0">Dollar</MenuItem>
                          <MenuItem value="1">PKR</MenuItem>
                          <MenuItem value="2">Euro</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Exchange Rate */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="exchangeRate"
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Exchange Rate (to USD)" />
                    )}
                  />
                </Grid>

                {/* Style */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="style"
                    render={({ field }) => <TextField {...field} fullWidth label="Style" />}
                  />
                </Grid>
              </Grid>

              {/* Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleOpenItemDialog}
                >
                  Add Item Details
                </Button>
                <Button variant="contained" color="primary">
                  Show Selections
                </Button>
                <Button variant="contained" color="primary">
                  Calculate
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* ----------------- Item Details Dialog ----------------- */}
          <Dialog open={openItemDialog} onClose={handleCloseItemDialog} maxWidth="lg" fullWidth>
            <DialogTitle>ITEM DETAILS</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={4}>
                  <Controller
                    name="styleNo"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Style No" fullWidth size="small" />
                    )}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Controller
                    name="colorway"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Colorway" fullWidth size="small" />
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
                        <InputLabel>Size Range</InputLabel>
                        <Select {...field} label="Size Range">
                          <MenuItem value="">
                            <em>Select Size Range</em>
                          </MenuItem>
                          {sizeRangeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={handleSubmit(handleItemSubmit)}
              >
                Add
              </Button>

              {rows.length > 0 && (
                <>
                  <TableContainer component={Paper} sx={{ mt: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
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
                            <TableCell>{row.colorway}</TableCell>
                            <TableCell>{row.productCode}</TableCell>
                            <TableCell>{row.sizeRange}</TableCell>
                            <TableCell>{row.size}</TableCell>
                            <TableCell>
                              <TextField
                                value={row.quantity}
                                type="number"
                                size="small"
                                onChange={(e) =>
                                  handleQuantityChange(index, e.target.value)
                                }
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
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total Qty: {totalQuantity}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total Value: {totalValue.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={handleSave} variant="contained" color="primary">
                Save
              </Button>
              <Button onClick={handleSaveAndClose} variant="contained" color="success">
                Save & Close
              </Button>
              <Button onClick={handleCloseItemDialog} color="error">
                Close
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* ----------------- Shipping and Payment Terms ----------------- */}
          <Card sx={{ p: 3, mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                SHIPPING AND PAYMENT TERMS
              </Typography>

              <Grid container spacing={2}>
                {/* Payment Mode */}
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
                          <Select {...field} label="Payment Mode">
                            {paymentOptions.map((p) => (
                              <MenuItem key={p.id} value={p.name}>
                                {p.name}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Shipment Term */}
                <Grid item xs={12} sm={3}>
                  <Controller
                    name="shipmentTerm"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Shipment Term</InputLabel>
                        {shipmentLoading ? (
                          <CircularProgress size={24} />
                        ) : shipmentError ? (
                          <Typography color="error">{shipmentError}</Typography>
                        ) : (
                          <Select {...field} label="Shipment Term">
                            {shipmentOptions.map((s) => (
                              <MenuItem key={s.id} value={s.name}>
                                {s.name}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Destination */}
                <Grid item xs={12} sm={3}>
                  <Controller
                    name="destination"
                    render={({ field }) => <TextField {...field} fullWidth label="Destination" />}
                  />
                </Grid>

                {/* Shipment Mode */}
                <Grid item xs={12} sm={3}>
                  <Controller
                    name="shipmentMode"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Shipment Mode</InputLabel>
                        {deliveryLoading ? (
                          <CircularProgress size={24} />
                        ) : deliveryError ? (
                          <Typography color="error">{deliveryError}</Typography>
                        ) : (
                          <Select {...field} label="Shipment Mode">
                            {deliveryOptions.map((d) => (
                              <MenuItem key={d.id} value={d.name}>
                                {d.name}
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
                    name="ShipmentMode"
                    render={({ field }) => <TextField {...field} fullWidth label="Shipment Mode" />}
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
                  { name: 'originalPurchaseOrder', label: 'Original Purchase Order' },
                  {
                    name: 'processOrderConfirmation',
                    label: 'Process at the time Order Confirmation',
                  },
                  { name: 'finalSpecs', label: 'Final Specs' },
                  { name: 'productImage', label: 'Product Image' },
                  { name: 'ppComment', label: 'PP Comment Received' },
                  { name: 'sizeSetComment', label: 'Size Set Comment' },
                ].map(({ name, label }) => (
                  <Grid item xs={12} sm={6} key={name}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<UploadFileIcon />}
                    >
                      {label}
                      <input type="file" hidden onChange={(e) => handleFileChange(name, e)} />
                    </Button>
                    <Typography variant="body2" sx={{ mt: 1, color: 'gray' }}>
                      {files[name] ? files[name].name : 'No file chosen'}
                    </Typography>
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
                {/* Bank Dropdown */}
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
                          <Select {...field} label="Bank">
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

                {/* Title of Account */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="titleOfAccount"
                    render={({ field }) => (
                      <TextField {...field} label="Title Of Account" fullWidth />
                    )}
                  />
                </Grid>

                {/* Bank Name */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="bankName"
                    render={({ field }) => <TextField {...field} label="Bank Name" fullWidth />}
                  />
                </Grid>

                {/* Bank Branch */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="bankBranch"
                    render={({ field }) => <TextField {...field} label="Bank Branch" fullWidth />}
                  />
                </Grid>

                {/* Account No. */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="accountNo"
                    render={({ field }) => <TextField {...field} label="Account No." fullWidth />}
                  />
                </Grid>

                {/* Routing No. */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="routingNo"
                    render={({ field }) => <TextField {...field} label="Routing No." fullWidth />}
                  />
                </Grid>
              </Grid>

              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
                <Button type="submit" variant="contained" color="primary">
                  Save
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Save & Email
                </Button>
                <Button type="button" variant="contained" color="primary">
                  Cancel
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Main Submit Button */}
        </form>
      </Container>
    </FormProvider>
  );
}
