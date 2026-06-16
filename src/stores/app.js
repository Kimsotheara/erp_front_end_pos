import { defineStore } from 'pinia'
import http from '@/api/http'
import { enabledFeatureGroups } from '@/config/modules'
import { useAuthStore } from './auth'

export const useAppStore = defineStore('app', {
  state: () => ({
    company: JSON.parse(localStorage.getItem('erp.company') || 'null'),
    sidebarOpen: true,
    loadingCompany: false,
  }),
  getters: {
    businessType: (s) => s.company?.businessType || 'MINI_MART',
    // When VITE_SHOW_ALL_MODULES=true, every feature group is unlocked
    // regardless of business type (useful during development). Otherwise the
    // README behaviour applies: modules load by business type.
    features() {
      if (import.meta.env.VITE_SHOW_ALL_MODULES === 'true') {
        return { pharmacy: true, pub: true, minimart: true }
      }
      return enabledFeatureGroups(this.businessType)
    },
  },
  actions: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },
    async loadCompany() {
      const auth = useAuthStore()
      if (!auth.companyId) return
      this.loadingCompany = true
      try {
        const company = await http.get(`/companies/${auth.companyId}`)
        this.company = company
        localStorage.setItem('erp.company', JSON.stringify(company))
      } catch {
        // Non-fatal: fall back to default business type.
      } finally {
        this.loadingCompany = false
      }
    },
    reset() {
      this.company = null
      localStorage.removeItem('erp.company')
    },
  },
})
