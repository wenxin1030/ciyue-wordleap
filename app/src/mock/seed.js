import dayjs from 'dayjs'
import { words } from './words'
import { todayKey } from '../utils/format'
import { hashPassword } from '../utils/storage'

const pick = (a, b) => Math.round(a + Math.random() * (b - a))

export function createDefaultData(profile) {
  return {
    profile,
    prefs: { dailyGoal: 40, autoSpeak: false, remind: true, smartFirst: true, theme: 'ink', sound: true, fontSize: 'normal' },
    books: { cet4: { joined: true, main: true, addedAt: Date.now() } },
    progress: {},
    records: [],
    items: { makeup: 1, double: 0, freeze: 0, coins: 0 },
    xp: 0,
    achievements: {},
    tasks: { date: todayKey(), chestOpened: false, claimed: [] },
    arena: { best: 0, plays: 0 },
    lastStudyDate: null
  }
}

export function seedDemo() {
  const profile = {
    id: 'u_demo',
    name: '林小满',
    nickname: '林小满',
    email: 'demo@wordleap.cn',
    phone: '13800006721',
    studentNo: '2024AI0312',
    className: '人工智能 1 班',
    school: '智能与工程学院',
    targetExam: '大学英语四级（CET-4）',
    examDate: dayjs().add(42, 'day').format('YYYY-MM-DD'),
    avatarColor: 'mint',
    bio: '每天进步一点点',
    createdAt: Date.now()
  }
  const data = createDefaultData(profile)
  data.books = {
    cet4: { joined: true, main: true, addedAt: Date.now() },
    ielts: { joined: true, main: false, addedAt: Date.now() },
    kaoyan: { joined: true, main: false, addedAt: Date.now() }
  }
  data.prefs.dailyGoal = 40
  data.items = { makeup: 2, double: 1, freeze: 1, coins: 320 }
  data.xp = 780

  const now = Date.now()
  words.forEach((w, i) => {
    if (i > 49) return
    const base = i % 7 === 0 ? { mastery: pick(18, 40), S: pick(1, 3) } : { mastery: pick(62, 96), S: pick(6, 34) }
    const elapsed = i % 7 === 0 ? pick(2, 9) : pick(1, Math.max(2, Math.round(base.S * 0.55)))
    data.progress[w.id] = {
      S: base.S,
      D: 3.4,
      reps: pick(2, 6),
      lapses: i % 9 === 0 ? 1 : 0,
      last: now - elapsed * 86400000,
      mastery: base.mastery,
      wrong: i % 6 === 0 ? pick(1, 4) : 0,
      seen: pick(3, 9),
      correct: pick(2, 8)
    }
  })

  // 让 12 个词确定到期，保证"待复习"有内容
  ;[0, 2, 5, 9, 12, 16, 21, 25, 28, 33, 41, 47].forEach(i => {
    const w = words[i]
    const s = data.progress[w.id]
    s.last = now - Math.max(1, s.S * 1.4) * 86400000
    s.mastery = Math.min(s.mastery, 58)
  })

  const today = dayjs()
  for (let i = 89; i >= 0; i--) {
    const d = today.subtract(i, 'day')
    const key = d.format('YYYY-MM-DD')
    const recent = i < 18
    if (!recent && Math.random() < 0.22) continue
    const newCount = i === 0 ? 16 : pick(6, 26)
    const reviewCount = i === 0 ? 12 : pick(8, 38)
    const total = newCount + reviewCount
    const correct = Math.round(total * (pick(84, 97) / 100))
    data.records.push({
      date: key,
      newCount,
      reviewCount,
      correct,
      total,
      minutes: i === 0 ? 18 : pick(14, 46),
      mode: i % 3 === 0 ? 'spell' : 'recognize'
    })
  }

  data.achievements = {
    streak7: { unlocked: true, at: today.subtract(11, 'day').format('YYYY-MM-DD') },
    streak14: { unlocked: true, at: today.subtract(4, 'day').format('YYYY-MM-DD') },
    perfect: { unlocked: true, at: today.subtract(9, 'day').format('YYYY-MM-DD') },
    early: { unlocked: true, at: today.subtract(21, 'day').format('YYYY-MM-DD') },
    night: { unlocked: true, at: today.subtract(6, 'day').format('YYYY-MM-DD') },
    month: { unlocked: true, at: today.subtract(2, 'day').format('YYYY-MM-DD') },
    king: { unlocked: true, at: today.subtract(8, 'day').format('YYYY-MM-DD') },
    arena: { unlocked: true, at: today.subtract(3, 'day').format('YYYY-MM-DD') }
  }
  data.arena = { best: 42, plays: 7 }
  data.lastStudyDate = todayKey()
  return {
    user: {
      id: 'u_demo',
      account: 'demo@wordleap.cn',
      password: hashPassword('123456'),
      createdAt: Date.now()
    },
    data
  }
}

export const demoSeedWords = words