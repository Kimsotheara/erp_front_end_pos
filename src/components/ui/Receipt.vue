<script setup>
// Printable point-of-sale receipt. Reused by POS checkout and Invoice detail.
// Marked with `.receipt-print` so the print stylesheet (style.css) can isolate it.
import { computed } from 'vue'
import { money, datetime, num } from '@/utils/format'
import { pick, firstArray } from '@/utils/pick'

const props = defineProps({
  invoice: { type: Object, required: true },
  company: { type: Object, default: null },
})

const inv = computed(() => props.invoice || {})
const logo = computed(() => pick(props.company, ['logoUrl', 'image']))
const number = computed(() => pick(inv.value, ['invoiceNo', 'invoiceNumber', 'number'], inv.value.id))
const when = computed(() => datetime(pick(inv.value, ['createdAt', 'invoiceDate', 'date'])))
const lines = computed(() => firstArray(inv.value, ['items', 'invoiceItems', 'lines']))
const payments = computed(() => firstArray(inv.value, ['payments']))

const sub = computed(() => pick(inv.value, ['subtotal', 'subTotal']))
const tax = computed(() => pick(inv.value, ['taxAmount', 'tax']))
const discount = computed(() => pick(inv.value, ['discountAmount', 'discount']))
const total = computed(() => pick(inv.value, ['totalAmount', 'total', 'grandTotal']))
const change = computed(() => pick(inv.value, ['changeAmount', 'change']))

function lineName(l) {
  return pick(l, ['productName', 'name'], '#' + l.productId)
}
function lineQty(l) {
  return num(pick(l, ['quantity', 'qty']), 2)
}
function lineTotal(l) {
  return money(pick(l, ['lineTotal', 'total', 'subtotal']))
}
function methodName(p) {
  return pick(p, ['paymentMethodName', 'methodName', 'method', 'name'], 'Payment')
}
</script>

<template>
  <div class="receipt-print mx-auto max-w-xs font-mono text-xs text-slate-800">
    <div class="text-center">
      <img v-if="logo" :src="logo" alt="logo" class="mx-auto mb-1 h-14 w-auto max-w-[160px] object-contain" />
      <p class="text-sm font-bold uppercase">{{ company?.name || 'ERP POS' }}</p>
      <p v-if="company?.address" class="text-slate-500">{{ company.address }}</p>
      <p v-if="company?.phone" class="text-slate-500">Tel: {{ company.phone }}</p>
    </div>

    <div class="my-2 border-y border-dashed border-slate-300 py-1.5">
      <div class="flex justify-between"><span>Receipt</span><span>{{ number }}</span></div>
      <div class="flex justify-between"><span>Date</span><span>{{ when }}</span></div>
      <div v-if="inv.status" class="flex justify-between"><span>Status</span><span>{{ inv.status }}</span></div>
    </div>

    <table class="w-full">
      <tbody>
        <tr v-for="(l, i) in lines" :key="i" class="align-top">
          <td class="py-0.5 pr-1">
            <div>{{ lineName(l) }}</div>
            <div class="text-slate-500">{{ lineQty(l) }} × {{ money(pick(l, ['unitPrice', 'price'])) }}</div>
          </td>
          <td class="py-0.5 text-right">{{ lineTotal(l) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="mt-2 space-y-0.5 border-t border-dashed border-slate-300 pt-1.5">
      <div v-if="sub != null" class="flex justify-between"><span>Subtotal</span><span>{{ money(sub) }}</span></div>
      <div v-if="tax != null" class="flex justify-between"><span>Tax</span><span>{{ money(tax) }}</span></div>
      <div v-if="discount" class="flex justify-between"><span>Discount</span><span>−{{ money(discount) }}</span></div>
      <div class="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{{ money(total) }}</span></div>
    </div>

    <div v-if="payments.length" class="mt-1.5 space-y-0.5 border-t border-dashed border-slate-300 pt-1.5">
      <div v-for="(p, i) in payments" :key="i" class="flex justify-between">
        <span>{{ methodName(p) }}</span><span>{{ money(pick(p, ['amount'])) }}</span>
      </div>
      <div v-if="change" class="flex justify-between"><span>Change</span><span>{{ money(change) }}</span></div>
    </div>

    <p class="mt-3 text-center text-slate-500">Thank you for your purchase!</p>
  </div>
</template>
