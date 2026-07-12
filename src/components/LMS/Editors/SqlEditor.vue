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
 * Split SQL input into individual statements respecting parentheses and quotes,
 * so semicolons inside CREATE TABLE (...) or string literals are not used as splits.
 */
const splitStatements = (input) => {
  const stmts = [];
  let current = '';
  let depth = 0;       // paren depth
  let inStr = false;
  let strChar = '';

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inStr) {
      current += ch;
      if (ch === strChar && input[i - 1] !== '\\') inStr = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = true;
      strChar = ch;
      current += ch;
      continue;
    }
    if (ch === '(') { depth++; current += ch; continue; }
    if (ch === ')') { depth--; current += ch; continue; }
    if (ch === ';' && depth === 0) {
      const s = current.trim();
      if (s) stmts.push(s);
      current = '';
      continue;
    }
    current += ch;
  }
  const s = current.trim();
  if (s) stmts.push(s);
  return stmts;
};

/**
 * Strip MariaDB/MySQL-specific table options that appear AFTER the closing paren
 * of a CREATE TABLE statement, e.g.:
 *   ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1;
 * These all live in the "table_options" tail, not inside the column list.
 */
const stripTableOptions = (stmt) => {
  // Find the last closing paren — everything after it is table options
  const lastParen = stmt.lastIndexOf(')');
  if (lastParen === -1) return stmt;

  const head = stmt.substring(0, lastParen + 1);
  let tail = stmt.substring(lastParen + 1);

  // Strip known MariaDB/MySQL table options from the tail only
  tail = tail
    .replace(/\bENGINE\s*=\s*\w+/gi, '')
    .replace(/\bAUTO_INCREMENT\s*=\s*\d+/gi, '')
    .replace(/\bDEFAULT\s+CHARSET\s*=\s*[\w_]+/gi, '')
    .replace(/\bDEFAULT\s+CHARACTER\s+SET\s*=?\s*[\w_]+/gi, '')
    .replace(/\bCHARACTER\s+SET\s*=?\s*[\w_]+/gi, '')
    .replace(/\bCHARSET\s*=\s*[\w_]+/gi, '')
    .replace(/\bCOLLATE\s*=?\s*[\w_]+/gi, '')
    .replace(/\bROW_FORMAT\s*=\s*\w+/gi, '')
    .replace(/\bCOMMENT\s*=\s*'[^']*'/gi, '')
    .replace(/\bPACK_KEYS\s*=\s*\w+/gi, '')
    .replace(/\bCHECKSUM\s*=\s*\w+/gi, '')
    .replace(/\bDELAY_KEY_WRITE\s*=\s*\w+/gi, '')
    .replace(/\bMIN_ROWS\s*=\s*\d+/gi, '')
    .replace(/\bMAX_ROWS\s*=\s*\d+/gi, '')
    .replace(/\bAVG_ROW_LENGTH\s*=\s*\d+/gi, '')
    .replace(/\bKEY_BLOCK_SIZE\s*=\s*\d+/gi, '')
    .replace(/\bSTATS_PERSISTENT\s*=\s*\w+/gi, '')
    .replace(/\bDATA\s+DIRECTORY\s*=\s*'[^']*'/gi, '')
    .replace(/\bINDEX\s+DIRECTORY\s*=\s*'[^']*'/gi, '')
    .trim();

  return head + (tail ? ' ' + tail : '');
};

/**
 * Translate column-level MySQL type/attribute syntax to SQLite equivalents.
 * Applied ONLY to the column definition portion (before the last closing paren).
 */
const translateColumnDefs = (stmt) => {
  let out = stmt;

  // AUTO_INCREMENT column attribute → AUTOINCREMENT (only inside column defs)
  // SQLite strictly requires AUTOINCREMENT to be exactly on "INTEGER PRIMARY KEY".
  // So if we see AUTO_INCREMENT, we force the type to INTEGER PRIMARY KEY AUTOINCREMENT
  // and strip out other occurrences of PRIMARY KEY or INT types on that line.
  out = out.replace(/(\w+)\s+(?:INT|TINYINT|SMALLINT|MEDIUMINT|BIGINT|INTEGER)?\s*(?:\(\d+\))?\s*(?:UNSIGNED\s*)?(?:PRIMARY\s+KEY\s*)?AUTO_INCREMENT(?:\s+PRIMARY\s+KEY)?/gi, '$1 INTEGER PRIMARY KEY AUTOINCREMENT');
  out = out.replace(/\bAUTO_INCREMENT\b/gi, 'AUTOINCREMENT'); // Fallback for any leftovers

  // MySQL int aliases → INTEGER
  out = out.replace(/\bTINYINT\s*(\(\d+\))?/gi, 'INTEGER');
  out = out.replace(/\bSMALLINT\s*(\(\d+\))?/gi, 'INTEGER');
  out = out.replace(/\bMEDIUMINT\s*(\(\d+\))?/gi, 'INTEGER');
  out = out.replace(/\bBIGINT\s*(\(\d+\))?/gi, 'INTEGER');
  out = out.replace(/\bINT\s*(\(\d+\))?/gi, 'INTEGER');

  // Floating point
  out = out.replace(/\bFLOAT\s*(\(\d+,\d+\))?/gi, 'REAL');
  out = out.replace(/\bDOUBLE\s*(PRECISION)?\s*(\(\d+,\d+\))?/gi, 'REAL');
  out = out.replace(/\bDECIMAL\s*(\(\d+,\d+\))?/gi, 'NUMERIC');

  // Date/time types (SQLite stores as TEXT)
  out = out.replace(/\bDATETIME\b/gi, 'TEXT');
  out = out.replace(/\bTIMESTAMP\b/gi, 'TEXT');
  out = out.replace(/\bDATE\b/gi, 'TEXT');
  out = out.replace(/\bTIME\b/gi, 'TEXT');
  out = out.replace(/\bYEAR\b/gi, 'INTEGER');

  // String types — keep VARCHAR/CHAR as-is (SQLite accepts them), but normalize LONGTEXT etc.
  out = out.replace(/\bTINYTEXT\b/gi, 'TEXT');
  out = out.replace(/\bMEDIUMTEXT\b/gi, 'TEXT');
  out = out.replace(/\bLONGTEXT\b/gi, 'TEXT');
  out = out.replace(/\bTINYBLOB\b/gi, 'BLOB');
  out = out.replace(/\bMEDIUMBLOB\b/gi, 'BLOB');
  out = out.replace(/\bLONGBLOB\b/gi, 'BLOB');

  // UNSIGNED — strip (SQLite has no unsigned, and the word causes parse errors)
  out = out.replace(/\bUNSIGNED\b/gi, '');

  // ZEROFILL — strip
  out = out.replace(/\bZEROFILL\b/gi, '');

  // Column-level CHARACTER SET / COLLATE (inside column def)
  out = out.replace(/\bCHARACTER\s+SET\s+[\w_]+/gi, '');
  out = out.replace(/\bCOLLATE\s+[\w_]+/gi, '');

  // ON UPDATE CURRENT_TIMESTAMP — strip (no trigger equivalent in simple DDL)
  out = out.replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP(\(\))?\b/gi, '');

  // Clean up multiple spaces left by removals
  out = out.replace(/[ \t]{2,}/g, ' ');

  return out;
};

/**
 * Translate MySQL-flavoured SQL to SQLite-compatible SQL.
 * Handles statement-by-statement using paren-aware splitting.
 */
const translateToSQLite = (input) => {
  const statements = splitStatements(input);

  const translated = statements.map(stmt => {
    const upper = stmt.toUpperCase().replace(/\s+/g, ' ').trim();

    // ── SHOW TABLES ──────────────────────────────────────────────────────────
    if (/^SHOW FULL TABLES/.test(upper)) {
      return "SELECT name AS 'Tables', 'BASE TABLE' AS Table_type FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name";
    }
    if (/^SHOW TABLES/.test(upper)) {
      return "SELECT name AS Tables FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name";
    }

    // ── SHOW DATABASES / SHOW SCHEMAS ────────────────────────────────────────
    if (/^SHOW (DATABASES|SCHEMAS)/.test(upper)) {
      return "SELECT 'main' AS 'Database'";
    }

    // ── DESCRIBE / DESC tablename ─────────────────────────────────────────────
    const descMatch = stmt.match(/^DESC(?:RIBE)?\s+(`?[\w]+`?)/i);
    if (descMatch) {
      const tbl = descMatch[1].replace(/`/g, '');
      return `PRAGMA table_info(\`${tbl}\`)`;
    }

    // ── SHOW COLUMNS FROM tablename ───────────────────────────────────────────
    const showColMatch = stmt.match(/^SHOW (?:FULL )?COLUMNS FROM\s+(`?[\w]+`?)/i);
    if (showColMatch) {
      const tbl = showColMatch[1].replace(/`/g, '');
      return `PRAGMA table_info(\`${tbl}\`)`;
    }

    // ── SHOW INDEX / KEYS FROM tablename ─────────────────────────────────────
    const showIdxMatch = stmt.match(/^SHOW (?:INDEX|INDEXES|KEYS) FROM\s+(`?[\w]+`?)/i);
    if (showIdxMatch) {
      const tbl = showIdxMatch[1].replace(/`/g, '');
      return `PRAGMA index_list(\`${tbl}\`)`;
    }

    // ── SHOW CREATE TABLE ─────────────────────────────────────────────────────
    const showCreateMatch = stmt.match(/^SHOW CREATE TABLE\s+(`?[\w]+`?)/i);
    if (showCreateMatch) {
      const tbl = showCreateMatch[1].replace(/`/g, '');
      return `SELECT sql AS 'Create Table' FROM sqlite_master WHERE type='table' AND name='${tbl}'`;
    }

    // ── SHOW TABLE STATUS ─────────────────────────────────────────────────────
    if (/^SHOW TABLE STATUS/.test(upper)) {
      return "SELECT name AS Name, 'InnoDB' AS Engine FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
    }

    // ── USE database ─────────────────────────────────────────────────────────
    if (/^USE\s+/.test(upper)) {
      return "SELECT 'SQLite is single-file. USE is not needed.' AS Info";
    }

    // ── SELECT DATABASE() ────────────────────────────────────────────────────
    if (/^SELECT\s+DATABASE\s*\(\s*\)/.test(upper)) {
      return "SELECT 'main' AS 'database()'";
    }

    // ── SELECT VERSION() ─────────────────────────────────────────────────────
    if (/^SELECT\s+VERSION\s*\(\s*\)/.test(upper)) {
      return "SELECT sqlite_version() AS 'version()'";
    }

    // ── SHOW VARIABLES / STATUS ───────────────────────────────────────────────
    if (/^SHOW (VARIABLES|STATUS|GLOBAL|SESSION)/.test(upper)) {
      return "SELECT 'Use PRAGMA statements in SQLite instead of SHOW VARIABLES.' AS Note";
    }

    // ── DDL: CREATE TABLE — strip table options, translate column types ───────
    if (/^CREATE\s+(TEMPORARY\s+)?TABLE/.test(upper)) {
      let out = stripTableOptions(stmt);
      out = translateColumnDefs(out);
      // Remove trailing commas left by removed lines (before closing paren)
      out = out.replace(/,(\s*)\)/g, '$1)');
      out = out.replace(/\s{2,}/g, ' ').trim();
      return out;
    }

    // ── ALTER TABLE — strip unsupported clauses ───────────────────────────────
    if (/^ALTER\s+TABLE/.test(upper)) {
      let out = translateColumnDefs(stmt);
      out = out.replace(/\s{2,}/g, ' ').trim();
      return out;
    }

    // ── All other statements — pass through with type translations only ────────
    return translateColumnDefs(stmt);
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
