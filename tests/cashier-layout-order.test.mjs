import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')

test('cashier shows only the latest transaction before the input panel', () => {
  const cashierViewStart = appVue.indexOf('<section v-else class="mobile-content cashier-view">')
  const cashierViewEnd = appVue.indexOf('<nav class="bottom-tabs">', cashierViewStart)
  assert.notEqual(cashierViewStart, -1, 'cashier view section should exist')
  assert.notEqual(cashierViewEnd, -1, 'bottom tabs should follow cashier view')

  const cashierView = appVue.slice(cashierViewStart, cashierViewEnd)
  const inputHeadingIndex = cashierView.indexOf("<h2>{{ cashierMode === 'RECHARGE' ? '充值输入' : '扣款输入' }}</h2>")
  const recentHeadingIndex = cashierView.indexOf("<h3 class=\"recent-title\">最近{{ cashierMode === 'RECHARGE' ? '充值' : '扣款' }}</h3>")
  assert.notEqual(inputHeadingIndex, -1, 'cashier input heading should exist')
  assert.notEqual(recentHeadingIndex, -1, 'recent transaction heading should exist')
  assert.ok(
    recentHeadingIndex < inputHeadingIndex,
    'latest transaction should be placed above the cashier input panel'
  )
  assert.match(
    cashierView,
    /v-for="tx in latestRecentTransactions"/,
    'cashier view should render the one-record latest transaction collection'
  )
  assert.match(
    appVue,
    /const latestRecentTransactions = computed\(\(\) => recentTransactions\.value\.slice\(0,\s*1\)\)/,
    'cashier view should defensively keep only the latest transaction in the UI'
  )
  assert.match(
    appVue,
    /limit:\s*1/,
    'recent transaction API should only request one record for the cashier page'
  )
})
