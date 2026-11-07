let ctx = null
let enabled = true

export function setSoundEnabled(v) { enabled = !!v }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, start, dur, type = 'sine', gain = 0.06) {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  const t0 = c.currentTime + start
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g)
  g.connect(c.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

export const sfx = {
  correct() { if (!enabled) return; tone(660, 0, 0.12); tone(990, 0.07, 0.16) },
  wrong() { if (!enabled) return; tone(220, 0, 0.16, 'triangle', 0.05); tone(165, 0.09, 0.2, 'triangle', 0.04) },
  combo(n) {
    if (!enabled) return
    const base = 620 + Math.min(n, 8) * 45
    tone(base, 0, 0.09, 'sine', 0.05)
    tone(base * 1.25, 0.06, 0.12, 'sine', 0.045)
  },
  coin() { if (!enabled) return; tone(880, 0, 0.08, 'square', 0.035); tone(1320, 0.07, 0.14, 'square', 0.03) },
  levelUp() {
    if (!enabled) return
    ;[523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.05))
  }
}
