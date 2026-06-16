<script setup>
import { ref, computed, onMounted } from 'vue'
import { reportsApi } from '@/api/reports'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/composables/useToast'
import { money, num } from '@/utils/format'
import { pick, firstArray } from '@/utils/pick'
import { exportCsv } from '@/utils/export'
import StatCard from '@/components/ui/StatCard.vue'
import Spinner from '@/components/ui/Spinner.vue'
import BarList from '@/components/ui/BarList.vue'
import Icon from '@/components/ui/Icon.vue'

const auth = useAuthStore()
const app = useAppStore()
const toast = useToast()

const logo = computed(() => pick(app.company, ['logoUrl', 'image']))

function printReport() {
  window.print()
}

const today = new Date().toISOString().slice(0, 10)
const monthStart = today.slice(0, 8) + '01'
const from = ref(monthStart)
const to = ref(today)
const loading = ref(false)

const sales = ref(null)
const profit = ref(null)
const top = ref([])
const expenses = ref([])

async function run() {
  if (!auth.companyId) return
  loading.value = true
  try {
    const [s, p, t, e] = await Promise.all([
      reportsApi.salesSummary(auth.companyId, from.value, to.value),
      reportsApi.profit(auth.companyId, from.value, to.value),
      reportsApi.topProducts(auth.companyId, from.value, to.value, 10),
      reportsApi.expenseSummary(auth.companyId, from.value, to.value),
    ])
    sales.value = s
    profit.value = p
    top.value = firstArray(t, ['items', 'products', 'topProducts'])
    expenses.value = firstArray(e, ['items', 'categories', 'expenses'])
  } catch (err) {
    toast.error(err.message)
  } finally {
    loading.value = false
  }
}

onMounted(run)

const topBars = computed(() =>
  top.value.map((p) => ({
    label: pick(p, ['productName', 'name'], '—'),
    value: pick(p, ['revenue', 'total'], 0),
    display: `${num(pick(p, ['quantitySold', 'quantity', 'qty'], 0))} · ${money(pick(p, ['revenue', 'total'], 0))}`,
  })),
)
const expenseBars = computed(() =>
  expenses.value.map((e) => ({
    label: pick(e, ['category', 'name'], 'Uncategorized'),
    value: pick(e, ['total', 'amount'], 0),
    display: money(pick(e, ['total', 'amount'], 0)),
  })),
)

function exportTop() {
  if (!top.value.length) return toast.warn('Nothing to export')
  const rows = top.value.map((p) => ({
    product: pick(p, ['productName', 'name'], '—'),
    quantity: pick(p, ['quantitySold', 'quantity', 'qty'], 0),
    revenue: pick(p, ['revenue', 'total'], 0),
  }))
  exportCsv(`top-products_${from.value}_${to.value}.csv`, rows, [
    { key: 'product', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'revenue', label: 'Revenue' },
  ])
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h1 class="text-xl font-semibold text-slate-800">Reports</h1>
      <div class="flex items-end gap-2">
        <div>
          <label class="label text-xs">From</label>
          <input v-model="from" type="date" class="input py-1.5 text-sm" />
        </div>
        <div>
          <label class="label text-xs">To</label>
          <input v-model="to" type="date" class="input py-1.5 text-sm" />
        </div>
        <button class="btn-secondary" :disabled="!top.length" @click="exportTop"><Icon name="inbox" size="16" /> Export CSV</button>
        <button class="btn-secondary" @click="printReport"><Icon name="receipt" size="16" /> Print</button>
        <button class="btn-primary" :disabled="loading" @click="run"><Spinner v-if="loading" size="16" /> Run</button>
      </div>
    </div>

    <div v-if="!auth.companyId" class="card p-10 text-center text-slate-400">No company context available.</div>

    <template v-else>
      <!-- Print-only branded header -->
      <div class="report-print space-y-5">
      <div class="mb-4 hidden items-center gap-3 border-b border-slate-300 pb-3 print:flex">
        <img v-if="logo" :src="logo" alt="logo" class="h-12 w-auto max-w-[140px] object-contain" />
        <div>
          <p class="text-base font-bold text-slate-800">{{ app.company?.name || 'ERP POS' }}</p>
          <p class="text-xs text-slate-500">Performance Report · {{ from }} → {{ to }}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" :value="money(pick(sales, ['totalSales', 'revenue', 'total'], 0))" icon="cash" tone="emerald" />
        <StatCard label="Invoices" :value="num(pick(sales, ['invoiceCount', 'count', 'transactions'], 0))" icon="receipt" tone="brand" />
        <StatCard label="Gross Profit" :value="money(pick(profit, ['grossProfit', 'profit'], 0))" icon="coin" tone="amber" />
        <StatCard label="Margin" :value="num(pick(profit, ['margin', 'marginPercent'], 0), 1) + '%'" icon="percent" tone="brand" />
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="card">
          <div class="border-b border-slate-200 px-5 py-3.5"><h2 class="font-semibold text-slate-800">Top Products</h2></div>
          <BarList :items="topBars" tone="brand" empty="No data." />
        </div>

        <div class="card">
          <div class="border-b border-slate-200 px-5 py-3.5"><h2 class="font-semibold text-slate-800">Expenses by Category</h2></div>
          <BarList :items="expenseBars" tone="amber" empty="No data." />
        </div>
      </div>
      </div>
    </template>
  </div>
</template>
