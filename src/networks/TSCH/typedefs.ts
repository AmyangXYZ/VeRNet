// all types and enums here

import type { INIT_MSG_PAYLOAD, NodeMeta } from '../common'

export interface TSCHNodeMeta extends NodeMeta {
  joined: boolean
  parent: number
  queueLen: number
  rank: number
}

export interface ScheduleConfig {
  num_slots: number
  num_channels: number
  beacon_period: number // every {} slotframes
  beacon_channel: number
  num_shared_slots: number
  shared_channel: number
}

// basic unit of the communication schedule
export interface Cell {
  type: number
  slot: number
  ch: number
  mac_src: number
  mac_dst: number
}

export enum CELL_TYPES {
  SHARED,
  MGMT,
  DATA
}

export interface TSCH_INIT_MSG_PAYLOAD extends INIT_MSG_PAYLOAD {
  sch_config: ScheduleConfig
}

export enum TSCH_PKT_TYPE {
  ACK,
  BEACON,
  ASSOC_REQ,
  ASSOC_RSP,
  SCH_UPDATE,
  DATA
}

export interface BEACON_PKT_PAYLOAD {
  pan_id: number
  rank: number
}

export interface ASSOC_REQ_PKT_PAYLOAD {
  id: number
  parent: number
}

export interface ASSOC_RSP_PKT_PAYLOAD {
  permit: boolean
  id: number
  parent: number
  cell_list: Cell[]
}
