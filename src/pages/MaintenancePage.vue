<template>
  <div class="maintenance-container fullscreen flex flex-center">
    <div class="glass-card text-center q-pa-xl" style="max-width: 500px; width: 90%;">
      <q-icon name="build_circle" size="80px" color="primary" class="q-mb-md" />
      <h1 class="text-display q-mb-sm text-primary" style="font-size: 2rem;">Under Maintenance</h1>
      <p class="text-body text-muted q-mb-lg">
        The system is currently undergoing scheduled maintenance. 
        We are working hard to improve your experience and will be back online shortly.
      </p>
      
      <div class="q-mt-lg">
        <p class="text-caption text-secondary">
          Thank you for your patience! <br>
          <em>- The Admin Team</em>
        </p>
      </div>

      <!-- Allow admins to login if they need to -->
      <q-btn flat color="primary" label="Admin Login" to="/login" class="q-mt-xl" size="sm" />
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.maintenance-container {
  background: var(--bg-gradient);
}
</style>
