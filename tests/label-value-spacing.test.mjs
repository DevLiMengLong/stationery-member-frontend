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

test('label/value display cards have explicit spacing rules', () => {
  assert.match(
    appVue,
    /<div class="info-grid">[\s\S]*?<span>性别<\/span><strong>/,
    'member detail still contains the label/value structure that needs spacing'
  )
  assert.match(
    appVue,
    /<div class="summary-grid two">[\s\S]*?<div class="panel-card"><span>充值次数<\/span><strong>/,
    'summary cards still contain adjacent label/value nodes'
  )

  const spacedSelectors = ['.info-grid div', '.summary-grid > .panel-card', '.admin-metrics > .panel-card']
  for (const selector of spacedSelectors) {
    assert.equal(
      hasRuleWith(selector, [/display:\s*(?:flex|grid)\b/, /\bgap\s*:/]),
      true,
      `${selector} should define layout spacing between labels and values`
    )
  }

  assert.equal(
    hasRuleWith('.member-balance-card', [/\bgap\s*:/]),
    true,
    '.member-balance-card should keep account labels and values visually separated'
  )
})
