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
    /<span class="merchant-member-meta-line">\s*<span class="merchant-member-mobile">\{\{ member\.mobile \}\}<\/span>\s*<span class="merchant-member-separator" aria-hidden="true">·<\/span>\s*<em class="merchant-member-age">\{\{ member\.age \}\}岁<\/em>\s*<\/span>/,
    'phone and age should render as separate inline items so age can stay fully visible'
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
  assert.equal(
    hasRuleWith('.merchant-member-meta-line', [/\bdisplay:\s*flex\b/, /\bwhite-space:\s*nowrap\b/]),
    true,
    'member phone and age should share one compact flex row'
  )
  assert.equal(
    hasRuleWith('.merchant-member-mobile', [/\boverflow:\s*hidden\b/, /\btext-overflow:\s*ellipsis\b/]),
    true,
    'only the phone value should ellipsize when card width is tight'
  )
  assert.equal(
    hasRuleWith('.merchant-member-age', [/\bflex:\s*0\s+0\s+auto\b/]),
    true,
    'age should not shrink into an ellipsis'
  )
  assert.doesNotMatch(
    css,
    /\.merchant-member-meta-line\s*\{[^}]*\btext-overflow:\s*ellipsis\b/,
    'the full meta row should not ellipsize because that hides the age'
  )
  assert.doesNotMatch(
    css,
    /\.member-row strong,\s*\.member-row span,\s*\.member-row small\s*\{[\s\S]*?\bdisplay:\s*block\b/,
    'member row text should not force every nested inline label onto its own line'
  )
})
