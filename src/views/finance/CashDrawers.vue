<script setup>
import { ref, reactive, onMounted } from 'vue'
import http from '@/api/http'
import { createResource } from '@/api/resource'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { money, datetime, badgeClass } from '@/utils/format'
import { pick } from '@/utils/pick'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Icon from '@/components/ui/Icon.vue'

const auth = useAuthStore()
const toast = useToast()
const api = createResource('/cash-drawers')

const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)
const branches = ref([])

const openModal = ref(false)
const openForm = reactive({ branchId: null, openingBalance: 0 })

const drawer = ref(null)
const manageOpen = ref(false)
const moveForm = reactive({ direction: 'IN', amount: 0, reason: '' })
const closeForm = reactive({ countedBalance: 0 })
const busy = ref(false)
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

function openOpen() {
  Object.keys(err).forEach((k) => delete err[k])
  Object.assign(openForm, { branchId: branches.value[0]?.id ?? null, openingBalance: 0 })
  openModal.value = true
}
async function doOpen() {
  if (!openForm.branchId) {
    err.branchId = 'Branch is required'
    return
  }
  busy.value = true
  try {
    await http.post('/cash-drawers/open', { branchId: openForm.branchId, openedBy: auth.user?.id || undefined, openingBalance: Number(openForm.openingBalance) || 0 })
    toast.success('Drawer opened')
    openModal.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    busy.value = false
  }
}

function manage(row) {
  drawer.value = row
  Object.keys(err).forEach((k) => delete err[k])
  Object.assign(moveForm, { direction: 'IN', amount: 0, reason: '' })
  Object.assign(closeForm, { countedBalance: 0 })
  manageOpen.value = true
}
async function addMovement() {
  err.amount = ''
  if (!(Number(moveForm.amount) > 0)) {
    err.amount = 'Enter an amount greater than 0'
    return
  }
  busy.value = true
  try {
    await http.post(`/cash-drawers/${drawer.value.id}/movements`, { direction: moveForm.direction, amount: Number(moveForm.amount), reason: moveForm.reason || undefined, createdBy: auth.user?.id || undefined })
    toast.success('Movement recorded')
    Object.assign(moveForm, { amount: 0, reason: '' })
    load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    busy.value = false
  }
}
async function closeDrawer() {
  err.countedBalance = ''
  if (closeForm.countedBalance == null || closeForm.countedBalance === '' || Number(closeForm.countedBalance) < 0) {
    err.countedBalance = 'Enter the counted cash amount'
    return
  }
  busy.value = true
  try {
    await http.post(`/cash-drawers/${drawer.value.id}/close`, { closedBy: auth.user?.id || undefined, countedBalance: Number(closeForm.countedBalance) })
    toast.success('Drawer closed')
    manageOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  branches.value = (await createResource('/branches').list({ size: 100 })).items
  load()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">Cash Drawers</h1>
      <button class="btn-primary" @click="openOpen"><Icon name="plus" size="16" /> Open drawer</button>
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-16"><Spinner size="28" /></div>
      <table v-else-if="items.length" class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr><th class="px-4 py-3">#</th><th class="px-4 py-3">Opened</th><th class="px-4 py-3 text-right">Opening</th><th class="px-4 py-3">Status</th><th class="px-4 py-3"></th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="d in items" :key="d.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-700">{{ d.id }}</td>
            <td class="px-4 py-3 text-slate-500">{{ datetime(pick(d, ['openedAt', 'createdAt'])) }}</td>
            <td class="px-4 py-3 text-right">{{ money(pick(d, ['openingBalance', 'opening'])) }}</td>
            <td class="px-4 py-3"><span class="badge" :class="d.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'">{{ d.status }}</span></td>
            <td class="px-4 py-3 text-right"><button v-if="d.status === 'OPEN'" class="btn-secondary px-2.5 py-1" @click="manage(d)">Manage</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="py-16 text-center text-slate-400">No cash drawers yet.</div>
      <Pagination v-if="!loading && total > size" :page="page" :size="size" :total="total" @update:page="page = $event; load()" />
    </div>

    <Modal v-model="openModal" title="Open cash drawer" size="sm">
      <div class="space-y-3">
        <div>
          <label class="label">Branch <span class="text-rose-500">*</span></label>
          <select v-model.number="openForm.branchId" class="input" :class="{ '!border-rose-400': err.branchId }" @change="err.branchId = ''"><option :value="null">— select —</option><option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option></select>
          <p v-if="err.branchId" class="mt-1 text-xs text-rose-500">{{ err.branchId }}</p>
        </div>
        <div><label class="label">Opening float</label><input v-model.number="openForm.openingBalance" type="number" step="any" class="input" /></div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="openModal = false">Cancel</button>
        <button class="btn-primary" :disabled="busy" @click="doOpen"><Spinner v-if="busy" size="16" /> Open</button>
      </template>
    </Modal>

    <Modal v-model="manageOpen" title="Manage drawer" size="md">
      <div class="space-y-5">
        <div>
          <p class="label">Record cash movement</p>
          <div class="flex items-center gap-2">
            <select v-model="moveForm.direction" class="input w-28"><option value="IN">Pay-in</option><option value="OUT">Pay-out</option></select>
            <input v-model.number="moveForm.amount" type="number" step="any" class="input w-32" placeholder="Amount" :class="{ '!border-rose-400': err.amount }" @input="err.amount = ''" />
            <input v-model="moveForm.reason" class="input flex-1" placeholder="Reason" />
            <button class="btn-secondary" :disabled="busy" @click="addMovement">Add</button>
          </div>
          <p v-if="err.amount" class="mt-1 text-xs text-rose-500">{{ err.amount }}</p>
        </div>
        <div class="border-t border-slate-200 pt-4">
          <p class="label">Close drawer</p>
          <div class="flex items-center gap-2">
            <input v-model.number="closeForm.countedBalance" type="number" step="any" class="input flex-1" placeholder="Counted cash" :class="{ '!border-rose-400': err.countedBalance }" @input="err.countedBalance = ''" />
            <button class="btn-danger" :disabled="busy" @click="closeDrawer">Close drawer</button>
          </div>
          <p v-if="err.countedBalance" class="mt-1 text-xs text-rose-500">{{ err.countedBalance }}</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="manageOpen = false">Done</button>
      </template>
    </Modal>
  </div>
</template>
