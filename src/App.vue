<template>
  <div class="app-root">
    <div v-if="toast" class="toast">{{ toast }}</div>

    <section v-if="appMode === 'merchant' && !merchantAuthed" class="login-page mobile-login">
      <div class="login-card">
        <div class="app-logo">▣</div>
        <h1>商家管理系统</h1>
        <p>高效便捷的会员营销与消费管理专家</p>
        <form class="login-form" @submit.prevent="loginMerchant">
          <label>
            <span>账号</span>
            <input v-model="merchantLogin.account" autocomplete="username" placeholder="请输入账号" />
          </label>
          <label>
            <span>密码</span>
            <input v-model="merchantLogin.password" autocomplete="current-password" placeholder="请输入密码" type="password" />
          </label>
          <button class="primary-button" type="submit" :disabled="busy">登录</button>
        </form>
        <button class="link-button" type="button" @click="merchantResetVisible = true">忘记密码？</button>
        <div class="demo-box">
          <strong>演示账号</strong>
          <span>账号：xinyue_store</span>
          <span>密码：123456</span>
        </div>
        <button class="ghost-button full" type="button" @click="switchMode('admin')">进入管理后台</button>
      </div>
    </section>

    <section v-else-if="appMode === 'admin' && !adminAuthed" class="login-page admin-login">
      <div class="login-card admin-card">
        <div class="app-logo admin-logo">▣</div>
        <h1>门店会员管理后台</h1>
        <p>请输入您的管理员账号以继续访问经营数据</p>
        <form class="login-form" @submit.prevent="loginAdmin">
          <label>
            <span>管理员账号</span>
            <input v-model="adminLogin.username" autocomplete="username" placeholder="请输入您的管理员账号" />
          </label>
          <label>
            <span>密码</span>
            <input v-model="adminLogin.password" autocomplete="current-password" placeholder="请输入您的密码" type="password" />
          </label>
          <button class="admin-primary" type="submit" :disabled="busy">登录</button>
        </form>
        <div class="demo-line">演示账号：superadmin / Member@123</div>
        <button class="ghost-button full" type="button" @click="switchMode('merchant')">返回商家端</button>
      </div>
    </section>

    <section v-else-if="appMode === 'merchant'" class="phone-shell">
      <main class="phone-screen">
        <template v-if="merchantScreen === 'profile'">
          <header class="mobile-header">
            <button class="icon-button" type="button" @click="merchantScreen = 'tabs'">‹</button>
            <h2>个人信息管理</h2>
          </header>
          <div class="mobile-content">
            <section class="panel-card">
              <div class="avatar-row">
                <div class="avatar large">
                  <img v-if="profileForm.avatarUrl" :src="assetUrl(profileForm.avatarUrl)" alt="" />
                  <span v-else>{{ initials(profileForm.shopName) }}</span>
                </div>
                <div>
                  <button class="ghost-button" type="button" @click="profileFileInput?.click()">上传头像</button>
                  <input ref="profileFileInput" class="hidden-input" type="file" accept="image/png,image/jpeg,image/webp" @change="uploadProfileAvatar" />
                </div>
              </div>
              <label>
                <span>店铺名称</span>
                <input v-model="profileForm.shopName" maxlength="50" placeholder="请输入店铺名称" />
              </label>
              <div class="form-hint">{{ profileForm.shopName.length }}/50</div>
            </section>
            <section class="panel-card">
              <h3>修改密码</h3>
              <label>
                <span>新密码（留空则不修改）</span>
                <input v-model="profileForm.newPassword" placeholder="至少6个字符" type="password" />
              </label>
              <label>
                <span>确认密码</span>
                <input v-model="profileForm.confirmPassword" placeholder="再次输入新密码" type="password" />
              </label>
              <ul class="tip-list">
                <li>密码至少需要 6 个字符</li>
                <li>建议使用字母、数字和符号组合</li>
                <li>不要使用过于简单的密码</li>
              </ul>
            </section>
            <button class="primary-button full" type="button" @click="saveMerchantProfile">保存修改</button>
            <button class="ghost-button full" type="button" @click="merchantScreen = 'tabs'">取消</button>
          </div>
        </template>

        <template v-else-if="merchantScreen === 'tiers'">
          <header class="mobile-header">
            <button class="icon-button" type="button" @click="merchantScreen = 'tabs'">‹</button>
            <h2>充值梯度配置</h2>
          </header>
          <div class="mobile-content">
            <h3>设置充值优惠梯度</h3>
            <p class="muted">共4档固定梯度，自主决定每档的充值金额和赠送金额</p>
            <article
              v-for="tier in tiers"
              :key="tier.tierNo"
              class="tier-card"
              :class="{ editing: editingTier === Number(tier.tierNo) }"
              :role="editingTier === Number(tier.tierNo) ? undefined : 'button'"
              :tabindex="editingTier === Number(tier.tierNo) ? undefined : 0"
              :aria-label="`编辑第 ${tier.tierNo} 档充值梯度`"
              @click="editingTier !== Number(tier.tierNo) && editTier(tier)"
              @keydown.enter="editingTier !== Number(tier.tierNo) && editTier(tier)"
              @keydown.space.prevent="editingTier !== Number(tier.tierNo) && editTier(tier)"
            >
              <template v-if="editingTier === Number(tier.tierNo)">
                <label>
                  <span>充值金额</span>
                  <input v-model="tierDraft.rechargeAmount" inputmode="decimal" min="0" step="0.01" type="number" @click.stop />
                </label>
                <label>
                  <span>赠送金额</span>
                  <input v-model="tierDraft.giftAmount" inputmode="decimal" min="0" step="0.01" type="number" @click.stop />
                </label>
                <div class="button-row">
                  <button class="ghost-button" type="button" @click.stop="editingTier = 0">取消</button>
                  <button class="primary-button" type="button" @click.stop="saveTier(Number(tier.tierNo))">保存</button>
                </div>
              </template>
              <template v-else>
                <div class="tier-summary">
                  <span class="tier-label">第 {{ tier.tierNo }} 档</span>
                  <strong class="tier-price">
                    充 {{ tierAmount(tier.rechargeAmount) }}
                    <em>送 {{ tierAmount(tier.giftAmount) }}</em>
                  </strong>
                </div>
                <span class="tier-updated">{{ tier.updatedAt }}</span>
              </template>
            </article>
            <h3>历史充值活动</h3>
            <article v-for="campaign in campaigns" :key="campaign.id" class="history-card">
              <strong>{{ campaign.campaignName }}</strong>
              <span class="pill">{{ campaign.status === 'SAVED' ? '已保存' : '已启用' }}</span>
              <p>{{ campaign.summary }}</p>
              <small>{{ campaign.storeName }} · {{ campaign.createdAt }}</small>
            </article>
          </div>
        </template>

        <template v-else-if="merchantScreen === 'memberDetail' && selectedMember">
          <header class="mobile-header">
            <button class="icon-button" type="button" @click="backToMembers">‹</button>
            <h2>{{ selectedMember.name }} 的档案</h2>
          </header>
          <div class="mobile-content">
            <section class="panel-card member-profile">
              <div class="avatar large" :class="avatarToneClass(selectedMember.avatarUrl)">
                <img v-if="avatarImageSrc(selectedMember.avatarUrl)" :src="avatarImageSrc(selectedMember.avatarUrl)" alt="" />
                <span v-else>{{ avatarText(selectedMember.avatarUrl, selectedMember.name) }}</span>
              </div>
              <div>
                <h3>{{ selectedMember.name }}</h3>
                <p>{{ selectedMember.mobile }}</p>
              </div>
              <div class="info-grid">
                <div><span>性别</span><strong>{{ genderText(selectedMember.gender) }}</strong></div>
                <div><span>年龄</span><strong>{{ selectedMember.age }} 岁</strong></div>
              </div>
              <div class="balance-box">
                <span>总余额</span>
                <strong>{{ money(selectedMember.totalBalance) }}</strong>
                <div>
                  <span>充值余额 {{ money(selectedMember.rechargeBalance) }}</span>
                  <span>赠送余额 {{ money(selectedMember.giftBalance) }}</span>
                </div>
              </div>
            </section>
            <div class="summary-grid two">
              <div class="panel-card"><span>充值次数</span><strong>{{ selectedMember.rechargeCount }}</strong><small>总充值：{{ money(selectedMember.accumulatedRecharge) }}</small></div>
              <div class="panel-card"><span>消费次数</span><strong>{{ selectedMember.consumptionCount }}</strong><small>总消费：{{ money(selectedMember.accumulatedConsumption) }}</small></div>
            </div>
            <div class="segmented">
              <button :class="{ active: memberTxType === 'RECHARGE' }" type="button" @click="changeMemberTxType('RECHARGE')">充值记录</button>
              <button :class="{ active: memberTxType === 'CONSUMPTION' }" type="button" @click="changeMemberTxType('CONSUMPTION')">消费记录</button>
            </div>
            <article v-for="tx in memberTransactions" :key="tx.id" class="record-card">
              <div><strong>{{ tx.typeLabel || tx.itemName }}</strong><span>{{ tx.createdAt }}</span></div>
              <b>{{ tx.type === 'CONSUMPTION' ? '-' : '+' }}{{ money(tx.amount) }}</b>
              <small>操作后余额：{{ money(tx.afterTotalBalance) }}</small>
            </article>
            <p v-if="!memberTransactions.length" class="empty-state">暂无记录</p>
            <PaginationControls :page="memberTransactionPage" :page-sizes="PAGE_SIZE_OPTIONS" mobile-mode @change="changeMemberTransactionPage" />
          </div>
        </template>

        <template v-else>
          <section v-if="merchantTab === 'mine'" class="mobile-content">
            <header class="store-header">
              <div class="avatar large">
                <img v-if="dashboard.avatarUrl" :src="assetUrl(dashboard.avatarUrl)" alt="" />
                <span v-else>{{ initials(dashboard.shopName) }}</span>
              </div>
              <div>
                <h2>{{ dashboard.shopName || '欣悦生活馆' }}</h2>
                <p>账户：{{ dashboard.account || 'xinyue_store' }}</p>
                <small>更新于 {{ dashboard.updatedAt || '-' }}</small>
              </div>
            </header>
            <div class="summary-grid two">
              <div class="metric-card"><span>会员总数</span><strong>{{ dashboard.memberCount || 0 }}</strong></div>
              <div class="metric-card"><span>充值总金额</span><strong>{{ money(dashboard.totalRechargeAmount) }}</strong></div>
              <div class="metric-card"><span>待消费金额</span><strong>{{ money(dashboard.pendingConsumptionAmount) }}</strong></div>
              <div class="metric-card"><span>赠送总金额</span><strong>{{ money(dashboard.totalGiftAmount) }}</strong></div>
            </div>
            <section class="panel-card">
              <h3>今日数据</h3>
              <div class="data-row"><span>新增会员</span><strong>{{ dashboard.today?.newMembers || 0 }} 人</strong></div>
              <div class="data-row"><span>消费金额</span><strong>{{ money(dashboard.today?.consumptionAmount) }}</strong></div>
              <div class="data-row"><span>充值金额</span><strong>{{ money(dashboard.today?.rechargeAmount) }}</strong></div>
            </section>
            <section class="panel-card">
              <h3>本周数据</h3>
              <div class="data-row"><span>新增会员</span><strong>{{ dashboard.week?.newMembers || 0 }} 人</strong></div>
              <div class="data-row"><span>消费金额</span><strong>{{ money(dashboard.week?.consumptionAmount) }}</strong></div>
              <div class="data-row"><span>充值金额</span><strong>{{ money(dashboard.week?.rechargeAmount) }}</strong></div>
            </section>
            <div class="button-stack">
              <button class="ghost-button full" type="button" @click="openProfile">修改资料</button>
              <button class="ghost-button full" type="button" @click="logoutMerchant">退出登录</button>
            </div>
          </section>

          <section v-else-if="merchantTab === 'marketing'" class="mobile-content">
            <h1>营销管理</h1>
            <p class="muted">灵活设置充值优惠，驱动会员消费增长</p>
            <button class="action-card" type="button" @click="openTiers">
              <span class="action-icon">↗</span>
              <strong>设置充值梯度</strong>
              <small>配置充值优惠方案</small>
              <b>›</b>
            </button>
            <button class="action-card disabled" type="button" disabled>
              <span class="action-icon">○</span>
              <strong>接龙</strong>
              <small>功能开发中</small>
              <em>敬请期待</em>
            </button>
            <section class="notice-card">
              <strong>营销建议</strong>
              <p>合理设置充值梯度可以有效提升会员充值意愿，建议定期调整方案以适应市场变化。</p>
            </section>
          </section>

          <section v-else-if="merchantTab === 'members'" class="mobile-content">
            <header class="list-header">
              <h1>会员</h1>
              <button class="primary-button compact" type="button" @click="openMemberModal">＋ 添加</button>
            </header>
            <input v-model="memberKeyword" class="search-input" placeholder="搜索手机号或姓名..." @keyup.enter="searchMerchantMembers" />
            <article v-for="member in members" :key="member.id" class="member-row" @click="openMember(member)">
              <div class="avatar" :class="avatarToneClass(member.avatarUrl)">
                <img v-if="avatarImageSrc(member.avatarUrl)" :src="avatarImageSrc(member.avatarUrl)" alt="" />
                <span v-else>{{ avatarText(member.avatarUrl, member.name) }}</span>
              </div>
              <div>
                <strong>{{ member.name }} <small>{{ genderText(member.gender) }}</small></strong>
                <span>{{ member.mobile }} · {{ member.age }}岁</span>
              </div>
              <b>{{ money(member.totalBalance) }}<small>余额</small></b>
              <i>›</i>
            </article>
            <p v-if="!members.length" class="empty-state">暂无会员数据</p>
            <PaginationControls :page="merchantMemberPage" :page-sizes="PAGE_SIZE_OPTIONS" mobile-mode @change="changeMerchantMemberPage" />
          </section>

          <section v-else class="mobile-content cashier-view">
            <div class="segmented cashier-tabs">
              <button :class="{ active: cashierMode === 'RECHARGE' }" type="button" @click="setCashierMode('RECHARGE')">
                <svg class="cashier-tab-icon" aria-hidden="true" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                <span>充值</span>
              </button>
              <button :class="{ active: cashierMode === 'CONSUMPTION' }" type="button" @click="setCashierMode('CONSUMPTION')">
                <svg class="cashier-tab-icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M13.5 2.5 5.5 13H12l-1.5 8.5 8-11H12l1.5-8Z" />
                </svg>
                <span>扣款</span>
              </button>
            </div>
            <h2>{{ cashierMode === 'RECHARGE' ? '充值输入' : '扣款输入' }}</h2>
            <section class="cashier-panel" :class="{ blue: cashierMode === 'CONSUMPTION' }">
              <div class="cashier-form-grid">
                <input v-model="cashier.keyword" placeholder="输入完整手机号或后4位" />
                <button class="ghost-button" type="button" @click="lookupCashierMember">{{ selectedCashierMember ? selectedCashierMember.name : '会员姓名' }}</button>
                <input v-model="cashier.amount" placeholder="输入金额" inputmode="decimal" />
                <select v-model="cashier.paymentMethod">
                  <option value="CASH">现金</option>
                  <option value="WECHAT">微信</option>
                  <option value="ALIPAY">支付宝</option>
                  <option value="CARD">银行卡</option>
                  <option value="OTHER">其他</option>
                </select>
              </div>
              <input v-if="cashierMode === 'CONSUMPTION'" v-model="cashier.itemName" placeholder="项目名称" />
              <input v-model="cashier.remark" placeholder="备注" />
              <div class="keypad">
                <button v-for="key in keypad" :key="key" type="button" @click="pressAmountKey(key)">{{ key === 'back' ? '⌫' : key }}</button>
              </div>
              <button class="primary-button full" type="button" :disabled="!canSubmitCashier" @click="submitCashier">
                {{ cashierMode === 'RECHARGE' ? '确认充值' : '确认扣款' }}
              </button>
            </section>
            <h3 class="recent-title">最近{{ cashierMode === 'RECHARGE' ? '充值' : '扣款' }}</h3>
            <article v-for="tx in recentTransactions" :key="tx.id" class="recent-card" :class="{ blue: cashierMode === 'CONSUMPTION' }">
              <header class="recent-card-head">
                <span>流水号：{{ tx.serialNo }}</span>
                <strong class="recent-status">{{ cashierStatusText(tx) }}</strong>
              </header>
              <div class="recent-identity">
                <strong>手机号: {{ tx.mobile }}</strong>
                <strong>姓名: {{ tx.memberName }}</strong>
              </div>
              <footer class="recent-money-row">
                <span>{{ cashierMode === 'RECHARGE' ? '充值金额' : '扣款金额' }}: <strong class="recent-amount-value">{{ money(tx.amount) }}</strong></span>
                <span v-if="cashierMode === 'RECHARGE'">赠送金额: <strong class="recent-amount-value">{{ money(tx.giftAmount) }}</strong></span>
                <span>剩余余额: <strong>{{ money(tx.afterTotalBalance) }}</strong></span>
              </footer>
            </article>
            <p v-if="!recentTransactions.length" class="empty-state recent-empty">暂无最近{{ cashierMode === 'RECHARGE' ? '充值' : '扣款' }}记录</p>
          </section>

          <nav class="bottom-tabs">
            <button :class="{ active: merchantTab === 'marketing' }" type="button" @click="switchMerchantTab('marketing')">营销</button>
            <button :class="{ active: merchantTab === 'members' }" type="button" @click="switchMerchantTab('members')">会员</button>
            <button :class="{ active: merchantTab === 'cashier' }" type="button" @click="switchMerchantTab('cashier')">消费</button>
            <button :class="{ active: merchantTab === 'mine' }" type="button" @click="switchMerchantTab('mine')">我的</button>
          </nav>
        </template>
      </main>
    </section>

    <section v-else class="admin-shell" :class="{ 'member-detail-shell': adminSelectedMember }">
      <aside v-if="!adminSelectedMember" class="admin-sidebar">
        <span class="sidebar-title">业务控制台</span>
        <button :class="{ active: adminTab === 'overview' }" type="button" @click="switchAdminTab('overview')">▦ 首页总览</button>
        <button :class="{ active: adminTab === 'stores' }" type="button" @click="switchAdminTab('stores')">▣ 门店账号</button>
        <button :class="{ active: adminTab === 'members' }" type="button" @click="switchAdminTab('members')">♙ 会员管理</button>
        <button :class="{ active: adminTab === 'activity' }" type="button" @click="switchAdminTab('activity')">◷ 活跃度规划</button>
      </aside>
      <main class="admin-main">
        <header v-if="!adminSelectedMember" class="admin-topbar">
          <strong>{{ adminTitle }}</strong>
          <div>
            <span>Admin</span>
            <small>系统管理员</small>
            <button class="icon-button admin-logout-button" type="button" @click="logoutAdmin">退出</button>
          </div>
        </header>

        <section v-if="adminTab === 'overview'" class="admin-content">
          <h1>管理后台总览</h1>
          <p>实时查看所有门店的经营数据和会员统计信息</p>
          <div class="admin-metrics">
            <div class="panel-card"><span>门店总数</span><strong>{{ adminOverview.storeCount || 0 }}</strong></div>
            <div class="panel-card"><span>活跃门店</span><strong>{{ adminOverview.activeStoreCount || 0 }}</strong></div>
            <div class="panel-card"><span>充值总金额</span><strong>{{ money(adminOverview.totalRechargeAmount) }}</strong></div>
            <div class="panel-card"><span>待消费总额</span><strong>{{ money(adminOverview.pendingConsumptionAmount) }}</strong></div>
          </div>
          <section class="admin-panel">
            <h2>门店基础信息</h2>
            <table>
              <thead><tr><th>门店名称</th><th>地址</th><th>账户状态</th><th>充值总金额</th><th>待消费总额</th></tr></thead>
              <tbody>
                <tr v-for="store in visibleAdminOverviewStores" :key="store.id">
                  <td>{{ store.shopName }}</td>
                  <td>{{ store.address }}</td>
                  <td><span class="pill">{{ store.status === 'ACTIVE' ? '正常' : '停用' }}</span></td>
                  <td>{{ money(store.totalRechargeAmount) }}</td>
                  <td>{{ money(store.pendingConsumptionAmount) }}</td>
                </tr>
                <tr v-if="!visibleAdminOverviewStores.length">
                  <td class="empty-table" colspan="5">暂无门店数据</td>
                </tr>
              </tbody>
            </table>
            <PaginationControls :page="adminOverviewStorePageInfo.page" :page-sizes="PAGE_SIZE_OPTIONS" @change="changeAdminOverviewStorePage" />
          </section>
        </section>

        <section v-else-if="adminTab === 'stores'" class="admin-content">
          <div class="section-title">
            <div><h1>门店账号管理</h1><p>新增、编辑、启停和重置商家登录账号</p></div>
            <button class="admin-primary" type="button" @click="openStoreForm()">新增门店</button>
          </div>
          <div class="admin-filter">
            <input v-model="storeFilter.keyword" placeholder="门店名称 / 账号 / 手机号" @keyup.enter="searchAdminStores" />
            <select v-model="storeFilter.status">
              <option value="">全部状态</option>
              <option value="ACTIVE">正常</option>
              <option value="DISABLED">停用</option>
            </select>
            <button class="ghost-button" type="button" @click="searchAdminStores">筛选</button>
          </div>
          <section class="admin-panel">
            <table>
              <thead><tr><th>门店</th><th>账号</th><th>手机号</th><th>地址</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="store in adminStores" :key="store.id">
                  <td>{{ store.shopName }}</td>
                  <td>{{ store.account }}</td>
                  <td>{{ store.contactMobile }}</td>
                  <td>{{ store.address }}</td>
                  <td><span class="pill">{{ store.status === 'ACTIVE' ? '正常' : '停用' }}</span></td>
                  <td class="table-actions">
                    <button type="button" @click="openStoreForm(store)">编辑</button>
                    <button type="button" @click="toggleStoreStatus(store)">{{ store.status === 'ACTIVE' ? '停用' : '启用' }}</button>
                    <button type="button" @click="resetStorePassword(store)">重置密码</button>
                  </td>
                </tr>
                <tr v-if="!adminStores.length">
                  <td class="empty-table" colspan="6">暂无门店数据</td>
                </tr>
              </tbody>
            </table>
            <PaginationControls :page="adminStorePage" :page-sizes="PAGE_SIZE_OPTIONS" @change="changeAdminStorePage" />
          </section>
        </section>

        <section v-else-if="adminTab === 'members'" :class="adminSelectedMember ? 'member-detail-content' : 'admin-content'">
          <div v-if="!adminSelectedMember" class="section-title">
            <div><h1>会员管理中心</h1><p>查看和管理所有门店会员信息</p></div>
            <button class="admin-primary" type="button" @click="exportMembers">导出数据</button>
          </div>
          <div v-if="!adminSelectedMember" class="admin-filter">
            <input v-model="adminMemberFilter.mobile" placeholder="输入会员手机号" />
            <input v-model="adminMemberFilter.name" placeholder="输入会员姓名" />
            <select v-model="adminMemberFilter.storeId">
              <option value="">全部门店</option>
              <option v-for="store in adminStoreOptions" :key="store.id" :value="store.id">{{ store.shopName }}</option>
            </select>
            <input v-model="adminMemberFilter.rechargeMin" placeholder="充值最小" />
            <input v-model="adminMemberFilter.rechargeMax" placeholder="充值最大" />
            <button class="ghost-button" type="button" @click="searchAdminMembers">筛选</button>
          </div>
          <section v-if="!adminSelectedMember" class="admin-panel">
            <table>
              <thead><tr><th>手机号</th><th>姓名</th><th>所属门店</th><th>加入时间</th><th>待消费金额</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="member in adminMembers" :key="member.id">
                  <td>{{ member.mobile }}</td>
                  <td>{{ member.name }}</td>
                  <td>{{ member.storeName }}</td>
                  <td>{{ member.joinedAt }}</td>
                  <td><span class="amount-pill">{{ money(member.totalBalance) }}</span></td>
                  <td><button type="button" @click="openAdminMember(member)">查看</button></td>
                </tr>
                <tr v-if="!adminMembers.length">
                  <td class="empty-table" colspan="6">暂无会员数据</td>
                </tr>
              </tbody>
            </table>
            <PaginationControls :page="adminMemberPage" :page-sizes="PAGE_SIZE_OPTIONS" @change="changeAdminMemberPage" />
          </section>
          <section v-else class="member-detail-page">
            <header class="member-detail-header">
              <button class="detail-back-button" type="button" aria-label="返回会员列表" @click="closeAdminMemberDetail">‹</button>
              <div>
                <h1>会员详情资料</h1>
                <p>查看会员的完整档案、充值记录和消费明细</p>
              </div>
            </header>

            <section class="member-profile-card">
              <div class="member-profile-card-head">
                <h2>会员档案</h2>
                <span class="status-badge" :class="{ inactive: adminSelectedMember.status !== 'ACTIVE' }">{{ memberStatusText(adminSelectedMember.status) }}</span>
              </div>
              <div class="member-profile-body">
                <div class="member-detail-avatar" :class="avatarToneClass(adminSelectedMember.avatarUrl)">
                  <img v-if="avatarImageSrc(adminSelectedMember.avatarUrl)" :src="avatarImageSrc(adminSelectedMember.avatarUrl)" alt="" />
                  <span v-else>{{ avatarText(adminSelectedMember.avatarUrl, adminSelectedMember.name) }}</span>
                </div>
                <div class="member-detail-fields">
                  <div class="member-name-line">
                    <strong>{{ adminSelectedMember.name }}</strong>
                    <span>{{ genderText(adminSelectedMember.gender) }}</span>
                  </div>
                  <dl>
                    <div><dt>电话</dt><dd>{{ adminSelectedMember.mobile }}</dd></div>
                    <div><dt>门店</dt><dd>{{ adminSelectedMember.storeName }}</dd></div>
                    <div><dt>加入时间</dt><dd>{{ detailDateTime(adminSelectedMember.joinedAt) }}</dd></div>
                  </dl>
                </div>
              </div>
              <div class="member-balance-section">
                <h3>账户余额</h3>
                <div class="member-balance-grid">
                  <div class="member-balance-card highlight"><span>待消费余额</span><strong>{{ money(adminSelectedMember.totalBalance) }}</strong></div>
                  <div class="member-balance-card"><span>累计充值</span><strong>{{ money(adminSelectedMember.accumulatedRecharge) }}</strong></div>
                  <div class="member-balance-card"><span>累计消费</span><strong>{{ money(adminSelectedMember.accumulatedConsumption) }}</strong></div>
                </div>
              </div>
            </section>

            <div class="member-record-grid">
              <section class="member-record-card recharge-records">
                <div class="member-record-head">
                  <h2><span>＋</span>充值记录</h2>
                  <span class="record-count-pill">{{ adminRechargePage.total }} 条</span>
                </div>
                <table class="member-record-table">
                  <thead><tr><th>充值时间</th><th>金额</th><th>渠道</th><th>订单号</th></tr></thead>
                  <tbody>
                    <tr v-for="tx in adminRechargeTransactions" :key="tx.id">
                      <td>{{ shortDateTime(tx.createdAt) }}</td>
                      <td><strong>+{{ money(tx.amount) }}</strong></td>
                      <td><span class="channel-pill" :class="paymentMethodClass(tx.paymentMethod)">{{ paymentMethodText(tx.paymentMethod) }}</span></td>
                      <td>{{ tx.orderNo || tx.serialNo }}</td>
                    </tr>
                    <tr v-if="!adminRechargeTransactions.length"><td class="empty-table" colspan="4">暂无充值记录</td></tr>
                  </tbody>
                </table>
                <PaginationControls class="member-record-pager" :page="adminRechargePage" :page-sizes="PAGE_SIZE_OPTIONS" @change="changeAdminRechargePage" />
              </section>

              <section class="member-record-card consumption-records">
                <div class="member-record-head">
                  <h2><span>－</span>消费记录</h2>
                  <span class="record-count-pill">{{ adminConsumptionPage.total }} 条</span>
                </div>
                <table class="member-record-table">
                  <thead><tr><th>消费时间</th><th>金额</th><th>项目名称</th><th>订单号</th></tr></thead>
                  <tbody>
                    <tr v-for="tx in adminConsumptionTransactions" :key="tx.id">
                      <td>{{ shortDateTime(tx.createdAt) }}</td>
                      <td><strong>-{{ money(tx.amount) }}</strong></td>
                      <td>{{ tx.itemName || tx.typeLabel }}</td>
                      <td>{{ tx.orderNo || tx.serialNo }}</td>
                    </tr>
                    <tr v-if="!adminConsumptionTransactions.length"><td class="empty-table" colspan="4">暂无消费记录</td></tr>
                  </tbody>
                </table>
                <PaginationControls class="member-record-pager" :page="adminConsumptionPage" :page-sizes="PAGE_SIZE_OPTIONS" @change="changeAdminConsumptionPage" />
              </section>
            </div>
          </section>
        </section>

        <section v-else class="admin-content">
          <h1>商家活跃度分析</h1>
          <p>三期规划入口，当前展示种子数据和筛选形态。</p>
          <div class="admin-filter">
            <select><option>全部门店</option></select>
            <select><option>全部状态</option></select>
            <button class="ghost-button" type="button">重置筛选</button>
          </div>
          <section class="admin-panel">
            <table>
              <thead><tr><th>门店名称</th><th>门店地址</th><th>日均使用时长</th><th>日均打开次数</th><th>活跃度</th><th>数据日期</th></tr></thead>
              <tbody>
                <tr v-for="row in visibleActivityRows" :key="row.storeName">
                  <td>{{ row.storeName }}</td>
                  <td>{{ row.address }}</td>
                  <td>{{ row.avgUsageMinutes }}</td>
                  <td>{{ row.openCount }}</td>
                  <td>{{ row.activityStatus === 'LOW_ACTIVE' ? '低活跃' : '活跃' }}</td>
                  <td>{{ row.statDate }}</td>
                </tr>
                <tr v-if="!visibleActivityRows.length">
                  <td class="empty-table" colspan="6">暂无活跃度数据</td>
                </tr>
              </tbody>
            </table>
            <PaginationControls :page="activityPageInfo.page" :page-sizes="PAGE_SIZE_OPTIONS" @change="changeActivityPage" />
          </section>
        </section>
      </main>
    </section>

    <div v-if="memberModalVisible" class="modal-mask">
      <form class="modal-card" @submit.prevent="createMerchantMember">
        <button class="modal-close" type="button" @click="closeMemberModal">×</button>
        <h2>添加新会员</h2>
        <section class="avatar-picker" aria-label="选择会员头像">
          <div class="avatar-picker-head">
            <span>头像</span>
            <small>人物 / 猫狗 / 炫酷</small>
          </div>
          <div class="avatar-option-grid">
            <button
              v-for="avatar in BUILTIN_AVATARS"
              :key="avatar.value"
              class="avatar-option"
              :class="{ active: memberForm.avatarUrl === avatar.value }"
              type="button"
              :aria-label="`选择${avatar.label}`"
              :aria-pressed="memberForm.avatarUrl === avatar.value"
              @click="memberForm.avatarUrl = avatar.value"
            >
              <span class="avatar-option-visual" :class="avatar.tone">{{ avatar.glyph }}</span>
              <span>{{ avatar.label }}</span>
            </button>
          </div>
        </section>
        <label><span>手机号 *</span><input v-model="memberForm.mobile" placeholder="请输入手机号" /></label>
        <label><span>姓名 *</span><input v-model="memberForm.name" placeholder="请输入姓名" /></label>
        <label><span>性别 *</span><select v-model="memberForm.gender"><option value="MALE">男</option><option value="FEMALE">女</option></select></label>
        <label><span>年龄 *</span><input v-model="memberForm.age" inputmode="numeric" placeholder="请输入年龄" /></label>
        <button class="primary-button full" type="submit">确认添加</button>
        <button class="ghost-button full" type="button" @click="closeMemberModal">取消</button>
      </form>
    </div>

    <div v-if="candidateModalVisible" class="modal-mask">
      <div class="modal-card">
        <h2>选择会员</h2>
        <p class="muted">后 4 位命中多个会员，必须选择后才能提交。</p>
        <button v-for="candidate in candidateMembers" :key="candidate.id" class="candidate-row" type="button" @click="chooseCandidate(candidate)">
          <strong>{{ candidate.name }}</strong><span>{{ candidate.mobile }}</span><b>{{ money(candidate.totalBalance) }}</b>
        </button>
        <button class="ghost-button full" type="button" @click="candidateModalVisible = false">取消</button>
      </div>
    </div>

    <div v-if="merchantResetVisible" class="modal-mask">
      <div class="modal-card">
        <h2>重置登录密码</h2>
        <p class="muted">开发环境验证码固定为 123456。</p>
        <label><span>绑定手机号</span><input v-model="resetForm.mobile" placeholder="请输入手机号" /></label>
        <label><span>验证码</span><input v-model="resetForm.code" placeholder="请输入6位验证码" /></label>
        <label><span>新密码</span><input v-model="resetForm.password" type="password" placeholder="至少6个字符" /></label>
        <button class="primary-button full" type="button" @click="resetMerchantPassword">确认重置</button>
        <button class="ghost-button full" type="button" @click="merchantResetVisible = false">返回登录</button>
      </div>
    </div>

    <div v-if="storeModalVisible" class="modal-mask">
      <form class="modal-card admin-modal" @submit.prevent="saveStoreForm">
        <button class="modal-close" type="button" @click="storeModalVisible = false">×</button>
        <h2>{{ storeForm.id ? '编辑门店' : '新增门店' }}</h2>
        <label><span>商家账号</span><input v-model="storeForm.account" :disabled="Boolean(storeForm.id)" placeholder="请输入商家账号" /></label>
        <label><span>店铺名称</span><input v-model="storeForm.shopName" placeholder="请输入店铺名称" /></label>
        <label><span>联系电话</span><input v-model="storeForm.contactMobile" placeholder="请输入联系电话" /></label>
        <label><span>地址</span><input v-model="storeForm.address" placeholder="请输入地址" /></label>
        <label v-if="!storeForm.id"><span>初始密码</span><input v-model="storeForm.initialPassword" placeholder="默认 123456" /></label>
        <button class="admin-primary full" type="submit">保存</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { http, type ApiResponse } from './api/http'
import PaginationControls from './components/PaginationControls.vue'

type AnyMap = Record<string, any>
type AppMode = 'merchant' | 'admin'
type MerchantTab = 'marketing' | 'members' | 'cashier' | 'mine'
type MerchantScreen = 'tabs' | 'profile' | 'tiers' | 'memberDetail'
type CashierMode = 'RECHARGE' | 'CONSUMPTION'
type AdminTab = 'overview' | 'stores' | 'members' | 'activity'
type PageChange = { pageNo: number; pageSize: number }
type PageState = { pageNo: number; pageSize: number }
type ApiPageState = PageState & { total: number; pages: number }
type BuiltinAvatar = { value: string; label: string; glyph: string; tone: string }

const PAGE_SIZE_OPTIONS = [5, 10, 20]
const MOBILE_PAGE_SIZE = 10
const MOBILE_PAGE_QUERY = '(max-width: 900px)'
const BUILTIN_AVATARS: BuiltinAvatar[] = [
  { value: 'builtin:person-sun', label: '阳光帅哥', glyph: '😎', tone: 'avatar-tone-sun' },
  { value: 'builtin:person-city', label: '都市帅哥', glyph: '🧑', tone: 'avatar-tone-city' },
  { value: 'builtin:person-sweet', label: '甜美女生', glyph: '👩', tone: 'avatar-tone-sweet' },
  { value: 'builtin:person-cool', label: '酷飒女生', glyph: '🕶', tone: 'avatar-tone-cool' },
  { value: 'builtin:pet-cat', label: '灵动猫咪', glyph: '🐱', tone: 'avatar-tone-cat' },
  { value: 'builtin:pet-dog', label: '元气小狗', glyph: '🐶', tone: 'avatar-tone-dog' },
  { value: 'builtin:cool-neon', label: '霓虹星芒', glyph: '✦', tone: 'avatar-tone-neon' },
  { value: 'builtin:cool-flash', label: '闪电机能', glyph: '⚡', tone: 'avatar-tone-flash' }
]
const DEFAULT_MEMBER_AVATAR = BUILTIN_AVATARS[0].value

const appMode = ref<AppMode>(window.location.pathname.startsWith('/admin') ? 'admin' : 'merchant')
const busy = ref(false)
const toast = ref('')
let toastTimer = 0

const merchantAuthed = ref(false)
const adminAuthed = ref(false)
const merchantTab = ref<MerchantTab>('mine')
const merchantScreen = ref<MerchantScreen>('tabs')
const adminTab = ref<AdminTab>('overview')

const merchantLogin = reactive({ account: 'xinyue_store', password: '123456' })
const adminLogin = reactive({ username: 'superadmin', password: 'Member@123' })
const dashboard = ref<AnyMap>({})
const currentStore = ref<AnyMap>({})
const tiers = ref<AnyMap[]>([])
const campaigns = ref<AnyMap[]>([])
const members = ref<AnyMap[]>([])
const merchantMemberPage = createApiPageState(MOBILE_PAGE_SIZE)
const memberKeyword = ref('')
const selectedMember = ref<AnyMap | null>(null)
const memberTransactions = ref<AnyMap[]>([])
const memberTransactionPage = createApiPageState(MOBILE_PAGE_SIZE)
const memberTxType = ref('RECHARGE')

const profileFileInput = ref<HTMLInputElement | null>(null)
const profileForm = reactive({ shopName: '', avatarUrl: '', newPassword: '', confirmPassword: '' })
const editingTier = ref(0)
const tierDraft = reactive({ rechargeAmount: '', giftAmount: '' })
const memberModalVisible = ref(false)
const memberForm = reactive({ mobile: '', name: '', gender: 'MALE', age: '', avatarUrl: DEFAULT_MEMBER_AVATAR })
const merchantResetVisible = ref(false)
const resetForm = reactive({ mobile: '', code: '', password: '' })

const cashierMode = ref<CashierMode>('RECHARGE')
const cashier = reactive({ keyword: '', amount: '', paymentMethod: 'CASH', itemName: '', remark: '' })
const selectedCashierMember = ref<AnyMap | null>(null)
const candidateMembers = ref<AnyMap[]>([])
const candidateModalVisible = ref(false)
const recentTransactions = ref<AnyMap[]>([])
const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back']

const adminOverview = ref<AnyMap>({})
const adminOverviewStorePage = createPageState()
const adminStores = ref<AnyMap[]>([])
const adminStorePage = createApiPageState()
const adminMembers = ref<AnyMap[]>([])
const adminMemberPage = createApiPageState()
const adminSelectedMember = ref<AnyMap | null>(null)
const adminRechargeTransactions = ref<AnyMap[]>([])
const adminConsumptionTransactions = ref<AnyMap[]>([])
const adminRechargePage = createApiPageState()
const adminConsumptionPage = createApiPageState()
const activityRows = ref<AnyMap[]>([])
const activityPage = createPageState()
const storeModalVisible = ref(false)
const storeFilter = reactive({ keyword: '', status: '' })
const storeForm = reactive({ id: 0, account: '', shopName: '', contactMobile: '', address: '', initialPassword: '' })
const adminMemberFilter = reactive({
  mobile: '',
  name: '',
  storeId: '',
  rechargeMin: '',
  rechargeMax: ''
})
const correctionForm = reactive({ correctionType: 'ADD_RECHARGE', amount: '', reason: '' })

const canSubmitCashier = computed(() => Boolean(selectedCashierMember.value?.id && Number(cashier.amount) > 0))
const adminTitle = computed(() => {
  if (adminTab.value === 'stores') return '门店账号管理'
  if (adminTab.value === 'members') return '会员管理'
  if (adminTab.value === 'activity') return '商家活跃度分析'
  return '旗舰店总览'
})
const adminStoreOptions = computed(() => {
  const stores = rows(adminOverview.value.stores)
  return stores.length ? stores : adminStores.value
})
const adminOverviewStorePageInfo = computed(() => paginateLocal(rows(adminOverview.value.stores), adminOverviewStorePage))
const visibleAdminOverviewStores = computed(() => adminOverviewStorePageInfo.value.records)
const activityPageInfo = computed(() => paginateLocal(activityRows.value, activityPage))
const visibleActivityRows = computed(() => activityPageInfo.value.records)

function defaultPageSize() {
  if (typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(MOBILE_PAGE_QUERY).matches) {
    return MOBILE_PAGE_SIZE
  }
  return PAGE_SIZE_OPTIONS[0]
}

function createPageState(pageSize = defaultPageSize()): PageState {
  return reactive({ pageNo: 1, pageSize })
}

function createApiPageState(pageSize = defaultPageSize()): ApiPageState {
  return reactive({ pageNo: 1, pageSize, total: 0, pages: 1 })
}

function normalizedPage(state: PageState, total: number) {
  const pageSize = Math.max(1, Number(state.pageSize) || defaultPageSize())
  const safeTotal = Math.max(0, Number(total) || 0)
  const pages = Math.max(1, Math.ceil(safeTotal / pageSize))
  const pageNo = Math.min(Math.max(1, Number(state.pageNo) || 1), pages)
  return { pageNo, pageSize, total: safeTotal, pages }
}

function paginateLocal<T>(records: T[], state: PageState) {
  const page = normalizedPage(state, records.length)
  const start = (page.pageNo - 1) * page.pageSize
  return {
    page,
    records: records.slice(start, start + page.pageSize)
  }
}

function applyApiPage(state: ApiPageState, page: AnyMap) {
  const pageSize = Math.max(1, Number(page.pageSize) || state.pageSize)
  const total = Math.max(0, Number(page.total) || 0)
  const pages = Math.max(1, Number(page.pages) || Math.ceil(total / pageSize) || 1)
  state.pageNo = Math.min(Math.max(1, Number(page.pageNo) || state.pageNo), pages)
  state.pageSize = pageSize
  state.total = total
  state.pages = pages
}

function updatePageState(state: PageState, change: PageChange) {
  state.pageNo = change.pageNo
  state.pageSize = change.pageSize
}

function rows(value: unknown): AnyMap[] {
  return Array.isArray(value) ? value as AnyMap[] : []
}

onMounted(async () => {
  if (appMode.value === 'admin') {
    await tryRestoreAdmin()
  } else {
    await tryRestoreMerchant()
  }
})

async function apiGet<T>(url: string, params?: AnyMap) {
  const response = await http.get<ApiResponse<T>>(url, { params })
  return response.data.data
}

async function apiPost<T>(url: string, body?: AnyMap) {
  const response = await http.post<ApiResponse<T>>(url, body || {})
  return response.data.data
}

async function apiPut<T>(url: string, body?: AnyMap) {
  const response = await http.put<ApiResponse<T>>(url, body || {})
  return response.data.data
}

async function apiPatch<T>(url: string, body?: AnyMap) {
  const response = await http.patch<ApiResponse<T>>(url, body || {})
  return response.data.data
}

async function apiDelete<T>(url: string) {
  const response = await http.delete<ApiResponse<T>>(url)
  return response.data.data
}

async function guarded(action: () => Promise<void>, successMessage?: string) {
  busy.value = true
  try {
    await action()
    if (successMessage) notify(successMessage)
  } catch (error) {
    notify(error instanceof Error ? error.message : '操作失败')
  } finally {
    busy.value = false
  }
}

function notify(message: string) {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = ''
  }, 2600)
}

function switchMode(mode: AppMode) {
  appMode.value = mode
  history.replaceState(null, '', mode === 'admin' ? '/admin' : '/')
}

async function tryRestoreMerchant() {
  try {
    currentStore.value = await apiGet<AnyMap>('/auth/merchant/me')
    merchantAuthed.value = true
    await loadMerchantBase()
  } catch {
    merchantAuthed.value = false
  }
}

async function tryRestoreAdmin() {
  try {
    await apiGet<AnyMap>('/auth/admin/me')
    adminAuthed.value = true
    await loadAdminBase()
  } catch {
    adminAuthed.value = false
  }
}

async function loginMerchant() {
  await guarded(async () => {
    const payload = await apiPost<AnyMap>('/auth/merchant/login', merchantLogin)
    currentStore.value = payload.user
    merchantAuthed.value = true
    await loadMerchantBase()
  }, '登录成功')
}

async function loginAdmin() {
  await guarded(async () => {
    await apiPost<AnyMap>('/auth/admin/login', adminLogin)
    adminAuthed.value = true
    await loadAdminBase()
  }, '登录成功')
}

async function logoutMerchant() {
  await guarded(async () => {
    await apiPost<void>('/auth/merchant/logout')
    merchantAuthed.value = false
    merchantScreen.value = 'tabs'
  }, '已退出')
}

async function logoutAdmin() {
  await guarded(async () => {
    await apiPost<void>('/auth/admin/logout')
    adminAuthed.value = false
  }, '已退出')
}

async function resetMerchantPassword() {
  await guarded(async () => {
    await apiPost('/auth/password/reset', {
      mobile: resetForm.mobile,
      code: resetForm.code,
      newPassword: resetForm.password
    })
    merchantResetVisible.value = false
  }, '密码已重置')
}

async function loadMerchantBase() {
  await Promise.all([loadDashboard(), loadTiers(), loadMerchantMembers(), loadRecentTransactions()])
}

async function loadDashboard() {
  dashboard.value = await apiGet<AnyMap>('/merchant/dashboard')
}

async function loadTiers() {
  tiers.value = await apiGet<AnyMap[]>('/merchant/recharge-tiers')
  campaigns.value = await apiGet<AnyMap[]>('/merchant/campaigns')
}

async function loadMerchantMembers() {
  const page = await apiGet<AnyMap>('/merchant/members', {
    keyword: memberKeyword.value,
    pageNo: merchantMemberPage.pageNo,
    pageSize: merchantMemberPage.pageSize
  })
  members.value = page.records || []
  applyApiPage(merchantMemberPage, page)
}

async function loadRecentTransactions() {
  recentTransactions.value = await apiGet<AnyMap[]>('/merchant/transactions/recent', {
    type: cashierMode.value === 'RECHARGE' ? 'RECHARGE' : 'CONSUMPTION',
    limit: 3
  })
}

function switchMerchantTab(tab: MerchantTab) {
  merchantScreen.value = 'tabs'
  merchantTab.value = tab
  if (tab === 'mine') void guarded(loadDashboard)
  if (tab === 'members') void guarded(loadMerchantMembers)
  if (tab === 'cashier') void guarded(loadRecentTransactions)
}

function openProfile() {
  profileForm.shopName = currentStore.value.shopName || dashboard.value.shopName || ''
  profileForm.avatarUrl = currentStore.value.avatarUrl || dashboard.value.avatarUrl || ''
  profileForm.newPassword = ''
  profileForm.confirmPassword = ''
  merchantScreen.value = 'profile'
}

async function uploadProfileAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await guarded(async () => {
    const form = new FormData()
    form.append('file', file)
    const response = await http.post<ApiResponse<AnyMap>>('/files/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    profileForm.avatarUrl = response.data.data.url
  }, '头像已上传')
  input.value = ''
}

async function saveMerchantProfile() {
  await guarded(async () => {
    currentStore.value = await apiPut<AnyMap>('/merchant/profile', {
      shopName: profileForm.shopName,
      avatarUrl: profileForm.avatarUrl
    })
    if (profileForm.newPassword) {
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        throw new Error('两次输入的密码不一致')
      }
      await apiPut('/merchant/password', { newPassword: profileForm.newPassword })
    }
    await loadDashboard()
    merchantScreen.value = 'tabs'
  }, '资料已保存')
}

function openTiers() {
  merchantScreen.value = 'tiers'
  void guarded(loadTiers)
}

function editTier(tier: AnyMap) {
  editingTier.value = Number(tier.tierNo)
  tierDraft.rechargeAmount = String(tier.rechargeAmount)
  tierDraft.giftAmount = String(tier.giftAmount)
}

async function saveTier(tierNo: number) {
  await guarded(async () => {
    await apiPut(`/merchant/recharge-tiers/${tierNo}`, {
      rechargeAmount: tierDraft.rechargeAmount,
      giftAmount: tierDraft.giftAmount
    })
    editingTier.value = 0
    await loadTiers()
  }, '充值梯度已生效')
}

function resetMemberForm() {
  Object.assign(memberForm, {
    mobile: '',
    name: '',
    gender: 'MALE',
    age: '',
    avatarUrl: DEFAULT_MEMBER_AVATAR
  })
}

function openMemberModal() {
  resetMemberForm()
  memberModalVisible.value = true
}

function closeMemberModal() {
  memberModalVisible.value = false
}

async function createMerchantMember() {
  await guarded(async () => {
    await apiPost('/merchant/members', {
      mobile: memberForm.mobile,
      name: memberForm.name,
      gender: memberForm.gender,
      age: Number(memberForm.age),
      avatarUrl: memberForm.avatarUrl
    })
    closeMemberModal()
    resetMemberForm()
    merchantMemberPage.pageNo = 1
    await loadMerchantMembers()
  }, '会员已添加')
}

async function openMember(member: AnyMap) {
  await guarded(async () => {
    selectedMember.value = await apiGet<AnyMap>(`/merchant/members/${member.id}`)
    memberTransactionPage.pageNo = 1
    await loadMemberTransactions()
    merchantScreen.value = 'memberDetail'
  })
}

async function loadMemberTransactions() {
  if (!selectedMember.value) return
  const page = await apiGet<AnyMap>(`/merchant/members/${selectedMember.value.id}/transactions`, {
    type: memberTxType.value,
    pageNo: memberTransactionPage.pageNo,
    pageSize: memberTransactionPage.pageSize
  })
  memberTransactions.value = (page.records || []).map(labelTransaction)
  applyApiPage(memberTransactionPage, page)
}

function changeMemberTxType(type: string) {
  memberTxType.value = type
  memberTransactionPage.pageNo = 1
  void guarded(loadMemberTransactions)
}

function searchMerchantMembers() {
  merchantMemberPage.pageNo = 1
  void guarded(loadMerchantMembers)
}

function changeMerchantMemberPage(change: PageChange) {
  updatePageState(merchantMemberPage, change)
  void guarded(loadMerchantMembers)
}

function changeMemberTransactionPage(change: PageChange) {
  updatePageState(memberTransactionPage, change)
  void guarded(loadMemberTransactions)
}

function backToMembers() {
  selectedMember.value = null
  merchantScreen.value = 'tabs'
  merchantTab.value = 'members'
}

function setCashierMode(mode: CashierMode) {
  cashierMode.value = mode
  selectedCashierMember.value = null
  cashier.amount = ''
  cashier.itemName = ''
  void guarded(loadRecentTransactions)
}

async function lookupCashierMember() {
  await guarded(async () => {
    const result = await apiGet<AnyMap>('/merchant/members/lookup', { keyword: cashier.keyword.trim() })
    if (result.matchType === 'NONE') {
      selectedCashierMember.value = null
      throw new Error('未找到会员')
    }
    if (result.matchType === 'SUFFIX_MULTIPLE') {
      candidateMembers.value = result.candidates || []
      candidateModalVisible.value = true
      selectedCashierMember.value = null
      return
    }
    selectedCashierMember.value = result.member
    cashier.keyword = result.member.mobile
  }, selectedCashierMember.value ? '会员已匹配' : undefined)
}

function chooseCandidate(candidate: AnyMap) {
  selectedCashierMember.value = candidate
  cashier.keyword = candidate.mobile
  candidateModalVisible.value = false
}

function pressAmountKey(key: string) {
  if (key === 'back') {
    cashier.amount = cashier.amount.slice(0, -1)
    return
  }
  if (key === '.' && cashier.amount.includes('.')) return
  if (cashier.amount.includes('.') && cashier.amount.split('.')[1]?.length >= 2) return
  cashier.amount = `${cashier.amount}${key}`
}

async function submitCashier() {
  if (!selectedCashierMember.value) return
  await guarded(async () => {
    const body = {
      memberId: selectedCashierMember.value?.id,
      amount: cashier.amount,
      paymentMethod: cashier.paymentMethod,
      itemName: cashierMode.value === 'RECHARGE' ? '会员充值' : cashier.itemName || '消费扣款',
      remark: cashier.remark,
      idempotencyKey: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
    }
    await apiPost(cashierMode.value === 'RECHARGE' ? '/merchant/transactions/recharge' : '/merchant/transactions/consume', body)
    cashier.amount = ''
    cashier.remark = ''
    await Promise.all([loadRecentTransactions(), loadDashboard(), loadMerchantMembers()])
  }, cashierMode.value === 'RECHARGE' ? '充值成功' : '扣款成功')
}

async function reverseTransaction(tx: AnyMap) {
  await guarded(async () => {
    await apiPost(`/merchant/transactions/${tx.id}/reverse`)
    await Promise.all([loadRecentTransactions(), loadDashboard(), loadMerchantMembers()])
  }, '流水已撤销')
}

async function refundTransaction(tx: AnyMap) {
  await guarded(async () => {
    await apiPost(`/merchant/transactions/${tx.id}/refund`, { amount: tx.amount })
    await Promise.all([loadRecentTransactions(), loadDashboard(), loadMerchantMembers()])
  }, '退款成功')
}

function cashierStatusText(tx: AnyMap) {
  if (tx.status === 'REVERSED') {
    return cashierMode.value === 'RECHARGE' ? '充值已撤销' : '扣款已退款'
  }
  return cashierMode.value === 'RECHARGE' ? '充值成功' : '扣款成功'
}

async function loadAdminBase() {
  await Promise.all([loadAdminOverview(), loadAdminStores(), loadAdminMembers(), loadActivityRows()])
}

async function loadAdminOverview() {
  adminOverview.value = await apiGet<AnyMap>('/admin/overview')
}

async function loadAdminStores() {
  const page = await apiGet<AnyMap>('/admin/stores', {
    keyword: storeFilter.keyword,
    status: storeFilter.status,
    pageNo: adminStorePage.pageNo,
    pageSize: adminStorePage.pageSize
  })
  adminStores.value = page.records || []
  applyApiPage(adminStorePage, page)
}

async function loadAdminMembers() {
  const params: AnyMap = {
    mobile: adminMemberFilter.mobile,
    name: adminMemberFilter.name,
    pageNo: adminMemberPage.pageNo,
    pageSize: adminMemberPage.pageSize
  }
  if (adminMemberFilter.storeId) params.storeId = adminMemberFilter.storeId
  if (adminMemberFilter.rechargeMin) params.rechargeMin = adminMemberFilter.rechargeMin
  if (adminMemberFilter.rechargeMax) params.rechargeMax = adminMemberFilter.rechargeMax
  const page = await apiGet<AnyMap>('/admin/members', params)
  adminMembers.value = page.records || []
  applyApiPage(adminMemberPage, page)
}

async function loadActivityRows() {
  activityRows.value = await apiGet<AnyMap[]>('/admin/activity')
}

function searchAdminStores() {
  adminStorePage.pageNo = 1
  void guarded(loadAdminStores)
}

function changeAdminStorePage(change: PageChange) {
  updatePageState(adminStorePage, change)
  void guarded(loadAdminStores)
}

function searchAdminMembers() {
  adminMemberPage.pageNo = 1
  void guarded(loadAdminMembers)
}

function changeAdminMemberPage(change: PageChange) {
  updatePageState(adminMemberPage, change)
  void guarded(loadAdminMembers)
}

function changeAdminOverviewStorePage(change: PageChange) {
  updatePageState(adminOverviewStorePage, change)
}

function changeAdminRechargePage(change: PageChange) {
  updatePageState(adminRechargePage, change)
  void guarded(loadAdminRechargeTransactions)
}

function changeAdminConsumptionPage(change: PageChange) {
  updatePageState(adminConsumptionPage, change)
  void guarded(loadAdminConsumptionTransactions)
}

function changeActivityPage(change: PageChange) {
  updatePageState(activityPage, change)
}

function closeAdminMemberDetail() {
  adminSelectedMember.value = null
}

function switchAdminTab(tab: AdminTab) {
  adminTab.value = tab
  adminSelectedMember.value = null
  if (tab === 'overview') void guarded(loadAdminOverview)
  if (tab === 'stores') void guarded(loadAdminStores)
  if (tab === 'members') void guarded(loadAdminMembers)
  if (tab === 'activity') void guarded(loadActivityRows)
}

function openStoreForm(store?: AnyMap) {
  Object.assign(storeForm, {
    id: store?.id || 0,
    account: store?.account || '',
    shopName: store?.shopName || '',
    contactMobile: store?.contactMobile || '',
    address: store?.address || '',
    initialPassword: ''
  })
  storeModalVisible.value = true
}

async function saveStoreForm() {
  await guarded(async () => {
    const body = { ...storeForm }
    const creating = !storeForm.id
    if (storeForm.id) {
      await apiPut(`/admin/stores/${storeForm.id}`, body)
    } else {
      await apiPost('/admin/stores', body)
    }
    storeModalVisible.value = false
    if (creating) adminStorePage.pageNo = 1
    await Promise.all([loadAdminStores(), loadAdminOverview()])
  }, '门店已保存')
}

async function toggleStoreStatus(store: AnyMap) {
  await guarded(async () => {
    await apiPatch(`/admin/stores/${store.id}/status`, {
      status: store.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    })
    await Promise.all([loadAdminStores(), loadAdminOverview()])
  }, '状态已更新')
}

async function resetStorePassword(store: AnyMap) {
  await guarded(async () => {
    await apiPost(`/admin/stores/${store.id}/reset-password`, { newPassword: '123456' })
  }, '密码已重置为 123456')
}

async function openAdminMember(member: AnyMap) {
  await guarded(async () => {
    adminSelectedMember.value = await apiGet<AnyMap>(`/admin/members/${member.id}`)
    adminRechargePage.pageNo = 1
    adminConsumptionPage.pageNo = 1
    await Promise.all([loadAdminRechargeTransactions(), loadAdminConsumptionTransactions()])
  })
}

async function loadAdminRechargeTransactions() {
  if (!adminSelectedMember.value) return
  const page = await apiGet<AnyMap>(`/admin/members/${adminSelectedMember.value.id}/transactions`, {
    type: 'RECHARGE',
    pageNo: adminRechargePage.pageNo,
    pageSize: adminRechargePage.pageSize
  })
  adminRechargeTransactions.value = (page.records || []).map(labelTransaction)
  applyApiPage(adminRechargePage, page)
}

async function loadAdminConsumptionTransactions() {
  if (!adminSelectedMember.value) return
  const page = await apiGet<AnyMap>(`/admin/members/${adminSelectedMember.value.id}/transactions`, {
    type: 'CONSUMPTION',
    pageNo: adminConsumptionPage.pageNo,
    pageSize: adminConsumptionPage.pageSize
  })
  adminConsumptionTransactions.value = (page.records || []).map(labelTransaction)
  applyApiPage(adminConsumptionPage, page)
}

async function exportMembers() {
  await guarded(async () => {
    const params: AnyMap = {
      mobile: adminMemberFilter.mobile,
      name: adminMemberFilter.name
    }
    if (adminMemberFilter.storeId) params.storeId = adminMemberFilter.storeId
    const response = await http.get('/admin/members/export', { params, responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'members.csv'
    link.click()
    URL.revokeObjectURL(url)
  }, '导出已生成')
}

async function submitCorrection() {
  if (!adminSelectedMember.value) return
  await guarded(async () => {
    await apiPost(`/admin/members/${adminSelectedMember.value?.id}/corrections`, {
      correctionType: correctionForm.correctionType,
      amount: correctionForm.amount,
      reason: correctionForm.reason
    })
    await openAdminMember(adminSelectedMember.value as AnyMap)
    await loadAdminMembers()
  }, '冲正已完成')
}

async function adminReverse(tx: AnyMap) {
  await guarded(async () => {
    await apiPost(`/admin/transactions/${tx.id}/reverse`, { reason: correctionForm.reason || '后台撤销' })
    if (adminSelectedMember.value) await openAdminMember(adminSelectedMember.value)
  }, '后台撤销已完成')
}

async function adminRefund(tx: AnyMap) {
  await guarded(async () => {
    await apiPost(`/admin/transactions/${tx.id}/refund`, {
      storeId: tx.storeId,
      amount: tx.amount,
      reason: correctionForm.reason || '后台退款'
    })
    if (adminSelectedMember.value) await openAdminMember(adminSelectedMember.value)
  }, '后台退款已完成')
}

function labelTransaction(tx: AnyMap) {
  const labels: AnyMap = {
    RECHARGE: '充值',
    CONSUMPTION: '扣款',
    CONSUMPTION_REFUND: '退款',
    RECHARGE_REVERSAL: '充值撤销',
    MANUAL_CORRECTION: '人工冲正'
  }
  return { ...tx, typeLabel: labels[tx.type] || tx.type }
}

function money(value: unknown) {
  const number = Number(String(value ?? '0').replace(/[¥,]/g, ''))
  return `¥${Number.isFinite(number) ? number.toFixed(2) : '0.00'}`
}

function tierAmount(value: unknown) {
  const number = Number(String(value ?? '').replace(/,/g, ''))
  if (!Number.isFinite(number)) return String(value ?? '-')
  return number.toFixed(2).replace(/\.?0+$/, '')
}

function genderText(value: unknown) {
  if (value === 'FEMALE') return '女'
  if (value === 'MALE') return '男'
  return '未知'
}

function memberStatusText(value: unknown) {
  if (value === 'ACTIVE') return '活跃'
  if (value === 'DISABLED') return '停用'
  return '未知'
}

function detailDateTime(value: unknown) {
  const text = String(value || '-')
  if (text === '-') return text
  return text.replace(/-/g, '/').slice(0, 16)
}

function shortDateTime(value: unknown) {
  const text = String(value || '-')
  if (text === '-') return text
  const normalized = text.replace(/-/g, '/')
  const parts = normalized.split(' ')
  const date = parts[0]?.slice(5) || normalized
  const time = parts[1]?.slice(0, 5) || ''
  return time ? `${date} ${time}` : date
}

function paymentMethodText(value: unknown) {
  const labels: AnyMap = {
    CASH: '现金',
    WECHAT: '微信',
    ALIPAY: '支付宝',
    CARD: '银行卡',
    OTHER: '其他'
  }
  return labels[String(value || '')] || String(value || '-')
}

function paymentMethodClass(value: unknown) {
  return `method-${String(value || 'OTHER').toLowerCase()}`
}

function initials(value: unknown) {
  const text = String(value || '店')
  return text.slice(0, 1)
}

function builtinAvatar(value: unknown) {
  const text = String(value || '')
  return BUILTIN_AVATARS.find((avatar) => avatar.value === text)
}

function avatarImageSrc(value: unknown) {
  const text = String(value || '')
  if (!text || builtinAvatar(text)) return ''
  return assetUrl(text)
}

function avatarText(value: unknown, fallback: unknown) {
  return builtinAvatar(value)?.glyph || initials(fallback)
}

function avatarToneClass(value: unknown) {
  return builtinAvatar(value)?.tone || ''
}

function assetUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return url
}
</script>
