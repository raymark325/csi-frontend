<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-md">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">LEARNING MANAGEMENT SYSTEM</p>
        <h1 class="text-display q-my-none">{{ sectionName }}</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Manage your subjects for this section.</p>
      </div>
      
      <q-btn flat no-caps color="primary" icon="arrow_back" label="Back to Sections" to="/lms" />
    </div>

    <!-- Loading -->
    <div v-if="dashboardStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Subjects -->
    <div v-else class="row q-col-gutter-lg q-mt-md">
      <div v-if="!sectionSubjects.length" class="col-12 text-center text-muted q-py-xl glass-card">
        No subjects found for this section.
      </div>
      
      <div v-for="course in sectionSubjects" :key="course.id" class="col-12 col-md-6 col-lg-4">
        <div class="glass-card q-pa-xl course-card cursor-pointer" @click="goToCourse(course.id)">
          <div class="row items-center q-mb-md q-gutter-sm">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(0,122,255,0.1); display: flex; align-items: center; justify-content: center;">
              <q-icon name="menu_book" color="primary" size="24px" />
            </div>
          </div>
          <h3 class="q-mt-none q-mb-xs" style="font-size: 20px; font-weight: 700; color: var(--text-primary);">
            {{ course.title }}
          </h3>
          <p class="text-body text-secondary q-mb-md" style="font-size: 14px; line-height: 1.5;">
            {{ course.code }}
          </p>
          <div class="row justify-between items-center">
            <span class="badge" style="background: rgba(0,0,0,0.05); color: var(--text-secondary);">
              <q-icon name="meeting_room" size="12px" class="q-mr-xs"/>
              {{ course.room }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useDashboardStore } from '../../stores/dashboardStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const sectionId = computed(() => {
  const val = route.params.section_id;
  // Student section_id might be the name (if it's a fallback string), but we parse if int.
  return isNaN(parseInt(val)) ? val : parseInt(val);
});

const sectionName = computed(() => {
  if (sectionSubjects.value.length > 0) {
    return sectionSubjects.value[0].sectionName;
  }
  return 'Section Subjects';
});

const sectionSubjects = computed(() => {
  if (authStore.user?.role === 'student') {
    const data = dashboardStore.studentData?.sections || [];
    return data
      .filter(sec => sec.section_id === sectionId.value || sec.name === sectionId.value)
      .map(sec => ({
        id: sec.id, // This is section_subject_id
        code: sec.course_code || 'Unknown Course',
        title: sec.course || 'Unknown Course',
        room: sec.room || 'TBA',
        sectionName: sec.section_name || sec.name || 'General'
      }));
  } else {
    const data = dashboardStore.sections || [];
    return data
      .filter(sec => sec.section_id === sectionId.value || sec.section?.id === sectionId.value)
      .map(sec => ({
        id: sec.id, // section_subject_id
        code: sec.course?.course_code || 'Unknown Course',
        title: sec.course?.title || 'Unknown Course',
        room: sec.room || 'TBA',
        sectionName: sec.section?.name || 'General'
      }));
  }
});

const goToCourse = (id) => {
  router.push(`/lms/course/${id}`);
};

onMounted(async () => {
  if (authStore.user?.role === 'student' && !dashboardStore.studentData?.sections) {
    await dashboardStore.fetchStudentDashboard();
  } else if (!dashboardStore.sections || dashboardStore.sections.length === 0) {
    await dashboardStore.fetchSections();
  }
});
</script>

<style scoped>
.course-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-bottom: 4px solid var(--sms-blue);
  height: 100%;
}
.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}
</style>
