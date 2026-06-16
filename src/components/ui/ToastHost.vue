<script setup>
import { toastState, dismissToast } from '@/composables/useToast'

const styles = {
  success: 'bg-emerald-600',
  error: 'bg-rose-600',
  warn: 'bg-amber-500',
  info: 'bg-slate-800',
}
</script>

<template>
  <div class="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
    <transition-group name="toast">
      <div
        v-for="t in toastState.items"
        :key="t.id"
        class="pointer-events-auto flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg"
        :class="styles[t.type] || styles.info"
      >
        <span>{{ t.message }}</span>
        <button class="opacity-70 hover:opacity-100" @click="dismissToast(t.id)">✕</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
