import { defineStore } from 'pinia';
import { ref } from 'vue';
import { commonService } from '../services/commonService';

const CACHE_TTL = 5 * 60 * 1000;       // 5 minutes for dashboards
const CACHE_TTL_LONG = 15 * 60 * 1000; // 15 minutes for sections list

export const useDashboardStore = defineStore('dashboard', () => {
  // Student dashboard
  const studentData = ref({});
  const _studentFetchedAt = ref(0);

  // Teacher dashboard
  const teacherSections = ref([]);
  const _teacherFetchedAt = ref(0);

  // Sections list (shared by many pages)
  const sections = ref([]);
  const _sectionsFetchedAt = ref(0);

  // Shared
  const isLoading = ref(false);
  const error = ref(null);

  const _isCacheValid = (timestamp, ttl = CACHE_TTL) => {
    return timestamp && (Date.now() - timestamp < ttl);
  };

  const fetchStudentDashboard = async (force = false) => {
    if (
      !force &&
      Object.keys(studentData.value).length > 0 &&
      _isCacheValid(_studentFetchedAt.value)
    ) {
      return; // Serve from cache
    }
    isLoading.value = true;
    error.value = null;
    try {
      const res = await commonService.getStudentDashboard();
      studentData.value = res.data;
      _studentFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch student dashboard';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchTeacherDashboard = async (force = false) => {
    if (
      !force &&
      teacherSections.value.length > 0 &&
      _isCacheValid(_teacherFetchedAt.value)
    ) {
      return; // Serve from cache
    }
    isLoading.value = true;
    error.value = null;
    try {
      const res = await commonService.getTeacherDashboard();
      teacherSections.value = res.data.sections;
      _teacherFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch teacher dashboard';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchSections = async (force = false) => {
    if (
      !force &&
      sections.value.length > 0 &&
      _isCacheValid(_sectionsFetchedAt.value, CACHE_TTL_LONG)
    ) {
      return sections.value; // Serve from cache
    }
    try {
      const res = await commonService.getSections();
      sections.value = res.data;
      _sectionsFetchedAt.value = Date.now();
      return sections.value;
    } catch (err) {
      error.value = err.message || 'Failed to fetch sections';
      throw err;
    }
  };

  const invalidateCache = () => {
    _studentFetchedAt.value = 0;
    _teacherFetchedAt.value = 0;
    _sectionsFetchedAt.value = 0;
  };

  return {
    studentData,
    teacherSections,
    sections,
    isLoading,
    error,
    fetchStudentDashboard,
    fetchTeacherDashboard,
    fetchSections,
    invalidateCache,
  };
});

export default useDashboardStore;
