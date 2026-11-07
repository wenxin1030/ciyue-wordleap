<template>
  <div class="stat card">
    <div class="between">
      <span class="label">{{ label }}</span>
      <span class="ico" :class="tone"><AppIcon :name="icon" :size="15" /></span>
    </div>
    <div class="value num"><strong>{{ value }}</strong><small>{{ unit }}</small></div>
    <div class="foot" :class="tone">
      <AppIcon v-if="deltaIcon" :name="deltaIcon" :size="12" />
      <span>{{ foot }}</span>
    </div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
defineProps({
  label: String, value: [String, Number], unit: String, foot: String,
  icon: { type: String, default: 'chart' },
  tone: { type: String, default: 'mint' },
  deltaIcon: { type: String, default: '' }
})
</script>

<style scoped>
.stat { padding: 18px 20px 16px; min-width: 0; }
.label { font-size: 12.5px; color: var(--muted); }
.ico { width: 26px; height: 26px; border-radius: 9px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); }
.ico.gold { background: var(--gold-soft); color: var(--gold); }
.ico.accent { background: var(--accent-soft); color: var(--accent); }
.ico.mint { background: var(--primary-soft); color: var(--primary); }
.value { margin-top: 6px; display: flex; align-items: baseline; gap: 4px; }
.value strong { font-size: 26px; color: var(--ink); font-weight: 700; letter-spacing: -.5px; }
.value small { color: var(--muted); font-size: 12px; }
.foot { margin-top: 6px; font-size: 11.5px; color: var(--muted); display: flex; align-items: center; gap: 4px; }
.foot.mint { color: var(--primary); }
.foot.accent { color: var(--accent); }
.foot.gold { color: var(--gold); }
</style>
