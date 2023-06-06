<script setup lang="ts">
import { ref,watch } from 'vue'
import { useDrawTopology } from '@/hooks/useTopology'
const chartDom = ref(null)
const nodes = useDrawTopology({ num_nodes: 8, grid_x: 25, grid_y: 25, tx_range:10 }, chartDom)
console.log(nodes.value[1].neighbors)
setTimeout(()=>{console.log(nodes.value[1].neighbors)},3000)
watch(nodes,()=>{
  console.log(2222)
})
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
