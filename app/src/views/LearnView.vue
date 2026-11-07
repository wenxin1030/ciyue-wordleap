<template>
  <div class="learn">
    <!-- ============ 设置 / 开始 ============ -->
    <div v-if="!study.session && !study.result" class="page setup">
      <div class="page-head">
        <div>
          <h1>今日学习</h1>
          <p>选一种节奏开始。系统会按遗忘曲线把新词与到期复习混排，避免一次记太多。</p>
        </div>
        <div class="row gap8">
          <span class="chip primary"><AppIcon name="flame" :size="12" /> 连续 {{ study.streak }} 天</span>
          <span class="chip"><AppIcon name="refresh" :size="12" /> 待复习 {{ study.dueList.length }}</span>
        </div>
      </div>

      <div v-if="resumeInfo" class="resume card">
        <span class="resume-ico"><AppIcon name="timer" :size="20" /></span>
        <div class="grow">
          <strong>上次还剩 {{ resumeInfo.left }} 个词没学完</strong>
          <p class="tiny muted">队列已保存 · {{ resumeInfo.modeLabel }} · 从第 {{ resumeInfo.idx + 1 }} 个继续</p>
        </div>
        <el-button round @click="dropResume">放弃</el-button>
        <el-button type="primary" round @click="resumeLast">继续上次</el-button>
      </div>

      <div class="setup-grid">
        <section class="card card-pad">
          <h2 class="mb12">选择学习方式</h2>
          <div class="mode-cards">
            <button v-for="m in modes" :key="m.key" class="mode-card" :class="{ active: mode === m.key }" @click="mode = m.key">
              <span class="m-ico"><AppIcon :name="m.icon" :size="20" /></span>
              <div>
                <strong>{{ m.name }}</strong>
                <p class="tiny muted">{{ m.desc }}</p>
              </div>
              <span v-if="mode === m.key" class="tick"><AppIcon name="check" :size="12" /></span>
            </button>
          </div>

          <h2 class="mt24 mb12">本轮设置</h2>
          <div class="field">
            <label>词书</label>
            <el-select v-model="bookId" placeholder="全部词书" style="width: 240px">
              <el-option label="全部词书（混合）" value="" />
              <el-option v-for="b in joinedBooks" :key="b.id" :label="b.short" :value="b.id" />
            </el-select>
          </div>
          <div class="field">
            <label>本轮词数</label>
            <el-radio-group v-model="size">
              <el-radio-button :value="10">10 词</el-radio-button>
              <el-radio-button :value="20">20 词</el-radio-button>
              <el-radio-button :value="30">30 词</el-radio-button>
            </el-radio-group>
          </div>
          <div class="field">
            <label>取词来源</label>
            <el-radio-group v-model="source">
              <el-radio-button value="plan">智能计划</el-radio-button>
              <el-radio-button value="review">只复习到期</el-radio-button>
              <el-radio-button value="wrong">错词强化</el-radio-button>
            </el-radio-group>
          </div>

          <div class="start-row">
            <el-button type="primary" size="large" round class="start-btn" @click="begin">
              <AppIcon name="play" :size="15" /> 开始本轮 · 约 {{ estMin }} 分钟
            </el-button>
            <span class="tiny muted">支持快捷键：空格显示答案，1 / 2 / 3 评价</span>
          </div>
        </section>

        <aside class="setup-side">
          <section class="card card-pad">
            <h3 class="mb12">今日任务</h3>
            <div v-for="t in study.tasks" :key="t.key" class="mini-task">
              <span class="mt-ico" :class="{ done: t.finished }"><AppIcon :name="t.finished ? 'check' : 'clock'" :size="12" /></span>
              <span class="grow tiny">{{ t.title }}</span>
              <span class="tiny num muted">{{ t.done }}/{{ t.target }}</span>
            </div>
            <div class="goal-box mt16">
              <div class="between tiny muted"><span>每日目标</span><span class="num">{{ todayDone }} / {{ user.prefs.dailyGoal }}</span></div>
              <div class="goal-bar"><span :style="{ width: Math.min(100, todayDone / user.prefs.dailyGoal * 100) + '%' }"></span></div>
            </div>
          </section>

          <section class="card card-pad tip-card">
            <AppIcon name="sparkles" :size="18" />
            <div>
              <strong>为什么混排更有效？</strong>
              <p class="tiny">新词建立初始痕迹，到期词在遗忘临界点被重新激活。交错练习比一次性背 50 个新词留存率高约 40%。</p>
            </div>
          </section>

          <section class="card card-pad">
            <h3 class="mb12">词书速览</h3>
            <div v-for="b in joinedBooks" :key="b.id" class="mini-book">
              <span class="mb-badge" :style="{ background: gradMap[b.grad] }">{{ b.letter }}</span>
              <span class="grow tiny">{{ b.short }}</span>
              <span class="tiny muted num">{{ bookStat(b).mastered }}/{{ bookStat(b).total }}</span>
            </div>
          </section>
        </aside>
      </div>
    </div>

    <!-- ============ 学习进行中 ============ -->
    <div v-else-if="study.session && study.session.phase !== 'done'" class="study-wrap">
      <div class="study-top">
        <button class="back" @click="confirmExit"><AppIcon name="arrow-left" :size="17" /></button>
        <div class="book-tag">
          <span class="mini-logo serif">Aa</span>
          <div>
            <strong>{{ bookName }}</strong>
            <small class="muted">{{ modeLabel }} · 第 {{ study.session.idx + 1 }} / {{ study.session.queue.length }} 个</small>
          </div>
        </div>
        <div class="top-progress"><span :style="{ width: progressPct + '%' }"></span></div>
        <span class="tiny muted num">{{ study.session.idx }} / {{ study.session.queue.length }}</span>
        <span class="timer"><AppIcon name="clock" :size="14" /> {{ elapsedText }}</span>
        <el-button round @click="confirmExit"><AppIcon name="close" :size="14" /> 结束本轮</el-button>
      </div>

      <div class="study-grid">
        <section class="word-card card" :class="{ revealed: isReveal }">
          <div class="word-meta">
            <div class="row gap6 wrap">
              <span class="chip primary">{{ word.pos }}</span>
              <span v-for="t in word.tags" :key="t" class="chip">{{ t }}</span>
              <span class="chip gold">{{ bookShort }}</span>
            </div>
            <span class="tiny muted">本轮第 {{ study.session.idx + 1 }} 个</span>
          </div>

          <template v-if="mode === 'recognize' || isReveal">
            <h1 class="en big-word">{{ word.word }}</h1>
            <div class="row gap10 mt8">
              <span class="phonetic">{{ word.phonetic }}</span>
              <button class="play-btn" @click="speak(word.word)"><AppIcon name="volume" :size="15" /></button>
              <span class="tiny muted">点击朗读</span>
              <span v-if="combo >= 2" class="combo"><AppIcon name="zap" :size="12" /> 连击 ×{{ combo }}</span>
            </div>
          </template>
          <template v-else>
            <div class="listen-block">
              <button class="big-play" @click="speak(word.word)">
                <AppIcon name="volume" :size="30" />
              </button>
              <p class="muted small mt12">{{ mode === 'listen' ? '点击播放，听清后拼写这个单词' : '根据中文释义拼写单词' }}</p>
              <h2 class="prompt-cn">{{ word.cn }}</h2>
              <p class="tiny muted">{{ word.pos }} · {{ word.phonetic }}</p>
            </div>
          </template>

          <div v-if="mode === 'recognize'" class="options">
            <button
              v-for="(o, i) in options" :key="o.id"
              class="option"
              :class="{
                right: isReveal && o.id === word.id,
                wrong: isReveal && selected === o.id && o.id !== word.id,
                picked: selected === o.id
              }"
              :disabled="isReveal"
              @click="choose(o)"
            >
              <span class="opt-key">{{ 'ABCD'[i] }}</span>
              <span class="grow">{{ o.text }}</span>
              <AppIcon v-if="isReveal && o.id === word.id" name="check" :size="15" />
              <AppIcon v-else-if="isReveal && selected === o.id" name="close" :size="15" />
            </button>
          </div>

          <div v-if="mode === 'recognize' && !isReveal" class="answer-tip">
            <AppIcon name="sparkles" :size="16" />
            <div>
              <strong>先凭印象选一个</strong>
              <p class="tiny muted">答完会展示例句、词根与常用搭配；选错也没关系，系统会把它排到明天的复习队列。</p>
            </div>
          </div>

          <div v-if="mode !== 'recognize' && !isReveal" class="spell-row">
            <el-input
              ref="spellInput" v-model="typed" size="large" class="spell-input"
              :placeholder="mode === 'listen' ? '听音后输入单词' : '输入英文拼写'"
              @keyup.enter="submitSpell"
            >
              <template #prefix><AppIcon name="edit" :size="15" /></template>
            </el-input>
            <el-button type="primary" size="large" round :disabled="!typed.trim()" @click="submitSpell">检查</el-button>
          </div>

          <div v-if="isReveal" class="reveal">
            <div class="divider-dash"></div>
            <h2 class="meaning">{{ word.pos }} {{ word.cn }}</h2>
            <p class="en-def muted">{{ word.en }}</p>
            <div class="example">
              <p class="en ex" v-html="highlight(word.example)"></p>
              <p class="tiny muted mt4">{{ word.exampleCn }}</p>
            </div>
            <div v-if="word.root" class="root"><AppIcon name="sparkles" :size="14" /><span><strong>词根记忆 </strong>{{ word.root }}</span></div>
            <div class="row wrap gap6 mt12">
              <span v-for="c in word.collocations" :key="c" class="chip outline">{{ c }}</span>
            </div>
          </div>

          <div v-if="!isReveal" class="word-hint">
            <button class="hint-link" @click="study.reveal()">不认识？直接看答案</button>
            <span class="tiny muted">按空格显示释义</span>
          </div>

          <div v-if="isReveal" class="rate-row">
            <button class="rate again" @click="rate(0)">
              <strong>不认识</strong><span class="tiny">10 分钟后重来</span><kbd>1</kbd>
            </button>
            <button class="rate hard" @click="rate(1)">
              <strong>有点模糊</strong><span class="tiny">明天再见一次</span><kbd>2</kbd>
            </button>
            <button class="rate good" @click="rate(2)">
              <strong>认识</strong><span class="tiny">按曲线延后复习</span><kbd>3</kbd>
            </button>
          </div>

          <div class="word-foot">
            <span class="tiny muted">{{ mode === 'recognize' ? '先选释义，再评价记忆程度' : '拼写检查后，评价记忆程度' }}</span>
            <span v-if="combo >= 2" class="tiny muted">已连续答对 {{ combo }} 个 · 连击 ×{{ combo }}</span>
          </div>
        </section>

        <aside class="study-side">
          <section class="card card-pad">
            <div class="between mb8"><strong class="small">本轮队列</strong><span class="tiny muted">剩余 {{ study.session.queue.length - study.session.idx - 1 }}</span></div>
            <div class="queue">
              <div
                v-for="(id, i) in queueView" :key="id + i"
                class="q-item" :class="{ done: i < study.session.idx, current: i === study.session.idx }"
              >
                <span class="q-idx">{{ i < study.session.idx ? '✓' : i + 1 }}</span>
                <span class="q-word en">{{ i > study.session.idx + 3 ? '···' : wordOf(id).word }}</span>
                <span v-if="i === study.session.idx" class="q-now">当前</span>
              </div>
            </div>
            <p class="tiny muted center mt8">按遗忘曲线动态调整顺序</p>
          </section>

          <section class="card card-pad center">
            <RingProgress :value="currentMastery" :size="104" :stroke="9" :color="masteryColor">
              <strong class="num">{{ currentMastery }}<span class="pct">%</span></strong>
            </RingProgress>
            <p class="small mt8">本词掌握度</p>
            <p class="tiny muted">{{ masteryText }}</p>
          </section>

          <section class="card card-pad">
            <h3 class="mb8">快捷操作</h3>
            <div class="pref-row">
              <span class="small">发音方式</span>
              <span class="chip">点击朗读</span>
            </div>
            <div class="pref-row">
              <span class="small">自动显示释义</span>
              <el-switch v-model="autoReveal" />
            </div>
            <div class="pref-row">
              <span class="small">答题音效</span>
              <el-switch :model-value="user.prefs.sound" @change="toggleSound" />
            </div>
            <el-button class="mt8" plain style="width: 100%" @click="ui.openWord(word)">查看完整词条</el-button>
          </section>
        </aside>
      </div>
    </div>

    <!-- ============ 结果页 ============ -->
    <div v-else class="page result-page">
      <section class="card result-card">
        <div class="confetti c1"></div><div class="confetti c2"></div><div class="confetti c3"></div>
        <div class="result-head">
          <RingProgress :value="result.accuracy" :size="120" :stroke="11" :color="result.accuracy >= 80 ? 'var(--primary)' : 'var(--gold)'">
            <strong class="num">{{ result.accuracy }}<span class="pct">%</span></strong>
          </RingProgress>
          <div>
            <span class="chip primary">本轮完成 · {{ result.mode === 'spell' ? '拼写' : result.mode === 'listen' ? '听音' : '认词' }}</span>
            <h1 class="mt8">{{ resultTitle }}</h1>
            <p class="muted">{{ resultDesc }}</p>
          </div>
        </div>

        <div class="result-stats">
          <div><span class="tiny muted">学习词数</span><strong class="num">{{ result.total }}</strong></div>
          <div><span class="tiny muted">答对</span><strong class="num">{{ result.correct }}</strong></div>
          <div><span class="tiny muted">新词 / 复习</span><strong class="num">{{ result.newCount }} / {{ result.reviewCount }}</strong></div>
          <div><span class="tiny muted">最高连击</span><strong class="num">×{{ result.maxCombo }}</strong></div>
          <div><span class="tiny muted">获得经验</span><strong class="num">+{{ result.xpGained }}</strong></div>
          <div><span class="tiny muted">用时</span><strong class="num">{{ result.minutes }} 分</strong></div>
        </div>

        <div class="xp-bar">
          <div class="between tiny muted"><span>Lv.{{ user.levelInfo.lv }} {{ user.levelInfo.title }}</span><span>距下一级还差 {{ user.levelInfo.remain }} exp</span></div>
          <div class="bar"><span :style="{ width: user.levelInfo.pct + '%' }"></span></div>
        </div>

        <div v-if="result.unlocked && result.unlocked.length" class="unlocked">
          <p class="small mb8"><AppIcon name="award" :size="14" /> 解锁新成就</p>
          <div class="row gap10 wrap">
            <span v-for="a in result.unlocked" :key="a.id" class="chip gold"><AppIcon :name="a.icon" :size="12" /> {{ a.name }}</span>
          </div>
        </div>

        <div class="result-actions">
          <el-button size="large" round @click="$router.push('/dashboard')">回到仪表盘</el-button>
          <el-button size="large" round @click="$router.push('/stats')">查看学习报告</el-button>
          <el-button size="large" round @click="shareVisible = true"><AppIcon name="share" :size="14" /> 生成战报</el-button>
          <el-button type="primary" size="large" round @click="again">再来一轮</el-button>
        </div>
      </section>

      <el-dialog v-model="shareVisible" title="本轮学习战报" width="420px" align-center append-to-body>
        <div class="battle-poster">
          <div class="bp-brand"><span class="bp-logo serif">Aa</span><div><strong>词跃</strong><small>WORDLEAP</small></div></div>
          <span class="chip primary" style="margin-top: 16px">{{ modeLabel }} · 本轮完成</span>
          <h2>今天又完成了 {{ result.total }} 个词</h2>
          <p class="bp-slogan">让每个单词，都在该忘记之前重逢</p>
          <div class="bp-stats">
            <div><strong class="num">{{ result.accuracy }}%</strong><span>正确率</span></div>
            <div><strong class="num">{{ result.total }}</strong><span>学习词数</span></div>
            <div><strong class="num">×{{ result.maxCombo }}</strong><span>最高连击</span></div>
          </div>
          <div class="bp-foot"><span>{{ todayKey() }}</span><span>+{{ result.xpGained }} exp</span></div>
        </div>
        <el-button type="primary" round style="width: 100%; margin-top: 14px" @click="shareResultPoster"><AppIcon name="share" :size="14" /> 分享战报</el-button>
        <div class="poster-actions">
          <el-button round @click="saveResultPoster"><AppIcon name="download" :size="14" /> 保存图片</el-button>
          <el-button round @click="copyResultPoster"><AppIcon name="copy" :size="14" /> 复制文案</el-button>
        </div>
        <p class="tiny muted poster-hint">手机端会打开系统分享面板；电脑端会保存图片，可直接发送到微信、QQ 或邮件。</p>
      </el-dialog>

      <div class="result-tip card card-pad">
        <AppIcon name="sparkles" :size="18" />
        <p class="small" v-if="weakCount > 0">下一轮建议：优先复习刚刚评为「不认识 / 模糊」的 {{ weakCount }} 个词，间隔约 10 分钟到 1 天。也可以去听写擂台用听写巩固拼写。</p>
        <p class="small" v-else>下一轮建议：本轮所有词都评为「认识」，明天按遗忘曲线再复习一次即可。也可以去听写擂台用拼写检验记忆。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '../components/common/AppIcon.vue'
import RingProgress from '../components/common/RingProgress.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { useUiStore } from '../stores/ui'
import { speak } from '../composables/useSpeech'
import { setSoundEnabled, sfx } from '../utils/sound'
import { words, wordMap } from '../mock/words'
import { bookById, gradMap } from '../mock/books'
import { bookStats } from '../utils/stats'
import { shuffle, mmss, todayKey } from '../utils/format'
import { sharePoster, downloadPoster, copyText } from '../utils/poster'

const user = useUserStore()
const study = useStudyStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const modes = [
  { key: 'recognize', name: '认词模式', desc: '看单词选释义，建立第一印象', icon: 'book-open' },
  { key: 'spell', name: '拼写模式', desc: '看中文拼英文，强化输出', icon: 'edit' },
  { key: 'listen', name: '听音模式', desc: '听发音拼写，训练听力', icon: 'headphones' }
]
const mode = ref('recognize')
const bookId = ref('')
const size = ref(20)
const source = ref('plan')
const typed = ref('')
const selected = ref('')
const autoReveal = ref(false)
const spellInput = ref()
const elapsed = ref(0)
const optCache = new Map()
let timer = null

const joinedBooks = computed(() => user.joinedBooks.map(id => bookById(id)).filter(Boolean))
const bookName = computed(() => {
  const id = study.session?.bookId
  return id ? (bookById(id)?.short || id) : '混合词书'
})
const bookShort = computed(() => {
  const id = word.value?.bookId
  return id ? (bookById(id)?.short || id) : ''
})
const word = computed(() => study.currentWord || {})
const modeLabel = computed(() => modes.find(m => m.key === mode.value)?.name || '认词模式')
const isReveal = computed(() => study.session?.phase === 'reveal' || study.session?.phase === 'done')
const combo = computed(() => study.session?.combo || 0)
const progressPct = computed(() => study.session ? ((study.session.idx) / study.session.queue.length) * 100 : 0)
const elapsedText = computed(() => mmss(elapsed.value))
const options = computed(() => (word.value.id ? optionsFor(word.value) : []))
const queueView = computed(() => {
  if (!study.session) return []
  const start = Math.max(0, study.session.idx - 2)
  return study.session.queue.slice(start, start + 8)
})
const currentMastery = computed(() => Math.round(user.data?.progress[word.value.id]?.mastery || 0))
const masteryColor = computed(() => currentMastery.value >= 85 ? 'var(--primary)' : currentMastery.value >= 60 ? 'var(--primary-light)' : currentMastery.value >= 30 ? 'var(--gold)' : 'var(--accent)')
const masteryText = computed(() => {
  const s = user.data?.progress[word.value.id]
  if (!s || !s.seen) return '新词 · 第一次见面'
  return '已复习 ' + s.reps + ' 次 · ' + (s.wrong ? '错 ' + s.wrong + ' 次' : '暂无错误')
})
const todayDone = computed(() => {
  const r = study.todayRecord
  return (r.newCount || 0) + (r.reviewCount || 0)
})
const estMin = computed(() => Math.max(3, Math.round(size.value * 0.35)))
const result = computed(() => study.result || {})
const shareVisible = ref(false)
const weakCount = computed(() => result.value.weakCount || 0)
const resultTitle = computed(() => {
  if (!result.value.total) return '这一轮结束'
  return result.value.accuracy >= 90 ? '记忆状态很好' : result.value.accuracy >= 70 ? '稳步推进中' : '正好发现了薄弱点'
})
const resultDesc = computed(() => {
  if (!result.value.total) return '没有完成的词，下次可以从 10 个开始。'
  return '本轮共复习 ' + result.value.total + ' 词，' + (result.value.accuracy >= 80 ? '保持率高于你的平均水平。' : '错词已加入错词本，建议明天再复习一次。')
})
const resumeInfo = computed(() => {
  const r = user.data?.resume
  if (!r || !r.queue?.length) return null
  return {
    left: Math.max(0, r.queue.length - (r.idx || 0)),
    idx: r.idx || 0,
    modeLabel: modes.find(m => m.key === r.mode)?.name || '认词模式'
  }
})

function optionsFor(w) {
  if (optCache.has(w.id)) return optCache.get(w.id)
  const same = words.filter(x => x.id !== w.id && x.pos === w.pos)
  const rest = words.filter(x => x.id !== w.id && x.pos !== w.pos)
  const others = shuffle(same).slice(0, 3)
  if (others.length < 3) others.push(...shuffle(rest).slice(0, 3 - others.length))
  const list = shuffle([w, ...others]).map(x => ({ id: x.id, text: x.cn }))
  optCache.set(w.id, list)
  return list
}
function wordOf(id) { return wordMap[id] || {} }
function bookStat(b) { return bookStats(user.data, b, words) }
function highlight(text = '') {
  if (!word.value.word) return text
  const target = word.value.word.toLowerCase()
  const lower = text.toLowerCase()
  let out = ''
  let i = 0
  while (i < text.length) {
    const j = lower.indexOf(target, i)
    if (j < 0) { out += text.slice(i); break }
    out += text.slice(i, j) + '<em>' + text.slice(j, j + target.length) + '</em>'
    i = j + target.length
  }
  return out
}

function begin() {
  try {
    study.start({ mode: mode.value, source: source.value, bookId: bookId.value || null, size: size.value })
    resetRound()
    ElMessage.success('开始本轮学习')
  } catch (e) {
    ElMessage.warning(e.message || '暂时没有可学习的单词')
  }
}
function resumeLast() {
  if (study.resume()) {
    mode.value = study.session.mode
    startTimer()
  }
}
function dropResume() {
  delete user.data.resume
  user.persist()
}
function resetRound() {
  selected.value = ''
  typed.value = ''
  elapsed.value = 0
  startTimer()
}
function startTimer() {
  clearInterval(timer)
  timer = setInterval(() => { elapsed.value++ }, 1000)
}
function choose(o) {
  if (isReveal.value) return
  selected.value = o.id
  const ok = o.id === word.value.id
  study.answerQuestion(ok)
  if (autoReveal.value) study.reveal()
}
function submitSpell() {
  if (isReveal.value || !typed.value.trim()) return
  const ok = typed.value.trim().toLowerCase() === word.value.word.toLowerCase()
  selected.value = ok ? word.value.id : ''
  study.answerQuestion(ok)
  if (!ok && word.value.word) {
    ElMessage({ message: '正确拼写：' + word.value.word, type: 'info', duration: 1600 })
  }
}
function rate(r) {
  if (!study.session || study.session.phase !== 'reveal') return
  study.rate(r)
  if (study.session?.phase === 'done') {
    clearInterval(timer)
    return
  }
  selected.value = ''
  typed.value = ''
  nextTick(() => {
    spellInput.value?.focus?.()
  })
}
function toggleSound(v) {
  user.setPref('sound', v)
  setSoundEnabled(v)
}
async function confirmExit() {
  try {
    await ElMessageBox.confirm('本轮进度已保存，下次可继续。确定要离开吗？', '结束本轮', {
      confirmButtonText: '结束本轮', cancelButtonText: '继续学习', type: 'warning'
    })
    clearInterval(timer)
    study.stop()
    router.push('/dashboard')
  } catch (e) { /* stay */ }
}
function resultPosterData() {
  const r = result.value
  return {
    eyebrow: '本轮完成 · ' + modeLabel.value,
    title: '今天又完成了 ' + r.total + ' 个词',
    subtitle: '让每个单词，都在该忘记之前重逢',
    stats: [
      { value: r.accuracy + '%', label: '正确率' },
      { value: r.total, label: '学习词数' },
      { value: '×' + r.maxCombo, label: '最高连击' }
    ],
    footerLeft: todayKey(),
    footerRight: 'Lv.' + user.levelInfo.lv + ' ' + user.levelInfo.title,
    noteTitle: '本轮完成，记忆已更新',
    note: '获得经验 +' + r.xpGained + ' exp，错词已自动加入错词本。',
    ctaTitle: '把今天的记忆，交给明天的复习',
    ctaSub: '系统会按遗忘曲线安排下一次复习，让记住变得更轻松。',
    shareTitle: '词跃 WordLeap · 本轮学习战报'
  }
}
function resultPosterText() {
  const r = result.value
  return [
    '词跃 WordLeap · 本轮学习战报',
    modeLabel.value + ' · 本轮完成',
    '学习 ' + r.total + ' 词 · 正确率 ' + r.accuracy + '% · 最高连击 ×' + r.maxCombo,
    '获得经验 +' + r.xpGained + ' exp',
    '让每个单词，都在该忘记之前重逢。',
    todayKey()
  ].join('\n')
}
async function shareResultPoster() {
  const mode = await sharePoster(resultPosterData(), resultPosterText())
  if (mode === 'shared') ElMessage.success('已打开系统分享面板')
  else if (mode === 'shared-text') ElMessage.success('已打开系统分享面板，选择应用即可发送')
  else if (mode === 'downloaded-copied') ElMessage.success('战报图片已保存，文案已复制，可发送到微信 / QQ')
  else if (mode === 'downloaded') ElMessage.success('战报图片已保存，可发送到微信 / QQ')
}
function saveResultPoster() {
  const name = downloadPoster(resultPosterData())
  ElMessage.success('战报图片已保存：' + name)
}
async function copyResultPoster() {
  const text = resultPosterText()
  const ok = await copyText(text)
  if (ok) ElMessage.success('战报文案已复制')
  else ElMessage.warning('浏览器未允许复制，请手动选择文字')
}

function again() {
  const last = study.result
  study.result = null
  const m = last?.mode || mode.value
  try {
    study.start({ mode: m, source: 'plan', bookId: bookId.value || null, size: size.value })
    mode.value = m
    resetRound()
  } catch (e) {
    ElMessage.warning(e.message)
  }
}

watch(() => study.session?.idx, () => {
  selected.value = ''
  typed.value = ''
  if (study.session?.phase === 'done') return
  const el = document.querySelector('.word-card')
  if (el) el.classList.remove('revealed')
  nextTick(() => {
    spellInput.value?.focus?.()
  })
})

function onKey(e) {
  if (!study.session || study.session.phase === 'done') return
  if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    if (e.key === 'Enter' && mode.value !== 'recognize') submitSpell()
    return
  }
  if (e.code === 'Space') {
    e.preventDefault()
    if (!isReveal.value) study.reveal()
  }
  if (isReveal.value) {
    if (e.key === '1') rate(0)
    if (e.key === '2') rate(1)
    if (e.key === '3') rate(2)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (study.session && study.session.phase !== 'done') {
    mode.value = study.session.mode
    startTimer()
  } else if (route.query.word && !study.session) {
    try {
      study.start({ mode: 'recognize', source: 'plan', size: 10 })
      const id = String(route.query.word)
      if (study.session && wordMap[id]) {
        study.session.queue = [id, ...study.session.queue.filter(x => x !== id)]
        study.session.idx = 0
      }
      startTimer()
    } catch (e) { /* ignore */ }
  } else if (study.result) {
    // 结果页重新进入时保持展示
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearInterval(timer)
})
</script>

<style scoped>
.learn { min-height: calc(100vh - var(--header-h)); }
.setup-grid { display: grid; grid-template-columns: 1fr 320px; gap: 18px; align-items: start; }
.mode-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.mode-card {
  display: flex; gap: 10px; align-items: flex-start; text-align: left;
  padding: 14px; border-radius: 14px; border: 1.5px solid var(--line);
  background: var(--surface); cursor: pointer; position: relative; transition: all .15s;
}
.mode-card:hover { border-color: var(--primary-light); }
.mode-card.active { border-color: var(--primary); background: var(--primary-softer); }
.m-ico { width: 34px; height: 34px; border-radius: 10px; background: var(--surface-2); color: var(--muted); display: grid; place-items: center; flex: 0 0 auto; }
.mode-card.active .m-ico { background: var(--primary); color: #fff; }
.mode-card strong { font-size: 13px; color: var(--ink); }
.mode-card p { margin-top: 2px; line-height: 1.5; }
.tick { position: absolute; right: 10px; top: 10px; width: 18px; height: 18px; border-radius: 50%; background: var(--primary); color: #fff; display: grid; place-items: center; }
.field { display: flex; align-items: center; gap: 18px; margin-bottom: 14px; flex-wrap: wrap; }
.field > label { width: 76px; font-size: 12.5px; color: var(--muted); flex: 0 0 auto; }
.start-row { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; padding-top: 18px; border-top: 1px dashed var(--line); }
.start-btn { align-self: flex-start; height: 46px; padding: 0 30px; }
.setup-side { display: flex; flex-direction: column; gap: 16px; }
.mini-task { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px dashed var(--line); }
.mini-task:last-child { border-bottom: 0; }
.mt-ico { width: 20px; height: 20px; border-radius: 6px; background: var(--surface-2); color: var(--muted); display: grid; place-items: center; }
.mt-ico.done { background: var(--primary-soft); color: var(--primary); }
.goal-box { background: var(--surface-2); border-radius: 12px; padding: 10px 12px; }
.goal-bar { height: 6px; border-radius: 3px; background: var(--surface-3); margin-top: 7px; overflow: hidden; }
.goal-bar span { display: block; height: 100%; background: var(--primary); border-radius: 3px; }
.tip-card { display: flex; gap: 10px; background: var(--primary-softer); border-color: var(--primary-soft); color: var(--primary-dark); }
.tip-card :deep(svg) { flex: 0 0 auto; margin-top: 2px; }
.tip-card strong { font-size: 12.5px; display: block; margin-bottom: 3px; }
.tip-card p { line-height: 1.7; }
.mini-book { display: flex; align-items: center; gap: 9px; padding: 6px 0; }
.mb-badge { width: 24px; height: 24px; border-radius: 7px; color: #fff; display: grid; place-items: center; font-family: Georgia, serif; font-size: 12px; }
.resume { display: flex; align-items: center; gap: 14px; padding: 14px 18px; margin-bottom: 16px; border-style: dashed; }
.resume-ico { width: 38px; height: 38px; border-radius: 11px; background: var(--gold-soft); color: var(--gold); display: grid; place-items: center; }
.resume strong { font-size: 13px; color: var(--ink); }

/* study */
.study-wrap { padding: 16px 26px 40px; max-width: 1280px; margin: 0 auto; }
.study-top { display: flex; align-items: center; gap: 14px; padding: 6px 4px 18px; }
.back { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); display: grid; place-items: center; cursor: pointer; }
.book-tag { display: flex; align-items: center; gap: 9px; }
.mini-logo { width: 30px; height: 30px; border-radius: 9px; background: var(--primary); color: #fff; display: grid; place-items: center; font-size: 13px; }
.book-tag strong { font-size: 12.5px; display: block; line-height: 1.2; }
.book-tag small { font-size: 10px; }
.top-progress { flex: 1; height: 6px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.top-progress span { display: block; height: 100%; background: var(--primary); border-radius: 3px; transition: width .35s; }
.timer { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); padding: 5px 10px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); }
.study-grid { display: grid; grid-template-columns: 1fr 312px; gap: 20px; align-items: start; }
.word-card {
  border-radius: 30px; padding: 28px 34px 20px; min-height: 620px;
  display: flex; flex-direction: column; box-shadow: var(--shadow-lg);
}
.word-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.big-word { font-size: 58px; letter-spacing: -1.5px; line-height: 1.1; margin-top: 18px; }
.phonetic { font-family: Georgia, serif; color: var(--muted); font-size: 15px; }
.play-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--line); background: var(--surface); color: var(--primary); display: grid; place-items: center; cursor: pointer; }
.combo { margin-left: auto; display: inline-flex; align-items: center; gap: 3px; font-size: 11px; color: var(--gold); background: var(--gold-soft); padding: 3px 9px; border-radius: 999px; }
.options { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; margin-top: 24px; }
.option {
  display: flex; align-items: center; gap: 10px; text-align: left;
  padding: 14px 16px; border-radius: 14px; border: 1.5px solid var(--line);
  background: var(--surface); color: var(--text); font-size: 13px; cursor: pointer; transition: all .15s;
}
.option:hover:not(:disabled) { border-color: var(--primary-light); background: var(--primary-softer); }
.option:disabled { cursor: default; }
.option.picked:not(.right):not(.wrong) { border-color: var(--primary); }
.option.right { border-color: var(--primary); background: var(--primary-softer); color: var(--primary-dark); }
.option.wrong { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
.opt-key { width: 24px; height: 24px; border-radius: 7px; background: var(--surface-2); display: grid; place-items: center; font-size: 11px; color: var(--muted); flex: 0 0 auto; }
.option.right .opt-key { background: var(--primary); color: #fff; }
.option.wrong .opt-key { background: var(--accent); color: #fff; }
.answer-tip { display: flex; gap: 10px; margin-top: 26px; padding: 14px 16px; border-radius: 14px; border: 1px dashed var(--line); background: var(--surface-2); color: var(--muted); }
.answer-tip strong { display: block; font-size: 12.5px; color: var(--text); margin-bottom: 3px; }
.answer-tip :deep(svg) { color: var(--gold); flex: 0 0 auto; margin-top: 2px; }
.word-hint { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 24px; }
.hint-link { background: none; border: 0; color: var(--muted); font-size: 12px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.divider-dash { border-top: 1px dashed var(--line); margin: 20px 0 16px; }
.meaning { font-size: 19px; }
.en-def { font-family: Georgia, serif; font-size: 13.5px; margin-top: 3px; }
.example { margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: var(--surface-2); }
.ex { font-size: 15px; color: var(--ink); line-height: 1.65; }
.ex :deep(em) { font-style: normal; color: var(--primary); font-weight: 700; }
.root { display: flex; gap: 8px; margin-top: 12px; font-size: 12px; color: var(--primary-dark); background: var(--primary-softer); padding: 9px 12px; border-radius: 10px; line-height: 1.6; }
.root :deep(svg) { margin-top: 2px; flex: 0 0 auto; }
.rate-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 11px; margin-top: 18px; }
.rate {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 12px 8px; border-radius: 13px; border: 1.5px solid transparent;
  cursor: pointer; position: relative; font-size: 13px;
}
.rate strong { font-size: 13.5px; }
.rate kbd { position: absolute; right: 8px; top: 7px; font-size: 9px; opacity: .6; border: 1px solid currentColor; border-radius: 4px; padding: 0 4px; }
.rate.again { background: var(--accent-soft); color: var(--accent); border-color: transparent; }
.rate.hard { background: var(--gold-soft); color: var(--gold); }
.rate.good { background: var(--primary); color: #fff; }
.rate:hover { transform: translateY(-1px); }
.word-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--line); }
.study-side { display: flex; flex-direction: column; gap: 16px; }
.queue { display: flex; flex-direction: column; gap: 6px; max-height: 296px; overflow: hidden; }
.q-item { display: flex; align-items: center; gap: 9px; padding: 8px 11px; border-radius: 9px; background: var(--surface-2); font-size: 12px; color: var(--muted); }
.q-item.done { background: transparent; color: var(--faint); }
.q-item.current { background: var(--primary); color: #fff; }
.q-idx { width: 18px; font-size: 10.5px; text-align: center; }
.q-word { flex: 1; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.q-now { font-size: 10px; opacity: .8; }
.pref-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px dashed var(--line); }
.pref-row:last-of-type { border-bottom: 0; }
.listen-block { text-align: center; padding: 30px 0 10px; }
.big-play { width: 88px; height: 88px; border-radius: 50%; border: 0; background: var(--primary); color: #fff; display: grid; place-items: center; margin: 0 auto; cursor: pointer; box-shadow: 0 16px 34px -18px var(--primary); }
.prompt-cn { font-size: 20px; margin-top: 20px; }
.spell-row { display: flex; gap: 10px; margin-top: 22px; }
.spell-input :deep(.el-input__wrapper) { border-radius: 13px; height: 48px; }
.spell-input { flex: 1; }

/* result */
.result-page { max-width: 860px; }
.result-card { position: relative; padding: 34px 38px 30px; overflow: hidden; }
.result-head { display: flex; align-items: center; gap: 28px; }
.result-head h1 { font-size: 26px; }
.result-head p { font-size: 13px; margin-top: 4px; }
.result-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-top: 26px; padding: 18px 0; border-top: 1px dashed var(--line); border-bottom: 1px dashed var(--line); }
.result-stats div { display: flex; flex-direction: column; gap: 3px; }
.result-stats strong { font-size: 20px; color: var(--ink); }
.xp-bar { margin-top: 20px; }
.xp-bar .bar { height: 7px; border-radius: 4px; background: var(--surface-3); margin-top: 7px; overflow: hidden; }
.xp-bar .bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-light)); border-radius: 4px; }
.unlocked { margin-top: 20px; padding: 14px; border-radius: 13px; background: var(--gold-soft); }
.unlocked p { display: flex; align-items: center; gap: 5px; color: var(--gold); font-weight: 600; }
.result-actions { position: relative; z-index: 2; display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; flex-wrap: wrap; }
.result-tip { display: flex; gap: 11px; margin-top: 16px; color: var(--muted); line-height: 1.7; }
.result-tip :deep(svg) { flex: 0 0 auto; margin-top: 3px; color: var(--primary); }
.confetti { position: absolute; border-radius: 50%; opacity: .18; pointer-events: none; z-index: 0; }
.c1 { width: 200px; height: 200px; background: var(--gold); right: -70px; top: -90px; }
.c2 { width: 120px; height: 120px; background: var(--primary); right: 90px; bottom: -80px; }
.c3 { width: 60px; height: 60px; background: var(--accent); left: 40%; top: -30px; }

.battle-poster { border-radius: 18px; border: 1px solid var(--line); padding: 20px; background: linear-gradient(160deg, var(--surface), var(--primary-softer)); }
.bp-brand { display: flex; align-items: center; gap: 10px; }
.bp-logo { width: 36px; height: 36px; border-radius: 10px; background: var(--primary); color: #fff; display: grid; place-items: center; font-size: 18px; }
.bp-brand strong { display: block; font-size: 14px; line-height: 1.1; }
.bp-brand small { font-size: 8px; letter-spacing: .16em; color: var(--muted); }
.battle-poster h2 { font-size: 21px; margin: 10px 0 4px; }
.bp-slogan { font-size: 11px; color: var(--muted); }
.bp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 18px 0; padding: 14px 0; border-top: 1px dashed var(--line); border-bottom: 1px dashed var(--line); }
.bp-stats div { display: flex; flex-direction: column; gap: 3px; }
.bp-stats strong { font-size: 20px; color: var(--ink); }
.bp-stats span { font-size: 10px; color: var(--muted); }
.bp-foot { display: flex; justify-content: space-between; gap: 10px; font-size: 10px; color: var(--muted); }
.poster-actions { display: flex; gap: 8px; margin-top: 8px; }
.poster-actions .el-button { flex: 1; margin-left: 0; }
.poster-hint { margin-top: 8px; line-height: 1.55; text-align: center; }

@media (max-width: 1080px) {
  .setup-grid { grid-template-columns: 1fr; }
  .setup-side { display: grid; grid-template-columns: 1fr 1fr; }
  .study-grid { grid-template-columns: 1fr; }
  .study-side { display: grid; grid-template-columns: 1fr 1fr; }
  .study-side > section:first-child { display: none; }
  .big-word { font-size: 48px; }
}
@media (max-width: 720px) {
  .mode-cards { grid-template-columns: 1fr; }
  .options { grid-template-columns: 1fr; }
  .study-wrap { padding: 8px 12px 80px; }
  .study-top { gap: 8px; flex-wrap: wrap; }
  .top-progress { order: 5; flex-basis: 100%; }
  .word-card { padding: 20px; border-radius: 22px; min-height: auto; }
  .big-word { font-size: 38px; }
  .rate-row { grid-template-columns: 1fr; }
  .result-head { flex-direction: column; align-items: flex-start; gap: 16px; }
  .result-stats { grid-template-columns: repeat(3, 1fr); }
  .result-card { padding: 22px; }
  .setup-side { grid-template-columns: 1fr; }
}
</style>
