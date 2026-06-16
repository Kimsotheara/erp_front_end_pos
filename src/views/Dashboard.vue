<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { reportsApi } from '@/api/reports'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { money, num } from '@/utils/format'
import { pick, firstArray } from '@/utils/pick'
import StatCard from '@/components/ui/StatCard.vue'
import Spinner from '@/components/ui/Spinner.vue'
import BarList from '@/components/ui/BarList.vue'

const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const data = ref(null)
const lowStock = ref([])
const topProducts = ref([])

const todaySales = ref(0)
const mtdSales = ref(0)
const mtdProfit = ref(0)
const txnCount = ref(0)

onMounted(async () => {
  if (!auth.companyId) {
    loading.value = false
    return
  }
  try {
    const d = await reportsApi.dashboard(auth.companyId)
    data.value = d
    todaySales.value = pick(d, ['todaySales', 'todayRevenue', 'salesToday', 'today'], 0)
    mtdSales.value = pick(d, ['monthSales', 'mtdSales', 'monthToDateSales', 'revenue'], 0)
    mtdProfit.value = pick(d, ['monthProfit', 'mtdProfit', 'profit', 'grossProfit'], 0)
    txnCount.value = pick(d, ['todayInvoices', 'invoiceCount', 'transactions', 'todayTransactions'], 0)
    topProducts.value = firstArray(d, ['topProducts', 'top']).slice(0, 6)
    lowStock.value = firstArray(d, ['lowStock', 'lowStockProducts']).slice(0, 8)
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
})

function name(o) {
  return pick(o, ['productName', 'name', 'product', 'sku'], '—')
}
function qty(o) {
  return pick(o, ['quantitySold', 'quantity', 'qty', 'totalQuantity', 'soldQuantity'], 0)
}
function onhand(o) {
  return pick(o, ['onHand', 'quantity', 'stock', 'available'], 0)
}
function reorder(o) {
  return pick(o, ['reorderLevel', 'reorder', 'minLevel'], 0)
}

const topBars = computed(() =>
  topProducts.value.map((p) => ({ label: name(p), value: qty(p), display: `${num(qty(p))} sold` })),
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">Dashboard</h1>
      <RouterLink to="/pos" class="btn-primary">Open POS</RouterLink>
    </div>

    <div v-if="loading" class="flex justify-center py-20"><Spinner size="32" /></div>

    <template v-else-if="auth.companyId">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Sales" :value="money(todaySales)" icon="cash" tone="emerald" />
        <StatCard label="Sales (MTD)" :value="money(mtdSales)" icon="chart" tone="brand" />
        <StatCard label="Profit (MTD)" :value="money(mtdProfit)" icon="coin" tone="amber" />
        <StatCard label="Transactions" :value="num(txnCount)" icon="receipt" tone="brand" />
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="card">
          <div class="border-b border-slate-200 px-5 py-3.5">
            <h2 class="font-semibold text-slate-800">Top Selling Products</h2>
          </div>
          <BarList :items="topBars" tone="brand" empty="No sales data yet." />
        </div>

        <div class="card">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 class="font-semibold text-slate-800">Low Stock Alert</h2>
            <span class="badge bg-rose-100 text-rose-700">{{ lowStock.length }}</span>
          </div>
          <ul v-if="lowStock.length" class="divide-y divide-slate-100">
            <li v-for="(p, i) in lowStock" :key="i" class="flex items-center justify-between px-5 py-3">
              <span class="text-sm text-slate-700">{{ name(p) }}</span>
              <span class="text-sm">
                <span class="font-semibold text-rose-600">{{ num(onhand(p)) }}</span>
                <span class="text-slate-400"> / {{ num(reorder(p)) }}</span>
              </span>
            </li>
          </ul>
          <p v-else class="px-5 py-10 text-center text-sm text-slate-400">All stock levels healthy.</p>
        </div>
      </div>
    </template>

    <div v-else class="card p-10 text-center text-slate-400">
      No company context on your account — dashboard analytics are unavailable.
    </div>
  </div>
</template>
