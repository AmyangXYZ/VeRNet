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

export const SignalReset = ref(0)

// when auto inc ASN
export const SlotDuration = ref(250) // in ms

export const TopoConfig = reactive<TopologyConfig>({
  seed: 5,
  num_nodes: 20,
  grid_x: 40,
  grid_y: 40,
  tx_range: 16
})

export const SchConfig = reactive<ScheduleConfig>({
  num_slots: 32,
  num_channels: 8,
  beacon_channel: 1,
  beacon_period: 1,
  shared_channel: 2,
  num_shared_slots: 11
})

export const Schedule = ref<Cell[][]>([[]])

export const SelectedNode = ref(0)
