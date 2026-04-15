import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1'
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('givehub_token');
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
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('givehub_token');
      localStorage.removeItem('givehub_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
