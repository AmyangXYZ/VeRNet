<script setup lang="ts"></script>

<template>
  <el-card>
    <el-steps :active="0" finish-status="success">
      <el-step title="Topology Formation" />
      <el-step title="Scheduling" />
      <el-step title="Data Collection" />
    </el-steps>

    <el-row>
      <el-col :offset="0" :span="11">
        <el-progress :text-inside="true" :stroke-width="20" :percentage="20" />
      </el-col>
    </el-row>
  </el-card>
</template>
