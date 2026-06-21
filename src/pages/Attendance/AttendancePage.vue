<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">DAILY LOG SHEET</p>
        <h1 class="text-display q-my-none">Mark Attendance</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Record daily physical/digital class attendance logs.</p>
      </div>
    </div>

    <!-- Section & Date Selection -->
    <div class="row q-col-gutter-md q-mb-xl items-center">
      <div class="col-12 col-sm-4">
        <p class="text-label q-mb-xs">Select Subject</p>
        <select v-model="selectedSectionId" class="input-glass" @change="loadSectionRoster">
          <option v-for="sec in sections" :key="sec.id" :value="sec.id">
            {{ sec.course?.title }} - {{ sec.section?.name || sec.name }}
          </option>
        </select>
      </div>
      <div class="col-12 col-sm-3">
        <p class="text-label q-mb-xs">Date</p>
        <input v-model="selectedDate" class="input-glass" type="date" @change="loadSectionRoster"/>
      </div>
      <div class="col-12 col-sm-3">
        <p class="text-label q-mb-xs">Time (Optional)</p>
        <input v-model="selectedTime" class="input-glass" type="time" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="attendanceStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Attendance marking grid -->
    <div v-else class="glass-card" style="overflow: hidden;">
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); background: rgba(0, 122, 255, 0.03);">
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Student Name</th>
              <th style="padding: 14px 20px; text-align: center;" class="text-label">Status Marking</th>
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in attendanceStore.sectionAttendance"
              :key="row.student_id"
              style="border-bottom: 1px solid var(--border-color);"
            >
              <td style="padding: 14px 20px;" class="text-body text-weight-bold">
                {{ row.name }}
              </td>
              <td style="padding: 14px 20px; text-align: center;">
                <div class="row justify-center q-gutter-xs">
                  <q-btn
                    :flat="row.status !== 'present'"
                    color="positive"
                    label="Present"
                    size="sm"
                    rounded
                    unelevated
                    @click="updateStatus(row, 'present')"
                  />
                  <q-btn
                    :flat="row.status !== 'absent'"
                    color="negative"
                    label="Absent"
                    size="sm"
                    rounded
                    unelevated
                    @click="updateStatus(row, 'absent')"
                  />
                  <q-btn
                    :flat="row.status !== 'late'"
                    color="warning"
                    label="Late"
                    size="sm"
                    rounded
                    unelevated
                    @click="updateStatus(row, 'late')"
                  />
                  <q-btn
                    :flat="row.status !== 'excused'"
                    color="primary"
                    label="Excused"
                    size="sm"
                    rounded
                    unelevated
                    @click="updateStatus(row, 'excused')"
                  />
                </div>
              </td>
              <td style="padding: 14px 20px;">
                <input
                  v-model="row.remarks"
                  class="input-glass"
                  style="padding: 6px 12px; font-size: 13px;"
                  type="text"
                  placeholder="Remarks e.g. Left early"
                  @blur="updateRemarks(row)"
                />
              </td>
            </tr>

            <tr v-if="!attendanceStore.sectionAttendance.length">
              <td colspan="3" class="text-center text-muted q-py-xl">No students enrolled in this section.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAttendanceStore } from '../../stores/Attendance/attendanceStore';
import { useDashboardStore } from '../../stores/dashboardStore';

const route = useRoute();
const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const dashboardStore = useDashboardStore();

const selectedSectionId = ref(null);
const selectedDate = ref(new Date().toISOString().substring(0, 10));
const selectedTime = ref('');
const sections = ref([]);

const loadSectionRoster = () => {
  if (!selectedSectionId.value) return;
  attendanceStore.fetchSectionAttendance(selectedSectionId.value, selectedDate.value);
};

const updateStatus = async (row, status) => {
  try {
    await attendanceStore.markAttendance({
      student_id: row.student_id,
      section_subject_id: selectedSectionId.value,
      date: selectedDate.value,
      time: selectedTime.value || null,
      status: status,
      remarks: row.remarks,
    });
    $q.notify({
      type: 'success',
      icon: 'check_circle',
      message: `${row.name} marked ${status}.`,
      position: 'top',
      timeout: 1000,
    });
  } catch (err) {
    console.error(err);
  }
};

const updateRemarks = async (row) => {
  try {
    await attendanceStore.markAttendance({
      student_id: row.student_id,
      section_subject_id: selectedSectionId.value,
      date: selectedDate.value,
      time: selectedTime.value || null,
      status: row.status,
      remarks: row.remarks,
    });
  } catch (err) {
    console.error(err);
  }
};

onMounted(async () => {
  try {
    await dashboardStore.fetchSections();
    sections.value = dashboardStore.sections;
    if (sections.value.length > 0) {
      if (route.query.section_id) {
        selectedSectionId.value = parseInt(route.query.section_id);
      } else {
        selectedSectionId.value = sections.value[0].id;
      }
      loadSectionRoster();
    }
  } catch (err) {
    console.error(err);
  }
});
</script>
