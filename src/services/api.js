import axios from 'axios';

const getBaseURL = () =>
  localStorage.getItem('csi_api_url') ||
  import.meta.env.QCLI_API_URL ||
  'https://csi.publicvm.com/api';

const API = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Allow runtime API URL override (useful when Cloudflare tunnel URL changes)
API.interceptors.request.use((config) => {
  config.baseURL = getBaseURL();
  return config;
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Hash router requires /#/login
      if (!window.location.hash.includes('/login')) {
        window.location.href = '/#/login';
      }
    }
    
    if (error.response?.status === 503 || error.response?.data?.maintenance) {
      if (!window.location.hash.includes('/maintenance')) {
        window.location.href = '/#/maintenance';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default API;
