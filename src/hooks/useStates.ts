// global states and configs

import { ref, reactive } from 'vue'
import type { Packet } from './typedefs'

import type { TopologyConfig, ScheduleConfig } from './typedefs'

export const SchConfig: ScheduleConfig = {
  num_slots: 100,
  num_channels: 8,
  num_shared_slots: 10
}

export const TopoConfig = reactive<TopologyConfig>({
  seed: 123,
  num_nodes: 20,
  grid_x: 32,
  grid_y: 32,
  tx_range: 10
})

export const ASN = ref<number>(0)
export const Packets = ref<Packet[]>([])
