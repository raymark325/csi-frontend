import { defineStore } from 'pinia';
import { ref } from 'vue';
import { attendanceService } from '../../services/Attendance/attendanceService';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useAttendanceStore = defineStore('attendance', () => {
  const history = ref([]);
  const sectionAttendance = ref([]);
  const studentHistory = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Cache timestamps
  const _historyFetchedAt = ref(0);
  const _sectionFetchedFor = ref(null);    // { sectionId, date }
  const _sectionFetchedAt = ref(0);
  const _studentHistoryFetchedFor = ref(null);
  const _studentHistoryFetchedAt = ref(0);

  const _isCacheValid = (timestamp) => {
    return timestamp && (Date.now() - timestamp < CACHE_TTL);
  };

  const fetchHistory = async (force = false) => {
    if (!force && history.value.length > 0 && _isCacheValid(_historyFetchedAt.value)) {
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await attendanceService.getHistory();
      history.value = response.data;
      _historyFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch attendance history';
    } finally {
      isLoading.value = false;
    }
  };

  const fetchStudentHistory = async (enrollmentId, force = false) => {
    if (
      !force &&
      _studentHistoryFetchedFor.value === enrollmentId &&
      studentHistory.value &&
      _isCacheValid(_studentHistoryFetchedAt.value)
    ) {
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await attendanceService.getStudentHistory(enrollmentId);
      studentHistory.value = response.data;
      _studentHistoryFetchedFor.value = enrollmentId;
      _studentHistoryFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch student attendance history';
    } finally {
      isLoading.value = false;
    }
  };

  const fetchSectionAttendance = async (sectionId, date = null, force = false) => {
    const cacheMatch =
      _sectionFetchedFor.value?.sectionId === sectionId &&
      _sectionFetchedFor.value?.date === date;

    if (!force && cacheMatch && sectionAttendance.value.length > 0 && _isCacheValid(_sectionFetchedAt.value)) {
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await attendanceService.getSectionAttendance(sectionId, date);
      sectionAttendance.value = response.data;
      _sectionFetchedFor.value = { sectionId, date };
      _sectionFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch section attendance';
    } finally {
      isLoading.value = false;
    }
  };

  const markAttendance = async (data) => {
    try {
      const response = await attendanceService.markAttendance(data);
      // Update local state if matching student is present
      const idx = sectionAttendance.value.findIndex(a => a.student_id === data.student_id);
      if (idx !== -1) {
        sectionAttendance.value[idx].status = response.data.data.status;
        sectionAttendance.value[idx].remarks = response.data.data.remarks;
        sectionAttendance.value[idx].marked = true;
      }
      // Invalidate related caches
      _historyFetchedAt.value = 0;
      _studentHistoryFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to mark attendance';
      throw err;
    }
  };

  const invalidateCache = () => {
    _historyFetchedAt.value = 0;
    _sectionFetchedAt.value = 0;
    _studentHistoryFetchedAt.value = 0;
  };

  return {
    history,
    sectionAttendance,
    studentHistory,
    isLoading,
    error,
    fetchHistory,
    fetchStudentHistory,
    fetchSectionAttendance,
    markAttendance,
    invalidateCache,
  };
});
export default useAttendanceStore;
