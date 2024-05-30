<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import { useDrawTopology } from '@/hooks/useDrawTopologyBabylon'

const canvas = ref()
onMounted(() => {
  useDrawTopology(canvas.value)
})
</script>

<template>
  <canvas class="canvas" ref="canvas"></canvas>
</template>

<style scoped>
.canvas {
  width: 100%;
  height: 100vh;
}
</style>
