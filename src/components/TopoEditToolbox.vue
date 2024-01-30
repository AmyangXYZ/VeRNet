<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { Network, SignalEditTopology, SignalAddNode, SignalUpdateLinks } from '@/hooks/useStates'
import { Check, Plus, Switch } from '@element-plus/icons-vue'
import { NODE_TYPE } from '@/core/typedefs'

const nodeType = ref(0)
const nodeTypes = [
  {
    label: 'Network devices',
    types: [
      { label: 'TSCH node', value: NODE_TYPE.TSCH },
      { label: 'TSN bridge', value: NODE_TYPE.TSN },
      { label: '5G gNB', value: NODE_TYPE.FIVE_G_GNB },
      { label: '5G UE', value: NODE_TYPE.FIVE_G_UE }
    ]
  },
  {
    label: 'End systems',
    types: [
      { label: 'Edge server', value: NODE_TYPE.END_SYSTEM_SERVER },
      { label: 'Temp Sensor', value: NODE_TYPE.END_SYSTEM_SENSOR_TEMP },
      { label: 'Camera', value: NODE_TYPE.END_SYSTEM_SENSOR_CAMERA },
      { label: 'Robotic arm', value: NODE_TYPE.END_SYSTEM_ACTUATOR_ROBOTIC_ARM }
    ]
  }
]

const { nodeId1, nodeId2 } = toRefs({
  nodeId1: ref(''),
  nodeId2: ref(''),
});

const addNode = () => {
  Network.AddNode(nodeType.value)
  SignalAddNode.value++
}
const connect = () => {
  const v1 = parseInt(nodeId1.value, 10)
  const v2 = parseInt(nodeId2.value, 10)
  if (!isNaN(v1) && !isNaN(v2)) {
    Network.connect(v1, v2)
    SignalUpdateLinks.value++
  }
  else {
    console.error('Invalid node IDs.')
  }
}
const autoConnect = () => {
  Network.EstablishConnection()
  SignalUpdateLinks.value++
}
const finishEdit = () => {
  Network.StartWebWorkers()
  SignalEditTopology.value = !SignalEditTopology.value
}
</script>

<template>
  <el-card class="card p-4">
    <div class="flex-container">
      <span class="label-margin">Load preset:</span>
      <el-select class="dropdown" v-model="Network.SelectedTopo.value" style="margin-right: 55px">
        <el-option v-for="(_, name) in Network.PresetTopos" :key="name" :label="name" :value="name" />
      </el-select>
    </div>

    <div class="flex-container mt-4">
      <span class="label-margin">Add node:</span>
      <el-select class="dropdown" v-model="nodeType">
        <el-option-group v-for="group in nodeTypes" :key="group.label" :label="group.label">
          <el-option v-for="item in group.types" :key="item.value" :label="item.label" :value="item.value" />
        </el-option-group>
      </el-select>

      <el-button class="circular-button" @click="addNode" type="primary" :icon="Plus" circle />
    </div>

    <div class="flex-container mt-4">
      <span class="label-margin">Connect</span>
      <el-input v-model="nodeId1" placeholder="v1" class="node-input" />
      <el-input v-model="nodeId2" placeholder="v2" class="node-input" />
      <el-button class="circular-button" @click="connect" type="info" :icon="Switch" circle />
    </div>

    <div class="flex-container mt-4">
      <span class="label-margin">Auto-Connect</span>
      <el-button class="circular-button" @click="autoConnect" type="info" :icon="Switch" circle />
    </div>

    <div class="flex-container mt-4">
      <span class="label-margin">Finish</span>
      <el-button class="circular-button" @click="finishEdit" type="danger" :icon="Check" circle />
    </div>
  </el-card>
</template>

<style scoped>
.card {
  padding: 10px;
}
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}
.label-margin {
  margin-right: 8px;
}
.dropdown {
  width: 120px;
}
.el-select-dropdown__item {
  line-height: 25px;
  height: 25px;
}
.circular-button {
  border-radius: 50%;
  width: 30px;
  height: 30px;
}
.button-margin {
  margin-left: 8px;
}
.node-input {
  display: flex;
}

.node-input input {
  flex: 1;
  min-width: 0; /* Allow input to shrink below content size */
}

.node-input input + input {
  margin-left: -1px; /* Negative margin to overlap borders */
}
</style>
