<template>
  <div class="attendance-stats q-pa-md glass-card text-white text-center">
    <div class="text-subtitle1 text-grey-4 q-mb-xs">Attendance Percentage</div>
    <q-circular-progress
      show-value
      class="text-azure q-my-md"
      :value="stats.percentage || 0"
      size="120px"
      :thickness="0.15"
      color="primary"
      track-color="grey-9"
    >
      <div class="text-h6 text-weight-bolder">{{ stats.percentage || 0 }}%</div>
    </q-circular-progress>

    <div class="row justify-around q-mt-sm">
      <div>
        <div class="text-weight-bold text-azure">{{ stats.present || 0 }}</div>
        <div class="text-caption text-grey-4">Present</div>
      </div>
      <div>
        <div class="text-weight-bold text-orange">{{ stats.late || 0 }}</div>
        <div class="text-caption text-grey-4">Late</div>
      </div>
      <div>
        <div class="text-weight-bold text-red">{{ stats.absent || 0 }}</div>
        <div class="text-caption text-grey-4">Absent</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      percentage: 0,
      present: 0,
      late: 0,
      absent: 0
    })
  }
});
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  max-width: 280px;
}

.text-azure {
  color: #007AFF;
}
</style>
