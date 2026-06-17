import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')

test('cashier input panel appears before recent transaction records', () => {
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
    inputHeadingIndex < recentHeadingIndex,
    'cashier input should be placed above recent transaction records'
  )
})
