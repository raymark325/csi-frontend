<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">ATTENDANCE LEDGER</p>
        <h1 class="text-display q-my-none">Attendance History</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Track your daily presence rates and attendance summaries.</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="attendanceStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <div v-else class="column q-gutter-xl">
      <!-- Section Loop -->
      <div v-for="section in attendanceStore.history" :key="section.enrollment_id" class="glass-card q-pa-xl">
        <div class="row justify-between items-center q-mb-xl">
          <div>
            <span class="badge badge-blue q-mb-xs">{{ section.section_name }}</span>
            <h2 class="q-my-none" style="font-size: 20px; font-weight: 800; color: var(--text-primary);">
              {{ section.course_title }}
            </h2>
          </div>
          <div class="text-right">
            <span
              class="badge text-weight-bold"
              :class="section.stats.percentage >= 90 ? 'badge-green' : section.stats.percentage >= 75 ? 'badge-orange' : 'badge-red'"
              style="font-size: 16px; padding: 6px 14px;"
            >
              Presence: {{ section.stats.percentage }}%
            </span>
          </div>
        </div>

        <!-- Quick Stats Cards row inside -->
        <div class="row q-col-gutter-md q-mb-xl">
          <div class="col-6 col-sm-3">
            <div class="glass-card stat-card q-pa-md text-center column items-center">
              <span class="text-label">Present</span>
              <span class="text-title text-success q-mt-xs" style="font-size:20px; color: var(--color-success);">{{ section.stats.present }}</span>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="glass-card stat-card q-pa-md text-center column items-center">
              <span class="text-label">Absent</span>
              <span class="text-title text-danger q-mt-xs" style="font-size:20px; color: var(--sms-red);">{{ section.stats.absent }}</span>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="glass-card stat-card q-pa-md text-center column items-center">
              <span class="text-label">Late</span>
              <span class="text-title text-warning q-mt-xs" style="font-size:20px; color: var(--color-warning);">{{ section.stats.late }}</span>
            </div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="glass-card stat-card q-pa-md text-center column items-center">
              <span class="text-label">Excused</span>
              <span class="text-title text-info q-mt-xs" style="font-size:20px; color: var(--sms-blue-light);">{{ section.stats.excused }}</span>
            </div>
          </div>
        </div>

        <p class="text-label q-mb-md">Daily Log Details</p>
        <!-- Daily Logs Table -->
        <div class="glass-card" style="overflow: hidden; border-radius: var(--radius-md);">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); background: rgba(0, 122, 255, 0.02);">
                <th style="padding: 10px 16px; text-align: left;" class="text-label">Date</th>
                <th style="padding: 10px 16px; text-align: left;" class="text-label">Status</th>
                <th style="padding: 10px 16px; text-align: left;" class="text-label">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="record in section.records"
                :key="record.id"
                style="border-bottom: 1px solid var(--border-color);"
              >
                <td style="padding: 10px 16px;" class="text-body">{{ formatDate(record.date) }}</td>
                <td style="padding: 10px 16px;">
                  <span
                    :class="[
                      'badge',
                      record.status === 'present' ? 'badge-green' :
                      record.status === 'absent' ? 'badge-red' :
                      record.status === 'late' ? 'badge-orange' : 'badge-blue'
                    ]"
                    style="text-transform: capitalize;"
                  >
                    {{ record.status }}
                  </span>
                </td>
                <td style="padding: 10px 16px;" class="text-body text-secondary">{{ record.remarks || '—' }}</td>
              </tr>

              <tr v-if="!section.records.length">
                <td colspan="3" class="text-center text-muted q-py-lg">No attendance recorded yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!attendanceStore.history.length" class="text-center text-muted q-py-xl glass-card">
        You are not enrolled in any sections with active attendance logs.
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAttendanceStore } from '../../stores/Attendance/attendanceStore';

const attendanceStore = useAttendanceStore();

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

onMounted(() => {
  attendanceStore.fetchHistory();
});
</script>
