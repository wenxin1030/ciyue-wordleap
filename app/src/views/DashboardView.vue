<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>{{ greeting() }}，{{ user.displayName }}</h1>
        <p>今天已专注 {{ todayMinutes }} 分钟，距离今日目标还差 {{ remain }} 个单词 · {{ daysToExam }} 天后考试</p>
      </div>
      <div class="row gap8">
        <button class="mode-btn" :class="{ on: user.prefs.smartFirst }" @click="toggleSmart">
          <AppIcon name="sparkles" :size="14" /> 智能推荐{{ user.prefs.smartFirst ? '已开启' : '已关闭' }}
        </button>
        <button class="mode-btn" @click="$router.push('/learn')">
          <AppIcon name="target" :size="14" /> 专注模式
        </button>
      </div>
    </div>

    <section class="hero card">
      <div class="hero-left">
        <RingProgress :value="doneToday" :max="goal" :size="118" :stroke="11">
          <div class="hero-ring">
            <strong class="num">{{ doneToday }}</strong>
            <span class="tiny muted">/ {{ goal }} 词</span>
          </div>
        </RingProgress>
        <div class="hero-copy">
          <div class="row gap8">
            <span class="chip primary">今日记忆任务</span>
            <span v-if="chestReady" class="chip gold"><AppIcon name="gift" :size="11" /> 宝箱可开启</span>
          </div>
          <h2>今天的记忆任务</h2>
          <p class="muted">根据你的遗忘曲线，有 <strong class="hl">{{ due.length }}</strong> 个单词正处于遗忘临界点，优先复习效果最好。</p>
          <div class="hero-chips">
            <span class="chip outline">新词 {{ Math.max(0, Math.min(20, goal - doneToday)) }}</span>
            <span class="chip outline">复习 {{ due.length }}</span>
            <span class="chip outline">听写 1 次</span>
            <span class="chip outline"><AppIcon name="clock" :size="11" /> 约 {{ estMinutes }} 分钟</span>
          </div>
        </div>
      </div>
      <div class="hero-right">
        <el-button type="primary" size="large" round class="hero-btn" @click="startToday">
          <AppIcon name="play" :size="15" /> 继续学习
        </el-button>
        <p class="tiny muted">上次学到：<span class="en">{{ lastWord?.word || '—' }}</span></p>
      </div>
    </section>

    <section class="tasks card card-pad">
      <div class="between">
        <div class="row gap10">
          <h2>今日三任务</h2>
          <span class="tiny muted">完成全部即可开启宝箱</span>
        </div>
        <button class="chest-btn" :class="{ ready: chestReady }" @click="openChest">
          <AppIcon name="gift" :size="15" />
          {{ chestReady ? '开启宝箱' : chestOpened ? '明天再来' : '还差 ' + (3 - study.tasksDone) + ' 项' }}
        </button>
      </div>
      <div class="task-grid">
        <div v-for="(t, i) in study.tasks" :key="t.key" class="task">
          <div class="task-ico" :class="{ done: t.finished }">
            <AppIcon :name="t.finished ? 'check' : ['book', 'refresh', 'headphones'][i]" :size="15" />
          </div>
          <div class="grow">
            <div class="between">
              <span class="task-title">{{ t.title }}</span>
              <span class="tiny num" :class="{ hl: t.finished }">{{ t.done }} / {{ t.target }}</span>
            </div>
            <div class="task-bar"><span :style="{ width: Math.min(100, (t.done / t.target) * 100) + '%' }"></span></div>
          </div>
        </div>
      </div>
    </section>

    <div class="kpi-grid">
      <StatCard label="今日已学" :value="doneToday" unit="词" :foot="'较昨日 ' + deltaToday" delta-icon="arrow-right" icon="check" />
      <StatCard label="累计掌握" :value="known" unit="词" :foot="'本周 +' + weekNew" icon="book" tone="gold" />
      <StatCard label="连续打卡" :value="study.streak" unit="天" :foot="'最高记录 ' + bestStreak + ' 天'" icon="flame" tone="accent" />
      <StatCard label="待复习" :value="due.length" unit="词" :foot="urgent + ' 个即将遗忘'" icon="refresh" :tone="due.length ? 'accent' : 'mint'" />
    </div>

    <div class="main-grid">
      <section class="card card-pad curve-card">
        <SectionHeader title="遗忘曲线与复习干预" sub="按遗忘曲线动态重排，优先复习临界词" link="查看详细报告" @link="$router.push('/stats')" />
        <BaseChart :option="curveOption" height="248px" />
        <div class="curve-foot">
          <div><span class="tiny muted">平均保持率</span><strong class="num">{{ accuracy }}%</strong></div>
          <div><span class="tiny muted">复习依从率</span><strong class="num">{{ reviewRate }}%</strong></div>
          <div><span class="tiny muted">预计 30 天掌握</span><strong class="num">{{ forecast }} 词</strong></div>
        </div>
      </section>

      <section class="card card-pad">
        <SectionHeader title="词书进度" link="全部" @link="$router.push('/books')" />
        <div class="book-list">
          <div v-for="b in bookCards" :key="b.id" class="book-item" @click="$router.push('/books')">
            <span class="book-badge" :style="{ background: gradMap[b.grad] }">{{ b.letter }}</span>
            <div class="grow">
              <div class="between">
                <strong class="book-name">{{ b.short }}</strong>
                <span class="tiny num muted">{{ b.stat.mastered }} / {{ b.stat.total }}</span>
              </div>
              <div class="book-bar"><span :style="{ width: b.stat.pct + '%' }"></span></div>
              <div class="between mt4">
                <span v-if="b.tag" class="chip primary tiny">{{ b.tag }}</span>
                <span v-else class="tiny muted">已掌握 {{ b.stat.pct }}%</span>
                <span class="tiny muted">{{ b.stat.pct }}%</span>
              </div>
            </div>
          </div>
          <div v-if="!bookCards.length" class="empty-tip">还没有加入词书，先去词书库挑一本</div>
        </div>
        <div class="suggest">
          <AppIcon name="sparkles" :size="16" />
          <p class="small">智能建议：{{ suggestion }}</p>
        </div>
      </section>
    </div>

    <div class="main-grid">
      <section class="card card-pad">
        <SectionHeader title="学习足迹" sub="近 26 周 · 颜色越深学习量越大" link="学习统计" @link="$router.push('/stats')" />
        <div class="heat-wrap">
          <div class="heat">
            <span v-for="c in heat" :key="c.date" class="cell" :class="'lv' + c.level" :title="c.date + ' · ' + c.value + ' 词'"></span>
          </div>
        </div>
        <div class="heat-foot">
          <div><span class="tiny muted">本月学习</span><strong class="num">{{ monthWords }} 词</strong></div>
          <div><span class="tiny muted">最长连续</span><strong class="num">{{ bestStreak }} 天</strong></div>
          <div><span class="tiny muted">总时长</span><strong class="num">{{ totalHours }} 小时</strong></div>
          <div class="level-legend tiny muted">少 <i class="cell lv0"></i><i class="cell lv1"></i><i class="cell lv2"></i><i class="cell lv3"></i><i class="cell lv4"></i> 多</div>
        </div>
      </section>

      <section class="card card-pad">
        <SectionHeader title="最近成就" :sub="'已解锁 ' + unlockedCount + ' / 12'" link="全部" @link="$router.push('/achievements')" />
        <div class="ach-grid">
          <div v-for="a in recentAch" :key="a.id" class="ach" @click="$router.push('/achievements')">
            <span class="ach-ico"><AppIcon :name="a.icon" :size="20" /></span>
            <strong>{{ a.name }}</strong>
            <small class="muted">{{ a.desc }}</small>
          </div>
          <div v-if="!recentAch.length" class="empty-tip">完成第一轮学习即可解锁「百词斩」</div>
        </div>
        <div class="challenge" @click="$router.push('/arena')">
          <span class="ch-ico"><AppIcon name="headphones" :size="18" /></span>
          <div class="grow">
            <strong>今日听写挑战</strong>
            <p class="tiny muted">10 个易错词 · 约 3 分钟 · 最高 {{ user.data.arena?.best || 0 }} 分</p>
          </div>
          <el-button round size="small">开始</el-button>
        </div>
      </section>
    </div>

    <el-dialog v-model="chestVisible" width="380px" align-center>
      <div class="prize">
        <div class="prize-ico"><AppIcon name="gift" :size="30" /></div>
        <h2>恭喜获得 {{ prize?.name }}</h2>
        <p class="muted small">已放入你的背包，可在复习页或个人中心使用</p>
        <el-button type="primary" round @click="chestVisible = false">收下</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import AppIcon from '../components/common/AppIcon.vue'
import RingProgress from '../components/common/RingProgress.vue'
import StatCard from '../components/common/StatCard.vue'
import SectionHeader from '../components/common/SectionHeader.vue'
import BaseChart from '../components/common/BaseChart.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { books, bookById, gradMap } from '../mock/books'
import { words } from '../mock/words'
import { achievements } from '../mock/achievements'
import { greeting, todayKey } from '../utils/format'
import { knownCount, streakOf, sumRecords, last14, heatmapWeeks, bookStats, accuracyOf, dueWords } from '../utils/stats'
import { chartColors } from '../utils/chart'

const user = useUserStore()
const study = useStudyStore()
const router = useRouter()

const goal = computed(() => user.prefs.dailyGoal || 40)
const rec = computed(() => study.todayRecord)
const doneToday = computed(() => Math.min(goal.value, (rec.value.newCount || 0) + (rec.value.reviewCount || 0)))
const remain = computed(() => Math.max(0, goal.value - doneToday.value))
const todayMinutes = computed(() => rec.value.minutes || 0)
const due = computed(() => study.dueList)
const known = computed(() => knownCount(user.data))
const chestReady = computed(() => study.chestReady)
const chestOpened = computed(() => user.data.tasks?.date === todayKey() && user.data.tasks?.chestOpened)
const bestStreak = computed(() => {
  const s = new Set(user.data.records.filter(r => r.newCount + r.reviewCount > 0).map(r => r.date))
  return s.size ? Math.max(streakOf(user.data.records), maxRun([...s].sort())) : 0
})
function maxRun(dates) {
  let best = 1, cur = 1
  for (let i = 1; i < dates.length; i++) {
    if (dayjs(dates[i]).diff(dayjs(dates[i - 1]), 'day') === 1) cur++
    else cur = 1
    best = Math.max(best, cur)
  }
  return best
}
const weekNew = computed(() => last14(user.data.records).slice(-7).reduce((a, d) => a + d.newCount + d.reviewCount, 0))
const deltaToday = computed(() => {
  const arr = last14(user.data.records)
  const cur = arr[arr.length - 1], prev = arr[arr.length - 2]
  const c = cur ? cur.newCount + cur.reviewCount : 0
  const p = prev ? prev.newCount + prev.reviewCount : 0
  if (!p) return '+100%'
  return (c >= p ? '+' : '') + Math.round(((c - p) / p) * 100) + '%'
})
const urgent = computed(() => due.value.filter(w => {
  const s = user.data.progress[w.id]
  return s && s.mastery < 60
}).length)
const daysToExam = computed(() => Math.max(0, Math.ceil((new Date(user.profile.examDate) - new Date()) / 86400000)))
const estMinutes = computed(() => Math.max(3, Math.round((20 + due.value.length) * 0.32)))
const lastWord = computed(() => {
  const p = user.data.progress || {}
  const ids = Object.keys(p).sort((a, b) => (p[b].last || 0) - (p[a].last || 0))
  return ids.length ? words.find(w => w.id === ids[0]) : null
})
const heat = computed(() => heatmapWeeks(user.data.records, 26))
const monthWords = computed(() => {
  const start = dayjs().startOf('month')
  return user.data.records.filter(r => dayjs(r.date).isAfter(start.subtract(1, 'day'))).reduce((a, r) => a + r.newCount + r.reviewCount, 0)
})
const totalHours = computed(() => (sumRecords(user.data.records).minutes / 60).toFixed(1))
const accuracy = computed(() => accuracyOf(user.data) || 87)
const reviewRate = computed(() => {
  const t = sumRecords(user.data.records)
  return t.days ? Math.min(99, 84 + t.days % 12) : 96
})
const forecast = computed(() => Math.round(known.value + (known.value ? 654 : 0)))
const suggestion = computed(() => {
  const b = bookCards.value[0]
  if (!b) return '先选一本词书，系统会根据考试倒计时生成计划。'
  return b.short + '已掌握 ' + b.stat.pct + '%，建议今日加入 ' + Math.min(15, remain.value + 8) + ' 个新词，并在睡前复习到期词。'
})
const unlockedCount = computed(() => achievements.filter(a => user.data.achievements[a.id]?.unlocked).length)
const recentAch = computed(() => achievements.filter(a => user.data.achievements[a.id]?.unlocked)
  .sort((a, b) => (user.data.achievements[b.id]?.at || '').localeCompare(user.data.achievements[a.id]?.at || '')).slice(0, 4))
const bookCards = computed(() => user.joinedBooks.map(id => {
  const b = bookById(id)
  return { ...b, stat: bookStats(user.data, b, words) }
}))

const curveOption = computed(() => {
  const c = chartColors()
  void user.prefs.theme
  return {
    grid: { left: 4, right: 8, top: 34, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis', backgroundColor: c.surface, borderColor: c.grid, textStyle: { color: c.ink, fontSize: 12 } },
    legend: { right: 0, top: 0, itemWidth: 8, itemHeight: 8, icon: 'circle', textStyle: { color: c.text, fontSize: 11 } },
    xAxis: {
      type: 'category', boundaryGap: false, data: ['1天', '2天', '4天', '7天', '15天'],
      axisLine: { lineStyle: { color: c.grid } }, axisTick: { show: false }, axisLabel: { color: c.text, fontSize: 10.5 }
    },
    yAxis: {
      type: 'value', min: 20, max: 100, interval: 25,
      splitLine: { lineStyle: { color: c.grid, type: 'dashed' } },
      axisLabel: { color: c.text, fontSize: 10.5, formatter: '{value}%' }
    },
    series: [
      {
        name: '复习后', type: 'line', smooth: true, data: [100, 92, 88, 86, 85],
        symbol: 'circle', symbolSize: 7, lineStyle: { color: c.line, width: 2.4 }, itemStyle: { color: c.line, borderColor: c.surface, borderWidth: 2 },
        areaStyle: { color: c.line, opacity: 0.09 }
      },
      {
        name: '未复习', type: 'line', smooth: true, data: [100, 62, 45, 33, 24],
        symbol: 'circle', symbolSize: 5, lineStyle: { color: c.accent, width: 1.8, type: 'dashed' }, itemStyle: { color: c.accent }
      }
    ]
  }
})

const chestVisible = ref(false)
const prize = ref(null)
function openChest() {
  if (!chestReady.value) {
    return ElMessage.info(chestOpened.value ? '今天已经开过啦，明天完成任务再来' : '还差 ' + (3 - study.tasksDone) + ' 项任务，完成后就能开宝箱')
  }
  prize.value = study.claimChest()
  chestVisible.value = true
}
function toggleSmart() {
  user.setPref('smartFirst', !user.prefs.smartFirst)
  ElMessage.success(user.prefs.smartFirst ? '已开启智能推荐' : '已关闭智能推荐')
}
function startToday() {
  const size = Math.min(20, Math.max(6, remain.value || 10))
  try {
    study.start({ mode: 'recognize', source: 'plan', size })
    router.push('/learn')
  } catch (e) {
    ElMessage.warning(e.message)
  }
}
</script>

<style scoped>
.mode-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px; border-radius: 999px;
  border: 1px solid var(--line); background: var(--surface); color: var(--muted);
  font-size: 12px; cursor: pointer;
}
.mode-btn.on { color: var(--primary); border-color: var(--primary); background: var(--primary-softer); }
.hero {
  display: flex; align-items: center; justify-content: space-between; gap: 26px;
  padding: 22px 26px; background:
    radial-gradient(600px 200px at 92% -30%, var(--primary-soft), transparent 70%),
    var(--surface);
}
.hero-left { display: flex; align-items: center; gap: 22px; min-width: 0; }
.hero-ring { display: flex; flex-direction: column; align-items: center; }
.hero-ring strong { font-size: 26px; }
.hero-copy h2 { font-size: 21px; margin: 8px 0 4px; }
.hero-copy p { font-size: 12.5px; line-height: 1.7; }
.hl { color: var(--accent); }
.hero-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
.hero-right { text-align: center; flex: 0 0 auto; }
.hero-btn { height: 46px; padding: 0 26px; font-size: 14px; }
.hero-right p { margin-top: 8px; }
.tasks { margin-top: 16px; padding-top: 16px; padding-bottom: 16px; }
.task-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 14px; }
.task { display: flex; gap: 10px; align-items: flex-start; }
.task-ico { width: 28px; height: 28px; border-radius: 9px; background: var(--surface-2); color: var(--muted); display: grid; place-items: center; flex: 0 0 auto; }
.task-ico.done { background: var(--primary-soft); color: var(--primary); }
.task-title { font-size: 12.5px; color: var(--ink); }
.task-bar { height: 5px; border-radius: 3px; background: var(--surface-3); margin-top: 7px; overflow: hidden; }
.task-bar span { display: block; height: 100%; border-radius: 3px; background: var(--primary); transition: width .4s; }
.chest-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 14px;
  border-radius: 999px; border: 1px dashed var(--line-strong); background: transparent;
  color: var(--muted); font-size: 11.5px; cursor: pointer;
}
.chest-btn.ready { border-color: var(--gold); color: var(--gold); background: var(--gold-soft); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,151,59,.25); } 50% { box-shadow: 0 0 0 6px rgba(201,151,59,0); } }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 16px; }
.main-grid { display: grid; grid-template-columns: 1.55fr 1fr; gap: 16px; margin-top: 16px; }
.curve-foot { display: flex; gap: 34px; border-top: 1px dashed var(--line); margin-top: 6px; padding-top: 12px; }
.curve-foot div { display: flex; flex-direction: column; }
.curve-foot strong { font-size: 18px; color: var(--ink); }
.book-list { display: flex; flex-direction: column; gap: 13px; }
.book-item { display: flex; gap: 11px; align-items: center; cursor: pointer; }
.book-badge { width: 32px; height: 32px; border-radius: 9px; color: #fff; display: grid; place-items: center; font-family: Georgia, serif; font-size: 15px; flex: 0 0 auto; }
.book-name { font-size: 12.5px; color: var(--ink); }
.book-bar { height: 5px; border-radius: 3px; background: var(--surface-3); margin-top: 6px; overflow: hidden; }
.book-bar span { display: block; height: 100%; background: var(--primary); border-radius: 3px; }
.suggest { display: flex; gap: 9px; margin-top: 16px; padding: 10px 12px; border-radius: 12px; background: var(--primary-softer); color: var(--primary-dark); font-size: 11.5px; line-height: 1.65; }
.suggest :deep(svg) { margin-top: 2px; flex: 0 0 auto; }
.heat-wrap { overflow: hidden; }
@media (max-width: 767px) {
  .heat { grid-template-rows: repeat(7, 8px); grid-auto-columns: 8px; gap: 3px; }
  .level-legend .cell { width: 8px; height: 8px; }
}
.heat { display: grid; grid-template-rows: repeat(7, 12px); grid-auto-flow: column; grid-auto-columns: 12px; gap: 4px; padding: 4px 0 2px; }
.cell { width: 12px; height: 12px; border-radius: 3.5px; background: var(--surface-2); display: inline-block; }
.cell.lv1 { background: var(--primary-softer); }
.cell.lv2 { background: color-mix(in srgb, var(--primary) 40%, var(--surface)); }
.cell.lv3 { background: var(--primary-light); }
.cell.lv4 { background: var(--primary); }
.heat-foot { display: flex; align-items: center; gap: 30px; border-top: 1px dashed var(--line); margin-top: 10px; padding-top: 12px; flex-wrap: wrap; }
.heat-foot div { display: flex; flex-direction: column; }
.heat-foot strong { font-size: 17px; color: var(--ink); }
.level-legend { flex-direction: row !important; align-items: center; gap: 4px; margin-left: auto; }
.level-legend .cell { width: 10px; height: 10px; }
.ach-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.ach { background: var(--surface-2); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 3px; cursor: pointer; }
.ach-ico { width: 34px; height: 34px; border-radius: 10px; background: var(--gold-soft); color: var(--gold); display: grid; place-items: center; margin-bottom: 4px; }
.ach strong { font-size: 12px; color: var(--ink); }
.ach small { font-size: 10px; line-height: 1.4; }
.challenge { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding: 12px; border-radius: 14px; background: var(--accent-soft); cursor: pointer; }
.ch-ico { width: 34px; height: 34px; border-radius: 10px; background: var(--surface); color: var(--accent); display: grid; place-items: center; }
.challenge strong { font-size: 12.5px; color: var(--ink); }
.empty-tip { color: var(--faint); font-size: 12px; padding: 18px 0; text-align: center; }
.prize { text-align: center; padding: 10px 6px 4px; }
.prize-ico { width: 68px; height: 68px; border-radius: 20px; background: var(--gold-soft); color: var(--gold); display: grid; place-items: center; margin: 0 auto 14px; }
.prize h2 { font-size: 19px; margin-bottom: 6px; }
.prize .el-button { margin-top: 18px; width: 140px; }

@media (max-width: 1080px) {
  .main-grid { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .hero { flex-direction: column; align-items: flex-start; }
  .hero-right { align-self: stretch; display: flex; align-items: center; justify-content: space-between; }
}
@media (max-width: 640px) {
  .task-grid { grid-template-columns: 1fr; gap: 12px; }
  .hero { padding: 18px; }
  .hero-left { flex-direction: column; align-items: flex-start; }
  .curve-foot { gap: 18px; }
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .ach-grid { grid-template-columns: 1fr 1fr; }
}
</style>
