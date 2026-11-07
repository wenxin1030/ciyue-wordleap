<template>
  <div class="ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :viewBox="'0 0 ' + size + ' ' + size" :width="size" :height="size">
      <circle :cx="c" :cy="c" :r="r" fill="none" :stroke="track" :stroke-width="stroke" />
      <circle
        :cx="c" :cy="c" :r="r" fill="none" :stroke="color" :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        :transform="'rotate(-90 ' + c + ' ' + c + ')'"
        class="bar"
      />
    </svg>
    <div class="ring-inner">
      <slot>
        <strong class="num">{{ Math.round(pct) }}<span class="pct">%</span></strong>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  size: { type: Number, default: 92 },
  stroke: { type: Number, default: 9 },
  color: { type: String, default: 'var(--primary)' },
  track: { type: String, default: 'var(--surface-3)' }
})
const c = computed(() => props.size / 2)
const r = computed(() => props.size / 2 - props.stroke / 2)
const circumference = computed(() => 2 * Math.PI * r.value)
const pct = computed(() => Math.min(100, (props.value / (props.max || 1)) * 100))
const offset = computed(() => circumference.value * (1 - pct.value / 100))
</script>

<style scoped>
.ring { position: relative; display: grid; place-items: center; }
.ring svg { transform: rotate(0deg); }
.bar { transition: stroke-dashoffset .6s cubic-bezier(.22,.8,.3,1); }
.ring-inner { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; }
.ring-inner strong { font-size: 22px; color: var(--ink); font-weight: 700; line-height: 1.1; }
.ring-inner .pct { font-size: 11px; color: var(--muted); margin-left: 1px; }
</style>
