// ===================================================================
//  umami 数据适配层（只读）
//  本平台 = 在 umami 采集数据之上二次开发的前端。
//  默认 useMock:true 用内置演示数据；填好配置并置 false 即拉真实数据。
//  事件约定见「EA埋点方案-umami.md」；接口参考 docs.umami.is/docs/api
// ===================================================================
import { ref } from 'vue'
import type { FeatureUse, FunnelStep, KpiTuple, PeriodState } from '@/types'
import { tele, ovData } from './mock'
import { pct } from './compute'
import { periodState } from '@/stores/period'

export const UMAMI = {
  baseUrl: 'https://umami.你的域名',
  websiteId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  token: '', // 自建：POST /api/auth/login 拿；Cloud：API key
  useMock: true, // ← 改成 false 即接入真实数据
}

/** 接入后数据刷新信号：loadLive 覆盖 mock 后自增，页面 computed 读取它即可响应式更新 */
export const liveTick = ref(0)

/** 最近一次数据更新时间戳（顶部「更新于」展示 + 手动刷新更新） */
export const lastUpdated = ref(Date.now())
/** 手动刷新进行中标志（顶部按钮转圈用） */
export const refreshing = ref(false)

interface UmamiStats {
  visitors: number; pageviews: number; visits: number; bounces: number; totaltime: number
  comparison?: Partial<UmamiStats>
}
interface UmamiEvent { x: string; y: number }

async function um<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const u = new URL(UMAMI.baseUrl + path)
  Object.entries(params).forEach(([k, v]) => v != null && u.searchParams.set(k, String(v)))
  const r = await fetch(u, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + UMAMI.token } })
  if (!r.ok) throw new Error('umami ' + r.status)
  return r.json() as Promise<T>
}

/** 平台时间维度 → umami 时间戳区间 */
export function rangeMs(st: PeriodState) {
  const now = Date.now()
  if (st.period === 'custom') return { startAt: +new Date(st.from!), endAt: +new Date(st.to!) + 864e5 - 1, unit: 'day' }
  const days = { 天: 1, 周: 7, 月: 30 }[st.period]
  return { startAt: now - days * 864e5, endAt: now, unit: st.period === '天' ? 'hour' : 'day' }
}

/** 拉取总览：stats(含同比) + metrics(事件→功能使用/漏斗) */
export async function umOverview(st: PeriodState) {
  const { startAt, endAt } = rangeMs(st)
  const [stats, events] = await Promise.all([
    um<UmamiStats>(`/api/websites/${UMAMI.websiteId}/stats`, { startAt, endAt, compare: 'prev' }),
    um<UmamiEvent[]>(`/api/websites/${UMAMI.websiteId}/metrics`, { startAt, endAt, type: 'event' }),
  ])
  const tr = (c: number, p?: number) => (p ? Math.round(((c - p) / p) * 100) : 0)
  const cmp = stats.comparison || {}
  const access: KpiTuple[] = [
    ['活跃用户', stats.visitors, '', '去重访客', tr(stats.visitors, cmp.visitors)],
    ['访问次数', stats.pageviews, '', '页面访问 PV', tr(stats.pageviews, cmp.pageviews)],
    ['访问会话', stats.visits, '', '会话数', tr(stats.visits, cmp.visits)],
    ['跳出率', pct(stats.bounces, stats.visits), '%', '单页访问占比', tr(pct(stats.bounces, stats.visits), pct(cmp.bounces || 0, cmp.visits || 0))],
    ['平均停留', +(stats.totaltime / Math.max(1, stats.visits) / 60).toFixed(1), ' 分', '总时长/会话', 0],
  ]
  const ev = (n: string) => events.find((x) => x.x === n)?.y || 0
  const feats: FeatureUse[] = events.filter((e) => e.x.startsWith('模块:')).map((e): FeatureUse => [e.x.replace('模块:', ''), e.y]).sort((a, b) => b[1] - a[1])
  const F = ['funnel:进入新建Case', 'funnel:完成建Case', 'funnel:展开思维导图', 'funnel:申请结案']
  const b = ev(F[0]) || 1
  const funnel: FunnelStep[] = [
    ['进入新建 Case', ev(F[0]), '入口'],
    ['完成建 Case', ev(F[1]), pct(ev(F[1]), b) + '%'],
    ['展开思维导图', ev(F[2]), pct(ev(F[2]), b) + '%'],
    ['申请结案', ev(F[3]), pct(ev(F[3]), b) + '%'],
  ]
  return { access, feats, funnel }
}

/**
 * 接入开关：useMock=false 时用 umami 真实数据覆盖演示数据并触发页面刷新。
 * 参与/团队/用户明细：见「EA埋点方案-umami.md」（metrics type=distinctId / events series / reports）。
 */
export async function loadLive(overviewState: PeriodState) {
  if (UMAMI.useMock) return
  try {
    const o = await umOverview(overviewState)
    ovData['月'].access = o.access
    if (o.feats.length) tele.features = o.feats
    if (o.funnel[0][1]) tele.funnel = o.funnel
    liveTick.value++ // 通知页面响应式重渲染
  } catch (e) {
    console.warn('[umami] 拉取失败，回退演示数据：', e)
  }
}

/**
 * 手动刷新：重新拉取数据并更新「最后更新时间」。
 * live 模式走 loadLive 拉真实数据；mock 模式仅触发重渲染（演示动效）。
 * 顶部刷新按钮调用它；至少转圈 ~400ms 给用户明确反馈。
 */
export async function refresh() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await Promise.all([
      loadLive(periodState.overview),
      new Promise((r) => setTimeout(r, 400)),
    ])
    liveTick.value++ // mock 模式也刷新（派生值/滚动动效）
    lastUpdated.value = Date.now()
  } finally {
    refreshing.value = false
  }
}
