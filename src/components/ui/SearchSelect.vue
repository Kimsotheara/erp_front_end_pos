<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: null },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: { type: String, default: '— select —' },
  disabled: Boolean,
  loading: Boolean,
  clearable: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const query = ref('')
const activeIndex = ref(-1)
const root = ref(null)
const searchInput = ref(null)
const listRef = ref(null)

const selected = computed(
  () => props.options.find((o) => String(o.value) === String(props.modelValue)) || null,
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => String(o.label).toLowerCase().includes(q))
})

function openMenu() {
  if (props.disabled || props.loading) return
  open.value = true
  query.value = ''
  activeIndex.value = filtered.value.findIndex((o) => String(o.value) === String(props.modelValue))
  nextTick(() => searchInput.value?.focus())
}
function closeMenu() {
  open.value = false
  activeIndex.value = -1
}
function toggle() {
  open.value ? closeMenu() : openMenu()
}
function choose(opt) {
  emit('update:modelValue', opt.value)
  closeMenu()
}
function clear(e) {
  e.stopPropagation()
  emit('update:modelValue', null)
}
function move(delta) {
  const n = filtered.value.length
  if (!n) return
  activeIndex.value = (activeIndex.value + delta + n) % n
  nextTick(() => listRef.value?.children[activeIndex.value]?.scrollIntoView({ block: 'nearest' }))
}
function enter() {
  const opt = filtered.value[activeIndex.value]
  if (opt) choose(opt)
}

watch(query, () => {
  activeIndex.value = filtered.value.length ? 0 : -1
})

function onDocDown(e) {
  if (root.value && !root.value.contains(e.target)) closeMenu()
}
watch(open, (v) => {
  if (v) document.addEventListener('mousedown', onDocDown)
  else document.removeEventListener('mousedown', onDocDown)
})
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocDown))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="input flex w-full items-center justify-between gap-2 text-left"
      :class="{ 'cursor-not-allowed bg-slate-50': disabled || loading, '!border-brand-500 ring-1 ring-brand-500': open }"
      :disabled="disabled || loading"
      @click="toggle"
      @keydown.down.prevent="open ? move(1) : openMenu()"
      @keydown.up.prevent="open && move(-1)"
      @keydown.enter.prevent="open && enter()"
      @keydown.esc.prevent="closeMenu"
    >
      <span class="truncate" :class="selected ? 'text-slate-800' : 'text-slate-400'">
        {{ loading ? 'Loading…' : selected ? selected.label : placeholder }}
      </span>
      <span class="flex shrink-0 items-center gap-1">
        <span
          v-if="clearable && selected && !disabled && !loading"
          class="rounded p-0.5 text-slate-400 hover:text-rose-500"
          @click.stop="clear"
        >
          <Icon name="x" size="14" />
        </span>
        <svg
          class="h-4 w-4 text-slate-400 transition-transform"
          :class="{ 'rotate-180': open }"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
        >
          <path d="M6 8l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>

    <transition name="ss">
      <div
        v-if="open"
        class="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
      >
        <div class="flex items-center gap-2 border-b border-slate-100 px-2.5 py-2">
          <Icon name="search" size="15" class="text-slate-400" />
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            class="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            placeholder="Search…"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="enter"
            @keydown.esc.prevent="closeMenu"
          />
        </div>
        <ul ref="listRef" class="max-h-56 overflow-y-auto py-1">
          <li
            v-for="(o, i) in filtered"
            :key="o.value"
            class="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors"
            :class="i === activeIndex ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'"
            @mouseenter="activeIndex = i"
            @click="choose(o)"
          >
            <span class="truncate">{{ o.label }}</span>
            <svg
              v-if="String(o.value) === String(modelValue)"
              class="h-4 w-4 shrink-0 text-brand-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z" />
            </svg>
          </li>
          <li v-if="!filtered.length" class="px-3 py-6 text-center text-sm text-slate-400">
            No matches
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.ss-enter-active,
.ss-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.ss-enter-from,
.ss-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
