<script setup>
import { ref, reactive, onMounted } from 'vue'
import http from '@/api/http'
import { createResource } from '@/api/resource'
import { useToast } from '@/composables/useToast'
import { money, datetime, badgeClass, num } from '@/utils/format'
import { pick, firstArray } from '@/utils/pick'
import Modal from '@/components/ui/Modal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Pagination from '@/components/ui/Pagination.vue'
import Receipt from '@/components/ui/Receipt.vue'
import Icon from '@/components/ui/Icon.vue'
import { useAppStore } from '@/stores/app'

const toast = useToast()
const app = useAppStore()

const receiptOpen = ref(false)
function printReceipt() {
  window.print()
}
const invoicesApi = createResource('/sales/invoices')
const warehousesApi = createResource('/warehouses')

const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)
const warehouses = ref([])

const detail = ref(null)
const detailOpen = ref(false)
const detailLoading = ref(false)

const actionOpen = ref(false)
const actionType = ref('void') // void | return
const actionWarehouse = ref(null)
const actionReason = ref('')
const returnLines = reactive([])
const acting = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await invoicesApi.list({ pageNumber: page.value, size: size.value })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

async function openDetail(row) {
  detailOpen.value = true
  detailLoading.value = true
  try {
    detail.value = await invoicesApi.get(row.id)
  } catch (e) {
    toast.error(e.message)
    detail.value = row
  } finally {
    detailLoading.value = false
  }
}

function lines(inv) {
  return firstArray(inv, ['items', 'invoiceItems', 'lines'])
}
function payments(inv) {
  return firstArray(inv, ['payments'])
}

function openAction(type) {
  actionType.value = type
  actionWarehouse.value = (warehouses.value.find((w) => w.isDefault) || warehouses.value[0])?.id ?? null
  actionReason.value = ''
  returnLines.splice(0)
  if (type === 'return') {
    for (const l of lines(detail.value)) {
      const sold = pick(l, ['quantity', 'qty'], 0)
      const returned = pick(l, ['returnedQuantity', 'returned'], 0)
      returnLines.push({ invoiceItemId: l.id, name: pick(l, ['productName', 'name'], `#${l.productId}`), returnable: sold - returned, quantity: 0 })
    }
  }
  actionOpen.value = true
}

async function submitAction() {
  if (!actionWarehouse.value) return toast.warn('Select a warehouse')
  acting.value = true
  try {
    if (actionType.value === 'void') {
      await http.post(`/sales/invoices/${detail.value.id}/void`, { warehouseId: actionWarehouse.value, reason: actionReason.value || undefined })
      toast.success('Invoice voided')
    } else {
      const payload = {
        warehouseId: actionWarehouse.value,
        reason: actionReason.value || undefined,
        items: returnLines.filter((l) => l.quantity > 0).map((l) => ({ invoiceItemId: l.invoiceItemId, quantity: l.quantity })),
      }
      if (!payload.items.length) return toast.warn('Enter at least one return quantity')
      await http.post(`/sales/invoices/${detail.value.id}/return`, payload)
      toast.success('Return processed')
    }
    actionOpen.value = false
    detailOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    acting.value = false
  }
}

onMounted(async () => {
  warehouses.value = (await warehousesApi.list({ size: 100 })).items
  load()
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold text-slate-800">Invoices</h1>

    <div class="card overflow-hidden">
      <div v-if="loading" class="flex justify-center py-16"><Spinner size="28" /></div>
      <table v-else-if="items.length" class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Invoice #</th><th class="px-4 py-3">Date</th>
            <th class="px-4 py-3 text-right">Total</th><th class="px-4 py-3">Status</th><th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="inv in items" :key="inv.id" class="cursor-pointer hover:bg-slate-50" @click="openDetail(inv)">
            <td class="px-4 py-3 font-medium text-slate-700">{{ pick(inv, ['invoiceNo', 'invoiceNumber', 'number'], inv.id) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ datetime(pick(inv, ['createdAt', 'invoiceDate', 'date'])) }}</td>
            <td class="px-4 py-3 text-right font-semibold">{{ money(pick(inv, ['totalAmount', 'total', 'grandTotal'])) }}</td>
            <td class="px-4 py-3"><span class="badge" :class="badgeClass(inv.status)">{{ inv.status }}</span></td>
            <td class="px-4 py-3 text-right text-brand-600">View</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="py-16 text-center text-slate-400">No invoices yet.</div>
      <Pagination v-if="!loading && total > size" :page="page" :size="size" :total="total" @update:page="page = $event; load()" />
    </div>

    <!-- Detail -->
    <Modal v-model="detailOpen" title="Invoice detail" size="lg">
      <div v-if="detailLoading" class="flex justify-center py-10"><Spinner size="26" /></div>
      <div v-else-if="detail" class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-lg font-semibold text-slate-800">{{ pick(detail, ['invoiceNo', 'invoiceNumber', 'number'], detail.id) }}</p>
            <p class="text-sm text-slate-400">{{ datetime(pick(detail, ['createdAt', 'invoiceDate', 'date'])) }}</p>
          </div>
          <span class="badge" :class="badgeClass(detail.status)">{{ detail.status }}</span>
        </div>

        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="text-left text-xs uppercase text-slate-400">
            <tr><th class="py-2">Item</th><th class="py-2 text-right">Qty</th><th class="py-2 text-right">Price</th><th class="py-2 text-right">Line</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(l, i) in lines(detail)" :key="i">
              <td class="py-2 text-slate-700">{{ pick(l, ['productName', 'name'], '#' + l.productId) }}</td>
              <td class="py-2 text-right">{{ num(pick(l, ['quantity', 'qty']), 2) }}</td>
              <td class="py-2 text-right">{{ money(pick(l, ['unitPrice', 'price'])) }}</td>
              <td class="py-2 text-right font-medium">{{ money(pick(l, ['lineTotal', 'total', 'subtotal'])) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="ml-auto w-56 space-y-1 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Subtotal</span><span>{{ money(pick(detail, ['subtotal', 'subTotal'])) }}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Tax</span><span>{{ money(pick(detail, ['taxAmount', 'tax'])) }}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Discount</span><span>{{ money(pick(detail, ['discountAmount', 'discount'])) }}</span></div>
          <div class="flex justify-between text-base font-bold text-slate-800"><span>Total</span><span>{{ money(pick(detail, ['totalAmount', 'total', 'grandTotal'])) }}</span></div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="detailOpen = false">Close</button>
        <button v-if="detail" class="btn-secondary" @click="receiptOpen = true"><Icon name="receipt" size="16" /> Receipt</button>
        <button v-if="detail && !['VOID','REFUNDED'].includes(detail.status)" class="btn-secondary" @click="openAction('return')">Return</button>
        <button v-if="detail && !['VOID','REFUNDED'].includes(detail.status)" class="btn-danger" @click="openAction('void')">Void</button>
      </template>
    </Modal>

    <!-- Printable receipt -->
    <Modal v-model="receiptOpen" title="Receipt" size="sm">
      <Receipt v-if="detail" :invoice="detail" :company="app.company" />
      <template #footer>
        <button class="btn-secondary" @click="receiptOpen = false">Close</button>
        <button class="btn-primary" @click="printReceipt"><Icon name="receipt" size="16" /> Print</button>
      </template>
    </Modal>

    <!-- Void / Return -->
    <Modal v-model="actionOpen" :title="actionType === 'void' ? 'Void invoice' : 'Return items'" size="md">
      <div class="space-y-3">
        <div>
          <label class="label">Restock warehouse</label>
          <select v-model.number="actionWarehouse" class="input">
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
        <div v-if="actionType === 'return'" class="space-y-2">
          <p class="label">Quantities to return</p>
          <div v-for="l in returnLines" :key="l.invoiceItemId" class="flex items-center gap-2">
            <span class="flex-1 truncate text-sm text-slate-700">{{ l.name }}</span>
            <span class="text-xs text-slate-400">max {{ num(l.returnable, 2) }}</span>
            <input v-model.number="l.quantity" type="number" min="0" :max="l.returnable" step="any" class="input w-24 py-1 text-sm text-right" />
          </div>
        </div>
        <div>
          <label class="label">Reason</label>
          <input v-model="actionReason" class="input" />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="actionOpen = false">Cancel</button>
        <button :class="actionType === 'void' ? 'btn-danger' : 'btn-primary'" :disabled="acting" @click="submitAction">
          <Spinner v-if="acting" size="16" /> {{ actionType === 'void' ? 'Void invoice' : 'Process return' }}
        </button>
      </template>
    </Modal>
  </div>
</template>
