<template>
  <aside class="side">
    <router-link to="/dashboard" class="brand">
      <span class="logo serif">Aa</span>
      <span class="brand-text">
        <strong>词跃</strong>
        <small>WORDLEAP</small>
      </span>
    </router-link>

    <nav class="nav">
      <template v-for="group in groups" :key="group.label">
        <div class="group-label">{{ group.label }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
          :title="item.label"
          @click="onNavClick(item.to)"
        >
          <AppIcon :name="item.icon" :size="17" />
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.to === '/review' && dueCount" class="badge num">{{ dueCount }}</span>
        </router-link>
      </template>
    </nav>

    <div class="side-foot">
      <div class="streak-card">
        <div class="between">
          <span class="tiny muted">连续打卡</span>
          <AppIcon name="flame" :size="15" class="flame" />
        </div>
        <div class="streak-num num"><strong>{{ study.streak }}</strong><span>天</span></div>
        <div class="week-dots">
          <span v-for="(d, i) in weekDots" :key="i" class="dot" :class="{ on: d.on, today: d.today }"></span>
        </div>
        <p class="tiny muted">本周已学 {{ weekTotal }} 词，加油</p>
      </div>

      <div class="user-row">
        <div class="avatar">{{ initial }}</div>
        <div class="user-meta">
          <strong>{{ user.displayName }}</strong>
          <small class="muted">Lv.{{ user.levelInfo.lv }} · {{ user.levelInfo.title }}</small>
        </div>
        <button class="icon-btn" title="设置" @click="$router.push('/profile')">
          <AppIcon name="settings" :size="16" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { useUiStore } from '../stores/ui'
import { last14 } from '../utils/stats'
import { todayKey } from '../utils/format'

const user = useUserStore()
const study = useStudyStore()
const ui = useUiStore()
const route = useRoute()

const groups = [
  {
    label: '学习中心',
    items: [
      { to: '/dashboard', label: '仪表盘', icon: 'dashboard' },
      { to: '/learn', label: '今日学习', icon: 'play' },
      { to: '/books', label: '词书库', icon: 'book' },
      { to: '/review', label: '智能复习', icon: 'refresh' },
      { to: '/wrong', label: '错词本', icon: 'book-open' },
      { to: '/garden', label: '词汇森林', icon: 'tree' },
      { to: '/arena', label: '听写擂台', icon: 'trophy' }
    ]
  },
  {
    label: '数据中心',
    items: [
      { to: '/stats', label: '学习统计', icon: 'chart' },
      { to: '/achievements', label: '我的成就', icon: 'award' }
    ]
  }
]

const dueCount = computed(() => (user.data ? study.dueList.length : 0))
const initial = computed(() => (user.displayName || '同学').slice(-1))

const weekDots = computed(() => {
  const days = last14(user.data?.records || []).slice(-7)
  const today = todayKey()
  return days.map(d => ({ on: d.newCount + d.reviewCount > 0, today: d.date === today }))
})
const weekTotal = computed(() => last14(user.data?.records || []).slice(-7).reduce((a, d) => a + d.newCount + d.reviewCount, 0))

function isActive(to) {
  return route.path === to || (to !== '/dashboard' && route.path.startsWith(to))
}

function onNavClick(to) {
  ui.mobileNav = false
  if (route.path === to) window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.side {
  background: var(--surface);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 22px 14px 16px;
  overflow: hidden;
}
.brand { display: flex; align-items: center; gap: 10px; padding: 0 8px 22px; }
.logo {
  width: 40px; height: 40px; border-radius: 13px; flex: 0 0 auto;
  display: grid; place-items: center;
  background: var(--primary); color: #fff; font-size: 19px; font-weight: 700;
  box-shadow: 0 8px 18px -10px rgba(31, 111, 92, .8);
}
.brand-text { display: flex; flex-direction: column; line-height: 1.15; }
.brand-text strong { font-size: 17px; color: var(--ink); letter-spacing: 1px; }
.brand-text small { font-size: 8.5px; letter-spacing: 2.4px; color: var(--faint); margin-top: 3px; }

.nav { flex: 1; overflow-y: auto; padding-bottom: 12px; }
.nav::-webkit-scrollbar { width: 0; }
.group-label { font-size: 11px; color: var(--faint); padding: 14px 12px 8px; letter-spacing: .5px; }
.nav-item {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 12px; border-radius: 12px; margin-bottom: 3px;
  color: var(--muted); font-size: 13px; position: relative;
  transition: background .15s, color .15s;
}
.nav-item:hover { background: var(--surface-2); color: var(--ink); }
.nav-item.active { background: var(--primary); color: #fff; box-shadow: 0 8px 20px -14px var(--primary); }
.nav-item.active .badge { background: rgba(255,255,255,.22); color: #fff; }
.nav-label { flex: 1; white-space: nowrap; }
.badge {
  min-width: 22px; height: 19px; padding: 0 6px; border-radius: 999px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 10.5px; display: grid; place-items: center;
}
.side-foot { border-top: 1px solid var(--line); padding-top: 12px; }
.streak-card {
  background: var(--surface-2); border: 1px solid var(--line);
  border-radius: 16px; padding: 12px 13px 11px; margin-bottom: 10px;
}
.flame { color: var(--accent); }
.streak-num { display: flex; align-items: baseline; gap: 3px; margin: 2px 0 8px; }
.streak-num strong { font-size: 22px; color: var(--ink); }
.streak-num span { font-size: 11px; color: var(--muted); }
.week-dots { display: flex; gap: 5px; margin-bottom: 8px; }
.dot { width: 9px; height: 9px; border-radius: 3px; background: var(--surface-3); }
.dot.on { background: var(--primary); }
.dot.today { outline: 1.5px solid var(--gold); outline-offset: 1px; }
.user-row { display: flex; align-items: center; gap: 9px; padding: 6px 6px 4px; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%; flex: 0 0 auto;
  display: grid; place-items: center; background: var(--primary-soft); color: var(--primary);
  font-weight: 600; font-size: 14px;
}
.user-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
.user-meta strong { font-size: 12.5px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-meta small { font-size: 10.5px; }
.icon-btn {
  width: 30px; height: 30px; border-radius: 9px; border: 0; background: transparent;
  color: var(--muted); display: grid; place-items: center; cursor: pointer;
}
.icon-btn:hover { background: var(--surface-2); color: var(--ink); }

@media (max-width: 1199px) {
  .side { padding: 20px 10px 14px; align-items: center; }
  .brand { padding: 0 0 18px; }
  .brand-text, .group-label, .nav-label, .badge, .side-foot { display: none; }
  .nav { width: 100%; }
  .nav-item { justify-content: center; padding: 11px 0; }
  .nav-item.active { box-shadow: none; }
  .nav { display: flex; flex-direction: column; gap: 4px; }
}
@media (max-width: 767px) {
  .side { align-items: stretch; width: 250px; }
  .brand { padding: 0 8px 18px; }
  .brand-text, .group-label, .nav-label, .side-foot { display: flex; }
  .group-label { display: block; }
  .nav-item { justify-content: flex-start; padding: 10px 12px; }
}
</style>