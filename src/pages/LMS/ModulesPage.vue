<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <q-btn flat no-caps color="primary" icon="arrow_back" label="Back to Subjects" to="/lms" class="q-mb-md" style="margin-left: -12px;" />
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">LEARNING MANAGEMENT SYSTEM</p>
        <h1 class="text-display q-my-none">{{ courseName }}</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Browse modules and learning guides for this subject.</p>
      </div>
      <!-- Teacher only action -->
      <q-btn
        v-if="isTeacherOrAdmin"
        color="primary"
        icon="add"
        label="Upload Lesson"
        rounded
        unelevated
        @click="openCreateDialog"
      />
    </div>

    <!-- Loading -->
    <div v-if="lmsStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <div v-else class="q-gutter-y-xl">
      <div v-if="filteredModules.length === 0" class="text-center text-muted q-py-xl glass-card">
        No lessons have been posted for this subject yet.
      </div>

      <div class="row q-col-gutter-lg">
        <div v-for="mod in filteredModules" :key="mod.id" class="col-12 col-md-6 col-lg-4">
          <div class="glass-card q-pa-xl lesson-card" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="row justify-between items-center q-mb-md">
                <div class="row q-gutter-xs">
                  <span class="badge badge-blue">
                    <q-icon name="category" size="12px" class="q-mr-xs"/>
                    {{ mod.category || 'Lecture' }}
                  </span>
                </div>
                <span class="text-caption text-muted">{{ formatDate(mod.created_at) }}</span>
              </div>

              <h3 class="q-mt-none q-mb-sm" style="font-size: 18px; font-weight: 700; color: var(--text-primary);">
                {{ mod.title }}
              </h3>
              <p class="text-body text-secondary q-mb-md" style="font-size: 14px; line-height: 1.5;">
                {{ mod.description || 'No description provided.' }}
              </p>

              <!-- Section visibility badges (teacher view) -->
              <div v-if="isTeacherOrAdmin && mod.visible_section_ids?.length" class="q-mb-md">
                <p class="text-label q-mb-xs" style="font-size: 11px; opacity: 0.7;">VISIBLE TO SECTIONS</p>
                <div class="row q-gutter-xs flex-wrap">
                  <span
                    v-for="ssId in mod.visible_section_ids"
                    :key="ssId"
                    class="badge badge-green"
                    style="font-size: 11px;"
                  >
                    {{ getSectionName(ssId) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="row q-gutter-sm">
              <q-btn
                color="primary"
                label="Open Lesson"
                class="col-grow"
                rounded
                unelevated
                :to="`/lms/modules/${mod.id}`"
              />
              <!-- Teacher: edit visibility -->
              <q-btn
                v-if="isTeacherOrAdmin"
                icon="visibility"
                flat
                round
                color="primary"
                @click="openVisibilityDialog(mod)"
              >
                <q-tooltip>Manage Section Visibility</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Create Lesson Dialog ─────────────────────────────────────────── -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card class="glass-q-card" style="width: 560px; max-width: 95vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">Upload New Lesson</div>
          <div class="text-caption text-muted">Choose which sections can see this lesson.</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-8">
              <p class="text-label q-mb-xs">Lesson Title</p>
              <input v-model="newModule.title" class="input-glass" type="text" placeholder="e.g. Module 1: Java Classes"/>
            </div>
            <div class="col-4">
              <p class="text-label q-mb-xs">Category</p>
              <select v-model="newModule.category" class="input-glass">
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Handout">Handout</option>
                <option value="Syllabus">Syllabus</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Brief Description</p>
            <textarea v-model="newModule.description" class="input-glass" rows="2" placeholder="Summary of this lesson..."></textarea>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Content (HTML Support)</p>
            <textarea v-model="newModule.content" class="input-glass" rows="5" placeholder="<h3>Title</h3><p>Content...</p>"></textarea>
          </div>

          <!-- Section visibility selector -->
          <div class="q-mb-md">
            <p class="text-label q-mb-xs">
              Visible to Sections
              <span class="text-negative q-ml-xs">*</span>
            </p>
            <div v-if="sectionOptions.length === 0" class="text-caption text-muted q-pa-sm">
              Loading sections...
            </div>
            <div v-else class="section-checkboxes">
              <label
                v-for="sec in sectionOptions"
                :key="sec.id"
                class="section-checkbox-row"
                :class="{ selected: newModule.section_subject_ids.includes(sec.id) }"
              >
                <input
                  type="checkbox"
                  :value="sec.id"
                  v-model="newModule.section_subject_ids"
                />
                <span class="section-label">{{ sec.label }}</span>
              </label>
            </div>
            <div v-if="newModule.section_subject_ids.length === 0" class="text-caption text-negative q-mt-xs">
              Please select at least one section.
            </div>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Attach File (PPT, PDF, Word, Image)</p>
            <input type="file" @change="handleFileUpload" class="input-glass q-pa-sm" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif" />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded v-close-popup />
          <q-btn
            label="Upload Lesson"
            color="primary"
            rounded
            unelevated
            @click="handleCreateModule"
            :loading="isSubmitting"
            :disable="newModule.section_subject_ids.length === 0 || !newModule.title"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Section Visibility Dialog (edit existing) ───────────────────── -->
    <q-dialog v-model="showVisibilityDialog" persistent>
      <q-card class="glass-q-card" style="width: 460px; max-width: 95vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">Section Visibility</div>
          <div class="text-caption text-muted">
            Choose which sections can see <strong>{{ editingModule?.title }}</strong>.
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="section-checkboxes">
            <label
              v-for="sec in sectionOptions"
              :key="sec.id"
              class="section-checkbox-row"
              :class="{ selected: editSectionIds.includes(sec.id) }"
            >
              <input
                type="checkbox"
                :value="sec.id"
                v-model="editSectionIds"
              />
              <span class="section-label">{{ sec.label }}</span>
            </label>
          </div>
          <div v-if="editSectionIds.length === 0" class="text-caption text-negative q-mt-sm">
            At least one section must be selected.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded v-close-popup />
          <q-btn
            label="Save Visibility"
            color="primary"
            rounded
            unelevated
            @click="saveVisibility"
            :loading="isSavingVisibility"
            :disable="editSectionIds.length === 0"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../../stores/auth';
import { useLmsStore } from '../../stores/LMS/lmsStore';
import { useDashboardStore } from '../../stores/dashboardStore';

const route = useRoute();
const authStore = useAuthStore();
const lmsStore = useLmsStore();
const dashboardStore = useDashboardStore();
const $q = useQuasar();

const showCreateDialog = ref(false);
const showVisibilityDialog = ref(false);
const isSubmitting = ref(false);
const isSavingVisibility = ref(false);
const editingModule = ref(null);
const editSectionIds = ref([]);

const currentSectionSubjectId = computed(() => Number(route.params.id));
const isTeacherOrAdmin = computed(() => ['teacher', 'admin'].includes(authStore.user?.role));

// ── Section options for the current subject ────────────────────────────────
// All section_subjects that teach the same course as the current one
const sectionOptions = computed(() => {
  const allSections = authStore.userRole === 'teacher'
    ? dashboardStore.teacherSections
    : (dashboardStore.sections || []);

  // Find the course of the current section_subject
  const currentSection = allSections.find(s => s.id === currentSectionSubjectId.value);
  const currentCourseId = currentSection?.course_id;

  if (!currentCourseId) {
    // Fallback: just show all sections the teacher handles
    return allSections.map(s => ({
      id: s.id,
      label: `${s.section?.name || s.name} — ${s.course?.title || s.course_code || ''}`,
    }));
  }

  // Filter to only sections teaching the same course
  return allSections
    .filter(s => s.course_id === currentCourseId)
    .map(s => ({
      id: s.id,
      label: `${s.section?.name || s.name}`,
    }));
});

// Mapping of section_subject_id → human label for badges
const getSectionName = (ssId) => {
  const sec = sectionOptions.value.find(s => s.id === ssId);
  return sec?.label ?? `Section #${ssId}`;
};

const newModule = ref({
  title: '',
  category: 'Lecture',
  description: '',
  content: '',
  section_subject_ids: [],
});

// Auto-select the current section when dialog opens
const openCreateDialog = async () => {
  if (isTeacherOrAdmin.value && dashboardStore.teacherSections.length === 0) {
    await dashboardStore.fetchTeacherDashboard();
  } else if (authStore.userRole === 'admin' && (!dashboardStore.sections || dashboardStore.sections.length === 0)) {
    await dashboardStore.fetchSections();
  }
  newModule.value = {
    title: '',
    category: 'Lecture',
    description: '',
    content: '',
    section_subject_ids: [currentSectionSubjectId.value],
  };
  showCreateDialog.value = true;
};

const openVisibilityDialog = async (mod) => {
  if (isTeacherOrAdmin.value && dashboardStore.teacherSections.length === 0) {
    await dashboardStore.fetchTeacherDashboard();
  }
  editingModule.value = mod;
  editSectionIds.value = [...(mod.visible_section_ids || [])];
  showVisibilityDialog.value = true;
};

let selectedFile = null;

const filteredModules = computed(() => {
  // Show modules that are visible to the current section_subject
  return lmsStore.modules.filter(m => {
    if (m.course_id) return false; // skip master templates
    const visibleIds = m.visible_section_ids || (m.section_subject_id ? [m.section_subject_id] : []);
    return visibleIds.includes(currentSectionSubjectId.value);
  });
});

const courseName = computed(() => {
  const allSections = authStore.userRole === 'teacher'
    ? dashboardStore.teacherSections
    : (dashboardStore.sections || []);
  const sec = allSections.find(s => s.id === currentSectionSubjectId.value);
  if (sec) {
    return `${sec.course?.course_code || ''} — ${sec.course?.title || 'Course'}`;
  }
  if (filteredModules.value.length > 0) {
    const mod = filteredModules.value[0];
    const code = mod.sectionSubject?.course?.course_code || 'General';
    const title = mod.sectionSubject?.course?.title || 'Course';
    return `${code} — ${title}`;
  }
  return 'Course Modules';
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  selectedFile = file || null;
};

const handleCreateModule = async () => {
  if (!newModule.value.title || newModule.value.section_subject_ids.length === 0) return;

  const payload = { ...newModule.value };
  if (selectedFile) payload.file = selectedFile;

  isSubmitting.value = true;
  try {
    await lmsStore.createModule(payload);
    // Re-fetch to get the new visible_section_ids
    await lmsStore.fetchModules(true);
    showCreateDialog.value = false;
    selectedFile = null;
    $q.notify({ type: 'positive', message: 'Lesson uploaded successfully.' });
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to upload lesson.' });
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};

const saveVisibility = async () => {
  if (!editingModule.value || editSectionIds.value.length === 0) return;
  isSavingVisibility.value = true;
  try {
    await lmsStore.updateModuleSections(editingModule.value.id, editSectionIds.value);
    showVisibilityDialog.value = false;
    $q.notify({ type: 'positive', message: 'Section visibility updated.' });
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to update visibility.' });
    console.error(err);
  } finally {
    isSavingVisibility.value = false;
  }
};

onMounted(async () => {
  if (isTeacherOrAdmin.value && dashboardStore.teacherSections.length === 0) {
    await dashboardStore.fetchTeacherDashboard();
  }
  lmsStore.fetchModules();
});
</script>

<style scoped>
.lesson-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid var(--sms-blue);
}
.lesson-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

/* Section checkbox list */
.section-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 0;
}
.section-checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.section-checkbox-row:hover {
  background: rgba(255,255,255,0.07);
}
.section-checkbox-row.selected {
  background: rgba(66, 135, 245, 0.15);
  border-color: rgba(66, 135, 245, 0.4);
}
.section-checkbox-row input[type="checkbox"] {
  accent-color: var(--sms-blue);
  width: 16px;
  height: 16px;
}
.section-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}
.badge-green {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
</style>
