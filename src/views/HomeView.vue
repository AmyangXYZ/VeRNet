<script setup lang="ts">
import Topology from '../components/NetworkTopology.vue'
</script>

<template>
  <el-row :gutter="20">
    <el-col :span="6"><Topology/></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
</template>
