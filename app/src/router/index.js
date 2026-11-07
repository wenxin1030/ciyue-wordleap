import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true, title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layout/AppShell.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: '仪表盘', crumb: ['学习中心', '仪表盘'] } },
      { path: 'learn', name: 'learn', component: () => import('../views/LearnView.vue'), meta: { title: '今日学习', crumb: ['学习中心', '今日学习'] } },
      { path: 'books', name: 'books', component: () => import('../views/BooksView.vue'), meta: { title: '词书库', crumb: ['学习中心', '词书库'] } },
        { path: 'books/:id', name: 'book-detail', component: () => import('../views/BookDetailView.vue'), meta: { title: '词书详情', crumb: ['学习中心', '词书库', '词书详情'] } },
      { path: 'review', name: 'review', component: () => import('../views/ReviewView.vue'), meta: { title: '智能复习', crumb: ['学习中心', '智能复习'] } },
      { path: 'wrong', name: 'wrong', component: () => import('../views/WrongBookView.vue'), meta: { title: '错词本', crumb: ['学习中心', '错词本'] } },
      { path: 'garden', name: 'garden', component: () => import('../views/GardenView.vue'), meta: { title: '词汇森林', crumb: ['学习中心', '词汇森林'] } },
      { path: 'arena', name: 'arena', component: () => import('../views/ArenaView.vue'), meta: { title: '听写擂台', crumb: ['学习中心', '听写擂台'] } },
      { path: 'stats', name: 'stats', component: () => import('../views/StatsView.vue'), meta: { title: '学习统计', crumb: ['数据中心', '学习统计'] } },
      { path: 'achievements', name: 'achievements', component: () => import('../views/AchievementsView.vue'), meta: { title: '我的成就', crumb: ['数据中心', '我的成就'] } },
      { path: 'profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { title: '个人中心', crumb: ['账号', '个人中心'] } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(to => {
  const user = useUserStore()
  if (!user.ready) user.init()
  if (to.meta.guest) {
    if (user.isLoggedIn) return { name: 'dashboard' }
    return true
  }
  if (!user.isLoggedIn) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  return true
})

router.onError((error, to) => {
  const msg = String(error && error.message ? error.message : error)
  const staleChunk = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)
  if (!staleChunk || !to || !to.fullPath) return
  const key = 'wl_chunk_reload_at'
  const last = Number(sessionStorage.getItem(key) || 0)
  if (Date.now() - last < 10000) return
  sessionStorage.setItem(key, String(Date.now()))
  const url = new URL(window.location.href)
  url.hash = '#' + to.fullPath
  window.location.replace(url.toString())
})

router.afterEach(to => {
  sessionStorage.removeItem('wl_chunk_reload_at')
  document.title = (to.meta.title ? to.meta.title + ' · ' : '') + '词跃 WordLeap'
})

export default router