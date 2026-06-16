<script setup>
defineProps({ size: { type: [Number, String], default: 20 } })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" class="animate-spin text-brand-600">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
  </svg>
</template>
