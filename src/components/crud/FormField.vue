<script setup>
import { computed, onMounted } from 'vue'
import { useRefOptions } from '@/composables/useRefOptions'

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
function onRef(e) {
  set(e.target.value === '' ? null : Number(e.target.value))
}
function toggleMulti(val) {
  const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  const i = arr.indexOf(val)
  if (i === -1) arr.push(val)
  else arr.splice(i, 1)
  set(arr)
}

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
    <select v-else-if="field.type === 'select'" class="input" :value="modelValue ?? ''" @change="onInput">
      <option value="">— select —</option>
      <option v-for="o in field.options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>

    <!-- ref (single) -->
    <select v-else-if="field.type === 'ref'" class="input" :value="modelValue ?? ''" :disabled="loading" @change="onRef">
      <option value="">{{ loading ? 'Loading…' : '— select —' }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>

    <!-- multiref -->
    <div v-else-if="field.type === 'multiref'" class="max-h-40 overflow-y-auto rounded-lg border border-slate-300 p-2">
      <p v-if="loading" class="text-sm text-slate-400">Loading…</p>
      <p v-else-if="!options.length" class="text-sm text-slate-400">No options.</p>
      <label v-for="o in options" :key="o.value" class="flex items-center gap-2 py-0.5 text-sm">
        <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" :checked="Array.isArray(modelValue) && modelValue.includes(o.value)" @change="toggleMulti(o.value)" />
        {{ o.label }}
      </label>
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
