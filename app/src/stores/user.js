import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { load, save, remove, hashPassword, uid } from '../utils/storage'
import { seedDemo, createDefaultData } from '../mock/seed'
import { levelTable } from '../mock/achievements'
import { words } from '../mock/words'

const USERS = 'users'
const SESSION = 'session'
const DATA = 'data_'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    session: null,
    data: null,
    ready: false
  }),
  getters: {
    isLoggedIn: s => !!s.data,
    account: s => s.users.find(u => u.id === s.session?.userId) || null,
    profile: s => s.data?.profile || {},
    prefs: s => s.data?.prefs || {},
    displayName: s => s.data?.profile?.nickname || s.data?.profile?.name || '同学',
    levelInfo: s => {
      const xp = s.data?.xp || 0
      let i = levelTable.findIndex(l => l.exp > xp)
      if (i === -1) i = levelTable.length
      const cur = levelTable[Math.max(0, i - 1)]
      const next = levelTable[i] || null
      const pct = next ? Math.round(((xp - cur.exp) / (next.exp - cur.exp)) * 100) : 100
      return { ...cur, xp, next, pct, remain: next ? next.exp - xp : 0 }
    },
    joinedBooks: s => {
      if (!s.data) return []
      return Object.entries(s.data.books).filter(([, v]) => v.joined).map(([id]) => id)
    },
    mainBook: s => {
      if (!s.data) return null
      const e = Object.entries(s.data.books).find(([, v]) => v.joined && v.main)
      return e ? e[0] : null
    },
    wordsById: () => Object.fromEntries(words.map(w => [w.id, w]))
  },
  actions: {
    init() {
      if (this.ready) return
      let users = load(USERS)
      if (!users || !users.length) {
        const demo = seedDemo()
        users = [demo.user]
        save(USERS, users)
        save(DATA + demo.user.id, demo.data)
      }
      this.users = users
      const session = load(SESSION)
      if (session && session.expire > Date.now()) {
        const data = load(DATA + session.userId)
        if (data) {
          this.session = session
          this.data = this.migrate(data)
        }
      }
      if (!this.data) remove(SESSION)
      this.ready = true
    },
    migrate(data) {
      const base = createDefaultData(data.profile || {})
      const merged = { ...base, ...data, prefs: { ...base.prefs, ...(data.prefs || {}) }, items: { ...base.items, ...(data.items || {}) } }
      if (!merged.records) merged.records = []
      return merged
    },
    persist() {
      if (!this.data || !this.session) return
      save(DATA + this.session.userId, this.data)
    },
    login(account, password, remember = false) {
      const user = this.users.find(u => u.account === account.trim())
      if (!user || user.password !== hashPassword(password)) throw new Error('账号或密码不正确')
      const session = { userId: user.id, expire: Date.now() + (remember ? 7 : 1) * 86400000, remember }
      save(SESSION, session)
      this.session = session
      this.data = this.migrate(load(DATA + user.id) || createDefaultData({}))
      save(DATA + user.id, this.data)
      this.applyTheme(this.data.prefs.theme)
      return user
    },
    register({ account, password, nickname, studentNo, school }) {
      if (this.users.some(u => u.account === account)) throw new Error('该邮箱或手机号已注册')
      const profile = {
        id: uid('u'),
        name: nickname,
        nickname,
        email: account.includes('@') ? account : '',
        phone: account.includes('@') ? '' : account,
        studentNo: studentNo || '',
        className: '人工智能 1 班',
        school: school || '',
        targetExam: '大学英语四级（CET-4）',
        examDate: dayjs().add(120, 'day').format('YYYY-MM-DD'),
        avatarColor: 'mint',
        bio: '',
        createdAt: Date.now()
      }
      const user = { id: profile.id, account: account.trim(), password: hashPassword(password), createdAt: Date.now() }
      const data = createDefaultData(profile)
      data.items = { makeup: 1, double: 0, freeze: 0, coins: 50 }
      this.users.push(user)
      save(USERS, this.users)
      save(DATA + user.id, data)
      const session = { userId: user.id, expire: Date.now() + 86400000, remember: false }
      save(SESSION, session)
      this.session = session
      this.data = data
      this.applyTheme('ink')
      return user
    },
    logout() {
      remove(SESSION)
      this.session = null
      this.data = null
    },
    updateProfile(patch) {
      Object.assign(this.data.profile, patch)
      this.persist()
    },
    changePassword(oldPw, newPw) {
      const user = this.users.find(u => u.id === this.session.userId)
      if (!user || user.password !== hashPassword(oldPw)) throw new Error('原密码不正确')
      user.password = hashPassword(newPw)
      this.data.profile.passwordUpdatedAt = Date.now()
      save(USERS, this.users)
      this.persist()
      return true
    },
    setPref(key, value) {
      this.data.prefs[key] = value
      if (key === 'theme') this.applyTheme(value)
      this.persist()
    },
    applyTheme(theme) {
      document.documentElement.dataset.theme = theme === 'night' ? 'night' : 'ink'
      save('theme', theme)
      if (this.data) this.data.prefs.theme = theme === 'night' ? 'night' : 'ink'
    },
    toggleTheme() {
      this.setPref('theme', this.prefs.theme === 'night' ? 'ink' : 'night')
    },
    resetDemo() {
      const demo = seedDemo()
      this.users = [demo.user]
      save(USERS, this.users)
      save(DATA + demo.user.id, demo.data)
      remove(SESSION)
      this.session = null
      this.data = null
    }
  }
})
