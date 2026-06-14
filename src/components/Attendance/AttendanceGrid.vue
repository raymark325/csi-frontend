<template>
  <div class="attendance-grid q-pa-md glass-card text-white">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h6 text-azure">Mark Attendance</div>
      <slot name="header-right"></slot>
    </div>

    <q-list dark separator>
      <q-item v-for="student in roster" :key="student.enrollment_id" class="q-py-md">
        <q-item-section>
          <q-item-name class="text-weight-bold">{{ student.name }}</q-item-name>
          <q-item-label caption class="text-grey-4">Student ID: {{ student.student_id }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="row items-center q-gutter-x-sm">
            <q-btn-toggle
              :model-value="student.status"
              @update:model-value="(val) => handleStatusChange(student.enrollment_id, val)"
              toggle-color="primary"
              color="grey-9"
              text-color="white"
              toggle-text-color="white"
              flat
              dense
              :options="[
                { label: 'Present', value: 'present' },
                { label: 'Absent', value: 'absent' },
                { label: 'Late', value: 'late' },
                { label: 'Excused', value: 'excused' }
              ]"
            />
            <q-input
              v-model="student.remarks"
              placeholder="Remarks"
              dense
              dark
              outlined
              class="remarks-input"
              input-style="color: white; width: 120px;"
              @blur="handleRemarksChange(student.enrollment_id, student.remarks)"
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
defineProps({
  roster: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['status-change', 'remarks-change']);

const handleStatusChange = (enrollmentId, status) => {
  emit('status-change', { enrollment_id: enrollmentId, status });
};

const handleRemarksChange = (enrollmentId, remarks) => {
  emit('remarks-change', { enrollment_id: enrollmentId, remarks });
};
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
}

.remarks-input {
  max-width: 140px;
}

.text-azure {
  color: #007AFF;
}
</style>
