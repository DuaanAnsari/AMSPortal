/**
 * Works with raw Axios errors or payloads rejected by `src/utils/axios` interceptors.
 */
export function getLoginErrorMessage(payload) {
  const data = payload?.response?.data ?? payload;

  if (data == null) {
    if (payload?.message === 'Network Error') {
      return 'Server se connect nahi ho pa raha. API URL / network check karein.';
    }
    return payload?.message || 'Something went wrong. Please try again.';
  }

  if (typeof data === 'string') {
    if (data === 'Network Error or Server Unreachable') {
      return 'Server se connect nahi ho pa raha. API URL / network check karein.';
    }
    return data;
  }

  if (typeof data === 'object') {
    const fromErrors = () => {
      const { errors } = data;
      if (!errors || typeof errors !== 'object') return '';
      const first = Object.values(errors).flat().find((v) => v != null && String(v).trim());
      return first ? String(first) : '';
    };
    const msg =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.Message === 'string' && data.Message) ||
      (typeof data.detail === 'string' && data.detail) ||
      (typeof data.title === 'string' && data.title) ||
      fromErrors();
    if (msg.trim()) return msg.trim();
  }

  return 'Invalid username or password';
}
