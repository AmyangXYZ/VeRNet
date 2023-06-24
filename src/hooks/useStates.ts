// global states, variables and configs

import { ref } from 'vue'
import { TSCHNetwork } from '@/core/TSCH/network'

export const Network = new TSCHNetwork()
export const SelectedNode = ref(1)
