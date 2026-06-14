<template>
  <div class="report-exporter q-pa-md glass-card text-white text-center">
    <q-icon name="picture_as_pdf" size="60px" color="primary" class="q-mb-md" />
    <div class="text-h6 text-azure">Official Report Exporter</div>
    <div class="text-body2 text-grey-4 q-mt-sm q-mb-lg">
      Generate and download official PDF report cards, section gradesheets, or attendance reports.
    </div>

    <div class="row justify-center q-gutter-sm">
      <q-btn
        color="primary"
        icon="cloud_download"
        label="Download PDF"
        :loading="loading"
        @click="exportPdf"
        class="glow-btn"
      />
      <slot name="extra-actions"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['export']);

const exportPdf = () => {
  emit('export');
};
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  max-width: 400px;
}

.text-azure {
  color: #007AFF;
}

.glow-btn {
  background: #007AFF !important;
  color: white;
  box-shadow: 0 4px 14px rgba(0, 122, 255, 0.4);
  font-weight: bold;
}
</style>
