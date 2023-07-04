<script setup lang="ts">
import { useDrawMiniMap } from '@/hooks/useDrawMiniMap'
import { ref, onMounted } from 'vue'
import { MiniMapMode, SignalResetCamera } from '../hooks/useStates'

import IconTree from './icons/IconTree.vue'
import IconScatter from './icons/IconScatter.vue'
import { Camera } from '@element-plus/icons-vue'

const chartDom = ref()
onMounted(() => {
  useDrawMiniMap(chartDom.value)
})
</script>

<template>
  <el-row align="bottom" :gutter="8">
    <el-col :span="20">
      <el-card class="card">
        <div class="chart" ref="chartDom"></div>
      </el-card>
    </el-col>
    <el-col :span="4">
      <el-row>
        <el-tooltip effect="light" content="Reset camera" :hide-after="0" placement="top-start">
          <el-button class="btn" size="small" circle @click="SignalResetCamera++">
            <el-icon color="lightgrey" size="16">
              <Camera />
            </el-icon>
          </el-button>
        </el-tooltip>
      </el-row>
      <el-row>
        <el-tooltip effect="light" content="Switch minimap" :hide-after="0" placement="right-start">
          <el-button
            class="btn"
            size="small"
            circle
            @click="MiniMapMode = MiniMapMode == 'scatter' ? 'tree' : 'scatter'"
          >
            <el-icon color="lightgrey" size="16">
              <IconTree v-if="MiniMapMode == 'scatter'" />
              <IconScatter v-else />
            </el-icon>
          </el-button>
        </el-tooltip>
      </el-row>
    </el-col>
  </el-row>
</template>

<style scoped>
.card {
  border-width: 1px;
  width: 220px;
  height: 220px;
  /* border-color: skyblue; */
}
.chart {
  width: 200px;
  height: 200px;
}

.btn {
  margin: 3px;
  opacity: 0.77;
  height: 24px;
  width: 24px;
  border-width: 1px;
  border-color: lightgrey;
}
</style>
