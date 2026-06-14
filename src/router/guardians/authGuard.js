import { useAuthStore } from '../../stores/auth';

export default async function authGuard(to, from, next) {
  const authStore = useAuthStore();
  const token = localStorage.getItem('auth_token');

  // If token exists in localStorage but store is empty, fetch current user info
  if (token && !authStore.token) {
    authStore.token = token;
    try {
      await authStore.fetchCurrentUser();
    } catch (err) {
      authStore.token = null;
      localStorage.removeItem('auth_token');
    }
  }

  const isAuth = !!authStore.token;

  if (to.meta.requiresAuth && !isAuth) {
    next('/login');
  } else if (to.path === '/login' && isAuth) {
    next('/dashboard');
  } else {
    next();
  }
}
