<script setup lang="ts">
import rpi4 from '@/assets/rpi4.png'
import sensortag from '@/assets/sensortag.png'
import { Nodes, SelectedNode } from '@/hooks/useStates'
</script>

<template>
  <el-card class="card" v-show="SelectedNode > 0">
    <el-row :gutter="30">
      <el-col :span="11" align="center">
        <img :src="SelectedNode == 1 ? rpi4 : sensortag" />
      </el-col>
      <el-col :span="13">
        <span style="font-weight: 600; font-size: 0.9rem">[V-{{ SelectedNode }}]</span>
        6TiSCH {{ SelectedNode == 1 ? 'gateway' : 'end device' }}<br />
        - {{ SelectedNode == 1 ? 'Raspberry Pi 4B' : 'CC2650 SensorTag' }} <br />
        - TX: {{ Nodes[SelectedNode].tx_cnt }} , RX: {{ Nodes[SelectedNode].rx_cnt }}<br />
        - Queue length: {{ Nodes[SelectedNode].queueLen }}<br />
        - Rank in topology: {{ Nodes[SelectedNode].rank }}
      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
.card {
  position: absolute;
  top: 2;
  left: 280px;
  z-index: 9999;
  margin-top: 2px;
  height: 140px;
  width: 380px;
  background-color: transparent;
  font-size: 0.82rem;
}
.card img {
  height: 100px;
}
</style>
