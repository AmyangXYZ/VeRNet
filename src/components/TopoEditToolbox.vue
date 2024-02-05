<script setup lang="ts">
import { ref } from 'vue'
import { Network, MenubarSignals, TopoEditSignals } from '@/hooks/useStates'
import { Plus, Switch, Sort, Download, Finished } from '@element-plus/icons-vue'
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

const v1 = ref(1)
const v2 = ref(1)

const addNode = () => {
  Network.AddNode(nodeType.value)
  TopoEditSignals.AddNode.value++
}
const connect = () => {
  Network.connect(v1.value, v2.value)
  TopoEditSignals.UpdateLinks.value++
}
const autoConnect = () => {
  Network.EstablishConnection()
  TopoEditSignals.UpdateLinks.value++
}
const finishEdit = () => {
  Network.StartWebWorkers()
  MenubarSignals.ShowTopoEditToolbox.value = !MenubarSignals.ShowTopoEditToolbox.value
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
  <el-card v-show="MenubarSignals.ShowTopoEditToolbox.value">
    <el-row :gutter="10" align="middle">
      <el-col :span="6"> Load: </el-col>
      <el-col :span="18">
        <el-select v-model="Network.SelectedTopo.value" style="width: 100%; text-align-last: center">
          <el-option v-for="(_, name) in Network.PresetTopos" :key="name" :label="name" :value="name" />
        </el-select>
      </el-col>
    </el-row>

    <el-row :gutter="10" align="middle" class="row">
      <el-col :span="6"> Add: </el-col>
      <el-col :span="15">
        <el-select v-model="nodeType" style="width: 100%; text-align-last: center">
          <el-option-group v-for="group in nodeTypes" :key="group.label" :label="group.label">
            <el-option v-for="item in group.types" :key="item.value" :label="item.label" :value="item.value" />
          </el-option-group>
        </el-select>
      </el-col>
      <el-col :span="3" align="middle">
        <el-button size="small" @click="addNode" type="primary" :icon="Plus" circle />
      </el-col>
    </el-row>

    <el-row :gutter="10" align="middle" class="row">
      <el-col :span="6"> Connect: </el-col>
      <el-col :span="15">
        <el-row justify="space-between">
          <el-col :span="11">
            <el-input input-style="text-align=center" type="number" min="1" v-model="v1" />
          </el-col>
          <el-col :span="11">
            <el-input type="number" min="1" v-model="v2" />
          </el-col>
        </el-row>
      </el-col>
      <el-col :span="3">
        <el-button size="small" @click="connect" type="danger" :icon="Sort" circle />
      </el-col>
    </el-row>

    <el-row justify="center" class="row">
      <el-col :span="24" align="center">
        <el-button-group>
          <el-tooltip effect="light" content="Establish connections" :hide-after="0" placement="bottom">
            <el-button @click="autoConnect" color="royalblue" :icon="Switch" circle />
          </el-tooltip>
          <el-tooltip effect="light" content="Finish edit and start WebWorkers" :hide-after="0" placement="bottom">
            <el-button @click="finishEdit" color="red" :icon="Finished" circle />
          </el-tooltip>
          <el-tooltip effect="light" content="Export current topology" :hide-after="0" placement="bottom">
            <el-button @click="exportTopo" type="info" :icon="Download" circle />
          </el-tooltip>
        </el-button-group>
      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
.row {
  margin-top: 6px;
}
</style>
