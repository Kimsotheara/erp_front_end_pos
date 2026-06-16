export function money(value, currency = 'USD') {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  } catch {
    return n.toFixed(2)
  }
}

export function num(value, digits = 0) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  return Number.isNaN(n) ? String(value) : n.toLocaleString('en-US', { maximumFractionDigits: digits })
}

export function date(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-CA')
}

export function datetime(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-CA', { hour12: false })
}

export function time(value) {
  if (!value) return '—'
  if (typeof value === 'object' && value.hour != null) {
    return `${String(value.hour).padStart(2, '0')}:${String(value.minute ?? 0).padStart(2, '0')}`
  }
  return String(value)
}

const BADGE = {
  PAID: 'bg-emerald-100 text-emerald-700',
  OPEN: 'bg-sky-100 text-sky-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  VOID: 'bg-slate-200 text-slate-600',
  REFUNDED: 'bg-rose-100 text-rose-700',
  PARTIALLY_REFUNDED: 'bg-rose-100 text-rose-700',
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  OCCUPIED: 'bg-amber-100 text-amber-700',
  RESERVED: 'bg-sky-100 text-sky-700',
  CLEANING: 'bg-slate-200 text-slate-600',
  NEW: 'bg-sky-100 text-sky-700',
  PREPARING: 'bg-amber-100 text-amber-700',
  READY: 'bg-emerald-100 text-emerald-700',
  SERVED: 'bg-slate-200 text-slate-600',
  CANCELLED: 'bg-rose-100 text-rose-700',
  DRAFT: 'bg-slate-200 text-slate-600',
  REQUESTED: 'bg-sky-100 text-sky-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  RECEIVED: 'bg-emerald-100 text-emerald-700',
  IN_TRANSIT: 'bg-amber-100 text-amber-700',
}
export function badgeClass(value) {
  return BADGE[value] || 'bg-brand-100 text-brand-700'
}
