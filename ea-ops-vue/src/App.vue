<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import TopNav from '@/components/TopNav.vue'
import { periodState } from '@/stores/period'
import { loadLive } from '@/data/umami'

const route = useRoute()

// 接入真实数据：UMAMI.useMock=false 时拉取并覆盖演示数据
onMounted(() => loadLive(periodState.overview))
</script>

<template>
  <div class="app">
    <TopNav />
    <div class="content">
      <!-- key 绑定路由，切换时重挂载以复现进场动画 -->
      <RouterView :key="route.fullPath" />
    </div>
  </div>
</template>
