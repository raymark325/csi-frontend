import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { lmsService } from '../services/LMS/lmsService';
import { commonService } from '../services/commonService'; // teacher dashboard
import { useAuthStore } from './auth';

const SEEN_KEY = 'sms_seen_assignment_ids';

export const useNotificationStore = defineStore('notifications', () => {
  // ── Student state ─────────────────────────────────────
  const newAssignmentIds = ref([]);       // unseen new assignment IDs
  const latestAssignments = ref([]);      // all fetched assignments
  const pendingSubmissionCount = ref(0);  // assignments not yet submitted by student

  // ── Teacher state ─────────────────────────────────────
  const pendingGradingCount = ref(0);     // submissions awaiting grading

  // ── Shared ────────────────────────────────────────────
  const isPolling = ref(false);
  let pollInterval = null;

  // --- Persisted seen set (student only) ---
  const getSeenIds = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
    } catch {
      return new Set();
    }
  };

  const saveSeenIds = (idSet) => {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...idSet]));
  };

  // --- Computed ---
  const unreadAssignmentCount = computed(() => newAssignmentIds.value.length);

  // ─────────────────────────────────────────────────────
  // STUDENT: check for new assignments + pending submissions
  // ─────────────────────────────────────────────────────
  const checkStudentNotifications = async (onNew) => {
    const authStore = useAuthStore();
    const sectionId = authStore.user?.profile?.section_id;
    if (!sectionId) return;

    try {
      // Fetch assignments and submissions in parallel
      const [assignRes, subRes] = await Promise.all([
        lmsService.getAssignments(sectionId),
        lmsService.getSubmissions(),
      ]);

      const fetched = assignRes.data || [];
      const submissions = subRes.data || [];
      latestAssignments.value = fetched;

      // ── Unseen new assignments ──
      const seenIds = getSeenIds();
      const unseen = fetched.filter(a => !seenIds.has(a.id));
      newAssignmentIds.value = unseen.map(a => a.id);

      if (unseen.length > 0 && seenIds.size > 0 && onNew) {
        onNew(unseen);
      }

      // ── Pending submissions count ──
      // Count assignments where there is no submission, or submission is still 'draft'
      pendingSubmissionCount.value = fetched.filter(a => {
        const sub = submissions.find(s => s.assignment_id === a.id);
        return !sub || sub.status === 'draft';
      }).length;

    } catch (err) {
      console.warn('[NotificationStore] Student poll failed:', err?.message);
    }
  };

  // ─────────────────────────────────────────────────────
  // TEACHER: check pending grading count
  // ─────────────────────────────────────────────────────
  const checkTeacherNotifications = async () => {
    try {
      const res = await commonService.getTeacherDashboard();
      const sections = res.data?.sections || [];
      // Sum pending_grading across all sections
      pendingGradingCount.value = sections.reduce((sum, s) => sum + (s.pending_grading || 0), 0);
    } catch (err) {
      console.warn('[NotificationStore] Teacher poll failed:', err?.message);
    }
  };

  // ─────────────────────────────────────────────────────
  // Unified polling starter
  // ─────────────────────────────────────────────────────
  const startPolling = (onNew, intervalMs = 30000) => {
    if (pollInterval) return; // already running
    isPolling.value = true;

    const authStore = useAuthStore();

    const tick = () => {
      const role = authStore.userRole;
      if (role === 'student') {
        checkStudentNotifications(onNew);
      } else if (role === 'teacher' || role === 'admin') {
        checkTeacherNotifications();
      }
    };

    tick(); // immediate first check
    pollInterval = setInterval(tick, intervalMs);
  };

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    isPolling.value = false;
  };

  // Mark all currently visible assignments as seen (clears new-assignment badge)
  const markAssignmentsRead = (assignmentIds) => {
    const seenIds = getSeenIds();
    assignmentIds.forEach(id => seenIds.add(id));
    saveSeenIds(seenIds);
    newAssignmentIds.value = [];
  };

  // Clear seen storage (e.g. on logout)
  const clearSeenStorage = () => {
    localStorage.removeItem(SEEN_KEY);
    newAssignmentIds.value = [];
    latestAssignments.value = [];
    pendingSubmissionCount.value = 0;
    pendingGradingCount.value = 0;
  };

  return {
    // Student
    newAssignmentIds,
    latestAssignments,
    unreadAssignmentCount,
    pendingSubmissionCount,
    // Teacher
    pendingGradingCount,
    // Shared
    isPolling,
    startPolling,
    stopPolling,
    markAssignmentsRead,
    clearSeenStorage,
  };
});
