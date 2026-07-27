import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', name: 'overview', component: () => import('@/pages/OverviewPage.vue') },
  { path: '/behavior', name: 'behavior', component: () => import('@/pages/BehaviorPage.vue') },
  { path: '/usage', name: 'usage', component: () => import('@/pages/UsagePage.vue') },
  { path: '/usage/user/:name', name: 'user', meta: { nav: 'usage' }, component: () => import('@/pages/UserDetailPage.vue') },
  { path: '/risk', name: 'risk', component: () => import('@/pages/RiskPage.vue') },
  { path: '/risk/:index', name: 'risk-detail', meta: { nav: 'risk' }, component: () => import('@/pages/RiskDetailPage.vue') },
  { path: '/value', name: 'value', component: () => import('@/pages/ValuePage.vue') },
  { path: '/growth', name: 'growth', component: () => import('@/pages/GrowthPage.vue') },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})
