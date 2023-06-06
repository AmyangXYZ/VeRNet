// all types and enums here

export interface TopoConfig {
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

export interface Packet {
  type: number
  act: number
  uid: number
  seq: number
  src: number
  dst: number
  channel: number
  payload: any
}

export interface Statistics {
  id: number
  neighbors: number[]
  rx_cnt: number
  tx_cnt: number
}

export enum PKT_TYPE {
  Action,
  Mgmt,
  Data,
  Stat
}

export enum NODE_AXN {
  assign_id,
  beacon,
  send
}
