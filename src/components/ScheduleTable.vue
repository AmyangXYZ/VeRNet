<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import { useDrawSchedule3D } from '@/hooks/useDrawSchedule3D'

import { SignalShowSchedule } from '@/hooks/useStates'

const chartDom = ref()
onMounted(() => {
  // useDrawSchedule3D(chartDom.value)
})
</script>

<template>
  <el-card class="card" v-show="SignalShowSchedule">
    <div class="chart" ref="chartDom"></div>
  </el-card>
</template>

<style scoped>
.chart {
  width: 400px;
  height: 240px;
}
</style>
