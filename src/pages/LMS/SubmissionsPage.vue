<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">TEACHER REVIEW CONSOLE</p>
        <h1 class="text-display q-my-none">Submissions</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Grade and give feedback on student assignment submissions.</p>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="row q-col-gutter-md q-mb-xl items-center">
      <div class="col-12 col-sm-4">
        <p class="text-label q-mb-xs">Select Section</p>
        <select v-model="selectedSectionId" class="input-glass" @change="loadSectionSubmissions">
          <option v-for="sec in sections" :key="sec.id" :value="sec.id">
            {{ sec.name }} - {{ sec.course?.title }}
          </option>
        </select>
      </div>
      <div class="col-12 col-sm-4">
        <p class="text-label q-mb-xs">Filter by Assignment</p>
        <select v-model="selectedAssignmentId" class="input-glass">
          <option :value="null">All Assignments</option>
          <option v-for="assign in lmsStore.assignments" :key="assign.id" :value="assign.id">
            {{ assign.title }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="lmsStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Submissions Table Grid -->
    <div v-else class="glass-card" style="overflow: hidden;">
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Student</th>
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Assignment</th>
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Submitted At</th>
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Status</th>
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Score</th>
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sub in filteredSubmissions"
              :key="sub.id"
              style="border-bottom: 1px solid var(--border-color);"
            >
              <td style="padding: 14px 20px;" class="text-body text-weight-bold">
                {{ sub.student?.profile ? sub.student.profile.first_name + ' ' + sub.student.profile.last_name : sub.student?.name }}
              </td>
              <td style="padding: 14px 20px;" class="text-body">{{ sub.assignment?.title }}</td>
              <td style="padding: 14px 20px;" class="text-caption">{{ formatDate(sub.created_at) }}</td>
              <td style="padding: 14px 20px;">
                <span :class="['badge', sub.status === 'graded' ? 'badge-green' : 'badge-orange']">
                  {{ sub.status === 'graded' ? 'Graded' : 'Pending' }}
                </span>
              </td>
              <td style="padding: 14px 20px;" class="text-body">
                <span v-if="sub.score !== null" class="text-weight-bold">
                  {{ sub.score }} / {{ sub.assignment?.max_score }}
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td style="padding: 14px 20px;">
                <q-btn
                  color="primary"
                  label="Grade"
                  rounded
                  dense
                  unelevated
                  size="sm"
                  style="padding: 4px 12px;"
                  @click="openGradeDialog(sub)"
                />
              </td>
            </tr>

            <tr v-if="!filteredSubmissions.length">
              <td colspan="6" class="text-center text-muted q-py-xl">No submissions received for this section.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Grade Dialog -->
    <q-dialog v-model="showGradeDialog" persistent>
      <q-card class="glass-q-card" style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">Grade Submission</div>
        </q-card-section>

        <q-card-section class="q-pt-none" v-if="activeSubmission">
          <!-- Submitted Code Content -->
          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Submitted Code</p>
            <div style="background: #1e1e1e; padding: 12px; border-radius: var(--radius-md); overflow-x: auto;">
              <pre style="margin:0; font-family:monospace; color:#d4d4d4; font-size:12px;">{{ activeSubmission.content }}</pre>
            </div>
          </div>

          <div class="row q-col-gutter-sm items-center q-mb-md">
            <div class="col-6">
              <p class="text-label q-mb-xs">Score (out of {{ activeSubmission.assignment?.max_score }})</p>
              <input v-model.number="gradeScore" class="input-glass" type="number" min="0" :max="activeSubmission.assignment?.max_score"/>
            </div>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Teacher Feedback</p>
            <textarea v-model="gradeFeedback" class="input-glass" rows="3" placeholder="Great effort, code compiles successfully..."></textarea>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded v-close-popup />
          <q-btn label="Submit Grade" color="primary" rounded unelevated @click="handleGradeSubmission" :loading="isSubmitting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useLmsStore } from '../../stores/LMS/lmsStore';
import { useDashboardStore } from '../../stores/dashboardStore';

const route = useRoute();
const lmsStore = useLmsStore();
const dashboardStore = useDashboardStore();

const selectedSectionId = ref(null);
const selectedAssignmentId = ref(null);
const sections = ref([]);
const showGradeDialog = ref(false);
const isSubmitting = ref(false);
const activeSubmission = ref(null);

const gradeScore = ref(0);
const gradeFeedback = ref('');

const filteredSubmissions = computed(() => {
  if (!selectedAssignmentId.value) {
    return lmsStore.submissions;
  }
  return lmsStore.submissions.filter(sub => sub.assignment_id === parseInt(selectedAssignmentId.value));
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const loadSectionSubmissions = async () => {
  if (!selectedSectionId.value) return;
  lmsStore.fetchSectionSubmissions(selectedSectionId.value);
  await lmsStore.fetchAssignments(selectedSectionId.value);
  
  const exists = lmsStore.assignments.some(a => a.id === selectedAssignmentId.value);
  if (!exists) {
    selectedAssignmentId.value = null;
  }
};

const openGradeDialog = (sub) => {
  activeSubmission.value = sub;
  gradeScore.value = sub.score || 0;
  gradeFeedback.value = sub.feedback || '';
  showGradeDialog.value = true;
};

const handleGradeSubmission = async () => {
  if (!activeSubmission.value) return;
  isSubmitting.value = true;
  try {
    await lmsStore.gradeSubmission(activeSubmission.value.id, gradeScore.value, gradeFeedback.value);
    showGradeDialog.value = false;
    loadSectionSubmissions();
  } catch (err) {
    console.error(err);
  } finally {
    isSubmitting.value = false;
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
      
      if (route.query.assignment_id) {
        selectedAssignmentId.value = parseInt(route.query.assignment_id);
      }
      
      await loadSectionSubmissions();
    }
  } catch (err) {
    console.error(err);
  }
});
</script>
