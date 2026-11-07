<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import { load } from './utils/storage'
import { hydrateCustomBooks } from './utils/customBooks'

const user = useUserStore()
document.documentElement.dataset.theme = load('theme', 'ink') === 'night' ? 'night' : 'ink'
hydrateCustomBooks()

onMounted(() => {
  if (!user.ready) user.init()
  if (user.isLoggedIn) user.applyTheme(user.prefs.theme || 'ink')
})
</script>
