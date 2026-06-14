import { defineStore } from 'pinia';
import { ref } from 'vue';
import { gradeService } from '../../services/GradingSystem/gradeService';

const CACHE_TTL = 5 * 60 * 1000;        // 5 minutes
const CACHE_TTL_LONG = 10 * 60 * 1000;  // 10 minutes for categories

export const useGradeStore = defineStore('grade', () => {
  const studentGrades = ref([]);
  const gradebook = ref([]);
  const categories = ref([]);
  const reportCard = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Cache timestamps
  const _studentGradesFetchedAt = ref(0);
  const _gradebookFetchedFor = ref(null);
  const _gradebookFetchedAt = ref(0);
  const _categoriesFetchedFor = ref(null);
  const _categoriesFetchedAt = ref(0);
  const _reportCardFetchedFor = ref(null);
  const _reportCardFetchedAt = ref(0);

  const _isCacheValid = (timestamp, ttl = CACHE_TTL) => {
    return timestamp && (Date.now() - timestamp < ttl);
  };

  const fetchStudentGrades = async (force = false) => {
    if (!force && studentGrades.value.length > 0 && _isCacheValid(_studentGradesFetchedAt.value)) {
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await gradeService.getStudentGrades();
      studentGrades.value = response.data;
      _studentGradesFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch student grades';
    } finally {
      isLoading.value = false;
    }
  };

  const fetchSectionGradebook = async (sectionId, force = false) => {
    if (
      !force &&
      _gradebookFetchedFor.value === sectionId &&
      gradebook.value.length > 0 &&
      _isCacheValid(_gradebookFetchedAt.value)
    ) {
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await gradeService.getSectionGradebook(sectionId);
      categories.value = response.data.categories;
      gradebook.value = response.data.gradebook;
      _gradebookFetchedFor.value = sectionId;
      _gradebookFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch section gradebook';
    } finally {
      isLoading.value = false;
    }
  };

  const fetchCategories = async (sectionId, force = false) => {
    if (
      !force &&
      _categoriesFetchedFor.value === sectionId &&
      categories.value.length > 0 &&
      _isCacheValid(_categoriesFetchedAt.value, CACHE_TTL_LONG)
    ) {
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await gradeService.getCategories(sectionId);
      categories.value = response.data;
      _categoriesFetchedFor.value = sectionId;
      _categoriesFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch categories';
    } finally {
      isLoading.value = false;
    }
  };

  const inputGrade = async (data) => {
    try {
      await gradeService.inputManualGrade(data);
      // Invalidate grade-related caches
      _studentGradesFetchedAt.value = 0;
      _gradebookFetchedAt.value = 0;
      _reportCardFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to save grade';
      throw err;
    }
  };

  const createCategory = async (data) => {
    try {
      const response = await gradeService.createCategory(data);
      categories.value.push(response.data);
      _categoriesFetchedAt.value = 0;
      _gradebookFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to create category';
      throw err;
    }
  };

  const updateCategory = async (id, data) => {
    try {
      const response = await gradeService.updateCategory(id, data);
      const idx = categories.value.findIndex(c => c.id === id);
      if (idx !== -1) {
        categories.value[idx] = response.data;
      }
      _categoriesFetchedAt.value = 0;
      _gradebookFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to update category';
      throw err;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await gradeService.deleteCategory(id);
      categories.value = categories.value.filter(c => c.id !== id);
      _categoriesFetchedAt.value = 0;
      _gradebookFetchedAt.value = 0;
    } catch (err) {
      error.value = err.message || 'Failed to delete category';
      throw err;
    }
  };

  const fetchReportCard = async (studentId = null, force = false) => {
    if (
      !force &&
      _reportCardFetchedFor.value === studentId &&
      reportCard.value &&
      _isCacheValid(_reportCardFetchedAt.value)
    ) {
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await gradeService.getReportCard(studentId);
      reportCard.value = response.data;
      _reportCardFetchedFor.value = studentId;
      _reportCardFetchedAt.value = Date.now();
    } catch (err) {
      error.value = err.message || 'Failed to fetch report card';
    } finally {
      isLoading.value = false;
    }
  };

  const invalidateCache = () => {
    _studentGradesFetchedAt.value = 0;
    _gradebookFetchedAt.value = 0;
    _categoriesFetchedAt.value = 0;
    _reportCardFetchedAt.value = 0;
  };

  return {
    studentGrades,
    gradebook,
    categories,
    reportCard,
    isLoading,
    error,
    fetchStudentGrades,
    fetchSectionGradebook,
    fetchCategories,
    inputGrade,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchReportCard,
    invalidateCache,
  };
});
export default useGradeStore;
