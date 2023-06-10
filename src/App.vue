<script setup lang="ts">
import Header from './components/PageHeader.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <el-container>
    <el-header>
      <Header />
    </el-header>
    <RouterView />
    
  </el-container>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}
</style>
