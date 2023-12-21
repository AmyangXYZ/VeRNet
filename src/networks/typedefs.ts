import { ref, type Ref } from 'vue'

export class Network {
  id: any
  Nodes: any
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
      seed: 9,
      num_nodes: 20,
      grid_size: 80,
      tx_range: 25
    })
  }
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

export enum NODE_TYPE {
  FiveGTower,
  TSCH,
  TSN,
  EndSystem
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
  grid_size: number
  tx_range: number
}
