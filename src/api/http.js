import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

const TOKEN_KEY = 'erp.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// Attach the bearer token to every request.
http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Unwrap the standard envelope { result, resultCode, resultMessage, body }
// and normalise errors into Error(message) so callers can show toasts.
http.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'body' in data && 'result' in data) {
      if (data.result === false) {
        const err = new Error(data.resultMessage || 'Request failed')
        err.resultCode = data.resultCode
        return Promise.reject(err)
      }
      return data.body
    }
    return data
  },
  (error) => {
    if (error.response?.status === 401) {
      setToken(null)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    const payload = error.response?.data
    const message =
      payload?.resultMessage ||
      payload?.message ||
      error.message ||
      'Network error'
    const err = new Error(message)
    err.status = error.response?.status
    err.payload = payload
    return Promise.reject(err)
  },
)

export default http
