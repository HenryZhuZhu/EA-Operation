<script setup lang="ts">
import { computed } from 'vue'
import PeriodControl from '@/components/PeriodControl.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import KpiCard from '@/components/KpiCard.vue'
import Funnel from '@/components/Funnel.vue'
import { periodState } from '@/stores/period'
import { tele } from '@/data/mock'
import { factorFor, labelFor, pct, kpiView } from '@/data/compute'
import { liveTick } from '@/data/umami'
import type { FunnelStep, KpiTuple } from '@/types'

const st = periodState.behavior
const factor = computed(() => factorFor(st))
const label = computed(() => labelFor(st))

const steps = computed<FunnelStep[]>(() =>
  (liveTick.value, tele.funnel.map((s) => [s[0], Math.round(s[1] * factor.value), s[2]])),
)

const kpis = computed(() => {
  liveTick.value
  const F = tele.funnel
  const f = factor.value
  const arr: KpiTuple[] = [
    ['建 Case 转化率', pct(F[1][1], F[0][1]), '%', '完成建/进入', 3],
    ['分析展开率', pct(F[2][1], F[1][1]), '%', '展开/完成建', 2],
    ['结案转化率', pct(F[3][1], F[0][1]), '%', '结案/进入', 5],
    ['完成建 Case', Math.round(F[1][1] * f), '', '本区间完成', 6],
    ['申请结案', Math.round(F[3][1] * f), '', '本区间结案', 4],
    ['平均结案周期', 12.6, ' 天', '结案用时均值', -2],
  ]
  return arr.map((k) => kpiView(k, st))
})

const miniCards = computed(() => {
  const s = steps.value
  const cards = []
  for (let i = 1; i < s.length; i++) {
    const p = s[i - 1], c = s[i]
    cards.push({
      title: `${p[0]} → ${c[0]}`,
      value: `${pct(c[1], p[1])}<small>%</small>`,
      calc: `流失 ${p[1] - c[1]} 人 · ${c[1]}/${p[1]}`,
    })
  }
  return cards
})
</script>

<template>
  <section class="page active" id="behavior">
    <div class="head">
      <div>
        <h1>核心行为</h1>
        <p>用户从进入到完成分析闭环的核心转化路径。</p>
      </div>
      <PeriodControl target="behavior" />
    </div>

    <SectionLabel>核心行为指标</SectionLabel>
    <div class="kpis">
      <KpiCard v-for="k in kpis" :key="k.label" :label="k.label" :value="k.value" :calc="k.calc" :series="k.series" :trend="k.trend" :labels="k.labels" :unit="k.unit" />
    </div>

    <div class="panel funnel-panel" style="min-height:320px;margin:18px 0 16px">
      <div class="ph"><h3>核心行为漏斗</h3><small>{{ label }}</small></div>
      <Funnel :steps="steps" />
    </div>

    <SectionLabel>各步转化</SectionLabel>
    <div class="mini-cards">
      <div class="mini" v-for="c in miniCards" :key="c.title">
        <h4>{{ c.title }}</h4>
        <div class="value tn" v-count v-html="c.value"></div>
        <div class="calc">{{ c.calc }}</div>
      </div>
    </div>
  </section>
</template>
