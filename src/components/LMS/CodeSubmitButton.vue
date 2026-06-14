<template>
  <div class="code-submit-wrapper">
    <q-btn
      :color="color"
      :label="label"
      :loading="loading"
      :disable="disable"
      class="submit-btn glow-btn"
      @click="confirmSubmission"
    />

    <q-dialog v-model="confirmDialog" persistent>
      <q-card class="glass-dialog text-white">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm text-h6">Submit Assignment?</span>
        </q-card-section>

        <q-card-section class="q-pt-none text-grey-3">
          By submitting, your code will be locked and sent to the grading system. 
          The built-in anti-cheat scanner will analyze your submission for plagiarism, duplicate copy-paste blocks, and syntax correctness.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-4" v-close-popup />
          <q-btn flat label="Proceed & Submit" color="primary" @click="handleProceed" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  label: {
    type: String,
    default: 'Submit Code'
  },
  color: {
    type: String,
    default: 'primary'
  },
  loading: {
    type: Boolean,
    default: false
  },
  disable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit']);

const confirmDialog = ref(false);

const confirmSubmission = () => {
  confirmDialog.value = true;
};

const handleProceed = () => {
  emit('submit');
};
</script>

<style scoped>
.submit-btn {
  font-weight: bold;
  box-shadow: 0 4px 14px rgba(0, 122, 255, 0.4);
}

.glow-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(0, 122, 255, 0.6);
}

.glass-dialog {
  background: rgba(30, 30, 30, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-width: 450px;
}
</style>
