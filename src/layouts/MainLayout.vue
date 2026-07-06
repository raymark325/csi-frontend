<template>
  <q-layout view="hHh Lpr lFf">

    <!-- ── Top Navigation Bar ──────────────────── -->
    <q-header class="glass-navbar" style="color: var(--text-primary);">
      <q-toolbar class="q-px-sm" style="min-height: 60px;">
        <q-btn
          flat round dense
          icon="menu"
          aria-label="Menu"
          style="color: var(--text-secondary);"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="row items-center q-gutter-xs" style="flex: none; margin: 0 8px 0 8px;">
          <div style="width:30px; height:30px; border-radius:8px; background: linear-gradient(135deg, var(--sms-blue), var(--sms-blue-light)); display:flex; align-items:center; justify-content:center;">
            <q-icon name="school" size="16px" style="color:#fff"/>
          </div>
          <span style="font-weight:800; font-size:15px; color: var(--text-primary);">CSI</span>
          <span class="gt-xs" style="font-weight:400; font-size:13px; color: var(--text-muted);">School System</span>
        </q-toolbar-title>

        <nav class="row items-center q-gutter-xs gt-sm">
          <router-link to="/dashboard" class="nav-link" active-class="nav-link--active">Dashboard</router-link>
        </nav>

        <q-space/>

        <!-- Chat Icon -->
        <q-btn
          flat round dense size="sm"
          icon="chat"
          style="color: var(--text-secondary); margin-right: 8px;"
          @click="globalChatModalRef?.openModal()"
        >
          <q-badge
            v-if="chatStore.totalUnreadCount > 0"
            color="red"
            floating
            rounded
            :label="chatStore.totalUnreadCount > 99 ? '99+' : chatStore.totalUnreadCount"
          />
          <q-tooltip>Class Chats</q-tooltip>
        </q-btn>

        <!-- Notification Bell (student only) -->
        <div v-if="authStore.userRole === 'student'" style="position: relative; margin-right: 8px;" @click.stop>
          <q-btn
            flat round dense size="sm"
            icon="notifications"
            style="color: var(--text-secondary);"
            @click.stop="notifPanelOpen = !notifPanelOpen"
          >
            <q-badge
              v-if="studentBellCount > 0"
              color="red"
              floating
              rounded
              :label="studentBellCount > 99 ? '99+' : studentBellCount"
            />
            <q-tooltip>Notifications</q-tooltip>
          </q-btn>

          <!-- Notification dropdown panel -->
          <div v-if="notifPanelOpen" class="notif-panel" @click.stop>
            <div class="notif-panel-header">
              <span>Notifications</span>
              <q-btn flat dense round icon="close" size="xs" @click="notifPanelOpen = false" style="color: var(--text-secondary);" />
            </div>
            <div v-if="notifStore.unreadAssignmentCount === 0 && notifStore.unreadAnnouncementCount === 0" class="notif-empty">
              <q-icon name="check_circle" size="28px" color="positive" />
              <p>You're all caught up!</p>
            </div>
            <div v-else style="max-height: 350px; overflow-y: auto;">
              <!-- New Announcements -->
              <div
                v-for="annId in notifStore.newAnnouncementIds"
                :key="'ann-' + annId"
                class="notif-item"
                @click="goToAnnouncements"
              >
                <div class="notif-dot" style="background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.6);" />
                <div>
                  <p class="notif-title">{{ getAnnouncementTitle(annId) }}</p>
                  <p class="notif-sub">New announcement posted — tap to view</p>
                </div>
                <q-icon name="chevron_right" size="16px" style="color: var(--text-muted); margin-left: auto;" />
              </div>

              <!-- New Assignments -->
              <div
                v-for="aId in notifStore.newAssignmentIds"
                :key="'assign-' + aId"
                class="notif-item"
                @click="goToAssignments"
              >
                <div class="notif-dot" />
                <div>
                  <p class="notif-title">{{ getAssignmentTitle(aId) }}</p>
                  <p class="notif-sub">New assignment posted — tap to view</p>
                </div>
                <q-icon name="chevron_right" size="16px" style="color: var(--text-muted); margin-left: auto;" />
              </div>
            </div>
            <div v-if="notifStore.unreadAssignmentCount > 0 || notifStore.unreadAnnouncementCount > 0" class="notif-footer">
              <q-btn flat dense label="Mark all as read" size="sm" color="primary" @click="markAllRead" />
            </div>
          </div>
        </div>

        <q-btn
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          round flat size="sm"
          style="color: var(--text-secondary);"
          @click="$q.dark.toggle()"
        >
          <q-tooltip>Toggle Dark Mode</q-tooltip>
        </q-btn>

        <q-btn flat round dense size="md" class="q-ml-xs">
          <q-avatar size="34px">
            <div style="width:100%; height:100%; border-radius:50%; background: linear-gradient(135deg, var(--sms-blue), var(--sms-red)); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff;">
              {{ userInitials }}
            </div>
          </q-avatar>
          <q-menu fit anchor="bottom right" self="top right">
            <q-list style="min-width: 150px;">
              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-negative">Sign Out</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- ── Sidebar ─────────────────────────────── -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="240"
      class="glass-sidebar"
    >
      <div style="padding: 20px 16px;">
        <!-- Logo -->
        <div class="row items-center q-px-md q-pt-md q-pb-md">
          <div style="width:38px; height:38px; border-radius:10px; background: linear-gradient(135deg, var(--sms-blue), var(--sms-blue-light)); display:flex; align-items:center; justify-content:center;">
            <q-icon name="school" size="20px" style="color:#fff"/>
          </div>
          <div class="q-ml-sm">
            <p style="font-weight:800; font-size:16px; color: var(--text-primary); margin:0; line-height:1.1;">CSI</p>
            <p style="font-weight:400; font-size:12px; color: var(--text-muted); margin:0;">Unified Student Services</p>
          </div>
        </div>

        <!-- Navigation Items -->
        <p class="text-label q-mb-sm">NAVIGATION</p>
        <q-list dense>
          <SidebarItem
            v-for="item in navItems"
            :key="item.label"
            v-bind="item"
          />
        </q-list>

        <template v-if="authStore.userRole === 'admin' || authStore.userRole === 'registrar'">
          <hr class="section-divider" style="margin: 20px 0;"/>
          <p class="text-label q-mb-sm">ADMINISTRATION</p>
          <q-list dense>
            <SidebarItem icon="manage_accounts" label="Manage Users" to="/admin/users" />
            <SidebarItem icon="subject" label="Manage Subjects" to="/admin/courses" />
            <SidebarItem icon="calendar_month" label="Manage Semesters" to="/admin/semesters" />
            <SidebarItem icon="class" label="Manage Sections" to="/admin/sections" />
            <SidebarItem icon="settings" label="System Settings" to="/admin/settings" />
          </q-list>
        </template>
      </div>
    </q-drawer>

    <!-- ── Page Content ─────────────────────────── -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <GlobalChatModal ref="globalChatModalRef" />
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notificationStore'
import { useChatStore } from '../stores/chatStore'
import SidebarItem from '@/components/ui/SidebarItem.vue'
import GlobalChatModal from '@/components/LMS/Chat/GlobalChatModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const notifStore = useNotificationStore()
const chatStore = useChatStore()
const $q = useQuasar()

const leftDrawerOpen = ref(false)
const notifPanelOpen = ref(false)
const globalChatModalRef = ref(null)

function toggleLeftDrawer() { leftDrawerOpen.value = !leftDrawerOpen.value }

const userInitials = computed(() => {
  if (!authStore.user?.name) return 'AD';
  return authStore.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
});

const getAssignmentTitle = (id) => {
  const found = notifStore.latestAssignments.find(a => a.id === id);
  return found?.title || `Assignment #${id}`;
};

const getAnnouncementTitle = (id) => {
  const found = notifStore.latestAnnouncements.find(a => a.id === id);
  return found?.title || `Announcement #${id}`;
};

const goToAssignments = () => {
  notifPanelOpen.value = false;
  router.push('/assignments');
};

const goToAnnouncements = () => {
  notifPanelOpen.value = false;
  router.push('/announcements');
};

const markAllRead = () => {
  if (notifStore.newAssignmentIds.length > 0) {
    notifStore.markAssignmentsRead(notifStore.newAssignmentIds);
  }
  if (notifStore.newAnnouncementIds.length > 0) {
    notifStore.markAnnouncementsRead(notifStore.newAnnouncementIds);
  }
  notifPanelOpen.value = false;
};

const handleLogout = async () => {
  notifStore.stopPolling();
  notifStore.clearSeenStorage();
  try {
    await authStore.logout();
    router.push('/login');
  } catch (err) {
    console.error(err);
  }
};

// Notification handler: fires only when NEW assignments appear after initial load
const handleNewAssignments = (newOnes) => {
  const count = newOnes.length;
  const firstTitle = newOnes[0]?.title || 'New assignment';

  $q.notify({
    group: 'new-assignment',
    color: 'primary',
    icon: 'assignment',
    message: count === 1
      ? `📋 New assignment: "${firstTitle}"`
      : `📋 ${count} new assignments posted!`,
    caption: 'Click to view your assignments',
    position: 'top-right',
    timeout: 6000,
    actions: [
      {
        label: 'View',
        color: 'white',
        handler: () => router.push('/assignments'),
      },
    ],
  });
};

// Notification handler: fires only when NEW announcements appear after initial load
const handleNewAnnouncements = (newOnes) => {
  const count = newOnes.length;
  const firstTitle = newOnes[0]?.title || 'New announcement';

  $q.notify({
    group: 'new-announcement',
    color: 'positive',
    icon: 'campaign',
    message: count === 1
      ? `📢 New Announcement: "${firstTitle}"`
      : `📢 ${count} new announcements posted!`,
    caption: 'Click to view announcements',
    position: 'top-right',
    timeout: 6000,
    actions: [
      {
        label: 'View',
        color: 'white',
        handler: () => router.push('/announcements'),
      },
    ],
  });
};

// Badge counts
const studentBellCount = computed(() =>
  notifStore.unreadAssignmentCount + notifStore.unreadAnnouncementCount + notifStore.pendingSubmissionCount
);

// Nav items — pass correct badge count per role
const navItems = computed(() => {
  const role = authStore.userRole;

  if (role === 'student') {
    return [
      { icon: 'dashboard',  label: 'Dashboard',     to: '/dashboard',            badge: 0 },
      { icon: 'campaign',   label: 'Announcements', to: '/announcements',        badge: notifStore.unreadAnnouncementCount },
      { icon: 'menu_book',  label: 'My Modules',    to: '/lms',                  badge: 0 },
      { icon: 'assignment', label: 'My Assignments', to: '/assignments',          badge: notifStore.pendingSubmissionCount },
      { icon: 'code',       label: 'Coding Lab',    to: '/lms/lab',              badge: 0 },
      { icon: 'how_to_reg', label: 'Attendance',    to: '/attendance',            badge: 0 },
      { icon: 'grade',      label: 'My Grades',     to: '/grading',              badge: 0 },
      { icon: 'bar_chart',  label: 'Report Card',   to: '/reports',              badge: 0 },
    ];
  }

  if (role === 'teacher' || role === 'admin') {
    return [
      { icon: 'dashboard',  label: 'Dashboard',      to: '/dashboard',            badge: 0 },
      { icon: 'campaign',   label: 'Announcements',  to: '/announcements',        badge: 0 },
      { icon: 'menu_book',  label: 'LMS Modules',    to: '/lms',                  badge: 0 },
      { icon: 'assignment', label: 'Assignments',    to: '/assignments',          badge: notifStore.pendingGradingCount },
      { icon: 'how_to_reg', label: 'Mark Attendance',to: '/attendance',            badge: 0 },
      { icon: 'grade',      label: 'Gradebook',      to: '/grading',              badge: 0 },
      { icon: 'bar_chart',  label: 'Report Cards',   to: '/reports',              badge: 0 },
    ];
  }

  return [
    { icon: 'dashboard',  label: 'Dashboard',      to: '/dashboard' },
    { icon: 'campaign',   label: 'Announcements',  to: '/announcements' },
    { icon: 'menu_book',  label: 'LMS Modules',    to: '/lms' },
    { icon: 'assignment', label: 'Assignments',    to: '/assignments' },
    { icon: 'how_to_reg', label: 'Mark Attendance',to: '/attendance' },
    { icon: 'grade',      label: 'Gradebook',      to: '/grading' },
    { icon: 'bar_chart',  label: 'Report Cards',   to: '/reports' },
  ];
});

import { watch } from 'vue'
import { useDashboardStore } from '../stores/dashboardStore'

watch(() => authStore.userRole, async (newRole) => {
  if (newRole === 'student' || newRole === 'teacher' || newRole === 'admin') {
    notifStore.startPolling(
      newRole === 'student' ? handleNewAssignments : null,
      newRole === 'student' ? handleNewAnnouncements : null,
      30000
    );

    // Initialize global chat listeners
    try {
      const dashboardStore = useDashboardStore();
      const chatStore = useChatStore();
      
      if (newRole === 'student') {
        await dashboardStore.fetchStudentDashboard();
        const sectionIds = (dashboardStore.studentData?.sections || []).map(s => s.id);
        chatStore.initGlobalListeners(sectionIds);
      } else if (newRole === 'teacher') {
        await dashboardStore.fetchSections(); // Admin/Teacher fetch generic sections
        const sectionIds = dashboardStore.sections.map(s => s.id);
        chatStore.initGlobalListeners(sectionIds);
      }
    } catch (err) {
      console.warn('Failed to init global chat listeners', err);
    }
  }
}, { immediate: true });

onMounted(() => {
  // Close notification panel on outside click
  document.addEventListener('click', () => { notifPanelOpen.value = false; });
  
  // Watch for pending chat open requests (from push notifications)
  watch(() => chatStore.pendingChatOpen, (newSectionId) => {
    if (newSectionId) {
      globalChatModalRef.value?.openModal(newSectionId);
    }
  });
});

onUnmounted(() => {
  notifStore.stopPolling();
  document.removeEventListener('click', () => { notifPanelOpen.value = false; });
});
</script>

<style scoped>
.nav-link {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-base);
}
.nav-link:hover { color: var(--sms-blue); background: rgba(0,122,255,0.08); }
.nav-link--active { color: var(--sms-blue); background: rgba(0,122,255,0.10); font-weight: 600; }

/* Notification panel */
.notif-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: -10px;
  width: 320px;
  max-width: calc(100vw - 32px);
  background: var(--glass-bg, rgba(20,20,30,0.97));
  border: 1px solid var(--border-color, rgba(255,255,255,0.12));
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  z-index: 9999;
  overflow: hidden;
  animation: panel-slide-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes panel-slide-in {
  from { opacity: 0; transform: translateY(-10px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 16px;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}
.notif-empty p { margin: 0; }

.notif-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: background 0.15s;
}
.notif-item:hover { background: rgba(255,255,255,0.05); }
.notif-item:last-child { border-bottom: none; }

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(59,130,246,0.6);
}

.notif-title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.notif-sub {
  margin: 0;
  font-size: 11px;
  color: var(--text-secondary);
}

.notif-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));
  text-align: center;
}
</style>
