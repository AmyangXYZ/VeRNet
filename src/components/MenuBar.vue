<script setup lang="ts">
import {
  SignalShowScenarios,
  SignalShowSettings,
  SignalShowSchedule,
  SignalShowStatistics,
  SignalEditTopology
} from '@/hooks/useStates'
import { Setting, DataAnalysis, Edit } from '@element-plus/icons-vue'
import IconCube from './icons/IconCube.vue'
import IconClapperboard from './icons/IconClapperboard.vue'

onKeyStroke('Escape', () => {
  SignalShowSettings.value = !SignalShowSettings.value
})

import { onKeyStroke } from '@vueuse/core'
import IconGithub from './icons/IconGithub.vue'
onKeyStroke('`', () => {
  SignalShowSchedule.value = !SignalShowSchedule.value
})
</script>

<template>
  <div>
    <el-row justify="center" :gutter="30">
      <el-col :span="4">
        <a href="https://github.com/AmyangXYZ/VeRNet">
          <el-button class="btn" size="small">
            <el-icon color="#aaa" size="18">
              <IconGithub />
            </el-icon>
          </el-button>
        </a>
      </el-col>
      <el-col :span="4">
        <el-tooltip effect="light" content="Scenarios" :hide-after="0" placement="right-start">
          <el-button class="btn" size="small" @click="SignalShowScenarios = !SignalShowScenarios">
            <el-icon color="#aaa" size="18">
              <IconClapperboard />
            </el-icon>
          </el-button>
        </el-tooltip>
      </el-col>
      <el-col :span="4">
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
      <el-col :span="4">
        <el-tooltip effect="light" content="Resoure grid" :hide-after="0" placement="right-start">
          <el-button class="btn" size="small" @click="SignalShowSchedule = !SignalShowSchedule">
            <el-icon color="#aaa" size="18">
              <IconCube />
            </el-icon>
          </el-button>
        </el-tooltip>
      </el-col>
      <el-col :span="4">
        <el-tooltip
          effect="light"
          content="Network statistics"
          :hide-after="0"
          placement="right-start"
        >
          <el-button class="btn" size="small" @click="SignalShowStatistics = !SignalShowStatistics">
            <el-icon color="#aaa" size="20">
              <DataAnalysis />
            </el-icon>
          </el-button>
        </el-tooltip>
      </el-col>
      <el-col :span="4">
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
