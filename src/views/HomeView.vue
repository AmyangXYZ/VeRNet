<script setup lang="ts">
import ControlPanel from '@/components/ControlPanel.vue'
import Topology from '@/components/NetworkTopology.vue'
import PacketSniffer from '@/components/PacketSniffer.vue'
// import ScheduleTable from '@/components/ScheduleTable.vue'
import NodeStats from '@/components/NodeStats.vue'
import MiniMap from '@/components/MiniMap.vue'
</script>

<template>
  <ControlPanel
    style="position: absolute; top: 16px; left: 40%; min-width: 336px; width: 20%; z-index: 999"
  />
  <NodeStats
    style="
      position: absolute;
      bottom: 0;
      margin-bottom: 16px;
      left: 38%;
      width: 26%;
      min-width: 400px;
      z-index: 999;
    "
  />
  <Topology style="position: absolute; z-index: 10" />
  <MiniMap style="position: absolute; bottom: 16px; left: 16px; z-index: 999" />
  <PacketSniffer
    style="position: absolute; bottom: 16px; right: 16px; width: 380px; z-index: 999"
  />
</template>
