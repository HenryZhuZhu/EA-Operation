<script setup lang="ts">
// KPI 卡：value/calc 支持 HTML（含 <small>、trend 徽标、<code>）
import Sparkline from './Sparkline.vue'

withDefaults(defineProps<{
  label: string
  /** 数值 HTML，可含 <small> 单位、trend 徽标 */
  value: string | number
  /** 计算口径 HTML（含 <code>） */
  calc?: string
  variant?: 'tele' | 'biz'
  /** 迷你趋势序列（旧→新），传入即渲染 sparkline */
  series?: number[]
  /** 同比%：驱动 sparkline 涨跌配色 */
  trend?: number
  /** 每个点的时间标签（hover tooltip 用） */
  labels?: string[]
  /** 数值单位（hover tooltip 用） */
  unit?: string
}>(), { variant: 'tele' })
</script>

<template>
  <div class="kpi" :class="variant">
    <div class="label">{{ label }}</div>
    <div class="value tn" v-count v-html="String(value)"></div>
    <Sparkline v-if="series && series.length > 1" class="kpi-spark" :series="series" :trend="trend" :labels="labels" :unit="unit" />
    <div v-if="calc" class="calc" v-html="calc"></div>
  </div>
</template>
