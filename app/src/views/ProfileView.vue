<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>个人中心</h1>
        <p>管理你的账号信息、学习偏好与成就记录</p>
      </div>
      <span class="tiny muted">所有资料仅保存在本机浏览器</span>
    </div>

    <div class="profile-grid">
      <aside class="side">
        <section class="card profile-card">
          <div class="avatar serif">{{ initial }}</div>
          <h2>{{ profile.nickname || profile.name }}</h2>
          <p class="tiny muted">{{ profile.studentNo || '未填写学号' }} · {{ profile.className || '未填写班级' }}</p>
          <span class="chip primary level"><AppIcon name="star" :size="12" /> 等级 Lv.{{ user.levelInfo.lv }}·{{ user.levelInfo.title }}</span>
          <div class="xp">
            <div class="xp-bar"><span :style="{ width: user.levelInfo.pct + '%' }"></span></div>
            <div class="between tiny muted"><span class="num">{{ user.levelInfo.xp }} / {{ user.levelInfo.next?.exp || user.levelInfo.xp }} exp</span><span v-if="user.levelInfo.next">距 Lv.{{ user.levelInfo.next.lv }} 还差 {{ user.levelInfo.remain }}</span></div>
          </div>
          <div class="mini-stats">
            <div><strong class="num">{{ study.streak }}</strong><span>连续天数</span></div>
            <div><strong class="num">{{ mastered }}</strong><span>掌握词汇</span></div>
            <div><strong class="num">{{ hours }}</strong><span>学习小时</span></div>
          </div>
          <div class="row gap8" style="margin-top: 16px">
            <el-button round style="flex: 1" @click="focusForm"><AppIcon name="edit" :size="14" /> 编辑资料</el-button>
            <el-button round style="flex: 1" @click="pwVisible = true"><AppIcon name="lock" :size="14" /> 修改密码</el-button>
          </div>
        </section>

        <section class="card card-pad">
          <h3 class="card-h">账号安全</h3>
          <div class="sec-row">
            <div><strong class="small">登录密码</strong><p class="tiny muted">上次修改：{{ lastPwChange }}</p></div>
            <el-button size="small" round @click="pwVisible = true">修改</el-button>
          </div>
          <div class="sec-row">
            <div><strong class="small">绑定手机</strong><p class="tiny muted">{{ maskPhone }}</p></div>
            <span class="chip tiny primary">已绑定</span>
          </div>
          <div class="sec-row">
            <div><strong class="small">登录邮箱</strong><p class="tiny muted">{{ profile.email || '未绑定' }}</p></div>
            <span class="chip tiny" :class="profile.email ? 'primary' : ''">{{ profile.email ? '已验证' : '待绑定' }}</span>
          </div>
          <div class="sec-row" style="border-bottom: none">
            <div><strong class="small">退出登录</strong><p class="tiny muted">退出后本地学习记录仍会保留</p></div>
            <el-button size="small" round @click="logout">退出</el-button>
          </div>
        </section>
      </aside>

      <div class="main-col">
        <section class="card card-pad" ref="formCard">
          <SectionHeader title="基本信息" sub="修改后点击保存，数据写入本地缓存">
            <template #extra><span class="tiny muted">* 为必填项</span></template>
          </SectionHeader>
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="info-form">
            <div class="form-grid">
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="form.nickname" maxlength="12" show-word-limit placeholder="给自己起个名字" />
              </el-form-item>
              <el-form-item label="真实姓名" prop="name">
                <el-input v-model="form.name" maxlength="12" placeholder="用于学习报告" />
              </el-form-item>
              <el-form-item label="学号" prop="studentNo">
                <el-input v-model="form.studentNo" maxlength="20" placeholder="如 2024AI0312" />
              </el-form-item>
              <el-form-item label="班级" prop="className">
                <el-input v-model="form.className" maxlength="20" placeholder="如 人工智能 1 班" />
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="form.email" placeholder="用于找回账号" />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="form.phone" maxlength="11" placeholder="11 位手机号" />
              </el-form-item>
              <el-form-item label="所在院校">
                <el-input v-model="form.school" maxlength="30" placeholder="如 智能与工程学院" />
              </el-form-item>
              <el-form-item label="目标考试">
                <el-select v-model="form.targetExam" style="width: 100%">
                  <el-option v-for="e in exams" :key="e" :label="e" :value="e" />
                </el-select>
              </el-form-item>
              <el-form-item label="考试日期">
                <el-date-picker v-model="form.examDate" type="date" value-format="YYYY-MM-DD" placeholder="选择考试日期" style="width: 100%" :disabled-date="disBefore" />
              </el-form-item>
              <el-form-item label="每日目标（词）">
                <el-input-number v-model="form.dailyGoal" :min="5" :max="200" :step="5" style="width: 100%" />
              </el-form-item>
            </div>
            <el-form-item label="一句话简介">
              <el-input v-model="form.bio" type="textarea" :rows="2" maxlength="60" show-word-limit placeholder="例如：四级冲刺中，每天 30 分钟" />
            </el-form-item>
            <div class="row gap10">
              <el-button type="primary" round :loading="saving" @click="save">保存修改</el-button>
              <el-button round @click="reset">重置</el-button>
              <span v-if="dirty" class="tiny" style="color: var(--gold)">有未保存的修改</span>
            </div>
          </el-form>
        </section>

        <section class="card card-pad mt16">
          <SectionHeader title="学习偏好" sub="影响每日任务与复习排程" />
          <div class="pref-row">
            <div><strong class="small">每日目标词数</strong><p class="tiny muted">决定今日任务中的新词数量</p></div>
            <el-select :model-value="user.prefs.dailyGoal" style="width: 120px" @change="v => user.setPref('dailyGoal', v)">
              <el-option v-for="n in [10, 20, 30, 40, 60, 80]" :key="n" :label="n + ' 词 / 天'" :value="n" />
            </el-select>
          </div>
          <div class="pref-row">
            <div><strong class="small">发音方式</strong><p class="tiny muted">学习时点击扬声器才朗读，不会自动打扰</p></div>
            <span class="chip">手动点击</span>
          </div>
          <div class="pref-row">
            <div><strong class="small">每日学习提醒</strong><p class="tiny muted">20:30 通过站内通知提醒</p></div>
            <el-switch :model-value="user.prefs.remind" @change="v => user.setPref('remind', v)" />
          </div>
          <div class="pref-row">
            <div><strong class="small">智能复习优先</strong><p class="tiny muted">优先安排临近遗忘临界点的单词</p></div>
            <el-switch :model-value="user.prefs.smartFirst" @change="v => user.setPref('smartFirst', v)" />
          </div>
          <div class="pref-row">
            <div><strong class="small">音效反馈</strong><p class="tiny muted">答对、连击、升级时播放合成音效</p></div>
            <el-switch :model-value="user.prefs.sound" @change="toggleSound" />
          </div>
          <div class="pref-row" style="border-bottom: none">
            <div><strong class="small">深色模式</strong><p class="tiny muted">跟随系统或手动切换「深夜极光」</p></div>
            <el-switch :model-value="user.prefs.theme === 'night'" @change="user.toggleTheme" />
          </div>
        </section>

        <section class="card card-pad mt16">
          <SectionHeader title="成就墙" :sub="'已解锁 ' + unlocked + ' / 12'" link="查看全部" @link="$router.push('/achievements')" />
          <div class="ach-row">
            <div v-for="a in achievements" :key="a.id" class="ach" :class="{ locked: !user.data.achievements[a.id]?.unlocked }">
              <span class="ach-ico"><AppIcon :name="a.icon" :size="17" /></span>
              <span class="tiny">{{ a.name }}</span>
            </div>
          </div>
        </section>

        <section class="card card-pad mt16 danger-zone">
          <div>
            <strong class="small">演示数据</strong>
            <p class="tiny muted">重置后将清空当前账号并恢复为课程演示数据（含 90 天学习记录与已解锁成就）。</p>
          </div>
          <el-button round @click="resetDemo">重置演示数据</el-button>
        </section>
      </div>
    </div>

    <el-dialog v-model="pwVisible" title="修改密码" width="400px" align-center @closed="resetPw">
      <el-form ref="pwRef" :model="pw" :rules="pwRules" label-position="top">
        <el-form-item label="原密码" prop="oldPw">
          <el-input v-model="pw.oldPw" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPw">
          <el-input v-model="pw.newPw" type="password" show-password placeholder="6-20 位，建议字母 + 数字" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirm">
          <el-input v-model="pw.confirm" type="password" show-password placeholder="请再次输入新密码" @keyup.enter="submitPw" />
        </el-form-item>
      </el-form>
      <div class="tiny muted" style="margin-bottom: 12px">课程演示项目密码经本地哈希后存储在 localStorage，不涉及真实加密传输。</div>
      <template #footer>
        <el-button round @click="pwVisible = false">取消</el-button>
        <el-button type="primary" round :loading="pwSaving" @click="submitPw">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '../components/common/AppIcon.vue'
import SectionHeader from '../components/common/SectionHeader.vue'
import { useUserStore } from '../stores/user'
import { useStudyStore } from '../stores/study'
import { achievements } from '../mock/achievements'
import { masteredCount, sumRecords } from '../utils/stats'
import { setSoundEnabled } from '../utils/sound'

const user = useUserStore()
const study = useStudyStore()
const profile = computed(() => user.profile)
const initial = computed(() => (profile.value.nickname || profile.value.name || '林').slice(0, 1))
const mastered = computed(() => masteredCount(user.data))
const hours = computed(() => (sumRecords(user.data.records).minutes / 60).toFixed(1))
const unlocked = computed(() => achievements.filter(a => user.data.achievements[a.id]?.unlocked).length)
const lastPwChange = computed(() => profile.value.passwordUpdatedAt ? dayjs(profile.value.passwordUpdatedAt).format('YYYY 年 M 月 D 日') : '账号创建时')
const maskPhone = computed(() => {
  const p = profile.value.phone || ''
  return p.length === 11 ? p.slice(0, 3) + '****' + p.slice(-4) : p || '未绑定'
})

const exams = ['大学英语四级（CET-4）', '大学英语六级（CET-6）', '雅思 IELTS', '托福 TOEFL', '考研英语', 'GRE', '商务英语 BEC']
const formCard = ref(null)
const formRef = ref(null)
const saving = ref(false)
const form = reactive({
  nickname: '', name: '', studentNo: '', className: '', email: '', phone: '',
  school: '', targetExam: '', examDate: '', dailyGoal: 40, bio: ''
})
const snapshot = ref('')

const rules = {
  nickname: [{ required: true, message: '请填写昵称', trigger: 'blur' }],
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入 11 位有效手机号', trigger: 'blur' }]
}
const dirty = computed(() => JSON.stringify(form) !== snapshot.value)

function loadForm() {
  const p = profile.value
  Object.assign(form, {
    nickname: p.nickname || p.name || '',
    name: p.name || '',
    studentNo: p.studentNo || '',
    className: p.className || '',
    email: p.email || '',
    phone: p.phone || '',
    school: p.school || '',
    targetExam: p.targetExam || exams[0],
    examDate: p.examDate || dayjs().add(120, 'day').format('YYYY-MM-DD'),
    dailyGoal: user.prefs.dailyGoal || 40,
    bio: p.bio || ''
  })
  snapshot.value = JSON.stringify(form)
}
onMounted(loadForm)

function disBefore(d) {
  return dayjs(d).isBefore(dayjs().startOf('day'))
}
function focusForm() {
  formCard.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  setTimeout(() => formRef.value?.fields?.[0]?.input?.focus?.(), 300)
}
function save() {
  formRef.value?.validate(async ok => {
    if (!ok) return ElMessage.warning('请检查表单中标红的字段')
    if (!form.email && !form.phone) return ElMessage.warning('邮箱与手机号至少填写一项')
    saving.value = true
    try {
      user.updateProfile({ ...form })
      user.setPref('dailyGoal', form.dailyGoal)
      snapshot.value = JSON.stringify(form)
      ElMessage.success('资料已保存')
    } finally {
      saving.value = false
    }
  })
}
function reset() {
  loadForm()
  ElMessage.info('已恢复为上次保存的内容')
}

const pwVisible = ref(false)
const pwSaving = ref(false)
const pwRef = ref(null)
const pw = reactive({ oldPw: '', newPw: '', confirm: '' })
const pwRules = {
  oldPw: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPw: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为 6-20 位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: '建议同时包含字母与数字', trigger: 'blur' }
  ],
  confirm: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, cb) => {
        if (value !== pw.newPw) cb(new Error('两次输入的新密码不一致'))
        else cb()
      },
      trigger: 'blur'
    }
  ]
}
function resetPw() {
  pw.oldPw = ''; pw.newPw = ''; pw.confirm = ''
  pwRef.value?.clearValidate()
}
async function submitPw() {
  pwRef.value?.validate(async ok => {
    if (!ok) return
    pwSaving.value = true
    try {
      user.changePassword(pw.oldPw, pw.newPw)
      ElMessage.success('密码已更新，请牢记新密码')
      pwVisible.value = false
    } catch (e) {
      ElMessage.error(e.message)
    } finally {
      pwSaving.value = false
    }
  })
}

function toggleSound(v) {
  user.setPref('sound', v)
  setSoundEnabled(v)
}

async function logout() {
  try {
    await ElMessageBox.confirm('退出后本地学习记录仍会保留，确定退出登录吗？', '退出登录', {
      confirmButtonText: '退出', cancelButtonText: '取消', type: 'warning'
    })
    user.logout()
    window.location.hash = '#/login'
  } catch (e) { /* 取消 */ }
}

async function resetDemo() {
  try {
    await ElMessageBox.confirm('这会清空当前账号的所有学习记录并恢复演示数据，且不可撤销。', '重置演示数据', {
      confirmButtonText: '确认重置', cancelButtonText: '取消', type: 'warning'
    })
    user.resetDemo()
    ElMessage.success('已重置演示数据')
    window.location.hash = '#/login'
  } catch (e) { /* 取消 */ }
}
</script>

<style scoped>
.profile-grid { display: grid; grid-template-columns: 320px 1fr; gap: 16px; align-items: start; }
.side { display: flex; flex-direction: column; gap: 16px; }
.profile-card { padding: 26px 22px; text-align: center; }
.avatar { width: 88px; height: 88px; border-radius: 28px; background: linear-gradient(150deg, var(--primary-soft), var(--surface-2)); color: var(--primary); display: grid; place-items: center; font-size: 38px; margin: 0 auto 12px; border: 1px solid var(--line); }
.profile-card h2 { font-size: 19px; margin-bottom: 4px; }
.level { margin-top: 10px; }
.xp { margin-top: 16px; text-align: left; }
.xp-bar { height: 6px; border-radius: 3px; background: var(--surface-3); overflow: hidden; margin-bottom: 6px; }
.xp-bar span { display: block; height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--primary), var(--primary-light)); }
.mini-stats { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); }
.mini-stats div { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.mini-stats strong { font-size: 17px; color: var(--ink); }
.mini-stats span { font-size: 10px; color: var(--muted); }
.card-h { font-size: 14px; margin-bottom: 10px; }
.sec-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--line); }
.main-col { min-width: 0; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 18px; }
.info-form :deep(.el-form-item) { margin-bottom: 14px; }
.pref-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 13px 0; border-bottom: 1px solid var(--line); }
.ach-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.ach { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px 4px; border-radius: 12px; background: var(--surface-2); }
.ach-ico { width: 32px; height: 32px; border-radius: 10px; background: var(--gold-soft); color: var(--gold); display: grid; place-items: center; }
.ach.locked { opacity: .42; filter: grayscale(1); }
.ach.locked .ach-ico { background: var(--surface-3); color: var(--faint); }
.danger-zone { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.mt16 { margin-top: 16px; }
@media (max-width: 1100px) { .profile-grid { grid-template-columns: 1fr; } .side { display: grid; grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px) {
  .side { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .ach-row { grid-template-columns: repeat(3, 1fr); }
  .danger-zone { flex-direction: column; align-items: flex-start; }
}
</style>
