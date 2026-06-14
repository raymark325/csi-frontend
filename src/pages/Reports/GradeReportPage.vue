<template>
  <div class="q-pa-lg report-page">
    <!-- Action buttons (hidden in print mode) -->
    <div class="row justify-between items-center q-mb-xl no-print">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">OFFICIAL SUMMARIES</p>
        <h1 class="text-display q-my-none">Report Card</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Print or export student grades and performance reports.</p>
      </div>
      <q-btn
        color="primary"
        icon="print"
        label="Print Report"
        rounded
        unelevated
        @click="printReport"
      />
    </div>

    <!-- Filters for Teacher/Admin (hidden in print mode) -->
    <div v-if="isTeacherOrAdmin" class="row q-col-gutter-md q-mb-xl items-center no-print">
      <div class="col-12 col-sm-4">
        <p class="text-label q-mb-xs">Select Section</p>
        <select v-model="selectedSectionId" class="input-glass" @change="onSectionChange">
          <option v-for="sec in sections" :key="sec.id" :value="sec.id">
            {{ sec.name }} - {{ sec.course?.title }}
          </option>
        </select>
      </div>
      <div class="col-12 col-sm-4">
        <p class="text-label q-mb-xs">Select Student</p>
        <select v-model="selectedStudentId" class="input-glass" @change="onStudentChange">
          <option v-for="stu in students" :key="stu.student_id" :value="stu.student_id">
            {{ stu.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="gradeStore.isLoading" class="row justify-center q-py-xl no-print">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <div v-else-if="!gradeStore.reportCard" class="text-center text-muted q-py-xl glass-card no-print">
      No report card data available. Please verify the section has enrolled students with scores.
    </div>

    <!-- Printable Report Card Document -->
    <div v-else class="report-document glass-card q-pa-xl">
      <!-- School Header -->
      <div class="row items-center justify-between q-mb-xl text-center text-sm-left">
        <div class="row items-center q-gutter-md">
          <div style="width:48px; height:48px; border-radius:12px; background: linear-gradient(135deg, var(--sms-blue), var(--sms-blue-light)); display:flex; align-items:center; justify-content:center;">
            <q-icon name="school" size="24px" style="color:#fff"/>
          </div>
          <div>
            <h2 class="q-my-none" style="font-size: 22px; font-weight: 800; color: var(--text-primary);">
              CSI ACADEMY
            </h2>
            <p class="text-caption q-my-none" style="text-transform: uppercase; letter-spacing: 1px;">
              Official Report of Learning Progress
            </p>
          </div>
        </div>
        <div class="q-mt-md q-mt-sm-none">
          <p class="text-caption q-my-none text-muted">Date Generated</p>
          <p class="text-body text-weight-bold q-my-none">{{ generatedDate }}</p>
        </div>
      </div>

      <!-- Student Details Section -->
      <div class="row q-col-gutter-md q-mb-xl info-grid">
        <div class="col-12 col-sm-6">
          <p class="text-label q-mb-xs">Student Name</p>
          <p class="text-body text-weight-bold q-my-none" style="font-size: 16px;">
            {{ gradeStore.reportCard.student?.name }}
          </p>
        </div>
        <div class="col-12 col-sm-6">
          <p class="text-label q-mb-xs">Student Email</p>
          <p class="text-body text-weight-bold q-my-none" style="font-size: 16px;">
            {{ gradeStore.reportCard.student?.email }}
          </p>
        </div>
      </div>

      <!-- Report Card Grades Table -->
      <div class="q-mb-xl" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: rgba(0,122,255,0.04); border-bottom: 1px solid var(--border-color);">
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Course Code</th>
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Subject Title</th>
              <th style="padding: 14px 20px; text-align: right;" class="text-label">Attendance</th>
              <th style="padding: 14px 20px; text-align: right;" class="text-label">Final Grade</th>
              <th style="padding: 14px 20px; text-align: center;" class="text-label">Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in gradeStore.reportCard.report"
              :key="idx"
              style="border-bottom: 1px solid var(--border-color);"
            >
              <td style="padding: 14px 20px;" class="text-body text-weight-bold">{{ row.course_code }}</td>
              <td style="padding: 14px 20px;" class="text-body">{{ row.course_title }}</td>
              <td style="padding: 14px 20px; text-align: right;" class="text-body">{{ row.attendance_percentage }}%</td>
              <td style="padding: 14px 20px; text-align: right;" class="text-body text-weight-bold" :style="{ color: row.final_grade >= 75 ? 'var(--color-success)' : 'var(--sms-red)' }">
                {{ row.final_grade }}%
              </td>
              <td style="padding: 14px 20px; text-align: center;">
                <span :class="['badge', row.remarks === 'Passed' ? 'badge-green' : 'badge-red']">
                  {{ row.remarks }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Signatures (Print only) -->
      <div class="row justify-between print-only" style="margin-top: 100px;">
        <div class="column items-center">
          <div style="border-top: 1px solid var(--text-primary); width: 200px; text-align: center; padding-top: 8px;">
            <p class="text-body text-weight-bold q-my-none">Jane Smith</p>
            <p class="text-caption q-my-none">Class Adviser</p>
          </div>
        </div>
        <div class="column items-center">
          <div style="border-top: 1px solid var(--text-primary); width: 200px; text-align: center; padding-top: 8px;">
            <p class="text-body text-weight-bold q-my-none">Registrar Officer</p>
            <p class="text-caption q-my-none">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useGradeStore } from '../../stores/GradingSystem/gradeStore';
import { useAuthStore } from '../../stores/auth';
import { useDashboardStore } from '../../stores/dashboardStore';

const gradeStore = useGradeStore();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const isTeacherOrAdmin = computed(() => {
  const role = authStore.user?.role;
  return role === 'teacher' || role === 'admin';
});

const sections = ref([]);
const students = ref([]);
const selectedSectionId = ref(null);
const selectedStudentId = ref(null);

const generatedDate = computed(() => {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

const printReport = () => {
  window.print();
};

const onSectionChange = async () => {
  if (!selectedSectionId.value) return;
  students.value = [];
  selectedStudentId.value = null;
  gradeStore.reportCard = null;
  try {
    await gradeStore.fetchSectionGradebook(selectedSectionId.value);
    students.value = gradeStore.gradebook;
    if (students.value.length > 0) {
      selectedStudentId.value = students.value[0].student_id;
      onStudentChange();
    }
  } catch (err) {
    console.error(err);
  }
};

const onStudentChange = () => {
  if (!selectedStudentId.value) return;
  gradeStore.fetchReportCard(selectedStudentId.value);
};

onMounted(async () => {
  if (isTeacherOrAdmin.value) {
    try {
      await dashboardStore.fetchSections();
      sections.value = dashboardStore.sections;
      if (sections.value.length > 0) {
        selectedSectionId.value = sections.value[0].id;
        await onSectionChange();
      }
    } catch (err) {
      console.error(err);
    }
  } else {
    gradeStore.fetchReportCard();
  }
});
</script>

<style scoped>
/* Print Media Styles */
@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: flex !important;
  }
  .report-page {
    padding: 0 !important;
    background: white !important;
  }
  .report-document {
    border: none !important;
    box-shadow: none !important;
    background: white !important;
    color: black !important;
    padding: 0 !important;
  }
  :deep(.q-layout), :deep(.q-page-container) {
    padding: 0 !important;
  }
}

.print-only {
  display: none;
}

.info-grid {
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 24px;
}
</style>
