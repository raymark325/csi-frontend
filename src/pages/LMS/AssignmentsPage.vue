<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">LMS SUBSYSTEM</p>
        <h1 class="text-display q-my-none">Assignments</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Manage and submit class tasks and homework assignments.</p>
      </div>
    </div>

    <!-- Section Selection Row (Teacher only) -->
    <div v-if="authStore.user?.role === 'teacher' || authStore.user?.role === 'admin'" class="row q-gutter-md q-mb-xl items-center">
      <div class="col-12 col-sm-4">
        <p class="text-label q-mb-xs">Select Section</p>
        <select v-model="selectedSectionId" class="input-glass" @change="loadSectionAssignments">
          <option v-for="sec in sections" :key="sec.id" :value="sec.id">
            {{ sec.name }} - {{ sec.course?.title }}
          </option>
        </select>
      </div>
      <div class="col">
        <q-btn
          color="primary"
          icon="add"
          label="Create Assignment"
          rounded
          unelevated
          class="q-mt-md"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="lmsStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <div v-else class="column q-gutter-md">
      <!-- Assignment Cards -->
      <div
        v-for="assign in lmsStore.assignments"
        :key="assign.id"
        class="glass-card q-pa-lg"
      >
        <div class="row justify-between items-center q-mb-md">
          <div>
            <div class="row items-center q-gutter-sm q-mb-xs">
              <span class="badge badge-blue">Category: {{ assign.grading_category?.name || 'Unlinked' }}</span>
              <span
                class="badge"
                :class="assign.type === 'coding' ? 'badge-blue' : 'badge-orange'"
                style="text-transform: capitalize;"
              >
                {{ assign.type === 'coding' ? 'Coding Works' : 'Written Works' }}
              </span>
              <span class="text-caption text-weight-bold text-primary">Points: {{ assign.max_score }}</span>

              <!-- STUDENT: per-assignment submission status badge -->
              <template v-if="authStore.user?.role === 'student'">
                <span v-if="getStudentSubmission(assign.id)?.status === 'submitted'" class="status-badge status-submitted">
                  <q-icon name="check_circle" size="12px" class="q-mr-xs" />Submitted
                </span>
                <span v-else-if="getStudentSubmission(assign.id)?.status === 'graded'" class="status-badge status-graded">
                  <q-icon name="star" size="12px" class="q-mr-xs" />Graded
                </span>
                <span v-else-if="getStudentSubmission(assign.id)?.status === 'draft'" class="status-badge status-draft">
                  <q-icon name="edit" size="12px" class="q-mr-xs" />Draft
                </span>
                <span v-else class="status-badge status-pending">
                  <q-icon name="pending" size="12px" class="q-mr-xs" />Pending
                </span>
              </template>

              <!-- TEACHER: per-assignment pending submission count badge -->
              <template v-if="authStore.user?.role === 'teacher' || authStore.user?.role === 'admin'">
                <span v-if="getSubmittedCount(assign.id) > 0" class="status-badge status-pending">
                  <q-icon name="inbox" size="12px" class="q-mr-xs" />{{ getSubmittedCount(assign.id) }} to grade
                </span>
                <span v-if="getDraftCount(assign.id) > 0" class="status-badge status-draft">
                  <q-icon name="edit" size="12px" class="q-mr-xs" />{{ getDraftCount(assign.id) }} in progress
                </span>
                <span v-if="getGradedCount(assign.id) > 0" class="status-badge status-graded">
                  <q-icon name="check_circle" size="12px" class="q-mr-xs" />{{ getGradedCount(assign.id) }} graded
                </span>
              </template>
            </div>
            <h3 class="q-my-none" style="font-size: 18px; font-weight: 700; color: var(--text-primary);">
              {{ assign.title }}
            </h3>
            <p class="text-caption q-my-none text-muted q-mt-xs">
              Due Date: {{ formatDate(assign.due_date) }}
            </p>
          </div>

          <!-- Submission status button for students -->
          <div v-if="authStore.user?.role === 'student'">
            <q-btn
              color="primary"
              label="Go to Lab"
              icon="code"
              rounded
              unelevated
              :to="`/lms/lab?assignment_id=${assign.id}&max_score=${assign.max_score}`"
            />
          </div>
          <!-- Edit/Delete/Submissions for teachers -->
          <div v-else class="row q-gutter-sm">
            <q-btn
              outline
              color="primary"
              label="Submissions"
              icon="grading"
              rounded
              dense
              :to="`/lms/submissions?section_id=${selectedSectionId}&assignment_id=${assign.id}`"
            >
              <q-badge
                v-if="getPendingCount(assign.id) > 0"
                color="red"
                floating
                rounded
                :label="getPendingCount(assign.id) > 99 ? '99+' : getPendingCount(assign.id)"
                style="font-size: 10px; font-weight: 800;"
              />
            </q-btn>
            <q-btn
              outline
              color="warning"
              icon="edit"
              rounded
              dense
              label="Edit"
              @click="openEditDialog(assign)"
            />
            <q-btn
              outline
              color="negative"
              icon="delete"
              rounded
              dense
              @click="confirmDelete(assign)"
            />
          </div>
        </div>

        <p class="text-body text-secondary q-mb-none" style="font-size: 14px; line-height: 1.5;">
          {{ assign.description }}
        </p>
      </div>

      <div v-if="!lmsStore.assignments.length" class="text-center text-muted q-py-xl glass-card">
        No assignments are currently posted for this section.
      </div>
    </div>

    <!-- Edit Assignment Dialog -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card class="glass-q-card" style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6 text-warning font-weight-bold">Edit Assignment</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Assignment Type</p>
            <select v-model="editAssignment.type" class="input-glass">
              <option value="coding">Coding (Playground Compiler enabled)</option>
              <option value="written">Written Works (Simple editor / report submission)</option>
            </select>
          </div>
          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Assignment Title</p>
            <input v-model="editAssignment.title" class="input-glass" type="text"/>
          </div>
          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Task Instructions</p>
            <textarea v-model="editAssignment.description" class="input-glass" rows="4"></textarea>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col">
              <p class="text-label q-mb-xs">Max Score</p>
              <input v-model.number="editAssignment.max_score" class="input-glass" type="number" min="1"/>
            </div>
            <div class="col">
              <p class="text-label q-mb-xs">Due Date</p>
              <input v-model="editAssignment.due_date" class="input-glass" type="datetime-local"/>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded v-close-popup />
          <q-btn label="Save Changes" color="warning" rounded unelevated @click="handleEditAssignment" :loading="isSubmitting" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Create Assignment Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card class="glass-q-card" style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">Create New Assignment</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Grading Category</p>
            <select v-model="newAssignment.grading_category_id" class="input-glass">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }} (Weight: {{ cat.weight }}%)
              </option>
            </select>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Assignment Type</p>
            <select v-model="newAssignment.type" class="input-glass">
              <option value="coding">Coding (Playground Compiler enabled)</option>
              <option value="written">Written Works (Simple editor / report submission)</option>
            </select>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Assignment Title</p>
            <input v-model="newAssignment.title" class="input-glass" type="text" placeholder="e.g. Activity 3: SQL Joins"/>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Task Instructions</p>
            <textarea v-model="newAssignment.description" class="input-glass" rows="4" placeholder="Detail instructions here..."></textarea>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col">
              <div class="q-mb-md">
                <p class="text-label q-mb-xs">Max Score</p>
                <input v-model.number="newAssignment.max_score" class="input-glass" type="number" min="1"/>
              </div>
            </div>
            <div class="col">
              <div class="q-mb-md">
                <p class="text-label q-mb-xs">Due Date</p>
                <input v-model="newAssignment.due_date" class="input-glass" type="datetime-local"/>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded v-close-popup />
          <q-btn label="Create" color="primary" rounded unelevated @click="handleCreateAssignment" :loading="isSubmitting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useLmsStore } from '../../stores/LMS/lmsStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useQuasar } from 'quasar';
import { useDashboardStore } from '../../stores/dashboardStore';
import { gradeService } from '../../services/GradingSystem/gradeService';
import { lmsService } from '../../services/LMS/lmsService';

const authStore = ref(useAuthStore());
const lmsStore = useLmsStore();
const notifStore = useNotificationStore();
const dashboardStore = useDashboardStore();
const $q = useQuasar();

const selectedSectionId = ref(null);
const sections = ref([]);
const categories = ref([]);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const isSubmitting = ref(false);
const editingAssignmentId = ref(null);

// Submission data
const studentSubmissions = ref([]);   // student's own submissions
const sectionSubmissions = ref([]);   // all submissions for a section (teacher)

// Student: find the student's own submission for a given assignment
const getStudentSubmission = (assignmentId) =>
  studentSubmissions.value.find(s => s.assignment_id === assignmentId);

// Teacher: count pending (submitted + draft — not yet graded) submissions per assignment
const getPendingCount = (assignmentId) =>
  sectionSubmissions.value.filter(s =>
    s.assignment_id === assignmentId &&
    (s.status === 'submitted' || s.status === 'draft')
  ).length;

// Teacher: count submitted (ready to grade) per assignment
const getSubmittedCount = (assignmentId) =>
  sectionSubmissions.value.filter(s => s.assignment_id === assignmentId && s.status === 'submitted').length;

// Teacher: count in-progress drafts per assignment
const getDraftCount = (assignmentId) =>
  sectionSubmissions.value.filter(s => s.assignment_id === assignmentId && s.status === 'draft').length;

// Teacher: count graded submissions per assignment
const getGradedCount = (assignmentId) =>
  sectionSubmissions.value.filter(s => s.assignment_id === assignmentId && s.status === 'graded').length;

const newAssignment = ref({
  section_id: '',
  grading_category_id: '',
  title: '',
  description: '',
  due_date: '',
  max_score: 100,
  type: 'coding',
});

const editAssignment = ref({
  title: '',
  description: '',
  due_date: '',
  max_score: 100,
  type: 'coding',
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const loadSectionAssignments = async () => {
  if (!selectedSectionId.value) return;
  await lmsStore.fetchAssignments(selectedSectionId.value);
  // Also load section submissions for per-assignment badge counts
  try {
    const res = await lmsService.getSectionSubmissions(selectedSectionId.value);
    sectionSubmissions.value = res.data || [];
  } catch (err) {
    console.warn('Could not load section submissions:', err);
  }
};

const openCreateDialog = async () => {
  if (!selectedSectionId.value) return;
  // load categories
  try {
    const res = await gradeService.getCategories(selectedSectionId.value);
    categories.value = res.data;
    if (categories.value.length > 0) {
      newAssignment.value.grading_category_id = categories.value[0].id;
    }
    newAssignment.value.section_id = selectedSectionId.value;
    showCreateDialog.value = true;
  } catch (err) {
    console.error(err);
  }
};

const handleCreateAssignment = async () => {
  isSubmitting.value = true;
  try {
    await lmsStore.createAssignment(newAssignment.value);
    showCreateDialog.value = false;
    newAssignment.value = { section_id: '', grading_category_id: '', title: '', description: '', due_date: '', max_score: 100, type: 'coding' };
    loadSectionAssignments();
  } catch (err) {
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};

const openEditDialog = (assign) => {
  editingAssignmentId.value = assign.id;
  editAssignment.value = {
    title: assign.title,
    description: assign.description,
    due_date: assign.due_date ? assign.due_date.substring(0, 16) : '',
    max_score: assign.max_score,
    type: assign.type,
  };
  showEditDialog.value = true;
};

const handleEditAssignment = async () => {
  isSubmitting.value = true;
  try {
    await lmsStore.updateAssignment(editingAssignmentId.value, editAssignment.value);
    showEditDialog.value = false;
    $q.notify({ type: 'positive', message: 'Assignment updated successfully!' });
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to update assignment.' });
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (assign) => {
  $q.dialog({
    title: 'Delete Assignment',
    message: `Are you sure you want to delete "${assign.title}"? This will also delete all submissions.`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(async () => {
    try {
      await lmsStore.deleteAssignment(assign.id);
      $q.notify({ type: 'positive', message: 'Assignment deleted.' });
    } catch (err) {
      $q.notify({ type: 'negative', message: 'Failed to delete assignment.' });
    }
  });
};

onMounted(async () => {
  if (authStore.value.user?.role === 'student') {
    const studentSecId = authStore.value.user?.profile?.section_id || 1;
    await lmsStore.fetchAssignments(studentSecId);

    // Load the student's own submissions for per-card status badges
    try {
      const res = await lmsService.getSubmissions();
      studentSubmissions.value = res.data || [];
    } catch (err) {
      console.warn('Could not load student submissions:', err);
    }

    // Mark all loaded assignments as seen — clears sidebar badge
    const ids = lmsStore.assignments.map(a => a.id);
    notifStore.markAssignmentsRead(ids);
  } else {
    try {
      const data = await dashboardStore.fetchSections();
      sections.value = dashboardStore.sections;
      if (sections.value.length > 0) {
        selectedSectionId.value = sections.value[0].id;
        loadSectionAssignments();
      }
    } catch (err) {
      console.error(err);
    }
  }
});
</script>

<style scoped>
.full-width { width: 100%; }

/* Per-assignment status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  letter-spacing: 0.03em;
  animation: badge-pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes badge-pop-in {
  from { transform: scale(0.7); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
.status-pending {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.35);
  animation: pending-pulse 2.5s ease-in-out infinite, badge-pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pending-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
  50%       { box-shadow: 0 0 6px 3px rgba(245, 158, 11, 0.2); }
}
.status-draft {
  background: rgba(99, 102, 241, 0.12);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.25);
}
.status-submitted {
  background: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.25);
}
.status-graded {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
}
</style>
