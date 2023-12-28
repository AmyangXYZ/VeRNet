// all types and enums here

import type { NodeMeta } from '../common'

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
  src: number
  dst: number
}

export enum CELL_TYPES {
  SHARED,
  MGMT,
  DATA
}

export enum MSG_TYPES {
  INIT,
  ASN,
  DONE, // finished all activities of the current slot
  SEND,
  STAT,
  ASSOC_REQ
}

export interface ASN_MSG_PAYLOAD {
  asn: number
}

export interface INIT_MSG_PAYLOAD {
  id: number
  pos: number[]
  sch_config: ScheduleConfig
}

export enum ADDR {
  CONTROLLER = 0,
  ROOT = 1,
  BROADCAST = -1,
  ANY = -2
}

export enum PKT_TYPES {
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
