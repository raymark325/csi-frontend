<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">ADMINISTRATION</p>
        <h1 class="text-display q-my-none">Semester Management</h1>
        <p class="text-body q-mt-xs q-mb-none" style="color: var(--text-secondary);">
          Define and manage academic semesters per school year.
        </p>
      </div>
      <q-btn color="primary" icon="add_box" label="Add Semester" unelevated rounded @click="openCreate" />
    </div>

    <!-- Semesters Table -->
    <q-table
      flat
      :rows="semesters"
      :columns="columns"
      row-key="id"
      :loading="loading"
      class="glass-card"
    >
      <template v-slot:body-cell-is_active="props">
        <q-td :props="props">
          <q-badge v-if="props.row.is_active" color="positive" label="Active" rounded />
          <span v-else class="text-grey-5">Inactive</span>
        </q-td>
      </template>

      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <span class="text-weight-bold">{{ props.row.name }}</span>
          <span v-if="props.row.school_year" class="text-grey-6 q-ml-sm text-caption">({{ props.row.school_year }})</span>
        </q-td>
      </template>

      <template v-slot:body-cell-dates="props">
        <q-td :props="props">
          <span v-if="props.row.start_date">
            {{ formatDate(props.row.start_date) }} – {{ formatDate(props.row.end_date) }}
          </span>
          <span v-else class="text-grey-5">—</span>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round color="positive" icon="check_circle" size="sm" @click="setActive(props.row)" :disable="props.row.is_active">
            <q-tooltip>Set as Active</q-tooltip>
          </q-btn>
          <q-btn flat round color="primary" icon="edit" size="sm" @click="openEdit(props.row)">
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Create / Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 440px; border-radius: 14px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6" style="font-weight: 700;">{{ isEditing ? 'Edit Semester' : 'New Semester' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleSave" class="q-gutter-md">
            <q-input
              v-model="form.name"
              label="Semester Name *"
              outlined dense required
              placeholder="e.g. 1st Semester, 2nd Semester, Summer Term"
            />
            <q-input
              v-model="form.school_year"
              label="School Year"
              outlined dense
              placeholder="e.g. 2024-2025"
            />
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input v-model="form.start_date" label="Start Date" outlined dense type="date" />
              </div>
              <div class="col-6">
                <q-input v-model="form.end_date" label="End Date" outlined dense type="date" />
              </div>
            </div>
            <q-toggle v-model="form.is_active" label="Set as Active Semester" color="positive" />
            <div v-if="form.is_active" class="text-caption text-orange">
              <q-icon name="info" size="14px" /> Setting this as active will deactivate the current active semester.
            </div>

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
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import API from '../../services/api';

const $q = useQuasar();
const semesters = ref([]);
const loading   = ref(false);
const showDialog  = ref(false);
const isEditing   = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

const form = ref({
  name: '',
  school_year: '',
  start_date: '',
  end_date: '',
  is_active: false,
});

const columns = [
  { name: 'name',      align: 'left',  label: 'Semester Name',  field: 'name',      sortable: true },
  { name: 'dates',     align: 'left',  label: 'Duration',       field: 'start_date' },
  { name: 'is_active', align: 'center',label: 'Status',         field: 'is_active'  },
  { name: 'actions',   align: 'right', label: 'Actions' },
];

const formatDate = (d) => d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fetchSemesters = async () => {
  loading.value = true;
  try {
    const res = await API.get('/semesters');
    semesters.value = res.data;
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  isEditing.value = false;
  form.value = { name: '', school_year: '', start_date: '', end_date: '', is_active: false };
  showDialog.value = true;
};

const openEdit = (sem) => {
  isEditing.value = true;
  editId.value = sem.id;
  form.value = {
    name: sem.name,
    school_year: sem.school_year || '',
    start_date: sem.start_date || '',
    end_date: sem.end_date || '',
    is_active: sem.is_active,
  };
  showDialog.value = true;
};

const handleSave = async () => {
  isSubmitting.value = true;
  try {
    if (isEditing.value) {
      await API.put(`/semesters/${editId.value}`, form.value);
      $q.notify({ type: 'positive', message: 'Semester updated' });
    } else {
      await API.post('/semesters', form.value);
      $q.notify({ type: 'positive', message: 'Semester created' });
    }
    showDialog.value = false;
    await fetchSemesters();
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || 'Failed to save' });
  } finally {
    isSubmitting.value = false;
  }
};

const setActive = async (sem) => {
  try {
    await API.put(`/semesters/${sem.id}`, { ...sem, is_active: true });
    $q.notify({ type: 'positive', message: `"${sem.name}" is now the active semester.` });
    await fetchSemesters();
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || 'Failed to activate' });
  }
};

const confirmDelete = (sem) => {
  $q.dialog({
    title: 'Delete Semester',
    message: `Delete "${sem.name}"? Courses linked to this semester will be unlinked.`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(async () => {
    try {
      await API.delete(`/semesters/${sem.id}`);
      $q.notify({ type: 'positive', message: 'Semester deleted' });
      await fetchSemesters();
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message || 'Failed to delete' });
    }
  });
};

onMounted(fetchSemesters);
</script>
