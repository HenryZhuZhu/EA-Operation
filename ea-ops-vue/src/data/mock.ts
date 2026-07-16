// ===================================================================
//  数据层（唯一需要替换的文件）
//  上线时把这里的「示例数据」换成 umami / EA 后端返回的真实数据即可，
//  视图与计算逻辑无需改动。字段含义见 ../types.ts 与 交接文档。
// ===================================================================
import type { OverviewBucket, RiskCluster, Tele } from '@/types'

/** 演示用「今天」；接入真实数据后可用 new Date() */
export const TODAY = '2026-07-16'

/** 示例埋点数据（非业务数据，上线后采集） */
export const tele: Tele = {
  mau: 142, wau: 96, dau: 38, newUsers: 6, retentionD1: 64, retentionD7: 45,
  avgStayMin: 8.7, teams: 8,
  // 功能模块使用：[模块名, 次数] ← umami metrics(type=event) 中「模块:」前缀事件
  features: [
    ['Case 详情', 1320], ['思维导图分析', 540], ['全局搜索', 430], ['新建 Case', 210],
    ['结案申请', 150], ['退回重做', 88], ['评论 / @', 176], ['AI 润色', 96],
    ['演示模式', 74], ['语音备注', 52],
  ],
  // 24 小时访问分布：索引 0..23 = 每小时值 ← umami pageviews?unit=hour
  hoursBase: [5, 3, 2, 2, 3, 6, 14, 38, 96, 168, 205, 188, 96, 120, 196, 210, 175, 120, 64, 40, 28, 20, 12, 8],
  // 核心行为漏斗：[步骤名, 人数, 标签] ← umami「funnel:」前缀事件
  funnel: [
    ['进入新建 Case', 210, '入口'], ['完成建 Case', 168, '80%'],
    ['展开思维导图', 132, '63%'], ['申请结案', 61, '29%'],
  ],
  guideStart: 120, guideDone: 97, whatsnewPush: 156, whatsnewRead: 132,
  aiCall: 148, aiAdopt: 61, searchUse: 430, searchNoResult: 38,
  // 用户登录与使用明细（示例埋点，具体到人：谁用了、谁没用）
  // lastLogin=null 表示从未登录；logins30d=近30天登录次数；stayMin=近30天累计停留分钟
  users: [
    { name: '张伟', dept: 'PTE', lastLogin: '2026-07-16', logins30d: 48, stayMin: 642, casesCreated: 3, tasksDone: 22, aiUse: 14 },
    { name: '王芳', dept: 'CP', lastLogin: '2026-07-16', logins30d: 41, stayMin: 510, casesCreated: 0, tasksDone: 18, aiUse: 9 },
    { name: '刘洋', dept: 'PTE', lastLogin: '2026-07-15', logins30d: 39, stayMin: 470, casesCreated: 1, tasksDone: 15, aiUse: 7 },
    { name: '孙楠', dept: 'SAE', lastLogin: '2026-07-15', logins30d: 22, stayMin: 260, casesCreated: 1, tasksDone: 7, aiUse: 3 },
    { name: '赵敏', dept: 'FT', lastLogin: '2026-07-14', logins30d: 33, stayMin: 388, casesCreated: 2, tasksDone: 12, aiUse: 5 },
    { name: '陈磊', dept: 'EFA', lastLogin: '2026-07-13', logins30d: 28, stayMin: 333, casesCreated: 1, tasksDone: 9, aiUse: 6 },
    { name: '周杰', dept: 'PTE', lastLogin: '2026-07-10', logins30d: 18, stayMin: 210, casesCreated: 1, tasksDone: 6, aiUse: 2 },
    { name: '李昊', dept: 'PE', lastLogin: '2026-07-05', logins30d: 9, stayMin: 96, casesCreated: 0, tasksDone: 3, aiUse: 1 },
    { name: '吴迪', dept: 'PE', lastLogin: '2026-07-02', logins30d: 6, stayMin: 60, casesCreated: 0, tasksDone: 2, aiUse: 0 },
    { name: '周宇', dept: 'PE', lastLogin: '2026-06-28', logins30d: 4, stayMin: 38, casesCreated: 0, tasksDone: 1, aiUse: 0 },
    { name: '李娜', dept: 'DA', lastLogin: '2026-06-20', logins30d: 3, stayMin: 22, casesCreated: 0, tasksDone: 0, aiUse: 0 },
    { name: '郑爽', dept: 'FT', lastLogin: null, logins30d: 0, stayMin: 0, casesCreated: 0, tasksDone: 0, aiUse: 0 },
    { name: '黄伟', dept: 'DA', lastLogin: null, logins30d: 0, stayMin: 0, casesCreated: 0, tasksDone: 0, aiUse: 0 },
    { name: '林涛', dept: 'CP', lastLogin: null, logins30d: 0, stayMin: 0, casesCreated: 0, tasksDone: 0, aiUse: 0 },
  ],
}

// 每张卡：[名称, 数值, 单位, 口径, 同比趋势%]（正=上升绿，负=下降红）
export const ovData: Record<'天' | '周' | '月', OverviewBucket> = {
  天: {
    access: [['活跃用户', 38, '', '去重登录用户', 9], ['新增用户', 3, '', '新注册用户', 6], ['访问次数', 210, '', '页面访问 PV', 14], ['次日留存', 61, '%', '隔日回访率', -2], ['平均停留', 7.9, ' 分', '会话时长均值', 3], ['覆盖团队', 6, '', '有活跃团队数', 0]],
    engage: [['注册用户', 14, '', '账号总数', 0], ['活跃率', 43, '%', '活跃/注册', 7], ['AI 采纳率', 39, '%', '采纳/调用=57/146', 4], ['引导完成率', 78, '%', '完成/启动=93/119', 3], ['版本已读率', 72, '%', '已读/推送=112/156', 5], ['搜索无结果率', 11, '%', '无结果/使用=41/372', -2]],
  },
  周: {
    access: [['活跃用户', 96, '', '去重登录用户', 12], ['新增用户', 11, '', '新注册用户', 5], ['访问次数', 940, '', '页面访问 PV', 8], ['次日留存', 63, '%', '隔日回访率', 1], ['平均停留', 8.4, ' 分', '会话时长均值', -1], ['覆盖团队', 7, '', '有活跃团队数', 1]],
    engage: [['注册用户', 14, '', '账号总数', 0], ['活跃率', 57, '%', '活跃/注册', 9], ['AI 采纳率', 41, '%', '采纳/调用=61/148', 6], ['引导完成率', 80, '%', '完成/启动=97/121', 2], ['版本已读率', 81, '%', '已读/推送=126/156', 8], ['搜索无结果率', 9, '%', '无结果/使用=38/430', -3]],
  },
  月: {
    access: [['活跃用户', 142, '', '去重登录用户', 6], ['新增用户', 24, '', '新注册用户', -3], ['访问次数', 1860, '', '页面访问 PV', 5], ['次日留存', 64, '%', '隔日回访率', 2], ['平均停留', 8.7, ' 分', '会话时长均值', 4], ['覆盖团队', 8, '', '有活跃团队数', 0]],
    engage: [['注册用户', 14, '', '账号总数', 1], ['活跃率', 50, '%', '活跃/注册', 6], ['AI 采纳率', 41, '%', '采纳/调用=61/148', 3], ['引导完成率', 81, '%', '完成/启动=97/120', 4], ['版本已读率', 85, '%', '已读/推送=132/156', 6], ['搜索无结果率', 9, '%', '无结果/使用=38/430', -1]],
  },
}

/** 风险预警：AI 归纳共性失效根因（基于 EA Issue/Case，示例；上线由后端 AI 归因产出） */
export const riskClusters: RiskCluster[] = [
  { cause: 'Pattern / Timing margin 不足', sev: 'high', trend: '本周新增 +2 · 持续增长', products: ['DDR5-X-6400', 'LPDDR5-7500', 'DDR5-X-7200'], items: ['ISS-20260415', 'EA-260511000001', 'EA-260608000091'], desc: '低压与边界条件下 timing margin 不足，在多个 DDR5 / LPDDR5 产品及 DIMM SLT 复现失效中反复出现，AI 判定为同源。', ai: '建立跨产品专项，统一补齐 PVT / timing 覆盖，并将边界条件回写检查清单。' },
  { cause: 'PVT 工艺角覆盖不足', sev: 'high', trend: '本周新增 +1', products: ['DDR4-3200', 'LPDDR5-7500'], items: ['ISS-20260530', 'EA-260511000005', 'EA-260511000002'], desc: '客户现场 VDDmin 偏移与 FT 复测率偏高，AI 归并为 PVT 工艺角覆盖不足。', ai: '补充 FSO 阶段 PVT 检查项，并升级相关 fanout 验证。' },
  { cause: '扩散 / 温控工艺漂移', sev: 'mid', trend: '趋稳 · 已有对策', products: ['Flash-N', 'DDR5-X-6400'], items: ['ISS-20260220', 'EA-260511000003'], desc: 'WAT Vth 漂移与边缘 die 工艺漂移同源；已有解决方案但验证覆盖不足。', ai: '优先完成剩余产品 fanout 验证，评估是否可关闭。' },
  { cause: 'DIMM 颗粒焊点 / 接触类失效', sev: 'mid', trend: '客诉相关', products: ['DMJFC'], items: ['ISS-20260607', 'EA-260607000090.C01', 'EA-260607000090.C03'], desc: 'DIMM 客退拆分子案中 Bit Fail / Open 比例上升，疑似焊点 / 接触工艺窗口问题。', ai: '对批次与工艺参数做关联分析，确认是否需扩大影响范围。' },
]

// ===== 价值与收益口径常量（可调假设；与业务/财务对齐后填入） =====
export const VAL = { hourlyRate: 120, aiMinPerUse: 8, hoursPerCase: 3, autoCasePerMonth: 18, autoCaseMin: 4 }
export const KNOW = { cases: 128, nodes: 1840, paths: 96, deadEnds: 520 } // 思维导图沉淀量 ← EA 后端
export const DV = { reuseRate: 0.4, hoursPerReuse: 4, avoidRate: 0.2, hoursPerDeadEnd: 1.5 }
