<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import { useDrawTopology } from '@/hooks/useDrawTopology'

const chartDom = ref()
onMounted(() => {
  useDrawTopology(chartDom.value)
})
</script>

<template>
  <div class="chart" ref="chartDom"></div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item {
  width: 180px;
  text-align: center;
}
.in {
  width: 88px;
}
.chart {
  width: 100%;
  height: 700px;
}
</style>
