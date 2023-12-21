// global states, variables and configs

import { ref } from 'vue'

import { TSCHNetwork } from '@/networks/TSCH/network'
export const Network = new TSCHNetwork()

// import { TSNNetwork } from '@/networks/TSN/network'
// export const Network = new TSNNetwork()

export const SelectedNode = ref(1)
export const MiniMapMode = ref('scatter')
export const SignalResetCamera = ref(1)
export const SignalShowScenarios = ref(false)
export const SignalShowSettings = ref(false)
export const SignalShowSchedule = ref(false)
export const SignalShowStatistics = ref(false)
export const SignalEditTopology = ref(false)
export const SelectedScenario = ref('') // added by Jack Medrek
