import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Container,
  Autocomplete,
  Stack,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import axios from 'src/utils/axios';
import { paths } from 'src/routes/paths';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------
// Constants & Options (Exact match with Old AMS ICRSupplierEntryBySupplier.aspx)
// ----------------------------------------------------------------------
const TASK_NATURE_OPTIONS = [
  { label: 'IPC', value: 'IPC' },
  { label: 'MPC', value: 'MPC' },
  { label: 'Pre-Final', value: 'Pre-Final' },
  { label: 'Final', value: 'Final' },
];

const INITIAL_FORM_STATE = {
  icrDetailID: 0,
  supplierId: '',
  supplierName: '',
  customerId: '',
  customerName: '',
  poId: '',
  poNo: '',
  styleNo: '',
  orderQty: '',
  offerQty: '',
  color: '',
  actualShipDate: '',
  offerDate: '',
  planDate: '',
  taskNature: 'IPC',
  remarks: '',
  qamRemarks: '',
  icrStatusID: 0, // 0: Pending, 1: Approved, 2: Rejected
  qcPlanned: '',
};

export default function ICRFormPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Role & Session information from localStorage (matching Old AMS patterns).
  // Old AMS stores Session("SupplierId") = UMUser.EmployeeId at login; > 0 means supplier.
  const currentSupplierId = useMemo(() => {
    const raw =
      localStorage.getItem('employeeId') ||
      localStorage.getItem('supplierId') ||
      localStorage.getItem('SupplierId') ||
      localStorage.getItem('supplierID');
    return raw ? Number(raw) : 0;
  }, []);

  const isSupplier = currentSupplierId > 0;

  // In Old AMS (ICRSupplierView.aspx.vb line 22-24):
  // If VenderIDd > 0 Then btnAddICR.Visible = True  -> only suppliers can add.
  const canAddICR = isSupplier;

  // In Old AMS (ICRSupplierView.aspx.vb line 39-41):
  // If VenderIDd > 0 Then dgforQDnew.Columns(14).Visible = False (Column 14 is "Approve / Reject").
  // Supplier users CANNOT approve/reject; that is for internal users only.
  const canApproveReject = !isSupplier;

  // View state: 'list' | 'add' | 'approval' (Separate proper page for Approve / Reject)
  const [activeTab, setActiveTab] = useState('list');
  const [searchPoNo, setSearchPoNo] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [icrList, setIcrList] = useState([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form State (for Add ICR)
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Dropdown options
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [poList, setPoList] = useState([]);
  const [styleList, setStyleList] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // Drag-to-scroll state for ICR Grid Table (Smooth horizontal scrolling)
  const tableContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleGridMouseDown = (e) => {
    // Only drag on left click and avoid interactive elements
    if (e.button !== 0) return;
    const interactive = e.target.closest('button, a, input, [role="button"], .MuiButtonBase-root');
    if (interactive) return;

    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeftState(tableContainerRef.current.scrollLeft);
  };

  const handleGridMouseLeave = () => {
    setIsDragging(false);
  };

  const handleGridMouseUp = () => {
    setIsDragging(false);
  };

  const handleGridMouseMove = (e) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Smooth scroll multiplier
    tableContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  // Approve / Reject Confirmation Popup/Dialog State
  const [approvalDialogState, setApprovalDialogState] = useState({
    open: false,
    item: null,
    actionType: null, // 'Approve' | 'Reject'
    planDate: '',
    remarks: '',
  });

  // ----------------------------------------------------------------------
  // 1. Load ICR Records List
  // API: GET /api/ICRSupplier/GridView?supplierID=0
  // ----------------------------------------------------------------------
  const fetchICRList = useCallback(
    async (poSearch = '') => {
      setLoadingList(true);
      try {
        const supId = Number(currentSupplierId) || 0;
        const res = await axios.get('/api/ICRSupplier/GridView', {
          params: {
            supplierID: supId,
          },
        });

        // Verify and extract list from various response wrappers
        const raw = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data?.Data)
              ? res.data.Data
              : Array.isArray(res?.data?.result)
                ? res.data.result
                : Array.isArray(res?.data?.Result)
                  ? res.data.Result
                  : [];

        if (Array.isArray(raw) && raw.length > 0) {
          const mapped = raw.map((item, idx) => {
            const rawStatus =
              item.isStatus ??
              item.IsStatus ??
              item.status ??
              item.Status ??
              (Number(item.ICRStatusID ?? item.icrStatusID) === 1
                ? 'Approved'
                : Number(item.ICRStatusID ?? item.icrStatusID) === 2
                  ? 'Rejected'
                  : 'Pending');

            return {
              icrDetailID: item.icrDetailID ?? item.ICRDetailID ?? idx + 1,
              customerName: item.customerName ?? item.CustomerName ?? '',
              customerID: item.customerID ?? item.CustomerID ?? item.customerId ?? '',
              venderName: item.venderName ?? item.VenderName ?? item.supplier ?? '',
              venderLibraryID: item.venderLibraryID ?? item.VenderLibraryID ?? item.supplierID ?? item.SupplierID ?? 0,
              styleNo: item.styleNo ?? item.StyleNo ?? '',
              color: item.color ?? item.Color ?? item.articleNo ?? item.ArticleNo ?? '',
              pono: item.pono ?? item.PONO ?? item.poNo ?? item.PONo ?? '',
              poNo: item.pono ?? item.PONO ?? item.poNo ?? item.PONo ?? '',
              poId: item.poid ?? item.POID ?? item.poId ?? 0,
              shipmentDate: item.shipmentDate ?? item.ShipmentDate ?? '',
              taskNature: item.taskNature ?? item.TaskNature ?? item.remarks ?? item.Remarks ?? 'Final',
              offerQty: item.offerQty ?? item.OfferQty ?? item.quantity ?? 0,
              orderQty: item.orderQty ?? item.OrderQty ?? 0,
              actualDate: item.actualDate ?? item.ActualDate ?? item.offerDate ?? item.OfferDate ?? '',
              planDate: item.planDate ?? item.PlanDate ?? '',
              qcPlanned: item.qcPlanned ?? item.QCPlanned ?? item.userName ?? item.UserName ?? '',
              remarks: item.remarks ?? item.Remarks ?? '',
              qamRemarks: item.qamRemarks ?? item.QAMRemarks ?? '',
              isStatus: rawStatus,
              icrStatusID: Number(item.icrStatusID ?? item.ICRStatusID ?? (rawStatus === 'Approved' ? 1 : rawStatus === 'Rejected' ? 2 : 0)),
              raw: item,
            };
          });

          // Optional PO filter if user searches in client-side search box
          const filtered = poSearch
            ? mapped.filter((r) =>
              String(r.pono || '')
                .toLowerCase()
                .includes(poSearch.toLowerCase())
            )
            : mapped;

          setIcrList(filtered);
        } else {
          // Empty data fallback to local storage records if any, or empty array
          const localStored = localStorage.getItem('ams_icr_records');
          if (localStored) {
            try {
              const parsed = JSON.parse(localStored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const filtered = poSearch
                  ? parsed.filter((r) =>
                    String(r.pono || r.poNo || '')
                      .toLowerCase()
                      .includes(poSearch.toLowerCase())
                  )
                  : parsed;
                setIcrList(filtered);
                return;
              }
            } catch {
              // ignore
            }
          }
          setIcrList([]);
        }
      } catch (err) {
        console.error('Error fetching ICR Supplier GridView:', err);
        enqueueSnackbar('Failed to load ICR Grid data. Please check connection.', {
          variant: 'error',
        });
        // Fallback to local storage
        const localStored = localStorage.getItem('ams_icr_records');
        if (localStored) {
          try {
            setIcrList(JSON.parse(localStored));
          } catch {
            setIcrList([]);
          }
        } else {
          setIcrList([]);
        }
      } finally {
        setLoadingList(false);
      }
    },
    [currentSupplierId, enqueueSnackbar]
  );

  useEffect(() => {
    fetchICRList();
  }, [fetchICRList]);

  // ----------------------------------------------------------------------
  // 2. Dropdown APIs: Supplier, Customer, PO
  // ----------------------------------------------------------------------
  // Fetch Suppliers: GET /api/ICRSupplier/GetSuppliers?supplierID=0
  useEffect(() => {
    let mounted = true;
    const fetchSuppliers = async () => {
      setDropdownLoading(true);
      try {
        const supParam = Number(currentSupplierId) || 0;
        const res = await axios.get('/api/ICRSupplier/GetSuppliers', {
          params: { supplierID: supParam },
        });

        const raw = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data?.Data)
              ? res.data.Data
              : Array.isArray(res?.data?.result)
                ? res.data.result
                : Array.isArray(res?.data?.Result)
                  ? res.data.Result
                  : [];

        if (mounted) {
          const mapped = raw.map((s) => ({
            id: s.venderLibraryID ?? s.VenderLibraryID ?? s.supplierID ?? s.SupplierID ?? s.id,
            name: s.venderName ?? s.VenderName ?? s.supplierName ?? s.SupplierName ?? s.name ?? '',
          }));
          setSuppliers(mapped);

          // If current user is tied to a specific supplier, auto-select
          if (currentSupplierId > 0) {
            const found = mapped.find((s) => Number(s.id) === currentSupplierId);
            if (found) {
              setFormData((prev) => ({
                ...prev,
                supplierId: found.id,
                supplierName: found.name,
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      } finally {
        if (mounted) setDropdownLoading(false);
      }
    };

    fetchSuppliers();
    return () => {
      mounted = false;
    };
  }, [currentSupplierId]);

  // Fetch Customers when Supplier changes: GET /api/ICRSupplier/GetCustomers?supplierID={supplierID}
  useEffect(() => {
    let mounted = true;
    const fetchCustomers = async () => {
      const selectedSupplierId = Number(formData.supplierId) || 0;
      if (!selectedSupplierId) {
        setCustomers([]);
        return;
      }

      setDropdownLoading(true);
      try {
        const res = await axios.get('/api/ICRSupplier/GetCustomers', {
          params: { supplierID: selectedSupplierId },
        });

        const raw = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data?.Data)
              ? res.data.Data
              : Array.isArray(res?.data?.result)
                ? res.data.result
                : Array.isArray(res?.data?.Result)
                  ? res.data.Result
                  : [];

        if (mounted) {
          const mapped = raw.map((c) => ({
            id: c.customerID ?? c.CustomerID ?? c.id,
            name: c.customerName ?? c.CustomerName ?? c.name ?? '',
          }));
          // Ensure currently selected customer remains in list
          if (
            formData.customerId &&
            !mapped.some((c) => String(c.id) === String(formData.customerId))
          ) {
            mapped.push({
              id: formData.customerId,
              name: formData.customerName || `Customer #${formData.customerId}`,
            });
          }
          setCustomers(mapped);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        if (mounted) {
          if (formData.customerId) {
            setCustomers((prev) =>
              prev.some((c) => String(c.id) === String(formData.customerId))
                ? prev
                : [{ id: formData.customerId, name: formData.customerName || `Customer #${formData.customerId}` }]
            );
          } else {
            setCustomers([]);
          }
        }
      } finally {
        if (mounted) setDropdownLoading(false);
      }
    };

    fetchCustomers();
    return () => {
      mounted = false;
    };
  }, [formData.supplierId]);

  // Fetch POs when Customer & Supplier are selected: GET /api/ICRSupplier/GetPOs?customerID={customerID}&supplierID={supplierID}
  useEffect(() => {
    let mounted = true;
    const fetchPOs = async () => {
      const selectedCustId = Number(formData.customerId) || 0;
      const selectedSupId = Number(formData.supplierId) || 0;

      if (!selectedCustId || !selectedSupId) {
        if (!formData.poId) {
          setPoList([]);
        }
        return;
      }

      setDropdownLoading(true);
      try {
        const res = await axios.get('/api/ICRSupplier/GetPOs', {
          params: {
            customerID: selectedCustId,
            supplierID: selectedSupId,
          },
        });

        const raw = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.data?.Data)
              ? res.data.Data
              : Array.isArray(res?.data?.result)
                ? res.data.result
                : Array.isArray(res?.data?.Result)
                  ? res.data.Result
                  : [];

        if (mounted) {
          const mapped = raw.map((p) => ({
            id: p.poid ?? p.POID ?? p.id,
            poNo: String(p.pono ?? p.PONO ?? p.poNo ?? p.label ?? ''),
            raw: p,
          }));
          // Ensure currently selected PO remains in list
          if (
            formData.poId &&
            !mapped.some((p) => String(p.id) === String(formData.poId))
          ) {
            mapped.unshift({
              id: formData.poId,
              poNo: formData.poNo || String(formData.poId),
            });
          }
          setPoList(mapped);
        }
      } catch (err) {
        console.error('Error fetching POs:', err);
        if (mounted) {
          if (formData.poId) {
            setPoList((prev) =>
              prev.some((p) => String(p.id) === String(formData.poId))
                ? prev
                : [{ id: formData.poId, poNo: formData.poNo || String(formData.poId) }]
            );
          } else {
            setPoList([]);
          }
        }
      } finally {
        if (mounted) setDropdownLoading(false);
      }
    };

    fetchPOs();
    return () => {
      mounted = false;
    };
  }, [formData.customerId, formData.supplierId]);

  // Handler when Supplier changes
  const handleSupplierChange = (id) => {
    const matched = suppliers.find((s) => String(s.id) === String(id));
    setFormData((prev) => ({
      ...prev,
      supplierId: id,
      supplierName: matched ? matched.name : '',
      // Clear dependent Customer and PO
      customerId: '',
      customerName: '',
      poId: '',
      poNo: '',
      styleNo: '',
      orderQty: '',
      actualShipDate: '',
    }));
    setCustomers([]);
    setPoList([]);
    setStyleList([]);
  };

  // Handler when Customer changes
  const handleCustomerChange = (id) => {
    const matched = customers.find((c) => String(c.id) === String(id));
    setFormData((prev) => ({
      ...prev,
      customerId: id,
      customerName: matched ? matched.name : '',
      // Clear dependent PO and related fields
      poId: '',
      poNo: '',
      styleNo: '',
      orderQty: '',
      actualShipDate: '',
    }));
    setPoList([]);
    setStyleList([]);
  };

  // When PO is selected, load styles & shipment details
  const handlePOChange = async (selectedPOObj) => {
    if (!selectedPOObj) {
      setFormData((prev) => ({
        ...prev,
        poId: '',
        poNo: '',
        styleNo: '',
        orderQty: '',
        actualShipDate: '',
      }));
      setStyleList([]);
      return;
    }

    const poid = selectedPOObj.id;
    setFormData((prev) => ({
      ...prev,
      poId: poid,
      poNo: selectedPOObj.poNo,
    }));

    // Fetch Styles for this PO
    try {
      const res = await axios.get('/api/Milestone/GetStyle', {
        params: { poid },
      });
      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
      const styles = raw.map((s) => ({
        styleId: s.styleID ?? s.styleId ?? s.id,
        styleNo: s.styleNo ?? s.StyleNo ?? '',
        color: s.colorway ?? s.Colorway ?? s.color ?? '',
        poQty: s.quantity ?? s.poQty ?? s.POQty ?? 0,
        shipmentDate: s.shipmentDate ?? s.ShipmentDate ?? '',
        raw: s,
      }));
      setStyleList(styles);

      // Auto-populate first style details if available
      if (styles.length > 0) {
        const first = styles[0];
        setFormData((prev) => ({
          ...prev,
          styleNo: first.styleNo,
          color: first.color || prev.color,
          orderQty: first.poQty ? String(first.poQty) : prev.orderQty,
          actualShipDate: first.shipmentDate
            ? new Date(first.shipmentDate).toISOString().split('T')[0]
            : prev.actualShipDate,
        }));
      }
    } catch (err) {
      console.warn('Error loading styles for PO:', err);
    }
  };

  const handleStyleChange = (styleNo) => {
    const matched = styleList.find((s) => s.styleNo === styleNo);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        styleNo,
        color: matched.color || prev.color,
        orderQty: matched.poQty ? String(matched.poQty) : prev.orderQty,
        actualShipDate: matched.shipmentDate
          ? new Date(matched.shipmentDate).toISOString().split('T')[0]
          : prev.actualShipDate,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        styleNo,
      }));
    }
  };

  // ----------------------------------------------------------------------
  // 3. Validation & Submit New or Updated ICR Request
  // APIs:
  // - POST /api/ICRSupplier/AddICR (Create)
  // - PUT  /api/ICRSupplier/UpdateICR (Update)
  // ----------------------------------------------------------------------
  const handleSaveICR = async (e) => {
    if (e) e.preventDefault();

    if (!formData.poNo || !formData.poId) {
      enqueueSnackbar('Please select a valid PO #', { variant: 'warning' });
      return;
    }
    if (!formData.styleNo) {
      enqueueSnackbar('Style Number is required', { variant: 'warning' });
      return;
    }
    if (!formData.offerQty || Number(formData.offerQty) <= 0) {
      enqueueSnackbar('Please enter a valid Offer Quantity', { variant: 'warning' });
      return;
    }
    if (!formData.offerDate) {
      enqueueSnackbar('Offer Date is required', { variant: 'warning' });
      return;
    }

    // Old AMS Validation:
    // "Inspection requests must be submit minimum 3 days before."
    const selectedDate = new Date(formData.offerDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minAllowedDate = new Date(today);
    minAllowedDate.setDate(minAllowedDate.getDate() - 3);

    if (selectedDate < minAllowedDate) {
      enqueueSnackbar(
        `Offer date must be greater than or equal to ${minAllowedDate.toLocaleDateString()}. Minimum 3 days advance notice required.`,
        { variant: 'error' }
      );
      return;
    }

    setSaving(true);
    try {
      // Format actualDate as ISO string format
      let actualDateIso;
      try {
        actualDateIso = new Date(formData.offerDate).toISOString();
      } catch {
        actualDateIso = new Date().toISOString();
      }

      // Check if in Edit mode
      const isEditMode = Boolean(formData.icrDetailID && Number(formData.icrDetailID) > 0);

      if (isEditMode) {
        // Format planDate
        let planDateVal = '';
        if (formData.planDate) {
          try {
            planDateVal = new Date(formData.planDate).toISOString();
          } catch {
            planDateVal = String(formData.planDate);
          }
        }

        // Exact 10 fields required by PUT /api/ICRSupplier/UpdateICR:
        // icrDetailID, styleNo, color, taskNature, orderQty, offerQty, actualDate, planDate, remarks, qamRemarks
        const updatePayload = {
          icrDetailID: Number(formData.icrDetailID),
          styleNo: String(formData.styleNo || '').trim(),
          color: String(formData.color || '').trim(),
          taskNature: String(formData.taskNature || 'Final').trim(),
          orderQty: Number(formData.orderQty) || 0,
          offerQty: Number(formData.offerQty) || 0,
          actualDate: actualDateIso,
          planDate: planDateVal,
          remarks: String(formData.remarks || formData.qamRemarks || '').trim(),
          qamRemarks: String(formData.qamRemarks || '').trim(),
        };

        await axios.put('/api/ICRSupplier/UpdateICR', updatePayload);

        enqueueSnackbar('Inspection Certificate Request updated successfully!', {
          variant: 'success',
        });
      } else {
        // Create mode: POST /api/ICRSupplier/AddICR
        const addPayload = {
          poid: Number(formData.poId) || 0,
          styleNo: String(formData.styleNo || '').trim(),
          color: String(formData.color || '').trim(),
          taskNature: String(formData.taskNature || 'Final').trim(),
          offerQty: Number(formData.offerQty) || 0,
          orderQty: Number(formData.orderQty) || 0,
          actualDate: actualDateIso,
          qamRemarks: String(formData.qamRemarks || '').trim(),
        };

        await axios.post('/api/ICRSupplier/AddICR', addPayload);

        enqueueSnackbar('Inspection Certificate Request submitted successfully!', {
          variant: 'success',
        });
      }

      // Reset form and return to list
      setFormData(INITIAL_FORM_STATE);
      setStyleList([]);
      setPoList([]);
      setActiveTab('list');
      fetchICRList();
    } catch (err) {
      console.error('Error saving ICR:', err);
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          'Failed to save ICR request. Please check inputs and retry.';
      enqueueSnackbar(errMsg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------------------
  // 4. Edit ICR Record (Dedicated Edit Form/Page)
  // GET /api/ICRSupplier/GetICREdit/{icrDetailID}
  // ----------------------------------------------------------------------
  const handleEditICR = async (item) => {
    const rawIcrDetailId = item?.icrDetailID ?? item?.ICRDetailID ?? item?.id ?? 0;
    const icrDetailId = Number(rawIcrDetailId);

    // Initial fallback state from row item
    const fallbackOfferDate = item?.actualDate ? String(item.actualDate).split('T')[0] : '';
    const fallbackPlanDate =
      item?.planDate && !String(item.planDate).startsWith('1990-01-01')
        ? String(item.planDate).split('T')[0]
        : '';
    const fallbackShipDate =
      item?.shipmentDate && !String(item.shipmentDate).startsWith('1990-01-01')
        ? String(item.shipmentDate).split('T')[0]
        : '';

    setFormData({
      icrDetailID: icrDetailId,
      supplierId: item?.venderLibraryID ?? item?.supplierID ?? '',
      supplierName: item?.venderName ?? item?.supplierName ?? '',
      customerId: item?.customerID ?? '',
      customerName: item?.customerName ?? '',
      poId: item?.poId ?? item?.poid ?? '',
      poNo: item?.poNo ?? item?.pono ?? '',
      styleNo: item?.styleNo ?? '',
      orderQty: item?.orderQty != null ? String(item.orderQty) : '',
      offerQty: item?.offerQty != null ? String(item.offerQty) : '',
      color: item?.color ?? '',
      actualShipDate: fallbackShipDate,
      offerDate: fallbackOfferDate,
      planDate: fallbackPlanDate,
      taskNature: item?.taskNature || 'Final',
      remarks: item?.remarks || item?.qamRemarks || '',
      qamRemarks: item?.qamRemarks || '',
      icrStatusID: item?.icrStatusID ?? 0,
      qcPlanned: item?.qcPlanned || '',
    });

    if (item?.poId && item?.poNo) {
      setPoList([{ id: item.poId, poNo: item.poNo }]);
    }
    if (item?.styleNo) {
      setStyleList([
        {
          styleNo: item.styleNo,
          color: item.color || '',
          poQty: item.orderQty || 0,
          shipmentDate: item.shipmentDate || '',
        },
      ]);
    }

    setActiveTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Asynchronously fetch fresh data via GET /api/ICRSupplier/GetICREdit/{icrDetailID}
    if (icrDetailId > 0) {
      setLoadingEdit(true);
      try {
        const res = await axios.get(`/api/ICRSupplier/GetICREdit/${encodeURIComponent(icrDetailId)}`);
        const resData = res?.data?.data ?? res?.data?.Data ?? res?.data?.result ?? res?.data?.Result ?? res?.data;
        const editData = Array.isArray(resData) ? resData[0] : resData;

        if (editData) {
          const detailId = editData.icrDetailID ?? editData.ICRDetailID ?? icrDetailId;
          const supId = editData.venderLibraryID ?? editData.supplierID ?? editData.SupplierID ?? item?.venderLibraryID ?? '';
          const supName = editData.venderName ?? editData.supplierName ?? editData.SupplierName ?? item?.venderName ?? '';
          const custId = editData.customerID ?? editData.CustomerID ?? item?.customerID ?? '';
          const custName = editData.customerName ?? editData.CustomerName ?? item?.customerName ?? '';
          const poId = editData.poid ?? editData.POID ?? editData.poId ?? item?.poId ?? '';
          const poNo = String(editData.pono ?? editData.PONO ?? editData.poNo ?? item?.poNo ?? '');
          const styleNo = String(editData.styleNo ?? editData.StyleNo ?? item?.styleNo ?? '');
          const orderQty = editData.orderQty ?? editData.OrderQty ?? item?.orderQty ?? '';
          const offerQty = editData.offerQty ?? editData.OfferQty ?? item?.offerQty ?? '';
          const color = String(editData.color ?? editData.Color ?? editData.articleNo ?? item?.color ?? '');
          const taskNature = String(editData.taskNature ?? editData.TaskNature ?? item?.taskNature ?? 'Final');
          const remarksVal = String(editData.remarks ?? editData.Remarks ?? editData.qamRemarks ?? editData.QAMRemarks ?? '');
          const qamRemarksVal = String(editData.qamRemarks ?? editData.QAMRemarks ?? editData.remarks ?? editData.Remarks ?? '');

          // Dates formatting
          let offerDateStr = '';
          const rawActualDate = editData.actualDate ?? editData.ActualDate ?? editData.offerDate;
          if (rawActualDate && !String(rawActualDate).startsWith('1990-01-01')) {
            offerDateStr = String(rawActualDate).split('T')[0];
          } else if (fallbackOfferDate) {
            offerDateStr = fallbackOfferDate;
          }

          let planDateStr = '';
          const rawPlanDate = editData.planDate ?? editData.PlanDate;
          if (rawPlanDate && !String(rawPlanDate).startsWith('1990-01-01')) {
            planDateStr = String(rawPlanDate).split('T')[0];
          } else if (fallbackPlanDate) {
            planDateStr = fallbackPlanDate;
          }

          let shipDateStr = '';
          const rawShipDate = editData.shipmentDate ?? editData.ShipmentDate;
          if (rawShipDate && !String(rawShipDate).startsWith('1990-01-01')) {
            shipDateStr = String(rawShipDate).split('T')[0];
          } else if (fallbackShipDate) {
            shipDateStr = fallbackShipDate;
          }

          // Ensure supplier option exists in suppliers list
          if (supId) {
            setSuppliers((prev) => {
              if (prev.some((s) => String(s.id) === String(supId))) return prev;
              return [...prev, { id: supId, name: supName || `Supplier #${supId}` }];
            });
          }

          // Fetch customers for this supplier so full customer dropdown is populated
          let fetchedCustomers = [];
          if (supId) {
            try {
              const custRes = await axios.get('/api/ICRSupplier/GetCustomers', {
                params: { supplierID: Number(supId) },
              });
              const rawCust = Array.isArray(custRes?.data)
                ? custRes.data
                : Array.isArray(custRes?.data?.data)
                  ? custRes.data.data
                  : Array.isArray(custRes?.data?.Data)
                    ? custRes.data.Data
                    : Array.isArray(custRes?.data?.result)
                      ? custRes.data.result
                      : Array.isArray(custRes?.data?.Result)
                        ? custRes.data.Result
                        : [];
              fetchedCustomers = rawCust.map((c) => ({
                id: c.customerID ?? c.CustomerID ?? c.id,
                name: c.customerName ?? c.CustomerName ?? c.name ?? '',
              }));
            } catch (custErr) {
              console.warn('Error fetching customers in handleEditICR:', custErr);
            }
          }

          if (custId) {
            if (!fetchedCustomers.some((c) => String(c.id) === String(custId))) {
              fetchedCustomers = [
                ...fetchedCustomers,
                { id: custId, name: custName || `Customer #${custId}` },
              ];
            }
          }
          if (fetchedCustomers.length > 0) {
            setCustomers(fetchedCustomers);
          }

          // Fetch POs for this customer & supplier so full PO list is populated
          let fetchedPOs = [];
          if (supId && custId) {
            try {
              const poRes = await axios.get('/api/ICRSupplier/GetPOs', {
                params: {
                  customerID: Number(custId),
                  supplierID: Number(supId),
                },
              });
              const rawPOs = Array.isArray(poRes?.data)
                ? poRes.data
                : Array.isArray(poRes?.data?.data)
                  ? poRes.data.data
                  : Array.isArray(poRes?.data?.Data)
                    ? poRes.data.Data
                    : Array.isArray(poRes?.data?.result)
                      ? poRes.data.result
                      : Array.isArray(poRes?.data?.Result)
                        ? poRes.data.Result
                        : [];
              fetchedPOs = rawPOs.map((p) => ({
                id: p.poid ?? p.POID ?? p.id,
                poNo: String(p.pono ?? p.PONO ?? p.poNo ?? p.label ?? ''),
                raw: p,
              }));
            } catch (poErr) {
              console.warn('Error fetching POs in handleEditICR:', poErr);
            }
          }

          if (poId) {
            if (!fetchedPOs.some((p) => String(p.id) === String(poId))) {
              fetchedPOs = [{ id: poId, poNo: poNo || String(poId) }, ...fetchedPOs];
            }
          }
          if (fetchedPOs.length > 0) {
            setPoList(fetchedPOs);
          } else if (poId && poNo) {
            setPoList([{ id: poId, poNo }]);
          }

          // Set form state with accurate IDs and Names
          setFormData({
            icrDetailID: Number(detailId),
            supplierId: supId,
            supplierName: supName,
            customerId: custId,
            customerName: custName,
            poId,
            poNo,
            styleNo,
            orderQty: orderQty != null ? String(orderQty) : '',
            offerQty: offerQty != null ? String(offerQty) : '',
            color,
            actualShipDate: shipDateStr,
            offerDate: offerDateStr,
            planDate: planDateStr,
            taskNature,
            remarks: remarksVal,
            qamRemarks: qamRemarksVal,
            icrStatusID: editData.icrStatusID ?? editData.ICRStatusID ?? item?.icrStatusID ?? 0,
            qcPlanned: editData.qcPlanned ?? editData.QCPlanned ?? item?.qcPlanned ?? '',
          });

          if (styleNo) {
            setStyleList([
              {
                styleNo,
                color,
                poQty: orderQty || 0,
                shipmentDate: shipDateStr,
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Error fetching ICR Edit data via /api/ICRSupplier/GetICREdit:', err);
        enqueueSnackbar('Could not load detailed ICR data from server. Displaying local record.', {
          variant: 'warning',
        });
      } finally {
        setLoadingEdit(false);
      }
    }
  };

  // ----------------------------------------------------------------------
  // 5. Approve / Reject Confirmation Popup Handlers
  // ----------------------------------------------------------------------
  const [approvalActionLoading, setApprovalActionLoading] = useState(false);

  const handleOpenApprovalDialog = (item, actionType) => {
    setApprovalDialogState({
      open: true,
      item,
      actionType, // 'Approve' | 'Reject'
      planDate:
        item.planDate && item.planDate !== '1990-01-01'
          ? String(item.planDate).split('T')[0]
          : new Date().toISOString().split('T')[0],
      remarks: item.qamRemarks || '',
    });
  };

  const handleCloseApprovalDialog = () => {
    if (approvalActionLoading) return;
    setApprovalDialogState({
      open: false,
      item: null,
      actionType: null,
      planDate: '',
      remarks: '',
    });
  };

  const handleExecuteApproval = async (statusId) => {
    const { item, planDate, remarks } = approvalDialogState;
    if (!item) return;
    if (approvalActionLoading) return;

    if (statusId === 1 && !planDate) {
      enqueueSnackbar('Please select a Plan Date to approve the inspection', {
        variant: 'warning',
      });
      return;
    }

    setApprovalActionLoading(true);
    try {
      // Backend ApproveRejectICRDto: icrDetailID (required), action (required),
      // planDate (date-time, nullable), qamRemarks (nullable). Send null for empty planDate.
      let planDateVal = null;
      if (planDate) {
        try {
          const parsed = new Date(planDate);
          planDateVal = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
        } catch {
          planDateVal = null;
        }
      }

      const payload = {
        icrDetailID: Number(item.icrDetailID),
        action: statusId === 1 ? 'Approve' : 'Reject',
        planDate: planDateVal,
        qamRemarks: remarks ? String(remarks).trim() : null,
      };

      await axios.put('/api/ICRSupplier/ApproveReject', payload);

      enqueueSnackbar(
        statusId === 1 ? 'ICR Request Approved Successfully!' : 'ICR Request Rejected!',
        { variant: statusId === 1 ? 'success' : 'info' }
      );

      setApprovalDialogState({
        open: false,
        item: null,
        actionType: null,
        planDate: '',
        remarks: '',
      });
      fetchICRList();
    } catch (err) {
      console.error('Error in Approve/Reject workflow:', err);
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.response?.data?.title ||
          err?.message ||
          'Could not update status. Please try again.';
      enqueueSnackbar(errMsg, { variant: 'error' });
    } finally {
      setApprovalActionLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  const isEditing = Boolean(formData.icrDetailID && formData.icrDetailID > 0);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <CustomBreadcrumbs
        heading={
          activeTab === 'approval'
            ? 'ICR Approval & Inspection Planning'
            : activeTab === 'add'
              ? isEditing
                ? 'Edit ICR Request'
                : 'Add ICR Request'
              : 'ICR Form'
        }
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Power Tools', href: paths.dashboard.powerTool.root },
          { name: 'ICR Form', href: activeTab !== 'list' ? '#' : undefined, onClick: activeTab !== 'list' ? () => setActiveTab('list') : undefined },
          ...(activeTab === 'approval'
            ? [{ name: `Approve / Reject (PO #${approvalDialogState.item?.poNo || ''})` }]
            : activeTab === 'add'
              ? [{ name: isEditing ? 'Edit Request' : 'New Request' }]
              : []),
        ]}
        action={
          activeTab === 'list' && canAddICR ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => navigate(paths.dashboard.powerTool.icrAdd)}
              sx={{ fontWeight: 600 }}
            >
              Add ICR
            </Button>
          ) : activeTab === 'add' ? (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              onClick={() => {
                setFormData(INITIAL_FORM_STATE);
                setActiveTab('list');
              }}
              sx={{ fontWeight: 600 }}
            >
              Back to List
            </Button>
          ) : activeTab === 'approval' ? (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              onClick={() => {
                setActiveTab('list');
              }}
              sx={{ fontWeight: 600 }}
            >
              Back to List
            </Button>
          ) : null
        }
        sx={{ mb: 3 }}
      />

      {/* ==================================================================== */}
      {/* TAB 1: ICR LIST / SUPPLIER VIEW                                       */}
      {/* ==================================================================== */}
      {activeTab === 'list' && (
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            {/* Search Bar */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search by PO No."
                  placeholder="Enter PO #..."
                  value={searchPoNo}
                  onChange={(e) => setSearchPoNo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchICRList(searchPoNo);
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => fetchICRList(searchPoNo)}
                          edge="end"
                        >
                          <Iconify icon="eva:search-fill" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => fetchICRList(searchPoNo)}
                    sx={{ px: 3, fontWeight: 600 }}
                  >
                    Search
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => {
                      setSearchPoNo('');
                      fetchICRList('');
                    }}
                  >
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            {/* ICR Grid Table with Mouse Drag Horizontal Scrolling */}
            <TableContainer
              ref={tableContainerRef}
              component={Paper}
              variant="outlined"
              onMouseDown={handleGridMouseDown}
              onMouseLeave={handleGridMouseLeave}
              onMouseUp={handleGridMouseUp}
              onMouseMove={handleGridMouseMove}
              sx={{
                borderRadius: 1.5,
                overflowX: 'auto',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: isDragging ? 'none' : 'auto',
              }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: (theme) => theme.palette.background.neutral }}>
                  <TableRow>
                    {isSupplier ? (
                      <>
                        <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Style No</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>PO No.</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Shipment Date
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Task Nature
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Offer Qty
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Offer Date
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Plan Date
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Approved Person</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Status
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={{ fontWeight: 700 }}>PO No.</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Style No.</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Shipment Date
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Inspection Type
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Offer Qty
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Offer Date
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Plan Date
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Approved By</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Status
                        </TableCell>
                        {canApproveReject && (
                          <TableCell align="center" sx={{ fontWeight: 700, minWidth: 170 }}>
                            Actions
                          </TableCell>
                        )}
                        {canApproveReject && (
                          <TableCell align="center" sx={{ fontWeight: 700, minWidth: 70 }}>
                            Edit
                          </TableCell>
                        )}
                      </>
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loadingList ? (
                    <TableRow>
                      <TableCell colSpan={isSupplier ? 11 : 14} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={32} />
                        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                          Loading ICR records...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : icrList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSupplier ? 11 : 14} align="center" sx={{ py: 6 }}>
                        <Iconify
                          icon="solar:clipboard-list-bold-duotone"
                          width={48}
                          sx={{ color: 'text.disabled', mb: 1 }}
                        />
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                          No ICR records found.
                        </Typography>
                        {canAddICR && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(paths.dashboard.powerTool.icrAdd)}
                            sx={{ mt: 1.5 }}
                          >
                            Create First ICR Request
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    icrList
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => {
                        const statusColor =
                          row.isStatus === 'Approved'
                            ? 'success'
                            : row.isStatus === 'Rejected'
                              ? 'error'
                              : 'warning';

                        return (
                          <TableRow key={row.icrDetailID} hover>
                            {isSupplier ? (
                              <>
                                <TableCell>{row.venderName || '-'}</TableCell>
                                <TableCell>{row.styleNo || '-'}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{row.poNo}</TableCell>
                                <TableCell align="center">{row.shipmentDate || '-'}</TableCell>
                                <TableCell align="center">
                                  <Chip
                                    size="small"
                                    label={row.taskNature || 'Final'}
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                  {Number(row.offerQty).toLocaleString()}
                                </TableCell>
                                <TableCell align="center">{row.actualDate || '-'}</TableCell>
                                <TableCell align="center">{row.planDate || '-'}</TableCell>
                                <TableCell>{row.qcPlanned || '-'}</TableCell>
                                <TableCell>{row.qamRemarks || row.remarks || '-'}</TableCell>
                                <TableCell align="center">
                                  <Chip
                                    size="small"
                                    label={row.isStatus || 'Pending'}
                                    color={statusColor}
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell sx={{ fontWeight: 600 }}>{row.poNo}</TableCell>
                                <TableCell>{row.customerName || '-'}</TableCell>
                                <TableCell>{row.venderName || '-'}</TableCell>
                                <TableCell>{row.styleNo || '-'}</TableCell>
                                <TableCell>{row.color || '-'}</TableCell>
                                <TableCell align="center">{row.shipmentDate || '-'}</TableCell>
                                <TableCell align="center">
                                  <Chip
                                    size="small"
                                    label={row.taskNature || 'Final'}
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                  {Number(row.offerQty).toLocaleString()}
                                </TableCell>
                                <TableCell align="center">{row.actualDate || '-'}</TableCell>
                                <TableCell align="center">{row.planDate || '-'}</TableCell>
                                <TableCell>{row.qcPlanned || '-'}</TableCell>
                                <TableCell align="center">
                                  <Chip
                                    size="small"
                                    label={row.isStatus || 'Pending'}
                                    color={statusColor}
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>

                                {/* Actions Column: Approve / Reject (Old AMS status rules:
                                    Pending(0) -> Approve + Reject, Rejected(2) -> Approve only, Approved(1) -> none) */}
                                {canApproveReject && (
                                  <TableCell align="center">
                                    {row.icrStatusID === 1 ? (
                                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                        —
                                      </Typography>
                                    ) : (
                                      <Stack direction="row" spacing={1} justifyContent="center">
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          color="success"
                                          onClick={() => handleOpenApprovalDialog(row, 'Approve')}
                                          sx={{ textTransform: 'none', px: 1, py: 0.25, minWidth: 70 }}
                                        >
                                          Approve
                                        </Button>
                                        {row.icrStatusID === 0 && (
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleOpenApprovalDialog(row, 'Reject')}
                                            sx={{ textTransform: 'none', px: 1, py: 0.25, minWidth: 65 }}
                                          >
                                            Reject
                                          </Button>
                                        )}
                                      </Stack>
                                    )}
                                  </TableCell>
                                )}

                                {/* Edit Column moved to the very last (internal users only) */}
                                {canApproveReject && (
                                  <TableCell align="center">
                                    <Tooltip title="Edit ICR Record">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => navigate(paths.dashboard.powerTool.icrEdit(row.icrDetailID))}
                                      >
                                        <Iconify icon="solar:pen-bold" width={18} />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                )}
                              </>
                            )}
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {icrList.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={icrList.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: ADD / EDIT ICR ENTRY                                          */}
      {/* ==================================================================== */}
      {activeTab === 'add' && (
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            {/* Instruction Notice text displayed strictly on Edit page */}
            {isEditing && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 1.5, fontWeight: 500 }}>
                Inspection requests must be submitted a minimum of 3 days before the requested inspection date.
              </Alert>
            )}

            <Box component="form" onSubmit={handleSaveICR} noValidate>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Iconify
                  icon={isEditing ? 'solar:pen-bold' : 'solar:document-add-bold-duotone'}
                  width={22}
                />
                {isEditing ? 'Edit ICR Request Form' : 'Online ICR Request Form'}
                {loadingEdit && <CircularProgress size={18} sx={{ ml: 1 }} />}
              </Typography>

              <Grid container spacing={3}>
                {/* Supplier Dropdown */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Supplier *"
                    value={formData.supplierId != null ? String(formData.supplierId) : ''}
                    onChange={(e) => {
                      const val = e?.target?.value ?? e;
                      handleSupplierChange(val);
                    }}
                    disabled={isSupplier}
                  >
                    <MenuItem value="">
                      <em>-- Select Supplier --</em>
                    </MenuItem>
                    {/* Ensure selected supplier is present in options list */}
                    {formData.supplierId &&
                      !suppliers.some(
                        (s) => String(s?.id) === String(formData.supplierId)
                      ) && (
                        <MenuItem value={String(formData.supplierId)}>
                          {formData.supplierName || `Supplier #${formData.supplierId}`}
                        </MenuItem>
                      )}
                    {suppliers
                      .filter((s) => s && s.id != null)
                      .map((s) => (
                        <MenuItem key={s.id} value={String(s.id)}>
                          {s.name || `Supplier #${s.id}`}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>

                {/* Customer Dropdown */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Customer *"
                    value={formData.customerId != null ? String(formData.customerId) : ''}
                    onChange={(e) => {
                      const val = e?.target?.value ?? e;
                      handleCustomerChange(val);
                    }}
                    disabled={!formData.supplierId}
                  >
                    <MenuItem value="">
                      <em>-- Select Customer --</em>
                    </MenuItem>
                    {/* Ensure selected customer is present in options list */}
                    {formData.customerId &&
                      !customers.some(
                        (c) => String(c?.id) === String(formData.customerId)
                      ) && (
                        <MenuItem value={String(formData.customerId)}>
                          {formData.customerName || `Customer #${formData.customerId}`}
                        </MenuItem>
                      )}
                    {customers
                      .filter((c) => c && c.id != null)
                      .map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                          {c.name || `Customer #${c.id}`}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>

                {/* PO Number (Autocomplete) */}
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={poList || []}
                    loading={dropdownLoading}
                    value={
                      (poList || []).find(
                        (p) => String(p?.id) === String(formData.poId)
                      ) ||
                      (formData.poId || formData.poNo
                        ? { id: formData.poId, poNo: formData.poNo }
                        : null)
                    }
                    onChange={(e, val) => handlePOChange(val)}
                    getOptionLabel={(opt) => {
                      if (!opt) return '';
                      if (typeof opt === 'string') return opt;
                      return opt.poNo || String(opt.id || '');
                    }}
                    isOptionEqualToValue={(opt, val) => {
                      if (!opt || !val) return false;
                      return String(opt.id) === String(val.id);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="PO No. *"
                        placeholder="Search & Select PO..."
                      />
                    )}
                  />
                </Grid>

                {/* Style No */}
                <Grid item xs={12} sm={6}>
                  {styleList && styleList.length > 0 ? (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Style No. *"
                      value={formData.styleNo != null ? String(formData.styleNo) : ''}
                      onChange={(e) => {
                        const val = e?.target?.value ?? e;
                        handleStyleChange(val);
                      }}
                    >
                      <MenuItem value="">
                        <em>-- Select Style --</em>
                      </MenuItem>
                      {/* Ensure selected style is in menu options */}
                      {formData.styleNo &&
                        !styleList.some(
                          (st) => String(st?.styleNo) === String(formData.styleNo)
                        ) && (
                          <MenuItem value={String(formData.styleNo)}>
                            {formData.styleNo}
                          </MenuItem>
                        )}
                      {styleList
                        .filter((st) => st && st.styleNo != null)
                        .map((st, i) => (
                          <MenuItem key={i} value={String(st.styleNo)}>
                            {st.styleNo} {st.color ? `(${st.color})` : ''}
                          </MenuItem>
                        ))}
                    </TextField>
                  ) : (
                    <TextField
                      fullWidth
                      size="small"
                      label="Style No. *"
                      value={formData.styleNo != null ? String(formData.styleNo) : ''}
                      onChange={(e) => {
                        const val = e?.target?.value ?? e;
                        setFormData((prev) => ({ ...prev, styleNo: val }));
                      }}
                      placeholder="e.g. ST-4011"
                    />
                  )}
                </Grid>

                {/* Order Quantity */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Order Quantity *"
                    value={formData.orderQty}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, orderQty: e.target.value }))
                    }
                    placeholder="Total order quantity"
                  />
                </Grid>

                {/* Offer Quantity */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Offer Quantity *"
                    value={formData.offerQty}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, offerQty: e.target.value }))
                    }
                    placeholder="Offered quantity for inspection"
                  />
                </Grid>

                {/* Color / Article */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Color / Article *"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, color: e.target.value }))
                    }
                    placeholder="Color or Article Name"
                  />
                </Grid>

                {/* Actual Ship Date */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Actual Ship Date *"
                    value={formData.actualShipDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, actualShipDate: e.target.value }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Inspection Offer Date */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Inspection Offer Date *"
                    value={formData.offerDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, offerDate: e.target.value }))
                    }
                    helperText="Notice: Submit at least 3 days prior"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Inspection Type (Task Nature) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Inspection Type *"
                    value={formData.taskNature != null ? String(formData.taskNature) : 'Final'}
                    onChange={(e) => {
                      const val = e?.target?.value ?? e;
                      setFormData((prev) => ({ ...prev, taskNature: val }));
                    }}
                  >
                    {TASK_NATURE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Plan Date (Visible on Edit) */}
                {isEditing && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Plan Date"
                      value={formData.planDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, planDate: e.target.value }))
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                )}

                {/* Remarks / Special Notes */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    label="Remarks"
                    value={formData.remarks || formData.qamRemarks}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        remarks: e.target.value,
                        qamRemarks: e.target.value,
                      }))
                    }
                    placeholder="Enter any specific notes, instructions or fabric test references..."
                  />
                </Grid>
              </Grid>

              {/* Form Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setFormData(INITIAL_FORM_STATE);
                    setActiveTab('list');
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                  startIcon={
                    saving ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Iconify icon={isEditing ? 'solar:check-read-bold' : 'solar:plain-bold'} />
                    )
                  }
                  sx={{ px: 3, fontWeight: 600 }}
                >
                  {saving
                    ? isEditing
                      ? 'Updating...'
                      : 'Sending Request...'
                    : isEditing
                      ? 'Update'
                      : 'Send Request'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: APPROVE / REJECT PROPER PAGE (OLD AMS WORKFLOW & LAYOUT)       */}
      {/* ==================================================================== */}
      {activeTab === 'approval' && approvalItem && (
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            {/* Header banner / info */}
            <Box
              sx={{
                mb: 3,
                pb: 2,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Online ICR Form — Inspection Review
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Review requested inspection details and assign QC Plan Date & Remarks.
                </Typography>
              </div>

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  Current Status:
                </Typography>
                <Chip
                  size="medium"
                  label={approvalItem.isStatus || 'Pending'}
                  color={
                    approvalItem.isStatus === 'Approved'
                      ? 'success'
                      : approvalItem.isStatus === 'Rejected'
                        ? 'error'
                        : 'warning'
                  }
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Box>

            {/* Form Fields arranged in 2 columns (matching Old AMS ICRSupplierEntryBySupplier.aspx) */}
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <Stack spacing={2.5}>
                  {/* Supplier */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Supplier"
                    value={approvalItem.venderName || '-'}
                    InputProps={{ readOnly: true }}
                    helperText="Vendor / Factory Name"
                  />

                  {/* PO No. */}
                  <TextField
                    fullWidth
                    size="small"
                    label="PO No."
                    value={approvalItem.poNo || '-'}
                    InputProps={{ readOnly: true }}
                  />

                  {/* Order Quantity */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Order Quantity"
                    value={approvalItem.orderQty ? Number(approvalItem.orderQty).toLocaleString() : '-'}
                    InputProps={{ readOnly: true }}
                  />

                  {/* Color / Article */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Color / Article"
                    value={approvalItem.color || '-'}
                    InputProps={{ readOnly: true }}
                  />

                  {/* Offer Date */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Inspection Offer Date"
                    value={approvalItem.actualDate || '-'}
                    InputProps={{ readOnly: true }}
                  />

                  {/* QC Plan Date (Editable for QA/QC) */}
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Plan Date *"
                    value={approvalPlanDate}
                    onChange={(e) => setApprovalPlanDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Required when approving the inspection request"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  />
                </Stack>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <Stack spacing={2.5}>
                  {/* Customer */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Customer"
                    value={approvalItem.customerName || '-'}
                    InputProps={{ readOnly: true }}
                  />

                  {/* Style No */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Style No."
                    value={approvalItem.styleNo || '-'}
                    InputProps={{ readOnly: true }}
                  />

                  {/* Offer Quantity */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Offer Quantity"
                    value={approvalItem.offerQty ? Number(approvalItem.offerQty).toLocaleString() : '-'}
                    InputProps={{ readOnly: true }}
                  />

                  {/* Actual Ship Date */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Actual Ship Date"
                    value={approvalItem.shipmentDate || '-'}
                    InputProps={{ readOnly: true }}
                  />

                  {/* Inspection Type (Task Nature) */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Inspection Type (Task Nature)"
                    value={approvalItem.taskNature || 'Final'}
                    InputProps={{ readOnly: true }}
                  />

                  {/* QAM Remarks (Editable for QA/QC) */}
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    label="QAM Remarks *"
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    placeholder="Enter approval / rejection notes or inspection instructions..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>

            {/* Action Buttons: Matching Old AMS btnApprove, btnReject, Back/Cancel */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="flex-end"
              alignItems="center"
              sx={{ mt: 5, pt: 3, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}
            >
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setApprovalItem(null);
                  setActiveTab('list');
                }}
                disabled={approvalActionLoading}
                startIcon={<Iconify icon="eva:arrow-back-fill" />}
                sx={{ px: 3, py: 1, fontWeight: 600 }}
              >
                Back to List
              </Button>

              {/* Reject Button (ICRStatusID = 2): Visible if pending (0) or any un-finalized state */}
              {canApproveReject && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleExecuteApproval(2)}
                  disabled={approvalActionLoading}
                  startIcon={
                    approvalActionLoading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Iconify icon="solar:close-circle-bold" />
                    )
                  }
                  sx={{ px: 3.5, py: 1, fontWeight: 700 }}
                >
                  Reject
                </Button>
              )}

              {/* Approve Button (ICRStatusID = 1): Visible if pending (0) or rejected (2) in Old AMS */}
              {canApproveReject && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleExecuteApproval(1)}
                  disabled={approvalActionLoading}
                  startIcon={
                    approvalActionLoading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Iconify icon="solar:check-circle-bold" />
                    )
                  }
                  sx={{ px: 3.5, py: 1, fontWeight: 700 }}
                >
                  Approve
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* APPROVE / REJECT CONFIRMATION POPUP / DIALOG                          */}
      {/* ==================================================================== */}
      <Dialog
        open={approvalDialogState.open}
        onClose={handleCloseApprovalDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, p: 1 },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          {approvalDialogState.actionType === 'Approve' ? 'Approve Inspection Request' : 'Reject Inspection Request'}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <DialogContentText sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
            Are you sure you want to{' '}
            <strong style={{ color: approvalDialogState.actionType === 'Approve' ? '#2e7d32' : '#d32f2f' }}>
              {approvalDialogState.actionType === 'Approve' ? 'approve' : 'reject'}
            </strong>{' '}
            the inspection request for PO <strong>#{approvalDialogState.item?.poNo}</strong> (Style:{' '}
            {approvalDialogState.item?.styleNo})?
          </DialogContentText>

          {approvalDialogState.actionType === 'Approve' && (
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Plan Date *"
              value={approvalDialogState.planDate}
              onChange={(e) =>
                setApprovalDialogState((prev) => ({ ...prev, planDate: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              helperText="Specify planned inspection date"
              sx={{ mb: 2, mt: 1 }}
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="Remarks"
            value={approvalDialogState.remarks}
            onChange={(e) =>
              setApprovalDialogState((prev) => ({ ...prev, remarks: e.target.value }))
            }
            placeholder={
              approvalDialogState.actionType === 'Approve'
                ? 'Optional approval remarks / QC instructions...'
                : 'Reason for rejection (optional)...'
            }
            sx={{ mt: approvalDialogState.actionType === 'Approve' ? 0 : 1 }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCloseApprovalDialog}
            disabled={approvalActionLoading}
          >
            Cancel
          </Button>

          {approvalDialogState.actionType === 'Approve' ? (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleExecuteApproval(1)}
              disabled={approvalActionLoading}
              startIcon={
                approvalActionLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="solar:check-circle-bold" />
                )
              }
              sx={{ fontWeight: 700 }}
            >
              Confirm Approve
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              onClick={() => handleExecuteApproval(2)}
              disabled={approvalActionLoading}
              startIcon={
                approvalActionLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="solar:close-circle-bold" />
                )
              }
              sx={{ fontWeight: 700 }}
            >
              Confirm Reject
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
