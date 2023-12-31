<script setup lang="ts">
import { ref } from 'vue'
import { Network, SignalUpdateTopology } from '@/hooks/useStates'
import { Plus, Switch } from '@element-plus/icons-vue'

const nodeType = ref(0)
// must follow NODE_TYPE enum defined in '@/core/typedefs'
const nodeTypes = [
  {
    label: 'Network devices',
    types: [
      { label: 'TSCH node', value: 0 },
      { label: 'TSN bridge', value: 1 },
      { label: '5G tower', value: 2 },
      { label: '5G UE', value: 3 }
    ]
  },
  {
    label: 'End systems',
    types: [
      { label: 'Edge server', value: 11 },
      { label: 'Sensor', value: 12 },
      { label: 'Robotic arm', value: 13 }
    ]
  }
]

const addNode = () => {
  Network.AddNode(nodeType.value)
  SignalUpdateTopology.value++
}
const connect = () => {
  Network.ConstructTopology()
  SignalUpdateTopology.value++
}
</script>

<template>
  <el-card class="card">
    <el-row :gutter="30">
      <el-col>
        Add a
        <el-select class="select" v-model="nodeType" placeholder="Select">
          <el-option-group v-for="group in nodeTypes" :key="group.label" :label="group.label">
            <el-option
              v-for="item in group.types"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-option-group>
        </el-select>
        <el-button size="small" @click="addNode" type="primary" :icon="Plus" circle />
      </el-col>
    </el-row>
    <el-row :gutter="30">
      <el-col>Connect<el-button size="small" @click="connect" type="success" :icon="Switch" circle /></el-col>
    </el-row>
    <el-row :gutter="30">
      <el-col>Load preset topology:</el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
.card {
  /* margin-top: 2px; */
  height: 120px;
  /* background-color:white; */
  /* width: 380px; */
  font-size: 0.82rem;
}
</style>