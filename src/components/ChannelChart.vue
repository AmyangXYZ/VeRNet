<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChannels } from '@/hooks/useChannels'

const chartDom = ref(null)
const { drawChannels } = useChannels()
onMounted(() => {
  drawChannels(chartDom)
})
</script>

<template>
  <div class="chart" ref="chartDom"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 200px;
  margin-top: 20px;
}
</style>
