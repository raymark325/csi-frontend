<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">MY PROGRESS CARD</p>
        <h1 class="text-display q-my-none">My Grades</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Real-time details of your class performance and semester marks.</p>
      </div>
      <q-btn
        color="primary"
        icon="print"
        label="Print Report Card"
        rounded
        unelevated
        to="/reports"
      />
    </div>

    <!-- Loading -->
    <div v-if="gradeStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Grades Cards Grid -->
    <div v-else class="row q-col-gutter-lg">
      <div v-for="grade in gradeStore.studentGrades" :key="grade.id" class="col-12 col-md-6">
        <div class="glass-card q-pa-xl">
          <div class="row justify-between items-center q-mb-md">
            <div>
              <span class="badge badge-blue">{{ grade.section_name }}</span>
              <h2 class="q-mt-xs q-mb-none" style="font-size: 20px; font-weight: 800; color: var(--text-primary);">
                {{ grade.course_title }}
              </h2>
            </div>
            <div class="text-right">
              <span
                class="badge"
                :class="grade.final_grade >= 75 ? 'badge-green' : 'badge-red'"
                style="font-size: 16px; padding: 6px 14px;"
              >
                {{ grade.final_grade }}%
              </span>
            </div>
          </div>

          <hr class="section-divider" style="margin: 20px 0;" />

          <p class="text-label q-mb-md">Category Breakdown</p>
          <div class="column q-gutter-md">
            <div v-for="cat in grade.categories" :key="cat.id">
              <div class="row justify-between items-center q-mb-xs">
                <span class="text-body text-secondary" style="font-size: 14px;">
                  {{ cat.name }} (Weight: {{ cat.weight }}%)
                </span>
                <span class="text-body text-weight-bold" style="font-size: 14px;">
                  {{ cat.score }}%
                </span>
              </div>
              <div class="progress-track">
                <div class="progress-fill bg-gradient-primary" :style="{ width: cat.score + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!gradeStore.studentGrades.length" class="col-12 text-center text-muted q-py-xl glass-card">
        You are not enrolled in any sections with grading setup.
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGradeStore } from '../../stores/GradingSystem/gradeStore';

const gradeStore = useGradeStore();

onMounted(() => {
  gradeStore.fetchStudentGrades();
});
</script>
