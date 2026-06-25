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

test('merchant member cards keep gender and age suffix inline', () => {
  assert.match(
    appVue,
    /<strong class="merchant-member-name-line">\s*<span class="merchant-member-name-text">\{\{ member\.name \}\}<\/span>\s*<small class="merchant-member-gender">\{\{ genderText\(member\.gender\) \}\}<\/small>\s*<\/strong>/,
    'gender should render beside the member name in the same row'
  )
  assert.match(
    appVue,
    /<span class="merchant-member-meta-line">\{\{ member\.mobile \}\} · <em class="merchant-member-age">\{\{ member\.age \}\}岁<\/em><\/span>/,
    'age number and suffix should be wrapped together to avoid splitting the suffix onto a new line'
  )
  assert.equal(
    hasRuleWith('.merchant-member-name-line', [/\bdisplay:\s*flex\b/, /\bwhite-space:\s*nowrap\b/]),
    true,
    'member name line should lay out the name and gender horizontally'
  )
  assert.equal(
    hasRuleWith('.merchant-member-gender', [/\bwhite-space:\s*nowrap\b/]),
    true,
    'gender should not wrap away from the name'
  )
  assert.equal(
    hasRuleWith('.merchant-member-age', [/\bwhite-space:\s*nowrap\b/]),
    true,
    'age suffix should stay attached to the number'
  )
  assert.doesNotMatch(
    css,
    /\.member-row strong,\s*\.member-row span,\s*\.member-row small\s*\{[\s\S]*?\bdisplay:\s*block\b/,
    'member row text should not force every nested inline label onto its own line'
  )
})
