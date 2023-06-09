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
  slot: number
  ch: number
  src: number
  dst: number
}

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

  // for display on table
  id: number
  children: any
}

export enum PKT_ADDR {
  CONTROLLER = 0,
  BROADCAST = -1,
  ANY = -2
}

export enum PKT_TYPES {
  ACK,

  // direct commands or stats between node and controller
  CMD_ASN,
  CMD_INIT,
  CMD_RUN,
  CMD_SEND,
  CMD_STAT,

  // management
  BEACON,
  ASSOC_REQ,
  ASSOC_RSP,

  DATA
}

export interface CMD_ASN_PAYLOAD {
  asn: number
}

export interface CMD_INIT_PAYLOAD {
  id: number
  pos: number[]
  sch_config: ScheduleConfig
}

// export interface CMD_RUN_PAYLOAD extends CMD_PAYLOAD {}

export interface CMD_RUN_PAYLOAD {}

export interface BEACON_PAYLOAD {
  dodag_id: number
  rank: number
}

export interface ASSOC_REQ_PAYLOAD {
  id: number
  parent: number
}

export interface ASSOC_RSP_PAYLOAD {
  id: number
  schedule: Cell[]
}

export interface Statistics {
  pkt_seq: number
  rx_cnt: number
  tx_cnt: number
}
