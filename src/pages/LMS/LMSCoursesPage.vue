<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-md">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">LEARNING MANAGEMENT SYSTEM</p>
        <h1 class="text-display q-my-none">My Subjects &amp; Sections</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Manage your master lessons and section-specific modules.</p>
      </div>
    </div>

    <q-tabs
      v-if="authStore.user?.role === 'teacher' || authStore.user?.role === 'admin'"
      v-model="activeTab"
      dense
      class="text-grey q-mb-xl"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="subjects" label="Subject Master Resources" />
      <q-tab name="sections" label="My Sections" />
    </q-tabs>

    <!-- Loading -->
    <div v-if="isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <q-tab-panels v-else v-model="activeTab" animated style="background: transparent;">

      <!-- ===================== SUBJECT MASTER RESOURCES TAB ===================== -->
      <q-tab-panel name="subjects" class="q-pa-none">
        <div v-if="!uniqueCourses.length" class="text-center text-muted q-py-xl glass-card">
          No subjects found.
        </div>

        <!-- One block per subject -->
        <div v-for="course in uniqueCourses" :key="course.id" class="q-mb-xl">
          <!-- Subject Header -->
          <div class="glass-card q-pa-lg q-mb-md subject-header-card">
            <div class="row items-center justify-between">
              <div class="row items-center q-gutter-md">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(0,122,255,0.15); display: flex; align-items: center; justify-content: center;">
                  <q-icon name="folder_special" color="primary" size="24px" />
                </div>
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">{{ course.code }}</div>
                  <div style="font-size: 13px; color: var(--text-secondary);">{{ course.title }}</div>
                </div>
              </div>
              <div class="row items-center q-gutter-sm">
                <q-chip dense color="blue-1" text-color="primary" icon="inventory" :label="`${getLessons(course.id).length} lessons`" />
                <q-btn
                  color="primary"
                  icon="add"
                  label="Add Lesson"
                  rounded
                  unelevated
                  size="sm"
                  @click="openCreateDialog(course)"
                />
              </div>
            </div>
          </div>

          <!-- Lessons List -->
          <div v-if="getLessons(course.id).length === 0" class="text-center text-muted q-py-lg q-mb-md" style="background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px dashed rgba(0,0,0,0.1);">
            No lessons yet. Click "Add Lesson" to create one.
          </div>

          <div v-else class="row q-col-gutter-md">
            <div v-for="mod in getLessons(course.id)" :key="mod.id" class="col-12 col-md-6 col-lg-4">
              <div class="glass-card lesson-card q-pa-lg" style="height: 100%; display: flex; flex-direction: column;">
                <!-- Top bar -->
                <div class="row justify-between items-start q-mb-sm">
                  <span class="badge badge-blue">
                    <q-icon name="category" size="11px" class="q-mr-xs"/>
                    {{ mod.category || 'Lecture' }}
                  </span>
                  <span class="text-caption text-muted">{{ formatDate(mod.created_at) }}</span>
                </div>

                <!-- Title -->
                <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">{{ mod.title }}</div>
                <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; flex: 1; margin-bottom: 12px;">
                  {{ mod.description || 'No description.' }}
                </div>

                <!-- Deployment status chips -->
                <div class="q-mb-md">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); margin-bottom: 6px;">
                    Posted to:
                  </div>
                  <div v-if="!mod.deployed_to || mod.deployed_to.length === 0">
                    <q-chip dense outline color="grey" icon="warning" label="Not posted yet" size="sm" />
                  </div>
                  <div v-else class="row q-gutter-xs">
                    <q-chip
                      v-for="dep in mod.deployed_to"
                      :key="dep.section_subject_id"
                      dense
                      color="positive"
                      text-color="white"
                      icon="check_circle"
                      :label="dep.section_name"
                      size="sm"
                    />
                  </div>
                </div>

                <!-- Actions -->
                <div class="row q-gutter-sm">
                  <q-btn
                    flat
                    dense
                    rounded
                    color="primary"
                    icon="open_in_new"
                    label="View"
                    size="sm"
                    :to="`/lms/master-modules/${mod.id}`"
                    class="col"
                  />
                  <q-btn
                    unelevated
                    dense
                    rounded
                    color="primary"
                    icon="send"
                    label="Post to Section"
                    size="sm"
                    @click="openPostDialog(mod, course)"
                    class="col"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- ===================== MY SECTIONS TAB ===================== -->
      <q-tab-panel name="sections" class="q-pa-none">
        <div v-if="!uniqueSections.length" class="col-12 text-center text-muted q-py-xl glass-card">
          You are not enrolled in or assigned to any sections.
        </div>
        
        <div class="row q-col-gutter-lg">
          <div v-for="section in uniqueSections" :key="section.id" class="col-12 col-md-6 col-lg-4">
            <div class="glass-card q-pa-xl course-card cursor-pointer" @click="goToSectionSubjects(section.id)">
              <div class="row items-center q-mb-md q-gutter-sm">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(0,122,255,0.1); display: flex; align-items: center; justify-content: center;">
                  <q-icon name="groups" color="primary" size="24px" />
                </div>
              </div>
              <h3 class="q-mt-none q-mb-xs" style="font-size: 20px; font-weight: 700; color: var(--text-primary);">
                {{ section.name }}
              </h3>
              <div class="row justify-between items-center q-mt-md">
                <span class="text-caption text-secondary" style="font-weight: 500;">View Subjects</span>
                <q-icon name="arrow_forward" color="primary" size="20px" />
              </div>
            </div>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <!-- ===================== CREATE LESSON DIALOG ===================== -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card class="glass-q-card" style="width: 560px; max-width: 95vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">Add Lesson — {{ selectedCourse?.code }}</div>
          <p class="text-caption text-muted">This lesson will be saved as a Master Lesson for this subject.</p>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-8">
              <p class="text-label q-mb-xs">Lesson Title</p>
              <input v-model="newLesson.title" class="input-glass" type="text" placeholder="e.g. Module 1: Java Classes"/>
            </div>
            <div class="col-4">
              <p class="text-label q-mb-xs">Category</p>
              <select v-model="newLesson.category" class="input-glass">
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Handout">Handout</option>
                <option value="Syllabus">Syllabus</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div class="q-mb-sm">
            <p class="text-label q-mb-xs">Description</p>
            <textarea v-model="newLesson.description" class="input-glass" rows="2" placeholder="Brief summary..."></textarea>
          </div>
          <div class="q-mb-sm">
            <p class="text-label q-mb-xs">Content (HTML supported)</p>
            <textarea v-model="newLesson.content" class="input-glass" rows="4" placeholder="<h3>Title</h3><p>Content...</p>"></textarea>
          </div>
          <div>
            <p class="text-label q-mb-xs">Attach File (PDF, PPT, Word, Image)</p>
            <input type="file" @change="handleFileUpload" class="input-glass q-pa-sm" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif" />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded v-close-popup @click="showCreateDialog = false" />
          <q-btn label="Save Lesson" color="primary" rounded unelevated @click="handleCreateLesson" :loading="isSubmitting" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ===================== POST TO SECTION DIALOG ===================== -->
    <q-dialog v-model="showPostDialog" persistent>
      <q-card class="glass-q-card" style="width: 480px; max-width: 95vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">Post Lesson to Section</div>
          <p class="text-caption text-muted">
            Lesson: <strong>{{ selectedLesson?.title }}</strong>
          </p>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p class="text-label q-mb-xs">Select Sections ({{ selectedCourse?.title }})</p>
          <q-select
            v-model="selectedSectionIds"
            :options="sectionsForCourse"
            option-value="id"
            :option-label="opt => opt.section?.name || opt.name || 'Section'"
            multiple
            use-chips
            filled
            dense
            label="Choose sections to post to"
            emit-value
            map-options
          />
          <div v-if="selectedLesson?.deployed_to?.length" class="q-mt-md">
            <p class="text-caption text-muted q-mb-xs">Already posted to:</p>
            <div class="row q-gutter-xs">
              <q-chip
                v-for="dep in selectedLesson.deployed_to"
                :key="dep.section_subject_id"
                dense color="positive" text-color="white" icon="check" :label="dep.section_name" size="sm"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded @click="showPostDialog = false" />
          <q-btn label="Post Lesson" color="primary" rounded unelevated @click="handlePost" :loading="isPosting" :disable="!selectedSectionIds.length" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../../stores/auth';
import { useDashboardStore } from '../../stores/dashboardStore';
import { useLmsStore } from '../../stores/LMS/lmsStore';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();
const lmsStore = useLmsStore();

const activeTab = ref(authStore.userRole === 'teacher' || authStore.userRole === 'admin' ? 'subjects' : 'sections');

// Per-subject master lessons cache: { [courseId]: [...modules] }
const masterLessonsMap = ref({});
const isLoading = ref(false);

// ---- Unique Courses (subjects taught by teacher) ----
const uniqueCourses = computed(() => {
  const coursesMap = new Map();
  const src = authStore.userRole === 'teacher' ? dashboardStore.teacherSections : dashboardStore.sections;
  (src || []).forEach(sec => {
    if (sec.course && !coursesMap.has(sec.course.id)) {
      coursesMap.set(sec.course.id, {
        id: sec.course.id,
        code: sec.course.course_code,
        title: sec.course.title,
      });
    }
  });
  return Array.from(coursesMap.values());
});

// ---- Unique Sections ----
const uniqueSections = computed(() => {
  const map = new Map();
  if (authStore.user?.role === 'student') {
    const data = dashboardStore.studentData?.sections || [];
    data.forEach(sec => {
      const sectionId = sec.section_id || sec.name;
      if (!map.has(sectionId)) map.set(sectionId, { id: sectionId, name: sec.section_name || sec.name || 'General' });
    });
  } else {
    const src = authStore.user?.role === 'teacher' ? dashboardStore.teacherSections : dashboardStore.sections;
    (src || []).forEach(sec => {
      const sectionId = sec.section_id || sec.section?.id;
      if (sectionId && !map.has(sectionId)) map.set(sectionId, { id: sectionId, name: sec.section?.name || 'General' });
    });
  }
  return Array.from(map.values());
});

// ---- Helper: get lessons for a given course ----
const getLessons = (courseId) => masterLessonsMap.value[courseId] || [];

// ---- Helper: get section_subject rows for a given course ----
const sectionsForCourse = computed(() => {
  if (!selectedCourse.value) return [];
  const src = authStore.userRole === 'teacher' ? dashboardStore.teacherSections : dashboardStore.sections;
  return (src || []).filter(s => s.course?.id === selectedCourse.value.id);
});

// ---- Fetch all master lessons for each unique course on mount ----
const fetchAllMasterLessons = async () => {
  isLoading.value = true;
  const courses = uniqueCourses.value;
  await Promise.all(courses.map(async (course) => {
    try {
      const res = await lmsStore.fetchMasterModulesRaw(course.id);
      masterLessonsMap.value = { ...masterLessonsMap.value, [course.id]: res };
    } catch (e) { /* skip */ }
  }));
  isLoading.value = false;
};

// ---- Create Lesson ----
const showCreateDialog = ref(false);
const selectedCourse = ref(null);
const isSubmitting = ref(false);
let selectedFile = null;
const newLesson = ref({ title: '', category: 'Lecture', description: '', content: '' });

const openCreateDialog = (course) => {
  selectedCourse.value = course;
  newLesson.value = { title: '', category: 'Lecture', description: '', content: '' };
  selectedFile = null;
  showCreateDialog.value = true;
};

const handleFileUpload = (event) => {
  selectedFile = event.target.files[0] || null;
};

const handleCreateLesson = async () => {
  if (!newLesson.value.title || !selectedCourse.value) return;
  isSubmitting.value = true;
  try {
    const payload = { ...newLesson.value, course_id: selectedCourse.value.id };
    if (selectedFile) payload.file = selectedFile;
    await lmsStore.createModule(payload);
    showCreateDialog.value = false;
    $q.notify({ color: 'positive', message: 'Lesson created!', icon: 'check_circle' });
    // Refresh lessons for this course
    const res = await lmsStore.fetchMasterModulesRaw(selectedCourse.value.id);
    masterLessonsMap.value = { ...masterLessonsMap.value, [selectedCourse.value.id]: res };
  } catch (e) {
    $q.notify({ color: 'negative', message: 'Failed to create lesson.', icon: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

// ---- Post to Section ----
const showPostDialog = ref(false);
const selectedLesson = ref(null);
const selectedSectionIds = ref([]);
const isPosting = ref(false);

const openPostDialog = (mod, course) => {
  selectedLesson.value = mod;
  selectedCourse.value = course;
  selectedSectionIds.value = [];
  showPostDialog.value = true;
};

const handlePost = async () => {
  if (!selectedSectionIds.value.length || !selectedLesson.value) return;
  isPosting.value = true;
  try {
    await lmsStore.duplicateModule(selectedLesson.value.id, selectedSectionIds.value);
    $q.notify({ color: 'positive', message: 'Lesson posted to sections!', icon: 'check_circle' });
    showPostDialog.value = false;
    // Refresh to update deployment status chips
    const res = await lmsStore.fetchMasterModulesRaw(selectedCourse.value.id);
    masterLessonsMap.value = { ...masterLessonsMap.value, [selectedCourse.value.id]: res };
  } catch (e) {
    $q.notify({ color: 'negative', message: e.message || 'Failed to post lesson.', icon: 'error' });
  } finally {
    isPosting.value = false;
  }
};

// ---- Navigation ----
const goToSectionSubjects = (sectionId) => router.push(`/lms/section/${sectionId}/subjects`);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

onMounted(async () => {
  isLoading.value = true;
  if (authStore.user?.role === 'student') {
    await dashboardStore.fetchStudentDashboard();
  } else if (authStore.user?.role === 'teacher') {
    await dashboardStore.fetchTeacherDashboard();
  } else {
    await dashboardStore.fetchSections();
  }
  if (activeTab.value === 'subjects') {
    await fetchAllMasterLessons();
  }
  isLoading.value = false;
});
</script>

<style scoped>
.subject-header-card {
  border-left: 4px solid var(--sms-blue);
}
.course-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-bottom: 4px solid var(--sms-blue);
  height: 100%;
}
.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}
.lesson-card {
  border-left: 3px solid var(--sms-blue);
  transition: transform 0.2s, box-shadow 0.2s;
}
.lesson-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.07);
}
</style>
