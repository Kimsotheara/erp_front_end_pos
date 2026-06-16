<script setup>
import { computed } from 'vue'
import { getResource } from '@/config/resources'
import ResourcePage from '@/components/crud/ResourcePage.vue'

// Route param is `resourceKey` (NOT `key` — that is a reserved Vue attribute
// that RouterView consumes as the vnode key, so it never arrives as a prop).
const props = defineProps({ resourceKey: String })
const exists = computed(() => !!getResource(props.resourceKey))
</script>

<template>
  <ResourcePage v-if="exists" :key="resourceKey" :resource-key="resourceKey" />
  <div v-else class="card p-10 text-center text-slate-400">Unknown resource: {{ resourceKey }}</div>
</template>
