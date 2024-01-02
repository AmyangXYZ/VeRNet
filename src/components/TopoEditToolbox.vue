<script setup lang="ts">
import { ref } from 'vue'
import { Network, SignalEditTopology, SignalUpdateTopology } from '@/hooks/useStates'
import { Check, Plus, Switch } from '@element-plus/icons-vue'

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

const presetTopos:any = []

const addNode = () => {
  Network.AddNode(nodeType.value)
  SignalUpdateTopology.value++
}
const connect = () => {
  Network.ConstructTopology()
  SignalUpdateTopology.value++
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
      <el-select class="dropdown" style="margin-right:45px;">
        <el-option 
          v-for="item in presetTopos"
          :key="item.value"
          :label="item.label"
          :value="item.value" 
        />
      </el-select>
    </div>

    <div class="flex-container mt-4">
      <span class="label-margin">Add node:</span>
      <el-select class="dropdown" v-model="nodeType">
        <el-option-group
          v-for="group in nodeTypes"
          :key="group.label"
          :label="group.label"
        >
          <el-option
            v-for="item in group.types"
            :key="item.value"
            :label="item.label"
            :value="item.value" 
          />
        </el-option-group>
      </el-select>

      <el-button 
        class="circular-button" 
        @click="addNode"
        type="primary"
        :icon="Plus" 
        circle
      />
    </div>

    <div class="flex-container mt-4">
      <span class="label-margin">Connect</span>
      <el-button
        class="circular-button"
        @click="connect"
        type="info"
        :icon="Switch" 
        circle  
      />
    </div>

    <div class="flex-container mt-4">
      <span class="label-margin">Finish</span>
      <el-button 
        class="circular-button"
        @click="finishEdit"
        type="danger"
        :icon="Check" 
        circle
      />
    </div>

  </el-card>
  
</template>

<style scoped>
.card {
  padding: 20px;
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
.circular-button {
  border-radius: 50%;
  width: 30px;
  height: 30px;
}
.button-margin {
  margin-left: 8px;
}
</style>
