import axios from 'axios';
import API from '../api';

export const lmsService = {
  getModules() {
    return API.get('/lms/modules');
  },

  getMasterModules(courseId) {
    return API.get(`/lms/modules?course_id=${courseId}`);
  },

  getModule(id) {
    return API.get(`/lms/modules/${id}`);
  },

  createModule(data) {
    console.log("lmsService.createModule data:", data);
    if (data.file) {
      console.log("lmsService: Found file, using FormData");
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (Array.isArray(data[key])) {
            data[key].forEach(val => {
              formData.append(`${key}[]`, val);
            });
          } else {
            formData.append(key, data[key]);
          }
        }
      });
      
      const token = localStorage.getItem('auth_token');
      const baseURL = API.defaults.baseURL;
      
      return axios.post(`${baseURL}/lms/modules`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(res => res.data);
    }
    return API.post('/lms/modules', data);
  },

  duplicateModule(id, sectionIds) {
    if (Array.isArray(sectionIds)) {
      return API.post(`/lms/modules/${id}/duplicate`, { section_subject_ids: sectionIds });
    }
    return API.post(`/lms/modules/${id}/duplicate`, { section_subject_id: sectionIds });
  },

  getAssignments(sectionId) {
    return API.get(`/lms/assignments/${sectionId}`);
  },

  createAssignment(data) {
    return API.post('/lms/assignments', data);
  },

  updateAssignment(id, data) {
    return API.put(`/lms/assignments/${id}`, data);
  },

  deleteAssignment(id) {
    return API.delete(`/lms/assignments/${id}`);
  },

  getSubmissions() {
    return API.get('/lms/submissions');
  },

  saveDraft(data) {
    if (data.db_file) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      formData.append('status', 'draft');
      const token = localStorage.getItem('auth_token');
      const baseURL = API.defaults.baseURL;
      return axios.post(`${baseURL}/lms/submissions`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.data);
    }
    return API.post('/lms/submissions', { ...data, status: 'draft' });
  },

  submitAssignment(data) {
    if (data.db_file) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      formData.append('status', 'submitted');
      const token = localStorage.getItem('auth_token');
      const baseURL = API.defaults.baseURL;
      return axios.post(`${baseURL}/lms/submissions`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.data);
    }
    return API.post('/lms/submissions', { ...data, status: 'submitted' });
  },

  getSectionSubmissions(sectionId) {
    return API.get(`/lms/submissions/${sectionId}`);
  },

  gradeSubmission(id, score, feedback) {
    return API.post(`/lms/submissions/${id}/grade`, { score, feedback });
  },

  downloadSubmissionFile(id) {
    return API.get(`/lms/submissions/${id}/download`, { responseType: 'arraybuffer' })
      .then(res => res.data);
  }
};
export default lmsService;

// ── SQL Sandbox Cloud Sync ──────────────────────────────────────────────────
// Silently pushes/pulls raw sql.js SQLite binaries (base64) per user.
// Does NOT touch phpMyAdmin or the app's MariaDB. Data is the sql.js export only.
export const sqlSandboxService = {
  /**
   * Fetch all saved databases for the current user from the cloud.
   * Returns an array of { db_name, db_data (base64), sql_code, updated_at }
   */
  fetchAll() {
    return API.get('/sql-sandbox').then(res => res.data?.data || []);
  },

  /**
   * Silently push all sql files to the cloud (upsert by db_name).
   * @param {Array<{ db_name: string, db_data: string|null, sql_code: string }>} databases
   */
  syncAll(databases) {
    return API.post('/sql-sandbox/sync', { databases });
  },

  /**
   * Delete one named database from the cloud.
   * @param {string} dbName
   */
  deleteDb(dbName) {
    return API.delete(`/sql-sandbox/${encodeURIComponent(dbName)}`);
  },
};

