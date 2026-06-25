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

test('recent transaction cards use compact horizontal rows', () => {
  assert.match(
    appVue,
    /<div class="recent-identity">\s*<strong>手机号: \{\{ tx\.mobile \}\}<\/strong>\s*<strong>姓名: \{\{ tx\.memberName \}\}<\/strong>\s*<\/div>/,
    'phone and member name should stay in one compact identity row'
  )
  assert.match(
    appVue,
    /<span v-if="cashierMode === 'RECHARGE'">赠送金额: <strong class="recent-amount-value">\{\{ money\(tx\.giftAmount\) \}\}<\/strong><\/span>/,
    'recharge cards should include the gift amount shown in the compact prototype'
  )

  assert.equal(
    hasRuleWith('.recent-card', [/\bgap:\s*8px\b/, /\bpadding:\s*10px\s+12px\b/]),
    true,
    'recent card spacing should be compact enough for the one-screen cashier layout'
  )
  assert.equal(
    hasRuleWith('.recent-card-head', [/\bdisplay:\s*grid\b/, /\bgrid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\b/, /\bfont-size:\s*12px\b/]),
    true,
    'serial number and status should share a single header row'
  )
  assert.equal(
    hasRuleWith('.recent-status', [/\bjustify-self:\s*end\b/, /\bfont-size:\s*12px\b/]),
    true,
    'status badge should stay small and pinned to the right'
  )
  assert.equal(
    hasRuleWith('.recent-identity', [/\bdisplay:\s*flex\b/, /\bgap:\s*5px\s+16px\b/, /\bfont-size:\s*14px\b/]),
    true,
    'member identity should be a compact horizontal row'
  )
  assert.equal(
    hasRuleWith('.recent-money-row', [/\bdisplay:\s*flex\b/, /\bgap:\s*5px\s+12px\b/, /\bfont-size:\s*11px\b/, /\bpadding-top:\s*7px\b/]),
    true,
    'amount fields should use the compact multi-column row'
  )
})
