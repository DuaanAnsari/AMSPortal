const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const normalizeBase = (value) => String(value || '').replace(/\/+$/, '');

const normalizedApiBase = normalizeBase(API_BASE_URL);

const shouldAttachToken = (url) => {
  try {
    const resolved = new URL(url, window.location.origin);
    const absolute = resolved.href;

    // Attach for configured API host requests
    if (normalizedApiBase && absolute.startsWith(normalizedApiBase)) {
      return true;
    }

    // Attach for same-origin /api calls
    if (resolved.origin === window.location.origin && resolved.pathname.startsWith('/api/')) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

const installAuthFetch = () => {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  if (window.__authFetchInstalled) return;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const request = new Request(input, init);

    if (!shouldAttachToken(request.url)) {
      return nativeFetch(request);
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return nativeFetch(request);
    }

    const headers = new Headers(request.headers);
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const requestWithAuth = new Request(request, { headers });
    return nativeFetch(requestWithAuth);
  };

  window.__authFetchInstalled = true;
};

installAuthFetch();

export default installAuthFetch;
