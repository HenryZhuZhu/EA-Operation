<script setup lang="ts">
defineProps<{ small?: string }>()
</script>

<template>
  <div class="section-label">
    <span class="b" style="background:var(--muted)"></span>
    <slot />
    <small v-if="small">{{ small }}</small>
  </div>
</template>
