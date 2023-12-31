<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import { useDrawChannels } from '@/hooks/useDrawChannels'

const chartDom = ref()
onMounted(() => {
  // useDrawChannels(chartDom.value)
})
</script>

<template>
  <div class="chart" ref="chartDom"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 180px;
  margin-top: 5px;
}
</style>
