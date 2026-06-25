import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
const httpTs = readFileSync(new URL('../src/api/http.ts', import.meta.url), 'utf8')

function hasRuleWith(selector, requiredSnippets) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+')
  const selectorList = `(?:^|})\\s*[^{}]*${escaped}[^{}]*\\{(?<body>[^}]*)\\}`
  return [...css.matchAll(new RegExp(selectorList, 'gs'))].some((match) => {
    const body = match.groups?.body || ''
    return requiredSnippets.every((snippet) => snippet.test(body))
  })
}

test('api errors prefer backend business messages from non-2xx responses', () => {
  assert.match(
    httpTs,
    /http\.interceptors\.response\.use\([\s\S]*,\s*\(error\) =>/,
    'response interceptor should handle rejected axios responses as well as successful envelopes'
  )
  assert.match(
    httpTs,
    /axios\.isAxiosError\(error\)[\s\S]*error\.response\?\.data[\s\S]*message/,
    'axios 409/422 responses should read response.data.message before using the default axios message'
  )
  assert.doesNotMatch(
    httpTs,
    /Promise\.reject\(new Error\(payload\.message \|\| 'Request failed'\)\)\s*[\r\n]+\s*}\s*[\r\n]+\s*return response\s*[\r\n]+\s*}\)$/,
    'interceptor must not only handle success:false responses that still came back with 2xx status'
  )
})

test('cashier auto-lookups members after entering at least four phone digits', () => {
  assert.match(
    appVue,
    /import \{ computed, onMounted, reactive, ref, watch \} from 'vue'/,
    'cashier should watch the phone keyword instead of requiring a manual name-button lookup'
  )
  assert.match(
    appVue,
    /watch\(\s*\(\) => cashier\.keyword,\s*\(keyword\) => \{[\s\S]*normalizedCashierKeyword\(keyword\)[\s\S]*keywordText\.length < 4[\s\S]*autoLookupCashierMember\(keywordText\)/,
    'typing four or more phone digits should trigger the silent member lookup flow'
  )
  assert.match(
    appVue,
    /async function autoLookupCashierMember\(keyword: string\)[\s\S]*\/merchant\/members\/lookup[\s\S]*applyCashierLookupResult\(result, \{ openCandidates: false, requireMatch: false \}\)/,
    'automatic lookup should call the backend and auto-apply a unique match without opening the candidate modal'
  )
  assert.match(
    appVue,
    /function applyCashierLookupResult\(result: AnyMap, options: \{ openCandidates: boolean; requireMatch: boolean \}\)[\s\S]*selectedCashierMember\.value = result\.member[\s\S]*cashier\.keyword = result\.member\.mobile[\s\S]*activeCashierInput\.value = 'amount'/,
    'unique lookup results should immediately fill the member name and move keypad focus to amount input'
  )
})

test('cashier member name wraps instead of ellipsizing long member names', () => {
  assert.equal(
    hasRuleWith('.cashier-member-button', [/\bwhite-space:\s*normal\b/, /\boverflow-wrap:\s*anywhere\b/, /\bfont-size:\s*13px\b/]),
    true,
    'member name button should use smaller wrapping text so names like 余额不足会员 stay visible'
  )
  assert.doesNotMatch(
    css,
    /\.cashier-member-button\s*\{[^}]*\btext-overflow:\s*ellipsis\b/s,
    'cashier member name button must not render an ellipsis'
  )
})
