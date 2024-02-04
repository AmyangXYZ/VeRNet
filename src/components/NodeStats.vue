<script setup lang="ts">
import sensortag from '@/assets/sensortag.png'
import tsn_switch from '@/assets/tsn_switch.png'
import five_g_gnb from '@/assets/five_g_gnb.png'
import { Network } from '@/hooks/useStates'
import { NODE_TYPE, NODE_TYPE_DISPLAY_NAME } from '@/core/typedefs'
import { Picture } from '@element-plus/icons-vue'

const avatars: { [type: number]: string } = {
  [NODE_TYPE.TSCH]: sensortag,
  [NODE_TYPE.TSN]: tsn_switch,
  [NODE_TYPE.FIVE_G_GNB]: five_g_gnb
}
</script>

<template>
  <el-card class="card" v-if="Network.StatsPublisherNode.value > 0 && Network.NodeStats.value != undefined">
    <el-row :gutter="30">
      <el-col :span="12" align="center">
        <el-image class="avatar" :src="avatars[Network.Nodes.value[Network.StatsPublisherNode.value].type]">
          <template #error>
            <div class="avatar">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
      </el-col>
      <el-col :span="12">
        <span class="stats">
          {{ NODE_TYPE_DISPLAY_NAME[Network.Nodes.value[Network.StatsPublisherNode.value].type] }}-{{
            Network.StatsPublisherNode.value
          }}
        </span>
        <br />
        - TX: {{ Network.NodeStats.value.tx_cnt }} , RX: {{ Network.NodeStats.value.rx_cnt }}<br />
        - Queue length: {{ Network.NodeStats.value.queue_len }} <br />
        - Queue head:
        {{
          Network.NodeStats.value.queue_head != undefined
            ? 'Pkt 0x' + Network.NodeStats.value.queue_head.toString(16).toUpperCase().padStart(4, '0')
            : undefined
        }}
        <br />
      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
.card {
  /* margin-top: 2px; */
  height: 130px;

  font-size: 0.82rem;
}
.avatar {
  height: 110px;
  font-size: 36px;
}
.stats {
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
