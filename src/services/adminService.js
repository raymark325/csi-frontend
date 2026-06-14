import API from './api';

export const adminService = {
  // Users
  getUsers() {
    return API.get('/users');
  },
  createUser(data) {
    return API.post('/users', data);
  },
  updateUser(id, data) {
    return API.put(`/users/${id}`, data);
  },
  deleteUser(id) {
    return API.delete(`/users/${id}`);
  },

  // Courses
  getCourses() {
    return API.get('/courses');
  },
  createCourse(data) {
    return API.post('/courses', data);
  },
  updateCourse(id, data) {
    return API.put(`/courses/${id}`, data);
  },
  deleteCourse(id) {
    return API.delete(`/courses/${id}`);
  },

  // Sections
  getSections() {
    return API.get('/sections'); // Wait! For admin, teacherSections is bound to /sections... Ah! Actually wait...
  },
  createSection(data) {
    return API.post('/sections', data);
  },
  updateSection(id, data) {
    return API.put(`/sections/${id}`, data);
  },
  deleteSection(id) {
    return API.delete(`/sections/${id}`);
  },
};

export default adminService;
