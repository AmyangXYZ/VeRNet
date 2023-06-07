<script setup lang="ts">
import Topology from '../components/NetworkTopology.vue'
import PacketSniffer from '@/components/PacketSniffer.vue'
import ChannelChart from '@/components/ChannelChart.vue'
</script>

<template>
  <el-row :gutter="30">
    <el-col :span="12"><Topology /></el-col>
    <el-col :span="11">
      <ChannelChart />
      <PacketSniffer />
    </el-col>
  </el-row>
</template>
