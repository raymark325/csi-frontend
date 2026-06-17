<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">ADMINISTRATION</p>
        <h1 class="text-display q-my-none">User Management</h1>
        <p class="text-body q-mt-xs q-mb-none" style="color: var(--text-secondary);">
          Create, update, and remove users across the system.
        </p>
      </div>
      <q-btn
        color="primary"
        icon="person_add"
        label="Add User"
        unelevated
        rounded
        @click="openCreateDialog"
      />
    </div>

    <!-- Data Table -->
    <q-table
      flat
      :rows="filteredUsers"
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

      <template v-slot:body-cell-role="props">
        <q-td :props="props">
          <q-badge :color="getRoleColor(props.row.role)">
            {{ props.row.role.toUpperCase() }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(props.row)">
            <q-tooltip>Edit User</q-tooltip>
          </q-btn>
          <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)">
            <q-tooltip>Delete User</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px; border-radius: 12px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6" style="font-weight: 700;">{{ isEditing ? 'Edit User' : 'New User' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleSave" class="q-gutter-md">
            <div class="text-subtitle2 q-mb-sm">Account Details</div>
            <q-input v-model="formData.name" label="Full Name (Account)" outlined dense required />
            <q-input v-model="formData.email" label="Email" type="email" outlined dense required />
            <q-input 
              v-model="formData.password" 
              label="Password" 
              type="password" 
              outlined 
              dense 
              :required="!isEditing"
              :hint="isEditing ? 'Leave blank to keep current password' : ''"
            />
            <q-select 
              v-model="formData.role" 
              :options="roleOptions" 
              label="Role" 
              outlined 
              dense 
              emit-value 
              map-options 
              required 
            />

            <q-separator class="q-my-md" />
            <div class="text-subtitle2 q-mb-sm">Profile Details</div>
            
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-4">
                <q-input v-model="formData.first_name" label="First Name" outlined dense required />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="formData.middle_name" label="Middle Name" outlined dense />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="formData.last_name" label="Last Name" outlined dense required />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-6">
                <q-input v-model="formData.contact_number" label="Contact Number" outlined dense />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model="formData.age" label="Age" type="number" outlined dense />
              </div>
            </div>

            <q-input v-model="formData.address" label="Address" type="textarea" rows="2" outlined dense />

            <!-- Section allocation for students -->
            <q-select
              v-if="formData.role === 'student'"
              v-model="formData.section_id"
              :options="sectionOptions"
              label="Assign Section"
              outlined
              dense
              emit-value
              map-options
              clearable
            />

            <div class="row justify-end q-mt-md">
              <q-btn flat label="Cancel" v-close-popup class="q-mr-sm" />
              <q-btn type="submit" unelevated color="primary" :label="isEditing ? 'Update User' : 'Create User'" :loading="isSubmitting" />
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
import { useDashboardStore } from '../../stores/dashboardStore';
import { useQuasar } from 'quasar';

const adminStore = useAdminStore();
const dashboardStore = useDashboardStore();
const $q = useQuasar();

const filter = ref('');
const showDialog = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

const formData = ref({
  name: '',
  email: '',
  password: '',
  role: 'student',
  first_name: '',
  middle_name: '',
  last_name: '',
  suffix: '',
  age: null,
  address: '',
  contact_number: '',
  section_id: null,
});

const roleOptions = [
  { label: 'Student', value: 'student' },
  { label: 'Teacher', value: 'teacher' },
  { label: 'Admin', value: 'admin' },
  { label: 'Registrar', value: 'registrar' }
];

const sectionOptions = computed(() => {
  return dashboardStore.sections.map(s => ({
    label: `${s.course?.course_code || 'Unknown'} - ${s.course?.title || 'Course'} (${s.room || 'TBA'})`,
    value: s.id
  }));
});

const columns = [
  { name: 'name', align: 'left', label: 'Name', field: 'name', sortable: true },
  { name: 'email', align: 'left', label: 'Email', field: 'email', sortable: true },
  { name: 'role', align: 'center', label: 'Role', field: 'role', sortable: true },
  { name: 'section', align: 'left', label: 'Section (if student)', field: row => row.profile?.section?.name || '-' },
  { name: 'actions', align: 'right', label: 'Actions' }
];

const isLoading = computed(() => adminStore.isLoading);
const filteredUsers = computed(() => adminStore.users);

const getRoleColor = (role) => {
  switch(role) {
    case 'admin': return 'negative';
    case 'registrar': return 'orange';
    case 'teacher': return 'primary';
    case 'student': return 'positive';
    default: return 'grey';
  }
};

const openCreateDialog = () => {
  isEditing.value = false;
  formData.value = {
    name: '', email: '', password: '', role: 'student',
    first_name: '', middle_name: '', last_name: '', suffix: '',
    age: null, address: '', contact_number: '', section_id: null
  };
  showDialog.value = true;
};

const openEditDialog = (user) => {
  isEditing.value = true;
  editId.value = user.id;
  formData.value = {
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    first_name: user.profile?.first_name || '',
    middle_name: user.profile?.middle_name || '',
    last_name: user.profile?.last_name || '',
    suffix: user.profile?.suffix || '',
    age: user.profile?.age || null,
    address: user.profile?.address || '',
    contact_number: user.profile?.contact_number || '',
    section_id: user.profile?.section_id || null,
  };
  showDialog.value = true;
};

const handleSave = async () => {
  isSubmitting.value = true;
  try {
    if (isEditing.value) {
      await adminStore.updateUser(editId.value, formData.value);
      $q.notify({ type: 'positive', message: 'User updated successfully' });
    } else {
      await adminStore.createUser(formData.value);
      $q.notify({ type: 'positive', message: 'User created successfully' });
    }
    showDialog.value = false;
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message || 'Failed to save user' });
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = (user) => {
  $q.dialog({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    try {
      await adminStore.deleteUser(user.id);
      $q.notify({ type: 'positive', message: 'User deleted' });
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message || 'Failed to delete' });
    }
  });
};

onMounted(() => {
  adminStore.fetchUsers();
  dashboardStore.fetchSections();
});
</script>
