<template>
  <div v-if="error" class="error-alert-wrapper q-my-md">
    <q-banner inline-actions class="text-white bg-red-10 rounded-borders glass-banner">
      <template v-slot:avatar>
        <q-icon name="error" color="white" size="md" />
      </template>
      <div class="text-subtitle1 text-weight-bold">An Error Occurred</div>
      <div class="text-body2 text-grey-2">{{ error }}</div>
      <template v-slot:action>
        <q-btn flat color="white" label="Dismiss" @click="$emit('clear')" />
        <q-btn v-if="retryable" flat color="white" label="Retry" @click="$emit('retry')" />
      </template>
    </q-banner>
  </div>
</template>

<script setup>
defineProps({
  error: {
    type: String,
    default: ''
  },
  retryable: {
    type: Boolean,
    default: false
  }
});

defineEmits(['clear', 'retry']);
</script>

<style scoped>
.glass-banner {
  background: rgba(255, 59, 48, 0.2) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 59, 48, 0.4);
}
</style>
