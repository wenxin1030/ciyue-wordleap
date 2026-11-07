<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>学习统计</h1>
        <p>数据截至 {{ dateText }} · 已连续学习 {{ study.streak }} 天，所有统计来自真实学习记录</p>
      </div>
      <div class="row gap10">
        <el-radio-group v-model="range">
          <el-radio-button value="week">本周</el-radio-button>
          <el-radio-button value="month">本月</el-radio-button>
          <el-radio-button value="all">全部</el-radio-button>
        </el-radio-group>
        <el-button round @click="exportReport"><AppIcon name="download" :size="14" /> 导出报告</el-button>
      </div>
    </div>

    <div class="kpi-grid">
      <StatCard label="学习时长" :value="hours" unit="小时" :foot="'日均 ' + avgMinutes + ' 分钟'" icon="clock" />
      <StatCard label="学习词次" :value="wordCount" unit="次" :foot="'新词 ' + newSum + ' · 复习 ' + reviewSum" icon="book" tone="gold" />
      <StatCard label="平均正确率" :value="accuracy" unit="%" :foot="'共作答 ' + totalAnswers + ' 次'" icon="target" />
      <StatCard label="记忆保持率" :value="retention" unit="%" :foot="'基于 SRS 可提取度估算'" icon="refresh" tone="accent" />
    </div>

    <div class="grid-main">
      <section class="card card-pad">
        <SectionHeader title="学习趋势" sub="每日新学与复习词数" />
        <BaseChart :option="trendOption" height="240px" />
      </section>
      <section class="card card-pad">
        <SectionHeader title="词汇掌握分布" :sub="'基于 ' + knownCountVal + ' 个已学单词'" />
        <BaseChart :option="donutOption" height="200px" />
        <div class="legend">
          <div v-for="d in masteryDist" :key="d.name" class="lg-row">
            <span class="dot" :style="{ background: d.color }"></span>
            <span class="grow small">{{ d.name }}</span>
            <span class="small num">{{ d.value }}</span>
            <span class="tiny muted num">{{ d.pct }}%</span>
          </div>
        </div>
      </section>
    </div>

    <div class="grid-main">
      <section class="card card-pad">
        <SectionHeader title="学习热力图" :sub="'近 26 周 · ' + activeDays + ' / 182 天有记录'" />
        <div class="heat">
          <span v-for="c in heat" :key="c.date" class="cell" :class="'lv' + c.level" :title="c.date + ' · ' + c.value + ' 词'"></span>
        </div>
        <div class="heat-foot">
          <div><span class="tiny muted">本月学习</span><strong class="num">{{ monthWords }} 词</strong></div>
          <div><span class="tiny muted">最长连续</span><strong class="num">{{ bestStreak }} 天</strong></div>
          <div><span class="tiny muted">日均时长</span><strong class="num">{{ avgMinutes }} 分钟</strong></div>
          <div class="level-legend tiny muted">少 <i class="cell lv0"></i><i class="cell lv1"></i><i class="cell lv2"></i><i class="cell lv3"></i><i class="cell lv4"></i> 多</div>
        </div>
      </section>

      <section class="card card-pad">
        <SectionHeader title="学习节奏" sub="按星期统计学习量" />
        <div class="weekday">
          <div v-for="(d, i) in weekdayData" :key="i" class="wd-row">
            <span class="tiny muted wd-label">{{ d.label }}</span>
            <div class="wd-bar"><span :style="{ width: d.pct + '%' }"></span></div>
            <span class="tiny num muted wd-val">{{ d.value }}</span>
          </div>
        </div>
        <div class="insight">
          <AppIcon name="sparkles" :size="15" />
          <p class="tiny">你的高峰在 <strong>{{ bestWeekday }}</strong>，低谷在 <strong>{{ worstWeekday }}</strong>。低谷日可以只完成 10 个复习词，保持连续比一次学很多更重要。</p>
        </div>
      </section>
    </div>

    <section class="card card-pad mt16">
      <SectionHeader title="薄弱词汇" sub="错误次数最多，需要重点突破" link="一键加入复习计划" @link="addWeakToReview" />
      <el-table v-if="weakRows.length" :data="weakRows" @row-click="row => ui.openWord(row.word)">
        <el-table-column label="单词" min-width="160">
          <template #default="{ row }"><span class="en cell-en">{{ row.word.word }}</span></template>
        </el-table-column>
        <el-table-column label="释义" min-width="200">
          <template #default="{ row }"><span class="small">{{ row.word.cn }}</span></template>
        </el-table-column>
        <el-table-column label="错误次数" width="100" align="center">
          <template #default="{ row }"><span class="err num">{{ row.wrong }}</span></template>
        </el-table-column>
        <el-table-column label="最近复习" width="110">
          <template #default="{ row }"><span class="tiny muted">{{ row.recent }}</span></template>
        </el-table-column>
        <el-table-column label="掌握度" width="160">
          <template #default="{ row }">
            <div class="m-cell">
              <div class="m-bar"><span :style="{ width: row.mastery + '%', background: row.color }"></span></div>
              <span class="tiny num">{{ row.mastery }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="right">
          <template #default="{ row }">
            <el-button size="small" round @click.stop="reviewWord(row)">复习</el-button>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else title="暂时没有薄弱词" desc="继续学习，系统会自动标记错误次数较多的单词。" icon="target" />
    </section>

    <!-- 导出学习报告：下载、复制、系统分享与打印 PDF -->
    <el-dialog
      v-model="reportVisible"
      title="导出学习报告"
      width="min(480px, calc(100vw - 32px))"
      align-center
      append-to-body
    >
      <div class="rp-preview">
        <div class="rp-head">
          <span class="rp-ico"><AppIcon name="chart" :size="20" /></span>
          <div class="grow">
            <strong>词跃 · 学习报告</strong>
            <p class="tiny muted">{{ rangeText }} · 数据截至 {{ dateText }}</p>
          </div>
        </div>
        <div class="rp-stats">
          <div><strong class="num">{{ hours }}</strong><span>小时</span></div>
          <div><strong class="num">{{ wordCount }}</strong><span>学习词次</span></div>
          <div><strong class="num">{{ accuracy }}%</strong><span>正确率</span></div>
          <div><strong class="num">{{ knownCountVal }}</strong><span>已学单词</span></div>
        </div>
      </div>

      <p class="export-label">选择导出方式</p>
      <div class="export-list">
        <button type="button" class="export-row" @click="downloadReport('md')">
          <span class="er-ico"><AppIcon name="download" :size="18" /></span>
          <span class="er-main"><strong>下载 Markdown 文件</strong><em>适合放进课程报告、GitHub 或笔记软件</em></span>
          <AppIcon name="chevron-right" :size="15" />
        </button>
        <button type="button" class="export-row" @click="downloadReport('txt')">
          <span class="er-ico"><AppIcon name="book-open" :size="18" /></span>
          <span class="er-main"><strong>下载纯文本文件</strong><em>任何设备都能打开，方便直接发送</em></span>
          <AppIcon name="chevron-right" :size="15" />
        </button>
        <button type="button" class="export-row" @click="copyReport">
          <span class="er-ico"><AppIcon name="copy" :size="18" /></span>
          <span class="er-main"><strong>复制报告文本</strong><em>粘贴到微信、QQ、邮件或文档里转发</em></span>
          <AppIcon name="chevron-right" :size="15" />
        </button>
        <button type="button" class="export-row" @click="shareReport">
          <span class="er-ico"><AppIcon name="share" :size="18" /></span>
          <span class="er-main"><strong>分享到其他应用</strong><em>手机端打开系统分享面板，选择微信等应用</em></span>
          <AppIcon name="chevron-right" :size="15" />
        </button>
      </div>

      <el-button round class="print-btn" @click="printReport">
        <AppIcon name="printer" :size="14" /> 打印 / 另存为 PDF
      </el-button>
      <p class="export-tip">报告只包含学习统计与薄弱词，不含密码等隐私信息。下载后可通过微信、QQ 或邮件发送。</p>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import AppIcon from '../components/common/AppIcon.vue'
import StatCard from '../components/common/StatCard.vue'
import SectionHeader from '../components/common/SectionHeader.vue'
import EmptyState from '../components/common/EmptyState.vue'
import BaseChart from '../components/common/BaseChart.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { useUiStore } from '../stores/ui'
import { words } from '../mock/words'
import { chartColors } from '../utils/chart'
import { dateLabel, todayKey } from '../utils/format'
import { retrievability } from '../utils/srs'
import { sumRecords, heatmapWeeks, knownCount, masteredCount } from '../utils/stats'

const user = useUserStore()
const study = useStudyStore()
const ui = useUiStore()
const router = useRouter()

const range = ref('week')
const dateText = dateLabel()
const reportVisible = ref(false)
const rangeText = computed(() => range.value === 'week' ? '本周' : range.value === 'month' ? '本月' : '全部')

const records = computed(() => {
  const all = user.data.records || []
  if (range.value === 'all') return all
  const days = range.value === 'week' ? 7 : 30
  return all.filter(r => dayjs(r.date).isAfter(dayjs().subtract(days, 'day').startOf('day')))
})
const sum = computed(() => sumRecords(records.value))
const hours = computed(() => (sum.value.minutes / 60).toFixed(1))
const wordCount = computed(() => sum.value.newCount + sum.value.reviewCount)
const newSum = computed(() => sum.value.newCount)
const reviewSum = computed(() => sum.value.reviewCount)
const totalAnswers = computed(() => sum.value.total)
const accuracy = computed(() => sum.value.total ? Math.round((sum.value.correct / sum.value.total) * 100) : 0)
const avgMinutes = computed(() => {
  const days = new Set(records.value.filter(r => r.minutes).map(r => r.date)).size || 1
  return Math.round(sum.value.minutes / days)
})
const retention = computed(() => {
  const list = Object.values(user.data.progress || {}).filter(s => s.seen > 0)
  if (!list.length) return 0
  return Math.round(list.reduce((a, s) => a + retrievability(s), 0) / list.length * 100)
})
const knownCountVal = computed(() => knownCount(user.data))
const activeDays = computed(() => new Set(user.data.records.filter(r => r.newCount + r.reviewCount > 0).map(r => r.date)).size)
const monthWords = computed(() => user.data.records.filter(r => dayjs(r.date).isAfter(dayjs().startOf('month').subtract(1, 'day'))).reduce((a, r) => a + r.newCount + r.reviewCount, 0))
const bestStreak = computed(() => {
  const dates = [...new Set(user.data.records.filter(r => r.newCount + r.reviewCount > 0).map(r => r.date))].sort()
  let best = 0, cur = 1
  dates.forEach((d, i) => {
    if (i > 0 && dayjs(d).diff(dayjs(dates[i - 1]), 'day') === 1) cur++
    else cur = 1
    best = Math.max(best, cur)
  })
  return best
})

const masteryDist = computed(() => {
  const list = Object.values(user.data.progress || {}).filter(s => s.seen > 0)
  const buckets = [
    { name: '熟练', min: 85, color: '#1F6F5C' },
    { name: '认识', min: 60, color: '#3E9B82' },
    { name: '模糊', min: 30, color: '#C9A23B' },
    { name: '生疏', min: 0, color: '#D5714F' }
  ].map(b => ({ ...b, value: 0 }))
  list.forEach(s => {
    const b = buckets.find(x => s.mastery >= x.min) || buckets[3]
    b.value++
  })
  const total = list.length || 1
  return buckets.map(b => ({ ...b, pct: Math.round(b.value / total * 100) }))
})

const trendOption = computed(() => {
  const c = chartColors()
  void user.prefs.theme
  let labels = [], nArr = [], rArr = []
  if (range.value === 'all') {
    const map = new Map()
    user.data.records.forEach(r => {
      const k = dayjs(r.date).format('YYYY-MM')
      const e = map.get(k) || { n: 0, r: 0 }
      e.n += r.newCount || 0
      e.r += r.reviewCount || 0
      map.set(k, e)
    })
    const keys = [...map.keys()].sort().slice(-8)
    labels = keys.map(k => k.slice(5) + '月')
    nArr = keys.map(k => map.get(k).n)
    rArr = keys.map(k => map.get(k).r)
  } else {
    const days = range.value === 'week' ? 14 : 30
    const map = new Map(user.data.records.map(r => [r.date, r]))
    for (let i = days - 1; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day')
      const r = map.get(d.format('YYYY-MM-DD'))
      labels.push(d.format('M/D'))
      nArr.push(r?.newCount || 0)
      rArr.push(r?.reviewCount || 0)
    }
  }
  return {
    grid: { left: 4, right: 10, top: 30, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis', backgroundColor: c.surface, borderColor: c.grid, textStyle: { color: c.ink, fontSize: 11 } },
    legend: { right: 0, top: 0, itemWidth: 8, itemHeight: 8, icon: 'circle', textStyle: { color: c.text, fontSize: 10.5 } },
    xAxis: { type: 'category', boundaryGap: false, data: labels, axisLine: { lineStyle: { color: c.grid } }, axisTick: { show: false }, axisLabel: { color: c.text, fontSize: 9.5, interval: range.value === 'month' ? 4 : 1 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: c.grid, type: 'dashed' } }, axisLabel: { color: c.text, fontSize: 10 } },
    series: [
      { name: '新学', type: 'line', smooth: true, data: nArr, symbol: 'none', lineStyle: { color: c.line, width: 2.2 }, areaStyle: { color: c.line, opacity: 0.10 } },
      { name: '复习', type: 'line', smooth: true, data: rArr, symbol: 'none', lineStyle: { color: c.accent, width: 1.6, type: 'dashed' } }
    ]
  }
})

const donutOption = computed(() => {
  const c = chartColors()
  void user.prefs.theme
  return {
    series: [{
      type: 'pie', radius: ['58%', '84%'], center: ['50%', '50%'], avoidLabelOverlap: true,
      label: { show: true, position: 'center', formatter: '{total|' + knownCountVal.value + '}\n{sub|已学单词}', rich: { total: { fontSize: 22, fontWeight: 700, color: c.ink }, sub: { fontSize: 10, color: c.text, padding: [4, 0, 0, 0] } } },
      labelLine: { show: false }, itemStyle: { borderColor: c.surface, borderWidth: 3 },
      data: masteryDist.value.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } }))
    }]
  }
})

const weekdayData = computed(() => {
  const buckets = [0, 0, 0, 0, 0, 0, 0]
  user.data.records.forEach(r => { buckets[dayjs(r.date).day()] += r.newCount + r.reviewCount })
  const max = Math.max(...buckets) || 1
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map(i => ({ label: names[i], value: buckets[i], pct: buckets[i] ? Math.max(6, buckets[i] / max * 100) : 0 }))
})
const bestWeekday = computed(() => weekdayData.value.slice().sort((a, b) => b.value - a.value)[0]?.label || '—')
const worstWeekday = computed(() => weekdayData.value.slice().sort((a, b) => a.value - b.value)[0]?.label || '—')

const heat = computed(() => heatmapWeeks(user.data.records, 26))
const weakRows = computed(() => {
  const p = user.data.progress || {}
  return words.filter(w => p[w.id]?.wrong > 0)
    .sort((a, b) => p[b.id].wrong - p[a.id].wrong)
    .slice(0, 6)
    .map(w => {
      const s = p[w.id]
      return {
        word: w,
        wrong: s.wrong,
        mastery: Math.round(s.mastery),
        recent: s.last ? dayjs(s.last).format('M月D日') : '—',
        color: s.mastery >= 60 ? 'var(--primary)' : s.mastery >= 30 ? 'var(--gold)' : 'var(--accent)'
      }
    })
})

function reviewWord(row) {
  try {
    study.start({ mode: 'spell', source: 'wrong', size: 5 })
    study.session.queue = [row.word.id, ...study.session.queue.filter(x => x !== row.word.id)]
    study.session.idx = 0
    router.push('/learn')
  } catch (e) { ElMessage.warning(e.message) }
}
function addWeakToReview() {
  if (!weakRows.value.length) return ElMessage.info('暂时没有薄弱词')
  router.push('/review')
}
function reportLines() {
  return [
    '# 词跃 WordLeap 学习报告',
    '生成时间：' + dayjs().format('YYYY-MM-DD HH:mm'),
    '统计范围：' + rangeText.value,
    '',
    '- 学习时长：' + hours.value + ' 小时',
    '- 学习词次：' + wordCount.value + '（新词 ' + newSum.value + '，复习 ' + reviewSum.value + '）',
    '- 平均正确率：' + accuracy.value + '%',
    '- 记忆保持率：' + retention.value + '%',
    '- 连续学习：' + study.streak + ' 天',
    '- 已学单词：' + knownCountVal.value + '，其中掌握 ' + masteredCount(user.data) + ' 词',
    '',
    '## 薄弱词',
    ...weakRows.value.map(w => '- ' + w.word.word + '（错 ' + w.wrong + ' 次，掌握度 ' + w.mastery + '%）')
  ]
}

function exportReport() {
  reportVisible.value = true
}

function downloadReport(format) {
  const isMd = format === 'md'
  const blob = new Blob([reportLines().join('\n')], { type: isMd ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '词跃-学习报告-' + todayKey() + (isMd ? '.md' : '.txt')
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  ElMessage.success('已下载 ' + (isMd ? 'Markdown' : 'TXT') + ' 文件')
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (e) { /* 继续尝试兼容方案 */ }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    return document.execCommand('copy')
  } catch (e) {
    return false
  } finally {
    ta.remove()
  }
}

async function copyReport() {
  const ok = await copyText(reportLines().join('\n'))
  if (ok) ElMessage.success('报告已复制，可粘贴到微信 / QQ / 邮件')
  else ElMessage.warning('浏览器未允许复制，请手动选择文本')
}

async function shareReport() {
  const text = reportLines().join('\n')
  if (navigator.share) {
    try {
      await navigator.share({ title: '词跃 WordLeap 学习报告', text })
      return
    } catch (e) {
      if (e && e.name === 'AbortError') return
    }
  }
  const ok = await copyText(text)
  if (ok) ElMessage.success('当前浏览器不支持直接分享，已复制报告，可粘贴转发')
  else ElMessage.warning('当前浏览器不支持分享，请下载文件后转发')
}

function escHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))
}

function printReport() {
  const rows = weakRows.value.map(w => '<tr><td>' + escHtml(w.word.word) + '</td><td>' + escHtml(w.word.cn) + '</td><td>' + w.wrong + '</td><td>' + w.mastery + '%</td></tr>').join('')
  const weak = weakRows.value.length
    ? '<table><thead><tr><th>单词</th><th>释义</th><th>错误次数</th><th>掌握度</th></tr></thead><tbody>' + rows + '</tbody></table>'
    : '<p>暂无薄弱词，继续保持。</p>'
  const html = [
    '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>词跃学习报告</title><style>',
    'body{font-family:"Segoe UI","Microsoft YaHei",sans-serif;color:#16302A;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.7}',
    'h1{font-size:24px;margin-bottom:4px}h2{font-size:16px;margin-top:28px;padding-top:18px;border-top:1px solid #E7E0D2}',
    '.meta{padding:14px 18px;margin:20px 0;background:#F5F1E7;border-radius:12px}',
    '.meta div{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #E7E0D2;font-size:13px}',
    '.meta div:last-child{border:0}.meta strong{font-variant-numeric:tabular-nums}',
    'table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px 6px;text-align:left;border-bottom:1px solid #E7E0D2}th{color:#6E7C74;font-weight:600}',
    '.foot{margin-top:32px;font-size:11px;color:#6E7C74}',
    '@media print{body{margin:0;max-width:none}}',
    '</style></head><body>',
    '<h1>词跃 WordLeap · 学习报告</h1>',
    '<p style="font-size:12px;color:#6E7C74">生成时间：' + dayjs().format('YYYY-MM-DD HH:mm') + ' · ' + rangeText.value + '</p>',
    '<div class="meta">',
    '<div><span>学习时长</span><strong>' + escHtml(hours.value) + ' 小时</strong></div>',
    '<div><span>学习词次</span><strong>' + escHtml(wordCount.value) + ' 次</strong></div>',
    '<div><span>平均正确率</span><strong>' + escHtml(accuracy.value) + '%</strong></div>',
    '<div><span>记忆保持率</span><strong>' + escHtml(retention.value) + '%</strong></div>',
    '<div><span>连续学习</span><strong>' + escHtml(study.streak) + ' 天</strong></div>',
    '<div><span>已学单词</span><strong>' + escHtml(knownCountVal.value) + ' / 掌握 ' + escHtml(masteredCount(user.data)) + '</strong></div>',
    '</div>',
    '<h2>薄弱词</h2>',
    weak,
    '<p class="foot">数据来自本机学习记录，所有资料仅保存在浏览器本地。词跃 WordLeap · 课程设计作品</p>',
    '</body></html>'
  ].join('')
  const win = window.open('', '_blank')
  if (!win) {
    ElMessage.warning('浏览器拦截了新窗口，请允许弹窗后再试')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 350)
  reportVisible.value = false
}
</script>

<style scoped>
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.grid-main { display: grid; grid-template-columns: 1.55fr 1fr; gap: 16px; margin-top: 16px; }
.legend { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
.lg-row { display: flex; align-items: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 3px; }
.heat { display: grid; grid-template-rows: repeat(7, 13px); grid-auto-flow: column; grid-auto-columns: 13px; gap: 4px; padding: 4px 0; overflow: hidden; }
@media (max-width: 767px) {
  .heat { grid-template-rows: repeat(7, 8px); grid-auto-columns: 8px; gap: 3px; }
  .level-legend .cell { width: 8px; height: 8px; }
}
.cell { width: 13px; height: 13px; border-radius: 3.5px; background: var(--surface-2); display: inline-block; }
.cell.lv1 { background: var(--primary-softer); }
.cell.lv2 { background: color-mix(in srgb, var(--primary) 40%, var(--surface)); }
.cell.lv3 { background: var(--primary-light); }
.cell.lv4 { background: var(--primary); }
.heat-foot { display: flex; align-items: center; gap: 28px; border-top: 1px dashed var(--line); margin-top: 10px; padding-top: 12px; flex-wrap: wrap; }
.heat-foot div { display: flex; flex-direction: column; }
.heat-foot strong { font-size: 17px; color: var(--ink); }
.level-legend { flex-direction: row !important; align-items: center; gap: 4px; margin-left: auto; }
.level-legend .cell { width: 10px; height: 10px; }
.weekday { display: flex; flex-direction: column; gap: 9px; margin-top: 4px; }
.wd-row { display: flex; align-items: center; gap: 10px; }
.wd-label { width: 30px; }
.wd-bar { flex: 1; height: 6px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.wd-bar span { display: block; height: 100%; background: var(--primary); border-radius: 3px; }
.wd-val { width: 28px; text-align: right; }
.insight { display: flex; gap: 8px; margin-top: 16px; padding: 10px 12px; border-radius: 11px; background: var(--accent-soft); color: var(--accent); line-height: 1.6; }
.insight :deep(svg) { flex: 0 0 auto; margin-top: 2px; }
.insight strong { color: var(--accent); }
.mt16 { margin-top: 16px; }
.cell-en { font-family: Georgia, serif; font-size: 16px; font-weight: 600; }
.err { color: var(--accent); background: var(--accent-soft); border-radius: 999px; padding: 2px 9px; font-size: 12px; }
.m-cell { display: flex; align-items: center; gap: 8px; }
.m-bar { flex: 1; height: 5px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.m-bar span { display: block; height: 100%; border-radius: 3px; }

/* 导出报告弹窗 */
.rp-preview { padding: 14px 16px; background: var(--surface-2); border: 1px solid var(--line); border-radius: 16px; }
.rp-head { display: flex; align-items: center; gap: 10px; }
.rp-ico { display: grid; place-items: center; flex: 0 0 auto; width: 38px; height: 38px; border-radius: 12px; background: var(--primary-soft); color: var(--primary); }
.rp-head strong { font-size: 13.5px; }
.rp-head p { margin-top: 2px; }
.rp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line-strong); }
.rp-stats div { display: flex; flex-direction: column; }
.rp-stats strong { font-size: 18px; color: var(--ink); line-height: 1.2; }
.rp-stats span { font-size: 10.5px; color: var(--muted); }
.export-label { margin: 14px 0 8px; font-size: 11.5px; font-weight: 600; color: var(--muted); }
.export-list { display: flex; flex-direction: column; gap: 6px; }
.export-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 11px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); color: var(--ink); text-align: left; cursor: pointer; transition: border-color .16s, background .16s; }
.export-row:hover { border-color: var(--primary); background: var(--primary-softer); }
.er-ico { display: grid; place-items: center; flex: 0 0 auto; width: 30px; height: 30px; border-radius: 9px; background: var(--primary-soft); color: var(--primary); }
.er-main { display: flex; flex: 1; flex-direction: column; gap: 1px; min-width: 0; }
.er-main strong { font-size: 12.5px; }
.er-main em { font-size: 10.5px; font-style: normal; color: var(--muted); }
.print-btn { width: 100%; margin-top: 10px; }
.export-tip { margin-top: 10px; font-size: 10.5px; line-height: 1.55; color: var(--faint); }
@media (max-width: 560px) {
  .rp-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 1000px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .grid-main { grid-template-columns: 1fr; }
}
</style>
