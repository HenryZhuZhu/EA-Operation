<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import KpiCard from '@/components/KpiCard.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import { riskClusters } from '@/data/mock'

const router = useRouter()
const sevL: Record<string, string> = { high: '高危', mid: '关注', low: '低' }

const kpis = computed(() => {
  const cl = riskClusters
  const high = cl.filter((c) => c.sev === 'high').length
  const items = new Set<string>(), prods = new Set<string>()
  cl.forEach((c) => { c.items.forEach((i) => items.add(i)); c.products.forEach((p) => prods.add(p)) })
  return [
    { label: '共性风险', value: cl.length, calc: '<code>AI 归纳的共性根因</code>' },
    { label: '高危项', value: high, calc: '<code>sev=高</code>' },
    { label: '涉及 Case/Issue', value: items.size, calc: '<code>去重计数</code>' },
    { label: '涉及产品', value: prods.size, calc: '<code>去重计数</code>' },
  ]
})

function openDetail(i: number) { router.push('/risk/' + i) }
</script>

<template>
  <section class="page active" id="risk">
    <div class="head">
      <div>
        <h1>风险预警</h1>
        <p>AI 归纳有共性失效根因的 Case / Issue，聚合为共性风险并预警。</p>
      </div>
    </div>

    <div class="kpis" style="grid-template-columns:repeat(4,1fr);margin-top:26px">
      <KpiCard v-for="k in kpis" :key="k.label" :label="k.label" :value="k.value" :calc="k.calc" />
    </div>

    <SectionLabel style="margin-top:22px" small="按共性根因归并">AI 共性风险</SectionLabel>
    <div class="risk-list">
      <div v-for="(c, idx) in riskClusters" :key="c.cause" class="rc-card" @click="openDetail(idx)">
        <div class="rc-head">
          <span class="risk-sev" :class="c.sev">{{ sevL[c.sev] }}</span>
          <h4>共性根因：{{ c.cause }}</h4>
          <span class="rc-trend">{{ c.trend }}</span>
          <span class="rc-arrow">→</span>
        </div>
        <p class="rc-desc">{{ c.desc }}</p>
        <div class="rc-meta">
          <span class="rc-chip k">影响 {{ c.products.length }} 产品</span>
          <span v-for="p in c.products" :key="p" class="rc-chip code">{{ p }}</span>
        </div>
        <div class="rc-meta" style="margin-top:7px">
          <span class="rc-chip k">关联 {{ c.items.length }} 项</span>
          <span v-for="i in c.items" :key="i" class="rc-chip code">{{ i }}</span>
        </div>
        <div class="rc-ai"><span class="sp">✦</span><div><b>EA 建议：</b>{{ c.ai }}</div></div>
      </div>
    </div>
  </section>
</template>
