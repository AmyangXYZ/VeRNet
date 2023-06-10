<script setup lang="ts">
import ChannelChart from '@/components/ChannelChart.vue'

import { ref, watch, nextTick } from 'vue'
import { Packets, SchConfig } from '@/hooks/useStates'
import { type Packet, PKT_TYPES } from '@/hooks/typedefs'

import { Filter } from '@element-plus/icons-vue'
const filterRules = ref()

function filterFunc(pkt: Packet) {
  if (filterRules.value == null) return true
  return eval(filterRules.value)
}

const tableRef = ref()
watch(
  Packets,
  () => {
    if (Packets.value.length > 0) {
      nextTick(() => {
        tableRef.value?.scrollToRow(Packets.value.length)
      })
    }
  },
  { deep: true }
)

const columns: any = [
  {
    key: 'id',
    title: 'No.',
    dataKey: 'id',
    width: 50,
    align: 'center',
    cellRenderer: ({ cellData: id }: any) => id + 1
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
    width: 50,
    align: 'center'
  },
  {
    key: 'asn',
    title: 'SLOT',
    dataKey: 'asn',
    width: 50,
    align: 'center',
    cellRenderer: ({ cellData: asn }: any) => asn % SchConfig.num_slots
  },
  {
    key: 'ch',
    title: 'CH',
    dataKey: 'ch',
    width: 50,
    align: 'center'
  },
  {
    key: 'src',
    title: 'SRC',
    dataKey: 'src',
    width: 40,
    align: 'center'
  },
  {
    key: 'dst',
    title: 'DST',
    dataKey: 'dst',
    width: 40,
    align: 'center'
  },
  {
    key: 'uid',
    title: 'UID',
    dataKey: 'uid',
    width: 70,
    align: 'center',
    cellRenderer: ({ cellData: uid }: any) => '0x' + uid.toString(16).toUpperCase().padStart(4, '0')
  },
  {
    key: 'type',
    title: 'TYPE',
    dataKey: 'type',
    width: 90,
    align: 'center',
    cellRenderer: ({ cellData: type }: any) => PKT_TYPES[type]
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
          v-model="filterRules"
          class="filter-input"
          placeholder="pkt.src == 1 && pkt.type != ACK"
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
          :data="Packets.filter(filterFunc)"
          :width="width"
          :height="280"
          :expand-column-key="columns[10].key"
          :row-height="20"
          :header-height="28"
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
