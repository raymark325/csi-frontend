import { defineStore } from 'pinia';
import { ref } from 'vue';
import { lmsService } from '../../services/LMS/lmsService';

// Cache TTLs in milliseconds
const CACHE_TTL = 5 * 60 * 1000;       // 5 minutes for lists
const CACHE_TTL_DETAIL = 10 * 60 * 1000; // 10 minutes for single items

export const useLmsStore = defineStore('lms', () => {
  const modules = ref([]);
  const activeModule = ref(null);
  const assignments = ref([]);
  const submissions = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Cache timestamps
  const _modulesFetchedAt = ref(0);
  const _moduleDetailCache = ref({});          // { [id]: timestamp }
  const _assignmentsFetchedFor = ref(null);    // sectionId
  const _assignmentsFetchedAt = ref(0);
  const _submissionsFetchedAt = ref(0);
  const _sectionSubmissionsFetchedFor = ref(null);
  const _sectionSubmissionsFetchedAt = ref(0);

  const _isCacheValid = (timestamp, ttl = CACHE_TTL) => {
    return timestamp && (Date.now() - timestamp < ttl);
  };

  const fetchModules = async (force = false) => {
    if (!force && modules.value.length > 0 && _isCacheValid(_modulesFetchedAt.value)) {
      return; // Serve from cache
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await lmsService.getModules();
      modules.value = response.data;
      _modulesFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch modules';
    } finally {
      isLoading.value = false;
    }
  };

  const fetchMasterModules = async (courseId) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await lmsService.getMasterModules(courseId);
      // Let's store master modules in the same `modules` array for simplicity
      modules.value = response.data;
      // We don't cache master modules as strictly right now
    } catch (err) {
      error.value = err.message || 'Failed to fetch master modules';
    } finally {
      isLoading.value = false;
    }
  };

  // Raw fetch — returns array, doesn't mutate store state (used for per-course lesson lists)
  const fetchMasterModulesRaw = async (courseId) => {
    const response = await lmsService.getMasterModules(courseId);
    return response.data;
  };

  const fetchModuleDetail = async (id, force = false) => {
    if (
      !force &&
      activeModule.value?.id === id &&
      _isCacheValid(_moduleDetailCache.value[id], CACHE_TTL_DETAIL)
    ) {
      return; // Serve from cache
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await lmsService.getModule(id);
      activeModule.value = response.data;
      _moduleDetailCache.value[id] = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch module details';
    } finally {
      isLoading.value = false;
    }
  };

  const createModule = async (data) => {
    try {
      const response = await lmsService.createModule(data);
      modules.value.push(response.data);
      _modulesFetchedAt.value = 0; // Invalidate list cache
    } catch (err) {
      error.value = err.message || 'Failed to create module';
      throw err;
    }
  };

  const duplicateModule = async (id, sectionSubjectId) => {
    try {
      const response = await lmsService.duplicateModule(id, sectionSubjectId);
      modules.value.push(response.data);
      _modulesFetchedAt.value = 0; // Invalidate list cache
      return response.data;
    } catch (err) {
      error.value = err.message || 'Failed to duplicate module';
      throw err;
    }
  };

  const fetchAssignments = async (sectionId, force = false) => {
    if (
      !force &&
      _assignmentsFetchedFor.value === sectionId &&
      assignments.value.length > 0 &&
      _isCacheValid(_assignmentsFetchedAt.value)
    ) {
      return; // Serve from cache
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await lmsService.getAssignments(sectionId);
      assignments.value = response.data;
      _assignmentsFetchedFor.value = sectionId;
      _assignmentsFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch assignments';
    } finally {
      isLoading.value = false;
    }
  };

  const createAssignment = async (data) => {
    try {
      const response = await lmsService.createAssignment(data);
      assignments.value.push(response.data);
      _assignmentsFetchedAt.value = 0; // Invalidate
    } catch (err) {
      error.value = err.message || 'Failed to create assignment';
      throw err;
    }
  };

  const updateAssignment = async (id, data) => {
    try {
      const response = await lmsService.updateAssignment(id, data);
      const idx = assignments.value.findIndex(a => a.id === id);
      if (idx !== -1) assignments.value[idx] = response.data;
      _assignmentsFetchedAt.value = 0; // Invalidate
    } catch (err) {
      error.value = err.message || 'Failed to update assignment';
      throw err;
    }
  };

  const deleteAssignment = async (id) => {
    try {
      await lmsService.deleteAssignment(id);
      assignments.value = assignments.value.filter(a => a.id !== id);
      _assignmentsFetchedAt.value = 0; // Invalidate
    } catch (err) {
      error.value = err.message || 'Failed to delete assignment';
      throw err;
    }
  };

  const fetchStudentSubmissions = async (force = false) => {
    if (!force && submissions.value.length > 0 && _isCacheValid(_submissionsFetchedAt.value)) {
      return; // Serve from cache
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await lmsService.getSubmissions();
      submissions.value = response.data;
      _submissionsFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch submissions';
    } finally {
      isLoading.value = false;
    }
  };

  const fetchSectionSubmissions = async (sectionId, force = false) => {
    if (
      !force &&
      _sectionSubmissionsFetchedFor.value === sectionId &&
      submissions.value.length > 0 &&
      _isCacheValid(_sectionSubmissionsFetchedAt.value)
    ) {
      return; // Serve from cache
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await lmsService.getSectionSubmissions(sectionId);
      submissions.value = response.data;
      _sectionSubmissionsFetchedFor.value = sectionId;
      _sectionSubmissionsFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch section submissions';
    } finally {
      isLoading.value = false;
    }
  };

  const saveDraft = async (data) => {
    try {
      const response = await lmsService.saveDraft(data);
      const idx = submissions.value.findIndex(s => s.assignment_id === data.assignment_id);
      if (idx !== -1) {
        submissions.value[idx] = response.data;
      } else {
        submissions.value.push(response.data);
      }
      // Don't invalidate cache for drafts (auto-save shouldn't cause re-fetches)
    } catch (err) {
      // Draft saves fail silently (offline fallback handled in component)
      throw err;
    }
  };

  const submitAssignment = async (data) => {
    try {
      const response = await lmsService.submitAssignment(data);
      const idx = submissions.value.findIndex(s => s.assignment_id === data.assignment_id);
      if (idx !== -1) {
        submissions.value[idx] = response.data;
      } else {
        submissions.value.push(response.data);
      }
      _submissionsFetchedAt.value = 0; // Invalidate submissions cache
    } catch (err) {
      error.value = err.message || 'Failed to submit assignment';
      throw err;
    }
  };

  const gradeSubmission = async (id, score, feedback) => {
    try {
      const response = await lmsService.gradeSubmission(id, score, feedback);
      const idx = submissions.value.findIndex(s => s.id === id);
      if (idx !== -1) {
        submissions.value[idx] = response.data;
      }
      _submissionsFetchedAt.value = 0;
      _sectionSubmissionsFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to grade submission';
      throw err;
    }
  };

  /**
   * Invalidate all LMS caches – useful when external data changes.
   */
  const invalidateCache = () => {
    _modulesFetchedAt.value = 0;
    _moduleDetailCache.value = {};
    _assignmentsFetchedAt.value = 0;
    _submissionsFetchedAt.value = 0;
    _sectionSubmissionsFetchedAt.value = 0;
  };

  return {
    modules,
    activeModule,
    assignments,
    submissions,
    isLoading,
    error,
    fetchModules,
    fetchMasterModules,
    fetchMasterModulesRaw,
    fetchModuleDetail,
    createModule,
    duplicateModule,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    fetchStudentSubmissions,
    fetchSectionSubmissions,
    saveDraft,
    submitAssignment,
    gradeSubmission,
    invalidateCache,
  };
});
export default useLmsStore;
