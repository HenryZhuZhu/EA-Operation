# EA 运营平台 · 开发交接文档（Handoff）

> 交接目标：**前端不重写**。原型 `EA运营平台-方案预览.html` 已是可直接复用的成品前端 —— 所有页面、样式、动效、图表、交互均已完成。开发同学**只需接入数据**即可上线：把内置的「示例数据」换成 umami / EA 后端的真实数据。
>
> 一句话架构：**运营平台 = 在 umami 采集数据之上二次开发的只读前端**。视图层已写死，数据层已隔离成几个明确的对象与一个适配层，替换这几处即可跑通。

配套文件：
- [ea-ops-vue/](ea-ops-vue/) —— **⭐ 推荐开发入口**：原型的 Vue 3 + Vite + TS 完整重写，`npm run dev` 即可跑，详见 §0
- [EA运营平台-方案预览.html](EA运营平台-方案预览.html) —— 成品前端（单文件，可直接双击打开预览 / 作为视觉与逻辑基准）
- [EA埋点方案-umami.md](EA埋点方案-umami.md) —— EA 前端要埋哪些事件、每个事件映射到哪个指标（**埋点侧的唯一依据**）
- [Design.md](Design.md) —— 视觉规范（已在原型中落地，改样式时参考）

---

## 0. 直接用 Vue 工程起步（推荐）

若前端用 **Vue**，不必从单文件原型二次拆解 —— 已提供逐字对齐原型的 **Vue 3 + Vite + TypeScript** 工程，开箱即跑、类型检查与生产构建均已通过：

```bash
cd ea-ops-vue
npm install
npm run dev       # 本地开发（默认演示数据）
npm run build     # vue-tsc 类型检查 + 生产构建 → dist/
npm run preview   # 预览生产包
```

目录要点（完整说明见 [ea-ops-vue/README.md](ea-ops-vue/README.md)）：

| 路径 | 作用 |
|---|---|
| `src/data/mock.ts` | **★ 唯一要替换的数据层**：`tele / ovData / riskClusters / VAL·KNOW·DV` |
| `src/data/compute.ts` | 纯计算：`pct / userStatus / workStats / ovDataFor / valueModel …` |
| `src/data/umami.ts` | umami 只读适配层：`UMAMI` 配置 + `umOverview` + `loadLive`（`useMock:false` 即接真实数据） |
| `src/types.ts` | 数据契约（与 §7 一致） |
| `src/components/` | `KpiCard / DistBar / Panel / SectionLabel / PeriodControl / Funnel / HoursChart / TopNav` |
| `src/pages/` | 运营总览 / 核心行为 / 使用分析 / 用户详情 / 风险预警 / 风险详情 / 价值与收益（7 个 SFC + 路由） |
| `src/styles/operations.css` | 从原型逐字移植的全部样式（黑白灰 + 颗粒质感 + 动效） |

> 接数步骤与单文件版一致（见 §5）：填 `src/data/umami.ts` 的 `UMAMI` 配置并置 `useMock:false`，再把 `src/data/mock.ts` 换成真实值即可，**视图与计算无需改动**。
> 单文件原型 `EA运营平台-方案预览.html` 继续作为**视觉与业务逻辑基准**保留；下文 §1–§9 的数据层 / 口径 / 接入说明对两者通用。

---

## 1. 你会拿到什么

| 交付物 | 作用 | 是否要改 |
|---|---|---|
| `ea-ops-vue/`（Vue 工程） | ⭐ 推荐开发起点，可直接 `npm run dev` | **只改 `src/data/`**，见 §0 / §5 |
| `EA运营平台-方案预览.html` | 完整前端（HTML+CSS+JS 一体），视觉与逻辑基准 | **只改数据层**，见 §4 |
| `EA埋点方案-umami.md` | 埋点清单 + 取数接口 | 按它在 **EA 主站**埋点 |
| `Design.md` | 设计 token | 一般不动 |

技术栈：Vue 工程为 **Vue 3 + Vite + TS**；单文件原型为 **纯原生 HTML + CSS + Vanilla JS**（零依赖、零构建）。两者数据契约一致（见 §7），任选其一为基线。

---

## 2. 页面与模块总览

顶部导航 6 个主页面 + 2 个下钻子页，全部已实现：

| 页面 | DOM id | 渲染函数 | 数据来源 | 上线接入状态 |
|---|---|---|---|---|
| 运营总览 | `#overview` | `renderOverview()` | `ovData` + `tele.features/hoursBase` | ✅ 已内置 umami 适配（`umOverview`/`loadLive`） |
| 核心行为 | `#behavior` | `renderBehavior()` | `tele.funnel` | ⛳ 复用 `umOverview` 返回的 funnel |
| 使用分析 | `#usage` | `renderUsers/renderTeams/renderUserRows/renderLeaderboard` | `tele.users` | 🔧 待接 distinctId / sessions，见 §5 |
| └ 用户详情（子页） | `#userdetail` | `openUserDetail()` | `tele.users` + `tele.features/hoursBase` | 🔧 随 §5；含会话回放入口（§10.2） |
| 风险预警 | `#risk` | `renderRisk()` / `openRiskDetail()` | `riskClusters` | 🔧 接 EA 后端 AI 归因，见 §6 |
| └ 风险详情（子页） | `#riskdetail` | `openRiskDetail()` | `riskClusters` | 🔧 随 §6；含会话回放入口（§10.2） |
| 价值与收益 | `#value` | `renderValue()` | `VAL/KNOW/DV` + `tele` | 🔧 填口径常量 + 后端沉淀量，见 §6 |
| 增长复盘 | `#growth` | `GrowthPage.vue` | `growth`（逐月序列） | 🔧 接 umami 按周期聚合，见 §10.4 |

图例：✅ 开箱即用 · ⛳ 同一接口顺带拿到 · 🔧 需实现对应适配。

---

## 3. 数据从哪来（三个来源）

| 来源 | 提供什么 | 说明 |
|---|---|---|
| **umami**（自建/Cloud） | 访问/活跃/留存、功能使用、漏斗、用户维度、访问时段 | 只读 REST API，见 [EA埋点方案-umami.md](EA埋点方案-umami.md) §7 |
| **EA 后端 / SSO** | 注册用户全量名单、激活、部门映射、平均结案周期 | umami 默认匿名，「谁没登录过 / 注册总数」必须由后端补全 |
| **EA 领域数据（Case/Issue）** | 风险预警的共性根因、价值模块的沉淀量 | 由 EA 主站的 AI 归因 / 统计接口提供 |

> 合规提醒：「具体到人」的用户明细需公司内部授权后，登录时 `umami.identify(工号,{name,dept})` 才会带上身份；否则用户维度只能匿名聚合。

---

## 4. 只改这里：数据层位置（`<script>` 顶部）

所有示例数据集中在文件 `<script>` 开头，替换它们即可。四块结构如下。

### 4.1 `tele` —— 示例埋点数据（上线后由 umami/后端覆盖）
```js
const tele = {
  mau:142, wau:96, dau:38, newUsers:6, retentionD1:64, retentionD7:45,
  avgStayMin:8.7, teams:8,
  // 功能模块使用：[模块名, 次数]  ← umami metrics(type=event) 中「模块:」前缀事件
  features:[['Case 详情',1320], ['思维导图分析',540], ...],
  // 24 小时访问分布：索引 0..23 = 每小时值  ← umami pageviews?unit=hour
  hoursBase:[5,3,2,...],
  // 核心行为漏斗：[步骤名, 人数, 标签]  ← umami「funnel:」前缀事件
  funnel:[['进入新建 Case',210,'入口'], ['完成建 Case',168,'80%'], ...],
  // 参与/转化分子分母（AI 采纳、引导、版本已读、搜索）
  guideStart:120, guideDone:97, whatsnewPush:156, whatsnewRead:132,
  aiCall:148, aiAdopt:61, searchUse:430, searchNoResult:38,
  // 用户明细：谁用了 / 谁没用  ← umami distinctId + EA 后端全量名单
  // lastLogin=null 表示从未登录；logins30d=近30天登录；stayMin=累计停留分钟
  users:[
    {name:'张伟', dept:'PTE', lastLogin:'2026-07-16', logins30d:48, stayMin:642, casesCreated:3, tasksDone:22, aiUse:14},
    ...
  ],
};
```

### 4.2 `ovData` —— 运营总览 KPI（天/周/月三档，含同比）
每张卡片格式：`[名称, 数值, 单位, 口径文案, 同比%]`（同比正=绿↑、负=红↓）。
```js
const ovData = {
  天:{ access:[['活跃用户',38,'','去重登录用户',9], ...], engage:[...] },
  周:{ ... }, 月:{ ... },
};
```
> 上线后 `loadLive()` 会用 umami 覆盖 `ovData['月'].access`；天/周同理接 `rangeMs` 即可。

### 4.3 `riskClusters` —— 风险预警（来自 EA AI 归因）
```js
const riskClusters = [
  { cause:'Pattern / Timing margin 不足', sev:'high'|'mid'|'low',
    trend:'本周新增 +2 · 持续增长',
    products:['DDR5-X-6400', ...],           // 影响产品
    items:['ISS-20260415','EA-260511000001'], // 关联 Issue/Case 号
    desc:'……共性描述……',
    ai:'……EA 处置建议……' },
  ...
];
```

### 4.4 `VAL / KNOW / DV` —— 价值与收益口径常量（可调假设）
```js
const VAL = { hourlyRate:120, aiMinPerUse:8, hoursPerCase:3, autoCasePerMonth:18, autoCaseMin:4 };
const KNOW= { cases:128, nodes:1840, paths:96, deadEnds:520 };  // 思维导图沉淀量 ← EA 后端
const DV  = { reuseRate:0.4, hoursPerReuse:4, avoidRate:0.2, hoursPerDeadEnd:1.5 };
```
> 价值全部由这三组常量 + `tele` 现算得出（`renderValue()` 内），**改常量即改结论**，口径公开可审计。

---

## 5. 接入真实数据（读侧适配层已内置）

文件中已写好 umami 适配层，**默认走演示数据**，配置好即切真数据：

```js
const UMAMI = {
  baseUrl:  'https://umami.你的域名',
  websiteId:'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  token:    '',        // 自建：POST /api/auth/login 拿；Cloud：API key
  useMock:  true        // ← 改成 false 即接入真实数据
};
```

已实现的函数（可直接复用/扩展）：

| 函数 | 作用 |
|---|---|
| `um(path, params)` | 带鉴权的 umami REST 请求封装 |
| `rangeMs(state)` | 平台「天/周/月/自定义」→ umami `startAt/endAt/unit` |
| `umOverview(state)` | 拉「访问汇总(含同比) + 功能使用 + 漏斗」→ 组装成 `access/feats/funnel` |
| `loadLive()` | `useMock=false` 时用真实数据覆盖并重渲染；失败自动回退演示数据 |

**上线剩余工作（照葫芦画瓢即可）：**
1. **总览 天/周**：目前只覆盖了「月」，把 `loadLive()` 里对 `ovData['月']` 的覆盖扩展到天/周（`rangeMs` 已支持）。
2. **参与与转化**（AI 采纳率/引导完成率/版本已读率/搜索无结果率）：按 [埋点方案](EA埋点方案-umami.md) §4 的 `ai:调用/采纳`、`引导:启动/完成`、`版本:已读`、`搜索:执行` 事件计数，写进 `tele` 对应字段。
3. **用户/团队明细**：`GET /metrics?type=distinctId` 拿用过的人 → 对照 SSO 全量名单得「从未登录」；`sessions` 拿最近登录；按 `dept` 过滤分组。填进 `tele.users` 即可，视图无需改。
4. **访问时段**：`GET /pageviews?unit=hour` → 写进 `tele.hoursBase`（24 个值）。

> 视图与计算已经写死，你只要让上面几个对象拿到真数，页面即刻正确。埋点侧「埋什么事件、何时算一次使用」全部在 [EA埋点方案-umami.md](EA埋点方案-umami.md)，请以它为准。

---

## 6. 风险预警 & 价值：接 EA 后端

- **风险预警**：`riskClusters` 由 EA 主站的「AI 共性失效根因归因」产出（对 Issue/Case 的 rootCause 聚类）。后端给出同样字段的数组即可，视图/下钻已完成。
- **价值与收益**：`KNOW`（沉淀 Case 数、导图节点、有效路径、试错分支）来自 EA 后端统计；`VAL/DV` 是可调口径假设，与业务/财务对齐后填入。`renderValue()` 会自动重算「年化节省工时 / 成本 / 数据资产价值」。

---

## 7. 数据契约（两套实现通用）

Vue 工程已按此契约落地（见 [ea-ops-vue/src/types.ts](ea-ops-vue/src/types.ts) 与 `src/data/`）；单文件原型用同样的数据形状。若要再迁到其它框架，保证以下**数据形状**不变即可，渲染逻辑可 1:1 照搬：

```ts
type KpiCard   = [name:string, value:number, unit:string, calc:string, trendPct:number];
type OverviewData = { access: KpiCard[]; engage: KpiCard[] };
type FunnelStep   = [name:string, count:number, label:string];
type FeatureUse   = [name:string, count:number];
type UserRow = {
  name:string; dept:string; lastLogin:string|null;
  logins30d:number; stayMin:number; casesCreated:number; tasksDone:number; aiUse:number;
};
type RiskCluster = {
  cause:string; sev:'high'|'mid'|'low'; trend:string;
  products:string[]; items:string[]; desc:string; ai:string;
};
```

计算工具（已内置，纯函数、可直接复用）：`pct()`、`daysAgo()`、`userStatus()`、`workStats()`、`trendHTML()`、`countUp()`。

---

## 8. 上线检查清单

- [ ] EA 主站按 [EA埋点方案-umami.md](EA埋点方案-umami.md) 注入 tracker + `identify(工号,{name,dept})`
- [ ] 埋齐 `模块:*` / `funnel:*` / `ai:*` / `引导:*` / `版本:*` / `搜索:*` 事件
- [ ] 填 `UMAMI` 配置，`useMock:false`
- [ ] 扩展 `loadLive()`：天/周 + 参与转化 + 用户/团队 + 访问时段（§5）
- [ ] 后端提供：注册全量名单 / 激活 / 部门映射 / 平均结案周期
- [ ] 后端提供：`riskClusters`（AI 归因）+ `KNOW`（沉淀量）
- [ ] 与业务/财务对齐 `VAL/DV` 价值口径
- [ ] 全平台中文文案、PC 端（不做移动端），保持既有视觉
- [ ] （如启用会话回放）EA 主产品接入 `@hyperdx/browser`，`hyperdx.ts` 填内网 `baseUrl` 且 `enabled:true`

---

## 9. 注意事项

- **纯前端只读**：本平台不写数据、无登录态（顶部账户/退出仅为演示壳），鉴权/权限走公司现有体系。
- **同比趋势**：`compare=prev` 由 umami 提供；无对比数据时 `trendHTML(0)` 显示「— 0%」。
- **降级策略**：`loadLive()` 已 try/catch，拉数失败自动回退演示数据并 `console.warn`，不白屏。
- **数字口径可审计**：每张卡底部 `code` 标注计算口径，价值模块列出全部假设，便于对外解释。
- **示例 vs 真实**：当前所有数字均为**示例埋点/占位**，非真实业务数据；接入前请勿对外引用具体数值。

---

## 10. 新增能力：数据趋势 sparkline & HyperDX 会话回放

### 10.1 KPI 卡片迷你趋势线（sparkline，可交互）

每张 KPI 卡在数值下方多了一条**迷你趋势线**，颜色随涨跌（升绿 / 降红 / 平灰）；**鼠标悬停任意点** 显示该点的时间标签 + 数值（高亮圆点 + 竖向引导线）。

| 文件 | 作用 |
|---|---|
| [ea-ops-vue/src/components/Sparkline.vue](ea-ops-vue/src/components/Sparkline.vue) | SVG 折线 + 渐隐面积 + hover tooltip，`props: series/trend/labels/unit` |
| [ea-ops-vue/src/data/compute.ts](ea-ops-vue/src/data/compute.ts) | `sparkSeries()` 由「当前值 + 同比%」确定性推导序列；`sparkDates()` 按周期生成日期标签；`kpiView(k, st)` 输出 `series/labels/unit/trend` |
| [ea-ops-vue/src/components/KpiCard.vue](ea-ops-vue/src/components/KpiCard.vue) | 传入 `series` 即渲染，否则不显示（手工卡片零改动） |

> **接真实趋势**：`sparkSeries/sparkDates` 只是「无真实序列时」的确定性占位。接入 umami 后，把按天/周的真实序列与日期（`GET /pageviews?unit=day` 等）填给 `kpiView` 的 `series`/`labels` 即可，视图无需改。生效页面：运营总览、核心行为。

### 10.2 HyperDX 会话回放入口（下钻，只读）

运营平台**不录制**会话——录制由 EA 主产品接入 `@hyperdx/browser`（rrweb）完成；平台只提供「按工号 / 关联 Case 跳进自建 HyperDX 回放界面」的入口。

| 文件 | 作用 |
|---|---|
| [ea-ops-vue/src/data/hyperdx.ts](ea-ops-vue/src/data/hyperdx.ts) | `HYPERDX = { baseUrl, enabled, userIdKey }` 配置 + `replayForUser()` / `replayForItems()` 深链构造（风格对齐 `umami.ts`） |
| [ea-ops-vue/src/pages/UserDetailPage.vue](ea-ops-vue/src/pages/UserDetailPage.vue) | 用户详情页「▷ 查看会话回放」——按工号深链 |
| [ea-ops-vue/src/pages/RiskDetailPage.vue](ea-ops-vue/src/pages/RiskDetailPage.vue) | 风险详情页「▷ 相关会话回放」——按关联 Case/Issue 深链 |

**启用三步：**
1. 自建 HyperDX（docker-compose），记下 UI 基址与 OTel Collector 地址。
2. EA 主产品接入 `@hyperdx/browser`：`HyperDX.init({apiKey,service,url:Collector地址,maskAllInputs:true})`，并 `setGlobalAttributes({userId:工号,...})`——`userId` 须与 `hyperdx.ts` 的 `userIdKey` 一致。
3. `hyperdx.ts` 填内网 `baseUrl`、`enabled:true`，入口按钮即出现。

> **隐私**：EA Case 含敏感信息，录制侧务必开 `maskAllInputs`，敏感区域加 `.hdx-block`/`data-hdx-privacy="mask"`；建议开采样、设短保留期以控 ClickHouse 存储成本。深链查询字段（`userId`/`caseId`）如与实际埋点不同，改 `hyperdx.ts` 即可。

> 效果示例见 [EA运营平台-趋势与回放-示例.html](EA运营平台-趋势与回放-示例.html)（可直接双击打开）。

### 10.3 手动刷新 & 最后数据更新时间

顶部导航右侧新增「更新于 HH:MM:SS」+ 刷新按钮（╨ 图标，刷新中旋转并禁用防重复点击）。

| 文件 | 作用 |
|---|---|
| [ea-ops-vue/src/data/umami.ts](ea-ops-vue/src/data/umami.ts) | `lastUpdated` / `refreshing` 状态 + `refresh()`：live 模式走 `loadLive()` 拉真实数据，mock 模式触发重渲染；完成后更新时间戳并 `liveTick++` |
| [ea-ops-vue/src/components/TopNav.vue](ea-ops-vue/src/components/TopNav.vue) | 更新时间展示 + 刷新按钮 |

> 接入后：`refresh()` 已自动调 `loadLive(periodState.overview)`；`lastUpdated` 可改成取后端返回的数据时间而非本地点击时间。

### 10.4 增长复盘页（年终述职 / 业绩证明）

新增导航页「增长复盘」（[GrowthPage.vue](ea-ops-vue/src/pages/GrowthPage.vue)）：选**时间维度（日 / 周 / 月 / 季度 / 自定义）**，看各项指标的趋势（每指标一张趋势卡），**悬停折线看具体某天/某点的值**；底部自动生成可直接念的汇报要点。

| 文件 | 作用 |
|---|---|
| [ea-ops-vue/src/data/mock.ts](ea-ops-vue/src/data/mock.ts) | `growth = { months, metrics[] }`：各指标逐月基准序列（示例）。`GrowthMetric.betterWhenLower` 标记「越低越好」指标（结案周期 / 搜索无结果率） |
| [ea-ops-vue/src/data/compute.ts](ea-ops-vue/src/data/compute.ts) | `growthView(period, from, to)` 按时间维度重采样（日=近期逐日投影，周/月/季度/自定义=分桶）；`growthStat()` 算起止/增幅/净增 |
| [ea-ops-vue/src/components/Sparkline.vue](ea-ops-vue/src/components/Sparkline.vue) | 复用为每张趋势卡的可交互折线 |

> **接入**：把 `growthView` 换成后端按时间维度聚合的真实序列即可，页面零改动。“越低越好”指标在任何维度下都能正确判为「向好」绿色。
