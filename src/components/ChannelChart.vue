<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useChannels } from '@/hooks/useChannels'
import type { ChannelConfig } from '@/hooks/defs'

const config = reactive<ChannelConfig>({
  num_channels: 8
})
const chartDom = ref(null)
useChannels(config, chartDom)
</script>

<template>
  <el-card style="margin-bottom: 20px">
    <template #header>
      <div class="card-header">Channels</div>
    </template>
    <div class="chart" ref="chartDom"></div>
  </el-card>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 200px;
}
</style>
