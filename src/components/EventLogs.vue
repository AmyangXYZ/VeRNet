<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue'
import { Logs } from '@/hooks/useStates'

const logContainer = ref<HTMLElement | null>(null)
watch(
  Logs,
  () => {
    nextTick(() => {
      if (logContainer.value != undefined) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })
  },
  { deep: true }
)
</script>

<template>
  <div class="log-container" ref="logContainer">
    <div class="log" v-for="(log, i) in Logs" :key="i"> > {{ log }}</div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

.log-container {
  bottom:320px;
  height: 300px;
  display: flex;
  max-width: 40%;
  overflow-y: scroll;
  flex-direction: column-reverse;
}
.log {
  font-family: 'Share Tech Mono', monospace;
  padding-right: 20px;
  font-size: .82rem;
}
</style>
