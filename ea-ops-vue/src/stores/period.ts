import { reactive } from 'vue'
import type { PeriodState } from '@/types'

/** 三个页面各自的时间维度状态（天/周/月/自定义） */
export const periodState = reactive<Record<'overview' | 'behavior' | 'usage', PeriodState>>({
  overview: { period: '月', from: null, to: null },
  behavior: { period: '月', from: null, to: null },
  usage: { period: '月', from: null, to: null },
})
