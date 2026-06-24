/**
 * chatCache.js
 *
 * Provides a transparent caching layer for chat messages.
 * Primary storage:  IndexedDB  (large capacity, fast)
 * Fallback storage: localStorage (limited, ~5 MB total)
 *
 * Public API:
 *   getMessages(roomId)              → Array of messages (sorted asc by id)
 *   saveMessages(roomId, messages)   → Merge-save (deduplicates by id)
 *   clearRoom(roomId)               → Remove all cached messages for a room
 */

const DB_NAME    = 'sms_chat_cache';
const DB_VERSION = 1;
const STORE_NAME = 'messages';
const LS_PREFIX  = 'chat_cache_';
const MAX_CACHED = 200; // keep at most 200 messages per room in cache

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // key: composite "roomId_messageId"
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' });
        store.createIndex('by_room', 'roomId', { unique: false });
        store.createIndex('by_room_id', ['roomId', 'msgId'], { unique: true });
      }
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };

    req.onerror = (e) => reject(e.target.error);
  });
}

function idbGet(roomId) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('by_room');
    const req   = index.getAll(IDBKeyRange.only(String(roomId)));
    req.onsuccess = (e) => {
      const rows = e.target.result.map(r => r.message);
      rows.sort((a, b) => a.id - b.id);
      resolve(rows);
    };
    req.onerror = (e) => reject(e.target.error);
  }));
}

function idbSave(roomId, messages) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    messages.forEach(msg => {
      store.put({
        cacheKey: `${roomId}_${msg.id}`,
        roomId: String(roomId),
        msgId:  msg.id,
        message: msg,
      });
    });

    tx.oncomplete = () => resolve();
    tx.onerror    = (e) => reject(e.target.error);
  }));
}

function idbClear(roomId) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const index = tx.objectStore(STORE_NAME).index('by_room');
    const req   = index.openCursor(IDBKeyRange.only(String(roomId)));

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) { cursor.delete(); cursor.continue(); }
    };
    tx.oncomplete = () => resolve();
    tx.onerror    = (e) => reject(e.target.error);
  }));
}

// ─── localStorage fallback ────────────────────────────────────────────────────

function lsGet(roomId) {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${roomId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function lsSave(roomId, messages) {
  try {
    // Keep only the latest MAX_CACHED messages to avoid quota errors
    const trimmed = messages.slice(-MAX_CACHED);
    localStorage.setItem(`${LS_PREFIX}${roomId}`, JSON.stringify(trimmed));
  } catch {
    // Quota exceeded — clear and retry
    try {
      localStorage.removeItem(`${LS_PREFIX}${roomId}`);
    } catch { /* ignore */ }
  }
}

function lsClear(roomId) {
  try {
    localStorage.removeItem(`${LS_PREFIX}${roomId}`);
  } catch { /* ignore */ }
}

// ─── Detect IndexedDB availability ───────────────────────────────────────────

const _idbAvailable = (() => {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
})();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Retrieve all cached messages for a room, sorted ascending by id.
 */
export async function getMessages(roomId) {
  if (_idbAvailable) {
    try {
      return await idbGet(roomId);
    } catch {
      // IDB failed at runtime — fall through to localStorage
    }
  }
  return lsGet(roomId);
}

/**
 * Merge-save messages into cache (deduplicates by id, trims to MAX_CACHED).
 */
export async function saveMessages(roomId, newMessages) {
  if (!newMessages || newMessages.length === 0) return;

  if (_idbAvailable) {
    try {
      await idbSave(roomId, newMessages);

      // Trim: keep only latest MAX_CACHED in IDB for this room
      const all = await idbGet(roomId);
      if (all.length > MAX_CACHED) {
        const toDelete = all.slice(0, all.length - MAX_CACHED);
        await _idbDeleteBatch(roomId, toDelete.map(m => m.id));
      }
      return;
    } catch { /* fall through */ }
  }

  // localStorage fallback
  const existing   = lsGet(roomId);
  const existingIds = new Set(existing.map(m => m.id));
  const merged     = [...existing, ...newMessages.filter(m => !existingIds.has(m.id))];
  merged.sort((a, b) => a.id - b.id);
  lsSave(roomId, merged);
}

/**
 * Clear all cached messages for a room.
 */
export async function clearRoom(roomId) {
  if (_idbAvailable) {
    try {
      await idbClear(roomId);
      return;
    } catch { /* fall through */ }
  }
  lsClear(roomId);
}

// Internal: delete specific message IDs from IDB
async function _idbDeleteBatch(roomId, ids) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    ids.forEach(id => store.delete(`${roomId}_${id}`));
    tx.oncomplete = () => resolve();
    tx.onerror    = (e) => reject(e.target.error);
  });
}
