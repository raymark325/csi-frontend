<template>
  <q-item
    :to="to"
    clickable
    v-ripple
    exact
    active-class="sidebar-item--active"
    style="border-radius: var(--radius-md); margin-bottom: 2px; position: relative;"
  >
    <q-item-section avatar style="min-width: 36px; position: relative;">
      <q-icon :name="icon" size="20px" style="color: var(--text-muted);"/>
    </q-item-section>
    <q-item-section>
      <q-item-label style="font-size: 14px; font-weight: 500; color: var(--text-secondary);">
        {{ label }}
      </q-item-label>
    </q-item-section>
    <!-- Pill badge at end -->
    <q-item-section v-if="badge && badge > 0" side>
      <span class="sidebar-pill-badge">{{ badge > 99 ? '99+' : badge }}</span>
    </q-item-section>
  </q-item>
</template>

<script setup>
defineProps({
  icon:  { type: String, required: true },
  label: { type: String, required: true },
  to:    { type: String, required: true },
  badge: { type: Number, default: 0 },
})
</script>

<style scoped>
.sidebar-item--active :deep(.q-icon) { color: var(--sms-blue) !important; }
.sidebar-item--active :deep(.q-item__label) { color: var(--sms-blue) !important; font-weight: 600 !important; }
.sidebar-item--active { background: rgba(0, 122, 255, 0.10) !important; }

/* Pill badge at end of row */
.sidebar-pill-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5);
  animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-pop {
  0%   { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
