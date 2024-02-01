<script setup lang="ts">
import {
  SignalShowSettings,
  SignalShowSchedule,
  SignalShowStatistics,
  SignalEditTopology,
  SignalResetCamera
} from '@/hooks/useStates'
import { Setting, DataAnalysis, Edit, Camera, Operation } from '@element-plus/icons-vue'
import IconCube from './icons/IconCube.vue'

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
    <el-row justify="start" :gutter="30">
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
        <el-tooltip effect="light" content="Network settings" :hide-after="0" placement="right-start">
          <el-button class="btn" size="small" @click="SignalShowSettings = !SignalShowSettings">
            <el-icon color="#aaa" size="20">
              <Operation />
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
        <el-tooltip effect="light" content="Network statistics" :hide-after="0" placement="right-start">
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
      <el-col :span="4">
        <el-tooltip effect="light" content="Reset camera" :hide-after="0" placement="right-start">
          <el-button class="btn" size="small" @click="SignalResetCamera++">
            <el-icon color="#aaa" size="20">
              <Camera />
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
