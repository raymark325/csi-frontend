import axios from 'axios';
import API from '../api';

export const lmsService = {
  getModules(sectionSubjectId = null) {
    const params = sectionSubjectId ? { section_subject_id: sectionSubjectId } : {};
    return API.get('/lms/modules', { params });
  },

  getMasterModules(courseId) {
    return API.get(`/lms/modules?course_id=${courseId}`);
  },

  getModule(id) {
    return API.get(`/lms/modules/${id}`);
  },

  createModule(data) {
    if (data.file) {
      // File upload: use FormData, send arrays as repeated keys (section_subject_ids[])
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] === null || data[key] === undefined) return;
        if (key === 'section_subject_ids' && Array.isArray(data[key])) {
          data[key].forEach(val => formData.append('section_subject_ids[]', val));
        } else if (Array.isArray(data[key])) {
          data[key].forEach(val => formData.append(`${key}[]`, val));
        } else {
          formData.append(key, data[key]);
        }
      });
      const token = localStorage.getItem('auth_token');
      return axios.post(`${API.defaults.baseURL}/lms/modules`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.data);
    }
    return API.post('/lms/modules', data);
  },

  /**
   * Update which sections can see a module (without changing other fields).
   * @param {number} id  - module ID
   * @param {number[]} sectionSubjectIds  - array of section_subject IDs
   */
  updateModuleSections(id, sectionSubjectIds) {
    return API.patch(`/lms/modules/${id}/sections`, { section_subject_ids: sectionSubjectIds });
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
    if (data.file) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) formData.append(key, data[key]);
      });
      return API.post('/lms/assignments', formData);
    }
    return API.post('/lms/assignments', data);
  },

  updateAssignment(id, data) {
    if (data.file) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) formData.append(key, data[key]);
      });
      formData.append('_method', 'PUT'); // Laravel needs this for PUT w/ FormData
      return API.post(`/lms/assignments/${id}`, formData);
    }
    return API.put(`/lms/assignments/${id}`, data);
  },

  deleteAssignment(id) {
    return API.delete(`/lms/assignments/${id}`);
  },

  downloadAssignmentFile(id) {
    return API.get(`/lms/assignments/${id}/download`, { responseType: 'blob' })
      .then(res => res.data);
  },

  getSubmissions() {
    return API.get('/lms/submissions');
  },

  saveDraft(data) {
    if (data.db_file || data.file) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) formData.append(key, data[key]);
      });
      formData.append('status', 'draft');
      return API.post('/lms/submissions', formData);
    }
    return API.post('/lms/submissions', { ...data, status: 'draft' });
  },

  submitAssignment(data) {
    if (data.db_file || data.file) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) formData.append(key, data[key]);
      });
      formData.append('status', 'submitted');
      return API.post('/lms/submissions', formData);
    }
    return API.post('/lms/submissions', { ...data, status: 'submitted' });
  },

  getSectionSubmissions(sectionId) {
    return API.get(`/lms/submissions/${sectionId}`);
  },

  getSubmission(id) {
    return API.get(`/lms/submissions/${id}`);
  },

  gradeSubmission(id, score, feedback) {
    return API.post(`/lms/submissions/${id}/grade`, { score, feedback });
  },

  returnSubmission(id, feedback) {
    return API.post(`/lms/submissions/${id}/return`, { feedback });
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

// ── Java Sandbox Cloud Sync ──────────────────────────────────────────────────
export const javaSandboxService = {
  fetch() {
    // API interceptor unwraps response.data, so res = { success, data: [...] }
    return API.get('/java-sandbox').then(res => res.data || null);
  },
  sync(projectName, projectData) {
    return API.post('/java-sandbox/sync', { project_name: projectName, project_data: projectData });
  },
  clear(projectName = null) {
    const params = projectName ? { params: { project_name: projectName } } : {};
    return API.delete('/java-sandbox', params);
  }
};

// ── HTML Sandbox Cloud Sync ──────────────────────────────────────────────────
export const htmlSandboxService = {
  fetch() {
    // API interceptor unwraps response.data, so res = { success, data: [...] }
    return API.get('/html-sandbox').then(res => res.data || null);
  },
  sync(projectName, projectData) {
    return API.post('/html-sandbox/sync', { project_name: projectName, project_data: projectData });
  },
  clear(projectName = null) {
    const params = projectName ? { params: { project_name: projectName } } : {};
    return API.delete('/html-sandbox', params);
  }
};


