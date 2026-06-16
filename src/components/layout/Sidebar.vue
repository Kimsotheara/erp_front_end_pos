<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { NAV } from '@/config/nav'
import { useAppStore } from '@/stores/app'
import Icon from '@/components/ui/Icon.vue'

const app = useAppStore()

const groups = computed(() =>
  NAV.filter((g) => !g.feature || app.features[g.feature]).map((g) => ({
    ...g,
    items: g.items.filter((it) => !it.feature || app.features[it.feature]),
  })),
)
</script>

<template>
  <aside
    class="flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-200"
    :class="app.sidebarOpen ? 'w-64' : 'w-0 overflow-hidden md:w-16'"
  >
    <div class="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Icon name="grid" size="18" />
      </div>
      <span v-show="app.sidebarOpen" class="truncate font-semibold text-slate-800">ERP&nbsp;POS</span>
    </div>

    <nav class="flex-1 space-y-4 overflow-y-auto px-3 py-4">
      <div v-for="g in groups" :key="g.group">
        <p v-show="app.sidebarOpen" class="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {{ g.group }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="it in g.items" :key="it.to">
            <RouterLink
              :to="it.to"
              class="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              active-class="bg-brand-50 text-brand-700"
              :title="it.label"
            >
              <Icon :name="it.icon" size="18" class="shrink-0" />
              <span v-show="app.sidebarOpen" class="truncate">{{ it.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>
