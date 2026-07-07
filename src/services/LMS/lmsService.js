import axios from 'axios';
import API from '../api';

export const lmsService = {
  getModules() {
    return API.get('/lms/modules');
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
          formData.append(key, data[key]);
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

  duplicateModule(id, section_subject_id) {
    return API.post(`/lms/modules/${id}/duplicate`, { section_subject_id });
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
