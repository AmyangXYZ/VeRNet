// enums are all captital and underscore, types are camel case

export interface Config {
  seed: number
  num_nodes: number
  grid_size: number
}

export enum NODE_TYPE {
  TSCH,
  TSN,
  FIVE_G_BS,
  FIVE_G_UE,
  END_SYSTEM
}

export interface Node {
  id: number
  type: number
  pos: [number, number]
  neighbors: number[]
  tx_cnt: number
  rx_cnt: number
  w: Worker | undefined
}

export interface Link {
  // undirected for visualization
  uid: number // cantor pairing, uid=0.5*(v1+v2)*(v1+v2+1)+v2
  v1: number
  v2: number
  type: number
}

export enum LINK_TYPE {
  WIRED,
  WIRELESS
}

export interface Flow {
  id: number
  e2e_src: number
  e2e_dst: number
  deadline: number
  period: number
  workload: number
}

// Packet is transfered among nodes, at data-link layer
export interface Packet {
  uid: number
  type: number
  e2e_src: number
  e2e_dst: number
  mac_src: number
  mac_dst: number
  seq: number
  asn: number
  len: number
  payload: any

  // for display on packet sniffer
  id: number
  children: any
}

export enum PKT_TYPE {
  DATA
}

export enum ADDR {
  BROADCAST = -1
}

// Message is used for direct communication (debug, cmd, stats) between nodes and controller
export interface Message {
  type: number
  id: number // node id
  payload: any
}

export enum MSG_TYPE {
  INIT,
  ASN,
  DONE, // finished all activities of the current slot
  FLOW, // install periodic flow
  STAT
}

export type MsgHandler = (msg: Message) => void
export type PktHandler = (pkt: Packet) => void

export interface InitMsgPayload {
  id: number
  neighbors: number[]
}
export interface ASNMsgPayload {
  asn: number
}
