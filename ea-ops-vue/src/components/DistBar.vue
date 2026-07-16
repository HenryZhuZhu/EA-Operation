<script setup lang="ts">
import { computed } from 'vue'

export interface DistItem {
  label: string
  value: number
  /** 右侧展示文本，默认取 value */
  text?: string | number
}

const props = withDefaults(defineProps<{
  items: DistItem[]
  variant?: 'tele' | 'biz'
  /** 底部合计说明 HTML（可选） */
  footer?: string
}>(), { variant: 'tele' })

const max = computed(() => Math.max(...props.items.map((i) => i.value), 1))
</script>

<template>
  <div class="distbar">
    <div class="distrow" v-for="it in items" :key="it.label">
      <span>{{ it.label }}</span>
      <div class="track">
        <div class="fill" :class="{ tele: variant === 'tele' }" :style="{ width: (it.value / max * 100) + '%' }"></div>
      </div>
      <span class="n">{{ it.text ?? it.value }}</span>
    </div>
    <div v-if="footer" class="calc" style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px" v-html="footer"></div>
  </div>
</template>
