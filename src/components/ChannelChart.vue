<script setup lang="ts">
import { ref } from 'vue'
import { useChannels } from '@/hooks/useChannels'
import { SchConfig } from '@/hooks/useStates'

const chartDom = ref(null)
useChannels(SchConfig, chartDom)
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
