<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import http from '@/api/http'
import { createResource } from '@/api/resource'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/composables/useToast'
import { money } from '@/utils/format'
import { pick } from '@/utils/pick'
import Icon from '@/components/ui/Icon.vue'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Receipt from '@/components/ui/Receipt.vue'

const auth = useAuthStore()
const app = useAppStore()
const toast = useToast()

// Last completed sale → printable receipt.
const receiptOpen = ref(false)
const lastInvoice = ref(null)
function printReceipt() {
  window.print()
}

const productsApi = createResource('/products')
const branchesApi = createResource('/branches')
const warehousesApi = createResource('/warehouses')
const customersApi = createResource('/customers')
const paymentMethodsApi = createResource('/payment-methods')

const products = ref([])
const branches = ref([])
const warehouses = ref([])
const customers = ref([])
const paymentMethods = ref([])
const loading = ref(true)

const branchId = ref(null)
const warehouseId = ref(null)
const customerId = ref(null)
const search = ref('')
const orderDiscount = ref(0)

const cart = reactive([])

const productPrice = (p) => Number(pick(p, ['sellPrice', 'price', 'retailPrice', 'unitPrice', 'costPrice'], 0)) || 0

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q),
  )
})

const subtotal = computed(() => cart.reduce((s, l) => s + l.unitPrice * l.quantity - (l.discountAmount || 0), 0))
const total = computed(() => Math.max(0, subtotal.value - (Number(orderDiscount.value) || 0)))

// payment
const paymentModal = ref(false)
const payments = reactive([])
const tendered = computed(() => payments.reduce((s, p) => s + (Number(p.amount) || 0), 0))
const change = computed(() => Math.max(0, tendered.value - total.value))
const submitting = ref(false)

function addToCart(p) {
  const existing = cart.find((l) => l.productId === p.id)
  if (existing) existing.quantity += 1
  else cart.push({ productId: p.id, name: p.name, sku: p.sku, unitPrice: productPrice(p), quantity: 1, discountAmount: 0 })
}
function removeLine(i) {
  cart.splice(i, 1)
}
function clearCart() {
  cart.splice(0)
  orderDiscount.value = 0
}

async function scanBarcode() {
  const code = search.value.trim()
  if (!code) return
  try {
    const p = await http.get(`/products/barcode/${encodeURIComponent(code)}`)
    if (p) {
      addToCart(p)
      search.value = ''
    }
  } catch {
    // not a barcode — leave as text filter
  }
}

function openPayment() {
  if (!cart.length) return toast.warn('Cart is empty')
  if (!branchId.value || !warehouseId.value) return toast.warn('Select branch and warehouse')
  payments.splice(0)
  const cash = paymentMethods.value.find((m) => m.isCash) || paymentMethods.value[0]
  payments.push({ paymentMethodId: cash?.id ?? null, amount: total.value, referenceNo: '' })
  paymentModal.value = true
}
function addPayment() {
  payments.push({ paymentMethodId: paymentMethods.value[0]?.id ?? null, amount: Math.max(0, total.value - tendered.value), referenceNo: '' })
}

async function checkout() {
  if (tendered.value < total.value) return toast.warn('Insufficient payment')
  submitting.value = true
  try {
    const payload = {
      companyId: auth.companyId,
      branchId: branchId.value,
      warehouseId: warehouseId.value,
      customerId: customerId.value || null,
      cashierId: auth.user?.id || auth.claims?.uid || null,
      discountAmount: Number(orderDiscount.value) || 0,
      items: cart.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountAmount: l.discountAmount || 0,
      })),
      payments: payments
        .filter((p) => p.paymentMethodId && p.amount > 0)
        .map((p) => ({ paymentMethodId: p.paymentMethodId, amount: Number(p.amount), referenceNo: p.referenceNo || undefined })),
    }
    const invoice = await http.post('/sales/checkout', payload)
    toast.success(`Sale complete — invoice ${pick(invoice, ['invoiceNo', 'invoiceNumber', 'number'], invoice.id)}`)
    paymentModal.value = false
    clearCart()
    lastInvoice.value = invoice
    receiptOpen.value = true
  } catch (e) {
    toast.error(e.message)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const [pr, br, wh, cu, pm] = await Promise.all([
      productsApi.list({ size: 200, sortProperty: 'name', sortDirection: 'asc' }),
      branchesApi.list({ size: 100 }),
      warehousesApi.list({ size: 100 }),
      customersApi.list({ size: 200 }),
      paymentMethodsApi.list({ size: 50 }),
    ])
    products.value = pr.items.filter((p) => p.isActive !== false)
    branches.value = br.items
    warehouses.value = wh.items
    customers.value = cu.items
    paymentMethods.value = pm.items.filter((m) => m.isActive !== false)
    branchId.value = branches.value[0]?.id ?? null
    warehouseId.value = (warehouses.value.find((w) => w.isDefault) || warehouses.value[0])?.id ?? null
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading" class="flex justify-center py-20"><Spinner size="32" /></div>

  <div v-else class="grid h-[calc(100vh-7rem)] grid-cols-1 gap-4 lg:grid-cols-3">
    <!-- Product catalog -->
    <div class="flex flex-col lg:col-span-2">
      <div class="mb-3 flex gap-2">
        <div class="relative flex-1">
          <Icon name="search" size="18" class="absolute left-3 top-2.5 text-slate-400" />
          <input
            v-model="search"
            class="input pl-9"
            placeholder="Search products or scan barcode…"
            @keyup.enter="scanBarcode"
          />
        </div>
      </div>
      <div class="flex-1 overflow-y-auto rounded-xl">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <button
            v-for="p in filtered"
            :key="p.id"
            class="card flex flex-col p-3 text-left transition hover:border-brand-400 hover:shadow"
            @click="addToCart(p)"
          >
            <div class="mb-2 flex h-20 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
              <Icon name="box" size="28" />
            </div>
            <p class="line-clamp-2 text-sm font-medium text-slate-700">{{ p.name }}</p>
            <p class="text-xs text-slate-400">{{ p.sku }}</p>
            <p class="mt-auto pt-1 font-semibold text-brand-600">{{ money(productPrice(p)) }}</p>
          </button>
        </div>
        <p v-if="!filtered.length" class="py-16 text-center text-slate-400">No products found.</p>
      </div>
    </div>

    <!-- Cart -->
    <div class="flex flex-col card">
      <div class="border-b border-slate-200 p-4">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="label text-xs">Branch</label>
            <select v-model.number="branchId" class="input py-1.5 text-sm">
              <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div>
            <label class="label text-xs">Warehouse</label>
            <select v-model.number="warehouseId" class="input py-1.5 text-sm">
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
        </div>
        <div class="mt-2">
          <label class="label text-xs">Customer (optional)</label>
          <select v-model.number="customerId" class="input py-1.5 text-sm">
            <option :value="null">Walk-in</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <p v-if="!cart.length" class="py-12 text-center text-sm text-slate-400">Cart is empty.<br />Tap a product to add it.</p>
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="(l, i) in cart" :key="l.productId" class="p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-slate-700">{{ l.name }}</p>
                <p class="text-xs text-slate-400">{{ money(l.unitPrice) }} each</p>
              </div>
              <button class="btn-ghost p-1 text-rose-500" @click="removeLine(i)"><Icon name="x" size="14" /></button>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <div class="flex items-center rounded-lg border border-slate-300">
                <button class="px-2 py-1 text-slate-500 hover:bg-slate-50" @click="l.quantity > 1 ? l.quantity-- : removeLine(i)">−</button>
                <input v-model.number="l.quantity" type="number" min="1" class="w-12 border-0 p-1 text-center text-sm focus:ring-0" />
                <button class="px-2 py-1 text-slate-500 hover:bg-slate-50" @click="l.quantity++">+</button>
              </div>
              <input v-model.number="l.unitPrice" type="number" step="any" class="input w-24 py-1 text-sm" title="Unit price" />
              <span class="ml-auto text-sm font-semibold text-slate-700">{{ money(l.unitPrice * l.quantity - (l.discountAmount || 0)) }}</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="space-y-2 border-t border-slate-200 p-4">
        <div class="flex justify-between text-sm text-slate-500">
          <span>Subtotal</span><span>{{ money(subtotal) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm text-slate-500">
          <span>Discount</span>
          <input v-model.number="orderDiscount" type="number" step="any" min="0" class="input w-28 py-1 text-right text-sm" />
        </div>
        <div class="flex justify-between text-lg font-bold text-slate-800">
          <span>Total</span><span>{{ money(total) }}</span>
        </div>
        <div class="flex gap-2 pt-1">
          <button class="btn-secondary flex-1" :disabled="!cart.length" @click="clearCart">Clear</button>
          <button class="btn-primary flex-1" :disabled="!cart.length" @click="openPayment">Charge</button>
        </div>
      </div>
    </div>

    <!-- Payment modal -->
    <Modal v-model="paymentModal" title="Payment" size="md">
      <div class="space-y-4">
        <div class="rounded-lg bg-slate-50 p-4 text-center">
          <p class="text-sm text-slate-500">Amount due</p>
          <p class="text-3xl font-bold text-slate-800">{{ money(total) }}</p>
        </div>

        <div v-for="(p, i) in payments" :key="i" class="flex items-center gap-2">
          <select v-model.number="p.paymentMethodId" class="input flex-1 py-1.5 text-sm">
            <option v-for="m in paymentMethods" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
          <input v-model.number="p.amount" type="number" step="any" class="input w-32 py-1.5 text-sm text-right" />
          <button v-if="payments.length > 1" class="btn-ghost p-1 text-rose-500" @click="payments.splice(i, 1)"><Icon name="x" size="14" /></button>
        </div>
        <button class="text-sm font-medium text-brand-600 hover:underline" @click="addPayment">+ Split payment</button>

        <div class="flex justify-between border-t border-slate-200 pt-3 text-sm">
          <span class="text-slate-500">Tendered</span><span class="font-medium">{{ money(tendered) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-slate-500">Change</span><span class="font-semibold text-emerald-600">{{ money(change) }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="paymentModal = false">Cancel</button>
        <button class="btn-primary" :disabled="submitting || tendered < total" @click="checkout">
          <Spinner v-if="submitting" size="16" /> Complete sale
        </button>
      </template>
    </Modal>

    <!-- Receipt after a completed sale -->
    <Modal v-model="receiptOpen" title="Sale complete" size="sm">
      <Receipt v-if="lastInvoice" :invoice="lastInvoice" :company="app.company" />
      <template #footer>
        <button class="btn-secondary" @click="receiptOpen = false">New sale</button>
        <button class="btn-primary" @click="printReceipt"><Icon name="receipt" size="16" /> Print receipt</button>
      </template>
    </Modal>
  </div>
</template>
