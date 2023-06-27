<script setup lang="ts">
import { Network } from '@/hooks/useStates'
import VeRNetLogo from '@/assets/vernet-logo-icon.png'
import IconPlay from './icons/IconPlay.vue'
import IconPlusOne from './icons/IconPlusOne.vue'
import IconPause from './icons/IconPause.vue'
import IconReset from './icons/IconReset.vue'

import { onKeyStroke } from '@vueuse/core'

onKeyStroke('ArrowRight', () => {
  Network.Step()
})
</script>

<template>
  <div>
    <el-row justify="center">
      <el-col :span="6">
        <el-statistic title="ASN" :value="Network.ASN"> </el-statistic>
      </el-col>
      <el-col :span="8" style="margin-top: 3px">
        <a href="https://github.com/AmyangXYZ/VeRNet"><img height="48" :src="VeRNetLogo" /></a>
        <el-button-group class="btns">
          <el-button
            class="btn"
            :disabled="Network.Running.value"
            size="small"
            type="primary"
            @click="Network.Run"
          >
            <el-icon size="18">
              <IconPlay />
            </el-icon>
          </el-button>
          <el-button
            class="btn"
            :disabled="Network.Running.value"
            size="small"
            type="info"
            @click="Network.Step"
          >
            <el-icon size="18">
              <IconPlusOne />
            </el-icon>
          </el-button>
          <el-button
            class="btn"
            :disabled="!Network.Running.value"
            size="small"
            type="warning"
            @click="Network.Pause"
          >
            <el-icon size="18">
              <IconPause />
            </el-icon>
          </el-button>
          <el-button class="btn" size="small" type="danger" @click="Network.Reset">
            <el-icon size="16">
              <IconReset />
            </el-icon>
          </el-button>
        </el-button-group>
      </el-col>
      <el-col :span="6">
        <el-statistic title="Packets" :value="Network.Packets.value.length"> </el-statistic>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.btns {
  margin-top: -10px;
}
.el-col {
  text-align: center;
}
.btn {
  width: 24px;
  height: 18px;
  border-radius: 5px;
}
</style>
