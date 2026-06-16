<script setup>
import { ref, reactive, onMounted } from 'vue'
import http from '@/api/http'
import { createResource } from '@/api/resource'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { date, badgeClass, num } from '@/utils/format'
import { pick, firstArray } from '@/utils/pick'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Icon from '@/components/ui/Icon.vue'

const auth = useAuthStore()
const toast = useToast()
const api = createResource('/branch-transfers')

const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)

const branches = ref([])
const warehouses = ref([])
const products = ref([])

const createOpen = ref(false)
const saving = ref(false)
const form = reactive({ fromBranchId: null, toBranchId: null, fromWarehouseId: null, toWarehouseId: null, transferDate: '', note: '', lines: [] })

const detail = ref(null)
const detailOpen = ref(false)

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

function openCreate() {
  Object.assign(form, {
    fromBranchId: branches.value[0]?.id ?? null,
    toBranchId: branches.value[1]?.id ?? branches.value[0]?.id ?? null,
    fromWarehouseId: warehouses.value[0]?.id ?? null,
    toWarehouseId: warehouses.value[1]?.id ?? warehouses.value[0]?.id ?? null,
    transferDate: new Date().toISOString().slice(0, 10),
    note: '',
    lines: [{ productId: null, quantity: 1 }],
  })
  createOpen.value = true
}
function addLine() {
  form.lines.push({ productId: null, quantity: 1 })
}

async function save() {
  const lines = form.lines.filter((l) => l.productId)
  if (!lines.length) return toast.warn('Add at least one product')
  saving.value = true
  try {
    await api.create({
      fromBranchId: form.fromBranchId,
      toBranchId: form.toBranchId,
      fromWarehouseId: form.fromWarehouseId,
      toWarehouseId: form.toWarehouseId,
      transferDate: form.transferDate || undefined,
      note: form.note || undefined,
      createdBy: auth.user?.id || undefined,
      items: lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
    })
    toast.success('Transfer created (draft)')
    createOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

async function openDetail(row) {
  detailOpen.value = true
  try {
    detail.value = await api.get(row.id)
  } catch {
    detail.value = row
  }
}
async function transition(action) {
  try {
    await http.post(`/branch-transfers/${detail.value.id}/${action}`, {})
    toast.success(`Transfer ${action} done`)
    detailOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

onMounted(async () => {
  const [b, w, p] = await Promise.all([
    createResource('/branches').list({ size: 100 }),
    createResource('/warehouses').list({ size: 100 }),
    createResource('/products').list({ size: 300, sortProperty: 'name', sortDirection: 'asc' }),
  ])
  branches.value = b.items
  warehouses.value = w.items
  products.value = p.items
  load()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">Branch Transfers</h1>
      <button class="btn-primary" @click="openCreate"><Icon name="plus" size="16" /> New transfer</button>
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-16"><Spinner size="28" /></div>
      <table v-else-if="items.length" class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr><th class="px-4 py-3">Transfer #</th><th class="px-4 py-3">Date</th><th class="px-4 py-3">From → To</th><th class="px-4 py-3">Status</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="t in items" :key="t.id" class="cursor-pointer hover:bg-slate-50" @click="openDetail(t)">
            <td class="px-4 py-3 font-medium text-slate-700">{{ pick(t, ['transferNo', 'number'], t.id) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ date(t.transferDate) }}</td>
            <td class="px-4 py-3 text-slate-500">#{{ t.fromWarehouseId }} → #{{ t.toWarehouseId }}</td>
            <td class="px-4 py-3"><span class="badge" :class="badgeClass(t.status)">{{ t.status }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="py-16 text-center text-slate-400">No transfers yet.</div>
      <Pagination v-if="!loading && total > size" :page="page" :size="size" :total="total" @update:page="page = $event; load()" />
    </div>

    <Modal v-model="createOpen" title="New branch transfer" size="xl">
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><label class="label">From branch</label><select v-model.number="form.fromBranchId" class="input"><option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option></select></div>
          <div><label class="label">To branch</label><select v-model.number="form.toBranchId" class="input"><option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option></select></div>
          <div><label class="label">From warehouse</label><select v-model.number="form.fromWarehouseId" class="input"><option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option></select></div>
          <div><label class="label">To warehouse</label><select v-model.number="form.toWarehouseId" class="input"><option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option></select></div>
        </div>
        <div>
          <div class="mb-1 flex items-center justify-between"><label class="label mb-0">Items</label><button class="text-sm font-medium text-brand-600 hover:underline" @click="addLine">+ Add line</button></div>
          <div v-for="(l, i) in form.lines" :key="i" class="mb-2 flex items-center gap-2">
            <select v-model.number="l.productId" class="input flex-1"><option :value="null">— product —</option><option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option></select>
            <input v-model.number="l.quantity" type="number" step="any" class="input w-24" placeholder="Qty" />
            <button class="btn-ghost p-1 text-rose-500" @click="form.lines.splice(i, 1)"><Icon name="x" size="14" /></button>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="createOpen = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="save"><Spinner v-if="saving" size="16" /> Create draft</button>
      </template>
    </Modal>

    <Modal v-model="detailOpen" title="Branch transfer" size="lg">
      <div v-if="detail" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-lg font-semibold text-slate-800">{{ pick(detail, ['transferNo', 'number'], detail.id) }}</p>
          <span class="badge" :class="badgeClass(detail.status)">{{ detail.status }}</span>
        </div>
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="text-left text-xs uppercase text-slate-400"><tr><th class="py-2">Product</th><th class="py-2 text-right">Qty</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(l, i) in firstArray(detail, ['items', 'lines'])" :key="i">
              <td class="py-2 text-slate-700">{{ pick(l, ['productName', 'name'], '#' + l.productId) }}</td>
              <td class="py-2 text-right">{{ num(l.quantity, 2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="detailOpen = false">Close</button>
        <button v-if="detail?.status === 'DRAFT'" class="btn-primary" @click="transition('ship')">Ship</button>
        <button v-if="detail?.status === 'IN_TRANSIT'" class="btn-primary" @click="transition('receive')">Receive</button>
        <button v-if="['DRAFT','IN_TRANSIT'].includes(detail?.status)" class="btn-danger" @click="transition('cancel')">Cancel</button>
      </template>
    </Modal>
  </div>
</template>
