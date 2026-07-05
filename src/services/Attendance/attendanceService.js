import API from '../api';

export const attendanceService = {
  getHistory() {
    return API.get('/attendance/history');
  },

  getStudentHistory(enrollmentId) {
    return API.get(`/attendance/history?enrollment_id=${enrollmentId}`);
  },

  getSectionAttendance(sectionId, date = null) {
    const url = date ? `/attendance/section?section_subject_id=${sectionId}&date=${date}` : `/attendance/section?section_subject_id=${sectionId}`;
    return API.get(url);
  },

  markAttendance(data) {
    return API.post('/attendance/mark', data);
  },
};
export default attendanceService;
