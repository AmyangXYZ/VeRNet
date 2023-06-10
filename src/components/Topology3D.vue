<script setup lang="ts">
import { ref } from 'vue'
import { useTopo3D } from '@/hooks/useTopo3D'

const chartDom = ref()
useTopo3D(chartDom)
</script>

<template>
  <div class="chart" ref="chartDom"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 600px;
}
</style>
