<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  hours: number[]
  /** 缩放系数，仅用于 tooltip 数值展示 */
  factor?: number
  xLabels?: string[]
}>(), { factor: 1, xLabels: () => ['0时', '6时', '12时', '18时', '23时'] })

const max = computed(() => Math.max(...props.hours, 1))
</script>

<template>
  <div class="hours">
    <div
      v-for="(v, h) in hours"
      :key="h"
      class="hbar"
      :style="{ height: Math.max(2, (v / max) * 100) + '%' }"
      :title="`${h}:00–${h}:59 · ${Math.round(v * factor)}`"
    ></div>
  </div>
  <div class="hours-x"><span v-for="l in xLabels" :key="l">{{ l }}</span></div>
</template>
