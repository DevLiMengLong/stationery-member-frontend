import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const paginationVue = readFileSync(new URL('../src/components/PaginationControls.vue', import.meta.url), 'utf8')
const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const memberTableVue = readFileSync(new URL('../src/components/MemberTable.vue', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

test('mobile pagination hides boundary and page-size controls with page size fixed at 10', () => {
  const boundaryButtonCount = paginationVue.match(/class="pager-boundary"/g)?.length || 0
  assert.equal(boundaryButtonCount, 2, 'first and last page buttons should be marked as mobile-hidden controls')
  assert.match(
    paginationVue,
    /<label v-if="!isMobilePagination" class="page-size-control">/,
    'mobile pagination should not render the page-size selector at all'
  )
  assert.match(paginationVue, /mobilePageSize:\s*10/, 'mobile pagination should default to 10 rows')
  assert.match(paginationVue, /emitChange\(1,\s*props\.mobilePageSize\)/, 'mobile pagination should reset to page 1 with 10 rows')

  assert.match(
    css,
    /@media\s*\(max-width:\s*900px\)[\s\S]*\.pager-boundary[\s\S]*display:\s*none/,
    'mobile styles should hide first/last page buttons'
  )
  assert.match(
    css,
    /@media\s*\(max-width:\s*900px\)[\s\S]*\.page-size-control[\s\S]*display:\s*none/,
    'mobile styles should hide the page-size selector'
  )
})

test('phone shell pagination stays mobile inside a wide desktop browser', () => {
  assert.match(
    css,
    /\.phone-shell\s+\.pager-boundary[\s\S]*display:\s*none/,
    'phone shell should hide first/last page buttons regardless of desktop viewport width'
  )
  assert.match(
    css,
    /\.phone-shell\s+\.page-size-control[\s\S]*display:\s*none/,
    'phone shell should hide the page-size selector regardless of desktop viewport width'
  )
  assert.match(
    appVue,
    /<PaginationControls\s+:page="merchantMemberPage"[\s\S]*\smobile-mode\b/,
    'merchant member pagination should force mobile pagination behavior inside the phone shell'
  )
  assert.match(
    appVue,
    /const merchantMemberPage = createApiPageState\(MOBILE_PAGE_SIZE\)/,
    'merchant member pagination should request 10 rows on the first load'
  )
})

test('mobile pagination page state initializes with 10 rows before data loading', () => {
  assert.match(appVue, /const MOBILE_PAGE_SIZE = 10/, 'app should define the mobile page size in one place')
  assert.match(appVue, /const MOBILE_PAGE_QUERY = '\(max-width: 900px\)'/, 'app should use the same mobile breakpoint as pagination styles')
  assert.match(
    appVue,
    /function defaultPageSize\(\)[\s\S]*matchMedia\(MOBILE_PAGE_QUERY\)\.matches[\s\S]*return MOBILE_PAGE_SIZE/,
    'initial page state should choose 10 rows on mobile before API requests run'
  )
  assert.match(appVue, /function createPageState\(pageSize = defaultPageSize\(\)\)/, 'local page state should use the responsive default')
  assert.match(appVue, /function createApiPageState\(pageSize = defaultPageSize\(\)\)/, 'API page state should use the responsive default')
})

test('legacy member table pagination uses the same mobile default', () => {
  assert.doesNotMatch(memberTableVue, /pageSize:\s*5/, 'member table should not hard-code 5 rows for all viewports')
  assert.match(memberTableVue, /const MOBILE_PAGE_SIZE = 10/, 'member table should define the same mobile row count')
  assert.match(
    memberTableVue,
    /function defaultPageSize\(\)[\s\S]*matchMedia\(MOBILE_PAGE_QUERY\)\.matches[\s\S]*return MOBILE_PAGE_SIZE/,
    'member table should initialize with 10 rows on mobile'
  )
})
