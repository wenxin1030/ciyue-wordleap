export function chartColors() {
  const s = getComputedStyle(document.documentElement)
  const v = n => s.getPropertyValue(n).trim()
  return {
    grid: v('--chart-grid'),
    line: v('--chart-line'),
    accent: v('--chart-accent'),
    track: v('--chart-track'),
    text: v('--muted'),
    ink: v('--ink'),
    surface: v('--surface'),
    primary: v('--primary'),
    gold: v('--gold')
  }
}

export const baseGrid = { left: 8, right: 12, top: 18, bottom: 4, containLabel: true }

export function axisLabel(extra = {}) {
  return { color: '#8a968f', fontSize: 10.5, ...extra }
}
