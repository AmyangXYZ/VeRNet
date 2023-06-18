<script setup lang="ts">
import ControlPanel from '@/components/ControlPanel.vue'
import Topology from '../components/NetworkTopology.vue'
import PacketSniffer from '@/components/PacketSniffer.vue'
import ScheduleTable from '@/components/ScheduleTable.vue'
import NodeStats from '@/components/NodeStats.vue'
</script>

<template>
  <el-container>
    <el-aside width="240px"><ControlPanel /></el-aside>
    <el-container>
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <NodeStats />
            <Topology />
          </el-col>
          <el-col :span="9">
            <PacketSniffer />
          </el-col>
        </el-row>
        <ScheduleTable style="margin-top: 20px" />
      </el-main>
      <el-footer>Footer</el-footer>
    </el-container>
  </el-container>
</template>
