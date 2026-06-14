import API from './api';

export const announcementService = {
  getAnnouncements() {
    return API.get('/announcements');
  },

  createAnnouncement(data) {
    return API.post('/announcements', data);
  },

  deleteAnnouncement(id) {
    return API.delete(`/announcements/${id}`);
  },
};

export default announcementService;
