<script setup lang="ts">
import { ref } from 'vue'
import { Network, SignalUpdateTopology } from '@/hooks/useStates'
import { Plus, Switch } from '@element-plus/icons-vue'
const type = ref(0)
const addNode = () => {
  Network.AddNode(Network.Nodes.value.length, type.value)
  SignalUpdateTopology.value++
}
const connect = () => {
  Network.FindNeighbors()
  SignalUpdateTopology.value++
}
</script>

<template>
  <el-card class="card">
    <el-row :gutter="30">
      <el-col>Add<el-button @click="addNode" type="primary" :icon="Plus" circle /></el-col>
      <el-col>Connect<el-button @click="connect" type="primary" :icon="Switch" circle /></el-col>
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
