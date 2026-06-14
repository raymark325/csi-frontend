<template>
  <div v-if="loading" class="loading-spinner-overlay flex flex-center">
    <div class="spinner-container text-center q-pa-lg">
      <q-spinner-orbit color="primary" size="60px" />
      <div class="text-subtitle1 text-white q-mt-md text-weight-bold">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: 'Loading, please wait...'
  }
});
</script>

<style scoped>
.loading-spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
}

.spinner-container {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}
</style>
