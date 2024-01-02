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
  <el-card class="card">
    <el-row :gutter="30">
      <el-col
        >Load preset topology:<el-select size="20px">
          <el-option
            class="item"
            v-for="item in presetTopos"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          /> </el-select
      ></el-col>
    </el-row>
    <el-row :gutter="30">
      <el-col>
        Add a
        <el-select size="20px" v-model="nodeType">
          <el-option-group v-for="group in nodeTypes" :key="group.label" :label="group.label">
            <el-option
              class="item"
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
      <el-col>
        Connect<el-button size="small" @click="connect" type="info" :icon="Switch" circle />
      </el-col>
    </el-row>

    <el-row :gutter="30">
      <el-col>
        Finish<el-button size="small" @click="finishEdit" type="danger" :icon="Check" circle />
      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
.card {
  /* margin-top: 2px; */
  height: 150px;
  /* background-color:white; */
  /* width: 380px; */
  font-size: 0.87rem;
}
.item {
  font-size: 0.82rem;
}
</style>
