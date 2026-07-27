<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import SectionLabel from '@/components/SectionLabel.vue'
import Panel from '@/components/Panel.vue'
import Sparkline from '@/components/Sparkline.vue'
import { TODAY } from '@/data/mock'
import { growthStat, growthView, type GrowthPeriod } from '@/data/compute'
import { liveTick } from '@/data/umami'

// 时间维度（日 / 周 / 月 / 季度 / 自定义）
const gran = ref<GrowthPeriod>('月')
const from = ref(`${new Date(TODAY).getFullYear()}-01-01`)
const to = ref(TODAY)

const view = computed(() => (liveTick.value, growthView(gran.value, from.value, to.value)))
const months = computed(() => view.value.months)
const rangeNote = computed(() => `${months.value[0]}–${months.value[months.value.length - 1]}`)

/** 每个指标的起止 / 增幅统计 */
const stats = computed(() => view.value.metrics.map((m) => ({ m, ...growthStat(m) })))

const sign = (n: number) => (n > 0 ? '+' : '')
const fmtPct = (s: { deltaPct: number }) => `${sign(s.deltaPct)}${s.deltaPct}%`

/** 周期切换 */
const segs: GrowthPeriod[] = ['日', '周', '月', '季度']
const popOpen = ref(false)
function setGran(p: GrowthPeriod) { gran.value = p; popOpen.value = false }
function applyCustom() {
  if (!from.value || !to.value || from.value > to.value) return
  gran.value = 'custom'
  popOpen.value = false
}
const customLabel = computed(() =>
  gran.value === 'custom' ? `${from.value.slice(5)}–${to.value.slice(5)} ▾` : '自定义 ▾',
)
const onDoc = () => (popOpen.value = false)
onMounted(() => document.addEventListener('click', onDoc))
onUnmounted(() => document.removeEventListener('click', onDoc))

/** 汇报要点（自动生成，可直接念） */
const talk = computed(() => {
  const by = (k: string) => stats.value.find((s) => s.m.key === k)!
  const act = by('active'), ai = by('aiAdopt'), cyc = by('cycle'), vh = by('valueH'), team = by('teams'), ret = by('retentionD7')
  return [
    `活跃用户从期初 <b>${act.start}</b> 增长到 <b>${act.end}</b>，<b>${fmtPct(act)}</b>，覆盖团队 ${team.start} → <b>${team.end}</b> 个。`,
    `AI 采纳 ${ai.start} → <b>${ai.end}</b> 次（<b>${fmtPct(ai)}</b>），说明智能能力被真实采用而非摆设。`,
    `平均结案周期由 ${cyc.start} 天缩短至 <b>${cyc.end} 天</b>（快 <b>${Math.abs(cyc.deltaPct)}%</b>），交付效率显著提升。`,
    `7 日留存 ${ret.start}% → <b>${ret.end}%</b>，用户留得住，平台形成使用习惯。`,
    `累计为团队节省约 <b>${vh.end} 工时</b>，且随沉淀持续放大 —— 这是可量化的运营成果。`,
  ]
})
</script>

<template>
  <section class="page active" id="growth">
    <div class="head">
      <div>
        <h1>增长复盘</h1>
        <p>选时间维度（日 / 周 / 月 / 季度 / 自定义），看各项指标的趋势；鼠标悬停折线即可看到具体某天 / 某点的值。</p>
      </div>
      <div class="head-actions">
        <div class="seg period-seg">
          <button v-for="p in segs" :key="p" :class="{ on: gran === p }" @click="setGran(p)">{{ p }}</button>
        </div>
        <div class="date-range" @click.stop>
          <button class="date-btn" type="button" :class="{ on: gran === 'custom' }" @click="popOpen = !popOpen">{{ customLabel }}</button>
          <div class="date-pop" :class="{ show: popOpen }">
            <div class="dp-row"><span>从</span><input type="date" v-model="from"></div>
            <div class="dp-row"><span>至</span><input type="date" v-model="to"></div>
            <button class="btn primary d-apply" type="button" @click="applyCustom">应用</button>
          </div>
        </div>
      </div>
    </div>

    <SectionLabel>各指标趋势 <small>· {{ rangeNote }} · 悬停折线看具体值</small></SectionLabel>
    <div class="mini-grid">
      <div class="mtile" v-for="s in stats" :key="s.m.key">
        <div class="mt-top">
          <span class="mt-label">{{ s.m.label }}</span>
          <span class="mt-delta" :class="s.improved ? 'up' : 'down'">{{ fmtPct(s) }}</span>
        </div>
        <div class="mt-val tn">{{ s.end }}<small>{{ s.m.unit }}</small></div>
        <Sparkline class="mt-spark" :series="s.m.series" :trend="s.improved ? 1 : -1" :labels="months" :unit="s.m.unit" />
        <div class="mt-foot">期初 {{ s.start }} → 当前 {{ s.end }}{{ s.m.unit }}</div>
      </div>
    </div>

    <div class="layout" style="margin-top:22px">
      <Panel title="汇报要点" small="可直接念给老板">
        <ul class="talk"><li v-for="(t, i) in talk" :key="i" v-html="t"></li></ul>
      </Panel>
      <Panel title="口径说明" small="示例数据">
        <div class="assump" style="grid-template-columns:1fr">
          <div><b>时间维度：</b>日 / 周 / 月 / 季度 / 自定义区间；切换即重采样，趋势与增幅自动重算。</div>
          <div><b>看具体值：</b>鼠标悬停任意折线，即显示该日 / 该点的时间与数值。</div>
          <div><b>数据来源：</b>各指标按周期聚合，示例数据；接入 umami / EA 后端后自动覆盖。</div>
          <div><b>增幅口径：</b>(当前 − 期初) / 期初 × 100%；「结案周期 / 搜索无结果率」越低越好，向好按缩短计。</div>
        </div>
      </Panel>
    </div>
  </section>
</template>
