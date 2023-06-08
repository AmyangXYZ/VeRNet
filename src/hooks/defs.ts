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
  payload: any
}

export enum PKT_TYPE {
  CMD_INIT,
  CMD_RUN,
  CMD_SEND,
  CMD_STAT,

  MGMT_DIO,
  MGMT_DAO,

  DATA
}

export interface CMD_INIT_PAYLOAD {
  id: number
  pos: number[]
}

// export interface CMD_RUN_PAYLOAD extends CMD_PAYLOAD {}

export interface CMD_RUN_PAYLOAD {}

export interface MGMT_DIO_PAYLOAD {
  dodag_id: number
  rank: number
}

export interface MGMT_DAO_PAYLOAD {}

export interface Statistics {
  pkt_seq: number
  rx_cnt: number
  tx_cnt: number
}
