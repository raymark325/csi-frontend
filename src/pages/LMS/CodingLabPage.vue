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
        :flat="activeTab !== 'sql'"
        :color="activeTab === 'sql' ? 'warning' : 'grey-7'"
        label="SQL Playground"
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
          <div class="row q-gutter-sm q-mb-md items-center">
            <q-btn
              v-for="(f, idx) in javaFiles"
              :key="'java-'+idx"
              :flat="activeJavaFileIndex !== idx"
              :color="activeJavaFileIndex === idx ? 'primary' : 'grey-7'"
              :label="f.name"
              size="sm"
              rounded
              @click="activeJavaFileIndex = idx"
            />
            <q-btn flat round size="sm" icon="add" color="primary" @click="addJavaFile" :disable="isReadOnly"/>
          </div>
          <JavaEditor 
            ref="javaEditorRef" 
            :initial-code="javaFiles[activeJavaFileIndex]?.code || ''" 
            :all-files="javaFiles"
            :disabled="isReadOnly" 
            @change="handleJavaChange" 
          />
        </div>
        <div v-show="activeTab === 'sql'">
          <div class="row q-gutter-sm q-mb-md items-center">
            <q-btn
              v-for="(f, idx) in sqlFiles"
              :key="'sql-'+idx"
              :flat="activeSqlFileIndex !== idx"
              :color="activeSqlFileIndex === idx ? 'warning' : 'grey-7'"
              :label="f.name"
              size="sm"
              rounded
              @click="changeActiveSqlFile(idx)"
            />
            <q-btn flat round size="sm" icon="add" color="warning" @click="addSqlFile" :disable="isReadOnly"/>
          </div>
          <SqlEditor 
            ref="sqlEditorRef" 
            :initial-code="sqlFiles[activeSqlFileIndex]?.code || ''"
            :initial-db-buffer="sqlFiles[activeSqlFileIndex]?.buffer || null"
            :disabled="isReadOnly"
            @change="handleSqlChange"
          />
        </div>
        <div v-show="activeTab === 'html'">
          <div class="row q-gutter-sm q-mb-md items-center">
            <q-btn
              v-for="(f, idx) in htmlFiles"
              :key="'html-'+idx"
              :flat="activeHtmlFileIndex !== idx"
              :color="activeHtmlFileIndex === idx ? 'positive' : 'grey-7'"
              :label="f.name"
              size="sm"
              rounded
              @click="activeHtmlFileIndex = idx"
            />
            <q-btn flat round size="sm" icon="add" color="positive" @click="addHtmlFile" :disable="isReadOnly"/>
          </div>
          <HtmlEditor 
            ref="htmlEditorRef" 
            :initial-code="htmlFiles[activeHtmlFileIndex]?.code || ''" 
            :all-files="htmlFiles"
            :active-file-name="htmlFiles[activeHtmlFileIndex]?.name || ''"
            :disabled="isReadOnly" 
            @change="handleHtmlChange" 
          />
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
import lmsService from '../../services/LMS/lmsService';
import { bufferToBase64, base64ToBuffer } from '../../utils/base64';
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

// Isolated initial code states to prevent tab contamination
const javaFiles = ref([{ name: 'Main.java', code: '' }]);
const htmlFiles = ref([{ name: 'index.html', code: '' }]);
const activeJavaFileIndex = ref(0);
const activeHtmlFileIndex = ref(0);

const sqlFiles = ref([{ name: 'main.db', code: '', buffer: null }]);
const activeSqlFileIndex = ref(0);

const saveStatus = ref('All changes saved');
const writtenResponse = ref('');
const isOnline = ref(navigator.onLine);
const submissionStatus = ref(null);

const isReadOnly = computed(() => {
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
  if (activeTab.value === 'java') {
    return JSON.stringify(javaFiles.value);
  }
  if (activeTab.value === 'sql') {
    return JSON.stringify(sqlFiles.value.map(f => ({ name: f.name, code: f.code })));
  }
  if (activeTab.value === 'html') {
    return JSON.stringify(htmlFiles.value);
  }
  return '';
};

// Check if content structure looks like HTML or Java
const isHtml = (content) => {
  if (!content) return false;
  const lower = content.toLowerCase();
  return lower.includes('<html') || lower.includes('<!doctype') || lower.includes('<body>') || lower.includes('<h1>');
};

const isJava = (content) => {
  if (!content) return false;
  return content.includes('class ') || content.includes('System.out') || content.includes('public static void main');
};

const getStorageKey = (baseKey) => {
  const userId = authStore.user?.id || 'guest';
  return `${baseKey}_user_${userId}`;
};

const getAssignmentLanguage = (codeVal) => {
  const title = assignment.value?.title || '';
  const desc = assignment.value?.description || '';
  if (
    title.toLowerCase().includes('html') ||
    title.toLowerCase().includes('css') ||
    desc.toLowerCase().includes('html') ||
    desc.toLowerCase().includes('css')
  ) {
    return 'html';
  }
  if (
    title.toLowerCase().includes('sql') ||
    desc.toLowerCase().includes('sql') ||
    desc.toLowerCase().includes('database')
  ) {
    return 'sql';
  }
  if (codeVal && isHtml(codeVal)) {
    return 'html';
  }
  return 'java';
};

// Save handlers
let saveTimeout = null;

const addJavaFile = () => {
  const name = prompt('Enter new Java file name (e.g. Helper.java)');
  if (name) {
    javaFiles.value.push({ name: name.endsWith('.java') ? name : name + '.java', code: '' });
    activeJavaFileIndex.value = javaFiles.value.length - 1;
    saveCode(JSON.stringify(javaFiles.value), 'java');
  }
};

const addHtmlFile = () => {
  const name = prompt('Enter new file name (e.g. style.css, script.js, about.html)');
  if (name) {
    htmlFiles.value.push({ name, code: '' });
    activeHtmlFileIndex.value = htmlFiles.value.length - 1;
    saveCode(JSON.stringify(htmlFiles.value), 'html');
  }
};

const addSqlFile = () => {
  const name = prompt('Enter new database file name (e.g. employees.db, inventory.sqlite)');
  if (name) {
    if (sqlEditorRef.value) {
      const dbBuffer = sqlEditorRef.value.exportDatabase();
      if (dbBuffer) {
        sqlFiles.value[activeSqlFileIndex.value].buffer = dbBuffer;
      }
    }
    sqlFiles.value.push({ name: name.endsWith('.db') || name.endsWith('.sqlite') ? name : name + '.db', code: '', buffer: null });
    activeSqlFileIndex.value = sqlFiles.value.length - 1;
    saveCode(JSON.stringify(sqlFiles.value.map(f => ({ name: f.name, code: f.code }))), 'sql');
  }
};

const changeActiveSqlFile = (idx) => {
  if (sqlEditorRef.value) {
    const dbBuffer = sqlEditorRef.value.exportDatabase();
    if (dbBuffer) {
      sqlFiles.value[activeSqlFileIndex.value].buffer = dbBuffer;
    }
  }
  activeSqlFileIndex.value = idx;
};

const handleJavaChange = (newCode) => {
  if (activeTab.value !== 'java') return;
  const currentFile = javaFiles.value[activeJavaFileIndex.value];
  if (currentFile && currentFile.code !== newCode) {
    currentFile.code = newCode;
    saveCode(JSON.stringify(javaFiles.value), 'java');
  }
};

const handleHtmlChange = (newCode) => {
  if (activeTab.value !== 'html') return;
  const currentFile = htmlFiles.value[activeHtmlFileIndex.value];
  if (currentFile && currentFile.code !== newCode) {
    currentFile.code = newCode;
    saveCode(JSON.stringify(htmlFiles.value), 'html');
  }
};

const handleSqlChange = (newCode) => {
  if (activeTab.value !== 'sql') return;
  const currentFile = sqlFiles.value[activeSqlFileIndex.value];
  if (currentFile && currentFile.code !== newCode) {
    currentFile.code = newCode;
    saveCode(JSON.stringify(sqlFiles.value.map(f => ({ name: f.name, code: f.code }))), 'sql');
  }
};

const getSubmissionPayload = (content) => {
  const payload = {
    assignment_id: assignmentId.value,
    content: content,
  };
  if (activeTab.value === 'sql' && sqlEditorRef.value) {
    // Export active buffer before saving
    const dbBuffer = sqlEditorRef.value.exportDatabase();
    if (dbBuffer) {
      sqlFiles.value[activeSqlFileIndex.value].buffer = dbBuffer;
    }
    
    // Package all databases into JSON array
    const packagedDbs = sqlFiles.value.map(f => ({
      name: f.name,
      code: f.code,
      bufferBase64: f.buffer ? bufferToBase64(f.buffer) : null
    }));
    
    payload.db_file = new Blob([JSON.stringify(packagedDbs)], { type: 'application/json' });
  }
  return payload;
};

const saveCode = (newCode, lang) => {
  if (isReadOnly.value) return;
  if (!assignmentId.value) {
    // Free play: save to local storage only
    saveStatus.value = 'Saving to local draft...';
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem(getStorageKey(`sms_lab_freeplay_${lang}`), newCode);
      saveStatus.value = 'Local draft saved';
    }, 1000);
    return;
  }

  // Task mode: autosave as DRAFT
  if (saveTimeout) clearTimeout(saveTimeout);

  if (!isOnline.value) {
    saveStatus.value = 'Offline - saving changes locally...';
    saveTimeout = setTimeout(() => {
      localStorage.setItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`), newCode);
      localStorage.setItem(getStorageKey(`sms_assignment_cache_${assignmentId.value}`), newCode);
      saveStatus.value = 'Offline - saved locally';
    }, 1000);
    return;
  }

  saveStatus.value = 'Saving draft...';
  saveTimeout = setTimeout(async () => {
    try {
      await lmsStore.saveDraft(getSubmissionPayload(newCode));
      localStorage.removeItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`));
      localStorage.setItem(getStorageKey(`sms_assignment_cache_${assignmentId.value}`), newCode);
      saveStatus.value = 'All changes saved';
    } catch (err) {
      console.error(err);
      localStorage.setItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`), newCode);
      saveStatus.value = 'Offline - saved locally';
    }
  }, 2000);
};

const syncPendingDrafts = async () => {
  if (!assignmentId.value || !isOnline.value) return;
  const pendingCode = localStorage.getItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`));
  if (!pendingCode) return;

  saveStatus.value = 'Syncing offline changes...';
  try {
    await lmsStore.saveDraft(getSubmissionPayload(pendingCode));
    localStorage.removeItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`));
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
    await lmsStore.submitAssignment(getSubmissionPayload(content));
    localStorage.removeItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`));
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

// Sync written changes if needed
watch(writtenResponse, (newVal) => {
  if (assignmentType.value === 'written') {
    saveCode(newVal, 'written');
  }
});

// Watch active tab in free play mode to load drafts correctly
watch(activeTab, (newTab) => {
  if (!assignmentId.value) {
    const draft = localStorage.getItem(getStorageKey(`sms_lab_freeplay_${newTab}`));
    if (draft) {
      if (newTab === 'html') {
        try { htmlFiles.value = JSON.parse(draft); } catch { htmlFiles.value = [{ name: 'index.html', code: draft }]; }
        activeHtmlFileIndex.value = 0;
      } else if (newTab === 'java') {
        try { javaFiles.value = JSON.parse(draft); } catch { javaFiles.value = [{ name: 'Main.java', code: draft }]; }
        activeJavaFileIndex.value = 0;
      }
    }
    // Save active tab preference
    localStorage.setItem(getStorageKey('sms_lab_active_tab'), newTab);
  }
});

const resetState = () => {
  assignmentId.value = null;
  maxScore.value = 0;
  javaFiles.value = [{ name: 'Main.java', code: '' }];
  htmlFiles.value = [{ name: 'index.html', code: '' }];
  sqlFiles.value = [{ name: 'main.db', code: '', buffer: null }];
  activeJavaFileIndex.value = 0;
  activeHtmlFileIndex.value = 0;
  activeSqlFileIndex.value = 0;
  writtenResponse.value = '';
  submissionStatus.value = null;
  saveStatus.value = 'All changes saved';
  activeTab.value = 'java';
};

const loadDraftsForCurrentUser = async () => {
  if (route.query.assignment_id) {
    assignmentId.value = parseInt(route.query.assignment_id);
    maxScore.value = route.query.max_score || 100;

    const studentSecId = authStore.user?.profile?.section_id || 1;
    try {
      await lmsStore.fetchAssignments(studentSecId);
    } catch (err) {
      console.error(err);
    }

    const setCodeByLanguage = (codeVal) => {
      const lang = getAssignmentLanguage(codeVal);
      if (lang === 'html') {
        try {
          const parsed = JSON.parse(codeVal);
          if (Array.isArray(parsed)) htmlFiles.value = parsed;
          else throw new Error();
        } catch {
          htmlFiles.value = [{ name: 'index.html', code: codeVal || '' }];
        }
        javaFiles.value = [{ name: 'Main.java', code: '' }];
        activeHtmlFileIndex.value = 0;
        activeTab.value = 'html';
      } else if (lang === 'sql') {
        try {
          const parsed = JSON.parse(codeVal);
          if (Array.isArray(parsed)) sqlFiles.value = parsed.map(f => ({ ...f, buffer: null }));
          else throw new Error();
        } catch {
          sqlFiles.value = [{ name: 'main.db', code: codeVal || '', buffer: null }];
        }
        javaFiles.value = [{ name: 'Main.java', code: '' }];
        htmlFiles.value = [{ name: 'index.html', code: '' }];
        activeSqlFileIndex.value = 0;
        activeTab.value = 'sql';
      } else {
        try {
          const parsed = JSON.parse(codeVal);
          if (Array.isArray(parsed)) javaFiles.value = parsed;
          else throw new Error();
        } catch {
          javaFiles.value = [{ name: 'Main.java', code: codeVal || '' }];
        }
        htmlFiles.value = [{ name: 'index.html', code: '' }];
        activeJavaFileIndex.value = 0;
        activeTab.value = 'java';
      }
    };

    // 1. Check local cache first
    const cachedCode = localStorage.getItem(getStorageKey(`sms_assignment_cache_${assignmentId.value}`));
    const pendingCode = localStorage.getItem(getStorageKey(`sms_pending_sync_${assignmentId.value}`));
    if (pendingCode) {
      setCodeByLanguage(pendingCode);
      saveStatus.value = isOnline.value ? 'Syncing offline changes...' : 'Offline - saved locally';
      if (isOnline.value) {
        syncPendingDrafts();
      }
    } else if (cachedCode) {
      setCodeByLanguage(cachedCode);
      saveStatus.value = 'Loaded local draft';
    } else {
      // Set default tab based on metadata keywords if no cache exists
      const title = assignment.value?.title || '';
      const desc = assignment.value?.description || '';
      if (
        title.toLowerCase().includes('html') ||
        title.toLowerCase().includes('css') ||
        desc.toLowerCase().includes('html') ||
        desc.toLowerCase().includes('css')
      ) {
        activeTab.value = 'html';
      } else if (
        title.toLowerCase().includes('sql') ||
        desc.toLowerCase().includes('sql') ||
        desc.toLowerCase().includes('database')
      ) {
        activeTab.value = 'sql';
      } else {
        activeTab.value = 'java';
      }
    }

    // 2. Fetch from database to ensure sync
    if (isOnline.value) {
      try {
        await lmsStore.fetchStudentSubmissions();
        const existing = lmsStore.submissions.find(s => s.assignment_id === assignmentId.value);
        if (existing) {
          submissionStatus.value = existing.status;
          if (!pendingCode) {
            const serverCode = existing.content || '';
            setCodeByLanguage(serverCode);
            localStorage.setItem(getStorageKey(`sms_assignment_cache_${assignmentId.value}`), serverCode);
            saveStatus.value = existing.status === 'draft' ? 'All changes saved' : 'Submitted';

            if (activeTab.value === 'sql' && existing.file_path) {
              try {
                const arrayBuffer = await lmsService.downloadSubmissionFile(existing.id);
                const jsonStr = new TextDecoder('utf-8').decode(arrayBuffer);
                const parsedDbs = JSON.parse(jsonStr);
                if (Array.isArray(parsedDbs)) {
                  sqlFiles.value = parsedDbs.map(db => ({
                    name: db.name,
                    code: db.code,
                    buffer: db.bufferBase64 ? base64ToBuffer(db.bufferBase64) : null
                  }));
                }
              } catch (e) {
                console.error("Failed to fetch sqlite db json", e);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  } else {
    // Restore free play active tab preference if saved
    const savedTab = localStorage.getItem(getStorageKey('sms_lab_active_tab'));
    if (savedTab && ['java', 'sql', 'html'].includes(savedTab)) {
      activeTab.value = savedTab;
    }

    // Check free play local draft
    const draft = localStorage.getItem(getStorageKey(`sms_lab_freeplay_${activeTab.value}`));
    if (draft) {
      if (activeTab.value === 'html') {
        try { htmlFiles.value = JSON.parse(draft); } catch { htmlFiles.value = [{ name: 'index.html', code: draft }]; }
        javaFiles.value = [{ name: 'Main.java', code: '' }];
        sqlFiles.value = [{ name: 'main.db', code: '', buffer: null }];
        activeHtmlFileIndex.value = 0;
      } else if (activeTab.value === 'sql') {
        try { 
          const parsed = JSON.parse(draft);
          sqlFiles.value = parsed.map(f => ({ ...f, buffer: null }));
        } catch { sqlFiles.value = [{ name: 'main.db', code: draft, buffer: null }]; }
        htmlFiles.value = [{ name: 'index.html', code: '' }];
        javaFiles.value = [{ name: 'Main.java', code: '' }];
        activeSqlFileIndex.value = 0;
      } else {
        try { javaFiles.value = JSON.parse(draft); } catch { javaFiles.value = [{ name: 'Main.java', code: draft }]; }
        htmlFiles.value = [{ name: 'index.html', code: '' }];
        sqlFiles.value = [{ name: 'main.db', code: '', buffer: null }];
        activeJavaFileIndex.value = 0;
      }
    } else {
      htmlFiles.value = [{ name: 'index.html', code: '' }];
      javaFiles.value = [{ name: 'Main.java', code: '' }];
      sqlFiles.value = [{ name: 'main.db', code: '', buffer: null }];
      activeJavaFileIndex.value = 0;
      activeHtmlFileIndex.value = 0;
      activeSqlFileIndex.value = 0;
    }
  }
};

// Watch for user changes to reset state and load the new user's drafts dynamically
watch(() => authStore.user, (newUser) => {
  resetState();
  if (newUser) {
    loadDraftsForCurrentUser();
  }
}, { immediate: true });

// Watch for assignment ID query parameter changes to prevent cross-contamination between different assignments
watch(() => route.query.assignment_id, (newId, oldId) => {
  if (newId !== oldId) {
    resetState();
    loadDraftsForCurrentUser();
  }
});

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  // Initial load
  if (authStore.user) {
    loadDraftsForCurrentUser();
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
