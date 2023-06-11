<script setup lang="ts">
import { ref, watch } from 'vue'
import { Nodes, ASN, SlotDone, Packets } from '@/hooks/useStates'
import { useController } from '@/hooks/useController'
import IconPlay from './icons/IconPlay.vue'
import IconStep from './icons/IconStep.vue'
import IconPause from './icons/IconPause.vue'
import IconReset from './icons/IconReset.vue'

const running = ref(false)

const { start, reset } = useController()

let initiated = false

const stage = ref(0)

let asnTimer: any

function startASNTimer() {
  if (!initiated) {
    start()
    initiated = true
  }
  running.value = true
  asnTimer = setInterval(() => {
    incASN()
  }, 1100)
}

function incASN() {
  SlotDone.value = false
  ASN.value++
}

function pauseASNTimer() {
  running.value = false
  clearInterval(asnTimer)
}
function resetASNTimer() {
  reset()
  running.value = false
  clearInterval(asnTimer)
  ASN.value = 0
}

const topoProgress = ref(0)

// watch(SlotDone, () => {
//   console.log(ASN.value,SlotDone.value)
//   if (SlotDone.value) {
//     incASN()
//   }
// })

watch(
  Nodes,
  () => {
    topoProgress.value = Math.floor(
      (Nodes.value.filter((n) => n.joined).length / (Nodes.value.length - 1)) * 100
    )
    if (topoProgress.value == 100) {
      stage.value++
    }
  },
  { deep: true }
)
</script>

<template>
  <el-menu class="panel">
    <el-row justify="center">
      <el-col :span="9">
        <el-statistic title="ASN" :value="ASN"> </el-statistic>
      </el-col>
      <el-col :span="9">
        <el-statistic title="Packets" :value="Packets.length"> </el-statistic>
      </el-col>
    </el-row>

    <el-row justify="center">
      <el-col>
        <el-button-group class="btns">
          <el-button
            class="btn"
            :disabled="running"
            size="small"
            type="primary"
            @click="startASNTimer"
          >
            <el-icon size="20">
              <IconPlay />
            </el-icon>
          </el-button>
          <el-button class="btn" :disabled="running" size="small" type="info" @click="incASN">
            <el-icon size="20">
              <IconStep />
            </el-icon>
          </el-button>
          <el-button
            class="btn"
            :disabled="!running"
            size="small"
            type="warning"
            @click="pauseASNTimer"
          >
            <el-icon size="20">
              <IconPause />
            </el-icon>
          </el-button>
          <el-button class="btn" size="small" type="danger" @click="resetASNTimer">
            <el-icon size="18">
              <IconReset />
            </el-icon>
          </el-button>
        </el-button-group>
      </el-col>
    </el-row>

    <el-row justify="center">
      <el-col :span="20">
        <el-steps class="steps" direction="vertical" :active="stage" finish-status="success">
          <el-step title="Topology formation">
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
</style>
