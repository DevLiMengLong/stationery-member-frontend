import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

test('marketing entry shows current recharge tier summary from loaded tiers', () => {
  assert.doesNotMatch(
    appVue,
    /<small>配置充值优惠方案<\/small>/,
    'marketing entry should not show the generic recharge configuration copy'
  )
  assert.match(
    appVue,
    /<small>\{\{ currentRechargeTierSummary \}\}<\/small>/,
    'marketing entry should bind the summary text to current recharge tiers'
  )
  assert.match(
    appVue,
    /const currentRechargeTierSummary = computed\(\(\) => \{[\s\S]*tiers\.value[\s\S]*tierAmount\(tier\.rechargeAmount\)[\s\S]*tierAmount\(tier\.giftAmount\)[\s\S]*join\('  '\)/,
    'current recharge tier summary should format each tier as recharge-gift and separate tiers with two spaces'
  )
})

test('tier configuration groups four tiers in a bordered plan box without update times', () => {
  const tiersScreenStart = appVue.indexOf("<template v-else-if=\"merchantScreen === 'tiers'\">")
  const tiersScreenEnd = appVue.indexOf("<template v-else-if=\"merchantScreen === 'memberDetail' && selectedMember\">", tiersScreenStart)
  assert.notEqual(tiersScreenStart, -1, 'tier configuration screen should exist')
  assert.notEqual(tiersScreenEnd, -1, 'member detail screen should follow tier configuration')

  const tiersScreen = appVue.slice(tiersScreenStart, tiersScreenEnd)
  const planBoxStart = tiersScreen.indexOf('<section class="tier-plan-box" aria-label="充值4档方案">')
  const planBoxEnd = tiersScreen.indexOf('<h3>历史充值活动</h3>', planBoxStart)
  assert.notEqual(planBoxStart, -1, 'tier configuration should wrap the four plans in a bordered box')
  assert.notEqual(planBoxEnd, -1, 'history heading should follow the four-plan box')

  const planBox = tiersScreen.slice(planBoxStart, planBoxEnd)
  assert.match(planBox, /v-for="tier in tiers"/, 'plan box should contain the four loaded tier cards')
  assert.doesNotMatch(planBox, /tier\.updatedAt|tier-updated/, 'tier cards should not render update time records')
  assert.match(css, /\.tier-plan-box\s*\{[\s\S]*border:\s*1px\s+solid/, 'tier plan box should define a visible border')
})
