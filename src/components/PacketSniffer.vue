<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Packets } from '@/hooks/useStates'

const tableRef = ref(null)
watch(
  Packets,
  () => {
    nextTick(() => {
      tableRef.value?.scrollToRow(Packets.value.length)
    })
  },
  { deep: true }
)

const columns = ref<any[]>([
  {
    key: 'no',
    title: 'No.',
    dataKey: 'no',
    width: 60,
    align: 'center'
    // cellRenderer: ({ cellData: uid }) => {uid},
  },
  {
    key: 'uid',
    title: 'UID',
    dataKey: 'uid',
    width: 80,
    align: 'center'
    // cellRenderer: ({ cellData: uid }) => {uid},
  },
  {
    key: 'time',
    title: 'TIME',
    dataKey: 'time',
    width: 140,
    align: 'center'
    // cellRenderer: ({ cellData: uid }) => {uid},
  },
  {
    key: 'type',
    title: 'TYPE',
    dataKey: 'type',
    width: 60,
    align: 'center'
    // cellRenderer: ({ cellData: name }) => <ElTag>{name}</ElTag>,
  },
  {
    key: 'src',
    title: 'SRC',
    dataKey: 'src',
    width: 60,
    align: 'center'
    // cellRenderer: ({ cellData: name }) => <ElTag>{name}</ElTag>,
  },
  {
    key: 'dst',
    title: 'DST',
    dataKey: 'dst',
    width: 60,
    align: 'center'
    // cellRenderer: ({ cellData: name }) => <ElTag>{name}</ElTag>,
  },
  {
    key: 'seq',
    title: 'SEQ',
    dataKey: 'seq',
    width: 60,
    align: 'center'
    // cellRenderer: ({ cellData: name }) => <ElTag>{name}</ElTag>,
  },
  {
    key: 'len',
    title: 'LEN',
    dataKey: 'len',
    width: 60,
    align: 'center'
    // cellRenderer: ({ cellData: name }) => <ElTag>{name}</ElTag>,
  },
  {
    key: 'payload',
    title: 'PAYLOAD',
    dataKey: 'payload',
    width: 60,
    align: 'center'
    // cellRenderer: ({ cellData: name }) => <ElTag>{name}</ElTag>,
  }
])
</script>

<template>
  <el-card class="card">
    <template #header> Packets </template>
    <el-auto-resizer>
      <template #default="{ width }">
        <el-table-v2
          stripe
          ref="tableRef"
          :columns="columns"
          :data="Packets"
          :width="width"
          :height="400"
          :row-height="24"
          fixed
        />
      </template>
    </el-auto-resizer>
  </el-card>
</template>

<style scoped>
.card {
  width: 100%;
}
</style>
