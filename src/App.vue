<script setup lang="ts">
import Header from './components/PageHeader.vue'
import SideBar from './components/SideBar.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <el-container>
    <el-header>
      <Header />
    </el-header>
    <el-container>
      <el-aside width="200px"><SideBar /></el-aside>
      <el-container>
        <el-main><RouterView /></el-main>
        <el-footer>Footer</el-footer>
      </el-container>
    </el-container>
  </el-container>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}
</style>
