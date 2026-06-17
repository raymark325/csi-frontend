<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">ADMINISTRATION</p>
        <h1 class="text-display q-my-none">Section Management</h1>
        <p class="text-body q-mt-xs q-mb-none" style="color: var(--text-secondary);">
          Create classes, assign courses and teachers, and manage room schedules.
        </p>
      </div>
      <q-btn
        color="primary"
        icon="class"
        label="Add Section"
        unelevated
        rounded
        @click="openCreateDialog"
      />
    </div>

    <!-- Data Table -->
    <q-table
      flat
      :rows="filteredSections"
      :columns="columns"
      row-key="id"
      :loading="isLoading"
      class="glass-card"
      :filter="filter"
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body-cell-course="props">
        <q-td :props="props">
          <span class="text-weight-bold text-primary">{{ props.row.course?.course_code || 'Unknown' }}</span>
          <div class="text-caption text-muted">{{ props.row.course?.title }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-teacher="props">
        <q-td :props="props">
          {{ props.row.teacher?.name || 'Unassigned' }}
        </q-td>
      </template>

      <template v-slot:body-cell-schedule="props">
        <q-td :props="props">
          <div><q-icon name="meeting_room" size="14px" class="q-mr-xs"/>{{ props.row.room || 'No Room' }}</div>
          <div class="text-caption text-muted"><q-icon name="schedule" size="14px" class="q-mr-xs"/>{{ props.row.schedule || 'TBA' }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(props.row)">
            <q-tooltip>Edit Section</q-tooltip>
          </q-btn>
          <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)">
            <q-tooltip>Delete Section</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px; border-radius: 12px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6" style="font-weight: 700;">{{ isEditing ? 'Edit Section' : 'New Section' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleSave" class="q-gutter-md">
            
            <q-select
              v-model="formData.course_id"
              :options="courseOptions"
              label="Select Course (Subject)"
              outlined
              dense
              emit-value
              map-options
              required
            />

            <q-select
              v-model="formData.teacher_id"
              :options="teacherOptions"
              label="Assign Teacher"
              outlined
              dense
              emit-value
              map-options
              clearable
            />

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-6">
                <q-input 
                  v-model="formData.room" 
                  label="Room" 
                  outlined 
                  dense 
                  placeholder="e.g. Room 302"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input 
                  v-model="formData.schedule" 
                  label="Schedule" 
                  outlined 
                  dense 
                  placeholder="e.g. MWF 9:00AM - 10:30AM"
                />
              </div>
            </div>

            <div class="row justify-end q-mt-md">
              <q-btn flat label="Cancel" v-close-popup class="q-mr-sm" />
              <q-btn type="submit" unelevated color="primary" :label="isEditing ? 'Update Section' : 'Create Section'" :loading="isSubmitting" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../../stores/adminStore';
import { useQuasar } from 'quasar';

const adminStore = useAdminStore();
const $q = useQuasar();

const filter = ref('');
const showDialog = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

const formData = ref({
  course_id: null,
  teacher_id: null,
  room: '',
  schedule: '',
});

const columns = [
  { name: 'course', align: 'left', label: 'Course', field: row => row.course?.course_code, sortable: true },
  { name: 'teacher', align: 'left', label: 'Teacher', field: row => row.teacher?.name, sortable: true },
  { name: 'schedule', align: 'left', label: 'Room & Schedule', field: 'room' },
  { name: 'actions', align: 'right', label: 'Actions' }
];

const isLoading = computed(() => adminStore.isLoading);
const filteredSections = computed(() => adminStore.sections);

const courseOptions = computed(() => {
  return adminStore.courses.map(c => ({
    label: `${c.course_code} - ${c.title}`,
    value: c.id
  }));
});

const teacherOptions = computed(() => {
  return adminStore.users
    .filter(u => u.role === 'teacher')
    .map(t => ({
      label: t.name,
      value: t.id
    }));
});

const openCreateDialog = () => {
  isEditing.value = false;
  formData.value = { course_id: null, teacher_id: null, room: '', schedule: '' };
  showDialog.value = true;
};

const openEditDialog = (section) => {
  isEditing.value = true;
  editId.value = section.id;
  formData.value = {
    course_id: section.course_id,
    teacher_id: section.teacher_id,
    room: section.room || '',
    schedule: section.schedule || '',
  };
  showDialog.value = true;
};

const handleSave = async () => {
  isSubmitting.value = true;
  try {
    if (isEditing.value) {
      await adminStore.updateSection(editId.value, formData.value);
      $q.notify({ type: 'positive', message: 'Section updated successfully' });
    } else {
      await adminStore.createSection(formData.value);
      $q.notify({ type: 'positive', message: 'Section created successfully' });
    }
    showDialog.value = false;
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || 'Failed to save section' });
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (section) => {
  $q.dialog({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete this section of ${section.course?.course_code}? This action cannot be undone and will delete all associated modules and assignments.`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    try {
      await adminStore.deleteSection(section.id);
      $q.notify({ type: 'positive', message: 'Section deleted' });
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message || 'Failed to delete' });
    }
  });
};

onMounted(() => {
  adminStore.fetchSections();
  adminStore.fetchCourses();
  adminStore.fetchUsers(); // needed for teacher list
});
</script>
