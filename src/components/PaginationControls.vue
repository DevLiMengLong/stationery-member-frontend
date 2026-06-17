<template>
  <nav class="pagination-controls" aria-label="分页">
    <span>共 {{ page.total }} 条</span>
    <div class="pager-buttons">
      <button class="pager-boundary" type="button" :disabled="page.pageNo <= 1" @click="emitChange(1)">首页</button>
      <button type="button" :disabled="page.pageNo <= 1" @click="emitChange(page.pageNo - 1)">上一页</button>
      <strong>{{ page.pageNo }} / {{ safePages }}</strong>
      <button type="button" :disabled="page.pageNo >= safePages" @click="emitChange(page.pageNo + 1)">下一页</button>
      <button class="pager-boundary" type="button" :disabled="page.pageNo >= safePages" @click="emitChange(safePages)">末页</button>
    </div>
    <label v-if="!isMobilePagination" class="page-size-control">
      <span>每页</span>
      <AppSelect
        class="page-size-select"
        :model-value="page.pageSize"
        :options="pageSizeOptions"
        aria-label="每页条数"
        @change="changePageSize"
      />
    </label>
  </nav>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import AppSelect from '@/components/AppSelect.vue'
import type { AppSelectOption } from '@/components/AppSelect.vue'

export interface PaginationPage {
  pageNo: number
  pageSize: number
  total: number
  pages: number
}

const props = withDefaults(defineProps<{
  page: PaginationPage
  pageSizes?: number[]
  mobileMode?: boolean
  mobilePageSize?: number
}>(), {
  pageSizes: () => [5, 10, 20],
  mobileMode: false,
  mobilePageSize: 10
})

const emit = defineEmits<{
  change: [payload: { pageNo: number; pageSize: number }]
}>()

const safePages = computed(() => Math.max(1, Number(props.page.pages) || 1))
const pageSizeOptions = computed<AppSelectOption[]>(() => (
  props.pageSizes.map((size) => ({ label: `${size} 条`, value: size }))
))
const viewportMobilePagination = ref(false)
const isMobilePagination = computed(() => props.mobileMode || viewportMobilePagination.value)

const MOBILE_PAGINATION_QUERY = '(max-width: 900px)'
let mobileQuery: MediaQueryList | undefined

function emitChange(pageNo: number, pageSize = props.page.pageSize) {
  emit('change', {
    pageNo: Math.min(Math.max(1, pageNo), safePages.value),
    pageSize
  })
}

function syncMobilePaginationState(query: MediaQueryList | MediaQueryListEvent) {
  viewportMobilePagination.value = query.matches
}

function enforceMobilePageSize() {
  if (isMobilePagination.value && props.page.pageSize !== props.mobilePageSize) {
    emitChange(1, props.mobilePageSize)
  }
}

function changePageSize(value: string | number) {
  emitChange(1, Number(value) || props.page.pageSize)
}

onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mobileQuery = window.matchMedia(MOBILE_PAGINATION_QUERY)
    syncMobilePaginationState(mobileQuery)
    mobileQuery.addEventListener('change', syncMobilePaginationState)
  }
  enforceMobilePageSize()
})

onBeforeUnmount(() => {
  mobileQuery?.removeEventListener('change', syncMobilePaginationState)
})

watch(isMobilePagination, enforceMobilePageSize)
watch(() => props.page.pageSize, enforceMobilePageSize)
</script>
