<script setup lang="ts">
import rpi4 from '@/assets/rpi4.png'
import sensortag from '@/assets/sensortag.png'
import { Network, SelectedNode } from '@/hooks/useStates'
import { NODE_TYPE, NODE_TYPE_DISPLAY_NAME } from '@/core/typedefs'
</script>

<template>
  <el-card class="card" v-if="SelectedNode > 0 && Network.Nodes.value[SelectedNode] != undefined">
    <el-row :gutter="30">
      <el-col :span="11" align="center">
        <img :src="SelectedNode == 1 ? rpi4 : sensortag" />
      </el-col>
      <el-col :span="13">
        <span style="font-weight: 600; font-size: 0.9rem">
          {{ NODE_TYPE_DISPLAY_NAME[NODE_TYPE[Network.Nodes.value[SelectedNode].type]] }}-{{ SelectedNode }}
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
.card img {
  height: 100px;
}
</style>
