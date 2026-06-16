import { reactive } from 'vue'

let seq = 0
export const toastState = reactive({ items: [] })

export function pushToast(message, type = 'info', timeout = 3500) {
  const id = ++seq
  toastState.items.push({ id, message, type })
  if (timeout) setTimeout(() => dismissToast(id), timeout)
  return id
}

export function dismissToast(id) {
  const i = toastState.items.findIndex((t) => t.id === id)
  if (i !== -1) toastState.items.splice(i, 1)
}

export function useToast() {
  return {
    success: (m) => pushToast(m, 'success'),
    error: (m) => pushToast(m, 'error', 6000),
    info: (m) => pushToast(m, 'info'),
    warn: (m) => pushToast(m, 'warn'),
  }
}
