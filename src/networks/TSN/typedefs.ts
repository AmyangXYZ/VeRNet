import type { NodeMeta } from '../common'

export interface ScheduleConfig {
  num_slots: number
}

export interface TSNNodeMeta extends NodeMeta {}


export enum MSG_TYPES {
  INIT,
  ASN,
  DONE, // finished all activities of the current slot
  STAT,
}

export interface INIT_MSG_PAYLOAD {
  id: number
  pos: number[]
  neighbors:[],
  sch_config: ScheduleConfig
}


export enum PKT_TYPES {
  DATA
}