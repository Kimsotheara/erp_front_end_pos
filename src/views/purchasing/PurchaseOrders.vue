<script setup>
import { ref, reactive, onMounted } from 'vue'
import http from '@/api/http'
import { createResource } from '@/api/resource'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { money, date, badgeClass, num } from '@/utils/format'
import { pick, firstArray } from '@/utils/pick'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Icon from '@/components/ui/Icon.vue'

const auth = useAuthStore()
const toast = useToast()
const api = createResource('/purchase-orders')

const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)

const branches = ref([])
const suppliers = ref([])
const products = ref([])

const createOpen = ref(false)
const saving = ref(false)
const form = reactive({ branchId: null, supplierId: null, orderDate: '', expectedDate: '', note: '', lines: [] })

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
    branchId: branches.value[0]?.id ?? null,
    supplierId: suppliers.value[0]?.id ?? null,
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDate: '',
    note: '',
    lines: [{ productId: null, quantity: 1, unitCost: 0 }],
  })
  createOpen.value = true
}
function addLine() {
  form.lines.push({ productId: null, quantity: 1, unitCost: 0 })
}

async function save() {
  const lines = form.lines.filter((l) => l.productId)
  if (!form.supplierId || !lines.length) return toast.warn('Pick a supplier and at least one product')
  saving.value = true
  try {
    await api.create({
      companyId: auth.companyId,
      branchId: form.branchId,
      supplierId: form.supplierId,
      orderDate: form.orderDate || undefined,
      expectedDate: form.expectedDate || undefined,
      note: form.note || undefined,
      requestedBy: auth.user?.id || undefined,
      items: lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitCost: Number(l.unitCost) })),
    })
    toast.success('Purchase order created')
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

async function transition(action, body) {
  try {
    await http.post(`/purchase-orders/${detail.value.id}/${action}`, body || {})
    toast.success(`PO ${action}d`)
    detailOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

onMounted(async () => {
  const [b, s, p] = await Promise.all([
    createResource('/branches').list({ size: 100 }),
    createResource('/suppliers').list({ size: 200 }),
    createResource('/products').list({ size: 300, sortProperty: 'name', sortDirection: 'asc' }),
  ])
  branches.value = b.items
  suppliers.value = s.items
  products.value = p.items
  load()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">Purchase Orders</h1>
      <button class="btn-primary" @click="openCreate"><Icon name="plus" size="16" /> New PO</button>
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-16"><Spinner size="28" /></div>
      <table v-else-if="items.length" class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr><th class="px-4 py-3">PO #</th><th class="px-4 py-3">Supplier</th><th class="px-4 py-3">Order date</th><th class="px-4 py-3 text-right">Total</th><th class="px-4 py-3">Status</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="po in items" :key="po.id" class="cursor-pointer hover:bg-slate-50" @click="openDetail(po)">
            <td class="px-4 py-3 font-medium text-slate-700">{{ pick(po, ['poNumber', 'orderNo', 'number'], po.id) }}</td>
            <td class="px-4 py-3 text-slate-600">{{ pick(po, ['supplierName', 'supplier'], '#' + po.supplierId) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ date(po.orderDate) }}</td>
            <td class="px-4 py-3 text-right font-semibold">{{ money(pick(po, ['totalAmount', 'total'])) }}</td>
            <td class="px-4 py-3"><span class="badge" :class="badgeClass(po.status)">{{ po.status }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="py-16 text-center text-slate-400">No purchase orders yet.</div>
      <Pagination v-if="!loading && total > size" :page="page" :size="size" :total="total" @update:page="page = $event; load()" />
    </div>

    <!-- Create -->
    <Modal v-model="createOpen" title="New Purchase Order" size="xl">
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><label class="label">Branch</label><select v-model.number="form.branchId" class="input"><option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option></select></div>
          <div><label class="label">Supplier</label><select v-model.number="form.supplierId" class="input"><option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option></select></div>
          <div><label class="label">Order date</label><input v-model="form.orderDate" type="date" class="input" /></div>
          <div><label class="label">Expected date</label><input v-model="form.expectedDate" type="date" class="input" /></div>
        </div>
        <div>
          <div class="mb-1 flex items-center justify-between"><label class="label mb-0">Line items</label><button class="text-sm font-medium text-brand-600 hover:underline" @click="addLine">+ Add line</button></div>
          <div v-for="(l, i) in form.lines" :key="i" class="mb-2 flex items-center gap-2">
            <select v-model.number="l.productId" class="input flex-1"><option :value="null">— product —</option><option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option></select>
            <input v-model.number="l.quantity" type="number" step="any" class="input w-24" placeholder="Qty" />
            <input v-model.number="l.unitCost" type="number" step="any" class="input w-28" placeholder="Unit cost" />
            <button class="btn-ghost p-1 text-rose-500" @click="form.lines.splice(i, 1)"><Icon name="x" size="14" /></button>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="createOpen = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="save"><Spinner v-if="saving" size="16" /> Create draft</button>
      </template>
    </Modal>

    <!-- Detail / workflow -->
    <Modal v-model="detailOpen" title="Purchase Order" size="lg">
      <div v-if="detail" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-lg font-semibold text-slate-800">{{ pick(detail, ['poNumber', 'orderNo', 'number'], detail.id) }}</p>
          <span class="badge" :class="badgeClass(detail.status)">{{ detail.status }}</span>
        </div>
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="text-left text-xs uppercase text-slate-400"><tr><th class="py-2">Product</th><th class="py-2 text-right">Qty</th><th class="py-2 text-right">Unit cost</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(l, i) in firstArray(detail, ['items', 'lines'])" :key="i">
              <td class="py-2 text-slate-700">{{ pick(l, ['productName', 'name'], '#' + l.productId) }}</td>
              <td class="py-2 text-right">{{ num(l.quantity, 2) }}</td>
              <td class="py-2 text-right">{{ money(l.unitCost) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="detailOpen = false">Close</button>
        <button v-if="detail?.status === 'DRAFT'" class="btn-primary" @click="transition('submit')">Submit</button>
        <button v-if="detail?.status === 'REQUESTED'" class="btn-primary" @click="transition('approve', { approvedBy: auth.user?.id, approve: true })">Approve</button>
        <button v-if="['DRAFT','REQUESTED'].includes(detail?.status)" class="btn-danger" @click="transition('cancel')">Cancel</button>
      </template>
    </Modal>
  </div>
</template>
