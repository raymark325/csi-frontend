<template>
  <component :is="activeComponent" />
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import AttendancePage from './AttendancePage.vue';
import AttendanceHistoryPage from './AttendanceHistoryPage.vue';

const authStore = useAuthStore();

const activeComponent = computed(() => {
  if (authStore.userRole === 'student') {
    return AttendanceHistoryPage;
  }
  return AttendancePage; // For teachers/admins
});
</script>
