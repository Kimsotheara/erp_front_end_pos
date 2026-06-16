<script setup>
import { ref, reactive, onMounted } from 'vue'
import { createResource } from '@/api/resource'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { money, date, num } from '@/utils/format'
import { pick, firstArray } from '@/utils/pick'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Icon from '@/components/ui/Icon.vue'

const auth = useAuthStore()
const toast = useToast()
const api = createResource('/goods-receipts')

const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)

const warehouses = ref([])
const products = ref([])
const purchaseOrders = ref([])

const createOpen = ref(false)
const saving = ref(false)
const form = reactive({ purchaseOrderId: null, warehouseId: null, receivedDate: '', note: '', lines: [] })

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
    purchaseOrderId: null,
    warehouseId: warehouses.value[0]?.id ?? null,
    receivedDate: new Date().toISOString().slice(0, 10),
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
  if (!form.warehouseId || !lines.length) return toast.warn('Pick a warehouse and at least one product')
  saving.value = true
  try {
    await api.create({
      purchaseOrderId: form.purchaseOrderId || undefined,
      warehouseId: form.warehouseId,
      receivedDate: form.receivedDate || undefined,
      receivedBy: auth.user?.id || undefined,
      note: form.note || undefined,
      items: lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitCost: Number(l.unitCost) })),
    })
    toast.success('Goods received')
    createOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const [w, p, po] = await Promise.all([
    createResource('/warehouses').list({ size: 100 }),
    createResource('/products').list({ size: 300, sortProperty: 'name', sortDirection: 'asc' }),
    createResource('/purchase-orders').list({ size: 100 }),
  ])
  warehouses.value = w.items
  products.value = p.items
  purchaseOrders.value = po.items.filter((x) => x.status === 'APPROVED' || x.status === 'PARTIAL')
  load()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">Goods Receipts</h1>
      <button class="btn-primary" @click="openCreate"><Icon name="plus" size="16" /> Receive goods</button>
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-16"><Spinner size="28" /></div>
      <table v-else-if="items.length" class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr><th class="px-4 py-3">GRN #</th><th class="px-4 py-3">Received</th><th class="px-4 py-3">PO</th><th class="px-4 py-3 text-right">Total</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="g in items" :key="g.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-700">{{ pick(g, ['grnNumber', 'receiptNo', 'number'], g.id) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ date(g.receivedDate) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ g.purchaseOrderId ? '#' + g.purchaseOrderId : '—' }}</td>
            <td class="px-4 py-3 text-right font-semibold">{{ money(pick(g, ['totalAmount', 'total'])) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="py-16 text-center text-slate-400">No goods receipts yet.</div>
      <Pagination v-if="!loading && total > size" :page="page" :size="size" :total="total" @update:page="page = $event; load()" />
    </div>

    <Modal v-model="createOpen" title="Receive goods" size="xl">
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><label class="label">Warehouse</label><select v-model.number="form.warehouseId" class="input"><option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option></select></div>
          <div><label class="label">Purchase order (optional)</label><select v-model.number="form.purchaseOrderId" class="input"><option :value="null">— none —</option><option v-for="po in purchaseOrders" :key="po.id" :value="po.id">{{ pick(po, ['poNumber', 'number'], '#' + po.id) }}</option></select></div>
          <div><label class="label">Received date</label><input v-model="form.receivedDate" type="date" class="input" /></div>
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
        <button class="btn-primary" :disabled="saving" @click="save"><Spinner v-if="saving" size="16" /> Receive</button>
      </template>
    </Modal>
  </div>
</template>
