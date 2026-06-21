<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">ADMINISTRATION</p>
        <h1 class="text-display q-my-none">Section Management</h1>
        <p class="text-body q-mt-xs q-mb-none" style="color: var(--text-secondary);">
          Create Blocks (Sections) and assign their subjects, teachers, and schedules.
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

      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <span class="text-weight-bold text-primary">{{ props.row.name }}</span>
        </q-td>
      </template>

      <template v-slot:body-cell-adviser="props">
        <q-td :props="props">
          {{ props.row.adviser?.name || 'Unassigned' }}
        </q-td>
      </template>

      <template v-slot:body-cell-subjects_count="props">
        <q-td :props="props">
          <q-badge color="primary">{{ props.row.section_subjects?.length || 0 }} Subjects</q-badge>
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
    <q-dialog v-model="showDialog" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="column full-height" style="background: #f8fafc;">
        <q-card-section class="row items-center q-pb-none" style="background: white; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 16px;">
          <div class="text-h6" style="font-weight: 700;">{{ isEditing ? 'Edit Section' : 'New Section' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="col scroll q-pa-lg">
          <q-form @submit="handleSave" class="q-gutter-md" style="max-width: 800px; margin: 0 auto;">
            
            <div class="glass-card q-pa-lg q-mb-md">
              <div class="text-subtitle1 q-mb-md font-weight-bold" style="color: var(--sms-blue)">Block Information</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input 
                    v-model="formData.name" 
                    label="Section Name (e.g. Grade 11 HUMSS A)" 
                    outlined 
                    dense 
                    required 
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="formData.adviser_id"
                    :options="teacherOptions"
                    label="Assign Adviser (Optional)"
                    outlined
                    dense
                    emit-value
                    map-options
                    clearable
                  />
                </div>
              </div>
            </div>

            <div class="glass-card q-pa-lg">
              <div class="row justify-between items-center q-mb-md">
                <div class="text-subtitle1 font-weight-bold" style="color: var(--sms-blue)">Subjects in this Section</div>
                <q-btn color="primary" outline icon="add" label="Add Subject" size="sm" rounded @click="addSubject" />
              </div>

              <div v-if="formData.subjects.length === 0" class="text-center q-py-lg text-muted">
                No subjects added yet. Click "Add Subject" to begin.
              </div>

              <div v-for="(subject, index) in formData.subjects" :key="index" class="q-mb-lg q-pa-md" style="border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; background: white;">
                <div class="row justify-between items-center q-mb-sm">
                  <div class="text-weight-bold">Subject #{{ index + 1 }}</div>
                  <q-btn flat round dense color="negative" icon="delete" size="sm" @click="removeSubject(index)" />
                </div>
                <div class="row q-col-gutter-sm q-mb-sm">
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="subject.course_id"
                      :options="courseOptions"
                      label="Select Course (Subject)"
                      outlined
                      dense
                      emit-value
                      map-options
                      required
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="subject.teacher_id"
                      :options="teacherOptions"
                      label="Assign Teacher"
                      outlined
                      dense
                      emit-value
                      map-options
                      required
                    />
                  </div>
                </div>
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-md-6">
                    <q-input 
                      v-model="subject.room" 
                      label="Room" 
                      outlined 
                      dense 
                      placeholder="e.g. Room 302"
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input 
                      v-model="subject.schedule" 
                      label="Schedule" 
                      outlined 
                      dense 
                      placeholder="e.g. MWF 9:00AM - 10:30AM"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="row justify-end q-mt-xl q-mb-md">
              <q-btn flat label="Cancel" v-close-popup class="q-mr-sm" size="lg" />
              <q-btn type="submit" unelevated color="primary" :label="isEditing ? 'Save Changes' : 'Create Section'" :loading="isSubmitting" size="lg" rounded />
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
  name: '',
  adviser_id: null,
  subjects: [],
});

const columns = [
  { name: 'name', align: 'left', label: 'Section/Block Name', field: 'name', sortable: true },
  { name: 'adviser', align: 'left', label: 'Adviser', field: row => row.adviser?.name, sortable: true },
  { name: 'subjects_count', align: 'left', label: 'Subjects', field: row => row.section_subjects?.length },
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

const addSubject = () => {
  formData.value.subjects.push({
    course_id: null,
    teacher_id: null,
    room: '',
    schedule: '',
  });
};

const removeSubject = (index) => {
  formData.value.subjects.splice(index, 1);
};

const openCreateDialog = () => {
  isEditing.value = false;
  formData.value = { name: '', adviser_id: null, subjects: [] };
  showDialog.value = true;
};

const openEditDialog = (section) => {
  isEditing.value = true;
  editId.value = section.id;
  formData.value = {
    name: section.name,
    adviser_id: section.adviser_id,
    subjects: (section.section_subjects || section.sectionSubjects || []).map(s => ({
      course_id: s.course_id,
      teacher_id: s.teacher_id,
      room: s.room || '',
      schedule: s.schedule || ''
    })),
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
    message: `Are you sure you want to delete section "${section.name}"? This action cannot be undone and will delete all associated subjects, modules, and assignments.`,
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
