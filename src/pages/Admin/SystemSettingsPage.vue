<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">SYSTEM CONFIGURATION</p>
        <h1 class="text-display q-my-none">System Settings</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Manage global settings, maintenance mode, and compiler restrictions.</p>
      </div>
    </div>

    <!-- Maintenance Mode Settings -->
    <div class="glass-card q-mb-md q-pa-lg">
      <div class="row items-center justify-between">
        <div class="col-12 col-md-8">
          <h2 class="text-h6 text-primary q-mb-xs">Maintenance Mode</h2>
          <p class="text-body2 text-muted q-my-none">
            When enabled, all non-admin users will be redirected to the maintenance page. 
            Admins will still be able to access the system normally.
          </p>
        </div>
        <div class="col-12 col-md-4 text-right q-mt-md q-mt-md-none">
          <q-toggle
            v-model="isMaintenanceEnabled"
            color="negative"
            label="Enable Maintenance Mode"
            left-label
            size="lg"
            :disable="isLoading"
            @update:model-value="toggleMaintenance"
          />
        </div>
      </div>
    </div>

    <!-- Coding Lab Compiler Settings -->
    <div class="glass-card q-mb-md q-pa-lg">
      <div class="q-mb-md">
        <h2 class="text-h6 text-primary q-mb-xs">Coding Lab Compiler Access</h2>
        <p class="text-body2 text-muted q-my-none">
          Enable or disable and hide specific compilers in the Coding Lab globally or for specific sections.
        </p>
      </div>

      <q-separator class="q-my-md" style="background: rgba(0,0,0,0.05)" />

      <!-- Global Settings -->
      <div class="q-mb-lg">
        <div class="text-subtitle1 font-weight-bold q-mb-sm text-secondary">Global Compiler Settings</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <div class="row items-center justify-between q-pa-md rounded-md" style="border: 1px solid rgba(0,0,0,0.05); background: white;">
              <div>
                <div class="text-weight-bold text-dark">Java Compiler</div>
                <div class="text-caption text-muted">Global switch</div>
              </div>
              <q-toggle v-model="isJavaGlobalEnabled" color="primary" />
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="row items-center justify-between q-pa-md rounded-md" style="border: 1px solid rgba(0,0,0,0.05); background: white;">
              <div>
                <div class="text-weight-bold text-dark">SQL Playground</div>
                <div class="text-caption text-muted">Global switch</div>
              </div>
              <q-toggle v-model="isSqlGlobalEnabled" color="warning" />
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="row items-center justify-between q-pa-md rounded-md" style="border: 1px solid rgba(0,0,0,0.05); background: white;">
              <div>
                <div class="text-weight-bold text-dark">HTML/CSS Live</div>
                <div class="text-caption text-muted">Global switch</div>
              </div>
              <q-toggle v-model="isHtmlGlobalEnabled" color="success" />
            </div>
          </div>
        </div>
      </div>

      <!-- Section Specific Settings -->
      <div class="q-mb-lg">
        <div class="text-subtitle1 font-weight-bold q-mb-sm text-secondary">Section-Specific Compiler Restrictions</div>
        
        <q-table
          flat
          bordered
          :rows="sections"
          :columns="sectionColumns"
          row-key="id"
          :loading="isLoading"
          class="q-mt-sm"
          style="background: white;"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-java="props">
            <q-td :props="props" align="center">
              <div class="row items-center justify-center">
                <q-toggle
                  :model-value="isSectionCompilerEnabled(props.row.id, 'java')"
                  :disable="!isJavaGlobalEnabled || isLoading"
                  @update:model-value="val => toggleSectionCompiler(props.row.id, 'java', val)"
                  color="primary"
                />
                <q-badge v-if="!isJavaGlobalEnabled" color="grey-5" text-color="dark" label="Globally Disabled" class="q-ml-sm" />
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-sql="props">
            <q-td :props="props" align="center">
              <div class="row items-center justify-center">
                <q-toggle
                  :model-value="isSectionCompilerEnabled(props.row.id, 'sql')"
                  :disable="!isSqlGlobalEnabled || isLoading"
                  @update:model-value="val => toggleSectionCompiler(props.row.id, 'sql', val)"
                  color="warning"
                />
                <q-badge v-if="!isSqlGlobalEnabled" color="grey-5" text-color="dark" label="Globally Disabled" class="q-ml-sm" />
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-html="props">
            <q-td :props="props" align="center">
              <div class="row items-center justify-center">
                <q-toggle
                  :model-value="isSectionCompilerEnabled(props.row.id, 'html')"
                  :disable="!isHtmlGlobalEnabled || isLoading"
                  @update:model-value="val => toggleSectionCompiler(props.row.id, 'html', val)"
                  color="success"
                />
                <q-badge v-if="!isHtmlGlobalEnabled" color="grey-5" text-color="dark" label="Globally Disabled" class="q-ml-sm" />
              </div>
            </q-td>
          </template>
        </q-table>
      </div>

      <!-- Action Button -->
      <div class="row justify-end q-mt-md">
        <q-btn
          color="primary"
          icon="save"
          label="Save Compiler Settings"
          rounded
          unelevated
          :loading="isSavingCompilers"
          @click="saveCompilerSettings"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import API from '../../services/api';
import { useAdminStore } from '../../stores/adminStore';

const $q = useQuasar();
const adminStore = useAdminStore();

const isMaintenanceEnabled = ref(false);
const isLoading = ref(true);
const isSavingCompilers = ref(false);

const isJavaGlobalEnabled = ref(true);
const isSqlGlobalEnabled = ref(true);
const isHtmlGlobalEnabled = ref(true);

const sectionsDisabledMap = ref({});

const sections = computed(() => adminStore.sections);

const sectionColumns = [
  { name: 'name', align: 'left', label: 'Section/Block Name', field: 'name', sortable: true },
  { name: 'java', align: 'center', label: 'Java Compiler' },
  { name: 'sql', align: 'center', label: 'SQL Playground' },
  { name: 'html', align: 'center', label: 'HTML/CSS Live' },
];

const isSectionCompilerEnabled = (sectionId, compiler) => {
  // If globally disabled, force return false
  if (compiler === 'java' && !isJavaGlobalEnabled.value) return false;
  if (compiler === 'sql' && !isSqlGlobalEnabled.value) return false;
  if (compiler === 'html' && !isHtmlGlobalEnabled.value) return false;

  const disabledList = sectionsDisabledMap.value[sectionId] || [];
  return !disabledList.includes(compiler);
};

const toggleSectionCompiler = (sectionId, compiler, isEnabled) => {
  if (!sectionsDisabledMap.value[sectionId]) {
    sectionsDisabledMap.value[sectionId] = [];
  }
  const list = [...sectionsDisabledMap.value[sectionId]];
  if (isEnabled) {
    sectionsDisabledMap.value[sectionId] = list.filter(c => c !== compiler);
  } else {
    if (!list.includes(compiler)) {
      sectionsDisabledMap.value[sectionId] = [...list, compiler];
    }
  }
};

const fetchSettings = async () => {
  try {
    isLoading.value = true;
    
    // Fetch maintenance status
    const maintenanceResponse = await API.get('/public/settings/maintenance');
    isMaintenanceEnabled.value = maintenanceResponse.maintenance;

    // Fetch compiler settings
    const compilerResponse = await API.get('/settings/compilers');
    const globalDisabled = compilerResponse.global || [];
    isJavaGlobalEnabled.value = !globalDisabled.includes('java');
    isSqlGlobalEnabled.value = !globalDisabled.includes('sql');
    isHtmlGlobalEnabled.value = !globalDisabled.includes('html');

    sectionsDisabledMap.value = compilerResponse.sections || {};

    // Fetch sections
    await adminStore.fetchSections();
  } catch (error) {
    console.error('Failed to fetch settings', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load system settings.',
      position: 'top-right'
    });
  } finally {
    isLoading.value = false;
  }
};

const toggleMaintenance = async (val) => {
  try {
    isLoading.value = true;
    const response = await API.post('/settings/maintenance', { maintenance: val });
    isMaintenanceEnabled.value = response.maintenance;
    
    $q.notify({
      type: val ? 'negative' : 'positive',
      message: response.message || `Maintenance mode ${val ? 'enabled' : 'disabled'}`,
      position: 'top-right'
    });
  } catch (error) {
    console.error('Failed to toggle maintenance', error);
    isMaintenanceEnabled.value = !val;
    $q.notify({
      type: 'negative',
      message: 'Failed to update maintenance mode.',
      position: 'top-right'
    });
  } finally {
    isLoading.value = false;
  }
};

const saveCompilerSettings = async () => {
  try {
    isSavingCompilers.value = true;
    
    const globalDisabled = [];
    if (!isJavaGlobalEnabled.value) globalDisabled.push('java');
    if (!isSqlGlobalEnabled.value) globalDisabled.push('sql');
    if (!isHtmlGlobalEnabled.value) globalDisabled.push('html');

    const payload = {
      global: globalDisabled,
      sections: sectionsDisabledMap.value
    };

    const response = await API.post('/settings/compilers', payload);
    
    // Refresh local state to match response
    const newGlobalDisabled = response.global || [];
    isJavaGlobalEnabled.value = !newGlobalDisabled.includes('java');
    isSqlGlobalEnabled.value = !newGlobalDisabled.includes('sql');
    isHtmlGlobalEnabled.value = !newGlobalDisabled.includes('html');
    sectionsDisabledMap.value = response.sections || {};

    $q.notify({
      type: 'positive',
      message: response.message || 'Compiler settings saved successfully.',
      position: 'top-right'
    });
  } catch (error) {
    console.error('Failed to save compiler settings', error);
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to save compiler settings.',
      position: 'top-right'
    });
  } finally {
    isSavingCompilers.value = false;
  }
};

onMounted(() => {
  fetchSettings();
});
</script>
