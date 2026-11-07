<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>智能复习</h1>
        <p>按遗忘曲线排序：越接近遗忘临界点的词越靠前。系统已为你排好今天的复习队列。</p>
      </div>
      <div class="row gap8">
        <el-button round @click="settingsVisible = true"><AppIcon name="settings" :size="14" /> 复习设置</el-button>
        <el-button type="primary" round :disabled="!due.length" @click="startReview"><AppIcon name="refresh" :size="14" /> 开始复习</el-button>
      </div>
    </div>

    <div class="review-hero card">
      <div class="rh-left">
        <RingProgress :value="doneReview" :max="Math.max(10, due.length)" :size="106" :stroke="10">
          <strong class="num">{{ due.length }}</strong>
          <span class="tiny muted">待复习</span>
        </RingProgress>
        <div>
          <h2>{{ due.length ? '有 ' + due.length + ' 个词正在等你' : '今天没有到期词' }}</h2>
          <p class="muted small">其中 {{ urgent.length }} 个掌握度低于 60%，最容易在 24 小时内遗忘。</p>
          <div class="row gap6 wrap mt8">
            <span class="chip primary">保持率优先</span>
            <span class="chip">约 {{ Math.max(4, Math.round(due.length * 0.3)) }} 分钟</span>
            <span class="chip">到期词 {{ due.length }}</span>
          </div>
        </div>
      </div>
      <div class="rh-right">
        <div class="retention">
          <span class="tiny muted">预计复习后保持率</span>
          <strong class="num">{{ due.length ? 94 : 100 }}%</strong>
          <span class="tiny muted">较不复习提升 +{{ due.length ? 41 : 0 }}%</span>
        </div>
      </div>
    </div>

    <div class="forecast-grid">
      <section class="card card-pad">
        <SectionHeader title="未来 7 天到期预测" sub="提前安排，避免某天突然堆积" />
        <BaseChart :option="forecastOption" height="190px" />
      </section>
      <section class="card card-pad">
        <SectionHeader title="复习工具" sub="道具会保存在本地账号" />
        <div class="tool" v-for="t in tools2" :key="t.name">
          <span class="t-ico" :class="t.tone"><AppIcon :name="t.icon" :size="16" /></span>
          <div class="grow">
            <strong class="small">{{ t.name }}</strong>
            <p class="tiny muted">{{ t.desc }}</p>
          </div>
          <span class="tiny num muted">×{{ t.count }}</span>
          <el-button size="small" round :disabled="!t.count" @click="t.use">{{ t.cta }}</el-button>
        </div>
      </section>
    </div>

    <section class="card card-pad mt16">
      <SectionHeader title="今日复习队列" :sub="'按遗忘风险从高到低排序 · 共 ' + due.length + ' 词'" link="去错词本" @link="$router.push('/wrong')" />
      <el-table v-if="due.length" :data="dueRows" class="word-table" @row-click="row => ui.openWord(row.word)">
        <el-table-column label="单词" min-width="170">
          <template #default="{ row }">
            <div class="cell-word">
              <span class="en">{{ row.word.word }}</span>
              <small class="muted">{{ row.word.phonetic }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="释义" min-width="190">
          <template #default="{ row }"><span class="small">{{ row.word.cn }}</span></template>
        </el-table-column>
        <el-table-column label="词书" width="120">
          <template #default="{ row }"><span class="chip tiny">{{ bookName(row.word.bookId) }}</span></template>
        </el-table-column>
        <el-table-column label="记忆保持率" width="150">
          <template #default="{ row }">
            <div class="ret-cell">
              <div class="ret-bar"><span :style="{ width: row.retention + '%', background: retColor(row.retention) }"></span></div>
              <span class="tiny num">{{ row.retention }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="掌握度" width="100">
          <template #default="{ row }"><span class="chip tiny" :class="levelTone(row.mastery)">{{ levelName(row.mastery) }}</span></template>
        </el-table-column>
        <el-table-column label="上次复习" width="110">
          <template #default="{ row }"><span class="tiny muted">{{ row.lastText }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="right">
          <template #default="{ row }">
            <el-button size="small" round @click.stop="reviewOne(row)">复习</el-button>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else title="今天的复习任务已完成" desc="到期词都处理完了。可以去学几个新词，或做一次听写巩固拼写。" icon="check" action="去学新词" @action="$router.push('/learn')" />
    </section>

    <el-dialog v-model="settingsVisible" title="复习设置" width="440px" align-center>
      <div class="set-row">
        <div><strong class="small">每日目标词数</strong><p class="tiny muted">影响新词与复习的混排比例</p></div>
        <el-input-number v-model="goalDraft" :min="10" :max="120" :step="10" />
      </div>
      <div class="set-row">
        <div><strong class="small">每日复习上限</strong><p class="tiny muted">到期词过多时先复习高风险词</p></div>
        <el-input-number v-model="limitDraft" :min="10" :max="100" :step="10" />
      </div>
      <div class="set-row">
        <div><strong class="small">智能复习优先</strong><p class="tiny muted">优先安排临界点单词</p></div>
        <el-switch :model-value="user.prefs.smartFirst" @change="v => user.setPref('smartFirst', v)" />
      </div>
      <p class="tiny muted">当前算法：SM-2 变体。记住 → 间隔 × 1.9~2.5；模糊 → × 1.1；忘记 → 重置为 0.5 并降低掌握度。</p>
      <template #footer>
        <el-button round @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" round @click="saveSettings">保存设置</el-button>
      </template>
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
import SectionHeader from '../components/common/SectionHeader.vue'
import EmptyState from '../components/common/EmptyState.vue'
import BaseChart from '../components/common/BaseChart.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { useUiStore } from '../stores/ui'
import { bookById } from '../mock/books'
import { words } from '../mock/words'
import { retrievability, dueAt, masteryLevel } from '../utils/srs'
import { chartColors } from '../utils/chart'
import { todayKey, pct } from '../utils/format'

const user = useUserStore()
const study = useStudyStore()
const ui = useUiStore()
const router = useRouter()

const settingsVisible = ref(false)
const goalDraft = ref(user.prefs.dailyGoal || 40)
const limitDraft = ref(user.prefs.reviewLimit || 30)
const doneReview = computed(() => study.todayRecord.reviewCount || 0)

const due = computed(() => study.dueList.slice(0, user.prefs.reviewLimit || 30))
const urgent = computed(() => due.value.filter(w => (user.data.progress[w.id]?.mastery || 0) < 60))
const dueRows = computed(() => due.value.map(w => {
  const s = user.data.progress[w.id]
  return {
    id: w.id,
    word: w,
    retention: Math.round(retrievability(s) * 100),
    mastery: s.mastery || 0,
    lastText: dayjs(s.last).format('M月D日')
  }
}))

function bookName(id) { return bookById(id)?.short || id }
function retColor(v) { return v < 40 ? 'var(--accent)' : v < 70 ? 'var(--gold)' : 'var(--primary)' }
function levelName(m) { return masteryLevel(m).label }
function levelTone(m) { return m >= 85 ? 'primary' : m >= 60 ? '' : m >= 30 ? 'gold' : 'accent' }
function rowRetention(w) { return Math.round(retrievability(user.data.progress[w.id]) * 100) }

function startReview() {
  try {
    study.start({ mode: 'recognize', source: 'review', size: Math.min(20, Math.max(5, due.value.length)) })
    router.push('/learn')
  } catch (e) { ElMessage.warning(e.message) }
}
function reviewOne(row) {
  try {
    study.start({ mode: 'recognize', source: 'plan', size: 5 })
    const id = row.word.id
    study.session.queue = [id, ...study.session.queue.filter(x => x !== id)]
    study.session.idx = 0
    router.push('/learn')
  } catch (e) { ElMessage.warning(e.message) }
}

const forecastOption = computed(() => {
  const c = chartColors()
  void user.prefs.theme
  const days = []
  const counts = []
  for (let i = 0; i < 7; i++) {
    const d = dayjs().add(i, 'day')
    days.push(i === 0 ? '今天' : d.format('M/D'))
    const end = d.endOf('day').valueOf()
    let n = 0
    Object.values(user.data.progress || {}).forEach(s => {
      if (!s.seen) return
      const due = dueAt(s)
      if (i === 0 ? due <= end : due > dayjs(d).startOf('day').valueOf() && due <= end) n++
    })
    counts.push(n)
  }
  return {
    grid: { left: 2, right: 6, top: 16, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis', backgroundColor: c.surface, borderColor: c.grid, textStyle: { color: c.ink, fontSize: 12 } },
    xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: c.grid } }, axisTick: { show: false }, axisLabel: { color: c.text, fontSize: 10.5 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: c.grid, type: 'dashed' } }, axisLabel: { color: c.text, fontSize: 10 } },
    series: [{
      type: 'bar', data: counts, barWidth: '46%',
      itemStyle: { color: c.line, borderRadius: [6, 6, 0, 0] },
      label: { show: true, position: 'top', color: c.text, fontSize: 10 }
    }]
  }
})

const tools2 = computed(() => [
  {
    name: '补签卡', icon: 'calendar', tone: 'mint', count: user.data.items.makeup || 0, cta: '补签',
    desc: '补上漏掉的一天打卡，保留连续记录',
    use: useMakeup
  },
  {
    name: '连续冻结卡', icon: 'shield', tone: 'gold', count: user.data.items.freeze || 0, cta: '使用',
    desc: '断签时自动抵扣一次，避免连续清零',
    use: useFreeze
  },
  {
    name: '双倍经验卡', icon: 'zap', tone: 'accent', count: user.data.items.double || 0, cta: '使用',
    desc: '下一轮学习经验 ×2（演示版直接折算 60 exp）',
    use: useDouble
  }
])

function useMakeup() {
  if (!user.data.items.makeup) return
  if (!user.data.records.length) {
    ElMessage.info('还没有学习记录，先在今天学一轮再使用补签卡')
    return
  }
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const exists = user.data.records.find(r => r.date === yesterday)
  if (exists) {
    ElMessage.info('昨天已打卡，最近没有断签，补签卡先留着吧')
    return
  }
  const dayBefore = dayjs().subtract(2, 'day').format('YYYY-MM-DD')
  const hasBefore = user.data.records.find(r => r.date === dayBefore)
  if (!hasBefore) {
    ElMessage.info('断签已超过一天，补签卡只能补最近一天，建议从今天重新开始')
    return
  }
  user.data.records.push({ date: yesterday, newCount: 1, reviewCount: 0, correct: 1, total: 1, minutes: 5, mode: 'recognize' })
  study.useMakeup()
  ElMessage.success('补签成功，连续记录已保留')
}
function useFreeze() {
  if (!user.data.items.freeze) return
  ElMessage.info('冻结卡会在断签时自动生效，当前连续 ' + study.streak + ' 天')
}
function useDouble() {
  if (!user.data.items.double) return
  user.data.items.double--
  user.data.xp += 60
  user.persist()
  ElMessage.success('已使用双倍经验卡，经验 +60')
}
function saveSettings() {
  user.setPref('dailyGoal', goalDraft.value)
  user.setPref('reviewLimit', limitDraft.value)
  settingsVisible.value = false
  ElMessage.success('复习设置已保存')
}
</script>

<style scoped>
.review-hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 20px 26px; margin-bottom: 16px; }
.rh-left { display: flex; align-items: center; gap: 22px; }
.rh-left h2 { font-size: 20px; margin-bottom: 4px; }
.rh-right { text-align: right; }
.retention { display: flex; flex-direction: column; align-items: flex-end; }
.retention strong { font-size: 30px; color: var(--primary); line-height: 1.2; }
.forecast-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }
.mt16 { margin-top: 16px; }
.tool { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px dashed var(--line); }
.tool:last-child { border-bottom: 0; }
.t-ico { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); }
.t-ico.gold { background: var(--gold-soft); color: var(--gold); }
.t-ico.accent { background: var(--accent-soft); color: var(--accent); }
.tool strong { display: block; line-height: 1.3; }
.tool p { line-height: 1.4; }
.cell-word { display: flex; flex-direction: column; }
.cell-word .en { font-size: 16px; font-weight: 600; }
.cell-word small { font-size: 10.5px; }
.ret-cell { display: flex; align-items: center; gap: 8px; }
.ret-bar { flex: 1; height: 5px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.ret-bar span { display: block; height: 100%; border-radius: 3px; }
.word-table :deep(.el-table__row) { cursor: pointer; }
.set-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px dashed var(--line); }
.set-row strong { display: block; }
.set-row p { margin-top: 2px; }
@media (max-width: 900px) {
  .forecast-grid { grid-template-columns: 1fr; }
  .review-hero { flex-direction: column; align-items: flex-start; }
  .rh-right { text-align: left; }
  .retention { align-items: flex-start; }
}
</style>
