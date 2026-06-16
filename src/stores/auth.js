import { defineStore } from 'pinia'
import http, { getToken, setToken } from '@/api/http'

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    user: JSON.parse(localStorage.getItem('erp.user') || 'null'),
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
    claims: (s) => (s.token ? decodeJwt(s.token) : null),
    companyId() {
      return this.user?.companyId ?? this.claims?.companyId ?? null
    },
    roles() {
      return this.claims?.roles ?? this.user?.roles ?? []
    },
    displayName() {
      return this.user?.fullName || this.user?.username || this.claims?.fullName || 'User'
    },
  },
  actions: {
    async login(username, password, companyId) {
      const body = await http.post('/auth/login', { username, password, companyId })
      this.token = body.accessToken
      this.user = body.user || null
      setToken(this.token)
      localStorage.setItem('erp.user', JSON.stringify(this.user))
      return body
    },
    async changePassword(currentPassword, newPassword) {
      return http.post('/auth/change-password', { currentPassword, newPassword })
    },
    logout() {
      this.token = null
      this.user = null
      setToken(null)
      localStorage.removeItem('erp.user')
    },
  },
})
