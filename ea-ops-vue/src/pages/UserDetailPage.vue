<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Panel from '@/components/Panel.vue'
import DistBar from '@/components/DistBar.vue'
import HoursChart from '@/components/HoursChart.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import { tele } from '@/data/mock'
import { userStatus, daysAgo, sumLogins } from '@/data/compute'

const route = useRoute()
const router = useRouter()
const name = computed(() => decodeURIComponent(String(route.params.name)))
const user = computed(() => tele.users.find((u) => u.name === name.value))

const stCls = computed(() => {
  if (!user.value) return 'never'
  const s = userStatus(user.value)
  return s === '活跃' ? 'on' : s === '沉默' ? 'silent' : 'never'
})
const status = computed(() => (user.value ? userStatus(user.value) : ''))
const share = computed(() => (user.value ? user.value.logins30d / sumLogins : 0))
const dd = computed(() => (user.value ? daysAgo(user.value.lastLogin) : 0))

const mods = computed(() =>
  !user.value ? [] : tele.features
    .map((f) => ({ label: f[0], value: Math.round(f[1] * share.value) }))
    .filter((m) => m.value > 0)
    .sort((a, b) => b.value - a.value),
)

const stats = computed(() => {
  const u = user.value!
  return [
    { label: '近30天登录', value: String(u.logins30d) },
    { label: '累计停留', value: u.stayMin + ' 分' },
    { label: '距今活跃', value: dd.value + ' 天' },
    { label: '建 Case', value: String(u.casesCreated) },
    { label: '完成任务', value: String(u.tasksDone) },
    { label: 'AI 使用', value: String(u.aiUse) },
  ]
})

const timeline = computed(() => {
  const u = user.value!
  if (!u.lastLogin) return []
  const tHour = ['09:12', '10:40', '14:05', '16:22', '11:30']
  const m = mods.value
  return [
    { t: '登录平台', tt: `${u.lastLogin} ${tHour[u.name.length % tHour.length]}` },
    m[0] ? { t: `打开${m[0].label}`, tt: `${u.lastLogin} ${tHour[(u.name.length + 1) % tHour.length]}` } : null,
    u.casesCreated ? { t: `创建 Case ×${u.casesCreated}`, tt: u.lastLogin } : null,
    m[1] ? { t: `使用${m[1].label}`, tt: u.lastLogin } : null,
    u.aiUse ? { t: `AI 润色 ×${u.aiUse}`, tt: u.lastLogin } : null,
  ].filter(Boolean) as { t: string; tt: string }[]
})

function back() {
  if (window.history.length > 1) router.back()
  else router.push('/usage')
}
</script>

<template>
  <section class="page active" id="userdetail">
    <div class="head">
      <div>
        <button class="btn back-link" @click="back">← 返回</button>
        <h1 style="margin-top:12px">{{ user ? user.name : '—' }}</h1>
        <p v-if="user">
          {{ user.dept }}　<span class="st" :class="stCls" style="padding:2px 8px"><i></i>{{ status }}</span>
          <template v-if="user.lastLogin">　·　最近登录 {{ user.lastLogin }}</template>
        </p>
      </div>
    </div>

    <template v-if="!user || !user.lastLogin">
      <div class="panel"><div class="pb"><div class="empty">该用户从未登录，暂无行为数据。</div></div></div>
    </template>
    <template v-else>
      <div class="kpis">
        <div v-for="s in stats" :key="s.label" class="kpi tele">
          <div class="label">{{ s.label }}</div>
          <div class="value tn" v-count>{{ s.value }}</div>
        </div>
      </div>
      <div class="layout" style="margin-top:18px">
        <Panel title="功能使用明细"><DistBar :items="mods" variant="tele" /></Panel>
        <Panel class="hours-panel" title="活跃时段" small="按小时">
          <HoursChart :hours="tele.hoursBase" :factor="share" :x-labels="['0时', '12时', '23时']" />
        </Panel>
      </div>
      <SectionLabel style="margin-top:24px">最近活动</SectionLabel>
      <div class="panel">
        <div class="pb">
          <div class="tl">
            <div v-for="item in timeline" :key="item.t" class="tl-item">{{ item.t }}<div class="tt">{{ item.tt }}</div></div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
