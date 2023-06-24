<script setup lang="ts">
import { ref, watch } from 'vue'
import { Network } from '@/hooks/useStates'

import IconPlay from './icons/IconPlay.vue'
// import IconStep from './icons/IconStep.vue'
import IconPlusOne from './icons/IconPlusOne.vue'
import IconPause from './icons/IconPause.vue'
import IconReset from './icons/IconReset.vue'
import IconSettings from './icons/IconSettings.vue'

const stage = ref(0)
const topoProgress = ref(0)

watch(
  Network.Nodes,
  () => {
    topoProgress.value = Math.floor(
      (Network.Nodes.value.filter((n) => n.joined).length / (Network.Nodes.value.length - 1)) * 100
    )
    if (topoProgress.value == 100) {
      stage.value = 1
      // pause()
    }
  },
  { immediate: true, deep: true }
)

const settingsBtn = ref()

watch(
  [Network.TopoConfig, Network.SchConfig],
  () => {
    Network.Reset()
  },
  { deep: true }
)
</script>

<template>
  <el-menu class="panel">
    <el-row justify="center">
      <el-col :span="9">
        <el-statistic title="ASN" :value="Network.ASN"> </el-statistic>
      </el-col>
      <el-col :span="9">
        <el-statistic title="Packets" :value="Network.Packets.value.length"> </el-statistic>
      </el-col>
    </el-row>

    <el-row justify="center">
      <el-col>
        <el-button-group class="btns">
          <el-button
            class="btn"
            :disabled="Network.Running.value"
            size="small"
            type="primary"
            @click="Network.Run"
          >
            <el-icon size="20">
              <IconPlay />
            </el-icon>
          </el-button>
          <el-button
            class="btn"
            :disabled="Network.Running.value"
            size="small"
            type="success"
            @click="Network.Step"
          >
            <el-icon size="20">
              <IconPlusOne />
            </el-icon>
          </el-button>
          <el-button
            class="btn"
            :disabled="!Network.Running.value"
            size="small"
            type="warning"
            @click="Network.Pause"
          >
            <el-icon size="20">
              <IconPause />
            </el-icon>
          </el-button>
          <el-button class="btn" size="small" type="danger" @click="Network.Reset">
            <el-icon size="18">
              <IconReset />
            </el-icon>
          </el-button>
          <el-button class="btn" size="small" type="info" ref="settingsBtn">
            <el-icon size="18">
              <IconSettings />
            </el-icon>
          </el-button>
        </el-button-group>
      </el-col>
    </el-row>
    <el-popover
      :virtual-ref="settingsBtn"
      trigger="click"
      title="Settings"
      virtual-triggering
      width="240px"
    >
      <el-row class="settings-item">
        <el-col :span="11">slot_duration</el-col>
        <el-col :span="12">
          <el-input-number class="in" v-model="Network.SlotDuration.value" size="small" />
        </el-col>
      </el-row>
      <el-row class="settings-item">
        <el-col :span="11">topo_seed</el-col>
        <el-col :span="12">
          <el-input-number class="in" v-model="Network.TopoConfig.value.seed" size="small" />
        </el-col>
      </el-row>
      <el-row class="settings-item">
        <el-col :span="11">num_nodes</el-col>
        <el-col :span="12">
          <el-input-number class="in" v-model="Network.TopoConfig.value.num_nodes" size="small" />
        </el-col>
      </el-row>
      <el-row class="settings-item">
        <el-col :span="11">num_slots</el-col>
        <el-col :span="12">
          <el-input-number class="in" v-model="Network.SchConfig.value.num_slots" size="small" />
        </el-col>
      </el-row>
      <el-row class="settings-item">
        <el-col :span="11">num_channels</el-col>
        <el-col :span="12">
          <el-input-number class="in" v-model="Network.SchConfig.value.num_channels" size="small" />
        </el-col>
      </el-row>
    </el-popover>
    <el-row justify="center">
      <el-col :span="20">
        <el-steps class="steps" direction="vertical" :active="stage" finish-status="success">
          <!-- <el-step title="Create topology">
            <template v-if="stage >= 0" #description>
              <el-progress
                class="progress"
                :text-inside="true"
                :stroke-width="18"
                :percentage="topoProgress"
              />
            </template>
          </el-step> -->
          <el-step title="Bootstrapping">
            <template v-if="stage >= 0" #description>
              <el-progress
                class="progress"
                :text-inside="true"
                :stroke-width="18"
                :percentage="topoProgress"
              />
            </template>
          </el-step>
          <el-step title="Scheduling">
            <template v-if="stage >= 1" #description>
              <el-progress
                class="progress"
                :text-inside="true"
                :stroke-width="18"
                :percentage="30"
              />
            </template>
          </el-step>

          <el-step title="Data collection" />
        </el-steps>
      </el-col>
    </el-row>

    <el-row>
      <el-col :offset="0" :span="11"> </el-col>
    </el-row>
  </el-menu>
</template>

<style scoped>
.panel {
  width: 100%;
  height: 100%;
  padding-top: 5px;
}
.el-col {
  text-align: center;
}
.btns {
  padding-top: 5px;
}
.btn {
  width: 32px;
  height: 24px;
  border-radius: 4px;
}
.steps {
  width: 100%;
  height: 600px;
  padding-top: 20px;
}
.progress {
  width: 90%;
}
.settings-item {
  margin-top: 5px;
}
.in {
  width: 100px;
}
</style>
