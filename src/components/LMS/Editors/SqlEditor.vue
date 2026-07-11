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

// Emit change for autosave/cloud sync — do NOT auto-execute on typing
watch(query, (newVal) => {
  emit('change', newVal);
});

const preventAction = () => {
  $q.notify({
    type: 'negative',
    message: 'Copying/Pasting is disabled in the SQL Playground.',
    position: 'top',
    timeout: 2000
  });
};

/**
 * Translate MySQL-flavoured SQL to SQLite-compatible SQL.
 * Handles statement-by-statement so multi-statement scripts work correctly.
 */
const translateToSQLite = (input) => {
  // Split on semicolons but keep structure; handle each statement
  const statements = input
    .split(/;/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const translated = statements.map(stmt => {
    const upper = stmt.toUpperCase().replace(/\s+/g, ' ').trim();

    // ── SHOW TABLES ──────────────────────────────────────────────────────────
    if (/^SHOW TABLES/.test(upper)) {
      return "SELECT name AS 'Tables' FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name";
    }

    // ── SHOW DATABASES / SHOW SCHEMAS ────────────────────────────────────────
    if (/^SHOW (DATABASES|SCHEMAS)/.test(upper)) {
      return "SELECT 'main' AS 'Database'";
    }

    // ── SHOW FULL TABLES ─────────────────────────────────────────────────────
    if (/^SHOW FULL TABLES/.test(upper)) {
      return "SELECT name AS 'Tables', 'BASE TABLE' AS 'Table_type' FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name";
    }

    // ── DESCRIBE / DESC tablename ─────────────────────────────────────────────
    const descMatch = stmt.match(/^(?:DESC(?:RIBE)?)\s+(\S+)/i);
    if (descMatch) {
      const tbl = descMatch[1].replace(/[`'"]/g, '');
      return `PRAGMA table_info(${tbl})`;
    }

    // ── SHOW COLUMNS FROM tablename ───────────────────────────────────────────
    const showColMatch = stmt.match(/^SHOW (?:FULL )?COLUMNS FROM\s+(\S+)/i);
    if (showColMatch) {
      const tbl = showColMatch[1].replace(/[`'"]/g, '');
      return `PRAGMA table_info(${tbl})`;
    }

    // ── SHOW INDEX FROM / SHOW INDEXES FROM ──────────────────────────────────
    const showIdxMatch = stmt.match(/^SHOW (?:INDEX|INDEXES|KEYS) FROM\s+(\S+)/i);
    if (showIdxMatch) {
      const tbl = showIdxMatch[1].replace(/[`'"]/g, '');
      return `PRAGMA index_list(${tbl})`;
    }

    // ── SHOW CREATE TABLE ─────────────────────────────────────────────────────
    const showCreateMatch = stmt.match(/^SHOW CREATE TABLE\s+(\S+)/i);
    if (showCreateMatch) {
      const tbl = showCreateMatch[1].replace(/[`'"]/g, '');
      return `SELECT sql AS 'Create Table' FROM sqlite_master WHERE type='table' AND name='${tbl}'`;
    }

    // ── SHOW TABLE STATUS ─────────────────────────────────────────────────────
    if (/^SHOW TABLE STATUS/.test(upper)) {
      return "SELECT name AS 'Name', 'InnoDB' AS 'Engine', 'Dynamic' AS 'Row_format' FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
    }

    // ── USE database ──────────────────────────────────────────────────────────
    if (/^USE\s+/.test(upper)) {
      return "SELECT 'Database changed (note: SQLite is single-file, USE is a no-op)' AS Info";
    }

    // ── SELECT DATABASE() ─────────────────────────────────────────────────────
    if (/^SELECT DATABASE\(\)/.test(upper)) {
      return "SELECT 'main' AS 'database()'";
    }

    // ── SELECT VERSION() ─────────────────────────────────────────────────────
    if (/^SELECT VERSION\(\)/.test(upper)) {
      return "SELECT sqlite_version() AS 'version()'";
    }

    // ── SHOW VARIABLES / SHOW STATUS ─────────────────────────────────────────
    if (/^SHOW (VARIABLES|STATUS|GLOBAL|SESSION)/.test(upper)) {
      return "SELECT 'SQLite does not have SHOW VARIABLES. Use PRAGMA statements instead.' AS Note";
    }

    // ── Structural DDL: strip MySQL-specific clauses ──────────────────────────
    let out = stmt;

    // Remove AUTO_INCREMENT=N table option
    out = out.replace(/\bAUTO_INCREMENT\s*=\s*\d+/gi, '');
    // Replace AUTO_INCREMENT column attribute with nothing (SQLite uses AUTOINCREMENT)
    out = out.replace(/\bAUTO_INCREMENT\b/gi, 'AUTOINCREMENT');
    // Remove ENGINE=InnoDB / ENGINE=MyISAM etc.
    out = out.replace(/\bENGINE\s*=\s*\w+/gi, '');
    // Remove DEFAULT CHARSET / CHARACTER SET / COLLATE
    out = out.replace(/\bDEFAULT\s+CHARSET\s*=\s*\w+/gi, '');
    out = out.replace(/\bCHARACTER\s+SET\s+\w+/gi, '');
    out = out.replace(/\bCHARSET\s*=\s*\w+/gi, '');
    out = out.replace(/\bCOLLATE\s*=?\s*[\w_]+/gi, '');
    // Remove ROW_FORMAT
    out = out.replace(/\bROW_FORMAT\s*=\s*\w+/gi, '');
    // Remove UNSIGNED (SQLite has no unsigned concept but accepts it; just strip to be safe)
    out = out.replace(/\bUNSIGNED\b/gi, '');
    // Replace MySQL INT types that SQLite doesn't know about
    out = out.replace(/\bTINYINT\b/gi, 'INTEGER');
    out = out.replace(/\bSMALLINT\b/gi, 'INTEGER');
    out = out.replace(/\bMEDIUMINT\b/gi, 'INTEGER');
    out = out.replace(/\bBIGINT\b/gi, 'INTEGER');
    out = out.replace(/\bDOUBLE\b/gi, 'REAL');
    out = out.replace(/\bFLOAT\b/gi, 'REAL');
    // Replace DATETIME/TIMESTAMP with TEXT (SQLite stores as text)
    out = out.replace(/\bDATETIME\b/gi, 'TEXT');
    out = out.replace(/\bTIMESTAMP\b/gi, 'TEXT');
    // Remove backtick quoting (replace with nothing — SQLite supports it but let's normalize)
    // Keep backticks actually — SQLite does support them
    // Remove trailing commas before closing paren (from removed clauses)
    out = out.replace(/,\s*\)/g, ')');
    // Clean up multiple spaces
    out = out.replace(/\s{2,}/g, ' ').trim();

    return out;
  });

  return translated.join(';\n');
};

const runQuery = () => {
  if (!db) {
    $q.notify({ type: 'warning', message: 'Database is initializing...' });
    return;
  }

  isRunning.value = true;
  try {
    const translatedQuery = translateToSQLite(query.value);
    const res = db.exec(translatedQuery);
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
      results.value = []; // Empty set (for CREATE/INSERT/UPDATE/DDL)
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
