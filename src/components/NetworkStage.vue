<script setup lang="ts">
import { ref, watch } from 'vue'
import { Nodes,ASNTimer } from '@/hooks/useStates'

const topoProgress = ref(0)
watch(
  Nodes,
  () => {
    topoProgress.value = Math.floor(
      (Nodes.value.filter((n) => n.joined).length / (Nodes.value.length - 1)) * 100
    )
    if (topoProgress.value==100) {
      clearInterval(ASNTimer)
    }
  },
  { deep: true }
)
</script>

<template>
  <el-card>
    <el-steps :active="0" finish-status="success">
      <el-step title="Topology Formation" />
      <el-step title="Scheduling" />
      <el-step title="Data Collection" />
    </el-steps>

    <el-row>
      <el-col :offset="0" :span="11">
        <el-progress :text-inside="true" :stroke-width="20" :percentage="topoProgress" />
      </el-col>
    </el-row>
  </el-card>
</template>
