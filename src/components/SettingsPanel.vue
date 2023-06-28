<script setup lang="ts">
import { SignalShowSettings } from '@/hooks/useStates'
import { onKeyStroke } from '@vueuse/core'

onKeyStroke('Escape', () => {
  SignalShowSettings.value = !SignalShowSettings.value
})
</script>

<template>
  <el-card class="card" v-show="SignalShowSettings"> aaa </el-card>
</template>

<style scoped>
.card {
  background-color: rgba(0, 0, 0, 0.33);
  height: 100%;
  width: 100%;
}
</style>
