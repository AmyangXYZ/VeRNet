// all types and enums here

import type { NodeMeta } from '../typedef'

export interface TopologyConfig {
  seed: number
  num_nodes: number
  grid_x: number
  grid_y: number
  tx_range: number
}

export type MsgHandler = (msg: Message) => void
export type PktHandler = (pkt: Packet) => void

export interface TSCHNodeMeta extends NodeMeta {
  joined: boolean
  parent: number
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

// Message is used for direct communication (debug, cmd, stats) between nodes and controller
export interface Message {
  type: number
  src: number
  dst: number
  payload: any
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

// Packet is transfered among nodes, at data-link layer
export interface Packet {
  uid: number
  type: number
  ch: number
  src: number
  dst: number
  seq: number
  asn: number
  len: number
  payload: any

  // callback function when the packet is successfully tranmistted
  // (received ack)
  callback: () => void | undefined

  // for display on packet sniffer
  id: number
  children: any
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
