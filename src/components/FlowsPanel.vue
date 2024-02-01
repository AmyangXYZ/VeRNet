<script setup lang="tsx">
import { ref, watch, nextTick } from 'vue'
import { Network } from '@/hooks/useStates'
import { Check, Close, Edit, Plus } from '@element-plus/icons-vue'
const editCellRenderer =
  () =>
  ({ column, rowData }: any) => {
    if (rowData.editing) {
      return (
        <input
          style="
            font-size:.65rem;
            color:white;
            text-align:center;
            background:transparent;
            font-family: Menlo;
          "
          v-model={rowData[column.dataKey!]}
          placeholder=""
        />
      )
    } else {
      return <div>{rowData[column.dataKey!]}</div>
    }
  }

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
    align: 'center',
    cellRenderer: editCellRenderer()
  },
  {
    key: 'dst',
    title: 'DST',
    dataKey: 'e2e_dst',
    width: 40,
    align: 'center',
    cellRenderer: editCellRenderer()
  },
  {
    key: 'period',
    title: 'PERIOD',
    dataKey: 'period',
    width: 40,
    align: 'center',
    cellRenderer: editCellRenderer()
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
    cellRenderer: editCellRenderer()
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

const editing = ref(false)
watch(editing, () => {
  if (editing.value == true) {
    for (const f of Network.Flows.value) {
      f.editing = true
    }
  } else {
    for (const f of Network.Flows.value) {
      f.editing = false
    }
  }
})

const addFlow = () => {
  const newFlow = {
    id: Network.Flows.value.length + 1,
    e2e_src: 0,
    e2e_dst: 0,
    deadline: 0,
    workload: 0,
    period: 0,
    path: [],
    editing: true
  }
  Network.Flows.value.push(newFlow)
  // console.log('added flow')
}

// shall support adding multiple flows
const saveFlow = () => {
  editing.value = false
  const lastFlow = Network.Flows.value[Network.Flows.value.length - 1]
  lastFlow.path = Network.findPath(lastFlow.e2e_src, lastFlow.e2e_dst)
  console.log(lastFlow.path)
  lastFlow.editing = false
}

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
        Flows
        <el-button :icon="Edit" circle size="small" v-if="!editing" @click="editing = !editing"></el-button>
        <el-button-group v-if="editing">
          <el-button :icon="Plus" circle size="small" @click="addFlow"></el-button>
          <el-button :icon="Check" circle size="small" @click="saveFlow"></el-button>
          <el-button :icon="Close" circle size="small" @click="editing = !editing"></el-button>
        </el-button-group>
      </div>
    </template>

    <el-table-v2
      ref="tableRef"
      class="table"
      :columns="columns"
      :data="Network.Flows.value"
      :width="360"
      :height="180"
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
