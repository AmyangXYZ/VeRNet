<script setup lang="tsx">
import { ref, watch, nextTick } from 'vue'
import { Network } from '@/hooks/useStates'
import { PKT_TYPE, type Packet } from '@/core/typedefs'

import { Filter } from '@element-plus/icons-vue'

const filterRules = ref()

function filterFunc(pkt: Packet): boolean {
  if (filterRules.value == undefined) return true
  try {
    return eval(filterRules.value)
  } catch (error) {
    return pkt != undefined
  }
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
    key: 'mac_src',
    title: 'SRC',
    dataKey: 'mac_src',
    width: 30,
    align: 'center'
  },
  {
    key: 'mac_dst',
    title: 'DST',
    dataKey: 'mac_dst',
    width: 30,
    align: 'center'
  },
  {
    key: 'protocol',
    title: 'PROTOCOL',
    dataKey: 'protocol',
    width: 70,
    align: 'center',
    cellRenderer: ({ cellData: protocol }: any) => protocol
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
    width: 50,
    align: 'center',
    cellRenderer: ({ cellData: type }: any) => PKT_TYPE[type]
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
          placeholder="pkt.mac_src == 1 && pkt.type != ACK"
          :suffix-icon="Filter"
        />
      </div>
    </template>

    <el-table-v2
      ref="tableRef"
      class="table"
      :columns="columns"
      :data="Network.Packets.value.filter(filterFunc)"
      :width="370"
      :height="370"
      :expand-column-key="columns[7].key"
      :estimated-row-height="16"
      :header-height="18"
    >
      <template #row="props">
        <Row v-bind="props" />
      </template>
    </el-table-v2>
    <!-- <ChannelChart /> -->
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
