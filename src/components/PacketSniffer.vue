<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Packets } from '@/hooks/useStates'
import { PKT_TYPE } from '@/hooks/defs'

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

const columns = ref<any[]>([
  {
    key: 'no',
    title: 'No.',
    dataKey: 'no',
    width: 50,
    align: 'center'
    // cellRenderer: ({ cellData: no }:any) => no,
  },
  {
    key: 'time',
    title: 'TIME',
    dataKey: 'time',
    width: 100,
    align: 'center',
    cellRenderer: ({ cellData: time }: any) =>
      new Date(time - new Date(time).getTimezoneOffset() * 60 * 1000)
        .toISOString()
        .substring(11, 23)
        .replace('T', ' ')
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
    width: 50,
    align: 'center',
    cellRenderer: ({ cellData: type }: any) => PKT_TYPE[type]
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
    key: 'seq',
    title: 'SEQ',
    dataKey: 'seq',
    width: 40,
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
    align: 'center'
  }
])
</script>

<template>
  <el-card class="card">
    <template #header> Packets </template>
    <el-auto-resizer>
      <template #default="{ width }">
        <el-table-v2
        class="table"
          stripe
          ref="tableRef"
          :columns="columns"
          :data="Packets"
          :width="width"
          :height="180"
          :row-height="18"
          :header-height="32"
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
.table {
  font-size: .8rem;
  font-family:  Menlo;
}
</style>
