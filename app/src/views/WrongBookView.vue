<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>错词本</h1>
        <p>做错过的词会自动收进来。错误次数越多、掌握度越低，越应该优先复习。</p>
      </div>
      <div class="row gap8">
        <el-button round @click="exportList"><AppIcon name="download" :size="14" /> 导出错词</el-button>
        <el-button type="primary" round :disabled="!filtered.length" @click="startWrong"><AppIcon name="play" :size="13" /> 强化复习</el-button>
      </div>
    </div>

    <div class="wrong-stats">
      <StatCard label="错词总数" :value="rows.length" unit="词" foot="来自 60 词演示词库" icon="book-open" tone="accent" />
      <StatCard label="高频错误" :value="highFreq" unit="词" foot="错误 ≥ 3 次" icon="flame" tone="accent" />
      <StatCard label="平均掌握度" :value="avgMastery" unit="%" foot="低于 60% 建议重学" icon="target" />
      <StatCard label="已消灭" :value="fixedCount" unit="词" foot="曾经错、现在掌握 ≥ 80%" icon="check" />
    </div>

    <section class="card card-pad mt16">
      <div class="filter-bar">
        <el-input v-model="keyword" placeholder="搜索错词" clearable style="width: 220px">
          <template #prefix><AppIcon name="search" :size="14" /></template>
        </el-input>
        <el-select v-model="bookFilter" style="width: 168px">
          <el-option label="全部词书" value="" />
          <el-option v-for="b in joinedBooks" :key="b.id" :label="b.short" :value="b.id" />
        </el-select>
        <el-select v-model="levelFilter" style="width: 150px">
          <el-option label="全部掌握度" value="" />
          <el-option label="生疏" value="生疏" />
          <el-option label="模糊" value="模糊" />
          <el-option label="认识" value="认识" />
          <el-option label="熟练" value="熟练" />
        </el-select>
        <el-radio-group v-model="sortBy">
          <el-radio-button value="wrong">错误最多</el-radio-button>
          <el-radio-button value="mastery">最不熟</el-radio-button>
          <el-radio-button value="recent">最近错</el-radio-button>
        </el-radio-group>
        <span class="grow"></span>
        <span class="tiny muted">共 {{ filtered.length }} 个结果</span>
      </div>

      <el-table v-if="filtered.length" :data="filtered" class="wrong-table" @row-click="row => ui.openWord(row.word)">
        <el-table-column label="单词" min-width="180">
          <template #default="{ row }">
            <div class="cell-word">
              <span class="en">{{ row.word.word }}</span>
              <small class="muted">{{ row.word.phonetic }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="释义" min-width="200">
          <template #default="{ row }"><span class="small">{{ row.word.cn }}</span></template>
        </el-table-column>
        <el-table-column label="错误次数" width="110" align="center">
          <template #default="{ row }">
            <span class="wrong-count num"><AppIcon name="close" :size="11" /> {{ row.wrong }}</span>
          </template>
        </el-table-column>
        <el-table-column label="掌握度" width="150">
          <template #default="{ row }">
            <div class="m-cell">
              <div class="m-bar"><span :style="{ width: row.mastery + '%', background: masteryColor(row.mastery) }"></span></div>
              <span class="tiny num">{{ row.mastery }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><span class="chip tiny" :class="row.tone">{{ row.level }}</span></template>
        </el-table-column>
        <el-table-column label="最近复习" width="110">
          <template #default="{ row }"><span class="tiny muted">{{ row.recent }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="right">
          <template #default="{ row }">
            <el-button size="small" round @click.stop="ui.openWord(row.word)">详情</el-button>
            <el-button size="small" type="danger" text @click.stop="removeRow(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else title="错词本是空的" desc="学习过程中评为「不认识」的词会自动收录，连续答对后也可以手动移除。" icon="book-open" action="去学习" @action="$router.push('/learn')" />
    </section>

    <section class="card card-pad mt16 habit">
      <AppIcon name="sparkles" :size="20" />
      <div class="grow">
        <strong>错词复习建议</strong>
        <p class="small muted">错误次数 ≥ 3 的词，建议用「拼写模式」重学一遍：能拼出来，才算真正记住。系统会把它们排在强化队列最前。</p>
      </div>
      <el-button round @click="startWrong">开始强化</el-button>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '../components/common/AppIcon.vue'
import StatCard from '../components/common/StatCard.vue'
import EmptyState from '../components/common/EmptyState.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { useUiStore } from '../stores/ui'
import { words } from '../mock/words'
import { masteryLevel } from '../utils/srs'

const user = useUserStore()
const study = useStudyStore()
const ui = useUiStore()
const router = useRouter()

const keyword = ref('')
const bookFilter = ref('')
const levelFilter = ref('')
const sortBy = ref('wrong')

const joinedBooks = computed(() => {
  const ids = new Set(words.map(w => w.bookId))
  return [...ids].map(id => ({ id, short: { cet4: '四级核心词汇', cet6: '六级进阶词汇', ielts: '雅思学术词汇', kaoyan: '考研高频词', toefl: '托福学科词汇', gre: 'GRE 高频 3000', bec: '商务英语 BEC', academic: '学术写作词汇' }[id] || id }))
})

const rows = computed(() => {
  const p = user.data.progress || {}
  return words.filter(w => p[w.id]?.wrong > 0).map(w => {
    const s = p[w.id]
    const level = masteryLevel(s.mastery).label
    return {
      word: w,
      wrong: s.wrong,
      mastery: Math.round(s.mastery),
      level,
      tone: level === '熟练' ? 'primary' : level === '认识' ? '' : level === '模糊' ? 'gold' : 'accent',
      recent: s.last ? dayjs(s.last).format('M月D日') : '—',
      last: s.last || 0
    }
  })
})
const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  let list = rows.value.filter(r => {
    if (k && !r.word.word.toLowerCase().includes(k) && !r.word.cn.includes(k)) return false
    if (bookFilter.value && r.word.bookId !== bookFilter.value) return false
    if (levelFilter.value && r.level !== levelFilter.value) return false
    return true
  })
  if (sortBy.value === 'wrong') list = [...list].sort((a, b) => b.wrong - a.wrong)
  if (sortBy.value === 'mastery') list = [...list].sort((a, b) => a.mastery - b.mastery)
  if (sortBy.value === 'recent') list = [...list].sort((a, b) => b.last - a.last)
  return list
})
const highFreq = computed(() => rows.value.filter(r => r.wrong >= 3).length)
const avgMastery = computed(() => rows.value.length ? Math.round(rows.value.reduce((a, r) => a + r.mastery, 0) / rows.value.length) : 0)
const fixedCount = computed(() => {
  const p = user.data.progress || {}
  return Object.values(p).filter(s => s.wrong > 0 && s.mastery >= 80).length
})

function masteryColor(m) { return m >= 85 ? 'var(--primary)' : m >= 60 ? 'var(--primary-light)' : m >= 30 ? 'var(--gold)' : 'var(--accent)' }

function startWrong() {
  try {
    study.start({ mode: 'spell', source: 'wrong', size: Math.min(20, Math.max(5, filtered.value.length)) })
    router.push('/learn')
  } catch (e) { ElMessage.warning(e.message) }
}
async function removeRow(row) {
  try {
    await ElMessageBox.confirm('从错词本移除「' + row.word.word + '」？学习进度仍会保留。', '移除错词', { confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning' })
    user.data.progress[row.word.id].wrong = 0
    user.persist()
    ElMessage.success('已移除')
  } catch (e) { /* cancel */ }
}
function exportList() {
  const lines = filtered.value.map(r => r.word.word + '\t' + r.word.cn + '\t错 ' + r.wrong + ' 次')
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = '词跃-错词本.txt'
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('错词本已导出')
}
</script>

<style scoped>
.wrong-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.mt16 { margin-top: 16px; }
.filter-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.cell-word { display: flex; flex-direction: column; }
.cell-word .en { font-size: 16px; font-weight: 600; }
.cell-word small { font-size: 10.5px; }
.wrong-count { display: inline-flex; align-items: center; gap: 3px; color: var(--accent); background: var(--accent-soft); padding: 3px 9px; border-radius: 999px; font-size: 12px; }
.m-cell { display: flex; align-items: center; gap: 8px; }
.m-bar { flex: 1; height: 5px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.m-bar span { display: block; height: 100%; border-radius: 3px; }
.wrong-table :deep(.el-table__row) { cursor: pointer; }
.habit { display: flex; align-items: center; gap: 14px; background: var(--primary-softer); border-color: var(--primary-soft); }
.habit :deep(svg) { color: var(--primary); flex: 0 0 auto; }
.habit strong { font-size: 13px; }
@media (max-width: 1000px) { .wrong-stats { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .wrong-stats { grid-template-columns: 1fr 1fr; } .filter-bar :deep(.el-input), .filter-bar :deep(.el-select) { width: 100% !important; } }
</style>
