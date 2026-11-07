let voice = null
let ready = false

function pickVoice() {
  if (!('speechSynthesis' in window)) return
  const list = window.speechSynthesis.getVoices()
  voice = list.find(v => /en-US/i.test(v.lang) && /female|Samantha|Zira|Aria|Jenny/i.test(v.name))
    || list.find(v => /en-US/i.test(v.lang))
    || list.find(v => /^en/i.test(v.lang))
    || null
  ready = true
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice()
  window.speechSynthesis.onvoiceschanged = pickVoice
}

export function speak(text, { rate = 0.88, force = false } = {}) {
  if (!('speechSynthesis' in window)) return false
  if (!force && !ready) pickVoice()
  if (!voice) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice
  u.lang = 'en-US'
  u.rate = rate
  u.pitch = 1
  window.speechSynthesis.speak(u)
  return true
}

export function stopSpeak() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
