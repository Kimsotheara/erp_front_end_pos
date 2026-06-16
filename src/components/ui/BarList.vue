<script setup>
import { computed } from 'vue'

// Reusable ranked horizontal bar list. Each item: { label, value, display?, sub? }
// `value` drives the bar width (relative to the largest item); `display` is the
// text shown on the right (falls back to the raw value).
const props = defineProps({
  items: { type: Array, default: () => [] },
  tone: { type: String, default: 'brand' }, // brand | emerald | amber | rose
  ranked: { type: Boolean, default: true },
  empty: { type: String, default: 'No data.' },
})

const bars = {
  brand: 'bg-brand-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
}
const chips = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
}

const max = computed(() => Math.max(1, ...props.items.map((i) => Number(i.value) || 0)))
function width(v) {
  return `${Math.max(3, Math.round(((Number(v) || 0) / max.value) * 100))}%`
}
</script>

<template>
  <ul v-if="items.length" class="space-y-3 px-5 py-4">
    <li v-for="(it, i) in items" :key="i">
      <div class="mb-1 flex items-center justify-between gap-3 text-sm">
        <span class="flex min-w-0 items-center gap-2.5 text-slate-700">
          <span
            v-if="ranked"
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
            :class="chips[tone]"
          >{{ i + 1 }}</span>
          <span class="truncate">{{ it.label }}</span>
        </span>
        <span class="shrink-0 font-medium text-slate-500">{{ it.display ?? it.value }}</span>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div class="h-full rounded-full transition-all" :class="bars[tone]" :style="{ width: width(it.value) }" />
      </div>
    </li>
  </ul>
  <p v-else class="px-5 py-10 text-center text-sm text-slate-400">{{ empty }}</p>
</template>
