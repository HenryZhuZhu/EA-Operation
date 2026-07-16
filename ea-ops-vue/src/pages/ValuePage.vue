<script setup lang="ts">
import { computed } from 'vue'
import KpiCard from '@/components/KpiCard.vue'
import Panel from '@/components/Panel.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import DistBar from '@/components/DistBar.vue'
import { tele, VAL, KNOW, DV } from '@/data/mock'
import { pct, valueModel } from '@/data/compute'

const m = computed(valueModel)
const wan = (n: number) => (n / 1e4).toFixed(1)

const valueKpis = computed(() => {
  const v = m.value
  return [
    { label: '年化节省工时', value: v.totalH + ' h', calc: '<code>运营提效 + 数据复用</code>' },
    { label: '年化成本节省', value: '¥' + wan(v.totalCost) + ' 万', calc: `<code>工时 × ¥${VAL.hourlyRate}/h</code>` },
    { label: '数据资产价值', value: '¥' + wan(v.dataCost) + ' 万', calc: '<code>思维导图复用 / 避坑</code>' },
    { label: '覆盖工程师', value: tele.mau + ' 人', calc: '<code>月活跃用户</code>' },
    { label: 'AI 月采纳', value: v.aiMonth + ' 次', calc: '<code>润色 / 语音 / 识别</code>' },
    { label: '平均结案周期', value: '12.6 天', calc: '<code>同比 -2.1 天</code>' },
  ]
})

const breaks = computed(() => {
  const v = m.value
  return [
    { label: '结案流程提速', value: v.caseH },
    { label: '避免重复试错', value: v.avoidH },
    { label: '解题路径复用', value: v.reuseH },
    { label: 'AI 智能提效', value: v.aiH },
    { label: '自动建单省录入', value: v.autoH },
  ].sort((a, b) => b.value - a.value).map((b) => ({ ...b, text: b.value + ' h' }))
})
const breakFooter = computed(() =>
  `合计年化约 <b style="color:var(--text)">${m.value.totalH} 工时 / ¥${wan(m.value.totalCost)} 万</b>，随沉淀量持续放大。`,
)

const talk = computed(() => {
  const v = m.value
  return [
    `平台已覆盖 <b>${tele.mau}</b> 名工程师、<b>${tele.teams}</b> 个团队，周活跃 <b>${tele.wau}</b>。`,
    `引导完成率 <b>${pct(tele.guideDone, tele.guideStart)}%</b>、版本触达 <b>${pct(tele.whatsnewRead, tele.whatsnewPush)}%</b>，新人上手快。`,
    `平均结案周期 <b>12.6 天</b>，同比缩短 <b>2.1 天</b>，交付更快。`,
    `AI 每月被采纳 <b>${v.aiMonth}</b> 次；一处解决、多产品 fanout 复用，减少重复失效分析。`,
    `思维导图沉淀「有效路径 + 试错分支」形成数据资产，年化再省约 <b>${v.dataH} 工时 / ¥${wan(v.dataCost)} 万</b>。`,
    `合计年化价值约 <b>¥${wan(v.totalCost)} 万</b>，且随使用与沉淀持续增长。`,
  ]
})

const dvKpis = [
  { label: '沉淀 Case', value: KNOW.cases, calc: '<code>含思维导图的历史 Case</code>' },
  { label: '导图节点', value: KNOW.nodes, calc: '<code>思路 + 任务节点</code>' },
  { label: '有效解题路径', value: KNOW.paths, calc: '<code>被标记有效</code>' },
  { label: '试错分支', value: KNOW.deadEnds, calc: '<code>已验证无效</code>' },
]

const dvTalk = computed(() => {
  const v = m.value
  return [
    `思维导图完整记录<b>有效解题路径</b>与<b>无效试错分支</b>，是可结构化的工程推理数据。`,
    `<b>有效路径复用：</b>相似问题命中历史路径即可借鉴，${KNOW.paths} 条按复用 ${Math.round(DV.reuseRate * 100)}%、每次省 ${DV.hoursPerReuse} 人时 ≈ ${v.reuseH} h/年。`,
    `<b>避免重复试错：</b>${KNOW.deadEnds} 条无效分支让后来者跳过弯路，按命中 ${Math.round(DV.avoidRate * 100)}%、每条省 ${DV.hoursPerDeadEnd} 人时 ≈ ${v.avoidH} h/年。`,
    `<b>AI 训练资产：</b>「正确 + 试错」成对推理数据，是训练/辅助 AI 做失效诊断的高质量语料。`,
  ]
})

const assump = [
  ['工程师时薪', `¥${VAL.hourlyRate} / 人时`], ['AI 每次提效', `${VAL.aiMinPerUse} 分钟 / 次`],
  ['结案提速', `每 Case 省 ${VAL.hoursPerCase} 人时`], ['自动建单', `每单省 ${VAL.autoCaseMin} 分钟录入`],
  ['解题路径复用', `命中 ${Math.round(DV.reuseRate * 100)}% · 每次省 ${DV.hoursPerReuse} 人时`],
  ['避免重复试错', `命中 ${Math.round(DV.avoidRate * 100)}% · 每条省 ${DV.hoursPerDeadEnd} 人时`],
  ['数据来源', `示例埋点，接入 umami 后替换`], ['口径说明', `假设可调，结果自动重算`],
]
</script>

<template>
  <section class="page active" id="value">
    <div class="head">
      <div>
        <h1>价值与收益</h1>
        <p>EA产品收益统计</p>
      </div>
    </div>

    <div class="kpis" style="margin-top:26px">
      <KpiCard v-for="k in valueKpis" :key="k.label" :label="k.label" :value="k.value" :calc="k.calc" />
    </div>

    <div class="layout" style="margin-top:18px">
      <Panel title="价值构成" small="年化节省工时">
        <DistBar :items="breaks" variant="tele" :footer="breakFooter" />
      </Panel>
      <Panel title="汇报要点" small="可直接念给老板">
        <ul class="talk"><li v-for="(t, i) in talk" :key="i" v-html="t"></li></ul>
      </Panel>
    </div>

    <SectionLabel style="margin-top:24px">数据价值 · 思维导图知识资产</SectionLabel>
    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
      <KpiCard v-for="k in dvKpis" :key="k.label" :label="k.label" :value="k.value" :calc="k.calc" />
    </div>

    <div class="layout" style="margin-top:18px">
      <Panel title="为什么思维导图能转化为价值">
        <ul class="talk"><li v-for="(t, i) in dvTalk" :key="i" v-html="t"></li></ul>
      </Panel>
      <Panel title="计算口径与假设" small="可调">
        <div class="assump" style="grid-template-columns:1fr">
          <div v-for="a in assump" :key="a[0]"><b>{{ a[0] }}：</b>{{ a[1] }}</div>
        </div>
      </Panel>
    </div>
  </section>
</template>
