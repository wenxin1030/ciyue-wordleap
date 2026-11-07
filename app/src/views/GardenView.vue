<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>词汇森林</h1>
        <p>每掌握 10 个单词种下一棵树，长期积累看得见</p>
      </div>
      <div class="row gap8">
        <el-button round @click="rulesVisible = true"><AppIcon name="info" :size="14" /> 玩法说明</el-button>
        <el-button type="primary" round :disabled="!study.dueList.length" @click="waterAll">
          <AppIcon name="leaf" :size="14" /> 浇水复习（{{ study.dueList.length }}）
        </el-button>
      </div>
    </div>

    <section class="forest-hero card">
      <div class="fh-left">
        <span class="chip forest-tag">WORD FOREST</span>
        <h2>你的森林已种下 <em class="num">{{ trees }}</em> 棵树</h2>
        <p class="small">每 10 个「熟练掌握」的词长成一棵树；进入遗忘临界点的词会让树枯萎，及时复习即可重新变绿。</p>
        <div class="forest-stats">
          <div><strong class="num">{{ mastered }}</strong><span>已掌握词汇</span></div>
          <div><strong class="num">{{ saplingPct }}%</strong><span>下一棵树</span></div>
          <div><strong class="num">{{ dueTrees }}</strong><span>待浇水树</span></div>
          <div><strong class="num">{{ cardsUnlocked }}</strong><span>词卡图鉴</span></div>
        </div>
      </div>
      <div class="fh-tree">
        <svg viewBox="0 0 120 130" class="hero-tree">
          <ellipse cx="60" cy="118" rx="34" ry="8" fill="var(--soil)" opacity=".55" />
          <rect x="56" y="76" width="8" height="40" rx="4" fill="var(--trunk)" />
          <circle cx="60" cy="58" r="30" fill="var(--leaf-1)" />
          <circle cx="38" cy="70" r="19" fill="var(--leaf-2)" />
          <circle cx="82" cy="70" r="19" fill="var(--leaf-2)" />
          <circle cx="60" cy="36" r="18" fill="var(--leaf-3)" opacity=".9" />
        </svg>
        <span class="hero-badge">Lv.{{ user.levelInfo.lv }} · {{ user.levelInfo.title }}</span>
      </div>
    </section>

    <div class="garden-grid">
      <section class="card card-pad">
        <SectionHeader title="我的森林" :sub="'共 ' + plots.length + ' 块地 · ' + trees + ' 棵成树'" />
        <div class="forest">
          <div v-for="(p, i) in plots" :key="i" class="plot" :class="p.type" @click="openPlot(p)">
            <span v-if="p.type === 'empty'" class="seed"><AppIcon name="plus" :size="12" /></span>
            <svg v-else-if="p.type === 'sapling'" viewBox="0 0 60 70" class="tree sapling">
              <ellipse cx="30" cy="63" rx="16" ry="4" fill="var(--soil)" opacity=".6" />
              <rect x="28" y="44" width="4" height="18" rx="2" fill="var(--trunk)" />
              <circle cx="30" cy="40" r="9" fill="var(--leaf-2)" />
              <circle cx="22" cy="46" r="6" fill="var(--leaf-1)" />
              <circle cx="38" cy="46" r="6" fill="var(--leaf-1)" />
            </svg>
            <svg v-else viewBox="0 0 60 70" class="tree">
              <ellipse cx="30" cy="64" rx="20" ry="5" fill="var(--soil)" opacity=".55" />
              <rect x="27" y="40" width="6" height="22" rx="3" fill="var(--trunk)" />
              <circle cx="30" cy="30" r="16" :fill="p.type === 'dead' ? 'var(--dead)' : 'var(--leaf-1)'" />
              <circle cx="18" cy="37" r="10" :fill="p.type === 'dead' ? 'var(--dead-2)' : 'var(--leaf-2)'" />
              <circle cx="42" cy="37" r="10" :fill="p.type === 'dead' ? 'var(--dead-2)' : 'var(--leaf-2)'" />
              <circle cx="30" cy="17" r="8" :fill="p.type === 'dead' ? 'var(--dead-2)' : 'var(--leaf-3)'" opacity=".92" />
            </svg>
            <span v-if="p.type === 'dead'" class="water-hint"><AppIcon name="refresh" :size="9" /></span>
            <span class="plot-no">{{ i + 1 }}</span>
          </div>
        </div>
        <div class="legend">
          <span><i class="dot leaf"></i>成树</span>
          <span><i class="dot sap"></i>生长中</span>
          <span><i class="dot dead"></i>待浇水</span>
          <span><i class="dot empty"></i>空地</span>
          <span class="grow"></span>
          <span class="tiny muted">下一棵树：{{ mastered % 10 }} / 10 词</span>
        </div>
      </section>

      <aside class="side-stack">
        <section class="card card-pad">
          <SectionHeader title="词卡图鉴" :sub="'已收集 ' + cardsUnlocked + ' / 12'" />
          <div class="card-grid">
            <div v-for="c in cards" :key="c.id" class="wordcard" :class="{ locked: !c.unlocked }">
              <span class="wc-ico"><AppIcon :name="c.icon" :size="16" /></span>
              <strong class="tiny">{{ c.name }}</strong>
              <small class="tiny">{{ c.unlocked ? c.rarity : c.need + ' 词解锁' }}</small>
            </div>
          </div>
          <p class="tiny muted mt8">掌握词汇每增加 50 个，即可抽取一张新的词根词卡。</p>
        </section>

        <section class="card card-pad">
          <SectionHeader title="成长记录" sub="最近种下的树" />
          <div class="log-list">
            <div v-for="log in logs" :key="log.text" class="log">
              <span class="log-ico"><AppIcon :name="log.icon" :size="13" /></span>
              <div class="grow">
                <strong class="tiny">{{ log.text }}</strong>
                <p class="tiny muted">{{ log.date }}</p>
              </div>
            </div>
            <div v-if="!logs.length" class="tiny muted">还没有记录，先完成一轮学习吧。</div>
          </div>
        </section>
      </aside>
    </div>

    <el-dialog v-model="plotVisible" width="420px" align-center>
      <div v-if="currentPlot" class="plot-dialog">
        <span class="pd-ico" :class="currentPlot.type"><AppIcon name="tree" :size="26" /></span>
        <h3>第 {{ currentPlot.index + 1 }} 棵树</h3>
        <p class="tiny muted">{{ plotDesc }}</p>
        <div class="pd-words">
          <div v-for="w in currentPlot.words" :key="w.id" class="pd-word">
            <span class="serif">{{ w.word }}</span>
            <span class="tiny muted">{{ w.cn }}</span>
            <span class="tiny num">{{ getMastery(w.id) }}%</span>
          </div>
          <div v-if="!currentPlot.words.length" class="tiny muted">这块地还没有对应的词，去学习或复习就能解锁。</div>
        </div>
        <el-button v-if="currentPlot.type === 'dead'" type="primary" round style="width: 100%; margin-top: 14px" @click="waterAll">去浇水复习</el-button>
      </div>
    </el-dialog>

    <el-dialog v-model="rulesVisible" title="词汇森林玩法" width="440px" align-center>
      <div class="rules">
        <div class="rule"><span class="r-no">01</span><div><strong>种树</strong><p class="tiny muted">掌握度达到 85% 的单词计入「已掌握」，每累计 10 个种下一棵树。</p></div></div>
        <div class="rule"><span class="r-no">02</span><div><strong>浇水</strong><p class="tiny muted">进入遗忘临界点的词会让树枯萎。完成复习、记忆保持率回升后，树会重新变绿。</p></div></div>
        <div class="rule"><span class="r-no">03</span><div><strong>图鉴</strong><p class="tiny muted">每多掌握 50 个词解锁一张词根词卡，共 12 张，作为长期学习的收藏目标。</p></div></div>
        <div class="rule" style="border-bottom: none"><span class="r-no">04</span><div><strong>不惩罚</strong><p class="tiny muted">枯萎只是提示，不会扣除已获得的树。复习后立即恢复，避免因中断而放弃。</p></div></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import AppIcon from '../components/common/AppIcon.vue'
import SectionHeader from '../components/common/SectionHeader.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { words, wordMap } from '../mock/words'
import { masteredCount } from '../utils/stats'

const user = useUserStore()
const study = useStudyStore()
const rulesVisible = ref(false)
const plotVisible = ref(false)
const currentPlot = ref(null)

const mastered = computed(() => masteredCount(user.data))
const trees = computed(() => Math.floor(mastered.value / 10))
const saplingPct = computed(() => (mastered.value % 10) * 10)
const dueTrees = computed(() => Math.ceil(study.dueList.length / 10))

const masteredWords = computed(() => words
  .filter(w => (user.data.progress[w.id]?.mastery || 0) >= 85)
  .sort((a, b) => (user.data.progress[b.id]?.mastery || 0) - (user.data.progress[a.id]?.mastery || 0)))

const plots = computed(() => {
  const total = 30
  const out = []
  for (let i = 0; i < total; i++) {
    let type = 'empty'
    if (i < trees.value) type = 'tree'
    else if (i === trees.value && mastered.value % 10 > 0) type = 'sapling'
    if (type === 'tree' && i >= Math.max(0, trees.value - dueTrees.value)) type = 'dead'
    out.push({
      index: i,
      type,
      words: type === 'empty' ? [] : masteredWords.value.slice(i * 10, i * 10 + 10)
    })
  }
  return out
})

const plotDesc = computed(() => {
  const t = currentPlot.value
  if (!t) return ''
  if (t.type === 'dead') return '这棵树正在枯萎：有单词进入遗忘临界点，复习后即可恢复。'
  if (t.type === 'sapling') return '正在生长：再掌握 ' + (10 - mastered.value % 10) + ' 个单词就能长成大树。'
  return '由 ' + t.words.length + ' 个已掌握单词滋养。'
})

function openPlot(p) {
  currentPlot.value = p
  plotVisible.value = true
}
function getMastery(id) {
  return user.data.progress[id]?.mastery || 0
}
function waterAll() {
  if (!study.dueList.length) return
  study.start({ mode: 'recognize', source: 'review', size: 10 })
  window.location.hash = '#/learn'
}

const cardDefs = [
  { id: 'c1', name: '词根·spect', icon: 'eye', rarity: '普通卡', need: 0 },
  { id: 'c2', name: '词根·port', icon: 'upload', rarity: '普通卡', need: 50 },
  { id: 'c3', name: '前缀·re-', icon: 'rotate-ccw', rarity: '普通卡', need: 100 },
  { id: 'c4', name: '后缀·-tion', icon: 'layers', rarity: '稀有卡', need: 200 },
  { id: 'c5', name: '词根·dict', icon: 'volume', rarity: '稀有卡', need: 300 },
  { id: 'c6', name: '词根·tract', icon: 'target', rarity: '稀有卡', need: 400 },
  { id: 'c7', name: '词根·form', icon: 'sparkles', rarity: '史诗卡', need: 600 },
  { id: 'c8', name: '词根·cred', icon: 'shield', rarity: '史诗卡', need: 800 },
  { id: 'c9', name: '词根·scrib', icon: 'edit', rarity: '史诗卡', need: 1000 },
  { id: 'c10', name: '词根·flu', icon: 'leaf', rarity: '传说卡', need: 1300 },
  { id: 'c11', name: '词根·anthrop', icon: 'users', rarity: '传说卡', need: 1600 },
  { id: 'c12', name: '词源·Latin', icon: 'graduation', rarity: '传说卡', need: 2000 }
]
const cards = computed(() => cardDefs.map(c => ({ ...c, unlocked: mastered.value >= c.need })))
const cardsUnlocked = computed(() => cards.value.filter(c => c.unlocked).length)

const logs = computed(() => {
  const base = user.data.records.slice(-4).reverse().filter(r => r.newCount + r.reviewCount > 0)
  return base.map((r, i) => ({
    icon: i === 0 ? 'leaf' : 'tree',
    text: '完成 ' + (r.newCount + r.reviewCount) + ' 个单词的学习与复习',
    date: dayjs(r.date).format('M 月 D 日')
  }))
})
</script>

<style scoped>
.forest-hero { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 26px 30px; background: radial-gradient(420px 220px at 90% 0, var(--primary-soft), transparent 70%), var(--surface); overflow: hidden; }
.fh-left { max-width: 620px; }
.forest-tag { background: var(--primary); color: #fff; letter-spacing: 1.4px; font-size: 9px; }
.forest-hero h2 { font-size: 24px; margin: 12px 0 8px; }
.forest-hero h2 em { font-style: normal; color: var(--primary); font-size: 30px; }
.forest-hero p { line-height: 1.65; }
.forest-stats { display: flex; gap: 34px; margin-top: 20px; flex-wrap: wrap; }
.forest-stats div { display: flex; flex-direction: column; }
.forest-stats strong { font-size: 20px; color: var(--ink); }
.forest-stats span { font-size: 10px; color: var(--muted); }
.fh-tree { position: relative; flex: 0 0 auto; }
.hero-tree { width: 150px; height: 160px; }
.hero-badge { position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); padding: 3px 10px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); font-size: 9.5px; color: var(--muted); white-space: nowrap; }
.hero-tree circle { animation: sway 6s ease-in-out infinite; transform-origin: center; }
@keyframes sway { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
.garden-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: 16px; margin-top: 16px; align-items: start; }
.forest { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; background: linear-gradient(180deg, transparent, var(--primary-softer)); border-radius: 16px; padding: 12px 8px; }
.plot { position: relative; aspect-ratio: 1 / 1.05; border-radius: 12px; display: flex; align-items: flex-end; justify-content: center; cursor: pointer; transition: background .15s; }
.plot:hover { background: var(--surface-2); }
.plot .tree { width: 88%; height: 88%; }
.plot .tree.sapling { width: 62%; height: 62%; }
.plot-no { position: absolute; left: 5px; top: 4px; font-size: 8px; color: var(--faint); }
.seed { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 22px; height: 22px; border-radius: 50%; border: 1px dashed var(--line); color: var(--faint); display: grid; place-items: center; }
.water-hint { position: absolute; right: 8px; top: 8px; width: 16px; height: 16px; border-radius: 50%; background: #8FB6EA; color: #fff; display: grid; place-items: center; }
.legend { display: flex; align-items: center; gap: 14px; margin-top: 14px; font-size: 10px; color: var(--muted); flex-wrap: wrap; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; }
.dot.leaf { background: var(--leaf-2); } .dot.sap { background: #8FCBB9; } .dot.dead { background: #C8B491; } .dot.empty { background: var(--surface-3); border: 1px solid var(--line); }
.side-stack { display: flex; flex-direction: column; gap: 16px; }
.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.wordcard { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 3px 8px; border-radius: 11px; background: var(--surface-2); text-align: center; }
.wc-ico { width: 30px; height: 30px; border-radius: 9px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; margin-bottom: 2px; }
.wordcard strong { font-size: 10px; color: var(--ink); }
.wordcard small { font-size: 8.5px; color: var(--muted); }
.wordcard.locked { opacity: .45; filter: grayscale(1); }
.wordcard.locked .wc-ico { background: var(--surface-3); color: var(--faint); }
.log-list { display: flex; flex-direction: column; gap: 10px; }
.log { display: flex; gap: 9px; align-items: flex-start; }
.log-ico { width: 26px; height: 26px; border-radius: 8px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; flex: 0 0 auto; }
.mt8 { margin-top: 8px; }
.plot-dialog { text-align: center; }
.pd-ico { width: 64px; height: 64px; border-radius: 20px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; margin: 0 auto 10px; }
.pd-ico.dead { background: #F3E7D6; color: #A98A5C; }
.plot-dialog h3 { font-size: 18px; margin-bottom: 4px; }
.pd-words { margin-top: 14px; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; text-align: left; }
.pd-word { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid var(--line); }
.pd-word:last-child { border-bottom: none; }
.pd-word span:first-child { width: 110px; font-size: 14px; }
.pd-word span:nth-child(2) { flex: 1; }
.rules .rule { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); }
.r-no { font-family: var(--font-num); font-size: 12px; color: var(--primary); font-weight: 700; }
@media (max-width: 1100px) { .garden-grid { grid-template-columns: 1fr; } }
@media (max-width: 700px) {
  .forest-hero { flex-direction: column; align-items: flex-start; }
  .fh-tree { position: absolute; right: -20px; opacity: .35; }
  .forest { grid-template-columns: repeat(5, 1fr); }
}
</style>
<style>
:root {
  --leaf-1: #2F8068;
  --leaf-2: #3E9B82;
  --leaf-3: #6FBFA9;
  --trunk: #9A7453;
  --soil: #D9CDB8;
  --dead: #B49A6E;
  --dead-2: #C8B491;
}
[data-theme="night"] {
  --leaf-1: #59D6B8;
  --leaf-2: #3FA98F;
  --leaf-3: #2C8069;
  --trunk: #5C6B84;
  --soil: #22304A;
  --dead: #8A7350;
  --dead-2: #9C8663;
}
</style>
