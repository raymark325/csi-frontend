import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { lmsService } from '../services/LMS/lmsService';
import { commonService } from '../services/commonService'; // teacher dashboard
import { announcementService } from '../services/announcementService';
import { useAuthStore } from './auth';

const SEEN_KEY = 'sms_seen_assignment_ids';
const SEEN_ANN_KEY = 'sms_seen_announcement_ids';

export const useNotificationStore = defineStore('notifications', () => {
  // ── Student state ─────────────────────────────────────
  const newAssignmentIds = ref([]);       // unseen new assignment IDs
  const latestAssignments = ref([]);      // all fetched assignments
  const pendingSubmissionCount = ref(0);  // assignments not yet submitted by student

  const newAnnouncementIds = ref([]);     // unseen new announcement IDs
  const latestAnnouncements = ref([]);    // all fetched announcements

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

  const getSeenAnnIds = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(SEEN_ANN_KEY) || '[]'));
    } catch {
      return new Set();
    }
  };

  const saveSeenAnnIds = (idSet) => {
    localStorage.setItem(SEEN_ANN_KEY, JSON.stringify([...idSet]));
  };

  // --- Computed ---
  const unreadAssignmentCount = computed(() => newAssignmentIds.value.length);
  const unreadAnnouncementCount = computed(() => newAnnouncementIds.value.length);

  // ─────────────────────────────────────────────────────
  // STUDENT: check for new assignments + pending submissions
  // ─────────────────────────────────────────────────────
  const checkStudentNotifications = async (onNewAssignment, onNewAnnouncement) => {
    const authStore = useAuthStore();
    const sectionId = authStore.user?.profile?.section_id;

    try {
      const promises = [
        announcementService.getAnnouncements(),
      ];
      if (sectionId) {
        promises.push(lmsService.getAssignments(sectionId));
        promises.push(lmsService.getSubmissions());
      }

      const results = await Promise.all(promises);

      // Index 0 is always announcements
      const annRes = results[0];
      const fetchedAnns = annRes.data || [];
      latestAnnouncements.value = fetchedAnns;

      const seenAnnIds = getSeenAnnIds();
      const unseenAnns = fetchedAnns.filter(a => !seenAnnIds.has(a.id));
      newAnnouncementIds.value = unseenAnns.map(a => a.id);

      if (unseenAnns.length > 0 && seenAnnIds.size > 0 && onNewAnnouncement) {
        onNewAnnouncement(unseenAnns);
      }

      // If we have section-specific data
      if (sectionId && results.length > 2) {
        const assignRes = results[1];
        const subRes = results[2];

        const fetchedAssigns = assignRes.data || [];
        const submissions = subRes.data || [];
        latestAssignments.value = fetchedAssigns;

        const seenAssignIds = getSeenIds();
        const unseenAssigns = fetchedAssigns.filter(a => !seenAssignIds.has(a.id));
        newAssignmentIds.value = unseenAssigns.map(a => a.id);

        if (unseenAssigns.length > 0 && seenAssignIds.size > 0 && onNewAssignment) {
          onNewAssignment(unseenAssigns);
        }

        pendingSubmissionCount.value = fetchedAssigns.filter(a => {
          const sub = submissions.find(s => s.assignment_id === a.id);
          return !sub || sub.status === 'draft';
        }).length;
      } else {
        newAssignmentIds.value = [];
        latestAssignments.value = [];
        pendingSubmissionCount.value = 0;
      }
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
  const startPolling = (onNewAssignment, onNewAnnouncement, intervalMs = 30000) => {
    if (pollInterval) return; // already running
    isPolling.value = true;

    const authStore = useAuthStore();

    const tick = () => {
      const role = authStore.userRole;
      if (role === 'student') {
        checkStudentNotifications(onNewAssignment, onNewAnnouncement);
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

  const markAnnouncementsRead = (annIds) => {
    const seenIds = getSeenAnnIds();
    annIds.forEach(id => seenIds.add(id));
    saveSeenAnnIds(seenIds);
    newAnnouncementIds.value = [];
  };

  // Clear seen storage (e.g. on logout)
  const clearSeenStorage = () => {
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(SEEN_ANN_KEY);
    newAssignmentIds.value = [];
    latestAssignments.value = [];
    newAnnouncementIds.value = [];
    latestAnnouncements.value = [];
    pendingSubmissionCount.value = 0;
    pendingGradingCount.value = 0;
  };

  return {
    // Student
    newAssignmentIds,
    latestAssignments,
    unreadAssignmentCount,
    pendingSubmissionCount,
    newAnnouncementIds,
    latestAnnouncements,
    unreadAnnouncementCount,
    // Teacher
    pendingGradingCount,
    // Shared
    isPolling,
    startPolling,
    stopPolling,
    markAssignmentsRead,
    markAnnouncementsRead,
    clearSeenStorage,
  };
});
