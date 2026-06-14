import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/auth/authService';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for user profile

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Cache timestamp
  const _userFetchedAt = ref(0);

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role);

  const login = async (email, password) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await authService.login(email, password);
      token.value = response.data.token;
      user.value = response.data.user;
      authService.setToken(token.value);
      _userFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Login failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (userData) => {
    isLoading.value = true;
    error.value = null;
    try {
      await authService.register(userData);
    } catch (err) {
      error.value = err.message || 'Registration failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      token.value = null;
      user.value = null;
      _userFetchedAt.value = 0;
      authService.clearToken();
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authService.refresh();
      token.value = response.data.token;
      authService.setToken(token.value);
    } catch (err) {
      token.value = null;
      user.value = null;
      _userFetchedAt.value = 0;
      authService.clearToken();
    }
  };

  const fetchCurrentUser = async (force = false) => {
    // Skip if user data is already loaded and cache is valid
    if (!force && user.value && _userFetchedAt.value && (Date.now() - _userFetchedAt.value < CACHE_TTL)) {
      return;
    }
    try {
      const response = await authService.getCurrentUser();
      user.value = response.data;
      _userFetchedAt.value = Date.now();
    } catch (err) {
      token.value = null;
      user.value = null;
      _userFetchedAt.value = 0;
      authService.clearToken();
    }
  };

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    userRole,
    login,
    register,
    logout,
    refreshToken,
    fetchCurrentUser,
  };
});
