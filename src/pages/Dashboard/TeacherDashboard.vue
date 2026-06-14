<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">TEACHER CONTROL PANEL</p>
        <h1 class="text-display q-my-none">
          Hello, <span class="text-gradient-blue">{{ authStore.user?.name || 'Teacher' }}</span>
        </h1>
        <p class="text-body q-mt-xs q-mb-none" style="color: var(--text-secondary);">
          Overview of your active classes, students, and grading sheets.
        </p>
      </div>

      <!-- Total pending badge in header -->
      <div v-if="totalPendingGrading > 0" class="pending-alert-banner">
        <q-icon name="notifications_active" size="20px" class="q-mr-sm" />
        <span>{{ totalPendingGrading }} submission{{ totalPendingGrading !== 1 ? 's' : '' }} awaiting grading</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <div v-else>
      <h3 class="text-subtitle q-mb-md" style="font-size: 20px; font-weight: 700;">My Active Classes</h3>

      <!-- Class Sections Grid -->
      <div class="row q-col-gutter-lg">
        <div
          v-for="section in sections"
          :key="section.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <div class="glass-card section-card q-pa-xl">
            <!-- Section Header -->
            <div>
              <div class="row justify-between items-start q-mb-md">
                <span class="badge badge-blue">{{ section.name }}</span>
                <span v-if="section.pending_grading > 0" class="badge badge-red pending-pulse">
                  <q-icon name="mark_email_unread" size="12px" class="q-mr-xs" />
                  {{ section.pending_grading }} Pending
                </span>
              </div>

              <h4 class="q-mt-none q-mb-xs" style="font-size: 18px; font-weight: 700; color: var(--text-primary);">
                {{ section.course }}
              </h4>
              <p class="text-caption q-my-none text-muted" style="margin-bottom: 16px;">
                <q-icon name="schedule" size="14px" class="q-mr-xs"/>{{ section.schedule || 'No Schedule' }}
              </p>

              <!-- Mini Stats Row -->
              <div class="row q-gutter-md q-mb-lg">
                <div>
                  <p class="text-label q-mb-xs">Enrolled</p>
                  <p class="text-title q-my-none" style="font-size: 16px;">{{ section.students_count }} Students</p>
                </div>
                <div>
                  <p class="text-label q-mb-xs">Assignments</p>
                  <p class="text-title q-my-none" style="font-size: 16px;">{{ section.assignments?.length || 0 }} Total</p>
                </div>
              </div>

              <!-- Assignment Notifications Panel -->
              <div v-if="section.assignments?.length" class="assignments-panel q-mb-lg">
                <div class="assignments-panel-header" @click="toggleSection(section.id)">
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="assignment" size="16px" style="color: var(--sms-blue);" />
                    <span class="assignments-panel-title">Assignments</span>
                    <q-badge
                      v-if="section.pending_grading > 0"
                      color="red"
                      floating
                      :label="section.pending_grading"
                      style="position: relative; margin-left: 4px;"
                    />
                  </div>
                  <q-icon
                    :name="expandedSections[section.id] ? 'expand_less' : 'expand_more'"
                    size="18px"
                    style="color: var(--text-secondary);"
                  />
                </div>

                <q-slide-transition>
                  <div v-show="expandedSections[section.id]">
                    <div
                      v-for="assignment in section.assignments"
                      :key="assignment.id"
                      class="assignment-row"
                      :class="{ 'has-submissions': assignment.submitted_count > 0 }"
                    >
                      <div class="assignment-info">
                        <div class="row items-center q-gutter-xs q-mb-xs">
                          <!-- Type badge -->
                          <span class="asgn-type-badge" :class="assignment.type === 'coding' ? 'type-coding' : 'type-written'">
                            <q-icon :name="assignment.type === 'coding' ? 'code' : 'edit_note'" size="11px" class="q-mr-xs" />
                            {{ assignment.type === 'coding' ? 'Coding' : 'Written' }}
                          </span>
                          <!-- Submitted notification badge -->
                          <span v-if="assignment.submitted_count > 0" class="notif-badge notif-submitted">
                            <q-icon name="inbox" size="11px" class="q-mr-xs" />
                            {{ assignment.submitted_count }} submitted
                          </span>
                          <span v-if="assignment.graded_count > 0" class="notif-badge notif-graded">
                            <q-icon name="check_circle" size="11px" class="q-mr-xs" />
                            {{ assignment.graded_count }} graded
                          </span>
                        </div>
                        <p class="assignment-title">{{ assignment.title }}</p>
                        <p v-if="assignment.due_date" class="assignment-due">
                          <q-icon name="event" size="11px" class="q-mr-xs" />
                          Due {{ formatDate(assignment.due_date) }}
                        </p>
                      </div>
                      <!-- Grade Now button only for assignments with pending -->
                      <q-btn
                        v-if="assignment.submitted_count > 0"
                        unelevated
                        size="xs"
                        color="orange-7"
                        label="Grade"
                        icon="grading"
                        rounded
                        :to="`/lms/submissions?section_id=${section.id}`"
                        class="grade-btn"
                      />
                    </div>
                  </div>
                </q-slide-transition>
              </div>
            </div>

            <!-- Quick Action Links -->
            <div class="row q-col-gutter-xs">
              <div class="col-4">
                <q-btn
                  outline
                  color="primary"
                  label="LMS"
                  class="full-width"
                  dense
                  rounded
                  :to="`/lms?section_id=${section.id}`"
                />
              </div>
              <div class="col-4">
                <q-btn
                  outline
                  color="accent"
                  label="Grades"
                  class="full-width"
                  dense
                  rounded
                  :to="`/grading?section_id=${section.id}`"
                />
              </div>
              <div class="col-4">
                <q-btn
                  outline
                  color="positive"
                  label="Attnd"
                  class="full-width"
                  dense
                  rounded
                  :to="`/attendance?section_id=${section.id}`"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="!sections.length" class="col-12 text-center text-muted q-py-xl glass-card">
          No classes assigned to you yet.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useDashboardStore } from '../../stores/dashboardStore';

const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const isLoading = computed(() => dashboardStore.isLoading);
const sections = computed(() => dashboardStore.teacherSections);
const expandedSections = ref({});

const totalPendingGrading = computed(() =>
  sections.value.reduce((sum, s) => sum + (s.pending_grading || 0), 0)
);

const toggleSection = (id) => {
  expandedSections.value[id] = !expandedSections.value[id];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

onMounted(async () => {
  await dashboardStore.fetchTeacherDashboard();
  // Auto-expand sections that have pending grading
  sections.value.forEach(s => {
    if (s.pending_grading > 0) {
      expandedSections.value[s.id] = true;
    }
  });
});
</script>

<style scoped>
.full-width {
  width: 100%;
}

.section-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Header pending alert */
.pending-alert-banner {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 12px;
  padding: 10px 18px;
  color: #ef4444;
  font-size: 14px;
  font-weight: 600;
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: rgba(239, 68, 68, 0.35); }
  50% { border-color: rgba(239, 68, 68, 0.75); }
}

/* Pending badge pulse */
.pending-pulse {
  animation: badge-pulse 2s ease-in-out infinite;
}
@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Assignments panel */
.assignments-panel {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}

.assignments-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}
.assignments-panel-header:hover {
  background: rgba(255, 255, 255, 0.09);
}

.assignments-panel-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
}

/* Assignment rows */
.assignment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.2s;
  gap: 8px;
}
.assignment-row:last-child {
  border-bottom: none;
}
.assignment-row:hover {
  background: rgba(255, 255, 255, 0.04);
}
.assignment-row.has-submissions {
  background: rgba(245, 158, 11, 0.05);
}
.assignment-row.has-submissions:hover {
  background: rgba(245, 158, 11, 0.09);
}

.assignment-info {
  flex: 1;
  min-width: 0;
}

.assignment-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.assignment-due {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--text-secondary);
}

/* Type badges */
.asgn-type-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 2px 7px;
  border-radius: 20px;
  text-transform: uppercase;
}
.type-coding {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.25);
}
.type-written {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

/* Notification badges */
.notif-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
}
.notif-submitted {
  background: rgba(245, 158, 11, 0.18);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.35);
  animation: notif-glow 2.5s ease-in-out infinite;
}
@keyframes notif-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
  50% { box-shadow: 0 0 6px 2px rgba(245, 158, 11, 0.25); }
}
.notif-graded {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.grade-btn {
  flex-shrink: 0;
  font-size: 11px !important;
}
</style>
