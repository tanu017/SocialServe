import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api/v1'
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('SocialServe_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 503 && error.response?.data?.code === 'MAINTENANCE') {
      toast.error(error.response?.data?.message || 'Unavailable during maintenance.', {
        id: 'maintenance-503',
      });
      return Promise.reject(error);
    }
    if (error.response && error.response.status === 401) {
      const url = String(error.config?.url || '');
      const requestUrl = `${error.config?.baseURL || ''}${url}`;
      const isAuthCredentialError =
        url.includes('change-password') ||
        url.includes('/auth/login') ||
        requestUrl.includes('change-password') ||
        requestUrl.includes('/auth/login');
      // Wrong password on login/change-password returns 401 — do not clear session or redirect
      if (isAuthCredentialError) {
        return Promise.reject(error);
      }
      localStorage.removeItem('SocialServe_token');
      localStorage.removeItem('SocialServe_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
