<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import Topbar from '@/components/layout/Topbar.vue'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
onMounted(() => {
  if (!app.company) app.loadCompany()
})
</script>

<template>
  <div class="flex h-full">
    <Sidebar />
    <div class="flex min-w-0 flex-1 flex-col">
      <Topbar />
      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </main>
    </div>
  </div>
</template>
