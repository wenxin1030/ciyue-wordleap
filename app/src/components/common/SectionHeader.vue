<template>
  <div class="section-title">
    <h2>{{ title }} <span v-if="sub" class="sub">{{ sub }}</span></h2>
    <div class="sh-right">
      <slot name="extra" />
      <span v-if="link" class="link" @click="$emit('link')">{{ link }} <AppIcon name="arrow-right" :size="13" /></span>
    </div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
defineProps({ title: String, sub: String, link: String })
defineEmits(['link'])
</script>

<style scoped>
.sub { font-size: 12px; font-weight: 400; color: var(--muted); }
.sh-right { display: flex; align-items: center; gap: 12px; }
.link { display: inline-flex; align-items: center; gap: 3px; }
</style>
