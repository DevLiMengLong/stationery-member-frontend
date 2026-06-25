import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')

function cashierView() {
  const cashierViewStart = appVue.indexOf('<section v-else class="mobile-content cashier-view">')
  const cashierViewEnd = appVue.indexOf('<nav class="bottom-tabs">', cashierViewStart)
  assert.notEqual(cashierViewStart, -1, 'cashier view section should exist')
  assert.notEqual(cashierViewEnd, -1, 'bottom tabs should follow cashier view')
  return appVue.slice(cashierViewStart, cashierViewEnd)
}

test('consumption cashier shows current balance instead of item input', () => {
  const cashier = cashierView()

  assert.doesNotMatch(cashier, /placeholder="消费项目"/, 'deduction cashier should not ask the merchant to enter an item name')
  assert.doesNotMatch(cashier, /v-model="cashier\.itemName"[\s\S]*class="cashier-side-input"/, 'deduction cashier should not bind the old item input')
  assert.match(cashier, /<span class="cashier-field-label">会员手机号<\/span>/, 'phone field should use the screenshot-style field label')
  assert.match(cashier, /placeholder="输入手机号或后4位"/, 'phone lookup should allow full mobile or last four digits')
  assert.match(cashier, /<span class="cashier-field-label">\{\{ cashierMode === 'RECHARGE' \? '充值金额' : '扣款金额' \}\}<\/span>/, 'amount field should use the screenshot-style deduction label')
  assert.match(cashier, /<div v-if="cashierMode === 'CONSUMPTION'" class="cashier-balance-card">[\s\S]*<span>现有余额<\/span>[\s\S]*\{\{ selectedCashierMember \? money\(selectedCashierMember\.totalBalance\) : '--' \}\}[\s\S]*<\/div>/, 'deduction cashier should show the selected member balance beside the amount field')
})

test('admin consumption records keep reserved item name field', () => {
  assert.match(
    appVue,
    /<thead><tr><th>消费时间<\/th><th>金额<\/th><th>项目名称<\/th><th>订单号<\/th><\/tr><\/thead>/,
    'admin consumption records should keep the reserved item name column'
  )
  assert.match(
    appVue,
    /itemName: cashierMode\.value === 'RECHARGE' \? '会员充值' : '消费扣款'/,
    'merchant deduction submissions should keep a default item name for the reserved admin field'
  )
})
