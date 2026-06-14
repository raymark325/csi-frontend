import axios from 'axios';

const API = axios.create({
  baseURL: (typeof process !== 'undefined' && process.env?.VUE_APP_API_URL) || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
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
    return Promise.reject(error.response?.data || error);
  }
);

export default API;
