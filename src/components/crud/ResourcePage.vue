<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import http from '@/api/http'
import { createResource } from '@/api/resource'
import { getResource } from '@/config/resources'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { money, num, date, datetime, time, badgeClass } from '@/utils/format'
import Modal from '@/components/ui/Modal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'
import FormField from './FormField.vue'

const props = defineProps({ resourceKey: { type: String, required: true } })

const auth = useAuthStore()
const toast = useToast()

const conf = computed(() => getResource(props.resourceKey))
const api = computed(() => createResource(conf.value.path))

const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)

const modalOpen = ref(false)
const editing = ref(null)
const form = reactive({})
const saving = ref(false)

const confirmOpen = ref(false)
const deleting = ref(null)

function timeToString(t) {
  if (!t) return ''
  if (typeof t === 'string') return t.slice(0, 5)
  return `${String(t.hour ?? 0).padStart(2, '0')}:${String(t.minute ?? 0).padStart(2, '0')}`
}
function stringToTime(s) {
  if (!s) return null
  const [hour, minute] = s.split(':').map(Number)
  return { hour: hour || 0, minute: minute || 0, second: 0, nano: 0 }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await api.value.list({ pageNumber: page.value, size: size.value })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function blankForm() {
  Object.keys(form).forEach((k) => delete form[k])
  for (const f of conf.value.fields) {
    const empty = f.type === 'checkbox' ? false : f.type === 'multiref' || f.type === 'subform' ? [] : null
    form[f.key] = f.default ?? empty
  }
}

function openCreate() {
  editing.value = null
  blankForm()
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  blankForm()
  for (const f of conf.value.fields) {
    let v = row[f.key]
    if (f.type === 'time') v = timeToString(v)
    if (f.type === 'password') v = ''
    if (f.type === 'multiref' && !Array.isArray(v)) v = Array.isArray(row[f.key]) ? row[f.key] : []
    form[f.key] = v ?? form[f.key]
  }
  modalOpen.value = true
}

function validate() {
  for (const f of conf.value.fields) {
    if (f.required && (form[f.key] == null || form[f.key] === '')) {
      toast.error(`${f.label} is required`)
      return false
    }
  }
  return true
}

async function save() {
  if (!validate()) return
  const payload = {}
  for (const f of conf.value.fields) {
    let v = form[f.key]
    if (f.type === 'time') v = stringToTime(v)
    if (f.type === 'password' && (v == null || v === '')) continue // keep current
    if (f.type === 'subform' && Array.isArray(v)) {
      // Drop rows the user left entirely blank.
      v = v.filter((r) => r && Object.values(r).some((x) => x != null && x !== ''))
    }
    payload[f.key] = v
  }
  if (conf.value.companyScoped && auth.companyId) payload.companyId = auth.companyId

  saving.value = true
  try {
    if (editing.value) {
      await api.value.update(editing.value.id, payload)
      toast.success(`${conf.value.singular} updated`)
    } else {
      await api.value.create(payload)
      toast.success(`${conf.value.singular} created`)
    }
    modalOpen.value = false
    fetchList()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

function askDelete(row) {
  deleting.value = row
  confirmOpen.value = true
}

async function doDelete() {
  try {
    await api.value.remove(deleting.value.id)
    toast.success(`${conf.value.singular} deleted`)
    confirmOpen.value = false
    if (items.value.length === 1 && page.value > 1) page.value -= 1
    else fetchList()
  } catch (e) {
    toast.error(e.message)
  }
}

async function changeStatus(row, status) {
  const cfg = conf.value.inlineStatus
  if (!cfg || status === row[cfg.key]) return
  const previous = row[cfg.key]
  row[cfg.key] = status // optimistic
  try {
    await http.patch(`${cfg.path}/${row.id}/status`, { [cfg.key]: status })
    toast.success('Status updated')
  } catch (e) {
    row[cfg.key] = previous // revert
    toast.error(e.message)
  }
}

function renderCell(row, col) {
  const v = row[col.key]
  if (col.type === 'money') return money(v)
  if (col.type === 'date') return date(v)
  if (col.type === 'datetime') return datetime(v)
  if (col.type === 'time') return time(v)
  if (col.type === 'bool') return undefined // handled in template
  if (v == null || v === '') return '—'
  return v
}

watch(page, fetchList)
watch(
  () => props.resourceKey,
  () => {
    page.value = 1
    fetchList()
  },
)
onMounted(fetchList)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-800">{{ conf.title }}</h1>
        <p class="text-sm text-slate-500">{{ total }} record{{ total === 1 ? '' : 's' }}</p>
      </div>
      <button class="btn-primary" @click="openCreate"><Icon name="plus" size="16" /> New {{ conf.singular }}</button>
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-16"><Spinner size="28" /></div>
      <table v-else-if="items.length" class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th v-for="col in conf.columns" :key="col.key" class="px-4 py-3">{{ col.label }}</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="row in items" :key="row.id" class="hover:bg-slate-50">
            <td v-for="col in conf.columns" :key="col.key" class="px-4 py-3 text-slate-700">
              <select
                v-if="conf.inlineStatus && col.key === conf.inlineStatus.key"
                class="input w-auto py-1 text-xs"
                :value="row[col.key]"
                @change="changeStatus(row, $event.target.value)"
              >
                <option v-for="s in conf.inlineStatus.options" :key="s" :value="s">{{ s }}</option>
              </select>
              <span v-else-if="col.type === 'bool'" class="badge" :class="row[col.key] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'">
                {{ row[col.key] ? 'Yes' : 'No' }}
              </span>
              <span v-else-if="col.type === 'badge' && row[col.key]" class="badge" :class="badgeClass(row[col.key])">{{ row[col.key] }}</span>
              <template v-else>{{ renderCell(row, col) }}</template>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-1">
                <button class="btn-ghost p-1.5" title="Edit" @click="openEdit(row)"><Icon name="edit" size="16" /></button>
                <button class="btn-ghost p-1.5 text-rose-600 hover:bg-rose-50" title="Delete" @click="askDelete(row)"><Icon name="trash" size="16" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="py-16 text-center text-slate-400">No {{ conf.title.toLowerCase() }} yet.</div>

      <Pagination v-if="!loading && total > size" :page="page" :size="size" :total="total" @update:page="page = $event" />
    </div>

    <!-- Create / edit modal -->
    <Modal v-model="modalOpen" :title="(editing ? 'Edit ' : 'New ') + conf.singular" size="lg">
      <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit.prevent="save">
        <FormField v-for="f in conf.fields" :key="f.key" :field="f" v-model="form[f.key]" />
      </form>
      <template #footer>
        <button class="btn-secondary" @click="modalOpen = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="save">
          <Spinner v-if="saving" size="16" /> {{ editing ? 'Save changes' : 'Create' }}
        </button>
      </template>
    </Modal>

    <!-- Delete confirm -->
    <Modal v-model="confirmOpen" title="Confirm delete" size="sm">
      <p class="text-sm text-slate-600">Delete this {{ conf.singular.toLowerCase() }}? This performs a soft delete.</p>
      <template #footer>
        <button class="btn-secondary" @click="confirmOpen = false">Cancel</button>
        <button class="btn-danger" @click="doDelete">Delete</button>
      </template>
    </Modal>
  </div>
</template>
