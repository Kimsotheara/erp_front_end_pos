<script setup>
import { ref, reactive, onMounted } from 'vue'
import http from '@/api/http'
import { createResource, normalizePage } from '@/api/resource'
import { useToast } from '@/composables/useToast'
import { date, num } from '@/utils/format'
import { pick } from '@/utils/pick'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Icon from '@/components/ui/Icon.vue'

const toast = useToast()
const api = createResource('/medicine-batches')

const tab = ref('all')
const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)
const withinDays = ref(30)

const products = ref([])
const warehouses = ref([])
const manufacturers = ref([])
const drugCategories = ref([])

const createOpen = ref(false)
const saving = ref(false)
const form = reactive({ productId: null, warehouseId: null, manufacturerId: null, drugCategoryId: null, batchNumber: '', manufactureDate: '', expiryDate: '', quantity: 0, costPrice: 0 })

async function load() {
  loading.value = true
  try {
    if (tab.value === 'expiring') {
      const body = await http.get('/medicine-batches/expiring', { params: { withinDays: withinDays.value, pageNumber: page.value, size: size.value, sortProperty: 'expiryDate', sortDirection: 'asc' } })
      const p = normalizePage(body)
      items.value = p.items
      total.value = p.total
    } else {
      const res = await api.list({ pageNumber: page.value, size: size.value, sortProperty: 'expiryDate', sortDirection: 'asc' })
      items.value = res.items
      total.value = res.total
    }
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function switchTab(t) {
  tab.value = t
  page.value = 1
  load()
}

function openCreate() {
  Object.assign(form, { productId: products.value[0]?.id ?? null, warehouseId: warehouses.value[0]?.id ?? null, manufacturerId: null, drugCategoryId: null, batchNumber: '', manufactureDate: '', expiryDate: '', quantity: 0, costPrice: 0 })
  createOpen.value = true
}
async function save() {
  if (!form.productId || !form.warehouseId || !form.batchNumber || !form.expiryDate || !form.quantity) return toast.warn('Fill product, warehouse, batch number, expiry and quantity')
  saving.value = true
  try {
    await api.create({
      productId: form.productId,
      warehouseId: form.warehouseId,
      manufacturerId: form.manufacturerId || undefined,
      drugCategoryId: form.drugCategoryId || undefined,
      batchNumber: form.batchNumber,
      manufactureDate: form.manufactureDate || undefined,
      expiryDate: form.expiryDate,
      quantity: Number(form.quantity),
      costPrice: Number(form.costPrice) || undefined,
    })
    toast.success('Batch received')
    createOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

function expiringSoon(d) {
  if (!d) return false
  return (new Date(d) - new Date()) / 86400000 <= 30
}
function productName(id) {
  return products.value.find((p) => p.id === id)?.name || `#${id}`
}

onMounted(async () => {
  const [p, w, m, dc] = await Promise.all([
    createResource('/products').list({ size: 300, sortProperty: 'name', sortDirection: 'asc' }),
    createResource('/warehouses').list({ size: 100 }),
    createResource('/manufacturers').list({ size: 200 }),
    createResource('/drug-categories').list({ size: 200 }),
  ])
  products.value = p.items
  warehouses.value = w.items
  manufacturers.value = m.items
  drugCategories.value = dc.items
  load()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">Medicine Batches</h1>
      <button class="btn-primary" @click="openCreate"><Icon name="plus" size="16" /> Receive batch</button>
    </div>

    <div class="flex items-center gap-1 border-b border-slate-200">
      <button class="px-4 py-2 text-sm font-medium" :class="tab === 'all' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'" @click="switchTab('all')">All batches</button>
      <button class="px-4 py-2 text-sm font-medium" :class="tab === 'expiring' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'" @click="switchTab('expiring')">Expiring soon</button>
      <div v-if="tab === 'expiring'" class="ml-auto flex items-center gap-2 text-sm text-slate-500">
        within <input v-model.number="withinDays" type="number" class="input w-20 py-1" @change="load" /> days
      </div>
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-16"><Spinner size="28" /></div>
      <table v-else-if="items.length" class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr><th class="px-4 py-3">Batch #</th><th class="px-4 py-3">Product</th><th class="px-4 py-3 text-right">Qty</th><th class="px-4 py-3">Expiry</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="b in items" :key="b.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-700">{{ b.batchNumber }}</td>
            <td class="px-4 py-3 text-slate-600">{{ pick(b, ['productName'], productName(b.productId)) }}</td>
            <td class="px-4 py-3 text-right">{{ num(pick(b, ['quantity', 'remainingQuantity', 'onHand']), 2) }}</td>
            <td class="px-4 py-3">
              <span class="badge" :class="expiringSoon(b.expiryDate) ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'">{{ date(b.expiryDate) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="py-16 text-center text-slate-400">No batches found.</div>
      <Pagination v-if="!loading && total > size" :page="page" :size="size" :total="total" @update:page="page = $event; load()" />
    </div>

    <Modal v-model="createOpen" title="Receive medicine batch" size="lg">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><label class="label">Product *</label><select v-model.number="form.productId" class="input"><option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option></select></div>
        <div><label class="label">Warehouse *</label><select v-model.number="form.warehouseId" class="input"><option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option></select></div>
        <div><label class="label">Manufacturer</label><select v-model.number="form.manufacturerId" class="input"><option :value="null">— none —</option><option v-for="m in manufacturers" :key="m.id" :value="m.id">{{ m.name }}</option></select></div>
        <div><label class="label">Drug category</label><select v-model.number="form.drugCategoryId" class="input"><option :value="null">— none —</option><option v-for="d in drugCategories" :key="d.id" :value="d.id">{{ d.name }}</option></select></div>
        <div><label class="label">Batch number *</label><input v-model="form.batchNumber" class="input" /></div>
        <div><label class="label">Quantity *</label><input v-model.number="form.quantity" type="number" step="any" class="input" /></div>
        <div><label class="label">Manufacture date</label><input v-model="form.manufactureDate" type="date" class="input" /></div>
        <div><label class="label">Expiry date *</label><input v-model="form.expiryDate" type="date" class="input" /></div>
        <div><label class="label">Cost price</label><input v-model.number="form.costPrice" type="number" step="any" class="input" /></div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="createOpen = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="save"><Spinner v-if="saving" size="16" /> Receive</button>
      </template>
    </Modal>
  </div>
</template>
