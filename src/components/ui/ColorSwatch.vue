<template>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
    <div
      :style="{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: color,
        border: darkBorder ? '1px solid var(--border-color)' : 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
      }"
    ></div>
    <p class="text-label" style="margin: 0; text-align: center;">{{ label }}</p>
    <p style="font-size: 11px; font-family: monospace; color: var(--text-muted); margin: 0;">{{ color }}</p>
  </div>
</template>

<script setup>
defineProps({
  color: { type: String, required: true },
  label: { type: String, required: true },
  var:   { type: String, default: '' },
  darkBorder: { type: Boolean, default: false }
})
</script>
