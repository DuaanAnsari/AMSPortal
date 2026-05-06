import axios from 'axios';

function trimSlash(s) {
  if (s == null || s === '') return '';
  return String(s).replace(/\/+$/, '');
}

/**
 * Full API root including `/api` when set, e.g. `REACT_APP_API_URL=http://host/api`
 * Otherwise `REACT_APP_API_BASE_URL` / `VITE_API_BASE_URL` + `/api`.
 */
const explicitRoot = trimSlash(import.meta.env.REACT_APP_API_URL || import.meta.env.VITE_API_URL || '');
const hostOnly = trimSlash(
  import.meta.env.REACT_APP_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || ''
);
let API_ROOT = explicitRoot || (hostOnly ? `${hostOnly}/api` : '');
/** Avoid `.../api/api` if env strings are doubled. */
while (/\/api\/api$/i.test(API_ROOT)) {
  API_ROOT = API_ROOT.replace(/\/api\/api$/i, '/api');
}
API_ROOT = trimSlash(API_ROOT);

/** Axios client for MasterOrderForQDSheet + linked QD pages (Bearer token). */
export const qdApi = axios.create({
  baseURL: API_ROOT,
});

qdApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

qdApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

qdApi.getSignature = async (poid, mstId, signType) => {
  const res = await qdApi.get(`/MasterOrderForQDSheet/quality-department-inspection/${poid}/signature`, {
    params: { qdInspectionMstId: mstId, signType },
  });
  return res.data;
};

qdApi.saveSignature = async (poid, payload) => {
  const res = await qdApi.post(`/MasterOrderForQDSheet/quality-department-inspection/${poid}/signature`, payload);
  return res.data;
};

/** Courier / merchandising master + details (same shape as GetMerchandisingEditData). */
qdApi.saveMerchandising = async (payload) => {
  const res = await qdApi.post('/Merchandising/SaveMerchandising', payload);
  return res.data;
};

/** Invoice PDF payload: `master` + `details` (envelope may nest under `data` / `pdfData`). */
qdApi.getMerchandisingPdfData = async (merchandisingId) => {
  const res = await qdApi.get('/Merchandising/GetMerchandisingPdfData', {
    params: { merchandisingId: String(merchandisingId ?? '').trim() },
  });
  return res.data;
};

/**
 * Consignee grid list. Full URL: `{API_ROOT}/Consignee/view` → typically `…/api/Consignee/view`
 * when `VITE_API_BASE_URL` is host-only (API_ROOT adds `/api`).
 */
qdApi.getConsigneeView = async ({ packageName = '', consigneeName = '' } = {}) => {
  const res = await qdApi.get('/Consignee/view', {
    params: {
      packageName: String(packageName ?? '').trim(),
      consigneeName: String(consigneeName ?? '').trim(),
    },
    timeout: 45_000,
  });
  return res.data;
};

/** Adjust path if backend differs (e.g. POST delete). */
qdApi.deleteConsignee = async (id) => {
  const key = String(id ?? '').trim();
  const res = await qdApi.delete(`/Consignee/${encodeURIComponent(key)}`);
  return res.data;
};

/** Edit screen payload: `GET /Consignee/edit/{consigneeId}` → `{API_ROOT}/Consignee/edit/…` */
qdApi.getConsigneeForEdit = async (consigneeId) => {
  const id = String(consigneeId ?? '').trim();
  const res = await qdApi.get(`/Consignee/edit/${encodeURIComponent(id)}`, {
    timeout: 45_000,
  });
  return res.data;
};

/** Create or update: include `consigneeID` in body when updating. `POST /Consignee/save` */
qdApi.saveConsignee = async (payload) => {
  const res = await qdApi.post('/Consignee/save', payload, {
    timeout: 45_000,
  });
  return res.data;
};

