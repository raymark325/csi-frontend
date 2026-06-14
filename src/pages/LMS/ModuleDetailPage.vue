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

        <!-- HTML Content body -->
        <div class="module-rich-content text-body" v-html="lmsStore.activeModule.content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useLmsStore } from '../../stores/LMS/lmsStore';

const route = useRoute();
const lmsStore = useLmsStore();

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

onMounted(() => {
  lmsStore.fetchModuleDetail(route.params.id);
});
</script>

<style scoped>
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
