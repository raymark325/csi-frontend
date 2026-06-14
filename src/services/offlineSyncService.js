/**
 * offlineSyncService.js
 * Implements IndexedDB schema design, local caching, and background sync queue management.
 */

const DB_NAME = 'csi_offline_db';
const DB_VERSION = 1;

let dbInstance = null;

const getDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      
      // Store 1: Cached Modules & Course Content
      if (!db.objectStoreNames.contains('modules')) {
        db.createObjectStore('modules', { keyPath: 'id' });
      }

      // Store 2: Offline Submission Sync Queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

export const offlineSyncService = {
  /**
   * Cache module contents locally
   */
  async cacheModule(module) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('modules', 'readwrite');
      const store = tx.objectStore('modules');
      const request = store.put(module);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * Fetch cached module contents
   */
  async getCachedModules() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('modules', 'readonly');
      const store = tx.objectStore('modules');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * Add a submission draft or edit to the background sync queue
   */
  async enqueueSubmission(submission) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const request = store.add({
        ...submission,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * Retrieve all queued offline submissions
   */
  async getSyncQueue() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * Remove a processed item from the queue
   */
  async dequeueItem(id) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }
};
