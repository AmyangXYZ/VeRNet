<script setup lang="ts">
import { watch } from 'vue'
import { Network, SignalShowSettings } from '@/hooks/useStates'

watch(
  [Network.Config],
  () => {
    Network.Reset()
  },
  { deep: true }
)
</script>

<template>
  <el-card class="card" v-show="SignalShowSettings">
    <!-- <el-row class="form-row">
      <el-col :span="12" class="label-col">
        <img src="../assets/settings-toporand.png" class="icon" />
        <span class="label">Topo Rand Seed</span>
      </el-col>
      <el-col :span="12">
        <el-input-number v-model="Network.Config.value.seed" class="input-number" />
      </el-col>
    </el-row>

    <el-row class="form-row">
      <el-col :span="12" class="label-col">
        <img src="../assets/settings-numnode.png" class="icon" />
        <span class="label">Num Nodes</span>
      </el-col>
      <el-col :span="12">
        <el-input-number
          v-model="Network.Config.value.num_nodes"
          :min="1"
          :max="200"
          class="input-number"
        />
      </el-col>
    </el-row>

    <el-row class="form-row">
      <el-col :span="12" class="label-col">
        <img src="../assets/settings-trange.png" class="icon" />
        <span class="label">Transmission Range</span>
      </el-col>
      <el-col :span="12">
        <el-input-number
          v-model="Network.Config.value.tx_range"
          :min="1"
          :max="40"
          class="input-number"
        />
      </el-col>
    </el-row>

    <el-row class="form-row">
      <el-col :span="12" class="label-col">
        <img src="../assets/settings-numslot.png" class="icon" />
        <span class="label">Num Slots</span>
      </el-col>
      <el-col :span="12">
        <el-input-number
          v-model="Network.SchConfig.value.num_slots"
          :min="1"
          :max="200"
          class="input-number"
        />
      </el-col>
    </el-row>

    <el-row class="form-row">
      <el-col :span="12" class="label-col">
        <img src="../assets/settings-numchannel.png" class="icon" />
        <span class="label">Num Channels</span>
      </el-col>
      <el-col :span="12">
        <el-input-number
          v-model="Network.SchConfig.value.num_channels"
          :min="1"
          :max="64"
          class="input-number"
        />
      </el-col>
    </el-row> -->
  </el-card>
</template>

<style scoped>
.card {
  background-color: rgba(0, 0, 0, 0.66);
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.form-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}
.label-col {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.label {
  margin-right: 10px;
  white-space: nowrap;
}
.icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  filter: brightness(0) invert(1);
}
.input-number {
  margin-left: 10px;
}
</style>
