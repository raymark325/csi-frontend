<template>
  <div class="score-display q-pa-md glass-card text-white text-center">
    <div class="text-subtitle1 text-grey-4 q-mb-xs">{{ title }}</div>
    <div class="grade-circle flex flex-center q-mx-auto">
      <div>
        <div class="text-h3 text-azure text-weight-bolder">{{ score }}%</div>
        <div class="text-subtitle2 text-grey-4 q-mt-xs">Weighted Avg</div>
      </div>
    </div>
    <div class="row q-mt-md justify-around">
      <div>
        <div class="text-weight-bold text-azure text-h6">{{ gpa }}</div>
        <div class="text-caption text-grey-4">Equivalent GPA</div>
      </div>
      <div>
        <div class="text-weight-bold text-h6" :color="statusColor">{{ remarks }}</div>
        <div class="text-caption text-grey-4">Remarks</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Student Grade'
  },
  score: {
    type: Number,
    required: true
  }
});

const gpa = computed(() => {
  if (props.score >= 90) return '4.00';
  if (props.score >= 85) return '3.50';
  if (props.score >= 80) return '3.00';
  if (props.score >= 75) return '2.50';
  if (props.score >= 70) return '2.00';
  return '5.00';
});

const remarks = computed(() => {
  if (props.score >= 75) return 'PASSED';
  return 'FAILED';
});

const statusColor = computed(() => {
  return props.score >= 75 ? 'green' : 'red';
});
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  max-width: 320px;
}

.grade-circle {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 4px solid rgba(0, 122, 255, 0.25);
  background: rgba(255, 255, 255, 0.02);
  box-shadow: inset 0 0 20px rgba(0, 122, 255, 0.1);
  margin-top: 15px;
}

.text-azure {
  color: #007AFF;
}
</style>
