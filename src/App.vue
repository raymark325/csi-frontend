<template>
  <div id="app-container" :class="{ 'obscured': isObscured }">
    <router-view />
    <div v-if="isObscured" class="security-overlay">
      <q-icon name="security" size="64px" color="white" />
      <h2 style="color: white; margin-top: 20px;">Screen Obscured</h2>
      <p style="color: #aaa;">Please focus on the application window to continue.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from './stores/auth';

const $q = useQuasar();
const isObscured = ref(false);

const handleKeydown = (e) => {
  const authStore = useAuthStore();
  if (authStore.user?.role !== 'student') return;

  // Block PrintScreen
  if (e.key === 'PrintScreen') {
    navigator.clipboard.writeText('Screenshots disabled.'); 
    e.preventDefault();
    $q.notify({ type: 'negative', message: 'Screenshots are disabled.' });
  }

  // Block Ctrl+P (Print), Ctrl+S (Save), Ctrl+C (Copy)
  if (e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S' || e.key === 'c' || e.key === 'C')) {
    e.preventDefault();
    $q.notify({ type: 'negative', message: 'This action is disabled.' });
  }
};

const handleCopy = (e) => {
  const authStore = useAuthStore();
  if (authStore.user?.role !== 'student') return;

  e.preventDefault();
  $q.notify({ type: 'negative', message: 'Copying is disabled.' });
};

const handleContextMenu = (e) => {
  const authStore = useAuthStore();
  if (authStore.user?.role !== 'student') return;

  e.preventDefault();
};

const handleVisibilityChange = () => {
  const authStore = useAuthStore();
  if (authStore.user?.role !== 'student') {
    isObscured.value = false;
    return;
  }

  if (document.hidden) {
    isObscured.value = true;
  } else {
    isObscured.value = false;
  }
};

const handleBlur = () => {
  const authStore = useAuthStore();
  if (authStore.user?.role !== 'student') return;

  isObscured.value = true;
};

const handleFocus = () => {
  isObscured.value = false;
};

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

  // Security listeners
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('copy', handleCopy);
  window.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);

  // Disable browser-based screen sharing
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    navigator.mediaDevices.getDisplayMedia = () => {
      $q.notify({ type: 'negative', message: 'Screen sharing is strictly prohibited.' });
      return Promise.reject(new Error('Screen sharing is disabled by security policy.'));
    };
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('copy', handleCopy);
  window.removeEventListener('contextmenu', handleContextMenu);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('blur', handleBlur);
  window.removeEventListener('focus', handleFocus);
});

// Watch for dark mode changes and save to localStorage
watch(() => $q.dark.isActive, (val) => {
  localStorage.setItem('sms_theme', val ? 'dark' : 'light');
});
</script>

<style>
@media print {
  body {
    display: none !important;
  }
}

.security-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #111;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

#app-container.obscured > *:not(.security-overlay) {
  display: none !important;
}
</style>
