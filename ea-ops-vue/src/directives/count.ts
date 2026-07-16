import type { Directive } from 'vue'

// 数字滚动动效：从 0 缓动到目标，保留后缀（含 <small> 等 HTML）
function animate(el: HTMLElement) {
  const html = el.innerHTML
  const m = html.match(/^\s*(\d+(?:\.\d+)?)/)
  if (!m) return
  const end = parseFloat(m[1])
  const dec = (m[1].split('.')[1] || '').length
  const suffix = html.slice(m[0].length)
  const start = performance.now(), dur = 680
  function step(now: number) {
    const p = Math.min(1, (now - start) / dur)
    const v = end * (1 - Math.pow(1 - p, 3))
    el.innerHTML = (dec ? v.toFixed(dec) : Math.round(v)) + suffix
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/** v-count：挂载与更新时对元素内前导数字做缓动动画 */
export const vCount: Directive<HTMLElement> = {
  mounted: (el) => animate(el),
  updated: (el) => animate(el),
}
