import API from '../api';

export const gradeService = {
  getStudentGrades() {
    return API.get('/grading/grades');
  },

  getSectionGradebook(sectionId) {
    return API.get(`/grading/grades/section/${sectionId}`);
  },

  inputManualGrade(data) {
    return API.post('/grading/grades/input', data);
  },

  getCategories(sectionId) {
    return API.get(`/grading/categories/${sectionId}`);
  },

  createCategory(data) {
    return API.post('/grading/categories', data);
  },

  updateCategory(id, data) {
    return API.put(`/grading/categories/${id}`, data);
  },

  deleteCategory(id) {
    return API.delete(`/grading/categories/${id}`);
  },

  getReportCard(studentId = null) {
    const url = studentId ? `/report-card?student_id=${studentId}` : '/report-card';
    return API.get(url);
  },
};
export default gradeService;
