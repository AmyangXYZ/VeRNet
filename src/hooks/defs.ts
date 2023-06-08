// all types and enums here

export interface TopoConfig {
  seed: number
  num_nodes: number
  grid_x: number
  grid_y: number
  tx_range: number
}

export interface Node {
  id: number
  pos: number[]
  neighbors: number[]
  w: any // a webworker
}

export interface ChannelConfig {
  num_channels: number
}

export interface Packet {
  uid: number
  type: number
  ch: number
  src: number
  dst: number
  seq: number
  time: number
  len: number
  payload: number[]
}

export enum PKT_TYPE {
  CMD,
  MGMT,
  DATA
}

export enum MGMT_TYPE {
  ASSOC_REQ,
  ASSOC_RESP,
  BEACON,
}

export enum CMD_TYPE {
  ASSIGN_ID,
  BEACON,
  NEIGHBOR,
  SEND,
  STAT
}

export interface Statistics {
  rx_cnt: number
  tx_cnt: number
}
