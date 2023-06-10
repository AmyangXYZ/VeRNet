// all types and enums here

export interface TopologyConfig {
  seed: number
  num_nodes: number
  grid_x: number
  grid_y: number
  tx_range: number
}

export interface Node {
  id: number
  pos: number[]
  joined: boolean
  neighbors: number[]
  w: any // a webworker
}

export interface ScheduleConfig {
  num_slots: number
  num_channels: number
  num_shared_slots: number
}

export interface Cell {
  type: number,
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
  payload: any
}

export enum MSG_TYPES {
  ASN,
  INIT,
  SEND,
  STAT,
  ASSOC_REQ
}

export interface MSG_ASN_PAYLOAD {
  asn: number
}

export interface MSG_INIT_PAYLOAD {
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
  time: number
  asn: number
  len: number
  payload: any

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

export interface PKT_BEACON_PAYLOAD {
  dodag_id: number
  rank: number
}

export interface ASSOC_REQ_PAYLOAD {
  id: number
  parent: number
}

export interface ASSOC_RSP_PAYLOAD {
  permit: boolean
  id: number
  parent: number
  schedule: Cell[]
}

export interface Statistics {
  pkt_seq: number
  rx_cnt: number
  tx_cnt: number
}
