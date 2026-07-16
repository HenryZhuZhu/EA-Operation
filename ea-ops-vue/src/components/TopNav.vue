<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'

const route = useRoute()
const nav = [
  { key: 'overview', label: '运营总览' },
  { key: 'behavior', label: '核心行为' },
  { key: 'usage', label: '使用分析' },
  { key: 'risk', label: '风险预警' },
  { key: 'value', label: '价值与收益' },
]
// 子页高亮归属父页
const active = (key: string) => (route.meta.nav ?? route.name) === key

const menuOpen = ref(false)
const loggedOut = ref(false)
const onDocClick = () => (menuOpen.value = false)
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <header class="topbar">
    <div class="bar-inner">
      <div class="brand-top"><div class="logo">EA</div><b>EA 运营平台</b></div>
      <nav class="topnav">
        <RouterLink v-for="n in nav" :key="n.key" v-slot="{ navigate }" :to="'/' + n.key" custom>
          <button :class="{ active: active(n.key) }" @click="navigate">{{ n.label }}</button>
        </RouterLink>
      </nav>
      <div class="user-area" @click.stop>
        <button class="uav-btn" title="账户" @click="menuOpen = !menuOpen"><span class="uav">KS</span><i class="ustatus"></i></button>
        <div class="user-menu" :class="{ show: menuOpen }">
          <div class="um-head"><b>Kat Shen</b><span>产品运营 · 已登录</span></div>
          <button @click="loggedOut = true; menuOpen = false">退出登录</button>
        </div>
      </div>
    </div>
  </header>

  <div class="login-mask" :class="{ show: loggedOut }">
    <div class="login-card">
      <div class="login-logo">EA</div>
      <h2>EA 运营平台</h2>
      <p>你已退出登录</p>
      <button class="btn primary" @click="loggedOut = false">重新登录</button>
    </div>
  </div>
</template>
