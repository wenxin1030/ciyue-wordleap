<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>我的成就</h1>
        <p>把长期进步拆成看得见的小节点。已解锁 {{ unlockedCount }} / 12 枚徽章。</p>
      </div>
      <div class="row gap8">
        <el-button round @click="shareVisible = true"><AppIcon name="share" :size="14" /> 生成战报</el-button>
        <el-button type="primary" round @click="$router.push('/garden')"><AppIcon name="tree" :size="14" /> 词汇森林</el-button>
      </div>
    </div>

    <section class="level-card card">
      <div class="level-left">
        <div class="level-badge">
          <span class="tiny">LEVEL</span>
          <strong class="num">{{ user.levelInfo.lv }}</strong>
        </div>
        <div class="grow">
          <div class="row gap10">
            <h2>{{ user.levelInfo.title }}</h2>
            <span class="chip primary">{{ user.levelInfo.xp }} exp</span>
          </div>
          <p class="muted small mt4">{{ levelTip }}</p>
          <div class="xp-line">
            <div class="xp-bar"><span :style="{ width: user.levelInfo.pct + '%' }"></span></div>
            <span class="tiny muted">距 Lv.{{ (user.levelInfo.next?.lv) || user.levelInfo.lv }} 还差 {{ user.levelInfo.remain }} exp</span>
          </div>
        </div>
      </div>
      <div class="level-stats">
        <div><span class="tiny muted">连续学习</span><strong class="num">{{ study.streak }} 天</strong></div>
        <div><span class="tiny muted">累计掌握</span><strong class="num">{{ mastered }} 词</strong></div>
        <div><span class="tiny muted">本周学习</span><strong class="num">{{ weekWords }} 词</strong></div>
      </div>
    </section>

    <div class="top-grid">
      <section class="card card-pad">
        <SectionHeader title="徽章墙" :sub="'已解锁 ' + unlockedCount + ' / 12'" />
        <div class="cat-row">
          <button v-for="c in categories" :key="c" class="cat" :class="{ on: cat === c }" @click="cat = c">{{ c }}</button>
        </div>
        <div class="badge-grid">
          <button
            v-for="a in shownAch" :key="a.id" class="badge"
            :class="{ locked: !isUnlocked(a), just: isNew(a) }"
            @click="openBadge(a)"
          >
            <span class="b-ico"><AppIcon :name="a.icon" :size="22" /></span>
            <strong>{{ a.name }}</strong>
            <small>{{ isUnlocked(a) ? unlockedAt(a) : '未解锁' }}</small>
            <span v-if="isUnlocked(a)" class="b-check"><AppIcon name="check" :size="9" /></span>
          </button>
        </div>
      </section>

      <aside class="side-stack">
        <section class="card card-pad">
          <SectionHeader title="同桌周榜" sub="本周学习词数" />
          <div class="rank-list">
            <div v-for="(f, i) in leaderboard" :key="f.name" class="rank" :class="{ me: f.me }">
              <span class="rk" :class="'rk' + (i + 1)">{{ i + 1 }}</span>
              <span class="avatar-sm">{{ f.name.slice(-1) }}</span>
              <span class="grow small">{{ f.name }}<span v-if="f.me" class="chip tiny primary" style="margin-left: 6px">我</span></span>
              <strong class="num small">{{ f.words }}</strong>
            </div>
          </div>
          <p class="tiny muted mt8">榜单为课程演示数据，用于展示社交激励模块。</p>
        </section>

        <section class="card card-pad garden-promo" @click="$router.push('/garden')">
          <div class="between">
            <span class="gp-ico"><AppIcon name="tree" :size="22" /></span>
            <span class="chip gold">词汇森林</span>
          </div>
          <h3>{{ gardenTrees }} 棵树正在生长</h3>
          <p class="tiny">每掌握 10 个单词种下一棵树。待复习的词会变成需要浇水的枯树。</p>
          <div class="gp-row"><span class="tiny">下一棵树进度</span><span class="tiny num">{{ mastered % 10 }} / 10</span></div>
          <div class="gp-bar"><span :style="{ width: (mastered % 10) * 10 + '%' }"></span></div>
        </section>
      </aside>
    </div>

    <section class="card card-pad mt16">
      <SectionHeader title="最近的里程碑" sub="记录每一次坚持" />
      <div class="timeline">
        <div v-for="t in milestones" :key="t.title" class="tl-item">
          <span class="tl-dot"></span>
          <div>
            <strong class="small">{{ t.title }}</strong>
            <p class="tiny muted">{{ t.desc }}</p>
          </div>
          <span class="tiny muted num">{{ t.date }}</span>
        </div>
        <div v-if="!milestones.length" class="tiny muted" style="padding: 10px 0">还没有里程碑，完成第一轮学习就会出现在这里。</div>
      </div>
    </section>

    <el-dialog v-model="badgeVisible" width="400px" align-center>
      <div v-if="badge" class="badge-dialog">
        <span class="bd-ico" :class="{ locked: !isUnlocked(badge) }"><AppIcon :name="badge.icon" :size="30" /></span>
        <h2>{{ badge.name }}</h2>
        <p class="small muted">{{ badge.desc }}</p>
        <div class="bd-progress">
          <div class="between tiny"><span>当前进度</span><span class="num">{{ metricValue(badge.metric) }} / {{ badge.target }}</span></div>
          <div class="bd-bar"><span :style="{ width: Math.min(100, metricValue(badge.metric) / badge.target * 100) + '%' }"></span></div>
        </div>
        <p class="tiny muted">{{ isUnlocked(badge) ? '解锁于 ' + unlockedAt(badge) : '继续学习即可解锁' }}</p>
      </div>
    </el-dialog>

    <el-dialog v-model="shareVisible" title="学习战报" width="440px" align-center>
      <div class="poster">
        <div class="p-brand"><span class="p-logo serif">Aa</span> 词跃 WordLeap</div>
        <h2>我的第 {{ study.streak }} 天连续学习</h2>
        <p class="tiny">让每个单词，都在该忘记之前重逢</p>
        <div class="p-stats">
          <div><strong class="num">{{ mastered }}</strong><span>掌握词汇</span></div>
          <div><strong class="num">{{ study.streak }}</strong><span>连续天数</span></div>
          <div><strong class="num">{{ accuracy }}</strong><span>正确率 %</span></div>
        </div>
        <div class="p-foot"><span>{{ todayText }}</span><span>Lv.{{ user.levelInfo.lv }} {{ user.levelInfo.title }}</span></div>
      </div>
      <el-button type="primary" round style="width: 100%; margin-top: 14px" @click="shareNow"><AppIcon name="share" :size="14" /> 分享战报</el-button>
      <div class="poster-actions">
        <el-button round @click="savePoster"><AppIcon name="download" :size="14" /> 保存图片</el-button>
        <el-button round @click="copyPoster"><AppIcon name="copy" :size="14" /> 复制文案</el-button>
      </div>
      <p class="tiny muted poster-hint">手机端会打开系统分享面板；电脑端会保存图片，可直接发送到微信、QQ 或邮件。</p>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '../components/common/AppIcon.vue'
import SectionHeader from '../components/common/SectionHeader.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { achievements } from '../mock/achievements'
import { words } from '../mock/words'
import { streakOf, masteredCount } from '../utils/stats'
import { todayKey } from '../utils/format'
import { sharePoster, downloadPoster, copyText } from '../utils/poster'

const user = useUserStore()
const study = useStudyStore()

const categories = ['全部', '坚持', '学习', '挑战']
const cat = ref('全部')
const badgeVisible = ref(false)
const badge = ref(null)
const shareVisible = ref(false)

const unlockedCount = computed(() => achievements.filter(a => user.data.achievements[a.id]?.unlocked).length)
const mastered = computed(() => masteredCount(user.data))
const gardenTrees = computed(() => Math.floor(mastered.value / 10))
const weekWords = computed(() => user.data.records
  .filter(r => dayjs(r.date).isAfter(dayjs().subtract(7, 'day')))
  .reduce((a, r) => a + r.newCount + r.reviewCount, 0))
const accuracy = computed(() => {
  const all = Object.values(user.data.progress || {})
  const seen = all.reduce((a, s) => a + (s.seen || 0), 0)
  const correct = all.reduce((a, s) => a + (s.correct || 0), 0)
  return seen ? Math.round(correct / seen * 100) : 0
})
const levelTip = computed(() => {
  const map = {
    1: '先建立每天 10 分钟的习惯，比一次背 100 个更重要。',
    2: '你已经能找到学习入口了，接下来固定时间段。',
    3: '开始有稳定的记忆节奏，试着用拼写模式检验。',
    4: '词汇量在稳步增长，注意复习到期词。',
    5: '坚持正在变成习惯，可以挑战听写擂台了。',
    6: '你已超过大多数同学，试试增加每日新词。',
    7: '进阶学习者：重点从「认识」转向「会用」。',
    8: '离词汇达人只差持续复习，别让旧词溜走。',
    9: '记忆大师：可以尝试学术写作场景输出。',
    10: '词王：继续保持，词汇森林已经郁郁葱葱。'
  }
  return map[user.levelInfo.lv] || ''
})

const shownAch = computed(() => achievements.filter(a => cat.value === '全部' || a.category === cat.value))
function isUnlocked(a) { return !!user.data.achievements[a.id]?.unlocked }
function unlockedAt(a) { return user.data.achievements[a.id]?.at || '' }
function isNew(a) {
  const at = user.data.achievements[a.id]?.at
  return at && dayjs(at).isAfter(dayjs().subtract(7, 'day'))
}
function openBadge(a) {
  badge.value = a
  badgeVisible.value = true
}

const metricValue = metric => {
  const data = user.data
  const map = {
    streak: streakOf(data.records),
    mastered: masteredCount(data),
    perfectSessions: data.records.filter(x => x.total > 0 && x.correct === x.total).length,
    earlyBirds: data.records.some(x => x.early) ? 1 : 0,
    nightOwls: data.records.some(x => x.night) ? 1 : 0,
    monthDays: new Set(data.records.filter(x => dayjs(x.date).isAfter(dayjs().subtract(30, 'day'))).map(x => x.date)).size,
    booksTouched: new Set(Object.entries(data.progress).filter(([, s]) => s.mastery >= 60).map(([id]) => (words.find(w => w.id === id) || {}).bookId)).size,
    arenaBest: data.arena?.best || 0,
    trees: Math.floor(masteredCount(data) / 10)
  }
  return map[metric] || 0
}

const leaderboard = computed(() => {
  const friends = [
    { name: '陈一诺', words: 214 },
    { name: '周子涵', words: 188 },
    { name: '林小满', words: weekWords.value, me: true },
    { name: '赵明宇', words: 132 },
    { name: '吴雨桐', words: 96 }
  ]
  return friends.sort((a, b) => b.words - a.words)
})

const milestones = computed(() => achievements
  .filter(a => user.data.achievements[a.id]?.unlocked)
  .sort((a, b) => (user.data.achievements[b.id]?.at || '').localeCompare(user.data.achievements[a.id]?.at || ''))
  .slice(0, 5)
  .map(a => ({
    title: a.name,
    desc: a.desc,
    date: user.data.achievements[a.id]?.at || ''
  })))

const todayText = computed(() => dayjs().format('YYYY.MM.DD'))
function posterData() {
  return {
    eyebrow: '连续学习 · 第 ' + study.streak + ' 天',
    title: '我的第 ' + study.streak + ' 天连续学习',
    subtitle: '让每个单词，都在该忘记之前重逢',
    stats: [
      { value: mastered.value, label: '掌握词汇' },
      { value: study.streak, label: '连续天数' },
      { value: accuracy.value + '%', label: '正确率' }
    ],
    footerLeft: todayText.value,
    footerRight: 'Lv.' + user.levelInfo.lv + ' ' + user.levelInfo.title,
    noteTitle: '第 ' + study.streak + ' 天，继续向前',
    note: '累计掌握 ' + mastered.value + ' 个单词，保持这个节奏。',
    ctaTitle: '把今天的记忆，交给明天的复习',
    ctaSub: '系统会按遗忘曲线安排下一次复习，让坚持变得更容易。',
    shareTitle: '词跃 WordLeap 学习战报'
  }
}
function posterText() {
  return '词跃 WordLeap 学习战报\n连续学习 ' + study.streak + ' 天，掌握 ' + mastered.value + ' 个单词，正确率 ' + accuracy.value + '%。\n让每个单词，都在该忘记之前重逢。'
}
async function shareNow() {
  const mode = await sharePoster(posterData(), posterText())
  if (mode === 'shared') ElMessage.success('已打开系统分享面板')
  else if (mode === 'shared-text') ElMessage.success('已打开系统分享面板，选择应用即可发送')
  else if (mode === 'downloaded-copied') ElMessage.success('战报图片已保存，文案已复制，可发送到微信 / QQ')
  else if (mode === 'downloaded') ElMessage.success('战报图片已保存，可发送到微信 / QQ')
}
function savePoster() {
  const name = downloadPoster(posterData())
  ElMessage.success('战报图片已保存：' + name)
}
async function copyPoster() {
  const text = posterText()
  const ok = await copyText(text)
  if (ok) ElMessage.success('战报文案已复制')
  else ElMessageBox.alert(text, '复制战报文案', { confirmButtonText: '关闭' })
}
</script>

<style scoped>
.level-card { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 24px 28px; background: radial-gradient(500px 200px at 90% -20%, var(--gold-soft), transparent 70%), var(--surface); flex-wrap: wrap; }
.level-left { display: flex; align-items: center; gap: 20px; flex: 1; min-width: 320px; }
.level-badge { width: 92px; height: 92px; border-radius: 26px; background: linear-gradient(145deg, var(--primary), var(--primary-dark)); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 0 0 auto; }
.level-badge span { font-size: 9px; letter-spacing: 2px; opacity: .75; }
.level-badge strong { font-size: 36px; line-height: 1.05; }
.level-stats { display: flex; gap: 34px; }
.level-stats div { display: flex; flex-direction: column; }
.level-stats strong { font-size: 20px; color: var(--ink); }
.xp-line { margin-top: 12px; }
.xp-bar { height: 7px; border-radius: 4px; background: var(--surface-3); overflow: hidden; margin-bottom: 5px; }
.xp-bar span { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--primary), var(--primary-light)); }
.top-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; margin-top: 16px; align-items: start; }
.cat-row { display: flex; gap: 7px; margin-bottom: 14px; flex-wrap: wrap; }
.cat { height: 26px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 11.5px; cursor: pointer; }
.cat.on { background: var(--ink); color: var(--surface); border-color: var(--ink); }
.badge-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.badge { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 14px 8px 10px; border-radius: 14px; border: 1px solid transparent; background: var(--surface-2); cursor: pointer; transition: transform .15s; }
.badge:hover { transform: translateY(-2px); }
.badge strong { font-size: 11.5px; color: var(--ink); }
.badge small { font-size: 9.5px; color: var(--muted); }
.b-ico { width: 42px; height: 42px; border-radius: 13px; background: var(--gold-soft); color: var(--gold); display: grid; place-items: center; margin-bottom: 3px; }
.badge.locked { opacity: .48; filter: grayscale(1); background: var(--surface-2); }
.badge.locked .b-ico { background: var(--surface-3); color: var(--faint); }
.badge.just { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-soft); }
.b-check { position: absolute; right: 7px; top: 7px; width: 16px; height: 16px; border-radius: 50%; background: var(--primary); color: #fff; display: grid; place-items: center; }
.side-stack { display: flex; flex-direction: column; gap: 16px; }
.rank-list { display: flex; flex-direction: column; gap: 4px; }
.rank { display: flex; align-items: center; gap: 9px; padding: 8px 8px; border-radius: 10px; }
.rank.me { background: var(--primary-softer); }
.rk { width: 20px; font-size: 11px; font-weight: 700; color: var(--muted); text-align: center; }
.rk1 { color: var(--gold); } .rk2 { color: #9aa7a0; } .rk3 { color: var(--accent); }
.avatar-sm { width: 26px; height: 26px; border-radius: 50%; background: var(--surface-2); color: var(--muted); display: grid; place-items: center; font-size: 11px; }
.rank.me .avatar-sm { background: var(--primary); color: #fff; }
.garden-promo { cursor: pointer; background: radial-gradient(280px 160px at 100% 0, var(--primary-soft), transparent 70%), var(--surface); }
.gp-ico { width: 40px; height: 40px; border-radius: 12px; background: var(--primary); color: #fff; display: grid; place-items: center; }
.garden-promo h3 { font-size: 17px; margin: 10px 0 4px; }
.garden-promo p { line-height: 1.6; }
.gp-row { display: flex; justify-content: space-between; margin: 14px 0 6px; }
.gp-bar { height: 6px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.gp-bar span { display: block; height: 100%; background: var(--primary); border-radius: 3px; }
.mt16 { margin-top: 16px; }
.timeline { display: flex; flex-direction: column; gap: 12px; }
.tl-item { display: flex; align-items: center; gap: 12px; }
.tl-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); flex: 0 0 auto; }
.tl-item div { flex: 1; }
.badge-dialog { text-align: center; }
.bd-ico { width: 76px; height: 76px; border-radius: 22px; background: var(--gold-soft); color: var(--gold); display: grid; place-items: center; margin: 0 auto 12px; }
.bd-ico.locked { background: var(--surface-2); color: var(--faint); }
.badge-dialog h2 { font-size: 19px; margin-bottom: 4px; }
.bd-progress { margin: 18px 0 10px; padding: 12px; border-radius: 11px; background: var(--surface-2); }
.bd-bar { height: 6px; border-radius: 3px; background: var(--surface-3); margin-top: 8px; overflow: hidden; }
.bd-bar span { display: block; height: 100%; background: var(--primary); border-radius: 3px; }
.poster { border-radius: 16px; border: 1px solid var(--line); padding: 20px; background: linear-gradient(160deg, var(--surface), var(--primary-softer)); }
.p-brand { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; }
.p-logo { width: 24px; height: 24px; border-radius: 7px; background: var(--primary); color: #fff; display: grid; place-items: center; font-size: 11px; }
.poster h2 { font-size: 20px; margin: 18px 0 4px; }
.p-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 18px 0; padding: 14px 0; border-top: 1px dashed var(--line); border-bottom: 1px dashed var(--line); }
.p-stats div { display: flex; flex-direction: column; align-items: center; }
.p-stats strong { font-size: 22px; color: var(--primary); }
.p-stats span { font-size: 9.5px; color: var(--muted); }
.p-foot { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); }
.poster-actions { display: flex; gap: 8px; margin-top: 8px; }
.poster-actions .el-button { flex: 1; margin-left: 0; }
.poster-hint { margin-top: 8px; line-height: 1.55; text-align: center; }
@media (max-width: 1000px) { .top-grid { grid-template-columns: 1fr; } }
@media (max-width: 700px) {
  .level-stats { gap: 20px; }
  .badge-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
