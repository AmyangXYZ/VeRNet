<script setup lang="ts">
import PacketSniffer from '@/components/PacketSniffer.vue'
import Topology from '../components/NetworkTopology.vue'
</script>

<template>
  <el-row :gutter="30">
    <el-col :span="10"><Topology /></el-col>
    <el-col :span="14"><PacketSniffer /></el-col>
  </el-row>
</template>
