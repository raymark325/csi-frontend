import { useAuthStore } from '../../stores/auth';

export default function roleGuard(to, from, next) {
  const authStore = useAuthStore();
  const requiredRoles = to.meta.roles;

  if (requiredRoles && !requiredRoles.includes(authStore.userRole)) {
    next('/'); // Redirect to dashboard if unauthorized
  } else {
    next();
  }
}
