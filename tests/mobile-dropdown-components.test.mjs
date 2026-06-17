import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const dashboardVue = readFileSync(new URL('../src/views/DashboardView.vue', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
const paginationVue = readFileSync(new URL('../src/components/PaginationControls.vue', import.meta.url), 'utf8')

function hasRuleWith(selector, requiredSnippets) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+')
  const selectorList = `(?:^|})\\s*[^{}]*${escaped}[^{}]*\\{(?<body>[^}]*)\\}`
  return [...css.matchAll(new RegExp(selectorList, 'gs'))].some((match) => {
    const body = match.groups?.body || ''
    return requiredSnippets.every((snippet) => snippet.test(body))
  })
}

test('mobile and modal dropdowns use the controlled AppSelect component', () => {
  assert.doesNotMatch(appVue, /<select\b/, 'App.vue should not open native mobile select menus in form and filter surfaces')
  assert.doesNotMatch(dashboardVue, /<select\b/, 'DashboardView should not open native mobile select menus in its modal')

  assert.match(appVue, /import AppSelect from '@\/components\/AppSelect\.vue'/, 'App.vue should use the shared dropdown component')
  assert.match(dashboardVue, /import AppSelect from '@\/components\/AppSelect\.vue'/, 'DashboardView should use the shared dropdown component')

  assert.ok((appVue.match(/<AppSelect\b/g) || []).length >= 6, 'App.vue should replace each form/filter select')
  assert.ok((dashboardVue.match(/<AppSelect\b/g) || []).length >= 1, 'DashboardView should replace the member level select')
})

test('AppSelect menu overlays below its field without expanding form layout', () => {
  assert.equal(
    hasRuleWith('.app-select', [/\bposition:\s*relative\b/, /\bwidth:\s*100%/]),
    true,
    'AppSelect should create a positioning context matching the field width'
  )
  assert.equal(
    hasRuleWith('.app-select-menu', [/\bposition:\s*absolute\b/, /\bleft:\s*0\b/, /\bright:\s*0\b/, /\btop:\s*calc\(100%\s*\+\s*6px\)/]),
    true,
    'AppSelect menu should float below the trigger without adding layout height'
  )
  assert.equal(
    hasRuleWith('.app-select-option', [/\bmin-height:\s*44px\b/]),
    true,
    'dropdown options should keep a touch-friendly mobile hit area'
  )
  assert.equal(
    hasRuleWith('.cashier-form-grid', [/\balign-items:\s*start\b/]),
    true,
    'cashier grid controls should stay aligned when a dropdown opens'
  )
})

test('admin filters stay compact and page-size dropdown opens above pagination', () => {
  assert.match(
    paginationVue,
    /<AppSelect[\s\S]*class="page-size-select"[\s\S]*@change="changePageSize"/,
    'pagination page-size should use the controlled dropdown component'
  )
  assert.doesNotMatch(paginationVue, /<select\b/, 'pagination should not use the native select that clips inside table panels')
  assert.equal(
    hasRuleWith('.admin-filter', [
      /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(180px,\s*240px\)\)/,
      /\bjustify-content:\s*start\b/
    ]),
    true,
    'admin filters should use moderate fixed tracks instead of stretching to the full panel width'
  )
  assert.equal(
    hasRuleWith('.admin-filter button', [/\bwidth:\s*min\(180px,\s*100%\)/, /\bjustify-self:\s*start\b/]),
    true,
    'filter buttons should stay at an appropriate width'
  )
  assert.equal(
    hasRuleWith('.page-size-control .app-select-menu', [/\btop:\s*auto\b/, /\bbottom:\s*calc\(100%\s*\+\s*6px\)/, /\bz-index:\s*90\b/]),
    true,
    'page-size menu should open upward above pagination and stay above the table panel'
  )
})
