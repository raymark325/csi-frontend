<template>
  <!-- Role-based redirect: renders nothing, just redirects -->
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  const role = authStore.userRole;
  if (role === 'student') {
    router.replace('/dashboard/student');
  } else if (role === 'teacher' || role === 'admin') {
    router.replace('/dashboard/teacher');
  } else {
    router.replace('/login');
  }
});
</script>
