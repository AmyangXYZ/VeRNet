<script setup lang="ts">
import { ref } from 'vue'

const msg = ref(1)
</script>

<template>
  <el-card class="topo">
    <template #header>
      Topology
    </template>
    <div >
      {{ msg }}
    </div>
  </el-card>
</template>

<style scoped>
.topo {
  width:400px;
}
</style>
