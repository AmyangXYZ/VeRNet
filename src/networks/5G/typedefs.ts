import type { NodeMeta } from '../common'

export interface ScheduleConfig {
  num_slots: number
}

export interface FiveGNodeMeta extends NodeMeta {}

export enum FIVE_G_PKT_TYPE {
  ACK,
  DATA
}
