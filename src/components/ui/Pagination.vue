<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, default: 1 },
  size: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
})
const emit = defineEmits(['update:page'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.size)))
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.size + 1))
const to = computed(() => Math.min(props.total, props.page * props.size))

function go(p) {
  if (p >= 1 && p <= totalPages.value) emit('update:page', p)
}
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3 text-sm text-slate-600">
    <span>{{ from }}–{{ to }} of {{ total }}</span>
    <div class="flex items-center gap-1">
      <button class="btn-secondary px-2.5 py-1" :disabled="page <= 1" @click="go(page - 1)">Prev</button>
      <span class="px-2">Page {{ page }} / {{ totalPages }}</span>
      <button class="btn-secondary px-2.5 py-1" :disabled="page >= totalPages" @click="go(page + 1)">Next</button>
    </div>
  </div>
</template>
