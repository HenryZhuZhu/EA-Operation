# EA × umami 埋点方案

> 运营平台 = 在 umami 采集数据之上二次开发的前端。本文件列出 **EA 前端需要埋的事件**，以及每个事件如何映射到运营平台的指标/模块。
> 参考：umami v2 Tracker Functions / Website Statistics API（docs.umami.is）。

---

## 0. 基础接入

在 EA 的 `index.html` 注入 umami tracker（自建实例）：

```html
<script defer src="https://umami.你的域名/script.js"
        data-website-id="你的-website-id"></script>
```

- **页面浏览（PV/UV）自动采集**，无需手动埋点 → 支撑「访问次数 / 活跃用户 / 平均停留 / 跳出率 / 留存」。
- 手动事件用 `umami.track(name, data)`；事件名 ≤ 50 字符，data 为 JSON（数字精度≤4、字符串≤500）。
- **身份识别**（「谁用了、谁没用」+ 团队过滤）：登录后调用
  ```js
  umami.identify(工号, { name: '张伟', dept: 'PTE' });
  ```
  之后所有事件带上 distinctId + session 数据，可用 `type=distinctId` 指标与 `dept` 过滤。

> ⚠️ 合规：「具体到人」需在公司内部授权下上报工号/部门；umami 默认匿名。

---

## 1. 访问与活跃（无需埋点，自动）

| 平台指标 | umami 来源 | 说明 |
|---|---|---|
| 活跃用户 | `stats.visitors` | 去重访客 |
| 访问次数 | `stats.pageviews` | 页面浏览 PV |
| 访问会话 | `stats.visits` | 会话数 |
| 跳出率 | `stats.bounces / stats.visits` | 单页访问占比 |
| 平均停留 | `stats.totaltime / stats.visits` | 会话时长均值 |
| 同比趋势 | `stats.comparison`（`compare=prev`）| 上一周期对比 |
| 次日/7日留存 | Reports API · Retention | `/api/reports` retention |

---

## 2. 功能模块使用（需埋点）

「计为一次使用」的判定原则：
- **浏览类模块**：进入该模块页面/视图即计一次（打开触发）。
- **动作类模块**：只有完成核心动作才计一次（完成触发），避免路过也算使用。
- 同一次会话内可能多次触发（每次进入/每次动作各算一次）；「使用人数」用 `visitors` 去重，「使用次数」用事件计数。

事件名统一前缀 `模块:`，便于 `type=event` 聚合：

| 事件 | 类型 | 触发时机（何时算「使用」） |
|---|---|---|
| `模块:Case详情` | 浏览 | 打开某个 Case 详情页时 |
| `模块:思维导图` | 浏览 | 展开/进入某 Case 的思维导图时 |
| `模块:全局搜索` | 动作 | 提交一次搜索（回车/点搜索）时 |
| `模块:新建Case` | 动作 | **成功创建** Case（提交成功）时 |
| `模块:结案申请` | 动作 | 提交结案申请时 |
| `模块:退回重做` | 动作 | 发起一次退回重做时 |
| `模块:评论@` | 动作 | 发出一条评论 / @ 某人时 |
| `模块:AI润色` | 动作 | 点击「AI 润色」并返回结果时 |
| `模块:演示模式` | 浏览 | 进入演示模式时 |
| `模块:语音备注` | 动作 | 完成一次语音录制并保存时 |

```js
// 浏览类：进入即计
umami.track('模块:Case详情');
umami.track('模块:思维导图');
umami.track('模块:演示模式');
// 动作类：完成动作才计
umami.track('模块:全局搜索');   // onSubmit
umami.track('模块:新建Case');   // 创建成功回调
umami.track('模块:结案申请');   // 提交结案
umami.track('模块:退回重做');   // 发起退回
umami.track('模块:评论@');      // 发出评论
umami.track('模块:AI润色');     // 润色返回
umami.track('模块:语音备注');   // 保存录音
```

映射：运营平台「功能模块使用」= `GET /metrics?type=event` 中以 `模块:` 开头的事件计数。
> 注：Checklist / Issue 相关模块已从运营平台「功能模块使用」中移除，如需可另起 `模块:Checklist` / `模块:Issue中心` 单独统计，不计入该列表。

---

## 3. 核心行为漏斗（需埋点）

在各步「实际完成」处上报（均为**完成触发**），前缀 `funnel:`：

| 步骤 | 事件 | 触发时机 |
|---|---|---|
| ① 进入 | `funnel:进入新建Case` | 打开新建 Case 向导 |
| ② 建单 | `funnel:完成建Case` | **成功创建** Case |
| ③ 分析 | `funnel:展开思维导图` | 进入分析（展开导图） |
| ④ 结案 | `funnel:申请结案` | 提交结案申请 |

```js
umami.track('funnel:进入新建Case');   // 打开向导
umami.track('funnel:完成建Case');     // 创建成功
umami.track('funnel:展开思维导图');   // 展开导图
umami.track('funnel:申请结案');       // 提交结案
```

映射：核心行为页漏斗 = 依次统计四个事件（或用 umami **Funnel 报告** `/api/reports/funnel` 传这四个步骤）。各步转化 = 后一步/前一步。

---

## 4. 参与与转化（需埋点）

| 平台指标 | 埋点 | 计算 |
|---|---|---|
| AI 采纳率 | `umami.track('ai:调用',{feature:'润色'\|'语音'\|'识别'})`；采纳时 `umami.track('ai:采纳',{feature})` | 采纳数 / 调用数 |
| 引导完成率 | `umami.track('引导:启动')`；走完 `umami.track('引导:完成')`（可按步 `引导:step',{n}`）| 完成 / 启动 |
| 版本已读率 | 打开更新说明 `umami.track('版本:已读',{ver:'V1.0.3'})` | 已读 / 推送(来自 EA 后端) |
| 搜索无结果率 | `umami.track('搜索:执行',{hasResult:true\|false})` | hasResult=false 占比（按 data 属性 breakdown）|

> 均为**完成触发**（真正发生时才上报）：采纳=采用了 AI 结果、完成=走完引导、已读=实际打开更新说明。
> 「注册用户 / 激活」来自 EA 后端/SSO，不在 umami；平台此两项从后端取或人工填。

---

## 5. 团队 / 用户明细（需 identify）

| 平台能力 | umami 来源 |
|---|---|
| 谁用了 / 谁没用 | `GET /metrics?type=distinctId`（有记录=用过；对照 SSO 全量名单得出「从未登录」）|
| 各用户登录/停留/事件 | 按 distinctId 过滤 `stats` / `events/series` |
| 按团队过滤 / 团队汇总 | 事件带 `dept` 属性 → `filters.dept` 过滤，或按 distinctId→dept 映射分组 |
| 最近登录 | Sessions API `/api/websites/:id/sessions` |
| 访问时段分布 | `GET /api/websites/:id/pageviews?unit=hour`（按小时聚合）|
| 用户个人行为（抽屉）| 按 `distinctId` 过滤 `stats` / `events/series` / `metrics?type=event`，拼出该人的功能使用、活跃时段与活动时间线 |

---

## 6. 事件总清单（复制即用）

```
模块:Case详情 / 模块:思维导图 / 模块:全局搜索 / 模块:新建Case / 模块:结案申请 /
模块:退回重做 / 模块:评论@ / 模块:AI润色 / 模块:演示模式 / 模块:语音备注
funnel:进入新建Case / funnel:完成建Case / funnel:展开思维导图 / funnel:申请结案
ai:调用{feature} / ai:采纳{feature}
引导:启动 / 引导:完成
版本:已读{ver}
搜索:执行{hasResult}
identify(工号,{name,dept})   // 登录后一次
```

---

## 7. 平台取数（读侧）

运营平台前端通过 umami REST API 拉数（自建需先 `POST /api/auth/login` 拿 token，Cloud 用 API key）：

| 平台区块 | Endpoint |
|---|---|
| 访问汇总 + 同比 | `GET /api/websites/:id/stats?startAt&endAt&compare=prev` |
| 时间趋势曲线 | `GET /api/websites/:id/pageviews?startAt&endAt&unit&compare` |
| 功能使用 / 漏斗事件 | `GET /api/websites/:id/metrics?type=event` 或 `/events/series` |
| 用户维度 | `GET /api/websites/:id/metrics?type=distinctId` |
| 留存 / 漏斗报告 | `POST /api/reports`（retention / funnel）|

时间维度：`天`→`unit=hour&近1天`、`周`→`unit=day&近7天`、`月`→`unit=day&近30天`、`自定义`→`startAt/endAt` 用所选日期。

> 读侧适配代码已内置于 [EA运营平台-方案预览.html](EA运营平台-方案预览.html) 的 `UMAMI` / `umOverview` / `loadLive`；默认 `useMock:true` 走演示数据，填好配置并置 `false` 即接入真实数据。
</content>
</invoke>
