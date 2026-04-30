import axios from 'axios';

/** Prefer CRA-style name, then Vite default (see `vite.config.js` envPrefix). */
const API_BASE_URL =
  import.meta.env.REACT_APP_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '';

/** Axios client for MasterOrderForQDSheet + linked QD pages (Bearer token). */
export const qdApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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

