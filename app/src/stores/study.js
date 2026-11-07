import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { words, wordMap } from '../mock/words'
import { achievements, levelTable } from '../mock/achievements'
import { createState, review, isDue, retrievability, RATING } from '../utils/srs'
import { todayKey, shuffle } from '../utils/format'
import { getRecord, streakOf, masteredCount, dueWords } from '../utils/stats'
import { useUserStore } from './user'
import { sfx } from '../utils/sound'

const XP = { [RATING.AGAIN]: 1, [RATING.HARD]: 4, [RATING.GOOD]: 7 }

export const useStudyStore = defineStore('study', {
  state: () => ({
    session: null,
    result: null
  }),
  getters: {
    running: s => !!s.session && s.session.phase !== 'done',
    currentWord: s => s.session ? wordMap[s.session.queue[s.session.idx]] : null,
    dueList() {
      const u = useUserStore()
      return dueWords(u.data, words)
    },
    newList() {
      const u = useUserStore()
      return words.filter(w => !u.data.progress[w.id] || !u.data.progress[w.id].seen)
    },
    todayRecord() {
      const u = useUserStore()
      return getRecord(u.data.records)
    },
    streak() {
      const u = useUserStore()
      return streakOf(u.data.records)
    },
    tasks() {
      const r = this.todayRecord
      const doneNew = Math.min(r.newCount, 20)
      const doneReview = Math.min(r.reviewCount, 10)
      const doneListen = Math.min(r.listens || 0, 1)
      return [
        { key: 'new', title: '学习 20 个新词', done: doneNew, target: 20, finished: doneNew >= 20 },
        { key: 'review', title: '复习 10 个到期词', done: doneReview, target: 10, finished: doneReview >= 10 },
        { key: 'listen', title: '完成 1 次听写', done: doneListen, target: 1, finished: doneListen >= 1 }
      ]
    },
    tasksDone() { return this.tasks.filter(t => t.finished).length },
    chestReady() {
      const u = useUserStore()
      const t = u.data.tasks
      return this.tasksDone === 3 && t.date === todayKey() && !t.chestOpened
    }
  },
  actions: {
    buildQueue({ mode = 'recognize', source = 'plan', bookId = null, size = 20 }) {
      const u = useUserStore()
      const data = u.data
      let pool = words.filter(w => !bookId || w.bookId === bookId)
      let list = []
      if (source === 'review') {
        list = pool.filter(w => {
          const s = data.progress[w.id]
          return s && s.seen > 0 && isDue(s)
        }).sort((a, b) => retrievability(data.progress[a.id]) - retrievability(data.progress[b.id]))
        list = list.slice(0, size)
      } else if (source === 'wrong') {
        list = pool.filter(w => data.progress[w.id]?.wrong > 0)
          .sort((a, b) => (data.progress[b.id]?.wrong || 0) - (data.progress[a.id]?.wrong || 0))
          .slice(0, size)
      } else {
        const due = pool.filter(w => {
          const s = data.progress[w.id]
          return s && s.seen > 0 && isDue(s)
        }).sort((a, b) => retrievability(data.progress[a.id]) - retrievability(data.progress[b.id])).slice(0, Math.ceil(size * 0.45))
        const fresh = pool.filter(w => !data.progress[w.id]?.seen)
        const extra = pool.filter(w => data.progress[w.id]?.seen && !isDue(data.progress[w.id]))
        list = [...due, ...fresh.slice(0, size - due.length)]
        if (list.length < size) list = [...list, ...extra.slice(0, size - list.length)]
      }
      if (!list.length) throw new Error('当前没有可学习的单词，试试其他词书')
      return shuffle(list).map(w => w.id).slice(0, size)
    },
    start(opts = {}) {
      const u = useUserStore()
      const mode = opts.mode || 'recognize'
      const queue = this.buildQueue(opts)
      const first = wordMap[queue[0]]
      this.result = null
      this.session = {
        mode,
        source: opts.source || 'plan',
        bookId: opts.bookId || null,
        queue,
        idx: 0,
        phase: mode === 'self' ? 'prompt' : 'question',
        combo: 0,
        maxCombo: 0,
        weakCount: 0,
        correctCount: 0,
        answered: 0,
        newCount: 0,
        reviewCount: 0,
        xpGained: 0,
        listens: mode === 'spell' || mode === 'listen' ? 1 : 0,
        startedAt: Date.now(),
        xpStart: u.data.xp,
        bookName: first?.bookId
      }
      u.data.resume = { queue, idx: 0, mode, source: this.session.source, bookId: this.session.bookId, at: Date.now() }
      u.persist()
    },
    resume() {
      const u = useUserStore()
      const r = u.data.resume
      if (!r || !r.queue?.length) return false
      const queue = r.queue.filter(id => wordMap[id])
      if (!queue.length) return false
      this.result = null
      this.session = {
        mode: r.mode || 'recognize',
        source: r.source || 'plan',
        bookId: r.bookId || null,
        queue,
        idx: Math.min(r.idx || 0, queue.length - 1),
        phase: (r.mode || 'recognize') === 'self' ? 'prompt' : 'question',
        combo: 0,
        maxCombo: 0,
        weakCount: 0,
        correctCount: 0,
        answered: 0,
        newCount: 0,
        reviewCount: 0,
        xpGained: 0,
        listens: 0,
        startedAt: Date.now(),
        xpStart: u.data.xp
      }
      return true
    },
    reveal() {
      if (this.session) this.session.phase = 'reveal'
    },
    stop() {
      this.session = null
      this.result = null
    },
    answerQuestion(correct) {
      const s = this.session
      if (!s || s.phase !== 'question') return
      s.answered++
      if (correct) {
        s.correctCount++
        s.combo++
        s.maxCombo = Math.max(s.maxCombo, s.combo)
        sfx.correct()
        if (s.combo >= 3) sfx.combo(s.combo)
      } else {
        s.combo = 0
        sfx.wrong()
      }
      s.phase = 'reveal'
    },
    rate(rating) {
      const s = this.session
      if (!s) return
      if (rating !== RATING.GOOD) s.weakCount = (s.weakCount || 0) + 1
      const u = useUserStore()
      const id = s.queue[s.idx]
      const data = u.data
      const existed = data.progress[id]?.seen > 0
      const prev = data.progress[id] || createState()
      const next = review(prev, rating)
      data.progress[id] = next

      const today = todayKey()
      let rec = data.records.find(r => r.date === today)
      if (!rec) {
        rec = { date: today, newCount: 0, reviewCount: 0, correct: 0, total: 0, minutes: 0, listens: 0, mode: s.mode }
        data.records.push(rec)
      }
      if (existed) {
        rec.reviewCount++
        s.reviewCount++
      } else {
        rec.newCount++
        s.newCount++
      }
      rec.total++
      if (rating !== RATING.AGAIN) rec.correct++
      if ((s.mode === 'spell' || s.mode === 'listen') && !rec.listens) rec.listens = 1
      rec.mode = s.mode
      const gained = XP[rating] + (s.combo >= 3 ? 2 : 0)
      s.xpGained += gained
      data.xp += gained
      data.lastStudyDate = today

      if (rating !== RATING.AGAIN) {
        const n = Object.keys(data.progress).length
        if (n % 10 === 0) data.items.coins = (data.items.coins || 0) + 5
      }

      s.idx++
      if (s.idx >= s.queue.length) {
        this.finish()
      } else {
        s.phase = s.mode === 'self' ? 'prompt' : 'question'
        data.resume = { queue: s.queue, idx: s.idx, mode: s.mode, source: s.source, bookId: s.bookId, at: Date.now() }
        u.persist()
      }
    },
    finish() {
      const u = useUserStore()
      const s = this.session
      if (!s) return
      const data = u.data
      const total = s.answered
      const acc = total ? Math.round((s.correctCount / total) * 100) : 0
      const minutes = Math.max(1, Math.round((Date.now() - s.startedAt) / 60000))
      const rec = data.records.find(r => r.date === todayKey())
      if (rec) rec.minutes = (rec.minutes || 0) + minutes
      const before = s.xpStart ?? Math.max(0, data.xp - s.xpGained)
      const unlocked = this.checkAchievements()
      const levelBefore = levelTable.filter(l => l.exp <= before).length
      const levelAfter = levelTable.filter(l => l.exp <= data.xp).length
      if (levelAfter > levelBefore) sfx.levelUp()
      this.result = {
        total,
        correct: s.correctCount,
        accuracy: acc,
        newCount: s.newCount,
        reviewCount: s.reviewCount,
        minutes,
        maxCombo: s.maxCombo,
        weakCount: s.weakCount || 0,
        xpGained: s.xpGained,
        unlocked,
        mode: s.mode
      }
      s.phase = 'done'
      delete data.resume
      u.persist()
    },
    checkAchievements() {
      const u = useUserStore()
      const data = u.data
      const r = getRecord(data.records)
      const metrics = {
        streak: streakOf(data.records),
        mastered: masteredCount(data),
        perfectSessions: data.records.filter(x => x.total > 0 && x.correct === x.total).length,
        earlyBirds: data.records.some(x => x.early) ? 1 : 0,
        nightOwls: data.records.some(x => x.night) ? 1 : 0,
        monthDays: new Set(data.records.filter(x => dayjs(x.date).isAfter(dayjs().subtract(30, 'day'))).map(x => x.date)).size,
        booksTouched: new Set(Object.entries(data.progress).filter(([, v]) => v.mastery >= 60).map(([id]) => wordMap[id]?.bookId)).size,
        arenaBest: data.arena?.best || 0,
        trees: Math.floor(masteredCount(data) / 10)
      }
      const unlocked = []
      achievements.forEach(a => {
        if (data.achievements[a.id]?.unlocked) return
        if ((metrics[a.metric] || 0) >= a.target) {
          data.achievements[a.id] = { unlocked: true, at: todayKey() }
          unlocked.push(a)
        }
      })
      if (unlocked.length) u.persist()
      return unlocked
    },
    claimChest() {
      const u = useUserStore()
      if (!this.chestReady) return null
      const pool = [
        { type: 'makeup', name: '补签卡', amount: 1 },
        { type: 'double', name: '双倍经验卡', amount: 1 },
        { type: 'freeze', name: '连续冻结卡', amount: 1 },
        { type: 'coins', name: '词币', amount: 50 }
      ]
      const prize = pool[Math.floor(Math.random() * pool.length)]
      const t = u.data.tasks
      if (prize.type === 'coins') u.data.items.coins = (u.data.items.coins || 0) + prize.amount
      else u.data.items[prize.type] = (u.data.items[prize.type] || 0) + prize.amount
      t.chestOpened = true
      u.data.xp += 30
      u.persist()
      sfx.coin()
      return prize
    },
    useMakeup() {
      const u = useUserStore()
      if (!u.data.items.makeup) return false
      u.data.items.makeup--
      u.persist()
      return true
    },
    recordArena(score, xp = 0) {
      const u = useUserStore()
      if (!u.data.arena) u.data.arena = { best: 0, plays: 0 }
      u.data.arena.plays++
      const isBest = score > (u.data.arena.best || 0)
      u.data.arena.best = Math.max(u.data.arena.best || 0, score)
      if (xp > 0) u.data.xp += xp
      const rec = u.data.records.find(r => r.date === todayKey())
      if (rec) rec.listens = 1
      u.persist()
      this.checkAchievements()
      return isBest
    }
  }
})
