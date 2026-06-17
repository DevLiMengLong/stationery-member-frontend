<template>
  <section class="panel table-panel">
    <div class="panel-header">
      <div>
        <h2>会员列表</h2>
        <p>展示最近 100 条会员数据，支持姓名、手机号和会员编号检索。</p>
      </div>
      <span class="count">{{ members.length }} 条</span>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>会员编号</th>
            <th>姓名</th>
            <th>手机号</th>
            <th>等级</th>
            <th>积分</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in visibleMembers" :key="member.id">
            <td>{{ member.memberNo }}</td>
            <td>{{ member.name }}</td>
            <td>{{ member.mobile }}</td>
            <td>
              <span class="level" :class="{ vip: member.level === 'VIP' }">{{ member.level }}</span>
            </td>
            <td>{{ member.points }}</td>
            <td>
              <span class="status" :class="{ off: member.status !== 1 }">
                {{ member.status === 1 ? '启用' : '停用' }}
              </span>
            </td>
          </tr>
          <tr v-if="!visibleMembers.length">
            <td class="empty" colspan="6">暂无会员数据</td>
          </tr>
        </tbody>
      </table>
    </div>
    <PaginationControls :page="pageInfo" @change="changePage" />
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'

import type { Member } from '@/api/member'
import PaginationControls from '@/components/PaginationControls.vue'

const props = defineProps<{
  members: Member[]
}>()

const PAGE_SIZE_OPTIONS = [5, 10, 20]
const MOBILE_PAGE_SIZE = 10
const MOBILE_PAGE_QUERY = '(max-width: 900px)'

function defaultPageSize() {
  if (typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(MOBILE_PAGE_QUERY).matches) {
    return MOBILE_PAGE_SIZE
  }
  return PAGE_SIZE_OPTIONS[0]
}

const pagination = reactive({ pageNo: 1, pageSize: defaultPageSize() })
const pageInfo = computed(() => {
  const total = props.members.length
  const pages = Math.max(1, Math.ceil(total / pagination.pageSize))
  const pageNo = Math.min(pagination.pageNo, pages)
  return { pageNo, pageSize: pagination.pageSize, total, pages }
})
const visibleMembers = computed(() => {
  const start = (pageInfo.value.pageNo - 1) * pageInfo.value.pageSize
  return props.members.slice(start, start + pageInfo.value.pageSize)
})

function changePage(change: { pageNo: number; pageSize: number }) {
  pagination.pageNo = change.pageNo
  pagination.pageSize = change.pageSize
}
</script>
