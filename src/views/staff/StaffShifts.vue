<script setup>
import { ref, reactive, onMounted } from 'vue'
import http from '@/api/http'
import { createResource } from '@/api/resource'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { date, badgeClass, datetime } from '@/utils/format'
import { pick } from '@/utils/pick'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Icon from '@/components/ui/Icon.vue'

const auth = useAuthStore()
const toast = useToast()
const api = createResource('/staff-shifts')

const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)

const branches = ref([])
const users = ref([])
const shifts = ref([])

const rosterOpen = ref(false)
const saving = ref(false)
const form = reactive({ branchId: null, userId: null, shiftId: null, shiftDate: '', note: '' })
const err = reactive({})

async function load() {
  loading.value = true
  try {
    const res = await api.list({ pageNumber: page.value, size: size.value })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function openRoster() {
  Object.keys(err).forEach((k) => delete err[k])
  Object.assign(form, { branchId: branches.value[0]?.id ?? null, userId: users.value[0]?.id ?? null, shiftId: shifts.value[0]?.id ?? null, shiftDate: new Date().toISOString().slice(0, 10), note: '' })
  rosterOpen.value = true
}
async function save() {
  Object.keys(err).forEach((k) => delete err[k])
  if (!form.branchId) err.branchId = 'Branch is required'
  if (!form.userId) err.userId = 'Staff member is required'
  if (!form.shiftDate) err.shiftDate = 'Date is required'
  if (Object.keys(err).length) return
  saving.value = true
  try {
    await api.create({
      companyId: auth.companyId,
      branchId: form.branchId,
      userId: form.userId,
      shiftId: form.shiftId || undefined,
      shiftDate: form.shiftDate,
      note: form.note || undefined,
      createdBy: auth.user?.id || undefined,
    })
    toast.success('Shift rostered')
    rosterOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

async function punch(row, eventType) {
  try {
    await http.post(`/staff-shifts/${row.id}/punch`, { eventType, createdBy: auth.user?.id || undefined })
    toast.success(eventType.replace('_', ' ').toLowerCase() + ' recorded')
    load()
  } catch (e) {
    toast.error(e.message)
  }
}
async function cancel(row) {
  try {
    await http.post(`/staff-shifts/${row.id}/cancel`, {})
    toast.success('Shift cancelled')
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function userName(id) {
  return users.value.find((u) => u.id === id)?.fullName || users.value.find((u) => u.id === id)?.username || `#${id}`
}

onMounted(async () => {
  const [b, u, s] = await Promise.all([
    createResource('/branches').list({ size: 100 }),
    createResource('/users').list({ size: 200 }),
    createResource('/shifts').list({ size: 100 }),
  ])
  branches.value = b.items
  users.value = u.items
  shifts.value = s.items
  load()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">Staff Roster</h1>
      <button class="btn-primary" @click="openRoster"><Icon name="plus" size="16" /> Roster shift</button>
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-16"><Spinner size="28" /></div>
      <table v-else-if="items.length" class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr><th class="px-4 py-3">Staff</th><th class="px-4 py-3">Date</th><th class="px-4 py-3">Status</th><th class="px-4 py-3 text-right">Actions</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="s in items" :key="s.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 text-slate-700">{{ pick(s, ['userName', 'staffName'], userName(s.userId)) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ date(s.shiftDate) }}</td>
            <td class="px-4 py-3"><span class="badge" :class="badgeClass(s.status)">{{ s.status }}</span></td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-1">
                <button class="btn-secondary px-2 py-1 text-xs" @click="punch(s, 'CLOCK_IN')">In</button>
                <button class="btn-secondary px-2 py-1 text-xs" @click="punch(s, 'CLOCK_OUT')">Out</button>
                <button class="btn-ghost px-2 py-1 text-xs text-rose-600" @click="cancel(s)">Cancel</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="py-16 text-center text-slate-400">No rostered shifts yet.</div>
      <Pagination v-if="!loading && total > size" :page="page" :size="size" :total="total" @update:page="page = $event; load()" />
    </div>

    <Modal v-model="rosterOpen" title="Roster a shift" size="md">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="label">Branch <span class="text-rose-500">*</span></label>
          <select v-model.number="form.branchId" class="input" :class="{ '!border-rose-400': err.branchId }" @change="err.branchId = ''"><option :value="null">— select —</option><option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option></select>
          <p v-if="err.branchId" class="mt-1 text-xs text-rose-500">{{ err.branchId }}</p>
        </div>
        <div>
          <label class="label">Staff <span class="text-rose-500">*</span></label>
          <select v-model.number="form.userId" class="input" :class="{ '!border-rose-400': err.userId }" @change="err.userId = ''"><option :value="null">— select —</option><option v-for="u in users" :key="u.id" :value="u.id">{{ u.fullName || u.username }}</option></select>
          <p v-if="err.userId" class="mt-1 text-xs text-rose-500">{{ err.userId }}</p>
        </div>
        <div><label class="label">Shift template</label><select v-model.number="form.shiftId" class="input"><option :value="null">— none —</option><option v-for="s in shifts" :key="s.id" :value="s.id">{{ s.name }}</option></select></div>
        <div>
          <label class="label">Date <span class="text-rose-500">*</span></label>
          <input v-model="form.shiftDate" type="date" class="input" :class="{ '!border-rose-400': err.shiftDate }" @input="err.shiftDate = ''" />
          <p v-if="err.shiftDate" class="mt-1 text-xs text-rose-500">{{ err.shiftDate }}</p>
        </div>
        <div class="sm:col-span-2"><label class="label">Note</label><input v-model="form.note" class="input" /></div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="rosterOpen = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="save"><Spinner v-if="saving" size="16" /> Roster</button>
      </template>
    </Modal>
  </div>
</template>
