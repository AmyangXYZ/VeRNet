<script setup lang="ts">
import { watch } from 'vue'
import { Network, SignalShowSettings } from '@/hooks/useStates'
import { onKeyStroke } from '@vueuse/core'

onKeyStroke('Escape', () => {
  SignalShowSettings.value = !SignalShowSettings.value
})

watch(
  [Network.TopoConfig, Network.SchConfig],
  () => {
    Network.Reset()
  },
  { deep: true }
)
</script>

<template>
  <el-card class="card" v-show="SignalShowSettings">
    <span>Topo Rand Seed </span>
    <el-input-number v-model="Network.TopoConfig.value.seed" />
    <br />
    <span>Num Nodes</span>
    <el-input-number v-model="Network.TopoConfig.value.num_nodes" :min="1" :max="100" />
    <br />
    <span>Transmission Range</span>
    <el-input-number v-model="Network.TopoConfig.value.tx_range" :min="1" :max="40" />
    <br />
    <span>Num Slots</span>
    <el-input-number v-model="Network.SchConfig.value.num_slots" :min="1" :max="10" />
    <br />
    <span>Num Channels</span>
    <el-input-number v-model="Network.SchConfig.value.num_channels" :min="1" :max="10" />
  </el-card>
</template>

<style scoped>
.card {
  background-color: rgba(0, 0, 0, 0.33);
  height: 100%;
  width: 100%;
}
</style>
