<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRefOptions } from '@/composables/useRefOptions'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import Icon from '@/components/ui/Icon.vue'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: [String, Number, Boolean, Array, Object, null],
})
const emit = defineEmits(['update:modelValue'])

const { options, loading, load } = useRefOptions()

onMounted(() => {
  if (props.field.type === 'ref' || props.field.type === 'multiref') {
    load(props.field.ref)
  }
})

function set(v) {
  emit('update:modelValue', v)
}
function onInput(e) {
  set(e.target.value === '' ? null : e.target.value)
}
function onNumber(e) {
  set(e.target.value === '' ? null : Number(e.target.value))
}
function toggleMulti(val) {
  const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  const i = arr.indexOf(val)
  if (i === -1) arr.push(val)
  else arr.splice(i, 1)
  set(arr)
}

// ---- image upload (stored as a base64 data URL) ----
const imgError = ref('')
function onImageFile(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // allow re-picking the same file
  if (!file) return
  const maxKB = props.field.maxKB || 1024
  if (file.size > maxKB * 1024) {
    imgError.value = `Image must be under ${maxKB} KB (this is ${Math.round(file.size / 1024)} KB).`
    return
  }
  imgError.value = ''
  const reader = new FileReader()
  reader.onload = () => set(reader.result)
  reader.onerror = () => (imgError.value = 'Could not read the file.')
  reader.readAsDataURL(file)
}

// ---- multiref search filter ----
const multiQuery = ref('')
const filteredOptions = computed(() => {
  const q = multiQuery.value.trim().toLowerCase()
  if (!q) return options.value
  return options.value.filter((o) => String(o.label).toLowerCase().includes(q))
})

// ---- subform (repeatable rows of itemFields) ----
const rows = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))
function addRow() {
  const blank = {}
  for (const sf of props.field.itemFields || []) blank[sf.key] = null
  set([...rows.value, blank])
}
function removeRow(i) {
  const arr = [...rows.value]
  arr.splice(i, 1)
  set(arr)
}
function setRowField(i, key, value) {
  set(rows.value.map((r, idx) => (idx === i ? { ...r, [key]: value === '' ? null : value } : r)))
}
</script>

<template>
  <div :class="field.type === 'textarea' || field.type === 'subform' ? 'sm:col-span-2' : ''">
    <label class="label">
      {{ field.label }}
      <span v-if="field.required" class="text-rose-500">*</span>
    </label>

    <!-- checkbox -->
    <label v-if="field.type === 'checkbox'" class="mt-1 inline-flex items-center gap-2">
      <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" :checked="!!modelValue" @change="set($event.target.checked)" />
      <span class="text-sm text-slate-600">Yes</span>
    </label>

    <!-- textarea -->
    <textarea v-else-if="field.type === 'textarea'" class="input" rows="3" :value="modelValue ?? ''" @input="onInput" />

    <!-- number / money -->
    <input v-else-if="field.type === 'number' || field.type === 'money'" type="number" step="any" class="input" :value="modelValue ?? ''" @input="onNumber" />

    <!-- date / datetime / time -->
    <input v-else-if="field.type === 'date'" type="date" class="input" :value="modelValue ?? ''" @input="onInput" />
    <input v-else-if="field.type === 'datetime'" type="datetime-local" class="input" :value="modelValue ?? ''" @input="onInput" />
    <input v-else-if="field.type === 'time'" type="time" class="input" :value="typeof modelValue === 'string' ? modelValue : ''" @input="onInput" />

    <!-- password -->
    <input v-else-if="field.type === 'password'" type="password" class="input" autocomplete="new-password" :value="modelValue ?? ''" @input="onInput" />

    <!-- select (static options) -->
    <SearchSelect
      v-else-if="field.type === 'select'"
      :options="field.options"
      :model-value="modelValue"
      :clearable="!field.required"
      @update:model-value="set"
    />

    <!-- ref (single) -->
    <SearchSelect
      v-else-if="field.type === 'ref'"
      :options="options"
      :model-value="modelValue"
      :loading="loading"
      :clearable="!field.required"
      @update:model-value="set"
    />

    <!-- multiref -->
    <div v-else-if="field.type === 'multiref'" class="rounded-lg border border-slate-300">
      <div class="flex items-center gap-2 border-b border-slate-100 px-2.5 py-1.5">
        <Icon name="search" size="14" class="text-slate-400" />
        <input v-model="multiQuery" type="text" class="w-full bg-transparent text-sm focus:outline-none" placeholder="Search…" />
      </div>
      <div class="max-h-40 overflow-y-auto p-2">
        <p v-if="loading" class="text-sm text-slate-400">Loading…</p>
        <p v-else-if="!filteredOptions.length" class="py-2 text-center text-sm text-slate-400">No options.</p>
        <label v-for="o in filteredOptions" :key="o.value" class="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-slate-50">
          <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" :checked="Array.isArray(modelValue) && modelValue.includes(o.value)" @change="toggleMulti(o.value)" />
          {{ o.label }}
        </label>
      </div>
    </div>

    <!-- image upload (base64 data URL) -->
    <div v-else-if="field.type === 'image'" class="space-y-2">
      <div class="flex items-center gap-3">
        <div class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <img v-if="modelValue" :src="modelValue" alt="preview" class="h-full w-full object-cover" />
          <Icon v-else name="box" size="22" class="text-slate-300" />
        </div>
        <div class="space-y-1.5">
          <label class="btn-secondary cursor-pointer text-sm">
            <Icon name="inbox" size="15" />
            {{ modelValue ? 'Change image' : 'Browse image…' }}
            <input type="file" accept="image/*" class="hidden" @change="onImageFile" />
          </label>
          <button v-if="modelValue" type="button" class="btn-ghost block p-1 text-xs text-rose-600 hover:bg-rose-50" @click="set(null); imgError = ''">
            Remove
          </button>
        </div>
      </div>
      <p v-if="imgError" class="text-xs text-rose-500">{{ imgError }}</p>
    </div>

    <!-- subform (repeatable rows) -->
    <div v-else-if="field.type === 'subform'" class="space-y-2">
      <div v-for="(row, i) in rows" :key="i" class="rounded-lg border border-slate-200 p-3">
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div v-for="sf in field.itemFields" :key="sf.key">
            <label class="label text-xs">{{ sf.label }}</label>
            <input class="input" :value="row[sf.key] ?? ''" @input="setRowField(i, sf.key, $event.target.value)" />
          </div>
        </div>
        <button type="button" class="btn-ghost mt-2 p-1 text-xs text-rose-600 hover:bg-rose-50" @click="removeRow(i)">Remove</button>
      </div>
      <button type="button" class="btn-secondary text-sm" @click="addRow">+ Add {{ field.itemLabel || 'row' }}</button>
    </div>

    <!-- text (default) -->
    <input v-else type="text" class="input" :value="modelValue ?? ''" @input="onInput" />

    <p v-if="field.hint" class="mt-1 text-xs text-slate-400">{{ field.hint }}</p>
  </div>
</template>
