<script setup>
import Icon from './Icon.vue'
defineProps({
  label: String,
  value: [String, Number],
  icon: { type: String, default: 'chart' },
  tone: { type: String, default: 'brand' }, // brand | emerald | amber | rose
})
const tones = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
}
</script>

<template>
  <div class="card flex items-center gap-4 p-5">
    <div class="flex h-12 w-12 items-center justify-center rounded-xl" :class="tones[tone]">
      <Icon :name="icon" size="22" />
    </div>
    <div class="min-w-0">
      <p class="text-sm text-slate-500">{{ label }}</p>
      <p class="truncate text-2xl font-bold text-slate-800">{{ value }}</p>
    </div>
  </div>
</template>
