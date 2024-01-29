<script setup lang="tsx">
import { ref, watch, nextTick } from 'vue'
import { Network } from '@/hooks/useStates'

const columns: any = [
  {
    key: 'flow_id',
    title: 'ID',
    dataKey: 'flow_id',
    width: 40,
    align: 'center',
    cellRenderer: ({ rowIndex }: any) => rowIndex + 1
  },
  {
    key: 'src',
    title: 'SRC',
    dataKey: 'e2e_src',
    width: 40,
    align: 'center'
  },
  {
    key: 'dst',
    title: 'DST',
    dataKey: 'e2e_dst',
    width: 40,
    align: 'center'
  },
  // {
  //   key: 'deadline',
  //   title: 'Deadline',
  //   dataKey: 'deadline',
  //   width: 50,
  //   align: 'center'
  // },
  {
    key: 'period',
    title: 'PERIOD',
    dataKey: 'period',
    width: 40,
    align: 'center'
  },
  {
    key: 'path',
    title: 'PATH',
    dataKey: 'path',
    width: 120,
    align: 'center'
  },
  {
    key: 'workload',
    title: 'WORKLOAD',
    dataKey: 'workload',
    width: 50,
    align: 'center',
    // cellRenderer: ({ cellData: payload_size }: any) => payload_size.toString()
  }
]

const tableRef = ref()
watch(
  Network.Flows,
  () => {
    if (Network.Flows.value.length > 0) {
      nextTick(() => {
        tableRef.value?.scrollToRow(Network.Flows.value.length)
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
      :data="Network.Flows.value"
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
