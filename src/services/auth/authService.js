import axios from 'axios';
import API from '../api';

export const authService = {
  login(email, password) {
    return API.post('/auth/login', { email, password });
  },

  sendOtp(email) {
    return API.post('/auth/send-otp', { email });
  },

  sendForgotPasswordOtp(email) {
    return API.post('/auth/forgot-password-otp', { email });
  },

  resetPassword(email, otp, password) {
    return API.post('/auth/reset-password', { email, otp, password });
  },

  register(userData) {
    if (userData.profile_picture) {
      const formData = new FormData();
      Object.keys(userData).forEach(key => {
        if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });
      return API.post('/auth/register', formData);
    }
    return API.post('/auth/register', userData);
  },

  logout() {
    return API.post('/auth/logout');
  },

  refresh() {
    return API.post('/auth/refresh');
  },

  getCurrentUser() {
    return API.get('/auth/me');
  },

  setToken(token) {
    localStorage.setItem('auth_token', token);
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  clearToken() {
    localStorage.removeItem('auth_token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};
