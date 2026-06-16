<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex min-h-full flex-col items-center justify-center gap-3 p-10 text-center">
    <p class="text-6xl font-bold text-brand-600">404</p>
    <p class="text-slate-500">The page you're looking for doesn't exist.</p>
    <RouterLink to="/" class="btn-primary">Back to dashboard</RouterLink>
  </div>
</template>
