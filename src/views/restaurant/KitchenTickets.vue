<script setup>
import { ref, onMounted } from 'vue'
import http from '@/api/http'
import { createResource } from '@/api/resource'
import { useToast } from '@/composables/useToast'
import { datetime, badgeClass } from '@/utils/format'
import { pick, firstArray } from '@/utils/pick'
import Spinner from '@/components/ui/Spinner.vue'

const toast = useToast()
const api = createResource('/kitchen-tickets')

const tickets = ref([])
const loading = ref(false)

const NEXT = { NEW: 'PREPARING', PREPARING: 'READY', READY: 'SERVED' }

async function load() {
  loading.value = true
  try {
    tickets.value = (await api.list({ size: 100, sortProperty: 'id', sortDirection: 'desc' })).items
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

async function advance(t) {
  const next = NEXT[t.status]
  if (!next) return
  try {
    await http.patch(`/kitchen-tickets/${t.id}/status`, { status: next })
    toast.success(`Ticket → ${next}`)
    load()
  } catch (e) {
    toast.error(e.message)
  }
}
async function setStatus(t, status) {
  try {
    await http.patch(`/kitchen-tickets/${t.id}/status`, { status })
    toast.success(`Ticket → ${status}`)
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">Kitchen Tickets</h1>
      <button class="btn-secondary" @click="load">Refresh</button>
    </div>

    <div v-if="loading" class="flex justify-center py-16"><Spinner size="28" /></div>
    <div v-else-if="tickets.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="t in tickets" :key="t.id" class="card p-4">
        <div class="mb-2 flex items-center justify-between">
          <div>
            <p class="font-semibold text-slate-800">Ticket #{{ pick(t, ['ticketNo', 'number'], t.id) }}</p>
            <p class="text-xs text-slate-400">{{ t.tableId ? 'Table #' + t.tableId : 'Counter' }} · {{ datetime(t.createdAt) }}</p>
          </div>
          <span class="badge" :class="badgeClass(t.status)">{{ t.status }}</span>
        </div>
        <ul class="mb-3 space-y-1 text-sm text-slate-600">
          <li v-for="(it, i) in firstArray(t, ['items', 'lines'])" :key="i" class="flex justify-between">
            <span>{{ pick(it, ['menuItemName', 'name', 'productName'], 'Item') }}</span>
            <span class="text-slate-400">×{{ it.quantity }}</span>
          </li>
        </ul>
        <div class="flex gap-2">
          <button v-if="NEXT[t.status]" class="btn-primary flex-1 py-1.5 text-sm" @click="advance(t)">Mark {{ NEXT[t.status] }}</button>
          <button v-if="!['SERVED','CANCELLED'].includes(t.status)" class="btn-ghost py-1.5 text-sm text-rose-600" @click="setStatus(t, 'CANCELLED')">Cancel</button>
        </div>
      </div>
    </div>
    <div v-else class="card py-16 text-center text-slate-400">No kitchen tickets.</div>
  </div>
</template>
