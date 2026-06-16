<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/composables/useToast'
import { clearRefCache } from '@/composables/useRefOptions'
import Icon from '@/components/ui/Icon.vue'
import Modal from '@/components/ui/Modal.vue'

const auth = useAuthStore()
const app = useAppStore()
const router = useRouter()
const toast = useToast()

const menuOpen = ref(false)
const pwOpen = ref(false)
const pw = ref({ currentPassword: '', newPassword: '' })

function logout() {
  auth.logout()
  app.reset()
  clearRefCache()
  router.push('/login')
}

async function changePassword() {
  try {
    await auth.changePassword(pw.value.currentPassword, pw.value.newPassword)
    toast.success('Password changed')
    pwOpen.value = false
    pw.value = { currentPassword: '', newPassword: '' }
  } catch (e) {
    toast.error(e.message)
  }
}
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
    <div class="flex items-center gap-3">
      <button class="btn-ghost p-1.5" @click="app.toggleSidebar()"><Icon name="menu2" /></button>
      <div class="hidden sm:block">
        <p class="text-sm font-semibold text-slate-800">{{ app.company?.name || 'ERP POS Platform' }}</p>
        <p class="text-xs text-slate-400">{{ app.businessType }}</p>
      </div>
    </div>

    <div class="relative">
      <button class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100" @click="menuOpen = !menuOpen">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {{ auth.displayName.charAt(0).toUpperCase() }}
        </div>
        <span class="hidden text-sm font-medium text-slate-700 sm:block">{{ auth.displayName }}</span>
      </button>
      <div v-if="menuOpen" class="absolute right-0 z-30 mt-1 w-48 card py-1" @click="menuOpen = false">
        <button class="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50" @click="pwOpen = true">
          <Icon name="key" size="16" /> Change password
        </button>
        <button class="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50" @click="logout">
          <Icon name="logout" size="16" /> Sign out
        </button>
      </div>
    </div>

    <Modal v-model="pwOpen" title="Change password" size="sm">
      <div class="space-y-3">
        <div>
          <label class="label">Current password</label>
          <input v-model="pw.currentPassword" type="password" class="input" />
        </div>
        <div>
          <label class="label">New password</label>
          <input v-model="pw.newPassword" type="password" class="input" />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="pwOpen = false">Cancel</button>
        <button class="btn-primary" @click="changePassword">Update</button>
      </template>
    </Modal>
  </header>
</template>
