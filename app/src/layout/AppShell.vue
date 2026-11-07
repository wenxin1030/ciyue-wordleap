<template>
  <div class="shell" :class="{ collapsed: ui.sidebarCollapsed, 'nav-open': ui.mobileNav }">
    <AppSidebar />
    <div v-if="ui.mobileNav" class="backdrop" @click="ui.mobileNav = false"></div>
    <div class="main">
      <AppHeader />
      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="slide-up" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
      <MobileTabbar />
    </div>
    <WordDetailDialog />
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '../stores/ui'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import MobileTabbar from './MobileTabbar.vue'
import WordDetailDialog from '../components/study/WordDetailDialog.vue'

const ui = useUiStore()
const route = useRoute()
watch(() => route.fullPath, () => { ui.mobileNav = false })
</script>

<style scoped>
.shell { min-height: 100vh; }
.side { position: fixed; inset: 0 auto 0 0; width: var(--sidebar-w); z-index: 60; }
.main { margin-left: var(--sidebar-w); min-height: 100vh; display: flex; flex-direction: column; transition: margin-left .2s ease; }
.content { flex: 1; min-width: 0; }
.backdrop { position: fixed; inset: 0; background: rgba(11, 24, 20, .38); z-index: 55; backdrop-filter: blur(2px); }
.shell.collapsed .side { width: 78px; }
.shell.collapsed .main { margin-left: 78px; }

@media (max-width: 1199px) {
  .side { width: 78px; }
  .main { margin-left: 78px; }
  .shell.collapsed .side, .shell.collapsed .main { width: 78px; margin-left: 78px; }
}
@media (max-width: 767px) {
  .side { transform: translateX(-100%); transition: transform .24s ease; width: 250px; }
  .shell.nav-open .side { transform: none; }
  .main, .shell.collapsed .main { margin-left: 0; }
}
</style>
