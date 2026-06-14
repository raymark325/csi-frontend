import { defineStore } from 'pinia';
import { ref } from 'vue';
import { announcementService } from '../services/announcementService';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useAnnouncementStore = defineStore('announcements', () => {
  const announcements = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  const _fetchedAt = ref(0);

  const _isCacheValid = (timestamp) => {
    return timestamp && (Date.now() - timestamp < CACHE_TTL);
  };

  const fetchAnnouncements = async (force = false) => {
    if (!force && announcements.value.length > 0 && _isCacheValid(_fetchedAt.value)) {
      return; // Serve from cache
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await announcementService.getAnnouncements();
      announcements.value = response.data;
      _fetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch announcements';
    } finally {
      isLoading.value = false;
    }
  };

  const createAnnouncement = async (data) => {
    try {
      const response = await announcementService.createAnnouncement(data);
      announcements.value.unshift(response.data); // Add to top
      _fetchedAt.value = 0; // Invalidate
    } catch (err) {
      error.value = err.message || 'Failed to create announcement';
      throw err;
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await announcementService.deleteAnnouncement(id);
      announcements.value = announcements.value.filter(a => a.id !== id);
      _fetchedAt.value = 0; // Invalidate
    } catch (err) {
      error.value = err.message || 'Failed to delete announcement';
      throw err;
    }
  };

  const invalidateCache = () => {
    _fetchedAt.value = 0;
  };

  return {
    announcements,
    isLoading,
    error,
    fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    invalidateCache,
  };
});

export default useAnnouncementStore;
