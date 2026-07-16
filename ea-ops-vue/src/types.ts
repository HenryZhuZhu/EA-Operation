// ===== 数据契约（迁移到任何框架都不变） =====

/** KPI 卡：[名称, 数值, 单位, 计算口径文案, 同比%（正=绿↑ 负=红↓）] */
export type KpiTuple = [name: string, value: number, unit: string, calc: string, trend: number]

/** 运营总览一个时间档的两组 KPI */
export interface OverviewBucket {
  access: KpiTuple[]
  engage: KpiTuple[]
}

/** 核心行为漏斗步骤：[步骤名, 人数, 标签] */
export type FunnelStep = [name: string, count: number, label: string]

/** 功能模块使用：[模块名, 次数] */
export type FeatureUse = [name: string, count: number]

/** 用户明细（谁用了 / 谁没用）。lastLogin=null 表示从未登录 */
export interface UserRow {
  name: string
  dept: string
  lastLogin: string | null
  logins30d: number
  stayMin: number
  casesCreated: number
  tasksDone: number
  aiUse: number
}

/** 风险预警：AI 归纳的共性失效根因 */
export interface RiskCluster {
  cause: string
  sev: 'high' | 'mid' | 'low'
  trend: string
  products: string[]
  items: string[]
  desc: string
  ai: string
}

/** 示例埋点数据（上线后由 umami / EA 后端覆盖） */
export interface Tele {
  mau: number
  wau: number
  dau: number
  newUsers: number
  retentionD1: number
  retentionD7: number
  avgStayMin: number
  teams: number
  features: FeatureUse[]
  hoursBase: number[]
  funnel: FunnelStep[]
  guideStart: number
  guideDone: number
  whatsnewPush: number
  whatsnewRead: number
  aiCall: number
  aiAdopt: number
  searchUse: number
  searchNoResult: number
  users: UserRow[]
}

export type Period = '天' | '周' | '月' | 'custom'

export interface PeriodState {
  period: Period
  from: string | null
  to: string | null
}

/** 工作产出（由 UserRow 现有字段确定性推导） */
export interface WorkStat {
  u: UserRow
  done: number
  doing: number
  pending: number
  total: number
  avgHours: number
}
