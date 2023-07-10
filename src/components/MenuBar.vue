<script setup lang="ts">
import { SignalShowSettings, SignalShowSchedule, SignalEditTopology } from '@/hooks/useStates'
import { Setting, Clock, Edit } from '@element-plus/icons-vue'

onKeyStroke('Escape', () => {
  SignalShowSettings.value = !SignalShowSettings.value
})

import { onKeyStroke } from '@vueuse/core'
onKeyStroke('`', () => {
  SignalShowSchedule.value = !SignalShowSchedule.value
})
</script>

<template>
  <div>
    <el-row justify="center">
      <el-col :span="6">
        <el-tooltip
          effect="light"
          content="Network settings"
          :hide-after="0"
          placement="right-start"
        >
          <el-button class="btn" size="small" @click="SignalShowSettings = !SignalShowSettings">
            <el-icon color="#aaa" size="20">
              <Setting />
            </el-icon>
          </el-button>
        </el-tooltip>
      </el-col>
      <el-col :span="6">
        <el-tooltip
          effect="light"
          content="Network schedule"
          :hide-after="0"
          placement="right-start"
        >
          <el-button class="btn" size="small" @click="SignalShowSchedule = !SignalShowSchedule">
            <el-icon color="#aaa" size="20">
              <Clock />
            </el-icon>
          </el-button>
        </el-tooltip>
      </el-col>
      <el-col :span="6">
        <el-tooltip effect="light" content="Edit topology" :hide-after="0" placement="right-start">
          <el-button class="btn" size="small" @click="SignalEditTopology = !SignalEditTopology">
            <el-icon color="#aaa" size="20">
              <Edit />
            </el-icon>
          </el-button>
        </el-tooltip>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.el-col {
  text-align: center;
}
.btn {
  width: 32px;
  height: 24px;
  border: 0;
  border-radius: 5px;
}
</style>
