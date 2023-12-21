import { ref, type Ref } from 'vue'

export class Network {
  id: number
  Nodes: any
  EndSystems: any
  TopoConfig: Ref<TopologyConfig>
  SchConfig: any
  Schedule: any
  Packets = ref<Packet[]>([])
  ASN = ref(0)

  PacketsCurrent = ref<Packet[]>([])
  SignalReset = ref(0)
  SlotDone = ref(true)
  Running = ref(false)
  SlotDuration = ref(1000)
  constructor() {
    this.id = 1
    this.TopoConfig = ref<TopologyConfig>({
      seed: 1,
      num_nodes: 10,
      num_es: 4,
      grid_size: 80,
      tx_range: 25
    })
    this.createEndSystems()
  }
  createEndSystems = () => {}
}

export enum NODE_TYPE {
  FiveGTower,
  TSCH,
  TSN,
  ES
}

export interface NodeMeta {
  id: number
  type: number
  pos: number[]
  neighbors: number[]
  tx_cnt: number
  rx_cnt: number
  w: Worker | undefined
}

export enum END_SYSTEM_TYPE {
  Server,
  RoboticArm,
  Sensor
  // add more and find the corresponding 3D models
}

export interface EndSystemMeta {
  id: number
  type: number
  pos: number[]
  neighbor: number // an es only connects with one network node/switch/base-station
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

// Message is used for direct communication (debug, cmd, stats) between nodes and controller
export interface Message {
  type: number
  src: number
  dst: number
  payload: any
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
