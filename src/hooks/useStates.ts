// global states, variables and configs

import { ref } from 'vue'
import { type Config } from '@/core/typedefs'
import { NetworkHub } from '@/core/network'

export const FPS = ref(0)

export const Network = new NetworkHub(<Config>{
  seed: 11111,
  num_nodes: 20,
  grid_size: 80,
  tx_range: 20
})

export const MenubarSignals = {
  ShowSettings: ref(false),
  ShowSchedule: ref(false),
  ShowNetworkStats: ref(false),
  ShowTopoEditToolbox: ref(false),
  ResetCamera: ref(1)
}

export const TopoEditSignals = {
  AddNode: ref(0),
  UpdateLinks: ref(0)
}
