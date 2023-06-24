<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDrawSchedule } from '@/hooks/useDrawSchedule'

const chartDom = ref()
onMounted(() => {
  useDrawSchedule(chartDom.value)
})
</script>

<template>
  <el-card>
    <template #header>
      <div class="card-header">Schedule</div>
    </template>

    <div class="chart" ref="chartDom"></div>
  </el-card>
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
  height: 200px;
}
</style>
