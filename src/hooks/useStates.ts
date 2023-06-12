// global states, variables and configs

import { ref, reactive } from 'vue'
import type { Cell, Node, Packet } from './typedefs'

import type { TopologyConfig, ScheduleConfig } from './typedefs'

export const Nodes = ref<Node[]>([])
export const ASN = ref<number>(0)
export const SlotDone = ref(false)
// all packets, for display in table
export const Packets = ref<Packet[]>([])
// packets in the current slot, for animation
export const PacketsCurrent = ref<Packet[]>([])

export const TopoConfig = reactive<TopologyConfig>({
  seed: 124,
  num_nodes: 20,
  grid_x: 32,
  grid_y: 32,
  tx_range: 10
})

export const SchConfig = reactive<ScheduleConfig>({
  num_slots: 50,
  num_channels: 8,
  num_shared_slots: 40
})

export const Schedule = ref<Cell[][]>([[]])
