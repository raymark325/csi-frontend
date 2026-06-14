<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">STUDENT HUB</p>
        <h1 class="text-display q-my-none">
          Hello, <span class="text-gradient-blue">{{ authStore.user?.name || 'Student' }}</span>
        </h1>
        <p class="text-body q-mt-xs q-mb-none" style="color: var(--text-secondary);">
          Keep track of your classes, grades, and upcoming deadlines.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <div v-else>
      <!-- Stat Summary Row -->
      <div class="row q-col-gutter-md q-mb-xl">
        <div class="col-12 col-md-4">
          <div class="glass-card stat-card">
            <div class="stat-icon stat-icon--blue"><q-icon name="grade" size="24px"/></div>
            <div>
              <p class="text-label q-mb-xs">Enrolled Classes</p>
              <p class="text-title q-my-none" style="font-size:28px; font-weight:800;">
                {{ dashboardData.sections?.length || 0 }}
              </p>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-4">
          <div class="glass-card stat-card">
            <div class="stat-icon stat-icon--orange"><q-icon name="pending_actions" size="24px"/></div>
            <div>
              <p class="text-label q-mb-xs">Unfinished Tasks</p>
              <div class="row items-center q-gutter-x-sm">
                <span class="text-title q-my-none" style="font-size:28px; font-weight:800; margin-right: 8px;">
                  {{ pendingTasksCount }}
                </span>
                <q-badge color="red" label="Pending" class="q-mr-xs">{{ pendingCount }}</q-badge>
                <q-badge color="orange" label="Drafts">{{ draftsCount }}</q-badge>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-4">
          <div class="glass-card stat-card">
            <div class="stat-icon stat-icon--green"><q-icon name="check_circle" size="24px"/></div>
            <div>
              <p class="text-label q-mb-xs">Status</p>
              <p class="text-title q-my-none text-success" style="font-size:22px; font-weight:700; color: var(--color-success);">
                Good Standing
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-lg">
        <!-- Enrolled Course Grades Grid -->
        <div class="col-12 col-md-7">
          <h3 class="text-subtitle q-mb-md" style="font-size: 20px; font-weight: 700;">My Class Grades</h3>
          <div class="column q-gutter-md">
            <div
              v-for="section in dashboardData.sections"
              :key="section.id"
              class="glass-card q-pa-lg"
            >
              <div class="row justify-between items-center q-mb-md">
                <div>
                  <h4 class="q-my-none" style="font-size: 16px; font-weight: 700; color: var(--text-primary);">
                    {{ section.course }}
                  </h4>
                  <p class="text-caption q-my-none">{{ section.name }}</p>
                </div>
                <div class="text-right">
                  <span
                    class="badge"
                    :class="section.grade >= 75 ? 'badge-green' : 'badge-red'"
                    style="font-size:14px; padding: 6px 14px;"
                  >
                    Grade: {{ section.grade }}%
                  </span>
                </div>
              </div>

              <!-- Progress bar representation -->
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width: Math.min(section.grade, 100) + '%',
                    background: section.grade >= 75 ? 'linear-gradient(135deg, var(--color-success), #30D158)' : 'linear-gradient(135deg, var(--sms-red), var(--sms-red-light))'
                  }"
                ></div>
              </div>
            </div>

            <div v-if="!dashboardData.sections?.length" class="glass-card q-pa-lg text-center text-muted">
              You are not enrolled in any sections yet.
            </div>
          </div>
        </div>

        <!-- Deadlines / Reminders -->
        <div class="col-12 col-md-5">
          <h3 class="text-subtitle q-mb-md" style="font-size: 20px; font-weight: 700;">Upcoming Deadlines</h3>
          <div class="glass-card q-pa-lg">
            <div class="column q-gutter-md">
              <div
                v-for="task in dashboardData.deadlines"
                :key="task.id"
                class="row justify-between items-center q-pb-sm"
                style="border-bottom: 1px solid var(--border-color);"
              >
                <div style="flex: 1; min-width: 0; margin-right: 12px;">
                  <p class="text-body q-my-none text-weight-bold ellipsis">{{ task.title }}</p>
                  <p class="text-caption q-my-none text-muted">
                    Due: {{ formatDate(task.due_date) }}
                  </p>
                </div>
                <div>
                  <span v-if="task.status === 'graded'" class="badge badge-green">Graded</span>
                  <span v-else-if="task.status === 'submitted'" class="badge badge-green">Submitted</span>
                  <span v-else-if="task.status === 'draft'" class="badge badge-orange">Draft</span>
                  <span v-else class="badge badge-red">Pending</span>
                </div>
              </div>

              <div v-if="!dashboardData.deadlines?.length" class="text-center text-muted q-py-md">
                No upcoming deadlines!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useDashboardStore } from '../../stores/dashboardStore';

const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const isLoading = computed(() => dashboardStore.isLoading);
const dashboardData = computed(() => dashboardStore.studentData);

const pendingTasksCount = computed(() => {
  if (!dashboardData.value.deadlines) return 0;
  return dashboardData.value.deadlines.filter(t => t.status !== 'submitted' && t.status !== 'graded').length;
});

const pendingCount = computed(() => {
  if (!dashboardData.value.deadlines) return 0;
  return dashboardData.value.deadlines.filter(t => t.status === 'pending' || !t.status).length;
});

const draftsCount = computed(() => {
  if (!dashboardData.value.deadlines) return 0;
  return dashboardData.value.deadlines.filter(t => t.status === 'draft').length;
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  dashboardStore.fetchStudentDashboard();
});
</script>
