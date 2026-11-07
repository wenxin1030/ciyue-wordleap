<template>
  <div class="auth">
    <button class="theme-fab" @click="user.toggleTheme()">
      <AppIcon :name="user.prefs.theme === 'night' ? 'sun' : 'moon'" :size="17" />
    </button>

    <section class="brand-panel">
      <div class="brand-top">
        <span class="logo serif">Aa</span>
        <div><strong>词跃</strong><small>WORDLEAP</small></div>
      </div>

      <div class="brand-mid">
        <p class="eyebrow">基于艾宾浩斯遗忘曲线的智能背词系统</p>
        <h1>让每个单词，<br />都在该忘记之前重逢。</h1>
        <p class="brand-desc">记忆曲线排程 · 听写与拼写 · 错词追踪 · 学习画像，把「背了又忘」变成「越记越牢」。</p>
        <div class="brand-stats">
          <div><strong class="num">12,400</strong><span>精选词条</span></div>
          <div><strong class="num">98%</strong><span>复习依从率</span></div>
          <div><strong class="num">30<span class="unit">天</span></strong><span>平均掌握周期</span></div>
        </div>
      </div>

      <div class="brand-foot">
        <span>© 2026 词跃 WordLeap</span>
        <span>课程设计作品 · 数据保存在本地</span>
      </div>
      <span class="deco d1"></span>
      <span class="deco d2"></span>
      <span class="deco d3"></span>
    </section>

    <section class="form-panel">
      <div class="form-wrap">
        <div class="tabs">
          <button v-for="t in tabs" :key="t.key" class="tab" :class="{ active: tab === t.key }" @click="switchTab(t.key)">{{ t.label }}</button>
        </div>

        <template v-if="tab === 'login'">
          <h2 class="title">欢迎回来</h2>
          <p class="sub">登录后继续你的记忆曲线，未完成的队列会自动恢复。</p>
          <el-form ref="loginRef" :model="loginForm" :rules="loginRules" label-position="top" size="large" @submit.prevent="doLogin">
            <el-form-item label="手机号 / 邮箱" prop="account">
              <el-input v-model="loginForm.account" placeholder="请输入注册时的手机号或邮箱" autocomplete="username">
                <template #prefix><AppIcon name="mail" :size="14" /></template>
              </el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" type="password" show-password placeholder="请输入密码" autocomplete="current-password" @keyup.enter="doLogin">
                <template #prefix><AppIcon name="lock" :size="14" /></template>
              </el-input>
            </el-form-item>
            <div class="row between mb16">
              <el-checkbox v-model="loginForm.remember">记住我（7 天免登录）</el-checkbox>
              <span class="link small" @click="switchTab('reset')">忘记密码？</span>
            </div>
            <el-button type="primary" class="submit" :loading="loading" @click="doLogin">登 录</el-button>
          </el-form>

          <p class="agreement tiny">登录即表示同意《学习数据说明》：所有记录仅保存在本机浏览器。</p>
        </template>

        <template v-else-if="tab === 'register'">
          <h2 class="title">创建学习档案</h2>
          <p class="sub">30 秒完成，系统会按你的目标考试生成首周计划。</p>
          <el-form ref="regRef" :model="regForm" :rules="regRules" label-position="top" size="large">
            <div class="two-col">
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="regForm.nickname" placeholder="例如：林小满" />
              </el-form-item>
              <el-form-item label="学号（选填）" prop="studentNo">
                <el-input v-model="regForm.studentNo" placeholder="2024AI0312" />
              </el-form-item>
            </div>
            <el-form-item label="手机号 / 邮箱" prop="account">
              <el-input v-model="regForm.account" placeholder="用于登录，支持手机号或邮箱">
                <template #prefix><AppIcon name="mail" :size="14" /></template>
              </el-input>
            </el-form-item>
            <div class="two-col">
              <el-form-item label="密码" prop="password">
                <el-input v-model="regForm.password" type="password" show-password placeholder="至少 6 位">
                <template #prefix><AppIcon name="lock" :size="14" /></template>
              </el-input>
              </el-form-item>
              <el-form-item label="确认密码" prop="confirm">
                <el-input v-model="regForm.confirm" type="password" show-password placeholder="再次输入">
                <template #prefix><AppIcon name="lock" :size="14" /></template>
              </el-input>
              </el-form-item>
            </div>
            <el-form-item label="所在院校（选填）" prop="school">
              <el-input v-model="regForm.school" placeholder="智能与工程学院" />
            </el-form-item>
            <el-button type="primary" class="submit" :loading="loading" @click="doRegister">注册并开始</el-button>
          </el-form>
          <p class="agreement tiny">注册后默认加入「大学英语四级核心词汇」，可随时在词书库更换。</p>
        </template>

        <template v-else>
          <h2 class="title">找回密码</h2>
          <p class="sub">演示环境不上传任何数据，重置仅作用于本地账号。</p>
          <el-form label-position="top" size="large" @submit.prevent>
            <el-form-item label="注册手机号 / 邮箱">
              <el-input v-model="resetAccount" placeholder="请输入注册账号">
                <template #prefix><AppIcon name="mail" :size="14" /></template>
              </el-input>
            </el-form-item>
            <el-button type="primary" class="submit" @click="doReset">发送重置链接</el-button>
          </el-form>
          <div class="reset-note">
            <AppIcon name="info" :size="16" />
            <p class="tiny">本地账号无法通过邮件找回。请在登录页注册新账号；登录后也可在个人中心直接修改密码。</p>
          </div>
        </template>

        <div class="other">
          <span class="line"></span><small class="muted">其他登录方式</small><span class="line"></span>
        </div>
        <div class="other-btns">
          <el-button plain @click="tip"><AppIcon name="mail" :size="15" /> 校园邮箱</el-button>
          <el-button plain @click="tip"><AppIcon name="users" :size="15" /> 统一身份认证</el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppIcon from '../components/common/AppIcon.vue'
import { useUserStore } from '../stores/user'

const user = useUserStore()
const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'login', label: '登录' },
  { key: 'register', label: '注册' },
  { key: 'reset', label: '找回密码' }
]
const tab = ref('login')
const loading = ref(false)
const loginRef = ref()
const regRef = ref()
const resetAccount = ref('')
const forgotVisible = ref(false)

const loginForm = reactive({ account: '', password: '', remember: true })
const loginRules = {
  account: [{ required: true, message: '请输入手机号或邮箱', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

const regForm = reactive({ nickname: '', account: '', password: '', confirm: '', studentNo: '', school: '' })
const regRules = {
  nickname: [{ required: true, message: '给自己起个昵称', trigger: 'blur' }],
  account: [
    { required: true, message: '请输入手机号或邮箱', trigger: 'blur' },
    {
      validator: (rule, value, cb) => {
        const ok = /^1[3-9]\d{9}$/.test(value) || /^[\w.+-]+@[\w-]+\.[\w.]+$/.test(value)
        cb(ok ? undefined : new Error('请输入有效的手机号或邮箱地址'))
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, cb) => cb(value === regForm.password ? undefined : new Error('两次输入的密码不一致')),
      trigger: 'blur'
    }
  ]
}

function switchTab(key) { tab.value = key }

async function doLogin() {
  try {
    await loginRef.value.validate()
  } catch (e) { return }
  loading.value = true
  try {
    user.login(loginForm.account, loginForm.password, loginForm.remember)
    ElMessage.success('欢迎回来，' + user.displayName)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    router.replace(redirect)
  } catch (e) {
    ElMessage.error(e.message || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}

async function doRegister() {
  try {
    await regRef.value.validate()
  } catch (e) { return }
  loading.value = true
  try {
    user.register({ account: regForm.account, password: regForm.password, nickname: regForm.nickname, studentNo: regForm.studentNo, school: regForm.school })
    ElMessage.success('注册成功，已为你生成首周计划')
    router.replace('/dashboard')
  } catch (e) {
    ElMessage.error(e.message || '注册失败')
  } finally {
    loading.value = false
  }
}

function doReset() {
  const a = resetAccount.value.trim()
  if (!a) return ElMessage.warning('请先输入注册账号')
  ElMessage.success('本地账号请注册新账号开始学习，登录后可在个人中心修改密码')
  tab.value = 'login'
}
function tip() { ElMessage.info('课程演示版暂未接入校园统一认证') }
</script>

<style scoped>
.auth { display: grid; grid-template-columns: 44% 56%; min-height: 100vh; background: var(--bg); }
.theme-fab {
  position: fixed; right: 26px; top: 22px; z-index: 10;
  width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid var(--line); background: var(--surface); color: var(--muted);
  display: grid; place-items: center; cursor: pointer;
}
.brand-panel {
  position: relative; overflow: hidden;
  background: linear-gradient(158deg, #1F6F5C 0%, #175448 52%, #123F36 100%);
  color: #F4EFE3; padding: 44px 52px 30px; display: flex; flex-direction: column;
}
.brand-top { display: flex; align-items: center; gap: 12px; position: relative; z-index: 2; }
.logo {
  width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center;
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.25);
  font-size: 21px; font-weight: 700; color: #fff;
}
.brand-top strong { font-size: 18px; letter-spacing: 2px; display: block; line-height: 1.2; }
.brand-top small { font-size: 9px; letter-spacing: 3px; opacity: .7; }
.brand-mid { margin: auto 0; position: relative; z-index: 2; }
.eyebrow { font-size: 12px; letter-spacing: .5px; opacity: .72; margin-bottom: 18px; }
.brand-mid h1 { color: #FBF7EC; font-family: Georgia, "Times New Roman", "Songti SC", serif; font-size: clamp(28px, 3vw, 42px); line-height: 1.42; font-weight: 500; letter-spacing: .5px; }
.brand-desc { margin-top: 18px; font-size: 13.5px; line-height: 1.9; opacity: .75; max-width: 400px; }
.brand-stats { display: flex; gap: 44px; margin-top: 34px; }
.brand-stats div { display: flex; flex-direction: column; }
.brand-stats strong { font-size: 26px; font-weight: 600; letter-spacing: .5px; }
.brand-stats .unit { font-size: 14px; margin-left: 2px; }
.brand-stats span { font-size: 11px; opacity: .65; margin-top: 2px; }
.brand-foot { display: flex; justify-content: space-between; font-size: 10.5px; opacity: .55; position: relative; z-index: 2; }
.deco { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,.13); }
.d1 { width: 460px; height: 460px; right: -180px; top: -120px; }
.d2 { width: 720px; height: 720px; right: -300px; top: -240px; border-color: rgba(255,255,255,.08); }
.d3 { width: 300px; height: 300px; left: -120px; bottom: 60px; background: rgba(255,255,255,.03); }

.form-panel { display: grid; place-items: center; padding: 42px 40px; }
.form-wrap { width: 100%; max-width: 420px; }
.tabs { display: flex; gap: 26px; border-bottom: 1px solid var(--line); margin-bottom: 28px; }
.tab {
  background: none; border: 0; padding: 0 0 12px; font-size: 14px; color: var(--muted);
  cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.tab.active { color: var(--ink); font-weight: 600; border-color: var(--primary); }
.title { font-size: 26px; letter-spacing: -.4px; }
.sub { color: var(--muted); font-size: 12.5px; margin: 8px 0 24px; line-height: 1.7; }
.submit { width: 100%; height: 46px; border-radius: 12px; font-size: 14px; letter-spacing: 1px; margin-top: 4px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.divider-text { display: flex; align-items: center; gap: 12px; margin: 22px 0 14px; color: var(--muted); font-size: 11px; }
.divider-text::before, .divider-text::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.agreement { color: var(--faint); margin-top: 16px; line-height: 1.7; }
.other { display: flex; align-items: center; gap: 12px; margin: 26px 0 14px; }
.other .line { flex: 1; height: 1px; background: var(--line); }
.other-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.other-btns :deep(.el-button) { height: 40px; border-radius: 11px; }
.reset-note { display: flex; gap: 10px; margin-top: 18px; padding: 12px; border-radius: 12px; background: var(--surface-2); color: var(--muted); line-height: 1.7; }
.reset-note :deep(svg) { margin-top: 3px; flex: 0 0 auto; }

@media (max-width: 980px) {
  .auth { grid-template-columns: 1fr; }
  .brand-panel { display: none; }
  .form-panel { padding: 32px 22px; }
  .theme-fab { top: 18px; right: 18px; }
}
</style>