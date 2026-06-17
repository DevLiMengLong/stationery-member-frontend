import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const memberStore = readFileSync(new URL('../src/stores/member.ts', import.meta.url), 'utf8')
const dashboardView = readFileSync(new URL('../src/views/DashboardView.vue', import.meta.url), 'utf8')

test('frontend must not replace failed interfaces with fake business records', () => {
  assert.doesNotMatch(memberStore, /fallbackMembers/, 'member store must not define frontend-only member records')
  assert.doesNotMatch(memberStore, /this\.members\s*=\s*fallbackMembers/, 'member store must not use fake records when API fails')
  assert.doesNotMatch(dashboardView, /前端示例数据/, 'legacy dashboard must not tell users it is showing frontend sample data')
})

test('frontend business identity fields must come from backend responses', () => {
  assert.doesNotMatch(appVue, /dashboard\.shopName\s*\|\|\s*'欣悦生活馆'/, 'merchant dashboard name must not fall back to a hardcoded store')
  assert.doesNotMatch(appVue, /dashboard\.account\s*\|\|\s*'xinyue_store'/, 'merchant dashboard account must not fall back to a hardcoded account')
  assert.doesNotMatch(appVue, /<span>Admin<\/span>\s*<small>系统管理员<\/small>/, 'admin header must not hardcode administrator identity')
  assert.match(appVue, /currentAdmin/, 'admin identity should be stored from auth API response')
  assert.doesNotMatch(appVue, /member\.totalBalance\s*\?\?\s*member\.availableBalance/, 'member balance list must not hide a missing totalBalance field with another backend field')
})
