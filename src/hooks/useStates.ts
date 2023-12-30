// global states, variables and configs

import { ref } from 'vue'
import { type Config } from '@/core/typedefs'
// import { TSCHNetwork } from '@/networks/TSCH/network'
// export const Network = new TSCHNetwork()

// import { TSNNetwork } from '@/networks/TSN/network'
// export const Network = new TSNNetwork()

// import { FiveGNetwork } from '@/networks/5G/network'
// export const Network = new FiveGNetwork()

import { NetworkHub } from '@/core/network'
export const Network = new NetworkHub(<Config>{
  seed: 123,
  num_nodes: 15,
  grid_size: 80
})

export const SelectedNode = ref(1)
export const MiniMapMode = ref('scatter')
export const SignalResetCamera = ref(1)
export const SignalShowScenarios = ref(false)
export const SignalShowSettings = ref(false)
export const SignalShowSchedule = ref(false)
export const SignalShowStatistics = ref(false)
export const SignalEditTopology = ref(false)
export const SelectedScenario = ref('') // added by Jack Medrek
