// global states, variables and configs

import { ref, reactive } from 'vue'
import type { Node, Packet } from './typedefs'

import type { TopologyConfig, ScheduleConfig } from './typedefs'

export const SchConfig = reactive<ScheduleConfig>({
  num_slots: 100,
  num_channels: 8,
  num_shared_slots: 10
})

export const TopoConfig = reactive<TopologyConfig>({
  seed: 124,
  num_nodes: 5,
  grid_x: 32,
  grid_y: 32,
  tx_range: 20
})

export const Nodes = ref<Node[]>([])
export const ASN = ref<number>(0)
export const Packets = ref<Packet[]>([])
