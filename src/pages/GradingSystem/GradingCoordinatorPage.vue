<template>
  <component :is="activeComponent" />
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import GradebookPage from './GradebookPage.vue';
import StudentGradesPage from './StudentGradesPage.vue';

const authStore = useAuthStore();

const activeComponent = computed(() => {
  if (authStore.userRole === 'student') {
    return StudentGradesPage;
  }
  return GradebookPage; // For teachers/admins
});
</script>
