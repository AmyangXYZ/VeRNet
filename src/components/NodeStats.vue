<script setup lang="ts">
import rpi4 from '@/assets/rpi4.png'
import sensortag from '@/assets/sensortag.png'
import { Network, SelectedNode } from '@/hooks/useStates'
</script>

<template>
  <el-card class="card" v-show="SelectedNode > 0">
    <el-row :gutter="30">
      <el-col :span="11" align="center">
        <img :src="SelectedNode == 1 ? rpi4 : sensortag" />
      </el-col>
      <el-col :span="13">
        <span style="font-weight: 600; font-size: 0.9rem">[TSCH-{{ SelectedNode }}]</span>
        6TiSCH {{ SelectedNode == 1 ? 'gateway' : 'end device' }}<br />
        - {{ SelectedNode == 1 ? 'Raspberry Pi 4B' : 'CC2650 SensorTag' }} <br />
        - TX: {{ Network.Nodes.value[SelectedNode].tx_cnt }} , RX:
        {{ Network.Nodes.value[SelectedNode].rx_cnt }}<br />
        - Queue length: {{ Network.Nodes.value[SelectedNode].queueLen }}<br />
        - Rank in topology: {{ Network.Nodes.value[SelectedNode].rank }}
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
