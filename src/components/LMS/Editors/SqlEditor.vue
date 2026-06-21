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
        :disabled="disabled"
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
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const props = defineProps({
  initialCode: { type: String, default: '' },
  initialDbBuffer: { type: ArrayBuffer, default: null },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['change']);

const $q = useQuasar();
const query = ref(props.initialCode || '');
const isRunning = ref(false);
const results = ref(null);

let SQL = null;
let db = null;

const initDb = async (buffer) => {
  if (!SQL) {
    try {
      SQL = await initSqlJs({
        locateFile: () => sqlWasmUrl
      });
    } catch (err) {
      console.error("Failed to load sql.js", err);
      $q.notify({ type: 'negative', message: 'Failed to initialize SQLite engine.' });
      return;
    }
  }
  
  if (db) db.close();

  if (buffer && buffer.byteLength > 0) {
    db = new SQL.Database(new Uint8Array(buffer));
  } else {
    db = new SQL.Database();
  }
};

watch(() => props.initialDbBuffer, async (newVal) => {
  await initDb(newVal);
}, { immediate: true });

watch(() => props.initialCode, (newVal) => {
  if (newVal !== undefined && newVal !== null && newVal !== query.value) {
    query.value = newVal;
  }
});

let typingTimer = null;
watch(query, (newVal) => {
  emit('change', newVal);
  
  if (typingTimer) clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    runQuery();
  }, 500);
});

const preventAction = () => {
  $q.notify({
    type: 'negative',
    message: 'Copying/Pasting is disabled in the SQL Playground.',
    position: 'top',
    timeout: 2000
  });
};

const runQuery = () => {
  if (!db) {
    $q.notify({ type: 'warning', message: 'Database is initializing...' });
    return;
  }

  isRunning.value = true;
  try {
    const res = db.exec(query.value);
    if (res && res.length > 0) {
      const columns = res[0].columns;
      const values = res[0].values;
      results.value = values.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    } else {
      results.value = []; // Empty set (for CREATE/INSERT/UPDATE)
    }
  } catch (err) {
    results.value = [{ Error: err.message }];
  } finally {
    isRunning.value = false;
  }
};

const exportDatabase = () => {
  if (db) {
    return db.export(); // Returns Uint8Array
  }
  return null;
};

onUnmounted(() => {
  if (db) db.close();
});

defineExpose({
  exportDatabase,
  query
});
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
