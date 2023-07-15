// global states, variables and configs

import { ref } from 'vue'
// individual network
import { TSCHNetwork } from '@/networks/TSCH/network'

// import { CompositeNetworks } from '@/networks/networks'

export const Network = new TSCHNetwork()
// export const Networks = new CompositeNetworks()
export const SelectedNode = ref(1)
export const MiniMapMode = ref('scatter')
export const SignalResetCamera = ref(1)
export const SignalShowSettings = ref(false)
export const SignalShowSchedule = ref(false)
export const SignalShowStatistics = ref(false)
export const SignalEditTopology = ref(false)
