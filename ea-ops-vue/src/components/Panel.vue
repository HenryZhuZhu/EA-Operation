<script setup lang="ts">
defineProps<{ title: string; small?: string }>()
</script>

<template>
  <div class="panel">
    <div class="ph">
      <h3>{{ title }}</h3>
      <small v-if="small">{{ small }}</small>
      <slot name="ph-extra" />
    </div>
    <div class="pb"><slot /></div>
  </div>
</template>
