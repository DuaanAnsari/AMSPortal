import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
