<template>
  <div v-if="book" class="page">
    <div class="page-head">
      <div>
        <button class="back-link" @click="router.push('/books')">
          <AppIcon name="arrow-left" :size="14" /> 返回词书库
        </button>
        <h1 class="mt8">{{ book.name }}</h1>
        <p>{{ book.desc }}</p>
      </div>
      <div class="row gap8 wrap">
        <el-button v-if="!joined" type="primary" round @click="joinBook">加入词书</el-button>
        <template v-else>
          <el-button v-if="!isMain" round @click="setMain">设为主修</el-button>
          <el-button type="primary" round @click="startBook">
            <AppIcon name="play" :size="14" /> 继续学习
          </el-button>
        </template>
        <el-button v-if="joined" round @click="removeBook">移出词书</el-button>
      </div>
    </div>

    <section class="detail-hero" :style="{ background: gradMap[book.grad] }">
      <span class="hero-mark">{{ book.letter }}</span>
      <div class="hero-main">
        <div class="row gap8 wrap">
          <span class="hero-chip">{{ book.type }}</span>
          <span v-if="isMain" class="hero-chip solid">主修</span>
          <span class="hero-chip">{{ book.en }}</span>
        </div>
        <h2>{{ book.short }}</h2>
        <p>{{ book.desc }}</p>
        <div class="hero-stats">
          <div><strong class="num">{{ book.total }}</strong><span>标称词数</span></div>
          <div><strong class="num">{{ list.length }}</strong><span>演示词条</span></div>
          <div><strong class="num">{{ stats.learned }}</strong><span>已学</span></div>
          <div><strong class="num">{{ stats.mastered }}</strong><span>掌握</span></div>
        </div>
      </div>
      <div class="hero-ring">
        <RingProgress :value="stats.pct" :size="126" :stroke="11" color="#FFFFFF" track="rgba(255,255,255,.22)">
          <strong class="num" style="color:#fff">{{ stats.pct }}<span class="pct" style="color:rgba(255,255,255,.7)">%</span></strong>
        </RingProgress>
        <span class="tiny" style="color:rgba(255,255,255,.75)">掌握度</span>
      </div>
    </section>

    <div class="book-grid">
      <section class="card card-pad">
        <SectionHeader title="词表" :sub="filtered.length + ' 个词条 · 点击查看完整释义'">
          <template #extra>
            <el-input v-model="keyword" size="small" placeholder="搜索单词 / 释义" clearable style="width: 180px">
              <template #prefix><AppIcon name="search" :size="13" /></template>
            </el-input>
          </template>
        </SectionHeader>

        <div v-if="filtered.length" class="word-list">
          <button v-for="w in filtered" :key="w.id" class="word-row" @click="ui.openWord(w)">
            <span class="w-en en">{{ w.word }}</span>
            <span class="w-phonetic">{{ w.phonetic }}</span>
            <span class="w-cn">{{ w.cn }}</span>
            <span class="w-level" :class="'m-' + levelOf(w).key">{{ levelOf(w).label }}</span>
            <span class="w-dot" :style="{ background: masteryColor(w) }"></span>
          </button>
        </div>
        <EmptyState v-else title="没有找到词条" desc="换个关键词试试。" icon="search" />
      </section>

      <aside class="side-col">
        <section class="card card-pad">
          <h3>学习进度</h3>
          <div class="progress-line">
            <div class="between tiny muted"><span>已学 {{ stats.learned }} 词</span><span>{{ stats.learnedPct }}%</span></div>
            <div class="bar"><span :style="{ width: stats.learnedPct + '%' }"></span></div>
          </div>
          <div class="progress-line">
            <div class="between tiny muted"><span>已掌握 {{ stats.mastered }} 词</span><span>{{ stats.pct }}%</span></div>
            <div class="bar"><span :style="{ width: stats.pct + '%' }"></span></div>
          </div>
          <p class="tiny muted mt12">按每天 {{ dailyGoal }} 词计算，预计 {{ etaDays }} 天可完成本词书。</p>
          <el-button v-if="joined" type="primary" round style="width: 100%; margin-top: 12px" @click="startBook">
            <AppIcon name="play" :size="14" /> 开始本轮学习
          </el-button>
          <el-button v-else round style="width: 100%; margin-top: 12px" @click="joinBook">加入后开始学习</el-button>
        </section>

        <section class="card card-pad">
          <h3>词书信息</h3>
          <div class="info-row"><span>词书类型</span><strong>{{ book.type }}</strong></div>
          <div class="info-row"><span>目标词数</span><strong class="num">{{ book.total }}</strong></div>
          <div class="info-row"><span>演示词条</span><strong class="num">{{ list.length }}</strong></div>
          <div class="info-row"><span>加入状态</span><strong>{{ joined ? (isMain ? '主修中' : '已加入') : '未加入' }}</strong></div>
          <div class="info-row"><span>考试倒计时</span><strong>{{ examDays }} 天</strong></div>
        </section>

        <section class="card card-pad tip-card">
          <AppIcon name="sparkles" :size="17" />
          <p class="small">{{ planText }}</p>
        </section>
      </aside>
    </div>
  </div>

  <div v-else class="page">
    <EmptyState title="词书不存在" desc="它可能已被删除，去词书库重新选择一本。" icon="book" action="返回词书库" @action="router.push('/books')" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '../components/common/AppIcon.vue'
import SectionHeader from '../components/common/SectionHeader.vue'
import EmptyState from '../components/common/EmptyState.vue'
import RingProgress from '../components/common/RingProgress.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { useUiStore } from '../stores/ui'
import { bookById, gradMap } from '../mock/books'
import { wordsByBook } from '../mock/words'
import { bookStats } from '../utils/stats'
import { masteryLevel, retrievability } from '../utils/srs'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const study = useStudyStore()
const ui = useUiStore()

const keyword = ref('')
const book = computed(() => bookById(route.params.id))
const list = computed(() => (book.value ? wordsByBook(book.value.id) : []))
const stats = computed(() => (book.value ? bookStats(user.data, book.value, list.value) : { total: 0, learned: 0, mastered: 0, pct: 0, learnedPct: 0 }))
const joined = computed(() => !!user.data?.books?.[book.value?.id]?.joined)
const isMain = computed(() => !!user.data?.books?.[book.value?.id]?.main)
const dailyGoal = computed(() => user.prefs.dailyGoal || 40)
const etaDays = computed(() => Math.max(1, Math.ceil((stats.value.total - stats.value.learned) / dailyGoal.value)))
const examDays = computed(() => Math.max(0, Math.ceil((new Date(user.profile.examDate) - new Date()) / 86400000)))
const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  return list.value.filter(w => !k || w.word.toLowerCase().includes(k) || w.cn.includes(k))
})
const planText = computed(() => {
  if (!joined.value) return '加入后会按你的每日目标和考试倒计时生成学习计划，并自动混排到期复习词。'
  if (!stats.value.learned) return '从第一组 20 个词开始，先建立初始记忆痕迹，再按遗忘曲线滚动复习。'
  return '优先复习掌握度低于 60% 的词，再补充新词；预计 ' + etaDays.value + ' 天完成本词书。'
})

function levelOf(w) {
  return masteryLevel(user.data.progress[w.id]?.mastery || 0)
}
function masteryColor(w) {
  const s = user.data.progress[w.id]
  if (!s || !s.seen) return 'var(--line)'
  const r = retrievability(s)
  if (r < 0.5) return 'var(--accent)'
  if (r < 0.8) return 'var(--gold)'
  return 'var(--primary)'
}
function joinBook() {
  if (!book.value) return
  user.data.books[book.value.id] = { joined: true, main: !user.mainBook, addedAt: Date.now() }
  user.persist()
  ElMessage.success('已加入「' + book.value.short + '」')
}
function setMain() {
  if (!book.value) return
  Object.keys(user.data.books).forEach(id => { if (user.data.books[id]) user.data.books[id].main = false })
  user.data.books[book.value.id].main = true
  user.persist()
  ElMessage.success('已设为主修词书')
}
async function removeBook() {
  if (!book.value) return
  try {
    await ElMessageBox.confirm('移出后学习记录仍会保留，重新加入可继续进度。', '移出「' + book.value.short + '」', {
      confirmButtonText: '移出', cancelButtonText: '取消', type: 'warning'
    })
    user.data.books[book.value.id].joined = false
    user.data.books[book.value.id].main = false
    user.persist()
    ElMessage.success('已移出')
  } catch (e) { /* cancel */ }
}
function startBook() {
  if (!book.value) return
  try {
    study.start({ mode: 'recognize', source: 'plan', bookId: book.value.id, size: 20 })
    router.push('/learn')
  } catch (e) { ElMessage.warning(e.message) }
}
</script>

<style scoped>
.back-link { display: inline-flex; align-items: center; gap: 5px; color: var(--muted); font-size: 12px; background: none; border: 0; cursor: pointer; padding: 0; }
.back-link:hover { color: var(--primary); }
.detail-hero { position: relative; overflow: hidden; display: flex; align-items: center; gap: 28px; padding: 30px 34px; border-radius: 22px; color: #fff; margin-bottom: 16px; box-shadow: var(--shadow); }
.hero-mark { position: absolute; right: 18px; top: -70px; font-family: Georgia, serif; font-size: 240px; line-height: 1; opacity: .12; pointer-events: none; }
.hero-main { position: relative; z-index: 1; flex: 1; min-width: 0; }
.hero-main h2 { font-size: 27px; margin: 12px 0 4px; color: #fff; }
.hero-main p { font-size: 13px; color: rgba(255,255,255,.78); max-width: 560px; line-height: 1.7; }
.hero-chip { padding: 3px 9px; border-radius: 999px; background: rgba(255,255,255,.16); color: rgba(255,255,255,.92); font-size: 11px; }
.hero-chip.solid { background: #fff; color: var(--primary-dark); font-weight: 600; }
.hero-stats { display: flex; gap: 28px; margin-top: 18px; }
.hero-stats strong { display: block; font-size: 22px; color: #fff; line-height: 1.2; }
.hero-stats span { font-size: 11px; color: rgba(255,255,255,.68); }
.hero-ring { position: relative; z-index: 1; display: grid; justify-items: center; gap: 5px; flex: 0 0 auto; }
.book-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(280px, .8fr); gap: 16px; align-items: start; }
.side-col { display: grid; gap: 16px; }
.side-col h3 { font-size: 14px; margin-bottom: 12px; }
.word-list { max-height: 610px; overflow: auto; margin: 0 -8px; padding: 0 8px; }
.word-row { display: grid; grid-template-columns: 1.1fr .75fr 1.45fr 58px 8px; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 11px 8px; border: 0; border-bottom: 1px dashed var(--line); background: none; cursor: pointer; border-radius: 8px; }
.word-row:hover { background: var(--surface-2); }
.w-en { font-weight: 600; font-size: 15px; }
.w-phonetic { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-cn { font-size: 12px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-level { font-size: 10px; text-align: center; padding: 2px 5px; border-radius: 999px; background: var(--surface-2); color: var(--muted); }
.w-level.m-mastered, .w-level.m-known { background: var(--primary-soft); color: var(--primary-dark); }
.w-level.m-fuzzy { background: var(--gold-soft); color: var(--gold-deep); }
.w-level.m-raw { background: var(--accent-soft); color: var(--accent-deep); }
.w-dot { width: 7px; height: 7px; border-radius: 50%; }
.progress-line { margin-bottom: 12px; }
.progress-line .bar { margin-top: 5px; }
.info-row { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px dashed var(--line); font-size: 12px; color: var(--muted); }
.info-row:last-child { border-bottom: 0; }
.info-row strong { color: var(--ink); font-weight: 600; }
.tip-card { display: flex; gap: 10px; align-items: flex-start; background: var(--primary-softer); }
.tip-card :deep(svg) { color: var(--gold); flex: 0 0 auto; margin-top: 2px; }
@media (max-width: 1100px) {
  .book-grid { grid-template-columns: 1fr; }
  .word-list { max-height: 520px; }
}
@media (max-width: 767px) {
  .detail-hero { padding: 22px; gap: 16px; flex-wrap: wrap; }
  .hero-mark { font-size: 150px; top: -36px; }
  .hero-main h2 { font-size: 22px; }
  .hero-stats { gap: 18px; }
  .hero-ring { display: none; }
  .word-row { grid-template-columns: 1fr; gap: 3px; }
  .w-level, .w-dot { display: none; }
}
</style>
