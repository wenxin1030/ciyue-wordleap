<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>听写擂台</h1>
        <p>60 秒极限听写，用输出检验记忆，看看你能连对多少</p>
      </div>
      <div class="row gap8">
        <span class="chip gold"><AppIcon name="trophy" :size="12" /> 历史最高 {{ arena.best }} 分</span>
        <el-button round @click="rulesVisible = true"><AppIcon name="info" :size="14" /> 比赛规则</el-button>
      </div>
    </div>

    <div class="arena-grid">
      <section class="card arena-card" :class="{ playing: phase === 'playing' }">
        <div v-if="phase === 'idle'" class="idle">
          <div class="arena-emblem">
            <AppIcon name="zap" :size="30" />
            <span class="ring"></span>
          </div>
          <h2>准备好了吗？</h2>
          <p class="small">系统从你已学的词中随机出题，看到中文释义后在 60 秒内拼出英文单词。<br />连对越多，单题得分越高。</p>
          <div class="idle-stats">
            <div><strong class="num">{{ arena.best }}</strong><span>历史最高分</span></div>
            <div><strong class="num">{{ arena.plays }}</strong><span>参赛次数</span></div>
            <div><strong class="num">{{ poolSize }}</strong><span>可出题词汇</span></div>
          </div>
          <el-button type="primary" size="large" round class="start-btn" :disabled="!poolSize" @click="startGame">
            <AppIcon name="play" :size="16" /> 开始挑战
          </el-button>
          <p v-if="!poolSize" class="tiny muted">先去「今日学习」学几个单词，词库有货才能开擂。</p>
        </div>

        <div v-else-if="phase === 'playing'" class="playing">
          <div class="arena-top">
            <div class="timer" :class="{ danger: timeLeft <= 10 }">
              <AppIcon name="timer" :size="15" />
              <strong class="num">{{ timeLeft }}</strong><span>s</span>
            </div>
            <div class="score-box">
              <span class="tiny muted">得分</span>
              <strong class="num">{{ score }}</strong>
            </div>
            <div class="combo-box" :class="{ hot: combo >= 3 }">
              <AppIcon name="flame" :size="13" />
              <span class="num">×{{ combo }}</span>
              <span class="tiny">连击</span>
            </div>
          </div>
          <div class="time-bar"><span :style="{ width: timeLeft / 60 * 100 + '%' }"></span></div>

          <div class="question">
            <span class="chip tiny" :class="curWord.bookId === 'cet4' ? 'primary' : ''">{{ bookName(curWord.bookId) }}</span>
            <h1 class="cn">{{ curWord.cn }}</h1>
            <p class="tiny muted">{{ curWord.pos }} · {{ curWord.tags?.join(' / ') }}</p>
            <p class="hint">首字母 <strong class="serif">{{ curWord.word[0] }}</strong> · 共 {{ curWord.word.length }} 个字母{{ curWord.word.includes(' ') ? '（含空格）' : '' }}</p>
          </div>

          <div class="answer-row" :class="feedback">
            <el-input
              ref="inputRef" v-model="answer" size="large" :disabled="!playing"
              placeholder="输入英文单词后按 Enter" @keyup.enter="submit"
            />
            <el-button type="primary" size="large" round :disabled="!playing" @click="submit">提交</el-button>
            <el-button size="large" round :disabled="!playing" @click="skip">跳过</el-button>
          </div>
          <p class="feedback-line" :class="feedback">
            <template v-if="feedback === 'correct'">正确！+{{ lastGain }} 分{{ combo >= 3 ? ' · 连击加成' : '' }}</template>
            <template v-else-if="feedback === 'wrong'">正确答案：<strong class="serif">{{ curWord.word }}</strong></template>
            <template v-else>提示：答错不扣分，但会中断连击</template>
          </p>

          <div class="queue-strip">
            <span class="tiny muted">本局已答 {{ answered }} 题 · 正确 {{ correctCount }}</span>
            <div class="strip-bar"><span :style="{ width: (answered / 30) * 100 + '%' }"></span></div>
          </div>
        </div>

        <div v-else class="result">
          <span class="result-tag" :class="{ newbest: isNewBest }">{{ isNewBest ? 'NEW RECORD' : 'ROUND COMPLETE' }}</span>
          <h2>本局得分 <em class="num">{{ score }}</em></h2>
          <p class="small">{{ resultLine }}</p>
          <div class="result-stats">
            <div><strong class="num">{{ correctCount }}</strong><span>答对</span></div>
            <div><strong class="num">{{ answered }}</strong><span>总题数</span></div>
            <div><strong class="num">{{ accuracy }}%</strong><span>正确率</span></div>
            <div><strong class="num">{{ maxCombo }}</strong><span>最高连击</span></div>
          </div>
          <div class="reward">
            <AppIcon name="sparkles" :size="14" />
            <span>获得 {{ xpGain }} exp · 历史最高 {{ arena.best }} 分</span>
          </div>
          <div class="row gap10" style="justify-content: center; margin-top: 20px">
            <el-button type="primary" round @click="startGame">再来一局</el-button>
            <el-button round @click="$router.push('/wrong')">查看错词本</el-button>
          </div>
        </div>
      </section>

      <aside class="side-stack">
        <section class="card card-pad">
          <SectionHeader title="擂台榜" sub="本周最高分" />
          <div class="rank-list">
            <div v-for="(p, i) in board" :key="p.name" class="rank" :class="{ me: p.me }">
              <span class="rk" :class="'rk' + (i + 1)">{{ i + 1 }}</span>
              <span class="avatar-sm">{{ p.name.slice(-1) }}</span>
              <span class="grow small">{{ p.name }}<span v-if="p.me" class="chip tiny primary" style="margin-left: 6px">我</span></span>
              <strong class="num small">{{ p.score }}</strong>
            </div>
          </div>
          <p class="tiny muted mt8">榜单为课程演示数据，用于展示竞争与社交激励。</p>
        </section>

        <section class="card card-pad">
          <SectionHeader title="答题技巧" />
          <div class="tips">
            <div class="tip"><span class="tip-ico"><AppIcon name="volume" :size="14" /></span><div><strong class="tiny">先读发音</strong><p class="tiny muted">心里默读一遍音标，拼写正确率更高。</p></div></div>
            <div class="tip"><span class="tip-ico"><AppIcon name="layers" :size="14" /></span><div><strong class="tiny">按词根拆</strong><p class="tiny muted">把长词拆成前缀 + 词根 + 后缀三块。</p></div></div>
            <div class="tip"><span class="tip-ico"><AppIcon name="refresh" :size="14" /></span><div><strong class="tiny">不会就跳</strong><p class="tiny muted">60 秒很宝贵，跳过比卡住更划算。</p></div></div>
          </div>
        </section>

        <section class="card card-pad mini">
          <span class="chip primary">本赛季</span>
          <h3>{{ seasonName }}</h3>
          <p class="tiny muted">距离下一段位还需 {{ nextTierNeed }} 分，段位每周一结算。</p>
          <div class="tier-bar"><span :style="{ width: tierPct + '%' }"></span></div>
          <div class="between tiny muted mt4"><span>{{ currentTier }}</span><span>{{ nextTier }}</span></div>
        </section>
      </aside>
    </div>

    <el-dialog v-model="rulesVisible" title="听写擂台规则" width="440px" align-center>
      <div class="rules">
        <div class="rule"><span class="r-no">01</span><div><strong>限时 60 秒</strong><p class="tiny muted">从已学词中随机抽题，同一局内不重复。</p></div></div>
        <div class="rule"><span class="r-no">02</span><div><strong>连击加分</strong><p class="tiny muted">基础 10 分；连对 3 题起每题额外 +2 分，最高 +10 分。</p></div></div>
        <div class="rule"><span class="r-no">03</span><div><strong>错题回收</strong><p class="tiny muted">答错的词自动进入错词本，赛后可以针对复习。</p></div></div>
        <div class="rule" style="border-bottom: none"><span class="r-no">04</span><div><strong>经验奖励</strong><p class="tiny muted">每局按得分折算经验，最高 120 exp，可计入等级成长。</p></div></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount, nextTick } from 'vue'
import dayjs from 'dayjs'
import AppIcon from '../components/common/AppIcon.vue'
import SectionHeader from '../components/common/SectionHeader.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { words, wordMap } from '../mock/words'
import { books } from '../mock/books'
import { sfx, setSoundEnabled } from '../utils/sound'

const user = useUserStore()
const study = useStudyStore()
const arena = computed(() => user.data.arena || { best: 0, plays: 0 })
const rulesVisible = ref(false)

const pool = computed(() => words.filter(w => (user.data.progress[w.id]?.seen || 0) > 0))
const poolSize = computed(() => pool.value.length)

const phase = ref('idle') // idle | playing | result
const playing = ref(false)
const answer = ref('')
const inputRef = ref(null)
const queue = ref([])
const curIndex = ref(0)
const score = ref(0)
const combo = ref(0)
const maxCombo = ref(0)
const correctCount = ref(0)
const answered = ref(0)
const timeLeft = ref(60)
const feedback = ref('')
const lastGain = ref(0)
const isNewBest = ref(false)
const xpGain = ref(0)
const startBest = ref(0)
let timer = null
let fbTimer = null

const curWord = computed(() => queue.value[curIndex.value] || { word: '', cn: '', pos: '', bookId: 'cet4', tags: [] })
const accuracy = computed(() => answered.value ? Math.round(correctCount.value / answered.value * 100) : 0)
const bookName = id => (books.find(b => b.id === id) || {}).name || '综合词库'
const resultLine = computed(() => {
  if (accuracy.value >= 90) return '手速和记忆都在线，这就是「熟练」的样子。'
  if (accuracy.value >= 70) return '不错，再练几局就能把模糊的词变成本能。'
  return '别灰心，错题已经进入错词本，复习一轮再来。'
})

const board = computed(() => [
  { name: '陈一诺', score: 186 },
  { name: '周子涵', score: 164 },
  { name: '林小满', score: arena.value.best, me: true },
  { name: '赵明宇', score: 118 },
  { name: '吴雨桐', score: 92 }
].sort((a, b) => b.score - a.score))

const seasonName = '2025 秋季赛 · 第 3 周'
const tiers = [{ n: '青铜', min: 0 }, { n: '白银', min: 100 }, { n: '黄金', min: 160 }, { n: '铂金', min: 220 }, { n: '钻石', min: 280 }]
const currentTier = computed(() => [...tiers].reverse().find(t => arena.value.best >= t.min)?.n || '青铜')
const nextTier = computed(() => tiers.find(t => t.min > arena.value.best)?.n || '钻石')
const nextTierNeed = computed(() => {
  const t = tiers.find(t => t.min > arena.value.best)
  return t ? t.min - arena.value.best : 0
})
const tierPct = computed(() => {
  const t = tiers.find(t => t.min > arena.value.best)
  const cur = [...tiers].reverse().find(x => arena.value.best >= x.min)
  if (!t) return 100
  return Math.min(100, Math.round((arena.value.best - (cur?.min || 0)) / (t.min - (cur?.min || 0)) * 100))
})

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function startGame() {
  if (!poolSize.value) return
  clearTimers()
  phase.value = 'playing'
  playing.value = true
  answer.value = ''
  feedback.value = ''
  score.value = 0
  combo.value = 0
  maxCombo.value = 0
  correctCount.value = 0
  answered.value = 0
  timeLeft.value = 60
  curIndex.value = 0
  queue.value = shuffle(pool.value).slice(0, 40)
  startBest.value = arena.value.best
  xpGain.value = 0
  isNewBest.value = false
  nextTick(() => inputRef.value?.focus?.())
  timer = setInterval(() => {
    timeLeft.value -= 1
    if (timeLeft.value <= 0) endGame()
    else if (timeLeft.value <= 5) sfx.tick?.()
  }, 1000)
}

function submit() {
  if (!playing.value || feedback.value) return
  const val = answer.value.trim().toLowerCase()
  if (!val) return
  answered.value += 1
  if (val === curWord.value.word.toLowerCase()) {
    const gain = 10 + Math.min(10, Math.max(0, combo.value - 1) * 2)
    lastGain.value = gain
    score.value += gain
    correctCount.value += 1
    combo.value += 1
    maxCombo.value = Math.max(maxCombo.value, combo.value)
    feedback.value = 'correct'
    sfx.correct()
    if (combo.value >= 3) sfx.combo()
  } else {
    combo.value = 0
    feedback.value = 'wrong'
    sfx.wrong()
    const p = user.data.progress[curWord.value.id] || { seen: 0, correct: 0, wrong: 0, mastery: 0 }
    p.wrong = (p.wrong || 0) + 1
    p.seen = (p.seen || 0) + 1
    p.mastery = Math.max(0, (p.mastery || 0) - 6)
    user.data.progress[curWord.value.id] = p
    user.persist()
  }
  nextQuestion()
}

function skip() {
  if (!playing.value || feedback.value) return
  answered.value += 1
  combo.value = 0
  feedback.value = 'wrong'
  nextQuestion()
}

function nextQuestion() {
  clearTimeout(fbTimer)
  fbTimer = setTimeout(() => {
    feedback.value = ''
    answer.value = ''
    curIndex.value += 1
    if (curIndex.value >= queue.value.length) {
      queue.value = shuffle(pool.value).slice(0, 40)
      curIndex.value = 0
    }
    nextTick(() => inputRef.value?.focus?.())
  }, 700)
}

function endGame() {
  clearTimers()
  playing.value = false
  phase.value = 'result'
  isNewBest.value = score.value > startBest.value
  xpGain.value = Math.min(120, Math.round(score.value * 0.7))
  study.recordArena(score.value, xpGain.value)
  if (isNewBest.value) sfx.levelUp()
}

function clearTimers() {
  if (timer) { clearInterval(timer); timer = null }
  if (fbTimer) { clearTimeout(fbTimer); fbTimer = null }
}
onBeforeUnmount(clearTimers)

function startSound() {
  setSoundEnabled(user.prefs.sound !== false)
}
startSound()
</script>

<style scoped>
.arena-grid { display: grid; grid-template-columns: 1.55fr 1fr; gap: 16px; align-items: start; }
.arena-card { min-height: 560px; padding: 30px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
.arena-card.playing { align-items: stretch; }
.idle { text-align: center; max-width: 480px; }
.arena-emblem { position: relative; width: 92px; height: 92px; margin: 0 auto 16px; border-radius: 30px; background: linear-gradient(150deg, var(--primary), var(--primary-dark)); color: #fff; display: grid; place-items: center; box-shadow: 0 16px 40px -18px var(--primary); }
.arena-emblem .ring { position: absolute; inset: -10px; border-radius: 36px; border: 1px dashed var(--primary-light); opacity: .5; animation: pulse 2.6s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: .45; } 50% { transform: scale(1.04); opacity: .9; } }
.idle h2 { font-size: 24px; margin-bottom: 8px; }
.idle p { line-height: 1.7; }
.idle-stats { display: flex; justify-content: center; gap: 40px; margin: 24px 0; padding: 16px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.idle-stats div { display: flex; flex-direction: column; }
.idle-stats strong { font-size: 22px; color: var(--ink); }
.idle-stats span { font-size: 10px; color: var(--muted); }
.start-btn { min-width: 200px; height: 46px; margin-top: 4px; }
.playing { width: 100%; display: flex; flex-direction: column; }
.arena-top { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.timer { display: flex; align-items: baseline; gap: 3px; padding: 7px 14px; border-radius: 12px; background: var(--surface-2); color: var(--ink); }
.timer strong { font-size: 22px; }
.timer span { font-size: 11px; color: var(--muted); }
.timer.danger { background: #FBEAE4; color: var(--accent); animation: blink 1s steps(2) infinite; }
@keyframes blink { 50% { opacity: .55; } }
.score-box { display: flex; flex-direction: column; align-items: center; }
.score-box strong { font-size: 26px; color: var(--primary); }
.combo-box { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 999px; background: var(--surface-2); color: var(--muted); }
.combo-box span { font-size: 13px; }
.combo-box.hot { background: #FBEAE4; color: var(--accent); }
.time-bar { height: 5px; border-radius: 3px; background: var(--surface-3); margin-top: 14px; overflow: hidden; }
.time-bar span { display: block; height: 100%; background: var(--primary); transition: width 1s linear; }
.question { text-align: center; padding: 30px 0 16px; }
.cn { font-size: 30px; margin: 14px 0 6px; letter-spacing: .5px; }
.hint { font-size: 11.5px; color: var(--muted); margin-top: 10px; }
.answer-row { display: flex; gap: 8px; max-width: 520px; width: 100%; margin: 0 auto; border-radius: 14px; }
.answer-row :deep(.el-input__wrapper) { height: 46px; font-size: 16px; }
.answer-row.correct :deep(.el-input__wrapper) { box-shadow: 0 0 0 2px var(--primary) inset; }
.answer-row.wrong { animation: shake .3s; }
.answer-row.wrong :deep(.el-input__wrapper) { box-shadow: 0 0 0 2px var(--accent) inset; }
@keyframes shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.feedback-line { text-align: center; font-size: 12px; min-height: 20px; margin-top: 12px; color: var(--muted); }
.feedback-line.correct { color: var(--primary); }
.feedback-line.wrong { color: var(--accent); }
.queue-strip { margin-top: auto; padding-top: 20px; }
.strip-bar { height: 4px; border-radius: 2px; background: var(--surface-3); margin-top: 7px; overflow: hidden; }
.strip-bar span { display: block; height: 100%; background: var(--gold); }
.result { text-align: center; max-width: 440px; }
.result-tag { display: inline-block; padding: 4px 12px; border-radius: 999px; background: var(--surface-2); color: var(--muted); font-size: 9.5px; letter-spacing: 1.6px; }
.result-tag.newbest { background: var(--gold-soft); color: var(--gold); }
.result h2 { font-size: 22px; margin: 14px 0 6px; }
.result h2 em { font-style: normal; font-size: 40px; color: var(--primary); }
.result-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 22px 0 16px; }
.result-stats div { display: flex; flex-direction: column; padding: 12px 0; border-radius: 12px; background: var(--surface-2); }
.result-stats strong { font-size: 19px; color: var(--ink); }
.result-stats span { font-size: 9.5px; color: var(--muted); }
.reward { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 999px; background: var(--gold-soft); color: var(--gold); font-size: 11px; }
.side-stack { display: flex; flex-direction: column; gap: 16px; }
.rank-list { display: flex; flex-direction: column; gap: 4px; }
.rank { display: flex; align-items: center; gap: 9px; padding: 8px; border-radius: 10px; }
.rank.me { background: var(--primary-softer); }
.rk { width: 20px; font-size: 11px; font-weight: 700; color: var(--muted); text-align: center; }
.rk1 { color: var(--gold); } .rk2 { color: #9aa7a0; } .rk3 { color: var(--accent); }
.avatar-sm { width: 26px; height: 26px; border-radius: 50%; background: var(--surface-2); color: var(--muted); display: grid; place-items: center; font-size: 11px; }
.rank.me .avatar-sm { background: var(--primary); color: #fff; }
.tips { display: flex; flex-direction: column; gap: 12px; }
.tip { display: flex; gap: 10px; align-items: flex-start; }
.tip-ico { width: 28px; height: 28px; border-radius: 9px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; flex: 0 0 auto; }
.mini h3 { font-size: 16px; margin: 10px 0 5px; }
.tier-bar { height: 6px; border-radius: 3px; background: var(--surface-3); margin-top: 14px; overflow: hidden; }
.tier-bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--gold), var(--primary)); }
.mt4 { margin-top: 4px; } .mt8 { margin-top: 8px; }
.rules .rule { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); }
.r-no { font-family: var(--font-num); font-size: 12px; color: var(--primary); font-weight: 700; }
@media (max-width: 1050px) { .arena-grid { grid-template-columns: 1fr; } .arena-card { min-height: 480px; } }
@media (max-width: 600px) {
  .arena-card { padding: 20px 16px; }
  .answer-row { flex-wrap: wrap; }
  .answer-row :deep(.el-input) { flex: 1 1 100%; }
  .cn { font-size: 24px; }
  .result-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
