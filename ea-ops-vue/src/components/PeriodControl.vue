<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { periodState } from '@/stores/period'
import type { Period } from '@/types'

const props = defineProps<{ target: 'overview' | 'behavior' | 'usage' }>()
const emit = defineEmits<{ (e: 'change'): void }>()

const st = computed(() => periodState[props.target])
const open = ref(false)
const from = ref('')
const to = ref('')

const btnLabel = computed(() =>
  st.value.period === 'custom' ? `${st.value.from!.slice(5)}–${st.value.to!.slice(5)} ▾` : '自定义 ▾',
)

function setPeriod(p: Period) {
  st.value.period = p
  open.value = false
  emit('change')
}
function toggle() { open.value = !open.value }
function apply() {
  if (!from.value || !to.value || from.value > to.value) return
  st.value.period = 'custom'
  st.value.from = from.value
  st.value.to = to.value
  open.value = false
  emit('change')
}

const onDocClick = () => (open.value = false)
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div class="head-actions">
    <div class="seg period-seg">
      <button v-for="p in (['天', '周', '月'] as Period[])" :key="p" :class="{ on: st.period === p }" @click="setPeriod(p)">{{ p }}</button>
    </div>
    <div class="date-range" @click.stop>
      <button class="date-btn" type="button" :class="{ on: st.period === 'custom' }" @click="toggle">{{ btnLabel }}</button>
      <div class="date-pop" :class="{ show: open }">
        <div class="dp-row"><span>从</span><input type="date" v-model="from"></div>
        <div class="dp-row"><span>至</span><input type="date" v-model="to"></div>
        <button class="btn primary d-apply" type="button" @click="apply">应用</button>
      </div>
    </div>
  </div>
</template>
