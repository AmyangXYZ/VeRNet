import type { INIT_MSG_PAYLOAD, NodeMeta } from '../common'

export interface ScheduleConfig {
  num_slots: number
}

export interface TSNNodeMeta extends NodeMeta {}

export enum TSN_PKT_TYPE {
  DATA
}

export interface TSN_INIT_MSG_PAYLOAD extends INIT_MSG_PAYLOAD {
  neighbors: number[]
  sch_config: ScheduleConfig
}
