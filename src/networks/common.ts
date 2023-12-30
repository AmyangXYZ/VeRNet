import { ref, type Ref } from 'vue'
import { SeededRandom } from '@/utils/rand'
import { KDTree } from '@/utils/kdtree'

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

export class Network {
  ID: number
  Type: number
  Nodes = ref<NodeMeta[]>([]) // nodes and endsystems, for visualization
  NetworkDevices: any // tsn bridges, tsch relay or 5g ue/bs
  EndSystems = ref<NodeMeta[]>([])
  Links = ref<{ [uid: number]: LinkMeta }>([])
  Flows = ref<FlowMeta[]>([])
  TopoConfig: Ref<TopologyConfig>
  KDTree: KDTree
  SchConfig: any
  Schedule: any
  Packets = ref<Packet[]>([])
  ASN = ref(0)
  asnTimer: any
  PacketsCurrent = ref<Packet[]>([])

  SignalReset = ref(0)
  SlotDone = ref(false)
  Running = ref(false)
  SlotDuration = ref(750)

  Rand: SeededRandom

  constructor() {
    this.ID = 1
    this.Type = -1
    this.TopoConfig = ref<TopologyConfig>({
      seed: 1,
      num_nodes: 10,
      num_es: 1,
      grid_size: 80,
      tx_range: 25
    })
    this.Rand = new SeededRandom(this.TopoConfig.value.seed)
    this.Nodes.value.push(<NodeMeta>{}) // placeholder
    this.KDTree = new KDTree()
  }

  addLink(v1: number, v2: number, type: number) {
    if (v1 > v2) {
      ;[v1, v2] = [v2, v1]
    }
    // Cantor pairing
    const uid = 0.5 * (v1 + v2) * (v1 + v2 + 1) + v2
    if (this.Links.value[uid] == undefined) {
      this.Links.value[uid] = <LinkMeta>{ uid, v1, v2, type }
    }
  }

  Run = () => {
    this.Step()
    this.Running.value = true
    this.asnTimer = setInterval(() => {
      this.ASN.value++
      this.SlotDone.value = false
    }, this.SlotDuration.value)
  }
  Step = () => {
    this.ASN.value++
    this.SlotDone.value = false
  }
  Pause = () => {
    this.Running.value = false
    clearInterval(this.asnTimer)
  }
  Reset = () => {
    this.Running.value = false
    clearInterval(this.asnTimer)
    this.SignalReset.value++
  }
}
