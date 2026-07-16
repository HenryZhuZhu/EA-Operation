<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PeriodControl from '@/components/PeriodControl.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import KpiCard from '@/components/KpiCard.vue'
import { periodState } from '@/stores/period'
import { tele } from '@/data/mock'
import { pct, factorFor, labelFor, userStatus, workStats } from '@/data/compute'
import type { UserRow, WorkStat } from '@/types'

const router = useRouter()
const st = periodState.usage
const usageFactor = computed(() => factorFor(st))
const usageLabel = computed(() => labelFor(st))

const depts = [...new Set(tele.users.map((u) => u.dept))]

// ---- 用户 KPI ----
const userKpis = computed(() => {
  const us = tele.users
  const total = us.length
  const activated = us.filter((u) => u.lastLogin).length
  const active7 = us.filter((u) => userStatus(u) === '活跃').length
  const silent = us.filter((u) => userStatus(u) === '沉默').length
  const never = us.filter((u) => userStatus(u) === '从未登录').length
  return [
    { label: '注册用户', value: String(total), calc: '口径·<code>账号总数</code>' },
    { label: '已激活', value: `${activated} <small>${pct(activated, total)}%</small>`, calc: '口径·<code>曾登录过（lastLogin≠空）</code>' },
    { label: '近7日活跃', value: `${active7} <small>${pct(active7, total)}%</small>`, calc: '口径·<code>最近登录≤7天</code>' },
    { label: '沉默用户', value: String(silent), calc: '口径·<code>登录过但>7天未登录</code>' },
    { label: '从未登录', value: String(never), calc: '口径·<code>lastLogin 为空</code>' },
  ]
})

// ---- 团队卡 ----
const deptFilter = ref('all')
const teams = computed(() => {
  const by: Record<string, UserRow[]> = {}
  tele.users.forEach((u) => (by[u.dept] = by[u.dept] || []).push(u))
  return Object.entries(by)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([dept, us]) => {
      const members = us.length
      const active = us.filter((u) => userStatus(u) === '活跃').length
      return {
        dept,
        members,
        active,
        activePct: pct(active, members),
        avgLogin: (us.reduce((s, u) => s + u.logins30d, 0) / members * usageFactor.value).toFixed(1),
        cs: us.reduce((s, u) => s + u.casesCreated, 0),
        tk: us.reduce((s, u) => s + u.tasksDone, 0),
      }
    })
})
function filterTeam(dept: string) {
  deptFilter.value = deptFilter.value === dept ? 'all' : dept
  page.value = 1
  scrollToTable()
}

// ---- 用户表 ----
const search = ref('')
const activeFilter = ref('all')
const sortField = ref<'logins30d' | 'stayMin' | 'tasksDone' | 'casesCreated'>('logins30d')
const page = ref(1)
const PS = 8

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  const a = activeFilter.value, d = deptFilter.value, sort = sortField.value
  const data = tele.users.filter(
    (u) => (a === 'all' || userStatus(u) === a) && (d === 'all' || u.dept === d) && `${u.name}${u.dept}`.toLowerCase().includes(q),
  )
  return data.slice().sort((x, y) => y[sort] - x[sort])
})
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PS)))
const pageData = computed(() => {
  if (page.value > pages.value) page.value = pages.value
  return filtered.value.slice((page.value - 1) * PS, page.value * PS)
})
const mxLogin = Math.max(...tele.users.map((u) => u.logins30d), 1)
const stCls = (u: UserRow) => {
  const s = userStatus(u)
  return s === '活跃' ? 'on' : s === '沉默' ? 'silent' : 'never'
}
const daysAgoText = (u: UserRow) => (u.lastLogin ? Math.round((+new Date('2026-07-16') - +new Date(u.lastLogin)) / 864e5) : 0)

function resetPage() { page.value = 1 }
function scrollToTable() {
  requestAnimationFrame(() => document.querySelector('#usage .table-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
}
function openUser(name: string) { router.push(`/usage/user/${encodeURIComponent(name)}`) }

// ---- 效率榜 ----
interface LbDef { label: string; key: 'done' | 'doing' | 'pending' | 'total' | 'avgHours'; unit: string; asc?: boolean }
const LB: Record<string, LbDef> = {
  done: { label: '已完成', key: 'done', unit: ' 个' },
  doing: { label: '进行中', key: 'doing', unit: ' 个' },
  pending: { label: '待接受', key: 'pending', unit: ' 个' },
  total: { label: '综合产出', key: 'total', unit: ' 个' },
  fast: { label: '最快完成', key: 'avgHours', unit: ' h', asc: true },
}
const lbMetric = ref('done')
const lbDept = ref('all')
const val = (r: WorkStat, m: LbDef) => r[m.key]

const honors = computed(() => {
  const all = tele.users.map(workStats)
  const laborer = all.slice().sort((a, b) => b.done - a.done)[0]
  const fastest = all.filter((r) => r.avgHours > 0).sort((a, b) => a.avgHours - b.avgHours)[0]
  return { laborer, fastest }
})

const leaderboard = computed(() => {
  const m = LB[lbMetric.value]
  const seed = { done: 1, doing: 2, pending: 3, total: 4, fast: 5 }[lbMetric.value] as number
  let rows = tele.users.map(workStats)
  if (lbDept.value !== 'all') rows = rows.filter((r) => r.u.dept === lbDept.value)
  const eligible = (r: WorkStat) => (m.asc ? r.avgHours > 0 : true)
  const pv = (r: WorkStat) => {
    const w = ((r.u.name.charCodeAt(0) + seed) % 5) - 2
    return m.asc ? Math.max(0.1, r.avgHours + w * 0.6) : Math.max(0, (r[m.key] as number) + w)
  }
  const prev = rows.filter(eligible).map((r) => ({ name: r.u.name, v: pv(r) })).sort((a, b) => (m.asc ? a.v - b.v : b.v - a.v))
  const prevRank: Record<string, number> = {}
  prev.forEach((x, i) => (prevRank[x.name] = i + 1))
  const data = rows.filter(eligible).sort((a, b) => (m.asc ? val(a, m) - val(b, m) : val(b, m) - val(a, m)))
  const mx = Math.max(...data.map((r) => val(r, m)), 1)
  const minT = Math.min(...data.map((r) => r.avgHours).filter((v) => v > 0), 1)
  return data.map((r, i) => {
    const cur = i + 1, pr = prevRank[r.u.name]
    let change: { cls: string; text: string }
    if (!pr) change = { cls: 'new', text: '新上榜' }
    else if (pr > cur) change = { cls: 'up', text: `↑${pr - cur}` }
    else if (pr < cur) change = { cls: 'down', text: `↓${cur - pr}` }
    else change = { cls: 'flat', text: '—' }
    return {
      name: r.u.name, dept: r.u.dept, rank: cur,
      rankCls: i < 3 ? 'g' + (i + 1) : '',
      width: m.asc ? (minT / r.avgHours) * 100 : (val(r, m) / mx) * 100,
      val: val(r, m), unit: m.unit, change,
    }
  })
})
</script>

<template>
  <section class="page active" id="usage">
    <div class="head">
      <div>
        <h1>使用分析</h1>
        <p>按团队与个人细看谁在用、谁没用，以及各自的使用深度。</p>
      </div>
      <PeriodControl target="usage" />
    </div>

    <SectionLabel small="点击团队卡片可筛选下方明细">按团队概览</SectionLabel>
    <div class="mini-cards">
      <div v-for="t in teams" :key="t.dept" class="mini team-card" :class="{ sel: deptFilter === t.dept }" @click="filterTeam(t.dept)">
        <h4>{{ t.dept }} 团队<span class="tcount">{{ t.members }} 人</span></h4>
        <div class="chip">
          <span class="k">活跃率</span>
          <div class="track"><div class="fill" :style="{ width: t.activePct + '%', background: 'var(--text)' }"></div></div>
          <span class="v">{{ t.active }}/{{ t.members }}</span>
        </div>
        <div class="tstats">
          <div><b>{{ t.avgLogin }}</b><span>人均登录</span></div>
          <div><b>{{ t.cs }}</b><span>建 Case</span></div>
          <div><b>{{ t.tk }}</b><span>完成任务</span></div>
        </div>
      </div>
    </div>

    <SectionLabel style="margin-top:22px" small="具体到人：谁用了、谁没用">用户登录与使用明细</SectionLabel>
    <div class="kpis" style="grid-template-columns:repeat(5,1fr)">
      <KpiCard v-for="k in userKpis" :key="k.label" :label="k.label" :value="k.value" :calc="k.calc" />
    </div>

    <div class="filters" style="margin-top:12px">
      <input class="filter search-in" v-model="search" placeholder="搜索姓名 / 部门" @input="resetPage">
      <span class="filter-label">团队</span>
      <select class="filter" v-model="deptFilter" @change="resetPage">
        <option value="all">全部</option>
        <option v-for="d in depts" :key="d">{{ d }}</option>
      </select>
      <span class="filter-label">活跃状态</span>
      <select class="filter" v-model="activeFilter" @change="resetPage">
        <option value="all">全部</option><option>活跃</option><option>沉默</option><option>从未登录</option>
      </select>
      <span class="filter-label">排序</span>
      <select class="filter" v-model="sortField" @change="resetPage">
        <option value="logins30d">近30天登录</option>
        <option value="stayMin">累计停留</option>
        <option value="tasksDone">完成任务</option>
        <option value="casesCreated">建 Case</option>
      </select>
      <div class="spacer"></div>
      <div class="result">共 {{ filtered.length }} / {{ tele.users.length }} 人</div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>用户</th><th>部门</th><th>活跃状态</th><th>最近登录</th>
            <th>{{ usageLabel }}登录</th><th>累计停留</th><th>建 Case</th><th>完成任务</th><th>AI 使用</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in pageData" :key="u.name" style="cursor:pointer" @click="openUser(u.name)">
            <td><span class="owner"><span class="av">{{ u.name.slice(0, 1) }}</span>{{ u.name }}</span></td>
            <td>{{ u.dept }}</td>
            <td><span class="st" :class="stCls(u)"><i></i>{{ userStatus(u) }}</span></td>
            <td>
              <template v-if="u.lastLogin">{{ u.lastLogin }} <span class="dim0">({{ daysAgoText(u) }}天前)</span></template>
              <span v-else class="dim0">—</span>
            </td>
            <td>
              <span class="bar-inline">
                <span class="t"><span class="f" :style="{ width: (u.logins30d / mxLogin * 100) + '%' }"></span></span>
                <span>{{ Math.round(u.logins30d * usageFactor) }}</span>
              </span>
            </td>
            <td :class="{ dim0: !u.stayMin }">{{ u.stayMin ? u.stayMin + ' 分' : '0' }}</td>
            <td :class="{ dim0: !u.casesCreated }">{{ u.casesCreated }}</td>
            <td :class="{ dim0: !u.tasksDone }">{{ u.tasksDone }}</td>
            <td :class="{ dim0: !u.aiUse }">{{ u.aiUse }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pager">
      <button :disabled="page <= 1" @click="page--">上一页</button>
      <span class="pinfo">第 {{ page }} / {{ pages }} 页</span>
      <button :disabled="page >= pages" @click="page++">下一页</button>
    </div>

    <SectionLabel style="margin-top:28px" small="谁在扶活 / 完成最多 / 完成最快">效率榜</SectionLabel>
    <div style="display:flex;margin-bottom:14px;gap:10px;align-items:center;flex-wrap:wrap">
      <div class="seg">
        <button v-for="(def, key) in LB" :key="key" :class="{ on: lbMetric === key }" @click="lbMetric = String(key)">{{ def.label }}</button>
      </div>
      <span class="filter-label">团队</span>
      <select class="filter" v-model="lbDept">
        <option value="all">全部团队</option>
        <option v-for="d in depts" :key="d">{{ d }}</option>
      </select>
      <span class="filter-label" style="margin-left:auto">名次变化 = 本周 vs 上周</span>
    </div>
    <div class="lb-hi">
      <div class="lb-card" style="cursor:pointer" @click="openUser(honors.laborer.u.name)">
        <div class="medal">★</div>
        <div>
          <div class="lc-t">劳模 · 完成任务最多</div>
          <div class="lc-n">{{ honors.laborer.u.name }}</div>
          <div class="lc-s">{{ honors.laborer.u.dept }} · 已完成 {{ honors.laborer.done }} 个任务</div>
        </div>
      </div>
      <div class="lb-card" style="cursor:pointer" @click="openUser(honors.fastest.u.name)">
        <div class="medal">⚡</div>
        <div>
          <div class="lc-t">效率之星 · 完成最快</div>
          <div class="lc-n">{{ honors.fastest.u.name }}</div>
          <div class="lc-s">{{ honors.fastest.u.dept }} · 平均 {{ honors.fastest.avgHours }} 小时/任务</div>
        </div>
      </div>
    </div>
    <div class="lb-list">
      <div v-if="!leaderboard.length" class="empty">该团队暂无排行数据</div>
      <div v-for="r in leaderboard" :key="r.name" class="lb-row" @click="openUser(r.name)">
        <div class="lb-rank" :class="r.rankCls">{{ r.rank }}</div>
        <div class="lb-user">
          <span class="av">{{ r.name.slice(0, 1) }}</span>
          <div><b>{{ r.name }}</b><div class="d">{{ r.dept }}</div></div>
        </div>
        <div class="lb-bar"><div class="track"><div class="fill" :style="{ width: r.width + '%', background: 'var(--text)' }"></div></div></div>
        <div class="lb-val">{{ r.val }}<small>{{ r.unit }}</small></div>
        <div class="lb-change" :class="r.change.cls">{{ r.change.text }}</div>
      </div>
    </div>
  </section>
</template>
