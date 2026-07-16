<script setup lang="ts">
import { computed } from 'vue'
import PeriodControl from '@/components/PeriodControl.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import KpiCard from '@/components/KpiCard.vue'
import Panel from '@/components/Panel.vue'
import DistBar from '@/components/DistBar.vue'
import HoursChart from '@/components/HoursChart.vue'
import { periodState } from '@/stores/period'
import { tele } from '@/data/mock'
import { ovDataFor, factorFor, labelFor, kpiView } from '@/data/compute'
import { liveTick } from '@/data/umami'

const st = periodState.overview

const access = computed(() => (liveTick.value, ovDataFor(st).access.map(kpiView)))
const engage = computed(() => (liveTick.value, ovDataFor(st).engage.map(kpiView)))
const factor = computed(() => factorFor(st))
const label = computed(() => labelFor(st))
const features = computed(() => (liveTick.value, tele.features.map((f) => ({ label: f[0], value: Math.round(f[1] * factor.value) }))))
</script>

<template>
  <section class="page active" id="overview">
    <div class="head">
      <div>
        <h1>运营总览</h1>
        <p>EA平台整体的访问、活跃、留存与功能使用概况。</p>
      </div>
      <PeriodControl target="overview" />
    </div>

    <SectionLabel>访问与活跃</SectionLabel>
    <div class="kpis">
      <KpiCard v-for="k in access" :key="k.label" :label="k.label" :value="k.value" :calc="k.calc" />
    </div>

    <SectionLabel style="margin-top:22px">参与与转化</SectionLabel>
    <div class="kpis">
      <KpiCard v-for="k in engage" :key="k.label" :label="k.label" :value="k.value" :calc="k.calc" />
    </div>

    <SectionLabel style="margin-top:24px">使用洞察</SectionLabel>
    <div class="layout">
      <Panel class="hours-panel" title="访问时段分布" :small="label + ' · 按小时'">
        <HoursChart :hours="tele.hoursBase" :factor="factor" />
      </Panel>
      <Panel title="功能模块使用" :small="label">
        <DistBar :items="features" variant="tele" />
      </Panel>
    </div>
  </section>
</template>
