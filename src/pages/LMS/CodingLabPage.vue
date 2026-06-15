<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">
          {{ assignmentType === 'coding' ? 'INTERACTIVE LAB' : 'WRITTEN ASSIGNMENT' }}
        </p>
        <h1 class="text-display q-my-none">
          {{ assignmentType === 'coding' ? 'Coding Lab' : 'Assignment Submission' }}
        </h1>
        <div class="row items-center q-gutter-sm q-mt-xs">
          <p class="text-body q-my-none" style="color: var(--text-secondary);">
            {{ assignmentType === 'coding' ? 'Solve assignments and write code. Copy-paste is disabled.' : 'Complete your written assignment below. Progress is autosaved.' }}
          </p>
          <span class="text-caption text-weight-bold" :style="{ color: (saveStatus.includes('Offline') || saveStatus.includes('Error')) ? 'var(--color-warning)' : 'var(--color-success)' }">
            • {{ saveStatus }}
          </span>
        </div>
      </div>

      <!-- Submit Action for Assignment -->
      <div v-if="assignmentId" class="row items-center q-gutter-md">
        <span class="badge badge-orange">Task Mode ({{ assignmentType === 'coding' ? 'Coding' : 'Written' }} - Max Score: {{ maxScore }})</span>
        <q-btn
          color="positive"
          icon="publish"
          :label="isReadOnly ? 'Submitted' : (assignmentType === 'coding' ? 'Submit Code' : 'Submit')"
          rounded
          unelevated
          :disable="isReadOnly"
          :loading="isSubmitting"
          @click="handleSubmitCode"
        />
      </div>
    </div>

    <!-- Language Selector Tabs (Coding mode only) -->
    <div v-if="assignmentType === 'coding'" class="row q-gutter-sm q-mb-lg">
      <q-btn
        :flat="activeTab !== 'java'"
        :color="activeTab === 'java' ? 'primary' : 'grey-7'"
        label="Java Compiler"
        icon="code"
        rounded
        @click="activeTab = 'java'"
      />
      <q-btn
        disable
        :flat="activeTab !== 'sql'"
        :color="activeTab === 'sql' ? 'warning' : 'grey-7'"
        label="SQL Playground (Disabled)"
        icon="storage"
        rounded
        @click="activeTab = 'sql'"
      />
      <q-btn
        :flat="activeTab !== 'html'"
        :color="activeTab === 'html' ? 'positive' : 'grey-7'"
        label="HTML/CSS Live"
        icon="web"
        rounded
        @click="activeTab = 'html'"
      />
    </div>

    <!-- Active Editor Render -->
    <div class="q-mt-md">
      <!-- Written Works Layout -->
      <div v-if="assignmentType === 'written'" class="glass-card q-pa-lg">
        <p class="text-label q-mb-xs">WRITTEN RESPONSE ANSWER</p>
        <div class="editor-container">
          <textarea
            v-model="writtenResponse"
            class="code-textarea"
            placeholder="Type your written quiz answers or essay response here..."
            style="height: 400px; font-family: sans-serif; resize: vertical;"
            :readonly="isReadOnly"
            @copy.prevent="preventAction"
            @paste.prevent="preventAction"
            @cut.prevent="preventAction"
          ></textarea>
        </div>
      </div>

      <!-- Coding Playgrounds -->
      <template v-else>
        <div v-show="activeTab === 'java'">
          <JavaEditor ref="javaEditorRef" :initial-code="initialCode" :disabled="isReadOnly" @change="handleEditorChange" />
        </div>
        <div v-show="activeTab === 'sql'">
          <SqlEditor ref="sqlEditorRef" />
        </div>
        <div v-show="activeTab === 'html'">
          <HtmlEditor ref="htmlEditorRef" :initial-code="initialCode" :disabled="isReadOnly" @change="handleEditorChange" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useLmsStore } from '../../stores/LMS/lmsStore';
import { useAuthStore } from '../../stores/auth';
import JavaEditor from '../../components/LMS/Editors/JavaEditor.vue';
import SqlEditor from '../../components/LMS/Editors/SqlEditor.vue';
import HtmlEditor from '../../components/LMS/Editors/HtmlEditor.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const lmsStore = useLmsStore();
const authStore = useAuthStore();

const activeTab = ref('java');
const assignmentId = ref(null);
const maxScore = ref(0);
const isSubmitting = ref(false);
const initialCode = ref('');
const saveStatus = ref('All changes saved');
const writtenResponse = ref('');
const isOnline = ref(navigator.onLine);
const submissionStatus = ref(null);

const isReadOnly = computed(() => {
  // Only lock if THIS assignment has been explicitly submitted or graded
  return submissionStatus.value === 'submitted' || submissionStatus.value === 'graded';
});

// Refs to editor components
const javaEditorRef = ref(null);
const sqlEditorRef = ref(null);
const htmlEditorRef = ref(null);

const preventAction = (e) => {
  $q.notify({
    type: 'negative',
    message: 'Copying/Pasting is disabled for this assignment.',
    position: 'top',
    timeout: 2000
  });
};

const assignment = computed(() => {
  return lmsStore.assignments.find(a => a.id === assignmentId.value);
});

const assignmentType = computed(() => {
  return assignment.value?.type || 'coding';
});

const getActiveCode = () => {
  if (assignmentType.value === 'written') {
    return writtenResponse.value;
  }
  if (activeTab.value === 'java' && javaEditorRef.value) {
    return javaEditorRef.value.code;
  }
  if (activeTab.value === 'sql' && sqlEditorRef.value) {
    return sqlEditorRef.value.query;
  }
  if (activeTab.value === 'html' && htmlEditorRef.value) {
    return htmlEditorRef.value.htmlCode;
  }
  return '';
};

let saveTimeout = null;
const handleEditorChange = (newCode) => {
  if (isReadOnly.value) return;
  if (!assignmentId.value) {
    // Free play: save to local storage only
    saveStatus.value = 'Saving to local draft...';
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem(`sms_lab_freeplay_${activeTab.value}`, newCode);
      saveStatus.value = 'Local draft saved';
    }, 1000);
    return;
  }

  // Task mode: autosave as DRAFT (not submitted)
  if (saveTimeout) clearTimeout(saveTimeout);

  if (!isOnline.value) {
    saveStatus.value = 'Offline - saving changes locally...';
    saveTimeout = setTimeout(() => {
      localStorage.setItem(`sms_pending_sync_${assignmentId.value}`, newCode);
      localStorage.setItem(`sms_assignment_cache_${assignmentId.value}`, newCode);
      saveStatus.value = 'Offline - saved locally';
    }, 1000);
    return;
  }

  saveStatus.value = 'Saving draft...';
  saveTimeout = setTimeout(async () => {
    try {
      // Use saveDraft (status: 'draft') — NOT submitAssignment
      await lmsStore.saveDraft({
        assignment_id: assignmentId.value,
        content: newCode,
      });
      localStorage.removeItem(`sms_pending_sync_${assignmentId.value}`);
      localStorage.setItem(`sms_assignment_cache_${assignmentId.value}`, newCode);
      saveStatus.value = 'All changes saved';
    } catch (err) {
      console.error(err);
      localStorage.setItem(`sms_pending_sync_${assignmentId.value}`, newCode);
      saveStatus.value = 'Offline - saved locally';
    }
  }, 2000);
};

const syncPendingDrafts = async () => {
  if (!assignmentId.value || !isOnline.value) return;
  const pendingCode = localStorage.getItem(`sms_pending_sync_${assignmentId.value}`);
  if (!pendingCode) return;

  saveStatus.value = 'Syncing offline changes...';
  try {
    // Sync as draft — do not auto-submit
    await lmsStore.saveDraft({
      assignment_id: assignmentId.value,
      content: pendingCode,
    });
    localStorage.removeItem(`sms_pending_sync_${assignmentId.value}`);
    saveStatus.value = 'All changes saved';
    $q.notify({
      type: 'positive',
      icon: 'sync',
      message: 'Offline changes synced successfully!',
      position: 'top',
      timeout: 2000,
    });
  } catch (err) {
    console.error('Failed to sync offline changes:', err);
    saveStatus.value = 'Offline - saved locally (sync failed)';
  }
};

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
  if (isOnline.value) {
    syncPendingDrafts();
  } else {
    saveStatus.value = 'Offline - saving changes locally';
  }
};

const handleSubmitCode = async () => {
  if (!assignmentId.value) return;
  const content = getActiveCode();
  if (!content || !content.trim()) {
    $q.notify({ type: 'warning', message: 'Please write some content before submitting.' });
    return;
  }

  isSubmitting.value = true;
  try {
    // Final submit — explicitly status: 'submitted'
    await lmsStore.submitAssignment({
      assignment_id: assignmentId.value,
      content: content,
    });
    localStorage.removeItem(`sms_pending_sync_${assignmentId.value}`);
    submissionStatus.value = 'submitted';
    $q.notify({
      type: 'positive',
      message: assignmentType.value === 'coding' ? 'Code submitted successfully!' : 'Assignment submitted successfully!',
      position: 'top',
    });
    router.push('/assignments');
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || 'Failed to submit.' });
  } finally {
    isSubmitting.value = false;
  }
};

watch(initialCode, (newVal) => {
  if (assignmentType.value === 'written') {
    writtenResponse.value = newVal;
  }
});

watch(writtenResponse, (newVal) => {
  if (assignmentType.value === 'written') {
    handleEditorChange(newVal);
  }
});

onMounted(async () => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  if (route.query.assignment_id) {
    assignmentId.value = parseInt(route.query.assignment_id);
    maxScore.value = route.query.max_score || 100;

    // Fetch assignments list to resolve details (type)
    const studentSecId = authStore.user?.profile?.section_id || 1;
    try {
      await lmsStore.fetchAssignments(studentSecId);
    } catch (err) {
      console.error(err);
    }

    // 1. Check local cache first
    const cachedCode = localStorage.getItem(`sms_assignment_cache_${assignmentId.value}`);
    const pendingCode = localStorage.getItem(`sms_pending_sync_${assignmentId.value}`);
    if (pendingCode) {
      initialCode.value = pendingCode;
      saveStatus.value = isOnline.value ? 'Syncing offline changes...' : 'Offline - saved locally';
      if (isOnline.value) {
        syncPendingDrafts();
      }
    } else if (cachedCode) {
      initialCode.value = cachedCode;
      saveStatus.value = 'Loaded local draft';
    }

    // 2. Fetch from database to ensure sync
    if (isOnline.value) {
      try {
        await lmsStore.fetchStudentSubmissions();
        // Only check the submission for THIS specific assignment
        const existing = lmsStore.submissions.find(s => s.assignment_id === assignmentId.value);
        if (existing) {
          // Only set status if it's an actual finalized state, not a draft
          submissionStatus.value = existing.status; // 'draft', 'submitted', or 'graded'
          if (!pendingCode) {
            initialCode.value = existing.content || '';
            localStorage.setItem(`sms_assignment_cache_${assignmentId.value}`, existing.content || '');
            saveStatus.value = existing.status === 'draft' ? 'All changes saved' : 'Submitted';
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  } else {
    // Check free play local draft
    const draft = localStorage.getItem(`sms_lab_freeplay_${activeTab.value}`);
    if (draft) {
      initialCode.value = draft;
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});
</script>

<style scoped>
.editor-container {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #1e1e1e;
  overflow: hidden;
}

.code-textarea {
  width: 100%;
  font-size: 14px;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  padding: 16px;
  outline: none;
  line-height: 1.5;
}
</style>
