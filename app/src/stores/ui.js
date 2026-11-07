import { defineStore } from 'pinia'
import { load, save } from '../utils/storage'

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarCollapsed: load('sidebar', false),
    mobileNav: false,
    searchOpen: false,
    notifyOpen: false,
    preview: null
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      save('sidebar', this.sidebarCollapsed)
    },
    openWord(word) {
      this.preview = word || null
    },
    closeWord() {
      this.preview = null
    }
  }
})
