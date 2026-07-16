<script setup lang="ts">
import { computed } from 'vue'
import { pct } from '@/data/compute'
import type { FunnelStep } from '@/types'

const props = defineProps<{ steps: FunnelStep[] }>()
const base = computed(() => props.steps[0]?.[1] || 1)
</script>

<template>
  <div class="funnel">
    <template v-for="(s, i) in steps" :key="s[0]">
      <div class="f-step" :class="'f' + (i + 1)">
        <b>{{ s[1] }}</b>
        <span>{{ s[0] }}</span>
        <em>{{ i === 0 ? '入口' : pct(s[1], base) + '%' }}</em>
      </div>
      <div v-if="i < steps.length - 1" class="arrow">›</div>
    </template>
  </div>
</template>
