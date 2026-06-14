<template>
  <q-card class="module-card glass-card q-ma-sm text-white">
    <q-card-section>
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="text-h6 font-weight-bold text-azure">{{ module.title }}</div>
          <div class="text-subtitle2 text-grey-4">Category: {{ module.topic }}</div>
        </div>
        <q-chip :color="module.is_published ? 'teal' : 'orange'" text-color="white" icon="circle">
          {{ module.is_published ? 'Published' : 'Draft' }}
        </q-chip>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none text-grey-3">
      {{ module.description || 'No description provided.' }}
    </q-card-section>

    <q-separator dark />

    <q-card-actions align="right">
      <q-btn flat label="View Details" color="primary" :to="`/lms/modules/${module.id}`" />
      <slot name="actions"></slot>
    </q-card-actions>
  </q-card>
</template>

<script setup>
defineProps({
  module: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  border-color: #007AFF;
  box-shadow: 0 12px 40px 0 rgba(0, 122, 255, 0.25);
}

.text-azure {
  color: #007AFF;
}
</style>
