<script setup lang="ts">
// 迷你趋势线（sparkline）：SVG 折线 + 渐隐面积，颜色随涨跌；支持 hover 查看每点日期/数值
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  /** 时间序列数值（旧→新） */
  series: number[]
  /** 同比%：正=升(绿) 负=降(红) 0=平(灰) */
  trend?: number
  /** 每个点对应的标签（如日期 7-15），与 series 等长 */
  labels?: string[]
  /** 数值单位（tooltip 用，如 %、 分） */
  unit?: string
  width?: number
  height?: number
}>(), { trend: 0, width: 120, height: 34 })

const dir = computed(() => (props.trend > 0 ? 'up' : props.trend < 0 ? 'down' : 'flat'))

const geom = computed(() => {
  const s = props.series.length > 1 ? props.series : [0, 0]
  const w = props.width, h = props.height, pad = 3
  const min = Math.min(...s), max = Math.max(...s)
  const span = max - min || 1
  const step = (w - pad * 2) / (s.length - 1)
  const pts = s.map((v, i) => {
    const x = pad + i * step
    const y = pad + (1 - (v - min) / span) * (h - pad * 2)
    return [x, y] as const
  })
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const first = pts[0], last = pts[pts.length - 1]
  const area = `${line} L${last[0].toFixed(1)} ${h} L${first[0].toFixed(1)} ${h} Z`
  return { line, area, last, pts }
})

const hoverIdx = ref(-1)
function onMove(e: PointerEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const r = (e.clientX - rect.left) / rect.width
  const n = props.series.length
  hoverIdx.value = Math.min(n - 1, Math.max(0, Math.round(r * (n - 1))))
}
function onLeave() { hoverIdx.value = -1 }

const active = computed(() => {
  const i = hoverIdx.value
  if (i < 0 || !geom.value.pts[i]) return null
  const p = geom.value.pts[i]
  return {
    x: p[0],
    xPct: (p[0] / props.width) * 100,
    yPct: (p[1] / props.height) * 100,
    tipPct: Math.min(88, Math.max(12, (p[0] / props.width) * 100)),
    label: props.labels?.[i] ?? '',
    value: props.series[i],
  }
})

/** 末点圆点位置（百分比，供 HTML 正圆覆盖用） */
const endDot = computed(() => ({
  xPct: (geom.value.last[0] / props.width) * 100,
  yPct: (geom.value.last[1] / props.height) * 100,
}))
</script>

<template>
  <div class="spark-wrap" :class="dir" @pointermove="onMove" @pointerleave="onLeave">
    <svg
      class="spark"
      :class="dir"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      role="img"
      aria-hidden="true"
    >
      <path class="spark-area" :d="geom.area" />
      <path class="spark-line" :d="geom.line" />
      <line v-if="active" class="spark-guide" :x1="active.x" :x2="active.x" y1="0" :y2="height" />
    </svg>
    <!-- 圆点用 HTML 绝对定位，避免 SVG 非等比拉伸把圆压成椭圆 -->
    <span class="spark-dot-el" :style="{ left: endDot.xPct + '%', top: endDot.yPct + '%' }"></span>
    <span v-if="active" class="spark-hot-el" :style="{ left: active.xPct + '%', top: active.yPct + '%' }"></span>
    <div v-if="active" class="spark-tip" :style="{ left: active.tipPct + '%' }">
      <b>{{ active.value }}{{ unit }}</b><span v-if="active.label">{{ active.label }}</span>
    </div>
  </div>
</template>

