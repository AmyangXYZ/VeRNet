<script setup lang="tsx">
import ChannelChart from '@/components/ChannelChart.vue'

import { ref, watch, nextTick } from 'vue'
import { Network } from '@/hooks/useStates'
import type { Packet } from '@/networks/typedefs'
import { PKT_TYPES } from '@/networks/TSCH/typedefs'

import { Filter } from '@element-plus/icons-vue'
const filterRules = ref()

function filterFunc(pkt: Packet) {
  if (filterRules.value == undefined) return true
  return eval(filterRules.value)
}

const columns: any = [
  {
    key: 'id',
    title: 'No.',
    dataKey: 'id',
    width: 40,
    align: 'center',
    cellRenderer: ({ rowIndex }: any) => rowIndex + 1
  },
  {
    key: 'asn',
    title: 'ASN',
    dataKey: 'asn',
    width: 40,
    align: 'center'
  },
  {
    key: 'ch',
    title: 'CH',
    dataKey: 'ch',
    width: 30,
    align: 'center'
  },
  {
    key: 'src',
    title: 'SRC',
    dataKey: 'src',
    width: 30,
    align: 'center'
  },
  {
    key: 'dst',
    title: 'DST',
    dataKey: 'dst',
    width: 30,
    align: 'center'
  },
  {
    key: 'uid',
    title: 'UID',
    dataKey: 'uid',
    width: 60,
    align: 'center',
    cellRenderer: ({ cellData: uid }: any) => '0x' + uid.toString(16).toUpperCase().padStart(4, '0')
  },
  {
    key: 'type',
    title: 'TYPE',
    dataKey: 'type',
    width: 80,
    align: 'center',
    cellRenderer: ({ cellData: type }: any) => PKT_TYPES[type]
  },
  // {
  //   key: 'seq',
  //   title: 'SEQ',
  //   dataKey: 'seq',
  //   width: 40,
  //   align: 'center'
  // },
  {
    key: 'len',
    title: 'LEN',
    dataKey: 'len',
    width: 60,
    align: 'center'
  }
]

const tableRef = ref()
watch(
  Network.Packets,
  () => {
    if (Network.Packets.value.length > 0) {
      nextTick(() => {
        tableRef.value?.scrollToRow(Network.Packets.value.length)
      })
    }
  },
  { deep: true }
)

const Row = ({ cells, rowData }: any) => {
  if (rowData.detail) return <div class="row-detail">{rowData.detail}</div>
  return cells
}
Row.inheritAttrs = false
</script>

<template>
  <el-card class="card">
    <template #header>
      <div class="card-header">
        Packets
        <el-input
          v-model="filterRules"
          class="filter-input"
          placeholder="pkt.src == 1 && pkt.type != ACK"
          :suffix-icon="Filter"
        />
      </div>
    </template>

    <el-table-v2
      ref="tableRef"
      class="table"
      :columns="columns"
      :data="Network.Packets.value.filter(filterFunc)"
      :width="360"
      :height="360"
      :expand-column-key="columns[7].key"
      :estimated-row-height="16"
      :header-height="18"
    >
      <template #row="props">
        <Row v-bind="props" />
      </template>
    </el-table-v2>
    <ChannelChart />
  </el-card>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-input {
  width: 240px;
  height: 24px;
  font-size: 0.7rem;
}
.table {
  font-size: 0.65rem;
  font-family: Menlo;
  text-align: center;
}

.row-detail {
  width: 100%;
  text-align: center;
}
</style>
@/networks/TSCH
@/networks/common