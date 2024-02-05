<script setup lang="ts">
import { MenubarSignals } from '@/hooks/useStates'
import { ref, onMounted } from 'vue'
// import { useDrawSchedule3D } from '@/hooks/useDrawSchedule3D'

const chartDom = ref()
onMounted(() => {
  // useDrawSchedule3D(chartDom.value)
})
</script>

<template>
  <el-card class="card" v-show="MenubarSignals.ShowSchedule.value">
    <div class="chart" ref="chartDom"></div>
  </el-card>
</template>

<style scoped>
.chart {
  width: 400px;
  height: 240px;
}
</style>
