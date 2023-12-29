<script setup lang="ts">
import MenuBar from '@/components/MenuBar.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import Topology from '@/components/NetworkTopology.vue'
import PacketSniffer from '@/components/PacketSniffer.vue'
import ScheduleTable from '@/components/ScheduleTable.vue'
import NodeStats from '@/components/NodeStats.vue'
import MiniMap from '@/components/MiniMap.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import ScenariosPanel from '@/components/ScenariosPanel.vue'
import FlowsPanelVue from '@/components/FlowsPanel.vue'
</script>

<template>
  <transition name="el-fade-in-linear">
    <ScenariosPanel
      style="position: absolute; left: 5%; width: 90%; top: 20%; height: 60%; z-index: 9999"
    />
  </transition>
  <transition name="el-zoom-in-center">
    <SettingsPanel
      style="position: absolute; left: 25%; width: 50%; top: 14%; height: 64%; z-index: 9999"
    />
  </transition>
  <MenuBar style="position: absolute; top: 16px; left: 16px; width: 150px; z-index: 999" />
  <ControlPanel
    style="position: absolute; top: 16px; left: 40%; min-width: 336px; width: 20%; z-index: 999"
  />
  <NodeStats
    style="position: absolute; bottom: 16px; left: 38%; width: 26%; min-width: 400px; z-index: 999"
  />
  <Topology style="position: absolute; z-index: 10" />
  <MiniMap style="position: absolute; bottom: 16px; left: 16px; z-index: 999" />
  <FlowsPanelVue
    style="position: absolute; bottom: 480px; right: 16px; width: 380px; z-index: 999"
  />
  <PacketSniffer
    style="position: absolute; bottom: 16px; right: 16px; width: 380px; z-index: 999"
  />
  <transition name="el-zoom-in-center">
    <ScheduleTable
      style="position: absolute; left: 16px; top: 48px; min-width: 336px; width: 32%; z-index: 999"
    />
  </transition>
</template>
