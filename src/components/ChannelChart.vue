<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useChannels } from '@/hooks/useChannels'
import type { ChannelConfig } from '@/hooks/typedefs'

const config = reactive<ChannelConfig>({
  num_channels: 8
})
const chartDom = ref(null)
useChannels(config, chartDom)
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
