<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>词书库</h1>
        <p>共 {{ allBooks.length }} 本词书，已加入 {{ myBooks.length }} 本 · 当前主修「{{ mainBook?.short || '未选择' }}」</p>
      </div>
      <div class="row gap8">
        <el-button round @click="openImport"><AppIcon name="upload" :size="14" /> 导入词书</el-button>
        <el-button type="primary" round @click="openCreate"><AppIcon name="plus" :size="14" /> 新建词书</el-button>
      </div>
    </div>

    <div class="filter-row">
      <div class="chips">
        <button v-for="f in filters" :key="f" class="filter-chip" :class="{ on: filter === f }" @click="filter = f">{{ f }}</button>
      </div>
      <el-input v-model="keyword" placeholder="搜索词书名称" clearable style="width: 240px">
        <template #prefix><AppIcon name="search" :size="14" /></template>
      </el-input>
    </div>

    <SectionHeader title="我的词书" :sub="myBooks.length + ' 本进行中'" />
    <div v-if="myBooks.length" class="book-grid">
      <article v-for="b in myBooks" :key="b.id" class="book-card card" @click="goDetail(b)">
        <div class="cover" :style="{ background: gradMap[b.grad] }">
          <span class="cover-letter">{{ b.letter }}</span>
          <div class="cover-top">
            <span class="cover-type">{{ b.type }}</span>
            <span v-if="isMain(b.id)" class="cover-main">主修</span>
          </div>
          <div class="cover-text">
            <strong>{{ b.short }}</strong>
            <small>{{ b.en }} · {{ b.total }} 词</small>
          </div>
        </div>
        <div class="book-body">
          <div class="between">
            <span class="tiny muted">已掌握 {{ statOf(b).mastered }} / {{ statOf(b).total }} 词</span>
            <span class="tiny num" :class="statOf(b).pct > 50 ? 'hl' : 'muted'">{{ statOf(b).pct }}%</span>
          </div>
          <div class="bar"><span :style="{ width: statOf(b).pct + '%' }"></span></div>
          <div class="book-actions">
            <span class="tiny muted">{{ statOf(b).learned }} 词已学</span>
            <div class="row gap6">
              <el-button size="small" round @click.stop="goDetail(b)">详情</el-button>
              <el-button size="small" type="primary" round @click.stop="startBook(b)">继续学习</el-button>
            </div>
          </div>
        </div>
      </article>
    </div>
    <div v-else class="card empty-my">
      <EmptyState title="还没有加入词书" desc="从下方挑一本加入，系统会按考试倒计时生成计划。" icon="book" action="随便挑一本" @action="joinBook(allBooks[0])" />
    </div>

    <SectionHeader title="发现词书" sub="按考试类型与难度挑选" link="换一批" @link="refreshDiscover" />
    <div class="book-grid discover">
      <article v-for="b in discover" :key="b.id" class="book-card card">
        <div class="cover small-cover" :style="{ background: gradMap[b.grad] }" @click="goDetail(b)">
          <span class="cover-letter">{{ b.letter }}</span>
          <div class="cover-text">
            <strong>{{ b.short }}</strong>
            <small>{{ b.en }} · {{ b.total }} 词</small>
          </div>
        </div>
        <div class="book-body">
          <p class="tiny muted desc">{{ b.desc }}</p>
          <div class="between mt8">
            <span class="chip tiny">{{ b.type }}</span>
            <el-button size="small" round type="primary" plain @click="joinBook(b)">加入词书</el-button>
          </div>
        </div>
      </article>
    </div>

    <section class="quiz-banner card">
      <div class="qb-ico"><AppIcon name="sparkles" :size="20" /></div>
      <div class="grow">
        <strong>不知道选哪本？做个 1 分钟词汇量测试</strong>
        <p class="tiny muted">10 道词义题估算词汇量，再按目标考试与每天可用时间生成词书组合。</p>
      </div>
      <el-button type="primary" round @click="quizVisible = true">开始测试</el-button>
    </section>

    <!-- 新建 / 导入词书 -->
    <el-dialog v-model="bookDialog" :title="dialogMode === 'import' ? '导入词书' : '新建词书'" width="560px" align-center>
      <el-form ref="bookFormRef" :model="bookForm" :rules="bookRules" label-position="top">
        <div class="two-col">
          <el-form-item label="词书名称" prop="name">
            <el-input v-model="bookForm.name" placeholder="例如：专业课核心术语" maxlength="24" show-word-limit />
          </el-form-item>
          <el-form-item label="类型" prop="type">
            <el-select v-model="bookForm.type" style="width: 100%">
              <el-option label="自定义" value="自定义" />
              <el-option label="四级" value="四级" />
              <el-option label="六级" value="六级" />
              <el-option label="考研" value="考研" />
              <el-option label="雅思" value="雅思" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="简介" prop="desc">
          <el-input v-model="bookForm.desc" placeholder="一句话说明这本词书适合谁" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="词条（每行一个，格式：单词 释义 或 单词|音标|词性|释义）" prop="raw">
          <el-input v-model="bookForm.raw" type="textarea" :rows="7" placeholder="resilience 韧性；恢复力&#10;abundant|/əˈbʌndənt/|adj.|丰富的" />
        </el-form-item>
        <div class="parse-hint">
          <AppIcon name="info" :size="14" />
          <span>已识别 {{ parsedWords.length }} 个有效词条。词条会保存在本地，可正常参与学习与统计。</span>
        </div>
      </el-form>
      <template #footer>
        <el-button round @click="bookDialog = false">取消</el-button>
        <el-button type="primary" round :disabled="!parsedWords.length" @click="submitBook">创建并加入</el-button>
      </template>
    </el-dialog>

    <!-- 词汇量测试：10 道词义选择题，按难度加权估算词汇量 -->
    <el-dialog
      v-model="quizVisible"
      title="词汇量测试"
      width="min(520px, calc(100vw - 32px))"
      align-center
      :close-on-click-modal="false"
      @closed="resetQuiz"
    >
      <!-- 第一步：选择目标考试与每天可投入的时间 -->
      <div v-if="quizStage === 'intro'" class="quiz-intro">
        <div class="quiz-hero">
          <span class="qr-ico"><AppIcon name="target" :size="24" /></span>
          <div>
            <strong>10 个单词，测出你的大致词汇量</strong>
            <p class="small muted">看英文选中文释义，题目从四级到 GRE 分层抽取，答错不扣分。</p>
          </div>
        </div>
        <div class="quiz-q">
          <p class="small"><strong>你的目标考试</strong></p>
          <el-radio-group v-model="quiz.exam">
            <el-radio value="cet4">四级</el-radio>
            <el-radio value="cet6">六级</el-radio>
            <el-radio value="kaoyan">考研</el-radio>
            <el-radio value="ielts">雅思 / 托福</el-radio>
          </el-radio-group>
        </div>
        <div class="quiz-q">
          <p class="small"><strong>每天能投入的时间</strong></p>
          <el-radio-group v-model="quiz.time">
            <el-radio value="10">10 分钟</el-radio>
            <el-radio value="20">20 分钟</el-radio>
            <el-radio value="40">40 分钟</el-radio>
          </el-radio-group>
        </div>
        <p class="quiz-note">测试结果只用于生成词书建议，可随时重新测试。</p>
        <el-button type="primary" round style="width: 100%" @click="startQuiz">开始测试（10 题）</el-button>
      </div>

      <!-- 第二步：逐题作答 -->
      <div v-else-if="quizStage === 'test'" class="quiz-test">
        <div class="quiz-progress">
          <div class="qp-head">
            <span>第 {{ quizIndex + 1 }} / {{ quizQuestions.length }} 题</span>
            <span class="tiny muted">已答对 {{ quizCorrect }} 题</span>
          </div>
          <div class="qp-bar"><i :style="{ width: ((quizIndex + 1) / quizQuestions.length * 100) + '%' }"></i></div>
        </div>
        <div class="quiz-word">
          <p class="tiny muted">选择正确的中文释义</p>
          <h2 class="serif">{{ currentQuestion.word.word }}</h2>
          <p class="phonetic">{{ currentQuestion.word.phonetic }}</p>
        </div>
        <div class="quiz-options">
          <button
            v-for="(o, i) in currentQuestion.options"
            :key="o.id"
            type="button"
            class="quiz-option"
            :class="optionClass(o)"
            :disabled="quizLocked"
            @click="answerQuiz(o)"
          >
            <span class="qo-index">{{ 'ABCD'[i] }}</span>
            <span class="qo-text">{{ o.text }}</span>
            <AppIcon v-if="quizLocked && o.id === currentQuestion.word.id" name="check" :size="15" />
            <AppIcon v-else-if="quizLocked && o.id === quizPicked" name="close" :size="15" />
          </button>
        </div>
        <div v-if="quizLocked" class="quiz-feedback">
          <span :class="quizPicked === currentQuestion.word.id ? 'ok' : 'bad'">
            {{ quizPicked === currentQuestion.word.id ? '答对了' : '正确答案：' + currentQuestion.word.cn }}
          </span>
          <span class="tiny muted">{{ currentQuestion.word.word }} · {{ currentQuestion.word.pos }}</span>
        </div>
        <el-button v-if="quizLocked" type="primary" round style="width: 100%; margin-top: 12px" @click="nextQuiz">
          {{ quizIndex + 1 === quizQuestions.length ? '查看测试结果' : '下一题' }}
        </el-button>
      </div>

      <!-- 第三步：估算结果与词书建议 -->
      <div v-else class="quiz-result">
        <span class="qr-ico"><AppIcon name="target" :size="26" /></span>
        <p class="tiny muted">根据 10 题难度加权估算</p>
        <div class="quiz-estimate"><strong class="num">{{ quizResult.estimate.toLocaleString() }}</strong><span>词</span></div>
        <div class="quiz-level">{{ quizResult.levelLabel }} · 答对 {{ quizResult.correct }} / {{ quizResult.total }} 题</div>
        <div class="quiz-rec">
          <div class="between">
            <span class="tiny muted">推荐词书</span>
            <span class="chip primary">{{ quizResult.book.type }}</span>
          </div>
          <h3>{{ quizResult.book.short }}</h3>
          <p class="small muted">{{ quizResult.reason }}</p>
        </div>
        <div class="qr-plan">
          <div><span class="tiny muted">每日新词</span><strong class="num">{{ quizResult.newPerDay }}</strong></div>
          <div><span class="tiny muted">预计完成</span><strong class="num">{{ quizResult.days }} 天</strong></div>
          <div><span class="tiny muted">每日时长</span><strong class="num">{{ quiz.time }} 分钟</strong></div>
        </div>
        <div class="row gap8" style="margin-top: 14px">
          <el-button round style="flex: 1" @click="startQuiz">重新测试</el-button>
          <el-button type="primary" round style="flex: 2" @click="acceptQuiz">采用计划并加入词书</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 词书详情抽屉 -->
    <el-drawer v-model="detailVisible" :title="detailBook?.name" size="480px">
      <template v-if="detailBook">
        <div class="detail-head" :style="{ background: gradMap[detailBook.grad] }">
          <div>
            <span class="chip" style="background: rgba(255,255,255,.18); color: #fff">{{ detailBook.type }}</span>
            <h2 style="color: #fff; margin-top: 8px">{{ detailBook.short }}</h2>
            <p style="color: rgba(255,255,255,.75); font-size: 12px">{{ detailBook.total }} 词 · {{ detailBook.en }}</p>
          </div>
          <span class="detail-letter">{{ detailBook.letter }}</span>
        </div>
        <p class="small muted mt12">{{ detailBook.desc }}</p>
        <div class="row gap8 mt12">
          <el-button v-if="!isJoined(detailBook.id)" type="primary" round size="small" @click="joinBook(detailBook)">加入词书</el-button>
          <el-button v-else type="primary" round size="small" @click="startBook(detailBook)">开始学习</el-button>
          <el-button v-if="isJoined(detailBook.id) && !isMain(detailBook.id)" round size="small" @click="setMain(detailBook)">设为主修</el-button>
          <el-button v-if="isJoined(detailBook.id)" round size="small" @click="removeBook(detailBook)">移出词书</el-button>
          <el-button v-if="detailBook.custom" type="danger" text size="small" @click="deleteCustom(detailBook)">删除自建词书</el-button>
        </div>
        <div class="detail-list">
          <div class="between mb8">
            <strong class="small">词条预览（{{ detailWords.length }}）</strong>
            <el-input v-model="detailKeyword" size="small" placeholder="搜索" clearable style="width: 140px" />
          </div>
          <div v-for="w in detailWords" :key="w.id" class="d-word" @click="ui.openWord(w)">
            <div class="grow">
              <span class="en">{{ w.word }}</span>
              <span class="tiny muted" style="margin-left: 8px">{{ w.pos }}</span>
              <p class="tiny muted">{{ w.cn }}</p>
            </div>
            <span class="chip tiny" :class="masteryTone(w)">{{ masteryOf(w) }}%</span>
          </div>
          <EmptyState v-if="!detailWords.length" title="暂无词条" desc="自建词书可以导入词条后再学习。" icon="inbox" />
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '../components/common/AppIcon.vue'
import SectionHeader from '../components/common/SectionHeader.vue'
import EmptyState from '../components/common/EmptyState.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { useUiStore } from '../stores/ui'
import { books, bookFilters, gradMap, bookById } from '../mock/books'
import { words, wordsByBook } from '../mock/words'
import { shuffle } from '../utils/format'
import { bookStats } from '../utils/stats'
import { createCustomBook, removeCustomBook } from '../utils/customBooks'

const user = useUserStore()
const study = useStudyStore()
const ui = useUiStore()
const router = useRouter()

const filter = ref('全部')
const keyword = ref('')
const discoverSeed = ref(0)
const detailVisible = ref(false)
const detailBook = ref(null)
const detailKeyword = ref('')
const bookDialog = ref(false)
const dialogMode = ref('create')
const bookFormRef = ref()
const quizVisible = ref(false)
const quizStage = ref('intro') // intro | test | result
const quizQuestions = ref([])
const quizIndex = ref(0)
const quizCorrect = ref(0)
const quizPicked = ref(null)
const quizLocked = ref(false)
const quizAnswers = ref([])
const quizResult = ref(null)
const quiz = reactive({ exam: 'cet4', time: '20' })

const filters = bookFilters
const version = ref(0)
const allBooks = computed(() => {
  void version.value
  return books.slice()
})
const myBooks = computed(() => allBooks.value.filter(b => user.data.books[b.id]?.joined && matchFilter(b)))
const discover = computed(() => {
  void discoverSeed.value
  return allBooks.value.filter(b => !user.data.books[b.id]?.joined && matchFilter(b)).slice(0, 6)
})
const mainBook = computed(() => bookById(user.mainBook))

function matchFilter(b) {
  const k = keyword.value.trim()
  if (filter.value !== '全部' && b.type !== filter.value) return false
  if (k && !b.name.includes(k) && !b.short.includes(k)) return false
  return true
}
function isJoined(id) { return !!user.data.books[id]?.joined }
function isMain(id) { return !!user.data.books[id]?.main }
function statOf(b) { return bookStats(user.data, b, words) }
function masteryOf(w) { return Math.round(user.data.progress[w.id]?.mastery || 0) }
function masteryTone(w) {
  const m = masteryOf(w)
  return m >= 85 ? 'primary' : m >= 60 ? '' : m >= 30 ? 'gold' : 'accent'
}
const detailWords = computed(() => {
  if (!detailBook.value) return []
  const k = detailKeyword.value.trim().toLowerCase()
  return wordsByBook(detailBook.value.id).filter(w => !k || w.word.toLowerCase().includes(k) || w.cn.includes(k))
})

function refreshDiscover() {
  discoverSeed.value++
  keyword.value = ''
  ElMessage.success('已刷新推荐')
}
function joinBook(b) {
  if (!b) return
  user.data.books[b.id] = { joined: true, main: !user.mainBook, addedAt: Date.now() }
  user.persist()
  ElMessage.success('已加入「' + b.short + '」')
}
async function setMain(b) {
  Object.keys(user.data.books).forEach(id => { if (user.data.books[id]) user.data.books[id].main = false })
  user.data.books[b.id].main = true
  user.persist()
  ElMessage.success('已设为主修词书')
}
async function removeBook(b) {
  try {
    await ElMessageBox.confirm('移出后学习记录仍会保留，重新加入可继续进度。', '移出「' + b.short + '」', { confirmButtonText: '移出', cancelButtonText: '取消', type: 'warning' })
    user.data.books[b.id].joined = false
    user.data.books[b.id].main = false
    user.persist()
    ElMessage.success('已移出')
  } catch (e) { /* cancel */ }
}
function startBook(b) {
  try {
    study.start({ mode: 'recognize', source: 'plan', bookId: b.id, size: 20 })
    router.push('/learn')
  } catch (e) { ElMessage.warning(e.message) }
}
function goDetail(b) {
  if (!b || !b.id) return
  router.push('/books/' + b.id)
}

const bookForm = reactive({ name: '', type: '自定义', desc: '', raw: '' })
const parsedWords = computed(() => {
  const lines = bookForm.raw.split('\n').map(s => s.trim()).filter(Boolean)
  return lines.map(line => {
    if (line.includes('|')) {
      const [word, phonetic, pos, cn] = line.split('|').map(s => s.trim())
      return { word, phonetic, pos, cn }
    }
    const i = line.search(/\s/)
    if (i < 0) return { word: line, cn: '（待补充释义）' }
    return { word: line.slice(0, i), cn: line.slice(i + 1).trim() }
  }).filter(x => /^[a-zA-Z][a-zA-Z\s'’-]*$/.test(x.word.trim()))
})
const bookRules = {
  name: [{ required: true, message: '请输入词书名称', trigger: 'blur' }],
  raw: [{ required: true, message: '请粘贴至少一个词条', trigger: 'blur' }]
}
function openCreate() {
  dialogMode.value = 'create'
  Object.assign(bookForm, { name: '', type: '自定义', desc: '', raw: '' })
  bookDialog.value = true
}
function openImport() {
  dialogMode.value = 'import'
  Object.assign(bookForm, { name: '导入词书 ' + new Date().toLocaleDateString('zh-CN'), type: '自定义', desc: '从文本导入的自建词书', raw: '' })
  bookDialog.value = true
}
async function submitBook() {
  try { await bookFormRef.value.validate() } catch (e) { return }
  if (!parsedWords.value.length) return ElMessage.warning('没有识别到有效英文词条')
  const b = createCustomBook({ name: bookForm.name, desc: bookForm.desc, type: bookForm.type, words: parsedWords.value })
  user.data.books[b.id] = { joined: true, main: false, addedAt: Date.now() }
  user.persist()
  version.value++
  bookDialog.value = false
  ElMessage.success('已创建「' + b.short + '」，共 ' + b.total + ' 词')
}
async function deleteCustom(b) {
  try {
    await ElMessageBox.confirm('删除后该词书与其中词条将从本地移除，学习记录无法恢复。', '删除自建词书', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    removeCustomBook(b.id)
    delete user.data.books[b.id]
    user.persist()
    detailVisible.value = false
    const idx = books.findIndex(x => x.id === b.id)
    if (idx >= 0) books.splice(idx, 1)
    version.value++
    ElMessage.success('已删除')
  } catch (e) { /* cancel */ }
}

const currentQuestion = computed(() => quizQuestions.value[quizIndex.value] || { word: {}, options: [] })

// 从四级 → GRE 分四层抽题，保证测试能区分基础与高阶词汇量
function buildQuizQuestions() {
  const bands = [
    { ids: ['cet4'], n: 3, difficulty: 1 },
    { ids: ['cet6', 'kaoyan'], n: 3, difficulty: 2 },
    { ids: ['ielts', 'toefl', 'bec'], n: 2, difficulty: 3 },
    { ids: ['gre', 'academic'], n: 2, difficulty: 4 }
  ]
  const used = new Set()
  const list = []
  bands.forEach(band => {
    let pool = words.filter(w => band.ids.includes(w.bookId) && !used.has(w.id))
    if (pool.length < band.n) pool = words.filter(w => !used.has(w.id))
    shuffle(pool).slice(0, band.n).forEach(w => {
      used.add(w.id)
      const seen = new Set([w.cn])
      const distractors = []
      shuffle(words.filter(x => x.id !== w.id)).forEach(x => {
        if (distractors.length >= 3 || seen.has(x.cn)) return
        seen.add(x.cn)
        distractors.push({ id: x.id, text: x.cn })
      })
      list.push({
        word: w,
        options: shuffle([{ id: w.id, text: w.cn }, ...distractors]),
        difficulty: band.difficulty
      })
    })
  })
  return list.slice(0, 10)
}

function startQuiz() {
  const list = buildQuizQuestions()
  if (list.length < 5) {
    ElMessage.warning('词库题量不足，暂时无法完成测试')
    return
  }
  quizQuestions.value = list
  quizIndex.value = 0
  quizCorrect.value = 0
  quizPicked.value = null
  quizLocked.value = false
  quizAnswers.value = []
  quizResult.value = null
  quizStage.value = 'test'
}

function answerQuiz(option) {
  if (quizLocked.value) return
  const q = currentQuestion.value
  const right = option.id === q.word.id
  quizPicked.value = option.id
  quizLocked.value = true
  quizAnswers.value.push({ difficulty: q.difficulty, correct: right })
  if (right) quizCorrect.value++
}

function nextQuiz() {
  if (!quizLocked.value) return
  if (quizIndex.value < quizQuestions.value.length - 1) {
    quizIndex.value++
    quizPicked.value = null
    quizLocked.value = false
    return
  }
  finishQuiz()
}

function optionClass(option) {
  if (!quizLocked.value) return ''
  if (option.id === currentQuestion.value.word.id) return 'right'
  if (option.id === quizPicked.value) return 'wrong'
  return 'dim'
}

function finishQuiz() {
  const total = quizQuestions.value.length
  const totalWeight = quizAnswers.value.reduce((sum, a) => sum + a.difficulty, 0)
  const gotWeight = quizAnswers.value.reduce((sum, a) => sum + (a.correct ? a.difficulty : 0), 0)
  const ratio = totalWeight ? gotWeight / totalWeight : 0
  const estimate = Math.round((600 + ratio * 6400) / 100) * 100
  const levelLabel = estimate < 2000 ? '基础水平' : estimate < 3500 ? '进阶水平' : estimate < 5000 ? '较强水平' : '高阶水平'

  const targets = {
    cet4: { id: 'cet4', min: 0, label: '四级' },
    cet6: { id: 'cet6', min: 2800, label: '六级' },
    kaoyan: { id: 'kaoyan', min: 3600, label: '考研' },
    ielts: { id: 'ielts', min: 4300, label: '雅思 / 托福' }
  }
  const target = targets[quiz.exam] || targets.cet4
  const fallback = { cet6: 'cet4', kaoyan: 'cet6', ielts: 'cet6' }
  let book = bookById(target.id) || bookById('cet4')
  let adjusted = false
  if (estimate < target.min) {
    book = bookById(fallback[quiz.exam]) || bookById('cet4')
    adjusted = true
  }

  const newPerDay = ({ 10: 15, 20: 25, 40: 40 })[quiz.time] || 20
  const days = Math.max(7, Math.ceil(book.total / newPerDay))
  const reason = '10 题按难度加权，估算词汇量约 ' + estimate.toLocaleString() + ' 词。' + (
    adjusted
      ? '「' + target.label + '」目标暂时偏难，建议先用「' + book.short + '」补齐高频词，达到 ' + target.min.toLocaleString() + ' 词后再进入目标词书。'
      : '与「' + target.label + '」目标匹配，从「' + book.short + '」开始最稳。'
  )

  quizResult.value = {
    estimate,
    correct: quizCorrect.value,
    total,
    levelLabel,
    book,
    newPerDay,
    days,
    reason
  }
  quizStage.value = 'result'
}

function resetQuiz() {
  quizStage.value = 'intro'
  quizQuestions.value = []
  quizIndex.value = 0
  quizCorrect.value = 0
  quizPicked.value = null
  quizLocked.value = false
  quizAnswers.value = []
  quizResult.value = null
}

function acceptQuiz() {
  const r = quizResult.value
  if (!r) return
  if (!isJoined(r.book.id)) joinBook(r.book)
  user.setPref('dailyGoal', r.newPerDay)
  quizVisible.value = false
  ElMessage.success('计划已生效，每日新词 ' + r.newPerDay)
}
</script>

<style scoped>
.filter-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 4px; flex-wrap: wrap; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-chip {
  height: 30px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--line);
  background: var(--surface); color: var(--muted); font-size: 12px; cursor: pointer;
}
.filter-chip.on { background: var(--ink); color: var(--surface); border-color: var(--ink); }
.book-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.book-card { overflow: hidden; cursor: pointer; transition: transform .18s, box-shadow .18s; }
.book-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.cover { position: relative; height: 118px; padding: 14px 16px; overflow: hidden; }
.small-cover { height: 104px; }
.cover-letter { position: absolute; right: 12px; bottom: -18px; font-family: Georgia, serif; font-size: 96px; color: rgba(255,255,255,.16); line-height: 1; }
.cover-top { display: flex; justify-content: space-between; position: relative; z-index: 1; }
.cover-type { font-size: 10px; color: rgba(255,255,255,.8); border: 1px solid rgba(255,255,255,.35); border-radius: 999px; padding: 1px 7px; }
.cover-main { font-size: 10px; color: #fff; background: rgba(255,255,255,.2); border-radius: 999px; padding: 1px 8px; }
.cover-text { position: absolute; left: 16px; bottom: 12px; z-index: 1; }
.cover-text strong { display: block; color: #fff; font-size: 16px; letter-spacing: .2px; }
.cover-text small { color: rgba(255,255,255,.68); font-size: 10px; }
.book-body { padding: 14px 16px; }
.bar { height: 5px; border-radius: 3px; background: var(--surface-3); overflow: hidden; margin-top: 7px; }
.bar span { display: block; height: 100%; background: var(--primary); border-radius: 3px; transition: width .4s; }
.book-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.hl { color: var(--primary); }
.desc { line-height: 1.5; min-height: 32px; }
.empty-my { padding: 4px 0; }
.quiz-banner { display: flex; align-items: center; gap: 14px; margin-top: 26px; padding: 18px 22px; background: var(--primary-softer); border-color: var(--primary-soft); }
.qb-ico { width: 40px; height: 40px; border-radius: 12px; background: var(--primary); color: #fff; display: grid; place-items: center; }
.quiz-banner strong { font-size: 13px; }
.two-col { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; }
.parse-hint { display: flex; gap: 7px; font-size: 11.5px; color: var(--muted); background: var(--surface-2); padding: 9px 11px; border-radius: 9px; }
.quiz-q { margin-bottom: 16px; }
.quiz-q p { margin-bottom: 7px; }
.quiz-q :deep(.el-radio-group) { display: flex; flex-wrap: wrap; gap: 6px 14px; }
.quiz-result { text-align: center; }
.qr-ico { width: 58px; height: 58px; border-radius: 18px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; margin: 0 auto 12px; }
.quiz-result h3 { font-size: 18px; margin-bottom: 6px; }
.qr-plan { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; padding: 14px; background: var(--surface-2); border-radius: 12px; }
.qr-plan div { display: flex; flex-direction: column; }
.qr-plan strong { font-size: 18px; color: var(--ink); }

/* 词汇量测试：说明、逐题作答与结果 */
.quiz-hero { display: flex; gap: 12px; align-items: flex-start; padding: 14px; margin-bottom: 18px; background: var(--primary-softer); border: 1px solid var(--primary-soft); border-radius: 16px; }
.quiz-hero .qr-ico { width: 44px; height: 44px; border-radius: 13px; margin: 0; flex: 0 0 auto; }
.quiz-hero strong { font-size: 14px; }
.quiz-hero p { margin-top: 3px; line-height: 1.55; }
.quiz-note { margin: 2px 0 14px; font-size: 11.5px; color: var(--muted); }
.quiz-progress { margin-bottom: 18px; }
.qp-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; font-size: 12px; color: var(--muted); }
.qp-head span:first-child { color: var(--ink); font-weight: 600; }
.qp-bar { height: 5px; overflow: hidden; border-radius: 99px; background: var(--surface-2); }
.qp-bar i { display: block; height: 100%; border-radius: 99px; background: var(--primary); transition: width .25s ease; }
.quiz-word { padding: 6px 0 20px; text-align: center; }
.quiz-word h2 { margin: 8px 0 6px; font-family: Georgia, 'Times New Roman', serif; font-size: 42px; font-weight: 600; line-height: 1.1; color: var(--ink); }
.phonetic { font-size: 13px; letter-spacing: .3px; color: var(--muted); }
.quiz-options { display: grid; gap: 8px; }
.quiz-option { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 13px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); color: var(--ink); text-align: left; font-size: 13px; cursor: pointer; transition: border-color .16s, background .16s, opacity .16s; }
.quiz-option:hover:not(:disabled) { border-color: var(--primary); background: var(--primary-softer); }
.quiz-option:disabled { cursor: default; }
.qo-index { display: grid; place-items: center; flex: 0 0 auto; width: 22px; height: 22px; border-radius: 6px; background: var(--surface-2); color: var(--muted); font-size: 11px; font-weight: 700; }
.qo-text { flex: 1; line-height: 1.45; }
.quiz-option.right { border-color: var(--primary); background: var(--primary-softer); color: var(--primary-dark); }
.quiz-option.right .qo-index { background: var(--primary); color: #fff; }
.quiz-option.wrong { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
.quiz-option.wrong .qo-index { background: var(--accent); color: #fff; }
.quiz-option.dim { opacity: .5; }
.quiz-feedback { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; font-size: 12px; }
.quiz-feedback .ok { color: var(--primary-dark); font-weight: 600; }
.quiz-feedback .bad { color: var(--accent); font-weight: 600; }
.quiz-estimate { display: flex; align-items: baseline; justify-content: center; gap: 5px; margin: 2px 0; }
.quiz-estimate strong { font-size: 48px; line-height: 1; letter-spacing: -1.5px; color: var(--ink); }
.quiz-estimate span { font-size: 13px; color: var(--muted); }
.quiz-level { margin-bottom: 16px; font-size: 12px; font-weight: 600; color: var(--primary-dark); }
.quiz-rec { padding: 13px 15px; text-align: left; background: var(--surface-2); border: 1px solid var(--line); border-radius: 14px; }
.quiz-rec h3 { margin: 5px 0 4px; font-size: 17px; }
.quiz-rec p { line-height: 1.55; }

@media (max-width: 560px) {
  .quiz-word h2 { font-size: 36px; }
  .quiz-result .row { flex-direction: column-reverse; }
  .quiz-result .row .el-button { width: 100%; margin-left: 0; }
  .qr-plan { gap: 6px; padding: 12px 8px; }
  .qr-plan strong { font-size: 16px; }
}
.detail-head { border-radius: 16px; padding: 18px; display: flex; justify-content: space-between; overflow: hidden; position: relative; }
.detail-letter { font-family: Georgia, serif; font-size: 82px; color: rgba(255,255,255,.2); line-height: 1; }
.detail-list { margin-top: 16px; }
.d-word { display: flex; align-items: center; gap: 10px; padding: 10px 2px; border-bottom: 1px dashed var(--line); cursor: pointer; }
.d-word .en { font-family: Georgia, serif; font-size: 16px; font-weight: 600; }
.d-word:hover { background: var(--surface-2); }
@media (max-width: 1000px) { .book-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .book-grid { grid-template-columns: 1fr; } .two-col { grid-template-columns: 1fr; } }
</style>
