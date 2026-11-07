<template>
  <el-dialog :model-value="!!ui.preview" width="560px" align-center class="word-dialog" @close="ui.closeWord()">
    <template v-if="word">
      <div class="wd-head">
        <div>
          <div class="row gap8">
            <span class="chip primary">{{ word.pos }}</span>
            <span v-for="t in word.tags" :key="t" class="chip">{{ t }}</span>
            <span class="chip">{{ bookName }}</span>
          </div>
          <h2 class="en wd-word">{{ word.word }}</h2>
          <div class="row gap10 mt4">
            <span class="phonetic">{{ word.phonetic }}</span>
            <button class="mini-play" @click="speak(word.word)"><AppIcon name="volume" :size="14" /></button>
            <span class="tiny muted">点击朗读</span>
          </div>
        </div>
        <div class="wd-ring">
          <RingProgress :value="mastery" :size="76" :stroke="7" :color="masteryColor">
            <strong class="num">{{ mastery }}<span class="pct">%</span></strong>
          </RingProgress>
          <small class="muted">掌握度</small>
        </div>
      </div>

      <div class="wd-cn">
        <strong>{{ word.cn }}</strong>
        <p class="muted">{{ word.en }}</p>
      </div>

      <div class="wd-block">
        <p class="tiny muted mb8">例句</p>
        <p class="ex" v-html="highlight(word.example)"></p>
        <p class="muted small">{{ word.exampleCn }}</p>
      </div>

      <div v-if="word.root" class="wd-hint">
        <AppIcon name="sparkles" :size="15" />
        <div><strong>词根记忆 </strong>{{ word.root }}</div>
      </div>

      <div class="wd-grid">
        <div>
          <p class="tiny muted mb8">常用搭配</p>
          <div class="row wrap gap6"><span v-for="c in word.collocations" :key="c" class="chip outline">{{ c }}</span></div>
        </div>
        <div>
          <p class="tiny muted mb8">近义词</p>
          <div class="row wrap gap6"><span v-for="s in word.synonyms" :key="s" class="chip">{{ s }}</span></div>
        </div>
      </div>

      <div class="wd-foot">
        <span class="tiny muted">已学习 {{ state.seen || 0 }} 次 · 错误 {{ state.wrong || 0 }} 次<span v-if="nextText"> · {{ nextText }}</span></span>
        <el-button type="primary" round @click="goLearn">去复习这个词</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '../../stores/ui'
import { useUserStore } from '../../stores/user'
import { speak } from '../../composables/useSpeech'
import { bookById } from '../../mock/books'
import { masteryLevel, nextIntervalText } from '../../utils/srs'
import RingProgress from '../common/RingProgress.vue'
import AppIcon from '../common/AppIcon.vue'

const ui = useUiStore()
const user = useUserStore()
const router = useRouter()

const word = computed(() => ui.preview)
const state = computed(() => (word.value && user.data?.progress[word.value.id]) || {})
const mastery = computed(() => state.value.mastery || 0)
const masteryColor = computed(() => mastery.value >= 85 ? 'var(--primary)' : mastery.value >= 60 ? 'var(--primary-light)' : mastery.value >= 30 ? 'var(--gold)' : 'var(--accent)')
const bookName = computed(() => bookById(word.value?.bookId)?.short || '')
const nextText = computed(() => nextIntervalText(state.value))

function highlight(text = '') {
  if (!word.value) return text
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
function goLearn() {
  ui.closeWord()
  router.push({ path: '/learn', query: { word: word.value.id } })
}
</script>

<style scoped>
.wd-head { display: flex; justify-content: space-between; gap: 16px; }
.wd-word { font-size: 38px; margin-top: 10px; letter-spacing: -.5px; }
.phonetic { color: var(--muted); font-size: 14px; }
.mini-play { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--line); background: var(--surface); color: var(--primary); display: grid; place-items: center; cursor: pointer; }
.wd-ring { text-align: center; flex: 0 0 auto; }
.wd-ring small { font-size: 10.5px; }
.wd-cn { padding: 16px 0 4px; border-top: 1px dashed var(--line); margin-top: 14px; }
.wd-cn strong { font-size: 16px; color: var(--ink); }
.wd-cn p { font-size: 12.5px; margin-top: 3px; }
.wd-block { margin-top: 16px; }
.ex { font-family: Georgia, serif; font-size: 16px; color: var(--ink); line-height: 1.6; }
.ex :deep(em) { color: var(--primary); font-style: normal; font-weight: 700; }
.wd-hint { display: flex; gap: 9px; margin-top: 14px; padding: 11px 13px; border-radius: 12px; background: var(--primary-softer); color: var(--primary-dark); font-size: 12.5px; line-height: 1.6; }
.wd-hint :deep(svg) { margin-top: 3px; }
.wd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.wd-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--line); }
@media (max-width: 600px) {
  .wd-head { flex-direction: column; }
  .wd-grid { grid-template-columns: 1fr; }
}
</style>
