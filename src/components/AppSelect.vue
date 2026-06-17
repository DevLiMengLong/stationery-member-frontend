<template>
  <div ref="root" class="app-select" :class="{ open, disabled }">
    <button
      class="app-select-trigger"
      type="button"
      role="combobox"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click="toggle"
      @keydown.down.prevent="moveActive(1)"
      @keydown.up.prevent="moveActive(-1)"
      @keydown.esc.stop="close"
    >
      <span>{{ selectedOption?.label || placeholder }}</span>
      <span class="app-select-arrow" aria-hidden="true">v</span>
    </button>
    <div v-if="open" class="app-select-menu" role="listbox">
      <button
        v-for="(option, index) in options"
        :key="String(option.value)"
        class="app-select-option"
        :class="{ selected: isSelected(option), active: index === activeIndex }"
        type="button"
        role="option"
        :aria-selected="isSelected(option)"
        :disabled="option.disabled"
        @click="choose(option)"
        @mouseenter="activeIndex = index"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

export type AppSelectOption = {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue: string | number
  options: AppSelectOption[]
  ariaLabel?: string
  placeholder?: string
  disabled?: boolean
}>(), {
  ariaLabel: '请选择',
  placeholder: '请选择',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const root = ref<HTMLElement | null>(null)
const open = ref(false)
const activeIndex = ref(-1)

const selectedOption = computed(() => (
  props.options.find((option) => String(option.value) === String(props.modelValue))
))

function isSelected(option: AppSelectOption) {
  return String(option.value) === String(props.modelValue)
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function close() {
  open.value = false
}

function choose(option: AppSelectOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  emit('change', option.value)
  close()
}

function moveActive(step: number) {
  if (props.disabled || !props.options.length) return
  if (!open.value) {
    open.value = true
    return
  }
  const total = props.options.length
  let next = activeIndex.value
  for (let count = 0; count < total; count += 1) {
    next = (next + step + total) % total
    if (!props.options[next]?.disabled) {
      activeIndex.value = next
      break
    }
  }
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target
  if (target instanceof Node && root.value?.contains(target)) return
  close()
}

watch(open, (isOpen) => {
  if (isOpen) {
    activeIndex.value = Math.max(0, props.options.findIndex(isSelected))
    document.addEventListener('click', onDocumentClick)
  } else {
    document.removeEventListener('click', onDocumentClick)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>
