<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import { useTopology } from '@/hooks/useTopology'
import { TopoConfig } from '@/hooks/useStates'
import { Operation } from '@element-plus/icons-vue'

const chartDom = ref(undefined)
const { drawTopology } = useTopology()
onMounted(() => {
  drawTopology(chartDom.value)
})
</script>

<template>
  <div class="chart" ref="chartDom"></div>
  <el-card v-show="false" class="topo">
    <template #header>
      <div class="card-header">
        Topology
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
                  <el-col :span="11">seed </el-col>
                  <el-col :span="11">
                    <el-input-number class="in" v-model="TopoConfig.seed" size="small" />
                  </el-col>
                </el-row>
              </el-dropdown-item>
              <el-dropdown-item>
                <el-row class="item">
                  <el-col :span="11">num_nodes </el-col>
                  <el-col :span="11">
                    <el-input-number class="in" v-model="TopoConfig.num_nodes" size="small" />
                  </el-col>
                </el-row>
              </el-dropdown-item>
              <el-dropdown-item>
                <el-row class="item">
                  <el-col :span="11">grid_x </el-col>
                  <el-col :span="11">
                    <el-input-number class="in" v-model="TopoConfig.grid_x" size="small" />
                  </el-col>
                </el-row>
              </el-dropdown-item>
              <el-dropdown-item>
                <el-row class="item">
                  <el-col :span="11">grid_y </el-col>
                  <el-col :span="11">
                    <el-input-number class="in" v-model="TopoConfig.grid_y" size="small" />
                  </el-col>
                </el-row>
              </el-dropdown-item>
              <el-dropdown-item>
                <el-row class="item">
                  <el-col :span="11">tx_range </el-col>
                  <el-col :span="11">
                    <el-input-number class="in" v-model="TopoConfig.tx_range" size="small" />
                  </el-col>
                </el-row>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>
    <!-- <div class="chart" ref="chartDom"></div> -->
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
  height: 700px;
}
</style>
