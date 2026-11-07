import dayjs from 'dayjs'
import { isDue, retrievability } from './srs'
import { todayKey } from './format'

export const emptyRecord = (date) => ({ date, newCount: 0, reviewCount: 0, correct: 0, total: 0, minutes: 0, mode: '' })

export function getRecord(records = [], date = todayKey()) {
  return records.find(r => r.date === date) || emptyRecord(date)
}

export function streakOf(records = []) {
  const set = new Set(records.filter(r => r.newCount + r.reviewCount > 0).map(r => r.date))
  let cursor = dayjs()
  if (!set.has(cursor.format('YYYY-MM-DD'))) cursor = cursor.subtract(1, 'day')
  let n = 0
  while (set.has(cursor.format('YYYY-MM-DD'))) {
    n++
    cursor = cursor.subtract(1, 'day')
  }
  return n
}

export function sumRecords(records = []) {
  return records.reduce((a, r) => {
    a.newCount += r.newCount || 0
    a.reviewCount += r.reviewCount || 0
    a.correct += r.correct || 0
    a.total += r.total || 0
    a.minutes += r.minutes || 0
    a.days += r.newCount + r.reviewCount > 0 ? 1 : 0
    return a
  }, { newCount: 0, reviewCount: 0, correct: 0, total: 0, minutes: 0, days: 0 })
}

export function dueWords(data, words) {
  return words.filter(w => {
    const st = data.progress[w.id]
    return st && st.seen > 0 && isDue(st)
  }).sort((a, b) => retrievability(data.progress[a.id]) - retrievability(data.progress[b.id]))
}

export function knownCount(data) {
  return Object.values(data.progress || {}).filter(s => s.seen > 0).length
}

export function masteredCount(data) {
  return Object.values(data.progress || {}).filter(s => s.mastery >= 60).length
}

export function bookStats(data, book, words) {
  const list = words.filter(w => w.bookId === book.id)
  const progress = data.progress || {}
  let learned = 0
  let mastered = 0
  list.forEach(w => {
    const s = progress[w.id]
    if (s && s.seen > 0) learned++
    if (s && s.mastery >= 60) mastered++
  })
  const total = list.length || 1
  return { total: list.length, learned, mastered, pct: Math.round((mastered / total) * 100), learnedPct: Math.round((learned / total) * 100) }
}

export function accuracyOf(data) {
  const all = Object.values(data.progress || {}).reduce((a, s) => {
    a.correct += s.correct || 0
    a.seen += s.seen || 0
    return a
  }, { correct: 0, seen: 0 })
  return all.seen ? Math.round((all.correct / all.seen) * 100) : 0
}

export function last14(records = []) {
  const map = new Map(records.map(r => [r.date, r]))
  const arr = []
  for (let i = 13; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day')
    const key = d.format('YYYY-MM-DD')
    const r = map.get(key)
    arr.push({ date: key, label: d.format('M/D'), newCount: r?.newCount || 0, reviewCount: r?.reviewCount || 0 })
  }
  return arr
}

export function heatmapWeeks(records = [], weeks = 26) {
  const map = new Map(records.map(r => [r.date, r]))
  const end = dayjs().startOf('week').add(1, 'day')
  const cells = []
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = dayjs().startOf('day').subtract(i, 'day')
    const r = map.get(d.format('YYYY-MM-DD'))
    const v = r ? r.newCount + r.reviewCount : 0
    cells.push({ date: d.format('YYYY-MM-DD'), value: v, level: v === 0 ? 0 : v < 15 ? 1 : v < 30 ? 2 : v < 55 ? 3 : 4 })
  }
  return cells
}

export function weekdayBuckets(records = []) {
  const buckets = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  records.forEach(r => {
    const d = dayjs(r.date).day()
    buckets[d] += (r.newCount || 0) + (r.reviewCount || 0)
    counts[d]++
  })
  return buckets
}
