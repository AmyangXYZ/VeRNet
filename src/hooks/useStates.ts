// global states, variables and configs

import { ref } from 'vue'
import type { Cell, Node, Packet, TopologyConfig, ScheduleConfig } from './useDefs'

export const Nodes = ref<Node[]>([])
// absolute slot number
export const ASN = ref<number>(0)
// indicate that all nodes have finished their actions of the current slot
export const SlotDone = ref(false)
// all packets, for display in table
export const Packets = ref<Packet[]>([])
// packets in the current slot, for animation
export const PacketsCurrent = ref<Packet[]>([])
// global schedule of controller's view
export const Schedule = ref<Cell[][]>([[]])
// node selected from the topology panel
export const SelectedNode = ref(1)
// reset the whole network, reconstruct topology and clear the charts
export const SignalReset = ref(0)
// real clock duration of each slot
export const SlotDuration = ref(500) // in ms

export const TopoConfig = ref<TopologyConfig>({
  seed: 9,
  num_nodes: 20,
  grid_x: 40,
  grid_y: 40,
  tx_range: 12
})

export const SchConfig = ref<ScheduleConfig>({
  num_slots: 40,
  num_channels: 8,
  beacon_channel: 1,
  beacon_period: 1,
  shared_channel: 2,
  num_shared_slots: 8
})
