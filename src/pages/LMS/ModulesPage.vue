<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <q-btn flat no-caps color="primary" icon="arrow_back" label="Back to Courses" to="/lms" class="q-mb-md" style="margin-left: -12px;" />
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">LEARNING MANAGEMENT SYSTEM</p>
        <h1 class="text-display q-my-none">{{ courseName }}</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Browse modules and learning guides for this course.</p>
      </div>
      <!-- Teacher only action -->
      <q-btn
        v-if="authStore.user?.role === 'teacher' || authStore.user?.role === 'admin'"
        color="primary"
        icon="add"
        label="Create Module"
        rounded
        unelevated
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Loading -->
    <div v-if="lmsStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <div v-else class="q-gutter-y-xl">
      <div v-if="filteredModules.length === 0" class="text-center text-muted q-py-xl glass-card">
        No modules have been posted for this course yet.
      </div>
      
      <div class="row q-col-gutter-lg">
        <div v-for="mod in filteredModules" :key="mod.id" class="col-12 col-md-6 col-lg-4">
          <div class="glass-card q-pa-xl announcement-card" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
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
              <p class="text-body text-secondary q-mb-lg" style="font-size: 14px; line-height: 1.5;">
                {{ mod.description || 'No description provided.' }}
              </p>
            </div>

            <q-btn
              color="primary"
              label="Open Module"
              class="full-width"
              rounded
              unelevated
              :to="`/lms/modules/${mod.id}`"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create Module Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card class="glass-q-card" style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">Create New Module</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-8">
              <p class="text-label q-mb-xs">Module Title</p>
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
            <textarea v-model="newModule.description" class="input-glass" rows="2" placeholder="Summary of this module..."></textarea>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Content (HTML Support)</p>
            <textarea v-model="newModule.content" class="input-glass" rows="5" placeholder="<h3>Title</h3><p>Content...</p>"></textarea>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded v-close-popup />
          <q-btn label="Create" color="primary" rounded unelevated @click="handleCreateModule" :loading="isSubmitting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useLmsStore } from '../../stores/LMS/lmsStore';

const route = useRoute();
const authStore = useAuthStore();
const lmsStore = useLmsStore();

const showCreateDialog = ref(false);
const isSubmitting = ref(false);

const currentSectionId = computed(() => Number(route.params.id));

const newModule = ref({
  section_id: currentSectionId.value,
  title: '',
  category: 'Lecture',
  description: '',
  content: '',
});

const filteredModules = computed(() => {
  return lmsStore.modules.filter(m => m.section_id === currentSectionId.value);
});

const courseName = computed(() => {
  if (filteredModules.value.length > 0) {
    const mod = filteredModules.value[0];
    const code = mod.section?.course?.course_code || 'General';
    const title = mod.section?.course?.title || 'Course';
    return `${code} - ${title}`;
  }
  return 'Course Modules';
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const handleCreateModule = async () => {
  if (!newModule.value.title) return;
  newModule.value.section_id = currentSectionId.value; // ensure it's locked
  isSubmitting.value = true;
  try {
    await lmsStore.createModule(newModule.value);
    showCreateDialog.value = false;
    newModule.value = { section_id: currentSectionId.value, title: '', category: 'Lecture', description: '', content: '' };
  } catch (err) {
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  lmsStore.fetchModules();
});
</script>

<style scoped>
.full-width {
  width: 100%;
}
.announcement-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid var(--sms-blue);
}
.announcement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}
</style>
