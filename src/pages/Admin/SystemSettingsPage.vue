<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">SYSTEM CONFIGURATION</p>
        <h1 class="text-display q-my-none">System Settings</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Manage global settings and maintenance mode.</p>
      </div>
    </div>

    <!-- Maintenance Mode Settings -->
    <div class="glass-card q-mb-md">
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

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import API from '../../services/api';

const $q = useQuasar();
const isMaintenanceEnabled = ref(false);
const isLoading = ref(true);

const fetchMaintenanceStatus = async () => {
  try {
    isLoading.value = true;
    const response = await API.get('/public/settings/maintenance');
    isMaintenanceEnabled.value = response.maintenance;
  } catch (error) {
    console.error('Failed to fetch maintenance status', error);
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
    // Revert switch on failure
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

onMounted(() => {
  fetchMaintenanceStatus();
});
</script>
