# EA 运营平台 · Vue 3 实现

在原型 `EA运营平台-方案预览.html` 基础上，用 **Vue 3 + Vite + TypeScript** 重写的可运行工程。视觉、动效、交互与原型一致；**上线只需替换数据层**。

## 快速开始

```bash
pnpm install        # 或 npm install / yarn
pnpm dev            # 本地开发（默认走演示数据）
pnpm build          # 类型检查 + 生产构建 → dist/
pnpm preview        # 预览生产包
```

要求 Node ≥ 18。

## 目录结构

```
src/
  main.ts                 应用入口（注册路由 + v-count 指令 + 全局样式）
  App.vue                 外壳：顶部导航 + <RouterView>
  router/index.ts         路由（5 主页 + 用户详情 / 风险详情 2 子页）
  styles/operations.css   全部样式（从原型逐字移植，黑白灰 + 颗粒质感 + 动效）
  types.ts                数据契约（KpiTuple / UserRow / RiskCluster …）
  data/
    mock.ts               ★ 唯一要替换的「数据层」：tele / ovData / riskClusters / VAL·KNOW·DV
    compute.ts            纯计算：pct / userStatus / workStats / ovDataFor / valueModel …
    umami.ts              umami 只读适配层：UMAMI 配置 + umOverview + loadLive
  stores/period.ts        天/周/月/自定义 时间维度状态
  directives/count.ts     v-count 数字滚动动效
  components/             KpiCard / DistBar / Panel / SectionLabel / PeriodControl / Funnel / HoursChart / TopNav
  pages/                  Overview / Behavior / Usage / UserDetail / Risk / RiskDetail / Value
```

## 接入真实数据（三步）

1. **埋点**：按同目录 `../EA埋点方案-umami.md` 在 EA 主站注入 umami tracker、`identify(工号,{name,dept})`，并埋齐 `模块:* / funnel:* / ai:* / 引导:* / 版本:* / 搜索:*` 事件。
2. **配置**：编辑 [src/data/umami.ts](src/data/umami.ts) 的 `UMAMI`：
   ```ts
   export const UMAMI = { baseUrl, websiteId, token, useMock: false } // ← 置 false
   ```
   `loadLive()` 会拉 umami 真实数据覆盖演示数据（`liveTick` 触发响应式刷新）；失败自动回退演示数据。
3. **补全**：`src/data/mock.ts` 中示例数据换成后端/umami 真实值即可，**视图与计算无需改动**。已内置总览适配；参与转化 / 团队用户 / 访问时段的取数点见 `umami.ts` 内注释与埋点方案 §5。

风险预警 `riskClusters`、价值口径 `VAL/KNOW/DV` 由 EA 后端（AI 归因 / 沉淀量统计）与业务口径对齐后填入。

## 设计约束

- 纯 PC 端、中文 UI，固定深色（`<html class="dark">`）。
- 黑白灰单色；仅趋势升降（绿/红）与风险等级用少量彩色。
- 每个业务数字都有可审计口径；示例数据请勿对外引用具体数值。
- 只读前端，不写数据、无鉴权（顶部账户为演示壳），权限走公司现有体系。
