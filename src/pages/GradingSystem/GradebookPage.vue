<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">ACADEMIC RECORD SHEET</p>
        <h1 class="text-display q-my-none">Gradebook</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Manage and record student grades per class category.</p>
      </div>
      <q-btn
        color="secondary"
        icon="settings"
        label="Configure Weights"
        rounded
        unelevated
        to="/grading/weights"
      />
    </div>

    <!-- Section Select -->
    <div class="row q-col-gutter-md q-mb-xl items-center">
      <div class="col-12 col-sm-4">
        <p class="text-label q-mb-xs">Select Section</p>
        <select v-model="selectedSectionId" class="input-glass" @change="loadGradebook">
          <option v-for="sec in sections" :key="sec.id" :value="sec.id">
            {{ sec.name }} - {{ sec.course?.title }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="gradeStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Grades Spreadsheet Grid -->
    <div v-else class="glass-card" style="overflow: hidden;">
      <div style="overflow-x: auto;">
        <table class="gradebook-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); background: rgba(0, 122, 255, 0.03);">
              <th style="padding: 14px 20px; text-align: left;" class="text-label">Student Name</th>
              <th
                v-for="cat in gradeStore.categories"
                :key="cat.id"
                style="padding: 14px 20px; text-align: left;"
                class="text-label"
              >
                {{ cat.name }} ({{ cat.weight }}%)
              </th>
              <th style="padding: 14px 20px; text-align: left;" class="text-label text-primary">Final Grade</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in gradeStore.gradebook"
              :key="row.student_id"
              style="border-bottom: 1px solid var(--border-color); transition: background var(--transition-base);"
              class="gradebook-row-hover"
            >
              <!-- Student Name -->
              <td style="padding: 14px 20px;" class="text-body text-weight-bold">
                {{ row.name }}
              </td>

              <!-- Category scores -->
              <td
                v-for="cat in gradeStore.categories"
                :key="cat.id"
                style="padding: 14px 20px; cursor: pointer;"
                class="text-body cell-editable"
                title="Click to input manual score"
                @click="openInputScoreDialog(row, cat)"
              >
                <span class="text-weight-bold" style="color: var(--sms-blue);">
                  {{ row.scores[cat.id] !== undefined ? row.scores[cat.id] : '—' }}%
                </span>
                <q-icon name="edit" size="12px" class="edit-indicator q-ml-xs" />
              </td>

              <!-- Final Calculated Grade -->
              <td style="padding: 14px 20px;">
                <span
                  style="font-size: 15px; font-weight: 800;"
                  :style="{ color: row.final_grade >= 75 ? 'var(--color-success)' : 'var(--sms-red)' }"
                >
                  {{ row.final_grade }}%
                </span>
              </td>
            </tr>

            <tr v-if="!gradeStore.gradebook.length">
              <td :colspan="(gradeStore.categories?.length || 0) + 2" class="text-center text-muted q-py-xl">
                No students enrolled in this section.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Score Dialog -->
    <q-dialog v-model="showScoreDialog" persistent>
      <q-card class="glass-q-card" style="width: 400px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">Input Category Score</div>
          <p class="text-caption q-my-none">
            Student: <strong>{{ activeStudentName }}</strong><br>
            Category: <strong>{{ activeCategoryName }}</strong>
          </p>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <div class="q-mb-md">
                <p class="text-label q-mb-xs">Raw Score</p>
                <input v-model.number="scoreForm.raw_score" class="input-glass" type="number" min="0" step="0.01"/>
              </div>
            </div>
            <div class="col-6">
              <div class="q-mb-md">
                <p class="text-label q-mb-xs">Max Score</p>
                <input v-model.number="scoreForm.max_score" class="input-glass" type="number" min="1"/>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded v-close-popup />
          <q-btn label="Save Score" color="primary" rounded unelevated @click="handleSaveScore" :loading="isSubmitting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useGradeStore } from '../../stores/GradingSystem/gradeStore';
import { useDashboardStore } from '../../stores/dashboardStore';

const route = useRoute();
const gradeStore = useGradeStore();
const dashboardStore = useDashboardStore();

const selectedSectionId = ref(null);
const sections = ref([]);

const showScoreDialog = ref(false);
const isSubmitting = ref(false);
const activeStudentName = ref('');
const activeCategoryName = ref('');

const scoreForm = ref({
  enrollment_id: '',
  grading_category_id: '',
  raw_score: 0,
  max_score: 100,
});

const loadGradebook = () => {
  if (!selectedSectionId.value) return;
  gradeStore.fetchSectionGradebook(selectedSectionId.value);
};

const openInputScoreDialog = (row, cat) => {
  activeStudentName.value = row.name;
  activeCategoryName.value = cat.name;

  scoreForm.value = {
    enrollment_id: row.enrollment_id,
    grading_category_id: cat.id,
    raw_score: 0,
    max_score: 100,
  };
  showScoreDialog.value = true;
};

const handleSaveScore = async () => {
  isSubmitting.value = true;
  try {
    await gradeStore.inputGrade(scoreForm.value);
    showScoreDialog.value = false;
    loadGradebook();
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
      // Check query params
      if (route.query.section_id) {
        selectedSectionId.value = parseInt(route.query.section_id);
      } else {
        selectedSectionId.value = sections.value[0].id;
      }
      loadGradebook();
    }
  } catch (err) {
    console.error(err);
  }
});
</script>

<style scoped>
.gradebook-row-hover:hover {
  background: rgba(0, 122, 255, 0.04);
}

.cell-editable {
  position: relative;
}

.edit-indicator {
  opacity: 0;
  transition: opacity 0.2s;
  color: var(--text-muted);
}

.cell-editable:hover .edit-indicator {
  opacity: 1;
}
</style>
