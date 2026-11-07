<template>
  <header class="header">
    <button class="menu-btn" @click="ui.mobileNav = true" aria-label="打开菜单">
      <AppIcon name="menu" :size="19" />
    </button>

    <div class="crumb">
      <template v-for="(c, i) in crumbs" :key="i">
        <span :class="{ current: i === crumbs.length - 1 }">{{ c }}</span>
        <span v-if="i < crumbs.length - 1" class="sep">/</span>
      </template>
    </div>

    <div class="head-right">
      <button class="search-pill" @click="openSearch">
        <AppIcon name="search" :size="15" />
        <span>搜索单词 / 词书 / 例句</span>
        <kbd>Ctrl K</kbd>
      </button>

      <button class="round-btn" :title="isNight ? '切换到浅色' : '切换到深色'" @click="user.toggleTheme()">
        <AppIcon :name="isNight ? 'sun' : 'moon'" :size="17" />
      </button>

      <el-popover placement="bottom-end" :width="300" trigger="click" popper-class="notify-pop">
        <template #reference>
          <button class="round-btn bell" title="通知">
            <AppIcon name="bell" :size="17" />
            <span v-if="notices.length" class="dot"></span>
          </button>
        </template>
        <div class="notify">
          <div class="between mb8"><strong>消息提醒</strong><span class="tiny muted">{{ notices.length }} 条</span></div>
          <div v-for="n in notices" :key="n.title" class="notice" @click="n.action && n.action()">
            <span class="nico"><AppIcon :name="n.icon" :size="15" /></span>
            <div class="grow">
              <p>{{ n.title }}</p>
              <small class="muted">{{ n.desc }}</small>
            </div>
          </div>
          <p v-if="!notices.length" class="tiny muted center" style="padding:14px 0">今天没有新消息，去学几个词吧</p>
        </div>
      </el-popover>

      <span class="date-chip">{{ dateText }}</span>

      <el-dropdown trigger="click" @command="onCommand">
        <button class="avatar-btn">
          <span>{{ initial }}</span>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile"><AppIcon name="user" :size="14" /> 个人中心</el-dropdown-item>
            <el-dropdown-item command="achievements"><AppIcon name="award" :size="14" /> 我的成就</el-dropdown-item>
            <el-dropdown-item command="theme" divided><AppIcon :name="isNight ? 'sun' : 'moon'" :size="14" /> {{ isNight ? '浅色模式' : '深色模式' }}</el-dropdown-item>
            <el-dropdown-item command="logout" divided><AppIcon name="logout" :size="14" /> 退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <el-dialog v-model="ui.searchOpen" width="620px" :show-close="false" class="search-dialog" align-center append-to-body>
      <div class="search-box">
        <AppIcon name="search" :size="18" />
        <input ref="inputEl" v-model="q" placeholder="输入英文单词、中文释义或词书名…" @keydown.esc="ui.searchOpen = false" />
        <kbd>ESC</kbd>
      </div>
      <div class="search-results">
        <template v-if="!q.trim()">
          <p class="tiny muted">最近学习</p>
          <div v-for="w in recentWords" :key="w.id" class="result" @click="pickWord(w)">
            <span class="rw en">{{ w.word }}</span>
            <span class="grow muted">{{ w.cn }}</span>
            <span class="chip">{{ w.pos }}</span>
          </div>
        </template>
        <template v-else>
          <p class="tiny muted">单词 · {{ wordHits.length }} 个结果</p>
          <div v-for="w in wordHits" :key="w.id" class="result" @click="pickWord(w)">
            <span class="rw en">{{ w.word }}</span>
            <span class="grow muted">{{ w.cn }}</span>
            <span class="chip">{{ bookName(w.bookId) }}</span>
          </div>
          <p v-if="bookHits.length" class="tiny muted mt12">词书</p>
          <div v-for="b in bookHits" :key="b.id" class="result" @click="pickBook(b)">
            <span class="rw">{{ b.short }}</span>
            <span class="grow muted">{{ b.total }} 词 · {{ b.type }}</span>
            <AppIcon name="arrow-right" :size="14" />
          </div>
          <p v-if="!wordHits.length && !bookHits.length" class="empty-hint">没有找到「{{ q }}」，试试更短的关键词</p>
        </template>
      </div>
    </el-dialog>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import AppIcon from '../components/common/AppIcon.vue'
import { useUserStore } from '../stores/user'
import { useUiStore } from '../stores/ui'
import { useStudyStore } from '../stores/study'
import { words } from '../mock/words'
import { books, bookById } from '../mock/books'
import { dateLabel, todayKey } from '../utils/format'

const user = useUserStore()
const ui = useUiStore()
const study = useStudyStore()
const route = useRoute()
const router = useRouter()

const isNight = computed(() => user.prefs.theme === 'night')
const crumbs = computed(() => route.meta.crumb || ['词跃', route.meta.title || ''])
const initial = computed(() => (user.displayName || '同学').slice(-1))
const dateText = dateLabel()
const q = ref('')
const inputEl = ref(null)

const recentWords = computed(() => {
  const p = user.data?.progress || {}
  return words.filter(w => p[w.id]?.seen > 0).sort((a, b) => (p[b.id].last || 0) - (p[a.id].last || 0)).slice(0, 6)
})
const wordHits = computed(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return []
  return words.filter(w => w.word.toLowerCase().includes(k) || w.cn.includes(k)).slice(0, 8)
})
const bookHits = computed(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return []
  return books.filter(b => b.name.includes(k) || b.short.includes(k) || b.en.toLowerCase().includes(k)).slice(0, 3)
})

const notices = computed(() => {
  const list = []
  const due = study.dueList.length
  if (due) list.push({ icon: 'refresh', title: due + ' 个单词已到复习临界点', desc: '现在复习，记忆保持率最高', action: () => router.push('/review') })
  if (study.chestReady) list.push({ icon: 'gift', title: '今日宝箱待开启', desc: '三任务已完成，领取随机奖励', action: () => router.push('/dashboard') })
  const days = Math.ceil((new Date(user.profile.examDate) - new Date()) / 86400000)
  if (days > 0) list.push({ icon: 'flag', title: '距目标考试还有 ' + days + ' 天', desc: user.profile.targetExam || '按计划推进即可', action: () => router.push('/stats') })
  return list
})

function openSearch() {
  ui.searchOpen = true
  nextTick(() => inputEl.value && inputEl.value.focus())
}
function pickWord(w) {
  ui.preview = w
  ui.searchOpen = false
}
function pickBook(b) {
  ui.searchOpen = false
  router.push('/books')
}
function bookName(id) { return bookById(id)?.short || id }

async function onCommand(cmd) {
  if (cmd === 'profile') router.push('/profile')
  if (cmd === 'achievements') router.push('/achievements')
  if (cmd === 'theme') user.toggleTheme()
  if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('退出后本地学习记录仍会保留，下次登录可继续。', '退出登录', {
        confirmButtonText: '退出', cancelButtonText: '再学一会', type: 'warning'
      })
      user.logout()
      ElMessage.success('已退出登录')
      router.replace('/login')
    } catch (e) { /* cancelled */ }
  }
}

function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    openSearch()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
watch(() => ui.searchOpen, v => { if (!v) q.value = '' })
</script>

<style scoped>
.header {
  position: sticky; top: 0; z-index: 50;
  height: var(--header-h);
  display: flex; align-items: center; gap: 16px;
  padding: 0 30px;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid transparent;
}
.menu-btn { display: none; width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); place-items: center; cursor: pointer; }
.crumb { display: flex; align-items: center; gap: 7px; color: var(--faint); font-size: 12.5px; white-space: nowrap; }
.crumb .current { color: var(--ink); font-weight: 500; }
.sep { color: var(--line-strong); }
.head-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.search-pill {
  display: flex; align-items: center; gap: 8px;
  height: 36px; width: 248px; padding: 0 12px;
  border-radius: 999px; border: 1px solid var(--line);
  background: var(--surface); color: var(--faint); font-size: 12px;
  cursor: pointer; text-align: left;
}
.search-pill span { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
kbd {
  font-family: inherit; font-size: 9.5px; color: var(--faint);
  border: 1px solid var(--line); border-radius: 5px; padding: 1px 5px; background: var(--surface-2);
}
.round-btn {
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid var(--line); background: var(--surface);
  display: grid; place-items: center; color: var(--muted); cursor: pointer; position: relative;
  transition: color .15s, border-color .15s;
}
.round-btn:hover { color: var(--primary); border-color: var(--primary); }
.bell .dot { position: absolute; top: 8px; right: 9px; width: 6px; height: 6px; background: var(--accent); border-radius: 50%; border: 1.5px solid var(--surface); }
.date-chip { font-size: 11.5px; color: var(--muted); padding: 6px 12px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line); white-space: nowrap; }
.avatar-btn {
  width: 36px; height: 36px; border-radius: 50%; border: 0; cursor: pointer;
  background: var(--primary-soft); color: var(--primary); font-size: 14px; font-weight: 600;
  display: grid; place-items: center;
}
.notify { padding: 2px; }
.notice { display: flex; gap: 10px; padding: 10px 8px; border-radius: 10px; cursor: pointer; }
.notice:hover { background: var(--surface-2); }
.nico { width: 30px; height: 30px; border-radius: 9px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; flex: 0 0 auto; }
.notice p { font-size: 12.5px; color: var(--ink); }
.notice small { font-size: 11px; }

.search-box {
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--line); padding: 4px 2px 14px; color: var(--muted);
}
.search-box input { flex: 1; border: 0; outline: 0; background: transparent; font-size: 15px; color: var(--ink); }
.search-results { max-height: 360px; overflow-y: auto; padding-top: 12px; }
.search-results p { margin-bottom: 6px; }
.result { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; cursor: pointer; }
.result:hover { background: var(--surface-2); }
.rw { font-weight: 600; color: var(--ink); min-width: 108px; }
.rw.en { font-family: Georgia, serif; font-size: 16px; }
.empty-hint { padding: 26px 0; text-align: center; color: var(--muted); font-size: 13px; }

@media (max-width: 1100px) {
  .date-chip { display: none; }
  .search-pill { width: 188px; }
}
@media (max-width: 767px) {
  .header { padding: 0 16px; gap: 10px; height: 62px; }
  .menu-btn { display: grid; }
  .crumb { font-size: 12px; }
  .search-pill { width: 36px; padding: 0; justify-content: center; }
  .search-pill span, .search-pill kbd { display: none; }
  .head-right { gap: 8px; }
  .round-btn { display: none; }
}
</style>
