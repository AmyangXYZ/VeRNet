<script setup lang="ts">
import NetworkStageVue from '@/components/NetworkStage.vue'
import Topology from '../components/NetworkTopology.vue'
import PacketSniffer from '@/components/PacketSniffer.vue'
import ScheduleTable from '@/components/ScheduleTable.vue'
</script>

<template>
  <NetworkStageVue style="margin-bottom: 20px" />
  <el-row :gutter="30">
    <el-col :span="11">
      <Topology />
    </el-col>
    <el-col :span="13">
      <PacketSniffer />
    </el-col>
  </el-row>
  <ScheduleTable style="margin-top: 20px" />
</template>
