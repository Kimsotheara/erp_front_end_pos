<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/composables/useToast'
import Spinner from '@/components/ui/Spinner.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const app = useAppStore()
const toast = useToast()

const username = ref('superadmin')
const password = ref('123456')
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    await app.loadCompany()
    toast.success('Welcome back!')
    router.push(route.query.redirect || '/')
  } catch (e) {
    toast.error(e.message || 'Login failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-full items-center justify-center bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-500 p-4">
    <div class="w-full max-w-md">
      <div class="mb-6 text-center text-white">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 8h12M6 12h12M6 16h7" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold">ERP POS Platform</h1>
        <p class="text-sm text-white/70">Sign in to your dashboard</p>
      </div>

      <form class="card space-y-4 p-6" @submit.prevent="submit">
        <div>
          <label class="label">Username</label>
          <input v-model="username" class="input" autocomplete="username" required />
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model="password" type="password" class="input" autocomplete="current-password" required />
        </div>
        <button class="btn-primary w-full" :disabled="loading">
          <Spinner v-if="loading" size="16" /> Sign in
        </button>
        <p class="text-center text-xs text-slate-400">Default seed: superadmin / 123456</p>
      </form>
    </div>
  </div>
</template>
