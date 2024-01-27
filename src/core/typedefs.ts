// enums are all captital and underscore, types are camel case

export interface Config {
  seed: number
  num_nodes: number
  grid_size: number
  tx_range: number
}

export enum NODE_TYPE {
  TSCH,
  TSN,
  FIVE_G_GNB,
  FIVE_G_UE,
  END_SYSTEM_SERVER = 11,
  END_SYSTEM_SENSOR_CAMERA,
  END_SYSTEM_SENSOR_TEMP,
  END_SYSTEM_SENSOR_PRESSURE,
  END_SYSTEM_SENSOR_HUMIDITY,
  END_SYSTEM_ACTUATOR_ROBOTIC_ARM,
  END_SYSTEM_ACTUATOR_PNEUMATIC
}

export const NODE_TYPE_DISPLAY_NAME = <{ [name: string]: string }>{
  TSCH: 'TSCH Node',
  TSN: 'TSN Bridge',
  FIVE_G_GNB: '5G gNB',
  FIVE_G_UE: '5G UE',
  END_SYSTEM_SERVER: 'Edge Server',
  END_SYSTEM_SENSOR_CAMERA: 'Camera',
  END_SYSTEM_SENSOR_TEMP: 'Temperature Sensor',
  END_SYSTEM_SENSOR_PRESSURE: 'Pressure Sensor',
  END_SYSTEM_SENSOR_HUMIDITY: 'Humidity Sensor',
  END_SYSTEM_ACTUATOR_ROBOTIC_ARM: 'Robotic Arm',
  END_SYSTEM_ACTUATOR_PNEUMATIC: 'Pneumatic Actuator'
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
  path: number[] // id's of all nodes in path
}

// Packet is transfered among nodes, at data-link layer
export interface Packet {
  uid: number
  protocol: string
  type: number
  e2e_src: number
  e2e_dst: number
  mac_src: number
  mac_dst: number
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

export const PROTOCOL_TYPE = <{ [name: string]: string }>{
  TSCH: '802.15.4',
  TSN: '802.1',
  FIVE_G: '5G NR'
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

export interface RoutingGraph {
  [nodeId: number]: number[]
}