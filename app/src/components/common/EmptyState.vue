<template>
  <div class="empty">
    <div class="ico"><AppIcon :name="icon" :size="26" /></div>
    <h3>{{ title }}</h3>
    <p>{{ desc }}</p>
    <el-button v-if="action" type="primary" round @click="$emit('action')">{{ action }}</el-button>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
defineProps({ title: String, desc: String, icon: { type: String, default: 'leaf' }, action: String })
defineEmits(['action'])
</script>

<style scoped>
.empty { padding: 44px 20px; text-align: center; }
.ico { width: 52px; height: 52px; border-radius: 16px; margin: 0 auto 12px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); }
h3 { font-size: 15px; margin-bottom: 4px; }
p { color: var(--muted); font-size: 12.5px; margin-bottom: 16px; }
</style>
