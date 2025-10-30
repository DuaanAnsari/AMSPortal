import axios from 'axios';
import { HOST_API } from 'src/config-global';
console.log('✅ Axios interceptors loaded');

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: HOST_API,
});

// 🔹 Automatically attach token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Global error interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ CASE 1: Server responded but unauthorized
    if (error.response) {
      const { status } = error.response;

      if (status === 401 || status === 403) {
        console.warn('⛔ Unauthorized or token expired. Logging out...');
        handleForceLogout();
      }

      return Promise.reject(error.response.data || 'Something went wrong');
    }

    // ✅ CASE 2: No response from server (API down)
    if (
      error.request ||
      error.message === 'Network Error' ||
      (error.message && error.message.includes('Failed to fetch'))
    ) {
      console.error('❌ API unreachable or network error. Logging out...');
      handleForceLogout(true); // pass true to force reload
      return Promise.reject('Network Error or Server Unreachable');
    }

    // Fallback
    return Promise.reject(error);
  }
);

// 🔹 Force logout function
function handleForceLogout(force = false) {
  try {
    localStorage.clear();
    sessionStorage.clear();

    console.warn('🚪 Logging out and redirecting to login page...');

    // ❗ Use replace to force redirect even if React is in error state
    setTimeout(() => {
      if (force) {
        window.location.replace('/auth/jwt/login');
      } else {
        window.location.href = '/auth/jwt/login';
      }
    }, 500);
  } catch (e) {
    console.error('Error while logging out:', e);
  }
}

export default axiosInstance;

// ----------------------------------------------------------------------

// 🔹 Common fetcher (for SWR or direct fetching)
export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];
    const res = await axiosInstance.get(url, { ...config });
    return res.data;
  } catch (error) {
    // Agar network error hua to ye bhi logout trigger karega
    if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
      handleForceLogout(true);
    }
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/auth/me',
    login: '/api/auth/login',
    register: '/api/auth/register',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};
