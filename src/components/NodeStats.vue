<script setup lang="ts">
import sensortag from '@/assets/sensortag.png'
import tsn_switch from '@/assets/tsn_switch.png'
import five_g_gnb from '@/assets/five_g_gnb.png'
import { Network, SelectedNode } from '@/hooks/useStates'
import { NODE_TYPE, NODE_TYPE_DISPLAY_NAME } from '@/core/typedefs'
import { Picture } from '@element-plus/icons-vue'

const images: { [type: number]: string } = {
  [NODE_TYPE.TSCH]: sensortag,
  [NODE_TYPE.TSN]: tsn_switch,
  [NODE_TYPE.FIVE_G_GNB]: five_g_gnb
}
</script>

<template>
  <el-card class="card" v-if="SelectedNode > 0 && Network.Nodes.value[SelectedNode] != undefined">
    <el-row :gutter="30">
      <el-col :span="11" align="center">
        <el-image class="image" :src="images[Network.Nodes.value[SelectedNode].type]">
          <template #error>
            <div class="image">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
      </el-col>
      <el-col :span="10">
        <span class="stats">
          {{ NODE_TYPE_DISPLAY_NAME[Network.Nodes.value[SelectedNode].type] }}-{{ SelectedNode }}
        </span>
        <br />
        - TX: {{ Network.Nodes.value[SelectedNode].tx_cnt }} , RX: {{ Network.Nodes.value[SelectedNode].rx_cnt }}<br />
      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
.card {
  /* margin-top: 2px; */
  height: 130px;
  /* width: 380px; */
  font-size: 0.82rem;
}
.image {
  height: 110px;
  font-size: 36px;
}
.stats {
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
