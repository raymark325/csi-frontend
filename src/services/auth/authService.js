import API from '../api';

export const authService = {
  login(email, password) {
    return API.post('/auth/login', { email, password });
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
