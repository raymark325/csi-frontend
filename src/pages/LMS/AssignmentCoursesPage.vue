<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">LEARNING MANAGEMENT SYSTEM</p>
        <h1 class="text-display q-my-none">My Sections (Assignments)</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Select a section to view and manage assignments.</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="dashboardStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <div v-else class="row q-col-gutter-lg">
      <div v-if="!uniqueSections.length" class="col-12 text-center text-muted q-py-xl glass-card">
        You are not enrolled in or assigned to any sections.
      </div>
      
      <div v-for="section in uniqueSections" :key="section.id" class="col-12 col-md-6 col-lg-4">
        <div class="glass-card q-pa-xl course-card cursor-pointer" @click="goToSection(section.id)">
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
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useDashboardStore } from '../../stores/dashboardStore';

const router = useRouter();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const uniqueSections = computed(() => {
  const map = new Map();
  if (authStore.user?.role === 'student') {
    const data = dashboardStore.studentData?.sections || [];
    data.forEach(sec => {
      const sectionId = sec.section_id || sec.name;
      if (!map.has(sectionId)) map.set(sectionId, { id: sectionId, name: sec.section_name || sec.name || 'General' });
    });
  } else {
    const src = authStore.user?.role === 'teacher' ? dashboardStore.teacherSections : dashboardStore.sections;
    (src || []).forEach(sec => {
      const sectionId = sec.section_id || sec.section?.id;
      if (sectionId && !map.has(sectionId)) map.set(sectionId, { id: sectionId, name: sec.section?.name || 'General' });
    });
  }
  return Array.from(map.values());
});

const goToSection = (sectionId) => {
  router.push(`/assignments/section/${sectionId}/subjects`);
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
