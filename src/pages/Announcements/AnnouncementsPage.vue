<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">COMMUNICATION</p>
        <h1 class="text-display q-my-none">Announcements</h1>
        <p class="text-body q-mt-xs q-mb-none" style="color: var(--text-secondary);">
          Important updates and notices from your instructors and administrators.
        </p>
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          v-if="canCreate"
          color="primary"
          icon="campaign"
          label="New Announcement"
          unelevated
          rounded
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Announcements List -->
    <div v-else class="column q-gutter-md">
      <div v-if="!announcements.length" class="text-center text-muted q-py-xl glass-card">
        <q-icon name="notifications_paused" size="48px" class="q-mb-md opacity-50" />
        <p class="text-subtitle q-mb-none">No announcements found.</p>
        <p class="text-caption">You're all caught up!</p>
      </div>

      <div
        v-for="ann in announcements"
        :key="ann.id"
        class="glass-card q-pa-lg announcement-card"
      >
        <div class="row justify-between items-start q-mb-md">
          <div>
            <h3 class="text-subtitle q-my-none text-weight-bold" style="color: var(--text-primary);">{{ ann.title }}</h3>
            <div class="row items-center q-gutter-sm q-mt-xs text-caption text-muted">
              <span><q-icon name="person" size="14px" class="q-mr-xs"/>{{ ann.author?.name || 'Admin' }}</span>
              <span>&bull;</span>
              <span><q-icon name="schedule" size="14px" class="q-mr-xs"/>{{ formatDate(ann.created_at) }}</span>
              <span v-if="ann.section">&bull;</span>
              <span v-if="ann.section" class="badge badge-blue">
                {{ ann.section.course?.course_code || 'Unknown' }} ({{ ann.section.room || 'No Room' }})
              </span>
              <span v-else class="badge badge-green">
                <q-icon name="public" size="12px" class="q-mr-xs"/>All Students
              </span>
            </div>
          </div>
          <q-btn
            v-if="canDelete(ann)"
            flat
            round
            color="negative"
            icon="delete"
            size="sm"
            @click="confirmDelete(ann)"
          >
            <q-tooltip>Delete Announcement</q-tooltip>
          </q-btn>
        </div>
        <div class="announcement-content">
          {{ ann.content }}
        </div>
      </div>
    </div>

    <!-- Create Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px; border-radius: 12px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6" style="font-weight: 700;">New Announcement</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <q-input
              v-model="newAnnouncement.title"
              label="Title"
              outlined
              dense
              :rules="[val => !!val || 'Title is required']"
            />
            
            <q-select
              v-model="newAnnouncement.section_id"
              :options="sectionOptions"
              label="Target Audience"
              outlined
              dense
              emit-value
              map-options
            />

            <q-input
              v-model="newAnnouncement.content"
              label="Message Content"
              type="textarea"
              outlined
              dense
              rows="5"
              :rules="[val => !!val || 'Content is required']"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="text-primary q-pt-none q-px-md q-pb-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            label="Post Announcement"
            :loading="isSubmitting"
            @click="handleCreate"
            :disable="!newAnnouncement.title || !newAnnouncement.content"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>


  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { useDashboardStore } from '../../stores/dashboardStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useQuasar } from 'quasar';

const authStore = useAuthStore();
const announcementStore = useAnnouncementStore();
const dashboardStore = useDashboardStore();
const $q = useQuasar();

const showCreateDialog = ref(false);
const isSubmitting = ref(false);

const newAnnouncement = ref({
  title: '',
  content: '',
  section_id: null,
});



const isLoading = computed(() => announcementStore.isLoading);
const announcements = computed(() => announcementStore.announcements);

const canCreate = computed(() => {
  return authStore.userRole === 'teacher' || authStore.userRole === 'admin';
});

const sectionOptions = computed(() => {
  const options = [{ label: 'All Students (Global)', value: null }];
  dashboardStore.sections.forEach(s => {
    const courseCode = s.course?.course_code || 'Unknown Course';
    const room = s.room || 'No Room';
    const schedule = s.schedule || 'No Schedule';
    options.push({ label: `${courseCode} (${room} / ${schedule})`, value: s.id });
  });
  return options;
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const canDelete = (ann) => {
  return authStore.userRole === 'admin' || authStore.user?.id === ann.author_id;
};

const openCreateDialog = () => {
  newAnnouncement.value = { title: '', content: '', section_id: null };
  showCreateDialog.value = true;
};

const handleCreate = async () => {
  isSubmitting.value = true;
  try {
    await announcementStore.createAnnouncement(newAnnouncement.value);
    showCreateDialog.value = false;
    $q.notify({ type: 'positive', message: 'Announcement posted successfully!' });
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to post announcement.' });
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (ann) => {
  $q.dialog({
    title: 'Delete Announcement',
    message: `Are you sure you want to delete "${ann.title}"?`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(async () => {
    try {
      await announcementStore.deleteAnnouncement(ann.id);
      $q.notify({ type: 'positive', message: 'Announcement deleted.' });
    } catch (err) {
      $q.notify({ type: 'negative', message: 'Failed to delete announcement.' });
    }
  });
};


onMounted(async () => {
  await announcementStore.fetchAnnouncements();
  if (canCreate.value) {
    dashboardStore.fetchSections();
  }
  // Clear unread announcements badge count upon viewing the page
  if (authStore.userRole === 'student') {
    const notifStore = useNotificationStore();
    const ids = announcementStore.announcements.map(a => a.id);
    notifStore.markAnnouncementsRead(ids);
  }
});
</script>

<style scoped>
.announcement-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid var(--sms-blue);
}
.announcement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}
.announcement-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap; /* preserve line breaks */
}
</style>
