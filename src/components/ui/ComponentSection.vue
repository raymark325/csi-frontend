<template>
  <div class="q-mb-xl">
    <div class="row items-center q-gutter-sm q-mb-xs">
      <q-icon :name="icon" size="20px" style="color: var(--sms-blue)"/>
      <span class="text-label" style="color: var(--sms-blue)">{{ title }}</span>
    </div>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  icon:  { type: String, default: 'widgets' }
})
</script>
