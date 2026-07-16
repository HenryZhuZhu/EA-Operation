<script setup lang="ts">
// KPI 卡：value/calc 支持 HTML（含 <small>、trend 徽标、<code>）
withDefaults(defineProps<{
  label: string
  /** 数值 HTML，可含 <small> 单位、trend 徽标 */
  value: string | number
  /** 计算口径 HTML（含 <code>） */
  calc?: string
  variant?: 'tele' | 'biz'
}>(), { variant: 'tele' })
</script>

<template>
  <div class="kpi" :class="variant">
    <div class="label">{{ label }}</div>
    <div class="value tn" v-count v-html="String(value)"></div>
    <div v-if="calc" class="calc" v-html="calc"></div>
  </div>
</template>
