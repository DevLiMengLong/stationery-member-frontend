<template>
  <main class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">文</div>
        <div>
          <strong>文具店会员系统</strong>
          <span>Stationery CRM</span>
        </div>
      </div>

      <nav class="nav-list">
        <a class="active" href="#">会员管理</a>
        <a href="#">积分记录</a>
        <a href="#">商品偏好</a>
        <a href="#">系统设置</a>
      </nav>
    </aside>

    <section class="content">
      <header class="topbar">
        <div>
          <h1>会员管理</h1>
          <p>维护会员资料、等级和积分，为收银与营销提供基础数据。</p>
        </div>
        <button class="primary-button" type="button" @click="openCreateDialog">新增会员</button>
      </header>

      <div class="stats-grid">
        <article class="metric-card">
          <span>有效会员</span>
          <strong>{{ memberStore.enabledCount }}</strong>
        </article>
        <article class="metric-card">
          <span>VIP 会员</span>
          <strong>{{ memberStore.vipCount }}</strong>
        </article>
        <article class="metric-card">
          <span>累计积分</span>
          <strong>{{ memberStore.totalPoints }}</strong>
        </article>
      </div>

      <section class="toolbar panel">
        <label>
          <span>关键词</span>
          <input
            v-model.trim="memberStore.keyword"
            type="search"
            placeholder="姓名 / 手机号 / 会员编号"
            @keyup.enter="memberStore.loadMembers"
          />
        </label>
        <button class="secondary-button" type="button" :disabled="memberStore.loading" @click="memberStore.loadMembers">
          {{ memberStore.loading ? '查询中' : '查询' }}
        </button>
      </section>

      <p v-if="!memberStore.apiAvailable" class="notice">
        后端暂不可用，当前未加载会员数据。启动 MySQL、Redis 和后端服务后刷新即可读取真实接口。
      </p>

      <MemberTable :members="memberStore.members" />
    </section>

    <div v-if="creating" class="dialog-mask" @click.self="creating = false">
      <form class="dialog" @submit.prevent="submitMember">
        <div class="dialog-header">
          <h2>新增会员</h2>
          <button type="button" class="ghost-button" @click="creating = false">关闭</button>
        </div>
        <label>
          <span>姓名</span>
          <input v-model.trim="form.name" required maxlength="64" />
        </label>
        <label>
          <span>手机号</span>
          <input v-model.trim="form.mobile" required maxlength="11" pattern="^1[3-9]\d{9}$" />
        </label>
        <label>
          <span>等级</span>
          <AppSelect v-model="form.level" :options="LEVEL_OPTIONS" aria-label="会员等级" />
        </label>
        <label>
          <span>初始积分</span>
          <input v-model.number="form.points" min="0" type="number" />
        </label>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <button class="primary-button" type="submit" :disabled="saving">
          {{ saving ? '保存中' : '保存会员' }}
        </button>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import AppSelect from '@/components/AppSelect.vue'
import type { AppSelectOption } from '@/components/AppSelect.vue'
import MemberTable from '@/components/MemberTable.vue'
import { useMemberStore } from '@/stores/member'

const LEVEL_OPTIONS: AppSelectOption[] = [
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'VIP', label: 'VIP' }
]

const memberStore = useMemberStore()
const creating = ref(false)
const saving = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  mobile: '',
  level: 'NORMAL',
  points: 0
})

function openCreateDialog() {
  form.name = ''
  form.mobile = ''
  form.level = 'NORMAL'
  form.points = 0
  formError.value = ''
  creating.value = true
}

async function submitMember() {
  saving.value = true
  formError.value = ''
  try {
    await memberStore.addMember({ ...form })
    creating.value = false
  } catch (error) {
    formError.value = error instanceof Error ? error.message : '保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  memberStore.loadMembers()
})
</script>
