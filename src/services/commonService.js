import API from './api';

export const commonService = {
  getStudentDashboard() {
    return API.get('/dashboard/student');
  },

  getTeacherDashboard() {
    return API.get('/dashboard/teacher');
  },

  getSections() {
    return API.get('/sections');
  },
};
export default commonService;
