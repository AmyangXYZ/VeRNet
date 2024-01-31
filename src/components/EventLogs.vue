<script lang="ts" setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { Network } from '@/hooks/useStates'

const logContainer = ref<HTMLElement | null>(null)
const showLog = ref<boolean>(false)
let timer: any = undefined

watch(
  Network.Logs,
  () => {
    showLog.value = true
    nextTick(() => {
      if (logContainer.value != undefined) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })
    resetTimer()
  },
  { deep: true }
)

const handleMouseOver = () => {
  clearTimeout(timer)
}

const resetTimer = () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    nextTick(() => {
      Network.Logs.value = []
    })
    showLog.value = false
  }, 8000)
}

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<template>
  <div class="log-container" v-show="showLog" ref="logContainer" @mouseover="handleMouseOver" @mouseleave="resetTimer">
    <div class="log" v-for="(log, i) in Network.Logs.value" :key="i">> {{ log }}</div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

.log-container {
  bottom: 320px;
  max-height: 300px;
  display: flex;
  max-width: 40%;
  overflow-y: scroll;
  scrollbar-width: none;
  flex-direction: column-reverse;
}

.log-container::-webkit-scrollbar {
  display: none;
}

.log {
  font-family: 'Share Tech Mono', monospace;
  padding-right: 20px;
  font-size: 0.88rem;
}
</style>
