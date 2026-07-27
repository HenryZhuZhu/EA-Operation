<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KpiCard from '@/components/KpiCard.vue'
import Panel from '@/components/Panel.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import { riskClusters } from '@/data/mock'
import { HYPERDX, replayForItems } from '@/data/hyperdx'

const route = useRoute()
const router = useRouter()
const sevL: Record<string, string> = { high: '高危', mid: '关注', low: '低' }
const c = computed(() => riskClusters[Number(route.params.index)])

/** 已配置 HyperDX 且该根因有关联 Case 时，展示会话回放入口 */
const showReplay = computed(() => HYPERDX.enabled && c.value?.items?.length > 0)
function openReplay() {
  if (c.value) window.open(replayForItems(c.value.items), '_blank', 'noopener')
}

const kpis = computed(() => {
  const x = c.value
  return [
    { label: '严重度', value: sevL[x.sev], calc: '<code>AI 判定</code>' },
    { label: '影响产品', value: x.products.length, calc: '<code>去重计数</code>' },
    { label: '关联 Case/Issue', value: x.items.length, calc: '<code>去重计数</code>' },
    { label: '趋势', value: x.trend.split('·')[0].trim(), calc: '<code>近期变化</code>' },
  ]
})
</script>

<template>
  <section class="page active" id="riskdetail" v-if="c">
    <div class="head">
      <div>
        <button class="btn back-link" @click="router.push('/risk')">← 返回风险预警</button>
        <h1 style="margin-top:12px">共性根因：{{ c.cause }}</h1>
        <p>
          <span class="risk-sev" :class="c.sev" style="padding:3px 10px">{{ sevL[c.sev] }}</span>　{{ c.trend }}
        </p>
      </div>
      <button v-if="showReplay" class="btn replay-btn" @click="openReplay" title="回放与本根因关联 Case 相关的操作会话">▷ 相关会话回放</button>
    </div>

    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
      <KpiCard v-for="k in kpis" :key="k.label" :label="k.label" :value="k.value" :calc="k.calc" />
    </div>

    <div class="layout" style="margin-top:18px">
      <Panel title="共性描述">
        <p style="font-size:12.5px;color:var(--ink2);line-height:1.7">{{ c.desc }}</p>
      </Panel>
      <Panel title="EA 处置建议">
        <div class="rc-ai" style="margin:0"><span class="sp">✦</span><div>{{ c.ai }}</div></div>
      </Panel>
    </div>

    <SectionLabel style="margin-top:22px">影响产品</SectionLabel>
    <div class="panel"><div class="pb"><div class="rc-meta">
      <span v-for="p in c.products" :key="p" class="rc-chip code">{{ p }}</span>
    </div></div></div>

    <SectionLabel style="margin-top:18px" small="AI 归并为同源失效">关联 Case / Issue</SectionLabel>
    <div class="panel"><div class="pb"><div class="rc-meta">
      <span v-for="x in c.items" :key="x" class="rc-chip code">{{ x }}</span>
    </div></div></div>
  </section>
</template>
