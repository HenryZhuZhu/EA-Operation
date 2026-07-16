// ===== 纯计算工具（框架无关，可直接复用） =====
import type { KpiTuple, OverviewBucket, PeriodState, UserRow, WorkStat } from '@/types'
import { TODAY, ovData, tele, VAL, KNOW, DV } from './mock'

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

/** KpiTuple → KpiCard 所需的 {label,value(html),calc(html)} */
export const kpiView = (k: KpiTuple) => ({
  label: k[0],
  value: `${k[1]}<small>${k[2]}</small>${trendHTML(k[4])}`,
  calc: `<code>${k[3]}</code> · 同比`,
})

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
