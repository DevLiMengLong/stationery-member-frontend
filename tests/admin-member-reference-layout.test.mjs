import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
const demoStore = readFileSync(new URL('../../backend/src/main/java/com/gechuang/stationery/demo/DemoDataStore.java', import.meta.url), 'utf8')
const adminController = readFileSync(new URL('../../backend/src/main/java/com/gechuang/stationery/admin/AdminController.java', import.meta.url), 'utf8')

function hasRuleWith(selector, requiredSnippets) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+')
  const selectorList = `(?:^|})\\s*[^{}]*${escaped}[^{}]*\\{(?<body>[^}]*)\\}`
  return [...css.matchAll(new RegExp(selectorList, 'gs'))].some((match) => {
    const body = match.groups?.body || ''
    return requiredSnippets.every((snippet) => snippet.test(body))
  })
}

test('admin member management matches the screenshot structure', () => {
  assert.match(appVue, /class="admin-member-filter"/, 'member page should use a dedicated screenshot-style filter card')
  assert.match(appVue, /<legend>充值金额范围<\/legend>/, 'filter card should include the recharge range label')
  assert.match(appVue, /<legend>消费金额范围<\/legend>/, 'filter card should include the consumption range label')
  assert.match(appVue, /重置筛选/, 'filter card should expose reset filtering')
  assert.match(appVue, /导出数据/, 'filter card should keep export inside the filter action area')
  assert.match(appVue, /<th>头像<\/th><th>手机号<\/th><th>姓名<\/th><th>所属门店<\/th><th>加入时间<\/th><th>待消费金额<\/th><th>操作<\/th>/, 'table columns should follow the reference screenshot')
  assert.match(appVue, /class="member-row-action"[\s\S]*›/, 'row action should render as a right chevron')
})

test('admin member list uses screenshot spacing, avatar, and amount styles', () => {
  assert.equal(
    hasRuleWith('.member-management-head h1', [/\bfont-size:\s*32px\b/, /\bfont-weight:\s*900\b/]),
    true,
    'member title should match the large bold reference heading'
  )
  assert.equal(
    hasRuleWith('.admin-member-filter', [/\bdisplay:\s*flex\b/, /\bborder-radius:\s*8px\b/, /\bpadding:\s*16px 18px\b/]),
    true,
    'filter area should be a compact white card like the screenshot'
  )
  assert.equal(
    hasRuleWith('.member-filter-field', [/\bflex:\s*1 1 190px\b/, /\bmax-width:\s*250px\b/]),
    true,
    'filter inputs should shrink on desktop instead of forcing action buttons to a second row'
  )
  assert.equal(
    /\.member-filter-range\s*\{[^}]*\bflex-basis:\s*210px\b[^}]*\bmax-width:\s*260px\b/s.test(css),
    true,
    'range filters should keep enough width while still fitting the action group on the same row'
  )
  assert.equal(
    hasRuleWith('.member-filter-actions', [/\bdisplay:\s*flex\b/, /\bflex-wrap:\s*nowrap\b/]),
    true,
    'filter action buttons should stay on one row'
  )
  assert.equal(
    hasRuleWith('.admin-member-table tbody td', [/\bheight:\s*54px\b/, /\bfont-size:\s*15px\b/]),
    true,
    'member rows should be compact enough to show 10 records with pagination'
  )
  assert.equal(
    hasRuleWith('.admin-member-avatar', [/\bwidth:\s*38px\b/, /\bheight:\s*38px\b/, /border-radius:\s*50%/]),
    true,
    'member table should render circular avatar images'
  )
  assert.equal(
    hasRuleWith('.member-balance-pill', [/\bbackground:\s*#123a78\b/, /\bborder-radius:\s*999px\b/]),
    true,
    'pending amount should use the dark blue rounded pill treatment'
  )
})

test('admin member data stays backend-sourced and detail-consistent', () => {
  assert.doesNotMatch(appVue, /ADMIN_MEMBER_AVATARS/, 'member list must not rotate frontend-only static avatars by row index')
  assert.doesNotMatch(appVue, /adminMemberAvatarSrc\(member,\s*index\)/, 'member list avatar must come from the backend avatarUrl field')
  assert.match(appVue, /avatarImageSrc\(member\.avatarUrl\)/, 'member list should render the same avatarUrl field used by member detail')
  assert.match(demoStore, /private Map<String, Object> memberDetailMap\(MemberRecord member\) \{\s*Map<String, Object> map = memberListMap\(member\);/s, 'member detail should inherit list fields such as avatarUrl from the backend list map')
  assert.match(appVue, /const adminMemberPage = createApiPageState\(10\)/, 'member list should keep pagination while loading 10 rows per page')
  assert.doesNotMatch(appVue, /<PaginationControls v-if="adminMemberPage\.pages > 1" class="admin-member-pagination"/, 'member pagination should stay visible instead of being conditionally removed')
  assert.match(appVue, /function resetAdminMemberFilters\(\)/, 'reset action should clear all member filters')
  assert.match(appVue, /function memberListBalance\(member: AnyMap\)/, 'member amount display should use a dedicated balance helper')
  assert.match(demoStore, /map\.put\("totalBalance", money\(wallet\.total\(\)\)\)/, 'admin member API should expose totalBalance for the amount pill and CSV')
  assert.match(adminController, /BigDecimal consumptionMin/, 'member export should accept consumption range filters')
  assert.match(adminController, /adminMembersForExport\(mobile, name, storeId,[\s\S]*rechargeMin, rechargeMax, consumptionMin, consumptionMax\)/, 'member export should keep the current filter scope')
})
