export enum NETWORK_TYPE {
  TSCH,
  TSN,
  FIVE_G
}

export enum NODE_TYPE {
  TSCH,
  TSN,
  FIVE_G_BS,
  FIVE_G_UE,
  SERVER,
  ROBOT,
  SENSOR
}

export interface NodeMeta {
  id: number
  type: number
  pos: [number, number]
  neighbors: number[]
  tx_cnt: number
  rx_cnt: number
  w: Worker | undefined
}

export interface LinkMeta {
  // undirected link for visualization
  uid: number
  v1: number
  v2: number
  type: number
}

export enum LINK_TYPE {
  WIRED,
  WIRELESS
}

export interface FlowMeta {
  id: number
  src: number
  dst: number
}

// Packet is transfered among nodes, at data-link layer
export interface Packet {
  uid: number
  type: number
  ch: number
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
  STAT,
  ASSOC_REQ
}

export interface INIT_MSG_PAYLOAD {
  id: number
}

export interface ASN_MSG_PAYLOAD {
  asn: number
}

export enum ADDR {
  CONTROLLER = 0,
  ROOT = 1,
  BROADCAST = -1,
  ANY = -2
}

export type MsgHandler = (msg: Message) => void
export type PktHandler = (pkt: Packet) => void

export interface TopologyConfig {
  seed: number
  num_nodes: number
  num_es: number
  grid_size: number
  tx_range: number
}
