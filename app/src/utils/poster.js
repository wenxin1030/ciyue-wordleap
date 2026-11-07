import dayjs from 'dayjs'

const SANS = '"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'

function palette() {
  const night = document.documentElement.getAttribute('data-theme') === 'night'
  if (night) {
    return {
      bg: '#080D19', hero1: '#0C1526', hero2: '#17294A',
      card: '#111A2B', line: '#26344E', ink: '#EEF2FF', muted: '#9AA8C7',
      primary: '#7E9BFF', mint: '#59D6B8', gold: '#F2C879',
      soft: 'rgba(126,155,255,.09)', softLine: 'rgba(126,155,255,.22)',
      chipBg: 'rgba(126,155,255,.18)', chipText: '#D7E2FF',
      logoBg: 'rgba(126,155,255,.2)', logoText: '#FFFFFF',
      heroText: '#F4F7FF', heroSub: 'rgba(230,238,255,.7)',
      shadow: 'rgba(0,0,0,.45)', deco: 'rgba(126,155,255,.34)'
    }
  }
  return {
    bg: '#F5F1E7', hero1: '#123B32', hero2: '#1F6F5C',
    card: '#FFFDF8', line: '#E7E0D2', ink: '#16302A', muted: '#6E7C74',
    primary: '#1F6F5C', mint: '#3E9B82', gold: '#C9973B',
    soft: '#EAF3EE', softLine: '#D6E6DD',
    chipBg: 'rgba(255,255,255,.16)', chipText: '#EAF6F1',
    logoBg: 'rgba(255,255,255,.17)', logoText: '#FFFFFF',
    heroText: '#FFFFFF', heroSub: 'rgba(255,255,255,.72)',
    shadow: 'rgba(20,48,42,.18)', deco: 'rgba(255,255,255,.24)'
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function font(ctx, weight, size, family = SANS) {
  ctx.font = weight + ' ' + size + 'px ' + family
}

function drawPoster(data) {
  const p = palette()
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  ctx.textBaseline = 'middle'

  // 纸张底色
  ctx.fillStyle = p.bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 顶部墨绿 / 极光区
  const grad = ctx.createLinearGradient(0, 0, 860, 680)
  grad.addColorStop(0, p.hero1)
  grad.addColorStop(1, p.hero2)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1080, 640)

  // 装饰圆
  ctx.save()
  ctx.fillStyle = p.deco
  ctx.globalAlpha = 0.55
  ctx.beginPath(); ctx.arc(930, 70, 230, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 0.3
  ctx.beginPath(); ctx.arc(1045, 455, 120, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 0.18
  ctx.beginPath(); ctx.arc(720, 620, 160, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // 品牌
  roundRect(ctx, 72, 68, 82, 82, 24)
  ctx.fillStyle = p.logoBg
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.22)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = p.logoText
  font(ctx, 700, 40, SERIF)
  ctx.textAlign = 'center'
  ctx.fillText('Aa', 113, 112)
  ctx.textAlign = 'left'

  ctx.fillStyle = p.heroText
  font(ctx, 700, 34)
  ctx.fillText('词跃', 182, 94)
  ctx.globalAlpha = 0.68
  font(ctx, 600, 13)
  ctx.fillText('W O R D L E A P', 183, 124)
  ctx.globalAlpha = 1

  // 顶部标签
  const eyebrow = data.eyebrow || '学习战报'
  font(ctx, 600, 22)
  const chipW = Math.min(600, ctx.measureText(eyebrow).width + 54)
  roundRect(ctx, 72, 210, chipW, 46, 23)
  ctx.fillStyle = p.chipBg
  ctx.fill()
  ctx.fillStyle = p.chipText
  ctx.fillText(eyebrow, 99, 234)

  // 主标题
  let titleSize = 58
  font(ctx, 700, titleSize)
  while (ctx.measureText(data.title).width > 920 && titleSize > 36) {
    titleSize -= 2
    font(ctx, 700, titleSize)
  }
  ctx.fillStyle = p.heroText
  ctx.fillText(data.title, 72, 325)

  // 副标题
  ctx.fillStyle = p.heroSub
  font(ctx, 400, 23)
  ctx.fillText(data.subtitle || '让每个单词，都在该忘记之前重逢', 72, 398)

  // 数据卡片
  ctx.save()
  ctx.shadowColor = p.shadow
  ctx.shadowBlur = 34
  ctx.shadowOffsetY = 14
  roundRect(ctx, 60, 470, 960, 300, 32)
  ctx.fillStyle = p.card
  ctx.fill()
  ctx.restore()
  roundRect(ctx, 60, 470, 960, 300, 32)
  ctx.strokeStyle = p.line
  ctx.lineWidth = 2
  ctx.stroke()

  const stats = (data.stats || []).slice(0, 3)
  const colW = 960 / 3
  stats.forEach((s, i) => {
    const cx = 60 + colW * i + colW / 2
    if (i > 0) {
      ctx.beginPath()
      ctx.moveTo(60 + colW * i, 522)
      ctx.lineTo(60 + colW * i, 718)
      ctx.strokeStyle = p.line
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.textAlign = 'center'
    ctx.fillStyle = i === 2 ? p.primary : p.ink
    font(ctx, 700, 60)
    ctx.fillText(String(s.value), cx, 590)
    ctx.fillStyle = p.muted
    font(ctx, 400, 21)
    ctx.fillText(s.label, cx, 648)
  })
  ctx.textAlign = 'left'

  // 卡片下方信息
  ctx.fillStyle = p.ink
  font(ctx, 700, 26)
  ctx.fillText(data.noteTitle || '今天也向前一点点', 72, 840)
  ctx.fillStyle = p.muted
  font(ctx, 400, 21)
  ctx.fillText(data.note || '每一次复习，都在把单词留得更久一点。', 72, 878)

  ctx.strokeStyle = p.line
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(72, 918); ctx.lineTo(1008, 918); ctx.stroke()

  ctx.fillStyle = p.muted
  font(ctx, 400, 20)
  ctx.fillText(data.footerLeft || dayjs().format('YYYY.MM.DD'), 72, 954)
  const right = data.footerRight || ''
  if (right) {
    ctx.textAlign = 'right'
    ctx.fillStyle = p.primary
    font(ctx, 600, 20)
    ctx.fillText(right, 1008, 954)
    ctx.textAlign = 'left'
  }

  // 底部行动区
  roundRect(ctx, 60, 1002, 960, 172, 26)
  ctx.fillStyle = p.soft
  ctx.fill()
  roundRect(ctx, 60, 1002, 960, 172, 26)
  ctx.strokeStyle = p.softLine
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = p.gold
  font(ctx, 700, 24)
  ctx.fillText('✦', 92, 1056)
  ctx.fillStyle = p.ink
  font(ctx, 700, 29)
  ctx.fillText(data.ctaTitle || '把今天的记忆，交给明天的复习', 126, 1056)
  ctx.fillStyle = p.muted
  font(ctx, 400, 21)
  ctx.fillText(data.ctaSub || '系统会按遗忘曲线安排下一次复习，让记住变得更轻松。', 92, 1111)

  // 底部品牌
  ctx.globalAlpha = 0.78
  ctx.textAlign = 'center'
  ctx.fillStyle = p.muted
  font(ctx, 400, 19)
  ctx.fillText('词跃 WordLeap · 让每个单词，都在该忘记之前重逢', 540, 1262)
  ctx.globalAlpha = 1
  ctx.textAlign = 'left'

  return canvas
}

function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',')
  const mime = /data:([^;]+)/.exec(arr[0])[1]
  const bin = atob(arr[1])
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function fileName(data) {
  return data.filename || ('词跃-战报-' + dayjs().format('YYYYMMDD') + '.png')
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) { /* fall through */ }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch (e) { ok = false }
  document.body.removeChild(ta)
  return ok
}

export function downloadPoster(data) {
  const blob = dataUrlToBlob(drawPoster(data).toDataURL('image/png'))
  const name = fileName(data)
  downloadBlob(blob, name)
  return name
}

export async function sharePoster(data, text) {
  // 同步生成 PNG，尽量保留本次点击的 transient activation
  const blob = dataUrlToBlob(drawPoster(data).toDataURL('image/png'))
  const name = fileName(data)
  const file = new File([blob], name, { type: 'image/png' })
  const title = data.shareTitle || '词跃 WordLeap 学习战报'

  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, text, files: [file] })
      return 'shared'
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled'
  }

  try {
    if (navigator.share) {
      await navigator.share({ title, text })
      return 'shared-text'
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled'
  }

  downloadBlob(blob, name)
  const copied = await copyText(text)
  return copied ? 'downloaded-copied' : 'downloaded'
}
