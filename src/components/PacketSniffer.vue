<script setup lang="ts">
import ChannelChart from '@/components/ChannelChart.vue'

import { ref, watch, nextTick } from 'vue'
import { Packets } from '@/hooks/useStates'
import { type Packet, PKT_TYPE } from '@/hooks/typedefs'

import { Filter } from '@element-plus/icons-vue'
const filter = ref()

const tableRef = ref()
watch(
  Packets,
  () => {
    nextTick(() => {
      tableRef.value?.scrollToRow(Packets.value.length)
    })
  },
  { deep: true }
)

const columns: any = [
  {
    key: 'id',
    title: 'No.',
    dataKey: 'id',
    width: 60,
    align: 'center',
    cellRenderer: ({ cellData: id }: any) => id+1
  },
  // {
  //   key: 'time',
  //   title: 'TIME',
  //   dataKey: 'time',
  //   width: 100,
  //   align: 'center',
  //   cellRenderer: ({ cellData: time }: any) =>
  //     new Date(time - new Date(time).getTimezoneOffset() * 60 * 1000)
  //       .toISOString()
  //       .substring(11, 23)
  //       .replace('T', ' ')
  // },
  {
    key: 'asn',
    title: 'ASN',
    dataKey: 'asn',
    width: 60,
    align: 'center'
  },
  {
    key: 'ch',
    title: 'CH',
    dataKey: 'ch',
    width: 60,
    align: 'center'
  },
  {
    key: 'uid',
    title: 'UID',
    dataKey: 'uid',
    width: 80,
    align: 'center',
    cellRenderer: ({ cellData: uid }: any) => '0x' + uid.toString(16).toUpperCase().padStart(4, '0')
  },
  {
    key: 'type',
    title: 'TYPE',
    dataKey: 'type',
    width: 100,
    align: 'center',
    cellRenderer: ({ cellData: type }: any) => PKT_TYPE[type]
  },
  {
    key: 'src',
    title: 'SRC',
    dataKey: 'src',
    width: 60,
    align: 'center'
  },
  {
    key: 'dst',
    title: 'DST',
    dataKey: 'dst',
    width: 60,
    align: 'center'
  },
  {
    key: 'seq',
    title: 'SEQ',
    dataKey: 'seq',
    width: 60,
    align: 'center'
  },
  {
    key: 'len',
    title: 'LEN',
    dataKey: 'len',
    width: 60,
    align: 'center'
  },
  {
    key: 'payload',
    title: 'PAYLOAD',
    dataKey: 'payload',
    width: 60,
    align: 'center',
    cellRenderer: () => '...'
  }
]
const Row = ({ cells, rowData }: any) => {
  if (rowData.payload_detail) return rowData.payload_detail
  return cells
}
</script>

<template>
  <el-card class="card">
    <template #header>
      <div class="card-header">
        Packets
        <el-input
          v-model="filter"
          class="filter-input"
          placeholder="src == 1 && type != ACK"
          :suffix-icon="Filter"
        />
      </div>
    </template>
    <el-auto-resizer>
      <template #default="{ width }">
        <el-table-v2
          ref="tableRef"
          class="table"
          :columns="columns"
          :data="Packets"
          :width="width"
          :height="280"
          :expand-column-key="columns[9].key"
          :estimated-row-height="18"
        >
          <template #row="props">
            <Row v-bind="props" />
          </template>
        </el-table-v2>
      </template>
    </el-auto-resizer>
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
}
.table {
  font-size: 0.8rem;
  font-family: Menlo;
  text-align: center;
}
</style>
