<template>
  <q-dialog v-model="isOpen" position="right" maximized transition-show="slide-left" transition-hide="slide-right">
    <q-card class="column full-height glass-card" style="width: 450px; max-width: 100vw; border-radius: 20px 0 0 20px;">
      
      <!-- List View Header -->
      <q-card-section v-if="!activeSectionId" class="row items-center justify-between q-pb-sm" style="border-bottom: 1px solid rgba(0,0,0,0.05); background: var(--sms-blue);">
        <div class="text-h6 text-white font-weight-bold row items-center">
          <q-icon name="forum" class="q-mr-sm" size="24px" />
          My Class Chats
        </div>
        <q-btn icon="close" flat round dense color="white" v-close-popup />
      </q-card-section>

      <!-- Active Chat Header -->
      <q-card-section v-else class="row items-center justify-between q-pb-sm" style="border-bottom: 1px solid rgba(0,0,0,0.05); background: var(--sms-blue);">
        <div class="text-h6 text-white font-weight-bold row items-center" style="font-size: 16px;">
          <q-btn icon="arrow_back" flat round dense color="white" @click="activeSectionId = null" class="q-mr-sm" />
          {{ activeSectionName }}
        </div>
        <q-btn icon="close" flat round dense color="white" v-close-popup />
      </q-card-section>

      <!-- Content -->
      <div class="col scroll" style="background: #f8fafc;">
        
        <!-- Subject List View -->
        <div v-if="!activeSectionId" class="q-pa-md">
          <div v-if="loading" class="row justify-center q-py-xl">
            <q-spinner-dots size="40px" color="primary" />
          </div>
          <div v-else-if="normalizedCourses.length === 0" class="text-center text-muted q-py-xl">
            You are not enrolled in any subjects yet.
          </div>
          <q-list v-else separator class="bg-white" style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
            <q-item 
              v-for="course in normalizedCourses" 
              :key="course.id" 
              clickable 
              v-ripple
              @click="openChat(course)"
              class="q-pa-md"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" font-size="18px">
                  {{ course.code.substring(0, 2) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold" style="color: var(--text-primary);">{{ course.code }}</q-item-label>
                <q-item-label caption lines="1">{{ course.title }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-5" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Chat Room View -->
        <div v-else class="full-height column">
          <ChatRoom :sectionId="activeSectionId" style="flex: 1;" />
        </div>

      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '../../../stores/auth';
import { useDashboardStore } from '../../../stores/dashboardStore';
import ChatRoom from './ChatRoom.vue';

const isOpen = ref(false);
const activeSectionId = ref(null);
const activeSectionName = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const normalizedCourses = computed(() => {
  if (authStore.user?.role === 'student') {
    const data = dashboardStore.studentData?.sections || [];
    return data.map(sec => ({
      id: sec.id,
      code: `${sec.course || 'Unknown Course'} (${sec.name || sec.section_name || 'TBA'})`, 
      title: sec.course || 'Unknown Course',
    }));
  } else {
    const data = dashboardStore.sections || [];
    return data.map(sec => {
      const title = sec.course?.title || sec.name || 'Unknown Course';
      const sectionName = sec.section?.name || sec.block || 'TBA';
      return {
        id: sec.id,
        code: `${title} (${sectionName})`,
        title: title,
      };
    });
  }
});

const openChat = (course) => {
  activeSectionId.value = course.id;
  activeSectionName.value = course.code;
};

const openModal = async (targetSectionId = null) => {
  isOpen.value = true;
  activeSectionId.value = null; // Reset to list view

  loading.value = true;
  try {
    if (authStore.user?.role === 'student') {
      await dashboardStore.fetchStudentDashboard();
    } else {
      await dashboardStore.fetchSections();
    }

    if (targetSectionId) {
      const course = normalizedCourses.value.find(c => c.id == targetSectionId);
      if (course) {
        openChat(course);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

defineExpose({ openModal });

</script>
