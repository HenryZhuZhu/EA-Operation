// ===================================================================
//  HyperDX Session Replay 深链适配层（只读入口，风格对齐 umami.ts）
//  运营平台不录制会话——录制由 EA 主产品的 @hyperdx/browser 完成，
//  这里只负责「按工号 / 会话 / Case 跳进自建 HyperDX 的回放界面」。
//  上线时把 baseUrl 换成内网 HyperDX 地址、enabled 置 true 即可。
// ===================================================================

export const HYPERDX = {
  /** 自建 HyperDX UI 基址（内网），末尾不带 / */
  baseUrl: 'https://hyperdx.example.internal',
  /** 关闭时隐藏所有「查看会话回放」入口 */
  enabled: true,
  /** 录制侧 setGlobalAttributes 用的用户标识字段名（须与 EA 主产品埋点一致） */
  userIdKey: 'userId',
}

/** 转义搜索值里的引号，避免拼错查询串 */
const esc = (s: string) => String(s).replace(/"/g, '\\"')

/** 生成 HyperDX Sessions 检索深链；q 为空则打开全部会话 */
export function sessionsUrl(q = ''): string {
  const base = `${HYPERDX.baseUrl.replace(/\/$/, '')}/sessions`
  return q ? `${base}?q=${encodeURIComponent(q)}` : base
}

/** 按工号跳到该用户的会话回放 */
export function replayForUser(userId: string): string {
  return sessionsUrl(`${HYPERDX.userIdKey}:"${esc(userId)}"`)
}

/** 按关联 Case/Issue 号跳到相关会话（用于风险下钻）*/
export function replayForItems(items: string[]): string {
  const q = items.map((x) => `caseId:"${esc(x)}"`).join(' OR ')
  return sessionsUrl(q)
}
