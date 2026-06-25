import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

function hasRuleWith(selector, requiredSnippets) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+')
  const selectorList = `(?:^|})\\s*[^{}]*${escaped}[^{}]*\\{(?<body>[^}]*)\\}`
  return [...css.matchAll(new RegExp(selectorList, 'gs'))].some((match) => {
    const body = match.groups?.body || ''
    return requiredSnippets.every((snippet) => snippet.test(body))
  })
}

function cashierView() {
  const cashierViewStart = appVue.indexOf('<section v-else class="mobile-content cashier-view">')
  const cashierViewEnd = appVue.indexOf('<nav class="bottom-tabs">', cashierViewStart)
  assert.notEqual(cashierViewStart, -1, 'cashier view section should exist')
  assert.notEqual(cashierViewEnd, -1, 'bottom tabs should follow cashier view')
  return appVue.slice(cashierViewStart, cashierViewEnd)
}

function sourceFunction(name) {
  const functionStart = appVue.indexOf(`function ${name}`)
  assert.notEqual(functionStart, -1, `${name} should exist`)
  const functionEnd = appVue.indexOf('\n}\n\n', functionStart)
  assert.notEqual(functionEnd, -1, `${name} should have a readable function body`)
  return appVue.slice(functionStart, functionEnd + 3)
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

test('cashier phone placeholder stays fully visible on narrow screens', () => {
  const cashier = cashierView()

  assert.match(
    cashier,
    /<div class="cashier-field cashier-phone-field" :class="\{ active: activeCashierInput === 'keyword' \}">\s*<span aria-hidden="true">⌕<\/span>\s*<input v-model="cashier\.keyword" aria-label="会员手机号" placeholder="输入手机号或后4位" inputmode="none" readonly autocomplete="off" @focus="activateCashierInput\('keyword', \$event\)" @pointerdown\.prevent="activateCashierInput\('keyword', \$event\)" \/>/,
    'phone lookup input should have a dedicated field class for compact placeholder styling'
  )
  assert.equal(
    hasRuleWith('.cashier-field input', [/\bflex:\s*1\s+1\s+0\b/, /\bmin-width:\s*0\b/]),
    true,
    'cashier inputs should shrink inside the icon field instead of clipping under adjacent controls'
  )
  assert.equal(
    hasRuleWith('.cashier-phone-field span', [/\bflex:\s*0\s+0\s+34px\b/, /\bfont-size:\s*18px\b/]),
    true,
    'phone lookup icon should reserve less width for the full placeholder'
  )
  assert.equal(
    hasRuleWith('.cashier-phone-field input', [/\bfont-size:\s*15px\b/]),
    true,
    'phone lookup text should be smaller than the amount input'
  )
  assert.equal(
    hasRuleWith('.cashier-phone-field input::placeholder', [/\bfont-size:\s*14px\b/]),
    true,
    'phone lookup placeholder should be compact enough to show the full 后4位 text'
  )
})

test('cashier mode tabs stay compact so the keypad and submit button fit', () => {
  assert.equal(
    hasRuleWith('.cashier-view', [/\bgap:\s*8px\b/]),
    true,
    'cashier view should use tighter vertical spacing above the input panel'
  )
  assert.equal(
    hasRuleWith('.cashier-tabs button', [/\bmin-height:\s*48px\b/, /\bfont-size:\s*18px\b/]),
    true,
    'cashier recharge and deduction tabs should stay compact on mobile'
  )
  assert.doesNotMatch(
    css,
    /@media \(max-width: 480px\)[\s\S]*?\.cashier-tabs button\s*\{[\s\S]*?\bmin-height:\s*58px\b/,
    'narrow screens should not enlarge the cashier mode tabs and steal keypad space'
  )
})

test('cashier amount is entered only from the on-page keypad', () => {
  const cashier = cashierView()

  assert.match(
    cashier,
    /<div class="cashier-field" :class="\{ active: activeCashierInput === 'amount' \}">\s*<span aria-hidden="true">¥<\/span>\s*<input\s+v-model="cashier\.amount"\s+aria-label="收银金额"\s+placeholder="0\.00"\s+inputmode="none"\s+readonly\s+autocomplete="off"\s+@focus="activateCashierInput\('amount', \$event\)"\s+@pointerdown\.prevent="activateCashierInput\('amount', \$event\)"\s+\/>/,
    'cashier amount input should not open a system keyboard in recharge or deduction mode'
  )
  assert.match(
    appVue,
    /function activateCashierInput\(target: CashierInputTarget, event\?: Event\)[\s\S]*activeCashierInput\.value = target[\s\S]*const input = event\?\.target as HTMLInputElement \| undefined[\s\S]*input\?\.blur\(\)/,
    'cashier inputs should blur if they receive focus'
  )
  assert.match(
    cashier,
    /<button v-for="key in keypad" :key="key" type="button" @click="pressCashierKey\(key\)">/,
    'cashier keypad buttons should drive the active cashier input'
  )
})

test('cashier phone is entered only from the on-page keypad', () => {
  assert.match(
    appVue,
    /type CashierInputTarget = 'keyword' \| 'amount'/,
    'cashier should track whether the page keypad is editing phone or amount'
  )
  assert.match(
    appVue,
    /const activeCashierInput = ref<CashierInputTarget>\('keyword'\)/,
    'cashier keypad should default to phone entry first'
  )
  assert.match(
    appVue,
    /function pressCashierKey\(key: string\)[\s\S]*if \(activeCashierInput\.value === 'keyword'\)[\s\S]*pressCashierKeywordKey\(key\)[\s\S]*pressCashierAmountKey\(key\)/,
    'page keypad should route keys to the active cashier input'
  )
  assert.match(
    appVue,
    /function pressCashierKeywordKey\(key: string\)[\s\S]*cashier\.keyword = cashier\.keyword\.slice\(0, -1\)[\s\S]*if \(!\/\^\\d\$\/\.test\(key\)\) return[\s\S]*if \(cashier\.keyword\.length >= 11\) return[\s\S]*cashier\.keyword = `\$\{cashier\.keyword\}\$\{key\}`/,
    'phone keypad entry should support backspace, digits only, and 11 digit maximum'
  )
  assert.match(
    appVue,
    /function pressCashierAmountKey\(key: string\)[\s\S]*if \(key === 'back'\)[\s\S]*cashier\.amount = cashier\.amount\.slice\(0, -1\)[\s\S]*if \(key === '\.' && cashier\.amount\.includes\('\.'\)\) return/,
    'amount keypad entry should keep the decimal amount rules'
  )
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

test('cashier submission refreshes selected member balance from transaction result', () => {
  assert.match(
    appVue,
    /const transaction = await apiPost<AnyMap>\([\s\S]*\/merchant\/transactions\/consume[\s\S]*\)/,
    'cashier submission should keep the successful transaction payload returned by the backend'
  )
  assert.match(
    appVue,
    /syncSelectedCashierMemberBalance\(transaction\)/,
    'cashier submission should update the selected member balance immediately after a successful transaction'
  )
  assert.match(
    appVue,
    /function syncSelectedCashierMemberBalance\(transaction: AnyMap\)[\s\S]*selectedCashierMember\.value = \{[\s\S]*selectedCashierMember\.value,[\s\S]*totalBalance: transaction\.afterTotalBalance[\s\S]*\}/,
    'selected cashier member totalBalance should be replaced with the transaction afterTotalBalance value'
  )
})

test('cashier submission clears member and amount inputs after success', () => {
  assert.match(
    appVue,
    /function clearCashierForm\(\)[\s\S]*cashier\.keyword = ''[\s\S]*cashier\.amount = ''[\s\S]*selectedCashierMember\.value = null[\s\S]*candidateMembers\.value = \[\][\s\S]*candidateModalVisible\.value = false/,
    'successful cashier submission should clear phone, amount, selected member name, balance, and stale candidates'
  )
  assert.match(
    appVue,
    /syncSelectedCashierMemberBalance\(transaction\)\s*[\r\n]+\s*clearCashierForm\(\)/,
    'cashier submission should clear visible cashier form state after the backend transaction succeeds'
  )
  assert.doesNotMatch(
    appVue,
    /syncSelectedCashierMemberBalance\(transaction\)\s*[\r\n]+\s*cashier\.amount = ''/,
    'cashier submission should not leave phone/member/balance state uncleared by only clearing the amount'
  )
})

test('cashier mode switch clears phone and amount inputs instead of reusing the previous member', () => {
  const setCashierMode = sourceFunction('setCashierMode')

  assert.match(
    setCashierMode,
    /cashierMode\.value = mode[\s\S]*clearCashierForm\(\)[\s\S]*void guarded\(loadRecentTransactions\)/,
    'switching recharge and deduction should clear phone, amount, selected member, balance, candidates, and active input'
  )
  assert.doesNotMatch(
    setCashierMode,
    /normalizedCashierKeyword|autoLookupCashierMember/,
    'switching modes should not auto-lookup with the previous phone number'
  )
})
