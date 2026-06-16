<script setup>
import { ref, reactive, onMounted } from 'vue'
import http from '@/api/http'
import { createResource, normalizePage } from '@/api/resource'
import { useToast } from '@/composables/useToast'
import { num, datetime, badgeClass } from '@/utils/format'
import Icon from '@/components/ui/Icon.vue'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Pagination from '@/components/ui/Pagination.vue'

const toast = useToast()
const warehousesApi = createResource('/warehouses')
const productsApi = createResource('/products')

const warehouses = ref([])
const products = ref([])

const tab = ref('movements')
const opModal = ref(false)
const opType = ref('stock-in')
const saving = ref(false)
const form = reactive({ warehouseId: null, productId: null, quantity: null, countedQuantity: null, unitCost: null, note: '' })

// movements ledger
const movements = ref([])
const mvLoading = ref(false)
const mvPage = ref(1)
const mvSize = ref(15)
const mvTotal = ref(0)
const filterWarehouse = ref(null)
const filterProduct = ref(null)

// on-hand
const ohWarehouse = ref(null)
const ohProduct = ref(null)
const ohResult = ref(null)
const ohLoading = ref(false)

const OPS = {
  'stock-in': { title: 'Stock In', path: '/inventory/stock-in', icon: 'plus', tone: 'btn-primary' },
  'stock-out': { title: 'Stock Out', path: '/inventory/stock-out', icon: 'minus', tone: 'btn-secondary' },
  adjust: { title: 'Stock Adjust', path: '/inventory/adjust', icon: 'layers', tone: 'btn-secondary' },
}

function openOp(type) {
  opType.value = type
  Object.assign(form, { warehouseId: warehouses.value[0]?.id ?? null, productId: null, quantity: null, countedQuantity: null, unitCost: null, note: '' })
  opModal.value = true
}

async function submitOp() {
  const op = OPS[opType.value]
  const payload = { warehouseId: form.warehouseId, productId: form.productId, note: form.note || undefined }
  if (opType.value === 'adjust') payload.countedQuantity = Number(form.countedQuantity)
  else payload.quantity = Number(form.quantity)
  if (opType.value === 'stock-in') payload.unitCost = form.unitCost != null ? Number(form.unitCost) : undefined

  if (!payload.warehouseId || !payload.productId) return toast.warn('Select warehouse and product')
  saving.value = true
  try {
    await http.post(op.path, payload)
    toast.success(`${op.title} recorded`)
    opModal.value = false
    loadMovements()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

async function loadMovements() {
  mvLoading.value = true
  try {
    const body = await http.get('/inventory/movements', {
      params: {
        warehouseId: filterWarehouse.value || undefined,
        productId: filterProduct.value || undefined,
        pageNumber: mvPage.value,
        size: mvSize.value,
        sortProperty: 'id',
        sortDirection: 'desc',
      },
    })
    const page = normalizePage(body)
    movements.value = page.items
    mvTotal.value = page.total
  } catch (e) {
    toast.error(e.message)
  } finally {
    mvLoading.value = false
  }
}

async function lookupOnHand() {
  if (!ohWarehouse.value || !ohProduct.value) return toast.warn('Select warehouse and product')
  ohLoading.value = true
  ohResult.value = null
  try {
    ohResult.value = await http.get('/inventory/on-hand', { params: { warehouseId: ohWarehouse.value, productId: ohProduct.value } })
  } catch (e) {
    toast.error(e.message)
  } finally {
    ohLoading.value = false
  }
}

function productName(id) {
  return products.value.find((p) => p.id === id)?.name || `#${id}`
}

onMounted(async () => {
  const [wh, pr] = await Promise.all([warehousesApi.list({ size: 100 }), productsApi.list({ size: 300, sortProperty: 'name', sortDirection: 'asc' })])
  warehouses.value = wh.items
  products.value = pr.items
  loadMovements()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-semibold text-slate-800">Inventory</h1>
      <div class="flex gap-2">
        <button class="btn-primary" @click="openOp('stock-in')"><Icon name="plus" size="16" /> Stock In</button>
        <button class="btn-secondary" @click="openOp('stock-out')"><Icon name="minus" size="16" /> Stock Out</button>
        <button class="btn-secondary" @click="openOp('adjust')"><Icon name="layers" size="16" /> Adjust</button>
      </div>
    </div>

    <div class="flex gap-1 border-b border-slate-200">
      <button class="px-4 py-2 text-sm font-medium" :class="tab === 'movements' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'" @click="tab = 'movements'">Movement Ledger</button>
      <button class="px-4 py-2 text-sm font-medium" :class="tab === 'onhand' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'" @click="tab = 'onhand'">On-hand Lookup</button>
    </div>

    <!-- Movements -->
    <div v-show="tab === 'movements'" class="space-y-3">
      <div class="flex flex-wrap gap-2">
        <select v-model.number="filterWarehouse" class="input w-auto py-1.5 text-sm" @change="mvPage = 1; loadMovements()">
          <option :value="null">All warehouses</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
        <select v-model.number="filterProduct" class="input w-auto py-1.5 text-sm" @change="mvPage = 1; loadMovements()">
          <option :value="null">All products</option>
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div class="card overflow-hidden">
        <div v-if="mvLoading" class="flex justify-center py-12"><Spinner size="26" /></div>
        <table v-else-if="movements.length" class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Date</th><th class="px-4 py-3">Type</th><th class="px-4 py-3">Product</th>
              <th class="px-4 py-3 text-right">Qty</th><th class="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="m in movements" :key="m.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 text-slate-500">{{ datetime(m.createdAt || m.movementDate) }}</td>
              <td class="px-4 py-3"><span class="badge" :class="badgeClass(m.movementType || m.type)">{{ m.movementType || m.type }}</span></td>
              <td class="px-4 py-3 text-slate-700">{{ m.productName || productName(m.productId) }}</td>
              <td class="px-4 py-3 text-right font-medium" :class="(m.quantity ?? 0) < 0 ? 'text-rose-600' : 'text-emerald-600'">{{ num(m.quantity, 2) }}</td>
              <td class="px-4 py-3 text-slate-400">{{ m.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="py-12 text-center text-slate-400">No movements recorded.</div>
        <Pagination v-if="!mvLoading && mvTotal > mvSize" :page="mvPage" :size="mvSize" :total="mvTotal" @update:page="mvPage = $event; loadMovements()" />
      </div>
    </div>

    <!-- On-hand -->
    <div v-show="tab === 'onhand'" class="card max-w-xl p-5">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="label">Warehouse</label>
          <select v-model.number="ohWarehouse" class="input">
            <option :value="null">— select —</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Product</label>
          <select v-model.number="ohProduct" class="input">
            <option :value="null">— select —</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
      </div>
      <button class="btn-primary mt-4" :disabled="ohLoading" @click="lookupOnHand"><Spinner v-if="ohLoading" size="16" /> Check on-hand</button>

      <div v-if="ohResult" class="mt-5 grid grid-cols-2 gap-4">
        <div class="rounded-lg bg-slate-50 p-4 text-center">
          <p class="text-sm text-slate-500">On-hand quantity</p>
          <p class="text-2xl font-bold text-slate-800">{{ num(ohResult.quantity ?? ohResult.onHand, 2) }}</p>
        </div>
        <div class="rounded-lg bg-slate-50 p-4 text-center">
          <p class="text-sm text-slate-500">Average cost</p>
          <p class="text-2xl font-bold text-slate-800">{{ num(ohResult.averageCost ?? ohResult.avgCost, 2) }}</p>
        </div>
      </div>
    </div>

    <!-- Operation modal -->
    <Modal v-model="opModal" :title="OPS[opType].title" size="sm">
      <div class="space-y-3">
        <div>
          <label class="label">Warehouse</label>
          <select v-model.number="form.warehouseId" class="input">
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Product</label>
          <select v-model.number="form.productId" class="input">
            <option :value="null">— select —</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div v-if="opType === 'adjust'">
          <label class="label">Counted quantity</label>
          <input v-model.number="form.countedQuantity" type="number" step="any" class="input" />
        </div>
        <div v-else>
          <label class="label">Quantity</label>
          <input v-model.number="form.quantity" type="number" step="any" class="input" />
        </div>
        <div v-if="opType === 'stock-in'">
          <label class="label">Unit cost (optional)</label>
          <input v-model.number="form.unitCost" type="number" step="any" class="input" />
        </div>
        <div>
          <label class="label">Note</label>
          <input v-model="form.note" class="input" />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="opModal = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="submitOp"><Spinner v-if="saving" size="16" /> Confirm</button>
      </template>
    </Modal>
  </div>
</template>
