/**
 * 简化版间隔重复模型（SM-2 思路）
 * S: 记忆稳定度（天）  D: 难度  mastery: 0-100 掌握度
 * rating: 0 不认识 / 1 有点模糊 / 2 认识
 */
export const RATING = { AGAIN: 0, HARD: 1, GOOD: 2 }

export function createState() {
  return { S: 0, D: 5, reps: 0, lapses: 0, last: null, mastery: 0, wrong: 0, seen: 0, correct: 0 }
}

export function review(state, rating, now = Date.now()) {
  const s = { ...state }
  s.seen += 1
  s.reps += 1
  if (rating === RATING.AGAIN) {
    s.lapses += 1
    s.wrong += 1
    s.S = Math.max(0.4, (s.S || 1) * 0.5)
    s.D = Math.min(10, s.D + 0.3)
    s.mastery = Math.max(0, s.mastery - 14)
  } else if (rating === RATING.HARD) {
    s.S = s.S ? Math.max(1, s.S * 1.1) : 1.2
    s.mastery = Math.min(100, s.mastery + 3)
    s.correct += 1
  } else {
    s.correct += 1
    s.S = s.S ? Math.min(180, s.S * 1.9) : 2.5
    s.D = Math.max(1.3, s.D - 0.15)
    s.mastery = Math.min(100, s.mastery + 9 + Math.min(6, s.reps))
  }
  s.last = now
  return s
}

/** 当前可提取概率 R = exp(-Δt / S) */
export function retrievability(state, now = Date.now()) {
  if (!state.last) return 0
  if (!state.S) return 0
  const days = (now - state.last) / 86400000
  return Math.exp(-Math.max(0, days) / state.S)
}

export function dueAt(state) {
  if (!state.last) return 0
  return state.last + (state.S || 1) * 86400000
}

export function isDue(state, now = Date.now()) {
  if (!state.last) return true
  return dueAt(state) <= now
}

export function daysUntilDue(state, now = Date.now()) {
  return Math.max(0, Math.ceil((dueAt(state) - now) / 86400000))
}

export function masteryLevel(m) {
  if (m >= 85) return { key: 'mastered', label: '熟练', color: 'primary' }
  if (m >= 60) return { key: 'known', label: '认识', color: 'primary-light' }
  if (m >= 30) return { key: 'fuzzy', label: '模糊', color: 'gold' }
  return { key: 'raw', label: '生疏', color: 'accent' }
}

export function nextIntervalText(state) {
  const d = state.S || 0
  if (d <= 0) return '待学习'
  if (d < 1) return '今天'
  if (d < 2) return '明天'
  return Math.round(d) + ' 天后'
}
