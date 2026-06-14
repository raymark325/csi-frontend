<template>
  <div class="glass-card q-pa-lg">
    <div class="row justify-between items-center q-mb-md">
      <div class="row items-center q-gutter-sm">
        <span class="badge badge-orange">SQL Playground</span>
        <span class="text-caption text-red text-weight-bold">⚠️ Copy-Paste Disabled</span>
      </div>
      <q-btn color="warning" icon="flash_on" label="Execute Query" rounded unelevated :loading="isRunning" @click="runQuery"/>
    </div>

    <!-- SQL Editor -->
    <div class="editor-container">
      <textarea
        v-model="query"
        class="code-textarea"
        placeholder="SELECT * FROM students;"
        spellcheck="false"
        @copy.prevent="preventAction"
        @paste.prevent="preventAction"
        @cut.prevent="preventAction"
      ></textarea>
    </div>

    <!-- Query Output Table -->
    <div v-if="results !== null" class="q-mt-lg">
      <p class="text-label q-mb-xs">QUERY RESULTS</p>
      <div class="results-box">
        <table v-if="results.length > 0" class="results-table">
          <thead>
            <tr>
              <th v-for="key in Object.keys(results[0])" :key="key">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in results" :key="idx">
              <td v-for="(val, k) in row" :key="k">{{ val }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="text-caption text-white q-pa-md">Query executed successfully. Empty set.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const query = ref('SELECT * FROM subjects;');
const isRunning = ref(false);
const results = ref(null);

const preventAction = () => {
  $q.notify({
    type: 'negative',
    message: 'Copying/Pasting is disabled in the SQL Playground.',
    position: 'top',
    timeout: 2000
  });
};

const runQuery = () => {
  isRunning.value = true;
  setTimeout(() => {
    const qUpper = query.value.toUpperCase();
    if (qUpper.includes('SELECT * FROM SUBJECTS') || qUpper.includes('SELECT * FROM SUBJECT')) {
      results.value = [
        { id: 1, name: 'Grade 12 - Java', code: 'G12-JAVA' },
        { id: 2, name: 'Grade 11 - Hardware', code: 'G11-HW' },
        { id: 3, name: 'Grade 11 - Code', code: 'G11-CODE' }
      ];
    } else if (qUpper.includes('SELECT * FROM STUDENTS') || qUpper.includes('SELECT * FROM STUDENT')) {
      results.value = [
        { id: 101, name: 'John Doe', email: 'student@sms.edu' },
        { id: 102, name: 'Alice Johnson', email: 'student2@sms.edu' }
      ];
    } else {
      results.value = [];
    }
    isRunning.value = false;
  }, 1000);
};
</script>

<style scoped>
.editor-container {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #151821;
  overflow: hidden;
}

.code-textarea {
  width: 100%;
  height: 200px;
  font-family: monospace;
  font-size: 14px;
  background: #151821;
  color: #a9b7c6;
  border: none;
  padding: 16px;
  resize: vertical;
  outline: none;
  line-height: 1.5;
}

.results-box {
  background: #0f111a;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  color: #fff;
  font-size: 13px;
}

.results-table th {
  background: #1b2130;
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.results-table td {
  padding: 10px;
  border-bottom: 1px solid #1c202e;
}
</style>
