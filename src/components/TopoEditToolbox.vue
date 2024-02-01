<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { Network, SignalEditTopology, SignalAddNode, SignalUpdateLinks } from '@/hooks/useStates'
import { Check, Plus, Switch, Sort, Share } from '@element-plus/icons-vue'
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
  nodeId2: ref('')
})

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
  } else {
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
const exportTopo = () => {
  const link: HTMLAnchorElement = document.createElement('a')
  const topo = {
    nodes: Network.Nodes.value.map(({ id, type, pos }) => ({ id, type, pos })),
    links: []
  }
  link.href = URL.createObjectURL(new Blob([JSON.stringify(topo)], { type: 'application/json' }))
  link.setAttribute('download', 'topology.json')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <el-card class="card p-4">
    <div class="flex-container">
      <span class="label-margin">Load preset:</span>
      <el-select class="dropdown" v-model="Network.SelectedTopo.value" style="width: 162px; text-align-last: center">
        <el-option v-for="(_, name) in Network.PresetTopos" :key="name" :label="name" :value="name" />
      </el-select>
    </div>

    <div class="flex-container">
      <span class="label-margin">Add node:</span>
      <el-select class="dropdown" v-model="nodeType">
        <el-option-group v-for="group in nodeTypes" :key="group.label" :label="group.label">
          <el-option v-for="item in group.types" :key="item.value" :label="item.label" :value="item.value" />
        </el-option-group>
      </el-select>

      <el-button size="small" @click="addNode" type="primary" :icon="Plus" circle />
    </div>

    <div class="flex-container">
      <span class="label-margin">Connect</span>
      <el-input v-model="nodeId1" placeholder="v1" class="node-input" style="margin-right: -35px" />
      <el-input v-model="nodeId2" placeholder="v2" class="node-input" />
      <el-button size="small" @click="connect" type="info" :icon="Sort" circle />
    </div>

    <div class="flex-container">
      <span class="label-margin">Auto-Connect</span>
      <el-button size="small" @click="autoConnect" type="info" :icon="Switch" circle />
    </div>

    <div class="flex-container">
      <span class="label-margin">Finish</span>
      <el-button size="small" @click="finishEdit" type="danger" :icon="Check" circle />
    </div>
    <div class="flex-container">
      <span class="label-margin">Export</span>
      <el-button size="small" @click="exportTopo" type="success" :icon="Share" circle />
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

.node-input {
  display: flex;
  width: 40px;
}
</style>
