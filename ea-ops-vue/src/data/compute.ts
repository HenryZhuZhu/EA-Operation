// ===== 纯计算工具（框架无关，可直接复用） =====
import type { KpiTuple, OverviewBucket, PeriodState, UserRow, WorkStat, GrowthMetric, Growth } from '@/types'
import { TODAY, ovData, tele, VAL, KNOW, DV, growth } from './mock'

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

export const daysAgo = (d: string | null) =>
  d ? Math.round((+new Date(TODAY) - +new Date(d)) / 864e5) : null

export const userStatus = (u: UserRow): '活跃' | '沉默' | '从未登录' => {
  if (!u.lastLogin) return '从未登录'
  return (daysAgo(u.lastLogin) as number) <= 7 ? '活跃' : '沉默'
}

/** 近30天登录总数（用于个人占比推导） */
export const sumLogins = tele.users.reduce((s, u) => s + u.logins30d, 0) || 1

/** 工作产出（待接受/进行中/已完成 + 平均完成时长），由现有字段确定性推导 */
export function workStats(u: UserRow): WorkStat {
  const done = u.tasksDone
  const doing = u.lastLogin ? Math.round(u.tasksDone * 0.2 + (u.logins30d % 3)) : 0
  const pending = u.lastLogin ? Math.max(0, Math.round(u.casesCreated * 0.6 + (u.logins30d % 2))) : 0
  const avgHours = u.tasksDone ? +(6 + ((48 - u.logins30d) / 48) * 12).toFixed(1) : 0
  return { u, done, doing, pending, total: done + doing + pending, avgHours }
}

// ===== 时间维度（天/周/月/自定义）+ 同比趋势 =====
export const periodFactor: Record<'天' | '周' | '月', number> = { 天: 0.05, 周: 0.25, 月: 1 }
export const periodLabel: Record<'天' | '周' | '月', string> = { 天: '当日', 周: '本周', 月: '近30天' }
export const daysBetween = (a: string, b: string) =>
  Math.max(1, Math.round((+new Date(b) - +new Date(a)) / 864e5) + 1)

/** 运营总览：按时间档取 KPI（自定义区间下累计类指标按天值 × 天数） */
export function ovDataFor(st: PeriodState): OverviewBucket {
  if (st.period !== 'custom') return ovData[st.period]
  const D = daysBetween(st.from!, st.to!)
  const day = ovData['天'], mon = ovData['月']
  const cumulative = new Set(['活跃用户', '新增用户', '访问次数'])
  const mk = (key: 'access' | 'engage'): KpiTuple[] =>
    mon[key].map((r, i) =>
      cumulative.has(r[0])
        ? [r[0], Math.round(day[key][i][1] * D), r[2], r[3], r[4]] as KpiTuple
        : r,
    )
  return { access: mk('access'), engage: mk('engage') }
}

/** 缩放系数：自定义 = 天数/30，否则取档位系数 */
export const factorFor = (st: PeriodState) =>
  st.period === 'custom' ? daysBetween(st.from!, st.to!) / 30 : periodFactor[st.period]

/** 区间标签 */
export const labelFor = (st: PeriodState) =>
  st.period === 'custom' ? `${st.from!.slice(5)}–${st.to!.slice(5)}` : periodLabel[st.period]

/** 同比趋势徽标（HTML 字符串，供 v-html 使用） */
export const trendHTML = (d: number) => {
  if (!d) return '<span class="trend flat">— 0%</span>'
  const up = d > 0
  return `<span class="trend ${up ? 'up' : 'down'}" title="同比上一周期">${up ? '▲' : '▼'} ${Math.abs(d)}%</span>`
}

/** 由「当前值 + 同比%」确定性地推导一条迷你趋势序列（sparkline 用）。
 *  末点贴合真实值，起点按同比反推，中间加确定性微波动（同一卡每次渲染一致）。
 *  接入真实数据后可直接用 umami 的按天/周序列替换本函数。 */
export function sparkSeries(value: number, trend: number, seed = 0, n = 12): number[] {
  const end = value
  const start = trend ? end / (1 + trend / 100) : end * 0.96
  // 正弦哈希伪随机：0..1，确定性
  const rnd = (i: number) => {
    const x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  const amp = (Math.abs(end - start) || Math.max(1, Math.abs(end) * 0.05)) * 0.6
  const round = Number.isInteger(end) ? (x: number) => Math.round(x) : (x: number) => +x.toFixed(1)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1)
    const base = start + (end - start) * p
    const wob = i === 0 || i === n - 1 ? 0 : (rnd(i) - 0.5) * amp
    out.push(Math.max(0, round(base + wob)))
  }
  out[n - 1] = end
  return out
}

/** 由标签生成确定性种子，保证每张卡的波动形态固定 */
const seedOf = (s: string) => s.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

/** sparkline 每个点对应的时间标签：随所选周期变粒度（天=近n天/周=近n周/月=近n月）。
 *  接入真实数据后与真实序列的时间轴对齐即可。 */
export function sparkDates(st?: PeriodState, n = 12, end = TODAY): string[] {
  const t = +new Date(end)
  const fmtD = (d: Date) => `${d.getMonth() + 1}-${d.getDate()}`
  if (st?.period === '月') {
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(t); d.setMonth(d.getMonth() - (n - 1 - i)); return `${d.getMonth() + 1}月`
    })
  }
  const stepDays = st?.period === '周' ? 7 : 1
  return Array.from({ length: n }, (_, i) => fmtD(new Date(t - (n - 1 - i) * stepDays * 864e5)))
}

/** KpiTuple → KpiCard 所需的 {label,value(html),calc(html),series,labels,unit,trend} */
export const kpiView = (k: KpiTuple, st?: PeriodState) => ({
  label: k[0],
  value: `${k[1]}<small>${k[2]}</small>${trendHTML(k[4])}`,
  calc: `<code>${k[3]}</code> · 同比`,
  series: sparkSeries(k[1], k[4], seedOf(k[0])),
  labels: sparkDates(st),
  unit: k[2],
  trend: k[4],
})

// ===== 年度增长复盘：单指标的起止 / 增幅 / 净增统计 =====
export function growthStat(m: GrowthMetric) {
  const s = m.series
  const start = s[0], end = s[s.length - 1]
  const net = +(end - start).toFixed(1)
  const deltaPct = start ? Math.round(((end - start) / start) * 100) : 0
  const improved = m.betterWhenLower ? end < start : end > start
  return { start, end, net, deltaPct, improved, peak: Math.max(...s), low: Math.min(...s) }
}

// ---- 增长复盘：可调周期（日 / 周 / 月 / 季度 / 自定义）----
export type GrowthPeriod = '日' | '周' | '月' | '季度' | 'custom'
/** 逐月基准序列的时间基准：months[0] 视为该年 1 月 */
const GROWTH_YEAR = new Date(TODAY).getFullYear()
const GROWTH_START = +new Date(GROWTH_YEAR, 0, 1)
const AVG_MONTH_MS = 2629800000 // 平均一个月

/** 日期 → 逐月序列的小数下标（0=1月…），并按可用月数裁剪 */
const monthIdxOf = (d: number, maxIdx: number) =>
  Math.max(0, Math.min(maxIdx, (d - GROWTH_START) / AVG_MONTH_MS))

/** 线性插值取值 */
const sampleAt = (series: number[], idx: number) => {
  const i0 = Math.floor(idx), i1 = Math.min(series.length - 1, i0 + 1)
  return series[i0] + (series[i1] - series[i0]) * (idx - i0)
}

const mdLabel = (d: Date) => `${d.getMonth() + 1}-${d.getDate()}`

/** 日维度：基于最近月增速逐日投影（末点=当前值，带确定性微波动），
 *  避免「同一个月内多天被压平成 0%」。上线后可用后端按日聚合的真实序列替换。 */
function projectDaily(m: GrowthMetric, n: number): number[] {
  const s = m.series
  const end = s[s.length - 1]
  const prev = s[s.length - 2] ?? end
  const dGrowth = (prev ? (end - prev) / prev : 0) / 30 // 日增速≈月增速/30
  const isInt = s.every(Number.isInteger)
  const seed = m.key.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const amp = Math.abs(end) * 0.008
  const out: number[] = []
  for (let k = 0; k < n; k++) {
    const back = n - 1 - k
    let v = end / Math.pow(1 + dGrowth, back)
    if (k !== n - 1) v += Math.sin(k * 0.8 + seed) * amp // 平滑低频波动，避免锯齿
    out.push(Math.max(0, isInt ? Math.round(v) : +v.toFixed(1)))
  }
  out[n - 1] = end
  return out
}

/**
 * 按所选周期把「逐月基准」重采样为分桶序列：
 * 月→原始月点；季度→季度末点；周→近12周；自定义→区间内按跨度自适应日/周/月分桶。
 * 数据为示例；接入 umami 后可直接用后端按周期聚合的真实序列替换本函数。
 */
export function growthView(period: GrowthPeriod, from?: string, to?: string): Growth {
  const base = growth
  const maxIdx = base.months.length - 1
  let ticks: { label: string; idx: number }[]

  if (period === '月') {
    ticks = base.months.map((m, i) => ({ label: m, idx: i }))
  } else if (period === '日') {
    const N = 14, today = +new Date(TODAY)
    ticks = Array.from({ length: N }, (_, k) => {
      const d = new Date(today - (N - 1 - k) * 864e5)
      return { label: mdLabel(d), idx: monthIdxOf(+d, maxIdx) }
    })
  } else if (period === '季度') {
    ticks = [
      { label: 'Q1', idx: 2 }, { label: 'Q2', idx: 5 }, { label: 'Q3', idx: 8 }, { label: 'Q4', idx: 11 },
    ].filter((q) => q.idx <= maxIdx).map((q) => ({ label: q.label, idx: q.idx }))
    // 若最新月份处于未完成的季度，补一个「本季」点展示最新值
    if (!ticks.length || ticks[ticks.length - 1].idx < maxIdx) {
      ticks.push({ label: '本季', idx: maxIdx })
    }
  } else if (period === '周') {
    const N = 12, today = +new Date(TODAY)
    ticks = Array.from({ length: N }, (_, k) => {
      const d = new Date(today - (N - 1 - k) * 7 * 864e5)
      return { label: mdLabel(d), idx: monthIdxOf(+d, maxIdx) }
    })
  } else {
    const f = +new Date(from!), t = +new Date(to!)
    const days = Math.max(1, Math.round((t - f) / 864e5))
    const stepD = days <= 14 ? 1 : days <= 120 ? 7 : 30
    const n = Math.max(2, Math.min(16, Math.floor(days / stepD) + 1))
    ticks = Array.from({ length: n }, (_, k) => {
      const d = new Date(f + (k * (days / (n - 1))) * 864e5)
      return { label: mdLabel(d), idx: monthIdxOf(+d, maxIdx) }
    })
  }

  const metrics: GrowthMetric[] = base.metrics.map((m) => {
    const isInt = m.series.every(Number.isInteger)
    const series = period === '日'
      ? projectDaily(m, ticks.length)
      : ticks.map((tk) => {
          const v = sampleAt(m.series, tk.idx)
          return isInt ? Math.round(v) : +v.toFixed(1)
        })
    return { ...m, series }
  })
  return { months: ticks.map((tk) => tk.label), metrics }
}

// ===== 价值与收益：把数据折算为可汇报的工时/成本收益（口径可调） =====
export function valueModel() {
  const aiMonth = tele.aiAdopt
  const closeMonth = tele.funnel[3][1]
  const caseH = Math.round(closeMonth * VAL.hoursPerCase * 12)
  const aiH = Math.round((aiMonth * VAL.aiMinPerUse) / 60 * 12)
  const autoH = Math.round((VAL.autoCasePerMonth * VAL.autoCaseMin) / 60 * 12)
  const reuseH = Math.round(KNOW.paths * DV.reuseRate * DV.hoursPerReuse)
  const avoidH = Math.round(KNOW.deadEnds * DV.avoidRate * DV.hoursPerDeadEnd)
  const dataH = reuseH + avoidH
  const dataCost = dataH * VAL.hourlyRate
  const totalH = caseH + aiH + autoH + reuseH + avoidH
  const totalCost = totalH * VAL.hourlyRate
  return { aiMonth, closeMonth, caseH, aiH, autoH, reuseH, avoidH, dataH, dataCost, totalH, totalCost }
}
