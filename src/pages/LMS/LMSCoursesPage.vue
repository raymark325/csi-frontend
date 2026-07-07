<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-md">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">LEARNING MANAGEMENT SYSTEM</p>
        <h1 class="text-display q-my-none">My Subjects & Sections</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Manage your master lessons and section-specific modules.</p>
      </div>
    </div>

    <q-tabs
      v-if="authStore.user?.role === 'teacher' || authStore.user?.role === 'admin'"
      v-model="activeTab"
      dense
      class="text-grey q-mb-xl"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="subjects" label="Subject Master Resources" />
      <q-tab name="sections" label="My Sections" />
    </q-tabs>

    <!-- Loading -->
    <div v-if="dashboardStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <q-tab-panels v-else v-model="activeTab" animated style="background: transparent;">
      <!-- Master Subjects Tab -->
      <q-tab-panel name="subjects" class="q-pa-none">
        <div class="row q-col-gutter-lg">
          <div v-if="!uniqueCourses.length" class="col-12 text-center text-muted q-py-xl glass-card">
            No subjects found.
          </div>
          <div v-for="course in uniqueCourses" :key="course.id" class="col-12 col-md-6 col-lg-4">
            <div class="glass-card q-pa-xl course-card cursor-pointer" @click="goToMasterCourse(course.id)">
              <div class="row items-center q-mb-md q-gutter-sm">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(0,122,255,0.1); display: flex; align-items: center; justify-content: center;">
                  <q-icon name="folder_special" color="primary" size="24px" />
                </div>
              </div>
              <h3 class="q-mt-none q-mb-xs" style="font-size: 20px; font-weight: 700; color: var(--text-primary);">
                {{ course.code }}
              </h3>
              <p class="text-body text-secondary q-mb-md" style="font-size: 14px; line-height: 1.5;">
                {{ course.title }}
              </p>
              <div class="row justify-between items-center">
                <span class="badge badge-blue">
                  <q-icon name="inventory" size="12px" class="q-mr-xs"/>
                  Master Resource Bank
                </span>
              </div>
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- Sections Tab -->
      <q-tab-panel name="sections" class="q-pa-none">
        <div v-if="!uniqueSections.length" class="col-12 text-center text-muted q-py-xl glass-card">
          You are not enrolled in or assigned to any sections.
        </div>
        
        <div class="row q-col-gutter-lg">
          <div v-for="section in uniqueSections" :key="section.id" class="col-12 col-md-6 col-lg-4">
            <div class="glass-card q-pa-xl course-card cursor-pointer" @click="goToSectionSubjects(section.id)">
              <div class="row items-center q-mb-md q-gutter-sm">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(0,122,255,0.1); display: flex; align-items: center; justify-content: center;">
                  <q-icon name="groups" color="primary" size="24px" />
                </div>
              </div>
              <h3 class="q-mt-none q-mb-xs" style="font-size: 20px; font-weight: 700; color: var(--text-primary);">
                {{ section.name }}
              </h3>
              
              <div class="row justify-between items-center q-mt-md">
                <span class="text-caption text-secondary" style="font-weight: 500;">View Subjects</span>
                <q-icon name="arrow_forward" color="primary" size="20px" />
              </div>
            </div>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useDashboardStore } from '../../stores/dashboardStore';

const router = useRouter();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const activeTab = ref(authStore.userRole === 'teacher' || authStore.userRole === 'admin' ? 'subjects' : 'sections');

const uniqueCourses = computed(() => {
  const coursesMap = new Map();
  if (authStore.userRole === 'teacher') {
    (dashboardStore.teacherSections || []).forEach(sec => {
      if (sec.course && !coursesMap.has(sec.course.id)) {
        coursesMap.set(sec.course.id, {
          id: sec.course.id,
          code: sec.course.course_code,
          title: sec.course.title
        });
      }
    });
  } else if (authStore.userRole === 'admin') {
    (dashboardStore.sections || []).forEach(sec => {
      if (sec.course && !coursesMap.has(sec.course.id)) {
        coursesMap.set(sec.course.id, {
          id: sec.course.id,
          code: sec.course.course_code,
          title: sec.course.title
        });
      }
    });
  }
  return Array.from(coursesMap.values());
});

const uniqueSections = computed(() => {
  const map = new Map();
  if (authStore.user?.role === 'student') {
    const data = dashboardStore.studentData?.sections || [];
    data.forEach(sec => {
      const sectionId = sec.section_id || sec.name;
      if (!map.has(sectionId)) {
        map.set(sectionId, {
          id: sectionId,
          name: sec.section_name || sec.name || 'General'
        });
      }
    });
  } else {
    const data = dashboardStore.sections || [];
    data.forEach(sec => {
      const sectionId = sec.section_id || sec.section?.id;
      if (sectionId && !map.has(sectionId)) {
        map.set(sectionId, {
          id: sectionId,
          name: sec.section?.name || 'General'
        });
      }
    });
  }
  return Array.from(map.values());
});

const goToCourse = (sectionId) => {
  router.push(`/lms/course/${sectionId}`);
};

const goToSectionSubjects = (sectionId) => {
  router.push(`/lms/section/${sectionId}/subjects`);
};

const goToMasterCourse = (courseId) => {
  router.push(`/lms/master-course/${courseId}`);
};

onMounted(async () => {
  if (authStore.user?.role === 'student') {
    await dashboardStore.fetchStudentDashboard();
  } else if (authStore.user?.role === 'teacher') {
    await dashboardStore.fetchTeacherDashboard();
  } else {
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
