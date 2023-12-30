// global states, variables and configs

import { ref } from 'vue'
import { type Config } from '@/core/typedefs'

import { NetworkHub } from '@/core/network'
export const Network = new NetworkHub(<Config>{
  seed: 17,
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
export const SignalUpdateTopology = ref(0)
export const SelectedScenario = ref('') // added by Jack Medrek
