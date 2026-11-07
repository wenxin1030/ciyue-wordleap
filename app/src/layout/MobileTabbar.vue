<template>
  <nav class="tabbar">
    <router-link v-for="t in tabs" :key="t.to" :to="t.to" class="tab" :class="{ active: route.path === t.to, main: t.main }">
      <span class="tico"><AppIcon :name="t.icon" :size="t.main ? 22 : 19" /></span>
      <small>{{ t.label }}</small>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
const route = useRoute()
const tabs = [
  { to: '/dashboard', label: '首页', icon: 'dashboard' },
  { to: '/books', label: '词书', icon: 'book' },
  { to: '/learn', label: '学习', icon: 'play', main: true },
  { to: '/stats', label: '统计', icon: 'chart' },
  { to: '/profile', label: '我的', icon: 'user' }
]
</script>

<style scoped>
.tabbar {
  display: none;
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 52;
  height: 64px; padding: 0 10px calc(4px + env(safe-area-inset-bottom));
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--line);
  align-items: center; justify-content: space-around;
}
.tab { display: flex; flex-direction: column; align-items: center; gap: 2px; color: var(--faint); font-size: 10px; flex: 1; padding-top: 8px; }
.tab.active { color: var(--primary); }
.tico { display: grid; place-items: center; }
.tab.main .tico {
  width: 46px; height: 46px; margin-top: -22px; border-radius: 50%;
  background: var(--primary); color: #fff; border: 4px solid var(--bg);
  box-shadow: 0 10px 22px -12px var(--primary);
}
.tab.main small { margin-top: 1px; }
.tab.main.active .tico { background: var(--primary-dark); }
@media (max-width: 767px) { .tabbar { display: flex; } }
</style>
