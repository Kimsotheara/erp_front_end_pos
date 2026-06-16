<script setup>
// Pub / Restaurant dine-in flow (the /api/v1/orders/* endpoints):
//   open table -> add items (fire to kitchen) -> settle bill / cancel order.
import { ref, reactive, computed, onMounted } from 'vue'
import http from '@/api/http'
import { createResource } from '@/api/resource'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { money, datetime, badgeClass } from '@/utils/format'
import { pick, firstArray } from '@/utils/pick'
import Icon from '@/components/ui/Icon.vue'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'

const auth = useAuthStore()
const toast = useToast()

const tablesApi = createResource('/tables')
const menuApi = createResource('/menu-items')
const branchesApi = createResource('/branches')
const warehousesApi = createResource('/warehouses')
const paymentMethodsApi = createResource('/payment-methods')
const invoicesApi = createResource('/sales/invoices')

const tables = ref([])
const menuItems = ref([])
const branches = ref([])
const warehouses = ref([])
const paymentMethods = ref([])
const loading = ref(true)

const branchId = ref(null)
// tableId -> open invoiceId, recovered from the invoice list (status OPEN).
const openByTable = reactive({})

// ---- Order panel state ----
const panelOpen = ref(false)
const activeTable = ref(null)
const bill = ref(null)
const billLoading = ref(false)
const invoiceId = ref(null)

// add-items cart inside the panel
const newLines = reactive([])
const happyHour = ref(false)
const firing = ref(false)

// settle
const settleOpen = ref(false)
const settleWarehouse = ref(null)
const settleDiscount = ref(0)
const payments = reactive([])
const settling = ref(false)

const tableName = (t) => pick(t, ['name', 'code'], `#${t.id}`)
const billLines = computed(() => firstArray(bill.value, ['items', 'invoiceItems', 'lines']))
const billTotal = computed(() => Number(pick(bill.value, ['totalAmount', 'total', 'grandTotal'], 0)) || 0)
const tendered = computed(() => payments.reduce((s, p) => s + (Number(p.amount) || 0), 0))
const change = computed(() => Math.max(0, tendered.value - (billTotal.value - (Number(settleDiscount.value) || 0))))

async function loadRefs() {
  try {
    const [tb, mi, br, wh, pm] = await Promise.all([
      tablesApi.list({ size: 200, sortProperty: 'name', sortDirection: 'asc' }),
      menuApi.list({ size: 300, sortProperty: 'name', sortDirection: 'asc' }),
      branchesApi.list({ size: 100 }),
      warehousesApi.list({ size: 100 }),
      paymentMethodsApi.list({ size: 50 }),
    ])
    tables.value = tb.items
    menuItems.value = mi.items.filter((m) => m.isAvailable !== false)
    branches.value = br.items
    warehouses.value = wh.items
    paymentMethods.value = pm.items.filter((m) => m.isActive !== false)
    branchId.value = branches.value[0]?.id ?? null
    await recoverOpenOrders()
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

// There is no "list open orders" endpoint, so recover table->invoice links by
// scanning recent OPEN invoices for a tableId.
async function recoverOpenOrders() {
  try {
    const { items } = await invoicesApi.list({ size: 100, sortProperty: 'id', sortDirection: 'desc' })
    Object.keys(openByTable).forEach((k) => delete openByTable[k])
    for (const inv of items) {
      const tId = pick(inv, ['tableId', 'restaurantTableId'])
      if (tId && inv.status === 'OPEN') openByTable[tId] = inv.id
    }
  } catch {
    // best-effort only
  }
}

function menuPrice(m) {
  return Number(happyHour.value ? pick(m, ['happyHourPrice', 'price'], 0) : pick(m, ['price'], 0)) || 0
}

async function openTable(t) {
  if (!branchId.value) return toast.warn('Select a branch first')
  try {
    const invoice = await http.post('/orders/open', {
      companyId: auth.companyId,
      branchId: branchId.value,
      tableId: t.id,
      cashierId: auth.user?.id || auth.claims?.uid || null,
    })
    openByTable[t.id] = invoice.id
    toast.success(`Table ${tableName(t)} opened`)
    await openPanel(t, invoice.id)
    loadTables()
  } catch (e) {
    toast.error(e.message)
  }
}

async function openPanel(t, invId) {
  activeTable.value = t
  invoiceId.value = invId
  newLines.splice(0)
  happyHour.value = false
  panelOpen.value = true
  await refreshBill()
}

async function refreshBill() {
  if (!invoiceId.value) return
  billLoading.value = true
  try {
    bill.value = await http.get(`/orders/${invoiceId.value}`)
  } catch (e) {
    toast.error(e.message)
  } finally {
    billLoading.value = false
  }
}

function addMenuLine(m) {
  const existing = newLines.find((l) => l.menuItemId === m.id)
  if (existing) existing.quantity += 1
  else newLines.push({ menuItemId: m.id, name: m.name, unitPrice: menuPrice(m), quantity: 1, note: '' })
}
function removeNewLine(i) {
  newLines.splice(i, 1)
}

async function fireToKitchen() {
  if (!newLines.length) return toast.warn('Add at least one item')
  firing.value = true
  try {
    await http.post(`/orders/${invoiceId.value}/items`, {
      happyHour: happyHour.value,
      items: newLines.map((l) => ({
        menuItemId: l.menuItemId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        note: l.note || undefined,
      })),
    })
    toast.success('Items fired to kitchen')
    newLines.splice(0)
    refreshBill()
  } catch (e) {
    toast.error(e.message)
  } finally {
    firing.value = false
  }
}

function openSettle() {
  settleWarehouse.value = (warehouses.value.find((w) => w.isDefault) || warehouses.value[0])?.id ?? null
  settleDiscount.value = 0
  payments.splice(0)
  const cash = paymentMethods.value.find((m) => m.isCash) || paymentMethods.value[0]
  payments.push({ paymentMethodId: cash?.id ?? null, amount: billTotal.value, referenceNo: '' })
  settleOpen.value = true
}
function addPayment() {
  payments.push({ paymentMethodId: paymentMethods.value[0]?.id ?? null, amount: Math.max(0, billTotal.value - tendered.value), referenceNo: '' })
}

async function settleBill() {
  if (!settleWarehouse.value) return toast.warn('Select a warehouse')
  settling.value = true
  try {
    await http.post(`/orders/${invoiceId.value}/settle`, {
      warehouseId: settleWarehouse.value,
      discountAmount: Number(settleDiscount.value) || 0,
      payments: payments
        .filter((p) => p.paymentMethodId && p.amount > 0)
        .map((p) => ({ paymentMethodId: p.paymentMethodId, amount: Number(p.amount), referenceNo: p.referenceNo || undefined })),
    })
    toast.success('Bill settled')
    delete openByTable[activeTable.value.id]
    settleOpen.value = false
    panelOpen.value = false
    loadTables()
  } catch (e) {
    toast.error(e.message)
  } finally {
    settling.value = false
  }
}

async function cancelOrder() {
  if (!confirm('Cancel this order and free the table?')) return
  try {
    await http.post(`/orders/${invoiceId.value}/cancel`)
    toast.success('Order cancelled')
    delete openByTable[activeTable.value.id]
    panelOpen.value = false
    loadTables()
  } catch (e) {
    toast.error(e.message)
  }
}

async function loadTables() {
  try {
    tables.value = (await tablesApi.list({ size: 200, sortProperty: 'name', sortDirection: 'asc' })).items
    await recoverOpenOrders()
  } catch {
    // non-fatal
  }
}

onMounted(loadRefs)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-semibold text-slate-800">Dine-in Orders</h1>
      <div class="flex items-end gap-2">
        <div>
          <label class="label text-xs">Branch</label>
          <select v-model.number="branchId" class="input py-1.5 text-sm">
            <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <button class="btn-secondary" @click="loadTables"><Icon name="layers" size="16" /> Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20"><Spinner size="32" /></div>

    <div v-else-if="tables.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <button
        v-for="t in tables"
        :key="t.id"
        class="card flex flex-col items-center gap-2 p-4 text-center transition hover:border-brand-400 hover:shadow"
        @click="openByTable[t.id] ? openPanel(t, openByTable[t.id]) : openTable(t)"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <Icon name="table" size="24" />
        </div>
        <p class="font-semibold text-slate-700">{{ tableName(t) }}</p>
        <p class="text-xs text-slate-400">{{ t.capacity ? t.capacity + ' seats' : '—' }}</p>
        <span class="badge" :class="badgeClass(openByTable[t.id] ? 'OCCUPIED' : t.status)">
          {{ openByTable[t.id] ? 'OPEN BILL' : t.status || 'AVAILABLE' }}
        </span>
      </button>
    </div>
    <div v-else class="card p-10 text-center text-slate-400">
      No tables yet — create some under Restaurant → Tables first.
    </div>

    <!-- Order panel -->
    <Modal v-model="panelOpen" :title="activeTable ? `Order · ${tableName(activeTable)}` : 'Order'" size="xl">
      <div v-if="billLoading" class="flex justify-center py-10"><Spinner size="26" /></div>
      <div v-else class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- Menu -->
        <div>
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-700">Menu</h3>
            <label class="flex items-center gap-1.5 text-xs text-slate-500">
              <input v-model="happyHour" type="checkbox" class="rounded border-slate-300" /> Happy hour
            </label>
          </div>
          <div class="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            <button
              v-for="m in menuItems"
              :key="m.id"
              class="card p-2 text-left text-sm transition hover:border-brand-400"
              @click="addMenuLine(m)"
            >
              <p class="line-clamp-2 font-medium text-slate-700">{{ m.name }}</p>
              <p class="font-semibold text-brand-600">{{ money(menuPrice(m)) }}</p>
            </button>
          </div>
        </div>

        <!-- New lines + running bill -->
        <div class="space-y-4">
          <div>
            <h3 class="mb-2 text-sm font-semibold text-slate-700">New items to fire</h3>
            <p v-if="!newLines.length" class="rounded-lg bg-slate-50 py-4 text-center text-xs text-slate-400">Tap menu items to add.</p>
            <ul v-else class="space-y-1.5">
              <li v-for="(l, i) in newLines" :key="l.menuItemId" class="flex items-center gap-2 text-sm">
                <span class="flex-1 truncate text-slate-700">{{ l.name }}</span>
                <input v-model.number="l.quantity" type="number" min="1" class="input w-16 py-1 text-center text-sm" />
                <span class="w-20 text-right text-slate-600">{{ money(l.unitPrice * l.quantity) }}</span>
                <button class="btn-ghost p-1 text-rose-500" @click="removeNewLine(i)"><Icon name="x" size="14" /></button>
              </li>
            </ul>
            <button class="btn-primary mt-2 w-full py-1.5 text-sm" :disabled="firing || !newLines.length" @click="fireToKitchen">
              <Spinner v-if="firing" size="16" /> <Icon name="fire" size="16" /> Fire to kitchen
            </button>
          </div>

          <div class="border-t border-slate-200 pt-3">
            <h3 class="mb-2 text-sm font-semibold text-slate-700">Running bill</h3>
            <ul v-if="billLines.length" class="space-y-1 text-sm">
              <li v-for="(l, i) in billLines" :key="i" class="flex justify-between">
                <span class="text-slate-600">{{ pick(l, ['productName', 'menuItemName', 'name'], 'Item') }} ×{{ pick(l, ['quantity', 'qty'], 1) }}</span>
                <span class="text-slate-700">{{ money(pick(l, ['lineTotal', 'total', 'subtotal'])) }}</span>
              </li>
            </ul>
            <p v-else class="text-xs text-slate-400">No items yet.</p>
            <div class="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-800">
              <span>Total</span><span>{{ money(billTotal) }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost text-rose-600" @click="cancelOrder">Cancel order</button>
        <button class="btn-secondary" @click="panelOpen = false">Close</button>
        <button class="btn-primary" :disabled="!billLines.length" @click="openSettle"><Icon name="cash" size="16" /> Settle bill</button>
      </template>
    </Modal>

    <!-- Settle -->
    <Modal v-model="settleOpen" title="Settle bill" size="md">
      <div class="space-y-4">
        <div class="rounded-lg bg-slate-50 p-4 text-center">
          <p class="text-sm text-slate-500">Amount due</p>
          <p class="text-3xl font-bold text-slate-800">{{ money(billTotal - (Number(settleDiscount) || 0)) }}</p>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="label text-xs">Stock warehouse</label>
            <select v-model.number="settleWarehouse" class="input py-1.5 text-sm">
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div>
            <label class="label text-xs">Discount</label>
            <input v-model.number="settleDiscount" type="number" min="0" step="any" class="input py-1.5 text-sm text-right" />
          </div>
        </div>
        <div v-for="(p, i) in payments" :key="i" class="flex items-center gap-2">
          <select v-model.number="p.paymentMethodId" class="input flex-1 py-1.5 text-sm">
            <option v-for="m in paymentMethods" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
          <input v-model.number="p.amount" type="number" step="any" class="input w-32 py-1.5 text-right text-sm" />
          <button v-if="payments.length > 1" class="btn-ghost p-1 text-rose-500" @click="payments.splice(i, 1)"><Icon name="x" size="14" /></button>
        </div>
        <button class="text-sm font-medium text-brand-600 hover:underline" @click="addPayment">+ Split payment</button>
        <div class="flex justify-between border-t border-slate-200 pt-2 text-sm">
          <span class="text-slate-500">Change</span><span class="font-semibold text-emerald-600">{{ money(change) }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="settleOpen = false">Cancel</button>
        <button class="btn-primary" :disabled="settling" @click="settleBill"><Spinner v-if="settling" size="16" /> Complete payment</button>
      </template>
    </Modal>
  </div>
</template>
