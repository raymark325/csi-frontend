<template>
  <router-view />
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

onMounted(() => {
  // Initialize dark mode from localStorage
  const savedTheme = localStorage.getItem('sms_theme');
  if (savedTheme !== null) {
    $q.dark.set(savedTheme === 'dark');
  }

  // Hide splash screen after the app mounts
  const splash = document.getElementById('splash-screen');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.remove();
      }, 800);
    }, 3500);
  }
});

// Watch for dark mode changes and save to localStorage
watch(() => $q.dark.isActive, (val) => {
  localStorage.setItem('sms_theme', val ? 'dark' : 'light');
});
</script>
