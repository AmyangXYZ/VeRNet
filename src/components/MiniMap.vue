<script setup lang="ts">
import { useDrawMiniMap } from '@/hooks/useDrawMiniMap'
import { ref, onMounted } from 'vue'

const chartDom = ref()
onMounted(() => {
  useDrawMiniMap(chartDom.value)
})
</script>

<template>
  <el-card class="card">
    <div class="chart" ref="chartDom"></div>
  </el-card>
</template>

<style scoped>
.card {
  border-width: 1px;
  width: 220px;
  height: 220px;
  /* border-color: skyblue; */
}
.chart {
  width: 200px;
  height: 200px;
}

.btn {
  margin: 3px;
  opacity: 0.77;
  height: 24px;
  width: 24px;
  border-width: 1px;
  border-color: lightgrey;
}
</style>
