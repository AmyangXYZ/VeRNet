<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDrawSchedule } from '@/hooks/useDrawSchedule'

import { SignalShowSchedule } from '@/hooks/useStates'

const chartDom = ref()
onMounted(() => {
  useDrawSchedule(chartDom.value)
})
</script>

<template>
  <el-card class="card" v-show="SignalShowSchedule">
    <div class="chart" ref="chartDom"></div>
  </el-card>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 240px;
}
</style>
