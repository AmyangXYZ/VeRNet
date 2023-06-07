<script setup lang="ts">
import { ref } from 'vue'
import { useDrawTopology } from '@/hooks/useTopology'
const chartDom = ref(null)
const nodes = useDrawTopology({ num_nodes: 20, grid_x: 25, grid_y: 25, tx_range: 8 }, chartDom)
</script>

<template>
  <el-card class="topo">
    <template #header> Topology </template>
    <div class="chart" :key="nodes" ref="chartDom"></div>
  </el-card>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 400px;
}
</style>
