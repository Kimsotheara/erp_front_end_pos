<script setup>
import { watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: Boolean,
  title: String,
  size: { type: String, default: 'md' }, // sm | md | lg | xl
})
const emit = defineEmits(['update:modelValue'])

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

function close() {
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)
</script>

<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8">
        <div class="my-auto w-full card" :class="sizes[size]" @click.stop>
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h3 class="text-base font-semibold text-slate-800">{{ title }}</h3>
            <button class="btn-ghost -mr-2 p-1.5" @click="close"><Icon name="x" /></button>
          </div>
          <div class="px-5 py-4">
            <slot />
          </div>
          <div v-if="$slots.footer" class="flex justify-end gap-2 border-t border-slate-200 px-5 py-3.5">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
