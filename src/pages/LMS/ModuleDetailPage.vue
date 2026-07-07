<template>
  <div class="q-pa-lg">
    <!-- Loading -->
    <div v-if="lmsStore.isLoading || !lmsStore.activeModule" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <div v-else style="max-width: 900px; margin: 0 auto;">
      <!-- Breadcrumb / Back Button -->
      <q-btn flat no-caps color="primary" icon="arrow_back" label="Back to Modules" to="/lms" class="q-mb-lg" />

      <!-- Module Card -->
      <div class="glass-card q-pa-xl">
          <div class="row justify-between items-center q-mb-md">
            <div class="q-gutter-sm">
              <span class="badge badge-blue">
                <q-icon name="category" size="12px" class="q-mr-xs"/>
                {{ lmsStore.activeModule.category || 'Lecture' }}
              </span>
              <span class="badge" style="background: rgba(0,0,0,0.05); color: var(--text-secondary);">
                <q-icon name="meeting_room" size="12px" class="q-mr-xs"/>
                {{ lmsStore.activeModule.section?.room || 'TBA' }}
              </span>
            </div>
            
            <div class="row items-center q-gutter-sm">
              <span class="text-caption text-muted gt-xs">Created: {{ formatDate(lmsStore.activeModule.created_at) }}</span>
              <!-- Post to another section button -->
              <q-btn
                v-if="authStore.userRole === 'teacher' || authStore.userRole === 'admin'"
                outline
                rounded
                color="primary"
                icon="content_copy"
                label="Post to another Section"
                size="sm"
                @click="openDuplicateDialog"
              />
            </div>
          </div>

        <h1 class="text-headline q-mt-none q-mb-sm">{{ lmsStore.activeModule.title }}</h1>
        <p class="text-body text-secondary q-mb-xl" style="font-size: 16px;">
          {{ lmsStore.activeModule.description }}
        </p>

        <hr class="section-divider" />

        <!-- Attachment Section -->
        <div v-if="lmsStore.activeModule.file_path" class="q-mb-xl p-md" style="background: rgba(0, 122, 255, 0.05); border-radius: 8px; padding: 16px; border: 1px solid rgba(0, 122, 255, 0.1);">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <q-icon name="attach_file" size="24px" color="primary" />
              <div>
                <p class="text-body text-weight-bold q-my-none" style="color: var(--text-primary);">Attached File</p>
                <p class="text-caption q-my-none text-muted">{{ lmsStore.activeModule.file_name || 'Download Attachment' }}</p>
              </div>
            </div>
            <q-btn
              color="primary"
              label="Download / View"
              icon="file_download"
              rounded
              outline
              type="a"
              target="_blank"
              :href="`http://localhost:8000/storage/${lmsStore.activeModule.file_path}`"
            />
          </div>
        </div>

        <div class="row items-center justify-between q-mb-md">
          <h2 class="text-h5 q-my-none text-primary">Lesson Content</h2>
          <q-btn
            color="secondary"
            label="Download PDF"
            icon="picture_as_pdf"
            rounded
            outline
            :loading="isDownloadingPdf"
            @click="downloadPDF"
          />
        </div>
        <!-- HTML Content body -->
        <iframe 
          v-if="lmsStore.activeModule?.content"
          ref="lessonIframe"
          id="lesson-content-iframe"
          class="module-iframe" 
          :srcdoc="lmsStore.activeModule.content"
          @load="adjustIframeHeight"
          sandbox="allow-same-origin allow-scripts allow-popups"
        ></iframe>
      </div>
    </div>

    <!-- Duplicate Module Dialog -->
    <q-dialog v-model="showDuplicateDialog" persistent>
      <q-card class="glass-q-card" style="width: 500px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">Post to Another Section</div>
          <p class="text-caption text-muted">Select the section to post this lecture to.</p>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p class="text-label q-mb-xs">Target Section</p>
          <select v-model="selectedSectionId" class="input-glass">
            <option value="" disabled>Select a section...</option>
            <option v-for="sec in availableSections" :key="sec.id" :value="sec.id">
              {{ sec.section?.name || sec.name }} - {{ sec.course?.title || sec.course_code || 'Subject' }}
            </option>
          </select>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded v-close-popup />
          <q-btn label="Post Lecture" color="primary" rounded unelevated @click="handleDuplicate" :loading="isDuplicating" :disable="!selectedSectionId" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useLmsStore } from '../../stores/LMS/lmsStore';
import { useAuthStore } from '../../stores/auth';
import { useDashboardStore } from '../../stores/dashboardStore';
import html2pdf from 'html2pdf.js';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const lmsStore = useLmsStore();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const isDownloadingPdf = ref(false);
const lessonIframe = ref(null);

// Duplicate Logic
const showDuplicateDialog = ref(false);
const isDuplicating = ref(false);
const selectedSectionId = ref('');

const availableSections = computed(() => {
  if (authStore.userRole === 'teacher') {
    return dashboardStore.teacherSections.filter(
      s => s.id !== lmsStore.activeModule?.section_subject_id
    );
  } else if (authStore.userRole === 'admin') {
    return dashboardStore.sections.filter(
      s => s.id !== lmsStore.activeModule?.section_subject_id
    );
  }
  return [];
});

const openDuplicateDialog = async () => {
  selectedSectionId.value = '';
  if (authStore.userRole === 'teacher' && dashboardStore.teacherSections.length === 0) {
    await dashboardStore.fetchTeacherDashboard();
  } else if (authStore.userRole === 'admin' && dashboardStore.sections.length === 0) {
    await dashboardStore.fetchSections();
  }
  showDuplicateDialog.value = true;
};

const handleDuplicate = async () => {
  if (!selectedSectionId.value) return;
  isDuplicating.value = true;
  try {
    const newMod = await lmsStore.duplicateModule(lmsStore.activeModule.id, selectedSectionId.value);
    $q.notify({
      color: 'positive',
      message: 'Lecture posted to the section successfully!',
      icon: 'check_circle'
    });
    showDuplicateDialog.value = false;
    // Optional: Ask user if they want to go to the new module, or just stay
  } catch (err) {
    $q.notify({
      color: 'negative',
      message: err.message || 'Failed to post lecture',
      icon: 'error'
    });
  } finally {
    isDuplicating.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const adjustIframeHeight = () => {
  if (lessonIframe.value && lessonIframe.value.contentWindow) {
    try {
      const doc = lessonIframe.value.contentWindow.document;
      
      // Inject default font and padding if the content isn't a full HTML document
      if (!lmsStore.activeModule.content.toLowerCase().includes('<html')) {
        doc.body.style.fontFamily = 'Roboto, Arial, sans-serif';
        doc.body.style.padding = '20px';
        doc.body.style.margin = '0';
        doc.body.style.color = '#333';
        doc.body.style.lineHeight = '1.7';
      }

      const setHeight = () => {
        // Add a small buffer to avoid double scrollbars
        lessonIframe.value.style.height = (doc.documentElement.scrollHeight + 30) + 'px';
      };

      // Set initial height
      setTimeout(setHeight, 100);

      // Auto resize if content changes (e.g. images load)
      const observer = new ResizeObserver(setHeight);
      observer.observe(doc.body);
      
    } catch (e) {
      console.warn('Iframe auto-resize failed (possibly due to CORS or sandbox):', e);
    }
  }
};

const downloadPDF = () => {
  isDownloadingPdf.value = true;
  let element = document.getElementById('lesson-content');
  
  if (lessonIframe.value && lessonIframe.value.contentWindow) {
    element = lessonIframe.value.contentWindow.document.body;
  }

  if (!element) {
    isDownloadingPdf.value = false;
    return;
  }

  const opt = {
    margin:       [0.5, 0.5, 0.5, 0.5],
    filename:     `${lmsStore.activeModule.title || 'lesson'}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    isDownloadingPdf.value = false;
  }).catch((err) => {
    console.error('PDF generation error', err);
    isDownloadingPdf.value = false;
  });
};

onMounted(() => {
  lmsStore.fetchModuleDetail(route.params.id);
});
</script>

<style scoped>
.module-iframe {
  width: 100%;
  border: none;
  min-height: 400px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.module-rich-content :deep(h2), .module-rich-content :deep(h3) {
  color: var(--text-primary);
  font-weight: 700;
  margin-top: 24px;
  margin-bottom: 12px;
}

.module-rich-content :deep(p) {
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.module-rich-content :deep(ul), .module-rich-content :deep(ol) {
  padding-left: 20px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.module-rich-content :deep(li) {
  margin-bottom: 8px;
}
</style>
