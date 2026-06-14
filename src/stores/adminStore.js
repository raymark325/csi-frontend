import { defineStore } from 'pinia';
import { ref } from 'vue';
import { adminService } from '../services/adminService';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export const useAdminStore = defineStore('admin', () => {
  const users = ref([]);
  const courses = ref([]);
  
  const isLoading = ref(false);
  const error = ref(null);

  const _usersFetchedAt = ref(0);
  const _coursesFetchedAt = ref(0);

  const _isCacheValid = (timestamp) => {
    return timestamp && (Date.now() - timestamp < CACHE_TTL);
  };

  // ── Users ────────────────────────────────────────────────────────────
  const fetchUsers = async (force = false) => {
    if (!force && users.value.length > 0 && _isCacheValid(_usersFetchedAt.value)) {
      return; // Serve from cache
    }
    isLoading.value = true;
    error.value = null;
    try {
      const res = await adminService.getUsers();
      users.value = res.data;
      _usersFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch users';
    } finally {
      isLoading.value = false;
    }
  };

  const createUser = async (data) => {
    try {
      const res = await adminService.createUser(data);
      users.value.unshift(res.data);
      _usersFetchedAt.value = 0; // invalidate
    } catch (err) {
      error.value = err.message || 'Failed to create user';
      throw err;
    }
  };

  const updateUser = async (id, data) => {
    try {
      const res = await adminService.updateUser(id, data);
      const index = users.value.findIndex(u => u.id === id);
      if (index !== -1) {
        users.value[index] = res.data;
      }
      _usersFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to update user';
      throw err;
    }
  };

  const deleteUser = async (id) => {
    try {
      await adminService.deleteUser(id);
      users.value = users.value.filter(u => u.id !== id);
      _usersFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to delete user';
      throw err;
    }
  };

  // ── Courses ──────────────────────────────────────────────────────────
  const fetchCourses = async (force = false) => {
    if (!force && courses.value.length > 0 && _isCacheValid(_coursesFetchedAt.value)) {
      return; // Serve from cache
    }
    isLoading.value = true;
    error.value = null;
    try {
      const res = await adminService.getCourses();
      courses.value = res.data;
      _coursesFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch courses';
    } finally {
      isLoading.value = false;
    }
  };

  const createCourse = async (data) => {
    try {
      const res = await adminService.createCourse(data);
      courses.value.unshift(res.data);
      _coursesFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to create course';
      throw err;
    }
  };

  const updateCourse = async (id, data) => {
    try {
      const res = await adminService.updateCourse(id, data);
      const index = courses.value.findIndex(c => c.id === id);
      if (index !== -1) {
        courses.value[index] = res.data;
      }
      _coursesFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to update course';
      throw err;
    }
  };

  const deleteCourse = async (id) => {
    try {
      await adminService.deleteCourse(id);
      courses.value = courses.value.filter(c => c.id !== id);
      _coursesFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to delete course';
      throw err;
    }
  };

  // ── Sections ─────────────────────────────────────────────────────────
  const sections = ref([]);
  const _sectionsFetchedAt = ref(0);

  const fetchSections = async (force = false) => {
    if (!force && sections.value.length > 0 && _isCacheValid(_sectionsFetchedAt.value)) {
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const res = await adminService.getSections();
      sections.value = res.data;
      _sectionsFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch sections';
    } finally {
      isLoading.value = false;
    }
  };

  const createSection = async (data) => {
    try {
      const res = await adminService.createSection(data);
      sections.value.unshift(res.data);
      _sectionsFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to create section';
      throw err;
    }
  };

  const updateSection = async (id, data) => {
    try {
      const res = await adminService.updateSection(id, data);
      const index = sections.value.findIndex(s => s.id === id);
      if (index !== -1) {
        sections.value[index] = res.data;
      }
      _sectionsFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to update section';
      throw err;
    }
  };

  const deleteSection = async (id) => {
    try {
      await adminService.deleteSection(id);
      sections.value = sections.value.filter(s => s.id !== id);
      _sectionsFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to delete section';
      throw err;
    }
  };

  return {
    users,
    courses,
    sections,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
  };
});

export default useAdminStore;
