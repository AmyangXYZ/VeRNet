// global states and configs

import { ref, reactive } from 'vue'
import type { Packet } from './defs'

import type { TopologyConfig, ScheduleConfig } from './defs'

export const SchConfig: ScheduleConfig = {
  num_slots: 20,
  num_channels: 8,
  num_shared_slots: 4
}

export const TopoConfig = reactive<TopologyConfig>({
  seed: 123,
  num_nodes: 50,
  grid_x: 32,
  grid_y: 32,
  tx_range: 10
})

export const ASN = ref<number>(0)
export const Packets = ref<Packet[]>([])
