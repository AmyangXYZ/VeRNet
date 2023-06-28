<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDrawSchedule } from '@/hooks/useDrawSchedule'

import { onKeyStroke } from '@vueuse/core'
import { SignalShowSchedule } from '@/hooks/useStates'

onKeyStroke('`', () => {
  SignalShowSchedule.value = !SignalShowSchedule.value
})

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
.card {
  background-color: rgba(0, 0, 0, 0.1);
}
.chart {
  width: 100%;
  height: 240px;
}
</style>
