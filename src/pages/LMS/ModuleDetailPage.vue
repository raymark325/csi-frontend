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
          <span class="text-caption text-muted">Created: {{ formatDate(lmsStore.activeModule.created_at) }}</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useLmsStore } from '../../stores/LMS/lmsStore';
import html2pdf from 'html2pdf.js';

const route = useRoute();
const lmsStore = useLmsStore();
const isDownloadingPdf = ref(false);
const lessonIframe = ref(null);

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
