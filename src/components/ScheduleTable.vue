<script setup lang="ts">
import { ref } from 'vue'
import { SchConfig } from '@/hooks/useStates'
import { useSchedule } from '@/hooks/useSchedule'

import { Operation } from '@element-plus/icons-vue'

const chartDom = ref()
useSchedule(chartDom)
</script>

<template>
  <el-card>
    <template #header>
      <div class="card-header">
        Schedule
        <el-dropdown :hide-on-click="false">
          <el-button type="info" circle size="small">
            <el-icon size="16">
              <Operation />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <el-row class="item">
                  <el-col :span="11">num_slots </el-col>
                  <el-col :span="11">
                    <el-input-number class="in" v-model="SchConfig.num_slots" size="small" />
                  </el-col>
                </el-row>
              </el-dropdown-item>
              <el-dropdown-item>
                <el-row class="item">
                  <el-col :span="11">num_channels </el-col>
                  <el-col :span="11">
                    <el-input-number class="in" v-model="SchConfig.num_channels" size="small" />
                  </el-col>
                </el-row>
              </el-dropdown-item>
              <el-dropdown-item>
                <el-row class="item">
                  <el-col :span="11">num_shared_slots </el-col>
                  <el-col :span="11">
                    <el-input-number class="in" v-model="SchConfig.num_shared_slots" size="small" />
                  </el-col>
                </el-row>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>

    <div class="chart" ref="chartDom"></div>
  </el-card>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item {
  width: 180px;
  text-align: center;
}
.in {
  width: 88px;
}
.chart {
  width: 100%;
  height: 200px;
}
</style>
