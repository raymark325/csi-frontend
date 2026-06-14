<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">ADMINISTRATION</p>
        <h1 class="text-display q-my-none">Course Management</h1>
        <p class="text-body q-mt-xs q-mb-none" style="color: var(--text-secondary);">
          Create, update, and remove courses (subjects).
        </p>
      </div>
      <q-btn
        color="primary"
        icon="add_box"
        label="Add Course"
        unelevated
        rounded
        @click="openCreateDialog"
      />
    </div>

    <!-- Data Table -->
    <q-table
      flat
      :rows="filteredCourses"
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

      <template v-slot:body-cell-course_code="props">
        <q-td :props="props">
          <span class="text-weight-bold text-primary">{{ props.row.course_code }}</span>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(props.row)">
            <q-tooltip>Edit Course</q-tooltip>
          </q-btn>
          <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)">
            <q-tooltip>Delete Course</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 400px; border-radius: 12px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6" style="font-weight: 700;">{{ isEditing ? 'Edit Course' : 'New Course' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleSave" class="q-gutter-md">
            <q-input 
              v-model="formData.course_code" 
              label="Course Code (e.g. MATH101)" 
              outlined 
              dense 
              required 
            />
            <q-input 
              v-model="formData.title" 
              label="Course Title" 
              outlined 
              dense 
              required 
            />
            <q-input 
              v-model="formData.description" 
              label="Description" 
              type="textarea"
              rows="3"
              outlined 
              dense 
            />

            <div class="row justify-end q-mt-md">
              <q-btn flat label="Cancel" v-close-popup class="q-mr-sm" />
              <q-btn type="submit" unelevated color="primary" :label="isEditing ? 'Update' : 'Create'" :loading="isSubmitting" />
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
  course_code: '',
  title: '',
  description: '',
});

const columns = [
  { name: 'course_code', align: 'left', label: 'Code', field: 'course_code', sortable: true },
  { name: 'title', align: 'left', label: 'Title', field: 'title', sortable: true },
  { name: 'description', align: 'left', label: 'Description', field: 'description' },
  { name: 'actions', align: 'right', label: 'Actions' }
];

const isLoading = computed(() => adminStore.isLoading);
const filteredCourses = computed(() => adminStore.courses);

const openCreateDialog = () => {
  isEditing.value = false;
  formData.value = { course_code: '', title: '', description: '' };
  showDialog.value = true;
};

const openEditDialog = (course) => {
  isEditing.value = true;
  editId.value = course.id;
  formData.value = {
    course_code: course.course_code,
    title: course.title,
    description: course.description || '',
  };
  showDialog.value = true;
};

const handleSave = async () => {
  isSubmitting.value = true;
  try {
    if (isEditing.value) {
      await adminStore.updateCourse(editId.value, formData.value);
      $q.notify({ type: 'positive', message: 'Course updated successfully' });
    } else {
      await adminStore.createCourse(formData.value);
      $q.notify({ type: 'positive', message: 'Course created successfully' });
    }
    showDialog.value = false;
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || 'Failed to save course' });
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (course) => {
  $q.dialog({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete course "${course.course_code}"? This will delete associated sections and grades.`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    try {
      await adminStore.deleteCourse(course.id);
      $q.notify({ type: 'positive', message: 'Course deleted' });
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message || 'Failed to delete' });
    }
  });
};

onMounted(() => {
  adminStore.fetchCourses();
});
</script>
