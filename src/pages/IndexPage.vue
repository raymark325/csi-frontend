<template>
  <div>
    <!-- Dynamic Component Loading -->
    <component :is="activeDashboard" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import StudentDashboard from './Dashboard/StudentDashboard.vue';
import TeacherDashboard from './Dashboard/TeacherDashboard.vue';

const router = useRouter();
const authStore = useAuthStore();

const activeDashboard = computed(() => {
  if (authStore.userRole === 'student') {
    return StudentDashboard;
  }
  return TeacherDashboard; // Default for teacher, admin, registrar
});

onMounted(async () => {
  // If no token, redirect to login
  if (!authStore.token) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Fetch user if token exists but user state is empty
    try {
      await authStore.fetchCurrentUser();
    } catch (err) {
      router.push('/login');
    }
  }
});
</script>
