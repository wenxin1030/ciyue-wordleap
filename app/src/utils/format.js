import dayjs from 'dayjs'

export const todayKey = (d = dayjs()) => d.format('YYYY-MM-DD')

export function pct(n, total) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

export function minutesText(min) {
  if (!min) return '0 分钟'
  if (min < 60) return Math.round(min) + ' 分钟'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m ? h + ' 小时 ' + m + ' 分' : h + ' 小时'
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

export function dateLabel(d = dayjs()) {
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return d.format('M月D日') + ' · ' + week[d.day()]
}

export function mmss(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return m + ':' + s
}

export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
