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
  w: any // a webworker
  pos: number[]
  neighbors: number[]
}

export interface ChannelConfig {
  num_channels: number
}

export interface Packet {
  no: number // row number in table
  type: number
  cmd: number
  ch: number
  uid: number
  seq: number
  src: number
  dst: number
  len: number
  time: number
  payload: any
}

export interface Statistics {
  id: number
  neighbors: number[]
  pkt_seq: number
  rx_cnt: number
  tx_cnt: number
}

export enum PKT_TYPE {
  CMD,
  MGMT,
  DATA,
  STAT
}

export enum NODE_AXN {
  assign_id,
  beacon,
  send
}
