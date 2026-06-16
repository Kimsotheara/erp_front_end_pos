import { ref } from 'vue'
import { createResource } from '@/api/resource'
import { useAuthStore } from '@/stores/auth'

const cache = new Map()

// Loads selectable options for a ref field: { resource, labelKey, valueKey, companyScoped }
export function useRefOptions() {
  const options = ref([])
  const loading = ref(false)

  async function load(refConf) {
    if (!refConf?.resource) return
    const auth = useAuthStore()
    const valueKey = refConf.valueKey || 'id'
    const labelKey = refConf.labelKey || 'name'
    const cacheKey = `${refConf.resource}|${auth.companyId}`
    if (cache.has(cacheKey)) {
      options.value = cache.get(cacheKey)
      return
    }
    loading.value = true
    try {
      const api = createResource(`/${refConf.resource}`)
      const { items } = await api.list({ size: 200, sortProperty: 'id', sortDirection: 'asc' })
      const mapped = items.map((it) => ({
        value: it[valueKey],
        label: it[labelKey] ?? it.name ?? it.code ?? `#${it[valueKey]}`,
      }))
      cache.set(cacheKey, mapped)
      options.value = mapped
    } catch {
      options.value = []
    } finally {
      loading.value = false
    }
  }

  return { options, loading, load }
}

export function clearRefCache() {
  cache.clear()
}
