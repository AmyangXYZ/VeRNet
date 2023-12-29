<script setup lang="tsx">
import { ref, watch, nextTick } from 'vue'
import { Network } from '@/hooks/useStates'

// const columns: any = [
//   {
//     key: 'id',
//     title: 'No.',
//     dataKey: 'id',
//     width: 40,
//     align: 'center',
//     cellRenderer: ({ rowIndex }: any) => rowIndex + 1
//   },
//   {
//     key: 'asn',
//     title: 'ASN',
//     dataKey: 'asn',
//     width: 40,
//     align: 'center'
//   },
//   {
//     key: 'ch',
//     title: 'CH',
//     dataKey: 'ch',
//     width: 30,
//     align: 'center'
//   },
//   {
//     key: 'src',
//     title: 'SRC',
//     dataKey: 'src',
//     width: 30,
//     align: 'center'
//   },
//   {
//     key: 'dst',
//     title: 'DST',
//     dataKey: 'dst',
//     width: 30,
//     align: 'center'
//   },
//   {
//     key: 'uid',
//     title: 'UID',
//     dataKey: 'uid',
//     width: 60,
//     align: 'center',
//     cellRenderer: ({ cellData: uid }: any) => '0x' + uid.toString(16).toUpperCase().padStart(4, '0')
//   },
//   {
//     key: 'type',
//     title: 'TYPE',
//     dataKey: 'type',
//     width: 80,
//     align: 'center',
//     cellRenderer: ({ cellData: type }: any) => {}
//   },
//   // {
//   //   key: 'seq',
//   //   title: 'SEQ',
//   //   dataKey: 'seq',
//   //   width: 40,
//   //   align: 'center'
//   // },
//   {
//     key: 'len',
//     title: 'LEN',
//     dataKey: 'len',
//     width: 60,
//     align: 'center'
//   }
// ]

const columns: any = [
  {
    key: 'flow_id',
    title: 'Flow ID',
    dataKey: 'flow_id',
    width: 60,
    align: 'center',
    cellRenderer: ({ rowIndex }: any) => rowIndex + 1
  },
  {
    key: 'src',
    title: 'Source',
    dataKey: 'src',
    width: 40,
    align: 'center'
  },
  {
    key: 'dst',
    title: 'Dest',
    dataKey: 'dst',
    width: 40,
    align: 'center'
  },
  {
    key: 'deadline',
    title: 'Deadline',
    dataKey: 'deadline',
    width: 50,
    align: 'center'
  },
  {
    key: 'period',
    title: 'Period',
    dataKey: 'period',
    width: 60,
    align: 'center'
  },
  {
    key: 'payload_size',
    title: 'Payload Size',
    dataKey: 'payload_size',
    width: 100,
    align: 'center',
    cellRenderer: ({ cellData: payload_size }: any) => payload_size.toString()
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
      <div class="card-header">Flows</div>
    </template>

    <el-table-v2
      ref="tableRef"
      class="table"
      :columns="columns"
      :data="Network.Packets.value"
      :width="360"
      :height="180"
      :expand-column-key="columns[5].key"
      :estimated-row-height="16"
      :header-height="18"
    >
      <template #row="props">
        <Row v-bind="props" />
      </template>
    </el-table-v2>
  </el-card>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
